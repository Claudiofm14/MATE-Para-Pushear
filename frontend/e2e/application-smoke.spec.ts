import { expect, test } from '@playwright/test';

const viewports = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 1024, height: 900 },
  { name: 'mobile', width: 393, height: 852 },
];

test.describe('application smoke flow', () => {
  for (const viewport of viewports) {
    test(`loads materias without blank loader on ${viewport.name}`, async ({
      page,
    }) => {
      const consoleErrors: string[] = [];
      page.on('console', message => {
        if (message.type() === 'error') consoleErrors.push(message.text());
      });

      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });

      await page.route('**/auth/session', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: '{}',
        });
      });

      await page.route('**/materia', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: 1, codigo: 'ITI', nombre: 'Materiales Tecnológicos' },
          ]),
        });
      });

      await page.goto('/');

      await expect(page.getByRole('heading', { name: 'UNAHUR' })).toBeVisible();
      await expect(
        page.getByRole('heading', { name: 'Materiales Tecnológicos' })
      ).toBeVisible();
      await expect(
        page.getByRole('button', { name: 'Ingresar' })
      ).toBeVisible();
      await expect(page.locator('body')).not.toBeEmpty();

      expect(consoleErrors).toEqual([]);
    });
  }

  test('admin solicitudes stops retrying after a rate limit error', async ({
    page,
  }) => {
    let solicitudesRequests = 0;

    await page.route('**/auth/session', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            email: 'admin@test.local',
            name: 'Admin Test',
            provider: 'gitea',
          },
        }),
      });
    });

    await page.route('**/api/usuario/me', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 1,
          authProviderId: 'admin-test',
          email: 'admin@test.local',
          nombre: 'Admin',
          apellido: 'Test',
          rol: 'admin',
          githubUser: 'admin-test',
        }),
      });
    });

    await page.route('**/api/admin/solicitudes-acceso', async route => {
      solicitudesRequests += 1;
      await route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Demasiados intentos seguidos',
        }),
      });
    });

    await page.goto('/admin/solicitudes');

    await expect(
      page.getByRole('heading', { name: 'Solicitudes de Acceso Docente' })
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Intentar de nuevo' })
    ).toBeVisible();
    await page.waitForTimeout(500);

    expect(solicitudesRequests).toBe(1);
  });
});
