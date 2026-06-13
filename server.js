const express = require('express');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const dns = require('dns');

// 强制使用 Google/Cloudflare DNS（解决 Render 自带 DNS 解析 Atlas 失败的问题）
// Render 的 DNS 解析不了 cluster0.xc6yvnr.mongodb.net 但能解析具体 shard 域名
// 用 8.8.8.8 / 1.1.1.1 强制走公共 DNS
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
  console.log('[DNS] 已强制使用 8.8.8.8 / 1.1.1.1');
} catch (e) {
  console.log('[DNS] 设置失败,使用系统默认:', e.message);
}

// ===================== MongoDB 配置 =====================
const MONGODB_URI = process.env.MONGODB_URI || '';
const DB_NAME = 'heita_office';
const COLLECTION_NAME = 'appdata';

let mongoClient = null;
let mongoDb = null;
let useMongo = false;
let mongoRetrying = false;

// ===================== 本地文件回退配置 =====================
const DATA_FILE = path.join(__dirname, 'data.json');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// ===================== MongoDB 主动重连 =====================

// 保存最近 10 次连接错误
let mongoDebugLog = [];

async function tryConnectMongo() {
  // 不再用 useMongo 作短路,因为 useMongo 可能 stale
  if (mongoRetrying) return false;
  if (!MONGODB_URI) {
    console.log('[MongoDB] 未配置 MONGODB_URI,跳过重连');
    return false;
  }
  const t0 = Date.now();
  // 用正则从 URI 提取 hostname (因为 mongodb:// 多个 host:port 不是标准 URL 格式)
  let hostnames = [];
  try {
    const afterAt = MONGODB_URI.split('@').pop();
    const beforeQuery = afterAt.split('?')[0];
    const beforeSlash = beforeQuery.split('/')[0];
    hostnames = beforeSlash.split(',');
  } catch (e) {
    console.log('[MongoDB] URI 解析失败:', e.message);
  }
  // 修复 dns.lookup 失败: 多个 hostname 用空格隔开
  const dns = require('dns');
  let dnsInfo = '';
  try {
    const hostList = hostnames.map(h => h.split(':')[0]);
    const checks = await Promise.all(hostList.map(h => new Promise((resolve) => {
      dns.lookup(h, (err, addr) => {
        if (err) resolve(h + '->FAIL:' + err.code);
        else resolve(h + '->' + addr);
      });
    })));
    dnsInfo = 'DNS(' + checks.length + '): ' + checks.join(' | ');
  } catch (e) {
    dnsInfo = 'DNS FAIL: ' + e.code + ' ' + e.message;
  }
  try {
    console.log('[MongoDB] 尝试连接 Atlas... hostnames=' + hostnames.length);
    console.log('[MongoDB] ' + dnsInfo);
    const { MongoClient } = require('mongodb');
    if (mongoClient) {
      try { await mongoClient.close(); } catch (e) {}
      mongoClient = null;
      mongoDb = null;
    }
    // 使用 directConnection 模式 - 只连第一个 shard,避免 replicaSet 协商卡住
    // 注意: query string 里加 directConnection=true 要带引号
    const firstHost = hostnames[0];
    let directUri = MONGODB_URI;
    if (firstHost) {
      directUri = MONGODB_URI.replace(
        /@(ac-q5xfbdw-shard-00-[0-9]+\.xc6yvnr\.mongodb\.net:[0-9]+,)*(ac-q5xfbdw-shard-00-[0-9]+\.xc6yvnr\.mongodb\.net:[0-9]+)\/?/,
        '@' + firstHost + '/'
      );
      // 在 query string 里加 directConnection=true (用字符串值)
      if (directUri.includes('?')) {
        if (!directUri.includes('directConnection=')) {
          directUri += '&directConnection=true';
        }
      } else {
        directUri += '?directConnection=true';
      }
    }
    console.log('[MongoDB] directUri=' + directUri.replace(/:[^:@]+@/, ':***@'));
    mongoClient = new MongoClient(directUri, {
      connectTimeoutMS: 15000,
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 20000,
      // 关键修复: 保持心跳保活,避免 Atlas M0 空闲断开连接
      heartbeatFrequencyMS: 10000,
      minPoolSize: 2,
      maxPoolSize: 10,
      waitQueueTimeoutMS: 5000,
      retryWrites: true,
      // directConnection URI 模式下 disable 掉 SRV poller
      directConnection: true
    });
    console.log('[MongoDB] 调用 client.connect() ...');
    await mongoClient.connect();
    console.log('[MongoDB] client.connect() 完成,耗时 ' + (Date.now() - t0) + 'ms');
    mongoDb = mongoClient.db(DB_NAME);
    // ping admin 强制等待 topology ready,避免 next op 时 topology closed
    await mongoDb.admin().ping();
    console.log('[MongoDB] admin.ping() OK');
    await mongoDb.collection(COLLECTION_NAME).findOne({ _id: 'main' }, { maxTimeMS: 8000 });
    useMongo = true;
    console.log('✅ MongoDB Atlas 连接成功！');
    mongoDebugLog.push({ ok: true, time: new Date().toISOString(), ms: Date.now() - t0 });
    if (mongoDebugLog.length > 10) mongoDebugLog = mongoDebugLog.slice(-10);
    await syncLocalToAtlas();
    return true;
  } catch (e) {
    const ms = Date.now() - t0;
    const errMsg = e.name + ': ' + e.message;
    console.error('❌ MongoDB 连接失败 (' + ms + 'ms):', errMsg);
    console.error('   错误码:', e.code, '| codeName:', e.codeName);
    console.error('   完整错误:', JSON.stringify({name: e.name, message: e.message, code: e.code, codeName: e.codeName, topology: e.topologyDescription && e.topologyDescription.servers}, null, 2).substring(0, 500));
    mongoDebugLog.push({ ok: false, time: new Date().toISOString(), ms, error: errMsg, code: e.code, codeName: e.codeName, dns: dnsInfo, hostname: hostnames.join(',') });
    if (mongoDebugLog.length > 10) mongoDebugLog = mongoDebugLog.slice(-10);
    useMongo = false;
    // 强制关闭 client 释放连接
    if (mongoClient) {
      try { await mongoClient.close(true); } catch (e2) {}
      mongoClient = null;
      mongoDb = null;
    }
    return false;
  }
}

async function syncLocalToAtlas() {
  const local = readFromFile();
  if (!local) {
    console.log('[同步] 本地 data.json 不存在,跳过同步');
    return;
  }
  try {
    await writeToMongoAsync(local);
    console.log('[同步] 本地 data.json 已同步到 Atlas');
  } catch (e) {
    console.error('[同步] 同步失败:', e.message);
  }
}

function startMongoReconnectLoop() {
  if (!MONGODB_URI) return;
  // 第一次重连只等 5 秒（让应用先正常启动），之后每 60 秒
  setTimeout(() => {
    setInterval(async () => {
      if (useMongo || mongoRetrying) return;
      mongoRetrying = true;
      const ok = await tryConnectMongo();
      mongoRetrying = false;
      if (ok) {
        console.log('[重连] MongoDB 已恢复,使用 Atlas 存储');
      } else {
        console.log('[重连] MongoDB 仍未恢复,继续等待下次重试');
      }
    }, 60000); // 每 60 秒重试
  }, 5000);
}

// ===================== 数据读写层 =====================

async function readFromMongo() {
  if (!useMongo || !mongoDb) return null;
  try {
    const doc = await mongoDb.collection(COLLECTION_NAME).findOne(
      { _id: 'main' },
      { maxTimeMS: 8000 }
    );
    return doc ? doc.data : null;
  } catch (e) {
    console.error('[MongoDB] 读取失败:', e.message);
    // 不重置 useMongo, 写入路径会自己处理
    return null;
  }
}

async function writeToMongoAsync(data) {
  // 异步后台写入 Atlas，不阻塞 PUT 响应
  if (!useMongo || !mongoDb) {
    if (MONGODB_URI && !mongoRetrying) {
      // 触发一次重连尝试
      tryConnectMongo().catch(() => {});
    }
    return;
  }
  const fingerprint = crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');
  const now = new Date().toISOString();
  // 写入不阻塞主流程，使用单独超时（更长，给 Atlas M0 充足时间）
  const writePromise = mongoDb.collection(COLLECTION_NAME).updateOne(
    { _id: 'main' },
    {
      $set: { data, _fingerprint: fingerprint, _updatedAt: now },
      $setOnInsert: { _id: 'main' }
    },
    { upsert: true }
  );
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Atlas 写入超时(30s)')), 30000)
  );
  try {
    await Promise.race([writePromise, timeoutPromise]);
    console.log('[MongoDB] 写入成功, 大小:', JSON.stringify(data).length, 'bytes');
  } catch (e) {
    console.error('[MongoDB] 后台写入失败:', e.message);
    // 写入失败: 不污染 useMongo, 留给下次重连循环处理
  }
}

function readFromFile() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    }
  } catch (e) {
    console.error('[文件] 读取失败:', e.message);
  }
  return null;
}

function writeToFile(data) {
  try {
    const tempFile = DATA_FILE + '.tmp';
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DATA_FILE);
    return true;
  } catch (e) {
    console.error('[文件] 写入失败:', e.message);
    return false;
  }
}

function withTimeout(promise, ms, fallback) {
  return Promise.race([
    promise,
    new Promise((resolve) => setTimeout(() => resolve(fallback), ms))
  ]);
}

async function readData() {
  if (useMongo && mongoDb) {
    try {
      const d = await withTimeout(readFromMongo(), 6000, null);
      if (d && d.members) {
        return d;
      }
      console.log('[数据] Atlas 无数据,回退本地');
    } catch (e) {
      console.error('[数据] Atlas 读失败,回退本地:', e.message);
    }
  }
  if (!useMongo && MONGODB_URI && !mongoRetrying) {
    tryConnectMongo().catch(() => {});
  }
  return readFromFile();
}

async function writeData(data) {
  const fingerprint = crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');
  const now = new Date().toISOString();
  const savedData = { ...data, _updatedAt: now, _fingerprint: fingerprint };

  let mongoOk = false;
  let fileOk = false;

  // 1) 本地文件立即写入（快，永远成功）
  fileOk = writeToFile(savedData);

  // 2) Atlas 写入: 每次都重试 3 次,确保连上次失败的也补上
  if (MONGODB_URI) {
    const t0 = Date.now();
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        // 如果连接已断,先重连
        if (!useMongo || !mongoDb) {
          if (mongoRetrying) {
            console.log('[MongoDB] 正在重连,跳过本次写入尝试', attempt);
            break;
          }
          mongoRetrying = true;
          try {
            await tryConnectMongo();
          } finally {
            mongoRetrying = false;
          }
          if (!useMongo || !mongoDb) {
            console.log('[MongoDB] 重连失败,放弃写入', attempt);
            break;
          }
        }
        // 真正写入
        await mongoDb.collection(COLLECTION_NAME).updateOne(
          { _id: 'main' },
          { $set: { data, _fingerprint: fingerprint, _updatedAt: now }, $setOnInsert: { _id: 'main' } },
          { upsert: true, maxTimeMS: 12000 }
        );
        mongoOk = true;
        console.log('[MongoDB] 写入成功, attempt=' + attempt + ', 用时 ' + (Date.now()-t0) + 'ms');
        break;
      } catch (e) {
        console.error('[MongoDB] 写入失败 attempt=' + attempt + ':', e.message);
        useMongo = false;
        mongoDb = null;
        if (mongoClient) {
          try { await mongoClient.close(true); } catch (e2) {}
          mongoClient = null;
        }
        // 继续重试
        if (attempt < 3) await new Promise(r => setTimeout(r, 1000));
      }
    }
  }

  if (!mongoOk && MONGODB_URI && !mongoRetrying) {
    (async () => {
      mongoRetrying = true;
      const ok = await tryConnectMongo();
      mongoRetrying = false;
      if (ok) {
        console.log('[恢复] MongoDB 已重新连接,本地数据已自动同步');
      }
    })();
  }

  return { fingerprint, updatedAt: now, mongo: mongoOk, file: fileOk };
}

// ===================== 调试：查看 Render 出口 IP =====================
app.get('/api/myip', async (req, res) => {
  // 试多个 IP 查询服务,看 Render 服务器对外的 IP
  const results = {};
  const https = require('https');
  function fetchIp(name, url, host) {
    return new Promise((resolve) => {
      const opt = { hostname: host, port: 443, path: url, method: 'GET', timeout: 10000 };
      const r = https.request(opt, (response) => {
        let d = '';
        response.on('data', c => d += c);
        response.on('end', () => {
          try { results[name] = JSON.parse(d); }
          catch(e) { results[name] = d.substring(0, 100); }
          resolve();
        });
      });
      r.on('timeout', () => { results[name] = 'TIMEOUT'; r.destroy(); resolve(); });
      r.on('error', e => { results[name] = e.code; resolve(); });
      r.end();
    });
  }
  await Promise.all([
    fetchIp('ipify', '/', 'api.ipify.org'),
    fetchIp('ifconfig', '/all.json', 'ifconfig.co')
  ]);
  res.json({
    ips: results,
    mongodb_uri_hostname: (() => {
      try {
        const u = new URL(MONGODB_URI);
        return u.hostname;
      } catch (e) {
        return MONGODB_URI.split('@').pop().split('?')[0];
      }
    })(),
    mongo_connected: useMongo,
    timestamp: new Date().toISOString()
  });
});

// 解析 MongoDB SRV 记录看实际 IP
app.get('/api/atlas-ips', async (req, res) => {
  const dns = require('dns');
  if (!MONGODB_URI) {
    return res.json({ error: 'MONGODB_URI 未配置' });
  }
  let hostname;
  try {
    const u = new URL(MONGODB_URI);
    hostname = u.hostname;
  } catch (e) {
    hostname = MONGODB_URI.split('@').pop().split('/')[0].split('?')[0];
  }
  res.json({
    mongodb_uri: MONGODB_URI.replace(/:[^:@]+@/, ':***@'),
    parsed_hostname: hostname
  });
});

// ===================== API 路由 =====================

app.get('/api/data', async (req, res) => {
  try {
    const data = await withTimeout(readData(), 8000, null);
    if (data) {
      const fingerprint = crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');
      res.json({ success: true, data, fingerprint, updatedAt: data._updatedAt || null, storage: useMongo ? 'mongodb' : 'file' });
    } else {
      res.json({ success: true, data: null, fingerprint: '', storage: useMongo ? 'mongodb' : 'file', message: '云端暂无数据' });
    }
  } catch (e) {
    console.error('[GET] 超时/异常,返回本地文件:', e.message);
    const data = readFromFile();
    if (data) {
      res.json({ success: true, data, fingerprint: data._fingerprint || '', updatedAt: data._updatedAt || null, storage: 'file-fallback' });
    } else {
      res.status(500).json({ success: false, message: '读取失败' });
    }
  }
});

app.put('/api/data', async (req, res) => {
  const { data: newData, fingerprint, force } = req.body;
  if (!newData) {
    return res.status(400).json({ success: false, message: '缺少数据' });
  }
  const existing = await readData();
  if (existing && fingerprint && existing._fingerprint && fingerprint !== existing._fingerprint && !force) {
    return res.status(409).json({
      success: false,
      conflict: true,
      message: '数据已被其他设备修改',
      data: existing,
      fingerprint: existing._fingerprint
    });
  }
  const result = await writeData(newData);
  res.json({
    success: true,
    fingerprint: result.fingerprint,
    updatedAt: result.updatedAt,
    storage: { mongo: result.mongo, file: result.file }
  });
});

app.get('/api/status', async (req, res) => {
  const data = await readData();
  if (data) {
    const fingerprint = crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');
    res.json({ ok: true, fingerprint, updatedAt: data._updatedAt || null, storage: useMongo ? 'mongodb' : 'file' });
  } else {
    res.json({ ok: true, fingerprint: null, updatedAt: null, storage: useMongo ? 'mongodb' : 'file' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true, mongo: useMongo, timestamp: new Date().toISOString() });
});

// 返回最近 10 次连接错误 + DNS 解析详情
app.get('/api/mongo-debug', (req, res) => {
  res.json({
    mongo_connected: useMongo,
    mongodb_uri_hostname: (() => {
      try {
        const u = new URL(MONGODB_URI);
        return u.hostname;
      } catch (e) {
        return MONGODB_URI.split('@').pop().split('?')[0];
      }
    })(),
    mongodb_uri_user: (() => {
      try {
        const u = new URL(MONGODB_URI);
        return u.username;
      } catch (e) { return '?'; }
    })(),
    mongodb_uri_length: MONGODB_URI.length,
    mongodb_uri_password_length: (() => {
      try {
        const u = new URL(MONGODB_URI);
        return u.password ? u.password.length : 0;
      } catch (e) { return 0; }
    })(),
    recent_attempts: mongoDebugLog,
    timestamp: new Date().toISOString()
  });
});

app.post('/api/sync-to-atlas', async (req, res) => {
  if (!MONGODB_URI) {
    return res.status(400).json({ success: false, message: '未配置 MONGODB_URI' });
  }
  const ok = await tryConnectMongo();
  if (ok) {
    const local = readFromFile();
    let writeOk = false;
    if (local) {
      // 等待后台写入完成,确保数据真的到 Atlas
      // 用 ping 检测连接是否真活着,如果 ping 通才写
      try {
        if (mongoDb) {
          await mongoDb.admin().ping();
        }
        await writeToMongoAsync(local);
        // 写后再 ping 一次确认连接没掉
        if (mongoDb) {
          await mongoDb.admin().ping();
          writeOk = true;
        }
      } catch (e) {
        console.error('[sync-to-atlas] 写入失败:', e.message);
        writeOk = false;
      }
    }
    const fingerprint = local ? crypto.createHash('md5').update(JSON.stringify(local)).digest('hex') : '';
    res.json({ success: writeOk, message: writeOk ? '已同步到 Atlas' : '同步到 Atlas 失败', mongo: true, fingerprint });
  } else {
    res.status(500).json({ success: false, message: 'Atlas 连接失败,请检查 IP 白名单' });
  }
});

// ===================== SPA 回退 =====================
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ===================== 启动 =====================
async function startServer() {
  await tryConnectMongo();
  startMongoReconnectLoop();

  app.listen(PORT, () => {
    console.log('黑塔办事处服务器已启动: http://localhost:' + PORT);
    console.log('存储模式: ' + (useMongo ? 'MongoDB Atlas' : '本地文件 (会主动重连 Atlas)'));
    if (MONGODB_URI) {
      console.log('MongoDB 重连循环已启动 (每 30 秒尝试一次)');
    }
  });
}

startServer().catch(e => {
  console.error('启动失败:', e);
  process.exit(1);
});
