/**
 * Auth / tema — reuso shell compartido.
 */

import { ensureAuthAndSyncTopbar } from "../../shared/shell.js";

export async function ensureAuth() {
  return await ensureAuthAndSyncTopbar();
}
