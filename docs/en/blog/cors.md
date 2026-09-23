---
title: Understanding Cross-Origin Requests
description: CORS and cross-origin setups, explained in details
date: "2026-07-21"
---

# Understanding Cross-Origin Requests Once and for All

In projects with a separate frontend and backend, you often see two pieces of configuration that both look like they "solve CORS": a Vite proxy on the frontend, and CORS middleware on the backend (Koa in this example).

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

Do they solve the same problem? Once a gateway is in place in production, do you still need CORS? Why does the browser still treat two different domains as cross-origin even when they point at the same production gateway? This note starts from the request the browser actually sees and answers all of it in one pass.

## What "cross-origin" means

The browser separates websites by "origin", and an origin has three parts:

```text [origin.txt]
scheme + host + port
```

All three have to match for two URLs to be same-origin. Every pair below is cross-origin:

| Page URL                  | Request URL               | Why it's cross-origin |
| ------------------------- | ------------------------- | --------------------- |
| `http://localhost:5173`   | `http://localhost:8000`   | different port        |
| `https://app.example.com` | `https://api.example.com` | different host        |
| `http://example.com`      | `https://example.com`     | different scheme      |

The restriction comes from the browser's **same-origin policy**. It mainly stops JavaScript on one page from reading responses from another origin, so a malicious site can't read another site's sensitive data without the user knowing.

The most common misunderstanding here: cross-origin does not mean the request never reached the server. The server may well have handled it and returned a response — the browser just refuses to hand that result to your frontend JavaScript, because the response wasn't authorized for cross-origin access.

```text [cors-block.txt]
frontend sends the request
  → backend handles it and responds
  → browser checks the CORS response headers
  → check fails
  → frontend JavaScript cannot read the response
```

CORS is a rule the browser enforces, so these calls have no cross-origin problem in the browser's sense:

- a Node.js service calling a Python service;
- a backend service calling object storage;
- `curl`, Postman, or a native SDK calling an API.

They can of course still run into network, auth, firewall, and gateway limits — but that isn't CORS.

## CORS: authorizing one real cross-origin request

CORS stands for Cross-Origin Resource Sharing. It does not make two origins the same; the target server uses response headers to tell the browser "I allow this origin to read the response."

Say the page lives at:

```text
https://app.example.com
```

and the frontend requests:

```text
https://api.example.com/users
```

The browser sends the page's origin along:

```http
Origin: https://app.example.com
```

If the backend allows that origin, it can answer:

```http
Access-Control-Allow-Origin: https://app.example.com
```

Only after seeing that authorization does the browser pass the response to your frontend code. The Koa line:

```js
app.use(cors())
```

is `@koa/cors` adding and handling those response headers for you.

### Simple requests vs preflight requests

Some requests go out directly — a plain `GET`, for instance. The browser then checks `Access-Control-Allow-Origin` once the response comes back.

Requests that carry JSON, custom headers, or methods such as `PUT` and `DELETE` usually trigger an `OPTIONS` preflight first:

```http
OPTIONS /api/project
Origin: https://app.example.com
Access-Control-Request-Method: PUT
Access-Control-Request-Headers: authorization, content-type
```

The server describes the allowed range:

```http
Access-Control-Allow-Origin: https://app.example.com
Access-Control-Allow-Methods: GET,HEAD,PUT,POST,DELETE,PATCH
Access-Control-Allow-Headers: authorization,content-type
```

Only after the preflight passes does the browser send the real `PUT`.

### Cookies and wildcards

If the frontend needs to send cookies cross-origin, for example through Axios:

```ts
axios.create({
  withCredentials: true,
})
```

the backend cannot simply use:

```http
Access-Control-Allow-Origin: *
```

It has to return the explicit origin and allow credentials:

```http
Access-Control-Allow-Origin: https://app.example.com
Access-Control-Allow-Credentials: true
```

The matching Koa config:

```js
app.use(
  cors({
    origin: "https://app.example.com",
    credentials: true,
  }),
)
```

`withCredentials` and the CORS config only permit credentialed requests — the cookie itself still has to satisfy the browser's `SameSite`, `Secure`, and related rules.

CORS only decides whether the browser lets your frontend read a response. It is not authentication, not authorization, and not a replacement for CSRF protection.

## Development: hide cross-origin from the browser with a proxy

The usual local setup:

```text
frontend: http://localhost:5177
backend:  http://localhost:8000
```

A direct browser request to `localhost:8000` is cross-origin, since the port differs. Instead the frontend can always request a relative path:

```ts
const ajax = axios.create({
  baseURL: "/api",
})
```

and let the dev server proxy it. The proxy here is the Vite dev server on your own machine, used only for local development:

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

The full chain now looks like this:

```text [vite-proxy.txt]
browser requests http://localhost:5177/api/users
  → dev server receives it
  → forwards to http://localhost:8000/users
  → dev server returns the response to the browser
```

The browser only sees that the page and the API both come from `localhost:5177`, so this is same-origin. The real cross-origin hop happens between Vite and the backend service, and server-to-server calls aren't subject to the browser's same-origin policy.

So, more precisely:

> A proxy doesn't grant cross-origin access — it turns the request the browser sees into a same-origin one through reverse proxying.

`changeOrigin: true` rewrites the proxied request's `Host` header to the target server's host, which helps the target route correctly by domain. It is not a CORS switch.

`rewrite` is used to rewrite the path forwarded to the backend. For example `rewrite: (path) => path.replace(/^\/api/, '')` turns the browser's `/api/users` into `/users` for the backend.

One more thing to keep in mind: `server.proxy` only exists while the Vite dev server is running. After a production build it is not bundled into browser code, and it won't forward requests anymore.

## Production: gateways and CORS

> This section is about the production entry point. Reverse proxies like Nginx and Traefik can forward requests to frontend static assets or backend services; cloud API gateways usually only handle API requests. I'll call all of them "the production gateway" below.

Whether a request is cross-origin depends only on whether the page and the request URL are **same-origin**. Whether a gateway sits in front of the request makes no difference.

### Same-origin page and API, gateway reverse proxies

The page and the API share a single origin, and the gateway only forwards by path:

```text [same-origin-gateway.txt]
https://app.example.com/       → frontend static assets
https://app.example.com/api/*  → Koa API
```

The browser always talks to `app.example.com`, and the gateway forwards `/api` to the backend service:

```text
browser
  → https://app.example.com/api/users
  → Nginx / Traefik
  → http://api-server:3000/api/users
```

The browser sees a same-origin request, so no CORS is needed.

### Different origins, configure CORS

If the frontend talks to a dedicated API domain:

```text
page: https://app.example.com
API:  https://api.example.com
```

The hosts differ, so this is cross-origin. Even if both point at the same production gateway, that doesn't change.

You now have to handle CORS, which has two parts:

1. answer `OPTIONS` when the request triggers a preflight;
2. add the CORS headers to the actual response.

Either of these approaches works:

#### Let the production gateway handle CORS

The gateway does both steps, and the backend service doesn't duplicate the config:

```text [cors-owner.txt]
browser cross-origin request
  → gateway handles CORS
  → Koa
```

#### Let the backend handle CORS

The gateway only forwards the request, and Koa does both steps:

```text
browser cross-origin request
  → gateway forwards
  → Koa handles CORS
```

Pick one place — gateway or backend — to avoid adding the headers twice.

## How object storage handles cross-origin

Say an app uploads files with presigned URLs; the flow looks roughly like this:

```text [presigned-upload.txt]
browser asks Koa for a presigned URL
  → Koa returns the object storage URL
  → browser PUTs the file straight to MinIO / S3
```

Even if `/api` is same-origin through the gateway, the presigned URL can still point at a different domain:

```text
page:   https://app.example.com
upload: https://storage.example.com/bucket/file
```

This time the cross-origin hop is between the browser and the object storage. Koa's `app.use(cors())` can't control what object storage sends back — you have to configure the allowed origins, methods, and headers on MinIO, S3, COS, or OSS itself.

If you want uploads to stay same-origin too, the upload URL the app hands to the browser has to point at a same-origin proxy path, for example:

```text
https://app.example.com/storage-public/*
https://app.example.com/storage-private/*
```

The browser requests those URLs, and the production gateway forwards them to object storage. A proxy route alone isn't enough: presigning, the `Host` header, the path, and signature verification all have to line up.

In development you can configure the same proxy paths on the Vite dev server, but that is not a production gateway.

## Choosing a cross-origin solution

| Scenario                                        | Cross-origin? | What to do                                  |
| ----------------------------------------------- | ------------- | ------------------------------------------- |
| Local dev, browser calls Vite's `/api`          | No            | Vite proxy forwards to the backend          |
| Production, gateway serves a same-origin `/api` | No            | Gateway reverse proxies, no CORS needed     |
| Production, frontend calls a dedicated API domain | Yes         | Configure CORS on the gateway or in Koa     |
| Browser uploads straight to a dedicated storage domain | Yes    | Configure CORS on the object storage        |
| A backend service calls another backend service | N/A           | No CORS; check network and auth             |
