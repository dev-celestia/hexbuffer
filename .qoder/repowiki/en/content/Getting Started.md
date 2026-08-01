# Getting Started with Apprecon

<cite>
**Referenced Files in This Document**
- [README.md](file://README.md)
- [install.sh](file://install.sh)
- [package.json](file://package.json)
- [Cargo.toml](file://src-tauri/Cargo.toml)
- [main.rs](file://src-tauri/src/main.rs)
- [App.tsx](file://src/App.tsx)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [What is Apprecon?](#what-is-apprecon)
3. [System Requirements](#system-requirements)
4. [Installation Guide](#installation-guide)
5. [Initial Setup](#initial-setup)
6. [Basic Usage](#basic-usage)
7. [Quick Start Guides](#quick-start-guides)
8. [Configuration](#configuration)
9. [Next Steps](#next-steps)

## Introduction

Apprecon is a modern, all-in-one security reconnaissance and development platform designed to streamline web security testing, API analysis, and development workflows. Built with cutting-edge technologies including Tauri for cross-platform desktop application support and React for a responsive user interface, Apprecon provides developers and security professionals with a comprehensive toolkit for analyzing web applications and APIs.

## What is Apprecon?

Apprecon serves as a unified platform that combines multiple security testing and development capabilities into a single, intuitive interface. The application integrates several key features:

- **HTTP Traffic Inspection**: Real-time monitoring and analysis of HTTP/HTTPS traffic
- **API Testing and Analysis**: Comprehensive tools for testing and debugging APIs
- **Browser Automation**: Automated browser interactions for security testing
- **Security Scanning**: Automated vulnerability detection and assessment
- **Development Workflow Integration**: Tools that enhance the development process

The platform is particularly valuable for security researchers, penetration testers, and developers who need to analyze web applications and APIs comprehensively.

## System Requirements

Before installing Apprecon, ensure your system meets the following requirements:

### Operating Systems
- Windows 10/11 (64-bit)
- macOS 10.15+ (Catalina or later)
- Linux distributions with GTK3 support

### Hardware Requirements
- Minimum 4GB RAM (8GB recommended)
- 2GB free disk space
- Modern multi-core processor

### Software Dependencies
- Node.js 18+ (for development builds)
- Rust toolchain (for building from source)
- Git (for version control)

## Installation Guide

### Quick Installation

The fastest way to get started with Apprecon is using the automated installation script:

```bash
# Download and run the installation script
curl -fsSL https://raw.githubusercontent.com/apprecon/apprecon/main/install.sh | bash
```

### Manual Installation

For those who prefer manual installation or need to customize the setup:

#### Prerequisites Installation

**On Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install -y build-essential curl git pkg-config libssl-dev libgtk-3-dev
```

**On macOS:**
```bash
brew install rust cargo nodejs
```

**On Windows:**
- Install Rust from rustup.rs
- Install Node.js from nodejs.org
- Install Visual Studio Build Tools

#### Building from Source

```bash
# Clone the repository
git clone https://github.com/apprecon/apprecon.git
cd apprecon

# Install dependencies
pnpm install

# Build the application
pnpm build

# Run the development server
pnpm dev
```

## Initial Setup

### First Launch

After successful installation, launch Apprecon from your applications menu or command line:

```bash
# On Unix-like systems
apprecon

# On Windows
apprecon.exe
```

### CA Certificate Setup

For HTTPS traffic inspection, you'll need to install the Apprecon CA certificate:

1. Launch Apprecon
2. Navigate to Settings → Security
3. Click "Install CA Certificate"
4. Follow the prompts for your operating system
5. Restart your browser after certificate installation

### Proxy Configuration

Apprecon includes a built-in proxy for traffic interception:

1. Open the Proxy settings
2. Configure the proxy port (default: 8080)
3. Enable HTTPS interception if needed
4. Apply the configuration

## Basic Usage

### Starting Your First Scan

1. **Launch Apprecon** and wait for the interface to load
2. **Configure Target**: Enter the URL you want to scan in the target field
3. **Set Scope**: Define which domains should be included in the scan
4. **Start Scan**: Click the "Start Scan" button
5. **Monitor Results**: Watch the live results as they appear

### Using the HTTP Inspector

To inspect HTTP traffic:

1. **Enable Proxy**: Turn on the proxy feature
2. **Configure Browser**: Set your browser to use Apprecon's proxy
3. **Browse Normally**: Navigate through your target website
4. **Analyze Requests**: View captured requests in the inspector tab

### API Testing with Repeater

The Repeater tool allows you to craft and send custom requests:

1. **Open Repeater**: Navigate to the Repeater tab
2. **Craft Request**: Build your HTTP request with headers, body, and parameters
3. **Send Request**: Click "Send" to execute the request
4. **Analyze Response**: Review the response details and status codes

## Quick Start Guides

### HTTP Traffic Inspection

**Objective**: Capture and analyze HTTP/HTTPS traffic

**Steps**:
1. Start Apprecon and enable the proxy
2. Configure your browser to use the local proxy
3. Navigate to your target website
4. Observe captured requests in real-time
5. Filter and search through traffic as needed

### API Testing Workflow

**Objective**: Test and debug REST APIs

**Steps**:
1. Use the Invoker tool to send test requests
2. Modify headers, parameters, and request bodies
3. Save frequently used requests to collections
4. Automate repetitive testing tasks
5. Export results for reporting

### Browser Automation

**Objective**: Automate browser interactions for security testing

**Steps**:
1. Navigate to the Browser Automation section
2. Create a new automation script
3. Define actions like clicks, form submissions, and navigation
4. Execute the automation sequence
5. Monitor results and logs

## Configuration

### Environment Variables

Apprecon supports various environment variables for customization:

- `APPRECON_PROXY_PORT`: Custom proxy port number
- `APPRECON_LOG_LEVEL`: Logging verbosity level
- `APPRECON_DATA_DIR`: Custom data directory path
- `APPRECON_DEBUG_MODE`: Enable debug logging

### Preferences and Settings

Access the settings panel to configure:

- **UI Preferences**: Theme, language, and display options
- **Proxy Settings**: Port configuration and SSL options
- **Security Settings**: Certificate management and encryption options
- **Performance Tuning**: Resource limits and caching preferences

### Advanced Configuration

For advanced users, Apprecon supports:

- Custom plugin development
- Integration with external tools via API
- Configurable scanning profiles
- Custom rule definitions for vulnerability detection

## Next Steps

Now that you have Apprecon installed and running, explore these advanced features:

### Explore Core Features

- **Live Traffic Analysis**: Deep dive into network traffic patterns
- **Vulnerability Scanning**: Configure and run automated security scans
- **API Collection Management**: Organize and share API test collections
- **Automation Workflows**: Create complex testing scenarios

### Integration and Extensibility

- **Plugin Development**: Extend functionality with custom plugins
- **API Integration**: Connect with other security tools
- **CI/CD Pipeline**: Integrate scanning into your development workflow
- **Custom Rules**: Develop specialized detection rules

### Community and Support

- **Documentation**: Explore the comprehensive documentation
- **Community Forums**: Join discussions and share experiences
- **Issue Reporting**: Report bugs and suggest improvements
- **Contributing**: Contribute to the open-source project

---

**Note**: This getting started guide provides a foundation for using Apprecon. As you become more familiar with the platform, consult the detailed documentation for advanced features and configuration options.

**Section sources**
- [README.md:1-50](file://README.md#L1-L50)
- [install.sh:1-100](file://install.sh#L1-L100)
- [package.json:1-50](file://package.json#L1-L50)
- [Cargo.toml:1-30](file://src-tauri/Cargo.toml#L1-L30)
- [main.rs:1-50](file://src-tauri/src/main.rs#L1-L50)
- [App.tsx:1-30](file://src/App.tsx#L1-L30)