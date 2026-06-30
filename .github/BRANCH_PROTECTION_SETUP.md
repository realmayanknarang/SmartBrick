# Branch Protection Setup for SmartBrick

This document describes the branch protection rules that should be configured for the `main` branch in GitHub.

## Configuration Steps

Navigate to: **GitHub Repository → Settings → Branches → Branch protection rules**

### Rule: main

**Enable branch protection for: `main`**

#### Required Settings

1. **Require a pull request before merging**
   - ✅ Require at least 1 approval
   - ✅ Dismiss stale PR approvals when new commits are pushed
   - ✅ Require approval from the most recent review request

2. **Require status checks to pass before merging**
   - ✅ Require branches to be up to date before merging
   - ✅ Select required status checks:
     - `client tests` (from .github/workflows/test.yml)
     - `server tests` (from .github/workflows/test.yml)
     - `client build` (from .github/workflows/test.yml)

3. **Do not allow bypassing the above settings**
   - ✅ Enable for administrators (recommended for security)

4. **Restrict who can push to this branch**
   - ✅ Restrict who can push to matching branches
   - Add administrators only (or specific trusted users)

5. **Allow force pushes**
   - ❌ Disable force pushes (prevents the force-push incident from recurring)
   - Only allow administrators to force push if absolutely necessary

## Rationale

- **PR requirement**: Ensures all code changes go through code review
- **Status checks**: Prevents merging code that fails tests or builds
- **No bypass**: Even admins must follow the process
- **No force push**: Prevents accidental or malicious history rewriting
- **Up to date**: Ensures PRs are based on the latest main before merging

## Verification

To verify branch protection is working:

1. Create a new branch: `git checkout -b test-protection`
2. Make a trivial change that breaks a test (e.g., change an assertion)
3. Commit and push: `git push -u origin test-protection`
4. Create a PR via GitHub web UI
5. Confirm:
   - The PR shows failing status checks
   - The "Merge" button is disabled or shows a warning
   - You cannot merge until tests pass
6. Fix the test, push the fix
7. Confirm the PR becomes mergeable after checks pass
