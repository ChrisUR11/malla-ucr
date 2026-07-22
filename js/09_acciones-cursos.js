// --- Acciones de cursos ---
async function toggleCurso(codigo, aprobado) {
    if (!requiereSesion()) {
        renderMalla();
        return;
    }

    if (!mallaSeleccionada) {
        mostrarModalSeleccionMalla();
        renderMalla();
        return;
    }

    const notaActual = obtenerNotaNumerica(codigo);

    // Evita que apruebes con check si ya hay una nota reprobada registrada
    if (aprobado && notaActual !== null && notaActual < 7) {
        await mostrarAviso(
            'No se puede aprobar',
            'Este curso tiene una nota menor a 7. Si deseas aprobarlo, haz clic en el curso y actualiza la nota a 7 o más.'
        );
        renderMalla();
        return;
    }

    estadoCursos[codigo] = estadoCursos[codigo] || {};
    estadoCursos[codigo].aprobado = aprobado;

    const guardado = await guardarDatosEnFirebase();

    if (guardado) {
        registrarEvento(aprobado ? 'aprobar_curso' : 'desmarcar_curso', {
            ...obtenerDatosCursoAnalytics(codigo),
            estado_aprobado: aprobado ? 'si' : 'no'
        });
    } else {
        estadoCursos[codigo].aprobado = !aprobado;
    }

    renderMalla();

    // NUEVO: Si lo marcas con el check y no tiene nota, te avisa que puedes ingresarla
    if (aprobado && notaActual === null) {
        await mostrarAviso(
            '¡Curso aprobado!',
            'Recuerda que puedes hacer clic sobre el curso para registrar tu nota.'
        );
    }
}

async function actualizarNota(codigo, valorInput) {
    if (!requiereSesion()) return;

    if (!mallaSeleccionada) {
        mostrarModalSeleccionMalla();
        return;
    }

    // --- AQUÍ ELIMINAMOS EL CANDADO QUE EXIGÍA APROBAR EL CURSO PRIMERO ---

    if (!valorInput || valorInput.trim() === '') {
        if (estadoCursos[codigo]) {
            delete estadoCursos[codigo].nota;
        }

        const guardado = await guardarDatosEnFirebase();

        if (guardado) {
            registrarEvento('eliminar_nota', {
                ...obtenerDatosCursoAnalytics(codigo)
            });
        }

        renderMalla();
        return;
    }

    const nota = procesarNotaInput(valorInput);

    if (nota === null) {
        await mostrarAviso('Nota inválida', 'La nota debe ser un número válido entre 0 y 10.');
        renderMalla();
        return;
    }

    if (nota < 7) {
        const confirmar = await mostrarConfirmacion({
            titulo: 'Nota menor a 7',
            mensaje: 'Esta nota es menor a 7. El curso quedará como no aprobado. ¿Deseas continuar?',
            textoAceptar: 'Guardar nota',
            textoCancelar: 'Cancelar',
            peligro: true
        });

        if (!confirmar) {
            renderMalla();
            return;
        }
    }

    estadoCursos[codigo] = estadoCursos[codigo] || {};
    estadoCursos[codigo].nota = nota;

    // --- ESTA LÓGICA YA LA TENÍAS: AUTO-MARCA EL CHECK SI LA NOTA ES >= 7 ---
    if (nota >= 7) {
        estadoCursos[codigo].aprobado = true;
    } else {
        estadoCursos[codigo].aprobado = false;
    }

    const guardado = await guardarDatosEnFirebase();

    if (guardado) {
        registrarEvento('guardar_nota', {
            ...obtenerDatosCursoAnalytics(codigo),
            rango_nota: obtenerRangoNota(nota),
            curso_quedo_aprobado: nota >= 7 ? 'si' : 'no'
        });
    }

    renderMalla();
}