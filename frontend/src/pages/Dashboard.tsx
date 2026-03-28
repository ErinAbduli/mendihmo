import { CreditCard, DollarSign, ShoppingBag, Users } from "lucide-react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const stats = [
	{ title: "Revenue", value: "$24,320", delta: "+12.4%", icon: DollarSign },
	{ title: "Orders", value: "1,284", delta: "+6.1%", icon: ShoppingBag },
	{ title: "Customers", value: "3,412", delta: "+9.3%", icon: Users },
	{ title: "Conversion", value: "4.9%", delta: "+0.7%", icon: CreditCard },
];

const activities = [
	{
		id: 1,
		actor: "Arta Beqiri",
		action: "completed checkout redesign",
		time: "10 min ago",
	},
	{
		id: 2,
		actor: "Admin Team",
		action: "invited 2 new moderators",
		time: "33 min ago",
	},
	{
		id: 3,
		actor: "Dren Krasniqi",
		action: "connected Stripe integration",
		time: "1 hour ago",
	},
	{
		id: 4,
		actor: "System",
		action: "nightly backup finished",
		time: "2 hours ago",
	},
];

const Dashboard = () => {
	return (
		<div className="space-y-5 sm:space-y-6">
			<div>
				<h1 className="font-bold text-2xl tracking-tight">Dashboard</h1>
				<p className="text-muted-foreground text-sm sm:text-base">
					Overview of your platform performance and latest activity.
				</p>
			</div>

			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				{stats.map((item) => {
					const Icon = item.icon;
					return (
						<Card key={item.title}>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									{item.title}
								</CardTitle>
								<Icon className="size-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<div className="font-bold text-2xl">
									{item.value}
								</div>
								<p className="text-muted-foreground text-xs">
									{item.delta} from last month
								</p>
							</CardContent>
						</Card>
					);
				})}
			</div>

			<div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
				<Card>
					<CardHeader>
						<CardTitle>Recent Activity</CardTitle>
						<CardDescription>
							Most recent team and system updates.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						{activities.map((activity) => (
							<div
								key={activity.id}
								className="flex items-center justify-between gap-3 rounded-md border p-3"
							>
								<div>
									<p className="font-medium text-sm">
										{activity.actor}
									</p>
									<p className="text-muted-foreground text-sm">
										{activity.action}
									</p>
								</div>
								<Badge variant="secondary">
									{activity.time}
								</Badge>
							</div>
						))}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Quick Notes</CardTitle>
						<CardDescription>
							Core admin shortcuts from shadcn-admin flow.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-2 text-sm">
						<p className="rounded-md border p-2">
							Manage tasks in the Tasks page.
						</p>
						<p className="rounded-md border p-2">
							Invite and review users in Users.
						</p>
						<p className="rounded-md border p-2">
							Handle app integrations in Apps.
						</p>
						<p className="rounded-md border p-2">
							Update personal preferences in Settings.
						</p>
					</CardContent>
				</Card>
			</div>
		</div>
	);
};

export default Dashboard;
