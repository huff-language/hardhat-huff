import "./type-extensions";
import { TASK_COMPILE_HUFF } from "./task-names";

import { TASK_COMPILE_GET_COMPILATION_TASKS } from "hardhat/builtin-tasks/task-names";
import { extendConfig, subtask } from "hardhat/internal/core/config/config-env";
import { compile } from "./compile";

extendConfig((config) => {
  const defaultConfig = { version: "latest" };
  config.huff = { ...defaultConfig, ...config.huff };
});

subtask(
  TASK_COMPILE_GET_COMPILATION_TASKS,
  async (_, __, runSuper): Promise<string[]> => {
    const otherTasks = await runSuper();
    return [...otherTasks, TASK_COMPILE_HUFF];
  }
);

subtask(TASK_COMPILE_HUFF, async (_, { config, artifacts }) => {
  // This plugin is experimental, so this task isn't split into multiple
  // subtasks yet.
  await compile(config.huff, config.paths, artifacts);
});
