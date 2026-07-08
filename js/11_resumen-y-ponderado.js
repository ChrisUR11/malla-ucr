// --- Modal de resumen académico ---
function abrirModalResumen() {
    if (!requiereSesion()) return;

    if (!mallaSeleccionada) {
        mostrarModalSeleccionMalla();
        return;
    }

    const resumen = calcularResumenProgreso();

    registrarEvento('abrir_resumen_academico', {
        creditos_aprobados: resumen.creditosAprobados,
        creditos_faltantes: resumen.creditosFaltantes,
        rango_avance: obtenerRangoAvance(resumen.porcentajeAvance)
    });

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

    const modal = $('modal-promedio');
    const mensajeEl = $('mensaje-promedio');
    const cicloEl = $('modal-promedio-ciclo');
    const tituloModal = document.querySelector('#modal-promedio .modal-header h3');

    if (!modal || !mensajeEl || !cicloEl) return;

    cicloEl.textContent = cicloActual;

    if (tituloModal) {
        tituloModal.innerHTML = `Ponderado del ciclo <span id="modal-promedio-ciclo">${cicloActual}</span>`;
    }

    const bloqueActual = mallaActual.find(b => b.ciclo === cicloActual);

    if (!bloqueActual) return;

    const datosPonderado = calcularPonderadoBloque(bloqueActual);
    const ponderadoTexto = formatearPonderado(datosPonderado.ponderado);

    registrarEvento('abrir_ponderado_ciclo', {
        ciclo: cicloActual,
        ponderado_ciclo: datosPonderado.ponderado === null ? 'sin_notas' : Number(datosPonderado.ponderado.toFixed(2)),
        cursos_con_nota: datosPonderado.cursosConNota,
        creditos_con_nota: datosPonderado.sumaCreditosConNota
    });

    if (datosPonderado.ponderado === null) {
        mensajeEl.innerHTML = `
            <strong>Aún no hay notas registradas en este ciclo.</strong>
            <br><br>
            Marca los cursos como aprobados y luego agrega sus notas para calcular el ponderado del ciclo.
        `;

        mostrarModal('modal-promedio');
        return;
    }

    mensajeEl.innerHTML = `
        El ponderado actual del <strong>Ciclo ${cicloActual}</strong> es:
        <br>
        <span style="font-size: 2.5rem; color: #1976d2; font-weight: bold; display: block; margin: 15px 0;">
            ${ponderadoTexto}
        </span>

        <div style="font-size:0.9rem; color:#546e7a; line-height:1.5;">
            Cursos aprobados con nota: <strong>${datosPonderado.cursosConNota}</strong> 
            de <strong>${datosPonderado.totalCursosConCredito}</strong>
            <br>
            Créditos tomados en cuenta: <strong>${datosPonderado.sumaCreditosConNota}</strong>
        </div>

        <br>

        <em style="font-size:0.85rem; color:#546e7a;">
            Este cálculo se actualiza con las notas registradas en este mismo ciclo.
        </em>
    `;

    mostrarModal('modal-promedio');
}

function cerrarModalPromedio() {
    cerrarModalPorId('modal-promedio');
}

