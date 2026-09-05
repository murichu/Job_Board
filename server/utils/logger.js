import fs from "fs";
import path from "path";
import util from "util";

const logsDir = path.resolve("logs");
const logFile = path.join(logsDir, "app.log");
const errorLogFile = path.join(logsDir, "error.log");

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const levels = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const serializeArg = (arg) => {
  if (arg instanceof Error) {
    return {
      name: arg.name,
      message: arg.message,
      stack: arg.stack,
    };
  }

  return arg;
};

const buildEntry = (level, args) => {
  const serializedArgs = args.map(serializeArg);
  const firstString = serializedArgs.find((arg) => typeof arg === "string");
  const objects = serializedArgs.filter(
    (arg) => arg && typeof arg === "object" && !Array.isArray(arg)
  );

  return {
    level,
    levelValue: levels[level],
    time: new Date().toISOString(),
    service: "job-portal-api",
    env: process.env.NODE_ENV || "development",
    msg: firstString || util.format(...serializedArgs),
    ...Object.assign({}, ...objects),
  };
};

const writeEntry = (entry) => {
  const line = `${JSON.stringify(entry)}\n`;
  fs.appendFileSync(logFile, line);

  if (entry.level === "error") {
    fs.appendFileSync(errorLogFile, line);
  }

  const consoleMethod = entry.level === "error" ? "error" : entry.level === "warn" ? "warn" : "log";
  console[consoleMethod](entry.msg);
};

const log = (level, ...args) => {
  writeEntry(buildEntry(level, args));
};

export const logger = {
  debug: (...args) => log("debug", ...args),
  info: (...args) => log("info", ...args),
  warn: (...args) => log("warn", ...args),
  error: (...args) => log("error", ...args),
};

export const readRecentLogs = ({ limit = 200, level, search } = {}) => {
  if (!fs.existsSync(logFile)) return [];

  const raw = fs.readFileSync(logFile, "utf8").trim();
  if (!raw) return [];

  return raw
    .split("\n")
    .slice(-Math.max(Number(limit) * 3, Number(limit)))
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return { msg: line, level: "unknown" };
      }
    })
    .filter((entry) => {
      if (level && String(entry.level) !== String(level)) return false;
      if (search && !JSON.stringify(entry).toLowerCase().includes(String(search).toLowerCase())) return false;
      return true;
    })
    .slice(-Number(limit));
};

export default logger;
