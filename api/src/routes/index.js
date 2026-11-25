import express from "express";
import healthRoutes from "./healthRoutes.js";
import authRoutes from "./authRoutes.js";
import memberRoutes from "./memberRoutes.js";
import savingsRoutes from "./savingsRoutes.js";
import initialMembershipRoutes from "./initialMembershipRoutes.js";

const router = express.Router();

router.use("/api/health", healthRoutes);
router.use("/api/auth", authRoutes);
router.use("/api/members", memberRoutes);
router.use("/api/savings", savingsRoutes);
router.use("/api/initial-membership", initialMembershipRoutes);

export default router;
