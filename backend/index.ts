import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { prisma } from "./lib/prisma.ts";
import authRoutes from "./routes/auth.routes.ts";
import helmet from "helmet";

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);

app.get("/", async (req: express.Request, res: express.Response) => {
	res.send("Hello, World!");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
