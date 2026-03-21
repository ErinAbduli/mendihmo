import { Outlet } from "react-router";
import Navbar from "@/components/navbar";
import Footer from "@/components/Footer";

const Layout = () => {
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
