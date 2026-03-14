// railway-hot100-collector.js
import WebSocket from 'ws';
import fetch from 'node-fetch';

// -------------------- 配置 --------------------
const HOT100_SLUGS = [
  // 哈希
  "two-sum",
  "group-anagrams",
  "longest-consecutive-sequence",
  // 双指针
  "move-zeroes",
  "container-with-most-water",
  "3sum",
  "trapping-rain-water",
  // 滑动窗口
  "longest-substring-without-repeating-characters",
  "find-all-anagrams-in-a-string",
  // 子串
  "subarray-sum-equals-k",
  "sliding-window-maximum",
  "minimum-window-substring",
  // 普通数组
  "maximum-subarray",
  "merge-intervals",
  "rotate-array",
  "product-of-array-except-self",
  "first-missing-positive",
  // 矩阵
  "set-matrix-zeroes",
  "spiral-matrix",
  "rotate-image",
  "search-a-2d-matrix-ii",
  // 链表
  "intersection-of-two-linked-lists",
  "reverse-linked-list",
  "palindrome-linked-list",
  "linked-list-cycle",
  "linked-list-cycle-ii",
  "merge-two-sorted-lists",
  "add-two-numbers",
  "remove-nth-node-from-end-of-list",
  "swap-nodes-in-pairs",
  "reverse-nodes-in-k-group",
  "copy-list-with-random-pointer",
  "sort-list",
  "merge-k-sorted-lists",
  "lru-cache",
  // 二叉树
  "binary-tree-inorder-traversal",
  "maximum-depth-of-binary-tree",
  "invert-binary-tree",
  "symmetric-tree",
  "diameter-of-binary-tree",
  "binary-tree-level-order-traversal",
  "convert-sorted-array-to-binary-search-tree",
  "validate-binary-search-tree",
  "kth-smallest-element-in-a-bst",
  "binary-tree-right-side-view",
  "flatten-binary-tree-to-linked-list",
  "construct-binary-tree-from-preorder-and-inorder-traversal",
  "path-sum-iii",
  "lowest-common-ancestor-of-a-binary-tree",
  "binary-tree-maximum-path-sum",
  // 图论
  "number-of-islands",
  "rotting-oranges",
  "course-schedule",
  "implement-trie-prefix-tree",
  // 回溯
  "permutations",
  "subsets",
  "letter-combinations-of-a-phone-number",
  "combination-sum",
  "generate-parentheses",
  "word-search",
  "palindrome-partitioning",
  "n-queens",
  // 二分查找
  "search-insert-position",
  "search-a-2d-matrix",
  "find-first-and-last-position-of-element-in-sorted-array",
  "search-in-rotated-sorted-array",
  "find-minimum-in-rotated-sorted-array",
  "median-of-two-sorted-arrays",
  // 栈
  "valid-parentheses",
  "min-stack",
  "decode-string",
  "daily-temperatures",
  "largest-rectangle-in-histogram",
  // 堆
  "kth-largest-element-in-an-array",
  "top-k-frequent-elements",
  "find-median-from-data-stream",
  // 贪心
  "best-time-to-buy-and-sell-stock",
  "jump-game",
  "jump-game-ii",
  "partition-labels",
  // 动态规划
  "climbing-stairs",
  "pascals-triangle",
  "house-robber",
  "perfect-squares",
  "coin-change",
  "word-break",
  "longest-increasing-subsequence",
  "maximum-product-subarray",
  "partition-equal-subset-sum",
  "longest-valid-parentheses",
  // 多维动态规划
  "unique-paths",
  "minimum-path-sum",
  "longest-palindromic-substring",
  "longest-common-subsequence",
  "edit-distance",
  // 技巧
  "single-number",
  "majority-element",
  "sort-colors",
  "next-permutation",
  "find-the-duplicate-number",
];

const WORKER_PUSH_URL = process.env.WORKER_PUSH_URL;

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
}, 120000); // 每120秒推送一次

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