import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuthStore } from "@/store/authStore";

const AdminProtectedRoute = ({ children }: { children: React.ReactNode }) => {
	const navigate = useNavigate();
	const initialized = useAuthStore((state) => state.initialized);
	const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
	const user = useAuthStore((state) => state.user);

	useEffect(() => {
		if (initialized) {
			if (!isAuthenticated) {
				navigate("/login", { replace: true });
			} else if (user?.role !== "ADMIN") {
				navigate("/unauthorized", { replace: true });
			}
		}
	}, [initialized, isAuthenticated, user?.role, navigate]);

	if (!initialized || !isAuthenticated || user?.role !== "ADMIN") {
		return <div className="min-h-screen bg-background" />;
	}

	return children;
};

export default AdminProtectedRoute;
