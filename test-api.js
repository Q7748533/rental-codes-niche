// 这是用来模拟你未来自动化爬虫的数据
const mockData = {
  brandName: "Hertz",
  companyName: "IBM",
  codeValue: "123456", // 假设这是抓取到的 IBM 专属 CDP 代码
  description: "Corporate rate, up to 20% off standard rates."
};

console.log("🚀 正在向数据库发送测试数据...");

// 使用 Node.js 内置的 http 模块发送请求
const http = require('http');

const postData = JSON.stringify(mockData);

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/codes',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const jsonData = JSON.parse(data);
      if (jsonData.success) {
        console.log("✅ 测试成功！数据已成功存入 SQLite 数据库。");
        console.log("服务器返回的数据详情：", jsonData.data);
      } else {
        console.log("❌ 录入失败：", jsonData.error);
      }
    } catch (e) {
      console.error("⚠️ 响应解析失败，返回的不是 JSON：", data.substring(0, 200));
    }
  });
});

req.on('error', (error) => {
  console.error("⚠️ 请求出错，请检查服务器是否已启动 (npm run dev)：", error.message);
});

req.write(postData);
req.end();
