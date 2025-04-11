import {Registration} from "../system.js";
import {registerFetchTool} from "./fetch.js";
export { httpFetch } from "./fetch.js";

export function registerCommonTools(registration: Registration) {
    registerFetchTool(registration)
}
