"use client";

import { Link, useLocation } from "react-router";
import type { ComponentProps } from "react";
import {
	NavigationMenu,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
} from "@/components/ui/navigation-menu";

export const NavMenu = (props: ComponentProps<typeof NavigationMenu>) => {
	const location = useLocation();

	const isActive = (path: string) => {
		if (path === "/") return location.pathname === "/";
		return location.pathname.startsWith(path);
	};

	return (
		<NavigationMenu {...props}>
			<NavigationMenuList className="space-x-0 data-[orientation=vertical]:flex-col data-[orientation=vertical]:items-start data-[orientation=vertical]:justify-start">
				<NavigationMenuItem>
					<NavigationMenuLink
						asChild
						className={`inline-flex h-9 w-max items-center justify-center px-2 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 border-b-2 hover:bg-transparent active:bg-transparent rounded-none !bg-transparent !hover:bg-transparent !focus:bg-transparent ${
							isActive("/")
								? "border-primary text-primary"
								: "border-transparent text-foreground hover:text-primary"
						}`}
					>
						<Link to="/">Ballina</Link>
					</NavigationMenuLink>
				</NavigationMenuItem>
				<NavigationMenuItem>
					<NavigationMenuLink
						asChild
						className={`inline-flex h-9 w-max items-center justify-center px-2 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 border-b-2 hover:bg-transparent active:bg-transparent rounded-none !bg-transparent !hover:bg-transparent !focus:bg-transparent ${
							isActive("/donate")
								? "border-primary text-primary"
								: "border-transparent text-foreground hover:text-primary"
						}`}
					>
						<Link to="#">Dhuro</Link>
					</NavigationMenuLink>
				</NavigationMenuItem>
				<NavigationMenuItem>
					<NavigationMenuLink
						asChild
						className={`inline-flex h-9 w-max items-center justify-center px-2 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 border-b-2 hover:bg-transparent active:bg-transparent rounded-none !bg-transparent !hover:bg-transparent !focus:bg-transparent ${
							isActive("/start-campaign")
								? "border-primary text-primary"
								: "border-transparent text-foreground hover:text-primary"
						}`}
					>
						<Link to="#">Fillo një kauzë</Link>
					</NavigationMenuLink>
				</NavigationMenuItem>
				<NavigationMenuItem>
					<NavigationMenuLink
						asChild
						className={`inline-flex h-9 w-max items-center justify-center px-2 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 border-b-2 hover:bg-transparent active:bg-transparent rounded-none !bg-transparent !hover:bg-transparent !focus:bg-transparent ${
							isActive("/about")
								? "border-primary text-primary"
								: "border-transparent text-foreground hover:text-primary"
						}`}
					>
						<Link to="#">Mbi ne</Link>
					</NavigationMenuLink>
				</NavigationMenuItem>
				<NavigationMenuItem>
					<NavigationMenuLink
						asChild
						className={`inline-flex h-9 w-max items-center justify-center px-2 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 border-b-2 hover:bg-transparent active:bg-transparent rounded-none !bg-transparent !hover:bg-transparent !focus:bg-transparent ${
							isActive("/contact")
								? "border-primary text-primary"
								: "border-transparent text-foreground hover:text-primary"
						}`}
					>
						<Link to="#">Na Kontaktoni</Link>
					</NavigationMenuLink>
				</NavigationMenuItem>
			</NavigationMenuList>
		</NavigationMenu>
	);
};
