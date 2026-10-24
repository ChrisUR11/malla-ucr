// --- Reglas para habilitar Bitácora TCU ---
const PORCENTAJE_MINIMO_TCU = 50;
const CODIGO_SEMINARIO_TCU = 'SR-I';
let guardandoBitacoraTCU = false;
let versionGuardadoBitacoraTCU = 0;

function invalidarGuardadoBitacoraTCU() {
    versionGuardadoBitacoraTCU += 1;
    guardandoBitacoraTCU = false;
    const boton = $('btn-guardar-tcu');
    if (boton) boton.disabled = false;
}

function obtenerEstadoRequisitosTCU() {
    const resumen = calcularResumenProgreso();
    const avance = Number(resumen.porcentajeAvance) || 0;
    const seminarioAprobado = Boolean(estadoCursos[CODIGO_SEMINARIO_TCU]?.aprobado);

    const cumpleAvance = avance >= PORCENTAJE_MINIMO_TCU;
    const puedeAbrir = cumpleAvance && seminarioAprobado;

    let mensaje = '';

    if (!cumpleAvance && !seminarioAprobado) {
        mensaje = `Para abrir la Bitácora TCU debes tener al menos ${PORCENTAJE_MINIMO_TCU}% de avance y Seminario de Realidad Nacional I aprobado. Actualmente llevas ${avance.toFixed(1).replace('.', ',')}% de avance.`;
    } else if (!cumpleAvance) {
        mensaje = `Para abrir la Bitácora TCU debes tener al menos ${PORCENTAJE_MINIMO_TCU}% de avance. Actualmente llevas ${avance.toFixed(1).replace('.', ',')}%.`;
    } else if (!seminarioAprobado) {
        mensaje = 'Para abrir la Bitácora TCU debes tener aprobado Seminario de Realidad Nacional I.';
    } else {
        mensaje = 'Puedes abrir la Bitácora TCU.';
    }

    return {
        puedeAbrir,
        avance,
        cumpleAvance,
        seminarioAprobado,
        mensaje
    };
}

function actualizarEstadoBotonTCU() {
    const boton = $('btn-tcu-principal');

    if (!boton) return;

    if (!usuarioActual || !mallaSeleccionada) {
        boton.textContent = 'Bitácora TCU';
        boton.classList.remove('btn-tcu-bloqueado');
        boton.removeAttribute('aria-disabled');
        boton.title = 'Abrir Bitácora TCU';
        return;
    }

    const estadoTCU = obtenerEstadoRequisitosTCU();

    if (estadoTCU.puedeAbrir) {
        boton.textContent = 'Bitácora TCU';
        boton.classList.remove('btn-tcu-bloqueado');
        boton.setAttribute('aria-disabled', 'false');
        boton.title = 'Abrir Bitácora TCU';
    } else {
        boton.textContent = 'TCU bloqueado';
        boton.classList.add('btn-tcu-bloqueado');
        boton.setAttribute('aria-disabled', 'true');
        boton.title = estadoTCU.mensaje;
    }
}

// --- Bitácora TCU ---
function renderBitacoraTCU() {
    const tbody = $('tcu-tbody');

    if (!tbody) return;

    limpiarURLsFotosTCU();
    tbody.innerHTML = '';
    let totalHoras = 0;
    const contenedoresFotos = new Map();

    const bitacoraOrdenada = bitacoraTCU
        .map((entrada, index) => ({ entrada, index }))
        .sort((a, b) => String(b.entrada.fecha).localeCompare(String(a.entrada.fecha)));

    bitacoraOrdenada.forEach(({ entrada, index }) => {
        const horasNumero = Number(entrada.horas);

        if (Number.isFinite(horasNumero)) {
            totalHoras += horasNumero;
        }

        const tr = document.createElement('tr');

        const tdFecha = document.createElement('td');
        tdFecha.dataset.label = 'Fecha';
        tdFecha.textContent = entrada.fecha;

        const tdActividad = document.createElement('td');
        tdActividad.dataset.label = 'Actividad';
        const descripcion = document.createElement('div');
        descripcion.textContent = entrada.actividad;
        tdActividad.appendChild(descripcion);
        if (entrada.id) {
            const fotos = document.createElement('div');
            fotos.className = 'tcu-fotos-lista';
            fotos.setAttribute('aria-label', 'Fotos de esta actividad');
            tdActividad.appendChild(fotos);
            contenedoresFotos.set(entrada.id, fotos);
        }

        const tdHoras = document.createElement('td');
        tdHoras.dataset.label = 'Horas';
        const strongHoras = document.createElement('strong');
        strongHoras.textContent = formatearHoras(entrada.horas);
        tdHoras.appendChild(strongHoras);

        const tdAcciones = document.createElement('td');
        tdAcciones.dataset.label = 'Acciones';
        tdAcciones.className = 'tcu-acciones';

        const btnEditar = document.createElement('button');
        btnEditar.type = 'button';
        btnEditar.className = 'btn-editar-tcu';
        btnEditar.textContent = 'Editar';
        btnEditar.setAttribute('aria-label', `Editar actividad del ${entrada.fecha}`);
        btnEditar.addEventListener('click', () => editarEntradaTCU(index));

        const btnEliminar = document.createElement('button');
        btnEliminar.type = 'button';
        btnEliminar.className = 'btn-eliminar-tcu';
        btnEliminar.textContent = 'Eliminar';
        btnEliminar.setAttribute('aria-label', `Eliminar actividad del ${entrada.fecha}`);
        btnEliminar.addEventListener('click', () => eliminarEntradaTCU(index));

        tdAcciones.appendChild(btnEditar);
        tdAcciones.appendChild(btnEliminar);

        tr.appendChild(tdFecha);
        tr.appendChild(tdActividad);
        tr.appendChild(tdHoras);
        tr.appendChild(tdAcciones);

        tbody.appendChild(tr);
    });

    if (!bitacoraOrdenada.length) {
        const fila = document.createElement('tr');
        const celda = document.createElement('td');
        celda.colSpan = 4;
        celda.className = 'tcu-sin-entradas';
        celda.textContent = 'Todavía no hay actividades registradas.';
        fila.appendChild(celda);
        tbody.appendChild(fila);
    }

    pintarFotosTCU(contenedoresFotos, usuarioActual?.uid);

    setText('tcu-horas-total', `${formatearHoras(totalHoras)} / ${TOTAL_HORAS_TCU}`);

    // Verifica si la meta se acaba de cumplir con este nuevo total de horas
    if (typeof verificarLogroTCU === 'function') {
        verificarLogroTCU(totalHoras);
    }

    const porcentaje = Math.min((totalHoras / TOTAL_HORAS_TCU) * 100, 100);
    const barraTCU = $('tcu-progress-fill');

    if (barraTCU) {
        barraTCU.style.width = `${porcentaje}%`;
    }
}

async function agregarEntradaTCU() {
    if (!requiereSesion()) return;

    if (!mallaSeleccionada) {
        mostrarModalSeleccionMalla();
        return;
    }

    const inputFecha = $('tcu-fecha');
    const inputHoras = $('tcu-horas');
    const inputActividad = $('tcu-actividad');
    const inputFotos = $('tcu-fotos');
    const botonGuardar = $('btn-guardar-tcu');

    if (!inputFecha || !inputHoras || !inputActividad || guardandoBitacoraTCU) return;

    const fecha = obtenerTexto(inputFecha.value);
    const horasTexto = obtenerTexto(inputHoras.value).replace(',', '.');
    const actividad = obtenerTexto(inputActividad.value);
    const horas = Number(horasTexto);

    if (!fecha || !horasTexto || !actividad) {
        mostrarAviso('Campos incompletos', 'Por favor, llena todos los campos.');
        return;
    }

    if (!fechaValida(fecha)) {
        mostrarAviso('Fecha inválida', 'La fecha ingresada no es válida.');
        return;
    }

    if (!Number.isFinite(horas) || horas <= 0) {
        mostrarAviso('Horas inválidas', 'Las horas deben ser mayores a 0.');
        return;
    }

    if (Math.abs(horas * 2 - Math.round(horas * 2)) > 1e-9) {
        mostrarAviso('Horas inválidas', 'Registra las horas en incrementos de 0,5.');
        return;
    }

    if (horas > TOTAL_HORAS_TCU) {
        mostrarAviso('Horas excedidas', 'Las horas de una sola entrada no pueden superar las 300 horas del TCU.');
        return;
    }

    const totalActual = bitacoraTCU.reduce((total, entrada, index) => {
        if (index === editandoTCUIndex) return total;

        const numero = Number(entrada.horas);
        return total + (Number.isFinite(numero) ? numero : 0);
    }, 0);

    if (totalActual + horas > TOTAL_HORAS_TCU) {
        mostrarAviso('Límite de TCU', 'El total de horas no puede superar las 300 horas del TCU.');
        return;
    }

    const estabaEditando = editandoTCUIndex >= 0;
    const indexEditado = editandoTCUIndex;
    const entradaAnterior = estabaEditando ? bitacoraTCU[indexEditado] : null;
    if (estabaEditando && !entradaAnterior) return;
    const entrada = {
        ...entradaAnterior,
        id: entradaAnterior?.id || crearIdTCU(),
        fecha,
        horas: Number(horas.toFixed(1)),
        actividad
    };
    const uid = usuarioActual.uid;
    const bitacoraEnGuardado = bitacoraTCU;
    const archivos = Array.from(inputFotos?.files || []);
    let fotosPreparadas = [];

    guardandoBitacoraTCU = true;
    const versionOperacion = ++versionGuardadoBitacoraTCU;
    if (botonGuardar) botonGuardar.disabled = true;
    try {
        if (archivos.length) {
            try {
                fotosPreparadas = await prepararFotosTCU(uid, entrada.id, archivos);
            } catch (error) {
                await mostrarAviso('Fotos no válidas', error.message || 'No se pudieron preparar las fotos.');
                return;
            }
        }
        if (usuarioActual?.uid !== uid || bitacoraTCU !== bitacoraEnGuardado) return;

        const bitacoraNueva = [...bitacoraEnGuardado];
        if (estabaEditando) bitacoraNueva[indexEditado] = entrada;
        else bitacoraNueva.push(entrada);

        const guardado = await guardarDatosEnFirebase({ bitacoraTCU: bitacoraNueva });
        if (usuarioActual?.uid !== uid || bitacoraTCU !== bitacoraEnGuardado) return;
        if (!guardado) return;
        bitacoraTCU = bitacoraNueva;

        registrarEvento(estabaEditando ? 'editar_entrada_tcu' : 'agregar_entrada_tcu', {
            horas_tcu: entrada.horas,
            total_horas_tcu: obtenerTotalHorasTCU(),
            total_entradas_tcu: bitacoraTCU.length
        });

        let errorFotos = false;
        if (fotosPreparadas.length) {
            try {
                await guardarFotosTCU(fotosPreparadas);
            } catch (error) {
                errorFotos = true;
                console.error('Error guardando fotos locales TCU:', error);
            }
        }

        if (usuarioActual?.uid !== uid || bitacoraTCU !== bitacoraNueva) return;

        limpiarFormularioTCU();
        renderBitacoraTCU();
        if (errorFotos) {
            await mostrarAviso('Actividad guardada sin fotos', 'La actividad se guardó, pero este navegador no pudo guardar las fotos. Abre Editar y selecciónalas de nuevo.');
        }
    } finally {
        if (versionGuardadoBitacoraTCU === versionOperacion) {
            guardandoBitacoraTCU = false;
            if (botonGuardar) botonGuardar.disabled = false;
        }
    }
}

function editarEntradaTCU(index) {
    if (!requiereSesion()) return;
    if (guardandoBitacoraTCU) return;

    const entrada = bitacoraTCU[index];

    if (!entrada) return;

    registrarEvento('abrir_edicion_tcu', {
        horas_tcu: Number(entrada.horas) || 0,
        total_horas_tcu: obtenerTotalHorasTCU(),
        total_entradas_tcu: bitacoraTCU.length
    });

    const inputFecha = $('tcu-fecha');
    const inputHoras = $('tcu-horas');
    const inputActividad = $('tcu-actividad');
    const btn = $('btn-guardar-tcu');

    if (inputFecha) inputFecha.value = entrada.fecha;
    if (inputHoras) inputHoras.value = entrada.horas;
    if (inputActividad) inputActividad.value = entrada.actividad;
    const inputFotos = $('tcu-fotos');
    if (inputFotos) inputFotos.value = '';

    editandoTCUIndex = index;

    if (btn) {
        btn.textContent = 'Actualizar';
        btn.style.backgroundColor = '#f57c00';
    }
}

async function eliminarEntradaTCU(index) {
    if (!requiereSesion()) return;
    if (guardandoBitacoraTCU) return;

    const uid = usuarioActual.uid;
    const entrada = bitacoraTCU[index];

    if (!entrada) return;

    const confirmar = await mostrarConfirmacion({
        titulo: 'Eliminar entrada de TCU',
        mensaje: '¿Seguro que deseas eliminar esta entrada de la bitácora? Esta acción no se puede deshacer.',
        textoAceptar: 'Eliminar',
        textoCancelar: 'Cancelar',
        peligro: true
    });

    if (!confirmar || guardandoBitacoraTCU || usuarioActual?.uid !== uid || bitacoraTCU[index] !== entrada) return;

    guardandoBitacoraTCU = true;
    const versionOperacion = ++versionGuardadoBitacoraTCU;
    const bitacoraEnGuardado = bitacoraTCU;
    const bitacoraNueva = bitacoraEnGuardado.filter((_, posicion) => posicion !== index);
    try {
        const guardado = await guardarDatosEnFirebase({ bitacoraTCU: bitacoraNueva });
        if (usuarioActual?.uid !== uid || bitacoraTCU !== bitacoraEnGuardado || !guardado) return;
        bitacoraTCU = bitacoraNueva;

        registrarEvento('eliminar_entrada_tcu', {
            horas_tcu_eliminadas: Number(entrada.horas) || 0,
            total_horas_tcu: obtenerTotalHorasTCU(),
            total_entradas_tcu: bitacoraTCU.length
        });

        if (editandoTCUIndex === index) {
            limpiarFormularioTCU();
        } else if (editandoTCUIndex > index) {
            editandoTCUIndex -= 1;
        }

        renderBitacoraTCU();
        if (entrada.id) {
            try {
                await eliminarFotosTCUDeEntrada(uid, entrada.id);
            } catch (error) {
                console.error('Error eliminando fotos locales de TCU:', error);
                if (usuarioActual?.uid === uid) {
                    await mostrarAviso('Fotos locales pendientes', 'La actividad se eliminó, pero este navegador no pudo borrar sus fotos. Revisa el almacenamiento del sitio.');
                }
            }
        }
    } finally {
        if (versionGuardadoBitacoraTCU === versionOperacion) guardandoBitacoraTCU = false;
    }
}

async function abrirModalTCU() {
    if (!requiereSesion()) return;

    if (!mallaSeleccionada) {
        mostrarModalSeleccionMalla();
        return;
    }

    const estadoTCU = obtenerEstadoRequisitosTCU();

    if (!estadoTCU.puedeAbrir) {
        registrarEvento('intento_abrir_tcu_bloqueado', {
            avance_actual: Number(estadoTCU.avance.toFixed(1)),
            cumple_avance: estadoTCU.cumpleAvance ? 'si' : 'no',
            seminario_aprobado: estadoTCU.seminarioAprobado ? 'si' : 'no'
        });

        await mostrarAviso('Bitácora TCU bloqueada', estadoTCU.mensaje);
        return;
    }

    registrarEvento('abrir_bitacora_tcu', {
        total_horas_tcu: obtenerTotalHorasTCU(),
        total_entradas_tcu: bitacoraTCU.length,
        avance_actual: Number(estadoTCU.avance.toFixed(1))
    });

    // Cargar el nombre del TCU guardado de forma segura
    const inputNombre = $('tcu-nombre-proyecto');
    if (inputNombre) {
        inputNombre.value = nombreTCU || '';
    }

    renderBitacoraTCU();
    mostrarModal('modal-tcu');
}

async function guardarNombreTCU() {
    const inputNombre = $('tcu-nombre-proyecto');
    if (!inputNombre || !usuarioActual) return;
    const uid = usuarioActual.uid;
    const sesionInicial = typeof versionSesion === 'number' ? versionSesion : null;
    const nombreAnterior = nombreTCU;
    const nombreNuevo = inputNombre.value.trim();
    nombreTCU = nombreNuevo;
    const guardado = await guardarDatosEnFirebase({ nombreTCU });
    if (usuarioActual?.uid !== uid || (sesionInicial !== null && versionSesion !== sesionInicial)) return;
    if (!guardado && nombreTCU === nombreNuevo) {
        nombreTCU = nombreAnterior;
        if (inputNombre.value.trim() === nombreNuevo) inputNombre.value = nombreAnterior;
    }
}

function cerrarModalTCU() {
    cerrarModalPorId('modal-tcu');
    limpiarFormularioTCU();
    limpiarURLsFotosTCU();
}

