import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { z } from "zod";
import { motion, useAnimation, useInView } from "motion/react";
import { ChevronRight } from "lucide-react";
import { apiClient } from "@/lib/api";
import { localizeErrorMessage } from "@/lib/error-utils";
import logo from "@/assets/logo3.svg";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";

type ApiCategory = {
	id: number;
	name: string;
	slug: string;
};

const COUNTRIES = [
	"Shqipëria",
	"Austria",
	"Belgjika",
	"Bullgaria",
	"Kroacia",
	"Qipro",
	"Republika Çeke",
	"Danimarka",
	"Estonia",
	"Finlanda",
	"Franca",
	"Gjermania",
	"Greqia",
	"Hungaria",
	"Irlanda",
	"Islanda",
	"Italia",
	"Letonia",
	"Lituania",
	"Luksemburgu",
	"Malta",
	"Marok",
	"Maqedonia",
	"Moldavia",
	"Monako",
	"Mali i Zi",
	"Norvegjia",
	"Holanda",
	"Polonia",
	"Portugalia",
	"Rumania",
	"Rusia",
	"San Marino",
	"Serbia",
	"Sllovakia",
	"Sllovenia",
	"Spanja",
	"Suedia",
	"Zvicra",
	"Turqia",
	"Ukraina",
	"Mbretëria e Bashkuar",
	"Bosnja dhe Hercegovina",
];

const startCampaignSchema = z
	.object({
		country: z.string().min(1, {
			message: "Zgjidhni një vend.",
		}),
		postcode: z.string().min(1, {
			message: "Kodi postal është i detyrueshëm.",
		}),
		title: z.string().min(3, {
			message: "Titulli duhet të ketë të paktën 3 karaktere.",
		}),
		description: z.string().min(20, {
			message: "Përshkrimi duhet të ketë të paktën 20 karaktere.",
		}),
		goalAmount: z.coerce.number().positive({
			message: "Objektivi duhet të jetë më i madh se 0.",
		}),
		categoryId: z.coerce.number().int().positive({
			message: "Zgjidhni një kategori.",
		}),
		startDate: z.string().min(1, {
			message: "Data e fillimit është e detyrueshme.",
		}),
		endDate: z.string().min(1, {
			message: "Data e mbarimit është e detyrueshme.",
		}),
		coverImage: z.union([z.string(), z.literal("")]).optional(),
		images: z.union([z.array(z.string()), z.literal("")]).optional(),
	})
	.refine(
		(values) => {
			const start = new Date(values.startDate);
			const end = new Date(values.endDate);
			return (
				Number.isFinite(start.getTime()) &&
				Number.isFinite(end.getTime()) &&
				end.getTime() >= start.getTime()
			);
		},
		{
			message: "Data e mbarimit duhet të jetë pas datës së fillimit.",
			path: ["endDate"],
		},
	);

type StartCampaignFormInput = z.input<typeof startCampaignSchema>;
type StartCampaignFormValues = z.infer<typeof startCampaignSchema>;

const normalizeCategories = (input: unknown): ApiCategory[] => {
	const source = Array.isArray(input)
		? input
		: input && typeof input === "object" && "categories" in input
			? (input as { categories: unknown }).categories
			: [];

	if (!Array.isArray(source)) return [];

	return source.filter((item): item is ApiCategory =>
		Boolean(item && typeof item === "object"),
	);
};

const todayIsoDate = () => {
	const d = new Date();
	const yyyy = d.getFullYear();
	const mm = String(d.getMonth() + 1).padStart(2, "0");
	const dd = String(d.getDate()).padStart(2, "0");
	return `${yyyy}-${mm}-${dd}`;
};

// Animated Box Reveal Component
interface BoxRevealProps {
	children: React.ReactNode;
	duration?: number;
	delay?: number;
}

const BoxReveal = ({ children, duration = 0.5, delay = 0 }: BoxRevealProps) => {
	const mainControls = useAnimation();
	const ref = useRef(null);
	const isInView = useInView(ref, { once: true });

	useEffect(() => {
		if (isInView) {
			mainControls.start("visible");
		}
	}, [isInView, mainControls]);

	return (
		<motion.div
			ref={ref}
			variants={{
				hidden: { opacity: 0, y: 20 },
				visible: { opacity: 1, y: 0 },
			}}
			initial="hidden"
			animate={mainControls}
			transition={{ duration, delay, ease: "easeOut" }}
		>
			{children}
		</motion.div>
	);
};

// Ripple effect component
interface RippleProps {
	mainCircleSize?: number;
	mainCircleOpacity?: number;
	numCircles?: number;
}

const Ripple = ({
	mainCircleSize = 210,
	mainCircleOpacity = 0.15,
	numCircles = 4,
}: RippleProps) => {
	return (
		<div className="pointer-events-none absolute inset-0 overflow-hidden">
			{[...Array(numCircles)].map((_, i) => (
				<motion.div
					key={i}
					initial={{ scale: 0, opacity: mainCircleOpacity }}
					animate={{ scale: 1, opacity: 0 }}
					transition={{
						duration: 2.5,
						delay: i * 0.2,
						repeat: Infinity,
						repeatDelay: (numCircles - 1) * 0.2 + 0.5,
					}}
					className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/20"
					style={{
						width: mainCircleSize + i * 50,
						height: mainCircleSize + i * 50,
					}}
				/>
			))}
		</div>
	);
};

const fileToDataUrl = (file: File) =>
	new Promise<string>((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			if (typeof reader.result === "string") resolve(reader.result);
			else reject(new Error("Nuk u lexua dot skedari."));
		};
		reader.onerror = () =>
			reject(reader.error ?? new Error("Nuk u lexua dot skedari."));
		reader.readAsDataURL(file);
	});

const filesToDataUrls = async (files: FileList | null) => {
	if (!files?.length) return [];
	return Promise.all(Array.from(files).map((file) => fileToDataUrl(file)));
};

function FileUploadField({
	value,
	onChange,
	accept,
	multiple = false,
	placeholder,
	label,
	description,
}: {
	value?: string | string[] | null;
	onChange: (value: string | string[] | undefined) => void;
	accept: string;
	multiple?: boolean;
	placeholder: string;
	label: string;
	description: string;
}) {
	const inputRef = useRef<HTMLInputElement | null>(null);
	const selectedValues = Array.isArray(value) ? value : value ? [value] : [];

	const resetInput = () => {
		if (inputRef.current) inputRef.current.value = "";
	};

	const handleChange = async (event: ChangeEvent<HTMLInputElement>) => {
		const uploadedFiles = await filesToDataUrls(event.currentTarget.files);
		onChange(multiple ? uploadedFiles : uploadedFiles[0]);
		resetInput();
	};

	return (
		<Card className="border-dashed">
			<CardContent className="space-y-4 p-4">
				<div className="flex items-start justify-between gap-3">
					<div className="space-y-1">
						<p className="text-sm font-medium">{label}</p>
						<p className="text-xs text-muted-foreground">
							{description}
						</p>
					</div>
					<Button
						type="button"
						variant="ghost"
						size="icon-sm"
						onClick={() => {
							onChange(undefined);
							resetInput();
						}}
						disabled={!selectedValues.length}
						aria-label={`Pastro ${label.toLowerCase()}`}
					>
						×
					</Button>
				</div>

				<div className="flex flex-wrap items-center gap-3">
					<Button
						type="button"
						variant="outline"
						onClick={() => inputRef.current?.click()}
					>
						{placeholder}
					</Button>
					<input
						ref={inputRef}
						type="file"
						className="hidden"
						accept={accept}
						multiple={multiple}
						onChange={handleChange}
					/>
					<p className="text-xs text-muted-foreground">
						{selectedValues.length
							? multiple
								? `${selectedValues.length} skedarë të zgjedhur`
								: "Skedari u zgjodh"
							: "Nuk ka skedar të zgjedhur."}
					</p>
				</div>

				{selectedValues.length ? (
					<div
						className={
							multiple ? "grid gap-3 sm:grid-cols-2" : "space-y-3"
						}
					>
						{selectedValues.map((item, index) => (
							<div
								key={`${label}-${index}`}
								className="overflow-hidden rounded-lg border bg-muted/30"
							>
								{accept.includes("image") ? (
									<img
										src={item}
										alt={`${label} ${index + 1}`}
										className="h-40 w-full object-cover"
									/>
								) : null}
								<div className="border-t px-3 py-2 text-xs text-muted-foreground">
									Media e zgjedhur
								</div>
							</div>
						))}
					</div>
				) : null}
			</CardContent>
		</Card>
	);
}

const StartCampaign = () => {
	const navigate = useNavigate();
	const [categories, setCategories] = useState<ApiCategory[]>([]);
	const [loadingCategories, setLoadingCategories] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [currentStep, setCurrentStep] = useState(1);
	const todayDate = todayIsoDate();

	const form = useForm<
		StartCampaignFormInput,
		unknown,
		StartCampaignFormValues
	>({
		resolver: zodResolver(startCampaignSchema),
		defaultValues: {
			country: "",
			postcode: "",
			title: "",
			description: "",
			goalAmount: 0,
			categoryId: 0,
			startDate: todayDate,
			endDate: "",
			coverImage: "",
			images: [],
		},
	});
	const startDateValue = form.watch("startDate");

	useEffect(() => {
		let mounted = true;
		(async () => {
			setLoadingCategories(true);
			try {
				const data = await apiClient.get<unknown>("/categories");
				if (!mounted) return;
				setCategories(normalizeCategories(data));
			} catch {
				if (!mounted) return;
				setCategories([]);
				toast.error(
					"Nuk u ngarkuan kategoritë. Kontrollo backend-in (`/categories`) dhe CORS.",
				);
			} finally {
				if (mounted) setLoadingCategories(false);
			}
		})();
		return () => {
			mounted = false;
		};
	}, []);

	const categoryOptions = useMemo(
		() =>
			categories.map((category) => ({
				label: category.name,
				value: String(category.id),
			})),
		[categories],
	);

	const onSubmit = async (values: StartCampaignFormValues) => {
		setSubmitting(true);
		try {
			const payload: Record<string, unknown> = {
				...values,
				status: "pending",
				categoryId: Number(values.categoryId),
				coverImage: values.coverImage?.trim()
					? values.coverImage
					: undefined,
				images: Array.isArray(values.images)
					? values.images.filter((v) => v.trim()).slice(0, 8)
					: undefined,
			};

			await apiClient.post<unknown, Record<string, unknown>>(
				"/campaigns",
				payload,
			);

			toast.success(
				"Kauza u dërgua për shqyrtim. Do të publikohet pasi të aprovohet.",
			);
			form.reset({
				country: "",
				postcode: "",
				title: "",
				description: "",
				goalAmount: 0,
				categoryId: 0,
				startDate: todayDate,
				endDate: "",
				coverImage: "",
				images: [],
			});
			setCurrentStep(1);
			navigate("/donate");
		} catch (err) {
			const backendMessage = isAxiosError<{ error?: string }>(err)
				? (err.response?.data?.error ?? err.message)
				: err instanceof Error
					? err.message
					: null;
			toast.error(
				localizeErrorMessage(backendMessage) ??
					"Dërgimi i kauzës dështoi.",
			);
		} finally {
			setSubmitting(false);
		}
	};

	const handleNextStep = async () => {
		if (currentStep === 1) {
			const isValid = await form.trigger(["country", "postcode"]);
			if (isValid) {
				setCurrentStep(2);
			}
		} else if (currentStep === 2) {
			const isValid = await form.trigger(["categoryId"]);
			if (isValid) {
				setCurrentStep(3);
			}
		}
	};

	const handlePrevStep = () => {
		if (currentStep > 1) {
			setCurrentStep(currentStep - 1);
		}
	};

	return (
		<div className="flex min-h-screen bg-background">
			<Form {...form}>
				<form
					onSubmit={form.handleSubmit(onSubmit)}
					className="flex w-full"
				>
					{/* Step 1: Location */}
					<motion.div
						key={`step-${currentStep}`}
						initial={{ opacity: 0, x: 20 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: -20 }}
						transition={{ duration: 0.3, ease: "easeOut" }}
						className="flex w-full"
					>
						{currentStep === 1 && (
							<>
								{/* Left side - Text */}
								<div className="relative hidden flex-1 items-center justify-center bg-gradient-to-br from-primary/20 via-background to-background px-8 py-12 lg:flex">
									<Ripple
										mainCircleSize={100}
										mainCircleOpacity={0.1}
										numCircles={3}
									/>
									<div className="relative max-w-md space-y-6 z-10">
										{" "}
										<BoxReveal duration={0.5} delay={0}>
											<button
												type="button"
												onClick={() =>
													navigate("/donate")
												}
												className="-mb-3 p-0 transition-opacity hover:opacity-70"
												aria-label="Kthehu në faqen kryesore"
											>
												<img
													src={logo}
													alt="Logo"
													className=" w-48 object-contain"
												/>
											</button>
										</BoxReveal>{" "}
										<BoxReveal duration={0.5} delay={0.1}>
											<div>
												<Badge className="mb-4 text-sm">
													Hapi 1 i 3
												</Badge>
												<h2 className="font-heading text-3xl font-bold">
													Ku jeni bazuar?
												</h2>
											</div>
										</BoxReveal>
										<BoxReveal duration={0.5} delay={0.2}>
											<p className="text-lg text-muted-foreground">
												Zgjidhni vendin ku jeni bazuar
												dhe kodin postal të zonës tuaj.
												Kjo informacion ndihmon ne te
												fokusohemi ne komunitetin tuaj.
											</p>
										</BoxReveal>
										<BoxReveal duration={0.5} delay={0.3}>
											<div className="space-y-3 rounded-lg bg-primary/10 p-4">
												<p className="text-sm font-semibold text-foreground">
													Pse na duhet?
												</p>
												<ul className="space-y-2 text-sm text-muted-foreground">
													<li>
														✓ Për të kufizuar
														donacionet në vendin
														tuaj
													</li>
													<li>
														✓ Për ta lidhur kauzën
														me komunitetin lokal
													</li>
													<li>
														✓ Për të ndjekur burimet
														dhe efektin
													</li>
												</ul>
											</div>
										</BoxReveal>
										<BoxReveal duration={0.5} delay={0.4}>
											<div className="h-px bg-border" />
										</BoxReveal>
										<BoxReveal duration={0.5} delay={0.5}>
											<div className="space-y-2">
												<p className="text-xs font-medium text-muted-foreground">
													PËRPARIM
												</p>
												<div className="h-2 w-full overflow-hidden rounded-full bg-muted">
													<motion.div
														initial={{ width: 0 }}
														animate={{
															width: "33%",
														}}
														transition={{
															duration: 0.8,
															ease: "easeOut",
														}}
														className="h-full bg-primary"
													/>
												</div>
											</div>
										</BoxReveal>
									</div>
								</div>

								{/* Right side - Form inputs */}
								<div className="flex flex-1 items-center justify-center px-6 py-12 sm:px-8 lg:px-12">
									<div className="w-full max-w-sm space-y-6">
										<BoxReveal duration={0.5} delay={0}>
											<FormField
												control={form.control}
												name="country"
												render={({ field }) => (
													<FormItem>
														<FormLabel className="text-base">
															Vendi *
														</FormLabel>
														<FormControl>
															<Select
																onValueChange={
																	field.onChange
																}
																value={
																	field.value ||
																	""
																}
															>
																<SelectTrigger className="h-11">
																	<SelectValue placeholder="Zgjidhni vendin tuaj" />
																</SelectTrigger>
																<SelectContent className="max-h-72">
																	{COUNTRIES.map(
																		(
																			country,
																		) => (
																			<SelectItem
																				key={
																					country
																				}
																				value={
																					country
																				}
																			>
																				{
																					country
																				}
																			</SelectItem>
																		),
																	)}
																</SelectContent>
															</Select>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
										</BoxReveal>

										<BoxReveal duration={0.5} delay={0.1}>
											<FormField
												control={form.control}
												name="postcode"
												render={({ field }) => (
													<FormItem>
														<FormLabel className="text-base">
															Kodi postal *
														</FormLabel>
														<FormControl>
															<Input
																placeholder="P.sh. 1000"
																className="h-11"
																{...field}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
										</BoxReveal>

										<BoxReveal duration={0.5} delay={0.2}>
											<div className="flex flex-wrap gap-3 pt-4">
												<Button
													type="button"
													variant="outline"
													className="flex-1"
													onClick={() =>
														navigate("/donate")
													}
												>
													Anulo
												</Button>
												<Button
													type="button"
													onClick={handleNextStep}
													className="flex-1"
												>
													Vazhdo{" "}
													<ChevronRight className="ml-2 h-4 w-4" />
												</Button>
											</div>
										</BoxReveal>
									</div>
								</div>
							</>
						)}

						{currentStep === 2 && (
							<>
								{/* Left side - Text */}
								<div className="relative hidden flex-1 items-center justify-center bg-gradient-to-br from-primary/20 via-background to-background px-8 py-12 lg:flex">
									<Ripple
										mainCircleSize={100}
										mainCircleOpacity={0.1}
										numCircles={3}
									/>
									<div className="relative max-w-md space-y-6 z-10">
										{" "}
										<BoxReveal duration={0.5} delay={0}>
											<button
												type="button"
												onClick={() =>
													navigate("/donate")
												}
												className="-mb-3 p-0 transition-opacity hover:opacity-70"
												aria-label="Kthehu në faqen kryesore"
											>
												<img
													src={logo}
													alt="Logo"
													className="h-48 w-48 object-contain"
												/>
											</button>
										</BoxReveal>{" "}
										<BoxReveal duration={0.5} delay={0.1}>
											<div>
												<Badge className="mb-4 text-sm">
													Hapi 2 i 3
												</Badge>
												<h2 className="font-heading text-3xl font-bold">
													Kategoria e kauzës
												</h2>
											</div>
										</BoxReveal>
										<BoxReveal duration={0.5} delay={0.2}>
											<p className="text-lg text-muted-foreground">
												Zgjidhni kategorinë që më mirë
												përshkruan kauzën tuaj. Kjo i
												ndihmon donatorët të gjejnë
												kauzat që i interesohen.
											</p>
										</BoxReveal>
										<BoxReveal duration={0.5} delay={0.3}>
											<div className="space-y-3 rounded-lg bg-primary/10 p-4">
												<p className="text-sm font-semibold text-foreground">
													Kategoritë e disponueshme
												</p>
												<p className="text-sm text-muted-foreground">
													Zgjedhja e kategorisë sipas
													përdorimit të fondeve
													ndihmon donatorët të gjejnë
													kauzat që i interesohen më
													shumë.
												</p>
											</div>
										</BoxReveal>
										<BoxReveal duration={0.5} delay={0.4}>
											<div className="h-px bg-border" />
										</BoxReveal>
										<BoxReveal duration={0.5} delay={0.5}>
											<div className="space-y-2">
												<p className="text-xs font-medium text-muted-foreground">
													PËRPARIM
												</p>
												<div className="h-2 w-full overflow-hidden rounded-full bg-muted">
													<motion.div
														initial={{ width: 0 }}
														animate={{
															width: "66%",
														}}
														transition={{
															duration: 0.8,
															ease: "easeOut",
														}}
														className="h-full bg-primary"
													/>
												</div>
											</div>
										</BoxReveal>
									</div>
								</div>

								{/* Right side - Form inputs */}
								<div className="flex flex-1 items-center justify-center px-6 py-12 sm:px-8 lg:px-12">
									<div className="w-full max-w-sm space-y-6">
										<BoxReveal duration={0.5} delay={0}>
											<FormField
												control={form.control}
												name="categoryId"
												render={({ field }) => (
													<FormItem>
														<FormLabel className="text-base">
															Kategoria *
														</FormLabel>
														<FormControl>
															<Select
																onValueChange={
																	field.onChange
																}
																value={String(
																	field.value ||
																		"",
																)}
																disabled={
																	loadingCategories
																}
															>
																<SelectTrigger className="h-11">
																	<SelectValue
																		placeholder={
																			loadingCategories
																				? "Duke ngarkuar…"
																				: "Zgjidhni kategorinë"
																		}
																	/>
																</SelectTrigger>
																<SelectContent className="max-h-72">
																	{categoryOptions.length ? (
																		categoryOptions.map(
																			(
																				category,
																			) => (
																				<SelectItem
																					key={
																						category.value
																					}
																					value={
																						category.value
																					}
																				>
																					{
																						category.label
																					}
																				</SelectItem>
																			),
																		)
																	) : (
																		<SelectItem
																			value="0"
																			disabled
																		>
																			Nuk
																			ka
																			kategori
																		</SelectItem>
																	)}
																</SelectContent>
															</Select>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
										</BoxReveal>

										<BoxReveal duration={0.5} delay={0.1}>
											<div className="flex flex-wrap gap-3 pt-4">
												<Button
													type="button"
													variant="outline"
													className="flex-1"
													onClick={handlePrevStep}
												>
													Mbrapa
												</Button>
												<Button
													type="button"
													onClick={handleNextStep}
													className="flex-1"
												>
													Vazhdo{" "}
													<ChevronRight className="ml-2 h-4 w-4" />
												</Button>
											</div>
										</BoxReveal>
									</div>
								</div>
							</>
						)}

						{currentStep === 3 && (
							<>
								{/* Left side - Text */}
								<div className="relative hidden flex-1 items-center justify-center bg-gradient-to-br from-primary/20 via-background to-background px-8 py-12 lg:flex">
									<Ripple
										mainCircleSize={100}
										mainCircleOpacity={0.1}
										numCircles={3}
									/>
									<div className="relative max-w-md space-y-6 z-10">
										{" "}
										<BoxReveal duration={0.5} delay={0}>
											<button
												type="button"
												onClick={() =>
													navigate("/donate")
												}
												className="-mb-3 p-0 transition-opacity hover:opacity-70"
												aria-label="Kthehu në faqen kryesore"
											>
												<img
													src={logo}
													alt="Logo"
													className="h-48 w-48 object-contain"
												/>
											</button>
										</BoxReveal>{" "}
										<BoxReveal duration={0.5} delay={0.1}>
											<div>
												<Badge className="mb-4 text-sm">
													Hapi 3 i 3
												</Badge>
												<h2 className="font-heading text-3xl font-bold">
													Detajet e kauzës
												</h2>
											</div>
										</BoxReveal>
										<BoxReveal duration={0.5} delay={0.2}>
											<p className="text-lg text-muted-foreground">
												Plotëso informacionin në lidhje
												me kauzën tuaj. Përshkrimi i
												mirë dhe fotot ndihmon te beni
												më bindese kauzën tuaj.
											</p>
										</BoxReveal>
										<BoxReveal duration={0.5} delay={0.3}>
											<div className="space-y-3 rounded-lg bg-primary/10 p-4">
												<p className="text-sm font-semibold text-foreground">
													Këshillat për sukses
												</p>
												<ul className="space-y-2 text-sm text-muted-foreground">
													<li>
														✓ Titulli i qartë dhe i
														shkurtër
													</li>
													<li>
														✓ Përshkrim i detajuar
														me qëllim
													</li>
													<li>
														✓ Foto cover e qartë dhe
														bindese
													</li>
													<li>
														✓ Afat i arsyeshëm
														shpenzimet
													</li>
												</ul>
											</div>
										</BoxReveal>
										<BoxReveal duration={0.5} delay={0.4}>
											<div className="h-px bg-border" />
										</BoxReveal>
										<BoxReveal duration={0.5} delay={0.5}>
											<div className="space-y-2">
												<p className="text-xs font-medium text-muted-foreground">
													PËRPARIM
												</p>
												<div className="h-2 w-full overflow-hidden rounded-full bg-muted">
													<motion.div
														initial={{ width: 0 }}
														animate={{
															width: "100%",
														}}
														transition={{
															duration: 0.8,
															ease: "easeOut",
														}}
														className="h-full bg-primary"
													/>
												</div>
											</div>
										</BoxReveal>
									</div>
								</div>

								{/* Right side - Form inputs */}
								<div className="flex flex-1 items-center justify-center overflow-y-auto px-6 py-12 sm:px-8 lg:px-12">
									<div className="w-full max-w-sm space-y-6">
										<BoxReveal duration={0.5} delay={0}>
											<FormField
												control={form.control}
												name="title"
												render={({ field }) => (
													<FormItem>
														<FormLabel className="text-base">
															Titulli *
														</FormLabel>
														<FormControl>
															<Input
																placeholder="P.sh. Ndihmë për trajtim mjekësor"
																className="h-11"
																{...field}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
										</BoxReveal>

										<BoxReveal duration={0.5} delay={0.05}>
											<FormField
												control={form.control}
												name="goalAmount"
												render={({ field }) => (
													<FormItem>
														<FormLabel className="text-base">
															Objektivi (EUR) *
														</FormLabel>
														<FormControl>
															<Input
																type="number"
																min="1"
																step="1"
																placeholder="P.sh. 5000"
																className="h-11"
																{...field}
																value={String(
																	field.value ||
																		"",
																)}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
										</BoxReveal>

										<BoxReveal duration={0.5} delay={0.1}>
											<FormField
												control={form.control}
												name="description"
												render={({ field }) => (
													<FormItem>
														<FormLabel className="text-base">
															Përshkrimi *
														</FormLabel>
														<FormControl>
															<textarea
																{...field}
																rows={4}
																className="flex min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
																placeholder="Shpjego situatën, kujt i shkon ndihma dhe si do të përdoren fondet…"
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
										</BoxReveal>

										<BoxReveal duration={0.5} delay={0.15}>
											<div className="grid gap-3 sm:grid-cols-2">
												<FormField
													control={form.control}
													name="startDate"
													render={({ field }) => (
														<FormItem>
															<FormLabel className="text-sm">
																Data fillim *
															</FormLabel>
															<FormControl>
																<DatePicker
																	value={
																		field.value
																	}
																	onChange={
																		field.onChange
																	}
																	placeholder="Zgjidhni"
																	min={
																		todayDate
																	}
																/>
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>

												<FormField
													control={form.control}
													name="endDate"
													render={({ field }) => (
														<FormItem>
															<FormLabel className="text-sm">
																Data mbarimit *
															</FormLabel>
															<FormControl>
																<DatePicker
																	value={
																		field.value
																	}
																	onChange={
																		field.onChange
																	}
																	placeholder="Zgjidhni"
																	min={
																		startDateValue ||
																		todayDate
																	}
																/>
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>
											</div>
										</BoxReveal>

										<BoxReveal duration={0.5} delay={0.2}>
											<FormField
												control={form.control}
												name="coverImage"
												render={({ field }) => (
													<FormItem>
														<FormLabel className="text-base">
															Foto cover
															(opsionale)
														</FormLabel>
														<FormControl>
															<FileUploadField
																value={
																	field.value
																}
																onChange={
																	field.onChange
																}
																accept="image/*"
																placeholder="Ngarko foto"
																label="Cover"
																description="Zgjidh një foto që përfaqëson kauzën."
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
										</BoxReveal>

										<BoxReveal duration={0.5} delay={0.25}>
											<FormField
												control={form.control}
												name="images"
												render={({ field }) => (
													<FormItem>
														<FormLabel className="text-base">
															Foto të tjera
															(opsionale)
														</FormLabel>
														<FormControl>
															<FileUploadField
																value={
																	field.value
																}
																onChange={
																	field.onChange
																}
																accept="image/*"
																multiple
																placeholder="Ngarko foto"
																label="Imazhe"
																description="Maksimum 8 foto."
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
										</BoxReveal>

										<BoxReveal duration={0.5} delay={0.3}>
											<div className="flex flex-wrap gap-3 border-t pt-6">
												<Button
													type="button"
													variant="outline"
													className="flex-1"
													onClick={handlePrevStep}
													disabled={submitting}
												>
													Mbrapa
												</Button>
												<Button
													type="button"
													variant="outline"
													className="flex-1"
													onClick={() =>
														form.reset({
															country: "",
															postcode: "",
															title: "",
															description: "",
															goalAmount: 0,
															categoryId: 0,
															startDate:
																todayDate,
															endDate: "",
															coverImage: "",
															images: [],
														})
													}
													disabled={submitting}
												>
													Pastro
												</Button>
												<Button
													type="submit"
													className="flex-1"
													disabled={submitting}
												>
													{submitting
														? "Duke dërguar…"
														: "Dërgo"}
												</Button>
											</div>
										</BoxReveal>
									</div>
								</div>
							</>
						)}
					</motion.div>
				</form>
			</Form>
		</div>
	);
};

export default StartCampaign;
