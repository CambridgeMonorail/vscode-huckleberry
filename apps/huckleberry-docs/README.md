# Huckleberry Documentation Site

This documentation site is built using [Docusaurus](https://docusaurus.io/) v3.7.0, a modern static website generator. It's part of the Huckleberry project's Nx monorepo structure.

## Installation

The project uses pnpm for package management. All dependencies are installed from the root of the monorepo:

```bash
$ pnpm install
```

## Local Development

To start the local development server:

```bash
$ pnpm exec nx start huckleberry-docs
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

## Building

To generate the static documentation site:

```bash
$ pnpm exec nx build huckleberry-docs
```

This command generates static content into the `build` directory which can be served using any static content hosting service.

## Serving Built Content

After building, you can preview the built site locally:

```bash
$ pnpm exec nx serve huckleberry-docs
```

## Project Structure

- `/blog/` - Blog posts about Huckleberry development and updates
- `/docs/` - Documentation source files in Markdown format
- `/src/` - React components and custom pages
- `/static/` - Static assets like images and files
- `/build/` - Generated static site (after building)

## Content Organization

The documentation is organized into several key areas:

- Getting Started (Installation, Quick Start)
- Features (Task Management, TODO Scanning)
- Configuration and Customization
- Development and Architecture
- Tutorials and Examples

For detailed information about contributing to documentation, please refer to the main project's [CONTRIBUTING.md](https://github.com/huckleberry-inc/vscode-huckleberry/blob/main/CONTRIBUTING.md) guidelines.
