/**
 * Sidebar lateral compartido (dashboard) + colapso / móvil.
 * Uso:
 *   import { mountAppSidebar } from "./shared/appSidebar.js";
 *   mountAppSidebar({ active: "asignar" });
 *
 * Desde /visor/:
 *   mountAppSidebar({ active: "visor", basePath: "../" });
 */
import { initThemeToggle, syncTopbarUserName } from "./shell.js";

const STORAGE_COLLAPSED = "ceere_sidebar_collapsed";

const CORE_LINKS = [
  { id: "inicio", href: "RIPS.html", icon: "ri-home-4-line", label: "Inicio" },
  { id: "asignar", href: "Asignar_RIPS V3.html", icon: "ri-file-list-3-line", label: "Asignar RIPS & RDA" },
  { id: "historias", href: "HistoriasClinicas.html", icon: "ri-health-book-line", label: "Historias Clínicas" },
  { id: "envio", href: "EnvioRdaPendientes.html", icon: "ri-send-plane-line", label: "Envío RDA pendientes" },
  { id: "visor", href: "visor/visor.html", icon: "ri-eye-line", label: "Visor IHCE (RDA)" },
  { id: "desrelacionar", href: "DesrelacionarV2.html", icon: "ri-link-unlink", label: "Desrelacionar" },
  { id: "enviar-fevrips", href: "EnviarFevRips.html", icon: "ri-send-plane-2-line", label: "Enviar MinSalud FEV" },
];

const RIPS_TOOLS = [
  {
    id: "maestro",
    type: "button",
    buttonId: "BotonMaestro",
    modalTarget: "#ModalParaMaestro",
    icon: "ri-database-2-line",
    label: "Maestro",
  },
  {
    id: "descargar-rips-group",
    type: "group",
    label: "Descargar RIPS",
    icon: "ri-download-2-line",
    children: [
      {
        id: "rips-todo",
        type: "button",
        buttonId: "descargarRIPSTodo",
        modalTarget: "#ModalDescargarRipsTodo",
        icon: "ri-folder-download-line",
        label: "Descargar RIPS",
      },
      {
        id: "proceso-individual",
        type: "subgroup",
        label: "Proceso individual",
        children: [
          {
            id: "json",
            type: "button",
            buttonId: "descargarRIPS",
            modalTarget: "#staticBackdrop",
            icon: "ri-file-download-line",
            label: "Descargar RIPS JSON",
          },
          {
            id: "xmls",
            type: "button",
            buttonId: "XMLS",
            modalTarget: "#ModalEmpresasResolucionVigente",
            icon: "ri-file-code-line",
            label: "XMLS",
          },
        ],
      },
    ],
  },
  {
    id: "generador",
    type: "link",
    href: "./GENERADOR_ARCHIVOS_RIPS_PART/index.php",
    linkId: "generadorRIPS",
    icon: "ri-bar-chart-box-line",
    label: "Generador informes RIPS",
  },
];

function joinPath(basePath, href) {
  if (!href) return href;
  if (/^(https?:|mailto:|tel:|#)/i.test(href)) return href;
  if (href.startsWith("./") || href.startsWith("../")) return href;
  return `${basePath}${href}`;
}

function detectActiveFromLocation() {
  const path = (window.location.pathname || "").replace(/\\/g, "/").toLowerCase();
  if (path.includes("asignar_rips")) return "asignar";
  if (path.includes("historiasclinicas")) return "historias";
  if (path.includes("enviordapendientes") || path.includes("corregir_rda")) return "envio";
  if (path.includes("/visor/") || path.includes("visor.html")) return "visor";
  if (path.includes("desrelacionar")) return "desrelacionar";
  if (path.includes("enviarfevrips")) return "enviar-fevrips";
  if (path.includes("rips.html") || path.endsWith("/rips") || path.endsWith("/public/") || path.endsWith("/public")) {
    return "inicio";
  }
  return "inicio";
}

function ensureRemixIcons() {
  if (document.querySelector('link[href*="remixicon"]')) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "https://cdn.jsdelivr.net/npm/remixicon@3.2.0/fonts/remixicon.css";
  document.head.appendChild(link);
}

function navItemHtml(item, { active, basePath }) {
  const isActive = item.id === active;
  const cls = `cr-nav-btn${isActive ? " cr-nav-btn-active" : ""}`;
  const title = item.label;
  if (item.type === "button") {
    const attrs = [
      `type="button"`,
      `id="${item.buttonId}"`,
      `class="${cls}"`,
      `title="${title}"`,
    ];
    if (item.modalTarget) {
      attrs.push(`data-bs-toggle="modal"`);
      attrs.push(`data-bs-target="${item.modalTarget}"`);
    }
    return `<button ${attrs.join(" ")}><i class="${item.icon}" aria-hidden="true"></i><span>${item.label}</span></button>`;
  }
  const href = joinPath(basePath, item.href);
  const idAttr = item.linkId ? ` id="${item.linkId}"` : "";
  if (isActive) {
    return `<span class="${cls}" title="${title}" aria-current="page"><i class="${item.icon}" aria-hidden="true"></i><span>${item.label}</span></span>`;
  }
  return `<a href="${href}"${idAttr} class="${cls}" title="${title}"><i class="${item.icon}" aria-hidden="true"></i><span>${item.label}</span></a>`;
}

function navGroupHtml(item, { active, basePath }) {
  const childrenHtml = (item.children || [])
    .map((child) => {
      if (child.type === "subgroup") {
        const subItems = (child.children || [])
          .map((leaf) => navItemHtml(leaf, { active, basePath }))
          .join("");
        return `
          <div class="cr-nav-subgroup">
            <div class="cr-nav-subgroup-label"><span>${child.label}</span></div>
            <div class="cr-nav-sub">${subItems}</div>
          </div>`;
      }
      return navItemHtml(child, { active, basePath });
    })
    .join("");

  return `
    <div class="cr-nav-group" data-group-id="${item.id}">
      <button type="button" class="cr-nav-btn cr-nav-group-toggle" aria-expanded="false" title="${item.label}">
        <i class="${item.icon}" aria-hidden="true"></i>
        <span>${item.label}</span>
        <i class="ri-arrow-down-s-line cr-nav-group-chevron" aria-hidden="true"></i>
      </button>
      <div class="cr-nav-group-panel" hidden>
        ${childrenHtml}
      </div>
    </div>`;
}

function toolsItemHtml(item, ctx) {
  if (item.type === "group") return navGroupHtml(item, ctx);
  return navItemHtml(item, ctx);
}

function buildSidebarHtml({ active, basePath, includeRipsTools }) {
  const tools = includeRipsTools
    ? `<div class="cr-sidebar-section-label"><span>Herramientas</span></div>${RIPS_TOOLS.map((it) => toolsItemHtml(it, { active, basePath })).join("")}`
    : "";

  const links = CORE_LINKS.map((it) => navItemHtml(it, { active, basePath })).join("");

  return `
    <button type="button" class="cr-sidebar-toggle" id="crSidebarToggle" aria-label="Abrir menú" aria-expanded="false" aria-controls="crSidebar">
      <i class="ri-menu-line" aria-hidden="true"></i>
    </button>
    <div class="cr-sidebar-backdrop" id="crSidebarBackdrop" hidden></div>
    <aside class="cr-sidebar" id="crSidebar" aria-label="Menú principal">
      <div class="cr-sidebar-brand">
        <img src="${joinPath(basePath, "images/Ceere_logo.png")}" alt="" class="cr-navbar-logo cr-navbar-logo-full" aria-hidden="true">
        <img src="${joinPath(basePath, "images/CeereIconCollapsed.png")}?v=3" alt="" class="cr-navbar-logo cr-navbar-logo-collapsed" aria-hidden="true">
        <div class="cr-sidebar-brand-text">
          <span class="cr-sidebar-app">Relacionador RIPS</span>
          <h2 id="nombreUsuarioLink"><span id="TopbarUserName">Usuario</span></h2>
        </div>
        <button type="button" class="cr-sidebar-close" id="crSidebarClose" aria-label="Cerrar menú">
          <i class="ri-close-line" aria-hidden="true"></i>
        </button>
      </div>
      <nav class="cr-nav-actions">
        <div class="cr-sidebar-section-label"><span>Módulos</span></div>
        ${links}
        ${tools}
      </nav>
      <div class="cr-sidebar-footer">
        <button type="button" class="cr-nav-btn" id="crSidebarCollapse" title="Comprimir menú">
          <i class="ri-menu-fold-line" aria-hidden="true"></i><span>Comprimir menú</span>
        </button>
        <button type="button" class="cr-nav-btn" id="crBtnThemeToggle" title="Cambiar tema">
          <i class="ri-moon-line" aria-hidden="true"></i><span>Tema Oscuro</span>
        </button>
        <button type="button" class="cr-nav-btn cr-nav-btn-close" id="closeSesion" title="Cerrar sesión">
          <i class="ri-logout-box-r-line" aria-hidden="true"></i><span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  `.trim();
}

function setCollapsed(collapsed) {
  document.body.classList.toggle("cr-sidebar-collapsed", !!collapsed);
  localStorage.setItem(STORAGE_COLLAPSED, collapsed ? "1" : "0");
  const btn = document.getElementById("crSidebarCollapse");
  if (!btn) return;
  btn.innerHTML = collapsed
    ? '<i class="ri-menu-unfold-line" aria-hidden="true"></i><span>Expandir menú</span>'
    : '<i class="ri-menu-fold-line" aria-hidden="true"></i><span>Comprimir menú</span>';
  btn.title = collapsed ? "Expandir menú" : "Comprimir menú";
  btn.setAttribute("aria-pressed", collapsed ? "true" : "false");
}

function wireMobileSidebar() {
  const sidebarToggle = document.getElementById("crSidebarToggle");
  const sidebarClose = document.getElementById("crSidebarClose");
  const sidebarBackdrop = document.getElementById("crSidebarBackdrop");
  const sidebar = document.getElementById("crSidebar");

  const openSidebar = () => {
    document.body.classList.add("cr-sidebar-open");
    if (sidebarToggle) sidebarToggle.setAttribute("aria-expanded", "true");
    if (sidebarBackdrop) sidebarBackdrop.hidden = false;
  };
  const closeSidebar = () => {
    document.body.classList.remove("cr-sidebar-open");
    if (sidebarToggle) sidebarToggle.setAttribute("aria-expanded", "false");
    if (sidebarBackdrop) sidebarBackdrop.hidden = true;
  };

  if (sidebarToggle) sidebarToggle.addEventListener("click", openSidebar);
  if (sidebarClose) sidebarClose.addEventListener("click", closeSidebar);
  if (sidebarBackdrop) sidebarBackdrop.addEventListener("click", closeSidebar);

  if (sidebar) {
    sidebar.querySelectorAll(".cr-nav-btn").forEach((el) => {
      el.addEventListener("click", () => {
        if (el.classList.contains("cr-nav-group-toggle")) return;
        if (window.matchMedia("(max-width: 992px)").matches) closeSidebar();
      });
    });
  }

  window.addEventListener("resize", () => {
    if (window.matchMedia("(min-width: 993px)").matches) closeSidebar();
  });
}

function wireCollapse() {
  const btn = document.getElementById("crSidebarCollapse");
  if (!btn) return;
  btn.addEventListener("click", () => {
    const next = !document.body.classList.contains("cr-sidebar-collapsed");
    setCollapsed(next);
  });
}

function wireNavGroups() {
  document.querySelectorAll(".cr-nav-group").forEach((group) => {
    const toggle = group.querySelector(".cr-nav-group-toggle");
    const panel = group.querySelector(".cr-nav-group-panel");
    if (!toggle || !panel) return;
    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") === "true";
      const next = !open;
      toggle.setAttribute("aria-expanded", next ? "true" : "false");
      panel.hidden = !next;
      group.classList.toggle("cr-nav-group-open", next);
      if (next && document.body.classList.contains("cr-sidebar-collapsed")) {
        setCollapsed(false);
      }
    });
  });
}

function wireLogout(basePath = "") {
  const closeBtn = document.getElementById("closeSesion");
  if (!closeBtn || closeBtn.dataset.boundLogout === "1") return;
  closeBtn.dataset.boundLogout = "1";
  closeBtn.addEventListener("click", () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("empresaTrabajarExecuted");
    sessionStorage.removeItem("empresaTrabajarNombre");
    localStorage.removeItem("NombreEquipoServidor");
    window.location.href = joinPath(basePath, "index.html");
  });
}

function patchThemeToggleForRemix() {
  const btn = document.getElementById("crBtnThemeToggle");
  if (!btn) return;
  const apply = (isDark) => {
    btn.innerHTML = isDark
      ? '<i class="ri-sun-line" aria-hidden="true"></i><span>Tema Claro</span>'
      : '<i class="ri-moon-line" aria-hidden="true"></i><span>Tema Oscuro</span>';
  };
  apply(document.documentElement.getAttribute("data-theme") === "dark");
  // Reaplicar íconos Remix tras el initThemeToggle (usa FontAwesome por defecto)
  const observer = new MutationObserver(() => {
    const html = btn.innerHTML || "";
    if (html.includes("fa-sun") || html.includes("fa-moon")) {
      apply(document.documentElement.getAttribute("data-theme") === "dark");
    }
  });
  observer.observe(btn, { childList: true, subtree: true, characterData: true });
  btn.addEventListener("click", () => {
    setTimeout(() => apply(document.documentElement.getAttribute("data-theme") === "dark"), 0);
  });
}

/**
 * @param {{ active?: string, basePath?: string, includeRipsTools?: boolean, skipIfEmbed?: boolean }} [options]
 */
export function mountAppSidebar(options = {}) {
  const {
    active = detectActiveFromLocation(),
    basePath = "",
    includeRipsTools = active === "inicio",
    skipIfEmbed = true,
  } = options;

  if (skipIfEmbed && document.documentElement.classList.contains("visor-embed-mode")) {
    return { mounted: false, reason: "embed" };
  }
  if (document.getElementById("crSidebar")) {
    document.body.classList.add("cr-has-sidebar");
    return { mounted: false, reason: "already" };
  }

  ensureRemixIcons();

  const topbar = document.getElementById("crTopbar");
  if (topbar) topbar.setAttribute("hidden", "hidden");

  // Evitar IDs duplicados de botones RIPS (Maestro/XMLS/etc.) si ya existían en markup viejo
  if (includeRipsTools) {
    ["BotonMaestro", "descargarRIPS", "descargarRIPSTodo", "XMLS", "generadorRIPS", "crBtnThemeToggle", "closeSesion", "TopbarUserName", "nombreUsuarioLink"].forEach((id) => {
      document.querySelectorAll(`#${id}`).forEach((el) => {
        if (!el.closest?.("#crSidebar")) el.removeAttribute("id");
      });
    });
  } else {
    ["crBtnThemeToggle", "closeSesion", "TopbarUserName", "nombreUsuarioLink"].forEach((id) => {
      document.querySelectorAll(`#${id}`).forEach((el) => {
        if (!el.closest?.("#crSidebar")) el.removeAttribute("id");
      });
    });
  }

  const wrap = document.createElement("div");
  wrap.innerHTML = buildSidebarHtml({ active, basePath, includeRipsTools });
  while (wrap.firstChild) {
    document.body.insertBefore(wrap.firstChild, document.body.firstChild);
  }

  document.body.classList.add("cr-has-sidebar", "app-layout");

  const collapsed = localStorage.getItem(STORAGE_COLLAPSED) === "1";
  setCollapsed(collapsed);
  wireMobileSidebar();
  wireCollapse();
  wireNavGroups();
  wireLogout(basePath);

  initThemeToggle({ buttonId: "crBtnThemeToggle" });
  patchThemeToggleForRemix();
  syncTopbarUserName({ elementId: "TopbarUserName" });

  // Alias: si hay saludo viejo "Hola, X" en otro script, sincronizar nombreUsuarioLink contenedor
  const userSpan = document.getElementById("TopbarUserName");
  const nameHost = document.getElementById("nombreUsuarioLink");
  if (userSpan && nameHost && !nameHost.contains(userSpan)) {
    nameHost.textContent = "";
    nameHost.appendChild(userSpan);
  }

  return { mounted: true, active };
}

export default mountAppSidebar;
