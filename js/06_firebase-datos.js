// --- Variables Globales ---
let nombreTCU = '';
let temaOscuro = false;

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
            nombreTCU,
            temaOscuro, // Guardamos la preferencia visual
            actualizadoEn: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        return true;
    } catch (error) {
        console.error('Error guardando en Firebase:', error);
        mostrarAviso('Error al guardar', 'No se pudieron guardar los datos en Firebase.');
        return false;
    }
}

async function cargarDatosDesdeFirebase(user) {
    try {
        const documento = await db.collection('usuarios').doc(user.uid).get();

        if (documento.exists) {
            const datos = documento.data();

            nombreTCU = datos.nombreTCU || '';
            temaOscuro = datos.temaOscuro || false;

            // Se aplica el modo oscuro de inmediato si estaba guardado
            aplicarTemaVisual();

            if (!datos.mallaSeleccionada) {
                reiniciarEstadoLocal();
                return;
            }

            const mallaCargada = cargarMallaPorId(datos.mallaSeleccionada);

            if (!mallaCargada) {
                reiniciarEstadoLocal();
                return;
            }

            estadoCursos = datos.estadoCursos || {};
            bitacoraTCU = Array.isArray(datos.bitacoraTCU) ? datos.bitacoraTCU : [];

            ocultarModalSeleccionMalla();
            renderMalla();
        } else {
            reiniciarEstadoLocal();
        }
    } catch (error) {
        console.error('Error cargando desde Firebase:', error);
        mostrarAviso('Error al cargar', 'No se pudieron cargar los datos desde Firebase.');
        renderMalla();
    }
}

function reiniciarEstadoLocal() {
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

    aplicarTemaVisual();
    renderMalla();
    mostrarModalSeleccionMalla();
}

// --- Lógica del Modo Oscuro ---
async function toggleTemaOscuro() {
    temaOscuro = !temaOscuro;
    aplicarTemaVisual();
    await guardarDatosEnFirebase();
}

function aplicarTemaVisual() {
    const btn = document.getElementById('btn-modo-oscuro');
    if (temaOscuro) {
        document.documentElement.setAttribute('data-bs-theme', 'dark');
        if (btn) btn.innerHTML = 'Activar Modo Claro';
    } else {
        document.documentElement.removeAttribute('data-bs-theme');
        if (btn) btn.innerHTML = 'Activar Modo Oscuro';
    }
}