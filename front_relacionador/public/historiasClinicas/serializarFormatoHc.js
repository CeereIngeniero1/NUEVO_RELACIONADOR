/**
 * Serialización legacy CeereSio para [Diagnóstico Específico Evaluación Entidad].
 * Formato por campo: {name}| {valor}|{True|False}|  unidos con ||
 */
(function (global) {
  const PREFIJO_DIAGNOSTICO_GENERAL = "\\Formatos HC\\";

  function valorControl(el) {
    const tag = (el.tagName || "").toLowerCase();
    const type = (el.type || "").toLowerCase();

    if (type === "checkbox") {
      return { valor: el.value != null ? String(el.value) : "on", marcado: !!el.checked };
    }
    if (type === "radio") {
      return { valor: el.value != null ? String(el.value) : "", marcado: !!el.checked };
    }
    if (tag === "select") {
      const opt = el.options[el.selectedIndex];
      const text = opt ? opt.text : "";
      const val = el.value != null ? String(el.value) : "";
      return { valor: val || text, marcado: false };
    }
    return { valor: el.value != null ? String(el.value) : "", marcado: false };
  }

  function debeIncluirControl(el) {
    const type = (el.type || "").toLowerCase();
    if (type === "radio" && !el.checked) return false;
    if (el.disabled) return false;
    return true;
  }

  /**
   * @param {Document} doc
   * @returns {{ serializado: string, cantidadCampos: number }}
   */
  function serializarFormularioHc(doc) {
    if (!doc) return { serializado: "", cantidadCampos: 0 };

    const elementos = doc.querySelectorAll("input[name], select[name], textarea[name]");
    const partes = [];

    elementos.forEach((el) => {
      if (!debeIncluirControl(el)) return;
      const nombre = String(el.getAttribute("name") || "").trim();
      if (!nombre) return;

      const { valor, marcado } = valorControl(el);
      const flag =
        (el.type === "checkbox" || el.type === "radio") && marcado ? "True" : "False";
      partes.push(`${nombre}| ${valor}|${flag}|`);
    });

    return {
      serializado: partes.join("|"),
      cantidadCampos: partes.length,
    };
  }

  function construirDiagnosticoGeneral(nombreArchivo) {
    const nombre = String(nombreArchivo || "").trim();
    if (!nombre) return "";
    return `${PREFIJO_DIAGNOSTICO_GENERAL}${nombre}`;
  }

  function extraerDesdeIframe(iframe) {
    if (!iframe) {
      throw new Error("No hay vista previa del formato.");
    }
    const doc = iframe.contentDocument;
    if (!doc || !doc.body) {
      throw new Error("No se pudo leer el contenido del formato.");
    }
    return serializarFormularioHc(doc);
  }

  /**
   * Parseo inverso (fase cargar HC).
   * @returns {Record<string, { valor: string, marcado: boolean }>}
   */
  function parsearDiagnosticoEspecifico(cadena) {
    const mapa = {};
    const s = String(cadena || "");
    if (!s) return mapa;

    const bloques = s.split("||");
    bloques.forEach((bloque) => {
      const b = bloque.trim();
      if (!b) return;
      const partes = b.split("|");
      if (partes.length < 3) return;
      const nombre = partes[0].trim();
      const valor = partes[1] != null ? String(partes[1]).trim() : "";
      const flag = (partes[2] || "").trim().toLowerCase() === "true";
      if (nombre) mapa[nombre] = { valor, marcado: flag };
    });
    return mapa;
  }

  global.CEERE_HC_PREFIJO_FORMATO = PREFIJO_DIAGNOSTICO_GENERAL;
  global.serializarFormularioHc = serializarFormularioHc;
  global.construirDiagnosticoGeneral = construirDiagnosticoGeneral;
  global.extraerSerializacionDesdeIframe = extraerDesdeIframe;
  global.parsearDiagnosticoEspecifico = parsearDiagnosticoEspecifico;
})(window);
