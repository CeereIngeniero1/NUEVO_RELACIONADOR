/**
 * Navbar: tema claro/oscuro, sesión y cierre.
 */

import { getApiBaseUrl } from "../config.js";

export function initThemeToggle() {
  const themeToggleBtn = document.getElementById("crBtnThemeToggle");
  if (!themeToggleBtn) return;
  const savedTheme = localStorage.getItem("ceere_theme") || "light";
  if (savedTheme === "dark") {
    themeToggleBtn.innerHTML =
      '<i class="fa-solid fa-sun"></i><span> Tema Claro</span>';
  }
  themeToggleBtn.addEventListener("click", () => {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    if (isDark) {
      document.documentElement.setAttribute("data-theme", "light");
      localStorage.setItem("ceere_theme", "light");
      themeToggleBtn.innerHTML =
        '<i class="fa-solid fa-moon"></i><span> Tema Oscuro</span>';
    } else {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("ceere_theme", "dark");
      themeToggleBtn.innerHTML =
        '<i class="fa-solid fa-sun"></i><span> Tema Claro</span>';
    }
  });
}

/**
 * Valida JWT y muestra usuario. Redirige a index.html si falla.
 * @returns {Promise<boolean>}
 */
export async function ensureAuth() {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "index.html";
    return false;
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
      const { user } = await res.json();
      const name =
        user?.username ||
        sessionStorage.getItem("usuario") ||
        localStorage.getItem("usuario");
      const topbar = document.getElementById("TopbarUserName");
      if (topbar && name) {
        topbar.textContent = name;
      }
      return true;
    }
    window.location.href = "index.html";
    return false;
  } catch (e) {
    console.error(e);
    window.location.href = "index.html";
    return false;
  }
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
