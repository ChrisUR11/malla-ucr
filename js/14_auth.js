// --- Autenticación ---
async function iniciarSesionGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();

    try {
        registrarEvento('intento_login_google', {
            metodo_login: 'google'
        });
        await auth.signInWithPopup(provider);
    } catch (error) {
        console.error('Error iniciando sesión:', error);

        if (
            error.code === 'auth/popup-blocked' ||
            error.code === 'auth/popup-closed-by-user' ||
            error.code === 'auth/cancelled-popup-request'
        ) {
            try {
                await auth.signInWithRedirect(provider);
            } catch (redirectError) {
                console.error('Error con redirección:', redirectError);
                mostrarAviso('Error de inicio de sesión', 'No se pudo iniciar sesión con Google.');
            }
        } else {
            mostrarAviso('Error de inicio de sesión', 'No se pudo iniciar sesión con Google.');
        }
    }
}

async function cerrarSesionGoogle() {
    cerrarMenuUsuario();

    const confirmar = await mostrarConfirmacion({
        titulo: 'Cerrar sesión',
        mensaje: '¿Seguro que deseas cerrar sesión? Tus datos guardados permanecerán en tu cuenta.',
        textoAceptar: 'Cerrar sesión',
        textoCancelar: 'Cancelar'
    });

    if (!confirmar) return;

    try {
        registrarEvento('cerrar_sesion', {
            metodo_logout: 'google'
        });
        await auth.signOut();
    } catch (error) {
        console.error('Error cerrando sesión:', error);
        await mostrarAviso('Error al cerrar sesión', 'No se pudo cerrar sesión.');
    }
}

