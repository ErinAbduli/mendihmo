import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { NavMenu } from "@/components/nav-menu";
import { NavigationSheet } from "@/components/navigation-sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/store/authStore";
import { ChevronDown, LogOut, UserRound, LayoutDashboard } from "lucide-react";
import { useNavigate } from "react-router";

const Navbar = () => {
	const navigate = useNavigate();
	const user = useAuthStore((state) => state.user);
	const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
	const logout = useAuthStore((state) => state.logout);
	const initialized = useAuthStore((state) => state.initialized);

	if (!initialized) {
		return null;
	}

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

	const handleLogout = async () => {
		await logout();
		navigate("/login");
	};

	return (
		<nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
			<div className="mx-auto flex h-16 w-full max-w-(--breakpoint-xl) items-center justify-between px-4">
				<Logo onClick={() => navigate("/")} />

				{/* Desktop Menu */}
				<NavMenu className="hidden md:block" />

				<div className="flex items-center gap-2">
					{isAuthenticated && user ? (
						<>
						<DropdownMenu modal={false}>
							<DropdownMenuTrigger asChild>
								<button
									aria-label="Hap menune e profilit"
									className="inline-flex cursor-pointer items-center gap-1 rounded-full outline-none ring-offset-background transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
									type="button"
								>
									<Avatar size="default">
										<AvatarFallback>
											{getInitials(user.name, user.email)}
										</AvatarFallback>
									</Avatar>
									<ChevronDown className="size-4 text-muted-foreground" />
								</button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-56">
								<DropdownMenuLabel className="space-y-1">
									<p className="font-medium text-sm">
										{user.name}
									</p>
									<p className="text-muted-foreground text-xs">
										{user.email}
									</p>
								</DropdownMenuLabel>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									className="data-highlighted:bg-accent/15 data-highlighted:text-black hover:text-black data-highlighted:[&_svg]:text-black"
									onClick={() => navigate("/profile")}
								>
									<UserRound className="size-4" />
									Profili
								</DropdownMenuItem>
								{isAuthenticated &&
									(user.role === "ADMIN" ||
										user.role === "MODERATOR") && (
										<DropdownMenuItem
											className="data-highlighted:bg-accent/15 data-highlighted:text-black hover:text-black data-highlighted:[&_svg]:text-black"
											onClick={() =>
												navigate("/dashboard")
											}
										>
											<LayoutDashboard className="size-4" />
											Paneli
										</DropdownMenuItem>
									)}
								<DropdownMenuItem
									onClick={handleLogout}
									variant="destructive"
								>
									<LogOut className="size-4" />
									Dil
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
						</>
					) : (
						<>
							<Button
								className="hidden rounded-md px-3 sm:inline-flex"
								size="sm"
								variant="outline"
								onClick={() => navigate("/login")}
							>
								Kyçu
							</Button>
							<Button
								className="rounded-md px-3"
								size="sm"
								onClick={() => navigate("/signup")}
							>
								Regjistrohu
							</Button>
						</>
					)}

					{/* Mobile Menu */}
					<div className="md:hidden">
						<NavigationSheet />
					</div>
				</div>
			</div>
		</nav>
	);
};

export default Navbar;
