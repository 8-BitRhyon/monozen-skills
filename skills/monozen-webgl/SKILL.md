---
name: monozen-webgl
description: Monozen WebGL2 shader pipeline — __MzGL utilities, boot shaders, FoldGradient, PaperTexture, GemSmoke, context management, concurrent loop prevention. Use when working on shader effects, WebGL rendering, or paper-design integration for the Monozen portfolio.
---

# Monozen WebGL / Shader Pipeline

## Core Utilities (`__MzGL` in boot.js)
- `__MzGL.compileShader(gl, type, source)`
- `__MzGL.createProgram(gl, vsSource, fsSource)`
- `__MzGL.createFSQuad(gl)` — fullscreen quad VAO
- `__MzGL.getUniforms(gl, program, names)`

## Active Shaders

### 1. Warp Shader (`loader-canvas`)
- Renders during boot loader on non-split-screen path
- Killed on split-screen entry to avoid hidden-GPU drain

### 2. Hal-Eye Lens (`hal-eye`)
- Cursor-tracking lens, amber↔violet gradient across screen
- Render closure stored as `window.__halEyeRender`

### 3. BootBg Paper Dither (`boot-bg`)
- Bayer-dithered simplex noise background for split-screen
- Render closure stored as `window.__bootBgRender`

### 4. FoldGradient (`sun-shader.js`)
- Sun background: domain-warped light sheets
- `window.initSunShader()` returns dispose function
- Managed as `window.__sunDestroy`

### 5. ZT Paper Portrait (`paper-portrait.js`)
- UMD module: `ZT.createPaperPortrait(container, config)`
- WebGL2 Bayer dither + simplex noise distortion + grain
- Fallback: 2D canvas when WebGL2 unavailable
- Config: colorBack, colorFront, size, radius, contrast, grainMixer, etc.
- API: `init()`, `updateConfig()`, `dispose()`, `render()`
- `dispose()` hides canvas + stops rAF. `init()` restores.
- Used via `window.__paperPortrait`

### 6. @paper-design/shaders (`node_modules/@paper-design/shaders@0.0.77`)
- Apache 2.0, zero-dependency
- `ShaderMount` class — creates own `<canvas>` + WebGL2 context per instance
- Imports: `paperTextureFragmentShader`, `gemSmokeFragmentShader`, `ShaderMount`
- **PaperTexture**: replaces Sun Bayer dither. Static (speed=0), no rAF after setup.
- **GemSmoke**: theme transition overlay. Bounded instance, ~600ms lifetime.

## Context Management (Critical)
- Browsers cap concurrent WebGL contexts at ~8-16
- Each `@paper-design/shaders` ShaderMount creates its own context
- Merged loop pattern: bootBg + halEye share one `requestAnimationFrame` via `window.__splitMergeRaf`
- Cleanup in `selectTheme()` and `finishBoot()` kills all loops + destroys contexts via `WEBGL_lose_context`
- Split-screen flow: warp killed → individual bootBg/halEye loops killed → merged loop started

## Pending Integration
- PaperTexture: replace `applySunDither()` in sun-content.js with `new ShaderMount()` using `paperTextureFragmentShader`
- GemSmoke: wire into `boot.js` theme toggle as full-viewport overlay (diamond shape, ~400ms)
