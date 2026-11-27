// Cursos que la persona quiere seguir durante el período, independientes de la aprobación.
function obtenerCursosDisponiblesPeriodo() {
    const vistos = new Set();
    const cursos = [];

    (Array.isArray(mallaSecciones) ? mallaSecciones : []).forEach(seccion => {
        (Array.isArray(seccion.ciclos) ? seccion.ciclos : []).forEach(bloque => {
            (Array.isArray(bloque.cursos) ? bloque.cursos : []).forEach(curso => {
                if (!curso?.codigo || curso.grupoOptativa ||
                    estadoCursos[curso.codigo]?.heredado || vistos.has(curso.codigo)) return;
                vistos.add(curso.codigo);
                cursos.push({
                    ...curso,
                    ciclo: obtenerTituloCiclo(bloque),
                    seccion: seccion.titulo || 'Malla de carrera'
                });
            });
        });
    });

    return cursos;
}

function obtenerCursosSeleccionadosPeriodo() {
    return obtenerCursosDisponiblesPeriodo()
        .filter(curso => estadoCursos[curso.codigo]?.enPeriodo === true);
}

function obtenerCursosAprobadosPeriodo() {
    return obtenerCursosSeleccionadosPeriodo()
        .filter(curso => estadoCursos[curso.codigo]?.aprobado === true);
}

function normalizarBusquedaPeriodo(valor) {
    return String(valor || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function estadoVisibleCursoPeriodo(curso) {
    const estado = estadoCursos[curso.codigo] || {};
    if (estado.aprobado) return 'Aprobado';
    if (obtenerNotaNumerica(curso.codigo) !== null) return 'No aprobado';
    return 'En curso';
}

function crearOpcionCursoPeriodo(curso) {
    const seleccionado = estadoCursos[curso.codigo]?.enPeriodo === true;
    const opcion = document.createElement('label');
    opcion.className = `curso-periodo-opcion${seleccionado ? ' seleccionado' : ''}`;

    const casilla = document.createElement('input');
    casilla.type = 'checkbox';
    casilla.checked = seleccionado;
    casilla.setAttribute('aria-label', `${seleccionado ? 'Quitar' : 'Agregar'} ${curso.nombre} de mis cursos del período`);
    casilla.addEventListener('change', async () => {
        casilla.disabled = true;
        await cambiarCursoPeriodo(curso.codigo, casilla.checked);
    });

    const cuerpo = document.createElement('span');
    cuerpo.className = 'curso-periodo-opcion-cuerpo';
    const nombre = document.createElement('strong');
    nombre.textContent = curso.nombre;
    const detalle = document.createElement('span');
    detalle.className = 'curso-periodo-opcion-detalle';
    detalle.textContent = `${curso.codigo} · ${curso.ciclo} · ${curso.creditos} créditos`;
    cuerpo.append(nombre, detalle);

    const nota = obtenerNotaNumerica(curso.codigo);
    const resultado = document.createElement('span');
    resultado.className = 'curso-periodo-opcion-resultado';
    const estado = document.createElement('span');
    estado.className = `curso-periodo-estado ${estadoCursos[curso.codigo]?.aprobado ? 'aprobado' : nota !== null ? 'no-aprobado' : ''}`;
    estado.textContent = estadoVisibleCursoPeriodo(curso);
    const calificacion = document.createElement('span');
    calificacion.className = 'curso-periodo-nota';
    calificacion.textContent = nota === null ? 'Sin nota' : `Nota ${formatearNota(nota)}`;
    resultado.append(estado, calificacion);

    opcion.append(casilla, cuerpo, resultado);
    return opcion;
}

function renderCursosPeriodo() {
    const lista = $('lista-cursos-periodo');
    if (!lista) return;
    const todos = obtenerCursosDisponiblesPeriodo();
    const seleccionados = todos.filter(curso => estadoCursos[curso.codigo]?.enPeriodo === true);
    const aprobados = seleccionados.filter(curso => estadoCursos[curso.codigo]?.aprobado === true);
    const creditosAprobados = aprobados.reduce((total, curso) => total + (Number(curso.creditos) || 0), 0);
    const busqueda = normalizarBusquedaPeriodo($('buscar-cursos-periodo')?.value);
    const visibles = busqueda
        ? todos.filter(curso => normalizarBusquedaPeriodo(
            `${curso.nombre} ${curso.codigo} ${curso.ciclo} ${curso.seccion}`
        ).includes(busqueda))
        : todos;
    const marcados = visibles.filter(curso => estadoCursos[curso.codigo]?.enPeriodo === true);
    const disponibles = visibles.filter(curso => estadoCursos[curso.codigo]?.enPeriodo !== true);

    lista.replaceChildren();
    const agregarGrupo = (titulo, cursos) => {
        if (cursos.length === 0) return;
        const encabezado = document.createElement('h4');
        encabezado.className = 'cursos-periodo-grupo';
        encabezado.textContent = titulo;
        lista.appendChild(encabezado);
        cursos.forEach(curso => lista.appendChild(crearOpcionCursoPeriodo(curso)));
    };
    agregarGrupo('En mi período', marcados);
    agregarGrupo('Para agregar', disponibles);
    if (visibles.length === 0) {
        const vacio = document.createElement('p');
        vacio.className = 'cursos-periodo-vacio';
        vacio.textContent = todos.length === 0
            ? 'No hay cursos disponibles en esta malla.'
            : 'No hay cursos que coincidan con la búsqueda.';
        lista.appendChild(vacio);
    }

    setText('cursos-periodo-resumen', `${seleccionados.length} marcados · captura: ${aprobados.length} ${aprobados.length === 1 ? 'aprobado' : 'aprobados'} · ${creditosAprobados} créditos. Solo aparecen aprobados.`);
    const boton = $('btn-captura-cursos-periodo');
    if (boton) boton.disabled = aprobados.length === 0;
}

function abrirModalCursosPeriodo() {
    if (!requiereSesion()) return;
    if (!mallaSeleccionada) {
        mostrarModalSeleccionMalla();
        return;
    }
    const buscar = $('buscar-cursos-periodo');
    if (buscar) buscar.value = '';
    renderCursosPeriodo();
    mostrarModal('modal-cursos-periodo');
    registrarEvento('abrir_cursos_periodo', { cursos_seleccionados: obtenerCursosSeleccionadosPeriodo().length });
}

function cerrarModalCursosPeriodo() {
    cerrarModalPorId('modal-cursos-periodo');
}

async function cambiarCursoPeriodo(codigo, seleccionado) {
    if (!obtenerCursosDisponiblesPeriodo().some(curso => curso.codigo === codigo)) {
        renderCursosPeriodo();
        return false;
    }
    if (!puedeEditarCurso(codigo)) {
        renderCursosPeriodo();
        return false;
    }
    try {
        return await guardarCambioCurso(codigo, curso => {
            if (seleccionado) curso.enPeriodo = true;
            else delete curso.enPeriodo;
        }, seleccionado ? 'agregar_curso_periodo' : 'quitar_curso_periodo');
    } finally {
        renderCursosPeriodo();
    }
}

function rellenarPlantillaCursosPeriodo(cursos = obtenerCursosAprobadosPeriodo()) {
    const plantilla = $('plantilla-cursos-periodo');
    const filas = $('captura-cursos-filas');
    if (!plantilla || !filas || !Array.isArray(cursos)) return null;
    const aprobados = cursos.filter(curso => estadoCursos[curso.codigo]?.enPeriodo === true &&
        estadoCursos[curso.codigo]?.aprobado === true);
    if (aprobados.length === 0) return null;

    const creditos = aprobados.reduce((total, curso) => total + (Number(curso.creditos) || 0), 0);
    const conNota = aprobados.map(curso => ({
        creditos: Number(curso.creditos) || 0,
        nota: obtenerNotaNumerica(curso.codigo)
    })).filter(curso => curso.creditos > 0 && curso.nota !== null && curso.nota >= 7);
    const creditosConNota = conNota.reduce((total, curso) => total + curso.creditos, 0);
    const ponderado = creditosConNota > 0
        ? conNota.reduce((total, curso) => total + curso.nota * curso.creditos, 0) / creditosConNota
        : null;
    setText('captura-cursos-creditos', String(creditos));
    setText('captura-cursos-ponderado', formatearPonderado(ponderado));
    filas.replaceChildren();

    aprobados.forEach(curso => {
        const fila = document.createElement('div');
        fila.className = 'periodo-captura-fila';

        const informacion = document.createElement('div');
        informacion.className = 'periodo-captura-curso';
        const check = document.createElement('span');
        check.className = 'periodo-captura-check';
        check.setAttribute('aria-hidden', 'true');
        const nombre = document.createElement('strong');
        nombre.textContent = curso.nombre;
        const codigo = document.createElement('span');
        codigo.textContent = `(${curso.codigo})`;
        const datos = document.createElement('div');
        datos.className = 'periodo-captura-curso-datos';
        datos.append(check, nombre, codigo);
        informacion.appendChild(datos);
        if (Array.isArray(curso.requisitos) && curso.requisitos.length > 0) {
            const requisitos = document.createElement('small');
            requisitos.textContent = `Req: ${curso.requisitos.join(', ')}`;
            informacion.appendChild(requisitos);
        }

        const lado = document.createElement('div');
        lado.className = 'periodo-captura-lado';
        const credito = document.createElement('span');
        credito.className = 'periodo-captura-creditos';
        credito.textContent = `${Number(curso.creditos) || 0} créditos`;
        const nota = obtenerNotaNumerica(curso.codigo);
        const calificacion = document.createElement('span');
        calificacion.className = 'periodo-captura-valor';
        calificacion.textContent = nota === null ? 'Aprobada' : formatearNota(nota);
        lado.append(credito, calificacion);
        fila.append(informacion, lado);
        filas.appendChild(fila);
    });

    return plantilla;
}

function fechaArchivoCursosPeriodo(hoy = new Date()) {
    const ano = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
}

async function tomarCapturaCursosPeriodo() {
    if (!requiereSesion() || !mallaSeleccionada) return;
    const cursos = obtenerCursosAprobadosPeriodo();
    if (cursos.length === 0) {
        await mostrarAviso('Sin cursos aprobados', 'La captura incluye los cursos marcados para tu período que ya estén aprobados.');
        return;
    }
    if (typeof html2canvas !== 'function') {
        await mostrarAviso('No se pudo crear la captura', 'La herramienta de imágenes no terminó de cargar. Recarga la página e inténtalo de nuevo.');
        return;
    }
    const plantilla = rellenarPlantillaCursosPeriodo(cursos);
    const boton = $('btn-captura-cursos-periodo');
    if (!plantilla || !boton) return;
    const textoOriginal = boton.textContent;
    boton.textContent = 'Creando captura…';
    boton.disabled = true;
    try {
        const canvas = await html2canvas(plantilla, {
            backgroundColor: '#ffffff',
            scale: 2,
            onclone(documentoClonado) {
                const copia = documentoClonado.getElementById('plantilla-cursos-periodo');
                documentoClonado.body.appendChild(copia);
                copia.style.display = 'block';
                copia.style.position = 'absolute';
                copia.style.left = '0';
                copia.style.top = '0';
            }
        });
        const enlace = document.createElement('a');
        const nombre = typeof limpiarNombreArchivo === 'function'
            ? limpiarNombreArchivo(obtenerNombreMalla(mallaSeleccionada))
            : 'malla';
        enlace.download = `cursos_periodo_${nombre}_${fechaArchivoCursosPeriodo()}.png`;
        enlace.href = canvas.toDataURL('image/png');
        enlace.click();
        registrarEvento('capturar_cursos_periodo', {
            cursos_exportados: cursos.length,
            cursos_con_nota: cursos.filter(curso => obtenerNotaNumerica(curso.codigo) !== null).length
        });
    } catch (error) {
        console.error('No se pudo generar la captura de cursos:', error);
        await mostrarAviso('No se pudo crear la captura', 'Ocurrió un problema al crear la imagen. Inténtalo de nuevo.');
    } finally {
        boton.textContent = textoOriginal;
        boton.disabled = false;
        renderCursosPeriodo();
    }
}
