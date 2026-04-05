import type { ReactNode } from "react";
import {
	MinusIcon,
	ShieldAlertIcon,
	TrendingDownIcon,
	TrendingUpIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { cn } from "@/lib/utils";

export type StatisticsCardProps = {
	value: string;
	title: string;
	status: "within" | "observe" | "exceed" | "unknown";
	className?: string;
	range: string;
	icon?: ReactNode;
};

const statusConfig = {
	within: {
		color: "bg-secondary text-secondary-foreground",
		icon: <TrendingUpIcon />,
		label: "Në rritje",
	},
	observe: {
		color: "bg-muted text-muted-foreground",
		icon: <MinusIcon />,
		label: "Stabile",
	},
	exceed: {
		color: "bg-destructive/10 text-destructive",
		icon: <TrendingDownIcon />,
		label: "Rrezik",
	},
	unknown: {
		color: "bg-muted text-muted-foreground",
		icon: <ShieldAlertIcon />,
		label: "Në shqyrtim",
	},
} as const;

const StatisticsWithStatus = ({
	status,
	value,
	title,
	className,
	range,
	icon,
}: StatisticsCardProps) => {
	return (
		<Card
			className={cn(
				"relative flex flex-col gap-3 overflow-hidden border-border/60 bg-card/90 shadow-sm backdrop-blur supports-backdrop-filter:bg-card/70",
				className,
			)}
		>
			<div className="pointer-events-none absolute inset-0 bg-linear-to-br from-muted/50 via-transparent to-accent/12" />
			<CardHeader className="relative flex items-center justify-between gap-3">
				<CardTitle className="text-sm">{title}</CardTitle>
				{icon && (
					<div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-foreground [&>svg]:size-4.5">
						{icon}
					</div>
				)}
			</CardHeader>

			<CardContent className="relative flex flex-col gap-3">
				<p className="text-3xl font-semibold tracking-tight">{value}</p>

				<Badge
					className={cn(
						statusConfig[status].color,
						"gap-1.5 [&>svg]:size-3.5",
					)}
				>
					{statusConfig[status].icon}
					<span>{statusConfig[status].label}:</span>
					<span>{range}</span>
				</Badge>
			</CardContent>
		</Card>
	);
};

export default StatisticsWithStatus;
