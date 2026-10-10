import { requireProductionSecret } from '../config/env.validation';
import { customFetch } from '@auth/core';

const defaultCallbackUrl = 'http://localhost:3001/materias';

function isConfigured(value?: string) {
  return (
    !!value && !value.startsWith('your-') && !value.startsWith('change-this')
  );
}

export async function createAuthJsConfig() {
  requireProductionSecret('AUTH_SECRET', process.env.AUTH_SECRET);

  const providers: any[] = [];

  if (
    isConfigured(process.env.GITEA_BASE_URL) &&
    isConfigured(process.env.GITEA_CLIENT_ID) &&
    isConfigured(process.env.GITEA_CLIENT_SECRET)
  ) {
    const giteaBaseUrl = process.env.GITEA_BASE_URL.replace(/\/$/, '');
    providers.push({
      id: 'gitea',
      name: 'Gitea',
      type: 'oauth',
      authorization: {
        url: `${giteaBaseUrl}/login/oauth/authorize`,
        params: { scope: 'read:user user:email' },
      },
      token: {
        url: `${giteaBaseUrl}/login/oauth/access_token`,
        async conform(response: Response) {
          if (!response.ok) {
            const body = await response.clone().text();
            console.error(
              `[auth][gitea] Token endpoint failed: ${response.status} ${response.statusText} - ${body.slice(0, 500)}`,
            );
          }
          return response;
        },
      },
      userinfo: `${giteaBaseUrl}/api/v1/user`,
      clientId: process.env.GITEA_CLIENT_ID,
      clientSecret: process.env.GITEA_CLIENT_SECRET,
      client: { token_endpoint_auth_method: 'client_secret_post' },
      checks: ['state'],
      [customFetch]: async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = input instanceof Request ? input.url : String(input);

        if (url === `${giteaBaseUrl}/login/oauth/access_token`) {
          const response = await fetch(input, {
            ...init,
            headers: {
              ...Object.fromEntries(new Headers(init?.headers).entries()),
              Accept: 'application/json',
            },
          });

          if (!response.ok) {
            const body = await response.clone().text();
            console.error(
              `[auth][gitea] ${init?.method || 'GET'} ${url} -> ${response.status} ${response.statusText}: ${body.slice(0, 500)}`,
            );
          }

          return response;
        }

        return fetch(input, init);
      },
      profile(profile: any) {
        const username = profile.login || profile.username;
        return {
          id: String(profile.id),
          name: profile.full_name || username,
          email: profile.email,
          image: profile.avatar_url,
          giteaUser: username,
        };
      },
    });
  }

  return {
    trustHost: true,
    secret:
      process.env.AUTH_SECRET || 'dev-only-auth-secret-change-me-32-chars',
    providers,
    callbacks: {
      async redirect({ url, baseUrl }: any) {
        const frontendUrl = process.env.FRONTEND_URL || defaultCallbackUrl;
        if (url.startsWith('/')) return `${baseUrl}${url}`;
        if (url.startsWith(baseUrl)) return url;
        if (url.startsWith(frontendUrl)) return url;
        return frontendUrl;
      },
      async jwt({ token, profile, account }: any) {
        if (account?.provider) token.provider = account.provider;
        if (profile) {
          token.giteaUser =
            (profile as any).login ||
            (profile as any).nickname ||
            (profile as any).preferred_username;
        }
        return token;
      },
      async session({ session, token }: any) {
        if (session.user) {
          (session.user as any).id =
            token.provider && token.sub
              ? `${token.provider}:${token.sub}`
              : token.sub;
          (session.user as any).provider = token.provider;
          (session.user as any).giteaUser = token.giteaUser;
          (session.user as any).providerUsername = token.giteaUser;
          (session.user as any).githubUser = token.giteaUser;
        }
        return session;
      },
    },
  };
}
