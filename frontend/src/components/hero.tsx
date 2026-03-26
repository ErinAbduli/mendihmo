import { ArrowUpRight, HandHelping } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function Hero() {
	return (
		<div className="relative overflow-x-hidden overflow-y-visible pb-12 sm:pb-14">
			<div className="absolute inset-0 -z-10">
				<div className="absolute top-0 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl"></div>
				<div className="absolute bottom-8 left-1/4 h-96 w-96 rounded-full bg-primary/10 blur-3xl sm:bottom-12"></div>
			</div>
			<div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-28 bg-linear-to-b from-transparent via-background/60 to-background blur-xl sm:h-36" />

			<div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-(--breakpoint-xl) items-center justify-center px-4">
				<div className="relative z-10 max-w-3xl text-center">
					<Badge
						asChild
						className="rounded-full border-accent/50 bg-accent/10 py-1 text-accent-foreground"
						variant="secondary"
					>
						<span>
							Platforma #1 për bamirësi & mbledhje fondesh{" "}
						</span>
					</Badge>
					<h1 className="mt-6 bg-linear-to-r from-foreground to-foreground/80 bg-clip-text font-semibold text-4xl tracking-tighter text-transparent sm:text-5xl md:text-6xl md:leading-[1.2] lg:text-7xl">
						Bashkë mund të bëjmë gjithçka
					</h1>
					<p className="mt-6 text-foreground/70 md:text-lg leading-relaxed">
						Mëndihmo është platforma shqiptare e bamirësisë dhe
						financimit kolektiv ku çdokush mund të nisë një kauzë
						ose të mbështesë ato që i beson. Nga nevojat emergjente
						deri te ëndrrat e mëdha çdo kontribut ka rëndësi.
					</p>
					<div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
						<Button
							className="rounded-md text-base font-semibold shadow-lg hover:shadow-xl transition-shadow px-5"
							size="lg"
						>
							Fillo një kauzë{" "}
							<ArrowUpRight className="h-5 w-5 ml-2" />
						</Button>
						<Button
							className="rounded-md text-base font-semibold border-accent/30 bg-accent/5 text-secondary-foreground hover:bg-accent/15 hover:text-primary shadow-md hover:shadow-lg transition-all px-5"
							size="lg"
							variant="outline"
						>
							<HandHelping className="h-5 w-5 mr-2" /> Ndihmo të
							tjerët
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
