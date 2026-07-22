// --- Variables Globales Nuevas ---
let nombreTCU = '';

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
            nombreTCU, // Se guarda el nombre del proyecto
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

            // Cargar la variable nueva
            nombreTCU = datos.nombreTCU || '';

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

    renderMalla();
    mostrarModalSeleccionMalla();
}