import { Lock, CheckCircle, Zap } from "lucide-react";

export default function CallToAction() {
	return (
		<section className="w-full bg-gradient-to-b from-primary to-accent py-16">
			<div className="max-w-5xl mx-auto px-4">
				<div className="flex flex-col items-center justify-center text-center text-white">
					<div className="flex flex-wrap items-center justify-center p-1 rounded-full bg-primary/10 backdrop-blur border border-primary/30 text-sm">
						<div className="flex items-center -space-x-3">
							<img
								className="h-8 w-8 md:h-9 md:w-9 rounded-full border-2 border-white"
								src="https://i.pravatar.cc/40?img=10"
								alt="user1"
							/>
							<img
								className="h-8 w-8 md:h-9 md:w-9 rounded-full border-2 border-white -translate-x-2"
								src="https://i.pravatar.cc/40?img=11"
								alt="user2"
							/>
							<img
								className="h-8 w-8 md:h-9 md:w-9 rounded-full border-2 border-white -translate-x-4"
								src="https://i.pravatar.cc/40?img=12"
								alt="user3"
							/>
						</div>
						<p className="-translate-x-2 font-medium ml-4">
							Bashkohu me komunitetin tonë dhe mbështet 1000+
							fushata
						</p>
					</div>

					<h1 className="mt-5 text-3xl md:text-4xl lg:text-5xl font-semibold max-w-xl">
						Bëhu arsyeja pse dikush merr ndihmë sot.
					</h1>

					<div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
						<button className="w-full rounded-full bg-white text-primary px-8 py-3 font-medium transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg sm:w-auto cursor-pointer">
							Fillo një kauzë
						</button>
						<button className="w-full rounded-full border-2 border-white bg-transparent text-white px-8 py-3 font-medium transition-all duration-200 hover:bg-white/10 sm:w-auto cursor-pointer">
							Ndihmo të tjerët
						</button>
					</div>

					<div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6 text-sm font-medium">
						<div className="flex items-center gap-2">
							<Lock className="h-4 w-4" />
							<span>Pagesa të Sigurta</span>
						</div>
						<div className="flex items-center gap-2">
							<CheckCircle className="h-4 w-4" />
							<span>Fushata të Verifikuara</span>
						</div>
						<div className="flex items-center gap-2">
							<Zap className="h-4 w-4" />
							<span>Ndikim Real</span>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
