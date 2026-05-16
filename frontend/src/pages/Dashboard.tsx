import { CreditCard, DollarSign, ShoppingBag, Users } from "lucide-react";
import { useEffect, useState } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { apiClient } from "@/lib/api";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import {
	Bar,
	BarChart,
	CartesianGrid,
	Line,
	LineChart,
	ResponsiveContainer,
	XAxis,
	YAxis,
} from "recharts";

const euroFormatter = new Intl.NumberFormat("sq-AL", {
	style: "currency",
	currency: "EUR",
	maximumFractionDigits: 2,
});

type StatsData = {
	charityRaised: { value: number; delta: string };
	campaigns: { total: number; funded: number; delta: string };
	users: { value: number; delta: string };
	profit: { value: number; delta: string };
	revenueOverTime: { month: string; revenue: number }[];
	topDonations: { campaign: string; amount: number }[];
};

const Dashboard = () => {
	const [stats, setStats] = useState<StatsData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const revenueChartConfig = {
		revenue: {
			label: "Të ardhura",
			color: "var(--chart-1)",
		},
	};

	const topDonationsChartConfig = {
		amount: {
			label: "Donacion",
			color: "var(--chart-2)",
		},
	};

	useEffect(() => {
		const fetchStats = async () => {
			setLoading(true);
			setError(null);
			try {
				const data = await apiClient.get<StatsData>("/dashboard/stats");
				setStats(data);
			} catch (err) {
				console.error(err);
				setError("Dështoi ngarkimi i statistikave.");
			} finally {
				setLoading(false);
			}
		};
		fetchStats();
	}, []);

	return (
		<div className="space-y-5 sm:space-y-6">
			<div>
				<h1 className="font-bold text-2xl tracking-tight">
					Përmbledhje
				</h1>
				<p className="text-muted-foreground text-sm sm:text-base">
					Përmbledhje e performancës së platformës dhe aktivitetit të
					fundit.
				</p>
			</div>

			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				{loading && <div>Ngarkimi...</div>}
				{error && <div className="text-destructive">{error}</div>}
				{stats && (
					<>
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">Mbledhur për bamirësi</CardTitle>
								<DollarSign className="size-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<div className="font-bold text-2xl">{euroFormatter.format(stats.charityRaised.value)}</div>
								<p className="text-muted-foreground text-xs">{stats.charityRaised.delta} nga muaji i kaluar</p>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">Fushatat</CardTitle>
								<ShoppingBag className="size-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<div className="font-bold text-2xl">{stats.campaigns.total}</div>
								<p className="text-muted-foreground text-xs">{stats.campaigns.delta} nga muaji i kaluar</p>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">Përdoruesit</CardTitle>
								<Users className="size-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<div className="font-bold text-2xl">{stats.users.value}</div>
								<p className="text-muted-foreground text-xs">{stats.users.delta} nga muaji i kaluar</p>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">Profit</CardTitle>
								<CreditCard className="size-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<div className="font-bold text-2xl">{euroFormatter.format(stats.profit.value)}</div>
								<p className="text-muted-foreground text-xs">{stats.profit.delta} nga muaji i kaluar</p>
							</CardContent>
						</Card>
					</>
				)}
			</div>

			{stats && (
				<div className="grid gap-4 xl:grid-cols-2">
					<Card>
						<CardHeader>
							<CardTitle>Të ardhurat sipas muajit</CardTitle>
							<CardDescription>Renditja e donacioneve nga muaji në muaj.</CardDescription>
						</CardHeader>
						<CardContent>
							<ChartContainer config={revenueChartConfig} className="h-[320px] w-full">
								<ResponsiveContainer width="100%" height="100%">
									<LineChart data={stats.revenueOverTime} margin={{ left: 12, right: 12, top: 8 }}>
										<CartesianGrid vertical={false} strokeDasharray="3 3" />
										<XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
										<YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => euroFormatter.format(Number(value))} />
										<ChartTooltip content={<ChartTooltipContent formatter={(value) => euroFormatter.format(Number(value))} />} />
										<Line type="monotone" dataKey="revenue" stroke="var(--color-revenue)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
									</LineChart>
								</ResponsiveContainer>
							</ChartContainer>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Top donacionet</CardTitle>
							<CardDescription>Fushatat me më shumë mbështetje totale.</CardDescription>
						</CardHeader>
						<CardContent>
							<ChartContainer config={topDonationsChartConfig} className="h-[320px] w-full">
								<ResponsiveContainer width="100%" height="100%">
									<BarChart data={stats.topDonations} layout="vertical" margin={{ left: 8, right: 16, top: 8 }}>
										<CartesianGrid horizontal={false} strokeDasharray="3 3" />
										<XAxis type="number" tickLine={false} axisLine={false} tickFormatter={(value) => euroFormatter.format(Number(value))} />
										<YAxis type="category" dataKey="campaign" tickLine={false} axisLine={false} width={140} />
										<ChartTooltip content={<ChartTooltipContent formatter={(value) => euroFormatter.format(Number(value))} />} />
										<Bar dataKey="amount" fill="var(--color-amount)" radius={6} />
									</BarChart>
								</ResponsiveContainer>
							</ChartContainer>
						</CardContent>
					</Card>
				</div>
			)}
		</div>
	);
};

export default Dashboard;
