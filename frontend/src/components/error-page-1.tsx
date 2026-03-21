import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router";

const ErrorPage = () => {
	return (
		<div className="mx-auto flex min-h-dvh flex-col items-center justify-center gap-8 p-8 md:gap-12 md:p-16">
			<div className="text-center">
				<h1 className="mb-2 text-3xl font-bold">Faqja nuk ekziston</h1>
				<p className="text-muted-foreground">
					Na vjen keq, por faqja që kërkon nuk ekziston.
				</p>
				<div className="mt-6 flex items-center justify-center gap-4 md:mt-8">
					<Button className="cursor-pointer">
						<Link to="/">Kthehu në Faqen Kryesore</Link>
					</Button>
					<Button
						variant="ghost"
						className="flex cursor-pointer items-center gap-1"
					>
						<span>Na kontaktoni</span>
						<ArrowRight className="size-4"></ArrowRight>
					</Button>
				</div>
			</div>
		</div>
	);
};

export default ErrorPage;
