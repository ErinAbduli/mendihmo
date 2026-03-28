import { Link, useLocation } from "react-router";
import type { ComponentType } from "react";
import {
	LayoutDashboard,
	Megaphone,
	BarChart3,
	MessageSquare,
	Users,
	CreditCard,
	Tags,
	Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

type AdminNavItem = {
	label: string;
	to: string;
	icon: ComponentType<{ className?: string }>;
};

const navItems: AdminNavItem[] = [
	{ label: "Përmbledhje", to: "/dashboard", icon: LayoutDashboard },
	{ label: "Fushata", to: "/dashboard/campaigns", icon: Megaphone },
	{ label: "Raporte", to: "/dashboard/reports", icon: BarChart3 },
	{ label: "Komente", to: "/dashboard/comments", icon: MessageSquare },
	{ label: "Përdoruesit", to: "/dashboard/users", icon: Users },
	{ label: "Transaksione", to: "/dashboard/transactions", icon: CreditCard },
	{ label: "Kategori", to: "/dashboard/categories", icon: Tags },
	{ label: "Cilësimet", to: "/dashboard/settings", icon: Settings },
];

type AdminSidebarProps = {
	onNavigate?: () => void;
};

const AdminSidebar = ({ onNavigate }: AdminSidebarProps) => {
	const location = useLocation();

	return (
		<aside className="flex h-full w-full flex-col border-r bg-sidebar px-3 py-4 text-sidebar-foreground">
			<div className="px-2 pb-5">
				<Logo className="h-8" onClick={onNavigate} />
			</div>
			<nav className="space-y-1">
				{navItems.map((item) => {
					const Icon = item.icon;
					const active =
						location.pathname === item.to ||
						(item.to !== "/dashboard" &&
							location.pathname.startsWith(item.to));

					return (
						<Button
							asChild
							key={item.to}
							variant={active ? "secondary" : "ghost"}
							className={cn(
								"w-full justify-start gap-2",
								active &&
									"bg-sidebar-accent text-sidebar-accent-foreground",
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
		</aside>
	);
};

export default AdminSidebar;
