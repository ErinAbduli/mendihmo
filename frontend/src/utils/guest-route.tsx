import { Navigate } from "react-router";
import type { ReactNode } from "react";
import { useAuthStore } from "@/store/authStore";

type GuestRouteProps = {
	children: ReactNode;
};

const GuestRoute = ({ children }: GuestRouteProps) => {
	const initialized = useAuthStore((state) => state.initialized);
	const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

	if (!initialized) {
		return null;
	}

	if (isAuthenticated) {
		return <Navigate to="/" replace />;
	}

	return children;
};

export default GuestRoute;
