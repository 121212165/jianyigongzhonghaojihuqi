import {createClient} from 'jsr:@supabase/supabase-js'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// 搜狗微信搜索API
async function searchSogouWeixin(keyword: string, accountName: string): Promise<any[]> {
  try {
    // 搜狗微信搜索URL
    const searchUrl = `https://weixin.sogou.com/weixin?type=2&query=${encodeURIComponent(
      keyword + ' ' + accountName
    )}`

    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
      }
    })

    if (!response.ok) {
      console.error('搜狗微信搜索请求失败:', response.status)
      return []
    }

    const html = await response.text()

    // 解析HTML获取文章列表
    const articles = parseArticlesFromHTML(html)
    return articles.slice(0, 5) // 最多返回5条
  } catch (error) {
    console.error('搜狗微信搜索异常:', error)
    return []
  }
}

// 解析HTML获取文章信息
function parseArticlesFromHTML(html: string): any[] {
  const articles: any[] = []

  try {
    // 使用正则表达式提取文章信息
    // 注意：这是一个简化的实现，实际生产环境需要更健壮的HTML解析

    // 提取文章标题和链接
    const titleRegex = /<h3[^>]*>.*?<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>.*?<\/h3>/gs
    const titleMatches = html.matchAll(titleRegex)

    for (const match of titleMatches) {
      const link = match[1]
      const title = match[2].replace(/<[^>]*>/g, '').trim()

      if (title && link) {
        // 提取摘要（在标题附近查找）
        const summaryRegex = new RegExp(
          `${escapeRegex(title)}[\\s\\S]{0,500}?<p[^>]*class="txt-info"[^>]*>([\\s\\S]*?)<\\/p>`,
          'i'
        )
        const summaryMatch = html.match(summaryRegex)
        const summary = summaryMatch
          ? summaryMatch[1].replace(/<[^>]*>/g, '').trim()
          : '暂无摘要'

        // 提取发布时间
        const timeRegex = new RegExp(
          `${escapeRegex(title)}[\\s\\S]{0,500}?<span[^>]*class="s2"[^>]*>([\\s\\S]*?)<\\/span>`,
          'i'
        )
        const timeMatch = html.match(timeRegex)
        const timeStr = timeMatch ? timeMatch[1].trim() : ''
        const publishedAt = parsePublishTime(timeStr)

        articles.push({
          title,
          summary: summary.substring(0, 200), // 限制摘要长度
          link: link.startsWith('http') ? link : `https://weixin.sogou.com${link}`,
          published_at: publishedAt
        })
      }
    }
  } catch (error) {
    console.error('解析HTML失败:', error)
  }

  return articles
}

// 转义正则表达式特殊字符
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// 解析发布时间
function parsePublishTime(timeStr: string): string {
  try {
    const now = new Date()

    // 处理"X小时前"、"X天前"等格式
    if (timeStr.includes('小时前')) {
      const hours = parseInt(timeStr)
      return new Date(now.getTime() - hours * 60 * 60 * 1000).toISOString()
    } else if (timeStr.includes('天前')) {
      const days = parseInt(timeStr)
      return new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString()
    } else if (timeStr.includes('分钟前')) {
      const minutes = parseInt(timeStr)
      return new Date(now.getTime() - minutes * 60 * 1000).toISOString()
    } else {
      // 默认返回当前时间
      return now.toISOString()
    }
  } catch (error) {
    return new Date().toISOString()
  }
}

// 第三方API接口（预留）
async function fetchFromThirdPartyAPI(
  keyword: string,
  accountName: string,
  apiKey?: string
): Promise<any[]> {
  // 这里可以接入第三方API服务，如新榜、清博等
  // 示例代码：
  /*
  const response = await fetch('https://api.example.com/articles', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ keyword, account: accountName })
  })
  
  const data = await response.json()
  return data.articles
  */

  console.log('第三方API功能暂未实现')
  return []
}

Deno.serve(async (req) => {
  // 处理CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
      }
    })
  }

  try {
    const {user_id, use_third_party_api = false} = await req.json().catch(() => ({}))
    if (!user_id) {
      return new Response(JSON.stringify({message: '缺少user_id'}), {
        status: 400,
        headers: {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}
      })
    }

    // 获取用户的关键词和公众号
    const {data: keywords} = await supabase.from('keywords').select('*').eq('user_id', user_id)

    const {data: accounts} = await supabase.from('accounts').select('*').eq('user_id', user_id)

    if (!keywords || keywords.length === 0 || !accounts || accounts.length === 0) {
      return new Response(
        JSON.stringify({message: '请先添加关键词和公众号', articles_count: 0}),
        {
          status: 200,
          headers: {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}
        }
      )
    }

    // 获取第三方API密钥（如果使用）
    const thirdPartyApiKey = use_third_party_api ? Deno.env.get('THIRD_PARTY_API_KEY') : undefined

    // 为每个关键词和公众号组合抓取文章
    const articlesToInsert = []
    let successCount = 0
    let failCount = 0

    for (const keyword of keywords) {
      for (const account of accounts) {
        try {
          // 选择数据源
          const articles = use_third_party_api
            ? await fetchFromThirdPartyAPI(keyword.keyword, account.account_name, thirdPartyApiKey)
            : await searchSogouWeixin(keyword.keyword, account.account_name)

          if (articles.length > 0) {
            successCount++
            for (const article of articles) {
              articlesToInsert.push({
                user_id,
                keyword_id: keyword.id,
                account_id: account.id,
                title: article.title,
                summary: article.summary,
                link: article.link,
                published_at: article.published_at
              })
            }
          } else {
            failCount++
          }

          // 添加延迟，避免请求过快被封禁
          await new Promise((resolve) => setTimeout(resolve, 1000))
        } catch (error) {
          console.error(`抓取失败 [${keyword.keyword} - ${account.account_name}]:`, error)
          failCount++
        }
      }
    }

    // 插入文章（去重）
    if (articlesToInsert.length > 0) {
      // 检查是否已存在相同标题的文章
      const existingTitles = new Set<string>()
      const {data: existingArticles} = await supabase
        .from('articles')
        .select('title')
        .eq('user_id', user_id)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // 最近7天

      if (existingArticles) {
        existingArticles.forEach((a) => existingTitles.add(a.title))
      }

      // 过滤已存在的文章
      const newArticles = articlesToInsert.filter((a) => !existingTitles.has(a.title))

      if (newArticles.length > 0) {
        const {error: insertError} = await supabase.from('articles').insert(newArticles)

        if (insertError) {
          return new Response(JSON.stringify({message: `插入文章失败: ${insertError.message}`}), {
            status: 500,
            headers: {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}
          })
        }
      }

      return new Response(
        JSON.stringify({
          message: '文章抓取完成',
          articles_count: newArticles.length,
          success_count: successCount,
          fail_count: failCount,
          data_source: use_third_party_api ? 'third_party_api' : 'sogou_weixin'
        }),
        {
          status: 200,
          headers: {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}
        }
      )
    } else {
      return new Response(
        JSON.stringify({
          message: '未抓取到新文章',
          articles_count: 0,
          success_count: successCount,
          fail_count: failCount
        }),
        {
          status: 200,
          headers: {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}
        }
      )
    }
  } catch (error) {
    return new Response(JSON.stringify({message: error.message}), {
      status: 500,
      headers: {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}
    })
  }
})
