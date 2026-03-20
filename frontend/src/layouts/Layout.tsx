import { Outlet } from "react-router";

const Layout = () => {
	return (
		<div>
			<h1>My App</h1>
			<main>
				<Outlet />
			</main>
		</div>
	);
};

export default Layout;
