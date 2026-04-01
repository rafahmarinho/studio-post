import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 30

/**
 * GET /api/integrations/meta/callback
 *
 * OAuth 2.0 callback handler for Meta (Facebook/Instagram).
 * Facebook redirects here after the user authorizes the app.
 *
 * Flow:
 * 1. User clicks "Connect" → redirected to Facebook OAuth dialog
 * 2. User authorizes → Facebook redirects here with ?code=...
 * 3. This route exchanges the code for a short-lived access token
 * 4. Renders a page that sends the token to the parent window via postMessage
 * 5. The parent window (integrations page) receives the token and calls
 *    POST /api/integrations/meta { action: 'exchange_token' } to get a long-lived token
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorReason = searchParams.get('error_reason')

  // User denied access
  if (error) {
    return renderCallbackPage({
      success: false,
      error: errorReason || error || 'Access denied',
    })
  }

  if (!code) {
    return renderCallbackPage({
      success: false,
      error: 'No authorization code received',
    })
  }

  const appId = process.env.META_APP_ID
  const appSecret = process.env.META_APP_SECRET
  const redirectUri = `${getBaseUrl(req)}/api/integrations/meta/callback`

  if (!appId || !appSecret) {
    return renderCallbackPage({
      success: false,
      error: 'Meta API not configured on server',
    })
  }

  try {
    // Exchange authorization code for short-lived access token
    const tokenUrl = new URL('https://graph.facebook.com/v21.0/oauth/access_token')
    tokenUrl.searchParams.set('client_id', appId)
    tokenUrl.searchParams.set('client_secret', appSecret)
    tokenUrl.searchParams.set('redirect_uri', redirectUri)
    tokenUrl.searchParams.set('code', code)

    const tokenRes = await fetch(tokenUrl.toString())
    if (!tokenRes.ok) {
      const err = (await tokenRes.json()) as { error?: { message?: string } }
      return renderCallbackPage({
        success: false,
        error: err.error?.message || 'Failed to exchange authorization code',
      })
    }

    const tokenData = (await tokenRes.json()) as { access_token: string }

    return renderCallbackPage({
      success: true,
      accessToken: tokenData.access_token,
    })
  } catch (err) {
    return renderCallbackPage({
      success: false,
      error: err instanceof Error ? err.message : 'Unexpected error',
    })
  }
}

function getBaseUrl(req: NextRequest): string {
  const host = req.headers.get('host') || 'localhost:3000'
  const proto = req.headers.get('x-forwarded-proto') || 'http'
  return `${proto}://${host}`
}

function renderCallbackPage(data: { success: boolean; accessToken?: string; error?: string }) {
  // This page runs in a popup window opened by the integrations page.
  // It sends the result back via window.opener.postMessage and closes itself.
  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Conectando com o Meta...</title>
  <style>
    body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #fafaf9; color: #1c1917; }
    .card { text-align: center; padding: 2rem; max-width: 400px; }
    .spinner { width: 32px; height: 32px; border: 3px solid #e7e5e4; border-top-color: #7c3aed; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 1rem; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .success { color: #16a34a; }
    .error { color: #dc2626; }
    p { margin: 0.5rem 0; font-size: 0.875rem; color: #78716c; }
  </style>
</head>
<body>
  <div class="card">
    ${data.success ? `
      <div class="spinner"></div>
      <h2 class="success">Conectado com sucesso!</h2>
      <p>Fechando esta janela automaticamente...</p>
    ` : `
      <h2 class="error">Erro na conexão</h2>
      <p>${escapeHtml(data.error || 'Erro desconhecido')}</p>
      <p>Feche esta janela e tente novamente.</p>
    `}
  </div>
  <script>
    (function() {
      try {
        if (window.opener) {
          window.opener.postMessage(${JSON.stringify({
            type: 'META_OAUTH_CALLBACK',
            success: data.success,
            accessToken: data.accessToken || null,
            error: data.error || null,
          })}, window.location.origin);
        }
      } catch(e) {
        console.error('postMessage failed:', e);
      }
      // Close popup after a short delay
      setTimeout(function() { window.close(); }, ${data.success ? 1500 : 5000});
    })();
  </script>
</body>
</html>`

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
