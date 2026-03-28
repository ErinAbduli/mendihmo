import { Navigate } from "react-router";
import { useAuthStore } from "@/store/authStore";

const AdminProtectedRoute = ({ children }: { children: React.ReactNode }) => {
	const initialized = useAuthStore((state) => state.initialized);
	const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
	const user = useAuthStore((state) => state.user);

	if (!initialized) {
		return null;
	}

	if (!isAuthenticated) {
		return <Navigate to="/login" replace />;
	}

	if (user?.role !== "ADMIN") {
		return <Navigate to="/unauthorized" replace />;
	}

	return children;
};

export default AdminProtectedRoute;
