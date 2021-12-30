import { TASK_COMPILE_GET_COMPILATION_TASKS } from 'hardhat/builtin-tasks/task-names'
import { extendConfig, subtask } from 'hardhat/internal/core/config/config-env'
import { any } from 'hardhat/internal/core/params/argumentTypes'

import { TASK_COMPILE_HUFF } from './task-names'
import './type-extensions'

extendConfig((config: any) => {
  const defaultConfig = { version: 'latest' }
  config.huff = { ...defaultConfig, ...config.huff }
})

subtask(
  TASK_COMPILE_GET_COMPILATION_TASKS,
  async (_, __, runSuper): Promise<string[]> => {
    const otherTasks = await runSuper()
    return [...otherTasks, TASK_COMPILE_HUFF]
  }
)

subtask(TASK_COMPILE_HUFF, async (_, { config, artifacts }) => {
  const configuration: any = config
  const { compileHuff } = await import('./compilation')
  await compileHuff(configuration.huff, config.paths, artifacts)
})
