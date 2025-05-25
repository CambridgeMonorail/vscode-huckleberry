---
slug: visualising-tasks-the-huckleberry-explorer
title: "Visualising Tasks: The Huckleberry Explorer"
authors: [tim]
tags: [vscode, tasks, ui, explorer, productivity, spaghetti-western]
---

> *“You called down the thunder, well now you’ve got it.”*  
> Wyatt Earp, *Tombstone* (1993)

Pull up a stool in the digital saloon. The build clatters like a player-piano, the pull-request poker game drags past midnight, and centre-stage—glinting beneath the neon glow of Visual Studio Code—sits the **Huckleberry Task Explorer**, your hi-tech six-shooter for taming unruly workloads.

No corporate waffle. Just straight-talking code-wrangling with a spaghetti-western swagger.

---

## More than “just a list”

Tap the Huckleberry badge in the Activity Bar and the Explorer swings open like batwing doors at the Long Branch. Each task rides in beneath its posse leader:

| Status          | Icon | What it really means                                        |
|-----------------|------|-------------------------------------------------------------|
| In progress     | 🔄   | Code is simmering over the campfire                         |
| Blocked         | ⚠️   | Wagon-train of dependencies blocking the trail             |
| In review       | 👁️   | Time for a quick-draw code critique                        |
| Completed       | ✓    | Dust settled; cue *“Don’t Stop Me Now”*                     |

Icons mirror what you see inside the Explorer, so reading this table is as close as you can get to the live view without opening VS Code.

---

## Why a tree view?

Tasks multiply like tumbleweed. A feature spawns research, research spawns spikes, spikes spawn bugs. A tree view shows the whole family portrait at a glance:

```txt
Feature Implementation
├── Research Phase
│   ├── Analyze Requirements
│   └── Review Similar Solutions
├── Development
│   ├── Core Logic
│   └── Test Coverage
└── Documentation
```

Collapse the parent once the young ’uns ride into the sunset and your sidebar stays lean.

---

## Intelligent integration

The Explorer is not bolted on; it is welded straight into the Huckleberry core:

* **Create in chat, appear in view**: draft a task in Huckleberry chat and it materialises in the Explorer before you can mutter “howdy”.
* **Tick it off, ripple the truth**: mark a task ✓ inside the Explorer and every reference—notes, pull-requests, commit messages—updates instantly.
* **Codebase sweep**: a pass across your project scoops up `// TODO:` and `# FIXME:` notes and drops them in the right spot with the correct icon.
* **One-click jump**: select a task and VS Code opens the exact file and line, no more Ctrl + P roulette.

---

## Visual context wins standoffs

Spreadsheets list tasks; Explorer explains them. Bottlenecks glare, dependencies untangle and scoping rows feel less like the Wild Bunch and more like the Travelling Wilburys. Watch for patterns:

* An epic ballooning like an over-inflated stagecoach?  
* Reviews piling on a lone engineer humming *“I’m So Tired”*?  
* The same ticket bouncing from ⚠️ to 🔄 to ⚠️ again?

Call it early and ride into the sunset with a clean conscience.

---

## Coming soon to a dusty IDE near you

The next set of tools is already in the workshop:

* Drag-and-drop re-ordering  
* Saved filter presets (mixtapes for tasks)  
* Graph-style dependency arrows  
* Team activity heat-maps  

Got a wish? Fire it into GitHub Discussions and we will see if it earns its badge.

---

## Saddle up

Open the Explorer and watch chaos line up like cattle at branding time. When the sun dips behind your dual monitors you will be humming *“I Still Haven’t Found What I’m Looking For”*—only now in triumph, because every task is exactly where it should be.

Huckleberry: the right hand for your code-slinger. See the big picture, ship the right code and roll credits against a widescreen desert sunset.
