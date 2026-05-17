"use client";

import { Link } from "react-router";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqItems = [
	{
		id: "item-1",
		question: "Si funksionon Mëndihmo?",
		answer:
			"Mëndihmo lidh njerëzit që kanë nevojë për mbështetje me ata që duan të kontribuojnë. Përdoruesit mund të krijojnë një fushatë për kauza personale, mjekësore, sociale apo komunitare, ndërsa donatorët mund të dhurojnë në mënyrë të shpejtë dhe të sigurt për kauzat që i prekin më shumë.",
	},
	{
		id: "item-2",
		question: "A janë fushatat të verifikuara?",
		answer:
			"Po, çdo fushatë kalon një proces verifikimi përpara publikimit. Ekipi ynë kontrollon informacionin dhe dokumentacionin për të siguruar që kauzat janë reale dhe në përputhje me rregullat e platformës.",
	},
	{
		id: "item-3",
		question: "Si mund të filloj një kauzë?",
		answer:
			"Mund të nisni një fushatë duke klikuar te “Fillo një kauzë”. Plotësoni informacionin kryesor, shtoni përshkrimin, fotot dhe dokumentet mbështetëse, pastaj dërgojeni për shqyrtim. Pas aprovimit, fushata publikohet dhe mund të ndahet me komunitetin.",
	},
	{
		id: "item-4",
		question: "A janë pagesat të sigurta?",
		answer:
			"Po, të gjitha pagesat përpunohen përmes sistemeve të sigurta dhe të mbrojtura të pagesave. Të dhënat financiare ruhen me standarde të larta sigurie për të garantuar një përvojë të besueshme për çdo donator.",
	},
	{
		id: "item-5",
		question: "Sa kohë duhet për aprovimin e një fushate?",
		answer:
			"Zakonisht fushatat shqyrtohen dhe aprovohen brenda 24–48 orëve. Në raste të caktuara mund të kërkohet dokumentacion shtesë për të përfunduar procesin e verifikimit.",
	},
];

export default function FAQs() {
	return (
		<section className="scroll-py-16 border-t border-border/60 bg-linear-to-b from-background to-muted/25 py-16 md:scroll-py-32 md:py-32">
			<div className="mx-auto max-w-5xl px-6">
				<div className="mx-auto max-w-2xl px-2 text-center">
					<h2 className="mb-4 text-3xl font-semibold tracking-tight md:text-4xl">
						Pyetje të shpeshta
					</h2>
					<p className="mx-auto max-w-xl text-muted-foreground">
						Gjej përgjigje të shpejta për pyetjet më të zakonshme rreth
						dhurimeve, fushatave dhe përdorimit të platformës.
					</p>
				</div>

				<div className="mx-auto mt-12 max-w-2xl divide-y divide-dashed px-2">
					<Accordion type="single" collapsible className="w-full">
						{faqItems.map((item) => (
							<AccordionItem key={item.id} value={item.id}>
								<AccordionTrigger className="cursor-pointer text-base hover:no-underline">
									{item.question}
								</AccordionTrigger>
								<AccordionContent>
									<p className="text-base leading-7">{item.answer}</p>
								</AccordionContent>
							</AccordionItem>
						))}
					</Accordion>

					<p className="mt-6 px-0 text-center text-muted-foreground">
						Nuk gjete atë që kërkoje? Na shkruaj nga{' '}
						<Link to="/contact" className="font-medium text-primary hover:underline">
							faqja e kontaktit
						</Link>
						.
					</p>
				</div>
			</div>
		</section>
	);
}