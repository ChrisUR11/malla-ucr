// Este archivo solo contiene los datos de la malla.
// Guarda este archivo en: mallas/mallaDisenoGrafico.js
// Luego agrégalo en index.html antes de script.js:
// <script src="mallas/mallaDisenoGrafico.js"></script>

window.mallasDisponibles = window.mallasDisponibles || {};

window.mallasDisponibles.diseno_grafico = {
    id: 'diseno_grafico',
    nombre: 'Diseño Gráfico',
    subtitulo: 'Bachillerato y Licenciatura en Diseño Gráfico - UCR',
    totalCreditos: 172,
    licenciatura: {
        tiene: true,
        ubicacion: 'La licenciatura inicia a partir del Ciclo 9, después de completar el tramo de Bachillerato de los ciclos 1 al 8.',
        descripcion: 'El Bachillerato comprende los ciclos 1 al 8. La Licenciatura comprende los ciclos 9, 10 y 11.'
    },
    ciclos: [
        {
            ciclo: 1,
            cursos: [
                { codigo: 'AP6001', nombre: 'Diseño I', creditos: 4 },
                { codigo: 'AP6003', nombre: 'Dibujo I', creditos: 4 },
                { codigo: 'AP6005', nombre: 'Taller en Pigmentos', creditos: 1 },
                { codigo: 'AP6007', nombre: 'Taller en Arcilla', creditos: 1 },
                { codigo: 'EF-', nombre: 'Actividad Deportiva', creditos: 0 },
                { codigo: 'EG-', nombre: 'Curso de Arte', creditos: 2 },
                { codigo: 'EG-I', nombre: 'Curso Integrado de Humanidades I', creditos: 6 }
            ]
        },
        {
            ciclo: 2,
            cursos: [
                { codigo: 'AP6002', nombre: 'Diseño II', creditos: 4, requisitos: ['AP6001'] },
                { codigo: 'AP6004', nombre: 'Dibujo II', creditos: 4, requisitos: ['AP6003'] },
                { codigo: 'AP6006', nombre: 'Taller en Madera', creditos: 1 },
                { codigo: 'AP6008', nombre: 'Taller en Textiles y Papel', creditos: 1 },
                { codigo: 'AP6009', nombre: 'Teoría del Arte', creditos: 3 },
                { codigo: 'EG-II', nombre: 'Curso Integrado de Humanidades II', creditos: 6, requisitos: ['EG-I'] }
            ]
        },
        {
            ciclo: 3,
            cursos: [
                { codigo: 'AP6011', nombre: 'Diseño III', creditos: 4, requisitos: ['AP6002'] },
                { codigo: 'AP6013', nombre: 'Dibujo III', creditos: 4, requisitos: ['AP6004'] },
                { codigo: 'AP6015', nombre: 'Taller en Vidrio y Plástico', creditos: 1 },
                { codigo: 'AP6017', nombre: 'Taller en Metal', creditos: 1 },
                { codigo: 'AP6019', nombre: 'Introducción al Arte I', creditos: 3 },
                { codigo: 'AT1109', nombre: 'Introducción a la Antropología', creditos: 4 }
            ]
        },
        {
            ciclo: 4,
            cursos: [
                { codigo: 'AP6010', nombre: 'Semiosis de Producción', creditos: 2, requisitos: ['AP6009'] },
                { codigo: 'AP6012', nombre: 'Diseño IV', creditos: 4, requisitos: ['AP6011'] },
                { codigo: 'AP6014', nombre: 'Dibujo IV', creditos: 4, requisitos: ['AP6013'] },
                { codigo: 'AP6016', nombre: 'Taller en Iluminación', creditos: 1 },
                { codigo: 'AP6018', nombre: 'Taller en Piedra', creditos: 1 },
                { codigo: 'AP6020', nombre: 'Introducción al Arte II', creditos: 3, requisitos: ['AP6019'] },
                { codigo: 'RP-1', nombre: 'Repertorio', creditos: 3, tipo: 'Complementaria' }
            ]
        },
        {
            ciclo: 5,
            cursos: [
                { codigo: 'AP6084', nombre: 'Arte Costarricense', creditos: 3, requisitos: ['AP6020'] },
                { codigo: 'AP7101', nombre: 'Diseño Gráfico I', creditos: 2, requisitos: ['AP6012'], correquisitos: ['AP7102'] },
                { codigo: 'AP7102', nombre: 'Taller Gráfico I', creditos: 3, requisitos: ['AP6005', 'AP6014'] },
                { codigo: 'AP7103', nombre: 'Fotografía I', creditos: 3, requisitos: ['AP6012', 'AP6016'] },
                { codigo: 'AP7104', nombre: 'Medios Digitales I', creditos: 2 },
                { codigo: 'AP7105', nombre: 'Sistemas de Reproducción I', creditos: 1, requisitos: ['AP6008'] },
                { codigo: 'OPT783-C5', nombre: 'Cursos de Dibujo Optativos', creditos: 2, tipo: 'Optativa OPT783' },
                { codigo: 'OPT784-C5', nombre: 'Cursos de Taller Optativo', creditos: 2, tipo: 'Optativa OPT784' }
            ]
        },
        {
            ciclo: 6,
            cursos: [
                { codigo: 'AP6085', nombre: 'Historia del Diseño Gráfico', creditos: 3, requisitos: ['AP6020'] },
                { codigo: 'AP7106', nombre: 'Diseño Gráfico II', creditos: 2, requisitos: ['AP7101'] },
                { codigo: 'AP7107', nombre: 'Taller Gráfico II', creditos: 3, requisitos: ['AP7102'] },
                { codigo: 'AP7108', nombre: 'Fotografía II', creditos: 3, requisitos: ['AP7103'] },
                { codigo: 'AP7109', nombre: 'Medios Digitales II', creditos: 2, requisitos: ['AP7104'] },
                { codigo: 'AP7110', nombre: 'Sistemas de Reproducción II', creditos: 1, requisitos: ['AP7105'] },
                { codigo: 'OPT783-C6', nombre: 'Cursos de Dibujo Optativos', creditos: 2, tipo: 'Optativa OPT783' },
                { codigo: 'SR-I', nombre: 'Seminario de Realidad Nacional I', creditos: 2, requisitos: ['EG-II'] }
            ]
        },
        {
            ciclo: 7,
            cursos: [
                { codigo: 'AP7111', nombre: 'Diseño Gráfico III', creditos: 2, requisitos: ['AP7106'] },
                { codigo: 'AP7112', nombre: 'Taller Gráfico III', creditos: 3, requisitos: ['AP7107'] },
                { codigo: 'AP7113', nombre: 'Fotografía III', creditos: 3, requisitos: ['AP7108'] },
                { codigo: 'AP7114', nombre: 'Medios Digitales III', creditos: 2, requisitos: ['AP7109'] },
                { codigo: 'AP7115', nombre: 'Sistemas de Reproducción III', creditos: 1, requisitos: ['AP7110'] },
                { codigo: 'OPT1141-C7', nombre: 'Optativo de Idioma', creditos: 2, tipo: 'Optativa OPT1141' },
                { codigo: 'OPT783-C7', nombre: 'Cursos de Dibujo Optativos', creditos: 2, tipo: 'Optativa OPT783' },
                { codigo: 'OPT785-C7', nombre: 'Cursos de Historia del Arte', creditos: 3, tipo: 'Optativa OPT785' }
            ]
        },
        {
            ciclo: 8,
            cursos: [
                { codigo: 'AP7116', nombre: 'Diseño Interactivo', creditos: 7, requisitos: ['AP7111', 'AP7112'] },
                { codigo: 'OPT783-C8', nombre: 'Cursos de Dibujo Optativos', creditos: 2, tipo: 'Optativa OPT783' },
                { codigo: 'OPT784-C8', nombre: 'Cursos de Taller Optativo', creditos: 2, tipo: 'Optativa OPT784' },
                { codigo: 'OPT785-C8', nombre: 'Cursos de Historia del Arte', creditos: 3, tipo: 'Optativa OPT785' },
                { codigo: 'SR-II', nombre: 'Seminario de Realidad Nacional II', creditos: 2, requisitos: ['SR-I'] }
            ]
        },
        {
            ciclo: 9,
            titulo: 'Ciclo 9 - Licenciatura',
            cursos: [
                { codigo: 'AP8001', nombre: 'Taller Especializado I', creditos: 8, requisitos: ['AP7116'], tipo: 'Licenciatura' },
                { codigo: 'AP8003', nombre: 'Técnicas de Investigación', creditos: 2, tipo: 'Licenciatura' },
                { codigo: 'AP9600', nombre: 'Seminario de Graduación I', creditos: 0, tipo: 'Licenciatura' },
                { codigo: 'AP9800', nombre: 'Proyecto de Graduación I', creditos: 0, tipo: 'Licenciatura' },
                { codigo: 'OPT784-C9', nombre: 'Cursos de Taller Optativo', creditos: 6, tipo: 'Optativa OPT784 - Licenciatura' }
            ]
        },
        {
            ciclo: 10,
            titulo: 'Ciclo 10 - Licenciatura',
            cursos: [
                { codigo: 'AP8002', nombre: 'Taller Especializado II', creditos: 8, requisitos: ['AP8001'], tipo: 'Licenciatura' },
                { codigo: 'AP8004', nombre: 'Administración de las Artes', creditos: 2, tipo: 'Licenciatura' },
                { codigo: 'AP9601', nombre: 'Seminario de Graduación II', creditos: 0, tipo: 'Licenciatura' },
                { codigo: 'AP9801', nombre: 'Proyecto de Graduación II', creditos: 0, tipo: 'Licenciatura' },
                { codigo: 'OPT784-C10', nombre: 'Cursos de Taller Optativo', creditos: 4, tipo: 'Optativa OPT784 - Licenciatura' }
            ]
        },
        {
            ciclo: 11,
            titulo: 'Ciclo 11 - Licenciatura',
            cursos: [
                { codigo: 'AP9602', nombre: 'Seminario de Graduación III', creditos: 0, tipo: 'Licenciatura' },
                { codigo: 'AP9802', nombre: 'Proyecto de Graduación III', creditos: 0, tipo: 'Licenciatura' }
            ]
        }
    ],
    seccionesExtra: [
        {
            id: 'optativas-idioma',
            titulo: 'Optativas de idioma',
            descripcion: 'Catálogo del bloque OPT1141. No suma créditos al avance para evitar duplicar el bloque optativo de la malla principal.',
            cuentaEnProgreso: false,
            mostrarPromedio: false,
            ciclos: [
                {
                    ciclo: 'OPT1141',
                    titulo: 'OPT1141 - Optativo de idioma',
                    cursos: [
                        { codigo: 'LM1030', nombre: 'Estrategias de Lectura en Inglés I (para otras carreras)', creditos: 4, tipo: 'Opción de idioma' },
                        { codigo: 'LM1031', nombre: 'Inglés Intensivo I (Oral)', creditos: 4, tipo: 'Opción de idioma' },
                        { codigo: 'LM2003', nombre: 'Francés Básico I', creditos: 2, tipo: 'Opción de idioma' },
                        { codigo: 'LM2004', nombre: 'Francés Básico II', creditos: 2, requisitos: ['LM2003'], tipo: 'Opción de idioma' },
                        { codigo: 'LM2030', nombre: 'Comprensión de Lectura en Francés I', creditos: 4, tipo: 'Opción de idioma' },
                        { codigo: 'LM3001', nombre: 'Alemán Básico I', creditos: 2, tipo: 'Opción de idioma' },
                        { codigo: 'LM3002', nombre: 'Alemán Básico II', creditos: 2, requisitos: ['LM3001'], tipo: 'Opción de idioma' },
                        { codigo: 'LM3030', nombre: 'Alemán Intensivo I', creditos: 4, tipo: 'Opción de idioma' },
                        { codigo: 'LM4001', nombre: 'Italiano Básico I', creditos: 2, tipo: 'Opción de idioma' },
                        { codigo: 'LM4002', nombre: 'Italiano Básico II', creditos: 2, requisitos: ['LM4001'], tipo: 'Opción de idioma' },
                        { codigo: 'LM5001', nombre: 'Portugués Básico I', creditos: 2, tipo: 'Opción de idioma' },
                        { codigo: 'LM5002', nombre: 'Portugués Básico II', creditos: 2, requisitos: ['LM5001'], tipo: 'Opción de idioma' },
                        { codigo: 'LM5030', nombre: 'Portugués Intensivo I', creditos: 4, tipo: 'Opción de idioma' },
                        { codigo: 'LM6030', nombre: 'Chino Intensivo I', creditos: 4, tipo: 'Opción de idioma' },
                        { codigo: 'LM7030', nombre: 'Japonés Intensivo I', creditos: 4, tipo: 'Opción de idioma' },
                        { codigo: 'LM7037', nombre: 'Coreano Intensivo I', creditos: 4, tipo: 'Opción de idioma' },
                        { codigo: 'LM7038', nombre: 'Catalán Básico I', creditos: 2, tipo: 'Opción de idioma' },
                        { codigo: 'LM8001', nombre: 'Ruso Básico I', creditos: 2, tipo: 'Opción de idioma' },
                        { codigo: 'LM8002', nombre: 'Ruso Básico II', creditos: 2, requisitos: ['LM8001'], tipo: 'Opción de idioma' }
                    ]
                }
            ]
        },
        {
            id: 'optativas-dibujo',
            titulo: 'Optativas de dibujo',
            descripcion: 'Catálogo del bloque OPT783. En la malla principal se mantienen los espacios OPT783 por ciclo para que el avance sea correcto.',
            cuentaEnProgreso: false,
            mostrarPromedio: false,
            ciclos: [
                {
                    ciclo: 'OPT783',
                    titulo: 'OPT783 - Cursos de dibujo optativos',
                    cursos: [
                        { codigo: 'AP6021', nombre: 'Anatomía Animal', creditos: 2, requisitos: ['AP6014'], tipo: 'Opción de dibujo' },
                        { codigo: 'AP6022', nombre: 'Anatomías Humana y Animal Comparadas', creditos: 2, requisitos: ['AP6014'], tipo: 'Opción de dibujo' },
                        { codigo: 'AP6023', nombre: 'Dibujo Compositivo', creditos: 2, requisitos: ['AP6014'], tipo: 'Opción de dibujo' },
                        { codigo: 'AP6024', nombre: 'Dibujo Contemporáneo', creditos: 2, requisitos: ['AP6014'], tipo: 'Opción de dibujo' },
                        { codigo: 'AP6025', nombre: 'Dibujo Paisaje', creditos: 2, requisitos: ['AP6014'], tipo: 'Opción de dibujo' },
                        { codigo: 'AP6026', nombre: 'Dibujo Retrato', creditos: 2, requisitos: ['AP6014'], tipo: 'Opción de dibujo' },
                        { codigo: 'AP6027', nombre: 'Dibujo Subjetivo', creditos: 2, requisitos: ['AP6014'], tipo: 'Opción de dibujo' },
                        { codigo: 'AP6028', nombre: 'Dibujo de Representación Tridimensional I', creditos: 2, requisitos: ['AP6014'], tipo: 'Opción de dibujo' },
                        { codigo: 'AP6029', nombre: 'Dibujo de Representación Tridimensional II', creditos: 2, requisitos: ['AP6014'], tipo: 'Opción de dibujo' }
                    ]
                }
            ]
        },
        {
            id: 'optativas-taller',
            titulo: 'Optativas de taller',
            descripcion: 'Catálogo del bloque OPT784. No suma créditos al avance porque los créditos requeridos ya están representados en la malla principal.',
            cuentaEnProgreso: false,
            mostrarPromedio: false,
            ciclos: [
                {
                    ciclo: 'OPT784',
                    titulo: 'OPT784 - Cursos de taller optativo',
                    cursos: [
                        { codigo: 'AP1051', nombre: 'Técnicas de Ilustración y Modelado para la Ciencia', creditos: 2, tipo: 'Opción de taller' },
                        { codigo: 'AP1052', nombre: 'Introducción a los Medios Digitales', creditos: 2, tipo: 'Opción de taller' },
                        { codigo: 'AP6030', nombre: 'Introducción Metodológica al Proceso de Realización de un Cuadro', creditos: 2, requisitos: ['AP6014'], tipo: 'Opción de taller' },
                        { codigo: 'AP6031', nombre: 'La Estructura y el Objeto en la Pintura', creditos: 2, requisitos: ['AP6014'], tipo: 'Opción de taller' },
                        { codigo: 'AP6032', nombre: 'La Forma del Natural y su Interpretación Pictórica', creditos: 2, requisitos: ['AP6014'], tipo: 'Opción de taller' },
                        { codigo: 'AP6033', nombre: 'La Técnica como Significante de la Pintura', creditos: 2, requisitos: ['AP6014'], tipo: 'Opción de taller' },
                        { codigo: 'AP6034', nombre: 'Proyección en la Creación de la Iconografía Pictórica', creditos: 2, requisitos: ['AP6014'], tipo: 'Opción de taller' },
                        { codigo: 'AP6035', nombre: 'Bases de Promoción y Mercadeo en el Arte', creditos: 2, requisitos: ['AP6014'], tipo: 'Opción de taller' },
                        { codigo: 'AP6036', nombre: 'El Mito y el Símbolo en el Arte y la Ciencia', creditos: 2, requisitos: ['AP6014'], tipo: 'Opción de taller' },
                        { codigo: 'AP6037', nombre: 'Psicología de las Artes Plásticas', creditos: 2, requisitos: ['AP6014'], tipo: 'Opción de taller' },
                        { codigo: 'AP6038', nombre: 'Introducción al Arte por Ordenador', creditos: 2, requisitos: ['AP6014'], tipo: 'Opción de taller' },
                        { codigo: 'AP6039', nombre: 'La Instalación y el Arte Conceptual', creditos: 2, requisitos: ['AP6014'], tipo: 'Opción de taller' },
                        { codigo: 'AP6040', nombre: 'Taller Experimental de Pintura Acrílica', creditos: 2, requisitos: ['AP6014'], tipo: 'Opción de taller' },
                        { codigo: 'AP6041', nombre: 'Pintura con Técnicas Mixtas', creditos: 2, requisitos: ['AP6014'], tipo: 'Opción de taller' },
                        { codigo: 'AP6042', nombre: 'Mural', creditos: 2, requisitos: ['AP6014'], tipo: 'Opción de taller' },
                        { codigo: 'AP6043', nombre: 'Colografía', creditos: 2, requisitos: ['AP6014'], tipo: 'Opción de taller' },
                        { codigo: 'AP6044', nombre: 'Encuadernación Artística', creditos: 2, requisitos: ['AP6014'], tipo: 'Opción de taller' },
                        { codigo: 'AP6045', nombre: 'Estampado Textil', creditos: 2, requisitos: ['AP6014'], tipo: 'Opción de taller' },
                        { codigo: 'AP6046', nombre: 'Ex-Libris', creditos: 2, requisitos: ['AP6014'], tipo: 'Opción de taller' },
                        { codigo: 'AP6047', nombre: 'Papel Hecho a Mano I', creditos: 2, requisitos: ['AP6014'], tipo: 'Opción de taller' },
                        { codigo: 'AP6048', nombre: 'Papel Hecho a Mano II', creditos: 2, requisitos: ['AP6014'], tipo: 'Opción de taller' },
                        { codigo: 'AP6049', nombre: 'Papeles Hechos a Mano para Estampado Artístico', creditos: 2, requisitos: ['AP6014'], tipo: 'Opción de taller' },
                        { codigo: 'AP6050', nombre: 'Serigrafía I', creditos: 2, requisitos: ['AP6014'], tipo: 'Opción de taller' },
                        { codigo: 'AP6051', nombre: 'Serigrafía II', creditos: 2, requisitos: ['AP6014'], tipo: 'Opción de taller' },
                        { codigo: 'AP6052', nombre: 'Diseño Filatélico', creditos: 2, requisitos: ['AP6014'], tipo: 'Opción de taller' },
                        { codigo: 'AP6053', nombre: 'Diseño de Patrones I', creditos: 2, requisitos: ['AP6014'], tipo: 'Opción de taller' },
                        { codigo: 'AP6054', nombre: 'Diseño de Patrones II', creditos: 2, requisitos: ['AP6014'], tipo: 'Opción de taller' },
                        { codigo: 'AP6055', nombre: 'Diseño de Valores Fiduciarios', creditos: 2, requisitos: ['AP6014'], tipo: 'Opción de taller' },
                        { codigo: 'AP6056', nombre: 'Diseño Precolombino en América', creditos: 2, requisitos: ['AP6014'], tipo: 'Opción de taller' },
                        { codigo: 'AP6057', nombre: 'Diseño Precolombino y la Contemporaneidad', creditos: 2, requisitos: ['AP6014'], tipo: 'Opción de taller' },
                        { codigo: 'AP6058', nombre: 'Fotografía Experimental', creditos: 2, requisitos: ['AP6014'], tipo: 'Opción de taller' },
                        { codigo: 'AP6059', nombre: 'Introducción a la Fotografía en Blanco y Negro', creditos: 2, requisitos: ['AP6014'], tipo: 'Opción de taller' },
                        { codigo: 'AP6060', nombre: 'Introducción a la Fotografía en Color', creditos: 2, requisitos: ['AP6014'], tipo: 'Opción de taller' },
                        { codigo: 'AP6061', nombre: 'Técnicas Fotográficas', creditos: 2, requisitos: ['AP6014'], tipo: 'Opción de taller' },
                        { codigo: 'AP6062', nombre: 'Investigación en Publicidad', creditos: 2, requisitos: ['AP6014'], tipo: 'Opción de taller' },
                        { codigo: 'AP6063', nombre: 'Mercadotecnia para Publicidad I', creditos: 2, requisitos: ['AP6014'], tipo: 'Opción de taller' },
                        { codigo: 'AP6064', nombre: 'Mercadotecnia para Publicidad II', creditos: 2, requisitos: ['AP6014'], tipo: 'Opción de taller' },
                        { codigo: 'AP6065', nombre: 'Cerámica Precolombina', creditos: 2, requisitos: ['AP6014'], tipo: 'Opción de taller' },
                        { codigo: 'AP6066', nombre: 'Decoración de Engobes', creditos: 2, requisitos: ['AP6014'], tipo: 'Opción de taller' },
                        { codigo: 'AP6067', nombre: 'Decoración de Esmaltes y Pigmentos', creditos: 2, requisitos: ['AP6014'], tipo: 'Opción de taller' },
                        { codigo: 'AP6068', nombre: 'Decoración con Cuerda Seca', creditos: 2, requisitos: ['AP6014'], tipo: 'Opción de taller' },
                        { codigo: 'AP6069', nombre: 'Decoración en Mayólica', creditos: 2, requisitos: ['AP6014'], tipo: 'Opción de taller' },
                        { codigo: 'AP6070', nombre: 'Elaboración de Moldes en Yesos', creditos: 2, requisitos: ['AP6014'], tipo: 'Opción de taller' },
                        { codigo: 'AP6071', nombre: 'Técnicas Manuales para la Elaboración de Proyectos Cerámicos', creditos: 2, requisitos: ['AP6014'], tipo: 'Opción de taller' },
                        { codigo: 'AP6072', nombre: 'Torno I', creditos: 2, requisitos: ['AP6014'], tipo: 'Opción de taller' },
                        { codigo: 'AP6073', nombre: 'Torno II', creditos: 2, requisitos: ['AP6014'], tipo: 'Opción de taller' },
                        { codigo: 'AP1015', nombre: 'Fundición Artística', creditos: 2, requisitos: ['AP6012', 'AP6014'], tipo: 'Opción de taller' },
                        { codigo: 'AP1016', nombre: 'Modelado Tridimensional', creditos: 2, requisitos: ['AP6012', 'AP6014'], tipo: 'Opción de taller' },
                        { codigo: 'AP1017', nombre: 'Relieve Escultórico', creditos: 2, requisitos: ['AP6012', 'AP6014'], tipo: 'Opción de taller' },
                        { codigo: 'AP1018', nombre: 'Orfebrería', creditos: 2, requisitos: ['AP6012', 'AP6014'], tipo: 'Opción de taller' },
                        { codigo: 'AP1055', nombre: 'Acuarela en la Figura Humana y Animal', creditos: 2, requisitos: ['AP6012', 'AP6014'], tipo: 'Opción de taller' },
                        { codigo: 'AP1056', nombre: 'Acuarela en el Paisaje', creditos: 2, requisitos: ['AP6012', 'AP6014'], tipo: 'Opción de taller' },
                        { codigo: 'AP1057', nombre: 'Taller Experimental de Acuarela', creditos: 2, requisitos: ['AP6012', 'AP6014'], tipo: 'Opción de taller' },
                        { codigo: 'AP1058', nombre: 'Taller de Forja', creditos: 2, requisitos: ['AP6001', 'AP6003', 'AP6017'], tipo: 'Opción de taller' },
                        { codigo: 'AP1059', nombre: 'Talla en Piedra', creditos: 2, requisitos: ['AP6012', 'AP6014'], tipo: 'Opción de taller' },
                        { codigo: 'AP1060', nombre: 'Collage Escultórico', creditos: 2, requisitos: ['AP6012', 'AP6014'], tipo: 'Opción de taller' },
                        { codigo: 'AP1061', nombre: 'Aplicaciones Artísticas del Metal', creditos: 2, requisitos: ['AP6012', 'AP6014'], tipo: 'Opción de taller' },
                        { codigo: 'AP1062', nombre: 'Talla en Madera', creditos: 2, requisitos: ['AP6012', 'AP6014'], tipo: 'Opción de taller' },
                        { codigo: 'AP1063', nombre: 'Litografía Experimental', creditos: 2, requisitos: ['AP6012', 'AP6014'], tipo: 'Opción de taller' },
                        { codigo: 'AP1064', nombre: 'Litografía I', creditos: 2, requisitos: ['AP6012', 'AP6014'], tipo: 'Opción de taller' },
                        { codigo: 'AP1065', nombre: 'Grabado en Metal por Electroquímica', creditos: 2, requisitos: ['AP6012', 'AP6014'], tipo: 'Opción de taller' },
                        { codigo: 'AP1066', nombre: 'Grabado en Metal por Electrólisis', creditos: 2, requisitos: ['AP6012', 'AP6014'], tipo: 'Opción de taller' },
                        { codigo: 'AP1067', nombre: 'Grabado en Metal con Talla Directa', creditos: 2, requisitos: ['AP6012', 'AP6014'], tipo: 'Opción de taller' },
                        { codigo: 'AP1068', nombre: 'Xilografía a la Acuarela', creditos: 2, requisitos: ['AP6012', 'AP6014'], tipo: 'Opción de taller' },
                        { codigo: 'AP1069', nombre: 'Xilografía al Hilo', creditos: 2, requisitos: ['AP6012', 'AP6014'], tipo: 'Opción de taller' },
                        { codigo: 'AP1070', nombre: 'Introducción a la Marroquinería', creditos: 2, requisitos: ['AP6012', 'AP6014'], tipo: 'Opción de taller' },
                        { codigo: 'AP1071', nombre: 'Taller de Grabado Contemporáneo', creditos: 2, requisitos: ['AP6012', 'AP6014'], tipo: 'Opción de taller' },
                        { codigo: 'AP1072', nombre: 'Grabado con Planchas de Cuero', creditos: 2, requisitos: ['AP6012', 'AP6014'], tipo: 'Opción de taller' },
                        { codigo: 'AP1073', nombre: 'Encuadernación Artística Avanzada', creditos: 2, requisitos: ['AP6012', 'AP6014', 'AP6044'], tipo: 'Opción de taller' },
                        { codigo: 'AP1074', nombre: 'Diseño de Carteles', creditos: 2, requisitos: ['AP6012', 'AP6014'], tipo: 'Opción de taller' }
                    ]
                }
            ]
        },
        {
            id: 'optativas-historia-arte',
            titulo: 'Optativas de historia del arte',
            descripcion: 'Catálogo del bloque OPT785. En la malla principal se mantienen los espacios de Historia del Arte para el cálculo del avance.',
            cuentaEnProgreso: false,
            mostrarPromedio: false,
            ciclos: [
                {
                    ciclo: 'OPT785',
                    titulo: 'OPT785 - Cursos de historia del arte',
                    cursos: [
                        { codigo: 'AP1049', nombre: 'Arte Precolombino de Costa Rica', creditos: 3, requisitos: ['AP6020'], tipo: 'Opción de historia del arte' },
                        { codigo: 'AP6074', nombre: 'Arte Antiguo', creditos: 3, requisitos: ['AP6020'], tipo: 'Opción de historia del arte' },
                        { codigo: 'AP6075', nombre: 'El Origen de la Imagen Antes de la Era del Arte', creditos: 3, requisitos: ['AP6020'], tipo: 'Opción de historia del arte' },
                        { codigo: 'AP6076', nombre: 'Arte Medieval', creditos: 3, requisitos: ['AP6020'], tipo: 'Opción de historia del arte' },
                        { codigo: 'AP6077', nombre: 'Arte del Renacimiento', creditos: 3, requisitos: ['AP6020'], tipo: 'Opción de historia del arte' },
                        { codigo: 'AP6078', nombre: 'Arte Barroco', creditos: 3, requisitos: ['AP6020'], tipo: 'Opción de historia del arte' },
                        { codigo: 'AP6079', nombre: 'Arte del Siglo XIX', creditos: 3, requisitos: ['AP6020'], tipo: 'Opción de historia del arte' },
                        { codigo: 'AP6080', nombre: 'Del Realismo al Modernismo', creditos: 3, requisitos: ['AP6020'], tipo: 'Opción de historia del arte' },
                        { codigo: 'AP6081', nombre: 'Arte del Siglo XX I', creditos: 3, requisitos: ['AP6020'], tipo: 'Opción de historia del arte' },
                        { codigo: 'AP6082', nombre: 'Arte del Siglo XX II', creditos: 3, requisitos: ['AP6020'], tipo: 'Opción de historia del arte' },
                        { codigo: 'AP6083', nombre: 'Arte del Islam', creditos: 3, requisitos: ['AP6020'], tipo: 'Opción de historia del arte' },
                        { codigo: 'AP9001', nombre: 'Historia del Dibujo', creditos: 3, tipo: 'Opción de historia del arte' },
                        { codigo: 'AP9005', nombre: 'Museología', creditos: 3, requisitos: ['AP6020'], tipo: 'Opción de historia del arte' },
                        { codigo: 'AP9007', nombre: 'Mitología en el Arte', creditos: 3, requisitos: ['AP6019'], tipo: 'Opción de historia del arte' },
                        { codigo: 'AP9024', nombre: 'Arte Contemporáneo de Costa Rica', creditos: 3, requisitos: ['AP6084'], tipo: 'Opción de historia del arte' },
                        { codigo: 'AP9028', nombre: 'Historia del Diseño', creditos: 3, tipo: 'Opción de historia del arte' },
                        { codigo: 'AP1026', nombre: 'Arte Latinoamericano I', creditos: 3, requisitos: ['AP6020'], tipo: 'Opción de historia del arte' },
                        { codigo: 'AP1027', nombre: 'Arte Latinoamericano II', creditos: 3, requisitos: ['AP1026'], tipo: 'Opción de historia del arte' },
                        { codigo: 'AP1028', nombre: 'Arte Oceánico y Africano', creditos: 3, requisitos: ['AP6019'], tipo: 'Opción de historia del arte' },
                        { codigo: 'AP1029', nombre: 'Arte Chino', creditos: 3, requisitos: ['AP6019'], tipo: 'Opción de historia del arte' },
                        { codigo: 'AP1030', nombre: 'Arte de la India', creditos: 3, requisitos: ['AP6019'], tipo: 'Opción de historia del arte' },
                        { codigo: 'AP1031', nombre: 'Arte Bizantino', creditos: 3, requisitos: ['AP6019'], tipo: 'Opción de historia del arte' },
                        { codigo: 'AP1032', nombre: 'Arte Hispano-Musulmán', creditos: 3, requisitos: ['AP6019'], tipo: 'Opción de historia del arte' },
                        { codigo: 'AP1033', nombre: 'Arte Gótico', creditos: 3, requisitos: ['AP6019'], tipo: 'Opción de historia del arte' },
                        { codigo: 'AP1034', nombre: 'Arte Maya', creditos: 3, requisitos: ['AP6019'], tipo: 'Opción de historia del arte' },
                        { codigo: 'AP1035', nombre: 'El Renacimiento Nórdico', creditos: 3, requisitos: ['AP6019'], tipo: 'Opción de historia del arte' },
                        { codigo: 'AP1036', nombre: 'Arte Rococó', creditos: 3, requisitos: ['AP6019'], tipo: 'Opción de historia del arte' },
                        { codigo: 'AP1037', nombre: 'Historia del Art Nouveau y el Art Deco', creditos: 3, requisitos: ['AP6019'], tipo: 'Opción de historia del arte' },
                        { codigo: 'AP1038', nombre: 'Arte Contemporáneo', creditos: 3, requisitos: ['AP6019'], tipo: 'Opción de historia del arte' },
                        { codigo: 'AP1039', nombre: 'Arte Alemán', creditos: 3, requisitos: ['AP6019'], tipo: 'Opción de historia del arte' },
                        { codigo: 'AP1040', nombre: 'Arte Norteamericano (Estados Unidos)', creditos: 3, requisitos: ['AP6019'], tipo: 'Opción de historia del arte' },
                        { codigo: 'AP1041', nombre: 'Arte Ruso', creditos: 3, requisitos: ['AP6019'], tipo: 'Opción de historia del arte' },
                        { codigo: 'AP1042', nombre: 'Historia de la Música Aplicada a las Artes Visuales', creditos: 3, requisitos: ['AP6019'], tipo: 'Opción de historia del arte' },
                        { codigo: 'AP1043', nombre: 'Historia del Cine', creditos: 3, requisitos: ['AP6019'], tipo: 'Opción de historia del arte' },
                        { codigo: 'AP1044', nombre: 'Historia del Cómic', creditos: 3, requisitos: ['AP6019'], tipo: 'Opción de historia del arte' },
                        { codigo: 'AP1045', nombre: 'Historia del Libro y de la Imagen Impresa', creditos: 3, requisitos: ['AP6019'], tipo: 'Opción de historia del arte' },
                        { codigo: 'AP1046', nombre: 'Historia de las Artes Aplicadas', creditos: 3, requisitos: ['AP6019'], tipo: 'Opción de historia del arte' },
                        { codigo: 'AP1047', nombre: 'Los Estudios Visuales: Visualidad y Producción Cultural', creditos: 3, requisitos: ['AP6019'], tipo: 'Opción de historia del arte' },
                        { codigo: 'AP1048', nombre: 'Mujeres Artífices y Artistas', creditos: 3, requisitos: ['AP6019'], tipo: 'Opción de historia del arte' },
                        { codigo: 'AP1054', nombre: 'Historia de la Moda en los Siglos XIX y XX', creditos: 3, tipo: 'Opción de historia del arte' },
                        { codigo: 'AP2023', nombre: 'Arte Budista de Asia', creditos: 3, requisitos: ['AP6019'], tipo: 'Opción de historia del arte' },
                        { codigo: 'AP2024', nombre: 'Arte Clásico', creditos: 3, requisitos: ['AP6019'], tipo: 'Opción de historia del arte' },
                        { codigo: 'AP2026', nombre: 'Arte Japonés', creditos: 3, requisitos: ['AP6019'], tipo: 'Opción de historia del arte' },
                        { codigo: 'AP2028', nombre: 'Arte Oriental', creditos: 3, requisitos: ['AP6019'], tipo: 'Opción de historia del arte' },
                        { codigo: 'AP2036', nombre: 'Historia de la Escultura', creditos: 3, requisitos: ['AP6019'], tipo: 'Opción de historia del arte' },
                        { codigo: 'AP6087', nombre: 'Arte Precolombino', creditos: 3, requisitos: ['AP6020'], tipo: 'Opción de historia del arte' }
                    ]
                }
            ]
        }
    ]
};
