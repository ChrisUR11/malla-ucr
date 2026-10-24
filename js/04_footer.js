// Mantiene actualizado el año del pie existente en index.html.
function crearFooterCopyright() {
    const copyright = document.querySelector('.app-footer p strong');
    if (copyright) {
        copyright.textContent = `© ${new Date().getFullYear()} Mallas Interactivas`;
    }
}

