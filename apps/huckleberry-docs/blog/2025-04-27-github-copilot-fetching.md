---
slug: github-copilot-fetching
title: GitHub Copilot Rides into Town - Fetching the Web Like a Front‑Page Gunslinger
authors: [tim]
tags: [github-copilot, vs-code, web-fetching, productivity, workflow]
---

Think of Copilot as your trusty deputy. Keep it penned in the saloon and it will polish the bar; kick the doors wide and it can roam the frontier rounding up fresh documentation faster than Doc Holliday draws a derringer. *I'm your huckleberry* still rings true: let Copilot handle the quick‑draw research while you concentrate on upholding the code of the land.

<!-- truncate -->

## Why un‑holster Copilot?

Copilot isn't just a code-completion tool. It's a research assistant, documentation hunter, and context gatherer all rolled into one. When you need the latest information without leaving your editor, Copilot's web fetching capabilities shine brightest.

## The `#fetch` trick

Every Marshal needs a telegram line. For Copilot, that line is the `#fetch` trick. Tack it next to a URL and Copilot saddles up, rides out to the site, and trots back with a satchel of text ready for questioning.

```
#fetch https://example.com/documentation
```

If you prefer the hardware store to the hitching post, click the paper‑clip in Copilot Chat, choose **Fetch Web Page**, paste the link and watch the dust settle.

### Two lightning draws

1. Embed the command directly:

   ```
   Show me how to test a Django view #fetch https://docs.djangoproject.com/en/stable/topics/testing/
   ```

2. Use the UI route for long scrolls that would turn your prompt into a cattle drive.

## Tuning the telegraph

Turn on the preview setting `github.copilot.chat.codesearch.enabled` and Copilot hears every click of the key. Leave it off and the chatter sounds like a distant stagecoach wheel.

## When the move scores a bullseye

* **Fresh intel:** Yesterday's API ambush becomes today's smooth ride.  
* **Sharper judgement:** Responses match the version you actually run.  
* **Less wandering:** Stay in your editor; keep the coffee pot simmering on the stove.

As the campfire tune goes, *get along little dogies, get along*,  momentum keeps the herd together.

## Shoot‑out example

Hooking a React app to BrightSign players:

```
I need a markdown guide for calling BrightSign REST endpoints from React
#fetch https://brightsign.atlassian.net/wiki/spaces/DOC/pages/1313046529/Main+REST+HTTP+API+version+2022+06
```

Copilot rides back with the endpoints and lays out each step like street dust before high noon.

## Keeping your stirrups short

| Habit | Pay‑off |
|-------|---------|
| Pinpoint the exact doc page | Less noise, faster verdict |
| Mix with workspace snippets | Your code tells the full story |
| Ask narrow questions | "How do I refresh a token?" beats "Tell me everything about auth" |
| Cross‑check vital steps | A smart Marshal reads the fine print |
| Use on fast‑moving libraries | Today's patch can dodge tomorrow's ambush |

## Known barbed wire

* Some ranches turn away riders.  
* Oversized pages arrive clipped.  
* Interactive guides can baffle the parser.  
* Copilot has an appetite, but even it cannot eat the whole prairie in one sitting.

## Extra ammo in Copilot's belt

* Local files  
* Code snippets  
* Terminal output  
* Test failures

Blend these with web fetching and you have a chuck‑wagon stew worthy of Tombstone's busiest cook.

## Last call at the Oriental

Web‑fetching is less smoke and mirrors, more poker hand played with a cold stare. Call the right bet, keep your prompts tight, and always tilt your hat towards the source before pushing code to production. Your deputy will have the latest chapter of the law at hand.

*And the sun is shining on the desert sky.*

---

*Keep your productivity high with GitHub Copilot's web fetching capabilities. When you need the latest documentation without context switching, Copilot's got you covered. Check out our [Language Model Tools documentation](https://cambridgemonorail.github.io/vscode-huckleberry/language-model-tools) for more ideas on how to integrate AI assistants like Copilot with Huckleberry for maximum efficiency.*
