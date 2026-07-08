// --- Eventos generales ---
function configurarEventosGenerales() {
    const modalNota = $('modal-nota');
    const modalResumen = $('modal-resumen');
    const modalPromedio = $('modal-promedio');
    const modalTCU = $('modal-tcu');
    const modalSeleccionMalla = $('modal-seleccionar-malla');
    const btnLogin = $('btn-login');
    const btnLoginModal = $('btn-login-modal');
    const btnLogout = $('btn-logout');
    const btnMenu = $('btn-menu');
    const btnCambiarMalla = $('btn-cambiar-malla');
    const inputNota = $('input-nota-modal');
    const btnGuardarMalla = $('btn-guardar-malla');

    if (modalNota) {
        modalNota.addEventListener('click', function (e) {
            if (e.target === this) cerrarModal();
        });
    }

    if (modalResumen) {
        modalResumen.addEventListener('click', function (e) {
            if (e.target === this) cerrarModalResumen();
        });
    }

    if (modalPromedio) {
        modalPromedio.addEventListener('click', function (e) {
            if (e.target === this) cerrarModalPromedio();
        });
    }

    if (modalTCU) {
        modalTCU.addEventListener('click', function (e) {
            if (e.target === this) cerrarModalTCU();
        });
    }

    if (modalSeleccionMalla) {
        modalSeleccionMalla.addEventListener('click', function (e) {
            if (e.target === this) {
                mostrarAviso('Malla requerida', 'Debes seleccionar una malla para continuar.');
            }
        });
    }

    document.addEventListener('click', function (e) {
        const menuWrapper = $('menu-wrapper');

        if (menuWrapper && !menuWrapper.contains(e.target)) {
            cerrarMenuUsuario();
        }
    });

    if (btnLogin) btnLogin.addEventListener('click', iniciarSesionGoogle);
    if (btnLoginModal) btnLoginModal.addEventListener('click', iniciarSesionGoogle);

    if (btnLogout) {
        btnLogout.addEventListener('click', function () {
            cerrarMenuUsuario();
            cerrarSesionGoogle();
        });
    }

    if (btnMenu) {
        btnMenu.addEventListener('click', function (e) {
            e.stopPropagation();
            alternarMenuUsuario();
        });
    }

    if (btnCambiarMalla) {
        btnCambiarMalla.addEventListener('click', function () {
            cerrarMenuUsuario();
            abrirCambioMallaDesdeMenu();
        });
    }

    if (inputNota) {
        inputNota.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                guardarNotaModal();
            }
        });
    }

    if (btnGuardarMalla) {
        btnGuardarMalla.addEventListener('click', guardarMallaSeleccionada);
    }
}

