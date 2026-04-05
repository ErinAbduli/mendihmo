import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, parseISO } from "date-fns";
import {
	type ColumnDef,
	type ColumnFiltersState,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	type PaginationState,
	type SortingState,
	useReactTable,
} from "@tanstack/react-table";
import { isAxiosError } from "axios";
import { MoreVertical, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { apiClient } from "@/lib/api";
import { localizeErrorMessage } from "@/lib/error-utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DatePicker } from "@/components/ui/date-picker";

type CampaignStatus = "draft" | "pending" | "active" | "funded" | "failed";

type ApiCategory = {
	id: number;
	name: string;
	slug: string;
};

type ApiCampaign = {
	id: number;
	title: string;
	slug: string;
	description: string;
	goalAmount: number;
	currentAmount: number;
	currency: string;
	startDate: string;
	endDate: string;
	status: CampaignStatus;
	creatorId: number;
	categoryId: number | null;
	coverImage: string | null;
	images: string | null;
	videoUrl: string | null;
	backersCount: number;
	likesCount: number;
	viewsCount: number;
	isFeatured: boolean;
	isApproved: boolean;
	createdAt: string;
	updatedAt: string;
	creator: {
		id: number;
		emri: string;
		mbiemri: string;
		email: string;
	};
	category: ApiCategory | null;
};

type CampaignRow = {
	id: number;
	title: string;
	slug: string;
	description: string;
	goalAmount: number;
	currentAmount: number;
	currency: string;
	status: CampaignStatus;
	categoryId: number | null;
	categoryName: string;
	creatorName: string;
	creatorEmail: string;
	startDate: string;
	endDate: string;
	dateRange: string;
	createdAt: string;
	isFeatured: boolean;
	isApproved: boolean;
	coverImage: string | null;
	images: string | null;
	videoUrl: string | null;
};

const campaignStatuses: CampaignStatus[] = [
	"draft",
	"pending",
	"active",
	"funded",
	"failed",
];

const campaignFormSchema = z.object({
	title: z.string().min(3, {
		message: "Titulli duhet të ketë të paktën 3 karaktere.",
	}),
	description: z.string().min(10, {
		message: "Përshkrimi duhet të ketë të paktën 10 karaktere.",
	}),
	goalAmount: z.coerce.number().positive({
		message: "Objektivi duhet të jetë më i madh se 0.",
	}),
	startDate: z.string().min(1, {
		message: "Data e fillimit është e detyrueshme.",
	}),
	endDate: z.string().min(1, {
		message: "Data e mbarimit është e detyrueshme.",
	}),
	status: z.enum(campaignStatuses),
	categoryId: z.coerce.number().int().positive({
		message: "Zgjidhni një kategori të vlefshme.",
	}),
	coverImage: z.union([z.string(), z.literal("")]).optional(),
	images: z.union([z.array(z.string()), z.string(), z.literal("")]).optional(),
	videoUrl: z.union([z.string(), z.literal("")]).optional(),
});

type CampaignFormValues = z.infer<typeof campaignFormSchema>;
type CampaignFormInput = z.input<typeof campaignFormSchema>;

const statusVariant = (
	status: CampaignStatus,
): "default" | "secondary" | "destructive" => {
	if (status === "active" || status === "funded") {
		return "default";
	}

	if (status === "pending") {
		return "secondary";
	}

	return "destructive";
};

const statusLabel = (status: CampaignStatus) => {
	if (status === "draft") return "Draft";
	if (status === "pending") return "Në pritje";
	if (status === "active") return "Aktive";
	if (status === "funded") return "E financuar";
	return "Dështuar";
};

const formatCurrency = (amount: number, currency: string) =>
	new Intl.NumberFormat("en-US", {
		style: "currency",
		currency,
		maximumFractionDigits: 0,
	}).format(amount);

const formatDate = (value: string) =>
	new Date(value).toLocaleDateString("sq-AL", {
		year: "numeric",
		month: "short",
		day: "numeric",
	});

const formatDateInputValue = (value?: string | null) => {
	if (!value) {
		return "";
	}

	const parsedDate = parseISO(value);
	return Number.isNaN(parsedDate.getTime()) ? "" : format(parsedDate, "yyyy-MM-dd");
};

const parseMediaSelection = (value: string | null) => {
	if (!value) {
		return [];
	}

	try {
		const parsed = JSON.parse(value) as unknown;
		if (Array.isArray(parsed)) {
			return parsed.filter((item): item is string => typeof item === "string");
		}
	} catch {
		return [value];
	}

	return [value];
};

const normalizeMediaValue = (value?: string | string[] | null) => {
	if (!value) {
		return undefined;
	}

	if (Array.isArray(value)) {
		const cleanedValue = value.map((item) => item.trim()).filter(Boolean);
		return cleanedValue.length ? cleanedValue : undefined;
	}

	const trimmedValue = value.trim();
	return trimmedValue ? trimmedValue : undefined;
};

const fileToDataUrl = (file: File) =>
	new Promise<string>((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			if (typeof reader.result === "string") {
				resolve(reader.result);
				return;
			}

			reject(new Error("Nuk u lexua dot skedari."));
		};
		reader.onerror = () => reject(reader.error ?? new Error("Nuk u lexua dot skedari."));
		reader.readAsDataURL(file);
	});

const filesToDataUrls = async (files: FileList | null) => {
	if (!files?.length) {
		return [];
	}

	return Promise.all(Array.from(files).map((file) => fileToDataUrl(file)));
};

const objectiveOptions = [1000, 5000, 10000, 25000, 50000];

type FileUploadFieldProps = {
	value?: string | string[] | null;
	onChange: (value: string | string[] | undefined) => void;
	accept: string;
	multiple?: boolean;
	placeholder: string;
	label: string;
	description: string;
};

function FileUploadField({
	value,
	onChange,
	accept,
	multiple = false,
	placeholder,
	label,
	description,
}: FileUploadFieldProps) {
	const inputRef = useRef<HTMLInputElement | null>(null);
	const selectedValues = Array.isArray(value) ? value : value ? [value] : [];

	const resetInput = () => {
		if (inputRef.current) {
			inputRef.current.value = "";
		}
	};

	const handleChange = async (event: ChangeEvent<HTMLInputElement>) => {
		const uploadedFiles = await filesToDataUrls(event.currentTarget.files);
		onChange(multiple ? uploadedFiles : uploadedFiles[0]);
		resetInput();
	};

	return (
		<Card className="border-dashed">
			<CardContent className="space-y-4 p-4">
				<div className="flex items-start justify-between gap-3">
					<div className="space-y-1">
						<p className="font-medium text-sm">{label}</p>
						<p className="text-muted-foreground text-xs">{description}</p>
					</div>
					<Button
						type="button"
						variant="ghost"
						size="icon-sm"
						onClick={() => {
							onChange(undefined);
							resetInput();
						}}
						disabled={!selectedValues.length}
						aria-label={`Pastro ${label.toLowerCase()}`}
					>
						<X className="size-4" />
					</Button>
				</div>

				<div className="flex flex-wrap items-center gap-3">
					<Button
						type="button"
						variant="outline"
						onClick={() => inputRef.current?.click()}
					>
						<Upload className="mr-2 size-4" />
						{placeholder}
					</Button>
					<input
						ref={inputRef}
						type="file"
						className="hidden"
						accept={accept}
						multiple={multiple}
						onChange={handleChange}
					/>
					<p className="text-muted-foreground text-xs">
						{selectedValues.length
							? multiple
								? `${selectedValues.length} skedarë të zgjedhur`
								: "Skedari u zgjodh"
							: "Nuk ka skedar të zgjedhur."}
					</p>
				</div>

				{selectedValues.length ? (
					<div className={multiple ? "grid gap-3 sm:grid-cols-2" : "space-y-3"}>
						{selectedValues.map((item, index) => (
							<div key={`${label}-${index}`} className="overflow-hidden rounded-lg border bg-muted/30">
								{accept.includes("image") ? (
									<img
										src={item}
										alt={`${label} ${index + 1}`}
										className="h-40 w-full object-cover"
									/>
								) : accept.includes("video") ? (
									<video controls className="h-48 w-full bg-black object-cover">
										<source src={item} />
										Your browser does not support the video tag.
									</video>
								) : null}
								<div className="border-t px-3 py-2 text-muted-foreground text-xs">
									{accept.includes("video") ? "Video e zgjedhur" : "Media e zgjedhur"}
								</div>
							</div>
						))}
					</div>
				) : null}
			</CardContent>
		</Card>
	);
}

const normalizeCampaignRows = (input: unknown): CampaignRow[] => {
	const source = Array.isArray(input)
		? input
		: input && typeof input === "object" && "campaigns" in input
			? (input as { campaigns: unknown }).campaigns
			: [];

	if (!Array.isArray(source)) {
		return [];
	}

	return source
		.filter((item): item is ApiCampaign => Boolean(item && typeof item === "object"))
		.map((campaign, index) => {
			const creatorName = `${campaign.creator?.emri ?? ""} ${campaign.creator?.mbiemri ?? ""}`.trim() ||
				campaign.creator?.email ||
				"Përdorues i panjohur";
			const categoryName = campaign.category?.name ?? "Pa kategori";
			const dateRange = `${formatDate(campaign.startDate)} - ${formatDate(campaign.endDate)}`;

			return {
				id: typeof campaign.id === "number" ? campaign.id : index + 1,
				title: campaign.title,
				slug: campaign.slug,
				description: campaign.description,
				goalAmount: campaign.goalAmount,
				currentAmount: campaign.currentAmount,
				currency: campaign.currency ?? "EUR",
				status: campaign.status,
				categoryId: campaign.categoryId,
				categoryName,
				creatorName,
				creatorEmail: campaign.creator?.email ?? "",
				startDate: campaign.startDate,
				endDate: campaign.endDate,
				dateRange,
				createdAt: campaign.createdAt,
				isFeatured: Boolean(campaign.isFeatured),
				isApproved: Boolean(campaign.isApproved),
				coverImage: campaign.coverImage,
				images: campaign.images,
				videoUrl: campaign.videoUrl,
			};
		});
};

const normalizeCategories = (input: unknown): ApiCategory[] => {
	if (!Array.isArray(input)) {
		return [];
	}

	return input.filter((item): item is ApiCategory => Boolean(item && typeof item === "object"));
};

const buildColumns = ({
	onEdit,
	onDelete,
	deletingCampaignId,
}: {
	onEdit: (campaign: CampaignRow) => void;
	onDelete: (campaign: CampaignRow) => void;
	deletingCampaignId: number | null;
}): ColumnDef<CampaignRow>[] => [
	{
		accessorKey: "title",
		header: "Fushata",
		cell: ({ row }) => {
			const campaign = row.original;
			return (
				<div className="space-y-1">
					<p className="font-medium text-sm">{campaign.title}</p>
					<p className="max-w-88 truncate text-muted-foreground text-xs">
						{campaign.slug}
					</p>
				</div>
			);
		},
	},
	{
		accessorKey: "creatorName",
		header: "Krijuesi",
		cell: ({ row }) => {
			const campaign = row.original;
			return (
				<div className="space-y-1">
					<p className="font-medium text-sm">{campaign.creatorName}</p>
					<p className="text-muted-foreground text-xs">
						{campaign.creatorEmail}
					</p>
				</div>
			);
		},
	},
	{
		accessorKey: "categoryName",
		header: "Kategoria",
		cell: ({ row }) => <Badge variant="outline">{row.original.categoryName}</Badge>,
	},
	{
		accessorKey: "goalAmount",
		header: "Financimi",
		cell: ({ row }) => {
			const campaign = row.original;
			return (
				<div className="space-y-1">
					<p className="font-medium text-sm">
						{formatCurrency(campaign.currentAmount, campaign.currency)} / {formatCurrency(campaign.goalAmount, campaign.currency)}
					</p>
					<p className="text-muted-foreground text-xs">
						Synimi: {campaign.currency}
					</p>
				</div>
			);
		},
	},
	{
		accessorKey: "status",
		header: "Statusi",
		cell: ({ row }) => (
			<Badge variant={statusVariant(row.original.status)}>
				{statusLabel(row.original.status)}
			</Badge>
		),
	},
	{
		accessorKey: "dateRange",
		header: "Afati",
		cell: ({ row }) => (
			<div className="space-y-1 text-sm">
				<p>{row.original.dateRange}</p>
				<p className="text-muted-foreground text-xs">
					Krijuar më {formatDate(row.original.createdAt)}
				</p>
			</div>
		),
	},
	{
		id: "actions",
		header: () => <div className="text-right">Veprimet</div>,
		cell: ({ row }) => (
			<div className="flex justify-end">
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="ghost"
							size="icon-sm"
							aria-label="Hap menunë e fushatës"
						>
								<MoreVertical className="size-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem onClick={() => onEdit(row.original)}>
								Ndrysho fushatën
							</DropdownMenuItem>
							<DropdownMenuItem
								variant="destructive"
								disabled={deletingCampaignId === row.original.id}
								onClick={() => onDelete(row.original)}
							>
								Largo
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
			</div>
		),
	},
];

const emptyFormDefaults: CampaignFormInput = {
	title: "",
	description: "",
	goalAmount: 0,
	startDate: "",
	endDate: "",
	status: "draft",
	categoryId: 0,
	coverImage: "",
	images: [],
	videoUrl: "",
};

const DashboardCampaigns = () => {
	const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
	const [categories, setCategories] = useState<ApiCategory[]>([]);
	const [createDialogOpen, setCreateDialogOpen] = useState(false);
	const [editDialogOpen, setEditDialogOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [editingCampaign, setEditingCampaign] = useState<CampaignRow | null>(null);
	const [campaignToDelete, setCampaignToDelete] = useState<CampaignRow | null>(null);
	const [isCreating, setIsCreating] = useState(false);
	const [isUpdating, setIsUpdating] = useState(false);
	const [deletingCampaignId, setDeletingCampaignId] = useState<number | null>(null);
	const [isCreateGoalCustom, setIsCreateGoalCustom] = useState(false);
	const [isEditGoalCustom, setIsEditGoalCustom] = useState(false);
	const [sorting, setSorting] = useState<SortingState>([]);
	const [pagination, setPagination] = useState<PaginationState>({
		pageIndex: 0,
		pageSize: 10,
	});
	const [titleFilter, setTitleFilter] = useState("");
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const createForm = useForm<CampaignFormInput, unknown, CampaignFormValues>({
		resolver: zodResolver(campaignFormSchema),
		defaultValues: emptyFormDefaults,
	});

	const editForm = useForm<CampaignFormInput, unknown, CampaignFormValues>({
		resolver: zodResolver(campaignFormSchema),
		defaultValues: emptyFormDefaults,
	});

	const fetchCampaigns = async () => {
		setLoading(true);
		setError(null);

		try {
			const [campaignData, categoryData] = await Promise.all([
				apiClient.get<unknown>("/campaigns"),
				apiClient.get<unknown>("/categories"),
			]);

			setCampaigns(normalizeCampaignRows(campaignData));
			setCategories(normalizeCategories(categoryData));
		} catch (err) {
			const backendMessage = isAxiosError<{ error?: string }>(err)
				? err.response?.data?.error ?? err.message
				: err instanceof Error
					? err.message
					: null;

			setError(
				localizeErrorMessage(backendMessage) ?? "Dështoi ngarkimi i fushatave.",
			);
			setCampaigns([]);
			setCategories([]);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		void fetchCampaigns();
	}, []);

	useEffect(() => {
		setColumnFilters(titleFilter ? [{ id: "title", value: titleFilter }] : []);
	}, [titleFilter]);

	const table = useReactTable({
		data: campaigns,
		columns: useMemo(
			() =>
				buildColumns({
					onEdit: (campaign) => {
						setEditingCampaign(campaign);
							setIsEditGoalCustom(!objectiveOptions.includes(campaign.goalAmount));
						editForm.reset({
							title: campaign.title,
							description: campaign.description,
							goalAmount: campaign.goalAmount,
							startDate: formatDateInputValue(campaign.startDate),
							endDate: formatDateInputValue(campaign.endDate),
							status: campaign.status,
							categoryId: campaign.categoryId ?? "",
							coverImage: campaign.coverImage ?? "",
							images: parseMediaSelection(campaign.images),
							videoUrl: campaign.videoUrl ?? "",
						});
						setEditDialogOpen(true);
					},
					onDelete: (campaign) => {
						setCampaignToDelete(campaign);
						setDeleteDialogOpen(true);
					},
					deletingCampaignId,
				}),
			[deletingCampaignId, editForm],
		),
		state: {
			sorting,
			columnFilters,
			pagination,
		},
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onPaginationChange: setPagination,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
	});

	const columnsCount = table.getAllLeafColumns().length;
	const totalRows = table.getFilteredRowModel().rows.length;
	const startRow = totalRows === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1;
	const endRow = Math.min((pagination.pageIndex + 1) * pagination.pageSize, totalRows);

	const categoryOptions = categories.map((category) => ({
		label: category.name,
		value: String(category.id),
	}));

	const mapFormPayload = (values: CampaignFormValues) => ({
		title: values.title,
		description: values.description,
		goalAmount: values.goalAmount,
		startDate: values.startDate,
		endDate: values.endDate,
		status: values.status,
		categoryId: Number(values.categoryId),
		coverImage: normalizeMediaValue(values.coverImage),
		images: normalizeMediaValue(values.images),
		videoUrl: normalizeMediaValue(values.videoUrl),
	});

	const openCreateDialog = () => {
		setIsCreateGoalCustom(false);
		createForm.reset(emptyFormDefaults);
		setCreateDialogOpen(true);
	};

	async function onCreateCampaign(values: CampaignFormValues) {
		setIsCreating(true);
		try {
			await apiClient.post<ApiCampaign, ReturnType<typeof mapFormPayload>>(
				"/campaigns",
				mapFormPayload(values),
			);
			toast.success("Fushata u krijua me sukses.");
			setCreateDialogOpen(false);
			setIsCreateGoalCustom(false);
			createForm.reset(emptyFormDefaults);
			await fetchCampaigns();
		} catch (submitError) {
			const backendMessage = isAxiosError<{ error?: string }>(submitError)
				? submitError.response?.data?.error
				: null;

			toast.error(
				localizeErrorMessage(backendMessage) ?? "Krijimi i fushatës dështoi.",
			);
		} finally {
			setIsCreating(false);
		}
	}

	async function onUpdateCampaign(values: CampaignFormValues) {
		if (!editingCampaign) {
			return;
		}

		setIsUpdating(true);
		try {
			await apiClient.put<ApiCampaign, ReturnType<typeof mapFormPayload>>(
				`/campaigns/${editingCampaign.id}`,
				mapFormPayload(values),
			);
			toast.success("Fushata u përditësua me sukses.");
			setEditDialogOpen(false);
			setEditingCampaign(null);
			setIsEditGoalCustom(false);
			editForm.reset(emptyFormDefaults);
			await fetchCampaigns();
		} catch (submitError) {
			const backendMessage = isAxiosError<{ error?: string }>(submitError)
				? submitError.response?.data?.error
				: null;

			toast.error(
				localizeErrorMessage(backendMessage) ??
					"Përditësimi i fushatës dështoi.",
			);
		} finally {
			setIsUpdating(false);
		}
	}

	async function handleDeleteCampaign() {
		if (!campaignToDelete) {
			return;
		}

		setDeletingCampaignId(campaignToDelete.id);
		try {
			await apiClient.delete<void>(`/campaigns/${campaignToDelete.id}`);
			toast.success("Fushata u fshi me sukses.");
			setDeleteDialogOpen(false);
			setCampaignToDelete(null);
			await fetchCampaigns();
		} catch (deleteError) {
			const backendMessage = isAxiosError<{ error?: string }>(deleteError)
				? deleteError.response?.data?.error
				: null;

			toast.error(
				localizeErrorMessage(backendMessage) ?? "Fshirja e fushatës dështoi.",
			);
		} finally {
			setDeletingCampaignId(null);
		}
	}

	return (
		<div className="space-y-5 sm:space-y-6">
			<div className="flex flex-wrap items-end justify-between gap-3">
				<div>
					<h1 className="font-bold text-2xl tracking-tight">
						Fushatat
					</h1>
					<p className="text-muted-foreground text-sm sm:text-base">
						Menaxhoni të gjitha fushatat nga paneli i administratorit.
					</p>
				</div>
				<Dialog
					open={createDialogOpen}
					onOpenChange={(open) => {
						setCreateDialogOpen(open);
						if (!open) {
							setIsCreateGoalCustom(false);
							createForm.reset(emptyFormDefaults);
						}
					}}
				>
					<Button size="sm" onClick={openCreateDialog}>
						Krijo fushatë
					</Button>
					<DialogContent className="max-h-[90vh] max-w-5xl overflow-hidden rounded-2xl border p-0 shadow-xl">
						<DialogHeader className="border-b bg-muted/40 px-6 py-4">
							<DialogTitle>Krijo fushatë</DialogTitle>
							<DialogDescription>
								Plotësoni detajet e fushatës dhe zgjidhni kategorinë e saj.
							</DialogDescription>
						</DialogHeader>

						<Form {...createForm}>
							<form
								onSubmit={createForm.handleSubmit(onCreateCampaign)}
								className="flex max-h-[calc(90vh-110px)] flex-col"
							>
								<div className="space-y-6 overflow-y-auto px-6 py-5">
									<div className="space-y-4 rounded-xl border bg-muted/20 p-5">
										<div>
											<h3 className="font-semibold text-sm">Detajet Kryesore</h3>
											<p className="text-muted-foreground text-xs">
												Informacioni bazë i fushatës që do të shfaqet publikisht.
											</p>
										</div>
										<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
											<FormField
												control={createForm.control}
												name="title"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Titulli</FormLabel>
														<FormControl>
															<Input placeholder="Shkruani titullin" {...field} />
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
										</div>

										<FormField
											control={createForm.control}
											name="description"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Përshkrimi</FormLabel>
													<FormControl>
														<textarea
															{...field}
															rows={4}
															className="flex min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
															placeholder="Përshkruani fushatën"
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>

									<div className="space-y-4 rounded-xl border bg-muted/20 p-5">
										<div>
											<h3 className="font-semibold text-sm">Konfigurimi</h3>
											<p className="text-muted-foreground text-xs">
												Vendos objektivin, kategorinë dhe statusin fillestar.
											</p>
										</div>
										<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
											<FormField
												control={createForm.control}
												name="goalAmount"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Objektivi</FormLabel>
														<FormControl>
															<div className="space-y-3">
																<Select
																	value={
																		isCreateGoalCustom
																			? "custom"
																			: String(field.value)
																	}
																	onValueChange={(value) => {
																		if (value === "custom") {
																			setIsCreateGoalCustom(true);
																			return;
																		}

																		setIsCreateGoalCustom(false);
																		field.onChange(Number(value));
																	}}
																>
																	<SelectTrigger>
																		<SelectValue placeholder="Zgjidh objektivin" />
																	</SelectTrigger>
																	<SelectContent>
																		{objectiveOptions.map((amount) => (
																			<SelectItem key={amount} value={String(amount)}>
																				{formatCurrency(amount, "EUR")}
																			</SelectItem>
																		))}
																		<SelectItem value="custom">Shumë e personalizuar</SelectItem>
																	</SelectContent>
																</Select>
																{isCreateGoalCustom ? (
																	<Input
																		type="number"
																		step="0.01"
																		min="0"
																		placeholder="Shkruani shumën"
																		value={field.value as string | number | undefined}
																		onChange={field.onChange}
																		onBlur={field.onBlur}
																		name={field.name}
																	/>
																) : null}
															</div>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>

											<FormField
												control={createForm.control}
												name="categoryId"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Kategoria</FormLabel>
														<FormControl>
															<Select
																onValueChange={field.onChange}
																value={String(field.value || "")}
															>
																<SelectTrigger>
																	<SelectValue placeholder="Zgjidh kategorinë" />
																</SelectTrigger>
																<SelectContent>
																	{categoryOptions.length ? (
																		categoryOptions.map((category) => (
																			<SelectItem key={category.value} value={category.value}>
																				{category.label}
																			</SelectItem>
																		))
																	) : (
																		<SelectItem value="0" disabled>
																			Nuk ka kategori
																		</SelectItem>
																	)}
																</SelectContent>
															</Select>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
										</div>

										<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
											<FormField
												control={createForm.control}
												name="status"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Statusi</FormLabel>
														<FormControl>
															<Select
																onValueChange={field.onChange}
																value={field.value}
															>
																<SelectTrigger>
																	<SelectValue placeholder="Zgjidh statusin" />
																</SelectTrigger>
																<SelectContent>
																	{campaignStatuses.map((status) => (
																		<SelectItem key={status} value={status}>
																			{statusLabel(status)}
																		</SelectItem>
																	))}
																</SelectContent>
															</Select>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
										</div>
									</div>

									<div className="space-y-4 rounded-xl border bg-muted/20 p-5">
										<div>
											<h3 className="font-semibold text-sm">Afatet</h3>
											<p className="text-muted-foreground text-xs">
												Përcakto datat e fillimit dhe mbarimit të fushatës.
											</p>
										</div>
										<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
											<FormField
												control={createForm.control}
												name="startDate"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Data e fillimit</FormLabel>
														<FormControl>
															<DatePicker
																value={field.value}
																onChange={field.onChange}
																placeholder="Zgjidh datën e fillimit"
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>

											<FormField
												control={createForm.control}
												name="endDate"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Data e mbarimit</FormLabel>
														<FormControl>
															<DatePicker
																value={field.value}
																onChange={field.onChange}
																placeholder="Zgjidh datën e mbarimit"
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
										</div>
									</div>

									<div className="space-y-4 rounded-xl border bg-muted/20 p-5">
										<div>
											<h3 className="font-semibold text-sm">Media</h3>
											<p className="text-muted-foreground text-xs">
												Ngarko cover, video dhe imazhe shtesë për prezantim më të mirë.
											</p>
										</div>
										<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
											<FormField
												control={createForm.control}
												name="coverImage"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Cover image</FormLabel>
														<FormControl>
															<FileUploadField
																value={field.value}
																onChange={field.onChange}
																accept="image/*"
																placeholder="Zgjidh një imazh"
																label="Cover image"
																description="Ngarkoni skedarin e imazhit për kopertinën e fushatës."
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>

											<FormField
												control={createForm.control}
												name="videoUrl"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Video URL</FormLabel>
														<FormControl>
															<FileUploadField
																value={field.value}
																onChange={field.onChange}
																accept="video/*"
																placeholder="Zgjidh një video"
																label="Video URL"
																description="Ngarkoni një skedar video që do të ruhet në Cloudinary."
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
										</div>

										<FormField
											control={createForm.control}
											name="images"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Imazhe të tjera</FormLabel>
													<FormControl>
														<FileUploadField
															value={field.value}
															onChange={field.onChange}
															accept="image/*"
															multiple
															placeholder="Zgjidh imazhe"
															label="Imazhe të tjera"
															description="Ngarkoni një ose më shumë imazhe shtesë të fushatës."
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>
								</div>

								<DialogFooter className="border-t bg-background/95 px-6 py-4 backdrop-blur supports-backdrop-filter:bg-background/80">
									<DialogClose asChild>
										<Button variant="outline" type="button">
											Anulo
										</Button>
									</DialogClose>
									<Button type="submit" disabled={isCreating}>
										{isCreating ? "Duke krijuar..." : "Krijo fushatë"}
									</Button>
								</DialogFooter>
							</form>
						</Form>
					</DialogContent>
				</Dialog>

				<Dialog
					open={editDialogOpen}
					onOpenChange={(open) => {
						setEditDialogOpen(open);
						if (!open) {
							setEditingCampaign(null);
							setIsEditGoalCustom(false);
							editForm.reset(emptyFormDefaults);
						}
					}}
				>
					<DialogContent className="max-h-[90vh] max-w-5xl overflow-hidden rounded-2xl border p-0 shadow-xl">
						<DialogHeader className="border-b bg-muted/40 px-6 py-4">
							<DialogTitle>Ndrysho fushatën</DialogTitle>
							<DialogDescription>
								Përditëso të dhënat dhe vendos ndryshimet.
							</DialogDescription>
						</DialogHeader>

						<Form {...editForm}>
							<form
								onSubmit={editForm.handleSubmit(onUpdateCampaign)}
								className="flex max-h-[calc(90vh-110px)] flex-col"
							>
								<div className="space-y-6 overflow-y-auto px-6 py-5">
									<div className="space-y-4 rounded-xl border bg-muted/20 p-5">
										<div>
											<h3 className="font-semibold text-sm">Detajet Kryesore</h3>
											<p className="text-muted-foreground text-xs">
												Përditëso titullin dhe përshkrimin e fushatës.
											</p>
										</div>
										<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
											<FormField
												control={editForm.control}
												name="title"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Titulli</FormLabel>
														<FormControl>
															<Input {...field} />
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
										</div>

										<FormField
											control={editForm.control}
											name="description"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Përshkrimi</FormLabel>
													<FormControl>
														<textarea
															{...field}
															rows={4}
															className="flex min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>

									<div className="space-y-4 rounded-xl border bg-muted/20 p-5">
										<div>
											<h3 className="font-semibold text-sm">Konfigurimi</h3>
											<p className="text-muted-foreground text-xs">
												Përditëso objektivin, kategorinë dhe statusin e fushatës.
											</p>
										</div>
										<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
											<FormField
												control={editForm.control}
												name="goalAmount"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Objektivi</FormLabel>
														<FormControl>
															<div className="space-y-3">
																<Select
																	value={
																		isEditGoalCustom
																			? "custom"
																			: String(field.value)
																	}
																	onValueChange={(value) => {
																		if (value === "custom") {
																			setIsEditGoalCustom(true);
																			return;
																		}

																		setIsEditGoalCustom(false);
																		field.onChange(Number(value));
																	}}
																>
																	<SelectTrigger>
																		<SelectValue placeholder="Zgjidh objektivin" />
																	</SelectTrigger>
																	<SelectContent>
																		{objectiveOptions.map((amount) => (
																			<SelectItem key={amount} value={String(amount)}>
																				{formatCurrency(amount, "EUR")}
																			</SelectItem>
																		))}
																		<SelectItem value="custom">Shumë e personalizuar</SelectItem>
																	</SelectContent>
																</Select>
																{isEditGoalCustom ? (
																	<Input
																		type="number"
																		step="0.01"
																		min="0"
																		placeholder="Shkruani shumën"
																		value={field.value as string | number | undefined}
																		onChange={field.onChange}
																		onBlur={field.onBlur}
																		name={field.name}
																	/>
																) : null}
															</div>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>

											<FormField
												control={editForm.control}
												name="categoryId"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Kategoria</FormLabel>
														<FormControl>
															<Select
																onValueChange={field.onChange}
																value={String(field.value || "")}
															>
																<SelectTrigger>
																	<SelectValue placeholder="Zgjidh kategorinë" />
																</SelectTrigger>
																<SelectContent>
																	{categoryOptions.map((category) => (
																		<SelectItem key={category.value} value={category.value}>
																			{category.label}
																		</SelectItem>
																	))}
																</SelectContent>
															</Select>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
										</div>

										<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
											<FormField
												control={editForm.control}
												name="status"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Statusi</FormLabel>
														<FormControl>
															<Select
																onValueChange={field.onChange}
																value={field.value}
															>
																<SelectTrigger>
																	<SelectValue placeholder="Zgjidh statusin" />
																</SelectTrigger>
																<SelectContent>
																	{campaignStatuses.map((status) => (
																		<SelectItem key={status} value={status}>
																			{statusLabel(status)}
																		</SelectItem>
																	))}
																</SelectContent>
															</Select>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
										</div>
									</div>

									<div className="space-y-4 rounded-xl border bg-muted/20 p-5">
										<div>
											<h3 className="font-semibold text-sm">Afatet</h3>
											<p className="text-muted-foreground text-xs">
												Rishiko kohëzgjatjen dhe datat e fushatës.
											</p>
										</div>
										<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
									<FormField
										control={editForm.control}
										name="startDate"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Data e fillimit</FormLabel>
												<FormControl>
													<DatePicker
														value={field.value}
														onChange={field.onChange}
														placeholder="Zgjidh datën e fillimit"
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={editForm.control}
										name="endDate"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Data e mbarimit</FormLabel>
												<FormControl>
													<DatePicker
														value={field.value}
														onChange={field.onChange}
														placeholder="Zgjidh datën e mbarimit"
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
										</div>
									</div>

									<div className="space-y-4 rounded-xl border bg-muted/20 p-5">
										<div>
											<h3 className="font-semibold text-sm">Media</h3>
											<p className="text-muted-foreground text-xs">
												Përditëso materialet vizuale që shoqërojnë fushatën.
											</p>
										</div>
										<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
											<FormField
												control={editForm.control}
												name="coverImage"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Cover image</FormLabel>
														<FormControl>
															<FileUploadField
																value={field.value}
																onChange={field.onChange}
																accept="image/*"
																placeholder="Zgjidh një imazh"
																label="Cover image"
																description="Ngarkoni skedarin e imazhit për kopertinën e fushatës."
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>

											<FormField
												control={editForm.control}
												name="videoUrl"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Video URL</FormLabel>
														<FormControl>
															<FileUploadField
																value={field.value}
																onChange={field.onChange}
																accept="video/*"
																placeholder="Zgjidh një video"
																label="Video URL"
																description="Ngarkoni një skedar video që do të ruhet në Cloudinary."
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
										</div>

										<FormField
											control={editForm.control}
											name="images"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Imazhe të tjera</FormLabel>
													<FormControl>
														<FileUploadField
															value={field.value}
															onChange={field.onChange}
															accept="image/*"
															multiple
															placeholder="Zgjidh imazhe"
															label="Imazhe të tjera"
															description="Ngarkoni një ose më shumë imazhe shtesë të fushatës."
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>
								</div>

								<DialogFooter className="border-t bg-background/95 px-6 py-4 backdrop-blur supports-backdrop-filter:bg-background/80">
									<DialogClose asChild>
										<Button variant="outline" type="button">
											Anulo
										</Button>
									</DialogClose>
									<Button type="submit" disabled={isUpdating}>
										{isUpdating ? "Duke përditësuar..." : "Ruaj ndryshimet"}
									</Button>
								</DialogFooter>
							</form>
						</Form>
					</DialogContent>
				</Dialog>

				<AlertDialog
					open={deleteDialogOpen}
					onOpenChange={(open) => {
						setDeleteDialogOpen(open);
						if (!open && !deletingCampaignId) {
							setCampaignToDelete(null);
						}
					}}
				>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>A jeni i sigurt?</AlertDialogTitle>
							<AlertDialogDescription>
								{campaignToDelete
									? `Ky veprim do ta fshijë përgjithmonë fushatën ${campaignToDelete.title}.`
									: "Ky veprim do ta fshijë përgjithmonë fushatën."}
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel disabled={Boolean(deletingCampaignId)}>
								Anulo
							</AlertDialogCancel>
							<AlertDialogAction
								onClick={(event) => {
									event.preventDefault();
									void handleDeleteCampaign();
								}}
								disabled={Boolean(deletingCampaignId)}
							>
								{deletingCampaignId ? "Duke fshirë..." : "Fshi fushatën"}
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Lista e fushatave</CardTitle>
					<CardDescription>
						Shikoni, kërkoni dhe menaxhoni të gjitha fushatat nga tabela.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<Input
						placeholder="Filtro fushatat sipas titullit..."
						value={titleFilter}
						onChange={(event) => {
							setTitleFilter(event.target.value);
							table.setPageIndex(0);
						}}
						className="max-w-sm"
					/>
					<div className="overflow-hidden rounded-md border">
						<Table>
							<TableHeader>
								{table.getHeaderGroups().map((headerGroup) => (
									<TableRow key={headerGroup.id}>
										{headerGroup.headers.map((header) => (
											<TableHead key={header.id}>
												{header.isPlaceholder
													? null
													: flexRender(header.column.columnDef.header, header.getContext())}
											</TableHead>
										))}
									</TableRow>
								))}
							</TableHeader>
							<TableBody>
								{loading ? (
									<TableRow>
										<TableCell colSpan={columnsCount} className="h-24 text-center">
											Duke ngarkuar fushatat...
										</TableCell>
									</TableRow>
								) : error ? (
									<TableRow>
										<TableCell colSpan={columnsCount} className="h-24 text-center text-destructive">
											{error}
										</TableCell>
									</TableRow>
								) : table.getRowModel().rows.length ? (
									table.getRowModel().rows.map((row) => (
										<TableRow key={row.id}>
											{row.getVisibleCells().map((cell) => (
												<TableCell key={cell.id}>
													{flexRender(cell.column.columnDef.cell, cell.getContext())}
												</TableCell>
											))}
										</TableRow>
									))
								) : (
									<TableRow>
										<TableCell colSpan={columnsCount} className="h-24 text-center">
											Nuk u gjet asnjë fushatë.
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</div>

					<div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
						<p className="text-muted-foreground text-sm">
							Duke shfaqur {startRow}-{endRow} nga {totalRows} fushata
						</p>
						<div className="flex items-center gap-2">
							<Select
								value={String(pagination.pageSize)}
								onValueChange={(value) => {
									table.setPageSize(Number(value));
									table.setPageIndex(0);
								}}
							>
								<SelectTrigger className="w-32.5">
									<SelectValue placeholder="Rreshta/faqe" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="5">5 / faqe</SelectItem>
									<SelectItem value="10">10 / faqe</SelectItem>
									<SelectItem value="20">20 / faqe</SelectItem>
									<SelectItem value="50">50 / faqe</SelectItem>
								</SelectContent>
							</Select>

							<div className="flex items-center gap-2">
								<Button
									variant="outline"
									size="sm"
									onClick={() => table.previousPage()}
									disabled={!table.getCanPreviousPage()}
								>
									Mbrapa
								</Button>
								<span className="text-sm">
									Faqja {pagination.pageIndex + 1} nga {table.getPageCount() || 1}
								</span>
								<Button
									variant="outline"
									size="sm"
									onClick={() => table.nextPage()}
									disabled={!table.getCanNextPage()}
								>
									Para
								</Button>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
};

export default DashboardCampaigns;
