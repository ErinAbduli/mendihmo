import { useEffect, useRef, useState } from "react";
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, HandCoins, HeartHandshake, Users } from "lucide-react";

type StatItem = {
	title: string;
	value: number;
	subtitle: string;
	icon: React.ComponentType<{ className?: string }>;
	format: (value: number) => string;
};

const stats = [
	{
		title: "Kauza Totale",
		value: 1240,
		subtitle: "+12% këtë muaj",
		icon: HeartHandshake,
		format: (value: number) => `${value.toLocaleString("en-US")}+`,
	},
	{
		title: "Donacione Totale",
		value: 890000,
		subtitle: "+8.4% nga java e kaluar",
		icon: HandCoins,
		format: (value: number) => `€${value.toLocaleString("en-US")}+`,
	},
	{
		title: "Përdorues Aktivë",
		value: 34000,
		subtitle: "247 online tani",
		icon: Users,
		format: (value: number) => `${value.toLocaleString("en-US")}+`,
	},
] satisfies StatItem[];

const CountUpValue = ({
	value,
	format,
	start,
	duration = 1400,
	delay = 0,
}: {
	value: number;
	format: (value: number) => string;
	start: boolean;
	duration?: number;
	delay?: number;
}) => {
	const [displayValue, setDisplayValue] = useState(0);
	const prefersReducedMotion =
		typeof window !== "undefined" &&
		window.matchMedia("(prefers-reduced-motion: reduce)").matches;

	useEffect(() => {
		if (!start || prefersReducedMotion) {
			return;
		}

		let frameId = 0;
		const startTime = performance.now();

		const tick = (now: number) => {
			const elapsed = now - startTime;
			const progress = Math.min(elapsed / duration, 1);
			const easedProgress = 1 - Math.pow(1 - progress, 3);

			setDisplayValue(Math.round(value * easedProgress));

			if (progress < 1) {
				frameId = requestAnimationFrame(tick);
			}
		};

		const timeoutId = window.setTimeout(() => {
			frameId = requestAnimationFrame(tick);
		}, delay);

		return () => {
			window.clearTimeout(timeoutId);
			if (frameId) {
				cancelAnimationFrame(frameId);
			}
		};
	}, [duration, delay, value, start, prefersReducedMotion]);

	const renderedValue = start
		? prefersReducedMotion
			? value
			: displayValue
		: 0;

	return <>{format(renderedValue)}</>;
};

const PlaftormStats = () => {
	const sectionRef = useRef<HTMLElement | null>(null);
	const [hasStarted, setHasStarted] = useState(false);

	useEffect(() => {
		const section = sectionRef.current;

		if (!section || hasStarted) {
			return;
		}

		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					setHasStarted(true);
					observer.disconnect();
				}
			},
			{
				threshold: 0.25,
				rootMargin: "0px 0px -10% 0px",
			},
		);

		observer.observe(section);

		return () => observer.disconnect();
	}, [hasStarted]);

	return (
		<section ref={sectionRef} className="mt-4 px-4 pb-16 sm:mt-6 sm:pb-20">
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
							<Card
								key={index}
								className="relative overflow-hidden border-border/60 bg-card/90 shadow-sm backdrop-blur supports-backdrop-filter:bg-card/70"
							>
								<div className="pointer-events-none absolute inset-0 bg-linear-to-br from-accent/20 via-transparent to-primary/10" />
								<CardHeader className="relative gap-3">
									<div className="flex items-center justify-between">
										<div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
											<Icon className="h-5 w-5" />
										</div>
										<ArrowUpRight className="h-4 w-4 text-muted-foreground" />
									</div>
									<CardDescription className="text-sm">
										{stat.title}
									</CardDescription>
									<CardTitle className="text-3xl tracking-tight sm:text-4xl">
										<CountUpValue
											value={stat.value}
											format={stat.format}
											start={hasStarted}
											delay={index * 150}
										/>
									</CardTitle>
									<p className="text-sm text-primary">
										{stat.subtitle}
									</p>
								</CardHeader>
							</Card>
						);
					})}
				</div>
			</div>
		</section>
	);
};

export default PlaftormStats;
