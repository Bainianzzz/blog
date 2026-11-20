---
title: Wiring the DeepSeek App Suite Into Pi
date: "2026-11-13"
---

# Wiring the DeepSeek App Suite Into Pi

> The figures below are frames from the intro video I made for this post (about 2.5 minutes, built with Remotion). The on-screen text in them is Chinese.

On November 13, 2026, DeepSeek released the API for its full app suite. No new model, but the update matters just as much: the official team opened up its own wheels for everyone, which makes building an agent far easier and makes it much simpler to extend an existing agent app. I wired the new capabilities into my coding agent right away, and the result has been very satisfying.

![The official team opened up its own wheels: building agents gets easier, existing agent apps can be extended](/assets/pi-ds/why.jpg)

I use Pi as my agent. It is simple enough: no complicated harness framework, just a plain system prompt and a handful of tools handed to the model. In practice Pi ships results fast and lets me iterate on my approach quickly compared with other agent apps. It may not be an all-powerful "god", but it is more than capable of playing the "helper".

![Pi's core is just a system prompt and a few tools; it ships fast and iterates fast](/assets/pi-ds/pi-agent.jpg)

## Hooking DeepSeek and the app suite into Pi

Connecting Pi to DeepSeek is easy: set the environment variables, and Pi picks them up and configures the DeepSeek model for you. You can also use cc Switch, which lets you point at DeepSeek models from whichever channel you like.

![Environment variables, or CC Switch for picking a channel — either way you land on a DeepSeek model](/assets/pi-ds/connect.jpg)

The model alone is not enough, though — it does not give us the whole new app API. That is where Pi's extension mechanism came in: I wrote one skill plus two extensions to integrate DeepSeek's speech synthesis, handwriting recognition, and web search and fetch capabilities.

![One skill plus two extensions: speech synthesis, handwriting recognition, web search and fetch](/assets/pi-ds/capabilities.jpg)

### First decide: should the model see it?

Skills and extensions are the two doors Pi leaves open for external capabilities. The difference:

- **Extension**: registers the capability as a **tool** with parameters and a return value, lets the model decide when to call it, and **the result goes straight back into the context**.
- **Skill**: a **document written for the model to read**. Only the name and description load at startup; the body is read on demand. It specifies a task flow, or teaches the model some domain knowledge, helping it **finish a particular task**.

![An extension shapes the next agent loop; a skill is read on demand and the model produces the artifact](/assets/pi-ds/ports.jpg)

My choice: speech synthesis became a skill — follow the instructions, call the API, produce an audio file, and that file is the final artifact. Handwriting recognition, web search, and fetch became extensions: their API results join the context, feed the next turn of the agent loop, and shape the final answer.

![The artifact is a file, the result goes back into context: a skill ends at the artifact, an extension feeds the next agent loop](/assets/pi-ds/choice.jpg)

## Wrapping up

The three capabilities live in three repositories:

- [deepseek-tts](https://github.com/Bainianzzz/deepseek-tts): speech synthesis, as a skill
- [pi-deepseek-ocr](https://github.com/Bainianzzz/pi-deepseek-ocr): handwriting recognition, as an extension
- [pi-deepseek-search](https://github.com/Bainianzzz/pi-deepseek-search): web search and fetch, as an extension

![All three repositories are open source](/assets/pi-ds/repos.jpg)

I open-sourced these extensions and the skill on GitHub. Sharpen your tools before the work — why not try this API in your own coding agent too.
