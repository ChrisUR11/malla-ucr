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
    if (typeof cerrarMenuUsuario === 'function') {
        cerrarMenuUsuario();
    }

    const modal = $(id);
    if (!modal) return;

    if (!modalFocusPrevio.has(modal)) {
        modalFocusPrevio.set(modal, document.activeElement);
    }

    mostrarElemento(id, 'flex');
    const controles = modal.querySelectorAll('[autofocus], input:not([type="hidden"]), select, textarea, button');
    const primerControl = [...controles].find(control =>
        !control.disabled && control.getClientRects().length > 0
    );
    if (!primerControl) modal.tabIndex = -1;
    (primerControl || modal).focus();
}

function cerrarModalPorId(id) {
    const modal = $(id);
    if (!modal) return;

    const focoEstabaDentro = modal.contains(document.activeElement) || document.activeElement === modal;
    const focoPrevio = modalFocusPrevio.get(modal);
    modalFocusPrevio.delete(modal);
    ocultarElemento(id);

    if (focoEstabaDentro && focoPrevio?.isConnected &&
        focoPrevio.closest('.modal-overlay')?.style.display !== 'none') {
        focoPrevio.focus();
    }
}

const modalFocusPrevio = new WeakMap();


// --- Mensajes internos sin alert() ni confirm() del navegador ---
function mostrarAviso(titulo, mensaje) {
    return mostrarMensajePersonalizado({
        titulo,
        mensaje,
        tipo: 'aviso',
        textoAceptar: 'Entendido'
    });
}

function mostrarConfirmacion({ titulo, mensaje, textoAceptar = 'Aceptar', textoCancelar = 'Cancelar', peligro = false }) {
    return mostrarMensajePersonalizado({
        titulo,
        mensaje,
        tipo: 'confirmacion',
        textoAceptar,
        textoCancelar,
        peligro
    });
}

let colaMensajes = Promise.resolve();

function mostrarMensajePersonalizado(opciones) {
    const resultado = colaMensajes.then(() => mostrarMensajeAhora(opciones));
    colaMensajes = resultado.catch(() => {});
    return resultado;
}

function mostrarMensajeAhora({ titulo, mensaje, tipo = 'aviso', textoAceptar = 'Aceptar', textoCancelar = 'Cancelar', peligro = false }) {
    return new Promise(resolve => {
        const modal = $('modal-mensaje');
        const tituloEl = $('modal-mensaje-titulo');
        const textoEl = $('modal-mensaje-texto');
        const btnAceptar = $('modal-mensaje-aceptar');
        const btnCancelar = $('modal-mensaje-cancelar');

        if (!modal || !tituloEl || !textoEl || !btnAceptar || !btnCancelar) {
            console.warn('Falta el modal de mensajes en el HTML. Se resolvió la acción automáticamente.');
            resolve(tipo !== 'confirmacion');
            return;
        }

        tituloEl.textContent = titulo || 'Mensaje';
        textoEl.textContent = mensaje || '';
        btnAceptar.textContent = textoAceptar;
        btnCancelar.textContent = textoCancelar;
        btnAceptar.classList.toggle('btn-peligro', Boolean(peligro));
        btnCancelar.style.display = tipo === 'confirmacion' ? 'inline-block' : 'none';

        const limpiar = () => {
            btnAceptar.removeEventListener('click', aceptar);
            btnCancelar.removeEventListener('click', cancelar);
            modal.removeEventListener('click', clickFuera);
            cerrarModalPorId('modal-mensaje');
        };

        const aceptar = () => {
            limpiar();
            resolve(true);
        };

        const cancelar = () => {
            limpiar();
            resolve(false);
        };

        const clickFuera = (event) => {
            if (event.target === modal) {
                if (tipo === 'confirmacion') {
                    cancelar();
                } else {
                    aceptar();
                }
            }
        };

        btnAceptar.addEventListener('click', aceptar);
        btnCancelar.addEventListener('click', cancelar);
        modal.addEventListener('click', clickFuera);
        mostrarModal('modal-mensaje');
    });
}

function obtenerNombreUsuario(user) {
    return user?.displayName || user?.email || 'Usuario';
}

function requiereSesion() {
    if (!usuarioActual) {
        mostrarModalLogin();
        return false;
    }

    if (!datosCuentaCargados) {
        mostrarAviso('Datos no cargados', 'Tus datos todavía no se han cargado. Reintenta la carga antes de hacer cambios.');
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


function alternarMenuUsuario() {
    const menu = $('menu-dropdown');

    if (!menu) return;

    menu.classList.toggle('abierto');
    $('btn-menu')?.setAttribute('aria-expanded', String(menu.classList.contains('abierto')));
    menu.setAttribute('aria-hidden', String(!menu.classList.contains('abierto')));
}

function cerrarMenuUsuario() {
    const menu = $('menu-dropdown');

    if (menu) {
        menu.classList.remove('abierto');
        menu.setAttribute('aria-hidden', 'true');
    }

    $('btn-menu')?.setAttribute('aria-expanded', 'false');
}

async function abrirCambioMallaDesdeMenu() {
    if (!requiereSesion()) return;
    const uidInicial = usuarioActual.uid;

    cerrarMenuUsuario();

    const confirmar = await mostrarConfirmacion({
        titulo: 'Cambiar malla curricular',
        mensaje: 'Al cambiar de malla se borrarán tus cursos aprobados, notas, bitácora TCU y fotos guardadas en tu cuenta. Esta acción no se puede deshacer.',
        textoAceptar: 'Cambiar malla',
        textoCancelar: 'Cancelar',
        peligro: true
    });

    if (!confirmar || usuarioActual?.uid !== uidInicial) return;

    mostrarModalSeleccionMalla();
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

function obtenerCursoPorCodigo(codigo) {
    if (!codigo || !Array.isArray(mallaSecciones)) return null;

    for (const seccion of mallaSecciones) {
        const ciclos = Array.isArray(seccion.ciclos) ? seccion.ciclos : [];

        for (const bloque of ciclos) {
            const cursos = Array.isArray(bloque.cursos) ? bloque.cursos : [];
            const curso = cursos.find(item => item?.codigo === codigo);

            if (curso) {
                return {
                    curso,
                    ciclo: bloque.ciclo ?? bloque.titulo ?? 'sin_ciclo',
                    seccion: seccion.id || 'sin_seccion',
                    tituloSeccion: seccion.titulo || 'Sin sección'
                };
            }
        }
    }

    return null;
}

function obtenerDatosCursoAnalytics(codigo) {
    const infoCurso = obtenerCursoPorCodigo(codigo);
    const curso = infoCurso?.curso || {};

    return {
        codigo_curso: codigo || 'sin_codigo',
        ciclo_curso: String(infoCurso?.ciclo ?? 'sin_ciclo'),
        seccion_curso: infoCurso?.seccion || 'sin_seccion',
        creditos_curso: Number(curso.creditos) || 0,
        tipo_curso: curso.tipo || 'regular'
    };
}

function obtenerRangoNota(nota) {
    const numero = Number(nota);

    if (!Number.isFinite(numero)) return 'sin_nota';
    if (numero >= 9) return 'alta';
    if (numero >= 7) return 'aprobada';
    return 'baja';
}

function obtenerRangoAvance(porcentaje) {
    const numero = Number(porcentaje);

    if (!Number.isFinite(numero)) return 'sin_avance';
    if (numero >= 100) return '100';
    if (numero >= 75) return '75_99';
    if (numero >= 50) return '50_74';
    if (numero >= 25) return '25_49';
    if (numero > 0) return '1_24';
    return '0';
}

function obtenerTotalHorasTCU() {
    return bitacoraTCU.reduce((total, entrada) => {
        const horas = Number(entrada.horas);
        return total + (Number.isFinite(horas) ? horas : 0);
    }, 0);
}

function limpiarParametrosAnalytics(parametros = {}) {
    const parametrosLimpios = {};

    Object.entries(parametros).forEach(([clave, valor]) => {
        if (valor === undefined || valor === null) return;

        if (Array.isArray(valor)) {
            parametrosLimpios[clave] = valor.join('|').slice(0, 100);
            return;
        }

        if (typeof valor === 'boolean') {
            parametrosLimpios[clave] = valor ? 'si' : 'no';
            return;
        }

        if (typeof valor === 'number') {
            parametrosLimpios[clave] = Number.isFinite(valor) ? valor : 0;
            return;
        }

        parametrosLimpios[clave] = String(valor).slice(0, 100);
    });

    return parametrosLimpios;
}

function registrarEvento(nombre, parametros = {}) {
    try {
        const parametrosBase = {
            malla_id: mallaSeleccionada || 'sin_malla',
            malla_nombre: mallaSeleccionada ? obtenerNombreMalla(mallaSeleccionada) : 'Sin malla',
            seccion_activa: seccionActivaMalla || 'sin_seccion',
            sesion_iniciada: usuarioActual ? 'si' : 'no',
            ...parametros
        };

        const parametrosFinales = limpiarParametrosAnalytics(parametrosBase);

        if (typeof analytics !== 'undefined' && analytics && typeof analytics.logEvent === 'function') {
            analytics.logEvent(nombre, parametrosFinales);
            console.log('Evento enviado a Firebase Analytics:', nombre, parametrosFinales);
        } else {
            console.warn('Analytics todavía no está disponible o fue bloqueado:', nombre, parametrosFinales);
        }
    } catch (error) {
        console.warn('No se pudo registrar evento de Analytics:', error);
    }
}

function puedeTomarseCurso(curso) {
    const requisitos = Array.isArray(curso.requisitos) ? curso.requisitos : [];
    if (!requisitos.every(codigo => estadoCursos[codigo]?.aprobado)) return false;

    // Un correquisito puede matricularse en el mismo bloque. Para que la
    // sugerencia sea viable, sus propios requisitos previos sí deben cumplirse.
    const correquisitos = Array.isArray(curso.correquisitos) ? curso.correquisitos : [];
    return correquisitos.every(codigo => {
        if (estadoCursos[codigo]?.aprobado) return true;

        const cursoRelacionado = obtenerCursoPorCodigo(codigo)?.curso;
        if (!cursoRelacionado) return false;

        const previos = Array.isArray(cursoRelacionado.requisitos) ? cursoRelacionado.requisitos : [];
        return previos.every(requisito => estadoCursos[requisito]?.aprobado);
    });
}

function fechaValida(fecha) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false;

    const fechaConvertida = new Date(`${fecha}T00:00:00`);
    if (Number.isNaN(fechaConvertida.getTime())) return false;

    const [anio, mes, dia] = fecha.split('-').map(Number);
    return fechaConvertida.getFullYear() === anio &&
        fechaConvertida.getMonth() + 1 === mes &&
        fechaConvertida.getDate() === dia;
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
    const fotos = $('tcu-fotos');
    const btn = $('btn-guardar-tcu');

    if (fecha) fecha.value = '';
    if (horas) horas.value = '';
    if (actividad) actividad.value = '';
    if (fotos) fotos.value = '';

    editandoTCUIndex = -1;
    if (typeof entradaTCUEnEdicion !== 'undefined') entradaTCUEnEdicion = null;

    if (btn) {
        btn.textContent = 'Añadir';
        btn.style.backgroundColor = '';
    }
}

// --- Notificaciones sutiles (Toasts) ---
function mostrarToast(mensaje) {
    // Evitar que se acumulen muchos mensajes si le das clic rápido
    const toastsPrevios = document.querySelectorAll('.toast-notificacion');
    toastsPrevios.forEach(t => t.remove());

    // Crear la burbuja
    const toast = document.createElement('div');
    toast.className = 'toast-notificacion';
    toast.textContent = mensaje;

    // Agregarlo a la pantalla
    document.body.appendChild(toast);

    // Ocultarlo y borrarlo después de 3 segundos
    setTimeout(() => {
        toast.classList.add('oculto');
        setTimeout(() => toast.remove(), 300); // 300ms es lo que dura la animación de salida
    }, 3000);
}
