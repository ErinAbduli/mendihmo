import { Badge } from "@/components/ui/badge";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";

const items = [
	{
		title: "Mjekim Urgjent për Aronin",
		raised: "€12,400",
		goal: "€15,000",
		progress: 83,
		header: (
			<img
				src="https://images.unsplash.com/photo-1631815589968-fdb09a223b1e?w=900&auto=format&fit=crop&q=60"
				alt="Kampanjë humanitare për trajtim mjekësor"
				className="h-full w-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
			/>
		),
		className: "md:col-span-2",
	},
	{
		title: "Pajisje për Shkollën e Fshatit",
		raised: "€8,200",
		goal: "€8,200",
		progress: 100,
		header: (
			<img
				src="https://images.unsplash.com/photo-1509062522246-3755977927d7?w=900&auto=format&fit=crop&q=60"
				alt="Nxënës në klasë që përfitojnë nga donacionet"
				className="h-full w-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
			/>
		),
		className: "md:col-span-1",
	},
	{
		title: "Strehim për Familjet në Nevojë",
		raised: "€6,950",
		goal: "€10,000",
		progress: 69,
		header: (
			<img
				src="https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=900&auto=format&fit=crop&q=60"
				alt="Familje që marrin mbështetje nga komuniteti"
				className="h-full w-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
			/>
		),
		className: "md:col-span-1",
	},
	{
		title: "Rehabilitim për të Moshuarit",
		raised: "€5,300",
		goal: "€7,500",
		progress: 71,
		header: (
			<img
				src="https://images.unsplash.com/photo-1516307365426-bea591f05011?w=900&auto=format&fit=crop&q=60"
				alt="Kujdes dhe rehabilitim për të moshuarit"
				className="h-full w-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
			/>
		),
		className: "md:col-span-2",
	},
];

const SuccessfulCampaignsWeek = () => {
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

				<BentoGrid>
					{items.map((item, i) => (
						<BentoGridItem
							key={i}
							title={item.title}
							header={item.header}
							footer={
								<div className="space-y-1.5">
									<div className="h-2 w-full overflow-hidden rounded-full bg-muted">
										<div
											className="h-full rounded-full bg-linear-to-r from-primary via-primary/85 to-accent"
											style={{
												width: `${item.progress}%`,
											}}
										/>
									</div>
									<p className="text-sm font-semibold tracking-tight text-foreground/90 sm:text-base">
										Te mbledhura: {item.raised}
									</p>
								</div>
							}
							className={item.className}
						/>
					))}
				</BentoGrid>
			</div>
		</section>
	);
};

export default SuccessfulCampaignsWeek;
