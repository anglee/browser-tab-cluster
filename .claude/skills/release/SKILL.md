---
name: release
description: Create a release with changelog update, version bump, commit, and tag
arguments:
  - name: type
    description: Bump type (major, minor, or patch)
    default: patch
---

Create a new release for this project.

## Steps

1. **Get the bump type** from the argument: $ARGUMENTS (default to `patch` if empty)

2. **Find the last version tag** by running:
   ```
   git describe --tags --abbrev=0
   ```
   If no tags exist, use the initial commit.

3. **Get commits since the last tag** by running:
   ```
   git log <last-tag>..HEAD --oneline
   ```

4. **Calculate the new version** based on the current version in `package.json` and the bump type.

5. **Generate a changelog entry** in this format:
   ```
   ## [X.Y.Z] - YYYY-MM-DD

   ### Added
   - New features...

   ### Changed
   - Changes to existing functionality...

   ### Fixed
   - Bug fixes...
   ```

   Only include sections that have relevant changes. Analyze the commit messages to categorize them appropriately. Be concise but descriptive.

6. **Show the changelog entry to the user** and ask for confirmation:
   - Display the proposed changelog entry
   - Ask: "Does this changelog look good? (yes/edit/cancel)"
   - If "edit": ask what changes they want
   - If "cancel": stop here
   - If "yes": proceed

7. **Update CHANGELOG.md**:
   - If the file doesn't exist, create it with a header
   - Insert the new entry at the top (after the header)

8. **Run the bump command**:
   ```
   just bump <type>
   ```
   This will update version numbers, commit, and create a git tag.

9. **Report success** with the new version number and remind about `git push --tags`.
