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
exports.compile = void 0;
var source_names_1 = require("hardhat/utils/source-names");
var plugins_1 = require("hardhat/plugins");
var path = require("path");
var fs = require("fs-extra");
var glob = require("glob");
var child_process_async_1 = require("child-process-async");
/* Define constants */
var USED_VERSION_FILE = "last-used-version.txt";
var ARTIFACT_FORMAT_VERSION = "hh-huff-artifact-1";
/**
 * Compile the project using Huff.
 * @param config The Huff configuration object.
 * @param paths The path configuration object.
 * @param artifacts The artifacts object.
 */
var compile = function (config, paths, artifacts) { return __awaiter(void 0, void 0, void 0, function () {
    var compiler, files, _i, files_1, file, pathFromCwd, pathFromSources, output, sourceName, artifact;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: 
            // Pull the specified huffc version is specified.
            return [4 /*yield*/, pullNewVersion(config.version, paths)];
            case 1:
                // Pull the specified huffc version is specified.
                _a.sent();
                // Update the last version used.
                saveLastUsedVersion(config.version, paths);
                compiler = require("huffc");
                return [4 /*yield*/, getFiles(paths)];
            case 2:
                files = _a.sent();
                _i = 0, files_1 = files;
                _a.label = 3;
            case 3:
                if (!(_i < files_1.length)) return [3 /*break*/, 8];
                file = files_1[_i];
                pathFromCwd = path.relative(process.cwd(), file);
                pathFromSources = path.relative(paths.sources, file);
                // Log the compilation.
                console.log("Compiling ".concat(pathFromCwd));
                output = compiler["default"]({
                    filePath: pathFromCwd,
                    generateAbi: true
                });
                return [4 /*yield*/, (0, source_names_1.localPathToSourceName)(paths.root, file)];
            case 4:
                sourceName = _a.sent();
                return [4 /*yield*/, generateArtifact(sourceName, output)];
            case 5:
                artifact = _a.sent();
                // Save the artifact.
                return [4 /*yield*/, artifacts.saveArtifactAndDebugFile(artifact)];
            case 6:
                // Save the artifact.
                _a.sent();
                _a.label = 7;
            case 7:
                _i++;
                return [3 /*break*/, 3];
            case 8: return [2 /*return*/];
        }
    });
}); };
exports.compile = compile;
/** Generate a file artifact */
var generateArtifact = function (sourceName, compilation) { return __awaiter(void 0, void 0, void 0, function () {
    var contractName;
    return __generator(this, function (_a) {
        contractName = pathToContractName(sourceName);
        // Return the artifact.
        return [2 /*return*/, {
                _format: ARTIFACT_FORMAT_VERSION,
                contractName: contractName,
                sourceName: sourceName,
                abi: JSON.parse(compilation.abi),
                bytecode: compilation.bytecode,
                deployedBytecode: compilation.runtimeBytecode,
                linkReferences: {},
                deployedLinkReferences: {}
            }];
    });
}); };
/** Pull a new version if needed */
var pullNewVersion = function (version, paths) { return __awaiter(void 0, void 0, void 0, function () {
    var lastVersion, _a, _, installErr;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, getLastUsedVersion(paths, version === "latest" ? true : false)];
            case 1:
                lastVersion = _b.sent();
                // If the last version used is the same as the current version, return.
                if (lastVersion === version)
                    return [2 /*return*/];
                // Tell the user that we are pulling a new Huff version.
                console.log(version === "latest"
                    ? "Pulling latest version of Huff"
                    : "Pulling Huff version ".concat(version));
                return [4 /*yield*/, (0, child_process_async_1.exec)("npm i huffc@".concat(version))];
            case 2:
                _a = _b.sent(), _ = _a._, installErr = _a.installErr;
                // Raise an error if the installation failed.
                if (installErr)
                    throw new plugins_1.NomicLabsHardhatPluginError("hardhat-huff", "Failed to install huffc version ".concat(version));
                return [2 /*return*/];
        }
    });
}); };
/** Get the last Huff verion used */
var getLastUsedVersion = function (paths, latest) { return __awaiter(void 0, void 0, void 0, function () {
    var filePath, version, stdout;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                filePath = path.join(paths.cache, USED_VERSION_FILE);
                return [4 /*yield*/, fs.pathExists(filePath)];
            case 1:
                // If the file doesn't exist, return "undefined".
                if (!(_a.sent())) {
                    return [2 /*return*/, undefined];
                }
                version = fs.readFile(filePath, "utf8");
                if (!latest) return [3 /*break*/, 3];
                return [4 /*yield*/, (0, child_process_async_1.exec)("npm show huffc version")];
            case 2:
                stdout = (_a.sent()).stdout;
                // If the versions are different, return the latest version.
                if (version !== stdout) {
                    return [2 /*return*/, stdout];
                }
                // Return latest, so that the package isn't reinstalled.
                return [2 /*return*/, "latest"];
            case 3: 
            // Return the filedata.
            return [2 /*return*/, version];
        }
    });
}); };
/** Save the last Huff version used */
var saveLastUsedVersion = function (version, paths) { return __awaiter(void 0, void 0, void 0, function () {
    var filePath, stdout;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                filePath = path.join(paths.cache, USED_VERSION_FILE);
                if (!(version === "latest")) return [3 /*break*/, 2];
                return [4 /*yield*/, (0, child_process_async_1.exec)("npm show huffc version")];
            case 1:
                stdout = (_a.sent()).stdout;
                // If the versions are different, return the latest version.
                return [2 /*return*/, fs.writeFile(filePath, stdout, "utf8")];
            case 2: 
            // Write the version to the file.
            return [4 /*yield*/, fs.ensureDir(path.dirname(filePath))];
            case 3:
                // Write the version to the file.
                _a.sent();
                return [2 /*return*/, fs.writeFile(filePath, version, "utf8")];
        }
    });
}); };
/** Get an array of all files */
var getFiles = function (paths) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        // Return an array of all Huff files.
        return [2 /*return*/, glob.sync(path.join(paths.sources, "**", "*.huff"))];
    });
}); };
/** Get the name of a contract given the filename */
var pathToContractName = function (file) {
    var sourceName = path.basename(file);
    return sourceName.substring(0, sourceName.indexOf("."));
};
