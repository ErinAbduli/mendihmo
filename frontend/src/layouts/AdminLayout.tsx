import { Outlet, useNavigate } from "react-router";
import { Menu, Search, LogOut, UserRound, LayoutDashboard } from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import AdminSidebar from "@/components/admin/admin-sidebar";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
	Sheet,
	SheetContent,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";

const AdminLayout = () => {
	const navigate = useNavigate();
	const [openSidebar, setOpenSidebar] = useState(false);
	const user = useAuthStore((state) => state.user);
	const logout = useAuthStore((state) => state.logout);

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
		<div className="min-h-screen bg-background text-foreground">
			<div className="grid min-h-screen w-full grid-cols-1 md:grid-cols-[250px_minmax(0,1fr)]">
				<div className="hidden md:block">
					<AdminSidebar />
				</div>

				<div className="flex min-h-screen flex-col">
					<header className="sticky top-0 z-30 border-b bg-background/95 px-4 py-3 backdrop-blur supports-backdrop-filter:bg-background/80 sm:px-6">
						<div className="flex items-center gap-3">
							<div className="md:hidden">
								<Sheet
									open={openSidebar}
									onOpenChange={setOpenSidebar}
								>
									<SheetTrigger asChild>
										<Button
											variant="outline"
											size="icon"
											aria-label="Open sidebar"
										>
											<Menu className="size-4" />
										</Button>
									</SheetTrigger>
									<SheetContent
										side="left"
										className="w-72 p-0"
										showCloseButton
									>
										<SheetTitle className="sr-only">
											Dashboard navigation
										</SheetTitle>
										<AdminSidebar
											onNavigate={() =>
												setOpenSidebar(false)
											}
										/>
									</SheetContent>
								</Sheet>
							</div>

							<div className="relative max-w-lg flex-1">
								<Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
								<Input
									placeholder="Search tasks, users or apps"
									className="pl-9"
								/>
							</div>

							<DropdownMenu modal={false}>
								<DropdownMenuTrigger asChild>
									<button
										type="button"
										className="inline-flex cursor-pointer items-center gap-2 rounded-md outline-none ring-offset-background transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
									>
										<Avatar size="default">
											<AvatarFallback>
												{getInitials(
													user?.name,
													user?.email,
												)}
											</AvatarFallback>
										</Avatar>
									</button>
								</DropdownMenuTrigger>
								<DropdownMenuContent
									align="end"
									className="w-56"
								>
									<DropdownMenuLabel className="space-y-1">
										<p className="font-medium text-sm">
											{user?.name ?? "User"}
										</p>
										<p className="text-muted-foreground text-xs">
											{user?.email ?? "No email"}
										</p>
									</DropdownMenuLabel>
									<DropdownMenuSeparator />
									<DropdownMenuItem
										onClick={() => navigate("/")}
									>
										<LayoutDashboard className="size-4" />
										Public home
									</DropdownMenuItem>
									<DropdownMenuItem
										onClick={() =>
											navigate("/dashboard/settings")
										}
									>
										<UserRound className="size-4" />
										Profile settings
									</DropdownMenuItem>
									<DropdownMenuItem
										onClick={handleLogout}
										variant="destructive"
									>
										<LogOut className="size-4" />
										Sign out
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					</header>

					<main className="flex-1 px-4 py-5 sm:px-6 sm:py-6">
						<Outlet />
					</main>
				</div>
			</div>
		</div>
	);
};

export default AdminLayout;
