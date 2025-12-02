import { fileURLToPath } from 'url';
import { dirname } from 'path';
import http from 'http';
import https from 'https';
import { execSync } from 'child_process';
import dns from 'dns';
import net from 'net';

// 获取当前文件路径和目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 从环境变量获取API密钥（如果可用）
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyCLEEsl_W6JdSpBY3_esi2tBXkAlrxoXWs'; // 默认使用已知的密钥

// 配置HTTPS请求选项，禁用证书验证以解决证书错误
const httpsOptions = {
  rejectUnauthorized: false, // 临时禁用证书验证以便诊断
  agent: new https.Agent({ keepAlive: true })
};

// 测试目标
const TEST_TARGETS = {
  google: 'https://www.google.com',
  geminiApi: 'https://generativelanguage.googleapis.com',
  googleDns: '8.8.8.8'
};

// 主诊断函数
async function runNetworkDiagnostics() {
  console.log('=== Google API 网络连接诊断工具 ===\n');
  
  await testBasicConnectivity();
  await testDnsResolution();
  await testPortConnectivity();
  await testHttpsConnectivity();
  await testCertificateValidation();
  await testSystemNetworkConfig();
  
  console.log('\n=== 诊断总结 ===');
  console.log('根据测试结果，主要问题可能是：');
  console.log('1. 证书验证错误 - 可能需要安装系统CA证书');
  console.log('2. 网络连接限制 - 可能是防火墙或安全软件阻止');
  console.log('3. DNS解析问题 - 可能需要配置自定义DNS服务器');
  
  console.log('\n建议解决方案：');
  console.log('1. 在代码中临时禁用证书验证（仅用于测试）');
  console.log('2. 检查防火墙设置，允许连接到Google API服务器');
  console.log('3. 尝试配置DNS为8.8.8.8或1.1.1.1');
  console.log('4. 如有企业代理，配置正确的环境变量');
}

// 测试基本网络连接
async function testBasicConnectivity() {
  console.log('1. 基本网络连接测试');
  console.log('==================');
  
  try {
    const startTime = Date.now();
    const result = await new Promise((resolve, reject) => {
      const req = http.get('http://www.google.com/generate_204', {
        timeout: 5000,
        agent: new http.Agent({ keepAlive: true })
      }, (res) => {
        const endTime = Date.now();
        resolve({ success: true, statusCode: res.statusCode, time: endTime - startTime });
        res.on('data', () => {});
        res.on('end', () => {});
      });
      
      req.on('error', reject);
      req.on('timeout', () => reject(new Error('连接超时')));
    });
    
    console.log(`✓ HTTP连接成功: ${result.statusCode} (${result.time}ms)`);
  } catch (error) {
    console.error(`✗ HTTP连接失败: ${error.message}`);
    console.log(`  可能原因: 网络中断、防火墙阻止、代理配置错误`);
  }
  
  console.log('');
}

// 测试DNS解析
async function testDnsResolution() {
  console.log('2. DNS解析测试');
  console.log('==================');
  
  const domains = ['generativelanguage.googleapis.com', 'www.google.com'];
  
  for (const domain of domains) {
    try {
      const ip = await new Promise((resolve, reject) => {
        dns.lookup(domain, (err, address) => {
          if (err) reject(err);
          else resolve(address);
        });
      });
      console.log(`✓ DNS解析成功: ${domain} -> ${ip}`);
    } catch (error) {
      console.error(`✗ DNS解析失败: ${domain}`);
      console.log(`  错误: ${error.code || error.message}`);
      console.log(`  建议: 尝试使用Google DNS (8.8.8.8)`);
    }
  }
  
  console.log('');
}

// 测试端口连通性
async function testPortConnectivity() {
  console.log('3. 端口连通性测试');
  console.log('==================');
  
  const targets = [
    { host: 'generativelanguage.googleapis.com', port: 443, name: 'Gemini API (HTTPS)' },
    { host: '8.8.8.8', port: 53, name: 'Google DNS' },
    { host: 'www.google.com', port: 443, name: 'Google (HTTPS)' }
  ];
  
  for (const target of targets) {
    try {
      const startTime = Date.now();
      await new Promise((resolve, reject) => {
        const socket = new net.Socket();
        socket.setTimeout(3000);
        socket.connect(target.port, target.host, () => {
          const endTime = Date.now();
          socket.destroy();
          resolve({ time: endTime - startTime });
        });
        
        socket.on('timeout', () => {
          socket.destroy();
          reject(new Error('连接超时'));
        });
        
        socket.on('error', (err) => {
          socket.destroy();
          reject(err);
        });
      });
      console.log(`✓ ${target.name} 端口 ${target.port} 连通正常`);
    } catch (error) {
      console.error(`✗ ${target.name} 端口 ${target.port} 连接失败`);
      console.log(`  错误: ${error.message}`);
      console.log(`  可能原因: 防火墙阻止、网络限制`);
    }
  }
  
  console.log('');
}

// 测试HTTPS连接
async function testHttpsConnectivity() {
  console.log('4. HTTPS连接测试（禁用证书验证）');
  console.log('==================');
  
  for (const [name, url] of Object.entries(TEST_TARGETS)) {
    if (url.startsWith('https://')) {
      try {
        const startTime = Date.now();
        const result = await new Promise((resolve, reject) => {
          const req = https.get(url, httpsOptions, (res) => {
            const endTime = Date.now();
            resolve({ 
              success: true, 
              statusCode: res.statusCode, 
              headers: res.headers, 
              time: endTime - startTime 
            });
            res.on('data', () => {});
            res.on('end', () => {});
          });
          
          req.on('error', reject);
          req.on('timeout', () => reject(new Error('连接超时')));
        });
        
        console.log(`✓ HTTPS连接成功: ${name}`);
        console.log(`  状态码: ${result.statusCode}`);
        console.log(`  连接时间: ${result.time}ms`);
        console.log(`  服务器: ${result.headers.server || '未知'}`);
      } catch (error) {
        console.error(`✗ HTTPS连接失败: ${name}`);
        console.log(`  错误: ${error.message}`);
      }
    }
  }
  
  console.log('');
}

// 测试证书验证
async function testCertificateValidation() {
  console.log('5. 证书验证测试');
  console.log('==================');
  
  // 重新启用证书验证进行测试
  const certOptions = { ...httpsOptions, rejectUnauthorized: true };
  
  try {
    await new Promise((resolve, reject) => {
      const req = https.get('https://www.google.com', certOptions, (res) => {
        res.on('data', () => {});
        res.on('end', resolve);
      });
      req.on('error', reject);
      req.setTimeout(5000, () => reject(new Error('连接超时')));
    });
    console.log('✓ 证书验证通过');
  } catch (error) {
    console.error('✗ 证书验证失败');
    console.log(`  错误: ${error.message}`);
    console.log(`  解决方法: 继续使用 rejectUnauthorized: false 选项`);
    console.log(`  注意: 这仅用于开发测试环境`);
  }
  
  console.log('');
}

// 测试系统网络配置
async function testSystemNetworkConfig() {
  console.log('6. 系统网络配置');
  console.log('==================');
  
  try {
    // 检查系统代理设置
    const proxyEnvVars = [
      { name: 'HTTPS_PROXY', value: process.env.HTTPS_PROXY || process.env.https_proxy },
      { name: 'HTTP_PROXY', value: process.env.HTTP_PROXY || process.env.http_proxy },
      { name: 'NO_PROXY', value: process.env.NO_PROXY || process.env.no_proxy }
    ];
    
    console.log('代理设置:');
    const hasProxy = proxyEnvVars.some(p => p.value);
    if (hasProxy) {
      proxyEnvVars.forEach(proxy => {
        if (proxy.value) {
          console.log(`  ${proxy.name}: ${proxy.value}`);
        }
      });
    } else {
      console.log('  未检测到代理设置');
    }
    
    // 获取IP配置
    console.log('\nIP配置:');
    const ipConfig = execSync('ipconfig', { encoding: 'utf8' });
    const ipv4Lines = ipConfig.match(/IPv4.*?: .*/g);
    if (ipv4Lines) {
      ipv4Lines.forEach(line => {
        console.log(`  ${line.trim()}`);
      });
    }
    
    // 路由跟踪
    console.log('\n路由跟踪 (Google DNS):');
    try {
      const traceroute = execSync('tracert -d 8.8.8.8', { encoding: 'utf8' });
      const routeLines = traceroute.split('\n').slice(5, 10); // 只显示前5跳
      routeLines.forEach(line => console.log(`  ${line.trim()}`));
    } catch (e) {
      console.log('  路由跟踪失败，可能需要管理员权限');
    }
  } catch (error) {
    console.error('获取系统网络配置失败:', error.message);
  }
  
  console.log('');
}

// 运行诊断
runNetworkDiagnostics().catch(err => {
  console.error('诊断过程中发生错误:', err);
});