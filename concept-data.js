/* concept-data.js, the single source of truth for BOTH learning pages.

   concept.html  reads every field  -> the full deep page for one concept
   revise.html   reads `one` + `q`  -> the fast recall pass

   The order of sections is fixed for every concept, so you always know what comes next:
     one, the sentence you say out loud in an interview
     viz, see the mechanism move, one step at a time
     plain, what it is, in words a beginner would follow, plus one analogy
     why, why it works, built up from nothing; no memorised facts
     hing, the same hard part again, in Hinglish
     math, the working, with real numbers in it rather than assertions
     costs, the cost table, the traps, and what your language calls it
     code, pseudocode first, then Python / Java / C++ / JavaScript
     q, check yourself; if you cannot answer these, go back to `why`
     p, practice problems

   Authoring rules live in CONTENT-GUIDE.md. Keep `one` under 30 words. It is the
   whole revision page.

   Node: { id, n, group, one, plain, why:[{t,d}], hing, math:[{t,d,w}], viz:[],
           see:[[src,url,title]], costs:[[op,cost,why]], traps:[], impl:[[lang,api,note]],
           code:{pseudo,py,java,cpp,js}, codecap,
           q:[[question,answer]], p:[[num|SRC, slug|url, title, "E|M|H"]] }
*/

const CONCEPTS = [

/* ==================================================================== */
{
  id: "big-o",
  n: "Big-O, how to judge an algorithm",
  group: "Fundamentals",
  one: "Big-O is the <b>shape of the growth curve</b>, not the speed. It answers one question: if the input gets 10× bigger, what happens to the work?",

  plain: `<p>Two programs solve the same problem. One takes 5 seconds on your laptop, the other 8 seconds. Which is better? <b>You cannot tell yet.</b> Ask instead: what happens when the input goes from 1,000 items to 1,000,000?</p>
<p>The 5-second one might become 5 hours. The 8-second one might become 9 seconds. Big-O measures <b>that</b>, how the work grows with the input, and deliberately throws away everything else: the constant factors, the language, the CPU, the coffee break.</p>
<p><b>Analogy.</b> You are told a road trip takes "about 4 hours". Useless. Is that with traffic, in a truck, at night? But "the time doubles every extra 100 km" tells you something real about the <i>road</i>, no matter what car you drive. Big-O describes the road, not the car.</p>`,

  why: [
    { t: "Compare the algorithm, not the computer",
      d: "How many seconds your code takes depends on the machine, the language, and what else is running. None of that is about the algorithm. So we stop counting seconds and start counting <b>steps</b>." },
    { t: "Constants do not matter, growth does",
      d: "Is <code>3n</code> better than <code>5n</code>? Barely, a faster machine erases that gap. What no machine can erase is the gap between <code>n</code> and <code>n²</code>. So we throw away the constants and keep only the growth." },
    { t: "Only the biggest term survives",
      d: "Take <code>n² + 1000n</code>. At n = a million, the n² part is a thousand times bigger than the other. The small term stops mattering, so we write just <b>O(n²)</b>." },
    { t: "Read it off the shape of the code",
      d: "One loop → <b>O(n)</b>. A loop inside a loop → <b>O(n²)</b>. Halving the problem each step → <b>O(log n)</b>. Sorting → <b>O(n log n)</b>. Two recursive calls per level → <b>O(2ⁿ)</b>. Loops one after another <i>add</i>; nested loops <i>multiply</i>." },
    { t: "Space is measured the same way, and the stack counts",
      d: "Half of judging an algorithm is memory, and it is the half people forget to state. Count anything that grows with the input: the hash map you built, the array you copied, and the <b>call stack</b>. A recursive solution with no data structures at all is still O(depth) space, which is why a depth of 10⁵ crashes rather than merely slows. Give both numbers unprompted; being asked for the space complexity is a sign you should have said it already." },
    { t: "Always say which case you mean",
      d: "A hash map is O(1) on <i>average</i> and O(n) at <i>worst</i>. Quicksort is O(n log n) average and O(n²) worst. Best, average and worst are three different claims about three different things, and answering with the wrong one is not a rounding error." },
    { t: "Amortised is a fourth claim, and it is not the average",
      d: "Average case is about the distribution of <i>inputs</i>: on typical data, this is what happens. <b>Amortised</b> is a claim about a <i>sequence of operations</i>, not about one call. Any n appends cost under 2n in total, so the average is O(1). That is a <b>guarantee</b>, not a hope. An adversary can defeat an average case by choosing nasty input, and cannot defeat an amortised bound at all. Saying \"average\" when you mean \"amortised\" gives away that the distinction has not landed." },
  ],

  variants: [
    { n: "Worst case", cost: "the default, and what O(...) means unqualified",
      idea: "The most work any input of size n could force. Nothing is assumed about the data.",
      when: "Always state this one unless you say otherwise. It is what an interviewer means by \"the complexity\".",
      watch: "It is often driven by an input nobody would ever actually supply, which is exactly why quicksort survives being O(n²) on paper." },

    { n: "Average case", cost: "over a distribution of inputs",
      idea: "The expected work assuming inputs arrive in some typical spread. Hash maps and quicksort are both sold on this number.",
      when: "When the worst case is real but pathological, and you can say what typical means.",
      watch: "It quietly assumes a distribution. An adversary choosing colliding keys or sorted input defeats it, which is why runtimes randomise hashes and pivots." },

    { n: "Amortised", cost: "a guarantee over a sequence, not a hope",
      idea: "Total cost of n operations divided by n. Dynamic array append is O(1) amortised because the doubling copies sum to under 2n across the whole run.",
      when: "Anything with occasional expensive rebuilds: growable arrays, hash table resizing, union-find with path compression.",
      watch: "Not the same as average. This one holds for every sequence, so no input can break it. Say the word out loud." },

    { n: "Best case", cost: "almost never the answer to anything",
      idea: "The least work some input could require. Insertion sort is O(n) on already-sorted data.",
      when: "Only when the problem genuinely promises the easy shape, such as nearly-sorted input for Timsort.",
      watch: "Leading with the best case reads as either evasion or misunderstanding. Volunteer it only as a bonus after the worst case." },

    { n: "Expected, for randomised algorithms", cost: "over the algorithm's own coin flips",
      idea: "Randomised quicksort and quickselect are O(n log n) and O(n) expected. The randomness is inside the algorithm rather than in the input.",
      when: "When you deliberately randomise to remove the adversary, which is the whole point of a random pivot.",
      watch: "Different from average case: here no input can be unlucky, only the coin flips can, and the odds of sustained bad luck are vanishing." },

    { n: "Space complexity", cost: "counted exactly like time",
      idea: "Extra memory that grows with the input: structures you allocate, plus the recursion stack.",
      when: "Every single time. Half the follow-up questions in an interview are can you do it in O(1) space.",
      watch: "The output usually does not count against it, and the call stack usually does. State which convention you are using and nobody can disagree with you." },
  ],

  hing: `<p><b>Asli sawaal kya hai?</b> Big-O time nahi naapta, <b>growth</b> naapta hai. Do code likhe, ek 5 second leta hai, doosra 8 second. Isse kuch pata nahi chalta. Sahi sawaal: input 10 guna bada karo, to kaam kitna badhega? 10 guna, ya 100 guna?</p>
<p><b>Constants kyun hataate hain?</b> <code>3n</code> aur <code>5n</code>, inka farak sirf ek constant hai, aur woh tez laptop se khatam ho jaata hai. Par <code>n</code> aur <code>n²</code> ka farak koi laptop nahi mita sakta. Isliye hum constants phenk dete hain aur sirf <b>shape</b> rakhte hain. Yahi Big-O ki poori philosophy hai.</p>
<p><b>Sabse bada term hi bachta hai.</b> <code>n² + 1000n</code> mein n = 10 lakh daalo: n² wala hissa 10¹², aur 1000n wala 10⁹, hazaar guna chhota. Bade n par chhota term dikhai hi nahi deta. Isliye answer sirf <b>O(n²)</b>.</p>
<p><b>Code dekh kar kaise batayein?</b> Ek loop = <b>O(n)</b>. Loop ke andar loop = <b>O(n²)</b>. Har step mein problem aadhi ho rahi hai (binary search) = <b>O(log n)</b>. Sort = <b>O(n log n)</b>. Har call se do naye call ban rahe hain (plain recursion) = <b>O(2ⁿ)</b>.</p>
<p><b>Interview trick.</b> Agar constraint mein <code>n ≤ 10⁵</code> likha hai, to O(n²) = 10¹⁰ operations = TLE pakka. Matlab interviewer ne <b>constraints mein hi answer ka hint de diya hai</b>, O(n) ya O(n log n) chahiye. Yaad rakho: ~10⁸ operations per second, yeh ek mota andaaza hai jo hamesha kaam aata hai.</p>
<p><b>Aur ek baat</b>, "O(1) average" aur "O(n) worst" alag cheezein hain. Hash map average O(1) hai, worst case O(n). Interview mein hamesha bolo <i>kaunsa case</i>, warna aadha marks katta hai.</p>`,

  viz: ["big-o"],
  see: [["VA", "https://www.bigocheatsheet.com/", "Big-O cheat sheet, every structure on one chart"]],

  math: [
    { t: "Constants lose to growth, and you can watch the moment they lose", d: "A hundred times faster per step is a constant. It buys you one factor, once. The growth term keeps charging.", w:
`            f(n) = 100 n      g(n) = n^2 / 10
n = 10             1,000                   10
n = 100           10,000                1,000
n = 1,000        100,000              100,000   <- they cross
n = 10,000     1,000,000           10,000,000
n = 100,000   10,000,000        1,000,000,000   <- 100x apart` },
    { t: "Only the biggest term survives, and here is the share it takes", d: "Nobody drops the smaller terms because they are unimportant. They are dropped because the arithmetic makes them disappear on their own.", w:
`T(n) = n^2 + 100 n + 5000

n            n^2        100 n     5000   share of n^2
10           100        1,000    5,000          1.6 %
100       10,000       10,000    5,000           40 %
1,000  1,000,000      100,000    5,000           90 %
100,000     1e10      1e7        5,000         99.9 %` },
    { t: "The 10x test, which is the only question the notation answers", d: "Multiply the input by ten and see what happens to the work. Everything else about Big-O is commentary on this table.", w:
`growth        n = 10^6     n = 10^7    work grows by
O(1)                 1            1            1.0x
O(log n)            20           23            1.2x
O(n)               1e6          1e7             10x
O(n log n)     2 x 10^7    2.3 x 10^8          11.5x
O(n^2)            1e12         1e14            100x` },
    { t: "Where the one-second budget comes from", d: "About 10^8 simple operations per second is the working figure. Read n off the constraints, divide, and the growth you are allowed to use is settled before you have had an idea.", w:
`budget: roughly 10^8 operations in a second

n            affordable      the arithmetic
10^9         O(log n)        30 steps
10^7         O(n)            10^7
10^6         O(n log n)      10^6 x 20 = 2 x 10^7
10^4         O(n^2)          10^8
500          O(n^3)          1.25 x 10^8
20           O(2^n)          1.05 x 10^6
11           O(n!)           4 x 10^7` },
    { t: "Amortised, summed rather than asserted", d: "Amortised O(1) is a claim about a whole sequence of operations, and it is proved by adding up the expensive ones and finding the total is still linear.", w:
`a growable array doubling 1 -> 2 -> 4 -> ... -> n
copies done on the way:  1 + 2 + 4 + ... + n/2  =  n - 1
n appends cost   n writes + (n - 1) copies  <  2n
per append:      2n / n = 2 operations, a constant

worst single append is still n. Amortised is the average
over the sequence, not a promise about any one call.` },
  ],

  costs: [
    ["O(1)", "constant", "dict/set lookup, array index, arithmetic, append. Input size is irrelevant."],
    ["O(log n)", "halving", "binary search, heap push/pop, balanced-tree ops. n = 10⁶ → ~20 steps."],
    ["O(n)", "one scan", "a single loop, one pass with two pointers, one hash-map pass."],
    ["O(n log n)", "sort", "any comparison sort. The practical ceiling for n up to ~10⁶."],
    ["O(n²)", "nested loops", "every pair. Fine to n ≈ 5,000; dead beyond that."],
    ["O(2ⁿ) / O(n!)", "explosion", "subsets / permutations / naive recursion. Only for n ≲ 20."],
  ],

  traps: [
    "<b>Forgetting space.</b> Recursion depth counts. A recursive DFS on a 10⁵-node path is O(n) stack. It blows Python's ~1000-frame default and overflows a default JVM/C++ stack too.",
    "<b>Hidden loops in library calls.</b> <code>x in my_list</code> is O(n), not O(1). Wrapping it in a loop gives you a silent O(n²).",
    "<b>Averaging over the wrong thing.</b> A single <code>append</code> can be O(n) when the list resizes; it is O(1) <i>amortised</i>. Say the word. It is what they are listening for.",
    "<b>Two separate loops ≠ O(n²).</b> One after the other is O(n) + O(n) = O(n). Only <i>nesting</i> multiplies.",
    "<b>Giving a loose bound.</b> O is an <i>upper</i> bound, so calling a linear scan O(n²) is technically true and completely useless. Interviewers want the <b>tight</b> bound, which is what Θ means. Nobody will make you write the theta, but they will notice if your answer is not tight.",
    "<b>Letting the input size hide inside a value.</b> Looping to <code>n</code> where n is the <i>value</i> of an input number, not the length of an array, is exponential in the number of digits. This is why knapsack is called pseudo-polynomial and why it stops being fast when the numbers get big.",
  ],

  impl: [
    ["Python", "list · dict · set", "int is arbitrary precision, no overflow, but huge ints stop being O(1) arithmetic."],
    ["Java", "ArrayList · HashMap · HashSet", "Arrays.sort on primitives is quicksort (O(n²) worst); on objects it is TimSort."],
    ["C++", "vector · unordered_map · map", "map/set are O(log n) trees; unordered_* are O(1)-average hash tables. Know which you picked."],
    ["JavaScript", "Array · Map · Set", "Array.sort() compares as STRINGS by default, always pass a comparator for numbers."],
  ],

  code: {
    pseudo: `# Complexity is read off the SHAPE of the code, same in every language.

f1(a):  return a[0] + a[last]            # O(1)      n never appears
f2(a):  for x in a: total <- total + x   # O(n)      one pass
f3(a):  f2(a); f2(a)                     # O(n)      sequential work ADDS
f4(a):  for x in a: for y in a: ...      # O(n^2)    nesting MULTIPLIES
f5(a):  while range not empty:           # O(log n)  the range halves
            discard half of it
f6(a):  sort(a); scan(a)                 # O(n log n) the sort dominates

# Space is counted the same way, and the call stack COUNTS:
#   recursion of depth d  ->  O(d) space, even with no data structures

# The budget that picks your approach (~10^8 simple ops per second):
#   n <= 20      ->  O(2^n)  backtracking is fine
#   n <= 5_000   ->  O(n^2)  is fine
#   n <= 10^6    ->  need O(n log n) or O(n)
#   n >  10^7    ->  need O(n) or O(log n), and watch memory`,
    py: `# Read complexity off the structure, no memorisation needed.

def f1(a):                 # O(1), input size never enters
    return a[0] + a[-1]

def f2(a):                 # O(n), one pass
    return sum(a)

def f3(a):                 # O(n). TWO passes is still O(n)
    return sum(a) + max(a)

def f4(a):                 # O(n²), nested: n * n
    for x in a:
        for y in a:
            if x + y == 0: return True
    return False

def f5(a, t):              # O(log n), the space halves every step
    lo, hi = 0, len(a) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if a[mid] == t: return mid
        if a[mid] < t: lo = mid + 1
        else: hi = mid - 1
    return -1

def f6(a):                 # O(n log n), sort dominates the O(n) scan
    a.sort()
    return a[len(a)//2]

# The budget that decides your approach (≈10^8 ops/second):
#   n ≤ 20        -> O(2^n)  backtracking is fine
#   n ≤ 5_000     -> O(n²)   is fine
#   n ≤ 10^6      -> need O(n log n) or O(n)
#   n > 10^7      -> need O(n) or O(log n), and watch memory`,
    java: `// Same shapes, plus the library costs you are expected to know.
int  f1(int[] a) { return a[0] + a[a.length - 1]; }              // O(1)
int  f2(int[] a) { int s = 0; for (int x : a) s += x; return s; } // O(n)
boolean f4(int[] a) {                                             // O(n^2)
    for (int x : a) for (int y : a) if (x + y == 0) return true;
    return false;
}

Arrays.sort(int[])        // O(n log n) dual-pivot quicksort, O(n^2) worst case
Collections.sort(list)    // O(n log n) TimSort, stable
list.contains(x)          // O(n)   <-- set.contains(x) is O(1) average
list.remove(0)            // O(n)   shifts every element
map.get(k)                // O(1) average; a long bucket becomes a tree -> O(log n)`,
    cpp: `// Same shapes, plus the library costs.
int  f1(const vector<int>& a) { return a.front() + a.back(); }          // O(1)
long f2(const vector<int>& a) {                                          // O(n)
    return accumulate(a.begin(), a.end(), 0L);
}

sort(v.begin(), v.end());          // O(n log n) introsort, NOT stable
stable_sort(v.begin(), v.end());   // O(n log n), needs extra memory
find(v.begin(), v.end(), x);       // O(n)
v.insert(v.begin(), x);            // O(n)  shifts every element
unordered_map::find                // O(1) average, O(n) worst
map::find                          // O(log n). It is a red-black tree, not a hash`,
    js: `// Same shapes, plus the library costs.
const f1 = a => a[0] + a[a.length - 1];          // O(1)
const f2 = a => a.reduce((s, x) => s + x, 0);    // O(n)

a.sort((x, y) => x - y)   // O(n log n). WITHOUT the comparator it sorts as strings
a.includes(x)             // O(n)   <-- new Set(a).has(x) is O(1) average
a.shift()                 // O(n)   removes from the front
a.indexOf(x)              // O(n)
map.get(k) / set.has(k)   // O(1) average`,
  },
  codecap: "Every complexity you need for interviews, read straight off the shape of the code.",

  q: [
    ["Why do we drop constants in Big-O?", "Because a constant factor is exactly what a faster machine or compiler can erase. It says nothing about the algorithm. A different growth class (n vs n²) is something no hardware can fix."],
    ["Why does n² + 1000n simplify to O(n²)?", "At large n the biggest term dominates: at n = 10⁶ the n² term is a thousand times larger than 1000n. Big-O describes the limit, so only the fastest-growing term survives."],
    ["Constraint says n ≤ 10⁵. What complexity do you need, and why?", "O(n) or O(n log n). O(n²) would be 10¹⁰ operations ≈ 100 s at ~10⁸ ops/sec → TLE. The constraint is the interviewer telling you the intended complexity."],
    ["Two loops one after the other, O(n) or O(n²)?", "O(n). Sequential work adds (n + n = 2n → O(n)). Only nested loops multiply."],
    ["What does 'append is O(1) amortised' actually mean?", "A single append is usually O(1) but occasionally O(n) when the array doubles and copies. Averaged over n appends the total is under 2n, so each one costs O(1) across the sequence."],
    ["What is the difference between average case and amortised?", "Average case is over a distribution of inputs, so a nasty input can defeat it. Amortised is over a sequence of operations and holds for every input, which makes it a guarantee rather than an expectation."],
    ["How do you count space complexity, and what do people forget?", "Anything that grows with the input, including the call stack. A recursive solution with no data structures is still O(depth) space, which is why deep recursion crashes rather than merely slows."],
  ],

  p: [
    ["GFG", "https://www.geeksforgeeks.org/analysis-algorithms-big-o-analysis/", "GFG, Big-O analysis", "E"],
    [1, "two-sum", "Two Sum, state the brute force AND the O(n) cost", "E"],
    [217, "contains-duplicate", "Contains Duplicate, the list to set swap", "E"],
    [121, "best-time-to-buy-and-sell-stock", "Best Time to Buy and Sell, O(n²) to O(n)", "E"],
    [242, "valid-anagram", "Valid Anagram, sorting against counting", "E"],
    [704, "binary-search", "Binary Search, O(n) to O(log n)", "E"],
    [53, "maximum-subarray", "Maximum Subarray, three complexities for one problem", "M"],
  ],
},

/* ==================================================================== */
{
  id: "memory",
  n: "Memory, pointers and references",
  group: "Fundamentals",
  one: "A variable does not contain your object. It holds the <b>address</b> of one. So <code>b = a</code> copies the address, not the thing, and now two names can change one object.",

  plain: `<p>Memory is one long strip of numbered slots. A variable is a name for one slot. A small fixed-size value like an integer fits in that slot directly. A list, an object or a string has no size known in advance, so it cannot.</p>
<p>Instead the object is built somewhere else in memory, and the slot holds its <b>address</b>. That address is what a pointer is. A reference is the same idea with the dereferencing hidden from you.</p>
<p>Everything surprising follows from that one fact. <code>b = a</code> copies the slot, which means it copies the address, so both names now describe the same object. Change it through one and the other sees the change, because there was only ever one object.</p>
<p><b>Analogy.</b> A slip of paper with a house address on it. Photocopy the slip and you have two slips, not two houses. Anyone who follows either slip walks into the same living room and can move the furniture.</p>`,

  why: [
    { t: "Only fixed-size things can live in the variable itself", d: "A memory slot has a fixed size decided in advance. An integer fits. A list that might hold three items or three million cannot, so it has to be built somewhere else, and the variable holds the <b>address</b> of where. That address is a pointer, and a reference is a pointer with the arrow-following done for you." },
    { t: "So assignment copies the address, not the object", d: "<code>b = a</code> does exactly what it says: it copies what is in the variable. What is in the variable is an address. Nothing is duplicated, nothing is allocated, and there is still one object, now with two names pointing at it. That is <b>aliasing</b>, and it is not a language quirk; it is the only thing assignment could sensibly mean." },
    { t: "Which is why a function can change your list", d: "Arguments are copied too, but again it is the <b>address</b> that gets copied. So the function has its own name for your object and can mutate it. It cannot, however, make your variable point somewhere else, because it only got a copy of the arrow. This is exactly why reassigning a parameter does nothing to the caller while calling <code>.append</code> on it does." },
    { t: "Copying has depth, and shallow is the default", d: "A copy of a list duplicates the <b>outer</b> container and its addresses. Anything those addresses point to is still shared. That is the whole explanation for <code>[[0]*3]*3</code>: you built one row and stored its address three times, so writing to <code>g[0][0]</code> appears to change every row. A deep copy follows every arrow and duplicates all the way down." },
    { t: "Immutable objects make all of this disappear", d: "You can only observe aliasing by <i>changing</i> something. If an object cannot change, a string, a number, a tuple, then sharing it is invisible and completely safe. That is a large part of why languages make strings immutable, and why immutable values are safe to use as hash-map keys and to hand between threads." },
    { t: "Two lifetimes: the frame dies, the object need not", d: "Local names live in a <b>stack frame</b> that is discarded when the function returns. The object they point to lives elsewhere, on the <b>heap</b>, and survives as long as something still points at it. Garbage-collected languages free it when nothing does; C++ makes it your job, and returning the address of a dead local is the classic dangling-pointer bug." },
    { t: "And null is an address that points at nothing", d: "A pointer has to be able to say \"no object\". Following it is the most common crash in the industry. That is why every tree and linked-list function starts by checking for it, and why languages keep inventing ways to make the check impossible to forget." },
  ],

  hing: `<p><b>Sabse pehle asli baat:</b> variable ke andar tumhara object <b>nahi</b> hota. Uske andar object ka <b>pata (address)</b> hota hai. Bas isi ek baat se aage sab kuch samajh aa jaata hai.</p>
<p><b>Aisa kyun?</b> Memory ka ek slot fixed size ka hota hai. Ek integer usme fit ho jaata hai. Par list, jo 3 cheezein bhi rakh sakti hai aur 30 lakh bhi, usme fit nahi ho sakti. To list kahin aur banti hai, aur variable mein sirf <b>uska address</b> rakha jaata hai. Wahi <b>pointer</b> hai. <b>Reference</b> bhi wahi cheez hai, bas arrow follow karna tumhe khud nahi karna padta.</p>
<p><b>Ab <code>b = a</code> kya karta hai?</b> Jo variable ke andar hai wahi copy karta hai, matlab <b>address copy karta hai, list nahi</b>. Naya kuch bana hi nahi. Ek hi list hai, ab uske do naam hain. Isi ko <b>aliasing</b> kehte hain.</p>
<p><b>Isliye <code>b.append(4)</code> karne par <code>a</code> bhi badal jaata hai.</b> Yeh language ka bug nahi, list to shuru se ek hi thi. <b>Interview code mein sabse zyada chupa hua bug yahi hai.</b></p>
<p><b>Function ko list bhejne par bhi yahi hota hai.</b> Address copy hota hai, isliye function tumhari list <b>badal sakta hai</b>. Par woh tumhare variable ko kisi <b>doosri</b> list par point nahi kara sakta, kyunki uske paas sirf arrow ki copy hai. Isiliye parameter ko <code>=</code> se badalna bahar dikhta nahi, par <code>.append()</code> dikhta hai.</p>
<p><b>Copy ki gehrai (yeh zaroor samajhna):</b> normal copy sirf <b>bahar wala dabba</b> naya banata hai, andar ke addresses wahi purane rehte hain, ise <b>shallow copy</b> kehte hain. Isiliye <code>[[0]*3]*3</code> mein ek hi row banti hai aur uska address teen baar rakha jaata hai; <code>g[0][0]</code> badlo to teeno rows badli dikhti hain. Sahi tarika: <code>[[0]*c for _ in range(r)]</code>. Har arrow ke peeche jaakar copy karna <b>deep copy</b> hai.</p>
<p><b>Immutable cheezein is poori jhanjhat se bahar hain.</b> Aliasing sirf tab dikhta hai jab cheez <b>badal</b> sakti ho. String, number, tuple badal hi nahi sakte, isliye unhe share karna bilkul safe hai, aur isiliye woh hash map ki keys ban sakte hain.</p>
<p><b>Aur backtracking wali galti:</b> <code>res.append(path)</code> mat likhna, woh badalti hui list ka address store karta hai, to saare results ek hi cheez ban jaate hain. <code>res.append(path[:])</code> likho, copy.</p>`,

  viz: ["aliasing"],
  see: [["DOC", "https://docs.python.org/3/library/copy.html", "Python docs, shallow vs deep copy"]],

  math: [
    { t: "What the variable actually holds, in bytes", d: "A reference is one machine word. Everything else lives somewhere else, and the gap between those two numbers is where the surprise is.", w:
`64-bit machine: one reference = 8 bytes

a Python list of 1,000,000 small ints
  the pointer array   1e6 x 8  =   8 MB
  the int objects     1e6 x 28 =  28 MB
  total                           36 MB

the same data as a Java int[]  1e6 x 4 = 4 MB
9x, and none of it shows up in the Big-O` },
    { t: "Copying has depth, and the two depths cost different amounts", d: "A shallow copy duplicates the pointers. A deep copy duplicates what they point at. For a grid those are n and n x m.", w:
`grid = 1,000 rows x 1,000 columns

shallow copy:  1,000 pointers copied        O(rows)
deep copy:     1,000,000 cells copied       O(rows x cols)

[[0] * 3] * 4    -> 1 row object, 4 pointers to it
                    grid[0][0] = 9 shows up in all four rows
[[0] * 3 for _ in range(4)] -> 4 row objects, 12 cells` },
    { t: "Passing an object to a function, priced", d: "This is the one place where the language you are writing in changes the complexity rather than the constant.", w:
`hand a 1,000,000-element list to a function

by reference   8 bytes copied         O(1)
by value       1e6 elements copied    O(n)

Python, Java, JavaScript: always the first
C++: the second, unless you write & or const&` },
    { t: "The frame dies, the object need not", d: "Two lifetimes, counted separately. The local name is 8 bytes freed at return; the object survives for as long as anything still points at it.", w:
`def f():
    x = [1, 2, 3]     # frame: 8 bytes for x
    return x          # frame freed here

caller holds the list. references: 1
del that name         references: 1 -> 0, now it dies

so "the function returned" and "the memory was freed"
are two different events, and the second can be much later` },
  ],

  costs: [
    ["b = a (assignment)", "O(1)", "one address is copied; no object is created"],
    ["passing an argument", "O(1)", "the address is copied, so the callee can mutate what it points at"],
    ["shallow copy of n items", "O(n)", "duplicates the outer container and its n addresses"],
    ["deep copy", "O(total nodes)", "follows every arrow and duplicates all the way down"],
    ["identity check (is / ==)", "O(1)", "compares two addresses"],
    ["equality check (== / equals)", "O(n)", "compares contents, element by element"],
  ],

  traps: [
    "<b><code>[[0]*3]*3</code></b> stores one row's address three times. Build rows with a comprehension so each is a separate object.",
    "<b><code>res.append(path)</code> in backtracking.</b> You stored a reference to a list that keeps changing, append <code>path[:]</code>.",
    "<b>A mutable default argument</b> (<code>def f(acc=[])</code>) is created once and shared by every call. Use <code>None</code> and build inside.",
    "<b>Assuming a copy is deep.</b> Copying a list of lists shares the inner lists; only an explicit deep copy separates them.",
    "<b>Confusing identity with equality.</b> Two distinct lists can hold equal contents; <code>is</code> / <code>==</code> on objects asks a different question from <code>equals</code>.",
  ],

  impl: [
    ["Python", "everything is a reference · copy / deepcopy", "a[:] and list(a) are shallow. Immutable types (int, str, tuple) make sharing invisible."],
    ["Java", "references, never raw pointers", "No pointer arithmetic. clone() and copy constructors are shallow; == on objects compares addresses, equals() compares contents."],
    ["C++", "values by DEFAULT, the opposite", "Assignment copies the whole object unless you ask for T& or T*. Cheap sharing must be requested; deep copying is the default."],
    ["JavaScript", "objects by reference, primitives by value", "{...o} and slice() are shallow; structuredClone(o) is deep."],
  ],

  code: {
    pseudo: `# A variable holds an ADDRESS. Everything below follows from that.

a <- [1, 2, 3]        # build a list somewhere; a now points at it
b <- a                # copy the ARROW. One list, two names.
append(b, 4)          # a is [1,2,3,4] as well. There was only ever one list

c <- copyOf(a)        # a genuinely new list; c is independent now

# PASSING TO A FUNCTION copies the arrow too
f(list):
    append(list, 9)   # visible to the caller: same object
    list <- [7]       # NOT visible: only this local arrow was moved

# SHALLOW vs DEEP
outer <- [ inner, inner, inner ]     # one inner list, stored three times
shallowCopy(outer)                   # new outer box, SAME inner list
deepCopy(outer)                       # follows every arrow, duplicates all of it

# The 2-D grid trap, stated exactly
grid <- repeat(row, 3)               # WRONG: one row, three addresses
grid <- [ newRow() for each of 3 ]   # RIGHT: three separate rows

# IDENTITY asks "same address?"   EQUALITY asks "same contents?"`,
    py: `a = [1, 2, 3]
b = a                       # copies the reference, not the list
b.append(4)
print(a)                    # [1, 2, 3, 4]  <- same object
print(a is b)               # True, same address
c = a[:]                    # shallow copy: a new outer list
print(a is c, a == c)       # False True, different object, equal contents

# The grid trap
grid = [[0] * 3] * 3        # WRONG: one row object, three references
grid[0][0] = 9              # -> [[9,0,0], [9,0,0], [9,0,0]]
grid = [[0] * 3 for _ in range(3)]   # RIGHT: three independent rows

# Shallow is not enough when the items are themselves mutable
import copy
shallow = copy.copy(nested)      # inner lists still shared
deep    = copy.deepcopy(nested)  # fully independent

# Mutable default argument: created ONCE, shared by every call
def bad(x, acc=[]):  acc.append(x); return acc     # grows across calls
def good(x, acc=None):
    acc = [] if acc is None else acc
    acc.append(x); return acc

# Backtracking: store a snapshot, not the live list
res.append(path[:])`,
    java: `int[] a = {1, 2, 3};
int[] b = a;                    // copies the reference
b[0] = 9;
System.out.println(a[0]);       // 9  <- same array

int[] c = a.clone();            // shallow copy (fine for primitives)
List<Integer> d = new ArrayList<>(list);   // shallow copy of a list

// == compares addresses; equals compares contents
String s1 = new String("hi"), s2 = new String("hi");
s1 == s2;         // false, two objects
s1.equals(s2);    // true, same characters

// A 2-D array: each row is its own object, so this one is safe
int[][] grid = new int[3][3];
// but this shares one row three times:
int[] row = new int[3];
int[][] shared = { row, row, row };        // WRONG

// Backtracking: copy before storing
res.add(new ArrayList<>(path));`,
    cpp: `// C++ is the odd one out: assignment COPIES by default.
vector<int> a = {1, 2, 3};
vector<int> b = a;          // a full copy, O(n), independent
b.push_back(4);             // a is untouched

vector<int>& r = a;         // a reference: another name for the same object
r.push_back(4);             // a is now {1,2,3,4}

vector<int>* p = &a;        // a pointer: holds the address explicitly
p->push_back(5);
(*p).size();

void byValue(vector<int> v);        // copies the whole vector, usually wrong
void byRef(vector<int>& v);         // no copy, can modify
void byConstRef(const vector<int>& v);   // no copy, cannot modify, the default choice

// Dangling reference: the object dies at the closing brace
int& broken() { int x = 5; return x; }   // undefined behaviour

vector<vector<int>> grid(3, vector<int>(3, 0));   // three real rows`,
    js: `const a = [1, 2, 3];
const b = a;                  // copies the reference
b.push(4);
console.log(a);               // [1, 2, 3, 4]  <- same array
console.log(a === b);         // true, same object

const c = [...a];             // shallow copy
console.log(a === c, JSON.stringify(a) === JSON.stringify(c));  // false true

// Primitives are copied by value; objects are not
let x = 5, y = x; y++;        // x is still 5

// Shallow vs deep
const shallow = { ...nested };            // inner objects still shared
const deep    = structuredClone(nested);  // fully independent

// The grid trap
const bad  = Array(3).fill([]);                        // one array, three times
const good = Array.from({ length: 3 }, () => []);      // three arrays

// Backtracking: store a snapshot
res.push([...path]);`,
  },
  codecap: "One rule covers most of it: if you did not explicitly ask for a copy, you are sharing the object.",

  q: [
    ["What does a variable actually hold for a list or an object?", "The address of the object, not the object itself, because the object has no fixed size that could fit in the variable's slot. That address is a pointer; a reference is the same thing with the dereferencing hidden."],
    ["Why does b = a followed by b.append(4) change a?", "Assignment copies the address, so a and b name the same single object. Nothing was duplicated, so there is only one list to change."],
    ["A function can mutate the list you passed, but cannot make your variable point elsewhere. Why?", "It receives a copy of the address, so it reaches the same object and can modify it, but reassigning its own parameter only moves its private copy of the arrow."],
    ["What exactly goes wrong with [[0]*3]*3?", "It builds one row and stores that row's address three times, so all three entries are the same object. Writing to one appears to write to all three."],
    ["What is the difference between a shallow and a deep copy?", "A shallow copy duplicates the outer container and its addresses, leaving everything they point to shared. A deep copy follows every address and duplicates all the way down."],
    ["Why is aliasing harmless for strings and tuples?", "Aliasing is only observable when something changes. Immutable objects cannot change, so sharing them is invisible, which is also why they are safe as hash keys and across threads."],
  ],

  p: [
    [78, "subsets", "Subsets, store path[:], not path", "M"],
    [46, "permutations", "Permutations, the same snapshot trap", "M"],
    [289, "game-of-life", "Game of Life, in place, and why copying matters", "M"],
    [138, "copy-list-with-random-pointer", "Copy List with Random Pointer, a real deep copy", "M"],
    [133, "clone-graph", "Clone Graph, deep copy with a visited map", "M"],
  ],
},

/* ==================================================================== */
{
  id: "numbers",
  n: "Numbers: division, modulo and overflow",
  group: "Fundamentals",
  one: "Integer arithmetic is not school arithmetic: a fixed-width integer <b>wraps silently</b> past its limit, and division rounds a different way in Python than in Java or C++.",

  plain: `<p>Three things about numbers cause real bugs, and none of them are obvious until they bite.</p>
<p><b>Integers have edges.</b> A 32-bit <code>int</code> stops at about 2.1 billion. Go past it and it does not raise an error or saturate. It <b>wraps around to a large negative number</b> and carries on as if nothing happened.</p>
<p><b>Integer division has to choose a direction</b>, and languages disagree. <code>-7 / 2</code> is <code>-3</code> in Java, C++ and JavaScript, but <code>-4</code> in Python. Modulo inherits the disagreement, so <code>-7 % 3</code> is <code>-1</code> in one family and <code>2</code> in the other.</p>
<p><b>Floats are binary fractions.</b> 0.1 cannot be written exactly in binary, any more than 1/3 can be written exactly in decimal. So <code>0.1 + 0.2</code> is not <code>0.3</code>.</p>
<p><b>Analogy.</b> A car odometer with five digits. At 99999 the next mile does not read 100000 and it does not refuse. It reads 00000, and nothing anywhere records that it happened.</p>`,

  why: [
    { t: "A fixed-width integer is a fixed number of bits, so it has edges", d: "32 bits hold 2³² distinct patterns. Signed, that is −2,147,483,648 to 2,147,483,647. There is no room for anything larger, so the hardware does the only thing it can: it keeps the low 32 bits and discards the carry. The value <b>wraps</b>, silently and at full speed." },
    { t: "Which is why the classic binary-search line is a bug", d: "<code>(lo + hi) / 2</code> can overflow even when the answer is perfectly representable, because the intermediate sum is not. Writing <code>lo + (hi - lo) / 2</code> computes the same value without ever forming the large sum. This bug sat in the JDK for nine years." },
    { t: "Integer division must round, and the two families round oppositely", d: "-3.5 has to become an integer. C, C++, Java, Go and JavaScript <b>truncate toward zero</b> and give −3; Python <b>floors</b> toward negative infinity and gives −4. On non-negative numbers the two agree completely, which is exactly why the difference stays hidden until it matters." },
    { t: "Modulo follows division, so its sign follows too", d: "The two must satisfy <code>a == (a/b)*b + a%b</code>. So truncating leaves a remainder with the sign of the <b>dividend</b>: −7 % 3 = −1. Flooring leaves the sign of the <b>divisor</b>: −7 % 3 = 2. When you need an index, write <code>((x % n) + n) % n</code>. It is non-negative everywhere." },
    { t: "Floats trade exactness for range", d: "A double stores a binary fraction, so any value that is not a sum of powers of two, 0.1, 0.2, 0.3. Is stored approximately. The errors are tiny but real, and they accumulate. So never test floats for equality; compare against a small tolerance, or avoid floats entirely by scaling to integers (work in cents, not in rupees)." },
    { t: "The practical rules that follow", d: "Use 64-bit when a product or a sum might grow, <code>a * b</code> overflows long before <code>a</code> and <code>b</code> do. Check <i>before</i> multiplying rather than after (<code>a &gt; limit / b</code>), because the overflowed result tells you nothing. And know your language: Python integers grow without limit, so none of this applies until you port the solution somewhere else." },
  ],

  hing: `<p><b>Teen cheezein har baar bug deti hain, aur teeno tab tak dikhti nahi jab tak phas na jao.</b></p>
<p><b>1. Integer ki hadd hoti hai.</b> 32-bit <code>int</code> lagbhag 2.1 arab par khatam. Aage badho to na error aata hai, na ruk-ta hai, <b>ghoom kar bade negative number par pahunch jaata hai</b>. Chupchaap. Isi ko <b>overflow</b> kehte hain.</p>
<p><b>Isliye binary search ki woh famous line galat hai:</b> <code>(lo + hi) / 2</code>. Answer to range mein hai, par beech ka <b>jodh</b> range se bahar chala jaata hai. Sahi likho: <code>lo + (hi - lo) / 2</code>. Yeh bug Java ki library mein <b>9 saal</b> chhupa raha tha.</p>
<p><b>2. Integer division kis taraf ghumaaye?</b> -3.5 ko poora number banana hai. C, C++, Java, JavaScript <b>zero ki taraf</b> kaatte hain → <b>-3</b>. Python <b>neeche (floor)</b> jaata hai → <b>-4</b>. Positive numbers par dono barabar, isiliye yeh farak chhupa rehta hai.</p>
<p><b>3. Modulo bhi wahi ghumaav follow karta hai.</b> <code>-7 % 3</code> Java/C++ mein <b>-1</b>, Python mein <b>2</b>. Jab index chahiye (circular array, hash bucket), to hamesha likho:<br><code>((x % n) + n) % n</code>, yeh har jagah non-negative dega. <b>Yeh line yaad kar lo.</b></p>
<p><b>4. Float exact nahi hota.</b> Jaise decimal mein 1/3 poora nahi likha jaata, waise binary mein 0.1 poora nahi likha jaata. Isliye <code>0.1 + 0.2 != 0.3</code>. Float ko kabhi <code>==</code> se mat compare karo, thoda tolerance rakho, ya paisa "rupees" ki jagah "paise" (integer) mein rakho.</p>
<p><b>Practical niyam:</b> jahan guna ya jodh bada ho sakta hai wahan <b>64-bit (long)</b> use karo, <code>a * b</code> bahut pehle overflow ho jaata hai. Aur check <b>guna karne se pehle</b> karo (<code>a > limit / b</code>), baad mein nahi, overflow hone ke baad result se kuch pata nahi chalta. Python mein integers apne aap bade ho jaate hain, isliye yeh dikkat tab tak nahi jab tak solution Java/C++ mein na le jao.</p>`,

  viz: ["int-overflow", "division-rounding"],
  see: [["DOC", "https://en.wikipedia.org/wiki/Two%27s_complement", "Two's complement, how the wrap-around works"]],

  math: [
    { t: "The edges, written out", d: "A fixed-width integer is a fixed number of bits, so it has a first value and a last one. Past the last, it wraps rather than complaining.", w:
`signed 32-bit:  -2^31 .. 2^31 - 1
                -2,147,483,648 .. 2,147,483,647
signed 64-bit:  -2^63 .. 2^63 - 1  ~  +- 9.22 x 10^18

2,147,483,647 + 1 = -2,147,483,648
no exception, no warning, no log line` },
    { t: "The binary search midpoint bug, with the actual numbers", d: "Both bounds are legal 32-bit values. Their sum is not, and the wrapped result indexes somewhere that does not exist.", w:
`lo = 2,000,000,000    hi = 2,100,000,000   (both fit)

lo + hi     = 4,100,000,000  >  2,147,483,647
wraps to      4,100,000,000 - 2^32 = -194,967,296
/ 2         = -97,483,648      -> negative index

lo + (hi - lo) / 2
            = 2,000,000,000 + 50,000,000
            = 2,050,000,000   -> correct, never overflows` },
    { t: "The two rounding families, checked against the identity", d: "Both answers are self-consistent. They just answer a different question, and the difference only shows on negatives.", w:
`             -7 / 2      -7 % 2
Python          -4           1     floor, sign follows the divisor
Java, C++       -3          -1     truncate toward zero

the identity that must hold: q * b + r == a
Python:  -4 x 2 +  1 = -7
Java:    -3 x 2 + -1 = -7
so normalise with ((x % m) + m) % m when you need [0, m)` },
    { t: "Where a double stops counting", d: "A double has 53 bits of mantissa. Below that every integer is exact; above it, some of them simply are not there.", w:
`2^53     = 9,007,199,254,740,992
2^53 + 1 = 9,007,199,254,740,992    the +1 is lost

0.1 + 0.2 = 0.30000000000000004
  neither 0.1 nor 0.2 is representable in base 2

so compare with abs(a - b) < 1e-9, never with ==
and in JavaScript do integer work past 2^53 in BigInt` },
    { t: "Reduce as you go, not at the end", d: "The intermediate is what overflows, so the modulus goes inside the loop. Two values just under 10^9 multiply to just under 10^18, which is why the accumulator must be 64 bits.", w:
`(10^9) x (10^9) = 10^18        needs 60 bits, so long/int64
                               an int32 accumulator is gone

20! = 2.43 x 10^18   fits in int64, barely
21! = 5.11 x 10^19   does not

so never compute n! and then reduce: reduce every step` },
  ],

  costs: [
    ["32-bit signed int", "−2,147,483,648 … 2,147,483,647", "about 2.1 billion; overflows silently"],
    ["64-bit signed long", "about ±9.2 × 10¹⁸", "the usual fix when a sum or product may grow"],
    ["JavaScript number", "exact to ±2⁵³", "all numbers are doubles; use BigInt beyond that"],
    ["Python int", "unbounded", "grows with memory; arithmetic stops being O(1) when huge"],
    ["float / double", "~7 / ~15 decimal digits", "approximate, never compare with =="],
    ["a * b overflow check", "a > limit / b", "test before multiplying; afterwards is too late"],
  ],

  traps: [
    "<b><code>(lo + hi) / 2</code></b> in a fixed-width language. Use <code>lo + (hi - lo) / 2</code>.",
    "<b>Negative modulo as an index.</b> <code>-1 % n</code> is negative in Java, C++ and JavaScript, wrap it with <code>((x % n) + n) % n</code>.",
    "<b>Comparing floats with <code>==</code>.</b> Compare <code>abs(a - b) &lt; 1e-9</code>, or work in integers.",
    "<b>Accumulating a sum in an <code>int</code>.</b> n up to 10⁵ with values up to 10⁵ already exceeds 32 bits, declare the accumulator 64-bit.",
    "<b>JavaScript bitwise operators truncate to 32 bits.</b> <code>x | 0</code> silently mangles anything above 2³¹.",
    "<b>Signed overflow in C++ is undefined behaviour</b>, not a wrap, the optimiser is allowed to assume it never happens.",
  ],

  impl: [
    ["Python", "arbitrary precision · // floors · % non-negative", "No overflow ever. -7//2 == -4 and -7%3 == 2, unlike most other languages."],
    ["Java", "int/long wrap silently · Math.floorMod", "Math.floorMod gives Python-style modulo. Use long, or Math.addExact to throw on overflow."],
    ["C++", "signed overflow is UNDEFINED behaviour", "Not merely a wrap. Use long long, or __int128 for products. % truncates."],
    ["JavaScript", "all numbers are doubles, exact to 2^53", "Bitwise operators coerce to int32. BigInt for anything larger."],
  ],

  code: {
    pseudo: `# 1. OVERFLOW, the sum can leave the range even when the answer cannot
mid <- (lo + hi) / 2            # WRONG in a fixed-width language
mid <- lo + (hi - lo) / 2       # RIGHT: the same value, no big intermediate

# check BEFORE multiplying; afterwards the result tells you nothing
if a > LIMIT / b: overflow would happen

# 2. DIVISION, the two families round opposite ways on negatives
-7 / 2  ->  -3   (truncate toward zero: C, C++, Java, Go, JavaScript)
-7 / 2  ->  -4   (floor toward -infinity: Python)

# 3. MODULO, sign follows the division rule
-7 % 3  ->  -1   (truncating family: sign of the DIVIDEND)
-7 % 3  ->   2   (flooring family:   sign of the DIVISOR)

index <- ((x mod n) + n) mod n  # always non-negative, in every language

# 4. FLOATS, approximate, so never test equality
if abs(a - b) < 1e-9: treat as equal
# better still: scale to integers and avoid floats entirely`,
    py: `# Python has no fixed-width integers, so overflow simply does not happen
2 ** 200                      # exact, arbitrarily large
mid = (lo + hi) // 2          # safe here, but NOT if you port this to Java

# Python floors, and its modulo is non-negative for a positive divisor
-7 // 2                       # -4   (floor, not truncation)
-7 % 3                        # 2    (sign of the divisor)
int(-7 / 2)                   # -3. This is how you truncate instead
import math
math.trunc(-3.5), math.floor(-3.5), math.ceil(-3.5)     # -3, -4, -3

# Floats are still binary fractions here too
0.1 + 0.2 == 0.3              # False
abs((0.1 + 0.2) - 0.3) < 1e-9 # True, compare with a tolerance
from decimal import Decimal
Decimal("0.1") + Decimal("0.2") == Decimal("0.3")       # True, exact decimals

# Simulating a 32-bit wrap, when a problem demands it
def to_int32(x):
    x &= 0xFFFFFFFF
    return x - (1 << 32) if x >= (1 << 31) else x`,
    java: `int mid = lo + (hi - lo) / 2;        // never (lo + hi) / 2

Integer.MAX_VALUE + 1;               // -2147483648, silently
Math.addExact(a, b);                 // throws ArithmeticException instead
long total = 0;                      // accumulate in 64 bits
for (int x : nums) total += x;

-7 / 2;                              // -3  (truncates toward zero)
-7 % 3;                              // -1  (sign of the dividend)
Math.floorDiv(-7, 2);                // -4  (Python-style)
Math.floorMod(-7, 3);                // 2   (always non-negative for positive n)

// Products overflow long before the operands do
long product = (long) a * b;         // cast BEFORE multiplying, not after

0.1 + 0.2 == 0.3;                    // false
Math.abs((0.1 + 0.2) - 0.3) < 1e-9;  // true
new BigDecimal("0.1").add(new BigDecimal("0.2"));   // exact`,
    cpp: `int mid = lo + (hi - lo) / 2;        // never (lo + hi) / 2

// Signed overflow is UNDEFINED BEHAVIOUR, not a defined wrap.
// The optimiser may assume it cannot happen and delete your check.
long long total = 0;
for (int x : nums) total += x;
long long product = 1LL * a * b;     // promote BEFORE multiplying

-7 / 2;                              // -3  (truncates)
-7 % 3;                              // -1  (sign of the dividend)
int floorDiv(int a, int b) {         // Python-style floor division
    int q = a / b;
    return (a % b != 0 && ((a < 0) != (b < 0))) ? q - 1 : q;
}
int floorMod(int a, int n) { return ((a % n) + n) % n; }

0.1 + 0.2 == 0.3;                    // false
fabs((0.1 + 0.2) - 0.3) < 1e-9;      // true
// numeric_limits<int>::max() is the edge you are working against`,
    js: `// Every number is a double: integers are exact only up to 2^53
Number.MAX_SAFE_INTEGER;             // 9007199254740991
Number.isSafeInteger(x);             // check before trusting integer maths
9007199254740993 === 9007199254740992;   // true, beyond the safe range

// Bitwise operators silently truncate to 32 bits
(2 ** 31) | 0;                       // -2147483648

-7 / 2;                              // -3.5, division is NOT integer here
Math.trunc(-7 / 2);                  // -3  (toward zero)
Math.floor(-7 / 2);                  // -4  (toward -infinity)
-7 % 3;                              // -1  (sign of the dividend)
((-7 % 3) + 3) % 3;                  // 2, the portable non-negative form

0.1 + 0.2 === 0.3;                   // false
Math.abs((0.1 + 0.2) - 0.3) < 1e-9;  // true

BigInt(2) ** BigInt(200);            // exact, arbitrarily large`,
  },
  codecap: "Two lines are worth memorising: lo + (hi - lo) / 2, and ((x % n) + n) % n.",

  q: [
    ["What happens when a 32-bit int passes its maximum?", "It wraps to the most negative value, silently and with no error. The hardware keeps the low 32 bits and discards the carry."],
    ["Why is (lo + hi) / 2 a bug, and what replaces it?", "The intermediate sum can exceed the range even when the midpoint cannot. lo + (hi - lo) / 2 computes the same value without ever forming that sum."],
    ["What is -7 / 2 in Java and in Python, and why do they differ?", "-3 in Java, which truncates toward zero; -4 in Python, which floors toward negative infinity. They agree on non-negative numbers, which is why the difference stays hidden."],
    ["Why does the sign of a modulo result differ between languages?", "Because a == (a/b)*b + a%b must hold. Truncating division forces a remainder with the dividend's sign; flooring division forces the divisor's sign."],
    ["Write the expression for a modulo that is non-negative everywhere.", "((x % n) + n) % n, needed for circular indices and hash buckets in any truncating language."],
    ["Why is 0.1 + 0.2 != 0.3, and what do you do about it?", "0.1 and 0.2 are not exactly representable as binary fractions, so the sum carries a tiny error. Compare with a tolerance, or scale everything to integers."],
  ],

  p: [
    [7, "reverse-integer", "Reverse Integer, overflow is the whole problem", "M"],
    [69, "sqrtx", "Sqrt(x), integer maths, no floats", "E"],
    [50, "powx-n", "Pow(x, n), negative exponents and precision", "M"],
    [29, "divide-two-integers", "Divide Two Integers, no division operator", "M"],
    [172, "factorial-trailing-zeroes", "Factorial Trailing Zeroes, count, do not compute", "M"],
    [202, "happy-number", "Happy Number, digit arithmetic", "E"],
  ],
},

/* ==================================================================== */
{
  id: "maths",
  n: "Number theory for interviews",
  group: "Fundamentals",
  one: "Almost every number question is four moves: <b>stop at the square root</b>, cross out multiples, replace a with a mod b, and halve the exponent.",

  plain: `<p>Number theory sounds like a university course. The interview version is six short routines, and every one of them exists because the obvious approach does far too much work.</p>
<p>Is n prime? You do not need to try every divisor, only the ones up to √n. Which numbers below a million are prime? Do not ask each one separately, cross out the multiples instead. What is the largest number dividing both a and b? Do not factorise either of them, just keep replacing the pair with a smaller pair. What is 2 to the power of a billion? Do not multiply a billion times, square your way there in thirty steps.</p>
<p>The last piece is the <b>modulus</b>, which is just the remainder after dividing. Problems ask for the answer <code>mod 10⁹ + 7</code> so the result fits in a 64-bit integer. That means keeping every value small as you go, instead of building something astronomical and shrinking it at the end. Addition, subtraction and multiplication survive that treatment. Division does not, and the fix for division is most of the remaining difficulty.</p>
<p><b>Analogy.</b> Checking whether a rectangle of area n can be made from whole-number sides. You only ever measure the short side, because once you pass the square the long side has already been on your list.</p>`,

  why: [
    { t: "A factor above the square root drags a partner below it", d: "If <code>n = a × b</code> and both a and b were larger than √n, their product would already exceed n. So at least one factor is <b>at or below √n</b>. Test 2, 3, 4 up to √n, find nothing, and there is nothing to find. That single sentence is the whole of primality testing at interview level: <b>O(√n)</b>, and you can say why." },
    { t: "Asking every number separately repeats the same work", d: "To list primes up to n, trial division costs about n√n. But the moment you know 2 is prime you also know 4, 6, 8, 10 are not, without dividing anything. So invert the question: instead of testing each number, take each prime and <b>cross out its multiples</b>. Every composite gets struck by its own prime factors, so whatever survives is prime." },
    { t: "The inner loop starts at p × p, not 2p", d: "Any multiple of p below p × p is <code>k × p</code> where <code>k &lt; p</code>. So it already has a prime factor smaller than p, and that smaller factor crossed it out on an earlier pass. Starting at p × p skips all of that. It also means the outer loop can stop once <code>p × p &gt; n</code>. The total is <b>O(n log log n)</b>, which is near enough linear that you should treat it as free. The log log comes from summing 1/p over the primes, and it is not something anyone derives at a whiteboard. Quote it, do not prove it." },
    { t: "For a gcd, subtract the pair down instead of factorising it", d: "Suppose d divides both a and b. Write <code>a = q × b + r</code>. Then <code>r = a - q × b</code>, and d divides both terms on the right, so <b>d divides r too</b>. So (a, b) and (b, a mod b) have exactly the same common divisors. The biggest one is therefore the same as well: <code>gcd(a, b) = gcd(b, a mod b)</code>. Repeat until b hits 0, and the answer is a. The remainder at least halves every two steps, so this is <b>O(log min(a, b))</b>." },
    { t: "lcm comes free from gcd, if you order the arithmetic properly", d: "Each of a and b contributes its own factors, and the shared part is counted once, so <code>lcm(a, b) = a × b / gcd(a, b)</code>. Write it as <code>a / gcd(a, b) * b</code> instead. The gcd divides a exactly, so nothing is lost, and you never form the product <code>a × b</code>, which is the value that overflows. See the numbers concept for what that overflow actually does to you." },
    { t: "Powers halve instead of counting down", d: "<code>x¹⁶</code> does not need sixteen multiplications. Square four times. In general <code>x^e</code> is <code>(x^(e/2))²</code> when e is even, and <code>x × x^(e-1)</code> when it is odd, so each step either halves the exponent or makes it even. That is <b>O(log e)</b> multiplications. Take the modulus after every single one and no intermediate ever exceeds m², which is precisely why the answer is asked for mod 10⁹ + 7." },
    { t: "Mod distributes over three operations, and pointedly not the fourth", d: "<code>(a + b) mod m</code>, <code>(a - b) mod m</code> and <code>(a × b) mod m</code> can all be worked out from the reduced values. Remainders add and multiply the way you hope they will. <b>Division cannot.</b> Dividing by b becomes multiplying by the <b>modular inverse</b> of b, the value with <code>b × inv ≡ 1 (mod m)</code>. When m is prime, Fermat gives it away: <code>b^(m-1) ≡ 1</code>, so <code>inv = b^(m-2) mod m</code>, one fast power. That is how nCr survives a modulus: precompute factorials and their inverses, then <code>nCr = fact[n] × invfact[r] × invfact[n-r]</code>. What this cannot do: a non-prime modulus (Fermat does not apply, you need the extended Euclidean algorithm), and it will not factorise a 200-digit number for you either. None of these routines break big integers apart, they only avoid having to." },
  ],

  hing: `<p><b>Poore number theory ka interview version chhe chhoti routines hai.</b> Har ek isliye exist karti hai kyunki seedha tarika bekaar mein zyada kaam karta hai.</p>
<p><b>1. √n tak hi kyun?</b> Maan lo <code>n = a × b</code>. Agar a aur b dono √n se bade hote, to unka product n se bada ho jaata, jo ho nahi sakta. Matlab <b>kam se kam ek factor √n ke neeche ya barabar hoga</b>. To 2 se √n tak dekh lo, kuch nahi mila to number prime hai. Bas itni si baat, aur interview mein isse zyada primality test chahiye bhi nahi.</p>
<p><b>2. Sieve, har number se poochho mat, kaat do.</b> Ek-ek number ko test karne ke bajaye, har prime ke <b>multiples cross</b> kar do. Har composite apne hi prime factor se mar jaayega, jo bacha woh prime.</p>
<p><b>Sabse poochha jaane wala sawaal: inner loop <code>p * p</code> se kyun shuru hota hai, <code>2p</code> se kyun nahi?</b> Socho: <code>p * p</code> se chhota har multiple <code>k × p</code> hota hai, jisme <code>k</code> khud <code>p</code> se chhota hai. Us number ka ek chhota prime factor pehle se hai, aur woh <b>pehle hi round mein kat chuka hai</b>. Dobara kaatne ka koi fayda nahi. Cost <b>O(n log log n)</b> hai. Yeh log log kahan se aaya, yeh interview mein derive karne ki cheez nahi hai, bas bol do aur aage badho.</p>
<p><b>3. GCD kyun chalta hai? Numbers par karke dekho, formula baad mein.</b> <code>gcd(1071, 462)</code> nikalna hai. Pehla step: <code>1071 = 2 × 462 + 147</code>.</p>
<p>Ab socho koi number dono ko divide karta hai, jaise <b>21</b>. To <code>2 × 462</code> bhi 21 se katega, aur 1071 bhi. Matlab jo bacha, yaani <b>147</b>, woh bhi 21 se hi katega. Ulta bhi utna hi sach hai: jo 462 aur 147 dono ko kaatta hai, woh 1071 ko bhi kaatega. To <b>(1071, 462) aur (462, 147) ke common divisors bilkul same hain</b>, bas numbers chhote ho gaye. Sabse bada bhi isliye same rahega.</p>
<p>Yahi <code>gcd(a, b) = gcd(b, a mod b)</code> hai. Repeat karte jao jab tak b zero na ho: <code>1071, 462</code> se <code>462, 147</code>, phir <code>147, 21</code>, phir <code>21, 0</code>. Jawab <b>21</b>. Har do step mein bada number kam se kam aadha ho jaata hai, isliye <b>O(log min(a, b))</b>.</p>
<p><b>4. lcm mein order galat mat karna.</b> <code>lcm = a / gcd(a, b) * b</code> likho, <code>a * b / gcd</code> nahi. gcd, a ko poora divide karta hai to kuch khota nahi, par <code>a * b</code> banaya to woh <b>overflow</b> kar sakta hai. Overflow kya karta hai, woh numbers wale concept mein detail se hai.</p>
<p><b>5. Fast power.</b> <code>x^16</code> ke liye 16 baar guna mat karo, chaar baar square kar lo. Exponent ko aadha karte jao, <b>O(log e)</b> steps. Aur har step ke baad <code>% m</code> lagao, tabhi number chhota rehta hai. Isiliye problems answer <code>mod 10⁹ + 7</code> maangte hain.</p>
<p><b>6. Mod ke saath division kaam nahi karta.</b> Plus, minus, multiply, teeno mod ke andar theek chalte hain. <b>Divide nahi.</b> b se divide karne ke liye uska <b>modular inverse</b> chahiye, matlab woh number jiska <code>b × inv</code> mod m mein 1 ho. Jab m prime hai (aur 10⁹ + 7 prime hai), Fermat se: <code>inv = power(b, m - 2, m)</code>. Isi se nCr nikalta hai: factorials aur unke inverses pehle bana lo, phir har query O(1).</p>
<p><b>Ek warning:</b> Fermat sirf <b>prime modulus</b> par chalta hai, aur tabhi jab b, m ka multiple na ho. Modulus prime nahi hai to extended Euclid chahiye, aur woh alag kahani hai.</p>`,

  viz: ["sieve"],

  math: [
    { t: "Why the square root is the stopping line, counted", d: "The bound is not a heuristic. Every factor above the root is paired with one below it, so the loop above the root can only find what the loop below it already found.", w:
`n = 10,007 (prime), sqrt(n) = 100.03

tests done up to the root:   2 .. 100    =    99
tests done without a bound:  2 .. 10,006 = 10,005
same answer, 100x the work

if n = a x b and a > sqrt(n), then b = n / a < sqrt(n)` },
    { t: "The sieve, as a sum", d: "Each prime crosses out n/p numbers. Add those up over the primes and the total is a little under three marks per number, which is why the whole thing behaves like a linear pass.", w:
`crossings = n/2 + n/3 + n/5 + n/7 + ... over primes <= n
          = n x (1/2 + 1/3 + 1/5 + 1/7 + ...)
that inner sum grows like log log n

n = 10^6: roughly 2.9 x 10^6 crossings, about 3 per number
trial division on the same range: about 10^8 divisions` },
    { t: "Euclid, run once and then bounded", d: "Each step replaces the pair with a strictly smaller one, and two steps at least halve the larger value, which is where the log comes from.", w:
`gcd(1071, 462):
  1071 = 2 x 462 + 147
   462 = 3 x 147 +  21
   147 = 7 x  21 +   0      gcd = 21

why two steps halve a:
  if b <= a/2 then a mod b < b <= a/2
  if b >  a/2 then a mod b = a - b < a/2
so O(log min(a, b)) steps, about 45 for values near 10^9` },
    { t: "The lcm overflow, with values that trigger it", d: "Both orderings are algebraically identical. Only one of them ever forms the product that does not fit.", w:
`a = 3 x 10^9   b = 4 x 10^9   gcd = 10^9
int64 tops out at 9.22 x 10^18

a x b / gcd:  3e9 x 4e9 = 1.2 x 10^19   overflowed already
a / gcd x b:  3 x 4e9   = 1.2 x 10^10   fine

the gcd divides a exactly, so dividing first loses nothing` },
    { t: "Fast power, counted in multiplications", d: "The exponent in binary is the recipe: one squaring per bit, one extra multiply per set bit.", w:
`2^100, and 100 in binary is 1100100  (7 bits, 3 ones)

squarings:      6
multiplies:     3   (one per set bit)
total:          9   operations
naive:         99   multiplications

e = 10^18: 60 bits, so at most 120 operations` },
  ],

  costs: [
    ["primality by trial division", "O(√n)", "a factor above √n forces a partner below it"],
    ["sieve up to n", "O(n log log n) time, O(n) space", "each composite is struck by its own prime factors"],
    ["gcd by Euclid", "O(log min(a, b))", "the remainder at least halves every two steps"],
    ["lcm from gcd", "O(log min(a, b))", "one gcd plus one divide and one multiply, in that order"],
    ["power by squaring", "O(log e) multiplications", "each step halves the exponent instead of decrementing it"],
    ["modular inverse, prime m", "O(log m)", "it is one fast power, b^(m-2), nothing more"],
    ["nCr mod prime", "O(n) precompute, O(1) per query", "factorials once, then two inverse lookups"],
    ["Pascal's triangle table", "O(n²) time and space", "additions only, so it works for any modulus, or none"],
  ],

  traps: [
    "<b>Writing <code>i &lt;= sqrt(n)</code>.</b> The float result is wrong at the boundary for large perfect squares, and you recompute it every iteration. Write <code>i * i &lt;= n</code>, in a 64-bit type so the square itself does not overflow, or use an exact integer square root.",
    "<b>Starting the sieve's inner loop at <code>2 * p</code>.</b> It still gives the right answer, it just re-crosses numbers that died on an earlier pass. Start at <code>p * p</code> and stop the outer loop once <code>p * p &gt; n</code>.",
    "<b><code>a * b / gcd(a, b)</code> for the lcm.</b> The product overflows for inputs that the lcm itself would survive. Divide first: <code>a / gcd(a, b) * b</code>.",
    "<b>Taking the modulus only at the end</b> of a power or a factorial. The intermediate is what overflows, so reduce after every multiplication, and hold the accumulator in 64 bits because the product of two values just under 10⁹ needs 60 bits.",
    "<b>Using Fermat's inverse on a composite modulus</b>, or on a b that is a multiple of m. Both are silent: you get a number, it is simply not an inverse. Fermat needs m prime and b not divisible by m, and the modular inverse concept has the rest of the story, including what to do when neither holds.",
    "<b>Feeding negative values to gcd or to a mod chain.</b> In the truncating languages <code>-7 % 3</code> is negative, so normalise with <code>((x % m) + m) % m</code>, especially after a subtraction under a modulus. The numbers concept has the full story on modulo signs.",
  ],

  impl: [
    ["Python", "math.gcd · math.lcm · math.isqrt · math.comb · pow(b, e, m)", "Three-argument pow is the fast modular one. isqrt is exact, sqrt is a float. No overflow, so ordering only matters when you port the code."],
    ["Java", "BigInteger.gcd · BigInteger.modPow · Math.multiplyHigh", "No primitive gcd. Write the four-line Euclid, keep everything in long, and reduce after every multiply."],
    ["C++", "std::gcd and std::lcm, header numeric (C++17)", "std::lcm already avoids the overflow internally. Use long long for the modular products, or __int128 if the modulus is large."],
    ["JavaScript", "no built-in gcd, and numbers are doubles", "Integer maths is exact only to 2⁵³, and a modular product of two 10⁹ values is not. Do modular arithmetic in BigInt and convert back at the end."],
  ],

  code: {
    pseudo: `# 1. PRIMALITY, only divisors up to the square root can be new
# if n = a * b with a > sqrt(n), then b < sqrt(n) and b was tested first
is_prime(n):
    if n < 2: return false
    i <- 2
    while i * i <= n:          # not i <= sqrt(n): floats lie at perfect squares
        if n mod i == 0: return false
        i <- i + 1
    return true

# 2. SIEVE, cross out multiples instead of interrogating each number
sieve(n):
    prime[0..n] <- true
    prime[0] <- false; prime[1] <- false
    p <- 2
    while p * p <= n:
        if prime[p]:
            m <- p * p         # 2p, 3p ... already died to a smaller prime
            while m <= n:
                prime[m] <- false
                m <- m + p
        p <- p + 1
    return prime               # O(n log log n), do not derive the log log

# 3. GCD, every common divisor of a and b also divides a mod b
gcd(a, b):
    while b != 0: a, b <- b, a mod b
    return a

lcm(a, b): return a / gcd(a, b) * b     # divide FIRST, a * b may not fit

# 4. FAST POWER, halve the exponent instead of counting down
power(base, e, m):
    result <- 1
    base <- base mod m
    while e > 0:
        if e is odd: result <- result * base mod m
        base <- base * base mod m
        e <- e / 2             # integer halving
    return result              # O(log e)

# 5. MODULAR RULES, three operations survive, one does not
(a + b) mod m, (a - b + m) mod m, (a * b) mod m       # all fine
a / b under mod  ->  a * inverse(b) mod m
inverse(b) <- power(b, m - 2, m)        # Fermat, ONLY when m is prime

# 6. nCr, either from factorials mod a prime ...
nCr(n, r) <- fact[n] * invfact[r] * invfact[n - r]    # each step mod m
# ... or from Pascal, which only ever adds, so it cannot overflow midway
C[n][r] <- C[n-1][r-1] + C[n-1][r]`,
    py: `from math import gcd, isqrt, comb

def is_prime(n):                      # O(sqrt n)
    if n < 2: return False
    i = 2
    while i * i <= n:                 # i*i beats sqrt(n): no float, no rounding
        if n % i == 0: return False
        i += 1
    return True

def sieve(n):                         # O(n log log n)
    prime = [True] * (n + 1)
    prime[0] = prime[1] = False
    for p in range(2, isqrt(n) + 1):
        if prime[p]:
            prime[p * p :: p] = [False] * len(prime[p * p :: p])
    return [i for i, ok in enumerate(prime) if ok]

def lcm(a, b): return a // gcd(a, b) * b      # divide before multiplying

M = 10 ** 9 + 7
pow(2, 100, M)                        # three-arg pow IS exponentiation by squaring
inverse = lambda b: pow(b, M - 2, M)  # Fermat, and M is prime

N = 200000
fact = [1] * (N + 1)
for i in range(1, N + 1): fact[i] = fact[i - 1] * i % M
invfact = [1] * (N + 1)
invfact[N] = pow(fact[N], M - 2, M)   # one inverse, then walk down
for i in range(N, 0, -1): invfact[i - 1] = invfact[i] * i % M

def nCr(n, r):
    if r < 0 or r > n: return 0
    return fact[n] * invfact[r] % M * invfact[n - r] % M

comb(30, 15)                          # exact and unbounded, when no modulus is asked`,
    java: `static boolean isPrime(long n) {              // O(sqrt n)
    if (n < 2) return false;
    for (long i = 2; i * i <= n; i++)         // long: i * i overflows int early
        if (n % i == 0) return false;
    return true;
}

static boolean[] sieve(int n) {               // O(n log log n)
    boolean[] prime = new boolean[n + 1];
    Arrays.fill(prime, true);
    prime[0] = prime[1] = false;
    for (int p = 2; (long) p * p <= n; p++)
        if (prime[p])
            for (int m = p * p; m <= n; m += p) prime[m] = false;
    return prime;
}

static long gcd(long a, long b) { return b == 0 ? a : gcd(b, a % b); }
static long lcm(long a, long b) { return a / gcd(a, b) * b; }   // divide first

static final long M = 1_000_000_007L;

static long power(long base, long e, long m) {
    long r = 1;
    base %= m;
    while (e > 0) {
        if ((e & 1) == 1) r = r * base % m;   // long: the product needs 60 bits
        base = base * base % m;
        e >>= 1;
    }
    return r;
}
static long inverse(long b) { return power(b, M - 2, M); }  // M must be prime

// BigInteger.gcd and .modPow exist for the cases that outgrow long`,
    cpp: `bool isPrime(long long n) {                   // O(sqrt n)
    if (n < 2) return false;
    for (long long i = 2; i * i <= n; i++)
        if (n % i == 0) return false;
    return true;
}

vector<bool> sieve(int n) {                   // O(n log log n)
    vector<bool> prime(n + 1, true);
    prime[0] = prime[1] = false;
    for (long long p = 2; p * p <= n; p++)
        if (prime[p])
            for (long long m = p * p; m <= n; m += p) prime[m] = false;
    return prime;
}

// std::gcd and std::lcm are in <numeric> since C++17; lcm divides first for you
long long myLcm(long long a, long long b) { return a / std::gcd(a, b) * b; }

const long long M = 1000000007;

long long power(long long b, long long e, long long m) {
    long long r = 1;
    b %= m;
    while (e > 0) {
        if (e & 1) r = r * b % m;             // operands under 1e9, product fits
        b = b * b % m;
        e >>= 1;
    }
    return r;
}
long long inverse(long long b) { return power(b, M - 2, M); }`,
    js: `const isPrime = (n) => {                  // O(sqrt n)
  if (n < 2) return false;
  for (let i = 2; i * i <= n; i++) if (n % i === 0) return false;
  return true;
};

function sieve(n) {                       // O(n log log n)
  const prime = new Uint8Array(n + 1).fill(1);
  prime[0] = prime[1] = 0;
  for (let p = 2; p * p <= n; p++)
    if (prime[p]) for (let m = p * p; m <= n; m += p) prime[m] = 0;
  return prime;
}

const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
const lcm = (a, b) => (a / gcd(a, b)) * b;   // divide first

// Modular work goes in BigInt: base * base leaves the exact range immediately
const M = 1000000007n;
function power(base, e, m) {
  let r = 1n;
  base %= m;
  while (e > 0n) {
    if (e & 1n) r = (r * base) % m;
    base = (base * base) % m;
    e >>= 1n;
  }
  return r;
}
const inverse = (b) => power(b, M - 2n, M);  // Fermat, M is prime
Number(power(2n, 100n, M));               // convert back only at the very end`,
  },
  codecap: "Six routines, and five of them are under ten lines. The only judgement calls are where the modulus goes and which order you divide in.",

  q: [
    ["Why is it enough to test divisors up to √n?", "If n = a × b and both factors were above √n, the product would exceed n. So one factor is at or below √n, and if nothing there divides n, nothing above does either. That makes primality O(√n)."],
    ["Why does the sieve beat testing each number, and why does the inner loop start at p × p?", "Crossing out multiples uses addition and strikes each composite through its own prime factors, instead of dividing every candidate. Anything below p × p is k × p with k < p, so it already has a smaller prime factor and was crossed out on an earlier pass. Total cost O(n log log n)."],
    ["Prove that gcd(a, b) = gcd(b, a mod b).", "Write a = q × b + r. Any d dividing a and b also divides r = a - q × b, and any d dividing b and r also divides a. The two pairs have identical common divisors, so their greatest one is identical."],
    ["Why write lcm as a / gcd(a, b) * b rather than a * b / gcd(a, b)?", "The gcd divides a exactly, so the answer is the same, but the second form builds the product a × b first and that is the value which overflows a fixed-width integer."],
    ["How do you compute a power in O(log e), and why apply the modulus at every step?", "Square repeatedly, halving the exponent, multiplying the running result in whenever the current bit is odd. Reducing after each multiplication keeps every intermediate below m², so nothing overflows and no huge number is ever formed."],
    ["Which operations distribute over a modulus, and what do you do about the one that does not?", "Addition, subtraction and multiplication do. Division does not: multiply by the modular inverse of the divisor instead. When m is prime, Fermat gives inverse(b) = b^(m-2) mod m, one fast power, which is exactly how nCr is computed mod 10⁹ + 7."],
  ],

  variants: [
    { n: "Trial division", cost: "O(√n) for one number", idea: "Try every divisor from 2 up to √n and stop, because a larger factor would need a smaller partner you have already tested.", when: "You need to answer 'is this one number prime' or 'list the factors of n'. Also the whole of prime factorisation: divide n by each i you find, and whatever remains above 1 at the end is a prime factor itself.", watch: "Write i * i <= n rather than i <= sqrt(n), and hold the square in a 64-bit type. Also handle n < 2 explicitly, since 1 is not prime and neither is 0." },
    { n: "Sieve of Eratosthenes", cost: "O(n log log n) time, O(n) space", idea: "Mark everything as prime, then for each surviving p cross out p × p, p × p + p, and so on. Composites are eliminated by their own prime factors.", when: "You need every prime up to n, or you need to answer many primality questions with n up to roughly 10⁷.", watch: "It is memory that fails first, not time. A boolean array for n = 10⁹ is not happening, and you want a segmented sieve or trial division for a single large n instead." },
    { n: "Euclidean algorithm", cost: "O(log min(a, b))", idea: "Replace (a, b) with (b, a mod b) until b is 0. The common divisors are unchanged at every step, so the last non-zero a is the gcd.", when: "Any question about shared factors, reducing a fraction, aligning two periods, or the classic gcd of an entire array (fold it pairwise, and it usually collapses to 1 fast).", watch: "gcd(0, 0) is 0 and that is the only sane answer, but check whether your problem wants it. Negative inputs need normalising first, since remainders can be negative outside Python." },
    { n: "lcm via gcd", cost: "one gcd", idea: "a / gcd(a, b) * b. The shared factors are counted once, and dividing before multiplying keeps the intermediate small.", when: "Cycle problems, meeting points, anything asking when two repeating events line up again.", watch: "The lcm of a whole array grows explosively even when each element is tiny, so it overflows long before the gcd would. Reduce as you fold, and consider whether the problem really needs the value or only a comparison." },
    { n: "Exponentiation by squaring", cost: "O(log e) multiplications", idea: "x^e is (x^(e/2))² for even e, and x times x^(e-1) for odd e. Each step at least halves the exponent.", when: "Any power with a large exponent, any answer requested mod 10⁹ + 7, and matrix powers for linear recurrences such as Fibonacci in O(log n).", watch: "Negative exponents need the inverse, not the same loop. And take the modulus inside the loop, never once at the end, since the end is far too late." },
    { n: "Modular inverse by Fermat", cost: "O(log m)", idea: "b^(m-1) ≡ 1 mod m when m is prime, so b^(m-2) is the inverse of b. Dividing by b becomes multiplying by that.", when: "Any counting problem mod a prime that involves a division: probabilities, averages, and every binomial coefficient.", watch: "Prime modulus only. For a composite m use the extended Euclidean algorithm, which works whenever gcd(b, m) = 1, and gives you nothing at all when it is not." },
    { n: "nCr, factorials or Pascal", cost: "O(n) precompute then O(1), or O(n²) for the table", idea: "Either fact[n] × invfact[r] × invfact[n-r] under a prime modulus, or build the triangle with C[n][r] = C[n-1][r-1] + C[n-1][r].", when: "Factorials for many queries under a modulus. Pascal for small n, for an exact answer with no modulus, or when the modulus is not prime and inverses are unavailable.", watch: "Never compute n! / (r! (n-r)!) directly in fixed-width arithmetic, 21! already passes 64 bits. Pascal is safe because it only ever adds, which is also why it is O(n²)." },
  ],

  p: [
    [1979, "find-greatest-common-divisor-of-array", "Greatest Common Divisor of Array, Euclid in four lines", "E"],
    [118, "pascals-triangle", "Pascal's Triangle, the identity as code", "E"],
    [204, "count-primes", "Count Primes, the sieve or a timeout", "M"],
    [1071, "greatest-common-divisor-of-strings", "GCD of Strings, Euclid on something that is not a number", "E"],
    [372, "super-pow", "Super Pow, fast power with the exponent given as digits", "M"],
    [1922, "count-good-numbers", "Count Good Numbers, counting then one power mod 10⁹ + 7", "M"],
    [62, "unique-paths", "Unique Paths, it is nCr wearing a grid", "M"],
  ],
},

/* ==================================================================== */
{
  id: "mod-inverse",
  n: "Modular multiplicative inverse",
  group: "Fundamentals",
  one: "Under a modulus there is no division, only multiplication. <b>a / b becomes a × inv(b)</b>, the one residue with <code>b × inv(b) ≡ 1</code>.",

  plain: `<p>Some problems ask for the answer <b>mod 10⁹ + 7</b>. That means: give the remainder after dividing by that number. It is asked for so the numbers stay small, because the true answer might have a thousand digits.</p>
<p>Adding, subtracting and multiplying all survive that. You can take the remainder at every step and still end up with the right final remainder. Then the problem asks for an average, or a probability, or a count that involves a division, and you are stuck. <b>There is no divide.</b></p>
<p>Not slow, not fiddly. It is not there. Working mod 7, the value <code>3 / 5</code> is not a whole number, so there is no remainder for it to be.</p>
<p>So keep what division was <i>for</i> and throw away the fraction. Dividing by 5 always meant multiplying by the thing that undoes 5. So look for a number <code>inv</code> where <code>5 × inv</code> leaves remainder 1, and then read <code>a / 5</code> as <code>a × inv</code>. Such a number exists only when 5 and the modulus share no factor, and when it exists there is exactly one of it.</p>
<p><b>Analogy.</b> A clock with m hours, and you always jump b hours forward. Start at 0 and keep going. If b and m share no factor you eventually stand on every hour there is. So you must pass through 1, and the number of jumps that took is the inverse. If they share a factor you only ever land on some of the hours, and 1 is not one of them. The whole existence question is that picture.</p>`,

  why: [
    { t: "The modulus is there so nothing overflows, and three operations survive it", d: "An answer is requested <code>mod m</code> so you can reduce after every step and keep every value under m. That works because remainders are compatible with <b>addition, subtraction and multiplication</b>: reduce first or reduce last, same result. Division is the one operation left outside, and everything below is the cost of that." },
    { t: "There is no fraction to reduce, and the number you would divide is already gone", d: "Under mod 7, <code>3 / 5</code> is not an integer, so asking for it mod 7 has no answer by that route at all. And where the quotient <i>is</i> a whole number, the route is still blocked: <code>nCr = n! / (r!(n-r)!)</code> is an integer, but you never stored <code>n!</code>, only <code>n! mod m</code>. The one value you wanted to divide is the one that was thrown away on purpose." },
    { t: "So keep the definition of division and drop the fraction", d: "In ordinary arithmetic, dividing by b means multiplying by the number that undoes b: <code>b × (1/b) = 1</code>. Keep exactly that, and look for the undoing number among the remainders. Find x with <code>b × x ≡ 1 (mod m)</code> and call it <code>inv(b)</code>. Then <code>a / b</code> simply means <code>a × inv(b)</code>. When b really does divide a, this agrees with the ordinary quotient, because multiplying the result back by b returns a." },
    { t: "It exists exactly when gcd(b, m) = 1, and then there is only one", d: "Picture a clock with <b>m hours</b>, and jump <b>b hours</b> forward each time, starting at 0. Asking whether an inverse exists is asking one thing: <b>do you ever land on 1?</b> You get back to 0 after <code>m / gcd(b, m)</code> jumps. You have stood on that many hours, and on no others. If <code>gcd(b, m) = 1</code> that is all m hours, so 1 is one of them. You stand on it exactly once, which is why the inverse exists and why there is only one. Now let <code>d = gcd(b, m)</code> be bigger than 1. Every hour you land on is a multiple of d, because b is one and m is one, so jumping and wrapping both keep you on them. 1 is not a multiple of d. You never reach it, however long you walk." },
    { t: "When m is prime, Fermat hands it to you in one fast power", d: "Fermat's little theorem: for prime m and b not a multiple of m, <code>b^(m-1) ≡ 1</code>. Peel off one factor of b and read it as a product: <code>b × b^(m-2) ≡ 1</code>. The second factor satisfies the definition, so <code>inv(b) = b^(m-2) mod m</code>, computed by squaring in <b>O(log m)</b>. That is the whole reason problems pick 10⁹ + 7: it is prime, so every division in the problem costs one fast power." },
    { t: "When m is not prime, Euclid still works, and also tells you when to stop", d: "Run Euclid while carrying coefficients and it produces x and y with <code>b × x + m × y = gcd(b, m)</code>. If that gcd is 1, take both sides mod m. The <code>m × y</code> term disappears, leaving <code>b × x ≡ 1</code>. So x is the inverse, once you have shifted it into <code>[0, m)</code>. Same <b>O(log m)</b>, no primality needed. And if the gcd comes back as anything other than 1, the algorithm has just proved no inverse exists, which is the useful half of the answer." },
    { t: "For many inverses, pay one power. And know what this still cannot do", d: "nCr mod a prime needs every inverse factorial. Doing each with its own power is <code>O(n log m)</code> and wasteful: invert <code>fact[n]</code> once, then walk down with <code>invfact[i-1] = invfact[i] × i</code>, since <code>1/(i-1)! = (1/i!) × i</code>. One power, then n multiplications. What none of this buys you: an inverse is a residue, not a size. <code>inv(2) mod 7</code> is 4, which is larger than 2 and means nothing, so you cannot compare, sort, floor or maximise modular values. And when <code>gcd(b, m) &gt; 1</code> there is no answer at all. The only way out is to avoid dividing: Pascal's triangle only ever adds, which is why it survives any modulus." },
  ],

  hing: `<p><b>Sabse pehle yeh samajh lo: mod ke andar division exist hi nahi karta.</b> Plus, minus, multiply theek chalte hain. Divide ke liye <code>inv(b)</code> chahiye, matlab woh residue jiska <code>b × inv(b)</code> mod m mein <b>1</b> ho. Phir <code>a / b</code> ka matlab hai <code>a × inv(b)</code>.</p>
<p><b>1. Exist kab karta hai? Ek ghadi soch lo, algebra ki zaroorat nahi.</b> Ghadi mein <code>m</code> ghante hain, aur aap har baar <code>b</code> ghante aage kood rahe ho, 0 se shuru karke. Sawaal bas itna hai: <b>kya aap kabhi 1 par khade honge?</b></p>
<p><b>m = 7, b = 5 lo.</b> 0 se chalo: 0, 5, 3, 1, 6, 4, 2, aur phir wapas 0. <b>Saat ke saat ghante</b> aa gaye, to 1 to aana hi tha. Aur 1 tak pahunchne mein <b>3 chhalaang</b> lagi, isliye <code>inv(5) = 3</code>. Bas, inverse mil gaya, bina kisi formula ke.</p>
<p><b>Ab m = 6, b = 2 lo.</b> 0, 2, 4, aur wapas 0. Sirf <b>teen</b> jagah. Aap hamesha even ghante par hi rukoge, kyunki 2 bhi even hai aur 6 bhi. 1 odd hai, to woh kabhi aayega hi nahi, chahe jitna chal lo. <b>Inverse nahi milta kyunki hai hi nahi</b>, dhoondhne mein mushkil nahi hai.</p>
<p><b>Poora rule ek line mein:</b> aap 0 par wapas <code>m / gcd(b, m)</code> chhalaang ke baad aate ho, aur utne hi ghante dekhte ho. gcd 1 hua to poori ghadi ghoom jaati hai, matlab 1 bhi zaroor aayega. gcd <code>d</code> hua to sirf d ke multiples aate hain, aur 1 unmein hai hi nahi. Interview mein itna bol do: <b>"exists if and only if gcd(b, m) = 1"</b>.</p>
<p><b>2. Fermat ka derivation, ratna mat, nikalna seekho.</b> m prime hai to <code>b^(m-1) ≡ 1</code>. Ab ek b bahar nikal lo: <code>b × b^(m-2) ≡ 1</code>. Definition ke hisaab se doosra factor hi inverse hai. Bas: <code>inv(b) = power(b, m - 2, m)</code>, <b>O(log m)</b>. 10⁹ + 7 prime isliye chuna jaata hai.</p>
<p><b>3. m prime nahi hai to extended Euclid.</b> Woh x, y deta hai jisme <code>b×x + m×y = gcd</code>. gcd 1 hua to mod m lene par <code>m×y</code> gayab, bacha <code>b×x ≡ 1</code>. x negative aa sakta hai, to <code>((x % m) + m) % m</code> zaroor karna.</p>
<p><b>4. Yeh wali galti sabse mehngi padti hai.</b> nCr ke liye har factorial ka inverse alag power se nikalna <code>O(n log m)</code> hai, aur n = 10⁶ par TLE. <b>Ek hi power lagao</b> <code>invfact[n]</code> ke liye, phir neeche walk karo: <code>invfact[i-1] = invfact[i] * i</code>. Kyunki <code>1/(i-1)! = (1/i!) × i</code>. Ek power, phir n multiplications.</p>
<p><b>Ek aakhri baat:</b> inverse ek residue hai, size nahi. <code>inv(2) mod 7 = 4</code>, jo 2 se bada hai aur iska koi matlab nahi. Mod ke andar compare, sort, floor, maximum, kuch bhi meaningful nahi hota. Problem "maximum ratio mod 10⁹ + 7" maange to woh problem galat likhi hai.</p>`,

  viz: ["mod-inverse"],

  math: [
    { t: "Find one by hand, then find the same one by Fermat", d: "Walking the row is the definition. Fermat is the shortcut that lands on the identical value without walking anything.", w:
`m = 7, b = 5.  the row 5k mod 7:

k     0   1   2   3   4   5   6
5k    0   5   3   1   6   4   2
                  ^ 1 sits at k = 3, so inv(5) = 3

Fermat: inv(5) = 5^(7-2) = 5^5 = 3125
        3125 = 446 x 7 + 3   ->  3 . Same answer.` },
    { t: "Now do the division, and check it the only way that means anything", d: "The check is the definition read backwards: multiply the answer by the divisor and the original value has to reappear.", w:
`3 / 5 (mod 7)
  = 3 x inv(5)
  = 3 x 3 = 9 = 2   (mod 7)

check: 2 x 5 = 10 = 3 (mod 7)    the 3 came back` },
    { t: "Extended Euclid on the same pair, both directions", d: "Run Euclid forwards for the gcd, then substitute backwards to get the coefficients. The coefficient of b is the inverse.", w:
`forwards:
  7 = 1 x 5 + 2
  5 = 2 x 2 + 1
  2 = 2 x 1 + 0        gcd = 1, so an inverse exists

backwards:
  1 = 5 - 2 x 2
    = 5 - 2 x (7 - 1 x 5)
    = 3 x 5 - 2 x 7

mod 7 the second term vanishes: 3 x 5 = 1, inv(5) = 3` },
    { t: "And the case where there is nothing to find", d: "Change the modulus to 6 and the row stops being a permutation. It visits only the multiples of the gcd, and 1 is not one of them.", w:
`m = 6, b = 2.  the row 2k mod 6:

k     0   1   2   3   4   5
2k    0   2   4   0   2   4

3 distinct values, not 6. gcd(2, 6) = 2, and the row hits
exactly the 6/2 = 3 multiples of 2. 1 is not among them,
so no inverse exists. Not hard to find: absent.` },
    { t: "One power, not n of them", d: "This is the difference between a solution that passes and one that times out, and it is a single line of arithmetic.", w:
`n = 200,000 inverse factorials, m = 10^9 + 7
one fast power costs about 30 squarings + 30 multiplies

a power per entry:  200,000 x 60  = 1.2 x 10^7 multiplies
one power, then walk down:   60 + 200,000  = 2 x 10^5

invfact[i-1] = invfact[i] x i,  since 1/(i-1)! = (1/i!) x i` },
  ],

  costs: [
    ["inverse by Fermat, prime m", "O(log m)", "it is one fast power, b^(m-2), and nothing else"],
    ["inverse by extended Euclid, gcd(b, m) = 1", "O(log m)", "the same steps as a plain gcd, carrying two coefficients along"],
    ["deciding whether an inverse exists", "O(log m)", "it is a gcd, and the answer is yes only when it returns 1"],
    ["one division under a modulus", "O(log m)", "one inverse plus one multiply, so never put it inside a hot loop"],
    ["factorials and inverse factorials up to n", "O(n) precompute, O(1) per nCr", "one power for invfact[n], then walk down multiplying by i"],
    ["every inv[1..n] for a prime m", "O(n) total", "inv[i] is built from inv[m mod i], which is already known"],
  ],

  traps: [
    "<b>Using Fermat on a composite modulus.</b> <code>b^(m-2)</code> is a perfectly good number for m = 12, it is simply not an inverse. Nothing throws, nothing warns, and the answer is wrong by a value you cannot reverse engineer. Fermat needs m prime, full stop.",
    "<b>Inverting 0, or any b that is a multiple of m.</b> <code>pow(0, m-2, m)</code> returns 0, which multiplies back to 0, not 1. This happens for real when a factorial or a product legitimately reduces to 0 mod m, so guard the divisor rather than trusting the formula.",
    "<b>Forgetting that extended Euclid can return a negative x.</b> Outside Python the coefficient often comes back below zero and indexes or multiplies as garbage. Normalise once with <code>((x % m) + m) % m</code>.",
    "<b>Computing an inverse inside the loop.</b> Every nCr costing its own <code>O(log m)</code> power turns an O(n) solution into O(n log m), which at n = 10⁶ is the difference between passing and a timeout. Precompute the inverse factorial table once.",
    "<b>Writing <code>fact[n] / fact[r] % M</code> in code.</b> Both values are already reduced, so this is integer division on two residues: it silently produces a number that has nothing to do with the answer. If a <code>/</code> appears anywhere inside a modular expression, it is a bug.",
    "<b>Treating the result as a magnitude.</b> Modular values have no order, so comparing them, taking a maximum, or rounding one is meaningless even though the code compiles and runs.",
  ],

  impl: [
    ["Python", "pow(b, -1, m) since 3.8 · pow(b, m - 2, m) · math.gcd", "The negative exponent form works for any m coprime to b, not just primes, and raises ValueError when no inverse exists, which is the behaviour you want. No overflow to plan around."],
    ["Java", "BigInteger.modInverse · BigInteger.modPow", "Correct but allocation heavy in a tight loop. For long arithmetic write the four-line fast power yourself, hold everything in long, and reduce after every multiply. modInverse throws ArithmeticException when the gcd is not 1."],
    ["C++", "nothing built in, std::gcd in numeric (C++17)", "Write the power or the extended Euclid, both short. Use long long for the products, and __int128 once the modulus passes about 3 × 10⁹, since the square of the operand is what overflows."],
    ["JavaScript", "no built-in, and numbers are doubles", "Integers are exact only to 2⁵³, so <code>b * b</code> with b near 10⁹ is already wrong. Do all of it in BigInt. BigInt has no modPow, so the squaring loop is yours to write, and convert back with Number only at the end."],
  ],

  code: {
    pseudo: `# THE DEFINITION: inv(b) is the residue with b * inv(b) = 1 (mod m).
# It exists if and only if gcd(b, m) = 1, and then it is unique.

# 1. FERMAT, only when m is PRIME and b is not a multiple of m
#    b^(m-1) = 1  ->  b * b^(m-2) = 1  ->  inv(b) = b^(m-2)
inverse_prime(b, m):
    return power(b, m - 2, m)

power(b, e, m):                        # squaring, O(log e)
    r <- 1; b <- b mod m
    while e > 0:
        if e is odd: r <- r * b mod m  # reduce EVERY step, not at the end
        b <- b * b mod m
        e <- e / 2
    return r

# 2. EXTENDED EUCLID, any m coprime to b, prime or not
#    returns (g, x, y) with a * x + b * y = g = gcd(a, b)
egcd(a, b):
    if b == 0: return (a, 1, 0)
    (g, x1, y1) <- egcd(b, a mod b)
    return (g, y1, x1 - (a / b) * y1)  # integer division

inverse_any(b, m):
    (g, x, y) <- egcd(b, m)
    if g != 1: return NONE             # no inverse exists. Not a hard one: none
    return ((x mod m) + m) mod m       # x can come back negative

# 3. DIVISION under a modulus is a multiplication
(a / b) mod m  ->  a * inverse(b) mod m

# 4. n INVERSES cost ONE power, not n
invfact[n] <- inverse_prime(fact[n], m)
for i from n down to 1:
    invfact[i - 1] <- invfact[i] * i mod m    # 1/(i-1)! = (1/i!) * i

nCr(n, r) <- fact[n] * invfact[r] * invfact[n - r]    # reduce at each step`,
    py: `M = 10 ** 9 + 7

pow(b, M - 2, M)        # Fermat. Correct ONLY because M is prime
pow(b, -1, M)           # 3.8+, any m coprime to b, ValueError when there is none

def egcd(a, b):                       # a*x + b*y = gcd(a, b)
    if b == 0: return (a, 1, 0)
    g, x1, y1 = egcd(b, a % b)
    return (g, y1, x1 - (a // b) * y1)

def inverse(b, m):
    g, x, _ = egcd(b, m)
    if g != 1: return None            # gcd is not 1, so nothing exists to return
    return x % m                      # Python's % already lands in [0, m)

N = 200000
fact = [1] * (N + 1)
for i in range(1, N + 1): fact[i] = fact[i - 1] * i % M

invfact = [1] * (N + 1)
invfact[N] = pow(fact[N], M - 2, M)   # ONE power for the whole table
for i in range(N, 0, -1): invfact[i - 1] = invfact[i] * i % M

def nCr(n, r):
    if r < 0 or r > n: return 0
    return fact[n] * invfact[r] % M * invfact[n - r] % M`,
    java: `static final long M = 1_000_000_007L;

static long power(long b, long e, long m) {
    long r = 1; b %= m;
    while (e > 0) {
        if ((e & 1) == 1) r = r * b % m;  // long: the product needs 60 bits
        b = b * b % m;
        e >>= 1;
    }
    return r;
}
static long inverse(long b) { return power(b, M - 2, M); }   // M must be prime

// Any coprime modulus: extended Euclid. r = {g, x, y} with a*x + b*y = g
static long[] egcd(long a, long b) {
    if (b == 0) return new long[]{a, 1, 0};
    long[] r = egcd(b, a % b);
    return new long[]{r[0], r[2], r[1] - (a / b) * r[2]};
}
static long inverse(long b, long m) {
    long[] r = egcd(b, m);
    if (r[0] != 1) return -1;             // caller must check: there is none
    return ((r[1] % m) + m) % m;          // x can come back negative
}

// BigInteger.modInverse is correct and throws when the gcd is not 1,
// but it allocates, so keep it out of an inner loop.`,
    cpp: `const long long M = 1000000007;

long long power(long long b, long long e, long long m) {
    long long r = 1; b %= m;
    while (e > 0) {
        if (e & 1) r = r * b % m;
        b = b * b % m;
        e >>= 1;
    }
    return r;
}
long long inverse(long long b) { return power(b, M - 2, M); }  // prime M only

// Extended Euclid: any m with gcd(b, m) == 1, returns -1 when there is none
long long egcd(long long a, long long b, long long &x, long long &y) {
    if (b == 0) { x = 1; y = 0; return a; }
    long long x1, y1, g = egcd(b, a % b, x1, y1);
    x = y1; y = x1 - (a / b) * y1;
    return g;
}
long long inverseAny(long long b, long long m) {
    long long x, y;
    if (egcd(b, m, x, y) != 1) return -1;
    return ((x % m) + m) % m;
}

// Every inv[1..n] in O(n), no powers at all. M must be prime.
vector<long long> smallInverses(int n) {
    vector<long long> inv(n + 1, 1);
    for (int i = 2; i <= n; i++)
        inv[i] = (M - (M / i) * inv[M % i] % M) % M;
    return inv;
}`,
    js: `// Doubles are exact only to 2**53, and b * b with b near 1e9 is not.
// So all of this is BigInt, and BigInt has no modPow: write the loop.
const M = 1000000007n;

function power(b, e, m) {
  let r = 1n; b %= m;
  while (e > 0n) {
    if (e & 1n) r = (r * b) % m;
    b = (b * b) % m;
    e >>= 1n;
  }
  return r;
}
const inverse = (b) => power(b, M - 2n, M);   // Fermat, and M is prime

// Any coprime modulus. Iterative, so a large m cannot blow the stack.
function inverseAny(b, m) {
  let [oldR, r] = [b % m, m];
  let [oldS, s] = [1n, 0n];
  while (r !== 0n) {
    const q = oldR / r;                       // BigInt division truncates
    [oldR, r] = [r, oldR - q * r];
    [oldS, s] = [s, oldS - q * s];
  }
  if (oldR !== 1n) return null;               // gcd is not 1: no inverse
  return ((oldS % m) + m) % m;
}
Number(inverse(5n));                          // back to Number only at the end`,
  },
  codecap: "Two routes to the same residue: one fast power when the modulus is prime, extended Euclid when it is not. Everything else here is one of those two, batched.",

  q: [
    ["Why can you not simply divide under a modulus?", "Because the quotient need not be an integer, so there is no residue for it to be: 3 / 5 mod 7 has no answer as a fraction. And where the quotient is an integer, you no longer hold the value to divide, only its remainder. Division is rebuilt as multiplication by the inverse instead."],
    ["When does an inverse exist, and why?", "Exactly when gcd(b, m) = 1. Jump b hours at a time around a clock of m hours, starting at 0: you return to 0 after m / gcd(b, m) jumps, having stood on that many hours. If the gcd is 1 you stand on all m of them, so you land on 1, exactly once, and the number of jumps that took is the inverse. If the gcd is d > 1 you only ever land on multiples of d, since b and m are both multiples of d, and 1 is not one of them, so you never reach it at all."],
    ["Derive Fermat's inverse rather than quoting it.", "For prime m and b not a multiple of m, b^(m-1) ≡ 1. Split off one b: b × b^(m-2) ≡ 1. The second factor is by definition the inverse, so inv(b) = b^(m-2) mod m, one fast power in O(log m)."],
    ["The modulus is 2³², and the divisor is even. What do you do?", "Nothing, on that route: gcd is at least 2, so no inverse exists. The division has to be avoided instead. Build the value by addition (Pascal's triangle for binomials, since it only ever adds), or factor the powers of two out of the numerator and denominator first and invert what remains."],
    ["You need every inverse factorial up to 2 × 10⁵. How many fast powers is that?", "One. Invert fact[N] with a single power, then walk down using invfact[i-1] = invfact[i] × i, because 1/(i-1)! = (1/i!) × i. Doing a power per entry is O(n log m) and is a common source of timeouts."],
    ["Extended Euclid returns x = -3 for m = 7. What is the inverse, and what does a gcd of 2 mean?", "The inverse is ((-3 % 7) + 7) % 7 = 4, since the coefficient is only defined up to multiples of m. A gcd of 2 means the algorithm has proved there is no inverse, which is a complete answer and not a failure."],
  ],

  p: [
    [50, "powx-n", "Pow(x, n), the squaring loop every inverse is built on", "M"],
    [1922, "count-good-numbers", "Count Good Numbers, one fast power mod 10⁹ + 7", "M"],
    [365, "water-and-jug-problem", "Water and Jug, Bézout, the identity behind extended Euclid", "M"],
    [62, "unique-paths", "Unique Paths, nCr wearing a grid, and the divide is the whole problem", "M"],
    [2400, "number-of-ways-to-reach-a-position-after-exactly-k-steps", "Ways to Reach a Position, one binomial mod a prime", "M"],
    [1569, "number-of-ways-to-reorder-array-to-get-same-bst", "Reorder Array for the Same BST, inverse factorials or a timeout", "H"],
    [1250, "check-if-it-is-a-good-array", "Check If It Is a Good Array, gcd = 1 is exactly when an inverse exists", "H"],
  ],
},

/* ==================================================================== */
{
  id: "bits",
  n: "Bit manipulation",
  group: "Fundamentals",
  one: "An integer is already a row of switches. Bit operations stop pretending otherwise, and <code>a ^ a = 0</code> is the one identity that earns its keep.",

  plain: `<p>Every integer you have ever used is stored as a row of bits, each worth twice the one to its right. Bit manipulation is not a separate branch of mathematics. It is just addressing those switches directly instead of politely going through arithmetic.</p>
<p>There are four things you can do to a bit: set it, clear it, flip it, or ask whether it is on. All four are the same two steps. Build a mask with a shift, then combine it with AND, OR or XOR.</p>
<p>Most of the time this buys you nothing that a boolean array would not, and costs you readability. It earns its place in exactly two situations. First, when a set of up to about 32 items has to fit in one integer: bitmask DP, subsets, visited states. Second, when XOR's cancelling turns an O(n) space problem into an O(1) space one.</p>
<p><b>Analogy.</b> A row of light switches on a wall. You can flip one, or you can hold a stencil over the wall and flip everything showing through the holes. The stencil is the mask. That is genuinely the entire concept.</p>`,

  why: [
    { t: "Position is value, so shifting is multiplying", d: "Bit i is worth 2<sup>i</sup>. Shifting left by one moves every bit up a position, which doubles the number; shifting right halves it and throws away the remainder. So <code>1 &lt;&lt; k</code> is \"a single 1, sitting in position k\", which is how every mask gets built." },
    { t: "The three operators do the three jobs, and no others", d: "<b>OR</b> turns bits on and never turns any off, so it sets. <b>AND</b> keeps only what both sides agree on, so with an inverted mask it clears, and with a single-bit mask it tests. <b>XOR</b> differs, so it flips. Once you see which operator has which personality you stop memorising the four idioms." },
    { t: "XOR is the one with a real superpower", d: "<code>a ^ a = 0</code> and <code>a ^ 0 = a</code>. Together those mean XOR-ing a whole array cancels out every value that appears an even number of times and leaves the odd one standing. Finding the single unpaired number takes <b>O(n) time and O(1) space</b>, with no hash map and no sorting. It is also symmetric and order-independent, so you can do it in any order you like." },
    { t: "A number is a set, if you squint", d: "Bit i on means \"item i is in the set\". Now union is OR, intersection is AND, and membership is a single AND. The whole set is one integer, which you can use as a dictionary key or a DP state. That is the actual reason bitmask DP exists: 2<sup>n</sup> subsets become 2<sup>n</sup> integers, which a machine handles comfortably up to about n = 20." },
    { t: "The identities worth knowing, and the ones that are just showing off", d: "<code>x &amp; (x - 1)</code> clears the lowest set bit, because subtracting one flips that bit off and everything below it on. That gives you both the power-of-two test (<code>x &amp; (x-1) == 0</code>) and a population count that runs once per set bit instead of 32 times. Everything beyond those is a party trick, and your language has a built-in for it anyway." },
    { t: "The sharp edges are all about width and sign", d: "Shifting by more than the width is undefined in C++ and quietly wraps in Java. Right-shifting a negative number copies the sign bit, which is why Java has a separate <code>&gt;&gt;&gt;</code>. JavaScript coerces to 32 bits for any bitwise operation, so a perfectly good large number becomes garbage. And Python has no width at all, so <code>~5</code> is <code>-6</code> forever rather than wrapping. Four languages, four different opinions." },
  ],

  hing: `<p><b>Pehle ek baat seedhi kar lein:</b> integer pehle se hi bits ki ek line hai. Bit manipulation koi alag mathematics nahi hai, bas un switches ko <b>seedha</b> chhoona hai, arithmetic ke through ghoom kar nahi.</p>
<p><b>Char kaam ho sakte hain:</b> bit ko on karna, off karna, palatna, ya poochhna ki on hai kya. Aur charon ka tarika ek hi hai: <b>shift se mask banao, phir AND / OR / XOR se joro</b>.</p>
<p><b>Kaun sa operator kya karta hai:</b><br>
<b>OR</b> sirf on karta hai, kabhi off nahi. Isliye "set".<br>
<b>AND</b> sirf wahi rakhta hai jahan dono taraf 1 ho. Isliye "clear" (ulte mask ke saath) aur "test".<br>
<b>XOR</b> alag hone par 1 deta hai. Isliye "flip".</p>
<p><b>Ab asli cheez, XOR:</b> <code>a ^ a = 0</code> aur <code>a ^ 0 = a</code>. Matlab poore array ko XOR kar do, to jo bhi number <b>do baar</b> aaya hai woh khud ko kaat kar gayab ho jaayega, aur akela wala bach jaayega. <b>O(n) time, O(1) space</b>, na hash map na sorting. Yeh trick interview mein baar-baar aati hai.</p>
<p><b>Number ko set ki tarah socho:</b> bit i on hai matlab item i set mein hai. Ab union = OR, intersection = AND, membership = ek AND. Poora subset ek hi integer ban gaya, jise tum DP ki state ya dictionary ki key bana sakte ho. Bitmask DP yahin se aata hai, aur n ≤ 20 tak aaram se chalta hai.</p>
<p><b>Do identities yaad rakhne layak hain:</b> <code>x &amp; (x-1)</code> sabse neeche wala on-bit hata deta hai. Isse do cheezein milti hain: power of two ka test (<code>x &amp; (x-1) == 0</code>), aur set bits ginna sirf utni baar jitne bits on hain. Baaki jitne "cool bit tricks" internet par hain, unke liye tumhari language mein pehle se function hai.</p>
<p><b>Aur ab langdi jagah, har language ki apni:</b> Java mein negative number right-shift karne par sign copy hota hai, isliye alag se <code>&gt;&gt;&gt;</code> hai. JavaScript har bitwise operation se pehle number ko <b>32-bit</b> bana deta hai, to bada number chupchaap kachra ban jaata hai. C++ mein width se zyada shift karna undefined behaviour hai. Python ki koi width hi nahi, isliye <code>~5</code> hamesha <code>-6</code> rahega. Chaar languages, chaar alag raaye.</p>`,

  viz: ["bits"],
  see: [["DOC", "https://graphics.stanford.edu/~seander/bithacks.html", "Bit Twiddling Hacks (read once, use twice)"]],

  math: [
    { t: "Position is value, so a shift is a multiply", d: "Nothing clever here, it is base two written out. But it is the line every other identity leans on.", w:
`1011 = 1x2^3 + 0x2^2 + 1x2^1 + 1x2^0 = 8 + 0 + 2 + 1 = 11

11 << 3  =  11 x 8   = 88
11 >> 1  =  11 / 2   = 5      rounds DOWN, always
-11 >> 1 =  -6                floor, not truncation` },
    { t: "n & (n-1) clears the lowest set bit", d: "Subtracting one borrows through the trailing zeros, flipping the lowest 1 to 0 and everything under it to 1. The AND then keeps only what is above.", w:
`n      = 12 = 1100
n - 1  = 11 = 1011      <- lowest 1 flipped, zeros below became 1
n & (n-1)   = 1000 = 8

12 -> 8 -> 0 : two steps, so popcount(12) = 2

cost is the number of set bits, not the width.
one iteration per 1, up to 32 or 64, usually far fewer.` },
    { t: "XOR cancels, in any order", d: "a ^ a = 0 and a ^ 0 = a, and XOR is commutative and associative, so pairs annihilate wherever they happen to sit in the array.", w:
`[4, 1, 2, 1, 2]

4 ^ 1 ^ 2 ^ 1 ^ 2
= 4 ^ (1 ^ 1) ^ (2 ^ 2)      reorder freely
= 4 ^ 0 ^ 0
= 4

O(n) time, O(1) space, and no second pass to confirm` },
    { t: "Subsets, counted, including the one that catches people out", d: "A set of k items has 2^k subsets, and the integers 0 to 2^k - 1 are exactly those subsets written in binary.", w:
`k = 20:  2^20 = 1,048,576          fine
k = 25:  2^25 = 33,554,432         borderline
k = 30:  2^30 = 1.07 x 10^9        too many

iterating every submask of every mask is 3^n, not 4^n:
each element is in neither, in the mask only, or in both
3^20 = 3.5 x 10^9   4^20 = 1.1 x 10^12` },
    { t: "The width traps, in numbers", d: "Every one of these compiles, runs, and gives a value. The value is just not the one you meant.", w:
`1 << 31    in a 32-bit int = -2,147,483,648   (the sign bit)
1L << 31   = 2,147,483,648                    (widen first)

-8 >> 1  = -4              arithmetic: the sign is copied in
-8 >>> 1 = 2,147,483,644   logical: a zero is shifted in

shifting by >= the width is undefined in C++ and is
a shift by (count mod 32) in Java. Neither is what you want.` },
  ],

  costs: [
    ["set / clear / flip / test one bit", "O(1)", "a single machine instruction each"],
    ["x & (x-1)", "O(1)", "clears the lowest set bit"],
    ["popcount by clearing", "O(set bits)", "not O(32); your language has a built-in too"],
    ["XOR the whole array", "O(n) time, O(1) space", "pairs cancel, the odd one out survives"],
    ["iterate all subsets of n items", "O(2ⁿ)", "each subset is one integer; practical to about n = 20"],
    ["a set as a bitmask", "O(1) union and intersection", "versus O(n) for two hash sets"],
  ],

  traps: [
    "<b>Precedence.</b> <code>&amp;</code> and <code>|</code> bind <i>looser</i> than <code>==</code> in C, C++ and Java, so <code>x &amp; 1 == 0</code> quietly means <code>x &amp; (1 == 0)</code>. Use brackets and stop thinking about it.",
    "<b>Right-shifting a negative number</b> copies the sign bit. Java gives you <code>&gt;&gt;&gt;</code> for the other behaviour; C++ leaves it implementation-defined and wishes you luck.",
    "<b>JavaScript truncates to 32 bits</b> for every bitwise operation, so <code>2**31 | 0</code> comes back negative. Numbers are doubles right up until you use a bit operator.",
    "<b>Shifting by 32 or more</b> is undefined in C++ and wraps modulo the width in Java. Neither will tell you.",
    "<b>Reaching for bitmasks when a boolean array would do.</b> Unless n is around 20 and you need the set as a key, you have traded readability for nothing.",
  ],

  impl: [
    ["Python", "unlimited width, bin(), int.bit_count()", "No wraparound, so ~5 is -6 permanently. Negative shifts raise instead of misbehaving."],
    ["Java", "int is 32-bit, >>> for unsigned shift", "Integer.bitCount, highestOneBit, toBinaryString. Shifts are taken modulo the width."],
    ["C++", "std::popcount and std::bit_width in C++20", "Overshifting is undefined behaviour. __builtin_popcount on older compilers."],
    ["JavaScript", "bitwise coerces to int32", "Use >>> 0 to read a result as unsigned. BigInt supports bit operations without the 32-bit ceiling."],
  ],

  code: {
    pseudo: `# A mask is a shift. Everything else is one operator.
bit k of x      ->  (x >> k) & 1
set bit k       ->  x | (1 << k)
clear bit k     ->  x & ~(1 << k)
flip bit k      ->  x ^ (1 << k)

# The two identities that pay rent
x & (x - 1)     ->  clears the LOWEST set bit
x & (x - 1) == 0  ->  x is a power of two (guard x != 0 first)

# XOR cancels: this is the one you will actually be asked about
result <- 0
for v in nums: result <- result xor v
# every value appearing twice has cancelled; result is the loner

# A number IS a set of up to 32 items
add item i      ->  mask | (1 << i)
is i present    ->  mask & (1 << i)
union           ->  a | b
intersection    ->  a & b
size            ->  popcount(mask)

# Walk every subset of n items
for mask from 0 to (1 << n) - 1:
    for i from 0 to n - 1:
        if mask & (1 << i): item i is in this subset`,
    py: `x = 0b1011                      # 11

(x >> 2) & 1                    # read bit 2
x | (1 << 2)                    # set bit 2
x & ~(1 << 1)                   # clear bit 1
x ^ (1 << 0)                    # flip bit 0

x & 1                           # odd?
x >> 1                          # halve
x & (x - 1)                     # clear the lowest set bit
x > 0 and x & (x - 1) == 0      # power of two (0 would sneak through otherwise)

bin(11)                         # '0b1011'
(11).bit_count()                # 3      (Python 3.10+)
bin(11).count("1")              # 3      (older, and slower, and uglier)

def single_number(nums):        # every value twice except one: O(1) space
    out = 0
    for v in nums: out ^= v
    return out

def subsets(items):             # each mask IS a subset
    n, res = len(items), []
    for mask in range(1 << n):
        res.append([items[i] for i in range(n) if mask & (1 << i)])
    return res

# Python has no fixed width, so this is -6 and always will be
~5`,
    java: `int x = 0b1011;

(x >> 2) & 1;                   // read bit 2
x |= (1 << 2);                  // set
x &= ~(1 << 1);                 // clear
x ^= (1 << 0);                  // flip

// Precedence trap: & binds looser than ==, so brackets are not optional
if ((x & 1) == 0) { /* even */ }

Integer.bitCount(11);           // 3
Integer.toBinaryString(11);     // "1011"
Integer.highestOneBit(11);      // 8

// >> keeps the sign, >>> does not. This distinction exists for a reason.
-8 >> 1;                        // -4
-8 >>> 1;                       // 2147483644

static int singleNumber(int[] nums) {
    int out = 0;
    for (int v : nums) out ^= v;
    return out;
}

for (int mask = 0; mask < (1 << n); mask++)
    for (int i = 0; i < n; i++)
        if ((mask & (1 << i)) != 0) { /* item i is in this subset */ }`,
    cpp: `int x = 0b1011;

(x >> 2) & 1;                   // read
x |= (1 << 2);                  // set
x &= ~(1 << 1);                 // clear
x ^= (1 << 0);                  // flip

if ((x & 1) == 0) { /* even */ }        // brackets: & is looser than ==

__builtin_popcount(11);         // 3
std::popcount(11u);             // C++20, and it takes an unsigned type
std::bit_width(11u);            // 4
x & (x - 1);                    // clear the lowest set bit

// Shifting by >= the width is UNDEFINED, not merely surprising
// 1 << 32 is not 0; it is whatever the optimiser felt like today
long long big = 1LL << 40;      // shift the wider type, not the narrower one

int singleNumber(vector<int>& nums) {
    int out = 0;
    for (int v : nums) out ^= v;
    return out;
}`,
    js: `let x = 0b1011;

(x >> 2) & 1;                   // read
x |= (1 << 2);                  // set
x &= ~(1 << 1);                 // clear
x ^= (1 << 0);                  // flip

// Numbers are 64-bit doubles until a bitwise operator shows up,
// at which point they are silently 32-bit signed integers.
2 ** 31 | 0;                    // -2147483648
(2 ** 31) >>> 0;                // 2147483648   (read the bits as unsigned)
(x >>> 0).toString(2);          // binary string

function popcount(x) {
  let n = 0;
  while (x) { x &= x - 1; n++; }   // once per SET bit
  return n;
}

function singleNumber(nums) {
  return nums.reduce((a, v) => a ^ v, 0);
}

// Beyond 32 bits, use BigInt and its own bit operators
(1n << 40n) | 1n;`,
  },
  codecap: "Build a mask with a shift, combine with one operator. If you remember only one thing, remember that XOR cancels.",

  q: [
    ["How do you build a mask for bit k, and what do the three operators do with it?", "1 << k puts a single 1 in position k. OR sets the bit, AND with the inverted mask clears it, AND with the plain mask tests it, and XOR flips it."],
    ["Why does XOR-ing an entire array find the one unpaired value?", "Because a ^ a = 0 and a ^ 0 = a. Every value appearing twice cancels itself out regardless of order, so only the unpaired one is left. O(n) time and O(1) space."],
    ["What does x & (x - 1) do and what two things does it give you?", "It clears the lowest set bit, because subtracting one flips that bit off and turns on everything below it. That yields the power-of-two test x & (x-1) == 0, and a popcount that loops once per set bit."],
    ["Why is 'a number is a set' useful rather than cute?", "Bit i means item i is present, so union is OR and intersection is AND, and the whole set is a single integer usable as a DP state or a map key. That is what makes bitmask DP possible for n up to about 20."],
    ["What goes wrong with x & 1 == 0 in C, C++ or Java?", "& binds looser than ==, so it parses as x & (1 == 0). It compiles and gives the wrong answer. Bracket the bit test."],
    ["What does JavaScript do to a number before a bitwise operation?", "Coerces it to a 32-bit signed integer, so anything at or above 2^31 comes back negative or truncated. Use >>> 0 to read the result as unsigned, or BigInt to avoid the ceiling."],
  ],

  p: [
    [136, "single-number", "Single Number, the XOR classic", "E"],
    [191, "number-of-1-bits", "Number of 1 Bits", "E"],
    [231, "power-of-two", "Power of Two, one line if you know the trick", "E"],
    [338, "counting-bits", "Counting Bits, DP over bit patterns", "E"],
    [268, "missing-number", "Missing Number, XOR beats the sum formula", "E"],
    [78, "subsets", "Subsets, one integer per subset", "M"],
    [371, "sum-of-two-integers", "Sum of Two Integers, addition without +", "M"],
  ],
},

/* ==================================================================== */
{
  id: "arrays",
  n: "Arrays & dynamic lists",
  group: "Fundamentals",
  one: "An array is <b>one contiguous block of memory</b>, so <code>a[i]</code> is instant arithmetic. Everything else about lists, O(1) append, O(n) insert at front, follows from that one fact.",

  plain: `<p>An array is not a list of boxes scattered in memory. It is <b>one unbroken strip</b>, every slot the same size, laid end to end. That is the whole design.</p>
<p>Because of it, <code>a[7]</code> needs no searching at all: the computer computes <code>start + 7 × slot_size</code> and reads that address directly. One multiplication and one addition. That is why indexing is O(1), and why it stays O(1) whether the array holds 10 items or 10 million.</p>
<p><b>Analogy.</b> A row of numbered lockers bolted to a wall. Locker 412 takes the same time to reach as locker 3. You just walk straight to it. But adding a locker <i>between</i> 3 and 4 means unbolting and shifting every locker after it. That shift is the O(n) insert. It is not a quirk of any one language. It is the price of keeping everything in one unbroken run, which is what <b>contiguous</b> means.</p>`,

  why: [
    { t: "Memory only understands addresses",
      d: "RAM has no idea what \"the third item\" means. It only knows byte addresses. So the fastest possible collection is one where the address can be <b>calculated</b> instead of searched for." },
    { t: "Line the items up and the address becomes arithmetic",
      d: "Same-sized slots, side by side, no gaps. Then <code>address = start + i × slotSize</code>. One multiply, one add, the same work whether i is 3 or 3 million. This one equation is the whole reason arrays exist, and why index 0 means \"zero steps from the start\"." },
    { t: "The price is that the block cannot grow",
      d: "The memory sitting right after your array belongs to something else. You cannot just take two more bytes. So a raw array's size is fixed the moment it is created." },
    { t: "Growable arrays fake it by doubling",
      d: "They quietly keep spare room. <b>append</b> writes into the spare room, fast. When it runs out, they allocate a block twice as big and copy everything, slow, but rare. Over n appends the copies add up to less than 2n, so append averages out to <b>O(1) amortised</b>." },
    { t: "The front is expensive, and that has consequences",
      d: "Inserting or removing at the start shifts every other element to keep the block unbroken, <b>O(n)</b>. If you need both ends to be fast, you need a different layout: a deque. This is why BFS uses one." },
    { t: "Contiguity also buys speed that Big-O refuses to show you",
      d: "A CPU never fetches one value, it fetches a <b>cache line</b> of roughly 64 bytes. Neighbouring array elements arrive in the same fetch, so walking an array is close to free per element after the first. Walk a linked list of the same length and every hop can be a separate trip to memory. Both are O(n), and the array can be several times faster in wall-clock time. Big-O deliberately discards constant factors, and this is the constant factor that most often decides which solution actually passes." },
    { t: "If order does not matter, deletion stops being O(n)",
      d: "Removing from the middle is expensive only because the gap has to close. When you do not care about order, do not close it: <b>swap the doomed element with the last one and pop the end</b>. That is O(1), and it is how you delete from a collection you are treating as a bag of things rather than a sequence. Most people never learn this and shift a million elements to avoid a swap." },
  ],

  variants: [
    { n: "In-place rewrite, the writer index", cost: "O(n) time, O(1) space",
      idea: "One pointer reads, a slower one writes. Everything before the writer is already the answer.",
      when: "Removing duplicates, moving zeroes, filtering in place, and anything that says modify the array in place.",
      watch: "The writer is also the new length when you finish, so no separate counter is needed. See the loop invariants page." },

    { n: "Prefix sums", cost: "O(n) once, then O(1) per range query",
      idea: "Store every running total, so any range sum becomes a subtraction.",
      when: "Repeated range questions on data that does not change.",
      watch: "It has its own page. If the array also changes between queries, you want a Fenwick tree instead." },

    { n: "Rotate by reversal", cost: "O(n) time, O(1) space",
      idea: "To rotate right by k, reverse the whole array, then reverse the first k, then reverse the rest.",
      when: "Rotation without an extra buffer, which is the usual follow-up after the obvious O(n) space answer.",
      watch: "Take k modulo n first, or a rotation larger than the array does nothing useful." },

    { n: "Swap with last", cost: "O(1) delete",
      idea: "Overwrite the element you want gone with the final element, then shrink by one.",
      when: "Order is irrelevant: a pool of objects, an unordered bag, a visited list.",
      watch: "It scrambles the order, so never use it where position carries meaning. If you are iterating forward, do not advance after the swap." },

    { n: "Three-way partition, Dutch national flag", cost: "O(n) time, O(1) space, one pass",
      idea: "Three pointers split the array into less-than, equal-to and greater-than a pivot, in a single sweep.",
      when: "Sorting an array with only three distinct values, or partitioning around duplicates in quicksort.",
      watch: "When you swap with the high pointer, do not advance the cursor: the value you just received has not been examined yet." },

    { n: "Difference array", cost: "O(1) per range update, O(n) to read out",
      idea: "The mirror of prefix sums. Record +v at the start and -v just past the end, then one prefix pass materialises every value.",
      when: "Many range updates and one read at the end, such as counting overlapping bookings.",
      watch: "Only works when all the updates come before all the reads. Interleave them and you need a real range structure." },
  ],

  hing: `<p><b>Array asli mein hai kya?</b> Memory ka ek <b>lamba, judaa hua block</b>, sab slots barabar size ke, ek ke baad ek. Bas itna hi.</p>
<p><b>a[i] itna fast kyun?</b> Kyunki computer dhoondta nahi, <b>calculate</b> karta hai: <code>address = start + i × size</code>. Ek multiply, ek add, bas. Isiliye <code>a[0]</code> aur <code>a[999999]</code> dono ek hi speed. Aur isiliye index <b>0 se</b> shuru hota hai, 0 ka matlab "shuruaat se 0 kadam aage".</p>
<p><b>Iski keemat?</b> Block fixed hai, uske aage ki memory kisi aur ki hai, tum wahan ghus nahi sakte. Matlab array badh nahi sakta.</p>
<p><b>Phir list / ArrayList / vector kaise badhti hai?</b> Chalaaki se. Woh zaroorat se <b>zyada jagah</b> pehle hi le leti hai. <code>append</code> khaali slot mein likh deta hai, O(1). Jab jagah khatam, to <b>double</b> size ka naya block banao aur sab copy karo, us ek append ki cost O(n).</p>
<p><b>To append O(1) hai ya O(n)?</b> Dono, aur yahi asli jawaab hai. Copy 1, 2, 4, 8… par hoti hai; sab jodo to 2n se kam. n appends par baant do → har append <b>O(1) amortised</b>. Interview mein "amortised" shabd bolna zaroori hai.</p>
<p><b>Aage se insert mehnga kyun?</b> <code>insert(0, x)</code> ya <code>pop(0)</code> mein baaki saare elements ko ek jagah khisakna padta hai, n writes, <b>O(n)</b>. Isliye BFS queue ke liye <code>list.pop(0)</code> mat use karo, <code>deque.popleft()</code> use karo, warna O(V+E) chupke se O(V²) ban jaata hai. Yeh galti bahut common hai.</p>`,

  viz: ["dynamic-array"],
  see: [["VA", "https://visualgo.net/en/list", "VisuAlgo, array vs linked list, animated"]],

  math: [
    { t: "The index is arithmetic, which is what O(1) actually means", d: "There is no search. The machine computes an address and reads it, and the computation does not depend on i.", w:
`base = 0x1000, 4 bytes per int

a[0]  ->  0x1000
a[1]  ->  0x1004
a[i]  ->  base + 4 x i

a[999999] costs exactly what a[0] costs: one multiply,
one add, one read. A linked list would cost 999,999 hops.` },
    { t: "Doubling: add up every copy ever made", d: "Each growth copies the whole array, which looks alarming until you add the copies up. The sum is geometric, so it never passes n.", w:
`growing 1 -> 2 -> 4 -> ... -> n, copying on each step:

1 + 2 + 4 + ... + n/2  =  n - 1

n appends  =  n writes + (n - 1) copies  <  2n
per append <  2 operations, amortised O(1)

now grow by ONE slot instead:
1 + 2 + 3 + ... + (n-1) = n(n-1)/2
n = 100,000:  under 100,000 copies  vs  5 x 10^9 copies` },
    { t: "Amortised O(1) and worst-case O(1) are different promises", d: "The average over the sequence is a small constant. One unlucky call still copies the entire array, which matters if anything is timing individual calls.", w:
`capacity 1,000,000, size 1,000,000

the next append: allocate 2,000,000, copy 1,000,000 items
that one call is O(n)

average over the whole sequence: under 2
worst case for one call: n

a latency budget cares about the second number` },
    { t: "The front is expensive, and here is the bill", d: "Contiguity is what made indexing free, and the same contiguity is what makes an insert at the front move everything.", w:
`insert at index 0 of n items: n elements shift right

building a list by prepending n times:
  1 + 2 + ... + (n-1)  =  n(n-1)/2  shifts
  n = 100,000  ->  5 x 10^9 shifts

append n times, then reverse once:
  n + n = 200,000 operations` },
  ],

  costs: [
    ["a[i] read / write", "O(1)", "computed address, no search"],
    ["append at end", "O(1) amortised", "spare capacity; doubles and copies occasionally"],
    ["pop() from end", "O(1)", "nothing shifts"],
    ["insert(0, x) / pop(0)", "O(n)", "every later element shifts one slot"],
    ["x in a (search)", "O(n)", "must compare each element, use a set instead"],
    ["a.sort()", "O(n log n)", "Timsort; O(n) on already-sorted data"],
    ["slicing a[i:j]", "O(j−i)", "builds a copy, a slice in a loop is a hidden O(n²)"],
  ],

  traps: [
    "<b><code>[[0]*3]*3</code> makes three references to the SAME row.</b> Writing <code>g[0][0]</code> changes all three. Use <code>[[0]*3 for _ in range(3)]</code>.",
    "<b>Mutating a list while iterating it</b> skips elements. Iterate over a copy (<code>for x in a[:]</code>) or build a new list.",
    "<b><code>x in a</code> inside a loop</b> is the most common accidental O(n²) in interviews. Convert to a <code>set</code> first.",
    "<b>Slicing copies.</b> <code>a[1:]</code> inside a recursion turns O(n) into O(n²), pass indices instead.",
    "<b>Sorting when you only wanted the extremes.</b> Sorting to find the minimum, the maximum or the k largest is O(n log n) for something a single pass does in O(n) and a size-k heap does in O(n log k).",
  ],

  impl: [
    ["Python", "list", "Over-allocates by ~1/8; insert(0,x)/pop(0) are O(n). Slicing copies."],
    ["Java", "int[] (fixed) · ArrayList (growable)", "ArrayList doubles (×1.5 actually); System.arraycopy for fast copies. No slicing."],
    ["C++", "vector", "reserve(n) up front avoids all reallocation. vector<bool> is a bitset, not a normal vector."],
    ["JavaScript", "Array", "Sparse arrays and holes are slow; unshift()/shift() are O(n). Use push/pop."],
  ],

  code: {
    pseudo: `# The array contract, true in every language.
#   address(i) = base + i * width    ->  a[i] is O(1)
#   the block is contiguous          ->  insert/remove in the middle is O(n)
#   growable arrays over-allocate    ->  append is O(1) AMORTISED

append(a, x):
    if size == capacity:
        new <- allocate(2 * capacity)     # O(n), happens rarely
        copy every element into new       # 1+2+4+...+n < 2n total
    a[size] <- x                          # O(1), happens always
    size <- size + 1

# Prefix sums: pay O(n) once, then any range sum is O(1)
pre[0] <- 0
for i in 0..n-1:  pre[i+1] <- pre[i] + a[i]
rangeSum(l, r)  =  pre[r+1] - pre[l]      # inclusive [l, r]

# In-place reverse, O(1) extra space
i <- 0; j <- n-1
while i < j:  swap(a[i], a[j]); i <- i+1; j <- j-1`,
    py: `# The array moves worth having in your fingers.

a = [3, 1, 4, 1, 5]

a.append(9)              # O(1) amortised
a.pop()                  # O(1) from the end
a.insert(0, 7)           # O(n), shifts everything. Avoid in loops.
a.sort()                 # O(n log n), in place
b = sorted(a, key=lambda x: -x)   # O(n log n), new list

# Two pointers in place, O(1) extra space
def reverse(a):
    i, j = 0, len(a) - 1
    while i < j:
        a[i], a[j] = a[j], a[i]
        i += 1; j -= 1

# Prefix sums: pay O(n) once, answer any range sum in O(1)
pre = [0]
for x in a: pre.append(pre[-1] + x)
range_sum = lambda l, r: pre[r+1] - pre[l]    # inclusive [l, r]

# 2D grid, the ONLY correct way
grid = [[0] * cols for _ in range(rows)]      # NOT [[0]*cols]*rows

# Both ends in O(1)? That is a different structure.
from collections import deque
q = deque([1, 2, 3])
q.appendleft(0)          # O(1), a list would be O(n)
q.popleft()              # O(1). This is why BFS uses deque`,
    java: `int[] a = new int[n];                 // fixed size, zero-filled
List<Integer> list = new ArrayList<>();
list.add(9);                          // O(1) amortised
list.remove(0);                       // O(n), shifts everything
Collections.sort(list);               // O(n log n)

// Prefix sums
int[] pre = new int[n + 1];
for (int i = 0; i < n; i++) pre[i + 1] = pre[i] + a[i];
int rangeSum = pre[r + 1] - pre[l];

// 2D grid, rows are independent objects here, unlike a copied reference
int[][] grid = new int[rows][cols];

// In-place reverse
for (int i = 0, j = a.length - 1; i < j; i++, j--) {
    int t = a[i]; a[i] = a[j]; a[j] = t;
}

// Both ends in O(1)? Different structure.
Deque<Integer> dq = new ArrayDeque<>();
dq.addFirst(0); dq.pollFirst();       // O(1). ArrayList.remove(0) is O(n)`,
    cpp: `vector<int> a = {3, 1, 4};
a.reserve(1000);                 // pre-allocate: no reallocation at all
a.push_back(9);                  // O(1) amortised
a.insert(a.begin(), 7);          // O(n), shifts everything
sort(a.begin(), a.end());        // O(n log n)

// Prefix sums
vector<long> pre(a.size() + 1, 0);
for (size_t i = 0; i < a.size(); ++i) pre[i+1] = pre[i] + a[i];
long rangeSum = pre[r+1] - pre[l];

// 2D grid
vector<vector<int>> grid(rows, vector<int>(cols, 0));

// In-place reverse
reverse(a.begin(), a.end());     // or swap with two indices

// Both ends O(1)
deque<int> dq;
dq.push_front(0); dq.pop_front();`,
    js: `const a = [3, 1, 4];
a.push(9);                    // O(1) amortised
a.pop();                      // O(1)
a.unshift(7);                 // O(n), shifts everything
a.sort((x, y) => x - y);      // O(n log n), comparator is REQUIRED for numbers

// Prefix sums
const pre = [0];
for (const x of a) pre.push(pre[pre.length - 1] + x);
const rangeSum = pre[r + 1] - pre[l];

// 2D grid. Array(rows).fill([]) shares ONE row, same trap as [[0]*c]*r
const grid = Array.from({ length: rows }, () => new Array(cols).fill(0));

// In-place reverse
let i = 0, j = a.length - 1;
while (i < j) { [a[i], a[j]] = [a[j], a[i]]; i++; j--; }`,
  },
  codecap: "Prefix sums and in-place two pointers are the two array tricks that turn O(n²) into O(n).",

  q: [
    ["Why is a[i] O(1)?", "Elements sit contiguously at equal width, so the address is computed as base + i × width, one multiply and one add, independent of i or of n."],
    ["Why is append O(1) amortised but sometimes O(n)?", "The list keeps spare capacity; append usually just writes into it. When full it allocates a double-size block and copies (O(n)). Because it doubles, total copy work over n appends is < 2n → O(1) each on average."],
    ["Why is insert(0, x) O(n)?", "The block must stay contiguous, so every existing element shifts one slot right, n writes."],
    ["What does [[0]*3]*3 actually build?", "One row object referenced three times. Writing to g[0][0] appears to change every row. Use a comprehension to build independent rows."],
    ["Array and linked list both scan in O(n). Why is the array much faster in practice?", "Cache locality. The CPU fetches ~64 bytes at a time, so neighbouring array elements come for free, while linked-list nodes scattered in memory cost a fetch each. Big-O discards exactly this constant factor."],
    ["When is deleting from an array O(1)?", "When order does not matter. Swap the element you want gone with the last one and pop the end, so no gap has to close. It scrambles the order, so never do it where position carries meaning."],
  ],

  p: [
    [485, "max-consecutive-ones", "Max Consecutive Ones", "E"],
    [26, "remove-duplicates-from-sorted-array", "Remove Duplicates (in place)", "E"],
    [189, "rotate-array", "Rotate Array, the reverse trick", "M"],
    [238, "product-of-array-except-self", "Product Except Self, prefix/suffix", "M"],
    [560, "subarray-sum-equals-k", "Subarray Sum = K, prefix sums + hash", "M"],
    [283, "move-zeroes", "Move Zeroes, the writer index in its purest form", "E"],
    [75, "sort-colors", "Sort Colors, three-way partition in one pass", "M"],
  ],
},

/* ==================================================================== */
{
  id: "grids",
  n: "2-D arrays and grids",
  group: "Fundamentals",
  one: "A grid is an array of arrays, so <code>grid[r][c]</code> is <b>row first</b>. Keep the four directions in one list and check bounds before you index, and most grid bugs never happen.",

  plain: `<p>A 2-D array is not a new data structure. It is an array whose elements happen to be arrays, which is why <code>grid[r][c]</code> means "row r, then column c inside it".</p>
<p>That ordering causes an embarrassing share of grid bugs, and they hide well. On a square grid, swapping row and column gives a wrong answer rather than a crash. So the code runs, returns something plausible, and fails the one test case that uses a rectangle.</p>
<p>The other half of grid work is neighbours. Nearly every grid problem asks about the cells next to a cell. So write the four directions once, as a list of <code>(dr, dc)</code> pairs, and loop over it. The alternative is four copy-pasted blocks with the third one subtly wrong.</p>
<p>Everything else is bounds checking, and bounds checking is only interesting because Python will not do it for you. A negative index does not fail there. It cheerfully wraps to the far end of the grid and hands you a confidently incorrect result.</p>
<p><b>Analogy.</b> A spreadsheet. Nobody says "column C, row 4", they say "C4" and then get it backwards in code anyway.</p>`,

  why: [
    { t: "Rows of rows, so the row index comes first", d: "<code>grid</code> holds row objects; <code>grid[r]</code> is one row; <code>grid[r][c]</code> is a cell in it. So the number of rows is <code>len(grid)</code> and the number of columns is <code>len(grid[0])</code>, which quietly assumes there is a row 0. An empty grid is a real input and it will find you." },
    { t: "Each row is a separate object, and that matters more than it sounds", d: "Because the rows are independent objects, building a grid by repeating one row hands you the same row several times over. Writing to one apparently writes to all of them. This is not a grid problem, it is the aliasing rule from the memory page arriving in a costume." },
    { t: "Neighbours are data, not control flow", d: "Write the four offsets as <code>[(-1,0),(1,0),(0,-1),(0,1)]</code> and loop. Four hand-written branches means four bounds checks, which means one of them is wrong, which means a bug that only appears on the top edge. Diagonals are four more pairs in the same list and nothing else changes." },
    { t: "Check bounds before indexing, not after", d: "<code>0 &lt;= nr &lt; rows and 0 &lt;= nc &lt; cols</code>, evaluated first. Java and C++ throw or corrupt memory, which is at least honest. Python treats <code>grid[-1]</code> as the last row and returns an answer from the opposite corner of the board, which is considerably worse than a crash." },
    { t: "The classic transforms are two boring steps, not one clever one", d: "Rotating a matrix 90 degrees in place looks like it needs a spiral and four-way swaps. It does not: <b>transpose, then reverse each row</b>. Transposing means swapping <code>grid[r][c]</code> with <code>grid[c][r]</code>, but only where <code>c &gt; r</code>. Do it for every cell and each pair is swapped twice, which returns you politely to where you started." },
    { t: "A grid is a graph that never needed building", d: "Every cell is a node and every legal move is an edge. So flood fill is DFS and shortest path on an open grid is BFS. You never build an adjacency list, because the coordinates already are one. This is why grid questions are really graph questions wearing a rectangle, and why this page exists before the graph pages." },
  ],

  hing: `<p><b>2-D array koi nayi cheez nahi hai.</b> Yeh bas ek array hai jiske andar arrays hain. Isiliye <code>grid[r][c]</code> ka matlab hai: pehle <b>row</b> r, phir uske andar column c.</p>
<p><b>Aur yahi sabse zyada galtiyon ki jagah hai.</b> Square grid par row aur column ulta kar do, to program crash nahi karega. Woh chalega, jawaab dega, aur woh jawaab galat hoga. Pakda tab jaayega jab koi rectangle wala test case aayega.</p>
<p><b>Rows alag-alag objects hote hain.</b> Ek hi row ko repeat karke grid banaya, to wahi ek row baar-baar mil jaayegi. Phir ek cell badlo, aur saari rows badli hui dikhengi. Yeh grid ki problem nahi hai, yeh <b>memory wale page ka aliasing</b> hai jo naye kapdon mein aa gaya.</p>
<p><b>Padosi (neighbours) ko data banao, code nahi.</b> Chaar directions ek list mein likho: <code>[(-1,0),(1,0),(0,-1),(0,1)]</code>, aur loop chala do. Chaar alag if likhoge to chaar bounds check likhne padenge, aur unme se ek galat hoga. Woh bug sirf kinare wali row par dikhega, aur tab tak tum kuch aur dhoondh rahe hoge.</p>
<p><b>Bounds pehle check karo, index baad mein.</b> Java aur C++ to crash kar denge ya memory kharab kar denge, jo kam se kam <b>imaandaar</b> hai. Python <code>grid[-1]</code> ko aakhri row maan leta hai aur board ke doosre kone se jawaab utha kar de deta hai. Crash se yeh zyada khatarnak hai.</p>
<p><b>90 degree rotate karna:</b> log isme spiral aur chaar-chaar swap sochne lagte hain. Zaroorat nahi. Do boring steps: <b>transpose karo, phir har row ko ulta kar do</b>. Transpose mein swap sirf wahan karo jahan <code>c &gt; r</code> hai, warna har pair do baar swap hoga aur grid waise ka waisa reh jaayega.</p>
<p><b>Aur sabse important baat aage ke liye:</b> grid asal mein ek <b>graph</b> hai jise banane ki zaroorat hi nahi padi. Har cell ek node, har legal move ek edge. Isliye flood fill = DFS, aur shortest path = BFS. Adjacency list banane ki zaroorat nahi kyunki coordinates khud hi adjacency hain. Isi wajah se yeh page graph wale pages se pehle hai.</p>`,

  viz: ["grid-basics"],
  see: [["VA", "https://visualgo.net/en/dfsbfs", "VisuAlgo, traversal on a grid or graph"]],

  math: [
    { t: "Two indices, one address", d: "A grid is stored as one flat run of memory, so the pair (r, c) is folded into a single offset. Knowing the fold both ways is what lets you use an integer as a cell id.", w:
`R rows, C columns, stored row by row:

  grid[r][c]  ->  flat[r * C + c]

R = 3, C = 4, cell (2, 1)  ->  2 x 4 + 1 = 9

and back again:
  r = i / C     c = i mod C
  i = 9  ->  r = 9 / 4 = 2,  c = 9 mod 4 = 1` },
    { t: "Which loop goes outside, and what it costs to get it wrong", d: "Both orders visit every cell once and both are O(R x C). Only one of them reads memory in the order the machine actually fetches it.", w:
`1000 x 1000 ints, 4 bytes each, 64-byte cache line = 16 ints

rows outside (row-major):  1 miss per 16 reads =  62,500 misses
cols outside:              1 miss per read     = 1,000,000 misses

identical Big-O, identical output, several times the clock` },
    { t: "Neighbours, counted", d: "Keeping the directions in a list turns four near-identical if statements into one loop, and the arithmetic below is the whole cost of doing it.", w:
`DIRS = [(-1,0), (1,0), (0,-1), (0,1)]

per cell:       4 checks    (8 with diagonals)
full traversal: 4 x R x C   = O(R x C)
1000 x 1000:    4 x 10^6 checks, which is free` },
    { t: "Why the bounds check is not optional, and why testing misses it", d: "Only the border cells can walk off the grid, and on any grid worth using the border is a rounding error of the total.", w:
`corner cell:    2 of 4 neighbours exist
edge cell:      3 of 4
interior cell:  4 of 4

1000 x 1000 grid:
  interior  998 x 998 = 996,004 cells   99.6 %
  border               =   3,996 cells    0.4 %

so an unguarded index is right 99.6 % of the time` },
    { t: "Rotation is two boring passes", d: "One 90-degree clockwise turn sends (r, c) to (c, R-1-r). Transpose does the first half, reversing each row does the second.", w:
`transpose:        (r, c) -> (c, r)
reverse each row: (c, r) -> (c, R-1-r)
composed:         (r, c) -> (c, R-1-r)   = 90 degrees clockwise

in place, n x n:
  transpose  n(n-1)/2 swaps
  reversal   n x n/2  swaps
  total      about n^2 swaps, O(1) extra space
four turns return the grid to itself` },
  ],

  costs: [
    ["grid[r][c]", "O(1)", "two index operations, nothing is searched"],
    ["visit every cell", "O(rows × cols)", "the honest cost of any full scan"],
    ["check the four neighbours", "O(1)", "four offsets, four bounds checks"],
    ["flood fill / DFS / BFS on a grid", "O(rows × cols)", "each cell is enqueued once if you mark on push"],
    ["transpose in place", "O(rows × cols), O(1) space", "swap only where c > r"],
    ["rotate 90 in place", "O(rows × cols), O(1) space", "transpose, then reverse each row"],
    ["visited set", "O(rows × cols) space", "or mutate the grid itself, if you are allowed to"],
  ],

  traps: [
    "<b>Swapping row and column.</b> On a square grid this returns a wrong answer instead of an error, which is how it survives all the way to submission.",
    "<b>Building a grid by repeating a row.</b> <code>[[0]*c]*r</code> stores one row r times. Use a comprehension, and reread the memory page.",
    "<b>Negative indices in Python.</b> <code>grid[-1][0]</code> is a valid cell, so a missing bounds check produces a plausible answer rather than an exception.",
    "<b>Marking visited on pop instead of on push</b> in a BFS. The same cell gets queued from several neighbours and the complexity quietly stops being linear.",
    "<b>Assuming <code>grid[0]</code> exists.</b> An empty grid is a legal input, and <code>len(grid[0])</code> is how you find out it was not handled.",
  ],

  impl: [
    ["Python", "[[0]*c for _ in range(r)]", "Never [[0]*c]*r. Negative indices are legal, so bounds checks are on you."],
    ["Java", "int[][] g = new int[r][c]", "Rows are separate objects already. Ragged arrays are allowed, so g[0].length is per-row."],
    ["C++", "vector<vector<int>> g(r, vector<int>(c))", "For speed, a flat vector of size r*c indexed as r*cols+c is friendlier to the cache."],
    ["JavaScript", "Array.from({length: r}, () => new Array(c).fill(0))", "Array(r).fill([]) shares one row, the same trap in different syntax."],
  ],

  code: {
    pseudo: `# Rows of rows. Row index first, always.
rows <- length(grid)
cols <- length(grid[0])          # assumes a row 0 exists; check the empty case

# Neighbours as DATA, written once
DIRS <- [ (-1,0), (1,0), (0,-1), (0,1) ]     # add 4 more pairs for diagonals

for (dr, dc) in DIRS:
    nr <- r + dr
    nc <- c + dc
    if 0 <= nr < rows and 0 <= nc < cols:    # bounds BEFORE indexing
        look at grid[nr][nc]

# FLOOD FILL is depth-first search that never had to build a graph
fill(r, c):
    if out of bounds or grid[r][c] is not the target colour: return
    grid[r][c] <- new colour                 # marking IS the visited set
    for (dr, dc) in DIRS: fill(r + dr, c + dc)

# SHORTEST PATH on an open grid is breadth-first search
queue <- [(startR, startC)];  mark start visited
while queue not empty:
    for each cell in the current level:
        for (dr, dc) in DIRS:
            if in bounds and not visited: mark visited THEN enqueue
    steps <- steps + 1

# ROTATE 90 CLOCKWISE, in place, in two boring steps
transpose: for r, for c > r: swap grid[r][c] with grid[c][r]
then reverse each row`,
    py: `rows, cols = len(grid), len(grid[0]) if grid else 0
DIRS = [(-1, 0), (1, 0), (0, -1), (0, 1)]

# Build it correctly. The other way shares one row.
grid = [[0] * cols for _ in range(rows)]

def neighbours(r, c):
    for dr, dc in DIRS:
        nr, nc = r + dr, c + dc
        if 0 <= nr < rows and 0 <= nc < cols:    # bounds first
            yield nr, nc

def flood(r, c, target, replacement):
    if not (0 <= r < rows and 0 <= c < cols): return
    if grid[r][c] != target or target == replacement: return
    grid[r][c] = replacement                     # marking as we go
    for nr, nc in neighbours(r, c):
        flood(nr, nc, target, replacement)

from collections import deque
def shortest(start, goal):
    q, seen, steps = deque([start]), {start}, 0
    while q:
        for _ in range(len(q)):
            r, c = q.popleft()
            if (r, c) == goal: return steps
            for nr, nc in neighbours(r, c):
                if (nr, nc) not in seen and grid[nr][nc] != "#":
                    seen.add((nr, nc))           # mark on PUSH
                    q.append((nr, nc))
        steps += 1
    return -1

def rotate90(g):                                 # in place, O(1) extra
    n = len(g)
    for r in range(n):
        for c in range(r + 1, n):                # only c > r, or you undo yourself
            g[r][c], g[c][r] = g[c][r], g[r][c]
    for row in g: row.reverse()`,
    java: `int rows = grid.length, cols = grid[0].length;
int[][] DIRS = {{-1,0}, {1,0}, {0,-1}, {0,1}};

int[][] g = new int[rows][cols];      // rows are separate objects already

static void flood(char[][] g, int r, int c, char target, char repl) {
    if (r < 0 || r >= g.length || c < 0 || c >= g[0].length) return;
    if (g[r][c] != target || target == repl) return;
    g[r][c] = repl;
    for (int[] d : DIRS) flood(g, r + d[0], c + d[1], target, repl);
}

static int shortest(char[][] g, int[] start, int[] goal) {
    Deque<int[]> q = new ArrayDeque<>();
    boolean[][] seen = new boolean[g.length][g[0].length];
    q.offer(start); seen[start[0]][start[1]] = true;
    for (int steps = 0; !q.isEmpty(); steps++)
        for (int i = q.size(); i > 0; i--) {
            int[] cur = q.poll();
            if (cur[0] == goal[0] && cur[1] == goal[1]) return steps;
            for (int[] d : DIRS) {
                int nr = cur[0] + d[0], nc = cur[1] + d[1];
                if (nr < 0 || nr >= g.length || nc < 0 || nc >= g[0].length) continue;
                if (seen[nr][nc] || g[nr][nc] == '#') continue;
                seen[nr][nc] = true;              // mark on push
                q.offer(new int[]{nr, nc});
            }
        }
    return -1;
}

static void rotate90(int[][] g) {
    int n = g.length;
    for (int r = 0; r < n; r++)
        for (int c = r + 1; c < n; c++) {         // only c > r
            int t = g[r][c]; g[r][c] = g[c][r]; g[c][r] = t;
        }
    for (int[] row : g) {
        for (int i = 0, j = n - 1; i < j; i++, j--) {
            int t = row[i]; row[i] = row[j]; row[j] = t;
        }
    }
}`,
    cpp: `int rows = grid.size(), cols = rows ? grid[0].size() : 0;
const int DR[4] = {-1, 1, 0, 0}, DC[4] = {0, 0, -1, 1};

vector<vector<int>> g(rows, vector<int>(cols, 0));
// For hot loops, one flat vector is kinder to the cache:
// vector<int> flat(rows * cols);  and index it as flat[r * cols + c]

void flood(vector<vector<char>>& g, int r, int c, char target, char repl) {
    if (r < 0 || r >= (int)g.size() || c < 0 || c >= (int)g[0].size()) return;
    if (g[r][c] != target || target == repl) return;
    g[r][c] = repl;
    for (int k = 0; k < 4; ++k) flood(g, r + DR[k], c + DC[k], target, repl);
}

int shortest(vector<vector<char>>& g, pair<int,int> s, pair<int,int> goal) {
    int R = g.size(), C = g[0].size();
    vector<vector<char>> seen(R, vector<char>(C, 0));
    queue<pair<int,int>> q; q.push(s); seen[s.first][s.second] = 1;
    for (int steps = 0; !q.empty(); ++steps)
        for (int i = q.size(); i > 0; --i) {
            auto [r, c] = q.front(); q.pop();
            if (make_pair(r, c) == goal) return steps;
            for (int k = 0; k < 4; ++k) {
                int nr = r + DR[k], nc = c + DC[k];
                if (nr < 0 || nr >= R || nc < 0 || nc >= C) continue;
                if (seen[nr][nc] || g[nr][nc] == '#') continue;
                seen[nr][nc] = 1;
                q.push({nr, nc});
            }
        }
    return -1;
}`,
    js: `const rows = grid.length, cols = grid[0]?.length ?? 0;
const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];

// Array(rows).fill([]) shares ONE row. This does not.
const g = Array.from({ length: rows }, () => new Array(cols).fill(0));

function* neighbours(r, c) {
  for (const [dr, dc] of DIRS) {
    const nr = r + dr, nc = c + dc;
    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) yield [nr, nc];
  }
}

function shortest(grid, start, goal) {
  const seen = new Set([start.join(",")]);
  const q = [start];
  let head = 0, steps = 0;                     // shift() is O(n); index instead
  while (head < q.length) {
    for (let i = q.length - head; i > 0; i--) {
      const [r, c] = q[head++];
      if (r === goal[0] && c === goal[1]) return steps;
      for (const [nr, nc] of neighbours(r, c)) {
        const key = nr + "," + nc;
        if (seen.has(key) || grid[nr][nc] === "#") continue;
        seen.add(key);                          // mark on push
        q.push([nr, nc]);
      }
    }
    steps++;
  }
  return -1;
}

function rotate90(g) {
  const n = g.length;
  for (let r = 0; r < n; r++)
    for (let c = r + 1; c < n; c++) [g[r][c], g[c][r]] = [g[c][r], g[r][c]];
  g.forEach(row => row.reverse());
}`,
  },
  codecap: "One direction list, one bounds check, and the knowledge that a grid was a graph the whole time.",

  q: [
    ["What does grid[r][c] mean, and why is getting it backwards so hard to catch?", "It is row r, then column c inside that row. On a square grid the swapped version still runs and still returns a value, just the wrong one, so it survives every test until a rectangular input appears."],
    ["Why is [[0]*cols]*rows wrong?", "It stores one row object rows times, so all rows are the same object and writing to one writes to all. It is the aliasing rule from the memory page, in grid form."],
    ["Why keep the four directions in a list instead of writing four branches?", "Four branches means four bounds checks written by hand, and one of them will be wrong. One list plus one loop means one bounds check that is either right or wrong everywhere, which is far easier to see."],
    ["Why is a missing bounds check worse in Python than in Java?", "Java throws. Python treats a negative index as counting from the end, so it returns a real cell from the opposite side of the grid and your algorithm continues with a plausible wrong value."],
    ["How do you rotate a square matrix 90 degrees in place?", "Transpose it, swapping grid[r][c] with grid[c][r] only where c > r, then reverse each row. O(1) extra space and no spiral reasoning required."],
    ["In what sense is a grid already a graph?", "Each cell is a node and each legal move is an edge, and the coordinates supply the adjacency, so flood fill is DFS and shortest path on an unweighted grid is BFS, with no adjacency list to build."],
  ],

  p: [
    [733, "flood-fill", "Flood Fill, DFS with no graph in sight", "E"],
    [200, "number-of-islands", "Number of Islands, the canonical grid DFS", "M"],
    [48, "rotate-image", "Rotate Image, transpose then reverse", "M"],
    [54, "spiral-matrix", "Spiral Matrix, four boundaries at once", "M"],
    [73, "set-matrix-zeroes", "Set Matrix Zeroes, O(1) space if you are cunning", "M"],
    [994, "rotting-oranges", "Rotting Oranges, multi-source BFS", "M"],
    [79, "word-search", "Word Search, DFS with backtracking on a grid", "M"],
  ],
},

/* ==================================================================== */
{
  id: "strings",
  n: "Strings & immutability",
  group: "Fundamentals",
  one: "Where strings are <b>immutable</b> (Python, Java, JS, C#, Go), every <code>+=</code> silently builds a whole new copy, so a loop of concatenations is secretly <b>O(n²)</b>. Collect the pieces, join once.",

  plain: `<p>A string looks like an array of characters, and for reading it behaves like one: <code>s[3]</code> is O(1) and you can loop over it. In most languages the difference is that you cannot <b>change</b> it: <code>s[0] = 'x'</code> is an error, not a slow operation. (C++ <code>std::string</code> and Java's <code>StringBuilder</code> are the deliberate exceptions. They are mutable buffers, which is exactly why they exist.)</p>
<p>So in an immutable-string language, what does <code>s += "b"</code> do? It creates an entirely new string, copies the old contents in, appends 'b', and points <code>s</code> at the new object. The old one is thrown away. Do that in a loop and step <i>i</i> copies <i>i</i> characters, the total is 1+2+3+…+n, which is n²/2.</p>
<p><b>Analogy.</b> A printed page. To "add a word" you do not scribble on it. You reprint the whole page with the extra word. Reprinting once is fine. Reprinting after every single word is how a 10-second solution becomes a timeout.</p>`,

  why: [
    { t: "Immutable means replaced, never edited",
      d: "In most languages a string cannot be changed after it is made. <code>s += \"b\"</code> does not add a character. It builds a <b>brand new string</b>, copies the old one into it, and points your variable at the new one." },
    { t: "Languages do this on purpose",
      d: "If the contents can never change, the hash can be computed once and remembered, which is what lets a string be a <b>map key</b>. It is also safe to share between variables and threads with no copying and no locking." },
    { t: "So building in a loop is quietly O(n²)",
      d: "Step 1 copies 1 character, step 2 copies 2, step 3 copies 3. The total is 1+2+3+…+n = about <b>n²/2</b>. A loop that looks perfectly linear is not. This is the most common hidden timeout in string problems." },
    { t: "The fix is to join once at the end",
      d: "Collect the pieces in a list, then join them in one go. Joining measures the total length, allocates <b>one</b> buffer, and copies each character <b>once</b> → <b>O(n)</b>." },
    { t: "Most string questions reduce to a canonical form",
      d: "Two words are anagrams exactly when their letter counts match. So turn each word into one canonical key, its sorted letters, or its letter counts, and group by that key in a map. That is the whole \"group anagrams\" family, derived rather than memorised." },
  ],

  variants: [
    { n: "Naive scan", cost: "O(n \u00b7 m) worst \u00b7 O(1) space",
      idea: "Try to match the pattern at every position. Restart from scratch after every mismatch.",
      when: "Short patterns, or a one-off. It is what your language's built-in find often does, and it is usually fine.",
      watch: "The worst case is real: a haystack of <code>aaaa...</code> with a needle of <code>aaab</code> re-reads almost everything, every time." },

    { n: "KMP", cost: "O(n + m) \u00b7 O(m) space",
      idea: "Precompute, for every prefix of the pattern, the longest proper prefix that is also a suffix. On a mismatch that table says how far you may jump without missing a match, so the haystack pointer never moves backwards.",
      when: "Guaranteed linear substring search, and any problem about the periodicity of a string.",
      watch: "The prefix table is the whole difficulty and is easy to be off by one in. Test it against the pattern <code>aabaaab</code> before trusting it. It is derived, drawn and written out on the string search page." },

    { n: "Rabin-Karp", cost: "O(n + m) average \u00b7 O(n \u00b7 m) worst",
      idea: "Hash the pattern, then roll a hash along the text so each window costs O(1) to update. Compare hashes, and only compare characters when they collide.",
      when: "Searching for many patterns at once, or detecting duplicate substrings, where hashing many windows is the point.",
      watch: "Hash collisions mean you must verify a real match, or accept being wrong. An adversarial input can force a collision every time, which is where the worst case comes from." },

    { n: "Z-algorithm", cost: "O(n + m) \u00b7 O(n) space",
      idea: "For each position, compute the length of the longest substring starting there that is also a prefix of the whole string. Concatenate pattern, a separator, then text, and matches fall out of the table.",
      when: "You want KMP's guarantee with a table that is easier to reason about, or the problem is about prefixes directly.",
      watch: "The separator must be a character that appears in neither string, or the answer bleeds across the join." },

    { n: "Expand around centre", cost: "O(n\u00b2) time \u00b7 O(1) space",
      idea: "For palindromes: every palindrome has a centre, so try all 2n-1 centres (each character, and each gap between characters) and expand outwards while the ends match.",
      when: "Longest palindromic substring, counting palindromic substrings. It is the answer expected in interviews.",
      watch: "There are two kinds of centre, odd and even. Forgetting the gaps loses every even-length palindrome, and the bug looks like an off-by-one." },

    { n: "Manacher", cost: "O(n) \u00b7 O(n) space",
      idea: "Expand around centre, but reuse the work already done inside a previously found palindrome instead of starting each expansion cold.",
      when: "Rarely, honestly. Know it exists so you can name it as the linear alternative when asked.",
      watch: "Nobody expects you to write it under time pressure. Say what it does and offer expand-around-centre." },
  ],

  hing: `<p><b>String immutable hai, matlab kya?</b> Zyaadatar languages mein (Python, Java, JS, C#) ek baar bani string badal nahi sakti. (C++ ki <code>std::string</code> aur Java ka <code>StringBuilder</code> jaan-boojh kar mutable hain, isiliye to woh bane hain.) <code>s[0] = 'x'</code> error deta hai. Padhna sab allowed hai, likhna kuch bhi nahi.</p>
<p><b>Phir <code>s += "b"</code> kya karta hai?</b> Woh purani string ko badalta nahi. Ek <b>naya object</b> banata hai, poori purani string usme copy karta hai, aur phir 'b' lagata hai. Purani cheez kachre mein.</p>
<p><b>Ab loop mein socho.</b> Pehla step 1 char copy, doosra 2, teesra 3… n-va n. Total = n(n+1)/2 = <b>O(n²)</b>. Code dekhne mein ek simple loop lagta hai, par andar se n² hai. n = 1 lakh par yeh 5 arab character copies. TLE pakka. <b>Yeh interview ka sabse chupa hua bug hai.</b></p>
<p><b>Sahi tarika:</b> tukde ek <b>list</b> mein daalo (list mutable hai, append O(1)), aur last mein <code>"".join(parts)</code>. join pehle total length nikaalta hai, <b>ek hi baar</b> memory leta hai, har char <b>ek hi baar</b> copy hota hai → <b>O(n)</b>.</p>
<p><b>Immutable rakha hi kyun?</b> Kyunki tabhi string <b>dict ki key</b> ban sakti hai. Hash ek baar calculate karke cache ho jaata hai. Agar string badal sakti, to key ka hash badal jaata aur dictionary ka data kho jaata. Yeh feature hai, bug nahi.</p>
<p><b>Anagram problems ka asli funda:</b> do strings anagram hain agar dono ke character counts same hon. To har string ka ek <b>canonical form</b> banao, <code>sorted(s)</code> ya 26-size count tuple, aur usi ko hash map ki key bana do. Group Anagrams ka poora solution bas yahi hai.</p>`,

  viz: ["string-immutable"],
  see: [["DOC", "https://docs.python.org/3/library/stdtypes.html#text-sequence-type-str", "Python docs, str methods"]],

  math: [
    { t: "The quadratic hiding inside a one-line loop", d: "Each += builds a whole new string, so the cost of step i is the length so far. Add those up and the loop is not linear at all.", w:
`s = ""
for i in 1..n:  s += "x"      # each += copies everything

characters copied = 1 + 2 + 3 + ... + n = n(n+1)/2

n = 1,000        500,500
n = 100,000      5 x 10^9      seconds
n = 1,000,000    5 x 10^11     do not` },
    { t: "Join once and the sum collapses", d: "Collect the pieces in a list, which appends in amortised constant time, then walk the list once and allocate the result a single time.", w:
`parts = []
for i in 1..n: parts.append("x")    # n appends, amortised O(1)
"".join(parts)                      # one pass, n characters

total: n + n = 2n

n = 100,000:  200,000 operations instead of 5 x 10^9
the same output, about 25,000x apart` },
    { t: "Substrings, counted, which is why brute force dies early", d: "The count is quadratic and the total length is cubic, so enumerating substrings is affordable only on very small n.", w:
`a string of length n has n(n+1)/2 non-empty substrings

n = 1,000      500,500        fine
n = 10,000     5 x 10^7       borderline
n = 100,000    5 x 10^9       no

and materialising them all copies
  1x1 + 2x2 + ... = n(n+1)(n+2)/6  ~  n^3/6 characters` },
    { t: "Anagram and palindrome checks, priced against each other", d: "The sorting answer is the one everyone reaches for first. Counting is strictly better whenever the alphabet is small, which in interviews it always is.", w:
`n = string length, k = alphabet size (26 for lowercase)

sort both, compare    O(n log n) time, O(n) space
count both, compare   O(n) time,       O(k) space
one count array, +/-  O(n) time,       O(k) space, one pass

n = 10^5:  1.7 x 10^6 comparisons  vs  2 x 10^5 increments` },
  ],

  costs: [
    ["s[i]", "O(1)", "contiguous, like an array"],
    ["s += t inside a loop", "O(n²) total", "each step copies everything before it, the classic trap"],
    ["\"\".join(list)", "O(n)", "one allocation, each char copied once"],
    ["s1 == s2", "O(n) worst", "length check first, so unequal lengths are O(1)"],
    ["sorted(s)", "O(k log k)", "anagram canonical key"],
    ["character count map", "O(k)", "frequency key, cheaper than sorting"],
    ["s in big_string", "O(n·m) worst", "substring search; O(n+m) with KMP"],
  ],

  traps: [
    "<b>Building output with += in a loop.</b> The single most common hidden O(n²) in string problems. Always accumulate into a list.",
    "<b>Slicing in a recursion.</b> <code>helper(s[1:])</code> copies the string at every level → O(n²). Pass an index instead.",
    "<b>Assuming 26 lowercase letters.</b> Ask about Unicode, digits, spaces, and case before hard-coding <code>[0]*26</code>.",
    "<b>Reversing with a loop.</b> <code>s[::-1]</code> is O(n) and one line; a manual char-by-char build is O(n²).",
  ],

  impl: [
    ["Python", "str (immutable) · list + \"\".join()", "+= in a loop is O(n²). Build a list, join once."],
    ["Java", "String (immutable) · StringBuilder", "StringBuilder IS the mutable buffer, sb.append() then sb.toString()."],
    ["C++", "std::string (MUTABLE)", "s += c really is amortised O(1) here. The trap does not apply. reserve() to avoid regrowth."],
    ["JavaScript", "String (immutable)", "Engines optimise += with ropes, but the safe habit is parts.push(...) then parts.join(\"\")."],
  ],

  code: {
    pseudo: `# Where strings are immutable, "append" means "allocate and copy everything".
# Cost of building n characters one at a time:  1+2+3+...+n = O(n^2)

# WRONG
out <- ""
for c in s:  out <- out + c          # each step copies the whole prefix

# RIGHT, defer the joining
parts <- empty growable list
for c in s:  parts.append(c)         # O(1) each
out <- join(parts)                   # ONE allocation, each char copied once -> O(n)

# Canonical form: two strings are anagrams iff their character counts match
key(s) = sorted(s)                   # O(k log k)
key(s) = countArray(s)               # O(k), cheaper
group words by key(word) in a hash map

# Palindrome in O(1) space, two pointers, no copying
i <- 0; j <- n-1
while i < j:
    if s[i] != s[j]: return false
    i <- i+1; j <- j-1
return true`,
    py: `s = "leetcode"

s[::-1]                       # O(n) reverse
"".join(sorted(s))            # anagram canonical key, O(k log k)
ord('a'), chr(97)             # char <-> int
(ord(c) - ord('a'))           # index 0..25 for lowercase

# WRONG, looks O(n), actually O(n^2)
out = ""
for c in s:
    out += c.upper()

# RIGHT, O(n)
parts = []
for c in s:
    parts.append(c.upper())
out = "".join(parts)

# Frequency map, the backbone of most string problems
from collections import Counter, defaultdict
freq = Counter(s)                       # O(n)
is_anagram = Counter(a) == Counter(b)   # O(n)

# Group anagrams: canonical form -> bucket
groups = defaultdict(list)
for w in words:
    key = tuple(sorted(w))              # or a 26-length count tuple, O(k)
    groups[key].append(w)

# Palindrome check in O(1) space
def is_pal(s):
    i, j = 0, len(s) - 1
    while i < j:
        if s[i] != s[j]: return False
        i += 1; j -= 1
    return True`,
    java: `// String is immutable; StringBuilder is the mutable buffer.
StringBuilder sb = new StringBuilder();
for (char c : s.toCharArray()) sb.append(Character.toUpperCase(c));
String out = sb.toString();              // O(n) overall

// NEVER: out += c inside a loop -> O(n^2)

// Frequency / anagram key
int[] cnt = new int[26];
for (char c : s.toCharArray()) cnt[c - 'a']++;
String key = Arrays.toString(cnt);       // canonical key, O(k)

// Group anagrams
Map<String, List<String>> groups = new HashMap<>();
for (String w : words) {
    char[] ch = w.toCharArray(); Arrays.sort(ch);
    groups.computeIfAbsent(new String(ch), k -> new ArrayList<>()).add(w);
}

// Palindrome, O(1) space
boolean isPal(String s) {
    for (int i = 0, j = s.length()-1; i < j; i++, j--)
        if (s.charAt(i) != s.charAt(j)) return false;
    return true;
}`,
    cpp: `// std::string is MUTABLE, += is amortised O(1), unlike Python/Java/JS.
string out;
out.reserve(s.size());           // still reserve: avoids repeated regrowth
for (char c : s) out += toupper(c);      // O(n) total, genuinely fine here

// Anagram key
array<int,26> cnt{};
for (char c : s) cnt[c - 'a']++;

// Group anagrams
unordered_map<string, vector<string>> groups;
for (auto& w : words) {
    string k = w; sort(k.begin(), k.end());
    groups[k].push_back(w);
}

// Palindrome, O(1) space
bool isPal(const string& s) {
    for (int i = 0, j = (int)s.size()-1; i < j; ++i, --j)
        if (s[i] != s[j]) return false;
    return true;
}`,
    js: `// Strings are immutable, index them, never mutate them.
const parts = [];
for (const c of s) parts.push(c.toUpperCase());
const out = parts.join("");        // O(n)

// Frequency map
const freq = new Map();
for (const c of s) freq.set(c, (freq.get(c) || 0) + 1);

// Anagram key + grouping
const groups = new Map();
for (const w of words) {
  const key = [...w].sort().join("");
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(w);
}

// Palindrome, O(1) space
function isPal(s) {
  let i = 0, j = s.length - 1;
  while (i < j) { if (s[i] !== s[j]) return false; i++; j--; }
  return true;
}`,
  },
  codecap: "join for building, Counter for comparing, two pointers for palindromes, three moves cover most string questions.",

  q: [
    ["Why is a loop of s += c O(n²)?", "Strings are immutable, so each += allocates a new string and copies everything so far. Copies are 1+2+…+n = n(n+1)/2 = O(n²)."],
    ["What exactly makes \"\".join(parts) O(n)?", "It scans once to compute the total length, allocates a single buffer, then copies each character exactly once, no repeated re-copying."],
    ["Why does immutability let a string be a dict key?", "Its hash can be computed once and cached because it can never change. A mutable key would change its hash after insertion and become unfindable."],
    ["Two ways to build an anagram key, and their costs?", "sorted(s) → O(k log k); a 26-length count tuple (or Counter) → O(k). Both give equal keys for anagrams; the count version is faster."],
    ["Why avoid s[1:] in recursion?", "Slicing copies, so an O(n)-deep recursion each copying O(n) becomes O(n²). Pass a start index and slice nothing."],
  ],

  p: [
    [242, "valid-anagram", "Valid Anagram", "E"],
    [125, "valid-palindrome", "Valid Palindrome, two pointers", "E"],
    [49, "group-anagrams", "Group Anagrams, canonical key", "M"],
    [5, "longest-palindromic-substring", "Longest Palindromic Substring, expand from centre", "M"],
    [3, "longest-substring-without-repeating-characters", "Longest Substring Without Repeats", "M"],
  ],
},

/* ==================================================================== */
{
  id: "hashing",
  n: "Hashing, dict & set",
  group: "Fundamentals",
  one: "A hash map <b>computes the address from the key</b> instead of searching for it. That is the entire idea, and it is why \"have I seen this before?\" costs O(1) instead of O(n).",

  plain: `<p>Suppose you must answer "is 47 in this collection?" thousands of times. With a list you scan, O(n) each time. With a sorted array you binary search, O(log n). A hash map does something different in kind: it <b>calculates where 47 would live</b> and looks only there.</p>
<p>The recipe is three steps. Run the key through a hash function to get a big integer. Take that number modulo the table size to get a slot. Use the slot directly. No comparisons with other keys, no scanning. Insert, lookup and delete are all one computation → O(1) average.</p>
<p><b>Analogy.</b> A library where a book's shelf is <i>derived from its title</i> by a fixed rule, instead of being recorded in a catalogue. You never search the catalogue. You apply the rule and walk straight to the shelf. Occasionally two books land on the same shelf (a <b>collision</b>), so you glance through the two or three books there. Keep the library big enough and that glance is always tiny.</p>`,

  why: [
    { t: "Arrays are already O(1), but only for integer indices",
      d: "<code>a[5]</code> is instant, because 5 <i>is</i> the address. Names, words and tuples get no such luck and fall back to scanning. So the question is: can we turn any key into an integer?" },
    { t: "A hash function is that translator",
      d: "<code>hash(key)</code> turns any key into a big number, always the same number for the same key. Take it modulo the table size and you have a slot number. The key now <b>computes its own address</b>. Nothing is searched." },
    { t: "Collisions are guaranteed, so plan for them",
      d: "There are unlimited possible keys and a limited number of slots, so two keys must eventually land on the same one. A hash table is therefore never just a hash function. It is a hash function <b>plus</b> a plan for collisions: keep a small list in each slot." },
    { t: "Keep the table roomy and those lists stay tiny",
      d: "Once the table is about two-thirds full it allocates a bigger one and re-files everything. That resize is O(n), but it happens rarely, so inserts stay <b>O(1) amortised</b>, the same doubling trick as a growable array." },
    { t: "Which is why it is O(1) average, not O(1) always",
      d: "If every key collided, one slot would hold everything and a lookup would be a scan: <b>O(n)</b>. That never happens by accident, but say the distinction out loud. It is a standard follow-up." },
    { t: "Keys must be immutable, and now you know why",
      d: "The slot comes from the contents. Change the contents after inserting and the entry is sitting in the wrong slot, unreachable. That is the whole reason a list cannot be a key and a tuple can." },
  ],

  variants: [
    { n: "Seen set", cost: "O(1) average per check",
      idea: "The simplest use and the most common: has this been encountered before.",
      when: "Duplicate detection, cycle detection, visited marking in a traversal.",
      watch: "Using a list instead of a set here is the single most common accidental O(n squared) in interviews." },

    { n: "Complement lookup", cost: "O(n) for the whole pass",
      idea: "While scanning, ask whether the thing that would complete the answer has already gone past. Two Sum is the archetype.",
      when: "Pair or subarray questions where a target relates two values.",
      watch: "Store the value AFTER checking for its complement, or an element pairs with itself." },

    { n: "Canonical key grouping", cost: "O(n · k) for k-length keys",
      idea: "Map each item to a normalised form and bucket by that. Sorted letters for anagrams, a count tuple, a shape signature.",
      when: "Grouping things that are equivalent under some transformation.",
      watch: "The key must be immutable and must compare by value, so tuples and strings, not lists." },

    { n: "Prefix or rolling hash", cost: "O(1) per substring after O(n) setup",
      idea: "Hash every prefix so any substring's hash is a difference, or roll a window hash forward in constant time.",
      when: "Comparing many substrings, detecting repeated blocks, Rabin-Karp search.",
      watch: "Collisions are possible, so verify a real match unless you accept being probably right. See the string search subtopics." },

    { n: "LRU cache, hash map plus doubly linked list", cost: "O(1) get and put",
      idea: "The map finds a node instantly; the list keeps usage order so the least recent is always at the tail. Every access unlinks its node and relinks it at the head.",
      when: "The classic design question, and the actual structure behind most caches.",
      watch: "A singly linked list will not do, because unlinking a node in O(1) needs its predecessor. That requirement is the entire reason the list is doubly linked, and it is what the question is really testing. See the LRU cache page for the whole structure." },
  ],

  hing: `<p><b>Hash map ka core idea ek line mein:</b> key ko <b>dhoondte nahi</b>, key se address <b>nikaalte</b> hain.</p>
<p><b>Kaise?</b> <code>hash(key)</code> se ek bada number banao, phir <code>% table_size</code> se usse chhota index banao. Bas, us index par seedha jao. Na koi comparison, na koi scan. Isliye insert / lookup / delete sab <b>O(1) average</b>.</p>
<p><b>Collision kya hai, aur hota hi kyun hai?</b> Keys infinite, slots limited. To do keys ka same slot par aana <b>mathematically pakka</b> hai (pigeonhole principle). Isliye hash table = hash function + <b>collision ka plan</b>. Plan: us slot par ek chhoti list rakho (chaining), aur table ko hamesha thoda khaali rakho (load factor ~2/3 se kam) taaki har list ~1 lambi rahe.</p>
<p><b>To O(1) jhooth hai?</b> Nahi, par adhoora hai. Sach yeh hai: <b>average O(1), worst case O(n)</b>. Agar saari keys ek hi slot par aa jaayein to woh list ban jaati hai aur scan karna padta hai. Interview mein yeh khud se bolo, interviewer isi follow-up ka intezaar kar raha hota hai.</p>
<p><b>List key kyun nahi ban sakti?</b> Kyunki address contents se banta hai. List badal gayi to hash badal gaya, aur entry galat slot mein reh gayi, hamesha ke liye gum. Isliye sirf <b>immutable</b> cheezein keys ban sakti hain: string, number, tuple.</p>
<p><b>Problem mein kab pakadna hai?</b> Jab bhi sawaal mein aaye, "pehle dekha hai kya?", "kitni baar aaya?", "pair banao", "group karo", <b>turant dict/set socho</b>. Tum O(n) extra memory de rahe ho aur badle mein time se poora ek factor of n hata rahe ho. Two Sum ka O(n²) → O(n) bilkul yahi trade hai.</p>`,

  viz: ["hashmap"],
  see: [["VA", "https://visualgo.net/en/hashtable", "VisuAlgo, hash table with collisions, animated"]],

  math: [
    { t: "The average case, and the number it depends on", d: "The chain length is the load factor, nothing else. So O(1) is not a property of hashing, it is a property of keeping the table roomy.", w:
`n keys, b buckets, load factor a = n / b
expected chain length = a
one lookup = hash + a comparisons on average

n = 1,000, b = 1,333   a = 0.75  ->  0.75 comparisons
n = 1,000, b = 16      a = 62.5  ->  62.5 comparisons

same keys, same hash function, same code` },
    { t: "Resizing is the doubling sum, again", d: "Every resize rehashes the entire table. Adding those up over the life of the map gives the same geometric series a growable array gives.", w:
`double b whenever n passes 0.75 b
rehash cost at each doubling: the whole table

1 + 2 + 4 + ... + n  <  2n rehashes over n inserts
per insert: amortised O(1)
one unlucky insert: O(n), because it rehashed everything` },
    { t: "Open addressing: the probe count explodes near the end", d: "With no chains, a full-ish table has to walk to find a free slot, and the walk length is not linear in how full it is.", w:
`expected probes, linear probing, successful lookup:
    (1 + 1/(1 - a)) / 2

a = 0.50   ->   1.5 probes
a = 0.75   ->   2.5
a = 0.90   ->   5.5
a = 0.99   ->  50.5

which is why every implementation resizes well before full` },
    { t: "The worst case is a real attack, not a footnote", d: "If every key lands in one bucket the map has quietly become a linked list, and an adversary who knows your hash function can arrange exactly that.", w:
`n keys, all colliding:
  lookup    O(n)
  n inserts 1 + 2 + ... + n = n^2 / 2

n = 100,000  ->  5 x 10^9 comparisons

so Python and Java randomise the seed per process, and
Java converts a bucket to a tree past 8 entries: O(log n)` },
    { t: "Collisions arrive far earlier than the table size suggests", d: "The birthday bound says you should expect the first collision at around the square root of the space, not at the space itself.", w:
`first collision likely at about sqrt(b) keys

b = 365          ->  23 people
b = 2^32         ->  77,000 keys
b = 2^64         ->  5 x 10^9 keys

so collision handling is never an optimisation to skip` },
  ],

  costs: [
    ["d[k] lookup / insert / delete", "O(1) average", "one hash computation plus a tiny bucket"],
    ["worst case, all keys collide", "O(n)", "the bucket degenerates into a list"],
    ["k in my_set", "O(1) average", "vs O(n) for k in my_list, the swap that fixes most O(n²)"],
    ["building a dict of n items", "O(n) average", "includes the amortised rehash on growth"],
    ["iterating a hash map", "O(n)", "insertion-ordered in Python/JS; UNORDERED in Java HashMap and C++ unordered_map"],
    ["memory", "O(n)", "roughly 2–3× the raw data, the price of the speed"],
  ],

  traps: [
    "<b>Using a list where a set belongs.</b> <code>if x in seen_list</code> inside a loop is O(n²). One word of change, a set, makes it O(n).",
    "<b>Mutating a key after insertion.</b> Tuples containing lists are unhashable for exactly this reason; do not fight it.",
    "<b>Assuming dict order is sorted.</b> It is <i>insertion</i> order. Need sorted output? That costs O(n log n).",
    "<b>Claiming O(1) worst case.</b> It is O(1) average, O(n) worst, interviewers probe this deliberately.",
    "<b>Forgetting the memory cost.</b> If the interviewer says 'O(1) space', a hash map is off the table, reach for two pointers or sorting.",
  ],

  impl: [
    ["Python", "dict · set · Counter · defaultdict", "Insertion-ordered. Only immutable keys, tuples yes, lists no."],
    ["Java", "HashMap · HashSet · getOrDefault / computeIfAbsent", "UNORDERED. Custom keys must override BOTH equals() and hashCode()."],
    ["C++", "unordered_map · unordered_set", "UNORDERED and O(1) average. map/set are ordered TREES at O(log n), pick deliberately."],
    ["JavaScript", "Map · Set", "Prefer Map over a plain object: object keys are coerced to strings and inherit prototype keys."],
  ],

  code: {
    pseudo: `# The mechanism, independent of language:
#     slot = hash(key) mod tableSize          -> ONE computation, not a search
#     collisions are unavoidable (pigeonhole) -> keep a tiny bucket per slot
#     load factor kept < ~2/3                 -> buckets stay ~1 long
#     table full -> allocate double, rehash   -> O(n) rarely, O(1) amortised

# The four shapes almost every hash solution takes:
seen   : set                # "have I met this before?"
freq   : key -> count       # "how many times?"
groups : key -> list        # "bucket these together"
index  : value -> position  # "where did I see it?"

# Two Sum, O(n^2) -> O(n): remember what has already gone past
pos <- empty map
for i, x in a:
    if (target - x) in pos: return (pos[target - x], i)
    pos[x] <- i`,
    py: `from collections import Counter, defaultdict

# --- the four everyday shapes -------------------------------------
seen  = set()                    # membership: "have I met this?"
freq  = Counter(nums)            # counting:   value -> how many
graph = defaultdict(list)        # grouping:   key -> list of things
index = {}                       # position:   value -> where I saw it

# Two Sum: O(n^2) -> O(n) by remembering what has already gone past
def two_sum(nums, target):
    pos = {}                          # value -> index
    for i, x in enumerate(nums):
        if target - x in pos:         # O(1), the complement already passed
            return [pos[target - x], i]
        pos[x] = i
    return []

# Group by a canonical key, the whole "group anagrams" family
groups = defaultdict(list)
for w in words:
    groups[tuple(sorted(w))].append(w)

graph[u].append(v)               # defaultdict: no KeyError, no setdefault
Counter(nums).most_common(k)     # top-k by frequency in one line

a, b = set(x), set(y)
a & b, a | b, a - b              # intersection, union, difference`,
    java: `Map<Integer,Integer> pos = new HashMap<>();
Set<Integer> seen = new HashSet<>();

// Two Sum in O(n)
int[] twoSum(int[] a, int target) {
    Map<Integer,Integer> pos = new HashMap<>();
    for (int i = 0; i < a.length; i++) {
        Integer j = pos.get(target - a[i]);
        if (j != null) return new int[]{j, i};
        pos.put(a[i], i);
    }
    return new int[]{};
}

// Counting and grouping without null checks
freq.merge(x, 1, Integer::sum);                       // count
groups.computeIfAbsent(key, k -> new ArrayList<>()).add(w);
int c = freq.getOrDefault(x, 0);

// Custom key in a HashMap? Override equals() AND hashCode(),
// or use a record / List<Integer> which already do.`,
    cpp: `unordered_map<int,int> pos;
unordered_set<int> seen;

// Two Sum in O(n)
vector<int> twoSum(vector<int>& a, int target) {
    unordered_map<int,int> pos;
    for (int i = 0; i < (int)a.size(); ++i) {
        auto it = pos.find(target - a[i]);
        if (it != pos.end()) return {it->second, i};
        pos[a[i]] = i;
    }
    return {};
}

freq[x]++;                       // default-constructs to 0 first
groups[key].push_back(w);
if (seen.count(x)) { ... }       // or seen.contains(x) in C++20

// map<K,V> is an ordered tree: O(log n), iterates in sorted order.
// unordered_map is the hash table: O(1) average. Choose on purpose.`,
    js: `const pos = new Map(), seen = new Set();

// Two Sum in O(n)
function twoSum(a, target) {
  const pos = new Map();
  for (let i = 0; i < a.length; i++) {
    if (pos.has(target - a[i])) return [pos.get(target - a[i]), i];
    pos.set(a[i], i);
  }
  return [];
}

// Counting and grouping
freq.set(x, (freq.get(x) || 0) + 1);
if (!groups.has(key)) groups.set(key, []);
groups.get(key).push(w);

// Objects/arrays as Map keys compare by REFERENCE, not by contents.
// Serialise the key first:  map.set(JSON.stringify([r, c]), v)`,
  },
  codecap: "seen / freq / graph / index, nearly every hash-map solution is one of these four shapes.",

  q: [
    ["In one sentence, why is a hash map O(1)?", "It computes the slot from the key instead of searching for it, one hash plus a modulo lands directly on the address."],
    ["Why are collisions unavoidable?", "Keys are unbounded, slots are finite, so by the pigeonhole principle two keys must eventually share a slot. A hash table must therefore include a collision strategy."],
    ["What is the load factor and why does it matter?", "items ÷ slots. Kept under ~2/3 so buckets stay about one item long. Exceeding it triggers an O(n) resize and rehash, amortised to O(1) per insert."],
    ["What is the true worst case, and what causes it?", "O(n) per operation, when all keys land in one bucket. Runtimes defend against it, Python randomises string hashing per process, Java turns a long bucket into a balanced tree."],
    ["Why can't a list be a dict key?", "The slot is derived from the contents; if they change, the hash changes and the entry becomes unreachable. Only immutable objects are hashable."],
    ["What does a hash map cost you?", "O(n) extra memory. If the problem demands O(1) space, use two pointers or sorting instead."],
  ],

  p: [
    [1, "two-sum", "Two Sum, the canonical hash trade", "E"],
    [217, "contains-duplicate", "Contains Duplicate", "E"],
    [242, "valid-anagram", "Valid Anagram", "E"],
    [49, "group-anagrams", "Group Anagrams", "M"],
    [128, "longest-consecutive-sequence", "Longest Consecutive Sequence, O(n) with a set", "M"],
    [560, "subarray-sum-equals-k", "Subarray Sum = K, prefix sum + hash", "M"],
  ],
},

/* ==================================================================== */
{
  id: "ordering",
  n: "Equality, ordering and comparators",
  group: "Fundamentals",
  one: "Two objects are equal because you said so, and a hash map believes you. Break the equals and hash agreement and your key vanishes into a map that is still holding it.",

  plain: `<p>Three questions look similar and are not: are these the same object, are they equal, and which one comes first. Languages answer them with different operators, and disagreeing with your language about which question you asked is a fine way to spend an afternoon.</p>
<p><b>Identity</b> asks whether two names point at one object. <b>Equality</b> asks whether two objects have the same contents. For built-in values the distinction rarely bites. For your own types it decides whether a hash set can find them at all.</p>
<p>Then there is <b>ordering</b>, which is what sorting needs. A comparator is a promise about a total order, and the promise has rules. Break them and the standard library is entitled to do anything it likes, up to and including crashing, and C++ takes that entitlement seriously.</p>
<p><b>Analogy.</b> Two identical twins. Same appearance, so equal. Different people, so not identical. If the school files them by appearance alone, one of them is going to get the other's report card.</p>`,

  why: [
    { t: "The two questions are different, so there are two operators", d: "Identity compares addresses and is always O(1). Equality compares contents and costs whatever that takes. When a language uses the same symbol for both, it has quietly chosen one for you. <code>==</code> on Java objects compares addresses. That is why two strings built at runtime can hold the same letters and still fail <code>==</code>." },
    { t: "A hash map asks the hash first and equality second", d: "Look-up computes the hash to find a bucket, then uses equality to pick the right entry inside it. So the two must agree: <b>equal objects must produce the same hash</b>. If they do not, the map searches the wrong bucket, finds nothing, and reports that your key is absent while holding it a few slots away. This is the contract, and it is the reason it exists." },
    { t: "The reverse is not required, and cannot be", d: "Unequal objects may share a hash. They have to: there are unlimited possible values and a fixed number of hashes. That is why the map still runs an equality check after finding the bucket, and why a hash on its own is never proof of equality." },
    { t: "And this is why keys must be immutable", d: "The bucket is chosen from the contents. Mutate a key after inserting it and its hash changes, so it is now filed under an address nobody will look at. The entry is not deleted, it is unreachable, which is worse: it still occupies the map and still turns up when you iterate. Immutability is not a purity preference here, it is the only way the mechanism holds together." },
    { t: "Ordering is a third question with its own rules", d: "A comparator must be a genuine total order: consistent (a before b implies b never before a), transitive, and honest about ties. Return a boolean where a three-way answer is expected, or claim both a &lt; b and b &lt; a, and you have not merely produced odd output. C++ calls it undefined behaviour and may run off the end of the array; Java throws \"Comparison method violates its general contract\", generally in production." },
    { t: "Sorting by two keys is where stability quietly matters", d: "Sort by the secondary key, then by the primary, and a <b>stable</b> sort keeps the first ordering intact inside each group. With an unstable sort, the same code is right on small inputs and wrong on large ones. Whether it reorders equal items depends on what the algorithm is doing internally, which changes with size. Alternatively, compare both keys in one comparator and stop depending on a property your language may not have." },
  ],

  hing: `<p><b>Teen sawaal alag hain, aur log unhe ek hi samajh lete hain:</b> kya yeh <b>ek hi</b> object hai, kya yeh <b>barabar</b> hai, aur <b>pehle kaun</b> aayega. Teeno ka jawab alag ho sakta hai.</p>
<p><b>Identity</b> do addresses compare karta hai, hamesha O(1). <b>Equality</b> andar ka content compare karta hai. Java mein <code>==</code> objects par <b>address</b> compare karta hai, isliye do alag-alag bani strings barabar hote hue bhi <code>==</code> mein false dete hain. Isiliye <code>.equals()</code> use karna hai.</p>
<p><b>Ab asli baat, hash map kaam kaise karta hai:</b> pehle <b>hash</b> se bucket dhoondta hai, phir us bucket ke andar <b>equality</b> se sahi entry chunta hai. Matlab dono mein <b>samjhauta</b> hona chahiye:</p>
<p><b>Jo objects barabar hain, unka hash bhi ek hona chahiye.</b> Aisa nahi hua to map galat bucket mein dhoondega. Wahan kuch nahi milega, aur woh kahega ki key hai hi nahi. Jabki key uske paas hi padi hai, do slot door. Yeh sabse chidhane wala bug hai kyunki code bilkul sahi dikhta hai.</p>
<p><b>Ulta zaroori nahi hai:</b> alag objects ka hash same ho sakta hai, aur hoga hi, kyunki values infinite hain aur hashes limited. Isiliye bucket milne ke <b>baad</b> bhi equality check hoti hai.</p>
<p><b>Aur isiliye keys immutable honi chahiye.</b> Bucket contents se decide hota hai. Key ko daalne ke baad badal do, to uska hash badal gaya, aur ab woh aisi jagah padi hai jahan koi dhoondne nahi jaayega. Woh delete nahi hui, bas <b>pahunch se bahar</b> ho gayi, jo delete hone se zyada buri baat hai kyunki iterate karne par ab bhi dikhegi.</p>
<p><b>Comparator ke apne niyam hain.</b> Woh ek <b>sachcha total order</b> hona chahiye: consistent, transitive, aur ties ke baare mein imaandaar. Agar tumne dono ko ek doosre se chhota bata diya, to C++ ise <b>undefined behaviour</b> maanta hai aur array ke bahar chala ja sakta hai. Java "Comparison method violates its general contract" phenk deta hai, aksar production mein.</p>
<p><b>Do keys par sort:</b> pehle chhoti key, phir badi. <b>Stable</b> sort pehla order har group ke andar bacha leta hai. Par agar sort stable nahi hai (C++ ka <code>sort</code>), to yeh code chhote input par sahi aur bade input par galat chalega. Sabse safe: ek hi comparator mein dono keys compare kar lo aur stability par bharosa hi mat rakho.</p>`,

  viz: ["ordering"],
  see: [["DOC", "https://docs.oracle.com/javase/8/docs/api/java/lang/Object.html#hashCode--", "The equals and hashCode contract, stated formally"]],

  math: [
    { t: "One direction of the contract is required, the other is impossible", d: "Equal objects must hash the same. Equal hashes cannot imply equal objects, and the reason is a counting argument, not an implementation detail.", w:
`required:      a equals b   =>   hash(a) == hash(b)
not required:  hash(a) == hash(b)   =>   a equals b

why the second cannot hold:
  hashes:  2^32 distinct values
  objects: unbounded
pigeonhole: some distinct objects must share a hash` },
    { t: "What a mutated key costs, traced through the buckets", d: "The map stored the entry by the hash it had at insertion time. Change the field and you are looking in a different bucket for something that never moved.", w:
`b = 16 buckets

put(key, v):   hash(key) = 7    ->  bucket 7 mod 16 = 7
mutate a field used by hash()
get(key):      hash(key) = 41   ->  bucket 41 mod 16 = 9

bucket 9 is empty. The entry is still sitting in bucket 7.
size() = 1 and get() = null, at the same time.` },
    { t: "The comparator subtraction that returns the wrong sign", d: "Returning a difference is the classic shortcut and it is correct for small values. The two extremes of the range are where it inverts.", w:
`return a.x - b.x;

a.x =  2,000,000,000
b.x = -2,000,000,000
a.x - b.x = 4,000,000,000  >  2^31 - 1

wraps to 4,000,000,000 - 2^32 = -294,967,296

negative means "a is smaller", which is the opposite
Integer.compare branches instead, and cannot overflow` },
    { t: "Two sort keys, and where stability actually earns its keep", d: "Stability means equal elements keep their previous order. That is what lets you sort twice instead of writing one comparator with a tie-break.", w:
`want: score descending, then name ascending

with a stable sort: sort by name, then sort by score
  equal scores keep the name order. Two clean passes.
with an unstable sort: the second pass scrambles the first

comparisons either way, n = 10^6:
  n log2 n = 10^6 x 20 = 2 x 10^7` },
    { t: "The three laws, and the exception that fires when you break them", d: "A comparator that is not a total order does not merely sort oddly. Modern sorts detect the contradiction and refuse to continue.", w:
`for all a, b, c the comparator must satisfy
  antisymmetry   cmp(a,b) = -cmp(b,a)
  transitivity   cmp(a,b) <= 0 and cmp(b,c) <= 0 => cmp(a,c) <= 0
  consistency    cmp(a,b) = 0 behaves like equality

Java's TimSort merges runs of 32 and checks as it goes:
  "Comparison method violates its general contract!"
so an array of 10 will pass every test you write` },
  ],

  costs: [
    ["identity check", "O(1)", "compares two addresses and nothing else"],
    ["equality on contents", "O(size)", "compares field by field, or element by element"],
    ["hashing a key", "O(size of key)", "read once and cached for immutable types"],
    ["hash map lookup", "O(1) average", "one hash to find the bucket, then equality inside it"],
    ["lookup with a broken hash", "O(1) and wrong", "finds the wrong bucket and reports absence, which is the expensive kind of fast"],
    ["sort with a comparator", "O(n log n) comparisons", "each comparison costs whatever your comparator costs"],
  ],

  traps: [
    "<b>Overriding equals without hashCode.</b> Equal objects then land in different buckets, so a set holds two copies of the same thing and a map cannot find a key it contains.",
    "<b>Using <code>==</code> on Java objects.</b> It compares addresses. Two strings with identical characters can fail it, depending on where they came from.",
    "<b>Mutating a key after insertion.</b> The entry becomes unreachable but not gone: still in the map, still iterated, never found.",
    "<b>A comparator that returns a boolean</b> where a negative, zero or positive value is expected. It compiles in some languages and sorts approximately.",
    "<b>Comparing floats for order with tolerance.</b> Almost-equal is not transitive, so it is not a valid ordering, and the sort is free to misbehave.",
    "<b>Relying on stability you do not have.</b> C++ <code>sort</code> is unstable; Java is stable for objects but not for primitive arrays.",
  ],

  impl: [
    ["Python", "__eq__ and __hash__ together", "Defining __eq__ alone sets __hash__ to None and the object becomes unhashable. dataclass(frozen=True) does both properly."],
    ["Java", "equals and hashCode, always both", "== is identity for objects. A record generates both for you and is usually the right answer."],
    ["C++", "operator== and std::hash specialisation", "sort needs a strict weak ordering; violating it is undefined behaviour, not a warning."],
    ["JavaScript", "no equality hook at all", "Map and Set compare object keys by reference. Serialise the key, or key by a string you build yourself."],
  ],

  code: {
    pseudo: `# THREE different questions, three different answers
identity(a, b)   ->  same object?     compares addresses, O(1)
equality(a, b)   ->  same contents?   compares fields
compare(a, b)    ->  which is first?  negative, zero, or positive

# THE CONTRACT a hash map depends on:
#   equal(a, b)  MUST imply  hash(a) == hash(b)
#   the reverse is NOT required, which is why buckets still check equality

lookup(key):
    bucket <- hash(key) mod tableSize     # step 1: find the bucket
    for entry in bucket:                  # step 2: equality inside it
        if equal(entry.key, key): return entry.value
    return not found                      # ...even if it is sitting one bucket over

# A COMPARATOR must be a real total order:
#   consistent:  compare(a,b) < 0  implies  compare(b,a) > 0
#   transitive:  a before b and b before c  implies  a before c
#   honest ties: compare(a,b) == 0 means genuinely interchangeable

# MULTI-KEY: compare both in one comparator, and depend on nothing
compare(a, b):
    if a.score != b.score: return b.score - a.score      # primary, descending
    return compare(a.name, b.name)                       # tie-break, ascending`,
    py: `# Define both, or neither. Defining __eq__ alone makes the type unhashable.
class Point:
    def __init__(self, x, y): self.x, self.y = x, y
    def __eq__(self, other):
        return isinstance(other, Point) and (self.x, self.y) == (other.x, other.y)
    def __hash__(self):
        return hash((self.x, self.y))       # built from the SAME fields as __eq__

# Or let the language do it correctly for you
from dataclasses import dataclass
@dataclass(frozen=True)                     # frozen => immutable => safely hashable
class P:
    x: int
    y: int

a is b                                      # identity: same object?
a == b                                      # equality: same contents?

# Sorting: give a key, not a comparator. Tuples compare left to right.
people.sort(key=lambda p: (-p.score, p.name))    # score desc, then name asc

# Multi-key via stability (Python's sort is stable, so this is safe here)
rows.sort(key=lambda r: r.name)             # secondary first
rows.sort(key=lambda r: r.score)            # primary second

# When you really need a three-way comparator
from functools import cmp_to_key
items.sort(key=cmp_to_key(lambda a, b: (a.w * b.h) - (b.w * a.h)))`,
    java: `// Override both. Overriding one is a bug with a long fuse.
final class Point {
    final int x, y;
    Point(int x, int y) { this.x = x; this.y = y; }
    @Override public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Point p)) return false;
        return x == p.x && y == p.y;
    }
    @Override public int hashCode() { return Objects.hash(x, y); }
}

// A record writes both for you, from the same fields, correctly
record Pt(int x, int y) {}

s1 == s2;            // identity: two objects, or one?
s1.equals(s2);       // equality: same characters?

// Comparators: compose them and stop hand-writing sign logic
people.sort(Comparator.comparingInt(P::score).reversed()
                      .thenComparing(P::name));

// Subtraction as a comparator OVERFLOWS. This is a real bug, not pedantry.
(a, b) -> a - b;              // wrong for large or negative values
(a, b) -> Integer.compare(a, b);   // right`,
    cpp: `struct Point {
    int x, y;
    bool operator==(const Point& o) const { return x == o.x && y == o.y; }
};

// unordered_map needs a hash built from the same fields as operator==
template <> struct std::hash<Point> {
    size_t operator()(const Point& p) const noexcept {
        return hash<int>{}(p.x) ^ (hash<int>{}(p.y) << 1);
    }
};

// sort needs a STRICT WEAK ORDERING. Violate it and this is undefined
// behaviour: the standard permits reading past the end of your array.
sort(v.begin(), v.end(), [](const P& a, const P& b) {
    if (a.score != b.score) return a.score > b.score;   // primary
    return a.name < b.name;                              // tie-break
});
// NOT this: <= is not a strict ordering, and it can crash
// sort(v.begin(), v.end(), [](auto& a, auto& b){ return a.score <= b.score; });

sort(v.begin(), v.end());          // unstable
stable_sort(v.begin(), v.end());   // stable, at the cost of extra memory`,
    js: `// There is no equals hook. Map and Set compare object keys by REFERENCE.
const m = new Map();
m.set({ x: 1 }, "a");
m.get({ x: 1 });                // undefined: a different object

// So build the key yourself, as a primitive
m.set(x + "," + y, value);      // string keys compare by value
m.set(JSON.stringify(obj), v);  // fine, but key order must be stable

// Sorting: a comparator returns a NUMBER, not a boolean
nums.sort((a, b) => a - b);                  // ascending
people.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));

// Booleans coerce to 0 and 1, so this "works" and sorts almost correctly
// people.sort((a, b) => a.score > b.score);  // do not

// sort() is stable since ES2019, so secondary-then-primary is safe
rows.sort((a, b) => a.name.localeCompare(b.name));
rows.sort((a, b) => a.score - b.score);`,
  },
  codecap: "If you override equality, override hashing from the same fields. If you write a comparator, make it a real ordering.",

  q: [
    ["What are the three different questions people confuse here?", "Identity (same object, compares addresses), equality (same contents, compares fields), and ordering (which comes first, a three-way answer)."],
    ["State the hash contract and explain why it exists.", "Equal objects must have equal hashes. A lookup uses the hash to pick a bucket and equality to search inside it, so if equal objects hash differently the map searches the wrong bucket and reports the key as absent while still holding it."],
    ["Why is the converse of that contract not required?", "There are unlimited possible values and a fixed number of hashes, so unequal objects must sometimes collide. That is exactly why the bucket is still searched with an equality check."],
    ["Why must a hash-map key be immutable?", "The bucket is derived from the contents. Change them after insertion and the entry is filed where nothing will look, so it stays in the map, still appears when iterating, and can never be found."],
    ["What makes a comparator invalid, and what happens then?", "Inconsistency (claiming a < b and b < a), non-transitivity, or dishonest ties. C++ treats it as undefined behaviour and may read past the end of the array; Java throws about the general contract, usually in production."],
    ["How do you sort by two keys without relying on stability?", "Compare both keys inside a single comparator: primary first, and fall through to the secondary only on a tie. Then the result does not depend on whether your language's sort happens to be stable."],
  ],

  p: [
    [242, "valid-anagram", "Valid Anagram, equality by canonical form", "E"],
    [49, "group-anagrams", "Group Anagrams, a key you construct yourself", "M"],
    [179, "largest-number", "Largest Number, a comparator that is not obvious", "M"],
    [56, "merge-intervals", "Merge Intervals, sort first and the rest is a sweep", "M"],
    [937, "reorder-data-in-log-files", "Reorder Log Files, multi-key with stability", "M"],
    [451, "sort-characters-by-frequency", "Sort by Frequency, sorting on a computed key", "M"],
  ],
},

/* ==================================================================== */
{
  id: "stack-queue",
  n: "Stack & Queue",
  group: "Fundamentals",
  one: "Both restrict you to <b>one end</b>. A stack (LIFO) remembers what is still unfinished; a queue (FIFO) processes in arrival order, which is exactly why DFS uses one and BFS the other.",

  plain: `<p>A stack and a queue are the same thing, a list, with a rule about <i>where you are allowed to touch it</i>. The rule is the whole point: by giving up random access you gain a guarantee about ordering, and that guarantee is what solves problems.</p>
<p><b>Stack = LIFO</b> (last in, first out): a pile of plates, you only take the top one. It naturally remembers <b>the most recent unfinished thing</b>, exactly what nested brackets, undo history and function calls need.</p>
<p><b>Queue = FIFO</b> (first in, first out): a queue at a counter, served in arrival order. It naturally finishes <b>everything at distance 1 before anything at distance 2</b>, exactly what shortest-path-in-an-unweighted-graph needs.</p>
<p><b>Analogy.</b> Stack = the browser back button (most recent page first). Queue = a printer spool (first submitted, first printed). Neither is better; they encode different answers to "what next?".</p>`,

  why: [
    { t: "Let the problem pick the structure",
      d: "Given <code>([{}])</code>, which bracket must close first? Always <b>the most recently opened one</b>. So you need a container whose easiest question is \"what did I add last?\". That is a stack. You did not choose it, the problem did." },
    { t: "Touching only one end is what keeps it cheap",
      d: "Push and pop both happen at the <b>end</b> of an array, so nothing has to shift: both O(1). Giving up access to the middle is exactly what buys that speed." },
    { t: "Function calls run on a stack too",
      d: "Calling a function stores the caller's variables and where to resume; returning pops them back. Recursion <i>is</i> a stack, which is why it can overflow, and why any recursion can be rewritten with a stack you manage yourself." },
    { t: "Shortest path needs the opposite rule",
      d: "BFS has to finish everything one step away before it looks at anything two steps away. Otherwise the first time it reaches the target may not be by the shortest route. That means serving in <b>arrival order</b>: a queue. Swap in a stack and you get DFS: still a valid walk, but no shortest-path guarantee." },
    { t: "Never use a plain array as a queue",
      d: "Removing from the front shifts every remaining element, O(n) each time. A deque is built to be cheap at both ends. Get this wrong and an O(V+E) BFS silently becomes O(V²) with nothing looking wrong." },
    { t: "The monotonic stack, in one line",
      d: "\"Next greater element\" looks like O(n²). But keep a stack of indices whose values only decrease: when a bigger value arrives, it is the answer for everything you pop. Each index goes in once and comes out once → <b>O(n)</b>." },
  ],

  hing: `<p><b>Dono cheezein ek hi list hain</b>, bas niyam alag hai ki tum <i>kahaan haath laga sakte ho</i>. Aur wahi niyam problem solve karta hai.</p>
<p><b>Stack (LIFO)</b>, platon ka dher. Sirf upar wali plate uthao. Yeh naturally yaad rakhta hai "sabse recent adhoora kaam kaun sa hai". Bracket matching mein <code>([{}])</code>, sabse baad mein khula bracket hi sabse pehle band hoga. Isliye stack koi random choice nahi, <b>problem ne khud force kiya hai</b>.</p>
<p><b>Queue (FIFO)</b>, line mein khade log, jo pehle aaya woh pehle. Isliye BFS mein distance 1 ke saare nodes pehle nipat jaate hain, phir distance 2 shuru hota hai. Yahi <b>shortest path ki guarantee</b> deta hai. Queue ki jagah stack laga do → DFS ban jaayega: traversal sahi, par shortest path ki guarantee khatam.</p>
<p><b>Sabse zaroori practical baat:</b> queue ke liye <code>list.pop(0)</code> kabhi mat use karna. Woh <b>O(n)</b> hai kyunki saare elements khisakte hain. <code>collections.deque</code> use karo, <code>popleft()</code> <b>O(1)</b>. Yeh galti BFS ko O(V+E) se chupke se O(V²) bana deti hai, aur bade test case par TLE deti hai.</p>
<p><b>Recursion = stack.</b> Har call mein local variables aur return address stack par push hote hain. Isliye gehri recursion RecursionError deti hai, aur isiliye <b>koi bhi recursion</b> explicit stack se iterative banayi ja sakti hai.</p>
<p><b>Monotonic stack (yeh zaroor samajhna):</b> "next greater element" pehli nazar mein O(n²) lagta hai. Par stack mein indices <b>ghatte hue</b> order mein rakho, jaise hi bada element aata hai, woh un sabka answer hai jinhe tum pop kar rahe ho. Har index sirf <b>ek baar push, ek baar pop</b> → total 2n operations → <b>O(n)</b>. Daily Temperatures aur Largest Rectangle isi ek idea par khade hain.</p>`,

  viz: ["stack", "queue"],
  see: [["VA", "https://visualgo.net/en/list", "VisuAlgo, stack & queue operations"]],

  math: [
    { t: "One end is cheap, the other end is the whole array", d: "The restriction is not a rule about tidiness. Removing from the front of a contiguous block moves everything behind it.", w:
`pop from the END:    read index n-1, n = n - 1      O(1)
pop from the FRONT:  shift n-1 elements left        O(n)

n pops from the front:
  (n-1) + (n-2) + ... + 1 = n(n-1)/2 moves
  n = 100,000  ->  5 x 10^9 element moves

a real deque does the same n pops in n operations` },
    { t: "The two-stack queue: four moves per element, for ever", d: "One dequeue can cost O(n), and yet the whole sequence is linear, because an element can only make the trip once.", w:
`an element's entire life across in-stack and out-stack:
  1  push onto in
  2  pop from in
  3  push onto out
  4  pop from out

n operations  <=  4n moves  ->  amortised O(1) each
worst single dequeue: O(n), when out is empty and in is full` },
    { t: "The call stack is a stack, and it has a published size", d: "Recursion depth is not an abstract concern. It is bytes, and you can work out roughly how many frames fit before anything overflows.", w:
`typical thread stack:  1 MB (JVM, Windows), 8 MB (Linux main)
one frame with a few locals: 50 to 100 bytes

1 MB / 100 bytes  ~  10,000 frames
Python's own ceiling: recursion limit 1000 by default

walking a 100,000-node list recursively: overflow
the same walk as a loop: zero frames` },
    { t: "DFS and BFS differ by one word, and by a lot of memory", d: "Same code, same visited set, different container. What changes is not the order so much as how much of the structure you are holding at once.", w:
`take from the same end you added -> stack -> depth first
take from the other end          -> queue -> breadth first

a complete binary tree of n = 10^6 nodes:
  height       = log2 n     = 20      DFS holds ~20 nodes
  widest level = n / 2      = 500,000 BFS holds 500,000

25,000x apart, for the same traversal` },
  ],

  costs: [
    ["stack push / pop (list)", "O(1)", "both at the end. Nothing shifts"],
    ["queue append / popleft (deque)", "O(1)", "ring buffer, both ends addressable"],
    ["list.pop(0) used as a queue", "O(n)", "shifts every element, never do this"],
    ["peek (a[-1] / q[0])", "O(1)", "just a read"],
    ["monotonic stack over n items", "O(n)", "each index pushed once, popped once"],
    ["space", "O(n)", "worst case everything is held at once"],
  ],

  traps: [
    "<b>Removing from the front of a plain array in BFS</b> (<code>list.pop(0)</code>, <code>ArrayList.remove(0)</code>, JS <code>shift()</code>). The most common silent performance bug in graph problems, use a deque.",
    "<b>Popping an empty stack.</b> Always guard with <code>if stack:</code>, unbalanced input is the first edge case tested.",
    "<b>Forgetting the final emptiness check.</b> In bracket matching <code>\"(((\"</code> never fails inside the loop; it fails because the stack is non-empty at the end.",
    "<b>Marking visited on dequeue instead of on enqueue.</b> The same node gets queued many times and the complexity blows up.",
  ],

  impl: [
    ["Python", "list (stack) · collections.deque (queue)", "list.pop(0) is O(n), always deque.popleft() for BFS."],
    ["Java", "ArrayDeque for BOTH", "push/pop for a stack, offer/poll for a queue. The legacy Stack class is synchronised and slow."],
    ["C++", "std::stack · std::queue · std::deque", "stack/queue are adapters over deque. front()/pop() are separate calls, pop() returns void."],
    ["JavaScript", "Array (stack) · index-pointer queue", "No deque. shift() is O(n), keep a head index, or use two stacks."],
  ],

  code: {
    pseudo: `# Both are a list with a rule about WHERE you may touch it.
#   Stack  LIFO, remembers the most recent unfinished thing (DFS, brackets, undo)
#   Queue  FIFO, processes in arrival order    (BFS, shortest path, scheduling)

# Bracket matching, the problem FORCES a stack
for c in s:
    if c is an opener:  push(c)
    else:
        if stack empty or pop() != matching_opener(c): return false
return stack is empty            # leftovers = unbalanced

# Monotonic stack, next greater element, O(n)
# each index is pushed once and popped once -> 2n operations
for i, x in a:
    while stack not empty and a[top()] < x:
        answer[pop()] <- x
    push(i)

# BFS, needs FIFO, and O(1) removal from the front
queue <- [start];  visited <- {start}      # mark on ENQUEUE
while queue not empty:
    levelSize <- size(queue)               # freeze it to walk level by level
    repeat levelSize times:
        node <- popFront(queue)
        for nxt in neighbours(node):
            if nxt not in visited: visited.add(nxt); pushBack(queue, nxt)
    depth <- depth + 1`,
    py: `from collections import deque

# ---- stack: a plain list ------------------------------------------
st = []
st.append(x)          # push  O(1)
st[-1]                # peek  O(1)
st.pop()              # pop   O(1)

def valid_brackets(s):
    pairs, st = {')':'(', ']':'[', '}':'{'}, []
    for c in s:
        if c in "([{":
            st.append(c)
        else:
            if not st or st.pop() != pairs[c]:   # guard the empty stack
                return False
    return not st                                # leftovers = unbalanced

# ---- monotonic stack: next greater element, O(n) ------------------
def next_greater(nums):
    res, st = [-1] * len(nums), []      # st holds INDICES, values decreasing
    for i, x in enumerate(nums):
        while st and nums[st[-1]] < x:  # x is the answer for everything smaller
            res[st.pop()] = x
        st.append(i)
    return res

# ---- queue: deque, never a list -----------------------------------
q = deque([start])
visited = {start}                       # mark on ENQUEUE, not on dequeue
while q:
    node = q.popleft()                  # O(1)
    for nxt in graph[node]:
        if nxt not in visited:
            visited.add(nxt)
            q.append(nxt)

# ---- BFS by levels: when you need the distance --------------------
depth = 0
while q:
    for _ in range(len(q)):             # freeze this level's size first
        node = q.popleft()
        ...
    depth += 1`,
    java: `// One class does both jobs: ArrayDeque.
Deque<Character> st = new ArrayDeque<>();
st.push(c); st.peek(); st.pop();              // stack (LIFO)

Deque<Integer> q = new ArrayDeque<>();
q.offer(x); q.poll();                          // queue (FIFO), both O(1)

boolean validBrackets(String s) {
    Map<Character,Character> pairs = Map.of(')','(', ']','[', '}','{');
    Deque<Character> st = new ArrayDeque<>();
    for (char c : s.toCharArray()) {
        if ("([{".indexOf(c) >= 0) st.push(c);
        else if (st.isEmpty() || st.pop() != pairs.get(c)) return false;
    }
    return st.isEmpty();
}

// BFS by levels
Queue<Integer> q = new ArrayDeque<>(List.of(start));
Set<Integer> visited = new HashSet<>(Set.of(start));
int depth = 0;
while (!q.isEmpty()) {
    for (int i = q.size(); i > 0; i--) {          // freeze the level size
        int node = q.poll();
        for (int nxt : graph.get(node))
            if (visited.add(nxt)) q.offer(nxt);   // add() returns false if present
    }
    depth++;
}`,
    cpp: `stack<char> st;  st.push(c); st.top(); st.pop();   // pop() returns void!
queue<int>  q;   q.push(x); q.front(); q.pop();
deque<int>  dq;  dq.push_front(x); dq.pop_back();   // both ends O(1)

bool validBrackets(const string& s) {
    unordered_map<char,char> pairs{{')','('},{']','['},{'}','{'}};
    stack<char> st;
    for (char c : s) {
        if (c=='('||c=='['||c=='{') st.push(c);
        else {
            if (st.empty() || st.top() != pairs[c]) return false;
            st.pop();
        }
    }
    return st.empty();
}

// Monotonic stack: next greater element
vector<int> nextGreater(vector<int>& a) {
    vector<int> res(a.size(), -1); stack<int> st;   // holds INDICES
    for (int i = 0; i < (int)a.size(); ++i) {
        while (!st.empty() && a[st.top()] < a[i]) { res[st.top()] = a[i]; st.pop(); }
        st.push(i);
    }
    return res;
}`,
    js: `// Stack: a plain array is perfect.
const st = [];
st.push(c); st[st.length - 1]; st.pop();     // all O(1)

// Queue: shift() is O(n). Use a head index instead.
const q = [start]; let head = 0;
const visited = new Set([start]);
while (head < q.length) {
  const levelSize = q.length - head;
  for (let i = 0; i < levelSize; i++) {
    const node = q[head++];                   // O(1) "dequeue"
    for (const nxt of graph[node])
      if (!visited.has(nxt)) { visited.add(nxt); q.push(nxt); }
  }
  depth++;
}

// Monotonic stack
function nextGreater(a) {
  const res = new Array(a.length).fill(-1), st = [];
  for (let i = 0; i < a.length; i++) {
    while (st.length && a[st[st.length-1]] < a[i]) res[st.pop()] = a[i];
    st.push(i);
  }
  return res;
}`,
  },
  codecap: "The level-by-level BFS loop and the monotonic stack are the two templates worth typing from memory.",

  q: [
    ["Why does bracket matching require a stack specifically?", "The bracket that must close next is always the most recently opened one, and a stack is the structure whose cheapest question is 'what did I add last?'. The problem forces LIFO."],
    ["Why does BFS need a queue rather than a stack?", "Shortest path requires exhausting distance 1 before distance 2, i.e. arrival order (FIFO). A stack gives DFS, which traverses correctly but loses the shortest-path guarantee."],
    ["Why is removing from the front of an array a bug in BFS?", "It shifts every remaining element, so it is O(n). Over V dequeues an O(V+E) BFS degrades to O(V²). A deque does it in O(1)."],
    ["Why is a monotonic stack O(n) despite containing a while loop?", "Each index is pushed exactly once and popped at most once, so the inner while runs at most n times in total across the whole outer loop."],
    ["How is recursion related to a stack?", "Every call pushes a frame of locals and a return address onto the call stack, popped on return. Any recursion can be rewritten with an explicit stack to dodge depth limits."],
    ["In BFS, mark visited on enqueue or dequeue?", "On enqueue, otherwise the same node can be queued many times before it is first processed."],
  ],

  p: [
    [20, "valid-parentheses", "Valid Parentheses", "E"],
    [155, "min-stack", "Min Stack, carry the min alongside", "M"],
    [739, "daily-temperatures", "Daily Temperatures, monotonic stack", "M"],
    [232, "implement-queue-using-stacks", "Queue using Stacks, amortised O(1)", "E"],
    [102, "binary-tree-level-order-traversal", "Level Order Traversal, BFS by levels", "M"],
    [84, "largest-rectangle-in-histogram", "Largest Rectangle, monotonic stack", "H"],
  ],
},

/* ==================================================================== */
{
  id: "heap",
  n: "Heap / Priority Queue",
  group: "Fundamentals",
  one: "A heap promises <b>only that the minimum is on top</b>, not a sorted order. That weaker promise is why push and pop are O(log n), and why top-K costs O(n log k) instead of O(n log n).",

  plain: `<p>You need the smallest item repeatedly, and new items keep arriving. Sorting gives you that, but it orders <i>everything</i> when you only ever look at <b>one</b> element. You paid for information you never used.</p>
<p>A heap makes a deliberately weaker promise: <b>every parent is ≤ its children</b>. Siblings are unordered, the underlying array is not sorted. All you are guaranteed is that the root is the minimum, which is all you asked for.</p>
<p>Because the promise is <i>local</i>, repairing it after a change is local too. A new item swaps upward along one path from root to leaf. That is about log n swaps, not n.</p>
<p><b>Analogy.</b> A hospital waiting room. Nobody ranks all 200 patients; they only need to know who is treated <b>next</b>. A new critical case is moved up past a few people, not inserted into a full ranking of everyone.</p>`,

  why: [
    { t: "Sorting hands you more than you asked for",
      d: "You want the smallest item, over and over, as new items arrive. Sorting orders <i>everything</i> when you only ever look at <i>one</i>. Keeping a sorted list costs O(n) per insert. Scanning for the minimum costs O(n) per removal. All three overpay." },
    { t: "So promise less: every parent is smaller than its children",
      d: "That is the only rule. Siblings are in no particular order and the array is not sorted. But follow parents down and each is smaller than what is below it, so the <b>top item is the minimum</b>, which is all you wanted." },
    { t: "A small promise is cheap to repair",
      d: "Add a new item at the bottom and swap it upward while it is smaller than its parent. Remove the top, move the last item up there, and swap it downward. Either way you walk <b>one path</b>, never the whole structure." },
    { t: "Keep the tree full and that path is short",
      d: "A heap fills every level before starting the next, so n items give a height of exactly log₂n. So push and pop are <b>O(log n)</b>, guaranteed rather than on average. And because there are no gaps, the whole thing fits in a plain array: the children of position i sit at 2i+1 and 2i+2. No pointers, no nodes." },
    { t: "Top-K is the payoff",
      d: "For the k largest of n items, keep a <b>min</b>-heap holding only k items: add each item, and whenever it holds more than k, drop the smallest. That is <b>O(n log k)</b> time and O(k) memory instead of sorting's O(n log n) and O(n)." },
    { t: "Know what it refuses to do",
      d: "You cannot search a heap, iterate it in order, or ask for the second smallest without removing the first. If you need any of those, you wanted a sorted structure or a balanced tree instead." },
  ],

  variants: [
    { n: "Top-K with a size-k heap", cost: "O(n log k) time, O(k) space",
      idea: "For the k largest, keep a MIN-heap of size k and pop whenever it grows past k, so the smallest of the current best is always the one discarded.",
      when: "k is much smaller than n, or the data is a stream you cannot hold entirely.",
      watch: "The instinct is a max-heap of size n. That is O(n log n) and O(n) space for the same answer." },

    { n: "Two heaps, running median", cost: "O(log n) per insert, O(1) per query",
      idea: "A max-heap for the lower half and a min-heap for the upper half, kept within one element of the same size. The median sits on one or both tops.",
      when: "A median over a stream, or any question needing the middle of data that keeps arriving.",
      watch: "Rebalancing after every insert is the whole trick, and pushing to the wrong heap first is the usual bug. Push, then move the top across, then rebalance sizes." },

    { n: "Heapify an existing array", cost: "O(n), not O(n log n)",
      idea: "Sift down from the last internal node backwards. Most nodes sit near the leaves and have almost nothing to sift, so the sum converges to linear.",
      when: "You already hold all the data and want a heap out of it.",
      watch: "n individual pushes cost O(n log n). Building in one go is strictly cheaper, and this is a favourite follow-up." },

    { n: "K-way merge", cost: "O(N log k)",
      idea: "Hold one element from each of the k sorted sources in a heap. Pop the smallest, then push the next element from whichever source it came from.",
      when: "Merging k sorted lists, arrays or files, and the smallest range covering all k lists.",
      watch: "Push the source index alongside the value, or you will not know where to pull the replacement from." },

    { n: "Priority scheduling", cost: "O(log n) per event",
      idea: "The heap holds pending work ordered by cost, deadline or arrival, and you always process the front. Dijkstra and Prim are both this.",
      when: "Task schedulers, event simulation, anything with a next-best-thing rule.",
      watch: "Ties need a deterministic second key, or a comparison between two objects with equal priority will throw or behave inconsistently." },
  ],

  hing: `<p><b>Zaroorat kya hai?</b> Baar-baar sabse chhota element chahiye, aur naye elements aate rehte hain. Poora sort karna <b>zyada kaam</b> hai, tumne sabko order kar diya jabki dekhna sirf <b>ek</b> tha.</p>
<p><b>Heap ka kamzor waada:</b> sirf itna ki <b>har parent apne children se chhota hai</b>. Siblings mein koi order nahi, array sorted nahi. Bas root par minimum milega, aur wahi to chahiye tha.</p>
<p><b>Kamzor waada = sasti repair.</b> Naya element sabse neeche daalo aur parent se chhota hai to swap karte upar jao (<b>sift up</b>). Root nikaalna ho to root hatao, aakhri element upar rakho, aur chhote child se swap karte neeche jao (<b>sift down</b>). Dono mein sirf <b>ek raasta</b> chalna padta hai, poora tree nahi.</p>
<p><b>Woh raasta chhota kyun hai?</b> Kyunki heap hamesha <b>complete binary tree</b> hoti hai, har level bhara, aakhri level left se fill. n nodes ka matlab height exactly ⌊log₂n⌋. Isliye push/pop <b>O(log n)</b>, guaranteed.</p>
<p><b>Complete hone ka bonus:</b> tree ki zaroorat hi nahi! Poora heap ek simple <b>array</b> hai, node <code>i</code> ke children <code>2i+1</code> aur <code>2i+2</code>, parent <code>(i-1)//2</code>. Na pointers, na node objects. Isliye practically bhi bahut fast.</p>
<p><b>Language ka zaroori point:</b> default kya hai yeh har language mein alag hai. Python <code>heapq</code> aur Java <code>PriorityQueue</code> <b>min</b>-heap hain; C++ <code>priority_queue</code> <b>max</b>-heap hai; JavaScript mein built-in hai hi nahi. Ulta chahiye to values <b>negative</b> karke daalo (ya comparator do).</p>
<p><b>Top-K ka asli trick:</b> k sabse bade chahiye to <b>size-k ki min-heap</b> rakho. Har element push karo; size k se zyada hui to pop kar do. Jo pop hota hai woh current best-k ka sabse chhota hota hai. Cost <b>O(n log k)</b>, memory O(k), sort ke O(n log n) aur O(n) se kaafi behtar, khaaskar jab n bahut bada ho aur k chhota.</p>`,

  viz: ["heap"],
  see: [["VA", "https://visualgo.net/en/heap", "VisuAlgo, heap insert & extract, animated"]],

  math: [
    { t: "Count what a sorted order promises, then count what a heap promises", d: "Sorting establishes every pairwise fact. A heap establishes one fact per node. The gap between those two numbers is the speed.", w:
`n = 1,000,000

a sorted array asserts every pair:  n(n-1)/2 = 5 x 10^11 facts
a heap asserts parent < child:      n - 1    = 10^6 facts

top-of-heap is all that was asked for, so the rest
was never bought. Building: O(n) instead of O(n log n).` },
    { t: "The repair path is the height, and the height is log2 n", d: "Keeping the tree complete is what bounds every operation. A complete tree of a million nodes is twenty levels deep, so nothing ever walks far.", w:
`complete binary tree, n nodes -> height floor(log2 n)

n = 1,000      height 9
n = 1,000,000  height 19
n = 10^9       height 29

push: one sift-up   <= 19 swaps at n = 10^6
pop:  one sift-down <= 19 levels, 2 comparisons each

no pointers needed:
  parent(i) = (i-1)/2   left(i) = 2i+1   right(i) = 2i+2` },
    { t: "Build-heap is O(n), and here is the sum that proves it", d: "The usual guess is n log n, one sift-down per node. It is wrong because almost every node is near the bottom, where a sift-down has nowhere to go.", w:
`nodes at height h:      about n / 2^(h+1)
sift-down from height h costs at most h

total = sum over h of  (n / 2^(h+1)) x h
      = n x sum of  h / 2^(h+1)
      = n x 1                      (the series converges to 1)
      = O(n)

half the nodes are leaves and cost 0. Only the root pays 19.` },
    { t: "Top-K, and why the k inside the log is the point", d: "Keeping a heap of size k rather than sorting everything changes both the time and, more importantly, the memory by orders of magnitude.", w:
`n = 10^7 items, k = 10

sort it all:      n log2 n = 10^7 x 23  = 2.3 x 10^8
heap of size k:   n log2 k = 10^7 x 3.3 = 3.3 x 10^7
                  memory k = 10, not 10^7

7x the work saved, and a million times the memory` },
  ],

  costs: [
    ["peek min (heap[0])", "O(1)", "the invariant puts it at the root"],
    ["heappush", "O(log n)", "one sift-up along a root-to-leaf path"],
    ["heappop", "O(log n)", "one sift-down along a root-to-leaf path"],
    ["heapify(list)", "O(n)", "bottom-up. NOT n log n; most nodes sit near the leaves"],
    ["find an arbitrary value", "O(n)", "a heap is not searchable, by design"],
    ["top-k of n items", "O(n log k)", "size-k heap; beats sorting's O(n log n)"],
    ["space", "O(n)", "a flat list, no node objects"],
  ],

  traps: [
    "<b>Know your language's default.</b> Python <code>heapq</code> and Java <code>PriorityQueue</code> are MIN-heaps; C++ <code>priority_queue</code> is a MAX-heap. Flip by negating values or passing a comparator.",
    "<b>Tuples compare element by element.</b> <code>(priority, task)</code> crashes when two priorities tie and <code>task</code> is not comparable. Push <code>(priority, counter, task)</code> with a unique counter.",
    "<b>heapify is O(n), not O(n log n).</b> Building from a list in one go is strictly cheaper than n pushes, a favourite follow-up.",
    "<b>Using a size-n max-heap for top-k.</b> Correct but wasteful: a <b>min</b>-heap of size k gives O(n log k) time and O(k) space.",
    "<b>Expecting sorted iteration.</b> Printing the underlying list is not sorted; only repeated pops produce sorted output.",
  ],

  impl: [
    ["Python", "heapq (MIN-heap, on a plain list)", "No max-heap: push -x. heapq.heapify is O(n); nlargest(k, xs) does top-K for you."],
    ["Java", "PriorityQueue (MIN-heap)", "new PriorityQueue<>(Comparator.reverseOrder()) for max. peek/poll, and remove(x) is O(n)."],
    ["C++", "priority_queue (MAX-heap!)", "The opposite default. priority_queue<int, vector<int>, greater<int>> for a min-heap."],
    ["JavaScript", "no built-in", "Hand-roll sift-up/sift-down over an array, or sort when n is small."],
  ],

  code: {
    pseudo: `# INVARIANT: parent <= both children (min-heap). Nothing else is ordered.
# The tree is COMPLETE, so it lives in a flat array:
#     children(i) = 2i+1, 2i+2      parent(i) = (i-1)/2      height = log n

push(x):
    a.append(x); i <- size-1
    while i > 0 and a[i] < a[parent(i)]:      # sift UP one path
        swap(a[i], a[parent(i)]); i <- parent(i)

pop():                                        # remove the minimum
    top <- a[0]
    a[0] <- a[last]; remove last; i <- 0
    while a[i] > min(children of i):           # sift DOWN one path
        swap with the smaller child; i <- that child
    return top

# TOP-K LARGEST, a MIN-heap of size k, not a max-heap of size n
for x in stream:
    push(x)
    if size > k: pop()          # discards the smallest of the current best k
# O(n log k) time, O(k) memory, beats sorting's O(n log n) / O(n)`,
    py: `import heapq

h = []
heapq.heappush(h, 5)        # O(log n)
h[0]                        # peek min, O(1)
heapq.heappop(h)            # remove min, O(log n)
heapq.heapify(nums)         # in place, O(n), cheaper than n pushes

# Max-heap: negate going in and coming out
heapq.heappush(h, -x)
largest = -heapq.heappop(h)

# Top-K largest with a size-k MIN-heap: O(n log k) time, O(k) space
def top_k(nums, k):
    h = []
    for x in nums:
        heapq.heappush(h, x)
        if len(h) > k:
            heapq.heappop(h)     # drop the smallest of the current best k
    return h                     # the k largest, unsorted

# Priority queue with tie-breaking (tuples compare left to right)
import itertools
counter = itertools.count()
heapq.heappush(pq, (priority, next(counter), task))

# Merge k sorted lists, the classic heap application, O(N log k)
def merge_k(lists):
    h = [(l[0], i, 0) for i, l in enumerate(lists) if l]
    heapq.heapify(h)
    out = []
    while h:
        val, li, idx = heapq.heappop(h)
        out.append(val)
        if idx + 1 < len(lists[li]):
            heapq.heappush(h, (lists[li][idx+1], li, idx+1))
    return out

# Running median: max-heap for the low half, min-heap for the high half`,
    java: `PriorityQueue<Integer> minHeap = new PriorityQueue<>();               // MIN by default
PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Comparator.reverseOrder());

minHeap.offer(5);      // O(log n)
minHeap.peek();        // O(1)
minHeap.poll();        // O(log n)

// Top-K largest with a size-k MIN-heap: O(n log k)
static List<Integer> topK(int[] nums, int k) {
    PriorityQueue<Integer> h = new PriorityQueue<>();
    for (int x : nums) { h.offer(x); if (h.size() > k) h.poll(); }
    return new ArrayList<>(h);
}

// Custom priority, no tie-breaking hack needed, the comparator decides
PriorityQueue<int[]> pq = new PriorityQueue<>((p, q) -> p[0] - q[0]);

// Building from a collection is O(n), not n log n
PriorityQueue<Integer> h = new PriorityQueue<>(list);`,
    cpp: `priority_queue<int> maxHeap;                                    // MAX by default!
priority_queue<int, vector<int>, greater<int>> minHeap;         // min-heap

maxHeap.push(5);   maxHeap.top();   maxHeap.pop();   // pop() returns void

// Top-K largest with a size-k MIN-heap: O(n log k)
vector<int> topK(vector<int>& nums, int k) {
    priority_queue<int, vector<int>, greater<int>> h;
    for (int x : nums) { h.push(x); if ((int)h.size() > k) h.pop(); }
    vector<int> out;
    while (!h.empty()) { out.push_back(h.top()); h.pop(); }
    return out;
}

// O(n) heapify over an existing vector
make_heap(v.begin(), v.end());          // max-heap by default
push_heap(v.begin(), v.end());          // after v.push_back(x)
pop_heap(v.begin(), v.end()); v.pop_back();`,
    js: `// No built-in heap. This is the whole thing in ~20 lines.
class MinHeap {
  constructor() { this.a = []; }
  push(x) {
    this.a.push(x);
    let i = this.a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.a[p] <= this.a[i]) break;
      [this.a[p], this.a[i]] = [this.a[i], this.a[p]];
      i = p;
    }
  }
  pop() {
    const top = this.a[0], last = this.a.pop();
    if (this.a.length) {
      this.a[0] = last;
      let i = 0;
      for (;;) {
        const l = 2*i+1, r = 2*i+2; let m = i;
        if (l < this.a.length && this.a[l] < this.a[m]) m = l;
        if (r < this.a.length && this.a[r] < this.a[m]) m = r;
        if (m === i) break;
        [this.a[m], this.a[i]] = [this.a[i], this.a[m]];
        i = m;
      }
    }
    return top;
  }
  get size() { return this.a.length; }
}`,
  },
  codecap: "The size-k min-heap and the (priority, counter, task) tuple are the two things people get wrong under pressure.",

  q: [
    ["What does a heap guarantee, and what does it not?", "It guarantees each parent ≤ its children, so the root is the global minimum. It does NOT order siblings or keep the array sorted."],
    ["Why are push and pop O(log n)?", "The heap is a complete binary tree of height ⌊log₂n⌋, and both operations repair the invariant along a single root-to-leaf path."],
    ["Why can a heap live in a plain array?", "It is always complete, so positions are computable: children of i are 2i+1 and 2i+2, parent is (i-1)//2. No pointers required."],
    ["Top-k largest: which heap, what size, what cost?", "A MIN-heap of size k, push each element, pop when size > k so the smallest of the current best k is discarded. O(n log k) time, O(k) space."],
    ["Why is heapify O(n) rather than O(n log n)?", "It runs bottom-up and most nodes are near the leaves with a very short sift-down; the sum over all levels converges to O(n)."],
    ["How do you flip a min-heap into a max-heap?", "Negate the values (or the priority in a tuple) on the way in and out, or supply a reversed comparator where the language allows one. Java's PriorityQueue takes Comparator.reverseOrder(); C++ is already a max-heap and needs greater<> for a min-heap."],
  ],

  p: [
    [215, "kth-largest-element-in-an-array", "Kth Largest, size-k min-heap", "M"],
    [347, "top-k-frequent-elements", "Top K Frequent", "M"],
    [973, "k-closest-points-to-origin", "K Closest Points", "M"],
    [23, "merge-k-sorted-lists", "Merge K Sorted Lists", "H"],
    [295, "find-median-from-data-stream", "Median from Data Stream, two heaps", "H"],
  ],
},

/* ==================================================================== */
{
  id: "recursion",
  n: "Recursion",
  group: "Fundamentals",
  one: "Solve a problem by <b>assuming the smaller version is already solved</b>. Write exactly two things, the base case and one honest step, and stop tracing the rest.",

  plain: `<p>The instinct is to trace it in your head: this calls that, which calls that… Three levels down you are lost. That is not how recursion is meant to be read, and trying is why it feels hard.</p>
<p>The correct move is a <b>leap of faith</b>. To compute <code>factorial(5)</code>, assume <code>factorial(4)</code> already works. Do not ask how. Your job is then one line: <code>5 × factorial(4)</code>. You wrote one step honestly and delegated the rest.</p>
<p>Two things make the leap safe: a <b>base case</b> that returns without recursing, and every call moving strictly <b>toward</b> it. Miss either and the leap becomes an infinite fall.</p>
<p><b>Analogy.</b> You are in a queue and want your position. You do not count the whole line. You tap the person ahead and ask "what's your number?", then add one. The first person knows theirs without asking anyone (base case), and every question moves one person closer to them (progress). The answer comes back down the line.</p>`,

  why: [
    { t: "Do not trace it, trust it",
      d: "For <code>factorial(5)</code>, assume <code>factorial(4)</code> already works. Do not ask how. Your job is one line: <code>5 × factorial(4)</code>. Trying to follow the calls three levels deep in your head is why recursion feels hard; you are not meant to." },
    { t: "Three questions, and the function writes itself",
      d: "What is the smallest input I can answer with no call at all? (the <b>base case</b>) If the smaller version were solved. How do I build my answer from it? (the <b>step</b>) Does every call get strictly smaller? (<b>progress</b>) Answer those three and you are done." },
    { t: "Space is the depth, not the number of calls",
      d: "Each call keeps its own variables in a frame, and the frames stack up until they return. So memory is however deep you go, and every language caps that depth." },
    { t: "Time is the number of calls, so draw the tree",
      d: "One call per level gives n calls: O(n). Two calls per level gives about 2ⁿ calls: O(2ⁿ). Notice that the second one is still only O(n) space, because the tree is wide but not deep." },
    { t: "If the same call repeats, remember the answer",
      d: "In naive <code>fib</code>, <code>fib(2)</code> is recomputed over and over. Store each answer the first time you compute it and the huge tree collapses to a line: <b>O(2ⁿ) becomes O(n)</b>. That is memoisation, and memoisation <i>is</i> dynamic programming. DP is not a separate topic; it is recursion plus a lookup table." },
    { t: "Backtracking is recursion that puts things back",
      d: "Choose an option, recurse, then <b>undo the choice</b> before trying the next one. The undo matters because the next branch must start from a clean slate." },
  ],

  hing: `<p><b>Sabse badi galti:</b> recursion ko dimaag mein trace karne ki koshish. Do-teen level ke baad sab gadbad. <b>Trace karna hai hi nahi.</b></p>
<p><b>Sahi tarika: bharosa (leap of faith).</b> <code>factorial(5)</code> chahiye? Maan lo <code>factorial(4)</code> pehle se sahi kaam karta hai. Kaise? Mat poocho. Tumhara kaam sirf ek line: <code>5 × factorial(4)</code>. Tumne <b>ek step imaandari se likha</b>, baaki delegate kar diya.</p>
<p><b>Do cheezein is bharose ko safe banati hain:</b> (1) <b>base case</b>, matlab sabse chhota input jiska jawab bina kisi call ke pata ho. (2) har call base case ke <b>kareeb</b> jaaye. Ek bhi missing to infinite recursion.</p>
<p><b>Machine kaise sambhalti hai?</b> Har call ka apna <b>stack frame</b> banta hai, apne parameters, apne locals. Isliye har level ke variables alag rehte hain. Depth d matlab d frames zinda → <b>space O(depth)</b>. Har language ki limit hoti hai, Python ~1000 frames par RecursionError deta hai, JVM/C++ StackOverflow.</p>
<p><b>Time kaise ginein?</b> Call tree banao. <b>Time = kitne nodes hain</b>, <b>space = kitni gehrai hai</b>. Ek call per level → O(n) time. Do call per level (jaise fib) → ~2ⁿ nodes → O(2ⁿ) time, par space phir bhi sirf O(n). Yeh farak interview mein pucha jaata hai.</p>
<p><b>Ab sabse important baat.</b> Naive fib mein <code>fib(2)</code> baar-baar compute hota hai, subproblems <b>repeat</b> ho rahe hain. Answer cache kar do, ek memo table mein. Phir har alag subproblem sirf ek baar chalega, aur O(2ⁿ) seedha <b>O(n)</b> ban jaayega. <b>Yahi memoization hai, aur yahi top-down DP hai.</b> DP koi alag jaadu nahi, recursion + dictionary hai.</p>
<p><b>Backtracking:</b> choose → recurse → <b>un-choose</b>. Woh un-choose isliye zaroori hai taaki agli branch saaf state se shuru ho. Aur <code>res.append(path)</code> mat likhna, <code>path[:]</code> likhna, warna sab results ek hi badalti hui list ki taraf point karenge.</p>`,

  viz: ["recursion-tree"],
  see: [["VA", "https://visualgo.net/en/recursion", "VisuAlgo, recursion tree, animated"],
        ["DOC", "https://docs.python.org/3/library/functools.html#functools.lru_cache", "Python docs, functools.lru_cache"]],

  math: [
    { t: "Depth is memory, and the memory runs out at a specific number", d: "Every pending call is a frame on the stack. Multiply frames by bytes and you can predict the overflow instead of discovering it.", w:
`one frame: return address, saved registers, locals
            roughly 50 to 100 bytes

recursion over a 100,000-node list
  100,000 x 100 bytes = 10 MB of stack
  available:            1 MB typical

Python refuses sooner: default recursion limit 1000` },
    { t: "Time is the number of calls, so count the nodes of the call tree", d: "Naive fib is the standard example because the repetition is visible. The call count grows by the golden ratio, which is what makes n = 50 hopeless.", w:
`calls(n) = calls(n-1) + calls(n-2) + 1  =  2 fib(n+1) - 1

n = 5      15 calls
n = 10     177
n = 30     2,692,537
n = 40     3.3 x 10^8       seconds
n = 50     4.0 x 10^10      minutes

memoised: 50 calls. Same recurrence, each one answered once.` },
    { t: "Five recurrences, five complexity classes", d: "Almost every recursion you meet is one of these. Read off how many branches there are and how fast the argument shrinks, and the class follows.", w:
`T(n) = T(n/2) + 1     -> log2 n calls      binary search
T(n) = T(n-1) + 1     -> n calls, n deep   linear recursion
T(n) = 2T(n/2) + 1    -> 2n - 1 calls      tree traversal
T(n) = 2T(n/2) + n    -> n log2 n work     merge sort
T(n) = 2T(n-1) + 1    -> 2^n - 1 calls     every subset

n = 10^6 under the first: 20 calls
n = 30 under the last:    10^9 calls` },
    { t: "Tail position, and the three languages where it buys nothing", d: "A tail call has nothing waiting for it, so the frame could be reused. Whether it actually is depends entirely on the language.", w:
`sum(n)      = n + sum(n-1)        not tail: the + waits
sum(n, acc) = sum(n-1, acc + n)   tail: nothing waits

flattened to a loop, depth 1:  C++, Kotlin, Scala, most Lisps
not flattened, depth n:        Python, Java, JavaScript

so in those three, convert it yourself or accept the depth` },
  ],

  costs: [
    ["linear recursion (factorial, list walk)", "O(n) time · O(n) space", "n frames alive at the deepest point"],
    ["binary recursion (naive fib)", "O(2ⁿ) time · O(n) space", "2ⁿ nodes, but only depth-n frames at once"],
    ["memoised recursion (top-down DP)", "O(distinct states)", "each subproblem computed exactly once"],
    ["tree DFS", "O(n) time · O(h) space", "h = height: O(log n) balanced, O(n) skewed"],
    ["subsets / permutations", "O(2ⁿ) / O(n!)", "the number of nodes in the decision tree"],
    ["runtime recursion limit", "~10³–10⁵ frames", "Python ~1000 (raise it or go iterative); JVM/C++ overflow silently deeper down"],
  ],

  traps: [
    "<b>No base case, or one that is unreachable.</b> Check that <i>every</i> path reduces the input, including the empty and odd/even branches.",
    "<b>Mutating shared state without undoing it.</b> In backtracking every <code>path.append</code> needs its matching <code>path.pop()</code>.",
    "<b>Appending the live list to your results.</b> <code>res.append(path)</code> stores a reference that keeps changing, use <code>res.append(path[:])</code>.",
    "<b>Slicing the input at each level.</b> <code>f(a[1:])</code> copies O(n) per level → O(n²). Pass an index instead.",
    "<b>Claiming O(1) space because 'there are no data structures'.</b> The call stack is real memory, say O(depth).",
  ],

  impl: [
    ["Python", "@lru_cache / dict memo", "Default limit ~1000 frames: sys.setrecursionlimit, or rewrite iteratively."],
    ["Java", "HashMap memo / int[] memo", "Default JVM stack ≈ 10k–20k frames. -Xss raises it; an explicit stack is safer."],
    ["C++", "vector memo (fill with -1)", "Deep recursion overflows silently, no exception. Prefer iterative for depth > ~10^5."],
    ["JavaScript", "Map memo", "V8 caps at ~10k frames and throws RangeError. No tail-call optimisation in practice."],
  ],

  code: {
    pseudo: `# Answer three questions and the function writes itself.
#   1. BASE CASE, the smallest input you can answer with no call
#   2. THE STEP, assume the smaller version is solved; combine
#   3. PROGRESS, every call must move strictly toward the base case

fact(n):
    if n <= 1: return 1              # 1. base case
    return n * fact(n - 1)           # 2. one honest step   3. n shrinks

# COST:  time  = number of NODES in the call tree
#        space = DEPTH of the call tree (the live stack frames)
#   one call per level  -> O(n) time,    O(n) space
#   two calls per level -> O(2^n) time,  O(n) space   <-- note the difference

# The subproblems OVERLAP -> cache them. This is top-down DP.
memo <- empty map
fib(n):
    if n < 2: return n
    if n in memo: return memo[n]
    memo[n] <- fib(n-1) + fib(n-2)
    return memo[n]                   # O(2^n) collapses to O(n)

# BACKTRACKING = recursion that undoes
dfs(i):
    if i == n: record a COPY of path; return
    path.append(choice); dfs(i+1); path.removeLast()   # choose / un-choose`,
    py: `# The three questions, answered in code.

def fact(n):
    if n <= 1:              # 1. base case, answerable with no call
        return 1
    return n * fact(n - 1)  # 2. one honest step   3. n shrinks -> progress

# Naive fib: O(2^n), because subproblems repeat
def fib(n):
    if n < 2: return n
    return fib(n-1) + fib(n-2)

# Memoised: O(n). This one decorator IS top-down DP.
from functools import lru_cache
@lru_cache(None)
def fib_fast(n):
    if n < 2: return n
    return fib_fast(n-1) + fib_fast(n-2)

# Tree DFS, the shape most interview recursion takes
def depth(node):
    if not node: return 0                       # base: empty tree
    return 1 + max(depth(node.left), depth(node.right))

# Backtracking: choose -> recurse -> UN-choose
def subsets(nums):
    res, path = [], []
    def dfs(i):
        if i == len(nums):
            res.append(path[:])                 # copy! not the live list
            return
        path.append(nums[i]); dfs(i + 1)        # choose
        path.pop();           dfs(i + 1)        # un-choose, then skip
    dfs(0)
    return res

# When depth can reach 10^5, use an explicit stack instead
def dfs_iter(root):
    st = [root]
    while st:
        node = st.pop()
        if not node: continue
        st.append(node.left); st.append(node.right)`,
    java: `// Base case + one honest step
static long fact(int n) { return n <= 1 ? 1 : n * fact(n - 1); }

// Memoised: O(2^n) -> O(n)
static Map<Integer, Long> memo = new HashMap<>();
static long fib(int n) {
    if (n < 2) return n;
    Long v = memo.get(n);
    if (v != null) return v;
    long r = fib(n - 1) + fib(n - 2);
    memo.put(n, r);
    return r;
}

// Tree DFS
static int depth(TreeNode node) {
    if (node == null) return 0;
    return 1 + Math.max(depth(node.left), depth(node.right));
}

// Backtracking: choose -> recurse -> UN-choose
static void dfs(int i, int[] nums, List<Integer> path, List<List<Integer>> res) {
    if (i == nums.length) { res.add(new ArrayList<>(path)); return; }  // COPY
    path.add(nums[i]); dfs(i + 1, nums, path, res);
    path.remove(path.size() - 1); dfs(i + 1, nums, path, res);
}`,
    cpp: `long long fact(int n) { return n <= 1 ? 1 : n * fact(n - 1); }

// Memoised with a vector, fill(-1) marks "not computed"
vector<long long> memo;
long long fib(int n) {
    if (n < 2) return n;
    if (memo[n] != -1) return memo[n];
    return memo[n] = fib(n-1) + fib(n-2);
}
// memo.assign(N+1, -1);  before the first call

int depth(TreeNode* node) {
    if (!node) return 0;
    return 1 + max(depth(node->left), depth(node->right));
}

// Backtracking
void dfs(int i, vector<int>& nums, vector<int>& path, vector<vector<int>>& res) {
    if (i == (int)nums.size()) { res.push_back(path); return; }   // copies
    path.push_back(nums[i]); dfs(i+1, nums, path, res);
    path.pop_back();          dfs(i+1, nums, path, res);
}`,
    js: `const fact = n => (n <= 1 ? 1 : n * fact(n - 1));

// Memoised: O(2^n) -> O(n)
const memo = new Map();
function fib(n) {
  if (n < 2) return n;
  if (memo.has(n)) return memo.get(n);
  const r = fib(n - 1) + fib(n - 2);
  memo.set(n, r);
  return r;
}

// Tree DFS
function depth(node) {
  return node ? 1 + Math.max(depth(node.left), depth(node.right)) : 0;
}

// Backtracking: choose -> recurse -> UN-choose
function subsets(nums) {
  const res = [], path = [];
  (function dfs(i) {
    if (i === nums.length) { res.push([...path]); return; }   // COPY, not path
    path.push(nums[i]); dfs(i + 1);
    path.pop();         dfs(i + 1);
  })(0);
  return res;
}`,
  },
  codecap: "The base case, the honest step, and path[:] on append, three lines that carry most recursion questions.",

  q: [
    ["What are the only three questions needed to write a recursion?", "What is the base case? If the smaller version were solved. How do I build my answer from it? Does every call move strictly toward the base case?"],
    ["Why should you not trace a recursion in your head?", "Correctness comes from induction, not simulation: prove the base case and the single step and every deeper level follows automatically."],
    ["Naive fib is O(2ⁿ) time. What is its space, and why?", "O(n). Time counts nodes in the call tree, but space counts only the frames alive at once, which is the depth."],
    ["Why does memoising turn O(2ⁿ) into O(n)?", "The subproblems overlap; caching by argument makes each distinct subproblem run once, so cost becomes the number of distinct states. That is exactly top-down DP."],
    ["In backtracking, why must you un-choose?", "The path is shared mutable state, without popping, the sibling branch inherits choices from the branch you just finished."],
    ["Why does res.append(path) give wrong answers?", "It stores a reference to a list that keeps mutating, so all stored results change together. Append a copy: path[:]."],
  ],

  p: [
    [509, "fibonacci-number", "Fibonacci, write it naive, then memoised", "E"],
    [104, "maximum-depth-of-binary-tree", "Max Depth of Binary Tree", "E"],
    [70, "climbing-stairs", "Climbing Stairs, recursion → DP", "E"],
    [78, "subsets", "Subsets, choose / un-choose", "M"],
    [46, "permutations", "Permutations", "M"],
    [39, "combination-sum", "Combination Sum", "M"],
  ],
},

/* ==================================================================== */
{
  id: "loops-invariants",
  n: "Loops, ranges and invariants",
  group: "Fundamentals",
  one: "Write every range as half-open <b>[lo, hi)</b> and say your invariant out loud before the loop. Almost every off-by-one bug is one of those two habits missing.",

  plain: `<p>Off-by-one errors are not carelessness. They come from ambiguity: when you say "from 2 to 5", nobody, including you, three lines later. Is certain whether 5 is included.</p>
<p>The fix is a convention, applied everywhere without exception: <b>the low end is included, the high end is not</b>. That is what <code>[lo, hi)</code> means, and it is why array indices start at 0 and why slices and iterators stop one past the end.</p>
<p>Adopt it and the arithmetic becomes free. The size is <code>hi − lo</code>, with no +1 to remember. An empty range is <code>lo == hi</code>, with no special case. Splitting at <code>mid</code> gives <code>[lo, mid)</code> and <code>[mid, hi)</code>. Nothing shared, nothing skipped, no adjustment.</p>
<p>The second habit is the <b>invariant</b>: one sentence that is true before the loop and still true after every pass. Write it in a comment first. Then each branch has an obvious job, keep it true, and the questions about <code>&lt;</code> versus <code>&lt;=</code> answer themselves.</p>
<p><b>Analogy.</b> A fence. "From post 2 to post 5" is ambiguous, but "the panels between post 2 and post 5" is not. There are exactly three, and 5 − 2 says so.</p>`,

  why: [
    { t: "The bug is ambiguity, not arithmetic", d: "An inclusive range forces you to remember a +1 in the size, a −1 in the last index, and a special case for emptiness. Every one of those is a chance to be wrong, and they compound as soon as ranges are split or joined." },
    { t: "Half-open removes all three at once", d: "With <b>[lo, hi)</b> the size is <code>hi − lo</code> and empty means <code>lo == hi</code>. Two ranges also join seamlessly, because one ends exactly where the next begins. Nothing has to be adjusted, so nothing can be adjusted wrongly. This is why <code>range(0, n)</code>, <code>slice[a:b]</code> and <code>end()</code> iterators all work this way." },
    { t: "An invariant turns a loop into something you can check", d: "State one sentence that stays true on every pass through the loop. \"Everything before <code>slow</code> is already sorted.\" \"The answer, if it exists, is inside [lo, hi).\" \"The window always satisfies the condition.\" Now correctness is local: check that each branch preserves it, and the loop is right by construction." },
    { t: "Termination is a separate promise", d: "An invariant says the loop is <i>correct</i>; it does not say the loop <i>ends</i>. For that, something must strictly decrease every pass, the range shrinks, an index advances. Every infinite loop is a branch that failed to shrink anything, which is exactly the classic binary-search hang." },
    { t: "The edge cases then fall out of the invariant", d: "Empty input, one element, everything identical, the answer at the first or last position. You no longer guess which to test. You ask whether the invariant holds when the range is empty, or when it holds one element. The test cases come from the statement rather than from memory." },
  ],

  hing: `<p><b>Off-by-one galti laaparwahi nahi hai, confusion hai.</b> "2 se 5 tak" bolne par pata hi nahi chalta ki 5 andar hai ya nahi. Teen line baad tumhe khud yaad nahi rahega.</p>
<p><b>Ilaaj ek convention hai, aur usse kabhi mat todo:</b> <b>shuruaat andar, aakhir bahar</b>, yani <code>[lo, hi)</code>. Isi wajah se array index 0 se shuru hote hain, aur isi wajah se <code>range(0, n)</code> aur slicing <code>a[2:5]</code> aakhri wale ko chhod dete hain.</p>
<p><b>Isse teen faayde ek saath milte hain:</b><br>1. <b>Size = hi − lo</b>, koi +1 yaad nahi rakhna.<br>2. <b>Khaali range = lo == hi</b>, koi special case nahi.<br>3. <b>Todna aasaan</b>, <code>[lo, mid)</code> aur <code>[mid, hi)</code>, na kuch chhoota na kuch do baar aaya.</p>
<p><b>Doosri aadat, invariant.</b> Loop likhne se <b>pehle</b> ek line comment mein likho jo har iteration ke baad sach rahegi. Jaise: "answer agar hai to hamesha [lo, hi) ke andar hai", ya "slow se pehle wala hissa hamesha sorted hai", ya "window hamesha valid hai".</p>
<p><b>Iska faayda kya hai?</b> Ab har branch ka kaam saaf hai, invariant ko sach rakhna. <code>&lt;</code> lagaaun ya <code>&lt;=</code>, <code>mid</code> ya <code>mid+1</code>, yeh sawaal apne aap hal ho jaate hain. Guess karna band.</p>
<p><b>Ek aur alag baat, loop rukega ya nahi.</b> Invariant sirf yeh kehta hai ki loop <b>sahi</b> hai, yeh nahi ki woh <b>rukega</b>. Rukne ke liye har pass mein kuch <b>zaroor chhota</b> hona chahiye. Har infinite loop wahi branch hai jisme kuch chhota nahi hua, binary search ka famous hang isi ka example hai.</p>
<p><b>Aur test cases bhi yahin se aate hain:</b> khaali input, ek element, sab barabar, answer sabse pehle ya sabse aakhir mein. Yaad karne ki zaroorat nahi, bas poochho ki invariant tab bhi sach rehta hai kya.</p>`,

  viz: ["half-open"],
  see: [["DOC", "https://www.cs.utexas.edu/~EWD/transcriptions/EWD08xx/EWD831.html", "Dijkstra, why numbering should start at zero"]],

  math: [
    { t: "Half-open, priced against closed, on every operation you need", d: "The convention is not taste. Each line below is somewhere an off-by-one can live, and one column has fewer of them.", w:
`[lo, hi) with lo = 2, hi = 5  ->  {2, 3, 4}

                  half-open [lo,hi)     closed [lo,hi]
size              hi - lo               hi - lo + 1
empty when        lo == hi              lo > hi
split at m        [lo,m) and [m,hi)     [lo,m-1] and [m+1,hi]
join              [a,b) + [b,c) = [a,c) needs b and b+1

three chances to be off by one, versus none` },
    { t: "An invariant is a sentence you can check at three moments", d: "Say what is true before the loop, show each step preserves it, and read the answer off what it means when the loop ends. That is the whole method.", w:
`binary search over [lo, hi)
invariant: if the answer exists, it lies in [lo, hi)

before:  lo = 0, hi = n     the range is everything, true
step:    discard a half that cannot hold the answer, so
         the invariant still holds afterwards
after:   lo == hi, the range is empty
         so the answer does not exist

three lines, and they are the same three lines every time` },
    { t: "Termination is a second promise: name the measure", d: "The invariant says the loop is right. It does not say the loop stops. For that you need a non-negative integer that strictly falls on every path.", w:
`measure = hi - lo, never negative, must strictly decrease

lo = mid + 1   ->  falls by at least 1            safe
hi = mid       ->  falls by at least 1 (mid < hi) safe
lo = mid       ->  may not fall at all            hangs

with hi = lo + 1:  mid = lo + (hi-lo)/2 = lo
  lo = mid leaves lo unchanged: the loop never ends` },
    { t: "The four ranges, and which two fail silently", d: "Only one of these is right. The interesting part is that the two obviously broken ones are the safe kind of broken.", w:
`n = 5, valid indices 0..4

for i in [0, n)     5 passes, last index 4   correct
for i in [0, n]     6 passes, last index 5   crashes, loudly
for i in [1, n)     4 passes, misses 0       silent, plausible
for i in [0, n-1)   4 passes, misses 4       silent, plausible

the crash is the good outcome: it tells you` },
  ],

  costs: [
    ["size of [lo, hi)", "hi − lo", "no +1 to remember or forget"],
    ["empty range", "lo == hi", "expressible without a special case"],
    ["split at mid", "[lo, mid) + [mid, hi)", "nothing shared, nothing skipped"],
    ["last valid index", "hi − 1", "the one place the −1 is explicit and obvious"],
    ["inclusive [lo, hi] size", "hi − lo + 1", "the +1 that goes missing in most off-by-one bugs"],
    ["loop termination", "something must strictly shrink", "otherwise it hangs, however correct the invariant is"],
  ],

  traps: [
    "<b>Mixing conventions in one function.</b> Pick half-open and use it for every range, including your own helper parameters.",
    "<b>A branch that shrinks nothing.</b> In binary search, <code>hi = mid</code> paired with <code>lo = mid</code> can loop forever, one side must move past mid.",
    "<b>Reading <code>a[hi]</code> in a half-open range.</b> <code>hi</code> is one past the end; the last element is <code>a[hi - 1]</code>.",
    "<b>Mutating the collection while looping over it.</b> Indices shift underneath you, iterate a copy, or build a new collection.",
    "<b>Caching <code>len()</code> in a loop that changes the length</b>, or failing to cache it in a BFS level loop. Decide deliberately which you want.",
  ],

  impl: [
    ["Python", "range(lo, hi) · a[lo:hi]", "Both exclusive at the top. Negative indices count from the end; a[-1] is the last."],
    ["Java", "for (int i = lo; i < hi; i++)", "subList(lo, hi) and String.substring(lo, hi) are exclusive at the top too."],
    ["C++", "iterators [begin, end)", "end() points one past the last element and must never be dereferenced."],
    ["JavaScript", "slice(lo, hi) exclusive", "But splice(start, count) takes a COUNT, not an end index, a common mix-up."],
  ],

  code: {
    pseudo: `# CONVENTION: [lo, hi), lo is inside, hi is outside. Always.
#   size    = hi - lo
#   empty   = lo == hi
#   last    = hi - 1
#   split   = [lo, mid) and [mid, hi)

for i from lo to hi - 1:          # touches exactly hi - lo elements
    ...

# INVARIANT FIRST, then the loop writes itself.
# invariant: the answer, if it exists, is always inside [lo, hi)
lo <- 0; hi <- n
while lo < hi:                    # empty means done
    mid <- lo + (hi - lo) / 2
    if tooSmall(a[mid]): lo <- mid + 1     # mid ruled out -> must move PAST it
    else:                hi <- mid         # mid may be the answer -> keep it
# every branch shrinks the range, so it terminates

# invariant: everything before 'slow' is already kept
slow <- 0
for fast from 0 to n - 1:
    if keep(a[fast]):
        a[slow] <- a[fast]
        slow <- slow + 1
return slow                       # = the new length, again with no +1

# The edge cases come from the invariant, not from memory:
#   empty input        -> lo == hi at the start
#   one element        -> the range holds exactly one
#   answer at an edge  -> does the invariant still hold at lo, and at hi - 1?`,
    py: `# range and slicing are already half-open, lean on it
for i in range(lo, hi):        # exactly hi - lo iterations
    ...
window = a[lo:hi]              # exactly hi - lo elements
len(a[lo:hi]) == hi - lo       # always true, even when empty

# invariant: the answer, if any, is inside [lo, hi)
def lower_bound(a, target):
    lo, hi = 0, len(a)
    while lo < hi:
        mid = (lo + hi) // 2
        if a[mid] < target: lo = mid + 1    # mid ruled out
        else:               hi = mid        # mid may be the answer
    return lo

# invariant: everything before 'slow' is kept
def compact(a, keep):
    slow = 0
    for fast in range(len(a)):
        if keep(a[fast]):
            a[slow] = a[fast]; slow += 1
    return slow

# Never mutate what you are iterating
for x in a[:]:                 # loop over a copy
    if drop(x): a.remove(x)`,
    java: `for (int i = lo; i < hi; i++) { ... }        // exactly hi - lo iterations
List<Integer> view = list.subList(lo, hi);   // exclusive at the top
String part = s.substring(lo, hi);           // exclusive at the top

// invariant: the answer, if any, is inside [lo, hi)
static int lowerBound(int[] a, int target) {
    int lo = 0, hi = a.length;
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] < target) lo = mid + 1;   // mid ruled out
        else                 hi = mid;       // mid may be the answer
    }
    return lo;
}

// BFS level loop: freeze the size, because the queue grows inside the loop
for (int i = q.size(); i > 0; i--) { ... }

// Removing while iterating needs the iterator itself
Iterator<Integer> it = list.iterator();
while (it.hasNext()) if (drop(it.next())) it.remove();`,
    cpp: `// The whole standard library is built on [begin, end)
for (int i = lo; i < hi; ++i) { ... }
auto n = end - begin;                  // the size, with no +1
// *end() is undefined behaviour, end is one PAST the last element

int lowerBoundManual(const vector<int>& a, int target) {
    int lo = 0, hi = (int)a.size();
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] < target) lo = mid + 1;
        else                 hi = mid;
    }
    return lo;
}

// Erasing while iterating invalidates iterators; use the returned one
for (auto it = v.begin(); it != v.end(); )
    if (drop(*it)) it = v.erase(it);   // erase returns the next valid iterator
    else           ++it;

// size() is unsigned: (v.size() - 1) on an empty vector is enormous
for (int i = 0; i + 1 < (int)v.size(); ++i) { ... }`,
    js: `for (let i = lo; i < hi; i++) { ... }     // exactly hi - lo iterations
const part = a.slice(lo, hi);            // exclusive at the top
// but splice takes a COUNT, not an end index:
a.splice(lo, hi - lo);

function lowerBound(a, target) {
  let lo = 0, hi = a.length;             // invariant: answer is in [lo, hi)
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (a[mid] < target) lo = mid + 1;   // mid ruled out
    else                 hi = mid;       // mid may be the answer
  }
  return lo;
}

// Never splice inside a forward loop, the indices shift under you
const kept = a.filter(x => !drop(x));    // build a new array instead

// BFS by level: capture the size before the inner loop
const levelSize = q.length - head;`,
  },
  codecap: "One convention and one sentence: half-open ranges everywhere, and the invariant written down before the loop.",

  q: [
    ["What does [lo, hi) mean and what three things does it buy you?", "lo is included, hi is not. Size becomes hi − lo with no +1, an empty range is simply lo == hi, and splitting at mid needs no adjustment because the halves meet exactly."],
    ["Why do array indices start at 0?", "So that an index is an offset from the start, which makes half-open ranges work out: [0, n) covers exactly n elements and the size is n − 0."],
    ["What is a loop invariant?", "A single statement that is true before the loop and still true after every iteration. Each branch's job is to preserve it, which makes correctness checkable locally instead of by simulation."],
    ["An invariant is not enough on its own. What else must you show?", "Termination. Something must strictly decrease each pass. Every infinite loop is a branch that failed to shrink anything."],
    ["In a half-open range, what is the last valid index?", "hi − 1. Reading a[hi] is out of bounds, hi is one past the end, which is why C++ end() must never be dereferenced."],
    ["Where should your edge-case tests come from?", "The invariant: check whether it still holds for an empty range, for a single element, and when the answer sits at the first or last position."],
  ],

  p: [
    [704, "binary-search", "Binary Search, state the invariant first", "E"],
    [34, "find-first-and-last-position-of-element-in-sorted-array", "First & Last Position, two boundaries", "M"],
    [26, "remove-duplicates-from-sorted-array", "Remove Duplicates. Everything before slow is kept", "E"],
    [27, "remove-element", "Remove Element, the same invariant", "E"],
    [189, "rotate-array", "Rotate Array, index arithmetic under a convention", "M"],
    [54, "spiral-matrix", "Spiral Matrix, four moving boundaries at once", "M"],
  ],
},

/* ==================================================================== */
{
  id: "binary-search",
  n: "Binary Search",
  group: "Fundamentals",
  one: "If the data is <b>sorted</b>, one comparison eliminates an entire half. Repeat and n collapses to log n, 1,000,000 items in about 20 looks.",

  plain: `<p>Looking up a name in a phone book, you do not start at page 1. You open the middle, see whether your name comes before or after, and throw away half the book. Then you do it again. Twenty or so opens and you are there, in a book with a million names.</p>
<p>That is binary search, and the reason it works is <b>order</b>. In an unsorted pile, seeing one wrong element tells you nothing about the others. In a sorted one, seeing "the middle is too small" tells you about the middle <i>and everything to its left</i> in a single comparison. Sorting is the price; discarding half per step is what you buy.</p>
<p><b>The bigger idea.</b> Binary search is not really about arrays. It applies to any question where the answer space is ordered and you can ask "is <i>this</i> candidate good enough?". That includes answers you compute rather than store, which is where the harder interview questions live.</p>`,

  why: [
    { t: "One comparison can be worth one item, or half of them",
      d: "In a jumbled pile, checking one item tells you nothing about the others, so you are stuck at O(n). In a sorted list, learning \"the middle is too small\" also tells you every item to its left is too small. Order is what turns one comparison into a bulk decision." },
    { t: "Halving repeatedly is where log n comes from",
      d: "n → n/2 → n/4 → … → 1. The number of halvings is <b>log₂n</b>. A million items need about 20 comparisons. That is not a tweak, it is a different class of algorithm." },
    { t: "The real requirement is a yes/no that flips exactly once",
      d: "\"Sorted\" is just the usual way to get there. What you actually need is a question whose answer is no, no, no, …, yes, yes, yes across the range. Once you see it that way, \"first item ≥ x\" and \"smallest k that works\" are the same algorithm." },
    { t: "So you can search the answer, not the list",
      d: "\"What is the smallest ship capacity that finishes in D days?\" Capacities are ordered, and \"does capacity c finish in time?\" flips from no to yes exactly once. So binary search the <b>capacity</b>, and check each guess with a simple loop. The array is never searched at all, and this is where the harder questions live." },
    { t: "Every bug is the range failing to shrink",
      d: "If some branch can leave both ends where they were, the loop spins forever. Fix it by construction: loop while <code>lo &lt; hi</code>, and move with <code>lo = mid + 1</code> or <code>hi = mid</code>. Now the range provably gets smaller every time." },
  ],

  hing: `<p><b>Ek comparison se kitna faayda?</b> Bikhre hue data mein ek element check karke sirf <b>ek</b> element hatta hai, isliye O(n) hi best hai. Par sorted data mein beech wale se compare karo to <b>aadha data ek hi baar mein</b> udd jaata hai. Yahi poora khel hai.</p>
<p><b>log n kahan se aaya?</b> n → n/2 → n/4 → … → 1. Kitni baar aadha karna pada? n/2^k = 1 → k = <b>log₂n</b>. 10 lakh elements = sirf ~20 steps. Yeh optimisation nahi, <b>growth class ka badalna</b> hai.</p>
<p><b>Asli condition "sorted" nahi hai.</b> Asli condition hai <b>monotonic</b>, ek aisa sawaal jiska jawaab shuru mein false…false ho aur ek point ke baad hamesha true…true. Sorted array to bas ek aasaan tarika hai yeh property paane ka.</p>
<p><b>Sabse bada unlock, answer par binary search.</b> "Minimum capacity kya ho ki D din mein saara saamaan chala jaaye?" Yahan array par search nahi karte. Search <b>answer ki range</b> par hoti hai. Check: "capacity c se D din mein ho jaayega?", yeh monotonic hai (chhoti capacity par false, badi par true). To capacity ko binary search karo. Interview ki hard problems yahin se aati hain.</p>
<p><b>Bug hamesha kyun aata hai?</b> Kyunki range <b>har baar sikudni chahiye</b>. Agar kisi branch mein <code>lo</code> aur <code>hi</code> dono waise ke waise reh gaye, to infinite loop. Isliye structure hi aisa rakho: <code>while lo &lt; hi</code>, aur <code>lo = mid + 1</code> / <code>hi = mid</code>. Ab range har iteration mein pakka chhoti hoti hai.</p>
<p><b>Overflow wali baat (Java/C++ mein important):</b> <code>(lo + hi) / 2</code> bada ho kar overflow kar sakta hai. <code>lo + (hi - lo) / 2</code> likho. Python mein integers unlimited hain isliye dikkat nahi, par interview mein yeh bolna acha impression deta hai.</p>
<p><b>Loop se pehle invariant bolo:</b> "answer hamesha <code>[lo, hi]</code> ke andar hai". Har branch ko yeh sach rakhna hai. Bas, off-by-one errors khud khatam ho jaate hain.</p>`,

  viz: ["binary-search"],
  see: [["VA", "https://visualgo.net/en/bst", "VisuAlgo, ordered search, animated"],
        ["GFG", "https://www.geeksforgeeks.org/binary-search/", "GFG, binary search, all variants"]],

  math: [
    { t: "Where log n comes from, as one equation", d: "Each comparison halves the surviving range, so the question is how many halvings reduce n to one. Solve it and the famous number falls out.", w:
`after k steps the range holds  n / 2^k  items
stop when   n / 2^k = 1
            2^k = n
            k = log2 n

n = 1,000              10 steps
n = 1,000,000          20
n = 1,000,000,000      30
n = 10^18              60

doubling the input adds exactly one step` },
    { t: "When the sort pays for itself", d: "Binary search is not free: something had to sort the data. The break-even point is a short calculation and it is lower than most people guess.", w:
`q queries over n items

scan every time:     q x n
sort once, then q binary searches:  n log2 n + q log2 n

n = 10^6, q = 1        10^6       vs  2.0 x 10^7   scan wins
n = 10^6, q = 20       2 x 10^7   vs  2.0 x 10^7   level
n = 10^6, q = 1,000    10^9       vs  2.0 x 10^7   search wins

break-even is at about q = log2 n queries` },
    { t: "The midpoint, and the one assignment that hangs", d: "Floor division puts mid strictly below hi and at or above lo. Everything about termination follows from those two facts.", w:
`mid = lo + (hi - lo) / 2      lo <= mid < hi, always

the dangerous case is a range of size 1 or 2
[lo, hi) with hi = lo + 1  ->  mid = lo

  lo = mid + 1   ->  lo = hi, loop ends       fine
  hi = mid       ->  hi = lo, loop ends       fine
  lo = mid       ->  nothing changed          hangs

so every branch must exclude mid from the next range` },
    { t: "Searching the answer instead of the array", d: "The array was never the requirement. A monotone yes/no over a numeric range is, and the range can be values rather than indices.", w:
`search over [1, 10^9] instead of over an array
steps: log2(10^9) = 30

each step runs a feasibility check costing O(n)
total: 30 x n, and at n = 10^5 that is 3 x 10^6

the check must flip exactly once:
  false false false true true true
one flip. Two flips and the halving is meaningless.` },
    { t: "The rotated array still halves", d: "A rotated sorted array is not sorted, but at any midpoint one of the two halves is, and that is enough to discard a half per comparison.", w:
`[4, 5, 6, 7, 0, 1, 2]   lo = 0, hi = 6, mid = 3, a[mid] = 7

a[lo] = 4 <= a[mid] = 7   ->  the left half is sorted
target = 1: is 4 <= 1 < 7?  no  ->  discard the left half

range 7 -> 3 -> 1 on the same rule: still O(log n)
duplicates break it: [1,1,1,0,1] cannot tell which side
is sorted, and degrades to O(n)` },
  ],

  costs: [
    ["search in a sorted array", "O(log n)", "each comparison halves the candidates"],
    ["sort first, then search once", "O(n log n)", "only worth it if you will query many times"],
    ["first / last occurrence", "O(log n)", "same loop, different tie-breaking branch"],
    ["binary search on the answer", "O(n log(range))", "log(range) iterations × an O(n) feasibility check"],
    ["on a linked list", "O(n)", "no O(1) middle, the whole premise fails"],
    ["space", "O(1)", "iterative; O(log n) if written recursively"],
  ],

  traps: [
    "<b>Infinite loop.</b> Caused by a branch that does not shrink the range. Use <code>lo &lt; hi</code> with <code>lo = mid+1</code> / <code>hi = mid</code>.",
    "<b>Integer overflow on <code>(lo+hi)/2</code></b> in fixed-width languages (Java, C++, Go). Write <code>lo + (hi-lo)/2</code>.",
    "<b>Returning any match when the first is required.</b> For duplicates, do not stop at the first hit, keep shrinking toward the boundary.",
    "<b>Forgetting to verify monotonicity</b> before binary searching on an answer. If the predicate flips back and forth, the result is meaningless.",
    "<b>Using it on unsorted data.</b> It will return a confident, wrong answer rather than fail loudly.",
  ],

  impl: [
    ["Python", "bisect.bisect_left / bisect_right", "No overflow risk (arbitrary-precision ints). bisect_left = first index ≥ x."],
    ["Java", "Arrays.binarySearch / Collections.binarySearch", "Returns -(insertionPoint)-1 when absent, not -1. Use lo+(hi-lo)/2."],
    ["C++", "std::lower_bound / upper_bound", "lower_bound = first ≥ x. On a std::list it is O(n), iterators are not random-access."],
    ["JavaScript", "no built-in", "Hand-roll it; Math.floor((lo+hi)/2) is safe up to 2^53."],
  ],

  code: {
    pseudo: `# The only template you need. State the invariant, then never break it.
# INVARIANT: if an answer exists, it lies inside [lo, hi].

function lower_bound(a, target):        # first index with a[i] >= target
    lo <- 0
    hi <- length(a)                     # note: n, not n-1 (half-open range)
    while lo < hi:                      # strict <, so the range must shrink
        mid <- lo + (hi - lo) / 2       # avoids overflow in fixed-width ints
        if a[mid] < target:
            lo <- mid + 1               # mid is ruled out -> +1
        else:
            hi <- mid                   # mid may BE the answer -> keep it
    return lo                           # lo == hi == the boundary

# Binary search on the ANSWER, the generalisation
function min_feasible(low, high, feasible):
    while low < high:
        mid <- low + (high - low) / 2
        if feasible(mid): high <- mid   # good -> try smaller
        else:             low <- mid + 1
    return low`,
    py: `# Classic exact match
def search(a, t):
    lo, hi = 0, len(a) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if a[mid] == t: return mid
        if a[mid] < t:  lo = mid + 1
        else:           hi = mid - 1
    return -1

# Boundary form, prefer this one, it generalises
def lower_bound(a, t):            # first index with a[i] >= t
    lo, hi = 0, len(a)
    while lo < hi:
        mid = (lo + hi) // 2
        if a[mid] < t: lo = mid + 1
        else:          hi = mid
    return lo

import bisect
bisect.bisect_left(a, t)          # same thing, from the stdlib

# Binary search on the ANSWER
def min_capacity(weights, days):
    def ok(cap):
        d, cur = 1, 0
        for w in weights:
            if cur + w > cap: d, cur = d + 1, 0
            cur += w
        return d <= days
    lo, hi = max(weights), sum(weights)
    while lo < hi:
        mid = (lo + hi) // 2
        if ok(mid): hi = mid
        else:       lo = mid + 1
    return lo`,
    java: `// Boundary form, first index with a[i] >= t
static int lowerBound(int[] a, int t) {
    int lo = 0, hi = a.length;
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;      // NOT (lo+hi)/2, overflow
        if (a[mid] < t) lo = mid + 1;
        else            hi = mid;
    }
    return lo;
}

// Built-in: returns -(insertionPoint)-1 when absent
int i = Arrays.binarySearch(a, t);
int insertAt = i >= 0 ? i : -i - 1;

// Binary search on the answer
static int minCapacity(int[] w, int days) {
    int lo = Arrays.stream(w).max().getAsInt();
    int hi = Arrays.stream(w).sum();
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (feasible(w, mid, days)) hi = mid;
        else                        lo = mid + 1;
    }
    return lo;
}`,
    cpp: `// Boundary form
int lower_bound_manual(const vector<int>& a, int t) {
    int lo = 0, hi = (int)a.size();
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;      // avoid overflow
        if (a[mid] < t) lo = mid + 1;
        else            hi = mid;
    }
    return lo;
}

// Built-ins (random-access iterators only!)
auto it = lower_bound(a.begin(), a.end(), t);   // first >= t
auto jt = upper_bound(a.begin(), a.end(), t);   // first  > t
int idx = it - a.begin();

// Binary search on the answer
int lo = *max_element(w.begin(), w.end());
int hi = accumulate(w.begin(), w.end(), 0);
while (lo < hi) {
    int mid = lo + (hi - lo) / 2;
    if (feasible(w, mid, days)) hi = mid; else lo = mid + 1;
}`,
    js: `// Boundary form, first index with a[i] >= t
function lowerBound(a, t) {
  let lo = 0, hi = a.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;        // >>1 is fine below 2^31
    if (a[mid] < t) lo = mid + 1;
    else            hi = mid;
  }
  return lo;
}

// Exact match
function search(a, t) {
  let lo = 0, hi = a.length - 1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (a[mid] === t) return mid;
    if (a[mid] < t) lo = mid + 1; else hi = mid - 1;
  }
  return -1;
}

// Binary search on the answer
function minFeasible(low, high, ok) {
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (ok(mid)) high = mid; else low = mid + 1;
  }
  return low;
}`,
  },
  codecap: "Learn the boundary form (lo < hi, hi = mid), not the exact-match form. It generalises to first/last occurrence and to searching the answer space.",

  q: [
    ["Why does binary search need sorted data?", "Because one comparison must rule out many candidates. Order guarantees that everything on one side of the middle is also on the wrong side; without it a comparison eliminates only that one element."],
    ["Where does log n come from?", "The candidate count halves each step: n → n/2 → … → 1. Solving n/2^k = 1 gives k = log₂n."],
    ["What is the real precondition, more general than 'sorted'?", "A monotonic predicate, false…false then true…true across the search space. Sorted order is just one way to obtain it."],
    ["What is 'binary search on the answer'?", "Searching the range of possible answers instead of the array, using a monotonic feasibility check. Cost is O(log(range)) iterations × the cost of one check."],
    ["Why do binary searches loop forever, and what fixes it structurally?", "A branch that leaves lo and hi unchanged. Using while lo < hi with lo = mid+1 and hi = mid guarantees the interval shrinks every iteration."],
    ["Why write mid = lo + (hi-lo)/2?", "In fixed-width integer languages lo+hi can overflow. Python is immune, but Java/C++/Go are not. This was a real JDK bug for nine years."],
  ],

  p: [
    [704, "binary-search", "Binary Search", "E"],
    [35, "search-insert-position", "Search Insert Position, lower bound", "E"],
    [34, "find-first-and-last-position-of-element-in-sorted-array", "First & Last Position", "M"],
    [153, "find-minimum-in-rotated-sorted-array", "Min in Rotated Sorted Array", "M"],
    [875, "koko-eating-bananas", "Koko Eating Bananas, search the answer", "M"],
    [1011, "capacity-to-ship-packages-within-d-days", "Ship Capacity, search the answer", "M"],
  ],
},

/* ==================================================================== */
{
  id: "linked-list",
  n: "Linked List",
  group: "Data structures",
  one: "Give up the requirement that items sit next to each other, and inserting anywhere you already stand becomes <b>O(1)</b>, but reaching position i now costs i steps.",

  plain: `<p>An array keeps everything in one unbroken block, which is what makes <code>a[i]</code> instant and what makes inserting in the middle expensive. A linked list makes the opposite trade.</p>
<p>Each item becomes a <b>node</b>: a value, plus the address of the next node. The nodes can live anywhere in memory, in any order. The only thing holding the sequence together is the chain of addresses.</p>
<p>So splicing something in is just rewriting two of those addresses, no shifting, no copying, no resizing. And getting to the fiftieth item means following forty-nine arrows, because there is no arithmetic that can jump there.</p>
<p><b>Analogy.</b> A treasure hunt. Each clue tells you where the next clue is. Adding a new stop is easy, rewrite one clue and slip yours in. But there is no way to skip to clue 50; you walk the whole trail.</p>`,

  why: [
    { t: "Ask what contiguity was costing us", d: "An array is fast to index precisely because everything is packed together, and expensive to insert into for exactly the same reason. So the question is: what if we drop that requirement entirely?" },
    { t: "Then every item has to say where the next one is", d: "Without a fixed layout, position can no longer be computed, so it must be <b>stored</b>. Each node becomes value + next-address. The order lives in the pointers, not in the memory layout." },
    { t: "What you buy: rewiring instead of shifting", d: "To insert between two nodes you point the new node at the second and the first at the new node. <b>Two writes, O(1)</b>, regardless of list length, and no reallocation ever, because nothing needs to be contiguous." },
    { t: "What you pay: no address arithmetic", d: "Reaching position i means following i pointers, <b>O(n)</b>, and binary search becomes impossible because there is no cheap way to find the middle. You also pay one pointer of memory per node, and every hop lands somewhere unrelated in memory, so the cache cannot help you. The constant factor is genuinely worse than the Big-O suggests." },
    { t: "So the O(1) insert has a condition attached", d: "It is O(1) only once you are <i>already holding</i> the node. Insert at a given index is O(n) to walk there plus O(1) to rewire. That distinction is what interview questions are built on. The problem is shaped so that you arrive at the right node by other means: a fast pointer, a previous pointer, a hash map." },
    { t: "A dummy head deletes half the bugs", d: "Most linked-list bugs are the special case \"what if it is the head?\". Put one throwaway node in front of the real list and the head stops being special. Every node now has a node before it, and you return <code>dummy.next</code> at the end." },
    { t: "Reversal is the archetype, and it needs three pointers", d: "The moment you point <code>curr.next</code> backwards, you have destroyed your only route forward. So the loop is always: <b>save next, flip, advance</b>. Everyone who writes it with two pointers loses the rest of the list." },
  ],

  hing: `<p><b>Array ki dikkat kya thi?</b> Sab kuch ek saath, judaa hua rakhna padta hai. Isi wajah se <code>a[i]</code> turant milta hai, aur isi wajah se beech mein kuch daalna mehnga hai. Linked list ne bilkul <b>ulta sauda</b> kiya hai.</p>
<p><b>Naya idea:</b> har item ab ek <b>node</b> hai, value, aur agle node ka <b>pata (address)</b>. Nodes memory mein kahin bhi pade ho sakte hain, kisi bhi order mein. Sequence ko sirf yeh arrows jod kar rakhte hain.</p>
<p><b>Faayda:</b> beech mein insert karna matlab sirf <b>do pointers</b> badalna. Kuch khisakna nahi, kuch copy nahi, <b>O(1)</b>.</p>
<p><b>Nuksan:</b> ab position <b>calculate</b> nahi hoti, isliye i-th node tak pahunchne ke liye i arrows follow karne padte hain, <b>O(n)</b>. Binary search yahan possible hi nahi, kyunki beech wala node sasta mein milta hi nahi. Upar se har node ka apna pointer memory khaata hai aur har hop memory mein kahin door jaata hai, to <b>cache</b> madad nahi kar pata. Practically array se dheema hai, chahe Big-O barabar dikhe.</p>
<p><b>Yeh baat sabse zaroori hai:</b> insert O(1) tabhi hai jab tum <b>us node par pehle se khade ho</b>. "i-th position par insert karo" to O(n) hi hai, chalna to padega. Interview problems isi cheez par bani hoti hain. Woh aise design hoti hain ki tum sahi node tak kisi aur tareeke se pahunch jao: fast pointer, prev pointer, ya hash map.</p>
<p><b>Dummy head ka jugaad:</b> aadhe bugs sirf isliye aate hain ki "agar head hi delete karna ho to?". Ek nakli node list ke aage laga do, ab head special nahi raha, har node ka ek previous hai. Aakhir mein <code>dummy.next</code> return kar do. Bahut saare if-else khatam.</p>
<p><b>Reverse karna (yeh zaroor samajhna):</b> jaise hi tumne <code>curr.next</code> ko peeche modha, aage jaane ka raasta khatam. Isliye har step mein teen kaam, isi order mein, <b>next ko save karo, arrow palto, aage badho</b>. Do pointers se likhoge to baaki list gum ho jaayegi. Aur end mein <b>prev</b> return karna hai, <b>curr</b> nahi, curr to null par khada hai.</p>`,

  viz: ["linked-list", "linked-list-reverse"],
  see: [["VA", "https://visualgo.net/en/list", "VisuAlgo, linked list operations, animated"]],

  math: [
    { t: "The trade, priced on both sides", d: "Giving up contiguity is not a win, it is an exchange. Two columns, and the right structure is whichever column matches the operation you actually do most.", w:
`n = 1,000,000

                          array        linked list
read a[i]                 1 op         i hops
insert at the front       n shifts     1 rewire
insert where you stand    n shifts     1 rewire
find, then insert         log n + n    n + 1
bytes per int             4            4 + 8 pointer = 12+
cache misses on a scan    n / 16       n` },
    { t: "The O(1) insert has a condition attached", d: "Rewiring is constant. Getting to the place where you rewire is not, and if you restart from the head every time the constant is irrelevant.", w:
`insert after a node you already hold:      O(1)
insert after the k-th node, from the head: k hops

do that n times at the middle, from the head each time:
  n x n/2 = n^2 / 2 hops
  n = 100,000  ->  5 x 10^9

the O(1) is real only while you are already standing there` },
    { t: "Floyd: why the two pointers must meet", d: "Once both are inside the cycle, the fast one closes the distance by exactly one node per step. A gap that falls by one cannot be stepped over.", w:
`slow moves 1, fast moves 2, so fast gains 1 per step

let the gap from fast to slow, measured around the cycle,
be g. Each step: g -> g - 1. It cannot skip zero.
so they meet within L steps, where L = cycle length

no cycle: fast reaches null first, in n/2 steps` },
    { t: "And why the second pointer starts at the head", d: "The place they meet is not arbitrary. Write down both distances travelled and the rule for finding the cycle entrance drops out in two lines.", w:
`m = nodes before the cycle,  L = cycle length
a = steps into the cycle where they meet

slow walked   m + a
fast walked   2(m + a),  and also  m + a + kL

  2(m + a) = m + a + kL
      m + a = kL
          m = kL - a

so from the meeting point, m more steps land on the entrance.
Walk one pointer from the head and one from the meeting
point, one step each, and they collide there.` },
    { t: "Finding the middle, and the guard that the count forces", d: "Fast travels twice as far, so it finishes in half the steps, and wherever it stops slow is halfway. The only care needed is the parity.", w:
`n = 4, indices 0 1 2 3

fast:  0 -> 2 -> 4 (past the end)
slow:  0 -> 1 -> 2        lands on the SECOND middle

n = 5:  fast 0 -> 2 -> 4, slow 0 -> 1 -> 2   the true middle

so the loop guard is (fast and fast.next), two checks.
Testing only fast.next dereferences null on even n.` },
  ],

  costs: [
    ["access position i", "O(n)", "follow i pointers; no arithmetic shortcut"],
    ["insert / delete at a node you hold", "O(1)", "rewrite two pointers, nothing shifts"],
    ["insert / delete at index i", "O(n)", "O(n) to walk there, then O(1) to rewire"],
    ["insert at head", "O(1)", "the one position that is always cheap"],
    ["search for a value", "O(n)", "no order to exploit, no binary search"],
    ["memory", "O(n) + a pointer per node", "plus poor cache locality, worse in practice than the Big-O"],
  ],

  traps: [
    "<b>Reversing with two pointers.</b> You must save <code>next</code> before flipping <code>curr.next</code>, or the rest of the list is unreachable.",
    "<b>Returning the wrong node after a reversal.</b> The loop ends with <code>curr</code> at null, return <code>prev</code>.",
    "<b>Not guarding <code>fast</code> and <code>fast.next</code></b> before stepping two at a time. This is the standard null-pointer crash.",
    "<b>Special-casing the head with if-else.</b> Use a dummy node instead; it removes the branch entirely.",
    "<b>Looping forever on a cycle.</b> If the list may loop, you cannot rely on reaching null, detect it with fast and slow pointers first.",
  ],

  impl: [
    ["Python", "hand-rolled class Node", "No built-in singly linked list. deque is a doubly linked list of blocks, not the same thing."],
    ["Java", "hand-rolled ListNode", "java.util.LinkedList exists and is doubly linked, but interviews want your own node."],
    ["C++", "hand-rolled, or std::forward_list", "forward_list is singly linked; std::list is doubly linked. Delete nodes you allocated."],
    ["JavaScript", "plain objects {val, next}", "No built-in. null vs undefined for the tail, pick one and be consistent."],
  ],

  code: {
    pseudo: `# A node is a value plus the address of the next node. That is the whole type.
node: { val, next }

# Walk it, the only way to reach anything
curr <- head
while curr is not null:
    visit(curr.val)
    curr <- curr.next

# REVERSE, save, flip, advance. Three pointers, never two.
prev <- null
curr <- head
while curr is not null:
    next <- curr.next        # 1. save it BEFORE you break the link
    curr.next <- prev        # 2. flip the arrow
    prev <- curr             # 3. advance both
    curr <- next
return prev                  # curr is null now; prev is the new head

# DUMMY HEAD, makes the head stop being a special case
dummy <- new node(next = head)
prev  <- dummy
while prev.next is not null:
    if shouldDelete(prev.next): prev.next <- prev.next.next
    else:                       prev <- prev.next
return dummy.next

# FAST AND SLOW, the middle, and cycle detection, in one pass and O(1) space
slow <- head; fast <- head
while fast is not null and fast.next is not null:
    slow <- slow.next
    fast <- fast.next.next
# slow is now the middle; if slow ever equals fast, there is a cycle`,
    py: `class Node:
    def __init__(self, val, next=None):
        self.val, self.next = val, next

def reverse(head):                  # O(n) time, O(1) space
    prev, curr = None, head
    while curr:
        nxt = curr.next             # save BEFORE breaking the link
        curr.next = prev            # flip
        prev, curr = curr, nxt      # advance
    return prev                     # NOT curr

def remove_value(head, target):     # dummy head kills the "is it the head?" case
    dummy = Node(0, head)
    prev = dummy
    while prev.next:
        if prev.next.val == target: prev.next = prev.next.next
        else:                       prev = prev.next
    return dummy.next

def middle(head):                   # fast and slow, one pass
    slow = fast = head
    while fast and fast.next:
        slow, fast = slow.next, fast.next.next
    return slow

def merge_sorted(a, b):             # the other classic: two lists, one walk
    dummy = tail = Node(0)
    while a and b:
        if a.val <= b.val: tail.next, a = a, a.next
        else:              tail.next, b = b, b.next
        tail = tail.next
    tail.next = a or b
    return dummy.next`,
    java: `class ListNode {
    int val; ListNode next;
    ListNode(int val) { this.val = val; }
    ListNode(int val, ListNode next) { this.val = val; this.next = next; }
}

static ListNode reverse(ListNode head) {
    ListNode prev = null, curr = head;
    while (curr != null) {
        ListNode nxt = curr.next;   // save BEFORE breaking the link
        curr.next = prev;           // flip
        prev = curr; curr = nxt;    // advance
    }
    return prev;
}

static ListNode removeValue(ListNode head, int target) {
    ListNode dummy = new ListNode(0, head), prev = dummy;
    while (prev.next != null) {
        if (prev.next.val == target) prev.next = prev.next.next;
        else                         prev = prev.next;
    }
    return dummy.next;
}

static ListNode middle(ListNode head) {
    ListNode slow = head, fast = head;
    while (fast != null && fast.next != null) {   // guard BOTH
        slow = slow.next; fast = fast.next.next;
    }
    return slow;
}`,
    cpp: `struct ListNode {
    int val; ListNode* next;
    ListNode(int v, ListNode* n = nullptr) : val(v), next(n) {}
};

ListNode* reverse(ListNode* head) {
    ListNode *prev = nullptr, *curr = head;
    while (curr) {
        ListNode* nxt = curr->next;   // save BEFORE breaking the link
        curr->next = prev;            // flip
        prev = curr; curr = nxt;      // advance
    }
    return prev;
}

ListNode* removeValue(ListNode* head, int target) {
    ListNode dummy(0, head);
    ListNode* prev = &dummy;
    while (prev->next) {
        if (prev->next->val == target) {
            ListNode* dead = prev->next;
            prev->next = dead->next;
            delete dead;              // you allocated it, you free it
        } else prev = prev->next;
    }
    return dummy.next;
}

ListNode* middle(ListNode* head) {
    ListNode *slow = head, *fast = head;
    while (fast && fast->next) { slow = slow->next; fast = fast->next->next; }
    return slow;
}`,
    js: `// A node is just an object; there is no built-in list.
const node = (val, next = null) => ({ val, next });

function reverse(head) {
  let prev = null, curr = head;
  while (curr) {
    const nxt = curr.next;      // save BEFORE breaking the link
    curr.next = prev;           // flip
    prev = curr; curr = nxt;    // advance
  }
  return prev;
}

function removeValue(head, target) {
  const dummy = node(0, head);
  let prev = dummy;
  while (prev.next) {
    if (prev.next.val === target) prev.next = prev.next.next;
    else                          prev = prev.next;
  }
  return dummy.next;
}

function middle(head) {
  let slow = head, fast = head;
  while (fast && fast.next) { slow = slow.next; fast = fast.next.next; }
  return slow;
}`,
  },
  codecap: "Reverse, dummy head, and fast/slow are the three moves nearly every linked-list question is assembled from.",

  q: [
    ["What is the trade a linked list makes, in one sentence?", "It gives up contiguous memory, losing O(1) indexing and binary search, to gain O(1) insert and delete at a node you are already holding, with no shifting or reallocation."],
    ["Why does reversal need three pointers?", "Flipping curr.next overwrites the only reference to the rest of the list, so next must be saved before the flip. The loop is save, flip, advance."],
    ["After the reversal loop, why return prev and not curr?", "The loop exits when curr becomes null, having walked off the end. prev is left pointing at the last node visited, which is the new head."],
    ["What does a dummy head node buy you?", "Every real node gains a previous node, so deleting or inserting at the head stops being a special case. You return dummy.next at the end."],
    ["Insert is O(1), so why is 'insert at index i' O(n)?", "The O(1) is only the rewiring. Getting to index i still means following i pointers, because position cannot be computed."],
    ["Insert at a node is O(1). Why is that claim only half true?", "The rewiring is two writes, so it really is O(1), but only once you are already holding the node. Insert at index i costs O(n) to walk there first. Interview problems are shaped so you arrive at the node by other means: a fast pointer, a previous pointer, a hash map."],
  ],

  p: [
    [206, "reverse-linked-list", "Reverse Linked List, the archetype", "E"],
    [21, "merge-two-sorted-lists", "Merge Two Sorted Lists, dummy head", "E"],
    [876, "middle-of-the-linked-list", "Middle of the Linked List, fast & slow", "E"],
    [141, "linked-list-cycle", "Linked List Cycle", "E"],
    [19, "remove-nth-node-from-end-of-list", "Remove Nth From End, gap of n", "M"],
    [2, "add-two-numbers", "Add Two Numbers, carry along the walk", "M"],
    [143, "reorder-list", "Reorder List, middle, reverse, merge", "M"],
  ],
},

/* ==================================================================== */
{
  id: "binary-tree",
  n: "Binary Tree",
  group: "Data structures",
  one: "Every node is itself the root of a smaller tree, so almost every tree problem is the same three lines: <b>solve the left, solve the right, combine</b>.",

  plain: `<p>Take a linked list and give each node <b>two</b> next-pointers instead of one. That is a binary tree. The consequence is out of all proportion to the change. Instead of a line you get branching, and the number of nodes you can reach doubles with every step down.</p>
<p>That is why trees are shallow. A million nodes arranged in a line is a million steps deep; the same million arranged as a balanced tree is about twenty. Every fast tree operation is really just "the depth is small".</p>
<p>The second consequence is structural. A node's left child is itself a perfectly good tree. So any solution that works for the whole thing works for the part. That is why tree code is almost always recursive, and almost always short.</p>
<p><b>Analogy.</b> An org chart. Any manager, taken with everyone below them, is a smaller org chart with the same shape. "How many people are under you?" is answered the same way at every level: ask both reports, add one for yourself.</p>`,

  why: [
    { t: "One extra pointer changes the geometry", d: "One next-pointer per node gives you a line of length n. Two gives you branching, and level d can hold 2<sup>d</sup> nodes. Turned around: n nodes only need <b>log₂n levels</b>. Depth is the resource trees are cheap in." },
    { t: "The structure is self-similar, so the code is recursive", d: "A child is not a piece of a tree. It <b>is</b> a tree. So the recipe is always the same: assume the left and right subtrees are already solved, then combine their answers with this node's value. The base case is the empty node, which is why every tree function starts by checking for null." },
    { t: "The three depth-first orders are one algorithm, reordered", d: "Visit the node <i>before</i> recursing (<b>pre-order</b>), <i>between</i> the two calls (<b>in-order</b>), or <i>after</i> both (<b>post-order</b>). Same three lines, three positions. Choose by dependency: pre-order when children need the parent's answer, post-order when the parent needs the children's." },
    { t: "Depth-first versus breadth-first is a choice of container", d: "DFS rides the call stack and naturally answers path-shaped questions. Swap the stack for a <b>queue</b> and the same walk becomes BFS, visiting level by level. That is the shape you need for \"minimum depth\", for anything per level, and for anything about distance from the root." },
    { t: "Every cost is O(h), and h is not free", d: "Search, insert and delete all walk one root-to-leaf path, so they cost <b>O(height)</b>. That is O(log n) only while the tree stays bushy. Insert sorted data into an unbalanced tree and it degenerates into a linked list: h = n, and every operation is O(n). Balance is a promise someone has to keep, which is what AVL and red-black trees exist to do." },
    { t: "Space is the height too", d: "A recursive traversal holds one frame per level, so it uses <b>O(h)</b> memory. On a balanced tree that is O(log n) and fine. On a skewed tree it is O(n), which is deep enough to overflow the stack at 10⁵ nodes. BFS instead holds one level at a time, up to O(n/2) nodes at the widest point. Neither is free; they just fail differently." },
  ],

  hing: `<p><b>Ek chhota sa badlav, bahut bada asar.</b> Linked list ke har node ko <b>do</b> pointers de do, bas, binary tree ban gaya. Ab line nahi, <b>branching</b> hai: har level neeche jaane par nodes <b>double</b> ho sakte hain.</p>
<p><b>Isi se sab kuch aata hai.</b> 10 lakh nodes ek line mein = 10 lakh steps gehra. Wahi 10 lakh balanced tree mein = sirf <b>~20</b>. Tree ki saari speed bas ek baat se aati hai: <b>gehrai kam hai</b>.</p>
<p><b>Doosri baat, tree apne aap mein dohraata hai.</b> Kisi node ka left child ek "hissa" nahi hai, woh khud ek <b>poora tree</b> hai. Isliye jo tarika poore tree par chalta hai wahi chhote par bhi chalega. Yahi wajah hai ki tree ka code hamesha <b>recursive</b> aur hamesha chhota hota hai: <i>left solve karo, right solve karo, jodo</i>. Base case hamesha khaali node (null).</p>
<p><b>Teen traversals asal mein ek hi cheez hain.</b> Sirf itna farak hai ki node ko <b>kab</b> visit karte ho. Dono calls se <b>pehle</b>, unke <b>beech</b> mein, ya dono ke <b>baad</b>. Yahi pre-order, in-order aur post-order hain. Kaunsa chuno? Dependency dekho: agar bachchon ko parent ka answer chahiye to pre-order; agar parent ko bachchon ka answer chahiye (jaise height, sum) to <b>post-order</b>.</p>
<p><b>DFS aur BFS ka farak sirf container ka hai.</b> DFS call stack par chalta hai. Usi walk mein stack ki jagah <b>queue</b> laga do, BFS ban gaya, level by level. "Minimum depth", "har level ka answer", "root se distance", yeh sab BFS wale sawaal hain.</p>
<p><b>Sabse zaroori warning:</b> har operation <b>O(h)</b> hai, O(log n) nahi. O(log n) tabhi jab tree <b>balanced</b> ho. Sorted data daal do bina balance kiye, to tree seedhi line ban jaata hai, h = n, aur sab kuch O(n). Interview mein "O(log n)" bolne se pehle sochо ki balance ki guarantee de kaun raha hai.</p>
<p><b>Space bhi height jitni hi hai.</b> Recursive traversal har level ka ek frame rakhta hai → O(h). Skewed tree par 10⁵ nodes matlab stack overflow. BFS ek poora level rakhta hai → sabse chaude point par O(n/2). Dono free nahi hain, bas alag tarike se fail hote hain.</p>`,

  viz: ["tree-traversal"],
  see: [["VA", "https://visualgo.net/en/bst", "VisuAlgo, tree traversals, animated"]],

  math: [
    { t: "Height against node count, at both extremes", d: "Every tree operation is O(h). So the whole question is what h is, and the answer spans five orders of magnitude for the same n.", w:
`a perfect tree of height h holds 2^(h+1) - 1 nodes
  h = 3   ->        15
  h = 19  ->  1,048,575

so for n = 10^6 nodes:
  perfectly balanced   h = 19
  one long chain       h = 999,999

50,000x, for identical data inserted in a different order` },
    { t: "Half the nodes are leaves, which is what BFS pays for", d: "A binary tree is bottom-heavy. That decides the memory of a level-order walk, and it is the reason depth-first is usually the cheaper habit.", w:
`perfect tree, n nodes:
  leaves           = (n + 1) / 2        about half
  bottom 2 levels  = about 3/4 of all nodes

n = 10^6:
  BFS queue at its widest   500,000 nodes
  DFS stack at its deepest       20 frames

same traversal, same output order-of-work, 25,000x memory` },
    { t: "Three orders are one walk, recorded at three different moments", d: "There are not three algorithms. There is one depth-first walk that passes each node three times, and the traversal you get depends on which pass writes it down.", w:
`the walk touches every node 3 times:

  arriving          -> record here = preorder
  between children  -> record here = inorder
  leaving           -> record here = postorder

touches = 3n,  records = n,  so every order is O(n)
and a BST read in-order comes out sorted, by definition` },
    { t: "Time is the node count, space is the depth", d: "These are two different numbers and mixing them up is where tree answers go wrong in interviews.", w:
`T(n) = T(left) + T(right) + O(1)
every node is entered exactly once  ->  O(n) time

space is the deepest pending call, not the node count:
  balanced     O(log n)   20 frames at n = 10^6
  degenerate   O(n)       10^6 frames  ->  overflow

Morris traversal trades that to O(1) by rewiring, at the
cost of temporarily mutating the tree` },
  ],

  costs: [
    ["traverse every node", "O(n)", "each node is visited exactly once"],
    ["search / insert / delete", "O(h)", "one root-to-leaf path; h, not log n"],
    ["h when balanced", "log₂n", "1,000,000 nodes is about 20 levels"],
    ["h when degenerate", "n", "sorted input into an unbalanced tree is a linked list"],
    ["recursive traversal space", "O(h)", "one stack frame per level"],
    ["BFS space", "O(width)", "up to about n/2 nodes on the widest level"],
  ],

  traps: [
    "<b>Forgetting the null base case.</b> Every tree function starts with \"if the node is empty, return the identity\", 0, true, or null.",
    "<b>Confusing height with depth.</b> Height is measured downward from a node to its deepest leaf; depth is measured downward from the root to the node.",
    "<b>Assuming balance.</b> Nothing keeps a plain binary tree bushy; state your answer as O(h) and say what h is in the worst case.",
    "<b>Recursing on a skewed tree with 10⁵ nodes.</b> That is 10⁵ stack frames, go iterative with an explicit stack.",
    "<b>Reading one level in BFS without freezing its size first.</b> Capture the queue length before the inner loop, or you will run into the next level.",
  ],

  impl: [
    ["Python", "class TreeNode / collections.deque for BFS", "Recursion limit ~1000: use an explicit stack on deep trees."],
    ["Java", "TreeNode class / ArrayDeque for BFS", "Check for null before touching left or right; there is no safe navigation."],
    ["C++", "struct TreeNode* / std::queue for BFS", "Nodes are raw pointers unless you use smart pointers; free what you allocate."],
    ["JavaScript", "{val, left, right} objects", "Array.shift() is O(n), use a head index for the BFS queue."],
  ],

  code: {
    pseudo: `node: { val, left, right }

# THE TEMPLATE. Nearly every tree answer is this shape.
solve(node):
    if node is null: return identity        # base case: 0, true, null, …
    L <- solve(node.left)                   # assume it works
    R <- solve(node.right)                  # assume it works
    return combine(node.val, L, R)          # your one honest step

height(node)  = 0 if null else 1 + max(height(left), height(right))

# THE THREE DEPTH-FIRST ORDERS, the same lines, in three positions
pre(node):   visit(node); pre(left);   pre(right)
in(node):    in(left);    visit(node); in(right)     # sorted, on a search tree
post(node):  post(left);  post(right); visit(node)   # children first

# BREADTH-FIRST, swap the call stack for a queue
queue <- [root]
while queue not empty:
    levelSize <- size(queue)                # freeze it, or you spill into level+1
    repeat levelSize times:
        node <- popFront(queue)
        visit(node)
        push(queue, node.left);  push(queue, node.right)   # skipping nulls
    depth <- depth + 1`,
    py: `class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val, self.left, self.right = val, left, right

def height(node):                       # post-order: parent needs the children
    if not node: return 0
    return 1 + max(height(node.left), height(node.right))

def inorder(node, out):                 # sorted output on a search tree
    if not node: return
    inorder(node.left, out); out.append(node.val); inorder(node.right, out)

def is_same(p, q):
    if not p and not q: return True
    if not p or not q:  return False
    return p.val == q.val and is_same(p.left, q.left) and is_same(p.right, q.right)

from collections import deque
def level_order(root):                  # BFS, one list per level
    if not root: return []
    out, q = [], deque([root])
    while q:
        level = []
        for _ in range(len(q)):         # freeze the level size FIRST
            node = q.popleft()
            level.append(node.val)
            if node.left:  q.append(node.left)
            if node.right: q.append(node.right)
        out.append(level)
    return out

def inorder_iter(root):                 # when the tree may be 10^5 deep
    out, st, curr = [], [], root
    while curr or st:
        while curr: st.append(curr); curr = curr.left
        curr = st.pop(); out.append(curr.val); curr = curr.right
    return out`,
    java: `class TreeNode {
    int val; TreeNode left, right;
    TreeNode(int val) { this.val = val; }
}

static int height(TreeNode node) {
    if (node == null) return 0;
    return 1 + Math.max(height(node.left), height(node.right));
}

static void inorder(TreeNode node, List<Integer> out) {
    if (node == null) return;
    inorder(node.left, out); out.add(node.val); inorder(node.right, out);
}

static List<List<Integer>> levelOrder(TreeNode root) {
    List<List<Integer>> out = new ArrayList<>();
    if (root == null) return out;
    Deque<TreeNode> q = new ArrayDeque<>();
    q.offer(root);
    while (!q.isEmpty()) {
        List<Integer> level = new ArrayList<>();
        for (int i = q.size(); i > 0; i--) {      // freeze the level size
            TreeNode node = q.poll();
            level.add(node.val);
            if (node.left != null)  q.offer(node.left);
            if (node.right != null) q.offer(node.right);
        }
        out.add(level);
    }
    return out;
}`,
    cpp: `struct TreeNode {
    int val; TreeNode *left, *right;
    TreeNode(int v) : val(v), left(nullptr), right(nullptr) {}
};

int height(TreeNode* node) {
    if (!node) return 0;
    return 1 + max(height(node->left), height(node->right));
}

void inorder(TreeNode* node, vector<int>& out) {
    if (!node) return;
    inorder(node->left, out); out.push_back(node->val); inorder(node->right, out);
}

vector<vector<int>> levelOrder(TreeNode* root) {
    vector<vector<int>> out;
    if (!root) return out;
    queue<TreeNode*> q; q.push(root);
    while (!q.empty()) {
        vector<int> level;
        for (int i = (int)q.size(); i > 0; --i) {   // freeze the level size
            TreeNode* node = q.front(); q.pop();
            level.push_back(node->val);
            if (node->left)  q.push(node->left);
            if (node->right) q.push(node->right);
        }
        out.push_back(level);
    }
    return out;
}`,
    js: `const leaf = (val, left = null, right = null) => ({ val, left, right });

function height(node) {
  return node ? 1 + Math.max(height(node.left), height(node.right)) : 0;
}

function inorder(node, out = []) {
  if (!node) return out;
  inorder(node.left, out); out.push(node.val); inorder(node.right, out);
  return out;
}

function levelOrder(root) {
  if (!root) return [];
  const out = [], q = [root];
  let head = 0;                            // shift() is O(n); index instead
  while (head < q.length) {
    const levelSize = q.length - head, level = [];
    for (let i = 0; i < levelSize; i++) {
      const node = q[head++];
      level.push(node.val);
      if (node.left)  q.push(node.left);
      if (node.right) q.push(node.right);
    }
    out.push(level);
  }
  return out;
}`,
  },
  codecap: "The null base case, the two recursive calls, and the level-frozen BFS loop cover most tree questions between them.",

  q: [
    ["Why is tree code almost always recursive?", "Because the structure is self-similar: a child is itself a complete tree, so the same function that solves the whole thing solves the part. Assume the subtrees are solved and combine."],
    ["What is the difference between the three depth-first orders?", "Only when the node is visited relative to its two recursive calls: before (pre), between (in), or after (post). Pre-order when children need the parent's result, post-order when the parent needs the children's."],
    ["What changes if you swap the stack for a queue?", "DFS becomes BFS. The walk visits level by level instead of path by path, which is what questions about depth, distance, or per-level results need."],
    ["Tree operations are O(log n). What is wrong with that claim?", "They are O(h). h is log n only if the tree is balanced; a tree built from sorted data degenerates into a line, giving h = n and O(n) operations."],
    ["What is the space cost of a recursive traversal, and when does it bite?", "O(h) stack frames. On a balanced tree that is O(log n), but on a skewed tree with 10⁵ nodes it is 10⁵ frames and will overflow the stack."],
    ["In level-order BFS, why capture the queue size before the inner loop?", "Because the loop pushes the next level onto the same queue. Freezing the size marks where the current level ends."],
  ],

  p: [
    [104, "maximum-depth-of-binary-tree", "Maximum Depth, the template", "E"],
    [100, "same-tree", "Same Tree", "E"],
    [226, "invert-binary-tree", "Invert Binary Tree", "E"],
    [102, "binary-tree-level-order-traversal", "Level Order Traversal, BFS by level", "M"],
    [543, "diameter-of-binary-tree", "Diameter, return one thing, track another", "E"],
    [236, "lowest-common-ancestor-of-a-binary-tree", "Lowest Common Ancestor, and it has its own page", "M"],
    [124, "binary-tree-maximum-path-sum", "Maximum Path Sum", "H"],
  ],
},

/* ==================================================================== */
{
  id: "bst",
  n: "Binary Search Tree",
  group: "Data structures",
  one: "One extra rule turns a tree into a search structure: <b>everything left is smaller, everything right is larger</b>. Lose the balance and you have built a linked list with ceremony.",

  plain: `<p>Binary search is wonderful and needs a sorted array, which is wonderful until something needs inserting, at which point half the array shuffles along to make room.</p>
<p>A search tree keeps the halving and drops the shuffling. Put a middling value at the root, everything smaller in the left subtree, everything larger in the right, and repeat. Now finding a value is the same sequence of decisions binary search makes, except the decisions are baked into the shape instead of recomputed from indices.</p>
<p>Insert costs the same walk, and nothing moves afterwards, because there is no single unbroken block of memory to keep tidy. You have traded array locality for the ability to insert in the middle without apologising to everything after it.</p>
<p>There is one condition, and the whole page hinges on it: the tree has to stay bushy. Nothing in a plain search tree makes that happen.</p>
<p><b>Analogy.</b> A pub quiz where every question is "higher or lower". You get there in about twenty guesses out of a million, provided the person answering is picking sensible midpoints and not counting up from one.</p>`,

  why: [
    { t: "Store the decision instead of recomputing it", d: "Binary search needs an array so it can jump to the middle. A tree cannot jump anywhere, but it can <b>remember</b> what the middle was: the root is the split point, and the two subtrees are the halves. The structure is the search, which is why the code is a walk rather than arithmetic." },
    { t: "The rule is about whole subtrees, not about children", d: "Every value in the left subtree must be smaller than the node, not merely its immediate left child. This distinction is invisible in a diagram and fatal in code. The classic broken validator compares each parent with its child, passes happily, and accepts a tree where a grandchild sits on completely the wrong side." },
    { t: "So validating is a range problem", d: "Walk down carrying a permitted range. The root may be anything; going left tightens the upper bound to the node's value, going right tightens the lower bound. A node outside its inherited range is a violation. Once you see the rule as a range rather than a comparison, the correct check writes itself." },
    { t: "In-order traversal is the invariant read aloud", d: "Left, then node, then right, means smaller things, then this thing, then larger things, at every level. So an in-order walk emits the values in <b>sorted order</b>, and \"kth smallest\" is that walk with a counter and an early exit rather than anything cleverer." },
    { t: "Everything costs O(h), and h is a promise nobody made", d: "Search, insert and delete each follow one root-to-leaf path. On a bushy tree that is log n. Insert already-sorted data and every value goes right. What you have built is a linked list with extra pointers: <b>h = n</b>, and every operation degrades to O(n). Sorted input is not an exotic edge case, it is what most real data looks like on arrival." },
    { t: "Which is the entire reason self-balancing trees exist", d: "AVL and red-black trees do the same job while performing rotations to keep the height near log n. They are not a different idea, they are this idea with the promise actually kept. In interviews you use the balanced version by name; in libraries it is what <code>TreeMap</code> and <code>std::map</code> already are." },
    { t: "Choose it over a hash map only for the ordering", d: "A hash map gives O(1) average and no order whatsoever. A balanced search tree gives O(log n) and keeps everything sorted, which buys range queries, floor and ceiling, predecessor and successor, and ordered iteration. If you never ask an ordered question, you are paying log n for nothing." },
  ],

  variants: [
    { n: "Plain BST", cost: "O(h), and h is whatever you were given",
      idea: "What this page teaches. Nothing keeps it bushy, so the height is a consequence of the insertion order rather than a guarantee.",
      when: "Interviews, where you are asked to implement one, and any case where you control the insertion order.",
      watch: "Sorted input gives h = n. If you built it from sorted data, you built a linked list." },

    { n: "AVL tree", cost: "O(log n) guaranteed, strictly balanced",
      idea: "Store a height at each node and rotate whenever the two subtrees differ by more than one. Rotations are local, at most two per insert.",
      when: "Read-heavy workloads, where the tighter balance pays for the extra rotations.",
      watch: "More rotations on write than a red-black tree, in exchange for a shallower tree on read. Rarely what a library picks." },

    { n: "Red-black tree", cost: "O(log n) guaranteed, loosely balanced",
      idea: "Colour each node red or black and maintain rules that keep the longest path within twice the shortest. Looser than AVL, so fewer rotations.",
      when: "What almost every standard library actually uses, because mixed read and write workloads are the common case.",
      watch: "Nobody expects you to implement one under interview pressure. Name it, say what it guarantees, and use the library." },

    { n: "B-tree and B+ tree", cost: "O(log n) with an enormous base",
      idea: "Let each node hold many keys and many children, so the tree is very wide and only a few levels deep.",
      when: "Databases and filesystems, where a node is sized to one disk page and the cost you care about is the number of reads, not comparisons.",
      watch: "This is the answer to why database indexes are B-trees and not binary trees: the bottleneck is fetching a page, so you want fewer, fatter nodes." },

    { n: "What your language gives you", cost: "O(log n), already balanced",
      idea: "Java TreeMap and TreeSet, C++ std::map and std::set. All red-black trees underneath.",
      when: "Production, always. Range queries, floor and ceiling, ordered iteration.",
      watch: "Python and JavaScript ship nothing equivalent. Python usually reaches for a sorted list plus bisect, or a third-party library." },
  ],

  hing: `<p><b>Shuruaat yahan se karo:</b> binary search ke liye <b>sorted array</b> chahiye, taaki beech wala element turant mil jaaye. Par array mein beech mein kuch daalo to aadha array khisakna padta hai. <b>O(n)</b>.</p>
<p><b>Search tree ka idea:</b> halving rakho, khisakna hatao. Beech wali value ko root banao, chhoti sab left mein, badi sab right mein, aur yahi baat har node par dohrao. Ab dhoondhna wahi decisions hain jo binary search leta hai, bas woh decisions <b>pehle se tree ki shakal mein likhe hue hain</b>.</p>
<p><b>Sabse zaroori baat, aur yahin log galti karte hain:</b> niyam <b>poore subtree</b> par lagta hai, sirf bachche par nahi. Left subtree ka <b>har</b> element node se chhota hona chahiye, sirf uska left child nahi. Isiliye "isValidBST" ka galat solution itna common hai. Woh sirf parent aur child compare karta hai aur khush ho kar pass kar deta hai. Galat jagah baithe grandchild ko woh pakad hi nahi paata.</p>
<p><b>To validate kaise karein?</b> Range leke neeche jao. Root kuch bhi ho sakta hai. Left jaate waqt <b>upper limit</b> chhoti karo, right jaate waqt <b>lower limit</b> badi karo. Jo node apni range se bahar hai, wahi galat hai.</p>
<p><b>In-order traversal (left, node, right)</b> ka matlab hai: pehle chhote, phir yeh, phir bade. Isliye values <b>sorted</b> nikalti hain. Yeh koi ittefaq nahi, yeh wahi invariant hai bol kar sunaya gaya. "Kth smallest" bas isi walk mein ek counter lagana hai.</p>
<p><b>Ab woh baat jo sab bhool jaate hain:</b> har operation <b>O(h)</b> hai, O(log n) nahi. Agar data pehle se <b>sorted</b> aa gaya, to har value right mein jaayegi aur tree ek seedhi line ban jaayega. <b>h = n</b>, sab kuch O(n). Aur sorted data koi ajeeb edge case nahi hai, asli duniya mein data aksar aise hi aata hai.</p>
<p><b>Isiliye AVL aur red-black trees bane hain.</b> Woh koi naya idea nahi hain, bas yahi idea hai jisme rotations se height log n ke aas-paas rakhi jaati hai. Java ka <code>TreeMap</code> aur C++ ka <code>std::map</code> pehle se yahi hain.</p>
<p><b>Aur BST kab lena hai, hash map ke bajaye?</b> Sirf tab jab <b>order</b> chahiye: range query, floor/ceiling, next bada ya pichhla chhota, sorted iteration. Agar yeh kuch nahi chahiye, to hash map O(1) deta hai aur tum bina wajah log n de rahe ho.</p>`,

  viz: ["bst"],
  see: [["VA", "https://visualgo.net/en/bst", "VisuAlgo, insert and delete on a BST"]],

  math: [
    { t: "What the ordering rule buys, compared with the alternatives", d: "A balanced BST matches a sorted array on lookup and beats it on update, which is the only reason to accept the extra pointers.", w:
`n = 1,000,000

                        lookup      insert      in order?
unsorted array          10^6        1           no
sorted array            20          10^6 shift  yes
hash map                1           1           no
balanced BST            20          20          yes

the last row is the only one with three usable columns` },
    { t: "Sorted input is the disaster case, and it is the common case", d: "The degenerate tree is not a contrived adversary. It is what you get from ids, timestamps, or anything already in order.", w:
`insert 1, 2, 3, ..., n into an unbalanced BST
every key becomes a right child: h = n - 1

total insert cost  1 + 2 + ... + n  =  n^2 / 2
n = 100,000  ->  5 x 10^9 comparisons

the same keys shuffled first: h ~ 40, cost ~ 4 x 10^6` },
    { t: "Random order is fine, and here is how fine", d: "Between the two extremes sits the average case, which is a constant factor away from balanced and nowhere near the worst case.", w:
`random insertion order, n keys:
  average node depth   ~ 2 ln n    = 1.39 log2 n
  expected height      ~ 4.31 ln n = 2.99 log2 n

n = 10^6:
  average depth  ~ 28      height ~ 60
  balanced tree:   20              20

random is survivable. Sorted is not. Only one of the two
is something the caller decides for you.` },
    { t: "Validation is a range question, and the parent test fails on it", d: "Comparing each node with its parent checks a local fact. The BST rule is about entire subtrees, so the check has to carry a range down.", w:
`        10
       /  \\
      5    15
          /  \\
         6    20

parent checks: 5 < 10 ok, 15 > 10 ok, 6 < 15 ok, 20 > 15 ok
all four pass, and the tree is invalid: 6 sits in the
right subtree of 10, so it must exceed 10

carry (low, high) instead:
  left of 10   gets (-inf, 10)
  right of 10  gets (10, +inf)
  6 arrives with (10, 15) and is rejected` },
    { t: "In-order is the invariant, read aloud", d: "Because the rule is a range rule, walking left-node-right emits the keys in sorted order. Several separate problems collapse into that one sentence.", w:
`in-order walk of a valid BST is strictly increasing

so:
  validate       one pass, check each key > the previous
  k-th smallest  stop after k emissions   O(h + k)
  successor      the next emission after x
  range [a, b]   prune subtrees that cannot contain it

all O(h) or O(h + output), none of them O(n)` },
  ],

  costs: [
    ["search / insert / delete", "O(h)", "one root-to-leaf path, every time"],
    ["h when balanced", "log n", "what you are promised, not what you are given"],
    ["h after sorted input", "n", "a linked list wearing a tree costume"],
    ["in-order traversal", "O(n)", "emits the values already sorted"],
    ["kth smallest", "O(h + k)", "in-order walk with a counter and an early exit"],
    ["min / max", "O(h)", "walk left forever, or right forever"],
    ["balanced tree (TreeMap, std::map)", "O(log n) guaranteed", "the same idea with rotations keeping the promise"],
  ],

  traps: [
    "<b>Validating with parent and child only.</b> The rule covers whole subtrees, so carry a permitted range down instead. This is the single most common wrong answer to isValidBST.",
    "<b>Assuming balance.</b> A plain BST does nothing to keep itself bushy. Say O(h), then say what h is in the worst case, before the interviewer does.",
    "<b>Forgetting the two-child delete case.</b> Replace the node with its in-order successor (leftmost node of the right subtree), then delete that one instead.",
    "<b>Using the integer limits as the initial range</b> and then meeting a value equal to the limit. Use nullable bounds, or a comparison that treats absent as unbounded.",
    "<b>Reaching for a BST when a hash map would do.</b> Unless you ask an ordered question, you are paying O(log n) for the privilege of nothing.",
  ],

  impl: [
    ["Python", "no built-in tree; use dict, or bisect on a sorted list", "sortedcontainers is the usual third-party answer. Interviews expect the hand-rolled node."],
    ["Java", "TreeMap and TreeSet are red-black trees", "floorKey, ceilingKey, headMap, subMap. This is the ordered map you actually want in production."],
    ["C++", "std::map and std::set are red-black trees", "lower_bound on the container, not the free function. unordered_map is the hash version."],
    ["JavaScript", "nothing built in at all", "Map keeps insertion order, not sorted order. Hand-roll it or keep a sorted array."],
  ],

  code: {
    pseudo: `node: { val, left, right }        # plus the invariant, which is the whole point
# INVARIANT: every value in left  < node.val < every value in right
#            (whole subtrees, not just the immediate children)

search(node, target):
    while node is not null:
        if target == node.val: return node
        node <- (target < node.val) ? node.left : node.right
    return null                       # O(h) comparisons, one path

insert(node, value):
    if node is null: return new node(value)
    if value < node.val: node.left  <- insert(node.left, value)
    else:                node.right <- insert(node.right, value)
    return node

# VALIDATE by carrying a permitted RANGE down, not by comparing neighbours
valid(node, low, high):
    if node is null: return true
    if low is set  and node.val <= low:  return false
    if high is set and node.val >= high: return false
    return valid(node.left,  low,       node.val)     # tighten the upper bound
       and valid(node.right, node.val,  high)         # tighten the lower bound

# IN-ORDER emits sorted values, so kth smallest is a walk with a counter
inorder(node): inorder(node.left); visit(node); inorder(node.right)

# DELETE, and the only case that is awkward
#   no children   -> remove it
#   one child     -> splice the child in
#   two children  -> copy in the in-order successor, then delete the successor`,
    py: `class Node:
    def __init__(self, val): self.val, self.left, self.right = val, None, None

def search(node, target):                 # iterative: O(h) time, O(1) space
    while node:
        if target == node.val: return node
        node = node.left if target < node.val else node.right
    return None

def insert(node, value):
    if not node: return Node(value)
    if value < node.val: node.left  = insert(node.left, value)
    else:                node.right = insert(node.right, value)
    return node

def is_valid(node, low=None, high=None):  # ranges, not neighbour comparisons
    if not node: return True
    if low is not None and node.val <= low:   return False
    if high is not None and node.val >= high: return False
    return (is_valid(node.left, low, node.val) and
            is_valid(node.right, node.val, high))

def kth_smallest(root, k):                # in-order with an early exit
    st, curr = [], root
    while st or curr:
        while curr: st.append(curr); curr = curr.left
        curr = st.pop()
        k -= 1
        if k == 0: return curr.val
        curr = curr.right

def delete(node, value):
    if not node: return None
    if value < node.val:   node.left  = delete(node.left, value)
    elif value > node.val: node.right = delete(node.right, value)
    else:
        if not node.left:  return node.right      # 0 or 1 child
        if not node.right: return node.left
        succ = node.right                          # in-order successor
        while succ.left: succ = succ.left
        node.val = succ.val
        node.right = delete(node.right, succ.val)
    return node`,
    java: `// In production you want the balanced one, which already exists
TreeMap<Integer, String> map = new TreeMap<>();
map.floorKey(x);       // greatest key <= x
map.ceilingKey(x);     // smallest key >= x
map.subMap(lo, hi);    // a range query, which is why you chose a tree

static TreeNode search(TreeNode node, int target) {
    while (node != null) {
        if (target == node.val) return node;
        node = target < node.val ? node.left : node.right;
    }
    return null;
}

static TreeNode insert(TreeNode node, int value) {
    if (node == null) return new TreeNode(value);
    if (value < node.val) node.left  = insert(node.left, value);
    else                  node.right = insert(node.right, value);
    return node;
}

// Integer bounds, so a value equal to MIN_VALUE cannot break it
static boolean isValid(TreeNode node, Integer low, Integer high) {
    if (node == null) return true;
    if (low != null  && node.val <= low)  return false;
    if (high != null && node.val >= high) return false;
    return isValid(node.left, low, node.val)
        && isValid(node.right, node.val, high);
}`,
    cpp: `// std::map and std::set are red-black trees: balanced, ordered, O(log n)
map<int, string> m;
auto it = m.lower_bound(x);      // first key >= x
m.upper_bound(x);                // first key >  x
// use the MEMBER lower_bound, not std::lower_bound, or you get O(n)

TreeNode* search(TreeNode* node, int target) {
    while (node) {
        if (target == node->val) return node;
        node = target < node->val ? node->left : node->right;
    }
    return nullptr;
}

TreeNode* insert(TreeNode* node, int value) {
    if (!node) return new TreeNode(value);
    if (value < node->val) node->left  = insert(node->left, value);
    else                   node->right = insert(node->right, value);
    return node;
}

bool isValid(TreeNode* node, long low = LONG_MIN, long high = LONG_MAX) {
    if (!node) return true;
    if (node->val <= low || node->val >= high) return false;
    return isValid(node->left, low, node->val)
        && isValid(node->right, node->val, high);
}`,
    js: `// There is no built-in ordered map. Map preserves INSERTION order, not sorted order.
const node = (val) => ({ val, left: null, right: null });

function search(root, target) {
  let cur = root;
  while (cur) {
    if (target === cur.val) return cur;
    cur = target < cur.val ? cur.left : cur.right;
  }
  return null;
}

function insert(root, value) {
  if (!root) return node(value);
  if (value < root.val) root.left  = insert(root.left, value);
  else                  root.right = insert(root.right, value);
  return root;
}

function isValid(root, low = null, high = null) {
  if (!root) return true;
  if (low !== null && root.val <= low) return false;
  if (high !== null && root.val >= high) return false;
  return isValid(root.left, low, root.val)
      && isValid(root.right, root.val, high);
}

function kthSmallest(root, k) {
  const st = []; let cur = root;
  while (st.length || cur) {
    while (cur) { st.push(cur); cur = cur.left; }
    cur = st.pop();
    if (--k === 0) return cur.val;
    cur = cur.right;
  }
}`,
  },
  codecap: "Carry a range when validating, walk in-order when you need order, and say O(h) rather than O(log n) unless someone is keeping the tree balanced.",

  q: [
    ["What exactly does the BST invariant say, and what is the common misreading?", "Every value in the left subtree is smaller than the node and every value in the right subtree is larger. The misreading is checking only the immediate children, which accepts trees where a deeper node sits on the wrong side."],
    ["How do you validate a BST correctly?", "Carry a permitted range down the tree. Going left tightens the upper bound to the node's value, going right tightens the lower bound, and any node outside its inherited range is a violation."],
    ["Why does in-order traversal produce sorted output?", "In-order visits smaller, then the node, then larger, and that holds at every level. It is the invariant expressed as a walk rather than a comparison."],
    ["Why is it wrong to say a BST is O(log n)?", "It is O(h). h is log n only when the tree is balanced, and a plain BST never enforces that. Sorted input produces h = n, making every operation O(n)."],
    ["How do you delete a node with two children?", "Replace its value with the in-order successor, the leftmost node of the right subtree, then delete that successor, which by construction has at most one child."],
    ["When should you choose a balanced BST over a hash map?", "When you need order: range queries, floor and ceiling, predecessor and successor, or sorted iteration. Without an ordered question, the hash map's O(1) is strictly better."],
  ],

  p: [
    [700, "search-in-a-binary-search-tree", "Search in a BST, the walk itself", "E"],
    [98, "validate-binary-search-tree", "Validate BST, the range trick", "M"],
    [230, "kth-smallest-element-in-a-bst", "Kth Smallest, in-order with a counter", "M"],
    [235, "lowest-common-ancestor-of-a-binary-search-tree", "LCA in a BST, easier than in a plain tree, and it has its own page", "M"],
    [701, "insert-into-a-binary-search-tree", "Insert into a BST", "M"],
    [450, "delete-node-in-a-bst", "Delete Node, including the awkward case", "M"],
    [108, "convert-sorted-array-to-binary-search-tree", "Sorted Array to BST, balance on purpose", "E"],
  ],
},

/* ==================================================================== */
{
  id: "lca",
  n: "Lowest common ancestor",
  group: "Data structures",
  one: "Recurse to the bottom and let every node report what it found. The one node that hears back from <b>both</b> sides is the answer, and there is exactly one.",

  plain: `<p>Two nodes sit somewhere in a tree. Walk down from the root towards each of them and, for a while, you take the same turns. At some node the two routes disagree for the first time, one goes left and the other goes right. That node is the lowest common ancestor: the last place they were still together.</p>
<p>Every node above it is also an ancestor of both, so "an ancestor of both" is not a strong enough description. The word carrying the meaning is <b>lowest</b>. And notice that if one of the two nodes sits directly above the other, the answer is that node itself, because a node counts as its own ancestor. That sounds like a technicality and it is the single most useful fact on this page.</p>
<p>You could find it by writing down both root-to-node paths and comparing them. That works and costs a second array. The better method never builds a path at all: it walks to the bottom first and lets the answer come back up.</p>
<p><b>Analogy.</b> Two people trace their family tree back through their parents. The first shared name is the answer. You find it not by reading the tree from the top, but by both of you walking upward until you meet.</p>`,

  why: [
    { t: "Say precisely what is being asked", d: "From the root there is exactly one path to each node. The two paths start identically and separate at most once, because a tree has no second route anywhere. So the question is not really about ancestry, it is: <b>where do the two paths stop agreeing?</b>" },
    { t: "The direct method works and costs memory", d: "Record both root-to-node paths, then walk them in step and keep the last node they share. That is correct and it is what most people write first. It costs O(n) time to find each node and O(h) space to hold each path, and it needs two full searches before any comparison can start." },
    { t: "Turn the recursion around", d: "Instead of asking a node what is above it, ask what is <b>below</b> it. Recurse into both children first and let each one report back a single thing: a target it found down there, or nothing at all. This is a post-order traversal, the same shape as computing a height." },
    { t: "Three cases, and only one of them is interesting", d: "A node looks at its two reports. <b>Both non-empty</b>: the targets are in different subtrees, so the paths split right here, and this node is the answer. <b>Exactly one</b>: both targets, or the only one found so far, are on that side, so pass the report up unchanged. <b>Neither</b>: report nothing." },
    { t: "Being your own ancestor removes the hard case", d: "What if one target sits above the other? Define the base case as \"if this node is either target, return it immediately and do not look below\". The recursion then stops at the upper one and returns it, which is the correct answer. People who add a branch for this case usually break the ordinary case doing it." },
    { t: "Only one node can ever see both", d: "Once a node reports itself, every node above it sees exactly one non-empty report and just forwards it. So the answer floats to the root untouched, and no node above can mistake itself for the split point. That is why no extra bookkeeping is needed and the whole thing is six lines." },
    { t: "What one pass cannot do", d: "It assumes both nodes are actually in the tree. If only one is present you get that one back, silently, and the caller believes it. It is also <b>O(n) per query</b>, which is fine once and hopeless for a hundred thousand queries on a fixed tree. That is the case preprocessing exists for." },
  ],

  variants: [
    { n: "Recursive post-order", cost: "O(n) time, O(h) space",
      idea: "The six-line function above. Recurse both ways, return this node if both sides reported, otherwise forward the single report.",
      when: "A general binary tree and one or a few queries. This is the interview answer.",
      watch: "O(h) space is the call stack, and h is n on a skewed tree. It also cannot tell you that a node was absent." },

    { n: "BST walk", cost: "O(h) time, O(1) space",
      idea: "In a search tree the values tell you the way. Walk down from the root; while both targets are smaller go left, while both are larger go right. The first node they straddle is the answer.",
      when: "The tree is a BST. Then there is no reason to recurse at all.",
      watch: "The stopping condition is straddling, which includes the case where the node IS one of the targets. Testing for equality first is redundant." },

    { n: "Parent pointers", cost: "O(h) time, O(1) space",
      idea: "With a parent link on every node, walk both upward. Equalise the depths first, or use the two-runner trick: when one walker hits the root, restart it at the other node, and they meet at the answer.",
      when: "The node objects carry a parent reference, which some versions of the problem hand you.",
      watch: "This is the same trick as finding where two linked lists intersect, because it is literally the same problem." },

    { n: "Binary lifting", cost: "O(n log n) build, O(log n) per query",
      idea: "Precompute, for every node, its ancestor 1, 2, 4, 8 ... steps up. A query lifts the deeper node to the other's depth, then lifts both together by the largest jump that keeps them apart. One more step and they meet.",
      when: "Many queries on one tree that never changes. This is the standard answer.",
      watch: "The second loop must go from the largest jump downwards, and must only jump while the two ancestors differ. Jumping when they match overshoots past the answer." },

    { n: "Euler tour plus range minimum", cost: "O(n log n) build, O(1) per query",
      idea: "Flatten the tree by recording every node as you enter and leave it. The LCA of two nodes is the shallowest node in the stretch between their first appearances, which is a range minimum query.",
      when: "Query cost matters more than build cost, or you already have a sparse table.",
      watch: "Constant factors and the flattening code are both worse than binary lifting. Name it, reach for it rarely." },
  ],

  hing: `<p><b>Sawaal ko theek se samjho.</b> Tree mein root se har node tak <b>sirf ek</b> raasta hota hai. Do nodes ke raaste shuru mein same hote hain, phir ek jagah alag ho jaate hain. Bas wahi jagah answer hai. "Dono ka ancestor" kaafi nahi, kyunki uske upar wale sab bhi ancestor hain. Asli lafz hai <b>lowest</b>.</p>
<p><b>Ulta socho.</b> Node se mat poocho "tere upar kya hai". Poocho <b>"tere neeche kya mila"</b>. Pehle dono bacchon mein utro, phir har node ek hi cheez wapas bhejta hai: ya to koi target jo usne neeche dhoonda, ya kuch nahi. Yeh post-order hai, wahi shape jo height nikalne mein use hota hai.</p>
<p><b>Teen case, aur sirf ek dilchasp.</b> Dono taraf se kuch aaya, matlab targets alag-alag subtree mein hain, to raaste <b>yahin</b> alag hue, yeh node answer hai. Sirf ek taraf se aaya, to woh report upar bhej do. Kuch nahi aaya, to kuch nahi bhejo. Ek baar koi node khud ko report kar de, uske upar wale sabko sirf ek hi report dikhti hai, to woh bas aage badha dete hain. Isliye answer apne aap root tak tair kar aa jaata hai.</p>
<p><b>Yeh line yaad rakho:</b> "agar yeh node khud target hai, to isi ko turant return kar do, neeche mat dekho". Isi ek line se woh case handle ho jaata hai jahan ek node doosre ke upar baitha hai. Log yahan extra if lagate hain aur baaki sab tod dete hain. Aur interview mein bolna: ek query O(n), lekin agar bahut saari queries hain to <b>binary lifting</b>, O(n log n) build aur O(log n) per query.</p>`,

  viz: ["lca"],
  see: [["VA", "https://visualgo.net/en/bst", "VisualGo, walk a tree one node at a time"]],

  math: [
    { t: "The direct method, priced honestly", d: "Storing both root-to-node paths works. In a general binary tree the finding of those paths is itself a full traversal, which is the part people forget to count.", w:
`general binary tree, n nodes, height h

path method:
  find the path to p      O(n)
  find the path to q      O(n)
  compare the prefixes    O(h)
  extra memory            2 x O(h) for the two paths

one recursive pass:
  every node entered once O(n)
  extra memory            O(h), the call stack, nothing else` },
    { t: "Why exactly one node can be the answer", d: "The set of nodes that contain p is not an arbitrary set. It is a chain, and two chains from the root can only overlap in a prefix.", w:
`A = the nodes whose subtree contains p
every element of A is an ancestor of p, so A is the chain
root -> ... -> p, and |A| = depth(p) + 1

B = the same chain for q

A and B both start at the root, so their intersection is
a prefix of both: another chain. Its deepest element is
the LCA. A chain has one deepest element, so the answer
exists and is unique.` },
    { t: "Three cases at every node, and only one of them is the answer", d: "Ask both children what they found. There are four possible replies and the interesting one fires exactly once in the whole tree.", w:
`at node x, after recursing:

  left != null and right != null   ->  x is the LCA
  left != null, right == null      ->  pass left up
  left == null, right != null      ->  pass right up
  both null                        ->  pass null up

the first case fires exactly once across all n nodes,
which is why a single pass is enough` },
    { t: "Many queries change the answer: binary lifting", d: "One pass per query is fine for one query. For 100,000 of them the arithmetic stops working, and the fix is to precompute ancestors at power-of-two distances.", w:
`n nodes, q queries

one pass per query:   q x n
binary lifting:       n log2 n to build, log2 n per query

n = 10^5, q = 10^5:
  10^10             vs   1.7 x 10^6 + 1.7 x 10^6

up[k][v] = the 2^(k)-th ancestor of v, k = 0 .. 17
any jump of distance d is the set bits of d: at most 17 hops` },
  ],

  costs: [
    ["recursive LCA, one query", "O(n) time", "worst case every node is visited once, and it must be, since the tree gives no hint where the targets are"],
    ["recursion space", "O(h)", "one frame per level, so O(log n) balanced and O(n) on a path-shaped tree"],
    ["LCA in a BST", "O(h) time, O(1) space", "the values steer the walk, so there is nothing to recurse into and nothing to remember"],
    ["path comparison method", "O(n) time, O(h) space", "two searches plus two stored paths, correct and strictly more machinery"],
    ["binary lifting, build", "O(n log n) time and space", "one row per power of two, each row read straight off the row below it"],
    ["binary lifting, query", "O(log n)", "at most one jump per bit of the depth difference, then one paired descent"],
    ["q queries, no preprocessing", "O(q · n)", "the number that decides whether preprocessing is worth it, and the constraints will tell you"],
  ],

  traps: [
    "<b>Comparing values instead of nodes.</b> The classic version hands you node references. With duplicate values in the tree, comparing <code>node.val == p.val</code> finds the wrong node and the wrong answer.",
    "<b>Adding a special case for \"one is the ancestor of the other\".</b> The base case already handles it. The extra branch is where the bug goes.",
    "<b>Returning early from the left recursion.</b> Both sides must be explored before deciding. Returning as soon as the left side reports something skips the split point entirely.",
    "<b>Assuming both nodes exist.</b> If one is missing you get the other one back and nothing complains. If absence is possible, count the matches on the way up and check the count at the end.",
    "<b>Using the BST walk on a plain binary tree.</b> It is faster and it is wrong: without the ordering invariant the comparisons mean nothing.",
    "<b>Binary lifting with the jump loop running upwards.</b> The paired descent must start from the largest power and shrink, and must jump only while the ancestors differ.",
  ],

  impl: [
    ["Python", "sys.setrecursionlimit", "The default limit is about 1000 frames, so a skewed tree of 10^5 nodes needs the limit raised or an explicit stack."],
    ["Java", "TreeNode ==", "Compare references with ==, not equals. The problem gives you the actual nodes, which is what makes reference comparison correct."],
    ["C++", "TreeNode*", "Pointer comparison is the natural fit. Return nullptr for nothing found, and the truthiness tests read exactly like the pseudocode."],
    ["JavaScript", "left || right", "Returning left || right is idiomatic and safe here, because a node object is never falsy. Do not copy the idiom to values."],
  ],

  code: {
    pseudo: `# THE WHOLE ALGORITHM. Post-order: children first, decide on the way up.
LCA(node, p, q):
    if node is null:        return null
    if node is p or node is q:  return node    # a node is its own ancestor
    left  <- LCA(node.left,  p, q)
    right <- LCA(node.right, p, q)
    if left and right:      return node        # the paths split HERE
    return left or right                       # forward the single report

# IN A BST the values do the work. No recursion, no stack.
LCA_bst(node, p, q):
    while node:
        if p.val < node.val and q.val < node.val:    node <- node.left
        else if p.val > node.val and q.val > node.val: node <- node.right
        else:  return node          # they straddle it, or it IS one of them

# MANY QUERIES on a fixed tree: precompute jumps of 1, 2, 4, 8 ...
build:   up[0][v] <- parent(v)
         up[k][v] <- up[k-1][ up[k-1][v] ]        # a 2^k jump is two 2^(k-1)
query:   lift the deeper node until the depths match
         if they are now the same node, that is the answer
         lift both by the LARGEST jump that keeps them different
         return up[0][u]                          # one step more and they meet`,

    py: `def lca(node, p, q):                  # p and q are NODES, not values
    if node is None or node is p or node is q:
        return node                   # a node is its own ancestor: no extra if
    left  = lca(node.left,  p, q)
    right = lca(node.right, p, q)     # BOTH sides, before deciding anything
    if left and right:
        return node                   # one target on each side: the split
    return left or right              # forward whichever side reported

def lca_bst(root, p, q):              # O(h) time, O(1) space
    node = root
    while node:
        if p.val < node.val and q.val < node.val:    node = node.left
        elif p.val > node.val and q.val > node.val:  node = node.right
        else: return node             # straddled, or this node is a target
    return None

# Parent pointers instead of a tree walk. Same trick as two linked lists
# meeting: each runner walks its own path, then the other one.
def lca_parents(p, q):
    a, b = p, q
    while a is not b:                 # both cover depth(p) + depth(q) steps
        a = a.parent if a else q
        b = b.parent if b else p
    return a

# BINARY LIFTING. O(n log n) once, then O(log n) per query.
LOG = 17                              # 2^17 > 10^5 nodes
def build(n, parent):                 # parent[root] must point at the root
    up = [[0] * n for _ in range(LOG)]
    up[0] = parent[:]                 # up[k][v] = the 2^k-th ancestor of v
    for k in range(1, LOG):
        for v in range(n):
            up[k][v] = up[k - 1][up[k - 1][v]]
    return up

def query(up, depth, u, v):
    if depth[u] < depth[v]: u, v = v, u
    diff = depth[u] - depth[v]
    for k in range(LOG):              # bits of the gap: lift u level with v
        if diff >> k & 1: u = up[k][u]
    if u == v: return u               # v was an ancestor of u all along
    for k in reversed(range(LOG)):    # largest jumps first, and only while
        if up[k][u] != up[k][v]:      # the two ancestors still differ
            u, v = up[k][u], up[k][v]
    return up[0][u]                   # one step above where they still differ`,

    java: `TreeNode lca(TreeNode node, TreeNode p, TreeNode q) {
    if (node == null || node == p || node == q) return node;   // ==, not equals
    TreeNode left  = lca(node.left,  p, q);
    TreeNode right = lca(node.right, p, q);
    if (left != null && right != null) return node;   // the paths split here
    return left != null ? left : right;               // forward one report
}

TreeNode lcaBst(TreeNode node, TreeNode p, TreeNode q) {
    while (node != null) {
        if (p.val < node.val && q.val < node.val)      node = node.left;
        else if (p.val > node.val && q.val > node.val) node = node.right;
        else return node;
    }
    return null;
}

// Binary lifting: up[k][v] is the 2^k-th ancestor of v.
int[][] build(int n, int[] parent, int LOG) {
    int[][] up = new int[LOG][n];
    up[0] = parent.clone();
    for (int k = 1; k < LOG; k++)
        for (int v = 0; v < n; v++) up[k][v] = up[k - 1][up[k - 1][v]];
    return up;
}

// Recursion depth here is the tree HEIGHT, not log n. The JVM default stack
// handles a few thousand frames; a 10^5-node path is a StackOverflowError.`,

    cpp: `TreeNode* lca(TreeNode* node, TreeNode* p, TreeNode* q) {
    if (!node || node == p || node == q) return node;   // pointer identity
    TreeNode* left  = lca(node->left,  p, q);
    TreeNode* right = lca(node->right, p, q);
    if (left && right) return node;      // one target each side: the split
    return left ? left : right;          // forward the single report
}

TreeNode* lcaBst(TreeNode* node, TreeNode* p, TreeNode* q) {
    while (node) {
        if (p->val < node->val && q->val < node->val)      node = node->left;
        else if (p->val > node->val && q->val > node->val) node = node->right;
        else return node;
    }
    return nullptr;
}

// Binary lifting. Size LOG so that 2^LOG exceeds the node count.
vector<vector<int>> build(int n, const vector<int>& parent, int LOG) {
    vector<vector<int>> up(LOG, vector<int>(n));
    up[0] = parent;
    for (int k = 1; k < LOG; k++)
        for (int v = 0; v < n; v++) up[k][v] = up[k - 1][up[k - 1][v]];
    return up;
}

// up[k-1][up[k-1][v]] reads the row you just finished, so the k loop must be
// outside and the v loop inside. Swap them and you read a row of zeroes.`,

    js: `function lca(node, p, q) {
  if (node === null || node === p || node === q) return node;
  const left  = lca(node.left,  p, q);
  const right = lca(node.right, p, q);   // both sides before deciding
  if (left && right) return node;        // one target on each side
  return left || right;                  // a node object is never falsy
}

function lcaBst(node, p, q) {
  while (node) {
    if (p.val < node.val && q.val < node.val)      node = node.left;
    else if (p.val > node.val && q.val > node.val) node = node.right;
    else return node;
  }
  return null;
}

// Binary lifting: up[k][v] is the 2^k-th ancestor of v.
function build(n, parent, LOG = 17) {
  const up = Array.from({ length: LOG }, () => new Int32Array(n));
  up[0].set(parent);
  for (let k = 1; k < LOG; k++)
    for (let v = 0; v < n; v++) up[k][v] = up[k - 1][up[k - 1][v]];
  return up;
}

// No tail-call elimination in practice, so deep recursion still blows the
// stack. On a skewed tree, convert to an explicit stack.`,
  },
  codecap: "Six lines do the whole job, and the base case is where the cleverness hides: returning the node itself covers the case people try to special-case. Everything below the first function is an optimisation for a tree you will query more than once.",

  q: [
    ["Why is \"an ancestor of both\" not a definition of the answer?", "Because every node above the answer also has both targets below it, all the way up to the root. The constraint that picks out one node is lowest: the last node before the two root-to-target paths separate."],
    ["What exactly does each recursive call return?", "One of three things: a target node it found somewhere below, the answer once the answer has been identified, or nothing. The caller cannot tell those apart and does not need to, because the rule it applies is the same in every case."],
    ["Why does the base case return the node when it is one of the targets, instead of looking below it?", "Because a node is its own ancestor. If the other target is underneath, this node is genuinely the lowest common ancestor, and stopping here returns it. If the other target is elsewhere, this report travels up and meets the second report at the real split point."],
    ["Why can only one node ever see two non-empty reports?", "Once a node returns itself, every node above it receives exactly one non-empty report and forwards it unchanged. There is never a second non-empty report to pair it with, so no ancestor can mistake itself for the split point."],
    ["Why is the BST version O(1) space when the general one is O(h)?", "The values say which way to go, so the walk never needs to try both sides and never needs to come back. With no branching there is nothing to remember, so the recursion collapses into a loop."],
    ["A tree of 10^5 nodes and 10^5 queries. What changes?", "The plain recursion is O(q·n), which is 10^10 operations. Precompute the 2^k-th ancestor of every node in O(n log n), then each query lifts the deeper node level and walks both up together in O(log n), for about 10^6 total."],
    ["What does this algorithm do if one of the two nodes is not in the tree?", "It returns the other one, confidently and without error, because a single report is indistinguishable from the answer. If absence is possible you must count how many targets were actually seen and check the count at the end."],
  ],

  p: [
    [235, "lowest-common-ancestor-of-a-binary-search-tree", "LCA in a BST, where the values steer", "M"],
    [236, "lowest-common-ancestor-of-a-binary-tree", "LCA, the archetype, six lines", "M"],
    [1123, "lowest-common-ancestor-of-deepest-leaves", "LCA of the deepest leaves, return two things at once", "M"],
    [865, "smallest-subtree-with-all-the-deepest-nodes", "The same problem wearing a different title", "M"],
    [863, "all-nodes-distance-k-in-binary-tree", "Distance K, parent pointers turn the tree into a graph", "M"],
    [2096, "step-by-step-directions-from-a-binary-tree-node-to-another", "Directions between two nodes, LCA plus two paths", "M"],
    [1483, "kth-ancestor-of-a-tree-node", "Kth Ancestor, binary lifting on its own", "H"],
  ],
},

/* ==================================================================== */
{
  id: "trie",
  n: "Trie (prefix tree)",
  group: "Data structures",
  one: "Store words as <b>shared paths, one character per edge</b>, so a prefix stops being a search and becomes a walk of length equal to the prefix.",

  plain: `<p>A hash set answers one question superbly: is this exact word present? Ask it anything softer and it has nothing for you. "Which stored words start with <b>pre</b>?" forces it to check every single word it holds.</p>
<p>The reason is that hashing deliberately scrambles similar keys into unrelated slots. "cat" and "cats" look like neighbours to you. To the table they are strangers.</p>
<p>A trie keeps that resemblance instead of destroying it. Each edge carries one letter. Each node is the prefix you have spelled by walking down from the root. Two words that start the same way share those first edges, so "car", "cart" and "care" cost you <code>c</code>, <code>a</code>, <code>r</code> once between them.</p>
<p>A lookup is then: start at the root, follow one edge per letter, and see whether you fall off the tree. That costs the length of your word and nothing else. A million stored words do not slow it down, because you only ever walk your own word.</p>
<p><b>Analogy.</b> Filing by street address rather than by name. Everyone on Baker Street is filed down the same corridor. So "who lives on Baker Street" is a walk to one cabinet, not a sweep of the building. The price is that you keep a whole corridor even for a street with one resident.</p>`,

  why: [
    { t: "Start from the question a hash set cannot answer",
      d: "A hash set tells you whether a word is present in O(1) and refuses everything else. Asking it for all words starting with \"pre\" means testing every stored word, O(total characters), because <b>hashing throws away the relationship between similar keys on purpose</b>. Good hashing spreads \"cat\" and \"cats\" as far apart as any two random strings." },
    { t: "If prefixes matter, store them once and share them",
      d: "The words in a dictionary overlap heavily at the front. Give each character its own edge and let words that agree so far travel the same edges. A node then <b>is</b> a prefix, spelled by the path that reached it, and nothing is stored twice at the front." },
    { t: "Now the prefix question is just a walk",
      d: "Follow one edge per character of the prefix. Arrive at a node and every word underneath it starts with that prefix, by construction. Fall off the tree and no stored word does. There is no searching anywhere in that sentence." },
    { t: "So cost depends on the word, not on the collection",
      d: "Insert, search and prefix check each touch <b>L nodes for a word of length L</b>. Ten words or ten million, the walk is the same length, because you never look at anyone else's letters. That, not raw speed, is the actual argument against a hash map." },
    { t: "Reaching a node is not the same as a word ending there",
      d: "Insert \"cat\" and you have created nodes for c, ca and cat. If arriving somewhere meant a hit, the trie would claim to contain \"ca\". So each node carries an <b>isEnd flag</b>, set only where a word actually stops. Search checks the flag; a prefix query does not, and that one difference is the whole API." },
    { t: "The honest cost is memory",
      d: "Every node needs a way to reach its children: a map keyed by character, or a fixed array of 26 pointers. The array is faster and wastes most of itself on sparse data, since a node with one child still pays for 26 slots. A trie buys prefix walks with space, and on short unrelated strings that is a bad trade." },
    { t: "Which decides when to use it",
      d: "Use it when prefixes are the question. Autocomplete. Counting the words that start with something. Word search on a board, where one walk tests many candidate words at once. And the <b>bit trie</b>, where numbers are stored as their bits, so finding the maximum XOR becomes walking to the opposite bit at every level. If you only ever ask about whole exact strings, a hash set is smaller, simpler and better." },
  ],

  hing: `<p><b>Sawal yeh hai:</b> hash set batata hai "yeh exact word hai ya nahi", O(1) mein. Par "kaunse words 'pre' se shuru hote hain" par woh bilkul bekaar hai. Kyun? Kyunki hashing <b>jaan bujh kar</b> similar keys ka rishta tod deta hai. "cat" aur "cats" tumhare liye padosi hain, hash table ke liye do ajnabi.</p>
<p><b>Trie ka idea:</b> rishta todo mat, <b>rishta hi structure bana do</b>. Har edge par ek character, aur jo words shuru mein match karte hain woh wahi edges share karte hain. Matlab har node khud ek <b>prefix</b> hai, jo root se us tak ka raasta bolta hai. "car", "cart", "care" ke liye c, a, r sirf ek baar bane.</p>
<p><b>Ab prefix ka sawaal search nahi, walk hai.</b> Prefix ke har character par ek edge chalo. Node mil gaya to uske neeche ke saare words us prefix se shuru hote hain, definition se. Edge nahi mila to koi word nahi hai. Bas.</p>
<p><b>Asli selling point (interview mein yahi bolo):</b> cost <b>O(L)</b> hai, L = word ki length, aur yeh <b>store kitne words hain uspar depend hi nahi karta</b>. 10 words ho ya 10 lakh, tum sirf apne word ke letters chalte ho. Hash map ki O(1) bhi asal mein key ko hash karti hai, yaani O(L) hi hai, par woh prefix ka jawab de hi nahi sakta.</p>
<p><b>isEnd flag kyun chahiye, yeh sabse zyada miss hota hai.</b> "cat" daala to c, ca, cat, teeno nodes ban gaye. Agar node par pahunchna hi "mil gaya" maana jaaye to trie kahega "ca" bhi present hai, jo galat hai. Isliye har node par <b>isEnd</b> rakho, sirf wahan true jahan koi word khatam hota hai. <code>search()</code> flag check karta hai, <code>startsWith()</code> nahi karta. Poora difference yahi ek line hai.</p>
<p><b>Kimat kya hai? Memory.</b> Har node ko children chahiye: ya to ek map, ya 26 pointers ka fixed array. Array tez hai par ek child wale node par bhi poore 26 slots ka kharcha deta hai, yaani sparse data par zyaadatar memory khaali padi rehti hai. Map memory bachata hai, thoda slow hai. Interview mein yeh trade-off khud bolo, achha lagta hai.</p>
<p><b>Kab lena hai:</b> autocomplete, prefix count, aur board par word search, jahan ek DFS walk se kai words ek saath test ho jaate hain.</p>
<p><b>Aur ek aur jagah: bit trie.</b> Numbers ko unke bits ke roop mein daal do. Ab maximum XOR nikalna bas itna hai ki har level par <b>ulta bit</b> chun lo. <b>Kab nahi lena:</b> jab sirf poore exact strings poochhe jaayein. Wahan hash set chhota bhi hai aur simple bhi.</p>`,

  viz: ["trie"],

  math: [
    { t: "The question a hash set cannot answer, priced", d: "Exact lookup is a tie. The prefix question is not, and the gap grows with the number of stored words rather than staying flat.", w:
`n words, average length L, query prefix of length P

                   hash set            trie
contains(word)     O(L) hash + compare O(L)
startsWith(p)      O(n x L) scan all   O(P)

n = 10^6 words, P = 5:
  hash set   5 x 10^6 character reads
  trie       5` },
    { t: "Count characters, not words", d: "Shared prefixes are stored once, so the node count is bounded by the total length of everything inserted, and is usually far below it.", w:
`insert car, cart, care

stored separately: 3 + 4 + 4 = 11 characters
as a trie:         c - a - r  then t, then e = 5 nodes

worst case, no shared prefixes at all:
  nodes = total characters = n x L
  10^5 words x 10 chars = 10^6 nodes` },
    { t: "The memory bill, which is the real reason to stop and think", d: "Time is never why a trie gets rejected. It is that every node holds a whole alphabet of mostly empty slots.", w:
`one node as a 26-slot reference array:
  26 x 8 bytes = 208, plus a header ~ 16 = 224 bytes

10^6 nodes x 224 bytes = 224 MB

one node as a hash map of present children only:
  ~48 bytes + ~40 per child actually there
a sparse trie shrinks by roughly 10x this way, and pays
with a hash lookup per character instead of an index` },
    { t: "Arriving at a node is not the same as a word ending there", d: "One boolean per node separates the two, and without it the structure quietly claims to contain every prefix of everything inserted.", w:
`insert "car" only

walk "ca": you arrive at a real, existing node
  contains("ca")    must be false
  startsWith("ca")  must be true

so each node carries isEnd. Without it, inserting n words
of length L silently defines n x L words:
  10^5 words x 10 chars = 10^6 false positives` },
  ],

  costs: [
    ["insert a word of length L", "O(L)", "one node created or reused per character, nothing else is touched"],
    ["search an exact word", "O(L)", "same walk, plus one isEnd check at the last node"],
    ["startsWith(prefix)", "O(len prefix)", "the reason the structure exists, a hash set cannot do this at all"],
    ["cost vs number of stored words", "independent", "you only ever walk your own letters, never anyone else's"],
    ["collect all words under a prefix", "O(len prefix + output)", "walk to the node, then DFS, and the DFS pays only for what it emits"],
    ["memory, array children", "O(total chars × 26)", "fast indexing, most slots empty on sparse data"],
    ["memory, map children", "O(total chars)", "pays only for real children, slightly slower per step"],
  ],

  traps: [
    "<b>Forgetting isEnd.</b> Without it, inserting \"cat\" makes the trie claim it contains \"ca\". Reaching a node means the prefix exists, not the word.",
    "<b>Using a trie where a hash set belongs.</b> If the only question is exact membership, you have paid a large memory bill for a structure that is not faster.",
    "<b>Hardcoding 26 slots</b> and then meeting uppercase letters, digits or a hyphen. Index out of range if you are lucky, silent corruption if you are not.",
    "<b>Deleting by unlinking the last node.</b> A word can be a prefix of another, so delete clears isEnd first and only prunes nodes upward while they have no children and no isEnd.",
    "<b>Board word search that restarts the trie at every cell.</b> Pass the current trie node into the DFS instead, and prune the moment a child edge is missing, which is the entire speedup.",
    "<b>Building a bit trie with variable-length numbers.</b> Insert every number with the same fixed bit width, most significant bit first, or the greedy XOR walk compares different positions.",
  ],

  impl: [
    ["Python", "no built-in; dict of dicts, or a Node class with a dict", "A plain nested dict with a sentinel key for isEnd is the fastest thing to write under time pressure."],
    ["Java", "no built-in; TrieNode with TrieNode[26] or HashMap", "The array version needs c - 'a' indexing. Guard the input alphabet, there is no bounds help until it throws."],
    ["C++", "no built-in; struct with array<Node*,26> or unordered_map", "Raw new leaks unless you keep a vector of nodes and index into it, which is also faster."],
    ["JavaScript", "no built-in; plain object or Map per node", "Use Map or Object.create(null): a plain object literal inherits keys like constructor, which pollute lookups."],
  ],

  code: {
    pseudo: `# node: { children: char -> node, isEnd: boolean }
# INVARIANT: a node IS the prefix spelled by the path from the root to it.
#            isEnd marks the nodes where a real word stops, which is not
#            the same set as the nodes you can reach.

insert(word):
    node <- root
    for c in word:
        if c not in node.children: node.children[c] <- new node
        node <- node.children[c]
    node.isEnd <- true                  # O(len word), independent of trie size

walk(s):                                # the shared half of every operation
    node <- root
    for c in s:
        if c not in node.children: return null
        node <- node.children[c]
    return node

search(word):      n <- walk(word);   return n != null and n.isEnd
startsWith(pre):   return walk(pre) != null      # note: no isEnd check

# The whole API difference is that one missing flag check.

# BIT TRIE: store each number as fixed-width bits, most significant first.
# Maximum XOR with x = at each bit, greedily take the OPPOSITE bit if it
# exists, because a differing high bit outranks every lower bit combined.
maxXor(x):
    node <- root; best <- 0
    for b from highBit down to 0:
        want <- 1 - bit(x, b)
        if want in node.children: best <- best + (1 << b); node <- node.children[want]
        else:                     node <- node.children[1 - want]
    return best`,
    py: `class Node:
    __slots__ = ("kids", "end")
    def __init__(self):
        self.kids = {}          # char -> Node, a dict so we pay per real child
        self.end = False        # a WORD stops here, not merely a prefix

class Trie:
    def __init__(self): self.root = Node()

    def insert(self, word):                       # O(len word)
        node = self.root
        for c in word:
            if c not in node.kids: node.kids[c] = Node()
            node = node.kids[c]
        node.end = True

    def _walk(self, s):                           # shared by both queries
        node = self.root
        for c in s:
            node = node.kids.get(c)
            if node is None: return None
        return node

    def search(self, word):    n = self._walk(word); return n is not None and n.end
    def starts_with(self, pre): return self._walk(pre) is not None

# Delete: clear the flag, then prune upward only while a node is useless.
def delete(node, word, i=0):
    if i == len(word):
        node.end = False
    else:
        child = node.kids.get(word[i])
        if child is None: return False
        if delete(child, word, i + 1): del node.kids[word[i]]
    return not node.kids and not node.end         # safe to remove me?

# Under time pressure, skip the class entirely:
#   root = {};  cur = root
#   for c in word: cur = cur.setdefault(c, {})
#   cur["$"] = True        # sentinel key as the isEnd flag`,
    java: `class Trie {
    static class Node {
        Node[] kids = new Node[26];   // fast, and mostly empty on sparse data
        boolean end;                  // a word ENDS here
    }
    private final Node root = new Node();

    public void insert(String word) {              // O(word.length())
        Node node = root;
        for (char c : word.toCharArray()) {
            int i = c - 'a';                       // assumes lowercase a-z only
            if (node.kids[i] == null) node.kids[i] = new Node();
            node = node.kids[i];
        }
        node.end = true;
    }

    private Node walk(String s) {
        Node node = root;
        for (char c : s.toCharArray()) {
            node = node.kids[c - 'a'];
            if (node == null) return null;
        }
        return node;
    }

    public boolean search(String word) {
        Node n = walk(word);
        return n != null && n.end;                 // the flag is the difference
    }
    public boolean startsWith(String pre) { return walk(pre) != null; }
}
// Mixed alphabet? Swap Node[26] for HashMap<Character,Node> and stop
// subtracting 'a'. The array only pays off when the alphabet is fixed.`,
    cpp: `struct Node {
    array<Node*, 26> kids{};      // value-initialised to nullptr, do not skip {}
    bool end = false;             // a word STOPS here
};

struct Trie {
    Node* root = new Node();

    void insert(const string& word) {              // O(word.size())
        Node* node = root;
        for (char c : word) {
            int i = c - 'a';
            if (!node->kids[i]) node->kids[i] = new Node();
            node = node->kids[i];
        }
        node->end = true;
    }

    Node* walk(const string& s) const {
        Node* node = root;
        for (char c : s) {
            node = node->kids[c - 'a'];
            if (!node) return nullptr;
        }
        return node;
    }

    bool search(const string& w) const {
        Node* n = walk(w);
        return n && n->end;
    }
    bool startsWith(const string& p) const { return walk(p) != nullptr; }
};
// Every new here leaks. For contests, keep vector<Node> pool and store
// int indices instead of pointers: no leak, one allocation, better locality.`,
    js: `class Node {
  constructor() {
    this.kids = new Map();   // Map, not {}: a plain object inherits keys
    this.end = false;        // a word ENDS here
  }
}

class Trie {
  constructor() { this.root = new Node(); }

  insert(word) {                                  // O(word.length)
    let node = this.root;
    for (const c of word) {
      if (!node.kids.has(c)) node.kids.set(c, new Node());
      node = node.kids.get(c);
    }
    node.end = true;
  }

  _walk(s) {
    let node = this.root;
    for (const c of s) {
      node = node.kids.get(c);
      if (!node) return null;
    }
    return node;
  }

  search(word) { const n = this._walk(word); return !!n && n.end; }
  startsWith(pre) { return this._walk(pre) !== null; }
}

// for..of over a string iterates CODE POINTS, so emoji and accents do not
// split in half the way word[i] would. Rarely what a Trie problem asks,
// always what a production autocomplete needs.`,
  },
  codecap: "One walk serves everything: search reads isEnd at the end of it, startsWith does not, and every other trie problem is that walk with a DFS bolted on.",

  q: [
    ["Why can a hash set not answer prefix queries?", "Hashing deliberately destroys the relationship between similar keys, so \"cat\" and \"cats\" land in unrelated slots. Finding words with a prefix means testing every stored word."],
    ["What makes a trie lookup O(L) rather than depending on n?", "You follow one edge per character of your own word and never look at any other word's letters, so the walk length is the word length no matter how many words are stored."],
    ["What is isEnd for, and what breaks without it?", "It marks nodes where a word actually stops. Without it, inserting \"cat\" would make the trie report \"c\" and \"ca\" as stored words, because reaching a node only proves the prefix exists."],
    ["Where does search differ from startsWith?", "Only in the last line. Both walk the string and fail if an edge is missing; search additionally requires isEnd on the final node, startsWith does not."],
    ["What does a trie cost you, and what is the choice between array and map children?", "Memory. A 26-slot array per node indexes fastest but wastes most slots on sparse data; a map pays only for real children and costs a little speed per step."],
    ["Name two problems where a trie beats the obvious approach.", "Board word search, where one DFS carrying a trie node tests many candidate words at once and prunes on a missing edge, and maximum XOR, where numbers are stored as fixed-width bits and you greedily walk to the opposite bit at each level."],
  ],

  p: [
    [208, "implement-trie-prefix-tree", "Implement Trie, the structure itself", "M"],
    [1268, "search-suggestions-system", "Search Suggestions, autocomplete as a walk plus DFS", "M"],
    [648, "replace-words", "Replace Words, shortest matching prefix root", "M"],
    [211, "design-add-and-search-words-data-structure", "Add and Search Words, the dot wildcard branches the walk", "M"],
    [677, "map-sum-pairs", "Map Sum Pairs, prefix sums stored on nodes", "M"],
    [212, "word-search-ii", "Word Search II, trie-pruned DFS on a board", "H"],
    [421, "maximum-xor-of-two-numbers-in-an-array", "Maximum XOR, the bit trie", "M"],
  ],
},

/* ==================================================================== */
{
  id: "lru",
  n: "LRU cache, two structures at once",
  group: "Data structures",
  one: "Neither structure can do the job alone: a hash map has no order, a list has no lookup. <b>Hold the same nodes in both</b> and every operation is O(1).",

  plain: `<p>A cache has a fixed capacity. It has to answer "what is the value for this key" quickly, and when it fills up it has to throw something away. Least recently used means it throws away whatever has gone longest without being touched.</p>
<p>A hash map does the first half perfectly and the second half not at all. It finds a key in O(1). It has no idea of order, so it cannot tell you what is oldest. A linked list does the opposite. Keep it ordered by how recently things were used and eviction is free: it is whatever sits at the tail. But finding a key means walking the list, which is O(n).</p>
<p>The move is to use both, over the same objects. The map's value is not the cached value, it is a <b>pointer to the list node</b> holding it. One map lookup and you are standing on the node, with no walking, and from there you can unlink and relink it in constant time. Every operation touches both structures, and they must stay in step: anything evicted has to leave the list and the map.</p>
<p><b>Analogy.</b> A library with a card index and a shelf of returns. The index tells you instantly where a book is. The shelf keeps them in the order they were last read, so the one at the far end is the one nobody wants. Remove a book and you must pull its card too, or the index sends the next reader to an empty slot.</p>`,

  why: [
    { t: "Write down what the thing must do", d: "Two operations, both required to be O(1): <b>get</b> a value by key, and <b>put</b> a key, evicting the least recently used entry if that would exceed capacity. Reading a key counts as using it. The word 'both' is doing all the work, because each operation on its own is easy." },
    { t: "A hash map answers half the question", d: "get is O(1) and put is O(1), and then capacity arrives and the map has nothing to offer. Hash maps are <b>unordered by construction</b>: the slot is computed from the key, so there is no sense in which one entry is older than another. Scanning for the oldest is O(n), which loses the requirement." },
    { t: "A list answers the other half", d: "Keep entries in a list ordered by when they were last touched, newest at the head. Eviction is now free: the tail is the answer, by definition. But looking up a key means walking the list, <b>O(n)</b>, which loses the other requirement. Each structure is fast at exactly what the other is slow at." },
    { t: "So hold the same objects in both", d: "Do not store values in the map. Store, for each key, <b>the list node itself</b>. The map turns a key into a position in O(1), and the list turns a position into an order in O(1). Neither structure duplicates the data; they are two indexes over one set of nodes." },
    { t: "Unlinking is why the list must be doubly linked", d: "To remove a node you must reach the one <b>before</b> it, so its next pointer can be redirected. A singly linked list only offers that by walking from the head, which is the O(n) you just paid to avoid. A back pointer turns unlink into four assignments and nothing else." },
    { t: "Two sentinel nodes delete every null check", d: "Put a permanent dummy at the head and another at the tail. Now every real node has a genuine neighbour on both sides. Unlink and insert become the same two lines, whether the list is empty, full, or holding one item. This is the same trick as a dummy head on any linked-list problem." },
    { t: "The two structures must never disagree", d: "Every write touches both. Evicting means unlinking the node <b>and</b> deleting its key from the map. That is why the node has to store its own key. Standing on the tail node, you need to know what to delete. Miss that and the map points at a node no longer in the list, and get returns a value the cache does not hold." },
    { t: "What this does not give you", d: "LRU is a guess, not a prediction: it assumes recent use predicts future use, which is false for a single long scan through cold data. And if you need frequency rather than recency, this shape does not stretch, LFU needs a second layer of lists grouped by count." },
  ],

  variants: [
    { n: "LRU: map plus doubly linked list", cost: "O(1) get, O(1) put",
      idea: "Key to node, nodes ordered by recency. Touching a node moves it to the head; eviction takes the tail.",
      when: "The default cache question, asked more often than almost anything else on this page.",
      watch: "The node must carry its own key, or the eviction cannot find what to delete from the map." },

    { n: "LFU: map plus one list per frequency", cost: "O(1) get, O(1) put",
      idea: "Two maps: key to node, and frequency count to a doubly linked list of the nodes with that count. A hit moves the node to the next count's list. Track the minimum live count so eviction knows where to look.",
      when: "Eviction should be by how often, not how recently.",
      watch: "The minimum count only ever increases by one, or resets to one on an insert. That is what keeps the eviction O(1) instead of a search." },

    { n: "Insert, delete and get random in O(1)", cost: "O(1) all three",
      idea: "A hash map from value to array index, plus an array of values. Deleting swaps the doomed element with the last one, fixes that one index in the map, and pops.",
      when: "Random selection must be O(1), which a hash map alone cannot do.",
      watch: "The swap has to update the map entry for the element that moved. Forgetting it leaves one stale index that fails much later." },

    { n: "Min stack", cost: "O(1) push, pop and min",
      idea: "The stack, plus a second stack holding the minimum as of each push. The same composition idea at its smallest: one structure for order, one for the aggregate.",
      when: "Any \"and also report the min or max in O(1)\" wrapper around a stack.",
      watch: "Push onto the min stack every time, including duplicates of the current minimum, or pop stops lining up with it." },

    { n: "What your language already ships", cost: "O(1) amortised",
      idea: "Python's OrderedDict, Java's LinkedHashMap with access order enabled, and C++'s std::list with iterators stored in a map are all this structure, already written.",
      when: "Production. Also an interview, if you ask first and then offer to write it out.",
      watch: "Reaching for it without being asked reads as dodging the question. Name it, then hand-roll the version the interviewer wanted." },
  ],

  viz: ["lru"],

  hing: `<p><b>Do cheezein chahiye, aur koi ek structure dono nahi de sakta.</b> Hash map se key ka value O(1) mein mil jaata hai. Par usme <b>order hai hi nahi</b>, to woh bata hi nahi sakta ki purana kaun hai. Linked list: recency ke hisaab se rakho to eviction free hai, tail utha lo, lekin key dhoondhne ke liye poori list chalni padegi, O(n). Har structure theek wahan tez hai jahan doosra slow hai.</p>
<p><b>To dono use karo, ek hi nodes ke upar.</b> Map mein value mat rakho, <b>node ka pointer</b> rakho. Ek lookup aur tum seedhe us node par khade ho, chalna nahi pada. Yeh join hi poora answer hai.</p>
<p><b>List doubly linked kyun?</b> Kisi node ko nikalne ke liye uske <b>pehle wale</b> node tak pahunchna padta hai. Singly list mein head se chalna padega, matlab wahi O(n) wapas. Back pointer se unlink char assignment ka kaam hai. Aur do <b>sentinel</b> nodes daal do, ek head par ek tail par, phir null check kabhi nahi karna padega, list khaali ho ya bhari, code same.</p>
<p><b>Sabse badi galti:</b> evict karte waqt sirf list se nikaal dena aur map se bhoolna. Phir map ek aise node ko point karta rahega jo list mein hai hi nahi, aur get galat value de dega. Isliye <b>node apni key khud store karta hai</b>, taki tail par khade ho kar pata chale map se kya delete karna hai. Yeh line interview mein khud bol dena, poochne se pehle.</p>`,

  math: [
    { t: "Each structure answers half, and half is worthless here", d: "Both operations have to be O(1), because a cache that is slower than the thing it caches has no reason to exist.", w:
`capacity C, n operations

hash map only:  get O(1), "which is least recent?" O(C)
list only:      order is free, find(key) is O(C)
both, sharing the same node objects: every operation O(1)

C = 100,000, n = 10^6:
  one structure   10^6 x 100,000 = 10^11
  both            10^6` },
    { t: "Why the list must be doubly linked, counted in pointer writes", d: "Eviction is not the hard part. Moving a node you found through the map to the front is, and that needs the node before it.", w:
`to unlink x you need x's predecessor

singly linked:  walk from the head to find it      O(C)
doubly linked:  x.prev and x.next are right there  O(1)

  x.prev.next = x.next
  x.next.prev = x.prev

2 reads, 2 writes, wherever x happens to sit` },
    { t: "Two sentinels delete six cases", d: "Head and tail specials are where this implementation goes wrong under time pressure. Two dummy nodes make every real node an interior node.", w:
`without sentinels, each of unlink and insert must ask
  is it the head?  is it the tail?  is it the only node?
  3 questions x 2 operations = 6 branches to get right

with a head and tail sentinel
  every real node has a real prev and a real next
  0 branches, 2 nodes of extra memory, for ever` },
    { t: "What a capacity actually costs in bytes", d: "The bookkeeping is not free, and it is what decides the capacity you can afford, quite apart from the values being cached.", w:
`one entry: key, value, prev, next, plus the map's own entry
  8 + 8 + 8 + 8 + ~48  =  ~80 bytes of overhead

capacity 1,000,000  ->  ~80 MB before a single value

which is why "unbounded LRU" is not a cache. It is a
memory leak that reports a hit rate.` },
    { t: "The access pattern LRU is worst at, in one number", d: "Least-recently-used is a guess about the future. There is one very ordinary pattern where the guess is wrong every single time.", w:
`cache of size C = 1,000
a loop that scans 1,001 items, repeatedly

every access evicts the item needed next
hits: 0 out of 10^6 accesses. Hit rate 0 %.

random eviction on the same pattern keeps about
C / (C+1) of the working set and gets ~ 99 %` },
  ],

  costs: [
    ["get(key), hit or miss", "O(1)", "one map lookup lands on the node, then four pointer writes move it, and nothing is scanned"],
    ["put(key, value)", "O(1)", "map insert plus a relink, and the eviction is the tail, which is already known"],
    ["eviction", "O(1)", "the tail sentinel's previous node is the victim, with no search and no comparison"],
    ["unlink a node in a DOUBLY linked list", "O(1)", "the predecessor is one field away, which is the entire reason for the back pointer"],
    ["unlink a node in a SINGLY linked list", "O(n)", "the predecessor has to be found by walking from the head, which undoes the map"],
    ["space", "O(capacity)", "one node and one map entry per cached key, so roughly two references of overhead each"],
    ["find the oldest with a hash map alone", "O(n)", "hash maps have no order at all, and this is the gap the list exists to fill"],
  ],

  traps: [
    "<b>Storing the value in the map instead of the node.</b> Then a hit still has to find the node in the list to move it, which is O(n), and the whole design collapses.",
    "<b>Evicting from the list but not the map.</b> The map keeps a key pointing at a node that is no longer cached, and get happily returns it. The node must store its own key so the eviction knows what to delete.",
    "<b>Using a singly linked list.</b> Unlinking needs the predecessor. Without a back pointer you walk to find it, and the O(1) promise is gone.",
    "<b>Treating get as a read-only operation.</b> A successful get is a use, so it must move the node to the head. Skipping that evicts entries that were just read.",
    "<b>Forgetting that put on an existing key is also a use.</b> Overwriting a value must refresh recency too, and must not insert a second node for the same key.",
    "<b>Skipping the sentinels.</b> Without them, every insert and unlink needs branches for empty, single-element and head or tail cases, and one of those four branches will be wrong.",
  ],

  impl: [
    ["Python", "collections.OrderedDict", "move_to_end and popitem(last=False) are exactly this structure. A plain dict preserves insertion order but cannot re-order in O(1)."],
    ["Java", "LinkedHashMap(cap, 0.75f, true)", "The third argument switches to access order; override removeEldestEntry and the cache is four lines. Say you know this, then write the real one."],
    ["C++", "std::list + unordered_map", "splice moves a node between positions in O(1) and leaves iterators valid, which is why the map can store iterators safely."],
    ["JavaScript", "Map", "Map keeps insertion order, so delete-then-set is a move-to-back and keys().next() is the oldest key. Convenient, and not the doubly linked list you were asked for."],
  ],

  code: {
    pseudo: `# TWO STRUCTURES over the SAME nodes.
#   map:  key -> the NODE holding that key   (not the value: the node)
#   list: doubly linked, head = just used, tail = next to be evicted
#   sentinels: a permanent head and tail node, so nothing is ever null

get(key):
    if key not in map:  return MISS
    node <- map[key]
    unlink(node);  push_front(node)     # a read counts as a use
    return node.value

put(key, value):
    if key in map:
        node <- map[key];  node.value <- value
        unlink(node);  push_front(node)     # a write counts as a use too
        return
    if size = capacity:
        victim <- tail.prev                 # by definition the oldest
        unlink(victim)
        delete map[victim.key]              # BOTH, or the map points at a ghost
    node <- new Node(key, value)            # the node stores its own KEY
    map[key] <- node
    push_front(node)

# The two primitives. No null checks anywhere, because of the sentinels.
unlink(n):      n.prev.next <- n.next;  n.next.prev <- n.prev
push_front(n):  n.prev <- head;  n.next <- head.next
                head.next.prev <- n;  head.next <- n`,

    py: `class Node:
    __slots__ = ("key", "val", "prev", "next")
    def __init__(self, key=0, val=0):
        self.key, self.val = key, val    # the KEY is stored so eviction can
        self.prev = self.next = None     # delete it from the map

class LRUCache:
    def __init__(self, capacity):
        self.cap = capacity
        self.map = {}                            # key -> Node, never -> value
        self.head, self.tail = Node(), Node()    # sentinels: no null checks
        self.head.next, self.tail.prev = self.tail, self.head

    def _unlink(self, n):
        n.prev.next, n.next.prev = n.next, n.prev

    def _push_front(self, n):
        n.prev, n.next = self.head, self.head.next
        self.head.next.prev = n
        self.head.next = n

    def get(self, key):
        n = self.map.get(key)
        if n is None: return -1
        self._unlink(n); self._push_front(n)     # a read IS a use
        return n.val

    def put(self, key, value):
        n = self.map.get(key)
        if n is not None:
            n.val = value
            self._unlink(n); self._push_front(n)
            return
        if len(self.map) == self.cap:
            victim = self.tail.prev              # the oldest, by definition
            self._unlink(victim)
            del self.map[victim.key]             # BOTH structures, always
        n = Node(key, value)
        self.map[key] = n
        self._push_front(n)

# The library already is this structure. Say so, then write the above.
from collections import OrderedDict
od = OrderedDict()
od.move_to_end(key)                  # mark as most recently used
od.popitem(last=False)               # evict the oldest`,

    java: `// LinkedHashMap already IS a hash map plus a doubly linked list. Access
// order plus one override is a working cache, and is worth naming out loud
// before you write the version the question is actually asking for.
class LRUCache extends LinkedHashMap<Integer, Integer> {
    private final int cap;
    LRUCache(int capacity) {
        super(capacity, 0.75f, true);        // true = ACCESS order
        this.cap = capacity;
    }
    @Override
    protected boolean removeEldestEntry(Map.Entry<Integer, Integer> e) {
        return size() > cap;                 // checked after every insertion
    }
}

// The hand-rolled parts. Sentinels mean neither method checks for null.
class Node { int key, val; Node prev, next; }

void unlink(Node n) {
    n.prev.next = n.next;
    n.next.prev = n.prev;
}

void pushFront(Node head, Node n) {
    n.prev = head;
    n.next = head.next;
    head.next.prev = n;
    head.next = n;
}`,

    cpp: `// list::splice moves a node to another position in O(1) WITHOUT copying it,
// and leaves every iterator valid. That guarantee is what lets the map hold
// iterators instead of pointers, and it is the whole reason this is short.
class LRUCache {
    int cap;
    list<pair<int, int>> dll;                   // front = most recently used
    unordered_map<int, list<pair<int, int>>::iterator> map;
public:
    LRUCache(int capacity) : cap(capacity) {}

    int get(int key) {
        auto it = map.find(key);
        if (it == map.end()) return -1;
        dll.splice(dll.begin(), dll, it->second);      // move to front, O(1)
        return it->second->second;
    }

    void put(int key, int value) {
        auto it = map.find(key);
        if (it != map.end()) {
            it->second->second = value;
            dll.splice(dll.begin(), dll, it->second);
            return;
        }
        if ((int) dll.size() == cap) {
            map.erase(dll.back().first);        // erase from BOTH structures
            dll.pop_back();
        }
        dll.emplace_front(key, value);
        map[key] = dll.begin();
    }
};`,

    js: `// Map keeps INSERTION order, so delete-then-set is a move-to-back and the
// first key from keys() is the oldest. Honest caveat: this is not the
// doubly linked list an interviewer asking for LRU wants to see.
class LRUCache {
  constructor(capacity) {
    this.cap = capacity;
    this.map = new Map();
  }

  get(key) {
    if (!this.map.has(key)) return -1;
    const val = this.map.get(key);
    this.map.delete(key);          // remove and re-insert: now it is newest
    this.map.set(key, val);
    return val;
  }

  put(key, value) {
    if (this.map.has(key)) {
      this.map.delete(key);        // so the re-insert lands at the back
    } else if (this.map.size === this.cap) {
      this.map.delete(this.map.keys().next().value);   // the oldest key
    }
    this.map.set(key, value);
  }
}

// The primitives, for when the hand-rolled list is what was asked for.
const unlink = (n) => { n.prev.next = n.next; n.next.prev = n.prev; };
const pushFront = (head, n) => {
  n.prev = head; n.next = head.next;
  head.next.prev = n; head.next = n;
};`,
  },
  codecap: "The C++ and Java versions look like cheating and are not: knowing that std::list keeps iterators valid across a splice, or that LinkedHashMap has an access-order mode, is the same knowledge as writing the pointers by hand. Say which one you are doing, and why.",

  q: [
    ["Why can a hash map not implement an LRU cache on its own?", "It has no order. The slot is computed from the key, so nothing records which entry was touched longest ago, and finding the oldest would mean scanning every entry, which is O(n)."],
    ["Why can a linked list not do it on its own?", "It has the order for free, newest at the head and the victim at the tail, but locating a key means walking the list, which is O(n). Each structure is fast at exactly the thing the other is slow at."],
    ["What does the hash map actually store, and why does that choice matter?", "The list node, not the value. Storing the value would leave you still needing to find that node in the list to move it, which is the O(n) walk you were avoiding. Storing the node means one lookup lands you on it."],
    ["Why must the list be doubly linked?", "Unlinking a node requires redirecting the pointer of the node before it, and only a back pointer gives you that in O(1). With a singly linked list you would walk from the head to find the predecessor."],
    ["Why does each node store its own key?", "Eviction starts from the tail node and must also delete that entry from the map. Standing on a node, the only way to know which map key to remove is for the node to carry it."],
    ["What are the two sentinel nodes for?", "They give every real node a genuine neighbour on both sides, so insert and unlink are the same two lines whether the list is empty, holds one item, or the node is at either end. It removes four branches, one of which would have been wrong."],
    ["Is a successful get a read or a write?", "A write. Reading a key counts as using it, so the node must move to the head. Treating get as read-only means recently read entries get evicted, and the cache passes small tests while behaving wrongly under load."],
    ["What is the general pattern worth taking from this?", "When one structure is fast at exactly what another is slow at, hold the same objects in both and keep them in step on every write. LFU, insert-delete-get-random and min stack are all the same move with different partners."],
  ],

  p: [
    [706, "design-hashmap", "Design HashMap, the buckets by hand", "E"],
    [155, "min-stack", "Min Stack, the smallest version of the same idea", "M"],
    [380, "insert-delete-getrandom-o1", "Insert Delete GetRandom, map plus array, swap with last", "M"],
    [146, "lru-cache", "LRU Cache, the archetype", "M"],
    [1472, "design-browser-history", "Browser History, when a plain list is genuinely enough", "M"],
    [895, "maximum-frequency-stack", "Maximum Frequency Stack, a stack per count", "H"],
    [460, "lfu-cache", "LFU Cache, one list per frequency", "H"],
  ],
},

/* ==================================================================== */
{
  id: "range-structures",
  n: "Fenwick and segment trees",
  group: "Data structures",
  one: "A plain array is O(1) update and O(n) query, a prefix array is the reverse. These trees refuse both extremes: <b>O(log n) for the update and the query alike</b>.",

  plain: `<p>You have a list of numbers. Two things keep happening: someone changes one number, and someone asks for the total of a stretch of them. Say positions 3 to 700.</p>
<p>You have two obvious options and both are bad at one of the jobs. Keep the plain list: changing a number is instant, but adding up a stretch means walking every one of them. Or keep a running-totals list: the stretch becomes one subtraction, but changing a single number means rebuilding every total after it.</p>
<p>So one is fast to write and slow to read. The other is fast to read and slow to write. If your problem does both, you lose either way.</p>
<p>The fix is to stop storing single numbers or whole totals, and store the totals of <b>blocks</b> instead. A block knows its own sum. Change one number and you fix only the blocks containing it. Ask for a stretch and you add up a few whole blocks instead of hundreds of numbers. Both jobs become about twenty steps at a million items.</p>
<p><b>Analogy.</b> A company reporting sales. Asking every salesperson takes all day. A single printed total is instant to read and stale the moment one sale changes. So you keep totals per team, per office, per region. One sale updates three totals, and any question is answered from a handful of them.</p>`,

  why: [
    { t: "Write down the two structures you already have, and what each one costs", d: "A plain array: changing one value is one write. Asking for the sum of a stretch means touching every value in it, so a wide stretch costs <b>O(n)</b>. A running-totals array is the mirror image. The stretch is one subtraction, <b>O(1)</b>, but changing one value means fixing every total after it, <b>O(n)</b>. Each is perfect at one job and worst at the other." },
    { t: "A workload with both operations lands in the bad half whichever you pick", d: "With a million values and a million operations, either choice does about 10^12 steps. Notice what is going wrong: both structures store something at the two extremes. One stores single values. The other stores totals that reach all the way back to the start. Nothing sits in between." },
    { t: "So store the totals of blocks, which is the in-between thing", d: "Cut the array into blocks of size k and store each block's sum. Changing one value fixes its own block, so that is <b>O(k)</b> at worst. A stretch is now some whole blocks, plus a few loose values at each end. That is about <code>n/k</code> blocks plus <code>2k</code> leftovers. Pick <code>k = sqrt(n)</code> and both come to about <b>sqrt(n)</b>, which at a million is a thousand. Better than a million, and still not good." },
    { t: "Stop choosing a block size and let the blocks contain blocks", d: "The block size was a compromise, so remove it. Take the whole array as one block, split it in half, split each half in half, and keep going until each block holds one value. Every block stores the sum of its two children. That is a <b>segment tree</b>, and it has <code>log n</code> levels because you halved each time. Twenty levels at a million." },
    { t: "Now read the two costs straight off the picture", d: "An update changes one leaf. Only the blocks containing that leaf are now wrong, and those are its ancestors: one per level. So an update fixes <b>log n</b> blocks. A query covers the stretch with whole blocks, and at each level at most two blocks stick out at the ends. So a query reads at most <b>2 log n</b> blocks. At a million values that is 20 writes and about 40 reads, instead of a million of either." },
    { t: "The operation only has to be associative, and that is the real payoff", d: "Nothing above mentioned addition. The only thing used was that a block can be built from its two halves, in that order. Any operation where <code>(a then b) then c</code> equals <code>a then (b then c)</code> works unchanged: minimum, maximum, gcd, product, even matrix multiplication. Averages do not, because an average of averages is not the average. Store the sum and the count instead, then divide at the very end." },
    { t: "Fenwick does the same job for prefixes, in a tenth of the code", d: "Suppose you only ever need totals that start at the beginning. Then a Fenwick tree stores a cleverer set of partial sums in one flat array. It gets the same <b>log n</b> for both jobs, in about ten lines. The catch is how it answers a middle stretch: it takes the total up to the end and subtracts the total up to the start. That subtraction is the requirement. Sums can be subtracted, so a Fenwick can do sums. Minimums cannot, so it cannot do minimums." },
    { t: "Three places where this is the wrong answer", d: "If the values never change, a sparse table answers minimum and maximum in one step after a heavier build, so the tree is wasted effort. If n and the number of questions are both small, say a thousand each, a plain loop is a million steps and you are done in three lines. And if there is exactly one update at the start, build the running totals once. A segment tree is a hundred lines that lose to a loop in all three cases." },
  ],
  hing: `<p><b>Problem pehle, structure baad mein.</b> Ek list hai. Do cheezein baar-baar hoti hain: koi ek number badal deta hai, aur koi poochhta hai "position 3 se 700 tak ka total kya hai".</p>
<p><b>Do seedhe options hain, aur dono ek kaam mein bekaar hain.</b> Plain array rakho: number badalna instant, par total nikalne ke liye saare numbers jodne padenge. Prefix sums rakho: total ek ghatav mein mil jaata hai, par ek number badla to uske aage ke saare totals dobara banane padenge. Ek likhne mein tez hai, doosra padhne mein. Problem dono maangti hai to dono fail.</p>
<p><b>Asli idea: na single numbers store karo, na poore totals. Blocks ke totals store karo.</b> Array ko tukdon mein baanto, har tukde ka apna sum rakho. Ek number badla to sirf uske tukde ka sum theek karo. Total poochha to poore tukde jodo, ek-ek number nahi.</p>
<p><b>Tukda kitna bada ho? Yahi sawaal tang karta hai, to hata do.</b> Poore array ko ek tukda maano. Usko do hisson mein baanto, phir har hisse ko do mein. Yeh chalta raho jab tak ek-ek number na bach jaye. Har tukda apne do bachchon ka sum rakhta hai. Yeh <b>segment tree</b> hai. Har baar aadha kiya, isliye <b>log n</b> levels, matlab 10 lakh par sirf 20.</p>
<p><b>Ab dono cost picture se seedhe padh lo.</b> Update mein ek leaf badla, to sirf uske upar wale tukde galat hue, har level par ek: <b>log n</b>. Query mein range ko poore tukdon se dhako, har level par zyada se zyada do tukde bahar nikalte hain: <b>2 log n</b>. 10 lakh par 20 aur 40, dono jagah.</p>
<p><b>Yeh sirf sum ke liye nahi hai, aur yeh pooch liya jaata hai.</b> Upar kahin addition ki zaroorat nahi padi. Bas itna chahiye ki tukda apne do hisson se ban jaye. To min, max, gcd, product, sab chalega. <b>Average nahi chalega</b>, kyunki averages ka average, average nahi hota. Sum aur count alag rakho, divide aakhir mein karo.</p>
<p><b>Fenwick kab? Aur kab nahi?</b> Sirf shuruaat se lekar kisi point tak ka total chahiye, to Fenwick 10 line mein wahi log n de deta hai. Par beech ki range woh <b>ghata kar</b> nikalta hai: end tak ka total minus start tak ka total. Sum ghataya ja sakta hai, isliye Fenwick sum karta hai. <b>Minimum ghataya nahi ja sakta, isliye Fenwick min nahi karta.</b> Yeh line interview mein seedha poochhi jaati hai.</p>
<p><b>Aur kab yeh galat jawab hai:</b> data badalta hi nahi to sparse table lo. n aur queries dono chhote hain, jaise 1000-1000, to simple loop 10 lakh steps mein ho jayega, 100 line ka tree mat likho.</p>`,

  viz: ["segment-tree"],

  math: [
    { t: "The two structures you already have are both extreme", d: "Neither is bad. They are optimal at opposite ends, and a workload with both operations in it lands in the worst case of whichever you picked.", w:
`n = 10^6, q = 10^6 operations, mixed updates and queries

plain array    update 1       query n      ->  10^12
prefix sums    update n       query 1      ->  10^12
segment tree   update log n   query log n  ->  4 x 10^7

20 and 20, instead of 1 and 1,000,000` },
    { t: "Why a query reads only about 2 log n nodes", d: "The range is covered by whole blocks. At each level of the tree at most two partial blocks survive, and everything inside them is already summarised.", w:
`a segment tree over n leaves: 2n - 1 nodes, height log2 n

any range is covered by at most 2 nodes per level
  ->  at most 2 log2 n nodes in total

n = 10^6: at most 40 nodes read, out of 2 x 10^6

allocate 4n, not 2n: the bottom level is padded up to
the next power of two, and 2 x 2^ceil(log2 n) <= 4n` },
    { t: "Fenwick: the lowbit jump, traced on real indices", d: "The whole structure is i & (-i), the lowest set bit. Queries walk it off, updates walk it on, and both stop after one step per bit.", w:
`i & (-i) isolates the lowest set bit

prefix(13):  13 = 1101, subtract the lowbit each time
  13 -> 12 -> 8 -> 0
  3 reads, exactly the number of set bits in 13

update(5):   5 = 0101, add the lowbit each time
  5 -> 6 -> 8 -> 16 -> ... while <= n
  at most log2 n writes` },
    { t: "What the combine function has to satisfy", d: "Associativity is the whole requirement for a segment tree. Fenwick asks for one thing more, and that extra requirement is why it cannot answer range minimum.", w:
`segment tree needs: (a . b) . c = a . (b . c)
  sum, min, max, gcd, product, matrix product   yes
  average                                       no

  (store sum and count, divide at the very end)

Fenwick needs an inverse as well, because it builds a
range from two prefixes by subtracting:
  sum has one (minus), min has none
  hence no Fenwick for range minimum` },
    { t: "Three situations where this is the wrong answer", d: "The tree is the right structure for interleaved updates and queries. Remove either half of that and something simpler wins outright.", w:
`no updates at all       sparse table
                        build n log n, query O(1)
n and q both small      a plain loop
                        n = q = 1000  ->  10^6, fine
one update, then reads  prefix sums, rebuilt once
                        build n, query 1

a segment tree here is 100 lines that lose on both axes` },
  ],

  costs: [
    ["build a segment tree", "O(n) time, O(4n) space", "one pass over n leaves and n-1 internal nodes, 4n is the safe array size"],
    ["segment tree point update", "O(log n)", "one root-to-leaf path, recombined on the way back up"],
    ["segment tree range query", "O(log n)", "at most two straddling nodes per level, the rest return whole or nothing"],
    ["Fenwick build", "O(n) in place, O(n log n) naively", "n calls to add is the version everybody writes without thinking"],
    ["Fenwick update or prefix", "O(log n)", "one iteration per set bit added or stripped, never more than 32"],
    ["range update with lazy propagation", "O(log n)", "the change parks at O(log n) nodes and is pushed down only when read"],
    ["static array, prefix sums instead", "O(n) build, O(1) query", "no tree, no pointers, no cache misses: use this when nothing is written"],
  ],

  variants: [
    { n: "Prefix sums",
      cost: "build O(n), query O(1), update O(n)",
      idea: "Store every running total, so a range is one subtraction.",
      when: "The array is fixed. Read only workloads, and 2-D rectangles.",
      watch: "A single write invalidates the whole tail. If updates exist at all, this is the wrong page." },
    { n: "Sqrt decomposition",
      cost: "query and update O(sqrt n)",
      idea: "One aggregate per block of size sqrt(n): whole blocks in the middle, loose elements at the ends.",
      when: "You want something you can derive under pressure, or the operation is too awkward to fit a tree.",
      watch: "Worse asymptotics than a tree. Fine at n = 100000, a timeout at n = 1000000." },
    { n: "Fenwick tree (BIT)",
      cost: "update and prefix O(log n)",
      idea: "Node i covers the last <code>i &amp; -i</code> elements. Walk the bits of the index instead of the tree.",
      when: "Prefix sums or counts under point updates, especially counting inversions. The default in contests.",
      watch: "One indexed, invertible operations only. No minimum, and index 0 loops forever." },
    { n: "Segment tree",
      cost: "build O(n), update and query O(log n)",
      idea: "Aggregate per node over a halved range, any associative op.",
      when: "Min, max, gcd, or anything a subtraction cannot recover. Also when you must query a node during the descent.",
      watch: "Size the array 4n, not 2n. Get the identity right: 0 for sum, infinity for min, and they are not interchangeable." },
    { n: "Segment tree with lazy propagation",
      cost: "range update and range query O(log n)",
      idea: "Park a pending change on a node and push it to the children only when someone descends through it.",
      when: "Range updates, add v to all of l..r, or assign over a range.",
      watch: "Composing two pending updates is the part that goes wrong. Rarely asked in interviews, so name it and move on." },
  ],

  impl: [
    ["Python", "no stdlib structure, write the class", "Depth is only log n so recursion is safe here, unlike on a skewed tree. Ints never overflow, but a pure Python segment tree at n = 200000 is slow enough to fail a tight limit."],
    ["Java", "no built-in, use long[] and int[]", "Use long for sums. Compute mid as (lo + hi) >>> 1 to dodge signed overflow, and remember Arrays.fill for a non-zero identity."],
    ["C++", "no standard structure, vector<long long>", "__builtin_ctz gives the lowest set bit index. Use long long for sums and LLONG_MAX, not INT_MAX, as the min identity."],
    ["JavaScript", "plain arrays or Int32Array", "Bitwise operators coerce to 32-bit signed, so i & -i is only correct below 2^31. Sums past 2^53 need BigInt."],
  ],

  code: {
    pseudo: `# The trade, before a single line of code:
#   plain array   update O(1)      range query O(n)
#   prefix sums   update O(n)      range query O(1)
#   these trees   update O(log n)  range query O(log n)

# --- FENWICK (binary indexed tree), 1-indexed, prefixes only -------
# i & -i isolates the LOWEST SET BIT of i, which is exactly how many
# elements node i is responsible for.
tree[1..n] <- all zeros

add(i, delta):                    # i is 1-based
    while i <= n:
        tree[i] <- tree[i] + delta
        i <- i + (i & -i)         # up to the next node covering i

prefix(i):                        # aggregate of a[1..i]
    s <- 0
    while i > 0:
        s <- s + tree[i]
        i <- i - (i & -i)         # strip the lowest set bit
    return s

rangeSum(l, r) = prefix(r) - prefix(l - 1)
# that subtraction is the catch: sums yes, minimum no

# --- SEGMENT TREE, any ASSOCIATIVE op: sum, min, max, gcd, or ------
build(node, lo, hi):
    if lo == hi: t[node] <- a[lo]; return
    mid <- (lo + hi) / 2
    build(2*node, lo, mid)
    build(2*node+1, mid+1, hi)
    t[node] <- op(t[2*node], t[2*node+1])

query(node, lo, hi, l, r):
    if r < lo or hi < l:    return IDENTITY   # 0 for sum, +inf for min
    if l <= lo and hi <= r: return t[node]    # this node tiles a piece
    mid <- (lo + hi) / 2
    return op(query(2*node,   lo,    mid, l, r),
              query(2*node+1, mid+1, hi,  l, r))

update(node, lo, hi, i, v):
    if lo == hi: t[node] <- v; return
    mid <- (lo + hi) / 2
    if i <= mid: update(2*node,   lo,    mid, i, v)
    else:        update(2*node+1, mid+1, hi,  i, v)
    t[node] <- op(t[2*node], t[2*node+1])     # repair on the way up`,
    py: `# Fenwick: prefix aggregates under point updates, in ten lines.
class Fenwick:
    def __init__(self, n):
        self.n = n
        self.t = [0] * (n + 1)      # slot 0 is unused, deliberately

    def add(self, i, delta):        # i is 1-based
        while i <= self.n:
            self.t[i] += delta
            i += i & -i             # lowest set bit = width of node i

    def prefix(self, i):
        s = 0
        while i > 0:
            s += self.t[i]
            i -= i & -i
        return s

    def range_sum(self, l, r):      # 1-based, inclusive
        return self.prefix(r) - self.prefix(l - 1)


# Segment tree: swap op and identity for min, max, gcd, or.
class SegTree:
    def __init__(self, a, op=lambda x, y: x + y, identity=0):
        self.n, self.op, self.id = len(a), op, identity
        self.t = [identity] * (4 * len(a))   # 4n, not 2n
        self._build(1, 0, self.n - 1, a)

    def _build(self, node, lo, hi, a):
        if lo == hi:
            self.t[node] = a[lo]; return
        mid = (lo + hi) // 2
        self._build(2*node, lo, mid, a)
        self._build(2*node+1, mid+1, hi, a)
        self.t[node] = self.op(self.t[2*node], self.t[2*node+1])

    def update(self, i, v):
        self._upd(1, 0, self.n - 1, i, v)

    def _upd(self, node, lo, hi, i, v):
        if lo == hi:
            self.t[node] = v; return
        mid = (lo + hi) // 2
        if i <= mid: self._upd(2*node, lo, mid, i, v)
        else:        self._upd(2*node+1, mid+1, hi, i, v)
        self.t[node] = self.op(self.t[2*node], self.t[2*node+1])

    def query(self, l, r):
        return self._q(1, 0, self.n - 1, l, r)

    def _q(self, node, lo, hi, l, r):
        if r < lo or hi < l:    return self.id       # disjoint
        if l <= lo and hi <= r: return self.t[node]  # fully covered
        mid = (lo + hi) // 2
        return self.op(self._q(2*node, lo, mid, l, r),
                       self._q(2*node+1, mid+1, hi, l, r))`,
    java: `// Fenwick. 1-indexed: 0 has no lowest set bit, so the loops never move.
class Fenwick {
    private final long[] t;
    private final int n;

    Fenwick(int n) { this.n = n; this.t = new long[n + 1]; }

    void add(int i, long delta) {           // i is 1-based
        for (; i <= n; i += i & -i) t[i] += delta;
    }

    long prefix(int i) {
        long s = 0;
        for (; i > 0; i -= i & -i) s += t[i];
        return s;
    }

    long rangeSum(int l, int r) { return prefix(r) - prefix(l - 1); }
}

// Segment tree for sums. For min, change the combine and the identity.
class SegTree {
    private final long[] t;
    private final int n;

    SegTree(int[] a) {
        n = a.length;
        t = new long[4 * n];                // 4n is the safe size
        build(1, 0, n - 1, a);
    }

    private void build(int node, int lo, int hi, int[] a) {
        if (lo == hi) { t[node] = a[lo]; return; }
        int mid = (lo + hi) >>> 1;          // >>> 1, never (lo + hi) / 2
        build(2*node, lo, mid, a);
        build(2*node+1, mid+1, hi, a);
        t[node] = t[2*node] + t[2*node+1];
    }

    void update(int i, int v) { upd(1, 0, n - 1, i, v); }

    private void upd(int node, int lo, int hi, int i, int v) {
        if (lo == hi) { t[node] = v; return; }
        int mid = (lo + hi) >>> 1;
        if (i <= mid) upd(2*node, lo, mid, i, v);
        else          upd(2*node+1, mid+1, hi, i, v);
        t[node] = t[2*node] + t[2*node+1];  // repair the path upward
    }

    long query(int l, int r) { return q(1, 0, n - 1, l, r); }

    private long q(int node, int lo, int hi, int l, int r) {
        if (r < lo || hi < l)    return 0;  // identity for SUM only
        if (l <= lo && hi <= r)  return t[node];
        int mid = (lo + hi) >>> 1;
        return q(2*node, lo, mid, l, r) + q(2*node+1, mid+1, hi, l, r);
    }
}`,
    cpp: `// Fenwick, 1-indexed. i & -i is the lowest set bit of i.
struct Fenwick {
    int n; vector<long long> t;
    Fenwick(int n) : n(n), t(n + 1, 0) {}

    void add(int i, long long delta) {          // i is 1-based
        for (; i <= n; i += i & -i) t[i] += delta;
    }

    long long prefix(int i) const {
        long long s = 0;
        for (; i > 0; i -= i & -i) s += t[i];
        return s;
    }

    long long rangeSum(int l, int r) const {
        return prefix(r) - prefix(l - 1);
    }
};

// Segment tree, here over MINIMUM, to show it is not about sums.
struct SegTree {
    int n; vector<long long> t;
    static const long long ID = LLONG_MAX;      // identity for min

    SegTree(const vector<int>& a) : n(a.size()), t(4 * a.size(), ID) {
        build(1, 0, n - 1, a);
    }

    void build(int node, int lo, int hi, const vector<int>& a) {
        if (lo == hi) { t[node] = a[lo]; return; }
        int mid = lo + (hi - lo) / 2;
        build(2*node, lo, mid, a);
        build(2*node+1, mid+1, hi, a);
        t[node] = min(t[2*node], t[2*node+1]);
    }

    void update(int node, int lo, int hi, int i, long long v) {
        if (lo == hi) { t[node] = v; return; }
        int mid = lo + (hi - lo) / 2;
        if (i <= mid) update(2*node, lo, mid, i, v);
        else          update(2*node+1, mid+1, hi, i, v);
        t[node] = min(t[2*node], t[2*node+1]);
    }

    long long query(int node, int lo, int hi, int l, int r) const {
        if (r < lo || hi < l)   return ID;      // disjoint
        if (l <= lo && hi <= r) return t[node]; // fully inside
        int mid = lo + (hi - lo) / 2;
        return min(query(2*node,   lo,    mid, l, r),
                   query(2*node+1, mid+1, hi,  l, r));
    }
};`,
    js: `// Fenwick. Slot 0 is unused: 0 & -0 is 0, so the loop would never move.
class Fenwick {
  constructor(n) { this.n = n; this.t = new Array(n + 1).fill(0); }

  add(i, delta) {                     // i is 1-based
    for (; i <= this.n; i += i & -i) this.t[i] += delta;
  }

  prefix(i) {
    let s = 0;
    for (; i > 0; i -= i & -i) s += this.t[i];
    return s;
  }

  rangeSum(l, r) { return this.prefix(r) - this.prefix(l - 1); }
}

// Segment tree, iterative and bottom up: leaves live at [n, 2n).
// Half the code of the recursive form, and no call stack at all.
class SegTree {
  constructor(a) {
    this.n = a.length;
    this.t = new Array(2 * this.n).fill(0);
    for (let i = 0; i < this.n; i++) this.t[this.n + i] = a[i];
    for (let i = this.n - 1; i > 0; i--)
      this.t[i] = this.t[2 * i] + this.t[2 * i + 1];
  }

  update(i, v) {                      // set a[i] = v, then repair upward
    let p = i + this.n;
    this.t[p] = v;
    for (p >>= 1; p > 0; p >>= 1)
      this.t[p] = this.t[2 * p] + this.t[2 * p + 1];
  }

  query(l, r) {                       // inclusive l..r
    let res = 0;                      // the identity, 0 for sum
    for (l += this.n, r += this.n + 1; l < r; l >>= 1, r >>= 1) {
      if (l & 1) res += this.t[l++];  // l is a right child, take it
      if (r & 1) res += this.t[--r];  // r is a right child, take its left
    }
    return res;
  }
}`,
  },
  codecap: "Fenwick is ten lines and one bit trick. The segment tree is longer, and answers the questions Fenwick cannot even be asked.",

  q: [
    ["The array changes between queries. Why do prefix sums stop working, and what is the fix?", "One write invalidates every prefix after it, so an update costs a full O(n) rebuild. A Fenwick or segment tree keeps both the update and the query at O(log n), which is the entire reason to type more code."],
    ["Why does a segment tree query touch only O(log n) nodes?", "At each level, a node fully inside the range returns its stored value and a node fully outside returns the identity. Only nodes straddling one of the two endpoints are split further, so at most a constant number per level across log n levels, and those nodes tile the range exactly."],
    ["What property must the operation have for a segment tree, and what extra does a Fenwick need?", "A segment tree needs only associativity, so sum, min, max, gcd and bitwise or all work with the same code. A Fenwick additionally needs the operation to be invertible, because a range is two prefixes subtracted, which is why it can do sums but not minimum."],
    ["What does i & -i compute, and why is it the whole trick?", "It isolates the lowest set bit of i, and that value is exactly how many elements node i covers. Stripping the bit walks down through the prefix, adding it walks up through the nodes that must be updated, and each loop runs once per bit."],
    ["Why is a Fenwick tree one indexed?", "Index 0 has no lowest set bit, so i & -i is 0 and both loops stop moving. The structure does not crash, it just quietly does nothing, which is worse."],
    ["What does lazy propagation buy, and when would you not bother?", "It extends range queries to range updates by parking a pending change at a node and pushing it down only when someone descends through it, keeping both at O(log n). Skip it if updates are single points, and skip both trees entirely if the array never changes at all."],
  ],

  traps: [
    "<b>Calling <code>add</code> from index 0 on a Fenwick.</b> <code>0 &amp; -0</code> is 0, so the update loop never advances and the query loop never terminates the way you expect. The structure is one indexed and there is nothing optional about it.",
    "<b>Sizing the segment tree array at 2n.</b> The recursive form with children at 2*node and 2*node+1 needs <b>4n</b> when n is not a power of two, and the overflow lands in whatever memory follows.",
    "<b>Returning 0 as the identity for a min query.</b> Every disjoint node then reports a minimum of zero and the answer is zero forever. Sum wants 0, min wants positive infinity, max wants negative infinity, gcd wants 0 again, and they are not interchangeable.",
    "<b>Building a Fenwick with n calls to add.</b> That is O(n log n) for something with a known O(n) in-place build. It matters when n is 200000 and the build sits inside another loop.",
    "<b>Reaching for a Fenwick to answer range minimum.</b> Two prefixes only become a range if you can subtract, and min has no inverse. Use a segment tree, or a sparse table if nothing ever changes.",
    "<b>Building a tree for a static array.</b> If there are no updates, prefix sums are shorter, faster and impossible to get wrong. Reaching for a segment tree here reads as pattern matching rather than thinking.",
  ],

  p: [
    [303, "range-sum-query-immutable", "Range Sum Query Immutable, the static case that needs no tree at all", "E"],
    [307, "range-sum-query-mutable", "Range Sum Query Mutable, the exact problem", "M"],
    [315, "count-of-smaller-numbers-after-self", "Count of Smaller Numbers After Self, a Fenwick over values instead of indices", "H"],
    [327, "count-of-range-sum", "Count of Range Sum, a Fenwick over prefix sums", "H"],
    [493, "reverse-pairs", "Reverse Pairs, the same counting trick with a scaled comparison", "H"],
    [699, "falling-squares", "Falling Squares, range maximum with range assignment, lazy territory", "H"],
    [218, "the-skyline-problem", "The Skyline Problem, the segment tree finale", "H"],
  ],
},

/* ==================================================================== */
{
  id: "graphs",
  n: "Graphs: representation and traversal",
  group: "Graphs",
  one: "A graph is things and connections, with no root and no rules. DFS and BFS are the same walk with a different container, and the visited set is the only thing between you and an infinite loop.",

  plain: `<p>Everything so far has been a graph wearing a uniform. A linked list is a graph where each node has exactly one exit. A tree is a graph with one root and no way back. Take away those restrictions and you are left with the general case: some things, and some connections between them.</p>
<p>Two consequences follow immediately. First, there is no root, so "where do I start" becomes a real question and one traversal may not reach everything. Second, and much more importantly, <b>paths can loop</b>. In a tree you can walk forever without meeting yourself. In a graph you can, and you will, and your program will not stop.</p>
<p>Hence the visited set, which is not an optimisation. It is the thing keeping the program finite.</p>
<p>Once that is handled, traversal is almost anticlimactic. Take a node, look at its neighbours, add the unvisited ones to a container, repeat. Make the container a stack and you have depth-first search. Make it a queue and you have breadth-first search. That is the entire difference.</p>
<p><b>Analogy.</b> A city with one-way and two-way streets. There is no "first" junction, plenty of ways to drive in circles, and the only way to survey the place is to write down where you have been.</p>`,

  why: [
    { t: "A graph is what is left after you remove the promises", d: "A tree guarantees one root, no cycles, and exactly one path between any two nodes. Every one of those guarantees is something an algorithm can lean on. Remove them and the algorithms have to carry their own guarantees instead, which is what the visited set is." },
    { t: "So the visited set is correctness, not performance", d: "Without it a cycle makes traversal run forever. With it, every node is processed once, and the cost becomes <b>O(V + E)</b>: every node once, every edge considered once from each end. That formula is not a coincidence, it is the visited set being counted." },
    { t: "Adjacency list, unless you have a reason", d: "The list stores each node's neighbours: <b>O(V + E)</b> space, and listing a node's neighbours takes time proportional to how many it has. A matrix answers \"is there an edge between these two\" in one lookup, but costs <b>O(V squared)</b> whether or not the edges exist. Real graphs are sparse, and traversal spends its life listing neighbours rather than testing specific pairs, so the list wins nearly always." },
    { t: "DFS and BFS differ only in which end of the container you take from", d: "Take the most recently added node and you go deep, following one path to its conclusion before backing up. Take the oldest and you expand in rings. Same loop, same visited set, same complexity. Recursion is just DFS with the call stack playing the part of the stack." },
    { t: "Which is why BFS finds shortest paths and DFS does not", d: "BFS finishes everything at distance 1 before anything at distance 2, so the <b>first time</b> it reaches a node is by the fewest edges. DFS reaches nodes in whatever order its commitments led to, so its first arrival means nothing. This holds only while every edge counts the same, which is exactly where the next page starts." },
    { t: "Direction is a modelling decision you make twice", d: "Undirected means adding both <code>adj[u].add(v)</code> and <code>adj[v].add(u)</code>. Forget the second and you have quietly built a directed graph and will spend an hour wondering why half your edges vanished. Directed graphs also permit cycles that are not obvious, which is why cycle detection there needs a recursion-stack marker rather than a plain visited flag." },
    { t: "One traversal is one component", d: "A graph need not be connected. Loop over all nodes and start a fresh traversal from each one not yet visited. The number of starts is the number of <b>connected components</b>. The total cost is still O(V + E), because the visited set stops any node being processed twice." },
  ],

  variants: [
    { n: "Connected components", cost: "O(V + E)",
      idea: "Loop over every node and start a fresh traversal from any you have not visited. The number of starts is the number of components.",
      when: "Counting islands, provinces, friend circles, or any \"how many separate groups\" question.",
      watch: "Union-find does this too, and beats traversal when edges arrive over time rather than all at once." },

    { n: "Cycle detection, undirected", cost: "O(V + E)",
      idea: "During DFS, an edge to an already visited node means a cycle, unless that node is simply the parent you just came from.",
      when: "Validating that a graph is a tree, which needs exactly V-1 edges and no cycle.",
      watch: "The parent check is the whole difficulty. Forget it and every single edge looks like a two-node cycle." },

    { n: "Cycle detection, directed", cost: "O(V + E)",
      idea: "A plain visited set is not enough. You need to know whether a node is on the CURRENT path, which means three states rather than two.",
      when: "Deadlock detection, build dependency checks, course prerequisites.",
      watch: "See the topological sort page, where Kahn's algorithm reports the cycle for free by counting what it failed to emit." },

    { n: "Bipartite check, two-colouring", cost: "O(V + E)",
      idea: "Traverse and colour each node the opposite of whoever reached it. An edge joining two nodes of the same colour proves the graph is not bipartite.",
      when: "Splitting into two hostile groups, matching problems, or checking a graph is free of odd-length cycles.",
      watch: "A graph is bipartite exactly when it has no odd cycle. Remember to run it from every component, since one bad component ruins it." },

    { n: "Multi-source BFS", cost: "O(V + E)",
      idea: "Seed the queue with every source at once rather than one. The first arrival at any node is then its distance to the nearest source.",
      when: "Rotting oranges, nearest exit, distance to the closest water cell.",
      watch: "Feels like it needs one BFS per source, which would be O(V(V+E)). Seeding them together is one traversal and the same answer." },

    { n: "Bridges and articulation points", cost: "O(V + E)",
      idea: "One DFS tracking discovery times and the earliest reachable ancestor finds every edge or node whose removal disconnects the graph.",
      when: "Network reliability, single points of failure.",
      watch: "Tarjan's low-link machinery. Worth naming, rarely worth writing under time pressure." },
  ],

  hing: `<p><b>Ab tak jo padha, sab graph hi tha, alag kapdon mein.</b> Linked list = graph jisme har node ka ek hi raasta bahar jaata hai. Tree = graph jisme ek root hai aur peeche laut-ne ka raasta nahi. Yeh saari <b>paabandiyan</b> hata do, to jo bachta hai wahi graph hai: kuch cheezein, aur unke beech connections.</p>
<p><b>Do baatein turant badal jaati hain.</b> Pehli, koi <b>root nahi</b> hai. To "shuru kahan se karein" khud ek sawaal ban jaata hai, aur ek traversal se poora graph cover ho hi nahi sakta. Doosri, aur zyada important: <b>raaste ghoom kar wapas aa sakte hain</b>. Tree mein tum kabhi apne aap se nahi milte. Graph mein miloge, aur program kabhi rukega nahi.</p>
<p><b>Isliye visited set koi optimisation nahi hai.</b> Woh wahi cheez hai jo program ko <b>khatam</b> hone deti hai. Yeh line interview mein bolna: "visited set correctness ke liye hai, speed ke liye nahi".</p>
<p><b>Uske baad traversal bilkul boring hai:</b> node lo, uske padosi dekho, jo visit nahi hue unhe container mein daalo, dohrao. Container <b>stack</b> hai to <b>DFS</b>, <b>queue</b> hai to <b>BFS</b>. Bas itna hi farak hai. Recursion bhi DFS hi hai, bas stack ka kaam call stack kar raha hai.</p>
<p><b>Aur isiliye BFS shortest path deta hai, DFS nahi.</b> BFS pehle distance 1 ke saare nodes khatam karta hai, phir distance 2. Isliye jab woh kisi node par <b>pehli baar</b> pahunchta hai, wahi sabse kam edges wala raasta hota hai. DFS jahan mann kiya wahan chala jaata hai, to uski "pehli baar" ka koi matlab nahi. <b>Par yeh sirf tab tak sach hai jab har edge ki cost barabar ho</b>, aur wahin se agla page shuru hota hai.</p>
<p><b>Representation:</b> <b>adjacency list</b> lo. Space <b>O(V + E)</b>, aur padosi ginwana sasta. Matrix se "in do ke beech edge hai kya" ek lookup mein pata chal jaata hai, par space <b>O(V²)</b> lagta hai chahe edges ho ya na ho. Asli graphs sparse hote hain aur traversal din bhar padosi hi ginwaata hai, to list hi jeetegi.</p>
<p><b>Undirected graph mein edge do baar daalni hoti hai:</b> <code>adj[u].add(v)</code> aur <code>adj[v].add(u)</code>. Doosri bhool gaye to tumne chupke se directed graph bana diya, aur ek ghanta yeh sochne mein jaayega ki aadhe edges kahan gaye.</p>
<p><b>Ek aur cheez: graph juda hua (connected) ho, zaroori nahi.</b> Saare nodes par loop chalao aur har un-visited node se naya traversal shuru karo. Kitni baar shuru karna pada, utne hi <b>connected components</b> hain. Total cost phir bhi O(V + E), kyunki visited set kisi node ko do baar process hone hi nahi deta.</p>`,

  viz: ["graph-basics", "adjacency"],
  see: [["VA", "https://visualgo.net/en/dfsbfs", "VisuAlgo, DFS and BFS side by side"]],

  math: [
    { t: "List or matrix, decided by density and nothing else", d: "Both are correct. The choice is memory, and on the sparse graphs interviews actually give you the difference is four orders of magnitude.", w:
`V vertices, E edges

matrix:  V^2 memory, edge test O(1),    neighbours O(V)
list:    V + E memory, edge test O(deg), neighbours O(deg)

V = 10^5, E = 2 x 10^5 (sparse):
  matrix  10^10 cells  = 10 GB
  list    3 x 10^5 entries = a few MB

the matrix wins only as E approaches V^2 / 2` },
    { t: "Where O(V + E) comes from", d: "The loop over neighbours does not run V times per node. It runs deg(v) times, and the degrees add up to twice the edge count.", w:
`sum of all degrees = 2E   (undirected)
                   = E    (directed, out-degrees)

so all the inner loops together run 2E times, not V^2
plus V pushes and V pops

V = 10^5, E = 2 x 10^5  ->  about 5 x 10^5 steps
scanning a matrix for the same graph: 10^10 cells` },
    { t: "The visited set is correctness, and here is the difference", d: "On a tree you could leave it out and still terminate. On anything with a cycle it is the only thing between you and a loop that never ends.", w:
`a tree has exactly V - 1 edges and no cycle
any graph with E >= V contains at least one cycle

with visited:     each node entered once, each edge
                  examined twice   ->  O(V + E)
without visited:  a 3-cycle revisits for ever

it is not a speed-up. It is the termination argument.` },
    { t: "The edge counts worth having memorised", d: "These four lines answer most of the modelling questions in one step, including whether the thing in front of you is secretly a tree.", w:
`undirected simple:  E <= V(V-1)/2
directed simple:    E <= V(V-1)
a tree:             E = V - 1 exactly, and connected
connected:          E >= V - 1

connected AND E = V - 1  =>  it is a tree
V = 1,000  ->  at most 499,500 undirected edges` },
    { t: "One traversal is one component", d: "Nothing extra is needed to count components, and the total cost does not change, because the traversals partition the graph between them.", w:
`for v in all V nodes:
    if v not visited: traverse(v), components += 1

each node is visited exactly once across all traversals
each edge is examined exactly twice
so the whole sweep is still O(V + E), not components x (V+E)` },
  ],

  costs: [
    ["build an adjacency list", "O(V + E) time and space", "the default representation"],
    ["adjacency matrix", "O(V²) space", "regardless of how few edges exist"],
    ["is there an edge u to v?", "O(1) matrix, O(degree) list", "the one thing the matrix is genuinely better at"],
    ["list a node's neighbours", "O(degree) list, O(V) matrix", "and this is what traversal does constantly"],
    ["DFS or BFS", "O(V + E) time, O(V) space", "each node once, each edge from each end"],
    ["shortest path, unweighted", "O(V + E) with BFS", "first arrival is the fewest edges"],
    ["connected components", "O(V + E)", "restart from every unvisited node; the visited set keeps it linear"],
  ],

  traps: [
    "<b>No visited set.</b> A cycle turns traversal into an infinite loop. This is not a slow program, it is a hung one.",
    "<b>Marking visited on pop instead of on push.</b> The same node gets queued once per neighbour, so the queue swells and O(V + E) quietly becomes something much worse.",
    "<b>Adding only one direction for an undirected edge.</b> You have built a different graph than the one in the problem statement.",
    "<b>Recursive DFS on 10⁵ nodes.</b> That is 10⁵ stack frames and a stack overflow. Use an explicit stack when the graph is large or possibly a long path.",
    "<b>Detecting cycles in a directed graph with a plain visited set.</b> You need to know whether a node is on the <i>current</i> path, which is a recursion-stack marker, not a been-there flag.",
    "<b>Assuming one traversal covers the graph.</b> It covers one component. There may be many.",
  ],

  impl: [
    ["Python", "defaultdict(list) · deque for BFS", "Recursion limit around 1000, so deep DFS needs an explicit stack."],
    ["Java", "Map<Integer,List<Integer>> · ArrayDeque", "computeIfAbsent to build the list. visited.add() returns false if already present, which is a neat guard."],
    ["C++", "vector<vector<int>> adj(V) · queue", "Index by node id directly when nodes are 0..V-1, which is the usual case and much faster than a map."],
    ["JavaScript", "Map of arrays, or an array of arrays", "Array.shift() is O(n), so keep a head index for the BFS queue."],
  ],

  code: {
    pseudo: `# ADJACENCY LIST: for each node, who it connects to
adj <- empty map from node to list
for each edge (u, v):
    adj[u].add(v)
    adj[v].add(u)        # ONLY for undirected. Forgetting this is a classic.

# DFS and BFS are the SAME LOOP with a different container.
traverse(start):
    visited <- { start }
    container <- [ start ]              # stack -> DFS, queue -> BFS
    while container not empty:
        node <- take from container     # from the END for a stack, FRONT for a queue
        visit(node)
        for next in adj[node]:
            if next not in visited:
                visited.add(next)       # mark on PUSH, not on pop
                container.add(next)

# BFS BY LEVELS, which is how you get a distance out of it
queue <- [ start ];  visited <- { start };  distance <- 0
while queue not empty:
    for each of the current level:      # freeze the size first
        node <- popFront(queue)
        if node is the goal: return distance
        for next in adj[node]:
            if next not in visited: visited.add(next); pushBack(queue, next)
    distance <- distance + 1

# CONNECTED COMPONENTS: restart wherever you have not been
count <- 0
for node in all nodes:
    if node not in visited:
        traverse(node)
        count <- count + 1`,
    py: `from collections import defaultdict, deque

adj = defaultdict(list)
for u, v in edges:
    adj[u].append(v)
    adj[v].append(u)              # undirected: both directions

def dfs(start):                   # explicit stack: no recursion limit to worry about
    visited, stack, order = {start}, [start], []
    while stack:
        node = stack.pop()
        order.append(node)
        for nxt in adj[node]:
            if nxt not in visited:
                visited.add(nxt)  # mark on push
                stack.append(nxt)
    return order

def dfs_rec(node, visited):       # the recursive shape, for small graphs
    visited.add(node)
    for nxt in adj[node]:
        if nxt not in visited:
            dfs_rec(nxt, visited)

def bfs_shortest(start, goal):    # unweighted shortest path
    if start == goal: return 0
    visited, q, dist = {start}, deque([start]), 0
    while q:
        for _ in range(len(q)):   # freeze the level
            node = q.popleft()
            for nxt in adj[node]:
                if nxt == goal: return dist + 1
                if nxt not in visited:
                    visited.add(nxt)
                    q.append(nxt)
        dist += 1
    return -1

def components(nodes):
    visited, count = set(), 0
    for n in nodes:
        if n not in visited:
            dfs_rec(n, visited)
            count += 1
    return count`,
    java: `Map<Integer, List<Integer>> adj = new HashMap<>();
for (int[] e : edges) {
    adj.computeIfAbsent(e[0], k -> new ArrayList<>()).add(e[1]);
    adj.computeIfAbsent(e[1], k -> new ArrayList<>()).add(e[0]);   // undirected
}

static List<Integer> dfs(int start, Map<Integer, List<Integer>> adj) {
    Set<Integer> visited = new HashSet<>();
    Deque<Integer> stack = new ArrayDeque<>();
    List<Integer> order = new ArrayList<>();
    stack.push(start); visited.add(start);
    while (!stack.isEmpty()) {
        int node = stack.pop();
        order.add(node);
        for (int nxt : adj.getOrDefault(node, List.of()))
            if (visited.add(nxt)) stack.push(nxt);   // add returns false if present
    }
    return order;
}

static int bfsShortest(int start, int goal, Map<Integer, List<Integer>> adj) {
    if (start == goal) return 0;
    Set<Integer> visited = new HashSet<>(Set.of(start));
    Deque<Integer> q = new ArrayDeque<>(List.of(start));
    for (int dist = 0; !q.isEmpty(); dist++)
        for (int i = q.size(); i > 0; i--) {
            int node = q.poll();
            for (int nxt : adj.getOrDefault(node, List.of())) {
                if (nxt == goal) return dist + 1;
                if (visited.add(nxt)) q.offer(nxt);
            }
        }
    return -1;
}`,
    cpp: `// Nodes numbered 0..V-1, so index straight into a vector
vector<vector<int>> adj(V);
for (auto& e : edges) {
    adj[e[0]].push_back(e[1]);
    adj[e[1]].push_back(e[0]);        // undirected
}

vector<int> dfs(int start, const vector<vector<int>>& adj) {
    vector<char> visited(adj.size(), 0);
    vector<int> stack{start}, order;
    visited[start] = 1;
    while (!stack.empty()) {
        int node = stack.back(); stack.pop_back();
        order.push_back(node);
        for (int nxt : adj[node])
            if (!visited[nxt]) { visited[nxt] = 1; stack.push_back(nxt); }
    }
    return order;
}

int bfsShortest(int start, int goal, const vector<vector<int>>& adj) {
    if (start == goal) return 0;
    vector<char> visited(adj.size(), 0);
    queue<int> q; q.push(start); visited[start] = 1;
    for (int dist = 0; !q.empty(); ++dist)
        for (int i = q.size(); i > 0; --i) {
            int node = q.front(); q.pop();
            for (int nxt : adj[node]) {
                if (nxt == goal) return dist + 1;
                if (!visited[nxt]) { visited[nxt] = 1; q.push(nxt); }
            }
        }
    return -1;
}`,
    js: `const adj = new Map();
const link = (u, v) => {
  if (!adj.has(u)) adj.set(u, []);
  adj.get(u).push(v);
};
for (const [u, v] of edges) { link(u, v); link(v, u); }   // undirected

function dfs(start) {
  const visited = new Set([start]), stack = [start], order = [];
  while (stack.length) {
    const node = stack.pop();
    order.push(node);
    for (const nxt of adj.get(node) ?? [])
      if (!visited.has(nxt)) { visited.add(nxt); stack.push(nxt); }
  }
  return order;
}

function bfsShortest(start, goal) {
  if (start === goal) return 0;
  const visited = new Set([start]), q = [start];
  let head = 0, dist = 0;                     // shift() is O(n); index instead
  while (head < q.length) {
    for (let i = q.length - head; i > 0; i--) {
      const node = q[head++];
      for (const nxt of adj.get(node) ?? []) {
        if (nxt === goal) return dist + 1;
        if (!visited.has(nxt)) { visited.add(nxt); q.push(nxt); }
      }
    }
    dist++;
  }
  return -1;
}`,
  },
  codecap: "One loop, one visited set, and a choice of container. Everything else on this page is a consequence of that choice.",

  q: [
    ["What does a graph give up compared to a tree, and what does that cost you?", "One root, no cycles, and a unique path between nodes. Losing the no-cycles guarantee is the expensive one: traversal must carry a visited set or it never terminates."],
    ["Why is the visited set a correctness issue rather than a performance one?", "A cycle makes an unguarded traversal loop forever. The set is what makes the program finite; the fact that it also makes it O(V + E) is a bonus."],
    ["Adjacency list or matrix, and why?", "List, almost always. It is O(V + E) space and lists neighbours in time proportional to the degree, which is what traversal needs. A matrix costs O(V²) regardless of edge count and only wins when you repeatedly test specific pairs in a dense graph."],
    ["What is the only difference between DFS and BFS?", "Which end of the container you take from. Stack gives depth-first, queue gives breadth-first. The loop, the visited set and the complexity are identical."],
    ["Why does BFS give shortest paths when DFS does not?", "BFS exhausts distance 1 before distance 2, so its first arrival at a node uses the fewest edges. DFS arrives in whatever order its commitments produced. This holds only while all edges cost the same."],
    ["Why does one traversal not necessarily cover the graph?", "The graph may be disconnected. Restart from each unvisited node; the number of restarts is the number of connected components, and the total stays O(V + E)."],
  ],

  p: [
    [733, "flood-fill", "Flood Fill, a graph traversal in disguise", "E"],
    [200, "number-of-islands", "Number of Islands, counting components", "M"],
    [133, "clone-graph", "Clone Graph, traversal plus a map", "M"],
    [547, "number-of-provinces", "Number of Provinces, components from a matrix", "M"],
    [994, "rotting-oranges", "Rotting Oranges, multi-source BFS", "M"],
    [127, "word-ladder", "Word Ladder, BFS where the graph is implicit", "H"],
    [417, "pacific-atlantic-water-flow", "Pacific Atlantic, traverse backwards from the edges", "M"],
  ],
},

/* ==================================================================== */
{
  id: "shortest-paths",
  n: "Shortest paths",
  group: "Graphs",
  one: "BFS finds the fewest edges, which stops meaning cheapest the moment edges have costs. Then you always expand the <b>cheapest known node</b>, and a heap is what makes that affordable.",

  plain: `<p>BFS gets shortest paths right for a reason that is easy to miss. Every edge costs exactly one, so the queue already happens to hold nodes in order of distance. The algorithm is not being clever, it is being handed the ordering for free.</p>
<p>Put a cost on each edge and that free ordering evaporates. A route of one expensive edge can cost more than a route of five cheap ones. So "fewest edges" and "cheapest" stop meaning the same thing, and BFS confidently returns the wrong answer.</p>
<p>The repair is small in principle. Keep the best distance known so far for every node. Always work on the <b>cheapest unfinished node</b>. Each time you pick one, check whether going through it improves any of its neighbours. That check is called relaxation and it is the entire algorithm. The priority queue exists solely to answer "which is cheapest" without rescanning everything.</p>
<p>There is one assumption hiding in there, and it is worth naming now: this only works if edges add cost. Allow a negative edge and a settled answer can turn out to be wrong later, which Dijkstra will never notice.</p>
<p><b>Analogy.</b> Planning a drive by always extending the cheapest route you have so far. It works beautifully, right up until someone opens a road that pays you to drive down it.</p>`,

  why: [
    { t: "See why BFS worked, and the rest follows", d: "With unit edges, everything at distance 1 is discovered before anything at distance 2, so the queue is sorted by distance without anyone sorting it. Distance and edge count are the same number. Give edges different costs and those two quantities separate, and the queue's ordering becomes meaningless." },
    { t: "So restore the ordering by hand", d: "Keep a tentative best distance for every node, all infinite except the source. Repeatedly take the <b>cheapest unfinished node</b> and process it. That is the only structural change from BFS, and it is what a priority queue is for: BFS with a heap instead of a queue is Dijkstra." },
    { t: "Relaxation is the whole operation", d: "For each neighbour, ask whether <code>dist[u] + weight(u, v)</code> beats <code>dist[v]</code>. If it does, write down the better number. Nothing else happens. The algorithm is one comparison repeated until nothing improves." },
    { t: "Why a settled node is final, which is also the assumption", d: "When you pull the cheapest unfinished node u, every other unfinished node already costs at least as much. Any alternative route to u must pass through one of them, and since weights are non-negative, going further can only add cost. So no cheaper route can exist and u is done. <b>That argument is load-bearing, and it consumes the non-negativity as fuel.</b>" },
    { t: "Negative edges break the argument, not just the answer", d: "With a negative edge, going further can make a path cheaper, so a node you already settled might have been wrong. Dijkstra has no mechanism to revisit it and will not tell you. <b>Bellman-Ford</b> gives up the greedy shortcut and simply relaxes every edge V-1 times, which is O(V·E) and slower, but correct with negatives. A V-th pass that still improves something proves a negative cycle, at which point \"shortest path\" is not a well-posed question." },
    { t: "Pick the algorithm from the shape of the problem", d: "Unit weights: BFS, O(V + E), and do not reach for a heap out of habit. Non-negative weights: Dijkstra, O((V + E) log V). Negative weights: Bellman-Ford, O(V·E). Every pair of nodes on a small graph: Floyd-Warshall, three nested loops and O(V³), which is worth it only when V is a few hundred. Interviewers ask which one and why far more often than they ask you to type any of them." },
    { t: "A* is Dijkstra that has been told where it is going", d: "Dijkstra expands outward in every direction because it has no idea where the target is. Give it an estimate of remaining distance and let it prefer nodes that look closer to the goal, and it stops exploring the wrong half of the map. If that estimate never overstates the true remaining cost, the answer is still exactly correct." },
  ],

  variants: [
    { n: "BFS", cost: "O(V + E) \u00b7 unweighted only",
      idea: "A queue. The first time you reach a node is by the fewest edges, because distance and edge count are the same number here.",
      when: "Every edge costs the same. Grids, word ladders, social distance.",
      watch: "Reaching for a heap out of habit adds a log factor and buys nothing." },

    { n: "0-1 BFS", cost: "O(V + E) \u00b7 weights of 0 or 1 only",
      idea: "A deque instead of a queue: push a zero-weight edge to the <i>front</i> and a one-weight edge to the back, and the deque stays sorted by distance without a heap.",
      when: "Every edge costs 0 or 1, which happens more often than you would expect once you model a problem well.",
      watch: "It is exact only for those two weights. Anything else and you need Dijkstra." },

    { n: "Dijkstra", cost: "O((V + E) log V) \u00b7 non-negative weights",
      idea: "BFS with a priority queue. Always expand the cheapest unsettled node, relaxing its edges as you go.",
      when: "Weighted graph, all weights non-negative, one source.",
      watch: "Silently wrong with a negative edge. Skip stale heap entries on pop, and settle a node when you pop it, not when you push it." },

    { n: "Bellman-Ford", cost: "O(V \u00b7 E) \u00b7 negatives allowed",
      idea: "Give up the greedy shortcut and simply relax every edge V-1 times. Slow, and it does not care what sign the weights are.",
      when: "Any edge may be negative, or you need to <i>detect</i> a negative cycle.",
      watch: "A V-th pass that still improves something proves a negative cycle, at which point shortest path is not a well-posed question." },

    { n: "Floyd-Warshall", cost: "O(V\u00b3) time \u00b7 O(V\u00b2) space \u00b7 all pairs",
      idea: "Three nested loops. For every intermediate node k, ask whether routing through k improves any pair.",
      when: "You need every pair of distances and V is a few hundred at most. Ten lines and no data structures.",
      watch: "k must be the OUTER loop. Put it inside and you compute something confidently meaningless. V = 1000 is 10\u2079 operations." },

    { n: "A*", cost: "O((V + E) log V) worst, usually far better",
      idea: "Dijkstra that has been told where it is going: order the queue by cost-so-far plus an estimate of cost-remaining, so it stops exploring the wrong half of the map.",
      when: "One specific target, and you have an honest distance estimate, such as straight-line distance on a map.",
      watch: "The estimate must never overstate the true remaining cost. Overstate it and A* is fast and wrong." },

    { n: "Topological order first", cost: "O(V + E) \u00b7 DAGs only",
      idea: "On a directed acyclic graph, process nodes in topological order and relax forwards. No priority queue is needed because the order already guarantees you never revisit.",
      when: "The graph is a DAG, such as build steps or course prerequisites. Also handles negative weights, unlike Dijkstra.",
      watch: "Only valid without cycles. If one exists, the topological sort will tell you by failing to produce a full ordering." },
  ],

  hing: `<p><b>Pehle samjho BFS kaam kyun karta tha.</b> Har edge ki cost 1 thi, isliye distance 1 wale saare nodes distance 2 se pehle nikal jaate the. Matlab queue apne aap distance ke order mein thi. BFS chalaak nahi tha, use order <b>muft</b> mil raha tha.</p>
<p><b>Ab edges par cost daal do.</b> Ek mehnga edge paanch saste edges se zyada mehnga ho sakta hai. Yani "sabse kam edges" aur "sabse sasta" ab do alag cheezein hain, aur BFS poore aatmvishwas ke saath <b>galat</b> jawaab dega.</p>
<p><b>Theek karne ka tarika:</b> har node ke liye "ab tak ka best distance" rakho (shuru mein sab infinity, source 0). Baar-baar <b>sabse saste bache hue node</b> ko uthao aur uske padosiyon ko check karo. Bas yahi ek badlav hai BFS se, aur isi ke liye <b>priority queue</b> chahiye. <b>Dijkstra = BFS with a heap.</b></p>
<p><b>Relaxation kya hai?</b> Sirf ek sawaal: <code>dist[u] + weight(u,v)</code> kya <code>dist[v]</code> se behtar hai? Agar haan, to naya number likh do. Poora algorithm bas yahi ek line hai, baar-baar.</p>
<p><b>Ab woh baat jo interview mein poochi jaati hai: settled node final kyun hota hai?</b> Jab tum sabse sasta bacha hua node u uthate ho, to baaki bache hue saare nodes usse mehnge ya barabar hain. Yahi poori guarantee hai. u tak koi doosra raasta unhi mein se kisi se hoke aayega, aur weights <b>non-negative</b> hain, to aage badhne se cost sirf badhegi. Isliye koi sasta raasta ho hi nahi sakta. <b>Yeh poora argument non-negative weights par tika hua hai.</b></p>
<p><b>Isliye negative edge sab tod deta hai.</b> Negative edge ke saath aage badhne par raasta <b>sasta</b> ho sakta hai. Matlab jo node tum settle kar chuke the, woh galat nikal sakta hai. Dijkstra ke paas wapas jaane ka koi tarika nahi hai, aur woh tumhe batayega bhi nahi. Tab <b>Bellman-Ford</b> chahiye: greedy shortcut chhod do aur saare edges ko V-1 baar relax karo. <b>O(V·E)</b>, dheema par sahi. Aur agar V-vi baar mein bhi kuch improve ho raha hai, to graph mein <b>negative cycle</b> hai, jahan "shortest path" ka matlab hi khatam ho jaata hai.</p>
<p><b>Kaun sa algorithm kab (yeh yaad rakho):</b><br>
Sab edges ki cost barabar → <b>BFS</b>, O(V + E). Heap lagane ki zaroorat nahi.<br>
Non-negative weights → <b>Dijkstra</b>, O((V + E) log V).<br>
Negative weights → <b>Bellman-Ford</b>, O(V·E).<br>
Har jodi ka distance, chhota graph → <b>Floyd-Warshall</b>, teen loops, O(V³).<br>
Interview mein "kaun sa aur kyun" zyada poocha jaata hai, code likhwaane se.</p>`,

  viz: ["dijkstra"],
  see: [["VA", "https://visualgo.net/en/sssp", "VisuAlgo, Dijkstra and Bellman-Ford running side by side"]],

  math: [
    { t: "Why BFS stops being correct the moment weights appear", d: "BFS counts edges. With weights, the path with fewest edges and the path with least cost are different questions, and a three-node example separates them.", w:
`A --1--> B --1--> D          two edges, cost 2
A --5--> D                   one edge,  cost 5

BFS reaches D at depth 1 and stops: it reports 5
the cheapest path costs 2

BFS is exactly Dijkstra with every weight equal to 1` },
    { t: "Dijkstra's cost, term by term", d: "Two numbers multiply here: how many times an edge can cause a heap push, and what a heap operation costs. Neither is V.", w:
`each edge relaxed once                E
each relaxation may push               E pushes
each push or pop                       log(heap) <= 2 log V

total  O((V + E) log V)

V = 10^5, E = 5 x 10^5:
  5 x 10^5 x 17  =  8.5 x 10^6 heap operations
scanning an array for the minimum instead: V^2 = 10^10` },
    { t: "Why a popped node is final, and exactly where the proof breaks", d: "The argument is three lines, and one of those lines quietly assumes every weight is non-negative. That line is the whole restriction.", w:
`pop u, the smallest tentative distance in the heap
suppose some shorter path to u exists. It leaves the
settled set on an edge into y, so

  d[u] > d[y] + (the rest of that path)
and the rest is >= 0             <-- the assumption
so  d[u] > d[y]

but u was the smallest, so d[u] <= d[y]. Contradiction.
one negative edge and the marked line fails.` },
    { t: "Bellman-Ford: why V-1 rounds, exactly", d: "The round count is not a safety margin. It is the longest a shortest path can be, and one extra round is what detects a negative cycle.", w:
`a shortest path visits no vertex twice, so it uses
at most V - 1 edges

after round k, every shortest path of <= k edges is final
so V - 1 rounds settle all of them:  O(V x E)

round V: if any distance still improves, no shortest path
exists, because a negative cycle is reachable

V = 10^3, E = 10^4  ->  10^7  fine
V = 10^5, E = 5 x 10^5  ->  5 x 10^10  not fine` },
    { t: "Reading the algorithm off the constraints", d: "The shape of the input decides this, not preference. Two lines of arithmetic rule out most of the table before you start.", w:
`unweighted             BFS               O(V + E)
weights 0 or 1         0-1 BFS, deque    O(V + E)
non-negative           Dijkstra          O((V+E) log V)
any weights            Bellman-Ford      O(V x E)
all pairs, dense       Floyd-Warshall    O(V^3)
DAG, any weights       topological DP    O(V + E)

Floyd at V = 400:  6.4 x 10^7, fine
Floyd at V = 2000: 8 x 10^9, not` },
  ],

  costs: [
    ["BFS, unit weights", "O(V + E)", "the queue is already in distance order"],
    ["Dijkstra with a binary heap", "O((V + E) log V)", "the log is the price of always knowing the cheapest"],
    ["Dijkstra with a plain array", "O(V²)", "better on a dense graph, where E approaches V²"],
    ["Bellman-Ford", "O(V · E)", "handles negative weights, and detects negative cycles"],
    ["Floyd-Warshall, all pairs", "O(V³) time, O(V²) space", "three nested loops; fine to a few hundred nodes"],
    ["A*", "O((V + E) log V) worst", "usually far better in practice, if the heuristic is honest"],
    ["reconstruct the path", "O(path length)", "store a parent pointer as you relax, then walk it backwards"],
  ],

  traps: [
    "<b>Running Dijkstra on a graph with negative edges.</b> It does not error, it does not warn, it just returns a wrong answer. Use Bellman-Ford.",
    "<b>Using a heap when every edge costs the same.</b> BFS is O(V + E) and simpler; the heap adds a log factor for no benefit.",
    "<b>Not skipping stale heap entries.</b> Most implementations push a node several times, so pop and then check whether the recorded distance is worse than the best known, and if so continue.",
    "<b>Marking a node settled when you push it</b> rather than when you pop it. Its distance can still improve while it sits in the heap.",
    "<b>Forgetting the tie-break in the heap.</b> Pushing raw tuples of (distance, node) is fine for integers, but a comparable second field is needed the moment the node is an object.",
    "<b>Assuming Floyd-Warshall will scale.</b> O(V³) at V = 1000 is 10⁹ operations, which is a different kind of afternoon.",
  ],

  impl: [
    ["Python", "heapq with (dist, node) tuples", "Min-heap by default, which is what you want. Push duplicates and skip stale pops."],
    ["Java", "PriorityQueue<int[]> with a comparator", "No decrease-key, so push duplicates and skip stale entries on poll."],
    ["C++", "priority_queue with greater<> for a min-heap", "The default is a MAX-heap, so this is the one place people quietly build the wrong thing."],
    ["JavaScript", "no heap at all", "Hand-roll one, or for small graphs scan the unsettled set in O(V²) and admit it."],
  ],

  code: {
    pseudo: `# UNIT WEIGHTS: do not overthink it, BFS is optimal and simpler
# ANY OTHER WEIGHTS: keep a best-known distance and always expand the cheapest

dijkstra(source):
    dist <- map every node to infinity
    dist[source] <- 0
    heap <- [ (0, source) ]                    # (distance, node), min-heap

    while heap not empty:
        (d, u) <- pop the smallest
        if d > dist[u]: continue               # a stale copy; skip it
        for (v, w) in neighbours(u):
            if d + w < dist[v]:                # RELAX: is going via u better?
                dist[v] <- d + w
                parent[v] <- u                 # only if you need the path itself
                push (dist[v], v)
    return dist

# WHY a popped node is final:
#   every other unfinished node already costs >= d,
#   and non-negative weights mean going further never gets cheaper.
#   Remove non-negativity and this sentence is false, along with the answer.

# BELLMAN-FORD: no greed, just relax everything V-1 times
for i from 1 to V - 1:
    for each edge (u, v, w):
        if dist[u] + w < dist[v]: dist[v] <- dist[u] + w
# one more pass that still improves something => a negative cycle exists

# FLOYD-WARSHALL: every pair, three loops, k on the OUTSIDE
for k in nodes:
    for i in nodes:
        for j in nodes:
            dist[i][j] <- min(dist[i][j], dist[i][k] + dist[k][j])`,
    py: `import heapq
from collections import defaultdict

def dijkstra(adj, source):            # adj[u] = [(v, weight), ...]
    dist = defaultdict(lambda: float("inf"))
    dist[source] = 0
    parent = {}
    heap = [(0, source)]
    while heap:
        d, u = heapq.heappop(heap)
        if d > dist[u]: continue      # stale entry left over from an earlier push
        for v, w in adj[u]:
            if d + w < dist[v]:       # relax
                dist[v] = d + w
                parent[v] = u
                heapq.heappush(heap, (dist[v], v))
    return dist, parent

def path(parent, source, target):     # walk the parents backwards
    out = [target]
    while out[-1] != source:
        if out[-1] not in parent: return []      # unreachable
        out.append(parent[out[-1]])
    return out[::-1]

def bellman_ford(edges, n, source):   # edges = [(u, v, w), ...]
    dist = [float("inf")] * n
    dist[source] = 0
    for _ in range(n - 1):
        changed = False
        for u, v, w in edges:
            if dist[u] + w < dist[v]:
                dist[v] = dist[u] + w
                changed = True
        if not changed: break         # settled early, stop
    for u, v, w in edges:             # one more pass: still improving?
        if dist[u] + w < dist[v]: raise ValueError("negative cycle")
    return dist`,
    java: `static int[] dijkstra(List<int[]>[] adj, int source) {
    int n = adj.length;
    int[] dist = new int[n];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[source] = 0;
    // (distance, node), smallest distance first
    PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[0] - b[0]);
    pq.offer(new int[]{0, source});
    while (!pq.isEmpty()) {
        int[] cur = pq.poll();
        int d = cur[0], u = cur[1];
        if (d > dist[u]) continue;              // stale entry
        for (int[] e : adj[u]) {                // e = {neighbour, weight}
            int v = e[0], w = e[1];
            if (d + w < dist[v]) {              // relax
                dist[v] = d + w;
                pq.offer(new int[]{dist[v], v});
            }
        }
    }
    return dist;
}

// Bellman-Ford, when a weight might be negative
static int[] bellmanFord(int[][] edges, int n, int source) {
    int[] dist = new int[n];
    Arrays.fill(dist, Integer.MAX_VALUE / 2);   // /2 so relaxing cannot overflow
    dist[source] = 0;
    for (int i = 0; i < n - 1; i++)
        for (int[] e : edges)
            dist[e[1]] = Math.min(dist[e[1]], dist[e[0]] + e[2]);
    return dist;
}`,
    cpp: `// The default priority_queue is a MAX-heap. This is the single most common
// wrong line in a C++ Dijkstra, so write greater<> and move on.
vector<int> dijkstra(const vector<vector<pair<int,int>>>& adj, int source) {
    int n = adj.size();
    vector<int> dist(n, INT_MAX);
    dist[source] = 0;
    priority_queue<pair<int,int>, vector<pair<int,int>>, greater<>> pq;
    pq.push({0, source});
    while (!pq.empty()) {
        auto [d, u] = pq.top(); pq.pop();
        if (d > dist[u]) continue;              // stale entry
        for (auto [v, w] : adj[u])
            if (d + w < dist[v]) {              // relax
                dist[v] = d + w;
                pq.push({dist[v], v});
            }
    }
    return dist;
}

// Floyd-Warshall: k on the OUTSIDE, or it silently computes something else
void floyd(vector<vector<int>>& d) {
    int n = d.size();
    for (int k = 0; k < n; ++k)
        for (int i = 0; i < n; ++i)
            for (int j = 0; j < n; ++j)
                if (d[i][k] + d[k][j] < d[i][j])
                    d[i][j] = d[i][k] + d[k][j];
}`,
    js: `// No built-in heap. For interview-sized graphs this scan is honest and fine.
function dijkstraSimple(adj, source, n) {      // adj.get(u) = [[v, w], ...]
  const dist = new Array(n).fill(Infinity), done = new Array(n).fill(false);
  dist[source] = 0;
  for (let i = 0; i < n; i++) {
    let u = -1;
    for (let v = 0; v < n; v++)                // pick the cheapest unsettled
      if (!done[v] && (u === -1 || dist[v] < dist[u])) u = v;
    if (u === -1 || dist[u] === Infinity) break;
    done[u] = true;
    for (const [v, w] of adj.get(u) ?? [])
      if (dist[u] + w < dist[v]) dist[v] = dist[u] + w;   // relax
  }
  return dist;                                  // O(V^2), good for dense graphs
}

// With a real heap it is the usual O((V + E) log V)
function dijkstra(adj, source, n, MinHeap) {
  const dist = new Array(n).fill(Infinity);
  dist[source] = 0;
  const h = new MinHeap();                      // ordered by entry[0]
  h.push([0, source]);
  while (h.size) {
    const [d, u] = h.pop();
    if (d > dist[u]) continue;                  // stale entry
    for (const [v, w] of adj.get(u) ?? [])
      if (d + w < dist[v]) { dist[v] = d + w; h.push([dist[v], v]); }
  }
  return dist;
}`,
  },
  codecap: "Relax, take the cheapest, skip stale entries. And check the weights before you assume Dijkstra applies.",

  q: [
    ["Why does BFS give shortest paths on an unweighted graph, and why does that stop working with weights?", "With unit edges, distance equals edge count, so the queue is already ordered by distance. With varying weights those two quantities separate: a single expensive edge can cost more than several cheap ones, and the queue's order means nothing."],
    ["What is relaxation?", "Checking whether dist[u] + weight(u, v) beats dist[v], and writing down the better value if it does. Dijkstra and Bellman-Ford are both just that operation, applied in different orders."],
    ["Why is a node's distance final once it is popped from the heap?", "Every other unfinished node already costs at least as much, and any alternative route must go through one of them. With non-negative weights, continuing can only add cost, so nothing cheaper can exist."],
    ["What exactly breaks when an edge is negative?", "The finality argument. Going further can now reduce a total, so a settled node may turn out to be wrong. Dijkstra cannot revisit it and will not report a problem, so use Bellman-Ford, which also detects negative cycles."],
    ["Why do Dijkstra implementations push duplicates and skip on pop?", "Binary heaps have no cheap decrease-key, so improving a distance is done by pushing a new entry. On pop, if the recorded distance is worse than the best known, that entry is stale and is skipped."],
    ["Which algorithm for which situation?", "Unit weights: BFS, O(V + E). Non-negative weights: Dijkstra, O((V + E) log V). Any negative weight: Bellman-Ford, O(V·E). All pairs on a small graph: Floyd-Warshall, O(V³)."],
  ],

  p: [
    [1091, "shortest-path-in-binary-matrix", "Shortest Path in a Binary Matrix, BFS is enough", "M"],
    [743, "network-delay-time", "Network Delay Time, textbook Dijkstra", "M"],
    [787, "cheapest-flights-within-k-stops", "Cheapest Flights, where plain Dijkstra is not enough", "M"],
    [1631, "path-with-minimum-effort", "Path With Minimum Effort, a different cost function", "M"],
    [778, "swim-in-rising-water", "Swim in Rising Water, Dijkstra on a grid", "H"],
    [399, "evaluate-division", "Evaluate Division, weights that multiply", "M"],
  ],
},

/* ==================================================================== */
{
  id: "union-find",
  n: "Union-Find (disjoint sets)",
  group: "Graphs",
  one: "Stop storing the edges and store only <b>which group each node is in</b>. Connectivity becomes \"same representative?\", and two small fixes make that answer near constant.",

  plain: `<p>You have a pile of things and you keep being told "these two are connected". Later you are asked "are these two connected?" Not by what route, just yes or no.</p>
<p>The obvious way is to keep the list of connections and search through it each time someone asks. That search is a fresh walk over the whole pile, and if a hundred thousand people ask, you do a hundred thousand walks.</p>
<p>So stop storing the connections. Store the <b>answer</b> instead. Give every group one member who speaks for it, call it the leader, and have every thing remember its leader. "Are these two connected?" becomes "do these two have the same leader?", which is a lookup, not a search. Joining two groups is one line: point one leader at the other.</p>
<p>Done carelessly this gets slow, because the chains of "my leader is him, his leader is her" grow long. Two small habits fix it, and together they make every question cost almost nothing.</p>
<p><b>Analogy.</b> Asking whether two people are in the same company. You could trace the org chart every time. Or everyone just knows the name of their CEO, and you compare two names.</p>`,

  why: [
    { t: "The question being asked is not the one traversal is good at", d: "A traversal answers \"is there a path from A to B\" by walking until it finds one. That is fine once. But connectivity is usually asked over and over, with new connections arriving in between, and each question starts the walk from scratch. A hundred thousand questions on a hundred thousand nodes is about 10^10 steps." },
    { t: "So do not store the connections. Store the answer", d: "Nobody asked for the route. They asked yes or no. So throw the edges away and keep one fact per thing: which group it is in. Name each group after one of its members, the <b>leader</b>. Now \"connected?\" is \"same leader?\", which is two lookups and a comparison." },
    { t: "One array holds all of it", d: "<code>parent[x]</code> is the thing x points at on the way to its leader. A leader points at itself, which is how you recognise one. To find x's leader, follow the pointers until one points at itself. To join two groups, find both leaders and point one at the other. That is the entire structure: one array, two short functions." },
    { t: "Done carelessly, it quietly becomes a linked list", d: "Nothing above said which leader should point at which. Join 1 to 2, then 2 to 3, then 3 to 4, always hanging the old leader under the new one. What you get is a single chain of length n. Finding a leader now walks the whole chain. A hundred thousand joins done this way cost about 5 x 10^9 steps, which is the thing you were trying to avoid." },
    { t: "Fix one: always hang the smaller group under the bigger one", d: "Keep each group's size. When joining, the smaller leader points at the bigger. Now think about how deep a thing can get. Its depth only grows when its whole group gets attached under a bigger one, which means its group at least <b>doubled</b>. A group can double at most <code>log n</code> times before it runs out of members. So no chain is ever longer than about 20 at a million things." },
    { t: "Fix two: on the way back, point everything straight at the leader", d: "When you walk from x up to the leader, you have just learned the answer for <b>every thing you passed</b>. So on the way back, point each of them directly at the leader. That path is now length one and can never be walked again. This is called path compression, and it costs one extra line." },
    { t: "Together they make it near constant, and there is a name for how near", d: "With both fixes, m operations cost <code>O(m x alpha(n))</code> in total. Alpha grows so slowly that it stays below 5 for any n that could fit in a computer. In an interview say \"near constant, amortised\", which means averaged over the whole run of operations rather than promised for any single one. Do not say O(1), because it is not, and the difference is the thing being checked." },
    { t: "What it refuses to do, and what falls out free", d: "It cannot tell you the route between two things, it cannot list the edges, and it cannot un-join a group, because the edges were thrown away on purpose. What it does give free: the number of groups, by starting at n and subtracting one per successful join. Also each group's size, since you were keeping that anyway. Cycle detection in an undirected graph is one pass: for each edge, if both ends already share a leader, that edge closes a cycle." },
  ],
  hing: `<p><b>Sawaal se shuru karo:</b> "kya u aur v jude hue hain?" DFS yeh ek baar bahut acche se bata deta hai. Par yeh sawaal baar-baar aata hai, aur beech mein nayi edges bhi judti rehti hain. Har baar poora traversal dobara chalana padega.</p>
<p><b>Dikkat walk mein nahi hai.</b> Dikkat yeh hai ki pichhli mehnat ka kuch bachta hi nahi. To jo cheez store kar rahe ho, wahi badal do.</p>
<p><b>Edges ki zaroorat hi nahi hai.</b> Bas itna yaad rakho ki kaun sa node kis group mein hai. Har group ka ek <b>leader</b> chun lo. Ab sawaal ban gaya: "dono ka leader same hai kya?" Aur nayi edge ka matlab ban gaya: do groups ko jod do.</p>
<p><b>Ek array kaafi hai.</b> <code>parent[i]</code> batata hai ki i kiski taraf ishara kar raha hai. Shuru mein sab apne aap ko point karte hain. <code>find(x)</code> upar chalta jaata hai jab tak koi node khud ko point na kare, wahi leader hai. <code>union(a, b)</code> dono ke leader nikaalta hai aur ek ko doosre par laga deta hai.</p>
<p><b>Ab sabse zaroori baat, kyunki naive version dhoka de deta hai.</b> <code>union(1,2)</code>, phir <code>union(2,3)</code>, phir <code>union(3,4)</code>. Aise karte jao to tree ek seedhi chain ban jaata hai. find wapas O(n) ho gaya. Jisse bhaag rahe the, wahi dobara bana diya.</p>
<p><b>Fix 1, union by size.</b> Hamesha chhota tree bade ke neeche lagao. Ab socho kisi node ki depth kab badhti hai. Sirf tab, jab uska poora tree kisi bade tree ke neeche jude. Aur us waqt uska tree kam se kam <b>double</b> ho jaata hai. Double karte-karte n tak pahunchne mein sirf <code>log n</code> kadam lagte hain. Isliye depth log n se zyada ho hi nahi sakti: 10 lakh nodes par sirf 20.</p>
<p><b>Fix 2, path compression.</b> find ne x se leader tak ka raasta chal to liya hai. Matlab raaste ke har node ka jawab usko ab pata hai. To wapas aate waqt un sab ko <b>seedha leader par</b> point kara do. Jo raasta ek baar chal liye, woh dobara chalna hi nahi padega.</p>
<p><b>Dono saath lagao to per operation cost α(n) reh jaati hai, inverse Ackermann.</b> Yeh function itna dheere badhta hai ki kisi bhi practical n ke liye <b>5 se kam</b> hai. Interview mein "O(1)" mat bolo. Bolo <b>"near constant, amortised"</b>, matlab poore run ka average, kisi ek call ka waada nahi.</p>
<p><b>Jo yeh nahi kar sakta:</b> undo nahi hota, ek edge hatani hai to poora dobara banao. Kisi group ke saare members nahi gina sakta, uske liye alag map chahiye. Path aur distance ke baare mein kuch nahi jaanta. Sirf membership.</p>
<p><b>Kahan pakadna hai:</b> edges aate ja rahe hain aur components ginne hain. Ya undirected graph mein cycle dhoondhni hai, jis edge ke dono sire pehle se ek hi leader par hain wahi cycle band karti hai. Ya Kruskal MST banana hai: edges weight se sort karo, sasti se shuru karo, aur edge tabhi rakho jab union true lautaaye.</p>`,

  viz: ["union-find"],

  math: [
    { t: "Why traversal is the wrong tool for a repeated question", d: "One connectivity query is a traversal. A hundred thousand of them is a hundred thousand traversals, and that multiplication is the entire motivation.", w:
`V = 10^5, E = 2 x 10^5, q = 10^5 connectivity queries

BFS per query:  q x (V + E)  =  3 x 10^10
union-find:     (V + E + q) x alpha  ~  4 x 10^5

five orders of magnitude, for the same answers` },
    { t: "The naive version turns into a linked list", d: "Attach trees carelessly and every union adds a level. The structure still works, it has just become the thing it was meant to replace.", w:
`union(1,2), union(2,3), ... union(n-1,n), no rules:

each union hangs the existing tree under a new root
depth after k unions: k
find costs the depth, so n finds cost 1 + 2 + ... + n

n = 100,000  ->  5 x 10^9 pointer hops` },
    { t: "Union by size: the depth cannot pass log2 n", d: "Attach the smaller tree under the larger and a node's depth can only grow when its whole tree doubles. Doubling has a limit.", w:
`a node's depth increases only when its tree is attached
under a bigger one, so its tree at least DOUBLES

therefore a tree of depth d holds at least 2^d nodes
  2^d <= n   ->   d <= log2 n

n = 10^6  ->  depth at most 20, with no compression at all` },
    { t: "Path compression, and the constant nobody can write down", d: "A find that walks k steps rewires all k nodes to the root, so that walk can never happen again. Together with union by size the amortised cost stops being a log.", w:
`find(x) walking k steps: k nodes repointed at the root
that path is now length 1, for ever

both fixes together: m operations cost O(m x alpha(n))

alpha is the inverse Ackermann function
  alpha(n) <= 4 for n up to 2^2^2^16
so it is under 5 for any n that can be stored

say "near constant, amortised". Not O(1).` },
    { t: "What falls out free, and what is not there at all", d: "The structure keeps one fact per node. Anything that needs the edges back is not merely slow, it is unavailable.", w:
`free:
  component count   start at V, decrement per real union
  component sizes   the size array you already maintain
  undirected cycle  for each edge, find(a) == find(b)
                    one pass, E finds

absent:
  the path between two nodes, the edge list,
  deletion or splitting, anything about direction` },
  ],

  costs: [
    ["build for n nodes", "O(n) time and space", "two arrays; the graph itself is never stored"],
    ["find, no optimisations", "O(n)", "unions can build a chain, and then find has to walk it"],
    ["find, union by size only", "O(log n)", "depth grows only when a tree at least doubles, and that is log n times"],
    ["find, path compression only", "O(log n) amortised", "each walk flattens the path it paid for, so the next one is shorter"],
    ["find or union, both fixes", "O(α(n)) amortised", "α is the inverse Ackermann function, under 5 for any real n"],
    ["m operations on n nodes", "O(n + m α(n))", "effectively linear, which is why it beats one DFS per query"],
    ["Kruskal's MST", "O(E log E)", "the sort dominates; the union-find part is close to free"],
  ],

  traps: [
    "<b>Comparing <code>parent[a] == parent[b]</code> instead of <code>find(a) == find(b)</code>.</b> Two nodes deep in the same tree have different parents and the same root. This passes the small test case and fails the big one.",
    "<b>Union by size using the size of a non-root.</b> <code>size[]</code> is only meaningful at a root, because nothing updates it for the nodes underneath. Compare <code>size[ra]</code> and <code>size[rb]</code>, never <code>size[a]</code> and <code>size[b]</code>.",
    "<b>Recursive <code>find</code> on a chain of 10⁵ nodes.</b> Path compression flattens the tree only <i>after</i> the recursion has already gone all the way down, so the stack overflows first. Write it iteratively.",
    "<b>Counting components by counting distinct <code>parent[i]</code> values.</b> Count the roots (<code>i == parent[i]</code>), or better, keep a counter and decrement it on every successful union.",
    "<b>Reaching for it on a directed graph.</b> Union-find has no notion of direction, so its cycle detection is an undirected statement. Directed cycles need DFS with a recursion-stack marker.",
    "<b>Assuming you can remove an edge later.</b> There is no undo. If the problem deletes edges, reverse the timeline and process the deletions as additions instead.",
  ],

  impl: [
    ["Python", "no stdlib class; a list for parent, or a dict for arbitrary keys", "Write find iteratively. Raising the recursion limit is not a fix, it just moves the crash."],
    ["Java", "no java.util class either; two int[] arrays", "Do not use HashMap<Integer,Integer> out of habit, boxing makes it several times slower."],
    ["C++", "vector<int> with iota to fill 0..n-1", "union is a keyword, so name the method unite or join. Boost has disjoint_sets if it is allowed."],
    ["JavaScript", "Array or Int32Array for parent", "For non-integer ids use a Map, not an object: object keys are coerced to strings and inherit prototype keys."],
  ],

  code: {
    pseudo: `# THE PROBLEM: "are u and v connected?" asked repeatedly, while edges arrive.
# One DFS per query is O(V + E) each time and remembers nothing afterwards.
# So do not store the graph. Store only WHICH GROUP each node belongs to.

parent <- array with parent[i] = i      # everyone starts alone, own root
size   <- array of 1s                   # meaningful ONLY at a root
count  <- n                             # number of disjoint sets

find(x):                                # naive: walk up to the root
    while parent[x] != x:
        x <- parent[x]
    return x

union(a, b):                            # naive: point one root at the other
    ra <- find(a); rb <- find(b)
    if ra == rb: return false
    parent[ra] <- rb
    return true

# THIS DEGENERATES. union(1,2), union(2,3), union(3,4)... builds a chain
# of length n, and find walks it: O(n). Two independent fixes rescue it.

# FIX 1, UNION BY SIZE: always hang the SMALLER tree under the larger.
#   A node gets deeper only when its tree joins one at least as big,
#   so its tree at least DOUBLES. Doubling caps out after log n times.
# FIX 2, PATH COMPRESSION: a find already knows the root for every node
#   it passed, so on the way back point them all STRAIGHT at the root.

find(x):                                # compressed, and iterative
    root <- x
    while parent[root] != root:
        root <- parent[root]
    while parent[x] != root:            # second pass rewires the path
        nxt <- parent[x]
        parent[x] <- root
        x <- nxt
    return root

union(a, b):                            # by size, returns "did it merge?"
    ra <- find(a); rb <- find(b)
    if ra == rb: return false           # same root: this edge is redundant
    if size[ra] > size[rb]: swap(ra, rb)
    parent[ra] <- rb                    # smaller root hangs under larger
    size[rb] <- size[rb] + size[ra]
    count <- count - 1
    return true

# Both together: O(alpha(n)) amortised. alpha is inverse Ackermann, which
# is under 5 for every n you will meet. Say near constant, not O(1).

# WHAT YOU GET FOR FREE
# components as edges arrive: start at n, decrement when union returns true
# undirected cycle: an edge where union returns false closes one
# Kruskal MST: sort edges by weight, keep each edge whose union succeeds`,
    py: `class DSU:
    def __init__(self, n):
        self.parent = list(range(n))     # every node is its own root
        self.size = [1] * n              # only read this at a root
        self.count = n                   # how many disjoint sets remain

    def find(self, x):                   # iterative: a chain of 1e5 would
        root = x                         # blow the stack if this recursed
        while self.parent[root] != root:
            root = self.parent[root]
        while self.parent[x] != root:    # path compression on the way back
            self.parent[x], x = root, self.parent[x]
        return root

    def union(self, a, b):               # True only if it merged two sets
        ra, rb = self.find(a), self.find(b)
        if ra == rb:
            return False                 # already together: redundant edge
        if self.size[ra] > self.size[rb]:
            ra, rb = rb, ra              # smaller tree hangs under larger
        self.parent[ra] = rb
        self.size[rb] += self.size[ra]
        self.count -= 1
        return True

    def connected(self, a, b):
        return self.find(a) == self.find(b)


def has_cycle(n, edges):                 # UNDIRECTED graphs only
    dsu = DSU(n)
    return any(not dsu.union(u, v) for u, v in edges)


def kruskal(n, edges):                   # edges as (weight, u, v)
    dsu, total = DSU(n), 0
    for w, u, v in sorted(edges):        # greedy: cheapest edge first
        if dsu.union(u, v):              # kept only if it joins two sets
            total += w
    return total if dsu.count == 1 else -1   # -1: graph was disconnected`,
    java: `class DSU {
    int[] parent, size;
    int count;

    DSU(int n) {
        parent = new int[n];
        size = new int[n];
        count = n;
        for (int i = 0; i < n; i++) { parent[i] = i; size[i] = 1; }
    }

    int find(int x) {                        // iterative, so no deep stack
        int root = x;
        while (parent[root] != root) root = parent[root];
        while (parent[x] != root) {          // path compression
            int nxt = parent[x];
            parent[x] = root;
            x = nxt;
        }
        return root;
    }

    boolean union(int a, int b) {            // true only if it merged
        int ra = find(a), rb = find(b);
        if (ra == rb) return false;          // redundant edge, closes a cycle
        if (size[ra] > size[rb]) { int t = ra; ra = rb; rb = t; }
        parent[ra] = rb;
        size[rb] += size[ra];
        count--;
        return true;
    }

    boolean connected(int a, int b) { return find(a) == find(b); }
}

// Kruskal: edges as {u, v, weight}
Arrays.sort(edges, (x, y) -> Integer.compare(x[2], y[2]));
DSU dsu = new DSU(n);
long total = 0;
for (int[] e : edges) if (dsu.union(e[0], e[1])) total += e[2];
// dsu.count == 1 means every node was reachable and the tree is complete`,
    cpp: `struct DSU {
    vector<int> parent, sz;
    int count;

    DSU(int n) : parent(n), sz(n, 1), count(n) {
        iota(parent.begin(), parent.end(), 0);   // parent[i] = i
    }

    int find(int x) {                    // iterative, no recursion depth
        int root = x;
        while (parent[root] != root) root = parent[root];
        while (parent[x] != root) {      // path compression
            int nxt = parent[x];
            parent[x] = root;
            x = nxt;
        }
        return root;
    }

    // "union" is a keyword, hence unite. The compiler is unhelpfully vague
    // about why "int union(...)" will not compile.
    bool unite(int a, int b) {
        int ra = find(a), rb = find(b);
        if (ra == rb) return false;      // redundant edge, closes a cycle
        if (sz[ra] > sz[rb]) swap(ra, rb);
        parent[ra] = rb;
        sz[rb] += sz[ra];
        --count;
        return true;
    }

    bool connected(int a, int b) { return find(a) == find(b); }
};

// Kruskal: store edges as {weight, u, v} so the default sort is by weight
sort(edges.begin(), edges.end());
DSU dsu(n);
long long total = 0;
for (auto& [w, u, v] : edges)
    if (dsu.unite(u, v)) total += w;`,
    js: `class DSU {
  constructor(n) {
    this.parent = Array.from({ length: n }, (_, i) => i);
    this.size = new Array(n).fill(1);
    this.count = n;
  }

  find(x) {                             // iterative, no recursion to blow
    let root = x;
    while (this.parent[root] !== root) root = this.parent[root];
    while (this.parent[x] !== root) {   // path compression
      const nxt = this.parent[x];
      this.parent[x] = root;
      x = nxt;
    }
    return root;
  }

  union(a, b) {                         // true only if it merged two sets
    let ra = this.find(a), rb = this.find(b);
    if (ra === rb) return false;        // redundant edge, closes a cycle
    if (this.size[ra] > this.size[rb]) [ra, rb] = [rb, ra];
    this.parent[ra] = rb;
    this.size[rb] += this.size[ra];
    this.count--;
    return true;
  }

  connected(a, b) { return this.find(a) === this.find(b); }
}

// Kruskal: edges as [u, v, weight]
function kruskal(n, edges) {
  const dsu = new DSU(n);
  let total = 0;
  for (const [u, v, w] of [...edges].sort((x, y) => x[2] - y[2]))
    if (dsu.union(u, v)) total += w;
  return dsu.count === 1 ? total : -1;  // -1: the graph was disconnected
}

// Ids that are not 0..n-1? Map them to indices first, or hold parent in a
// Map. A plain object turns every key into a string, which will bite you.`,
  },
  codecap: "One array, one find, one union, and a boolean that says whether anything actually merged. Components, cycles and Kruskal are all built on that boolean.",

  q: [
    ["Why not just run a DFS for each connectivity query?", "Each DFS is O(V + E) and discards what it learned, so k queries cost k traversals, and every new edge invalidates the previous answers. Union-find keeps the grouping between queries, so a query is two finds and an edge is one union."],
    ["What does find return, and why is that enough to answer connectivity?", "The representative of the set, the root of the chain of parent pointers. Every node in a set reaches the same root, so u and v are connected exactly when find(u) == find(v). The edges themselves are never consulted."],
    ["How does the naive version degenerate, and what are the two fixes?", "Unioning 1-2, 2-3, 3-4 and so on can build a chain of length n, making find O(n). Union by size or rank always hangs the smaller tree under the larger; path compression points every node on a find path straight at the root. They are independent, and either one alone already helps."],
    ["Why does union by size bound the depth at log n?", "A node only gets deeper when its tree is hung under one at least as big, and at that moment the tree containing it at least doubles in size. A tree can double at most log n times before it holds all n nodes, so no node can be pushed down more than log n times."],
    ["What is the real complexity with both optimisations, and what is α(n)?", "O(α(n)) amortised per operation, where α is the inverse Ackermann function. It grows so slowly that it is below 5 for any n that could be stored, so it is near constant in practice, but it is not O(1) and the amortised part matters."],
    ["Name three things union-find cannot do.", "It cannot un-union, since nothing records which merge created which root. It cannot list the members of a set without a separate root-to-list map, because the pointers only go up. And it knows nothing about paths or distances, only about membership."],
  ],

  p: [
    [547, "number-of-provinces", "Number of Provinces, components without a traversal", "M"],
    [200, "number-of-islands", "Number of Islands, the same count with unions instead of BFS", "M"],
    [684, "redundant-connection", "Redundant Connection, the edge whose union returns false", "M"],
    [721, "accounts-merge", "Accounts Merge, union by a shared email", "M"],
    [990, "satisfiability-of-equality-equations", "Equality Equations, union the equals then test the not-equals", "M"],
    [1319, "number-of-operations-to-make-network-connected", "components minus one, if you have spare cables", "M"],
    [305, "number-of-islands-ii", "Number of Islands II, land arriving one cell at a time", "H"],
  ],
},

/* ==================================================================== */
{
  id: "toposort",
  n: "Topological sort and cycles",
  group: "Graphs",
  one: "An order that respects every <b>must come before</b> exists only when no cycle does, so a topological sort <i>is</i> a cycle detector: whatever it fails to emit is the cycle.",

  plain: `<p>Some problems do not ask for a path or a distance. You are handed a pile of things and a list of rules, each one of the form "this has to happen before that". Find an order that breaks none of them.</p>
<p>It comes up constantly. Compiling modules, installing packages, picking courses with prerequisites, recalculating a spreadsheet after one cell changes. All the same question.</p>
<p>Make each thing a node. Make each rule an arrow from the earlier thing to the later one. Now the question is: can I lay the nodes out in a line so that every arrow points forwards? That line is called a <b>topological order</b>.</p>
<p>Sometimes no such line exists. If A waits on B, B waits on C, and C waits on A, nothing can save you. That is a <b>cycle</b>, and it is the only thing that can go wrong. So an algorithm that produces the order also tells you, for free, whether the graph has a cycle in it. One computation answers both questions. That is why plenty of interview problems that never say the words "topological sort" are exactly that.</p>
<p><b>Analogy.</b> Getting dressed. Socks before shoes, shirt before jacket. Plenty of valid orders exist and nobody cares which one you pick. But if the rules say jacket before shirt and shirt before jacket, you do not need to try harder. You need a different list of rules.</p>`,

  why: [
    { t: "Start from the rule, not from the algorithm", d: "You are given constraints of the shape \"u before v\". Draw each one as an arrow from u to v. Nothing else is given, and nothing else is needed: the whole problem is now \"arrange the nodes in a line with every arrow pointing right\"." },
    { t: "A cycle is the only obstruction, and it is total", d: "If a set of nodes forms a cycle, each of them needs another one to come first, so none can go first, so no valid line exists. And if there is no cycle, one always exists. So the order is possible <b>exactly when</b> the graph is a DAG, which makes sorting and cycle detection the same job wearing two names." },
    { t: "Which gives Kahn's algorithm almost without thinking", d: "Something has to go first, and only a node with no incoming edges can. Count incoming edges (the <b>in-degree</b>), queue everything at zero, and emit them. Removing a node satisfies the constraints it imposed, so decrement its neighbours' in-degrees and queue any that hit zero. Repeat." },
    { t: "And Kahn reports the cycle by counting", d: "If the graph is acyclic, every node eventually reaches in-degree zero and gets emitted. If you emit fewer than V nodes, the ones left over never reached zero, which means each is still waiting on another survivor. <b>The leftovers are precisely the nodes on or downstream of a cycle.</b> No extra pass, no extra bookkeeping, just a length check." },
    { t: "The DFS version is the same idea run backwards", d: "Walk depth-first, and push a node onto a list only <b>after</b> every node it points to is finished. So a node is recorded later than all of its dependents, and reversing the list puts it earlier than all of them. Equivalent output, different bookkeeping: this is the finish-time ordering." },
    { t: "DFS cycle detection needs three states, not a visited set", d: "A visited flag answers \"have I ever been here\". For a cycle you need a different question: am I here <i>right now</i>? An edge into a node still on the current call stack is a cycle. An edge into a node that already finished is only a shortcut into ground you have already covered. So mark nodes unvisited, <b>in progress</b>, and done. Collapsing the last two into one flag reports cycles in a diamond that has none, and it is the single most common wrong answer on this topic." },
    { t: "What it cannot do, and one thing it gets cheaply", d: "It cannot give you <i>the</i> order, because there usually is not one. Any two nodes with no path between them can go in either order. If the problem wants the alphabetically smallest valid order, make Kahn's queue a min-heap and take the smallest available node each time. It also cannot tell you <i>which</i> nodes form the cycle unless you look, only that one exists. What it does hand you free: put the nodes in topological order and sweep forward once, improving each edge as you pass it. That gives shortest paths on a DAG in <b>O(V + E)</b>, negative weights included, which Dijkstra cannot manage. That is the shortest paths page's business, but the order comes from here." },
  ],

  hing: `<p><b>Sawaal kya hai:</b> kuch kaam hain aur rules hain "yeh usse pehle hona chahiye". Har cheez ko node banao, har rule ko <b>arrow</b> banao jo pehle wale se baad wale ki taraf jaaye. Ab bas ek line mein sabko lagana hai jisme saare arrows aage ki taraf point karein. Wahi <b>topological order</b> hai. Build steps, course prerequisites, spreadsheet recalculation, sab yahi hai.</p>
<p><b>Sirf ek cheez galat ho sakti hai: cycle.</b> A ko B chahiye, B ko C, C ko A. Ab koi pehla ho hi nahi sakta. Aur agar cycle nahi hai to order hamesha milega. Matlab <b>order exist karta hai sirf aur sirf tab jab graph DAG ho</b>. Isliye topological sort aur cycle detection <b>ek hi computation</b> hai. Interview mein aadhe sawaal cycle detection hi hote hain, bas naam badla hua hota hai. Yeh line yaad rakho.</p>
<p><b>Kahn ka tarika (BFS jaisa):</b> har node ke <b>in-degree</b> gino, matlab kitne log uska raasta rok rahe hain. Jinka in-degree 0 hai unhe queue mein daalo, kyunki unhe koi rok nahi raha. Ek node nikaalo, output mein daalo, aur uske padosiyon ka in-degree 1 kam kar do (uski shart poori ho gayi). Jiska 0 hua, woh queue mein. Bas.</p>
<p><b>Kahn cycle bhi muft mein bata deta hai:</b> agar output mein V se <b>kam</b> nodes aaye, to jo bache unka in-degree kabhi 0 tak pahuncha hi nahi. Matlab woh aapas mein ek doosre ka intezaar kar rahe hain. <b>Bache hue nodes hi cycle hain (ya uske peeche latke hue hain).</b> Sirf ek length check, koi extra pass nahi. Isiliye interview mein Kahn se shuru karo, samjhaana aasan hai.</p>
<p><b>DFS wala tarika ulta chalta hai:</b> node ko list mein tab daalo jab uske saare descendants khatam ho jaayein, phir list ko <b>reverse</b> kar do. Kyunki node baad mein likha gaya, reverse karne par sabse pehle aa jaayega.</p>
<p><b>Ab sabse zaroori part, jahan log maar khaate hain.</b> DFS mein cycle dhoondhne ke liye plain <code>visited</code> set <b>kaafi nahi hai</b>. Visited ka matlab hai "kabhi gaya tha". Cycle ke liye chahiye "<b>abhi is waqt isi raaste par hoon kya</b>". Isliye teen states rakho: <b>unvisited</b>, <b>in progress</b> (abhi call stack par hai), aur <b>done</b>. In-progress node par edge mila to cycle. Done node par edge mila to kuch nahi, woh sirf pehle explore kiya hua hissa hai. Do states mein daba diya to diamond shape (A se B aur C, dono se D) par jhoothi cycle report hogi, jahan cycle hai hi nahi. <b>Yeh is topic ka sabse common galat jawaab hai.</b></p>
<p><b>Order unique nahi hota.</b> Jin do nodes ke beech koi raasta hi nahi, unka aage-peeche kuch bhi ho sakta hai. Agar <b>lexicographically smallest</b> maanga hai to bas Kahn ki queue ki jagah <b>min-heap</b> laga do, baaki sab wahi. Cost O(V + E) se O(V log V + E) ho jaati hai.</p>
<p><b>Ek bonus:</b> DAG par nodes ko topological order mein le lo aur ek hi sweep mein edges relax kar do. Shortest paths <b>O(V + E)</b> mein mil jaayenge, <b>negative weights ke saath bhi</b>, jo Dijkstra nahi kar sakta. Uski detail shortest paths wale page par hai, par order yahin se aata hai.</p>`,

  viz: ["toposort"],

  math: [
    { t: "Kahn, counted", d: "Two passes and a queue. Every node enters the queue once and every edge is touched once, which is where the linear bound comes from.", w:
`building the in-degree table:  one pass over all edges, E
each node enqueued once when its in-degree hits 0:  V
each edge decremented exactly once:  E

total O(V + E)

emitted == V  ->  a valid order
emitted <  V  ->  the missing nodes are exactly those
                  on or downstream of a cycle` },
    { t: "Why a cycle is the only thing that can block an order", d: "One direction is obvious. The other is an induction, and that induction is not a proof about the algorithm, it is the algorithm.", w:
`a cycle a -> b -> a needs a before b and b before a.
No order exists. So a cycle blocks it.

no cycle  =>  some node has in-degree 0
  (otherwise follow edges backwards V + 1 times: a vertex
   repeats, and that repeat is a cycle)
remove that node, and the rest is still acyclic. Repeat.

so an order always exists, and the induction emits one` },
    { t: "There is rarely one order, and here is how many", d: "Interview answers that say the topological order are wrong. The count is a permutation count, and only a chain pins it down.", w:
`3 independent tasks, no edges:   3! = 6 valid orders
a chain a -> b -> c:              exactly 1
n independent tasks:              n!

which order you get depends on the queue order in Kahn,
or the neighbour order in DFS. Both are valid; neither
is "the" answer.` },
    { t: "DFS cycle detection needs three states, not two", d: "Visited-or-not cannot distinguish an ancestor on the current path from a node that was finished long ago, and only the first is a cycle.", w:
`white  not seen
grey   on the current recursion stack
black  finished, subtree fully explored

meet grey   -> a back edge  -> cycle
meet black  -> already done -> not a cycle

with only visited/unvisited:
  1 -> 2, 1 -> 3, 2 -> 3
  3 is "visited" when 1 reaches it, yet there is no cycle` },
  ],

  costs: [
    ["build the graph and in-degrees", "O(V + E)", "one pass over the edges, counting arrivals"],
    ["Kahn's algorithm", "O(V + E) time, O(V) space", "each node queued once, each edge decremented once"],
    ["DFS topological sort", "O(V + E) time, O(V) space", "same walk as any DFS, plus an output list"],
    ["detect a directed cycle", "O(V + E)", "free with either: a length check, or a grey-node hit"],
    ["lexicographically smallest order", "O(V log V + E)", "Kahn with a min-heap; the log is the price of choosing"],
    ["shortest paths on a DAG", "O(V + E)", "relax in topological order, so no node is ever revisited"],
    ["number of valid orders", "hard in general", "counting linear extensions is #P-complete, so nobody asks nicely"],
  ],

  traps: [
    "<b>Using a plain visited set for directed cycle detection.</b> You need to know whether a node is on the <i>current</i> path, not whether you have ever seen it. Two states report a cycle in an honest diamond; three states do not.",
    "<b>Building the edges backwards.</b> Course Schedule gives pairs as <code>[course, prerequisite]</code>, which reads left to right but means the arrow points right to left. Half the wrong submissions on that problem are this line.",
    "<b>Seeding the queue with one node instead of every zero in-degree node.</b> The graph need not be connected, and the nodes you skipped will look exactly like a cycle at the end.",
    "<b>Forgetting the final length check in Kahn.</b> Without it you happily return a partial order for a cyclic graph, and it looks plausible right up to the failing test.",
    "<b>Reusing the three-colour trick on an undirected graph.</b> There every edge goes both ways, so the node you just came from is always in progress. You need the parent check, or union-find, instead.",
    "<b>Recursive DFS on 10⁵ nodes.</b> A long dependency chain is a deep call stack. Kahn is iterative by nature, which is one more reason to reach for it first.",
  ],

  impl: [
    ["Python", "collections.deque · heapq for the smallest order", "Recursion limit near 1000 makes deep DFS risky; Kahn has no such problem."],
    ["Java", "int[] indeg · ArrayDeque · PriorityQueue", "getOrDefault on the adjacency map, or build List<Integer>[] when nodes are 0..n-1."],
    ["C++", "vector<int> indeg · queue · priority_queue with greater<>", "The default priority_queue is a MAX-heap, so the smallest order needs greater<> spelled out."],
    ["JavaScript", "array of arrays, plus a head index", "Array.shift() is O(n); move a head pointer instead, or a big graph turns quadratic."],
  ],

  code: {
    pseudo: `# An edge u -> v means "u must come before v".
# A valid order exists exactly when the graph has no cycle.

# KAHN, the BFS flavour. Detects the cycle for free.
indeg <- every node mapped to 0
for each edge (u, v): indeg[v] <- indeg[v] + 1

queue <- ALL nodes with indeg == 0        # not just one: the graph may split
order <- []
while queue not empty:
    u <- pop front                        # min-heap here -> smallest order
    order.add(u)
    for v in adj[u]:
        indeg[v] <- indeg[v] - 1          # one of v's blockers is now done
        if indeg[v] == 0: queue.push(v)

if size(order) < V: CYCLE                 # the survivors are the cycle
else: return order

# DFS, the finish-time flavour. Needs THREE states, not a visited set.
WHITE = never seen, GREY = on the current path, BLACK = fully finished

visit(u):
    color[u] <- GREY
    for v in adj[u]:
        if color[v] == GREY: CYCLE        # an edge back onto our own path
        if color[v] == WHITE: visit(v)
    color[u] <- BLACK
    out.push(u)                           # AFTER descendants, so reversing
                                          # puts u before all of them
for u in all nodes:
    if color[u] == WHITE: visit(u)
order <- reverse(out)

# GREY vs BLACK is the whole trick. In the diamond A->B, A->C, B->D, C->D
# the second visit to D finds it BLACK, which is not a cycle, just a shortcut.

# BONUS: on a DAG, relax edges in topological order and you get shortest
# paths in O(V + E), negative weights included. See the shortest paths page.`,
    py: `from collections import defaultdict, deque
import heapq

def kahn(n, edges):                  # nodes 0..n-1, edge (u, v) = u before v
    adj = defaultdict(list)
    indeg = [0] * n
    for u, v in edges:
        adj[u].append(v)
        indeg[v] += 1
    q = deque(i for i in range(n) if indeg[i] == 0)   # every zero, not one
    order = []
    while q:
        u = q.popleft()
        order.append(u)
        for v in adj[u]:
            indeg[v] -= 1            # v lost a blocker
            if indeg[v] == 0:
                q.append(v)
    return order if len(order) == n else []   # [] means a cycle exists

def kahn_smallest(n, edges):         # lexicographically smallest valid order
    adj, indeg = defaultdict(list), [0] * n
    for u, v in edges:
        adj[u].append(v)
        indeg[v] += 1
    h = [i for i in range(n) if indeg[i] == 0]
    heapq.heapify(h)                 # the ONLY change: queue becomes a heap
    order = []
    while h:
        u = heapq.heappop(h)
        order.append(u)
        for v in adj[u]:
            indeg[v] -= 1
            if indeg[v] == 0:
                heapq.heappush(h, v)
    return order if len(order) == n else []

def dfs_topo(n, edges):
    adj = defaultdict(list)
    for u, v in edges:
        adj[u].append(v)
    color = [0] * n                  # 0 unseen, 1 on current path, 2 finished
    out = []

    def visit(u):
        color[u] = 1
        for v in adj[u]:
            if color[v] == 1:        # still on our path: a real cycle
                raise ValueError("cycle")
            if color[v] == 0:        # 2 is fine, we have been there and left
                visit(v)
        color[u] = 2
        out.append(u)                # only after every descendant

    for u in range(n):
        if color[u] == 0:
            visit(u)
    return out[::-1]`,
    java: `static int[] kahn(int n, int[][] edges) {   // edges[i] = {u, v}, u before v
    List<List<Integer>> adj = new ArrayList<>();
    for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
    int[] indeg = new int[n];
    for (int[] e : edges) { adj.get(e[0]).add(e[1]); indeg[e[1]]++; }

    Deque<Integer> q = new ArrayDeque<>();
    for (int i = 0; i < n; i++) if (indeg[i] == 0) q.offer(i);  // all of them

    int[] order = new int[n];
    int k = 0;
    while (!q.isEmpty()) {
        int u = q.poll();
        order[k++] = u;
        for (int v : adj.get(u))
            if (--indeg[v] == 0) q.offer(v);
    }
    return k == n ? order : new int[0];     // empty array means a cycle
}

// Three colours. A plain boolean[] visited would report cycles that
// are not there, which is the classic wrong answer here.
static boolean hasCycle(int n, List<List<Integer>> adj) {
    int[] color = new int[n];               // 0 white, 1 grey, 2 black
    for (int i = 0; i < n; i++)
        if (color[i] == 0 && visit(i, adj, color)) return true;
    return false;
}

static boolean visit(int u, List<List<Integer>> adj, int[] color) {
    color[u] = 1;
    for (int v : adj.get(u)) {
        if (color[v] == 1) return true;     // back onto the current path
        if (color[v] == 0 && visit(v, adj, color)) return true;
    }
    color[u] = 2;
    return false;
}`,
    cpp: `// Nodes 0..n-1, so index straight into vectors
vector<int> kahn(int n, const vector<vector<int>>& adj) {
    vector<int> indeg(n, 0), order;
    for (int u = 0; u < n; ++u)
        for (int v : adj[u]) indeg[v]++;

    queue<int> q;
    for (int i = 0; i < n; ++i) if (indeg[i] == 0) q.push(i);

    while (!q.empty()) {
        int u = q.front(); q.pop();
        order.push_back(u);
        for (int v : adj[u])
            if (--indeg[v] == 0) q.push(v);
    }
    if ((int)order.size() < n) return {};   // empty means a cycle
    return order;
}

// Lexicographically smallest: swap the queue for a MIN-heap. The default
// priority_queue is a max-heap, so greater<> has to be written out.
vector<int> kahnSmallest(int n, const vector<vector<int>>& adj) {
    vector<int> indeg(n, 0), order;
    for (int u = 0; u < n; ++u)
        for (int v : adj[u]) indeg[v]++;
    priority_queue<int, vector<int>, greater<>> pq;
    for (int i = 0; i < n; ++i) if (indeg[i] == 0) pq.push(i);
    while (!pq.empty()) {
        int u = pq.top(); pq.pop();
        order.push_back(u);
        for (int v : adj[u])
            if (--indeg[v] == 0) pq.push(v);
    }
    return (int)order.size() == n ? order : vector<int>{};
}

// 0 white, 1 grey (on the current path), 2 black (finished)
bool visit(int u, const vector<vector<int>>& adj, vector<char>& color,
           vector<int>& out) {
    color[u] = 1;
    for (int v : adj[u]) {
        if (color[v] == 1) return true;              // cycle
        if (color[v] == 0 && visit(v, adj, color, out)) return true;
    }
    color[u] = 2;
    out.push_back(u);                                // reverse out at the end
    return false;
}`,
    js: `function kahn(n, edges) {              // edges: [[u, v], ...], u before v
  const adj = Array.from({ length: n }, () => []);
  const indeg = new Array(n).fill(0);
  for (const [u, v] of edges) { adj[u].push(v); indeg[v]++; }

  const q = [];
  for (let i = 0; i < n; i++) if (indeg[i] === 0) q.push(i);

  const order = [];
  let head = 0;                        // shift() is O(n); move a head index
  while (head < q.length) {
    const u = q[head++];
    order.push(u);
    for (const v of adj[u]) if (--indeg[v] === 0) q.push(v);
  }
  return order.length === n ? order : [];    // [] means a cycle
}

// Iterative three-colour DFS, so a 100k-node chain does not blow the stack
function hasCycle(n, adj) {
  const color = new Array(n).fill(0);  // 0 white, 1 grey, 2 black
  for (let s = 0; s < n; s++) {
    if (color[s] !== 0) continue;
    const stack = [[s, 0]];
    color[s] = 1;
    while (stack.length) {
      const frame = stack[stack.length - 1];
      const [u, i] = frame;
      if (i < adj[u].length) {
        frame[1]++;
        const v = adj[u][i];
        if (color[v] === 1) return true;     // on the current path
        if (color[v] === 0) { color[v] = 1; stack.push([v, 0]); }
      } else {
        color[u] = 2;                        // finished: safe to leave
        stack.pop();
      }
    }
  }
  return false;
}`,
  },
  codecap: "Kahn counts blockers and reports the cycle by coming up short. DFS records finish times and reports it by walking into a node that is still grey.",

  q: [
    ["When does a topological order exist, and why does that matter?", "Exactly when the graph is a DAG. A cycle means every node in it needs another one to come first, so nothing can go first. That equivalence is why one algorithm answers both questions, and why so many problems are cycle detection in a costume."],
    ["How does Kahn's algorithm detect a cycle without extra work?", "It emits a node only when its in-degree reaches zero. In an acyclic graph every node gets there, so the output has V nodes. If it has fewer, the missing ones are still waiting on each other: they are the cycle and what feeds off it. One length comparison."],
    ["Why does DFS cycle detection need three states instead of a visited set?", "Visited says you have been there at some point. A cycle requires that a node is on the path you are standing on right now. So you need unvisited, in progress, and done. An edge into an in-progress node is a cycle; an edge into a done node is just a second route into finished territory."],
    ["What goes wrong with only two states?", "A diamond, A to B, A to C, B to D, C to D, has no cycle, but the second arrival at D finds it already visited and a two-state check calls that a cycle. You reject a perfectly valid graph."],
    ["Is the topological order unique, and what if the problem wants a specific one?", "Almost never unique: nodes with no path between them can go in either order. For the lexicographically smallest, replace Kahn's queue with a min-heap, which costs O(V log V + E) instead of O(V + E). Nothing else changes."],
    ["What can you do on a DAG in topological order that Dijkstra cannot do at all?", "Relax the edges in that order and get shortest paths in O(V + E), negative weights included. Each node is finalised when you reach it because every path into it comes from earlier in the order, so no priority queue and no non-negativity assumption is needed."],
  ],

  p: [
    [207, "course-schedule", "Course Schedule, cycle detection wearing a disguise", "M"],
    [210, "course-schedule-ii", "Course Schedule II, the same run, now printing the order", "M"],
    [802, "find-eventual-safe-states", "Eventual Safe States, three colours doing exactly their job", "M"],
    [310, "minimum-height-trees", "Minimum Height Trees, Kahn-style peeling on an undirected graph", "M"],
    [2115, "find-all-possible-recipes-from-given-supplies", "Possible Recipes, dependencies with a base case", "M"],
    [1462, "course-schedule-iv", "Course Schedule IV, reachability on top of the order", "M"],
    [269, "alien-dictionary", "Alien Dictionary, the hard part is building the edges", "H"],
  ],
},

/* ==================================================================== */
{
  id: "mst",
  n: "Minimum spanning tree",
  group: "Graphs",
  one: "Connect every node as cheaply as possible: exactly V-1 edges, no cycles. Both algorithms are one greedy rule, <b>the lightest edge crossing any cut is safe</b>.",

  plain: `<p>You have a set of towns and a list of possible cables between them, each with a price. Every town must end up reachable from every other. You want the total price to be as small as possible.</p>
<p>Nothing else counts. Not how long the journey between two towns ends up being. Not which town you start from. Only the total bill.</p>
<p>That sounds obvious, and it is the thing people get wrong. <b>The network that is cheapest to build is not the network with the best routes in it.</b> Those are two different questions with two different answers, and interviewers ask about the difference on purpose.</p>
<p>The shape of the answer is fixed before you choose anything. To connect n towns you need at least n-1 cables. Any extra cable makes a loop, and on a loop you can always cut the most expensive cable and still reach everywhere. So the answer has exactly n-1 cables and no loops. The only question left is <b>which</b> n-1.</p>
<p><b>Analogy.</b> You are paying for cable, not for driving time. The cheapest network to build is not the one with the fastest journeys, and a resident who cares about their commute will not thank you for the difference.</p>`,

  why: [
    { t: "The shape of the answer is forced before you choose anything", d: "V nodes cannot be joined with fewer than V-1 edges. Add one more edge and you have made a loop. On a loop you can always delete the heaviest edge: everything is still reachable, going round the other way, and the bill just went down. So the best answer has no loops and exactly V-1 edges. That is what the word <b>tree</b> means here. It is a conclusion, not an assumption you started with." },
    { t: "It is not a shortest path tree, and this is where the question is lost", d: "Three nodes. A-B costs 2, B-C costs 2, A-C costs 3. The MST keeps the two 2s, total 4, because every other spanning tree costs 5. Now travel from A to C inside that tree. It costs 4. The direct edge cost 3, and the MST threw it away on purpose. <b>Cheapest total and shortest journey are different goals.</b> Neither tree is wrong. They answer different questions." },
    { t: "The one fact both algorithms stand on", d: "Split the nodes into two groups, any split you like. Look at the edges with one end in each group. <b>The cheapest of those crossing edges is in some minimum spanning tree.</b> Read the word some carefully. Not every. One safe best answer containing it is all the argument needs." },
    { t: "Prove it by swapping, which needs nothing new", d: "Let e be the cheapest edge crossing the split. Take any best tree T that does not contain e. Add e, and exactly one loop appears. That loop leaves one side of the split and has to come back, so it uses a second crossing edge f. Since e was the cheapest crossing edge, f costs at least as much. Now delete f. What is left still reaches everything, still has no loop, and costs no more than T. So a best tree containing e exists." },
    { t: "Kruskal falls out: sort, then ask which group", d: "Take the edges cheapest first. When you reach an edge whose two ends are in different groups, split the nodes along those groups. Nothing cheaper crosses that split, because anything cheaper came earlier and would have merged them already. So the edge is safe. If both ends are already in the same group, the edge would close a loop, so drop it. That same-group test is exactly union-find, which has its own page. The total is <b>O(E log E)</b>, and the sort is nearly all of it." },
    { t: "Prim falls out: fix one side of the split and never move it", d: "Start anywhere. Let the split always be: what I have built so far, against everything else. The cheapest edge crossing it is safe, so take it, swallow the node on the far end, and repeat. A heap of the edges leaving the tree finds that cheapest edge quickly, giving <b>O(E log V)</b>. This is Dijkstra's loop line for line, with one difference worth memorising. Dijkstra keys the heap by <code>dist[u] + w</code>, the distance from the source. Prim keys it by <code>w</code> alone, the price of that one edge. One addition, deleted. That is the whole difference, and it is why one gives shortest paths and the other does not." },
    { t: "Choosing between them, and what neither gives you", d: "Kruskal for sparse graphs, and whenever the input already arrives as a list of edges, since you were going to sort something anyway. Prim for dense graphs and when the graph is handed to you as an adjacency list. On a truly dense graph, drop the heap and scan instead: <b>O(V²)</b>. Two more facts. When weights tie the MST is not unique, so two correct programs can return different trees. The multiset of weights is the same in every MST though, which is why comparing totals is safe and comparing edge lists is not. And all of this assumes the graph is undirected and connected. Directed edges are a different problem with a different algorithm, and a disconnected graph has no spanning tree at all, only a forest." },
  ],

  variants: [
    { n: "Kruskal", cost: "O(E log E) · the sort is the bill",
      idea: "Sort every edge by weight and keep each one whose endpoints are in different components. The component test is a union-find, so the algorithm is one sort plus the page next door.",
      when: "Sparse graphs, and any time the input is already a list of edges. Also the natural fit when edges arrive offline and you want them processed in weight order for other reasons.",
      watch: "Keeping fewer than V-1 edges means the graph was disconnected, and the number you are about to return is the weight of a forest. Check the count before you return it." },

    { n: "Prim with a heap", cost: "O(E log V) · one growing tree",
      idea: "Keep a flag array for what is in the tree and a heap of edges leaving it. Pop the cheapest, absorb its far node, push that node's edges. The cut is always tree against the rest.",
      when: "The graph is given as an adjacency list, or building an explicit edge list to sort would be wasteful.",
      watch: "The heap key is the <b>edge weight</b>, not the running total. Push <code>total + w</code> instead of <code>w</code> and you have silently written Dijkstra, which will return a plausible and wrong number." },

    { n: "Prim, dense version", cost: "O(V²) · no heap at all",
      idea: "Hold <code>best[v]</code>, the cheapest known edge from the tree to v. Each round, scan all nodes for the smallest, absorb it, and update its neighbours. Two nested loops, no data structures.",
      when: "Dense or complete graphs. Points in a plane are the classic case: every pair is an edge, so E is V², and materialising V² edges to sort them is the expensive part of Kruskal.",
      watch: "<code>best[]</code> is only meaningful for nodes outside the tree. It beats the heap version once E approaches V², and it is shorter to type under pressure, which is its own argument." },

    { n: "Maximum spanning tree", cost: "O(E log E) · the same code",
      idea: "Reverse the comparator, or negate every weight. Nothing else in the algorithm changes.",
      when: "The score is something you want more of: bandwidth, reliability, similarity between items.",
      watch: "The cut property becomes the <i>heaviest</i> crossing edge is safe, and the proof is the same paragraph with the inequality flipped. In C++ this variant is what you get by accident, since the default priority_queue is a max-heap." },

    { n: "Second-best MST", cost: "O(V · E log E) naively",
      idea: "The second-best tree differs from the best by exactly one swap, so forbid each of the V-1 tree edges in turn, rebuild, and keep the cheapest result that is not the original.",
      when: "Asked as a follow-up roughly nine seconds after you finish writing Kruskal.",
      watch: "Only tree edges are worth forbidding; banning a non-tree edge changes nothing. The fast version replaces the rebuild with the maximum edge weight on the tree path between each non-tree edge's endpoints, which is where binary lifting turns up." },
  ],

  hing: `<p><b>Sawaal kya hai:</b> saare nodes ko jodna hai, aur total edge weight <b>jitna kam ho sake</b> utna kam. Bas. Kaun kitni door hai, ya kis node se shuru kiya, isse koi matlab nahi.</p>
<p><b>Answer ka shape pehle se tay hai.</b> V nodes ko jodne ke liye kam se kam V-1 edges chahiye. Ek extra edge daalo to cycle ban jaati hai, aur cycle par sabse bhaari edge hamesha hata sakte ho: graph phir bhi connected rahega aur paisa bach jaayega. Isliye jawaab mein <b>cycle nahi hoti aur theek V-1 edges hoti hain</b>, matlab woh ek <b>tree</b> hai. Tree naam nateeja hai, shuruaat nahi.</p>
<p><b>Ab woh baat jo interview mein pakadti hai: MST shortest path tree NAHI hai.</b> Teen nodes lo: A-B = 2, B-C = 2, A-C = 3. MST dono 2 rakhega, total 4. Lekin us tree ke andar A se C jaane ka raasta 4 ka padta hai. Asli shortest path to 3 wali seedhi edge thi, jise MST ne jaan-boojh kar phenk diya. <b>Total kam karna aur har node ki source se doori kam karna, ye do alag maqsad hain.</b> Dono trees sahi hain, bas sawaal alag hai.</p>
<p><b>Cut property, jis par dono algorithms tike hain:</b> nodes ko kisi bhi tarah do hisson mein baant do. Jo edges dono taraf ko cross karti hain, unmein se <b>sabse halki edge kisi na kisi MST mein zaroor hai</b>. Dhyaan do: "kisi ek mein", "har ek mein" nahi. Greedy page wali baat yahan bhi wahi hai.</p>
<p><b>Proof wahi exchange argument hai.</b> Maan lo e sabse halki crossing edge hai aur T koi MST hai jismein e nahi hai. T mein e daalo, theek ek cycle banegi. Woh cycle cut ke ek taraf se nikli hai, to wapas bhi aayegi. Matlab usmein ek aur crossing edge f hai. Aur e sabse sasti crossing edge thi, to <code>weight(f) >= weight(e)</code>. Ab f hata do. Jo bacha woh abhi bhi spanning tree hai aur <b>bhaari nahi hua</b>. Matlab e wala MST exist karta hai. Yahan bhi tumhein greedy ko optimum se behtar sabit nahi karna, sirf <b>barabar</b>.</p>
<p><b>Kruskal:</b> saari edges weight se sort karo, aur har edge tabhi rakho jab uske dono sire <b>alag components</b> mein hon. Yeh check exactly <b>union-find</b> hai (uska apna page hai, wahin se uthao). Total <b>O(E log E)</b>, jismein poora kharcha sort ka hai.</p>
<p><b>Prim:</b> ek node se tree ugao, aur baar baar tree se bahar jaane wali <b>sabse sasti edge</b> lo, priority queue se. <b>O(E log V)</b>. Aur ab woh ek line jo yaad rakhni hai. <b>Dijkstra queue ko source se doori par sort karta hai, yaani <code>dist[u] + w</code>. Prim sirf <code>w</code> par sort karta hai, yaani tree mein aane wali us ek edge ke weight par.</b> Bas ek addition ka farq hai. Aur wahi farq decide karta hai ki kaun shortest path deta hai aur kaun nahi.</p>
<p><b>Kaun sa kab:</b> sparse graph ya edges pehle se list mein → <b>Kruskal</b>. Dense graph ya adjacency list mila hai → <b>Prim</b>, aur bahut dense ho to heap chhod kar seedha <b>O(V²)</b> scan likh do.</p>
<p><b>Do aur baatein interview ke liye:</b> weights tie karte hon to <b>MST unique nahi hota</b>, do sahi programs alag-alag trees de sakte hain. Par har MST ka <b>weights ka multiset ek hi hota hai</b>, isliye total compare karna safe hai aur edge list compare karna nahi. Aur yeh sab <b>undirected</b> graph ke liye hai; directed edges ka to alag problem aur alag algorithm hai.</p>`,

  viz: ["mst"],

  math: [
    { t: "The answer's shape is fixed before any choice is made", d: "You are not choosing how many edges. That number is forced, and knowing it turns the problem into picking which ones.", w:
`a spanning tree of V nodes has exactly V - 1 edges

V - 2 edges:  cannot be connected
V edges:      contains a cycle, and the heaviest edge on
              that cycle can be deleted, leaving it
              connected and strictly cheaper

so every algorithm chooses WHICH V - 1, never how many` },
    { t: "An MST is not a shortest-path tree, and one triangle shows it", d: "This is the single most common way the question is lost. Three nodes are enough to separate the two objectives.", w:
`A-B = 1,  B-C = 1,  A-C = 1.9

MST: take A-B and B-C, total weight 2
  (A-C at 1.9 would make a cycle and is heavier than 1)

shortest path A to C: the direct edge, 1.9
inside the MST that trip costs 1 + 1 = 2

minimising the total is not minimising any one path` },
    { t: "The cut property, proved by exchange", d: "Both algorithms rest on this one fact, and the proof is the same swap argument used for greedy correctness everywhere else.", w:
`take any cut. Let e be a lightest edge crossing it.
Suppose some MST T does not contain e.

add e to T  ->  exactly one cycle forms
that cycle must cross the cut a second time, at some f
  weight(f) >= weight(e)        (e was lightest crossing)

T - f + e is still spanning, still acyclic, and weighs
no more. So an MST containing e exists.` },
    { t: "Kruskal and Prim, priced against each other", d: "They agree on the answer and differ on what they sort. The density of the graph is what decides which one is doing less work.", w:
`Kruskal:  sort E edges           E log E
          E union-find ops       E x alpha
          total                  O(E log V)

Prim, binary heap:               O(E log V)
Prim, adjacency matrix, no heap: O(V^2)

V = 10^5, E = 5 x 10^5 (sparse):  both ~ 8 x 10^6
V = 10^3, E = 5 x 10^5 (dense):   matrix Prim 10^6,
                                  Kruskal 9.5 x 10^6` },
  ],

  costs: [
    ["Kruskal, total", "O(E log E)", "sorting is the only expensive step, and log E is at most 2 log V"],
    ["the union-find inside Kruskal", "O(E α(V))", "near constant per edge, so it never shows up in the answer you quote"],
    ["Prim with a binary heap", "O(E log V)", "each edge is pushed at most once and every pop pays one log"],
    ["Prim with an array scan", "O(V²)", "no heap and no edge list; wins once E is close to V²"],
    ["Prim with a Fibonacci heap", "O(E + V log V)", "true, quoted often, and slower than a binary heap on real inputs"],
    ["extra space", "O(V + E)", "an edge list for Kruskal, a heap plus one flag array for Prim"],
    ["second-best MST, naive", "O(V · E log E)", "forbid each of the V-1 tree edges in turn and rebuild"],
  ],

  traps: [
    "<b>Using the MST as a shortest path tree.</b> The path between two nodes inside an MST can be longer than their real shortest path, and no part of the algorithm will mention this. Different objective, different tree, different algorithm.",
    "<b>Prim pushing the running total instead of the edge weight.</b> Push <code>total + w</code> and you have written Dijkstra, which still terminates and still returns a number. Push <code>w</code> alone.",
    "<b>C++ priority_queue without greater&lt;&gt;.</b> The default is a max-heap, so Prim quietly computes a <i>maximum</i> spanning tree. The output looks like a plausible total, which is the worst kind of wrong.",
    "<b>Not checking that you kept V-1 edges.</b> On a disconnected graph Kruskal happily returns the weight of a spanning forest. Count the successful unions, or count components, and say so.",
    "<b>Marking a node as in-tree when you push it rather than when you pop it.</b> A cheaper edge to that node can still arrive while it sits in the heap. Skip stale entries on pop, exactly as in Dijkstra.",
    "<b>Reaching for Kruskal or Prim on a directed graph.</b> Neither is correct there. The directed version is a minimum arborescence and needs Chu-Liu / Edmonds, which is not a whiteboard algorithm.",
  ],

  impl: [
    ["Python", "sorted() for Kruskal, heapq for Prim", "No disjoint set in the stdlib, so paste your own. heapq is a min-heap, which is what you want here."],
    ["Java", "Arrays.sort with a comparator, PriorityQueue<int[]>", "Write Integer.compare(a[2], b[2]), never a[2] - b[2]: large weights overflow and the sort goes quietly wrong."],
    ["C++", "std::sort, priority_queue with greater<>", "The default max-heap gives you a maximum spanning tree. Storing edges as tuple<int,int,int> with weight first makes the default sort correct."],
    ["JavaScript", "Array.sort with a comparator, no heap", "sort() without a comparator compares as text. With no built-in heap, the O(V²) dense Prim is often the honest choice."],
  ],

  code: {
    pseudo: `# GOAL: connect every node, minimise the TOTAL weight of the edges kept.
# V nodes need at least V-1 edges. An extra edge closes a cycle, and the
# heaviest edge on a cycle can always be deleted with nothing disconnected.
# So the answer has exactly V-1 edges and no cycles. It is a TREE.

# WHAT IT IS NOT: a shortest path tree.
#   A-B = 2, B-C = 2, A-C = 3
#   MST keeps the two 2s, total 4. Any other spanning tree costs 5.
#   But inside that tree the walk from A to C costs 4, while the real
#   shortest path is the single edge of 3, which the MST threw away.
#   Minimising the SUM is not minimising each distance from a source.

# THE CUT PROPERTY, which both algorithms are just two readings of:
#   split the nodes into two non-empty sides, any split at all.
#   The LIGHTEST edge with one end on each side is in SOME MST.
# PROOF (the exchange argument from the greedy page):
#   let e be that edge, and T any MST without it.
#   adding e to T makes exactly one cycle; a cycle that leaves one side
#   must come back, so it uses another crossing edge f, and w(f) >= w(e).
#   swap e in, f out: still spanning, still a tree, NO HEAVIER.
#   You never beat the optimum. Tying with it is the whole proof.

# KRUSKAL: cheapest edge first, and the cut is found for you
kruskal(V, edges):
    sort edges by weight ascending
    dsu <- union-find over V nodes         # see the union-find page
    total, kept <- 0, 0
    for (w, u, v) in edges:
        if dsu.union(u, v):                # different components: safe
            total <- total + w             # nothing lighter crosses that cut,
            kept  <- kept + 1              # everything lighter was seen already
    if kept != V - 1: return DISCONNECTED  # you built a forest, not a tree
    return total                           # O(E log E), all of it the sort

# PRIM: fix one side of the cut as "what I have built so far"
prim(start):
    inTree <- all false
    heap   <- [ (0, start) ]               # (weight of edge into tree, node)
    total, kept <- 0, 0
    while heap not empty:
        (w, u) <- pop the smallest
        if inTree[u]: continue             # stale entry, already absorbed
        inTree[u] <- true
        total <- total + w
        kept  <- kept + 1
        for (v, wt) in neighbours(u):
            if not inTree[v]: push (wt, v) # KEY IS wt, THE EDGE WEIGHT
    if kept != V: return DISCONNECTED
    return total                           # O(E log V)

# PRIM vs DIJKSTRA, the only difference, and it is one term:
#   Dijkstra pushes (dist[u] + wt, v)   cost of the path from the source
#   Prim     pushes (wt, v)             cost of one edge into the tree
# Same loop, same heap, same stale-entry skip. Delete one addition and
# you have swapped which question the program answers.`,

    py: `import heapq

# KRUSKAL. The component test is union-find and nothing else; its own page
# explains why find and union are near constant. Here it is a black box.
def kruskal(n, edges, reverse=False):    # edges as (w, u, v), nodes 0..n-1
    parent = list(range(n))

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]     # path halving, the short form
            x = parent[x]
        return x

    total, kept = 0, 0
    for w, u, v in sorted(edges, reverse=reverse):    # the greedy order
        ru, rv = find(u), find(v)
        if ru == rv:
            continue                     # same component, so this is a cycle
        parent[ru] = rv
        total += w
        kept += 1
    return total if kept == n - 1 else None   # None: the graph was disconnected


# PRIM. Dijkstra's loop with exactly one term removed, marked below.
def prim(adj, n, start=0):               # adj[u] = [(v, weight), ...]
    in_tree = [False] * n
    heap = [(0, start)]
    total, kept = 0, 0
    while heap and kept < n:
        w, u = heapq.heappop(heap)
        if in_tree[u]:
            continue                     # stale entry from an earlier push
        in_tree[u] = True                # in-tree on POP, never on push
        total += w
        kept += 1
        for v, wt in adj[u]:
            if not in_tree[v]:
                heapq.heappush(heap, (wt, v))    # wt alone, NOT total + wt
    return total if kept == n else None


# MAXIMUM spanning tree: reverse the order, change nothing else. Negating the
# weights instead also works, right up until you negate the -1 sentinel too.
def max_spanning_tree(n, edges):
    return kruskal(n, edges, reverse=True)`,

    java: `// KRUSKAL: sort, then keep an edge only when its ends sit in different
// components. That test is a union-find, borrowed from its own page.
static long kruskal(int n, int[][] edges) {       // edges as {u, v, weight}
    Arrays.sort(edges, (a, b) -> Integer.compare(a[2], b[2]));  // never a-b
    int[] parent = new int[n];
    for (int i = 0; i < n; i++) parent[i] = i;
    long total = 0;
    int kept = 0;
    for (int[] e : edges) {
        int ru = find(parent, e[0]), rv = find(parent, e[1]);
        if (ru == rv) continue;                   // would close a cycle
        parent[ru] = rv;
        total += e[2];
        kept++;
    }
    return kept == n - 1 ? total : -1;            // -1: disconnected graph
}

static int find(int[] parent, int x) {
    while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x]; }
    return x;
}

// PRIM: the queue is keyed by the EDGE weight. Add a running total to that
// key and you have written Dijkstra, which answers a different question.
static long prim(List<int[]>[] adj, int n) {      // entries are {to, weight}
    boolean[] inTree = new boolean[n];
    PriorityQueue<int[]> pq =
        new PriorityQueue<>((a, b) -> Integer.compare(a[0], b[0]));
    pq.offer(new int[]{0, 0});                    // {edge weight, node}
    long total = 0;
    int kept = 0;
    while (!pq.isEmpty() && kept < n) {
        int[] cur = pq.poll();
        if (inTree[cur[1]]) continue;             // stale entry, skip it
        inTree[cur[1]] = true;
        total += cur[0];
        kept++;
        for (int[] e : adj[cur[1]])
            if (!inTree[e[0]]) pq.offer(new int[]{e[1], e[0]});
    }
    return kept == n ? total : -1;
}`,

    cpp: `// PRIM. greater<> matters more here than usual: the default priority_queue
// is a MAX-heap, and a max-heap turns this into a MAXIMUM spanning tree
// that compiles, runs, and hands back a confident wrong total.
long long prim(const vector<vector<pair<int,int>>>& adj) {
    int n = adj.size();
    vector<char> inTree(n, 0);
    priority_queue<pair<int,int>, vector<pair<int,int>>, greater<>> pq;
    pq.push({0, 0});                     // (edge weight into tree, node)
    long long total = 0;
    int kept = 0;
    while (!pq.empty() && kept < n) {
        auto [w, u] = pq.top(); pq.pop();
        if (inTree[u]) continue;         // stale entry, already absorbed
        inTree[u] = 1;                   // in-tree on pop, not on push
        total += w;
        ++kept;
        for (auto [v, wt] : adj[u])
            if (!inTree[v]) pq.push({wt, v});     // wt, not total + wt
    }
    return kept == n ? total : -1;
}

// DENSE PRIM: O(V^2), no heap, no edge list. Once E approaches V^2 this
// beats the heap version, and it is four lines shorter to write.
long long primDense(const vector<vector<int>>& w) {   // w[u][v], INF if none
    int n = w.size();
    vector<int> best(n, INT_MAX);        // best[v] only means anything while
    vector<char> inTree(n, 0);           // v is still OUTSIDE the tree
    best[0] = 0;
    long long total = 0;
    for (int it = 0; it < n; ++it) {
        int u = -1;
        for (int v = 0; v < n; ++v)                    // scan for the cheapest
            if (!inTree[v] && (u == -1 || best[v] < best[u])) u = v;
        if (best[u] == INT_MAX) return -1;             // disconnected
        inTree[u] = 1;
        total += best[u];
        for (int v = 0; v < n; ++v)
            if (!inTree[v] && w[u][v] < best[v]) best[v] = w[u][v];
    }
    return total;
}`,

    js: `// KRUSKAL with an inline DSU. Edges as [u, v, w]. The sort is the cost;
// the component test is union-find, which has its own page.
function kruskal(n, edges, cmp = (a, b) => a[2] - b[2]) {
  const parent = Array.from({ length: n }, (_, i) => i);
  const find = (x) => {
    while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; }
    return x;
  };
  let total = 0, kept = 0;
  for (const [u, v, w] of [...edges].sort(cmp)) {   // sort() needs a comparator
    const ru = find(u), rv = find(v);
    if (ru === rv) continue;              // same component, so this is a cycle
    parent[ru] = rv;
    total += w;
    kept++;
  }
  return kept === n - 1 ? total : null;   // null: the graph was disconnected
}

// MAXIMUM spanning tree: reverse the comparator, change nothing else. The
// cut property does not care which end of the order you decided to prefer.
const maxSpanningTree = (n, edges) =>
  kruskal(n, edges, (a, b) => b[2] - a[2]);

// DENSE PRIM, O(V^2) and no heap. Points in a plane are the usual case:
// every pair is an edge, so listing all V^2 of them to sort is the waste.
function primDense(n, weight) {           // weight(i, j) computed on demand
  const best = new Array(n).fill(Infinity);
  const inTree = new Array(n).fill(false);
  best[0] = 0;
  let total = 0;
  for (let it = 0; it < n; it++) {
    let u = -1;
    for (let v = 0; v < n; v++)           // pick the cheapest node outside
      if (!inTree[v] && (u === -1 || best[v] < best[u])) u = v;
    if (best[u] === Infinity) return null;             // disconnected
    inTree[u] = true;
    total += best[u];
    for (let v = 0; v < n; v++)
      if (!inTree[v] && weight(u, v) < best[v]) best[v] = weight(u, v);
  }
  return total;
}`,
  },
  codecap: "Kruskal is a sort plus a union-find; Prim is Dijkstra with one addition deleted from the heap key. Both are the cut property, read from different ends.",

  q: [
    ["Why does the answer always have exactly V-1 edges and no cycles?", "V nodes need at least V-1 edges to be connected. Any further edge closes a cycle, and on a cycle the heaviest edge can be deleted with everything still reachable the other way round, which lowers the total. So an optimal solution has no cycles and V-1 edges, which is a tree."],
    ["Is the path between two nodes in an MST their shortest path?", "No, and this is the point of the topic. With A-B = 2, B-C = 2, A-C = 3, the MST keeps the two 2s so the tree path from A to C costs 4, while the direct edge of 3 is shorter and was discarded. An MST minimises the total weight; a shortest path tree minimises each distance from one source. Different objectives, different trees."],
    ["State the cut property and prove it.", "Split the nodes into two non-empty sides. The lightest edge crossing the split lies in some MST. Proof by exchange: take any MST without that edge e, add e, and exactly one cycle forms. The cycle leaves one side so it must return, using another crossing edge f with weight at least that of e. Remove f. The result still spans, is still a tree, and is no heavier, so an MST containing e exists."],
    ["Why is Kruskal correct, and what data structure does it need?", "Processing edges cheapest first means that when an edge joins two different components, nothing lighter crosses the cut separating them, since everything lighter has already been handled. So the cut property makes it safe. The only operation needed is asking whether two nodes are in the same component and merging them, which is union-find."],
    ["What is the difference between Prim and Dijkstra?", "The heap key. Dijkstra pushes the distance from the source, dist[u] + w, so it settles nodes by total path cost. Prim pushes w alone, the weight of the single edge that would attach the node to the tree. The loop, the heap and the stale-entry skip are identical; deleting that one addition changes which question the program answers."],
    ["Is the MST unique, and which parts of it can you rely on?", "Not unique when weights tie: two correct programs can return different edge sets. But every MST of a graph has the same multiset of edge weights, so the total is always the same and is safe to compare, while a specific edge list is not. If all weights are distinct, the MST is unique."],
  ],

  p: [
    [1319, "number-of-operations-to-make-network-connected", "Make Network Connected, counting components before spanning them", "M"],
    [1584, "min-cost-to-connect-all-points", "Min Cost to Connect All Points, MST in disguise on a complete graph", "M"],
    [1135, "connecting-cities-with-minimum-cost", "Connecting Cities, textbook MST with a disconnected case to catch", "M"],
    [1631, "path-with-minimum-effort", "Path With Minimum Effort, the minimax path an MST also answers", "M"],
    [1168, "optimize-water-distribution-in-a-village", "Optimize Water Distribution, a virtual node turns wells into edges", "H"],
    [1697, "checking-existence-of-edge-length-limited-paths", "Edge Length Limited Paths, offline queries along Kruskal's order", "H"],
    [1489, "find-critical-and-pseudo-critical-edges-in-minimum-spanning-tree", "Critical and Pseudo-Critical Edges, Kruskal run once per edge", "H"],
  ],
},

/* ==================================================================== */
{
  id: "sorting",
  n: "Sorting",
  group: "Algorithms",
  one: "No comparison sort can beat <b>O(n log n)</b>. That is a proof, not a lack of cleverness. Escaping it means not comparing at all.",

  plain: `<p>Sorting looks like a solved problem you should simply call a library for, and mostly it is. What matters in an interview is knowing <i>why</i> the library stops where it does, and when you are allowed to go faster.</p>
<p>Here is the surprising part. Arranging n items means picking one arrangement out of <b>n factorial</b> possibilities. Each comparison you make has two outcomes, so it can at best halve the field. To narrow n! possibilities down to one you therefore need about <b>log₂(n!) ≈ n log n</b> comparisons, no matter how clever the algorithm is.</p>
<p>So merge sort and heap sort are not merely good; they are <b>optimal</b> for comparison sorting. And the only way past the barrier is to stop comparing: if you can use the values themselves as array positions, the argument no longer applies.</p>
<p><b>Analogy.</b> Twenty questions. Each yes-or-no answer halves the possibilities, so twenty questions can distinguish about a million things, and no fewer questions will do, however well you choose them.</p>`,

  why: [
    { t: "Count what has to be decided", d: "There are <b>n!</b> possible orderings and only one is correct. A comparison returns one of two answers, so it can at best cut the surviving possibilities in half. You need enough comparisons k that 2<sup>k</sup> ≥ n!, which gives k ≥ log₂(n!) ≈ <b>n log n</b>. This is a lower bound on the problem, not on any particular algorithm." },
    { t: "Merge sort meets the bound exactly", d: "Split in half repeatedly. That is <b>log n levels</b>. Merging two already-sorted runs is a single walk with two fingers, <b>O(n) per level</b>. Multiply: O(n log n), guaranteed, worst case included. It is also <b>stable</b>, and it pays O(n) scratch memory for both properties." },
    { t: "Quicksort meets it on average, with no extra memory", d: "Pick a pivot, partition so that smaller values sit left and larger right, recurse on each side. A good pivot halves the array and gives O(n log n) in O(1) extra space. A bad pivot peels off one element at a time and gives <b>O(n²)</b>. That is why real implementations randomise the pivot, or count their recursion depth and switch to heap sort." },
    { t: "What your standard library actually runs", d: "Rarely a textbook algorithm. <b>Timsort</b> (Python, and Java for objects) hunts for runs that are already ordered and merges those, so nearly-sorted input costs <b>O(n)</b>. <b>Introsort</b> (C++) is quicksort that falls back to heap sort when the recursion gets too deep, so it keeps the O(1) space without the O(n²) risk." },
    { t: "The bound only binds comparison sorts", d: "The whole proof assumed information arrives one comparison at a time. Counting sort makes no comparisons: it uses each value as an <b>index</b> into a tally array, then reads the tallies back out. That is <b>O(n + k)</b> for k distinct values, genuinely linear, and only worth it when k is small relative to n. Radix sort applies the same trick digit by digit." },
    { t: "Stability is not a detail", d: "A stable sort keeps equal elements in their original relative order. That is what allows multi-key sorting: sort by the secondary key, then by the primary, and the secondary ordering survives inside each group. If your language's sort is unstable, that technique silently produces wrong answers." },
    { t: "And sometimes you should not sort at all", d: "Sorting to find the k largest is O(n log n) when a size-k heap does it in O(n log k). Sorting to check for duplicates is O(n log n) when a hash set does it in O(n). Sorting is worth it when you need the <i>order</i> itself, or when order unlocks a two-pointer or binary-search technique." },
  ],

  variants: [
    { n: "Insertion sort", cost: "O(n\u00b2) worst \u00b7 O(n) nearly sorted \u00b7 O(1) space \u00b7 stable",
      idea: "Walk left to right, and slide each new element back into the part already sorted. Exactly how you sort a hand of cards, which is why nobody has to be taught it twice.",
      when: "n is tiny, or the data is nearly sorted already. Real libraries switch to it for runs under about 16 elements, because the constants beat everything asymptotically better.",
      watch: "It is O(n\u00b2) the moment the data is not nearly sorted. Fine as the base case of something bigger, not as your answer." },

    { n: "Selection sort", cost: "O(n\u00b2) always \u00b7 O(1) space \u00b7 unstable",
      idea: "Find the smallest remaining element, swap it into place, repeat.",
      when: "Essentially never. It is here because it is taught, and because it makes exactly n-1 swaps, which matters only if writing is enormously more expensive than reading.",
      watch: "It is O(n\u00b2) even on already-sorted input, because it scans the whole remainder regardless. Insertion sort dominates it in every practical sense." },

    { n: "Bubble sort", cost: "O(n\u00b2) \u00b7 O(1) space \u00b7 stable",
      idea: "Repeatedly sweep, swapping adjacent pairs that are out of order, until a sweep changes nothing.",
      when: "Never, in production. Know it so you can recognise it and say why you are not using it.",
      watch: "The early-exit version is O(n) on sorted input, which is the only nice thing anyone can say about it." },

    { n: "Merge sort", cost: "O(n log n) guaranteed \u00b7 O(n) space \u00b7 stable",
      idea: "Split in half until pieces are single elements, then merge sorted runs pairwise. <code>log n</code> levels of splitting, <code>O(n)</code> of merging per level.",
      when: "You need the worst case guaranteed, or you need stability, or you are sorting a linked list, where it is the natural fit because merging needs no random access.",
      watch: "The O(n) scratch buffer is the price. In-place merge sort exists, is fiddly, and is slower in practice than just paying for the memory." },

    { n: "Quicksort", cost: "O(n log n) average \u00b7 O(n\u00b2) worst \u00b7 O(log n) stack \u00b7 unstable",
      idea: "Pick a pivot, partition so smaller values sit left and larger right, then recurse on each side. The pivot lands in its final position and never moves again.",
      when: "The default for arrays in practice. It sorts in place and has excellent cache behaviour, which is why it usually beats merge sort on real hardware despite the identical Big-O.",
      watch: "A bad pivot every time gives O(n\u00b2). Randomise the pivot, or use median-of-three, and cap the recursion depth. Never take the first element as pivot on data that might arrive sorted." },

    { n: "Heap sort", cost: "O(n log n) guaranteed \u00b7 O(1) space \u00b7 unstable",
      idea: "Build a max-heap in O(n), then repeatedly swap the root to the end and sift down over the shrinking prefix.",
      when: "You need a guaranteed worst case AND constant space. That combination is rare, which is why you rarely see it alone.",
      watch: "It jumps all over memory, so it loses to quicksort in wall-clock time despite matching it on paper. Its real job is as introsort's safety net." },

    { n: "Counting sort", cost: "O(n + k) \u00b7 O(k) space \u00b7 stable",
      idea: "Do not compare anything. Tally how many times each value occurs, then read the tallies back out in order. The value <i>is</i> the index.",
      when: "Keys are small integers with a bounded range k, such as ages, grades, or characters. This is how you legitimately beat the n log n floor.",
      watch: "Cost and memory both scale with k, not just n. Sorting a handful of values spread across the whole integer range will allocate an array you will regret." },

    { n: "Radix sort", cost: "O(d \u00b7 (n + k)) \u00b7 O(n + k) space \u00b7 stable",
      idea: "Counting sort applied one digit at a time, least significant digit first. Stability is what makes the earlier passes survive the later ones.",
      when: "Large volumes of fixed-width keys: integers, dates, fixed-length strings.",
      watch: "The d factor is the number of digits, so it is not magically linear. Break stability in the inner sort and the whole thing silently produces nonsense." },

    { n: "Bucket sort", cost: "O(n) average \u00b7 O(n\u00b2) worst \u00b7 O(n) space",
      idea: "Scatter values into buckets by range, sort each bucket, then concatenate.",
      when: "Values are roughly uniformly distributed over a known range, floating point being the usual case.",
      watch: "The average case assumes uniformity. Skewed data puts everything in one bucket and hands you the cost of whatever you sorted that bucket with." },

    { n: "What your library actually runs", cost: "Timsort or introsort",
      idea: "<b>Timsort</b> (Python, and Java for objects) finds runs that are already ordered and merges those, so partly sorted input costs closer to O(n). <b>Introsort</b> (C++) is quicksort that counts its recursion depth and bails out to heap sort before the worst case can happen.",
      when: "Always, unless the interviewer asked you to implement one by hand.",
      watch: "Know which one you are calling. Java is stable for objects and unstable for primitive arrays, and C++ sort is unstable while stable_sort is not. That difference decides whether multi-key sorting works." },
  ],

  hing: `<p><b>Sabse pehle woh baat jo interview mein points dilaati hai:</b> koi bhi comparison-based sort <b>O(n log n)</b> se tez nahi ho sakta. Yeh koi "abhi tak kisi ne socha nahi" wali baat nahi, yeh <b>proof</b> hai.</p>
<p><b>Proof aasaan hai.</b> n cheezon ko lagane ke <b>n!</b> tarike hain, sahi sirf ek. Har comparison ka jawaab do mein se ek hota hai, matlab woh possibilities ko zyada se zyada <b>aadha</b> kar sakta hai. n! ko 1 tak laane ke liye chahiye ~<b>log₂(n!) ≈ n log n</b> comparisons. Bas.</p>
<p><b>Merge sort theek isi limit par baithta hai.</b> Aadha-aadha todo → <b>log n levels</b>. Do sorted hisson ko jodna ek hi walk hai, do ungliyon se → <b>O(n) per level</b>. Guna karo: O(n log n), <b>worst case mein bhi</b>. Aur yeh <b>stable</b> hai. Keemat: O(n) extra memory.</p>
<p><b>Quicksort</b> average par wahi speed deta hai par <b>O(1) extra space</b> mein, pivot chuno, chhote left, bade right, dono taraf recurse. Par pivot har baar ganda nikla to <b>O(n²)</b>. Isliye asli libraries pivot <b>random</b> chunti hain ya depth zyada hone par heap sort par switch kar deti hain.</p>
<p><b>Library asal mein kya chalati hai?</b> Python aur Java (objects), <b>Timsort</b>: pehle se sorted tukde dhoondh kar unhe merge karta hai, isliye "lagbhag sorted" data par <b>O(n)</b>. C++, <b>introsort</b>: quicksort, aur gehrai badhne par heap sort.</p>
<p><b>Limit se bachne ka ek hi raasta hai, compare karna hi band kar do.</b> Counting sort value ko seedha <b>index</b> ki tarah use karta hai, gin kar wapas likh deta hai → <b>O(n + k)</b>. Faayda tabhi jab values ki range (k) chhoti ho.</p>
<p><b>Stability kyun maayne rakhti hai?</b> Barabar elements ka aapsi order na badle. Isi se <b>do keys par sorting</b> possible hoti hai: pehle chhoti key se sort karo, phir badi se. Chhoti wali order har group ke andar bachi reh jaati hai. C++ ka <code>sort</code> stable <b>nahi</b> hai (<code>stable_sort</code> alag hai), yeh yaad rakhna.</p>
<p><b>Aur aakhri baat:</b> har jagah sort mat kar do. Top-k chahiye? Size-k heap se <b>O(n log k)</b>. Duplicate check karna hai? Hash set se <b>O(n)</b>. Sort tab karo jab tumhe <b>order khud chahiye</b>, ya order milne se two-pointer / binary search khul jaaye.</p>`,

  viz: ["merge-sort"],
  see: [["VA", "https://visualgo.net/en/sorting", "VisuAlgo, every sorting algorithm, animated"]],

  math: [
    { t: "The lower bound, counted rather than asserted", d: "This is the rare complexity claim that is a proof about every possible algorithm, not a statement about the ones we happen to have written.", w:
`n items have n! possible orderings
one comparison has 2 outcomes, so k comparisons can
distinguish at most 2^k arrangements

  2^k >= n!    ->    k >= log2(n!)
Stirling:  log2(n!)  ~  n log2 n - 1.44 n

n = 10^6:  at least 1.85 x 10^7 comparisons
no comparison sort beats that. Ever.` },
    { t: "Merge sort meets the bound, levels times work", d: "Split, recurse, merge. Every level does n units of merging and there are log n levels, which lands within a few percent of the floor.", w:
`T(n) = 2 T(n/2) + n

levels           log2 n
work per level   n           (every element merged once)
total            n log2 n

n = 10^6:  2.0 x 10^7 comparisons
the proven floor was 1.85 x 10^7
merge sort is within 8 % of optimal, always` },
    { t: "Quicksort: the same recurrence with a different pivot", d: "The average and the worst case differ by four orders of magnitude, and which one you get is decided entirely by the pivot rule.", w:
`good pivot:  T(n) = 2T(n/2) + n  ->  n log2 n
worst pivot: T(n) = T(n-1) + n   ->  n^2 / 2

n = 10^6:   2 x 10^7    vs    5 x 10^11

random pivots, expected: 1.39 n log2 n
  about 39 % more comparisons than merge sort, and no
  second array, which is why libraries still ship it

sorted input + first-element pivot = the worst case` },
    { t: "Escaping the bound means not comparing", d: "The proof only binds algorithms whose only move is a comparison. Counting sort looks at the value itself, which is why it is allowed to be linear.", w:
`values in [0, k): count them, then walk the counts
  time O(n + k), space O(k)

n = 10^6 values in [0, 100)    ~ 10^6 steps        fine
n = 10^6 values in [0, 10^9)   10^9 counters       no

radix sort: d passes of counting sort, O(d(n + k))
32-bit integers, 8 bits per pass: d = 4, k = 256` },
    { t: "What your library actually runs", d: "Knowing which sort is under the call decides whether a second sort pass is safe, and whether an adversarial input can hurt you.", w:
`Python  sorted, list.sort   TimSort, stable, n log n worst
Java    objects             TimSort, stable
Java    primitives          dual-pivot quicksort, unstable
C++     std::sort           introsort, unstable
C++     std::stable_sort    merge, stable, extra memory

introsort = quicksort, switching to heapsort past a
depth of 2 log2 n, so the n^2 case cannot happen` },
  ],

  costs: [
    ["comparison-sort lower bound", "Ω(n log n)", "log₂(n!) comparisons are information-theoretically required"],
    ["merge sort", "O(n log n) · O(n) space", "worst case too; stable"],
    ["quicksort", "O(n log n) average · O(n²) worst", "O(log n) stack, O(1) extra; unstable"],
    ["heap sort", "O(n log n) · O(1) space", "worst case too, but unstable and cache-unfriendly"],
    ["Timsort (library)", "O(n log n) · O(n) at worst", "O(n) on nearly-sorted input; stable"],
    ["counting / radix sort", "O(n + k)", "no comparisons, only when the value range k is small"],
    ["insertion sort", "O(n²) · O(1)", "genuinely fastest for tiny or nearly-sorted arrays"],
  ],

  traps: [
    "<b>JavaScript's default sort compares as text.</b> <code>[10, 9].sort()</code> gives <code>[10, 9]</code>. Always pass a comparator for numbers.",
    "<b>Assuming the library sort is stable.</b> C++ <code>sort</code> is not; <code>stable_sort</code> is. Java is stable for objects but not for primitive arrays.",
    "<b>Sorting inside a loop.</b> An O(n log n) call in an O(n) loop is O(n² log n), sort once, before the loop.",
    "<b>A comparator that is not consistent.</b> Returning a boolean, or claiming a &lt; b and b &lt; a, is undefined behaviour and can crash in C++.",
    "<b>Sorting when a heap or a hash set would do.</b> Top-k is O(n log k); duplicate detection is O(n).",
  ],

  impl: [
    ["Python", "list.sort() / sorted(), Timsort", "Stable. key= beats cmp=; sorted() copies, .sort() is in place."],
    ["Java", "Arrays.sort / Collections.sort", "Objects use stable TimSort; primitive arrays use unstable dual-pivot quicksort."],
    ["C++", "std::sort / std::stable_sort", "sort is introsort and NOT stable. The comparator must be a strict weak ordering."],
    ["JavaScript", "Array.prototype.sort", "Sorts as strings without a comparator. Stable since ES2019. Sorts in place."],
  ],

  code: {
    pseudo: `# WHY n log n:  n! orderings, each comparison halves the field
#               => at least log2(n!) ~= n log n comparisons. A floor, not a limit.

# MERGE SORT, log n levels of splitting, O(n) of merging per level
mergeSort(a):
    if length(a) <= 1: return a
    mid   <- length(a) / 2
    left  <- mergeSort(a[0..mid])
    right <- mergeSort(a[mid..end])
    return merge(left, right)

merge(x, y):                       # one walk, two fingers
    out <- empty; i <- 0; j <- 0
    while i < len(x) and j < len(y):
        if x[i] <= y[j]: append x[i]; i <- i + 1     # <= keeps it STABLE
        else:            append y[j]; j <- j + 1
    append the rest of x, then the rest of y
    return out

# QUICKSORT, same bound on average, but in place
partition(a, lo, hi):              # Lomuto: everything <= pivot goes left
    pivot <- a[hi]; i <- lo
    for j from lo to hi-1:
        if a[j] <= pivot: swap(a[i], a[j]); i <- i + 1
    swap(a[i], a[hi])
    return i

# COUNTING SORT, no comparisons, so the n log n floor does not apply
count[v] <- how many times each value v appears     # O(n)
walk v in increasing order, writing v out count[v] times   # O(k)
# total O(n + k): only a win when k is small`,
    py: `# The library first, Timsort, stable, O(n) on nearly-sorted data
nums.sort()                              # in place
out = sorted(nums, reverse=True)         # new list
words.sort(key=len)                      # sort by a computed key
people.sort(key=lambda p: (p.age, p.name))     # multi-key in one pass

# Multi-key using stability: secondary first, then primary
rows.sort(key=lambda r: r.name)          # secondary
rows.sort(key=lambda r: r.score)         # primary, names stay ordered inside

def merge_sort(a):                       # O(n log n) worst case, stable
    if len(a) <= 1: return a
    mid = len(a) // 2
    left, right = merge_sort(a[:mid]), merge_sort(a[mid:])
    out, i, j = [], 0, 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]: out.append(left[i]); i += 1   # <= keeps it stable
        else:                   out.append(right[j]); j += 1
    return out + left[i:] + right[j:]

def counting_sort(a, k):                 # O(n + k), no comparisons at all
    count = [0] * (k + 1)
    for x in a: count[x] += 1
    out = []
    for v, c in enumerate(count): out.extend([v] * c)
    return out`,
    java: `Arrays.sort(nums);                          // primitives: dual-pivot quicksort
Collections.sort(list);                     // objects: stable TimSort
list.sort(Comparator.comparingInt(P::getAge).thenComparing(P::getName));
Arrays.sort(boxed, Comparator.reverseOrder());   // needs Integer[], not int[]

static void mergeSort(int[] a, int lo, int hi, int[] buf) {
    if (hi - lo <= 1) return;
    int mid = lo + (hi - lo) / 2;
    mergeSort(a, lo, mid, buf);
    mergeSort(a, mid, hi, buf);
    int i = lo, j = mid, k = lo;
    while (i < mid && j < hi) buf[k++] = (a[i] <= a[j]) ? a[i++] : a[j++];
    while (i < mid) buf[k++] = a[i++];
    while (j < hi)  buf[k++] = a[j++];
    System.arraycopy(buf, lo, a, lo, hi - lo);
}

static int partition(int[] a, int lo, int hi) {
    int pivot = a[hi], i = lo;
    for (int j = lo; j < hi; j++)
        if (a[j] <= pivot) { int t = a[i]; a[i] = a[j]; a[j] = t; i++; }
    int t = a[i]; a[i] = a[hi]; a[hi] = t;
    return i;
}`,
    cpp: `sort(v.begin(), v.end());                   // introsort. NOT stable
stable_sort(v.begin(), v.end());            // stable, needs extra memory
sort(v.begin(), v.end(), greater<int>());   // descending
sort(p.begin(), p.end(), [](auto& a, auto& b) {
    return a.age != b.age ? a.age < b.age : a.name < b.name;   // strict weak ordering
});
partial_sort(v.begin(), v.begin() + k, v.end());   // only the first k, cheaper
nth_element(v.begin(), v.begin() + k, v.end());    // kth element, O(n) average

void mergeSort(vector<int>& a, int lo, int hi, vector<int>& buf) {
    if (hi - lo <= 1) return;
    int mid = lo + (hi - lo) / 2;
    mergeSort(a, lo, mid, buf); mergeSort(a, mid, hi, buf);
    int i = lo, j = mid, k = lo;
    while (i < mid && j < hi) buf[k++] = (a[i] <= a[j]) ? a[i++] : a[j++];
    while (i < mid) buf[k++] = a[i++];
    while (j < hi)  buf[k++] = a[j++];
    copy(buf.begin() + lo, buf.begin() + hi, a.begin() + lo);
}`,
    js: `// WITHOUT a comparator, sort() compares as strings: [10, 9] stays [10, 9]
nums.sort((a, b) => a - b);              // ascending numbers
nums.sort((a, b) => b - a);              // descending
people.sort((a, b) => a.age - b.age || a.name.localeCompare(b.name));
// sort() mutates in place and returns the same array; copy first if that matters
const sorted = [...nums].sort((a, b) => a - b);

function mergeSort(a) {                  // stable, O(n log n)
  if (a.length <= 1) return a;
  const mid = a.length >> 1;
  const left = mergeSort(a.slice(0, mid)), right = mergeSort(a.slice(mid));
  const out = [];
  let i = 0, j = 0;
  while (i < left.length && j < right.length)
    out.push(left[i] <= right[j] ? left[i++] : right[j++]);   // <= keeps it stable
  return out.concat(left.slice(i), right.slice(j));
}

function countingSort(a, k) {            // O(n + k), no comparisons
  const count = new Array(k + 1).fill(0);
  for (const x of a) count[x]++;
  const out = [];
  count.forEach((c, v) => { for (let i = 0; i < c; i++) out.push(v); });
  return out;
}`,
  },
  codecap: "Know the merge and the partition by heart; in real code, call the library and know which one it runs.",

  q: [
    ["Why can no comparison sort beat O(n log n)?", "There are n! possible orderings and each comparison has two outcomes, so it can only halve the field. Isolating one ordering needs at least log₂(n!) ≈ n log n comparisons."],
    ["Merge sort versus quicksort, the real trade?", "Merge sort is O(n log n) even in the worst case and stable, but needs O(n) extra memory. Quicksort sorts in place with O(1) extra but degrades to O(n²) on bad pivots, so libraries randomise or fall back to heap sort."],
    ["Why is Timsort O(n) on nearly-sorted input?", "It detects runs that are already in order and merges those instead of splitting blindly, so pre-existing order becomes work it does not have to do."],
    ["How does counting sort beat the lower bound?", "It never compares elements. It uses each value as an index into a tally array, so the information-theoretic argument does not apply. O(n + k), useful only when the value range k is small."],
    ["What is stability and when do you actually need it?", "Equal elements keep their original relative order. It is what makes multi-key sorting work: sort by the secondary key, then the primary, and the secondary order survives within each group."],
    ["Name two cases where sorting is the wrong tool.", "Top-k, where a size-k heap gives O(n log k) instead of O(n log n); and duplicate detection, where a hash set gives O(n)."],
  ],

  p: [
    [912, "sort-an-array", "Sort an Array, write merge sort yourself", "M"],
    [88, "merge-sorted-array", "Merge Sorted Array, the merge step alone", "E"],
    [75, "sort-colors", "Sort Colors, counting, then one-pass Dutch flag", "M"],
    [148, "sort-list", "Sort List, merge sort on a linked list", "M"],
    [56, "merge-intervals", "Merge Intervals, sorting unlocks the sweep", "M"],
    [179, "largest-number", "Largest Number, a custom comparator", "M"],
    [215, "kth-largest-element-in-an-array", "Kth Largest, where sorting is the wrong tool", "M"],
  ],
},

/* ==================================================================== */
{
  id: "divide-conquer",
  n: "Divide and conquer",
  group: "Algorithms",
  one: "Split until the pieces are trivial, solve them, then <b>combine</b>. The first two steps are bookkeeping. The combine step is where the algorithm actually is.",

  plain: `<p>Three steps, always the same three. Divide the problem into smaller versions of itself, conquer those by recursion, then combine their answers into the answer you were asked for.</p>
<p>The first two steps are almost never interesting. Splitting an array in half takes no thought. What separates one divide-and-conquer algorithm from another is entirely the third step. And the cost of the whole thing is usually the cost of combining, repeated once per level.</p>
<p>Merge sort splits trivially and does its real work merging. Quicksort is the mirror image: it does the work up front partitioning, and its combine step is literally nothing, because the pieces are already in the right places. Same shape, opposite distribution of effort.</p>
<p>And the reason it pays is that halving gives you only <b>log n</b> levels. Doing O(n) work on each of log n levels is O(n log n), which is a completely different animal from doing O(n) work n times.</p>
<p><b>Analogy.</b> Counting a stadium crowd. You do not count 40,000 people. You split the stands into sections, hand each to somebody, and add up what they report. The addition is the only part you personally do, and it is the only part worth thinking about.</p>`,

  why: [
    { t: "The combine step is the algorithm", d: "Dividing is usually a midpoint calculation and conquering is a recursive call. Neither requires insight. Merge sort's merge. Quickselect's decision about which side to recurse into. The counting of cross-pairs when counting inversions. <b>That</b> is where the thinking lives, and it is usually where the cost lives too." },
    { t: "Cost is levels multiplied by work per level", d: "Draw the recursion tree. Halving gives <b>log n</b> levels. If every level does O(n) total work, you get O(n log n). If the work shrinks geometrically down the levels, the top dominates and the total is just O(n). If it grows, the leaves dominate. You almost never need more machinery than looking at the tree and asking which end is heavier." },
    { t: "The master theorem is that observation, formalised", d: "For <code>T(n) = a·T(n/b) + f(n)</code>, compare the work at the top, <code>f(n)</code>, against the work at the leaves, <code>n^(log_b a)</code>. Whichever is bigger wins; if they match, you pay an extra log factor. Merge sort is a=2, b=2, f(n)=n, the two sides tie, and out comes n log n. Quote it, but read the tree first, because the tree is what you can reconstruct under pressure." },
    { t: "Recursing into one side only changes the class", d: "Binary search splits and then recurses into <b>one</b> half, so the levels do O(1) work each and the total is O(log n). Quickselect does the same trick with partitioning. It only recurses into the side holding the rank it wants, so the work halves each time. The whole thing averages <b>O(n)</b> rather than O(n log n). Sorting to find the kth element is throwing away that saving." },
    { t: "It is not a sorting technique, it is a shape", d: "Counting inversions is merge sort with a counter in the merge. Closest pair of points is a split by x with a clever strip check when combining. Fast exponentiation halves the exponent. Karatsuba multiplication and Strassen's matrix multiplication both beat the obvious algorithm purely by rearranging what gets combined. The shape transfers; the combine step is bespoke each time." },
    { t: "It ends where the subproblems start to overlap", d: "Divide and conquer assumes the pieces are <b>independent</b>. The moment two branches ask the same question, you are recomputing, and the fix is to cache, which makes it dynamic programming. That independence is also why divide and conquer parallelises almost for free while DP largely does not: no branch is waiting on another." },
  ],

  variants: [
    { n: "Binary search", cost: "O(log n)",
      idea: "Divide, then recurse into only one half and combine nothing.",
      when: "The search space is ordered, or a yes/no answer flips exactly once across it.",
      watch: "The one-sided recursion is what makes it logarithmic rather than linear. See the binary search page for the invariant." },

    { n: "Merge sort", cost: "O(n log n), O(n) space",
      idea: "Trivial split, all the work in the merge.",
      when: "You need a guaranteed worst case, stability, or you are sorting a linked list.",
      watch: "The merge is the whole algorithm. Get the stable comparison right and everything downstream behaves." },

    { n: "Quicksort", cost: "O(n log n) average, O(n²) worst",
      idea: "The mirror image: all the work in the partition, nothing at all in the combine.",
      when: "In-memory arrays, where in-place beats the extra buffer.",
      watch: "A bad pivot ruins it. Randomise, or cap the depth and fall back to heap sort." },

    { n: "Quickselect", cost: "O(n) average, O(n²) worst",
      idea: "Partition, then recurse into only the side that contains the rank you want.",
      when: "Kth largest or smallest, or a median, where you do not need the rest sorted.",
      watch: "Beats both sorting and a size-k heap when k is large. C++ hands it to you as nth_element." },

    { n: "Counting inversions", cost: "O(n log n)",
      idea: "Merge sort with a counter: while merging, every time you take from the right half, it forms an inversion with everything remaining on the left.",
      when: "Counting out-of-order pairs, or measuring how far a list is from sorted.",
      watch: "Count during the merge, not after. Doing it afterwards means comparing all pairs again." },

    { n: "Fast exponentiation", cost: "O(log n)",
      idea: "x^n is (x^(n/2))², so halving the exponent turns n multiplications into log n.",
      when: "Large powers, and anything asking for a result modulo a prime.",
      watch: "Handle odd exponents and a negative n. See the number theory page." },
  ],

  hing: `<p><b>Teen kadam, hamesha wahi teen:</b> problem ko chhote tukdon mein <b>baanto</b>, har tukda recursion se <b>hal karo</b>, phir un jawaabon ko <b>jodo</b>.</p>
<p><b>Par asli baat yeh hai:</b> pehle do kadam mein koi dimaag nahi lagta. Array ko aadha karna kya sochne wali cheez hai? <b>Poora algorithm teesre kadam mein hota hai</b>, jodne mein. Aur aksar poori cost bhi wahin hoti hai.</p>
<p><b>Do ulte udaharan yaad rakho:</b> merge sort baantne mein kuch nahi karta, saara kaam <b>merge</b> mein karta hai. Quicksort bilkul ulta hai. Saara kaam <b>partition</b> mein pehle hi ho jaata hai. Uska combine step <b>bilkul khaali</b> hota hai, kyunki tukde pehle se sahi jagah par hain.</p>
<p><b>Cost nikalne ka ek hi tarika:</b> recursion tree banao. Aadha-aadha karne se <b>log n levels</b> bante hain. Har level par O(n) kaam = <b>O(n log n)</b>. Bas dekho ki <b>upar bhaari hai ya neeche</b>, jo bhaari hai wahi answer hai. Master theorem isi observation ka formula hai, magic nahi.</p>
<p><b>Ek taraf recurse karne se class hi badal jaati hai.</b> Binary search aadha karke sirf <b>ek</b> taraf jaata hai, isliye O(log n). Quickselect bhi partition ke baad sirf us taraf jaata hai jahan tumhara kth element hai, isliye average <b>O(n)</b>, poora sort nahi. Kth largest ke liye sort karna is bachat ko phenk dena hai.</p>
<p><b>Yeh sirf sorting ki cheez nahi hai.</b> Inversions ginna = merge sort mein ek counter. Fast exponentiation = exponent aadha karna. Closest pair, Karatsuba, Strassen, sab yahi shakal hain, bas jodne ka tarika alag hai.</p>
<p><b>Aur yeh kahan khatam hota hai?</b> Divide and conquer maanta hai ki tukde <b>ek doosre se alag</b> hain. Jaise hi do branches ek hi sawaal poochne lagein, tum dobara kaam kar rahe ho, aur uska ilaaj cache hai, yaani <b>DP</b>. Isi independence ki wajah se divide and conquer aasaani se parallel chal jaata hai, aur DP nahi.</p>`,

  viz: ["merge-sort"],
  see: [["VA", "https://visualgo.net/en/sorting", "VisuAlgo, merge sort splitting and combining"]],

  math: [
    { t: "Cost is levels multiplied by the work on each level", d: "Every divide and conquer analysis is this one table. Fill in three numbers and the total falls out without any theorem at all.", w:
`T(n) = a T(n/b) + f(n)

depth of the recursion        log_b n
subproblems at level i        a^i
size of each at level i       n / b^i
work done at level i          a^i x f(n / b^i)

merge sort, a = 2, b = 2, f(n) = n:
  level i:  2^i x (n / 2^i)  =  n
  levels:   log2 n
  total:    n log2 n` },
    { t: "The master theorem is that table, formalised", d: "Compare the work at the leaves with the work at the root. Whichever dominates is the answer, and the middle case is when they tie.", w:
`compare f(n) with n^(log_b a):

  f smaller  ->  T = O(n^(log_b a))         leaves win
  f equal    ->  T = O(n^(log_b a) log n)   a tie
  f bigger   ->  T = O(f(n))                the root wins

binary search  a=1 b=2 f=1     n^0 = 1  tie   -> log n
merge sort     a=2 b=2 f=n     n^1 = n  tie   -> n log n
Karatsuba      a=3 b=2 f=n     n^1.585 > n    -> n^1.585
Strassen       a=7 b=2 f=n^2   n^2.807 > n^2  -> n^2.807` },
    { t: "Recursing into one side is a different class, not a saving", d: "Two branches visit everything. One branch throws half away at every level. The gap at n = 10^6 is five orders of magnitude.", w:
`T(n) = 2T(n/2) + 1   ->  2n - 1 calls     visits all
T(n) =  T(n/2) + 1   ->  log2 n calls     binary search

n = 10^6:   2,000,000   vs   20

quickselect: T(n) = T(n/2) + n  ->  2n expected
so the k-th smallest is linear on average, without
sorting the other n - 1 elements first` },
    { t: "Karatsuba, worked, because it shows where the saving comes from", d: "Four multiplications become three by spending an addition. That single removed branch is what moves the exponent off 2.", w:
`x = a.B + b,  y = c.B + d       (each half n/2 digits)

xy = ac.B^2 + (ad + bc).B + bd          4 multiplications
     ad + bc = (a+b)(c+d) - ac - bd     reuses ac and bd
                                        3 multiplications

T(n) = 3 T(n/2) + O(n)  ->  n^log2(3) = n^1.585

n = 1024 digits:
  schoolbook  1.05 x 10^6
  Karatsuba   6.0 x 10^4` },
  ],

  costs: [
    ["general shape", "levels × work per level", "draw the tree and ask which end is heavier"],
    ["halve, O(n) combine", "O(n log n)", "merge sort, counting inversions"],
    ["halve, O(1) combine, one side", "O(log n)", "binary search, fast exponentiation"],
    ["halve, O(n) work, one side", "O(n) average", "quickselect, and why sorting for kth is wasteful"],
    ["master theorem", "T(n) = a·T(n/b) + f(n)", "compare f(n) against n^(log_b a); the bigger one wins"],
    ["space", "O(depth) plus any buffer", "the call stack is O(log n) when the split is balanced"],
  ],

  traps: [
    "<b>Assuming a balanced split.</b> Quicksort's O(n log n) needs the pivot to actually halve. Unbalanced splits give n levels, not log n, and the whole argument collapses.",
    "<b>Recursing into both sides when one would do.</b> That is the difference between quickselect at O(n) and quicksort at O(n log n), and it is one <code>if</code>.",
    "<b>Combining in more than linear time.</b> If your merge is O(n log n), the total becomes O(n log² n). The combine cost is the thing to protect.",
    "<b>Using it where the subproblems overlap.</b> Naive Fibonacci is technically divide and conquer, and it is O(2ⁿ) because the branches ask the same questions. Cache and it becomes DP.",
    "<b>Forgetting the base case is not always size one.</b> Real implementations switch to insertion sort below about sixteen elements, because the constants win there.",
  ],

  impl: [
    ["Python", "recursion, or heapq/bisect for the built-in cases", "Recursion limit around 1000. A depth of log n is never the problem; unbalanced splits are."],
    ["Java", "Arrays.sort, Collections.binarySearch", "Fork/Join exists for genuinely parallel divide and conquer, and is rarely worth it below large n."],
    ["C++", "std::nth_element is quickselect, std::sort is introsort", "nth_element is O(n) average and exactly the right tool for a kth-element question."],
    ["JavaScript", "no built-in select", "Recursion depth caps near 10k. Slicing arrays copies, so pass indices rather than sub-arrays."],
  ],

  code: {
    pseudo: `# Divide, conquer, combine. The third one is the algorithm.
solve(problem):
    if problem is small enough: return the direct answer     # base case
    split problem into parts
    answers <- [ solve(part) for each part ]                 # conquer
    return combine(answers)                                  # the actual work

# COST: draw the tree. levels × work per level.
#   halve + O(n) combine      -> log n levels × O(n)  = O(n log n)
#   halve + O(1), one side    -> log n levels × O(1)  = O(log n)
#   halve + O(n), one side    -> n + n/2 + n/4 + ...  = O(n)

# QUICKSELECT: the kth smallest, without sorting the rest
select(a, lo, hi, k):
    if lo == hi: return a[lo]
    p <- partition(a, lo, hi)          # p lands in its final position
    if k == p:      return a[p]
    if k < p:       return select(a, lo, p - 1, k)   # ONE side only
    else:           return select(a, p + 1, hi, k)

# COUNTING INVERSIONS: merge sort, plus one line
merge(left, right):
    while both non-empty:
        if left[i] <= right[j]: take left[i]
        else:
            take right[j]
            count <- count + (number of items still left in the LEFT half)
            # every one of them is bigger than right[j], so each is an inversion

# FAST EXPONENTIATION: halve the exponent, not the base
power(x, n):
    if n == 0: return 1
    half <- power(x, n / 2)
    return (n is even) ? half * half : half * half * x`,
    py: `def quickselect(a, k):                  # kth smallest, 0-indexed. O(n) average.
    lo, hi = 0, len(a) - 1
    while lo < hi:
        p = partition(a, lo, hi)
        if p == k: return a[p]
        if p < k:  lo = p + 1            # recurse into ONE side only
        else:      hi = p - 1
    return a[lo]

def partition(a, lo, hi):
    import random
    r = random.randint(lo, hi)           # randomise, or meet the O(n^2) case
    a[r], a[hi] = a[hi], a[r]
    pivot, i = a[hi], lo
    for j in range(lo, hi):
        if a[j] <= pivot:
            a[i], a[j] = a[j], a[i]; i += 1
    a[i], a[hi] = a[hi], a[i]
    return i

def count_inversions(a):                 # merge sort with a counter
    def sort(a):
        if len(a) <= 1: return a, 0
        mid = len(a) // 2
        left, x = sort(a[:mid])
        right, y = sort(a[mid:])
        merged, i, j, cross = [], 0, 0, 0
        while i < len(left) and j < len(right):
            if left[i] <= right[j]:
                merged.append(left[i]); i += 1
            else:
                merged.append(right[j]); j += 1
                cross += len(left) - i   # all remaining left items beat this one
        merged += left[i:] + right[j:]
        return merged, x + y + cross
    return sort(a)[1]

def power(x, n):                         # O(log n) multiplications
    if n < 0: x, n = 1 / x, -n
    result = 1
    while n:
        if n & 1: result *= x
        x *= x; n >>= 1
    return result`,
    java: `// kth smallest, O(n) average, no full sort
static int quickselect(int[] a, int k) {
    int lo = 0, hi = a.length - 1;
    while (lo < hi) {
        int p = partition(a, lo, hi);
        if (p == k) return a[p];
        if (p < k) lo = p + 1; else hi = p - 1;    // ONE side
    }
    return a[lo];
}

static int partition(int[] a, int lo, int hi) {
    int r = lo + new Random().nextInt(hi - lo + 1);
    swap(a, r, hi);
    int pivot = a[hi], i = lo;
    for (int j = lo; j < hi; j++) if (a[j] <= pivot) swap(a, i++, j);
    swap(a, i, hi);
    return i;
}

// Fast exponentiation, modular, the version competitive problems want
static long power(long x, long n, long mod) {
    long result = 1; x %= mod;
    while (n > 0) {
        if ((n & 1) == 1) result = result * x % mod;
        x = x * x % mod;
        n >>= 1;
    }
    return result;
}`,
    cpp: `// The standard library already has quickselect. Use it.
nth_element(v.begin(), v.begin() + k, v.end());
int kth = v[k];                       // O(n) average, and v is only partly ordered

partial_sort(v.begin(), v.begin() + k, v.end());   // if you want the k sorted too

// Counting inversions during a merge
long long sortAndCount(vector<int>& a, int lo, int hi, vector<int>& buf) {
    if (hi - lo <= 1) return 0;
    int mid = lo + (hi - lo) / 2;
    long long count = sortAndCount(a, lo, mid, buf) + sortAndCount(a, mid, hi, buf);
    int i = lo, j = mid, k = lo;
    while (i < mid && j < hi) {
        if (a[i] <= a[j]) buf[k++] = a[i++];
        else { count += mid - i; buf[k++] = a[j++]; }   // the one extra line
    }
    while (i < mid) buf[k++] = a[i++];
    while (j < hi)  buf[k++] = a[j++];
    copy(buf.begin() + lo, buf.begin() + hi, a.begin() + lo);
    return count;
}

long long power(long long x, long long n, long long mod) {
    long long r = 1; x %= mod;
    for (; n; n >>= 1, x = x * x % mod) if (n & 1) r = r * x % mod;
    return r;
}`,
    js: `// Pass indices, never slices: slicing copies and turns O(n log n) into O(n^2)
function quickselect(a, k) {
  let lo = 0, hi = a.length - 1;
  while (lo < hi) {
    const p = partition(a, lo, hi);
    if (p === k) return a[p];
    if (p < k) lo = p + 1; else hi = p - 1;      // ONE side
  }
  return a[lo];
}

function partition(a, lo, hi) {
  const r = lo + Math.floor(Math.random() * (hi - lo + 1));
  [a[r], a[hi]] = [a[hi], a[r]];
  const pivot = a[hi];
  let i = lo;
  for (let j = lo; j < hi; j++)
    if (a[j] <= pivot) { [a[i], a[j]] = [a[j], a[i]]; i++; }
  [a[i], a[hi]] = [a[hi], a[i]];
  return i;
}

function power(x, n) {                 // O(log n)
  if (n < 0) { x = 1 / x; n = -n; }
  let result = 1;
  while (n) {
    if (n & 1) result *= x;
    x *= x;
    n >>>= 1;
  }
  return result;
}`,
  },
  codecap: "Recurse into one side when you can, and protect the cost of the combine step. Those two choices decide the complexity class.",

  q: [
    ["Which of the three steps is the algorithm, and why?", "The combine. Splitting is usually a midpoint and conquering is a recursive call, neither of which needs insight. The combine is bespoke to the problem and is normally where the cost lives too."],
    ["How do you get the complexity without the master theorem?", "Draw the recursion tree and multiply levels by the work per level. Halving gives log n levels; if each level does O(n) total work you get O(n log n). Then ask whether the top or the leaves dominate."],
    ["Why is quickselect O(n) when quicksort is O(n log n)?", "It recurses into only the side containing the rank it wants, so the work halves each time: n + n/2 + n/4 and so on sums to 2n. Quicksort must handle both sides."],
    ["How does merge sort count inversions?", "During the merge, whenever an element is taken from the right half, every element still remaining in the left half is greater than it, so add that count. One extra line inside the existing merge."],
    ["When does divide and conquer stop being the right tool?", "When the subproblems overlap. Independent pieces are the assumption; once two branches ask the same question you are recomputing, and caching turns it into dynamic programming."],
    ["Why does divide and conquer parallelise more easily than DP?", "Its subproblems are independent, so branches can run at the same time. DP's subproblems depend on each other by construction, which imposes an order."],
  ],

  p: [
    [215, "kth-largest-element-in-an-array", "Kth Largest, do it with quickselect", "M"],
    [912, "sort-an-array", "Sort an Array, merge sort by hand", "M"],
    [50, "powx-n", "Pow(x, n), halve the exponent", "M"],
    [53, "maximum-subarray", "Maximum Subarray, try the divide and conquer version", "M"],
    [23, "merge-k-sorted-lists", "Merge K Sorted Lists, pair them up instead of one at a time", "H"],
    [493, "reverse-pairs", "Reverse Pairs, counting during the merge", "H"],
    [240, "search-a-2d-matrix-ii", "Search a 2D Matrix II, discard a quadrant at a time", "M"],
  ],
},

/* ==================================================================== */
{
  id: "backtracking",
  n: "Backtracking",
  group: "Algorithms",
  one: "Walk the tree of decisions depth first: <b>choose, recurse, un-choose</b>. The undo is what lets a single path variable stand in for every branch.",

  plain: `<p>Some questions do not want the best answer, they want <i>all</i> the answers: every subset, every permutation, every way to place eight queens. There is no clever formula waiting to be found. You have to look at the candidates, and backtracking is the tidy way to look at all of them exactly once.</p>
<p>The idea is to build an answer one decision at a time. Pick a first element, then a second, and keep going until you either have a complete answer or you hit a rule that says this cannot work. Then step back one decision and try the next option instead.</p>
<p>Stepping back is the whole trick, and it is literal: you <b>put the choice back</b> before trying the next one. One list is reused for the entire search, borrowed on the way down and returned on the way up. If you skip the return, the next branch starts wearing the last branch's clothes.</p>
<p><b>Analogy.</b> A maze with chalk. At each junction you take a corridor and chalk a mark. Dead end? Walk back and <b>rub the mark out</b>, then take the next corridor. The chalk is your path, and rubbing out is the un-choose. Nobody ever solved a maze by leaving every wrong turn marked.</p>`,

  why: [
    { t: "The question asks for all of them",
      d: "\"Find one shortest path\" has room for cleverness. \"List every valid arrangement\" does not: if there are a million answers, you are printing a million answers. So the only sensible goal is to visit each candidate <b>once</b>, and never to visit a candidate that was doomed from the start." },
    { t: "Build the answer one decision at a time",
      d: "Do not think about finished answers, think about <b>partial</b> ones. An empty list, then a list of one, then two. Every partial answer is a node, every choice you could add next is an edge, and the whole search space is a tree you never build in memory. Backtracking is just DFS on that tree, and the <code>recursion</code> concept already covers the DFS half." },
    { t: "Choose, recurse, un-choose, and the undo is not optional",
      d: "Going down the tree means appending your choice to the path. Coming back up means <b>popping it off again</b>. The path is one shared mutable object, so if a branch does not clean up, its sibling starts with leftovers and produces answers that were never valid. Every <code>push</code> needs its <code>pop</code> on <b>every</b> exit route, including the early return." },
    { t: "Record a copy, not the path itself",
      d: "When you reach a complete answer, the obvious line stores the path. The path then keeps mutating for the rest of the search, and since your results list only holds a reference, all of them mutate with it. You end up with N copies of the same empty list, which is at least consistent. Store <code>path[:]</code>, a snapshot." },
    { t: "Duplicates in the input are handled at the level, not at the end",
      d: "Given <code>[1, 2, 2]</code>, two different branches produce the same subset. De-duplicating the results afterwards works and is slow. Instead <b>sort the input</b> so equal values are neighbours, then inside the loop skip a value equal to the previous one <i>at the same level</i>. Equal values stacked on top of each other (ancestor and descendant) are fine, that is how <code>[2, 2]</code> gets built. Only equal <b>siblings</b> are the duplicate." },
    { t: "The cost is the size of the tree, and pruning is the only lever",
      d: "There are 2^n subsets and n! permutations. No implementation trick changes that, because the output is that big. What you <i>can</i> change is how much of the tree is doomed and still explored. Rejecting a choice at depth 3 removes the entire subtree beneath it, so a check that costs O(1) can delete millions of nodes. That is why N-Queens is tractable and brute force is not: same tree, one of them stops early." },
    { t: "If the same state is reachable by many paths, you wanted DP",
      d: "Backtracking assumes each node is a <b>distinct</b> partial answer worth exploring. Sometimes different decision orders land on the same state, and you only want a count or a best value rather than the arrangements themselves. Then you are re-solving identical subproblems, and the answer is memoisation. The tell: your recursion's state is small (an index and a remaining sum) but the tree is exponential." },
  ],

  hing: `<p><b>Sabse pehle:</b> backtracking koi naya algorithm nahi hai, yeh <b>recursion + undo</b> hai. Ek decision tree par DFS, aur woh tree kabhi banate nahi, sirf uspar chalte hain.</p>
<p><b>Skeleton teen line ka hai:</b> <code>choose</code>, <code>recurse</code>, <code>un-choose</code>. Aur teesri line hi asli hai. Path ek hi list hai jo poore search mein share hoti hai. Agar tumne pop nahi kiya, to agli branch pichhli branch ka kachra leke shuru hogi, aur output mein aise answers aayenge jo kabhi valid the hi nahi. Rule: har <code>push</code> ka <code>pop</code>, <b>har</b> exit path par, early return waale par bhi.</p>
<p><b>Doosri classic galti:</b> <code>res.append(path)</code>. Yeh path ka <b>reference</b> store karta hai, aur path aage badalta rehta hai, to saare results ek saath badalte hain. Ant mein tumhare paas N khaali lists hoti hain. Hamesha <b>copy</b> daalo: Python <code>path[:]</code>, Java <code>new ArrayList&lt;&gt;(path)</code>, JS <code>[...path]</code>. C++ mein <code>push_back(path)</code> khud copy kar leta hai, wahan ulta problem hai: galti se poori vector by value pass kar doge.</p>
<p><b>Duplicates ka funda saaf samajh lo.</b> Input mein <code>[1,2,2]</code> hai to do alag branches same subset bana dengi. Pehle <b>sort</b> karo taaki equal values paas-paas aa jaayein, phir loop ke andar: <code>if (j &gt; i && nums[j] == nums[j-1]) continue;</code>. Dhyaan do, yeh sirf <b>same level ke siblings</b> ko skip karta hai. Ek 2 ke upar doosra 2 rakhna bilkul allowed hai, warna <code>[2,2]</code> banega hi nahi. Yeh distinction interview mein poocha jaata hai.</p>
<p><b>Complexity ka jawaab bina jhijhak do:</b> subsets O(2^n), permutations O(n!), aur har answer copy karne ka O(n) alag se. Interviewer "optimise karo" bole to yaad rakho: output hi itna bada hai, isliye asymptotic class nahi badlegi. Sirf ek cheez asli lever hai, <b>pruning</b>. Depth 3 par ek choice reject karna matlab uske neeche ka poora subtree gaya. Isiliye N-Queens chal jaata hai: same tree, bas jaldi ruk jaata hai.</p>
<p><b>Aur last, sabse zyada marks wali baat:</b> maan lo alag-alag decision order se <b>same state</b> par pahunch rahe ho. Aur tumhein arrangements nahi, sirf count ya best value chahiye. To yeh backtracking ka kaam hai hi nahi. Wahan subproblems overlap kar rahe hain, aur jawaab <b>DP</b> hai. Pehchaan simple hai: state chhoti hai (ek index aur ek remaining sum), par tree exponential hai. Yeh line interview mein bol dena, kaafi log yahin fisalte hain.</p>`,

  viz: ["backtracking"],
  see: [["VA", "https://visualgo.net/en/recursion", "VisuAlgo, recursion tree, step it one frame at a time"]],

  math: [
    { t: "The cost is the size of the tree, so count the tree", d: "Backtracking has no clever bound. You are enumerating, and what you can afford is decided before you write a line.", w:
`subsets of n        2^n leaves, 2^(n+1) - 1 nodes
permutations of n   n! leaves, about e x n! nodes
combinations nCk    C(n, k) leaves

n = 20, subsets        1.05 x 10^6     fine
n = 10, permutations   3.6 x 10^6      fine
n = 12, permutations   4.8 x 10^8      slow
n = 15, permutations   1.3 x 10^12     no` },
    { t: "The copy at the leaf, which nobody counts", d: "Recording an answer costs its length. For subsets that multiplies the leaf count by the average depth, and it dominates the recursion itself.", w:
`all subsets of n = 20

recursion nodes        2 x 10^6
leaves                 2^20 = 1.05 x 10^6
average subset length  n / 2 = 10
element writes         1.05 x 10^6 x 10 = 10^7

the output is bigger than the search. It has to be:
the answer itself is that large.` },
    { t: "Pruning is the only lever, and it multiplies", d: "Each constraint does not subtract work, it divides it. N-queens is the clean demonstration.", w:
`8 queens on an 8x8 board

every placement            8^8 = 16,777,216
one per row                8!  =     40,320
plus column and diagonal checks, nodes actually visited
                                ~     2,057
solutions found                        92

three constraints, four orders of magnitude` },
    { t: "Why the undo keeps space at O(depth)", d: "One shared path with a choose and an un-choose costs the depth. A fresh copy per branch costs the whole tree, which is the difference between 20 slots and 20 million.", w:
`one shared path array, choose then un-choose:
  space = depth = n

a fresh copy down every branch:
  space = leaves x depth = 2^n x n

n = 20:  20 slots  vs  2 x 10^7 slots

the un-choose is one line and it is not optional` },
  ],

  costs: [
    ["all subsets of n items", "O(2^n * n)", "2^n nodes, and copying each finished path costs another n"],
    ["all permutations of n items", "O(n! * n)", "n choices, then n-1, then n-2: the factorial is the tree, not the code"],
    ["all combinations C(n, k)", "O(C(n,k) * k)", "the start index in the loop is what stops [1,2] and [2,1] both appearing"],
    ["N-Queens on an n board", "O(n!) worst case, far less in practice", "column and diagonal checks kill a branch at depth 2 instead of depth n"],
    ["one choose plus one un-choose", "O(1)", "push and pop at the end of the list; removing from the front would be O(n)"],
    ["extra space", "O(n) for the path plus O(n) stack", "the output itself is exponential, and is normally excluded by convention"],
  ],

  traps: [
    "<b>Storing the live path.</b> <code>res.append(path)</code> stores a reference that keeps changing under you, so every recorded answer ends up identical. Append <code>path[:]</code>.",
    "<b>An un-choose that some branch skips.</b> A <code>continue</code>, a <code>return</code> or an exception between the push and the pop leaves the path dirty, and the bug shows up in a <i>later</i> answer, which is a wonderful way to lose forty minutes.",
    "<b>Undoing only half the state.</b> If you set a <code>used[j]</code> flag or added to a visited set as well as the path, all of it comes back off. Undo in reverse order and it is hard to forget one.",
    "<b>De-duplicating the results at the end.</b> Sorting the input and skipping equal siblings prunes the branch. Filtering afterwards means you paid for the whole doomed subtree first.",
    "<b>Validating only at the leaf.</b> Checking a full board at depth n, when the conflict existed at depth 2, is the difference between finishing and timing out. Reject at the branch.",
    "<b>Reaching for backtracking when the subproblems overlap.</b> If you want a count or a best value and the same state repeats, that is DP with a memo, and no amount of pruning will rescue the enumeration.",
  ],

  impl: [
    ["Python", "list.append / list.pop, copy with path[:]", "Default recursion limit is about 1000 frames. @lru_cache cannot help here, the path is a mutable argument."],
    ["Java", "ArrayList add / remove(size()-1), copy with new ArrayList<>(path)", "On a List<Integer>, remove(int) deletes by index and remove(Integer) by value. Guess which one you meant."],
    ["C++", "vector push_back / pop_back", "res.push_back(path) already copies. Pass path and res by reference or you copy the whole vector at every node."],
    ["JavaScript", "Array push / pop, copy with [...path]", "V8 caps at roughly 10k frames and throws RangeError. Closures over path avoid threading it through every call."],
  ],

  code: {
    pseudo: `# Backtracking is DFS over a tree of DECISIONS. You never build the tree.
# You walk it, and one shared path variable is your position in it.

backtrack(state):
    if state is a complete answer:
        record a COPY of path        # a copy, or all results alias one list
        return
    for choice in options(state):
        if choice breaks a rule: continue    # PRUNE at the branch, not the leaf
        path.push(choice)            # CHOOSE
        backtrack(advance(state, choice))    # RECURSE into that subtree
        path.pop()                   # UN-CHOOSE, restore for the sibling

# THE UNDO IS NOT OPTIONAL. One list is shared by the whole search: it is
# borrowed on the way down and must be returned on the way up. Every push
# needs its pop on EVERY exit route, including the early return.

# DUPLICATE INPUTS: sort, then skip equal SIBLINGS (never equal ancestors)
sort(nums)
for j from i to n-1:
    if j > i and nums[j] == nums[j-1]: continue   # same value, same level

# COST = the number of nodes in the tree, and no rewrite changes that:
#   subsets      2^n        permutations  n!        plus O(n) per copy
# PRUNING is the only real lever. Rejecting at depth 3 deletes a whole
# subtree, which is why N-Queens finishes and blind brute force does not.

# WRONG TOOL: if different decision orders reach the SAME state and you
# only want a count or a best value, the subproblems overlap. Use DP.`,
    py: `# One template. Change options() and you have changed the problem.

def subsets(nums):
    res, path = [], []
    def dfs(i):
        res.append(path[:])            # COPY: every node is an answer here
        for j in range(i, len(nums)):
            path.append(nums[j])       # choose
            dfs(j + 1)                 # recurse over what is left to the right
            path.pop()                 # un-choose, or the sibling inherits it
    dfs(0)
    return res

def permutations(nums):
    res, path, used = [], [], [False] * len(nums)
    def dfs():
        if len(path) == len(nums):
            res.append(path[:]); return
        for j in range(len(nums)):
            if used[j]: continue       # the only rule, so the only prune
            used[j] = True; path.append(nums[j])
            dfs()
            path.pop(); used[j] = False    # undo BOTH, in reverse order

    dfs()
    return res

def subsets_with_dups(nums):
    nums.sort()                        # equal values must become neighbours
    res, path = [], []
    def dfs(i):
        res.append(path[:])
        for j in range(i, len(nums)):
            if j > i and nums[j] == nums[j - 1]:
                continue               # equal SIBLING, already tried at this level
            path.append(nums[j]); dfs(j + 1); path.pop()
    dfs(0)
    return res

def combination_sum(nums, target):
    nums.sort()                        # sorted so the break below is valid
    res, path = [], []
    def dfs(i, left):
        if left == 0:
            res.append(path[:]); return
        for j in range(i, len(nums)):
            if nums[j] > left: break   # PRUNE: every later value is bigger too
            path.append(nums[j]); dfs(j, left - nums[j]); path.pop()
    dfs(0, target)
    return res`,
    java: `// Same three lines. The copy is new ArrayList<>(path), the undo is remove(last).

void subsets(int i, int[] nums, List<Integer> path, List<List<Integer>> res) {
    res.add(new ArrayList<>(path));                  // COPY, not path
    for (int j = i; j < nums.length; j++) {
        if (j > i && nums[j] == nums[j - 1]) continue;   // dups: sort() first
        path.add(nums[j]);                           // choose
        subsets(j + 1, nums, path, res);
        path.remove(path.size() - 1);                // un-choose
    }
}
// On a List<Integer>, remove(int) deletes by INDEX and remove(Integer) by
// VALUE. The compiler is happy either way and will not mention it again.

void permute(int[] nums, boolean[] used, List<Integer> path,
             List<List<Integer>> res) {
    if (path.size() == nums.length) { res.add(new ArrayList<>(path)); return; }
    for (int j = 0; j < nums.length; j++) {
        if (used[j]) continue;
        used[j] = true; path.add(nums[j]);
        permute(nums, used, path, res);
        path.remove(path.size() - 1); used[j] = false;   // undo both
    }
}`,
    cpp: `void subsets(int i, vector<int>& nums, vector<int>& path,
             vector<vector<int>>& res) {
    res.push_back(path);                             // push_back copies, quietly
    for (int j = i; j < (int)nums.size(); j++) {
        if (j > i && nums[j] == nums[j - 1]) continue;   // sort(nums) first
        path.push_back(nums[j]);                     // choose
        subsets(j + 1, nums, path, res);
        path.pop_back();                             // un-choose
    }
}
// Pass path and res by REFERENCE. By value it compiles, gives the right
// answer, and copies the whole vector at every node in the tree.

// N-Queens: the prune is three O(1) lookups, and it is the entire algorithm
void queens(int r, int n, vector<int>& path, vector<char>& col,
            vector<char>& diag, vector<char>& anti, int& count) {
    if (r == n) { count++; return; }
    for (int c = 0; c < n; c++) {
        if (col[c] || diag[r - c + n] || anti[r + c]) continue;   // reject early
        col[c] = diag[r - c + n] = anti[r + c] = 1; path.push_back(c);
        queens(r + 1, n, path, col, diag, anti, count);
        path.pop_back(); col[c] = diag[r - c + n] = anti[r + c] = 0;
    }
}`,
    js: `function subsets(nums) {
  const res = [], path = [];
  const dfs = (i) => {
    res.push([...path]);               // spread copies; res.push(path) aliases
    for (let j = i; j < nums.length; j++) {
      path.push(nums[j]);              // choose
      dfs(j + 1);
      path.pop();                      // un-choose
    }
  };
  dfs(0);
  return res;
}

// Pruning done properly: reject at the branch, never validate at the leaf
function solveNQueens(n) {
  const res = [], path = [];
  const col = new Set(), diag = new Set(), anti = new Set();
  const dfs = (r) => {
    if (r === n) { res.push([...path]); return; }
    for (let c = 0; c < n; c++) {
      if (col.has(c) || diag.has(r - c) || anti.has(r + c)) continue;
      col.add(c); diag.add(r - c); anti.add(r + c); path.push(c);
      dfs(r + 1);
      path.pop(); anti.delete(r + c); diag.delete(r - c); col.delete(c);
    }
  };
  dfs(0);
  return res;
}
// Note the undo runs in reverse order of the do. Four things went on, four
// come off, and the day you remove only three you will be reading logs.`,
  },
  codecap: "One shared path, one loop over the options, and a pop that always runs. Change options() and you have changed the problem, not the algorithm.",

  q: [
    ["Why must a backtracking function undo its choice?", "Because the path is one mutable object shared by the entire search. Without the pop, the sibling branch starts with the previous branch's choices still on it, and produces answers that were never valid."],
    ["Why does res.append(path) give you a list of identical results?", "It stores a reference, not a snapshot. The path keeps mutating for the rest of the search, so every stored result changes with it. Append a copy, path[:]."],
    ["What is the time complexity of generating all subsets, and can it be improved?", "O(2^n * n): 2^n nodes plus O(n) to copy each answer. It cannot be improved, because the output alone is that big. Only the constant and the pruning are yours to change."],
    ["What is the only thing that actually makes a backtracking search faster?", "Pruning. Rejecting a choice at depth d removes the entire subtree below it, so an O(1) feasibility check can delete millions of nodes. Validating at the leaf instead does all the work first."],
    ["How do you avoid duplicate answers when the input has repeated values?", "Sort the input so equal values are adjacent, then inside the loop skip a value equal to its predecessor at the same level (j > i and nums[j] == nums[j-1]). Equal values stacked as ancestor and descendant are legitimate, only equal siblings duplicate."],
    ["When is backtracking the wrong tool?", "When different decision orders reach the same state and you only want a count or an optimum rather than the arrangements. The subproblems overlap, so it is DP with a memo. The tell is a small state, like an index plus a remaining sum, driving an exponential tree."],
  ],

  p: [
    [78, "subsets", "Subsets, the template itself", "M"],
    [77, "combinations", "Combinations, the start index stops reorderings", "M"],
    [46, "permutations", "Permutations, a used[] flag instead of an index", "M"],
    [39, "combination-sum", "Combination Sum, reuse allowed, and the first real prune", "M"],
    [90, "subsets-ii", "Subsets II, sort then skip equal siblings", "M"],
    [79, "word-search", "Word Search, backtracking on a grid, mark and unmark the cell", "M"],
    [51, "n-queens", "N-Queens, where pruning is the whole algorithm", "H"],
  ],
},

/* ==================================================================== */
{
  id: "dp",
  n: "Dynamic programming",
  group: "Algorithms",
  one: "DP is recursion that stops repeating itself. Name the <b>state</b>, write the recurrence, then either cache the recursion or fill a table in an order where everything you read is already final.",

  plain: `<p>The recursion page ended on a promise: the subproblems overlap, so cache the answers and the exponential tree collapses to a line. This is that page, and the promise is the entire idea.</p>
<p>Dynamic programming is not a new algorithm. It is a bookkeeping repair applied to a recursion that was already correct and merely wasteful. You do not invent a DP solution. You write the honest recursion first, notice it recomputes the same things, and stop it.</p>
<p>Which means the hard part is not the caching. The hard part is deciding <b>what to cache by</b>, and that is the state: the smallest set of facts that fully determines the rest of the answer. Everything after that is mechanical, and everything before it is where people get stuck.</p>
<p>There are two directions to fill the same table. Write the recursion and add a cache (<b>top-down</b>), or work out the order in which values become available and fill them yourself (<b>bottom-up</b>). Same numbers, same table, opposite direction of travel.</p>
<p><b>Analogy.</b> Working through a problem set where question 14 needs the answer to question 9. You can either flip back and redo 9 every time it comes up, or write your answers in the margin as you go. DP is the margin.</p>`,

  why: [
    { t: "The tell is a repeated subproblem, not a hard problem", d: "Draw the call tree for the honest recursion. If the same node appears in two different places, you have <b>overlapping subproblems</b> and DP applies. If every branch reaches a different state, there is nothing to cache and you are looking at backtracking. This one check decides which page you are on, and it takes ten seconds." },
    { t: "The state is the whole difficulty", d: "State is the smallest set of facts that determines everything still to come. \"Which index am I at\" is often enough. Sometimes you need \"which index, and how much capacity is left\", or \"which index, and did I take the previous one\". Choose too little and different situations collide in the same cell, giving confidently wrong answers. Choose too much and the table stops fitting in memory. Everything else on this page is mechanical; this part is the job." },
    { t: "The recurrence is the same honest step as recursion", d: "Express the answer for a state in terms of strictly smaller states, plus the base cases you can answer with no work at all. It is the identical leap of faith from the recursion page: assume the smaller answers are correct, and combine them. If you can say the recurrence in one English sentence, you can write it." },
    { t: "Two directions, one table", d: "<b>Top-down</b> is the recursion with a cache bolted on: easiest to derive, because the recursion tells you the order. <b>Bottom-up</b> fills the table in an order you choose, which is faster (no call overhead, no stack depth limit) and is what makes space reduction possible. Derive top-down, convert to bottom-up when it matters, and say so out loud in an interview." },
    { t: "The cost is states multiplied by transitions", d: "Count the distinct states, multiply by the work at each one. n states with O(1) transitions is O(n). An n by m grid with O(1) transitions is O(nm). n by n states each scanning O(n) options is O(n³). This single formula tells you whether an approach fits the constraints <b>before</b> you write it, which is what the constraints were there to tell you." },
    { t: "Space reduction falls out of reading the recurrence", d: "Look at what a cell actually reads. If <code>dp[i]</code> only ever touches <code>dp[i-1]</code> and <code>dp[i-2]</code>, the rest of the table is dead weight and two variables will do. If a row only reads the row above, keep one row. This is the standard follow-up question and it needs no cleverness, only rereading the line you already wrote." },
    { t: "Know when it is the wrong tool", d: "No overlap means backtracking. A provably safe local choice means greedy, which is cheaper. A state space too large to enumerate means DP is not available at any price, and you are looking for a different formulation. DP sits precisely between brute force and greedy: more expensive than a greedy proof, enormously cheaper than exploring everything twice." },
  ],

  variants: [
    { n: "One dimension over an index", cost: "O(n) states, usually O(1) transitions",
      idea: "State is a single position. <code>dp[i]</code> depends on a fixed number of earlier cells. Climbing stairs, house robber, decode ways, and maximum subarray, which is this case reduced so far that the table becomes one variable. It has its own page.",
      when: "The answer at each position depends only on a bounded window of earlier positions.",
      watch: "Almost always reducible to a couple of variables. If you leave the whole array allocated, expect to be asked why." },

    { n: "One dimension with a scan", cost: "O(n²) time, O(n) space",
      idea: "State is still one index, but computing it scans every earlier index. Longest increasing subsequence is the archetype.",
      when: "The transition genuinely has to consider all previous positions.",
      watch: "LIS has an O(n log n) solution using patience sorting and binary search. Know that it exists, because the O(n squared) version is often not the expected answer." },

    { n: "Grid DP", cost: "O(rows × cols)",
      idea: "State is a cell, and it reads the cells it can be reached from, typically above and left. Unique paths, minimum path sum, longest common subsequence.",
      when: "Two sequences compared position by position, or a literal grid.",
      watch: "The boundary is the base case, and getting the first row and column wrong is the usual bug. Only the previous row is ever read, so O(cols) space." },

    { n: "Knapsack, 0/1", cost: "O(n × capacity)",
      idea: "State is (item index, capacity left) and each item is taken or skipped. Subset sum and partition are the same table with the values discarded.",
      when: "Choose a subset under a numeric budget.",
      watch: "Rolling to one dimension works, but the capacity loop must run <b>backwards</b> or you will reuse an item within the same pass and quietly solve unbounded knapsack instead." },

    { n: "Knapsack, unbounded", cost: "O(n × target)",
      idea: "The same table with items reusable. Coin change, rod cutting.",
      when: "Unlimited copies of each item are allowed.",
      watch: "Loop order decides the meaning: coins outside and target inside counts <b>combinations</b>, the other way round counts <b>permutations</b>. Swapping them silently answers a different question." },

    { n: "Two sequences", cost: "O(n × m)",
      idea: "State is a pair of positions, one in each string. Edit distance, longest common subsequence, regular expression matching.",
      when: "Comparing, aligning or transforming two sequences.",
      watch: "Decide precisely whether an index means \"the first i characters\" or \"the character at i\". Mixing the two is the source of nearly every off-by-one here." },

    { n: "Interval DP", cost: "O(n³) typically",
      idea: "State is a range <code>(l, r)</code>, built from shorter ranges by choosing a split point. Burst balloons, matrix chain multiplication, palindrome partitioning.",
      when: "The answer for a range depends on merging or splitting sub-ranges.",
      watch: "Iterate by increasing <b>length</b>, not by l or r, or you will read cells that have not been filled yet." },

    { n: "Bitmask DP", cost: "O(2ⁿ × n)",
      idea: "State includes a set, encoded as the bits of one integer. Travelling salesman on small inputs, assignment problems.",
      when: "You must remember <i>which</i> items were used, not just how many, and n is around 20 or less.",
      watch: "The constraint gives it away: n ≤ 20 with a subset flavour is practically an instruction. See the bit manipulation page for the mechanics." },
  ],

  hing: `<p><b>Sabse pehle yeh saaf kar lein:</b> DP koi naya algorithm nahi hai. Yeh <b>recursion hi hai, bas repeat karna band kar diya</b>. Recursion wale page par yahi promise tha, aur yeh page wahi promise poora kar raha hai.</p>
<p><b>Pehchaan kaise ho ki DP lagega?</b> Honest recursion likho aur uska call tree banao. Agar <b>ek hi subproblem do jagah</b> dikh raha hai, to overlap hai aur DP lagega. Agar har branch alag state par jaa rahi hai, to cache karne ko kuch hai hi nahi, woh backtracking hai. Yeh check das second ka hai aur poora raasta tay kar deta hai.</p>
<p><b>Ab asli mushkil: STATE.</b> State matlab woh <b>sabse chhoti jaankari</b> jisse aage ka poora answer tay ho jaaye. Kabhi sirf "kaunsa index" kaafi hota hai. Kabhi "index + kitni capacity bachi hai". Kabhi "index + pichhla element liya tha ya nahi".</p>
<p><b>State galat chuna to?</b> Agar bahut kam rakha, to do alag situations ek hi cell mein takra jaayengi aur answer galat aayega, bina kisi error ke. Agar bahut zyada rakha, to table memory mein hi nahi samayegi. <b>Poora DP isi ek decision par tika hai</b>, baaki sab mechanical hai.</p>
<p><b>Do raaste, ek hi table:</b><br>
<b>Top-down (memoisation)</b>: recursion likho, upar se cache laga do. Sabse aasaan, kyunki order recursion khud sambhal leta hai.<br>
<b>Bottom-up (tabulation)</b>: khud tay karo ki kis order mein bharna hai, taaki jo padho woh pehle se ready ho. Tez hai (na function call ka kharcha, na stack limit) aur <b>space optimisation sirf yahin possible</b> hai.<br>
Interview mein: top-down se derive karo, phir bolo "isse bottom-up mein convert kar sakte hain aur space O(1) kar sakte hain".</p>
<p><b>Cost ka formula ek hi hai: states × transitions.</b> n states aur har state par O(1) kaam = O(n). n×m grid = O(nm). n² states jahan har state n options scan kare = O(n³). Yeh <b>likhne se pehle</b> bata deta hai ki solution constraints mein fit hoga ya nahi.</p>
<p><b>Space kam karna:</b> dekho ki ek cell asal mein <b>padhta kya hai</b>. Agar <code>dp[i]</code> sirf <code>dp[i-1]</code> aur <code>dp[i-2]</code> padh raha hai, to poori array bekaar hai, do variables kaafi hain. Agar ek row sirf upar wali row padh rahi hai, to ek row kaafi hai. Yeh follow-up question hamesha aata hai.</p>
<p><b>Aur ek chetavani:</b> 0/1 knapsack ko ek dimension mein rolling karte waqt capacity ka loop <b>ulta (backwards)</b> chalana padta hai. Seedha chalaoge to ek hi item dobara use ho jaayega aur tum chupchaap unbounded knapsack solve kar doge. Answer aayega, galat aayega.</p>`,

  viz: ["dp-fill", "dp-grid"],
  see: [["VA", "https://visualgo.net/en/recursion", "VisuAlgo, the recursion tree that DP collapses"]],

  math: [
    { t: "Why memoising works: count the labels on the tree", d: "The recursion tree is exponential and the set of distinct arguments is tiny. Everything past that set is a repeat, and a repeat can be looked up.", w:
`naive fib(n):  2 fib(n+1) - 1 calls,  growth ~ 1.618^n
distinct subproblems:  n + 1

n = 50:   4.0 x 10^10 calls   vs   51 states

so the tree has 10^10 nodes carrying 51 different labels.
Memoising is not an optimisation of the recursion, it is
the observation that 10^10 - 51 of those calls were
answering a question already answered.` },
    { t: "The cost formula, applied to the standard problems", d: "Two numbers decide everything: how many states there are, and how much work each state does. Every DP complexity below is that product.", w:
`time = states x work per state,  space = states

0/1 knapsack   n x W states     2 transitions  O(nW)
LCS            n x m states     3 transitions  O(nm)
coin change    amount states    C transitions  O(aC)
edit distance  n x m states     3 transitions  O(nm)
TSP bitmask    2^n x n states   n transitions  O(2^n n^2)

n = 20 TSP:  2^20 x 20 x 20 = 4 x 10^8, the ceiling` },
    { t: "Pseudo-polynomial, which is why knapsack is still hard", d: "O(nW) looks polynomial and is not, because W is a value written in binary, not a count of things.", w:
`knapsack, n = 100 items, capacity W = 10^9
table: 100 x 10^9 = 10^11 cells

W appears in the input as log2(W) = 30 bits
so the table is exponential in the LENGTH of the input

that is what pseudo-polynomial means, and it is why
O(nW) does not settle the P versus NP question` },
    { t: "Space reduction is read straight off the recurrence", d: "Look at which cells the formula touches. If it only reaches one row back, the rest of the table is history nobody consults.", w:
`dp[i][j] reads dp[i-1][*]            ->  keep 2 rows
dp[i][j] reads dp[i-1][j], dp[i][j-1] -> 1 row, left to right
dp[i] reads dp[i-1], dp[i-2]          -> 2 variables

LCS of two strings of 10^4:
  full table  10^8 cells x 4 bytes  =  400 MB
  two rows    2 x 10^4 cells        =   80 KB

the value survives, the reconstruction does not` },
    { t: "Top-down or bottom-up, chosen by how much of the table is reachable", d: "Tabulation computes every state. Memoised recursion computes the ones you actually reach, and on a sparse state space that is a real difference.", w:
`coin change, amount = 10^4, coins {7, 11}

reachable amounts: combinations of 7 and 11 only,
far fewer than 10^4
  memoised recursion visits those, plus stack frames
  a full table computes all 10^4 entries regardless

dense and fully reachable -> tabulate: no frames, no
recursion limit, better cache behaviour` },
  ],

  costs: [
    ["general rule", "states × transitions", "count the distinct states, multiply by the work at each"],
    ["1-D over an index", "O(n)", "climbing stairs, house robber, maximum subarray"],
    ["1-D with a scan", "O(n²)", "longest increasing subsequence, the O(n squared) version"],
    ["grid or two sequences", "O(n × m)", "unique paths, edit distance, LCS"],
    ["knapsack", "O(n × capacity)", "pseudo-polynomial: it scales with the NUMBER, not its digit count"],
    ["interval DP", "O(n³)", "n² ranges, each trying O(n) split points"],
    ["bitmask DP", "O(2ⁿ × n)", "practical to about n = 20, which the constraints will tell you"],
    ["memoised recursion space", "O(states + depth)", "the table plus the call stack, which people forget to count"],
  ],

  traps: [
    "<b>Reaching for a table before writing the recursion.</b> Derive the recurrence honestly first. Nobody has ever guessed a correct table.",
    "<b>A state that is missing a fact.</b> Two different situations map to one cell and the answer is wrong with no error anywhere. If your DP is mysteriously off, suspect the state before you suspect the arithmetic.",
    "<b>Rolling 0/1 knapsack to one dimension with the capacity loop going forwards.</b> You reuse an item inside the same pass and solve a different problem.",
    "<b>Interval DP iterated by l and r instead of by length.</b> You read cells that have not been filled, and they contain whatever your language uses for empty.",
    "<b>Forgetting the call stack in a memoised solution.</b> Depth can reach 10⁵ and overflow, even though the table itself is small.",
    "<b>Caching on a mutable key.</b> Memoising a function whose argument is a list means the key changes underneath the cache. Convert to a tuple, or index by position.",
  ],

  impl: [
    ["Python", "@lru_cache / @cache, or a dict", "Arguments must be hashable, so pass tuples, not lists. Watch the recursion limit on deep states."],
    ["Java", "int[] / int[][] filled with -1, or a HashMap", "Arrays.fill for the sentinel. Boxing in a HashMap is slow enough to matter on tight limits."],
    ["C++", "vector filled with -1, or unordered_map", "vector<vector<int>> dp(n, vector<int>(m, -1)). Pick a sentinel the answer can never legitimately be."],
    ["JavaScript", "Array.fill(-1) or a Map", "Object and array keys compare by reference, so build a string key or index numerically."],
  ],

  code: {
    pseudo: `# STEP 1  Write the honest recursion. Do not think about tables yet.
# STEP 2  Draw the call tree. Does the same state appear twice? Then cache it.
# STEP 3  Convert to bottom-up only if you need the speed or the space.

# --- TOP-DOWN: the recursion, plus a cache. Easiest to derive. ---
memo <- empty map
solve(state):
    if state is a base case: return the base answer
    if state in memo: return memo[state]
    best <- combine(solve(smaller state), solve(other smaller state), ...)
    memo[state] <- best
    return best

# --- BOTTOM-UP: the same table, filled in dependency order. ---
dp <- table sized by the state space
fill in the base cases
for each state in an order where its dependencies are already final:
    dp[state] <- combine(dp[smaller], dp[other smaller], ...)
return dp[the state you were asked about]

# --- THE FOUR QUESTIONS, in order. Answer them and the code writes itself. ---
# 1. What is the STATE?          the smallest facts that determine the rest
# 2. What is the RECURRENCE?     this state in terms of smaller ones
# 3. What are the BASE CASES?    the states answerable with no work
# 4. In what ORDER?              so that every read is already final

# --- SPACE: look at what a cell actually reads ---
# dp[i] reads only dp[i-1] and dp[i-2]   ->  keep two variables
# row r reads only row r-1               ->  keep one row`,
    py: `from functools import lru_cache

# TOP-DOWN. Write the recursion, add one decorator, walk away.
@lru_cache(None)
def climb(n):                       # ways to climb n stairs, 1 or 2 at a time
    if n <= 2: return max(n, 1)     # base cases
    return climb(n - 1) + climb(n - 2)

# BOTTOM-UP. Same numbers, filled in an order you control.
def climb_table(n):
    dp = [0] * (n + 1)
    dp[0] = dp[1] = 1
    for i in range(2, n + 1):
        dp[i] = dp[i - 1] + dp[i - 2]
    return dp[n]

# SPACE REDUCED. dp[i] read only the last two cells, so keep only those.
def climb_o1(n):
    a, b = 1, 1
    for _ in range(n - 1):
        a, b = b, a + b
    return b

# GRID: each cell reads above and left, so one row of memory is enough
def unique_paths(rows, cols):
    row = [1] * cols
    for _ in range(1, rows):
        for c in range(1, cols):
            row[c] += row[c - 1]        # row[c] is "above", row[c-1] is "left"
    return row[-1]

# 0/1 KNAPSACK, rolled to one dimension. The BACKWARDS loop is not optional:
# forwards would let the same item be picked twice in a single pass.
def knapsack(weights, values, cap):
    dp = [0] * (cap + 1)
    for w, v in zip(weights, values):
        for c in range(cap, w - 1, -1):         # backwards
            dp[c] = max(dp[c], dp[c - w] + v)
    return dp[cap]`,
    java: `// TOP-DOWN with an explicit memo array, sentinel -1 for "not computed"
static int[] memo;
static int climb(int n) {
    if (n <= 2) return Math.max(n, 1);
    if (memo[n] != -1) return memo[n];
    return memo[n] = climb(n - 1) + climb(n - 2);
}
// memo = new int[n + 1]; Arrays.fill(memo, -1);

// BOTTOM-UP
static int climbTable(int n) {
    int[] dp = new int[n + 1];
    dp[0] = dp[1] = 1;
    for (int i = 2; i <= n; i++) dp[i] = dp[i - 1] + dp[i - 2];
    return dp[n];
}

// SPACE REDUCED
static int climbO1(int n) {
    int a = 1, b = 1;
    for (int i = 1; i < n; i++) { int t = a + b; a = b; b = t; }
    return b;
}

// TWO SEQUENCES: edit distance, the classic O(n x m) table
static int editDistance(String s, String t) {
    int n = s.length(), m = t.length();
    int[][] dp = new int[n + 1][m + 1];
    for (int i = 0; i <= n; i++) dp[i][0] = i;      // boundary is the base case
    for (int j = 0; j <= m; j++) dp[0][j] = j;
    for (int i = 1; i <= n; i++)
        for (int j = 1; j <= m; j++)
            dp[i][j] = s.charAt(i - 1) == t.charAt(j - 1)
                ? dp[i - 1][j - 1]
                : 1 + Math.min(dp[i - 1][j - 1], Math.min(dp[i - 1][j], dp[i][j - 1]));
    return dp[n][m];
}`,
    cpp: `// TOP-DOWN, sentinel -1 for "not computed yet"
vector<int> memo;
int climb(int n) {
    if (n <= 2) return max(n, 1);
    if (memo[n] != -1) return memo[n];
    return memo[n] = climb(n - 1) + climb(n - 2);
}
// memo.assign(n + 1, -1);

// BOTTOM-UP, space reduced in one step
int climbO1(int n) {
    int a = 1, b = 1;
    for (int i = 1; i < n; ++i) { int t = a + b; a = b; b = t; }
    return b;
}

// GRID, one row of memory
int uniquePaths(int rows, int cols) {
    vector<int> row(cols, 1);
    for (int r = 1; r < rows; ++r)
        for (int c = 1; c < cols; ++c)
            row[c] += row[c - 1];
    return row.back();
}

// 0/1 KNAPSACK rolled to 1-D. Backwards, or you reuse the item.
int knapsack(vector<int>& w, vector<int>& v, int cap) {
    vector<int> dp(cap + 1, 0);
    for (size_t i = 0; i < w.size(); ++i)
        for (int c = cap; c >= w[i]; --c)               // backwards
            dp[c] = max(dp[c], dp[c - w[i]] + v[i]);
    return dp[cap];
}`,
    js: `// TOP-DOWN with a Map. Object keys compare by reference, so build a key.
const memo = new Map();
function climb(n) {
  if (n <= 2) return Math.max(n, 1);
  if (memo.has(n)) return memo.get(n);
  const r = climb(n - 1) + climb(n - 2);
  memo.set(n, r);
  return r;
}

// BOTTOM-UP
function climbTable(n) {
  const dp = new Array(n + 1).fill(0);
  dp[0] = dp[1] = 1;
  for (let i = 2; i <= n; i++) dp[i] = dp[i - 1] + dp[i - 2];
  return dp[n];
}

// SPACE REDUCED
function climbO1(n) {
  let a = 1, b = 1;
  for (let i = 1; i < n; i++) [a, b] = [b, a + b];
  return b;
}

// A 2-D state needs a real 2-D table, not Array(n).fill(Array(m))
const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));

// 0/1 knapsack rolled to 1-D, capacity loop backwards
function knapsack(weights, values, cap) {
  const dp = new Array(cap + 1).fill(0);
  for (let i = 0; i < weights.length; i++)
    for (let c = cap; c >= weights[i]; c--)
      dp[c] = Math.max(dp[c], dp[c - weights[i]] + values[i]);
  return dp[cap];
}`,
  },
  codecap: "Recursion first, cache second, table third, space last. Skipping to the table is how people get stuck.",

  q: [
    ["How do you tell in ten seconds whether a problem is DP?", "Sketch the honest recursion's call tree. If the same subproblem appears in more than one place, the subproblems overlap and DP applies. If every branch reaches a distinct state, there is nothing to cache and it is backtracking."],
    ["What is the state, and why is it the hard part?", "The smallest set of facts that fully determines the rest of the answer. Too little and different situations collide in one cell, producing wrong answers with no error. Too much and the table does not fit. The recurrence and the code follow mechanically once the state is right."],
    ["Top-down or bottom-up?", "Top-down is the recursion plus a cache and is easiest to derive because the recursion supplies the order. Bottom-up is faster, has no stack limit, and is what makes space reduction possible. Derive top-down, convert when it matters."],
    ["How do you predict the cost before writing anything?", "States multiplied by transitions. n states with O(1) transitions is O(n); an n by m table is O(nm); n squared states each scanning n options is O(n cubed). Compare that to the constraints before committing."],
    ["Why must the capacity loop run backwards in a one-dimensional 0/1 knapsack?", "Going forwards, dp[c - w] has already been updated in this same pass, so the item gets used more than once and you have silently solved unbounded knapsack instead."],
    ["When is DP the wrong tool?", "When subproblems do not overlap, which is backtracking; when a local choice is provably safe, which is greedy and cheaper; or when the state space is too large to enumerate, in which case you need a different formulation entirely."],
  ],

  p: [
    [70, "climbing-stairs", "Climbing Stairs, the smallest complete example", "E"],
    [198, "house-robber", "House Robber, a state with a real decision in it", "M"],
    [322, "coin-change", "Coin Change, unbounded knapsack in disguise", "M"],
    [1143, "longest-common-subsequence", "LCS, the two-sequence table", "M"],
    [416, "partition-equal-subset-sum", "Partition Equal Subset Sum, 0/1 knapsack", "M"],
    [300, "longest-increasing-subsequence", "LIS, then find the O(n log n) version", "M"],
    [72, "edit-distance", "Edit Distance, the interview favourite", "M"],
  ],
},

/* ==================================================================== */
{
  id: "greedy",
  n: "Greedy algorithms",
  group: "Algorithms",
  one: "Take the best-looking option now and never reconsider it. The code is five lines; the difficulty is entirely in <b>proving the local choice is safe</b>.",

  plain: `<p>A greedy algorithm makes the choice that looks best right now, commits to it, and moves on. No memo table, no recursion, no going back. Most of them sort the input by some key and then walk it once. That is why greedy solutions are short enough to write on a whiteboard in under a minute.</p>
<p>That shortness is a trap. Writing a greedy algorithm is easy, and writing a <i>wrong</i> greedy algorithm is exactly as easy, because nothing about the code tells you which one you have. It runs, it produces an answer, it passes the examples in the problem statement. The honest position is that <b>most greedy ideas you have are simply wrong</b>. The work is finding out which kind you are holding, before you commit to it.</p>
<p>So the real skill here is not the loop. It is the argument: why does taking this item first never cost you the optimum? There is a standard shape for that argument. If you cannot make it, you do not have a greedy problem. You have an enumeration problem wearing a disguise.</p>
<p><b>Analogy.</b> Climbing a hill in thick fog by always stepping in whatever direction goes up. You will certainly reach a summit. Whether it is the tallest summit depends entirely on the shape of the landscape, and from inside the fog you cannot tell the difference.</p>`,

  why: [
    { t: "Start from the cost of doing it properly",
      d: "For most optimisation problems the honest method is to try the possibilities: n! orderings, 2^n subsets, or a DP table over every state. That is correct and slow. So the question worth asking is whether there is a rule that lets you decide one piece of the answer <b>immediately</b>, with no lookahead, and be right." },
    { t: "The greedy hypothesis, and why it is so cheap",
      d: "Suppose such a rule exists. Then the algorithm writes itself: order the items by the rule, walk them once, take each one that is still compatible with what you have. That is a sort plus a sweep, <b>O(n log n)</b>, O(1) extra space. Compare that with an O(n * target) DP table and the appeal is obvious." },
    { t: "Cheap is not the same as correct",
      d: "Coins <code>{1, 3, 4}</code>, target 6. Take the biggest that fits: 4, then 1, then 1, three coins. The optimum is <code>3 + 3</code>, two coins. Nothing in the code misbehaved. The rule was just false, and the program has no way to notice, because a greedy algorithm never looks at the answer it did not take." },
    { t: "The reason this particular trap is dangerous",
      d: "Run the same greedy on <code>{1, 5, 10, 25}</code> and it is <b>correct</b>, for every target, provably. Real currencies are designed so that it is. So your intuition, built from handling actual money, agrees with the algorithm, and your test cases will too. The counterexample lives in coin systems you have never used, which is a much worse place for it to live than in your test file." },
    { t: "The two properties a problem must have",
      d: "First, the <b>greedy choice property</b>: the choice your rule makes first appears in <i>some</i> optimal solution. Not in every one, just one, which is enough. Second, <b>optimal substructure</b>: once you commit to that choice, what remains is the same problem on a smaller input, so you can repeat the argument. With both, induction finishes it: the first choice is safe, and the rest is the same problem." },
    { t: "The exchange argument is how you prove the first one",
      d: "Take <b>any</b> optimal solution OPT and let g be the item your rule picks first. If OPT already contains g, there is nothing to prove. Otherwise, swap g into OPT in place of whatever OPT took instead, and show two things: the result is still valid, and it is <b>no worse</b>. Then an optimal solution containing g exists. Note the shape: you never argue that greedy beats OPT, only that it ties it. Ties are all you need." },
    { t: "When the exchange fails, you enumerate, and that is DP or backtracking",
      d: "If swapping your choice in can make a solution worse, the choice is not safe, and you cannot commit without looking ahead. Looking ahead means trying both branches. If the same state is reached many ways and you want a count or a best value, that is DP with a memo. If you want the arrangements themselves, that is the <code>backtracking</code> page. Greedy is not a weaker DP, it is a claim you failed to prove." },
  ],

  variants: [
    { n: "Activity selection", cost: "O(n log n), sort by finish time",
      idea: "Among overlapping activities, always keep the one that <b>finishes earliest</b>, then take the next one that starts after it.",
      when: "Maximise the count of non-overlapping intervals: meeting rooms, non-overlapping intervals, bursting balloons with arrows.",
      watch: "The exchange argument: replace OPT's first activity with the earliest-finishing one. It frees the room no later, so nothing that fitted before stops fitting. Sort by <b>start</b> or by <b>duration</b> instead and both are wrong, with easy counterexamples." },

    { n: "Fractional knapsack", cost: "O(n log n), sort by value per unit weight",
      idea: "Take items in decreasing value/weight order, and cut the last one to fit exactly.",
      when: "The items are divisible: fuel, ore, time, anything continuous.",
      watch: "The exchange: if OPT carries a unit of a worse ratio while a better one is left behind, swap that unit and the value does not fall. This breaks completely for <b>0/1 knapsack</b>, where you cannot cut an item, and that problem is DP. The two are one word apart and nothing alike." },

    { n: "Huffman coding", cost: "O(n log n) with a heap",
      idea: "Repeatedly merge the <b>two least frequent</b> symbols into one node. The tree you build is an optimal prefix code.",
      when: "Building a minimum weighted-depth tree: compression, and the merge-cost family of problems.",
      watch: "The exchange: in any optimal tree, the two deepest siblings can be swapped for the two rarest symbols without increasing the total cost, because rare symbols pay less for depth. The greedy step here changes the input as it goes, so it needs a heap rather than one sort." },

    { n: "Scheduling to minimise lateness", cost: "O(n log n), sort by deadline",
      idea: "Run jobs in <b>earliest deadline first</b> order, back to back, ignoring how long each one takes.",
      when: "One machine, every job must run, and you are minimising the worst lateness.",
      watch: "The exchange is an <b>inversion</b> argument: any schedule with an adjacent pair out of deadline order can have that pair swapped without increasing the maximum lateness, and repeated swaps turn any optimum into the greedy order. Change the objective to total completion time and the correct key changes to shortest job first." },

    { n: "Interval covering and jump games", cost: "O(n), one sweep",
      idea: "Track the <b>furthest point reachable</b> so far, and only commit to a jump when you are forced to, at the edge of the current reach.",
      when: "Minimum jumps, minimum intervals to cover a range, gas station style circuits.",
      watch: "The exchange: any solution's k-th choice can be replaced by the one reaching furthest, and every later choice still has at least as much room. The bug people write is committing at every index instead of at the boundary of the current reach, which counts jumps that were never made." },

    { n: "Dijkstra and Prim, greedy in disguise",
      cost: "O(E log V) with a heap",
      idea: "Repeatedly settle the closest unsettled node (Dijkstra) or add the cheapest edge leaving the built tree (Prim).",
      when: "Shortest paths and minimum spanning trees, covered properly on their own pages.",
      watch: "Both rest on a genuine exchange argument (the cut property for Prim), and both have a stated precondition. Dijkstra needs <b>non-negative weights</b>: with a negative edge the closest node is no longer safe to settle, the greedy choice property fails, and the algorithm returns a confident wrong answer." },
  ],

  hing: `<p><b>Ek line mein:</b> greedy matlab abhi jo best dikh raha hai woh utha lo, aur peeche mud kar mat dekho. Likhna aasaan hai, itna aasaan ki <b>galat</b> greedy bhi utni hi aasaani se likh jaati hai. Interview mein marks code par nahi, us <b>proof</b> par milte hain jo bataata hai ki local choice safe kyun hai.</p>
<p><b>Pehle counterexample dhoondo, phir code likho.</b> Coins <code>{1, 3, 4}</code>, target 6. Bada coin pehle: 4, phir 1, phir 1, matlab teen coins. Sahi jawaab hai <code>3 + 3</code>, do coins. Code mein koi bug nahi tha, rule hi jhootha tha. Aur greedy algorithm ko kabhi pata nahi chalega, kyunki woh us raaste ko dekhta hi nahi jo usne nahi liya.</p>
<p><b>Ab asli khatra samjho.</b> Wahi greedy <code>{1, 5, 10, 25}</code> par bilkul <b>sahi</b> hai, har target ke liye. Asli currency isi tarah design ki jaati hai. Iska matlab tumhara dimaag, jo asli paise handle kar ke bana hai, algorithm se sehmat hoga, aur tumhare test cases bhi pass ho jaayenge. Galti tab dikhegi jab coin system ajeeb ho. Isiliye "maine do example par check kar liya" koi proof nahi hai.</p>
<p><b>Do property yaad rakho.</b> Ek, <b>greedy choice property</b>: tumhara rule jo pehli choice karta hai, woh <i>kisi ek</i> optimal solution mein maujood hai. Sabhi mein nahi, ek mein kaafi hai. Do, <b>optimal substructure</b>: us choice ko commit karne ke baad jo bacha, woh wahi problem hai chhote input par. Dono mil gaye to induction se poora proof ban jaata hai.</p>
<p><b>Exchange argument, yeh sabse zaroori move hai.</b> Koi bhi optimal solution OPT lo. Tumhari pehli choice g hai. Agar g already OPT mein hai, baat khatam. Warna OPT mein jo choice thi uski jagah g <b>swap</b> kar do, aur do cheezein dikhao: solution abhi bhi valid hai, aur <b>kharab nahi hua</b>. Bas. Dhyaan do, tumhein yeh sabit nahi karna ki greedy OPT se behtar hai, sirf yeh ki barabar hai. Barabari hi kaafi hai.</p>
<p><b>Practical shakal:</b> zyadatar greedy solutions asal mein "<b>sahi key se sort karo, phir ek sweep</b>" hote hain. Aur asli algorithm wahi key hai. Activity selection mein <b>finish time</b> se sort karna sahi hai, start time ya duration se galat. Sort key chunna hi problem solve karna hai; baaki loop to formality hai.</p>
<p><b>Aur agar exchange argument ban hi nahi raha?</b> Matlab commit karna safe nahi hai, matlab aage dekhna padega, matlab dono branch try karni padengi. Wahan se ya to <b>DP</b> (same state baar baar aata hai, aur tumhein count ya best value chahiye) ya <b>backtracking</b> (tumhein arrangements khud chahiye). Greedy DP ka chhota bhai nahi hai, greedy ek <b>daava</b> hai jo tumne sabit nahi kiya.</p>`,

  viz: ["greedy"],

  math: [
    { t: "What greedy is being compared against", d: "The gap is the temptation. Five lines that run in n log n against a table or an exponential search is why greedy gets guessed far more often than it gets proved.", w:
`n items

every subset          2^n
DP over states        n x W
greedy: sort + scan   n log2 n + n

n = 40:  1.1 x 10^12   |   n x W   |   40 x 6 = 240

three lines of code, and the only hard part is knowing
whether the answer is right` },
    { t: "The counterexample is usually one line away", d: "Greedy being correct is a property of the specific problem, never of the technique. Coins are the fastest way to see that.", w:
`coins {1, 3, 4}, target 6

greedy takes the largest first:  4 + 1 + 1  =  3 coins
optimal:                         3 + 3      =  2 coins

with {1, 5, 10, 25} greedy IS optimal
so the coin system decides it, not the algorithm

"it passed my examples" is not evidence of anything` },
    { t: "The two properties a problem must have", d: "Both are needed. With only the second you have a DP. With neither you have a search, and no amount of sorting will fix it.", w:
`greedy choice property
  some optimal solution contains the greedy first pick
optimal substructure
  after fixing that pick, what remains is the same problem

both      -> greedy, and it can be proved
second    -> dynamic programming
neither   -> backtracking with pruning` },
    { t: "The exchange argument, in the shape you actually write", d: "This is the proof for interval scheduling and it is the template for all of them: take any optimal answer, swap your choice in, show nothing got worse.", w:
`pick the interval with the earliest finishing time

let G be greedy's pick, O any optimal solution,
X the first interval in O.  finish(G) <= finish(X),
because G had the earliest finish of all candidates.

swap X for G in O: everything else in O starts after
finish(X) >= finish(G), so nothing now conflicts.
|O| is unchanged, so it is still optimal.

an optimal solution containing G exists. Induct on the rest.` },
    { t: "Interval scheduling, priced", d: "The sort is the algorithm and the scan is bookkeeping, which is the usual shape once a greedy rule has been proved safe.", w:
`n = 10^5 intervals

check every subset      2^n x n          impossible
sort by finish, scan    n log2 n + n
                        1.7 x 10^6 + 10^5

sorting by START instead answers a different question:
[1,10], [2,3], [4,5] gives 1 interval, not 2` },
  ],

  costs: [
    ["sort by the chosen key", "O(n log n)", "the sort is the algorithm's real cost; the decision loop is trivial"],
    ["the sweep itself", "O(n)", "each item is looked at once and decided once, with no lookahead"],
    ["greedy driven by a heap", "O(n log n)", "for rules where the best next choice changes as you go, as in Huffman"],
    ["input already ordered", "O(n)", "no table, no recursion stack, nothing kept to reconsider later"],
    ["extra space", "O(1) beyond the sort", "keeping nothing is the speed and also exactly the risk"],
    ["the DP you fall back to", "often O(n * target)", "the price of a local choice you could not justify"],
    ["proving it correct", "not a runtime cost", "and the only part of this an interviewer is actually testing"],
  ],

  traps: [
    "<b>Treating three passing examples as a proof.</b> A wrong greedy passes small hand-made cases routinely, because you built those cases from the same intuition that produced the rule.",
    "<b>Sorting by the wrong key.</b> For non-overlapping intervals, sorting by start time or by duration both look reasonable and both are wrong. Finish time is the one with an exchange argument behind it.",
    "<b>Carrying fractional knapsack over to 0/1 knapsack.</b> Value per weight is optimal only when you may cut an item. When you cannot, it is DP, and the greedy answer can be arbitrarily bad.",
    "<b>Comparing ratios with floating point.</b> Sorting by <code>v / w</code> loses ties and precision. Compare <code>a.v * b.w</code> against <code>b.v * a.w</code> in integers instead.",
    "<b>Deciding at every step when the rule only fires at a boundary.</b> In jump-game style problems you commit at the edge of the current reach, not at each index, or you count jumps nobody made.",
    "<b>Assuming a greedy stays correct after the objective changes.</b> Earliest deadline first minimises maximum lateness; shortest job first minimises total completion time. Same jobs, same machine, different key.",
  ],

  impl: [
    ["Python", "sorted(key=...), heapq for rolling choices", "heapq is min-heap only: push negatives, or tuples, to get a max-heap."],
    ["Java", "Arrays.sort(comparator), PriorityQueue", "Never write (a, b) -> a - b for ints; it overflows. Use Integer.compare."],
    ["C++", "std::sort, std::priority_queue", "priority_queue is a MAX-heap by default, the opposite of most languages."],
    ["JavaScript", "Array.sort(comparator)", "No built-in heap. sort() without a comparator compares as text and sorts in place."],
  ],

  code: {
    pseudo: `# GREEDY: take the locally best option now, and never reconsider it.
# The loop takes five minutes to write. Justifying it is the whole job.

greedy(items):
    sort(items, by THE RIGHT KEY)     # choosing this key IS the algorithm
    result <- empty
    for item in items:                # one sweep, nothing is revisited
        if item is compatible with result:
            result.add(item)          # commit, permanently
    return result

# TWO PROPERTIES the problem must have, or the loop above is just wrong:
#  1. GREEDY CHOICE PROPERTY: the choice your rule makes first appears in
#     SOME optimal solution. Not in every one. One is enough.
#  2. OPTIMAL SUBSTRUCTURE: after committing to it, what is left is the
#     same problem on a smaller input, so the argument repeats.

# EXCHANGE ARGUMENT, the standard way to prove property 1:
#     let OPT be ANY optimal solution
#     let g be the first choice your rule makes
#     if g is in OPT: done
#     else: swap g into OPT in place of what OPT chose there, and show
#           (a) the result is still valid
#           (b) the result is NO WORSE
#     => an optimal solution containing g exists. Induct on the rest.
# You never prove greedy BEATS OPT. Tying with OPT is all you need.

# COUNTEREXAMPLE FIRST, ALWAYS.  coins = {1, 3, 4}, target = 6
#     greedy:  4, then 1, then 1   -> 3 coins
#     optimal: 3 + 3               -> 2 coins
# The same greedy is CORRECT for {1, 5, 10, 25}. Real currency is built
# so that it is, which is why testing on money you have actually held
# proves nothing, and why this trap catches people who are not careless.

# NO EXCHANGE ARGUMENT? Then you cannot commit without looking ahead,
# and looking ahead means trying both branches:
#     want a count or an optimum, states repeat  -> DP with a memo
#     want the arrangements themselves           -> backtracking`,

    py: `# ACTIVITY SELECTION. Sort by FINISH time, then sweep.
# Exchange: the activity that frees the room soonest can replace whatever
# an optimal schedule took first, and it never blocks anything extra.
def max_non_overlapping(intervals):
    intervals.sort(key=lambda iv: iv[1])   # finish, not start, not duration
    kept, end = 0, float("-inf")
    for s, e in intervals:
        if s >= end:                       # compatible with all we kept
            kept += 1
            end = e                        # commit, and never look back
    return kept

# JUMP GAME. The choice is made at the boundary of the current reach.
def can_jump(nums):
    reach = 0
    for i, step in enumerate(nums):
        if i > reach:                      # a gap no earlier jump can cross
            return False
        reach = max(reach, i + step)
    return True

# WHERE THE SAME GREEDY LIES. One function, two coin systems.
def coin_change_greedy(coins, target):
    used = 0
    for c in sorted(coins, reverse=True):
        used += target // c
        target %= c
    return used if target == 0 else -1

# coin_change_greedy([1, 5, 10, 25], 30) -> 2, and 2 is optimal
# coin_change_greedy([1, 3, 4], 6)       -> 3 (4+1+1); optimum is 2 (3+3)
# Only a DP over every target below the goal gets the second one right.`,

    java: `// Sort by finish time, then sweep. The comparator is the algorithm.
static int maxNonOverlapping(int[][] iv) {
    Arrays.sort(iv, (a, b) -> Integer.compare(a[1], b[1]));  // never a[1]-b[1]
    int kept = 0;
    long end = Long.MIN_VALUE;
    for (int[] x : iv) {
        if (x[0] >= end) { kept++; end = x[1]; }   // commit, permanently
    }
    return kept;
}

// Fractional knapsack: value per weight, compared WITHOUT floating point.
static double fractionalKnapsack(int[] val, int[] wt, int cap) {
    Integer[] idx = new Integer[val.length];
    for (int i = 0; i < idx.length; i++) idx[i] = i;
    // v[a]/w[a] > v[b]/w[b]  becomes  v[a]*w[b] > v[b]*w[a]
    Arrays.sort(idx, (a, b) ->
        Long.compare((long) val[b] * wt[a], (long) val[a] * wt[b]));
    double total = 0;
    for (int i : idx) {
        if (cap == 0) break;
        int take = Math.min(cap, wt[i]);           // cut the last item to fit
        total += (double) val[i] * take / wt[i];
        cap -= take;
    }
    return total;
}
// Delete the cutting and this is 0/1 knapsack, where the same rule is wrong.`,

    cpp: `// Sort by finish time. Choosing that key is the entire correctness proof.
int maxNonOverlapping(vector<pair<int,int>>& iv) {
    sort(iv.begin(), iv.end(), [](auto& a, auto& b) {
        return a.second < b.second;            // finish time, nothing else
    });
    int kept = 0;
    long long end = LLONG_MIN;
    for (auto& [s, e] : iv) {
        if (s >= end) { kept++; end = e; }     // commit, no going back
    }
    return kept;
}

// HUFFMAN. The best next choice changes as you go, so it needs a heap,
// not one sort. Exchange: the two rarest symbols can always be pushed to
// the deepest sibling slots of an optimal tree without costing more.
long long mergeCost(vector<int>& freq) {
    priority_queue<long long, vector<long long>, greater<long long>> pq;
    for (int f : freq) pq.push(f);             // greater<> = MIN-heap in C++
    long long total = 0;
    while (pq.size() > 1) {
        long long a = pq.top(); pq.pop();
        long long b = pq.top(); pq.pop();
        total += a + b;                        // merging the two smallest
        pq.push(a + b);
    }
    return total;
}`,

    js: `// Sort by the right key, then sweep. That is most greedy solutions.
function maxNonOverlapping(intervals) {
  intervals.sort((a, b) => a[1] - b[1]);   // finish time; sort() needs this
  let kept = 0, end = -Infinity;
  for (const [s, e] of intervals) {
    if (s >= end) { kept++; end = e; }     // commit and never reconsider
  }
  return kept;
}

// The choice fires at the boundary of the reach, not at every index.
function minJumps(nums) {
  let jumps = 0, curEnd = 0, furthest = 0;
  for (let i = 0; i < nums.length - 1; i++) {
    furthest = Math.max(furthest, i + nums[i]);
    if (i === curEnd) { jumps++; curEnd = furthest; }   // forced to commit
  }
  return jumps;
}

// The counterexample, in code, so it stops being an abstract warning.
function coinChangeGreedy(coins, target) {
  let used = 0;
  for (const c of [...coins].sort((a, b) => b - a)) {
    used += Math.floor(target / c);
    target %= c;
  }
  return target === 0 ? used : -1;
}
// coinChangeGreedy([1, 5, 10, 25], 30) === 2   correct
// coinChangeGreedy([1, 3, 4], 6)       === 3   wrong; 3 + 3 is 2 coins`,
  },
  codecap: "Sort by the right key, then sweep once. The loop is never the hard part, the sentence justifying the key is.",

  q: [
    ["What two properties must a problem have before greedy is correct?", "The greedy choice property, meaning the first choice your rule makes appears in some optimal solution, and optimal substructure, meaning that after committing to it the remainder is the same problem on a smaller input. Together they let induction finish the proof."],
    ["What is an exchange argument, exactly?", "Take any optimal solution, and let g be the first choice your greedy rule makes. If g is already in it, done. Otherwise swap g in for whatever that solution chose there, and show the result is still valid and no worse. That proves an optimal solution containing g exists. You only ever need to tie with the optimum, never to beat it."],
    ["Give a concrete case where the obvious greedy fails.", "Coin change with coins {1, 3, 4} and target 6. Taking the largest coin that fits gives 4 + 1 + 1, three coins, while 3 + 3 uses two. The rule was false, and the algorithm cannot detect it because it never examines the branch it did not take."],
    ["Why is that coin change failure dangerous rather than merely wrong?", "Because the same greedy is provably correct for real currency systems like {1, 5, 10, 25}. Your intuition and your hand-written test cases both come from money you have actually used, so they agree with the algorithm. The counterexample only appears in coin systems you would never think to try."],
    ["What do you do when you cannot construct an exchange argument?", "Stop committing and start enumerating. If the same state is reachable many ways and you want a count or an optimum, that is DP with a memo. If you want the arrangements themselves, that is backtracking. Greedy is a claim, and failing to prove it means you do not have one."],
    ["What shape do most greedy solutions actually take?", "Sort by a key, then sweep once, taking whatever is still compatible. The loop is boilerplate, so choosing the sort key is the algorithm: for non-overlapping intervals it is finish time, for fractional knapsack it is value per weight, for lateness it is deadline."],
  ],

  p: [
    [455, "assign-cookies", "Assign Cookies, the simplest possible greedy", "E"],
    [121, "best-time-to-buy-and-sell-stock", "Best Time to Buy and Sell Stock, one sweep, no sort", "E"],
    [55, "jump-game", "Jump Game, track the furthest reach", "M"],
    [435, "non-overlapping-intervals", "Non-overlapping Intervals, sort by finish time, and know why", "M"],
    [452, "minimum-number-of-arrows-to-burst-balloons", "Burst Balloons, the same exchange argument reworded", "M"],
    [134, "gas-station", "Gas Station, the greedy that needs an actual proof", "M"],
    [621, "task-scheduler", "Task Scheduler, greedy driven by a count, not a sort", "M"],
  ],
},

/* ==================================================================== */
{
  id: "string-search",
  n: "String search and KMP",
  group: "Algorithms",
  one: "The naive scan throws away every character it just matched. <b>Precompute how much of a failed match is still usable</b> and the text pointer never has to go backwards.",

  plain: `<p>Find every place a pattern occurs inside a longer text. The obvious method lines the pattern up at position 0, compares left to right, and on the first mismatch slides one place right and starts over. It is correct and it is three lines. On the wrong sort of text, where the pattern nearly matches everywhere, it is O(n·m).</p>
<p>Look at what a failed attempt actually learns. If four characters matched before the fifth failed, those four are not a mystery. They are the pattern's own first four, and you knew them before the text arrived. So you can work out, in advance and from the pattern alone, how far you are allowed to slide without skipping a possible match.</p>
<p>The answer is the longest piece that is both a <b>prefix and a suffix</b> of what matched. If "abab" matched, it starts and ends with "ab", so sliding by two keeps that "ab" aligned and you resume comparing from the third character. Precompute that number for every prefix of the pattern and the text pointer never moves backwards again, which makes the scan O(n + m).</p>
<p><b>Analogy.</b> Losing your place while reading a phone number aloud. You do not go back to the first digit; you notice the last few you said are also how it starts, and pick up from there.</p>`,

  why: [
    { t: "The naive scan is fine until it is not", d: "Try every starting position and compare until a mismatch. On ordinary English it is nearly linear, because mismatches come almost immediately. On <b>aaaaaaaaab</b> searched for <b>aaab</b>, every position matches most of the pattern before failing, and the cost is the full <b>O(n·m)</b>. Interview constraints are set to produce exactly that input." },
    { t: "Ask what a failed attempt already told you", d: "When the match dies at offset j, the previous j characters of the text are known: they are <b>the pattern's own first j characters</b>. Sliding by one throws that away and re-reads them. Any algorithm that re-reads what it has already confirmed is leaving work on the table." },
    { t: "The right question is about the pattern, not the text", d: "How far can the pattern slide without skipping a match? Far enough that the part still under it lines up. That means the longest piece of the matched prefix that is <b>also a suffix</b> of it. For \"abab\" that is \"ab\", length 2. This depends only on the pattern, so it can be computed once, before the text is even read." },
    { t: "That table is the prefix function", d: "lps[i] is the length of the longest proper prefix of pattern[0..i] that is also a suffix of it. Proper means not the whole thing, or the answer would always be trivial. On a mismatch after j matched characters, fall back to <b>lps[j-1]</b>: that many characters are still known good, so keep them and resume." },
    { t: "The table is built by the same trick, on itself", d: "Building lps is the pattern searched inside the pattern, with the same fall-back rule. That sounds circular and is not: computing lps[i] only ever reads entries before i, which are already final. It is <b>O(m)</b>, and it is the part people cannot reconstruct under pressure." },
    { t: "Why the total is linear, said properly", d: "The text index only ever increases, at most n times. The pattern index increases at most once per text step, so across the whole run it can only <b>decrease</b> n times in total. The fall-back loop looks nested and is paid for by forward progress already made. This is the same amortised argument as the monotonic stack." },
    { t: "There is a second route to the same bound", d: "Rabin-Karp hashes each window of the text with a rolling hash, so sliding one place costs one multiply and one subtract. Equal hashes mean a <b>probable</b> match, so you still compare the characters to confirm. Same O(n + m) expected, and it generalises to many patterns at once, which KMP does not." },
    { t: "Be honest about when you need any of this", d: "The built-in <code>find</code> or <code>indexOf</code> is a naive scan with tricks and beats KMP on almost every real input. What KMP buys is the <b>worst-case guarantee</b>, and the prefix function itself, which is what problems about repeated substrings and shortest palindromes actually want." },
  ],

  viz: ["kmp"],

  hing: `<p><b>Naive tareeka:</b> pattern ko index 0 par rakho, compare karo, mismatch hote hi ek jagah aage sarka kar dobara shuru. Sahi hai, teen line hai, aur <b>aaaaaaaaab</b> mein <b>aaab</b> dhoondo to har position par poora pattern lagbhag match hota hai phir fail hota hai. Yahi <b>O(n·m)</b> hai, aur interview ke constraints theek yahi input banane ke liye set kiye jaate hain.</p>
<p><b>Ab socho ki fail hone se kya pata chala.</b> Agar mismatch offset j par hua, to pichhle j characters koi rahasya nahi hain. Woh <b>pattern ke hi pehle j characters</b> hain. Matlab woh tumhein text dekhne se pehle hi maloom the. Ek jagah sarakna un sab ko phenk dena hai.</p>
<p><b>Asli sawaal pattern ke baare mein hai, text ke baare mein nahi.</b> Kitna sarak sakte ho bina kisi match ko chhode? Utna, jitna neeche wala hissa phir se line mein aa jaaye. Matlab: jo hissa match hua, uska sabse bada <b>prefix jo suffix bhi ho</b>. "abab" ka jawaab "ab" hai, length 2. Yeh sirf pattern par depend karta hai, isliye ek baar pehle hi nikal lo. Yahi <code>lps</code> table hai.</p>
<p><b>Linear kyun hai, yeh line bolna:</b> text ka index kabhi peeche nahi jaata, zyada se zyada n baar aage badhta hai. Pattern ka index har step mein ek baar hi badhta hai, isliye poore run mein woh kul milakar n baar hi <b>ghat</b> sakta hai. Andar wala while loop dikhne mein nested hai, par uska paisa pehle hi bhara ja chuka hai. Aur haan, interview mein pehle <code>indexOf</code> bol dena, phir KMP: usse pata chalta hai ki tumhe worst case aur practice ka farak samajh aata hai.</p>`,

  math: [
    { t: "The naive scan, and the input that kills it", d: "On ordinary text it behaves like a single pass, which is exactly why the quadratic case reaches production instead of being caught.", w:
`text n, pattern m.  worst case (n - m + 1) x m

text    = a a a a ... a          n = 10^6
pattern = a a a ... a b          m = 1000

every start matches 999 characters, then fails
  10^6 x 10^3 = 10^9 comparisons

on random text: about n. Your test data is random text.` },
    { t: "The lps table, built by hand", d: "One number per position: how much of what you just matched is still usable. Everything else about KMP is a consequence of this table.", w:
`pattern   a  b  a  b  c
index     0  1  2  3  4
lps       0  0  1  2  0

lps[i] = longest proper prefix of pattern[0..i] that is
         also a suffix of pattern[0..i]

lps[3] = 2 because "abab" begins and ends with "ab"
so after matching 4 and failing, 2 are still matched:
shift by 4 - 2 = 2, and resume at pattern index 2` },
    { t: "Why the total is linear, argued on the match counter", d: "The honest proof is not about the shifts. It is about j, the number of characters currently matched, which can only fall as often as it rose.", w:
`let j = how many characters currently match

i advances once per text character:   at most n times
j rises by at most 1 per advance:      at most n rises
j never goes below 0, so total falls <= total rises <= n

comparisons <= 2n. The table is built by the same argument
against the pattern: <= 2m. Total O(n + m).` },
    { t: "Rabin-Karp: rolling the hash, and the odds of a lie", d: "The other route to linear. It compares numbers instead of characters, which is O(1) per shift but only probably correct, so every hit is verified.", w:
`roll one position:
  h = (h - s[i] x B^(m-1)) x B + s[i+m]      O(1)

false positive chance per window ~ m / M
M = 10^9 + 7, m = 1000, windows n = 10^6:
  expected false hits = 10^6 x 10^3 / 10^9 = 1

so verify on a hit: O(m) once, not per window.
Skip the verification and it is a guess, not an algorithm.` },
    { t: "What the table gives you besides searching", d: "The single most likely place KMP appears in an interview is not string search at all, it is this one identity about repetition.", w:
`s of length n, lps built on s itself

k = n - lps[n-1]  is the length of the smallest block
that could tile s

if n mod k == 0, s is that block repeated n/k times
  "abcabcabc": n = 9, lps[8] = 6, k = 3, 9 mod 3 = 0
  "abcabca":   n = 7, lps[6] = 4, k = 3, 7 mod 3 = 1, no` },
  ],

  costs: [
    ["naive scan", "O(n·m) worst, O(n) typical", "each start compares until a mismatch, and on random text that happens within a character or two"],
    ["build the lps table", "O(m) time, O(m) space", "the pattern matched against itself, with the same fall-back rule and no text involved"],
    ["KMP scan", "O(n) time", "each text index is entered once, and the fall-back loop is paid for by forward progress already made"],
    ["KMP total", "O(n + m)", "the guarantee, not the average: this is the number that matters when the input is chosen to hurt"],
    ["Rabin-Karp", "O(n + m) expected", "one multiply and one subtract per slide, plus an O(m) verification on every hash hit"],
    ["Rabin-Karp, worst case", "O(n·m)", "if the hash collides at every position, every window is verified character by character"],
    ["Z-algorithm", "O(n + m) time and space", "the same information in a different table, often shorter to write and easier to get right"],
    ["many patterns at once", "O(n + total pattern length)", "Aho-Corasick, a trie with KMP fall-back links, and the reason KMP is worth understanding"],
  ],

  traps: [
    "<b>Advancing the text index after a fall-back.</b> The fall-back moves only the pattern index. Advancing both skips the character that just failed, and it will be re-compared against the wrong pattern position.",
    "<b>Falling back to lps[j] instead of lps[j-1].</b> j is the count of matched characters, so the last matched index is j-1. Off by one here still finds most matches, which is worse than finding none.",
    "<b>Not resetting after a full match.</b> On a match, set j to lps[m-1] rather than 0, or overlapping occurrences are missed. Searching \"aaa\" in \"aaaa\" must find two, not one.",
    "<b>Forgetting to verify a Rabin-Karp hit.</b> Equal hashes mean probably equal. Skipping the character comparison gives an algorithm that is right on your tests and wrong in production.",
    "<b>Building a regex out of the pattern string.</b> A dot, a bracket or a plus sign in the input becomes syntax, and the search silently matches the wrong thing.",
    "<b>Reaching for KMP when the built-in would do.</b> Say indexOf first and say why it is O(n·m) in the worst case. Writing KMP unprompted answers a question nobody asked.",
  ],

  impl: [
    ["Python", "str.find / str.index", "A naive scan with a two-way fallback, so linear in practice. find returns -1 and index raises, which is the only difference."],
    ["Java", "String.indexOf", "Naive with a small optimisation, O(n·m) in the worst case. charAt in a loop is fine; toCharArray once is faster in a hot loop."],
    ["C++", "std::search", "Since C++17 it takes a searcher, and boyer_moore_searcher from <functional> beats anything you will write under time pressure."],
    ["JavaScript", "String.indexOf / includes", "Engine-dependent, usually a naive scan with a memchr-style skip. Never build a RegExp from an untrusted pattern string."],
  ],

  code: {
    pseudo: `# STEP 1. Build the table from the PATTERN alone. No text involved.
# lps[i] = length of the longest PROPER prefix of p[0..i] that is also
#          a suffix of p[0..i].   For "abab" that is "ab", so lps[3] = 2.
build_lps(p):
    lps[0] <- 0
    len <- 0                      # how much of the prefix currently matches
    for i from 1 to m-1:
        while len > 0 and p[i] != p[len]:
            len <- lps[len - 1]   # fall back, and do NOT touch i
        if p[i] = p[len]:  len <- len + 1
        lps[i] <- len

# STEP 2. Scan the text. i only ever moves FORWARD. j is the pattern index.
search(text, p):
    j <- 0
    for i from 0 to n-1:
        while j > 0 and text[i] != p[j]:
            j <- lps[j - 1]       # keep the overlap, drop the rest
        if text[i] = p[j]:  j <- j + 1
        if j = m:
            report a match starting at i - m + 1
            j <- lps[m - 1]       # not 0, or overlapping matches are missed

# WHY IT IS LINEAR: i rises at most n times. j rises at most once per step,
# so across the whole run it can only FALL n times. The inner while loop is
# already paid for. Same argument as the monotonic stack.

# RABIN-KARP, the other route. Roll a hash over each window:
#   drop the leaving character, shift, add the joining one.
# Equal hashes mean PROBABLY equal, so compare the characters to confirm.`,

    py: `def build_lps(p):                     # O(m). The pattern against itself.
    lps = [0] * len(p)
    length = 0                        # how much of the prefix matches now
    for i in range(1, len(p)):
        while length and p[i] != p[length]:
            length = lps[length - 1]  # fall back, never straight to zero
        if p[i] == p[length]:
            length += 1
        lps[i] = length
    return lps

def kmp(text, p):                     # every start index where p occurs
    if not p: return [0]
    lps, out, j = build_lps(p), [], 0
    for i, ch in enumerate(text):     # i NEVER goes backwards. That is the point.
        while j and ch != p[j]:
            j = lps[j - 1]            # the only backward move, and it is j
        if ch == p[j]:
            j += 1
        if j == len(p):
            out.append(i - j + 1)
            j = lps[j - 1]            # keep going: overlapping matches count
    return out

# RABIN-KARP: one multiply and one subtract per slide, then VERIFY.
def rabin_karp(text, p, base=257, mod=(1 << 61) - 1):
    n, m = len(text), len(p)
    if m > n or m == 0: return []
    high = pow(base, m - 1, mod)      # the weight of the leaving character
    hp = hw = 0
    for i in range(m):                # hash the pattern and the first window
        hp = (hp * base + ord(p[i])) % mod
        hw = (hw * base + ord(text[i])) % mod
    out = []
    for i in range(n - m + 1):
        if hp == hw and text[i:i + m] == p:   # VERIFY: hashes collide
            out.append(i)
        if i + m < n:                 # drop the leaver, shift, add the joiner
            hw = ((hw - ord(text[i]) * high) * base + ord(text[i + m])) % mod
    return out

# And the answer to give first, before offering either of the above:
text.find(p)                          # O(n*m) worst case, linear in practice`,

    java: `int[] buildLps(String p) {
    int[] lps = new int[p.length()];
    int len = 0;
    for (int i = 1; i < p.length(); i++) {
        while (len > 0 && p.charAt(i) != p.charAt(len)) len = lps[len - 1];
        if (p.charAt(i) == p.charAt(len)) len++;
        lps[i] = len;                 // lps[0] stays 0, by definition
    }
    return lps;
}

int kmp(String text, String p) {      // first match index, or -1
    if (p.isEmpty()) return 0;
    int[] lps = buildLps(p);
    int j = 0;
    for (int i = 0; i < text.length(); i++) {
        while (j > 0 && text.charAt(i) != p.charAt(j)) j = lps[j - 1];
        if (text.charAt(i) == p.charAt(j)) j++;
        if (j == p.length()) return i - j + 1;
    }
    return -1;
}

// String.indexOf is a naive scan with one optimisation, so it is O(n*m) in
// the worst case and faster than this on essentially every real input.
// charAt is a bounds check per call; toCharArray once is cheaper in a loop.`,

    cpp: `vector<int> buildLps(const string& p) {
    vector<int> lps(p.size(), 0);
    int len = 0;
    for (size_t i = 1; i < p.size(); i++) {
        while (len > 0 && p[i] != p[len]) len = lps[len - 1];
        if (p[i] == p[len]) len++;
        lps[i] = len;
    }
    return lps;
}

int kmp(const string& text, const string& p) {     // first index, or -1
    if (p.empty()) return 0;
    vector<int> lps = buildLps(p);
    int j = 0;
    for (size_t i = 0; i < text.size(); i++) {
        while (j > 0 && text[i] != p[j]) j = lps[j - 1];
        if (text[i] == p[j]) j++;
        if (j == (int) p.size()) return (int) (i - j + 1);
    }
    return -1;
}

// size() is unsigned, so compare j against a cast size or the comparison is
// promoted and a negative j would silently become enormous.
// std::search with boyer_moore_searcher (<functional>, C++17) is the version
// to reach for when you are allowed to, and it is genuinely faster.`,

    js: `function buildLps(p) {
  const lps = new Array(p.length).fill(0);
  let len = 0;
  for (let i = 1; i < p.length; i++) {
    while (len > 0 && p[i] !== p[len]) len = lps[len - 1];
    if (p[i] === p[len]) len++;
    lps[i] = len;
  }
  return lps;
}

function kmp(text, p) {                // every match index
  if (!p) return [0];
  const lps = buildLps(p), out = [];
  let j = 0;
  for (let i = 0; i < text.length; i++) {
    while (j > 0 && text[i] !== p[j]) j = lps[j - 1];
    if (text[i] === p[j]) j++;
    if (j === p.length) {
      out.push(i - j + 1);
      j = lps[j - 1];                  // not 0: overlapping matches count
    }
  }
  return out;
}

// indexOf is the honest first answer. A RegExp built from the pattern is
// not: a dot, a bracket or a plus in the input becomes syntax, and the
// search quietly matches something else entirely.
text.indexOf(p);`,
  },
  codecap: "The scan is eight lines and the table is six, and the table is the one nobody can reconstruct cold. Learn build_lps first: it is the same fall-back rule as the search, which is why the two functions look like each other.",

  q: [
    ["What exactly does the naive scan waste?", "Everything it just confirmed. When the match fails at offset j, the previous j characters of the text are known to equal the pattern's first j characters, and sliding by one re-reads them from scratch. On input like aaaa...aab that repeats at every position, giving O(n·m)."],
    ["What does lps[i] mean, and why must the prefix be proper?", "The length of the longest prefix of pattern[0..i] that is also a suffix of it. Proper means it cannot be the whole string, because the whole string is trivially both, and the table would say nothing."],
    ["On a mismatch after j matched characters, why fall back to lps[j-1]?", "j counts matched characters, so the last matched index is j-1. lps[j-1] is how much of that match is still aligned after the slide, so those characters are known good and comparison resumes at pattern index lps[j-1]."],
    ["Why does the text index never move backwards?", "Because the slide is done by moving the pattern index down, not by rewinding the text. Everything the fall-back keeps was already verified, so there is nothing behind the current text position left to check."],
    ["The search has a while loop inside a for loop. Why is it still O(n)?", "The pattern index rises at most once per text character, so at most n times in total, and the inner loop only ever lowers it. It cannot fall more often than it rose. The same amortised argument as the monotonic stack."],
    ["Why must Rabin-Karp compare characters after the hashes match?", "Because a hash maps many strings to one value, so equal hashes mean probably equal, not equal. Skipping the check produces an algorithm that passes every test you write and reports false matches on real data."],
    ["After finding a match, why set j to lps[m-1] rather than 0?", "Because occurrences can overlap. Searching for aaa in aaaa must report two matches, and resetting to 0 throws away the overlap that produces the second one."],
    ["When should you actually reach for KMP?", "When the worst case matters, or when the prefix function itself is the answer. Repeated substring patterns, shortest palindrome and longest happy prefix are all lps questions wearing different titles. For plain substring search, the built-in is faster in practice and should be named first."],
  ],

  p: [
    [28, "find-the-index-of-the-first-occurrence-in-a-string", "Find the First Occurrence, naive then KMP", "E"],
    [459, "repeated-substring-pattern", "Repeated Substring Pattern, one lps lookup answers it", "E"],
    [686, "repeated-string-match", "Repeated String Match, how many copies before a match", "M"],
    [187, "repeated-dna-sequences", "Repeated DNA, rolling hash over a fixed window", "M"],
    [214, "shortest-palindrome", "Shortest Palindrome, lps of s plus reversed s", "H"],
    [1392, "longest-happy-prefix", "Longest Happy Prefix, literally the last lps entry", "H"],
    [1044, "longest-duplicate-substring", "Longest Duplicate Substring, binary search plus rolling hash", "H"],
  ],
},

/* ==================================================================== */
{
  id: "prefix-sums",
  n: "Prefix sums",
  group: "Patterns",
  one: "Pay O(n) once to store every running total, then <b>any</b> range sum is a single subtraction: sum(l..r) = pre[r+1] - pre[l], O(1) per query.",

  plain: `<p>The problem: you are asked for the sum of a stretch of the array, and then asked again, and again, with different endpoints. Adding up the stretch each time costs O(n) per question, so q questions cost O(n·q). On an array of 100,000 items with 100,000 queries that is 10 billion additions, which is a timeout with extra steps.</p>
<p>Instead do the work once. Walk the array left to right and write down the running total at every point. Now the sum of positions l to r is just the total up to r minus the total up to just before l. One subtraction. Every query after the build is free.</p>
<p>The same trick, run backwards, answers a different question. Suppose you have many <b>updates</b> to ranges, and only need to read the array at the end. Record each update as a pair of marks, then take the running total once, at the finish.</p>
<p><b>Analogy.</b> Milestones on a highway. Nobody measures the road between two towns. You read the marker at each town and subtract.</p>`,

  why: [
    { t: "Re-adding the same stretch is the waste",
      d: "Answering one range sum by looping over it is O(n). Answering q of them that way is O(n·q), and the ranges overlap heavily, so you are adding the same numbers over and over. That repetition is the only thing wrong with the naive solution." },
    { t: "Do the adding once and store every running total",
      d: "One left to right pass gives you the sum of the first i elements for every i. That costs O(n) time and O(n) space, paid a single time. It is the classic trade: precompute, then answer instantly." },
    { t: "Make the array n+1 long and start it at zero",
      d: "Define <code>pre[0] = 0</code> and <code>pre[i+1] = pre[i] + a[i]</code>. The leading zero means <b>the empty prefix exists</b>, so a range starting at index 0 is not a special case. Every off by one bug in this pattern comes from someone deciding the extra slot was optional." },
    { t: "Now every range is one subtraction",
      d: "<code>sum(l..r) = pre[r+1] - pre[l]</code>. Read it as: everything up to r, minus everything before l. O(1) per query, and it holds for l = 0 for free because <code>pre[0]</code> is 0. Say the identity out loud before you code; the endpoints are where people lose the marks." },
    { t: "The big one: rearrange the identity and count with a hash map",
      d: "Counting subarrays whose sum is exactly k means counting pairs with <code>pre[r+1] - pre[l] = k</code>, which is <code>pre[l] = pre[r+1] - k</code>. So sweep once, and at each position ask a map how many earlier prefixes had that value. O(n) time. It <b>works with negative numbers</b>, where a sliding window does not, because it never assumes that growing a window grows its sum. Seed the map with <code>{0: 1}</code>, that one entry is the empty prefix and it is what lets a subarray start at index 0." },
    { t: "Two dimensions, same idea, one more term",
      d: "For a grid, <code>P[i+1][j+1]</code> holds the sum of the whole rectangle above and left. Building it, and querying it, both need inclusion exclusion: add the two overlapping rectangles, then subtract the corner you counted twice. Any rectangle sum is then 4 lookups, O(1)." },
    { t: "Run it backwards for updates, and know when it stops working",
      d: "A <b>difference array</b> is the mirror image. To add v over l..r, write <code>d[l] += v</code> and <code>d[r+1] -= v</code>. That is O(1) per update. Then take prefix sums once at the end to recover the array. Many updates, one read. What neither version survives is the array <b>changing between queries</b>: one write invalidates the whole tail of the prefix array. That case is what a Fenwick tree or segment tree is for, O(log n) per update and per query." },
  ],

  hing: `<p><b>Problem ki shakal:</b> baar baar poocha jaa raha hai "l se r tak ka sum kya hai". Har baar loop chalao to O(n) per query, q queries par O(n·q), aur TLE.</p>
<p><b>Asli idea:</b> ek hi baar left se right chalo aur har point ka <b>running total</b> likh lo. Ab kisi bhi range ka sum ek <b>ghatav</b> hai. Build O(n), phir har query <b>O(1)</b>.</p>
<p><b>pre array n+1 lambi kyun, aur pehla element 0 kyun?</b> Kyunki <code>pre[0] = 0</code> ka matlab hai "khaali prefix", yaani shuru se pehle kuch nahi. Isse <code>l = 0</code> wala case <b>special case rehta hi nahi</b>. Identity yaad rakho: <code>sum(l..r) = pre[r+1] - pre[l]</code>. Jitne bhi off by one bugs is pattern mein hote hain, sab yahin se aate hain. Pehle identity bolo, phir code likho.</p>
<p><b>Sabse important part, hash map wala counting trick:</b> "kitne subarrays ka sum k hai" poocha gaya. Seedha likho: <code>pre[r+1] - pre[l] = k</code>, ise ghumao to <code>pre[l] = pre[r+1] - k</code>. Matlab har position par sirf yeh poochna hai: <b>itni value wale kitne purane prefix dekhe hain?</b> Ek map rakho jisme har prefix sum ki count ho. Ek hi pass mein kaam khatam. <b>O(n)</b>.</p>
<p><b>Map ko <code>{0: 1}</code> se seed karna mat bhoolna.</b> Woh ek entry khaali prefix hai. Uske bina woh saare subarrays chhoot jaate hain jo index 0 se shuru hote hain, aur test case 3 par silently galat answer aata hai.</p>
<p><b>Sliding window ya prefix sums, kaunsa?</b> Sliding window tab chalta hai jab sab numbers <b>positive</b> hon, kyunki tabhi window badhne se sum badhta hai (monotonic). Negative numbers aate hi woh assumption toot jaata hai. Prefix sums + hash map ko monotonicity chahiye hi nahi, isliye negatives ke saath wahi sahi tool hai. Doosri taraf, agar longest ya shortest window chahiye aur saare numbers positive hain, to sliding window jeet jaata hai. Woh O(1) space mein ho jaata hai, jabki prefix sums O(n) memory maangta hai. Constraints padho, phir choose karo.</p>
<p><b>2-D version (integral image):</b> grid mein har rectangle ka sum 4 lookups mein. Formula mein do rectangles jodo aur jo corner do baar gin liya use ghatao, yeh inclusion exclusion hai. Sign galat likhna sabse aam galti hai, ek chhoti 2x2 grid par haath se verify kar lo.</p>
<p><b>Difference array, ulta khel:</b> yahan bahut saare <b>range updates</b> hain aur padhna sirf end mein hai. <code>d[l] += v</code>, <code>d[r+1] -= v</code>, har update O(1), aur last mein ek prefix sum pass se poora array wapas. Array n+1 size ka rakho warna <code>r = n-1</code> par index out of bounds.</p>
<p><b>Aur agar array beech mein badalta rahe?</b> Tab prefix sums mar jaata hai, ek update poore tail ko invalid kar deta hai. Wahan <b>Fenwick tree ya segment tree</b> chahiye, O(log n) per update aur per query. Interview mein itna bol dena kaafi hai.</p>`,

  viz: ["prefix-sums"],

  math: [
    { t: "The identity, with every term cancelling", d: "One subtraction answers a range because the shared beginning appears in both prefixes with opposite signs.", w:
`pre[0] = 0,  pre[i+1] = pre[i] + a[i]

pre[r+1] - pre[l]
  = (a[0] + ... + a[r]) - (a[0] + ... + a[l-1])
  = a[l] + ... + a[r]

everything before index l cancels.
pre[0] = 0 is what makes l = 0 work without a branch.` },
    { t: "What the pre-pass buys, over q queries", d: "The build is one pass. Every query afterwards is a subtraction, so the whole cost is additive rather than multiplicative.", w:
`q range-sum queries over n items

scan per query:   q x n
prefix array:     n to build + 1 per query = n + q

n = 10^6, q = 10^6:
  10^12   vs   2 x 10^6` },
    { t: "Rearrange the identity and it counts subarrays", d: "This is the version interviews actually ask. The same equation solved for the other unknown becomes a hash-map lookup.", w:
`want sum(l..r) = k

  pre[r+1] - pre[l] = k
  pre[l] = pre[r+1] - k

so walk r, and ask how many earlier prefixes equalled
pre[r+1] - k.  One pass, O(n), and it handles negatives,
which a sliding window cannot.

seed the map with {0: 1}, or every subarray starting at
index 0 is missed.` },
    { t: "Two dimensions, one extra term", d: "The rectangle sum subtracts two strips and adds the corner back, because the corner was removed twice. Inclusion-exclusion, four lookups, any size.", w:
`sum of rows r1..r2, columns c1..c2:

    P[r2+1][c2+1]
  - P[r1][c2+1]        the strip above
  - P[r2+1][c1]        the strip to the left
  + P[r1][c1]          the overlap, removed twice

build O(R x C), query O(1) with exactly 4 lookups` },
    { t: "Run it backwards for range updates", d: "A difference array is the same identity with the roles swapped: mark the two edges, and one prefix pass at the end applies every update at once.", w:
`add v to every index in [l, r):
  d[l] += v,  d[r] -= v            two writes, O(1)

after all m updates, prefix-sum d once  ->  the array

m updates then one read:   m + n
applying each update directly:   m x n

n = 10^6, m = 10^6:  2 x 10^6   vs   10^12` },
  ],

  costs: [
    ["build the prefix array", "O(n) time · O(n) space", "paid once, before any query is answered"],
    ["one range sum query", "O(1)", "two array reads and a subtraction, nothing depends on the range width"],
    ["q queries, naive vs prefix", "O(n·q) vs O(n + q)", "the whole reason the pattern exists"],
    ["count subarrays with sum k", "O(n) time · O(n) space", "one pass, the map holds at most n distinct prefix values"],
    ["2-D build, then rectangle query", "O(R·C) then O(1)", "4 corner lookups, independent of rectangle size"],
    ["m range updates, one final read", "O(m + n)", "difference array: O(1) per update, one prefix pass at the end"],
    ["array changes between queries", "O(log n) with a Fenwick tree", "a plain prefix array would need an O(n) rebuild per write"],
  ],

  traps: [
    "<b>Writing <code>pre[r] - pre[l]</code>.</b> The correct identity is <code>pre[r+1] - pre[l]</code> when <code>pre</code> is the n+1 form. Decide which convention you are using before the first line, and never mix the two in one function.",
    "<b>Forgetting <code>seen[0] = 1</code></b> in the counting version. Without it, every subarray that starts at index 0 is missed. It passes the first sample and fails the rest, which is the worst possible failure mode.",
    "<b>Integer overflow.</b> Prefix sums grow to n times the largest element. 100,000 values of a billion each land near 10 to the 14, far past a 32-bit int. Use 64-bit in Java and C++.",
    "<b>Reaching for a sliding window when negatives are allowed.</b> The shrink rule assumes the sum grows with the window. Prefix sums plus a hash map do not need that assumption.",
    "<b>Sign errors in the 2-D formula.</b> The corner rectangle is subtracted twice and must be added back. Check it once by hand on a 2x2 grid instead of guessing signs at 2am.",
    "<b>Sizing the difference array at n.</b> An update ending at the last index writes to <code>d[r+1]</code>, so it needs n+1 slots or a guard.",
  ],

  impl: [
    ["Python", "itertools.accumulate(a, initial=0) / collections.defaultdict(int)", "initial=0 gives the n+1 form directly; ints are arbitrary precision so overflow is not a concern."],
    ["Java", "long[] pre / HashMap<Long,Integer>", "Use long, not int, or the sum silently wraps. Boxing Long keys is slow, autoboxing caches only small values."],
    ["C++", "std::partial_sum, std::exclusive_scan, unordered_map<long long,int>", "Use long long. exclusive_scan gives the leading zero; partial_sum does not."],
    ["JavaScript", "Array.prototype.reduce / Map", "Numbers lose exactness past 2^53, use BigInt for very large sums. Use a Map, object keys become strings."],
  ],

  code: {
    pseudo: `# --- build: pay O(n) once -----------------------------------------
# pre has n+1 entries. pre[0] = 0 is the EMPTY prefix, so a range
# starting at index 0 needs no special case.
pre[0] <- 0
for i from 0 to n-1:
    pre[i+1] <- pre[i] + a[i]

# --- query: every range is one subtraction, O(1) ------------------
sum(l..r) = pre[r+1] - pre[l]

# --- count subarrays with sum == k (negatives ALLOWED) ------------
# pre[r+1] - pre[l] == k   <=>   pre[l] == pre[r+1] - k
seen <- map {0: 1}              # the empty prefix, seeded once
run <- 0; total <- 0
for x in a:
    run <- run + x
    total <- total + seen.get(run - k, 0)   # all earlier matches
    seen[run] <- seen.get(run, 0) + 1
return total

# --- 2-D, inclusion exclusion -------------------------------------
P[i+1][j+1] <- g[i][j] + P[i][j+1] + P[i+1][j] - P[i][j]
rect(r1,c1,r2,c2) = P[r2+1][c2+1] - P[r1][c2+1]
                  - P[r2+1][c1]   + P[r1][c1]

# --- difference array: many UPDATES, one final read ---------------
d has n+1 slots                 # so r = n-1 needs no guard
for each update (l, r, v):
    d[l]   <- d[l] + v
    d[r+1] <- d[r+1] - v
a <- prefix sums of d           # one O(n) pass at the very end`,
    py: `from itertools import accumulate

# Build the n+1 form. pre[0] = 0 removes the l == 0 special case.
def build(a):
    return list(accumulate(a, initial=0))

def range_sum(pre, l, r):
    return pre[r + 1] - pre[l]          # everything to r, minus before l

# Count subarrays summing to k. Works with negatives; a window does not.
def subarray_sum_k(a, k):
    seen = {0: 1}                       # empty prefix, or you miss l == 0
    run = total = 0
    for x in a:
        run += x
        total += seen.get(run - k, 0)   # pre[l] == run - k
        seen[run] = seen.get(run, 0) + 1
    return total

# 2-D: build once, then any rectangle in 4 lookups.
def build2d(g):
    R, C = len(g), len(g[0])
    P = [[0] * (C + 1) for _ in range(R + 1)]
    for i in range(R):
        for j in range(C):
            P[i+1][j+1] = g[i][j] + P[i][j+1] + P[i+1][j] - P[i][j]
    return P

def rect(P, r1, c1, r2, c2):
    return P[r2+1][c2+1] - P[r1][c2+1] - P[r2+1][c1] + P[r1][c1]

# Difference array: m range updates in O(m), one prefix pass to read.
def apply_updates(n, updates):
    d = [0] * (n + 1)                   # n+1, or r = n-1 crashes
    for l, r, v in updates:
        d[l] += v
        d[r + 1] -= v
    return list(accumulate(d))[:n]`,
    java: `// long, not int: n * max(a) overflows 32 bits fast.
static long[] build(int[] a) {
    long[] pre = new long[a.length + 1];
    for (int i = 0; i < a.length; i++) pre[i + 1] = pre[i] + a[i];
    return pre;
}

static long rangeSum(long[] pre, int l, int r) {
    return pre[r + 1] - pre[l];
}

// Count subarrays summing to k, negatives allowed.
static int subarraySumK(int[] a, int k) {
    Map<Long, Integer> seen = new HashMap<>();
    seen.put(0L, 1);                    // the empty prefix
    long run = 0; int total = 0;
    for (int x : a) {
        run += x;
        total += seen.getOrDefault(run - k, 0);
        seen.merge(run, 1, Integer::sum);
    }
    return total;
}

// 2-D build, inclusion exclusion in both directions.
static long[][] build2d(int[][] g) {
    int R = g.length, C = g[0].length;
    long[][] P = new long[R + 1][C + 1];
    for (int i = 0; i < R; i++)
        for (int j = 0; j < C; j++)
            P[i+1][j+1] = g[i][j] + P[i][j+1] + P[i+1][j] - P[i][j];
    return P;
}

static long rect(long[][] P, int r1, int c1, int r2, int c2) {
    return P[r2+1][c2+1] - P[r1][c2+1] - P[r2+1][c1] + P[r1][c1];
}

// Difference array: O(1) per update, one pass to materialise.
static long[] applyUpdates(int n, int[][] updates) {
    long[] d = new long[n + 1];         // n+1 slots
    for (int[] u : updates) { d[u[0]] += u[2]; d[u[1] + 1] -= u[2]; }
    long[] out = new long[n];
    long run = 0;
    for (int i = 0; i < n; i++) { run += d[i]; out[i] = run; }
    return out;
}`,
    cpp: `// long long everywhere: the sums are the part that overflows.
vector<long long> build(const vector<int>& a) {
    vector<long long> pre(a.size() + 1, 0);
    for (size_t i = 0; i < a.size(); ++i) pre[i + 1] = pre[i] + a[i];
    return pre;                         // or std::exclusive_scan
}

long long rangeSum(const vector<long long>& pre, int l, int r) {
    return pre[r + 1] - pre[l];
}

// Count subarrays summing to k, negatives allowed.
int subarraySumK(const vector<int>& a, int k) {
    unordered_map<long long, int> seen{{0, 1}};   // empty prefix
    long long run = 0; int total = 0;
    for (int x : a) {
        run += x;
        auto it = seen.find(run - k);
        if (it != seen.end()) total += it->second;
        ++seen[run];
    }
    return total;
}

// 2-D prefix, then any rectangle in O(1).
vector<vector<long long>> build2d(const vector<vector<int>>& g) {
    int R = g.size(), C = g[0].size();
    vector<vector<long long>> P(R + 1, vector<long long>(C + 1, 0));
    for (int i = 0; i < R; ++i)
        for (int j = 0; j < C; ++j)
            P[i+1][j+1] = g[i][j] + P[i][j+1] + P[i+1][j] - P[i][j];
    return P;
}

long long rect(const vector<vector<long long>>& P,
               int r1, int c1, int r2, int c2) {
    return P[r2+1][c2+1] - P[r1][c2+1] - P[r2+1][c1] + P[r1][c1];
}

// Difference array.
vector<long long> applyUpdates(int n, const vector<array<int,3>>& ups) {
    vector<long long> d(n + 1, 0);      // n+1 slots
    for (auto& u : ups) { d[u[0]] += u[2]; d[u[1] + 1] -= u[2]; }
    vector<long long> out(n);
    long long run = 0;
    for (int i = 0; i < n; ++i) { run += d[i]; out[i] = run; }
    return out;
}`,
    js: `// Numbers are exact only to 2^53. Past that, reach for BigInt.
function build(a) {
  const pre = new Array(a.length + 1).fill(0);
  for (let i = 0; i < a.length; i++) pre[i + 1] = pre[i] + a[i];
  return pre;
}

const rangeSum = (pre, l, r) => pre[r + 1] - pre[l];

// Count subarrays summing to k, negatives allowed.
function subarraySumK(a, k) {
  const seen = new Map([[0, 1]]);       // the empty prefix
  let run = 0, total = 0;
  for (const x of a) {
    run += x;
    total += seen.get(run - k) || 0;    // pre[l] === run - k
    seen.set(run, (seen.get(run) || 0) + 1);
  }
  return total;
}

// 2-D build and rectangle query.
function build2d(g) {
  const R = g.length, C = g[0].length;
  const P = Array.from({length: R + 1}, () => new Array(C + 1).fill(0));
  for (let i = 0; i < R; i++)
    for (let j = 0; j < C; j++)
      P[i+1][j+1] = g[i][j] + P[i][j+1] + P[i+1][j] - P[i][j];
  return P;
}

const rect = (P, r1, c1, r2, c2) =>
  P[r2+1][c2+1] - P[r1][c2+1] - P[r2+1][c1] + P[r1][c1];

// Difference array: O(1) per update, one pass to read.
function applyUpdates(n, updates) {
  const d = new Array(n + 1).fill(0);   // n+1 slots
  for (const [l, r, v] of updates) { d[l] += v; d[r + 1] -= v; }
  const out = [];
  let run = 0;
  for (let i = 0; i < n; i++) { run += d[i]; out.push(run); }
  return out;
}`,
  },
  codecap: "One build, one subtraction, and one hash map. The difference array is the same code read from the other end.",

  q: [
    ["Why does the prefix array have n+1 entries and start at 0?", "The leading zero is the sum of the empty prefix. With it, sum(l..r) = pre[r+1] - pre[l] holds for l = 0 too, so there is no special case to forget."],
    ["State the range sum identity and read it in words.", "sum(l..r) = pre[r+1] - pre[l]: everything up to and including r, minus everything strictly before l."],
    ["How do you count subarrays with sum k in O(n)?", "Rearrange pre[r+1] - pre[l] = k into pre[l] = pre[r+1] - k. Sweep once keeping a hash map of how many times each prefix sum has been seen, and at each position add the count of run - k."],
    ["Why must the map be seeded with {0: 1}?", "That entry is the empty prefix. Without it every subarray starting at index 0 goes uncounted, and the code still returns a plausible looking number."],
    ["Sliding window or prefix sums plus a hash map?", "A window needs the sum to grow monotonically as the window grows, so it needs all-positive values, and it pays O(1) space. Prefix sums plus a map assume no monotonicity, so they handle negatives, at O(n) memory. Negatives present, or you are counting rather than finding a best window, means prefix sums."],
    ["What breaks the pattern, and what do you use instead?", "Updates to the array between queries: one write invalidates every prefix after it, forcing an O(n) rebuild. A Fenwick tree or segment tree gives O(log n) per update and per query instead."],
  ],

  p: [
    [1480, "running-sum-of-1d-array", "Running Sum of 1d Array, the build itself", "E"],
    [303, "range-sum-query-immutable", "Range Sum Query, the idea alone", "E"],
    [560, "subarray-sum-equals-k", "Subarray Sum Equals K, the hash map pairing", "M"],
    [974, "subarray-sums-divisible-by-k", "Subarray Sums Divisible by K, group prefixes by remainder", "M"],
    [523, "continuous-subarray-sum", "Continuous Subarray Sum, store the first index per remainder", "M"],
    [304, "range-sum-query-2d-immutable", "Range Sum Query 2D, inclusion exclusion", "M"],
    [1109, "corporate-flight-bookings", "Corporate Flight Bookings, difference array", "M"],
  ],
},

/* ==================================================================== */
{
  id: "kadane",
  n: "Kadane and maximum subarray",
  group: "Patterns",
  one: "At each index there are only two candidates: extend the block that ended one step back, or start a new one here. <b>Keep the better; track the best separately.</b>",

  plain: `<p>You are given an array with positive and negative numbers and asked for the contiguous stretch with the largest total. Contiguous is the hard word: you cannot pick the good numbers and skip the bad ones, so "take all the positives" is not the answer.</p>
<p>Checking every stretch means choosing a start and an end, which is about n squared of them. The trick is to stop asking the question that way. Instead of "what is the best block anywhere", ask "what is the best block that <b>ends exactly at index i</b>". There is only one answer per index, so there are only n answers to find. And each one turns out to depend on nothing but the answer before it.</p>
<p>Because whatever block ends at i, it either includes i-1 or it does not. If it does, it is the best block ending at i-1 with a[i] stuck on the end. If it does not, it is just a[i] on its own. Two candidates, take the larger, move on. That is the entire algorithm, and it fits on two lines.</p>
<p><b>Analogy.</b> Walking a hilly path, keeping a running altitude. Whenever your accumulated total drops below zero, the ground behind you is a net cost to carry, so you drop it and start measuring from where you stand. You still remember the highest point you ever reached.</p>`,

  why: [
    { t: "Start from what brute force wastes", d: "Trying every (start, end) pair is <b>O(n²)</b> once you carry a running sum, and O(n³) if you re-add each block from scratch. But the block from 3 to 7 and the block from 3 to 8 share almost everything. Any time two candidates overlap that heavily, there is a cheaper formulation." },
    { t: "Ask a smaller question with a unique answer", d: "\"The best block anywhere\" has n² candidates. \"The best block <b>ending at index i</b>\" has exactly one answer per index, so the whole problem becomes n small questions. The real answer is then just the largest of those n, which is one more pass, or the same pass." },
    { t: "Each index has exactly two candidates", d: "A block ending at i either contains i-1 or it does not. If it does, it is the best block ending at i-1, extended by a[i]. If it does not, it is a[i] alone. <b>Nothing else can end at i</b>, so comparing those two is not a heuristic, it is exhaustive." },
    { t: "So the recurrence writes itself", d: "cur[i] = max(a[i], cur[i-1] + a[i]). Read it in words: <b>start fresh, or carry the past forward</b>. And carrying is worth it exactly when cur[i-1] is positive, which is the same rule stated a second way." },
    { t: "The table is one variable", d: "cur[i] reads only cur[i-1], and nothing ever looks further back, so the array of subproblems collapses to a single number. This is dynamic programming with the table thrown away, which is why the code has no table in it and does not look like DP." },
    { t: "cur and best are different things", d: "cur is the block ending here and it can decay. best is the record and it never goes down. Keeping one variable for both is the most common bug on this page: you return a running total that has already shrunk past its peak." },
    { t: "Seeding with zero is wrong, and quietly", d: "If every number is negative the best block is the single least-bad element, not the empty block. Initialise cur and best to <b>a[0]</b>, not to 0. Seeding with 0 passes every test that happens to contain a positive number, which is every test you will write by hand." },
  ],

  variants: [
    { n: "Maximum sum", cost: "O(n) time, O(1) space",
      idea: "The plain version. cur = max(a[i], cur + a[i]), best = max(best, cur).",
      when: "Any \"largest contiguous total\" question, and the buy-and-sell-stock family, which is this run on the daily differences.",
      watch: "Seed both variables with a[0]. Seeding with 0 breaks all-negative input and nothing else." },

    { n: "With the indices", cost: "O(n) time, O(1) space",
      idea: "Same loop, plus a start marker. The moment you choose to restart, that index becomes the new left edge; record left and right whenever best improves.",
      when: "The problem wants the block itself, not just its total.",
      watch: "Update the left edge at the restart, not when best improves. By then the restart has already happened and you record the wrong edge." },

    { n: "Maximum product", cost: "O(n) time, O(1) space",
      idea: "Track the running maximum AND the running minimum. A large negative times a new negative becomes the new maximum, so the smallest value has to be carried too.",
      when: "The operation is multiplication, or anything else where a bad value can turn good.",
      watch: "Compute both new values from the OLD pair. Overwriting hi before computing lo uses a value from the wrong step, and it will still pass small tests." },

    { n: "Circular array", cost: "O(n) time, O(1) space",
      idea: "The answer either wraps or it does not. The non-wrapping case is plain Kadane; the wrapping case is the total minus the <b>minimum</b> subarray, found by the same loop with the comparisons flipped.",
      when: "The array is stated to be circular.",
      watch: "If every number is negative, total minus the minimum block is the empty block, which is not allowed. Detect all-negative and return the plain answer." },

    { n: "Two dimensions", cost: "O(rows² · cols)",
      idea: "Fix a top row and a bottom row, collapse the rows between them into one array of column sums, and run Kadane on it. Every pair of row boundaries is tried.",
      when: "Maximum sum rectangle in a matrix.",
      watch: "Build the collapsed array incrementally as the bottom row moves down. Recomputing it from scratch adds a factor of rows for nothing." },
  ],

  viz: ["kadane"],

  hing: `<p><b>Contiguous</b> lafz hi asli dikkat hai. Achhe numbers chun kar bure chhod nahi sakte, isliye "saare positive le lo" answer nahi hai. Har (start, end) try karo to <b>O(n²)</b>, aur ek block aur uske agle block mein 90 percent cheezein same hoti hain. Itna overlap ho to hamesha koi sasta tareeka hota hai.</p>
<p><b>Sawaal badal do.</b> "Sabse achha block kahin bhi" mat poocho. Poocho <b>"sabse achha block jo theek index i par khatam hota hai"</b>. Har index ka sirf ek jawaab hai, to poore problem ke n jawaab hain. Aur jo block i par khatam hota hai, usme ya to i-1 hai ya nahi. Hai to = pichhla best + a[i]. Nahi hai to = sirf a[i]. <b>Do hi candidate</b>, bada wala le lo. Bas, algorithm khatam.</p>
<p><b>Do variables alag rakho, yeh sabse badi galti hai.</b> <code>cur</code> woh block hai jo yahan khatam hota hai, aur woh <b>ghat sakta hai</b>. <code>best</code> record hai, woh kabhi neeche nahi jaata. Ek hi variable mein dono karoge to aakhir mein ghata hua total return kar doge.</p>
<p><b>Aur zero se shuru mat karna.</b> Agar saare numbers negative hain, jawaab sabse kam bura ek element hai, khaali block nahi. <code>cur = best = a[0]</code> se shuru karo. Zero waala version har us test mein pass ho jaata hai jisme ek bhi positive number ho, matlab har test jo tum khud banaoge. Interview mein yeh edge case khud bol do, poochne se pehle.</p>`,

  math: [
    { t: "The recurrence, from the only two candidates there are", d: "Asking for the best subarray ending at i is what makes the choice binary, and a binary choice is a recurrence you can write in one line.", w:
`best[i] = the best subarray sum ENDING at index i

it either extends the block ending at i-1, or starts here:

  best[i] = max( a[i],  best[i-1] + a[i] )
          = a[i] + max(0, best[i-1])

answer = max over all i of best[i]

"the best in a[0..i]" has no such recurrence, which is
why the ending-at-i phrasing is the whole trick` },
    { t: "Worked on a real array", d: "Six values, one pass. The two decisions that matter are the step that starts fresh and the step that extends.", w:
`a       = [ -2,  3, -1,  4, -3,  2 ]
best[i] =   -2,  3,  2,  6,  3,  5
answer  =   -2,  3,  3,  6,  6,  6

i = 1:  max(3, -2 + 3 = 1)  = 3     start fresh
i = 2:  max(-1, 3 - 1 = 2)  = 2     extend
i = 3:  max(4, 2 + 4 = 6)   = 6     extend
i = 4:  max(-3, 6 - 3 = 3)  = 3     extend, and drop
                                    below the best so far

answer 6, from the subarray [3, -1, 4]` },
    { t: "Against the two brute forces", d: "There are two obvious approaches before this one, and both are quadratic or worse. The step from the second to Kadane is the one being tested.", w:
`all subarrays, summing each:   n(n+1)/2 subarrays,
                               n^3 / 6 additions
prefix sums, then all pairs:   n^2 / 2
Kadane:                        n

n = 10^5:
  1.7 x 10^14   |   5 x 10^9   |   10^5` },
    { t: "Seeding with zero, and the input that exposes it", d: "The zero start silently allows the empty subarray. It is correct only if the problem says empty is allowed, and it almost never does.", w:
`a = [-3, -1, -7]

cur = 0, best = 0   ->  answer 0, an EMPTY subarray
cur = a[0], best = a[0], loop from i = 1  ->  answer -1

-1 is right: the best non-empty subarray is [-1]

this only shows up when every element is negative,
which is the case a hand-written test leaves out` },
  ],

  costs: [
    ["Kadane, one pass", "O(n) time, O(1) space", "each index answers its own question from the previous one, so nothing is stored"],
    ["brute force over every block", "O(n²)", "choose a start and an end, carrying a running sum so the inner loop stays O(1) per step"],
    ["brute force, re-adding each block", "O(n³)", "the version people write first, and the one the constraints are set to reject"],
    ["prefix sums plus a running minimum", "O(n) time, O(n) space", "the same answer as max over r of pre[r+1] minus the smallest earlier prefix, and it handles the empty block cleanly"],
    ["recovering the indices", "O(n), no extra space", "one more variable for the left edge, updated at the restart rather than at the improvement"],
    ["maximum product variant", "O(n) time, O(1) space", "two running values instead of one, because a negative can become the maximum"],
    ["maximum rectangle in a matrix", "O(rows² · cols)", "every pair of row boundaries collapses to one array, and each collapsed array is one Kadane"],
  ],

  traps: [
    "<b>Seeding cur and best with 0.</b> An all-negative array then answers 0, an empty block, which the problem did not allow. Seed with <code>a[0]</code> and start the loop at index 1.",
    "<b>Using one variable for cur and best.</b> The running block decays after its peak, so returning it returns a number that was correct several indices ago.",
    "<b>Updating best before cur.</b> The order in the loop is: recompute cur for this index, then compare it against best. Reversed, best is always one step stale.",
    "<b>Recording the left edge when best improves.</b> The edge was set at the last restart, which may have been far earlier. Capture it there, and only copy it into the answer when best improves.",
    "<b>Reaching for Kadane on a non-contiguous problem.</b> If elements may be skipped, this is not the algorithm; that is house robber, a different recurrence with the same shape.",
    "<b>Overflow in fixed-width languages.</b> 10^5 elements near 10^9 each sum past 2^31. In Java and C++ the running total wants a 64-bit type, and the wrap is silent.",
  ],

  impl: [
    ["Python", "max(x, cur + x)", "Integers are unbounded, so overflow never arises. cur = max(...) reads exactly like the recurrence, which is worth keeping."],
    ["Java", "Math.max", "Math.max(int, int) returns int, so a long accumulator needs Math.max((long) a[i], cur + a[i]) or it truncates silently."],
    ["C++", "std::max", "std::max needs both arguments of the same type. Mixing an int element with a long long accumulator is a compile error, which is the kind one to have."],
    ["JavaScript", "Math.max", "Numbers are doubles, exact only to 2^53. Beyond that use BigInt, though no interview array will get you there."],
  ],

  code: {
    pseudo: `# TWO VARIABLES. cur is the best block ENDING here; best is the record.
cur  <- a[0]
best <- a[0]                    # NOT 0: an all-negative array has no empty block
for i from 1 to n-1:
    cur  <- max(a[i], cur + a[i])       # start fresh here, or extend the past
    best <- max(best, cur)              # best is separate, and never decreases
return best

# Read as DP:  dp[i] = max(a[i], dp[i-1] + a[i])
# Only dp[i-1] is ever read, so the whole table collapses to one variable.

# WANT THE BLOCK ITSELF? The restart IS the new left edge.
start <- 0
for i from 1 to n-1:
    if cur + a[i] < a[i]:  cur <- a[i];  start <- i      # restart
    else:                  cur <- cur + a[i]             # extend
    if cur > best:         best <- cur;  L <- start;  R <- i

# CIRCULAR: the wrapping answer is total - (the MINIMUM subarray).
# Run Kadane twice, once for max and once for min, and guard the case where
# every number is negative, because then "total - min" is the empty block.`,

    py: `def max_subarray(a):                  # Kadane. O(n) time, O(1) space.
    cur = best = a[0]                 # NOT 0: [-3, -1] must answer -1
    for x in a[1:]:
        cur = max(x, cur + x)         # restart here, or extend the last block
        best = max(best, cur)         # tracked SEPARATELY: cur can decay
    return best

def max_subarray_indices(a):          # the same loop, plus bookkeeping
    cur = best = a[0]
    start = left = right = 0
    for i in range(1, len(a)):
        if cur + a[i] < a[i]:         # the restart is the new left edge,
            cur, start = a[i], i      # so record it HERE, not on improvement
        else:
            cur += a[i]
        if cur > best:
            best, left, right = cur, start, i
    return best, left, right

# Buying and selling a stock once IS Kadane on the daily differences.
def max_profit(prices):
    cheapest, best = prices[0], 0     # 0 is right here: doing nothing is legal
    for p in prices[1:]:
        best = max(best, p - cheapest)      # sell today
        cheapest = min(cheapest, p)         # or move the buy day forward
    return best

# CIRCULAR: max of (plain Kadane) and (total minus the minimum subarray).
def max_circular(a):
    total = sum(a)
    best = worst = cur_hi = cur_lo = a[0]
    for x in a[1:]:
        cur_hi = max(x, cur_hi + x); best  = max(best, cur_hi)
        cur_lo = min(x, cur_lo + x); worst = min(worst, cur_lo)
    if best < 0: return best          # all negative: the wrap block is empty
    return max(best, total - worst)`,

    java: `int maxSubarray(int[] a) {
    int cur = a[0], best = a[0];      // not 0, or an all-negative array breaks
    for (int i = 1; i < a.length; i++) {
        cur  = Math.max(a[i], cur + a[i]);
        best = Math.max(best, cur);   // recompute cur FIRST, then compare
    }
    return best;
}

// OVERFLOW. 10^5 values near 10^9 sum past 2^31, and int wraps in silence.
// If the constraints allow it, the accumulator must be long, and the cast
// on the first argument is not optional: Math.max(int, int) returns int.
long maxSubarrayLong(int[] a) {
    long cur = a[0], best = a[0];
    for (int i = 1; i < a.length; i++) {
        cur  = Math.max((long) a[i], cur + a[i]);
        best = Math.max(best, cur);
    }
    return best;
}

int maxProfit(int[] prices) {         // Kadane on the differences
    int cheapest = prices[0], best = 0;
    for (int p : prices) {
        best = Math.max(best, p - cheapest);
        cheapest = Math.min(cheapest, p);
    }
    return best;
}`,

    cpp: `int maxSubarray(vector<int>& a) {
    int cur = a[0], best = a[0];
    for (size_t i = 1; i < a.size(); i++) {
        cur  = max(a[i], cur + a[i]);
        best = max(best, cur);
    }
    return best;
}

// std::max requires both arguments to have the SAME type, so mixing an int
// element with a long long accumulator will not compile. Say the type once.
long long maxSubarrayLL(vector<int>& a) {
    long long cur = a[0], best = a[0];
    for (size_t i = 1; i < a.size(); i++) {
        cur  = max<long long>(a[i], cur + a[i]);
        best = max(best, cur);
    }
    return best;
}

// MAXIMUM PRODUCT: carry the minimum too, because a large negative times a
// new negative is suddenly the maximum. Both new values read the OLD pair.
int maxProduct(vector<int>& a) {
    int hi = a[0], lo = a[0], best = a[0];
    for (size_t i = 1; i < a.size(); i++) {
        int x = a[i], prevHi = hi, prevLo = lo;
        hi = max({x, prevHi * x, prevLo * x});
        lo = min({x, prevHi * x, prevLo * x});
        best = max(best, hi);
    }
    return best;
}`,

    js: `function maxSubarray(a) {
  let cur = a[0], best = a[0];        // seeding with 0 breaks all-negative
  for (let i = 1; i < a.length; i++) {
    cur  = Math.max(a[i], cur + a[i]);
    best = Math.max(best, cur);
  }
  return best;
}

// MAXIMUM PRODUCT needs two running values. Snapshot the old pair first:
// overwriting hi before computing lo mixes values from different steps and
// still passes every short test you will try by hand.
function maxProduct(a) {
  let hi = a[0], lo = a[0], best = a[0];
  for (let i = 1; i < a.length; i++) {
    const x = a[i], cands = [x, hi * x, lo * x];
    hi = Math.max(...cands);
    lo = Math.min(...cands);
    best = Math.max(best, hi);
  }
  return best;
}

// The one-liner. Correct, O(n), and harder to debug at 2am than the loop.
const kadane = (a) => a.slice(1).reduce(([cur, best], x) => {
  const c = Math.max(x, cur + x);
  return [c, Math.max(best, c)];
}, [a[0], a[0]])[1];`,
  },
  codecap: "Two lines carry the whole algorithm; everything else on this page is the same two lines with something extra remembered. If you can only keep one thing, keep this: cur may decay, best may not, and they are never the same variable.",

  q: [
    ["Why does asking for \"the best block ending at index i\" make the problem easier?", "Because there is exactly one answer per index rather than n² across the array, and that answer depends only on the answer at i-1. It turns a search over pairs into a single scan."],
    ["Why are two candidates enough at each index?", "A block that ends at i either contains i-1 or it does not. If it does, the best such block is the best block ending at i-1 plus a[i]. If it does not, it is a[i] alone. There is no third shape, so comparing two is exhaustive, not a heuristic."],
    ["When is it worth carrying the previous block forward?", "Exactly when the previous running total is positive. A positive carry can only help; a negative carry is a cost that any fresh start avoids. That is why max(a[i], cur + a[i]) and \"reset when cur goes negative\" are the same rule."],
    ["Why must cur and best be separate variables?", "cur is the best block ending at the current index and it shrinks whenever the numbers turn bad. best is a record of the highest cur ever reached. Merging them returns a total that has already decayed past its peak."],
    ["What breaks if you initialise both to 0?", "An all-negative array returns 0, an empty block, which the problem does not permit. Seeding with a[0] fixes it. The bug survives every hand-written test, because those tests always happen to contain a positive number."],
    ["Where is the dynamic programming, given there is no table?", "The recurrence dp[i] = max(a[i], dp[i-1] + a[i]) is the DP. Because dp[i] reads only dp[i-1] and nothing looks further back, the table collapses to one variable. It is the standard space reduction, applied so aggressively the table disappears."],
    ["Why does maximum product need two running values instead of one?", "Multiplying by a negative swaps the order: the smallest running value becomes the largest. So the minimum has to be carried alongside the maximum, and both new values must be computed from the previous pair, not from each other."],
  ],

  p: [
    [121, "best-time-to-buy-and-sell-stock", "Buy and Sell Stock, Kadane on the differences", "E"],
    [53, "maximum-subarray", "Maximum Subarray, the archetype", "M"],
    [1749, "maximum-absolute-sum-of-any-subarray", "Maximum Absolute Sum, run it twice", "M"],
    [918, "maximum-sum-circular-subarray", "Circular, and the all-negative trap", "M"],
    [152, "maximum-product-subarray", "Maximum Product, carry the minimum too", "M"],
    [1567, "maximum-length-of-subarray-with-positive-product", "Positive Product, the same scan on sign", "M"],
    [689, "maximum-sum-of-3-non-overlapping-subarrays", "Three blocks at once, prefix best from both ends", "H"],
  ],
},

/* ==================================================================== */
{
  id: "sliding-window",
  n: "Sliding Window",
  group: "Patterns",
  one: "Consecutive windows <b>overlap</b>, so never recompute one from scratch: subtract what leaves, add what joins. O(n·k) becomes O(n).",

  plain: `<p>The problem: find the best <b>contiguous</b> stretch, meaning a run of items sitting next to each other with no gaps. The largest sum of 3 in a row. The longest substring with no repeats. The shortest subarray reaching a target.</p>
<p>The obvious solution examines every stretch and scores it from scratch, O(n·k), or O(n²). But look at what it repeats: the window covering positions 1–3 and the window covering 2–4 <b>share positions 2 and 3</b>. Re-adding them is pure waste.</p>
<p>So keep a running answer and update it at the edges only. When the window slides right, <b>subtract the element that left and add the one that joined</b>. Two operations per step instead of k, no matter how wide the window is.</p>
<p><b>Analogy.</b> Counting people in a moving train carriage. You do not recount all 60 passengers each time the carriage moves. You count who got off and who got on, and adjust.</p>`,

  why: [
    { t: "Neighbouring windows share almost everything",
      d: "Positions 1–3 and positions 2–4 have 2 and 3 in common. Recomputing each window from scratch re-reads those shared items every single time. That repeated reading is the entire waste." },
    { t: "So only update at the edges",
      d: "When the window slides, one item leaves on the left and one joins on the right. Subtract the leaver, add the joiner. Two operations per step, no matter how wide the window is, and O(n·k) becomes <b>O(n)</b>." },
    { t: "This only works if the value can be added and removed cheaply",
      d: "Sums, counts and frequency maps can. A <b>maximum</b> cannot, if the item leaving <i>is</i> the maximum, you have to look at everything again. Ask this before you write any code; it is why \"sliding window maximum\" needs an extra structure." },
    { t: "If the size is not given, grow and shrink instead",
      d: "Sometimes the rule is a condition rather than a size: \"no repeated letters\", or \"sum at least target\". Then push the right edge out greedily. Whenever the window breaks the rule, pull the left edge in until it holds again." },
    { t: "Two loops, and still O(n)",
      d: "The inner loop looks like it makes this O(n²), but the left edge <b>never moves backwards</b>. Across the whole run it can only advance n times, and so can the right edge, at most 2n moves total. Saying this out loud is what the interviewer is waiting for." },
    { t: "Only for contiguous stretches",
      d: "If the items you want do not have to be next to each other, this pattern does not apply at all. That is a hash-map or DP problem." },
  ],

  hing: `<p><b>Problem ki shakal:</b> koi <b>laga-taar (contiguous)</b> hissa dhoondhna hai, sabse bada sum, sabse lambi substring bina repeat ke, sabse chhota subarray jiska sum target tak pahunche.</p>
<p><b>Brute force kya galti karta hai?</b> Har window ko <b>shuru se</b> phir se jodta hai. Par dekho: window 1–3 aur window 2–4 mein <b>2 aur 3 dono common hain</b>. Unhe dobara jodna bilkul bekaar mehnat hai.</p>
<p><b>Asli idea:</b> running answer rakho aur sirf <b>kinare</b> update karo, jo element bahar gaya use <b>ghatao</b>, jo naya aaya use <b>jodo</b>. Har step par 2 operations, chahe window kitni bhi chaudi ho. O(n·k) → <b>O(n)</b>.</p>
<p><b>Ek shart hai (yeh miss mat karna):</b> tumhara window ka statistic add/remove se O(1) mein update hona chahiye. Sum, count, frequency map, theek hain. <b>Maximum theek nahi hai</b>, agar current maximum hi bahar chala gaya to dobara poori window scan karni padegi. Isiliye "sliding window maximum" ke liye monotonic deque chahiye hoti hai.</p>
<p><b>Do type hote hain:</b><br>1. <b>Fixed size</b>, k diya hua hai. Dono kinare saath mein ek kadam chalte hain.<br>2. <b>Variable size</b>, size nahi, <b>condition</b> di hai. Right ko badhate raho jab tak condition tootey nahi; tootne par left ko aage badhao jab tak wapas theek na ho jaaye.</p>
<p><b>Sabse zaroori sawaal. Do loops hain, phir O(n) kaise?</b> Kyunki <b>L kabhi peeche nahi jaata</b>. Poore program mein L zyada se zyada n baar aage badhega, aur R bhi n baar. Total ≤ 2n moves → <b>O(n)</b>. Interview mein yahi amortised reasoning bolna hai, warna log O(n²) bol dete hain.</p>
<p><b>Kaise pehchane?</b> Do signal ek saath: (1) answer <b>contiguous</b> hai, subsequence nahi, aur (2) max/min/count nikaalna hai kisi condition ke saath. Agar elements ko adjacent hone ki zaroorat nahi, to yeh sliding window nahi hai, woh hash map ya DP hai.</p>
<p><b>Negative numbers ka trap:</b> "sum ≥ target wala sabse chhota subarray" mein hum maante hain ki window badhne se sum badhta hai. Negative numbers ke saath yeh maan-na galat ho jaata hai, tab prefix sum + monotonic deque chahiye. Constraints padhna zaroori hai.</p>`,

  viz: ["sliding-window", "sliding-window-var"],

  math: [
    { t: "The overlap, counted", d: "Two neighbouring windows differ by two elements out of k. Recomputing means re-adding the k-2 that did not change.", w:
`window of size k over n items

recompute each window:  (n - k + 1) x k
slide instead:          n adds + n removes = 2n

n = 10^6, k = 1000:
  10^9    vs    2 x 10^6

the two windows share k - 1 of their k elements` },
    { t: "The condition: both edges must be cheap", d: "Sliding works when the value can be repaired at the edges. When removal is expensive, the pattern needs a different structure behind it.", w:
`sum        add O(1)   remove O(1)   works
count      add O(1)   remove O(1)   works
distinct   add O(1)   remove O(1)   with a count map
max        add O(1)   remove O(k)   does NOT
                                    -> monotonic deque,
                                       amortised O(1)

if the remove is O(k) the window is not the answer` },
    { t: "Two loops, and still linear: the sentence they listen for", d: "A while loop inside a for loop looks quadratic. It is not, because the inner pointer never goes backwards.", w:
`for r in 0 .. n-1:
    add a[r]
    while the window is invalid:
        remove a[l];  l += 1

l starts at 0, only increases, and stops at n
so the inner loop body runs at most n times IN TOTAL,
not n times per r

total pointer moves <= 2n  ->  O(n)` },
    { t: "The shape it cannot handle", d: "Windows are contiguous and the shrink rule assumes the validity is monotone. Break either assumption and the pattern silently returns the wrong answer.", w:
`subarrays of n:      n(n+1)/2       contiguous
subsequences of n:   2^n            not contiguous

with negative numbers, adding an element can make a sum
smaller, so "shrink while invalid" is no longer monotone

n = 20:  210 subarrays  vs  1,048,576 subsequences
for the negative case use prefix sums and a hash map` },
  ],

  costs: [
    ["fixed-size window", "O(n) time · O(1) space", "each element enters once, leaves once"],
    ["variable window + frequency map", "O(n) time · O(k) space", "k = distinct values held in the window"],
    ["brute force over all windows", "O(n·k) / O(n²)", "what you are replacing"],
    ["window maximum", "O(n) with a monotonic deque", "max is not removable in O(1), needs extra structure"],
    ["substring with a 26-letter alphabet", "O(n) · O(1) space", "a fixed-size count array, not a growing map"],
  ],

  traps: [
    "<b>Shrinking with <code>if</code> instead of <code>while</code>.</b> One removal may not restore the condition. You often must shrink several times.",
    "<b>Recording the answer at the wrong moment.</b> For a maximum, record while the window is <i>valid</i>; for a minimum, record after each successful shrink. Decide before you code.",
    "<b>Forgetting to clean the frequency map.</b> Delete keys whose count hits 0, or 'number of distinct values' silently becomes wrong.",
    "<b>Applying it to subsequences.</b> Sliding window is only for <b>contiguous</b> ranges.",
    "<b>Assuming growth is monotonic with negative numbers.</b> The whole shrink rule collapses, check the constraints.",
  ],

  impl: [
    ["Python", "dict / collections.Counter / deque", "del freq[c] when the count hits 0; Counter keeps zero entries and breaks len()."],
    ["Java", "HashMap<Character,Integer> / int[128]", "map.remove(c) at zero; an int[] alphabet array is much faster than boxing."],
    ["C++", "unordered_map / array<int,128>", "erase() at zero; prefer a fixed array when the alphabet is small."],
    ["JavaScript", "Map / plain object / Set", "Use a Map (delete at zero), object keys stringify and Set has no counts."],
  ],

  code: {
    pseudo: `# --- FIXED size k -------------------------------------------------
# Every element joins once and leaves once -> O(n)
sum <- sum of first k elements
best <- sum
for r from k to n-1:
    sum <- sum + a[r] - a[r-k]     # joiner in, leaver out. 2 ops, not k.
    best <- max(best, sum)

# --- VARIABLE size, condition-driven ------------------------------
# L never moves backwards -> total moves <= 2n -> O(n)
L <- 0
for R from 0 to n-1:
    add a[R] to the window
    while window is INVALID:       # while, not if
        remove a[L] from the window
        L <- L + 1
    best <- max(best, R - L + 1)   # record while valid (for a MAXIMUM)`,
    py: `# Fixed size: max sum of k consecutive
def max_sum_k(a, k):
    s = sum(a[:k]); best = s
    for r in range(k, len(a)):
        s += a[r] - a[r-k]           # add joiner, drop leaver
        best = max(best, s)
    return best

# Variable size: longest substring without repeating characters
def longest_unique(s):
    last, L, best = {}, 0, 0
    for R, c in enumerate(s):
        if c in last and last[c] >= L:
            L = last[c] + 1          # jump L past the previous copy
        last[c] = R
        best = max(best, R - L + 1)
    return best

# Variable size: shortest subarray with sum >= target (positives only)
def min_len(target, a):
    L, cur, best = 0, 0, float('inf')
    for R, x in enumerate(a):
        cur += x
        while cur >= target:         # while, not if
            best = min(best, R - L + 1)
            cur -= a[L]; L += 1
    return 0 if best == float('inf') else best`,
    java: `// Fixed size
static int maxSumK(int[] a, int k) {
    int s = 0;
    for (int i = 0; i < k; i++) s += a[i];
    int best = s;
    for (int r = k; r < a.length; r++) {
        s += a[r] - a[r - k];
        best = Math.max(best, s);
    }
    return best;
}

// Variable size: longest substring without repeats
static int longestUnique(String s) {
    Map<Character,Integer> last = new HashMap<>();
    int L = 0, best = 0;
    for (int R = 0; R < s.length(); R++) {
        char c = s.charAt(R);
        if (last.containsKey(c) && last.get(c) >= L) L = last.get(c) + 1;
        last.put(c, R);
        best = Math.max(best, R - L + 1);
    }
    return best;
}

// Variable size: shortest subarray with sum >= target
static int minLen(int target, int[] a) {
    int L = 0, cur = 0, best = Integer.MAX_VALUE;
    for (int R = 0; R < a.length; R++) {
        cur += a[R];
        while (cur >= target) {
            best = Math.min(best, R - L + 1);
            cur -= a[L++];
        }
    }
    return best == Integer.MAX_VALUE ? 0 : best;
}`,
    cpp: `// Fixed size
int maxSumK(vector<int>& a, int k) {
    int s = accumulate(a.begin(), a.begin() + k, 0), best = s;
    for (int r = k; r < (int)a.size(); ++r) {
        s += a[r] - a[r - k];
        best = max(best, s);
    }
    return best;
}

// Variable size: longest substring without repeats
int longestUnique(const string& s) {
    vector<int> last(128, -1);
    int L = 0, best = 0;
    for (int R = 0; R < (int)s.size(); ++R) {
        if (last[s[R]] >= L) L = last[s[R]] + 1;
        last[s[R]] = R;
        best = max(best, R - L + 1);
    }
    return best;
}

// Variable size: shortest subarray with sum >= target
int minLen(int target, vector<int>& a) {
    int L = 0, cur = 0, best = INT_MAX;
    for (int R = 0; R < (int)a.size(); ++R) {
        cur += a[R];
        while (cur >= target) { best = min(best, R - L + 1); cur -= a[L++]; }
    }
    return best == INT_MAX ? 0 : best;
}`,
    js: `// Fixed size
function maxSumK(a, k) {
  let s = 0;
  for (let i = 0; i < k; i++) s += a[i];
  let best = s;
  for (let r = k; r < a.length; r++) {
    s += a[r] - a[r - k];
    best = Math.max(best, s);
  }
  return best;
}

// Variable size: longest substring without repeats
function longestUnique(s) {
  const last = new Map();
  let L = 0, best = 0;
  for (let R = 0; R < s.length; R++) {
    const c = s[R];
    if (last.has(c) && last.get(c) >= L) L = last.get(c) + 1;
    last.set(c, R);
    best = Math.max(best, R - L + 1);
  }
  return best;
}

// Variable size: shortest subarray with sum >= target
function minLen(target, a) {
  let L = 0, cur = 0, best = Infinity;
  for (let R = 0; R < a.length; R++) {
    cur += a[R];
    while (cur >= target) { best = Math.min(best, R - L + 1); cur -= a[L++]; }
  }
  return best === Infinity ? 0 : best;
}`,
  },
  codecap: "Two templates cover the whole pattern: the fixed slide, and grow-then-shrink-while-invalid.",

  q: [
    ["What waste does a sliding window remove?", "Consecutive windows overlap in all but two elements, so recomputing each from scratch re-reads shared elements. The window updates only at the edges."],
    ["What must be true of the window statistic for this pattern to work?", "It must be updatable in O(1) on add and on remove, sums, counts and frequency maps qualify; maximum does not, which is why window-maximum needs a monotonic deque."],
    ["Two nested loops. Why is it still O(n)?", "The left pointer never moves backwards, so across the entire run it advances at most n times. Right advances at most n times too, giving ≤ 2n moves total."],
    ["When do you grow versus shrink in a variable window?", "Grow the right edge greedily; while the window violates the condition, shrink from the left. Use while, not if, because one removal may not be enough."],
    ["What two signals in a problem statement point to sliding window?", "The answer is a contiguous subarray/substring (not a subsequence), and you want a max/min/count subject to a condition."],
    ["Why do negative numbers break the 'shortest subarray with sum ≥ target' window?", "The logic assumes growing the window increases the sum. With negatives the condition is no longer monotonic, so prefix sums with a monotonic deque are required instead."],
  ],

  p: [
    [643, "maximum-average-subarray-i", "Max Average Subarray, fixed window", "E"],
    [3, "longest-substring-without-repeating-characters", "Longest Substring Without Repeats", "M"],
    [209, "minimum-size-subarray-sum", "Minimum Size Subarray Sum", "M"],
    [424, "longest-repeating-character-replacement", "Longest Repeating Character Replacement", "M"],
    [567, "permutation-in-string", "Permutation in String", "M"],
    [76, "minimum-window-substring", "Minimum Window Substring", "H"],
    [239, "sliding-window-maximum", "Sliding Window Maximum, monotonic deque", "H"],
  ],
},

/* ==================================================================== */
{
  id: "monotonic-stack",
  n: "Monotonic stack and deque",
  group: "Patterns",
  one: "A bigger value arriving makes every smaller value behind it <b>dead forever</b>, so pop it. Each index is pushed once and popped once: O(n²) becomes <b>O(n)</b>.",

  plain: `<p>The problem always has the same shape. <b>For each element, find the next element to its right that is bigger.</b> Or smaller. Or the nearest one to its left. Days until a warmer day. The next larger stock price. How far a bar in a histogram can stretch before a shorter bar stops it.</p>
<p>The obvious solution walks right from every position until it finds the answer, O(n²), and it re-reads the same tail over and over. The waste is not the scanning, it is that the scan keeps considering elements that <b>cannot possibly be the answer for anybody</b>.</p>
<p>Here is why. Suppose <code>b</code> sits after <code>a</code> and <code>b</code> is bigger. Then <code>a</code> is finished: for every position further right, <code>b</code> stands in the way and <code>b</code> is the better answer anyway. So <code>a</code> can be thrown away the moment <code>b</code> arrives, permanently. Keep only the elements nothing has blocked yet, and that leftover pile is automatically in decreasing order. Nobody sorted it. The discarding did.</p>
<p><b>Analogy.</b> A queue of people waiting, seen from the back. Once someone taller joins behind you, nobody further back will ever see you again. The people still visible from the back of the line are always in decreasing height, and no one had to arrange them.</p>`,

  why: [
    { t: "Start from the question, not the structure",
      d: "\"For each element, the next one bigger than it.\" The obvious answer scans right from every index, which is O(n²) in the worst case. And the worst case is an array sorted downwards, which is not exotic." },
    { t: "One element can kill another, forever",
      d: "Say <code>b</code> comes after <code>a</code> and <code>b</code> is bigger. Then <code>a</code> is never anyone's next-greater again. For anything further right, <code>b</code> stands in the way, and <code>b</code> is the better candidate anyway. So <code>a</code> is not deferred, it is <b>discarded</b>." },
    { t: "What survives is already sorted",
      d: "Keep only the elements nothing has blocked yet. Every survivor is bigger than everything after it that is still alive, so the pile is in decreasing order by construction. That is where the word <i>monotonic</i> comes from, and it is a consequence, not a rule you enforce." },
    { t: "The newcomer is the answer for everything it kills",
      d: "When <code>x</code> arrives and you pop the survivors smaller than it, you are not just tidying up. <code>x</code> is precisely the <b>next greater element</b> of every single one of them, so record the answer as you pop. One pass, and the pops write the whole answer array." },
    { t: "Two loops, still O(n), and this is the bit they listen for",
      d: "Each index is pushed exactly once and popped at most once. So the inner while loop runs <b>at most n times in total across the entire outer loop</b>, not n times per iteration. Around 2n operations, therefore <b>O(n)</b>. Say it in those words; \"amortised\" on its own is not an argument." },
    { t: "Four directions, two knobs",
      d: "<b>Next</b> means scan left to right, <b>previous</b> means scan right to left. <b>Greater</b> means pop while the top is smaller, <b>smaller</b> means pop while the top is bigger. That is the whole family. Store <b>indices</b>, not values: the question is usually how far away the answer is, and an index gives you both." },
    { t: "It cannot handle things leaving from the front",
      d: "A stack only discards from the end you push to. In sliding window maximum, the current maximum expires off the <b>front</b> of the window while it is still the largest thing you hold. A stack has no way to reach it. You need to discard at both ends, which is a <b>deque</b>. Same discarding logic, one extra exit." },
  ],

  hing: `<p><b>Sawaal ki shakal hamesha ek hi hoti hai:</b> har element ke liye uske right mein <b>agla bada</b> (ya chhota, ya left wala nazdeeki) element dhoondho. Daily Temperatures, Stock Span, Largest Rectangle, teeno wahi ek sawaal hain alag kapdon mein.</p>
<p><b>Asli insight (yahi poora topic hai):</b> agar <code>b</code>, <code>a</code> ke baad aaya aur <code>b</code> bada hai, to <code>a</code> ab <b>kisi ka bhi</b> next greater nahi ban sakta. Kyun? Kyunki aage waale har element ke liye <code>b</code> raaste mein khada hai, aur <code>b</code> behtar candidate bhi hai. Matlab <code>a</code> ko baad ke liye rakhna nahi hai, <b>hamesha ke liye phenk dena hai</b>. Stack mein sirf woh log bachte hain jinhe abhi tak kisi ne block nahi kiya, aur isiliye stack apne aap <b>decreasing order</b> mein rehta hai. Kisi ne sort nahi kiya, phenkne se apne aap ho gaya.</p>
<p><b>Answer kahaan se aata hai?</b> Jab naya <code>x</code> aata hai aur tum chhote elements pop kar rahe ho, to <code>x</code> hi un sab ka answer hai. Pop karte waqt likh do, bas. Ek hi pass mein poora answer array bhar jaata hai.</p>
<p><b>Interview ka sabse zaroori line:</b> "do loops hain to O(n²) hoga na?" Nahi. <b>Har index ek baar push hota hai aur zyada se zyada ek baar pop</b>. Isliye inner while poore program mein milakar n baar se zyada nahi chalta, har iteration mein n baar nahi. Total ~2n operations, <b>O(n)</b>. Yeh line bolna zaroori hai, sirf "amortised" keh dene se baat nahi banti.</p>
<p><b>Chaar directions, sirf do knobs:</b><br>next = left se right scan, previous = right se left scan.<br>greater = jab tak top chhota hai pop karo, smaller = jab tak top bada hai pop karo.</p>
<p><b>Aur ek aadat: indices store karo, values nahi.</b> Zyadatar sawaal distance poochhte hain, jaise kitne din baad. Index rakha to value bhi mil hi jaayegi.</p>
<p><b>Ties ka trap:</b> equal elements par pop karoge ya chhod doge, yeh decide karta hai ki answer "strictly greater" hai ya "greater ya equal". Daily Temperatures mein <b>strictly warmer</b> chahiye, to equal ko pop mat karo.</p>
<p><b>Ab deque kab chahiye?</b> Window maximum mein current max <b>window ke aage se</b> bahar nikal jaata hai, jabki woh abhi bhi sabse bada hai. Stack us end tak pahunch hi nahi sakta, kyunki stack sirf ek hi taraf se nikaalta hai. Isliye <b>deque</b>. Peeche se chhote elements pop karo, woh chhote bhi hain aur purane bhi. Aage se woh index nikaal do jo window se bahar ho chuka hai. Front hamesha window ka maximum hota hai.</p>
<p><b>Largest Rectangle ka sentinel trick:</b> loop khatam hone ke baad stack mein kuch elements bache reh jaate hain jinka rectangle abhi nikala hi nahi gaya. Isliye aakhir mein ek <b>0 height</b> ka fake bar lagao. Woh sabse chhota hai, to sab kuch pop ho jaayega, aur alag se drain karne wala loop likhne ki zaroorat nahi padegi.</p>`,

  viz: ["monotonic-stack"],

  math: [
    { t: "Each index is pushed once and popped once", d: "The inner while loop can run a long time on one step. What matters is its total across the whole scan, and that is bounded by the number of pushes.", w:
`n elements, one stack

pushes:  exactly n, one per element
pops:    at most n, since nothing is pushed twice

the inner while may pop n-1 items on a single step,
but only because n-1 pushes already happened

total stack operations <= 2n   ->   O(n)` },
    { t: "Against the nested scan", d: "Next-greater-element is the canonical use, and the naive version is the triangular sum that appears everywhere in this file.", w:
`next greater element for every index

scan right from each i:  (n-1) + (n-2) + ... = n^2 / 2
monotonic stack:         2n

n = 10^5:   5 x 10^9   vs   2 x 10^5` },
    { t: "Why popping is safe, stated as a fact about the future", d: "The pop is not a tidy-up. It is a proof that the popped index can never be the answer for anything still to come.", w:
`the stack holds indices with decreasing values
a new value v = a[i] arrives and pops index j, a[j] <= v

for any future index k > i:
  a[j] <= v = a[i],  and  i is closer to k than j is

so j loses to i on both value and distance: j can never
be the answer for k. Deleting it loses nothing.` },
    { t: "Largest rectangle, which is the version they ask", d: "Each bar's rectangle is bounded by the nearest strictly smaller bar on each side. Two monotonic passes give both, so the whole thing stays linear.", w:
`for each bar i:  area = height[i] x (right - left - 1)
  left  = index of the nearest smaller bar to the left
  right = index of the nearest smaller bar to the right

both arrays: one monotonic pass each, n pushes, n pops
total O(n) time, O(n) space

expanding outward from every bar instead: n^2 / 2
n = 10^5:  5 x 10^9  vs  4 x 10^5` },
  ],

  costs: [
    ["next greater over n elements", "O(n)", "each index pushed once, popped at most once, about 2n ops"],
    ["the inner while loop", "O(1) amortised", "it can only remove what some earlier push paid for"],
    ["naive scan from every index", "O(n²)", "the same tail is re-read once per element to its left"],
    ["stack space", "O(n)", "a strictly increasing input never pops, so everything is held"],
    ["sliding window maximum", "O(n) time, O(k) space", "the deque holds only candidates still inside the window"],
    ["largest rectangle in histogram", "O(n)", "same 2n budget, the sentinel just pays for the final pops"],
  ],

  traps: [
    "<b>Storing values instead of indices.</b> Then the question turns out to be \"how many days until\", and you have thrown away the only thing that answers it. Push indices, read the value through the array.",
    "<b>Getting ties wrong.</b> Popping on equal gives you the next <i>strictly</i> greater; keeping on equal gives greater-or-equal. Daily Temperatures wants strictly warmer, so equal values must not pop each other. Nothing crashes, the answers are just quietly wrong.",
    "<b>Ignoring what is left on the stack.</b> Whatever survives the loop never found an answer. Pre-fill the result with -1 (or 0), or append a sentinel, but decide deliberately rather than discovering it on the last test case.",
    "<b>Using a stack for sliding window maximum.</b> The maximum leaves through the front of the window, which a stack cannot reach. This one does not degrade gracefully, it returns maxima from outside the window.",
    "<b>Forgetting the front-expiry check in the deque.</b> The back-popping keeps the deque decreasing, so the front is the biggest thing you hold, and without the expiry check it stays the biggest long after it has fallen out of the window.",
    "<b>Using <code>if</code> instead of <code>while</code> when popping the back.</b> One arrival can invalidate a long run of survivors. Stop after one and the monotonic invariant is gone, along with every answer that depended on it.",
  ],

  impl: [
    ["Python", "list as the stack, collections.deque for both ends", "deque gives pop() and popleft(), both O(1); a list has no cheap front removal."],
    ["Java", "ArrayDeque for both roles", "push() is addFirst(), so do not mix push() with peekFirst() as if it were a tail. Pick one vocabulary: push/peek/pop, or addLast/peekLast/pollLast."],
    ["C++", "std::stack, std::deque", "stack::pop() returns void, read top() before popping. deque has front(), back() and pops at both ends."],
    ["JavaScript", "Array, plus a head index", "There is no deque. shift() is O(n), so keep a head pointer for the front and let the consumed prefix sit there."],
  ],

  code: {
    pseudo: `# TRIGGER: "for each element, the next/previous greater/smaller one"
# Naive: scan right from every index. O(n^2), re-reading the same tail.

# THE INSIGHT: if b comes after a and b is bigger, then a is never
# anybody's next-greater again. b blocks it AND beats it. Discard a.
# What survives is the not-yet-blocked pile, already in decreasing order.

# NEXT GREATER, stack holds INDICES
for i from 0 to n-1:
    while stack not empty and a[top()] < a[i]:
        ans[pop()] <- i          # a[i] is the answer for everything it kills
    push(i)
# leftovers on the stack never found an answer -> -1

# THE COST ARGUMENT, say this out loud:
# each index is pushed once and popped at most once, so the inner while
# runs at most n times over the WHOLE outer loop. About 2n ops -> O(n).

# THE FOUR DIRECTIONS, two knobs:
#   next    -> scan left to right     previous -> scan right to left
#   greater -> pop while top smaller  smaller  -> pop while top bigger
#   ties    -> pop on equal = strictly greater, keep on equal = or-equal

# SLIDING WINDOW MAXIMUM needs a DEQUE, because the answer expires
# off the FRONT of the window while it is still the largest thing held.
for i from 0 to n-1:
    if front() <= i - k:  popFront()          # it fell out of the window
    while dq not empty and a[back()] <= a[i]:
        popBack()                             # smaller AND older: dead twice
    pushBack(i)
    if i >= k-1:  output a[front()]           # front is the window maximum

# LARGEST RECTANGLE: each bar stretches until a shorter bar stops it.
# Append a sentinel height of 0 so the stack is guaranteed to drain.
for i, h in heights + [0]:
    while stack not empty and heights[top()] >= h:
        height <- heights[pop()]
        width  <- (i - top() - 1) if stack not empty else i
        best   <- max(best, height * width)
    push(i)`,
    py: `from collections import deque

# ---- next greater element, to the right ---------------------------
def next_greater(a):
    res, st = [-1] * len(a), []       # st: indices, values decreasing
    for i, x in enumerate(a):
        while st and a[st[-1]] < x:   # strict: equal values do not pop
            res[st.pop()] = i         # store the INDEX, distance = i - popped
        st.append(i)
    return res                        # survivors keep -1, nothing beat them

# ---- previous smaller element: flip both knobs --------------------
def prev_smaller(a):
    res, st = [-1] * len(a), []
    for i, x in enumerate(a):
        while st and a[st[-1]] >= x:  # pop while the top is NOT smaller
            st.pop()
        res[i] = st[-1] if st else -1  # whoever survived is the answer
        st.append(i)
    return res

# ---- sliding window maximum: discard at BOTH ends -----------------
def max_window(a, k):
    dq, out = deque(), []             # indices, values decreasing
    for i, x in enumerate(a):
        if dq and dq[0] <= i - k:
            dq.popleft()              # the front fell out of the window
        while dq and a[dq[-1]] <= x:
            dq.pop()                  # smaller and older, no future at all
        dq.append(i)
        if i >= k - 1:
            out.append(a[dq[0]])      # front is always the window maximum
    return out

# ---- largest rectangle: the sentinel 0 drains the stack -----------
def largest_rectangle(h):
    st, best = [], 0
    for i, x in enumerate(h + [0]):   # the fake final bar beats everything
        while st and h[st[-1]] >= x:
            height = h[st.pop()]
            width = i - st[-1] - 1 if st else i
            best = max(best, height * width)
        st.append(i)
    return best`,
    java: `// Next greater element, indices in and indices out
static int[] nextGreater(int[] a) {
    int n = a.length;
    int[] res = new int[n];
    Arrays.fill(res, -1);                        // survivors have no answer
    Deque<Integer> st = new ArrayDeque<>();      // indices, values decreasing
    for (int i = 0; i < n; i++) {
        while (!st.isEmpty() && a[st.peek()] < a[i]) res[st.pop()] = i;
        st.push(i);
    }
    return res;
}

// Sliding window maximum: one deque, two exits
static int[] maxWindow(int[] a, int k) {
    Deque<Integer> dq = new ArrayDeque<>();
    int[] out = new int[a.length - k + 1];
    for (int i = 0; i < a.length; i++) {
        if (!dq.isEmpty() && dq.peekFirst() <= i - k) dq.pollFirst();
        while (!dq.isEmpty() && a[dq.peekLast()] <= a[i]) dq.pollLast();
        dq.addLast(i);
        if (i >= k - 1) out[i - k + 1] = a[dq.peekFirst()];
    }
    return out;
}

// Largest rectangle: i == n plays the sentinel, no array copy needed
static int largestRectangle(int[] h) {
    Deque<Integer> st = new ArrayDeque<>();
    int n = h.length, best = 0;
    for (int i = 0; i <= n; i++) {
        int cur = (i == n) ? 0 : h[i];
        while (!st.isEmpty() && h[st.peek()] >= cur) {
            int height = h[st.pop()];
            int width = st.isEmpty() ? i : i - st.peek() - 1;
            best = Math.max(best, height * width);
        }
        st.push(i);
    }
    return best;
}`,
    cpp: `// Next greater element
vector<int> nextGreater(const vector<int>& a) {
    int n = a.size();
    vector<int> res(n, -1);
    stack<int> st;                               // indices, values decreasing
    for (int i = 0; i < n; ++i) {
        while (!st.empty() && a[st.top()] < a[i]) {
            res[st.top()] = i;                   // top() first, pop() is void
            st.pop();
        }
        st.push(i);
    }
    return res;
}

// Sliding window maximum: deque, discard at both ends
vector<int> maxWindow(const vector<int>& a, int k) {
    deque<int> dq;
    vector<int> out;
    for (int i = 0; i < (int)a.size(); ++i) {
        if (!dq.empty() && dq.front() <= i - k) dq.pop_front();
        while (!dq.empty() && a[dq.back()] <= a[i]) dq.pop_back();
        dq.push_back(i);
        if (i >= k - 1) out.push_back(a[dq.front()]);
    }
    return out;
}

// Largest rectangle in histogram, i == n is the sentinel bar
int largestRectangle(vector<int>& h) {
    int n = h.size(), best = 0;
    stack<int> st;
    for (int i = 0; i <= n; ++i) {
        int cur = (i == n) ? 0 : h[i];
        while (!st.empty() && h[st.top()] >= cur) {
            int height = h[st.top()]; st.pop();
            int width = st.empty() ? i : i - st.top() - 1;
            best = max(best, height * width);
        }
        st.push(i);
    }
    return best;
}`,
    js: `// Next greater element
function nextGreater(a) {
  const res = new Array(a.length).fill(-1), st = [];   // st: indices
  for (let i = 0; i < a.length; i++) {
    while (st.length && a[st[st.length - 1]] < a[i]) res[st.pop()] = i;
    st.push(i);
  }
  return res;
}

// Sliding window maximum. There is no deque, and shift() is O(n),
// so the front is a head index into a plain array.
function maxWindow(a, k) {
  const dq = [], out = [];
  let head = 0;
  for (let i = 0; i < a.length; i++) {
    if (head < dq.length && dq[head] <= i - k) head++;   // expired off front
    while (dq.length > head && a[dq[dq.length - 1]] <= a[i]) dq.pop();
    dq.push(i);
    if (i >= k - 1) out.push(a[dq[head]]);
  }
  return out;
}

// Largest rectangle, with the sentinel folded into the bound
function largestRectangle(h) {
  const st = [];
  let best = 0;
  for (let i = 0; i <= h.length; i++) {
    const cur = i === h.length ? 0 : h[i];
    while (st.length && h[st[st.length - 1]] >= cur) {
      const height = h[st.pop()];
      const width = st.length ? i - st[st.length - 1] - 1 : i;
      best = Math.max(best, height * width);
    }
    st.push(i);
  }
  return best;
}`,
  },
  codecap: "One loop shape underneath all of it: pop everything the newcomer kills, answer them on the way out, then push the newcomer.",

  q: [
    ["Why can an element be thrown away permanently instead of kept for later?", "If a bigger element arrives after it, that bigger element blocks it from everything further right and is a better answer there anyway. It can never be anyone's next-greater again, so there is nothing left to keep it for."],
    ["Why is the stack sorted when nobody sorts it?", "It only ever holds elements that nothing has blocked yet. Anything smaller than a newcomer is discarded on arrival, so every survivor is larger than the ones after it. Monotonicity is a side effect of the discarding rule."],
    ["There is a while loop inside a for loop. Why is it not O(n²)?", "Each index is pushed exactly once and popped at most once, so the inner while executes at most n times summed over the entire outer loop, not per iteration. About 2n operations in total, so O(n)."],
    ["What changes between next greater, next smaller, previous greater and previous smaller?", "Two things only. Next versus previous flips the scan direction, left-to-right or right-to-left. Greater versus smaller flips the comparison used to pop. Whether the comparison is strict decides how equal values are treated."],
    ["Why store indices rather than values?", "The question is usually a distance, how many days until it gets warmer, or how wide a rectangle can be. An index gives you the distance and the value; a value gives you neither."],
    ["Why does sliding window maximum need a deque instead of a stack?", "The current maximum expires off the front of the window while it is still the largest element held. A stack can only remove from the end it pushes to, so you need to discard at both ends: smaller candidates off the back, expired indices off the front."],
  ],

  p: [
    [496, "next-greater-element-i", "Next Greater Element I, the idea with no distractions", "E"],
    [739, "daily-temperatures", "Daily Temperatures, the template itself", "M"],
    [503, "next-greater-element-ii", "Next Greater Element II, circular, walk 2n indices", "M"],
    [901, "online-stock-span", "Online Stock Span, previous greater, streaming", "M"],
    [907, "sum-of-subarray-minimums", "Sum of Subarray Minimums, previous and next smaller", "M"],
    [239, "sliding-window-maximum", "Sliding Window Maximum, the deque variant", "H"],
    [84, "largest-rectangle-in-histogram", "Largest Rectangle, the sentinel drain", "H"],
  ],
},

/* ==================================================================== */
{
  id: "intervals",
  n: "Intervals and sweep line",
  group: "Patterns",
  one: "Sorting is the algorithm, and the <b>sort key</b> is the decision: by start to merge, by end to pack the most. Then turn intervals into <b>+1/-1 events</b> and sweep.",

  plain: `<p>An interval is a pair: a start and an end. A meeting, a booking, a range of house numbers. The questions asked about them are always the same three. Which ones overlap? How many can I keep if none of them may overlap? How many are happening at once at the busiest moment?</p>
<p>Handed an unsorted pile, you have to compare every interval against every other one. That is about n² comparisons, and you will still get the overlap test slightly wrong.</p>
<p>Sorted, the picture changes completely. Once the intervals are in order, <b>only the neighbour matters</b>, and one left-to-right pass answers the question. The sort costs n log n and buys you the whole algorithm.</p>
<p>So the only real decision on these problems is <b>what to sort by</b>. Sort by start when you are gluing overlapping things together. Sort by end when you are packing as many as possible into a day. Same four lines of loop, different key, different answer.</p>
<p><b>Analogy.</b> A doorman with a clicker. He does not track who is inside or how long they stay. He clicks up when someone walks in and down when someone walks out. The highest number he ever sees is the size of room the fire officer will insist on.</p>`,

  why: [
    { t: "Unsorted, every pair is a candidate",
      d: "With no order at all, the interval that overlaps the first one could be anywhere in the list, so you compare all n squared over two pairs. Nothing about the data stops you, which is exactly the problem: there is no local structure to exploit yet." },
    { t: "Get the overlap test right by negating the misses",
      d: "Do not enumerate the ways two intervals can overlap, there are four and you will forget one. Enumerate the two ways they can <b>miss</b>: <code>b &lt; c</code> (the first ends before the second starts) or <code>d &lt; a</code> (the other way round). Negate both and you are done: <code>[a,b]</code> and <code>[c,d]</code> overlap when <b><code>a &lt;= d and c &lt;= b</code></b>. Two comparisons, no cases." },
    { t: "Sorting by start makes the neighbour the only thing that matters",
      d: "Once starts are in order, every interval that could overlap the current one has already been seen. So walk the list, holding the block you are currently building. If the next start is at or before the block's end, <b>extend the end</b>. Otherwise there is a real gap, so close this block and open a new one. One pass, and the total is O(n log n) because the sort dominates." },
    { t: "A different question wants a different key",
      d: "Now ask for the largest set of intervals that do not overlap. Sorting by start is useless here, a first meeting that runs all day blocks everything. Sort by <b>end</b> instead. The one that finishes earliest leaves the most room for whatever comes next. So take every interval that starts after the last one you kept, and that plain rule is provably optimal. Same shape of loop, different key, and the key is the entire argument." },
    { t: "Now stop thinking about intervals and think about events",
      d: "For counting questions the pairing is a distraction. Split each interval into two things that happen on a number line: <b>+1 at the start</b>, <b>-1 at the end</b>. Sort all 2n of them by position and sweep left to right with a running counter. That counter is how many intervals are live at your current position, and its maximum is the peak concurrency: meeting rooms, overlapping bookings, the height in a skyline." },
    { t: "At equal positions, the tie rule decides what overlap means",
      d: "One meeting ends at 10:00 and another starts at 10:00. Process the <b>-1 before the +1</b> and they do not clash, so one room is enough. Process the +1 first and you have invented a second room. Neither is wrong in general, it depends on whether touching counts as overlapping, but it must be a decision and not an accident of your comparator." },
    { t: "What the sweep will not give you",
      d: "It reports numbers, not names. You learn that four things overlap at position 12, not <i>which</i> four. To know which, carry a set of the currently active intervals alongside the counter, and pay for it. It is also <b>offline</b>, you need every interval before you can sort. Intervals arriving one at a time, with queries in between, is a different problem and wants an interval tree or an ordered map." },
  ],

  variants: [
    { n: "Merge intervals", cost: "O(n log n), sort by start",
      idea: "Walk the sorted list holding one block. Extend its end when the next start is at or before that end, otherwise push it and start a new block.",
      when: "Anything that asks for the union: merged bookings, coalesced ranges, free-versus-busy calendars.",
      watch: "Extend with <code>max(end, next.end)</code>, not <code>next.end</code>. A short interval fully swallowed by the current block would otherwise shrink it, and the bug survives every test where the intervals happen to be the same width." },

    { n: "Insert interval", cost: "O(n) on an already sorted list",
      idea: "Three phases: copy everything ending before the new start, absorb everything that overlaps into one widened interval, copy the rest.",
      when: "The list is already sorted and disjoint and one new interval arrives. Re-sorting would be O(n log n) for nothing.",
      watch: "The three loops each have their own boundary condition and people fuse them into one loop with flags. Keep them separate, they are easier to argue about than to debug." },

    { n: "Non-overlapping subset, greedy by end", cost: "O(n log n), sort by end",
      idea: "Keep a running <code>lastEnd</code>. Take every interval whose start is at or after it. The number removed is n minus the number kept.",
      when: "Maximise how many fit, or minimise how many to delete: non-overlapping intervals, arrows bursting balloons, classroom scheduling.",
      watch: "Sorting by start or by duration both feel reasonable and both are wrong, with three-interval counterexamples. The exchange argument only works for finish time: swapping in the earliest finisher frees the room no later, so nothing that fitted before stops fitting." },

    { n: "Meeting rooms via sweep line", cost: "O(n log n), sort 2n events",
      idea: "Emit +1 at each start and -1 at each end, sort by position with ends first on ties, and track the running counter's maximum.",
      when: "You want the peak count, or the count at every position: minimum rooms, car pooling capacity, skyline outlines, maximum overlapping bookings.",
      watch: "The tie rule is the whole correctness of it. Also note the shortcut: sorting the starts array and the ends array separately gives the same sweep without ever building event pairs." },

    { n: "Meeting rooms via min-heap", cost: "O(n log n), sort by start plus heap ops",
      idea: "Sort by start. Keep a min-heap of the end times of rooms in use. For each meeting, pop the earliest-ending room if it is already free, then push this meeting's end. The heap size is the answer.",
      when: "You need the rooms themselves and not just how many: assigning each meeting to a specific room, or reporting what each room holds.",
      watch: "Reaching for a heap when a counter would do costs you a log factor and a page of code. Use the sweep when the question is 'how many', the heap when the question is 'which room'." },

    { n: "Interval intersection of two sorted lists", cost: "O(n + m), no sort at all",
      idea: "Two pointers. The overlap of the current pair is <code>[max(starts), min(ends)]</code>, kept if it is non-empty, then advance whichever interval ends first.",
      when: "Both lists arrive already sorted and disjoint, as in comparing two people's calendars.",
      watch: "Advance the one with the <b>smaller end</b>, never the smaller start. The one that ends first cannot possibly meet anything further along in the other list, so it is finished." },
  ],

  hing: `<p><b>Ek line mein:</b> interval problems mein asli algorithm <b>sort</b> hai. Loop to char line ka hai. Poora dimaag sirf ek sawaal par lagao: <b>kis cheez se sort karun, start se ya end se?</b></p>
<p><b>Pehle overlap test, kyunki yahin sabse zyada log phisalte hain.</b> Overlap ke saare cases mat ginno, char hote hain aur ek zaroor bhool jaaoge. Ulta socho: do interval <b>miss</b> kaise karte hain? Sirf do tareeke, <code>b &lt; c</code> ya <code>d &lt; a</code>. Ab dono ko negate kar do: <code>[a,b]</code> aur <code>[c,d]</code> overlap karte hain jab <b><code>a &lt;= d and c &lt;= b</code></b>. Bas do comparison, koi case analysis nahi. Yeh line yaad rakh lo, interview mein seedha likh dena.</p>
<p><b>Start se sort kyun merge ke liye?</b> Jab starts sorted hain, to jo bhi interval current wale se overlap kar sakta tha, woh <b>pehle hi dekha ja chuka hai</b>. Aage kuch chhoot nahi sakta. Isliye sirf apne aakhri block ko pakde raho. Agla start block ke end tak ya usse pehle hai, to end ko <code>max</code> se badha do. Warna asli gap hai, naya block shuru karo. Ek pass. <code>max</code> lagana mat bhoolna, warna ek chhota interval jo poora andar hi samaya hua tha, tumhara block chhota kar dega.</p>
<p><b>End se sort kab?</b> Jab sawaal ho "zyada se zyada kitne non-overlapping rakh sakte ho". Yahan start se sort karna bekaar hai, ek subah shuru hone wali din bhar chalne wali meeting sab kuch block kar degi. <b>Jo sabse pehle khatam hota hai</b> woh baaki sabke liye sabse zyada jagah chhodta hai. Yahi exchange argument hai, aur yahi jawaab interviewer sun-na chahta hai.</p>
<p><b>Ab asli cheez, sweep line.</b> Interval ke baare mein sochna band karo, <b>events</b> ke baare mein socho. Har interval ko do events mein tod do: start par <b>+1</b>, end par <b>-1</b>. Saare 2n events ko position se sort karo aur left se right chalte hue ek counter chalao. Woh counter batata hai ki is waqt kitni cheezein <b>live</b> hain. Uska maximum hi tumhara jawaab hai: kitne meeting rooms chahiye, kitni cars ek saath, skyline ki height. Ek loop, teen alag alag problems.</p>
<p><b>Tie ka rule, ise halke mein mat lo.</b> Ek meeting 10:00 par khatam, doosri 10:00 par shuru. Agar <b>-1 pehle</b> process kiya to dono ek hi room mein aa jaayengi. Agar +1 pehle kiya to tumne bina zaroorat ke ek extra room bana diya. Dono sahi ho sakte hain, depend karta hai ki chhoote hue kinare overlap maane jaayenge ya nahi. Par yeh <b>decision</b> hona chahiye, comparator ki galti nahi.</p>
<p><b>Heap wala tareeka bhi jaan lo.</b> Start se sort karo, aur ek min-heap rakho jisme rooms ke end times hain, sabse pehle khali hone wala upar. Nayi meeting aayi: agar top wala room free ho chuka hai to pop karo, phir apna end push kar do. Heap ka size hi answer hai. <b>Kab kaunsa?</b> Agar sirf "kitne rooms" poocha hai, sweep line saaf aur tez hai. Agar "kaunsi meeting kis room mein" chahiye, tab heap, kyunki wahan rooms sach mein exist karte hain.</p>
<p><b>Interview line:</b> "Sorting dominates, so it is O(n log n) time and O(n) for the events." Aur agar intervals pehle se sorted mile hain, to bol do ki insert wala case O(n) mein ho jaayega. Dobara sort karne ki zaroorat nahi.</p>`,

  viz: ["intervals"],

  math: [
    { t: "What sorting removes", d: "Unsorted, any pair might overlap. Sorted by start, only the immediate neighbour can, and that is the entire saving.", w:
`n intervals

every pair:      n(n-1)/2
n = 10^5    ->   5 x 10^9

sort by start:   n log2 n = 1.7 x 10^6, then one pass of n

after sorting, starts are non-decreasing, so anything
that overlaps the current interval must start before it
ends, which only the next interval can do` },
    { t: "The overlap test, derived by negating the two misses", d: "Do not enumerate the arrangements. There are exactly two ways to miss, so overlap is the negation of their union, and it is one line.", w:
`[a1, b1] and [a2, b2] do NOT overlap when
   b1 < a2      the first finishes before the second starts
   b2 < a1      or the other way round

so they DO overlap when
   a1 <= b2   and   a2 <= b1

two comparisons, no case analysis
half-open [a, b):  a1 < b2 and a2 < b1` },
    { t: "The sort key is the algorithm, and the wrong key is a wrong answer", d: "Both questions are solved by sorting and one pass. They are different sorts, and using the merge key for the packing problem loses quietly.", w:
`merge overlapping intervals     sort by START
most non-overlapping intervals  sort by END
minimum rooms needed            sort the endpoints, sweep

sorting by start for the packing problem:
  [1, 10], [2, 3], [4, 5]
  by start: take [1,10], reject both others  ->  1
  by end:   take [2,3], then [4,5]           ->  2` },
    { t: "Turn intervals into events and the sweep counts for you", d: "Once each interval is two signed events, the question stops being about intervals at all and becomes a running total over a sorted list.", w:
`[2, 5]  becomes  (2, +1)  and  (5, -1)

sort 2n events by position, walk them, keep a counter
  counter = intervals covering this point
  max counter = minimum rooms needed

O(n log n) to sort, O(n) to sweep

ties at the same position:
  touching ends do NOT overlap  ->  process -1 first
  touching ends DO overlap      ->  process +1 first` },
  ],

  costs: [
    ["merge overlapping intervals", "O(n log n) time, O(n) output", "the sort is the whole cost, the merging pass is O(n) and free next to it"],
    ["brute force pairwise overlap check", "O(n^2)", "what sorting removes: unordered, the partner could be any of the others"],
    ["insert into an already sorted list", "O(n)", "the order is already paid for, so re-sorting would be spending it twice"],
    ["max non-overlapping subset", "O(n log n)", "sorted by end, one greedy sweep, and no state beyond the last kept end"],
    ["sweep line over events", "O(n log n) time, O(n) space", "2n events, sorted once, then a single counter walks them"],
    ["min-heap room assignment", "O(n log n)", "same bound, larger constant: a heap push and pop per meeting, not one add"],
    ["overlap test itself", "O(1), two comparisons", "a <= d and c <= b, which is why deriving it beats memorising four cases"],
  ],

  traps: [
    "<b>Extending with <code>next.end</code> instead of <code>max(end, next.end)</code>.</b> An interval sitting entirely inside the current block will silently shorten it, and every test where intervals are roughly equal width will pass.",
    "<b>Sorting by start for a packing question.</b> For the largest non-overlapping subset the key is the <b>end</b> time. Start time and duration both look defensible and both have three-interval counterexamples.",
    "<b>Leaving the tie rule to chance.</b> If ends and starts at the same position sort arbitrarily, meeting rooms will be off by one on exactly the inputs a reviewer tries first. Decide whether touching counts, then encode it in the comparator.",
    "<b>Using <code>&lt;</code> where the problem means <code>&lt;=</code>.</b> Whether <code>[1,2]</code> and <code>[2,3]</code> overlap is a property of the problem statement, not of intervals. Read it, then keep that choice consistent across the merge test, the greedy test and the sweep.",
    "<b>Sorting on the raw pair in a language where that compares more than the start.</b> Sorting pairs sorts by start then end, which is usually harmless, but if you meant to sort by end you must say so explicitly.",
    "<b>Reaching for a heap when a counter would do.</b> If the answer is a number, the sweep is shorter, faster and easier to explain. The heap earns its keep only when you need the rooms themselves.",
  ],

  impl: [
    ["Python", "list.sort(key=lambda x: x[0]) / heapq", "Tuples sort lexicographically, so (pos, -1) lands before (pos, +1) for free."],
    ["Java", "Arrays.sort(a, Comparator.comparingInt(x -> x[0]))", "int[][] needs a comparator; never write (a,b) -> a[0]-b[0], it overflows."],
    ["C++", "std::sort on a vector of pairs, plus std::priority_queue", "Sorting pairs orders by first then second; write a lambda when you mean end."],
    ["JavaScript", "arr.sort((a,b) => a[0]-b[0])", "Without a comparator sort() compares as text, so 10 lands before 9."],
  ],

  code: {
    pseudo: `# The loops below are short. The line above each one, saying WHAT WE
# SORTED BY, is the actual algorithm.

# --- OVERLAP TEST, derived by negating the two ways to MISS ---------
# [a,b] and [c,d] fail to meet only if  b < c  or  d < a.
# Negate both:      overlap  <=>  a <= d  and  c <= b
# Two comparisons. Do not enumerate the four overlapping shapes.

# --- MERGE, sorted by START -----------------------------------------
sort intervals by start
out <- empty
for iv in intervals:
    if out is not empty and iv.start <= out.last.end:
        out.last.end <- max(out.last.end, iv.end)   # max, not iv.end
    else:
        out.append(iv)                              # a real gap

# --- MOST NON-OVERLAPPING, sorted by END ----------------------------
# Finishing earliest leaves the most room for everything after it.
sort intervals by end
kept <- 0 ; last_end <- -infinity
for iv in intervals:
    if iv.start >= last_end:
        kept <- kept + 1 ; last_end <- iv.end

# --- SWEEP LINE: forget intervals, count EVENTS ---------------------
events <- empty
for [s, e] in intervals:
    events.append((s, +1))          # something begins here
    events.append((e, -1))          # something ends here
sort events by position, and at EQUAL positions put -1 BEFORE +1
                                    # so [1,2] and [2,3] share one room
live <- 0 ; peak <- 0
for (pos, delta) in events:
    live <- live + delta            # how many are open right now
    peak <- max(peak, live)         # peak = rooms needed = skyline height`,

    py: `# The overlap test, derived not memorised.
def overlaps(a, b, c, d):
    return a <= d and c <= b          # negation of (b < c or d < a)

# MERGE: sort by START, then extend or append.
def merge(intervals):
    intervals.sort(key=lambda iv: iv[0])
    out = []
    for s, e in intervals:
        if out and s <= out[-1][1]:            # touching counts here
            out[-1][1] = max(out[-1][1], e)    # max, or a nested one shrinks it
        else:
            out.append([s, e])
    return out

# MOST NON-OVERLAPPING: sort by END. That key is the proof.
def max_non_overlapping(intervals):
    intervals.sort(key=lambda iv: iv[1])
    kept, last_end = 0, float("-inf")
    for s, e in intervals:
        if s >= last_end:
            kept += 1
            last_end = e
    return kept

# SWEEP: rooms needed is just the peak of a counter.
def min_rooms(intervals):
    events = []
    for s, e in intervals:
        events.append((s, +1))
        events.append((e, -1))
    events.sort()          # tuples: at equal pos, -1 sorts before +1
    live = peak = 0
    for _, delta in events:
        live += delta
        peak = max(peak, live)
    return peak

# HEAP: the same answer when you need the rooms, not the count.
import heapq
def min_rooms_heap(intervals):
    intervals.sort(key=lambda iv: iv[0])
    ends = []                                  # end times of busy rooms
    for s, e in intervals:
        if ends and ends[0] <= s:              # earliest room is free again
            heapq.heappop(ends)
        heapq.heappush(ends, e)
    return len(ends)`,

    java: `// MERGE: sort by start, then extend the block or start a new one.
static int[][] merge(int[][] iv) {
    Arrays.sort(iv, Comparator.comparingInt(x -> x[0]));  // never x[0]-y[0]
    List<int[]> out = new ArrayList<>();
    for (int[] x : iv) {
        int n = out.size();
        if (n > 0 && x[0] <= out.get(n - 1)[1]) {
            out.get(n - 1)[1] = Math.max(out.get(n - 1)[1], x[1]);
        } else {
            out.add(new int[]{x[0], x[1]});
        }
    }
    return out.toArray(new int[0][]);
}

// SWEEP: two sorted arrays ARE the event list, and cost nothing extra.
static int minRooms(int[][] iv) {
    int n = iv.length;
    int[] starts = new int[n], ends = new int[n];
    for (int i = 0; i < n; i++) { starts[i] = iv[i][0]; ends[i] = iv[i][1]; }
    Arrays.sort(starts);
    Arrays.sort(ends);
    int live = 0, peak = 0, j = 0;
    for (int i = 0; i < n; i++) {
        while (j < n && ends[j] <= starts[i]) { j++; live--; }  // ends first
        live++;
        peak = Math.max(peak, live);
    }
    return peak;
}

// HEAP: same bound, but now each room is a real object you can name.
static int minRoomsHeap(int[][] iv) {
    Arrays.sort(iv, Comparator.comparingInt(x -> x[0]));
    PriorityQueue<Integer> busy = new PriorityQueue<>();  // earliest end on top
    for (int[] x : iv) {
        if (!busy.isEmpty() && busy.peek() <= x[0]) busy.poll();
        busy.add(x[1]);
    }
    return busy.size();
}`,

    cpp: `// MERGE: sort by start. Pairs sort by first, which is what we want here.
vector<vector<int>> merge(vector<vector<int>>& iv) {
    sort(iv.begin(), iv.end());
    vector<vector<int>> out;
    for (auto& x : iv) {
        if (!out.empty() && x[0] <= out.back()[1])
            out.back()[1] = max(out.back()[1], x[1]);   // max, always max
        else
            out.push_back(x);
    }
    return out;
}

// MOST NON-OVERLAPPING: say END explicitly, the default sort will not.
int maxNonOverlapping(vector<vector<int>>& iv) {
    sort(iv.begin(), iv.end(), [](auto& a, auto& b) { return a[1] < b[1]; });
    int kept = 0;
    long long lastEnd = LLONG_MIN;
    for (auto& x : iv)
        if (x[0] >= lastEnd) { kept++; lastEnd = x[1]; }
    return kept;
}

// SWEEP: build 2n events, sort once, walk a counter.
int minRooms(vector<vector<int>>& iv) {
    vector<pair<int,int>> ev;
    for (auto& x : iv) { ev.push_back({x[0], +1}); ev.push_back({x[1], -1}); }
    sort(ev.begin(), ev.end());          // at equal pos, -1 comes first
    int live = 0, peak = 0;
    for (auto& [pos, d] : ev) { live += d; peak = max(peak, live); }
    return peak;
}

// HEAP: priority_queue is a MAX-heap here, so ask for greater<> by hand.
int minRoomsHeap(vector<vector<int>>& iv) {
    sort(iv.begin(), iv.end());
    priority_queue<int, vector<int>, greater<int>> busy;
    for (auto& x : iv) {
        if (!busy.empty() && busy.top() <= x[0]) busy.pop();
        busy.push(x[1]);
    }
    return (int)busy.size();
}`,

    js: `// MERGE: sort by start. sort() needs a comparator or it compares text.
function merge(intervals) {
  intervals.sort((a, b) => a[0] - b[0]);
  const out = [];
  for (const [s, e] of intervals) {
    const last = out[out.length - 1];
    if (last && s <= last[1]) last[1] = Math.max(last[1], e);
    else out.push([s, e]);
  }
  return out;
}

// MOST NON-OVERLAPPING: sort by end, keep whatever still fits after it.
function maxNonOverlapping(intervals) {
  intervals.sort((a, b) => a[1] - b[1]);
  let kept = 0, lastEnd = -Infinity;
  for (const [s, e] of intervals) {
    if (s >= lastEnd) { kept++; lastEnd = e; }
  }
  return kept;
}

// SWEEP: one counter over sorted events. The tie-break is the algorithm.
function minRooms(intervals) {
  const ev = [];
  for (const [s, e] of intervals) { ev.push([s, 1]); ev.push([e, -1]); }
  ev.sort((x, y) => x[0] - y[0] || x[1] - y[1]);   // at a tie, -1 first
  let live = 0, peak = 0;
  for (const [, d] of ev) { live += d; peak = Math.max(peak, live); }
  return peak;
}

// INSERT into a sorted, disjoint list. Three phases, O(n), no sort.
function insert(intervals, nw) {
  const out = [];
  let i = 0, [s, e] = nw;
  while (i < intervals.length && intervals[i][1] < s) out.push(intervals[i++]);
  while (i < intervals.length && intervals[i][0] <= e) {
    s = Math.min(s, intervals[i][0]);
    e = Math.max(e, intervals[i++][1]);             // absorb the overlap
  }
  out.push([s, e]);
  while (i < intervals.length) out.push(intervals[i++]);
  return out;
}`,
  },
  codecap: "Two sort keys and one counter cover the whole family: start to merge, end to pack, and +1/-1 events to count.",

  q: [
    ["State the overlap test, and say how you would rederive it under pressure.", "Two intervals [a,b] and [c,d] overlap when a <= d and c <= b. Rederive it by listing the only two ways they can miss, b < c or d < a, and negating both. Enumerating overlap cases directly gives four shapes and you will drop one."],
    ["Why does merging sort by start while max non-overlapping sorts by end?", "For merging, sorted starts guarantee that anything overlapping the current block has already been seen, so only the last block needs checking. For packing, the interval that finishes earliest leaves the most room for whatever follows, so end time is the key with an exchange argument behind it. Sorting by start there fails on one long meeting that starts first."],
    ["What is the sweep line reformulation, in one sentence?", "Replace each interval by two events, +1 at its start and -1 at its end, sort all 2n events by position, then walk left to right with a running counter whose value is how many intervals are live at that point and whose maximum is the peak concurrency."],
    ["Two meetings, one ending at 10:00 and one starting at 10:00. How many rooms?", "One, if you process the -1 before the +1 at equal positions. Process the +1 first and the counter briefly reads 2 and you allocate a second room. Which is correct depends on whether the problem treats touching intervals as overlapping, so it has to be a deliberate tie-break in the comparator."],
    ["When would you use the min-heap formulation instead of the sweep?", "When you need the rooms themselves rather than their number. The heap holds the end time of each busy room with the earliest on top, so you pop a room that has freed up and push the new end, and each meeting is tied to a concrete room. If the question only asks how many, the sweep is shorter and has a smaller constant."],
    ["What can the sweep not answer, and what does that cost you?", "It gives counts, not memberships: you learn four intervals overlap at position 12 but not which four, unless you maintain an active set alongside the counter. It is also offline, since everything must be sorted before the first answer, so intervals arriving live with queries in between need an interval tree or an ordered map instead."],
  ],

  p: [
    [56, "merge-intervals", "Merge Intervals, the base case of the pattern", "M"],
    [57, "insert-interval", "Insert Interval, three phases on an already sorted list", "M"],
    [435, "non-overlapping-intervals", "Non-overlapping Intervals, and why the key is end time", "M"],
    [986, "interval-list-intersections", "Interval List Intersections, two pointers, no sort", "M"],
    [1094, "car-pooling", "Car Pooling, a sweep line wearing a different noun", "M"],
    [253, "meeting-rooms-ii", "Meeting Rooms II, sweep and heap, both worth writing", "M"],
    [218, "the-skyline-problem", "The Skyline Problem, sweep line with a multiset of heights", "H"],
  ],
},

/* ==================================================================== */
{
  id: "cyclic-sort",
  n: "Cyclic sort",
  group: "Patterns",
  one: "When the values are exactly 1 to n, every value already knows its index. Put each one home in one pass, and then <b>any slot holding the wrong value names the answer</b>.",

  plain: `<p>Most patterns are about finding structure in arbitrary data. This one is the opposite: it exploits a constraint the problem hands you, and it only works because of that constraint.</p>
<p>The constraint is that the array contains the numbers 1 to n, or 0 to n-1, possibly with one missing or one duplicated. That is a peculiar thing to be told, and it is a tell. It means every value has a <b>correct index it belongs at</b>, computable with no lookup: value <code>v</code> belongs at index <code>v-1</code>.</p>
<p>So walk the array, and whenever the value in front of you is not home, swap it to where it belongs. Do not advance yet, because the swap brought a new stranger into your current slot. Only move on once the slot is correct.</p>
<p>Once everything that can be home is home, the array is sorted. More usefully, any index still holding the wrong value is telling you exactly what is missing or duplicated. That second sentence is why the pattern exists at all, because sorting was never the goal.</p>
<p><b>Analogy.</b> Numbered coats on numbered pegs. You do not sort the coats. You pick one up, hang it on its own peg, pick up whatever was already there, and repeat. At the end, an empty peg names the missing coat.</p>`,

  why: [
    { t: "The constraint is the algorithm", d: "Being told the values are 1 to n is not decoration. It means the value <b>is</b> the index, so no comparison, no hash lookup and no sorting is needed to know where something belongs. Whenever a problem statement bothers to promise you the range of the values, it is pointing at this." },
    { t: "Swap it home, and do not advance", d: "The loop looks unusual because the index only moves forward when the current slot is already correct. Swapping brings a new value into the slot you are standing on, and that value has its own home to go to. Advancing after a swap is the mistake that quietly leaves things misplaced." },
    { t: "The nested loop is still linear", d: "It looks like it could be O(n²), and it is not. <b>Every swap puts at least one value into its final position permanently</b>, and a value never leaves its home once it arrives. So there are at most n swaps across the entire run, which with the n steps of the outer loop gives <b>O(n)</b>. This is the same amortised argument as the monotonic stack, and it is what interviewers want said out loud." },
    { t: "Then the mismatch is the answer", d: "After the pass, scan once more. If index <code>i</code> does not hold <code>i+1</code>, then <code>i+1</code> is missing and whatever is sitting there is the duplicate. One loop answers \"which number is missing\", \"which is repeated\", and \"which pair is wrong\" simultaneously, because they were always the same question." },
    { t: "The point is the space, not the speed", d: "A hash set also solves these in O(n) time, and everybody reaches for it first. Cyclic sort matches that time in <b>O(1) extra space</b>, by using the array itself as the record of what it has seen. When a problem says \"without extra space\" and promises a bounded value range, it has told you the answer twice." },
    { t: "Know when the promise does not hold", d: "Values outside 1 to n, or a range far larger than the array, break it: there is no home index to swap to. Guard the swap with a range check and skip anything out of bounds. First Missing Positive is exactly this case, and the guard is what makes it work on arbitrary input." },
  ],

  variants: [
    { n: "Missing number", cost: "O(n) time, O(1) space",
      idea: "Values 0 to n with one absent. After the pass, the first index not holding its own value names the missing one.",
      when: "The classic warm-up for the pattern.",
      watch: "XOR and the sum formula also solve it in one line. Sum risks overflow; XOR does not. Know all three." },

    { n: "Find the duplicate", cost: "O(n) time, O(1) space",
      idea: "n+1 values in the range 1 to n, so one repeats. The value that will not fit into its own slot is the duplicate.",
      when: "You are told the array must not be modified? Then use fast and slow pointers instead.",
      watch: "The classic version forbids modifying the array, which rules cyclic sort out and points at Floyd's cycle detection on the index graph." },

    { n: "Find all duplicates and all missing", cost: "O(n) time, O(1) space",
      idea: "After one pass, sweep once and collect every index whose value is wrong. Both answers come out of the same sweep.",
      when: "The problem asks for several numbers rather than one.",
      watch: "The output array does not count against O(1) space, and saying so is worth a sentence." },

    { n: "First missing positive", cost: "O(n) time, O(1) space",
      idea: "Same pass, but ignore anything outside 1 to n, since those can never be the answer.",
      when: "Arbitrary integers, negatives included, and you need the smallest absent positive.",
      watch: "The range guard is the whole difficulty here. Without it the swap loop runs off the end or spins." },

    { n: "Sign marking, the sibling trick", cost: "O(n) time, O(1) space",
      idea: "Instead of swapping, negate the value at index v-1 to record that v was seen. A negative entry means its index was visited.",
      when: "Values are guaranteed positive and you may modify the array.",
      watch: "Use the absolute value when reading, or the second visit reads your own marker as data." },
  ],

  hing: `<p><b>Yeh pattern baaki sabse ulta hai.</b> Zyadatar patterns bikhre hue data mein structure dhoondhte hain. Yeh ek <b>shart (constraint)</b> ka faayda uthata hai jo problem khud tumhe deti hai.</p>
<p><b>Shart kya hai:</b> array mein numbers <b>1 se n tak</b> hain (ya 0 se n-1), shayad ek missing ya ek duplicate ke saath. Yeh line bekaar mein nahi likhi hoti. Iska matlab hai ki har value ko pata hai ki uski <b>jagah kahan hai</b>: value <code>v</code> ka ghar index <code>v-1</code> hai. Na comparison, na hash, na sorting.</p>
<p><b>Loop ajeeb kyun dikhta hai?</b> Kyunki index tabhi aage badhta hai jab current slot <b>sahi</b> ho. Swap karne par tumhare slot mein ek naya ajnabi aa jaata hai, aur uska apna ghar hai. Swap ke baad turant aage badh gaye, to cheezein galat jagah reh jaayengi. <b>Yeh sabse common galti hai.</b></p>
<p><b>Nested loop hai, phir bhi O(n) kaise?</b> Kyunki <b>har swap kam se kam ek value ko hamesha ke liye uski sahi jagah par bitha deta hai</b>. Wahan se woh kabhi hilti nahi. Isliye poore run mein n se zyada swaps ho hi nahi sakte. Isliye poore program mein zyada se zyada n swaps. Yeh wahi amortised argument hai jo monotonic stack mein tha, aur interview mein ise <b>bol kar</b> batana hota hai.</p>
<p><b>Ab asli faayda:</b> pass ke baad ek aur sweep maaro. Agar index <code>i</code> par <code>i+1</code> nahi hai, to <code>i+1</code> <b>missing</b> hai aur jo wahan baitha hai woh <b>duplicate</b> hai. Missing number, repeated number, dono ek hi loop se. Sorting to kabhi maqsad thi hi nahi.</p>
<p><b>Aur sabse important:</b> hash set bhi yeh sab O(n) time mein kar deta hai, aur sabse pehle wahi dimaag mein aata hai. Cyclic sort ka faayda <b>time nahi, SPACE hai</b>: <b>O(1) extra space</b>, kyunki array khud hi record ban jaata hai. Jab problem bole "extra space mat use karo" aur saath mein values ki range bata de, to usne answer do baar bata diya hai.</p>
<p><b>Kab nahi chalega:</b> agar values 1 se n ke bahar hain, to unka koi ghar hi nahi hai. Swap se pehle range check lagao aur bahar wali values chhod do. "First Missing Positive" bilkul yahi case hai, aur wahi guard use solve karta hai.</p>`,

  viz: ["cyclic-sort"],
  see: [["GFG", "https://www.geeksforgeeks.org/cycle-sort/", "GeeksforGeeks, cycle sort"]],

  math: [
    { t: "The promise, and what it removes", d: "When the values are a permutation of the indices, the destination of every value is known without comparing it to anything.", w:
`values are exactly 1..n, each appearing once

value v belongs at index v - 1. Known immediately.

so nothing is compared, and the n log n lower bound
does not apply: it only binds algorithms whose sole
move is a comparison. This one reads the value.

sorting cost: O(n), and O(1) extra space` },
    { t: "The nested loop is still linear", d: "A while inside a for looks quadratic and is not, because every swap permanently finishes one element and there are only n of them.", w:
`for i in 0..n-1:
    while a[i] != i + 1:
        swap a[i] with a[a[i] - 1]

every swap places at least one value in its final home
a value in its final home is never moved again
so there are at most n swaps in the entire run

outer steps n + swaps <= n  ->  at most 2n operations` },
    { t: "Then the answer is wherever the pattern breaks", d: "After the pass the array is its own lookup table, and four different interview questions are the same single scan over it.", w:
`after the pass, a[i] should be i + 1

first missing number   the first i with a[i] != i + 1
the duplicate          the value found sitting in a slot
                       whose owner is elsewhere
all missing numbers    every i with a[i] != i + 1
first missing positive the same scan, having ignored
                       values outside 1..n` },
    { t: "The point is the space, not the speed", d: "A hash set also answers these in O(n) time. What it cannot do is answer them in no extra memory, which is the constraint the question is really about.", w:
`n = 10^6 values in 1..n

hash set of seen values   ~10^6 entries, tens of MB
boolean array             10^6 bytes = 1 MB
cyclic sort               0 extra bytes

the input array is already n slots of exactly the right
size, so it is used as the table. The cost is that the
original order is destroyed.` },
  ],

  costs: [
    ["the placement pass", "O(n) time", "at most n swaps, because each one is permanent"],
    ["extra space", "O(1)", "the array itself records what has been seen"],
    ["the answer sweep", "O(n)", "one more scan to find the mismatched index"],
    ["hash set alternative", "O(n) time, O(n) space", "same speed, and the space is the whole difference"],
    ["sorting alternative", "O(n log n)", "strictly worse, and throws away the constraint you were given"],
    ["writes to the array", "up to n", "this pattern mutates the input, which is sometimes forbidden"],
  ],

  traps: [
    "<b>Advancing after a swap.</b> The slot you are on now holds a different value that also needs placing. Only move forward when the current slot is correct.",
    "<b>Forgetting the range guard.</b> Values outside 1 to n have no home index, so swapping on them reads out of bounds or loops forever.",
    "<b>Swapping when the target already holds the right value.</b> Two equal values will swap each other back and forth until the heat death of the universe. Compare the target, not the current slot.",
    "<b>Mixing up 0-indexed and 1-indexed.</b> Values 1 to n go to index v-1; values 0 to n-1 go to index v. Write down which one the problem gave you before the loop.",
    "<b>Using it when the array must not be modified.</b> Find the Duplicate forbids it, which is why that one wants Floyd's cycle detection instead.",
  ],

  impl: [
    ["Python", "a[i], a[j] = a[j], a[i]", "Tuple swap evaluates the right side first, so the usual self-swap bug does not bite here."],
    ["Java", "manual swap with a temp", "Watch int versus Integer: unboxing in a loop is avoidable overhead on large inputs."],
    ["C++", "std::swap(a[i], a[j])", "size() is unsigned, so cast before comparing against a signed index."],
    ["JavaScript", "[a[i], a[j]] = [a[j], a[i]]", "Destructuring swap allocates a small array each time; a temp variable is faster in hot loops."],
  ],

  code: {
    pseudo: `# The promise: values are 1..n. So value v belongs at index v-1.

i <- 0
while i < n:
    home <- a[i] - 1                       # where the current value belongs
    if home is inside the array AND a[home] != a[i]:
        swap(a[i], a[home])                # send it home, do NOT advance
    else:
        i <- i + 1                         # this slot is settled, move on

# Compare against a[home], not against i. Comparing the wrong one loops
# forever the moment two equal values meet.

# THEN the answer sweep, which is the actual point
for i from 0 to n-1:
    if a[i] != i + 1:
        missing   <- i + 1                 # this number never arrived
        duplicate <- a[i]                  # and this one arrived twice
        break

# FIRST MISSING POSITIVE: same loop, plus a range guard, because the input
# may contain negatives and huge values that have no home at all
if 1 <= a[i] <= n and a[a[i] - 1] != a[i]: swap
else: i <- i + 1`,
    py: `def cyclic_sort(a):                      # values 1..n
    i = 0
    while i < len(a):
        home = a[i] - 1
        if 0 <= home < len(a) and a[home] != a[i]:
            a[home], a[i] = a[i], a[home]    # send it home, stay put
        else:
            i += 1
    return a

def find_missing_and_duplicate(a):       # both answers, one sweep
    cyclic_sort(a)
    for i, v in enumerate(a):
        if v != i + 1:
            return i + 1, v              # (missing, duplicate)
    return None, None

def first_missing_positive(a):           # arbitrary ints, O(1) space
    n = len(a)
    i = 0
    while i < n:
        home = a[i] - 1
        if 0 <= home < n and a[home] != a[i]:   # the range guard matters here
            a[home], a[i] = a[i], a[home]
        else:
            i += 1
    for i in range(n):
        if a[i] != i + 1:
            return i + 1
    return n + 1

def find_all_disappeared(a):             # the sign-marking sibling
    for v in a:
        idx = abs(v) - 1                 # abs, or you read your own marker
        if a[idx] > 0: a[idx] = -a[idx]
    return [i + 1 for i, v in enumerate(a) if v > 0]`,
    java: `static void cyclicSort(int[] a) {
    int i = 0;
    while (i < a.length) {
        int home = a[i] - 1;
        if (home >= 0 && home < a.length && a[home] != a[i]) {
            int t = a[home]; a[home] = a[i]; a[i] = t;   // stay on i
        } else i++;
    }
}

static int firstMissingPositive(int[] a) {
    int n = a.length, i = 0;
    while (i < n) {
        int home = a[i] - 1;
        if (home >= 0 && home < n && a[home] != a[i]) {
            int t = a[home]; a[home] = a[i]; a[i] = t;
        } else i++;
    }
    for (int j = 0; j < n; j++) if (a[j] != j + 1) return j + 1;
    return n + 1;
}

// Sign marking: no swaps, same O(1) space
static List<Integer> findDisappeared(int[] a) {
    for (int v : a) {
        int idx = Math.abs(v) - 1;
        if (a[idx] > 0) a[idx] = -a[idx];
    }
    List<Integer> out = new ArrayList<>();
    for (int i = 0; i < a.length; i++) if (a[i] > 0) out.add(i + 1);
    return out;
}`,
    cpp: `void cyclicSort(vector<int>& a) {
    int i = 0, n = (int)a.size();          // cast: size() is unsigned
    while (i < n) {
        int home = a[i] - 1;
        if (home >= 0 && home < n && a[home] != a[i]) swap(a[home], a[i]);
        else ++i;
    }
}

int firstMissingPositive(vector<int>& a) {
    int n = (int)a.size(), i = 0;
    while (i < n) {
        int home = a[i] - 1;
        if (home >= 0 && home < n && a[home] != a[i]) swap(a[home], a[i]);
        else ++i;
    }
    for (int j = 0; j < n; ++j) if (a[j] != j + 1) return j + 1;
    return n + 1;
}

vector<int> findDisappeared(vector<int>& a) {
    for (int v : a) {
        int idx = abs(v) - 1;
        if (a[idx] > 0) a[idx] = -a[idx];
    }
    vector<int> out;
    for (int i = 0; i < (int)a.size(); ++i) if (a[i] > 0) out.push_back(i + 1);
    return out;
}`,
    js: `function cyclicSort(a) {
  let i = 0;
  while (i < a.length) {
    const home = a[i] - 1;
    if (home >= 0 && home < a.length && a[home] !== a[i]) {
      [a[home], a[i]] = [a[i], a[home]];       // send it home, stay on i
    } else i++;
  }
  return a;
}

function firstMissingPositive(a) {
  const n = a.length;
  let i = 0;
  while (i < n) {
    const home = a[i] - 1;
    if (home >= 0 && home < n && a[home] !== a[i]) [a[home], a[i]] = [a[i], a[home]];
    else i++;
  }
  for (let j = 0; j < n; j++) if (a[j] !== j + 1) return j + 1;
  return n + 1;
}

function findDisappeared(a) {
  for (const v of a) {
    const idx = Math.abs(v) - 1;               // abs, or you read your own mark
    if (a[idx] > 0) a[idx] = -a[idx];
  }
  const out = [];
  for (let i = 0; i < a.length; i++) if (a[i] > 0) out.push(i + 1);
  return out;
}`,
  },
  codecap: "Stay on the index until it is settled, guard the range, and remember the sweep afterwards is the part you were actually asked for.",

  q: [
    ["What in the problem statement tells you to use this pattern?", "A promise about the range of the values, typically that they are 1 to n or 0 to n-1. That makes the value equal to its own index, so nothing needs to be searched or compared to know where it belongs."],
    ["Why does the index not advance after a swap?", "The swap brings a different value into the current slot, and that value has its own home to reach. Advancing leaves it misplaced. You move on only when the slot already holds the right value."],
    ["The loop is nested. Why is it O(n)?", "Every swap places at least one value in its final position permanently, and placed values never move again. So at most n swaps happen across the whole run, giving 2n operations in total."],
    ["Once the pass is done, how do you get the answer?", "Scan once. If index i does not hold i+1, then i+1 is the missing value and whatever sits there is the duplicate. Missing, repeated and mismatched are all the same question."],
    ["A hash set solves these in O(n) too. Why bother?", "Space. The hash set costs O(n) extra memory; cyclic sort uses the array itself as the record and costs O(1). When a problem demands constant space and also promises a value range, it has named the technique twice."],
    ["When does the pattern fail, and what do you do instead?", "When values fall outside the range, so there is no home index: guard the swap and skip them, which is how First Missing Positive works. And when the array may not be modified, which points at Floyd's cycle detection instead."],
  ],

  p: [
    [268, "missing-number", "Missing Number, the warm-up", "E"],
    [448, "find-all-numbers-disappeared-in-an-array", "All Disappeared Numbers", "E"],
    [442, "find-all-duplicates-in-an-array", "All Duplicates, the same sweep", "M"],
    [645, "set-mismatch", "Set Mismatch, missing and duplicate together", "E"],
    [287, "find-the-duplicate-number", "Find the Duplicate, where the array is read-only", "M"],
    [41, "first-missing-positive", "First Missing Positive, the range guard", "H"],
  ],
},

/* ==================================================================== */
{
  id: "two-pointers",
  n: "Two Pointers",
  group: "Patterns",
  one: "Two indices moving under a rule turn an O(n²) search over pairs into <b>O(n)</b>, because each move eliminates a whole set of candidates, not just one.",

  plain: `<p>Many problems ask about a <b>pair</b>: two numbers summing to a target, the two lines forming the largest container, the two ends of a palindrome. Checking every pair is O(n²).</p>
<p>Two pointers replaces that with two indices and a rule for which one moves next. The rule must guarantee that moving discards only candidates that <b>cannot possibly be the answer</b>. When it does, the pointers sweep the array once and finish in O(n).</p>
<p><b>The classic.</b> Sorted array, find a pair summing to 10. Start at both ends. If the sum is too big, the largest element cannot pair with anything. It is already too large even with the smallest partner, so move the right pointer in. Too small? Symmetrically, the smallest element is useless, so move the left pointer in. Each step deletes an entire row or column of the pair table.</p>
<p><b>Analogy.</b> Two people walking toward each other along a corridor to find where a picture hangs. Each step, whoever is further from the target moves. They meet in the middle having covered the corridor once between them, not once each.</p>`,

  why: [
    { t: "Checking every pair is the thing to beat",
      d: "All pairs is about n²/2 comparisons. But when the data has structure, usually sorted order, most of those pairs can be ruled out without ever being looked at." },
    { t: "Each move must throw away only impossible answers",
      d: "Sorted list, and <code>a[L] + a[R]</code> is too big. Since <code>a[L]</code> is the smallest value left, <code>a[R]</code> paired with <i>anything</i> remaining is still too big, so <code>a[R]</code> can be dropped completely. One comparison eliminates a whole group. <b>If you cannot make an argument like this, two pointers is not valid for your problem.</b>" },
    { t: "They only move toward each other, so the sweep is O(n)",
      d: "Each step advances exactly one pointer, and they never turn back. They meet after at most n steps, <b>O(n) time and O(1) extra space</b>. That O(1) is often the real reason to choose this over a map." },
    { t: "Three shapes cover almost everything",
      d: "<b>From both ends</b>, moving inward: sorted pair sums, container with most water, palindromes. <b>Both from the left</b>, one writing behind the other: removing duplicates in place. <b>Different speeds</b>, one moving twice as fast. This finds the middle of a list, and it detects a loop. Inside a loop the gap shrinks by one each step, so the two must meet." },
    { t: "Choosing between this and a hash map",
      d: "A map needs no order and keeps the original positions, but costs O(n) memory. Two pointers costs almost no memory but needs sorted input. Pick on whichever the problem constrains." },
  ],

  hing: `<p><b>Problem ki shakal:</b> aksar sawaal ek <b>jodi (pair)</b> ke baare mein hota hai. Do numbers ka sum target, sabse bada container, palindrome ke do sire. Saari jodiyaan check karo to O(n²).</p>
<p><b>Two pointers ka asli funda:</b> do index rakho aur ek <b>niyam</b> banao ki agla kaun aage badhega. Niyam aisa hona chahiye ki har move sirf <b>un candidates ko hataaye jo answer ho hi nahi sakte</b>.</p>
<p><b>Ab woh argument, jise samajh liya to pattern pakka.</b> Array lo <code>[1, 3, 4, 6, 8, 11]</code>, target <b>10</b>. L pehle par (1), R aakhri par (11). Sum <code>1 + 11 = 12</code>, target se bada.</p>
<p>Ab dhyan do: <b>1 to sabse chhota element hai</b>. Jab 11 ka sabse chhote saathi ke saath bhi sum 12 aa gaya, to baaki kisi ke saath, yaani 3, 4, 6, 8, aur bhi bada aayega. Matlab <b>11 kisi ke bhi saath jodi nahi banayega</b>. Use poora hata do: ek hi comparison mein <b>paanch jodiyan</b> khatam. Ulta case bhi wahi hai, sum chhota hua to <code>a[L]</code> apne sabse bade saathi ke saath bhi kam pad raha hai, to L aage badhao.</p>
<p>Har move ek poori line kaatta hai, ek jodi nahi. Agar tum apni problem ke liye aisa argument nahi bana pa rahe, to two pointers <b>valid nahi hai</b>.</p>
<p><b>O(n) kyun?</b> Har step mein ek pointer aage badhta hai aur dono ek doosre ki taraf hi aate hain, to milne se pehle zyada se zyada n steps. Time O(n), <b>space O(1)</b>. Yeh O(1) space hi asli jeet hai.</p>
<p><b>Teen variants yaad rakho:</b><br>1. <b>Dono sire se</b> (converging), sorted two-sum, container with most water, palindrome, 3Sum.<br>2. <b>Ek hi taraf, fast aur slow</b>, duplicates hatana, zeroes ko peeche bhejna. Slow pointer batata hai "agla rakha jaane wala element kahan jaayega". In-place O(1) space ka kaam yahi se hota hai.<br>3. <b>Alag speed</b> (Floyd), ek 1 kadam, doosra 2 kadam. Cycle hai to milna <b>pakka</b> hai, kyunki loop ke andar dono ka fasla har step 1 se ghatta hai. Linked list ka cycle <b>O(1) space</b> mein pakda jaata hai, aur middle node bhi ek hi pass mein mil jaata hai.</p>
<p><b>Hash map lein ya two pointers?</b> Hash map: O(n) time, <b>O(n) space</b>, unsorted par bhi chalta hai, original indices milte hain. Two pointers: sort ke baad O(n), <b>O(1) space</b>, par order chahiye. Agar array already sorted hai ya interviewer "O(1) space" bole → two pointers. Agar original index chahiye → hash map.</p>`,

  viz: ["two-pointers"],

  math: [
    { t: "The pair count being beaten", d: "Every pair is quadratic. Two pointers is one pass, and the whole question is what licenses skipping all those pairs.", w:
`all pairs:      n(n-1)/2
n = 10^5   ->   5 x 10^9

two pointers:   L and R only move toward each other,
                so at most n moves between them: O(n)

plus n log2 n if the input has to be sorted first` },
    { t: "The elimination argument, written out in full", d: "Each move must discard only candidates that provably cannot be the answer. For sorted two-sum, that proof is two lines and it is what the interviewer is asking for.", w:
`sorted array, L at the front, R at the back, target t

if a[L] + a[R] > t:
  for every i with L <= i < R,  a[i] >= a[L]
  so  a[i] + a[R] >= a[L] + a[R] > t
  a[R] is too large for EVERY remaining partner. Drop it.

if a[L] + a[R] < t, symmetrically a[L] is too small for
every remaining partner. Drop it.

each move deletes a whole row or column of the pair table,
not a single pair` },
    { t: "Why the sweep is n steps", d: "A shrinking gap that falls by at least one per step is the same termination measure as a loop invariant, and it bounds the pass immediately.", w:
`L = 0, R = n - 1, gap = R - L = n - 1

each step moves exactly one pointer inward,
so the gap falls by at least 1 and never rises

it reaches 0 in at most n - 1 steps  ->  O(n), one pass` },
    { t: "Fast and slow, and the two facts it gives you", d: "The same two-pointer idea on a list, where the rule is a difference in speed rather than a difference in direction.", w:
`slow +1, fast +2

inside a cycle of length L:
  fast gains exactly 1 on slow per step, so the gap
  falls to 0 within L steps. They cannot pass each other.

no cycle:
  fast reaches the end after n/2 steps, and slow is at
  n/2: the middle, in one pass, O(1) space` },
    { t: "Two pointers or a hash map, decided on two axes", d: "Both solve two-sum in linear time after the setup. They differ on memory and on whether the original positions survive.", w:
`Two Sum, n = 10^5

hash map      O(n) time, O(n) space
              unsorted input is fine
              original indices preserved
two pointers  O(1) extra space
              needs sorted input: n log2 n if not
              sorting destroys the original indices

so: do you need the indices, or do you need the space?` },
  ],

  costs: [
    ["converging pointers on sorted input", "O(n) time · O(1) space", "each step eliminates a whole row/column of pairs"],
    ["sort first, then two pointers", "O(n log n) · O(1)", "the sort dominates; still beats O(n²)"],
    ["fast & slow, in-place rewrite", "O(n) · O(1)", "the writer lags the reader"],
    ["Floyd's cycle detection", "O(n) · O(1)", "vs O(n) space for the hash-set version"],
    ["3Sum (fix one + two-point)", "O(n²) · O(1)", "down from O(n³)"],
    ["hash-map alternative", "O(n) · O(n)", "no sort needed, but costs memory"],
  ],

  traps: [
    "<b>Using it on unsorted data</b> for a sum problem. The elimination argument depends on order, without it the answer is simply wrong.",
    "<b>Forgetting to skip duplicates in 3Sum.</b> Advance past equal values after recording a triplet, or you emit repeats.",
    "<b>Not checking <code>fast</code> and <code>fast.next</code></b> before stepping two in a linked list, the classic null-pointer crash.",
    "<b>Moving both pointers in one step</b> when only one comparison was made. That can skip the answer.",
    "<b>Losing original indices after sorting.</b> If the problem wants indices, sort (value, index) pairs or use a hash map instead.",
  ],

  impl: [
    ["Python", "i, j = 0, len(a)-1; a[i], a[j] = a[j], a[i]", "Tuple assignment swaps without a temp; while i < j is the standard guard."],
    ["Java", "int i = 0, j = a.length-1", "Needs an explicit temp to swap. Watch char vs int when working on strings."],
    ["C++", "int i = 0, j = (int)a.size()-1", "std::swap(a[i], a[j]); size() is unsigned, cast before subtracting 1."],
    ["JavaScript", "let i = 0, j = a.length-1", "[a[i], a[j]] = [a[j], a[i]] destructures; strings are immutable, so split into an array first."],
  ],

  code: {
    pseudo: `# --- converging (sorted input) ------------------------------------
# Rule: each move must discard only impossible candidates.
L <- 0; R <- n - 1
while L < R:
    s <- a[L] + a[R]
    if s == target: return (L, R)
    if s < target:  L <- L + 1     # a[L] is too small to ever work
    else:           R <- R - 1     # a[R] is too big to ever work

# --- same direction (in-place rewrite) ----------------------------
slow <- 0                          # where the next KEPT element goes
for fast from 0 to n-1:
    if keep(a[fast]):
        a[slow] <- a[fast]
        slow <- slow + 1
return slow                        # new length

# --- different speeds (cycle detection) ---------------------------
slow <- head; fast <- head
while fast and fast.next:
    slow <- slow.next
    fast <- fast.next.next
    if slow == fast: return CYCLE  # the gap shrinks by 1 per step`,
    py: `# Converging: pair summing to target in a SORTED array
def two_sum_sorted(a, target):
    L, R = 0, len(a) - 1
    while L < R:
        s = a[L] + a[R]
        if s == target: return [L, R]
        if s < target:  L += 1
        else:           R -= 1
    return []

# Same direction: remove duplicates in place, O(1) space
def dedupe(a):
    slow = 0
    for fast in range(len(a)):
        if fast == 0 or a[fast] != a[fast-1]:
            a[slow] = a[fast]; slow += 1
    return slow

# Palindrome check
def is_pal(s):
    i, j = 0, len(s) - 1
    while i < j:
        if s[i] != s[j]: return False
        i += 1; j -= 1
    return True

# Fast & slow: cycle detection in O(1) space
def has_cycle(head):
    slow = fast = head
    while fast and fast.next:
        slow, fast = slow.next, fast.next.next
        if slow is fast: return True
    return False

# 3Sum: fix one, two-point the rest -> O(n^2)
def three_sum(nums):
    nums.sort(); res = []
    for i in range(len(nums) - 2):
        if i and nums[i] == nums[i-1]: continue      # skip duplicates
        L, R = i + 1, len(nums) - 1
        while L < R:
            s = nums[i] + nums[L] + nums[R]
            if s < 0: L += 1
            elif s > 0: R -= 1
            else:
                res.append([nums[i], nums[L], nums[R]])
                L += 1
                while L < R and nums[L] == nums[L-1]: L += 1
    return res`,
    java: `// Converging on a sorted array
static int[] twoSumSorted(int[] a, int target) {
    int L = 0, R = a.length - 1;
    while (L < R) {
        int s = a[L] + a[R];
        if (s == target) return new int[]{L, R};
        if (s < target) L++; else R--;
    }
    return new int[]{};
}

// Same direction: remove duplicates in place
static int dedupe(int[] a) {
    int slow = 0;
    for (int fast = 0; fast < a.length; fast++)
        if (fast == 0 || a[fast] != a[fast-1]) a[slow++] = a[fast];
    return slow;
}

// Fast & slow: cycle detection, O(1) space
static boolean hasCycle(ListNode head) {
    ListNode slow = head, fast = head;
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
        if (slow == fast) return true;      // reference identity
    }
    return false;
}`,
    cpp: `// Converging on a sorted vector
vector<int> twoSumSorted(vector<int>& a, int target) {
    int L = 0, R = (int)a.size() - 1;       // cast: size() is unsigned
    while (L < R) {
        int s = a[L] + a[R];
        if (s == target) return {L, R};
        if (s < target) ++L; else --R;
    }
    return {};
}

// Same direction: remove duplicates in place
int dedupe(vector<int>& a) {
    int slow = 0;
    for (int fast = 0; fast < (int)a.size(); ++fast)
        if (fast == 0 || a[fast] != a[fast-1]) a[slow++] = a[fast];
    return slow;
}

// In-place reverse
void reverse_in_place(vector<int>& a) {
    int i = 0, j = (int)a.size() - 1;
    while (i < j) swap(a[i++], a[j--]);
}

// Fast & slow
bool hasCycle(ListNode* head) {
    ListNode *slow = head, *fast = head;
    while (fast && fast->next) {
        slow = slow->next; fast = fast->next->next;
        if (slow == fast) return true;
    }
    return false;
}`,
    js: `// Converging on a sorted array
function twoSumSorted(a, target) {
  let L = 0, R = a.length - 1;
  while (L < R) {
    const s = a[L] + a[R];
    if (s === target) return [L, R];
    if (s < target) L++; else R--;
  }
  return [];
}

// Same direction: remove duplicates in place
function dedupe(a) {
  let slow = 0;
  for (let fast = 0; fast < a.length; fast++)
    if (fast === 0 || a[fast] !== a[fast-1]) a[slow++] = a[fast];
  return slow;
}

// Palindrome (strings are immutable, index, don't mutate)
function isPal(s) {
  let i = 0, j = s.length - 1;
  while (i < j) { if (s[i] !== s[j]) return false; i++; j--; }
  return true;
}

// Fast & slow
function hasCycle(head) {
  let slow = head, fast = head;
  while (fast && fast.next) {
    slow = slow.next; fast = fast.next.next;
    if (slow === fast) return true;
  }
  return false;
}`,
  },
  codecap: "Converging, same-direction, and fast/slow, three shapes that between them cover most O(1)-space array and linked-list questions.",

  q: [
    ["What must every pointer move guarantee?", "That it discards only candidates which cannot be the answer. Without that elimination argument the sweep can skip the solution."],
    ["Spell out the elimination argument for sorted two-sum.", "If a[L]+a[R] > target then a[R] paired with any remaining element is even bigger, since a[L] is the smallest left. So a[R] can never be part of a solution and is discarded."],
    ["Why is the total work O(n)?", "Each step advances exactly one pointer and they only move toward each other, so they meet after at most n steps."],
    ["Name the three variants and one use each.", "Converging (sorted two-sum, container with most water); same-direction fast/slow writer (remove duplicates in place); different speeds (Floyd's cycle detection, find the middle node)."],
    ["Why must fast and slow eventually meet inside a cycle?", "Once both are in the loop the gap between them shrinks by exactly one each step, so it must reach zero."],
    ["Two pointers or hash map for Two Sum?", "Hash map: O(n) time, O(n) space, works unsorted and preserves original indices. Two pointers: O(1) space but needs sorted input (O(n log n) if you must sort). Choose by the space constraint and whether indices matter."],
  ],

  p: [
    [125, "valid-palindrome", "Valid Palindrome", "E"],
    [283, "move-zeroes", "Move Zeroes, fast & slow", "E"],
    [167, "two-sum-ii-input-array-is-sorted", "Two Sum II, converging", "M"],
    [11, "container-with-most-water", "Container With Most Water", "M"],
    [15, "3sum", "3Sum, fix one, two-point the rest", "M"],
    [141, "linked-list-cycle", "Linked List Cycle. Floyd", "E"],
    [42, "trapping-rain-water", "Trapping Rain Water", "H"],
  ],
},

];
