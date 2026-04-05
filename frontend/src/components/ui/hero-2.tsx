"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface AuroraHeroProps {
	children: React.ReactNode;
	className?: string;
}

/**
 * Injects the CSS keyframes for the aurora animation.
 */
const AuroraAnimation = () => (
	<style>
		{`
      @keyframes aurora-1 {
        0% { transform: translate(0%, 0%) scale(1); }
        25% { transform: translate(20%, -20%) scale(1.2); }
        50% { transform: translate(-20%, 20%) scale(0.8); }
        75% { transform: translate(10%, -10%) scale(1.1); }
        100% { transform: translate(0%, 0%) scale(1); }
      }
      @keyframes aurora-2 {
        0% { transform: translate(0%, 0%) scale(1); }
        25% { transform: translate(-20%, 20%) scale(1.1); }
        50% { transform: translate(20%, -20%) scale(0.9); }
        75% { transform: translate(-10%, 10%) scale(1.2); }
        100% { transform: translate(0%, 0%) scale(1); }
      }
			@keyframes aurora-3 {
				0% { transform: translate(0%, 0%) scale(1); }
				25% { transform: translate(10%, 25%) scale(1.15); }
				50% { transform: translate(-25%, -10%) scale(0.9); }
				75% { transform: translate(20%, 15%) scale(1.05); }
				100% { transform: translate(0%, 0%) scale(1); }
			}
    `}
	</style>
);

export const AuroraHero = ({ children, className }: AuroraHeroProps) => {
	return (
		<div className="h-full w-full">
			<AuroraAnimation />
			<div
				className={cn(
					"relative flex h-screen w-full flex-col items-center justify-center overflow-hidden rounded-md bg-background antialiased",
					className,
				)}
			>
				{/* The Aurora Background */}
				<div className="absolute inset-0 z-0">
					<div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,color-mix(in_oklab,var(--primary)_12%,transparent),transparent_56%),radial-gradient(circle_at_70%_70%,color-mix(in_oklab,var(--accent)_10%,transparent),transparent_60%)]" />
					{/* Main Aurora Blob 1 (Primary Color) */}
					<div className="absolute -top-1/4 left-1/4 h-[22rem] w-[22rem] animate-[aurora-1_24s_ease-in-out_infinite] rounded-full bg-primary/25 opacity-20 blur-3xl filter dark:opacity-30" />
					{/* Main Aurora Blob 2 (Secondary/Muted Color) */}
					<div className="absolute -bottom-1/4 right-1/4 h-[20rem] w-[20rem] animate-[aurora-2_26s_ease-in-out_infinite] rounded-full bg-accent/25 opacity-18 blur-3xl filter dark:opacity-28" />
					{/* Accent highlight */}
					<div className="absolute top-1/3 right-[12%] h-64 w-64 animate-[aurora-3_30s_ease-in-out_infinite] rounded-full bg-primary/15 opacity-14 blur-3xl filter dark:opacity-22" />
					<div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_62%,color-mix(in_oklab,var(--background)_84%,transparent))]" />
				</div>

				{/* Content */}
				<div className="relative z-10">{children}</div>
			</div>
		</div>
	);
};
