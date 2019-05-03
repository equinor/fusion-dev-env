import path from "path";
import fs from "fs-extra";
import os from "os";
import commander from "commander";
import chalk from "chalk";
import inquirer from "inquirer";
import validateProjectName from "validate-npm-package-name";
import Listr from "listr";
import execa from "execa";
import { install } from "pkg-install";

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

function getDependencies(useTypeScript) {
  let allDependecies = ["react", "react-dom"];

  if (useTypeScript) {
    allDependecies.push(
      "@types/node",
      "@types/react",
      "@types/react-dom",
      "typescript"
    );
  }

  return allDependecies;
}

function createPackageJsonFile(projectName, appPath) {
  checkAppName(projectName);

  fs.ensureDirSync(projectName);
  if (!isSafeToCreateProjectIn(appPath, projectName)) {
    process.exit(1);
  }

  console.log(`Creating a new Fusion app in ${chalk.green(appPath)}`);
  console.log();

  const packageJson = {
    name: projectName,
    version: "0.1.0",
    private: true
  };
  fs.writeFileSync(
    path.join(appPath, "package.json"),
    JSON.stringify(packageJson, null, 2) + os.EOL
  );
}

function copyScriptToPackageJson(appPath) {
  const appPackage = require(path.join(appPath, "package.json"));
  appPackage.dependencies = appPackage.dependencies || {};

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
}

function backupOldReadme(appPath) {
  const readmeExists = fs.existsSync(path.join(appPath, "README.md"));
  if (readmeExists) {
    fs.renameSync(
      path.join(appPath, "README.md"),
      path.join(appPath, "README.old.md")
    );
  }
}

function copyTemplateFiles(appPath, useTypeScript) {
  const ownPath = path.dirname(
    require.resolve(path.join(__dirname, "..", "package.json"))
  );
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

  const options = await promptForMissingOptions(program);
  const appPath = path.resolve(projectName);
  const dependencies = getDependencies(options.typescript);
  console.log("dependencies", dependencies);
  console.log("dep2", { ...dependencies });

  const tasks = new Listr([
    {
      title: "Creating package.json file",
      task: ctx => {
        createPackageJsonFile(projectName, appPath);
      }
    },
    {
      title: "Copying scripts to package.json",
      task: () => copyScriptToPackageJson(appPath)
    },
    {
      title: "Backing up existing README file",
      task: () => backupOldReadme(appPath)
    },
    {
      title: "Copying template files",
      task: () => copyTemplateFiles(appPath, options.typescript)
    },
    {
      title: "Install package dependencies with Yarn",
      enabled: ctx => ctx.yarn === true,
      task: () =>
        install(dependencies, {
          cwd: appPath,
          prefer: "yarn"
        })
    },
    {
      title: "Install package dependencies with npm",
      enabled: ctx => ctx.yarn === false,
      task: () =>
        projectInstall({
          cwd: appPath,
          prefer: "npm"
        })
    }
  ]);

  await tasks
    .run({
      yarn: options.useYarn
    })
    .then(ctx => {
      console.log("ctx", ctx);
    });

  console.log();
  console.log("%s Project ready", chalk.green.bold("DONE"));
  console.log();

  return true;
}
