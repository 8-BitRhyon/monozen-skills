#!/usr/bin/env bash
# scripts/test.sh - Self-tests proving that validate.sh catches every repo contract
# violation. Each test runs against an isolated fixture copy of the repository, so
# the real repo is never mutated. Exit 0 iff every test passes.
#
# Usage: npm test   (or)   bash scripts/test.sh

set -uo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

PASS=0
FAIL=0

# run_test <name> <expected_rc: 0|1> <grep pattern or ''> -- <mutation commands...>
run_test() {
  local name="$1" expect="$2" pattern="$3"
  shift 3
  [ "$1" = "--" ] && shift

  local out rc
  if (
    FIXTURE_DIR="$(mktemp -d)"
    cp -R "${REPO_DIR}" "${FIXTURE_DIR}/repo" || exit 2
    cd "${FIXTURE_DIR}/repo" || exit 2
    "$@" >/dev/null 2>&1 || true
    out="$(npm run validate 2>&1)"
    rc=$?
    rm -rf "${FIXTURE_DIR}"

    if [ "${expect}" = "0" ]; then
      if [ ${rc} -eq 0 ]; then
        echo "[TEST PASS] ${name}"
        exit 0
      fi
      echo "[TEST FAIL] ${name} (rc=${rc}, expected 0)"
      printf '%s\n' "${out}" | tail -5
      exit 1
    fi

    if [ ${rc} -ne 0 ]; then
      if [ -z "${pattern}" ]; then
        echo "[TEST PASS] ${name}"
        exit 0
      fi
      if printf '%s' "${out}" | grep -q "${pattern}"; then
        echo "[TEST PASS] ${name}"
        exit 0
      fi
      echo "[TEST FAIL] ${name} (rc=${rc}, missing pattern '${pattern}')"
    else
      echo "[TEST FAIL] ${name} (rc=0, expected failure with pattern '${pattern}')"
    fi
    exit 1
  ); then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
  fi
}

# --- mutation helpers -------------------------------------------------------

mutate_noop() { :; }

mutate_invalid_yaml() {
  mkdir -p skills/z-x
  printf -- '---\nname: "unclosed\ndescription: x\n---\n' > skills/z-x/SKILL.md
  node -e 'const fs=require("fs"),c=require("crypto");const f=require("./skills-lock.json");f.skills["z-x"]={name:"z-x",description:"x",source:"8-BitRhyon/monozen-skills",sourceType:"github",skillPath:"skills/z-x/SKILL.md",computedHash:c.createHash("sha256").update(fs.readFileSync("skills/z-x/SKILL.md")).digest("hex")};fs.writeFileSync("skills-lock.json",JSON.stringify(f,null,2)+"\n")'
}

mutate_no_frontmatter() {
  mkdir -p skills/z-x
  printf -- '# Hello\n\nname: z-x\n\ndescription: body text, not frontmatter\n' > skills/z-x/SKILL.md
  node -e 'const fs=require("fs"),c=require("crypto");const f=require("./skills-lock.json");f.skills["z-x"]={name:"z-x",description:"x",source:"8-BitRhyon/monozen-skills",sourceType:"github",skillPath:"skills/z-x/SKILL.md",computedHash:c.createHash("sha256").update(fs.readFileSync("skills/z-x/SKILL.md")).digest("hex")};fs.writeFileSync("skills-lock.json",JSON.stringify(f,null,2)+"\n")'
}

mutate_empty_name() {
  mkdir -p skills/z-x
  printf -- '---\nname:\ndescription: x\n---\n' > skills/z-x/SKILL.md
  node -e 'const fs=require("fs"),c=require("crypto");const f=require("./skills-lock.json");f.skills["z-x"]={name:"",description:"x",source:"8-BitRhyon/monozen-skills",sourceType:"github",skillPath:"skills/z-x/SKILL.md",computedHash:c.createHash("sha256").update(fs.readFileSync("skills/z-x/SKILL.md")).digest("hex")};fs.writeFileSync("skills-lock.json",JSON.stringify(f,null,2)+"\n")'
}

mutate_name_mismatch() {
  mkdir -p skills/z-x
  printf -- '---\nname: wrong-name\ndescription: x\n---\n' > skills/z-x/SKILL.md
  node -e 'const fs=require("fs"),c=require("crypto");const f=require("./skills-lock.json");f.skills["z-x"]={name:"wrong-name",description:"x",source:"8-BitRhyon/monozen-skills",sourceType:"github",skillPath:"skills/z-x/SKILL.md",computedHash:c.createHash("sha256").update(fs.readFileSync("skills/z-x/SKILL.md")).digest("hex")};fs.writeFileSync("skills-lock.json",JSON.stringify(f,null,2)+"\n")'
}

mutate_em_dash_md() {
  # octal escapes (portable to bash 3.2 on macOS): \342\200\224 = UTF-8 em dash
  printf '\nThis line has an em dash - no wait, here: \342\200\224 should be caught.\n' >> README.md
}

mutate_em_dash_json() {
  node -e 'const fs=require("fs");const f=require("./skills-lock.json");const k=Object.keys(f.skills)[0];f.skills[k].description += " \u2014 bad";fs.writeFileSync("skills-lock.json",JSON.stringify(f,null,2)+"\n")'
}

mutate_users_path_md() {
  printf '\nReference: /Users/rhyon/something local\n' >> README.md
}

mutate_file_uri() {
  printf '\nOpen file:///Users/rhyon/foo for details\n' >> FEDERATION.md
}

mutate_missing_lock_entry() {
  mkdir -p skills/z-x
  printf -- '---\nname: z-x\ndescription: x\n---\n' > skills/z-x/SKILL.md
}

mutate_orphan_lock_entry() {
  node -e 'const fs=require("fs");const f=require("./skills-lock.json");f.skills["z-orphan"]={name:"z-orphan",description:"x",source:"8-BitRhyon/monozen-skills",sourceType:"github",skillPath:"skills/z-orphan/SKILL.md",computedHash:"deadbeef"};fs.writeFileSync("skills-lock.json",JSON.stringify(f,null,2)+"\n")'
}

mutate_stale_hash() {
  node -e 'const fs=require("fs"),c=require("crypto");const f=require("./skills-lock.json");const k=Object.keys(f.skills)[0];f.skills[k].computedHash=c.createHash("sha256").update("tampered").digest("hex");fs.writeFileSync("skills-lock.json",JSON.stringify(f,null,2)+"\n")'
}

mutate_broken_link() {
  printf '\n- [ghost skill](skills/ghost-skill/SKILL.md)\n' >> README.md
}

mutate_federation_count_drift() {
  node -e 'const fs=require("fs");const p="FEDERATION.md";let t=fs.readFileSync(p,"utf8");t=t.replace(/(\d+) skills, canonical/, (m,n)=>`${Number(n)+1} skills, canonical`);fs.writeFileSync(p,t)'
}

mutate_missing_asset() {
  printf '\n![img](assets/does-not-exist.svg)\n' >> README.md
}

mutate_no_lock_file() {
  rm -f skills-lock.json
}

mutate_invalid_workflow_yaml() {
  printf '\nbroken: [unclosed\n' >> .github/workflows/validate.yml
}

mutate_duplicate_folder_case() {
  mkdir -p skills/Git-Workflow
  cp skills/git-workflow/SKILL.md skills/Git-Workflow/SKILL.md
}

# macOS APFS is case-insensitive and cannot represent case-variant folder names;
# run the collision test only where it is representable (CI: ext4).
case_sensitive_fs() {
  local d a b
  d="$(mktemp -d)"
  touch "${d}/Probe" 2>/dev/null
  touch "${d}/probe" 2>/dev/null
  a="$(ls -i "${d}/Probe" 2>/dev/null | awk '{print $1}')"
  b="$(ls -i "${d}/probe" 2>/dev/null | awk '{print $1}')"
  rm -rf "${d}"
  [ -n "${a}" ] && [ "${a}" = "${b}" ] && return 1
  return 0
}

# --- tests ------------------------------------------------------------------

echo "=== [test] monozen-skills validator self-tests ==="

run_test "clean repo passes validation" 0 "" -- mutate_noop
run_test "invalid YAML frontmatter is rejected" 1 "Invalid YAML" -- mutate_invalid_yaml
run_test "missing frontmatter delimiters are rejected" 1 "must start with" -- mutate_no_frontmatter
run_test "empty frontmatter name is rejected" 1 "missing or empty" -- mutate_empty_name
run_test "name/folder mismatch is rejected" 1 "does not match folder" -- mutate_name_mismatch
run_test "em dash in Markdown is rejected" 1 "em dash" -- mutate_em_dash_md
run_test "em dash in JSON is rejected" 1 "em dash" -- mutate_em_dash_json
run_test "/Users/ path in Markdown is rejected" 1 "machine-specific" -- mutate_users_path_md
run_test "file:// path in Markdown is rejected" 1 "machine-specific" -- mutate_file_uri
run_test "unregistered skill folder is rejected" 1 "missing from manifest" -- mutate_missing_lock_entry
run_test "orphan lock entry is rejected" 1 "Orphan" -- mutate_orphan_lock_entry
run_test "stale computedHash is rejected" 1 "stale" -- mutate_stale_hash
run_test "broken internal link is rejected" 1 "Broken link" -- mutate_broken_link
run_test "FEDERATION count comment drift is rejected" 1 "disagree" -- mutate_federation_count_drift
run_test "missing asset reference is rejected" 1 "Broken link" -- mutate_missing_asset
run_test "missing skills-lock.json is rejected" 1 "does not exist" -- mutate_no_lock_file
run_test "invalid workflow YAML is rejected" 1 "Invalid YAML syntax" -- mutate_invalid_workflow_yaml
if case_sensitive_fs; then
  run_test "case-insensitive duplicate folders are rejected" 1 "duplicate" -- mutate_duplicate_folder_case
else
  echo "[TEST SKIP] case-insensitive duplicate folders (filesystem cannot represent case variants)"
fi

# --- manifest tests ---------------------------------------------------------

(
  FIXTURE_DIR="$(mktemp -d)"
  cp -R "${REPO_DIR}" "${FIXTURE_DIR}/repo"
  cd "${FIXTURE_DIR}/repo"

  # determinism: two consecutive runs produce byte-identical output
  bash scripts/manifest.sh >/dev/null
  cp skills-lock.json /tmp/monozen-lock-a.json
  bash scripts/manifest.sh >/dev/null
  if cmp -s /tmp/monozen-lock-a.json skills-lock.json; then
    echo "[TEST PASS] manifest generation is deterministic"
    PASS=$((PASS + 1))
  else
    echo "[TEST FAIL] manifest generation is not deterministic"
    FAIL=$((FAIL + 1))
  fi

  # new valid skill folder gets registered with a real hash
  mkdir -p skills/z-register
  printf -- '---\nname: z-register\ndescription: test skill\n---\n# Body\n' > skills/z-register/SKILL.md
  bash scripts/manifest.sh >/dev/null
  if grep -q '"z-register"' skills-lock.json && grep -qE '"computedHash": "[0-9a-f]{64}"' skills-lock.json; then
    echo "[TEST PASS] new skill is registered with sha256 hash"
    PASS=$((PASS + 1))
  else
    echo "[TEST FAIL] new skill not registered correctly"
    FAIL=$((FAIL + 1))
  fi

  # content edit invalidates the hash (regen changes it)
  before="$(ruby -rjson -e 'puts JSON.parse(File.read("skills-lock.json"))["skills"]["git-workflow"]["computedHash"]')"
  printf '\n- extra line\n' >> skills/git-workflow/SKILL.md
  bash scripts/manifest.sh >/dev/null
  after="$(ruby -rjson -e 'puts JSON.parse(File.read("skills-lock.json"))["skills"]["git-workflow"]["computedHash"]')"
  if [ "${before}" != "${after}" ] && [ -n "${before}" ]; then
    echo "[TEST PASS] content edit changes computedHash"
    PASS=$((PASS + 1))
  else
    echo "[TEST FAIL] computedHash did not change after content edit"
    FAIL=$((FAIL + 1))
  fi

  rm -rf "${FIXTURE_DIR}"
  rm -f /tmp/monozen-lock-a.json
)

echo "=================================================="
echo "Self-tests: ${PASS} passed, ${FAIL} failed"
if [ "${FAIL}" -eq 0 ]; then
  exit 0
else
  exit 1
fi
