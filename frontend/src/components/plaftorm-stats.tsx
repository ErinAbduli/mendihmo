import type { ComponentType } from "react";
import { Badge } from "@/components/ui/badge";
import { HandCoins, HeartHandshake, Users } from "lucide-react";
import StatisticsWithStatus, {
	type StatisticsCardProps,
} from "@/components/shadcn-studio/blocks/statistics-with-status";

type StatItem = {
	title: string;
	value: string;
	subtitle: string;
	status: StatisticsCardProps["status"];
	icon: ComponentType<{ className?: string }>;
};

const stats = [
	{
		title: "Kauza Totale",
		value: "1,240+",
		subtitle: "+12% këtë muaj",
		status: "within",
		icon: HeartHandshake,
	},
	{
		title: "Donacione Totale",
		value: "€890,000+",
		subtitle: "+8.4% nga java e kaluar",
		status: "within",
		icon: HandCoins,
	},
	{
		title: "Përdorues Aktivë",
		value: "34,000+",
		subtitle: "247 online tani",
		status: "observe",
		icon: Users,
	},
] satisfies StatItem[];

const PlaftormStats = () => {
	return (
		<section className="mt-4 px-4 pb-16 sm:mt-6 sm:pb-20">
			<div className="mx-auto w-full max-w-(--breakpoint-xl) px-4">
				<div className="mx-auto mb-10 max-w-3xl text-center">
					<Badge
						variant="secondary"
						className="rounded-full border-accent/50 bg-accent/10 px-3 py-1 text-accent-foreground"
					>
						Impakti i platformës
					</Badge>
					<h2 className="mt-4 font-semibold text-2xl tracking-tight sm:text-3xl md:text-4xl">
						Çfarë kemi arritur së bashku
					</h2>
					<p className="mt-4 text-foreground/70 md:text-lg leading-relaxed">
						Çdo kontribut, i madh apo i vogël, krijon një ndikim që
						shkon përtej numrave.
					</p>
				</div>

				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{stats.map((stat, index) => {
						const Icon = stat.icon;

						return (
							<StatisticsWithStatus
								key={index}
								title={stat.title}
								value={stat.value}
								range={stat.subtitle}
								status={stat.status}
								icon={<Icon className="h-5 w-5" />}
							/>
						);
					})}
				</div>
			</div>
		</section>
	);
};

export default PlaftormStats;
