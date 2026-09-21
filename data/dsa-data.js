/* DSA Patterns + Striver SDE Sheet coverage
   Node shapes:
     group -> { n, h?, c: [ ...children ] }         // h = hint shown at top of the group
     leaf  -> { n, h?, note?, code?, p?: [ [num,"slug","Title","E|M|H"], ... ] }
   Language for building blocks: Python.
*/
const DSA = [

  /* ===================== FUNDAMENTALS ===================== */
  { n: "Fundamentals (Python) — Start Here", h: "Master these building blocks first; every pattern below reuses them.", c: [
    { n: "Big-O Complexity", note: "Judge an algorithm by how it <b>scales</b>, not raw speed. Aim: reduce a brute-force <code>O(n²)</code> to <code>O(n log n)</code> or <code>O(n)</code>.<br><b>Common orders:</b> O(1) &lt; O(log n) &lt; O(n) &lt; O(n log n) &lt; O(n²) &lt; O(2ⁿ) &lt; O(n!).<br><b>Space</b> counts recursion stack + extra structures." },
    { n: "Arrays & Lists", note: "Python <code>list</code> = dynamic array. Index/append are O(1); insert/pop at front are O(n).", code:
`nums = [3, 1, 2]
nums.append(4)          # O(1) add at end
nums.sort()             # O(n log n) in-place
nums.sort(key=lambda x: -x)   # custom / reverse
last = nums[-1]         # negative indexing
sub = nums[1:3]         # slicing [start:end)
for i, v in enumerate(nums):   # index + value
    ...` },
    { n: "Strings", note: "Strings are <b>immutable</b> — building with <code>+=</code> in a loop is O(n²). Collect into a list and <code>\"\".join(...)</code>.", code:
`s = "leetcode"
s[::-1]                 # reverse -> "edocteel"
"".join(sorted(s))      # anagram key
ord('a'), chr(97)       # char <-> int
from collections import Counter
Counter(s)              # {char: freq}` },
    { n: "Hashing — dict & set", h: "When you see \"find/seen before\", \"count\", or \"pair sums to target\" → reach for a hash map/set for O(1) lookup.", code:
`from collections import defaultdict, Counter
freq = Counter(nums)          # frequency map
seen = set()                  # O(1) membership
graph = defaultdict(list)     # adjacency list
graph[u].append(v)` },
    { n: "Stack & Queue", note: "Use a <code>list</code> as a stack (append/pop). Use <code>collections.deque</code> for a queue/deque (O(1) both ends).", code:
`stack = []; stack.append(x); stack.pop()
from collections import deque
q = deque(); q.append(x); q.popleft()   # BFS queue
q.appendleft(x); q.pop()                # deque both ends` },
    { n: "Heap (Priority Queue)", h: "Python <code>heapq</code> is a <b>min-heap</b>. For a max-heap, push negatives. \"Top-K / Kth / smallest-largest so far\" → heap.", code:
`import heapq
h = []
heapq.heappush(h, 5)
smallest = heapq.heappop(h)      # min-heap
heapq.heappush(h, -x)            # max-heap trick
heapq.nlargest(k, nums)` },
    { n: "Recursion Basics", h: "Every recursion needs (1) a <b>base case</b> and (2) a call that moves toward it. Think: what does f(n) return given f(n-1)?", code:
`def fact(n):
    if n <= 1:            # base case
        return 1
    return n * fact(n-1)  # recursive step

# recursion depth default ~1000
import sys; sys.setrecursionlimit(10**6)` },
    { n: "Sorting & Binary Search built-ins", note: "Know the library before hand-rolling sorts.", code:
`nums.sort()                       # Timsort O(n log n)
sorted(pairs, key=lambda p: (p[0], -p[1]))
import bisect
i = bisect.bisect_left(nums, x)   # first index >= x
bisect.insort(nums, x)            # insert keeping sorted` },
  ]},

  /* ===================== ARRAYS (Striver Arrays I–IV) ===================== */
  { n: "Array", h: "The workhorse topic. Prefer O(1) extra space: two-pointers, prefix sums, and in-place tricks over hash maps when possible.", c: [
    { n: "Easy / Classics (Striver)", h: "Warm-ups — get comfortable with in-place scans and single passes.", c: [
      { n: "Fundamental array ops", h: "Do these in ONE pass. Watch edge cases: empty array, all same, single element.", p: [
        [485, "max-consecutive-ones", "Max Consecutive Ones", "E"],
        [26, "remove-duplicates-from-sorted-array", "Remove Duplicates (Sorted)", "E"],
        [189, "rotate-array", "Rotate Array", "M"],
        [128, "longest-consecutive-sequence", "Longest Consecutive Sequence", "M"],
      ]},
      { n: "Buy/Sell & Pascal", h: "Best Time to Buy/Sell: track min-so-far. Pascal: each cell = sum of two above.", p: [
        [121, "best-time-to-buy-and-sell-stock", "Best Time to Buy and Sell Stock", "E"],
        [118, "pascals-triangle", "Pascal's Triangle", "E"],
        [122, "best-time-to-buy-and-sell-stock-ii", "Buy and Sell Stock II", "M"],
      ]},
    ]},
    { n: "Two Pointer", h: "Sort first if order doesn't matter, then move pointers inward/forward. Great for pair/triplet sums and partitioning.", c: [
      { n: "Opposite ends (left + right)", h: "Move the pointer that can improve the answer; skip duplicates for k-sum problems.", p: [
        [167, "two-sum-ii-input-array-is-sorted", "Two Sum II", "M"],
        [15, "3sum", "3Sum", "M"],
        [42, "trapping-rain-water", "Trapping Rain Water", "H"],
      ]},
      { n: "Same direction (fast & slow)", h: "Slow pointer = write position, fast = read position. Overwrite in place.", p: [
        [283, "move-zeroes", "Move Zeroes", "E"],
        [80, "remove-duplicates-from-sorted-array-ii", "Remove Duplicates II", "M"],
        [41, "first-missing-positive", "First Missing Positive", "H"],
      ]},
      { n: "Partition / Dutch National Flag", h: "3-way partition with low/mid/high pointers in a single pass (Sort Colors).", p: [
        [905, "sort-array-by-parity", "Sort Array By Parity", "E"],
        [75, "sort-colors", "Sort Colors", "M"],
        [324, "wiggle-sort-ii", "Wiggle Sort II", "M"],
      ]},
    ]},
    { n: "Sliding Window", h: "Grow the window with right; shrink from left when a constraint breaks. Track window state (sum/count/freq).", c: [
      { n: "Fixed Size", h: "Slide a window of size k: add nums[r], remove nums[r-k].", p: [
        [643, "maximum-average-subarray-i", "Maximum Average Subarray I", "E"],
        [1343, "number-of-sub-arrays-of-size-k-and-average-greater-than-or-equal-to-threshold", "Subarrays Size K ≥ Threshold", "M"],
        [239, "sliding-window-maximum", "Sliding Window Maximum", "H"],
      ]},
      { n: "Variable Size (expand–shrink)", h: "While window invalid, shrink from left; record best when valid.", p: [
        [3, "longest-substring-without-repeating-characters", "Longest Substring w/o Repeat", "M"],
        [209, "minimum-size-subarray-sum", "Minimum Size Subarray Sum", "M"],
        [76, "minimum-window-substring", "Minimum Window Substring", "H"],
      ]},
    ]},
    { n: "Prefix Sum / XOR", h: "Precompute running totals so any range = pre[r] - pre[l-1]. Store prefix in a hash map to count subarrays.", c: [
      { n: "Prefix Sum", h: "Count subarrays with sum k: store freq of prefix sums; answer += seen[pre - k]. Largest subarray with sum 0 → store first index of each prefix.", p: [
        [724, "find-pivot-index", "Find Pivot Index", "E"],
        [560, "subarray-sum-equals-k", "Subarray Sum Equals K", "M"],
        [525, "contiguous-array", "Contiguous Array (equal 0s/1s)", "M"],
        [974, "subarray-sums-divisible-by-k", "Subarray Sums Divisible by K", "M"],
      ]},
      { n: "Prefix XOR / 2D Prefix", h: "XOR prefix for subarray-XOR; 2D prefix for O(1) submatrix sums.", p: [
        [1310, "xor-queries-of-a-subarray", "XOR Queries of a Subarray", "M"],
        [304, "range-sum-query-2d-immutable", "Range Sum Query 2D", "M"],
        [1314, "matrix-block-sum", "Matrix Block Sum", "M"],
      ]},
    ]},
    { n: "Kadane's / Max Subarray", h: "Running sum; reset to 0 (or current) when it turns negative. Track best seen.", p: [
      [53, "maximum-subarray", "Maximum Subarray", "M"],
      [918, "maximum-sum-circular-subarray", "Max Sum Circular Subarray", "M"],
      [152, "maximum-product-subarray", "Maximum Product Subarray", "M"],
    ]},
    { n: "Matrix Operations (Striver)", h: "Rotate = transpose then reverse rows. Spiral = 4 boundary pointers. Set zeroes = use first row/col as markers.", p: [
      [73, "set-matrix-zeroes", "Set Matrix Zeroes", "M"],
      [48, "rotate-image", "Rotate Image", "M"],
      [54, "spiral-matrix", "Spiral Matrix", "M"],
    ]},
    { n: "Rearrangement & Counting (Striver)", h: "Next Permutation: find first decreasing from right, swap with next larger, reverse suffix. Majority: Boyer–Moore voting.", p: [
      [169, "majority-element", "Majority Element (n/2)", "E"],
      [31, "next-permutation", "Next Permutation", "M"],
      [229, "majority-element-ii", "Majority Element II (n/3)", "M"],
    ]},
    { n: "Duplicates & Missing (Striver)", h: "Use index-as-hash or math (sum/XOR). Find Duplicate = Floyd's cycle on values.", p: [
      [268, "missing-number", "Missing Number", "E"],
      [287, "find-the-duplicate-number", "Find the Duplicate Number", "M"],
      [645, "set-mismatch", "Set Mismatch", "E"],
    ]},
    { n: "Merge & Intervals (Striver)", h: "Sort by start, then merge overlapping. Merge Sorted Array: fill from the back.", p: [
      [88, "merge-sorted-array", "Merge Sorted Array", "E"],
      [56, "merge-intervals", "Merge Intervals", "M"],
      [493, "reverse-pairs", "Reverse Pairs (inversions)", "H"],
    ]},
  ]},

  /* ===================== BINARY SEARCH (Striver) ===================== */
  { n: "Binary Search", h: "Whenever the search space is sorted OR the answer is monotonic (feasible then infeasible), binary search it. Template: while lo<=hi, mid=(lo+hi)//2.", c: [
    { n: "On array / index", h: "Careful with lo/hi bounds and mid comparison. For rotated arrays, one half is always sorted.", p: [
      [35, "search-insert-position", "Search Insert Position", "E"],
      [33, "search-in-rotated-sorted-array", "Search in Rotated Sorted Array", "M"],
      [34, "find-first-and-last-position-of-element-in-sorted-array", "First and Last Position", "M"],
    ]},
    { n: "On answer (min/max feasible)", h: "Guess an answer X; write a monotone feasible(X) check; binary search the smallest/largest valid X.",       note: "Same technique on classic Striver problems (GeeksforGeeks links below).", p: [
      [69, "sqrtx", "Sqrt(x)", "E"],
      [875, "koko-eating-bananas", "Koko Eating Bananas", "M"],
      [410, "split-array-largest-sum", "Split Array Largest Sum (Book Allocation)", "H"],
      ["GFG", "https://www.geeksforgeeks.org/problems/aggressive-cows/1", "Aggressive Cows", "M"],
      ["GFG", "https://www.geeksforgeeks.org/problems/allocate-minimum-number-of-pages0937/1", "Allocate Minimum Pages", "H"],
      ["GFG", "https://www.geeksforgeeks.org/problems/find-nth-root-of-m5843/1", "Nth Root of a Number", "E"],
      ["GFG", "https://www.geeksforgeeks.org/problems/k-th-element-of-two-sorted-array1317/1", "Kth Element of Two Sorted Arrays", "M"],
    ]},
    { n: "Peaks, matrix & special", h: "Find Peak: compare mid with mid+1. 2D matrix: treat as flattened sorted array or step-search.", p: [
      [162, "find-peak-element", "Find Peak Element", "M"],
      [74, "search-a-2d-matrix", "Search a 2D Matrix", "M"],
      [4, "median-of-two-sorted-arrays", "Median of Two Sorted Arrays", "H"],
    ]},
    { n: "Math via binary search", h: "Pow(x,n) = fast exponentiation (halve the power each step).", p: [
      [50, "powx-n", "Pow(x, n)", "M"],
      [540, "single-element-in-a-sorted-array", "Single Element in Sorted Array", "M"],
      [1011, "capacity-to-ship-packages-within-d-days", "Capacity To Ship Packages", "M"],
    ]},
  ]},

  /* ===================== STRING (Striver String I–II) ===================== */
  { n: "String", h: "Immutable in Python — build with lists. Frequency counting + two pointers solve most. Learn KMP/rolling-hash for matching.", c: [
    { n: "Two Pointers", h: "Palindrome: compare ends moving inward. Reverse words: split/strip/join or in-place reverse.", p: [
      [125, "valid-palindrome", "Valid Palindrome", "E"],
      [151, "reverse-words-in-a-string", "Reverse Words in a String", "M"],
      [5, "longest-palindromic-substring", "Longest Palindromic Substring", "M"],
    ]},
    { n: "Anagrams & Frequency", h: "Anagram signature = sorted string or 26-length count array. Group by that key.", p: [
      [242, "valid-anagram", "Valid Anagram", "E"],
      [49, "group-anagrams", "Group Anagrams", "M"],
      [438, "find-all-anagrams-in-a-string", "Find All Anagrams", "M"],
    ]},
    { n: "Pattern Matching (KMP / Rolling Hash)", h: "KMP: precompute LPS (longest prefix-suffix) to avoid re-checking. Rabin-Karp: rolling hash windows.", p: [
      [28, "find-the-index-of-the-first-occurrence-in-a-string", "Find First Occurrence (strStr)", "E"],
      [459, "repeated-substring-pattern", "Repeated Substring Pattern", "E"],
      [214, "shortest-palindrome", "Shortest Palindrome", "H"],
    ]},
    { n: "Compression & Misc (Striver)", h: "Roman numerals, atoi, count-and-say, version compare — careful, methodical parsing & edge cases.", p: [
      [13, "roman-to-integer", "Roman to Integer", "E"],
      [14, "longest-common-prefix", "Longest Common Prefix", "E"],
      [38, "count-and-say", "Count and Say", "M"],
      [443, "string-compression", "String Compression", "M"],
      [8, "string-to-integer-atoi", "String to Integer (atoi)", "M"],
      [165, "compare-version-numbers", "Compare Version Numbers", "M"],
      [1531, "string-compression-ii", "String Compression II", "H"],
    ]},
  ]},

  /* ===================== HASHING ===================== */
  { n: "Hashing / Hash Map", h: "Trade space for O(1) lookups. Keys: values, prefix sums, sorted-tuples, or (row,col). Use Counter/defaultdict/set.", c: [
    { n: "Lookup & Two Sum family", h: "Store complement while scanning: if target-x seen, done in one pass. For 3Sum/4Sum, sort + fix pointers.", p: [
      [1, "two-sum", "Two Sum", "E"],
      [454, "4sum-ii", "4Sum II", "M"],
      [18, "4sum", "4Sum", "M"],
      [128, "longest-consecutive-sequence", "Longest Consecutive Sequence", "M"],
    ]},
    { n: "Frequency & Grouping", h: "Counter for frequencies; group items under a computed key.", p: [
      [387, "first-unique-character-in-a-string", "First Unique Character", "E"],
      [347, "top-k-frequent-elements", "Top K Frequent Elements", "M"],
      [49, "group-anagrams", "Group Anagrams", "M"],
    ]},
    { n: "Index / Set tricks", h: "Use a set for O(1) membership; use array indices as a hash for 1..n values.", p: [
      [217, "contains-duplicate", "Contains Duplicate", "E"],
      [41, "first-missing-positive", "First Missing Positive", "H"],
      [448, "find-all-numbers-disappeared-in-an-array", "Find All Disappeared Numbers", "E"],
    ]},
  ]},

  /* ===================== STACK & QUEUE (Striver I–II) ===================== */
  { n: "Stack & Queue", h: "Stack = LIFO (matching, undo, monotonic). Queue/Deque = FIFO / sliding-window extremes.", c: [
    { n: "Monotonic Stack", h: "Keep stack increasing/decreasing; pop while the new element breaks the order — that pop resolves an answer (next greater/smaller, spans).", c: [
      { n: "Next Greater / Smaller", h: "Iterate; while stack top < current, top's answer = current. Use %len for circular.", p: [
        [496, "next-greater-element-i", "Next Greater Element I", "E"],
        [503, "next-greater-element-ii", "Next Greater Element II", "M"],
        [739, "daily-temperatures", "Daily Temperatures", "M"],
      ]},
      { n: "Histogram / Spans", h: "For each bar, find nearest smaller on both sides → width. Area = height × width.", p: [
        [901, "online-stock-span", "Online Stock Span", "M"],
        [84, "largest-rectangle-in-histogram", "Largest Rectangle in Histogram", "H"],
        [85, "maximal-rectangle", "Maximal Rectangle", "H"],
      ]},
    ]},
    { n: "Design (Min/Max stack, queues, cache)", h: "Min Stack: push (val, curMin) pairs. Queue via 2 stacks: amortized O(1). LRU = hashmap + doubly-linked list; LFU adds freq buckets.", p: [
      [155, "min-stack", "Min Stack", "M"],
      [232, "implement-queue-using-stacks", "Queue using Stacks", "E"],
      [225, "implement-stack-using-queues", "Stack using Queues", "E"],
      [146, "lru-cache", "LRU Cache", "M"],
      [460, "lfu-cache", "LFU Cache", "H"],
      [716, "max-stack", "Max Stack", "H"],
    ]},
    { n: "Expression Handling", h: "Parentheses matching with a stack; RPN evaluate; calculator uses sign/stack.", p: [
      [20, "valid-parentheses", "Valid Parentheses", "E"],
      [150, "evaluate-reverse-polish-notation", "Evaluate RPN", "M"],
      [224, "basic-calculator", "Basic Calculator", "H"],
    ]},
    { n: "Monotonic Deque (window extremes)", h: "Maintain a deque of useful indices; pop back while smaller, pop front when out of window.", p: [
      [239, "sliding-window-maximum", "Sliding Window Maximum", "H"],
      [862, "shortest-subarray-with-sum-at-least-k", "Shortest Subarray Sum ≥ K", "H"],
      [1696, "jump-game-vi", "Jump Game VI", "M"],
    ]},
  ]},

  /* ===================== LINKED LIST (Striver LL I–II + LL&Arrays) ===================== */
  { n: "Linked List", h: "Master: dummy head node, fast/slow pointers, and iterative reversal. Draw the pointers!", c: [
    { n: "Fast–Slow Pointers", h: "Slow +1, fast +2. Meeting → cycle; when fast hits end, slow = middle. Palindrome: find middle, reverse 2nd half, compare.", p: [
      [876, "middle-of-the-linked-list", "Middle of the Linked List", "E"],
      [141, "linked-list-cycle", "Linked List Cycle", "E"],
      [234, "palindrome-linked-list", "Palindrome Linked List", "E"],
      [142, "linked-list-cycle-ii", "Linked List Cycle II", "M"],
    ]},
    { n: "Reversal", h: "Iterative: prev, cur, nxt = cur.next; cur.next = prev; step. Use a dummy for k-group.", p: [
      [206, "reverse-linked-list", "Reverse Linked List", "E"],
      [92, "reverse-linked-list-ii", "Reverse Linked List II", "M"],
      [25, "reverse-nodes-in-k-group", "Reverse Nodes in k-Group", "H"],
    ]},
    { n: "Merge / Add / Reorder", h: "Always use a dummy node to simplify head handling.", p: [
      [21, "merge-two-sorted-lists", "Merge Two Sorted Lists", "E"],
      [2, "add-two-numbers", "Add Two Numbers", "M"],
      [23, "merge-k-sorted-lists", "Merge k Sorted Lists", "H"],
    ]},
    { n: "LL + Arrays / Misc (Striver)", h: "Intersection: two pointers switching heads. Copy random: interleave clones or hash map. Delete-given-node: copy next's value then skip it.", p: [
      [237, "delete-node-in-a-linked-list", "Delete Node in a Linked List", "M"],
      [160, "intersection-of-two-linked-lists", "Intersection of Two Lists", "E"],
      [19, "remove-nth-node-from-end-of-list", "Remove Nth Node From End", "M"],
      [61, "rotate-list", "Rotate List", "M"],
      [138, "copy-list-with-random-pointer", "Copy List with Random Pointer", "M"],
    ]},
  ]},

  /* ===================== BINARY TREE (Striver BT I–III) ===================== */
  { n: "Binary Tree", h: "Everything is recursion: solve for children, combine for the node. Know all 3 DFS orders + BFS by heart.", c: [
    { n: "Build & Represent (from a list)", h: "LeetCode gives trees as a <b>level-order list</b> with <code>null</code> for missing nodes. Build it with a queue. In an <b>array (complete-tree) representation</b>, node at index <code>i</code> has children <code>2i+1</code>, <code>2i+2</code> and parent <code>(i-1)//2</code>.",
      code:
`class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val; self.left = left; self.right = right

# Build a tree from a level-order list  ([1,2,3,None,4] etc.)
from collections import deque
def build_tree(vals):
    if not vals or vals[0] is None:
        return None
    root = TreeNode(vals[0]); q = deque([root]); i = 1
    while q and i < len(vals):
        node = q.popleft()
        if i < len(vals) and vals[i] is not None:      # left child
            node.left = TreeNode(vals[i]); q.append(node.left)
        i += 1
        if i < len(vals) and vals[i] is not None:      # right child
            node.right = TreeNode(vals[i]); q.append(node.right)
        i += 1
    return root

# Array representation of a COMPLETE tree (like a heap):
#   arr[i]        -> the node itself  (direct O(1) access)
#   left  child   -> arr[2*i + 1]
#   right child   -> arr[2*i + 2]
#   parent        -> arr[(i - 1) // 2]
def left(i):  return 2*i + 1
def right(i): return 2*i + 2
def parent(i): return (i - 1) // 2` },
    { n: "Traversals", h: "Pre=Node,L,R · In=L,Node,R · Post=L,R,Node. Do recursive first, then iterative with a stack.", p: [
      [94, "binary-tree-inorder-traversal", "Inorder Traversal", "E"],
      [144, "binary-tree-preorder-traversal", "Preorder Traversal", "E"],
      [145, "binary-tree-postorder-traversal", "Postorder Traversal", "E"],
    ]},
    { n: "Morris, Views & Boundary (Striver)", h: "<b>Morris</b> traversal gives O(1) space using temporary <i>threads</i> (link each node's inorder-predecessor.right back to it). <b>Two types:</b> (1) <b>Inorder</b> — visit when you <i>remove</i> the thread; (2) <b>Preorder</b> — visit when you <i>create</i> the thread. <b>Views</b> (top/bottom) sort by horizontal distance via BFS; <b>Vertical order</b> sorts by (column, row, value). Top/Bottom View &amp; Boundary have no free LeetCode problem — practice on GFG; Vertical Order is LC 987.",
      code:
`# ---- Morris has TWO types: Inorder & Preorder (both O(1) space) ----

# Type 1: Morris INORDER  (L, Node, R) -> visit when REMOVING the thread
def morris_inorder(root):
    out, cur = [], root
    while cur:
        if not cur.left:
            out.append(cur.val); cur = cur.right
        else:
            pre = cur.left
            while pre.right and pre.right is not cur: pre = pre.right
            if not pre.right:
                pre.right = cur; cur = cur.left        # create thread, go left
            else:
                pre.right = None                       # remove thread
                out.append(cur.val); cur = cur.right   # visit here (inorder)
    return out

# Type 2: Morris PREORDER (Node, L, R) -> visit when CREATING the thread
def morris_preorder(root):
    out, cur = [], root
    while cur:
        if not cur.left:
            out.append(cur.val); cur = cur.right
        else:
            pre = cur.left
            while pre.right and pre.right is not cur: pre = pre.right
            if not pre.right:
                out.append(cur.val)                    # visit here (preorder)
                pre.right = cur; cur = cur.left
            else:
                pre.right = None; cur = cur.right
    return out

from collections import deque, defaultdict
# Top View: first node seen per column (BFS, left->right)
def top_view(root):
    if not root: return []
    seen = {}; q = deque([(root, 0)])
    while q:
        node, hd = q.popleft()
        if hd not in seen: seen[hd] = node.val
        if node.left:  q.append((node.left,  hd-1))
        if node.right: q.append((node.right, hd+1))
    return [seen[k] for k in sorted(seen)]

# Bottom View: last node seen per column
def bottom_view(root):
    if not root: return []
    seen = {}; q = deque([(root, 0)])
    while q:
        node, hd = q.popleft()
        seen[hd] = node.val                           # overwrite -> keep last
        if node.left:  q.append((node.left,  hd-1))
        if node.right: q.append((node.right, hd+1))
    return [seen[k] for k in sorted(seen)]

# Vertical Order (LC 987): sort by (col, row, val)
def vertical_order(root):
    cols = defaultdict(list); q = deque([(root, 0, 0)])
    while q:
        node, r, c = q.popleft()
        if node:
            cols[c].append((r, node.val))
            q.append((node.left,  r+1, c-1))
            q.append((node.right, r+1, c+1))
    return [[v for _, v in sorted(cols[c])] for c in sorted(cols)]

# Boundary Traversal (anti-clockwise): left edge + leaves + right edge reversed
def boundary(root):
    if not root: return []
    leaf = lambda n: not n.left and not n.right
    res = [root.val]
    n = root.left                                     # left boundary (no leaves)
    while n:
        if not leaf(n): res.append(n.val)
        n = n.left or n.right
    def leaves(n):                                    # all leaves L->R
        if not n: return
        if leaf(n): res.append(n.val); return
        leaves(n.left); leaves(n.right)
    if not leaf(root): leaves(root.left); leaves(root.right)
    tmp = []; n = root.right                          # right boundary bottom-up
    while n:
        if not leaf(n): tmp.append(n.val)
        n = n.right or n.left
    return res + tmp[::-1]`,
      p: [
        [987, "vertical-order-traversal-of-a-binary-tree", "Vertical Order Traversal", "H"],
        [314, "binary-tree-vertical-order-traversal", "Vertical Order (basic)", "M"],
        ["GFG", "https://www.geeksforgeeks.org/problems/top-view-of-binary-tree/1", "Top View of Binary Tree", "M"],
        ["GFG", "https://www.geeksforgeeks.org/problems/bottom-view-of-binary-tree/1", "Bottom View of Binary Tree", "M"],
        ["GFG", "https://www.geeksforgeeks.org/problems/boundary-traversal-of-binary-tree/1", "Boundary Traversal", "M"],
      ]},
    { n: "BFS / Views", h: "Level order with a queue. Right/Left view = last/first node per level. Track level index.", p: [
      [102, "binary-tree-level-order-traversal", "Level Order Traversal", "M"],
      [199, "binary-tree-right-side-view", "Right Side View", "M"],
      [103, "binary-tree-zigzag-level-order-traversal", "Zigzag Level Order", "M"],
    ]},
    { n: "Properties (height/diameter/balanced)", h: "Compute height bottom-up; update a global answer (diameter/max-path) inside the recursion.", p: [
      [104, "maximum-depth-of-binary-tree", "Maximum Depth", "E"],
      [110, "balanced-binary-tree", "Balanced Binary Tree", "E"],
      [543, "diameter-of-binary-tree", "Diameter of Binary Tree", "E"],
    ]},
    { n: "Path Problems", h: "Return best downward path to parent, but update global with the through-node path (left+node+right).", p: [
      [112, "path-sum", "Path Sum", "E"],
      [236, "lowest-common-ancestor-of-a-binary-tree", "LCA of a Binary Tree", "M"],
      [124, "binary-tree-maximum-path-sum", "Binary Tree Max Path Sum", "H"],
    ]},
    { n: "Structure (symmetry / invert / connect)", h: "Compare two subtrees in tandem (mirror or identical). Populate next-right using the established next links level by level.", p: [
      [226, "invert-binary-tree", "Invert Binary Tree", "E"],
      [101, "symmetric-tree", "Symmetric Tree", "E"],
      [100, "same-tree", "Same Tree", "E"],
      [116, "populating-next-right-pointers-in-each-node", "Populate Next Right Pointers", "M"],
    ]},
    { n: "Construction & Serialize (Striver)", h: "Preorder gives the root; inorder splits left/right. Inorder+postorder: root is the last of postorder. Serialize with preorder + null markers.",
      note: "<b>Concept — Build Tree from Preorder + Inorder (LC 105):</b><br>" +
        "• <b>Preorder</b> visits <i>Root → Left → Right</i>, so <code>preorder[0]</code> is always the <b>root</b> of the current subtree.<br>" +
        "• <b>Inorder</b> visits <i>Left → Root → Right</i>. Find the root's position <code>i</code> in inorder: everything <b>left of i</b> is the <b>left subtree</b>, everything <b>right of i</b> is the <b>right subtree</b>.<br>" +
        "• That split count also tells you how to slice preorder (the next <code>i</code> values after the root belong to the left subtree). <b>Recurse</b> on both halves.<br>" +
        "• The simple version below slices lists and calls <code>index()</code> each time → clean but <b>O(n²)</b>. The optimized version precomputes a <code>value → inorder-index</code> map (O(1) lookup) and walks a single preorder pointer → <b>O(n)</b>.<br>" +
        "• <b>Inorder + Postorder (LC 106):</b> same idea but the root is <code>postorder[-1]</code>, and you must build the <b>right subtree before the left</b> (consume postorder from the back).",
      code:
`# --- Simple & intuitive (O(n^2): index() scan + slicing copies) ---
def buildTree(preorder, inorder):
    if not preorder or not inorder:
        return None
    root = TreeNode(preorder[0])              # 1st preorder value = root
    i = inorder.index(root.val)               # split point in inorder
    root.left  = buildTree(preorder[1:i+1], inorder[:i])   # left subtree
    root.right = buildTree(preorder[i+1:],  inorder[i+1:]) # right subtree
    return root

# --- Optimized O(n): hashmap for inorder index + a moving preorder pointer ---
def buildTree_fast(preorder, inorder):
    idx = {v: i for i, v in enumerate(inorder)}   # value -> position in inorder
    pre = 0
    def build(lo, hi):                            # inorder bounds [lo, hi]
        nonlocal pre
        if lo > hi:
            return None
        root = TreeNode(preorder[pre]); pre += 1  # next preorder value = root
        mid = idx[root.val]                       # its split point in inorder
        root.left  = build(lo, mid - 1)           # build LEFT first (preorder!)
        root.right = build(mid + 1, hi)
        return root
    return build(0, len(inorder) - 1)`,
      p: [
      [105, "construct-binary-tree-from-preorder-and-inorder-traversal", "Build Tree (Pre+In)", "M"],
      [106, "construct-binary-tree-from-inorder-and-postorder-traversal", "Build Tree (In+Post)", "M"],
      [114, "flatten-binary-tree-to-linked-list", "Flatten Tree to Linked List", "M"],
      [297, "serialize-and-deserialize-binary-tree", "Serialize & Deserialize", "H"],
    ]},
    { n: "Misc (distance-K, width, complete count)", h: "Convert tree to graph (parent pointers) for distance-K BFS. Count complete tree nodes in O(log²n).",
      note: "<b>Max Width of Binary Tree (LC 662):</b> Give each node a position index like a <b>heap</b> — root = 0, and a node at index <code>i</code> has children <code>2·i</code> (left) and <code>2·i+1</code> (right). The width of a level = <code>lastIndex − firstIndex + 1</code>; the answer is the max over all levels. Both DFS and BFS work — BFS is the natural fit (process level by level; the first node's index is the level's leftmost, the last dequeued is the rightmost). <br><b>Overflow tip:</b> in fixed-int languages, subtract the level's first index from every index to keep numbers small (Python big-ints don't overflow, so it's optional).",
      code:
`from collections import deque

# LC 662 — Maximum Width of Binary Tree
# Index nodes like a heap: node i -> left = 2*i, right = 2*i + 1.
# Level width = last index - first index + 1.

# ---- BFS (level by level) — recommended ----
def width_bfs(root):
    if not root: return 0
    q = deque([(root, 0)]); best = 0
    while q:
        _, first = q[0]                       # leftmost index on this level
        for _ in range(len(q)):
            node, idx = q.popleft()
            if node.left:  q.append((node.left,  2 * idx))
            if node.right: q.append((node.right, 2 * idx + 1))
        best = max(best, idx - first + 1)      # idx = last node dequeued
    return best

# ---- DFS (record the first index seen at each depth) ----
def width_dfs(root):
    first = {}; best = 0
    def dfs(node, depth, idx):
        nonlocal best
        if not node: return
        if depth not in first: first[depth] = idx   # leftmost at this depth
        best = max(best, idx - first[depth] + 1)
        dfs(node.left,  depth + 1, 2 * idx)
        dfs(node.right, depth + 1, 2 * idx + 1)
    dfs(root, 0, 0)
    return best

# ---- Count nodes in a COMPLETE tree — O(log^2 n) ----
def count_nodes(root):
    if not root: return 0
    def h(n, left):
        d = 0
        while n: n = n.left if left else n.right; d += 1
        return d
    lh, rh = h(root, True), h(root, False)
    if lh == rh: return (1 << lh) - 1           # perfect subtree
    return 1 + count_nodes(root.left) + count_nodes(root.right)`,
      p: [
      [662, "maximum-width-of-binary-tree", "Maximum Width of Binary Tree", "M"],
      [863, "all-nodes-distance-k-in-binary-tree", "All Nodes Distance K", "M"],
      [222, "count-complete-tree-nodes", "Count Complete Tree Nodes", "E"],
    ]},
  ]},

  /* ===================== BINARY SEARCH TREE (Striver BST I–II) ===================== */
  { n: "Binary Search Tree", h: "BST invariant: left < node < right. Inorder traversal gives sorted order — exploit it everywhere.", c: [
    { n: "Search / Insert / Delete", h: "Compare with node and go left/right (O(height)). Delete has 3 cases: leaf → remove; one child → return that child; two children → replace value with the <b>inorder successor</b> (smallest node in the right subtree), then delete that successor.", p: [
      [700, "search-in-a-binary-search-tree", "Search in a BST", "E"],
      [701, "insert-into-a-binary-search-tree", "Insert into a BST", "M"],
      [450, "delete-node-in-a-bst", "Delete Node in a BST", "M"],
    ], code:
`def search(root, key):
    while root and root.val != key:
        root = root.left if key < root.val else root.right
    return root

def insert(root, val):
    if not root: return TreeNode(val)
    if val < root.val: root.left  = insert(root.left,  val)
    else:              root.right = insert(root.right, val)
    return root

def delete(root, key):
    if not root:
        return None
    if key < root.val:
        root.left = delete(root.left, key)
    elif key > root.val:
        root.right = delete(root.right, key)
    else:                                  # found the node to delete
        if not root.left:  return root.right   # 0 or 1 child (right only)
        if not root.right: return root.left    # 1 child (left only)
        succ = root.right                      # inorder successor = min of right subtree
        while succ.left:
            succ = succ.left
        root.val = succ.val                    # copy successor value up
        root.right = delete(root.right, succ.val)  # delete the successor
    return root` },
    { n: "Validate / Kth / Two-Sum", h: "Validate with (min,max) bounds passed down. Kth smallest = inorder counting. Two-Sum in BST: inorder → two pointers, or set.", p: [
      [98, "validate-binary-search-tree", "Validate BST", "M"],
      [230, "kth-smallest-element-in-a-bst", "Kth Smallest in BST", "M"],
      [653, "two-sum-iv-input-is-a-bst", "Two Sum IV (BST)", "E"],
      [99, "recover-binary-search-tree", "Recover BST", "M"],
    ]},
    { n: "LCA / Successor / Construct", h: "LCA in BST: walk down until the split point. Build BST from preorder using upper-bound recursion.", p: [
      [235, "lowest-common-ancestor-of-a-binary-search-tree", "LCA of a BST", "M"],
      [1008, "construct-binary-search-tree-from-preorder-traversal", "Build BST from Preorder", "M"],
      [173, "binary-search-tree-iterator", "BST Iterator", "M"],
      ["GFG", "https://www.geeksforgeeks.org/problems/floor-in-bst/1", "Floor in BST", "M"],
      ["GFG", "https://www.geeksforgeeks.org/problems/largest-bst/1", "Largest BST in a Binary Tree", "H"],
    ]},
    { n: "Self-Balancing BSTs (AVL / Red-Black)", h: "A plain BST can degrade to a linked list (O(n)) if inserts come sorted. Self-balancing trees keep height <b>O(log n)</b> via rotations, so search/insert/delete stay O(log n). Rarely coded in interviews — but a common <b>theory / system-design</b> question.",
      note: "<b>AVL tree</b> — <i>balance factor</i> = height(left) − height(right) must stay in {−1, 0, 1}. After an insert, if a node becomes unbalanced there are 4 cases:<br>" +
        "• <b>LL</b> (left-heavy, inserted in left-left) → single <b>right rotation</b><br>" +
        "• <b>RR</b> (right-heavy, right-right) → single <b>left rotation</b><br>" +
        "• <b>LR</b> (left-right) → <b>left</b> rotate child, then <b>right</b> rotate node<br>" +
        "• <b>RL</b> (right-left) → <b>right</b> rotate child, then <b>left</b> rotate node<br>" +
        "AVL is <b>strictly balanced</b> → fastest lookups, but more rotations on insert/delete.<br><br>" +
        "<b>Red-Black tree</b> — nodes are colored red/black with rules: (1) root is black, (2) a red node's children are black (no two reds in a row), (3) every root→null path has the same number of black nodes. This guarantees height ≤ 2·log₂(n+1). <b>Fewer rotations</b> than AVL on insert/delete → better for write-heavy workloads.<br><br>" +
        "<b>AVL vs Red-Black:</b> AVL = more balanced → faster reads; Red-Black = fewer rotations → faster writes. <b>Used in:</b> Java <code>TreeMap</code>/<code>TreeSet</code>, C++ <code>std::map</code>/<code>std::set</code>, and the Linux CFS scheduler (all Red-Black). Database indexes typically use <b>B/B+ trees</b> (a related idea for disk).",
      code:
`# AVL insertion with rotations (Python)
class AVLNode:
    def __init__(self, val):
        self.val = val; self.left = self.right = None
        self.height = 1

def h(n):  return n.height if n else 0
def bf(n): return h(n.left) - h(n.right) if n else 0        # balance factor
def upd(n): n.height = 1 + max(h(n.left), h(n.right))

def right_rotate(y):          # fixes LL
    x = y.left; T = x.right
    x.right = y; y.left = T
    upd(y); upd(x)
    return x                  # x is the new subtree root

def left_rotate(x):           # fixes RR
    y = x.right; T = y.left
    y.left = x; x.right = T
    upd(x); upd(y)
    return y

def insert(root, key):
    if not root:
        return AVLNode(key)
    if key < root.val: root.left  = insert(root.left,  key)
    else:              root.right = insert(root.right, key)
    upd(root)
    balance = bf(root)
    if balance > 1 and key < root.left.val:            # LL
        return right_rotate(root)
    if balance < -1 and key > root.right.val:          # RR
        return left_rotate(root)
    if balance > 1 and key > root.left.val:            # LR
        root.left = left_rotate(root.left); return right_rotate(root)
    if balance < -1 and key < root.right.val:          # RL
        root.right = right_rotate(root.right); return left_rotate(root)
    return root` },
    { n: "B-Tree / B+ Tree (disk-based)", h: "Balanced trees built for <b>disk/SSD</b>, not RAM. A node holds <b>many keys</b> (= one disk page), so the tree is very <b>shallow</b> → far fewer disk reads than a BST/AVL. This is what powers <b>database indexes</b>.",
      note: "<b>Why not a BST/AVL for a database?</b> A BST stores one key per node, so its height is ~log₂(n) — for a billion rows that's ~30 levels = ~30 disk seeks. A B-tree packs hundreds of keys per node (one disk page), so height is ~log₍ₘ₎(n) — often just <b>3–4 levels</b> = 3–4 disk reads. Disk I/O dominates, so fewer, larger nodes win.<br><br>" +
        "<b>B-tree properties (order m):</b> each internal node has up to <code>m</code> children and <code>m−1</code> sorted keys; <b>all leaves are at the same depth</b>; it stays balanced by <b>splitting</b> a node on overflow and <b>borrowing/merging</b> on underflow. Search/insert/delete are O(log n) with a tiny constant.<br><br>" +
        "<b>B+ tree (what most DBs actually use):</b> all <b>data lives in the leaves</b>; internal nodes hold only routing keys; and the <b>leaves are linked together</b>. This makes <b>range scans</b> and ordered/sequential reads very fast (walk the leaf linked-list). Used by MySQL <b>InnoDB</b>, PostgreSQL, and many filesystems.<br><br>" +
        "<b>B-tree vs B+ tree:</b> B-tree can store data in internal nodes (point lookups may end early higher up); B+ tree keeps all data in leaves (uniform lookups + fast ranges). No standard LeetCode/GFG problem — this is a <b>system-design / theory</b> topic.",
      code:
`# Conceptual B-tree node + search (real DBs use B+ trees on disk pages)
class BTreeNode:
    def __init__(self, leaf=False):
        self.keys = []          # sorted keys in this node
        self.children = []      # for internal node: len == len(keys)+1
        self.leaf = leaf

def search(node, key):
    i = 0
    while i < len(node.keys) and key > node.keys[i]:   # scan keys in node
        i += 1
    if i < len(node.keys) and node.keys[i] == key:
        return (node, i)                # found
    if node.leaf:
        return None                     # not present
    return search(node.children[i], key)   # descend to the correct child

# Height intuition:
#   BST / AVL : height ~ log2(n)      -> ~30 levels for 1e9 keys
#   B-tree    : height ~ log_m(n)     -> ~3-4 levels (m = keys/page)
# Fewer levels = fewer disk reads = why databases use B/B+ trees.` },
  ]},

  /* ===================== RECURSION & BACKTRACKING (Striver) ===================== */
  { n: "Recursion & Backtracking", h: "Template: choose → explore (recurse) → un-choose (backtrack). Prune impossible branches early.", c: [
    { n: "Subsets / Power set", h: "For each element: include or exclude. 2ⁿ subsets. Sort to skip duplicates.", p: [
      [78, "subsets", "Subsets", "M"],
      [90, "subsets-ii", "Subsets II", "M"],
      [1863, "sum-of-all-subset-xor-totals", "Sum of All Subset XOR", "E"],
    ]},
    { n: "Permutations / Combinations", h: "Use a used[] array (perms) or a start index (combos) to avoid repeats. Kth permutation: build digit-by-digit using factorials.", p: [
      [46, "permutations", "Permutations", "M"],
      [77, "combinations", "Combinations", "M"],
      [39, "combination-sum", "Combination Sum", "M"],
      [40, "combination-sum-ii", "Combination Sum II", "M"],
      [60, "permutation-sequence", "Permutation Sequence", "H"],
    ]},
    { n: "Grid / Partition backtracking", h: "Word Search: DFS + mark visited, unmark on return. Palindrome partition: try every prefix.", p: [
      [79, "word-search", "Word Search", "M"],
      [131, "palindrome-partitioning", "Palindrome Partitioning", "M"],
      [212, "word-search-ii", "Word Search II (Trie)", "H"],
    ]},
    { n: "Constraint solving (pruning)", h: "N-Queens/Sudoku: track columns/diagonals with sets; place, recurse, remove.", p: [
      [22, "generate-parentheses", "Generate Parentheses", "M"],
      [51, "n-queens", "N-Queens", "H"],
      [37, "sudoku-solver", "Sudoku Solver", "H"],
    ]},
  ]},

  /* ===================== GREEDY (Striver) ===================== */
  { n: "Greedy", h: "Make the locally-best choice and prove it stays globally optimal. Usually needs sorting first.", c: [
    { n: "Interval Greedy", h: "Sort by end time; pick earliest-finishing that fits. Counts non-overlap / min removals / arrows.", p: [
      [455, "assign-cookies", "Assign Cookies", "E"],
      [435, "non-overlapping-intervals", "Non-overlapping Intervals", "M"],
      [452, "minimum-number-of-arrows-to-burst-balloons", "Min Arrows to Burst Balloons", "M"],
    ]},
    { n: "Scheduling / Profit (heap)", h: "Combine sorting with a heap: pick the most profitable currently-available job. Classic Striver problems below link to GeeksforGeeks.", p: [
      [860, "lemonade-change", "Lemonade Change", "E"],
      [621, "task-scheduler", "Task Scheduler", "M"],
      [502, "ipo", "IPO", "H"],
      ["GFG", "https://www.geeksforgeeks.org/problems/n-meetings-in-one-room-1587115620/1", "N Meetings in One Room", "E"],
      ["GFG", "https://www.geeksforgeeks.org/problems/minimum-platforms-1587115620/1", "Minimum Platforms", "M"],
      ["GFG", "https://www.geeksforgeeks.org/problems/job-sequencing-problem-1587115620/1", "Job Sequencing Problem", "M"],
      ["GFG", "https://www.geeksforgeeks.org/problems/fractional-knapsack-1587115620/1", "Fractional Knapsack", "M"],
    ]},
    { n: "Jump / Reach", h: "Track the farthest reachable index; greedily extend the current jump range.", p: [
      [55, "jump-game", "Jump Game", "M"],
      [45, "jump-game-ii", "Jump Game II", "M"],
      [763, "partition-labels", "Partition Labels", "M"],
    ]},
  ]},

  /* ===================== HEAP / PRIORITY QUEUE (Striver Heaps) ===================== */
  { n: "Heap / Priority Queue", h: "\"Top-K\", \"Kth\", \"median\", \"merge sorted\" → heap. Min-heap of size k for K-largest.", c: [
    { n: "Top-K / Kth", h: "Keep a min-heap of size k; the root is the kth largest. O(n log k).", p: [
      [703, "kth-largest-element-in-a-stream", "Kth Largest in a Stream", "E"],
      [215, "kth-largest-element-in-an-array", "Kth Largest Element", "M"],
      [347, "top-k-frequent-elements", "Top K Frequent Elements", "M"],
    ]},
    { n: "Two Heaps (median)", h: "Max-heap for lower half, min-heap for upper half; balance sizes; median from tops.", p: [
      [1046, "last-stone-weight", "Last Stone Weight", "E"],
      [973, "k-closest-points-to-origin", "K Closest Points to Origin", "M"],
      [295, "find-median-from-data-stream", "Find Median from Data Stream", "H"],
    ]},
    { n: "K-way Merge", h: "Push the head of each list into a heap; pop smallest, push its next.", p: [
      [378, "kth-smallest-element-in-a-sorted-matrix", "Kth Smallest in Sorted Matrix", "M"],
      [23, "merge-k-sorted-lists", "Merge k Sorted Lists", "H"],
      [632, "smallest-range-covering-elements-from-k-lists", "Smallest Range K Lists", "H"],
    ]},
  ]},

  /* ===================== GRAPHS (Striver Graph I–II) ===================== */
  { n: "Graphs", h: "Model as adjacency list. BFS = shortest edges / levels; DFS = connectivity / cycles / topo. Track visited!", c: [
    { n: "Traversal (BFS / DFS)", h: "Grid problems = graph with 4/8 neighbors. Multi-source BFS starts from all sources at once. Clone graph: DFS/BFS + visited map old→new.", p: [
      [200, "number-of-islands", "Number of Islands", "M"],
      [133, "clone-graph", "Clone Graph", "M"],
      [994, "rotting-oranges", "Rotting Oranges (multi-source BFS)", "M"],
      [417, "pacific-atlantic-water-flow", "Pacific Atlantic Water Flow", "M"],
    ]},
    { n: "Cycle Detection", h: "<b>Undirected:</b> DFS/BFS tracking the <b>parent</b> — a visited neighbor that isn't the parent = cycle (or use DSU). <b>Directed:</b> DFS with <b>visited + rec_stack</b> — an edge back to a node in the current path = cycle (or Kahn's: if processed ≠ V, there's a cycle).",
      code:
`from collections import deque

# ============ UNDIRECTED ============
# Hint: use visited + parent. A visited neighbor that isn't the parent = cycle.

# Undirected — DFS
def cyc_undirected_dfs(n, adj):
    seen = [False] * n
    def dfs(u, parent):
        seen[u] = True
        for v in adj[u]:
            if not seen[v]:
                if dfs(v, u): return True
            elif v != parent:            # visited & not parent -> cycle
                return True
        return False
    return any(not seen[i] and dfs(i, -1) for i in range(n))

# Undirected — BFS (queue stores (node, parent))
def cyc_undirected_bfs(n, adj):
    seen = [False] * n
    for s in range(n):
        if seen[s]: continue
        seen[s] = True; q = deque([(s, -1)])
        while q:
            u, par = q.popleft()
            for v in adj[u]:
                if not seen[v]:
                    seen[v] = True; q.append((v, u))
                elif v != par:
                    return True
    return False

# Undirected — Union-Find (edge whose ends are already joined = cycle)
def cyc_undirected_dsu(n, edges):
    parent = list(range(n))
    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]; x = parent[x]
        return x
    for u, v in edges:
        ru, rv = find(u), find(v)
        if ru == rv: return True
        parent[ru] = rv
    return False

# ============ DIRECTED ============
# Hint (DFS): visited + rec_stack (nodes on the current path).

# Directed — DFS
def cyc_directed_dfs(n, adj):
    visited = [False] * n; rec = [False] * n     # rec = in current path
    def dfs(u):
        visited[u] = rec[u] = True
        for v in adj[u]:
            if not visited[v] and dfs(v): return True
            elif rec[v]: return True             # back-edge to current path
        rec[u] = False                           # pop from recursion stack
        return False
    return any(not visited[i] and dfs(i) for i in range(n))

# Directed — DFS (alternative: 3-color  0=unseen, 1=in path, 2=done)
def cyc_directed_dfs_color(n, adj):
    state = [0] * n                              # same idea, one array
    def dfs(u):
        state[u] = 1
        for v in adj[u]:
            if state[v] == 1: return True         # back-edge -> cycle
            if state[v] == 0 and dfs(v): return True
        state[u] = 2
        return False
    return any(state[i] == 0 and dfs(i) for i in range(n))

# Directed — BFS / Kahn's (hint: in-degree; if processed != V -> cycle)
def cyc_directed_bfs(n, adj):
    indeg = [0] * n
    for u in range(n):
        for v in adj[u]: indeg[v] += 1
    q = deque(i for i in range(n) if indeg[i] == 0); processed = 0
    while q:
        u = q.popleft(); processed += 1
        for v in adj[u]:
            indeg[v] -= 1
            if indeg[v] == 0: q.append(v)
    return processed != n`,
      p: [
      [207, "course-schedule", "Course Schedule (directed)", "M"],
      [684, "redundant-connection", "Redundant Connection (undirected)", "M"],
      [802, "find-eventual-safe-states", "Find Eventual Safe States", "M"],
    ]},
    { n: "Topological Sort", h: "Only for DAGs. Two ways: <b>Kahn's (BFS)</b> — repeatedly remove 0 in-degree nodes; <b>DFS</b> — push a node after visiting all its children, then reverse.",
      code:
`from collections import deque, defaultdict

# Topological Sort — Kahn's (BFS on in-degree)
def topo_bfs(n, adj):
    indeg = [0] * n
    for u in range(n):
        for v in adj[u]: indeg[v] += 1
    q = deque(i for i in range(n) if indeg[i] == 0); order = []
    while q:
        u = q.popleft(); order.append(u)
        for v in adj[u]:
            indeg[v] -= 1
            if indeg[v] == 0: q.append(v)
    return order if len(order) == n else []      # [] => cycle (not a DAG)

# Topological Sort — DFS (reverse post-order)
def topo_dfs(n, adj):
    seen = [False] * n; stack = []
    def dfs(u):
        seen[u] = True
        for v in adj[u]:
            if not seen[v]: dfs(v)
        stack.append(u)                            # done with u -> push
    for i in range(n):
        if not seen[i]: dfs(i)
    return stack[::-1]                             # reverse = topological order`,
      p: [
      [210, "course-schedule-ii", "Course Schedule II", "M"],
      [269, "alien-dictionary", "Alien Dictionary", "H"],
      [310, "minimum-height-trees", "Minimum Height Trees", "M"],
    ]},
    { n: "Shortest Path", h: "Unweighted → BFS. Non-negative weights → Dijkstra (heap). Negative → Bellman-Ford. All-pairs → Floyd-Warshall. All four work on both directed & undirected graphs (treat an undirected edge u–w as two directed edges u→w and w→u). Caveat: negative weights only make sense for directed graphs, since a single negative undirected edge is itself a negative cycle (u→w→u).", p: [
      [1091, "shortest-path-in-binary-matrix", "Shortest Path in Binary Matrix", "M"],
      [743, "network-delay-time", "Network Delay Time (Dijkstra)", "M"],
      [787, "cheapest-flights-within-k-stops", "Cheapest Flights K Stops", "M"],
    ]},
    { n: "MST & Union-Find (DSU)", h: "DSU: union by rank + path compression → ~O(1). <b>Kruskal</b> = sort edges + DSU (add edge if it joins two sets). <b>Prim</b> = grow the tree with a min-heap of crossing edges.",
      code:
`# ---- Disjoint Set Union (DSU) ----
parent = list(range(n)); rank = [0] * n
def find(x):
    while parent[x] != x:
        parent[x] = parent[parent[x]]; x = parent[x]   # path compression
    return x
def union(a, b):
    ra, rb = find(a), find(b)
    if ra == rb: return False                          # already connected
    if rank[ra] < rank[rb]: ra, rb = rb, ra
    parent[rb] = ra
    if rank[ra] == rank[rb]: rank[ra] += 1
    return True

# ---- Kruskal's MST ----  edges = [(weight, u, v), ...]
def kruskal(n, edges):
    total = weight_used = 0
    for w, u, v in sorted(edges):        # sort by weight
        if union(u, v):                  # add edge only if it joins 2 sets
            total += w; weight_used += 1
            if weight_used == n - 1: break
    return total

# ---- Prim's MST ----  adj[u] = [(v, w), ...]
import heapq
def prim(n, adj, start=0):
    seen = [False] * n; pq = [(0, start)]; total = 0
    while pq:
        w, u = heapq.heappop(pq)
        if seen[u]: continue
        seen[u] = True; total += w       # add cheapest crossing edge
        for v, wt in adj[u]:
            if not seen[v]: heapq.heappush(pq, (wt, v))
    return total`,
      p: [
      [547, "number-of-provinces", "Number of Provinces", "M"],
      [1584, "min-cost-to-connect-all-points", "Min Cost Connect Points (MST)", "M"],
      [1319, "number-of-operations-to-make-network-connected", "Make Network Connected", "M"],
    ]},
    { n: "Advanced (bridges / SCC / bipartite)", h: "<b>Bipartite</b> = 2-coloring (BFS or DFS); conflict → not bipartite. <b>Kosaraju</b> finds SCCs with 2 passes (topo sort by finish time, then DFS the transposed graph in reverse topo order).",
      code:
`from collections import deque

# ---- Bipartite check — BFS (2-coloring) ----
def is_bipartite_bfs(n, adj):
    color = [0] * n
    for s in range(n):
        if color[s]: continue
        color[s] = 1; q = deque([s])
        while q:
            u = q.popleft()
            for v in adj[u]:
                if color[v] == color[u]: return False   # same color = conflict
                if not color[v]: color[v] = -color[u]; q.append(v)
    return True

# ---- Bipartite check — DFS (2-coloring) ----
def is_bipartite_dfs(n, adj):
    color = [0] * n
    def dfs(u, c):
        color[u] = c
        for v in adj[u]:
            if color[v] == c: return False
            if color[v] == 0 and not dfs(v, -c): return False
        return True
    return all(color[i] != 0 or dfs(i, 1) for i in range(n))

# ---- Kosaraju's SCC (Strongly Connected Components) ----
def kosaraju(n, adj):
    seen = [False] * n; order = []
    def toposort(u):                              # 1) topo order by finish time
        seen[u] = True
        for v in adj[u]:
            if not seen[v]: toposort(v)
        order.append(u)
    for i in range(n):
        if not seen[i]: toposort(i)
    radj = [[] for _ in range(n)]                 # 2) transpose the graph
    for u in range(n):
        for v in adj[u]: radj[v].append(u)
    seen = [False] * n; sccs = []
    def dfs(u, comp):                             # 3) DFS transpose in reverse topo order
        seen[u] = True; comp.append(u)
        for v in radj[u]:
            if not seen[v]: dfs(v, comp)
    for u in reversed(order):
        if not seen[u]:
            comp = []; dfs(u, comp); sccs.append(comp)
    return sccs`,
      p: [
      [785, "is-graph-bipartite", "Is Graph Bipartite?", "M"],
      [1192, "critical-connections-in-a-network", "Critical Connections (bridges)", "H"],
      [329, "longest-increasing-path-in-a-matrix", "Longest Increasing Path (DFS+memo)", "H"],
      ["GFG", "https://www.geeksforgeeks.org/problems/strongly-connected-components-kosarajus-algo/1", "Strongly Connected Components (Kosaraju)", "H"],
      ["GFG", "https://www.geeksforgeeks.org/problems/articulation-point-1/1", "Articulation Point", "H"],
    ]},
  ]},

  /* ===================== TRIE (Striver) ===================== */
  { n: "Trie", h: "Tree of characters. Each node has children map + isEnd flag. O(word length) insert/search — great for prefixes.", c: [
    { n: "Insert / Search / Prefix", h: "Walk char by char creating nodes. Prefix search stops without needing isEnd. Longest word buildable = all prefixes are words.", p: [
      [208, "implement-trie-prefix-tree", "Implement Trie", "M"],
      [211, "design-add-and-search-words-data-structure", "Add & Search Word (wildcard)", "M"],
      [720, "longest-word-in-dictionary", "Longest Word in Dictionary", "M"],
      [212, "word-search-ii", "Word Search II", "H"],
    ]},
    { n: "Bitwise Trie (XOR)", h: "Insert numbers bit by bit (MSB→LSB). To maximize XOR, greedily go to the opposite bit.", p: [
      [421, "maximum-xor-of-two-numbers-in-an-array", "Maximum XOR of Two Numbers", "M"],
      [648, "replace-words", "Replace Words", "M"],
      [1707, "maximum-xor-with-an-element-from-array", "Max XOR With Element", "H"],
    ]},
  ]},

  /* ===================== DYNAMIC PROGRAMMING (Striver DP I–II) ===================== */
  { n: "Dynamic Programming", h: "Recursion + memo (top-down) first, then convert to tabulation. Define state = what changes; write the transition; handle base cases.", c: [
    { n: "1D DP (take / not-take)", h: "State = index; choice = pick or skip. House Robber: dp[i]=max(skip, take+dp[i-2]).", p: [
      [70, "climbing-stairs", "Climbing Stairs", "E"],
      [198, "house-robber", "House Robber", "M"],
      [213, "house-robber-ii", "House Robber II", "M"],
    ]},
    { n: "Grid / 2D DP", h: "State = (row,col). Reach cell from top/left. Watch obstacles & min/max path.", p: [
      [62, "unique-paths", "Unique Paths", "M"],
      [64, "minimum-path-sum", "Minimum Path Sum", "M"],
      [931, "minimum-falling-path-sum", "Minimum Falling Path Sum", "M"],
    ]},
    { n: "Subsequences / Knapsack", h: "State = (index, remaining capacity/target). Take or skip each item. Word Break: dp[i] = can any word end at i.", p: [
      [416, "partition-equal-subset-sum", "Partition Equal Subset Sum", "M"],
      [322, "coin-change", "Coin Change", "M"],
      [494, "target-sum", "Target Sum", "M"],
      [139, "word-break", "Word Break", "M"],
    ]},
    { n: "Strings DP (LCS family)", h: "State = (i,j) over two strings. Match → 1+diagonal; else max of skipping one.", p: [
      [1143, "longest-common-subsequence", "Longest Common Subsequence", "M"],
      [72, "edit-distance", "Edit Distance", "M"],
      [516, "longest-palindromic-subsequence", "Longest Palindromic Subsequence", "M"],
    ]},
    { n: "LIS & Stocks", h: "LIS: dp[i]=longest ending at i, or O(n log n) with patience sort. Stocks: state = (day, holding, transactions). Job scheduling: sort + DP + binary search.", p: [
      [300, "longest-increasing-subsequence", "Longest Increasing Subsequence", "M"],
      [123, "best-time-to-buy-and-sell-stock-iii", "Buy/Sell Stock III", "H"],
      [309, "best-time-to-buy-and-sell-stock-with-cooldown", "Buy/Sell with Cooldown", "M"],
      [1235, "maximum-profit-in-job-scheduling", "Maximum Profit in Job Scheduling", "H"],
    ]},
    { n: "Partition / MCM / Interval DP", h: "Try every partition point k in [i,j]; combine left+right+merge cost. Egg drop: minimize worst-case trials.", p: [
      [132, "palindrome-partitioning-ii", "Palindrome Partitioning II", "H"],
      [1547, "minimum-cost-to-cut-a-stick", "Minimum Cost to Cut a Stick", "H"],
      [312, "burst-balloons", "Burst Balloons", "H"],
      [887, "super-egg-drop", "Super Egg Drop", "H"],
    ]},
    { n: "DP on Trees / Bitmask", h: "Trees: return two states per node (include/exclude). Bitmask: state = visited set as bits.", p: [
      [337, "house-robber-iii", "House Robber III", "M"],
      [698, "partition-to-k-equal-sum-subsets", "Partition to K Equal Subsets", "M"],
      [847, "shortest-path-visiting-all-nodes", "Shortest Path Visiting All Nodes", "H"],
    ]},
  ]},

  /* ===================== BIT MANIPULATION ===================== */
  { n: "Bit Manipulation", h: "x&1 tests last bit; x>>1 halves; x&(x-1) clears lowest set bit; a^a=0. XOR cancels pairs.", c: [
    { n: "XOR tricks", h: "Missing/single number: XOR everything — pairs cancel, the odd one remains.", p: [
      [136, "single-number", "Single Number", "E"],
      [137, "single-number-ii", "Single Number II", "M"],
      [260, "single-number-iii", "Single Number III", "M"],
    ]},
    { n: "Counting & masks", h: "Count set bits with x&(x-1) loop or DP. Subsets via iterating bitmasks 0..2ⁿ-1.", p: [
      [191, "number-of-1-bits", "Number of 1 Bits", "E"],
      [338, "counting-bits", "Counting Bits", "E"],
      [201, "bitwise-and-of-numbers-range", "Bitwise AND of Range", "M"],
    ]},
  ]},

  /* ===================== SORTING ALGORITHMS ===================== */
  { n: "Sorting Algorithms", h: "Know Merge (stable, O(n log n), divide-conquer) and Quick (in-place, avg O(n log n)). Counting/Radix for small ranges.", c: [
    { n: "Merge Sort & inversions", h: "Split, sort halves, merge. Count inversions during the merge step.", p: [
      [912, "sort-an-array", "Sort an Array", "M"],
      [148, "sort-list", "Sort List (merge sort on LL)", "M"],
      [315, "count-of-smaller-numbers-after-self", "Count Smaller After Self", "H"],
    ]},
    { n: "Quick Select & partition", h: "Quickselect finds Kth in avg O(n) by partitioning around a pivot (no full sort).", p: [
      [75, "sort-colors", "Sort Colors (3-way)", "M"],
      [215, "kth-largest-element-in-an-array", "Kth Largest (Quickselect)", "M"],
      [973, "k-closest-points-to-origin", "K Closest Points", "M"],
    ]},
    { n: "Counting / Bucket / Radix", h: "When values are in a small fixed range, count occurrences → O(n).", p: [
      [1122, "relative-sort-array", "Relative Sort Array", "E"],
      [451, "sort-characters-by-frequency", "Sort Characters By Frequency", "M"],
      [164, "maximum-gap", "Maximum Gap (radix/bucket)", "M"],
    ]},
  ]},

  /* ===================== RANGE STRUCTURES (advanced) ===================== */
  { n: "Range Structures (Advanced)", h: "Segment Tree / Fenwick (BIT) give O(log n) range queries + point updates. Use when there are many updates + queries.", c: [
    { n: "Fenwick Tree (BIT)", h: "Simplest for prefix sums with updates. index += index & (-index) to move up.", p: [
      [307, "range-sum-query-mutable", "Range Sum Query - Mutable", "M"],
      [315, "count-of-smaller-numbers-after-self", "Count Smaller After Self", "H"],
      [493, "reverse-pairs", "Reverse Pairs", "H"],
    ]},
    { n: "Segment Tree (+ Lazy)", h: "Build a tree over ranges; lazy propagation defers range updates until needed.", p: [
      [308, "range-sum-query-2d-mutable", "Range Sum Query 2D - Mutable", "H"],
      [699, "falling-squares", "Falling Squares", "H"],
      [218, "the-skyline-problem", "The Skyline Problem", "H"],
    ]},
  ]},
];
