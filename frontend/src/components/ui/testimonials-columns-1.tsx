"use client";
import React from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

type Testimonial = {
	text: string;
	image: string;
	name: string;
	role: string;
};

export const TestimonialsColumn = (props: {
	className?: string;
	testimonials: Testimonial[];
	duration?: number;
}) => {
	return (
		<div className={props.className}>
			<motion.div
				animate={{
					translateY: "-50%",
				}}
				transition={{
					duration: props.duration || 10,
					repeat: Infinity,
					ease: "linear",
					repeatType: "loop",
				}}
				className="flex flex-col gap-6 pb-6 bg-background"
			>
				{[
					...new Array(2).fill(0).map((_, index) => (
						<React.Fragment key={index}>
							{props.testimonials.map(
								({ text, image, name, role }, i) => (
									<div
										className="p-10 rounded-3xl border shadow-lg shadow-primary/10 max-w-xs w-full"
										key={i}
									>
										<div className="text-sm md:text-base leading-6">
											{text}
										</div>
										<div className="flex items-center gap-2 mt-5">
											<img
												width={40}
												height={40}
												src={image}
												alt={name}
												className="h-10 w-10 rounded-full"
											/>
											<div className="flex flex-col">
												<div className="font-medium tracking-tight leading-5 text-sm md:text-base">
													{name}
												</div>
												<div className="leading-5 opacity-60 tracking-tight text-sm">
													{role}
												</div>
											</div>
										</div>
									</div>
								),
							)}
						</React.Fragment>
					)),
				]}
			</motion.div>
		</div>
	);
};

const testimonials = [
	{
		text: "Dhurova për një fushatë për ndihmë mjekësore dhe procesi ishte shumë i thjeshtë — brenda ditësh u pa ndikimi.",
		image: "https://i.pravatar.cc/80?img=1",
		name: "Elira Meziu",
		role: "Donatore",
	},
	{
		text: "Siguria e pagesave ishte e shkëlqyer. Ndjeva besim të plotë kur dhashë për një projekt arsimor.",
		image: "https://i.pravatar.cc/80?img=2",
		name: "Arben Dosti",
		role: "Vullnetar",
	},
	{
		text: "Pas dhurimit pashë përditësimet e fushatës dhe raportet e ndikimit — shumë transparencë.",
		image: "https://i.pravatar.cc/80?img=3",
		name: "Klodiana Hysa",
		role: "Mbështetëse komuniteti",
	},
	{
		text: "Kampanja për strehim mori shumë mbështetje; platforma e bëri të lehtë ndarjen e fushatës me miqtë.",
		image: "https://i.pravatar.cc/80?img=4",
		name: "Gentian Leka",
		role: "Organizator fushate",
	},
	{
		text: "Mbështetja e ekipit ishte e shpejtë dhe profesioniste — ndihmuan me dokumentacionin e fushatës.",
		image: "https://i.pravatar.cc/80?img=5",
		name: "Ana Krasniqi",
		role: "Koordinator projektesh",
	},
	{
		text: "Raportet e ndikimit treguan sesi donacionet tona ndihmuan familjet në nevojë — shumë premtuese.",
		image: "https://i.pravatar.cc/80?img=6",
		name: "Mirsada Gjoni",
		role: "Donatore aktive",
	},
	{
		text: "Ndjeva komunitet të fortë duke ndarë fushatën dhe organizuar ngjarje mbledhëse fondesh.",
		image: "https://i.pravatar.cc/80?img=7",
		name: "Vjollca Beqiri",
		role: "Aktiviste lokale",
	},
	{
		text: "Platforma ofron një ndërfaqe të thjeshtë për menaxhimin e fushatave dhe komunikimin me donatorët.",
		image: "https://i.pravatar.cc/80?img=8",
		name: "Edi Kola",
		role: "Menaxher fushate",
	},
	{
		text: "Vura re përmirësim të dukshëm në arritjen e qëllimeve të fushatës qëndrore pas promovimit në platformë.",
		image: "https://i.pravatar.cc/80?img=9",
		name: "Rina Dushi",
		role: "Donatore",
	},
];

const firstColumn = testimonials.slice(0, 3);
const secondColumn = testimonials.slice(3, 6);
const thirdColumn = testimonials.slice(6, 9);

const Testimonials = () => {
	return (
		<section className="bg-background my-20 relative">
			<div className="container z-10 mx-auto">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					transition={{
						duration: 0.8,
						delay: 0.1,
						ease: [0.16, 1, 0.3, 1],
					}}
					viewport={{ once: true }}
					className="flex flex-col items-center justify-center max-w-[540px] mx-auto"
				>
					<div className="flex justify-center">
						<Badge
							variant="secondary"
							className="rounded-full border-accent/50 bg-accent/10 px-3 py-1 text-accent-foreground"
						>
							Rishikime
						</Badge>
					</div>

					<h2 className="mt-4 font-semibold text-2xl tracking-tight sm:text-3xl md:text-4xl">
						Çfarë thonë përdoruesit tanë
					</h2>
					<p className="mt-4 leading-relaxed text-foreground/70 md:text-lg text-center">
						Përvoja e përdoruesve tanë me fushatat, donacionet dhe
						ndikimin.
					</p>
				</motion.div>

				<div className="flex justify-center gap-6 mt-10 [mask-image:linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)] max-h-[740px] overflow-hidden">
					<TestimonialsColumn
						testimonials={firstColumn}
						duration={15}
					/>
					<TestimonialsColumn
						testimonials={secondColumn}
						className="hidden md:block"
						duration={19}
					/>
					<TestimonialsColumn
						testimonials={thirdColumn}
						className="hidden lg:block"
						duration={17}
					/>
				</div>
			</div>
		</section>
	);
};

export default Testimonials;
