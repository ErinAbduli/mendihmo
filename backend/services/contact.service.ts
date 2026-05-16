import type { CreateContactInput } from "../schema/contact.schema.ts";
import { prisma } from "../lib/prisma.ts";

type ContactStatus = "pending" | "in-progress" | "resolved";

const serializeMessage = (message: {
	id: number;
	name: string;
	email: string;
	subject: string;
	message: string;
	status: string;
	createdAt: Date;
}) => ({
	id: message.id,
	name: message.name,
	email: message.email,
	subject: message.subject,
	message: message.message,
	status: message.status,
	createdAt: message.createdAt.toISOString(),
});

export const contactService = {
	createMessage: async (payload: CreateContactInput) => {
		const message = await prisma.contactMessage.create({
			data: {
				name: payload.name.trim(),
				email: payload.email.trim(),
				subject: payload.subject.trim(),
				message: payload.message.trim(),
				status: "pending",
			},
		});

		return {
			id: message.id,
			createdAt: message.createdAt.toISOString(),
		};
	},

	listMessages: async () => {
		const messages = await prisma.contactMessage.findMany({
			orderBy: { createdAt: "desc" },
		});

		return messages.map(serializeMessage);
	},

	updateStatus: async (id: number, status: ContactStatus) => {
		try {
			const updated = await prisma.contactMessage.update({
				where: { id },
				data: { status },
			});

			return serializeMessage(updated);
		} catch {
			return null;
		}
	},

	deleteMessage: async (id: number) => {
		try {
			await prisma.contactMessage.delete({
				where: { id },
			});

			return true;
		} catch {
			return false;
		}
	},
};
