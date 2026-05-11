import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { isAxiosError } from "axios";
import { Flag, Search } from "lucide-react";
import { apiClient } from "@/lib/api";
import { localizeErrorMessage } from "@/lib/error-utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type ApiReport = {
	id: number;
	targetType: "campaign";
	targetId: number;
	reason: string;
	message: string | null;
	status: string;
	createdAt: string;
	reporterName: string;
	reporter: {
		id: number;
		emri: string;
		mbiemri: string;
		email: string;
	};
	campaign: {
		id: number;
		title: string;
		category: {
			name: string;
		} | null;
	} | null;
};

type ReportsResponse = {
	reports: ApiReport[];
};

const statusLabel = (status: string) => {
	if (status === "pending") return "Në pritje";
	if (status === "reviewed") return "Shqyrtuar";
	if (status === "resolved") return "Zgjidhur";
	return status;
};

const statusVariant = (status: string): "default" | "secondary" | "destructive" => {
	if (status === "resolved") return "default";
	if (status === "reviewed") return "secondary";
	return "destructive";
};

const formatDate = (value: string) =>
	new Date(value).toLocaleDateString("sq-AL", {
		year: "numeric",
		month: "short",
		day: "numeric",
	});

const DashboardReports = () => {
	const [reports, setReports] = useState<ApiReport[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [query, setQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [orderBy, setOrderBy] = useState<"date-desc" | "date-asc" | "reason" | "reporter">("date-desc");

	useEffect(() => {
		let mounted = true;

		(async () => {
			setLoading(true);
			setError(null);

			try {
				const data = await apiClient.get<ReportsResponse>("/reports");
				if (!mounted) return;
				setReports(data.reports ?? []);
			} catch (err) {
				if (!mounted) return;
				const backendMessage = isAxiosError<{ error?: string }>(err)
					? err.response?.data?.error ?? err.message
					: err instanceof Error
						? err.message
						: null;
				setError(localizeErrorMessage(backendMessage) ?? "Dështoi ngarkimi i raporteve.");
				setReports([]);
			} finally {
				if (mounted) setLoading(false);
			}
		})();

		return () => {
			mounted = false;
		};
	}, []);

	const filteredReports = useMemo(() => {
		const q = query.trim().toLowerCase();
		let results = reports.filter((report) => {
			const matchesStatus = statusFilter === "all" || report.status === statusFilter;
			const matchesQuery =
				q.length === 0 ||
				report.reason.toLowerCase().includes(q) ||
				(report.message ?? "").toLowerCase().includes(q) ||
				report.reporterName.toLowerCase().includes(q) ||
				(report.campaign?.title ?? "").toLowerCase().includes(q);

			return matchesStatus && matchesQuery;
		});

		// Sort
		results.sort((a, b) => {
			if (orderBy === "date-desc") {
				return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
			}
			if (orderBy === "date-asc") {
				return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
			}
			if (orderBy === "reason") {
				return a.reason.localeCompare(b.reason);
			}
			if (orderBy === "reporter") {
				return a.reporterName.localeCompare(b.reporterName);
			}
			return 0;
		});

		return results;
	}, [reports, query, statusFilter, orderBy]);

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-2">
				<h1 className="font-bold text-2xl tracking-tight">Raporte</h1>
				<p className="text-sm text-muted-foreground">Shiko dhe shqyrto raportet e dërguara nga përdoruesit.</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Raportet e fundit</CardTitle>
					<CardDescription>Raportet renditen nga më i riu tek më i vjetri.</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex flex-col gap-3 sm:flex-row">
						<div className="relative flex-1">
							<Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								value={query}
								onChange={(event) => setQuery(event.target.value)}
								placeholder="Kërko reporter, fushatë ose arsye"
								className="pl-9"
							/>
						</div>
						<Select value={statusFilter} onValueChange={setStatusFilter}>
							<SelectTrigger className="sm:w-52">
								<SelectValue placeholder="Filtro sipas statusit" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Të gjitha</SelectItem>
								<SelectItem value="pending">Në pritje</SelectItem>
								<SelectItem value="reviewed">Shqyrtuar</SelectItem>
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
								<SelectItem value="reason">Arsyeja</SelectItem>
								<SelectItem value="reporter">Raportuesi</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{loading ? (
						<p className="text-sm text-muted-foreground">Duke ngarkuar raportet...</p>
					) : error ? (
						<p className="text-sm text-destructive">{error}</p>
					) : filteredReports.length ? (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Raportuesi</TableHead>
									<TableHead>Fushata</TableHead>
									<TableHead>Arsyeja</TableHead>
									<TableHead>Mesazhi</TableHead>
									<TableHead>Statusi</TableHead>
									<TableHead>Data</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredReports.map((report) => (
									<TableRow key={report.id}>
										<TableCell>
											<div className="space-y-1">
												<p className="font-medium">{report.reporterName}</p>
												<p className="text-xs text-muted-foreground">{report.reporter.email}</p>
											</div>
										</TableCell>
										<TableCell>
											{report.campaign ? (
												<div className="space-y-1">
													<Link to={`/donate/${report.campaign.id}`} className="font-medium text-foreground hover:underline">
														{report.campaign.title}
													</Link>
													<p className="text-xs text-muted-foreground">{report.campaign.category?.name ?? "Të tjera"}</p>
												</div>
											) : (
												<span className="text-muted-foreground">Fushatë e panjohur</span>
											)}
										</TableCell>
										<TableCell>{report.reason}</TableCell>
										<TableCell className="max-w-[320px] whitespace-pre-wrap text-sm text-muted-foreground">
											{report.message ?? "-"}
										</TableCell>
										<TableCell>
											<Badge variant={statusVariant(report.status)}>{statusLabel(report.status)}</Badge>
										</TableCell>
										<TableCell className="text-muted-foreground">{formatDate(report.createdAt)}</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					) : (
						<div className="flex items-center gap-3 rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
							<Flag className="size-4" />
							{reports.length ? "Nuk ka raporte që përputhen me filtrin." : "Nuk ka raporte ende."}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
};

export default DashboardReports;
