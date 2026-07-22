// --- Modal de notas ---
function abrirModal(codigo, nombre) {
    if (!requiereSesion()) return;

    if (!mallaSeleccionada) {
        mostrarModalSeleccionMalla();
        return;
    }

    // --- AQUÍ ELIMINAMOS EL CANDADO QUE BLOQUEABA ABRIR LA VENTANA ---

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