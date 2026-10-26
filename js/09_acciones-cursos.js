// Las operaciones de cursos se serializan para que un fallo no restaure encima
// de otra edición iniciada antes de terminar el guardado anterior.
let guardandoCambioCurso = false;

function puedeEditarCurso(codigo) {
    if (estadoCursos[codigo]?.heredado) {
        mostrarToast('Optativa vinculada. Modifícala desde la pestaña del catálogo.');
        return false;
    }

    if (!requiereSesion()) return false;
    if (!mallaSeleccionada) {
        mostrarModalSeleccionMalla();
        return false;
    }

    if (guardandoCambioCurso) {
        mostrarToast('Espera a que termine de guardarse el cambio anterior.');
        return false;
    }

    return true;
}

async function guardarCambioCurso(codigo, cambiarEstado, evento, parametros = {}, cursoEsperado = null) {
    if (guardandoCambioCurso) {
        mostrarToast('Espera a que termine de guardarse el cambio anterior.');
        return false;
    }

    const estadoAnterior = cursoEsperado || copiarDatos(estadoCursos[codigo] || {});
    const uid = usuarioActual.uid;
    const idMalla = mallaSeleccionada;
    const versionInicial = versionSesion;
    guardandoCambioCurso = true;

    try {
        const guardado = await mutarCursoEnFirebase(codigo, cambiarEstado, estadoAnterior);
        if (!guardado) return false;

        const sigueEnLaMismaMalla = usuarioActual?.uid === uid &&
            versionSesion === versionInicial && mallaSeleccionada === idMalla;
        if (sigueEnLaMismaMalla) {
            registrarEvento(evento, {
                ...obtenerDatosCursoAnalytics(codigo),
                ...parametros
            });
        }
        return sigueEnLaMismaMalla;
    } finally {
        if (versionSesion === versionInicial) {
            guardandoCambioCurso = false;
            renderMalla();
        }
    }
}

async function toggleCurso(codigo, aprobado) {
    if (!puedeEditarCurso(codigo)) {
        renderMalla();
        return false;
    }

    const notaActual = obtenerNotaNumerica(codigo);
    if (aprobado && notaActual !== null && notaActual < 7) {
        await mostrarAviso(
            'No se puede aprobar',
            'Este curso tiene una nota menor a 7. Si deseas aprobarlo, haz clic en el curso y actualiza la nota a 7 o más.'
        );
        renderMalla();
        return false;
    }

    const guardado = await guardarCambioCurso(codigo, curso => {
        curso.aprobado = aprobado;
    }, aprobado ? 'aprobar_curso' : 'desmarcar_curso', {
        estado_aprobado: aprobado ? 'si' : 'no'
    });

    if (guardado && aprobado && notaActual === null) {
        mostrarToast('Curso aprobado. Puedes registrar tu nota cuando gustes.');
    }

    return guardado;
}

async function actualizarNota(codigo, valorInput, cursoEsperado = null) {
    if (!puedeEditarCurso(codigo)) return false;

    const texto = obtenerTexto(valorInput);
    if (texto === '') {
        return guardarCambioCurso(codigo, curso => {
            delete curso.nota;
        }, 'eliminar_nota', {}, cursoEsperado);
    }

    const nota = procesarNotaInput(texto);
    if (nota === null) {
        await mostrarAviso('Nota inválida', 'La nota debe ser un número válido entre 0 y 10.');
        return false;
    }

    if (nota < 7) {
        const confirmar = await mostrarConfirmacion({
            titulo: 'Nota menor a 7',
            mensaje: 'Esta nota es menor a 7. El curso quedará como no aprobado. ¿Deseas continuar?',
            textoAceptar: 'Guardar nota',
            textoCancelar: 'Cancelar',
            peligro: true
        });
        if (!confirmar) return false;
    }

    return guardarCambioCurso(codigo, curso => {
        curso.nota = nota;
        curso.aprobado = nota >= 7;
    }, 'guardar_nota', {
        rango_nota: obtenerRangoNota(nota),
        curso_quedo_aprobado: nota >= 7 ? 'si' : 'no'
    }, cursoEsperado);
}
