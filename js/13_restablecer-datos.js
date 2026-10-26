// --- Restablecer datos del usuario ---
async function restablecerMisDatos() {
    if (!requiereSesion()) return;
    const uidInicial = usuarioActual.uid;
    const versionInicial = versionSesion;

    const confirmar = await mostrarConfirmacion({
        titulo: 'Restablecer mis datos',
        mensaje: '¿Seguro que deseas borrar tus notas, cursos aprobados, bitácora y fechas del TCU, y fotos sincronizadas de la cuenta? Descarga primero las fotos que quieras conservar. Esta acción no se puede deshacer.',
        textoAceptar: 'Borrar datos',
        textoCancelar: 'Cancelar',
        peligro: true
    });

    if (!confirmar || usuarioActual?.uid !== uidInicial || versionSesion !== versionInicial) return;

    const uid = uidInicial;
    const guardado = await guardarDatosEnFirebase({
        mallaSeleccionada,
        estadoCursos: {},
        bitacoraTCU: [],
        nombreTCU: '',
        plazoTCU: { inicio: '', limite: '' }
    });

    if (!guardado || usuarioActual?.uid !== uid || versionSesion !== versionInicial) return;

    estadoCursos = {};
    bitacoraTCU = [];
    nombreTCU = '';
    plazoTCU = { inicio: '', limite: '' };
    editandoTCUIndex = -1;
    limpiarFormularioTCU();

    if (typeof reiniciarEstadoMotivacion === 'function') {
        reiniciarEstadoMotivacion();
    }

    renderMalla();
    renderBitacoraTCU();

    if (typeof eliminarFotosTCUDeUsuario === 'function') {
        try {
            await eliminarFotosTCUDeUsuario(uid);
            renderBitacoraTCU();
        } catch (error) {
            console.error('No se pudieron eliminar las fotos del TCU:', error);
            await mostrarAviso('Fotos pendientes de borrar', 'Tus datos se restablecieron. Se intentará borrar las fotos al iniciar sesión o recuperar la conexión. Si persisten, revisa los permisos de Firestore.');
        }
    }

    registrarEvento('restablecer_datos_usuario');
    await mostrarAviso('Datos restablecidos', 'Tus datos fueron restablecidos correctamente.');
}

