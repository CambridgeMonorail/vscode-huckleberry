---
slug: vibe-coding
title: Keep the Groove, Skip the Chaos - Vibe-Coding with Huckleberry in VS Code Agent Mode
authors: [tim]
tags: [huckleberry, vs-code, copilot, ai-agents, productivity, workflow, agent-mode]
---

Releasing raw ideas at speed feels brilliant until your to-do list looks like a pub-table napkin at closing time. Huckleberry turns that late-night jam into a studio session that actually ships. Here's how to stay in the flow, keep the structure and leave the sticky notes in the recycling.

<!-- truncate -->

## 1. Switch on Agent Mode  

1. **Enable Agent Mode**  
   Open **Settings**, search for *Copilot: Agent*, tick *Enable Agent Mode*, then reload VS Code.  

2. **Pick Huckleberry**  
   In the Chat panel (Ctrl + Shift + C), swap *Chat* for *Agent* and select **@Huckleberry**.  

Result: your co-pilot grows opposable thumbs and a toolkit.

## 2. Let Huckleberry Wire Up the Decks  

Agent Mode chats to VS Code's Language Model Tools and MCP servers, so it can:

- read or write `tasks.json`  
- create `tasks/*.txt` files  
- parse specs, break down epics, estimate complexity  
- run tests, install packages, fire-off builds  

You describe intent, it handles the knobs and sliders.

## 3. Spin Up the First Task  

Type in the Agent pane:  

```
Parse docs/requirements.md into tasks
```

Huckleberry will:

1. call **parseRequirements**  
2. update `tasks.json` and create `tasks/TASK-###.txt`  
3. stream a tidy recap of open work  

You never leave your editor. "And your bird can sing," as a certain quartet once hinted.

## 4. The Vibe Loop: Ask → Do → Done  

- **Ask**  

  ```  
  What should I work on next?  
  ```  

- **Do**  
  Huckleberry suggests *TASK-007: implement auth API* and opens the relevant file.  
- **Done**  

  ```  
  Mark TASK-007 complete  
  ```  

Context switches: nil. Progress bar: moving.

## 5. Stretch Moves  

**Break a task into steps**  

```
Expand TASK-010 into three subtasks
```  

**Change stack direction mid-flight**  

```
Update every open task to use Vite instead of Webpack
```  

**Run tests and skim the failures**  

```
Run npm test and summarise any errors
```  

Huckleberry orchestrates each hop so you stay in flow.

## 6. You Still Hold the Faders  

- Every command appears in the chat log; review or veto at will.  
- Keep auto-approve off if you like a confirmation break.  
- Undo last edit with a click if the riff goes flat.

## 7. Lock in the Groove  

- Speak in clear intents; the agent knows the tooling.  
- Trust it with the plumbing, keep your brain for the composition.  
- Flip back to Edit Mode for microscopic tweaks, return to Agent Mode for the big brush strokes.  

Add a `.github/copilot-instructions.md` with team conventions and Huckleberry will sound like the band, not the session musician.

## Ready to Roll?  

Fire up the Agent pane, voice your next high-level ask and watch Huckleberry keep time while you solo. As another Manchester outfit advised: *You gotta roll with it*.

---

*Keep your code flowing with Huckleberry. When you're in the zone, the last thing you need is a to-do list breaking your rhythm. Check out our [Language Model Tools documentation](https://cambridgemonorail.github.io/vscode-huckleberry/language-model-tools) for more ideas and examples of how you can get more done more productively with Huckleberry.*
