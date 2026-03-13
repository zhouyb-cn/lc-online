// server.js - Railway 部署完整版
// 功能：
// - 连接 LeetCode 的 WebSocket 获取 Hot100 题目实时在线人数
// - 每轮采集后保存到 PostgreSQL
// - 通过 WebSocket 推送最新数据给前端客户端
// - 支持客户端请求某题历史数据

import WebSocket, { WebSocketServer } from 'ws';
import http from 'http';
import express from 'express';
import { Pool } from 'pg';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// ------------------ 配置 ------------------
const PORT = process.env.PORT || 3000;

// Hot100 slug 列表（你可以从 LeetCode 页面复制或补充完整）
const hot100Slugs = [
  "two-sum",
  "add-two-numbers",
  "longest-substring-without-repeating-characters",
  "median-of-two-sorted-arrays",
  "longest-palindromic-substring",
  "container-with-most-water",
  "roman-to-integer",
  "longest-common-prefix",
  "3sum",
  "letter-combinations-of-a-phone-number",
  "remove-nth-node-from-end-of-list",
  "valid-parentheses",
  "merge-two-sorted-lists",
  "generate-parentheses",
  "merge-k-sorted-lists",
  "swap-nodes-in-pairs",
  "reverse-nodes-in-k-group",
  "next-permutation",
  "longest-valid-parentheses",
  "search-in-rotated-sorted-array",
  "find-first-and-last-position-of-element-in-sorted-array",
  "search-insert-position",
  "combination-sum",
  "first-missing-positive",
  "trapping-rain-water",
  "jump-game-ii",
  "permutations",
  "rotate-image",
  "group-anagrams",
  "subarray-sum-equals-k",
  "n-queens",
  "maximum-subarray",
  "spiral-matrix",
  "jump-game",
  "merge-intervals",
  "unique-paths",
  "minimum-path-sum",
  "climbing-stairs",
  "edit-distance",
  "set-matrix-zeroes",
  "search-a-2d-matrix",
  "sort-colors",
  "minimum-window-substring",
  "subsets",
  "word-search",
  "largest-rectangle-in-histogram",
  "binary-tree-inorder-traversal",
  "validate-binary-search-tree",
  "symmetric-tree",
  "binary-tree-level-order-traversal",
  "maximum-depth-of-binary-tree",
  "construct-binary-tree-from-preorder-and-inorder-traversal",
  "flatten-binary-tree-to-linked-list",
  "pascals-triangle",
  "best-time-to-buy-and-sell-stock",
  "binary-tree-maximum-path-sum",
  "longest-consecutive-sequence",
  "palindrome-partitioning",
  "single-number",
  "copy-list-with-random-pointer",
  "word-break",
  "linked-list-cycle",
  "linked-list-cycle-ii",
  "lru-cache",
  "sort-list",
  "maximum-product-subarray",
  "find-minimum-in-rotated-sorted-array",
  "min-stack",
  "intersection-of-two-linked-lists",
  "majority-element",
  "rotate-array",
  "house-robber",
  "number-of-islands",
  "reverse-linked-list",
  "course-schedule",
  "implement-trie-prefix-tree",
  "kth-largest-element-in-an-array",
  "diameter-of-binary-tree",
  "rotting-oranges",
  "daily-temperatures",
  "move-zeroes",
  "product-of-array-except-self",
  "sliding-window-maximum",
  "search-a-2d-matrix-ii",
  "perfect-squares",
  "coin-change",
  "longest-increasing-subsequence",
  "partition-equal-subset-sum",
  "longest-common-subsequence",
  "path-sum-iii",
  "decode-string",
  "find-all-anagrams-in-a-string",
  "partition-labels",
  "top-k-frequent-elements",
  "find-median-from-data-stream",
  "serialize-and-deserialize-binary-tree",
  "maximal-square"
  // 如果列表不完整或有变动，请从 https://leetcode.com/problem-list/top-100-liked-questions/ 补充
];

const slugToTitle = {
  "two-sum": "1. 两数之和",
  "add-two-numbers": "2. 两数相加",
  "longest-substring-without-repeating-characters": "3. 无重复字符的最长子串",
  "median-of-two-sorted-arrays": "4. 寻找两个正序数组的中位数",
  "longest-palindromic-substring": "5. 最长回文子串",
  "container-with-most-water": "11. 盛最多水的容器",
  "roman-to-integer": "13. 罗马数字转整数",
  "longest-common-prefix": "14. 最长公共前缀",
  "3sum": "15. 三数之和",
  "letter-combinations-of-a-phone-number": "17. 电话号码的字母组合",
  "remove-nth-node-from-end-of-list": "19. 删除链表的倒数第 N 个结点",
  "valid-parentheses": "20. 有效的括号",
  "merge-two-sorted-lists": "21. 合并两个有序链表",
  "generate-parentheses": "22. 括号生成",
  "merge-k-sorted-lists": "23. 合并 K 个升序链表",
  "swap-nodes-in-pairs": "24. 两两交换链表中的节点",
  "reverse-nodes-in-k-group": "25. K 个一组翻转链表",
  "next-permutation": "31. 下一个排列",
  "longest-valid-parentheses": "32. 最长有效括号",
  "search-in-rotated-sorted-array": "33. 搜索旋转排序数组",
  "find-first-and-last-position-of-element-in-sorted-array": "34. 在排序数组中查找元素的第一个和最后一个位置",
  "search-insert-position": "35. 搜索插入位置",
  "combination-sum": "39. 组合总和",
  "first-missing-positive": "41. 缺失的第一个正数",
  "trapping-rain-water": "42. 接雨水",
  "jump-game-ii": "45. 跳跃游戏 II",
  "permutations": "46. 全排列",
  "rotate-image": "48. 旋转图像",
  "group-anagrams": "49. 字母异位词分组",
  "subarray-sum-equals-k": "560. 和为 K 的子数组",
  "n-queens": "51. N 皇后",
  "maximum-subarray": "53. 最大子数组和",
  "spiral-matrix": "54. 螺旋矩阵",
  "jump-game": "55. 跳跃游戏",
  "merge-intervals": "56. 合并区间",
  "unique-paths": "62. 不同路径",
  "minimum-path-sum": "64. 最小路径和",
  "climbing-stairs": "70. 爬楼梯",
  "edit-distance": "72. 编辑距离",
  "set-matrix-zeroes": "73. 矩阵置零",
  "search-a-2d-matrix": "74. 搜索二维矩阵",
  "sort-colors": "75. 颜色分类",
  "minimum-window-substring": "76. 最小覆盖子串",
  "subsets": "78. 子集",
  "word-search": "79. 单词搜索",
  "largest-rectangle-in-histogram": "84. 柱状图中最大的矩形",
  "binary-tree-inorder-traversal": "94. 二叉树的中序遍历",
  "validate-binary-search-tree": "98. 验证二叉搜索树",
  "symmetric-tree": "101. 对称二叉树",
  "binary-tree-level-order-traversal": "102. 二叉树的层序遍历",
  "maximum-depth-of-binary-tree": "104. 二叉树的最大深度",
  "construct-binary-tree-from-preorder-and-inorder-traversal": "105. 从前序与中序遍历序列构造二叉树",
  "flatten-binary-tree-to-linked-list": "114. 二叉树展开为链表",
  "pascals-triangle": "118. 杨辉三角",
  "best-time-to-buy-and-sell-stock": "121. 买卖股票的最佳时机",
  "binary-tree-maximum-path-sum": "124. 二叉树中的最大路径和",
  "longest-consecutive-sequence": "128. 最长连续序列",
  "palindrome-partitioning": "131. 分割回文串",
  "single-number": "136. 只出现一次的数字",
  "copy-list-with-random-pointer": "138. 复制带随机指针的链表",
  "word-break": "139. 单词拆分",
  "linked-list-cycle": "141. 环形链表",
  "linked-list-cycle-ii": "142. 环形链表 II",
  "lru-cache": "146. LRU 缓存",
  "sort-list": "148. 排序链表",
  "maximum-product-subarray": "152. 乘积最大子数组",
  "find-minimum-in-rotated-sorted-array": "153. 寻找旋转排序数组中的最小值",
  "min-stack": "155. 最小栈",
  "intersection-of-two-linked-lists": "160. 相交链表",
  "majority-element": "169. 多数元素",
  "rotate-array": "189. 轮转数组",
  "house-robber": "198. 打家劫舍",
  "number-of-islands": "200. 岛屿数量",
  "reverse-linked-list": "206. 反转链表",
  "course-schedule": "207. 课程表",
  "implement-trie-prefix-tree": "208. 实现 Trie (前缀树)",
  "kth-largest-element-in-an-array": "215. 数组中的第K个最大元素",
  "diameter-of-binary-tree": "543. 二叉树的直径",
  "rotting-oranges": "994. 腐烂的橘子",
  "daily-temperatures": "739. 每日温度",
  "move-zeroes": "283. 移动零",
  "product-of-array-except-self": "238. 除自身以外数组的乘积",
  "sliding-window-maximum": "239. 滑动窗口最大值",
  "search-a-2d-matrix-ii": "240. 搜索二维矩阵 II",
  "perfect-squares": "279. 完全平方数",
  "coin-change": "322. 零钱兑换",
  "longest-increasing-subsequence": "300. 最长递增子序列",
  "partition-equal-subset-sum": "416. 分割等和子集",
  "longest-common-subsequence": "1143. 最长公共子序列",
  "path-sum-iii": "437. 路径总和 III",
  "decode-string": "394. 字符串解码",
  "find-all-anagrams-in-a-string": "438. 找到字符串中所有字母异位词",
  "partition-labels": "763. 划分字母区间",
  "top-k-frequent-elements": "347. 前 K 个高频元素",
  "find-median-from-data-stream": "295. 数据流的中位数",
  "serialize-and-deserialize-binary-tree": "297. 二叉树的序列化与反序列化",
  "maximal-square": "221. 最大正方形"
  // 注意：列表可能有 1-5 道浮动，根据 LeetCode 实时 likes 排序调整。
  // 如果需要添加/修正某道题的序号或中文标题，直接告诉我。
};

// ------------------ PostgreSQL 连接 ------------------
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// ------------------ 数据存储 ------------------
const problemCounts = new Map();           // slug → 当前在线人数
const clients = new Set();                 // 所有连接的 WebSocket 客户端


// ------------------ 保存当前快照到数据库 ------------------
async function saveSnapshot() {
  if (problemCounts.size === 0) return;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const now = new Date();
    const placeholders = Array.from({ length: problemCounts.size }, (_, i) => `($${i*3+1}, $${i*3+2}, $${i*3+3})`).join(', ');
    const values = [];

    let idx = 1;
    for (const [slug, count] of problemCounts) {
      values.push(now, slug, count);
      idx += 3;
    }

    await client.query(`
      INSERT INTO hot100_online (time, slug, online_count)
      VALUES ${placeholders}
      ON CONFLICT DO NOTHING
    `, values);

    await client.query('COMMIT');
    console.log(`[${new Date().toISOString()}] 保存 ${problemCounts.size} 条数据`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('保存失败:', err.message);
  } finally {
    client.release();
  }
}

// ------------------ LeetCode WebSocket 采集 ------------------
const leetCodeWss = new Map(); // slug → ws 实例

function connectToLeetCode(slug) {
  if (leetCodeWss.has(slug)) return;

  const url = `wss://collaboration-ws.leetcode.com/problems/${slug}`;
  const ws = new WebSocket(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
      'Origin': 'https://leetcode.com'
    },
    rejectUnauthorized: false
  });

  ws.on('open', () => {
    console.log(`LeetCode WS 连接成功: ${slug}`);
  });

  ws.on('message', (data) => {
    const msg = data.toString().trim();
    const count = parseInt(msg, 10);
    if (!isNaN(count)) {
      problemCounts.set(slug, count);
      // 可以在这里立即保存，或等整轮采集完再批量保存
    } else {
      console.log(`[${slug}] 非数字消息: ${msg}`);
    }
  });

  ws.on('close', (code, reason) => {
    console.log(`[${slug}] 关闭: code=${code}, reason=${reason?.toString() || '无'}`);
    leetCodeWss.delete(slug);
    setTimeout(() => connectToLeetCode(slug), 10000);
  });

  ws.on('error', (err) => {
    console.error(`[${slug}] 错误:`, err.message);
    ws.close();
  });

  leetCodeWss.set(slug, ws);
}

// 启动所有题目连接
hot100Slugs.forEach(slug => connectToLeetCode(slug));

// ------------------ 定时广播最新数据给客户端 ------------------
setInterval(async () => {
  // 采集已通过 WS 实时更新 problemCounts
  // 这里每 30 秒聚合一次并推送
  await saveSnapshot();  // 保存当前快照

  const problems = hot100Slugs.map(slug => ({
    slug,
    title: slugToTitle[slug] || slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    online: problemCounts.get(slug) || 0
  }));

  problems.sort((a, b) => b.online - a.online);

  const total = problems.reduce((sum, p) => sum + p.online, 0);

  const payload = {
    type: 'update',
    data: {
      problems,
      total
    }
  };

  const message = JSON.stringify(payload);

  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }

  console.log(`广播更新 - 总在线: ${total}, 题目数: ${problems.length}`);
}, 30000);  // 每 30 秒推送一次（可调为 60000 = 1分钟）

// ------------------ WebSocket 客户端连接处理 ------------------
wss.on('connection', (ws) => {
  console.log('前端客户端连接');
  clients.add(ws);

  // 立即发送当前最新快照
  const problems = hot100Slugs.map(slug => ({
    slug,
    title: slugToTitle[slug] || slug,
    online: problemCounts.get(slug) || 0
  }));

  problems.sort((a, b) => b.online - a.online);
  const total = problems.reduce((sum, p) => sum + p.online, 0);

  ws.send(JSON.stringify({
    type: 'init',
    data: { problems, total }
  }));

  ws.on('message', async (message) => {
    try {
      const msg = JSON.parse(message.toString());

      if (msg.type === 'get_history' && msg.slug) {
        const result = await pool.query(`
          SELECT time, online_count
          FROM hot100_online
          WHERE slug = $1
          AND time > NOW() - INTERVAL '7 days'
          ORDER BY time ASC
          LIMIT 500
        `, [msg.slug]);

        ws.send(JSON.stringify({
          type: 'history',
          slug: msg.slug,
          points: result.rows.map(r => ({
            time: r.time.toISOString(),
            count: r.online_count
          }))
        }));
      }
    } catch (err) {
      console.error('处理客户端消息失败:', err.message);
    }
  });

  ws.on('close', () => {
    console.log('前端客户端断开');
    clients.delete(ws);
  });
});

// ------------------ HTTP 健康检查（Railway 需要） ------------------
app.get('/health', (req, res) => {
  res.send('OK');
});

// 启动服务器
server.listen(PORT, () => {
  console.log(`服务器启动在端口 ${PORT}`);
  console.log(`WebSocket 地址: wss://${process.env.RAILWAY_PUBLIC_DOMAIN || 'localhost:' + PORT}`);
});