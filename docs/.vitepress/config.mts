import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Bainianzzz's Blog",
  description: "One day, bainian will seek his fortune.",

  locales: {
    root: {
      label: "English",
      lang: "en",
    },
    zh: {
      label: "简体中文",
      lang: "zh-CN",
      title: "Bainianzzz 的博客",
      description: "一万次悲伤，依然会有 dream",
      themeConfig: {
        nav: [
          { text: "首页", link: "/zh/" },
          { text: "博客", link: "/zh/blog/hello-world" },
        ],
      },
    },
  },
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: "Home", link: "/" },
      { text: "Blog", link: "/blog/hello-world" },
    ],

    // sidebar: [
    //   {
    //     text: "Examples",
    //     items: [
    //       { text: "Markdown Examples", link: "/markdown-examples" },
    //       { text: "Runtime API Examples", link: "/api-examples" },
    //     ],
    //   },
    // ],

    socialLinks: [{ icon: "github", link: "http://github.com/Bainianzzz" }],
  },
})
