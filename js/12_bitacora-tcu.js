// --- Reglas para habilitar Bitácora TCU ---
const PORCENTAJE_MINIMO_TCU = 50;
const CODIGO_SEMINARIO_TCU = 'SR-I';
let guardandoBitacoraTCU = false;
let versionGuardadoBitacoraTCU = 0;
let entradaTCUEnEdicion = null;
let guardandoFechasTCU = false;
let versionGuardadoFechasTCU = 0;
let plazoTCUEnEdicion = null;

function invalidarGuardadoBitacoraTCU() {
    versionGuardadoBitacoraTCU += 1;
    guardandoBitacoraTCU = false;
    entradaTCUEnEdicion = null;
    const boton = $('btn-guardar-tcu');
    if (boton) boton.disabled = false;
    versionGuardadoFechasTCU += 1;
    guardandoFechasTCU = false;
    plazoTCUEnEdicion = null;
    const botonFechas = $('tcu-guardar-fechas');
    if (botonFechas) botonFechas.disabled = false;
    const editorFechas = $('tcu-editor-fechas');
    if (editorFechas) editorFechas.hidden = true;
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
function diaCalendarioTCU(fecha) {
    if (!fechaValida(fecha)) return null;
    const milisegundos = Date.parse(`${fecha}T00:00:00Z`);
    return Number.isFinite(milisegundos) ? Math.floor(milisegundos / 86400000) : null;
}

function calcularResumenPlazoTCU(plazo, hoy = new Date()) {
    const fechas = normalizarPlazoTCU(plazo);
    const inicio = diaCalendarioTCU(fechas.inicio);
    const limite = diaCalendarioTCU(fechas.limite);
    if (inicio === null || limite === null || limite <= inicio) return null;

    const diaHoy = Math.floor(Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()) / 86400000);
    const totalDias = limite - inicio;
    const diasTranscurridos = Math.max(0, diaHoy - inicio);
    return {
        totalDias,
        diasTranscurridos,
        diasRestantes: Math.max(0, totalDias - diasTranscurridos)
    };
}

function formatearFechaTCU(fecha) {
    const [ano, mes, dia] = String(fecha || '').split('-');
    return ano && mes && dia ? `${dia}/${mes}/${ano}` : '—';
}

function formatearPorcentajeTCU(valor) {
    return valor.toLocaleString('es-CR', { minimumFractionDigits: 1, maximumFractionDigits: 2 });
}

function dividirTextoCapturaTCU(contexto, texto, anchoMaximo) {
    const lineas = [];
    let linea = '';
    for (const palabra of texto.trim().split(/\s+/)) {
        const candidato = linea ? `${linea} ${palabra}` : palabra;
        if (contexto.measureText(candidato).width <= anchoMaximo) {
            linea = candidato;
            continue;
        }
        if (linea) lineas.push(linea);
        linea = '';
        for (const caracter of Array.from(palabra)) {
            if (contexto.measureText(linea + caracter).width > anchoMaximo && linea) {
                lineas.push(linea);
                linea = '';
            }
            linea += caracter;
        }
    }
    if (linea) lineas.push(linea);
    return lineas;
}

function dibujarCajaCapturaTCU(contexto, x, y, ancho, alto, radio, color, borde = null) {
    contexto.beginPath();
    contexto.moveTo(x + radio, y);
    contexto.lineTo(x + ancho - radio, y);
    contexto.quadraticCurveTo(x + ancho, y, x + ancho, y + radio);
    contexto.lineTo(x + ancho, y + alto - radio);
    contexto.quadraticCurveTo(x + ancho, y + alto, x + ancho - radio, y + alto);
    contexto.lineTo(x + radio, y + alto);
    contexto.quadraticCurveTo(x, y + alto, x, y + alto - radio);
    contexto.lineTo(x, y + radio);
    contexto.quadraticCurveTo(x, y, x + radio, y);
    contexto.closePath();
    contexto.fillStyle = color;
    contexto.fill();
    if (borde) {
        contexto.lineWidth = 2;
        contexto.strokeStyle = borde;
        contexto.stroke();
    }
}

function crearCanvasResumenTCU({ horas = obtenerTotalHorasTCU(), proyecto = nombreTCU,
    plazo = plazoTCU, hoy = new Date() } = {}) {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    let contexto = canvas.getContext('2d');
    if (!contexto) throw new Error('El navegador no pudo crear la imagen.');

    const fuente = '"Segoe UI", Arial, sans-serif';
    const nombreProyecto = String(proyecto || '').trim() || 'Proyecto de TCU';
    const fechas = normalizarPlazoTCU(plazo);
    contexto.font = `700 46px ${fuente}`;
    const lineasProyecto = dividirTextoCapturaTCU(contexto, nombreProyecto, 1040);
    const yProyecto = 194;
    const yHoras = yProyecto + (lineasProyecto.length - 1) * 56 + 64;
    const resumenPlazo = calcularResumenPlazoTCU(fechas, hoy);
    const yPlazo = yHoras + 328;
    const yPie = resumenPlazo ? yPlazo + 238 : yHoras + 340;
    canvas.height = yPie + 100;
    contexto = canvas.getContext('2d');

    const valorHoras = Number(horas);
    const horasRegistradas = Number.isFinite(valorHoras) ? Math.max(0, valorHoras) : 0;
    const horasRestantes = Math.max(0, TOTAL_HORAS_TCU - horasRegistradas);
    const porcentajeHoras = Math.min(100, horasRegistradas / TOTAL_HORAS_TCU * 100);
    const fechaCorte = `${String(hoy.getDate()).padStart(2, '0')}/${String(hoy.getMonth() + 1).padStart(2, '0')}/${hoy.getFullYear()}`;

    contexto.fillStyle = '#ffffff';
    contexto.fillRect(0, 0, canvas.width, canvas.height);
    contexto.fillStyle = '#075b8e';
    contexto.fillRect(0, 0, canvas.width, 10);
    contexto.font = `700 25px ${fuente}`;
    contexto.fillText('Malla Interactiva', 70, 73);
    contexto.textAlign = 'right';
    contexto.fillStyle = '#607584';
    contexto.font = `400 20px ${fuente}`;
    contexto.fillText('Resumen personal del TCU', 1130, 73);
    contexto.textAlign = 'left';
    contexto.fillStyle = '#dce6eb';
    contexto.fillRect(70, 101, 1060, 2);

    contexto.fillStyle = '#617785';
    contexto.font = `700 19px ${fuente}`;
    contexto.fillText('Proyecto de TCU', 70, 148);
    contexto.fillStyle = '#003c63';
    contexto.font = `700 46px ${fuente}`;
    lineasProyecto.forEach((linea, indice) => {
        contexto.fillText(linea, 70, yProyecto + indice * 56);
    });

    dibujarCajaCapturaTCU(contexto, 70, yHoras, 1060, 294, 18, '#f1f7f3', '#d6e8da');
    contexto.fillStyle = '#266d43';
    contexto.font = `700 22px ${fuente}`;
    contexto.fillText('Avance de horas', 108, yHoras + 51);
    const textoHoras = formatearHoras(horasRegistradas);
    contexto.fillStyle = '#003c63';
    contexto.font = `700 105px ${fuente}`;
    contexto.fillText(textoHoras, 105, yHoras + 158);
    const anchoHoras = contexto.measureText(textoHoras).width;
    contexto.fillStyle = '#365b6d';
    contexto.font = `400 27px ${fuente}`;
    contexto.fillText(`de ${TOTAL_HORAS_TCU} horas totales`, 110 + anchoHoras, yHoras + 145);

    dibujarCajaCapturaTCU(contexto, 108, yHoras + 197, 984, 16, 8, '#c9ddce');
    if (porcentajeHoras > 0) {
        dibujarCajaCapturaTCU(contexto, 108, yHoras + 197,
            Math.max(16, 984 * porcentajeHoras / 100), 16, 8, '#287d39');
    }
    contexto.fillStyle = '#266d43';
    contexto.font = `700 25px ${fuente}`;
    contexto.fillText(`${formatearPorcentajeTCU(porcentajeHoras)}% completado`, 108, yHoras + 258);
    contexto.textAlign = 'right';
    contexto.fillStyle = '#294b5c';
    contexto.font = `600 25px ${fuente}`;
    contexto.fillText(`Faltan ${formatearHoras(horasRestantes)} ${horasRestantes === 1 ? 'hora' : 'horas'}`, 1092, yHoras + 258);
    contexto.textAlign = 'left';

    if (resumenPlazo) {
        dibujarCajaCapturaTCU(contexto, 70, yPlazo, 1060, 205, 18, '#f5f9fc', '#d8e6ef');
        contexto.fillStyle = '#0878b6';
        contexto.fillRect(70, yPlazo + 16, 6, 173);
        contexto.fillStyle = '#345a71';
        contexto.font = `700 21px ${fuente}`;
        contexto.fillText('Tiempo en el TCU', 108, yPlazo + 48);
        contexto.fillStyle = '#003c63';
        contexto.font = `700 43px ${fuente}`;
        contexto.fillText(`${resumenPlazo.diasTranscurridos} días`, 108, yPlazo + 106);
        contexto.fillStyle = '#486a7c';
        contexto.font = `400 21px ${fuente}`;
        contexto.fillText(`de ${resumenPlazo.totalDias} días disponibles`, 108, yPlazo + 139);
        contexto.textAlign = 'right';
        contexto.fillStyle = '#075b8e';
        contexto.font = `700 28px ${fuente}`;
        contexto.fillText(resumenPlazo.diasRestantes === 0 ? 'Plazo finalizado' :
            `${resumenPlazo.diasRestantes} días restantes`, 1090, yPlazo + 101);
        contexto.textAlign = 'left';
        contexto.fillStyle = '#d8e6ef';
        contexto.fillRect(108, yPlazo + 157, 984, 2);
        contexto.fillStyle = '#486a7c';
        contexto.font = `400 19px ${fuente}`;
        contexto.fillText(`Matrícula: ${formatearFechaTCU(fechas.inicio)}`, 108, yPlazo + 188);
        contexto.textAlign = 'right';
        contexto.fillText(`Fecha límite: ${formatearFechaTCU(fechas.limite)}`, 1092, yPlazo + 188);
        contexto.textAlign = 'left';
    }

    contexto.fillStyle = '#dce6eb';
    contexto.fillRect(70, yPie, 1060, 2);
    contexto.fillStyle = '#607584';
    contexto.font = `400 18px ${fuente}`;
    contexto.fillText('Horas registradas en tu bitácora', 70, yPie + 39);
    contexto.textAlign = 'right';
    contexto.fillText(`Corte: ${fechaCorte}`, 1130, yPie + 39);
    return canvas;
}

function tomarCapturaTCU() {
    if (!requiereSesion()) return;
    const boton = $('btn-captura-tcu');
    if (boton?.disabled) return;
    if (boton) boton.disabled = true;
    try {
        const canvas = crearCanvasResumenTCU({ proyecto: $('tcu-nombre-proyecto')?.value || nombreTCU });
        const enlace = document.createElement('a');
        const hoy = new Date();
        const fechaArchivo = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
        enlace.href = canvas.toDataURL('image/png');
        enlace.download = `avance-tcu-${fechaArchivo}.png`;
        document.body.appendChild(enlace);
        enlace.click();
        enlace.remove();
    } catch (error) {
        console.error('No se pudo crear la captura del TCU:', error);
        mostrarAviso('No se pudo crear la captura', 'Intenta de nuevo desde este navegador.');
    } finally {
        if (boton) boton.disabled = false;
    }
}

function renderResumenTCU(totalHoras = null) {
    const horas = Math.max(0, Number.isFinite(totalHoras) ? totalHoras : obtenerTotalHorasTCU());
    const horasRestantes = Math.max(0, TOTAL_HORAS_TCU - horas);
    const porcentajeHoras = Math.min(100, (horas / TOTAL_HORAS_TCU) * 100);
    setText('tcu-horas-total', formatearHoras(horas));
    setText('tcu-horas-porcentaje', `${formatearPorcentajeTCU(porcentajeHoras)}% de ${TOTAL_HORAS_TCU} horas totales`);
    setText('tcu-horas-restantes', `Restantes: ${formatearHoras(horasRestantes)} ${horasRestantes === 1 ? 'hora' : 'horas'}`);
    const barraHoras = $('tcu-progress-fill');
    if (barraHoras) barraHoras.style.width = `${porcentajeHoras}%`;

    const resumen = calcularResumenPlazoTCU(plazoTCU);
    const numeroDias = $('tcu-dias-transcurridos');
    const detalle = $('tcu-plazo-detalles');
    const vacio = $('tcu-plazo-vacio');
    if (numeroDias) numeroDias.hidden = !resumen;
    if (detalle) detalle.hidden = !resumen;
    if (vacio) vacio.hidden = Boolean(resumen);
    const barraDias = $('tcu-dias-fill');
    if (barraDias) barraDias.style.width = resumen
        ? `${Math.min(100, (resumen.diasTranscurridos / resumen.totalDias) * 100)}%` : '0%';

    if (resumen) {
        setText('tcu-dias-transcurridos', String(resumen.diasTranscurridos));
        setText('tcu-dias-titulo', resumen.diasTranscurridos === 1 ? ' día en el TCU' : ' días en el TCU');
        setText('tcu-dias-porcentaje', `${formatearPorcentajeTCU(Math.min(100, (resumen.diasTranscurridos / resumen.totalDias) * 100))}% de ${resumen.totalDias} días disponibles`);
        let textoRestantes = `${resumen.diasRestantes} ${resumen.diasRestantes === 1 ? 'día' : 'días'}`;
        if (resumen.diasRestantes === 0) {
            textoRestantes += ' (plazo finalizado)';
        } else if (horasRestantes === 0) {
            textoRestantes += ' (meta de horas alcanzada)';
        } else {
            const horasSemanales = Math.ceil((horasRestantes * 7 / resumen.diasRestantes) * 10) / 10;
            textoRestantes += ` (${horasSemanales.toFixed(1).replace('.', ',')} horas semanales estimadas)`;
        }
        setText('tcu-dias-restantes', textoRestantes);
        setText('tcu-fecha-inicio-texto', formatearFechaTCU(plazoTCU.inicio));
        setText('tcu-fecha-limite-texto', formatearFechaTCU(plazoTCU.limite));
    } else {
        setText('tcu-dias-titulo', 'Plazo del TCU');
        setText('tcu-dias-porcentaje', 'Ingresa tus fechas para calcular los días.');
    }

    const editor = $('tcu-editor-fechas');
    const botonFechas = $('tcu-boton-fechas');
    const quitarFechas = $('tcu-quitar-fechas');
    if (quitarFechas) quitarFechas.hidden = !plazoTCU.inicio && !plazoTCU.limite;
    if (botonFechas) {
        botonFechas.textContent = editor && !editor.hidden ? 'Cerrar fechas' : resumen ? 'Editar fechas' : 'Definir fechas';
        botonFechas.setAttribute('aria-expanded', editor && !editor.hidden ? 'true' : 'false');
    }
    if (editor?.hidden) {
        const inicio = $('tcu-fecha-inicio');
        const limite = $('tcu-fecha-limite');
        if (inicio) inicio.value = plazoTCU.inicio;
        if (limite) limite.value = plazoTCU.limite;
    }
}

function alternarEditorFechasTCU() {
    const editor = $('tcu-editor-fechas');
    if (!editor || guardandoFechasTCU) return;
    if (!editor.hidden) {
        cerrarEditorFechasTCU();
        return;
    }
    plazoTCUEnEdicion = normalizarPlazoTCU(plazoTCU);
    const inicio = $('tcu-fecha-inicio');
    const limite = $('tcu-fecha-limite');
    if (inicio) inicio.value = plazoTCUEnEdicion.inicio;
    if (limite) limite.value = plazoTCUEnEdicion.limite;
    editor.hidden = false;
    renderResumenTCU();
    if (typeof inicio?.focus === 'function') inicio.focus();
}

function cerrarEditorFechasTCU() {
    if (guardandoFechasTCU) return;
    const editor = $('tcu-editor-fechas');
    if (editor) editor.hidden = true;
    plazoTCUEnEdicion = null;
    renderResumenTCU();
}

function quitarFechasTCU() {
    if (guardandoFechasTCU) return;
    const inicio = $('tcu-fecha-inicio');
    const limite = $('tcu-fecha-limite');
    if (inicio) inicio.value = '';
    if (limite) limite.value = '';
    return guardarFechasTCU();
}

async function guardarFechasTCU() {
    if (!requiereSesion() || guardandoFechasTCU) return;
    const inicio = $('tcu-fecha-inicio')?.value || '';
    const limite = $('tcu-fecha-limite')?.value || '';
    const quitandoFechas = !inicio && !limite;
    if (!quitandoFechas && (!fechaValida(inicio) || !fechaValida(limite))) {
        await mostrarAviso('Fechas incompletas', 'Ingresa una fecha de matrícula y una fecha límite válidas.');
        return;
    }
    if (!quitandoFechas && diaCalendarioTCU(limite) <= diaCalendarioTCU(inicio)) {
        await mostrarAviso('Plazo inválido', 'La fecha límite debe ser posterior a la fecha de matrícula.');
        return;
    }

    const uid = usuarioActual.uid;
    const sesionInicial = versionSesion;
    const anterior = plazoTCUEnEdicion || normalizarPlazoTCU(plazoTCU);
    const nuevo = { inicio, limite };
    const boton = $('tcu-guardar-fechas');
    guardandoFechasTCU = true;
    const versionOperacion = ++versionGuardadoFechasTCU;
    if (boton) boton.disabled = true;
    try {
        const resultado = await transaccionDatosUsuario(remoto => {
            const plazoRemoto = normalizarPlazoTCU(remoto.plazoTCU);
            if (plazoRemoto.inicio !== anterior.inicio || plazoRemoto.limite !== anterior.limite) {
                throw crearErrorConflicto('Las fechas del TCU cambiaron en otra pestaña. Cierra y vuelve a abrir el editor para revisar el plazo actualizado.');
            }
            return { plazoTCU: nuevo };
        });
        if (usuarioActual?.uid !== uid || versionSesion !== sesionInicial ||
            versionGuardadoFechasTCU !== versionOperacion) return;
        if (resultado) {
            const editor = $('tcu-editor-fechas');
            if (editor) editor.hidden = true;
            plazoTCUEnEdicion = null;
            renderResumenTCU();
        }
    } finally {
        if (versionGuardadoFechasTCU === versionOperacion) {
            guardandoFechasTCU = false;
            if (boton) boton.disabled = false;
        }
    }
}

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

    renderResumenTCU(totalHoras);

    // Verifica si la meta se acaba de cumplir con este nuevo total de horas
    if (typeof verificarLogroTCU === 'function') {
        verificarLogroTCU(totalHoras);
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
    const editorFechas = $('tcu-editor-fechas');
    if (editorFechas) editorFechas.hidden = true;
    plazoTCUEnEdicion = null;
    limpiarURLsFotosTCU();
}

if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && $('modal-tcu')?.style.display === 'flex') renderResumenTCU();
    });
}

