"use client";

import { cn } from "@/lib/utils";
import { Search, HandCoins, BarChart2 } from "lucide-react";
import type React from "react";

// The main props for the HowItWorks component
interface HowItWorksProps extends React.HTMLAttributes<HTMLElement> {}

// The props for a single step card
interface StepCardProps {
	icon: React.ReactNode;
	title: string;
	description: string;
	benefits: string[];
}

/**
 * A single step card within the "How It Works" section.
 * It displays an icon, title, description, and a list of benefits.
 */
const StepCard: React.FC<StepCardProps> = ({
	icon,
	title,
	description,
	benefits,
}) => (
	<div
		className={cn(
			"relative rounded-2xl border bg-card p-6 text-card-foreground transition-all duration-300 ease-in-out",
			"hover:scale-105 hover:shadow-lg hover:border-primary/50 hover:bg-muted",
		)}
	>
		{/* Icon */}
		<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-primary">
			{icon}
		</div>
		{/* Title and Description */}
		<h3 className="mb-2 text-xl font-semibold">{title}</h3>
		<p className="mb-6 text-muted-foreground">{description}</p>
		{/* Benefits List */}
		<ul className="space-y-3">
			{benefits.map((benefit, index) => (
				<li key={index} className="flex items-center gap-3">
					<div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/20">
						<div className="h-2 w-2 rounded-full bg-primary"></div>
					</div>
					<span className="text-muted-foreground">{benefit}</span>
				</li>
			))}
		</ul>
	</div>
);

/**
 * A responsive "How It Works" section that displays a 3-step process.
 * It is styled with shadcn/ui theme variables to support light and dark modes.
 */
export const HowItWorks: React.FC<HowItWorksProps> = ({
	className,
	...props
}) => {
	const stepsData = [
		{
			icon: <Search className="h-6 w-6" />,
			title: "Zgjidh një fushatë",
			description:
				"Zgjidh kauzën që dëshiron të mbështesësh dhe shiko menjëherë nevojat, qëllimin dhe progresin e saj.",
			benefits: [
				"Shfleto kauzat më të rëndësishme në një vend",
				"Shiko shpejt qëllimin dhe përparimin e fushatës",
				"Gjej lehtë një kauzë që të prek",
			],
		},
		{
			icon: <HandCoins className="h-6 w-6" />,
			title: "Dhuro në mënyrë të sigurt",
			description:
				"Kontribuo përmes një procesi të qartë dhe të mbrojtur, pa hapa të panevojshëm.",
			benefits: [
				"Pagesë e thjeshtë dhe e besueshme",
				"Transparencë për mënyrën si përdoren fondet",
				"Përvojë e optimizuar për çdo pajisje",
			],
		},
		{
			icon: <BarChart2 className="h-6 w-6" />,
			title: "Ndiq ndikimin",
			description:
				"Shiko se si kontributi yt po ndihmon kauzën dhe ndiq rezultatet që krijohen me kalimin e kohës.",
			benefits: [
				"Përditësime të qarta mbi progresin",
				"Rezultate që tregojnë ndikimin real",
				"Motivim për të vazhduar mbështetjen",
			],
		},
	];

	return (
		<section
			id="how-it-works"
			className={cn("w-full bg-background py-16 sm:py-24", className)}
			{...props}
		>
			<div className="container mx-auto px-4">
				{/* Section Header */}
				<div className="mx-auto mb-16 max-w-4xl text-center">
					<h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl md:text-4xl">
						Si funksionon
					</h2>
					<p className="mt-4 text-foreground/70 md:text-lg leading-relaxed">
						Tre hapa të thjeshtë që e bëjnë dhurimin më të qartë, më
						të sigurt dhe më të lehtë për t’u ndjekur.
					</p>
				</div>

				{/* Step Indicators with Connecting Line */}
				<div className="relative mx-auto mb-8 w-full max-w-4xl">
					<div
						aria-hidden="true"
						className="absolute left-[16.6667%] top-1/2 h-0.5 w-[66.6667%] -translate-y-1/2 bg-border"
					></div>
					{/* Use grid to align numbers with the card grid below */}
					<div className="relative grid grid-cols-3">
						{stepsData.map((_, index) => (
							<div
								key={index}
								// Center the number within its grid column
								className="flex h-8 w-8 items-center justify-center justify-self-center rounded-full bg-muted font-semibold text-foreground ring-4 ring-background"
							>
								{index + 1}
							</div>
						))}
					</div>
				</div>

				{/* Steps Grid */}
				<div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-3">
					{stepsData.map((step, index) => (
						<StepCard
							key={index}
							icon={step.icon}
							title={step.title}
							description={step.description}
							benefits={step.benefits}
						/>
					))}
				</div>
			</div>
		</section>
	);
};

export default HowItWorks;
