"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "./ui/form";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/authStore";

const formSchema = z.object({
	emri: z.string().min(2, {
		message: "Emri duhet të ketë të paktën 2 karaktere.",
	}),
	mbiemri: z.string().min(2, {
		message: "Mbiemri duhet të ketë të paktën 2 karaktere.",
	}),
	email: z.email({
		message: "Ju lutemi vendosni një email të vlefshme.",
	}),
	password: z.string().min(8, {
		message: "Fjalëkalimi duhet të ketë të paktën 8 karaktere.",
	}),
});

export const SignUpForm = () => {
	const navigate = useNavigate();
	const register = useAuthStore((state) => state.register);
	const isLoading = useAuthStore((state) => state.isLoading);
	const authError = useAuthStore((state) => state.error);
	const clearError = useAuthStore((state) => state.clearError);

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			emri: "",
			mbiemri: "",
			email: "",
			password: "",
		},
	});

	async function onSubmit(values: z.infer<typeof formSchema>) {
		clearError();
		try {
			await register(values);
			toast.success("Regjistrimi u krye me sukses.");
			navigate("/");
		} catch (error) {
			const backendMessage = isAxiosError<{ error?: string }>(error)
				? error.response?.data?.error
				: null;

			if (backendMessage?.toLowerCase().includes("exists")) {
				toast.warning("Ky email ekziston tashmë. Provoni të kyçeni.");
				return;
			}

			toast.error(authError ?? backendMessage ?? "Regjistrimi dështoi.");
		}
	}

	const onInvalid = () => {
		toast.warning("Ju lutemi plotësoni fushat e kërkuara saktë.");
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit, onInvalid)}>
				<div className="space-y-5">
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<FormField
							control={form.control}
							name="emri"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Emri</FormLabel>
									<FormControl>
										<Input
											placeholder="Shkruani emrin"
											type="text"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="mbiemri"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Mbiemri</FormLabel>
									<FormControl>
										<Input
											placeholder="Shkruani mbiemrin"
											type="text"
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
						name="email"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Email</FormLabel>
								<FormControl>
									<Input
										placeholder="Shkruani email-in tuaj"
										type="email"
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="password"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Fjalëkalimi</FormLabel>
								<FormControl>
									<Input
										placeholder="Shkruani fjalëkalimin tuaj"
										type="password"
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					{authError ? (
						<p className="text-destructive text-sm font-medium">
							{authError}
						</p>
					) : null}
				</div>

				<Button className="mt-6 w-full" disabled={isLoading} size="lg" type="submit">
					Regjistrohu
				</Button>
			</form>
		</Form>
	);
};
