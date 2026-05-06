import type { CreateContactInput } from "../schema/contact.schema.ts";

type ContactMessage = CreateContactInput & {
	id: string;
	createdAt: string;
};

const inbox: ContactMessage[] = [];

export const contactService = {
	createMessage: async (payload: CreateContactInput) => {
		const message: ContactMessage = {
			id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
			name: payload.name.trim(),
			email: payload.email.trim(),
			subject: payload.subject.trim(),
			message: payload.message.trim(),
			createdAt: new Date().toISOString(),
		};

		inbox.unshift(message);

		return {
			id: message.id,
			createdAt: message.createdAt,
		};
	},
};
