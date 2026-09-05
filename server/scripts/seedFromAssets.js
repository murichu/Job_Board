import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import mongoose from "mongoose";

import connectDB from "../config/mongoDB.js";
import Company from "../models/Company.js";
import Job from "../models/Job.js";
import User from "../models/User.js";
import JobApplication from "../models/JobApplication.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");
const assetsFilePath = path.join(repoRoot, "client", "src", "assets", "assets.js");

const DEFAULT_PASSWORD = "SeedPass@123";
const LEVELS = ["Beginner level", "Intermediate level", "Senior level"];

const extractArrayValues = (content, exportName) => {
  const blockRegex = new RegExp(`export const ${exportName} = \\[(.*?)\\];`, "s");
  const blockMatch = content.match(blockRegex);
  if (!blockMatch) return [];
  return [...blockMatch[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
};

const extractJobsFromAssets = (content) => {
  const blockRegex = /export const jobsData = \[(.*?)\];/s;
  const match = content.match(blockRegex);
  if (!match) return [];

  const raw = match[1];
  const objectRegex = /\{[\s\S]*?title:\s*"([^"]+)"[\s\S]*?location:\s*"([^"]+)"[\s\S]*?salary:\s*(\d+)[\s\S]*?category:\s*"([^"]+)"[\s\S]*?\}/g;
  const jobs = [];
  let objectMatch = objectRegex.exec(raw);
  while (objectMatch) {
    jobs.push({
      title: objectMatch[1],
      location: objectMatch[2],
      salary: Number(objectMatch[3]),
      category: objectMatch[4],
    });
    objectMatch = objectRegex.exec(raw);
  }
  return jobs;
};

const seededCompanies = [
  { name: "Slack", location: "California" },
  { name: "Amazon", location: "New York" },
  { name: "Microsoft", location: "Washington" },
  { name: "Adobe", location: "California" },
  { name: "Walmart", location: "New York" },
];

const seededUsers = [
  "Alice Johnson",
  "Brian Lee",
  "Carla Mendes",
  "David Kim",
  "Evelyn Smith",
  "Frank Otieno",
];

const seededAdminUsers = [
  {
    name: "Platform Super Admin",
    email: "superadmin@demo.com",
    role: "super_admin",
  },
  {
    name: "Slack Company Admin",
    email: "admin@slack.demo",
    role: "admin",
    companyIndex: 0,
  },
  {
    name: "Slack Finance Admin",
    email: "finance@slack.demo",
    role: "finance_admin",
    companyIndex: 0,
  },
  {
    name: "Slack Finance Viewer",
    email: "finance.viewer@slack.demo",
    role: "finance_viewer",
    companyIndex: 0,
  },
  {
    name: "Slack Support Agent",
    email: "support@slack.demo",
    role: "support_agent",
    companyIndex: 0,
  },
  {
    name: "Slack Recruiter User",
    email: "recruiter@slack.demo",
    role: "recruiter",
    companyIndex: 0,
  },
  {
    name: "Slack HR Manager",
    email: "hr.manager@slack.demo",
    role: "hr_manager",
    companyIndex: 0,
  },
  {
    name: "Slack Accountant",
    email: "accountant@slack.demo",
    role: "accountant",
    companyIndex: 0,
  },
];

const randomPick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const createDescription = (title, category, location) => `
<h2>${title}</h2>
<p>Join our ${category} team in ${location} and help build high-impact products.</p>
<ul>
  <li>Collaborate with cross-functional teams</li>
  <li>Deliver production-ready features with quality</li>
  <li>Contribute to planning, execution, and optimization</li>
</ul>
<p>We value ownership, communication, and continuous learning.</p>
`.trim();

const main = async () => {
  try {
    const argv = new Set(process.argv.slice(2));
    const shouldReset = argv.has("--reset");

    await connectDB();

    const assetsContent = await fs.readFile(assetsFilePath, "utf8");
    const categories = extractArrayValues(assetsContent, "JobCategories");
    const locations = extractArrayValues(assetsContent, "JobLocations");
    const jobSeeds = extractJobsFromAssets(assetsContent);

    if (!categories.length || !locations.length) {
      throw new Error("Could not parse JobCategories/JobLocations from client/src/assets/assets.js");
    }

    if (shouldReset) {
      await Promise.all([
        JobApplication.deleteMany({}),
        Job.deleteMany({}),
        Company.deleteMany({}),
        User.deleteMany({}),
      ]);
      
      // Drop the old indices if they exist, since the schema changed
      await Company.collection.dropIndex("recruiterEmail_1").catch(() => {});
      await User.collection.dropIndex("uniqueId_1").catch(() => {});
      
      console.log("🧹 Existing seed collections cleared.");
    } else {
      const existingSeedCompany = await Company.findOne({
        email: "hr+1@slack.demo",
      }).lean();
      if (existingSeedCompany) {
        throw new Error(
          "Seed data already exists. Run `npm run seed:assets -- --reset` to reseed."
        );
      }
    }

    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

    const companies = await Company.insertMany(
      seededCompanies.map((company, idx) => ({
        name: company.name,
        email: `hr+${idx + 1}@${company.name.toLowerCase()}.demo`,
        image: `https://ui-avatars.com/api/?name=${encodeURIComponent(company.name)}&background=2563eb&color=fff`,
        password: hashedPassword,
        recruiterName: `${company.name} Recruiter`,
        recruiterPosition: "Talent Acquisition",
        companyPhone: `+1-555-010${idx + 1}`,
        companyLocation: company.location,
        isVerified: true,
      })),
      { ordered: false }
    );

    const users = await User.insertMany(
      seededUsers.map((name, idx) => ({
        name,
        email: `user${idx + 1}@demo.com`,
        image: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0ea5e9&color=fff`,
        password: hashedPassword,
        emailVerified: true,
        isActive: true,
      })),
      { ordered: false }
    );

    const adminUsers = await User.insertMany(
      seededAdminUsers.map((admin) => {
        const company = Number.isInteger(admin.companyIndex)
          ? companies[admin.companyIndex]
          : null;

        return {
          name: admin.name,
          email: admin.email,
          image: `https://ui-avatars.com/api/?name=${encodeURIComponent(admin.name)}&background=111827&color=fff`,
          password: hashedPassword,
          role: admin.role,
          tenantId: company?._id || null,
          emailVerified: true,
          isActive: true,
        };
      }),
      { ordered: false }
    );

    const jobsPayload = [];
    const normalizedJobs = jobSeeds
      .filter((job) => categories.includes(job.category))
      .map((job, idx) => ({
        ...job,
        level: LEVELS[idx % LEVELS.length],
      }));

    normalizedJobs.forEach((job, idx) => {
      const company = companies[idx % companies.length];
      jobsPayload.push({
        title: job.title,
        description: createDescription(job.title, job.category, job.location),
        location: job.location,
        category: job.category,
        level: job.level,
        salary: job.salary,
        date: new Date(Date.now() - idx * 86400000),
        deadline: new Date(Date.now() + 30 * 86400000),
        visible: true,
        approvalStatus: "approved",
        approvedAt: new Date(),
        jobStatus: "active",
        companyId: company._id,
      });
    });

    for (let i = 0; i < 8; i += 1) {
      const company = randomPick(companies);
      const category = randomPick(categories);
      const location = randomPick(locations);
      const level = randomPick(LEVELS);
      const title = `${category} ${level.split(" ")[0]} Specialist`;
      jobsPayload.push({
        title,
        description: createDescription(title, category, location),
        location,
        category,
        level,
        salary: 50000 + Math.floor(Math.random() * 90000),
        date: new Date(),
        deadline: new Date(Date.now() + 30 * 86400000),
        visible: true,
        approvalStatus: "approved",
        approvedAt: new Date(),
        jobStatus: "active",
        companyId: company._id,
      });
    }

    const jobs = await Job.insertMany(jobsPayload, { ordered: false });

    const applicationsPayload = jobs.slice(0, 10).map((job) => {
      const user = randomPick(users);
      return {
        userId: user._id,
        companyId: job.companyId,
        jobId: job._id,
        status: randomPick(["Pending", "Longlisted", "Shortlisted", "Rejected"]),
        date: new Date(),
      };
    });

    await JobApplication.insertMany(applicationsPayload, { ordered: false });

    console.log("✅ Seed completed from assets.js data:");
    console.log(`- Categories parsed: ${categories.length}`);
    console.log(`- Locations parsed: ${locations.length}`);
    console.log(`- Base jobs parsed from assets.js jobsData: ${normalizedJobs.length}`);
    console.log(`- Companies created: ${companies.length}`);
    console.log(`- Users created: ${users.length}`);
    console.log(`- Admin users created: ${adminUsers.length}`);
    console.log(`- Jobs created: ${jobs.length}`);
    console.log(`- Applications created: ${applicationsPayload.length}`);
    console.log(`\n🔐 Seed account password for users/companies/admins: ${DEFAULT_PASSWORD}`);
  } catch (error) {
    console.error("❌ Seed failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

main();
