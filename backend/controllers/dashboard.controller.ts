import type { Request, Response } from "express";
import { getDashboardStats } from "../services/dashboard.service.ts";

export const getStats = async (req: Request, res: Response) => {
  try {
    const data = await getDashboardStats();
    res.json(data);
  } catch (err) {
    console.error("Failed to get dashboard stats", err);
    res.status(500).json({ message: "Failed to load dashboard stats" });
  }
};

export default { getStats };
