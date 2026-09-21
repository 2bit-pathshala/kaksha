/* dsa-code.js — code snippets for DSA notes, keyed by normalized node name.

   A value is either:
     a string            -> a single Python snippet (legacy, still supported)
     { pseudo, py, java, cpp, js }  -> multi-language, any subset present

   dsa-notes.html renders language tabs when the value is an object, and a
   single Python block when it is a string. Keys match the node "n" after
   norm() collapses en/em dashes to a hyphen.
*/
const DSA_CODE = {
      "Fundamental array ops": {
        pseudo:
`rotate array right by k, in place. O(n) time, O(1) space.
  k = k mod n              # k may be larger than n
  reverse the whole array
  reverse the first k elements
  reverse the last n - k elements`,
        py:
`# O(n) time · O(1) space, reverse whole, then reverse the two parts
# rotate array right by k (reverse trick)
def rotate(a, k):
    k %= len(a); a.reverse(); a[:k]=a[:k][::-1]; a[k:]=a[k:][::-1]`,
        java:
`// O(n) time, O(1) space: reverse whole, then the two parts
void rotate(int[] a, int k) {
    int n = a.length; k %= n;
    reverse(a, 0, n - 1);
    reverse(a, 0, k - 1);
    reverse(a, k, n - 1);
}
void reverse(int[] a, int i, int j) {
    while (i < j) { int t = a[i]; a[i++] = a[j]; a[j--] = t; }
}`,
        cpp:
`// O(n) time, O(1) space: reverse whole, then the two parts
void rotate(vector<int>& a, int k) {
    int n = a.size(); k %= n;
    reverse(a.begin(), a.end());
    reverse(a.begin(), a.begin() + k);
    reverse(a.begin() + k, a.end());
}`,
        js:
`// O(n) time, O(1) space: reverse whole, then the two parts
function rotate(a, k) {
  const n = a.length; k %= n;
  const rev = (i, j) => { while (i < j) [a[i], a[j]] = [a[j--], a[i++]]; };
  rev(0, n - 1); rev(0, k - 1); rev(k, n - 1);
}`,
      },
      "Buy/Sell & Pascal": {
        pseudo:
`best profit from buying once then selling later. O(n), O(1).
  lo = +infinity        # cheapest price seen so far
  best = 0
  for each price p
    lo = min(lo, p)             # maybe a cheaper buy
    best = max(best, p - lo)    # sell today vs cheapest buy
  return best`,
        py:
`# O(n) time · O(1) space, track cheapest price seen so far
# best time to buy & sell (one pass)
def max_profit(prices):
    lo, best = float('inf'), 0
    for p in prices:
        lo = min(lo, p); best = max(best, p - lo)
    return best`,
        java:
`// O(n) time, O(1) space: track cheapest price seen so far
int maxProfit(int[] prices) {
    int lo = Integer.MAX_VALUE, best = 0;
    for (int p : prices) {
        lo = Math.min(lo, p);
        best = Math.max(best, p - lo);
    }
    return best;
}`,
        cpp:
`// O(n) time, O(1) space: track cheapest price seen so far
int maxProfit(vector<int>& prices) {
    int lo = INT_MAX, best = 0;
    for (int p : prices) {
        lo = min(lo, p);
        best = max(best, p - lo);
    }
    return best;
}`,
        js:
`// O(n) time, O(1) space: track cheapest price seen so far
function maxProfit(prices) {
  let lo = Infinity, best = 0;
  for (const p of prices) {
    lo = Math.min(lo, p);
    best = Math.max(best, p - lo);
  }
  return best;
}`,
      },
      "Opposite ends (left + right)": {
        pseudo:
`two values summing to target, in a SORTED array. O(n), O(1).
  left = 0, right = n - 1
  while left < right
    s = a[left] + a[right]
    if s == target      -> answer is (left, right)
    else if s < target  -> left = left + 1     # need a bigger sum
    else                -> right = right - 1    # need a smaller sum`,
        py:
`# O(n) time · O(1) space, shrink window from both ends (needs sorted)
def two_sum_sorted(a, target):
    l, r = 0, len(a)-1
    while l < r:
        s = a[l] + a[r]
        if s == target: return (l, r)
        l, r = (l+1, r) if s < target else (l, r-1)`,
        java:
`// O(n) time, O(1) space, array must be sorted
int[] twoSumSorted(int[] a, int target) {
    int l = 0, r = a.length - 1;
    while (l < r) {
        int s = a[l] + a[r];
        if (s == target) return new int[]{l, r};
        if (s < target) l++; else r--;
    }
    return new int[]{-1, -1};
}`,
        cpp:
`// O(n) time, O(1) space, array must be sorted
pair<int,int> twoSumSorted(vector<int>& a, int target) {
    int l = 0, r = (int)a.size() - 1;
    while (l < r) {
        int s = a[l] + a[r];
        if (s == target) return {l, r};
        if (s < target) l++; else r--;
    }
    return {-1, -1};
}`,
        js:
`// O(n) time, O(1) space, array must be sorted
function twoSumSorted(a, target) {
  let l = 0, r = a.length - 1;
  while (l < r) {
    const s = a[l] + a[r];
    if (s === target) return [l, r];
    if (s < target) l++; else r--;
  }
  return [-1, -1];
}`,
      },
      "Same direction (fast & slow)": {
        pseudo:
`move every zero to the end, keep the order of the rest. O(n).
  w = 0                  # write index for the next non-zero
  for r from 0 to n-1
    if a[r] != 0
      swap a[w] and a[r]
      w = w + 1`,
        py:
`# O(n) time · O(1) space, write pointer keeps the kept elements packed
def move_zeroes(a):
    w = 0                       # write index
    for r in range(len(a)):
        if a[r] != 0:
            a[w], a[r] = a[r], a[w]; w += 1`,
        java:
`// O(n) time, O(1) space: write pointer packs the kept elements
void moveZeroes(int[] a) {
    int w = 0;
    for (int r = 0; r < a.length; r++) {
        if (a[r] != 0) { int t = a[w]; a[w] = a[r]; a[r] = t; w++; }
    }
}`,
        cpp:
`// O(n) time, O(1) space: write pointer packs the kept elements
void moveZeroes(vector<int>& a) {
    int w = 0;
    for (int r = 0; r < (int)a.size(); r++) {
        if (a[r] != 0) swap(a[w++], a[r]);
    }
}`,
        js:
`// O(n) time, O(1) space: write pointer packs the kept elements
function moveZeroes(a) {
  let w = 0;
  for (let r = 0; r < a.length; r++) {
    if (a[r] !== 0) { [a[w], a[r]] = [a[r], a[w]]; w++; }
  }
}`,
      },
      "Partition / Dutch National Flag": {
        pseudo:
`sort 0s, 1s, 2s in one pass. O(n), O(1). Three moving walls.
  lo = 0, mid = 0, hi = n-1
  while mid <= hi
    if a[mid] == 0 -> swap a[lo], a[mid]; lo++; mid++
    else if a[mid] == 1 -> mid++
    else                -> swap a[mid], a[hi]; hi--`,
        py:
`# O(n) time · O(1) space, 3 pointers, single pass
def sort_colors(a):             # 0s,1s,2s in one pass
    lo, mid, hi = 0, 0, len(a)-1
    while mid <= hi:
        if a[mid] == 0: a[lo],a[mid]=a[mid],a[lo]; lo+=1; mid+=1
        elif a[mid] == 1: mid += 1
        else: a[mid],a[hi]=a[hi],a[mid]; hi-=1`,
        java:
`// O(n) time, O(1) space: three pointers, single pass
void sortColors(int[] a) {
    int lo = 0, mid = 0, hi = a.length - 1;
    while (mid <= hi) {
        if (a[mid] == 0) swap(a, lo++, mid++);
        else if (a[mid] == 1) mid++;
        else swap(a, mid, hi--);
    }
}
void swap(int[] a, int i, int j) { int t = a[i]; a[i] = a[j]; a[j] = t; }`,
        cpp:
`// O(n) time, O(1) space: three pointers, single pass
void sortColors(vector<int>& a) {
    int lo = 0, mid = 0, hi = (int)a.size() - 1;
    while (mid <= hi) {
        if (a[mid] == 0) swap(a[lo++], a[mid++]);
        else if (a[mid] == 1) mid++;
        else swap(a[mid], a[hi--]);
    }
}`,
        js:
`// O(n) time, O(1) space: three pointers, single pass
function sortColors(a) {
  let lo = 0, mid = 0, hi = a.length - 1;
  const swap = (i, j) => { [a[i], a[j]] = [a[j], a[i]]; };
  while (mid <= hi) {
    if (a[mid] === 0) swap(lo++, mid++);
    else if (a[mid] === 1) mid++;
    else swap(mid, hi--);
  }
}`,
      },
      "Fixed Size": {
        pseudo:
`largest sum of any k consecutive items. O(n), O(1).
  s = sum of the first k items
  best = s
  for r from k to n-1
    s = s + a[r] - a[r-k]    # add the new, drop the old
    best = max(best, s)
  return best`,
        py:
`# O(n) time · O(1) space, slide window: add new, drop old
def max_sum_k(a, k):            # fixed window
    s = sum(a[:k]); best = s
    for r in range(k, len(a)):
        s += a[r] - a[r-k]; best = max(best, s)
    return best`,
        java:
`// O(n) time, O(1) space: slide the window, add new and drop old
int maxSumK(int[] a, int k) {
    int s = 0;
    for (int i = 0; i < k; i++) s += a[i];
    int best = s;
    for (int r = k; r < a.length; r++) {
        s += a[r] - a[r - k];
        best = Math.max(best, s);
    }
    return best;
}`,
        cpp:
`// O(n) time, O(1) space: slide the window, add new and drop old
int maxSumK(vector<int>& a, int k) {
    int s = 0;
    for (int i = 0; i < k; i++) s += a[i];
    int best = s;
    for (int r = k; r < (int)a.size(); r++) {
        s += a[r] - a[r - k];
        best = max(best, s);
    }
    return best;
}`,
        js:
`// O(n) time, O(1) space: slide the window, add new and drop old
function maxSumK(a, k) {
  let s = 0;
  for (let i = 0; i < k; i++) s += a[i];
  let best = s;
  for (let r = k; r < a.length; r++) {
    s += a[r] - a[r - k];
    best = Math.max(best, s);
  }
  return best;
}`,
      },
      "Variable Size (expand-shrink)": {
        pseudo:
`longest substring with no repeated character. O(n).
  last = empty map (char -> last index it was seen)
  left = 0, best = 0
  for r, ch in the string
    if ch is in last and last[ch] >= left
      left = last[ch] + 1        # jump left past the duplicate
    last[ch] = r
    best = max(best, r - left + 1)
  return best`,
        py:
`# O(n) time · O(min(n, charset)) space, grow right, jump left past dup
def longest_no_repeat(s):
    last, left, best = {}, 0, 0
    for r, ch in enumerate(s):
        if ch in last and last[ch] >= left:
            left = last[ch] + 1        # jump past dup
        last[ch] = r
        best = max(best, r - left + 1)
    return best`,
        java:
`// O(n) time, O(min(n, charset)) space: grow right, jump left past dup
int longestNoRepeat(String s) {
    Map<Character,Integer> last = new HashMap<>();
    int left = 0, best = 0;
    for (int r = 0; r < s.length(); r++) {
        char ch = s.charAt(r);
        if (last.containsKey(ch) && last.get(ch) >= left) left = last.get(ch) + 1;
        last.put(ch, r);
        best = Math.max(best, r - left + 1);
    }
    return best;
}`,
        cpp:
`// O(n) time, O(min(n, charset)) space: grow right, jump left past dup
int longestNoRepeat(string s) {
    unordered_map<char,int> last;
    int left = 0, best = 0;
    for (int r = 0; r < (int)s.size(); r++) {
        char ch = s[r];
        if (last.count(ch) && last[ch] >= left) left = last[ch] + 1;
        last[ch] = r;
        best = max(best, r - left + 1);
    }
    return best;
}`,
        js:
`// O(n) time, O(min(n, charset)) space: grow right, jump left past dup
function longestNoRepeat(s) {
  const last = new Map();
  let left = 0, best = 0;
  for (let r = 0; r < s.length; r++) {
    const ch = s[r];
    if (last.has(ch) && last.get(ch) >= left) left = last.get(ch) + 1;
    last.set(ch, r);
    best = Math.max(best, r - left + 1);
  }
  return best;
}`,
      },
      "Prefix Sum": {
        pseudo:
`count subarrays whose sum equals k. O(n), O(n).
  seen = { 0: 1 }        # prefix sum -> how many times seen
  pre = 0, ans = 0
  for x in nums
    pre = pre + x
    ans = ans + seen.get(pre - k, 0)   # a start that leaves sum k
    seen[pre] = seen.get(pre, 0) + 1
  return ans`,
        py:
`# O(n) time · O(n) space, hashmap of prefix-sum frequencies
# count subarrays with sum == k
seen = {0: 1}; pre = ans = 0
for x in nums:
    pre += x
    ans += seen.get(pre - k, 0)
    seen[pre] = seen.get(pre, 0) + 1`,
        java:
`// O(n) time, O(n) space: count prefix sums with a hashmap
int subarraysSumK(int[] nums, int k) {
    Map<Integer,Integer> seen = new HashMap<>();
    seen.put(0, 1);
    int pre = 0, ans = 0;
    for (int x : nums) {
        pre += x;
        ans += seen.getOrDefault(pre - k, 0);
        seen.merge(pre, 1, Integer::sum);
    }
    return ans;
}`,
        cpp:
`// O(n) time, O(n) space: count prefix sums with a hashmap
int subarraysSumK(vector<int>& nums, int k) {
    unordered_map<int,int> seen{{0, 1}};
    int pre = 0, ans = 0;
    for (int x : nums) {
        pre += x;
        ans += seen.count(pre - k) ? seen[pre - k] : 0;
        seen[pre]++;
    }
    return ans;
}`,
        js:
`// O(n) time, O(n) space: count prefix sums with a hashmap
function subarraysSumK(nums, k) {
  const seen = new Map([[0, 1]]);
  let pre = 0, ans = 0;
  for (const x of nums) {
    pre += x;
    ans += seen.get(pre - k) || 0;
    seen.set(pre, (seen.get(pre) || 0) + 1);
  }
  return ans;
}`,
      },
      "Prefix XOR / 2D Prefix": {
        pseudo:
`count subarrays whose XOR equals k. O(n), O(n).
  seen = { 0: 1 }        # prefix XOR -> times seen
  pre = 0, ans = 0
  for x in nums
    pre = pre XOR x
    ans = ans + seen.get(pre XOR k, 0)
    seen[pre] = seen.get(pre, 0) + 1
  return ans`,
        py:
`# O(n) time · O(n) space, hashmap of prefix-XOR frequencies
# subarray XOR = pre[r] ^ pre[l-1]
seen = {0: 1}; pre = ans = 0
for x in nums:
    pre ^= x
    ans += seen.get(pre ^ k, 0)
    seen[pre] = seen.get(pre, 0) + 1`,
        java:
`// O(n) time, O(n) space: count prefix XORs with a hashmap
int subarraysXorK(int[] nums, int k) {
    Map<Integer,Integer> seen = new HashMap<>();
    seen.put(0, 1);
    int pre = 0, ans = 0;
    for (int x : nums) {
        pre ^= x;
        ans += seen.getOrDefault(pre ^ k, 0);
        seen.merge(pre, 1, Integer::sum);
    }
    return ans;
}`,
        cpp:
`// O(n) time, O(n) space: count prefix XORs with a hashmap
int subarraysXorK(vector<int>& nums, int k) {
    unordered_map<int,int> seen{{0, 1}};
    int pre = 0, ans = 0;
    for (int x : nums) {
        pre ^= x;
        ans += seen.count(pre ^ k) ? seen[pre ^ k] : 0;
        seen[pre]++;
    }
    return ans;
}`,
        js:
`// O(n) time, O(n) space: count prefix XORs with a hashmap
function subarraysXorK(nums, k) {
  const seen = new Map([[0, 1]]);
  let pre = 0, ans = 0;
  for (const x of nums) {
    pre ^= x;
    ans += seen.get(pre ^ k) || 0;
    seen.set(pre, (seen.get(pre) || 0) + 1);
  }
  return ans;
}`,
      },
      "Kadane's / Max Subarray": {
        pseudo:
`largest sum of a contiguous subarray. O(n), O(1).
  cur = a[0]             # best sum of a block ending here
  best = a[0]
  for x in a from index 1
    cur = max(x, cur + x)     # start fresh at x, or extend
    best = max(best, cur)
  return best`,
        py:
`# O(n) time · O(1) space, at each i: extend running sum or restart
def kadane(a):
    cur = best = a[0]
    for x in a[1:]:
        cur = max(x, cur + x)   # extend or restart
        best = max(best, cur)
    return best`,
        java:
`// O(n) time, O(1) space: extend the running sum or restart at x
int kadane(int[] a) {
    int cur = a[0], best = a[0];
    for (int i = 1; i < a.length; i++) {
        cur = Math.max(a[i], cur + a[i]);
        best = Math.max(best, cur);
    }
    return best;
}`,
        cpp:
`// O(n) time, O(1) space: extend the running sum or restart at x
int kadane(vector<int>& a) {
    int cur = a[0], best = a[0];
    for (int i = 1; i < (int)a.size(); i++) {
        cur = max(a[i], cur + a[i]);
        best = max(best, cur);
    }
    return best;
}`,
        js:
`// O(n) time, O(1) space: extend the running sum or restart at x
function kadane(a) {
  let cur = a[0], best = a[0];
  for (let i = 1; i < a.length; i++) {
    cur = Math.max(a[i], cur + a[i]);
    best = Math.max(best, cur);
  }
  return best;
}`,
      },
      "Matrix Operations (Striver)": {
        pseudo:
`rotate an n x n matrix 90 degrees clockwise, in place.
  transpose: for i, for j > i, swap m[i][j] with m[j][i]
  then reverse each row
  (result: what was a column top-down is now a row left-right)`,
        py:
`# O(n^2) time · O(1) space, in-place transpose + row reverse
# rotate image 90deg = transpose then reverse each row
def rotate(m):
    n = len(m)
    for i in range(n):
        for j in range(i+1, n):
            m[i][j], m[j][i] = m[j][i], m[i][j]
    for row in m: row.reverse()`,
        java:
`// O(n^2) time, O(1) space: transpose, then reverse each row
void rotate(int[][] m) {
    int n = m.length;
    for (int i = 0; i < n; i++)
        for (int j = i + 1; j < n; j++) {
            int t = m[i][j]; m[i][j] = m[j][i]; m[j][i] = t;
        }
    for (int[] row : m)
        for (int l = 0, r = n - 1; l < r; l++, r--) {
            int t = row[l]; row[l] = row[r]; row[r] = t;
        }
}`,
        cpp:
`// O(n^2) time, O(1) space: transpose, then reverse each row
void rotate(vector<vector<int>>& m) {
    int n = m.size();
    for (int i = 0; i < n; i++)
        for (int j = i + 1; j < n; j++)
            swap(m[i][j], m[j][i]);
    for (auto& row : m) reverse(row.begin(), row.end());
}`,
        js:
`// O(n^2) time, O(1) space: transpose, then reverse each row
function rotate(m) {
  const n = m.length;
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++)
      [m[i][j], m[j][i]] = [m[j][i], m[i][j]];
  for (const row of m) row.reverse();
}`,
      },
      "Rearrangement & Counting (Striver)": {
        pseudo:
`find the value appearing more than n/2 times. O(n), O(1).
  cand = none, count = 0
  for x in a
    if count == 0 -> cand = x         # adopt a new candidate
    count = count + (x == cand ? 1 : -1)
  return cand      # valid only if a > n/2 majority exists`,
        py:
`# O(n) time · O(1) space, vote up for cand, down otherwise
# Boyer-Moore majority (> n/2)
def majority(a):
    cand = count = 0
    for x in a:
        if count == 0: cand = x
        count += 1 if x == cand else -1
    return cand`,
        java:
`// O(n) time, O(1) space: Boyer-Moore vote for the > n/2 majority
int majority(int[] a) {
    int cand = 0, count = 0;
    for (int x : a) {
        if (count == 0) cand = x;
        count += (x == cand) ? 1 : -1;
    }
    return cand;
}`,
        cpp:
`// O(n) time, O(1) space: Boyer-Moore vote for the > n/2 majority
int majority(vector<int>& a) {
    int cand = 0, count = 0;
    for (int x : a) {
        if (count == 0) cand = x;
        count += (x == cand) ? 1 : -1;
    }
    return cand;
}`,
        js:
`// O(n) time, O(1) space: Boyer-Moore vote for the > n/2 majority
function majority(a) {
  let cand = 0, count = 0;
  for (const x of a) {
    if (count === 0) cand = x;
    count += (x === cand) ? 1 : -1;
  }
  return cand;
}`,
      },
      "Duplicates & Missing (Striver)": {
        pseudo:
`find the duplicate in [1..n], using each value as a next pointer.
  slow = a[0], fast = a[0]
  repeat: slow = a[slow]; fast = a[a[fast]]   until slow == fast
  slow = a[0]
  while slow != fast: slow = a[slow]; fast = a[fast]
  return slow      # the cycle's entry point is the duplicate`,
        py:
`# O(n) time · O(1) space, treat values as next pointers (cycle = dup)
# find duplicate: Floyd's cycle on values
def find_dup(a):
    slow = fast = a[0]
    while True:
        slow = a[slow]; fast = a[a[fast]]
        if slow == fast: break
    slow = a[0]
    while slow != fast: slow = a[slow]; fast = a[fast]
    return slow`,
        java:
`// O(n) time, O(1) space: Floyd's cycle on values (value = next index)
int findDup(int[] a) {
    int slow = a[0], fast = a[0];
    do { slow = a[slow]; fast = a[a[fast]]; } while (slow != fast);
    slow = a[0];
    while (slow != fast) { slow = a[slow]; fast = a[fast]; }
    return slow;
}`,
        cpp:
`// O(n) time, O(1) space: Floyd's cycle on values (value = next index)
int findDup(vector<int>& a) {
    int slow = a[0], fast = a[0];
    do { slow = a[slow]; fast = a[a[fast]]; } while (slow != fast);
    slow = a[0];
    while (slow != fast) { slow = a[slow]; fast = a[fast]; }
    return slow;
}`,
        js:
`// O(n) time, O(1) space: Floyd's cycle on values (value = next index)
function findDup(a) {
  let slow = a[0], fast = a[0];
  do { slow = a[slow]; fast = a[a[fast]]; } while (slow !== fast);
  slow = a[0];
  while (slow !== fast) { slow = a[slow]; fast = a[fast]; }
  return slow;
}`,
      },
      "Merge & Intervals (Striver)": {
        pseudo:
`merge overlapping intervals. O(n log n) to sort, then O(n).
  sort intervals by start
  res = empty list
  for [s, e] in intervals
    if res not empty and s <= end of res.last
      res.last.end = max(res.last.end, e)   # overlaps, extend
    else
      append [s, e] to res
  return res`,
        py:
`# O(n log n) time (sort) · O(n) space, sort by start, extend or append
def merge(intervals):
    intervals.sort()
    res = []
    for s, e in intervals:
        if res and s <= res[-1][1]:
            res[-1][1] = max(res[-1][1], e)
        else: res.append([s, e])
    return res`,
        java:
`// O(n log n) time, O(n) space: sort by start, extend or append
int[][] merge(int[][] intervals) {
    Arrays.sort(intervals, (x, y) -> Integer.compare(x[0], y[0]));
    List<int[]> res = new ArrayList<>();
    for (int[] iv : intervals) {
        if (!res.isEmpty() && iv[0] <= res.get(res.size() - 1)[1])
            res.get(res.size() - 1)[1] = Math.max(res.get(res.size() - 1)[1], iv[1]);
        else res.add(iv);
    }
    return res.toArray(new int[0][]);
}`,
        cpp:
`// O(n log n) time, O(n) space: sort by start, extend or append
vector<vector<int>> merge(vector<vector<int>>& intervals) {
    sort(intervals.begin(), intervals.end());
    vector<vector<int>> res;
    for (auto& iv : intervals) {
        if (!res.empty() && iv[0] <= res.back()[1])
            res.back()[1] = max(res.back()[1], iv[1]);
        else res.push_back(iv);
    }
    return res;
}`,
        js:
`// O(n log n) time, O(n) space: sort by start, extend or append
function merge(intervals) {
  intervals.sort((x, y) => x[0] - y[0]);
  const res = [];
  for (const [s, e] of intervals) {
    if (res.length && s <= res[res.length - 1][1])
      res[res.length - 1][1] = Math.max(res[res.length - 1][1], e);
    else res.push([s, e]);
  }
  return res;
}`,
      },

      "On array / index": {
        pseudo:
`find x in a SORTED array, or return -1. O(log n), O(1).
  lo = 0, hi = n-1
  while lo <= hi
    mid = (lo + hi) / 2       # integer division
    if a[mid] == x -> return mid
    if a[mid] <  x -> lo = mid + 1   # answer is to the right
    else           -> hi = mid - 1   # answer is to the left
  return -1`,
        py:
`# O(log n) time · O(1) space, halve the search range each step
def bsearch(a, x):
    lo, hi = 0, len(a)-1
    while lo <= hi:
        mid = (lo+hi)//2
        if a[mid] == x: return mid
        if a[mid] < x: lo = mid+1
        else: hi = mid-1
    return -1`,
        java:
`// O(log n) time, O(1) space: halve the search range each step
int bsearch(int[] a, int x) {
    int lo = 0, hi = a.length - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] == x) return mid;
        if (a[mid] < x) lo = mid + 1;
        else hi = mid - 1;
    }
    return -1;
}`,
        cpp:
`// O(log n) time, O(1) space: halve the search range each step
int bsearch(vector<int>& a, int x) {
    int lo = 0, hi = (int)a.size() - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] == x) return mid;
        if (a[mid] < x) lo = mid + 1;
        else hi = mid - 1;
    }
    return -1;
}`,
        js:
`// O(log n) time, O(1) space: halve the search range each step
function bsearch(a, x) {
  let lo = 0, hi = a.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (a[mid] === x) return mid;
    if (a[mid] < x) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}`,
      },
      "On answer (min/max feasible)": {
        pseudo:
`smallest x in [lo, hi] where ok(x) is true (no,no,...,yes,yes).
  while lo < hi
    mid = (lo + hi) / 2
    if ok(mid) -> hi = mid          # mid may be the answer, keep it
    else       -> lo = mid + 1      # mid too small, go right
  return lo
# example (Koko): ok(speed) = hours_needed(speed) <= h`,
        py:
`# O(log(range) · cost of ok) · O(1), binary search the answer space
def min_feasible(lo, hi, ok):     # smallest x with ok(x)==True
    while lo < hi:
        mid = (lo+hi)//2
        if ok(mid): hi = mid
        else:       lo = mid+1
    return lo
# Koko: ok(sp) = sum(ceil(p/sp) for p in piles) <= h`,
        java:
`// O(log(range) x cost of ok), O(1): binary search the answer space
int minFeasible(int lo, int hi, IntPredicate ok) { // smallest x with ok(x)
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (ok.test(mid)) hi = mid;
        else lo = mid + 1;
    }
    return lo;
}`,
        cpp:
`// O(log(range) x cost of ok), O(1): binary search the answer space
int minFeasible(int lo, int hi, function<bool(int)> ok) {
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (ok(mid)) hi = mid;      // smallest x with ok(x) == true
        else lo = mid + 1;
    }
    return lo;
}`,
        js:
`// O(log(range) x cost of ok), O(1): binary search the answer space
function minFeasible(lo, hi, ok) {   // smallest x with ok(x) === true
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (ok(mid)) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}`,
      },
      "Peaks, matrix & special": {
        pseudo:
`find any peak (bigger than both neighbors) in O(log n).
  lo = 0, hi = n-1
  while lo < hi
    mid = (lo + hi) / 2
    if a[mid] < a[mid+1] -> lo = mid + 1   # uphill, peak is right
    else                 -> hi = mid        # downhill, peak here or left
  return lo`,
        py:
`# O(log n) time · O(1) space, move toward the higher neighbor
def find_peak(a):
    lo, hi = 0, len(a)-1
    while lo < hi:
        mid = (lo+hi)//2
        if a[mid] < a[mid+1]: lo = mid+1   # climb up
        else: hi = mid
    return lo`,
        java:
`// O(log n) time, O(1) space: always walk toward the higher neighbor
int findPeak(int[] a) {
    int lo = 0, hi = a.length - 1;
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] < a[mid + 1]) lo = mid + 1;
        else hi = mid;
    }
    return lo;
}`,
        cpp:
`// O(log n) time, O(1) space: always walk toward the higher neighbor
int findPeak(vector<int>& a) {
    int lo = 0, hi = (int)a.size() - 1;
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] < a[mid + 1]) lo = mid + 1;
        else hi = mid;
    }
    return lo;
}`,
        js:
`// O(log n) time, O(1) space: always walk toward the higher neighbor
function findPeak(a) {
  let lo = 0, hi = a.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (a[mid] < a[mid + 1]) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}`,
      },
      "Math via binary search": {
        pseudo:
`a to the power b in O(log b) multiplies (halve the exponent).
  res = 1
  while b > 0
    if b is odd -> res = res * a
    a = a * a                  # square the base
    b = b >> 1                 # drop the lowest bit
  return res`,
        py:
`# O(log b) time · O(1) space, square base, consume exponent bit by bit
def power(a, b):                # fast exponentiation
    res = 1
    while b:
        if b & 1: res *= a
        a *= a; b >>= 1
    return res`,
        java:
`// O(log b) time, O(1) space: square base, consume exponent bit by bit
long power(long a, long b) {
    long res = 1;
    while (b > 0) {
        if ((b & 1) == 1) res *= a;
        a *= a; b >>= 1;
    }
    return res;
}`,
        cpp:
`// O(log b) time, O(1) space: square base, consume exponent bit by bit
long long power(long long a, long long b) {
    long long res = 1;
    while (b > 0) {
        if (b & 1) res *= a;
        a *= a; b >>= 1;
    }
    return res;
}`,
        js:
`// O(log b) time, O(1) space: square base, consume exponent bit by bit
function power(a, b) {
  let res = 1;
  while (b > 0) {
    if (b & 1) res *= a;
    a *= a; b >>= 1;
  }
  return res;
}`,
      },

      "Two Pointers": {
        pseudo:
`is the string a palindrome? Compare ends moving inward. O(n).
  l = 0, r = n-1
  while l < r
    if s[l] != s[r] -> return false
    l = l + 1, r = r - 1
  return true`,
        py:
`# O(n) time · O(1) space, compare ends moving inward
def is_palindrome(s):
    l, r = 0, len(s)-1
    while l < r:
        if s[l] != s[r]: return False
        l += 1; r -= 1
    return True`,
        java:
`// O(n) time, O(1) space: compare ends moving inward
boolean isPalindrome(String s) {
    int l = 0, r = s.length() - 1;
    while (l < r) {
        if (s.charAt(l) != s.charAt(r)) return false;
        l++; r--;
    }
    return true;
}`,
        cpp:
`// O(n) time, O(1) space: compare ends moving inward
bool isPalindrome(string s) {
    int l = 0, r = (int)s.size() - 1;
    while (l < r) {
        if (s[l] != s[r]) return false;
        l++; r--;
    }
    return true;
}`,
        js:
`// O(n) time, O(1) space: compare ends moving inward
function isPalindrome(s) {
  let l = 0, r = s.length - 1;
  while (l < r) {
    if (s[l] !== s[r]) return false;
    l++; r--;
  }
  return true;
}`,
      },
      "Anagrams & Frequency": {
        pseudo:
`are a and b anagrams? Same letters, same counts. O(n).
  if lengths differ -> false
  count = map of letter -> count
  add 1 for each letter of a, subtract 1 for each letter of b
  true only if every count ended at 0`,
        py:
`# O(n) time · O(charset) space, compare character counts
from collections import Counter
def is_anagram(a, b):
    return Counter(a) == Counter(b)   # or sorted(a)==sorted(b)`,
        java:
`// O(n) time, O(charset) space: counts must match
boolean isAnagram(String a, String b) {
    if (a.length() != b.length()) return false;
    int[] cnt = new int[26];
    for (int i = 0; i < a.length(); i++) {
        cnt[a.charAt(i) - 'a']++;
        cnt[b.charAt(i) - 'a']--;
    }
    for (int c : cnt) if (c != 0) return false;
    return true;
}`,
        cpp:
`// O(n) time, O(charset) space: counts must match
bool isAnagram(string a, string b) {
    if (a.size() != b.size()) return false;
    int cnt[26] = {0};
    for (int i = 0; i < (int)a.size(); i++) {
        cnt[a[i] - 'a']++;
        cnt[b[i] - 'a']--;
    }
    for (int c : cnt) if (c != 0) return false;
    return true;
}`,
        js:
`// O(n) time, O(charset) space: counts must match
function isAnagram(a, b) {
  if (a.length !== b.length) return false;
  const cnt = {};
  for (const ch of a) cnt[ch] = (cnt[ch] || 0) + 1;
  for (const ch of b) {
    if (!cnt[ch]) return false;
    cnt[ch]--;
  }
  return true;
}`,
      },
      "Pattern Matching (KMP / Rolling Hash)": {
        pseudo:
`KMP failure table: lps[i] = length of the longest proper prefix
of p[0..i] that is also a suffix of it. O(m).
  lps[0] = 0, k = 0
  for i from 1 to m-1
    while k > 0 and p[i] != p[k] -> k = lps[k-1]   # fall back
    if p[i] == p[k] -> k = k + 1
    lps[i] = k
  return lps`,
        py:
`# O(m) build, O(n+m) match · O(m) space, longest prefix=suffix table
def build_lps(p):               # KMP failure function
    lps = [0]*len(p); k = 0
    for i in range(1, len(p)):
        while k and p[i] != p[k]: k = lps[k-1]
        if p[i] == p[k]: k += 1
        lps[i] = k
    return lps`,
        java:
`// O(m) time, O(m) space: longest prefix that is also a suffix
int[] buildLps(String p) {
    int[] lps = new int[p.length()];
    int k = 0;
    for (int i = 1; i < p.length(); i++) {
        while (k > 0 && p.charAt(i) != p.charAt(k)) k = lps[k - 1];
        if (p.charAt(i) == p.charAt(k)) k++;
        lps[i] = k;
    }
    return lps;
}`,
        cpp:
`// O(m) time, O(m) space: longest prefix that is also a suffix
vector<int> buildLps(string p) {
    vector<int> lps(p.size(), 0);
    int k = 0;
    for (int i = 1; i < (int)p.size(); i++) {
        while (k > 0 && p[i] != p[k]) k = lps[k - 1];
        if (p[i] == p[k]) k++;
        lps[i] = k;
    }
    return lps;
}`,
        js:
`// O(m) time, O(m) space: longest prefix that is also a suffix
function buildLps(p) {
  const lps = new Array(p.length).fill(0);
  let k = 0;
  for (let i = 1; i < p.length; i++) {
    while (k > 0 && p[i] !== p[k]) k = lps[k - 1];
    if (p[i] === p[k]) k++;
    lps[i] = k;
  }
  return lps;
}`,
      },
      "Compression & Misc (Striver)": {
        pseudo:
`run-length compress chars in place, return the new length. O(n).
  w = 0 (write index), i = 0
  while i < n
    c = chars[i]; advance j past the run of equal chars
    write c at w; w = w + 1
    if run length > 1 -> write each digit of the length
    i = j
  return w`,
        py:
`# O(n) time · O(1) space, write pointer emits char + run length
def compress(chars):            # run-length in place
    w = 0; i = 0
    while i < len(chars):
        c = chars[i]; j = i
        while j < len(chars) and chars[j] == c: j += 1
        chars[w] = c; w += 1
        if j-i > 1:
            for d in str(j-i): chars[w]=d; w += 1
        i = j
    return w`,
        java:
`// O(n) time, O(1) space: write pointer emits char then run length
int compress(char[] chars) {
    int w = 0, i = 0, n = chars.length;
    while (i < n) {
        char c = chars[i]; int j = i;
        while (j < n && chars[j] == c) j++;
        chars[w++] = c;
        if (j - i > 1)
            for (char d : String.valueOf(j - i).toCharArray()) chars[w++] = d;
        i = j;
    }
    return w;
}`,
        cpp:
`// O(n) time, O(1) space: write pointer emits char then run length
int compress(vector<char>& chars) {
    int w = 0, i = 0, n = chars.size();
    while (i < n) {
        char c = chars[i]; int j = i;
        while (j < n && chars[j] == c) j++;
        chars[w++] = c;
        if (j - i > 1)
            for (char d : to_string(j - i)) chars[w++] = d;
        i = j;
    }
    return w;
}`,
        js:
`// O(n) time, O(1) space: write pointer emits char then run length
function compress(chars) {
  let w = 0, i = 0;
  const n = chars.length;
  while (i < n) {
    const c = chars[i]; let j = i;
    while (j < n && chars[j] === c) j++;
    chars[w++] = c;
    if (j - i > 1) for (const d of String(j - i)) chars[w++] = d;
    i = j;
  }
  return w;
}`,
      },

      "Lookup & Two Sum family": {
        pseudo:
`two values summing to target, ANY order. O(n) time, O(n) space.
  seen = empty map (value -> its index)
  for i, x in the array
    if (target - x) is in seen -> answer is (seen[target - x], i)
    put x -> i into seen`,
        py:
`# O(n) time · O(n) space, hashmap remembers value -> index
def two_sum(nums, target):
    seen = {}
    for i, x in enumerate(nums):
        if target-x in seen: return [seen[target-x], i]
        seen[x] = i`,
        java:
`// O(n) time, O(n) space, map remembers value -> index
int[] twoSum(int[] nums, int target) {
    Map<Integer,Integer> seen = new HashMap<>();
    for (int i = 0; i < nums.length; i++) {
        int need = target - nums[i];
        if (seen.containsKey(need)) return new int[]{seen.get(need), i};
        seen.put(nums[i], i);
    }
    return new int[]{-1, -1};
}`,
        cpp:
`// O(n) time, O(n) space, map remembers value -> index
vector<int> twoSum(vector<int>& nums, int target) {
    unordered_map<int,int> seen;
    for (int i = 0; i < (int)nums.size(); i++) {
        int need = target - nums[i];
        if (seen.count(need)) return {seen[need], i};
        seen[nums[i]] = i;
    }
    return {-1, -1};
}`,
        js:
`// O(n) time, O(n) space, map remembers value -> index
function twoSum(nums, target) {
  const seen = new Map();
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    if (seen.has(need)) return [seen.get(need), i];
    seen.set(nums[i], i);
  }
  return [-1, -1];
}`,
      },
      "Frequency & Grouping": {
        pseudo:
`group words that are anagrams of each other.
  g = map from a key to a list of words
  for each word w
    key = the sorted letters of w     # anagrams share this key
    append w to g[key]
  return all the lists in g`,
        py:
`# O(n·k log k) time · O(n·k) space, sorted word is the group key
from collections import defaultdict
def group_anagrams(words):
    g = defaultdict(list)
    for w in words:
        g["".join(sorted(w))].append(w)   # sorted = key
    return list(g.values())`,
        java:
`// O(n*k log k) time, O(n*k) space: the sorted word is the group key
List<List<String>> groupAnagrams(String[] words) {
    Map<String,List<String>> g = new HashMap<>();
    for (String w : words) {
        char[] c = w.toCharArray(); Arrays.sort(c);
        g.computeIfAbsent(new String(c), z -> new ArrayList<>()).add(w);
    }
    return new ArrayList<>(g.values());
}`,
        cpp:
`// O(n*k log k) time, O(n*k) space: the sorted word is the group key
vector<vector<string>> groupAnagrams(vector<string>& words) {
    unordered_map<string, vector<string>> g;
    for (auto& w : words) {
        string key = w; sort(key.begin(), key.end());
        g[key].push_back(w);
    }
    vector<vector<string>> res;
    for (auto& [k, v] : g) res.push_back(v);
    return res;
}`,
        js:
`// O(n*k log k) time, O(n*k) space: the sorted word is the group key
function groupAnagrams(words) {
  const g = new Map();
  for (const w of words) {
    const key = [...w].sort().join("");
    if (!g.has(key)) g.set(key, []);
    g.get(key).push(w);
  }
  return [...g.values()];
}`,
      },
      "Index / Set tricks": {
        pseudo:
`longest run of consecutive integers. O(n) using a set.
  s = set of all numbers
  best = 0
  for x in s
    if x-1 is not in s           # x starts a fresh run
      y = x
      while y+1 in s -> y = y + 1
      best = max(best, y - x + 1)
  return best`,
        py:
`# O(n) time · O(n) space, only expand runs from their start element
def longest_consecutive(nums):
    s = set(nums); best = 0
    for x in s:
        if x-1 not in s:            # only start of a run
            y = x
            while y+1 in s: y += 1
            best = max(best, y-x+1)
    return best`,
        java:
`// O(n) time, O(n) space: only expand a run from its start element
int longestConsecutive(int[] nums) {
    Set<Integer> s = new HashSet<>();
    for (int x : nums) s.add(x);
    int best = 0;
    for (int x : s) {
        if (!s.contains(x - 1)) {          // start of a run
            int y = x;
            while (s.contains(y + 1)) y++;
            best = Math.max(best, y - x + 1);
        }
    }
    return best;
}`,
        cpp:
`// O(n) time, O(n) space: only expand a run from its start element
int longestConsecutive(vector<int>& nums) {
    unordered_set<int> s(nums.begin(), nums.end());
    int best = 0;
    for (int x : s) {
        if (!s.count(x - 1)) {             // start of a run
            int y = x;
            while (s.count(y + 1)) y++;
            best = max(best, y - x + 1);
        }
    }
    return best;
}`,
        js:
`// O(n) time, O(n) space: only expand a run from its start element
function longestConsecutive(nums) {
  const s = new Set(nums);
  let best = 0;
  for (const x of s) {
    if (!s.has(x - 1)) {                  // start of a run
      let y = x;
      while (s.has(y + 1)) y++;
      best = Math.max(best, y - x + 1);
    }
  }
  return best;
}`,
      },

      "Next Greater / Smaller": {
        pseudo:
`next greater element to the right of each item. O(n).
  res = all -1
  st = stack of indices, values decreasing
  for i, x in the array
    while st not empty and a[st.top] < x
      res[st.pop] = x        # x is the next greater for that index
    push i
  return res`,
        py:
`# O(n) time · O(n) space, monotonic stack; each index pushed/popped once
def next_greater(a):
    res = [-1]*len(a); st = []       # indices, decreasing
    for i, x in enumerate(a):
        while st and a[st[-1]] < x:
            res[st.pop()] = x
        st.append(i)
    return res`,
        java:
`// O(n) time, O(n) space: each index is pushed and popped once
int[] nextGreater(int[] a) {
    int n = a.length; int[] res = new int[n];
    Arrays.fill(res, -1);
    Deque<Integer> st = new ArrayDeque<>();   // indices, decreasing
    for (int i = 0; i < n; i++) {
        while (!st.isEmpty() && a[st.peek()] < a[i]) res[st.pop()] = a[i];
        st.push(i);
    }
    return res;
}`,
        cpp:
`// O(n) time, O(n) space: each index is pushed and popped once
vector<int> nextGreater(vector<int>& a) {
    int n = a.size(); vector<int> res(n, -1);
    stack<int> st;                            // indices, decreasing
    for (int i = 0; i < n; i++) {
        while (!st.empty() && a[st.top()] < a[i]) { res[st.top()] = a[i]; st.pop(); }
        st.push(i);
    }
    return res;
}`,
        js:
`// O(n) time, O(n) space: each index is pushed and popped once
function nextGreater(a) {
  const res = new Array(a.length).fill(-1);
  const st = [];                            // indices, decreasing
  for (let i = 0; i < a.length; i++) {
    while (st.length && a[st[st.length - 1]] < a[i]) res[st.pop()] = a[i];
    st.push(i);
  }
  return res;
}`,
      },
      "Histogram / Spans": {
        pseudo:
`largest rectangle in a histogram. O(n) with a stack.
  append a 0-height bar to flush the stack at the end
  st = stack of indices, heights increasing
  for i, x in heights
    while st and h[st.top] >= x
      height = h[st.pop]
      width = i if st empty else i - st.top - 1
      best = max(best, height * width)
    push i
  return best`,
        py:
`# O(n) time · O(n) space, stack gives nearest-smaller left/right bounds
def largest_rectangle(h):
    h.append(0); st = []; best = 0
    for i, x in enumerate(h):
        while st and h[st[-1]] >= x:
            ht = h[st.pop()]
            w = i if not st else i-st[-1]-1
            best = max(best, ht*w)
        st.append(i)
    return best`,
        java:
`// O(n) time, O(n) space: stack gives nearest-smaller bounds each side
int largestRectangle(int[] h0) {
    int n = h0.length;
    int[] h = Arrays.copyOf(h0, n + 1);       // trailing 0 flushes stack
    Deque<Integer> st = new ArrayDeque<>();
    int best = 0;
    for (int i = 0; i <= n; i++) {
        while (!st.isEmpty() && h[st.peek()] >= h[i]) {
            int ht = h[st.pop()];
            int w = st.isEmpty() ? i : i - st.peek() - 1;
            best = Math.max(best, ht * w);
        }
        st.push(i);
    }
    return best;
}`,
        cpp:
`// O(n) time, O(n) space: stack gives nearest-smaller bounds each side
int largestRectangle(vector<int> h) {
    h.push_back(0);                           // trailing 0 flushes stack
    stack<int> st; int best = 0;
    for (int i = 0; i < (int)h.size(); i++) {
        while (!st.empty() && h[st.top()] >= h[i]) {
            int ht = h[st.top()]; st.pop();
            int w = st.empty() ? i : i - st.top() - 1;
            best = max(best, ht * w);
        }
        st.push(i);
    }
    return best;
}`,
        js:
`// O(n) time, O(n) space: stack gives nearest-smaller bounds each side
function largestRectangle(h) {
  h = [...h, 0];                             // trailing 0 flushes stack
  const st = []; let best = 0;
  for (let i = 0; i < h.length; i++) {
    while (st.length && h[st[st.length - 1]] >= h[i]) {
      const ht = h[st.pop()];
      const w = st.length ? i - st[st.length - 1] - 1 : i;
      best = Math.max(best, ht * w);
    }
    st.push(i);
  }
  return best;
}`,
      },
      "Design (Min/Max stack, queues, cache)": {
        pseudo:
`a stack that also returns its minimum in O(1).
  each entry stores (value, min-so-far)
  push x -> m = min(x, current min); push (x, m)
  pop    -> remove the top entry
  top    -> value of the top entry
  getMin -> min-so-far of the top entry`,
        py:
`# O(1) per op · O(n) space, store running min alongside each value
class MinStack:                  # push (val, running_min)
    def __init__(self): self.st = []
    def push(self, x):
        m = x if not self.st else min(x, self.st[-1][1])
        self.st.append((x, m))
    def pop(self): self.st.pop()
    def top(self): return self.st[-1][0]
    def getMin(self): return self.st[-1][1]`,
        java:
`// O(1) per op, O(n) space: store the running min beside each value
class MinStack {
    private Deque<int[]> st = new ArrayDeque<>();  // {value, runningMin}
    void push(int x) {
        int m = st.isEmpty() ? x : Math.min(x, st.peek()[1]);
        st.push(new int[]{x, m});
    }
    void pop() { st.pop(); }
    int top() { return st.peek()[0]; }
    int getMin() { return st.peek()[1]; }
}`,
        cpp:
`// O(1) per op, O(n) space: store the running min beside each value
class MinStack {
    stack<pair<int,int>> st;   // {value, runningMin}
public:
    void push(int x) {
        int m = st.empty() ? x : min(x, st.top().second);
        st.push({x, m});
    }
    void pop() { st.pop(); }
    int top() { return st.top().first; }
    int getMin() { return st.top().second; }
};`,
        js:
`// O(1) per op, O(n) space: store the running min beside each value
class MinStack {
  constructor() { this.st = []; }            // [value, runningMin]
  push(x) {
    const m = this.st.length ? Math.min(x, this.st.at(-1)[1]) : x;
    this.st.push([x, m]);
  }
  pop() { this.st.pop(); }
  top() { return this.st.at(-1)[0]; }
  getMin() { return this.st.at(-1)[1]; }
}`,
      },
      "Expression Handling": {
        pseudo:
`valid parentheses? Every closer matches the latest opener. O(n).
  st = empty stack; pairs = { ')':'(' , ']':'[' , '}':'{' }
  for c in s
    if c is a closer
      if st empty or st.pop != pairs[c] -> return false
    else push c
  return st is empty`,
        py:
`# O(n) time · O(n) space, stack matches each closer to its opener
def valid(s):
    st = []; pair = {')':'(', ']':'[', '}':'{'}
    for c in s:
        if c in pair:
            if not st or st.pop() != pair[c]: return False
        else: st.append(c)
    return not st`,
        java:
`// O(n) time, O(n) space: stack matches each closer to its opener
boolean valid(String s) {
    Deque<Character> st = new ArrayDeque<>();
    Map<Character,Character> pair = Map.of(')','(', ']','[', '}','{');
    for (char c : s.toCharArray()) {
        if (pair.containsKey(c)) {
            if (st.isEmpty() || st.pop() != pair.get(c)) return false;
        } else st.push(c);
    }
    return st.isEmpty();
}`,
        cpp:
`// O(n) time, O(n) space: stack matches each closer to its opener
bool valid(string s) {
    stack<char> st;
    unordered_map<char,char> pair{{')','('},{']','['},{'}','{'}};
    for (char c : s) {
        if (pair.count(c)) {
            if (st.empty() || st.top() != pair[c]) return false;
            st.pop();
        } else st.push(c);
    }
    return st.empty();
}`,
        js:
`// O(n) time, O(n) space: stack matches each closer to its opener
function valid(s) {
  const st = [];
  const pair = { ')': '(', ']': '[', '}': '{' };
  for (const c of s) {
    if (c in pair) {
      if (!st.length || st.pop() !== pair[c]) return false;
    } else st.push(c);
  }
  return st.length === 0;
}`,
      },
      "Monotonic Deque (window extremes)": {
        pseudo:
`maximum of every window of size k. O(n) with a deque of indices.
  dq = deque of indices, values decreasing
  for i, x in the array
    while dq and a[dq.back] <= x -> pop back    # smaller, useless
    push i to the back
    if dq.front <= i-k -> pop front              # slid out of window
    if i >= k-1 -> record a[dq.front] as this window's max`,
        py:
`# O(n) time · O(k) space, deque keeps indices in decreasing value order
from collections import deque
def window_max(a, k):
    dq, res = deque(), []           # indices, decreasing
    for i, x in enumerate(a):
        while dq and a[dq[-1]] <= x: dq.pop()
        dq.append(i)
        if dq[0] <= i-k: dq.popleft()
        if i >= k-1: res.append(a[dq[0]])
    return res`,
        java:
`// O(n) time, O(k) space: deque holds indices in decreasing value order
int[] windowMax(int[] a, int k) {
    Deque<Integer> dq = new ArrayDeque<>();   // indices, decreasing
    int[] res = new int[a.length - k + 1];
    for (int i = 0; i < a.length; i++) {
        while (!dq.isEmpty() && a[dq.peekLast()] <= a[i]) dq.pollLast();
        dq.addLast(i);
        if (dq.peekFirst() <= i - k) dq.pollFirst();
        if (i >= k - 1) res[i - k + 1] = a[dq.peekFirst()];
    }
    return res;
}`,
        cpp:
`// O(n) time, O(k) space: deque holds indices in decreasing value order
vector<int> windowMax(vector<int>& a, int k) {
    deque<int> dq; vector<int> res;           // indices, decreasing
    for (int i = 0; i < (int)a.size(); i++) {
        while (!dq.empty() && a[dq.back()] <= a[i]) dq.pop_back();
        dq.push_back(i);
        if (dq.front() <= i - k) dq.pop_front();
        if (i >= k - 1) res.push_back(a[dq.front()]);
    }
    return res;
}`,
        js:
`// O(n) time, O(k) space: deque holds indices in decreasing value order
function windowMax(a, k) {
  const dq = [], res = [];                   // indices, decreasing
  for (let i = 0; i < a.length; i++) {
    while (dq.length && a[dq[dq.length - 1]] <= a[i]) dq.pop();
    dq.push(i);
    if (dq[0] <= i - k) dq.shift();
    if (i >= k - 1) res.push(a[dq[0]]);
  }
  return res;
}`,
      },

      "Fast-Slow Pointers": {
        pseudo:
`one fast pointer (2 steps) and one slow (1 step). O(n), O(1).
  slow = fast = head
  while fast and fast.next
    slow = slow.next
    fast = fast.next.next
  # slow is now the middle node
  # if fast ever meets slow, the list has a cycle
  # cycle start: reset one pointer to head, then step both by 1`,
        py:
`# O(n) time · O(1) space, fast moves 2x, slow 1x
slow = fast = head
while fast and fast.next:
    slow = slow.next
    fast = fast.next.next
# slow = middle. If slow met fast earlier -> cycle.
# cycle start: reset one ptr to head, advance both +1.`,
        java:
`// O(n) time, O(1) space: fast moves 2x, slow 1x
ListNode slow = head, fast = head;
while (fast != null && fast.next != null) {
    slow = slow.next;
    fast = fast.next.next;
}
// slow = middle. If fast ever meets slow, there is a cycle.
// cycle start: reset one pointer to head, advance both by 1.`,
        cpp:
`// O(n) time, O(1) space: fast moves 2x, slow 1x
ListNode *slow = head, *fast = head;
while (fast && fast->next) {
    slow = slow->next;
    fast = fast->next->next;
}
// slow = middle. If fast ever meets slow, there is a cycle.
// cycle start: reset one pointer to head, advance both by 1.`,
        js:
`// O(n) time, O(1) space: fast moves 2x, slow 1x
let slow = head, fast = head;
while (fast && fast.next) {
  slow = slow.next;
  fast = fast.next.next;
}
// slow = middle. If fast ever meets slow, there is a cycle.
// cycle start: reset one pointer to head, advance both by 1.`,
      },
      "Reversal": {
        pseudo:
`reverse a linked list. O(n), O(1). Flip each next pointer.
  prev = null
  while head is not null
    next = head.next        # remember the rest
    head.next = prev        # flip this link
    prev = head             # prev walks forward
    head = next             # head walks forward
  return prev               # prev is the new head`,
        py:
`# O(n) time · O(1) space, flip each next pointer, carry prev along
def reverse(head):
    prev = None
    while head:
        head.next, prev, head = prev, head, head.next
    return prev`,
        java:
`// O(n) time, O(1) space: flip each next pointer, carry prev along
ListNode reverse(ListNode head) {
    ListNode prev = null;
    while (head != null) {
        ListNode next = head.next;
        head.next = prev;
        prev = head;
        head = next;
    }
    return prev;
}`,
        cpp:
`// O(n) time, O(1) space: flip each next pointer, carry prev along
ListNode* reverse(ListNode* head) {
    ListNode* prev = nullptr;
    while (head) {
        ListNode* next = head->next;
        head->next = prev;
        prev = head;
        head = next;
    }
    return prev;
}`,
        js:
`// O(n) time, O(1) space: flip each next pointer, carry prev along
function reverse(head) {
  let prev = null;
  while (head) {
    const next = head.next;
    head.next = prev;
    prev = head;
    head = next;
  }
  return prev;
}`,
      },
      "Merge / Add / Reorder": {
        pseudo:
`merge two sorted lists. O(n+m), O(1). Use a dummy head.
  dummy -> tail = dummy
  while a and b
    if a.val <= b.val -> tail.next = a; a = a.next
    else              -> tail.next = b; b = b.next
    tail = tail.next
  tail.next = whichever of a or b still remains
  return dummy.next`,
        py:
`# O(n+m) time · O(1) space, dummy head, splice smaller node each step
def merge(a, b):
    dummy = tail = ListNode(0)
    while a and b:
        if a.val <= b.val: tail.next, a = a, a.next
        else: tail.next, b = b, b.next
        tail = tail.next
    tail.next = a or b
    return dummy.next`,
        java:
`// O(n+m) time, O(1) space: dummy head, splice the smaller node
ListNode merge(ListNode a, ListNode b) {
    ListNode dummy = new ListNode(0), tail = dummy;
    while (a != null && b != null) {
        if (a.val <= b.val) { tail.next = a; a = a.next; }
        else { tail.next = b; b = b.next; }
        tail = tail.next;
    }
    tail.next = (a != null) ? a : b;
    return dummy.next;
}`,
        cpp:
`// O(n+m) time, O(1) space: dummy head, splice the smaller node
ListNode* merge(ListNode* a, ListNode* b) {
    ListNode dummy(0); ListNode* tail = &dummy;
    while (a && b) {
        if (a->val <= b->val) { tail->next = a; a = a->next; }
        else { tail->next = b; b = b->next; }
        tail = tail->next;
    }
    tail->next = a ? a : b;
    return dummy.next;
}`,
        js:
`// O(n+m) time, O(1) space: dummy head, splice the smaller node
function merge(a, b) {
  const dummy = new ListNode(0);
  let tail = dummy;
  while (a && b) {
    if (a.val <= b.val) { tail.next = a; a = a.next; }
    else { tail.next = b; b = b.next; }
    tail = tail.next;
  }
  tail.next = a || b;
  return dummy.next;
}`,
      },
      "LL + Arrays / Misc (Striver)": {
        pseudo:
`remove the nth node from the end, in one pass. O(n), O(1).
  dummy -> head; fast = slow = dummy
  advance fast by n steps (open a gap of n)
  while fast.next -> move fast and slow together
  slow.next = slow.next.next     # skip the target node
  return dummy.next`,
        py:
`# O(n) time · O(1) space, gap of n between fast & slow, one pass
def remove_nth_from_end(head, n):
    dummy = ListNode(0, head); fast = slow = dummy
    for _ in range(n): fast = fast.next
    while fast.next: fast, slow = fast.next, slow.next
    slow.next = slow.next.next      # skip the node
    return dummy.next`,
        java:
`// O(n) time, O(1) space: keep a gap of n between fast and slow
ListNode removeNthFromEnd(ListNode head, int n) {
    ListNode dummy = new ListNode(0, head), fast = dummy, slow = dummy;
    for (int i = 0; i < n; i++) fast = fast.next;
    while (fast.next != null) { fast = fast.next; slow = slow.next; }
    slow.next = slow.next.next;
    return dummy.next;
}`,
        cpp:
`// O(n) time, O(1) space: keep a gap of n between fast and slow
ListNode* removeNthFromEnd(ListNode* head, int n) {
    ListNode dummy(0); dummy.next = head;
    ListNode *fast = &dummy, *slow = &dummy;
    for (int i = 0; i < n; i++) fast = fast->next;
    while (fast->next) { fast = fast->next; slow = slow->next; }
    slow->next = slow->next->next;
    return dummy.next;
}`,
        js:
`// O(n) time, O(1) space: keep a gap of n between fast and slow
function removeNthFromEnd(head, n) {
  const dummy = new ListNode(0, head);
  let fast = dummy, slow = dummy;
  for (let i = 0; i < n; i++) fast = fast.next;
  while (fast.next) { fast = fast.next; slow = slow.next; }
  slow.next = slow.next.next;
  return dummy.next;
}`,
      },

      "Traversals":
`# O(n) time · O(h) space (recursion stack, h = height)
def inorder(n, out):            # L, Node, R  (BST -> sorted)
    if not n: return
    inorder(n.left, out); out.append(n.val); inorder(n.right, out)`,
      "BFS / Views":
`# O(n) time · O(w) space (w = max level width) — level-order BFS
from collections import deque
def right_view(root):
    res, q = [], deque([root] if root else [])
    while q:
        n = None
        for _ in range(len(q)):
            n = q.popleft()
            if n.left: q.append(n.left)
            if n.right: q.append(n.right)
        res.append(n.val)           # last node of the level
    return res`,
      "Properties (height/diameter/balanced)":
`# O(n) time · O(h) space — post-order returns depth, updates best
def diameter(root):
    best = 0
    def depth(n):
        nonlocal best
        if not n: return 0
        L, R = depth(n.left), depth(n.right)
        best = max(best, L + R)
        return 1 + max(L, R)
    depth(root); return best`,
      "Path Problems":
`# O(n) time · O(h) space — each node returns best downward gain
def max_path_sum(root):
    best = float('-inf')
    def gain(n):
        nonlocal best
        if not n: return 0
        L = max(gain(n.left), 0); R = max(gain(n.right), 0)
        best = max(best, n.val + L + R)  # path through n
        return n.val + max(L, R)         # best downward
    gain(root); return best`,
      "Structure (symmetry / invert / connect)":
`# O(n) time · O(h) space — swap children recursively
def invert(n):
    if not n: return None
    n.left, n.right = invert(n.right), invert(n.left)
    return n`,
      "Construction & Serialize (Striver)":
`# O(n) time · O(n) space — index map avoids rescanning inorder
def build(preorder, inorder):
    idx = {v:i for i,v in enumerate(inorder)}
    self_pre = iter(preorder)
    def go(l, r):
        if l > r: return None
        v = next(self_pre); node = TreeNode(v)
        node.left = go(l, idx[v]-1); node.right = go(idx[v]+1, r)
        return node
    return go(0, len(inorder)-1)`,
      "Misc (distance-K, width, complete count)":
`# O(log^2 n) time · O(log n) space — compare left/right heights
def count_nodes(root):          # complete tree in O(log^2 n)
    if not root: return 0
    def h(n, left):
        d = 0
        while n: n = n.left if left else n.right; d += 1
        return d
    lh, rh = h(root, True), h(root, False)
    if lh == rh: return (1 << lh) - 1
    return 1 + count_nodes(root.left) + count_nodes(root.right)`,

      "Search / Insert / Delete":
`# O(h) time · O(h) space — go left/right by BST order
def insert(root, val):
    if not root: return TreeNode(val)
    if val < root.val: root.left = insert(root.left, val)
    else: root.right = insert(root.right, val)
    return root`,
      "Validate / Kth / Two-Sum":
`# O(h + k) time · O(h) space — iterative inorder, stop at k-th
def kth_smallest(root, k):      # inorder of BST is sorted
    st, node = [], root
    while st or node:
        while node: st.append(node); node = node.left
        node = st.pop(); k -= 1
        if k == 0: return node.val
        node = node.right`,
      "LCA / Successor / Construct":
`# O(h) time · O(1) space — first node where p, q split = LCA
def lca_bst(root, p, q):
    while root:
        if p < root.val and q < root.val: root = root.left
        elif p > root.val and q > root.val: root = root.right
        else: return root           # split point = LCA`,

      "Subsets / Power set":
`# O(n·2^n) time · O(n) space (excl. output) — include/exclude each item
def subsets(nums):
    res = []
    def bt(start, path):
        res.append(path[:])
        for i in range(start, len(nums)):
            path.append(nums[i]); bt(i+1, path); path.pop()
    bt(0, []); return res`,
      "Permutations / Combinations":
`# O(n·n!) time · O(n) space (excl. output) — used[] tracks picked items
def permute(nums):
    res = []
    def bt(path, used):
        if len(path) == len(nums): res.append(path[:]); return
        for i, x in enumerate(nums):
            if used[i]: continue
            used[i] = True; path.append(x)
            bt(path, used)
            path.pop(); used[i] = False
    bt([], [False]*len(nums)); return res`,
      "Grid / Partition backtracking":
`# O(R·C·4^L) time · O(L) space — DFS, mark cell then restore (backtrack)
def exist(board, word):
    R, C = len(board), len(board[0])
    def dfs(r, c, i):
        if i == len(word): return True
        if r<0 or c<0 or r>=R or c>=C or board[r][c]!=word[i]: return False
        board[r][c] = '#'          # mark visited
        found = any(dfs(r+dr, c+dc, i+1) for dr,dc in ((1,0),(-1,0),(0,1),(0,-1)))
        board[r][c] = word[i]      # unmark
        return found
    return any(dfs(r,c,0) for r in range(R) for c in range(C))`,
      "Constraint solving (pruning)":
`# O(n!) time · O(n) space — sets prune column & both diagonals in O(1)
def solve_n_queens(n):
    res = []; cols=set(); diag=set(); anti=set()
    def bt(r, board):
        if r == n: res.append(["".join(x) for x in board]); return
        for c in range(n):
            if c in cols or (r-c) in diag or (r+c) in anti: continue
            cols.add(c); diag.add(r-c); anti.add(r+c)
            board[r][c]='Q'; bt(r+1, board); board[r][c]='.'
            cols.discard(c); diag.discard(r-c); anti.discard(r+c)
    bt(0, [['.']*n for _ in range(n)]); return res`,

      "Interval Greedy":
`# O(n log n) time · O(1) space — sort by END, keep earliest-finishing
def erase_overlap(intervals):    # min removals
    intervals.sort(key=lambda x: x[1])   # sort by END
    end = float('-inf'); removed = 0
    for s, e in intervals:
        if s >= end: end = e             # keep
        else: removed += 1               # drop overlap
    return removed`,
      "Scheduling / Profit (heap)":
`# O(n log n) time · O(n) space — heap of affordable projects, take max
import heapq
def max_capital(k, w, profits, capital):
    projs = sorted(zip(capital, profits)); h = []; i = 0
    for _ in range(k):
        while i < len(projs) and projs[i][0] <= w:
            heapq.heappush(h, -projs[i][1]); i += 1
        if not h: break
        w += -heapq.heappop(h)           # take max profit affordable
    return w`,
      "Jump / Reach":
`# O(n) time · O(1) space — track farthest reachable index
def can_jump(nums):
    reach = 0
    for i, x in enumerate(nums):
        if i > reach: return False       # stuck
        reach = max(reach, i + x)
    return True`,

      "Top-K / Kth":
`# O(n log k) time · O(k) space — min-heap of size k keeps top-k
import heapq
def kth_largest(nums, k):
    h = []                          # min-heap of size k
    for x in nums:
        heapq.heappush(h, x)
        if len(h) > k: heapq.heappop(h)
    return h[0]`,
      "Two Heaps (median)":
`# O(log n) add · O(1) median · O(n) space — balance max-heap & min-heap
import heapq
class MedianFinder:
    def __init__(self): self.lo=[]; self.hi=[]   # lo=max-heap(neg), hi=min-heap
    def add(self, x):
        heapq.heappush(self.lo, -heapq.heappushpop(self.hi, x))
        if len(self.lo) > len(self.hi):
            heapq.heappush(self.hi, -heapq.heappop(self.lo))
    def median(self):
        return self.hi[0] if len(self.hi)>len(self.lo) else (self.hi[0]-self.lo[0])/2`,
      "K-way Merge":
`# O(N log k) time · O(k) space — heap holds one head per list
import heapq
def merge_k(lists):
    h = [(l[0], i, 0) for i, l in enumerate(lists) if l]
    heapq.heapify(h); out = []
    while h:
        val, li, ei = heapq.heappop(h); out.append(val)
        if ei+1 < len(lists[li]):
            heapq.heappush(h, (lists[li][ei+1], li, ei+1))
    return out`,

      "Traversal (BFS / DFS)":
`# O(V+E) time · O(V) space — visit each vertex/edge once
# Works on DIRECTED & UNDIRECTED graphs (adjacency list either way).
from collections import deque
def bfs(start, adj):
    seen = {start}; q = deque([start])
    while q:
        u = q.popleft()
        for v in adj[u]:
            if v not in seen: seen.add(v); q.append(v)

def dfs(u, adj, seen):
    seen.add(u)
    for v in adj[u]:
        if v not in seen: dfs(v, adj, seen)`,
      "Cycle Detection":
`# O(V+E) time · O(V) space (state + recursion). Method DIFFERS by graph type!

# DIRECTED graph -> 3-color DFS (0=unseen, 1=in-stack, 2=done).
# A cycle = a "back-edge" to a node still on the recursion stack (state 1).
def has_cycle_directed(n, adj):
    state = [0]*n
    def dfs(u):
        state[u] = 1
        for v in adj[u]:
            if state[v] == 1: return True        # back-edge -> cycle
            if state[v] == 0 and dfs(v): return True
        state[u] = 2; return False
    return any(state[i]==0 and dfs(i) for i in range(n))

# UNDIRECTED graph -> track the PARENT (the 3-color rule does NOT apply here,
# since every edge u-v looks like a 2-cycle). A visited neighbor that is not
# the parent means a real cycle.
def has_cycle_undirected(n, adj):
    seen = [False]*n
    def dfs(u, parent):
        seen[u] = True
        for v in adj[u]:
            if not seen[v]:
                if dfs(v, u): return True
            elif v != parent: return True        # visited & not parent -> cycle
        return False
    return any(not seen[i] and dfs(i, -1) for i in range(n))
# (Undirected cycle detection is also easy with Union-Find: see MST & DSU.)`,
      "Topological Sort":
`# O(V+E) time · O(V) space — Kahn's algo (BFS on indegrees)
# DIRECTED ACYCLIC graphs only; empty result signals a cycle exists.
from collections import deque, defaultdict
def topo(n, edges):
    adj = defaultdict(list); indeg = [0]*n
    for u, v in edges: adj[u].append(v); indeg[v] += 1
    q = deque(i for i in range(n) if indeg[i]==0); order = []
    while q:
        u = q.popleft(); order.append(u)
        for v in adj[u]:
            indeg[v] -= 1
            if indeg[v] == 0: q.append(v)
    return order if len(order)==n else []   # [] => cycle`,
      "Shortest Path":
`# BFS O(V+E) · Dijkstra O(E log V) · Bellman-Ford O(V*E) · Floyd O(V^3)
# O(V) for BFS/Dijkstra/Bellman-Ford (+heap), O(V^2) for Floyd's matrix.
# ALL four work on DIRECTED & UNDIRECTED graphs
# (an undirected edge u-w = two directed edges u->w and w->u).
# ⚠️ Negative weights only make sense for DIRECTED graphs: a single negative
#    undirected edge is itself a negative cycle (u->w->u forever).
from collections import deque
import heapq

# Unweighted -> BFS  (each edge = 1)
def bfs_dist(src, adj, n):
    dist = [-1]*n; dist[src] = 0; q = deque([src])
    while q:
        u = q.popleft()
        for v in adj[u]:
            if dist[v] == -1: dist[v] = dist[u]+1; q.append(v)
    return dist

# Non-negative weights -> Dijkstra (min-heap). Fails if any edge < 0.
def dijkstra(src, adj, n):
    dist = [float('inf')]*n; dist[src] = 0; pq = [(0, src)]
    while pq:
        d, u = heapq.heappop(pq)
        if d > dist[u]: continue                 # stale entry, skip
        for v, w in adj[u]:
            if d+w < dist[v]:
                dist[v] = d+w; heapq.heappush(pq, (dist[v], v))
    return dist

# Negative edges -> Bellman-Ford (relax every edge V-1 times).
def bellman_ford(edges, n, src):
    dist = [float('inf')]*n; dist[src] = 0
    for _ in range(n-1):
        for u, v, w in edges:
            if dist[u] + w < dist[v]: dist[v] = dist[u] + w
    # NEGATIVE-CYCLE CHECK: if any edge STILL relaxes, a negative cycle exists
    for u, v, w in edges:
        if dist[u] + w < dist[v]:
            return None                          # negative cycle reachable
    return dist

# All pairs -> Floyd-Warshall  (d = n x n matrix, inf if no edge)
def floyd(d, n):
    for k in range(n):
        for i in range(n):
            for j in range(n):
                d[i][j] = min(d[i][j], d[i][k] + d[k][j])
    # NEGATIVE-CYCLE CHECK: any d[i][i] < 0 means a negative cycle through i
    return d`,
      "MST & Union-Find (DSU)":
`# ~O(α(n)) ≈ O(1) per find/union · Kruskal O(E log E) · O(V) space
# DSU on an UNDIRECTED graph: union() returning False (same set) = a cycle.
parent = list(range(n)); rank = [0]*n
def find(x):
    while parent[x] != x:
        parent[x] = parent[parent[x]]        # path compression
        x = parent[x]
    return x
def union(a, b):
    ra, rb = find(a), find(b)
    if ra == rb: return False                # cycle / already joined
    if rank[ra] < rank[rb]: ra, rb = rb, ra
    parent[rb] = ra; rank[ra] += (rank[ra]==rank[rb])
    return True
# Kruskal: sort edges by weight, union() each; skip if returns False`,
      "Advanced (bridges / SCC / bipartite)":
`# O(V+E) time · O(V) space — 2-color BFS (bipartite = UNDIRECTED graphs)
from collections import deque
def is_bipartite(n, adj):
    color = [0]*n
    for s in range(n):
        if color[s]: continue
        color[s] = 1; q = deque([s])
        while q:
            u = q.popleft()
            for v in adj[u]:
                if color[v] == color[u]: return False
                if not color[v]: color[v] = -color[u]; q.append(v)
    return True`,

      "Insert / Search / Prefix":
`# O(L) per insert/search (L = word length) · O(total chars) space
class Trie:
    def __init__(self): self.root = {}
    def insert(self, w):
        node = self.root
        for c in w: node = node.setdefault(c, {})
        node['$'] = True
    def search(self, w, prefix=False):
        node = self.root
        for c in w:
            if c not in node: return False
            node = node[c]
        return prefix or '$' in node`,
      "Bitwise Trie (XOR)":
`# O(n·32) time · O(n·32) space — at each bit, greedily go opposite
# maximize XOR: greedily pick the opposite bit at each level
def max_xor(nums):
    root = {}; best = 0
    for x in nums:
        node = ins = root; cur = 0
        for b in range(31, -1, -1):
            bit = (x >> b) & 1
            ins = ins.setdefault(bit, {})
            want = 1 - bit
            if want in node: cur |= (1<<b); node = node[want]
            else: node = node.get(bit, node)
        best = max(best, cur)
    return best`,

      "1D DP (take / not-take)":
`# O(n) time · O(1) space — roll two states: take vs skip
def rob(nums):                  # house robber
    take, skip = 0, 0
    for x in nums:
        take, skip = skip + x, max(skip, take)
    return max(take, skip)`,
      "Grid / 2D DP":
`# O(m·n) time · O(n) space — 1 row rolled; dp[j] += dp[j-1]
def unique_paths(m, n):
    dp = [1]*n
    for _ in range(1, m):
        for j in range(1, n):
            dp[j] += dp[j-1]
    return dp[-1]`,
      "Subsequences / Knapsack":
`# O(n·cap) time · O(n·cap) space — memoize (index, remaining capacity)
from functools import lru_cache
@lru_cache(None)
def knap(i, cap):               # 0/1 knapsack
    if i == n or cap == 0: return 0
    best = knap(i+1, cap)                       # skip
    if wt[i] <= cap:
        best = max(best, val[i] + knap(i+1, cap-wt[i]))  # take
    return best`,
      "Strings DP (LCS family)":
`# O(m·n) time · O(m·n) space — match: diag+1, else max(up, left)
def lcs(a, b):
    m, n = len(a), len(b)
    dp = [[0]*(n+1) for _ in range(m+1)]
    for i in range(1, m+1):
        for j in range(1, n+1):
            dp[i][j] = dp[i-1][j-1]+1 if a[i-1]==b[j-1] else max(dp[i-1][j], dp[i][j-1])
    return dp[m][n]`,
      "LIS & Stocks":
`# O(n log n) time · O(n) space — patience: replace first tail >= x
import bisect
def lis(a):                     # O(n log n)
    tails = []
    for x in a:
        i = bisect.bisect_left(tails, x)
        if i == len(tails): tails.append(x)
        else: tails[i] = x
    return len(tails)`,
      "Partition / MCM / Interval DP":
`# O(n^3) time · O(n^2) space — try each k as the LAST balloon in (l,r)
from functools import lru_cache
def burst_balloons(nums):
    a = [1] + nums + [1]
    @lru_cache(None)
    def dp(l, r):
        if l+1 == r: return 0
        return max(a[l]*a[k]*a[r] + dp(l,k) + dp(k,r)
                   for k in range(l+1, r))
    return dp(0, len(a)-1)`,
      "DP on Trees / Bitmask":
`# O(n) time · O(h) space — each node returns (rob, skip) pair
def rob_tree(root):             # return (rob_this, skip_this)
    def dfs(n):
        if not n: return (0, 0)
        l, r = dfs(n.left), dfs(n.right)
        rob = n.val + l[1] + r[1]
        skip = max(l) + max(r)
        return (rob, skip)
    return max(dfs(root))`,

      "XOR tricks":
`# O(n) time · O(1) space — equal pairs cancel under XOR
def single_number(nums):        # every element twice except one
    x = 0
    for v in nums: x ^= v       # pairs cancel
    return x`,
      "Counting & masks":
`# O(n) time · O(n) space — dp[i] = dp[i>>1] + (i&1)
def count_bits(n):
    dp = [0]*(n+1)
    for i in range(1, n+1):
        dp[i] = dp[i >> 1] + (i & 1)
    return dp`,

      "Merge Sort & inversions":
`# O(n log n) time · O(n) space — split, sort halves, merge (stable)
def merge_sort(a):
    if len(a) <= 1: return a
    m = len(a)//2
    L, R = merge_sort(a[:m]), merge_sort(a[m:])
    out = []; i = j = 0
    while i < len(L) and j < len(R):
        if L[i] <= R[j]: out.append(L[i]); i += 1
        else: out.append(R[j]); j += 1
    return out + L[i:] + R[j:]`,
      "Quick Select & partition":
`# O(n) average, O(n^2) worst · O(n) space — partition, recurse one side
import random
def quickselect(a, k):          # kth smallest (0-indexed)
    pivot = random.choice(a)
    lo = [x for x in a if x < pivot]
    eq = [x for x in a if x == pivot]
    hi = [x for x in a if x > pivot]
    if k < len(lo): return quickselect(lo, k)
    if k < len(lo)+len(eq): return pivot
    return quickselect(hi, k-len(lo)-len(eq))`,
      "Counting / Bucket / Radix":
`# O(n + k) time · O(k) space — tally counts, then expand (no compares)
def counting_sort(a, k):        # values in 0..k
    cnt = [0]*(k+1)
    for x in a: cnt[x] += 1
    out = []
    for v, c in enumerate(cnt): out += [v]*c
    return out`,

      "Fenwick Tree (BIT)":
`# O(log n) per update/query · O(n) space — i & -i jumps by lowest set bit
class BIT:                      # 1-indexed
    def __init__(self, n): self.t = [0]*(n+1)
    def update(self, i, delta):
        while i < len(self.t): self.t[i] += delta; i += i & -i
    def query(self, i):         # prefix sum [1..i]
        s = 0
        while i > 0: s += self.t[i]; i -= i & -i
        return s`,
      "Segment Tree (+ Lazy)":
`# O(n) build · O(log n) update/query · O(n) space — iterative, 2n array
class SegTree:                  # range sum, point update
    def __init__(self, a):
        self.n = len(a); self.t = [0]*(2*self.n)
        for i in range(self.n): self.t[self.n+i] = a[i]
        for i in range(self.n-1, 0, -1): self.t[i] = self.t[2*i]+self.t[2*i+1]
    def update(self, i, val):
        i += self.n; self.t[i] = val
        while i > 1: i //= 2; self.t[i] = self.t[2*i]+self.t[2*i+1]
    def query(self, l, r):      # [l, r)
        l += self.n; r += self.n; s = 0
        while l < r:
            if l & 1: s += self.t[l]; l += 1
            if r & 1: r -= 1; s += self.t[r]
            l //= 2; r //= 2
        return s`,
    };
