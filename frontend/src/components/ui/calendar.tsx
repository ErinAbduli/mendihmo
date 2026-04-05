import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker, type ChevronProps } from "react-day-picker";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function Calendar({
	className,
	classNames,
	showOutsideDays = true,
	...props
}: React.ComponentProps<typeof DayPicker>) {
	return (
		<DayPicker
			showOutsideDays={showOutsideDays}
			className={cn("p-3", className)}
			classNames={{
				months: "relative flex flex-col gap-4 sm:flex-row",
				month: "w-full space-y-4",
				month_caption: "relative flex h-7 items-center justify-center",
				caption_label: "text-sm font-medium",
				nav: "absolute inset-x-0 top-0 flex items-center justify-between",
				button_previous: cn(
					buttonVariants({ variant: "outline" }),
					"size-7 bg-transparent p-0 opacity-70 hover:opacity-100",
				),
				button_next: cn(
					buttonVariants({ variant: "outline" }),
					"size-7 bg-transparent p-0 opacity-70 hover:opacity-100",
				),
				month_grid: "w-full border-collapse",
				weekdays: "flex",
				weekday: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
				week: "mt-2 flex w-full",
				day: "relative size-9 p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md",
				day_button: cn(
					buttonVariants({ variant: "ghost" }),
					"size-9 p-0 font-normal aria-selected:opacity-100",
				),
				selected:
					"bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
				today: "bg-accent text-accent-foreground",
				outside:
					"text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
				disabled: "text-muted-foreground opacity-50",
				range_middle:
					"aria-selected:bg-accent aria-selected:text-accent-foreground",
				hidden: "invisible",
				...classNames,
			}}
			components={{
				Chevron: ({ orientation, className, ...props }: ChevronProps) => {
					if (orientation === "left") {
						return <ChevronLeft className={cn("size-4", className)} {...props} />;
					}

					return <ChevronRight className={cn("size-4", className)} {...props} />;
				},
			}}
			{...props}
		/>
	);
}

export { Calendar };