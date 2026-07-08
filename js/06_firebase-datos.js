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
        mostrarAviso('Error al guardar', 'No se pudieron guardar los datos en Firebase. Revisa la conexión o las reglas de Firestore.');
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
                mallaSecciones = [];
                datosMallaActual = null;
                seccionActivaMalla = 'carrera';
                totalCreditosCarrera = 0;
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
                mallaSecciones = [];
                datosMallaActual = null;
                seccionActivaMalla = 'carrera';
                totalCreditosCarrera = 0;
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
            mallaSecciones = [];
            datosMallaActual = null;
            seccionActivaMalla = 'carrera';
            totalCreditosCarrera = 0;
            estadoCursos = {};
            bitacoraTCU = [];

            renderMalla();
            mostrarModalSeleccionMalla();
        }
    } catch (error) {
        console.error('Error cargando desde Firebase:', error);
        mostrarAviso('Error al cargar', 'No se pudieron cargar los datos desde Firebase.');
        renderMalla();
    }
}

