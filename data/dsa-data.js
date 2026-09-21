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
    { n: "Arrays & Lists", note: "Python <code>list</code> = dynamic array. Index/append are O(1); insert/pop at front are O(n).", code: {
        pseudo:
`the same dynamic-array moves in each language:
  append at end (O(1) amortised), sort, custom/reverse sort,
  read the last element, take a slice [start, end), iterate index+value.`,
        py:
`nums = [3, 1, 2]
nums.append(4)          # O(1) add at end
nums.sort()             # O(n log n) in-place
nums.sort(key=lambda x: -x)   # custom / reverse
last = nums[-1]         # negative indexing
sub = nums[1:3]         # slicing [start:end)
for i, v in enumerate(nums):   # index + value
    ...`,
        java:
`List<Integer> nums = new ArrayList<>(List.of(3, 1, 2));  // dynamic array
nums.add(4);                              // O(1) amortised add at end
Collections.sort(nums);                   // O(n log n)
nums.sort(Comparator.reverseOrder());     // custom / reverse
int last = nums.get(nums.size() - 1);     // no negative indexing
List<Integer> sub = nums.subList(1, 3);   // view of [1, 3)
for (int i = 0; i < nums.size(); i++) { int v = nums.get(i); }  // index + value`,
        cpp:
`vector<int> nums = {3, 1, 2};
nums.push_back(4);                        // O(1) amortised add at end
sort(nums.begin(), nums.end());           // O(n log n)
sort(nums.begin(), nums.end(), greater<int>());   // custom / reverse
int last = nums.back();                   // last element
vector<int> sub(nums.begin() + 1, nums.begin() + 3);  // copy of [1, 3)
for (int i = 0; i < (int)nums.size(); i++) { int v = nums[i]; }  // index + value`,
        js:
`const nums = [3, 1, 2];
nums.push(4);                             // O(1) amortised add at end
nums.sort((a, b) => a - b);               // numeric sort (default is string!)
nums.sort((a, b) => b - a);               // custom / reverse
const last = nums.at(-1);                 // negative indexing
const sub = nums.slice(1, 3);             // copy of [1, 3)
nums.forEach((v, i) => { /* index + value */ });` } },
    { n: "Strings", note: "Strings are <b>immutable</b> — building with <code>+=</code> in a loop is O(n²). Collect into a list and <code>\"\".join(...)</code>.", code: {
        pseudo:
`the same string moves in each language:
  reverse, sort the characters (an anagram key), char <-> int code,
  and a frequency map of the characters.`,
        py:
`s = "leetcode"
s[::-1]                 # reverse -> "edocteel"
"".join(sorted(s))      # anagram key
ord('a'), chr(97)       # char <-> int
from collections import Counter
Counter(s)              # {char: freq}`,
        java:
`String s = "leetcode";
new StringBuilder(s).reverse().toString();        // reverse
char[] c = s.toCharArray(); Arrays.sort(c);       // anagram key = new String(c)
int code = 'a'; char ch = (char) 97;              // char <-> int
Map<Character,Integer> freq = new HashMap<>();
for (char x : s.toCharArray()) freq.merge(x, 1, Integer::sum);`,
        cpp:
`string s = "leetcode";
reverse(s.begin(), s.end());              // reverse in place
string key = s; sort(key.begin(), key.end());     // anagram key
int code = 'a'; char ch = char(97);       // char <-> int
unordered_map<char,int> freq;
for (char x : s) freq[x]++;               // {char: count}`,
        js:
`const s = "leetcode";
[...s].reverse().join("");                // reverse -> "edocteel"
[...s].sort().join("");                   // anagram key
const code = "a".charCodeAt(0), ch = String.fromCharCode(97);
const freq = new Map();
for (const x of s) freq.set(x, (freq.get(x) || 0) + 1);` } },
    { n: "Hashing — dict & set", h: "When you see \"find/seen before\", \"count\", or \"pair sums to target\" → reach for a hash map/set for O(1) lookup.", code: {
        pseudo:
`the three hashing staples in each language:
  a frequency map (value -> count), a set for O(1) membership,
  and an adjacency list (node -> list of neighbours).`,
        py:
`from collections import defaultdict, Counter
freq = Counter(nums)          # frequency map
seen = set()                  # O(1) membership
graph = defaultdict(list)     # adjacency list
graph[u].append(v)`,
        java:
`Map<Integer,Integer> freq = new HashMap<>();      // frequency map
for (int x : nums) freq.merge(x, 1, Integer::sum);
Set<Integer> seen = new HashSet<>();              // O(1) membership
Map<Integer,List<Integer>> graph = new HashMap<>();   // adjacency list
graph.computeIfAbsent(u, z -> new ArrayList<>()).add(v);`,
        cpp:
`unordered_map<int,int> freq;              // frequency map
for (int x : nums) freq[x]++;
unordered_set<int> seen;                  // O(1) membership
unordered_map<int, vector<int>> graph;    // adjacency list
graph[u].push_back(v);`,
        js:
`const freq = new Map();                   // frequency map
for (const x of nums) freq.set(x, (freq.get(x) || 0) + 1);
const seen = new Set();                   // O(1) membership
const graph = new Map();                  // adjacency list
if (!graph.has(u)) graph.set(u, []);
graph.get(u).push(v);` } },
    { n: "Stack & Queue", note: "Use a <code>list</code> as a stack (append/pop). Use <code>collections.deque</code> for a queue/deque (O(1) both ends).", code: {
        pseudo:
`stack = LIFO (push/pop one end); queue = FIFO (add back, remove front);
deque = add/remove at both ends. Each language's O(1) tools below.`,
        py:
`stack = []; stack.append(x); stack.pop()
from collections import deque
q = deque(); q.append(x); q.popleft()   # BFS queue
q.appendleft(x); q.pop()                # deque both ends`,
        java:
`Deque<Integer> stack = new ArrayDeque<>();
stack.push(x); stack.pop();               // LIFO
Deque<Integer> q = new ArrayDeque<>();
q.addLast(x); q.pollFirst();              // FIFO queue (BFS)
q.addFirst(x); q.pollLast();              // deque both ends`,
        cpp:
`stack<int> st; st.push(x); st.pop();      // top() to peek
queue<int> q; q.push(x); q.pop();         // front() to peek (BFS)
deque<int> dq;                            // both ends
dq.push_front(x); dq.pop_back();`,
        js:
`const stack = []; stack.push(x); stack.pop();     // LIFO
const q = []; q.push(x); q.shift();               // FIFO (shift is O(n)!)
// for a real O(1) queue, keep a head index instead of shift()
const dq = []; dq.unshift(x); dq.pop();           // both ends` } },
    { n: "Heap (Priority Queue)", h: "Python <code>heapq</code> is a <b>min-heap</b>. For a max-heap, push negatives. \"Top-K / Kth / smallest-largest so far\" → heap.", code: {
        pseudo:
`a priority queue: push items, pop the smallest (min-heap) in O(log n).
  max-heap: negate values (Python) or use the language's max variant.`,
        py:
`import heapq
h = []
heapq.heappush(h, 5)
smallest = heapq.heappop(h)      # min-heap
heapq.heappush(h, -x)            # max-heap trick
heapq.nlargest(k, nums)`,
        java:
`PriorityQueue<Integer> h = new PriorityQueue<>();   // min-heap
h.add(5);
int smallest = h.poll();
PriorityQueue<Integer> max = new PriorityQueue<>(Collections.reverseOrder());
// top-k: keep a size-k heap and poll whenever it grows past k`,
        cpp:
`priority_queue<int, vector<int>, greater<int>> h;   // min-heap
h.push(5);
int smallest = h.top(); h.pop();
priority_queue<int> maxH;                 // max-heap (the default)`,
        js:
`// JS has no built-in heap. Use a small MinHeap class (see the Heap topic),
// or, for a static top-k, sort and slice:
const kLargest = [...nums].sort((a, b) => b - a).slice(0, k);` } },
    { n: "Recursion Basics", h: "Every recursion needs (1) a <b>base case</b> and (2) a call that moves toward it. Think: what does f(n) return given f(n-1)?", code: {
        pseudo:
`every recursion needs a base case that returns with no call,
and a step that moves toward it. Watch the stack-depth limit.`,
        py:
`def fact(n):
    if n <= 1:            # base case
        return 1
    return n * fact(n-1)  # recursive step

# recursion depth default ~1000
import sys; sys.setrecursionlimit(10**6)`,
        java:
`int fact(int n) {
    if (n <= 1) return 1;                 // base case
    return n * fact(n - 1);               // recursive step
}
// the JVM stack overflows after a few thousand frames; raise it with -Xss,
// or convert deep recursion to an explicit stack or a loop.`,
        cpp:
`int fact(int n) {
    if (n <= 1) return 1;                 // base case
    return n * fact(n - 1);               // recursive step
}
// deep recursion can overflow the call stack; convert to a loop if needed.`,
        js:
`function fact(n) {
  if (n <= 1) return 1;                   // base case
  return n * fact(n - 1);                 // recursive step
}
// the call stack caps around ~10^4 frames; use a loop for deep recursion.` } },
    { n: "Sorting & Binary Search built-ins", note: "Know the library before hand-rolling sorts.", code: {
        pseudo:
`library sort (O(n log n)), a multi-key comparator, and lower-bound
binary search (first index >= x). Each language's built-ins below.`,
        py:
`nums.sort()                       # Timsort O(n log n)
sorted(pairs, key=lambda p: (p[0], -p[1]))
import bisect
i = bisect.bisect_left(nums, x)   # first index >= x
bisect.insort(nums, x)            # insert keeping sorted`,
        java:
`Arrays.sort(nums);                        // O(n log n)
pairs.sort(Comparator.comparingInt((int[] p) -> p[0])
    .thenComparing(p -> -p[1]));          // multi-key
int i = Arrays.binarySearch(nums, x);     // exact; negative if absent
// for lower_bound, write a manual binary search (see the Binary Search topic)`,
        cpp:
`sort(nums.begin(), nums.end());           // O(n log n)
sort(pairs.begin(), pairs.end(), [](auto& a, auto& b){
    return a.first != b.first ? a.first < b.first : a.second > b.second; });
auto it = lower_bound(nums.begin(), nums.end(), x);   // first >= x`,
        js:
`nums.sort((a, b) => a - b);               // numeric (default sort is string!)
pairs.sort((a, b) => a[0] - b[0] || b[1] - a[1]);     // multi-key
// no built-in binary search; write one (see the Binary Search topic)` } },
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
      code: {
        pseudo:
`build a tree from a level-order list, and index a complete tree.
  build_tree(vals):
    root = node(vals[0]); q = queue([root]); i = 1
    while q and i < len(vals)
      node = q.pop_front
      if vals[i] present -> node.left = node(vals[i]); push it
      i = i + 1
      if vals[i] present -> node.right = node(vals[i]); push it
      i = i + 1
    return root
  complete-tree array indexing:
    left(i) = 2i+1, right(i) = 2i+2, parent(i) = (i-1)/2`,
        py:
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
def parent(i): return (i - 1) // 2`,
        java:
`class TreeNode {
    int val; TreeNode left, right;
    TreeNode(int v) { val = v; }
}

// Build a tree from a level-order list (null = missing node)
TreeNode buildTree(Integer[] vals) {
    if (vals.length == 0 || vals[0] == null) return null;
    TreeNode root = new TreeNode(vals[0]);
    Queue<TreeNode> q = new LinkedList<>(); q.add(root);
    int i = 1;
    while (!q.isEmpty() && i < vals.length) {
        TreeNode node = q.poll();
        if (i < vals.length && vals[i] != null) {      // left child
            node.left = new TreeNode(vals[i]); q.add(node.left);
        }
        i++;
        if (i < vals.length && vals[i] != null) {      // right child
            node.right = new TreeNode(vals[i]); q.add(node.right);
        }
        i++;
    }
    return root;
}

// Array (complete-tree) representation, like a heap:
//   arr[i] is the node, children 2i+1 and 2i+2, parent (i-1)/2
int left(int i)   { return 2*i + 1; }
int right(int i)  { return 2*i + 2; }
int parent(int i) { return (i - 1) / 2; }`,
        cpp:
`struct TreeNode {
    int val; TreeNode *left = nullptr, *right = nullptr;
    TreeNode(int v) : val(v) {}
};

// Build from a level-order list; each entry is {value, present?}
TreeNode* buildTree(vector<pair<int,bool>>& vals) {
    if (vals.empty() || !vals[0].second) return nullptr;
    TreeNode* root = new TreeNode(vals[0].first);
    queue<TreeNode*> q; q.push(root);
    int i = 1, n = vals.size();
    while (!q.empty() && i < n) {
        TreeNode* node = q.front(); q.pop();
        if (i < n && vals[i].second) {                 // left child
            node->left = new TreeNode(vals[i].first); q.push(node->left);
        }
        i++;
        if (i < n && vals[i].second) {                 // right child
            node->right = new TreeNode(vals[i].first); q.push(node->right);
        }
        i++;
    }
    return root;
}

// Array (complete-tree) representation, like a heap:
//   arr[i] is the node, children 2i+1 and 2i+2, parent (i-1)/2
int leftIdx(int i)   { return 2*i + 1; }
int rightIdx(int i)  { return 2*i + 2; }
int parentIdx(int i) { return (i - 1) / 2; }`,
        js:
`class TreeNode {
  constructor(val = 0, left = null, right = null) {
    this.val = val; this.left = left; this.right = right;
  }
}

// Build a tree from a level-order list (null = missing node)
function buildTree(vals) {
  if (!vals.length || vals[0] === null) return null;
  const root = new TreeNode(vals[0]);
  const q = [root];
  let i = 1;
  while (q.length && i < vals.length) {
    const node = q.shift();
    if (i < vals.length && vals[i] !== null) {         // left child
      node.left = new TreeNode(vals[i]); q.push(node.left);
    }
    i++;
    if (i < vals.length && vals[i] !== null) {         // right child
      node.right = new TreeNode(vals[i]); q.push(node.right);
    }
    i++;
  }
  return root;
}

// Array (complete-tree) representation, like a heap:
//   arr[i] is the node, children 2i+1 and 2i+2, parent (i-1)/2
const left = i => 2*i + 1;
const right = i => 2*i + 2;
const parent = i => (i - 1) >> 1;` } },
    { n: "Traversals", h: "Pre=Node,L,R · In=L,Node,R · Post=L,R,Node. Do recursive first, then iterative with a stack.", p: [
      [94, "binary-tree-inorder-traversal", "Inorder Traversal", "E"],
      [144, "binary-tree-preorder-traversal", "Preorder Traversal", "E"],
      [145, "binary-tree-postorder-traversal", "Postorder Traversal", "E"],
    ]},
    { n: "Morris, Views & Boundary (Striver)", h: "<b>Morris</b> traversal gives O(1) space using temporary <i>threads</i> (link each node's inorder-predecessor.right back to it). <b>Two types:</b> (1) <b>Inorder</b> — visit when you <i>remove</i> the thread; (2) <b>Preorder</b> — visit when you <i>create</i> the thread. <b>Views</b> (top/bottom) sort by horizontal distance via BFS; <b>Vertical order</b> sorts by (column, row, value). Top/Bottom View &amp; Boundary have no free LeetCode problem — practice on GFG; Vertical Order is LC 987.",
      code: {
        pseudo:
`Morris traversal: O(1) space using temporary "threads".
  thread = link the inorder-predecessor's right back to the node.
  INORDER  visits when you REMOVE a thread.
  PREORDER visits when you CREATE a thread.
  loop with cur = root:
    if cur has no left -> visit (preorder), then go right
    else pre = rightmost node of cur.left
      if pre.right is null -> (preorder: visit cur); pre.right = cur; go left
      else -> pre.right = null (remove); (inorder: visit cur); go right

Views by horizontal distance (hd), BFS left to right:
  Top View: first node seen per hd.   Bottom View: last node per hd.
  Vertical order: group by column, sort each column by (row, value).

Boundary (anti-clockwise): root, then left edge (skip leaves),
  then all leaves left to right, then right edge bottom-up.`,
        py:
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
        java:
`// Morris INORDER (L, Node, R): visit when REMOVING the thread. O(1) space.
List<Integer> morrisInorder(TreeNode root) {
    List<Integer> out = new ArrayList<>();
    TreeNode cur = root;
    while (cur != null) {
        if (cur.left == null) { out.add(cur.val); cur = cur.right; }
        else {
            TreeNode pre = cur.left;
            while (pre.right != null && pre.right != cur) pre = pre.right;
            if (pre.right == null) { pre.right = cur; cur = cur.left; }
            else { pre.right = null; out.add(cur.val); cur = cur.right; }
        }
    }
    return out;
}

// Morris PREORDER (Node, L, R): visit when CREATING the thread.
List<Integer> morrisPreorder(TreeNode root) {
    List<Integer> out = new ArrayList<>();
    TreeNode cur = root;
    while (cur != null) {
        if (cur.left == null) { out.add(cur.val); cur = cur.right; }
        else {
            TreeNode pre = cur.left;
            while (pre.right != null && pre.right != cur) pre = pre.right;
            if (pre.right == null) { out.add(cur.val); pre.right = cur; cur = cur.left; }
            else { pre.right = null; cur = cur.right; }
        }
    }
    return out;
}

// Top View: first node per horizontal distance (BFS). Bottom: last.
List<Integer> topView(TreeNode root) {
    Map<Integer,Integer> seen = new TreeMap<>();
    Queue<TreeNode> nodes = new LinkedList<>(); Queue<Integer> hds = new LinkedList<>();
    if (root != null) { nodes.add(root); hds.add(0); }
    while (!nodes.isEmpty()) {
        TreeNode node = nodes.poll(); int hd = hds.poll();
        seen.putIfAbsent(hd, node.val);              // first wins = top
        if (node.left != null)  { nodes.add(node.left);  hds.add(hd - 1); }
        if (node.right != null) { nodes.add(node.right); hds.add(hd + 1); }
    }
    return new ArrayList<>(seen.values());
}
List<Integer> bottomView(TreeNode root) {
    Map<Integer,Integer> seen = new TreeMap<>();
    Queue<TreeNode> nodes = new LinkedList<>(); Queue<Integer> hds = new LinkedList<>();
    if (root != null) { nodes.add(root); hds.add(0); }
    while (!nodes.isEmpty()) {
        TreeNode node = nodes.poll(); int hd = hds.poll();
        seen.put(hd, node.val);                      // overwrite = keep last
        if (node.left != null)  { nodes.add(node.left);  hds.add(hd - 1); }
        if (node.right != null) { nodes.add(node.right); hds.add(hd + 1); }
    }
    return new ArrayList<>(seen.values());
}

// Vertical order (LC 987): group by column, sort each by (row, value).
List<List<Integer>> verticalOrder(TreeNode root) {
    TreeMap<Integer,List<int[]>> cols = new TreeMap<>();
    Queue<Object[]> q = new LinkedList<>();
    if (root != null) q.add(new Object[]{root, 0, 0});
    while (!q.isEmpty()) {
        Object[] cur = q.poll();
        TreeNode node = (TreeNode) cur[0]; int r = (int) cur[1], c = (int) cur[2];
        cols.computeIfAbsent(c, z -> new ArrayList<>()).add(new int[]{r, node.val});
        if (node.left != null)  q.add(new Object[]{node.left,  r + 1, c - 1});
        if (node.right != null) q.add(new Object[]{node.right, r + 1, c + 1});
    }
    List<List<Integer>> res = new ArrayList<>();
    for (List<int[]> col : cols.values()) {
        col.sort((a, b) -> a[0] != b[0] ? a[0] - b[0] : a[1] - b[1]);
        List<Integer> out = new ArrayList<>();
        for (int[] rv : col) out.add(rv[1]);
        res.add(out);
    }
    return res;
}

// Boundary (anti-clockwise): root, left edge, leaves L->R, right edge up.
boolean isLeaf(TreeNode n) { return n.left == null && n.right == null; }
void addLeaves(TreeNode n, List<Integer> res) {
    if (n == null) return;
    if (isLeaf(n)) { res.add(n.val); return; }
    addLeaves(n.left, res); addLeaves(n.right, res);
}
List<Integer> boundary(TreeNode root) {
    List<Integer> res = new ArrayList<>();
    if (root == null) return res;
    res.add(root.val);
    for (TreeNode n = root.left; n != null; n = (n.left != null ? n.left : n.right))
        if (!isLeaf(n)) res.add(n.val);              // left edge, no leaves
    if (!isLeaf(root)) { addLeaves(root.left, res); addLeaves(root.right, res); }
    List<Integer> right = new ArrayList<>();
    for (TreeNode n = root.right; n != null; n = (n.right != null ? n.right : n.left))
        if (!isLeaf(n)) right.add(n.val);
    Collections.reverse(right);                      // right edge bottom-up
    res.addAll(right);
    return res;
}`,
        cpp:
`// Morris INORDER (L, Node, R): visit when REMOVING the thread. O(1) space.
vector<int> morrisInorder(TreeNode* root) {
    vector<int> out; TreeNode* cur = root;
    while (cur) {
        if (!cur->left) { out.push_back(cur->val); cur = cur->right; }
        else {
            TreeNode* pre = cur->left;
            while (pre->right && pre->right != cur) pre = pre->right;
            if (!pre->right) { pre->right = cur; cur = cur->left; }
            else { pre->right = nullptr; out.push_back(cur->val); cur = cur->right; }
        }
    }
    return out;
}

// Morris PREORDER (Node, L, R): visit when CREATING the thread.
vector<int> morrisPreorder(TreeNode* root) {
    vector<int> out; TreeNode* cur = root;
    while (cur) {
        if (!cur->left) { out.push_back(cur->val); cur = cur->right; }
        else {
            TreeNode* pre = cur->left;
            while (pre->right && pre->right != cur) pre = pre->right;
            if (!pre->right) { out.push_back(cur->val); pre->right = cur; cur = cur->left; }
            else { pre->right = nullptr; cur = cur->right; }
        }
    }
    return out;
}

// Top View: first node per horizontal distance (BFS). Bottom: last.
vector<int> topView(TreeNode* root) {
    map<int,int> seen;
    queue<pair<TreeNode*,int>> q;
    if (root) q.push({root, 0});
    while (!q.empty()) {
        auto [node, hd] = q.front(); q.pop();
        if (!seen.count(hd)) seen[hd] = node->val;   // first wins = top
        if (node->left)  q.push({node->left,  hd - 1});
        if (node->right) q.push({node->right, hd + 1});
    }
    vector<int> res; for (auto& [k, v] : seen) res.push_back(v);
    return res;
}
vector<int> bottomView(TreeNode* root) {
    map<int,int> seen;
    queue<pair<TreeNode*,int>> q;
    if (root) q.push({root, 0});
    while (!q.empty()) {
        auto [node, hd] = q.front(); q.pop();
        seen[hd] = node->val;                        // overwrite = keep last
        if (node->left)  q.push({node->left,  hd - 1});
        if (node->right) q.push({node->right, hd + 1});
    }
    vector<int> res; for (auto& [k, v] : seen) res.push_back(v);
    return res;
}

// Vertical order (LC 987): group by column, sort each by (row, value).
vector<vector<int>> verticalOrder(TreeNode* root) {
    map<int, vector<pair<int,int>>> cols;   // col -> {row, val}
    queue<tuple<TreeNode*,int,int>> q;
    if (root) q.push({root, 0, 0});
    while (!q.empty()) {
        auto [node, r, c] = q.front(); q.pop();
        cols[c].push_back({r, node->val});
        if (node->left)  q.push({node->left,  r + 1, c - 1});
        if (node->right) q.push({node->right, r + 1, c + 1});
    }
    vector<vector<int>> res;
    for (auto& [c, v] : cols) {
        sort(v.begin(), v.end());
        vector<int> out; for (auto& [r, val] : v) out.push_back(val);
        res.push_back(out);
    }
    return res;
}

// Boundary (anti-clockwise): root, left edge, leaves L->R, right edge up.
bool isLeaf(TreeNode* n) { return !n->left && !n->right; }
void addLeaves(TreeNode* n, vector<int>& res) {
    if (!n) return;
    if (isLeaf(n)) { res.push_back(n->val); return; }
    addLeaves(n->left, res); addLeaves(n->right, res);
}
vector<int> boundary(TreeNode* root) {
    vector<int> res;
    if (!root) return res;
    res.push_back(root->val);
    for (TreeNode* n = root->left; n; n = (n->left ? n->left : n->right))
        if (!isLeaf(n)) res.push_back(n->val);       // left edge, no leaves
    if (!isLeaf(root)) { addLeaves(root->left, res); addLeaves(root->right, res); }
    vector<int> right;
    for (TreeNode* n = root->right; n; n = (n->right ? n->right : n->left))
        if (!isLeaf(n)) right.push_back(n->val);
    reverse(right.begin(), right.end());             // right edge bottom-up
    for (int v : right) res.push_back(v);
    return res;
}`,
        js:
`// Morris INORDER (L, Node, R): visit when REMOVING the thread. O(1) space.
function morrisInorder(root) {
  const out = []; let cur = root;
  while (cur) {
    if (!cur.left) { out.push(cur.val); cur = cur.right; }
    else {
      let pre = cur.left;
      while (pre.right && pre.right !== cur) pre = pre.right;
      if (!pre.right) { pre.right = cur; cur = cur.left; }
      else { pre.right = null; out.push(cur.val); cur = cur.right; }
    }
  }
  return out;
}

// Morris PREORDER (Node, L, R): visit when CREATING the thread.
function morrisPreorder(root) {
  const out = []; let cur = root;
  while (cur) {
    if (!cur.left) { out.push(cur.val); cur = cur.right; }
    else {
      let pre = cur.left;
      while (pre.right && pre.right !== cur) pre = pre.right;
      if (!pre.right) { out.push(cur.val); pre.right = cur; cur = cur.left; }
      else { pre.right = null; cur = cur.right; }
    }
  }
  return out;
}

// Top View: first node per horizontal distance (BFS). Bottom: last.
function topView(root) {
  if (!root) return [];
  const seen = new Map(); let q = [[root, 0]];
  while (q.length) {
    const next = [];
    for (const [node, hd] of q) {
      if (!seen.has(hd)) seen.set(hd, node.val);     // first wins = top
      if (node.left)  next.push([node.left,  hd - 1]);
      if (node.right) next.push([node.right, hd + 1]);
    }
    q = next;
  }
  return [...seen.keys()].sort((a, b) => a - b).map(k => seen.get(k));
}
function bottomView(root) {
  if (!root) return [];
  const seen = new Map(); let q = [[root, 0]];
  while (q.length) {
    const next = [];
    for (const [node, hd] of q) {
      seen.set(hd, node.val);                        // overwrite = keep last
      if (node.left)  next.push([node.left,  hd - 1]);
      if (node.right) next.push([node.right, hd + 1]);
    }
    q = next;
  }
  return [...seen.keys()].sort((a, b) => a - b).map(k => seen.get(k));
}

// Vertical order (LC 987): group by column, sort each by (row, value).
function verticalOrder(root) {
  const cols = new Map();                            // col -> [[row, val], ...]
  let q = root ? [[root, 0, 0]] : [];
  while (q.length) {
    const next = [];
    for (const [node, r, c] of q) {
      if (!cols.has(c)) cols.set(c, []);
      cols.get(c).push([r, node.val]);
      if (node.left)  next.push([node.left,  r + 1, c - 1]);
      if (node.right) next.push([node.right, r + 1, c + 1]);
    }
    q = next;
  }
  return [...cols.keys()].sort((a, b) => a - b).map(c =>
    cols.get(c).sort((x, y) => x[0] - y[0] || x[1] - y[1]).map(rv => rv[1]));
}

// Boundary (anti-clockwise): root, left edge, leaves L->R, right edge up.
function boundary(root) {
  if (!root) return [];
  const isLeaf = n => !n.left && !n.right;
  const res = [root.val];
  for (let n = root.left; n; n = n.left || n.right)
    if (!isLeaf(n)) res.push(n.val);                 // left edge, no leaves
  const addLeaves = n => {
    if (!n) return;
    if (isLeaf(n)) { res.push(n.val); return; }
    addLeaves(n.left); addLeaves(n.right);
  };
  if (!isLeaf(root)) { addLeaves(root.left); addLeaves(root.right); }
  const right = [];
  for (let n = root.right; n; n = n.right || n.left)
    if (!isLeaf(n)) right.push(n.val);
  right.reverse();                                   // right edge bottom-up
  return res.concat(right);
}` },
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
      code: {
        pseudo:
`build a tree from preorder + inorder.
  preorder[0] is the root of the current subtree.
  find the root in inorder at index i:
    inorder[..i-1] = left subtree, inorder[i+1..] = right subtree.
    the i values after the root in preorder are the left subtree.
  recurse on both halves.
  fast O(n): precompute value -> inorder index, walk one preorder
  pointer, and build LEFT before RIGHT (preorder order).`,
        py:
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
        java:
`// Simple O(n^2): scan inorder for the root each time
TreeNode buildTree(int[] preorder, int[] inorder) {
    return build(preorder, 0, inorder, 0, inorder.length - 1);
}
TreeNode build(int[] pre, int ps, int[] in, int lo, int hi) {
    if (lo > hi) return null;
    TreeNode root = new TreeNode(pre[ps]);          // preorder[0] = root
    int i = lo; while (in[i] != root.val) i++;      // split point in inorder
    int leftSize = i - lo;
    root.left  = build(pre, ps + 1, in, lo, i - 1);
    root.right = build(pre, ps + 1 + leftSize, in, i + 1, hi);
    return root;
}

// Optimized O(n): value -> inorder index map, moving preorder pointer
int preIdx = 0;
TreeNode buildTreeFast(int[] preorder, int[] inorder) {
    Map<Integer,Integer> idx = new HashMap<>();
    for (int i = 0; i < inorder.length; i++) idx.put(inorder[i], i);
    preIdx = 0;
    return go(preorder, idx, 0, inorder.length - 1);
}
TreeNode go(int[] preorder, Map<Integer,Integer> idx, int lo, int hi) {
    if (lo > hi) return null;
    TreeNode root = new TreeNode(preorder[preIdx++]);  // next preorder = root
    int mid = idx.get(root.val);
    root.left  = go(preorder, idx, lo, mid - 1);       // build LEFT first
    root.right = go(preorder, idx, mid + 1, hi);
    return root;
}`,
        cpp:
`// Simple O(n^2): scan inorder for the root each time
TreeNode* build(vector<int>& pre, int ps, vector<int>& in, int lo, int hi) {
    if (lo > hi) return nullptr;
    TreeNode* root = new TreeNode(pre[ps]);         // preorder[0] = root
    int i = lo; while (in[i] != root->val) i++;     // split point in inorder
    int leftSize = i - lo;
    root->left  = build(pre, ps + 1, in, lo, i - 1);
    root->right = build(pre, ps + 1 + leftSize, in, i + 1, hi);
    return root;
}
TreeNode* buildTree(vector<int>& preorder, vector<int>& inorder) {
    return build(preorder, 0, inorder, 0, (int)inorder.size() - 1);
}

// Optimized O(n): value -> inorder index map, moving preorder pointer
TreeNode* go(vector<int>& preorder, unordered_map<int,int>& idx,
             int& pre, int lo, int hi) {
    if (lo > hi) return nullptr;
    TreeNode* root = new TreeNode(preorder[pre++]); // next preorder = root
    int mid = idx[root->val];
    root->left  = go(preorder, idx, pre, lo, mid - 1);  // build LEFT first
    root->right = go(preorder, idx, pre, mid + 1, hi);
    return root;
}
TreeNode* buildTreeFast(vector<int>& preorder, vector<int>& inorder) {
    unordered_map<int,int> idx;
    for (int i = 0; i < (int)inorder.size(); i++) idx[inorder[i]] = i;
    int pre = 0;
    return go(preorder, idx, pre, 0, (int)inorder.size() - 1);
}`,
        js:
`// Simple O(n^2): slice + indexOf each time (mirrors the Python)
function buildTree(preorder, inorder) {
  if (!preorder.length || !inorder.length) return null;
  const root = new TreeNode(preorder[0]);           // 1st preorder = root
  const i = inorder.indexOf(root.val);              // split point in inorder
  root.left  = buildTree(preorder.slice(1, i + 1), inorder.slice(0, i));
  root.right = buildTree(preorder.slice(i + 1), inorder.slice(i + 1));
  return root;
}

// Optimized O(n): value -> inorder index map, moving preorder pointer
function buildTreeFast(preorder, inorder) {
  const idx = new Map(inorder.map((v, i) => [v, i]));
  let pre = 0;
  const build = (lo, hi) => {
    if (lo > hi) return null;
    const root = new TreeNode(preorder[pre++]);     // next preorder = root
    const mid = idx.get(root.val);
    root.left  = build(lo, mid - 1);                // build LEFT first
    root.right = build(mid + 1, hi);
    return root;
  };
  return build(0, inorder.length - 1);
}` },
      p: [
      [105, "construct-binary-tree-from-preorder-and-inorder-traversal", "Build Tree (Pre+In)", "M"],
      [106, "construct-binary-tree-from-inorder-and-postorder-traversal", "Build Tree (In+Post)", "M"],
      [114, "flatten-binary-tree-to-linked-list", "Flatten Tree to Linked List", "M"],
      [297, "serialize-and-deserialize-binary-tree", "Serialize & Deserialize", "H"],
    ]},
    { n: "Misc (distance-K, width, complete count)", h: "Convert tree to graph (parent pointers) for distance-K BFS. Count complete tree nodes in O(log²n).",
      note: "<b>Max Width of Binary Tree (LC 662):</b> Give each node a position index like a <b>heap</b> — root = 0, and a node at index <code>i</code> has children <code>2·i</code> (left) and <code>2·i+1</code> (right). The width of a level = <code>lastIndex − firstIndex + 1</code>; the answer is the max over all levels. Both DFS and BFS work — BFS is the natural fit (process level by level; the first node's index is the level's leftmost, the last dequeued is the rightmost). <br><b>Overflow tip:</b> in fixed-int languages, subtract the level's first index from every index to keep numbers small (Python big-ints don't overflow, so it's optional).",
      code: {
        pseudo:
`max width of a binary tree, and counting a complete tree.
  index nodes like a heap: node i -> left 2i, right 2i+1.
  level width = last index - first index + 1; answer = max over levels.
  BFS: per level, first index is the queue front, last is the last dequeued.
  (normalize indices per level, subtract the first, so ints do not overflow.)

  count a complete tree in O(log^2 n):
    lh = left height (always go left), rh = right height (always go right)
    if lh == rh -> perfect subtree, 2^lh - 1 nodes
    else -> 1 + count(left) + count(right)`,
        py:
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
        java:
`// LC 662: index nodes like a heap; width = last - first + 1 per level
int widthBfs(TreeNode root) {
    if (root == null) return 0;
    Queue<TreeNode> nodes = new LinkedList<>();
    Queue<Integer> idxs = new LinkedList<>();
    nodes.add(root); idxs.add(0);
    int best = 0;
    while (!nodes.isEmpty()) {
        int size = nodes.size(), first = idxs.peek(), last = 0;
        for (int i = 0; i < size; i++) {
            TreeNode node = nodes.poll();
            int idx = idxs.poll() - first;      // normalize to avoid overflow
            last = idx;
            if (node.left != null)  { nodes.add(node.left);  idxs.add(2 * idx); }
            if (node.right != null) { nodes.add(node.right); idxs.add(2 * idx + 1); }
        }
        best = Math.max(best, last + 1);
    }
    return best;
}

// DFS: first index seen at each depth is the leftmost node there
Map<Integer,Integer> firstIdx = new HashMap<>();
int bestW = 0;
int widthDfs(TreeNode root) { firstIdx.clear(); bestW = 0; dfs(root, 0, 0); return bestW; }
void dfs(TreeNode node, int depth, int idx) {
    if (node == null) return;
    firstIdx.putIfAbsent(depth, idx);
    bestW = Math.max(bestW, idx - firstIdx.get(depth) + 1);
    dfs(node.left,  depth + 1, 2 * idx);
    dfs(node.right, depth + 1, 2 * idx + 1);
}

// Count nodes in a COMPLETE tree in O(log^2 n)
int countNodes(TreeNode root) {
    if (root == null) return 0;
    int lh = height(root, true), rh = height(root, false);
    if (lh == rh) return (1 << lh) - 1;         // perfect subtree
    return 1 + countNodes(root.left) + countNodes(root.right);
}
int height(TreeNode n, boolean left) {
    int d = 0;
    while (n != null) { n = left ? n.left : n.right; d++; }
    return d;
}`,
        cpp:
`// LC 662: index nodes like a heap; width = last - first + 1 per level
int widthBfs(TreeNode* root) {
    if (!root) return 0;
    queue<pair<TreeNode*, long long>> q;
    q.push({root, 0});
    long long best = 0;
    while (!q.empty()) {
        int size = q.size();
        long long first = q.front().second, last = 0;
        for (int i = 0; i < size; i++) {
            auto [node, idx] = q.front(); q.pop();
            idx -= first;                       // normalize to avoid overflow
            last = idx;
            if (node->left)  q.push({node->left,  2 * idx});
            if (node->right) q.push({node->right, 2 * idx + 1});
        }
        best = max(best, last + 1);
    }
    return (int)best;
}

// DFS: first index seen at each depth is the leftmost node there
unordered_map<int,long long> firstIdx;
long long bestW = 0;
void dfs(TreeNode* node, int depth, long long idx) {
    if (!node) return;
    if (!firstIdx.count(depth)) firstIdx[depth] = idx;
    bestW = max(bestW, idx - firstIdx[depth] + 1);
    dfs(node->left,  depth + 1, 2 * idx);
    dfs(node->right, depth + 1, 2 * idx + 1);
}
int widthDfs(TreeNode* root) { firstIdx.clear(); bestW = 0; dfs(root, 0, 0); return (int)bestW; }

// Count nodes in a COMPLETE tree in O(log^2 n)
int height(TreeNode* n, bool left) {
    int d = 0;
    while (n) { n = left ? n->left : n->right; d++; }
    return d;
}
int countNodes(TreeNode* root) {
    if (!root) return 0;
    int lh = height(root, true), rh = height(root, false);
    if (lh == rh) return (1 << lh) - 1;         // perfect subtree
    return 1 + countNodes(root->left) + countNodes(root->right);
}`,
        js:
`// LC 662: index nodes like a heap; width = last - first + 1 per level
function widthBfs(root) {
  if (!root) return 0;
  let q = [[root, 0]], best = 0;
  while (q.length) {
    const first = q[0][1];
    const next = [];
    let last = 0;
    for (const [node, rawIdx] of q) {
      const idx = rawIdx - first;              // normalize to avoid overflow
      last = idx;
      if (node.left)  next.push([node.left,  2 * idx]);
      if (node.right) next.push([node.right, 2 * idx + 1]);
    }
    best = Math.max(best, last + 1);
    q = next;
  }
  return best;
}

// DFS: first index seen at each depth is the leftmost node there
function widthDfs(root) {
  const first = new Map();
  let best = 0;
  const dfs = (node, depth, idx) => {
    if (!node) return;
    if (!first.has(depth)) first.set(depth, idx);
    best = Math.max(best, idx - first.get(depth) + 1);
    dfs(node.left,  depth + 1, 2 * idx);
    dfs(node.right, depth + 1, 2 * idx + 1);
  };
  dfs(root, 0, 0);
  return best;
}

// Count nodes in a COMPLETE tree in O(log^2 n)
function countNodes(root) {
  if (!root) return 0;
  const height = (n, left) => {
    let d = 0;
    while (n) { n = left ? n.left : n.right; d++; }
    return d;
  };
  const lh = height(root, true), rh = height(root, false);
  if (lh === rh) return (1 << lh) - 1;          // perfect subtree
  return 1 + countNodes(root.left) + countNodes(root.right);
}` },
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
    ], code: {
        pseudo:
`BST search, insert, delete. Each is O(h).
  search: go left if key < node.val else right, until found.
  insert: recurse to the correct side, attach a new node at the gap.
  delete(key):
    key < val -> recurse left;  key > val -> recurse right
    else (found the node):
      0 or 1 child -> return the existing child
      2 children -> copy the inorder successor (min of right subtree),
                    then delete that successor from the right subtree`,
        py:
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
    return root`,
        java:
`TreeNode search(TreeNode root, int key) {
    while (root != null && root.val != key)
        root = (key < root.val) ? root.left : root.right;
    return root;
}

TreeNode insert(TreeNode root, int val) {
    if (root == null) return new TreeNode(val);
    if (val < root.val) root.left = insert(root.left, val);
    else root.right = insert(root.right, val);
    return root;
}

TreeNode deleteNode(TreeNode root, int key) {
    if (root == null) return null;
    if (key < root.val) root.left = deleteNode(root.left, key);
    else if (key > root.val) root.right = deleteNode(root.right, key);
    else {                                    // found the node
        if (root.left == null) return root.right;   // 0 or 1 child
        if (root.right == null) return root.left;   // 1 child
        TreeNode succ = root.right;                 // inorder successor
        while (succ.left != null) succ = succ.left;
        root.val = succ.val;                        // copy value up
        root.right = deleteNode(root.right, succ.val);
    }
    return root;
}`,
        cpp:
`TreeNode* search(TreeNode* root, int key) {
    while (root && root->val != key)
        root = (key < root->val) ? root->left : root->right;
    return root;
}

TreeNode* insert(TreeNode* root, int val) {
    if (!root) return new TreeNode(val);
    if (val < root->val) root->left = insert(root->left, val);
    else root->right = insert(root->right, val);
    return root;
}

TreeNode* deleteNode(TreeNode* root, int key) {
    if (!root) return nullptr;
    if (key < root->val) root->left = deleteNode(root->left, key);
    else if (key > root->val) root->right = deleteNode(root->right, key);
    else {                                    // found the node
        if (!root->left) return root->right;  // 0 or 1 child
        if (!root->right) return root->left;  // 1 child
        TreeNode* succ = root->right;         // inorder successor
        while (succ->left) succ = succ->left;
        root->val = succ->val;                // copy value up
        root->right = deleteNode(root->right, succ->val);
    }
    return root;
}`,
        js:
`function search(root, key) {
  while (root && root.val !== key)
    root = (key < root.val) ? root.left : root.right;
  return root;
}

function insert(root, val) {
  if (!root) return new TreeNode(val);
  if (val < root.val) root.left = insert(root.left, val);
  else root.right = insert(root.right, val);
  return root;
}

function deleteNode(root, key) {
  if (!root) return null;
  if (key < root.val) root.left = deleteNode(root.left, key);
  else if (key > root.val) root.right = deleteNode(root.right, key);
  else {                                     // found the node
    if (!root.left) return root.right;       // 0 or 1 child
    if (!root.right) return root.left;       // 1 child
    let succ = root.right;                    // inorder successor
    while (succ.left) succ = succ.left;
    root.val = succ.val;                       // copy value up
    root.right = deleteNode(root.right, succ.val);
  }
  return root;
}` } },
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
      code: {
        pseudo:
`AVL tree: a BST that rotates to keep height ~ log n.
  each node stores its height; balance factor bf = h(left) - h(right).
  after inserting, update height and check bf at this node:
    bf > 1  and key < left.val   -> LL: right_rotate(node)
    bf < -1 and key > right.val   -> RR: left_rotate(node)
    bf > 1  and key > left.val    -> LR: left_rotate(left); right_rotate(node)
    bf < -1 and key < right.val   -> RL: right_rotate(right); left_rotate(node)
  a rotation relinks 3 nodes and updates 2 heights, all O(1).`,
        py:
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
    return root`,
        java:
`class AVLNode {
    int val, height = 1; AVLNode left, right;
    AVLNode(int v) { val = v; }
}
int h(AVLNode n)   { return n == null ? 0 : n.height; }
int bf(AVLNode n)  { return n == null ? 0 : h(n.left) - h(n.right); }
void upd(AVLNode n){ n.height = 1 + Math.max(h(n.left), h(n.right)); }

AVLNode rightRotate(AVLNode y) {      // fixes LL
    AVLNode x = y.left, T = x.right;
    x.right = y; y.left = T;
    upd(y); upd(x);
    return x;
}
AVLNode leftRotate(AVLNode x) {       // fixes RR
    AVLNode y = x.right, T = y.left;
    y.left = x; x.right = T;
    upd(x); upd(y);
    return y;
}
AVLNode insert(AVLNode root, int key) {
    if (root == null) return new AVLNode(key);
    if (key < root.val) root.left = insert(root.left, key);
    else root.right = insert(root.right, key);
    upd(root);
    int balance = bf(root);
    if (balance > 1 && key < root.left.val) return rightRotate(root);    // LL
    if (balance < -1 && key > root.right.val) return leftRotate(root);   // RR
    if (balance > 1 && key > root.left.val) {                            // LR
        root.left = leftRotate(root.left); return rightRotate(root);
    }
    if (balance < -1 && key < root.right.val) {                          // RL
        root.right = rightRotate(root.right); return leftRotate(root);
    }
    return root;
}`,
        cpp:
`struct AVLNode {
    int val, height = 1; AVLNode *left = nullptr, *right = nullptr;
    AVLNode(int v) : val(v) {}
};
int h(AVLNode* n)    { return n ? n->height : 0; }
int bf(AVLNode* n)   { return n ? h(n->left) - h(n->right) : 0; }
void upd(AVLNode* n) { n->height = 1 + max(h(n->left), h(n->right)); }

AVLNode* rightRotate(AVLNode* y) {    // fixes LL
    AVLNode* x = y->left; AVLNode* T = x->right;
    x->right = y; y->left = T;
    upd(y); upd(x);
    return x;
}
AVLNode* leftRotate(AVLNode* x) {     // fixes RR
    AVLNode* y = x->right; AVLNode* T = y->left;
    y->left = x; x->right = T;
    upd(x); upd(y);
    return y;
}
AVLNode* insert(AVLNode* root, int key) {
    if (!root) return new AVLNode(key);
    if (key < root->val) root->left = insert(root->left, key);
    else root->right = insert(root->right, key);
    upd(root);
    int balance = bf(root);
    if (balance > 1 && key < root->left->val) return rightRotate(root);  // LL
    if (balance < -1 && key > root->right->val) return leftRotate(root); // RR
    if (balance > 1 && key > root->left->val) {                          // LR
        root->left = leftRotate(root->left); return rightRotate(root);
    }
    if (balance < -1 && key < root->right->val) {                        // RL
        root->right = rightRotate(root->right); return leftRotate(root);
    }
    return root;
}`,
        js:
`class AVLNode {
  constructor(val) { this.val = val; this.left = this.right = null; this.height = 1; }
}
const h = n => n ? n.height : 0;
const bf = n => n ? h(n.left) - h(n.right) : 0;
const upd = n => { n.height = 1 + Math.max(h(n.left), h(n.right)); };

function rightRotate(y) {              // fixes LL
  const x = y.left, T = x.right;
  x.right = y; y.left = T;
  upd(y); upd(x);
  return x;
}
function leftRotate(x) {               // fixes RR
  const y = x.right, T = y.left;
  y.left = x; x.right = T;
  upd(x); upd(y);
  return y;
}
function insert(root, key) {
  if (!root) return new AVLNode(key);
  if (key < root.val) root.left = insert(root.left, key);
  else root.right = insert(root.right, key);
  upd(root);
  const balance = bf(root);
  if (balance > 1 && key < root.left.val) return rightRotate(root);      // LL
  if (balance < -1 && key > root.right.val) return leftRotate(root);     // RR
  if (balance > 1 && key > root.left.val) {                              // LR
    root.left = leftRotate(root.left); return rightRotate(root);
  }
  if (balance < -1 && key < root.right.val) {                            // RL
    root.right = rightRotate(root.right); return leftRotate(root);
  }
  return root;
}` } },
    { n: "B-Tree / B+ Tree (disk-based)", h: "Balanced trees built for <b>disk/SSD</b>, not RAM. A node holds <b>many keys</b> (= one disk page), so the tree is very <b>shallow</b> → far fewer disk reads than a BST/AVL. This is what powers <b>database indexes</b>.",
      note: "<b>Why not a BST/AVL for a database?</b> A BST stores one key per node, so its height is ~log₂(n) — for a billion rows that's ~30 levels = ~30 disk seeks. A B-tree packs hundreds of keys per node (one disk page), so height is ~log₍ₘ₎(n) — often just <b>3–4 levels</b> = 3–4 disk reads. Disk I/O dominates, so fewer, larger nodes win.<br><br>" +
        "<b>B-tree properties (order m):</b> each internal node has up to <code>m</code> children and <code>m−1</code> sorted keys; <b>all leaves are at the same depth</b>; it stays balanced by <b>splitting</b> a node on overflow and <b>borrowing/merging</b> on underflow. Search/insert/delete are O(log n) with a tiny constant.<br><br>" +
        "<b>B+ tree (what most DBs actually use):</b> all <b>data lives in the leaves</b>; internal nodes hold only routing keys; and the <b>leaves are linked together</b>. This makes <b>range scans</b> and ordered/sequential reads very fast (walk the leaf linked-list). Used by MySQL <b>InnoDB</b>, PostgreSQL, and many filesystems.<br><br>" +
        "<b>B-tree vs B+ tree:</b> B-tree can store data in internal nodes (point lookups may end early higher up); B+ tree keeps all data in leaves (uniform lookups + fast ranges). No standard LeetCode/GFG problem — this is a <b>system-design / theory</b> topic.",
      code: {
        pseudo:
`a B-tree node holds sorted keys with child pointers between them.
  search(node, key):
    scan keys while key > keys[i]
    if keys[i] == key -> found (node, i)
    if node is a leaf -> not present
    else descend into children[i]
  height ~ log_m(n) with m keys per page, so ~3-4 disk reads for 1e9 keys.`,
        py:
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
# Fewer levels = fewer disk reads = why databases use B/B+ trees.`,
        java:
`class BTreeNode {
    List<Integer> keys = new ArrayList<>();       // sorted keys in this node
    List<BTreeNode> children = new ArrayList<>(); // size = keys+1 if internal
    boolean leaf;
    BTreeNode(boolean leaf) { this.leaf = leaf; }
}

// Returns {node, index} of the key, or null if absent
Object[] search(BTreeNode node, int key) {
    int i = 0;
    while (i < node.keys.size() && key > node.keys.get(i)) i++;   // scan keys
    if (i < node.keys.size() && node.keys.get(i) == key) return new Object[]{node, i};
    if (node.leaf) return null;                                   // not present
    return search(node.children.get(i), key);                     // descend
}

// BST/AVL height ~ log2(n) (~30 levels for 1e9); B-tree ~ log_m(n)
// (~3-4 levels). Fewer levels = fewer disk reads: why DBs use B/B+ trees.`,
        cpp:
`struct BTreeNode {
    vector<int> keys;                 // sorted keys in this node
    vector<BTreeNode*> children;      // size = keys+1 if internal
    bool leaf;
    BTreeNode(bool l) : leaf(l) {}
};

// Returns {node, index}, or {nullptr, -1} if absent
pair<BTreeNode*,int> search(BTreeNode* node, int key) {
    int i = 0;
    while (i < (int)node->keys.size() && key > node->keys[i]) i++;  // scan keys
    if (i < (int)node->keys.size() && node->keys[i] == key) return {node, i};
    if (node->leaf) return {nullptr, -1};                          // not present
    return search(node->children[i], key);                         // descend
}

// BST/AVL height ~ log2(n) (~30 levels for 1e9); B-tree ~ log_m(n)
// (~3-4 levels). Fewer levels = fewer disk reads: why DBs use B/B+ trees.`,
        js:
`class BTreeNode {
  constructor(leaf = false) {
    this.keys = [];          // sorted keys in this node
    this.children = [];      // size = keys+1 if internal
    this.leaf = leaf;
  }
}

// Returns [node, index], or null if absent
function search(node, key) {
  let i = 0;
  while (i < node.keys.length && key > node.keys[i]) i++;   // scan keys
  if (i < node.keys.length && node.keys[i] === key) return [node, i];
  if (node.leaf) return null;                               // not present
  return search(node.children[i], key);                     // descend
}

// BST/AVL height ~ log2(n) (~30 levels for 1e9); B-tree ~ log_m(n)
// (~3-4 levels). Fewer levels = fewer disk reads: why DBs use B/B+ trees.` } },
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
      code: {
        pseudo:
`UNDIRECTED (visited + parent): a visited neighbor that is not the
parent means a cycle.
  DFS(u, parent): mark u; for each neighbor v:
    v unseen -> recurse with parent u; if it found a cycle, return true
    else if v != parent -> cycle
  BFS: same idea, the queue stores (node, parent).
  DSU: for each edge, if both ends already share a root -> cycle.

DIRECTED (visited + recursion-stack):
  DFS: rec[u] marks nodes on the current path;
    an edge to a node with rec = true is a back-edge = cycle.
    (3-color variant: 0 unseen, 1 in path, 2 done.)
  Kahn (BFS): if the number of processed nodes != V, a cycle exists.`,
        py:
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
        java:
`// ===== UNDIRECTED: a visited non-parent neighbor means a cycle =====
boolean cycUndirectedDfs(int n, List<List<Integer>> adj) {
    boolean[] seen = new boolean[n];
    for (int i = 0; i < n; i++)
        if (!seen[i] && udfs(i, -1, adj, seen)) return true;
    return false;
}
boolean udfs(int u, int parent, List<List<Integer>> adj, boolean[] seen) {
    seen[u] = true;
    for (int v : adj.get(u)) {
        if (!seen[v]) { if (udfs(v, u, adj, seen)) return true; }
        else if (v != parent) return true;      // visited & not parent -> cycle
    }
    return false;
}

boolean cycUndirectedBfs(int n, List<List<Integer>> adj) {
    boolean[] seen = new boolean[n];
    for (int s = 0; s < n; s++) {
        if (seen[s]) continue;
        seen[s] = true;
        Queue<int[]> q = new LinkedList<>(); q.add(new int[]{s, -1});
        while (!q.isEmpty()) {
            int[] cur = q.poll(); int u = cur[0], par = cur[1];
            for (int v : adj.get(u)) {
                if (!seen[v]) { seen[v] = true; q.add(new int[]{v, u}); }
                else if (v != par) return true;
            }
        }
    }
    return false;
}

// Union-Find: an edge whose ends already share a root closes a cycle
boolean cycUndirectedDsu(int n, int[][] edges) {
    int[] parent = new int[n];
    for (int i = 0; i < n; i++) parent[i] = i;
    for (int[] e : edges) {
        int ru = find(parent, e[0]), rv = find(parent, e[1]);
        if (ru == rv) return true;
        parent[ru] = rv;
    }
    return false;
}
int find(int[] parent, int x) {
    while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x]; }
    return x;
}

// ===== DIRECTED: a back-edge to a node on the current path is a cycle =====
boolean cycDirectedDfs(int n, List<List<Integer>> adj) {
    boolean[] visited = new boolean[n], rec = new boolean[n];  // rec = in path
    for (int i = 0; i < n; i++)
        if (!visited[i] && ddfs(i, adj, visited, rec)) return true;
    return false;
}
boolean ddfs(int u, List<List<Integer>> adj, boolean[] visited, boolean[] rec) {
    visited[u] = rec[u] = true;
    for (int v : adj.get(u)) {
        if (!visited[v] && ddfs(v, adj, visited, rec)) return true;
        else if (rec[v]) return true;           // back-edge to current path
    }
    rec[u] = false;                             // pop from recursion stack
    return false;
}

// 3-color variant: 0 = unseen, 1 = in path, 2 = done
boolean cycDirectedColor(int n, List<List<Integer>> adj) {
    int[] state = new int[n];
    for (int i = 0; i < n; i++)
        if (state[i] == 0 && cdfs(i, adj, state)) return true;
    return false;
}
boolean cdfs(int u, List<List<Integer>> adj, int[] state) {
    state[u] = 1;
    for (int v : adj.get(u)) {
        if (state[v] == 1) return true;         // back-edge -> cycle
        if (state[v] == 0 && cdfs(v, adj, state)) return true;
    }
    state[u] = 2;
    return false;
}

// Kahn's: if the processed count != V, a cycle exists
boolean cycDirectedBfs(int n, List<List<Integer>> adj) {
    int[] indeg = new int[n];
    for (int u = 0; u < n; u++) for (int v : adj.get(u)) indeg[v]++;
    Queue<Integer> q = new LinkedList<>();
    for (int i = 0; i < n; i++) if (indeg[i] == 0) q.add(i);
    int processed = 0;
    while (!q.isEmpty()) {
        int u = q.poll(); processed++;
        for (int v : adj.get(u)) if (--indeg[v] == 0) q.add(v);
    }
    return processed != n;
}`,
        cpp:
`// ===== UNDIRECTED: a visited non-parent neighbor means a cycle =====
bool udfs(int u, int parent, vector<vector<int>>& adj, vector<bool>& seen) {
    seen[u] = true;
    for (int v : adj[u]) {
        if (!seen[v]) { if (udfs(v, u, adj, seen)) return true; }
        else if (v != parent) return true;      // visited & not parent -> cycle
    }
    return false;
}
bool cycUndirectedDfs(int n, vector<vector<int>>& adj) {
    vector<bool> seen(n, false);
    for (int i = 0; i < n; i++)
        if (!seen[i] && udfs(i, -1, adj, seen)) return true;
    return false;
}

bool cycUndirectedBfs(int n, vector<vector<int>>& adj) {
    vector<bool> seen(n, false);
    for (int s = 0; s < n; s++) {
        if (seen[s]) continue;
        seen[s] = true;
        queue<pair<int,int>> q; q.push({s, -1});
        while (!q.empty()) {
            auto [u, par] = q.front(); q.pop();
            for (int v : adj[u]) {
                if (!seen[v]) { seen[v] = true; q.push({v, u}); }
                else if (v != par) return true;
            }
        }
    }
    return false;
}

// Union-Find: an edge whose ends already share a root closes a cycle
int find(vector<int>& parent, int x) {
    while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x]; }
    return x;
}
bool cycUndirectedDsu(int n, vector<pair<int,int>>& edges) {
    vector<int> parent(n);
    for (int i = 0; i < n; i++) parent[i] = i;
    for (auto& [u, v] : edges) {
        int ru = find(parent, u), rv = find(parent, v);
        if (ru == rv) return true;
        parent[ru] = rv;
    }
    return false;
}

// ===== DIRECTED: a back-edge to a node on the current path is a cycle =====
bool ddfs(int u, vector<vector<int>>& adj, vector<bool>& visited, vector<bool>& rec) {
    visited[u] = rec[u] = true;
    for (int v : adj[u]) {
        if (!visited[v] && ddfs(v, adj, visited, rec)) return true;
        else if (rec[v]) return true;           // back-edge to current path
    }
    rec[u] = false;                             // pop from recursion stack
    return false;
}
bool cycDirectedDfs(int n, vector<vector<int>>& adj) {
    vector<bool> visited(n, false), rec(n, false);
    for (int i = 0; i < n; i++)
        if (!visited[i] && ddfs(i, adj, visited, rec)) return true;
    return false;
}

// 3-color variant: 0 = unseen, 1 = in path, 2 = done
bool cdfs(int u, vector<vector<int>>& adj, vector<int>& state) {
    state[u] = 1;
    for (int v : adj[u]) {
        if (state[v] == 1) return true;         // back-edge -> cycle
        if (state[v] == 0 && cdfs(v, adj, state)) return true;
    }
    state[u] = 2;
    return false;
}
bool cycDirectedColor(int n, vector<vector<int>>& adj) {
    vector<int> state(n, 0);
    for (int i = 0; i < n; i++)
        if (state[i] == 0 && cdfs(i, adj, state)) return true;
    return false;
}

// Kahn's: if the processed count != V, a cycle exists
bool cycDirectedBfs(int n, vector<vector<int>>& adj) {
    vector<int> indeg(n, 0);
    for (int u = 0; u < n; u++) for (int v : adj[u]) indeg[v]++;
    queue<int> q;
    for (int i = 0; i < n; i++) if (indeg[i] == 0) q.push(i);
    int processed = 0;
    while (!q.empty()) {
        int u = q.front(); q.pop(); processed++;
        for (int v : adj[u]) if (--indeg[v] == 0) q.push(v);
    }
    return processed != n;
}`,
        js:
`// ===== UNDIRECTED: a visited non-parent neighbor means a cycle =====
function cycUndirectedDfs(n, adj) {
  const seen = new Array(n).fill(false);
  const dfs = (u, parent) => {
    seen[u] = true;
    for (const v of adj[u]) {
      if (!seen[v]) { if (dfs(v, u)) return true; }
      else if (v !== parent) return true;       // visited & not parent -> cycle
    }
    return false;
  };
  for (let i = 0; i < n; i++) if (!seen[i] && dfs(i, -1)) return true;
  return false;
}

function cycUndirectedBfs(n, adj) {
  const seen = new Array(n).fill(false);
  for (let s = 0; s < n; s++) {
    if (seen[s]) continue;
    seen[s] = true;
    const q = [[s, -1]];
    for (let i = 0; i < q.length; i++) {
      const [u, par] = q[i];
      for (const v of adj[u]) {
        if (!seen[v]) { seen[v] = true; q.push([v, u]); }
        else if (v !== par) return true;
      }
    }
  }
  return false;
}

// Union-Find: an edge whose ends already share a root closes a cycle
function cycUndirectedDsu(n, edges) {
  const parent = Array.from({length: n}, (_, i) => i);
  const find = x => { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; };
  for (const [u, v] of edges) {
    const ru = find(u), rv = find(v);
    if (ru === rv) return true;
    parent[ru] = rv;
  }
  return false;
}

// ===== DIRECTED: a back-edge to a node on the current path is a cycle =====
function cycDirectedDfs(n, adj) {
  const visited = new Array(n).fill(false), rec = new Array(n).fill(false);
  const dfs = u => {
    visited[u] = rec[u] = true;
    for (const v of adj[u]) {
      if (!visited[v] && dfs(v)) return true;
      else if (rec[v]) return true;             // back-edge to current path
    }
    rec[u] = false;                             // pop from recursion stack
    return false;
  };
  for (let i = 0; i < n; i++) if (!visited[i] && dfs(i)) return true;
  return false;
}

// 3-color variant: 0 = unseen, 1 = in path, 2 = done
function cycDirectedColor(n, adj) {
  const state = new Array(n).fill(0);
  const dfs = u => {
    state[u] = 1;
    for (const v of adj[u]) {
      if (state[v] === 1) return true;          // back-edge -> cycle
      if (state[v] === 0 && dfs(v)) return true;
    }
    state[u] = 2;
    return false;
  };
  for (let i = 0; i < n; i++) if (state[i] === 0 && dfs(i)) return true;
  return false;
}

// Kahn's: if the processed count != V, a cycle exists
function cycDirectedBfs(n, adj) {
  const indeg = new Array(n).fill(0);
  for (let u = 0; u < n; u++) for (const v of adj[u]) indeg[v]++;
  const q = [];
  for (let i = 0; i < n; i++) if (indeg[i] === 0) q.push(i);
  let processed = 0;
  for (let i = 0; i < q.length; i++) {
    const u = q[i]; processed++;
    for (const v of adj[u]) if (--indeg[v] === 0) q.push(v);
  }
  return processed !== n;
}` },
      p: [
      [207, "course-schedule", "Course Schedule (directed)", "M"],
      [684, "redundant-connection", "Redundant Connection (undirected)", "M"],
      [802, "find-eventual-safe-states", "Find Eventual Safe States", "M"],
    ]},
    { n: "Topological Sort", h: "Only for DAGs. Two ways: <b>Kahn's (BFS)</b> — repeatedly remove 0 in-degree nodes; <b>DFS</b> — push a node after visiting all its children, then reverse.",
      code: {
        pseudo:
`topological order of a DAG (every edge points forward).
  Kahn (BFS): compute the in-degree of each node.
    start the queue with all in-degree 0 nodes.
    pop u, append to order, decrement neighbors' in-degree,
    enqueue any that reach 0.
    if order has fewer than n nodes -> a cycle existed (not a DAG).
  DFS: visit all children first, then push the node;
    reverse the push order = topological order.`,
        py:
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
        java:
`// Kahn's (BFS on in-degree); empty result => a cycle existed
List<Integer> topoBfs(int n, List<List<Integer>> adj) {
    int[] indeg = new int[n];
    for (int u = 0; u < n; u++) for (int v : adj.get(u)) indeg[v]++;
    Queue<Integer> q = new LinkedList<>();
    for (int i = 0; i < n; i++) if (indeg[i] == 0) q.add(i);
    List<Integer> order = new ArrayList<>();
    while (!q.isEmpty()) {
        int u = q.poll(); order.add(u);
        for (int v : adj.get(u)) if (--indeg[v] == 0) q.add(v);
    }
    return order.size() == n ? order : new ArrayList<>();   // [] => cycle
}

// DFS: push a node after its children, then reverse
List<Integer> topoDfs(int n, List<List<Integer>> adj) {
    boolean[] seen = new boolean[n];
    Deque<Integer> stack = new ArrayDeque<>();
    for (int i = 0; i < n; i++) if (!seen[i]) tdfs(i, adj, seen, stack);
    List<Integer> order = new ArrayList<>();
    while (!stack.isEmpty()) order.add(stack.pop());        // reverse post-order
    return order;
}
void tdfs(int u, List<List<Integer>> adj, boolean[] seen, Deque<Integer> stack) {
    seen[u] = true;
    for (int v : adj.get(u)) if (!seen[v]) tdfs(v, adj, seen, stack);
    stack.push(u);                                          // done with u
}`,
        cpp:
`// Kahn's (BFS on in-degree); empty result => a cycle existed
vector<int> topoBfs(int n, vector<vector<int>>& adj) {
    vector<int> indeg(n, 0);
    for (int u = 0; u < n; u++) for (int v : adj[u]) indeg[v]++;
    queue<int> q;
    for (int i = 0; i < n; i++) if (indeg[i] == 0) q.push(i);
    vector<int> order;
    while (!q.empty()) {
        int u = q.front(); q.pop(); order.push_back(u);
        for (int v : adj[u]) if (--indeg[v] == 0) q.push(v);
    }
    return (int)order.size() == n ? order : vector<int>{};   // {} => cycle
}

// DFS: push a node after its children, then reverse
void tdfs(int u, vector<vector<int>>& adj, vector<bool>& seen, vector<int>& post) {
    seen[u] = true;
    for (int v : adj[u]) if (!seen[v]) tdfs(v, adj, seen, post);
    post.push_back(u);                                       // done with u
}
vector<int> topoDfs(int n, vector<vector<int>>& adj) {
    vector<bool> seen(n, false); vector<int> post;
    for (int i = 0; i < n; i++) if (!seen[i]) tdfs(i, adj, seen, post);
    reverse(post.begin(), post.end());                       // reverse post-order
    return post;
}`,
        js:
`// Kahn's (BFS on in-degree); empty result => a cycle existed
function topoBfs(n, adj) {
  const indeg = new Array(n).fill(0);
  for (let u = 0; u < n; u++) for (const v of adj[u]) indeg[v]++;
  const q = [];
  for (let i = 0; i < n; i++) if (indeg[i] === 0) q.push(i);
  const order = [];
  for (let i = 0; i < q.length; i++) {
    const u = q[i]; order.push(u);
    for (const v of adj[u]) if (--indeg[v] === 0) q.push(v);
  }
  return order.length === n ? order : [];        // [] => cycle
}

// DFS: push a node after its children, then reverse
function topoDfs(n, adj) {
  const seen = new Array(n).fill(false), post = [];
  const dfs = u => {
    seen[u] = true;
    for (const v of adj[u]) if (!seen[v]) dfs(v);
    post.push(u);                                // done with u
  };
  for (let i = 0; i < n; i++) if (!seen[i]) dfs(i);
  return post.reverse();                         // reverse = topological order
}` },
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
      code: {
        pseudo:
`Union-Find (DSU): near O(1) with path compression + union by rank.
  find(x): follow parents to the root, halving the path on the way.
  union(a, b): join the two roots, hang the smaller rank under the larger.
Kruskal's MST: sort edges by weight; add an edge only if it joins two
  different sets; stop after n-1 edges.
Prim's MST: grow from a start node; a min-heap of crossing edges gives
  the cheapest edge that reaches a new node.`,
        py:
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
        java:
`// DSU: path compression + union by rank
class DSU {
    int[] parent, rank;
    DSU(int n) {
        parent = new int[n]; rank = new int[n];
        for (int i = 0; i < n; i++) parent[i] = i;
    }
    int find(int x) {
        while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x]; }
        return x;
    }
    boolean union(int a, int b) {
        int ra = find(a), rb = find(b);
        if (ra == rb) return false;              // already connected
        if (rank[ra] < rank[rb]) { int t = ra; ra = rb; rb = t; }
        parent[rb] = ra;
        if (rank[ra] == rank[rb]) rank[ra]++;
        return true;
    }
}

// Kruskal: sort edges {w, u, v}, add an edge only if it joins two sets
int kruskal(int n, int[][] edges) {
    Arrays.sort(edges, (a, b) -> Integer.compare(a[0], b[0]));
    DSU dsu = new DSU(n);
    int total = 0, used = 0;
    for (int[] e : edges)
        if (dsu.union(e[1], e[2])) {
            total += e[0];
            if (++used == n - 1) break;
        }
    return total;
}

// Prim: grow the tree with a min-heap of crossing edges. adj[u] = {v, w}
int prim(int n, List<List<int[]>> adj, int start) {
    boolean[] seen = new boolean[n];
    PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> Integer.compare(a[0], b[0]));
    pq.add(new int[]{0, start});
    int total = 0;
    while (!pq.isEmpty()) {
        int[] top = pq.poll(); int w = top[0], u = top[1];
        if (seen[u]) continue;
        seen[u] = true; total += w;              // add cheapest crossing edge
        for (int[] e : adj.get(u))
            if (!seen[e[0]]) pq.add(new int[]{e[1], e[0]});
    }
    return total;
}`,
        cpp:
`// DSU: path compression + union by rank
struct DSU {
    vector<int> parent, rnk;
    DSU(int n) : parent(n), rnk(n, 0) { for (int i = 0; i < n; i++) parent[i] = i; }
    int find(int x) {
        while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x]; }
        return x;
    }
    bool unite(int a, int b) {
        int ra = find(a), rb = find(b);
        if (ra == rb) return false;              // already connected
        if (rnk[ra] < rnk[rb]) swap(ra, rb);
        parent[rb] = ra;
        if (rnk[ra] == rnk[rb]) rnk[ra]++;
        return true;
    }
};

// Kruskal: edges = {w, u, v}, add an edge only if it joins two sets
int kruskal(int n, vector<array<int,3>>& edges) {
    sort(edges.begin(), edges.end());
    DSU dsu(n); int total = 0, used = 0;
    for (auto& e : edges)
        if (dsu.unite(e[1], e[2])) {
            total += e[0];
            if (++used == n - 1) break;
        }
    return total;
}

// Prim: grow the tree with a min-heap of crossing edges. adj[u] = {v, w}
int prim(int n, vector<vector<pair<int,int>>>& adj, int start) {
    vector<bool> seen(n, false);
    priority_queue<pair<int,int>, vector<pair<int,int>>, greater<>> pq;
    pq.push({0, start});
    int total = 0;
    while (!pq.empty()) {
        auto [w, u] = pq.top(); pq.pop();
        if (seen[u]) continue;
        seen[u] = true; total += w;              // add cheapest crossing edge
        for (auto [v, wt] : adj[u])
            if (!seen[v]) pq.push({wt, v});
    }
    return total;
}`,
        js:
`// DSU: path compression + union by rank
class DSU {
  constructor(n) {
    this.parent = Array.from({length: n}, (_, i) => i);
    this.rank = new Array(n).fill(0);
  }
  find(x) {
    while (this.parent[x] !== x) { this.parent[x] = this.parent[this.parent[x]]; x = this.parent[x]; }
    return x;
  }
  union(a, b) {
    let ra = this.find(a), rb = this.find(b);
    if (ra === rb) return false;               // already connected
    if (this.rank[ra] < this.rank[rb]) [ra, rb] = [rb, ra];
    this.parent[rb] = ra;
    if (this.rank[ra] === this.rank[rb]) this.rank[ra]++;
    return true;
  }
}

// Kruskal: edges = [[w, u, v], ...], add an edge only if it joins two sets
function kruskal(n, edges) {
  edges.sort((a, b) => a[0] - b[0]);
  const dsu = new DSU(n);
  let total = 0, used = 0;
  for (const [w, u, v] of edges)
    if (dsu.union(u, v)) {
      total += w;
      if (++used === n - 1) break;
    }
  return total;
}

// Prim: grow the tree with a min-heap of crossing edges. adj[u] = [[v, w], ...]
function prim(n, adj, start = 0) {
  const seen = new Array(n).fill(false);
  const pq = new MinHeap(x => x[0]);           // [w, u]
  pq.push([0, start]);
  let total = 0;
  while (pq.size) {
    const [w, u] = pq.pop();
    if (seen[u]) continue;
    seen[u] = true; total += w;                // add cheapest crossing edge
    for (const [v, wt] of adj[u])
      if (!seen[v]) pq.push([wt, v]);
  }
  return total;
}
// minimal binary min-heap with a key function
class MinHeap {
  constructor(key = x => x) { this.a = []; this.key = key; }
  get size() { return this.a.length; }
  push(x) { const a = this.a, k = this.key; a.push(x); let i = a.length - 1;
    while (i && k(a[(i-1)>>1]) > k(a[i])) { [a[(i-1)>>1],a[i]]=[a[i],a[(i-1)>>1]]; i=(i-1)>>1; } }
  pop() { const a = this.a, k = this.key, t = a[0], l = a.pop();
    if (a.length) { a[0]=l; let i=0,n=a.length;
      for(;;){ let x=2*i+1,y=2*i+2,m=i;
        if(x<n&&k(a[x])<k(a[m]))m=x; if(y<n&&k(a[y])<k(a[m]))m=y;
        if(m===i)break; [a[m],a[i]]=[a[i],a[m]]; i=m; } }
    return t; }
}` },
      p: [
      [547, "number-of-provinces", "Number of Provinces", "M"],
      [1584, "min-cost-to-connect-all-points", "Min Cost Connect Points (MST)", "M"],
      [1319, "number-of-operations-to-make-network-connected", "Make Network Connected", "M"],
    ]},
    { n: "Advanced (bridges / SCC / bipartite)", h: "<b>Bipartite</b> = 2-coloring (BFS or DFS); conflict → not bipartite. <b>Kosaraju</b> finds SCCs with 2 passes (topo sort by finish time, then DFS the transposed graph in reverse topo order).",
      code: {
        pseudo:
`Bipartite check (2-coloring): color the graph +1 / -1.
  BFS: color the start +1, color each neighbor the opposite;
       if a neighbor already has your color -> not bipartite.
  DFS: same idea, recursively.

Kosaraju's SCC (two DFS passes):
  1) DFS the graph, push each node when finished (finish-time order).
  2) transpose the graph (reverse every edge).
  3) DFS the transpose in reverse finish order;
     each DFS tree is one strongly connected component.`,
        py:
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
        java:
`// Bipartite BFS: color +1 / -1; a same-color neighbor breaks it
boolean isBipartiteBfs(int n, List<List<Integer>> adj) {
    int[] color = new int[n];
    for (int s = 0; s < n; s++) {
        if (color[s] != 0) continue;
        color[s] = 1;
        Queue<Integer> q = new LinkedList<>(); q.add(s);
        while (!q.isEmpty()) {
            int u = q.poll();
            for (int v : adj.get(u)) {
                if (color[v] == color[u]) return false;   // conflict
                if (color[v] == 0) { color[v] = -color[u]; q.add(v); }
            }
        }
    }
    return true;
}

// Bipartite DFS: same idea, recursive
int[] color;
boolean isBipartiteDfs(int n, List<List<Integer>> adj) {
    color = new int[n];
    for (int i = 0; i < n; i++)
        if (color[i] == 0 && !bdfs(i, 1, adj)) return false;
    return true;
}
boolean bdfs(int u, int c, List<List<Integer>> adj) {
    color[u] = c;
    for (int v : adj.get(u)) {
        if (color[v] == c) return false;
        if (color[v] == 0 && !bdfs(v, -c, adj)) return false;
    }
    return true;
}

// Kosaraju's SCC: finish-order DFS, transpose, DFS transpose in reverse
List<List<Integer>> kosaraju(int n, List<List<Integer>> adj) {
    boolean[] seen = new boolean[n];
    Deque<Integer> order = new ArrayDeque<>();
    for (int i = 0; i < n; i++) if (!seen[i]) fillOrder(i, adj, seen, order);
    List<List<Integer>> radj = new ArrayList<>();
    for (int i = 0; i < n; i++) radj.add(new ArrayList<>());
    for (int u = 0; u < n; u++) for (int v : adj.get(u)) radj.get(v).add(u);
    boolean[] seen2 = new boolean[n];
    List<List<Integer>> sccs = new ArrayList<>();
    while (!order.isEmpty()) {
        int u = order.pop();
        if (!seen2[u]) {
            List<Integer> comp = new ArrayList<>();
            collect(u, radj, seen2, comp);
            sccs.add(comp);
        }
    }
    return sccs;
}
void fillOrder(int u, List<List<Integer>> adj, boolean[] seen, Deque<Integer> order) {
    seen[u] = true;
    for (int v : adj.get(u)) if (!seen[v]) fillOrder(v, adj, seen, order);
    order.push(u);                              // finished -> push
}
void collect(int u, List<List<Integer>> radj, boolean[] seen, List<Integer> comp) {
    seen[u] = true; comp.add(u);
    for (int v : radj.get(u)) if (!seen[v]) collect(v, radj, seen, comp);
}`,
        cpp:
`// Bipartite BFS: color +1 / -1; a same-color neighbor breaks it
bool isBipartiteBfs(int n, vector<vector<int>>& adj) {
    vector<int> color(n, 0);
    for (int s = 0; s < n; s++) {
        if (color[s] != 0) continue;
        color[s] = 1; queue<int> q; q.push(s);
        while (!q.empty()) {
            int u = q.front(); q.pop();
            for (int v : adj[u]) {
                if (color[v] == color[u]) return false;   // conflict
                if (color[v] == 0) { color[v] = -color[u]; q.push(v); }
            }
        }
    }
    return true;
}

// Bipartite DFS: same idea, recursive
bool bdfs(int u, int c, vector<vector<int>>& adj, vector<int>& color) {
    color[u] = c;
    for (int v : adj[u]) {
        if (color[v] == c) return false;
        if (color[v] == 0 && !bdfs(v, -c, adj, color)) return false;
    }
    return true;
}
bool isBipartiteDfs(int n, vector<vector<int>>& adj) {
    vector<int> color(n, 0);
    for (int i = 0; i < n; i++)
        if (color[i] == 0 && !bdfs(i, 1, adj, color)) return false;
    return true;
}

// Kosaraju's SCC: finish-order DFS, transpose, DFS transpose in reverse
void fillOrder(int u, vector<vector<int>>& adj, vector<bool>& seen, vector<int>& order) {
    seen[u] = true;
    for (int v : adj[u]) if (!seen[v]) fillOrder(v, adj, seen, order);
    order.push_back(u);                         // finished -> push
}
void collect(int u, vector<vector<int>>& radj, vector<bool>& seen, vector<int>& comp) {
    seen[u] = true; comp.push_back(u);
    for (int v : radj[u]) if (!seen[v]) collect(v, radj, seen, comp);
}
vector<vector<int>> kosaraju(int n, vector<vector<int>>& adj) {
    vector<bool> seen(n, false); vector<int> order;
    for (int i = 0; i < n; i++) if (!seen[i]) fillOrder(i, adj, seen, order);
    vector<vector<int>> radj(n);
    for (int u = 0; u < n; u++) for (int v : adj[u]) radj[v].push_back(u);
    vector<bool> seen2(n, false); vector<vector<int>> sccs;
    for (int i = (int)order.size() - 1; i >= 0; i--) {
        int u = order[i];
        if (!seen2[u]) {
            vector<int> comp; collect(u, radj, seen2, comp); sccs.push_back(comp);
        }
    }
    return sccs;
}`,
        js:
`// Bipartite BFS: color +1 / -1; a same-color neighbor breaks it
function isBipartiteBfs(n, adj) {
  const color = new Array(n).fill(0);
  for (let s = 0; s < n; s++) {
    if (color[s] !== 0) continue;
    color[s] = 1;
    const q = [s];
    for (let i = 0; i < q.length; i++) {
      const u = q[i];
      for (const v of adj[u]) {
        if (color[v] === color[u]) return false;   // conflict
        if (color[v] === 0) { color[v] = -color[u]; q.push(v); }
      }
    }
  }
  return true;
}

// Bipartite DFS: same idea, recursive
function isBipartiteDfs(n, adj) {
  const color = new Array(n).fill(0);
  const dfs = (u, c) => {
    color[u] = c;
    for (const v of adj[u]) {
      if (color[v] === c) return false;
      if (color[v] === 0 && !dfs(v, -c)) return false;
    }
    return true;
  };
  for (let i = 0; i < n; i++) if (color[i] === 0 && !dfs(i, 1)) return false;
  return true;
}

// Kosaraju's SCC: finish-order DFS, transpose, DFS transpose in reverse
function kosaraju(n, adj) {
  const seen = new Array(n).fill(false), order = [];
  const fill = u => {
    seen[u] = true;
    for (const v of adj[u]) if (!seen[v]) fill(v);
    order.push(u);                              // finished -> push
  };
  for (let i = 0; i < n; i++) if (!seen[i]) fill(i);
  const radj = Array.from({length: n}, () => []);
  for (let u = 0; u < n; u++) for (const v of adj[u]) radj[v].push(u);
  const seen2 = new Array(n).fill(false), sccs = [];
  const collect = (u, comp) => {
    seen2[u] = true; comp.push(u);
    for (const v of radj[u]) if (!seen2[v]) collect(v, comp);
  };
  for (let i = order.length - 1; i >= 0; i--) {
    const u = order[i];
    if (!seen2[u]) { const comp = []; collect(u, comp); sccs.push(comp); }
  }
  return sccs;
}` },
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
