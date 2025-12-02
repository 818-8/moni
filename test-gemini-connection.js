import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';
import http from 'http';
import https from 'https';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// 在ES模块中获取当前文件目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 读取.env.local文件获取API密钥
function getApiKey() {
  const envPath = path.join(__dirname, '.env.local');
  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/GEMINI_API_KEY=(.*)/);
    return match ? match[1].trim() : null;
  } catch (error) {
    console.error('无法读取.env.local文件:', error.message);
    return null;
  }
}

// 详细的网络诊断函数
async function performNetworkDiagnostics() {
  console.log('\n=== 详细网络诊断 ===');
  
  // 1. DNS解析测试
  try {
    console.log('\n1. 测试DNS解析:');
    const dnsResult = await new Promise((resolve, reject) => {
      require('dns').lookup('generativelanguage.googleapis.com', (err, address) => {
        if (err) reject(err);
        else resolve(address);
      });
    });
    console.log(`✓ DNS解析成功: generativelanguage.googleapis.com -> ${dnsResult}`);
  } catch (error) {
    console.error('✗ DNS解析失败:', error.message);
  }
  
  // 2. 端口连通性测试
  try {
    console.log('\n2. 测试HTTPS端口连通性:');
    const net = require('net');
    await new Promise((resolve, reject) => {
      const socket = new net.Socket();
      socket.setTimeout(3000);
      socket.connect(443, 'generativelanguage.googleapis.com', () => {
        socket.destroy();
        resolve();
      });
      socket.on('timeout', () => {
        socket.destroy();
        reject(new Error('连接超时'));
      });
      socket.on('error', reject);
    });
    console.log('✓ HTTPS端口(443)连通正常');
  } catch (error) {
    console.error('✗ HTTPS端口连接失败:', error.message);
  }
  
  // 3. 代理设置检查
  console.log('\n3. 检查代理设置:');
  const httpsProxy = process.env.HTTPS_PROXY || process.env.https_proxy;
  const httpProxy = process.env.HTTP_PROXY || process.env.http_proxy;
  
  if (httpsProxy || httpProxy) {
    console.log(`⚠️  检测到代理设置:`);
    if (httpsProxy) console.log(`  HTTPS_PROXY: ${httpsProxy}`);
    if (httpProxy) console.log(`  HTTP_PROXY: ${httpProxy}`);
  } else {
    console.log('✓ 未检测到代理设置');
  }
  
  // 4. 系统网络配置检查
  try {
    console.log('\n4. 系统网络配置检查:');
    // Windows系统的ipconfig命令
    const ipConfig = execSync('ipconfig', { encoding: 'utf8' });
    console.log('系统IP配置摘要:');
    const ipv4Lines = ipConfig.match(/IPv4.*?: .*/g);
    if (ipv4Lines) ipv4Lines.forEach(line => console.log(line));
  } catch (error) {
    console.error('获取系统网络配置失败:', error.message);
  }
  
  // 5. 网络延迟测试
  try {
    console.log('\n5. 网络延迟测试:');
    const startTime = Date.now();
    await new Promise((resolve, reject) => {
      https.get('https://www.google.com/generate_204', (res) => {
        const endTime = Date.now();
        console.log(`✓ 连接延迟: ${endTime - startTime}ms`);
        res.on('data', () => {});
        res.on('end', resolve);
      }).on('error', reject);
    });
  } catch (error) {
    console.error('✗ 延迟测试失败:', error.message);
  }
  
  console.log('\n=== 网络诊断完成 ===');
}

// 测试Gemini API连接
async function testGeminiConnection() {
  console.log('开始测试Gemini API连接...');
  
  const apiKey = getApiKey();
  if (!apiKey) {
    console.error('错误: 找不到有效的API密钥');
    return;
  }
  
  console.log('API密钥已找到，开始初始化客户端...');
  
  // 运行详细网络诊断
  await performNetworkDiagnostics();
  
  try {
    // 测试网络连接 - 简单的DNS查询和连接测试
    console.log('\n测试网络连接到Google API服务...');
    
    // 使用setTimeout来避免长时间等待
    const networkTest = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('网络连接超时')), 10000);
      
      const req = http.get('http://www.googleapis.com', (res) => {
        clearTimeout(timeout);
        console.log(`网络连接测试: ${res.statusCode}`);
        resolve();
      });
      
      req.on('error', (e) => {
        clearTimeout(timeout);
        reject(e);
      });
    });
    
    try {
      await networkTest;
      console.log('✓ 基本网络连接测试通过');
    } catch (error) {
      console.error('✗ 网络连接测试失败:', error.message);
      console.log('建议检查防火墙设置、网络代理或VPN配置');
    }
    
    // 初始化Gemini客户端
    console.log('正在尝试初始化GoogleGenAI客户端...');
    
    try {
      // 使用版本1.30.0的API语法
      const genAI = new GoogleGenAI(apiKey);
      console.log('初始化成功，尝试获取模型...');
      
      // 输出genAI对象的方法列表用于调试
      console.log('genAI对象方法:', Object.keys(genAI));
      
      // 检查models属性
      if (genAI.models && typeof genAI.models === 'object') {
        console.log('models属性方法:', Object.keys(genAI.models));
      } else {
        console.error('models属性不可用或类型不正确');
      }
      
      // 使用models属性获取模型
      if (genAI.models) {
        console.log('使用models属性获取模型...');
        
        try {
          // 尝试使用正确的API调用方式
          const model = await genAI.models.get('gemini-1.5-flash');
          console.log('模型获取成功，模型信息:', model.name);
          
          // 尝试调用模型方法
          if (model.generateContent) {
            console.log('尝试调用model.generateContent...');
            const result = await model.generateContent('你好，请回复一条简单的消息');
            const response = await result.response;
            const text = response.text();
            
            console.log('✓ Gemini API调用成功!');
            console.log('响应:', text);
          } else {
            console.error('❌ 模型对象没有generateContent方法');
          }
        } catch (modelError) {
          console.log('Gemini API调用失败详情:', modelError.message);
          // 不重新抛出错误，让程序继续运行并记录结果
          return; // 提前返回，避免后续代码执行
        }
      } else {
        console.log('models属性不可用');
        throw new Error('不支持的API版本或配置');
      }
    } catch (e) {
      console.log('Gemini API调用失败详情:', e.message);
      // 不重新抛出错误，让程序继续运行并记录结果
      return; // 提前返回，避免后续代码执行
    }
    
  } catch (error) {
    console.error('\n✗ Gemini API连接失败:', error.message);
    console.log('错误详情:', error);
    
    // 详细的错误类型分析
    if (error.name === 'AbortError') {
      console.error('\n🔍 问题分析: 超时错误');
      console.error('解决方案: 请求超时，可能是网络连接问题或防火墙阻止了连接');
    } else if (error.message.includes('403')) {
      console.error('\n🔍 问题分析: 权限错误');
      console.error('解决方案: API密钥无效或没有足够权限，请检查密钥是否正确');
    } else if (error.message.includes('429')) {
      console.error('\n🔍 问题分析: 速率限制错误');
      console.error('解决方案: 请求过于频繁，请稍后再试');
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('ETIMEDOUT')) {
      console.error('\n🔍 问题分析: 网络错误');
      console.error('解决方案: 无法连接到服务器，可能是网络限制、防火墙或DNS解析问题');
    } else if (error.message.includes('Cannot convert undefined or null to object')) {
      console.error('\n🔍 问题分析: API版本兼容性问题');
      console.error('解决方案: @google/genai包版本可能不兼容，请检查版本并尝试更新或降级');
    } else {
      console.error('\n🔍 问题分析: 其他错误');
      console.error('错误详情:', error);
    }
    
    // 综合建议
    console.error('\n💡 综合建议:');
    console.error('1. 检查网络连接，确保可以访问Google服务');
    console.error('2. 检查防火墙设置，确保允许连接到generativelanguage.googleapis.com');
    console.error('3. 如果使用VPN，请尝试暂时断开');
    console.error('4. 检查代理设置是否正确');
    console.error('5. 验证API密钥是否有效');
    console.error('6. 尝试更新或降级@google/genai包版本');
  }
}

testGeminiConnection();