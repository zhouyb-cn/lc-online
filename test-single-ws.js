// test-single-ws.js
const WebSocket = require('ws');

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

const slug = 'two-sum';  // 先测试经典的 “两数之和”
const url = `wss://collaboration-ws.leetcode.cn/problems/${slug}`;

console.log(`尝试连接: ${url}`);

const ws = new WebSocket(url, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
    'Origin': 'https://leetcode.com',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept-Language': 'en-US,en;q=0.9',
    // 如果你有 cf_clearance，可以加 Cookie: 'cf_clearance=你的值; ...'
    // 但 cf_clearance 有效期短，通常几小时到几天，需要动态获取
  },
  rejectUnauthorized: false  // 先忽略证书问题（生产环境不要这样）
});

ws.on('open', () => {
  console.log(`已连接到 ${slug}`);
});

ws.on('message', (data) => {
  const msg = data.toString().trim();
  console.log(`收到消息: "${msg}"`);

  // 尝试解析为数字
  const count = parseInt(msg, 10);
  if (!isNaN(count)) {
    console.log(`当前在线人数: ${count}`);
  } else {
    console.log(`非数字消息: ${msg}`);
  }
});

ws.on('close', (code, reason) => {
  console.log(`连接关闭 - code: ${code}, reason: ${reason?.toString() || '无'}`);
  process.exit(1);  // 测试时直接退出
});

ws.on('error', (err) => {
  console.error('连接错误:', err.message);
  process.exit(1);
});

// 保持运行（测试用）
setTimeout(() => {
  console.log('测试超时，结束');
  ws.close();
  process.exit(0);
}, 60000);  // 跑 1 分钟后自动结束