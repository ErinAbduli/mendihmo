import { useEffect } from "react";
import { useLocation } from "react-router";

const PAGE_TITLES: Record<string, string> = {
	"/": "Platforma për donacione online në Kosovë & Shqipëri | MëNdihmo",
	"/login": "Hyr në llogari | MëNdihmo",
	"/signup": "Krijo llogari për donacione | MëNdihmo",
	"/donate": "Dhuro për kauza në Kosovë & Shqipëri | MëNdihmo",
	"/start-campaign": "Nis fushatë humanitare | MëNdihmo",
	"/about": "Rreth MëNdihmo - Platformë donacionesh",
	"/contact": "Kontakti | MëNdihmo",
	"/dashboard": "Paneli i përdoruesit | MëNdihmo",
	"/dashboard/campaigns": "Menaxho fushatat | MëNdihmo",
	"/dashboard/reports": "Raporte dhe analiza | MëNdihmo",
	"/dashboard/users": "Menaxhimi i përdoruesve | MëNdihmo",
	"/dashboard/transactions": "Transaksionet dhe pagesat | MëNdihmo",
	"/dashboard/categories": "Kategoritë e fushatave | MëNdihmo",
};

export function usePageTitle() {
	const location = useLocation();

	useEffect(() => {
		if (location.pathname.startsWith("/donate/")) {
			document.title = "Fushatë humanitare | MëNdihmo";
			return;
		}

		const title = PAGE_TITLES[location.pathname] || "MëNdihmo";
		document.title = title;
	}, [location.pathname]);
}
