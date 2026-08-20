"use strict";

const fs = require("node:fs");
const path = require("node:path");
const util = require("node:util");

const logFile = process.env.LEAPS_STARTUP_LOG;

function log(line) {
  if (!logFile) return;
  try {
    fs.appendFileSync(logFile, `${line}\n`);
  } catch {
    /* ignore log write failures */
  }
}

function format(value) {
  if (value instanceof Error) return value.stack || value.message;
  return typeof value === "string" ? value : util.inspect(value, { depth: 4 });
}

process.on("uncaughtException", (err) => {
  log(`uncaughtException ${format(err)}`);
  console.error(err);
  process.exit(1);
});
process.on("unhandledRejection", (err) => {
  log(`unhandledRejection ${format(err)}`);
  console.error(err);
  process.exit(1);
});

const origError = console.error;
console.error = (...args) => {
  log(args.map(format).join(" "));
  origError.apply(console, args);
};

log(`cwd=${process.cwd()}`);
log(`execPath=${process.execPath}`);
log(`NODE_PATH=${process.env.NODE_PATH || ""}`);
require(path.join(__dirname, "server.js"));
