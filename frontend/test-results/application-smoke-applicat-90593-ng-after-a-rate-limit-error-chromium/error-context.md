# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: application-smoke.spec.ts >> application smoke flow >> admin solicitudes stops retrying after a rate limit error
- Location: e2e\application-smoke.spec.ts:57:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'Solicitudes de Acceso Docente' })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('heading', { name: 'Solicitudes de Acceso Docente' })
    - waiting for navigation to finish...
    - waiting for" http://localhost:3000/auth/signin/gitea" navigation to finish...
    - navigated to "https://gitea.unahur.edu.ar/user/login?redirect_to=%2Flogin%2Foauth%2Fauthorize%3Fscope%3Dread%253Auser%2Buser%253Aemail%26response_type%3Dcode%26client_id%3D663f92a4-1dd5-416f-9c62-514c55b2d3f6%26re…"

```

```yaml
- navigation "Navigation Bar":
  - link "Home":
    - /url: /
  - link "Explore":
    - /url: /explore/repos
  - link "Help":
    - /url: https://docs.gitea.com
  - link "Sign In":
    - /url: /user/login
- main "Sign In":
  - heading "Sign In" [level=4]
  - text: Username or Email Address *
  - textbox "Username or Email Address *"
  - text: Password
  - link "Forgot password?":
    - /url: /user/forgot_password
  - textbox "Password"
  - text: Remember This Device
  - checkbox "Remember This Device"
  - button "Sign In"
- group "Footer":
  - contentinfo "About Software":
    - link "Powered by Gitea":
      - /url: https://about.gitea.com
    - text: "Version: 1.27.1 Page:"
    - strong: 3ms
    - text: "Template:"
    - strong: 1ms
  - group "Links":
    - menu: Auto
    - menu: English
    - link "Licenses":
      - /url: /assets/licenses.txt
    - link "API":
      - /url: /api/swagger
```

# Test source

```ts
  7   | ];
  8   | 
  9   | test.describe('application smoke flow', () => {
  10  |   for (const viewport of viewports) {
  11  |     test(`loads materias without blank loader on ${viewport.name}`, async ({
  12  |       page,
  13  |     }) => {
  14  |       const consoleErrors: string[] = [];
  15  |       page.on('console', message => {
  16  |         if (message.type() === 'error') consoleErrors.push(message.text());
  17  |       });
  18  | 
  19  |       await page.setViewportSize({
  20  |         width: viewport.width,
  21  |         height: viewport.height,
  22  |       });
  23  | 
  24  |       await page.route('**/auth/session', async route => {
  25  |         await route.fulfill({
  26  |           status: 200,
  27  |           contentType: 'application/json',
  28  |           body: '{}',
  29  |         });
  30  |       });
  31  | 
  32  |       await page.route('**/materia', async route => {
  33  |         await route.fulfill({
  34  |           status: 200,
  35  |           contentType: 'application/json',
  36  |           body: JSON.stringify([
  37  |             { id: 1, codigo: 'ITI', nombre: 'Materiales Tecnológicos' },
  38  |           ]),
  39  |         });
  40  |       });
  41  | 
  42  |       await page.goto('/');
  43  | 
  44  |       await expect(page.getByRole('heading', { name: 'UNAHUR' })).toBeVisible();
  45  |       await expect(
  46  |         page.getByRole('heading', { name: 'Materiales Tecnológicos' })
  47  |       ).toBeVisible();
  48  |       await expect(
  49  |         page.getByRole('button', { name: 'Ingresar' })
  50  |       ).toBeVisible();
  51  |       await expect(page.locator('body')).not.toBeEmpty();
  52  | 
  53  |       expect(consoleErrors).toEqual([]);
  54  |     });
  55  |   }
  56  | 
  57  |   test('admin solicitudes stops retrying after a rate limit error', async ({
  58  |     page,
  59  |   }) => {
  60  |     let solicitudesRequests = 0;
  61  | 
  62  |     await page.route('**/auth/session', async route => {
  63  |       await route.fulfill({
  64  |         status: 200,
  65  |         contentType: 'application/json',
  66  |         body: JSON.stringify({
  67  |           user: {
  68  |             email: 'admin@test.local',
  69  |             name: 'Admin Test',
  70  |             provider: 'gitea',
  71  |           },
  72  |         }),
  73  |       });
  74  |     });
  75  | 
  76  |     await page.route('**/api/usuario/me', async route => {
  77  |       await route.fulfill({
  78  |         status: 200,
  79  |         contentType: 'application/json',
  80  |         body: JSON.stringify({
  81  |           id: 1,
  82  |           authProviderId: 'admin-test',
  83  |           email: 'admin@test.local',
  84  |           nombre: 'Admin',
  85  |           apellido: 'Test',
  86  |           rol: 'admin',
  87  |           githubUser: 'admin-test',
  88  |         }),
  89  |       });
  90  |     });
  91  | 
  92  |     await page.route('**/api/admin/solicitudes-acceso', async route => {
  93  |       solicitudesRequests += 1;
  94  |       await route.fulfill({
  95  |         status: 429,
  96  |         contentType: 'application/json',
  97  |         body: JSON.stringify({
  98  |           message: 'Demasiados intentos seguidos',
  99  |         }),
  100 |       });
  101 |     });
  102 | 
  103 |     await page.goto('/admin/solicitudes');
  104 | 
  105 |     await expect(
  106 |       page.getByRole('heading', { name: 'Solicitudes de Acceso Docente' })
> 107 |     ).toBeVisible();
      |       ^ Error: expect(locator).toBeVisible() failed
  108 |     await expect(
  109 |       page.getByRole('button', { name: 'Intentar de nuevo' })
  110 |     ).toBeVisible();
  111 |     await page.waitForTimeout(500);
  112 | 
  113 |     expect(solicitudesRequests).toBe(1);
  114 |   });
  115 | });
  116 | 
```