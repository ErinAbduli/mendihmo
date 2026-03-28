import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";
import router from "./router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { AuthBootstrap } from "@/utils/auth-bootstrap";
import "./index.css";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
	<QueryClientProvider client={queryClient}>
		<AuthBootstrap />
		<RouterProvider router={router} />
		<Toaster richColors theme="light" position="bottom-right" />
	</QueryClientProvider>,
);
