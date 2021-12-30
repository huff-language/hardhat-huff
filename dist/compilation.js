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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.compileHuff = void 0;
var path = require("path");
var fsExtra = require("fs-extra");
var hardhat_docker_1 = require("@nomiclabs/hardhat-docker");
var plugins_1 = require("hardhat/plugins");
/* Set constants */
var HUFF_DOCKER_REPOSITORY = 'jetjadeja/huffc';
var LAST_VERSION_USED_FILENAME = 'last-huff-version-used.txt';
var DOCKER_IMAGES_LAST_UPDATE_CHECK_FILE = 'docker-updates.json';
var CHECK_UPDATES_INTERVAL = 3600000;
/**
 * Compile the project's source code.
 */
function compileHuff(config, paths, artifacts) {
    return __awaiter(this, void 0, void 0, function () {
        var version, dockerImage, docker, huffFiles, compilationFailed, _i, huffFiles_1, file, pathFromCWD, pathFromSources, processResult;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    version = config.version;
                    dockerImage = { repository: HUFF_DOCKER_REPOSITORY, tag: version };
                    // Ensure that Docker Desktop is installed.
                    return [4 /*yield*/, validateDockerIsInstalled()
                        // Create a new Hardhat Docker instance.
                    ];
                case 1:
                    // Ensure that Docker Desktop is installed.
                    _a.sent();
                    return [4 /*yield*/, handleCommonErrors(hardhat_docker_1.HardhatDocker.create())
                        // Pull the Docker image if it doesn't exist.
                    ];
                case 2:
                    docker = _a.sent();
                    // Pull the Docker image if it doesn't exist.
                    return [4 /*yield*/, handleCommonErrors(pullImageIfNecessary(docker, dockerImage, paths.cache))
                        // Get an array of all Huff files.
                    ];
                case 3:
                    // Pull the Docker image if it doesn't exist.
                    _a.sent();
                    return [4 /*yield*/, getHuffFiles(paths)
                        // Boolean indicating whether the compilation failed.
                    ];
                case 4:
                    huffFiles = _a.sent();
                    compilationFailed = false;
                    _i = 0, huffFiles_1 = huffFiles;
                    _a.label = 5;
                case 5:
                    if (!(_i < huffFiles_1.length)) return [3 /*break*/, 9];
                    file = huffFiles_1[_i];
                    pathFromCWD = path.relative(process.cwd(), file);
                    pathFromSources = path.relative(paths.sources, file);
                    return [4 /*yield*/, isAlreadyCompiled(file, paths, version, huffFiles)];
                case 6:
                    if (_a.sent()) {
                        console.log(pathFromCWD, 'is already compiled');
                        return [3 /*break*/, 8];
                    }
                    console.log('Compiling', pathFromCWD);
                    return [4 /*yield*/, handleCommonErrors(compileWithDocker(file, docker, dockerImage, paths))];
                case 7:
                    processResult = _a.sent();
                    console.log(processResult);
                    _a.label = 8;
                case 8:
                    _i++;
                    return [3 /*break*/, 5];
                case 9: return [2 /*return*/];
            }
        });
    });
}
exports.compileHuff = compileHuff;
/**
 * Check if Docker Desktop has been installed.
 */
function validateDockerIsInstalled() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, hardhat_docker_1.HardhatDocker.isInstalled()];
                case 1:
                    if (!(_a.sent())) {
                        throw new plugins_1.NomicLabsHardhatPluginError('huffc', "Docker Desktop is not installed.\n       Please install it by following the instructions on https://www.docker.com/get-started");
                    }
                    return [2 /*return*/];
            }
        });
    });
}
/* Pull docker image (if needed) */
function pullImageIfNecessary(docker, image, cachePath) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, docker.hasPulledImage(image)];
                case 1:
                    if (!!(_a.sent())) return [3 /*break*/, 3];
                    console.log("Pulling Docker image " + hardhat_docker_1.HardhatDocker.imageToRepoTag(image) + "...");
                    return [4 /*yield*/, docker.pullImage(image)];
                case 2:
                    _a.sent();
                    console.log("Image pulled");
                    return [3 /*break*/, 5];
                case 3: return [4 /*yield*/, checkForImageUpdates(docker, image, cachePath)];
                case 4:
                    _a.sent();
                    _a.label = 5;
                case 5: return [2 /*return*/];
            }
        });
    });
}
// Check for updates to the Docker image
function checkForImageUpdates(docker, image, cachePath) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, shouldCheckForUpdates(image, cachePath)];
                case 1:
                    if (!(_a.sent())) {
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, docker.isImageUpToDate(image)];
                case 2:
                    if (!!(_a.sent())) return [3 /*break*/, 4];
                    console.log("Updating Docker image " + hardhat_docker_1.HardhatDocker.imageToRepoTag(image) + "...");
                    return [4 /*yield*/, docker.pullImage(image)];
                case 3:
                    _a.sent();
                    console.log("Image updated");
                    _a.label = 4;
                case 4: return [4 /*yield*/, saveLastUpdateCheckDate(image, cachePath)];
                case 5:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
/* Identify whether the image should be checked */
function shouldCheckForUpdates(image, cachePath) {
    return __awaiter(this, void 0, void 0, function () {
        var lastDate;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getLastUpdateCheckDate(image, cachePath)];
                case 1:
                    lastDate = _a.sent();
                    if (lastDate === undefined) {
                        return [2 /*return*/, true];
                    }
                    return [2 /*return*/, lastDate + CHECK_UPDATES_INTERVAL < +new Date()];
            }
        });
    });
}
/* Identify whether a file has already been compiled */
function isAlreadyCompiled(sourceFile, paths, version, sources) {
    return __awaiter(this, void 0, void 0, function () {
        var lastVersionUsed, contractName, artifactPath, artifactCtime, stats, lastSourcesCtime;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getLastVersionUsed(paths)];
                case 1:
                    lastVersionUsed = _a.sent();
                    if (lastVersionUsed !== version) {
                        return [2 /*return*/, false];
                    }
                    contractName = pathToContractName(sourceFile);
                    artifactPath = path.join(paths.artifacts, contractName + ".json");
                    return [4 /*yield*/, fsExtra.pathExists(artifactPath)];
                case 2:
                    if (!(_a.sent())) {
                        return [2 /*return*/, false];
                    }
                    return [4 /*yield*/, fsExtra.stat(artifactPath)];
                case 3:
                    artifactCtime = (_a.sent()).ctimeMs;
                    return [4 /*yield*/, Promise.all(sources.map(function (f) { return fsExtra.stat(f); }))];
                case 4:
                    stats = _a.sent();
                    lastSourcesCtime = Math.max.apply(Math, stats.map(function (s) { return s.ctimeMs; }));
                    return [2 /*return*/, lastSourcesCtime < artifactCtime];
            }
        });
    });
}
/* Get the late of the last update time */
function getLastUpdateCheckDate(image, cachePath) {
    return __awaiter(this, void 0, void 0, function () {
        var file, updates;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    file = path.join(cachePath, DOCKER_IMAGES_LAST_UPDATE_CHECK_FILE);
                    return [4 /*yield*/, fsExtra.pathExists(file)];
                case 1:
                    if (!(_a.sent())) {
                        return [2 /*return*/, undefined];
                    }
                    return [4 /*yield*/, fsExtra.readJSON(file)];
                case 2:
                    updates = _a.sent();
                    return [2 /*return*/, updates[hardhat_docker_1.HardhatDocker.imageToRepoTag(image)]];
            }
        });
    });
}
/* Compile Huff file using the docker image */
function compileWithDocker(filePath, docker, dockerImage, paths) {
    return __awaiter(this, void 0, void 0, function () {
        var pathFromSources;
        return __generator(this, function (_a) {
            pathFromSources = path.relative(paths.sources, filePath);
            console.log("Compiling " + pathFromSources + "...");
            return [2 /*return*/, docker.runContainer(dockerImage, ['huffc', pathFromSources])];
        });
    });
}
/* Save the last Huff verion */
function saveLastVersionUsed(version, paths) {
    return __awaiter(this, void 0, void 0, function () {
        var filePath;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    filePath = path.join(paths.cache, LAST_VERSION_USED_FILENAME);
                    return [4 /*yield*/, fsExtra.ensureDir(path.dirname(filePath))];
                case 1:
                    _a.sent();
                    return [2 /*return*/, fsExtra.writeFile(filePath, version, 'utf8')];
            }
        });
    });
}
/* Get the last Huff version used */
function getLastVersionUsed(paths) {
    return __awaiter(this, void 0, void 0, function () {
        var filePath;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    filePath = path.join(paths.cache, LAST_VERSION_USED_FILENAME);
                    return [4 /*yield*/, fsExtra.pathExists(filePath)];
                case 1:
                    if (!(_a.sent())) {
                        return [2 /*return*/, undefined];
                    }
                    return [2 /*return*/, fsExtra.readFile(filePath, 'utf8')];
            }
        });
    });
}
/* Save the last update date */
function saveLastUpdateCheckDate(image, cachePath) {
    return __awaiter(this, void 0, void 0, function () {
        var updates, file;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    file = path.join(cachePath, DOCKER_IMAGES_LAST_UPDATE_CHECK_FILE);
                    return [4 /*yield*/, fsExtra.pathExists(file)];
                case 1:
                    if (!!(_a.sent())) return [3 /*break*/, 2];
                    updates = {};
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, fsExtra.readJSON(file)];
                case 3:
                    updates = _a.sent();
                    _a.label = 4;
                case 4:
                    updates[hardhat_docker_1.HardhatDocker.imageToRepoTag(image)] = +new Date();
                    return [4 /*yield*/, fsExtra.ensureDir(path.dirname(file))];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, fsExtra.writeJSON(file, updates, {
                            spaces: 2
                        })];
                case 6:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
/* Get the Huff Files Sources */
function getHuffFiles(paths) {
    return __awaiter(this, void 0, void 0, function () {
        var glob, huffFiles;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, Promise.resolve().then(function () { return require('glob'); })];
                case 1:
                    glob = _a.sent();
                    huffFiles = glob.sync(path.join(paths.sources, '**', '*.huff'));
                    return [2 /*return*/, huffFiles];
            }
        });
    });
}
/* Get the path to a contract */
function pathToContractName(file) {
    var sourceName = path.basename(file);
    return sourceName.substring(0, sourceName.indexOf('.'));
}
/**
 * Handle basic errors on promises.
 * @param promise
 * @returns
 */
function handleCommonErrors(promise) {
    return __awaiter(this, void 0, void 0, function () {
        var error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, promise];
                case 1: return [2 /*return*/, _a.sent()];
                case 2:
                    error_1 = _a.sent();
                    if (error_1 instanceof hardhat_docker_1.DockerNotRunningError ||
                        error_1 instanceof hardhat_docker_1.DockerBadGatewayError) {
                        throw new plugins_1.NomicLabsHardhatPluginError('huffc', 'Docker Desktop is not running.\nPlease open it and wait until it finishes booting.', error_1);
                    }
                    if (error_1 instanceof hardhat_docker_1.DockerHubConnectionError) {
                        throw new plugins_1.NomicLabsHardhatPluginError('huffc', "Error connecting to Docker Hub.\n         Please check your internet connection.", error_1);
                    }
                    if (error_1 instanceof hardhat_docker_1.DockerServerError) {
                        console.log(error_1);
                        throw new plugins_1.NomicLabsHardhatPluginError('huffc', 'Docker error', error_1);
                    }
                    if (error_1 instanceof hardhat_docker_1.ImageDoesntExistError) {
                        throw new plugins_1.NomicLabsHardhatPluginError('huffc', "Docker image " + hardhat_docker_1.HardhatDocker.imageToRepoTag(error_1.image) + " doesn't exist.\n        Make sure you have chosen a valid Huff version.");
                    }
                    throw error_1;
                case 3: return [2 /*return*/];
            }
        });
    });
}
