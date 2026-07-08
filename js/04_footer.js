// --- Footer automático ---
function agregarEstilosFooter() {
    if ($('footer-auto-style')) return;

    const style = document.createElement('style');
    style.id = 'footer-auto-style';
    style.textContent = `
        .app-footer {
            margin-top: 28px;
            padding: 16px;
            text-align: center;
            background: rgba(255, 255, 255, 0.85);
            border: 1px solid #cfd8dc;
            border-radius: 14px;
            color: #455a64;
            font-size: 0.9rem;
            box-shadow: 0 4px 10px rgba(15, 23, 42, 0.08);
        }

        .app-footer p {
            margin: 4px 0;
        }

        .footer-small {
            font-size: 0.78rem;
            color: #78909c;
        }
    `;

    document.head.appendChild(style);
}

function crearFooterCopyright() {
    if (document.querySelector('.app-footer')) return;

    agregarEstilosFooter();

    const wrapper = document.querySelector('.app-wrapper') || document.body;
    const footer = document.createElement('footer');
    const anioActual = new Date().getFullYear();

    footer.className = 'app-footer';

    const copyright = document.createElement('p');
    copyright.textContent = `© ${anioActual} Malla Interactiva UCR. Todos los derechos reservados.`;

    const descripcion = document.createElement('p');
    descripcion.className = 'footer-small';
    descripcion.textContent = 'Proyecto académico con autenticación de Google, Firebase Auth, Firestore y Analytics.';

    footer.appendChild(copyright);
    footer.appendChild(descripcion);
    wrapper.appendChild(footer);
}

