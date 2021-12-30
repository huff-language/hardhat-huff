import "hardhat/types/config";
import { HuffConfig } from "./types";

declare module "hardhat/types/config" {
  interface HardhatUserConfig {
    huff?: Partial<HuffConfig>;
  }

  interface HardhatConfig {
    huff: HuffConfig;
  }
}
