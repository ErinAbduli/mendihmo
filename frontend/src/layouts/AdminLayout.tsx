import { Outlet, useNavigate } from "react-router";
import { Menu } from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { usePageTitle } from "@/hooks/usePageTitle";
import AdminSidebar from "../components/admin/admin-sidebar.tsx";
import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";

const AdminLayout = () => {
	usePageTitle();
	const navigate = useNavigate();
	const [openSidebar, setOpenSidebar] = useState(false);
	const user = useAuthStore((state) => state.user);
	const logout = useAuthStore((state) => state.logout);
	const initialized = useAuthStore((state) => state.initialized);

	if (!initialized) {
		return <div className="min-h-screen bg-background" />;
	}

	const handleLogout = async () => {
		await logout();
		navigate("/login");
	};

	return (
		<div className="min-h-screen bg-background text-foreground">
			<div className="grid min-h-screen w-full grid-cols-1 md:grid-cols-[250px_minmax(0,1fr)] md:items-start">
				<div className="hidden md:block md:sticky md:top-0 md:h-screen md:self-start">
					<AdminSidebar user={user ?? undefined} onLogout={handleLogout} />
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
											aria-label="Hap panelin anësor"
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
											Navigimi i panelit
										</SheetTitle>
										<AdminSidebar
											user={user ?? undefined}
											onNavigate={() =>
												setOpenSidebar(false)
											}
											onLogout={handleLogout}
										/>
									</SheetContent>
								</Sheet>
							</div>
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
