"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const cp = require("child_process");
const path = require("path");
const vscode_test_1 = require("vscode-test");
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const extensionDevelopmentPath = path.resolve(__dirname, "../../../");
            const extensionTestsPath = path.resolve(__dirname, "./index");
            const vscodeExecutablePath = yield vscode_test_1.downloadAndUnzipVSCode();
            const cliPath = vscode_test_1.resolveCliPathFromVSCodeExecutablePath(vscodeExecutablePath);
            // Use cp.spawn / cp.exec for custom setup
            cp.spawnSync(cliPath, ["--disable-gpu", "--disable-extensions"], {
                encoding: "utf-8",
                stdio: "inherit",
            });
            // Run the extension test
            yield vscode_test_1.runTests({
                // Use the specified `code` executable
                vscodeExecutablePath,
                // @ts-ignore: vscode-test types aren't right
                extensionDevelopmentPath,
                extensionTestsPath,
            });
        }
        catch (err) {
            console.error("Failed to run tests");
            process.exit(1);
        }
    });
}
main();
//# sourceMappingURL=runTest.js.map