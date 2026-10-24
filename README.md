# Malla Interactiva UCR

Aplicación web estática. `index.html` carga las mallas de `mallas/`, los módulos de `js/` y los estilos de `css/`. No requiere compilación.

## Persistencia

- Firebase Authentication inicia la sesión con Google.
- Cloud Firestore guarda por usuario la malla seleccionada, cursos, notas, bitácora TCU, nombre del proyecto y tema visual en `usuarios/{uid}`.
- Las fotos de TCU se cargan desde la bitácora y se guardan **solo en IndexedDB del navegador**. Se vinculan al UID y a la actividad; no se envían a Firebase ni aparecen en otros dispositivos. Se pueden abrir, descargar y eliminar desde cada actividad. Para agregar fotos a una actividad antigua, ábrela con **Editar** y guárdala.
- Antes de borrar los datos del sitio o cambiar de dispositivo, descarga las fotos que quieras conservar. Cambiar de malla o restablecer los datos elimina las fotos locales asociadas a la cuenta en ese navegador.

## Ejecutar y probar

Sirve la carpeta con un origen estable, por ejemplo `python -m http.server 8000`, y abre `http://localhost:8000`. Para usar Google, el dominio debe estar autorizado en el proyecto Firebase. En producción, usa HTTPS.

Ejecuta `node --test tests/*.test.cjs` para validar los datos de las mallas, la sugerencia de cursos y la exportación del plan. Verifica además en el navegador el inicio de sesión, una edición de notas, la bitácora con fotos, el cambio de malla y la vista móvil.

## Reglas de Firestore

El código cliente escribe en `usuarios/{uid}`, pero la privacidad depende de las reglas publicadas en el proyecto Firebase. [firestore.rules.example](firestore.rules.example) contiene una regla base que limita cada documento a su usuario autenticado. Es un ejemplo local y no modifica las reglas del proyecto hasta que se revise y publique explícitamente.
