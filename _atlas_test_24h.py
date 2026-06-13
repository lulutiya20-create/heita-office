"""
24 小时后自动执行: Atlas 连接 + 同步测试
- 触发时间: 用户确认后
- 当前时间: 2026-06-13 19:17:39 GMT+8
- 计划执行: 2026-06-14 19:18:00 GMT+8 (24h 后)
"""
import urllib.request
import json
import time
import sys
import os

BASE = "https://heita-office.onrender.com"

def get_json(path, timeout=20):
    try:
        with urllib.request.urlopen(BASE + path, timeout=timeout) as r:
            return r.status, json.load(r)
    except Exception as e:
        return -1, {"error": str(e)}

def post(path, timeout=60):
    try:
        req = urllib.request.Request(BASE + path, data=b'', method='POST', headers={'Content-Type': 'application/json'})
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, json.load(r)
    except Exception as e:
        return -1, {"error": str(e)}

def log(msg):
    print(time.strftime('%Y-%m-%d %H:%M:%S'), msg, flush=True)

def main():
    log("=== Atlas 24h 后同步测试开始 ===")
    
    # 1. 健康检查
    code, health = get_json("/api/health", 30)
    log(f"[1/4] /api/health: status={code}, mongo={health.get('mongo')}, ts={health.get('timestamp')}")
    
    # 2. Mongo debug
    code, debug = get_json("/api/mongo-debug", 30)
    log(f"[2/4] /api/mongo-debug: connected={debug.get('mongo_connected')}")
    if debug.get('recent_attempts'):
        log("   最近连接尝试:")
        for a in debug.get('recent_attempts', [])[-5:]:
            err = (a.get('error', '') or 'OK')[:80]
            log(f"     - {a.get('time')} ok={a.get('ok')} ms={a.get('ms')} {err}")
    
    # 3. 尝试 sync-to-atlas
    log("[3/4] 尝试 POST /api/sync-to-atlas ...")
    code, sync = post("/api/sync-to-atlas", 60)
    log(f"   同步结果: status={code}, body={json.dumps(sync, ensure_ascii=False)[:300]}")
    
    # 4. 验证数据
    code, data = get_json("/api/data", 30)
    members = (data.get('data') or {}).get('members', [])
    mentors = (data.get('data') or {}).get('mentors', [])
    positions = (data.get('data') or {}).get('treeNodePositions', {})
    log(f"[4/4] /api/data: members={len(members)}, mentors={len(mentors)}, positions={len(positions)}, storage={data.get('storage')}, fingerprint={data.get('fingerprint', '')[:12]}")
    
    # 总结
    log("=== 测试总结 ===")
    if code == 200 and len(members) >= 27:
        log("✅ 完美: Atlas 已恢复, 27 成员数据完整")
    elif code == 200 and len(members) < 27:
        log(f"⚠️  Atlas 已恢复但只有 {len(members)} 成员 (期望 27)")
    else:
        log("❌ Atlas 仍不可用, 需继续等待")
    
    # 输出 JSON 供后续分析
    result = {
        "timestamp": time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
        "health": health,
        "mongo_debug": {
            "connected": debug.get('mongo_connected'),
            "recent": debug.get('recent_attempts', [])[-3:]
        },
        "sync": sync,
        "data_summary": {
            "members": len(members),
            "mentors": len(mentors),
            "positions": len(positions),
            "storage": data.get('storage'),
            "fingerprint": data.get('fingerprint', '')[:16]
        }
    }
    with open('atlas_test_result.json', 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    log(f"详细结果已写入 atlas_test_result.json")

if __name__ == '__main__':
    main()
