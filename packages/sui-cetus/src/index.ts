import {Registration} from "@mcp3/common";
import {registerCetusTools} from "./tools/index.js";
import {registerCetusResource} from "./resources/cetus-resource.js";

export function register(registration: Registration) {
  registerCetusTools(registration);
  registerCetusResource(registration);
}
