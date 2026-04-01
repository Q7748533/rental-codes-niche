// SEO 友好的 URL Slug 生成器
// 核心目标：去废话、保关键、防截断、保唯一

// 1. 定义 SEO 停用词字典（过滤掉没用的介词和代词）
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'with', 'to', 'for',
  'up', 'off', 'save', 'your', 'of', 'at', 'is', 'it', 'this', 'that',
  'by', 'from', 'as', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'can', 'shall', 'must', 'about', 'into',
  'through', 'during', 'before', 'after', 'above', 'below', 'between',
  'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when',
  'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more',
  'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own',
  'same', 'so', 'than', 'too', 'very', 'just', 'now', 'get', 'use',
  'using', 'used', 'new', 'old', 'way', 'ways', 'tip', 'tips', 'guide',
  'guides', 'best', 'top', 'good', 'great', 'big', 'small', 'high', 'low'
]);

/**
 * 生成 SEO 友好的 slug
 * @param title - 文章标题
 * @param maxLength - 最大长度（默认 60）
 * @returns 清理后的 slug
 */
export function generateSeoSlug(title: string, maxLength: number = 60): string {
  // 0. 预处理：替换特殊字符（包括 / 和 \）为空格，避免它们进入 URL
  const sanitizedTitle = title
    .replace(/[\/\\]+/g, ' ')  // 替换 / 和 \ 为空格
    .replace(/[^\w\s-]/g, '');  // 移除其他特殊标点
  
  // 1. 转小写并按照非字母数字字符分割成单词数组
  const words = sanitizedTitle.toLowerCase().split(/[^a-z0-9]+/);

  // 2. 过滤掉停用词和空字符串
  const filteredWords = words.filter(word => {
    return word.length > 0 && !STOP_WORDS.has(word);
  });

  // 3. 拼接并进行"智能截断"（绝对不切断半个单词）
  let currentLength = 0;
  const finalWords: string[] = [];

  for (const word of filteredWords) {
    // +1 是因为拼接时会有连字符 '-'
    const newLength = currentLength + word.length + (finalWords.length > 0 ? 1 : 0);
    
    if (newLength <= maxLength) {
      finalWords.push(word);
      currentLength = newLength;
    } else {
      break; // 一旦超过最大长度，直接舍弃后面的所有单词
    }
  }

  // 4. 用连字符拼接
  return finalWords.join('-');
}

/**
 * 生成唯一的 slug（检查数据库是否已存在）
 * @param prisma - Prisma 客户端
 * @param title - 文章标题
 * @param maxLength - 最大长度
 * @returns 唯一的 slug
 */
export async function generateUniqueSlug(
  prisma: any,
  title: string,
  maxLength: number = 60
): Promise<string> {
  // 1. 先生成干净的基础 slug
  let baseSlug = generateSeoSlug(title, maxLength);
  
  // 如果基础 slug 为空，使用 fallback
  if (!baseSlug || baseSlug.length < 3) {
    baseSlug = 'car-rental-guide';
  }
  
  let finalSlug = baseSlug;
  let counter = 1;

  // 2. 去数据库里查，看这个 slug 是不是已经被用过了
  while (true) {
    const existingArticle = await prisma.aiQuery.findUnique({
      where: { slug: finalSlug }
    });

    // 如果没被用过，太好了，跳出循环，就用这个！
    if (!existingArticle) {
      break;
    }

    // 3. 如果不幸重复了，才在末尾优雅地加一个小数字 (如 -2, -3)
    counter++;
    finalSlug = `${baseSlug}-${counter}`;
    
    // 防止无限循环（理论上不会发生）
    if (counter > 100) {
      finalSlug = `${baseSlug}-${Date.now().toString().slice(-4)}`;
      break;
    }
  }

  return finalSlug;
}
