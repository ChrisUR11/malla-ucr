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

// --- Exportar resumen como imagen ---
async function exportarResumenImagen() {
    const areaAExportar = $('area-resumen-exportar');
    const boton = $('btn-exportar-resumen');

    if (!areaAExportar || !boton) return;
    if (typeof html2canvas !== 'function') {
        await mostrarAviso('Error', 'No se pudo cargar la herramienta para crear la imagen.');
        return;
    }

    const textoOriginal = boton.textContent;
    boton.textContent = 'Generando imagen...';
    boton.disabled = true;

    try {
        const canvas = await html2canvas(areaAExportar, {
            backgroundColor: document.documentElement.getAttribute('data-bs-theme') === 'dark' ? '#1e1e1e' : '#ffffff',
            scale: 2
        });

        const enlace = document.createElement('a');
        enlace.download = 'Resumen_Academico_MallasUCR.png';
        enlace.href = canvas.toDataURL('image/png');
        enlace.click();
    } catch (error) {
        console.error('Error al generar la imagen:', error);
        await mostrarAviso('Error', 'Hubo un problema al generar la imagen. Intenta de nuevo.');
    } finally {
        boton.textContent = textoOriginal;
        boton.disabled = false;
    }
}
