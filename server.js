const express = require('express');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

// ===================== MongoDB 配置 =====================
const MONGODB_URI = process.env.MONGODB_URI || '';
const DB_NAME = 'heita_office';
const COLLECTION_NAME = 'appdata';

let mongoClient = null;
let mongoDb = null;
let useMongo = false;

// ===================== 本地文件回退配置 =====================
const DATA_FILE = path.join(__dirname, 'data.json');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// ===================== 数据读写层 =====================

// 从 MongoDB 读取数据
async function readFromMongo() {
  if (!useMongo || !mongoDb) return null;
  try {
    const doc = await mongoDb.collection(COLLECTION_NAME).findOne({ _id: 'main' });
    return doc ? doc.data : null;
  } catch (e) {
    console.error('[MongoDB] 读取失败:', e.message);
    return null;
  }
}

// 写入 MongoDB
async function writeToMongo(data) {
  if (!useMongo || !mongoDb) return false;
  try {
    const fingerprint = crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');
    const now = new Date().toISOString();
    await mongoDb.collection(COLLECTION_NAME).updateOne(
      { _id: 'main' },
      {
        $set: {
          data,
          _fingerprint: fingerprint,
          _updatedAt: now
        },
        $setOnInsert: { _id: 'main' }
      },
      { upsert: true }
    );
    console.log('[MongoDB] ✅ 写入成功, 大小:', JSON.stringify(data).length, 'bytes');
    return { success: true, fingerprint, updatedAt: now };
  } catch (e) {
    console.error('[MongoDB] ❌ 写入失败:', e.message);
    return false;
  }
}

// 从本地文件读取（回退方案）
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

// 写入本地文件（回退方案）
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

// 统一读取数据
async function readData() {
  if (useMongo) {
    const d = await readFromMongo();
    if (d) return d;
    console.log('[数据] MongoDB 无数据，尝试从本地文件恢复...');
    const local = readFromFile();
    if (local) {
      await writeToMongo(local);
      console.log('[数据] ✅ 已从本地文件恢复到 MongoDB');
    }
    return local;
  }
  return readFromFile();
}

// 统一写入数据（返回 {fingerprint, updatedAt} 或 false）
async function writeData(data) {
  if (useMongo) {
    return await writeToMongo(data);
  }
  // 文件模式：写入文件并添加元数据
  const fingerprint = crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');
  const now = new Date().toISOString();
  const savedData = { ...data, _updatedAt: now, _fingerprint: fingerprint };
  const ok = writeToFile(savedData);
  return ok ? { fingerprint, updatedAt: now } : false;
}

// ===================== API 路由 =====================

// GET /api/data — 获取云端数据
app.get('/api/data', async (req, res) => {
  const data = await readData();
  if (data) {
    const fingerprint = crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');
    res.json({ success: true, data, fingerprint, updatedAt: data._updatedAt || null });
  } else {
    // MongoDB 连接正常但无数据 → 仍返回 success:true，让前端知道服务器可用
    // 前端收到 data:null 后会用本地 localStorage 数据
    res.json({ success: true, data: null, fingerprint: '', storage: useMongo ? 'mongodb' : 'file', message: '云端暂无数据' });
  }
});

// PUT /api/data — 更新云端数据（带指纹冲突检测）
app.put('/api/data', async (req, res) => {
  const { data: newData, fingerprint, force } = req.body;

  if (!newData) {
    return res.status(400).json({ success: false, message: '缺少数据' });
  }

  const existing = await readData();

  // 冲突检测
  if (existing && fingerprint && existing._fingerprint && fingerprint !== existing._fingerprint && !force) {
    console.log('[冲突] 检测到并发修改');
    return res.status(409).json({
      success: false,
      conflict: true,
      message: '数据已被其他设备修改，请重新加载后重试',
      data: existing,
      fingerprint: existing._fingerprint
    });
  }

  const result = await writeData(newData);

  if (result && result.fingerprint) {
    res.json({
      success: true,
      fingerprint: result.fingerprint,
      updatedAt: result.updatedAt
    });
  } else if (result === false) {
    res.status(500).json({ success: false, message: '保存失败' });
  } else {
    res.json({ success: true });
  }
});

// GET /api/status — 健康检查
app.get('/api/status', async (req, res) => {
  const data = await readData();
  if (data) {
    const fingerprint = crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');
    res.json({ ok: true, fingerprint, updatedAt: data._updatedAt || null, storage: useMongo ? 'mongodb' : 'file' });
  } else {
    res.json({ ok: true, fingerprint: null, updatedAt: null, storage: useMongo ? 'mongodb' : 'file' });
  }
});

// GET /api/health — 简单健康检查（供 Render 唤醒使用）
app.get('/api/health', (req, res) => {
  res.json({ ok: true, mongo: useMongo, timestamp: new Date().toISOString() });
});

// ===================== SPA 回退 =====================
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ===================== 启动 =====================
async function startServer() {
  // 尝试连接 MongoDB
  if (MONGODB_URI) {
    try {
      const { MongoClient } = require('mongodb');
      mongoClient = new MongoClient(MONGODB_URI);
      await mongoClient.connect();
      mongoDb = mongoClient.db(DB_NAME);
      useMongo = true;
      console.log('✅ MongoDB Atlas 连接成功！');
      // 测试写入
      await mongoDb.collection(COLLECTION_NAME).findOne({ _id: 'main' });
    } catch (e) {
      console.error('❌ MongoDB 连接失败，使用本地文件模式:', e.message);
      useMongo = false;
    }
  } else {
    console.log('⚠️ 未配置 MONGODB_URI，使用本地文件存储（仅开发环境）');
  }

  app.listen(PORT, () => {
    console.log(`🏰 黑塔办事处服务器已启动: http://localhost:${PORT}`);
    console.log(`📦 存储模式: ${useMongo ? 'MongoDB Atlas ☁️' : '本地文件 💾'}`);
  });
}

startServer().catch(e => {
  console.error('启动失败:', e);
  process.exit(1);
});
