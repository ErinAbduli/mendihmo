import { createBrowserRouter } from "react-router";
import Layout from "./layouts/Layout.tsx";
import NotFound from "./pages/NotFound.tsx";
import Home from "./pages/Home.tsx";

const router = createBrowserRouter([
	{
		path: "/",
		element: <Layout />,
		errorElement: <NotFound />,
		children: [
			{
				index: true,
				element: <Home />,
			},
		],
	},
]);

export default router;
