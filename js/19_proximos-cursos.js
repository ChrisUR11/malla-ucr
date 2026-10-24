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
            if (cursoEstaAprobado(curso.codigo)) return false;

            return puedeTomarseCurso(curso);
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
            const cicloANumerico = a.ciclo !== '' && Number.isFinite(cicloA);
            const cicloBNumerico = b.ciclo !== '' && Number.isFinite(cicloB);

            if (cicloANumerico !== cicloBNumerico) {
                return cicloANumerico ? -1 : 1;
            }
            if (cicloANumerico && cicloA !== cicloB) {
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
    const avisoCorrequisitos = $('proximos-correquisitos-faltantes');
    if (avisoCorrequisitos) avisoCorrequisitos.hidden = true;

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
        checkbox.dataset.correquisitos = JSON.stringify(curso.correquisitosPendientes);
        checkbox.addEventListener('change', actualizarResumenPlanProximo);

        const contenido = document.createElement('div');
        contenido.className = 'proximo-curso-info';

        const titulo = document.createElement('div');
        titulo.className = 'proximo-curso-titulo';
        titulo.textContent = `${curso.nombre} (${curso.codigo})`;

        const detalle = document.createElement('div');
        detalle.className = 'proximo-curso-detalle';
        detalle.textContent = `${curso.tituloCiclo} | ${curso.creditos} ${curso.creditos === 1 ? 'crédito' : 'créditos'} | ${curso.tipo}`;

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
    const checks = obtenerChecksProximos();
    const seleccionados = checks.filter(check => check.checked);
    const codigosSeleccionados = new Set(seleccionados.map(check => check.value));
    const correquisitosFaltantes = new Set();

    let totalCreditos = 0;

    planProximoSeleccionado = seleccionados.map(check => {
        const creditos = Number(check.dataset.creditos) || 0;
        const correquisitos = JSON.parse(check.dataset.correquisitos || '[]');
        correquisitos.forEach(codigo => {
            if (!codigosSeleccionados.has(codigo)) correquisitosFaltantes.add(codigo);
        });

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

    const avisoCorrequisitos = $('proximos-correquisitos-faltantes');
    if (avisoCorrequisitos) {
        const nombres = Array.from(correquisitosFaltantes, codigo => {
            const check = checks.find(item => item.value === codigo);
            return check ? `${check.dataset.nombre} (${codigo})` : codigo;
        });
        avisoCorrequisitos.hidden = nombres.length === 0;
        avisoCorrequisitos.textContent = nombres.length
            ? `Para exportar, selecciona también los correquisitos pendientes: ${nombres.join(', ')}.`
            : '';
    }

    const btnExportar = $('btn-exportar-plan');

    if (btnExportar) {
        const deshabilitado = planProximoSeleccionado.length === 0 || correquisitosFaltantes.size > 0;
        btnExportar.disabled = deshabilitado;
        btnExportar.classList.toggle('btn-exportar-disabled', deshabilitado);
    }

    return correquisitosFaltantes;
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

// --- Funciones de exportación a Imagen para Próximos Cursos ---

async function exportarPlanProximoImagen() {
    if (!requiereSesion()) return;

    if (!mallaSeleccionada) {
        mostrarModalSeleccionMalla();
        return;
    }

    const correquisitosFaltantes = actualizarResumenPlanProximo();

    if (!Array.isArray(planProximoSeleccionado) || planProximoSeleccionado.length === 0) {
        mostrarAviso(
            'Sin cursos seleccionados',
            'Selecciona al menos un curso del módulo Próximo para poder exportar el plan.'
        );
        return;
    }
    if (correquisitosFaltantes.size > 0) {
        await mostrarAviso('Correquisitos pendientes',
            'Selecciona los correquisitos indicados antes de exportar el plan.');
        return;
    }

    const boton = $('btn-exportar-plan');
    const fechaEl = $('export-plan-fecha');
    const mallaEl = $('export-plan-malla');
    const tbodyEl = $('export-plan-tbody');
    const totalCreditosEl = $('export-plan-total-creditos');
    const plantilla = $('plantilla-exportar-plan');

    if (!fechaEl || !mallaEl || !tbodyEl || !totalCreditosEl || !plantilla) {
        await mostrarAviso('Error', 'La plantilla del plan no está disponible.');
        return;
    }
    if (typeof html2canvas !== 'function') {
        await mostrarAviso('Error', 'No se pudo cargar la herramienta para crear la imagen.');
        return;
    }

    const textoOriginal = boton?.textContent || 'Exportar plan';
    if (boton) {
        boton.textContent = 'Generando imagen...';
        boton.disabled = true;
    }

    fechaEl.textContent = obtenerFechaReportePlan();
    mallaEl.textContent = obtenerNombreMalla(mallaSeleccionada);

    let sumaCreditos = 0;
    tbodyEl.replaceChildren();
    try {
        planProximoSeleccionado.forEach(curso => {
            sumaCreditos += Number(curso.creditos) || 0;
            const tr = document.createElement('tr');

            const nombre = document.createElement('td');
            nombre.style.cssText = 'padding:10px;border-bottom:1px solid #e2e8f0;color:#1f2933';
            nombre.textContent = curso.nombre;
            const codigo = document.createElement('small');
            codigo.style.color = '#64748b';
            codigo.textContent = ` (${curso.codigo})`;
            nombre.appendChild(document.createElement('br'));
            nombre.appendChild(codigo);

            const ciclo = document.createElement('td');
            ciclo.style.cssText = 'padding:10px;border-bottom:1px solid #e2e8f0;color:#64748b;text-align:center';
            ciclo.textContent = curso.ciclo;

            const creditos = document.createElement('td');
            creditos.style.cssText = 'padding:10px;border-bottom:1px solid #e2e8f0;color:#1f2933;text-align:right;font-weight:600';
            creditos.textContent = curso.creditos;

            tr.append(nombre, ciclo, creditos);
            tbodyEl.appendChild(tr);
        });
        totalCreditosEl.textContent = `${sumaCreditos} créditos`;

        const canvas = await html2canvas(plantilla, {
            scale: 2,
            backgroundColor: '#ffffff',
            onclone(documentoClonado) {
                const copia = documentoClonado.getElementById('plantilla-exportar-plan');
                documentoClonado.body.appendChild(copia);
                copia.style.display = 'block';
                copia.style.position = 'absolute';
                copia.style.left = '0';
                copia.style.top = '0';
            }
        });

        const enlace = document.createElement('a');
        const nombreMalla = limpiarNombreArchivo(obtenerNombreMalla(mallaSeleccionada));
        const fecha = new Date().toISOString().slice(0, 10);
        enlace.download = `plan_matricula_${nombreMalla}_${fecha}.png`;
        enlace.href = canvas.toDataURL('image/png');
        enlace.click();

        registrarEvento('exportar_plan_proximo_imagen', {
            cursos_exportados: planProximoSeleccionado.length,
            creditos_exportados: sumaCreditos
        });
    } catch (error) {
        console.error('Error al generar la imagen del plan:', error);
        await mostrarAviso('Error', 'Hubo un problema al generar la imagen del plan. Intenta de nuevo.');
    } finally {
        if (boton) {
            boton.textContent = textoOriginal;
            boton.disabled = false;
        }
    }
}
