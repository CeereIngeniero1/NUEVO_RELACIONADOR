/**
 * Navbar: tema claro/oscuro, sesión y cierre.
 */

import { initThemeToggle as sharedInitThemeToggle, ensureAuthAndSyncTopbar } from "../../shared/shell.js";

export function initThemeToggle() {
  sharedInitThemeToggle();
}

/**
 * Valida JWT y muestra usuario. Redirige a index.html si falla.
 * @returns {Promise<boolean>}
 */
export async function ensureAuth() {
  return await ensureAuthAndSyncTopbar();
}

export function initLogout() {
  const closeBtn = document.getElementById("closeSesion");
  if (!closeBtn) return;
  closeBtn.addEventListener("click", () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("empresaTrabajarExecuted");
    sessionStorage.removeItem("empresaTrabajarNombre");
    localStorage.removeItem("NombreEquipoServidor");
    window.location.href = "index.html";
  });
}
