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
	{
		title: "Të ardhura",
		value: "$24,320",
		delta: "+12.4%",
		icon: DollarSign,
	},
	{ title: "Porosi", value: "1,284", delta: "+6.1%", icon: ShoppingBag },
	{ title: "Klientë", value: "3,412", delta: "+9.3%", icon: Users },
	{ title: "Konvertim", value: "4.9%", delta: "+0.7%", icon: CreditCard },
];

const activities = [
	{
		id: 1,
		actor: "Arta Beqiri",
		action: "përfundoi ridizajnimin e checkout-it",
		time: "para 10 min",
	},
	{
		id: 2,
		actor: "Ekipi i adminëve",
		action: "ftoi 2 moderatorë të rinj",
		time: "para 33 min",
	},
	{
		id: 3,
		actor: "Dren Krasniqi",
		action: "lidhi integrimin e Stripe",
		time: "para 1 ore",
	},
	{
		id: 4,
		actor: "Sistemi",
		action: "backup-i i natës përfundoi",
		time: "para 2 orësh",
	},
];

const Dashboard = () => {
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
									{item.delta} nga muaji i kaluar
								</p>
							</CardContent>
						</Card>
					);
				})}
			</div>

			<div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
				<Card>
					<CardHeader>
						<CardTitle>Aktivitetet e fundit</CardTitle>
						<CardDescription>
							Përditësimet më të fundit të ekipit dhe sistemit.
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
						<CardTitle>Shënime të shpejta</CardTitle>
						<CardDescription>
							Shkurtesa kryesore të panelit.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-2 text-sm">
						<p className="rounded-md border p-2">
							Menaxho detyrat në faqen e detyrave.
						</p>
						<p className="rounded-md border p-2">
							Fto dhe rishiko përdoruesit te Përdoruesit.
						</p>
						<p className="rounded-md border p-2">
							Menaxho integrimet e aplikacioneve.
						</p>
						<p className="rounded-md border p-2">
							Përditëso preferencat personale te Cilësimet.
						</p>
					</CardContent>
				</Card>
			</div>
		</div>
	);
};

export default Dashboard;
