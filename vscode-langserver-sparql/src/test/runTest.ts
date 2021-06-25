import * as cp from "child_process";
import * as path from "path";
import {
  downloadAndUnzipVSCode,
  runTests,
  resolveCliPathFromVSCodeExecutablePath,
} from "vscode-test";

async function main() {
  try {
    const extensionDevelopmentPath = path.resolve(__dirname, "../../../");
    const extensionTestsPath = path.resolve(__dirname, "./index");
    const vscodeExecutablePath = await downloadAndUnzipVSCode();
    const cliPath = resolveCliPathFromVSCodeExecutablePath(vscodeExecutablePath);

    // Use cp.spawn / cp.exec for custom setup
    cp.spawnSync(cliPath, ["--disable-gpu", "--disable-extensions"], {
      encoding: "utf-8",
      stdio: "inherit",
    });

    // Run the extension test
    await runTests({
      // Use the specified `code` executable
      vscodeExecutablePath,
      // @ts-ignore: vscode-test types aren't right
      extensionDevelopmentPath,
      extensionTestsPath,
    });
  } catch (err) {
    console.error("Failed to run tests");
    process.exit(1);
  }
}

main();
