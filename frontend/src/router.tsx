import { createBrowserRouter } from "react-router";
import Layout from "./layouts/Layout.tsx";
import AdminLayout from "./layouts/AdminLayout.tsx";
import NotFound from "./pages/NotFound.tsx";
import Home from "./pages/Home.tsx";
import Donate from "./pages/Donate.tsx";
import StartCampaign from "./pages/StartCampaign.tsx";
import About from "./pages/About.tsx";
import Contact from "./pages/Contact.tsx";
import Login from "./pages/Login.tsx";
import SignUp from "./pages/SignUp.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import DashboardCampaigns from "./pages/DashboardCampaigns.tsx";
import DashboardReports from "./pages/DashboardReports.tsx";
import DashboardComments from "./pages/DashboardComments.tsx";
import DashboardUsers from "./pages/DashboardUsers.tsx";
import DashboardTransactions from "./pages/DashboardTransactions.tsx";
import DashboardCategories from "./pages/DashboardCategories.tsx";
import DashboardSettings from "./pages/DashboardSettings.tsx";
import GuestRoute from "./utils/guest-route.tsx";
import ProtectedRoute from "./utils/protected-route.tsx";
import AdminProtectedRoute from "./utils/admin-protected-route.tsx";

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
			{
				path: "/login",
				element: (
					<GuestRoute>
						<Login />
					</GuestRoute>
				),
			},
			{
				path: "/donate",
				element: <Donate />,
			},
			{
				path: "/start-campaign",
				element: (
					<ProtectedRoute>
						<StartCampaign />
					</ProtectedRoute>
				),
			},
			{
				path: "/about",
				element: <About />,
			},
			{
				path: "/contact",
				element: <Contact />,
			},
			{
				path: "/signup",
				element: (
					<GuestRoute>
						<SignUp />
					</GuestRoute>
				),
			},
		],
	},
	{
		path: "/dashboard",
		element: (
			<AdminProtectedRoute>
				<AdminLayout />
			</AdminProtectedRoute>
		),
		errorElement: <NotFound />,
		children: [
			{
				index: true,
				element: <Dashboard />,
			},
			{
				path: "campaigns",
				element: <DashboardCampaigns />,
			},
			{
				path: "reports",
				element: <DashboardReports />,
			},
			{
				path: "comments",
				element: <DashboardComments />,
			},
			{
				path: "users",
				element: <DashboardUsers />,
			},
			{
				path: "transactions",
				element: <DashboardTransactions />,
			},
			{
				path: "categories",
				element: <DashboardCategories />,
			},
			{
				path: "settings",
				element: <DashboardSettings />,
			},
		],
	},
]);

export default router;
