// --- Malla actual cargada desde archivos externos ---
let mallaActual = [];
let totalCreditosCarrera = 0;

// --- Estado global ---
let estadoCursos = {};
let bitacoraTCU = [];
let usuarioActual = null;
let editandoTCUIndex = -1;
let mallaSeleccionada = null;

const TOTAL_HORAS_TCU = 300;

// --- Cargar malla por ID ---
function cargarMallaPorId(idMalla) {
    const datosMalla = window.mallasDisponibles?.[idMalla];

    if (!datosMalla) {
        alert('No se encontró la malla seleccionada. Verifica que el archivo de esa malla esté cargado.');
        return false;
    }

    mallaSeleccionada = datosMalla.id;
    mallaActual = Array.isArray(datosMalla.ciclos) ? datosMalla.ciclos : [];
    totalCreditosCarrera = Number(datosMalla.totalCreditos) || calcularTotalCreditosMalla(mallaActual);

    document.title = datosMalla.nombre
        ? `Malla Interactiva - ${datosMalla.nombre}`
        : 'Malla Interactiva';

    const titulo = document.querySelector('.header-title h1');
    const subtitulo = document.querySelector('.header-title p');

    if (titulo) {
        titulo.textContent = 'Malla Interactiva';
    }

    if (subtitulo) {
        subtitulo.textContent = datosMalla.subtitulo || datosMalla.nombre || 'Malla curricular';
    }

    setText('total-creditos-carrera', totalCreditosCarrera);

    const selectMalla = $('select-malla');
    if (selectMalla) {
        selectMalla.value = idMalla;
    }

    return true;
}

function calcularTotalCreditosMalla(ciclos) {
    if (!Array.isArray(ciclos)) return 0;

    return ciclos.reduce((total, bloque) => {
        const cursos = Array.isArray(bloque.cursos) ? bloque.cursos : [];

        return total + cursos.reduce((subtotal, curso) => {
            const creditos = Number(curso.creditos);
            return subtotal + (Number.isFinite(creditos) ? creditos : 0);
        }, 0);
    }, 0);
}

// --- Utilidades generales ---
function $(id) {
    return document.getElementById(id);
}

function obtenerTexto(valor) {
    return String(valor ?? '').trim();
}

function setText(id, valor) {
    const elemento = $(id);

    if (elemento) {
        elemento.textContent = valor;
    }
}

function mostrarElemento(id, display = 'block') {
    const elemento = $(id);

    if (elemento) {
        elemento.style.display = display;
    }
}

function ocultarElemento(id) {
    const elemento = $(id);

    if (elemento) {
        elemento.style.display = 'none';
    }
}

function mostrarModal(id) {
    mostrarElemento(id, 'flex');
}

function cerrarModalPorId(id) {
    ocultarElemento(id);
}

function obtenerNombreUsuario(user) {
    return user?.displayName || user?.email || 'Usuario';
}

function requiereSesion() {
    if (!usuarioActual) {
        mostrarModalLogin();
        return false;
    }

    return true;
}

function mostrarModalLogin() {
    mostrarModal('modal-login');
}

function ocultarModalLogin() {
    cerrarModalPorId('modal-login');
}

function mostrarModalSeleccionMalla() {
    renderOpcionesMalla();
    mostrarModal('modal-seleccionar-malla');
}

function ocultarModalSeleccionMalla() {
    cerrarModalPorId('modal-seleccionar-malla');
}

function obtenerNombreMalla(idMalla) {
    const datosMalla = window.mallasDisponibles?.[idMalla];
    return datosMalla?.nombre || 'Malla no definida';
}

function obtenerMallasDisponibles() {
    const mallas = window.mallasDisponibles || {};

    return Object.values(mallas)
        .filter(malla => malla && malla.id && malla.nombre)
        .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}

function renderOpcionesMalla() {
    const selectMalla = $('select-malla');

    if (!selectMalla) return;

    const valorActual = selectMalla.value || mallaSeleccionada || '';
    const mallas = obtenerMallasDisponibles();

    selectMalla.innerHTML = '';

    const opcionInicial = document.createElement('option');
    opcionInicial.value = '';
    opcionInicial.textContent = mallas.length > 0
        ? 'Selecciona una opción'
        : 'No hay mallas cargadas';
    selectMalla.appendChild(opcionInicial);

    mallas.forEach(malla => {
        const opcion = document.createElement('option');
        opcion.value = malla.id;
        opcion.textContent = malla.nombre;
        selectMalla.appendChild(opcion);
    });

    if (valorActual && window.mallasDisponibles?.[valorActual]) {
        selectMalla.value = valorActual;
    }
}

function parsearJSONSeguro(valor, valorPorDefecto) {
    try {
        return JSON.parse(valor) ?? valorPorDefecto;
    } catch (error) {
        console.warn('No se pudo leer información previa de localStorage:', error);
        return valorPorDefecto;
    }
}

function registrarEvento(nombre, parametros = {}) {
    try {
        if (typeof analytics !== 'undefined' && analytics && typeof analytics.logEvent === 'function') {
            analytics.logEvent(nombre, parametros);
        }
    } catch (error) {
        console.warn('No se pudo registrar evento de Analytics:', error);
    }
}

function puedeTomarseCurso(curso) {
    let puedeTomarse = true;

    if (curso.requisitos) {
        puedeTomarse = curso.requisitos.every(req => estadoCursos[req]?.aprobado);
    }

    if (curso.correquisitos) {
        puedeTomarse = puedeTomarse && curso.correquisitos.every(co => estadoCursos[co]?.aprobado || estadoCursos[co]);
    }

    return puedeTomarse;
}

function fechaValida(fecha) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false;

    const fechaConvertida = new Date(`${fecha}T00:00:00`);
    return !Number.isNaN(fechaConvertida.getTime());
}

function formatearHoras(valor) {
    const numero = Number(valor);

    if (!Number.isFinite(numero)) return '0';
    return Number.isInteger(numero) ? String(numero) : numero.toFixed(1).replace('.', ',');
}

function limpiarFormularioTCU() {
    const fecha = $('tcu-fecha');
    const horas = $('tcu-horas');
    const actividad = $('tcu-actividad');
    const btn = $('btn-guardar-tcu');

    if (fecha) fecha.value = '';
    if (horas) horas.value = '';
    if (actividad) actividad.value = '';

    editandoTCUIndex = -1;

    if (btn) {
        btn.textContent = 'Añadir';
        btn.style.backgroundColor = '';
    }
}

// --- Footer automático ---
function agregarEstilosFooter() {
    if ($('footer-auto-style')) return;

    const style = document.createElement('style');
    style.id = 'footer-auto-style';
    style.textContent = `
        .app-footer {
            margin-top: 28px;
            padding: 16px;
            text-align: center;
            background: rgba(255, 255, 255, 0.85);
            border: 1px solid #cfd8dc;
            border-radius: 14px;
            color: #455a64;
            font-size: 0.9rem;
            box-shadow: 0 4px 10px rgba(15, 23, 42, 0.08);
        }

        .app-footer p {
            margin: 4px 0;
        }

        .footer-small {
            font-size: 0.78rem;
            color: #78909c;
        }
    `;

    document.head.appendChild(style);
}

function crearFooterCopyright() {
    if (document.querySelector('.app-footer')) return;

    agregarEstilosFooter();

    const wrapper = document.querySelector('.app-wrapper') || document.body;
    const footer = document.createElement('footer');
    const anioActual = new Date().getFullYear();

    footer.className = 'app-footer';

    const copyright = document.createElement('p');
    copyright.textContent = `© ${anioActual} Malla Interactiva UCR. Todos los derechos reservados.`;

    const descripcion = document.createElement('p');
    descripcion.className = 'footer-small';
    descripcion.textContent = 'Proyecto académico con autenticación de Google, Firebase Auth, Firestore y Analytics.';

    footer.appendChild(copyright);
    footer.appendChild(descripcion);
    wrapper.appendChild(footer);
}

// --- Selección de malla ---
async function guardarMallaSeleccionada() {
    if (!usuarioActual) {
        mostrarModalLogin();
        return;
    }

    const selectMalla = $('select-malla');

    if (!selectMalla) return;

    renderOpcionesMalla();

    const valorSeleccionado = selectMalla.value;

    if (!valorSeleccionado) {
        alert('Debes seleccionar una malla curricular.');
        return;
    }

    const mallaCargada = cargarMallaPorId(valorSeleccionado);

    if (!mallaCargada) return;

    const confirmar = confirm(
        `Seleccionaste: ${obtenerNombreMalla(valorSeleccionado)}.\n\nEsta opción no se podrá cambiar después. ¿Deseas continuar?`
    );

    if (!confirmar) return;

    try {
        await db.collection('usuarios').doc(usuarioActual.uid).set({
            mallaSeleccionada: valorSeleccionado,
            estadoCursos: {},
            bitacoraTCU: [],
            creadoEn: firebase.firestore.FieldValue.serverTimestamp(),
            actualizadoEn: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        estadoCursos = {};
        bitacoraTCU = [];

        ocultarModalSeleccionMalla();

        registrarEvento('seleccionar_malla', {
            malla: valorSeleccionado
        });

        renderMalla();
    } catch (error) {
        console.error('Error guardando malla seleccionada:', error);
        alert('No se pudo guardar la malla seleccionada.');
    }
}

// --- Firebase ---
async function guardarDatosEnFirebase() {
    if (!usuarioActual) {
        mostrarModalLogin();
        return false;
    }

    try {
        await db.collection('usuarios').doc(usuarioActual.uid).set({
            mallaSeleccionada,
            estadoCursos,
            bitacoraTCU,
            actualizadoEn: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        return true;
    } catch (error) {
        console.error('Error guardando en Firebase:', error);
        alert('No se pudieron guardar los datos en Firebase. Revisa la conexión o las reglas de Firestore.');
        return false;
    }
}

async function cargarDatosDesdeFirebase(user) {
    try {
        const documento = await db.collection('usuarios').doc(user.uid).get();

        if (documento.exists) {
            const datos = documento.data();

            if (!datos.mallaSeleccionada) {
                mallaSeleccionada = null;
                mallaActual = [];
                estadoCursos = {};
                bitacoraTCU = [];

                renderMalla();
                mostrarModalSeleccionMalla();
                return;
            }

            const mallaCargada = cargarMallaPorId(datos.mallaSeleccionada);

            if (!mallaCargada) {
                mallaSeleccionada = null;
                mallaActual = [];
                estadoCursos = {};
                bitacoraTCU = [];

                renderMalla();
                mostrarModalSeleccionMalla();
                return;
            }

            estadoCursos = datos.estadoCursos || {};
            bitacoraTCU = Array.isArray(datos.bitacoraTCU) ? datos.bitacoraTCU : [];

            ocultarModalSeleccionMalla();
            renderMalla();
        } else {
            mallaSeleccionada = null;
            mallaActual = [];
            estadoCursos = {};
            bitacoraTCU = [];

            renderMalla();
            mostrarModalSeleccionMalla();
        }
    } catch (error) {
        console.error('Error cargando desde Firebase:', error);
        alert('No se pudieron cargar los datos desde Firebase.');
        renderMalla();
    }
}

// --- Notas ---
function redondearAMedio(valor) {
    return Math.round(valor * 2) / 2;
}

function procesarNotaInput(texto) {
    const limpio = obtenerTexto(texto).replace(',', '.');

    if (limpio === '') return null;

    let numero = Number(limpio);

    if (!Number.isFinite(numero)) return null;
    if (numero < 0) numero = 0;
    if (numero > 10) numero = 10;

    return redondearAMedio(numero);
}

function formatearNota(nota) {
    if (nota == null || nota === '') return '';

    const numero = Number(nota);

    if (!Number.isFinite(numero)) return '';
    return numero.toFixed(1).replace('.', ',');
}

// --- Render de la malla ---
function renderMalla() {
    const contenedor = $('malla');

    if (!contenedor) return;

    contenedor.innerHTML = '';

    if (!mallaActual || mallaActual.length === 0) {
        setText('creditos-aprobados', 0);
        setText('creditos-faltantes', totalCreditosCarrera);
        setText('total-creditos-carrera', totalCreditosCarrera);
        setText('promedio', '0,00');
        setText('porcentaje-avance', '0%');

        const progressBar = $('progress-bar-fill');

        if (progressBar) {
            progressBar.style.width = '0%';
        }

        const mensaje = document.createElement('div');
        mensaje.className = 'ciclo';
        mensaje.innerHTML = `
            <div class="ciclo-header">
                <div class="ciclo-header-text">
                    <h2>Selecciona una malla</h2>
                    <div class="ciclo-info">
                        <span>Inicia sesión y selecciona tu carrera para cargar los cursos.</span>
                    </div>
                </div>
            </div>
        `;

        contenedor.appendChild(mensaje);
        return;
    }

    const resumenCiclos = mallaActual.map(bloque => {
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

        return {
            ciclo: bloque.ciclo,
            totalCreditos,
            creditosAprobados,
            sumaNotas,
            sumaCreditosNotas
        };
    });

    const creditosAprobadosTotal = resumenCiclos.reduce((a, c) => a + c.creditosAprobados, 0);
    const sumaNotasTotal = resumenCiclos.reduce((a, c) => a + c.sumaNotas, 0);
    const sumaCreditosNotasTotal = resumenCiclos.reduce((a, c) => a + c.sumaCreditosNotas, 0);
    const promedioGlobal = sumaCreditosNotasTotal > 0 ? sumaNotasTotal / sumaCreditosNotasTotal : 0;
    const creditosFaltantes = Math.max(totalCreditosCarrera - creditosAprobadosTotal, 0);
    const porcentajeAvance = Math.min((creditosAprobadosTotal / totalCreditosCarrera) * 100, 100);

    setText('creditos-aprobados', creditosAprobadosTotal);
    setText('creditos-faltantes', creditosFaltantes);
    setText('promedio', promedioGlobal.toFixed(2).replace('.', ','));
    setText('porcentaje-avance', `${porcentajeAvance.toFixed(1).replace('.', ',')}%`);
    setText('total-creditos-carrera', totalCreditosCarrera);

    const progressBar = $('progress-bar-fill');

    if (progressBar) {
        progressBar.style.width = `${porcentajeAvance}%`;
    }

    mallaActual.forEach((bloque, index) => {
        const divCiclo = document.createElement('div');
        divCiclo.className = 'ciclo';

        const header = document.createElement('div');
        header.className = 'ciclo-header';

        const headerText = document.createElement('div');
        headerText.className = 'ciclo-header-text';

        const titulo = document.createElement('h2');
        titulo.textContent = `Ciclo ${bloque.ciclo}`;

        const info = document.createElement('div');
        info.className = 'ciclo-info';
        info.innerHTML = `<span><strong>Créditos:</strong> ${resumenCiclos[index].totalCreditos}</span>`;

        headerText.appendChild(titulo);
        headerText.appendChild(info);

        const btnPromedio = document.createElement('button');
        btnPromedio.type = 'button';
        btnPromedio.className = 'btn-promedio-header';
        btnPromedio.textContent = 'Promedio Matrícula';
        btnPromedio.addEventListener('click', () => abrirModalPromedio(bloque.ciclo));

        header.appendChild(headerText);
        header.appendChild(btnPromedio);
        divCiclo.appendChild(header);

        bloque.cursos.forEach(curso => {
            const estado = estadoCursos[curso.codigo] || { aprobado: false, nota: '' };
            const puedeTomarse = puedeTomarseCurso(curso);

            const divCurso = document.createElement('div');
            divCurso.className = 'curso';

            if (!puedeTomarse) divCurso.classList.add('bloqueado');
            if (estado.aprobado) divCurso.classList.add('aprobado');
            if (curso.codigo.startsWith('OPT') || curso.codigo.startsWith('RP-')) divCurso.classList.add('optativo');

            const cursoMain = document.createElement('div');
            cursoMain.className = 'curso-main';

            const label = document.createElement('label');
            label.className = 'nombre';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = Boolean(estado.aprobado);
            checkbox.addEventListener('change', () => toggleCurso(curso.codigo, checkbox.checked));

            const nombre = document.createElement('span');
            nombre.className = 'curso-nombre';
            nombre.textContent = curso.nombre;

            const codigo = document.createElement('span');
            codigo.className = 'curso-codigo';
            codigo.textContent = `(${curso.codigo})`;

            label.appendChild(checkbox);
            label.appendChild(nombre);
            label.appendChild(codigo);
            cursoMain.appendChild(label);

            const requisitosTexto = [];

            if (curso.requisitos) requisitosTexto.push(`Req: ${curso.requisitos.join(', ')}`);
            if (curso.correquisitos) requisitosTexto.push(`Co-req: ${curso.correquisitos.join(', ')}`);

            if (requisitosTexto.length > 0) {
                const requisitos = document.createElement('div');
                requisitos.className = 'requisitos';
                requisitos.textContent = requisitosTexto.join(' | ');
                cursoMain.appendChild(requisitos);
            }

            const cursoSide = document.createElement('div');
            cursoSide.className = 'curso-side';

            const creditos = document.createElement('div');
            creditos.className = 'creditos';
            creditos.textContent = `${curso.creditos} créditos`;

            cursoSide.appendChild(creditos);

            const notaDiv = document.createElement('div');
            notaDiv.className = 'nota';

            if (curso.creditos > 0) {
                const btnNota = document.createElement('button');
                btnNota.type = 'button';
                btnNota.className = 'btn-nota';
                btnNota.textContent = estado.nota ? formatearNota(estado.nota) : '📝 Nota';
                btnNota.addEventListener('click', () => abrirModal(curso.codigo, curso.nombre));

                notaDiv.appendChild(btnNota);
            } else {
                notaDiv.textContent = 'Sin nota';
                notaDiv.style.fontSize = '0.75rem';
                notaDiv.style.color = '#78909c';
                notaDiv.style.textAlign = 'right';
                notaDiv.style.marginTop = '6px';
                notaDiv.style.fontWeight = '500';
            }

            cursoSide.appendChild(notaDiv);

            divCurso.appendChild(cursoMain);
            divCurso.appendChild(cursoSide);
            divCiclo.appendChild(divCurso);
        });

        contenedor.appendChild(divCiclo);
    });
}

// --- Acciones de cursos ---
async function toggleCurso(codigo, aprobado) {
    if (!requiereSesion()) {
        renderMalla();
        return;
    }

    if (!mallaSeleccionada) {
        mostrarModalSeleccionMalla();
        renderMalla();
        return;
    }

    estadoCursos[codigo] = estadoCursos[codigo] || {};
    estadoCursos[codigo].aprobado = aprobado;

    const guardado = await guardarDatosEnFirebase();

    if (guardado) {
        registrarEvento('cambiar_estado_curso', {
            aprobado: aprobado ? 'si' : 'no'
        });
    } else {
        estadoCursos[codigo].aprobado = !aprobado;
    }

    renderMalla();
}

async function actualizarNota(codigo, valorInput) {
    if (!requiereSesion()) return;

    if (!mallaSeleccionada) {
        mostrarModalSeleccionMalla();
        return;
    }

    if (!valorInput || valorInput.trim() === '') {
        if (estadoCursos[codigo]) {
            delete estadoCursos[codigo].nota;
        }

        const guardado = await guardarDatosEnFirebase();

        if (guardado) {
            registrarEvento('eliminar_nota');
        }

        renderMalla();
        return;
    }

    const nota = procesarNotaInput(valorInput);

    if (nota === null) {
        alert('La nota debe ser un número válido entre 0 y 10.');
        renderMalla();
        return;
    }

    estadoCursos[codigo] = estadoCursos[codigo] || {};
    estadoCursos[codigo].nota = nota;

    const guardado = await guardarDatosEnFirebase();

    if (guardado) {
        registrarEvento('guardar_nota');
    }

    renderMalla();
}

// --- Modal de notas ---
function abrirModal(codigo, nombre) {
    if (!requiereSesion()) return;

    if (!mallaSeleccionada) {
        mostrarModalSeleccionMalla();
        return;
    }

    registrarEvento('abrir_modal_nota');

    setText('modal-curso-nombre', nombre);

    const inputCodigo = $('input-codigo-modal');
    const inputNota = $('input-nota-modal');

    if (inputCodigo) inputCodigo.value = codigo;

    const notaActual = estadoCursos[codigo]?.nota;

    if (inputNota) {
        inputNota.value = formatearNota(notaActual);
    }

    mostrarModal('modal-nota');

    if (inputNota) {
        inputNota.focus();
    }
}

function cerrarModal() {
    cerrarModalPorId('modal-nota');
}

function guardarNotaModal() {
    const inputCodigo = $('input-codigo-modal');
    const inputNota = $('input-nota-modal');

    if (!inputCodigo || !inputNota) return;

    actualizarNota(inputCodigo.value, inputNota.value);
    cerrarModal();
}

// --- Modal de resumen académico ---
function abrirModalResumen() {
    if (!requiereSesion()) return;

    if (!mallaSeleccionada) {
        mostrarModalSeleccionMalla();
        return;
    }

    registrarEvento('abrir_resumen_academico');
    mostrarModal('modal-resumen');
}

function cerrarModalResumen() {
    cerrarModalPorId('modal-resumen');
}

// --- Modal de promedio de matrícula ---
function abrirModalPromedio(cicloActual) {
    if (!requiereSesion()) return;

    if (!mallaSeleccionada) {
        mostrarModalSeleccionMalla();
        return;
    }

    registrarEvento('abrir_promedio_matricula', {
        ciclo: cicloActual
    });

    const modal = $('modal-promedio');
    const mensajeEl = $('mensaje-promedio');
    const cicloEl = $('modal-promedio-ciclo');

    if (!modal || !mensajeEl || !cicloEl) return;

    cicloEl.textContent = cicloActual;

    const bloqueActual = mallaActual.find(b => b.ciclo === cicloActual);

    if (!bloqueActual) return;

    const todoAprobado = bloqueActual.cursos.every(c => estadoCursos[c.codigo]?.aprobado);

    if (todoAprobado) {
        mensajeEl.innerHTML = `
            <strong>¡Ya aprobaste todos los cursos de este ciclo!</strong>
            <br><br>
            No necesitas calcular promedio de matrícula para un ciclo completado.
        `;

        mostrarModal('modal-promedio');
        return;
    }

    const todoBloqueado = bloqueActual.cursos.every(curso => !puedeTomarseCurso(curso));

    if (todoBloqueado && cicloActual > 1) {
        mensajeEl.innerHTML = `
            <strong>Aún no puedes matricular este ciclo.</strong>
            <br><br>
            Te faltan requisitos para desbloquear al menos un curso de este semestre.
        `;

        mostrarModal('modal-promedio');
        return;
    }

    if (cicloActual === 1 || cicloActual === 2) {
        mensajeEl.innerHTML = `
            Para el <strong>Ciclo ${cicloActual}</strong> no aplica el cálculo del ciclo trasanterior.
            <br><br>
            Generalmente para los primeros ciclos se utiliza tu nota de admisión a la universidad
            o el promedio ponderado del I Ciclo.
        `;
    } else {
        const cicloTrasanterior = cicloActual - 2;
        const bloqueTrasanterior = mallaActual.find(b => b.ciclo === cicloTrasanterior);

        let sumaNotasPorCredito = 0;
        let sumaCreditosMatriculados = 0;

        if (bloqueTrasanterior) {
            bloqueTrasanterior.cursos.forEach(curso => {
                const estado = estadoCursos[curso.codigo] || {};

                if (estado.nota != null && estado.nota !== '') {
                    sumaNotasPorCredito += estado.nota * curso.creditos;
                    sumaCreditosMatriculados += curso.creditos;
                }
            });
        }

        if (sumaCreditosMatriculados === 0) {
            mensajeEl.innerHTML = `
                <strong>Aún no hay notas registradas</strong> en el 
                <strong>Ciclo ${cicloTrasanterior}</strong> (tu ciclo trasanterior).
                <br><br>
                Ingresa tus notas en ese ciclo para poder calcular con qué promedio
                matricularás el Ciclo ${cicloActual}.
            `;
        } else {
            const promedioMatricula = sumaNotasPorCredito / sumaCreditosMatriculados;

            mensajeEl.innerHTML = `
                Tu promedio de matrícula para el Ciclo ${cicloActual} será de:
                <br>
                <span style="font-size: 2.5rem; color: #1976d2; font-weight: bold; display: block; margin: 15px 0;">
                    ${promedioMatricula.toFixed(2).replace('.', ',')}
                </span>
                <em style="font-size:0.85rem; color:#546e7a;">
                    Basado en las notas del ciclo lectivo ordinario trasanterior 
                    (Ciclo ${cicloTrasanterior}).
                </em>
            `;
        }
    }

    mostrarModal('modal-promedio');
}

function cerrarModalPromedio() {
    cerrarModalPorId('modal-promedio');
}

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
        alert('Por favor, llena todos los campos.');
        return;
    }

    if (!fechaValida(fecha)) {
        alert('La fecha ingresada no es válida.');
        return;
    }

    if (!Number.isFinite(horas) || horas <= 0) {
        alert('Las horas deben ser mayores a 0.');
        return;
    }

    if (horas > TOTAL_HORAS_TCU) {
        alert('Las horas de una sola entrada no pueden superar las 300 horas del TCU.');
        return;
    }

    const totalActual = bitacoraTCU.reduce((total, entrada, index) => {
        if (index === editandoTCUIndex) return total;

        const numero = Number(entrada.horas);
        return total + (Number.isFinite(numero) ? numero : 0);
    }, 0);

    if (totalActual + horas > TOTAL_HORAS_TCU) {
        alert('El total de horas no puede superar las 300 horas del TCU.');
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
        registrarEvento(estabaEditando ? 'editar_entrada_tcu' : 'agregar_entrada_tcu');

        limpiarFormularioTCU();
        renderBitacoraTCU();
    }
}

function editarEntradaTCU(index) {
    if (!requiereSesion()) return;

    const entrada = bitacoraTCU[index];

    if (!entrada) return;

    registrarEvento('abrir_edicion_tcu');

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

    if (confirm('¿Seguro que deseas eliminar esta entrada de la bitácora?')) {
        bitacoraTCU.splice(index, 1);

        const guardado = await guardarDatosEnFirebase();

        if (guardado) {
            registrarEvento('eliminar_entrada_tcu');

            if (editandoTCUIndex === index) {
                limpiarFormularioTCU();
            }

            renderBitacoraTCU();
        }
    }
}

function abrirModalTCU() {
    if (!requiereSesion()) return;

    if (!mallaSeleccionada) {
        mostrarModalSeleccionMalla();
        return;
    }

    registrarEvento('abrir_bitacora_tcu');

    renderBitacoraTCU();
    mostrarModal('modal-tcu');
}

function cerrarModalTCU() {
    cerrarModalPorId('modal-tcu');
    limpiarFormularioTCU();
}

// --- Restablecer datos del usuario ---
async function restablecerMisDatos() {
    if (!requiereSesion()) return;

    const confirmar = confirm(
        '¿Seguro que deseas borrar tus notas, cursos aprobados y bitácora TCU? Esta acción no se puede deshacer.'
    );

    if (!confirmar) return;

    estadoCursos = {};
    bitacoraTCU = [];
    editandoTCUIndex = -1;

    const guardado = await guardarDatosEnFirebase();

    if (guardado) {
        registrarEvento('restablecer_datos_usuario');
        limpiarFormularioTCU();
        renderMalla();
        renderBitacoraTCU();
        alert('Tus datos fueron restablecidos correctamente.');
    }
}

// --- Autenticación ---
async function iniciarSesionGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();

    try {
        registrarEvento('intento_login_google');
        await auth.signInWithPopup(provider);
    } catch (error) {
        console.error('Error iniciando sesión:', error);

        if (
            error.code === 'auth/popup-blocked' ||
            error.code === 'auth/popup-closed-by-user' ||
            error.code === 'auth/cancelled-popup-request'
        ) {
            try {
                await auth.signInWithRedirect(provider);
            } catch (redirectError) {
                console.error('Error con redirección:', redirectError);
                alert('No se pudo iniciar sesión con Google.');
            }
        } else {
            alert('No se pudo iniciar sesión con Google.');
        }
    }
}

async function cerrarSesionGoogle() {
    try {
        registrarEvento('cerrar_sesion');
        await auth.signOut();
    } catch (error) {
        console.error('Error cerrando sesión:', error);
        alert('No se pudo cerrar sesión.');
    }
}

// --- Eventos generales ---
function configurarEventosGenerales() {
    const modalNota = $('modal-nota');
    const modalResumen = $('modal-resumen');
    const modalPromedio = $('modal-promedio');
    const modalTCU = $('modal-tcu');
    const modalSeleccionMalla = $('modal-seleccionar-malla');
    const btnLogin = $('btn-login');
    const btnLoginModal = $('btn-login-modal');
    const btnLogout = $('btn-logout');
    const inputNota = $('input-nota-modal');
    const btnGuardarMalla = $('btn-guardar-malla');

    if (modalNota) {
        modalNota.addEventListener('click', function (e) {
            if (e.target === this) cerrarModal();
        });
    }

    if (modalResumen) {
        modalResumen.addEventListener('click', function (e) {
            if (e.target === this) cerrarModalResumen();
        });
    }

    if (modalPromedio) {
        modalPromedio.addEventListener('click', function (e) {
            if (e.target === this) cerrarModalPromedio();
        });
    }

    if (modalTCU) {
        modalTCU.addEventListener('click', function (e) {
            if (e.target === this) cerrarModalTCU();
        });
    }

    if (modalSeleccionMalla) {
        modalSeleccionMalla.addEventListener('click', function (e) {
            if (e.target === this) {
                alert('Debes seleccionar una malla para continuar.');
            }
        });
    }

    if (btnLogin) btnLogin.addEventListener('click', iniciarSesionGoogle);
    if (btnLoginModal) btnLoginModal.addEventListener('click', iniciarSesionGoogle);
    if (btnLogout) btnLogout.addEventListener('click', cerrarSesionGoogle);

    if (inputNota) {
        inputNota.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                guardarNotaModal();
            }
        });
    }

    if (btnGuardarMalla) {
        btnGuardarMalla.addEventListener('click', guardarMallaSeleccionada);
    }
}

// --- Estado de autenticación ---
function configurarAuthState() {
    auth.onAuthStateChanged(async function (user) {
        if (user) {
            usuarioActual = user;

            setText('usuario-info', obtenerNombreUsuario(user));
            ocultarElemento('btn-login');
            mostrarElemento('btn-logout', 'inline-block');
            ocultarModalLogin();

            registrarEvento('login_exitoso');

            await cargarDatosDesdeFirebase(user);
        } else {
            usuarioActual = null;
            estadoCursos = {};
            bitacoraTCU = [];
            mallaSeleccionada = null;
            mallaActual = [];
            totalCreditosCarrera = 0;

            document.title = 'Malla Interactiva';
            const subtitulo = document.querySelector('.header-title p');
            if (subtitulo) {
                subtitulo.textContent = 'Selecciona tu malla curricular';
            }

            setText('usuario-info', 'No has iniciado sesión');
            mostrarElemento('btn-login', 'inline-block');
            ocultarElemento('btn-logout');
            ocultarModalSeleccionMalla();
            mostrarModalLogin();

            renderMalla();
        }
    });
}

// --- Inicio de aplicación ---
function iniciarAplicacion() {
    crearFooterCopyright();
    renderOpcionesMalla();
    configurarEventosGenerales();
    configurarAuthState();
}

iniciarAplicacion();