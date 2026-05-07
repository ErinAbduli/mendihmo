import { prisma } from "../lib/prisma.ts";

type CategoryInput = {
	name: string;
	slug?: string;
};

type CategoryStatusInput = {
	isActive: boolean;
};

function parseCategoryId(categoryId: string) {
	const id = Number.parseInt(categoryId, 10);
	if (!Number.isFinite(id)) {
		throw new Error("Kategoria nuk u gjet");
	}

	return id;
}

function slugifyCategoryName(value: string) {
	return value
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

function escapeRegex(value: string) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function generateUniqueCategorySlug(baseSlug: string, excludeId?: number) {
	const existingCategories = await prisma.category.findMany({
		where: {
			slug: { startsWith: baseSlug },
			...(excludeId !== undefined ? { id: { not: excludeId } } : {}),
		},
		select: { slug: true },
	});

	if (!existingCategories.length) {
		return baseSlug;
	}

	const exactExists = existingCategories.some((category) => category.slug === baseSlug);
	if (!exactExists) {
		return baseSlug;
	}

	const pattern = new RegExp(`^${escapeRegex(baseSlug)}-(\\d+)$`);
	const usedIndexes = new Set(
		existingCategories
			.map((category) => category.slug.match(pattern)?.[1])
			.filter((value): value is string => Boolean(value))
			.map((value) => Number.parseInt(value, 10))
			.filter((value) => Number.isFinite(value)),
	);

	let nextIndex = 1;
	while (usedIndexes.has(nextIndex)) {
		nextIndex += 1;
	}

	return `${baseSlug}-${nextIndex}`;
}

export const categoryService = {
	getAllCategories: async (includeDisabled = false) => {
		return prisma.category.findMany({
			where: includeDisabled ? undefined : { isActive: true },
			select: {
				id: true,
				name: true,
				slug: true,
				isActive: true,
				_count: {
					select: {
						campaigns: true,
					},
				},
			},
			orderBy: { name: "asc" },
		});
	},

	createCategory: async (categoryData: CategoryInput) => {
		const normalizedName = categoryData.name.trim();
		if (!normalizedName) {
			throw new Error("Emri i kategorisë është i detyrueshëm");
		}

		const baseSlug = slugifyCategoryName(categoryData.slug ?? normalizedName);
		if (!baseSlug) {
			throw new Error("Slug-u i kategorisë është i pavlefshëm");
		}

		const slug = await generateUniqueCategorySlug(baseSlug);

		return prisma.category.create({
			data: {
				name: normalizedName,
				slug,
				isActive: true,
			},
			select: {
				id: true,
				name: true,
				slug: true,
				isActive: true,
				_count: {
					select: {
						campaigns: true,
					},
				},
			},
		});
	},

	updateCategory: async (categoryId: string, categoryData: CategoryInput) => {
		const id = parseCategoryId(categoryId);
		const existingCategory = await prisma.category.findUnique({
			where: { id },
			select: { id: true, name: true, slug: true },
		});

		if (!existingCategory) {
			throw new Error("Kategoria nuk u gjet");
		}

		const normalizedName = categoryData.name.trim();
		if (!normalizedName) {
			throw new Error("Emri i kategorisë është i detyrueshëm");
		}

		const baseSlug = slugifyCategoryName(categoryData.slug ?? normalizedName);
		if (!baseSlug) {
			throw new Error("Slug-u i kategorisë është i pavlefshëm");
		}

		const slug = await generateUniqueCategorySlug(baseSlug, id);

		return prisma.category.update({
			where: { id },
			data: {
				name: normalizedName,
				slug,
			},
			select: {
				id: true,
				name: true,
				slug: true,
				isActive: true,
				_count: {
					select: {
						campaigns: true,
					},
				},
			},
		});
	},

	updateCategoryStatus: async (
		categoryId: string,
		statusData: CategoryStatusInput,
	) => {
		const id = parseCategoryId(categoryId);
		const existingCategory = await prisma.category.findUnique({
			where: { id },
			select: {
				id: true,
				isActive: true,
			},
		});

		if (!existingCategory) {
			throw new Error("Kategoria nuk u gjet");
		}

		if (existingCategory.isActive === statusData.isActive) {
			return prisma.category.findUnique({
				where: { id },
				select: {
					id: true,
					name: true,
					slug: true,
					isActive: true,
					_count: {
						select: {
							campaigns: true,
						},
					},
				},
			});
		}

		return prisma.category.update({
			where: { id },
			data: {
				isActive: statusData.isActive,
			},
			select: {
				id: true,
				name: true,
				slug: true,
				isActive: true,
				_count: {
					select: {
						campaigns: true,
					},
				},
			},
		});
	},

	deleteCategory: async (categoryId: string) => {
		const id = parseCategoryId(categoryId);
		const existingCategory = await prisma.category.findUnique({
			where: { id },
			select: {
				id: true,
				_count: {
					select: {
						campaigns: true,
					},
				},
			},
		});

		if (!existingCategory) {
			throw new Error("Kategoria nuk u gjet");
		}

		if (existingCategory._count.campaigns > 0) {
			throw new Error(
				"Kjo kategori nuk mund të fshihet sepse ka fushata të lidhura. Përdorni çaktivizimin.",
			);
		}

		await prisma.category.delete({ where: { id } });
	},
};