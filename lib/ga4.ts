import { BetaAnalyticsDataClient } from '@google-analytics/data';

// 初始化 GA4 客户端
function getGA4Client() {
  const credentials = process.env.GA4_SERVICE_ACCOUNT_KEY;
  if (!credentials) {
    throw new Error('GA4_SERVICE_ACCOUNT_KEY not set');
  }

  const parsedCredentials = JSON.parse(credentials);
  
  return new BetaAnalyticsDataClient({
    credentials: parsedCredentials,
  });
}

// 获取页面浏览数据
export async function getPageViews(startDate: string, endDate: string) {
  const client = getGA4Client();
  const propertyId = process.env.GA4_PROPERTY_ID;
  
  if (!propertyId) {
    throw new Error('GA4_PROPERTY_ID not set');
  }

  const [response] = await client.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [
      {
        startDate,
        endDate,
      },
    ],
    dimensions: [
      {
        name: 'pagePath',
      },
    ],
    metrics: [
      {
        name: 'screenPageViews',
      },
      {
        name: 'bounceRate',
      },
      {
        name: 'averageSessionDuration',
      },
    ],
    orderBys: [
      {
        metric: {
          metricName: 'screenPageViews',
        },
        desc: true,
      },
    ],
    limit: 1000,
  });

  return response.rows?.map((row) => ({
    pagePath: row.dimensionValues?.[0]?.value || '',
    pageViews: parseInt(row.metricValues?.[0]?.value || '0', 10),
    bounceRate: parseFloat(row.metricValues?.[1]?.value || '0'),
    avgSessionDuration: parseFloat(row.metricValues?.[2]?.value || '0'),
  })) || [];
}

// 只获取 ask/ 目录下的文章数据
export async function getArticleAnalytics(days: number = 7) {
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const allData = await getPageViews(startDate, endDate);
  
  // 过滤出 ask/ 目录下的文章
  return allData.filter((item) => 
    item.pagePath.startsWith('/ask/') && item.pagePath !== '/ask/'
  );
}

// 测试连接
export async function testGA4Connection() {
  try {
    const data = await getArticleAnalytics(1);
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
