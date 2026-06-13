// 把 4MB 备份压缩: 把 carouselImages 和 mentors 的 base64 大图替换为 picsum 占位 URL
// 输出 _jsonbin_payload.json, 然后再推到 JSONBin
const fs = require('fs');

const BACKUP = 'C:\\Users\\Administrator\\Downloads\\黑塔办事处_数据备份_2026-06-13 (2).json';
const OUT    = 'C:\\Users\\Administrator\\WorkBuddy\\2026-06-12-18-25-30\\_jsonbin_payload.json';

const data = JSON.parse(fs.readFileSync(BACKUP, 'utf8'));

// 替换 carouselImages
if (Array.isArray(data.carouselImages)) {
  data.carouselImages = data.carouselImages.map((c, i) => ({
    id: c.id,
    title: c.title || `轮播图 ${i+1}`,
    url: `https://picsum.photos/seed/heita-carousel-${c.id || i}/1920/1080`
  }));
  console.log('✅ carouselImages 已替换为占位 URL');
}

// 替换 mentors 图片
if (Array.isArray(data.mentors)) {
  data.mentors = data.mentors.map((m, i) => ({
    id: m.id,
    memberId: m.memberId,
    specialty: m.specialty,
    extraInfo: m.extraInfo,
    image: `https://picsum.photos/seed/mentor-${m.id || i}/1080/1920`
  }));
  console.log('✅ mentors 图片已替换为占位 URL, 数量:', data.mentors.length);
}

// 也替换 members avatar base64 为 picsum（如果存在 data: URI）
if (Array.isArray(data.members)) {
  let avatarFixed = 0;
  data.members = data.members.map(m => {
    if (m.avatar && m.avatar.startsWith('data:')) {
      avatarFixed++;
      m.avatar = `https://picsum.photos/seed/member-${m.id || m.name}/200/200`;
    }
    return m;
  });
  if (avatarFixed) console.log('✅ 头像 base64 已替换, 数量:', avatarFixed);
}

// 输出
const out = JSON.stringify(data, null, 2);
fs.writeFileSync(OUT, out, 'utf8');
console.log('✅ 输出:', OUT);
console.log('   体积:', (out.length / 1024).toFixed(2), 'KB');
console.log('   成员:', data.members.length);
