// --- Selección de malla ---
async function guardarMallaSeleccionada() {
    if (!usuarioActual) {
        mostrarModalLogin();
        return;
    }

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
            ? `Vas a cambiar a: ${obtenerNombreMalla(valorSeleccionado)}. Esta acción reiniciará tus cursos aprobados, notas y bitácora TCU guardados.`
            : `Seleccionaste: ${obtenerNombreMalla(valorSeleccionado)}. Esta malla se guardará en tu cuenta. Luego podrás cambiarla, pero podrías perder la información registrada.`,
        textoAceptar: estaCambiando ? 'Sí, cambiar malla' : 'Guardar malla',
        textoCancelar: 'Cancelar',
        peligro: estaCambiando
    });

    if (!confirmar) return;

    const mallaCargada = cargarMallaPorId(valorSeleccionado);

    if (!mallaCargada) return;

    try {
        await db.collection('usuarios').doc(usuarioActual.uid).set({
            mallaSeleccionada: valorSeleccionado,
            estadoCursos: {},
            bitacoraTCU: [],
            creadoEn: firebase.firestore.FieldValue.serverTimestamp(),
            actualizadoEn: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        estadoCursos = {};
        bitacoraTCU = [];
        editandoTCUIndex = -1;

        ocultarModalSeleccionMalla();

        registrarEvento(estaCambiando ? 'cambiar_malla' : 'seleccionar_malla', {
            malla_anterior: mallaAnterior,
            malla_destino: valorSeleccionado,
            nombre_malla_destino: obtenerNombreMalla(valorSeleccionado)
        });

        renderMalla();
        renderBitacoraTCU();

        await mostrarAviso(
            estaCambiando ? 'Malla cambiada' : 'Malla guardada',
            estaCambiando
                ? 'Tu nueva malla fue cargada correctamente. Tus datos anteriores fueron reiniciados.'
                : 'Tu malla fue guardada correctamente.'
        );
    } catch (error) {
        console.error('Error guardando malla seleccionada:', error);
        await mostrarAviso('Error al guardar', 'No se pudo guardar la malla seleccionada.');
    }
}

