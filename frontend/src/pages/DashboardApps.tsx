import { ArrowUpRight, Link2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

const integrations = [
	{ name: "Stripe", description: "Payments and payouts", connected: true },
	{ name: "Mailchimp", description: "Campaign automation", connected: false },
	{ name: "Slack", description: "Team notifications", connected: true },
	{
		name: "Google Analytics",
		description: "Traffic insights",
		connected: false,
	},
	{ name: "Sentry", description: "Error monitoring", connected: true },
	{ name: "Notion", description: "Internal docs sync", connected: false },
];

const DashboardApps = () => {
	return (
		<div className="space-y-5 sm:space-y-6">
			<div>
				<h1 className="font-bold text-2xl tracking-tight">Apps</h1>
				<p className="text-muted-foreground text-sm sm:text-base">
					Core integration management, adapted from shadcn-admin apps
					page.
				</p>
			</div>

			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
				{integrations.map((app) => (
					<Card key={app.name}>
						<CardHeader>
							<div className="flex items-start justify-between gap-3">
								<div className="space-y-1">
									<CardTitle className="flex items-center gap-2">
										<Link2 className="size-4 text-muted-foreground" />
										{app.name}
									</CardTitle>
									<CardDescription>
										{app.description}
									</CardDescription>
								</div>
								<Badge
									variant={
										app.connected ? "default" : "secondary"
									}
								>
									{app.connected
										? "Connected"
										: "Not connected"}
								</Badge>
							</div>
						</CardHeader>
						<CardContent>
							<Button
								variant={app.connected ? "outline" : "default"}
								className="w-full"
							>
								{app.connected ? "Manage" : "Connect"}
								<ArrowUpRight className="ml-1 size-4" />
							</Button>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
};

export default DashboardApps;
