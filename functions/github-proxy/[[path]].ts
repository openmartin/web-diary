// Cloudflare Pages Function: 将 /github-proxy/* 请求代理到 https://github.com/*
// 部署后由 Cloudflare 自动加载，无需额外配置
// 文档: https://developers.cloudflare.com/pages/functions/

type Params = { path?: string[] };

interface FunctionContext {
  request: Request;
  params: Params;
}

export const onRequest = async (context: FunctionContext): Promise<Response> => {
  const { request, params } = context;
  const originalUrl = new URL(request.url);

  // 拼接子路径，例如 /github-proxy/owner/repo.git/info/refs → owner/repo.git/info/refs
  const subPath = (params.path ?? []).join('/');
  const targetUrl = new URL(`https://github.com/${subPath}`);
  targetUrl.search = originalUrl.search;

  // 转发请求方法、请求体和必要的头
  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.delete('referer');
  headers.delete('origin');

  try {
    const upstream = await fetch(targetUrl.toString(), {
      method: request.method,
      headers,
      body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
      redirect: 'follow',
    });

    // 复制响应头并移除 WWW-Authenticate，避免浏览器弹出原生登录框覆盖自定义认证
    const responseHeaders = new Headers(upstream.headers);
    responseHeaders.delete('www-authenticate');
    // 允许跨域（Cloudflare Pages 与 GitHub 不同源）
    responseHeaders.set('access-control-allow-origin', '*');
    responseHeaders.set('access-control-allow-headers', 'authorization, content-type');
    responseHeaders.set('access-control-allow-methods', 'GET, POST, OPTIONS');

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  } catch (err) {
    return new Response(
      `GitHub proxy error: ${err instanceof Error ? err.message : String(err)}`,
      { status: 502 },
    );
  }
};

// 处理 CORS 预检请求
export const onRequestOptions = async (): Promise<Response> => {
  return new Response(null, {
    status: 204,
    headers: {
      'access-control-allow-origin': '*',
      'access-control-allow-headers': 'authorization, content-type',
      'access-control-allow-methods': 'GET, POST, OPTIONS',
      'access-control-max-age': '86400',
    },
  });
};
