import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.ts";
import campaignRoutes from "./routes/campaign.routes.ts";
import categoryRoutes from "./routes/category.routes.ts";
import userRoutes from "./routes/user.routes.ts";
import helmet from "helmet";

dotenv.config();

const app = express();

app.use(helmet());
app.use(
	cors({
		origin: process.env.FRONTEND_URL || "http://localhost:5173",
		credentials: true,
	}),
);
app.use(cookieParser());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

app.use("/api/auth", authRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/users", userRoutes);

app.get("/", async (req: express.Request, res: express.Response) => {
	res.send("Hello, World!");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
