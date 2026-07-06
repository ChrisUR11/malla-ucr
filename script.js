// --- Definición de la malla ---
const malla = [
    {
        ciclo: 1,
        cursos: [
            { codigo: 'EG-', nombre: 'Curso de Arte', creditos: 2 },
            { codigo: 'EG-I', nombre: 'Curso Integrado de Humanidades I', creditos: 6 },
            { codigo: 'IF1300', nombre: 'Introducción a la Computación e Informática', creditos: 4 },
            { codigo: 'IF1400', nombre: 'Lógica para Informáticos', creditos: 2 },
            { codigo: 'LM1030', nombre: 'Estrategias de Lectura en Inglés I', creditos: 4 }
        ]
    },
    {
        ciclo: 2,
        cursos: [
            { codigo: 'EF-', nombre: 'Actividad Deportiva', creditos: 0 },
            { codigo: 'EG-II', nombre: 'Curso Integrado de Humanidades II', creditos: 6, requisitos: ['EG-I'] },
            { codigo: 'IF2000', nombre: 'Programación I', creditos: 4, requisitos: ['IF1300'] },
            { codigo: 'LM1032', nombre: 'Estrategias de Lectura en Inglés II', creditos: 4, requisitos: ['LM1030'] },
            { codigo: 'MA0320', nombre: 'Estructuras Matemáticas Discretas', creditos: 4 }
        ]
    },
    {
        ciclo: 3,
        cursos: [
            { codigo: 'IF3000', nombre: 'Programación II', creditos: 4, requisitos: ['IF2000'] },
            { codigo: 'IF3001', nombre: 'Algoritmos y Estructuras de Datos', creditos: 4, requisitos: ['IF2000'] },
            { codigo: 'IF3100', nombre: 'Introducción a Sistemas de Información', creditos: 3, requisitos: ['IF1300'] },
            { codigo: 'MA0321', nombre: 'Cálculo Diferencial e Integral', creditos: 4 },
            { codigo: 'XS0105', nombre: 'Estadística para Informáticos', creditos: 3 }
        ]
    },
    {
        ciclo: 4,
        cursos: [
            { codigo: 'IF4000', nombre: 'Arquitectura de Computadores', creditos: 3, requisitos: ['IF3000'] },
            { codigo: 'IF4001', nombre: 'Sistemas Operativos', creditos: 4, requisitos: ['IF3000', 'IF3001'] },
            { codigo: 'IF4100', nombre: 'Fundamentos de Bases de Datos', creditos: 4, requisitos: ['IF3000'] },
            { codigo: 'IF5200', nombre: 'Fundamentos de las Organizaciones', creditos: 3, requisitos: ['IF3100'] },
            { codigo: 'MA0322', nombre: 'Álgebra Lineal', creditos: 4, requisitos: ['MA0320', 'MA0321'] }
        ]
    },
    {
        ciclo: 5,
        cursos: [
            { codigo: 'IF4101', nombre: 'Lenguajes para Aplicaciones Comerciales', creditos: 4, requisitos: ['IF3100', 'IF4100'] },
            { codigo: 'IF5000', nombre: 'Redes y Comunicaciones de Datos', creditos: 4, requisitos: ['IF4001'] },
            { codigo: 'IF5100', nombre: 'Administración de Bases de Datos', creditos: 4, requisitos: ['IF4100'] },
            { codigo: 'MA0323', nombre: 'Métodos Numéricos', creditos: 4, requisitos: ['MA0322'] },
            { codigo: 'SR-I', nombre: 'Seminario de Realidad Nacional I', creditos: 2 }
        ]
    },
    {
        ciclo: 6,
        cursos: [
            { codigo: 'IF6000', nombre: 'Redes en los Negocios', creditos: 4, requisitos: ['IF5000'] },
            { codigo: 'IF6100', nombre: 'Análisis y Diseño de Sistemas', creditos: 4, requisitos: ['IF5100'] },
            { codigo: 'IF6200', nombre: 'Economía de la Computación', creditos: 3, requisitos: ['MA0323'] },
            { codigo: 'IF6201', nombre: 'Informática Aplicada a los Negocios', creditos: 3, requisitos: ['IF5200'] },
            { codigo: 'SR-II', nombre: 'Seminario de Realidad Nacional II', creditos: 2, requisitos: ['SR-I'] }
        ]
    },
    {
        ciclo: 7,
        cursos: [
            { codigo: 'IF7100', nombre: 'Ingeniería de Software', creditos: 4, requisitos: ['IF6100'] },
            { codigo: 'IF7101', nombre: 'Compromiso Social de la Informática', creditos: 2, correquisitos: ['IF7100'] },
            { codigo: 'IF7200', nombre: 'Métodos Cuantitativos para la Toma de Decisiones', creditos: 4, requisitos: ['IF6000', 'IF6200'] },
            { codigo: 'IF7201', nombre: 'Gestión de Proyectos', creditos: 4, requisitos: ['IF6200'] },
            { codigo: 'OPT453', nombre: 'Optativo de Temas Especiales', creditos: 3 }
        ]
    },
    {
        ciclo: 8,
        cursos: [
            { codigo: 'IF8100', nombre: 'Práctica Empresarial Supervisada', creditos: 6, requisitos: ['IF7100', 'IF7201'] },
            { codigo: 'IF8200', nombre: 'Auditoría Informática', creditos: 4, requisitos: ['IF7100', 'IF7201'] },
            { codigo: 'IF8201', nombre: 'Planificación Informática', creditos: 4, requisitos: ['IF7201'] },
            { codigo: 'RP-1', nombre: 'Repertorio', creditos: 3 }
        ]
    }
];

// Estado guardado de cursos y TCU
const estadoCursos = JSON.parse(localStorage.getItem('estadoCursos') || '{}');
let bitacoraTCU = JSON.parse(localStorage.getItem('bitacoraTCU') || '[]');

// Redondeo a 0,5
function redondearAMedio(valor) {
    return Math.round(valor * 2) / 2;
}

function procesarNotaInput(texto) {
    if (!texto) return null;
    const limpio = texto.toString().replace(',', '.').trim();
    if (limpio === '') return null;
    let numero = parseFloat(limpio);
    if (isNaN(numero)) return null;
    if (numero < 0) numero = 0;
    if (numero > 10) numero = 10;
    return redondearAMedio(numero);
}

function formatearNota(nota) {
    if (nota == null || nota === '') return '';
    return Number(nota).toFixed(1).replace('.', ',');
}

function renderMalla() {
    const contenedor = document.getElementById('malla');
    contenedor.innerHTML = '';

    // Resumen por ciclo
    const resumenCiclos = malla.map(bloque => {
        let totalCreditos = 0;
        let creditosAprobados = 0;
        let sumaNotas = 0;
        let sumaCreditosNotas = 0;

        bloque.cursos.forEach(curso => {
            totalCreditos += curso.creditos;
            const estado = estadoCursos[curso.codigo] || {};

            if (estado.aprobado) {
                creditosAprobados += curso.creditos;
                if (estado.nota != null && estado.nota !== '') {
                    sumaNotas += estado.nota * curso.creditos;
                    sumaCreditosNotas += curso.creditos;
                }
            }
        });

        return { ciclo: bloque.ciclo, totalCreditos, creditosAprobados, sumaNotas, sumaCreditosNotas };
    });

    // Resumen global
    const creditosAprobadosTotal = resumenCiclos.reduce((a, c) => a + c.creditosAprobados, 0);
    const sumaNotasTotal = resumenCiclos.reduce((a, c) => a + c.sumaNotas, 0);
    const sumaCreditosNotasTotal = resumenCiclos.reduce((a, c) => a + c.sumaCreditosNotas, 0);
    const promedioGlobal = sumaCreditosNotasTotal > 0 ? sumaNotasTotal / sumaCreditosNotasTotal : 0;

    // Actualiza los valores textuales
    document.getElementById('creditos-aprobados').textContent = creditosAprobadosTotal;
    document.getElementById('creditos-faltantes').textContent = 140 - creditosAprobadosTotal;
    document.getElementById('promedio').textContent = promedioGlobal.toFixed(2).replace('.', ',');

    // Actualiza la barra de porcentaje de avance
    const porcentajeAvance = (creditosAprobadosTotal / 140) * 100;
    document.getElementById('porcentaje-avance').textContent = porcentajeAvance.toFixed(1).replace('.', ',') + '%';
    document.getElementById('progress-bar-fill').style.width = porcentajeAvance + '%';

    // Render de ciclos (bloques)
    malla.forEach((bloque, index) => {
        const divCiclo = document.createElement('div');
        divCiclo.className = 'ciclo';

        const header = document.createElement('div');
        header.className = 'ciclo-header';
        header.innerHTML = `
            <div class="ciclo-header-text">
                <h2>Ciclo ${bloque.ciclo}</h2>
                <div class="ciclo-info"><span><strong>Créditos:</strong> ${resumenCiclos[index].totalCreditos}</span></div>
            </div>
            <button class="btn-promedio-header" onclick="abrirModalPromedio(${bloque.ciclo})">Promedio Matrícula</button>
        `;
        divCiclo.appendChild(header);

        // Cursos del ciclo
        bloque.cursos.forEach(curso => {
            const estado = estadoCursos[curso.codigo] || { aprobado: false, nota: '' };

            let puedeTomarse = true;
            if (curso.requisitos) puedeTomarse = curso.requisitos.every(req => estadoCursos[req]?.aprobado);
            if (curso.correquisitos) puedeTomarse = puedeTomarse && curso.correquisitos.every(co => estadoCursos[co]?.aprobado || estadoCursos[co]);

            const divCurso = document.createElement('div');
            divCurso.className = 'curso';
            
            if (!puedeTomarse) divCurso.classList.add('bloqueado');
            if (estado.aprobado) divCurso.classList.add('aprobado');
            if (curso.codigo.startsWith('OPT') || curso.codigo.startsWith('RP-')) divCurso.classList.add('optativo');

            const requisitosTexto = [];
            if (curso.requisitos) requisitosTexto.push(`Req: ${curso.requisitos.join(', ')}`);
            if (curso.correquisitos) requisitosTexto.push(`Co-req: ${curso.correquisitos.join(', ')}`);

            divCurso.innerHTML = `
                <div class="curso-main">
                    <label class="nombre">
                        <input type="checkbox" ${estado.aprobado ? 'checked' : ''} onchange="toggleCurso('${curso.codigo}', this.checked)">
                        <span class="curso-nombre">${curso.nombre}</span>
                        <span class="curso-codigo">(${curso.codigo})</span>
                    </label>
                    ${requisitosTexto.length ? `<div class="requisitos">${requisitosTexto.join(' | ')}</div>` : ''}
                </div>
                <div class="curso-side">
                    <div class="creditos">${curso.creditos} créditos</div>
                    ${curso.creditos > 0 ? `
                        <div class="nota">
                            <button class="btn-nota" onclick="abrirModal('${curso.codigo}', '${curso.nombre}')">
                                ${estado.nota ? formatearNota(estado.nota) : '📝 Nota'}
                            </button>
                        </div>
                    ` : `
                        <div class="nota" style="font-size: 0.75rem; color: #78909c; text-align: right; margin-top: 6px; font-weight: 500;">Sin nota</div>
                    `}
                </div>
            `;
            divCiclo.appendChild(divCurso);
        });
        contenedor.appendChild(divCiclo);
    });
}

function toggleCurso(codigo, aprobado) {
    estadoCursos[codigo] = estadoCursos[codigo] || {};
    estadoCursos[codigo].aprobado = aprobado;
    localStorage.setItem('estadoCursos', JSON.stringify(estadoCursos));
    renderMalla();
}

function actualizarNota(codigo, valorInput) {
    if (!valorInput || valorInput.trim() === '') {
        if (estadoCursos[codigo]) {
            delete estadoCursos[codigo].nota;
            localStorage.setItem('estadoCursos', JSON.stringify(estadoCursos));
        }
        renderMalla();
        return;
    }
    const nota = procesarNotaInput(valorInput);
    if (nota === null) { renderMalla(); return; }
    estadoCursos[codigo] = estadoCursos[codigo] || {};
    estadoCursos[codigo].nota = nota;
    localStorage.setItem('estadoCursos', JSON.stringify(estadoCursos));
    renderMalla();
}

// --- Controladores del Modal de Notas ---
function abrirModal(codigo, nombre) {
    document.getElementById('modal-curso-nombre').textContent = nombre;
    document.getElementById('input-codigo-modal').value = codigo;
    const notaActual = estadoCursos[codigo]?.nota;
    document.getElementById('input-nota-modal').value = formatearNota(notaActual);
    document.getElementById('modal-nota').style.display = 'flex';
    document.getElementById('input-nota-modal').focus();
}
function cerrarModal() { document.getElementById('modal-nota').style.display = 'none'; }
function guardarNotaModal() {
    const codigo = document.getElementById('input-codigo-modal').value;
    const valorInput = document.getElementById('input-nota-modal').value;
    actualizarNota(codigo, valorInput);
    cerrarModal();
}
document.getElementById('modal-nota').addEventListener('click', function (e) { if (e.target === this) cerrarModal(); });

// --- Controladores del Modal de Resumen Académico ---
function abrirModalResumen() { document.getElementById('modal-resumen').style.display = 'flex'; }
function cerrarModalResumen() { document.getElementById('modal-resumen').style.display = 'none'; }
document.getElementById('modal-resumen').addEventListener('click', function (e) { if (e.target === this) cerrarModalResumen(); });

// --- Controladores del Modal de Promedio de Matrícula ---
function abrirModalPromedio(cicloActual) {
    const modal = document.getElementById('modal-promedio');
    const mensajeEl = document.getElementById('mensaje-promedio');
    document.getElementById('modal-promedio-ciclo').textContent = cicloActual;

    const bloqueActual = malla.find(b => b.ciclo === cicloActual);
    const todoAprobado = bloqueActual.cursos.every(c => estadoCursos[c.codigo]?.aprobado);
    if (todoAprobado) {
        mensajeEl.innerHTML = `<strong>¡Ya aprobaste todos los cursos de este ciclo!</strong><br><br>No necesitas calcular promedio de matrícula para un ciclo completado.`;
        modal.style.display = 'flex'; return;
    }

    const todoBloqueado = bloqueActual.cursos.every(curso => {
        let puede = true;
        if (curso.requisitos) puede = curso.requisitos.every(req => estadoCursos[req]?.aprobado);
        if (curso.correquisitos) puede = puede && curso.correquisitos.every(co => estadoCursos[co]?.aprobado || estadoCursos[co]);
        return !puede;
    });

    if (todoBloqueado && cicloActual > 1) {
        mensajeEl.innerHTML = `<strong>Aún no puedes matricular este ciclo.</strong><br><br>Te faltan requisitos para desbloquear al menos un curso de este semestre.`;
        modal.style.display = 'flex'; return;
    }

    if (cicloActual === 1 || cicloActual === 2) {
        mensajeEl.innerHTML = `Para el <strong>Ciclo ${cicloActual}</strong> no aplica el cálculo del ciclo trasanterior.<br><br>Generalmente para los primeros ciclos se utiliza tu nota de admisión a la universidad o el promedio ponderado del I Ciclo.`;
    } else {
        const cicloTrasanterior = cicloActual - 2;
        const bloqueTrasanterior = malla.find(b => b.ciclo === cicloTrasanterior);
        let sumaNotasPorCredito = 0; let sumaCreditosMatriculados = 0;

        bloqueTrasanterior.cursos.forEach(curso => {
            const estado = estadoCursos[curso.codigo] || {};
            if (estado.nota != null && estado.nota !== '') {
                sumaNotasPorCredito += (estado.nota * curso.creditos);
                sumaCreditosMatriculados += curso.creditos;
            }
        });

        if (sumaCreditosMatriculados === 0) {
            mensajeEl.innerHTML = `<strong>Aún no hay notas registradas</strong> en el <strong>Ciclo ${cicloTrasanterior}</strong> (tu ciclo trasanterior).<br><br>Ingresa tus notas en ese ciclo para poder calcular con qué promedio matricularás el Ciclo ${cicloActual}.`;
        } else {
            const promedioMatricula = sumaNotasPorCredito / sumaCreditosMatriculados;
            mensajeEl.innerHTML = `Tu promedio de matrícula para el Ciclo ${cicloActual} será de:<br>
                <span style="font-size: 2.5rem; color: #1976d2; font-weight: bold; display: block; margin: 15px 0;">${promedioMatricula.toFixed(2).replace('.', ',')}</span>
                <em style="font-size:0.85rem; color:#546e7a;">Basado en las notas del ciclo lectivo ordinario trasanterior (Ciclo ${cicloTrasanterior}).</em>`;
        }
    }
    modal.style.display = 'flex';
}
function cerrarModalPromedio() { document.getElementById('modal-promedio').style.display = 'none'; }
document.getElementById('modal-promedio').addEventListener('click', function (e) { if (e.target === this) cerrarModalPromedio(); });


// --- Lógica de la Bitácora TCU ---
let editandoTCUIndex = -1; // Variable para saber si estamos editando o creando

function renderBitacoraTCU() {
    const tbody = document.getElementById('tcu-tbody');
    tbody.innerHTML = '';
    
    let totalHoras = 0;

    // Ordenar por fecha (las más recientes primero)
    const bitacoraOrdenada = [...bitacoraTCU].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    bitacoraOrdenada.forEach((entrada) => {
        // Encontrar el índice real para poder editar/eliminar correctamente
        const indexReal = bitacoraTCU.indexOf(entrada);
        totalHoras += parseFloat(entrada.horas);

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${entrada.fecha}</td>
            <td>${entrada.actividad}</td>
            <td><strong>${entrada.horas}</strong></td>
            <td style="white-space: nowrap; text-align: right;">
                <button class="btn-editar-tcu" onclick="editarEntradaTCU(${indexReal})">✏️</button>
                <button class="btn-eliminar-tcu" onclick="eliminarEntradaTCU(${indexReal})">🗑</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Actualizar progreso
    document.getElementById('tcu-horas-total').textContent = `${totalHoras} / 300`;
    let porcentaje = (totalHoras / 300) * 100;
    if (porcentaje > 100) porcentaje = 100;
    document.getElementById('tcu-progress-fill').style.width = porcentaje + '%';
}

function agregarEntradaTCU() {
    const fecha = document.getElementById('tcu-fecha').value;
    const horas = document.getElementById('tcu-horas').value;
    const actividad = document.getElementById('tcu-actividad').value;

    if (!fecha || !horas || !actividad.trim()) {
        alert('Por favor, llena todos los campos.');
        return;
    }

    if (editandoTCUIndex >= 0) {
        // Estamos actualizando una entrada existente
        bitacoraTCU[editandoTCUIndex] = { fecha, horas, actividad };
        editandoTCUIndex = -1; // Salimos del modo edición
        
        // Restaurar el botón a su estado normal
        const btn = document.getElementById('btn-guardar-tcu');
        btn.textContent = 'Añadir';
        btn.style.backgroundColor = ''; 
    } else {
        // Estamos creando una entrada nueva
        bitacoraTCU.push({ fecha, horas, actividad });
    }

    localStorage.setItem('bitacoraTCU', JSON.stringify(bitacoraTCU));
    
    // Limpiar campos
    document.getElementById('tcu-fecha').value = '';
    document.getElementById('tcu-horas').value = '';
    document.getElementById('tcu-actividad').value = '';

    renderBitacoraTCU();
}

function editarEntradaTCU(index) {
    const entrada = bitacoraTCU[index];
    
    // Pasar los datos de la tabla de vuelta a los inputs
    document.getElementById('tcu-fecha').value = entrada.fecha;
    document.getElementById('tcu-horas').value = entrada.horas;
    document.getElementById('tcu-actividad').value = entrada.actividad;

    // Cambiar el estado para saber que estamos editando
    editandoTCUIndex = index;
    
    // Cambiar el botón visualmente para que se note
    const btn = document.getElementById('btn-guardar-tcu');
    btn.textContent = 'Actualizar';
    btn.style.backgroundColor = '#f57c00'; // Naranja
}

function eliminarEntradaTCU(index) {
    if (confirm('¿Seguro que deseas eliminar esta entrada de la bitácora?')) {
        bitacoraTCU.splice(index, 1);
        localStorage.setItem('bitacoraTCU', JSON.stringify(bitacoraTCU));
        
        // Si borramos la entrada que estábamos editando, cancelar la edición
        if (editandoTCUIndex === index) {
            editandoTCUIndex = -1;
            document.getElementById('btn-guardar-tcu').textContent = 'Añadir';
            document.getElementById('btn-guardar-tcu').style.backgroundColor = '';
            document.getElementById('tcu-fecha').value = '';
            document.getElementById('tcu-horas').value = '';
            document.getElementById('tcu-actividad').value = '';
        }

        renderBitacoraTCU();
    }
}

function abrirModalTCU() {
    renderBitacoraTCU();
    document.getElementById('modal-tcu').style.display = 'flex';
}

function cerrarModalTCU() {
    document.getElementById('modal-tcu').style.display = 'none';
    
    // Limpiar modo edición si cierran la ventana a la mitad
    editandoTCUIndex = -1;
    document.getElementById('btn-guardar-tcu').textContent = 'Añadir';
    document.getElementById('btn-guardar-tcu').style.backgroundColor = '';
    document.getElementById('tcu-fecha').value = '';
    document.getElementById('tcu-horas').value = '';
    document.getElementById('tcu-actividad').value = '';
}

document.getElementById('modal-tcu').addEventListener('click', function (e) {
    if (e.target === this) cerrarModalTCU();
});

// Inicializar la aplicación
renderMalla();