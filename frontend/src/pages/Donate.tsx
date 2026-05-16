import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";

import { isAxiosError } from "axios";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Campaign = {
	id: string;
	title: string;
	organizer: string;
	location?: string;
	category: string;
	/** Cover për kartën — në prod zakonisht URL nga backend / upload i organizatorit. */
	imageUrl: string;
	goalEuro: number;
	raisedEuro: number;
	donors: number;
	createdDaysAgo: number;
	featured?: boolean;
	status?: "draft" | "pending" | "active" | "funded" | "failed";
	creatorEmail?: string;
};

type ApiCampaign = {
	id: number;
	title: string;
	goalAmount: number;
	currentAmount: number;
	backersCount: number;
	coverImage: string | null;
	createdAt: string;
	isFeatured: boolean;
	status: "draft" | "pending" | "active" | "funded" | "failed";
	category: { name: string } | null;
	creator: { emri: string; mbiemri: string; email: string } | null;
};

type CampaignListResponse = {
	campaigns: unknown;
	page?: number;
	limit?: number;
	hasMore?: boolean;
	total?: number;
};

const CATEGORIES = [
	"Urgjente",
	"Mjekësi",
	"Arsim",
	"Komunitet",
	"Kafshë",
	"Fatkeqësi",
];

const CAMPAIGNS: Campaign[] = [
	{
		id: "c-1",
		title: "Ndihmë urgjente për operacion",
		organizer: "Arta K.",
		location: "Prishtinë",
		imageUrl:
			"https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80",
		category: "Mjekësi",
		goalEuro: 5000,
		raisedEuro: 3120,
		donors: 146,
		createdDaysAgo: 6,
		featured: true,
	},
	{
		id: "c-2",
		title: "Bursa për studime – një semestër",
		organizer: "Luan B.",
		location: "Tiranë",
		imageUrl:
			"https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80",
		category: "Arsim",
		goalEuro: 1200,
		raisedEuro: 760,
		donors: 58,
		createdDaysAgo: 12,
		featured: true,
	},
	{
		id: "c-3",
		title: "Pako ushqimore për familje në nevojë",
		organizer: "Qendra Komunitare",
		location: "Shkodër",
		imageUrl:
			"https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=800&q=80",
		category: "Komunitet",
		goalEuro: 2500,
		raisedEuro: 910,
		donors: 73,
		createdDaysAgo: 3,
	},
	{
		id: "c-4",
		title: "Strehë e përkohshme pas zjarrit",
		organizer: "Driton M.",
		location: "Pejë",
		imageUrl:
			"https://images.unsplash.com/photo-1544984243-ec57ea16fe25?auto=format&fit=crop&w=800&q=80",
		category: "Fatkeqësi",
		goalEuro: 8000,
		raisedEuro: 2450,
		donors: 121,
		createdDaysAgo: 2,
	},
	{
		id: "c-5",
		title: "Trajtim veterinar për qenushin ‘Boni’",
		organizer: "Strehimore Lokale",
		location: "Durrës",
		imageUrl:
			"https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=800&q=80",
		category: "Kafshë",
		goalEuro: 900,
		raisedEuro: 540,
		donors: 41,
		createdDaysAgo: 9,
	},
	{
		id: "c-6",
		title: "Rikonstruktim i klasës së fshatit",
		organizer: "Këshilli i Prindërve",
		location: "Gjakovë",
		imageUrl:
			"https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=80",
		category: "Arsim",
		goalEuro: 3500,
		raisedEuro: 1730,
		donors: 84,
		createdDaysAgo: 18,
	},
];

function formatEuro(amount: number) {
	return new Intl.NumberFormat("de-DE", {
		style: "currency",
		currency: "EUR",
		maximumFractionDigits: 0,
	}).format(amount);
}

function clampPercent(value: number) {
	if (!Number.isFinite(value)) return 0;
	return Math.max(0, Math.min(100, value));
}

function campaignCoverFallback(category: string, title: string) {
	const palette: Record<string, { bg: string; fg: string }> = {
		Urgjente: { bg: "#ef4444", fg: "#ffffff" },
		"Mjekësi": { bg: "#0ea5e9", fg: "#ffffff" },
		Arsim: { bg: "#8b5cf6", fg: "#ffffff" },
		Komunitet: { bg: "#14b8a6", fg: "#062925" },
		"Kafshë": { bg: "#f59e0b", fg: "#2a1700" },
		"Fatkeqësi": { bg: "#334155", fg: "#ffffff" },
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

function normalizeCampaigns(input: unknown): ApiCampaign[] {
	const source = Array.isArray(input)
		? input
		: input && typeof input === "object" && "campaigns" in input
			? (input as { campaigns: unknown }).campaigns
			: [];
	if (!Array.isArray(source)) return [];
	return source.filter(
		(item): item is ApiCampaign => Boolean(item && typeof item === "object"),
	);
}

function mapToDonateCampaign(campaign: ApiCampaign): Campaign {
	const createdAt = new Date(campaign.createdAt);
	const now = Date.now();
	const createdDaysAgo = Number.isFinite(createdAt.getTime())
		? Math.max(0, Math.floor((now - createdAt.getTime()) / (1000 * 60 * 60 * 24)))
		: 0;
	const organizerName =
		`${campaign.creator?.emri ?? ""} ${campaign.creator?.mbiemri ?? ""}`.trim() ||
		campaign.creator?.email ||
		"Organizator";

	return {
		id: String(campaign.id),
		title: campaign.title,
		organizer: organizerName,
		creatorEmail: campaign.creator?.email ?? undefined,
		category: campaign.category?.name ?? "Të tjera",
		imageUrl: campaign.coverImage || campaignCoverFallback(campaign.category?.name ?? "Të tjera", campaign.title),
		goalEuro: campaign.goalAmount,
		raisedEuro: campaign.currentAmount,
		donors: campaign.backersCount,
		createdDaysAgo,
		featured: campaign.isFeatured,
		status: campaign.status,
	};
}

function mergeCampaignLists(primary: Campaign[], secondary: Campaign[]) {
	const merged = [...primary];
	const knownIds = new Set(primary.map((campaign) => campaign.id));
	for (const campaign of secondary) {
		if (!knownIds.has(campaign.id)) {
			merged.push(campaign);
		}
	}
	return merged;
}

const Donate = () => {
	const user = useAuthStore((state) => state.user);
	const currentRole = (user?.role ?? "").toUpperCase();
	const isPrivilegedViewer =
		currentRole === "ADMIN" ||
		currentRole === "MODERATOR" ||
		currentRole === "MANAGER";

	const [campaigns, setCampaigns] = useState<Campaign[]>(CAMPAIGNS);
	const [loading, setLoading] = useState(true);
	const [loadingMore, setLoadingMore] = useState(false);
	const [hasMore, setHasMore] = useState(true);
	const [page, setPage] = useState(1);
	const [apiError, setApiError] = useState<string | null>(null);
	const [query, setQuery] = useState("");
	const [category, setCategory] = useState<string>("Të gjitha");
	const [sortBy, setSortBy] = useState<"newest" | "mostFunded" | "mostDonors" | "endingSoon">("newest");
	const sentinelRef = useRef<HTMLDivElement | null>(null);
	const PAGE_SIZE = 9;

	const canSeeClosedCampaign = useCallback(
		(item: ApiCampaign) => {
			if (item.status !== "failed") return true;
			if (isPrivilegedViewer) return true;
			const currentEmail = user?.email?.toLowerCase();
			const creatorEmail = item.creator?.email?.toLowerCase();
			return Boolean(currentEmail && creatorEmail && currentEmail === creatorEmail);
		},
		[isPrivilegedViewer, user?.email],
	);

	const fetchCampaignPage = useCallback(
		async (nextPage: number, replace = false) => {
			if (replace) {
				setLoading(true);
				setApiError(null);
			} else {
				setLoadingMore(true);
			}

			try {
				const data = await apiClient.get<CampaignListResponse | unknown>(
					`/campaigns?page=${nextPage}&limit=${PAGE_SIZE}`,
				);
				const isLegacyArrayResponse = Array.isArray(data);
				const normalizedAll = normalizeCampaigns(data)
					.filter((item) => item.status !== "draft")
					.filter(canSeeClosedCampaign)
					.map(mapToDonateCampaign);
				const normalized = isLegacyArrayResponse
					? normalizedAll.slice(
							(nextPage - 1) * PAGE_SIZE,
							nextPage * PAGE_SIZE,
						)
					: normalizedAll;

				let appendedCount = normalized.length;

				if (replace) {
					setCampaigns(normalized.length ? normalized : CAMPAIGNS);
				} else {
					setCampaigns((current) => {
						const merged = mergeCampaignLists(current, normalized);
						appendedCount = merged.length - current.length;
						return merged;
					});
				}

				const responseMeta =
					data && typeof data === "object" && "hasMore" in data
						? (data as CampaignListResponse)
						: null;
				if (isLegacyArrayResponse) {
					// Legacy backend may ignore page/limit and return all campaigns.
					setHasMore(normalizedAll.length > nextPage * PAGE_SIZE);
				} else if (responseMeta) {
					setHasMore(Boolean(responseMeta.hasMore));
				} else {
					setHasMore(normalized.length >= PAGE_SIZE);
				}

				if (!replace && appendedCount <= 0) {
					// No new unique campaigns were added, so stop paging to avoid observer loops.
					setHasMore(false);
				}
				setPage(nextPage);
			} catch (error) {
				const backendMessage = isAxiosError<{ error?: string }>(error)
					? error.response?.data?.error ?? error.message
					: error instanceof Error
						? error.message
						: "Dështoi ngarkimi i fushatave.";
				setApiError(backendMessage);
				if (replace) {
					setCampaigns(CAMPAIGNS);
					setHasMore(false);
				}
			} finally {
				if (replace) {
					setLoading(false);
				} else {
					setLoadingMore(false);
				}
			}
		},
		[canSeeClosedCampaign],
	);

	useEffect(() => {
		void fetchCampaignPage(1, true);
	}, [fetchCampaignPage]);

	useEffect(() => {
		const sentinel = sentinelRef.current;
		if (!sentinel) return;

		const observer = new IntersectionObserver(
			(entries) => {
				const [entry] = entries;
				if (!entry?.isIntersecting) return;
				if (loading || loadingMore || !hasMore) return;
				void fetchCampaignPage(page + 1, false);
			},
			{ rootMargin: "320px 0px" },
		);

		observer.observe(sentinel);
		return () => observer.disconnect();
	}, [fetchCampaignPage, hasMore, loading, loadingMore, page]);

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();
		let list = campaigns.filter((c) => {
			const matchesCategory = category === "Të gjitha" || c.category === category;
			const matchesQuery =
				q.length === 0 ||
				c.title.toLowerCase().includes(q) ||
				c.organizer.toLowerCase().includes(q) ||
				(c.location ?? "").toLowerCase().includes(q);

			return matchesCategory && matchesQuery;
		});

		if (sortBy === "mostFunded") {
			list = list.slice().sort((a, b) => (b.raisedEuro / b.goalEuro) - (a.raisedEuro / a.goalEuro));
		} else if (sortBy === "mostDonors") {
			list = list.slice().sort((a, b) => b.donors - a.donors);
		} else if (sortBy === "endingSoon") {
			// we don't have endDate on the lightweight model; keep createdDaysAgo as proxy (older first => ending later)
			list = list.slice().sort((a, b) => a.createdDaysAgo - b.createdDaysAgo);
		} else {
			// newest: smaller createdDaysAgo means more recent
			list = list.slice().sort((a, b) => a.createdDaysAgo - b.createdDaysAgo);
		}

		return list;
	}, [campaigns, category, query, sortBy]);

	const dynamicCategories = useMemo(() => {
		const categoriesFromCampaigns = Array.from(
			new Set(campaigns.map((campaign) => campaign.category).filter(Boolean)),
		);
		if (categoriesFromCampaigns.length) return categoriesFromCampaigns;
		return CATEGORIES;
	}, [campaigns]);

	return (
		<div className="bg-background pt-6">
			<section className="mx-auto w-full max-w-6xl px-4 pb-14">
				<div className="space-y-1">
					<h1 className="font-heading text-3xl font-semibold tracking-tight">
						Eksploro të gjitha fushatat
					</h1>
					<p className="text-sm text-muted-foreground">
						Filtro sipas kategorisë ose kërko me fjalë kyçe.
					</p>
				</div>

				<div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center">
					<div className="w-full lg:flex-1">
						<Input
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							placeholder="Kërko fushata, organizator, qytet…"
							aria-label="Kërko fushata"
						/>
					</div>
					<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
							<Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
								<SelectTrigger className="w-44">
									<SelectValue placeholder="Rendit sipas" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="newest">Më të rejat</SelectItem>
									<SelectItem value="mostFunded">Më të financuara</SelectItem>
									<SelectItem value="mostDonors">Më shumë dhurues</SelectItem>
									<SelectItem value="endingSoon">Përfundon së shpejti</SelectItem>
								</SelectContent>
							</Select>

							<Select value={category} onValueChange={setCategory}>
								<SelectTrigger className="w-44">
									<SelectValue placeholder="Zgjidh kategorinë" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="Të gjitha">Të gjitha</SelectItem>
									{dynamicCategories.map((option) => (
										<SelectItem key={option} value={option}>
											{option}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

				<div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{loading
						? Array.from({ length: PAGE_SIZE }).map((_, index) => (
							<CampaignCardSkeleton key={`initial-skeleton-${index}`} />
						))
						: null}
					{filtered.map((c) => (
						<CampaignCard key={c.id} campaign={c} />
					))}
					{!loading && loadingMore
						? Array.from({ length: 3 }).map((_, index) => (
							<CampaignCardSkeleton key={`more-skeleton-${index}`} />
						))
						: null}
				</div>

				<div ref={sentinelRef} className="h-2 w-full" aria-hidden="true" />

				{loading ? (
					<p className="mt-6 text-sm text-muted-foreground">Duke ngarkuar fushatat...</p>
				) : null}
				{apiError ? (
					<p className="mt-2 text-xs text-muted-foreground">Po shfaqen të dhëna fallback (API: {apiError}).</p>
				) : null}

				{filtered.length === 0 ? (
					<Card className="mt-6">
						<CardContent className="py-10 text-center text-muted-foreground">
							Nuk u gjet asnjë fushatë për këtë filtër. Provo një kategori tjetër
							ose ndrysho kërkimin.
						</CardContent>
					</Card>
				) : null}
			</section>
		</div>
	);
};

function CampaignCard({ campaign, large }: { campaign: Campaign; large?: boolean }) {
	const progress = clampPercent((campaign.raisedEuro / campaign.goalEuro) * 100);
	return (
		<Link
			to={`/donate/${campaign.id}`}
			className={cn(
			"group row-span-1 flex cursor-pointer flex-col justify-between space-y-4 overflow-hidden rounded-lg border-0 bg-transparent ring-0 p-0 shadow-none outline-none transition-[background-color,box-shadow] duration-300 ease-in-out hover:bg-foreground/5 hover:shadow-[0_0_0_6px_rgba(15,23,42,0.05)]",
			large ? "md:col-span-2" : "",
			)}
		>
			<div className="flex h-52 min-h-24 w-full overflow-hidden rounded-lg">
				<img
					src={campaign.imageUrl}
					alt={campaign.title}
					className="h-full w-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
					loading="lazy"
					decoding="async"
					referrerPolicy="no-referrer"
					onError={(e) => {
						const img = e.currentTarget;
						const fallback = campaignCoverFallback(campaign.category, campaign.title);
						if (img.src !== fallback) img.src = fallback;
					}}
				/>
			</div>

			<div className="p-4">
				<div className="flex items-center justify-between">
					<div>
						<div className="text-sm font-bold text-card-foreground">{campaign.title}</div>
						<div className="mt-2 text-sm text-muted-foreground">
							{campaign.organizer} {campaign.location ? `• ${campaign.location}` : ""}
						</div>
					</div>
				</div>

				<div className="mt-4 space-y-2">
					<div className="h-2 w-full overflow-hidden rounded-full bg-muted">
						<div
							className="h-full rounded-full bg-linear-to-r from-primary via-primary/85 to-accent"
							style={{ width: `${progress}%` }}
							aria-label="Progresi i mbledhjes"
						/>
					</div>
					<div className="flex items-center justify-between text-sm">
						<div className="font-semibold text-foreground">Te mbledhura: {formatEuro(campaign.raisedEuro)}</div>
						<div className="text-muted-foreground">{campaign.donors} donatorë • {progress.toFixed(0)}%</div>
					</div>
				</div>

			</div>
		</Link>
	);
}

function CampaignCardSkeleton() {
	return (
		<div className="row-span-1 flex flex-col space-y-4 overflow-hidden rounded-lg p-0">
			<div className="h-52 min-h-24 w-full animate-pulse rounded-lg bg-muted" />
			<div className="space-y-3 p-4">
				<div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
				<div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
				<div className="h-2 w-full animate-pulse rounded bg-muted" />
				<div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
			</div>
		</div>
	);
}

export default Donate;
