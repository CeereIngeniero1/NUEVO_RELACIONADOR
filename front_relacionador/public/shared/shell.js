/**
 * Funciones compartidas para topbar: tema y nombre de usuario.
 * Se usa desde Asignar RIPS V3 (script embebido) y Desrelacionar (ES modules).
 */
import { getApiBaseUrl } from "../rda/api/apiBaseUrl.js";

export { getApiBaseUrl };
 
export function initThemeToggle({
  buttonId = "crBtnThemeToggle",
  themeKey = "ceere_theme",
} = {}) {
  const themeToggleBtn = document.getElementById(buttonId);
  if (!themeToggleBtn) return;
 
  const savedTheme = localStorage.getItem(themeKey) || "light";
  if (savedTheme === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
    themeToggleBtn.innerHTML =
      '<i class="fa-solid fa-sun"></i><span> Tema Claro</span>';
  }
 
  themeToggleBtn.addEventListener("click", () => {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    if (isDark) {
      document.documentElement.setAttribute("data-theme", "light");
      localStorage.setItem(themeKey, "light");
      themeToggleBtn.innerHTML =
        '<i class="fa-solid fa-moon"></i><span> Tema Oscuro</span>';
    } else {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem(themeKey, "dark");
      themeToggleBtn.innerHTML =
        '<i class="fa-solid fa-sun"></i><span> Tema Claro</span>';
    }
  });
}
 
/**
 * Sincroniza el nombre del usuario en el topbar consultando /protected.
 * Si falla, usa un fallback (usuario guardado o documento).
 */
export async function syncTopbarUserName({
  elementId = "TopbarUserName",
  redirectOnFail = false,
  fallback = null,
} = {}) {
  const barUser = document.getElementById(elementId);
  if (!barUser) return { ok: false, usedFallback: true };
 
  const token = localStorage.getItem("token");
  const fb =
    fallback ??
    sessionStorage.getItem("usuario") ??
    localStorage.getItem("usuario") ??
    sessionStorage.getItem("documentousuariologeado") ??
    "Usuario";
 
  if (!token) {
    barUser.textContent = fb;
    if (redirectOnFail) window.location.href = "index.html";
    return { ok: false, usedFallback: true };
  }
 
  try {
    const res = await fetch(`${getApiBaseUrl()}/protected`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
    });
    if (res.ok) {
      const body = await res.json().catch(() => ({}));
      const name = body?.user?.username;
      if (name) {
        barUser.textContent = name;
        return { ok: true, usedFallback: false };
      }
    }
  } catch (e) {
    console.error(e);
  }
 
  barUser.textContent = fb;
  if (redirectOnFail) window.location.href = "index.html";
  return { ok: false, usedFallback: true };
}
 
/**
 * Variante "guard" para pantallas que sí deben bloquear si no hay sesión.
 */
export async function ensureAuthAndSyncTopbar(options = {}) {
  const r = await syncTopbarUserName({ ...options, redirectOnFail: true });
  return r.ok;
}
