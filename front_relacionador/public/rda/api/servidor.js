/**
 * servidor.js — Fuente única para la dirección del servidor backend.
 *
 * Se lee de localStorage (establecido en la página de login).
 * Todos los módulos de rda/ importan esta función en vez de repetir
 * la lectura de localStorage.
 */
export function getServidor() {
    return localStorage.getItem("NombreEquipoServidor") || "localhost";
}
