import { BsGithub, BsTwitterX, BsInstagram, BsLinkedin } from "react-icons/bs";
import { Link } from "react-router";
import { Separator } from "@/components/ui/separator";
import { Logo } from "@/components/logo";

const footerSections = [
	{
		title: "Produkti",
		links: [
			{
				title: "Përmbledhje",
				href: "#",
			},
			{
				title: "Veçori",
				href: "#",
			},
			{
				title: "Zgjidhje",
				href: "#",
			},
			{
				title: "Udhëzues",
				href: "#",
			},
			{
				title: "Çmimet",
				href: "#",
			},
			{
				title: "Versionet",
				href: "#",
			},
		],
	},
	{
		title: "Kompania",
		links: [
			{
				title: "Rreth nesh",
				href: "#",
			},
			{
				title: "Karriera",
				href: "#",
			},
			{
				title: "Shtypi",
				href: "#",
			},
			{
				title: "Lajme",
				href: "#",
			},
			{
				title: "Materialet e medias",
				href: "#",
			},
			{
				title: "Kontakti",
				href: "#",
			},
		],
	},
	{
		title: "Burime",
		links: [
			{
				title: "Blogu",
				href: "#",
			},
			{
				title: "Buletini",
				href: "#",
			},
			{
				title: "Ngjarje",
				href: "#",
			},
			{
				title: "Qendra e ndihmës",
				href: "#",
			},
			{
				title: "Udhëzues",
				href: "#",
			},
			{
				title: "Mbështetje",
				href: "#",
			},
		],
	},
	{
		title: "Rrjete sociale",
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
		title: "Ligjore",
		links: [
			{
				title: "Kushtet",
				href: "#",
			},
			{
				title: "Privatësia",
				href: "#",
			},
			{
				title: "Cookies",
				href: "#",
			},
			{
				title: "Licencat",
				href: "#",
			},
			{
				title: "Cilësimet",
				href: "#",
			},
			{
				title: "Kontakti",
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
