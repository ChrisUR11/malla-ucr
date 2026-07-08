// --- Estado de autenticación ---
function configurarAuthState() {
    auth.onAuthStateChanged(async function (user) {
        if (user) {
            usuarioActual = user;

            setText('usuario-info', obtenerNombreUsuario(user));
            ocultarElemento('btn-login');
            mostrarElemento('menu-wrapper', 'block');
            ocultarModalLogin();

            // Primero cargamos los datos del usuario desde Firebase
            await cargarDatosDesdeFirebase(user);

            // Después registramos el login, ya con la malla cargada correctamente
            registrarEvento('login_exitoso', {
                metodo_login: 'google',
                tiene_malla_cargada: mallaSeleccionada ? 'si' : 'no',
                malla_cargada: mallaSeleccionada || 'sin_malla'
            });

        } else {
            usuarioActual = null;
            estadoCursos = {};
            bitacoraTCU = [];
            mallaSeleccionada = null;
            mallaActual = [];
            mallaSecciones = [];
            datosMallaActual = null;
            seccionActivaMalla = 'carrera';
            totalCreditosCarrera = 0;

            document.title = 'Malla Interactiva';

            const subtitulo = document.querySelector('.header-title p');
            if (subtitulo) {
                subtitulo.textContent = 'Selecciona tu malla curricular';
            }

            setText('usuario-info', 'No has iniciado sesión');
            mostrarElemento('btn-login', 'inline-block');
            ocultarElemento('menu-wrapper');
            cerrarMenuUsuario();
            ocultarModalSeleccionMalla();
            mostrarModalLogin();

            renderMalla();
        }
    });
}

