// 全局常量配置
const PROXY_URL = '/proxy/';    // 适用于 Cloudflare, Netlify (带重写), Vercel (带重写)
// const HOPLAYER_URL = 'https://hoplayer.com/index.html';
const SEARCH_HISTORY_KEY = 'videoSearchHistory';
const MAX_HISTORY_ITEMS = 5;

// 密码保护配置
// 注意：PASSWORD 环境变量是必需的，所有部署都必须设置密码以确保安全
const PASSWORD_CONFIG = {
    localStorageKey: 'passwordVerified',  // 存储验证状态的键名
    verificationTTL: 90 * 24 * 60 * 60 * 1000  // 验证有效期（90天，约3个月）
};

// 网站信息配置
const SITE_CONFIG = {
    name: 'LibreTV',
    url: 'https://libretv.is-an.org',
    description: '免费在线视频搜索与观看平台',
    logo: 'image/logo.png',
    version: '1.0.3'
};

// API站点配置
// ─────────────────────────────────────────────────────────────────────────────
// 2026-09-17 实测维护版：以下 13 个源已通过 Cloudflare 出口（tv.450460.xyz）逐个验证
//   验证标准 = 搜索有结果 + 详情接口 ?ac=videolist&ids= 返回 m3u8（可直接播放）
// 上游在 2025-08-12（commit c7b7dbb6）清空了内置源，本文件是重新补回的实测可用清单；
// 失效源的原因见下方注释，源站恢复后可自行取消注释。
// 原始源清单存档：https://telegra.ph/APIs-08-12
// ─────────────────────────────────────────────────────────────────────────────
const API_SITES = {
    dyttzy: {
        api: 'http://caiji.dyttzyapi.com/api.php/provide/vod',
        name: '电影天堂资源'
        // 切勿添加 detail 字段：该站 /index.php/vod/detail/id/xx.html 返回"身份验证"页，
        // 一旦有 detail，应用会走 HTML 爬取路径导致播放失败；其详情接口已直接返回 m3u8
    },
    ruyi: {
        api: 'https://cj.rycjapi.com/api.php/provide/vod',
        name: '如意资源'
    },
    bfzy: {
        api: 'https://bfzyapi.com/api.php/provide/vod',
        name: '暴风资源'
    },
    ffzy: {
        api: 'http://ffzy5.tv/api.php/provide/vod',
        name: '非凡影视'
        // 原上游配置带 detail: 'http://ffzy5.tv'，实测去掉后详情接口同样返回 m3u8，少一层爬取更稳
    },
    zy360: {
        api: 'https://360zy.com/api.php/provide/vod',
        name: '360资源'
    },
    iqiyi: {
        api: 'https://www.iqiyizyapi.com/api.php/provide/vod',
        name: 'iqiyi资源'
    },
    jisu: {
        api: 'https://jszyapi.com/api.php/provide/vod',
        name: '极速资源'
    },
    mdzy: {
        api: 'https://www.mdzyapi.com/api.php/provide/vod',
        name: '魔都资源'
    },
    zuid: {
        api: 'https://api.zuidapi.com/api.php/provide/vod',
        name: '最大资源'
    },
    baidu: {
        api: 'https://api.apibdzy.com/api.php/provide/vod',
        name: '百度云资源'
    },
    wujin: {
        api: 'https://api.wujinapi.me/api.php/provide/vod',
        name: '无尽资源'
    },
    ikun: {
        api: 'https://ikunzyapi.com/api.php/provide/vod',
        name: 'iKun资源'
    },
    lzi: {
        api: 'https://cj.lziapi.com/api.php/provide/vod',   // 末尾不要加 /，否则会拼成 /vod/?ac=
        name: '量子资源站'
    },

    // ===== 2026-09-17 实测不可用，停用留档（源站恢复后可取消注释）=====
    // tyyszy: { api: 'https://tyyszy.com/api.php/provide/vod',            name: '天涯资源'   },  // 返回"暂不支持搜索"
    // xiaomaomi: { api: 'https://zy.xmm.hk/api.php/provide/vod',          name: '小猫咪资源' },  // 代理 500 / 上游超时
    // heimuer: { api: 'https://json.heimuer.xyz/api.php/provide/vod',     name: '黑木耳'     },  // 404，已跳首页
    // wolong: { api: 'https://wolongzyw.com/api.php/provide/vod',         name: '卧龙资源'   },  // 返回反爬 HTML，非 JSON
    // hwba: { api: 'https://cjhwba.com/api.php/provide/vod',              name: '华为吧资源' },  // 域名已无法连接
    // mozhua: { api: 'https://mozhuazy.com/api.php/provide/vod',          name: '魔爪资源'   },  // 代理 500
    // yinghua: { api: 'https://m3u8.apiyhzy.com/api.php/provide/vod',     name: '樱花资源'   },  // 403（WAF 拦截）
    // wwzy: { api: 'https://wwzy.tv/api.php/provide/vod',                 name: '旺旺短剧'   },  // 301 到天涯，已合并
    // dbzy: { api: 'https://dbzy.tv/api.php/provide/vod',                 name: '豆瓣资源'   },  // API 禁关键词搜索
};

// 定义合并方法
function extendAPISites(newSites) {
    Object.assign(API_SITES, newSites);
}

// 暴露到全局
window.API_SITES = API_SITES;
window.extendAPISites = extendAPISites;

// 封面等媒体走站内 /proxy/，避免源站防盗链；有 PASSWORD 时带上 auth（不加 t，避免懒加载超时）
function proxyMediaUrl(rawUrl) {
    if (!rawUrl || typeof rawUrl !== 'string' || !/^https?:\/\//i.test(rawUrl)) return rawUrl;
    let u = PROXY_URL + encodeURIComponent(rawUrl);
    const hash = window.__ENV__ && window.__ENV__.PASSWORD;
    if (hash && String(hash).length === 64 && !/^0+$/.test(hash)) {
        u += '?auth=' + encodeURIComponent(hash);
    }
    return u;
}
window.proxyMediaUrl = proxyMediaUrl;


// 添加聚合搜索的配置选项
const AGGREGATED_SEARCH_CONFIG = {
    enabled: true,             // 是否启用聚合搜索
    timeout: 8000,            // 单个源超时时间（毫秒）
    maxResults: 10000,          // 最大结果数量
    parallelRequests: true,   // 是否并行请求所有源
    showSourceBadges: true    // 是否显示来源徽章
};

// 抽象API请求配置
const API_CONFIG = {
    search: {
        // 只拼接参数部分，不再包含 /api.php/provide/vod/
        path: '?ac=videolist&wd=',
        pagePath: '?ac=videolist&wd={query}&pg={page}',
        maxPages: 50, // 最大获取页数
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept': 'application/json'
        }
    },
    detail: {
        // 只拼接参数部分
        path: '?ac=videolist&ids=',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept': 'application/json'
        }
    }
};

// 优化后的正则表达式模式
const M3U8_PATTERN = /\$https?:\/\/[^"'\s]+?\.m3u8/g;

// 添加自定义播放器URL
const CUSTOM_PLAYER_URL = 'player.html'; // 使用相对路径引用本地player.html

// 增加视频播放相关配置
const PLAYER_CONFIG = {
    autoplay: true,
    allowFullscreen: true,
    width: '100%',
    height: '600',
    timeout: 15000,  // 播放器加载超时时间
    filterAds: true,  // 是否启用广告过滤
    autoPlayNext: true,  // 默认启用自动连播功能
    adFilteringEnabled: true, // 默认开启分片广告过滤
    adFilteringStorage: 'adFilteringEnabled' // 存储广告过滤设置的键名
};

// 增加错误信息本地化
const ERROR_MESSAGES = {
    NETWORK_ERROR: '网络连接错误，请检查网络设置',
    TIMEOUT_ERROR: '请求超时，服务器响应时间过长',
    API_ERROR: 'API接口返回错误，请尝试更换数据源',
    PLAYER_ERROR: '播放器加载失败，请尝试其他视频源',
    UNKNOWN_ERROR: '发生未知错误，请刷新页面重试'
};

// 添加进一步安全设置
const SECURITY_CONFIG = {
    enableXSSProtection: true,  // 是否启用XSS保护
    sanitizeUrls: true,         // 是否清理URL
    maxQueryLength: 100,        // 最大搜索长度
    // allowedApiDomains 不再需要，因为所有请求都通过内部代理
};

// 添加多个自定义API源的配置
const CUSTOM_API_CONFIG = {
    separator: ',',           // 分隔符
    maxSources: 5,            // 最大允许的自定义源数量
    testTimeout: 5000,        // 测试超时时间(毫秒)
    namePrefix: 'Custom-',    // 自定义源名称前缀
    validateUrl: true,        // 验证URL格式
    cacheResults: true,       // 缓存测试结果
    cacheExpiry: 5184000000,  // 缓存过期时间(2个月)
    adultPropName: 'isAdult' // 用于标记成人内容的属性名
};

// 隐藏内置黄色采集站API的变量
const HIDE_BUILTIN_ADULT_APIS = false;
