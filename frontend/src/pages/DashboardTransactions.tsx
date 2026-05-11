import { useEffect, useMemo, useState } from "react";
import { isAxiosError } from "axios";
import { Search, CreditCard } from "lucide-react";
import { apiClient } from "@/lib/api";
import { localizeErrorMessage } from "@/lib/error-utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

type ApiTransaction = {
	id: number;
	userId: number;
	campaignId: number;
	stripeSessionId?: string;
	amount: number;
	currency: string;
	status: string;
	paymentMethod?: string;
	createdAt: string;
	user?: {
		id: number;
		emri: string;
		mbiemri: string;
		email: string;
	};
	campaign?: {
		id: number;
		title: string;
	};
};

type TransactionsResponse = {
	transactions?: ApiTransaction[];
};

const statusLabel = (status: string) => {
	if (status === "completed") return "Përfunduar";
	if (status === "pending") return "Në pritje";
	if (status === "failed") return "Dështuar";
	if (status === "refunded") return "Kthyer";
	return status;
};

const statusVariant = (status: string): "default" | "secondary" | "destructive" => {
	if (status === "completed") return "default";
	if (status === "pending") return "secondary";
	return "destructive";
};

const formatCurrency = (amount: number, currency: string) =>
	new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: currency || "EUR",
		maximumFractionDigits: 2,
	}).format(amount);

const formatDate = (value: string) =>
	new Date(value).toLocaleDateString("sq-AL", {
		year: "numeric",
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});

const DashboardTransactions = () => {
	const [transactions, setTransactions] = useState<ApiTransaction[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [query, setQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [orderBy, setOrderBy] = useState<"date-desc" | "date-asc" | "amount-desc" | "amount-asc">("date-desc");

	const loadTransactions = async () => {
		setLoading(true);
		setError(null);

		try {
			const data = await apiClient.get<TransactionsResponse>("/transactions");
			setTransactions(data.transactions ?? []);
		} catch (err) {
			const backendMessage = isAxiosError<{ error?: string }>(err)
				? err.response?.data?.error ?? err.message
				: err instanceof Error
					? err.message
					: null;
			setError(localizeErrorMessage(backendMessage) ?? "Dështoi ngarkimi i transaksioneve.");
			setTransactions([]);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadTransactions();
	}, []);

	const filteredTransactions = useMemo(() => {
		const q = query.trim().toLowerCase();

		let results = transactions.filter((transaction) => {
			const userName = transaction.user
				? `${transaction.user.emri} ${transaction.user.mbiemri}`.toLowerCase()
				: "";
			const userEmail = transaction.user?.email.toLowerCase() ?? "";
			const campaignTitle = transaction.campaign?.title.toLowerCase() ?? "";

			// Search filter
			const matchesSearch =
				!q ||
				userName.includes(q) ||
				userEmail.includes(q) ||
				campaignTitle.includes(q) ||
				transaction.amount.toString().includes(q);

			// Status filter
			const matchesStatus = statusFilter === "all" || transaction.status === statusFilter;

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
			if (orderBy === "amount-desc") {
				return b.amount - a.amount;
			}
			if (orderBy === "amount-asc") {
				return a.amount - b.amount;
			}
			return 0;
		});

		return results;
	}, [transactions, query, statusFilter, orderBy]);

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-2">
				<h1 className="font-bold text-2xl tracking-tight">Transaksione</h1>
				<p className="text-sm text-muted-foreground">Të gjitha pagesat dhe transaksionet në platformë.</p>
			</div>

			<Card>
				<CardContent className="space-y-4">
					<div className="flex flex-col gap-3 sm:flex-row">
						<div className="relative flex-1 max-w-md">
							<Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								value={query}
								onChange={(event) => setQuery(event.target.value)}
								placeholder="Kërko përdorues, email ose fushatë"
								className="pl-9"
							/>
						</div>
						<Select value={statusFilter} onValueChange={setStatusFilter}>
							<SelectTrigger className="sm:w-52">
								<SelectValue placeholder="Të gjitha statuset" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Të gjitha statuset</SelectItem>
								<SelectItem value="completed">Përfunduar</SelectItem>
								<SelectItem value="pending">Në pritje</SelectItem>
								<SelectItem value="failed">Dështuar</SelectItem>
								<SelectItem value="refunded">Kthyer</SelectItem>
							</SelectContent>
						</Select>
						<Select value={orderBy} onValueChange={(value) => setOrderBy(value as typeof orderBy)}>
							<SelectTrigger className="sm:w-52">
								<SelectValue placeholder="Renditje" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="date-desc">Data (i ri)</SelectItem>
								<SelectItem value="date-asc">Data (i vjetër)</SelectItem>
								<SelectItem value="amount-desc">Shuma (e lartë)</SelectItem>
								<SelectItem value="amount-asc">Shuma (e ulët)</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{loading ? (
						<p className="text-sm text-muted-foreground">Duke ngarkuar transaksionet...</p>
					) : error ? (
						<p className="text-sm text-destructive">{error}</p>
					) : filteredTransactions.length ? (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Përdoruesi</TableHead>
									<TableHead>Fushatë</TableHead>
									<TableHead>Shuma</TableHead>
									<TableHead>Statusi</TableHead>
									<TableHead>Metoda e Pagesës</TableHead>
									<TableHead>Data</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredTransactions.map((transaction) => (
									<TableRow key={transaction.id}>
										<TableCell>
											<div className="space-y-1">
												<p className="font-medium">
													{transaction.user
														? `${transaction.user.emri} ${transaction.user.mbiemri}`
														: "I panjohur"}
												</p>
												{transaction.user && (
													<a
														href={`mailto:${transaction.user.email}`}
														className="text-xs text-muted-foreground hover:underline"
													>
														{transaction.user.email}
													</a>
												)}
											</div>
										</TableCell>
										<TableCell>
											<p className="max-w-xs truncate">
												{transaction.campaign?.title ?? "Fushatë e fshirë"}
											</p>
										</TableCell>
										<TableCell>
											<span className="font-medium">
												{formatCurrency(transaction.amount, transaction.currency)}
											</span>
										</TableCell>
										<TableCell>
											<Badge variant={statusVariant(transaction.status)}>
												{statusLabel(transaction.status)}
											</Badge>
										</TableCell>
										<TableCell className="text-sm text-muted-foreground">
											{transaction.paymentMethod || "Stripe"}
										</TableCell>
										<TableCell className="text-muted-foreground">
											{formatDate(transaction.createdAt)}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					) : (
						<div className="flex items-center gap-3 rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
							<CreditCard className="size-4" />
							{transactions.length
								? "Nuk ka transaksione që përputhen me filtrin."
								: "Nuk ka transaksione ende."}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
};

export default DashboardTransactions;

