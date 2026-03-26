import logo from "@/assets/logo3.svg";
import { cn } from "@/lib/utils";

type LogoProps = {
	className?: string;
	onClick?: () => void;
};

export const Logo = ({ className, onClick }: LogoProps) => (
	<img
		src={logo}
		alt="Logo"
		height="32"
		width="124"
		className={cn("h-8 w-auto", onClick && "cursor-pointer", className)}
		onClick={onClick}
	/>
);
