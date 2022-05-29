/* eslint-disable no-console */
import * as fs from "fs-extra";
import * as os from "os";
import * as crypto from "crypto";
import * as path from "path";
import * as execa from "execa";
import StreamZip from "node-stream-zip";

test("bundling lambda-project to a zip", async () => {
  const workDir = getTempDirName();
  const bundleOutput = getTempDirName();
  const defaultArchiveName = "bundle.zip";

  // Stage the test project far from the yarn.build project
  fs.copySync(__dirname, workDir, {
    recursive: true,
    errorOnExist: true,
  });

  // WHEN
  yarnCmd(workDir, "workspace", "lambda", "build");
  yarnCmd(
    workDir,
    "workspace",
    "lambda",
    "bundle",
    "--output-directory",
    bundleOutput
  );

  // THEN
  const zipPath = path.join(bundleOutput, defaultArchiveName);

  expect(fs.existsSync(zipPath)).toEqual(true);
  expect(fs.statSync(zipPath).isFile()).toEqual(true);

  await validateZip({ bundleOutput, archiveName: defaultArchiveName });
});

test("bundling lambda-project to a zip with custom name", async () => {
  const workDir = getTempDirName();
  const bundleOutput = getTempDirName();
  const archiveName = "function.zip";

  // Stage the test project far from the yarn.build project
  fs.copySync(__dirname, workDir, {
    recursive: true,
    errorOnExist: true,
  });

  // WHEN
  yarnCmd(workDir, "workspace", "lambda", "build");
  yarnCmd(
    workDir,
    "workspace",
    "lambda",
    "bundle",
    "--output-directory",
    bundleOutput,
    "--archive-name",
    archiveName
  );

  // THEN
  const zipPath = path.join(bundleOutput, archiveName);

  expect(fs.existsSync(zipPath)).toEqual(true);
  expect(fs.statSync(zipPath).isFile()).toEqual(true);

  await validateZip({ bundleOutput, archiveName });
});

test("run lambda-project after bundling without compression", async () => {
  const workDir = getTempDirName();
  const bundleOutput = getTempDirName();

  // Stage the test project far from the yarn.build project
  fs.copySync(__dirname, workDir, {
    recursive: true,
    errorOnExist: true,
  });

  // WHEN
  yarnCmd(workDir, "workspace", "lambda", "build");
  yarnCmd(
    workDir,
    "workspace",
    "lambda",
    "bundle",
    "--output-directory",
    bundleOutput,
    "--no-compress"
  );

  // THEN
  expect(fs.existsSync(path.join(bundleOutput, "package.json"))).toEqual(true);
  expect(fs.existsSync(path.join(bundleOutput, ".pnp.cjs"))).toEqual(true);
  expect(fs.existsSync(path.join(bundleOutput, "entrypoint.js"))).toEqual(true);
  expect(fs.existsSync(path.join(bundleOutput, ".yarn"))).toEqual(true);
  expect(fs.readdirSync(path.join(bundleOutput, ".yarn", "cache"))).toEqual([
    ".gitignore",
    expect.stringMatching(/^uglify-js.*\.zip$/),
    // Notably, the cache excludes the dev deps.
  ]);

  // Now run the bundled code to see that it works!
  // lambda-project's dependencies look like this: lambda -> lib -> uglify-js
  // Calling the lambda's api handler tests the uglify-js transitive dependency
  const execResult = execa.sync("node", ["entrypoint.js"], {
    cwd: bundleOutput,
  });

  const responsePayload = JSON.parse(execResult.stdout);

  expect(responsePayload).toEqual({
    statusCode: 200,
    // The following shows that the lambda package called lib, and lib used
    // uglify-js.
    body: '"function foobar(){} // MUGLIFIED"',
  });
});

// Utils -----------------------------------------------------------------------

function yarnCmd(workDir: string, ...args: string[]) {
  execa.sync("yarn", args, {
    cwd: workDir,
    stdout: process.stdout,
    stderr: process.stderr,
  });
}

function getTempDirName() {
  return path.join(
    os.tmpdir(),
    "integ" + crypto.randomBytes(10).toString("hex")
  );
}

const validateZip = async (opts: {
  bundleOutput: string;
  archiveName: string;
}) => {
  const zip = new StreamZip.async({
    file: path.join(opts.bundleOutput, opts.archiveName),
    skipEntryNameValidation: true,
  });

  const entries = await zip.entries();

  for (const entry of Object.values(entries)) {
    // validate entrypoint js
    if (
      entry.isFile &&
      entry.name.endsWith("entrypoint.js") &&
      entry.name != "entrypoint.js"
    ) {
      await zip.close();

      throw new Error("missing entrypoint.js or it's not in the root folder");
    }
  }
  await zip.close();
};
