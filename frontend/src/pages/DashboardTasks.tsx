import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const tasks = [
	{
		id: "TSK-101",
		title: "Review new donation workflow",
		priority: "High",
		status: "In Progress",
	},
	{
		id: "TSK-102",
		title: "Prepare onboarding email template",
		priority: "Medium",
		status: "Todo",
	},
	{
		id: "TSK-103",
		title: "Audit auth refresh token handling",
		priority: "High",
		status: "In Review",
	},
	{
		id: "TSK-104",
		title: "Update help center FAQ",
		priority: "Low",
		status: "Done",
	},
];

const statusVariant = (
	status: string,
): "default" | "secondary" | "destructive" => {
	switch (status) {
		case "Done":
			return "default";
		case "In Progress":
		case "In Review":
			return "secondary";
		default:
			return "destructive";
	}
};

const DashboardTasks = () => {
	return (
		<div className="space-y-5 sm:space-y-6">
			<div className="flex flex-wrap items-end justify-between gap-3">
				<div>
					<h1 className="font-bold text-2xl tracking-tight">Tasks</h1>
					<p className="text-muted-foreground text-sm sm:text-base">
						A focused task board for core admin operations.
					</p>
				</div>
				<Button size="sm">Create task</Button>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Monthly Tasks</CardTitle>
					<CardDescription>
						Inspired by shadcn-admin task management essentials.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-3">
					{tasks.map((task) => (
						<div
							key={task.id}
							className="grid gap-3 rounded-md border p-3 md:grid-cols-[120px_minmax(0,1fr)_120px_130px] md:items-center"
						>
							<p className="font-mono text-muted-foreground text-xs">
								{task.id}
							</p>
							<p className="font-medium text-sm">{task.title}</p>
							<Badge variant="outline">{task.priority}</Badge>
							<Badge variant={statusVariant(task.status)}>
								{task.status}
							</Badge>
						</div>
					))}
				</CardContent>
			</Card>
		</div>
	);
};

export default DashboardTasks;
