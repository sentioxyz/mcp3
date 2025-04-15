import {Registration} from "@mcp3/common";
import {registerNaviTools} from "./tools/index.js";
import {registerNaviResource} from "./resources/navi-resource.js";

export function register(registration: Registration) {
  registerNaviTools(registration);
  registerNaviResource(registration)
}
