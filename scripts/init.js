import program from "commander";
import packageJson from "../package.json";

import create from "./create";
import start from "./start";

export async function init(args) {
  program
    .version(packageJson.version, "-v, --version")
    .command("create <app-name>")
    .alias("c")
    .description("Create a new Fusion app")
    .option(
      "-p, --app-path <path>",
      "Path to where application will be installed"
    )
    .option("-y, --use-yarn", "Use Yarn as package manager", true)
    .option("-n, --use-npm", "Use npm as package manager", false)
    .option(
      "--typescript",
      "Intialize new application as TypeScript application",
      false
    )
    .action((appName, options) => create(appName, options));

  program
    .version(packageJson.version, "-v, --version")
    .command("start")
    .alias("s")
    .description(
      "Start a newly created Fusion app in a development environment"
    )
    .action(() => start());

  program.parse(args);
}
