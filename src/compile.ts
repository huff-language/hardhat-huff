import { HuffConfig } from "./types";
import { Artifact, Artifacts, ProjectPathsConfig } from "hardhat/types";
import { localPathToSourceName } from "hardhat/utils/source-names";
import {
  HardhatPluginError,
  NomicLabsHardhatPluginError,
} from "hardhat/plugins";

import path = require("path");
import fs = require("fs-extra");
import glob = require("glob");
import { exec } from "child-process-async";

/* Define constants */
const USED_VERSION_FILE = "last-used-version.txt";
const ARTIFACT_FORMAT_VERSION = "hh-huff-artifact-1";

/**
 * Compile the project using Huff.
 * @param config The Huff configuration object.
 * @param paths The path configuration object.
 * @param artifacts The artifacts object.
 */
export const compile = async (
  config: HuffConfig,
  paths: ProjectPathsConfig,
  artifacts: Artifacts
) => {
  // Pull the specified huffc version is specified.
  await pullNewVersion(config.version, paths);

  // Update the last version used.
  saveLastUsedVersion(config.version, paths);

  // Import the huff compiler.
  const compiler = require("huffc");

  // Get an array of all files to compile.
  const files = await getFiles(paths);

  // Iterate over all paths and compile them.
  for (const file of files) {
    // Get relative paths of the file.
    const pathFromCwd = path.relative(process.cwd(), file);
    const pathFromSources = path.relative(paths.sources, file);

    // Log the compilation.
    console.log(`Compiling ${pathFromCwd}`);

    // Compile the file.
    const output = compiler.default({
      filePath: pathFromCwd,
      generateAbi: true,
    });

    // Get the artifact of the compiled file.
    const sourceName = await localPathToSourceName(paths.root, file);
    const artifact = await generateArtifact(sourceName, output);

    // Save the artifact.
    await artifacts.saveArtifactAndDebugFile(artifact);
  }
};

/** Generate a file artifact */
const generateArtifact = async (
  sourceName: string,
  compilation: {
    bytecode: string;
    runtimeBytecode: string;
    abi: string;
  }
): Promise<Artifact> => {
  // Get the name of the contract.
  const contractName = pathToContractName(sourceName);

  // Return the artifact.
  return {
    _format: ARTIFACT_FORMAT_VERSION,
    contractName,
    sourceName,
    abi: JSON.parse(compilation.abi),
    bytecode: compilation.bytecode,
    deployedBytecode: compilation.runtimeBytecode,
    linkReferences: {},
    deployedLinkReferences: {},
  };
};

/** Pull a new version if needed */
const pullNewVersion = async (version: string, paths: ProjectPathsConfig) => {
  // Get the last version used.
  const lastVersion = await getLastUsedVersion(
    paths,
    version === "latest" ? true : false
  );

  // If the last version used is the same as the current version, return.
  if (lastVersion === version) return;

  // Tell the user that we are pulling a new Huff version.
  console.log(
    version === "latest"
      ? "Pulling latest version of Huff"
      : `Pulling Huff version ${version}`
  );

  // Pull the new version.
  const { _, installErr } = await exec(`npm i huffc@${version}`);

  // Raise an error if the installation failed.
  if (installErr)
    throw new NomicLabsHardhatPluginError(
      "hardhat-huff",
      `Failed to install huffc version ${version}`
    );
};

/** Get the last Huff verion used */
const getLastUsedVersion = async (
  paths: ProjectPathsConfig,
  latest: boolean
): Promise<string> => {
  // Get the path of the file that stores the last used version.
  const filePath = path.join(paths.cache, USED_VERSION_FILE);

  // If the file doesn't exist, return "undefined".
  if (!(await fs.pathExists(filePath))) {
    return undefined;
  }

  // Read the version number.
  const version = fs.readFile(filePath, "utf8");

  // If the version is "latest," return the latest version.
  if (latest) {
    // Pull the most recent Huff version
    const { stdout } = await exec("npm show huffc version");

    // If the versions are different, return the latest version.
    if (version !== stdout) {
      return stdout;
    }

    // Return latest, so that the package isn't reinstalled.
    return "latest";
  }

  // Return the filedata.
  return version;
};

/** Save the last Huff version used */
const saveLastUsedVersion = async (
  version: string,
  paths: ProjectPathsConfig
) => {
  // Get the path of the file that stores the last used version.
  const filePath = path.join(paths.cache, USED_VERSION_FILE);

  // If the version === "latest," get the latest version on npm and write to that.
  if (version === "latest") {
    // Pull the most recent Huff version
    const { stdout } = await exec("npm show huffc version");

    // If the versions are different, return the latest version.
    return fs.writeFile(filePath, stdout, "utf8");
  }

  // Write the version to the file.
  await fs.ensureDir(path.dirname(filePath));
  return fs.writeFile(filePath, version, "utf8");
};

/** Get an array of all files */
const getFiles = async (paths: ProjectPathsConfig) => {
  // Return an array of all Huff files.
  return glob.sync(path.join(paths.sources, "**", "*.huff"));
};

/** Get the name of a contract given the filename */
const pathToContractName = (file: string): string => {
  const sourceName = path.basename(file);
  return sourceName.substring(0, sourceName.indexOf("."));
};
