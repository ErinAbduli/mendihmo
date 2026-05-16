import { useEffect, useMemo, useState } from "react";
import { isAxiosError } from "axios";
import { Mail, Search, Trash2, ChevronDown } from "lucide-react";
import { apiClient } from "@/lib/api";
import { localizeErrorMessage } from "@/lib/error-utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

type ApiContact = {
	id: number;
	name: string;
	email: string;
	subject: string;
	message: string;
	status: string;
	createdAt: string;
};

type ContactsResponse = {
	contacts: ApiContact[];
};

const normalizeContacts = (input: unknown): ApiContact[] => {
	if (Array.isArray(input)) {
		return input.filter((item): item is ApiContact => Boolean(item && typeof item === "object"));
	}

	if (input && typeof input === "object" && "contacts" in input) {
		const contacts = (input as { contacts: unknown }).contacts;
		if (!Array.isArray(contacts)) return [];
		return contacts.filter((item): item is ApiContact => Boolean(item && typeof item === "object"));
	}

	return [];
};

const statusLabel = (status: string) => {
	if (status === "pending") return "Në pritje";
	if (status === "in-progress") return "Duke u përpunuar";
	if (status === "resolved") return "Zgjidhur";
	return status;
};

const statusVariant = (status: string): "default" | "secondary" | "destructive" => {
	if (status === "resolved") return "default";
	if (status === "in-progress") return "secondary";
	return "destructive";
};

const formatDate = (value: string) =>
	new Date(value).toLocaleDateString("sq-AL", {
		year: "numeric",
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});

const DashboardContacts = () => {
	const [contacts, setContacts] = useState<ApiContact[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [query, setQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [orderBy, setOrderBy] = useState<"date-desc" | "date-asc" | "name" | "status">("date-desc");
	const [updating, setUpdating] = useState<number | null>(null);
	const [deleting, setDeleting] = useState<number | null>(null);

	const loadContacts = async () => {
		setLoading(true);
		setError(null);

		try {
			const data = await apiClient.get<ContactsResponse | unknown>("/contact");
			setContacts(normalizeContacts(data));
		} catch (err) {
			if (isAxiosError(err) && err.response?.status === 404) {
				setContacts([]);
				setError(null);
				return;
			}

			const backendMessage = isAxiosError<{ error?: string }>(err)
				? err.response?.data?.error ?? err.message
				: err instanceof Error
					? err.message
					: null;
			setError(localizeErrorMessage(backendMessage) ?? "Dështoi ngarkimi i mesazheve.");
			setContacts([]);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadContacts();
	}, []);

	const handleStatusChange = async (id: number, status: string) => {
		setUpdating(id);
		try {
			await apiClient.patch(`/contact/${id}/status`, { status });
			toast.success("Statusi u përditësua.");
			await loadContacts();
		} catch (err) {
			const backendMessage = isAxiosError<{ error?: string }>(err)
				? err.response?.data?.error ?? err.message
				: err instanceof Error
					? err.message
					: null;
			toast.error(localizeErrorMessage(backendMessage) ?? "Dështoi përditësimi i statusit.");
		} finally {
			setUpdating(null);
		}
	};

	const handleDelete = async (id: number) => {
		if (!confirm("A jeni sigur? Ky veprim nuk mund të zhbëhet.")) return;

		setDeleting(id);
		try {
			await apiClient.delete(`/contact/${id}`);
			toast.success("Mesazhi u fshi.");
			await loadContacts();
		} catch (err) {
			const backendMessage = isAxiosError<{ error?: string }>(err)
				? err.response?.data?.error ?? err.message
				: err instanceof Error
					? err.message
					: null;
			toast.error(localizeErrorMessage(backendMessage) ?? "Dështoi fshirja e mesazhit.");
		} finally {
			setDeleting(null);
		}
	};

	const filteredContacts = useMemo(() => {
		const q = query.trim().toLowerCase();

		let results = contacts.filter((contact) => {
			// Search filter
			const matchesSearch =
				!q ||
				contact.name.toLowerCase().includes(q) ||
				contact.email.toLowerCase().includes(q) ||
				contact.subject.toLowerCase().includes(q) ||
				contact.message.toLowerCase().includes(q);

			// Status filter
			const matchesStatus = statusFilter === "all" || contact.status === statusFilter;

			return matchesSearch && matchesStatus;
		});

		// Sort
		results.sort((a, b) => {
			if (orderBy === "date-desc") {
				return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
			}
			if (orderBy === "date-asc") {
				return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
			}
			if (orderBy === "name") {
				return a.name.localeCompare(b.name);
			}
			if (orderBy === "status") {
				return a.status.localeCompare(b.status);
			}
			return 0;
		});

		return results;
	}, [contacts, query, statusFilter, orderBy]);

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-2">
				<h1 className="font-bold text-2xl tracking-tight">Kontaktet</h1>
				<p className="text-sm text-muted-foreground">Mesazhet e dërguara nga faqja Na kontaktoni.</p>
			</div>

		<Card>
				<CardContent className="space-y-4">
					<div className="flex flex-col gap-3 sm:flex-row">
						<div className="relative flex-1 max-w-md">
							<Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								value={query}
								onChange={(event) => setQuery(event.target.value)}
								placeholder="Kërko emër, email, subjekt ose mesazh"
								className="pl-9"
							/>
						</div>
						<Select value={statusFilter} onValueChange={setStatusFilter}>
							<SelectTrigger className="sm:w-52">
								<SelectValue placeholder="Të gjitha statuset" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Të gjitha statuset</SelectItem>
								<SelectItem value="pending">Në pritje</SelectItem>
								<SelectItem value="in-progress">Duke u përpunuar</SelectItem>
								<SelectItem value="resolved">Zgjidhur</SelectItem>
							</SelectContent>
						</Select>
						<Select value={orderBy} onValueChange={(value) => setOrderBy(value as typeof orderBy)}>
							<SelectTrigger className="sm:w-52">
								<SelectValue placeholder="Renditje" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="date-desc">Data (i ri)</SelectItem>
								<SelectItem value="date-asc">Data (i vjetër)</SelectItem>
								<SelectItem value="name">Emri</SelectItem>
								<SelectItem value="status">Statusi</SelectItem>
							</SelectContent>
						</Select>
					</div>
					{loading ? (
						<p className="text-sm text-muted-foreground">Duke ngarkuar mesazhet...</p>
					) : error ? (
						<p className="text-sm text-destructive">{error}</p>
					) : filteredContacts.length ? (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Dërguesi</TableHead>
									<TableHead>Subjekti</TableHead>
									<TableHead>Mesazhi</TableHead>
									<TableHead>Statusi</TableHead>
									<TableHead>Data</TableHead>
									<TableHead className="text-right">Aksionet</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredContacts.map((contact) => (
									<TableRow key={contact.id}>
										<TableCell>
											<div className="space-y-1">
												<p className="font-medium">{contact.name}</p>
												<a href={`mailto:${contact.email}`} className="text-xs text-muted-foreground hover:underline">
													{contact.email}
												</a>
											</div>
										</TableCell>
										<TableCell>
											<Badge variant="secondary">{contact.subject}</Badge>
										</TableCell>
										<TableCell className="max-w-105 whitespace-pre-wrap text-sm text-muted-foreground">
											{contact.message}
										</TableCell>
										<TableCell>
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button
														variant="ghost"
														size="sm"
														disabled={updating === contact.id}
														className="gap-1"
													>
														<Badge variant={statusVariant(contact.status)}>
															{statusLabel(contact.status)}
														</Badge>
														<ChevronDown className="size-3" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end">
													<DropdownMenuItem onClick={() => handleStatusChange(contact.id, "pending")}>
														Në pritje
													</DropdownMenuItem>
													<DropdownMenuItem onClick={() => handleStatusChange(contact.id, "in-progress")}>
														Duke u përpunuar
													</DropdownMenuItem>
													<DropdownMenuItem onClick={() => handleStatusChange(contact.id, "resolved")}>
														Zgjidhur
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</TableCell>
										<TableCell className="text-muted-foreground">{formatDate(contact.createdAt)}</TableCell>
										<TableCell className="text-right">
											<Button
												variant="ghost"
												size="sm"
												disabled={deleting === contact.id}
												onClick={() => handleDelete(contact.id)}
												className="text-destructive hover:text-destructive"
											>
												<Trash2 className="size-4" />
											</Button>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					) : (
						<div className="flex items-center gap-3 rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
							<Mail className="size-4" />
							{contacts.length ? "Nuk ka mesazhe që përputhen me filtrin." : "Nuk ka mesazhe ende."}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
};

export default DashboardContacts;