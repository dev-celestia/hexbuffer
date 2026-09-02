# Hexbuffer Build & Deployment Guide

This document explains the package scripts and deployment pipeline for both the **Hexbuffer Full Suite** and **Standalone Tool Applications**.

---

## 1. Quick Reference: Run Scripts in `package.json`

### A. Full Suite Deployment

| Command | Action | Output CDN Path |
| :--- | :--- | :--- |
| `pnpm deploy` | Auto-increments patch version, builds full suite native binary, signs installer, and uploads to R2. | `s3://${R2_BUCKET}/latest.json` |
| `pnpm build:app` | Builds the full suite locally without uploading to S3/R2 (`--no-upload`). | `src-tauri/target/release/bundle/` |
| `pnpm deploy:help` | Prints the full CLI flags documentation for deployment. | Terminal output |

### B. Standalone App Deployments

Each standalone command builds an isolated desktop application using its specific configuration in `src-tauri/targets/<target>.json`, signs it, and publishes it under its dedicated CDN subpath:

| Command | Target App | Target Config | Output CDN Path |
| :--- | :--- | :--- | :--- |
| `pnpm deploy:http` | **HTTP History** | `src-tauri/targets/http.json` | `s3://${R2_BUCKET}/targets/http/latest.json` |
| `pnpm deploy:repeater` | **Repeater** | `src-tauri/targets/repeater.json` | `s3://${R2_BUCKET}/targets/repeater/latest.json` |
| `pnpm deploy:jwt` | **JWT Analyzer** | `src-tauri/targets/jwt.json` | `s3://${R2_BUCKET}/targets/jwt/latest.json` |
| `pnpm deploy:port-scanner` | **Port Scanner** | `src-tauri/targets/port-scanner.json` | `s3://${R2_BUCKET}/targets/port-scanner/latest.json` |
| `pnpm deploy:encoder` | **Encoder** | `src-tauri/targets/encoder.json` | `s3://${R2_BUCKET}/targets/encoder/latest.json` |
| `pnpm deploy:hash` | **Hash Engine** | `src-tauri/targets/hash.json` | `s3://${R2_BUCKET}/targets/hash/latest.json` |

---

## 2. Version Bumping Scripts

Independent semantic versions can be incremented before deployment:

```bash
# Bump Full Suite (updates package.json, Cargo.toml, tauri.conf.json, VERSION)
pnpm bump:suite

# Bump specific standalone target (updates version in src-tauri/targets/<target>.json)
pnpm bump:http
pnpm bump:repeater
pnpm bump:jwt
pnpm bump:port-scanner
pnpm bump:encoder
pnpm bump:hash
```

To bump to an exact version:
```bash
./scripts/bump-version.sh --target http 1.2.0
```

---

## 3. Deployment Flags & Cross-Compilation

You can pass extra flags through `pnpm deploy`:

- **Deploy specific target with bump**:
  ```bash
  pnpm deploy -- --target http --bump
  ```
- **Set exact version & deploy**:
  ```bash
  pnpm deploy -- --target repeater --version 1.0.4
  ```
- **Cross-compile Windows binaries (x64) from macOS/Linux**:
  ```bash
  pnpm deploy -- --target http --windows
  ```
- **Cross-compile all Windows architectures (x64, x86, ARM64)**:
  ```bash
  pnpm deploy -- --windows-all
  ```
- **Build native platform + all Windows architectures**:
  ```bash
  pnpm deploy -- --all
  ```
- **Build without uploading (local test)**:
  ```bash
  pnpm deploy -- --target http --no-upload
  ```

---

## 4. Required Environment Variables

Deployment uses the credentials defined in `.env` (or CI/CD environment):

- `R2_ENDPOINT`: Cloudflare R2 S3-compatible API endpoint (e.g. `https://<account_id>.r2.cloudflarestorage.com`)
- `R2_BUCKET`: Target bucket name (e.g. `dist-0xbuffer`)
- `AWS_ACCESS_KEY_ID`: Cloudflare R2 access key
- `AWS_SECRET_ACCESS_KEY`: Cloudflare R2 secret key
- `UPDATER_BASE_URL`: Public download base URL (defaults to `https://dist.0xbuffer.com`)
- `TAURI_SIGNING_PRIVATE_KEY`: Minisign private key string for signing update manifests
