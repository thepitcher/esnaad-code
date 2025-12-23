# SSL Certificate Issues - Troubleshooting Guide

## Problem: "Unable to verify the first certificate"

This error occurs when connecting to an API endpoint with a self-signed certificate or incomplete certificate chain, such as:
```
request to https://esnaad-stg.domain1.org/api/chat/completions failed
reason: unable to verify the first certificate
```

## Solutions

### Option 1: Disable SSL Verification (Development/Staging Only)

⚠️ **WARNING**: Only use this in development or staging environments. NEVER in production!

**Windows (PowerShell):**
```powershell
# In your .env file, add:
NODE_TLS_REJECT_UNAUTHORIZED=0
```

**macOS/Linux:**
```bash
# In your .env file, add:
NODE_TLS_REJECT_UNAUTHORIZED=0
```

Then rebuild and run:
```powershell
npm run build
esnaad
```

### Option 2: Add Custom CA Certificate (Recommended)

If you have the CA certificate file:

**Windows:**
```powershell
# In your .env file, add:
NODE_EXTRA_CA_CERTS=C:\path\to\ca-certificate.pem
```

**macOS/Linux:**
```bash
# In your .env file, add:
NODE_EXTRA_CA_CERTS=/path/to/ca-certificate.pem
```

### Option 3: Install Certificate in System Trust Store

**Windows:**
1. Double-click the certificate file (.crt or .pem)
2. Click "Install Certificate"
3. Choose "Local Machine" (requires admin)
4. Select "Place all certificates in the following store"
5. Choose "Trusted Root Certification Authorities"
6. Complete the wizard

**macOS:**
1. Double-click the certificate file
2. Add to "System" keychain
3. Double-click the cert in Keychain Access
4. Expand "Trust" section
5. Set "When using this certificate" to "Always Trust"

**Linux (Ubuntu/Debian):**
```bash
sudo cp ca-certificate.crt /usr/local/share/ca-certificates/
sudo update-ca-certificates
```

### Option 4: Get Valid SSL Certificate (Production)

For production environments, obtain a valid SSL certificate from:
- Let's Encrypt (free)
- DigiCert, Sectigo, or other Certificate Authorities
- Your organization's IT department

## How It Works

The fix in `src/agent.ts` configures the HTTPS agent:

```typescript
const httpsAgent = new https.Agent({
  rejectUnauthorized: process.env.NODE_TLS_REJECT_UNAUTHORIZED !== '0'
});

this.openai = new OpenAI({
  apiKey: config.apiKey,
  baseURL: config.apiBase,
  httpAgent: httpsAgent  // Uses custom SSL settings
});
```

## Verifying the Fix

1. **Add to .env file:**
   ```env
   OPENAI_API_KEY=your_key_here
   OPENAI_API_BASE=https://esnaad-stg.domain1.org/api/chat/completions
   OPENAI_MODEL=gpt-oss-120b
   NODE_TLS_REJECT_UNAUTHORIZED=0  # For staging/dev only
   ```

2. **Rebuild:**
   ```powershell
   npm run build
   ```

3. **Test:**
   ```powershell
   esnaad
   ```

4. **Type a message:**
   ```
   esnaad> hi
   ```

   Should now connect successfully without certificate errors!

## Security Considerations

### ❌ DO NOT in Production:
- Disable SSL verification (`NODE_TLS_REJECT_UNAUTHORIZED=0`)
- Ignore certificate warnings
- Use self-signed certificates

### ✅ DO in Production:
- Use valid SSL certificates from trusted CAs
- Keep certificates up to date
- Use proper certificate chains
- Enable SSL verification (default)

### ✅ OK in Development/Staging:
- Disable SSL verification temporarily
- Use self-signed certificates
- Add custom CA certificates

## Troubleshooting

### Error persists after adding NODE_TLS_REJECT_UNAUTHORIZED=0

**Check:**
1. `.env` file is in the project root (same directory as package.json)
2. Rebuilt the project: `npm run build`
3. No typos in the variable name
4. Restarted terminal/VS Code after adding

**Verify .env is loaded:**
```typescript
// Add temporary debug line in src/agent.ts
console.log('SSL Verification:', process.env.NODE_TLS_REJECT_UNAUTHORIZED);
```

### Different error: "certificate has expired"

The certificate is expired. Either:
1. Renew the certificate (recommended)
2. Temporarily disable verification (dev only)

### Different error: "hostname/IP doesn't match"

The certificate doesn't match the domain. Either:
1. Get a certificate for the correct domain
2. Access via the correct hostname
3. Temporarily disable verification (dev only)

## Environment-Specific Configurations

### Development
```env
NODE_TLS_REJECT_UNAUTHORIZED=0
OPENAI_API_BASE=https://localhost:8000/v1
```

### Staging
```env
NODE_TLS_REJECT_UNAUTHORIZED=0  # If using self-signed cert
OPENAI_API_BASE=https://esnaad-stg.domain1.org/api/chat/completions
```

### Production
```env
# No NODE_TLS_REJECT_UNAUTHORIZED - use default (enabled)
OPENAI_API_BASE=https://api.esnaad.com/v1
```

## Additional Resources

- [Node.js TLS Documentation](https://nodejs.org/api/tls.html)
- [OpenAI SDK Custom HTTP Client](https://github.com/openai/openai-node#custom-httpagent)
- [Let's Encrypt - Free SSL Certificates](https://letsencrypt.org/)

## Quick Reference

| Environment Variable | Purpose | Value |
|---------------------|---------|-------|
| `NODE_TLS_REJECT_UNAUTHORIZED` | Disable SSL verification | `0` (disable) or `1` (enable, default) |
| `NODE_EXTRA_CA_CERTS` | Add custom CA certificate | Path to .pem file |

## Example .env File

```env
# API Configuration
OPENAI_API_KEY=sk-your-key-here
OPENAI_API_BASE=https://esnaad-stg.domain1.org/api/chat/completions
OPENAI_MODEL=gpt-oss-120b

# SSL Configuration (staging environment with self-signed cert)
NODE_TLS_REJECT_UNAUTHORIZED=0

# Note: Remove NODE_TLS_REJECT_UNAUTHORIZED=0 when moving to production!
```

---

**Remember**: Always enable SSL verification in production. Disabling it makes your application vulnerable to man-in-the-middle attacks!
