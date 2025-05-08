// const servidor = "HPGRIS";
const servidor = localStorage.getItem("NombreEquipoServidor");

const login = async () => {
    const username = document.getElementById('inputUsername').value;
    const password = document.getElementById('inputPassword').value;

    if (username === '') {
        Swal.fire({
            title: "¡El campo usuario está vacío!",
            icon: "warning",
            confirmButtonText: "OK"
        });
    } else if (password === '') {
        Swal.fire({
            title: "¡El campo contraseña está vacío!",
            icon: "warning",
            confirmButtonText: "OK"
        });
    } else {
        try {
            const response = await fetch(`http://${servidor}:3000/api/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            if (response.ok) {
                const { token, userLevel, documentousuariologeado } = await response.json(); // Extrae token y userLevel de la respuesta
                const { exp } = JSON.parse(atob(token.split('.')[1])); // Decodifica el token para obtener la fecha de expiración

                localStorage.setItem('token', token);
                localStorage.setItem('token_exp', exp);
                localStorage.setItem('userLevel', userLevel); // Guarda el nivel de usuario en localStorage
                sessionStorage.setItem('documentousuariologeado', documentousuariologeado)

                alertify.success('Inicio de sesión correcto');
                setTimeout(() => {
                    window.location.href = 'RIPS.html';
                }, 2000);
            } else {
                const errorData = await response.json();
                if (errorData.error === 'Nivel de usuario no reconocido') {
                    Swal.fire({
                        icon: "error",
                        title: "Nivel de usuario no reconocido",
                        text: "Contacte al administrador",
                    });
                } else {
                    Swal.fire({
                        icon: "error",
                        title: "Credenciales incorrectas",
                        text: "Intente de nuevo",
                    });
                }
            }
        } catch (error) {
            Swal.fire({
                icon: "error",
                title: "Error de conexión",
                text: "No se pudo conectar al servidor. Intente de nuevo más tarde.",
            });
            console.error('Error:', error);
        }
    }
};



document.getElementById('btnIngresar').addEventListener('click', login);

document.getElementById('inputPassword').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        // Si se presiona la tecla Enter, inicia sesión
        login();
    }
});

// const isTokenValid = () => {
//     const token = localStorage.getItem('token');
//     const tokenExp = localStorage.getItem('token_exp');

//     if (!token || !tokenExp) {
//         return false;
//     }

//     const now = Math.floor(Date.now() / 1000); // Obtener el tiempo actual en segundos
//     return now < tokenExp;
// };

// const redirectToIndexIfTokenExpired = () => {
//     if (!isTokenValid()) {
//         localStorage.removeItem('token');
//         localStorage.removeItem('token_exp');
//         window.location.href = 'index.html';
//     }
// };

// // Llamar a esta función en cada página protegida
// redirectToIndexIfTokenExpired();



document.querySelector('#btnHide').addEventListener('click', () => {

    document.querySelector('#btnShow').style.display = 'block';
    document.querySelector('#btnHide').style.display = 'none';
    document.querySelector('#inputPassword').type = 'text'

})

document.querySelector('#btnShow').addEventListener('click', () => {

    document.querySelector('#btnShow').style.display = 'none';
    document.querySelector('#btnHide').style.display = 'block';
    document.querySelector('#inputPassword').type = 'password'


})