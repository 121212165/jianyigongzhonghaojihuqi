# 真实数据源接入指南

本文档详细说明如何将模拟数据替换为真实的公众号API接口，实现真实的文章抓取功能。

## 目录
1. [数据源概述](#数据源概述)
2. [搜狗微信搜索](#搜狗微信搜索)
3. [第三方API接入](#第三方api接入)
4. [配置说明](#配置说明)
5. [常见问题](#常见问题)

---

## 数据源概述

应用支持三种数据源：

| 数据源 | 优点 | 缺点 | 适用场景 |
|--------|------|------|----------|
| **模拟数据** | 快速、稳定、免费 | 非真实数据 | 开发测试 |
| **搜狗微信搜索** | 免费、无需API密钥 | 可能被反爬虫限制、速度慢 | 个人使用 |
| **第三方API** | 稳定可靠、数据质量高 | 需要付费 | 商业使用 |

---

## 搜狗微信搜索

### 工作原理

通过Edge Function访问搜狗微信搜索引擎，解析HTML页面获取文章信息。

### 实现细节

**Edge Function**: `supabase/functions/fetch_articles_real/index.ts`

```typescript
async function searchSogouWeixin(keyword: string, accountName: string): Promise<any[]> {
  // 1. 构造搜索URL
  const searchUrl = `https://weixin.sogou.com/weixin?type=2&query=${encodeURIComponent(
    keyword + ' ' + accountName
  )}`

  // 2. 发送HTTP请求
  const response = await fetch(searchUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 ...',
      'Accept': 'text/html,application/xhtml+xml,...'
    }
  })

  // 3. 解析HTML获取文章列表
  const html = await response.text()
  const articles = parseArticlesFromHTML(html)
  
  return articles.slice(0, 5) // 最多返回5条
}
```

### 使用方法

1. **配置数据源**
   - 进入"配置"页面
   - 点击"数据源配置"
   - 选择"搜狗微信搜索"
   - 点击"保存配置"

2. **抓取文章**
   - 进入"简报"页面
   - 点击"刷新"按钮
   - 系统会自动从搜狗微信搜索抓取文章

### 注意事项

⚠️ **反爬虫限制**
- 搜狗微信搜索有反爬虫机制
- 频繁请求可能导致IP被封禁
- 建议添加请求延迟（已实现1秒延迟）

⚠️ **数据准确性**
- HTML结构可能变化，导致解析失败
- 需要定期维护解析逻辑

⚠️ **法律风险**
- 爬虫行为可能违反服务条款
- 仅供学习研究使用

---

## 第三方API接入

### 推荐服务商

#### 1. 新榜（NewRank）
- **官网**: https://www.newrank.cn/
- **特点**: 数据全面、更新及时
- **价格**: 按需付费
- **API文档**: 联系客服获取

#### 2. 清博大数据
- **官网**: https://www.gsdata.cn/
- **特点**: 数据分析功能强大
- **价格**: 按需付费
- **API文档**: 联系客服获取

#### 3. 微小宝
- **官网**: https://www.wxb.com/
- **特点**: 专注公众号数据
- **价格**: 按需付费
- **API文档**: 联系客服获取

### 接入步骤

#### 步骤1: 获取API密钥

1. 注册第三方服务账号
2. 购买API服务套餐
3. 获取API Key和Secret

#### 步骤2: 配置Edge Function

编辑 `supabase/functions/fetch_articles_real/index.ts`：

```typescript
async function fetchFromThirdPartyAPI(
  keyword: string,
  accountName: string,
  apiKey?: string
): Promise<any[]> {
  // 示例：新榜API接入
  const response = await fetch('https://api.newrank.cn/v1/articles/search', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      keyword: keyword,
      account: accountName,
      limit: 5
    })
  })
  
  const data = await response.json()
  
  // 转换为统一格式
  return data.articles.map(article => ({
    title: article.title,
    summary: article.abstract,
    link: article.url,
    published_at: article.publish_time
  }))
}
```

#### 步骤3: 配置API密钥

**方式一：通过Supabase Dashboard配置（推荐）**

1. 登录Supabase Dashboard
2. 进入项目设置 → Edge Functions → Secrets
3. 添加环境变量：
   - Key: `THIRD_PARTY_API_KEY`
   - Value: 你的API密钥

**方式二：通过小程序配置**

1. 进入"配置"页面
2. 点击"数据源配置"
3. 选择"第三方API"
4. 输入API密钥
5. 点击"保存配置"

#### 步骤4: 测试接入

1. 进入"简报"页面
2. 点击"刷新"按钮
3. 系统会自动使用第三方API抓取文章

### API响应格式

第三方API需要返回以下格式的数据：

```json
{
  "articles": [
    {
      "title": "文章标题",
      "summary": "文章摘要",
      "link": "文章链接",
      "published_at": "2026-04-03T10:00:00Z"
    }
  ]
}
```

---

## 配置说明

### 数据源配置页面

**路径**: `src/pages/data-source/index.tsx`

**功能**:
- 选择数据源（搜狗微信搜索 / 第三方API）
- 配置API密钥
- 保存配置到本地存储

### 配置存储

配置信息存储在小程序本地存储中：

```typescript
// 保存配置
Taro.setStorageSync('dataSource', 'sogou') // 或 'third_party'
Taro.setStorageSync('thirdPartyApiKey', 'your-api-key')

// 读取配置
const dataSource = Taro.getStorageSync('dataSource')
const apiKey = Taro.getStorageSync('thirdPartyApiKey')
```

### Edge Function调用

**文件**: `src/pages/home/index.tsx`

```typescript
const handleRefresh = async () => {
  // 获取用户配置的数据源
  const dataSource = Taro.getStorageSync('dataSource') || 'sogou'
  const useThirdPartyApi = dataSource === 'third_party'
  
  // 调用Edge Function
  const {data, error} = await supabase.functions.invoke('fetch_articles_real', {
    body: {
      user_id: user!.id,
      use_third_party_api: useThirdPartyApi
    }
  })
}
```

---

## 常见问题

### Q1: 搜狗微信搜索抓取失败怎么办？

**可能原因**:
1. IP被封禁
2. HTML结构变化
3. 网络问题

**解决方案**:
1. 等待一段时间后重试
2. 更新HTML解析逻辑
3. 切换到第三方API

### Q2: 第三方API返回错误怎么办？

**可能原因**:
1. API密钥错误
2. 账户余额不足
3. API限流

**解决方案**:
1. 检查API密钥是否正确
2. 充值账户
3. 降低请求频率

### Q3: 如何提高抓取成功率？

**建议**:
1. 使用第三方API（最稳定）
2. 添加请求延迟（避免被封禁）
3. 实现重试机制
4. 使用代理IP（针对爬虫）

### Q4: 如何自定义数据源？

**步骤**:
1. 编辑 `supabase/functions/fetch_articles_real/index.ts`
2. 实现自定义的数据抓取逻辑
3. 返回统一格式的数据
4. 部署Edge Function

### Q5: 数据抓取需要多长时间？

**时间估算**:
- 模拟数据: 1-2秒
- 搜狗微信搜索: 10-30秒（取决于关键词和公众号数量）
- 第三方API: 3-10秒

---

## 技术架构

### 数据流程

```
用户点击刷新
    ↓
读取数据源配置
    ↓
调用Edge Function
    ↓
┌─────────────┬─────────────┬─────────────┐
│  模拟数据   │  搜狗搜索   │  第三方API  │
└─────────────┴─────────────┴─────────────┘
    ↓
解析并格式化数据
    ↓
去重检查
    ↓
插入数据库
    ↓
返回结果给前端
    ↓
刷新页面展示
```

### Edge Function架构

```typescript
// fetch_articles_real/index.ts

Deno.serve(async (req) => {
  // 1. 获取请求参数
  const {user_id, use_third_party_api} = await req.json()
  
  // 2. 获取用户配置
  const keywords = await getKeywords(user_id)
  const accounts = await getAccounts(user_id)
  
  // 3. 遍历关键词和公众号
  for (const keyword of keywords) {
    for (const account of accounts) {
      // 4. 根据配置选择数据源
      const articles = use_third_party_api
        ? await fetchFromThirdPartyAPI(keyword, account, apiKey)
        : await searchSogouWeixin(keyword, account)
      
      // 5. 保存文章
      await saveArticles(articles)
    }
  }
  
  // 6. 返回结果
  return new Response(JSON.stringify({success: true}))
})
```

---

## 最佳实践

### 1. 数据源选择

- **开发测试**: 使用模拟数据
- **个人使用**: 使用搜狗微信搜索
- **商业使用**: 使用第三方API

### 2. 错误处理

```typescript
try {
  const articles = await searchSogouWeixin(keyword, account)
  if (articles.length === 0) {
    // 降级到模拟数据
    articles = await generateMockArticles()
  }
} catch (error) {
  console.error('抓取失败:', error)
  // 降级到模拟数据
  articles = await generateMockArticles()
}
```

### 3. 性能优化

- 添加缓存机制（避免重复抓取）
- 实现增量更新（只抓取新文章）
- 使用并发请求（提高速度）
- 添加请求超时（避免长时间等待）

### 4. 安全性

- API密钥加密存储
- 使用HTTPS传输
- 实现请求签名验证
- 限制请求频率

---

## 更新日志

### v1.1.0 (2026-04-03)
- ✅ 新增搜狗微信搜索数据源
- ✅ 新增第三方API接入框架
- ✅ 新增数据源配置页面
- ✅ 优化错误处理和降级机制

### v1.0.0 (2026-04-03)
- ✅ 初始版本，支持模拟数据

---

## 技术支持

如有问题，请联系技术支持：
- 邮箱: support@example.com
- 文档: https://docs.example.com

---

© 2026 公众号内容聚合助手
