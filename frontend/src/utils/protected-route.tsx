import type { ReactNode } from "react";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { useAuthStore } from "@/store/authStore";

type ProtectedRouteProps = {
	children: ReactNode;
};

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
	const navigate = useNavigate();
	const location = useLocation();
	const initialized = useAuthStore((state) => state.initialized);
	const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

	useEffect(() => {
		if (initialized && !isAuthenticated) {
			navigate("/login", {
				replace: true,
				state: { from: `${location.pathname}${location.search}` },
			});
		}
	}, [initialized, isAuthenticated, location.pathname, location.search, navigate]);

	if (!initialized || !isAuthenticated) {
		return <div className="min-h-screen bg-background" />;
	}

	return children;
};

export default ProtectedRoute;
