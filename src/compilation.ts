import { HuffConfig } from './type-extensions'
import { Artifact, Artifacts, ProjectPathsConfig } from 'hardhat/types'
import compile from 'huffc'

import path = require('path')
import fsExtra = require('fs-extra')
const exec = require('child_process').exec

import {
  DockerBadGatewayError,
  DockerHubConnectionError,
  DockerNotRunningError,
  DockerServerError,
  HardhatDocker,
  Image,
  ImageDoesntExistError,
  ProcessResult,
} from '@nomiclabs/hardhat-docker'
import { NomicLabsHardhatPluginError } from 'hardhat/plugins'

/* Set constants */
const HUFF_DOCKER_REPOSITORY = 'jetjadeja/huffc'
const LAST_VERSION_USED_FILENAME = 'last-huff-version-used.txt'
const DOCKER_IMAGES_LAST_UPDATE_CHECK_FILE = 'docker-updates.json'
const CHECK_UPDATES_INTERVAL = 3600000

exec('npm install huffc', (error, stdout, stderr) => {
  console.log('stdout: ' + stdout)
  console.log('stderr: ' + stderr)
  if (error !== null) {
    console.log('exec error: ' + error)
  }
}).stderr.pipe(process.stderr)

/**
 * Compile the project's source code.
 */
export async function compileHuff(
  config: HuffConfig,
  paths: ProjectPathsConfig,
  artifacts: Artifacts
) {
  // Get the version.
  const version = config.version
  const dockerImage = { repository: HUFF_DOCKER_REPOSITORY, tag: version }

  // Ensure that Docker Desktop is installed.
  await validateDockerIsInstalled()

  // Create a new Hardhat Docker instance.
  const docker = await handleCommonErrors(HardhatDocker.create())

  // Pull the Docker image if it doesn't exist.
  await handleCommonErrors(
    pullImageIfNecessary(docker, dockerImage, paths.cache)
  )

  // Get an array of all Huff files.
  const huffFiles = await getHuffFiles(paths)

  // Boolean indicating whether the compilation failed.
  let compilationFailed = false

  // Iterate over all the Huff files.
  for (const file of huffFiles) {
    // Get paths.
    const pathFromCWD = path.relative(process.cwd(), file)
    const pathFromSources = path.relative(paths.sources, file)

    if (await isAlreadyCompiled(file, paths, version, huffFiles)) {
      console.log(pathFromCWD, 'is already compiled')
      continue
    }

    console.log('Compiling', pathFromCWD)

    const processResult = await handleCommonErrors(
      compileWithDocker(file, docker, dockerImage, paths)
    )

    console.log(processResult)
  }
}

/**
 * Check if Docker Desktop has been installed.
 */
async function validateDockerIsInstalled() {
  if (!(await HardhatDocker.isInstalled())) {
    throw new NomicLabsHardhatPluginError(
      'huffc',
      `Docker Desktop is not installed.
       Please install it by following the instructions on https://www.docker.com/get-started`
    )
  }
}

/* Pull docker image (if needed) */
async function pullImageIfNecessary(
  docker: HardhatDocker,
  image: Image,
  cachePath: string
) {
  if (!(await docker.hasPulledImage(image))) {
    console.log(
      `Pulling Docker image ${HardhatDocker.imageToRepoTag(image)}...`
    )

    await docker.pullImage(image)

    console.log(`Image pulled`)
  } else {
    await checkForImageUpdates(docker, image, cachePath)
  }
}

// Check for updates to the Docker image
async function checkForImageUpdates(
  docker: HardhatDocker,
  image: Image,
  cachePath: string
) {
  if (!(await shouldCheckForUpdates(image, cachePath))) {
    return
  }

  if (!(await docker.isImageUpToDate(image))) {
    console.log(
      `Updating Docker image ${HardhatDocker.imageToRepoTag(image)}...`
    )

    await docker.pullImage(image)

    console.log(`Image updated`)
  }

  await saveLastUpdateCheckDate(image, cachePath)
}

/* Identify whether the image should be checked */
async function shouldCheckForUpdates(image: Image, cachePath: string) {
  const lastDate = await getLastUpdateCheckDate(image, cachePath)
  if (lastDate === undefined) {
    return true
  }

  return lastDate + CHECK_UPDATES_INTERVAL < +new Date()
}

/* Identify whether a file has already been compiled */
async function isAlreadyCompiled(
  sourceFile: string,
  paths: ProjectPathsConfig,
  version: string,
  sources: string[]
) {
  const lastVersionUsed = await getLastVersionUsed(paths)
  if (lastVersionUsed !== version) {
    return false
  }

  const contractName = pathToContractName(sourceFile)
  const artifactPath = path.join(paths.artifacts, `${contractName}.json`)
  if (!(await fsExtra.pathExists(artifactPath))) {
    return false
  }

  const artifactCtime = (await fsExtra.stat(artifactPath)).ctimeMs
  const stats = await Promise.all(sources.map((f) => fsExtra.stat(f)))
  const lastSourcesCtime = Math.max(...stats.map((s) => s.ctimeMs))

  return lastSourcesCtime < artifactCtime
}

/* Get the late of the last update time */
async function getLastUpdateCheckDate(
  image: Image,
  cachePath: string
): Promise<number | undefined> {
  const file = path.join(cachePath, DOCKER_IMAGES_LAST_UPDATE_CHECK_FILE)
  if (!(await fsExtra.pathExists(file))) {
    return undefined
  }

  const updates = await fsExtra.readJSON(file)
  return updates[HardhatDocker.imageToRepoTag(image)]
}

/* Compile Huff file using the docker image */
async function compileWithDocker(
  filePath: string,
  docker: HardhatDocker,
  dockerImage: Image,
  paths: ProjectPathsConfig
): Promise<ProcessResult> {
  const pathFromSources = path.relative(paths.sources, filePath)

  console.log(`Compiling ${pathFromSources}...`)
  return docker.runContainer(dockerImage, ['huffc', pathFromSources])
}

/* Save the last Huff verion */
async function saveLastVersionUsed(version: string, paths: ProjectPathsConfig) {
  const filePath = path.join(paths.cache, LAST_VERSION_USED_FILENAME)
  await fsExtra.ensureDir(path.dirname(filePath))
  return fsExtra.writeFile(filePath, version, 'utf8')
}

/* Get the last Huff version used */
async function getLastVersionUsed(paths: ProjectPathsConfig) {
  const filePath = path.join(paths.cache, LAST_VERSION_USED_FILENAME)
  if (!(await fsExtra.pathExists(filePath))) {
    return undefined
  }

  return fsExtra.readFile(filePath, 'utf8')
}

/* Save the last update date */
async function saveLastUpdateCheckDate(image: Image, cachePath: string) {
  let updates: { [repoTag: string]: number }

  const file = path.join(cachePath, DOCKER_IMAGES_LAST_UPDATE_CHECK_FILE)
  if (!(await fsExtra.pathExists(file))) {
    updates = {}
  } else {
    updates = await fsExtra.readJSON(file)
  }

  updates[HardhatDocker.imageToRepoTag(image)] = +new Date()

  await fsExtra.ensureDir(path.dirname(file))
  await fsExtra.writeJSON(file, updates, {
    spaces: 2,
  })
}

/* Get the Huff Files Sources */
async function getHuffFiles(paths: ProjectPathsConfig) {
  const glob = await import('glob')
  const huffFiles = glob.sync(path.join(paths.sources, '**', '*.huff'))

  return huffFiles
}

/* Get the path to a contract */
function pathToContractName(file: string) {
  const sourceName = path.basename(file)
  return sourceName.substring(0, sourceName.indexOf('.'))
}

/**
 * Handle basic errors on promises.
 * @param promise
 * @returns
 */
async function handleCommonErrors<T>(promise: Promise<T>): Promise<T> {
  try {
    return await promise
  } catch (error) {
    if (
      error instanceof DockerNotRunningError ||
      error instanceof DockerBadGatewayError
    ) {
      throw new NomicLabsHardhatPluginError(
        'huffc',
        'Docker Desktop is not running.\nPlease open it and wait until it finishes booting.',
        error
      )
    }

    if (error instanceof DockerHubConnectionError) {
      throw new NomicLabsHardhatPluginError(
        'huffc',
        `Error connecting to Docker Hub.
         Please check your internet connection.`,
        error
      )
    }

    if (error instanceof DockerServerError) {
      console.log(error)
      throw new NomicLabsHardhatPluginError('huffc', 'Docker error', error)
    }

    if (error instanceof ImageDoesntExistError) {
      throw new NomicLabsHardhatPluginError(
        'huffc',
        `Docker image ${HardhatDocker.imageToRepoTag(
          error.image
        )} doesn't exist.
        Make sure you have chosen a valid Huff version.`
      )
    }

    throw error
  }
}
