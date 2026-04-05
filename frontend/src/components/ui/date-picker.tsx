import { format, parseISO } from "date-fns";
import { ChevronDownIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";

type DatePickerProps = {
	value: string;
	onChange: (value: string) => void;
	placeholder: string;
};

const parseDateValue = (value?: string | null) => {
	if (!value) {
		return undefined;
	}

	const parsedDate = parseISO(value);
	return Number.isNaN(parsedDate.getTime()) ? undefined : parsedDate;
};

function DatePicker({ value, onChange, placeholder }: DatePickerProps) {
	const selectedDate = parseDateValue(value);

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button
					type="button"
					variant="outline"
					data-empty={!selectedDate}
					className="w-full justify-between text-left font-normal data-[empty=true]:text-muted-foreground"
				>
					{selectedDate ? (
						<span>{format(selectedDate, "PPP")}</span>
					) : (
						<span>{placeholder}</span>
					)}
					<ChevronDownIcon className="size-4" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-0" align="start">
				<Calendar
					mode="single"
					selected={selectedDate}
					onSelect={(date: Date | undefined) =>
						onChange(date ? format(date, "yyyy-MM-dd") : "")
					}
					defaultMonth={selectedDate}
					initialFocus
				/>
			</PopoverContent>
		</Popover>
	);
}

export { DatePicker };