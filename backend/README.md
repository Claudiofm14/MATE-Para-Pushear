# Backend META UNAHUR

## Integracion avanzada con Gitea

La app permite vincular una cursada con una organizacion de Gitea, seleccionar repositorios plantilla al crear ejercicios y generar repositorios privados por alumno de forma idempotente.

### Variables de entorno

- `GITEA_BASE_URL`: URL publica de Gitea. Ejemplo: `https://gitea-unahur.duckdns.org`.
- `GITEA_CLIENT_ID` y `GITEA_CLIENT_SECRET`: OAuth para login con Gitea.
- `GITEA_CALLBACK_URL`: callback OAuth de Auth.js.
- `GITEA_ADMIN_TOKEN`: token administrativo. Solo se usa en backend.
- `GITEA_DEFAULT_REPO_VISIBILITY`: visibilidad al generar repos. Usar `private`.
- `GITEA_TEMPLATE_REPO_SUFFIX`: sufijo para detectar plantillas por nombre. Por defecto `-template`; tambien se acepta `-plantilla`.
- `GITEA_WEBHOOK_SECRET`: secreto para validar webhooks de Gitea.
- `GITEA_WEBHOOK_PUBLIC_URL`: URL publica del webhook de la app.

### Flujo de uso

1. En editar/crear cursada, activar `Integracion con Gitea`.
2. Seleccionar una organizacion existente o crear una nueva desde la app.
3. En Gitea, crear repositorios plantilla dentro de esa organizacion y marcarlos como template. Si la API no informa el flag de template, la app tambien detecta nombres terminados en `-template` o `-plantilla`.
4. En crear/editar ejercicio, seleccionar una plantilla de la organizacion vinculada.
5. Cuando un alumno inscripto abre el ejercicio, la app crea o recupera su repositorio privado en esa organizacion.

### Idempotencia

La tabla `student_exercise_repository` tiene una restriccion unica por `exerciseId + studentId`. Si el alumno abre el ejercicio varias veces, se devuelve el mismo repo. Si Gitea ya tiene un repo con el nombre esperado, la app lo recupera y guarda la relacion.

### Permisos

Las llamadas administrativas a Gitea salen solo desde backend con `GITEA_ADMIN_TOKEN`. El token no se expone al frontend ni se loguea.

El alumno se agrega como colaborador `write` sobre su repositorio. Los repos se crean privados por defecto. Los docentes/admins deben tener permisos sobre la organizacion en Gitea para revisar entregas.

### Migraciones

Ejecutar:

```bash
npm run migration:run
```

La migracion `1779548265141-AddGiteaCourseExerciseRepos` agrega campos de Gitea en cursadas/ejercicios y la tabla de repositorios por alumno.
