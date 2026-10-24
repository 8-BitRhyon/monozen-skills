# CI Recovery Reference

## Snapshot the Required Checks

Save the exact object before changing anything.

```bash
gh api repos/{owner}/{repo}/branches/main/protection/required_status_checks \
  > protection.backup.json
```

The object contains `strict` and a `checks` array. Each entry has a `context` and an `app_id`. Keep both.

## Remove Only the Failing Context

Create a restore file and a temporary file. Remove one context from `checks`, keep the rest.

```json
{
  "strict": true,
  "checks": [
    { "context": "validate", "app_id": 15368 },
    { "context": "secrets", "app_id": 15368 }
  ]
}
```

```bash
gh api -X PATCH \
  repos/{owner}/{repo}/branches/main/protection/required_status_checks \
  --input protection.no-external.json
```

Verify the response before merging.

## Merge With a Restore Trap

```bash
restore() {
  gh api -X PATCH \
    repos/{owner}/{repo}/branches/main/protection/required_status_checks \
    --input protection.backup.json
}
trap restore EXIT

gh pr merge <number> --merge
```

The trap restores protection on success, failure, or interruption. Do not rely on memory.

## Restore and Prove

After the last merge:

1. Read the protection object again.
2. Compare it with the backup.
3. Confirm the original contexts are present and `strict` is unchanged.
4. Confirm the post-merge CI run is green.
5. Record the approval, the reason, and the exact check that was removed.

## Stacked PR Recovery

1. Merge the bottom pull request.
2. Fetch main.
3. Merge main into the next branch.
4. Retarget the pull request to main.
5. Push and wait for the required checks on the new head.
6. Merge, then repeat.

Do not push before retargeting. A workflow that only runs on pull requests targeting main will not run while the base is another feature branch.

## What Not to Do

- Do not use `--admin` to skip protection.
- Do not patch `enforce_admins` to off.
- Do not delete the workflow file.
- Do not create a fake status with the same name.
- Do not leave the repository with fewer required checks than it started with.
