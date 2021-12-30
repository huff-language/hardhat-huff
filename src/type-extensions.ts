import "hardhat/types/config";

import { HuffConfig } from "./types";

declare module "hardhat/types/config" {
  interface HardhatUserConfig {
    vyper?: Partial<HuffConfig>;
  }

  interface HardhatConfig {
    vyper: HuffConfig;
  }
}
