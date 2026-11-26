# NutriFit AI - Security Policy

## 🔒 Supported Versions

We actively maintain security for the following versions:

| Version | Supported |
|---------|-----------|
| Latest (main branch) | ✅ Yes |
| Previous major version | ⚠️ Critical fixes only |
| Older versions | ❌ No |

## 🛡️ Security Features Implemented

### Authentication & Authorization
- **Secure session management** with HMAC-signed cookies (HttpOnly, Secure, SameSite=Lax)
- **Password hashing** using scrypt with per-user salts (64-byte derived key)
- **Supabase Auth integration** with Row Level Security (RLS) on all 18 tables
- **Rate limiting** on auth endpoints (10 requests/15min) and API endpoints (60 req/min)
- **Session tokens** include timestamp for expiration tracking

### Data Protection
- **Database-level isolation** via Supabase RLS policies (`auth.uid()` checks)
- **Service role key** only used server-side, never exposed to client
- **Environment variables** for all secrets (`.env.local` gitignored)
- **No sensitive data in logs** - automatic redaction of passwords, tokens, keys
- **HTTPS enforcement** via HSTS header in production

### API Security
- **Input validation** using Zod schemas on all endpoints
- **Structured error handling** - no stack traces leaked to clients
- **CORS/CSRF protection** via SameSite cookies and CSP
- **Content Security Policy** with strict directives
- **Security headers**: X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy

### Monitoring & Logging
- **Structured JSON logging** with request IDs for tracing
- **Security event logging** (failed logins, rate limits, unauthorized access)
- **Audit logging** for sensitive actions (password changes, data mutations)
- **User ID hashing** in logs for privacy

### Infrastructure
- **Dependabot** for automated dependency updates
- **GitHub Actions** security pipeline: npm audit, CodeQL, TruffleHog secret scanning
- **Vercel deployment** with managed DDoS protection and automatic SSL

## 🚨 Reporting a Vulnerability

**Please do NOT open a public issue for security vulnerabilities.**

### Responsible Disclosure
1. Email: **security@nutrifit.ai** (or create a private GitHub Security Advisory)
2. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)
3. We will acknowledge within **48 hours**
4. We aim to patch critical vulnerabilities within **7 days**

### What to Expect
- Confirmation of receipt within 48 hours
- Regular updates on investigation progress
- Credit in security advisory (if desired)
- No legal action for good-faith research

## 🔐 Security Configuration Checklist

### Required Environment Variables
```bash
# Generate with: openssl rand -base64 32
AUTH_SECRET=your-32-byte-base64-secret

# Supabase (get from Dashboard > Settings > API)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # SERVER ONLY!

# AI Providers (optional)
GEMINI_API_KEY=
OPENAI_API_KEY=
GROQ_API_KEY=
```

### Production Deployment Checklist
- [ ] `AUTH_SECRET` set (32+ bytes, unique per environment)
- [ ] `NODE_ENV=production`
- [ ] `NEXT_PUBLIC_APP_URL` set to production URL
- [ ] Supabase RLS policies verified
- [ ] Service role key NOT in client bundle
- [ ] HTTPS enforced (Vercel handles automatically)
- [ ] Custom domain configured with HSTS preload
- [ ] Sentry/Error tracking configured
- [ ] Rate limits tested under load
- [ ] Backup/restore tested (Supabase PITR)

### Development Security
- [ ] Never commit `.env.local` or `.env.production`
- [ ] Use `.env.example` as template
- [ ] Run `npm audit` before merging
- [ ] Review Dependabot PRs promptly
- [ ] Test auth flows with invalid inputs

## 📋 Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
                        CLIENT (Browser)                       │
  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
  │ HttpOnly    │  │ SameSite=   │  │ CSP / Security      │  │
  │ Secure      │  │ Lax Cookies │  │ Headers             │  │
  │ Cookies     │  │             │  │                     │  │
  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │ HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────┐
                      NEXT.JS EDGE / SERVER                    │
  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
  │ Middleware  │  │ Rate Limit  │  │ Validation (Zod)    │  │
  │ (Security   │  │ (In-memory  │  │ Sanitization        │  │
  │  Headers)   │  │  sliding    │  │                     │  │
  │             │  │  window)    │  │                     │  │
  └─────────────┘  └─────────────┘  └─────────────────────┘  │
  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
  │ Auth Guard  │  │ Structured  │  │ Audit/Security      │  │
  │ (Session    │  │ Logging     │  │ Logging             │  │
  │  Verify)    │  │ (Redacted)  │  │                     │  │
  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │ Server-only
                              ▼
┌─────────────────────────────────────────────────────────────┐
                       SUPABASE (PostgreSQL)                   │
  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
  │ Row Level   │  │ Service     │  │ Private Storage     │  │
  │ Security    │  │ Role Key    │  │ Buckets             │  │
  │ (RLS)       │  │ (Admin ops) │  │ (Scans, Photos)     │  │
  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 🔄 Incident Response Plan

### Severity Levels
| Level | Description | Response Time |
|-------|-------------|---------------|
| **P0 - Critical** | Active breach, data exfiltration, RCE | < 1 hour |
| **P1 - High** | Auth bypass, SQLi, significant data exposure | < 4 hours |
| **P2 - Medium** | Rate limit bypass, info disclosure, XSS | < 24 hours |
| **P3 - Low** | Minor config issues, dependency vulns | < 7 days |

### Response Steps
1. **Detect** - Monitoring alerts, user reports, security scans
2. **Assess** - Determine severity, scope, affected systems
3. **Contain** - Revoke tokens, block IPs, disable features
4. **Eradicate** - Patch vulnerability, rotate secrets
5. **Recover** - Restore service, verify fix
6. **Review** - Post-incident analysis, update defenses

### Key Contacts
- Security Lead: [Your Name/Team]
- Infrastructure: [Vercel/Supabase Support]
- Legal/Compliance: [If applicable]

## 📚 Security Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security Headers](https://nextjs.org/docs/app/building-your-application/optimizing/security-headers)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Vibe Security Checklist](https://github.com/astoj/vibe-security)

---

*Last updated: 2026-11-27*
*Security policy version: 1.0*