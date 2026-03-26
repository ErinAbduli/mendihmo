import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { GoogleLogo } from "@/components/icons";
import { LoginForm } from "@/components/login-form";
import logoNoText from "@/assets/logo-no-text.png";

const Login = () => (
	<div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden bg-linear-to-b from-background via-muted/30 to-background px-4 py-10">
		<div className="pointer-events-none absolute inset-0 -z-10">
			<div className="absolute -top-24 -left-20 h-72 w-72 rounded-full bg-primary/12 blur-3xl" />
			<div className="absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-accent/14 blur-3xl" />
		</div>

		<div className="mx-auto w-full max-w-md px-10 py-14 sm:rounded-2xl sm:border sm:bg-card/95 sm:shadow-lg sm:backdrop-blur">
			<img
				src={logoNoText}
				alt="Logo"
				className="mx-auto h-12 w-auto object-contain"
			/>
			<h1 className="mt-3 text-center font-semibold text-2xl">
				Kyçu në MëNdihmo
			</h1>

			<div className="mt-10">
				<Button className="w-full" size="lg" type="button">
					<GoogleLogo className="mr-2 size-4" />
					Vazhdo me Google
				</Button>

				<div className="my-6 flex items-center justify-center gap-2 overflow-hidden">
					<Separator />
					<span className="text-muted-foreground text-sm">OSE</span>
					<Separator />
				</div>

				<LoginForm />
			</div>

			<Link
				className="mt-6 block text-center text-muted-foreground text-sm"
				to="#"
			>
				Keni harruar fjalëkalimin?
			</Link>

			<p className="mt-6 text-center text-sm">
				Nuk keni llogari?{" "}
				<Link className="text-muted-foreground" to="/signup">
					Regjistrohuni
				</Link>
			</p>
		</div>
	</div>
);

export default Login;
