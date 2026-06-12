const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

// 内存写锁，防止并发写入冲突
let writeLock = false;
const writeQueue = [];

// 始终从磁盘读取最新数据（Render 免费版内存/磁盘不同步时使用）
let cachedData = null;
let cachedFingerprint = null;

// 解析 JSON body（限制 50MB，支持头像 base64 和压缩图片）
app.use(express.json({ limit: '50mb' }));

// ===================== 静态文件服务 =====================
app.use(express.static(path.join(__dirname, 'public')));

// ===================== CORS 头 =====================
// 同源部署时不需要 CORS，但加上以防不同端口访问
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// ===================== 数据读写 =====================

function readData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('读取数据文件失败:', e.message);
  }
  return null;
}

function writeData(data, callback) {
  const doWrite = () => {
    writeLock = true;
    try {
      const tempFile = DATA_FILE + '.tmp';
      fs.writeFileSync(tempFile, JSON.stringify(data), 'utf-8');
      fs.renameSync(tempFile, DATA_FILE); // 原子操作
      console.log('[数据] 写入成功, 大小:', JSON.stringify(data).length, 'bytes');
      writeLock = false;
      if (callback) callback(null);
      // 处理队列中的下一个写入
      if (writeQueue.length > 0) {
        const next = writeQueue.shift();
        writeData(next.data, next.callback);
      }
    } catch (e) {
      writeLock = false;
      console.error('[数据] 写入失败:', e.message);
      if (callback) callback(e);
    }
  };

  if (writeLock) {
    writeQueue.push({ data, callback });
  } else {
    doWrite();
  }
}

// ===================== API 路由 =====================

// GET /api/data — 获取云端数据
app.get('/api/data', (req, res) => {
  const data = readData();
  if (data) {
    // 计算数据指纹
    const fingerprint = crypto
      .createHash('md5')
      .update(JSON.stringify(data))
      .digest('hex');
    res.json({ success: true, data, fingerprint, updatedAt: data._updatedAt || null });
  } else {
    res.json({ success: false, data: null, message: '暂无云端数据' });
  }
});

// PUT /api/data — 更新云端数据（带指纹冲突检测 + 冲突时返回最新数据）
app.put('/api/data', (req, res) => {
  const { data: newData, fingerprint, force } = req.body;

  if (!newData) {
    return res.status(400).json({ success: false, message: '缺少数据' });
  }

  const existing = readData();

  // 冲突检测：如果提供了指纹且与当前数据不匹配，说明有其他设备先更新了
  if (existing && fingerprint && existing._fingerprint && fingerprint !== existing._fingerprint && !force) {
    console.log('[冲突] 检测到并发修改，返回冲突标记让客户端合并');
    // 返回当前最新数据，让客户端自行合并
    return res.status(409).json({
      success: false,
      conflict: true,
      message: '数据已被其他设备修改，请合并后再提交',
      data: existing,
      fingerprint: existing._fingerprint
    });
  }

  // 添加服务端元数据
  const savedData = {
    ...newData,
    _updatedAt: new Date().toISOString(),
    _fingerprint: crypto.createHash('md5').update(JSON.stringify(newData)).digest('hex'),
    _deviceCount: (existing?._deviceCount || 0) + 1
  };

  writeData(savedData, (err) => {
    if (err) {
      return res.status(500).json({ success: false, message: '保存失败: ' + err.message });
    }
    res.json({
      success: true,
      fingerprint: savedData._fingerprint,
      updatedAt: savedData._updatedAt
    });
  });
});

// GET /api/status — 健康检查 + 数据指纹（轻量轮询）
app.get('/api/status', (req, res) => {
  const data = readData();
  if (data) {
    const fingerprint = crypto
      .createHash('md5')
      .update(JSON.stringify(data))
      .digest('hex');
    res.json({ ok: true, fingerprint, updatedAt: data._updatedAt });
  } else {
    res.json({ ok: true, fingerprint: null, updatedAt: null });
  }
});

// ===================== SPA 回退 =====================
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ===================== 启动 =====================
app.listen(PORT, () => {
  console.log(`🏰 黑塔办事处服务器已启动: http://localhost:${PORT}`);
  // 初始化数据文件
  if (!fs.existsSync(DATA_FILE)) {
    const initData = {
      adminPassword: 'admin123',
      carouselImages: [
        { id: 1, title: '黑塔办事处全景', url: 'https://picsum.photos/seed/heita1/1200/480' },
        { id: 2, title: '团队合影', url: 'https://picsum.photos/seed/heita2/1200/480' },
        { id: 3, title: '训练基地', url: 'https://picsum.photos/seed/heita3/1200/480' }
      ],
      members: [
        { id: 1, name: '张建国', role: '主任', info: '黑塔办事处主任，负责全面工作，经验丰富，作风严谨。', avatar: '', relations: [{ targetId: 2, label: '上级' }, { targetId: 3, label: '战友' }] },
        { id: 2, name: '李志强', role: '副主任', info: '协助主任处理日常事务，主管后勤保障工作。', avatar: '', relations: [{ targetId: 1, label: '下属' }, { targetId: 4, label: '搭档' }] },
        { id: 3, name: '王建军', role: '队长', info: '负责外勤任务执行，行动力强，善于应急处理。', avatar: '', relations: [{ targetId: 1, label: '战友' }, { targetId: 5, label: '上级' }] },
        { id: 4, name: '刘思远', role: '指导员', info: '负责思想政治工作和团队文化建设。', avatar: '', relations: [{ targetId: 2, label: '搭档' }, { targetId: 5, label: '同事' }] },
        { id: 5, name: '陈晓峰', role: '队员', info: '年轻骨干，计算机技术专长，负责信息化建设。', avatar: '', relations: [{ targetId: 3, label: '下属' }, { targetId: 4, label: '同事' }] }
      ],
      events: [
        { id: 1, title: '2026年春季团建活动', date: '2026-04-15', description: '全体成员前往郊外开展为期两天的团建活动，包括野外拉练、团队协作游戏和篝火晚会。', image: 'https://picsum.photos/seed/event1/600/400' },
        { id: 2, title: '新成员入职欢迎会', date: '2026-03-20', description: '欢迎新成员加入黑塔办事处大家庭，举办了简朴而温馨的欢迎仪式。', image: 'https://picsum.photos/seed/event2/600/400' },
        { id: 3, title: '年终总结大会', date: '2026-01-10', description: '回顾过去一年的工作成果，表彰先进，展望未来发展方向。', image: 'https://picsum.photos/seed/event3/600/400' }
      ],
      mentors: [
        { id: 1, memberId: 1, specialty: '行政管理', extraInfo: '从事管理工作20余年，拥有丰富的团队领导经验。曾多次荣获优秀管理者称号，擅长战略规划和危机处理。' },
        { id: 2, memberId: 3, specialty: '战术指挥', extraInfo: '具备优秀的现场指挥能力，参与过多项重大任务的策划与执行。注重实战训练，培养了一批优秀骨干。' }
      ],
      messages: [
        { id: 1, name: '访客小王', content: '黑塔办事处的工作氛围真好，希望有机会能够加入！', time: '2026-06-10 14:30' },
        { id: 2, name: '老战友', content: '看到大家都很精神，感到很欣慰。继续保持！', time: '2026-06-08 09:15' }
      ],
      _updatedAt: new Date().toISOString(),
      _fingerprint: '',
      _deviceCount: 0
    };
    writeData(initData, () => {
      console.log('[初始化] 已创建默认数据文件');
    });
  }
});
