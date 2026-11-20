---
title: 将 deepseek 全家桶应用能力接入 Pi
date: "2026-11-13"
category: agent 学习之路
---

# 标题：将 deepseek 全家桶应用能力接入 Pi

> 配图截自我为这篇文章做的介绍视频（约 2 分半，Remotion 制作）。

deepseek 在 2026 年 11 月 13 号，deepseek 发布了全家桶应用 API，虽然不是新模型，但这次更新也同样重要，官方把自己的轮子给所有人用，大大方便了 agent 的开发，以及对现有 agent 应用的能力的拓展。我立刻将这些新能力集成到了我的 coding agent 上，效果令人非常满意。

![官方把自己的轮子给所有人用：Agent 的开发大大方便，现有 Agent 应用可以能力拓展](/assets/pi-ds/why.jpg)

我使用了 Pi 作为我的 agent，它足够简单，没有复杂的 harness 框架，给模型的只有简单的系统提示词和几个工具。从使用体验上来说，相较于其他 agent 应用，Pi 能很快的交付成功，能够快速迭代我的方案。它也许不是一个全能的“神”，但觉得能够胜任“帮手”的角色。

![Pi 的内核只有系统提示词和几个工具；很快交付成功、快速迭代方案](/assets/pi-ds/pi-agent.jpg)

## Pi 接入 deepseek 以及全家福应用能力

Pi 接入 deepseek 的方式很简单，可以配置环境变量，Pi 识别到就会自动配置好 deepseek 模型。你也可以使用 cc Switch 配置，让你使用各种渠道的 deepseek 模型。

![配置环境变量，或者用 CC Switch 切换渠道，都能接上 DeepSeek 模型](/assets/pi-ds/connect.jpg)

接入了模型还不够，我们并不能完整使用这次更新的全家福引用 API。这时候，我利用了 Pi 的扩展机制。写了 1 个 skill + 2 个 extension，集成了 deepseek 的语音生成、文件手写识别以及网页搜索和抓取的能力。

![1 个 skill + 2 个 extension：语音生成、文件手写识别、网页搜索与抓取](/assets/pi-ds/capabilities.jpg)

### 先决定：模型要不要「看见」它

Skill 和 extension 是 Pi 给外部能力留了两个口子，它们的差别在于：

- **Extension**：把能力注册成**工具**，有参数、有返回值，交给模型自己判断何时调用，**结果直接回到上下文**。
- **Skill**：一份写给模型看的**说明**。启动时只加载名字和描述，正文按需读取，用来指定任务流程和或者教会模型某个领域知识，帮助模型去**完成某项任务**。

![Extension 对下一轮 agent loop 产生影响；Skill 按需读取，最终产物由模型按说明做出来](/assets/pi-ds/ports.jpg)

我的选择是：语音合成能力写成一个 skill，根据指引调用 API 生成语音文件，这便是我想要的最终的产物；手写识别、联网搜索和抓取写成 extension，这些 api 调用的结果将被加入上下文，对下一轮的 agent loop 产生影响，从而得到最终结果。

![产物是文件，结果要进上下文：skill 走到最终产物，extension 回到下一轮 agent loop](/assets/pi-ds/choice.jpg)

## 结尾

这三个能力分别落在三个仓库里：

- [deepseek-tts](https://github.com/Bainianzzz/deepseek-tts)：语音生成，写成一个 skill
- [pi-deepseek-ocr](https://github.com/Bainianzzz/pi-deepseek-ocr)：文件手写识别，写成一个 extension
- [pi-deepseek-search](https://github.com/Bainianzzz/pi-deepseek-search)：网页搜索与抓取，写成一个 extension

![这三个仓库都已开源](/assets/pi-ds/repos.jpg)

这些扩展和 skill，我都开源在了 github。工欲善其事，必先利其器，不妨在你自己的 coding agent 里也试试这套 API 吧～