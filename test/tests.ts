// tslint:disable-next-line no-implicit-dependencies
import { assert } from "chai";
import * as path from "path";
import { TASK_COMPILE } from "hardhat/builtin-tasks/task-names";

import { useFixtureProject, useEnvironment, assertFileExists } from "./helpers";

describe("Integration tests examples", function () {
  describe("Hardhat Runtime Environment extension", function () {
    useFixtureProject("hardhat-project");
    useEnvironment();

    it("Compile Huff Contract and Generate Artifact", async function () {
      await this.env.run(TASK_COMPILE);
      assertFileExists(
        path.join("artifacts", "contracts", "Test.huff", ".json")
      );
    });
  });

  //   describe("HardhatConfig extension", function () {
  //     useEnvironment("hardhat-project");

  //     it("Should add the newPath to the config", function () {
  //       assert.equal(
  //         this.hre.config.paths.newPath,
  //         path.join(process.cwd(), "asd")
  //       );
  //     });
  //   });
  // });

  // describe("Unit tests examples", function () {
  //   describe("ExampleHardhatRuntimeEnvironmentField", function () {
  //     describe("sayHello", function () {
  //       it("Should say hello", function () {
  //         const field = new ExampleHardhatRuntimeEnvironmentField();
  //         assert.equal(field.sayHello(), "hello");
  //       });
  //     });
  //   });
});
