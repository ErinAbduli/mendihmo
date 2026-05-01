import type { ReactNode } from "react";
import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuthStore } from "@/store/authStore";

type ProtectedRouteProps = {
	children: ReactNode;
};

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
	const navigate = useNavigate();
	const initialized = useAuthStore((state) => state.initialized);
	const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

	useEffect(() => {
		if (initialized && !isAuthenticated) {
			navigate("/login", { replace: true });
		}
	}, [initialized, isAuthenticated, navigate]);

	if (!initialized || !isAuthenticated) {
		return <div className="min-h-screen bg-background" />;
	}

	return children;
};

export default ProtectedRoute;
