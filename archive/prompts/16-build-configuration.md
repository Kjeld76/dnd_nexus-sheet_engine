# Prompt 16: Build Configuration

```
Configure production build in src-tauri/tauri.conf.json:

1. Bundle settings:
   - targets: ["msi", "nsis"]
   - icon: assets/icon.ico
   - resources: ["assets/*"]

2. Windows settings:
   - certificateThumbprint: null (for now)
   - digestAlgorithm: sha256
   - webviewInstallMode: embedBootstrapper

3. Identifier: com.dndnexus.app
4. Version: 1.0.0
5. productName: "D&D Nexus"

6. Add build scripts to package.json:
   - "build": "vite build && tauri build"
   - "build:msi": "tauri build --bundles msi"
   - "build:nsis": "tauri build --bundles nsis"

7. Create assets/icon.ico (1024x1024)
```






