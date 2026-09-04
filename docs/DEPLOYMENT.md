# Hexbuffer Build & Deployment Guide

This document explains the package scripts and deployment pipeline for both the **Hexbuffer Full Suite** and **Standalone Tool Applications**.

---

## 1. Quick Reference: Run Scripts in `package.json`

| Command | Action |
| :--- | :--- |
| `pnpm run deploy` | Auto-increments patch version, builds full suite, signs installer, and uploads to R2. |
| `pnpm run deploy -- --version 1.2.0` | Deploys Full Suite at an exact version (`1.2.0`). |
| `pnpm run deploy -- --target <name> --version 1.2.0` | Deploys a specific standalone target (`http`, `repeater`, `jwt`, `port-scanner`, `encoder`, `hash`) at an exact version. |
| `pnpm run build:app` | Builds the full suite locally without uploading to S3/R2 (`--no-upload`). |
| `pnpm run deploy -- --help` | Prints the full CLI flags documentation for deployment. |

---

## 2. Deploying Standalone Applications or Setting Version

You don't need multiple bump scripts. Pass the `--version` and optional `--target` arguments directly to `deploy`:

```bash
# Deploy full suite with exact version
pnpm run deploy -- --version 1.2.0

# Deploy standalone target with exact version
pnpm run deploy -- --target http --version 1.0.5
pnpm run deploy -- --target repeater --version 1.0.2
pnpm run deploy -- --target jwt --version 1.0.1
pnpm run deploy -- --target port-scanner --version 1.0.1
pnpm run deploy -- --target encoder --version 1.0.1
pnpm run deploy -- --target hash --version 1.0.1
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
