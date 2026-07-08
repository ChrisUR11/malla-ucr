// --- Movimiento de página: subir, bajar y progreso de scroll ---

(function configurarMovimientoPagina() {
    if (window.__movimientoPaginaConfigurado) return;
    window.__movimientoPaginaConfigurado = true;

    function crearBotonMovimiento(id, texto, titulo, onClick) {
        const boton = document.createElement('button');

        boton.id = id;
        boton.type = 'button';
        boton.className = 'btn-movimiento';
        boton.textContent = texto;
        boton.title = titulo;
        boton.setAttribute('aria-label', titulo);
        boton.addEventListener('click', onClick);

        return boton;
    }

    function crearControlesMovimiento() {
        if ($('controles-movimiento')) return;

        const barraProgreso = document.createElement('div');
        barraProgreso.id = 'barra-progreso-scroll';
        barraProgreso.className = 'barra-progreso-scroll';

        const contenedor = document.createElement('div');
        contenedor.id = 'controles-movimiento';
        contenedor.className = 'controles-movimiento';

        const btnSubir = crearBotonMovimiento(
            'btn-subir-pagina',
            'Subir',
            'Subir al inicio de la página',
            subirAlInicio
        );

        const btnBajar = crearBotonMovimiento(
            'btn-bajar-pagina',
            'Bajar',
            'Bajar al final de la página',
            bajarAlFinal
        );

        contenedor.appendChild(btnSubir);
        contenedor.appendChild(btnBajar);

        document.body.appendChild(barraProgreso);
        document.body.appendChild(contenedor);

        actualizarControlesMovimiento();
    }

    function obtenerDatosScroll() {
        const documento = document.documentElement;
        const scrollTop = window.scrollY || documento.scrollTop || 0;
        const altoVentana = window.innerHeight || documento.clientHeight || 0;
        const altoDocumento = Math.max(
            documento.scrollHeight,
            document.body.scrollHeight,
            documento.offsetHeight,
            document.body.offsetHeight
        );

        const espacioScrollable = Math.max(altoDocumento - altoVentana, 1);
        const porcentaje = Math.min((scrollTop / espacioScrollable) * 100, 100);
        const estaArriba = scrollTop < 250;
        const estaAbajo = scrollTop + altoVentana >= altoDocumento - 250;
        const paginaTieneScroll = altoDocumento > altoVentana + 300;

        return {
            scrollTop,
            altoVentana,
            altoDocumento,
            porcentaje,
            estaArriba,
            estaAbajo,
            paginaTieneScroll
        };
    }

    function actualizarControlesMovimiento() {
        const datos = obtenerDatosScroll();

        const btnSubir = $('btn-subir-pagina');
        const btnBajar = $('btn-bajar-pagina');
        const barraProgreso = $('barra-progreso-scroll');

        if (barraProgreso) {
            barraProgreso.style.width = `${datos.porcentaje}%`;
            barraProgreso.classList.toggle('barra-visible', datos.paginaTieneScroll && !datos.estaArriba);
        }

        if (btnSubir) {
            btnSubir.classList.toggle('visible', datos.paginaTieneScroll && !datos.estaArriba);
        }

        if (btnBajar) {
            btnBajar.classList.toggle('visible', datos.paginaTieneScroll && !datos.estaAbajo);
        }
    }

    function subirAlInicio() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });

        if (typeof registrarEvento === 'function') {
            registrarEvento('movimiento_subir_inicio');
        }
    }

    function bajarAlFinal() {
        const altoDocumento = document.documentElement.scrollHeight || document.body.scrollHeight;

        window.scrollTo({
            top: altoDocumento,
            behavior: 'smooth'
        });

        if (typeof registrarEvento === 'function') {
            registrarEvento('movimiento_bajar_final');
        }
    }

    function iniciarMovimientoPagina() {
        crearControlesMovimiento();

        window.addEventListener('scroll', actualizarControlesMovimiento, { passive: true });
        window.addEventListener('resize', actualizarControlesMovimiento);

        setTimeout(actualizarControlesMovimiento, 300);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', iniciarMovimientoPagina);
    } else {
        iniciarMovimientoPagina();
    }
})();