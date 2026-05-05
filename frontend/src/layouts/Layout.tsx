import { Outlet } from "react-router";
import Navbar from "@/components/navbar";
import Footer from "@/components/Footer";
import { useAuthStore } from "@/store/authStore";
import { usePageTitle } from "@/hooks/usePageTitle";

const Layout = () => {
	usePageTitle();
	const initialized = useAuthStore((state) => state.initialized);

	if (!initialized) {
		return <div className="min-h-screen bg-background" />;
	}

	return (
		<div>
			<Navbar />
			<main>
				<Outlet />
			</main>
			<Footer />
		</div>
	);
};

export default Layout;
