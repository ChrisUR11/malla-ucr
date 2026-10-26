// --- Selección de malla ---
async function guardarMallaSeleccionada() {
    if (!requiereSesion()) return;

    const selectMalla = $('select-malla');

    if (!selectMalla) return;

    renderOpcionesMalla();

    const valorSeleccionado = selectMalla.value;

    if (!valorSeleccionado) {
        await mostrarAviso('Selecciona una malla', 'Debes seleccionar una malla curricular para continuar.');
        return;
    }

    if (!window.mallasDisponibles?.[valorSeleccionado]) {
        await mostrarAviso('Malla no disponible', 'La malla seleccionada no está cargada en el sistema.');
        return;
    }

    const mallaAnterior = mallaSeleccionada || 'sin_malla';
    const uidInicial = usuarioActual.uid;
    const versionInicial = versionSesion;
    const estaCambiando = Boolean(mallaSeleccionada && mallaSeleccionada !== valorSeleccionado);
    const esLaMisma = Boolean(mallaSeleccionada && mallaSeleccionada === valorSeleccionado);

    if (esLaMisma) {
        ocultarModalSeleccionMalla();
        await mostrarAviso('Sin cambios', 'Ya estás usando esta malla curricular.');
        return;
    }

    const confirmar = await mostrarConfirmacion({
        titulo: estaCambiando ? 'Confirmar cambio de malla' : 'Confirmar malla curricular',
        mensaje: estaCambiando
            ? `Vas a cambiar a: ${obtenerNombreMalla(valorSeleccionado)}. Se borrarán tus cursos aprobados, notas, bitácora TCU y fotos sincronizadas de la cuenta.`
            : `Seleccionaste: ${obtenerNombreMalla(valorSeleccionado)}. Esta malla se guardará en tu cuenta. Luego podrás cambiarla, pero podrías perder la información registrada.`,
        textoAceptar: estaCambiando ? 'Sí, cambiar malla' : 'Guardar malla',
        textoCancelar: 'Cancelar',
        peligro: estaCambiando
    });

    if (!confirmar || usuarioActual?.uid !== uidInicial || versionSesion !== versionInicial) return;

    const uid = uidInicial;
    const datosNuevos = {
        mallaSeleccionada: valorSeleccionado,
        estadoCursos: {},
        bitacoraTCU: [],
        nombreTCU: '',
        actualizadoEn: firebase.firestore.FieldValue.serverTimestamp()
    };

    if (!mallaSeleccionada) {
        datosNuevos.creadoEn = firebase.firestore.FieldValue.serverTimestamp();
    }

    // Solo se cambia el estado visible después de confirmar el guardado remoto.
    if (!await guardarDatosEnFirebase(datosNuevos)) return;
    if (usuarioActual?.uid !== uid || versionSesion !== versionInicial) return;

    cargarMallaPorId(valorSeleccionado);
    estadoCursos = {};
    bitacoraTCU = [];
    nombreTCU = '';
    editandoTCUIndex = -1;
    limpiarFormularioTCU();

    if (typeof reiniciarEstadoMotivacion === 'function') {
        reiniciarEstadoMotivacion();
    }

    ocultarModalSeleccionMalla();
    renderMalla();
    renderBitacoraTCU();

    if (estaCambiando && typeof eliminarFotosTCUDeUsuario === 'function') {
        try {
            await eliminarFotosTCUDeUsuario(uid);
            renderBitacoraTCU();
        } catch (error) {
            console.error('No se pudieron eliminar las fotos del TCU:', error);
            await mostrarAviso('Fotos pendientes de borrar', 'La malla cambió. Se intentará borrar las fotos al iniciar sesión o recuperar la conexión. Si persisten, revisa los permisos de Firestore.');
        }
    }

    registrarEvento(estaCambiando ? 'cambiar_malla' : 'seleccionar_malla', {
        malla_anterior: mallaAnterior,
        malla_destino: valorSeleccionado,
        nombre_malla_destino: obtenerNombreMalla(valorSeleccionado)
    });

    await mostrarAviso(
        estaCambiando ? 'Malla cambiada' : 'Malla guardada',
        estaCambiando
            ? 'Tu nueva malla fue cargada correctamente. Tus datos anteriores fueron reiniciados.'
            : 'Tu malla fue guardada correctamente.'
    );
}

