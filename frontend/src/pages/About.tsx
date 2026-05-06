import { Link } from "react-router";
import { CheckCircle2, HeartHandshake, ShieldCheck, Sparkles, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const values = [
	{
		title: "Besim i ndërsjellë",
		description:
			"Çdo fushatë kalon në shqyrtim para publikimit që komuniteti të ndihet i sigurt kur dhuron.",
		icon: ShieldCheck,
	},
	{
		title: "Njerëzit në qendër",
		description:
			"Platforma është ndërtuar për njerëzit që kanë nevojë dhe për ata që duan të ndihmojnë pa pengesa.",
		icon: Users,
	},
	{
		title: "Veprim i shpejtë",
		description:
			"Qëllimi ynë është të lidhim nevojën me mbështetjen sa më shpejt, me një proces të thjeshtë.",
		icon: Sparkles,
	},
];

const impactStats = [
	{ label: "Fushata aktive", value: "1,200+" },
	{ label: "Donatorë", value: "25,000+" },
	{ label: "Mbledhur", value: "€3.4M+" },
	{ label: "Qytete të mbuluara", value: "80+" },
];

const steps = [
	{
		title: "Krijo një fushatë",
		description:
			"Përshkruaj situatën, vendos objektivin dhe ngarko materialet që e bëjnë historinë të qartë.",
	},
	{
		title: "Verifikohet dhe publikohet",
		description:
			"Fushata kalon një verifikim të shpejtë për besueshmëri, pastaj del publike për komunitetin.",
	},
	{
		title: "Publikohet dhe mbështetet",
		description:
			"Komuniteti dhuron, shpërndan dhe ndihmon që objektivi të arrihet më shpejt.",
	},
];

const About = () => {
	return (
		<div className="min-h-screen bg-background">
			<section className="border-b border-border/60 bg-muted/20">
				<div className="mx-auto w-full max-w-6xl px-4 py-14 md:py-20">
					<div className="grid gap-8 md:grid-cols-[1.2fr_0.8fr] md:items-center">
						<div className="space-y-5">
							<Badge variant="secondary" className="w-fit">
								Mbi ne
							</Badge>
							<h1 className="font-heading text-3xl font-semibold tracking-tight md:text-5xl">
								Një platformë ku njerëzit ndihmojnë njerëzit
							</h1>
							<p className="max-w-prose text-muted-foreground md:text-lg">
								Mendihmo është ndërtuar me të njëjtin parim që e bëri crowdfunding-un
								global kaq të fuqishëm: kur një histori preket nga komuniteti, ndihma
								vjen shpejt. Ne e bëjmë këtë proces të thjeshtë, transparent dhe të
								bazuar në besim.
							</p>
							<div className="flex flex-wrap gap-3">
								<Button asChild>
									<Link to="/start-campaign">Fillo një kauzë</Link>
								</Button>
								<Button asChild variant="outline">
									<Link to="/donate">Shiko fushatat</Link>
								</Button>
							</div>
						</div>

						<Card className="border-primary/20 bg-background">
							<CardHeader>
								<CardTitle>Pse ekzistojmë</CardTitle>
								<CardDescription>
									Të japim mundësinë që secili të kërkojë dhe të japë ndihmë me dinjitet.
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4 text-sm text-muted-foreground">
								<div className="flex items-start gap-3">
									<HeartHandshake className="mt-0.5 size-4 text-primary" />
									<p>Mbështetje për raste personale, familjare dhe komunitare.</p>
								</div>
								<div className="flex items-start gap-3">
									<ShieldCheck className="mt-0.5 size-4 text-primary" />
									<p>Shqyrtim i fushatave para publikimit për më shumë besim.</p>
								</div>
								<div className="flex items-start gap-3">
									<Users className="mt-0.5 size-4 text-primary" />
									<p>Një komunitet që kontribuon për ndryshim real.</p>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</section>

			<section className="mx-auto w-full max-w-6xl px-4 py-8 md:py-10">
				<div className="grid grid-cols-2 gap-3 md:grid-cols-4">
					{impactStats.map((stat) => (
						<Card key={stat.label}>
							<CardContent className="p-4">
								<p className="text-2xl font-semibold tracking-tight">{stat.value}</p>
								<p className="text-xs text-muted-foreground">{stat.label}</p>
							</CardContent>
						</Card>
					))}
				</div>
			</section>

			<section className="mx-auto w-full max-w-6xl px-4 py-4 md:py-6">
				<div className="grid gap-4 md:grid-cols-3">
					{values.map((value) => {
						const Icon = value.icon;
						return (
							<Card key={value.title}>
								<CardHeader>
									<div className="mb-2 w-fit rounded-full bg-primary/10 p-2 text-primary">
										<Icon className="size-4" />
									</div>
									<CardTitle className="text-xl">{value.title}</CardTitle>
								</CardHeader>
								<CardContent>
									<p className="text-sm text-muted-foreground">{value.description}</p>
								</CardContent>
							</Card>
						);
					})}
				</div>
			</section>

			<section className="border-y border-border/60 bg-muted/20">
				<div className="mx-auto w-full max-w-6xl px-4 py-10 md:py-12">
					<div className="mb-6 space-y-2">
						<h2 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
							Si funksionon
						</h2>
						<p className="text-muted-foreground">
							3 hapa të thjeshtë, të ngjashëm me eksperiencën e platformave moderne të
							crowdfunding.
						</p>
					</div>

					<div className="grid gap-4 md:grid-cols-3">
						{steps.map((step, index) => (
							<Card key={step.title} className="bg-background">
								<CardHeader>
									<Badge variant="outline" className="w-fit">
										Hapi {index + 1}
									</Badge>
									<CardTitle className="text-xl">{step.title}</CardTitle>
								</CardHeader>
								<CardContent>
									<p className="text-sm text-muted-foreground">{step.description}</p>
								</CardContent>
							</Card>
						))}
					</div>
				</div>
			</section>

			<section className="mx-auto w-full max-w-6xl px-4 py-10 md:py-12">
				<Card>
					<CardHeader>
						<CardTitle>Besim dhe transparencë</CardTitle>
						<CardDescription>
							Ne përpiqemi që çdo donator ta dijë qartë ku po shkon ndihma e tij.
						</CardDescription>
					</CardHeader>
					<CardContent className="grid gap-3 md:grid-cols-2">
						<div className="flex items-start gap-2 text-sm text-muted-foreground">
							<CheckCircle2 className="mt-0.5 size-4 text-primary" />
							<span>Shqyrtim paraprak i fushatave para publikimit.</span>
						</div>
						<div className="flex items-start gap-2 text-sm text-muted-foreground">
							<CheckCircle2 className="mt-0.5 size-4 text-primary" />
							<span>Status i qartë i fushatës: në shqyrtim, aktive, e mbyllur.</span>
						</div>
						<div className="flex items-start gap-2 text-sm text-muted-foreground">
							<CheckCircle2 className="mt-0.5 size-4 text-primary" />
							<span>Përditësime nga organizatori për progresin e mbështetjes.</span>
						</div>
						<div className="flex items-start gap-2 text-sm text-muted-foreground">
							<CheckCircle2 className="mt-0.5 size-4 text-primary" />
							<span>Eksperiencë e thjeshtë dhurimi në pak hapa.</span>
						</div>
					</CardContent>
				</Card>
			</section>

			<section className="mx-auto w-full max-w-6xl px-4 py-12">
				<Card className="border-primary/20 bg-primary/5">
					<CardHeader>
						<CardTitle className="text-2xl">Gati të bëhesh pjesë e ndryshimit?</CardTitle>
						<CardDescription>
							Qoftë duke krijuar një fushatë ose duke dhuruar, çdo veprim ka peshë.
						</CardDescription>
					</CardHeader>
					<CardContent className="flex flex-wrap gap-3">
						<Button asChild>
							<Link to="/start-campaign">Krijo fushatë</Link>
						</Button>
						<Button asChild variant="outline">
							<Link to="/donate">Dhuro tani</Link>
						</Button>
						<Button asChild variant="ghost">
							<Link to="/contact">Na kontakto</Link>
						</Button>
					</CardContent>
				</Card>
			</section>
		</div>
	);
};

export default About;
