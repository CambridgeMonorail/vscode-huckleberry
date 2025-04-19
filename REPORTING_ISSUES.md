# Reporting Issues for Huckleberry

Thanks for giving Huckleberry a spin. If something breaks, behaves oddly, or sparks an idea for a new feature, we’d love to hear from you. This guide will help you raise issues that are easy for us to understand and act on. The quicker we can make sense of the problem, the faster we can do something about it.

## Where to Report

Please raise all issues on our GitHub repository:

**[https://github.com/CambridgeMonorail/vscode-huckleberry/issues](https://github.com/CambridgeMonorail/vscode-huckleberry/issues)**

## Before You Open a New Issue

A few quick checks before you fire off a fresh report:

1. **Search first**  
   Someone might already have run into the same thing. If you find a match, feel free to add your details to the existing thread.

2. **Skim the docs**  
   You can find them [here](https://cambridgemonorail.github.io/vscode-huckleberry/). Just to be sure the behaviour you're seeing isn’t expected.

3. **Check your version**  
   If you're not running the latest, consider updating. We might have already sorted it.

## What to Include

### For Bug Reports

The more detail, the better. Here's what helps:

- A clear, descriptive title  
- Your setup:
  - VS Code version  
  - Huckleberry version  
  - Operating system  
  - Which model you're using (e.g. GPT-4 or GPT-3.5)  
- Steps to reproduce the problem  
- What you expected to happen  
- What actually happened (including error messages, if any)  
- Screenshots or recordings, if they help  
- Sample files or minimal code snippets  
- Extension logs (see below for how to get those)

### For Feature Requests

Tell us:

- What you'd like Huckleberry to do  
- Why it's useful  
- How it might work  
- Any alternatives you've considered  
- Bonus points for diagrams, mockups, or examples from other tools

## How to Get Logs

If you hit a bug, logs can be very handy.

1. Open VS Code  
2. Go to **View → Output**  
3. In the dropdown, select **Huckleberry**  
4. Copy the relevant entries and paste them into your issue

## Templates

We’ve set up GitHub issue templates to make life easier. You’ll see them when you create a new issue. Please use the one that fits what you're reporting:

- Bug  
- Feature request  
- Docs improvement

## Code of Conduct

Be decent. We're all here to make something good. [Here’s the Code of Conduct](CODE_OF_CONDUCT.md) if you want to know more.

## Contributing Fixes

If you're interested in contributing a fix for an issue yourself, please:

1. Comment on the issue expressing your interest  
2. Follow our [Contributing Guidelines](CONTRIBUTING.md) for detailed instructions on the development process  
3. Submit a pull request referencing the issue  

Thank you for helping make Huckleberry better!

## Good Bug Report Example

```
Title: Task list doesn’t refresh after creating a task via chat

Environment:
- VS Code: 1.80.1  
- Huckleberry: 0.1.0  
- OS: Windows 11  
- Model: GPT-4  

Steps to reproduce:
1. Open a project with the Huckleberry extension enabled  
2. Ask Huckleberry in the chat to create a task  
3. See confirmation  
4. Check the task list panel  

Expected: The new task appears automatically  
Actual: Task only appears after manually clicking refresh  

Extension logs:  
[Paste logs here]

Additional info: This only happens when creating tasks in chat. Creating tasks in the UI works fine.
```

## After You Submit

Once you've raised an issue:

- Stick around in case we have questions  
- Be patient while we work through the backlog  
- Watch for updates or comments

## Fancy Fixing It?

If you’d like to take a crack at solving the issue yourself:

1. Comment on the issue to say you’re on it  
2. Follow our [Contributing Guidelines](CONTRIBUTING.md) for detailed instructions on the development process 
3. Submit a pull request that references the issue

Thanks for helping make Huckleberry better. We appreciate it.

