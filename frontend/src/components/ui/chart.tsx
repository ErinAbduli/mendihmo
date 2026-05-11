import * as React from "react";
import * as RechartsPrimitive from "recharts";
import { cn } from "@/lib/utils";

export type ChartConfig = Record<
	string,
	{
		label?: string;
		color?: string;
	}
>;

type ChartContainerProps = React.ComponentProps<"div"> & {
	config: ChartConfig;
};

const ChartContext = React.createContext<ChartConfig | null>(null);

export const ChartContainer = React.forwardRef<HTMLDivElement, ChartContainerProps>(
	({ className, config, children, style, ...props }, ref) => {
		const cssVariables = Object.fromEntries(
			Object.entries(config).flatMap(([key, value]) =>
				value.color ? ([[`--color-${key}`, value.color]] as const) : [],
			),
		);

		return (
			<ChartContext.Provider value={config}>
				<div
					ref={ref}
					className={cn("w-full", className)}
					style={{ ...cssVariables, ...style } as React.CSSProperties}
					{...props}
				>
					{children}
				</div>
			</ChartContext.Provider>
		);
	},
);
ChartContainer.displayName = "ChartContainer";

type ChartTooltipContentProps = React.ComponentProps<typeof RechartsPrimitive.Tooltip> & {
	formatter?: (value: unknown, name: string) => React.ReactNode;
	labelFormatter?: (label: unknown) => React.ReactNode;
};

export const ChartTooltip = (props: ChartTooltipContentProps) => {
	return <RechartsPrimitive.Tooltip cursor={false} {...props} content={<ChartTooltipContent />} />;
};

export const ChartTooltipContent = ({ active, payload, label, formatter, labelFormatter }: any) => {
	const config = React.useContext(ChartContext);

	if (!active || !payload?.length) {
		return null;
	}

	return (
		<div className="rounded-lg border bg-background px-3 py-2 text-sm shadow-sm">
			{label && (
				<p className="mb-2 font-medium text-muted-foreground">
					{labelFormatter ? labelFormatter(label) : label}
				</p>
			)}
			<div className="space-y-1">
				{payload.map((item: any) => {
					const key = item.dataKey as string;
					const seriesLabel = config?.[key]?.label ?? item.name ?? key;
					return (
						<div key={key} className="flex items-center justify-between gap-4">
							<span className="text-muted-foreground">{seriesLabel}</span>
							<span className="font-medium">
								{formatter ? formatter(item.value, key) : item.value}
							</span>
						</div>
					);
				})}
			</div>
		</div>
	);
};
