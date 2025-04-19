---
sidebar_position: 13
---

# Roadmap

This page outlines the planned development roadmap for the Huckleberry Task Manager extension. It provides insight into our future direction and upcoming features.

## Current Status

Huckleberry is currently in **Alpha** status. The core functionality is implemented, but features may be incomplete, APIs may change, and there might be rough edges. We welcome feedback and contributions during this early phase.

## Version Goals

### Version 0.2.0 (Q2 2025)

#### Core Improvements
- Extended chat command functionality with more natural language processing
- Task dependency graph visualization
- Improved error handling and user feedback
- Performance optimizations for large workspaces

#### New Features
- Basic timeline view for tasks
- Task templates for common project types
- Enhanced requirement parsing algorithms
- Integration with VS Code Problems panel for issues found in tasks

### Version 0.3.0 (Q3 2025)

#### Core Improvements
- Enhanced Language Model Tool integration with context awareness
- Custom task fields and metadata support
- Improved search and filtering capabilities
- API stability improvements

#### New Features
- Tree View for task management
- Custom task workflows with configurable statuses
- Kanban board view for task management
- Visual task creation wizard

### Version 0.4.0 (Q4 2025)

#### Core Improvements
- Task data synchronization between team members
- Enhanced performance with large task sets
- Deeper VS Code integration with language-specific features

#### New Features
- Time tracking for tasks
- Task effort estimation
- Analytics and reporting on project progress
- Integration with VS Code's built-in task system

### Version 1.0.0 (Q1 2026)

The first stable release of Huckleberry will include:

- Production-ready API with stable interfaces
- Comprehensive documentation
- Full test coverage
- Performance optimized for enterprise-scale repositories
- All planned features for the initial release implemented and tested

## Long-Term Vision

Beyond version 1.0, we envision Huckleberry evolving in the following directions:

### Team Collaboration
- Enhanced team collaboration features
- Shared task workspace with role-based permissions
- Comment threads and discussions on tasks
- Task assignments and notifications

### AI Capabilities
- AI-assisted task breakdown and estimation
- Automated requirement analysis and conversion to tasks
- Smart task recommendations based on workspace context
- Code-aware task suggestions

### Platform Integration
- Integration with issue tracking systems (GitHub Issues, JIRA)
- Pull request and code review integration
- CI/CD workflow integration
- Calendar and deadline integration

### Extended Features
- Full project management capabilities
- Advanced reporting and analytics
- Resource management and allocation
- Risk management

## Feature Prioritization

We prioritize features based on:

1. **User impact** - How many users will benefit from the feature
2. **Technical feasibility** - What's possible given current VS Code API capabilities
3. **Strategic alignment** - How well the feature aligns with our core vision
4. **Community feedback** - What our users are requesting

## Providing Feedback

We welcome feedback on our roadmap and feature priorities. There are several ways to contribute your ideas:

- **GitHub Issues**: Submit feature requests through our issue tracker
- **Discussions**: Join our GitHub Discussions to talk about future directions
- **User Surveys**: Participate in our periodic user surveys
- **Community Calls**: Join our monthly community calls to discuss the roadmap

## Contributing to the Roadmap

If you'd like to help implement features on our roadmap:

1. Check the [Development](./development.md) guide for setup instructions
2. Look for issues labeled `roadmap` or `good-first-issue` in our GitHub repository
3. Join discussions on features you're interested in contributing to
4. Submit a pull request with your implementation

## Feature Voting

We use GitHub reactions on issues to gauge community interest in features. To vote for a feature:

1. Find the relevant feature request in our GitHub issues
2. Add a 👍 reaction to show your support
3. Comment with any additional requirements or use cases you have

## Experimental Features

We sometimes implement experimental features that may or may not make it into stable releases. You can try these by:

1. Enabling the `huckleberry.enableExperimentalFeatures` setting
2. Providing feedback on experimental features you use

## Release Schedule

We aim for a predictable release cadence:

- **Feature releases** (versions 0.x.0): Approximately quarterly
- **Patch releases** (versions 0.x.y): As needed for bug fixes
- **Preview releases**: Available through the VS Code pre-release program

## Version Compatibility

We commit to maintaining compatibility with:

- The latest stable version of VS Code
- The previous two major releases of VS Code
- Standard workspace file formats for task data

## Deprecation Policy

When we need to deprecate features:

1. Features will be marked as deprecated at least one major version before removal
2. Deprecation notices will be included in the documentation and release notes
3. Migration paths will be provided for deprecated features
4. Breaking changes will only be introduced in major version updates