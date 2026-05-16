import { Link, useLocation, useNavigate } from "react-router";
import type { ComponentType } from "react";
import {
	LayoutDashboard,
	Megaphone,
	BarChart3,
	MessageSquare,
	Mail,
	Users,
	CreditCard,
	Tags,
	Settings,
	UserRound,
	ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type AdminNavItem = {
	label: string;
	to: string;
	icon: ComponentType<{ className?: string }>;
};

const navItems: AdminNavItem[] = [
	{ label: "Përmbledhje", to: "/dashboard", icon: LayoutDashboard },
	{ label: "Fushata", to: "/dashboard/campaigns", icon: Megaphone },
	{ label: "Raporte", to: "/dashboard/reports", icon: BarChart3 },
	{ label: "Kontaktet", to: "/dashboard/contacts", icon: Mail },
	{ label: "Komente", to: "/dashboard/comments", icon: MessageSquare },
	{ label: "Përdoruesit", to: "/dashboard/users", icon: Users },
	{ label: "Transaksione", to: "/dashboard/transactions", icon: CreditCard },
	{ label: "Kategori", to: "/dashboard/categories", icon: Tags },
	{ label: "Cilësimet", to: "/dashboard/settings", icon: Settings },
];

type AdminSidebarProps = {
	onNavigate?: () => void;
	user?: {
		name?: string;
		email?: string;
		role?: string;
	};
	onLogout?: () => void;
};

const AdminSidebar = ({ onNavigate, user, onLogout }: AdminSidebarProps) => {
	const location = useLocation();
	const navigate = useNavigate();

	const getInitials = (name?: string, email?: string) => {
		const normalizedName = (name ?? "").trim();
		if (normalizedName) {
			const parts = normalizedName.split(/\s+/).slice(0, 2);
			return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
		}

		if (email) {
			return email.slice(0, 2).toUpperCase();
		}

		return "U";
	};

	const roleLabel = (role?: string) => {
		if (role === "ADMIN") return "Administrator";
		if (role === "MODERATOR") return "Moderator";
		return role ? role.charAt(0).toUpperCase() + role.slice(1).toLowerCase() : "Përdorues";
	};

	return (
		<aside className="flex h-full w-full flex-col border-r bg-sidebar px-3 py-4 text-sidebar-foreground">
			<div className="px-2 pb-5">
				<Logo
					className="h-8"
					onClick={() => {
						navigate("/");
						onNavigate?.();
					}}
				/>
			</div>

			<nav className="space-y-1">
				{navItems.map((item) => {
					const Icon = item.icon;
					const active =
						location.pathname === item.to ||
						(item.to !== "/dashboard" && location.pathname.startsWith(item.to));

					return (
						<Button
							asChild
							key={item.to}
							variant={active ? "secondary" : "ghost"}
							className={cn(
								"w-full justify-start gap-2",
								active && "bg-sidebar-accent text-sidebar-accent-foreground",
							)}
						>
							<Link to={item.to} onClick={onNavigate}>
								<Icon className="size-4" />
								{item.label}
							</Link>
						</Button>
					);
				})}
			</nav>

			<div className="mt-auto border-t border-sidebar-border px-2 pt-4">
				<DropdownMenu modal={false}>
					<DropdownMenuTrigger asChild>
						<button
							type="button"
							className="flex w-full items-center gap-3 rounded-xl bg-sidebar-accent/60 px-3 py-3 text-left text-sidebar-accent-foreground outline-none transition hover:bg-sidebar-accent/80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
						>
							<Avatar size="default" className="shrink-0">
								<AvatarFallback>{getInitials(user?.name, user?.email)}</AvatarFallback>
							</Avatar>
							<div className="min-w-0 flex-1">
								<p className="truncate text-sm font-semibold">{user?.name ?? "Përdorues"}</p>
								<p className="truncate text-xs text-sidebar-accent-foreground/70">{roleLabel(user?.role)}</p>
							</div>
							<ChevronUp className="size-4 shrink-0 text-sidebar-accent-foreground/70" />
						</button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" side="top" className="w-56">
						<div className="px-2 py-1.5">
							<p className="truncate text-sm font-medium">{user?.name ?? "Përdorues"}</p>
							<p className="truncate text-xs text-muted-foreground">{roleLabel(user?.role)}</p>
						</div>
						<DropdownMenuSeparator />
							<DropdownMenuItem onClick={() => navigate("/")}>
								<LayoutDashboard className="size-4" />
								Ballina publike
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => navigate("/dashboard/settings")}>
								<UserRound className="size-4" />
								Profili
							</DropdownMenuItem>
							<DropdownMenuSeparator />
						{onLogout ? (
							<DropdownMenuItem onClick={onLogout} variant="destructive">
								Dil
							</DropdownMenuItem>
						) : null}
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</aside>
	);
};

export default AdminSidebar;