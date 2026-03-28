import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { MoreVertical } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { apiClient } from "@/lib/api";
import { localizeErrorMessage } from "@/lib/error-utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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

type UserRow = {
	id: number;
	emri: string;
	mbiemri: string;
	name: string;
	email: string;
	role: "USER" | "MODERATOR" | "ADMIN";
	status: "active" | "suspended";
	lastActive: string;
};

type ApiUser = {
	id: number;
	emri: string;
	mbiemri: string;
	email: string;
	data_krijimit: string;
	statusi: "aktiv" | "joaktiv";
	userRoles: Array<{
		role: {
			normalized_name: "USER" | "MODERATOR" | "ADMIN";
		};
	}>;
};

const createUserSchema = z.object({
	emri: z.string().min(2, {
		message: "Emri duhet të ketë të paktën 2 karaktere.",
	}),
	mbiemri: z.string().min(2, {
		message: "Mbiemri duhet të ketë të paktën 2 karaktere.",
	}),
	email: z.email({
		message: "Ju lutemi vendosni një email të vlefshme.",
	}),
	password: z.string().min(8, {
		message: "Fjalëkalimi duhet të ketë të paktën 8 karaktere.",
	}),
	role: z.enum(["USER", "MODERATOR", "ADMIN"]),
});

type CreateUserFormValues = z.infer<typeof createUserSchema>;

const updateUserSchema = z.object({
	emri: z.string().min(2, {
		message: "Emri duhet të ketë të paktën 2 karaktere.",
	}),
	mbiemri: z.string().min(2, {
		message: "Mbiemri duhet të ketë të paktën 2 karaktere.",
	}),
	email: z.email({
		message: "Ju lutemi vendosni një email të vlefshme.",
	}),
	role: z.enum(["USER", "MODERATOR", "ADMIN"]),
	statusi: z.enum(["aktiv", "joaktiv"]),
});

type UpdateUserFormValues = z.infer<typeof updateUserSchema>;

const getInitials = (name: string) =>
	name
		.split(" ")
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase() ?? "")
		.join("");

const statusVariant = (
	status: UserRow["status"],
): "default" | "secondary" | "destructive" => {
	if (status === "active") {
		return "default";
	}

	return "destructive";
};

const roleLabel = (role: UserRow["role"]) => {
	if (role === "ADMIN") {
		return "Administrator";
	}

	if (role === "MODERATOR") {
		return "Moderator";
	}

	return "Përdorues";
};

const normalizeStatus = (status: ApiUser["statusi"]): UserRow["status"] => {
	if (status === "aktiv") {
		return "active";
	}

	return "suspended";
};

const normalizeUsers = (input: unknown): UserRow[] => {
	const source = Array.isArray(input)
		? input
		: input && typeof input === "object" && "users" in input
			? (input as { users: unknown }).users
			: [];

	if (!Array.isArray(source)) {
		return [];
	}

	return source
		.filter((item): item is ApiUser =>
			Boolean(item && typeof item === "object"),
		)
		.map((user, index) => {
			const name = `${user.emri} ${user.mbiemri}`.trim() || "Përdorues i panjohur";
			const status = normalizeStatus(user.statusi);
			const createdDate = user.data_krijimit;
			const normalizedRole =
				user.userRoles[0]?.role.normalized_name ?? "USER";

			return {
				id: typeof user.id === "number" ? user.id : index + 1,
				emri: user.emri,
				mbiemri: user.mbiemri,
				name,
				email: user.email,
				role: normalizedRole,
				status,
				lastActive: createdDate
					? new Date(createdDate).toLocaleDateString()
					: "-",
			};
		});
};

const buildColumns = ({
	onEdit,
	onDelete,
	deletingUserId,
}: {
	onEdit: (user: UserRow) => void;
	onDelete: (user: UserRow) => void;
	deletingUserId: number | null;
}): ColumnDef<UserRow>[] => [
	{
		accessorKey: "name",
		header: "Përdoruesi",
		cell: ({ row }) => {
			const user = row.original;
			return (
				<div className="flex min-w-0 items-center gap-3">
					<Avatar size="default">
						<AvatarFallback>
							{getInitials(user.name)}
						</AvatarFallback>
					</Avatar>
					<div className="min-w-0">
						<p className="truncate font-medium text-sm">
							{user.name}
						</p>
						<p className="truncate text-muted-foreground text-sm">
							{user.email}
						</p>
					</div>
				</div>
			);
		},
	},
	{
		accessorKey: "role",
		header: "Roli",
		cell: ({ row }) => <Badge variant="outline">{roleLabel(row.original.role)}</Badge>,
	},
	{
		accessorKey: "status",
		header: "Statusi",
		cell: ({ row }) => (
			<Badge variant={statusVariant(row.original.status)}>
				{row.original.status === "active"
					? "Aktiv"
					: "I pezulluar"}
			</Badge>
		),
	},
	{
		accessorKey: "lastActive",
		header: "Aktiviteti i fundit",
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
							aria-label="Hap menune e përdoruesit"
						>
							<MoreVertical className="size-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem onClick={() => onEdit(row.original)}>
							Ndrysho përdoruesin
						</DropdownMenuItem>
						<DropdownMenuItem
							variant="destructive"
							disabled={deletingUserId === row.original.id}
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

const DashboardUsers = () => {
	const [users, setUsers] = useState<UserRow[]>([]);
	const [createDialogOpen, setCreateDialogOpen] = useState(false);
	const [editDialogOpen, setEditDialogOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [editingUser, setEditingUser] = useState<UserRow | null>(null);
	const [userToDelete, setUserToDelete] = useState<UserRow | null>(null);
	const [isCreating, setIsCreating] = useState(false);
	const [isUpdating, setIsUpdating] = useState(false);
	const [deletingUserId, setDeletingUserId] = useState<number | null>(null);
	const [sorting, setSorting] = useState<SortingState>([]);
	const [pagination, setPagination] = useState<PaginationState>({
		pageIndex: 0,
		pageSize: 10,
	});
	const [nameFilter, setNameFilter] = useState("");
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const createForm = useForm<CreateUserFormValues>({
		resolver: zodResolver(createUserSchema),
		defaultValues: {
			emri: "",
			mbiemri: "",
			email: "",
			password: "",
			role: "USER",
		},
	});

	const editForm = useForm<UpdateUserFormValues>({
		resolver: zodResolver(updateUserSchema),
		defaultValues: {
			emri: "",
			mbiemri: "",
			email: "",
			role: "USER",
			statusi: "aktiv",
		},
	});

	const fetchUsers = async () => {
		setLoading(true);
		setError(null);

		try {
			const data = await apiClient.get<unknown>("/users");
			setUsers(normalizeUsers(data));
		} catch (err) {
			setError(
				err instanceof Error
					? (localizeErrorMessage(err.message) ?? err.message)
					: "Dështoi ngarkimi i përdoruesve.",
			);
			setUsers([]);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		void fetchUsers();
	}, []);

	useEffect(() => {
		setColumnFilters(nameFilter ? [{ id: "name", value: nameFilter }] : []);
	}, [nameFilter]);

	async function handleDeleteUser() {
		if (!userToDelete) {
			return;
		}

		setDeletingUserId(userToDelete.id);
		try {
			await apiClient.delete<void>(`/users/${userToDelete.id}`);
			toast.success("Përdoruesi u fshi me sukses.");
			setDeleteDialogOpen(false);
			setUserToDelete(null);
			await fetchUsers();
		} catch (deleteError) {
			const backendMessage = isAxiosError<{ error?: string }>(deleteError)
				? deleteError.response?.data?.error
				: null;

			toast.error(
				localizeErrorMessage(backendMessage) ??
					"Fshirja e përdoruesit dështoi.",
			);
		} finally {
			setDeletingUserId(null);
		}
	}

	const table = useReactTable({
		data: users,
		columns: useMemo(
			() =>
				buildColumns({
					onEdit: (user) => {
						setEditingUser(user);
						editForm.reset({
							emri: user.emri,
							mbiemri: user.mbiemri,
							email: user.email,
							role: user.role,
							statusi:
								user.status === "active"
									? "aktiv"
									: "joaktiv",
						});
						setEditDialogOpen(true);
					},
					onDelete: (user) => {
						setUserToDelete(user);
						setDeleteDialogOpen(true);
					},
					deletingUserId,
				}),
			[deletingUserId, editForm],
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

	async function onCreateUser(values: CreateUserFormValues) {
		setIsCreating(true);
		try {
			await apiClient.post<ApiUser, CreateUserFormValues>(
				"/users",
				values,
			);
			toast.success("Përdoruesi u krijua me sukses.");
			setCreateDialogOpen(false);
			createForm.reset();
			await fetchUsers();
		} catch (submitError) {
			const backendMessage = isAxiosError<{ error?: string }>(submitError)
				? submitError.response?.data?.error
				: null;

			if (backendMessage?.toLowerCase().includes("exists")) {
				toast.warning("Ky email ekziston tashmë. Provoni një tjetër.");
				return;
			}

			toast.error(
				localizeErrorMessage(backendMessage) ??
					"Krijimi i përdoruesit dështoi.",
			);
		} finally {
			setIsCreating(false);
		}
	}

	const onInvalidCreateUser = () => {
		toast.warning("Ju lutemi plotësoni fushat e kërkuara saktë.");
	};

	async function onUpdateUser(values: UpdateUserFormValues) {
		if (!editingUser) {
			return;
		}

		setIsUpdating(true);
		try {
			await apiClient.put<ApiUser, UpdateUserFormValues>(
				`/users/${editingUser.id}`,
				values,
			);
			toast.success("Përdoruesi u përditësua me sukses.");
			setEditDialogOpen(false);
			setEditingUser(null);
			editForm.reset();
			await fetchUsers();
		} catch (updateError) {
			const backendMessage = isAxiosError<{ error?: string }>(updateError)
				? updateError.response?.data?.error
				: null;

			toast.error(
				localizeErrorMessage(backendMessage) ??
					"Përditësimi i përdoruesit dështoi.",
			);
		} finally {
			setIsUpdating(false);
		}
	}

	const onInvalidUpdateUser = () => {
		toast.warning("Ju lutemi plotësoni fushat e kërkuara saktë.");
	};

	const totalRows = table.getFilteredRowModel().rows.length;
	const startRow = totalRows === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1;
	const endRow = Math.min((pagination.pageIndex + 1) * pagination.pageSize, totalRows);
	const columnCount = table.getAllLeafColumns().length;

	return (
		<div className="space-y-5 sm:space-y-6">
			<div className="flex flex-wrap items-end justify-between gap-3">
				<div>
					<h1 className="font-bold text-2xl tracking-tight">
						Përdoruesit
					</h1>
					<p className="text-muted-foreground text-sm sm:text-base">
						Menaxhoni përdoruesit dhe rolet në panelin e
						administratorit.
					</p>
				</div>
				<Dialog
					open={createDialogOpen}
					onOpenChange={(open) => {
						setCreateDialogOpen(open);
						if (!open) {
							createForm.reset();
						}
					}}
				>
					<Button size="sm" onClick={() => setCreateDialogOpen(true)}>
						Krijo përdorues
					</Button>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Krijo përdorues</DialogTitle>
							<DialogDescription>
								Përdor të njëjtat rregulla validimi si te
								regjistrimi.
							</DialogDescription>
						</DialogHeader>

						<Form {...createForm}>
							<form
								onSubmit={createForm.handleSubmit(
									onCreateUser,
									onInvalidCreateUser,
								)}
								className="space-y-5"
							>
								<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
									<FormField
										control={createForm.control}
										name="emri"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Emri</FormLabel>
												<FormControl>
													<Input
														placeholder="Shkruani emrin"
														type="text"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={createForm.control}
										name="mbiemri"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Mbiemri</FormLabel>
												<FormControl>
													<Input
														placeholder="Shkruani mbiemrin"
														type="text"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>

								<FormField
									control={createForm.control}
									name="email"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Email</FormLabel>
											<FormControl>
												<Input
													placeholder="Shkruani email-in"
													type="email"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={createForm.control}
									name="role"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Roli</FormLabel>
											<FormControl>
												<Select
													onValueChange={
														field.onChange
													}
													value={field.value}
												>
													<SelectTrigger>
														<SelectValue placeholder="Zgjidh rolin" />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="USER">
															Përdorues
														</SelectItem>
														<SelectItem value="MODERATOR">
															Moderator
														</SelectItem>
														<SelectItem value="ADMIN">
															Administrator
														</SelectItem>
													</SelectContent>
												</Select>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={createForm.control}
									name="password"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Fjalëkalimi</FormLabel>
											<FormControl>
												<Input
													placeholder="Shkruani fjalëkalimin"
													type="password"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<DialogFooter>
									<DialogClose asChild>
										<Button variant="outline" type="button">
											Anulo
										</Button>
									</DialogClose>
									<Button type="submit" disabled={isCreating}>
										{isCreating
											? "Duke krijuar..."
											: "Krijo përdorues"}
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
							setEditingUser(null);
							editForm.reset();
						}
					}}
				>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Ndrysho përdoruesin</DialogTitle>
							<DialogDescription>
								Përditëso të dhënat e përdoruesit.
							</DialogDescription>
						</DialogHeader>

						<Form {...editForm}>
							<form
								onSubmit={editForm.handleSubmit(
									onUpdateUser,
									onInvalidUpdateUser,
								)}
								className="space-y-5"
							>
								<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
									<FormField
										control={editForm.control}
										name="emri"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Emri</FormLabel>
												<FormControl>
													<Input type="text" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={editForm.control}
										name="mbiemri"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Mbiemri</FormLabel>
												<FormControl>
													<Input type="text" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>

								<FormField
									control={editForm.control}
									name="email"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Email</FormLabel>
											<FormControl>
												<Input type="email" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
									<FormField
										control={editForm.control}
										name="role"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Roli</FormLabel>
												<FormControl>
													<Select
														onValueChange={field.onChange}
														value={field.value}
													>
														<SelectTrigger>
															<SelectValue placeholder="Zgjidh rolin" />
														</SelectTrigger>
														<SelectContent>
															<SelectItem value="USER">Përdorues</SelectItem>
															<SelectItem value="MODERATOR">Moderator</SelectItem>
															<SelectItem value="ADMIN">Administrator</SelectItem>
														</SelectContent>
													</Select>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={editForm.control}
										name="statusi"
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
															<SelectItem value="aktiv">Aktiv</SelectItem>
															<SelectItem value="joaktiv">Jo aktiv</SelectItem>
														</SelectContent>
													</Select>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>

								<DialogFooter>
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
						if (!open && !deletingUserId) {
							setUserToDelete(null);
						}
					}}
				>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>
								A je i sigurt?
							</AlertDialogTitle>
							<AlertDialogDescription>
								{userToDelete
									? `Ky veprim do ta fshijë përgjithmonë përdoruesin ${userToDelete.name}.`
									: "Ky veprim do ta fshijë përgjithmonë përdoruesin."}
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel disabled={Boolean(deletingUserId)}>
								Anulo
							</AlertDialogCancel>
							<AlertDialogAction
								onClick={(event) => {
									event.preventDefault();
									void handleDeleteUser();
								}}
								disabled={Boolean(deletingUserId)}
							>
								{deletingUserId ? "Duke fshirë..." : "Fshi përdoruesin"}
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Lista e përdoruesve</CardTitle>
					<CardDescription>
						Menaxhoni përdoruesit dhe rolet nga tabela.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<Input
						placeholder="Filtro përdoruesit sipas emrit..."
						value={nameFilter}
						onChange={(event) => {
							setNameFilter(event.target.value);
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
													: flexRender(
															header.column
																.columnDef
																.header,
															header.getContext(),
														)}
											</TableHead>
										))}
									</TableRow>
								))}
							</TableHeader>
							<TableBody>
								{loading ? (
									<TableRow>
										<TableCell
											colSpan={columnCount}
											className="h-24 text-center"
										>
											Duke ngarkuar përdoruesit...
										</TableCell>
									</TableRow>
								) : error ? (
									<TableRow>
										<TableCell
											colSpan={columnCount}
											className="h-24 text-center text-destructive"
										>
											{error}
										</TableCell>
									</TableRow>
								) : table.getRowModel().rows.length ? (
									table.getRowModel().rows.map((row) => (
										<TableRow key={row.id}>
											{row
												.getVisibleCells()
												.map((cell) => (
													<TableCell key={cell.id}>
														{flexRender(
															cell.column
																.columnDef.cell,
															cell.getContext(),
														)}
													</TableCell>
												))}
										</TableRow>
									))
								) : (
									<TableRow>
										<TableCell
											colSpan={columnCount}
											className="h-24 text-center"
										>
											Nuk u gjet asnjë përdorues.
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</div>

					<div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
						<p className="text-muted-foreground text-sm">
							Duke shfaqur {startRow}-{endRow} nga {totalRows} përdorues
						</p>
						<div className="flex items-center gap-2">
							<Select
								value={String(pagination.pageSize)}
								onValueChange={(value) => {
									table.setPageSize(Number(value));
									table.setPageIndex(0);
								}}
							>
								<SelectTrigger className="w-[130px]">
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

export default DashboardUsers;
