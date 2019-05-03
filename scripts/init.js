import path from "path";
import fs from "fs-extra";
import os from "os";
import commander from "commander";
import chalk from "chalk";
import inquirer from "inquirer";
import validateProjectName from "validate-npm-package-name";

import packageJson from "../package.json";

const errorLogFilePatterns = [
  "npm-debug.log",
  "yarn-error.log",
  "yarn-debug.log"
];

async function promptForMissingOptions(options) {
  const defaultOpts = {
    ...options,
    useYarn: false,
    useNpm: true
  };

  if (options.skipPrompts) {
    return defaultOpts;
  }

  if (options.useNpm) {
    return {
      ...defaultOpts,
      useNpm: options.useNpm
    };
  }

  if (options.useYarn) {
    return {
      ...defaultOpts,
      useYarn: options.useYarn
    };
  }

  const questions = [];
  if (!options.useNpm && !options.useYarn) {
    questions.push({
      type: "list",
      name: "packageManager",
      message: "Please choose which package manager to use",
      choices: ["npm", "Yarn"],
      default: "npm"
    });
  }

  const answers = await inquirer.prompt(questions);
  return {
    ...options,
    useYarn: answers.packageManager === "Yarn",
    useNpm: answers.packageManager === "npm"
  };
}

function printValidationResults(results) {
  if (typeof results !== "undefined") {
    results.forEach(error => {
      console.error(chalk.red(`  *  ${error}`));
    });
  }
}

function checkAppName(appName) {
  const validationResults = validateProjectName(appName);
  if (!validationResults.validForNewPackages) {
    console.error(
      `Could not create a project called ${chalk.red(
        `"${appName}"`
      )} because of npm naming restrictions:`
    );
    printValidationResults(validationResults.errors);
    printValidationResults(validationResults.warnings);
    process.exit(1);
  }
}

function isSafeToCreateProjectIn(root, name) {
  const validFiles = [
    ".DS_Store",
    "Thumbs.db",
    ".git",
    ".gitignore",
    ".idea",
    "README.md",
    "LICENSE",
    ".hg",
    ".hgignore",
    ".hgcheck",
    ".npmignore",
    "mkdocs.yml",
    "docs",
    ".travis.yml",
    ".gitlab-ci.yml",
    ".gitattributes"
  ];
  console.log();

  const conflicts = fs
    .readdirSync(root)
    .filter(file => !validFiles.includes(file))
    .filter(file => !/\.iml$/.test(file))
    .filter(
      file => !errorLogFilePatterns.some(pattern => file.indexOf(pattern) === 0)
    );

  if (conflicts.length > 0) {
    console.log(
      `The directory ${chalk.green(name)} contains files that could conflict:`
    );
    console.log();
    for (const file of conflicts) {
      console.log(`  ${file}`);
    }
    console.log();
    console.log(
      "Either try using a new directory name, or remove the files listed above."
    );

    return false;
  }

  const currentFiles = fs.readdirSync(path.join(root));
  currentFiles.forEach(file => {
    errorLogFilePatterns.forEach(errorLogFilePattern => {
      if (file.indexOf(errorLogFilePattern) === 0) {
        fs.removeSync(path.join(root, file));
      }
    });
  });
  return true;
}

function createPackageJsonFile(name) {
  const root = path.resolve(name);
  const appName = path.basename(root);

  checkAppName(appName);

  fs.ensureDirSync(name);
  if (!isSafeToCreateProjectIn(root, name)) {
    process.exit(1);
  }

  console.log(`Creating a new Fusion app in ${chalk.green(root)}`);
  console.log();

  const packageJson = {
    name: appName,
    version: "0.1.0",
    private: true
  };
  fs.writeFileSync(
    path.join(root, "package.json"),
    JSON.stringify(packageJson, null, 2) + os.EOL
  );
}

export async function init(args) {
  let projectName;
  const program = new commander.Command(packageJson.name)
    .version(packageJson.version)
    .arguments("<app-name>")
    .usage(`${chalk.green("<app-name>")} [options]`)
    .action(name => {
      projectName = name;
    })
    .option("-p, --app-path <path>")
    .option("-s, --skip-prompts")
    .option("-n, --use-npm")
    .option("-y, --use-yarn")
    .option("-t, --typescript")
    .parse(args);

  let options = await promptForMissingOptions(program);

  createPackageJsonFile(projectName);

  const ownPath = path.dirname(
    require.resolve(path.join(__dirname, "..", "package.json"))
  );
  const appPath = path.resolve(projectName);
  const appPackage = require(path.join(appPath, "package.json"));

  appPackage.dependencies = appPackage.dependencies || {};

  const useTypeScript = options.typescript;
  console.log("useTypescript", useTypeScript);

  appPackage.scripts = {
    start: "fusion-scripts start",
    build: "fusion-scripts build"
  };

  appPackage.eslintConfig = {
    extends: "react-app"
  };

  fs.writeFileSync(
    path.join(appPath, "package.json"),
    JSON.stringify(appPackage, null, 2) + os.EOL
  );

  const readmeExists = fs.existsSync(path.join(appPath, "README.md"));
  if (readmeExists) {
    fs.renameSync(
      path.join(appPath, "README.md"),
      path.join(appPath, "README.old.md")
    );
  }

  const templatePath = path.join(
    ownPath,
    useTypeScript ? "templates/typescript" : "templates/javascript"
  );
  if (fs.existsSync(templatePath)) {
    fs.copySync(templatePath, appPath);
  } else {
    console.error(
      `Could not locate supplied template: ${chalk.green(templatePath)}`
    );
    return;
  }
}
