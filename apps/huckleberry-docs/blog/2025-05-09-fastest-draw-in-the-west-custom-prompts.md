---
slug: fastest-draw-in-the-west-custom-prompts
title: "Fastest Draw in the West: Calling Custom Prompts in VS Code"
authors: [tim]
tags: [vscode, prompts, productivity, development, ai, huckleberry]
---

Back in the dusty streets of modern coding, there's a new gunslinger in town: **VS Code v1.100**. And no, it's not just another shiny feature or cosmetic tweak, this one packs real firepower: **named prompt files**.

For the Huckleberry agent crowd, the folks who keep their tasks sharp, tools clean, and AI sidekicks at the ready, this is a genuine shift in the landscape.

---

## What Makes This a Big Deal?

Picture this: a busy day in the code corral. Bugs need wrangling, tests are bucking out of control, and documentation's flapping wild like a saloon door in the wind.

With the new **prompt files feature**, you can now summon task-specific prompts by name, right inside your VS Code chat. Drop your `.prompt` files into the `.github/prompts` directory, and when the moment calls, just type `/your-prompt-name` into the chat. That's all it takes, your custom instructions roll out like a sheriff's decree.

No more repeating the same explanations or reinventing the wheel. It's like carrying a custom-engraved six-shooter, ready to draw at a moment's notice.

<!-- truncate -->

## Practical Example: Productivity on Demand

Say you've got a Huckleberry agent helping with unit tests. You create a file:

```
.github/prompts/write-unit-tests.prompt
```

Inside, you write:

```
Write detailed unit tests for the selected function.
Use Jest.
Include edge cases and expected failures.
```

Now, instead of explaining this to the agent every time, you just type `/write-unit-tests` in chat, and off it goes.

Want to make it even smarter? That's where variables come in.

## Variables: The Secret Bullets in Your Belt

Inside a prompt file, you can reference dynamic details using `${variableName}`. Here's what's available:

### Workspace variables

* `${workspaceFolder}`, `${workspaceFolderBasename}`

### Selection variables

* `${selection}`, `${selectedText}`

### File context variables

* `${file}`, `${fileBasename}`, `${fileDirname}`, `${fileBasenameNoExtension}`

### Input variables

* `${input:variableName}`, `${input:variableName:placeholder}`

Imagine a prompt like this:

```
Write a docstring for ${fileBasename} that explains its purpose and usage.
Include references to ${selectedText} if available.
```

Now you've got a context-aware prompt, no more generic, one-size-fits-all instructions. Your agent knows exactly where it's standing on the map.

## Why This Changes the Game

This isn't just about shaving off a few keystrokes. It's about standardising best practices, making sure your whole posse, from greenhorn to seasoned veteran, can draw on the same reliable set of tools.

Instead of scattered, ad-hoc prompts, you're building a library of reusable, consistent instructions that fit the unique flavour of your project. Your AI agents become genuine collaborators, not just background helpers.

## Integration with Huckleberry

For Huckleberry users, named prompt files bring an extra layer of efficiency to task management:

| Scenario | Without Named Prompts | With Named Prompts |
|----------|----------------------|-------------------|
| Creating task templates | Manually type instructions each time | Create a `/task-template` prompt once |
| Code reviews | Explain review criteria repeatedly | Use `/code-review` with consistent standards |
| Requirements parsing | Different formats each time | Standardize with `/parse-requirements` |
| TODO scanning | Manual scans or varied instructions | Quick `/scan-todos` prompt |

The combination of Huckleberry's task management capabilities with VS Code's named prompts creates a powerful workflow that ensures consistency across your entire development process.

*Docs: [Huckleberry Task Management](/features/task-management) | [VS Code Named Prompts](https://code.visualstudio.com/docs/editor/artificial-intelligence#_named-prompts)*

## Quick-Draw Setup Guide

1. Create a `.github/prompts` directory in your repository root.

2. Add `.prompt` files with descriptive names:

   ```bash
   mkdir -p .github/prompts
   touch .github/prompts/code-review.prompt
   touch .github/prompts/parse-requirements.prompt
   touch .github/prompts/refactor-code.prompt
   ```

3. Fill each file with specific, reusable instructions.

4. Use variables to make your prompts context-aware:

   ```
   # refactor-code.prompt
   Refactor the ${selection} to improve:
   - Performance
   - Readability
   - Maintainability
   
   Follow these project conventions:
   - Use TypeScript strict mode
   - Document with JSDoc comments
   - Prefer async/await over Promise chains
   ```

5. In VS Code chat, invoke with a slash command: `/refactor-code`

## Final Word

With prompt files in VS Code, the Huckleberry agent steps into a new era:

* Faster, smarter task execution
* Context-rich, reusable prompts
* More time to focus on the hard problems, not the repetitive ones

The town's changing, partner. And with this feature, you're carrying the fastest draw in the IDE.

## FAQs

### Q: Are prompt files specific to VS Code only?

A: Currently, this implementation is specific to VS Code v1.100 and newer. Other IDEs may implement similar features in the future.

### Q: Can I share prompt files with my team?

A: Absolutely! Since they're stored in your repository, everyone on your team can use the same set of standardized prompts.

### Q: How many variables can I use in a prompt?

A: You can use as many variables as needed. Combine workspace, selection, and file variables to create highly contextual prompts.

### Q: Will this work with all AI assistants in VS Code?

A: Yes, the prompt files feature works with GitHub Copilot, Huckleberry, and other assistants that integrate with VS Code's chat interface.

### Q: Can I organize prompts into subdirectories?

A: Not currently. All .prompt files should be placed directly in the .github/prompts directory.
