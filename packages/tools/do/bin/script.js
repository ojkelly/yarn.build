#!/usr/bin/env node
/* eslint-disable no-console */
// Adapted from https://github.com/facebook/create-react-app/blob/main/packages/react-scripts/bin/react-scripts.js


"use strict";

process.on("unhandledRejection", (err) => {
  console.log(`tools/do error: `);
  throw err;
});

const { exec } = require("child_process");
const spawn = require("cross-spawn");
const path = require("path");
const fs = require("fs");

const help = require("../scripts/util/help");

const args = process.argv.slice(2);

const scriptIndex = args.findIndex(
  (x) => x === "build" || x === "eject" || x === "start" || x === "test"
);
const script = scriptIndex === -1 ? args[0] : args[scriptIndex];
const nodeArgs = scriptIndex > 0 ? args.slice(0, scriptIndex) : [];

let scripts = [];
let bash = [];

const directoryPath = path.join(__dirname, "../scripts/");

const messages = {
  failed:
    "The script failed because the process exited too early. \nSomeone might have called `kill` or `killall`, or the system could be shutting down.",
  killed:
    "The script failed because the process exited too early. " +
    "This probably means the system ran out of memory or someone called " +
    "`kill -9` on the process.",
};

fs.readdir(directoryPath, function (err, files) {
  if (err) {
    return console.log("Unable to scan tools/do scripts directory: " + err);
  }

  files.forEach(function (file) {
    const p = path.parse(file);

    if (p.ext == ".js") {
      scripts.push(p.name);
    }
    if (p.ext == ".sh") {
      bash.push(p.name);
    }
  });

  if (scripts.includes(script)) {
    const result = spawn.sync(
      process.execPath,
      nodeArgs
        .concat(require.resolve(directoryPath + script))
        .concat(args.slice(scriptIndex + 1)),

      { stdio: "inherit" }
    );

    if (result.signal) {
      if (result.signal === "SIGKILL") {
        console.log(killed);
      } else if (result.signal === "SIGTERM") {
        console.log(messages.failed);
      }
      process.exit(1);
    }
    process.exit(result.status);
  } else if (bash.includes(script)) {
    exec(
      `/usr/bin/env bash ${directoryPath}${script}.sh ${args.slice(
        scriptIndex + 2
      )}`,
      function (err, stdout, stderr) {
        if (typeof stdout != `undefined` && stdout) {
            console.log(stdout);
        }
        if (typeof stderr != `undefined` && stderr) {
            console.log(stderr);
        }
        if (typeof err != `undefined` && err) {
          console.log(err.message);
          if (!!err.code) {
            process.exit(err.code);

            return;
          }
          process.exit(1);
        }
      }
    );
  } else {
    console.log('Unknown script "' + script + '".');
    console.log("Available scripts are:", ...scripts);
    console.log(help.message);
  }
});
