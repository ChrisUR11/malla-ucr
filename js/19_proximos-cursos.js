// --- Próximos cursos ---

let planProximoSeleccionado = [];

function obtenerTituloBloqueProximo(bloque) {
    if (bloque?.titulo) return bloque.titulo;

    return typeof bloque?.ciclo === 'number'
        ? `Ciclo ${bloque.ciclo}`
        : String(bloque?.ciclo || 'Bloque de cursos');
}

function crearCatalogoCursosProximos() {
    const cursosCatalogo = [];
    const mapaCursos = new Map();
    const codigosAgregados = new Set();

    obtenerSeccionesProgreso().forEach(seccion => {
        const ciclos = Array.isArray(seccion.ciclos) ? seccion.ciclos : [];

        ciclos.forEach(bloque => {
            const cursos = Array.isArray(bloque.cursos) ? bloque.cursos : [];

            cursos.forEach(curso => {
                if (!curso?.codigo || codigosAgregados.has(curso.codigo)) return;

                codigosAgregados.add(curso.codigo);

                const item = {
                    codigo: curso.codigo,
                    nombre: curso.nombre,
                    creditos: Number(curso.creditos) || 0,
                    requisitos: Array.isArray(curso.requisitos) ? curso.requisitos : [],
                    correquisitos: Array.isArray(curso.correquisitos) ? curso.correquisitos : [],
                    tipo: curso.tipo || 'Regular',
                    ciclo: bloque.ciclo ?? '',
                    tituloCiclo: obtenerTituloBloqueProximo(bloque),
                    seccion: seccion.titulo || 'Malla de carrera'
                };

                cursosCatalogo.push(item);
                mapaCursos.set(item.codigo, item);
            });
        });
    });

    return {
        cursosCatalogo,
        mapaCursos
    };
}

function cursoEstaAprobado(codigo) {
    return Boolean(estadoCursos[codigo]?.aprobado);
}

function obtenerNombreCursoCatalogo(codigo, mapaCursos) {
    const curso = mapaCursos.get(codigo);

    if (!curso) return codigo;

    return `${curso.nombre} (${curso.codigo})`;
}

function obtenerCursosProximos() {
    const { cursosCatalogo, mapaCursos } = crearCatalogoCursosProximos();

    return cursosCatalogo
        .filter(curso => {
            if (!curso.codigo) return false;
            if (curso.creditos <= 0) return false;
            if (cursoEstaAprobado(curso.codigo)) return false;

            const requisitosFaltantes = curso.requisitos.filter(req => !cursoEstaAprobado(req));

            return requisitosFaltantes.length === 0;
        })
        .map(curso => {
            const correquisitosPendientes = curso.correquisitos.filter(co => !cursoEstaAprobado(co));

            return {
                ...curso,
                correquisitosPendientes,
                textoCorrequisitosPendientes: correquisitosPendientes
                    .map(codigo => obtenerNombreCursoCatalogo(codigo, mapaCursos))
                    .join(', ')
            };
        })
        .sort((a, b) => {
            const cicloA = Number(a.ciclo);
            const cicloB = Number(b.ciclo);

            if (Number.isFinite(cicloA) && Number.isFinite(cicloB)) {
                return cicloA - cicloB;
            }

            return a.nombre.localeCompare(b.nombre, 'es');
        });
}

function abrirModalProximosCursos() {
    if (!requiereSesion()) return;

    if (!mallaSeleccionada) {
        mostrarModalSeleccionMalla();
        return;
    }

    renderProximosCursos();

    registrarEvento('abrir_proximos_cursos', {
        total_cursos_proximos: obtenerCursosProximos().length
    });

    mostrarModal('modal-proximos-cursos');
}

function cerrarModalProximosCursos() {
    cerrarModalPorId('modal-proximos-cursos');
}

function renderProximosCursos() {
    const contenedor = $('proximos-lista-cursos');

    if (!contenedor) return;

    const cursosProximos = obtenerCursosProximos();

    contenedor.innerHTML = '';
    planProximoSeleccionado = [];

    setText('proximos-cursos-seleccionados', 0);
    setText('proximos-creditos-seleccionados', 0);

    const btnExportar = $('btn-exportar-plan');

    if (btnExportar) {
        btnExportar.disabled = true;
        btnExportar.classList.add('btn-exportar-disabled');
    }

    if (cursosProximos.length === 0) {
        contenedor.innerHTML = `
            <div class="proximos-vacio">
                No se encontraron cursos disponibles próximamente con los requisitos actuales.
                <br>
                Revisa si aún te faltan requisitos o si ya completaste los cursos principales de esta malla.
            </div>
        `;
        return;
    }

    cursosProximos.forEach(curso => {
        const fila = document.createElement('label');
        fila.className = 'proximo-curso';

        if (curso.correquisitosPendientes.length > 0) {
            fila.classList.add('proximo-curso-correquisito');
        }

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'proximo-check';
        checkbox.value = curso.codigo;
        checkbox.dataset.nombre = curso.nombre;
        checkbox.dataset.creditos = curso.creditos;
        checkbox.dataset.ciclo = curso.tituloCiclo;
        checkbox.addEventListener('change', actualizarResumenPlanProximo);

        const contenido = document.createElement('div');
        contenido.className = 'proximo-curso-info';

        const titulo = document.createElement('div');
        titulo.className = 'proximo-curso-titulo';
        titulo.textContent = `${curso.nombre} (${curso.codigo})`;

        const detalle = document.createElement('div');
        detalle.className = 'proximo-curso-detalle';
        detalle.textContent = `${curso.tituloCiclo} | ${curso.creditos} créditos | ${curso.tipo}`;

        contenido.appendChild(titulo);
        contenido.appendChild(detalle);

        if (curso.correquisitosPendientes.length > 0) {
            const avisoCorrequisito = document.createElement('div');
            avisoCorrequisito.className = 'proximo-correquisito-aviso';
            avisoCorrequisito.textContent = `Revisar correquisito pendiente: ${curso.textoCorrequisitosPendientes}`;
            contenido.appendChild(avisoCorrequisito);
        } else {
            const disponible = document.createElement('div');
            disponible.className = 'proximo-disponible';
            disponible.textContent = 'Disponible según requisitos aprobados';
            contenido.appendChild(disponible);
        }

        fila.appendChild(checkbox);
        fila.appendChild(contenido);

        contenedor.appendChild(fila);
    });
}

function obtenerChecksProximos() {
    return Array.from(document.querySelectorAll('.proximo-check'));
}

function seleccionarTodosProximos() {
    obtenerChecksProximos().forEach(check => {
        check.checked = true;
    });

    actualizarResumenPlanProximo();
}

function limpiarSeleccionProximos() {
    obtenerChecksProximos().forEach(check => {
        check.checked = false;
    });

    actualizarResumenPlanProximo();
}

function actualizarResumenPlanProximo() {
    const seleccionados = obtenerChecksProximos().filter(check => check.checked);

    let totalCreditos = 0;

    planProximoSeleccionado = seleccionados.map(check => {
        const creditos = Number(check.dataset.creditos) || 0;

        totalCreditos += creditos;

        return {
            codigo: check.value,
            nombre: check.dataset.nombre || '',
            creditos,
            ciclo: check.dataset.ciclo || ''
        };
    });

    setText('proximos-cursos-seleccionados', planProximoSeleccionado.length);
    setText('proximos-creditos-seleccionados', totalCreditos);

    const btnExportar = $('btn-exportar-plan');

    if (btnExportar) {
        btnExportar.disabled = planProximoSeleccionado.length === 0;
        btnExportar.classList.toggle('btn-exportar-disabled', planProximoSeleccionado.length === 0);
    }
}

(function configurarModalProximosCursos() {
    const modal = $('modal-proximos-cursos');

    if (!modal) return;

    modal.addEventListener('click', function (e) {
        if (e.target === this) {
            cerrarModalProximosCursos();
        }
    });
})();

function limpiarNombreArchivo(texto) {
    return String(texto || 'plan')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9-_]/g, '_')
        .replace(/_+/g, '_')
        .toLowerCase();
}

function obtenerFechaReportePlan() {
    const fecha = new Date();

    return fecha.toLocaleDateString('es-CR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

function construirTextoPlanProximo() {
    actualizarResumenPlanProximo();

    const fechaReporte = obtenerFechaReportePlan();
    const nombreMalla = mallaSeleccionada ? obtenerNombreMalla(mallaSeleccionada) : 'Malla no seleccionada';

    const totalCreditos = planProximoSeleccionado.reduce((total, curso) => {
        return total + (Number(curso.creditos) || 0);
    }, 0);

    const lineas = [];

    lineas.push('PLAN DE MATRÍCULA SUGERIDO');
    lineas.push('Malla Interactiva UCR');
    lineas.push('');
    lineas.push(`Fecha de exportación: ${fechaReporte}`);
    lineas.push(`Malla: ${nombreMalla}`);
    lineas.push('');
    lineas.push('Cursos seleccionados:');
    lineas.push('----------------------------------------');

    planProximoSeleccionado.forEach((curso, index) => {
        lineas.push(`${index + 1}. ${curso.nombre} (${curso.codigo})`);
        lineas.push(`   Ciclo/Bloque: ${curso.ciclo}`);
        lineas.push(`   Créditos: ${curso.creditos}`);
        lineas.push('');
    });

    lineas.push('----------------------------------------');
    lineas.push(`Total de cursos seleccionados: ${planProximoSeleccionado.length}`);
    lineas.push(`Total de créditos seleccionados: ${totalCreditos}`);
    lineas.push('');
    lineas.push('Nota importante:');
    lineas.push('Esta lista es una sugerencia basada en los requisitos registrados en la malla.');
    lineas.push('No garantiza disponibilidad real de matrícula.');
    lineas.push('La oferta puede depender de cupos, horarios, sede, grupo, cursos anuales, correquisitos, requisitos administrativos y disponibilidad en eMatrícula.');

    return lineas.join('\n');
}

function exportarPlanProximoTxt() {
    if (!requiereSesion()) return;

    if (!mallaSeleccionada) {
        mostrarModalSeleccionMalla();
        return;
    }

    actualizarResumenPlanProximo();

    if (!Array.isArray(planProximoSeleccionado) || planProximoSeleccionado.length === 0) {
        mostrarAviso(
            'Sin cursos seleccionados',
            'Selecciona al menos un curso del módulo Próximo para poder exportar el plan.'
        );
        return;
    }

    const contenido = construirTextoPlanProximo();
    const blob = new Blob([contenido], { type: 'text/plain;charset=utf-8' });

    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');

    const nombreMalla = limpiarNombreArchivo(obtenerNombreMalla(mallaSeleccionada));
    const fecha = new Date().toISOString().slice(0, 10);

    enlace.href = url;
    enlace.download = `plan_matricula_${nombreMalla}_${fecha}.txt`;

    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);

    URL.revokeObjectURL(url);

    registrarEvento('exportar_plan_proximo_txt', {
        cursos_exportados: planProximoSeleccionado.length,
        creditos_exportados: planProximoSeleccionado.reduce((total, curso) => total + (Number(curso.creditos) || 0), 0)
    });
}