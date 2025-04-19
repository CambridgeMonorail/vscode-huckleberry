# Huckleberry Release Process

This document outlines the release process for the Huckleberry project. It provides guidance on how to create and publish new releases of the VS Code extension and other components.

## Release Workflow

The Huckleberry project uses GitHub Actions to automate the release process. The workflow handles versioning, generating changelogs, and publishing new releases.

### Prerequisites

Before triggering a release, make sure:

1. All changes intended for the release are merged to the main branch
2. All tests are passing
3. The code adheres to the project's coding standards and guidelines
4. All features for the release are complete

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

## Additional Resources

- [Nx Release Documentation](https://nx.dev/features/manage-releases)
- [Semantic Versioning](https://semver.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)
