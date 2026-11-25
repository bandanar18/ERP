import { apiFetch } from "./api-client";
import type { QcProcess } from "../types";

export const processApi = {
  list: () => apiFetch<QcProcess[]>("/processes"),
  mine: () => apiFetch<QcProcess[]>("/processes/mine"),
};
