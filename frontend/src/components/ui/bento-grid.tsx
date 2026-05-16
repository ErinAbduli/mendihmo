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
				"grid w-full auto-rows-[17rem] grid-cols-1 gap-4 sm:auto-rows-[19rem] md:auto-rows-[22rem] md:grid-cols-3",
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
					"group row-span-1 flex cursor-pointer flex-col justify-between space-y-3 overflow-hidden rounded-lg border-0 bg-transparent ring-0 p-3 shadow-none outline-none transition-colors duration-300 ease-in-out hover:bg-foreground/5 hover:shadow-none sm:space-y-4 sm:p-4",
					className,
				)}
				{...props}
			>
				<div className="flex h-full min-h-24 flex-1 overflow-hidden rounded-md border-0 bg-transparent ring-0 outline-none">
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
