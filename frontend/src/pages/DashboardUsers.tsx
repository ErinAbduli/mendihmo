import { useEffect, useState } from "react";
import {
	type ColumnDef,
	type ColumnFiltersState,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getSortedRowModel,
	type SortingState,
	useReactTable,
} from "@tanstack/react-table";
import { MoreVertical } from "lucide-react";
import { apiClient } from "@/lib/api";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

type UserRow = {
	id: number;
	name: string;
	email: string;
	role: string;
	status: "active" | "invited" | "suspended";
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

	if (status === "invited") {
		return "secondary";
	}

	return "destructive";
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
			const name =
				`${user.emri} ${user.mbiemri}`.trim() || "Unknown User";
			const status = normalizeStatus(user.statusi);
			const createdDate = user.data_krijimit;
			const normalizedRole =
				user.userRoles[0]?.role.normalized_name ?? "USER";
			const role =
				normalizedRole.charAt(0) +
				normalizedRole.slice(1).toLowerCase();

			return {
				id: typeof user.id === "number" ? user.id : index + 1,
				name,
				email: user.email,
				role,
				status,
				lastActive: createdDate
					? new Date(createdDate).toLocaleDateString()
					: "-",
			};
		});
};

const columns: ColumnDef<UserRow>[] = [
	{
		accessorKey: "name",
		header: "User",
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
		header: "Role",
		cell: ({ row }) => <Badge variant="outline">{row.original.role}</Badge>,
	},
	{
		accessorKey: "status",
		header: "Status",
		cell: ({ row }) => (
			<Badge variant={statusVariant(row.original.status)}>
				{row.original.status}
			</Badge>
		),
	},
	{
		accessorKey: "lastActive",
		header: "Last Active",
	},
	{
		id: "actions",
		header: () => <div className="text-right">Actions</div>,
		cell: () => (
			<div className="flex justify-end">
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="ghost"
							size="icon-sm"
							aria-label="Open user menu"
						>
							<MoreVertical className="size-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem>Edit user</DropdownMenuItem>
						<DropdownMenuItem>Change role</DropdownMenuItem>
						<DropdownMenuItem variant="destructive">
							Remove
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		),
	},
];

const DashboardUsers = () => {
	const [users, setUsers] = useState<UserRow[]>([]);
	const [sorting, setSorting] = useState<SortingState>([]);
	const [nameFilter, setNameFilter] = useState("");
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchUsers = async () => {
			setLoading(true);
			setError(null);

			try {
				const data = await apiClient.get<unknown>("/users");
				setUsers(normalizeUsers(data));
			} catch (err) {
				setError(
					err instanceof Error
						? err.message
						: "Failed to load users.",
				);
				setUsers([]);
			} finally {
				setLoading(false);
			}
		};

		void fetchUsers();
	}, []);

	useEffect(() => {
		setColumnFilters(nameFilter ? [{ id: "name", value: nameFilter }] : []);
	}, [nameFilter]);

	const table = useReactTable({
		data: users,
		columns,
		state: {
			sorting,
			columnFilters,
		},
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
	});

	return (
		<div className="space-y-5 sm:space-y-6">
			<div className="flex flex-wrap items-end justify-between gap-3">
				<div>
					<h1 className="font-bold text-2xl tracking-tight">Users</h1>
					<p className="text-muted-foreground text-sm sm:text-base">
						Manage users and roles with a lightweight admin view.
					</p>
				</div>
				<Button size="sm">Invite user</Button>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>User List</CardTitle>
					<CardDescription>
						Manage your users and roles from a table view.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<Input
						placeholder="Filter users by name..."
						value={nameFilter}
						onChange={(event) => setNameFilter(event.target.value)}
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
											colSpan={columns.length}
											className="h-24 text-center"
										>
											Loading users...
										</TableCell>
									</TableRow>
								) : error ? (
									<TableRow>
										<TableCell
											colSpan={columns.length}
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
											colSpan={columns.length}
											className="h-24 text-center"
										>
											No users found.
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</div>
				</CardContent>
			</Card>
		</div>
	);
};

export default DashboardUsers;
