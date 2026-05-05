import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { Link, useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { z } from "zod";
import { apiClient } from "@/lib/api";
import { localizeErrorMessage } from "@/lib/error-utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

const startCampaignSchema = z
	.object({
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
	if (!Array.isArray(input)) return [];
	return input.filter((item): item is ApiCategory => Boolean(item && typeof item === "object"));
};

const todayIsoDate = () => {
	const d = new Date();
	const yyyy = d.getFullYear();
	const mm = String(d.getMonth() + 1).padStart(2, "0");
	const dd = String(d.getDate()).padStart(2, "0");
	return `${yyyy}-${mm}-${dd}`;
};

const fileToDataUrl = (file: File) =>
	new Promise<string>((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			if (typeof reader.result === "string") resolve(reader.result);
			else reject(new Error("Nuk u lexua dot skedari."));
		};
		reader.onerror = () => reject(reader.error ?? new Error("Nuk u lexua dot skedari."));
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
						<p className="text-xs text-muted-foreground">{description}</p>
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
					<Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>
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
					<div className={multiple ? "grid gap-3 sm:grid-cols-2" : "space-y-3"}>
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

	const form = useForm<StartCampaignFormInput, unknown, StartCampaignFormValues>({
		resolver: zodResolver(startCampaignSchema),
		defaultValues: {
			title: "",
			description: "",
			goalAmount: 0,
			categoryId: 0,
			startDate: todayIsoDate(),
			endDate: "",
			coverImage: "",
			images: [],
		},
	});

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
				coverImage: values.coverImage?.trim() ? values.coverImage : undefined,
				images: Array.isArray(values.images)
					? values.images.filter((v) => v.trim()).slice(0, 8)
					: undefined,
			};

			await apiClient.post<unknown, Record<string, unknown>>("/campaigns", payload);

			toast.success("Kauza u dërgua për shqyrtim. Do të publikohet pasi të aprovohet.");
			form.reset({
				title: "",
				description: "",
				goalAmount: 0,
				categoryId: 0,
				startDate: todayIsoDate(),
				endDate: "",
				coverImage: "",
				images: [],
			});
			navigate("/donate");
		} catch (err) {
			const backendMessage = isAxiosError<{ error?: string }>(err)
				? err.response?.data?.error ?? err.message
				: err instanceof Error
					? err.message
					: null;
			toast.error(
				localizeErrorMessage(backendMessage) ?? "Dërgimi i kauzës dështoi.",
			);
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div className="min-h-screen bg-background">
			<section className="border-b border-border/60">
				<div className="mx-auto w-full max-w-5xl px-4 py-10 md:py-14">
					<div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr] md:items-center">
						<div className="space-y-4">
							<Badge variant="secondary" className="w-fit">
								Fillo një kauzë
							</Badge>
							<h1 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
								Krijo një fushatë për të mbledhur donacione
							</h1>
							<p className="max-w-prose text-muted-foreground">
								Plotëso detajet kryesore. Kauza do të shkojë në shqyrtim dhe pastaj do të
								shfaqet te “Dhuro”.
							</p>
							<div className="flex flex-wrap gap-2">
								<Button asChild variant="outline">
									<Link to="/donate">Shiko fushatat</Link>
								</Button>
								<Button asChild>
									<a href="#start-campaign-form">Plotëso formën</a>
								</Button>
							</div>
						</div>

						<Card className="bg-card/60">
							<CardHeader>
								<CardTitle>Çfarë të duhet</CardTitle>
								<CardDescription>
									Disa të dhëna bazë për ta bërë kauzën të qartë.
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-2 text-sm text-muted-foreground">
								<p>- Titull i qartë dhe i shkurtër</p>
								<p>- Përshkrim i detajuar i nevojës</p>
								<p>- Objektivi dhe afati</p>
								<p>- Foto cover (opsionale, por e rekomanduar)</p>
							</CardContent>
						</Card>
					</div>
				</div>
			</section>

			<section
				id="start-campaign-form"
				className="mx-auto w-full max-w-5xl px-4 py-10 md:py-12"
			>
				<Card>
					<CardHeader>
						<CardTitle>Detajet e kauzës</CardTitle>
						<CardDescription>Fushat me * janë të detyrueshme.</CardDescription>
					</CardHeader>
					<CardContent>
						<Form {...form}>
							<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
								<div className="grid gap-4 md:grid-cols-2">
									<FormField
										control={form.control}
										name="title"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Titulli *</FormLabel>
												<FormControl>
													<Input placeholder="P.sh. Ndihmë për trajtim mjekësor" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="goalAmount"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Objektivi (EUR) *</FormLabel>
												<FormControl>
													<Input
														type="number"
														min="1"
														step="1"
														placeholder="P.sh. 5000"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>

								<FormField
									control={form.control}
									name="description"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Përshkrimi *</FormLabel>
											<FormControl>
												<textarea
													{...field}
													rows={6}
													className="flex min-h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
													placeholder="Shpjego situatën, kujt i shkon ndihma dhe si do të përdoren fondet…"
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<div className="grid gap-4 md:grid-cols-2">
									<FormField
										control={form.control}
										name="categoryId"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Kategoria *</FormLabel>
												<FormControl>
													<Select
														onValueChange={field.onChange}
														value={String(field.value || "")}
														disabled={loadingCategories}
													>
														<SelectTrigger>
															<SelectValue
																placeholder={
																	loadingCategories ? "Duke ngarkuar…" : "Zgjidh kategorinë"
																}
															/>
														</SelectTrigger>
														<SelectContent>
															{categoryOptions.length ? (
																categoryOptions.map((category) => (
																	<SelectItem key={category.value} value={category.value}>
																		{category.label}
																	</SelectItem>
																))
															) : (
																<SelectItem value="0" disabled>
																	Nuk ka kategori
																</SelectItem>
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
										name="endDate"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Data e mbarimit *</FormLabel>
												<FormControl>
													<DatePicker
														value={field.value}
														onChange={field.onChange}
														placeholder="Zgjidh datën e mbarimit"
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>

								<div className="grid gap-4 md:grid-cols-2">
									<FormField
										control={form.control}
										name="startDate"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Data e fillimit *</FormLabel>
												<FormControl>
													<DatePicker
														value={field.value}
														onChange={field.onChange}
														placeholder="Zgjidh datën e fillimit"
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="coverImage"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Foto cover (opsionale)</FormLabel>
												<FormControl>
													<FileUploadField
														value={field.value}
														onChange={field.onChange}
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
								</div>

								<FormField
									control={form.control}
									name="images"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Foto të tjera (opsionale)</FormLabel>
											<FormControl>
												<FileUploadField
													value={field.value}
													onChange={field.onChange}
													accept="image/*"
													multiple
													placeholder="Ngarko foto"
													label="Imazhe"
													description="Maksimum 8 foto. (Për momentin ruhen si data-url në payload.)"
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<div className="flex flex-wrap items-center justify-end gap-2 pt-2">
									<Button
										type="button"
										variant="outline"
										onClick={() => form.reset()}
										disabled={submitting}
									>
										Pastro
									</Button>
									<Button type="submit" disabled={submitting}>
										{submitting ? "Duke dërguar..." : "Dërgo kauzën"}
									</Button>
								</div>
							</form>
						</Form>
					</CardContent>
				</Card>
			</section>
		</div>
	);
};

export default StartCampaign;