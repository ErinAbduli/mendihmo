import {
	HandCoins,
	HeartHandshake,
	ReceiptIcon,
	ShieldCheck,
} from "lucide-react";

import StatisticsWithStatus, {
	type StatisticsCardProps,
} from "@/components/shadcn-studio/blocks/statistics-with-status";

const statisticsData: StatisticsCardProps[] = [
	{
		title: "Kauza Totale",
		value: "1,240+",
		status: "within",
		range: "+12% këtë muaj",
		icon: <HeartHandshake />,
	},
	{
		title: "Donacione Totale",
		value: "€890,000+",
		status: "within",
		range: "+8.4% nga java e kaluar",
		icon: <HandCoins />,
	},
	{
		title: "Përdorues Aktivë",
		value: "34,000+",
		status: "observe",
		range: "247 online tani",
		icon: <ShieldCheck />,
	},
	{
		title: "Objektivi Mujor",
		value: "92%",
		status: "observe",
		range: "Në përputhje me planin",
		icon: <ReceiptIcon />,
	},
];

const StatisticsCardPreview = () => {
	return (
		<div className="py-8 sm:py-16 lg:py-24">
			<div className="mx-auto grid max-w-7xl gap-4 px-4 sm:grid-cols-2 sm:px-6 lg:px-8 xl:grid-cols-4">
				{statisticsData.map((card, index) => (
					<StatisticsWithStatus key={index} {...card} />
				))}
			</div>
		</div>
	);
};

export default StatisticsCardPreview;
