import * as path from "path";
import * as Mocha from "mocha";

export function run(): Promise<void> {
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
        } else {
          c();
        }
      });
    } catch (err) {
      e(err);
    }
  });
}
