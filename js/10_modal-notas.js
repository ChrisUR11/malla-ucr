// --- Modal de notas ---
function abrirModal(codigo, nombre) {
    if (!requiereSesion()) return;

    if (!mallaSeleccionada) {
        mostrarModalSeleccionMalla();
        return;
    }

    const cursoAprobado = Boolean(estadoCursos[codigo]?.aprobado);
    const yaTieneNota = tieneNotaRegistrada(codigo);

    if (!cursoAprobado && !yaTieneNota) {
        mostrarAviso(
            'Curso no aprobado',
            'Primero debes marcar el curso como aprobado para poder agregar una nota.'
        );

        return;
    }

    registrarEvento('abrir_modal_nota', {
        ...obtenerDatosCursoAnalytics(codigo)
    });

    setText('modal-curso-nombre', nombre);

    const inputCodigo = $('input-codigo-modal');
    const inputNota = $('input-nota-modal');

    if (inputCodigo) inputCodigo.value = codigo;

    const notaActual = estadoCursos[codigo]?.nota;

    if (inputNota) {
        inputNota.value = formatearNota(notaActual);
    }

    mostrarModal('modal-nota');

    if (inputNota) {
        inputNota.focus();
    }
}

function cerrarModal() {
    cerrarModalPorId('modal-nota');
}

function guardarNotaModal() {
    const inputCodigo = $('input-codigo-modal');
    const inputNota = $('input-nota-modal');

    if (!inputCodigo || !inputNota) return;

    actualizarNota(inputCodigo.value, inputNota.value);
    cerrarModal();
}

