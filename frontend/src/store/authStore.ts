import { isAxiosError } from "axios";
import { create } from "zustand";
import { apiClient, getAccessToken, setAccessToken } from "@/lib/api";

const AUTH_SESSION_KEY = "hasSession";

const setSessionHint = () => {
	localStorage.setItem(AUTH_SESSION_KEY, "1");
};

const clearSessionHint = () => {
	localStorage.removeItem(AUTH_SESSION_KEY);
};

const hasSessionHint = () => localStorage.getItem(AUTH_SESSION_KEY) === "1";

type AuthUser = {
	id: number;
	email: string;
	name: string;
};

type AuthResponse = {
	accessToken: string;
	user: AuthUser;
};

type LoginPayload = {
	email: string;
	password: string;
};

type RegisterPayload = {
	emri: string;
	mbiemri: string;
	email: string;
	password: string;
};

type AuthStore = {
	user: AuthUser | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	error: string | null;
	initialized: boolean;
	setError: (error: string | null) => void;
	clearError: () => void;
	handleAuthExpired: () => void;
	bootstrapSession: () => Promise<void>;
	login: (payload: LoginPayload) => Promise<void>;
	register: (payload: RegisterPayload) => Promise<void>;
	refreshSession: () => Promise<void>;
	logout: () => Promise<void>;
};

const getErrorMessage = (error: unknown) => {
	if (isAxiosError<{ error?: string; message?: string }>(error)) {
		if (!error.response) {
			return "Nuk mund të lidhemi me serverin. Kontrolloni nëse backend është aktiv dhe CORS është i konfiguruar saktë.";
		}

		return (
			error.response.data?.error ||
			error.response.data?.message ||
			"Ndodhi një gabim në autentikim."
		);
	}

	if (error instanceof Error) {
		return error.message;
	}

	return "Ndodhi një gabim i papritur.";
};

export const useAuthStore = create<AuthStore>((set, get) => ({
	user: null,
	isAuthenticated: Boolean(getAccessToken()),
	isLoading: false,
	error: null,
	initialized: false,

	setError: (error) => set({ error }),
	clearError: () => set({ error: null }),
	handleAuthExpired: () => {
		setAccessToken(null);
		clearSessionHint();
		set({
			user: null,
			isAuthenticated: false,
			isLoading: false,
			error: null,
			initialized: true,
		});
	},
	bootstrapSession: async () => {
		if (!getAccessToken() && !hasSessionHint()) {
			set({ initialized: true, isLoading: false });
			return;
		}

		await get().refreshSession();
	},

	login: async (payload) => {
		set({ isLoading: true, error: null });

		try {
			const data = await apiClient.post<AuthResponse, LoginPayload>(
				"/auth/login",
				payload,
			);

			setAccessToken(data.accessToken);
			setSessionHint();
			set({
				user: data.user,
				isAuthenticated: true,
				isLoading: false,
				error: null,
			});
		} catch (error) {
			setAccessToken(null);
			set({
				user: null,
				isAuthenticated: false,
				isLoading: false,
				error: getErrorMessage(error),
			});
			throw error;
		}
	},

	register: async (payload) => {
		set({ isLoading: true, error: null });

		try {
			const data = await apiClient.post<AuthResponse, RegisterPayload>(
				"/auth/register",
				payload,
			);

			setAccessToken(data.accessToken);
			setSessionHint();
			set({
				user: data.user,
				isAuthenticated: true,
				isLoading: false,
				error: null,
			});
		} catch (error) {
			setAccessToken(null);
			set({
				user: null,
				isAuthenticated: false,
				isLoading: false,
				error: getErrorMessage(error),
			});
			throw error;
		}
	},

	refreshSession: async () => {
		set({ isLoading: true, error: null });

		try {
			const data = await apiClient.post<AuthResponse>("/auth/refresh");
			setAccessToken(data.accessToken);
			setSessionHint();
			set({
				user: data.user,
				isAuthenticated: true,
				isLoading: false,
				initialized: true,
				error: null,
			});
		} catch {
			setAccessToken(null);
			clearSessionHint();
			set({
				user: null,
				isAuthenticated: false,
				isLoading: false,
				initialized: true,
			});
		}
	},

	logout: async () => {
		set({ isLoading: true, error: null });

		try {
			await apiClient.post<{ message: string }>("/auth/logout");
		} catch {
			// Ensure local auth state is cleared even if logout request fails.
		} finally {
			setAccessToken(null);
			clearSessionHint();
			set({
				user: null,
				isAuthenticated: false,
				isLoading: false,
				error: null,
			});
		}
	},
}));
