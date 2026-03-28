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
	{ name: "Stripe", description: "Pagesa dhe tërheqje", connected: true },
	{
		name: "Mailchimp",
		description: "Automatizimi i fushatave",
		connected: false,
	},
	{ name: "Slack", description: "Njoftime të ekipit", connected: true },
	{
		name: "Google Analytics",
		description: "Analizë e trafikut",
		connected: false,
	},
	{ name: "Sentry", description: "Monitorim i gabimeve", connected: true },
	{
		name: "Notion",
		description: "Sinkronizim i dokumenteve",
		connected: false,
	},
];

const DashboardApps = () => {
	return (
		<div className="space-y-5 sm:space-y-6">
			<div>
				<h1 className="font-bold text-2xl tracking-tight">
					Aplikacionet
				</h1>
				<p className="text-muted-foreground text-sm sm:text-base">
					Menaxhimi i integrimeve kryesore të platformës.
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
									{app.connected ? "I lidhur" : "I palidhur"}
								</Badge>
							</div>
						</CardHeader>
						<CardContent>
							<Button
								variant={app.connected ? "outline" : "default"}
								className="w-full"
							>
								{app.connected ? "Menaxho" : "Lidhu"}
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
