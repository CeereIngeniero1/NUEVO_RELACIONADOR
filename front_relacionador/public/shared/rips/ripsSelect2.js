/**
 * Select2 con búsqueda AJAX: TOP inicial + resultados al escribir (código o texto).
 */
(function (global) {
  const MIN_BUSQUEDA = 2;

  const SELECTS_CUPS_AC = ["#SelectConsultaRIPSAC1", "#SelectConsultaRIPSAC2"];
  const SELECTS_CIE_AC = ["#SelectDiagnosticoRIPSAC1", "#SelectDiagnosticoRIPSAC2"];
  const SELECTS_CUPS_AP = ["#SelectProcedimientoRIPSAP1", "#SelectProcedimientoRIPSAP2"];
  const SELECTS_CIE_AP = ["#SelectDiagnosticoRIPSAP1", "#SelectDiagnosticoRIPSAP2"];

  const SELECTS_MODAL_CUPS_AC = [
    "#SelectPorDefectoConsultaRIPS1AC",
    "#SelectPorDefectoConsultaRIPS2AC",
  ];
  const SELECTS_MODAL_CIE_AC = [
    "#SelectPorDefectoDiagnosticoRIPSAC1",
    "#SelectPorDefectoDiagnosticoRIPSAC2",
  ];
  const SELECTS_MODAL_CUPS_AP = [
    "#SelectPorDefectoProcedimientoRIPSAP1",
    "#SelectPorDefectoProcedimientoRIPSAP2",
  ];
  const SELECTS_MODAL_CIE_AP = [
    "#SelectPorDefectoDiagnosticoRIPSAP1",
    "#SelectPorDefectoDiagnosticoRIPSAP2",
  ];

  function disponible() {
    return typeof $ !== "undefined" && $.fn && $.fn.select2;
  }

  function apiBase() {
    return typeof getApiBaseUrl === "function" ? getApiBaseUrl() : "";
  }

  function mapCieRows(data) {
    return (data || []).map((r) => ({
      id: r.Codigo,
      text: `${r.Codigo} - ${r.Nombre}`,
    }));
  }

  function mapCupsRows(data) {
    return (data || []).map((r) => ({
      id: r.Codigo,
      text: `${r.Codigo} - ${r.Nombre}`,
    }));
  }

  function opcionesUi(extra) {
    return {
      width: "100%",
      dropdownAutoWidth: true,
      allowClear: true,
      placeholder: "Busque por código o texto (mín. 2 letras)",
      minimumInputLength: 0,
      language: {
        inputTooShort: () =>
          `Escriba al menos ${MIN_BUSQUEDA} caracteres para buscar (o elija del top inicial)`,
        noResults: () => "Sin resultados",
        searching: () => "Buscando…",
      },
      templateSelection: function (data) {
        if (!data || !data.text) return data.text;
        const t = String(data.text);
        const trunc = t.length > 55 ? t.substring(0, 55) + "…" : t;
        return $("<span>").text(trunc);
      },
      ...extra,
    };
  }

  function destruir(selector) {
    if (!disponible()) return;
    const $el = $(selector);
    if ($el.length && $el.hasClass("select2-hidden-accessible")) {
      $el.select2("destroy");
    }
  }

  function vaciarSelect(selector) {
    const node = document.querySelector(selector);
    if (!node) return;
    destruir(selector);
    node.innerHTML = "";
    const def = document.createElement("option");
    def.value = "";
    def.textContent = "";
    node.appendChild(def);
  }

  function inicializarAjaxCie(selector, extra) {
    if (!disponible()) return;
    const $el = $(selector);
    if (!$el.length) return;
    destruir(selector);

    $el.select2({
      ...opcionesUi(extra),
      ajax: {
        delay: 300,
        cache: true,
        transport: function (params, success, failure) {
          const term = String(params.data?.term || "").trim();
          const url =
            term.length >= MIN_BUSQUEDA
              ? `${apiBase()}/apiV3/Cie/${encodeURIComponent(term)}`
              : `${apiBase()}/apiV3/Cie/inicio`;
          fetch(url)
            .then((r) => {
              if (!r.ok) throw new Error(`CIE ${r.status}`);
              return r.json();
            })
            .then((data) => success({ results: mapCieRows(data) }))
            .catch(failure);
        },
        data: (params) => ({ term: params.term }),
      },
    });
  }

  function inicializarAjaxCups(selector, tipoCups, extra) {
    if (!disponible()) return;
    const $el = $(selector);
    if (!$el.length) return;
    destruir(selector);

    $el.select2({
      ...opcionesUi(extra),
      ajax: {
        delay: 300,
        cache: true,
        transport: function (params, success, failure) {
          const term = String(params.data?.term || "").trim();
          const url =
            term.length >= MIN_BUSQUEDA
              ? `${apiBase()}/apiV3/Cups/${encodeURIComponent(tipoCups)}/buscar/${encodeURIComponent(term)}`
              : `${apiBase()}/apiV3/Cups/${encodeURIComponent(tipoCups)}/inicio`;
          fetch(url)
            .then((r) => {
              if (!r.ok) throw new Error(`Cups ${r.status}`);
              return r.json();
            })
            .then((data) => success({ results: mapCupsRows(data) }))
            .catch(failure);
        },
        data: (params) => ({ term: params.term }),
      },
    });
  }

  function enCardRips(selector) {
    const node = document.querySelector(selector);
    return node && node.closest("#cardRipsHc");
  }

  function inicializarFormularioHc(tipo) {
    if (tipo === "AC") {
      SELECTS_CUPS_AC.forEach((sel) => {
        if (enCardRips(sel)) {
          vaciarSelect(sel);
          inicializarAjaxCups(sel, "AC");
        }
      });
      SELECTS_CIE_AC.forEach((sel) => {
        if (enCardRips(sel)) {
          vaciarSelect(sel);
          inicializarAjaxCie(sel);
        }
      });
    } else if (tipo === "AP") {
      SELECTS_CUPS_AP.forEach((sel) => {
        if (enCardRips(sel)) {
          vaciarSelect(sel);
          inicializarAjaxCups(sel, "AP");
        }
      });
      SELECTS_CIE_AP.forEach((sel) => {
        if (enCardRips(sel)) {
          vaciarSelect(sel);
          inicializarAjaxCie(sel);
        }
      });
    }
  }

  function inicializarModalPorDefecto() {
    const modalExtra = { dropdownParent: $("#ModalRIPSPorDefecto") };
    SELECTS_MODAL_CUPS_AC.forEach((sel) => inicializarAjaxCups(sel, "AC", modalExtra));
    SELECTS_MODAL_CIE_AC.forEach((sel) => inicializarAjaxCie(sel, modalExtra));
    SELECTS_MODAL_CUPS_AP.forEach((sel) => inicializarAjaxCups(sel, "AP", modalExtra));
    SELECTS_MODAL_CIE_AP.forEach((sel) => inicializarAjaxCie(sel, modalExtra));
  }

  /** Asigna valor en Select2 AJAX (crea opción si no existe). */
  function asignarValor(selector, codigo, textoCompleto) {
    if (!codigo) return;
    const $el = $(selector);
    if (!$el.length) return;
    const text = textoCompleto || codigo;
    if ($el.find(`option[value="${codigo}"]`).length === 0) {
      const opt = new Option(text, codigo, true, true);
      $el.append(opt);
    } else {
      $el.val(codigo);
    }
    $el.trigger("change");
  }

  function sincronizarValor(selectId) {
    asignarValor(`#${selectId}`, document.getElementById(selectId)?.value);
  }

  global.RipsSelect2 = {
    destruir,
    inicializarFormularioHc,
    inicializarModalPorDefecto,
    asignarValor,
    sincronizarValor,
  };
})(window);
