import * as React from "react";
import { cn } from "@/lib/utils";

const BentoGrid = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
	return (
		<div
			ref={ref}
			className={cn(
				"grid w-full auto-rows-[22rem] grid-cols-1 gap-4 md:grid-cols-3",
				className,
			)}
			{...props}
		>
			{children}
		</div>
	);
});
BentoGrid.displayName = "BentoGrid";

interface BentoGridItemProps extends Omit<
	React.HTMLAttributes<HTMLDivElement>,
	"title"
> {
	title?: string | React.ReactNode;
	description?: string | React.ReactNode;
	header?: React.ReactNode;
	icon?: React.ReactNode;
	footer?: React.ReactNode;
}

const BentoGridItem = React.forwardRef<HTMLDivElement, BentoGridItemProps>(
	({ className, title, header, footer, ...props }, ref) => {
		return (
			<div
				ref={ref}
				className={cn(
					"group row-span-1 flex flex-col justify-between space-y-4 overflow-hidden rounded-lg border-0 bg-transparent ring-0 p-4 shadow-none outline-none transition-all duration-300 ease-in-out hover:scale-[1.02] hover:shadow-none",
					className,
				)}
				{...props}
			>
				<div className="flex h-full min-h-[6rem] flex-1 overflow-hidden rounded-md border-0 bg-transparent ring-0 outline-none">
					{header}
				</div>

				<div className="space-y-2 transition-transform duration-200 group-hover:translate-x-1">
					<div className="text-sm font-bold text-card-foreground">
						{title}
					</div>
					{footer}
				</div>
			</div>
		);
	},
);
BentoGridItem.displayName = "BentoGridItem";

export { BentoGrid, BentoGridItem };
