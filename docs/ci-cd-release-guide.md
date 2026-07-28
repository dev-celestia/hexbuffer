# Automated Builds & CI/CD Release Guide

This guide explains how automated builds, cross-platform packaging, and GitHub Releases are configured and executed for **Hexbuffer** (`apprecon`).

---

## 1. Overview

Hexbuffer utilizes **GitHub Actions** for continuous integration (CI) and automated release deployment (CD). Every push to `main` or a release tag (`v*`) triggers automated workflows that validate, build, package, and publish downloadable desktop binaries across Linux, macOS, and Windows.

```
[ Git Push / Tag v* ] ──> [ GitHub Actions ]
                               │
       ┌───────────────────────┼───────────────────────┐
       ▼                       ▼                       ▼
 [ Linux Build ]        [ macOS Build ]        [ Windows Build ]
 (AppImage & .deb)       (.dmg & .app.tar.gz)       (.exe NSIS)
       │                       │                       │
       └───────────────────────┼───────────────────────┘
                               ▼
                [ Publish GitHub Release ]
```

---

## 2. CI/CD Workflow Architecture

The primary workflow is defined in [`.github/workflows/build.yml`](file:///Users/arham/Desktop/project/apprecon/.github/workflows/build.yml).

### Workflow Triggers

The pipeline runs automatically under the following conditions:
- **Push to Main/Master**: Runs matrix compilation to ensure code builds cleanly across all platforms.
- **Pushing a Tag (`v*`)**: Compiles binaries and automatically creates a published GitHub Release.
- **Pull Requests**: Validates cross-platform compilation without publishing releases.
- **Manual Dispatch (`workflow_dispatch`)**: Allows manual triggering from the GitHub Actions dashboard.

---

## 3. Multi-Platform Matrix Configuration

The build matrix compiles native bundles for three operating environments:

| Platform | Runner Environment | Output Artifacts |
| :--- | :--- | :--- |
| **Linux** | `ubuntu-22.04` | `.AppImage`, `.deb` package |
| **macOS** | `macos-latest` | `.dmg` installer, `.app.tar.gz` bundle |
| **Windows** | `windows-latest` | `.exe` NSIS installer |

---

## 4. How to Create an Automated Release

To trigger an automated build and publish a new versioned release on your GitHub repository:

### Step 1: Commit and Push Code Changes
Ensure all latest code and workflow files are committed to `main`:
```bash
git add .
git commit -m "prepare v1.2.7 release"
git push origin main
```

### Step 2: Create and Push a Version Tag
Create a semantic version tag starting with `v` (e.g., `v1.2.7`):
```bash
# Create local tag
git tag v1.2.7

# Push tag to GitHub
git push origin v1.2.7
```

### Step 3: Monitor Release Progress
1. Open your repository on GitHub and navigate to the **Actions** tab.
2. Select the running **Build & Generate Artifacts** workflow.
3. Once matrix builds complete on Linux, macOS, and Windows, the **Create Automated GitHub Release** step creates a new release entry under the repository's **Releases** page with compiled installer packages attached.

---

## 5. Environment Secrets & Signing Configurations

To configure code signing or custom API keys in GitHub Actions, add the following repository secrets under **Settings > Secrets and variables > Actions**:

* `TAURI_SIGNING_PRIVATE_KEY`: Private key for Tauri application auto-updater signing.
* `GITHUB_TOKEN`: Provided automatically by GitHub Actions to create and publish releases.

---

## 6. Local Build Verification

Before pushing release tags, you can verify builds locally:

```bash
# Install dependencies
pnpm install

# Test web frontend build
pnpm build

# Test Tauri desktop compilation locally
pnpm tauri build
```
