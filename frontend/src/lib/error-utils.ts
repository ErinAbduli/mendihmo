const statusCodeMap: Record<number, string> = {
	400: "Kërkesa nuk është e vlefshme.",
	401: "Nuk jeni i autorizuar.",
	403: "Nuk keni leje për këtë veprim.",
	404: "Burimi i kërkuar nuk u gjet.",
	409: "Ky burim ekziston tashmë.",
	422: "Të dhënat e dërguara nuk janë të vlefshme.",
	500: "Gabim i brendshëm në server.",
};

export const localizeErrorMessage = (
	message: string | null | undefined,
): string | null => {
	if (!message) {
		return null;
	}

	const normalized = message.trim().toLowerCase();
	if (!normalized) {
		return null;
	}

	if (
		normalized.includes("user already exists") ||
		normalized.includes("exists")
	) {
		return "Përdoruesi ekziston tashmë.";
	}

	if (normalized.includes("invalid email or password")) {
		return "Email-i ose fjalëkalimi është i pasaktë.";
	}

	if (
		normalized.includes("unauthorized") ||
		normalized.includes("invalid token")
	) {
		return "Nuk jeni i autorizuar.";
	}

	if (normalized.includes("forbidden")) {
		return "Nuk keni leje për këtë veprim.";
	}

	if (normalized.includes("network error")) {
		return "Nuk mund të lidhemi me serverin. Kontrolloni lidhjen.";
	}

	if (normalized.includes("server error")) {
		return "Gabim në server.";
	}

	const statusMatch = normalized.match(/status code\s*(\d{3})/);
	if (statusMatch) {
		const statusCode = Number.parseInt(statusMatch[1], 10);
		if (statusCodeMap[statusCode]) {
			return statusCodeMap[statusCode];
		}
	}

	if (/^[\x00-\x7F]+$/.test(message)) {
		return "Ndodhi një gabim. Ju lutemi provoni përsëri.";
	}

	return message;
};
