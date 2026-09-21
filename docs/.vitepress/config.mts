import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  // docs/zh/** 挂到根路由，URL 里不出现 /zh/
  rewrites: (id: string) => id.replace(/^zh\//, ""),

  locales: {
    root: {
      label: "简体中文",
      lang: "zh-CN",
      title: "Bainianzzz 的博客",
      description:
        "Bainianzzz 的技术博客，分享学习笔记、思考，以及日常生活的记录",
      themeConfig: {
        nav: [
          { text: "首页", link: "/" },
          { text: "博客", link: "/blog/hello-world" },
        ],
      },
    },
    en: {
      label: "English",
      lang: "en",
      title: "Bainianzzz's Blog",
      description:
        "Bainianzzz's tech blog, sharing study notes, thoughts, and everyday life.",
      themeConfig: {
        nav: [
          { text: "Home", link: "/en/" },
          { text: "Blog", link: "/en/blog/hello-world" },
        ],
      },
    },
  },
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
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
