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

    if (aprobado && notaActual !== null && notaActual < 7) {
        await mostrarAviso(
            'No se puede aprobar',
            'Este curso tiene una nota menor a 7. Para marcar un curso como aprobado, la nota debe ser 7 o más.'
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
}

async function actualizarNota(codigo, valorInput) {
    if (!requiereSesion()) return;

    if (!mallaSeleccionada) {
        mostrarModalSeleccionMalla();
        return;
    }

    const cursoAprobado = Boolean(estadoCursos[codigo]?.aprobado);
    const yaTieneNota = tieneNotaRegistrada(codigo);

    if (!cursoAprobado && !yaTieneNota) {
        await mostrarAviso(
            'Curso no aprobado',
            'Primero debes marcar el curso como aprobado para poder agregar una nota.'
        );

        renderMalla();
        return;
    }

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
            mensaje: 'Esta nota es menor a 7. Un curso se aprueba con 7 o más. Si guardas esta nota, el curso quedará como no aprobado. ¿Deseas continuar?',
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

