// Cada cambio de sesión invalida cargas anteriores que aún estén pendientes.
let versionSesion = 0;
let escuchaConexionFotosTCU = false;

function reintentarFotosCuentaActual() {
    if (!usuarioActual || !datosCuentaCargados ||
        typeof reintentarFotosTCU !== 'function') return;
    const uid = usuarioActual.uid;
    const sesion = versionSesion;
    Promise.resolve().then(() => {
        if (usuarioActual?.uid === uid && versionSesion === sesion && datosCuentaCargados) {
            return reintentarFotosTCU(uid);
        }
    }).catch(error => console.error('No se pudieron reintentar las fotos TCU:', error));
}

function configurarAuthState() {
    if (!escuchaConexionFotosTCU) {
        window.addEventListener('online', reintentarFotosCuentaActual);
        escuchaConexionFotosTCU = true;
    }
    auth.onAuthStateChanged(async function (user) {
        const versionActual = ++versionSesion;

        if (detenerEscuchaUsuario) {
            detenerEscuchaUsuario();
            detenerEscuchaUsuario = null;
        }
        ultimaRevisionCuentaPorUsuario.clear();

        if (typeof invalidarGuardadoBitacoraTCU === 'function') {
            invalidarGuardadoBitacoraTCU();
        }
        if (typeof limpiarURLsFotosTCU === 'function') {
            limpiarURLsFotosTCU();
        }
        cerrarModalPorId('modal-tcu');
        reiniciarEstadoLocal({ mostrarSeleccion: false });
        guardandoCambioCurso = false;
        guardandoTema = false;

        if (user) {
            usuarioActual = user;
            setText('usuario-info', obtenerNombreUsuario(user));
            ocultarElemento('btn-login');
            mostrarElemento('menu-wrapper', 'block');
            ocultarModalLogin();

            const sesionVigente = () => versionActual === versionSesion &&
                usuarioActual?.uid === user.uid;

            while (sesionVigente()) {
                const cargado = await cargarDatosDesdeFirebase(user, sesionVigente);
                if (!sesionVigente()) return;

                if (cargado) {
                    datosCuentaCargados = true;
                    iniciarEscuchaUsuario(user, sesionVigente);
                    reintentarFotosCuentaActual();
                    registrarEvento('login_exitoso', {
                        metodo_login: 'google',
                        tiene_malla_cargada: mallaSeleccionada ? 'si' : 'no',
                        malla_cargada: mallaSeleccionada || 'sin_malla'
                    });
                    return;
                }

                const reintentar = await mostrarConfirmacion({
                    titulo: 'No se pudieron cargar tus datos',
                    mensaje: 'No se harán cambios en tu cuenta hasta que se carguen tus datos. Revisa tu conexión y vuelve a intentarlo.',
                    textoAceptar: 'Reintentar',
                    textoCancelar: 'Cerrar'
                });

                if (!sesionVigente()) return;
                if (!reintentar) {
                    const subtitulo = document.querySelector('.header-title p');
                    if (subtitulo) {
                        subtitulo.textContent = 'No se pudieron cargar tus datos. Recarga la página para reintentar.';
                    }
                    return;
                }
            }
        } else {
            usuarioActual = null;
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
        }
    });
}
