// --- Calculadora de promedio personalizada ---

function obtenerCursosParaCalculadora() {
    const cursosCalculadora = [];
    const codigosAgregados = new Set();

    obtenerSeccionesProgreso().forEach(seccion => {
        const ciclos = Array.isArray(seccion.ciclos) ? seccion.ciclos : [];

        ciclos.forEach(bloque => {
            const cursos = Array.isArray(bloque.cursos) ? bloque.cursos : [];

            cursos.forEach(curso => {
                if (!curso?.codigo || codigosAgregados.has(curso.codigo)) return;

                codigosAgregados.add(curso.codigo);

                const estado = estadoCursos[curso.codigo] || {};
                const nota = Number(estado.nota);
                const creditos = Number(curso.creditos) || 0;

                if (creditos <= 0) return;
                if (!Number.isFinite(nota)) return;

                cursosCalculadora.push({
                    codigo: curso.codigo,
                    nombre: curso.nombre,
                    creditos,
                    nota,
                    aprobado: Boolean(estado.aprobado),
                    ciclo: bloque.ciclo ?? bloque.titulo ?? 'Sin ciclo',
                    tipo: curso.tipo || 'Regular'
                });
            });
        });
    });

    return cursosCalculadora;
}

function abrirModalCalculadoraPromedio() {
    if (!requiereSesion()) return;

    if (!mallaSeleccionada) {
        mostrarModalSeleccionMalla();
        return;
    }

    renderCalculadoraPromedio();

    registrarEvento('abrir_calculadora_promedio', {
        total_cursos_con_nota: obtenerCursosParaCalculadora().length
    });

    mostrarModal('modal-calculadora-promedio');
}

function cerrarModalCalculadoraPromedio() {
    cerrarModalPorId('modal-calculadora-promedio');
}

function renderCalculadoraPromedio() {
    const contenedor = $('calculadora-lista-cursos');
    const resultado = $('calculadora-promedio-resultado');
    const cursosSeleccionados = $('calculadora-cursos-seleccionados');
    const creditosSeleccionados = $('calculadora-creditos-seleccionados');

    if (!contenedor) return;

    const cursos = obtenerCursosParaCalculadora();

    contenedor.innerHTML = '';

    if (resultado) resultado.textContent = '0,00';
    if (cursosSeleccionados) cursosSeleccionados.textContent = '0';
    if (creditosSeleccionados) creditosSeleccionados.textContent = '0';

    if (cursos.length === 0) {
        contenedor.innerHTML = `
            <div class="calculadora-vacia">
                Aún no tienes cursos con nota registrada.
                <br>
                Primero agrega notas para poder usar la calculadora.
            </div>
        `;
        return;
    }

    cursos.forEach(curso => {
        const fila = document.createElement('label');
        fila.className = 'calculadora-curso';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'calculadora-check';
        checkbox.value = curso.codigo;
        checkbox.dataset.nota = curso.nota;
        checkbox.dataset.creditos = curso.creditos;
        checkbox.addEventListener('change', calcularPromedioSeleccionado);

        const contenido = document.createElement('div');
        contenido.className = 'calculadora-curso-info';

        const titulo = document.createElement('div');
        titulo.className = 'calculadora-curso-titulo';
        titulo.textContent = `${curso.nombre} (${curso.codigo})`;

        const detalle = document.createElement('div');
        detalle.className = 'calculadora-curso-detalle';

        const estadoTexto = curso.aprobado ? 'Aprobado' : 'No aprobado';

        detalle.textContent = `Ciclo ${curso.ciclo} | ${curso.creditos} créditos | Nota: ${formatearNota(curso.nota)} | ${estadoTexto}`;

        contenido.appendChild(titulo);
        contenido.appendChild(detalle);

        fila.appendChild(checkbox);
        fila.appendChild(contenido);

        contenedor.appendChild(fila);
    });
}

function obtenerChecksCalculadora() {
    return Array.from(document.querySelectorAll('.calculadora-check'));
}

function seleccionarTodosCalculadora() {
    obtenerChecksCalculadora().forEach(check => {
        check.checked = true;
    });

    calcularPromedioSeleccionado();
}

function limpiarSeleccionCalculadora() {
    obtenerChecksCalculadora().forEach(check => {
        check.checked = false;
    });

    calcularPromedioSeleccionado();
}

function calcularPromedioSeleccionado() {
    const checksSeleccionados = obtenerChecksCalculadora().filter(check => check.checked);

    let sumaNotasPorCredito = 0;
    let sumaCreditos = 0;

    checksSeleccionados.forEach(check => {
        const nota = Number(check.dataset.nota);
        const creditos = Number(check.dataset.creditos);

        if (!Number.isFinite(nota) || !Number.isFinite(creditos)) return;

        sumaNotasPorCredito += nota * creditos;
        sumaCreditos += creditos;
    });

    const promedio = sumaCreditos > 0
        ? sumaNotasPorCredito / sumaCreditos
        : 0;

    setText('calculadora-promedio-resultado', promedio.toFixed(2).replace('.', ','));
    setText('calculadora-cursos-seleccionados', checksSeleccionados.length);
    setText('calculadora-creditos-seleccionados', sumaCreditos);

    registrarEvento('calcular_promedio_personalizado', {
        cursos_seleccionados: checksSeleccionados.length,
        creditos_seleccionados: sumaCreditos,
        promedio_calculado: Number(promedio.toFixed(2))
    });
}