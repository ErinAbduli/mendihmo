import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { z } from "zod";
import { motion, useAnimation, useInView } from "motion/react";
import { ChevronRight, Pencil } from "lucide-react";
import { apiClient } from "@/lib/api";
import { localizeErrorMessage } from "@/lib/error-utils";
import logo from "@/assets/logo3.svg";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { MediaUpload, PhotoGalleryUpload } from "@/components/ui/file-upload";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

const DRAFT_KEY = "start_campaign_draft";
const DRAFT_TTL = 2 * 60 * 60 * 1000;

type ApiCategory = {
	id: number;
	name: string;
	slug: string;
};

const COUNTRIES = [
	"Shqipëria",
	"Kosova",
	"Maqedonia e Veriut",
	"Mali i Zi",
	"Serbia",
	"Greqia",
	"Italia",
	"Gjermania",
	"Zvicra",
	"Austria",
	"Belgjika",
	"Franca",
	"Mbretëria e Bashkuar",
	"Shtetet e Bashkuara",
	"Kanada",
	"Turqia",
	"Suedia",
	"Norvegjia",
	"Danimarka",
	"Finlanda",
	"Holanda",
	"Luksemburgu",
	"Sllovenia",
	"Kroacia",
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
		coverImage: z.union([z.string(), z.literal("")]).optional(),
		images: z.union([z.array(z.string()), z.literal("")]).optional(),
	});

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


function writeDraft(data: unknown, step: number) {
	const payload = JSON.stringify({ data, savedAt: Date.now(), step });
	try {
		localStorage.setItem(DRAFT_KEY, payload);
	} catch {
		// Quota exceeded — retry without the (potentially large) coverImage
		try {
			const safe = { ...(data as Record<string, unknown>), coverImage: "" };
			localStorage.setItem(DRAFT_KEY, JSON.stringify({ data: safe, savedAt: Date.now(), step }));
		} catch {
			/* storage unavailable, skip silently */
		}
	}
}

const StartCampaign = () => {
	const navigate = useNavigate();
	const [categories, setCategories] = useState<ApiCategory[]>([]);
	const [loadingCategories, setLoadingCategories] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [currentStep, setCurrentStep] = useState(1);

	type EditField = "location" | "category" | "goalAmount" | "coverImage" | "title" | "description";
	const [editField, setEditField] = useState<EditField | null>(null);
	const [tempEdit, setTempEdit] = useState<Record<string, unknown>>({});

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
			coverImage: "",
			images: [],
		},
	});

	// Restore draft from localStorage on mount
	useEffect(() => {
		try {
			const raw = localStorage.getItem(DRAFT_KEY);
			if (!raw) return;
			const { data, savedAt, step } = JSON.parse(raw) as {
				data: Partial<StartCampaignFormInput>;
				savedAt: number;
				step: number;
			};
			if (Date.now() - savedAt < DRAFT_TTL) {
				form.reset({ ...form.getValues(), ...data });
				if (step && step >= 1 && step <= 5) setCurrentStep(step);
			} else {
				localStorage.removeItem(DRAFT_KEY);
			}
		} catch {
			localStorage.removeItem(DRAFT_KEY);
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Persist to localStorage on field change
	useEffect(() => {
		const subscription = form.watch((data) => {
			writeDraft(data, currentStep);
		});
		return () => subscription.unsubscribe();
	}, [form, currentStep]);

	// Persist to localStorage when step changes (even without field edits)
	useEffect(() => {
		const raw = localStorage.getItem(DRAFT_KEY);
		if (!raw) return;
		try {
			const parsed = JSON.parse(raw);
			writeDraft(parsed.data, currentStep);
		} catch {
			/* ignore */
		}
	}, [currentStep]);

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

	// Reactive values for review step
	const watchedValues = form.watch();

	const openEdit = useCallback(
		(field: EditField) => {
			const v = form.getValues();
			if (field === "location") setTempEdit({ country: v.country, postcode: v.postcode });
			else if (field === "category") setTempEdit({ categoryId: String(v.categoryId) });
			else if (field === "goalAmount") setTempEdit({ goalAmount: v.goalAmount });
			else if (field === "coverImage") setTempEdit({ coverImage: v.coverImage ?? "" });
			else if (field === "title") setTempEdit({ title: v.title });
			else if (field === "description") setTempEdit({ description: v.description });
			setEditField(field);
		},
		[form],
	);

	const saveEdit = useCallback(() => {
		if (editField === "location") {
			form.setValue("country", tempEdit.country as string);
			form.setValue("postcode", tempEdit.postcode as string);
		} else if (editField === "category") {
			form.setValue("categoryId", Number(tempEdit.categoryId));
		} else if (editField === "goalAmount") {
			form.setValue("goalAmount", Number(tempEdit.goalAmount));
		} else if (editField === "coverImage") {
			form.setValue("coverImage", tempEdit.coverImage as string);
		} else if (editField === "title") {
			form.setValue("title", tempEdit.title as string);
		} else if (editField === "description") {
			form.setValue("description", tempEdit.description as string);
		}
		setEditField(null);
	}, [editField, tempEdit, form]);

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

			localStorage.removeItem(DRAFT_KEY);
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
			const isValid = await form.trigger(["country", "postcode", "categoryId"]);
			if (isValid) setCurrentStep(2);
		} else if (currentStep === 2) {
			const isValid = await form.trigger(["goalAmount"]);
			if (isValid) setCurrentStep(3);
		} else if (currentStep === 3) {
			setCurrentStep(4);
		} else if (currentStep === 4) {
			const isValid = await form.trigger(["title", "description"]);
			if (isValid) setCurrentStep(5);
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
								<div className="relative hidden flex-1 flex-col items-center justify-center bg-gradient-to-br from-primary/20 via-background to-background px-8 py-12 lg:flex">
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
													Hapi 1 i 5
												</Badge>
												<h2 className="font-heading text-3xl font-bold">
													Le të fillojmë udhëtimin tuaj
												</h2>
											</div>
										</BoxReveal>
										<BoxReveal duration={0.5} delay={0.2}>
											<p className="text-lg text-muted-foreground">
												Tregoni ku do të shkojnë fondet
												dhe zgjidhni kategorinë që
												përfaqëson më mirë kauzën tuaj.
											</p>
										</BoxReveal>
										<BoxReveal duration={0.5} delay={0.3}>
											<div className="h-px bg-border" />
										</BoxReveal>
										<BoxReveal duration={0.5} delay={0.4}>
											<div className="space-y-2">
												<p className="text-xs font-medium text-muted-foreground">
													PËRPARIM
												</p>
												<div className="h-2 w-full overflow-hidden rounded-full bg-muted">
													<motion.div
														initial={{ width: 0 }}
														animate={{
															width: "20%",
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
								<div className="flex flex-1 flex-col items-center justify-center px-6 py-12 sm:px-8 lg:px-12">
									<div className="w-full max-w-lg space-y-6">
										<BoxReveal duration={0.5} delay={0}>
											<div className="space-y-2">
												<p className="text-base font-medium">
													Ku do të shkojnë fondet? *
												</p>
												<div className="grid grid-cols-2 gap-3">
													<FormField
														control={form.control}
														name="country"
														render={({ field }) => (
															<FormItem>
																<FormLabel className="text-base font-semibold">
																	Vendi
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
																		<SelectTrigger className="h-14 text-base px-4">
																			<SelectValue placeholder="Zgjidhni" />
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
													<FormField
														control={form.control}
														name="postcode"
														render={({ field }) => (
															<FormItem>
																<FormLabel className="text-base font-semibold">
																	Kodi postal
																</FormLabel>
																<FormControl>
																	<Input
																		placeholder="P.sh. 1000"
																		className="h-14 text-base"
																		{...field}
																	/>
																</FormControl>
																<FormMessage />
															</FormItem>
														)}
													/>
												</div>
											</div>
										</BoxReveal>

										<BoxReveal duration={0.5} delay={0.15}>
											<FormField
												control={form.control}
												name="categoryId"
												render={({ field }) => (
													<FormItem>
														<p className="text-base font-medium">
															Cila kategori e përfaqëson më mirë kauzën tuaj? *
														</p>
														<FormMessage />
														{loadingCategories ? (
															<p className="text-sm text-muted-foreground">
																Duke ngarkuar…
															</p>
														) : categoryOptions.length ? (
															<div className="flex flex-wrap gap-2 pt-1">
																{categoryOptions.map(
																	(cat) => {
																		const isSelected =
																			String(
																				field.value,
																			) ===
																			cat.value;
																		return (
																			<button
																				key={
																					cat.value
																				}
																				type="button"
																				onClick={() =>
																					field.onChange(
																						cat.value,
																					)
																				}
																				className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
																					isSelected
																						? "border-primary bg-primary text-primary-foreground"
																						: "border-border bg-background text-foreground hover:border-primary/60 hover:bg-primary/5"
																				}`}
																			>
																				{
																					cat.label
																				}
																			</button>
																		);
																	},
																)}
															</div>
														) : (
															<p className="text-sm text-muted-foreground">
																Nuk ka kategori të disponueshme.
															</p>
														)}
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

						{/* Step 2: Amount */}
						{currentStep === 2 && (
							<>
								<div className="relative hidden flex-1 flex-col items-center justify-center bg-gradient-to-br from-primary/20 via-background to-background px-8 py-12 lg:flex">
									<Ripple mainCircleSize={100} mainCircleOpacity={0.1} numCircles={3} />
									<div className="relative max-w-md space-y-6 z-10">
										<BoxReveal duration={0.5} delay={0}>
											<button type="button" onClick={() => navigate("/donate")} className="-mb-3 p-0 transition-opacity hover:opacity-70" aria-label="Kthehu në faqen kryesore">
												<img src={logo} alt="Logo" className="w-48 object-contain" />
											</button>
										</BoxReveal>
										<BoxReveal duration={0.5} delay={0.1}>
											<div>
												<Badge className="mb-4 text-sm">Hapi 2 i 5</Badge>
												<h2 className="font-heading text-3xl font-bold">Sa është objektivi juaj?</h2>
											</div>
										</BoxReveal>
										<BoxReveal duration={0.5} delay={0.2}>
											<p className="text-lg text-muted-foreground">
												Vendosni shumën që dëshironi të mblidhni dhe periudhën kohore të fushatës suaj.
											</p>
										</BoxReveal>
										<BoxReveal duration={0.5} delay={0.3}>
											<div className="h-px bg-border" />
										</BoxReveal>
										<BoxReveal duration={0.5} delay={0.4}>
											<div className="space-y-2">
												<p className="text-xs font-medium text-muted-foreground">PËRPARIM</p>
												<div className="h-2 w-full overflow-hidden rounded-full bg-muted">
													<motion.div initial={{ width: 0 }} animate={{ width: "40%" }} transition={{ duration: 0.8, ease: "easeOut" }} className="h-full bg-primary" />
												</div>
											</div>
										</BoxReveal>
									</div>
								</div>
								<div className="flex flex-1 flex-col items-center justify-center px-6 py-12 sm:px-8 lg:px-12">
									<div className="w-full max-w-lg space-y-6">
										<BoxReveal duration={0.5} delay={0}>
											<FormField
												control={form.control}
												name="goalAmount"
												render={({ field }) => (
													<FormItem>
														<FormLabel className="text-base font-semibold">Objektivi (EUR) *</FormLabel>
														<FormControl>
															<Input
																type="number"
																min="1"
																step="1"
																placeholder="P.sh. 5000"
																className="h-14 text-base"
																{...field}
																value={String(field.value || "")}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
										</BoxReveal>
										<BoxReveal duration={0.5} delay={0.1}>
											<div className="flex flex-wrap gap-3 pt-4">
												<Button type="button" variant="outline" className="flex-1" onClick={handlePrevStep}>Mbrapa</Button>
												<Button type="button" onClick={handleNextStep} className="flex-1">
													Vazhdo <ChevronRight className="ml-2 h-4 w-4" />
												</Button>
											</div>
										</BoxReveal>
									</div>
								</div>
							</>
						)}

						{/* Step 3: Cover photo or video */}
						{currentStep === 3 && (
							<>
								<div className="relative hidden flex-1 flex-col items-center justify-center bg-gradient-to-br from-primary/20 via-background to-background px-8 py-12 lg:flex">
									<Ripple mainCircleSize={100} mainCircleOpacity={0.1} numCircles={3} />
									<div className="relative max-w-md space-y-6 z-10">
										<BoxReveal duration={0.5} delay={0}>
											<button type="button" onClick={() => navigate("/donate")} className="-mb-3 p-0 transition-opacity hover:opacity-70" aria-label="Kthehu në faqen kryesore">
												<img src={logo} alt="Logo" className="w-48 object-contain" />
											</button>
										</BoxReveal>
										<BoxReveal duration={0.5} delay={0.1}>
											<div>
												<Badge className="mb-4 text-sm">Hapi 3 i 5</Badge>
												<h2 className="font-heading text-3xl font-bold">Shto një foto ose video</h2>
											</div>
										</BoxReveal>
										<BoxReveal duration={0.5} delay={0.2}>
											<p className="text-lg text-muted-foreground">
												Një foto ose video e mirë e cover rrit ndjeshëm shanset e suksesit të fushatës suaj.
											</p>
										</BoxReveal>
										<BoxReveal duration={0.5} delay={0.3}>
											<div className="h-px bg-border" />
										</BoxReveal>
										<BoxReveal duration={0.5} delay={0.4}>
											<div className="space-y-2">
												<p className="text-xs font-medium text-muted-foreground">PËRPARIM</p>
												<div className="h-2 w-full overflow-hidden rounded-full bg-muted">
													<motion.div initial={{ width: 0 }} animate={{ width: "60%" }} transition={{ duration: 0.8, ease: "easeOut" }} className="h-full bg-primary" />
												</div>
											</div>
										</BoxReveal>
									</div>
								</div>
								<div className="flex flex-1 flex-col items-center justify-center px-6 py-12 sm:px-8 lg:px-12">
									<div className="w-full max-w-lg space-y-6">
										<BoxReveal duration={0.5} delay={0}>
											<FormField
												control={form.control}
												name="coverImage"
												render={({ field }) => (
													<FormItem>
														<FormLabel className="text-base font-semibold">Foto ose video cover (opsionale)</FormLabel>
														<FormControl>
															<MediaUpload
																value={field.value || undefined}
																onChange={field.onChange}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
										</BoxReveal>
										<BoxReveal duration={0.5} delay={0.1}>
											<div className="flex flex-wrap gap-3 pt-4">
												<Button type="button" variant="outline" className="flex-1" onClick={handlePrevStep}>Mbrapa</Button>
												<Button type="button" onClick={handleNextStep} className="flex-1">
													Vazhdo <ChevronRight className="ml-2 h-4 w-4" />
												</Button>
											</div>
										</BoxReveal>
									</div>
								</div>
							</>
						)}

						{/* Step 4: Title and description */}
						{currentStep === 4 && (
							<>
								<div className="relative hidden flex-1 flex-col items-center justify-center bg-gradient-to-br from-primary/20 via-background to-background px-8 py-12 lg:flex">
									<Ripple mainCircleSize={100} mainCircleOpacity={0.1} numCircles={3} />
									<div className="relative max-w-md space-y-6 z-10">
										<BoxReveal duration={0.5} delay={0}>
											<button type="button" onClick={() => navigate("/donate")} className="-mb-3 p-0 transition-opacity hover:opacity-70" aria-label="Kthehu në faqen kryesore">
												<img src={logo} alt="Logo" className="w-48 object-contain" />
											</button>
										</BoxReveal>
										<BoxReveal duration={0.5} delay={0.1}>
											<div>
												<Badge className="mb-4 text-sm">Hapi 4 i 5</Badge>
												<h2 className="font-heading text-3xl font-bold">Tregoni historinë tuaj</h2>
											</div>
										</BoxReveal>
										<BoxReveal duration={0.5} delay={0.2}>
											<p className="text-lg text-muted-foreground">
												Një titull i qartë dhe një përshkrim i sinqertë i japin jetë kauzës suaj.
											</p>
										</BoxReveal>
										<BoxReveal duration={0.5} delay={0.3}>
											<div className="h-px bg-border" />
										</BoxReveal>
										<BoxReveal duration={0.5} delay={0.4}>
											<div className="space-y-2">
												<p className="text-xs font-medium text-muted-foreground">PËRPARIM</p>
												<div className="h-2 w-full overflow-hidden rounded-full bg-muted">
													<motion.div initial={{ width: 0 }} animate={{ width: "80%" }} transition={{ duration: 0.8, ease: "easeOut" }} className="h-full bg-primary" />
												</div>
											</div>
										</BoxReveal>
									</div>
								</div>
								<div className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-6 py-12 sm:px-8 lg:px-12">
									<div className="w-full max-w-lg space-y-6">
										<BoxReveal duration={0.5} delay={0}>
											<FormField
												control={form.control}
												name="title"
												render={({ field }) => (
													<FormItem>
														<FormLabel className="text-base font-semibold">Titulli *</FormLabel>
														<FormControl>
															<Input placeholder="P.sh. Ndihmë për trajtim mjekësor" className="h-14 text-base" {...field} />
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
														<FormLabel className="text-base font-semibold">Përshkrimi *</FormLabel>
														<FormControl>
															<textarea
																{...field}
																rows={6}
																className="flex min-h-36 w-full rounded-md border border-input bg-background px-4 py-3 text-base shadow-xs outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
																placeholder="Shpjego situatën, kujt i shkon ndihma dhe si do të përdoren fondet…"
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
										</BoxReveal>
										<BoxReveal duration={0.5} delay={0.2}>
											<div className="flex flex-wrap gap-3 border-t pt-6">
												<Button type="button" variant="outline" className="flex-1" onClick={handlePrevStep}>Mbrapa</Button>
												<Button type="button" onClick={handleNextStep} className="flex-1">
													Vazhdo <ChevronRight className="ml-2 h-4 w-4" />
												</Button>
											</div>
										</BoxReveal>
									</div>
								</div>
							</>
						)}
						{/* Step 5: Review */}
						{currentStep === 5 && (
							<>
								<div className="relative hidden flex-1 flex-col items-center justify-center bg-gradient-to-br from-primary/20 via-background to-background px-8 py-12 lg:flex">
									<Ripple mainCircleSize={100} mainCircleOpacity={0.1} numCircles={3} />
									<div className="relative max-w-md space-y-6 z-10">
										<BoxReveal duration={0.5} delay={0}>
											<button type="button" onClick={() => navigate("/donate")} className="-mb-3 p-0 transition-opacity hover:opacity-70" aria-label="Kthehu në faqen kryesore">
												<img src={logo} alt="Logo" className="w-48 object-contain" />
											</button>
										</BoxReveal>
										<BoxReveal duration={0.5} delay={0.1}>
											<div>
												<Badge className="mb-4 text-sm">Hapi 5 i 5</Badge>
												<h2 className="font-heading text-3xl font-bold">Gati për dërgim?</h2>
											</div>
										</BoxReveal>
										<BoxReveal duration={0.5} delay={0.2}>
											<p className="text-lg text-muted-foreground">
												Rishiko të gjitha të dhënat para se të dërgosh kauzën. Mund të kthehesh prapa për të bërë ndryshime.
											</p>
										</BoxReveal>
										<BoxReveal duration={0.5} delay={0.3}>
											<div className="h-px bg-border" />
										</BoxReveal>
										<BoxReveal duration={0.5} delay={0.4}>
											<div className="space-y-2">
												<p className="text-xs font-medium text-muted-foreground">PËRPARIM</p>
												<div className="h-2 w-full overflow-hidden rounded-full bg-muted">
													<motion.div initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 0.8, ease: "easeOut" }} className="h-full bg-primary" />
												</div>
											</div>
										</BoxReveal>
									</div>
								</div>
								<div className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-6 py-12 sm:px-8 lg:px-12">
									<div className="w-full max-w-lg space-y-4">
										<BoxReveal duration={0.5} delay={0}>
											<div className="rounded-xl border border-border bg-muted/20 divide-y divide-border overflow-hidden">

												{/* Location */}
												<div className="flex items-start justify-between gap-3 p-4">
													<div className="space-y-0.5 min-w-0">
														<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Vendndodhja</p>
														<p className="text-base font-medium truncate">{watchedValues.country || "—"} {watchedValues.postcode ? `— ${watchedValues.postcode}` : ""}</p>
													</div>
													<button type="button" onClick={() => openEdit("location")} className="shrink-0 flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary">
														<Pencil className="h-3 w-3" /> Ndrysho
													</button>
												</div>

												{/* Category */}
												<div className="flex items-start justify-between gap-3 p-4">
													<div className="space-y-0.5 min-w-0">
														<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Kategoria</p>
														<p className="text-base font-medium">{categoryOptions.find(c => c.value === String(watchedValues.categoryId))?.label ?? "—"}</p>
													</div>
													<button type="button" onClick={() => openEdit("category")} className="shrink-0 flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary">
														<Pencil className="h-3 w-3" /> Ndrysho
													</button>
												</div>

												{/* Amount */}
												<div className="flex items-start justify-between gap-3 p-4">
													<div className="space-y-0.5 min-w-0">
														<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Objektivi</p>
														<p className="text-base font-medium">
															{watchedValues.goalAmount ? `€${Number(watchedValues.goalAmount).toLocaleString("sq-AL")}` : "—"}
														</p>
													</div>
													<button type="button" onClick={() => openEdit("goalAmount")} className="shrink-0 flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary">
														<Pencil className="h-3 w-3" /> Ndrysho
													</button>
												</div>

												{/* Cover */}
												<div className="flex items-start justify-between gap-3 p-4">
													<div className="space-y-2 min-w-0 flex-1">
														<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Cover</p>
														{watchedValues.coverImage ? (
															watchedValues.coverImage.startsWith("data:video") ? (
																<video src={watchedValues.coverImage} className="max-h-36 w-full rounded-lg object-cover" />
															) : (
																<img src={watchedValues.coverImage} alt="Cover" className="max-h-36 w-full rounded-lg object-cover" />
															)
														) : (
															<p className="text-sm text-muted-foreground">Nuk u ngarkua cover.</p>
														)}
													</div>
													<button type="button" onClick={() => openEdit("coverImage")} className="shrink-0 flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary">
														<Pencil className="h-3 w-3" /> Ndrysho
													</button>
												</div>

												{/* Title */}
												<div className="flex items-start justify-between gap-3 p-4">
													<div className="space-y-0.5 min-w-0">
														<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Titulli</p>
														<p className="text-base font-medium truncate">{watchedValues.title || "—"}</p>
													</div>
													<button type="button" onClick={() => openEdit("title")} className="shrink-0 flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary">
														<Pencil className="h-3 w-3" /> Ndrysho
													</button>
												</div>

												{/* Description */}
												<div className="flex items-start justify-between gap-3 p-4">
													<div className="space-y-0.5 min-w-0 flex-1">
														<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Përshkrimi</p>
														<p className="text-sm text-foreground leading-relaxed line-clamp-3 whitespace-pre-wrap">{watchedValues.description || "—"}</p>
													</div>
													<button type="button" onClick={() => openEdit("description")} className="shrink-0 flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary">
														<Pencil className="h-3 w-3" /> Ndrysho
													</button>
												</div>

												{/* Extra photos */}
												<div className="p-4 space-y-3">
													<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Foto shtesë</p>
													<FormField
														control={form.control}
														name="images"
														render={({ field }) => (
															<FormItem>
																<FormControl>
																	<PhotoGalleryUpload
																		value={Array.isArray(field.value) ? field.value as string[] : []}
																		onChange={field.onChange}
																	/>
																</FormControl>
																<FormMessage />
															</FormItem>
														)}
													/>
												</div>

											</div>
										</BoxReveal>

										<BoxReveal duration={0.5} delay={0.1}>
											<div className="flex flex-wrap gap-3 pt-2">
												<Button type="button" variant="outline" className="flex-1" onClick={handlePrevStep} disabled={submitting}>Mbrapa</Button>
												<Button type="submit" className="flex-1" disabled={submitting}>
													{submitting ? "Duke dërguar…" : "Dërgo kauzën"}
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

			{/* Edit dialogs */}
			<Dialog open={editField !== null} onOpenChange={(open) => { if (!open) setEditField(null); }}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>
							{editField === "location" && "Ndrysho vendndodhjen"}
							{editField === "category" && "Ndrysho kategorinë"}
							{editField === "goalAmount" && "Ndrysho objektivin"}
							{editField === "coverImage" && "Ndrysho cover-in"}
							{editField === "title" && "Ndrysho titullin"}
							{editField === "description" && "Ndrysho përshkrimin"}
						</DialogTitle>
					</DialogHeader>

					<div className="space-y-4 py-2">
						{editField === "location" && (
							<div className="grid grid-cols-2 gap-3">
								<div className="space-y-1.5">
									<label className="text-sm font-medium">Vendi</label>
									<Select
										value={tempEdit.country as string || ""}
										onValueChange={(v) => setTempEdit((p) => ({ ...p, country: v }))}
									>
										<SelectTrigger className="h-11">
											<SelectValue placeholder="Zgjidhni" />
										</SelectTrigger>
										<SelectContent className="max-h-72">
											{COUNTRIES.map((c) => (
												<SelectItem key={c} value={c}>{c}</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-1.5">
									<label className="text-sm font-medium">Kodi postal</label>
									<Input
										className="h-11"
										placeholder="P.sh. 1000"
										value={tempEdit.postcode as string || ""}
										onChange={(e) => setTempEdit((p) => ({ ...p, postcode: e.target.value }))}
									/>
								</div>
							</div>
						)}

						{editField === "category" && (
							<div className="flex flex-wrap gap-2">
								{categoryOptions.map((cat) => {
									const selected = String(tempEdit.categoryId) === cat.value;
									return (
										<button
											key={cat.value}
											type="button"
											onClick={() => setTempEdit((p) => ({ ...p, categoryId: cat.value }))}
											className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${selected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-foreground hover:border-primary/60 hover:bg-primary/5"}`}
										>
											{cat.label}
										</button>
									);
								})}
							</div>
						)}

						{editField === "goalAmount" && (
							<div className="space-y-1.5">
								<label className="text-sm font-medium">Shuma (EUR)</label>
								<Input
									type="number"
									min="1"
									className="h-11"
									placeholder="P.sh. 5000"
									value={String(tempEdit.goalAmount || "")}
									onChange={(e) => setTempEdit((p) => ({ ...p, goalAmount: e.target.value }))}
								/>
							</div>
						)}

						{editField === "coverImage" && (
							<MediaUpload
								value={tempEdit.coverImage as string || undefined}
								onChange={(v) => setTempEdit((p) => ({ ...p, coverImage: v ?? "" }))}
							/>
						)}

						{editField === "title" && (
							<div className="space-y-1.5">
								<label className="text-sm font-medium">Titulli</label>
								<Input
									className="h-11"
									placeholder="P.sh. Ndihmë për trajtim mjekësor"
									value={tempEdit.title as string || ""}
									onChange={(e) => setTempEdit((p) => ({ ...p, title: e.target.value }))}
								/>
							</div>
						)}

						{editField === "description" && (
							<div className="space-y-1.5">
								<label className="text-sm font-medium">Përshkrimi</label>
								<textarea
									rows={5}
									className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
									placeholder="Shpjego situatën…"
									value={tempEdit.description as string || ""}
									onChange={(e) => setTempEdit((p) => ({ ...p, description: e.target.value }))}
								/>
							</div>
						)}
					</div>

					<DialogFooter>
						<Button type="button" variant="outline" onClick={() => setEditField(null)}>Anulo</Button>
						<Button type="button" onClick={saveEdit}>Ruaj</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
};

export default StartCampaign;
