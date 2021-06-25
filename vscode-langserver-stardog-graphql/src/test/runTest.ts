import * as path from "path";
import { downloadAndUnzipVSCode, runTests } from "vscode-test";

async function main() {
  try {
    const extensionDevelopmentPath = path.resolve(__dirname, "../../../");
    const extensionTestsPath = path.resolve(__dirname, "./index");
    const vscodeExecutablePath = await downloadAndUnzipVSCode();

    // Run the extension test
    await runTests({
      launchArgs: [
        "--disable-gpu",
        "--disable-extensions",
        "--install-extension GraphQL.vscode-graphql",
        "--force",
      ],
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
