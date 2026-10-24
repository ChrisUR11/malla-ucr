// --- Restablecer datos del usuario ---
async function restablecerMisDatos() {
    if (!requiereSesion()) return;
    const uidInicial = usuarioActual.uid;
    const versionInicial = versionSesion;

    const confirmar = await mostrarConfirmacion({
        titulo: 'Restablecer mis datos',
        mensaje: '¿Seguro que deseas borrar tus notas, cursos aprobados, bitácora TCU y fotos locales de este navegador? Descarga primero las fotos que quieras conservar. Esta acción no se puede deshacer.',
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
        temaOscuro
    });

    if (!guardado || usuarioActual?.uid !== uid || versionSesion !== versionInicial) return;

    estadoCursos = {};
    bitacoraTCU = [];
    nombreTCU = '';
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
            console.error('No se pudieron eliminar las fotos locales del TCU:', error);
            await mostrarAviso('Fotos locales pendientes', 'Tus datos se restablecieron, pero no se pudieron borrar las fotos guardadas en este navegador.');
        }
    }

    registrarEvento('restablecer_datos_usuario');
    await mostrarAviso('Datos restablecidos', 'Tus datos fueron restablecidos correctamente.');
}

