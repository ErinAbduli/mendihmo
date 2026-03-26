import { BsGithub, BsTwitterX, BsInstagram, BsLinkedin } from "react-icons/bs";
import { Link } from "react-router";
import { Separator } from "@/components/ui/separator";
import { Logo } from "@/components/logo";

const footerSections = [
	{
		title: "Product",
		links: [
			{
				title: "Overview",
				href: "#",
			},
			{
				title: "Features",
				href: "#",
			},
			{
				title: "Solutions",
				href: "#",
			},
			{
				title: "Tutorials",
				href: "#",
			},
			{
				title: "Pricing",
				href: "#",
			},
			{
				title: "Releases",
				href: "#",
			},
		],
	},
	{
		title: "Company",
		links: [
			{
				title: "About us",
				href: "#",
			},
			{
				title: "Careers",
				href: "#",
			},
			{
				title: "Press",
				href: "#",
			},
			{
				title: "News",
				href: "#",
			},
			{
				title: "Media kit",
				href: "#",
			},
			{
				title: "Contact",
				href: "#",
			},
		],
	},
	{
		title: "Resources",
		links: [
			{
				title: "Blog",
				href: "#",
			},
			{
				title: "Newsletter",
				href: "#",
			},
			{
				title: "Events",
				href: "#",
			},
			{
				title: "Help centre",
				href: "#",
			},
			{
				title: "Tutorials",
				href: "#",
			},
			{
				title: "Support",
				href: "#",
			},
		],
	},
	{
		title: "Social",
		links: [
			{
				title: "Twitter",
				href: "#",
			},
			{
				title: "LinkedIn",
				href: "#",
			},
			{
				title: "Facebook",
				href: "#",
			},
			{
				title: "GitHub",
				href: "#",
			},
			{
				title: "AngelList",
				href: "#",
			},
			{
				title: "Dribbble",
				href: "#",
			},
		],
	},
	{
		title: "Legal",
		links: [
			{
				title: "Terms",
				href: "#",
			},
			{
				title: "Privacy",
				href: "#",
			},
			{
				title: "Cookies",
				href: "#",
			},
			{
				title: "Licenses",
				href: "#",
			},
			{
				title: "Settings",
				href: "#",
			},
			{
				title: "Contact",
				href: "#",
			},
		],
	},
];

const Footer = () => {
	return (
		<footer className="border-t bg-muted/30">
			<div className="mx-auto max-w-(--breakpoint-xl)">
				<div className="grid grid-cols-2 gap-x-8 gap-y-10 px-6 py-12 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 xl:px-0">
					<div className="col-span-full xl:col-span-2">
						<Logo />

						<p className="mt-4 text-muted-foreground">
							Mëndihmo është platforma shqiptare e bamirësisë dhe
							financimit kolektiv ku çdokush mund të nisë një
							kauzë ose të mbështesë ato që i beson. Nga nevojat
							emergjente deri te ëndrrat e mëdha çdo kontribut ka
							rëndësi.
						</p>
					</div>

					{footerSections.map(({ title, links }) => (
						<div key={title}>
							<h6 className="font-medium">{title}</h6>
							<ul className="mt-6 space-y-4">
								{links.map(({ title, href }) => (
									<li key={title}>
										<Link
											className="text-muted-foreground hover:text-foreground"
											to={href}
										>
											{title}
										</Link>
									</li>
								))}
							</ul>
						</div>
					))}
				</div>
				<Separator />
				<div className="flex flex-col-reverse items-center justify-between gap-x-2 gap-y-5 px-6 py-8 sm:flex-row xl:px-0">
					{/* Copyright */}
					<span className="text-muted-foreground">
						&copy; {new Date().getFullYear()}{" "}
						<Link to="/" target="_blank">
							mëndihmo
						</Link>
						. Të gjitha të drejtat e rezervuara.
					</span>

					<div className="flex items-center gap-5 text-muted-foreground">
						<Link to="#" target="_blank">
							<BsTwitterX className="h-5 w-5" />
						</Link>
						<Link to="#" target="_blank">
							<BsInstagram className="h-5 w-5" />
						</Link>
						<Link to="#" target="_blank">
							<BsGithub className="h-5 w-5" />
						</Link>
						<Link to="#" target="_blank">
							<BsLinkedin className="h-5 w-5" />
						</Link>
					</div>
				</div>
			</div>
		</footer>
	);
};

export default Footer;
