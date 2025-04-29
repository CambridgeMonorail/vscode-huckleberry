---
slug: scale-up-your-codebase
title: Scale Up Your Codebase, Cowboy - Huckleberry Turns Copilot Chat Into a Ticket-Taming Workhorse
authors: [tim]
tags: [task-management, github-copilot, productivity, workflow, development, ai-agents]
---

Projects sprawl quicker than a runaway cattle stampede, and release trains keep missing the station. Huckleberry harnesses Copilot Chat into a diligent foreman, slicing specs into bite-sized tickets so your team can scale from small posse to full tech rodeo without dropping the reins.

<!-- truncate -->

## Meet Huckleberry

Huckleberry is an experimental VS Code extension that turns Copilot Chat into a project manager who writes your to-do list for you. Mention **@Huckleberry** in the chat, ask it to carve up a requirements document, and it showers your repo with tidy little task files. Everything lives locally alongside your code, so git can keep an eye on it. [Docs and source](https://github.com/CambridgeMonorail/vscode-huckleberry)

> **Status check:** the project is still in alpha and not on the Marketplace, so expect the odd rough edge and the occasional wandering cattle.

## Installing the camp-fire chilli

1. Visit the releases page: [https://github.com/CambridgeMonorail/vscode-huckleberry/releases](https://github.com/CambridgeMonorail/vscode-huckleberry/releases)
2. Download the freshest `huckleberry-taskmanager-x.x.x.vsix`.
3. In VS Code choose **Extensions → … → Install from VSIX…** and point at the file.

You also need:

- **VS Code 1.93+** (that is when the Language Model API landed)
- **GitHub Copilot** plus **Copilot Chat**
- **Agent Mode** switched on in settings

All three let the model call Huckleberry's tools directly and save you from typing slash commands like a cowpoke chiselling on stone.

## Pick your model

Agent Mode lets you choose the underlying large language model. The Huckleberry posse recommends Claude:

- **Claude 3.7 Sonnet** for creative writing and specification generation
- **Claude 3.5 Sonnet** for code-heavy conversations

Choose whichever gives you the cleanest diff and the fewest hallucinated Elvis lyrics.

## Write the spec first, ride later

Before unleashing the AI, give it something sensible to chew on. Drop a prompt like this into Copilot Chat:

```text
I've been given a new requirement to add MY FEATURE NAME features.
Add a new markdown specification document for MY FEATURE NAME in my docs directory,
here are the current requirements: YOUR FEATURE DESCRIPTION GOES HERE
```

Huckleberry will create `'docs/my-feature-name.md'` and fill it with a surprisingly coherent brief.

## Sanity-check the brief

Read the document. Out loud if necessary. If you already have a codebase, ask the agent to cross-reference:

```text
Review our specification markdown document 'docs/my-feature-name.md'
against the existing code in 'apps/yourapp/src'
and add notes and details that will help the developer implementing this feature
```

Never forget the golden rule of AI-fuelled development: **trust but verify**.

## Spawn the tasks

Happy with the spec? Great. Issue the order:

```text
read docs/my-feature-name.md and create tasks
```

Huckleberry will propose task files and politely ask permission before committing them. The uprising is pencilled in for a later release.

## Link everything up

If the tasks look bare, try:

```text
make sure all those tasks link back to the requirements document
```

Still thin? Close the loop:

```text
Review the tasks in 'tasks/' against 'docs/my-feature-name.md'
and make sure each task has enough detail for a developer to implement it;
if something is not clear ask me
```

"Doc, I'm your Huckleberry: link those tasks to the spec."

## Work the queue

Type:

```text
Next task
```

Sit back while Huckleberry serves up the first ticket, complete with context and a cheeky pep-talk. You'll be coding quicker than a saloon pianist after last orders.

## Raise a hand, raise an issue

Find a bug or dream up a feature? Wander over to [https://github.com/CambridgeMonorail/vscode-huckleberry/issues](https://github.com/CambridgeMonorail/vscode-huckleberry/issues) and let the maintainers know. They're friendly and always appreciate a well-aimed ⭐ on GitHub.

## Final thoughts

Every webinar swears it can unlock 10× velocity. **Huckleberry promises fewer Post-it notes and more time in the flow state.** Install the VSIX, feed it a spec, and watch your coding session go from "Where did I put that to-do list?" to "Next task, please" in one dusty-trail trick.

Happy hacking, and remember: read the tasks before the tasks pull a high-noon standoff.