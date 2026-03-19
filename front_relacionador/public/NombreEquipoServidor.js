const NombreServidor =
  localStorage.getItem("NombreEquipoServidor") ||
  window.location.hostname ||
  "localhost";

localStorage.setItem("NombreEquipoServidor", NombreServidor);
