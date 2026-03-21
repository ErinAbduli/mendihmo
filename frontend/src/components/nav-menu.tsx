"use client";

import { Link } from "react-router";
import type { ComponentProps } from "react";
import {
	NavigationMenu,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
	navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

export const NavMenu = (props: ComponentProps<typeof NavigationMenu>) => (
	<NavigationMenu {...props}>
		<NavigationMenuList className="space-x-0 data-[orientation=vertical]:flex-col data-[orientation=vertical]:items-start data-[orientation=vertical]:justify-start">
			<NavigationMenuItem>
				<NavigationMenuLink
					asChild
					className={navigationMenuTriggerStyle()}
				>
					<Link to="/">Ballina</Link>
				</NavigationMenuLink>
			</NavigationMenuItem>
			<NavigationMenuItem>
				<NavigationMenuLink
					asChild
					className={navigationMenuTriggerStyle()}
				>
					<Link to="#">Dhuro</Link>
				</NavigationMenuLink>
			</NavigationMenuItem>
			<NavigationMenuItem>
				<NavigationMenuLink
					asChild
					className={navigationMenuTriggerStyle()}
				>
					<Link to="#">Fillo një kauzë</Link>
				</NavigationMenuLink>
			</NavigationMenuItem>
			<NavigationMenuItem>
				<NavigationMenuLink
					asChild
					className={navigationMenuTriggerStyle()}
				>
					<Link to="#">Mbi ne</Link>
				</NavigationMenuLink>
			</NavigationMenuItem>
			<NavigationMenuItem>
				<NavigationMenuLink
					asChild
					className={navigationMenuTriggerStyle()}
				>
					<Link to="#">Na Kontaktoni</Link>
				</NavigationMenuLink>
			</NavigationMenuItem>
		</NavigationMenuList>
	</NavigationMenu>
);
