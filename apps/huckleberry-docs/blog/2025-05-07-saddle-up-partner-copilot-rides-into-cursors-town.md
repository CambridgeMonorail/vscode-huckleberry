---
slug: saddle-up-partner-copilot-rides-into-cursors-town
title: "Saddle Up, Partner: Copilot Rides into Cursor's Town"
authors: [tim]
tags: [ai, copilot, cursor, development, productivity, tools]
---

*"I'm your huckleberry."*  

Doc Holliday said it with a smirk and a six‑gun in *Tombstone*.  Lately, every campfire gossip column in dev‑town swears that **Cursor** is the last quick‑draw coder standing, the sheriff nobody can out‑gun. Scroll LinkedIn and you’ll find breathless threads claiming Cursor’s edge is “unbeatable”, that Copilot might as well hand over its badge.

But while the headlines holler, **GitHub Copilot has been oiling its six‑shooter in the back room and filing the sights**. Today, Copilot saunters through the saloon doors ready to stare Cursor down. The shoot‑out is close, the tumbleweed is rolling, and the only real question is whether your code can keep running when the Wi‑Fi wagon loses a wheel.

---

GitHub Copilot’s **April 2025 roundup plugged most of the gaps that once made Cursor the flashier gunslinger in the IDE corral**. The update brought:

* **One‑click Smart Actions** that rewrite code in place.  
* A **side‑by‑side diff viewer** for AI edits.  
* **Deep repo indexing** backed by Nx’s brand‑new **Model Context Protocol server**.  
* **Agent mode** that lines up terminal commands and waits for your nod.  
* **Enterprise privacy controls** that keep company secrets locked in the safe.  

Cursor still packs a **Ghost (offline) mode** and a slicker diff pane, yet the distance between the two tools has shrunk to the width of a guitar pick. So holster your editor of choice and let’s see who’s fastest on the draw.

<!-- truncate -->

## 1. Surveying the frontier: full‑repo indexing

Copilot Chat now scouts every file in your repo (it respects `.gitignore`) and refreshes the map in seconds. Type `@workspace` in chat and it fetches symbols from any corner, the way a tracker follows hoofprints through the chaparral.

*Docs: [Ask Copilot questions in your IDE](https://docs.github.com/en/copilot/using-github-copilot/copilot-chat/asking-github-copilot-questions-in-your-ide)*

### Nx adds extra horses to the posse

Running a mighty Nx monorepo? Install **Nx Console** and accept the "Improve Copilot agent..." prompt. That spins up an MCP server which feeds Copilot your project graph and affected targets. It is like hiring a local scout who knows every gulch and rattlesnake nest.

*Blog: [Nx – MCP support for VS Code Copilot](https://nx.dev/blog/nx-mcp-vscode-copilot)*

## 2. Three ways to draw: Ask, Edit, Agent

| Mode | Use case | Quick link |
|------|----------|-----------|
| **Ask** | Questions, explanations, code snippets | [Copilot Chat docs](https://docs.github.com/en/copilot/using-github-copilot/copilot-chat/asking-github-copilot-questions-in-your-ide) |
| **Edit** | Select code, refactor or document it, preview in diff | [Copilot Edits guide](https://code.visualstudio.com/docs/copilot/copilot-edits) |
| **Agent** | Multi‑step features including shell commands | See Agent section in docs above |

Agent mode lines commands up like bottles on a fence and waits for your nod before pulling the trigger. Unlike standard chat, it doesn't just talk—it reads files, writes code, and runs commands, all within guardrails you control. Perfect for [taming the "vibe coding"](/blog/vibe-coding) tendencies where AI tools generate plausible but untested answers. With Agent mode, each action is transparent, each command authenticated by your approval, turning what would be hastily scribbled notes into an actionable trail map with defined waypoints.

## 3. Smart Actions: one‑click rewrites

Highlight a code block, click the sparkle icon, choose **Fix**, **Optimise** or **Explain**. Copilot rewrites inline, no chat window, no fuss. Cursor pioneered the trick, Copilot matches it shot for shot.

*VS Code note: [Smart Actions](https://code.visualstudio.com/docs/copilot/copilot-smart-actions)*

## 4. Check your aim: side‑by‑side diff

After an Edit or Agent session, press **View all edits** to open a diff editor showing Copilot's changes next to your original code. Cursor's pane is tidier but Copilot has earned its spurs.

*Issue reference: [vscode‑copilot‑release #3076](https://github.com/microsoft/vscode-copilot-release/issues/3076)*

## 5. The command‑line campfire

If you code where the coyotes howl, install the GitHub CLI extension and run:

```bash
gh copilot suggest "Undo the last commit"
```

Copilot replies with the right Git incantation, then waits for your approval. "You gotta know when to hold 'em, know when to fold 'em."

*Docs: [Using Copilot in the command line](https://docs.github.com/en/copilot/github-copilot-in-the-cli)*

## 6. Privacy ironclad

Enterprise admins can exclude private code from suggestions, block matches to public code, and set prompt‑retention limits. That keeps the payroll chest locked up tight while the posse rides.

*Docs: [Excluding content from GitHub Copilot](https://docs.github.com/en/enterprise-cloud@latest/copilot/configuring-github-copilot/configuring-content-exclusions-for-github-copilot)*

## 7. Cursor's ace up the sleeve

While Copilot is catching up fast, Cursor continues to pivot and innovate at the frontier's edge. Like any good gunslinger who's survived a few showdowns, Cursor keeps a few specialized tricks that Copilot has yet to master.

| Feature | Cursor | Copilot |
|---------|--------|---------|
| Offline Ghost Mode | Yes: true local inference | No: needs internet |
| Integrated diff pane with hunk navigation | Yes: sleek, single-view workflow | Yes: functional but requires switching contexts |
| Unified rewrite palette | Yes: Extract, Optimise, Document together | Yes: via Smart Actions menu |
| Multi-file refactoring | Yes: superior handling of changes across files | Partial: still improving |
| IDE-wide completions | Yes: completes in search, terminals, and more | No: limited to supported file types |
| Raw speed | Yes: consistently faster response times | No: sometimes lags on complex requests |

Cursor's Ghost Mode remains its standout feature—the ability to run inference locally means you can code in an airplane at 30,000 feet, in a cabin with spotty satellite internet, or in secure environments where external AI services are forbidden. Their team's recent improvements to the local inference engine have reduced latency while maintaining quality, showing they're not just resting on their laurels.

Their development team also continues to ship weekly improvements while Copilot often follows a more measured monthly cadence. This rapid iteration means Cursor frequently introduces cutting-edge features that Copilot adopts months later.

*Reference: [Cursor Ghost Mode overview](https://cursor.sh/blog/ghost-mode)*

## 8. Quick‑draw checklist

* Update VS Code and Copilot to April 2025 or newer.
* Turn on workspace context: `"copilot.experimental.workspaceContext": "on"`.
* Install Nx Console and enable MCP if you use Nx.
* Pick the right mode: Ask, Edit or Agent.
* Approve tools so Agent sessions can run tests quietly.
* Set organisation privacy policies.
* Add the GitHub CLI extension if you prefer the terminal trail.

## 9. Ride into the sunset

With Smart Actions, real diff previews and MCP context, Copilot draws level with Cursor on nearly every trick this side of the Rio Grande. If your camp is completely off the telegraph wire, Cursor still holds the advantage. Otherwise, GitHub's gunslinger is ready to back you up.

Saddle cinched, keyboard loaded, code away.

## FAQs

### Q: How does Copilot's repo indexing compare to Cursor?

A: Both tools now offer full repository indexing, but Copilot's integration with Nx through MCP provides deeper context for monorepo structures.

### Q: When should I use Agent mode versus Edit mode?

A: Use Edit mode for quick, focused changes to existing code. Switch to Agent mode when you need multi-step operations or shell commands that require a sequence of actions.

### Q: Is there still a reason to use Cursor if I have Copilot?

A: Yes, if you need offline capabilities. Cursor's Ghost Mode offers true local inference that doesn't require an internet connection, which Copilot currently lacks.
