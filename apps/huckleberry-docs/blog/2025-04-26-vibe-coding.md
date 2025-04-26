---
slug: vibe-coding
title: "Ride the Code Range, Skip the Stampede : Gunslinging with Huckleberry in VS Code Agent Mode"
authors: [tim]
tags: [huckleberry, vs-code, github-copilot, ai-agents, productivity, workflow, agent-mode]
---

Punching out rough ideas feels grand until your backlog looks like a saloon bar top after last orders.  
Huckleberry rides in, swaps your whisky-stained scribbles for a proper trail map and helps you ship before the dust settles. Here is how to stay in the saddle, keep your herd together and leave the stray notes for the tumbleweed.

<!-- truncate -->

## 1  Saddle Up Agent Mode

1. **Enable Agent Mode**  
   Open **Settings**, search for *Copilot : Agent*, tick *Enable Agent Mode*, then reload VS Code.  

2. **Choose Your Deputy**  
   In the Chat panel (Ctrl + Shift + C), swap *Chat* for *Agent* and pick **@Huckleberry**.  

Result : your co-pilot now sports a tin star and a full toolbelt.

## 2  Let Huckleberry Hitch the Horses

Agent Mode chats to VS Code’s Language Model Tools and MCP corrals, which lets it :

- read or write `tasks.json`  
- create fresh `tasks/*.txt` files  
- parse specs, break epics, gauge difficulty  
- run tests, install packages, kick off builds  

You speak the intent, it twirls the spanners.

## 3  Draw Your First Task

In the Agent pane, type :

```

Parse docs/requirements.md into tasks

```

Huckleberry will :

1. call **parseRequirements**  
2. update `tasks.json` and forge `tasks/TASK-###.txt`  
3. stream a neat round-up of open work  

No need to holster your editor.

## 4  Quick-Draw Loop : Ask → Do → Done

- **Ask**  

  ```

  What should I work on next?

  ```  

- **Do**  
  Huckleberry picks *TASK-007 : implement auth API* and opens the right file.  

- **Done**  

  ```

  Mark TASK-007 complete

  ```

Context switches : nil. Progress bar : heading west.

## 5  Fancy Footwork

**Split a task**  

```

Expand TASK-010 into three subtasks

```  

**Change tack mid-trail**  

```

Update every open task to use Vite instead of Webpack

```  

**Run tests and skim the casualties**  

```

Run npm test and summarise any errors

```  

Huckleberry orchestrates each hop so you keep your rhythm.

## 6  You Keep Your Hand on the Reins

- Every command lands in the chat log ; review or veto as you please.  
- Keep auto-approve switched off if you fancy a breather.  
- Undo the last edit with one click if the riff goes sour.

## 7  Secure the Homestead

- Speak clear intents ; the deputy knows the kit.  
- Trust it with the plumbing, save your grey matter for the melody.  
- Flick back to Edit Mode for fine chiselling, ride Agent Mode for big brush strokes.  

Drop a `.github/copilot-instructions.md` with team lore and Huckleberry will sound like part of the posse rather than a hired gun.

## Ready to Ride ?

Open the Agent pane, voice your next high-level order and watch Huckleberry keep the beat while you solo. As the folk in Tombstone might put it : *I’m your Huckleberry*.

---

*Keep the code flowing with Huckleberry. When you are in the zone, a to-do list should not buck you off. Explore our [Language Model Tools documentation](https://cambridgemonorail.github.io/vscode-huckleberry/language-model-tools) for more ways to get things done with a steady hand on the reins.*
