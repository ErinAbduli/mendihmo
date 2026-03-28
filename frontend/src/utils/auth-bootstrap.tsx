import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

export const AuthBootstrap = () => {
	const initialized = useAuthStore((state) => state.initialized);
	const bootstrapSession = useAuthStore((state) => state.bootstrapSession);
	const handleAuthExpired = useAuthStore((state) => state.handleAuthExpired);

	useEffect(() => {
		if (!initialized) {
			void bootstrapSession();
		}
	}, [initialized, bootstrapSession]);

	useEffect(() => {
		const onAuthExpired = () => {
			handleAuthExpired();
		};

		window.addEventListener("auth:expired", onAuthExpired);
		return () => window.removeEventListener("auth:expired", onAuthExpired);
	}, [handleAuthExpired]);

	return null;
};
