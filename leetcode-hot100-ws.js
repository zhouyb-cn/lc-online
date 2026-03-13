// railway-hot100-collector.js
import WebSocket from 'ws';
import fetch from 'node-fetch';

// -------------------- 配置 --------------------
const HOT100_SLUGS = [
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

const WORKER_PUSH_URL = process.env.WORKER_PUSH_URL || 'https://hot100-worker.zhouyb-cn.workers.dev/push';

// -------------------- 内存 Map --------------------
const problemCounts = new Map();
const leetCodeWSMap = new Map();

// -------------------- 连接 LeetCode WS --------------------
function connectLeetCode(slug) {
    if (leetCodeWSMap.has(slug)) return;

    const url = `wss://collaboration-ws.leetcode.cn/problems/${slug}`;
    const ws = new WebSocket(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
          'Origin': 'https://leetcode.com'
        },
        rejectUnauthorized: false
    });

    ws.on('open', () => {
        console.log(`[${slug}] WS connected`);
    });

    ws.on('message', (data) => {
        const count = parseInt(data.toString(), 10);
        if (!isNaN(count)) {
            problemCounts.set(slug, count);
        }
    });

    ws.on('close', (code, reason) => {
        console.log(`[${slug}] closed: code=${code} reason=${reason?.toString() || 'none'}`);
        leetCodeWSMap.delete(slug);
        setTimeout(() => connectLeetCode(slug), 10000);
    });

    ws.on('error', (err) => {
        console.error(`[${slug}] WS error:`, err.message);
        ws.close();
    });

    leetCodeWSMap.set(slug, ws);
}

// 启动所有题目的 WS
HOT100_SLUGS.forEach(connectLeetCode);

// -------------------- 批量推送 Worker --------------------
setInterval(async () => {
    if (problemCounts.size === 0) return;

    const timestamp = Date.now();
    const batch = Array.from(problemCounts.entries()).map(([slug, online]) => ({ slug, online }));

    try {
        const res = await fetch(WORKER_PUSH_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'batch_push', timestamp, data: batch })
        });

        if (!res.ok) {
            console.error(`Batch push failed: ${res.status} ${res.statusText}`);
        } else {
            console.log(`[${new Date().toISOString()}] Batch push ${batch.length} problems`);
        }
    } catch (err) {
        console.error('Batch push error:', err);
    }
}, 30000); // 每30秒推送一次

// -------------------- 优雅退出 --------------------
process.on('SIGINT', () => {
    console.log('Graceful shutdown...');
    leetCodeWSMap.forEach(ws => ws.close());
    process.exit();
});
process.on('SIGTERM', () => {
    console.log('Graceful shutdown...');
    leetCodeWSMap.forEach(ws => ws.close());
    process.exit();
});