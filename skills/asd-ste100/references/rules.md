# ASD-STE100 Rules Reference Guide

This document provides complete specification details, approved vocabulary replacements, and sentence decomposition patterns for ASD-STE100 (Simplified Technical English).

---

## 1. Zero Tolerance Punctuation Rules

### 1.1 Zero Em Dashes and Zero En Dashes
- Never use em dashes under any circumstance.
- Never use en dashes under any circumstance.
- **Replacements**:
  - **Introductions and Definitions**: Use a colon (`:`).
    - Non-STE: `The daemon manages agents  -  background worker processes.`
    - STE: `The daemon manages agents: background worker processes.`
  - **Parenthetical Details**: Use parentheses `(...)`.
    - Non-STE: `The tiling manager  -  configured with spring physics  -  runs on macOS.`
    - STE: `The tiling manager (configured with spring physics) runs on macOS.`
  - **Secondary Thoughts**: Split into separate sentences.
    - Non-STE: `Run setup.sh  -  it installs the service.`
    - STE: `Run setup.sh. The script installs the service.`
  - **Ranges**: Use `to` or `through`.
    - Non-STE: `Layers 1-153; 35%-100%`
    - STE: `Layers 1 through 153; 35% to 100%`
  - **Compound Modifiers**: Use a standard ASCII hyphen (`-`).

### 1.2 Other Punctuation Rules
- **Exclamation Marks**: Never use exclamation marks in technical texts.
- **Semicolons**: Avoid semicolons. Split into separate declarative sentences.
- **Slashes**: Avoid slashes in prose. Write `or` or `and`. Slashes are permitted in file paths and CLI flags only.

---

## 2. Sentence Length Limits

- **Procedural / Instructional**: Maximum 20 words.
- **Descriptive / Conceptual**: Maximum 25 words.
- **Paragraphs**: Maximum 6 sentences.

---

## 3. Approved Vocabulary Table

| Non-STE Word / Phrase | Approved STE Replacement | Approved Example |
|---|---|---|
| `utilize`, `leverage`, `employ` | **use** | Use the CLI tool to inspect state. |
| `display`, `exhibit`, `indicate` | **show** | The HUD shows agent status. |
| `initiate`, `commence` | **start** | Start the background service. |
| `terminate`, `abort`, `halt` | **stop** | Stop the active process. |
| `modify`, `alter` | **change** | Change the column width preset. |
| `transmit`, `dispatch` | **send** | Send the keystroke to the shell. |
| `retrieve`, `acquire`, `obtain` | **get** | Get the process status. |
| `sanitize`, `purge` | **clean** | Clean the transcript text. |
| `in order to` | **to** | Run the command to build the binary. |
| `due to the fact that` | **because** | The build failed because the file was missing. |
| `as well as` | **and** | Supports Ghostty and Antigravity IDE. |

---

## 4. Banned Buzzwords

Never use subjective marketing jargon in technical documents:
- `seamless` / `seamlessly`
- `blazing fast`
- `out of the box`
- `state of the art`
- `game changer`
- `robust`
- `effortless`
- `overall`

Replace these terms with concrete performance numbers or direct descriptions.
