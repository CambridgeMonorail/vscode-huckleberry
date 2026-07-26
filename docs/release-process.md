# Huckleberry Release Process

This document outlines the release process for the Huckleberry project. It provides guidance on how to create and publish new releases of the VS Code extension and other components.

## Release Workflow

The Huckleberry project uses GitHub Actions to automate the release process. The workflow handles versioning, generating changelogs, and publishing new releases.

### Release Readiness Checklist

Before a live release, the following gates must be satisfied:

| Gate          | Evidence                                                       |
| ------------- | -------------------------------------------------------------- |
| Quality       | `pnpm validate:affected` passes and release packaging succeeds |
| Security      | RIM-704 guardrails and policy review are complete              |
| Documentation | RIM-705 docs pack is published and discoverable                |
| Rollback      | A rollback drill has been completed and recorded               |
| Approvals     | Engineering and product have both signed off on the release    |

The release workflow includes a readiness gate that records these checks in the workflow summary and blocks a live release unless the rollback drill and go/no-go approval are explicitly confirmed.

### Go/No-Go Decision Criteria

The release decision should be recorded by the release owner after reviewing:

1. Build, test, and packaging evidence from the current release candidate.
2. Security review status, including the default command policy and high-risk guardrails.
3. Documentation coverage for first-run, authoring, evidence, and troubleshooting.
4. Rollback drill evidence and the recovery plan for a critical regression.

If any of the required gates are missing, the release remains paused until the gap is resolved or the release is explicitly re-scoped.

### Prerequisites

Before triggering a release, make sure:

1. All changes intended for the release are merged to the main branch
2. All tests are passing
3. The code adheres to the project's coding standards and guidelines
4. All features for the release are complete

### Rollback and Hotfix Path

If a critical regression is found after release:

1. Stop new release activity and confirm the impact window.
2. Revert the offending commit on `main` using a normal revert commit rather than rewriting history.
3. Publish a patch hotfix release from the corrected branch state.
4. Update the changelog and release notes to call out the regression and recovery.
5. If the published VSIX is impacted, supersede it with the hotfix artifact instead of attempting to edit the shipped package.

For a pre-publish rollback, cancel the workflow run and leave the release tag unpublished. For a post-publish rollback, treat the event as a hotfix and ship the revert as quickly as possible.

### Rollback Drill

The rollback path must be exercised at least once before the first live release. The preferred drill is:

1. Run a release dry run.
2. Simulate a bad change by identifying a known-safe commit to revert.
3. Verify the revert workflow, changelog update, and patch release steps.
4. Record the drill outcome in the release decision log.

### Triggering a Release

To trigger a release:

1. Go to the GitHub repository
2. Navigate to the "Actions" tab
3. Select the "Release" workflow
4. Click "Run workflow"
5. Configure the following options:
   - **Branch**: Select the branch to release from (usually `main`)
   - **Release Type**: Choose one of:
     - `patch`: For backward-compatible bug fixes (e.g., 1.0.0 → 1.0.1)
     - `minor`: For backward-compatible new features (e.g., 1.0.0 → 1.1.0)
     - `major`: For breaking changes (e.g., 1.0.0 → 2.0.0)
   - **Dry Run**: Enable to preview changes without publishing (recommended first)
   - **First Release**: Enable ONLY for the initial release (when no version tags exist)

- **Go/No-Go Approved**: Enable only after engineering and product have signed off on the release
- **Rollback Drill Complete**: Enable only after the rollback path has been exercised and recorded

For a dry run, you can preview the workflow with the approval checkboxes left unset. For a live release, both approval checkboxes must be confirmed before the workflow will proceed.

### First-Time Release

When making the very first release of the project:

1. Set "First Release" to `true`
2. The workflow will use the version from the package.json file as the base version
3. It will create the appropriate git tag and GitHub release

For all subsequent releases, leave "First Release" unchecked, as the workflow will determine the next version based on the existing git tags.

## Manual Release Process

In case you need to handle the release process manually:

### Creating Version Tags Manually

```bash
# Get the current version
VERSION=$(node -p "require('./apps/huckleberry-extension/package.json').version")

# Create and push git tag
git tag v${VERSION}
git push origin v${VERSION}
```

### Running the Release Process Locally

```bash
# For a dry run
pnpm nx release patch --dry-run

# For an actual release
pnpm nx release patch

# For a first-time release
pnpm nx release patch --first-release
```

## Versioning Strategy

The Huckleberry project follows the [Semantic Versioning](https://semver.org/) specification:

- **MAJOR** version when making incompatible API changes
- **MINOR** version when adding functionality in a backward-compatible manner
- **PATCH** version when making backward-compatible bug fixes

### Conventional Commits

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification for commit messages. These commit messages are used to determine the type of version change and to generate the changelog.

Examples:

- `fix:` commits trigger a PATCH release
- `feat:` commits trigger a MINOR release
- Any commit with `BREAKING CHANGE:` in the footer or `!` after the type/scope triggers a MAJOR release

## Post-Release Steps

After a successful release:

1. Verify the new version is available on the GitHub Releases page
2. Check that the VSIX file is attached to the release
3. Verify the changelog is accurate and reflects all changes made
4. If relevant, update the documentation site to reflect the new version
5. Announce the release on appropriate channels

## Troubleshooting

### Release Workflow Fails to Determine Version

If the workflow fails with an error about not finding git tags:

1. Use the "First Release" option for the initial release
2. For subsequent releases, verify that git tags exist following the pattern `v{version}`
3. Check that the git tags are pushed to the remote repository

### VSIX File Not Attaching to Release

Ensure that:

1. The extension packaging step completes successfully
2. The path to the VSIX file in the workflow matches the actual output location

### Release Gate Checklist

Use this checklist when preparing the next release:

- [ ] Quality gate evidence captured
- [ ] Security gate review recorded
- [ ] Documentation pack reviewed and linked
- [ ] Rollback drill completed
- [ ] Engineering and product approvals recorded
- [ ] Live release approved by the release owner

## Additional Resources

- [Nx Release Documentation](https://nx.dev/features/manage-releases)
- [Semantic Versioning](https://semver.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)
