import type { Prisma } from "../generated/prisma/client.ts";
import { prisma } from "../lib/prisma.ts";
import type { CreateReportInput } from "../schema/report.schema.ts";

const reportSelect = {
	id: true,
	targetType: true,
	targetId: true,
	reason: true,
	message: true,
	status: true,
	createdAt: true,
	reporter: {
		select: {
			id: true,
			emri: true,
			mbiemri: true,
			email: true,
		},
	},
} satisfies Prisma.ReportSelect;

type ReportRecord = Prisma.ReportGetPayload<{
	select: typeof reportSelect;
}>;

type ReportWithCampaign = ReportRecord & {
	campaign: {
		id: number;
		title: string;
		category: { name: string } | null;
	} | null;
};

function buildReporterName(reporter: ReportRecord["reporter"]) {
	return `${reporter.emri} ${reporter.mbiemri}`.trim() || reporter.email;
}

async function decorateReports(reports: ReportRecord[]): Promise<ReportWithCampaign[]> {
	const campaignIds = reports
		.filter((report) => report.targetType === "campaign")
		.map((report) => report.targetId);

	const campaigns = campaignIds.length
		? await prisma.campaign.findMany({
			where: {
				id: { in: campaignIds },
			},
			select: {
				id: true,
				title: true,
				category: {
					select: {
						name: true,
					},
				},
			},
		})
		: [];

	const campaignMap = new Map(campaigns.map((campaign) => [campaign.id, campaign]));

	return reports.map((report) => ({
		...report,
		campaign: report.targetType === "campaign" ? campaignMap.get(report.targetId) ?? null : null,
	}));
}

export const reportService = {
	createReport: async (payload: CreateReportInput, reporterId: number) => {
		const campaign = await prisma.campaign.findUnique({
			where: { id: payload.targetId },
			select: { id: true },
		});

		if (!campaign) {
			throw new Error("Campaign not found");
		}

		const report = await prisma.report.create({
			data: {
				reporterId,
				targetType: payload.targetType,
				targetId: payload.targetId,
				reason: payload.reason.trim(),
				message: payload.message.trim(),
				status: "pending",
			},
			select: reportSelect,
		});

		return {
			...report,
			reporterName: buildReporterName(report.reporter),
			campaign: campaign,
		};
	},
	getAllReports: async () => {
		const reports = await prisma.report.findMany({
			select: reportSelect,
			orderBy: { createdAt: "desc" },
		});

		return decorateReports(reports).then((decoratedReports) =>
			decoratedReports.map((report) => ({
				...report,
				reporterName: buildReporterName(report.reporter),
			})),
		);
	},
};