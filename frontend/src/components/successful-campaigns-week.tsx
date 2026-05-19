import { useEffect, useState } from "react";
import { Link } from "react-router";
import { isAxiosError } from "axios";
import { Badge } from "@/components/ui/badge";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
import { apiClient } from "@/lib/api";

type ApiCampaign = {
	id: number;
	title: string;
	goalAmount: number;
	currentAmount: number;
	coverImage: string | null;
	createdAt: string;
	status: "draft" | "pending" | "active" | "funded" | "failed";
	category: { name: string } | null;
	transactions?: Array<{
		amount: number;
		createdAt: string;
	}>;
};

type CampaignListResponse = {
	campaigns: unknown;
};

type ShowcaseItem = {
	id: number;
	title: string;
	totalRaised: number;
	header: React.ReactNode;
	className: string;
};

function normalizeCampaigns(input: unknown): ApiCampaign[] {
	const source = Array.isArray(input)
		? input
		: input && typeof input === "object" && "campaigns" in input
			? (input as CampaignListResponse).campaigns
			: [];

	if (!Array.isArray(source)) return [];
	return source.filter((item): item is ApiCampaign => Boolean(item && typeof item === "object"));
}

function formatEuro(amount: number) {
	return new Intl.NumberFormat("sq-AL", {
		style: "currency",
		currency: "EUR",
		maximumFractionDigits: 0,
	}).format(amount);
}

function clampPercent(value: number) {
	if (!Number.isFinite(value)) return 0;
	return Math.max(0, Math.min(100, value));
}

function getWeeklyRaisedTotal(campaign: ApiCampaign) {
	const now = Date.now();
	const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;

	return (campaign.transactions ?? []).reduce((sum, transaction) => {
		const createdAt = new Date(transaction.createdAt).getTime();
		if (!Number.isFinite(createdAt) || createdAt < oneWeekAgo) {
			return sum;
		}

		return sum + transaction.amount;
	}, 0);
}

function campaignCoverFallback(category: string, title: string) {
	const palette: Record<string, { bg: string; fg: string }> = {
		Urgjente: { bg: "#ef4444", fg: "#ffffff" },
		Mjekësi: { bg: "#0ea5e9", fg: "#ffffff" },
		Arsim: { bg: "#8b5cf6", fg: "#ffffff" },
		Komunitet: { bg: "#14b8a6", fg: "#062925" },
		Kafshë: { bg: "#f59e0b", fg: "#2a1700" },
		Fatkeqësi: { bg: "#334155", fg: "#ffffff" },
		"Të tjera": { bg: "#0f766e", fg: "#ffffff" },
	};

	const { bg, fg } = palette[category] ?? palette["Të tjera"];
	const safeTitle = title.length > 38 ? `${title.slice(0, 38)}…` : title;
	const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500" role="img" aria-label="${category}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${bg}"/>
      <stop offset="1" stop-color="#000000" stop-opacity="0.18"/>
    </linearGradient>
  </defs>
  <rect width="800" height="500" fill="url(#g)"/>
  <rect x="40" y="330" width="720" height="130" rx="22" fill="#000" fill-opacity="0.22"/>
  <text x="70" y="385" font-family="Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif" font-size="28" fill="${fg}" font-weight="700">${category}</text>
  <text x="70" y="425" font-family="Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif" font-size="22" fill="${fg}" opacity="0.95">${safeTitle}</text>
</svg>`;

	return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function mapCampaignToShowcaseItem(campaign: ApiCampaign): ShowcaseItem {
	const category = campaign.category?.name ?? "Të tjera";
	const imageUrl = campaign.coverImage ?? campaignCoverFallback(category, campaign.title);
	const weeklyRaised = getWeeklyRaisedTotal(campaign);

	return {
		id: campaign.id,
		title: campaign.title,
		totalRaised: campaign.currentAmount,
		header: (
			<div className="relative h-full w-full">
				<img
					src={imageUrl}
					alt={campaign.title}
					className="h-full w-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
				/>
				<Link to={`/donate/${campaign.id}`} className="absolute inset-0" aria-label={`Shiko ${campaign.title}`}>
					<span className="sr-only">Hap fushatën {campaign.title}</span>
				</Link>
			</div>
		),
		className: "md:col-span-1",
	};
}

function pickWeeklyCampaigns(campaigns: ApiCampaign[]) {
	const activeCampaigns = campaigns.filter((campaign) => campaign.status === "active");
	const rankedByWeeklyRaised = activeCampaigns
		.map((campaign) => ({
			campaign,
			weeklyRaised: getWeeklyRaisedTotal(campaign),
		}))
		.sort((left, right) => {
			if (right.weeklyRaised !== left.weeklyRaised) {
				return right.weeklyRaised - left.weeklyRaised;
			}
			return new Date(right.campaign.createdAt).getTime() - new Date(left.campaign.createdAt).getTime();
		})
		.slice(0, 4);

	const selectedIds = new Set(rankedByWeeklyRaised.map(({ campaign }) => campaign.id));
	const newestActiveFallbacks = activeCampaigns
		.filter((campaign) => !selectedIds.has(campaign.id))
		.slice()
		.sort(
			(left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
		)
		.slice(0, Math.max(0, 4 - rankedByWeeklyRaised.length));

	return [...rankedByWeeklyRaised.map(({ campaign }) => campaign), ...newestActiveFallbacks].slice(0, 4);
}

const SuccessfulCampaignsWeek = () => {
	const [items, setItems] = useState<ShowcaseItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let mounted = true;

		const loadCampaigns = async () => {
			setLoading(true);
			setError(null);

			try {
				const response = await apiClient.get<CampaignListResponse | unknown>("/campaigns?limit=50&page=1");
				const campaigns = normalizeCampaigns(response);
				const weeklyCampaigns = pickWeeklyCampaigns(campaigns);

				if (!mounted) return;
				setItems(weeklyCampaigns.map(mapCampaignToShowcaseItem));
			} catch (requestError) {
				if (!mounted) return;
				const message = isAxiosError<{ error?: string }>(requestError)
					? requestError.response?.data?.error ?? requestError.message
					: requestError instanceof Error
						? requestError.message
						: "Dështoi ngarkimi i fushatave.";
				setError(message);
				setItems([]);
			} finally {
				if (mounted) {
					setLoading(false);
				}
			}
		};

		void loadCampaigns();

		return () => {
			mounted = false;
		};
	}, []);

	const hasItems = items.length > 0;

	return (
		<section className="px-4 pb-16 sm:pb-20">
			<div className="mx-auto w-full max-w-(--breakpoint-xl) px-4">
				<div className="mx-auto mb-10 max-w-3xl text-center">
					<Badge
						variant="secondary"
						className="rounded-full border-accent/50 bg-accent/10 px-3 py-1 text-accent-foreground"
					>
						Kauzat që po inspirojnë
					</Badge>
					<h2 className="mt-4 font-semibold text-2xl tracking-tight sm:text-3xl md:text-4xl">
						Fushatat më të suksesshme këtë javë
					</h2>
					<p className="mt-4 leading-relaxed text-foreground/70 md:text-lg">
						Këto iniciativa kanë marrë mbështetjen më të madhe nga
						komuniteti dhe po krijojnë ndikim të menjëhershëm.
					</p>
				</div>

				{loading ? (
					<div className="rounded-2xl border border-border/60 bg-muted/30 p-8 text-center text-sm text-muted-foreground">
						Duke ngarkuar fushatat reale...
					</div>
				) : error ? (
					<div className="rounded-2xl border border-border/60 bg-muted/30 p-8 text-center text-sm text-muted-foreground">
						{error}
					</div>
				) : hasItems ? (
					<BentoGrid>
						{items.map((item, i) => {
							const topWeekly = items[0]?.totalRaised ?? 0;
							const barPercent = topWeekly > 0 ? clampPercent((item.totalRaised / topWeekly) * 100) : 0;

							return (
								<BentoGridItem
									key={item.id}
									title={item.title}
									header={item.header}
									footer={
										<div className="space-y-1.5">
											<div className="h-2 w-full overflow-hidden rounded-full bg-muted">
												<div
													className="h-full rounded-full bg-linear-to-r from-primary via-primary/85 to-accent"
													style={{ width: `${barPercent}%` }}
												/>
											</div>
											<p className="text-sm font-semibold tracking-tight text-foreground/90 sm:text-base">
											{formatEuro(item.totalRaised)} të mbledhura
											</p>
										</div>
									}
									className={i === 0 ? "md:col-span-2" : i === 3 ? "md:col-span-2" : "md:col-span-1"}
								/>
							);
						})}
					</BentoGrid>
				) : (
					<div className="rounded-2xl border border-border/60 bg-muted/30 p-8 text-center text-sm text-muted-foreground">
						Nuk u gjetën donacione aktive për këtë javë.
					</div>
				)}
			</div>
		</section>
	);
};

export default SuccessfulCampaignsWeek;
