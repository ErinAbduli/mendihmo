import { useState, type FormEvent } from "react";
import { Clock3, Mail, MapPin, MessageSquareText, Phone } from "lucide-react";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api";

const Contact = () => {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [subject, setSubject] = useState("");
	const [message, setMessage] = useState("");
	const [sending, setSending] = useState(false);

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
			toast.error("Ju lutem plotësoni të gjitha fushat.");
			return;
		}

		setSending(true);
		try {
			await apiClient.post<
				{ message: string; contact: { id: string; createdAt: string } },
				{ name: string; email: string; subject: string; message: string }
			>("/contact", {
				name: name.trim(),
				email: email.trim(),
				subject: subject.trim(),
				message: message.trim(),
			});
			toast.success("Mesazhi u dërgua me sukses. Do t'ju kontaktojmë shpejt.");
			setName("");
			setEmail("");
			setSubject("");
			setMessage("");
		} catch (error) {
			const backendMessage = isAxiosError<{ error?: string }>(error)
				? error.response?.data?.error ?? error.message
				: "Dërgimi i mesazhit dështoi.";
			toast.error(backendMessage);
		} finally {
			setSending(false);
		}
	};

	return (
		<div className="min-h-screen bg-background">
			<section className="border-b border-border/60 bg-gradient-to-b from-primary/10 via-background to-background">
				<div className="mx-auto w-full max-w-6xl px-4 py-12 md:py-16">
					<div className="space-y-4">
						<Badge variant="secondary" className="w-fit">
							Na kontaktoni
						</Badge>
						<h1 className="font-heading text-3xl font-semibold tracking-tight md:text-5xl">
							Jemi këtu për çdo pyetje ose ndihmë
						</h1>
						<p className="max-w-2xl text-muted-foreground md:text-lg">
							Nëse ke pyetje rreth fushatave, donacioneve ose verifikimit, na shkruaj
							dhe ekipi ynë do të të përgjigjet sa më shpejt.
						</p>
						<div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
							<span className="rounded-full border bg-background px-3 py-1">Përgjigje brenda 24h</span>
							<span className="rounded-full border bg-background px-3 py-1">Mbështetje për fushata</span>
							<span className="rounded-full border bg-background px-3 py-1">Ndihmë për donatorë</span>
						</div>
					</div>
				</div>
			</section>

			<section className="mx-auto w-full max-w-6xl px-4 py-10 md:py-12">
				<div className="grid gap-6 md:grid-cols-[0.95fr_1.05fr]">
					<div className="space-y-4">
						<Card className="border-primary/20">
							<CardHeader>
								<CardTitle>Informacion kontakti</CardTitle>
								<CardDescription>
									Mund të na kontaktosh edhe direkt përmes këtyre kanaleve.
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4 text-sm text-muted-foreground">
								<div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-3">
									<Mail className="mt-0.5 size-4 text-primary" />
									<div>
										<p className="font-medium text-foreground">Email</p>
										<p>support@mendihmo.com</p>
									</div>
								</div>
								<div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-3">
									<Phone className="mt-0.5 size-4 text-primary" />
									<div>
										<p className="font-medium text-foreground">Telefon</p>
										<p>+383 44 000 000</p>
									</div>
								</div>
								<div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-3">
									<MapPin className="mt-0.5 size-4 text-primary" />
									<div>
										<p className="font-medium text-foreground">Adresa</p>
										<p>Prishtinë, Kosovë</p>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card className="bg-primary/5">
							<CardHeader>
								<CardTitle>Kohë përgjigjeje</CardTitle>
							</CardHeader>
							<CardContent className="flex items-start gap-2 text-sm text-muted-foreground">
								<Clock3 className="mt-0.5 size-4 text-primary" />
								<p>Zakonisht përgjigjemi brenda 24 orëve në ditët e punës.</p>
							</CardContent>
						</Card>
					</div>

					<Card className="border-primary/20 shadow-sm">
						<CardHeader>
							<CardTitle>Na shkruaj një mesazh</CardTitle>
							<CardDescription>
								Plotëso formularin dhe do të të kthejmë përgjigje me email.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<form onSubmit={handleSubmit} className="space-y-4">
								<div className="grid gap-4 sm:grid-cols-2">
									<div className="space-y-2">
										<label className="text-sm font-medium">Emri *</label>
										<Input
											value={name}
											onChange={(event) => setName(event.target.value)}
											placeholder="Shkruaj emrin"
										/>
									</div>
									<div className="space-y-2">
										<label className="text-sm font-medium">Email *</label>
										<Input
											type="email"
											value={email}
											onChange={(event) => setEmail(event.target.value)}
											placeholder="Shkruaj email-in"
										/>
									</div>
								</div>

								<div className="space-y-2">
									<label className="text-sm font-medium">Subjekti *</label>
									<Input
										value={subject}
										onChange={(event) => setSubject(event.target.value)}
										placeholder="P.sh. Problem me verifikimin e fushatës"
									/>
								</div>

								<div className="space-y-2">
									<label className="text-sm font-medium">Mesazhi *</label>
									<textarea
										value={message}
										onChange={(event) => setMessage(event.target.value)}
										rows={6}
										className="flex min-h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
										placeholder="Shkruaj mesazhin tënd..."
									/>
								</div>

								<Button type="submit" disabled={sending} className="w-full sm:w-auto">
									<MessageSquareText className="mr-2 size-4" />
									{sending ? "Duke dërguar..." : "Dërgo mesazhin"}
								</Button>
								<p className="text-xs text-muted-foreground">
									Duke dërguar këtë formë, pranon të kontaktohesh nga ekipi ynë për këtë kërkesë.
								</p>
							</form>
						</CardContent>
					</Card>
				</div>
			</section>
		</div>
	);
};

export default Contact;
