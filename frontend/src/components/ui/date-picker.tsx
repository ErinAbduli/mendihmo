import { Input } from "@/components/ui/input";

type DatePickerProps = {
	value: string;
	onChange: (value: string) => void;
	placeholder: string;
	min?: string;
	max?: string;
};

function DatePicker({ value, onChange, placeholder, min, max }: DatePickerProps) {
	return (
		<Input
			type="date"
			value={value ?? ""}
			onChange={(event) => onChange(event.target.value)}
			onFocus={(event) => {
				event.currentTarget.showPicker?.();
			}}
			placeholder={placeholder}
			min={min}
			max={max}
		/>
	);
}

export { DatePicker };