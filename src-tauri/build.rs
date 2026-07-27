use std::env;
use std::fs;
use std::path::Path;

fn main() {
    // Ensure target sidecar binary exists so tauri_build doesn't fail when building on CI or platforms missing pre-built sidecars
    if let Ok(target) = env::var("TARGET") {
        let ext = if target.contains("windows") { ".exe" } else { "" };
        let sidecar_name = format!("binaries/ai-engine-{}{}", target, ext);
        let sidecar_path = Path::new(&sidecar_name);

        if !sidecar_path.exists() {
            if let Some(parent) = sidecar_path.parent() {
                let _ = fs::create_dir_all(parent);
            }
            let _ = fs::write(sidecar_path, "#!/bin/sh\necho 'ai-engine stub'\n");
            #[cfg(unix)]
            {
                use std::os::unix::fs::PermissionsExt;
                let _ = fs::set_permissions(sidecar_path, fs::Permissions::from_mode(0o755));
            }
        }
    }

    tauri_build::build();
}
