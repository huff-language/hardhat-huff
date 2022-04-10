// We load the plugin here.
import "../../../src/index";
import { HardhatUserConfig } from "hardhat/types";

const config: HardhatUserConfig = {
  huff: { version: "0.0.17" },
};

export default config;
