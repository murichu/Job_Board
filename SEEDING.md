# Seeding Guide

This project includes a seed script that generates demo data using values from:

- `client/src/assets/assets.js` (`JobCategories`, `JobLocations`, `jobsData`)

## Command

From the repository root, run:

```bash
npm --prefix server run seed:assets -- --reset
```

## What gets seeded

- Companies
- Users
- Admin users
- Jobs (seeded first from `jobsData`, then expanded with additional randomized demo jobs)
- Job Applications

## Notes

- `--reset` clears existing `companies`, `users`, `jobs`, and `jobapplications` data before reseeding.
- If you run without `--reset` and seed data already exists, the script will stop with a safety error.
- Default seeded login password:

```text
SeedPass@123
```

## Demo Logins (after seeding)

- **Job Seeker:** `user1@demo.com` / `SeedPass@123`
- **Recruiter (Slack):** `hr+1@slack.demo` / `SeedPass@123`
- **Recruiter (Amazon):** `hr+2@amazon.demo` / `SeedPass@123`
- **Recruiter (Microsoft):** `hr+3@microsoft.demo` / `SeedPass@123`
- **Super Admin:** `superadmin@demo.com` / `SeedPass@123`
- **Company Admin (Slack):** `admin@slack.demo` / `SeedPass@123`
- **Finance Admin (Slack):** `finance@slack.demo` / `SeedPass@123`
- **Finance Viewer (Slack):** `finance.viewer@slack.demo` / `SeedPass@123`
- **Support Agent (Slack):** `support@slack.demo` / `SeedPass@123`
- **Recruiter User (Slack):** `recruiter@slack.demo` / `SeedPass@123`
- **HR Manager (Slack):** `hr.manager@slack.demo` / `SeedPass@123`
- **Accountant (Slack):** `accountant@slack.demo` / `SeedPass@123`
