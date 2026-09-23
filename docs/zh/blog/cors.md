---
title: 这一次我要彻底弄懂跨域
description: 一次讲清 CORS 与跨域方案
date: "2026-07-21"
---

# 这一次我要彻底弄懂跨域

前后端分离项目里，我们经常会同时看到两份看起来都在“解决跨域”的配置：前端的 Vite Proxy，以及后端的 CORS 中间件（以 Koa 框架为例）。

```ts
// vite.config.ts
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8000',
      changeOrigin: true,
    },
  },
}
```

```js
// Koa
app.use(cors())
```

它们解决的是同一个问题吗？生产环境有了网关，还要不要 CORS？为什么两个不同域名即使指向同一个生产网关，浏览器仍然认为它们跨域？这篇笔记从浏览器看到的请求出发，把这些问题一次讲清楚。

## 跨域是什么

浏览器用“源”来区分不同的网站，一个源由三部分组成：

```text [origin.txt]
协议（scheme）+ 主机（host）+ 端口（port）
```

只有三者全部相同才算同源。下面这些组合都属于不同源：

| 页面地址                  | 请求地址                  | 跨域原因 |
| ------------------------- | ------------------------- | -------- |
| `http://localhost:5173`   | `http://localhost:8000`   | 端口不同 |
| `https://app.example.com` | `https://api.example.com` | 主机不同 |
| `http://example.com`      | `https://example.com`     | 协议不同 |

跨域限制来自浏览器的**同源策略**。它主要限制网页中的 JavaScript 读取另一个源的响应，避免恶意网站在用户不知情的情况下读取其他网站的敏感数据。

这里最容易产生的误解是：跨域并不等于请求没有到达服务器。服务器可能已经成功处理并返回了响应，只是浏览器发现响应没有得到跨域授权，于是不把结果交给前端 JavaScript。

```text [cors-block.txt]
前端发出请求
  → 后端正常处理并返回
  → 浏览器检查 CORS 响应头
  → 检查失败
  → 前端 JavaScript 无法读取响应
```

CORS 是浏览器执行的规则，因此以下调用没有浏览器意义上的跨域问题：

- Node.js 服务调用 Python 服务；
- 后端服务调用对象存储；
- `curl`、Postman 或原生 SDK 调用 API。

这些调用当然仍可能遇到网络、认证、防火墙和网关限制，但那不是 CORS。

## CORS：允许一次真实的跨域请求

CORS 的全称是 Cross-Origin Resource Sharing。它并没有让两个源变成同源，而是由目标服务器通过响应头告诉浏览器：“我允许这个来源读取响应。”

例如页面位于：

```text
https://app.example.com
```

前端直接请求：

```text
https://api.example.com/users
```

浏览器会带上页面来源：

```http
Origin: https://app.example.com
```

后端如果允许这个来源，可以返回：

```http
Access-Control-Allow-Origin: https://app.example.com
```

浏览器看到授权后，才会把响应交给前端代码。Koa 项目里的：

```js
app.use(cors())
```

就是通过 `@koa/cors` 自动添加和处理这些响应头。

### 简单请求 vs 预检请求

部分请求可以直接发送，例如一些普通的 `GET` 请求。浏览器收到响应后再检查 `Access-Control-Allow-Origin`。

而包含 JSON、自定义请求头，或者使用 `PUT`、`DELETE` 等方法的请求，通常会先触发一次 `OPTIONS` 预检：

```http
OPTIONS /api/project
Origin: https://app.example.com
Access-Control-Request-Method: PUT
Access-Control-Request-Headers: authorization, content-type
```

服务器通过类似下面的响应说明允许范围：

```http
Access-Control-Allow-Origin: https://app.example.com
Access-Control-Allow-Methods: GET,HEAD,PUT,POST,DELETE,PATCH
Access-Control-Allow-Headers: authorization,content-type
```

预检通过后，浏览器才发送真正的 `PUT` 请求。

### Cookie 与通配符

如果前端需要跨域携带 Cookie，例如 Axios 设置了：

```ts
axios.create({
  withCredentials: true,
})
```

后端不能简单地使用：

```http
Access-Control-Allow-Origin: *
```

而需要返回明确的来源，并允许凭证：

```http
Access-Control-Allow-Origin: https://app.example.com
Access-Control-Allow-Credentials: true
```

对应的 Koa 配置可以写成：

```js
app.use(
  cors({
    origin: "https://app.example.com",
    credentials: true,
  }),
)
```

`withCredentials` 和 CORS 配置只负责允许凭证请求，Cookie 本身还需要满足浏览器的 `SameSite`、`Secure` 等规则。

CORS 只是浏览器是否允许前端读取响应的规则，它不是身份认证、权限控制，也不能替代 CSRF 防护。

## 开发环境：通过代理让浏览器看不到跨域

开发环境常见的情况是：

```text
前端：http://localhost:5177
后端：http://localhost:8000
```

如果浏览器直接请求 `localhost:8000`，因为端口不同，就会产生跨域。但前端可以始终请求相对路径，例如：

```ts
const ajax = axios.create({
  baseURL: "/api",
})
```

再由 Dev Server 代理。这里的代理者是开发者本机上的 Vite 开发服务器，只用于本地开发：

```ts
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8000',
      changeOrigin: true,
      rewrite: path => path.replace(/^\/api/, ''),
    },
  },
}
```

此时完整链路是：

```text [vite-proxy.txt]
浏览器请求 http://localhost:5177/api/users
  → 开发服务器接收
  → 转发到 http://localhost:8000/users
  → 开发服务器 把响应返回给浏览器
```

浏览器只看到页面和 API 都来自 `localhost:5177`，所以这是同源请求。真正的跨域发生在 Vite 和后端服务之间，而服务端调用不受浏览器同源策略限制。

因此，更准确地说：

> Proxy 没有授权跨域，而是通过反向代理把浏览器看到的请求变成了同源请求。

`changeOrigin: true` 会把代理请求的 `Host` 改成目标服务器的 Host，方便目标服务按域名正确路由。它本身不是一个 CORS 开关。

`rewrite` 用来改写转发给后端的路径。例如 `rewrite: (path) => path.replace(/^\/api/, '')` 会把浏览器请求的 `/api/users` 转发为后端的 `/users`。

还需要注意：`server.proxy` 只在 Vite 开发服务器运行时生效。执行生产构建后，它不会被打包进浏览器代码，也不会继续负责转发请求。

## 生产环境：网关与 CORS

> 这里讨论的是生产环境的请求入口。Nginx、Traefik 这类反向代理可以把请求转发到前端静态资源或后端服务；云 API Gateway 通常只负责 API 请求。下文统称它们为“生产网关”。

是否跨域，只取决于页面与请求地址**是否同源**，与请求后面是否经过网关无关。

### 页面与 API 同源，网关反向代理

页面和 API 使用同一个源，生产网关只负责按路径转发：

```text [same-origin-gateway.txt]
https://app.example.com/       → 前端静态资源
https://app.example.com/api/*  → Koa API
```

浏览器始终请求 `app.example.com`，生产网关再把 `/api` 转发到后端服务：

```text
浏览器
  → https://app.example.com/api/users
  → Nginx / Traefik
  → http://api-server:3000/api/users
```

浏览器看到的是同源请求，因此不需要 CORS。

### 页面与 API 不同源，配置 CORS

如果前端直接请求独立 API 域名：

```text
页面：https://app.example.com
API：https://api.example.com
```

两个 URL 的主机不同，所以这是跨域请求。即使它们指向同一个生产网关，结果也不会改变。

此时需要处理 CORS，包含两步：

1. 请求触发预检时，响应 `OPTIONS`；
2. 为实际响应添加 CORS 响应头。

可以选择以下任意一种方案完成：

#### 由生产网关处理 CORS

生产网关完成上述两步，后端服务无需重复配置：

```text [cors-owner.txt]
浏览器跨域请求
  → 生产网关处理 CORS
  → Koa
```

#### 由后端处理 CORS

生产网关只转发请求，由 Koa 完成上述两步：

```text
浏览器跨域请求
  → 生产网关转发
  → Koa 处理 CORS
```

生产网关和后端选择一处处理 CORS 即可，避免重复添加响应头。

## 对象存储如何解决跨域

假设某个应用的文件上传使用预签名 URL，大致流程是：

```text [presigned-upload.txt]
浏览器请求 Koa 获取预签名 URL
  → Koa 返回对象存储地址
  → 浏览器直接 PUT 文件到 MinIO / S3
```

即使 `/api` 已经通过生产网关实现同源，预签名 URL 仍可能指向另一个域名：

```text
页面：https://app.example.com
上传：https://storage.example.com/bucket/file
```

这次跨域发生在浏览器和对象存储之间，Koa 的 `app.use(cors())` 无法控制对象存储返回的响应头，必须在 MinIO、S3、COS 或 OSS 上单独配置允许的来源、方法和请求头。

如果希望上传也保持同源，应用返回给浏览器的上传 URL 必须指向同源的代理路径，例如：

```text
https://app.example.com/storage-public/*
https://app.example.com/storage-private/*
```

浏览器请求这些 URL 时，生产网关再把请求转发到对象存储。仅配置代理路由还不够：预签名、Host、路径和签名校验也必须正确配合。

开发环境可以在 Vite Dev Server 上配置相同的代理路径，但它不是生产网关。

## 选择跨域解决方案

| 场景                                | 是否跨域 | 应对方式                    |
| ----------------------------------- | -------- | --------------------------- |
| 本地开发，浏览器请求 Vite 的 `/api` | 否       | Vite Proxy 转发到后端       |
| 生产环境，生产网关提供同域 `/api`   | 否       | 生产网关反向代理，无需 CORS |
| 生产环境，前端直接请求独立 API 域名 | 是       | 生产网关或 Koa 配置 CORS    |
| 浏览器直接上传到独立对象存储域名    | 是       | 对象存储单独配置 CORS       |
| 后端服务调用另一个后端服务          | 不适用   | 不需要 CORS，检查网络与认证 |
