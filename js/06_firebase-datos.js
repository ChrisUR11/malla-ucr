// --- Variables Globales ---
let nombreTCU = '';
let temaOscuro = false;
const colasGuardadoPorUsuario = new Map();
let datosCuentaCargados = false;
let guardandoTema = false;

// --- Firebase ---
async function guardarDatosEnFirebase(datosParaGuardar = null) {
    if (!usuarioActual) {
        mostrarModalLogin();
        return false;
    }

    if (!datosCuentaCargados) {
        mostrarAviso('Datos no cargados', 'Espera a que termine de cargarse tu cuenta antes de guardar cambios.');
        return false;
    }

    const uid = usuarioActual.uid;
    const fuente = datosParaGuardar || {
            mallaSeleccionada,
            estadoCursos,
            bitacoraTCU,
            nombreTCU,
            temaOscuro
    };
    try {
        const datos = {
            ...fuente,
            actualizadoEn: firebase.firestore.FieldValue.serverTimestamp()
        };
        if ('estadoCursos' in fuente) {
            datos.estadoCursos = JSON.parse(JSON.stringify(fuente.estadoCursos));
        }
        if ('bitacoraTCU' in fuente) {
            datos.bitacoraTCU = JSON.parse(JSON.stringify(fuente.bitacoraTCU));
        }

        // mergeFields reemplaza los mapas completos indicados. Con merge:true,
        // quitar una nota de estadoCursos deja su campo anterior en Firestore.
        const colaAnterior = colasGuardadoPorUsuario.get(uid) || Promise.resolve();
        const operacion = colaAnterior.then(() => db.collection('usuarios').doc(uid).set(datos, {
            mergeFields: Object.keys(datos)
        }));
        const colaSiguiente = operacion.catch(() => {});
        colasGuardadoPorUsuario.set(uid, colaSiguiente);
        colaSiguiente.then(() => {
            if (colasGuardadoPorUsuario.get(uid) === colaSiguiente) {
                colasGuardadoPorUsuario.delete(uid);
            }
        });
        await operacion;

        return true;
    } catch (error) {
        console.error('Error guardando en Firebase:', error);
        mostrarAviso('Error al guardar', 'No se pudieron guardar los datos en Firebase.');
        return false;
    }
}

async function cargarDatosDesdeFirebase(user, sesionVigente = () => usuarioActual?.uid === user.uid) {
    try {
        const documento = await db.collection('usuarios').doc(user.uid).get();
        if (!sesionVigente()) return false;

        if (documento.exists) {
            const datos = documento.data();

            nombreTCU = typeof datos.nombreTCU === 'string' ? datos.nombreTCU : '';
            temaOscuro = datos.temaOscuro === true;

            // Se aplica el modo oscuro de inmediato si estaba guardado
            aplicarTemaVisual();

            if (!datos.mallaSeleccionada) {
                const temaGuardado = temaOscuro;
                reiniciarEstadoLocal();
                temaOscuro = temaGuardado;
                aplicarTemaVisual();
                return true;
            }

            if (!window.mallasDisponibles?.[datos.mallaSeleccionada]) {
                console.error('La malla guardada no está disponible:', datos.mallaSeleccionada);
                reiniciarEstadoLocal({ mostrarSeleccion: false });
                return false;
            }

            const mallaCargada = cargarMallaPorId(datos.mallaSeleccionada);

            if (!mallaCargada) {
                reiniciarEstadoLocal({ mostrarSeleccion: false });
                return false;
            }

            estadoCursos = datos.estadoCursos && typeof datos.estadoCursos === 'object' &&
                !Array.isArray(datos.estadoCursos) ? datos.estadoCursos : {};
            bitacoraTCU = Array.isArray(datos.bitacoraTCU) ? datos.bitacoraTCU : [];

            // --- NUEVO: Sincronizar apenas se descargan los datos para asegurar coherencia ---
            if (typeof sincronizarOptativas === 'function') {
                sincronizarOptativas();
            }

            ocultarModalSeleccionMalla();
            renderMalla();
            return true;
        } else {
            reiniciarEstadoLocal();
            return true;
        }
    } catch (error) {
        if (!sesionVigente()) return false;
        console.error('Error cargando desde Firebase:', error);
        reiniciarEstadoLocal({ mostrarSeleccion: false });
        return false;
    }
}

function reiniciarEstadoLocal({ mostrarSeleccion = true } = {}) {
    datosCuentaCargados = false;
    document.title = 'Malla Interactiva';
    const subtitulo = document.querySelector('.header-title p');
    if (subtitulo) subtitulo.textContent = 'Selecciona tu malla curricular';

    mallaSeleccionada = null;
    mallaActual = [];
    mallaSecciones = [];
    datosMallaActual = null;
    seccionActivaMalla = 'carrera';
    totalCreditosCarrera = 0;
    estadoCursos = {};
    bitacoraTCU = [];
    nombreTCU = '';
    temaOscuro = false;
    editandoTCUIndex = -1;

    if (typeof reiniciarEstadoMotivacion === 'function') {
        reiniciarEstadoMotivacion();
    }

    aplicarTemaVisual();
    renderMalla();
    if (mostrarSeleccion) {
        mostrarModalSeleccionMalla();
    } else {
        ocultarModalSeleccionMalla();
    }
}

// --- Lógica del Modo Oscuro ---
async function toggleTemaOscuro() {
    if (!requiereSesion()) return;
    if (guardandoTema) return;

    const uid = usuarioActual.uid;
    const versionInicial = versionSesion;
    const temaAnterior = temaOscuro;
    guardandoTema = true;
    temaOscuro = !temaOscuro;
    aplicarTemaVisual();

    try {
        if (!await guardarDatosEnFirebase({ temaOscuro }) &&
            usuarioActual?.uid === uid && versionSesion === versionInicial) {
            temaOscuro = temaAnterior;
            aplicarTemaVisual();
        }
    } finally {
        if (versionSesion === versionInicial) guardandoTema = false;
    }
}

function aplicarTemaVisual() {
    const btn = document.getElementById('btn-modo-oscuro');
    if (temaOscuro) {
        document.documentElement.setAttribute('data-bs-theme', 'dark');
        if (btn) btn.textContent = 'Activar Modo Claro';
    } else {
        document.documentElement.removeAttribute('data-bs-theme');
        if (btn) btn.textContent = 'Activar Modo Oscuro';
    }
}
