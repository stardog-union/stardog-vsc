"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const path = require("path");
const Mocha = require("mocha");
function run() {
    const mocha = new Mocha({
        // @ts-ignore: Mocha types are missing `color`
        color: true,
        ui: "bdd",
        timeout: 5000,
    });
    return new Promise((c, e) => {
        mocha.addFile(path.resolve(__dirname, "extension.test.js"));
        try {
            mocha.run((failures) => {
                if (failures > 0) {
                    e(new Error(`${failures} tests failed.`));
                }
                else {
                    c();
                }
            });
        }
        catch (err) {
            e(err);
        }
    });
}
exports.run = run;
//# sourceMappingURL=index.js.map