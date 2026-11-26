# NutriFit AI - Security Hardening Checklist
Based on [Vibe Security](https://github.com/astoj/vibe-security) Web App Security Checklist

## ✅ Already Implemented (Strong Foundation)

### 3. Role-Based Access Control (RBAC) - **EXCELLENT**
- Supabase RLS policies on ALL 18 tables with `auth.uid()` checks
- Per-user data isolation enforced at database level
- Service role key only used server-side in `supabaseAdmin`

### 4. Sensitive Data Handling - **GOOD**
- `.env*` in `.gitignore`
- Server-only secrets (`AUTH_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`)
- No client-side exposure of service keys

### 7. Database Security - **EXCELLENT**
- Trusted ORM (Supabase client)
- Row-Level Security enabled on all tables
- Parameterized queries via Supabase client
- No raw SQL in application code

### 9. Secure Communications - **PARTIAL**
- HTTPS enforced on Vercel/managed hosting
- Secure cookies (`httpOnly`, `secure`, `sameSite: lax`)

---

## 🔴 CRITICAL - Must Fix Immediately

### 1. Authentication - **WEAK SESSION SECRET**
**File:** `src/lib/auth.ts:5`
```typescript
const AUTH_SECRET = process.env.AUTH_SECRET || 'nutrifit-local-dev-secret-change-in-prod-32';
```
**Fix:** Require `AUTH_SECRET` env var in production, generate strong 32+ byte secret.

### 14. Rate Limiting - **MISSING ENTIRELY**
No rate limiting on:
- `/api/auth` (login/signup - brute force vulnerable)
- `/api/ai/*` (expensive AI calls - abuse vulnerable)
- All API endpoints

### 5. Error Handling - **LEAKS STACK TRACES**
Multiple API routes return `(err as Error).message` directly:
- `src/app/api/auth/route.ts:228`
- `src/app/api/state/route.ts:172`
- `src/app/api/ai/chat/route.ts:84`
- Others...

### 6. Input Validation - **MINIMAL**
Only basic checks (email format, password length). No:
- Zod/Valibot schema validation
- XSS sanitization
- SQL injection prevention (though Supabase client helps)

---

## 🟡 HIGH PRIORITY - Fix Soon

### 9. Secure Communications - **MISSING HEADERS**
No security headers in `next.config.ts`:
- `Content-Security-Policy`
- `Strict-Transport-Security`
- `X-Content-Type-Options`
- `X-Frame-Options`
- `Referrer-Policy`
- `Permissions-Policy`

### 10. Logging & Monitoring - **MISSING**
- No structured logging
- No error tracking (Sentry, etc.)
- No audit logs for sensitive actions

### 13. Dependency Management - **UNMONITORED**
- No Dependabot config
- No `npm audit` in CI
- No Snyk/OWASP scanning

### 15. Data Privacy - **PARTIAL**
- No explicit GDPR/CCPA compliance
- No data deletion endpoint
- No consent management

---

## 🟢 MEDIUM PRIORITY - Harden Further

### 2. Middleware Protection - **PARTIAL**
- `requireAuth()` guard exists but no role checks
- No admin-only routes protection

### 8. Hosting - **VERIFY**
- Confirm Vercel DDoS/WAF enabled
- Confirm automatic security updates

### 11. Security Testing - **MISSING**
- No SAST/DAST in CI
- No penetration testing schedule

### 12. Backup/DR - **VERIFY**
- Confirm Supabase PITR enabled
- Test restore procedures

### 16. Incident Response - **MISSING**
- No incident response plan
- No security training

### 17. IaC Security - **N/A**
- No Terraform/CloudFormation

---

## 📋 Implementation Priority Order

| Priority | Task | Files to Modify |
|----------|------|-----------------|
| **P0** | Fix AUTH_SECRET fallback | `src/lib/auth.ts`, `.env.example` |
| **P0** | Add rate limiting middleware | New `src/lib/rate-limit.ts`, middleware.ts |
| **P0** | Sanitize error responses | All API routes |
| **P0** | Add input validation (Zod) | All API routes |
| **P1** | Add security headers | `next.config.ts` |
| **P1** | Add structured logging | New `src/lib/logger.ts` |
| **P1** | Configure Dependabot | `.github/dependabot.yml` |
| **P1** | Add CSP header | `next.config.ts`, `middleware.ts` |
| **P2** | Add audit logging | Auth actions, data mutations |
| **P2** | Data deletion endpoint | New API route |
| **P2** | Security documentation | `SECURITY.md` |