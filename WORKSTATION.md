# Monozen Workstation — Terminal Stack

Terminal multiplexer + theme setup: **Ghostty + tmux + catppuccin-tmux**.
Modeled on [omerxx/dotfiles](https://github.com/omerxx/dotfiles) but adapted for
**tmux 3.7b** and **Ghostty 1.3.1** (both have breaking changes vs. his newer setup).

"Tabs" are **tmux windows** rendered as Catppuccin pills in the status bar — not
Ghostty's native tab bar.

## Components
- **Ghostty** — terminal emulator (transparent, blurred, non-native fullscreen)
- **tmux 3.7b** — multiplexer
- **catppuccin-tmux** — status bar / pill theme (mocha flavor)
- **TPM** — plugin manager (kept for manual `prefix + I`)
- **herdr** — agent multiplexer (separate concern; see FEDERATION.md)

## Files
| File | Purpose |
|------|---------|
| `~/.config/ghostty/config` | Ghostty: blur, fullscreen, no `command` |
| `~/.tmux.conf` | tmux: catppuccin, prefix `^A`, tab/pane binds |
| `~/.tmux/plugins/{tpm,catppuccin-tmux,tmux-{resurrect,continuum,sensible,yank,sessionx}}` | plugins |
| `~/.zshrc` | auto-starts tmux (`attach main || new main`) |
| `~/.secrets.zsh` | API keys, `chmod 600`, sourced by `.zshrc` |
| `~/.config/aerospace/aerospace.toml` | AeroSpace tiling WM config (omerxx-style fullscreen) |

## Key gotchas (the hard-won part)

1. **tmux 3.7b removed the `current_file` format variable.** catppuccin-tmux
   can't locate its theme/status files → `@thm_*` colors empty →
   `invalid style: bg=` errors. Fix: patch the plugin's
   `source -F "#{d:current_file}/..."` paths to absolute in
   `~/.tmux/plugins/catppuccin-tmux/*.conf`. (Lost if you `prefix + U` re-clone.)

2. **TPM's auto-loader is unreliable on 3.7b.** Load catppuccin explicitly via
   `run "/abs/path/catppuccin.tmux"` in `~/.tmux.conf` (after the `@plugin` lines).

3. **Ghostty `command` is wrapped through a login shell**
   (`/usr/bin/login … bash -c "exec -l …"`) that mangles shell operators (`||`)
   into a malformed single command → "failed to launch the requested command."
   Do **not** launch tmux via Ghostty `command`. Auto-start from `~/.zshrc`:
   ```sh
   if [[ -o interactive ]] && [[ -z "$TMUX" ]]; then
     /opt/homebrew/bin/tmux attach -t main || /opt/homebrew/bin/tmux new -s main
   fi
   ```
   (absolute path — GUI-launched Ghostty has no Homebrew in `PATH`)

4. **Fullscreen transparency:** `background-blur = "macos-glass-regular"`
   (Apple vibrancy) renders **opaque** in fullscreen. Use
   `background-blur-radius = 20` + `background-opacity = 0.85` +
   `window-decoration = false` + `macos-non-native-fullscreen = true`.
   Boot into it with `fullscreen = "non-native"` (**NOT** `"true"` = native,
   which kills transparency). omerxx achieves the same via **Aerospace**
   fullscreen, not Ghostty's.

5. **Tabs = tmux windows** (Catppuccin pills), not Ghostty native tabs.
   Ghostty native tabs require `window-decoration = true` and are off by design.
   Prefix `Ctrl-A`: `Ctrl-A c` new tab · `Ctrl-A n`/`p` switch ·
   `Ctrl-A |`/`-` split · `Ctrl-A z` zoom (adds `` glyph to the pill).

6. **API keys:** keep out of `~/.zshrc`; store in `~/.secrets.zsh`
   (`chmod 600`), sourced by `.zshrc`. Rotate any key that was ever in plaintext.

7. **fzf is required by `tmux-sessionx`.** Install via `brew install fzf` before
   using the session picker (`Ctrl-A s`).

8. **Aerospace fullscreen replaces Ghostty fullscreen.** omerxx uses Aerospace
   for fullscreen (which keeps transparency alive via tiling, not native
   macOS fullscreen). Install: `brew install --cask nikitabobko/aerospace/aerospace`.
   Config: `~/.config/aerospace/aerospace.toml`. Bind: `alt-ctrl-shift-f`.

## Prefix / tab cheat sheet
| Key | Action |
|-----|--------|
| `Ctrl-A c` | new tab (pill) |
| `Ctrl-A n` / `Ctrl-A p` | next / previous tab |
| click a pill | switch tab |
| `Ctrl-A \|` / `Ctrl-A -` | split horizontal / vertical |
| `Ctrl-A z` | zoom pane (pill shows ``) |
| `Ctrl-A r` | reload `~/.tmux.conf` |
