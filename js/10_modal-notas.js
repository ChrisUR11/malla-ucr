// --- Modal de notas ---
function abrirModal(codigo, nombre) {
    if (estadoCursos[codigo] && estadoCursos[codigo].heredado) {
        if (typeof mostrarToast === 'function') {
            mostrarToast('Optativa vinculada. Edita la nota en la pestaña del catálogo.');
        }
        return; // Detiene la función
    }

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

async function limpiarNotaModal() {
    const inputCodigo = document.getElementById('input-codigo-modal').value;

    if (estadoCursos[inputCodigo]) {
        // Borramos la nota de la memoria local primero
        delete estadoCursos[inputCodigo].nota;

        // Sincronizamos para que la genérica también pierda la nota
        if (typeof sincronizarOptativas === 'function') {
            sincronizarOptativas();
        }

        // Le damos la orden destructiva a Firebase para la nube
        estadoCursos[inputCodigo].nota = firebase.firestore.FieldValue.delete();

        // Guardamos
        await guardarDatosEnFirebase();

        // Limpiamos el rastro del FieldValue de la memoria local
        delete estadoCursos[inputCodigo].nota;

        renderMalla();
    }

    cerrarModal();
}