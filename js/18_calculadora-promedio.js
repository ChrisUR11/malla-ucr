// --- Calculadora de Promedio Ponderado ---

let cursosCalculadoraPromedio = [];

function obtenerNotaParaCalculadora(codigo) {
    if (typeof obtenerNotaNumerica === 'function') {
        return obtenerNotaNumerica(codigo);
    }

    const estado = estadoCursos[codigo] || {};

    if (estado.nota === null || estado.nota === undefined || estado.nota === '') {
        return null;
    }

    const nota = Number(String(estado.nota).replace(',', '.'));

    if (Number.isNaN(nota)) {
        return null;
    }

    return nota;
}

function formatearPromedioCalculadora(valor) {
    if (valor === null || valor === undefined || Number.isNaN(valor)) {
        return '0,00';
    }

    return Number(valor).toFixed(2).replace('.', ',');
}

function obtenerCursosValidosCalculadoraPromedio() {
    const cursos = [];
    const codigosAgregados = new Set();

    obtenerSeccionesProgreso().forEach(seccion => {
        const ciclos = Array.isArray(seccion.ciclos) ? seccion.ciclos : [];

        ciclos.forEach(bloque => {
            const listaCursos = Array.isArray(bloque.cursos) ? bloque.cursos : [];

            listaCursos.forEach(curso => {
                if (!curso?.codigo || codigosAgregados.has(curso.codigo)) return;

                const estado = estadoCursos[curso.codigo] || {};
                const creditos = Number(curso.creditos) || 0;
                const nota = obtenerNotaParaCalculadora(curso.codigo);

                // --- NUEVA LÓGICA ---
                // Ahora entra cualquier curso que tenga una nota válida
                // y que tenga créditos mayores a 0.
                if (
                    nota !== null &&
                    creditos > 0
                ) {
                    codigosAgregados.add(curso.codigo);

                    cursos.push({
                        codigo: curso.codigo,
                        nombre: curso.nombre,
                        creditos: creditos,
                        nota: nota,
                        ciclo: bloque.ciclo ?? bloque.titulo ?? 'Sin ciclo'
                    });
                }
            });
        });
    });

    return cursos;
}

function abrirModalCalculadoraPromedio() {
    if (!requiereSesion()) return;

    if (!mallaSeleccionada) {
        mostrarModalSeleccionMalla();
        return;
    }

    cursosCalculadoraPromedio = obtenerCursosValidosCalculadoraPromedio();
    renderCursosCalculadoraPromedio();

    const modal = $('modal-calculadora-promedio');

    if (modal) {
        modal.style.display = 'flex';
    }

    registrarEvento('abrir_calculadora_promedio', {
        cursos_disponibles: cursosCalculadoraPromedio.length
    });
}

function cerrarModalCalculadoraPromedio() {
    const modal = $('modal-calculadora-promedio');

    if (modal) {
        modal.style.display = 'none';
    }
}

function renderCursosCalculadoraPromedio() {
    const contenedor = $('calculadora-lista-cursos');

    if (!contenedor) return;

    contenedor.innerHTML = '';

    setText('calculadora-promedio-resultado', '0,00');
    setText('calculadora-cursos-seleccionados', 0);
    setText('calculadora-creditos-seleccionados', 0);

    if (cursosCalculadoraPromedio.length === 0) {
        const vacio = document.createElement('div');
        vacio.className = 'calculadora-vacia';
        vacio.textContent = 'No tienes cursos con nota registrada para calcular el promedio.';
        contenedor.appendChild(vacio);
        return;
    }

    cursosCalculadoraPromedio.forEach(curso => {
        const label = document.createElement('label');
        label.className = 'calculadora-curso';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'calculadora-check';
        checkbox.value = curso.codigo;

        checkbox.addEventListener('change', actualizarResumenSeleccionCalculadora);

        const info = document.createElement('div');
        info.className = 'calculadora-curso-info';

        const titulo = document.createElement('span');
        titulo.className = 'calculadora-curso-titulo';
        titulo.textContent = `${curso.nombre} (${curso.codigo})`;

        const detalle = document.createElement('span');
        detalle.className = 'calculadora-curso-detalle';
        detalle.textContent = `Nota: ${formatearPromedioCalculadora(curso.nota)} | Créditos: ${curso.creditos} | ${curso.ciclo}`;

        info.appendChild(titulo);
        info.appendChild(detalle);

        label.appendChild(checkbox);
        label.appendChild(info);

        contenedor.appendChild(label);
    });
}

function obtenerCursosSeleccionadosCalculadora() {
    const checks = document.querySelectorAll('.calculadora-check:checked');
    const codigosSeleccionados = new Set();

    checks.forEach(check => {
        codigosSeleccionados.add(check.value);
    });

    return cursosCalculadoraPromedio.filter(curso => codigosSeleccionados.has(curso.codigo));
}

function actualizarResumenSeleccionCalculadora() {
    const seleccionados = obtenerCursosSeleccionadosCalculadora();

    const totalCreditos = seleccionados.reduce((total, curso) => {
        return total + curso.creditos;
    }, 0);

    setText('calculadora-cursos-seleccionados', seleccionados.length);
    setText('calculadora-creditos-seleccionados', totalCreditos);
}

function seleccionarTodosCalculadora() {
    document.querySelectorAll('.calculadora-check').forEach(check => {
        check.checked = true;
    });

    actualizarResumenSeleccionCalculadora();
    calcularPromedioSeleccionado();
}

function limpiarSeleccionCalculadora() {
    document.querySelectorAll('.calculadora-check').forEach(check => {
        check.checked = false;
    });

    setText('calculadora-promedio-resultado', '0,00');
    setText('calculadora-cursos-seleccionados', 0);
    setText('calculadora-creditos-seleccionados', 0);
}

function calcularPromedioSeleccionado() {
    const seleccionados = obtenerCursosSeleccionadosCalculadora();

    if (seleccionados.length === 0) {
        setText('calculadora-promedio-resultado', '0,00');
        setText('calculadora-cursos-seleccionados', 0);
        setText('calculadora-creditos-seleccionados', 0);
        return;
    }

    let sumaNotaPorCredito = 0;
    let sumaCreditos = 0;

    seleccionados.forEach(curso => {
        sumaNotaPorCredito += curso.nota * curso.creditos;
        sumaCreditos += curso.creditos;
    });

    const promedio = sumaCreditos > 0 ? sumaNotaPorCredito / sumaCreditos : 0;

    setText('calculadora-promedio-resultado', formatearPromedioCalculadora(promedio));
    setText('calculadora-cursos-seleccionados', seleccionados.length);
    setText('calculadora-creditos-seleccionados', sumaCreditos);

    registrarEvento('calcular_promedio_manual', {
        cursos_seleccionados: seleccionados.length,
        creditos_seleccionados: sumaCreditos,
        promedio_calculado: Number(promedio.toFixed(2))
    });
}