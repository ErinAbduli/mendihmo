import { prisma } from "../lib/prisma.ts";
import { cloudinary, hasCloudinaryConfig } from "../lib/cloudinary.ts";
import type { CampaignStatus } from "../generated/prisma/enums.ts";
import type { Prisma } from "../generated/prisma/client.ts";

const campaignSelect = {
	id: true,
	title: true,
	slug: true,
	description: true,
	goalAmount: true,
	currentAmount: true,
	currency: true,
	startDate: true,
	endDate: true,
	status: true,
	creatorId: true,
	categoryId: true,
	coverImage: true,
	images: true,
	videoUrl: true,
	backersCount: true,
	likesCount: true,
	viewsCount: true,
	isFeatured: true,
	isApproved: true,
	createdAt: true,
	updatedAt: true,
	creator: {
		select: {
			id: true,
			emri: true,
			mbiemri: true,
			email: true,
		},
	},
	category: {
		select: {
			id: true,
			name: true,
			slug: true,
		},
	},
	rewards: {
		select: {
			id: true,
			title: true,
			description: true,
			amount: true,
			limitedQuantity: true,
			claimedCount: true,
			createdAt: true,
		},
	},
	updates: {
		select: {
			id: true,
			title: true,
			content: true,
			createdAt: true,
		},
	},
	comments: {
		select: {
			id: true,
			userId: true,
			content: true,
			createdAt: true,
		},
	},
	contributions: {
		select: {
			id: true,
			userId: true,
			rewardId: true,
			amount: true,
			paymentStatus: true,
			createdAt: true,
		},
	},
	transactions: {
		select: {
			id: true,
			userId: true,
			amount: true,
			currency: true,
			status: true,
			paymentMethod: true,
			createdAt: true,
		},
	},
} satisfies Prisma.CampaignSelect;

type CampaignInput = {
	title: string;
	slug?: string;
	description: string;
	goalAmount: number;
	currentAmount?: number;
	currency?: string;
	startDate: string | Date;
	endDate: string | Date;
	status?: CampaignStatus;
	categoryId?: number | null;
	coverImage?: string | null | undefined;
	images?: string | string[] | null | undefined;
	videoUrl?: string | null | undefined;
	backersCount?: number;
	likesCount?: number;
	viewsCount?: number;
	isFeatured?: boolean;
	isApproved?: boolean;
};

type CampaignUpdateInput = Partial<CampaignInput>;

function parseCampaignId(campaignId: string) {
	const id = Number.parseInt(campaignId, 10);
	if (!Number.isFinite(id)) {
		throw new Error("Campaign not found");
	}
	return id;
}

function normalizeImages(images: string | string[] | null | undefined) {
	if (Array.isArray(images)) {
		return JSON.stringify(images);
	}
	return images ?? undefined;
}

function isCloudinaryUrl(value: string) {
	return value.includes("res.cloudinary.com");
}

async function uploadMedia(
	media: string,
	resourceType: "image" | "video",
	folder: string,
) {
	if (!media || isCloudinaryUrl(media)) {
		return media;
	}

	if (!hasCloudinaryConfig) {
		throw new Error(
			"Konfigurimi i Cloudinary mungon. Ju lutemi plotësoni CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY dhe CLOUDINARY_API_SECRET.",
		);
	}

	try {
		const result = await cloudinary.uploader.upload(media, {
			resource_type: resourceType,
			folder,
		});

		return result.secure_url;
	} catch {
		throw new Error(
			resourceType === "video"
				? "Dështoi ngarkimi i videos në Cloudinary."
				: "Dështoi ngarkimi i imazhit në Cloudinary.",
		);
	}
}

async function uploadCampaignImages(images: string | string[] | null | undefined) {
	if (images === undefined) {
		return undefined;
	}

	if (images === null) {
		return null;
	}

	const imageList = Array.isArray(images) ? images : [images];
	const uploadedImages = await Promise.all(
		imageList.map((image) => uploadMedia(image, "image", "campaigns/images")),
	);

	return JSON.stringify(uploadedImages);
}

async function uploadCampaignVideo(videoUrl: string | null | undefined) {
	if (videoUrl === undefined) {
		return undefined;
	}

	if (videoUrl === null) {
		return null;
	}

	return uploadMedia(videoUrl, "video", "campaigns/videos");
}

function slugifyCampaignTitle(title: string) {
	return title
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

function escapeRegex(value: string) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function generateUniqueCampaignSlug(baseSlug: string, excludeId?: number) {
	const queryResult = await prisma.campaign.findMany({
		where: {
			slug: { startsWith: baseSlug },
			...(excludeId !== undefined ? { id: { not: excludeId } } : {}),
		},
		select: { slug: true },
	});

	if (!queryResult.length) {
		return baseSlug;
	}

	const exactBaseExists = queryResult.some((campaign) => campaign.slug === baseSlug);
	if (!exactBaseExists) {
		return baseSlug;
	}

	const slugPattern = new RegExp(`^${escapeRegex(baseSlug)}-(\\d+)$`);
	const usedIndexes = new Set(
		queryResult
			.map((campaign) => campaign.slug.match(slugPattern)?.[1])
			.filter((match): match is string => Boolean(match))
			.map((match) => Number.parseInt(match, 10))
			.filter((index) => Number.isFinite(index)),
	);

	let nextIndex = 1;
	while (usedIndexes.has(nextIndex)) {
		nextIndex += 1;
	}

	return `${baseSlug}-${nextIndex}`;
}

function normalizeDate(date: string | Date) {
	const normalizedDate = date instanceof Date ? date : new Date(date);
	if (Number.isNaN(normalizedDate.getTime())) {
		throw new Error("Invalid campaign date");
	}
	return normalizedDate;
}

function normalizeCampaignData(campaignData: CampaignInput | CampaignUpdateInput) {
	const data: Prisma.CampaignUncheckedCreateInput | Prisma.CampaignUncheckedUpdateInput = {};

	if (campaignData.title !== undefined) {
		data.title = campaignData.title;
	}
	if (campaignData.slug !== undefined) {
		data.slug = campaignData.slug;
	}
	if (campaignData.description !== undefined) {
		data.description = campaignData.description;
	}
	if (campaignData.goalAmount !== undefined) {
		data.goalAmount = campaignData.goalAmount;
	}
	if (campaignData.currentAmount !== undefined) {
		data.currentAmount = campaignData.currentAmount;
	}
	if (campaignData.currency !== undefined) {
		data.currency = campaignData.currency;
	}
	if (campaignData.startDate !== undefined) {
		data.startDate = normalizeDate(campaignData.startDate);
	}
	if (campaignData.endDate !== undefined) {
		data.endDate = normalizeDate(campaignData.endDate);
	}
	if (campaignData.status !== undefined) {
		data.status = campaignData.status;
	}
	if (campaignData.categoryId !== undefined) {
		data.categoryId = campaignData.categoryId;
	}
	if (campaignData.coverImage !== undefined) {
		data.coverImage = campaignData.coverImage;
	}
	if (campaignData.images !== undefined) {
		const normalizedImages = normalizeImages(campaignData.images);
		if (normalizedImages !== undefined) {
			data.images = normalizedImages;
		}
	}
	if (campaignData.videoUrl !== undefined) {
		data.videoUrl = campaignData.videoUrl;
	}
	if (campaignData.backersCount !== undefined) {
		data.backersCount = campaignData.backersCount;
	}
	if (campaignData.likesCount !== undefined) {
		data.likesCount = campaignData.likesCount;
	}
	if (campaignData.viewsCount !== undefined) {
		data.viewsCount = campaignData.viewsCount;
	}
	if (campaignData.isFeatured !== undefined) {
		data.isFeatured = campaignData.isFeatured;
	}
	if (campaignData.isApproved !== undefined) {
		data.isApproved = campaignData.isApproved;
	}

	return data;
}

export const campaignService = {
	createCampaign: async (userId: number, campaignData: CampaignInput) => {
		const baseSlug = slugifyCampaignTitle(campaignData.title);
		if (!baseSlug) {
			throw new Error("Campaign slug is required");
		}

		const [slug, creatorExists] = await Promise.all([
			generateUniqueCampaignSlug(baseSlug),
			prisma.user.findUnique({ where: { id: userId }, select: { id: true } }),
		]);

		if (!creatorExists) {
			throw new Error("Creator not found");
		}

		if (campaignData.categoryId !== undefined && campaignData.categoryId !== null) {
			const categoryExists = await prisma.category.findUnique({
				where: { id: campaignData.categoryId },
				select: { id: true },
			});

			if (!categoryExists) {
				throw new Error("Category not found");
			}
		}

		if (normalizeDate(campaignData.endDate) < normalizeDate(campaignData.startDate)) {
			throw new Error("Campaign end date must be after the start date");
		}

		const [coverImage, images, videoUrl] = await Promise.all([
			campaignData.coverImage !== undefined
				? campaignData.coverImage === null
					? Promise.resolve(null)
					: uploadMedia(campaignData.coverImage, "image", "campaigns/cover-images")
				: Promise.resolve(undefined),
			campaignData.images !== undefined
				? uploadCampaignImages(campaignData.images)
				: Promise.resolve(undefined),
			campaignData.videoUrl !== undefined
				? campaignData.videoUrl === null
					? Promise.resolve(null)
					: uploadCampaignVideo(campaignData.videoUrl)
				: Promise.resolve(undefined),
		]);

		const data = normalizeCampaignData({
			...campaignData,
			slug,
			coverImage,
			images,
			videoUrl,
		});

		return prisma.campaign.create({
			data: {
				...data,
				creatorId: userId,
				currentAmount: campaignData.currentAmount ?? 0,
				currency: campaignData.currency ?? "EUR",
				status: campaignData.status ?? "draft",
				backersCount: campaignData.backersCount ?? 0,
				likesCount: campaignData.likesCount ?? 0,
				viewsCount: campaignData.viewsCount ?? 0,
				isFeatured: campaignData.isFeatured ?? false,
				isApproved: campaignData.isApproved ?? false,
			} as Prisma.CampaignUncheckedCreateInput,
			select: campaignSelect,
		});
	},
	updateCampaign: async (userId: number, campaignId: string, campaignData: CampaignUpdateInput) => {
		const id = parseCampaignId(campaignId);
		const campaign = await prisma.campaign.findUnique({ where: { id } });

		if (!campaign) {
			throw new Error("Campaign not found");
		}

		const adminRole = await prisma.userRole.findFirst({
			where: {
				user_id: userId,
				role: { normalized_name: "ADMIN" },
			},
			select: { id: true },
		});

		if (campaign.creatorId !== userId && !adminRole) {
			throw new Error("You are not allowed to edit this campaign");
		}

		const nextSlug = campaignData.title
			? await generateUniqueCampaignSlug(slugifyCampaignTitle(campaignData.title), id)
			: undefined;

		if (campaignData.categoryId !== undefined && campaignData.categoryId !== null) {
			const categoryExists = await prisma.category.findUnique({
				where: { id: campaignData.categoryId },
				select: { id: true },
			});

			if (!categoryExists) {
				throw new Error("Category not found");
			}
		}

		if (
			campaignData.startDate !== undefined &&
			campaignData.endDate !== undefined &&
			normalizeDate(campaignData.endDate) < normalizeDate(campaignData.startDate)
		) {
			throw new Error("Campaign end date must be after the start date");
		}

		const [coverImage, images, videoUrl] = await Promise.all([
			campaignData.coverImage !== undefined
				? campaignData.coverImage === null
					? Promise.resolve(null)
					: uploadMedia(campaignData.coverImage, "image", "campaigns/cover-images")
				: Promise.resolve(undefined),
			campaignData.images !== undefined
				? uploadCampaignImages(campaignData.images)
				: Promise.resolve(undefined),
			campaignData.videoUrl !== undefined
				? uploadCampaignVideo(campaignData.videoUrl)
				: Promise.resolve(undefined),
		]);

		return prisma.campaign.update({
			where: { id },
			data: normalizeCampaignData({
				...campaignData,
				...(nextSlug !== undefined ? { slug: nextSlug } : {}),
				coverImage,
				images,
				videoUrl,
			}) as Prisma.CampaignUncheckedUpdateInput,
			select: campaignSelect,
		});
	},
	deleteCampaign: async (userId: number, campaignId: string) => {
		const id = parseCampaignId(campaignId);
		const campaign = await prisma.campaign.findUnique({
			where: { id },
			select: { id: true, creatorId: true },
		});

		if (!campaign) {
			throw new Error("Campaign not found");
		}

		const adminRole = await prisma.userRole.findFirst({
			where: {
				user_id: userId,
				role: { normalized_name: "ADMIN" },
			},
			select: { id: true },
		});

		if (campaign.creatorId !== userId && !adminRole) {
			throw new Error("You are not allowed to delete this campaign");
		}

		await prisma.campaign.delete({ where: { id } });
	},
	getCampaignById: async (campaignId: string) => {
		const id = parseCampaignId(campaignId);
		const campaign = await prisma.campaign.findUnique({
			where: { id },
			select: campaignSelect,
		});

		if (!campaign) {
			throw new Error("Campaign not found");
		}

		return campaign;
	},
	getAllCampaigns: async () => {
		return prisma.campaign.findMany({
			select: campaignSelect,
			orderBy: { createdAt: "desc" },
		});
	},
};
