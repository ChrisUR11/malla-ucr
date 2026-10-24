// --- js/22_motivacion.js ---

let estadoMotivacion = {
    porcentaje: null,
    ciclos: null,
    tcu: null
};

function reiniciarEstadoMotivacion() {
    estadoMotivacion = {
        porcentaje: null,
        ciclos: null,
        tcu: null
    };
}

function verificarLogros(resumen, resumenCiclos) {
    const esSeccionCarrera = obtenerSeccionActiva()?.id === obtenerSeccionCarrera()?.id;

    // Si es la primera vez que carga (al iniciar sesión), solo guarda cómo está todo en secreto
    if (estadoMotivacion.porcentaje === null) {
        estadoMotivacion.porcentaje = resumen.porcentajeAvance;
        if (esSeccionCarrera) {
            estadoMotivacion.ciclos = resumenCiclos.map(c => c.creditosAprobados === c.totalCreditos && c.totalCreditos > 0);
        }
        return;
    }

    // 1. Mitad de carrera
    if (estadoMotivacion.porcentaje < 50 && resumen.porcentajeAvance >= 50) {
        mostrarToast('¡Mitad de la carrera! Ya pasaste la curva más difícil, ¡sigue así!');
    }

    // 2. Final de carrera
    if (estadoMotivacion.porcentaje < 100 && resumen.porcentajeAvance >= 100) {
        mostrarToast('¡Increíble! Has completado el 100% de la malla curricular.');
    }

    // Los catálogos optativos muestran otros bloques; sus índices no
    // corresponden a los ciclos de la carrera.
    if (!esSeccionCarrera) {
        estadoMotivacion.porcentaje = resumen.porcentajeAvance;
        return;
    }

    if (!Array.isArray(estadoMotivacion.ciclos)) {
        estadoMotivacion.ciclos = resumenCiclos.map(c => c.creditosAprobados === c.totalCreditos && c.totalCreditos > 0);
        estadoMotivacion.porcentaje = resumen.porcentajeAvance;
        return;
    }

    // 3. Ciclos completados
    resumenCiclos.forEach((ciclo, index) => {
        const completadoAhora = (ciclo.creditosAprobados === ciclo.totalCreditos && ciclo.totalCreditos > 0);
        const completadoAntes = estadoMotivacion.ciclos[index];

        if (!completadoAntes && completadoAhora) {
            const nombreCiclo = typeof ciclo.ciclo === 'number' ? `Ciclo ${ciclo.ciclo}` : ciclo.ciclo;
            mostrarToast(`¡Excelente! Completaste todas las materias del ${nombreCiclo}.`);
        }

        // Actualizamos la memoria
        estadoMotivacion.ciclos[index] = completadoAhora;
    });

    estadoMotivacion.porcentaje = resumen.porcentajeAvance;
}

function verificarLogroTCU(horasActuales) {
    if (estadoMotivacion.tcu === null) {
        estadoMotivacion.tcu = horasActuales;
        return;
    }

    if (estadoMotivacion.tcu < 300 && horasActuales >= 300) {
        mostrarToast('¡Misión cumplida! Has completado las 300 horas del TCU.');
    }

    estadoMotivacion.tcu = horasActuales;
}
