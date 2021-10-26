/* eslint-disable no-console */
import * as fs from "fs-extra";
import * as os from "os";
import * as crypto from "crypto";
import * as path from "path";
import * as execa from "execa";

test("bundling lambda-project to a zip", async () => {
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
    bundleOutput
  );

  // THEN
  const zipPath = path.join(bundleOutput, "bundle.zip");

  expect(fs.existsSync(zipPath)).toEqual(true);
  expect(fs.statSync(zipPath).isFile()).toEqual(true);
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
