/**
 * Catálogo Campos Historia Clínica (CeereSio) → datos del paciente en pantalla.
 * Referencia: C:\CeereSio\Campos Historia Clínica.txt
 */
(function (global) {
  /** @type {Record<string, { etiqueta: string, origen?: string, claves?: string[] }>} */
  const CATALOGO_CAMPOS_HC = {
    T1: { etiqueta: "Nombre Completo", claves: ["NombreCompletoPaciente"], origen: "formulario" },
    T2: { etiqueta: "No Historia", claves: ["DocumentoPaciente"], origen: "formulario" },
    T3: { etiqueta: "Edad", claves: ["Edad"], origen: "formulario" },
    T4: { etiqueta: "Fecha de Historia", origen: "sistema_fecha" },
    T5: { etiqueta: "Identificación", origen: "tipo_doc_mas_documento" },
    T6: { etiqueta: "Dir Domicilio", claves: ["Direccion"], origen: "formulario" },
    T7: { etiqueta: "Ciudad", claves: ["NombreMunicipioRecidencia"], origen: "formulario" },
    T8: { etiqueta: "Tel Domicilio", claves: ["Tel"], origen: "formulario" },
    T9: { etiqueta: "Fecha de Nacimiento", claves: ["FechaNacimientoBase"], origen: "formulario" },
    T10: { etiqueta: "Sexo", claves: ["Sexo", "SexoPaciente"], origen: "formulario" },
    T11: { etiqueta: "Estado Civil", claves: ["EstadoCivil", "Estado civil"], origen: "formulario" },
    T12: { etiqueta: "Ocupación", claves: ["DescripciónOcupación", "Ocupación"], origen: "formulario" },
    T13: { etiqueta: "Aseguradora", origen: "pendiente_sql" },
    T14: { etiqueta: "Tipo Vinculación", origen: "pendiente_sql" },
    T15: { etiqueta: "Acompañante", origen: "pendiente_sql" },
    T16: { etiqueta: "Parentesco Acompañante", origen: "pendiente_sql" },
    T17: { etiqueta: "Tel Acompañante", origen: "pendiente_sql" },
    T18: { etiqueta: "Responsable", claves: ["NombreResponsable", "Nombre Responsable"], origen: "formulario" },
    T19: { etiqueta: "Parentesco Responsable", claves: ["ParentescoResponsable", "Parentesco"], origen: "formulario" },
    T20: { etiqueta: "Tel Responsable", origen: "pendiente_sql" },
    T21: { etiqueta: "Nombre de Usuario", origen: "session_usuario" },
    T22: { etiqueta: "Hora de Historia", origen: "sistema_hora" },
    T23: { etiqueta: "Lugar Nacimiento Paciente", origen: "pendiente_sql" },
    T24: { etiqueta: "Barrio Paciente", origen: "pendiente_sql" },
    T25: { etiqueta: "Telefono 2 Paciente", origen: "pendiente_sql" },
    T26: { etiqueta: "Celular Paciente", origen: "pendiente_sql" },
    T27: { etiqueta: "Tipo Documento Paciente", claves: ["DescripciTipoDocumento", "TipoDocumentoPaciente"], origen: "formulario" },
    T28: { etiqueta: "Tipo Usuario", origen: "pendiente_sql" },
    T29: { etiqueta: "Registro Medico", origen: "pendiente_sql" },
    RegistroMédico: { etiqueta: "Registro Medico", origen: "pendiente_sql" },
    RegistroMedico: { etiqueta: "Registro Medico", origen: "pendiente_sql" },
    T30: { etiqueta: "Fecha Historia Numerica", origen: "sistema_fecha_num" },
    T31: { etiqueta: "Codigo Diagnostico Rips", origen: "pendiente_sql" },
    T32: { etiqueta: "Descripcion Diagnostico Rips", origen: "pendiente_sql" },
    T33: { etiqueta: "Codigo Diagnostico Rips2", origen: "pendiente_sql" },
    T34: { etiqueta: "Edad Gestacional", origen: "pendiente_sql" },
    T36: { etiqueta: "Correo electrónico", origen: "pendiente_sql" },
    Entidad1: { etiqueta: "Foto del paciente", origen: "pendiente_imagen" },
    Entidad2: { etiqueta: "Firma del paciente", origen: "pendiente_imagen" },
    Entidad3: { etiqueta: "Firma Usuario", origen: "pendiente_imagen" },
  };

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function formatearFechaHistoria(d) {
    const day = pad2(d.getDate());
    const month = pad2(d.getMonth() + 1);
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  function formatearFechaNum(d) {
    return `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}`;
  }

  function formatearHora(d) {
    let h = d.getHours();
    const m = pad2(d.getMinutes());
    const ampm = h >= 12 ? "p.m." : "a.m.";
    h = h % 12;
    if (h === 0) h = 12;
    return `${h}:${m} ${ampm}`;
  }

  function formatearFechaNacimiento(raw) {
    if (!raw) return "";
    const s = String(raw).trim();
    if (s.length >= 10 && s.includes("-")) {
      const [y, mo, d] = s.slice(0, 10).split("-");
      return `${d}/${mo}/${y}`;
    }
    return s.slice(0, 10);
  }

  function valSelect2Text(selector) {
    const el = document.querySelector(selector);
    if (!el) return "";
    const opt = el.options[el.selectedIndex];
    return opt && opt.text && opt.text !== "Sin Seleccionar" ? opt.text.trim() : "";
  }

  function valInput(id) {
    const el = document.getElementById(id);
    return el && el.value != null ? String(el.value).trim() : "";
  }

  function valRow(row, claves) {
    if (!row || !claves) return "";
    for (let i = 0; i < claves.length; i++) {
      const k = claves[i];
      const v = row[k];
      if (v != null && String(v).trim() !== "") return String(v).trim();
    }
    return "";
  }

  /** Construye mapa nombreCampo → valor desde el formulario de datos del paciente. */
  function buildValoresHcDesdePacienteEnPantalla(rowApi) {
    const row = rowApi || {};
    const now = new Date();

    const tipoDoc =
      valSelect2Text("#TipoDocumentoBase") ||
      row.DescripciTipoDocumento ||
      row.TipoDocumentoPaciente ||
      "";
    const documento = valInput("DocumentoPaciente") || row.DocumentoPaciente || "";
    const nombre =
      valInput("NombrePaciente") ||
      row.NombreCompletoPaciente ||
      [row.PrimerNombreBase, row.SegundoNombreBase, row.PrimerApellidoBase, row.SegundoApellidoBase]
        .filter(Boolean)
        .join(" ")
        .trim();

    const usuarioSesion =
      sessionStorage.getItem("nombreusuariologeado") ||
      sessionStorage.getItem("documentousuariologeado") ||
      document.getElementById("TopbarUserName")?.textContent?.replace(/^Hola,\s*/i, "") ||
      "";

    const valores = {
      T1: nombre,
      T2: documento,
      T3: valInput("EdadPaciente") || (row.Edad != null ? String(row.Edad) : ""),
      T4: formatearFechaHistoria(now),
      T5: [tipoDoc, documento].filter(Boolean).join(" ").trim(),
      T6: valInput("DireccionPaciente") || row.Direccion || "",
      T7: valSelect2Text("#SelectNombreMunicipioResidenciaBase") || row.NombreMunicipioRecidencia || "",
      T8: valInput("TelefonoPaciente") || row.Tel || "",
      T9: formatearFechaNacimiento(valInput("FechaNacimientoBase") || row.FechaNacimientoBase),
      T10: valSelect2Text("#SexoPaciente") || row.Sexo || row.SexoPaciente || "",
      T11: valRow(row, ["EstadoCivil", "Estado civil"]),
      T12: valSelect2Text("#OcupacionBase") || row.DescripciónOcupación || row.Ocupación || "",
      T18: valRow(row, ["NombreResponsable", "Nombre Responsable"]),
      T19: valRow(row, ["ParentescoResponsable", "Parentesco"]),
      T21: usuarioSesion,
      T22: formatearHora(now),
      T27: tipoDoc,
      T30: formatearFechaNum(now),
      T36: "",
    };

    return valores;
  }

  function setValorEnElemento(el, valor) {
    if (!el || valor == null) return;
    const v = String(valor);
    const tag = (el.tagName || "").toLowerCase();
    if (tag === "input") {
      el.value = v;
      /* outerHTML/srcdoc no incluye .value; debe ir en el atributo value */
      el.setAttribute("value", v);
      try {
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
      } catch (_) {}
    } else if (tag === "textarea") {
      el.value = v;
      el.textContent = v;
    } else if (tag === "select") {
      el.value = v;
      const opt = [...el.options].find((o) => o.value === v || o.text === v);
      if (opt) el.selectedIndex = opt.index;
    } else if (tag === "p" || tag === "span" || tag === "div" || tag === "font") {
      if (el.children.length === 0) el.textContent = v;
    }
  }

  /** Rellena inputs por name/id dentro de un document (iframe ya cargado). */
  function applyValoresADocumento(doc, valores) {
    if (!doc) return;
    Object.keys(valores || {}).forEach((nombre) => {
      const valor = valores[nombre];
      if (valor == null || valor === "") return;
      const escaped = nombre.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
      doc.querySelectorAll(`[name="${escaped}"]`).forEach((el) => {
        setValorEnElemento(el, valor);
      });
    });
  }

  /** Aplica valores a inputs/select/textarea por name o id en un document HTML. */
  function applyValoresAFormatoHtml(htmlString, valores) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, "text/html");

    Object.keys(valores || {}).forEach((nombre) => {
      const valor = valores[nombre];
      if (valor == null || valor === "") return;
      const escaped = nombre.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
      const idSel =
        typeof CSS !== "undefined" && CSS.escape
          ? `#${CSS.escape(nombre)}`
          : `#${nombre.replace(/[^\w-]/g, "\\$&")}`;
      doc.querySelectorAll(`[name="${escaped}"], ${idSel}`).forEach((el) => {
        setValorEnElemento(el, valor);
      });
    });

    const html = doc.documentElement.outerHTML;
    return html.startsWith("<html") ? html : `<!DOCTYPE html>${html}`;
  }

  function extraerNombresCamposDesdeHtml(htmlString) {
    const found = new Set();
    const re = /\bname\s*=\s*["']([^"']+)["']/gi;
    let m;
    while ((m = re.exec(htmlString)) !== null) {
      const n = m[1].trim();
      if (/^T\d+$/i.test(n) || /^Entidad\d+$/i.test(n) || /^RegistroM[eé]dico$/i.test(n)) {
        found.add(n);
      }
    }
    return [...found].sort();
  }

  function analizarCoberturaFormato(htmlString) {
    const enHtml = extraerNombresCamposDesdeHtml(htmlString);
    const enCatalogo = Object.keys(CATALOGO_CAMPOS_HC);
    const mapeables = [];
    const sinCatalogo = [];
    const catalogoSinHtml = [];

    enHtml.forEach((n) => {
      if (CATALOGO_CAMPOS_HC[n]) mapeables.push(n);
      else sinCatalogo.push(n);
    });
    enCatalogo.forEach((n) => {
      if (!enHtml.includes(n)) catalogoSinHtml.push(n);
    });

    const pendientesSql = enCatalogo.filter((n) => CATALOGO_CAMPOS_HC[n].origen === "pendiente_sql");

    return {
      camposEnHtml: enHtml,
      mapeables,
      enHtmlSinCatalogo: sinCatalogo,
      enCatalogoNoUsadosEnEsteFormato: catalogoSinHtml,
      pendientesConsultaSql: pendientesSql,
    };
  }

  global.CATALOGO_CAMPOS_HC = CATALOGO_CAMPOS_HC;
  global.buildValoresHcDesdePacienteEnPantalla = buildValoresHcDesdePacienteEnPantalla;
  global.applyValoresAFormatoHtml = applyValoresAFormatoHtml;
  global.applyValoresADocumento = applyValoresADocumento;
  global.extraerNombresCamposDesdeHtml = extraerNombresCamposDesdeHtml;
  global.analizarCoberturaFormato = analizarCoberturaFormato;
})(window);
