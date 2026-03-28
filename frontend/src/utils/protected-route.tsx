import { Navigate } from "react-router";
import type { ReactNode } from "react";
import { useAuthStore } from "@/store/authStore";

type ProtectedRouteProps = {
	children: ReactNode;
};

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
	const initialized = useAuthStore((state) => state.initialized);
	const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

	if (!initialized) {
		return null;
	}

	if (!isAuthenticated) {
		return <Navigate to="/login" replace />;
	}

	return children;
};

export default ProtectedRoute;
