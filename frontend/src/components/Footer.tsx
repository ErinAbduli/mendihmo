import { Link } from "react-router";
import { Mail, Github, Instagram, Linkedin } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Logo } from "@/components/logo";

const footerSections = [
	{
		title: "Platforma",
		links: [
			{
				title: "Ballina",
				href: "/",
			},
			{
				title: "Dhuro",
				href: "/donate",
			},
			{
				title: "Nis fushatë",
				href: "/start-campaign",
			},
			{
				title: "Rreth nesh",
				href: "/about",
			},
			{
				title: "Kontakti",
				href: "/contact",
			},
		],
	},
	{
		title: "Ligjore",
		links: [
			{
				title: "Politika e privatësisë",
				href: "#privacy-policy",
			},
			{
				title: "Kushtet e përdorimit",
				href: "#terms",
			},
			{
				title: "Cookies",
				href: "#cookies",
			},
			{
				title: "Njoftimi ligjor",
				href: "#legal-notice",
			},
		],
	},
	{
		title: "Kontakt",
		links: [
			{
				title: "Email",
				href: "mailto:support@mendihmo.com",
			},
			{
				title: "Kontakti",
				href: "/contact",
			},
			{
				title: "Rreth nesh",
				href: "/about",
			},
		],
	},
];

const renderFooterLink = (href: string, title: string) => {
	if (href.startsWith("/") ) {
		return (
			<Link className="text-muted-foreground hover:text-foreground" to={href}>
				{title}
			</Link>
		);
	}

	return (
		<a className="text-muted-foreground hover:text-foreground" href={href}>
			{title}
		</a>
	);
};

const Footer = () => {
	return (
		<footer className="border-t bg-muted/30">
			<div className="mx-auto max-w-(--breakpoint-xl)">
				<div className="grid grid-cols-1 gap-x-8 gap-y-10 px-4 py-10 sm:grid-cols-2 sm:px-6 sm:py-12 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 xl:px-0">
					<div className="col-span-full xl:col-span-2">
						<Logo />

						<p className="mt-4 max-w-prose text-sm text-muted-foreground sm:text-base">
							Mëndihmo është platforma shqiptare e bamirësisë dhe
							financimit kolektiv ku çdokush mund të nisë një
							kauzë ose të mbështesë ato që i beson. Nga nevojat
							emergjente deri te ëndrrat e mëdha çdo kontribut ka
							rëndësi.
						</p>
					</div>

					<div className="col-span-full flex flex-wrap justify-end gap-x-8 gap-y-10 xl:col-span-5">
						{footerSections.map(({ title, links }) => (
							<div key={title} className="text-left">
								<h6 className="font-medium">{title}</h6>
								<ul className="mt-6 space-y-4">
									{links.map(({ title, href }) => (
										<li key={title}>
											{renderFooterLink(href, title)}
										</li>
									))}
								</ul>
							</div>
						))}
					</div>
				</div>
				<Separator />
				<div className="flex flex-col-reverse items-center justify-between gap-x-3 gap-y-4 px-4 py-6 sm:flex-row sm:px-6 sm:py-8 xl:px-0">
					{/* Copyright */}
					<span className="text-center text-sm text-muted-foreground sm:text-left">
						&copy; {new Date().getFullYear()}{" "}
						<Link to="/">
							mëndihmo
						</Link>
						. Të gjitha të drejtat e rezervuara.
					</span>

					<div className="flex flex-wrap items-center justify-center gap-3 text-muted-foreground sm:justify-end">
						<a
							href="mailto:support@mendihmo.com"
							aria-label="Email support"
							className="inline-flex size-10 items-center justify-center rounded-full border border-border bg-background transition hover:border-primary hover:text-primary"
						>
							<Mail className="size-4" />
						</a>
						<a
							href="https://github.com/"
							target="_blank"
							rel="noreferrer"
							aria-label="GitHub"
							className="inline-flex size-10 items-center justify-center rounded-full border border-border bg-background transition hover:border-primary hover:text-primary"
						>
							<Github className="size-4" />
						</a>
						<a
							href="https://www.instagram.com/"
							target="_blank"
							rel="noreferrer"
							aria-label="Instagram"
							className="inline-flex size-10 items-center justify-center rounded-full border border-border bg-background transition hover:border-primary hover:text-primary"
						>
							<Instagram className="size-4" />
						</a>
						<a
							href="https://www.linkedin.com/"
							target="_blank"
							rel="noreferrer"
							aria-label="LinkedIn"
							className="inline-flex size-10 items-center justify-center rounded-full border border-border bg-background transition hover:border-primary hover:text-primary"
						>
							<Linkedin className="size-4" />
						</a>
					</div>
				</div>
			</div>
		</footer>
	);
};

export default Footer;
