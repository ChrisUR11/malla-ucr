# Malla Interactiva UCR

Aplicación web estática. `index.html` carga las mallas de `mallas/`, los módulos de `js/` y los estilos de `css/`. No requiere compilación.

## Persistencia

- Firebase Authentication inicia la sesión con Google.
- Cloud Firestore guarda por usuario la malla seleccionada, cursos, notas, bitácora TCU, nombre del proyecto y tema visual en `usuarios/{uid}`.
- Las fotos de la bitácora se seleccionan desde la propia página. El navegador las reduce a JPEG de hasta 600 KiB y guarda cada una en `usuarios/{uid}/fotosTCU/{fotoId}` de Firestore. Aparecen en otros dispositivos al iniciar sesión con la misma cuenta, sin tener que cargarlas en la consola de Firebase. Se permiten hasta cinco fotos por actividad.
- Las fotos guardadas por la versión anterior en IndexedDB se intentan migrar automáticamente al iniciar sesión, recuperar la conexión o abrir la bitácora. Si falla la conexión, se conservan localmente para reintentar después. Conviene verificar que las fotos aparezcan en otro dispositivo antes de borrar los datos del navegador antiguo.
- Los cambios de cursos y de actividades TCU se guardan mediante transacciones. Los cambios independientes hechos en pestañas distintas se combinan con el estado más reciente de Firestore; si dos pestañas editan el mismo curso o la misma actividad, la edición desactualizada se rechaza para que pueda revisarse. Las pestañas abiertas reciben los cambios remotos en tiempo real. [Estas transacciones requieren conexión](https://firebase.google.com/docs/firestore/manage-data/transactions).

## Ejecutar y probar

Sirve la carpeta con un origen estable, por ejemplo `python -m http.server 8000`, y abre `http://localhost:8000`. Para usar Google, el dominio debe estar autorizado en el proyecto Firebase. En producción, usa HTTPS.

Ejecuta `node --test tests/*.test.cjs` para validar los datos de las mallas y la lógica de cursos y exportación. Verifica además en el navegador el inicio de sesión, dos pestañas editando cursos diferentes, la bitácora con fotos, la migración de fotos antiguas, el cambio de malla y la vista móvil.

## Reglas de Firestore

[firestore.rules](firestore.rules) es la fuente de reglas desplegable y [firebase.json](firebase.json) la vincula con Firebase CLI. El documento `usuarios/{uid}` y su subcolección `fotosTCU` requieren acceso exclusivo del usuario autenticado. Las reglas exigen una revisión creciente en el documento principal y limitan los campos y bytes de cada foto; la aplicación controla el máximo de cinco fotos por actividad.

**Publicadas en `malla-ucr` el 25 de octubre de 2026.** La versión anterior incluía un comodín recursivo que permitía modificar y borrar el documento principal del usuario; estas reglas usan rutas explícitas. Si otro cliente necesita subcolecciones distintas de `fotosTCU`, añade sus permisos concretos. Para publicar cambios futuros, ten en cuenta que una publicación con CLI reemplaza las reglas activas. En PowerShell, una persona con acceso al proyecto puede ejecutar desde esta carpeta:

```sh
npx.cmd --yes firebase-tools@latest login
npx.cmd --yes firebase-tools@latest deploy --only firestore:rules --project malla-ucr
```

No se necesita Cloud Storage ni un plan Blaze para esta implementación; las fotos usan Firestore. Cada foto ocupa hasta 600 KiB y comparte la cuota gratuita del proyecto, que incluye 1 GiB de almacenamiento; un uso alto puede agotarla. La cuenta Firebase debe tener Firestore habilitado. Consulta la [documentación de despliegue de reglas](https://firebase.google.com/docs/rules/manage-deploy) y los [límites de Firestore](https://firebase.google.com/docs/firestore/quotas).
