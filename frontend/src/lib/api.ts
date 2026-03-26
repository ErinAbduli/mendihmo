import axios, { type AxiosRequestConfig } from "axios";

const API_BASE_URL =
	import.meta.env.VITE_API_URL ?? "http://localhost:5000/api";

let accessToken: string | null = null;

export const api = axios.create({
	baseURL: API_BASE_URL,
	withCredentials: true,
	headers: { "Content-Type": "application/json" },
});

const authApi = axios.create({
	baseURL: API_BASE_URL,
	withCredentials: true,
	headers: { "Content-Type": "application/json" },
});

export const setAccessToken = (token: string | null) => {
	accessToken = token;
	if (token) {
		api.defaults.headers.common.Authorization = `Bearer ${token}`;
	} else {
		delete api.defaults.headers.common.Authorization;
	}
};

export const getAccessToken = () => accessToken;

api.interceptors.response.use(
	(response) => response,
	async (error) => {
		const original = error.config;
		const requestUrl = String(original?.url ?? "");

		if (requestUrl.includes("/auth/refresh")) {
			return Promise.reject(error);
		}

		if (error.response?.status === 401 && original && !original._retry) {
			original._retry = true;

			try {
				const { data } = await authApi.post("/auth/refresh");
				setAccessToken(data.accessToken);
				original.headers = original.headers ?? {};
				original.headers.Authorization = `Bearer ${data.accessToken}`;
				return api(original);
			} catch {
				setAccessToken(null);
				window.dispatchEvent(new Event("auth:expired"));
			}
		}

		return Promise.reject(error);
	},
);

export const apiClient = {
	get: <TResponse>(url: string, config?: AxiosRequestConfig) =>
		api.get<TResponse>(url, config).then((res) => res.data),

	post: <TResponse, TBody = unknown>(
		url: string,
		data?: TBody,
		config?: AxiosRequestConfig,
	) => api.post<TResponse>(url, data, config).then((res) => res.data),

	put: <TResponse, TBody = unknown>(
		url: string,
		data?: TBody,
		config?: AxiosRequestConfig,
	) => api.put<TResponse>(url, data, config).then((res) => res.data),

	patch: <TResponse, TBody = unknown>(
		url: string,
		data?: TBody,
		config?: AxiosRequestConfig,
	) => api.patch<TResponse>(url, data, config).then((res) => res.data),

	delete: <TResponse>(url: string, config?: AxiosRequestConfig) =>
		api.delete<TResponse>(url, config).then((res) => res.data),
};
