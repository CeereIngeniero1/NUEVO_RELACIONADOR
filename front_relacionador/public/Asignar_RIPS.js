// const servidor = "asdfasf";
const servidor = localStorage.getItem("NombreEquipoServidor");

function VerificarLogin() {
  const TokenLogin = localStorage.getItem("token");
  const contenido = document.getElementById("Contenido"); // Contenedor principal de la página

  if (!TokenLogin) {
    console.warn("Token no encontrado, redirigiendo al inicio de sesión...");

    // Ocultar el contenido de la página
    if (contenido) {
      contenido.style.display = "none";
    } else {
      document.body.classList.add("hidden"); // Fallback si no hay un contenedor específico
    }

    Swal.fire({
      allowOutsideClick: false,
      allowEscapeKey: false,
      icon: "warning",
      // text: 'Primero debes iniciar sesión para acceder a esta página',
      html: `
                <h4 style="color: #FFFFFF">Primero debes iniciar sesión para acceder a esta página</h4>
            `,
      showConfirmButton: false, // Deshabilitar botón para forzar la espera
    });

    setTimeout(() => {
      window.location.href = "index.html"; // Redirigir después del tiempo
    }, 5000);
  }
}

// Llamar a la función al cargar la página
VerificarLogin();

const BotonConsultar = document.getElementById("BotonConsultar");
const ModalConsultar = document.getElementById("ModalConsultar");

async function Esperar() {
  await new Promise((resolve) => setTimeout(resolve, 3000));
}
async function MostrarMensajeDeCarga(MensajeDetalle) {
  Swal.fire({
    html: `
                       <style>
            @media (max-width: 480px) {
                .swal2-container {
                    width: 100%;
                }
                .swal2-content {
                    overflow-x: hidden;
                }
            }
            :root {
                /*--main-color: #ecf0f1;*/
                /*
                   Para Sweetalert Claro                 
                    --main-color: #ffffff;
                    --point-color: #555;
                */

                /* Para Sweetalert Oscuro */
                --point-color: #ffffff;
                --size: 5px;
              }
              
              .loader {
                background-color: var(--main-color);
                overflow: hidden;
                /*width: 100%;*/
                /*height: 100%;*/
                width: 100%;
                height: 100%;
                /*position: fixed;*/
                position: relative;
                top: 0; left: 0;
                display: flex;
                align-items: center;
                align-content: center; 
                justify-content: center;  
                z-index: 100000;
              }
              
              .loader__element {
                border-radius: 100%;
                border: var(--size) solid var(--point-color);
                margin: calc(var(--size)*2);
              }
              
              .loader__element:nth-child(1) {
                animation: preloader .6s ease-in-out alternate infinite;
              }
              .loader__element:nth-child(2) {
                animation: preloader .6s ease-in-out alternate .2s infinite;
              }
              
              .loader__element:nth-child(3) {
                animation: preloader .6s ease-in-out alternate .4s infinite;
              }
              
              @keyframes preloader {
                100% { transform: scale(2); }
              }
            </style>

            <body> 
            
                <div style="margin: 0 auto;">
                    <h5 style="color: #ffffff">${MensajeDetalle}</h5>

                    <div class="loader">         
                        <span class="loader__element"></span>
                        <span class="loader__element"></span>
                        <span class="loader__element"></span>                    
                    </div>
                </div>


            </body>
        `,
    showConfirmButton: false,
    showCloseButton: false,
    showDenyButton: false,
    showCancelButton: false,
    allowOutsideClick: false,
    allowEscapeKey: false,
    // showLoaderOnConfirm: true,
    // timer: 3000
  });
}

// var myModal = new bootstrap.Modal(document.getElementById('exampleModal'));
function Consultar() {
  const myModal = new bootstrap.Modal(document.getElementById("exampleModal"), {
    backdrop: "static", // Evita el cierre al hacer clic fuera del modal
    keyboard: false, // Impide el cierre con la tecla Escape
  });
  myModal.show();
}

BotonConsultar.addEventListener("click", function (e) {
  Consultar();
});

async function Cargar() {
  // Recuperar la variable
  const documentoUsuarioLogeado = sessionStorage.getItem(
    "documentousuariologeado"
  );

  let FechaInicioConsulta = document.getElementById(
    "FechaInicioConsulta"
  ).value;
  let FechaFinConsulta = document.getElementById("FechaFinConsulta").value;

  let CamposSinLlenar = [];

  if (FechaInicioConsulta === "") CamposSinLlenar.push("Fecha inicio");
  if (FechaFinConsulta === "") CamposSinLlenar.push("Fecha fin");

  if (CamposSinLlenar.length > 0) {
    Swal.fire({
      allowOutsideClick: false,
      allowEscapeKey: false,
      icon: "info",
      text: "",
      html: `
                <h4 style="color: #ffffff"><b> Los siguientes campos son obligatorios: </b></h4>
                <br>
                <ul style="text-align: left;">
                ${CamposSinLlenar.map(
                  (campo) => `<li style="color: #ffffff"> ${campo}</li>`
                ).join("")}
                </ul>
            `,
    });

    return;
  }

  if (FechaInicioConsulta > FechaFinConsulta) {
    Swal.fire({
      allowOutsideClick: false,
      allowEscapeKey: false,
      icon: "info",
      text: "",
      html: `
                <h4 style="color: #ffffff"><b>La fecha de inicio debe ser menor o igual a la fecha de fin.</b></h4>
            `,
    });

    return;
  }

  try {
    await MostrarMensajeDeCarga("CARGANDO PACIENTES");
    await Esperar();
    const PacienteConHCSinRIPS = await fetch(
      `http://${servidor}:3000/api/UsuariosHC/${documentoUsuarioLogeado}/${FechaInicioConsulta}/${FechaFinConsulta}`
    );
    if (!PacienteConHCSinRIPS.ok) {
      throw new Error(
        `Error al obtener los datos de Pacientes con HC sin RIPS: ${PacienteConHCSinRIPS.statusText}`
      );
    }
    const PacientesConHCSinRIPS = await PacienteConHCSinRIPS.json();

    Swal.fire({
      allowOutsideClick: false,
      allowEscapeKey: false,
      icon: "success",
      html: `
                <h4 style="color: #ffffff"> <b>Pacientes cargados correctamente</b> </h4>
            `,
    }).then(function (response) {
      // Cerrar el modal
      const BotonCerarModal = document.getElementById("BotonCerarModal");
      BotonCerarModal.click();

      if (response.isConfirmed) {
        const SelectPacientesConHCSinRIPS = document.getElementById("listaHC");
        SelectPacientesConHCSinRIPS.innerHTML = "";

        // Agrega una opción por defecto
        const defaultOption = document.createElement("option");
        defaultOption.textContent = "Seleccione un paciente";
        defaultOption.value = "";
        SelectPacientesConHCSinRIPS.appendChild(defaultOption);

        // Ordenar el array por el nombre completo del paciente
        PacientesConHCSinRIPS.sort((a, b) => {
          if (a.NombreCompletoPaciente < b.NombreCompletoPaciente) return -1;
          if (a.NombreCompletoPaciente > b.NombreCompletoPaciente) return 1;
          return 0;
        });

        for (let i = 0; i < PacientesConHCSinRIPS.length; i += 1) {
          const option = document.createElement("option");
          option.value = PacientesConHCSinRIPS[i].DocumentoPaciente;
          option.textContent = PacientesConHCSinRIPS[i].NombreCompletoPaciente;
          SelectPacientesConHCSinRIPS.appendChild(option);
        }
      }
    });
  } catch (error) {
    console.error(error);
  }
}

const BotonCargarPacientesConHCSinRIPS = document.getElementById(
  "CargarPacientesConHCSinRIPS"
);

BotonCargarPacientesConHCSinRIPS.addEventListener("click", async () => {
  await Cargar();
});

async function LlenarSelectDeHistoriasClinicas() {
  // Funcionalidad para el llenado del select de las historias/evoluciones sin RIPS
  const RangoInicio = document.getElementById("FechaInicioConsulta").value;
  const RangoFin = document.getElementById("FechaFinConsulta").value;
  const documentoUsuarioLogeado = sessionStorage.getItem(
    "documentousuariologeado"
  );
  const documentopaciente = document.getElementById("listaHC").value;
  const SelectHistoriasSinRIPS = document.getElementById("HistoriasSinRIPS");

  const HCsinRIPS = await fetch(
    `http://${servidor}:3000/api/DatosdeHC/${documentopaciente}/${documentoUsuarioLogeado}/${RangoInicio}/${RangoFin}`
  );
  if (!HCsinRIPS.ok) {
    throw new Error(
      `Error al obtener las historias/evoluciones sin RIPS: ${HCsinRIPS.statusText}`
    );
  }
  const HistoriasEvolucionesSinRIPS = await HCsinRIPS.json();
  //   console.log('Historias/Evoluciones sin RIPS: ', HistoriasEvolucionesSinRIPS);

  //   console.log('Rango: ' + RangoInicio + ' ' + RangoFin)

  SelectHistoriasSinRIPS.innerHTML = "";
  // Opción por defecto
  const defaultOption = document.createElement("option");
  defaultOption.textContent = "Seleccione una historia/evolución";
  defaultOption.value = "";
  SelectHistoriasSinRIPS.appendChild(defaultOption);
  for (let i = 0; i < HistoriasEvolucionesSinRIPS.length; i += 1) {
    const option = document.createElement("option");
    option.value = HistoriasEvolucionesSinRIPS[i].IdEvaluaciónEntidad;
    option.textContent =
      HistoriasEvolucionesSinRIPS[i].DescripcionTipodeEvaluación +
      " [ " +
      HistoriasEvolucionesSinRIPS[i].Formato_Diagnostico +
      " - " +
      HistoriasEvolucionesSinRIPS[i].FechaEvaluacionTexto +
      " " +
      HistoriasEvolucionesSinRIPS[i].HoraEvaluacion +
      " ]";
    SelectHistoriasSinRIPS.appendChild(option);
  }
}
const SelectPacientes = document.getElementById("listaHC");
SelectPacientes.addEventListener("change", async function (e) {
  // console.log(this.value);

  if (document.getElementById("BuscarPorFacturas").checked === true) {
    document.getElementById("BuscarPorFacturas").click();
  }

  if (document.getElementById("BuscarPorPresupuestos").checked === true) {
    document.getElementById("BuscarPorPresupuestos").click();
  }
  // document.getElementById('BuscarPorFacturas').checked = false;
  // document.getElementById('BuscarPorPresupuestos').checked = false;
  // document.getElementById('BuscarPorFacturas').click();

  const NombrePaciente = document.getElementById("NombrePaciente");
  const DcoumentoPaciente = document.getElementById("DocumentoPaciente");
  const EdadPaciente = document.getElementById("EdadPaciente");
  const SexoPaciente = document.getElementById("SexoPaciente");
  const DireccionPaciente = document.getElementById("DireccionPaciente");
  const TelefonoPaciente = document.getElementById("TelefonoPaciente");
  const SelectHistoriasSinRIPS = document.getElementById("HistoriasSinRIPS");

  if (this.value === "") {
    document.getElementById("BuscarPorFacturas").disabled = true;
    document.getElementById("BuscarPorPresupuestos").disabled = true;
  }
  if (this.value !== "") {
    document.getElementById("BuscarPorFacturas").disabled = false;
    document.getElementById("BuscarPorPresupuestos").disabled = false;
    try {
      const DatosPaciente = await fetch(
        `http://${servidor}:3000/api/DatosdeUsuarioHC/${this.value}`
      );
      if (!DatosPaciente.ok) {
        throw new Error(
          `Error al obtener los datos de Pacientes con HC sin RIPS: ${DatosPaciente.statusText}`
        );
      }
      const CargarDatosPaciente = await DatosPaciente.json();
      // console.log('Datos: ', CargarDatosPaciente);

      NombrePaciente.value = CargarDatosPaciente[0].NombreCompletoPaciente;
      DcoumentoPaciente.value = CargarDatosPaciente[0].DocumentoPaciente;
      EdadPaciente.value = CargarDatosPaciente[0].Edad;
      SexoPaciente.value = CargarDatosPaciente[0].Sexo;
      DireccionPaciente.value = CargarDatosPaciente[0].Direccion;
      TelefonoPaciente.value = CargarDatosPaciente[0].Tel;
      LlenarSelectDeHistoriasClinicas();
    } catch (error) {
      console.error(error);
    }
  } else {
    // Limpiar los campos si no hay selección
    NombrePaciente.value = "";
    DcoumentoPaciente.value = "";
    EdadPaciente.value = "";
    SexoPaciente.value = "";
    DireccionPaciente.value = "";
    TelefonoPaciente.value = "";
    SelectHistoriasSinRIPS.innerHTML = "";
  }
});

const radioAC = document.getElementById("AC");
const radioAP = document.getElementById("AP");
const procedimientoRIPS = document.getElementById("procedimientoRIPS");
const causaViaIngreso = document.getElementById("causaViaIngreso");
const listaCausa = document.getElementById("listaCausa");
const listaViaIngreso = document.getElementById("listaViaIngreso");
const codDiagnosticoRelacionado = document.getElementById(
  "codDiagnosticoRelacionado"
);
const codDiagnosticoRelacionado2 = document.getElementById(
  "codDiagnosticoRelacionado2"
);
const codDiagnosticoRelacionado3 = document.querySelector(
  ".codDiagnosticoRelacionado3"
);
const tipoDiagnosticoPrincipal = document.querySelector(
  ".tipoDiagnosticoPrincipal"
);

const ContenedorTipoAC = document.getElementById("TipoAC");
const ContenedorTipoAP = document.getElementById("TipoAP");

ContenedorTipoAC.style.display = "none";
ContenedorTipoAP.style.display = "none";

$(document).ready(function () {
  const ElementosSelectConTextoLargo = [
    "#SelectConsultaRIPSAC1",
    "#SelectConsultaRIPSAC2",
    "#SelectDiagnosticoRIPSAC1",
    "#SelectDiagnosticoRIPSAC2",
    "#SelectProcedimientoRIPSAP1",
    "#SelectProcedimientoRIPSAP2",
    "#SelectDiagnosticoRIPSAP1",
    "#SelectDiagnosticoRIPSAP2",
    "#SelectPorDefectoConsultaRIPS1AC",
    "#SelectPorDefectoConsultaRIPS2AC",
    "#SelectPorDefectoDiagnosticoRIPSAC1",
    "#SelectPorDefectoDiagnosticoRIPSAC2",
    "#SelectPorDefectoProcedimientoRIPSAP1",
    "#SelectPorDefectoProcedimientoRIPSAP2",
    "#SelectPorDefectoDiagnosticoRIPSAP1",
    "#SelectPorDefectoDiagnosticoRIPSAP2",
  ];

  for (let i = 0; i < ElementosSelectConTextoLargo.length; i += 1) {
    if (
      ElementosSelectConTextoLargo[i] === "#SelectPorDefectoConsultaRIPS1AC" ||
      ElementosSelectConTextoLargo[i] === "#SelectPorDefectoConsultaRIPS2AC" ||
      ElementosSelectConTextoLargo[i] ===
        "#SelectPorDefectoDiagnosticoRIPSAC1" ||
      ElementosSelectConTextoLargo[i] ===
        "#SelectPorDefectoDiagnosticoRIPSAC2" ||
      ElementosSelectConTextoLargo[i] ===
        "#SelectPorDefectoProcedimientoRIPSAP1" ||
      ElementosSelectConTextoLargo[i] ===
        "#SelectPorDefectoProcedimientoRIPSAP2" ||
      ElementosSelectConTextoLargo[i] ===
        "#SelectPorDefectoDiagnosticoRIPSAP1" ||
      ElementosSelectConTextoLargo[i] === "#SelectPorDefectoDiagnosticoRIPSAP2"
    ) {
      $(ElementosSelectConTextoLargo[i]).select2({
        width: "100%", // Ajusta el ancho al contenedor
        dropdownAutoWidth: true, // Ajusta automáticamente el ancho del menú
        // placeholder: "Buscar",
        dropdownParent: $("#ModalRIPSPorDefecto"), // Reemplaza '#miModal' con el ID de tu modal
        templateSelection: function (data) {
          // Truncar el texto a 50 caracteres y añadir puntos suspensivos
          var truncatedText =
            data.text.length > 50
              ? data.text.substring(0, 50) + "..."
              : data.text;
          return $("<span>" + truncatedText + "</span>");
        },
      });
    } else {
      $(ElementosSelectConTextoLargo[i]).select2({
        width: "100%", // Ajusta el ancho al contenedor
        dropdownAutoWidth: true, // Ajusta automáticamente el ancho del menú
        // placeholder: "Buscar",
        templateSelection: function (data) {
          // Truncar el texto a 50 caracteres y añadir puntos suspensivos
          var truncatedText =
            data.text.length > 50
              ? data.text.substring(0, 50) + "..."
              : data.text;
          return $("<span>" + truncatedText + "</span>");
        },
      });
    }
  }
});

// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
// Event listener para el radio button AC
// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
radioAC.addEventListener("change", async function (e) {
  ContenedorTipoAC.style.display = "block";
  ContenedorTipoAP.style.display = "none";

  const SelectTipoUsuarioRIPS = document.getElementById(
    "SelectTipoUsuarioRIPS"
  );
  const HistoriasSinRIPS = document.getElementById("HistoriasSinRIPS").value;
  const SelectModalidadGrupoServicioTecnologiaSalud = document.getElementById(
    "SelectModalidadGrupoServicioTecnologiaSalud"
  );
  const SelectGrupoServiciosAC = document.getElementById(
    "SelectGrupoServiciosAC"
  );
  const SelectFinalidadTecnologiaSaludAC = document.getElementById(
    "SelectFinalidadTecnologiaSaludAC"
  );
  const SelectCausaMotivoAtencion = document.getElementById(
    "SelectCausaMotivoAtencion"
  );
  const SelectTipoDiagnosticoPrincipalAC = document.getElementById(
    "SelectTipoDiagnosticoPrincipalAC"
  );
  const SelectConsultaRIPSAC1 = document.getElementById(
    "SelectConsultaRIPSAC1"
  );
  const SelectConsultaRIPSAC2 = document.getElementById(
    "SelectConsultaRIPSAC2"
  );
  const SelectDiagnosticoRIPSAC1 = document.getElementById(
    "SelectDiagnosticoRIPSAC1"
  );
  const SelectDiagnosticoRIPSAC2 = document.getElementById(
    "SelectDiagnosticoRIPSAC2"
  );

  // Desarrollo || y producción &&
  if (HistoriasSinRIPS !== "" || HistoriasSinRIPS !== "Sin Seleccionar") {
    try {
      // Funcionalidad para el llenado del select de tipo de rips
      const TipoDeUsuarioRIPS = await fetch(
        `http://${servidor}:3000/api/TipodeRips`
      );
      if (!TipoDeUsuarioRIPS) {
        throw new Error(
          `Error al obtener los tipos de usuario RIPS: ${TipoDeUsuarioRIPS.statusText}`
        );
      }
      const CargarTipoDeUsuarioRIPS = await TipoDeUsuarioRIPS.json();
      // console.log('Tipos de Usuario RIPS: ', CargarTipoDeUsuarioRIPS);
      SelectTipoUsuarioRIPS.innerHTML = "";
      // Opción por defecto
      const defaultOption = document.createElement("option");
      defaultOption.textContent = "Seleccione un tipo de RIPS";
      defaultOption.value = "";
      SelectTipoUsuarioRIPS.appendChild(defaultOption);
      for (let i = 0; i < CargarTipoDeUsuarioRIPS.length; i += 1) {
        const option = document.createElement("option");
        option.value = CargarTipoDeUsuarioRIPS[i].IdTipoRips;
        option.textContent = CargarTipoDeUsuarioRIPS[i].TipoRips;
        SelectTipoUsuarioRIPS.appendChild(option);
      }

      // Funcionalidad para el llenado del select de entidad
      const EntidadResponsable = await fetch(
        `http://${servidor}:3000/api/Entidad`
      );
      if (!EntidadResponsable) {
        throw new Error(
          `Error al obtener las entidades responsables: ${EntidadResponsable.statusText}`
        );
      }
      const CargarEntidadResponsable = await EntidadResponsable.json();
      // console.log('Entidades Responsables: ', CargarEntidadResponsable);

      SelectEntidadResponsable.innerHTML = "";
      // Opción por defecto
      const defaultOptionn = document.createElement("option");
      defaultOptionn.textContent = "Seleccione una entidad";
      defaultOptionn.value = "";
      SelectEntidadResponsable.appendChild(defaultOptionn);

      // Ordenar el array por el nombre completo del paciente
      CargarEntidadResponsable.sort((a, b) => {
        if (a.NombreCompletoPaciente < b.NombreCompletoPaciente) return -1;
        if (a.NombreCompletoPaciente > b.NombreCompletoPaciente) return 1;
        return 0;
      });

      for (let i = 0; i < CargarEntidadResponsable.length; i++) {
        const option = document.createElement("option");
        option.value = CargarEntidadResponsable[i].DocumentoEntidad;
        option.textContent = CargarEntidadResponsable[i].NombreCompletoPaciente;
        option.setAttribute(
          "data-category",
          CargarEntidadResponsable[i]["IdTipoRips"]
        );
        SelectEntidadResponsable.appendChild(option);
      }
      // Ocultar todas las opciones excepto la primera
      Array.from(SelectEntidadResponsable.options).forEach((option, index) => {
        if (index !== 0) {
          // Si no es la primera opción
          option.style.display = "none"; // Ocultar opción
        }
      });

      // Funcionalidad para el llenado del select de ModalidadGrupoServicioTecnologíaSalud
      const ModalidadGrupoServicioTecnologiaSalud = await fetch(
        `http://${servidor}:3000/api/ModalidadAtencion`
      );
      if (!ModalidadGrupoServicioTecnologiaSalud) {
        throw new Error(
          `Error al obtener las modalidades de grupo servicio tecnología salud: ${ModalidadGrupoServicioTecnologiaSalud.statusText}`
        );
      }
      const CargarModalidadGrupoServicioTecnologiaSalud =
        await ModalidadGrupoServicioTecnologiaSalud.json();
      // console.log('Modalidades de Grupo Servicio Tecnología Salud: ', CargarModalidadGrupoServicioTecnologiaSalud);

      SelectModalidadGrupoServicioTecnologiaSalud.innerHTML = "";
      // Opción por defecto
      const defaultOption2 = document.createElement("option");
      defaultOption2.textContent = "Seleccione una modalidad";
      defaultOption2.value = "";
      SelectModalidadGrupoServicioTecnologiaSalud.appendChild(defaultOption2);

      // Ordenar el array por el nombre completo del paciente
      CargarModalidadGrupoServicioTecnologiaSalud.sort((a, b) => {
        if (a.NombreModalidadAtencion < b.NombreModalidadAtencion) return -1;
        if (a.NombreModalidadAtencion > b.NombreModalidadAtencion) return 1;
        return 0;
      });

      // for (let i = 0; i < CargarModalidadGrupoServicioTecnologiaSalud.length; i+=1) {
      //     const option = document.createElement('option');
      //     option.value = CargarModalidadGrupoServicioTecnologiaSalud[i].Codigo;
      //     option.textContent = CargarModalidadGrupoServicioTecnologiaSalud[i].NombreModalidadAtencion;
      //     SelectModalidadGrupoServicioTecnologiaSalud.appendChild(option);
      // }
      for (const modalidad of CargarModalidadGrupoServicioTecnologiaSalud) {
        const option = document.createElement("option");
        option.value = modalidad.Codigo;
        option.textContent = modalidad.NombreModalidadAtencion;
        SelectModalidadGrupoServicioTecnologiaSalud.appendChild(option);
      }

      // Funcionalidad para el llenado del select de GrupoServiciosAC
      const GrupoServiciosAC = await fetch(
        `http://${servidor}:3000/api/GrupoServicios`
      );
      if (!GrupoServiciosAC) {
        throw new Error(
          `Error al obtener los grupos de servicios AC: ${GrupoServiciosAC.statusText}`
        );
      }
      const CargarGrupoServiciosAC = await GrupoServiciosAC.json();
      // console.log('Grupos de Servicios AC: ', CargarGrupoServiciosAC);
      SelectGrupoServiciosAC.innerHTML = "";
      // Opción por defecto
      const defaultOption3 = document.createElement("option");
      defaultOption3.textContent = "Seleccione un grupo";
      defaultOption3.value = "";
      SelectGrupoServiciosAC.appendChild(defaultOption3);
      // Ordenar el array por el nombre del grupo
      CargarGrupoServiciosAC.sort((a, b) => {
        if (a.NombreGrupoServicios < b.NombreGrupoServicios) return -1;
        if (a.NombreGrupoServicios > b.NombreGrupoServicios) return 1;
        return 0;
      });

      // Agregar las opciones al select de GrupoServiciosAC
      for (let i = 0; i < CargarGrupoServiciosAC.length; i += 1) {
        const option = document.createElement("option");
        option.value = CargarGrupoServiciosAC[i].Codigo;
        option.textContent = CargarGrupoServiciosAC[i].NombreGrupoServicios;
        SelectGrupoServiciosAC.appendChild(option);
      }

      // Funcionalidad para el llenado del select de servicios
      const CargarServicios = await fetch(
        `http://${servidor}:3000/api/Servicios`
      );
      if (!CargarServicios.ok) {
        // throw new Error(`Error al obtener los servicios: ${CargarServicios.statusText}`);
        // throw new Error(`Error al obtener los servicios: ${CargarServicios}`);

        const errorDetails = await CargarServicios.text(); // O usa .json() si esperas un JSON
        throw new Error(
          `Error al obtener los servicios: ${CargarServicios.status} ${CargarServicios.statusText}. Detalles: ${errorDetails}`
        );
      }
      const CargarServiciosAC = await CargarServicios.json();
      // console.log('Servicios: ', CargarServiciosAC);

      SelectServiciosAC.innerHTML = "";
      // Opción por defecto
      const defaultOption20 = document.createElement("option");
      defaultOption20.textContent = "Seleccione un servicio";
      defaultOption20.value = "";
      SelectServiciosAC.appendChild(defaultOption20);
      CargarServiciosAC.sort((a, b) => {
        if (a["Nombre Servicios"] < b["Nombre Servicios"]) return -1;
        if (a["Nombre Servicios"] > b["Nombre Servicios"]) return 1;
        return 0;
      });
      // Ordenar el array por el nombre del servicio
      CargarServiciosAC.sort((a, b) => {
        if (a["Nombre Servicios"] < b["Nombre Servicios"]) return -1;
        if (a["Nombre Servicios"] > b["Nombre Servicios"]) return 1;
        return 0;
      });

      for (let i = 0; i < CargarServiciosAC.length; i++) {
        const option = document.createElement("option");
        option.value = CargarServiciosAC[i]["Id Servicios"];
        option.textContent = CargarServiciosAC[i]["Nombre Servicios"];
        option.setAttribute(
          "data-category",
          CargarServiciosAC[i]["Codigo Grupo Servicios"]
        );
        SelectServiciosAC.appendChild(option);
      }
      // Ocultar todas las opciones excepto la primera
      Array.from(SelectServiciosAC.options).forEach((option, index) => {
        if (index !== 0) {
          // Si no es la primera opción
          option.style.display = "none"; // Ocultar opción
        }
      });

      // Funcionalidad para el llenado del select de FinalidadTecnologiaSalud
      const FinalidadParaAC = "AC";
      const FinalidadTecnologiaSaludAC = await fetch(
        `http://${servidor}:3000/api/FinalidadV2/${FinalidadParaAC}`
      );
      if (!FinalidadTecnologiaSaludAC) {
        throw new Error(
          `Error al obtener las finalidades para el tipo AC: ${FinalidadTecnologiaSaludAC.statusText}`
        );
      }
      const CargarFinalidadTecnologiaSaludAC =
        await FinalidadTecnologiaSaludAC.json();
      // console.log('Finalidades para el tipo AC: ', CargarFinalidadTecnologiaSaludAC);
      SelectFinalidadTecnologiaSaludAC.innerHTML = "";
      // Opción por defecto
      const defaultOption4 = document.createElement("option");
      defaultOption4.textContent = "Seleccione una finalidad";
      defaultOption4.value = "";
      SelectFinalidadTecnologiaSaludAC.appendChild(defaultOption4);
      // Ordenar el array por el nombre del grupo
      CargarFinalidadTecnologiaSaludAC.sort((a, b) => {
        if (
          a.NombreRIPSFinalidadConsultaVersion2 <
          b.NombreRIPSFinalidadConsultaVersion2
        )
          return -1;
        if (
          a.NombreRIPSFinalidadConsultaVersion2 >
          b.NombreRIPSFinalidadConsultaVersion2
        )
          return 1;
        return 0;
      });
      // Agregar las opciones al select de FinalidadTecnologiaSalud
      for (let i = 0; i < CargarFinalidadTecnologiaSaludAC.length; i += 1) {
        const option = document.createElement("option");
        option.value = CargarFinalidadTecnologiaSaludAC[i].Codigo;
        option.textContent =
          CargarFinalidadTecnologiaSaludAC[
            i
          ].NombreRIPSFinalidadConsultaVersion2;
        SelectFinalidadTecnologiaSaludAC.appendChild(option);
      }

      // Funcionalidad para el llenado del select CausaMotivoAtención
      const CausaMotivoAtencion = await fetch(
        `http://${servidor}:3000/api/CausaExterna`
      );
      if (!CausaMotivoAtencion) {
        throw new Error(
          `Error al obtener las causas externas: ${CausaMotivoAtencion.statusText}`
        );
      }
      const CargarCausaMotivoAtencion = await CausaMotivoAtencion.json();
      // console.log('Causas externas: ', CargarCausaMotivoAtencion);
      SelectCausaMotivoAtencion.innerHTML = "";
      // Opción por defecto
      const defaultOption5 = document.createElement("option");
      defaultOption5.textContent = "Seleccione una causa externa";
      defaultOption5.value = "";
      SelectCausaMotivoAtencion.appendChild(defaultOption5);
      // Ordenar el array por el nombre del grupo
      CargarCausaMotivoAtencion.sort((a, b) => {
        if (a.NombreRIPSCausaExternaVersion2 < b.NombreRIPSCausaExternaVersion2)
          return -1;
        if (a.NombreRIPSCausaExternaVersion2 > b.NombreRIPSCausaExternaVersion2)
          return 1;
        return 0;
      });
      // Agregar las opciones al select de CausaMotivoAtencion
      for (let i = 0; i < CargarCausaMotivoAtencion.length; i += 1) {
        const option = document.createElement("option");
        option.value = CargarCausaMotivoAtencion[i].Codigo;
        option.textContent =
          CargarCausaMotivoAtencion[i].NombreRIPSCausaExternaVersion2;
        SelectCausaMotivoAtencion.appendChild(option);
      }

      // Funcionalidad para el llenado del select de TipoDiagnósticoPrincipal
      const TipoDiagnosticoPrincipal = await fetch(
        `http://${servidor}:3000/api/DXPrincipal`
      );
      if (!TipoDiagnosticoPrincipal) {
        throw new Error(
          `Error al obtener los tipos de diagnósticos principales: ${TipoDiagnosticoPrincipal.statusText}`
        );
      }
      const CargarTipoDiagnosticoPrincipal =
        await TipoDiagnosticoPrincipal.json();
      // console.log('Tipos de diagnósticos principales: ', CargarTipoDiagnosticoPrincipal);
      SelectTipoDiagnosticoPrincipalAC.innerHTML = "";
      // Opción por defecto
      const defaultOption6 = document.createElement("option");
      defaultOption6.textContent = "Seleccione un diagnóstico principal";
      defaultOption6.value = "";
      SelectTipoDiagnosticoPrincipalAC.appendChild(defaultOption6);
      // Ordenar el array por el nombre del grupo
      CargarTipoDiagnosticoPrincipal.sort((a, b) => {
        if (
          a.DescripcionTipodeDiagnósticoPrincipal <
          b.DescripcionTipodeDiagnósticoPrincipal
        )
          return -1;
        if (
          a.DescripcionTipodeDiagnósticoPrincipal >
          b.DescripcionTipodeDiagnósticoPrincipal
        )
          return 1;
        return 0;
      });
      // Agregar las opciones al select de TipoDiagnosticoPrincipal
      for (let i = 0; i < CargarTipoDiagnosticoPrincipal.length; i += 1) {
        const option = document.createElement("option");
        option.value =
          CargarTipoDiagnosticoPrincipal[i].CódigoTipodeDiagnósticoPrincipal;
        option.textContent =
          CargarTipoDiagnosticoPrincipal[
            i
          ].DescripcionTipodeDiagnósticoPrincipal;
        SelectTipoDiagnosticoPrincipalAC.appendChild(option);
      }

      // Funcionalidad para el llenado del select de Consulta RIPS
      const TipoConsulta1 = "AC";
      const ConsultaRIPS1 = await fetch(
        `http://${servidor}:3000/api/Cups/${TipoConsulta1}`
      );
      if (!ConsultaRIPS1) {
        throw new Error(
          `Error al obtener las consultas RIPS: ${ConsultaRIPS1.statusText}`
        );
      }
      const CargarConsultaRIPS1 = await ConsultaRIPS1.json();
      // console.log('Consultas RIPS: ', CargarConsultaRIPS1);
      SelectConsultaRIPSAC1.innerHTML = "";
      // Opción por defecto
      const defaultOption7 = document.createElement("option");
      defaultOption7.textContent = "Seleccione una consulta RIPS 1";
      defaultOption7.value = "";
      SelectConsultaRIPSAC1.appendChild(defaultOption7);
      // Ordenar el array por el nombre del grupo
      CargarConsultaRIPS1.sort((a, b) => {
        if (a.Nombre < b.Nombre) return -1;
        if (a.Nombre > b.Nombre) return 1;
        return 0;
      });
      // Agregar las opciones al select de ConsultaRIPS
      for (let i = 0; i < CargarConsultaRIPS1.length; i += 1) {
        const option = document.createElement("option");
        option.value = CargarConsultaRIPS1[i].Codigo;
        option.textContent =
          CargarConsultaRIPS1[i].Codigo + " - " + CargarConsultaRIPS1[i].Nombre;
        SelectConsultaRIPSAC1.appendChild(option);
      }

      // Funcionalidad para el llenado del select de Consulta RIPS 2
      const TipoConsulta2 = "AC";
      const ConsultaRIPS2 = await fetch(
        `http://${servidor}:3000/api/Cups/${TipoConsulta2}`
      );
      if (!ConsultaRIPS2) {
        throw new Error(
          `Error al obtener las consultas RIPS: ${ConsultaRIPS2.statusText}`
        );
      }
      const CargarConsultaRIPS2 = await ConsultaRIPS2.json();
      // console.log('Consultas RIPS: ', CargarConsultaRIPS2);
      SelectConsultaRIPSAC2.innerHTML = "";
      // Opción por defecto
      const defaultOption8 = document.createElement("option");
      defaultOption8.textContent = "Seleccione una consulta RIPS 2";
      defaultOption8.value = "";
      SelectConsultaRIPSAC2.appendChild(defaultOption8);
      // Ordenar el array por el nombre del grupo
      CargarConsultaRIPS2.sort((a, b) => {
        if (a.Nombre < b.Nombre) return -1;
        if (a.Nombre > b.Nombre) return 1;
        return 0;
      });
      // Agregar las opciones al select de ConsultaRIPS 2
      for (let i = 0; i < CargarConsultaRIPS2.length; i += 1) {
        const option = document.createElement("option");
        option.value = CargarConsultaRIPS2[i].Codigo;
        option.textContent =
          CargarConsultaRIPS2[i].Codigo + " - " + CargarConsultaRIPS2[i].Nombre;
        SelectConsultaRIPSAC2.appendChild(option);
      }

      // Funcinalidad para el llenado del select Diagnósitoco RIPS AC 1
      const DiasnosticoRIPSAC1 = await fetch(`http://${servidor}:3000/api/Cie`);
      if (!DiasnosticoRIPSAC1) {
        throw new Error(
          `Error al obtener los diagnósticos RIPS: ${DiasnosticoRIPSAC1.statusText}`
        );
      }
      const CargarDiagnosticoRIPSAC1 = await DiasnosticoRIPSAC1.json();
      // console.log('Diagnósticos RIPS AC 1: ', CargarDiagnosticoRIPSAC1);
      SelectDiagnosticoRIPSAC1.innerHTML = "";
      // Opción por defecto
      const defaultOption9 = document.createElement("option");
      defaultOption9.textContent = "Seleccione un diagnóstico RIPS AC 1";
      defaultOption9.value = "";
      SelectDiagnosticoRIPSAC1.appendChild(defaultOption9);
      // Ordenar el array por el nombre del grupo
      CargarDiagnosticoRIPSAC1.sort((a, b) => {
        if (a.Nombre < b.Nombre) return -1;
        if (a.Nombre > b.Nombre) return 1;
        return 0;
      });
      // Agregar las opciones al select Diagnósitoco RIPS AC 1
      for (let i = 0; i < CargarDiagnosticoRIPSAC1.length; i += 1) {
        const option = document.createElement("option");
        option.value = CargarDiagnosticoRIPSAC1[i].Codigo;
        option.textContent =
          CargarDiagnosticoRIPSAC1[i].Codigo +
          " - " +
          CargarDiagnosticoRIPSAC1[i].Nombre;
        SelectDiagnosticoRIPSAC1.appendChild(option);
      }

      // Funcinalidad para el llenado del select Diagnósitoco RIPS AC 2
      const DiasnosticoRIPSAC2 = await fetch(`http://${servidor}:3000/api/Cie`);
      if (!DiasnosticoRIPSAC2) {
        throw new Error(
          `Error al obtener los diagnósticos RIPS: ${DiasnosticoRIPSAC2.statusText}`
        );
      }
      const CargarDiagnosticoRIPSAC2 = await DiasnosticoRIPSAC2.json();
      // console.log('Diagnósticos RIPS AC 1: ', CargarDiagnosticoRIPSAC2);
      SelectDiagnosticoRIPSAC2.innerHTML = "";
      // Opción por defecto
      const defaultOption10 = document.createElement("option");
      defaultOption10.textContent = "Seleccione un diagnóstico RIPS AC 2";
      defaultOption10.value = "";
      SelectDiagnosticoRIPSAC2.appendChild(defaultOption10);
      // Ordenar el array por el nombre del grupo
      CargarDiagnosticoRIPSAC2.sort((a, b) => {
        if (a.Nombre < b.Nombre) return -1;
        if (a.Nombre > b.Nombre) return 1;
        return 0;
      });
      // Agregar las opciones al select Diagnósitoco RIPS AC 1
      for (let i = 0; i < CargarDiagnosticoRIPSAC2.length; i += 1) {
        const option = document.createElement("option");
        option.value = CargarDiagnosticoRIPSAC2[i].Codigo;
        option.textContent =
          CargarDiagnosticoRIPSAC2[i].Codigo +
          " - " +
          CargarDiagnosticoRIPSAC2[i].Nombre;
        SelectDiagnosticoRIPSAC2.appendChild(option);
      }
    } catch (error) {
      console.error(error);
    }
  }

  // if (radioAC.checked) {
  //     procedimientoRIPS.textContent = 'codConsulta'; // Limpiar el valor si es necesario
  //     causaViaIngreso.textContent = 'causaMotivoAtencion';
  //     listaCausa.style.display = 'block'
  //     listaViaIngreso.style.display = 'none'
  //     codDiagnosticoRelacionado.textContent = 'codDiagnosticoRelacionado1'
  //     codDiagnosticoRelacionado2.textContent = 'codDiagnosticoRelacionado2'
  //     codDiagnosticoRelacionado3.style.display = 'flex'
  //     tipoDiagnosticoPrincipal.style.display = 'grid'

  //     ejecutarConsultasAC();
  // }
});

const SelectTipoDeUsuarioRIPS = document.getElementById(
  "SelectTipoUsuarioRIPS"
);
const SelectEntidadResponsable = document.getElementById("SelectEntidad");
SelectTipoDeUsuarioRIPS.addEventListener("change", async function (e) {
  try {
    if (this.value !== "") {
      const selectedCategory = this.value;
      // Mostrar u ocultar opciones en el segundo select
      Array.from(SelectEntidadResponsable.options).forEach((option) => {
        if (option.getAttribute("data-category") === selectedCategory) {
          option.style.display = "block"; // Mostrar opción
        } else {
          option.style.display = "none"; // Ocultar opción
        }
      });

      if (e.detail && e.detail.parametro && e.detail.parametro.length > 0) {
        const parametro2 = e.detail.parametro.trim(); // Limpiar espacios
        const SeleccionarEntidadACPorDefecto = Array.from(
          SelectEntidadResponsable.options
        ).find((option) => {
          return option.text.trim() === parametro2; // Comparar texto
        });

        if (SeleccionarEntidadACPorDefecto) {
          SelectEntidadResponsable.selectedIndex =
            SeleccionarEntidadACPorDefecto.index; // Marcar la opción
        } else {
          console.log("No se encontró la opción con el texto:", parametro2);
        }
      } else {
        // console.log('No se envió un parámetro válido o no se recibió el evento correctamente.');
      }
    } else {
      SelectEntidadResponsable.innerHTML = "";
      // Opción por defecto
      const defaultOption = document.createElement("option");
      defaultOption.textContent = "Seleccione una entidad";
      defaultOption.value = "";
      SelectEntidadResponsable.appendChild(defaultOption);
    }
  } catch (error) {
    console.error(error);
  }
});

// Funcionalidad para el llenado del select Servicios (CodServicio)
const SelectGrupoServiciosAC = document.getElementById(
  "SelectGrupoServiciosAC"
);
const SelectServiciosAC = document.getElementById("SelectServiciosAC");
// Bloquea cualquier entrada de teclado
SelectServiciosAC.addEventListener("keydown", function (event) {
  event.preventDefault();
});

// Manejo de cambio para opciones ocultas
SelectServiciosAC.addEventListener("change", function () {
  const selectedOption =
    SelectServiciosAC.options[SelectServiciosAC.selectedIndex];

  if (selectedOption.style.display === "none") {
    // alert("Esta opción no está disponible."); // Mensaje de advertencia
    Swal.fire({
      icon: "warning",
      html: `
                <strong style="color: #FFFFFF;">Esta opción no está disponible para el grupo servicio seleccionado.</strong>
            `,
      showCloseButton: true,
      showCancelButton: false,
      showConfirmButton: false,
      timer: 5000,
    });
    this.selectedIndex = 0; // Volver a la opción por defecto
  }
});

SelectGrupoServiciosAC.addEventListener("change", async function (e) {
  try {
    const selectedCategory = this.value;
    // Mostrar u ocultar opciones en el segundo select
    Array.from(SelectServiciosAC.options).forEach((option) => {
      if (option.getAttribute("data-category") === selectedCategory) {
        option.style.display = "block"; // Mostrar opción
      } else {
        option.style.display = "none"; // Ocultar opción
      }
    });

    // // Si hay un parámetro en el evento, seleccionar la opción que coincida con él
    if (e.detail && e.detail.parametro && e.detail.parametro.length > 0) {
      const parametro2 = e.detail.parametro.trim(); // Limpiar espacios
      const SeleccionarServicioACPorDefecto = Array.from(
        SelectServiciosAC.options
      ).find((option) => {
        return option.text.trim() === parametro2; // Comparar texto
      });

      if (SeleccionarServicioACPorDefecto) {
        SelectServiciosAC.selectedIndex = SeleccionarServicioACPorDefecto.index; // Marcar la opción
      } else {
        console.log("No se encontró la opción con el texto:", parametro2);
      }
    } else {
      // console.log('No se envió un parámetro válido o no se recibió el evento correctamente.');
    }
  } catch (error) {
    console.error(error);
  }
});
// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
// Event listener para el radio button AP
// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
radioAP.addEventListener("change", async function (e) {
  ContenedorTipoAP.style.display = "block";
  ContenedorTipoAC.style.display = "none";

  const HistoriasSinRIPS = document.getElementById("HistoriasSinRIPS").value;
  const SelectTipoUsurioRIPSAP = document.getElementById(
    "SelectTipoUsurioRIPSAP"
  );
  const SelectViaIngresoServicioSaludAP = document.getElementById(
    "SelectViaIngresoServicioSaludAP"
  );
  const SelectModalidadGrupoServicioTecSalAP = document.getElementById(
    "SelectModalidadGrupoServicioTecSalAP"
  );
  const SelectGrupoServiciosAP = document.getElementById(
    "SelectGrupoServiciosAP"
  );
  const SelectFinalidadTecnologiaSaludAP = document.getElementById(
    "SelectFinalidadTecnologiaSaludAP"
  );
  const SelectProcedimientoRIPSAP1 = document.getElementById(
    "SelectProcedimientoRIPSAP1"
  );
  const SelectProcedimientoRIPSAP2 = document.getElementById(
    "SelectProcedimientoRIPSAP2"
  );
  const SelectDiagnosticoRIPSAP1 = document.getElementById(
    "SelectDiagnosticoRIPSAP1"
  );
  const SelectDiagnosticoRIPSAP2 = document.getElementById(
    "SelectDiagnosticoRIPSAP2"
  );

  if (HistoriasSinRIPS !== "" || HistoriasSinRIPS !== "Sin Seleccionar") {
    // Funcionalidad para el llenado del select tipo usuario ap
    const TipoUsuarioRIPSAP = await fetch(
      `http://${servidor}:3000/api/TipodeRips`
    );
    if (!TipoUsuarioRIPSAP) {
      throw new Error(
        `Error al obtener los tipos de usuario RIPS: ${TipoUsuarioRIPSAP.statusText}`
      );
    }
    const CargarTipoUsuarioRIPSAP = await TipoUsuarioRIPSAP.json();
    // console.log('Tipos de Usuario RIPS AP: ', CargarTipoUsuarioRIPSAP);
    SelectTipoUsurioRIPSAP.innerHTML = "";
    // Opción por defecto
    const defaultOption = document.createElement("option");
    defaultOption.textContent = "Seleccione un tipo de RIPS";
    defaultOption.value = "";
    SelectTipoUsurioRIPSAP.appendChild(defaultOption);
    // Ordenar el array por el nombre del tipo de usuario
    CargarTipoUsuarioRIPSAP.sort((a, b) => {
      if (a["TipoRips"] < b["TipoRips"]) return -1;
      if (a["TipoRips"] > b["TipoRips"]) return 1;
      return 0;
    });
    for (let i = 0; i < CargarTipoUsuarioRIPSAP.length; i++) {
      const option = document.createElement("option");
      option.value = CargarTipoUsuarioRIPSAP[i]["IdTipoRips"];
      option.textContent = CargarTipoUsuarioRIPSAP[i]["TipoRips"];
      SelectTipoUsurioRIPSAP.appendChild(option);
    }

    // Funcionalidad para el llenado del select entidad de rips ap
    const EntidadesAP = await fetch(`http://${servidor}:3000/api/Entidad`);
    if (!EntidadesAP) {
      throw new Error(
        `Error al obtener las entidades de RIPS: ${EntidadesAP.statusText}`
      );
    }
    const CargarEntidadesAP = await EntidadesAP.json();
    // console.log('Entidades de RIPS AP: ', CargarEntidadesAP);
    SelectEntidadAP.innerHTML = "";
    // Opción por defecto
    const defaultoptionEntidadAP = document.createElement("option");
    defaultoptionEntidadAP.textContent = "Seleccione una entidad";
    defaultoptionEntidadAP.value = "";
    SelectEntidadAP.appendChild(defaultoptionEntidadAP);
    // Ordenar el array por el nombre de la entidad
    CargarEntidadesAP.sort((a, b) => {
      if (a["NombreCompletoPaciente"] < b["NombreCompletoPaciente"]) return -1;
      if (a["NombreCompletoPaciente"] > b["NombreCompletoPaciente"]) return 1;
      return 0;
    });
    for (let i = 0; i < CargarEntidadesAP.length; i++) {
      const option = document.createElement("option");
      option.value = CargarEntidadesAP[i]["DocumentoEntidad"];
      option.textContent = CargarEntidadesAP[i]["NombreCompletoPaciente"];
      option.setAttribute("data-category", CargarEntidadesAP[i]["IdTipoRips"]);
      SelectEntidadAP.appendChild(option);
    }
    // Ocultar todas las opciones excepto la primera
    Array.from(SelectEntidadAP.options).forEach((option, index) => {
      if (index !== 0) {
        // Si no es la primera opción
        option.style.display = "none"; // Ocultar opción
      }
    });

    // Funcionalidad para el llendao del select ViaIngresoServicioSalud
    const ViaIngresoServicioSaludAP = await fetch(
      `http://${servidor}:3000/api/ViaIngresoUsuario`
    );
    if (!ViaIngresoServicioSaludAP) {
      throw new Error(
        `Error al obtener las vías de ingreso de usuario RIPS: ${ViaIngresoServicioSaludAP.statusText}`
      );
    }
    const CargarViaIngresoServicioSaludAP =
      await ViaIngresoServicioSaludAP.json();
    // console.log('Vias de Ingreso de Usuario RIPS AP: ', CargarViaIngresoServicioSaludAP);
    SelectViaIngresoServicioSaludAP.innerHTML = "";
    // Opción por defecto
    const defaultOption2 = document.createElement("option");
    defaultOption2.textContent = "Seleccione una via de ingreso";
    defaultOption2.value = "";
    SelectViaIngresoServicioSaludAP.appendChild(defaultOption2);
    // Ordenar el array por el nombre de la via de ingreso
    CargarViaIngresoServicioSaludAP.sort((a, b) => {
      if (a["NombreViaIngresoUsuario"] < b["NombreViaIngresoUsuario"])
        return -1;
      if (a["NombreViaIngresoUsuario"] > b["NombreViaIngresoUsuario"]) return 1;
      return 0;
    });
    for (let i = 0; i < CargarViaIngresoServicioSaludAP.length; i++) {
      const option = document.createElement("option");
      option.value = CargarViaIngresoServicioSaludAP[i]["Codigo"];
      option.textContent =
        CargarViaIngresoServicioSaludAP[i]["NombreViaIngresoUsuario"];
      SelectViaIngresoServicioSaludAP.appendChild(option);
    }

    // Funcionalidad para el llenado del select ModalidadGrupoServicioTecSalAP
    const ModalidadGrupoServicioTecSalAP = await fetch(
      `http://${servidor}:3000/api/ModalidadAtencion`
    );
    if (!ModalidadGrupoServicioTecSalAP) {
      throw new Error(
        `Error al obtener las modalidades de grupo de servicios técnicos RIPS: ${ModalidadGrupoServicioTecSalAP.statusText}`
      );
    }
    const CargarModalidadGrupoServicioTecSalAP =
      await ModalidadGrupoServicioTecSalAP.json();
    // console.log('Modalidades de Grupo de Servicios Técnicos RIPS AP: ', CargarModalidadGrupoServicioTecSalAP);
    SelectModalidadGrupoServicioTecSalAP.innerHTML = "";
    // Opción por defecto
    const defaultOption3 = document.createElement("option");
    defaultOption3.textContent =
      "Seleccione una modalidad de grupo de servicios técnicos";
    defaultOption3.value = "";
    SelectModalidadGrupoServicioTecSalAP.appendChild(defaultOption3);
    // Ordenar el array por el nombre de la modalidad de grupo de servicios técnicos
    CargarModalidadGrupoServicioTecSalAP.sort((a, b) => {
      if (a["NombreModalidadAtencion"] < b["NombreModalidadAtencion"])
        return -1;
      if (a["NombreModalidadAtencion"] > b["NombreModalidadAtencion"]) return 1;
      return 0;
    });
    for (let i = 0; i < CargarModalidadGrupoServicioTecSalAP.length; i++) {
      const option = document.createElement("option");
      option.value = CargarModalidadGrupoServicioTecSalAP[i]["Codigo"];
      option.textContent =
        CargarModalidadGrupoServicioTecSalAP[i]["NombreModalidadAtencion"];
      SelectModalidadGrupoServicioTecSalAP.appendChild(option);
    }

    //Funcionalidad para el llenado del select GrupoServiciosAP
    const GrupoServiciosAP = await fetch(
      `http://${servidor}:3000/api/GrupoServicios`
    );
    if (!GrupoServiciosAP) {
      throw new Error(
        `Error al obtener los grupos de servicios RIPS: ${GrupoServiciosAP.statusText}`
      );
    }
    const CargarGrupoServiciosAP = await GrupoServiciosAP.json();
    // console.log('Grupos de Servicios RIPS AP: ', CargarGrupoServiciosAP);
    SelectGrupoServiciosAP.innerHTML = "";
    // Opción por defecto
    const defaultOption4 = document.createElement("option");
    defaultOption4.textContent = "Seleccione un grupo de servicios";
    defaultOption4.value = "";
    SelectGrupoServiciosAP.appendChild(defaultOption4);
    // Ordenar el array por el nombre del grupo de servicios
    CargarGrupoServiciosAP.sort((a, b) => {
      if (a["NombreGrupoServicios"] < b["NombreGrupoServicios"]) return -1;
      if (a["NombreGrupoServicios"] > b["NombreGrupoServicios"]) return 1;
      return 0;
    });
    for (let i = 0; i < CargarGrupoServiciosAP.length; i++) {
      const option = document.createElement("option");
      option.value = CargarGrupoServiciosAP[i]["Codigo"];
      option.textContent = CargarGrupoServiciosAP[i]["NombreGrupoServicios"];
      SelectGrupoServiciosAP.appendChild(option);
    }

    // Funcionalidad para el llenado del select servicio de rips ap
    const ServiciosAP = await fetch(`http://${servidor}:3000/api/Servicios`);
    if (!ServiciosAP) {
      throw new Error(
        `Error al obtener los servicios de RIPS: ${ServiciosAP.statusText}`
      );
    }
    const CargarServiciosAP = await ServiciosAP.json();
    // console.log('Servicios de RIPS AP: ', CargarServiciosAP);
    SelectServicioAP.innerHTML = "";
    // Opción por defecto
    const defaultoptionservicioap = document.createElement("option");
    defaultoptionservicioap.textContent = "Seleccione un servicio";
    defaultoptionservicioap.value = "";
    SelectServicioAP.appendChild(defaultoptionservicioap);
    // Ordenar el array por el nombre del servicio
    CargarServiciosAP.sort((a, b) => {
      if (a["Nombre Servicios"] < b["Nombre Servicios"]) return -1;
      if (a["Nombre Servicios"] > b["Nombre Servicios"]) return 1;
      return 0;
    });
    for (let i = 0; i < CargarServiciosAP.length; i++) {
      const option2 = document.createElement("option");
      option2.value = CargarServiciosAP[i]["Id Servicios"];
      option2.textContent = CargarServiciosAP[i]["Nombre Servicios"];
      option2.setAttribute(
        "data-category",
        CargarServiciosAP[i]["Codigo Grupo Servicios"]
      );
      SelectServicioAP.appendChild(option2);
    }
    // Ocultar todas las opciones excepto la primera
    Array.from(SelectServicioAP.options).forEach((option, index) => {
      if (index !== 0) {
        // Si no es la primera opción
        option.style.display = "none"; // Ocultar opción
      }
    });

    // Funcionalidad para el llenado del select FinalidadTecnologiaSaludAP
    const FinalidadRIPSAP = "AP";
    const FinalidadTecnologiaSaludAP = await fetch(
      `http://${servidor}:3000/api/FinalidadV2/${FinalidadRIPSAP}`
    );
    if (!FinalidadTecnologiaSaludAP) {
      throw new Error(
        `Error al obtener las finalidades técnicas de salud RIPS: ${FinalidadTecnologiaSaludAP.statusText}`
      );
    }
    const CargarFinalidadTecnologiaSaludAP =
      await FinalidadTecnologiaSaludAP.json();
    // console.log('Finalidades Técnicas de Salud RIPS AP: ', CargarFinalidadTecnologiaSaludAP);
    SelectFinalidadTecnologiaSaludAP.innerHTML = "";
    // Opción por defecto
    const defaultOption5 = document.createElement("option");
    defaultOption5.textContent = "Seleccione una finalidad técnica de salud";
    defaultOption5.value = "";
    SelectFinalidadTecnologiaSaludAP.appendChild(defaultOption5);
    // Ordenar el array por el nombre de la finalidad técnica de salud
    CargarFinalidadTecnologiaSaludAP.sort((a, b) => {
      if (
        a["NombreRIPSFinalidadConsultaVersion2"] <
        b["NombreRIPSFinalidadConsultaVersion2"]
      )
        return -1;
      if (
        a["NombreRIPSFinalidadConsultaVersion2"] >
        b["NombreRIPSFinalidadConsultaVersion2"]
      )
        return 1;
      return 0;
    });
    for (let i = 0; i < CargarFinalidadTecnologiaSaludAP.length; i++) {
      const option = document.createElement("option");
      option.value = CargarFinalidadTecnologiaSaludAP[i]["Codigo"];
      option.textContent =
        CargarFinalidadTecnologiaSaludAP[i][
          "NombreRIPSFinalidadConsultaVersion2"
        ];
      SelectFinalidadTecnologiaSaludAP.appendChild(option);
    }

    // Funcionalidad para el llenado del select Procedimiento AP 1
    const TipoProcedimientoAP1 = "AP";
    const ProcedimientoAP1 = await fetch(
      `http://${servidor}:3000/api/Cups/${TipoProcedimientoAP1}`
    );
    if (!ProcedimientoAP1) {
      throw new Error(
        `Error al obtener los procedimientos AP 1: ${ProcedimientoAP1.statusText}`
      );
    }
    const CargarProcedimientoAP1 = await ProcedimientoAP1.json();
    // console.log('Procedimientos AP 1: ', CargarProcedimientoAP1);
    SelectProcedimientoRIPSAP1.innerHTML = "";
    // Opción por defecto
    const defaultOption6 = document.createElement("option");
    defaultOption6.textContent = "Seleccione un procedimiento AP 1";
    defaultOption6.value = "";
    SelectProcedimientoRIPSAP1.appendChild(defaultOption6);
    // Ordenar el array por el nombre del procedimiento
    CargarProcedimientoAP1.sort((a, b) => {
      if (a["Nombre"] < b["Nombre"]) return -1;
      if (a["Nombre"] > b["Nombre"]) return 1;
      return 0;
    });
    for (let i = 0; i < CargarProcedimientoAP1.length; i++) {
      const option = document.createElement("option");
      option.value = CargarProcedimientoAP1[i].Codigo;
      option.textContent =
        CargarProcedimientoAP1[i].Codigo +
        " - " +
        CargarProcedimientoAP1[i].Nombre;
      SelectProcedimientoRIPSAP1.appendChild(option);
    }

    // Funcionalidad para el llenado del select Procedimiento AP 2
    const TipoProcedimientoAP2 = "AP";
    const ProcedimientoAP2 = await fetch(
      `http://${servidor}:3000/api/Cups/${TipoProcedimientoAP2}`
    );
    if (!ProcedimientoAP2) {
      throw new Error(
        `Error al obtener los procedimientos AP 2: ${ProcedimientoAP2.statusText}`
      );
    }
    const CargarProcedimientoAP2 = await ProcedimientoAP2.json();
    // console.log('Procedimientos AP 2: ', CargarProcedimientoAP2);
    SelectProcedimientoRIPSAP2.innerHTML = "";
    // Opción por defecto
    const defaultOption7 = document.createElement("option");
    defaultOption7.textContent = "Seleccione un procedimiento AP 2";
    defaultOption7.value = "";
    SelectProcedimientoRIPSAP2.appendChild(defaultOption7);
    // Ordenar el array por el nombre del procedimiento
    CargarProcedimientoAP2.sort((a, b) => {
      if (a["Nombre"] < b["Nombre"]) return -1;
      if (a["Nombre"] > b["Nombre"]) return 1;
      return 0;
    });
    for (let i = 0; i < CargarProcedimientoAP2.length; i++) {
      const option = document.createElement("option");
      option.value = CargarProcedimientoAP2[i].Codigo;
      option.textContent =
        CargarProcedimientoAP2[i].Codigo +
        " - " +
        CargarProcedimientoAP2[i].Nombre;
      SelectProcedimientoRIPSAP2.appendChild(option);
    }

    // Funcionalidad para el llenado del Select Diagnostico AP 1
    const DiagnosticoAP1 = await fetch(`http://${servidor}:3000/api/Cie`);
    if (!DiagnosticoAP1) {
      throw new Error(
        `Error al obtener los diagnósticos AP 1: ${DiagnosticoAP1.statusText}`
      );
    }
    const CargarDiagnosticoAP1 = await DiagnosticoAP1.json();
    // console.log('Diagnósticos AP 1: ', CargarDiagnosticoAP1);
    SelectDiagnosticoRIPSAP1.innerHTML = "";
    // Opción por defecto
    const defaultOption8 = document.createElement("option");
    defaultOption8.textContent = "Seleccione un diagnóstico AP 1";
    defaultOption8.value = "";
    SelectDiagnosticoRIPSAP1.appendChild(defaultOption8);
    // Ordenar el array por el nombre del diagnóstico
    CargarDiagnosticoAP1.sort((a, b) => {
      if (a["Nombre"] < b["Nombre"]) return -1;
      if (a["Nombre"] > b["Nombre"]) return 1;
      return 0;
    });
    for (let i = 0; i < CargarDiagnosticoAP1.length; i++) {
      const option = document.createElement("option");
      option.value = CargarDiagnosticoAP1[i].Codigo;
      option.textContent =
        CargarDiagnosticoAP1[i].Codigo + " - " + CargarDiagnosticoAP1[i].Nombre;
      SelectDiagnosticoRIPSAP1.appendChild(option);
    }

    // Funcionalidad para el llenado del Select Diagnostico AP 2
    const DiagnosticoAP2 = await fetch(`http://${servidor}:3000/api/Cie`);
    if (!DiagnosticoAP2) {
      throw new Error(
        `Error al obtener los diagnósticos AP 1: ${DiagnosticoAP2.statusText}`
      );
    }
    const CargarDiagnosticoAP2 = await DiagnosticoAP2.json();
    // console.log('Diagnósticos AP 1: ', CargarDiagnosticoAP2);
    SelectDiagnosticoRIPSAP2.innerHTML = "";
    // Opción por defecto
    const defaultOption9 = document.createElement("option");
    defaultOption9.textContent = "Seleccione un diagnóstico AP 2";
    defaultOption9.value = "";
    SelectDiagnosticoRIPSAP2.appendChild(defaultOption9);
    // Ordenar el array por el nombre del diagnóstico
    CargarDiagnosticoAP2.sort((a, b) => {
      if (a["Nombre"] < b["Nombre"]) return -1;
      if (a["Nombre"] > b["Nombre"]) return 1;
      return 0;
    });
    for (let i = 0; i < CargarDiagnosticoAP2.length; i++) {
      const option = document.createElement("option");
      option.value = CargarDiagnosticoAP2[i].Codigo;
      option.textContent =
        CargarDiagnosticoAP2[i].Codigo + " - " + CargarDiagnosticoAP2[i].Nombre;
      SelectDiagnosticoRIPSAP2.appendChild(option);
    }
  }
});

const SelectEntidadAP = document.getElementById("SelectEntidadAP");
const TipoUsuarioRIPSAP = document.getElementById("SelectTipoUsurioRIPSAP");

TipoUsuarioRIPSAP.addEventListener("change", async function (e) {
  const selectedCategory = this.value;
  // Mostrar u ocultar opciones en el segundo select
  Array.from(SelectEntidadAP.options).forEach((option) => {
    if (option.getAttribute("data-category") === selectedCategory) {
      option.style.display = "block"; // Mostrar opción
    } else {
      option.style.display = "none"; // Ocultar opción
    }
  });

  if (
    e.detail &&
    e.detail.entidadappordefecto &&
    e.detail.entidadappordefecto.length > 0
  ) {
    const parametro2 = e.detail.entidadappordefecto.trim(); // Limpiar espacios
    const SeleccionarEntidadAPPorDefecto = Array.from(
      SelectEntidadAP.options
    ).find((option) => {
      return option.text.trim() === parametro2; // Comparar texto
    });

    if (SeleccionarEntidadAPPorDefecto) {
      SelectEntidadAP.selectedIndex = SeleccionarEntidadAPPorDefecto.index; // Marcar la opción
    } else {
      console.log("No se encontró la opción con el texto:", parametro2);
    }
  } else {
    console.log(
      "No se envió un parámetro válido o no se recibió el evento correctamente."
    );
  }
});

const GrupoServicioAP = document.getElementById("SelectGrupoServiciosAP");
const SelectServicioAP = document.getElementById("SelectServicioAP");
GrupoServicioAP.addEventListener("change", async function (e) {
  const selectedCategory = this.value;
  // Mostrar u ocultar opciones en el segundo select
  Array.from(SelectServicioAP.options).forEach((option) => {
    if (option.getAttribute("data-category") === selectedCategory) {
      option.style.display = "block"; // Mostrar opción
    } else {
      option.style.display = "none"; // Ocultar opción
    }
  });

  // Verificar si el parámetro existe y tiene longitud
  if (e.detail && e.detail.parametro && e.detail.parametro.length > 0) {
    const parametro2 = e.detail.parametro.trim(); // Limpiar espacios
    const SeleccionarGrupoServicioAPPorDefecto = Array.from(
      SelectServicioAP.options
    ).find((option) => {
      return option.text.trim() === parametro2; // Comparar texto
    });

    if (SeleccionarGrupoServicioAPPorDefecto) {
      SelectServicioAP.selectedIndex =
        SeleccionarGrupoServicioAPPorDefecto.index; // Marcar la opción
    } else {
      console.log("No se encontró la opción con el texto:", parametro2);
    }
  } else {
    // console.log('No se envió un parámetro válido o no se recibió el evento correctamente.');
  }
});
// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

const btnRegistrarRIPS = document.getElementById("btnRegistrarRIPS");
const selectHistoriaClinica = document.getElementById("listaHC");
const listaTipoUsuario = document.getElementById("listaTipoUsuario");
const listaEntidad = document.getElementById("listaEntidad");
const listaCodConsulta = document.getElementById("listaCodConsulta");
const listamodalidadAtencion = document.getElementById(
  "listamodalidadAtencion"
);
const listaGrupoServicios = document.getElementById("listaGrupoServicios");
const listaServicios = document.getElementById("listaServicios");
const listaFinalidad = document.getElementById("listaFinalidad");
const listaTipoDiagnostico = document.getElementById("listaTipoDiagnostico");
// LISTA VIA INGRESO Y LISTA CAUSA YA ESTAN DEFINIDAS ARRIBA POR ESO NO APARECEN ACÁ

const pruebaAlert = async () => {
  const selectHistoriaClinica = document.querySelector("#listaHC");
  const opcionSeleccionada =
    selectHistoriaClinica.options[selectHistoriaClinica.selectedIndex].text;

  const swalWithBootstrapButtons = Swal.mixin({
    customClass: {
      cancelButton: "btn btn-danger",
      confirmButton: "btn btn-success",
    },
    buttonsStyling: false,
  });

  swalWithBootstrapButtons
    .fire({
      title: "¿Está seguro de querer asignar el RIPS a la paciente?",
      text: `Está a punto de asignar el RIPS a la paciente: ${opcionSeleccionada}. ¿Desea continuar?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, asignarlo",
      cancelButtonText: "No, cancelar",
      reverseButtons: true,
    })
    .then((result) => {
      if (result.isConfirmed) {
        // Lógica si el usuario confirma
        RegistrarRIPS()
          .then(() => {
            swalWithBootstrapButtons.fire({
              title: "Asignado",
              text: `El RIPS ha sido asignado a la paciente: ${opcionSeleccionada}`,
              icon: "success",
            });
          })
          .catch((error) => {
            // Manejar cualquier error que ocurra durante la ejecución de RegistrarRIPS()
            swalWithBootstrapButtons.fire({
              title: "Error",
              text: "Ha ocurrido un error al asignar el RIPS.",
              icon: "error",
            });
          });
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        // Lógica si el usuario cancela
        swalWithBootstrapButtons.fire({
          title: "Cancelado",
          text: "La asignación del RIPS ha sido cancelada",
          icon: "error",
        });
      }
    });
};

// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
//  FUNCIÓN PARA ASIGNAR RIPS A LAS HISTORIAS
// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
const AsignarRIPS = async () => {
  const HistoriasSinRIPS = document.getElementById("HistoriasSinRIPS");

  // Validar si hay una historia seleccionada correctamente
  const historiaValida =
    HistoriasSinRIPS.value !== "" &&
    HistoriasSinRIPS.value !== "Sin Seleccionar";

  // Validar qué radio está seleccionado
  if (historiaValida && radioAP.checked) {
    // console.log("PREPARANDO PARA RIPS AP");
    console.log(
      "%cAsignando RIPS de tipo AP...",
      "color: blue; font-size: 16px;"
    );
    // Lógica para realizar la petición al API para asignar el RIPS AP
    const IdEvaluacionRIPSAP =
      document.getElementById("HistoriasSinRIPS").value;
    const TipoUsuarioRIPSAP = document.getElementById(
      "SelectTipoUsurioRIPSAP"
    ).value;
    const EntidadRIPSAP = document.getElementById("SelectEntidadAP").value;
    const ViaIngresoServicioSaludRIPSAP = document.getElementById(
      "SelectViaIngresoServicioSaludAP"
    ).value;
    const ModalidadGrupoServicioTecSalRIPSAP = document.getElementById(
      "SelectModalidadGrupoServicioTecSalAP"
    ).value;
    const GrupoServiciosRIPSAP = document.getElementById(
      "SelectGrupoServiciosAP"
    ).value;
    const CodServicioRIPSAP = document.getElementById("SelectServicioAP").value;
    const FinalidadTecnologiaSaludRIPSAP = document.getElementById(
      "SelectFinalidadTecnologiaSaludAP"
    ).value;
    const CausaMotivoAtencionRIPSAP = "0"; // VACÍO PARA RIPS AP
    const TipoDiagnosticoPrincipalRIPSAP = "0"; // VACÍO PARA RIPS AP
    const Cups1RIPSAP = document.getElementById(
      "SelectProcedimientoRIPSAP1"
    ).value;
    let Cups2RIPSAP = document.getElementById(
      "SelectProcedimientoRIPSAP2"
    ).value;
    const Cie1RIPSAP = document.getElementById(
      "SelectDiagnosticoRIPSAP1"
    ).value;
    let Cie2RIPSAP = document.getElementById("SelectDiagnosticoRIPSAP2").value;
    const TipoRipsRIPSAP = "AP";
    const IdFactura = document.getElementById("FacturaARelacionar");
    const IdPresupuesto = document.getElementById("PresupuestoARelacionar");
    const PorFactura = document.getElementById("BuscarPorFacturas");
    const PorPresupuesto = document.getElementById("BuscarPorPresupuestos");
    let ValorIdFactura;
    let ValorIdPresupuesto;
    if (PorFactura.checked === true) {
      ValorIdFactura =
        IdFactura.value === "Sin Seleccionar" ? null : IdFactura.value;
    } else {
      ValorIdFactura = null;
    }

    if (PorPresupuesto.checked === true) {
      ValorIdPresupuesto =
        IdPresupuesto.value === "Sin Seleccionar" ? null : IdPresupuesto.value;
    } else {
      ValorIdPresupuesto = null;
    }

    // Logica para campos vacíos
    let RIPSAPCAMPOSVACIOS = [];
    if (!TipoUsuarioRIPSAP) RIPSAPCAMPOSVACIOS.push("Tipo de usuario.");
    if (
      !EntidadRIPSAP ||
      EntidadRIPSAP === "" ||
      EntidadRIPSAP === "Sin Seleccionar"
    )
      RIPSAPCAMPOSVACIOS.push("Entidad.");
    if (!ViaIngresoServicioSaludRIPSAP)
      RIPSAPCAMPOSVACIOS.push("Vía de ingreso al servicio de salud.");
    if (!ModalidadGrupoServicioTecSalRIPSAP)
      RIPSAPCAMPOSVACIOS.push("Modalidad de grupo de servicios técnico salud.");
    if (!GrupoServiciosRIPSAP) RIPSAPCAMPOSVACIOS.push("Grupo servicios.");
    if (
      !CodServicioRIPSAP ||
      CodServicioRIPSAP === "" ||
      CodServicioRIPSAP === "Sin Seleccionar"
    )
      RIPSAPCAMPOSVACIOS.push("Código de servicio.");
    if (!FinalidadTecnologiaSaludRIPSAP)
      RIPSAPCAMPOSVACIOS.push("Finalidad técnica de salud.");
    if (!Cups1RIPSAP) RIPSAPCAMPOSVACIOS.push("Procedimiento RIPS");
    if (!Cie1RIPSAP) RIPSAPCAMPOSVACIOS.push("Diagnóstico RIPS");

    if (RIPSAPCAMPOSVACIOS.length > 0) {
      Swal.fire({
        icon: "warning",
        html: `
                <h4 style="color: #ffffff"><b> Los siguientes campos son obligatorios: </b></h4>
                <br>
                <ul style="text-align: left;">
                ${RIPSAPCAMPOSVACIOS.map(
                  (campo) => `<li style="color: #ffffff"> ${campo}</li>`
                ).join("")}
                </ul>
            `,
        allowOutsideClick: false,
        allowEscapeKey: false,
      });

      return;
    } else {
      // Vamossfsdf
      let InformacionParaRIPSAP = {
        "Id de historia clinica": IdEvaluacionRIPSAP,
        "Tipo de usuario": TipoUsuarioRIPSAP,
        Entidad: EntidadRIPSAP,
        "Modalidad de grupo de servicios técnico salud":
          ModalidadGrupoServicioTecSalRIPSAP,
        "Grupo servicios": GrupoServiciosRIPSAP,
        "Código de servicio": CodServicioRIPSAP,
        "Finalidad tecnología salud": FinalidadTecnologiaSaludRIPSAP,
        "Causa motivo atención": CausaMotivoAtencionRIPSAP,
        "Tipo diagnóstico principal": TipoDiagnosticoPrincipalRIPSAP,
        "Via ingreso servicio salud": ViaIngresoServicioSaludRIPSAP,
        "Procedimiento1 RIPS": Cups1RIPSAP,
        "Procedimiento2 RIPS": Cups2RIPSAP,
        "Diagnóstico1 RIPS": Cie1RIPSAP,
        "Diagnóstico2 RIPS": Cie2RIPSAP,
        "Tipo de RIPS": TipoRipsRIPSAP,
        "Id Factura": ValorIdFactura,
        "Id Presupuesto": ValorIdPresupuesto,
      };

      // console.log(InformacionParaRIPSAP);
      if (Cups2RIPSAP === "") {
        Cups2RIPSAP = "0";
      }
      if (Cie2RIPSAP === "") {
        Cie2RIPSAP = "0";
      }

      // Swal.fire({
      //     icon: "info",
      //     html: `
      // <ul style="text-align: left; color: #ffffff;">
      //     ${Object.entries(InformacionParaRIPSAP)
      //         .map(([clave, valor]) => `<li><strong>${clave}:</strong> ${valor}</li>`)
      //         .join("")}
      // </ul>
      //     `
      // });
      // return;

      const AsignarRIPSAP = await fetch(
        `http://${servidor}:3000/api/RegistrarRips/${IdEvaluacionRIPSAP}/${TipoUsuarioRIPSAP}/${EntidadRIPSAP}/${ModalidadGrupoServicioTecSalRIPSAP}/${GrupoServiciosRIPSAP}/
                ${CodServicioRIPSAP}/${FinalidadTecnologiaSaludRIPSAP}/${CausaMotivoAtencionRIPSAP}/${TipoDiagnosticoPrincipalRIPSAP}/${ViaIngresoServicioSaludRIPSAP}/${Cups1RIPSAP}/${Cups2RIPSAP}/${Cie1RIPSAP}/
                ${Cie2RIPSAP}/${TipoRipsRIPSAP}/${ValorIdFactura}/${ValorIdPresupuesto}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!AsignarRIPSAP) {
        throw new Error(
          `Error al obtener las entidades de RIPS: ${AsignarRIPSAP.statusText}`
        );
      }
      const CargarAsignarRIPSAP = await AsignarRIPSAP.json();
      // console.log('Entidades de RIPS AP: ', CargarAsignarRIPSAP);
      console.log(
        `%cRIPS AP asignado correctamente!`,
        "color: green; font-size: 16px;"
      );
      Swal.fire({
        icon: "success",
        html: `
                    <span style="color: #FFFFFF;">El RIPS ha sido asignado correctamente a la historia clínica con ID: ${IdEvaluacionRIPSAP}</span>
                `,
        allowOutsideClick: false,
        allowEscapeKey: false,
      }).then(function (respuesta) {
        LlenarSelectDeHistoriasClinicas();
        if (document.getElementById("BuscarPorFacturas").checked === true) {
          document.getElementById("BuscarPorFacturas").click();
        }

        if (document.getElementById("BuscarPorPresupuestos").checked === true) {
          document.getElementById("BuscarPorPresupuestos").click();
        }
      });
    }
  } else if (historiaValida && radioAC.checked) {
    // console.log("PREPARANDO PARA RIPS AC");
    console.log(
      "%cAsignando RIPS de tipo AC...",
      "color: blue; font-size: 16px;"
    );
    const IdEvaluacionRIPSAC =
      document.getElementById("HistoriasSinRIPS").value; // Select que tiene las historias clinicas del paciente sin RIPS
    const SelectTipoUsuarioRIPSAC = document.getElementById(
      "SelectTipoUsuarioRIPS"
    ).value;
    const SelectEntidadAC = document.getElementById("SelectEntidad").value;
    const SelectModalidadGrupoServicioTecnologiaSaludAC =
      document.getElementById(
        "SelectModalidadGrupoServicioTecnologiaSalud"
      ).value;
    const SelectGrupoServiciosAC = document.getElementById(
      "SelectGrupoServiciosAC"
    ).value;
    const SelectServiciosAC =
      document.getElementById("SelectServiciosAC").value;
    const SelectFinalidadTecnologiaSaludAC = document.getElementById(
      "SelectFinalidadTecnologiaSaludAC"
    ).value;
    const SelectCausaMotivoAtencion = document.getElementById(
      "SelectCausaMotivoAtencion"
    ).value;
    const SelectTipoDiagnosticoPrincipalAC = document.getElementById(
      "SelectTipoDiagnosticoPrincipalAC"
    ).value;
    const SelectConsultaRIPSAC1 = document.getElementById(
      "SelectConsultaRIPSAC1"
    ).value;
    let SelectConsultaRIPSAC2 = document.getElementById(
      "SelectConsultaRIPSAC2"
    ).value;
    const SelectDiagnosticoRIPSAC1 = document.getElementById(
      "SelectDiagnosticoRIPSAC1"
    ).value;
    let SelectDiagnosticoRIPSAC2 = document.getElementById(
      "SelectDiagnosticoRIPSAC2"
    ).value;
    const TipoRipsRIPSAC = "AC";
    const ViaIngresoAC = "0";
    const IdFactura = document.getElementById("FacturaARelacionar");
    const IdPresupuesto = document.getElementById("PresupuestoARelacionar");
    const PorFactura = document.getElementById("BuscarPorFacturas");
    const PorPresupuesto = document.getElementById("BuscarPorPresupuestos");
    let ValorIdFactura;
    let ValorIdPresupuesto;
    if (PorFactura.checked === true) {
      ValorIdFactura =
        IdFactura.value === "Sin Seleccionar" ? null : IdFactura.value;
    } else {
      ValorIdFactura = null;
    }

    if (PorPresupuesto.checked === true) {
      ValorIdPresupuesto =
        IdPresupuesto.value === "Sin Seleccionar" ? null : IdPresupuesto.value;
    } else {
      ValorIdPresupuesto = null;
    }

    // let ValoresCapturados = {
    //     "Id de historia clinica": IdEvaluacionRIPSAC,
    //     "Tipo de usuario": SelectTipoUsuarioRIPSAC,
    //     "Entidad": SelectEntidadAC,
    //     "Modalidad de grupo de servicios técnico salud": SelectModalidadGrupoServicioTecnologiaSaludAC,
    //     "Grupo servicios": SelectGrupoServiciosAC,
    //     "Servicio": SelectServiciosAC,
    //     "Finalidad técnica de salud": SelectFinalidadTecnologiaSaludAC,
    //     "Causa motivo atención": SelectCausaMotivoAtencion,
    //     "Tipo diagnóstico principal": SelectTipoDiagnosticoPrincipalAC,
    //     "Consulta1 RIPS": SelectConsultaRIPSAC1,
    //     "Consulta2 RIPS": SelectConsultaRIPSAC2,
    //     "Diagnóstico1 RIPS": SelectDiagnosticoRIPSAC1,
    //     "Diagnóstico2 RIPS": SelectDiagnosticoRIPSAC2,
    //     "Id Factura": ValorIdFactura,
    //     "Id Presupuesto": ValorIdPresupuesto
    // }

    // Swal.fire({
    //     icon: "info",
    //     html: `
    // <ul style="text-align: left; color: #ffffff;">
    //     ${Object.entries(ValoresCapturados)
    //         .map(([clave, valor]) => `<li><strong>${clave}:</strong> ${valor}</li>`)
    //         .join("")}
    // </ul>
    //     `
    // });
    // return;

    // console.log(ValoresCapturados);
    let CamposSinLlenar = [];
    if (!SelectTipoUsuarioRIPSAC) CamposSinLlenar.push("Tipo de usuario.");
    if (
      !SelectEntidadAC ||
      SelectEntidadAC === "" ||
      SelectEntidadAC === "Sin Seleccionar"
    )
      CamposSinLlenar.push("Entidad.");
    if (!SelectModalidadGrupoServicioTecnologiaSaludAC)
      CamposSinLlenar.push("Modalidad de grupo servicio de salud.");
    if (!SelectGrupoServiciosAC) CamposSinLlenar.push("Grupo servicios.");
    if (
      !SelectServiciosAC ||
      SelectServiciosAC === "" ||
      SelectServiciosAC === "Sin Seleccionar"
    )
      CamposSinLlenar.push("Servicio.");
    if (!SelectFinalidadTecnologiaSaludAC)
      CamposSinLlenar.push("Finalidad técnica de salud.");
    if (!SelectCausaMotivoAtencion)
      CamposSinLlenar.push("Causa motivo de atención.");
    if (!SelectTipoDiagnosticoPrincipalAC)
      CamposSinLlenar.push("Tipo diagnostico principal");
    if (!SelectConsultaRIPSAC1) CamposSinLlenar.push("Consulta RIPS.");
    if (!SelectDiagnosticoRIPSAC1) CamposSinLlenar.push("Diagnóstico RIPS.");

    if (CamposSinLlenar.length > 0) {
      Swal.fire({
        icon: "warning",
        html: `
                    <h4 style="color: #ffffff"><b> Los siguientes campos son obligatorios: </b></h4>
                    <br>
                    <ul style="text-align: left;">
                    ${CamposSinLlenar.map(
                      (campo) => `<li style="color: #ffffff"> ${campo}</li>`
                    ).join("")}
                    </ul>
                `,
        allowOutsideClick: false,
        allowEscapeKey: false,
      });
      return;
    } else {
      // console.log(ValoresCapturados);
      if (!SelectConsultaRIPSAC2) {
        SelectConsultaRIPSAC2 = "0";
      }
      if (!SelectDiagnosticoRIPSAC2) {
        SelectDiagnosticoRIPSAC2 = "0";
      }
      const AsignarRIPSAC = await fetch(
        `http://${servidor}:3000/api/RegistrarRips/${IdEvaluacionRIPSAC}/${SelectTipoUsuarioRIPSAC}/${SelectEntidadAC}/${SelectModalidadGrupoServicioTecnologiaSaludAC}/
                ${SelectGrupoServiciosAC}/${SelectServiciosAC}/${SelectFinalidadTecnologiaSaludAC}/${SelectCausaMotivoAtencion}/${SelectTipoDiagnosticoPrincipalAC}/${ViaIngresoAC}/${SelectConsultaRIPSAC1}/${SelectConsultaRIPSAC2}/
                ${SelectDiagnosticoRIPSAC1}/${SelectDiagnosticoRIPSAC2}/${TipoRipsRIPSAC}/${ValorIdFactura}/${ValorIdPresupuesto}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!AsignarRIPSAC) {
        throw new Error(
          `Error al obtener las entidades de RIPS: ${AsignarRIPSAC.statusText}`
        );
      }
      const CargarAsignarRIPSAC = await AsignarRIPSAC.json();
      // console.log('Entidades de RIPS AC: ', CargarAsignarRIPSAC);
      console.log(
        `%cRIPS AC asignado correctamente!`,
        "color: green; font-size: 16px;"
      );

      Swal.fire({
        icon: "success",
        html: `
                    <span style="color: #FFFFFF;">El RIPS ha sido asignado correctamente a la historia clínica con ID: ${IdEvaluacionRIPSAC}</span>
                `,
        allowOutsideClick: false,
        allowEscapeKey: false,
      }).then(function (respuesta) {
        LlenarSelectDeHistoriasClinicas();
        if (document.getElementById("BuscarPorFacturas").checked === true) {
          document.getElementById("BuscarPorFacturas").click();
        }

        if (document.getElementById("BuscarPorPresupuestos").checked === true) {
          document.getElementById("BuscarPorPresupuestos").click();
        }
      });
    }
  } else {
    Swal.fire({
      icon: "warning",
      html: `
                <span style="color: #FFFFFF;">Debes seleccionar una historia clínica y el tipo de RIPS [ AC ó AP ], para poder asignar el RIPS correctamente.</span>
            `,
      allowOutsideClick: false,
      allowEscapeKey: false,
    });
    return;
  }
};

btnRegistrarRIPS.addEventListener("click", async () => {
  // pruebaAlert();
  AsignarRIPS();
});
// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

// FUNCIONALIDAD PARA LAS HISTORIAS QUE SE ALMACENAN SIN RIPS
// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
async function NoAsignarRIPS() {
  const HistoriasSinRIPS = document.getElementById("HistoriasSinRIPS");
  const TextoOpcionSeleccionada =
    HistoriasSinRIPS.options[HistoriasSinRIPS.selectedIndex].textContent;
  const NombreDelPaciente = document.getElementById("NombrePaciente");

  if (
    HistoriasSinRIPS.value === "" ||
    HistoriasSinRIPS.value === "Sin Seleccionar"
  ) {
    Swal.fire({
      icon: "info",
      html: `
                <span style="color: #fff">Primero debes seleccionar una historia</span>
            `,
      allowOutsideClick: false,
      allowEscapeKey: false,
    });
  } else {
    Swal.fire({
      icon: "question",
      html: `
                <span style="color: #fff">¿Realmente deseas guardar esta historia sin asginarle ningún RIPS?</span>
                <br><br>
                <ul style="text-align: left;">
                    <li style="color: #ffffff">Nombre Paciente: ${NombreDelPaciente.value}</li>
                    <br>
                    <li style="color: #ffffff">Historia: ${TextoOpcionSeleccionada}</li>
                    <br>
                    <li style="color: #ffffff">Id Historia: ${HistoriasSinRIPS.value}</li>
                </ul>
            `,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showCancelButton: true,
      confirmButtonText: "Confirmar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
    }).then(async function (Respuesta) {
      if (Respuesta.isConfirmed) {
        console.log("Se confirmó");
        const GuardarSinRIPS = await fetch(
          `http://${servidor}:3000/api/TieneRips/${HistoriasSinRIPS.value}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        console.log(HistoriasSinRIPS.value);
        if (!GuardarSinRIPS.ok) {
          throw new Error(
            `Error al obtener los datos de evaluaciones: ${GuardarSinRIPS.statusText}`
          );
        }

        const datosEvaluaciones = await GuardarSinRIPS.json();
        console.log("Datos de evaluaciones: ", datosEvaluaciones);

        Swal.fire({
          icon: "success",
          html: `
                        <span style="color: #fff;">Historia sin RIPS guardada correctamente</span>
                    `,
          showConfirmButton: false,
          timer: 2000,
        }).then(function () {
          LlenarSelectDeHistoriasClinicas();
        });
      }
    });
  }
}

const BtnNoRegistrarRIPS = document.getElementById("BtnNoRegistrarRIPS");
BtnNoRegistrarRIPS.addEventListener("click", async () => {
  NoAsignarRIPS();
});
// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

const RegistrarRIPS = async () => {
  if (selectHistoriaClinica.value === "Sin Seleccionar") {
    const mensaje = `<span style="color: #fff">Seleccione una historia clinica por favor</span>`;
    Swal.fire({
      title: "Campo faltante",
      html: mensaje,
      icon: "question",
    });
    return;
  } else {
    if (radioAC.checked) {
      if (
        listaTipoUsuario.value == "Sin Seleccionar" ||
        listaEntidad.value == "Sin Seleccionar" ||
        listaCodConsulta.value == "Sin Seleccionar" ||
        listamodalidadAtencion.value == "Sin Seleccionar" ||
        listaGrupoServicios.value == "Sin Seleccionar" ||
        listaServicios.value == "Sin Seleccionar" ||
        listaFinalidad.value == "Sin Seleccionar" ||
        listaCausa.value == "Sin Seleccionar" ||
        listaTipoDiagnostico.value == "Sin Seleccionar"
      ) {
        // Array para almacenar los nombres de los campos que faltan
        let camposFaltantes = [];

        // Verificar cada campo y agregarlo al array si falta por llenar
        if (listaTipoUsuario.value == "Sin Seleccionar") {
          camposFaltantes.push("Tipo de Usuario");
          listaTipoUsuario.classList.add("campo-faltante");
        }
        if (listaEntidad.value == "Sin Seleccionar") {
          camposFaltantes.push("Entidad");
          listaEntidad.classList.add("campo-faltante");
        }
        if (listaCodConsulta.value == "Sin Seleccionar") {
          camposFaltantes.push("Código de Consulta");
          listaCodConsulta.classList.add("campo-faltante");
        }
        if (listamodalidadAtencion.value == "Sin Seleccionar") {
          camposFaltantes.push("Modalidad de Atención");
          listamodalidadAtencion.classList.add("campo-faltante");
        }
        if (listaGrupoServicios.value == "Sin Seleccionar") {
          camposFaltantes.push("Grupo de Servicios");
          listaGrupoServicios.classList.add("campo-faltante");
        }
        if (listaServicios.value == "Sin Seleccionar") {
          camposFaltantes.push("Servicios");
          listaServicios.classList.add("campo-faltante");
        }
        if (listaFinalidad.value == "Sin Seleccionar") {
          camposFaltantes.push("Finalidad");
          listaFinalidad.classList.add("campo-faltante");
        }
        if (listaCausa.value == "Sin Seleccionar") {
          camposFaltantes.push("Causa");
          listaCausa.classList.add("campo-faltante");
        }
        if (listaTipoDiagnostico.value == "Sin Seleccionar") {
          camposFaltantes.push("Tipo de Diagnóstico");
          listaTipoDiagnostico.classList.add("campo-faltante");
        }

        // Construir el mensaje del alert
        let mensaje = `<span style="color: #fff">Seleccione los siguientes campos obligatorios: <br></span><br>`;
        camposFaltantes.forEach((campo) => {
          mensaje += `<span style="color: #fff;">- ${campo}</span><br>`;
        });

        Swal.fire({
          icon: "error",
          title: "Faltan campos obligatorios por seleccionar",
          html: mensaje,
        });
        return;
      } else {
        insertarRIPSHC("AC");
      }
    }

    if (radioAP.checked) {
      if (
        listaTipoUsuario.value == "Sin Seleccionar" ||
        listaEntidad.value == "Sin Seleccionar" ||
        listaCodConsulta.value == "Sin Seleccionar" ||
        listamodalidadAtencion.value == "Sin Seleccionar" ||
        listaGrupoServicios.value == "Sin Seleccionar" ||
        listaServicios.value == "Sin Seleccionar" ||
        listaFinalidad.value == "Sin Seleccionar" ||
        listaViaIngreso.value == "Sin Seleccionar"
      ) {
        camposVaciosAP = [];

        if (listaTipoUsuario.value == "Sin Seleccionar") {
          camposVaciosAP.push("Tipo Usuario");
          listamodalidadAtencion.classList.add("campo-faltante");
        }

        if (listaEntidad.value == "Sin Seleccionar") {
          camposVaciosAP.push("Tipo Entidad");
          listamodalidadAtencion.classList.add("campo-faltante");
        }

        if (listaCodConsulta.value == "Sin Seleccionar") {
          camposVaciosAP.push("Tipo Usuario");
          listamodalidadAtencion.classList.add("campo-faltante");
        }

        if (listamodalidadAtencion.value == "Sin Seleccionar") {
          camposVaciosAP.push("Modalidad de atención");
          listamodalidadAtencion.classList.add("campo-faltante");
        }

        if (listaGrupoServicios.value == "Sin Seleccionar") {
          camposVaciosAP.push("Grupo Servicios");
          listamodalidadAtencion.classList.add("campo-faltante");
        }

        if (listaServicios.value == "Sin Seleccionar") {
          camposVaciosAP.push("Cod Servicios");
          listamodalidadAtencion.classList.add("campo-faltante");
        }

        if (listaFinalidad.value == "Sin Seleccionar") {
          camposVaciosAP.push("Lista Finalidad");
          listamodalidadAtencion.classList.add("campo-faltante");
        }

        if (listaViaIngreso.value == "Sin Seleccionar") {
          camposVaciosAP.push("Via ingreso");
        }

        // Construir el mensaje del alert
        let mensajeAP = `<span style="color: #fff">Seleccione los siguientes campos obligatorios: <br></span><br>`;
        camposFaltantes.forEach((campo) => {
          mensajeAP += `<span style="color: #fff;">- ${campo}</span><br>`;
        });

        Swal.fire({
          icon: "error",
          title: "Faltan campos obligatorios por seleccionar",
          html: mensajeAP,
        });
      } else {
        insertarRIPSHC("AP");
      }
    }
  }
};

// Función para quitar el borde rojo
function quitarBordeRojo(event) {
  event.target.classList.remove("campo-faltante");
}

const insertarRIPSHC = async (tipoInsertar) => {
  const listaTipoUsuario = document.getElementById("listaTipoUsuario");
  const listaEntidad = document.getElementById("listaEntidad");
  const listaCodConsulta = document.getElementById("listaCodConsulta");
  const listamodalidadAtencion = document.getElementById(
    "listamodalidadAtencion"
  );
  const listaGrupoServicios = document.getElementById("listaGrupoServicios");
  const listaServicios = document.getElementById("listaServicios");
  const listaFinalidad = document.getElementById("listaFinalidad");
  const listaCausa = document.getElementById("listaCausa");
  const listaViaIngreso = document.getElementById("listaViaIngreso");
  const listaDiagPrincipal = document.getElementById("listaDiagPrincipal");
  const listaDiagPrincipal1 = document.getElementById("listaDiagPrincipal1");
  const listaDiagPrincipal2 = document.getElementById("listaDiagPrincipal2");
  const listaDiagPrincipal3 = document.getElementById("listaDiagPrincipal3");
  const listaTipoDiagnostico = document.getElementById("listaTipoDiagnostico");

  const opcionListaHC = selectHistoriaClinica.value;
  const opcionListaTipoUsuario = listaTipoUsuario.value;
  const opcionDocumentoEntidad = listaEntidad.value;
  const opcionListaCodConsulta = listaCodConsulta.value;
  const opcionlistamodalidadAtencion = listamodalidadAtencion.value;
  const opcionListaGrupoServicios = listaGrupoServicios.value;
  const opcionListaServicios = listaServicios.value;
  const opcionListaFinalidad = listaFinalidad.value;
  const opcionListaCausa = listaCausa.value;
  const opcionListaViaIngreso = listaViaIngreso.value;
  const opcionListaDiagPrincipal = listaDiagPrincipal.value;
  const opcionListaDiagPrincipal1 = listaDiagPrincipal1.value;
  const opcionListaDiagPrincipal2 = listaDiagPrincipal2.value;
  const opcionListaDiagPrincipal3 = listaDiagPrincipal3.value;
  const opcionListaTipoDiagnostico = listaTipoDiagnostico.value;

  try {
    const response = await fetch(
      `http://${servidor}:3000/api/insertarRIPS/${tipoInsertar}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          opcionListaHC,
          opcionListaCodConsulta,
          opcionListaTipoUsuario,
          opcionDocumentoEntidad,
          opcionlistamodalidadAtencion,
          opcionListaGrupoServicios,
          opcionListaServicios,
          opcionListaFinalidad,
          opcionListaCausa,
          opcionListaDiagPrincipal,
          opcionListaDiagPrincipal1,
          opcionListaDiagPrincipal2,
          opcionListaDiagPrincipal3,
          opcionListaTipoDiagnostico,
          opcionListaViaIngreso,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Error en el insert");
      alert("Error al insertar");
    }

    const data = await response.text();
    alert(data); // Mensaje del servidor
  } catch (error) {
    console.error(error);
    alert("Error en el insert");
  }
};

async function ejecutarConsultasAC() {
  try {
    await getTipoUsuario();
    await getCodConsulta();
    await getmodalidadAtencion();
    await getGrupoServicios();
    await getServicios();
    await getFinalidadConsulta("Consulta");
    await getCausaExterna();
    await getCodDiganostico();
    await getTipoDiagnostico();
  } catch (error) {
    console.log("Error en la consulta que trae los AC");
    console.error(error);
  }
}

async function ejecutarConsultasAP() {
  try {
    await getTipoUsuario();
    await getCodConsulta();
    await getmodalidadAtencion();
    await getGrupoServicios();
    await getServicios();
    await getFinalidadConsulta("del Procedimiento");
    await getViaIngresoUsuario();
    await getCodDiganostico();
  } catch (error) {
    console.log("Error consulta que trae los AP");
    console.error(error);
  }
}

const updateEvaluacionesTablet = (evaluaciones) => {
  const selectHistoriaClinica = document.querySelector("#listaHC");
  selectHistoriaClinica.innerHTML = ""; // Limpiar opciones antiguas

  // Agregar opción "Sin Seleccionar" al principio
  const optionSinSeleccionar = document.createElement("option");
  optionSinSeleccionar.value = "Sin Seleccionar";
  optionSinSeleccionar.text = "Sin Seleccionar";
  selectHistoriaClinica.appendChild(optionSinSeleccionar);

  // Agregar opciones al select
  evaluaciones.forEach((evaluacion) => {
    const option = document.createElement("option");
    option.value = evaluacion.idEvaluacion;
    const fechaFormateada = new Date(evaluacion.fechaEvaluacion)
      .toISOString()
      .replace(/T/, " ")
      .replace(/\..+/, "");

    option.text = `${evaluacion.nombreUsuario} - documento: ${evaluacion.documentoUsuario} - Fecha: ${fechaFormateada} - ${evaluacion.nombreTipoEvaluacion}`;
    selectHistoriaClinica.appendChild(option);
  });
};

const getEvaluaciones = async (fechaInicio, fechaFin) => {
  try {
    const response = await fetch(
      `http://${servidor}:3000/api/evaluacionesRIPS/${fechaInicio}/${fechaFin}`
    );
    if (!response.ok) {
      throw new Error(
        `Error al obtener los datos de evaluaciones: ${response.statusText}`
      );
    }
    console.log(response);
    const evaluaciones = await response.json();

    updateEvaluacionesTablet(evaluaciones); // Llama a la función para actualizar la tabla
  } catch (ex) {
    Swal.fire({
      icon: "error",
      title: "Error",
      html: `
                <p><strong>Mensaje:</strong> ${ex.message}</p>
                <p><strong>Nombre:</strong> ${ex.name}</p>
                <p><strong>Pila:</strong> <pre>${ex.stack}</pre></p>
            `,
    });
    console.error(ex);
    alert(`Error: ${ex.message}`);
  }
};

const updateTipoUsuario = (tipoUsuarios) => {
  const selectTipoUsuarios = document.querySelector("#listaTipoUsuario");
  selectTipoUsuarios.innerHTML = ""; // Limpiar opciones antiguas

  // Agregar opción "Sin Seleccionar" al principio
  const optionSinSeleccionar = document.createElement("option");
  optionSinSeleccionar.value = "Sin Seleccionar";
  optionSinSeleccionar.text = "Sin Seleccionar";
  selectTipoUsuarios.appendChild(optionSinSeleccionar);

  // Agregar opciones al select
  tipoUsuarios.forEach((tipoUsuario) => {
    const option = document.createElement("option");
    option.value = tipoUsuario.idTipoRips;
    option.text = `${tipoUsuario.descripcionTipoRips}`;
    selectTipoUsuarios.appendChild(option);
  });
};

const getTipoUsuario = async () => {
  try {
    const response = await fetch(`http://${servidor}:3000/api/tipoUsuario`);
    if (!response.ok) {
      throw new Error(
        `Error al obtener los datos de Tipo de Usuario: ${response.statusText}`
      );
    }

    const tipoUsuario = await response.json();
    updateTipoUsuario(tipoUsuario);
  } catch (ex) {
    console.error(ex);
    alert(`Error: ${ex.message}`);
  }
};

const selectTipoUsuario = document.getElementById("listaTipoUsuario");

const updateTipoEntidad = (tipoEntidades) => {
  const selectTipoEntidad = document.querySelector("#listaEntidad");
  selectTipoEntidad.innerHTML = ""; // Limpiar opciones antiguas

  // Agregar opción "Sin Seleccionar" al principio
  const optionSinSeleccionar = document.createElement("option");
  optionSinSeleccionar.value = "Sin Seleccionar";
  optionSinSeleccionar.text = "Sin Seleccionar";
  selectTipoEntidad.appendChild(optionSinSeleccionar);

  // Agregar opciones al select
  tipoEntidades.forEach((tipoEntidad) => {
    const option = document.createElement("option");
    option.value = tipoEntidad.idEntidad;
    option.text = `${tipoEntidad.descripcionEntidad}`;
    selectTipoEntidad.appendChild(option);
  });
};

const getTipoEntidad = async (descripcionTipoRips) => {
  try {
    const response = await fetch(
      `http://${servidor}:3000/api/tipoEntidad/${descripcionTipoRips}`
    );
    if (!response.ok) {
      throw new Error(
        `Error al obtener los datos de Tipo de Entidad: ${response.statusText}`
      );
    }

    const tipoEntidad = await response.json();
    updateTipoEntidad(tipoEntidad);
  } catch (ex) {
    console.error(ex);
    alert(`Error: ${ex.message}`);
  }
};

const updateCodConsultaSelect = (codConsultas) => {
  const selectCodConsulta = document.querySelector("#listaCodConsulta");

  // Limpiar opciones antiguas
  selectCodConsulta.innerHTML = "";

  // Agregar opción "Sin Seleccionar" al principio
  const optionSinSeleccionar = document.createElement("option");
  optionSinSeleccionar.value = "Sin Seleccionar";
  optionSinSeleccionar.text = "Sin Seleccionar";
  selectCodConsulta.appendChild(optionSinSeleccionar);

  // Agregar opciones al select
  codConsultas.forEach((codConsulta) => {
    const option = document.createElement("option");
    option.value = codConsulta.codigoObjeto;
    option.text = `${codConsulta.codigoObjeto} - ${codConsulta.descripcionObjeto} `;
    selectCodConsulta.appendChild(option);
  });
};

const getCodConsulta = async () => {
  try {
    const response = await fetch(`http://${servidor}:3000/api/codConsulta`);
    if (!response.ok) {
      throw new Error(
        `Error al obtener los datos de codConsulta: ${response.statusText}`
      );
    }

    const codConsulta = await response.json();
    updateCodConsultaSelect(codConsulta);
  } catch (ex) {
    console.error(ex);
    alert(`Error: ${ex.message}`);
  }
};

// DESDE ACÁ COMIENZA EL CÓDIGO PARA ESCRIBIR EN EL INPUT EL CODIGO Y APAREZCA EN LA LISTA

// Crear un objeto que contenga la información de los selectores
var selectores = {
  inputCodConsulta: "listaCodConsulta",
  inputDiagPrincipal: "listaDiagPrincipal",
  inputDiagPrincipal1: "listaDiagPrincipal1",
  inputDiagPrincipal2: "listaDiagPrincipal2",
  inputDiagPrincipal3: "listaDiagPrincipal3",
};

// Asociar el evento input a todos los input de búsqueda
for (var inputId in selectores) {
  if (selectores.hasOwnProperty(inputId)) {
    // document.getElementById(inputId).addEventListener("input", function () {
    //     buscarElementoPorInput(this.id);
    // });
  }
}

// Función genérica para buscar un elemento por el valor de un input
function buscarElementoPorInput(inputId) {
  var inputValue = document.getElementById(inputId).value;
  var selectId = selectores[inputId];
  var select = document.getElementById(selectId);

  // Iterar sobre las opciones del select y seleccionar la que coincide con el valor del input
  for (var i = 0; i < select.options.length; i++) {
    var elementoValue = select.options[i].value;

    if (elementoValue === inputValue) {
      select.selectedIndex = i; // Seleccionar la opción si coincide
      return; // Salir de la función, ya que se encontró una coincidencia
    }
  }
}

// ACÁ TERMINA EL CÓDIGO PARA ESCRIBIR EN EL INPUT EL CODIGO Y APAREZCA EN LA LISTA

const updateModalidadAtencion = (modalidadAtenciones) => {
  const selectmodalidadAtencion = document.querySelector(
    "#listamodalidadAtencion"
  );
  selectmodalidadAtencion.innerHTML = ""; // Limpiar opciones antiguas

  // Agregar opción "Sin Seleccionar" al principio
  const optionSinSeleccionar = document.createElement("option");
  optionSinSeleccionar.value = "Sin Seleccionar";
  optionSinSeleccionar.text = "Sin Seleccionar";
  selectmodalidadAtencion.appendChild(optionSinSeleccionar);

  // Agregar opciones al select
  modalidadAtenciones.forEach((modalidadAtencion) => {
    const option = document.createElement("option");
    option.value = modalidadAtencion.codigoModalidad;
    option.text = `${modalidadAtencion.nombreModalidad}`;
    selectmodalidadAtencion.appendChild(option);
  });
};

const getmodalidadAtencion = async () => {
  try {
    const response = await fetch(
      `http://${servidor}:3000/api/modalidadAtencion`
    );
    if (!response.ok) {
      throw new Error(
        `Error al obtener los datos de Modalidad Atención: ${response.statusText}`
      );
    }

    const modalidadAtencion = await response.json();
    updateModalidadAtencion(modalidadAtencion);
  } catch (ex) {
    console.error(ex);
    alert(`Error: ${ex.message}`);
  }
};

const updateGrupoServicios = (grupoServicios) => {
  const selectGrupoServicios = document.querySelector("#listaGrupoServicios");
  selectGrupoServicios.innerHTML = ""; // Limpiar opciones antiguas

  // Agregar opción "Sin Seleccionar" al principio
  const optionSinSeleccionar = document.createElement("option");
  optionSinSeleccionar.value = "Sin Seleccionar";
  optionSinSeleccionar.text = "Sin Seleccionar";
  selectGrupoServicios.appendChild(optionSinSeleccionar);

  // Agregar opciones al select
  grupoServicios.forEach((grupoServicio) => {
    const option = document.createElement("option");
    option.value = grupoServicio.codigoServicios;
    option.text = `${grupoServicio.nombreServicios}`;
    selectGrupoServicios.appendChild(option);
  });
};

const getGrupoServicios = async () => {
  try {
    const response = await fetch(`http://${servidor}:3000/api/grupoServicios`);
    if (!response.ok) {
      throw new Error(
        `Error al obtener los datos de Grupo Servicios: ${response.statusText}`
      );
    }

    const grupoServicio = await response.json();
    updateGrupoServicios(grupoServicio);
  } catch (ex) {
    console.error(ex);
    alert(`Error: ${ex.message}`);
  }
};

const updateServicios = (Servicios) => {
  const selectServicios = document.querySelector("#listaServicios");
  selectServicios.innerHTML = ""; // Limpiar opciones antiguas

  // Agregar opción "Sin Seleccionar" al principio
  const optionSinSeleccionar = document.createElement("option");
  optionSinSeleccionar.value = "Sin Seleccionar";
  optionSinSeleccionar.text = "Sin Seleccionar";
  selectServicios.appendChild(optionSinSeleccionar);

  // Agregar opciones al select
  Servicios.forEach((Servicio) => {
    const option = document.createElement("option");
    option.value = Servicio.codigoServicios;
    option.text = `${Servicio.nombreServicios}`;
    selectServicios.appendChild(option);
  });
};

const getServicios = async () => {
  try {
    const response = await fetch(`http://${servidor}:3000/api/Servicios`);
    if (!response.ok) {
      throw new Error(
        `Error al obtener los datos de Servicios: ${response.statusText}`
      );
    }

    const Servicio = await response.json();
    updateServicios(Servicio);
  } catch (ex) {
    console.error(ex);
    alert(`Error: ${ex.message}`);
  }
};

const updateFinalidadConsulta = (finalidadConsulta) => {
  const selectFinalidadConsulta = document.querySelector("#listaFinalidad");
  selectFinalidadConsulta.innerHTML = ""; // Limpiar opciones antiguas

  // Agregar opción "Sin Seleccionar" al principio
  const optionSinSeleccionar = document.createElement("option");
  optionSinSeleccionar.value = "Sin Seleccionar";
  optionSinSeleccionar.text = "Sin Seleccionar";
  selectFinalidadConsulta.appendChild(optionSinSeleccionar);

  // Agregar opciones al select
  finalidadConsulta.forEach((Finalidad) => {
    const option = document.createElement("option");
    option.value = Finalidad.codigoFinalidad;
    option.text = `${Finalidad.nombreFinalidad}`;
    selectFinalidadConsulta.appendChild(option);
  });
};

const getFinalidadConsulta = async (tipoConsulta) => {
  try {
    const response = await fetch(
      `http://${servidor}:3000/api/finalidadConsulta/${tipoConsulta}`
    );
    if (!response.ok) {
      throw new Error(
        `Error al obtener los datos de Finalidad Consulta: ${response.statusText}`
      );

      console.log(tipoConsulta);
    }

    const finalidad = await response.json();
    updateFinalidadConsulta(finalidad);
  } catch (ex) {
    console.error(ex);
    alert(`Error: ${ex.message}`);
  }
};

const updateCausaExterna = (causaExterna) => {
  const selectCausaExterna = document.querySelector("#listaCausa");
  selectCausaExterna.innerHTML = ""; // Limpiar opciones antiguas

  // Agregar opción "Sin Seleccionar" al principio
  const optionSinSeleccionar = document.createElement("option");
  optionSinSeleccionar.value = "Sin Seleccionar";
  optionSinSeleccionar.text = "Sin Seleccionar";
  selectCausaExterna.appendChild(optionSinSeleccionar);

  // Agregar opciones al select
  causaExterna.forEach((Causa) => {
    const option = document.createElement("option");
    option.value = Causa.codigoCausa;
    option.text = `${Causa.nombreCausa}`;
    selectCausaExterna.appendChild(option);
  });
};

const getCausaExterna = async () => {
  try {
    const response = await fetch(`http://${servidor}:3000/api/causaExterna`);
    if (!response.ok) {
      throw new Error(
        `Error al obtener los datos de Causa Externa: ${response.statusText}`
      );
    }

    const Causa = await response.json();
    updateCausaExterna(Causa);
  } catch (ex) {
    console.error(ex);
    alert(`Error: ${ex.message}`);
  }
};

const updateCodDiagnostico = (codDiagnosticos) => {
  const selects = document.querySelectorAll(".listaDiagPrincipal"); // Selecciona todos los select con la clase listaDiagPrincipal
  selects.forEach((select) => {
    select.innerHTML = ""; // Limpiar opciones antiguas

    // Agregar opción "Sin Seleccionar" al principio
    const optionSinSeleccionar = document.createElement("option");
    optionSinSeleccionar.value = "";
    optionSinSeleccionar.text = "No Aplica";
    select.appendChild(optionSinSeleccionar);

    // Agregar opciones al select
    codDiagnosticos.forEach((codDiagnostico) => {
      const option = document.createElement("option");
      option.value = codDiagnostico.codigoObjeto;
      option.text = `${codDiagnostico.codigoObjeto} - ${codDiagnostico.descripcionObjeto} `;
      select.appendChild(option);
    });
  });
};

const getCodDiganostico = async () => {
  try {
    const response = await fetch(`http://${servidor}:3000/api/codDiagnostico`);
    if (!response.ok) {
      throw new Error(
        `Error al obtener los datos de Código Diagnóstico: ${response.statusText}`
      );
    }

    const codDiagnostico = await response.json();
    updateCodDiagnostico(codDiagnostico);
  } catch (ex) {
    console.error(ex);
    alert(`Error: ${ex.message}`);
  }
};

const updateTipoDiagnostico = (tipoDiagnosticos) => {
  const selectTipoDiagnostico = document.querySelector("#listaTipoDiagnostico");
  selectTipoDiagnostico.innerHTML = "";

  // Agregar opción "Sin Seleccionar" al principio
  const optionSinSeleccionar = document.createElement("option");
  optionSinSeleccionar.value = "Sin Seleccionar";
  optionSinSeleccionar.text = "Sin Seleccionar";
  selectTipoDiagnostico.appendChild(optionSinSeleccionar);

  // Agregar opciones al select
  tipoDiagnosticos.forEach((tipoDiagnostico) => {
    const option = document.createElement("option");
    option.value = tipoDiagnostico.codigoObjeto;
    option.text = `${tipoDiagnostico.descripcionObjeto} `;
    selectTipoDiagnostico.appendChild(option);
  });
};

const getTipoDiagnostico = async () => {
  try {
    const response = await fetch(`http://${servidor}:3000/api/tipoDiagnostico`);
    if (!response.ok) {
      throw new Error(
        `Error al obtener los datos de Tipo Diagnóstico Principal: ${response.statusText}`
      );
    }

    const tipoDiagnostico = await response.json();
    updateTipoDiagnostico(tipoDiagnostico);
  } catch (ex) {
    console.error(ex);
    alert(`Error: ${ex.message}`);
  }
};

const updateViaIngresoUsuario = (viaIngresoUsuarios) => {
  const selectViaIngresoUsuario = document.querySelector("#listaViaIngreso");
  selectViaIngresoUsuario.innerHTML = "";

  // Agregar opción "Sin Seleccionar" al principio
  const optionSinSeleccionar = document.createElement("option");
  optionSinSeleccionar.value = "Sin Seleccionar";
  optionSinSeleccionar.text = "Sin Seleccionar";
  selectViaIngresoUsuario.appendChild(optionSinSeleccionar);

  // Agregar opciones al select
  viaIngresoUsuarios.forEach((viaIngresoUsuario) => {
    const option = document.createElement("option");
    option.value = viaIngresoUsuario.codigoObjeto;
    option.text = `${viaIngresoUsuario.descripcionObjeto} `;
    selectViaIngresoUsuario.appendChild(option);
  });
};

const getViaIngresoUsuario = async () => {
  try {
    const response = await fetch(
      `http://${servidor}:3000/api/viaIngresoUsuario`
    );
    if (!response.ok) {
      throw new Error(
        `Error al obtener los datos de Via Ingreso usuario: ${response.statusText}`
      );
    }

    const viaIngresoUsuario = await response.json();
    updateViaIngresoUsuario(viaIngresoUsuario);
  } catch (ex) {
    console.error(ex);
    alert(`Error: ${ex.message}`);
  }
};

let fechaInicio;
let fechaFin;

const alerta = async () => {
  // Obtener las fechas almacenadas en localStorage
  const storedFechaInicio = localStorage.getItem("fechaInicio");
  const storedFechaFin = localStorage.getItem("fechaFin");

  const { value: formValues } = await Swal.fire({
    title: "Seleccione el rango de fecha para cargar los historias clinicas",
    html: `
            <label style="color: white;">FECHA INICIO</label>
            <input type="date" id="swal-input1" class="swal2-input" value="${
              storedFechaInicio || ""
            }">

            <label style="color: white;">FECHA FIN</label>
            <input type="date" id="swal-input2" class="swal2-input" value="${
              storedFechaFin || ""
            }">
        `,
    focusConfirm: false,
    preConfirm: () => {
      fechaInicio = document.getElementById("swal-input1").value;
      fechaFin = document.getElementById("swal-input2").value;

      // Validar que se hayan seleccionado ambas fechas
      if (fechaInicio && fechaFin) {
        // Almacenar las fechas en localStorage
        localStorage.setItem("fechaInicio", fechaInicio);
        localStorage.setItem("fechaFin", fechaFin);

        // Llamar a la función getPacientes con el rango de fechas seleccionado
        getEvaluaciones(fechaInicio, fechaFin);
      } else {
        // Mostrar un mensaje si falta alguna de las fechas
        Swal.showValidationMessage("Por favor, seleccione ambas fechas");
      }
    },
    allowOutsideClick: false, // Evitar que se cierre al hacer clic fuera del SweetAlert
  });

  if (formValues) {
    Swal.fire("Pacientes Cargados correctamente");
  }
};

window.addEventListener("load", async () => {
  // alerta();
  // ejecutar();
});

const BotonRegresar = document.getElementById("RegresarAPrincipal");
BotonRegresar.addEventListener("click", (e) => {
  window.location.href = "RIPS.html";
});

// ASIGNAR RIPS POR DEFECTO
const BotonModalAsignarRIPSPorDefecto = document.getElementById(
  "BotonModalAsignarRIPSPorDefecto"
);
const documentousuariologeado = sessionStorage.getItem(
  "documentousuariologeado"
);
const BotonGuardarRIPSPorDefecto = document.getElementById(
  "BotonGuardarRIPSPorDefecto"
);
const BotonActualizarRIPSPorDefecto = document.getElementById(
  "BotonActualizarRIPSPorDefecto"
);
const BotonEliminarRIPSPorDefecto = document.getElementById(
  "BotonEliminarRIPSPorDefecto"
);

BotonModalAsignarRIPSPorDefecto.addEventListener("click", function (e) {
  BotonGuardarRIPSPorDefecto.disabled = true;
  BotonActualizarRIPSPorDefecto.disabled = true;
  BotonVerRIPSPorDefectoo.disabled = true;
  BotonEliminarRIPSPorDefecto.disabled = true;
});
const SelectTipoRIPSPorDefecto = document.getElementById(
  "SelectTipoRIPSPorDefecto"
);
const ACPorDefecto = document.getElementById("ACPorDefecto");
const APPorDefecto = document.getElementById("APPorDefecto");
const BotonVerRIPSPorDefectoo = document.getElementById(
  "BotonVerRIPSPorDefecto"
);
SelectTipoRIPSPorDefecto.addEventListener("change", async function (e) {
  // Quitar la clase antes de aplicar estilos
  ACPorDefecto.classList.remove("d-none");
  APPorDefecto.classList.remove("d-none");
  switch (this.value) {
    case "1":
      ACPorDefecto.style.display = "block";
      APPorDefecto.style.display = "none";
      BotonVerRIPSPorDefectoo.disabled = false;
      const TieneRIPSACPorDefecto = await fetch(
        `http://${servidor}:3000/api/ConsultarRIPSPorDefecto/${documentousuariologeado}/1`
      );
      const RIPSACPorDefecto = await TieneRIPSACPorDefecto.json();
      if (RIPSACPorDefecto.length === 0) {
        BotonGuardarRIPSPorDefecto.disabled = false;
        BotonActualizarRIPSPorDefecto.disabled = true;
        BotonEliminarRIPSPorDefecto.disabled = true;
      } else {
        BotonGuardarRIPSPorDefecto.disabled = true;
        BotonActualizarRIPSPorDefecto.disabled = false;
        BotonEliminarRIPSPorDefecto.disabled = false;
      }
      TraerInfoParaRIPSACPorDefecto();
      break;

    case "2":
      ACPorDefecto.style.display = "none";
      APPorDefecto.style.display = "block";
      BotonVerRIPSPorDefectoo.disabled = false;
      const TieneRIPSAPPorDefecto = await fetch(
        `http://${servidor}:3000/api/ConsultarRIPSPorDefecto/${documentousuariologeado}/2`
      );
      const RIPSAPPorDefecto = await TieneRIPSAPPorDefecto.json();
      if (RIPSAPPorDefecto.length === 0) {
        BotonGuardarRIPSPorDefecto.disabled = false;
        BotonActualizarRIPSPorDefecto.disabled = true;
        BotonEliminarRIPSPorDefecto.disabled = true;
      } else {
        BotonGuardarRIPSPorDefecto.disabled = true;
        BotonActualizarRIPSPorDefecto.disabled = false;
        BotonEliminarRIPSPorDefecto.disabled = false;
      }
      TraerInfoParaRIPSACPPorDefecto();
      break;

    case "":
      ACPorDefecto.style.display = "none";
      APPorDefecto.style.display = "none";
      BotonGuardarRIPSPorDefecto.disabled = true;
      BotonActualizarRIPSPorDefecto.disabled = true;
      BotonEliminarRIPSPorDefecto.disabled = true;
      BotonVerRIPSPorDefectoo.disabled = true;
      break;

    default:
      console.error("Opción no válida");
      break;
  }
});

// FUNCIONALIDAD PARA EL LLENADO DE LOS CAMPOS QUE ASINGNAN LOS RIPS AC POR DEFECTO / PREESTABLECIDOS
const SelectPorDefectoTipoUsuarioRIPS = document.getElementById(
  "SelectPorDefectoTipoUsuarioRIPS"
);
const SelectPorDefectoEntidadAC = document.getElementById(
  "SelectPorDefectoEntidadAC"
);
const SelectPorDefectoModalidadGrupoServicioTecSalAC = document.getElementById(
  "SelectPorDefectoModalidadGrupoServicioTecSalAC"
);
const SelectPoDefectoGrupoServiciosAC = document.getElementById(
  "SelectPoDefectoGrupoServiciosAC"
);
const SelectPorDefectoCodigoServicioAC = document.getElementById(
  "SelectPorDefectoCodigoServicioAC"
);
const SelectPorDefectoFinalidadTecnologiaSaludAC = document.getElementById(
  "SelectPorDefectoFinalidadTecnologiaSaludAC"
);
const SelectPorDefectoCausaMotivoAtencionAC = document.getElementById(
  "SelectPorDefectoCausaMotivoAtencionAC"
);
const SelectPorDefectoTipoDiagnosticoPrincipalAC = document.getElementById(
  "SelectPorDefectoTipoDiagnosticoPrincipalAC"
);
const SelectPorDefectoConsultaRIPS1AC = document.getElementById(
  "SelectPorDefectoConsultaRIPS1AC"
);
const SelectPorDefectoConsultaRIPS2AC = document.getElementById(
  "SelectPorDefectoConsultaRIPS2AC"
);
const SelectPorDefectoDiagnosticoRIPSAC1 = document.getElementById(
  "SelectPorDefectoDiagnosticoRIPSAC1"
);
const SelectPorDefectoDiagnosticoRIPSAC2 = document.getElementById(
  "SelectPorDefectoDiagnosticoRIPSAC2"
);

const TraerInfoParaRIPSACPorDefecto = async function () {
  // Funcionalidad para el llenado del select de tipo de rips
  const TipoDeUsuarioRIPS = await fetch(
    `http://${servidor}:3000/api/TipodeRips`
  );
  if (!TipoDeUsuarioRIPS) {
    throw new Error(
      `Error al obtener los tipos de usuario RIPS: ${TipoDeUsuarioRIPS.statusText}`
    );
  }
  const CargarTipoDeUsuarioRIPS = await TipoDeUsuarioRIPS.json();
  // console.log('Tipos de Usuario RIPS: ', CargarTipoDeUsuarioRIPS);
  SelectPorDefectoTipoUsuarioRIPS.innerHTML = "";
  // Opción por defecto
  const defaultOption = document.createElement("option");
  defaultOption.textContent = "Seleccione un tipo de RIPS";
  defaultOption.value = "";
  SelectPorDefectoTipoUsuarioRIPS.appendChild(defaultOption);
  for (let i = 0; i < CargarTipoDeUsuarioRIPS.length; i += 1) {
    const option = document.createElement("option");
    option.value = CargarTipoDeUsuarioRIPS[i].IdTipoRips;
    option.textContent = CargarTipoDeUsuarioRIPS[i].TipoRips;
    SelectPorDefectoTipoUsuarioRIPS.appendChild(option);
  }

  // Funcionalidad para el llenado del select de ModalidadGrupoServicioTecnologíaSalud
  const ModalidadGrupoServicioTecnologiaSalud = await fetch(
    `http://${servidor}:3000/api/ModalidadAtencion`
  );
  if (!ModalidadGrupoServicioTecnologiaSalud) {
    throw new Error(
      `Error al obtener las modalidades de grupo servicio tecnología salud: ${ModalidadGrupoServicioTecnologiaSalud.statusText}`
    );
  }
  const CargarModalidadGrupoServicioTecnologiaSalud =
    await ModalidadGrupoServicioTecnologiaSalud.json();
  // console.log('Modalidades de Grupo Servicio Tecnología Salud: ', CargarModalidadGrupoServicioTecnologiaSalud);

  SelectPorDefectoModalidadGrupoServicioTecSalAC.innerHTML = "";
  // Opción por defecto
  const defaultOption2 = document.createElement("option");
  defaultOption2.textContent = "Seleccione una modalidad";
  defaultOption2.value = "";
  SelectPorDefectoModalidadGrupoServicioTecSalAC.appendChild(defaultOption2);

  // Ordenar el array por el nombre completo del paciente
  CargarModalidadGrupoServicioTecnologiaSalud.sort((a, b) => {
    if (a.NombreModalidadAtencion < b.NombreModalidadAtencion) return -1;
    if (a.NombreModalidadAtencion > b.NombreModalidadAtencion) return 1;
    return 0;
  });

  for (
    let i = 0;
    i < CargarModalidadGrupoServicioTecnologiaSalud.length;
    i += 1
  ) {
    const option = document.createElement("option");
    option.value = CargarModalidadGrupoServicioTecnologiaSalud[i].Codigo;
    option.textContent =
      CargarModalidadGrupoServicioTecnologiaSalud[i].NombreModalidadAtencion;
    SelectPorDefectoModalidadGrupoServicioTecSalAC.appendChild(option);
  }

  // Funcionalidad para el llenado del select de GrupoServiciosAC
  const GrupoServiciosAC = await fetch(
    `http://${servidor}:3000/api/GrupoServicios`
  );
  if (!GrupoServiciosAC) {
    throw new Error(
      `Error al obtener los grupos de servicios AC: ${GrupoServiciosAC.statusText}`
    );
  }
  const CargarGrupoServiciosAC = await GrupoServiciosAC.json();
  // console.log('Grupos de Servicios AC: ', CargarGrupoServiciosAC);
  SelectPoDefectoGrupoServiciosAC.innerHTML = "";
  // Opción por defecto
  const defaultOption3 = document.createElement("option");
  defaultOption3.textContent = "Seleccione un grupo";
  defaultOption3.value = "";
  SelectPoDefectoGrupoServiciosAC.appendChild(defaultOption3);
  // Ordenar el array por el nombre del grupo
  CargarGrupoServiciosAC.sort((a, b) => {
    if (a.NombreGrupoServicios < b.NombreGrupoServicios) return -1;
    if (a.NombreGrupoServicios > b.NombreGrupoServicios) return 1;
    return 0;
  });

  // Agregar las opciones al select de GrupoServiciosAC
  for (let i = 0; i < CargarGrupoServiciosAC.length; i += 1) {
    const option = document.createElement("option");
    option.value = CargarGrupoServiciosAC[i].Codigo;
    option.textContent = CargarGrupoServiciosAC[i].NombreGrupoServicios;
    SelectPoDefectoGrupoServiciosAC.appendChild(option);
  }

  // Funcionalidad para el llenado del select de FinalidadTecnologiaSalud
  const FinalidadParaAC = "AC";
  const FinalidadTecnologiaSaludAC = await fetch(
    `http://${servidor}:3000/api/FinalidadV2/${FinalidadParaAC}`
  );
  if (!FinalidadTecnologiaSaludAC) {
    throw new Error(
      `Error al obtener las finalidades para el tipo AC: ${FinalidadTecnologiaSaludAC.statusText}`
    );
  }
  const CargarFinalidadTecnologiaSaludAC =
    await FinalidadTecnologiaSaludAC.json();
  // console.log('Finalidades para el tipo AC: ', CargarFinalidadTecnologiaSaludAC);
  SelectPorDefectoFinalidadTecnologiaSaludAC.innerHTML = "";
  // Opción por defecto
  const defaultOption4 = document.createElement("option");
  defaultOption4.textContent = "Seleccione una finalidad";
  defaultOption4.value = "";
  SelectPorDefectoFinalidadTecnologiaSaludAC.appendChild(defaultOption4);
  // Ordenar el array por el nombre del grupo
  CargarFinalidadTecnologiaSaludAC.sort((a, b) => {
    if (
      a.NombreRIPSFinalidadConsultaVersion2 <
      b.NombreRIPSFinalidadConsultaVersion2
    )
      return -1;
    if (
      a.NombreRIPSFinalidadConsultaVersion2 >
      b.NombreRIPSFinalidadConsultaVersion2
    )
      return 1;
    return 0;
  });
  // Agregar las opciones al select de FinalidadTecnologiaSalud
  for (let i = 0; i < CargarFinalidadTecnologiaSaludAC.length; i += 1) {
    const option = document.createElement("option");
    option.value = CargarFinalidadTecnologiaSaludAC[i].Codigo;
    option.textContent =
      CargarFinalidadTecnologiaSaludAC[i].NombreRIPSFinalidadConsultaVersion2;
    SelectPorDefectoFinalidadTecnologiaSaludAC.appendChild(option);
  }

  // Funcionalidad para el llenado del select CausaMotivoAtención
  const CausaMotivoAtencion = await fetch(
    `http://${servidor}:3000/api/CausaExterna`
  );
  if (!CausaMotivoAtencion) {
    throw new Error(
      `Error al obtener las causas externas: ${CausaMotivoAtencion.statusText}`
    );
  }
  const CargarCausaMotivoAtencion = await CausaMotivoAtencion.json();
  // console.log('Causas externas: ', CargarCausaMotivoAtencion);
  SelectPorDefectoCausaMotivoAtencionAC.innerHTML = "";
  // Opción por defecto
  const defaultOption5 = document.createElement("option");
  defaultOption5.textContent = "Seleccione una causa externa";
  defaultOption5.value = "";
  SelectPorDefectoCausaMotivoAtencionAC.appendChild(defaultOption5);
  // Ordenar el array por el nombre del grupo
  CargarCausaMotivoAtencion.sort((a, b) => {
    if (a.NombreRIPSCausaExternaVersion2 < b.NombreRIPSCausaExternaVersion2)
      return -1;
    if (a.NombreRIPSCausaExternaVersion2 > b.NombreRIPSCausaExternaVersion2)
      return 1;
    return 0;
  });
  // Agregar las opciones al select de CausaMotivoAtencion
  for (let i = 0; i < CargarCausaMotivoAtencion.length; i += 1) {
    const option = document.createElement("option");
    option.value = CargarCausaMotivoAtencion[i].Codigo;
    option.textContent =
      CargarCausaMotivoAtencion[i].NombreRIPSCausaExternaVersion2;
    SelectPorDefectoCausaMotivoAtencionAC.appendChild(option);
  }

  // Funcionalidad para el llenado del select de TipoDiagnósticoPrincipal
  const TipoDiagnosticoPrincipal = await fetch(
    `http://${servidor}:3000/api/DXPrincipal`
  );
  if (!TipoDiagnosticoPrincipal) {
    throw new Error(
      `Error al obtener los tipos de diagnósticos principales: ${TipoDiagnosticoPrincipal.statusText}`
    );
  }
  const CargarTipoDiagnosticoPrincipal = await TipoDiagnosticoPrincipal.json();
  // console.log('Tipos de diagnósticos principales: ', CargarTipoDiagnosticoPrincipal);
  SelectPorDefectoTipoDiagnosticoPrincipalAC.innerHTML = "";
  // Opción por defecto
  const defaultOption6 = document.createElement("option");
  defaultOption6.textContent = "Seleccione un diagnóstico principal";
  defaultOption6.value = "";
  SelectPorDefectoTipoDiagnosticoPrincipalAC.appendChild(defaultOption6);
  // Ordenar el array por el nombre del grupo
  CargarTipoDiagnosticoPrincipal.sort((a, b) => {
    if (
      a.DescripcionTipodeDiagnósticoPrincipal <
      b.DescripcionTipodeDiagnósticoPrincipal
    )
      return -1;
    if (
      a.DescripcionTipodeDiagnósticoPrincipal >
      b.DescripcionTipodeDiagnósticoPrincipal
    )
      return 1;
    return 0;
  });
  // Agregar las opciones al select de TipoDiagnosticoPrincipal
  for (let i = 0; i < CargarTipoDiagnosticoPrincipal.length; i += 1) {
    const option = document.createElement("option");
    option.value =
      CargarTipoDiagnosticoPrincipal[i].CódigoTipodeDiagnósticoPrincipal;
    option.textContent =
      CargarTipoDiagnosticoPrincipal[i].DescripcionTipodeDiagnósticoPrincipal;
    SelectPorDefectoTipoDiagnosticoPrincipalAC.appendChild(option);
  }

  // Funcionalidad para el llenado del select de Consulta RIPS
  const TipoConsulta1 = "AC";
  const ConsultaRIPS1 = await fetch(
    `http://${servidor}:3000/api/Cups/${TipoConsulta1}`
  );
  if (!ConsultaRIPS1) {
    throw new Error(
      `Error al obtener las consultas RIPS: ${ConsultaRIPS1.statusText}`
    );
  }
  const CargarConsultaRIPS1 = await ConsultaRIPS1.json();
  // console.log('Consultas RIPS: ', CargarConsultaRIPS1);
  SelectPorDefectoConsultaRIPS1AC.innerHTML = "";
  // Opción por defecto
  const defaultOption7 = document.createElement("option");
  defaultOption7.textContent = "Seleccione una consulta RIPS 1";
  defaultOption7.value = "";
  SelectPorDefectoConsultaRIPS1AC.appendChild(defaultOption7);
  // Ordenar el array por el nombre del grupo
  CargarConsultaRIPS1.sort((a, b) => {
    if (a.Nombre < b.Nombre) return -1;
    if (a.Nombre > b.Nombre) return 1;
    return 0;
  });
  // Agregar las opciones al select de ConsultaRIPS
  for (let i = 0; i < CargarConsultaRIPS1.length; i += 1) {
    const option = document.createElement("option");
    option.value = CargarConsultaRIPS1[i].Codigo;
    option.textContent =
      CargarConsultaRIPS1[i].Codigo + " - " + CargarConsultaRIPS1[i].Nombre;
    SelectPorDefectoConsultaRIPS1AC.appendChild(option);
  }

  // Funcionalidad para el llenado del select de Consulta RIPS 2
  const TipoConsulta2 = "AC";
  const ConsultaRIPS2 = await fetch(
    `http://${servidor}:3000/api/Cups/${TipoConsulta2}`
  );
  if (!ConsultaRIPS2) {
    throw new Error(
      `Error al obtener las consultas RIPS: ${ConsultaRIPS2.statusText}`
    );
  }
  const CargarConsultaRIPS2 = await ConsultaRIPS2.json();
  // console.log('Consultas RIPS: ', CargarConsultaRIPS2);
  SelectPorDefectoConsultaRIPS2AC.innerHTML = "";
  // Opción por defecto
  const defaultOption8 = document.createElement("option");
  defaultOption8.textContent = "Seleccione una consulta RIPS 2";
  defaultOption8.value = "";
  SelectPorDefectoConsultaRIPS2AC.appendChild(defaultOption8);
  // Ordenar el array por el nombre del grupo
  CargarConsultaRIPS2.sort((a, b) => {
    if (a.Nombre < b.Nombre) return -1;
    if (a.Nombre > b.Nombre) return 1;
    return 0;
  });
  // Agregar las opciones al select de ConsultaRIPS 2
  for (let i = 0; i < CargarConsultaRIPS2.length; i += 1) {
    const option = document.createElement("option");
    option.value = CargarConsultaRIPS2[i].Codigo;
    option.textContent =
      CargarConsultaRIPS2[i].Codigo + " - " + CargarConsultaRIPS2[i].Nombre;
    SelectPorDefectoConsultaRIPS2AC.appendChild(option);
  }

  // Funcinalidad para el llenado del select Diagnósitoco RIPS AC 1
  const DiasnosticoRIPSAC1 = await fetch(`http://${servidor}:3000/api/Cie`);
  if (!DiasnosticoRIPSAC1) {
    throw new Error(
      `Error al obtener los diagnósticos RIPS: ${DiasnosticoRIPSAC1.statusText}`
    );
  }
  const CargarDiagnosticoRIPSAC1 = await DiasnosticoRIPSAC1.json();
  // console.log('Diagnósticos RIPS AC 1: ', CargarDiagnosticoRIPSAC1);
  SelectPorDefectoDiagnosticoRIPSAC1.innerHTML = "";
  // Opción por defecto
  const defaultOption9 = document.createElement("option");
  defaultOption9.textContent = "Seleccione un diagnóstico RIPS AC 1";
  defaultOption9.value = "";
  SelectPorDefectoDiagnosticoRIPSAC1.appendChild(defaultOption9);
  // Ordenar el array por el nombre del grupo
  CargarDiagnosticoRIPSAC1.sort((a, b) => {
    if (a.Nombre < b.Nombre) return -1;
    if (a.Nombre > b.Nombre) return 1;
    return 0;
  });
  // Agregar las opciones al select Diagnósitoco RIPS AC 1
  for (let i = 0; i < CargarDiagnosticoRIPSAC1.length; i += 1) {
    const option = document.createElement("option");
    option.value = CargarDiagnosticoRIPSAC1[i].Codigo;
    option.textContent =
      CargarDiagnosticoRIPSAC1[i].Codigo +
      " - " +
      CargarDiagnosticoRIPSAC1[i].Nombre;
    SelectPorDefectoDiagnosticoRIPSAC1.appendChild(option);
  }

  // Funcinalidad para el llenado del select Diagnósitoco RIPS AC 2
  const DiasnosticoRIPSAC2 = await fetch(`http://${servidor}:3000/api/Cie`);
  if (!DiasnosticoRIPSAC2) {
    throw new Error(
      `Error al obtener los diagnósticos RIPS: ${DiasnosticoRIPSAC2.statusText}`
    );
  }
  const CargarDiagnosticoRIPSAC2 = await DiasnosticoRIPSAC2.json();
  // console.log('Diagnósticos RIPS AC 1: ', CargarDiagnosticoRIPSAC2);
  SelectPorDefectoDiagnosticoRIPSAC2.innerHTML = "";
  // Opción por defecto
  const defaultOption10 = document.createElement("option");
  defaultOption10.textContent = "Seleccione un diagnóstico RIPS AC 2";
  defaultOption10.value = "";
  SelectPorDefectoDiagnosticoRIPSAC2.appendChild(defaultOption10);
  // Ordenar el array por el nombre del grupo
  CargarDiagnosticoRIPSAC2.sort((a, b) => {
    if (a.Nombre < b.Nombre) return -1;
    if (a.Nombre > b.Nombre) return 1;
    return 0;
  });
  // Agregar las opciones al select Diagnósitoco RIPS AC 1
  for (let i = 0; i < CargarDiagnosticoRIPSAC2.length; i += 1) {
    const option = document.createElement("option");
    option.value = CargarDiagnosticoRIPSAC2[i].Codigo;
    option.textContent =
      CargarDiagnosticoRIPSAC2[i].Codigo +
      " - " +
      CargarDiagnosticoRIPSAC2[i].Nombre;
    SelectPorDefectoDiagnosticoRIPSAC2.appendChild(option);
  }
};
SelectPorDefectoTipoUsuarioRIPS.addEventListener("change", async function (e) {
  try {
    if (this.value !== "") {
      const ValorSelectTipoUsuarioRIPS = this.value;
      // Funcionalidad para el llenado del select de entidad
      const EntidadResponsable = await fetch(
        `http://${servidor}:3000/api/Entidad/${ValorSelectTipoUsuarioRIPS}`
      );
      if (!EntidadResponsable) {
        throw new Error(
          `Error al obtener las entidades responsables: ${EntidadResponsable.statusText}`
        );
      }
      const CargarEntidadResponsable = await EntidadResponsable.json();
      // console.log('Entidades Responsables: ', CargarEntidadResponsable);

      SelectPorDefectoEntidadAC.innerHTML = "";
      // Opción por defecto
      const defaultOption = document.createElement("option");
      defaultOption.textContent = "Seleccione una entidad";
      defaultOption.value = "";
      SelectPorDefectoEntidadAC.appendChild(defaultOption);

      // Ordenar el array por el nombre completo del paciente
      CargarEntidadResponsable.sort((a, b) => {
        if (a.NombreCompletoPaciente < b.NombreCompletoPaciente) return -1;
        if (a.NombreCompletoPaciente > b.NombreCompletoPaciente) return 1;
        return 0;
      });

      for (let i = 0; i < CargarEntidadResponsable.length; i++) {
        const option = document.createElement("option");
        option.value = CargarEntidadResponsable[i].DocumentoEntidad;
        option.textContent = CargarEntidadResponsable[i].NombreCompletoPaciente;
        SelectPorDefectoEntidadAC.appendChild(option);
      }
    } else {
      SelectPorDefectoEntidadAC.innerHTML = "";
      // Opción por defecto
      const defaultOption = document.createElement("option");
      defaultOption.textContent = "Seleccione una entidad";
      defaultOption.value = "";
      SelectPorDefectoEntidadAC.appendChild(defaultOption);
    }
  } catch (error) {
    console.error(error);
  }
});
SelectPoDefectoGrupoServiciosAC.addEventListener("change", async function (e) {
  try {
    // console.log(this.value);
    const CargarServicios = await fetch(
      `http://${servidor}:3000/api/Servicios/${this.value}`
    );
    if (!CargarServicios.ok) {
      throw new Error(
        `Error al obtener los servicios: ${CargarServicios.statusText}`
      );
    }
    const CargarServiciosAC = await CargarServicios.json();
    // console.log('Servicios: ', CargarServiciosAC);

    SelectPorDefectoCodigoServicioAC.innerHTML = "";
    // Opción por defecto
    const defaultOption = document.createElement("option");
    defaultOption.textContent = "Seleccione un servicio";
    defaultOption.value = "";
    SelectPorDefectoCodigoServicioAC.appendChild(defaultOption);
    // Ordenar el array por el nombre del servicio
    CargarServiciosAC.sort((a, b) => {
      if (a["Nombre Servicios"] < b["Nombre Servicios"]) return -1;
      if (a["Nombre Servicios"] > b["Nombre Servicios"]) return 1;
      return 0;
    });

    for (let i = 0; i < CargarServiciosAC.length; i++) {
      const option = document.createElement("option");
      option.value = CargarServiciosAC[i]["Id Servicios"];
      option.textContent = CargarServiciosAC[i]["Nombre Servicios"];
      SelectPorDefectoCodigoServicioAC.appendChild(option);
    }
  } catch (error) {
    console.error(error);
  }
});
// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

// FUNCIONALIDAD PARA EL LLENADO DE LOS CAMPOS QUE ASINGNAN LOS RIPS AP POR DEFECTO / PREESTABLECIDOS
const SelectPorDefectoTipoUsuarioRIPSAP = document.getElementById(
  "SelectPorDefectoTipoUsuarioRIPSAP"
);
const SelectPorDefectoEntidadAP = document.getElementById(
  "SelectPorDefectoEntidadAP"
);
const SelectPorDefectoViaIngresoServicioSaludAP = document.getElementById(
  "SelectPorDefectoViaIngresoServicioSaludAP"
);
const SelectPorDefectoModalidadGrupoServicioTecSalAP = document.getElementById(
  "SelectPorDefectoModalidadGrupoServicioTecSalAP"
);
const SelectPorDefectoGrupoServiciosAP = document.getElementById(
  "SelectPorDefectoGrupoServiciosAP"
);
const SelectPorDefectoCodServicioAP = document.getElementById(
  "SelectPorDefectoCodServicioAP"
);
const SelectPorDefectoFinalidadTecnologíaSaludAP = document.getElementById(
  "SelectPorDefectoFinalidadTecnologíaSaludAP"
);
const SelectPorDefectoProcedimientoRIPSAP1 = document.getElementById(
  "SelectPorDefectoProcedimientoRIPSAP1"
);
const SelectPorDefectoProcedimientoRIPSAP2 = document.getElementById(
  "SelectPorDefectoProcedimientoRIPSAP2"
);
const SelectPorDefectoDiagnosticoRIPSAP1 = document.getElementById(
  "SelectPorDefectoDiagnosticoRIPSAP1"
);
const SelectPorDefectoDiagnosticoRIPSAP2 = document.getElementById(
  "SelectPorDefectoDiagnosticoRIPSAP2"
);

const TraerInfoParaRIPSACPPorDefecto = async function () {
  console.log("CONSULTADO INFORMACIÓN EN LA BASE DE DATOS PARA RIPS AP");
  // Funcionalidad para el llenado del select de tipo de rips
  const TipoDeUsuarioRIPS = await fetch(
    `http://${servidor}:3000/api/TipodeRips`
  );
  if (!TipoDeUsuarioRIPS) {
    throw new Error(
      `Error al obtener los tipos de usuario RIPS: ${TipoDeUsuarioRIPS.statusText}`
    );
  }
  const CargarTipoDeUsuarioRIPS = await TipoDeUsuarioRIPS.json();
  // console.log('Tipos de Usuario RIPS: ', CargarTipoDeUsuarioRIPS);
  SelectPorDefectoTipoUsuarioRIPSAP.innerHTML = "";
  // Opción por defecto
  const defaultOption = document.createElement("option");
  defaultOption.textContent = "Seleccione un tipo de RIPS";
  defaultOption.value = "";
  SelectPorDefectoTipoUsuarioRIPSAP.appendChild(defaultOption);
  for (let i = 0; i < CargarTipoDeUsuarioRIPS.length; i += 1) {
    const option = document.createElement("option");
    option.value = CargarTipoDeUsuarioRIPS[i].IdTipoRips;
    option.textContent = CargarTipoDeUsuarioRIPS[i].TipoRips;
    SelectPorDefectoTipoUsuarioRIPSAP.appendChild(option);
  }

  // Funcionalidad para el llendao del select ViaIngresoServicioSalud
  const ViaIngresoServicioSaludAP = await fetch(
    `http://${servidor}:3000/api/ViaIngresoUsuario`
  );
  if (!ViaIngresoServicioSaludAP) {
    throw new Error(
      `Error al obtener las vías de ingreso de usuario RIPS: ${ViaIngresoServicioSaludAP.statusText}`
    );
  }
  const CargarViaIngresoServicioSaludAP =
    await ViaIngresoServicioSaludAP.json();
  // console.log('Vias de Ingreso de Usuario RIPS AP: ', CargarViaIngresoServicioSaludAP);
  SelectPorDefectoViaIngresoServicioSaludAP.innerHTML = "";
  // Opción por defecto
  const defaultOption2 = document.createElement("option");
  defaultOption2.textContent = "Seleccione una via de ingreso";
  defaultOption2.value = "";
  SelectPorDefectoViaIngresoServicioSaludAP.appendChild(defaultOption2);
  // Ordenar el array por el nombre de la via de ingreso
  CargarViaIngresoServicioSaludAP.sort((a, b) => {
    if (a["NombreViaIngresoUsuario"] < b["NombreViaIngresoUsuario"]) return -1;
    if (a["NombreViaIngresoUsuario"] > b["NombreViaIngresoUsuario"]) return 1;
    return 0;
  });
  for (let i = 0; i < CargarViaIngresoServicioSaludAP.length; i++) {
    const option = document.createElement("option");
    option.value = CargarViaIngresoServicioSaludAP[i]["Codigo"];
    option.textContent =
      CargarViaIngresoServicioSaludAP[i]["NombreViaIngresoUsuario"];
    SelectPorDefectoViaIngresoServicioSaludAP.appendChild(option);
  }

  // Funcionalidad para el llenado del select ModalidadGrupoServicioTecSalAP
  const ModalidadGrupoServicioTecSalAP = await fetch(
    `http://${servidor}:3000/api/ModalidadAtencion`
  );
  if (!ModalidadGrupoServicioTecSalAP) {
    throw new Error(
      `Error al obtener las modalidades de grupo de servicios técnicos RIPS: ${ModalidadGrupoServicioTecSalAP.statusText}`
    );
  }
  const CargarModalidadGrupoServicioTecSalAP =
    await ModalidadGrupoServicioTecSalAP.json();
  // console.log('Modalidades de Grupo de Servicios Técnicos RIPS AP: ', CargarModalidadGrupoServicioTecSalAP);
  SelectPorDefectoModalidadGrupoServicioTecSalAP.innerHTML = "";
  // Opción por defecto
  const defaultOption3 = document.createElement("option");
  defaultOption3.textContent =
    "Seleccione una modalidad de grupo de servicios técnicos";
  defaultOption3.value = "";
  SelectPorDefectoModalidadGrupoServicioTecSalAP.appendChild(defaultOption3);
  // Ordenar el array por el nombre de la modalidad de grupo de servicios técnicos
  CargarModalidadGrupoServicioTecSalAP.sort((a, b) => {
    if (a["NombreModalidadAtencion"] < b["NombreModalidadAtencion"]) return -1;
    if (a["NombreModalidadAtencion"] > b["NombreModalidadAtencion"]) return 1;
    return 0;
  });
  for (let i = 0; i < CargarModalidadGrupoServicioTecSalAP.length; i++) {
    const option = document.createElement("option");
    option.value = CargarModalidadGrupoServicioTecSalAP[i]["Codigo"];
    option.textContent =
      CargarModalidadGrupoServicioTecSalAP[i]["NombreModalidadAtencion"];
    SelectPorDefectoModalidadGrupoServicioTecSalAP.appendChild(option);
  }

  //Funcionalidad para el llenado del select GrupoServiciosAP
  const GrupoServiciosAP = await fetch(
    `http://${servidor}:3000/api/GrupoServicios`
  );
  if (!GrupoServiciosAP) {
    throw new Error(
      `Error al obtener los grupos de servicios RIPS: ${GrupoServiciosAP.statusText}`
    );
  }
  const CargarGrupoServiciosAP = await GrupoServiciosAP.json();
  // console.log('Grupos de Servicios RIPS AP: ', CargarGrupoServiciosAP);
  SelectPorDefectoGrupoServiciosAP.innerHTML = "";
  // Opción por defecto
  const defaultOption4 = document.createElement("option");
  defaultOption4.textContent = "Seleccione un grupo de servicios";
  defaultOption4.value = "";
  SelectPorDefectoGrupoServiciosAP.appendChild(defaultOption4);
  // Ordenar el array por el nombre del grupo de servicios
  CargarGrupoServiciosAP.sort((a, b) => {
    if (a["NombreGrupoServicios"] < b["NombreGrupoServicios"]) return -1;
    if (a["NombreGrupoServicios"] > b["NombreGrupoServicios"]) return 1;
    return 0;
  });
  for (let i = 0; i < CargarGrupoServiciosAP.length; i++) {
    const option = document.createElement("option");
    option.value = CargarGrupoServiciosAP[i]["Codigo"];
    option.textContent = CargarGrupoServiciosAP[i]["NombreGrupoServicios"];
    SelectPorDefectoGrupoServiciosAP.appendChild(option);
  }

  // Funcionalidad para el llenado del select FinalidadTecnologiaSaludAP
  const FinalidadRIPSAP = "AP";
  const FinalidadTecnologiaSaludAP = await fetch(
    `http://${servidor}:3000/api/FinalidadV2/${FinalidadRIPSAP}`
  );
  if (!FinalidadTecnologiaSaludAP) {
    throw new Error(
      `Error al obtener las finalidades técnicas de salud RIPS: ${FinalidadTecnologiaSaludAP.statusText}`
    );
  }
  const CargarFinalidadTecnologiaSaludAP =
    await FinalidadTecnologiaSaludAP.json();
  // console.log('Finalidades Técnicas de Salud RIPS AP: ', CargarFinalidadTecnologiaSaludAP);
  SelectPorDefectoFinalidadTecnologíaSaludAP.innerHTML = "";
  // Opción por defecto
  const defaultOption5 = document.createElement("option");
  defaultOption5.textContent = "Seleccione una finalidad técnica de salud";
  defaultOption5.value = "";
  SelectPorDefectoFinalidadTecnologíaSaludAP.appendChild(defaultOption5);
  // Ordenar el array por el nombre de la finalidad técnica de salud
  CargarFinalidadTecnologiaSaludAP.sort((a, b) => {
    if (
      a["NombreRIPSFinalidadConsultaVersion2"] <
      b["NombreRIPSFinalidadConsultaVersion2"]
    )
      return -1;
    if (
      a["NombreRIPSFinalidadConsultaVersion2"] >
      b["NombreRIPSFinalidadConsultaVersion2"]
    )
      return 1;
    return 0;
  });
  for (let i = 0; i < CargarFinalidadTecnologiaSaludAP.length; i++) {
    const option = document.createElement("option");
    option.value = CargarFinalidadTecnologiaSaludAP[i]["Codigo"];
    option.textContent =
      CargarFinalidadTecnologiaSaludAP[i][
        "NombreRIPSFinalidadConsultaVersion2"
      ];
    SelectPorDefectoFinalidadTecnologíaSaludAP.appendChild(option);
  }

  // Funcionalidad para el llenado del select Procedimiento AP 1
  const TipoProcedimientoAP1 = "AP";
  const ProcedimientoAP1 = await fetch(
    `http://${servidor}:3000/api/Cups/${TipoProcedimientoAP1}`
  );
  if (!ProcedimientoAP1) {
    throw new Error(
      `Error al obtener los procedimientos AP 1: ${ProcedimientoAP1.statusText}`
    );
  }
  const CargarProcedimientoAP1 = await ProcedimientoAP1.json();
  // console.log('Procedimientos AP 1: ', CargarProcedimientoAP1);
  SelectPorDefectoProcedimientoRIPSAP1.innerHTML = "";
  // Opción por defecto
  const defaultOption6 = document.createElement("option");
  defaultOption6.textContent = "Seleccione un procedimiento AP 1";
  defaultOption6.value = "";
  SelectPorDefectoProcedimientoRIPSAP1.appendChild(defaultOption6);
  // Ordenar el array por el nombre del procedimiento
  CargarProcedimientoAP1.sort((a, b) => {
    if (a["Nombre"] < b["Nombre"]) return -1;
    if (a["Nombre"] > b["Nombre"]) return 1;
    return 0;
  });
  for (let i = 0; i < CargarProcedimientoAP1.length; i++) {
    const option = document.createElement("option");
    option.value = CargarProcedimientoAP1[i].Codigo;
    option.textContent =
      CargarProcedimientoAP1[i].Codigo +
      " - " +
      CargarProcedimientoAP1[i].Nombre;
    SelectPorDefectoProcedimientoRIPSAP1.appendChild(option);
  }

  // Funcionalidad para el llenado del select Procedimiento AP 2
  const TipoProcedimientoAP2 = "AP";
  const ProcedimientoAP2 = await fetch(
    `http://${servidor}:3000/api/Cups/${TipoProcedimientoAP2}`
  );
  if (!ProcedimientoAP2) {
    throw new Error(
      `Error al obtener los procedimientos AP 2: ${ProcedimientoAP2.statusText}`
    );
  }
  const CargarProcedimientoAP2 = await ProcedimientoAP2.json();
  // console.log('Procedimientos AP 2: ', CargarProcedimientoAP2);
  SelectPorDefectoProcedimientoRIPSAP2.innerHTML = "";
  // Opción por defecto
  const defaultOption7 = document.createElement("option");
  defaultOption7.textContent = "Seleccione un procedimiento AP 2";
  defaultOption7.value = "";
  SelectPorDefectoProcedimientoRIPSAP2.appendChild(defaultOption7);
  // Ordenar el array por el nombre del procedimiento
  CargarProcedimientoAP2.sort((a, b) => {
    if (a["Nombre"] < b["Nombre"]) return -1;
    if (a["Nombre"] > b["Nombre"]) return 1;
    return 0;
  });
  for (let i = 0; i < CargarProcedimientoAP2.length; i++) {
    const option = document.createElement("option");
    option.value = CargarProcedimientoAP2[i].Codigo;
    option.textContent =
      CargarProcedimientoAP2[i].Codigo +
      " - " +
      CargarProcedimientoAP2[i].Nombre;
    SelectPorDefectoProcedimientoRIPSAP2.appendChild(option);
  }

  // Funcionalidad para el llenado del Select Diagnostico AP 1
  const DiagnosticoAP1 = await fetch(`http://${servidor}:3000/api/Cie`);
  if (!DiagnosticoAP1) {
    throw new Error(
      `Error al obtener los diagnósticos AP 1: ${DiagnosticoAP1.statusText}`
    );
  }
  const CargarDiagnosticoAP1 = await DiagnosticoAP1.json();
  // console.log('Diagnósticos AP 1: ', CargarDiagnosticoAP1);
  SelectPorDefectoDiagnosticoRIPSAP1.innerHTML = "";
  // Opción por defecto
  const defaultOption8 = document.createElement("option");
  defaultOption8.textContent = "Seleccione un diagnóstico AP 1";
  defaultOption8.value = "";
  SelectPorDefectoDiagnosticoRIPSAP1.appendChild(defaultOption8);
  // Ordenar el array por el nombre del diagnóstico
  CargarDiagnosticoAP1.sort((a, b) => {
    if (a["Nombre"] < b["Nombre"]) return -1;
    if (a["Nombre"] > b["Nombre"]) return 1;
    return 0;
  });
  for (let i = 0; i < CargarDiagnosticoAP1.length; i++) {
    const option = document.createElement("option");
    option.value = CargarDiagnosticoAP1[i].Codigo;
    option.textContent =
      CargarDiagnosticoAP1[i].Codigo + " - " + CargarDiagnosticoAP1[i].Nombre;
    SelectPorDefectoDiagnosticoRIPSAP1.appendChild(option);
  }

  // Funcionalidad para el llenado del Select Diagnostico AP 2
  const DiagnosticoAP2 = await fetch(`http://${servidor}:3000/api/Cie`);
  if (!DiagnosticoAP2) {
    throw new Error(
      `Error al obtener los diagnósticos AP 1: ${DiagnosticoAP2.statusText}`
    );
  }
  const CargarDiagnosticoAP2 = await DiagnosticoAP2.json();
  // console.log('Diagnósticos AP 1: ', CargarDiagnosticoAP2);
  SelectPorDefectoDiagnosticoRIPSAP2.innerHTML = "";
  // Opción por defecto
  const defaultOption9 = document.createElement("option");
  defaultOption9.textContent = "Seleccione un diagnóstico AP 2";
  defaultOption9.value = "";
  SelectPorDefectoDiagnosticoRIPSAP2.appendChild(defaultOption9);
  // Ordenar el array por el nombre del diagnóstico
  CargarDiagnosticoAP2.sort((a, b) => {
    if (a["Nombre"] < b["Nombre"]) return -1;
    if (a["Nombre"] > b["Nombre"]) return 1;
    return 0;
  });
  for (let i = 0; i < CargarDiagnosticoAP2.length; i++) {
    const option = document.createElement("option");
    option.value = CargarDiagnosticoAP2[i].Codigo;
    option.textContent =
      CargarDiagnosticoAP2[i].Codigo + " - " + CargarDiagnosticoAP2[i].Nombre;
    SelectPorDefectoDiagnosticoRIPSAP2.appendChild(option);
  }
};
SelectPorDefectoTipoUsuarioRIPSAP.addEventListener(
  "change",
  async function (e) {
    try {
      if (this.value !== "") {
        const ValorSelectTipoUsuarioRIPS = this.value;
        // Funcionalidad para el llenado del select de entidad
        const EntidadResponsable = await fetch(
          `http://${servidor}:3000/api/Entidad/${ValorSelectTipoUsuarioRIPS}`
        );
        if (!EntidadResponsable) {
          throw new Error(
            `Error al obtener las entidades responsables: ${EntidadResponsable.statusText}`
          );
        }
        const CargarEntidadResponsable = await EntidadResponsable.json();
        // console.log('Entidades Responsables: ', CargarEntidadResponsable);

        SelectPorDefectoEntidadAP.innerHTML = "";
        // Opción por defecto
        const defaultOption = document.createElement("option");
        defaultOption.textContent = "Seleccione una entidad";
        defaultOption.value = "";
        SelectPorDefectoEntidadAP.appendChild(defaultOption);

        // Ordenar el array por el nombre completo del paciente
        CargarEntidadResponsable.sort((a, b) => {
          if (a.NombreCompletoPaciente < b.NombreCompletoPaciente) return -1;
          if (a.NombreCompletoPaciente > b.NombreCompletoPaciente) return 1;
          return 0;
        });

        for (let i = 0; i < CargarEntidadResponsable.length; i++) {
          const option = document.createElement("option");
          option.value = CargarEntidadResponsable[i].DocumentoEntidad;
          option.textContent =
            CargarEntidadResponsable[i].NombreCompletoPaciente;
          SelectPorDefectoEntidadAP.appendChild(option);
        }
      } else {
        SelectPorDefectoEntidadAP.innerHTML = "";
        // Opción por defecto
        const defaultOption = document.createElement("option");
        defaultOption.textContent = "Seleccione una entidad";
        defaultOption.value = "";
        SelectPorDefectoEntidadAP.appendChild(defaultOption);
      }
    } catch (error) {
      console.error(error);
    }
  }
);
SelectPorDefectoGrupoServiciosAP.addEventListener("change", async function (e) {
  try {
    // console.log(this.value);
    const CargarServicios = await fetch(
      `http://${servidor}:3000/api/Servicios/${this.value}`
    );
    if (!CargarServicios.ok) {
      throw new Error(
        `Error al obtener los servicios: ${CargarServicios.statusText}`
      );
    }
    const CargarServiciosAC = await CargarServicios.json();
    // console.log('Servicios: ', CargarServiciosAC);

    SelectPorDefectoCodServicioAP.innerHTML = "";
    // Opción por defecto
    const defaultOption = document.createElement("option");
    defaultOption.textContent = "Seleccione un servicio";
    defaultOption.value = "";
    SelectPorDefectoCodServicioAP.appendChild(defaultOption);
    // Ordenar el array por el nombre del servicio
    CargarServiciosAC.sort((a, b) => {
      if (a["Nombre Servicios"] < b["Nombre Servicios"]) return -1;
      if (a["Nombre Servicios"] > b["Nombre Servicios"]) return 1;
      return 0;
    });

    for (let i = 0; i < CargarServiciosAC.length; i++) {
      const option = document.createElement("option");
      option.value = CargarServiciosAC[i]["Id Servicios"];
      option.textContent = CargarServiciosAC[i]["Nombre Servicios"];
      SelectPorDefectoCodServicioAP.appendChild(option);
    }
  } catch (error) {
    console.error(error);
  }
});
// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

// FUNCIONALIDAD PARA VER SI EL PROFESIONAL TIENE RIPS POR DEFECTO Y DE TENERLOS, CUÁLES SON
const BotonVerRIPSPorDefecto = document.getElementById(
  "BotonVerRIPSPorDefecto"
);
BotonVerRIPSPorDefecto.addEventListener("click", async function (e) {
  const documentousuariologeado = sessionStorage.getItem(
    "documentousuariologeado"
  );
  switch (SelectTipoRIPSPorDefecto.value) {
    case "1":
      try {
        const ConsultarRIPSACPorDefecto = await fetch(
          `http://${servidor}:3000/api/ConsultarRIPSPorDefecto/${documentousuariologeado}/1`
        );
        if (!ConsultarRIPSACPorDefecto.ok) {
          throw new Error(
            `Error al obtener los datos: ${ConsultarRIPSACPorDefecto.statusText}`
          );
        }
        const ConsultarRIPSACPorDefectoAC =
          await ConsultarRIPSACPorDefecto.json();
        console.log("RIPS AC por defecto: ", ConsultarRIPSACPorDefectoAC);

        if (ConsultarRIPSACPorDefectoAC.length === 0) {
          alertify
            .alert(
              "",
              "El profesional que ha iniciado sesión no tiene RIPS AC por defecto registrados."
            )
            .set("basic", true)
            .set("movable", false)
            .resizeTo("60%", 250);
          return;
        } else {
          const TipoDeUsuarioAC =
            ConsultarRIPSACPorDefectoAC[0].TipoDeUsuario ?? "Sin asignar";
          const EntidadAC =
            ConsultarRIPSACPorDefectoAC[0].Entidad ?? "Sin asignar";
          const ModalidadGrupoServicioTecnologiaEnSaludAC =
            ConsultarRIPSACPorDefectoAC[0]
              .ModalidadGrupoServicioTecnologiaEnSalud ?? "Sin asignar";
          const GrupoServiciosAC =
            ConsultarRIPSACPorDefectoAC[0].GrupoServicios ?? "Sin asignar";
          const CodigoServicioAC =
            ConsultarRIPSACPorDefectoAC[0].CodigoServicio ?? "Sin asignar";
          const FinalidadTecnologiaSaludAC =
            ConsultarRIPSACPorDefectoAC[0].FinalidadTecnologiaSalud ??
            "Sin asignar";
          const Diagnostico1AC =
            ConsultarRIPSACPorDefectoAC[0].Diagnostico1 ?? "Sin asignar";
          const Diagnostico2AC =
            ConsultarRIPSACPorDefectoAC[0].Diagnostico2 ?? "Sin asignar";
          const Procedimiento1AC =
            ConsultarRIPSACPorDefectoAC[0].Procedimiento1 ?? "Sin asignar";
          const Procedimiento2AC =
            ConsultarRIPSACPorDefectoAC[0].Procedimiento2 ?? "Sin asignar";
          const CausaMotivoAtencionAC =
            ConsultarRIPSACPorDefectoAC[0].CausaMotivoAtencion ?? "Sin asignar";
          const TipoDiagnosticoPrincipalAC =
            ConsultarRIPSACPorDefectoAC[0].TipoDiagnosticoPrincipal ??
            "Sin asignar";
          alertify
            .alert(
              `RIPS AC POR DEFECTO`,
              `
                            <div class="row">
                                <div class="col-md-6">
                                    <ul>
                                        <li><strong>Tipo de usuario: </strong><br>${TipoDeUsuarioAC}</li>
                                    </ul>
                                </div>
            
                                <div class="col-md-6">
                                    <ul>
                                        <li><strong>Entidad: </strong><br>${EntidadAC}</li>
                                    </ul>
                                </div>
                            </div>

                            <div class="row">
                                <div class="col-md-6">
                                    <ul>
                                        <li><strong>ModalidadGrupoServicioTecSal: </strong><br>${ModalidadGrupoServicioTecnologiaEnSaludAC}</li>
                                    </ul>
                                </div>
            
                                <div class="col-md-6">
                                    <ul>
                                        <li><strong>GrupoServicios: </strong><br>${GrupoServiciosAC}</li>
                                    </ul>
                                </div>
                            </div>

                            <div class="row">
                                <div class="col-md-6">
                                    <ul>
                                        <li><strong>CodServicio: </strong><br>${CodigoServicioAC}</li>
                                    </ul>
                                </div>
            
                                <div class="col-md-6">
                                    <ul>
                                        <li><strong>FinalidadTecnologiaSalud: </strong><br>${FinalidadTecnologiaSaludAC}</li>
                                    </ul>
                                </div>
                            </div>

                            <div class="row">
                                <div class="col-md-6">
                                    <ul>
                                        <li><strong>CausaMotivoAtención: </strong><br>${CausaMotivoAtencionAC}</li>
                                    </ul>
                                </div>
            
                                <div class="col-md-6">
                                    <ul>
                                        <li><strong>TipoDiagnósticoPrincipal: </strong><br>${TipoDiagnosticoPrincipalAC}</li>
                                    </ul>
                                </div>
                            </div>

                            <div class="row">
                                <div class="col-md-6">
                                    <ul>
                                        <li><strong>Consulta RIPS 1: </strong><br>${Diagnostico1AC}</li>
                                    </ul>
                                </div>
            
                                <div class="col-md-6">
                                    <ul>
                                        <li><strong>Consulta RIPS 2: </strong><br>${Diagnostico2AC}</li>
                                    </ul>
                                </div>
                            </div>

                            <div class="row">
                                <div class="col-md-6">
                                    <ul>
                                        <li><strong>Diagnóstico RIPS 1: </strong><br>${Procedimiento1AC}</li>
                                    </ul>
                                </div>
            
                                <div class="col-md-6">
                                    <ul>
                                        <li><strong>Diagnóstico RIPS 2: </strong><br>${Procedimiento2AC}</li>
                                    </ul>
                                </div>
                            </div>
                        `
            )
            .set("modal", false)
            .set("resizable", true)
            .resizeTo("45%", 350);
        }
      } catch (Error) {
        console.error(
          `Se generó el siguiente error al mostrar RIPS AC por defecto -> ${Error}`
        );
      }
      break;

    case "2":
      // alertify.alert('This is a modeless dialog, not pinned to the screen.').set('modal', false).unpin();
      try {
        const ConsultarRIPSAPPorDefecto = await fetch(
          `http://${servidor}:3000/api/ConsultarRIPSPorDefecto/${documentousuariologeado}/2`
        );
        if (!ConsultarRIPSAPPorDefecto.ok) {
          throw new Error(
            `Error al obtener los datos: ${ConsultarRIPSAPPorDefecto.statusText}`
          );
        }
        const ConsultarRIPSAPPorDefectoAP =
          await ConsultarRIPSAPPorDefecto.json();
        // console.log(ConsultarRIPSAPPorDefectoAP);

        if (ConsultarRIPSAPPorDefectoAP.length === 0) {
          alertify
            .alert(
              "",
              "El profesional que ha iniciado sesión no tiene RIPS AP por defecto registrados."
            )
            .set("basic", true)
            .set("movable", false);
          return;
        } else {
          const TipoDeUsuario =
            ConsultarRIPSAPPorDefectoAP[0].TipoDeUsuario ?? "Sin asignar";
          const Entidad =
            ConsultarRIPSAPPorDefectoAP[0].Entidad ?? "Sin asignar";
          const ViaIngresoServicioSalud =
            ConsultarRIPSAPPorDefectoAP[0].ViaIngresoServicioSalud ??
            "Sin asignar";
          const ModalidadGrupoServicioTecnologiaEnSalud =
            ConsultarRIPSAPPorDefectoAP[0]
              .ModalidadGrupoServicioTecnologiaEnSalud ?? "Sin asignar";
          const GrupoServicios =
            ConsultarRIPSAPPorDefectoAP[0].GrupoServicios ?? "Sin asignar";
          const CodigoServicio =
            ConsultarRIPSAPPorDefectoAP[0].CodigoServicio ?? "Sin asignar";
          const FinalidadTecnologiaSalud =
            ConsultarRIPSAPPorDefectoAP[0].FinalidadTecnologiaSalud ??
            "Sin asignar";
          const Diagnostico1 =
            ConsultarRIPSAPPorDefectoAP[0].Diagnostico1 ?? "Sin asignar";
          const Diagnostico2 =
            ConsultarRIPSAPPorDefectoAP[0].Diagnostico2 ?? "Sin asignar";
          const Procedimiento1 =
            ConsultarRIPSAPPorDefectoAP[0].Procedimiento1 ?? "Sin asignar";
          const Procedimiento2 =
            ConsultarRIPSAPPorDefectoAP[0].Procedimiento2 ?? "Sin asignar";
          alertify
            .alert(
              `RIPS AP POR DEFECTO`,
              `    
                        <div class="row">
                            <div class="col-md-6">
                                <ul>
                                    <li><strong>Tipo de usuario: </strong><br>${TipoDeUsuario}</li>
                                </ul>
                            </div>
        
                            <div class="col-md-6">
                                <ul>
                                    <li><strong>Entidad: </strong><br>${Entidad}</li>
                                </ul>
                            </div>
                        </div>
        
                        <div class="row">
                            <div class="col-md-6">
                                <ul>
                                    <li><strong>ViaIngresoServicioSalud: </strong><br>${ViaIngresoServicioSalud}</li>
                                </ul>
                            </div>
        
                            <div class="col-md-6">
                                <ul>
                                    <li><strong>ModalidadGrupoServicioTecSal: </strong><br>${ModalidadGrupoServicioTecnologiaEnSalud}</li>
                                </ul>
                            </div>
                        </div>
        
                        <div class="row">
                            <div class="col-md-6">
                                <ul>
                                    <li><strong>GrupoServicios: </strong><br>${GrupoServicios}</li>
                                </ul>
                            </div>
        
                            <div class="col-md-6">
                                <ul>
                                    <li><strong>CodServicio: </strong><br>${CodigoServicio}</li>
                                </ul>
                            </div>
                        </div>
        
                        <div class="row">
                            <div class="col-md-6">
                                <ul>
                                    <li><strong>FinalidadTecnologíaSalud: </strong><br>${FinalidadTecnologiaSalud}</li>
                                </ul>
                            </div>
        
                            <div class="col-md-6">
                                <ul>
                                    <li><strong>Procedimiento RIPS 1: </strong><br>${Diagnostico1}</li>
                                </ul>
                            </div>
                        </div>
        
                        <div class="row">
                            <div class="col-md-6">
                                <ul>
                                    <li><strong>Procedimiento RIPS 2: </strong><br>${Diagnostico2}</li>
                                </ul>
                            </div>
        
                            <div class="col-md-6">
                                <ul>
                                    <li><strong>Diagnóstico RIPS 1: </strong><br>${Procedimiento1}</li>
                                </ul>
                            </div>
                        </div>
        
                        <div class="row">
                            <div class="col-md-6">
                                <ul>
                                    <li><strong>Diagnóstico RIPS 2: </strong><br>${Procedimiento2}</li>
                                </ul>
                            </div>
                        </div>
                        
                        `
            )
            .set("modal", false)
            .set("resizable", true)
            .resizeTo("45%", 350);
        }
      } catch (Error) {
        console.error(`Se generó el siguiente error -> ${Error}`);
      }
      break;
  }
});
// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

// FUNCIONALIDAD PARA LIMPIAR/REINICAR LOS CAMPOS DEL MODAL PARA ASIGNACIÓN DE RIPS POR DEFECTOS, AL MOMENTO DE CERRAR
const Boton1CerrarModalAsignarRIPSPordefecto = document.getElementById(
  "Boton1CerrarModalAsignarRIPSPordefecto"
);
const Boton2CerrarModalAsignarRIPSPordefecto = document.getElementById(
  "Boton2CerrarModalAsignarRIPSPordefecto"
);
const ModalRIPSPorDefecto = document.getElementById("ModalRIPSPorDefecto");
// Función para reiniciar el valor del select y despachar un evento 'change'
function reiniciarSelect() {
  // Reiniciar el valor del select
  SelectTipoRIPSPorDefecto.value = "";

  // Crear y despachar un evento 'change'
  const event = new Event("change", {
    bubbles: true,
    cancelable: true,
  });
  SelectTipoRIPSPorDefecto.dispatchEvent(event);

  const selects = ModalRIPSPorDefecto.querySelectorAll("select");
  selects.forEach((select) => {
    // Excluir el select con id 'selectExcluido'
    if (select.id !== "SelectTipoRIPSPorDefecto") {
      select.innerHTML = ""; // Vaciar las opciones
    }
  });
}
Boton1CerrarModalAsignarRIPSPordefecto.addEventListener(
  "click",
  reiniciarSelect
);
Boton2CerrarModalAsignarRIPSPordefecto.addEventListener(
  "click",
  reiniciarSelect
);
// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

// FUNCIONALIDAD CRUD PARA RIPS POR DEFECTO (GUARDAR, ACTULIZAR Y ELIMINAR)
async function GuardarRIPSPorDefecto() {
  const SelectTipoRIPSPorDefecto = document.getElementById(
    "SelectTipoRIPSPorDefecto"
  ).value;
  switch (SelectTipoRIPSPorDefecto) {
    case "1":
      const SelectPorDefectoTipoUsuarioRIPS =
        document.getElementById("SelectPorDefectoTipoUsuarioRIPS").value ??
        null;
      const SelectPorDefectoEntidadAC =
        document.getElementById("SelectPorDefectoEntidadAC").value ?? null;
      const SelectPorDefectoModalidadGrupoServicioTecSalAC =
        document.getElementById(
          "SelectPorDefectoModalidadGrupoServicioTecSalAC"
        ).value ?? null;
      const SelectPoDefectoGrupoServiciosAC =
        document.getElementById("SelectPoDefectoGrupoServiciosAC").value ??
        null;
      const SelectPorDefectoCodigoServicioAC =
        document.getElementById("SelectPorDefectoCodigoServicioAC").value ??
        null;
      const SelectPorDefectoFinalidadTecnologiaSaludAC =
        document.getElementById("SelectPorDefectoFinalidadTecnologiaSaludAC")
          .value ?? null;
      const SelectPorDefectoCausaMotivoAtencionAC =
        document.getElementById("SelectPorDefectoCausaMotivoAtencionAC")
          .value ?? null;
      const SelectPorDefectoTipoDiagnosticoPrincipalAC =
        document.getElementById("SelectPorDefectoTipoDiagnosticoPrincipalAC")
          .value ?? null;
      const SelectPorDefectoConsultaRIPS1AC =
        document.getElementById("SelectPorDefectoConsultaRIPS1AC").value ??
        null;
      const SelectPorDefectoConsultaRIPS2AC =
        document.getElementById("SelectPorDefectoConsultaRIPS2AC").value ??
        null;
      const SelectPorDefectoDiagnosticoRIPSAC1 =
        document.getElementById("SelectPorDefectoDiagnosticoRIPSAC1").value ??
        null;
      const SelectPorDefectoDiagnosticoRIPSAC2 =
        document.getElementById("SelectPorDefectoDiagnosticoRIPSAC2").value ??
        null;

      // Se organizan datos de envío
      const Datos = {
        DocumentoProfesional: documentousuariologeado,
        TipoRIPS: SelectTipoRIPSPorDefecto,
        TipoUsuario: SelectPorDefectoTipoUsuarioRIPS,
        Entidad: SelectPorDefectoEntidadAC,
        ModalidadGrupoServicioTecSal:
          SelectPorDefectoModalidadGrupoServicioTecSalAC,
        GrupoServicio: SelectPoDefectoGrupoServiciosAC,
        CodigoServicio: SelectPorDefectoCodigoServicioAC,
        FinalidadTecnologiaSalud: SelectPorDefectoFinalidadTecnologiaSaludAC,
        CausaMotivoAtencion: SelectPorDefectoCausaMotivoAtencionAC,
        TipoDiagnosticoPrincipal: SelectPorDefectoTipoDiagnosticoPrincipalAC,
        ConsultaRIPS1: SelectPorDefectoConsultaRIPS1AC,
        ConsultaRIPS2: SelectPorDefectoConsultaRIPS2AC,
        DiagnosticoRIPS1: SelectPorDefectoDiagnosticoRIPSAC1,
        DiagnosticoRIPS2: SelectPorDefectoDiagnosticoRIPSAC2,
      };

      const GuardarRIPSACPorDefecto = await fetch(
        `http://${servidor}:3000/api/GuardarRIPSPorDefecto`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(Datos),
        }
      );

      if (GuardarRIPSACPorDefecto.ok) {
        const respuesta = await GuardarRIPSACPorDefecto.json();
        console.log("Respuesta del servidor:", respuesta);
        Swal.fire({
          icon: "success",
          html: `
                        <strong class="text-light">El RIPS AC por defecto se guardó correctamente</strong>
                    `,
        });
        reiniciarSelect();
      } else {
        Swal.fire({
          icon: "error",
          title: "Error al guardar el RIPS AC por defecto",
          text: "Por favor, intente nuevamente.",
        });
        console.error("Error en la solicitud:", GuardarRIPSACPorDefecto.status);
      }

      // Codiguitoooooooooooooooo
      // const ACPorDefecto = document.getElementById('ACPorDefecto');
      // const Valores = ACPorDefecto.querySelectorAll('select');

      // Valores.forEach(select => {
      //     // Excluir el select con id 'selectExcluido'
      //     // if (select.id !== 'SelectTipoRIPSPorDefecto') {
      //     //     select.innerHTML = ''; // Vaciar las opciones
      //     // }
      //     console.log(select.id);
      // });
      // FIN FIN FIN FIN DE Codiguitoooooooooooooooo
      break;
    case "2":
      const SelectPorDefectoTipoUsuarioRIPSAP =
        document.getElementById("SelectPorDefectoTipoUsuarioRIPSAP").value ??
        null;
      const SelectPorDefectoEntidadAP =
        document.getElementById("SelectPorDefectoEntidadAP").value ?? null;
      const SelectPorDefectoViaIngresoServicioSaludAP =
        document.getElementById("SelectPorDefectoViaIngresoServicioSaludAP")
          .value ?? null;
      const SelectPorDefectoModalidadGrupoServicioTecSalAP =
        document.getElementById(
          "SelectPorDefectoModalidadGrupoServicioTecSalAP"
        ).value ?? null;
      const SelectPorDefectoGrupoServiciosAP =
        document.getElementById("SelectPorDefectoGrupoServiciosAP").value ??
        null;
      const SelectPorDefectoCodServicioAP =
        document.getElementById("SelectPorDefectoCodServicioAP").value ?? null;
      const SelectPorDefectoFinalidadTecnologíaSaludAP =
        document.getElementById("SelectPorDefectoFinalidadTecnologíaSaludAP")
          .value ?? null;
      const SelectPorDefectoProcedimientoRIPSAP1 =
        document.getElementById("SelectPorDefectoProcedimientoRIPSAP1").value ??
        null;
      const SelectPorDefectoProcedimientoRIPSAP2 =
        document.getElementById("SelectPorDefectoProcedimientoRIPSAP2").value ??
        null;
      const SelectPorDefectoDiagnosticoRIPSAP1 =
        document.getElementById("SelectPorDefectoDiagnosticoRIPSAP1").value ??
        null;
      const SelectPorDefectoDiagnosticoRIPSAP2 =
        document.getElementById("SelectPorDefectoDiagnosticoRIPSAP2").value ??
        null;

      // Se organizan datos de envío
      const DatosAP = {
        DocumentoProfesional: documentousuariologeado,
        TipoRIPS: SelectTipoRIPSPorDefecto,
        TipoUsuario: SelectPorDefectoTipoUsuarioRIPSAP,
        Entidad: SelectPorDefectoEntidadAP,
        ViaIngresoServicioSalud: SelectPorDefectoViaIngresoServicioSaludAP,
        ModalidadGrupoServicioTecSal:
          SelectPorDefectoModalidadGrupoServicioTecSalAP,
        GrupoServicio: SelectPorDefectoGrupoServiciosAP,
        CodigoServicio: SelectPorDefectoCodServicioAP,
        FinalidadTecnologiaSalud: SelectPorDefectoFinalidadTecnologíaSaludAP,
        ConsultaRIPS1: SelectPorDefectoProcedimientoRIPSAP1,
        ConsultaRIPS2: SelectPorDefectoProcedimientoRIPSAP2,
        DiagnosticoRIPS1: SelectPorDefectoDiagnosticoRIPSAP1,
        DiagnosticoRIPS2: SelectPorDefectoDiagnosticoRIPSAP2,
      };

      const GuardarRIPSAPPorDefecto = await fetch(
        `http://${servidor}:3000/api/GuardarRIPSPorDefecto`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(DatosAP),
        }
      );
      if (GuardarRIPSAPPorDefecto.ok) {
        const respuesta = await GuardarRIPSAPPorDefecto.json();
        console.log("Respuesta del servidor:", respuesta);
        Swal.fire({
          icon: "success",
          html: `
                        <strong class="text-light">El RIPS AP por defecto se guardó correctamente</strong>
                    `,
        });
        reiniciarSelect();
      } else {
        Swal.fire({
          icon: "error",
          text: "Error al guardar el RIPS AP por defecto",
        });
        console.error("Error en la solicitud:", GuardarRIPSAPPorDefecto.status);
      }

      // Codiguitoooooooooooooooo
      // const APPorDefecto = document.getElementById('APPorDefecto');
      // const ValoresAP = APPorDefecto.querySelectorAll('select');

      // ValoresAP.forEach(select => {
      //     // Excluir el select con id 'selectExcluido'
      //     // if (select.id !== 'SelectTipoRIPSPorDefecto') {
      //     //     select.innerHTML = ''; // Vaciar las opciones
      //     // }
      //     console.log(`const ${select.id} = document.getElementById('${select.id}');`);
      // });
      // FIN FIN FIN FIN DE Codiguitoooooooooooooooo
      break;
    case "3":
      // await GuardarRIPS3();
      break;
    default:
      Swal.fire({
        icon: "error",
        text: "SELECCIONE UN TIPO DE RIPS",
      });
  }
}

async function ActualizarRIPSPorDefecto() {
  const NombreTipoRIPS =
    SelectTipoRIPSPorDefecto.options[SelectTipoRIPSPorDefecto.selectedIndex]
      .text;
  switch (SelectTipoRIPSPorDefecto.value) {
    case "1":
      const SelectPorDefectoTipoUsuarioRIPS =
        document.getElementById("SelectPorDefectoTipoUsuarioRIPS").value ??
        null;
      const SelectPorDefectoEntidadAC =
        document.getElementById("SelectPorDefectoEntidadAC").value ?? null;
      const SelectPorDefectoModalidadGrupoServicioTecSalAC =
        document.getElementById(
          "SelectPorDefectoModalidadGrupoServicioTecSalAC"
        ).value ?? null;
      const SelectPoDefectoGrupoServiciosAC =
        document.getElementById("SelectPoDefectoGrupoServiciosAC").value ??
        null;
      const SelectPorDefectoCodigoServicioAC =
        document.getElementById("SelectPorDefectoCodigoServicioAC").value ??
        null;
      const SelectPorDefectoFinalidadTecnologiaSaludAC =
        document.getElementById("SelectPorDefectoFinalidadTecnologiaSaludAC")
          .value ?? null;
      const SelectPorDefectoCausaMotivoAtencionAC =
        document.getElementById("SelectPorDefectoCausaMotivoAtencionAC")
          .value ?? null;
      const SelectPorDefectoTipoDiagnosticoPrincipalAC =
        document.getElementById("SelectPorDefectoTipoDiagnosticoPrincipalAC")
          .value ?? null;
      const SelectPorDefectoConsultaRIPS1AC =
        document.getElementById("SelectPorDefectoConsultaRIPS1AC").value ??
        null;
      const SelectPorDefectoConsultaRIPS2AC =
        document.getElementById("SelectPorDefectoConsultaRIPS2AC").value ??
        null;
      const SelectPorDefectoDiagnosticoRIPSAC1 =
        document.getElementById("SelectPorDefectoDiagnosticoRIPSAC1").value ??
        null;
      const SelectPorDefectoDiagnosticoRIPSAC2 =
        document.getElementById("SelectPorDefectoDiagnosticoRIPSAC2").value ??
        null;

      // Se organizan datos de envío
      const Datos = {
        DocumentoProfesional: documentousuariologeado,
        TipoRIPS: SelectTipoRIPSPorDefecto.value,
        TipoUsuario: SelectPorDefectoTipoUsuarioRIPS,
        Entidad: SelectPorDefectoEntidadAC,
        ModalidadGrupoServicioTecSal:
          SelectPorDefectoModalidadGrupoServicioTecSalAC,
        GrupoServicio: SelectPoDefectoGrupoServiciosAC,
        CodigoServicio: SelectPorDefectoCodigoServicioAC,
        FinalidadTecnologiaSalud: SelectPorDefectoFinalidadTecnologiaSaludAC,
        CausaMotivoAtencion: SelectPorDefectoCausaMotivoAtencionAC,
        TipoDiagnosticoPrincipal: SelectPorDefectoTipoDiagnosticoPrincipalAC,
        ConsultaRIPS1: SelectPorDefectoConsultaRIPS1AC,
        ConsultaRIPS2: SelectPorDefectoConsultaRIPS2AC,
        DiagnosticoRIPS1: SelectPorDefectoDiagnosticoRIPSAC1,
        DiagnosticoRIPS2: SelectPorDefectoDiagnosticoRIPSAC2,
      };

      const ActualizarRIPSACPorDefecto = await fetch(
        `http://${servidor}:3000/api/ActualizarRIPSPorDefecto`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(Datos),
        }
      );
      if (ActualizarRIPSACPorDefecto.ok) {
        const respuesta = await ActualizarRIPSACPorDefecto.json();
        console.log("Respuesta del servidor:", respuesta);
        Swal.fire({
          icon: "success",
          html: `
                        <strong class="text-light">El RIPS AC por defecto se actualizó correctamente</strong>
                    `,
        });
        reiniciarSelect();
      } else {
        Swal.fire({
          icon: "error",
          text: "Error al actualizar el RIPS AC por defecto",
        });
        console.error(
          "Error en la solicitud:",
          ActualizarRIPSACPorDefecto.status
        );
      }
      break;

    case "2":
      const SelectPorDefectoTipoUsuarioRIPSAP =
        document.getElementById("SelectPorDefectoTipoUsuarioRIPSAP").value ??
        null;
      const SelectPorDefectoEntidadAP =
        document.getElementById("SelectPorDefectoEntidadAP").value ?? null;
      const SelectPorDefectoViaIngresoServicioSaludAP =
        document.getElementById("SelectPorDefectoViaIngresoServicioSaludAP")
          .value ?? null;
      const SelectPorDefectoModalidadGrupoServicioTecSalAP =
        document.getElementById(
          "SelectPorDefectoModalidadGrupoServicioTecSalAP"
        ).value ?? null;
      const SelectPorDefectoGrupoServiciosAP =
        document.getElementById("SelectPorDefectoGrupoServiciosAP").value ??
        null;
      const SelectPorDefectoCodServicioAP =
        document.getElementById("SelectPorDefectoCodServicioAP").value ?? null;
      const SelectPorDefectoFinalidadTecnologíaSaludAP =
        document.getElementById("SelectPorDefectoFinalidadTecnologíaSaludAP")
          .value ?? null;
      const SelectPorDefectoProcedimientoRIPSAP1 =
        document.getElementById("SelectPorDefectoProcedimientoRIPSAP1").value ??
        null;
      const SelectPorDefectoProcedimientoRIPSAP2 =
        document.getElementById("SelectPorDefectoProcedimientoRIPSAP2").value ??
        null;
      const SelectPorDefectoDiagnosticoRIPSAP1 =
        document.getElementById("SelectPorDefectoDiagnosticoRIPSAP1").value ??
        null;
      const SelectPorDefectoDiagnosticoRIPSAP2 =
        document.getElementById("SelectPorDefectoDiagnosticoRIPSAP2").value ??
        null;

      // Se organizan datos de envío
      const DatosAP = {
        DocumentoProfesional: documentousuariologeado,
        TipoRIPS: SelectTipoRIPSPorDefecto.value,
        TipoUsuario: SelectPorDefectoTipoUsuarioRIPSAP,
        Entidad: SelectPorDefectoEntidadAP,
        ViaIngresoServicioSalud: SelectPorDefectoViaIngresoServicioSaludAP,
        ModalidadGrupoServicioTecSal:
          SelectPorDefectoModalidadGrupoServicioTecSalAP,
        GrupoServicio: SelectPorDefectoGrupoServiciosAP,
        CodigoServicio: SelectPorDefectoCodServicioAP,
        FinalidadTecnologiaSalud: SelectPorDefectoFinalidadTecnologíaSaludAP,
        ConsultaRIPS1: SelectPorDefectoProcedimientoRIPSAP1,
        ConsultaRIPS2: SelectPorDefectoProcedimientoRIPSAP2,
        DiagnosticoRIPS1: SelectPorDefectoDiagnosticoRIPSAP1,
        DiagnosticoRIPS2: SelectPorDefectoDiagnosticoRIPSAP2,
      };

      const ActualizarRIPSAPPorDefecto = await fetch(
        `http://${servidor}:3000/api/ActualizarRIPSPorDefecto`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(DatosAP),
        }
      );
      if (ActualizarRIPSAPPorDefecto.ok) {
        const respuesta = await ActualizarRIPSAPPorDefecto.json();
        console.log("Respuesta del servidor:", respuesta);
        Swal.fire({
          icon: "success",
          html: `
                        <strong class="text-light">El RIPS AP por defecto se actualizó correctamente</strong>
                    `,
        });
        reiniciarSelect();
      } else {
        Swal.fire({
          icon: "error",
          text: "Error al actualizar el RIPS AC por defecto",
        });
        console.error(
          "Error en la solicitud:",
          ActualizarRIPSAPPorDefecto.status
        );
      }
      break;
  }
}

async function EliminarRIPSPorDefecto() {
  const NombreTipoRIPS =
    SelectTipoRIPSPorDefecto.options[SelectTipoRIPSPorDefecto.selectedIndex]
      .text;
  Swal.fire({
    icon: "question",
    html: `
            <strong class="text-light">¿Realmente quieres eliminar el RIPS ${NombreTipoRIPS} por defecto?</strong>
        `,
    showCancelButton: true,
    confirmButtonText: "Si",
    cancelButtonText: "No",
  }).then(async function (response) {
    if (response.isConfirmed) {
      const ParametrosParaEliminar = {
        DocumentoProfesional: documentousuariologeado,
        TipoRIPS: SelectTipoRIPSPorDefecto.value,
      };
      const ElimnarRIPSPorDefecto = await fetch(
        `http://${servidor}:3000/Api/EliminarRIPSPorDefecto`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(ParametrosParaEliminar),
        }
      );
      if (ElimnarRIPSPorDefecto.ok) {
        const respuesta = await ElimnarRIPSPorDefecto.json();
        console.log("Respuesta del servidor:", respuesta);
        reiniciarSelect();
        Swal.fire({
          icon: "success",
          html: `
                        <strong class="text-light"> El RIPS ${NombreTipoRIPS} por defecto fue eliminado</strong>
                    `,
        });
      } else {
        Swal.fire({
          icon: "error",
          text: "Error al eliminar el RIPS por defecto",
        });
        console.error("Error en la solicitud:", ElimnarRIPSPorDefecto.status);
      }
    }
  });
}

BotonGuardarRIPSPorDefecto.addEventListener("click", GuardarRIPSPorDefecto);
BotonActualizarRIPSPorDefecto.addEventListener(
  "click",
  ActualizarRIPSPorDefecto
);
BotonEliminarRIPSPorDefecto.addEventListener("click", EliminarRIPSPorDefecto);
// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

// FUNCIONALIDAD PARA CARGAR/MOSTRAR LOS RIPS POR DEFECTO QUE HAYA CONFIGURADO EL PROFESIONAL
const BotonCargarRIPSPorDefecto = document.getElementById(
  "BotonCargarRIPSPorDefecto"
);

async function CargarRIPSPorDefecto() {
  if (!radioAC.checked && !radioAP.checked) {
    Swal.fire({
      icon: "warning",
      html: `
                <strong class="text-light">Para poder cargar los RIPS por defecto, debe seleccionar un tipo de RIPS (AC o AP)</strong>
            `,
    });
    return;
  } else {
    let TipoRIPS;
    let NombreTipoRIPS;
    if (radioAC.checked) {
      TipoRIPS = 1;
      NombreTipoRIPS = "AC";
      console.log(`CON AC => ${TipoRIPS}`);
    }
    if (radioAP.checked) {
      TipoRIPS = 2;
      NombreTipoRIPS = "AP";
      console.log(`CON AP => ${TipoRIPS}`);
    }
    const ParametrosParaConsulta = {
      DocumentoProfesional: documentousuariologeado,
    };
    const RIPSPorDefecto = await fetch(
      `http://${servidor}:3000/api/ConsultarRIPSPorDefecto/${documentousuariologeado}/${TipoRIPS}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        // body: JSON.stringify(ParametrosParaConsulta)
      }
    );
    if (RIPSPorDefecto.ok) {
      const respuesta = await RIPSPorDefecto.json();
      console.log("Respuesta del servidor:", respuesta);
      if (respuesta.length > 0) {
        switch (NombreTipoRIPS) {
          case "AC":
            const SelectTipoUsuarioRIPS = document.getElementById(
              "SelectTipoUsuarioRIPS"
            );
            const SelectEntidad = document.getElementById("SelectEntidad");
            const SelectModalidadGrupoServicioTecnologiaSalud =
              document.getElementById(
                "SelectModalidadGrupoServicioTecnologiaSalud"
              );
            const SelectGrupoServiciosAC = document.getElementById(
              "SelectGrupoServiciosAC"
            );
            const SelectServiciosAC =
              document.getElementById("SelectServiciosAC");
            const SelectFinalidadTecnologiaSaludAC = document.getElementById(
              "SelectFinalidadTecnologiaSaludAC"
            );
            const SelectCausaMotivoAtencion = document.getElementById(
              "SelectCausaMotivoAtencion"
            );
            const SelectTipoDiagnosticoPrincipalAC = document.getElementById(
              "SelectTipoDiagnosticoPrincipalAC"
            );
            const SelectConsultaRIPSAC1 = document.getElementById(
              "SelectConsultaRIPSAC1"
            );
            const SelectConsultaRIPSAC2 = document.getElementById(
              "SelectConsultaRIPSAC2"
            );
            const SelectDiagnosticoRIPSAC1 = document.getElementById(
              "SelectDiagnosticoRIPSAC1"
            );
            const SelectDiagnosticoRIPSAC2 = document.getElementById(
              "SelectDiagnosticoRIPSAC2"
            );

            // SelectTipoUsuarioRIPS.options[SelectTipoUsuarioRIPS.selectedIndex].text = respuesta[0].TipoDeUsuario;

            // Seleccioanar Tipo de Usuario AC por defecto
            // Convertir HTMLOptionsCollection a un array y buscar la opción
            const SeleccionarTipoUsuarioPorDefecto = Array.from(
              SelectTipoUsuarioRIPS.options
            ).find((option) => option.text === respuesta[0].TipoDeUsuario);

            if (SeleccionarTipoUsuarioPorDefecto) {
              SelectTipoUsuarioRIPS.selectedIndex =
                SeleccionarTipoUsuarioPorDefecto.index; // Marcar la opción
              const ValorRecibidoParaEntidadACPorDefecto = respuesta[0].Entidad;
              console.log(ValorRecibidoParaEntidadACPorDefecto);
              // Crear un evento personalizado con un detalle
              var event = new CustomEvent("change", {
                detail: { parametro: ValorRecibidoParaEntidadACPorDefecto }, // Aquí puedes enviar cualquier dato
              });

              SelectTipoUsuarioRIPS.dispatchEvent(event); // Disparar el evento
            }

            // Seleccionar modalidad grupo servicio tecnología salud por defecto
            const SeleccionarModalidadGrupoServicioPorDefecto = Array.from(
              SelectModalidadGrupoServicioTecnologiaSalud.options
            ).find((option) => {
              return (
                option.text ===
                respuesta[0].ModalidadGrupoServicioTecnologiaEnSalud
              );
            });
            if (SeleccionarModalidadGrupoServicioPorDefecto) {
              SelectModalidadGrupoServicioTecnologiaSalud.selectedIndex =
                SeleccionarModalidadGrupoServicioPorDefecto.index; // Marcar la opción
            }

            // Seleccionar grupo servicios por defecto
            const SeleccionarGrupoServicioPorDefecto = Array.from(
              SelectGrupoServiciosAC.options
            ).find((option) => {
              return option.text === respuesta[0].GrupoServicios;
            });
            if (SeleccionarGrupoServicioPorDefecto) {
              SelectGrupoServiciosAC.selectedIndex =
                SeleccionarGrupoServicioPorDefecto.index; // Marcar la opción

              const ValorRecibidoParaGrupoServicioACPorDefecto =
                respuesta[0].CodigoServicio;
              // Crear un evento personalizado con un detalle
              var event = new CustomEvent("change", {
                detail: {
                  parametro: ValorRecibidoParaGrupoServicioACPorDefecto,
                }, // Aquí puedes enviar cualquier dato
              });

              SelectGrupoServiciosAC.dispatchEvent(event); // Disparar el evento
            }

            // Seleccionar finalidad tecnologia salud por defecto
            const SeleccionarFinalidadTecnologiaSaludPorDefecto = Array.from(
              SelectFinalidadTecnologiaSaludAC.options
            ).find((option) => {
              return option.text === respuesta[0].FinalidadTecnologiaSalud;
            });
            if (SeleccionarFinalidadTecnologiaSaludPorDefecto) {
              SelectFinalidadTecnologiaSaludAC.selectedIndex =
                SeleccionarFinalidadTecnologiaSaludPorDefecto.index; // Marcar la opción
            }

            // Seleccionar causa motivo atención por defecto
            const SeleccionarCausaMotivoAtencionPorDefecto = Array.from(
              SelectCausaMotivoAtencion.options
            ).find((option) => {
              return option.text === respuesta[0].CausaMotivoAtencion;
            });
            if (SeleccionarCausaMotivoAtencionPorDefecto) {
              SelectCausaMotivoAtencion.selectedIndex =
                SeleccionarCausaMotivoAtencionPorDefecto.index; // Marcar la opción
            }

            // Seleccionar tipo diagnostico principal por defecto
            const SeleccionarTipoDiagnosticoPrincipalPorDefecto = Array.from(
              SelectTipoDiagnosticoPrincipalAC.options
            ).find((option) => {
              return option.text === respuesta[0].TipoDiagnosticoPrincipal;
            });
            if (SeleccionarTipoDiagnosticoPrincipalPorDefecto) {
              SelectTipoDiagnosticoPrincipalAC.selectedIndex =
                SeleccionarTipoDiagnosticoPrincipalPorDefecto.index; // Marcar la opción
            }

            // Seleccionar diagnostico 1 por defecto
            const SeleccionarDiagnostico1PorDefecto = Array.from(
              SelectConsultaRIPSAC1.options
            ).find((option) => {
              // return option.text === respuesta[0].Diagnostico1
              // Obtener el texto después del guion
              const textoOpcion = option.text.split(" - ")[1]?.trim(); // Usar trim() para eliminar espacios en blanco
              return textoOpcion === respuesta[0].Diagnostico1; // Comparar
            });
            if (SeleccionarDiagnostico1PorDefecto) {
              SelectConsultaRIPSAC1.selectedIndex =
                SeleccionarDiagnostico1PorDefecto.index; // Marcar la opción
              $(SelectConsultaRIPSAC1).trigger("change"); // Disparar el evento change
            }

            // Seleccionar diagnostico 2 por defecto
            const SeleccionarDiagnostico2PorDefecto = Array.from(
              SelectConsultaRIPSAC2.options
            ).find((option) => {
              // return option.text === respuesta[0].Diagnostico2
              // Obtener el texto después del guion
              const textoOpcion = option.text.split(" - ")[1]?.trim(); // Usar trim() para eliminar espacios en blanco
              return textoOpcion === respuesta[0].Diagnostico2; // Comparar
            });
            if (SeleccionarDiagnostico2PorDefecto) {
              SelectConsultaRIPSAC2.selectedIndex =
                SeleccionarDiagnostico2PorDefecto.index; // Marcar la opción
              $(SelectConsultaRIPSAC2).trigger("change"); // Disparar el evento change
            }

            // Seleccionar procedimiento 1 por defecto
            const SeleccionarProcedimiento1PorDefecto = Array.from(
              SelectDiagnosticoRIPSAC1.options
            ).find((option) => {
              // return option.text === respuesta[0].Procedimiento1
              // Obtener el texto después del guion
              const textoOpcion = option.text.split(" - ")[1]?.trim(); // Usar trim() para eliminar espacios en blanco
              return textoOpcion === respuesta[0].Procedimiento1; // Comparar
            });
            if (SeleccionarProcedimiento1PorDefecto) {
              SelectDiagnosticoRIPSAC1.selectedIndex =
                SeleccionarProcedimiento1PorDefecto.index; // Marcar la opción
              $(SelectDiagnosticoRIPSAC1).trigger("change"); // Disparar el evento change
            }

            // Seleccionar procedimiento 2 por defecto
            const SeleccionarProcedimiento2PorDefecto = Array.from(
              SelectDiagnosticoRIPSAC2.options
            ).find((option) => {
              // return option.text === respuesta[0].Procedimiento2
              // Obtener el texto después del guion
              const textoOpcion = option.text.split(" - ")[1]?.trim(); // Usar trim() para eliminar espacios en blanco
              return textoOpcion === respuesta[0].Procedimiento2; // Comparar
            });
            if (SeleccionarProcedimiento2PorDefecto) {
              SelectDiagnosticoRIPSAC2.selectedIndex =
                SeleccionarProcedimiento2PorDefecto.index; // Marcar la opción
              $(SelectDiagnosticoRIPSAC2).trigger("change"); // Disparar el evento change
            }
            break;

          case "AP":
            const SelectTipoUsurioRIPSAP = document.getElementById(
              "SelectTipoUsurioRIPSAP"
            );
            const SelectEntidadAP = document.getElementById("SelectEntidadAP");
            const SelectViaIngresoServicioSaludAP = document.getElementById(
              "SelectViaIngresoServicioSaludAP"
            );
            const SelectModalidadGrupoServicioTecSalAP =
              document.getElementById("SelectModalidadGrupoServicioTecSalAP");
            const SelectGrupoServiciosAP = document.getElementById(
              "SelectGrupoServiciosAP"
            );
            const SelectServicioAP =
              document.getElementById("SelectServicioAP");
            const SelectFinalidadTecnologiaSaludAP = document.getElementById(
              "SelectFinalidadTecnologiaSaludAP"
            );
            const SelectProcedimientoRIPSAP1 = document.getElementById(
              "SelectProcedimientoRIPSAP1"
            );
            const SelectProcedimientoRIPSAP2 = document.getElementById(
              "SelectProcedimientoRIPSAP2"
            );
            const SelectDiagnosticoRIPSAP1 = document.getElementById(
              "SelectDiagnosticoRIPSAP1"
            );
            const SelectDiagnosticoRIPSAP2 = document.getElementById(
              "SelectDiagnosticoRIPSAP2"
            );

            // Seleccionar el Tipo de Usuario para AP por defecto
            const SeleccionarTipoUsurioRIPSAPPorDefecto = Array.from(
              SelectTipoUsurioRIPSAP.options
            ).find((option) => {
              return option.text === respuesta[0].TipoDeUsuario;
            });

            if (SeleccionarTipoUsurioRIPSAPPorDefecto) {
              SelectTipoUsurioRIPSAP.selectedIndex =
                SeleccionarTipoUsurioRIPSAPPorDefecto.index; // Marcar la opción
              const ValorRecibidoParaEntidadAPPorDefecto = respuesta[0].Entidad;
              // console.log(ValorRecibidoParaEntidadAPPorDefecto);
              // Crear un evento personalizado con un detalle
              var event = new CustomEvent("change", {
                detail: {
                  entidadappordefecto: ValorRecibidoParaEntidadAPPorDefecto,
                }, // Aquí puedes enviar cualquier dato
              });

              SelectTipoUsurioRIPSAP.dispatchEvent(event); // Disparar el evento
            }

            // Seleccionar Vía de Ingreso del Servicio de Salud para AP por defecto
            const SeleccionarViaIngresoServicioSaludAPPorDefecto = Array.from(
              SelectViaIngresoServicioSaludAP.options
            ).find((option) => {
              return option.text === respuesta[0].ViaIngresoServicioSalud;
            });
            if (SeleccionarViaIngresoServicioSaludAPPorDefecto) {
              SelectViaIngresoServicioSaludAP.selectedIndex =
                SeleccionarViaIngresoServicioSaludAPPorDefecto.index; // Marcar la opción
            }

            // Seleccionar Modalidad de Grupo de Servicio Tecnológico para AP por defecto
            const SeleccionarModalidadGrupoServicioTecSalAPorDefecto =
              Array.from(SelectModalidadGrupoServicioTecSalAP.options).find(
                (option) => {
                  return (
                    option.text ===
                    respuesta[0].ModalidadGrupoServicioTecnologiaEnSalud
                  );
                }
              );
            if (SeleccionarModalidadGrupoServicioTecSalAPorDefecto) {
              SelectModalidadGrupoServicioTecSalAP.selectedIndex =
                SeleccionarModalidadGrupoServicioTecSalAPorDefecto.index; // Marcar la opción
            }

            // Seleccionar Grupo de Servicios para AP por defecto
            const SeleccionarGrupoServiciosAPPorDefecto = Array.from(
              SelectGrupoServiciosAP.options
            ).find((option) => {
              return option.text === respuesta[0].GrupoServicios;
            });
            if (SeleccionarGrupoServiciosAPPorDefecto) {
              SelectGrupoServiciosAP.selectedIndex =
                SeleccionarGrupoServiciosAPPorDefecto.index; // Marcar la opción

              const ValorRecibidoParaGrupoServicioAPPorDefecto =
                respuesta[0].CodigoServicio;
              // Crear un evento personalizado con un detalle
              var event = new CustomEvent("change", {
                detail: {
                  parametro: ValorRecibidoParaGrupoServicioAPPorDefecto,
                }, // Aquí puedes enviar cualquier dato
              });

              SelectGrupoServiciosAP.dispatchEvent(event); // Disparar el evento
            }

            // Seleccionar Servicio para AP por defecto
            const SeleccionarServicioAPPorDefecto = Array.from(
              SelectServicioAP.options
            ).find((option) => {
              return option.text === respuesta[0].CodigoServicio;
            });
            if (SeleccionarServicioAPPorDefecto) {
              SelectServicioAP.selectedIndex =
                SeleccionarServicioAPPorDefecto.index; // Marcar la opción
            }

            // Seleccionar Finalidad Tecnológica de Salud para AP por defecto
            const SeleccionarFinalidadTecnologiaSaludAPPorDefecto = Array.from(
              SelectFinalidadTecnologiaSaludAP.options
            ).find((option) => {
              return option.text === respuesta[0].FinalidadTecnologiaSalud;
            });
            if (SeleccionarFinalidadTecnologiaSaludAPPorDefecto) {
              SelectFinalidadTecnologiaSaludAP.selectedIndex =
                SeleccionarFinalidadTecnologiaSaludAPPorDefecto.index; // Marcar la opción
            }

            // Seleccionar Procedimiento RIPS para AP por defecto
            const SeleccionarProcedimientoRIPSAPPorDefecto1 = Array.from(
              SelectProcedimientoRIPSAP1.options
            ).find((option) => {
              const textoOpcion = option.text.split(" - ")[1]?.trim(); // Usar trim() para eliminar espacios en blanco
              return textoOpcion === respuesta[0].Diagnostico1;
            });
            if (SeleccionarProcedimientoRIPSAPPorDefecto1) {
              SelectProcedimientoRIPSAP1.selectedIndex =
                SeleccionarProcedimientoRIPSAPPorDefecto1.index; // Marcar la opción
              $(SelectProcedimientoRIPSAP1).trigger("change"); // Disparar el evento change
            }

            // Seleccionar Procedimiento RIPS para AP por defecto
            const SeleccionarProcedimientoRIPSAPPorDefecto2 = Array.from(
              SelectProcedimientoRIPSAP2.options
            ).find((option) => {
              const textoOpcion = option.text.split(" - ")[1]?.trim(); // Usar trim() para eliminar espacios en blanco
              return textoOpcion === respuesta[0].Diagnostico2; // Comparar
            });
            if (SeleccionarProcedimientoRIPSAPPorDefecto2) {
              SelectProcedimientoRIPSAP2.selectedIndex =
                SeleccionarProcedimientoRIPSAPPorDefecto2.index; // Marcar la opción
              $(SelectProcedimientoRIPSAP2).trigger("change"); // Disparar el evento change
            }

            // Seleccionar Diagnostico RIPS para AP por defecto
            const SeleccionarDiagnosticoRIPSAPPorDefecto1 = Array.from(
              SelectDiagnosticoRIPSAP1.options
            ).find((option) => {
              const textoOpcion = option.text.split(" - ")[1]?.trim(); // Usar trim() para eliminar espacios en blanco
              return textoOpcion === respuesta[0].Procedimiento1;
            });
            if (SeleccionarDiagnosticoRIPSAPPorDefecto1) {
              SelectDiagnosticoRIPSAP1.selectedIndex =
                SeleccionarDiagnosticoRIPSAPPorDefecto1.index; // Marcar la opción
              $(SelectDiagnosticoRIPSAP1).trigger("change"); // Disparar el evento change
            }

            // Seleccionar Diagnostico RIPS para AP por defecto
            const SeleccionarDiagnosticoRIPSAPPorDefecto2 = Array.from(
              SelectDiagnosticoRIPSAP2.options
            ).find((option) => {
              const textoOpcion = option.text.split(" - ")[1]?.trim(); // Usar trim() para eliminar espacios en blanco
              return textoOpcion === respuesta[0].Procedimiento2; // Comparar
            });
            if (SeleccionarDiagnosticoRIPSAPPorDefecto2) {
              SelectDiagnosticoRIPSAP2.selectedIndex =
                SeleccionarDiagnosticoRIPSAPPorDefecto2.index; // Marcar la opción
              $(SelectDiagnosticoRIPSAP2).trigger("change"); // Disparar el evento change
            }
            break;
        }
      } else {
        Swal.fire({
          icon: "info",
          html: `
                        <strong class="text-light">El profesional no ha configurado ningún RIPS ${NombreTipoRIPS} por defecto</strong>
                    `,
        });
      }
    } else {
      Swal.fire({
        icon: "error",
        text: "Error al consultar los RIPS por defecto",
      });
      console.error("Error en la solicitud:", RIPSPorDefecto);
      return;
    }
  }
}

BotonCargarRIPSPorDefecto.addEventListener("click", CargarRIPSPorDefecto);
// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

radioAC.addEventListener("click", function (e) {
  if (radioAC.checked) {
    radioAP.checked = false;
  }
});

radioAP.addEventListener("click", function (e) {
  if (radioAP.checked) {
    radioAC.checked = false;
  }
});

// FUNCIONALIDAD PARA LA BÚSQUEDA DE FACTURAS Y PRESUPUESTOS
const BuscarPorFacturas = document.getElementById("BuscarPorFacturas");
const BuscarPorPresupuestos = document.getElementById("BuscarPorPresupuestos");
const Facturas = document.getElementById("Facturas");
const Presupuestos = document.getElementById("Presupuestos");
BuscarPorFacturas.disabled = true;
BuscarPorPresupuestos.disabled = true;
Facturas.style.display = "none";
Presupuestos.style.display = "none";

const LabelFacturas = document.getElementById("LabelFacturas");
const LabelPresupuestos = document.getElementById("LabelPresupuestos");
LabelFacturas.addEventListener("click", function () {
  BuscarPorFacturas.click();
});
LabelPresupuestos.addEventListener("click", function () {
  BuscarPorPresupuestos.click();
});
// document.getElementById('ContenedorDeCheckBox').style.display = 'none';
// document.getElementById('ContenedorDeSelects').style.display = 'none';

const CamposCheckBox = {
  BuscarPorFacturas: "Facturas",
  BuscarPorPresupuestos: "Presupuestos",
};

const FacturaARelacionar = document.getElementById("FacturaARelacionar");
const PresupuestoARelacionar = document.getElementById(
  "PresupuestoARelacionar"
);
Object.keys(CamposCheckBox).forEach((id) => {
  document.getElementById(id).addEventListener("click", function () {
    Object.keys(CamposCheckBox).forEach((key) => {
      const isChecked = key === id && this.checked;
      document.getElementById(key).checked = isChecked;
      document.getElementById(CamposCheckBox[key]).style.display = isChecked
        ? "block"
        : "none";

      if (isChecked && key === "BuscarPorFacturas") {
        TraerFacturasPaciente(FacturaARelacionar, SelectPacientes.value);
      }

      if (isChecked && key === "BuscarPorPresupuestos") {
        TraerPresupuestosPaciente(
          PresupuestoARelacionar,
          SelectPacientes.value
        );
      }
    });
  });
});

async function TraerFacturasPaciente(Select, DocumentoPaciente) {
  try {
    console.log(DocumentoPaciente);
    const FacturasPaciente = await fetch(
      `http://${servidor}:3000/api/ConsultarFacturas/${DocumentoPaciente}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!FacturasPaciente.ok) {
      const errorResponse = await FacturasPaciente.text(); // Obtener el cuerpo de la respuesta
      console.log(errorResponse); // Para depuración
      Swal.fire({
        icon: "error",
        html: `
                    <!-- <strong>Error: ${FacturasPaciente.status} - ${FacturasPaciente.statusText}</strong><br> -->
                    <!-- <pre>${errorResponse}</pre> -->
                    <span style="color: #ffffff;">${errorResponse}</span>
                `,
      });
      AgregarOpcionPorDefecto(Select);
      return; // Salir de la función si hay un error
    }

    const respuesta = await FacturasPaciente.json();
    // console.log(respuesta);
    AgregarOpcionPorDefecto(Select);
    respuesta.forEach((factura) => {
      const option = document.createElement("option");
      option.textContent = `${factura.Text} - $${factura.TotalFactura}`; // Valor por defecto
      option.value = factura.Value; // Valor por defecto
      Select.appendChild(option);
    });
  } catch (error) {
    console.error("Error en la solicitud:", error);
    throw new Error(
      `Error al obtener las entidades responsables: ${error.message}`
    );
  }
}

async function TraerPresupuestosPaciente(Select, DocumentoPaciente) {
  try {
    const PresupuestosPaciente = await fetch(
      `http://${servidor}:3000/api/ConsultarPresupuestos/${DocumentoPaciente}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!PresupuestosPaciente.ok) {
      const errorResponse = await PresupuestosPaciente.text(); // Obtener el cuerpo de la respuesta
      console.log(errorResponse); // Para depuración
      Swal.fire({
        icon: "error",
        html: `
                    <!-- <strong>Error: ${PresupuestosPaciente.status} - ${PresupuestosPaciente.statusText}</strong><br> -->
                    <!-- <pre>${errorResponse}</pre> -->
                    <span style="color: #ffffff;">${errorResponse}</span>
                `,
      });
      AgregarOpcionPorDefecto(Select);
      return; // Salir de la función si hay un error
    }
    const respuesta = await PresupuestosPaciente.json();
    // console.log(respuesta);
    AgregarOpcionPorDefecto(Select);
    respuesta.forEach((presupuesto) => {
      const option = document.createElement("option");
      option.textContent = `${presupuesto.Text} - $${presupuesto.TotalPresupuesto}`; // Valor por defecto
      option.value = presupuesto.Value; // Valor por defecto
      Select.appendChild(option);
    });
  } catch (error) {
    console.error("Error en la solicitud:", error);
    throw new Error(
      `Error al obtener las entidades responsables: ${error.message}`
    );
  }
}

async function AgregarOpcionPorDefecto(Select) {
  Select.innerHTML = "";
  const OpcionPorDefecto = document.createElement("option");
  OpcionPorDefecto.textContent = "Sin Seleccionar";
  OpcionPorDefecto.value = "Sin Seleccionar";
  Select.appendChild(OpcionPorDefecto);
}
// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

// PARA PROBAR_SOLO PRUEBAS EN DESARROLLO
// document.body.onload = function ()  {
//     const Inicio = document.getElementById('FechaInicioConsulta');
//     const Fin = document.getElementById('FechaFinConsulta');
//     const Cargar = document.getElementById('CargarPacientesConHCSinRIPS');

//     Inicio.value = "2000-01-01";
//     Fin.value = "2025-04-04";
//     Cargar.click();
// }
// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
