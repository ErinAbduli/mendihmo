import { useState } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const DashboardSettings = () => {
	const [name, setName] = useState("Admin Demo");
	const [email, setEmail] = useState("admin@ubt.local");
	const [organization, setOrganization] = useState("MëNdihmo");

	return (
		<div className="space-y-5 sm:space-y-6">
			<div>
				<h1 className="font-bold text-2xl tracking-tight">Cilësimet</h1>
				<p className="text-muted-foreground text-sm sm:text-base">
					Menaxho profilin dhe preferencat bazë të administratorit.
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Profili</CardTitle>
					<CardDescription>
						Seksioni i thjeshtuar i cilësimeve për panelin.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid gap-2">
						<label htmlFor="name" className="font-medium text-sm">
							Emri i plotë
						</label>
						<Input
							id="name"
							value={name}
							onChange={(event) => setName(event.target.value)}
						/>
					</div>
					<div className="grid gap-2">
						<label htmlFor="email" className="font-medium text-sm">
							Email
						</label>
						<Input
							id="email"
							type="email"
							value={email}
							onChange={(event) => setEmail(event.target.value)}
						/>
					</div>
					<div className="grid gap-2">
						<label
							htmlFor="organization"
							className="font-medium text-sm"
						>
							Organizata
						</label>
						<Input
							id="organization"
							value={organization}
							onChange={(event) =>
								setOrganization(event.target.value)
							}
						/>
					</div>

					<Separator />

					<div className="flex justify-end">
						<Button type="button">Ruaj ndryshimet</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
};

export default DashboardSettings;
