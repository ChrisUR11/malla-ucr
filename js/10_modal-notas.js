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

async function limpiarNotaModal() {
    const inputCodigo = document.getElementById('input-codigo-modal').value;

    if (estadoCursos[inputCodigo]) {
        // 1. Comando explícito: Le decimos a la nube que destruya este campo
        estadoCursos[inputCodigo].nota = firebase.firestore.FieldValue.delete();

        // 2. Sincronizamos con Firebase (ahora sí lo borrará de verdad)
        await guardarDatosEnFirebase();

        // 3. Limpiamos nuestra memoria local para que la interfaz no se confunda
        delete estadoCursos[inputCodigo].nota;

        // 4. Refrescamos la malla para actualizar el diseño
        renderMalla();
    }

    cerrarModal();
}