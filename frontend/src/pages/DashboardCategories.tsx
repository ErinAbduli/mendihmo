import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";
import { MoreVertical } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { apiClient } from "@/lib/api";
import { localizeErrorMessage } from "@/lib/error-utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
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
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

type ApiCategory = {
	id: number;
	name: string;
	slug: string;
	isActive?: boolean;
	_count?: {
		campaigns?: number;
	};
};

type CategoryRow = {
	id: number;
	name: string;
	slug: string;
	isActive: boolean;
	campaignsCount: number;
};

const categorySchema = z.object({
	name: z.string().min(2, {
		message: "Emri i kategorisë duhet të ketë të paktën 2 karaktere.",
	}),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

const normalizeCategories = (input: unknown): CategoryRow[] => {
	const source = Array.isArray(input)
		? input
		: input && typeof input === "object" && "categories" in input
			? (input as { categories: unknown }).categories
			: [];

	if (!Array.isArray(source)) {
		return [];
	}

	return source
		.filter((item): item is ApiCategory => Boolean(item && typeof item === "object"))
		.map((category) => ({
			id: category.id,
			name: category.name,
			slug: category.slug,
			isActive: category.isActive ?? true,
			campaignsCount: category._count?.campaigns ?? 0,
		}));
};

const DashboardCategories = () => {
	const [categories, setCategories] = useState<CategoryRow[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [query, setQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [orderBy, setOrderBy] = useState<"name" | "date" | "campaigns">("name");
	const [createDialogOpen, setCreateDialogOpen] = useState(false);
	const [editDialogOpen, setEditDialogOpen] = useState(false);
	const [statusDialogOpen, setStatusDialogOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [editingCategory, setEditingCategory] = useState<CategoryRow | null>(null);
	const [statusTargetCategory, setStatusTargetCategory] = useState<CategoryRow | null>(null);
	const [deleteTargetCategory, setDeleteTargetCategory] = useState<CategoryRow | null>(null);
	const [isCreating, setIsCreating] = useState(false);
	const [isUpdating, setIsUpdating] = useState(false);
	const [updatingStatusCategoryId, setUpdatingStatusCategoryId] = useState<number | null>(null);
	const [deletingCategoryId, setDeletingCategoryId] = useState<number | null>(null);

	const createForm = useForm<CategoryFormValues>({
		resolver: zodResolver(categorySchema),
		defaultValues: {
			name: "",
		},
	});

	const editForm = useForm<CategoryFormValues>({
		resolver: zodResolver(categorySchema),
		defaultValues: {
			name: "",
		},
	});

	const filteredCategories = useMemo(() => {
		const normalizedQuery = query.trim().toLowerCase();

		let results = categories.filter((category) => {
			// Search filter
			const matchesQuery =
				!normalizedQuery ||
				category.name.toLowerCase().includes(normalizedQuery) ||
				category.slug.toLowerCase().includes(normalizedQuery);

			// Status filter
				const matchesStatus =
					statusFilter === "all" ||
					(statusFilter === "aktiv" && category.isActive) ||
					(statusFilter === "joaktiv" && !category.isActive);

			return matchesQuery && matchesStatus;
		});

		// Sort
		results.sort((a, b) => {
			if (orderBy === "name") {
				return a.name.localeCompare(b.name);
			}
			if (orderBy === "campaigns") {
				return b.campaignsCount - a.campaignsCount;
			}
			return 0;
		});

		return results;
	}, [categories, query, statusFilter, orderBy]);

	const loadCategories = async () => {
		setLoading(true);
		setError(null);

		try {
			const data = await apiClient.get<unknown>("/categories?includeDisabled=true");
			setCategories(normalizeCategories(data));
		} catch (requestError) {
			const message = isAxiosError(requestError)
				? localizeErrorMessage(requestError.response?.data?.error) ??
					"Nuk mund të ngarkohen kategoritë."
				: "Nuk mund të ngarkohen kategoritë.";
			setError(message);
			setCategories([]);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		void loadCategories();
	}, []);

	const handleCreate = async (values: CategoryFormValues) => {
		setIsCreating(true);

		try {
			await apiClient.post("/categories", values);
			setCreateDialogOpen(false);
			createForm.reset({ name: "" });
			await loadCategories();
			toast.success("Kategoria u krijua me sukses.");
		} catch (requestError) {
			const message = isAxiosError(requestError)
				? localizeErrorMessage(requestError.response?.data?.error) ??
					"Nuk mund të krijohet kategoria."
				: "Nuk mund të krijohet kategoria.";
			toast.error(message);
		} finally {
			setIsCreating(false);
		}
	};

	const handleEditOpen = (category: CategoryRow) => {
		setEditingCategory(category);
		editForm.reset({ name: category.name });
		setEditDialogOpen(true);
	};

	const handleUpdate = async (values: CategoryFormValues) => {
		if (!editingCategory) {
			return;
		}

		setIsUpdating(true);

		try {
			await apiClient.put(`/categories/${editingCategory.id}`, values);
			setEditDialogOpen(false);
			setEditingCategory(null);
			await loadCategories();
			toast.success("Kategoria u përditësua me sukses.");
		} catch (requestError) {
			const message = isAxiosError(requestError)
				? localizeErrorMessage(requestError.response?.data?.error) ??
					"Nuk mund të përditësohet kategoria."
				: "Nuk mund të përditësohet kategoria.";
			toast.error(message);
		} finally {
			setIsUpdating(false);
		}
	};

	const handleStatusChange = async () => {
		if (!statusTargetCategory) {
			return;
		}

		setUpdatingStatusCategoryId(statusTargetCategory.id);

		try {
			await apiClient.patch(`/categories/${statusTargetCategory.id}/status`, {
				isActive: !statusTargetCategory.isActive,
			});
			setStatusDialogOpen(false);
			setStatusTargetCategory(null);
			await loadCategories();
			toast.success(
				statusTargetCategory.isActive
					? "Kategoria u çaktivizua me sukses."
					: "Kategoria u aktivizua me sukses.",
			);
		} catch (requestError) {
			const message = isAxiosError(requestError)
				? localizeErrorMessage(requestError.response?.data?.error) ??
					"Nuk mund të ndryshohet statusi i kategorisë."
				: "Nuk mund të ndryshohet statusi i kategorisë.";
			toast.error(message);
		} finally {
			setUpdatingStatusCategoryId(null);
		}
	};

	const handleDeleteCategory = async () => {
		if (!deleteTargetCategory) {
			return;
		}

		setDeletingCategoryId(deleteTargetCategory.id);

		try {
			await apiClient.delete(`/categories/${deleteTargetCategory.id}`);
			setDeleteDialogOpen(false);
			setDeleteTargetCategory(null);
			await loadCategories();
			toast.success("Kategoria u fshi me sukses.");
		} catch (requestError) {
			const message = isAxiosError(requestError)
				? localizeErrorMessage(requestError.response?.data?.error) ??
					"Nuk mund të fshihet kategoria."
				: "Nuk mund të fshihet kategoria.";
			toast.error(message);
		} finally {
			setDeletingCategoryId(null);
		}
	};

	return (
		<div className="space-y-5 sm:space-y-6">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<h1 className="font-bold text-2xl tracking-tight">Kategori</h1>
					<p className="text-muted-foreground text-sm sm:text-base">
						Menaxho kategoritë për fushatat e platformës.
					</p>
				</div>
				<Button onClick={() => setCreateDialogOpen(true)}>Shto kategori</Button>
			</div>

			<Card>
				<CardHeader>
					<div className="flex flex-col gap-3">
						<div>
							<CardTitle>Lista e kategorive</CardTitle>
							<CardDescription>
								Gjithsej {categories.length} kategori.
							</CardDescription>
						</div>
						<div className="flex flex-col gap-3 sm:flex-row">
							<Input
								value={query}
								onChange={(event) => setQuery(event.target.value)}
								placeholder="Kërko sipas emrit ose slug-ut"
								className="sm:max-w-xs"
							/>
							<Select value={statusFilter} onValueChange={setStatusFilter}>
								<SelectTrigger className="sm:w-52">
									<SelectValue placeholder="Të gjitha statuset" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">Të gjitha statuset</SelectItem>
									<SelectItem value="aktiv">Aktive</SelectItem>
									<SelectItem value="joaktiv">Jo aktive</SelectItem>
								</SelectContent>
							</Select>
							<Select value={orderBy} onValueChange={(value) => setOrderBy(value as typeof orderBy)}>
								<SelectTrigger className="sm:w-52">
									<SelectValue placeholder="Renditje" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="name">Emri</SelectItem>
									<SelectItem value="campaigns">Fushatat</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					{loading ? (
						<p className="text-muted-foreground text-sm">Duke ngarkuar kategoritë...</p>
					) : error ? (
						<p className="text-destructive text-sm">{error}</p>
					) : filteredCategories.length === 0 ? (
						<p className="text-muted-foreground text-sm">
							Nuk u gjet asnjë kategori për filtrin aktual.
						</p>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Emri</TableHead>
										<TableHead>Slug</TableHead>
										<TableHead>Statusi</TableHead>
										<TableHead>Fushata</TableHead>
										<TableHead className="text-right">Veprimet</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredCategories.map((category) => (
										<TableRow key={category.id}>
											<TableCell className="font-medium">{category.name}</TableCell>
											<TableCell>
												<Badge variant="outline">{category.slug}</Badge>
											</TableCell>
											<TableCell>
												<Badge variant={category.isActive ? "default" : "secondary"}>
													{category.isActive ? "Aktive" : "Çaktivizuar"}
												</Badge>
											</TableCell>
											<TableCell>{category.campaignsCount}</TableCell>
											<TableCell>
												<div className="flex justify-end">
													<DropdownMenu>
														<DropdownMenuTrigger asChild>
															<Button
																variant="ghost"
																size="icon-sm"
																aria-label="Hap menunë e kategorisë"
															>
																<MoreVertical className="size-4" />
															</Button>
														</DropdownMenuTrigger>
														<DropdownMenuContent align="end">
															<DropdownMenuItem
																onClick={() => handleEditOpen(category)}
															>
																Ndrysho
															</DropdownMenuItem>
															<DropdownMenuItem
																variant="default"
																className={
																	category.isActive
																		? "text-amber-700 focus:bg-amber-500/10 focus:text-amber-800 dark:text-amber-300 dark:focus:bg-amber-500/20 dark:focus:text-amber-200"
																		: undefined
																}
																disabled={updatingStatusCategoryId === category.id}
																onClick={() => {
																	setStatusTargetCategory(category);
																	setStatusDialogOpen(true);
																}}
															>
																{category.isActive ? "Çaktivizo" : "Aktivizo"}
															</DropdownMenuItem>
															<DropdownMenuItem
																variant="destructive"
																disabled={deletingCategoryId === category.id}
																onClick={() => {
																	setDeleteTargetCategory(category);
																	setDeleteDialogOpen(true);
																}}
															>
																Fshi
															</DropdownMenuItem>
														</DropdownMenuContent>
													</DropdownMenu>
												</div>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					)}
				</CardContent>
			</Card>

			<Dialog
				open={createDialogOpen}
				onOpenChange={(open) => {
					setCreateDialogOpen(open);
					if (!open) {
						createForm.reset({ name: "" });
					}
				}}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Shto kategori</DialogTitle>
						<DialogDescription>
							Plotëso emrin e kategorisë së re.
						</DialogDescription>
					</DialogHeader>

					<Form {...createForm}>
						<form
							onSubmit={createForm.handleSubmit(handleCreate)}
							className="space-y-4"
						>
							<FormField
								control={createForm.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Emri</FormLabel>
										<FormControl>
											<Input placeholder="p.sh. Arsim" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<DialogFooter>
								<DialogClose asChild>
									<Button type="button" variant="outline">
										Anulo
									</Button>
								</DialogClose>
								<Button type="submit" disabled={isCreating}>
									{isCreating ? "Duke ruajtur..." : "Ruaj"}
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
						setEditingCategory(null);
					}
				}}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Ndrysho kategori</DialogTitle>
						<DialogDescription>
							Përditëso emrin e kategorisë dhe ruaj ndryshimet.
						</DialogDescription>
					</DialogHeader>

					<Form {...editForm}>
						<form
							onSubmit={editForm.handleSubmit(handleUpdate)}
							className="space-y-4"
						>
							<FormField
								control={editForm.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Emri</FormLabel>
										<FormControl>
											<Input placeholder="p.sh. Arsim" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<DialogFooter>
								<DialogClose asChild>
									<Button type="button" variant="outline">
										Anulo
									</Button>
								</DialogClose>
								<Button type="submit" disabled={isUpdating}>
									{isUpdating ? "Duke ruajtur..." : "Ruaj"}
								</Button>
							</DialogFooter>
						</form>
					</Form>
				</DialogContent>
			</Dialog>

			<AlertDialog
				open={statusDialogOpen}
				onOpenChange={(open) => {
					setStatusDialogOpen(open);
					if (!open) {
						setStatusTargetCategory(null);
					}
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{statusTargetCategory?.isActive
								? "Çaktivizo kategorinë?"
								: "Aktivizo kategorinë?"}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{statusTargetCategory?.isActive
								? "Kategoria nuk do të fshihet, por nuk do të shfaqet për përdorim në formularët e fushatave."
								: "Kategoria do të aktivizohet dhe do të jetë e disponueshme sërish për përdorim."}
							{statusTargetCategory
								? ` Kategoria: ${statusTargetCategory.name}.`
								: ""}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Anulo</AlertDialogCancel>
						<AlertDialogAction
							onClick={(event) => {
								event.preventDefault();
								void handleStatusChange();
							}}
							disabled={Boolean(updatingStatusCategoryId)}
						>
							{updatingStatusCategoryId
								? "Duke ruajtur..."
								: statusTargetCategory?.isActive
									? "Po, çaktivizo"
									: "Po, aktivizo"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<AlertDialog
				open={deleteDialogOpen}
				onOpenChange={(open) => {
					setDeleteDialogOpen(open);
					if (!open) {
						setDeleteTargetCategory(null);
					}
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Fshi kategorinë përfundimisht?</AlertDialogTitle>
						<AlertDialogDescription>
							Kjo veprim nuk mund të kthehet mbrapa.
							{deleteTargetCategory
								? ` Kategoria: ${deleteTargetCategory.name}.`
								: ""}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Anulo</AlertDialogCancel>
						<AlertDialogAction
							onClick={(event) => {
								event.preventDefault();
								void handleDeleteCategory();
							}}
							disabled={Boolean(deletingCategoryId)}
						>
							{deletingCategoryId ? "Duke fshirë..." : "Po, fshije"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
};

export default DashboardCategories;
