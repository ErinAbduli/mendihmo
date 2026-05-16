import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { useAuthStore } from "@/store/authStore";

const AdminProtectedRoute = ({ children }: { children: React.ReactNode }) => {
	const navigate = useNavigate();
	const location = useLocation();
	const initialized = useAuthStore((state) => state.initialized);
	const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
	const user = useAuthStore((state) => state.user);

	useEffect(() => {
		if (initialized) {
			if (!isAuthenticated) {
				navigate("/login", {
					replace: true,
					state: { from: `${location.pathname}${location.search}` },
				});
			} else if (user?.role !== "ADMIN") {
				navigate("/unauthorized", { replace: true });
			}
		}
	}, [
		initialized,
		isAuthenticated,
		location.pathname,
		location.search,
		user?.role,
		navigate,
	]);

	if (!initialized || !isAuthenticated || user?.role !== "ADMIN") {
		return <div className="min-h-screen bg-background" />;
	}

	return children;
};

export default AdminProtectedRoute;
