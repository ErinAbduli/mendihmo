import {
	useCallback,
	useEffect,
	useMemo,
	useState,
	type FormEvent,
	type UIEvent,
} from "react";
import { Link, useLocation, useParams, useNavigate } from "react-router";
import { isAxiosError } from "axios";
import { ChevronLeft, ChevronRight, Flag, Share2 } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { MediaUpload, PhotoGalleryUpload } from "@/components/ui/file-upload";

type CampaignStatus = "draft" | "pending" | "active" | "funded" | "failed";

type ApiCategory = {
	id: number;
	name: string;
};

type ApiCampaign = {
	id: number;
	title: string;
	description: string;
	createdAt: string;
	goalAmount: number;
	currentAmount: number;
	currency: string;
	status: CampaignStatus;
	categoryId: number | null;
	endDate: string | null;
	coverImage: string | null;
	images: string | null;
	videoUrl: string | null;
	backersCount: number;
	contributions: Array<{
		id: number;
		userId: number;
		amount: number;
		currency: string;
		paymentStatus: string;
		createdAt: string;
		user: {
			emri: string;
			mbiemri: string;
			email: string;
		} | null;
	}>;
	creator: {
		id: number;
		emri: string;
		mbiemri: string;
		email: string;
	} | null;
	category: {
		id: number;
		name: string;
		slug: string;
	} | null;
};

function parseImages(value: string | null | undefined) {
	if (!value) return [];

	try {
		const parsed = JSON.parse(value) as unknown;
		if (Array.isArray(parsed)) {
			return parsed.filter(
				(item): item is string =>
					typeof item === "string" && item.trim().length > 0,
			);
		}
	} catch {
		return [value];
	}

	return [value];
}

function parseMediaSelection(value: string | null | undefined) {
	return parseImages(value);
}

function normalizeMediaValue(value?: string | string[] | null) {
	if (value === undefined) return undefined;
	if (value === null) return null;
	if (Array.isArray(value)) return value.length ? value : null;
	if (!value.trim()) return null;
	return value;
}

function mergeUnique(base: string[], additions: string[]) {
	return Array.from(
		new Set(
			[...base, ...additions].filter((item) => item.trim().length > 0),
		),
	);
}

const campaignStatuses: CampaignStatus[] = [
	"draft",
	"pending",
	"active",
	"funded",
	"failed",
];
const ANONYMOUS_DONOR_EMAIL = "anonymous-donor@mendihmo.local";

const statusLabel = (status: CampaignStatus) => {
	if (status === "draft") return "Draft";
	if (status === "pending") return "Në pritje";
	if (status === "active") return "Aktive";
	if (status === "funded") return "E financuar";
	return "Dështuar";
};

function normalizeCampaigns(input: unknown) {
	const source = Array.isArray(input)
		? input
		: input && typeof input === "object" && "campaigns" in input
			? (input as { campaigns: unknown }).campaigns
			: [];

	if (!Array.isArray(source)) return [];
	return source.filter((item): item is ApiCampaign =>
		Boolean(item && typeof item === "object"),
	);
}

function initials(name?: string, email?: string) {
	const normalizedName = (name ?? "").trim();
	if (normalizedName) {
		return normalizedName
			.split(/\s+/)
			.slice(0, 2)
			.map((part) => part[0]?.toUpperCase() ?? "")
			.join("");
	}

	if (email) return email.slice(0, 2).toUpperCase();
	return "M";
}

function buildFallbackImage(title: string, category?: string | null) {
	const safeTitle = title.length > 42 ? `${title.slice(0, 42)}…` : title;
	const label = category ?? "Fushatë";
	const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800" role="img" aria-label="${label}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0f766e"/>
      <stop offset="1" stop-color="#0f172a"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="800" fill="url(#g)"/>
  <text x="100" y="620" font-family="Inter, system-ui, sans-serif" font-size="44" fill="#ffffff" font-weight="700">${label}</text>
  <text x="100" y="680" font-family="Inter, system-ui, sans-serif" font-size="30" fill="#ffffff" opacity="0.92">${safeTitle}</text>
</svg>`;

	return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function formatCurrency(amount: number, currency = "EUR") {
	return new Intl.NumberFormat("de-DE", {
		style: "currency",
		currency,
		minimumFractionDigits: 0,
		maximumFractionDigits: 2,
	}).format(amount);
}

function formatDonorsCount(count: number) {
	if (!Number.isFinite(count) || count <= 0) return "0 dhurues";

	if (count >= 1000) {
		const thousands = count / 1000;
		const formattedThousands = new Intl.NumberFormat("sq-AL", {
			minimumFractionDigits: Number.isInteger(thousands) ? 0 : 1,
			maximumFractionDigits: 1,
		}).format(thousands);
		return `${formattedThousands} mijë dhurues`;
	}

	const suffix = count === 1 ? "dhurues" : "dhurues";
	return `${new Intl.NumberFormat("sq-AL").format(count)} ${suffix}`;
}

function clampPercent(value: number) {
	if (!Number.isFinite(value)) return 0;
	return Math.max(0, Math.min(100, value));
}

function formatCreatedAgo(value: string) {
	const createdAt = new Date(value);
	const elapsedMs = Date.now() - createdAt.getTime();
	if (!Number.isFinite(createdAt.getTime()) || elapsedMs < 0) {
		return "sot";
	}

	const elapsedDays = Math.floor(elapsedMs / (1000 * 60 * 60 * 24));
	if (elapsedDays <= 0) return "sot";
	if (elapsedDays === 1) return "1d ago";
	return `${elapsedDays}d ago`;
}

function formatDonationAgo(value: string) {
	const createdAt = new Date(value);
	const elapsedMs = Date.now() - createdAt.getTime();
	if (!Number.isFinite(createdAt.getTime()) || elapsedMs < 0) {
		return "tani";
	}

	const minutes = Math.floor(elapsedMs / (1000 * 60));
	if (minutes < 1) return "tani";
	if (minutes < 60) return `${minutes} min më parë`;

	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours} orë më parë`;

	const days = Math.floor(hours / 24);
	if (days < 30) return `${days} ditë më parë`;

	const months = Math.floor(days / 30);
	if (months < 12) return `${months} muaj më parë`;

	const years = Math.floor(months / 12);
	return `${years} vite më parë`;
}

function delay(ms: number) {
	return new Promise((resolve) => window.setTimeout(resolve, ms));
}

const CampaignDetail = () => {
	const { id } = useParams();
	const location = useLocation();
	const [campaign, setCampaign] = useState<ApiCampaign | null>(null);
	const [relatedCampaigns, setRelatedCampaigns] = useState<ApiCampaign[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [imageIndex, setImageIndex] = useState(0);
	const [showFullDescription, setShowFullDescription] = useState(false);
	const [reportOpen, setReportOpen] = useState(false);
	const [reportReason, setReportReason] = useState("");
	const [reportMessage, setReportMessage] = useState("");
	const [reportSubmitting, setReportSubmitting] = useState(false);
	const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
	const user = useAuthStore((state) => state.user);
	const [donationOpen, setDonationOpen] = useState(false);
	const [donationAuthChoiceOpen, setDonationAuthChoiceOpen] = useState(false);
	const [donationListOpen, setDonationListOpen] = useState(false);
	const [donationListMode, setDonationListMode] = useState<"all" | "top">(
		"all",
	);
	const [donationListVisibleCount, setDonationListVisibleCount] =
		useState(10);
	const [donationAmount, setDonationAmount] = useState("20");
	const [donateAnonymous, setDonateAnonymous] = useState(false);
	const [donationSubmitting, setDonationSubmitting] = useState(false);
	const [checkoutHandled, setCheckoutHandled] = useState(false);
	const [categories, setCategories] = useState<ApiCategory[]>([]);
	const [editDialogOpen, setEditDialogOpen] = useState(false);
	const [statusDialogOpen, setStatusDialogOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [editSubmitting, setEditSubmitting] = useState(false);
	const [statusSubmitting, setStatusSubmitting] = useState(false);
	const [deleteSubmitting, setDeleteSubmitting] = useState(false);
	const [editMode, setEditMode] = useState<"creator" | "manager">("creator");
	const [editDraft, setEditDraft] = useState({
		title: "",
		description: "",
		goalAmount: "0",
		status: "draft" as CampaignStatus,
		categoryId: "",
		coverImage: "",
		images: [] as string[],
		videoUrl: "",
	});
	const [creatorAddedPhotos, setCreatorAddedPhotos] = useState<string[]>([]);

	const presetDonationAmounts = [5, 10, 20, 50, 100];
	const pendingDonationAmountKey = "pendingDonationAmount";
	const pendingDonationCampaignKey = "pendingDonationCampaignId";
	const pendingDonationAnonymousKey = "pendingDonationAnonymous";
	type CampaignContribution = ApiCampaign["contributions"][number];
	const currentUserRole = user?.role;
	const isAdmin = currentUserRole === "ADMIN";
	const isModerator = currentUserRole === "MODERATOR";
	const isCreator = Boolean(
		user &&
		campaign &&
		user.email &&
		campaign.creator?.email &&
		user.email === campaign.creator.email,
	);
	const canEditCampaign = Boolean(
		campaign && (isAdmin || isModerator || isCreator),
	);
	const canDeleteCampaign = isAdmin;
	const canToggleCampaign = Boolean(
		campaign &&
		campaign.status !== "funded" &&
		((isCreator && campaign.status === "active") || isAdmin || isModerator),
	);
	const toggleAction = campaign?.status === "active" ? "close" : "open";

	const applyOptimisticDonation = useCallback(
		(amount: number, anonymous = false) => {
			if (!Number.isFinite(amount) || amount <= 0) return;

			const donorName = anonymous
				? "Anonim"
				: user?.name?.trim() || user?.email || "Anonim";
			const optimisticContribution: CampaignContribution = {
				id: Date.now(),
				userId: anonymous ? 0 : (user?.id ?? 0),
				amount,
				currency: campaign?.currency ?? "EUR",
				paymentStatus: "paid",
				createdAt: new Date().toISOString(),
				user:
					!anonymous && user
						? {
								emri: donorName,
								mbiemri: "",
								email: user.email,
							}
						: null,
			};

			setCampaign((current) => {
				if (!current) return current;
				return {
					...current,
					currentAmount: current.currentAmount + amount,
					backersCount: current.backersCount + 1,
					contributions: [
						optimisticContribution,
						...current.contributions,
					],
				};
			});
		},
		[campaign?.currency, user],
	);

	const fetchCampaign = useCallback(
		async (silent = false) => {
			if (!id) {
				return null;
			}

			if (!silent) {
				setLoading(true);
			}
			setError(null);

			try {
				const data = await apiClient.get<ApiCampaign>(
					`/campaigns/${id}`,
				);
				setCampaign(data);
				document.title = `${data.title} | MëNdihmo`;
				return data;
			} catch (requestError) {
				const message = isAxiosError<{ error?: string }>(requestError)
					? (requestError.response?.data?.error ??
						requestError.message)
					: requestError instanceof Error
						? requestError.message
						: "Dështoi ngarkimi i fushatës.";
				setError(message);
				setCampaign(null);
				return null;
			} finally {
				if (!silent) {
					setLoading(false);
				}
			}
		},
		[id],
	);

	useEffect(() => {
		let mounted = true;
		let refreshTimer: number | undefined;

		(async () => {
			if (!id) {
				if (mounted) {
					setError("Fushata nuk u gjet.");
					setLoading(false);
				}
				return;
			}

			await fetchCampaign(false);
			refreshTimer = window.setInterval(() => {
				void fetchCampaign(true);
			}, 15000);
		})();

		return () => {
			mounted = false;
			if (refreshTimer) {
				window.clearInterval(refreshTimer);
			}
		};
	}, [fetchCampaign, id]);

	const photos = useMemo(() => {
		if (!campaign) return [];
		const images = [
			campaign.coverImage,
			...parseImages(campaign.images),
		].filter((value): value is string => Boolean(value));
		return Array.from(new Set(images));
	}, [campaign]);

	useEffect(() => {
		setImageIndex(0);
		setShowFullDescription(false);
	}, [campaign?.id]);

	useEffect(() => {
		let mounted = true;

		(async () => {
			try {
				const response = await apiClient.get<unknown>("/categories");
				const data = Array.isArray(response)
					? response
					: response &&
						  typeof response === "object" &&
						  "categories" in response
						? (response as { categories: unknown }).categories
						: [];

				if (!mounted || !Array.isArray(data)) return;
				setCategories(
					data.filter((item): item is ApiCategory =>
						Boolean(item && typeof item === "object"),
					),
				);
			} catch {
				if (mounted) setCategories([]);
			}
		})();

		return () => {
			mounted = false;
		};
	}, []);

	useEffect(() => {
		if (!campaign?.id || checkoutHandled) return;

		const params = new URLSearchParams(window.location.search);
		if (params.get("checkout") !== "success") return;

		const sessionId = params.get("session_id");
		if (!sessionId) return;

		setCheckoutHandled(true);

		(async () => {
			const attempts = 6;
			for (let attempt = 1; attempt <= attempts; attempt += 1) {
				try {
					await apiClient.post<{ message: string }>(
						`/campaigns/${campaign.id}/checkout-session/confirm`,
						{
							sessionId,
						},
					);
					const storedAmount = Number(
						window.sessionStorage.getItem(
							pendingDonationAmountKey,
						) ?? "0",
					);
					const storedCampaignId = window.sessionStorage.getItem(
						pendingDonationCampaignKey,
					);
					const storedAnonymous =
						window.sessionStorage.getItem(
							pendingDonationAnonymousKey,
						) === "1";
					if (storedCampaignId === String(campaign.id)) {
						applyOptimisticDonation(storedAmount, storedAnonymous);
					}
					window.sessionStorage.removeItem(pendingDonationAmountKey);
					window.sessionStorage.removeItem(
						pendingDonationCampaignKey,
					);
					window.sessionStorage.removeItem(
						pendingDonationAnonymousKey,
					);
					toast.success("Pagesa u regjistrua me sukses.");
					window.history.replaceState(
						{},
						"",
						window.location.pathname,
					);
					void fetchCampaign(true);
					return;
				} catch (error) {
					const backendMessage = isAxiosError<{ error?: string }>(
						error,
					)
						? (error.response?.data?.error ?? error.message)
						: error instanceof Error
							? error.message
							: "Konfirmimi i pagesës dështoi.";
					const shouldRetry =
						backendMessage.includes("ende nuk është paguar") ||
						backendMessage.includes("dështoi") ||
						backendMessage.includes("nuk u gjet");

					if (attempt === attempts || !shouldRetry) {
						toast.error(backendMessage);
						window.history.replaceState(
							{},
							"",
							window.location.pathname,
						);
						void fetchCampaign(true);
						return;
					}

					await delay(1500);
				}
			}
		})();
	}, [applyOptimisticDonation, campaign?.id, checkoutHandled, fetchCampaign]);

	useEffect(() => {
		let mounted = true;

		(async () => {
			if (!campaign?.category?.name) {
				if (mounted) setRelatedCampaigns([]);
				return;
			}

			try {
				const data = await apiClient.get<unknown>("/campaigns");
				if (!mounted) return;
				const sameCategory = normalizeCampaigns(data)
					.filter((item) => item.id !== campaign.id)
					.filter(
						(item) =>
							item.category?.name === campaign.category?.name,
					)
					.sort(
						(left, right) =>
							new Date(right.createdAt).getTime() -
							new Date(left.createdAt).getTime(),
					)
					.slice(0, 4);
				setRelatedCampaigns(sameCategory);
			} catch {
				if (mounted) setRelatedCampaigns([]);
			}
		})();

		return () => {
			mounted = false;
		};
	}, [campaign?.category?.name, campaign?.id]);

	const currentPhoto =
		photos[imageIndex] ??
		(campaign
			? buildFallbackImage(campaign.title, campaign.category?.name)
			: "");
	const progress = campaign
		? clampPercent((campaign.currentAmount / campaign.goalAmount) * 100)
		: 0;
	const organizerName = campaign
		? `${campaign.creator?.emri ?? ""} ${campaign.creator?.mbiemri ?? ""}`.trim() ||
			campaign.creator?.email ||
			"Organizator"
		: "";
	const formatDonorName = (
		donation: ApiCampaign["contributions"][number],
	) => {
		if (donation.user?.email === ANONYMOUS_DONOR_EMAIL) {
			return "Anonim";
		}
		const name =
			`${donation.user?.emri ?? ""} ${donation.user?.mbiemri ?? ""}`.trim();
		return name || donation.user?.email || "Anonim";
	};
	const getDonorAvatarLabel = (
		donation: ApiCampaign["contributions"][number],
	) => {
		if (donation.user?.email === ANONYMOUS_DONOR_EMAIL) {
			return "AN";
		}
		return initials(
			`${donation.user?.emri ?? ""} ${donation.user?.mbiemri ?? ""}`.trim(),
			donation.user?.email,
		);
	};
	const recentDonations =
		campaign?.contributions
			.slice()
			.sort((left, right) => {
				return (
					new Date(right.createdAt).getTime() -
					new Date(left.createdAt).getTime()
				);
			})
			.slice(0, 5) ?? [];
	const allDonations =
		campaign?.contributions.slice().sort((left, right) => {
			return (
				new Date(right.createdAt).getTime() -
				new Date(left.createdAt).getTime()
			);
		}) ?? [];
	const topDonations =
		campaign?.contributions.slice().sort((left, right) => {
			if (right.amount !== left.amount) {
				return right.amount - left.amount;
			}
			return (
				new Date(right.createdAt).getTime() -
				new Date(left.createdAt).getTime()
			);
		}) ?? [];
	const donationListItems =
		donationListMode === "top" ? topDonations : allDonations;
	const visibleDonationListItems = donationListItems.slice(
		0,
		donationListVisibleCount,
	);
	const hasMoreDonationItems =
		donationListVisibleCount < donationListItems.length;
	const descriptionWords =
		campaign?.description.trim().split(/\s+/).filter(Boolean) ?? [];
	const hasLongDescription = descriptionWords.length > 150;
	const displayedDescription =
		hasLongDescription && !showFullDescription
			? descriptionWords.slice(0, 150).join(" ")
			: (campaign?.description ?? "");

	const handleShare = async () => {
		if (!campaign) return;

		const shareUrl = window.location.href;
		await navigator.clipboard.writeText(shareUrl);
		toast.success("Lidhja e fushatës u kopjua.");
	};

	const handleDonationSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const activeCampaign = campaign;

		if (!activeCampaign) {
			toast.error("Fushata nuk u gjet.");
			return;
		}

		if (!isAuthenticated && !donateAnonymous) {
			setDonationOpen(false);
			setDonationAuthChoiceOpen(true);
			return;
		}

		const amount = Number(donationAmount);
		if (!Number.isFinite(amount) || amount <= 0) {
			toast.error("Zgjidhni një shumë të vlefshme.");
			return;
		}

		setDonationSubmitting(true);
		try {
			const anonymousDonation = donateAnonymous || !isAuthenticated;
			window.sessionStorage.setItem(
				pendingDonationAmountKey,
				String(amount),
			);
			window.sessionStorage.setItem(
				pendingDonationCampaignKey,
				String(activeCampaign.id),
			);
			window.sessionStorage.setItem(
				pendingDonationAnonymousKey,
				anonymousDonation ? "1" : "0",
			);
			const response = await apiClient.post<
				{ url: string },
				{ amount: number; anonymous: boolean }
			>(`/campaigns/${activeCampaign.id}/checkout-session`, {
				amount,
				anonymous: anonymousDonation,
			});

			setDonationOpen(false);
			window.location.assign(response.url);
		} catch (error) {
			const backendMessage = isAxiosError<{ error?: string }>(error)
				? (error.response?.data?.error ?? error.message)
				: error instanceof Error
					? error.message
					: "Krijimi i checkout-it dështoi.";
			toast.error(backendMessage);
		} finally {
			setDonationSubmitting(false);
		}
	};

	const openDonationFlow = () => {
		if (isAuthenticated) {
			setDonateAnonymous(false);
			setDonationOpen(true);
			return;
		}

		setDonationAuthChoiceOpen(true);
	};

	const handleGuestAnonymousChoice = () => {
		setDonateAnonymous(true);
		setDonationAuthChoiceOpen(false);
		setDonationOpen(true);
	};

	const handleGuestLoginChoice = () => {
		setDonationAuthChoiceOpen(false);
		navigate("/login", {
			state: { from: `${location.pathname}${location.search}` },
		});
	};

	const handleDonationListScroll = (event: UIEvent<HTMLDivElement>) => {
		if (!hasMoreDonationItems) return;

		const container = event.currentTarget;
		const distanceFromBottom =
			container.scrollHeight -
			container.scrollTop -
			container.clientHeight;
		if (distanceFromBottom <= 24) {
			setDonationListVisibleCount((current) =>
				Math.min(current + 10, donationListItems.length),
			);
		}
	};

	useEffect(() => {
		if (!donationListOpen) return;
		setDonationListVisibleCount(10);
	}, [donationListMode, donationListOpen]);

	const handleReportSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const activeCampaign = campaign;

		if (!activeCampaign) {
			toast.error("Fushata nuk u gjet.");
			return;
		}

		if (!isAuthenticated) {
			toast.error(
				"Duhet të hyni në llogari për të raportuar një fushatë.",
			);
			return;
		}

		if (!reportReason) {
			toast.error("Zgjidh një arsye për raportin.");
			return;
		}

		if (!reportMessage.trim()) {
			toast.error("Shkruaj një mesazh për raportin.");
			return;
		}

		setReportSubmitting(true);
		try {
			await apiClient.post<{ message: string }>("/reports", {
				targetType: "campaign",
				targetId: activeCampaign.id,
				reason: reportReason,
				message: reportMessage.trim(),
			});
			toast.success("Raporti u dërgua me sukses.");
			setReportOpen(false);
			setReportReason("");
			setReportMessage("");
		} catch (error) {
			const backendMessage = isAxiosError<{ error?: string }>(error)
				? (error.response?.data?.error ?? error.message)
				: error instanceof Error
					? error.message
					: "Dërgimi i raportit dështoi.";
			toast.error(backendMessage);
		} finally {
			setReportSubmitting(false);
		}
	};

	const navigate = useNavigate();

	const openEditDialog = () => {
		if (!campaign || !canEditCampaign) return;

		setEditMode(isAdmin || isModerator ? "manager" : "creator");
		setEditDraft({
			title: campaign.title,
			description: campaign.description,
			goalAmount: String(campaign.goalAmount),
			status: campaign.status,
			categoryId: String(campaign.categoryId ?? ""),
			coverImage: campaign.coverImage ?? "",
			images: parseMediaSelection(campaign.images),
			videoUrl: campaign.videoUrl ?? "",
		});
		setCreatorAddedPhotos([]);
		setEditDialogOpen(true);
	};

	const openStatusDialog = () => {
		if (!campaign || !canToggleCampaign) return;
		setStatusDialogOpen(true);
	};

	const openDeleteDialog = () => {
		if (!campaign || !canDeleteCampaign) return;
		setDeleteDialogOpen(true);
	};

	const handleEditSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!campaign) return;

		setEditSubmitting(true);
		try {
			const payload =
				editMode === "manager"
					? {
							title: editDraft.title.trim(),
							description: editDraft.description.trim(),
							goalAmount: Number(editDraft.goalAmount),
							status: editDraft.status,
							categoryId: Number(editDraft.categoryId),
							coverImage: normalizeMediaValue(
								editDraft.coverImage,
							),
							images: editDraft.images,
							videoUrl: normalizeMediaValue(editDraft.videoUrl),
						}
					: {
							title: editDraft.title.trim(),
							description: editDraft.description.trim(),
							images: mergeUnique(
								parseMediaSelection(campaign.images),
								creatorAddedPhotos,
							),
						};

			await apiClient.put(`/campaigns/${campaign.id}`, payload);
			toast.success("Fushata u përditësua me sukses.");
			setEditDialogOpen(false);
			setCreatorAddedPhotos([]);
			void fetchCampaign(true);
		} catch (error) {
			const backendMessage = isAxiosError<{ error?: string }>(error)
				? (error.response?.data?.error ?? error.message)
				: error instanceof Error
					? error.message
					: "Përditësimi i fushatës dështoi.";
			toast.error(backendMessage);
		} finally {
			setEditSubmitting(false);
		}
	};

	const handleToggleStatusSubmit = async () => {
		if (!campaign) return;

		const shouldOpen = toggleAction === "open";
		setStatusSubmitting(true);
		try {
			await apiClient.put(
				`/campaigns/${campaign.id}`,
				shouldOpen
					? { status: "active", endDate: null }
					: { status: "failed", endDate: new Date().toISOString() },
			);
			toast.success(
				shouldOpen
					? "Fushata u hap me sukses."
					: "Fushata u mbyll me sukses.",
			);
			setStatusDialogOpen(false);
			void fetchCampaign(true);
		} catch (error) {
			const backendMessage = isAxiosError<{ error?: string }>(error)
				? (error.response?.data?.error ?? error.message)
				: error instanceof Error
					? error.message
					: shouldOpen
						? "Hapja e fushatës dështoi."
						: "Mbyllja e fushatës dështoi.";
			toast.error(backendMessage);
		} finally {
			setStatusSubmitting(false);
		}
	};

	const handleDeleteSubmit = async () => {
		if (!campaign) return;

		setDeleteSubmitting(true);
		try {
			await apiClient.delete(`/campaigns/${campaign.id}`);
			toast.success("Fushata u fshi.");
			setDeleteDialogOpen(false);
			navigate(`/donate`);
		} catch (error) {
			const backendMessage = isAxiosError<{ error?: string }>(error)
				? (error.response?.data?.error ?? error.message)
				: error instanceof Error
					? error.message
					: "Fshirja e fushatës dështoi.";
			toast.error(backendMessage);
		} finally {
			setDeleteSubmitting(false);
		}
	};

	if (loading) {
		return <DetailSkeleton />;
	}

	if (error || !campaign) {
		return (
			<div className="min-h-screen bg-white px-4 py-16">
				<div className="mx-auto w-full max-w-4xl rounded-[28px] border border-border/60 bg-white p-8 shadow-sm sm:p-10">
					<p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
						Fushata nuk u hap
					</p>
					<h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
						Nuk arritëm ta ngarkojmë këtë fushatë.
					</h1>
					<p className="mt-4 text-muted-foreground">
						{error ??
							"Provoni sërish ose kthehuni te lista e fushatave."}
					</p>
					<div className="mt-6 flex flex-wrap gap-3">
						<Button asChild>
							<Link to="/donate">Kthehu te fushatat</Link>
						</Button>
						<Button variant="outline" asChild>
							<Link to="/contact">Na kontakto</Link>
						</Button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-white text-foreground">
			<div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
				<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<Button
						variant="ghost"
						asChild
						className="w-fit px-0 text-muted-foreground hover:text-foreground"
					>
						<Link to="/donate">← Kthehu</Link>
					</Button>
					<div className="flex flex-wrap items-center gap-2 sm:justify-end">
						{canEditCampaign ? (
							<Button size="sm" onClick={openEditDialog}>
								Ndrysho
							</Button>
						) : null}
						{canToggleCampaign ? (
							<Button size="sm" onClick={openStatusDialog}>
								{toggleAction === "open" ? "Hap" : "Mbyll"}
							</Button>
						) : null}
						{canDeleteCampaign ? (
							<Button
								size="sm"
								variant="destructive"
								onClick={openDeleteDialog}
							>
								Fshi
							</Button>
						) : null}
					</div>
				</div>

				<div className="flex items-start justify-between gap-4">
					<h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
						{campaign.title}
					</h1>
				</div>

				<div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
					<div>
						<div className="mt-6">
							<div className="relative aspect-16/10 overflow-hidden rounded-[28px] bg-transparent">
								<img
									src={currentPhoto}
									alt={campaign.title}
									className="absolute inset-0 h-full w-full object-cover object-center"
									loading="eager"
									decoding="async"
									referrerPolicy="no-referrer"
									onError={(event) => {
										const image = event.currentTarget;
										const fallback = buildFallbackImage(
											campaign.title,
											campaign.category?.name,
										);
										if (image.src !== fallback)
											image.src = fallback;
									}}
								/>

								{photos.length > 1 ? (
									<>
										<button
											type="button"
											aria-label="Fotoja e mëparshme"
											onClick={() =>
												setImageIndex(
													(current) =>
														(current -
															1 +
															photos.length) %
														photos.length,
												)
											}
											className="absolute right-16 bottom-4 inline-flex size-8 items-center justify-center rounded-full bg-white/90 text-foreground shadow-sm ring-1 ring-black/5 transition hover:bg-white"
										>
											<ChevronLeft className="size-4" />
										</button>
										<button
											type="button"
											aria-label="Fotoja e radhës"
											onClick={() =>
												setImageIndex(
													(current) =>
														(current + 1) %
														photos.length,
												)
											}
											className="absolute right-4 bottom-4 inline-flex size-8 items-center justify-center rounded-full bg-white/90 text-foreground shadow-sm ring-1 ring-black/5 transition hover:bg-white"
										>
											<ChevronRight className="size-4" />
										</button>
									</>
								) : null}

								{photos.length > 1 ? (
									<div className="absolute bottom-4 left-4 flex items-center gap-1.5 rounded-full bg-black/20 px-2 py-1 backdrop-blur-sm">
										{photos.map((photo, index) => (
											<button
												key={`${photo}-${index}`}
												type="button"
												aria-label={`Shiko foton ${index + 1}`}
												onClick={() =>
													setImageIndex(index)
												}
												className={`h-1.5 w-1.5 shrink-0 rounded-full transition ${index === imageIndex ? "bg-white" : "bg-white/45"}`}
											/>
										))}
									</div>
								) : null}
							</div>
						</div>

						<div className="mt-8 flex items-center gap-3">
							<Avatar className="size-12 border border-border/40">
								<AvatarFallback className="bg-muted text-sm">
									{initials(
										campaign.creator?.emri,
										campaign.creator?.email,
									)}
								</AvatarFallback>
							</Avatar>
							<div>
								<p className="text-base font-semibold text-foreground">
									{organizerName}
								</p>
								<p className="text-sm text-muted-foreground">
									Organizatori i fushatës
								</p>
							</div>
						</div>

						<div className="mt-6 h-px w-full bg-border/40" />

						<div className="mt-6 max-w-3xl space-y-3">
							<p className="whitespace-pre-wrap text-base leading-7 text-foreground/80">
								{displayedDescription}
							</p>
							{hasLongDescription ? (
								<Button
									type="button"
									variant="ghost"
									onClick={() =>
										setShowFullDescription(
											(current) => !current,
										)
									}
									className="h-auto px-0 text-sm font-medium text-muted-foreground hover:bg-transparent hover:text-foreground"
								>
									{showFullDescription
										? "Më pak"
										: "Lexo më shumë"}
								</Button>
							) : null}
						</div>

						<div className="mt-8 flex flex-col gap-3 sm:flex-row">
							<Button
								size="lg"
								onClick={openDonationFlow}
								className="w-full flex-1 rounded-full text-base h-12 sm:h-11 sm:text-sm"
							>
								Dhuro
							</Button>
							<Button
								size="lg"
								variant="outline"
								onClick={handleShare}
								className="w-full flex-1 rounded-full text-base h-12 sm:h-11 sm:text-sm"
							>
								<Share2 className="mr-2 size-4" />
								Shpërnda
							</Button>
						</div>

						<div className="mt-6 h-px w-full bg-border/40" />

						<div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
							<span>
								U krijua {formatCreatedAgo(campaign.createdAt)}
							</span>
							<span
								aria-hidden="true"
								className="text-foreground/40"
							>
								•
							</span>
							<span>{campaign.category?.name ?? "Të tjera"}</span>
						</div>

						<div className="mt-6 h-px w-full bg-border/40" />

						<div className="mt-6 space-y-4">
							<div className="flex items-center justify-between gap-3">
								<div>
									<h2 className="text-lg font-semibold tracking-tight text-foreground">
										Fushata të ngjashme
									</h2>
									<p className="text-sm text-muted-foreground">
										4 fushata nga e njëjta kategori.
									</p>
								</div>
								{campaign.category?.name ? (
									<span className="text-xs text-muted-foreground">
										{campaign.category.name}
									</span>
								) : null}
							</div>

							{relatedCampaigns.length ? (
								<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
									{relatedCampaigns.map((related) => {
										const relatedPhoto =
											related.coverImage ??
											buildFallbackImage(
												related.title,
												related.category?.name,
											);
										const relatedProgress = clampPercent(
											(related.currentAmount /
												related.goalAmount) *
												100,
										);

										return (
											<Link
												key={related.id}
												to={`/donate/${related.id}`}
												className="group overflow-hidden rounded-3xl border border-border/60 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
											>
												<div className="aspect-16/10 overflow-hidden bg-muted">
													<img
														src={relatedPhoto}
														alt={related.title}
														className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
														loading="lazy"
														decoding="async"
														onError={(event) => {
															const image =
																event.currentTarget;
															const fallback =
																buildFallbackImage(
																	related.title,
																	related
																		.category
																		?.name,
																);
															if (
																image.src !==
																fallback
															)
																image.src =
																	fallback;
														}}
													/>
												</div>
												<div className="space-y-2 p-4">
													<div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
														<span>
															{related.category
																?.name ??
																"Të tjera"}
														</span>
														<span>
															{formatCreatedAgo(
																related.createdAt,
															)}
														</span>
													</div>
													<p className="line-clamp-2 text-sm font-semibold leading-5 text-foreground transition group-hover:text-primary">
														{related.title}
													</p>
													<div className="space-y-1">
														<div className="h-1.5 rounded-full bg-muted">
															<div
																className="h-1.5 rounded-full bg-primary"
																style={{
																	width: `${relatedProgress}%`,
																}}
															/>
														</div>
														<p className="text-xs text-muted-foreground">
															{relatedProgress.toFixed(
																0,
															)}
															% i përfunduar
														</p>
													</div>
												</div>
											</Link>
										);
									})}
								</div>
							) : (
								<p className="text-sm text-muted-foreground">
									Nuk gjetëm fushata të ngjashme për këtë
									kategori.
								</p>
							)}
						</div>

						<div className="mt-6 h-px w-full bg-border/40" />

						<div className="mt-5">
							<Button
								variant="outline"
								onClick={() => setReportOpen(true)}
								className="mt-3 w-full rounded-full sm:w-auto"
							>
								<Flag className="mr-2 size-4" />
								Raporto fushatën
							</Button>
						</div>
					</div>

					<aside className="lg:sticky lg:top-8">
						<div className="rounded-[28px] border border-border/60 bg-white p-6 shadow-sm">
							<div className="flex items-center gap-4">
								<div className="relative size-24 shrink-0">
									<svg
										viewBox="0 0 120 120"
										className="size-24 -rotate-90"
									>
										<circle
											cx="60"
											cy="60"
											r="48"
											fill="none"
											stroke="currentColor"
											strokeOpacity="0.12"
											strokeWidth="12"
											className="text-muted-foreground"
										/>
										<circle
											cx="60"
											cy="60"
											r="48"
											fill="none"
											stroke="currentColor"
											strokeWidth="12"
											strokeLinecap="round"
											strokeDasharray={`${progress * 3.015} 301.5`}
											className="text-primary"
										/>
									</svg>
									<div className="absolute inset-0 flex items-center justify-center">
										<div className="text-center">
											<p className="text-sm font-medium text-muted-foreground">
												{progress.toFixed(0)}%
											</p>
										</div>
									</div>
								</div>
								<div>
									<p className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
										{formatCurrency(
											campaign.currentAmount,
											"EUR",
										)}
									</p>
									<p className="text-base text-muted-foreground sm:text-lg">
										nga{" "}
										{formatCurrency(
											campaign.goalAmount,
											"EUR",
										)}
									</p>
									<p className="text-sm text-muted-foreground">
										{formatDonorsCount(
											campaign.backersCount,
										)}
									</p>
								</div>
							</div>

							<div className="mt-5 flex flex-col gap-3">
								<Button
									size="lg"
									onClick={openDonationFlow}
									className="w-full rounded-full text-base h-12 sm:h-11 sm:text-sm"
								>
									Dhuro
								</Button>
								<Button
									size="lg"
									variant="outline"
									onClick={handleShare}
									className="w-full rounded-full text-base h-12 sm:h-11 sm:text-sm"
								>
									<Share2 className="mr-2 size-4" />
									Shpërnda
								</Button>
							</div>

							<div className="mt-6 border-t border-border/60 pt-5">
								<div className="flex items-center justify-between">
									<h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-foreground">
										Donacione të fundit
									</h2>
									<span className="text-xs text-muted-foreground">
										{recentDonations.length} të fundit
									</span>
								</div>

								<div className="mt-4 space-y-3">
									{recentDonations.length ? (
										recentDonations.map((donation) => (
											<div
												key={donation.id}
												className="flex items-center justify-between gap-4 rounded-2xl bg-muted/40 px-4 py-3"
											>
												<div className="flex min-w-0 items-center gap-3">
													<Avatar className="size-9 border border-border/40">
														<AvatarFallback className="bg-muted text-xs font-semibold text-foreground">
															{getDonorAvatarLabel(
																donation,
															)}
														</AvatarFallback>
													</Avatar>
													<div className="min-w-0">
														<p className="truncate text-sm font-medium text-foreground">
															{formatDonorName(
																donation,
															)}
														</p>
														<p className="truncate text-xs text-muted-foreground">
															{formatDonationAgo(
																donation.createdAt,
															)}
														</p>
													</div>
												</div>
												<p className="shrink-0 text-sm font-semibold text-foreground">
													{formatCurrency(
														donation.amount,
														donation.currency,
													)}
												</p>
											</div>
										))
									) : (
										<p className="rounded-2xl bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
											Nuk ka donacione të fundit për të
											shfaqur ende.
										</p>
									)}
								</div>

								{allDonations.length ? (
									<div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
										<Button
											type="button"
											variant="outline"
											className="rounded-full"
											onClick={() => {
												setDonationListMode("all");
												setDonationListOpen(true);
											}}
										>
											Shiko të gjitha
										</Button>
										<Button
											type="button"
											variant="outline"
											className="rounded-full"
											onClick={() => {
												setDonationListMode("top");
												setDonationListOpen(true);
											}}
										>
											Shiko më të lartat
										</Button>
									</div>
								) : null}
							</div>
						</div>
					</aside>
				</div>
			</div>

			<Dialog open={donationListOpen} onOpenChange={setDonationListOpen}>
				<DialogContent className="sm:max-w-2xl">
					<DialogHeader>
						<DialogTitle>Donacionet e fushatës</DialogTitle>
						<DialogDescription>
							Shfaq{" "}
							{donationListMode === "top"
								? "donacionet më të larta"
								: "të gjitha donacionet"}
							.
						</DialogDescription>
					</DialogHeader>

					<div className="flex gap-2">
						<Button
							type="button"
							variant={
								donationListMode === "all"
									? "default"
									: "outline"
							}
							className="rounded-full"
							onClick={() => setDonationListMode("all")}
						>
							Shiko të gjitha
						</Button>
						<Button
							type="button"
							variant={
								donationListMode === "top"
									? "default"
									: "outline"
							}
							className="rounded-full"
							onClick={() => setDonationListMode("top")}
						>
							Shiko më të lartat
						</Button>
					</div>

					<div
						className="max-h-[55vh] space-y-3 overflow-y-auto pr-1"
						onScroll={handleDonationListScroll}
					>
						{visibleDonationListItems.length ? (
							visibleDonationListItems.map((donation) => (
								<div
									key={`modal-${donation.id}-${donation.createdAt}`}
									className="flex items-center justify-between gap-4 rounded-2xl bg-muted/40 px-4 py-3"
								>
									<div className="flex min-w-0 items-center gap-3">
										<Avatar className="size-9 border border-border/40">
											<AvatarFallback className="bg-muted text-xs font-semibold text-foreground">
												{getDonorAvatarLabel(donation)}
											</AvatarFallback>
										</Avatar>
										<div className="min-w-0">
											<p className="truncate text-sm font-medium text-foreground">
												{formatDonorName(donation)}
											</p>
											<p className="truncate text-xs text-muted-foreground">
												{formatDonationAgo(
													donation.createdAt,
												)}
											</p>
										</div>
									</div>
									<p className="shrink-0 text-sm font-semibold text-foreground">
										{formatCurrency(
											donation.amount,
											donation.currency,
										)}
									</p>
								</div>
							))
						) : (
							<p className="rounded-2xl bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
								Nuk ka donacione për t'u shfaqur.
							</p>
						)}
						{hasMoreDonationItems ? (
							<p className="pt-1 text-center text-xs text-muted-foreground">
								Lëviz poshtë për të ngarkuar më shumë…
							</p>
						) : null}
					</div>

					<DialogFooter className="sm:justify-stretch">
						<Button
							type="button"
							size="lg"
							className="h-12 w-full rounded-full text-base font-semibold"
							onClick={() => {
								setDonationListOpen(false);
								openDonationFlow();
							}}
						>
							Dhuro tani
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog
				open={donationAuthChoiceOpen}
				onOpenChange={setDonationAuthChoiceOpen}
			>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Si dëshiron të vazhdosh?</DialogTitle>
						<DialogDescription>
							Mund të hyni në llogari ose të vazhdoni me donacion
							anonim.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={handleGuestLoginChoice}
						>
							Hyr në llogari
						</Button>
						<Button
							type="button"
							onClick={handleGuestAnonymousChoice}
						>
							Dhuro anonim
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
				<DialogContent className="max-h-[90vh] max-w-5xl overflow-hidden rounded-2xl border p-0 shadow-xl">
					<DialogHeader className="border-b bg-muted/40 px-6 py-4">
						<DialogTitle>Ndrysho fushatën</DialogTitle>
						<DialogDescription>
							{editMode === "manager"
								? "Përditëso detajet kryesore, kategorinë, statusin dhe materialet vizuale."
								: "Përditëso titullin, përshkrimin dhe shto foto të reja."}
						</DialogDescription>
					</DialogHeader>

					<form
						onSubmit={handleEditSubmit}
						className="flex max-h-[calc(90vh-110px)] flex-col"
					>
						<div className="space-y-6 overflow-y-auto px-6 py-5">
							<div className="space-y-4 rounded-xl border bg-muted/20 p-5">
								<div>
									<h3 className="font-semibold text-sm">
										Detajet Kryesore
									</h3>
									<p className="text-muted-foreground text-xs">
										{editMode === "manager"
											? "Përditëso titullin, përshkrimin dhe konfigurimin e fushatës."
											: "Përditëso titullin dhe përshkrimin e fushatës."}
									</p>
								</div>
								<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
									<div className="space-y-2 sm:col-span-2">
										<label className="text-sm font-medium text-foreground">
											Titulli
										</label>
										<Input
											value={editDraft.title}
											onChange={(event) =>
												setEditDraft((current) => ({
													...current,
													title: event.target.value,
												}))
											}
										/>
									</div>
								</div>

								<div className="space-y-2">
									<label className="text-sm font-medium text-foreground">
										Përshkrimi
									</label>
									<textarea
										value={editDraft.description}
										onChange={(event) =>
											setEditDraft((current) => ({
												...current,
												description: event.target.value,
											}))
										}
										rows={4}
										className="flex min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
									/>
								</div>
							</div>

							{editMode === "manager" ? (
								<>
									<div className="space-y-4 rounded-xl border bg-muted/20 p-5">
										<div>
											<h3 className="font-semibold text-sm">
												Konfigurimi
											</h3>
											<p className="text-muted-foreground text-xs">
												Përditëso objektivin, kategorinë
												dhe statusin.
											</p>
										</div>
										<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
											<div className="space-y-2">
												<label className="text-sm font-medium text-foreground">
													Objektivi
												</label>
												<Input
													type="number"
													min="1"
													step="1"
													value={editDraft.goalAmount}
													onChange={(event) =>
														setEditDraft(
															(current) => ({
																...current,
																goalAmount:
																	event.target
																		.value,
															}),
														)
													}
												/>
											</div>
											<div className="space-y-2">
												<label className="text-sm font-medium text-foreground">
													Kategoria
												</label>
												<Select
													value={editDraft.categoryId}
													onValueChange={(value) =>
														setEditDraft(
															(current) => ({
																...current,
																categoryId:
																	value,
															}),
														)
													}
												>
													<SelectTrigger>
														<SelectValue placeholder="Zgjidh kategorinë" />
													</SelectTrigger>
													<SelectContent>
														{categories.map(
															(category) => (
																<SelectItem
																	key={
																		category.id
																	}
																	value={String(
																		category.id,
																	)}
																>
																	{
																		category.name
																	}
																</SelectItem>
															),
														)}
													</SelectContent>
												</Select>
											</div>
										</div>

										<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
											<div className="space-y-2">
												<label className="text-sm font-medium text-foreground">
													Statusi
												</label>
												<Select
													value={editDraft.status}
													onValueChange={(value) =>
														setEditDraft(
															(current) => ({
																...current,
																status: value as CampaignStatus,
															}),
														)
													}
												>
													<SelectTrigger>
														<SelectValue placeholder="Zgjidh statusin" />
													</SelectTrigger>
													<SelectContent>
														{campaignStatuses.map(
															(status) => (
																<SelectItem
																	key={status}
																	value={
																		status
																	}
																>
																	{statusLabel(
																		status,
																	)}
																</SelectItem>
															),
														)}
													</SelectContent>
												</Select>
											</div>
										</div>
									</div>

									<div className="space-y-4 rounded-xl border bg-muted/20 p-5">
										<div>
											<h3 className="font-semibold text-sm">
												Media
											</h3>
											<p className="text-muted-foreground text-xs">
												Përditëso cover-in, fotot dhe
												videon e fushatës.
											</p>
										</div>
										<div className="space-y-2">
											<label className="text-sm font-medium text-foreground">
												Cover (foto ose video)
											</label>
											<MediaUpload
												value={
													editDraft.coverImage ||
													undefined
												}
												onChange={(value) =>
													setEditDraft((current) => ({
														...current,
														coverImage: value ?? "",
													}))
												}
											/>
										</div>
										<div className="space-y-2">
											<label className="text-sm font-medium text-foreground">
												Foto shtesë
											</label>
											<PhotoGalleryUpload
												value={editDraft.images}
												onChange={(value) =>
													setEditDraft((current) => ({
														...current,
														images: value,
													}))
												}
											/>
										</div>
										<div className="space-y-2">
											<label className="text-sm font-medium text-foreground">
												Video URL
											</label>
											<Input
												value={editDraft.videoUrl}
												onChange={(event) =>
													setEditDraft((current) => ({
														...current,
														videoUrl:
															event.target.value,
													}))
												}
												placeholder="https://..."
											/>
										</div>
									</div>
								</>
							) : (
								<div className="space-y-4 rounded-xl border bg-muted/20 p-5">
									<div>
										<h3 className="font-semibold text-sm">
											Fotot ekzistuese
										</h3>
										<p className="text-muted-foreground text-xs">
											Mund të shtosh foto të reja pa
											ndryshuar ato ekzistuese.
										</p>
									</div>
									<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
										{parseMediaSelection(
											campaign?.images ?? null,
										).length ? (
											parseMediaSelection(
												campaign?.images ?? null,
											).map((photo, index) => (
												<div
													key={`${photo}-${index}`}
													className="overflow-hidden rounded-xl border border-border/60 bg-muted/20"
												>
													<img
														src={photo}
														alt={`Foto ${index + 1}`}
														className="aspect-square w-full object-cover"
													/>
												</div>
											))
										) : (
											<p className="text-sm text-muted-foreground">
												Nuk ka foto shtesë të ruajtura
												ende.
											</p>
										)}
									</div>
									<div className="space-y-2">
										<label className="text-sm font-medium text-foreground">
											Shto foto të reja
										</label>
										<PhotoGalleryUpload
											value={creatorAddedPhotos}
											onChange={setCreatorAddedPhotos}
										/>
									</div>
								</div>
							)}
						</div>

						<DialogFooter className="border-t bg-background/95 px-6 py-4 backdrop-blur supports-backdrop-filter:bg-background/80">
							<DialogClose asChild>
								<Button variant="outline" type="button">
									Anulo
								</Button>
							</DialogClose>
							<Button type="submit" disabled={editSubmitting}>
								{editSubmitting
									? "Duke ruajtur..."
									: "Ruaj ndryshimet"}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			<Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
				<DialogContent className="sm:max-w-lg">
					<DialogHeader>
						<DialogTitle>
							{toggleAction === "open"
								? "Hap fushatën"
								: "Mbyll fushatën"}
						</DialogTitle>
						<DialogDescription>
							{toggleAction === "open"
								? "Kjo do ta rikthejë fushatën në status aktiv."
								: "Kjo do ta shënojë fushatën si të mbyllur."}
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<DialogClose asChild>
							<Button type="button" variant="outline">
								Anulo
							</Button>
						</DialogClose>
						<Button
							type="button"
							disabled={statusSubmitting}
							onClick={() => void handleToggleStatusSubmit()}
						>
							{statusSubmitting
								? "Duke u përditësuar..."
								: toggleAction === "open"
									? "Hap"
									: "Mbyll"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<DialogContent className="sm:max-w-lg">
					<DialogHeader>
						<DialogTitle>Fshi fushatën?</DialogTitle>
						<DialogDescription>
							Ky veprim është i pakthyeshëm dhe do ta heqë
							fushatën nga platforma.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<DialogClose asChild>
							<Button type="button" variant="outline">
								Anulo
							</Button>
						</DialogClose>
						<Button
							type="button"
							variant="destructive"
							disabled={deleteSubmitting}
							onClick={() => void handleDeleteSubmit()}
						>
							{deleteSubmitting ? "Duke fshirë..." : "Fshi"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<ReportDialog
				open={reportOpen}
				onOpenChange={setReportOpen}
				reportReason={reportReason}
				setReportReason={setReportReason}
				reportMessage={reportMessage}
				setReportMessage={setReportMessage}
				onSubmit={handleReportSubmit}
				submitting={reportSubmitting}
			/>

			<DonationDialog
				open={donationOpen}
				onOpenChange={setDonationOpen}
				campaignTitle={campaign.title}
				campaignCategory={campaign.category?.name ?? "Të tjera"}
				selectedAmount={donationAmount}
				setSelectedAmount={setDonationAmount}
				isAuthenticated={isAuthenticated}
				donateAnonymous={donateAnonymous}
				setDonateAnonymous={setDonateAnonymous}
				presetAmounts={presetDonationAmounts}
				onSubmit={handleDonationSubmit}
				submitting={donationSubmitting}
			/>
		</div>
	);
};

const reportReasons = [
	"Spam ose mashtrim",
	"Përmbajtje e papërshtatshme",
	"Informacion i pasaktë",
	"Shkelje tjetër",
] as const;

function DonationDialog({
	open,
	onOpenChange,
	campaignTitle,
	campaignCategory,
	selectedAmount,
	setSelectedAmount,
	isAuthenticated,
	donateAnonymous,
	setDonateAnonymous,
	presetAmounts,
	onSubmit,
	submitting,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	campaignTitle: string;
	campaignCategory: string;
	selectedAmount: string;
	setSelectedAmount: (value: string) => void;
	isAuthenticated: boolean;
	donateAnonymous: boolean;
	setDonateAnonymous: (value: boolean) => void;
	presetAmounts: number[];
	onSubmit: (event: FormEvent<HTMLFormElement>) => void;
	submitting: boolean;
}) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Dhuro për fushatën</DialogTitle>
					<DialogDescription>
						Zgjidh shumën dhe vazhdo me Stripe Checkout për{" "}
						{campaignCategory.toLowerCase()}.
					</DialogDescription>
				</DialogHeader>

				<div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
					<p className="text-sm font-semibold text-foreground">
						{campaignTitle}
					</p>
					<p className="text-xs text-muted-foreground">
						Pagesë e sigurt përmes Stripe
					</p>
				</div>

				<form onSubmit={onSubmit} className="space-y-4">
					<div className="space-y-2">
						<label className="text-sm font-medium text-foreground">
							Shuma (€) *
						</label>
						<div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
							{presetAmounts.map((amount) => {
								const isActive =
									selectedAmount === String(amount);
								return (
									<Button
										key={amount}
										type="button"
										variant={
											isActive ? "default" : "outline"
										}
										onClick={() =>
											setSelectedAmount(String(amount))
										}
										className="rounded-full"
									>
										€{amount}
									</Button>
								);
							})}
						</div>
						<Input
							type="number"
							min="1"
							step="0.01"
							value={selectedAmount}
							onChange={(event) =>
								setSelectedAmount(event.target.value)
							}
							placeholder="Shuma e personalizuar"
						/>
					</div>

					{isAuthenticated ? (
						<label className="flex items-center gap-2 text-sm text-foreground">
							<input
								type="checkbox"
								checked={donateAnonymous}
								onChange={(event) =>
									setDonateAnonymous(event.target.checked)
								}
								className="size-4 rounded border-border"
							/>
							Dhuro në mënyrë anonime
						</label>
					) : (
						<p className="text-xs text-muted-foreground">
							Ky donacion do të regjistrohet si anonim.
						</p>
					)}

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
							className="w-full sm:w-auto"
						>
							Anulo
						</Button>
						<Button
							type="submit"
							disabled={submitting}
							className="w-full sm:w-auto"
						>
							{submitting
								? "Duke u përgatitur..."
								: "Vazhdo me Stripe"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

function ReportDialog({
	open,
	onOpenChange,
	reportReason,
	setReportReason,
	reportMessage,
	setReportMessage,
	onSubmit,
	submitting,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	reportReason: string;
	setReportReason: (value: string) => void;
	reportMessage: string;
	setReportMessage: (value: string) => void;
	onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
	submitting: boolean;
}) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Raporto fushatën</DialogTitle>
					<DialogDescription>
						Na trego pse kjo fushatë duhet shqyrtuar dhe shto çdo
						detaj që ndihmon ekipin tonë.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={onSubmit} className="space-y-4">
					<div className="space-y-2">
						<label className="text-sm font-medium text-foreground">
							Arsyeja e raportit *
						</label>
						<Select
							value={reportReason}
							onValueChange={setReportReason}
						>
							<SelectTrigger>
								<SelectValue placeholder="Zgjidh arsyen" />
							</SelectTrigger>
							<SelectContent>
								{reportReasons.map((reason) => (
									<SelectItem key={reason} value={reason}>
										{reason}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<label className="text-sm font-medium text-foreground">
							Mesazhi *
						</label>
						<textarea
							value={reportMessage}
							onChange={(event) =>
								setReportMessage(event.target.value)
							}
							rows={5}
							className="flex min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
							placeholder="Shpjego shkurt pse po e raporton këtë fushatë..."
						/>
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
							className="w-full sm:w-auto"
						>
							Anulo
						</Button>
						<Button
							type="submit"
							disabled={submitting}
							className="w-full sm:w-auto"
						>
							{submitting ? "Duke dërguar..." : "Dërgo raportin"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

function DetailSkeleton() {
	return (
		<div className="min-h-screen bg-white">
			<div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
				<div className="mb-6 h-6 w-24 rounded-full bg-muted animate-pulse" />
				<div className="h-10 w-3/4 rounded-full bg-muted animate-pulse" />
				<div className="mt-6 aspect-16/10 w-full rounded-[28px] bg-muted animate-pulse" />
				<div className="mt-8 flex items-center gap-4">
					<div className="size-16 rounded-full bg-muted animate-pulse" />
					<div className="space-y-2">
						<div className="h-5 w-40 rounded-full bg-muted animate-pulse" />
						<div className="h-4 w-28 rounded-full bg-muted animate-pulse" />
					</div>
				</div>
				<div className="mt-6 h-20 w-full max-w-3xl rounded-3xl bg-muted animate-pulse" />
				<div className="mt-8 flex gap-3">
					<div className="h-11 w-32 rounded-full bg-muted animate-pulse" />
					<div className="h-11 w-32 rounded-full bg-muted animate-pulse" />
				</div>
			</div>
		</div>
	);
}

export default CampaignDetail;
