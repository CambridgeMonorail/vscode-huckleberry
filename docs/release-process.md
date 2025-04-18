# Huckleberry Release Process

This document outlines the automated release process for the Huckleberry VS Code extension within our Nx monorepo.

## Release Automation Overview

Huckleberry uses an automated release process built on:

- **Nx Release** for version management and changelog generation
- **Conventional Commits** for standardized commit messages
- **GitHub Actions** for CI/CD automation
- **VS Code Extension Packaging** for creating VSIX files

## Prerequisites

Before contributing to the project, ensure you have:

1. **Conventional Commits Knowledge**: All commits must follow the [Conventional Commits](https://www.conventionalcommits.org/) specification
2. **Husky and Commitlint**: These are configured to enforce commit message standards
3. **GitHub Permissions**: Proper write access to create releases (for maintainers)

## Commit Message Format

All commits must follow this format:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

Common types include:

- `feat`: New feature (minor version bump)
- `fix`: Bug fixes (patch version bump)
- `docs`: Documentation changes only
- `style`: Code style changes (formatting, semicolons, etc.)
- `refactor`: Code changes that neither fix bugs nor add features
- `perf`: Performance improvements
- `test`: Adding or correcting tests
- `build`: Changes to the build system or dependencies
- `ci`: Changes to CI configuration files and scripts
- `chore`: Other changes that don't modify src or test files

Breaking changes are indicated by adding a `!` after the type/scope or adding a footer with `BREAKING CHANGE:`.

## Release Process Workflow

### 1. Development Phase

1. Create a feature branch from `main`
2. Make your changes following the project's coding standards
3. Commit your changes using conventional commit messages
   - The commit-msg hook will validate your commit messages
4. Open a pull request to `main`
5. After code review, merge the PR into `main`

### 2. Manual Release Process

Currently, releases are triggered manually via GitHub Actions:

1. Navigate to the GitHub repository's "Actions" tab
2. Select the "Release" workflow
3. Click the "Run workflow" button
4. Configure the release parameters:
   - **Release type**: Choose patch, minor, or major version increment
   - **Dry run**: Toggle to test the release process without creating actual releases

The workflow will:

1. **Check Out Code**: Retrieve the full git history
2. **Set Up Environment**: Configure Node.js and pnpm
3. **Run Nx Release**:
   - Analyze commit messages to determine the next version (semantic versioning)
   - Update version numbers in affected packages
   - Generate changelogs
   - Create a git tag
   - Create a GitHub release
4. **Package the Extension**: Create a `.vsix` file (unless dry run is enabled)
5. **Upload Assets**: Attach the `.vsix` file to the GitHub release (unless dry run is enabled)

## Local Manual Release (if needed)

For exceptional cases where a local manual release is required:

1. Ensure you're on the latest `main` branch
2. Run `pnpm nx release version` to determine and update the next version
3. Run `pnpm nx release changelog` to generate changelogs
4. Run `pnpm nx package huckleberry-extension` to create the VSIX file
5. Create a GitHub release manually and upload the VSIX file

## Version Numbering

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR** version: incompatible API changes (X.0.0)
- **MINOR** version: add functionality in a backward-compatible manner (0.X.0)
- **PATCH** version: backward-compatible bug fixes (0.0.X)

The version is automatically incremented based on the commit messages since the last release or can be explicitly specified via the workflow input parameters.

## Release Artifacts

Each release produces:

1. **Updated package.json** files with new version numbers
2. **CHANGELOG.md** updates documenting changes
3. **Git tag** for the new version
4. **GitHub release** with release notes
5. **VSIX package** for VS Code extension installation

## Publishing to VS Code Marketplace

Currently, publishing to the VS Code Marketplace is a manual step:

1. Download the `.vsix` file from the GitHub release
2. Use the VS Code Marketplace publisher account credentials
3. Publish using `vsce publish -p <token> /path/to/extension.vsix`

*Note: Future iterations of this process may automate the marketplace publication step.*

## Troubleshooting

### Common Issues

1. **Failed Commit Validation**: Ensure your commit follows the conventional commits format
2. **Release Failed**: Check GitHub Actions logs for specific errors
3. **Version Not Incrementing**: Ensure you have commits with the appropriate type (`feat`, `fix`, etc.)

### Getting Help

If you encounter issues with the release process:

1. Check the GitHub Actions workflow logs
2. Review the Nx Release documentation
3. Contact the project maintainers
