# Frontend - Materiales Tecnologicos - Universidad Nacional de Hurlingham

Frontend React para Materiales Tecnologicos - Universidad Nacional de Hurlingham, desarrollado con Vite, TypeScript, Tailwind CSS, Flowbite y autenticacion mediante Auth.js en el backend.

## Caracteristicas

- React con TypeScript
- Vite como build tool
- Autenticacion Auth.js con Gitea
- Proteccion de vistas basada en roles
- Diseno responsivo con Tailwind CSS + Flowbite
- Modo oscuro/claro con persistencia

## Configuracion

Instalar dependencias:

```bash
npm install
```

Crear `.env` si el backend no corre en el valor por defecto:

```env
VITE_API_URL=http://localhost:3000
```

Iniciar la aplicacion:

```bash
npm start
```

La aplicacion queda disponible en `http://localhost:3001`.

## Produccion

El build Docker usa por defecto:

```env
VITE_API_URL=https://api.mate.unahur.edu.ar
VITE_ENVIRONMENT=production
```

## Autenticacion

El frontend consume la sesion de Auth.js desde el backend:

- Login: `GET /auth/signin/gitea`
- Sesion: `GET /auth/session`
- Logout: `POST /auth/signout`

Las llamadas a la API usan cookies de sesion con `withCredentials`.

## Variables requeridas en backend

```env
AUTH_SECRET=un-secreto-de-al-menos-32-caracteres
GITEA_BASE_URL=https://gitea-unahur.duckdns.org
GITEA_CLIENT_ID=gitea-oauth-client-id
GITEA_CLIENT_SECRET=gitea-oauth-client-secret
GITEA_CALLBACK_URL=http://localhost:3000/auth/callback/gitea
GITEA_ADMIN_TOKEN=
GITEA_IMPORT_DEFAULT_PASSWORD_FIELD=legajo
GITEA_IMPORT_MUST_CHANGE_PASSWORD=true
GITEA_WEBHOOK_SECRET=
GITEA_WEBHOOK_PUBLIC_URL=http://localhost:3000/api/webhooks/gitea
FRONTEND_URL=http://localhost:3001/materias
FRONTEND_ORIGIN=http://localhost:3001
```

El unico provider de autenticacion habilitado es Gitea.

## Importar Alumnos A Gitea

Los administradores pueden usar el boton `Importar alumnos a Gitea` en la
pantalla principal. La planilla debe ser `.xls` o `.xlsx` y contener columnas
equivalentes a nombre, apellido, email y legajo/DNI. La app detecta aliases como
`mail`, `correo`, `dni`, `documento`, `apellido y nombre` o `nombre completo`.

El flujo tiene dos pasos:

1. `Previsualizar`: valida filas, muestra errores y enmascara el legajo/DNI.
2. `Confirmar importacion`: vuelve a procesar el archivo en backend y crea los
   usuarios con `POST /api/v1/admin/users` de Gitea.

La clave inicial es el legajo/DNI y se fuerza el cambio en el primer inicio con
`must_change_password=true`. El token administrativo y las claves temporales no
se envian al frontend ni se guardan.
