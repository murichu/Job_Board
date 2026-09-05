import express from "express";
import { getJobById, getJobs } from "../controllers/jobControllers.js";

const jobRouter = express.Router();

// Route to get all jobs (e.g., GET /api/jobs)
jobRouter.get("/", getJobs);

// Route to get a single job by its MongoDB _id (e.g., GET /api/jobs/:id)
jobRouter.get("/:id", getJobById);

export default jobRouter;
