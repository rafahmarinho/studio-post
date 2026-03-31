# Security Policy

## Supported Versions

| Version | Supported |
|---|---|
| Latest release | ✅ |
| Previous minor | ✅ |
| Older versions | ❌ |

## Reporting a Vulnerability

If you discover a security vulnerability, please **do not** open a public GitHub issue.

Instead, please report it responsibly:

1. **Email:** Send details to the repository owner (check the profile of the repo owner)
2. **Include:**
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We will acknowledge receipt within 48 hours and aim to release a fix within 7 days for critical issues.

## Security Measures

### Authentication & Authorization

- Firebase Authentication with JWT token validation
- Role-based access control (admin / user)
- Firestore security rules enforce per-user document access
- API keys are hashed (SHA-256) before storage

### API Security

- System API keys are server-side only (never exposed to the client)
- User API keys (BYO tier) are encrypted in Firestore
- Public API requires key-based authentication with per-key permissions
- Rate limiting per API key (configurable requests/minute)
- Daily spending limits per user

### Electron Desktop

- Context isolation enabled (`contextIsolation: true`)
- Node integration disabled (`nodeIntegration: false`)
- Sandbox mode enabled (`sandbox: true`)
- Web security enabled (`webSecurity: true`)
- External links open in system browser (not in the app)
- Navigation restricted to app URLs only
- Single instance lock prevents multiple app windows
- macOS hardened runtime with minimal entitlements

### Data Protection

- All inputs are sanitized before sending to AI models
- File uploads validated for MIME type and size
- CORS configured for authorized domains only
- Firebase security rules prevent cross-user data access
- No sensitive data logged in production
