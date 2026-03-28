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
import { localizeErrorMessage } from "@/lib/error-utils";

const formSchema = z.object({
	email: z.email({
		message: "Ju lutemi vendosni një email të vlefshme.",
	}),
	password: z.string().min(8, {
		message: "Fjalëkalimi duhet të ketë të paktën 8 karaktere.",
	}),
});

export const LoginForm = () => {
	const navigate = useNavigate();
	const login = useAuthStore((state) => state.login);
	const isLoading = useAuthStore((state) => state.isLoading);
	const authError = useAuthStore((state) => state.error);
	const clearError = useAuthStore((state) => state.clearError);

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			email: "",
			password: "",
		},
	});

	async function onSubmit(values: z.infer<typeof formSchema>) {
		clearError();
		try {
			await login(values);
			toast.success("Kyçja u krye me sukses.");
			navigate("/");
		} catch (error) {
			const rawMessage = isAxiosError<{ error?: string }>(error)
				? (error.response?.data?.error ?? authError ?? "Kyçja dështoi.")
				: (authError ?? "Kyçja dështoi.");
			toast.error(localizeErrorMessage(rawMessage) ?? "Kyçja dështoi.");
		}
	}

	const onInvalid = () => {
		toast.warning("Ju lutemi plotësoni fushat e kërkuara saktë.");
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit, onInvalid)}>
				<div className="space-y-5">
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
				<Button
					className="mt-6 w-full"
					disabled={isLoading}
					size="lg"
					type="submit"
				>
					Kyçu
				</Button>
			</form>
		</Form>
	);
};
