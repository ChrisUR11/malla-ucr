// --- Bitácora TCU ---
function renderBitacoraTCU() {
    const tbody = $('tcu-tbody');

    if (!tbody) return;

    tbody.innerHTML = '';

    let totalHoras = 0;

    const bitacoraOrdenada = [...bitacoraTCU].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    bitacoraOrdenada.forEach((entrada) => {
        const indexReal = bitacoraTCU.indexOf(entrada);
        const horasNumero = Number(entrada.horas);

        if (Number.isFinite(horasNumero)) {
            totalHoras += horasNumero;
        }

        const tr = document.createElement('tr');

        const tdFecha = document.createElement('td');
        tdFecha.textContent = entrada.fecha;

        const tdActividad = document.createElement('td');
        tdActividad.textContent = entrada.actividad;

        const tdHoras = document.createElement('td');
        const strongHoras = document.createElement('strong');
        strongHoras.textContent = formatearHoras(entrada.horas);
        tdHoras.appendChild(strongHoras);

        const tdAcciones = document.createElement('td');
        tdAcciones.style.whiteSpace = 'nowrap';
        tdAcciones.style.textAlign = 'right';

        const btnEditar = document.createElement('button');
        btnEditar.type = 'button';
        btnEditar.className = 'btn-editar-tcu';
        btnEditar.textContent = '✏️';
        btnEditar.addEventListener('click', () => editarEntradaTCU(indexReal));

        const btnEliminar = document.createElement('button');
        btnEliminar.type = 'button';
        btnEliminar.className = 'btn-eliminar-tcu';
        btnEliminar.textContent = '🗑';
        btnEliminar.addEventListener('click', () => eliminarEntradaTCU(indexReal));

        tdAcciones.appendChild(btnEditar);
        tdAcciones.appendChild(btnEliminar);

        tr.appendChild(tdFecha);
        tr.appendChild(tdActividad);
        tr.appendChild(tdHoras);
        tr.appendChild(tdAcciones);

        tbody.appendChild(tr);
    });

    setText('tcu-horas-total', `${formatearHoras(totalHoras)} / ${TOTAL_HORAS_TCU}`);

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

    if (!inputFecha || !inputHoras || !inputActividad) return;

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

    const entrada = {
        fecha,
        horas: Number(horas.toFixed(1)),
        actividad
    };

    const estabaEditando = editandoTCUIndex >= 0;

    if (estabaEditando) {
        bitacoraTCU[editandoTCUIndex] = entrada;
    } else {
        bitacoraTCU.push(entrada);
    }

    const guardado = await guardarDatosEnFirebase();

    if (guardado) {
        registrarEvento(estabaEditando ? 'editar_entrada_tcu' : 'agregar_entrada_tcu', {
            horas_tcu: entrada.horas,
            total_horas_tcu: obtenerTotalHorasTCU(),
            total_entradas_tcu: bitacoraTCU.length
        });

        limpiarFormularioTCU();
        renderBitacoraTCU();
    }
}

function editarEntradaTCU(index) {
    if (!requiereSesion()) return;

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

    editandoTCUIndex = index;

    if (btn) {
        btn.textContent = 'Actualizar';
        btn.style.backgroundColor = '#f57c00';
    }
}

async function eliminarEntradaTCU(index) {
    if (!requiereSesion()) return;

    const entrada = bitacoraTCU[index];

    if (!entrada) return;

    const confirmar = await mostrarConfirmacion({
        titulo: 'Eliminar entrada de TCU',
        mensaje: '¿Seguro que deseas eliminar esta entrada de la bitácora? Esta acción no se puede deshacer.',
        textoAceptar: 'Eliminar',
        textoCancelar: 'Cancelar',
        peligro: true
    });

    if (!confirmar) return;

    bitacoraTCU.splice(index, 1);

    const guardado = await guardarDatosEnFirebase();

    if (guardado) {
        registrarEvento('eliminar_entrada_tcu', {
            horas_tcu_eliminadas: Number(entrada.horas) || 0,
            total_horas_tcu: obtenerTotalHorasTCU(),
            total_entradas_tcu: bitacoraTCU.length
        });

        if (editandoTCUIndex === index) {
            limpiarFormularioTCU();
        }

        renderBitacoraTCU();
    }
}

function abrirModalTCU() {
    if (!requiereSesion()) return;

    if (!mallaSeleccionada) {
        mostrarModalSeleccionMalla();
        return;
    }

    registrarEvento('abrir_bitacora_tcu', {
        total_horas_tcu: obtenerTotalHorasTCU(),
        total_entradas_tcu: bitacoraTCU.length
    });

    renderBitacoraTCU();
    mostrarModal('modal-tcu');
}

function cerrarModalTCU() {
    cerrarModalPorId('modal-tcu');
    limpiarFormularioTCU();
}

