// --- Restablecer datos del usuario ---
async function restablecerMisDatos() {
    if (!requiereSesion()) return;

    const confirmar = await mostrarConfirmacion({
        titulo: 'Restablecer mis datos',
        mensaje: '¿Seguro que deseas borrar tus notas, cursos aprobados y bitácora TCU? Esta acción no se puede deshacer.',
        textoAceptar: 'Borrar datos',
        textoCancelar: 'Cancelar',
        peligro: true
    });

    if (!confirmar) return;

    estadoCursos = {};
    bitacoraTCU = [];
    editandoTCUIndex = -1;

    const guardado = await guardarDatosEnFirebase();

    if (guardado) {
        registrarEvento('restablecer_datos_usuario');
        limpiarFormularioTCU();
        renderMalla();
        renderBitacoraTCU();
        await mostrarAviso('Datos restablecidos', 'Tus datos fueron restablecidos correctamente.');
    }
}

