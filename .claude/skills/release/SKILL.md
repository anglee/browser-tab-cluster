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

7. **Update CHANGELOG.md** (must happen before the bump command):
   - If the file doesn't exist, create it with a header
   - Insert the new entry at the top (after the header)
   - Do NOT commit CHANGELOG.md separately — the bump script handles it

8. **Run the bump command**:
   ```
   just bump <type>
   ```
   This will stage `package.json`, `manifest.json`, and `CHANGELOG.md`, commit them all together, and create an annotated git tag.

9. **Push and create zip**:
   ```
   just push
   just zip
   ```
   `just push` runs `git push --follow-tags` which pushes both commits and annotated tags.

10. **Create GitHub release**:
   ```
   gh release create v<version> --title "v<version>" --notes "<changelog entry for this version>"
   ```
   Use the changelog entry (without the `## [X.Y.Z] - date` header) as the release notes.

11. **Report success** with the new version number, zip file name, and GitHub release URL.
