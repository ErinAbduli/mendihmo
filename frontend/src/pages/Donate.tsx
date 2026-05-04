import { useMemo, useState } from "react";
import { Link } from "react-router";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type CampaignCategory =
	| "Urgjente"
	| "Mjekësi"
	| "Arsim"
	| "Komunitet"
	| "Kafshë"
	| "Fatkeqësi";

type Campaign = {
	id: string;
	title: string;
	organizer: string;
	location?: string;
	category: CampaignCategory;
	/** Cover për kartën — në prod zakonisht URL nga backend / upload i organizatorit. */
	imageUrl: string;
	goalEuro: number;
	raisedEuro: number;
	donors: number;
	createdDaysAgo: number;
	featured?: boolean;
};

const CATEGORIES: CampaignCategory[] = [
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

function campaignCoverFallback(category: CampaignCategory, title: string) {
	const palette: Record<CampaignCategory, { bg: string; fg: string }> = {
		Urgjente: { bg: "#ef4444", fg: "#ffffff" },
		"Mjekësi": { bg: "#0ea5e9", fg: "#ffffff" },
		Arsim: { bg: "#8b5cf6", fg: "#ffffff" },
		Komunitet: { bg: "#14b8a6", fg: "#062925" },
		"Kafshë": { bg: "#f59e0b", fg: "#2a1700" },
		"Fatkeqësi": { bg: "#334155", fg: "#ffffff" },
	};

	const { bg, fg } = palette[category];
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

const Donate = () => {
	const [query, setQuery] = useState("");
	const [category, setCategory] = useState<CampaignCategory | "Të gjitha">(
		"Të gjitha",
	);

	const featured = useMemo(
		() => CAMPAIGNS.filter((c) => c.featured),
		[],
	);

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();
		return CAMPAIGNS.filter((c) => {
			const matchesCategory = category === "Të gjitha" || c.category === category;
			const matchesQuery =
				q.length === 0 ||
				c.title.toLowerCase().includes(q) ||
				c.organizer.toLowerCase().includes(q) ||
				(c.location ?? "").toLowerCase().includes(q);

			return matchesCategory && matchesQuery;
		});
	}, [category, query]);

	return (
		<div className="bg-background">
			<section className="border-b border-border/60">
				<div className="mx-auto w-full max-w-6xl px-4 py-10 md:py-14">
					<div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr] md:items-center">
						<div className="space-y-4">
							<Badge variant="secondary" className="w-fit">
								Dhuro • Ndihmo dikë sot
							</Badge>
							<h1 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
								Gjej një fushatë për të mbështetur
							</h1>
							<p className="max-w-prose text-muted-foreground">
								Strukturë e stilit GoFundMe: kërko, filtro sipas kategorisë, shiko
								progresin dhe dhuro me disa klikime.
							</p>

							<div className="flex flex-col gap-3 sm:flex-row">
								<div className="flex-1">
									<Input
										value={query}
										onChange={(e) => setQuery(e.target.value)}
										placeholder="Kërko fushata, organizator, qytet…"
										aria-label="Kërko fushata"
									/>
								</div>
								<Button asChild className="sm:w-auto">
									<Link to="/start-campaign">Nis një fushatë</Link>
								</Button>
							</div>
						</div>

						<Card className="bg-card/60">
							<CardHeader>
								<CardTitle>Si funksionon</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3 text-muted-foreground">
								<div className="flex items-start gap-3">
									<div className="mt-0.5 size-2 rounded-full bg-primary" />
									<p>Kërko një fushatë që të prek.</p>
								</div>
								<div className="flex items-start gap-3">
									<div className="mt-0.5 size-2 rounded-full bg-primary" />
									<p>Shiko qëllimin dhe progresin.</p>
								</div>
								<div className="flex items-start gap-3">
									<div className="mt-0.5 size-2 rounded-full bg-primary" />
									<p>Dhuro dhe shpërndaje me miqtë.</p>
								</div>
							</CardContent>
							<CardFooter className="border-t border-border/60">
								<Button variant="outline" asChild className="w-full">
									<Link to="/start-campaign">Krijo fushatën tënde</Link>
								</Button>
							</CardFooter>
						</Card>
					</div>
				</div>
			</section>

			<section className="mx-auto w-full max-w-6xl px-4 py-8 md:py-10">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div className="space-y-1">
						<h2 className="font-heading text-xl font-semibold tracking-tight">
							Fushata të zgjedhura
						</h2>
						<p className="text-sm text-muted-foreground">
							Disa shembuj për ta nisur eksplorimin.
						</p>
					</div>
					<Button variant="ghost" onClick={() => setQuery("")}>
						Pastro kërkimin
					</Button>
				</div>

				<div className="mt-5 grid gap-4 md:grid-cols-2">
					{featured.map((c) => (
						<CampaignCard key={c.id} campaign={c} />
					))}
				</div>
			</section>

			<section className="mx-auto w-full max-w-6xl px-4 pb-14">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div className="space-y-1">
						<h2 className="font-heading text-xl font-semibold tracking-tight">
							Eksploro të gjitha fushatat
						</h2>
						<p className="text-sm text-muted-foreground">
							Filtro sipas kategorisë ose kërko me fjalë kyçe.
						</p>
					</div>
					<div className="flex flex-wrap gap-2">
						<CategoryChip
							active={category === "Të gjitha"}
							onClick={() => setCategory("Të gjitha")}
						>
							Të gjitha
						</CategoryChip>
						{CATEGORIES.map((c) => (
							<CategoryChip
								key={c}
								active={category === c}
								onClick={() => setCategory(c)}
							>
								{c}
							</CategoryChip>
						))}
					</div>
				</div>

				<div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{filtered.map((c) => (
						<CampaignCard key={c.id} campaign={c} />
					))}
				</div>

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

function CategoryChip({
	active,
	onClick,
	children,
}: {
	active: boolean;
	onClick: () => void;
	children: string;
}) {
	return (
		<Button
			type="button"
			variant={active ? "secondary" : "outline"}
			size="sm"
			onClick={onClick}
			className={cn("rounded-full", active && "ring-1 ring-ring/30")}
		>
			{children}
		</Button>
	);
}

function CampaignCard({ campaign }: { campaign: Campaign }) {
	const progress = clampPercent((campaign.raisedEuro / campaign.goalEuro) * 100);
	return (
		<Card className="transition-shadow hover:shadow-md">
			<img
				src={campaign.imageUrl}
				alt={campaign.title}
				className="aspect-[16/10] w-full object-cover"
				loading="lazy"
				decoding="async"
				referrerPolicy="no-referrer"
				onError={(e) => {
					const img = e.currentTarget;
					const fallback = campaignCoverFallback(campaign.category, campaign.title);
					if (img.src !== fallback) img.src = fallback;
				}}
			/>
			<CardHeader className="gap-2">
				<div className="flex flex-wrap items-center gap-2">
					<Badge variant="outline">{campaign.category}</Badge>
					<span className="text-xs text-muted-foreground">
						{campaign.createdDaysAgo} ditë më parë
					</span>
				</div>
				<CardTitle className="line-clamp-2">{campaign.title}</CardTitle>
				<div className="text-sm text-muted-foreground">
					Organizuar nga <span className="text-foreground">{campaign.organizer}</span>
					{campaign.location ? (
						<span className="text-muted-foreground"> • {campaign.location}</span>
					) : null}
				</div>
			</CardHeader>

			<CardContent className="space-y-3">
				<div className="space-y-1.5">
					<div className="flex items-center justify-between text-sm">
						<span className="font-medium text-foreground">
							{formatEuro(campaign.raisedEuro)}
						</span>
						<span className="text-muted-foreground">
							qëllimi {formatEuro(campaign.goalEuro)}
						</span>
					</div>
					<div className="h-2 w-full overflow-hidden rounded-full bg-muted">
						<div
							className="h-full rounded-full bg-primary transition-[width]"
							style={{ width: `${progress}%` }}
							aria-label="Progresi i mbledhjes"
						/>
					</div>
					<div className="flex items-center justify-between text-xs text-muted-foreground">
						<span>{campaign.donors} donatorë</span>
						<span>{progress.toFixed(0)}%</span>
					</div>
				</div>
			</CardContent>

			<CardFooter className="border-t border-border/60">
				<Button className="w-full" asChild>
					<Link to="/donate">Dhuro tani</Link>
				</Button>
			</CardFooter>
		</Card>
	);
}

export default Donate;