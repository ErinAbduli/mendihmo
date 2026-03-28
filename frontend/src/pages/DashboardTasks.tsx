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
		title: "Rishiko rrjedhën e re të donacioneve",
		priority: "E lartë",
		status: "Në progres",
	},
	{
		id: "TSK-102",
		title: "Përgatit modelin e email-it të mirëseardhjes",
		priority: "Mesatare",
		status: "Për t'u bërë",
	},
	{
		id: "TSK-103",
		title: "Auditim i menaxhimit të refresh token",
		priority: "E lartë",
		status: "Në rishikim",
	},
	{
		id: "TSK-104",
		title: "Përditëso FAQ e qendrës së ndihmës",
		priority: "E ulët",
		status: "Përfunduar",
	},
];

const statusVariant = (
	status: string,
): "default" | "secondary" | "destructive" => {
	switch (status) {
		case "Përfunduar":
			return "default";
		case "Në progres":
		case "Në rishikim":
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
					<h1 className="font-bold text-2xl tracking-tight">
						Detyrat
					</h1>
					<p className="text-muted-foreground text-sm sm:text-base">
						Panel i fokusuar për detyrat kryesore të adminit.
					</p>
				</div>
				<Button size="sm">Krijo detyrë</Button>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Detyrat mujore</CardTitle>
					<CardDescription>
						Detyrat kryesore për menaxhimin e panelit.
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
