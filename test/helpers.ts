import { assert, AssertionError } from "chai";
import * as fsExtra from "fs-extra";
import * as path from "path";

import { resetHardhatContext } from "hardhat/plugins-testing";
import { HardhatRuntimeEnvironment } from "hardhat/types";

declare module "mocha" {
  interface Context {
    env: HardhatRuntimeEnvironment;
  }
}

export function assertFileExists(pathToFile: string) {
  assert.isTrue(
    fsExtra.existsSync(pathToFile),
    `Expected ${pathToFile} to exist`
  );
}

export function useFixtureProject(projectName: string) {
  let projectPath: string;
  let prevWorkingDir: string;

  before(() => {
    projectPath = getFixtureProjectPath(projectName);
  });

  before(() => {
    prevWorkingDir = process.cwd();
    process.chdir(projectPath);
  });

  after(() => {
    process.chdir(prevWorkingDir);
  });
}

function getFixtureProjectPath(projectName: string): string {
  const projectPath = path.join(__dirname, "fixture-projects", projectName);

  if (!fsExtra.pathExistsSync(projectPath)) {
    throw new Error(`Fixture project ${projectName} doesn't exist`);
  }

  return fsExtra.realpathSync(projectPath);
}

export function useEnvironment(configPath?: string) {
  beforeEach("Loading hardhat environment", function () {
    if (configPath !== undefined) {
      process.env.HARDHAT_CONFIG = configPath;
    }

    this.env = require("hardhat");
  });

  afterEach("Resetting hardhat context", function () {
    delete process.env.HARDHAT_CONFIG;
    resetHardhatContext();
  });
}
