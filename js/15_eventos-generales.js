// --- Eventos generales ---
function configurarEventosGenerales() {
    const modalNota = $('modal-nota');
    const modalResumen = $('modal-resumen');
    const modalTCU = $('modal-tcu');
    const modalSeleccionMalla = $('modal-seleccionar-malla');
    const btnLogin = $('btn-login');
    const btnLoginModal = $('btn-login-modal');
    const btnLogout = $('btn-logout');
    const btnMenu = $('btn-menu');
    const btnCambiarMalla = $('btn-cambiar-malla');
    const btnRestablecerDatos = $('btn-restablecer-datos');
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

    if (btnRestablecerDatos) {
        btnRestablecerDatos.addEventListener('click', function () {
            cerrarMenuUsuario();
            restablecerMisDatos();
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

    document.addEventListener('keydown', gestionarTecladoModales);
}

function obtenerModalVisibleSuperior() {
    return Array.from(document.querySelectorAll('.modal-overlay'))
        .filter(modal => getComputedStyle(modal).display !== 'none')
        .sort((a, b) => (Number.parseInt(getComputedStyle(a).zIndex, 10) || 0)
            - (Number.parseInt(getComputedStyle(b).zIndex, 10) || 0))
        .at(-1) || null;
}

function gestionarTecladoModales(evento) {
    if (evento.key !== 'Escape' && evento.key !== 'Tab') return;

    const modal = obtenerModalVisibleSuperior();
    if (!modal) return;

    if (evento.key === 'Escape') {
        const accionesCerrar = {
            'modal-nota': cerrarModal,
            'modal-calculadora-promedio': cerrarModalCalculadoraPromedio,
            'modal-proximos-cursos': cerrarModalProximosCursos,
            'modal-resumen': cerrarModalResumen,
            'modal-tcu': cerrarModalTCU
        };

        if (modal.id === 'modal-mensaje') {
            evento.preventDefault();
            const cancelar = $('modal-mensaje-cancelar');
            const aceptar = $('modal-mensaje-aceptar');
            (cancelar?.style.display !== 'none' ? cancelar : aceptar)?.click();
        } else if (accionesCerrar[modal.id]) {
            evento.preventDefault();
            accionesCerrar[modal.id]();
        }
        return;
    }

    const controles = Array.from(modal.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )).filter(control => control.getClientRects().length > 0 && getComputedStyle(control).visibility !== 'hidden');

    if (controles.length === 0) {
        evento.preventDefault();
        modal.tabIndex = -1;
        modal.focus();
        return;
    }

    const primero = controles[0];
    const ultimo = controles.at(-1);
    if (!modal.contains(document.activeElement)) {
        evento.preventDefault();
        (evento.shiftKey ? ultimo : primero).focus();
    } else if (evento.shiftKey && document.activeElement === primero) {
        evento.preventDefault();
        ultimo.focus();
    } else if (!evento.shiftKey && document.activeElement === ultimo) {
        evento.preventDefault();
        primero.focus();
    }
}

