"use client";

import { useEffect, useState } from "react";

type ArcGalleryHeroProps = {
	images: string[];
	startAngle?: number;
	endAngle?: number;
	radiusLg?: number;
	radiusMd?: number;
	radiusSm?: number;
	cardSizeLg?: number;
	cardSizeMd?: number;
	cardSizeSm?: number;
	className?: string;
};

export const ArcGalleryHero = ({
	images,
	startAngle = 20,
	endAngle = 160,
	radiusLg = 480,
	radiusMd = 360,
	radiusSm = 260,
	cardSizeLg = 120,
	cardSizeMd = 100,
	cardSizeSm = 80,
	className = "",
}: ArcGalleryHeroProps) => {
	const [dimensions, setDimensions] = useState({
		radius: radiusLg,
		cardSize: cardSizeLg,
	});

	useEffect(() => {
		const handleResize = () => {
			const width = window.innerWidth;
			if (width < 640) {
				setDimensions({ radius: radiusSm, cardSize: cardSizeSm });
			} else if (width < 1024) {
				setDimensions({ radius: radiusMd, cardSize: cardSizeMd });
			} else {
				setDimensions({ radius: radiusLg, cardSize: cardSizeLg });
			}
		};

		handleResize();
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, [radiusLg, radiusMd, radiusSm, cardSizeLg, cardSizeMd, cardSizeSm]);

	const count = Math.max(images.length, 2);
	const step = (endAngle - startAngle) / (count - 1);

	return (
		<section
			className={`relative flex min-h-screen flex-col overflow-hidden bg-background text-foreground ${className}`}
		>
			<div
				className="relative mx-auto w-full"
				style={{
					height: dimensions.radius * 1.2,
				}}
			>
				<div className="absolute bottom-0 left-1/2 -translate-x-1/2">
					{images.map((src, i) => {
						const angle = startAngle + step * i;
						const angleRad = (angle * Math.PI) / 180;
						const x = Math.cos(angleRad) * dimensions.radius;
						const y = Math.sin(angleRad) * dimensions.radius;

						return (
							<div
								key={i}
								className="absolute opacity-0 animate-fade-in-up"
								style={{
									width: dimensions.cardSize,
									height: dimensions.cardSize,
									left: `calc(50% + ${x}px)`,
									bottom: `${y}px`,
									transform: "translate(-50%, 50%)",
									animationDelay: `${i * 100}ms`,
									animationFillMode: "forwards",
									zIndex: count - i,
								}}
							>
								<div
									className="h-full w-full overflow-hidden rounded-2xl bg-card shadow-xl ring-1 ring-border transition-transform hover:scale-105"
									style={{
										transform: `rotate(${angle / 4}deg)`,
									}}
								>
									<img
										src={src}
										alt={`Memory ${i + 1}`}
										className="block h-full w-full object-cover"
										draggable={false}
										onError={(e) => {
											(e.target as HTMLImageElement).src =
												"https://placehold.co/400x400/0f766e/f5f5f4?text=Memory";
										}}
									/>
								</div>
							</div>
						);
					})}
				</div>
			</div>

			<div className="relative z-10 -mt-72 flex flex-1 items-center justify-center px-6 pt-2 md:-mt-[22rem] md:pt-3 lg:-mt-[24.5rem] lg:pt-4">
				<div
					className="max-w-2xl px-6 py-8 text-center opacity-0 animate-fade-in sm:px-8"
					style={{
						animationDelay: "800ms",
						animationFillMode: "forwards",
					}}
				>
					<h1 className="text-balance bg-linear-to-b from-foreground to-foreground/80 bg-clip-text text-3xl font-bold leading-[1.15] tracking-tight text-transparent sm:text-5xl lg:text-6xl">
						Bashkë mund të bëjmë gjithçka
					</h1>
					<p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
						Mëndihmo është platforma shqiptare e bamirësisë dhe
						financimit kolektiv ku çdokush mund të nisë një kauzë
						ose të mbështesë ato që i beson. Nga nevojat emergjente
						deri te ëndrrat e mëdha çdo kontribut ka rëndësi.
					</p>
					<div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
						<button className="w-full rounded-full bg-primary px-6 py-3 text-primary-foreground shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-xl sm:w-auto">
							Fillo një kauzë
						</button>
						<button className="w-full rounded-full border border-border/90 bg-background/80 px-6 py-3 text-foreground transition-all duration-200 hover:bg-accent/15 sm:w-auto">
							Ndihmo të tjerët
						</button>
					</div>
				</div>
			</div>

			<style>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translate(-50%, 60%);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 50%);
          }
        }
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation-name: fade-in-up;
          animation-duration: 0.8s;
          animation-timing-function: ease-out;
        }
        .animate-fade-in {
          animation-name: fade-in;
          animation-duration: 0.8s;
          animation-timing-function: ease-out;
        }
      `}</style>
		</section>
	);
};
