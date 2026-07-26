# WORKSTATION  -  Diagnostic

Terminal multiplexer stack: **Ghostty → tmux → herdr**.
Adapted from [omerxx/dotfiles](https://github.com/omerxx/dotfiles) for **tmux 3.7b**,
**Ghostty 1.3.1**, **herdr**.

Tabs are **tmux windows** rendered as Catppuccin pills  -  not Ghostty native tabs.

---

## Pipeline

```mermaid
flowchart LR
    subgraph HARDWARE["Hardware"]
        G[Ghostty]
    end

    subgraph MULTIPLEXER["Multiplexer"]
        T[tmux + catppuccin pills]
        H[herdr agent multiplexer]
    end

    subgraph RUNTIME["Agent Runtime"]
        KC[Kilo / Claude Code]
        LG[lazygit]
        NV[nvim]
    end

    subgraph SHELL["Zsh Shell"]
        FZ[fzf]
        ZD[zoxide]
        EZ[eza]
        BT[bat]
        RG[ripgrep]
        FD[fd]
        DL[delta]
        YZ[yazi]
        ZA[zsh-autosuggestions]
        ZH[zsh-syntax-highlighting]
    end

    subgraph REMOTE["Remote"]
        GH[GitHub]
    end

    G -->|spawns| T
    T -->|hosts| H
    H -->|dispatches| KC
    KC -->|queries| SHELL
    KC -->|stages via| LG
    KC -->|edits via| NV
    LG -->|pushes to| REMOTE
    NV -.->|may invoke| LG
```

### Layout

```
herdr agent tab bar  -  top
──────────────────────────────
[agent panes  -  Kilo, Claude Code]
──────────────────────────────
tmux Catppuccin pills  -  bottom
   #W █ #N     session     ~/dir 
```

---

## Stack

| Layer | Component | Function |
|-------|-----------|----------|
| Terminal | Ghostty | GPU-accelerated terminal, transparent, non-native fullscreen |
| Multiplexer | tmux | Window/pane manager, Catppuccin pill status bar |
| Multiplexer | herdr | AI agent workspace multiplexer |
| Editor | nvim | Code editor  -  Lazy.nvim, Catppuccin, Telescope, LSP |
| Git UI | lazygit | Terminal git interface |
| Directory jump | zoxide | Frequency-ranked path resolution |
| Fuzzy finder | fzf | File, history, process, git matching |
| Code search | ripgrep | Pattern search across working tree |
| File find | fd | Filesystem traversal |
| File list | eza | Directory listing with icons, tree, permissions |
| File preview | bat | Syntax highlighting, git change markers |
| File manager | yazi | TUI file manager, async I/O, inline previews, fzf integration |
| Diff viewer | delta | Git diff pager, side-by-side, line numbers |
| History autosuggest | zsh-autosuggestions | History-driven inline completion |
| Syntax validation | zsh-syntax-highlighting | Token-color mapping on input |
| Package | Homebrew | macOS package resolution |

---

## Files

| Path | Role |
|------|------|
| `~/.config/ghostty/config` | Ghostty  -  blur radius, opacity, non-native fullscreen, no `command` |
| `~/.tmux.conf` | tmux  -  omerxx catppuccin fork, prefix `^A`, vim-style pane nav |
| `~/.zshrc` | Shell init  -  toolchain aliases, fzf, zoxide, tmux auto-start |
| `~/.gitconfig` | Git  -  delta pager, nvim editor, zdiff3 merge, gpgsign |
| `~/.gitignore_global` | Global gitignore  -  macOS, editor, build artifacts, secrets |
| `~/.config/lazygit/config.yml` | LazyGit  -  dark theme, delta pager, nvim |
| `~/.config/nvim/init.lua` | Neovim  -  Lazy.nvim, Catppuccin, Telescope, LSP |
| `~/.secrets.zsh` | API keys, `chmod 600`, sourced by `.zshrc` |
| `dotfiles/` (this repo) | Reference configs |

### tmux plugins

```
~/.tmux/plugins/
├── tpm                    # Plugin lifecycle
├── catppuccin-tmux        # omerxx/catppuccin-tmux fork
├── tmux-resurrect         # Session serialization
├── tmux-continuum         # Auto-save 15min interval, auto-restore
├── tmux-sensible          # Baseline settings
├── tmux-yank              # Clipboard bridge
└── tmux-sessionx          # omerxx fork, fzf session picker
```

### herdr plugins

| Plugin | Function |
|--------|----------|
| Tab Auto-Rename | Tab label ← focused pane directory |
| Herdr Plus | Project templates, quick action launcher |
| Spreader | YAML layout application |
| reviewr | Terminal code-review sidebar |
| Focus Notify | Native macOS toast on agent blocked/done; click-to-focus pane |
| Freebuff Plugin | Launch/manage Freebuff agent; lifecycle watcher reports blocked/working/idle |
| Command Code Plugin | Launch/manage Command Code agent; cmd-hooks report status events |
| Worktrunk | Git worktree management inside herdr (per-agent isolation) |
| Worktree Setup | Per-project setup (.env, mise) when worktrees created |
| Herdr Resurrect | Snapshot/restore workspace, tab, pane, agent layout |
| herdr-triage | Attention ranking (blocked first) | Installed |
| herdr-attention | Jump to agent needing input | Installed |
| llmtrim | ⚠️ LLM token proxy  -  intercepts agent API calls. See gotcha #9. |
| GitHub Start | Tab origin from GitHub issue/PR |
| File Viewer | Git-aware read-only file tree |
| Vim Navigation | Ctrl+h/j/k/l bridging herdr panes ↔ nvim |

---

## Gotchas

### 1. Use `omerxx/catppuccin-tmux` fork, not upstream `catppuccin/tmux`
Upstream fill/color handling produces a blacked-out tab bar background. omerxx's
fork renders correctly. The fork also avoids the `current_file` format variable
bug on tmux 3.7b  -  no manual patching required.

### 2. Tmux plugins require explicit `run` lines on 3.7b
catppuccin, sensible, yank, resurrect, continuum, and sessionx are loaded via
`run` lines, not TPM `@plugin` declarations. TPM's auto-loader is unreliable
on 3.7b. Re-cloning plugins without the `run` lines produces silent load
failure.

### 3. tmux status bar at bottom  -  herdr panel at top
herdr's agent panel occupies the top line. `status-position top` causes
Catppuccin pills to collide with herdr's UI. `status-position bottom`
separates them.

### 4. Ghostty `command` is wrapped through a login shell
`/usr/bin/login … bash -c "exec -l …"` mangles shell operators (`||`) into a
malformed single command → `failed to launch the requested command`. Do not
launch tmux via Ghostty `command`. Auto-start from `~/.zshrc`:
```sh
if [[ -o interactive ]] && [[ -z "$TMUX" ]]; then
  /opt/homebrew/bin/tmux attach -t main || /opt/homebrew/bin/tmux new -s main
fi
```
(Absolute path required  -  GUI-launched Ghostty does not resolve Homebrew PATH.)

### 5. Fullscreen transparency
`background-blur = "macos-glass-regular"` renders opaque in fullscreen.
Required settings:
- `background-blur-radius = 20`
- `background-opacity = 0.85`
- `window-decoration = false`
- `macos-non-native-fullscreen = true`

Boot with `fullscreen = "non-native"`. `fullscreen = "true"` enables native
fullscreen, which kills transparency.

### 6. fzf required by `tmux-sessionx`
Install: `brew install fzf`. Session picker: `Ctrl-A o`.

### 7. API keys
Keys stored in `~/.secrets.zsh` (`chmod 600`), sourced by `.zshrc`. Never
written to `.zshrc`. Global `.gitignore` excludes `.secrets.zsh` as
belt-and-suspenders. Rotate any key that was ever in plaintext.

### 8. GPG commit signing
Signed commits verify authorship. Procedure:
```sh
brew install gnupg
gpg --quick-generate-key "Your Name <email>" rsa3072 sign 0
gpg --list-secret-keys --keyid-format=long
git config user.signingkey <key-id>
git config commit.gpgsign true
git config tag.gpgsign true
```
Register public key on GitHub → Settings → SSH and GPG keys → New GPG key.
```sh
gpg --armor --export <key-id> | pbcopy
```

### 9. �️ llmtrim  -  local MITM proxy
The llmtrim plugin intercepts all LLM API calls from agent panes to compress
token usage. It runs locally, never phones home, but it sees every API key and
prompt passing through herdr agent panes. Understand the interception surface
before enabling.

### 10. Plugin security audit
`herdr-freebuff-plugin` (TheMetalStorm) and `herdr-commandcode-plugin` (TheMetalStorm) were audited: no malicious code, no prompt injection, no external exfiltration. Both modify only expected paths (`~/.local/bin/freebuff`, `~/.config/manicode/projects/*/chats/`, `~/.commandcode/settings.json`). Taste files in commandcode are agent behavior instructions, not hidden prompts. Safe to install.

---

## Fresh machine install

```sh
# Terminal + multiplexer
brew install --cask ghostty
brew install tmux

# tmux plugins
git clone https://github.com/tmux-plugins/tpm ~/.tmux/plugins/tpm
git clone https://github.com/omerxx/catppuccin-tmux ~/.tmux/plugins/catppuccin-tmux
git clone https://github.com/omerxx/tmux-sessionx ~/.tmux/plugins/tmux-sessionx
git clone https://github.com/tmux-plugins/tmux-resurrect ~/.tmux/plugins/tmux-resurrect
git clone https://github.com/tmux-plugins/tmux-continuum ~/.tmux/plugins/tmux-continuum
git clone https://github.com/tmux-plugins/tmux-sensible ~/.tmux/plugins/tmux-sensible
git clone https://github.com/tmux-plugins/tmux-yank ~/.tmux/plugins/tmux-yank

# CLI toolchain
brew install neovim lazygit zoxide bat eza fd ripgrep delta fzf yazi gnupg zsh-autosuggestions zsh-syntax-highlighting
$(brew --prefix)/opt/fzf/install

# Deploy configs from this repo's dotfiles/
cp dotfiles/tmux.conf ~/.tmux.conf
cp dotfiles/zshrc.template ~/.zshrc
cp dotfiles/gitconfig ~/.gitconfig
cp dotfiles/gitignore_global ~/.gitignore_global
mkdir -p ~/.config/lazygit ~/.config/nvim
cp dotfiles/lazygit/config.yml ~/.config/lazygit/config.yml
cp dotfiles/nvim/init.lua ~/.config/nvim/init.lua

# Initialize tmux, install plugins via TPM
tmux new -s main
# Ctrl-A I to install
```

---

## Prefix reference

| Sequence | Action |
|----------|--------|
| `Ctrl-A c` | new tab |
| `Ctrl-A H` / `Ctrl-A L` | previous / next tab |
| `Ctrl-A o` | session picker (fzf) |
| click pill | switch tab |
| `Ctrl-A s` / `Ctrl-A v` | split horizontal / vertical |
| `Ctrl-A z` | zoom pane |
| `Ctrl-A h/j/k/l` | pane navigation |
| `Ctrl-A r` | reload `~/.tmux.conf` |
| `Ctrl-A P` | toggle pane borders |
| `Ctrl-A I` | install / verify plugin checksums |
| `Ctrl-A x` | kill pane |

---

## Git operations

```sh
git diff           # delta pager, side-by-side
git log --oneline  # delta decorations
lazygit            # interactive staging, commit, push
rg "pattern"       # code search
fd "filename"      # file search
yy                 # yazi file manager (cd into dir on quit)
Ctrl-T / Ctrl-R / Alt-C  # fzf: file, history, directory
z proj             # directory jump → Projects
z portf            # directory jump → Portfolio
```

---

## Agent execution verification (heterogeneous agents)

Every agent (Kilo, Aider, Crush, Freebuff, Antigravity CLI) must actually use the built/downloaded toolchain. Verify per agent:

| Layer | What to verify | How |
|---|---|---|
| Agent discovery | Plugin detects agent | `herdr pane list` shows agent label |
| Lifecycle hooks | Agent reports blocked/working/idle | Watch pane status; `focus-notify` fires toast |
| Context access | Agent can invoke fzf/fd/rg/yazi/bat | Test from agent pane: `rg "test"`, `yy`, `fd .` |
| Workspace isolation | Worktree per agent pane | `herdr plugin pane open --plugin worktrunk ...` |
| Session persistence | Layout survives restart | `herdr-resurrect` saves; restart tmux/herdr and restore |
| Plugin audit | Installed safely | Security audit on `freebuff` (`scripts/launch.sh`, `watcher-lib.sh`) and `commandcode` (`cmd-hooks/install-hooks.mjs`, `.commandcode/taste/`) - no malicious network/filesystem access, taste files are behavior instructions not hidden prompts |
