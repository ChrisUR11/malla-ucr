// --- Reglas para habilitar Bitácora TCU ---
const PORCENTAJE_MINIMO_TCU = 50;
const CODIGO_SEMINARIO_TCU = 'SR-I';
let guardandoBitacoraTCU = false;
let versionGuardadoBitacoraTCU = 0;
let entradaTCUEnEdicion = null;

function invalidarGuardadoBitacoraTCU() {
    versionGuardadoBitacoraTCU += 1;
    guardandoBitacoraTCU = false;
    entradaTCUEnEdicion = null;
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
    const lista = $('tcu-entradas');

    if (!lista) return;

    limpiarURLsFotosTCU();
    lista.replaceChildren();
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

        const tarjeta = document.createElement('article');
        tarjeta.className = 'tcu-entrada';

        const encabezado = document.createElement('div');
        encabezado.className = 'tcu-entrada-encabezado';
        const fecha = document.createElement('time');
        fecha.className = 'tcu-entrada-fecha';
        fecha.dateTime = entrada.fecha;
        const partesFecha = String(entrada.fecha || '').split('-');
        fecha.textContent = partesFecha.length === 3
            ? `${partesFecha[2]}/${partesFecha[1]}/${partesFecha[0]}`
            : String(entrada.fecha || 'Sin fecha');
        const horas = document.createElement('span');
        horas.className = 'tcu-entrada-horas';
        horas.textContent = `${formatearHoras(entrada.horas)} ${Number(entrada.horas) === 1 ? 'hora' : 'horas'}`;
        encabezado.append(fecha, horas);

        const descripcion = document.createElement('div');
        descripcion.className = 'tcu-entrada-actividad';
        descripcion.textContent = entrada.actividad;
        tarjeta.append(encabezado, descripcion);
        if (entrada.id) {
            const fotos = document.createElement('div');
            fotos.className = 'tcu-fotos-lista';
            fotos.setAttribute('aria-label', 'Fotos de esta actividad');
            tarjeta.appendChild(fotos);
            contenedoresFotos.set(entrada.id, fotos);
        }

        const acciones = document.createElement('div');
        acciones.className = 'tcu-acciones';

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

        acciones.append(btnEditar, btnEliminar);
        tarjeta.appendChild(acciones);
        lista.appendChild(tarjeta);
    });

    if (!bitacoraOrdenada.length) {
        const vacio = document.createElement('p');
        vacio.className = 'tcu-sin-entradas';
        vacio.textContent = 'Todavía no hay actividades registradas. Añade la primera con el formulario.';
        lista.appendChild(vacio);
    }

    setText('tcu-entradas-total', `${bitacoraOrdenada.length} ${bitacoraOrdenada.length === 1 ? 'actividad' : 'actividades'}`);

    if ($('modal-tcu')?.style.display === 'flex') {
        pintarFotosTCU(contenedoresFotos, usuarioActual?.uid);
    }

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

    const estabaEditando = Boolean(entradaTCUEnEdicion || editandoTCUIndex >= 0);
    const entradaAnterior = entradaTCUEnEdicion ||
        (editandoTCUIndex >= 0 ? copiarDatos(bitacoraTCU[editandoTCUIndex]) : null);
    if (estabaEditando && !entradaAnterior) return;
    const totalActual = bitacoraTCU.reduce((total, item, index) => {
        if (entradaAnterior && (item.id === entradaAnterior.id ||
            (!entradaAnterior.id && index === editandoTCUIndex))) return total;
        const numero = Number(item.horas);
        return total + (Number.isFinite(numero) ? numero : 0);
    }, 0);

    if (totalActual + horas > TOTAL_HORAS_TCU) {
        mostrarAviso('Límite de TCU', 'El total de horas no puede superar las 300 horas del TCU.');
        return;
    }

    const entrada = {
        ...entradaAnterior,
        id: entradaAnterior?.id || crearIdTCU(),
        fecha,
        horas: Number(horas.toFixed(1)),
        actividad
    };
    const uid = usuarioActual.uid;
    const mallaInicial = mallaSeleccionada;
    const sesionInicial = versionSesion;
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
                const errorServicio = ['permission-denied', 'unavailable', 'unauthenticated'].includes(error.code);
                await mostrarAviso(
                    errorServicio ? 'No se pudieron cargar las fotos' : 'Fotos no válidas',
                    errorServicio
                        ? 'Revisa tu conexión y que las reglas de fotos de Firestore estén publicadas. Los archivos siguen seleccionados para reintentar.'
                        : error.message || 'No se pudieron preparar las fotos.'
                );
                return;
            }
        }
        if (usuarioActual?.uid !== uid || versionSesion !== sesionInicial ||
            mallaSeleccionada !== mallaInicial) return;

        const resultado = await mutarBitacoraEnFirebase({
            tipo: estabaEditando ? 'editar' : 'agregar',
            entrada,
            anterior: entradaAnterior
        });
        if (!resultado || usuarioActual?.uid !== uid || versionSesion !== sesionInicial ||
            mallaSeleccionada !== mallaInicial) return;

        registrarEvento(estabaEditando ? 'editar_entrada_tcu' : 'agregar_entrada_tcu', {
            horas_tcu: entrada.horas,
            total_horas_tcu: obtenerTotalHorasTCU(),
            total_entradas_tcu: bitacoraTCU.length
        });

        let errorFotos = null;
        if (fotosPreparadas.length) {
            try {
                await guardarFotosTCU(fotosPreparadas);
            } catch (error) {
                errorFotos = error;
                console.error('Error sincronizando fotos TCU:', error);
            }
        }
        if (usuarioActual?.uid !== uid || versionSesion !== sesionInicial ||
            mallaSeleccionada !== mallaInicial) return;

        if (errorFotos && !errorFotos.fotosEnEspera) {
            // La actividad ya se guardó. Conservar los archivos y preparar
            // Actualizar para que el usuario pueda reintentar las fotos.
            entradaTCUEnEdicion = copiarDatos(entrada);
            editandoTCUIndex = bitacoraTCU.findIndex(item => item.id === entrada.id);
            mostrarEdicionTCU();
            renderBitacoraTCU();
            await mostrarAviso('Fotos pendientes', 'La actividad se guardó, pero no se pudieron conservar las fotos. Deja los archivos seleccionados y pulsa Actualizar para reintentar.');
            return;
        }

        entradaTCUEnEdicion = null;
        limpiarFormularioTCU();
        renderBitacoraTCU();
        if (errorFotos?.fotosEnEspera) {
            const mensaje = errorFotos.code === 'permission-denied'
                ? 'La actividad se guardó y las fotos quedaron en este navegador. La sincronización de fotos requiere que el administrador habilite el acceso a ellas.'
                : 'La actividad y las fotos se guardaron en este navegador. Se intentará sincronizarlas al recuperar la conexión.';
            await mostrarAviso('Fotos pendientes de sincronizar', mensaje);
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

    if (inputFecha) inputFecha.value = entrada.fecha;
    if (inputHoras) inputHoras.value = entrada.horas;
    if (inputActividad) inputActividad.value = entrada.actividad;
    const inputFotos = $('tcu-fotos');
    if (inputFotos) inputFotos.value = '';

    editandoTCUIndex = index;
    entradaTCUEnEdicion = copiarDatos(entrada);

    mostrarEdicionTCU();
    if (typeof inputFecha?.focus === 'function') inputFecha.focus();
}

function mostrarEdicionTCU() {
    const boton = $('btn-guardar-tcu');
    if (boton) {
        boton.textContent = 'Actualizar actividad';
        boton.style.backgroundColor = '#f57c00';
    }
    setText('tcu-form-titulo', 'Editar actividad');
    const cancelar = $('btn-cancelar-edicion-tcu');
    if (cancelar) cancelar.hidden = false;
}

function cancelarEdicionTCU() {
    if (guardandoBitacoraTCU) return;
    limpiarFormularioTCU();
}

async function eliminarEntradaTCU(index) {
    if (!requiereSesion() || guardandoBitacoraTCU) return;

    const uid = usuarioActual.uid;
    const mallaInicial = mallaSeleccionada;
    const sesionInicial = versionSesion;
    const entrada = bitacoraTCU[index] ? copiarDatos(bitacoraTCU[index]) : null;
    if (!entrada) return;

    const confirmar = await mostrarConfirmacion({
        titulo: 'Eliminar entrada de TCU',
        mensaje: '¿Seguro que deseas eliminar esta entrada de la bitácora y sus fotos? Esta acción no se puede deshacer.',
        textoAceptar: 'Eliminar',
        textoCancelar: 'Cancelar',
        peligro: true
    });

    if (!confirmar || guardandoBitacoraTCU || usuarioActual?.uid !== uid ||
        versionSesion !== sesionInicial || mallaSeleccionada !== mallaInicial) return;

    guardandoBitacoraTCU = true;
    const versionOperacion = ++versionGuardadoBitacoraTCU;
    try {
        const resultado = await mutarBitacoraEnFirebase({ tipo: 'eliminar', anterior: entrada });
        if (!resultado || usuarioActual?.uid !== uid || versionSesion !== sesionInicial ||
            mallaSeleccionada !== mallaInicial) return;

        registrarEvento('eliminar_entrada_tcu', {
            horas_tcu_eliminadas: Number(entrada.horas) || 0,
            total_horas_tcu: obtenerTotalHorasTCU(),
            total_entradas_tcu: bitacoraTCU.length
        });

        if (entradaTCUEnEdicion?.id === entrada.id) {
            entradaTCUEnEdicion = null;
            limpiarFormularioTCU();
        } else if (entradaTCUEnEdicion) {
            editandoTCUIndex = bitacoraTCU.findIndex(item => item.id === entradaTCUEnEdicion.id);
        }

        renderBitacoraTCU();
        if (entrada.id) {
            try {
                await eliminarFotosTCUDeEntrada(uid, entrada.id);
            } catch (error) {
                console.error('Error eliminando fotos de TCU:', error);
                if (usuarioActual?.uid === uid) {
                    await mostrarAviso('Fotos pendientes de borrar', 'La actividad se eliminó. Se intentará borrar las fotos al iniciar sesión o recuperar la conexión. Si persisten, revisa los permisos de Firestore.');
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
        inputNombre.dataset.valorOriginal = nombreTCU || '';
    }

    mostrarModal('modal-tcu');
    renderBitacoraTCU();
}

async function guardarNombreTCU() {
    const inputNombre = $('tcu-nombre-proyecto');
    if (!inputNombre || !usuarioActual) return;
    const uid = usuarioActual.uid;
    const sesionInicial = typeof versionSesion === 'number' ? versionSesion : null;
    const nombreAnterior = inputNombre.dataset.valorOriginal ?? nombreTCU;
    const nombreNuevo = inputNombre.value.trim();
    const guardado = await transaccionDatosUsuario(remoto => {
        if ((remoto.nombreTCU || '') !== nombreAnterior) {
            throw crearErrorConflicto('El nombre del proyecto cambió en otra pestaña. Revisa el valor actualizado antes de guardarlo.');
        }
        return { nombreTCU: nombreNuevo };
    });
    if (usuarioActual?.uid !== uid || (sesionInicial !== null && versionSesion !== sesionInicial)) return;
    if (guardado) {
        inputNombre.dataset.valorOriginal = nombreNuevo;
    } else if (inputNombre.value.trim() === nombreNuevo) {
        inputNombre.value = nombreTCU;
        inputNombre.dataset.valorOriginal = nombreTCU;
    }
}

function cerrarModalTCU() {
    cerrarModalPorId('modal-tcu');
    entradaTCUEnEdicion = null;
    limpiarFormularioTCU();
    limpiarURLsFotosTCU();
}

