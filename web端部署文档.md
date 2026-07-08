# Web 端构建部署文档

本文档适用于当前 `openim-electron-demo` 项目的 Web 端构建与远程部署。桌面 Electron 打包不在本文档范围内。

## 1. 项目构建概览

当前 Web 端使用 Vite + React 构建。

关键文件：

| 文件 | 作用 |
| --- | --- |
| `package.json` | 脚本、依赖、Node 版本约束 |
| `.env` | Web 端构建时注入的接口地址 |
| `vite.web.config.ts` | Web 端 Vite 构建配置 |
| `vite.proxy.ts` | 本地开发代理配置 |
| `src/api/business.ts` | 业务 HTTP API baseURL 来源 |
| `src/layout/useGlobalEvents.tsx` | OpenIM SDK API/WS 地址来源 |
| `public/` | 构建时原样复制到 `dist/` 的静态资源 |
| `dist/` | Web 构建产物目录 |

构建脚本：

```bash
npm run build:web
```

等价于：

```bash
vite build --config vite.web.config.ts
```

构建产物输出到：

```text
dist/
```

## 2. 环境要求

建议环境：

| 依赖 | 要求 |
| --- | --- |
| Node.js | `^14.18.0` 或 `>=16.0.0`，建议使用 Node 16+ |
| npm | 随 Node 安装即可 |
| Web Server | Nginx、Caddy、OpenResty、静态资源托管平台均可 |
| 后端服务 | OpenIM API、OpenIM WebSocket、业务 API 均需可被浏览器访问 |

首次安装依赖：

```bash
npm install
```

如果依赖安装后补丁未生效，可手动执行：

```bash
npm run postinstall
```

## 3. 环境变量说明

当前 `.env` 中主要配置如下：

```bash
VITE_BASE_HOST=47.238.134.161

VITE_WS_URL=ws://47.238.134.161:10001
VITE_API_URL=http://47.238.134.161:10002
VITE_CHAT_URL=/business-api
VITE_BUSINESS_API_TARGET=http://47.238.134.161:8092
```

变量含义：

| 变量 | 当前用途 | 生产建议 |
| --- | --- | --- |
| `VITE_WS_URL` | OpenIM SDK WebSocket 地址 | HTTPS 页面必须使用 `wss://` |
| `VITE_API_URL` | OpenIM SDK HTTP API 地址 | HTTPS 页面必须使用 `https://` |
| `VITE_CHAT_URL` | 业务 HTTP API baseURL | 建议使用同源路径，例如 `/business-api` |
| `VITE_BUSINESS_API_TARGET` | Vite 本地开发代理目标 | 只对本地 dev server 有效，生产不生效 |
| `VITE_BASE_HOST` | 便于维护服务器 IP | 当前代码不直接读取，仅作为配置辅助 |

注意：

- Vite 的 `VITE_*` 变量是在构建时写入前端包的。
- 修改 `.env` 后必须重新执行 `npm run build:web`。
- 生产环境不能依赖 `vite.proxy.ts`，因为它只在 `npm run dev:web` 的 Vite dev server 中生效。

## 4. 本地开发启动

Web 端本地开发：

```bash
npm run dev:web
```

默认访问：

```text
http://127.0.0.1:7777/
```

本地开发时，`VITE_CHAT_URL=/business-api` 会被 Vite dev server 代理到：

```text
VITE_BUSINESS_API_TARGET=http://47.238.134.161:8092
```

代理规则：

```text
/business-api/user/login
  -> http://47.238.134.161:8092/user/login
```

## 5. 生产构建

建议上线前确认 `.env` 或 `.env.production` 已设置为生产地址。

构建：

```bash
npm run build:web
```

构建成功后，部署以下目录：

```text
dist/
```

不要只部署 `dist/assets`，必须部署完整 `dist` 目录。`public/` 下的资源会在构建时复制到 `dist/`，例如：

| 资源 | 用途 |
| --- | --- |
| `wasm_exec.js` | OpenIM Web SDK WASM 运行依赖 |
| `openIM.wasm` | OpenIM Web SDK WASM 文件 |
| `emojis.json` | 表情资源 |
| `font/twemoji.woff2` | 表情字体 |
| `favicon.ico` | 网站图标 |

## 6. HTTP 与 HTTPS 部署规则

如果 Web 页面通过 HTTP 访问：

```text
http://im.example.com
```

则接口可以是：

```text
http://...
ws://...
```

如果 Web 页面通过 HTTPS 访问：

```text
https://im.example.com
```

则接口必须使用：

```text
https://...
wss://...
```

否则浏览器会触发 Mixed Content 限制，常见表现：

- 登录接口请求被浏览器直接拦截。
- OpenIM WebSocket 连接失败。
- 控制台出现 `Mixed Content` 报错。
- 本地开发可用，线上 HTTPS 不可用。

正式远程部署建议统一使用 HTTPS：

```bash
VITE_WS_URL=wss://im.example.com/msg_gateway
VITE_API_URL=https://im.example.com/api
VITE_CHAT_URL=/business-api
```

## 7. 推荐生产部署架构

推荐使用同域部署，避免跨域和 Mixed Content：

```text
https://im.example.com/              -> Web 静态资源 dist/
https://im.example.com/api           -> OpenIM API
wss://im.example.com/msg_gateway     -> OpenIM WebSocket
https://im.example.com/business-api  -> 业务 API
```

对应前端环境变量：

```bash
VITE_WS_URL=wss://im.example.com/msg_gateway
VITE_API_URL=https://im.example.com/api
VITE_CHAT_URL=/business-api

# 仅本地开发代理使用，生产静态部署不读取该配置
VITE_BUSINESS_API_TARGET=http://127.0.0.1:8092
```

## 8. Nginx 部署示例

以下示例假设：

- 域名：`im.example.com`
- Web 构建产物目录：`/var/www/openim-web/dist`
- OpenIM API：`http://127.0.0.1:10002`
- OpenIM WS：`http://127.0.0.1:10001`
- 业务 API：`http://127.0.0.1:8092`

```nginx
server {
    listen 80;
    server_name im.example.com;

    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name im.example.com;

    ssl_certificate     /etc/nginx/certs/im.example.com/fullchain.pem;
    ssl_certificate_key /etc/nginx/certs/im.example.com/privkey.pem;

    root /var/www/openim-web/dist;
    index index.html;

    # SPA 路由兜底
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 长缓存带 hash 的构建资源
    location /assets/ {
        try_files $uri =404;
        expires 30d;
        add_header Cache-Control "public, max-age=2592000, immutable";
    }

    # WASM/运行时资源不要缺失
    location = /openIM.wasm {
        try_files $uri =404;
        add_header Content-Type application/wasm;
    }

    location = /wasm_exec.js {
        try_files $uri =404;
    }

    # OpenIM HTTP API
    location /api/ {
        proxy_pass http://127.0.0.1:10002/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # OpenIM WebSocket
    location /msg_gateway {
        proxy_pass http://127.0.0.1:10001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }

    # 业务 API。前端请求 /business-api/user/login，
    # Nginx 转发到 http://127.0.0.1:8092/user/login。
    location /business-api/ {
        proxy_pass http://127.0.0.1:8092/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

部署后重载 Nginx：

```bash
nginx -t
systemctl reload nginx
```

## 9. 纯 HTTP 内网部署示例

如果只是内网测试，不启用 HTTPS，可以直接部署 HTTP。

前端 `.env` 示例：

```bash
VITE_WS_URL=ws://192.168.1.10:10001
VITE_API_URL=http://192.168.1.10:10002
VITE_CHAT_URL=/business-api
VITE_BUSINESS_API_TARGET=http://192.168.1.10:8092
```

Nginx 示例：

```nginx
server {
    listen 80;
    server_name 192.168.1.10;

    root /var/www/openim-web/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /business-api/ {
        proxy_pass http://192.168.1.10:8092/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

注意：纯 HTTP 适合内网测试，不建议用于公网正式环境。

## 10. 部署步骤清单

1. 拉取代码：

   ```bash
   git pull
   ```

2. 安装依赖：

   ```bash
   npm install
   ```

3. 配置生产环境变量：

   ```bash
   cp .env .env.production
   ```

   按实际域名或服务器地址修改：

   ```bash
   VITE_WS_URL=wss://im.example.com/msg_gateway
   VITE_API_URL=https://im.example.com/api
   VITE_CHAT_URL=/business-api
   ```

4. 构建：

   ```bash
   npm run build:web
   ```

5. 上传或同步 `dist/` 到服务器：

   ```bash
   rsync -av --delete dist/ user@server:/var/www/openim-web/dist/
   ```

6. 更新 Nginx 配置并重载：

   ```bash
   nginx -t
   systemctl reload nginx
   ```

7. 浏览器访问：

   ```text
   https://im.example.com
   ```

## 11. 上线前检查

浏览器检查：

- 首页可打开，无白屏。
- 刷新任意路由不会 404。
- 控制台没有 `Mixed Content`。
- 控制台没有 `openIM.wasm` 或 `wasm_exec.js` 404。
- 登录接口返回正常。
- OpenIM WebSocket 连接成功。
- 登录后会话、联系人、消息发送基础链路正常。

网络检查：

```bash
curl -I https://im.example.com
curl -I https://im.example.com/wasm_exec.js
curl -I https://im.example.com/openIM.wasm
curl -I https://im.example.com/business-api/user/openim/config/status
```

WebSocket 可用性建议用浏览器 DevTools 的 Network 面板检查：

```text
wss://im.example.com/msg_gateway
```

## 12. 常见问题

### 12.1 本地能登录，线上不能登录

常见原因：

- 线上 `VITE_CHAT_URL=/business-api`，但 Nginx 没有配置 `/business-api/` 反代。
- HTTPS 页面请求 HTTP 后端，被浏览器 Mixed Content 拦截。
- 后端 CORS 未放行，且没有使用同源反代。

优先处理方式：

- 使用同源 Nginx 反代。
- HTTPS 页面统一使用 `https://` 和 `wss://`。

### 12.2 页面刷新后 404

原因：SPA 路由没有兜底到 `index.html`。

Nginx 需要配置：

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

### 12.3 WebSocket 连接失败

检查：

- HTTPS 页面是否仍在使用 `ws://`。
- Nginx 是否配置 `Upgrade` 和 `Connection` 头。
- 后端 `10001` 是否可达。
- 证书是否有效。

### 12.4 修改 `.env` 后线上没变化

原因：Vite 环境变量在构建时写入静态包。

处理：

```bash
npm run build:web
```

然后重新部署 `dist/`。

### 12.5 `openIM.wasm` 加载失败

检查：

- `dist/openIM.wasm` 是否存在。
- Web Server 是否部署了完整 `dist/`。
- Nginx 是否能返回 `application/wasm`。

## 13. 回滚方案

保留上一版 `dist` 目录：

```text
/var/www/openim-web/releases/20260708_120000
/var/www/openim-web/releases/20260708_130000
```

使用软链接切换：

```bash
ln -sfn /var/www/openim-web/releases/20260708_120000 /var/www/openim-web/current
nginx -t
systemctl reload nginx
```

Nginx root 指向：

```nginx
root /var/www/openim-web/current;
```

这样回滚不需要重新构建，只切换静态资源版本。

## 14. 推荐原则

- 正式公网部署统一 HTTPS。
- Web、OpenIM API、业务 API 尽量走同域反代。
- 不在生产环境依赖 Vite dev proxy。
- 每次修改 `.env` 后重新构建。
- 只部署 `dist/`，不要把源码、`.env`、`node_modules` 暴露到 Web 根目录。
- 上线前用无缓存窗口或新浏览器 Profile 验证登录链路。
