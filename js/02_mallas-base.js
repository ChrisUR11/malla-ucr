// --- Cargar malla por ID ---
function cargarMallaPorId(idMalla) {
    const datosMalla = window.mallasDisponibles?.[idMalla];

    if (!datosMalla) {
        mostrarAviso(
            'Malla no encontrada',
            'No se encontró la malla seleccionada. Verifica que el archivo de esa malla esté cargado.'
        );
        return false;
    }

    datosMallaActual = datosMalla;
    mallaSeleccionada = datosMalla.id;
    mallaSecciones = normalizarSeccionesMalla(datosMalla);
    seccionActivaMalla = 'carrera';

    const seccionCarrera = obtenerSeccionCarrera();
    mallaActual = Array.isArray(seccionCarrera?.ciclos) ? seccionCarrera.ciclos : [];

    totalCreditosCarrera = Number(datosMalla.totalCreditos) || calcularTotalCreditosSecciones(obtenerSeccionesProgreso());

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

    renderTabsMalla();
    renderInfoLicenciatura();

    return true;
}

function normalizarSeccionesMalla(datosMalla) {
    const secciones = [];

    if (Array.isArray(datosMalla.secciones) && datosMalla.secciones.length > 0) {
        datosMalla.secciones.forEach((seccion, index) => {
            secciones.push({
                id: seccion.id || (index === 0 ? 'carrera' : `seccion-${index}`),
                titulo: seccion.titulo || (index === 0 ? 'Malla de carrera' : `Sección ${index + 1}`),
                descripcion: seccion.descripcion || '',
                ciclos: Array.isArray(seccion.ciclos) ? seccion.ciclos : [],
                cuentaEnProgreso: seccion.cuentaEnProgreso !== false,
                mostrarPromedio: seccion.mostrarPromedio !== false && (seccion.id === 'carrera' || index === 0)
            });
        });
    } else {
        secciones.push({
            id: 'carrera',
            titulo: 'Malla de carrera',
            descripcion: 'Cursos principales de la carrera.',
            ciclos: Array.isArray(datosMalla.ciclos) ? datosMalla.ciclos : [],
            cuentaEnProgreso: true,
            mostrarPromedio: true
        });
    }

    if (Array.isArray(datosMalla.seccionesExtra)) {
        datosMalla.seccionesExtra.forEach((seccion, index) => {
            secciones.push({
                id: seccion.id || `extra-${index + 1}`,
                titulo: seccion.titulo || `Sección adicional ${index + 1}`,
                descripcion: seccion.descripcion || '',
                ciclos: Array.isArray(seccion.ciclos) ? seccion.ciclos : [],
                cuentaEnProgreso: seccion.cuentaEnProgreso !== false,
                mostrarPromedio: seccion.mostrarPromedio === true
            });
        });
    }

    return secciones;
}

function obtenerSeccionCarrera() {
    return mallaSecciones.find(seccion => seccion.id === 'carrera') || mallaSecciones[0] || null;
}

function obtenerSeccionActiva() {
    return mallaSecciones.find(seccion => seccion.id === seccionActivaMalla) || obtenerSeccionCarrera();
}

function obtenerSeccionesProgreso() {
    return mallaSecciones.filter(seccion => seccion.cuentaEnProgreso !== false);
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

function calcularTotalCreditosSecciones(secciones) {
    if (!Array.isArray(secciones)) return 0;

    const codigosContados = new Set();

    return secciones.reduce((total, seccion) => {
        const ciclos = Array.isArray(seccion.ciclos) ? seccion.ciclos : [];

        return total + ciclos.reduce((totalCiclo, bloque) => {
            const cursos = Array.isArray(bloque.cursos) ? bloque.cursos : [];

            return totalCiclo + cursos.reduce((subtotal, curso) => {
                if (!curso?.codigo || codigosContados.has(curso.codigo)) return subtotal;

                codigosContados.add(curso.codigo);

                const creditos = Number(curso.creditos);
                return subtotal + (Number.isFinite(creditos) ? creditos : 0);
            }, 0);
        }, 0);
    }, 0);
}

