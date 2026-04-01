/**
 * 生成静态 HTML 页面的模板
 * 用于创建 SEO 友好的静态文件
 */

interface RelatedArticle {
  slug: string;
  seoTitle: string;
  aiSummary: string;
  viewCount: number;
}

interface HtmlTemplateProps {
  title: string;
  description: string;
  content: string;
  summary: string;
  userPrompt: string;
  slug: string;
  createdAt: string;
  viewCount: number;
  relatedArticles?: RelatedArticle[];
}

export function generateStaticHtml(props: HtmlTemplateProps): string {
  const { title, description, content, summary, userPrompt, slug, createdAt, viewCount, relatedArticles } = props;
  const canonicalUrl = `https://carcorporatecodes.com/ask/${slug}`;
  const formattedDate = new Date(createdAt).toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  });

  // JSON-LD 结构化数据
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        '@id': `${canonicalUrl}#article`,
        headline: title,
        description: description,
        url: canonicalUrl,
        datePublished: createdAt,
        dateModified: createdAt,
        author: {
          '@type': 'Organization',
          name: 'Car Corporate Codes AI',
          '@id': 'https://carcorporatecodes.com/#organization',
        },
        publisher: {
          '@type': 'Organization',
          name: 'Car Corporate Codes',
          '@id': 'https://carcorporatecodes.com/#organization',
        },
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': `${canonicalUrl}#webpage`,
        },
        articleSection: 'Car Rental Guides',
      },
      {
        '@type': 'WebPage',
        '@id': `${canonicalUrl}#webpage`,
        url: canonicalUrl,
        name: title,
        description: description,
        breadcrumb: {
          '@id': `${canonicalUrl}#breadcrumb`,
        },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${canonicalUrl}#breadcrumb`,
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: 'https://carcorporatecodes.com',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Rental Codes',
            item: 'https://carcorporatecodes.com/ask',
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: title,
            item: canonicalUrl,
          },
        ],
      },
    ],
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="keywords" content="car rental corporate codes, CDP, AWD, discount codes, rental car savings">
  <meta name="author" content="Car Corporate Codes AI">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${canonicalUrl}">
  
  <!-- Open Graph -->
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:site_name" content="Car Corporate Codes">
  <meta property="og:image" content="https://carcorporatecodes.com/og-image.jpg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="article:published_time" content="${createdAt}">
  <meta property="article:modified_time" content="${createdAt}">
  <meta property="article:author" content="Car Corporate Codes AI">
  
  <!-- Twitter Card -->
  <meta name="twitter:image" content="https://carcorporatecodes.com/og-image.jpg">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  
  <!-- JSON-LD -->
  <script type="application/ld+json">
${JSON.stringify(jsonLd, null, 2)}
  </script>
  
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6; 
      color: #1f2937; 
      background: #ffffff;
    }
    a { color: #2563eb; text-decoration: none; }
    a:hover { color: #1d4ed8; }
    
    /* Header */
    header { 
      border-bottom: 1px solid #e5e7eb; 
      padding: 1rem 0;
    }
    .container { 
      max-width: 768px; 
      margin: 0 auto; 
      padding: 0 1rem;
    }
    
    /* Breadcrumb */
    .breadcrumb { 
      font-size: 0.875rem; 
      color: #6b7280; 
      margin: 1.5rem 0;
    }
    .breadcrumb span { margin: 0 0.25rem; }
    
    /* Title */
    h1 { 
      font-size: 1.875rem; 
      font-weight: 700; 
      color: #111827; 
      line-height: 1.3;
      margin-bottom: 1rem;
    }
    @media (min-width: 768px) {
      h1 { font-size: 2.25rem; }
    }
    
    /* Meta */
    .meta { 
      font-size: 0.875rem; 
      color: #6b7280; 
      padding-bottom: 1rem;
      border-bottom: 1px solid #e5e7eb;
      margin-bottom: 1.5rem;
    }
    .meta span { margin-right: 0.5rem; }
    
    /* Content */
    .content { 
      font-size: 1rem; 
      line-height: 1.75;
      color: #374151;
    }
    .content h2 { 
      font-size: 1.25rem; 
      font-weight: 700; 
      color: #1f2937;
      margin-top: 1.5rem;
      margin-bottom: 0.75rem;
    }
    .content p { margin-bottom: 1rem; }
    .content ul, .content ol { 
      margin: 1rem 0; 
      padding-left: 1.5rem;
    }
    .content li { margin-bottom: 0.5rem; }
    .content strong { 
      font-weight: 600; 
      color: #111827;
      background: #eff6ff;
      padding: 0.125rem 0.25rem;
      border-radius: 0.25rem;
    }
    
    /* Insider Tip */
    .insider-tip {
      margin-top: 2rem;
      padding: 1rem;
      background: #fffbeb;
      border-left: 4px solid #f59e0b;
    }
    .insider-tip p {
      font-size: 0.875rem;
      color: #92400e;
      line-height: 1.625;
    }
    
    /* Disclaimer */
    .disclaimer {
      margin-top: 1.5rem;
      font-size: 0.75rem;
      color: #6b7280;
    }
    
    /* CTA */
    .cta {
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid #e5e7eb;
    }
    .cta p { 
      font-size: 0.875rem; 
      color: #374151;
      margin-bottom: 0.75rem;
    }
    .cta-button {
      display: inline-block;
      background: #2563eb;
      color: white !important;
      padding: 0.625rem 1.25rem;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      font-weight: 500;
      transition: background 0.2s;
      text-decoration: none;
    }
    .cta-button:hover { 
      background: #1d4ed8; 
      color: white !important;
    }
    
    /* Footer */
    footer {
      background: #111827;
      color: #d1d5db;
      padding: 3rem 0;
      margin-top: 4rem;
    }
    footer h3 {
      color: white;
      font-size: 1.125rem;
      font-weight: 700;
      margin-bottom: 1rem;
    }
    footer p {
      font-size: 0.875rem;
      color: #9ca3af;
    }
    .footer-bottom {
      border-top: 1px solid #374151;
      margin-top: 2rem;
      padding-top: 2rem;
      text-align: center;
      font-size: 0.875rem;
      color: #6b7280;
    }
  </style>
</head>
<body>
  <header>
    <div class="container">
      <a href="/">&larr; Back to Car Corporate Codes</a>
    </div>
  </header>

  <main class="container" style="padding-top: 2rem; padding-bottom: 2rem;">
    <!-- Breadcrumb -->
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <a href="/">Home</a>
      <span>/</span>
      <span>Rental Codes</span>
    </nav>

    <!-- Title -->
    <h1>${escapeHtml(title)}</h1>

    <!-- Meta -->
    <div class="meta">
      <span>${formattedDate}</span>
    </div>

    <!-- Content -->
    <article class="content">
${formatContent(content)}
    </article>

    <!-- Insider Tip -->
    <div class="insider-tip">
      <p><strong>💡 Insider Tip:</strong> Book directly on the rental company's website and avoid third-party sites like Expedia or Kayak. I've seen $50+ in surprise fees added at check-in for third-party bookings. Corporate rate bookings earn full loyalty points and qualify for free promotions.</p>
    </div>

    <!-- Disclaimer -->
    <div class="disclaimer">
      <p><strong>Disclaimer:</strong> Corporate codes require eligibility verification. Always check with the rental company and have proper documentation ready.</p>
    </div>

    <!-- Related Articles -->
    ${relatedArticles && relatedArticles.length > 0 ? `
    <div style="margin-top: 2.5rem; padding-top: 2rem; border-top: 1px solid #e5e7eb;">
      <h2 style="font-size: 1.125rem; font-weight: 700; color: #111827; margin-bottom: 1rem;">You May Also Like</h2>
      <div style="display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));">
        ${relatedArticles.map(article => `
        <a href="/ask/${article.slug}" style="display: block; padding: 1rem; background: #f9fafb; border-radius: 0.5rem; text-decoration: none; transition: background 0.2s;">
          <h3 style="font-weight: 600; color: #111827; margin-bottom: 0.5rem; font-size: 0.9375rem; line-height: 1.4;">${escapeHtml(article.seoTitle)}</h3>
          <p style="font-size: 0.875rem; color: #4b5563; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${escapeHtml(article.aiSummary)}</p>
        </a>
        `).join('')}
      </div>
    </div>
    ` : ''}

    <!-- CTA -->
    <div class="cta">
      <p>Want a personalized recommendation for your specific situation?</p>
      <a href="/" class="cta-button">Ask AI Rental Code Finder</a>
    </div>
  </main>

  <!-- Footer -->
  <footer>
    <div class="container">
      <h3>Car Corporate Codes</h3>
      <p>Database of car rental corporate codes and discounts. Updated regularly for accuracy.</p>
      <div class="footer-bottom">
        <p>&copy; ${new Date().getFullYear()} Car Corporate Codes. All rights reserved.</p>
      </div>
    </div>
  </footer>
</body>
</html>`;
}

// HTML 转义函数，防止 XSS
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

// 格式化内容：确保内容有正确的 HTML 标签
function formatContent(content: string): string {
  if (!content) return '';
  
  // 如果内容已经有 HTML 标签（AI 生成的 HTML），添加换行使其可读
  if (content.includes('<p>') || content.includes('<h2>') || content.includes('<ul>') || content.includes('<li>')) {
    // 在块级标签之间添加换行，提高可读性
    return content
      .replace(/<h2>/g, '\n<h2>')
      .replace(/<\/h2>/g, '</h2>\n')
      .replace(/<h3>/g, '\n<h3>')
      .replace(/<\/h3>/g, '</h3>\n')
      .replace(/<p>/g, '\n<p>')
      .replace(/<\/p>/g, '</p>\n')
      .replace(/<ul>/g, '\n<ul>')
      .replace(/<\/ul>/g, '</ul>\n')
      .replace(/<li>/g, '\n  <li>')
      .replace(/<\/li>/g, '</li>')
      .trim();
  }
  
  // 否则，将纯文本/Markdown 转换为 HTML
  // 按段落分割（双换行或单换行）
  const paragraphs = content.split(/\n\n+/).filter(p => p.trim());
  
  return paragraphs.map(p => {
    const trimmed = p.trim();
    
    // 处理列表项（以 - 或 * 开头）
    if (trimmed.match(/^[-*]\s/m)) {
      const items = trimmed.split('\n').filter(line => line.trim().match(/^[-*]\s/));
      return '<ul>\n' + items.map(item => {
        const text = item.trim().replace(/^[-*]\s/, '');
        return `  <li>${escapeHtml(text)}</li>`;
      }).join('\n') + '\n</ul>';
    }
    
    // 如果已经是标题格式（以 ## 开头）
    if (trimmed.startsWith('## ')) {
      return `<h2>${escapeHtml(trimmed.substring(3))}</h2>`;
    }
    if (trimmed.startsWith('### ')) {
      return `<h3>${escapeHtml(trimmed.substring(4))}</h3>`;
    }
    if (trimmed.startsWith('# ')) {
      return `<h1>${escapeHtml(trimmed.substring(2))}</h1>`;
    }
    
    // 普通段落
    return `<p>${escapeHtml(trimmed)}</p>`;
  }).join('\n');
}
