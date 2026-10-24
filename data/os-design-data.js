/* os-design-data.js, two kernel subsystems grown stage by stage, the same
   pattern and rigor as design-data.js and ai-design-data.js: a stage may only
   add a box if it can name the pressure that broke the previous stage, and
   every box carries its own reasoning (alts, pros, cons, cost, fails).
   See docs/CONTENT-GUIDE.md, "Adding a Design Lab project".

   Validate with `node tools/check-ai.js`, which checks the AI, CN and OS
   design data in one pass.

   The data sits inside a function so the small helpers (N, pick, B) do not
   become globals that could collide with the page's own script.
*/

const DESIGN = (() => {

const N = (id, l, s, col, row, r) => ({ id, l, s, col, row, r });
const pick = (all, ids) => ids.map(id => all[id]);
const B = (id, n, r, job, why, forced, alts, pros, cons, cost, fails, say) =>
  ({ id, n, r, job, why, forced, alts, pros, cons, cost, fails, say });

/* ------------------------- project 1: the CPU scheduler ------------------------- */
const SCH = {
  task:  N("task", "Tasks", "processes and threads", 0, 0, "client"),
  wake:  N("wake", "Wakeup path", "I/O done, task ready", 1, 0, "svc"),
  cg:    N("cg", "Cgroup limits", "weights and quotas", 1, 1, "store"),
  rq:    N("rq", "Run queue", "tasks ready to run", 2, 0, "queue"),
  pcb:   N("pcb", "Process table", "saved state per task", 2, 1, "store"),
  disp:  N("disp", "Dispatcher", "picks and switches", 3, 0, "svc"),
  timer: N("timer", "Timer interrupt", "fires every few ms", 3, 1, "ext"),
  cpu:   N("cpu", "CPU cores", "run one task each", 4, 0, "work"),
  bal:   N("bal", "Load balancer", "moves tasks between cores", 4, 1, "work"),
};

/* ------------------------- project 2: virtual memory manager ------------------------- */
const VM = {
  proc: N("proc", "Process", "uses virtual addresses", 0, 0, "client"),
  mmu:  N("mmu", "MMU", "translates every access", 1, 0, "edge"),
  tlb:  N("tlb", "TLB", "recent translations", 1, 1, "cache"),
  pt:   N("pt", "Page table", "virtual to physical", 2, 0, "store"),
  fh:   N("fh", "Fault handler", "runs when a page is absent", 2, 1, "svc"),
  ram:  N("ram", "Physical RAM", "frames of 4 KB", 3, 0, "store"),
  fa:   N("fa", "Frame allocator", "finds a free frame", 3, 1, "svc"),
  disk: N("disk", "Swap and files", "pages not in RAM", 4, 0, "ext"),
  rep:  N("rep", "Reclaim daemon", "evicts cold pages", 4, 1, "work"),
};

return [

{
  id: "cpu-scheduler", kind: "hld", n: "A CPU scheduler", sub: "Sharing a multicore CPU among hundreds of tasks",
  tags: ["preemption by timer interrupt", "state saved in the process table", "per-core queues and balancing"],
  one: "Start from the fact that one core runs one task at a time, then add only what a failure forces: a timer so nothing can hog the core, a table to save state, a wakeup path so sleepers return promptly, and a balancer so no core sits idle while another is overloaded.",

  brief: {
    why: "It is tempting to describe a scheduler as one algorithm, round robin or priorities. The real design question is <b>what the machinery around the algorithm must guarantee</b>: a runaway loop cannot freeze the machine, a task that just finished I/O does not wait behind a compile, and eight cores are all busy when there is work. The algorithm is one box. The rest is what makes it safe to run.",
    functional: [
      "<b>Run many tasks on few cores.</b> Hundreds of ready tasks share 8 cores, and each makes visible progress.",
      "<b>Preempt.</b> A task that never yields loses the core when its time slice ends.",
      "<b>Favour interactive work.</b> A task that sleeps a lot and wakes briefly gets the core quickly."
    ],
    out: ["real-time guarantees and deadlines", "power and frequency management", "NUMA-aware memory placement", "GPU scheduling", "the exact Linux CFS red-black tree"],
    nfr: [
      ["Wakeup latency", "a woken interactive task runs within a few milliseconds", "A keystroke handler that waits 50 ms behind a batch job makes the whole machine feel broken."],
      ["Fairness", "no ready task waits unboundedly", "Starvation is a bug even if the average is good. Aging or weights bound the wait."],
      ["Switch overhead", "under 1% of CPU time spent switching", "A quantum so short that switching dominates wastes the machine."],
      ["Core utilisation", "no core idle while another has a queue", "Idle cores with a waiting queue elsewhere is wasted hardware."],
      ["Isolation", "one group of tasks cannot consume all the CPU", "A runaway container must not starve its neighbours."]
    ],
    numbers: [
      ["Cores", "8", "Given."],
      ["Ready tasks", "about 400, 15 runnable at any instant", "Most tasks sleep waiting on I/O. Runnable is what the scheduler actually has to pick from."],
      ["Time slice", "about 4 ms", "Long enough to amortise a switch, short enough that 15 tasks cycle in 60 ms."],
      ["Context switch cost", "about 5 microseconds", "Plus cache refill afterwards. 5 us / 4 ms = 0.125% direct overhead."],
      ["Switches per core per second", "about 250", "1 second / 4 ms. 250 x 5 us = 1.25 ms, so 0.125% of the core."],
      ["Timer tick", "250 to 1000 Hz", "How often the timer interrupt lets the kernel reconsider who should run."]
    ],
    numbersNote: "<b>15 runnable tasks on 8 cores</b> says the scheduler's real job is a short queue, not a huge one. And <b>0.125% overhead</b> shows that even a 4 ms slice is cheap, so the interesting cost is the cache going cold after a switch, not the switch."
  },

  stagesIntro: "Six stages. Stage 0 is run-to-completion, which is a legitimate batch system. Every later stage fixes a specific way that falls over on a shared machine.",

  stages: [
    { t: "0. A queue, run to completion",
      pressure: "Nothing has gone wrong yet. A single core takes the next task from a queue and runs it until it finishes, which is exactly how early batch systems worked.",
      nodes: pick(SCH, ["task", "rq", "disp", "cpu"]),
      edges: [{ a: "task", b: "rq", l: "submit" }, { a: "rq", b: "disp", l: "next" }, { a: "disp", b: "cpu", l: "run" }],
      add: ["task", "rq", "disp", "cpu"],
      say: "Tasks join a queue, the dispatcher takes the head and gives it the core until it ends. Perfect for a job that runs for an hour with nobody watching.",
      breaks: "A task in an infinite loop, or just a long compile, holds the core forever. Anything behind it waits, and on a machine with a person typing, the screen stops responding." },

    { t: "1. A timer takes the core back",
      pressure: "One task that does not yield freezes everything. The kernel needs a way to take the core regardless of what the task wants.",
      nodes: pick(SCH, ["task", "rq", "disp", "timer", "cpu"]),
      edges: [{ a: "task", b: "rq", l: "submit" }, { a: "rq", b: "disp", l: "next" }, { a: "disp", b: "cpu", l: "run" }, { a: "timer", b: "disp", l: "preempt" }],
      add: ["timer"],
      say: "A hardware timer interrupts the core every few milliseconds. The interrupt cannot be refused by user code. The dispatcher puts the running task at the back of the queue and picks the next. That is round robin.",
      breaks: "Tasks now take turns, but when the dispatcher takes a task off the core it has nowhere to store the registers and program counter. Resuming it later would start it from scratch." },

    { t: "2. Save state in a process table",
      pressure: "Preempting a task is only useful if it can be resumed exactly where it stopped. Its registers, stack pointer and program counter must be saved somewhere.",
      nodes: pick(SCH, ["task", "rq", "pcb", "disp", "timer", "cpu"]),
      edges: [{ a: "task", b: "rq", l: "submit" }, { a: "rq", b: "disp", l: "next" }, { a: "pcb", b: "disp", l: "restore" }, { a: "disp", b: "cpu", l: "run" }, { a: "timer", b: "disp", l: "preempt" }],
      add: ["pcb"],
      say: "Each task has a process control block in the table. On a switch the dispatcher writes the running task's registers there and loads the next task's. This is the context switch, and it is pure overhead.",
      breaks: "Fair turns for everyone treat a task waking from I/O the same as a compile. An editor that was asleep waits behind the whole queue after every keypress." },

    { t: "3. A wakeup path for sleepers",
      pressure: "Interactive tasks sleep waiting for input, and when the key arrives they need a few microseconds of CPU, immediately. Plain round robin makes them wait a full lap.",
      nodes: pick(SCH, ["task", "wake", "rq", "pcb", "disp", "timer", "cpu"]),
      edges: [{ a: "task", b: "wake", l: "I/O done" }, { a: "wake", b: "rq", l: "boost" }, { a: "rq", b: "disp", l: "next" }, { a: "pcb", b: "disp", l: "restore" }, { a: "disp", b: "cpu", l: "run" }, { a: "timer", b: "disp", l: "preempt" }],
      add: ["wake"],
      say: "When a device finishes, the wakeup path marks the sleeper runnable and inserts it near the front, because a task that slept has used less than its fair share. Tasks that burn their whole slice sink in priority.",
      breaks: "Latency for interactive work is good on one core. But the machine has eight, and one queue feeding them all is both a contention point and a source of idle cores." },

    { t: "4. Balance work across cores",
      pressure: "A single shared queue is locked by every core on every decision. And with per-core queues, one core can sit idle while its neighbour has six tasks waiting.",
      nodes: pick(SCH, ["task", "wake", "rq", "pcb", "disp", "timer", "cpu", "bal"]),
      edges: [{ a: "task", b: "wake", l: "I/O done" }, { a: "wake", b: "rq", l: "boost" }, { a: "rq", b: "disp", l: "next" }, { a: "pcb", b: "disp", l: "restore" }, { a: "disp", b: "cpu", l: "run" }, { a: "timer", b: "disp", l: "preempt" }, { a: "bal", b: "cpu", l: "steal" }],
      add: ["bal"],
      say: "Each core owns its own run queue, so decisions need no global lock and the task stays warm in that core's cache. A balancer moves tasks from busy cores to idle ones, preferring cheap moves within a socket.",
      breaks: "Cores are busy and queues are even. But one noisy container spawning 200 threads still outvotes the ten well-behaved services next to it." },

    { t: "5. Group limits and weights",
      pressure: "Fairness between tasks is not fairness between owners. A group with 200 threads takes 200 shares, and a service with 2 gets a hundredth of it.",
      nodes: pick(SCH, ["task", "wake", "cg", "rq", "pcb", "disp", "timer", "cpu", "bal"]),
      edges: [{ a: "task", b: "wake", l: "I/O done" }, { a: "cg", b: "wake", l: "weights" }, { a: "wake", b: "rq", l: "boost" }, { a: "rq", b: "disp", l: "next" }, { a: "pcb", b: "disp", l: "restore" }, { a: "disp", b: "cpu", l: "run" }, { a: "timer", b: "disp", l: "preempt" }, { a: "bal", b: "cpu", l: "steal" }],
      add: ["cg"],
      say: "Tasks are grouped, and each group has a weight and optionally a hard quota. The scheduler divides the CPU between groups first and between the tasks inside each group second. This is how containers get their CPU shares.",
      breaks: undefined }
  ],

  boxesIntro: "Nine components. For each: the pressure that created it, what lost, what it costs, and how it fails.",

  boxes: [
    B("task", "Tasks", "client",
      "The processes and threads that want CPU time, each either running, ready or sleeping.",
      "The scheduler exists to serve them. Their behaviour, bursts of CPU or long waits, decides which policy fits.",
      "Nothing forced them. They are the demand.",
      [["Treating all tasks the same", "ignores that a compiler and a text editor want completely different things from the CPU."]],
      ["Most tasks sleep, so only a few are runnable at once.", "Their sleep history is a free signal about whether they are interactive."],
      ["The OS cannot predict how long a task will run, only observe it.", "A badly written task can spin and demand all the CPU."],
      "Zero to the scheduler itself. Every task adds some bookkeeping memory.",
      "A task forks in a loop, producing thousands of runnable children, and the queues fill with work that is not useful.",
      "I would say the scheduler is judged on the tasks it does not see: the ones that sleep most of the time and need a prompt reply."),

    B("wake", "Wakeup path", "svc",
      "Marks a task runnable when its I/O completes or its lock frees, and decides where it enters the queue.",
      "Responsiveness is decided at the moment a sleeper wakes, not later by the periodic timer.",
      "Stage 3, when interactive tasks waited a full lap of round robin.",
      [["Put it at the back like everyone else", "makes a 20 microsecond keystroke handler wait behind 15 batch tasks."], ["Always run it immediately", "lets a chatty task preempt constantly and starve everyone else."]],
      ["Interactive tasks feel instant.", "Based on measured sleep time, so nothing needs to be declared by the program."],
      ["A task that games it, sleeping for a microsecond to look interactive, can steal CPU.", "Preempting the running task adds a context switch."],
      "A small calculation on every wakeup, which is a very hot path.",
      "A task wakes thousands of times a second, each time pre-empting a useful task, and throughput collapses.",
      "Wakeup preemption gets a minimum granularity. A task may not preempt another that has barely started its slice."),

    B("cg", "Cgroup limits", "store",
      "Holds the weight and quota of each group of tasks, and feeds them to the scheduler.",
      "Per-task fairness is not per-owner fairness. Containers and users need to be protected from each other.",
      "Stage 5, when one group with many threads took most of the machine.",
      [["Per-task fairness only", "rewards whoever creates the most threads."], ["Fixed core assignment", "wastes cores that a quiet group is not using."]],
      ["A group can be guaranteed a share and capped at a limit.", "Unused share is lent to others, so cores are not wasted."],
      ["A hard quota can throttle a bursty service even when the machine is idle.", "Another layer of accounting on every scheduling decision."],
      "Small bookkeeping per group, but a real configuration burden.",
      "A service has a quota of 2 cores and uses 4 for a burst. It is throttled for the rest of the period and its latency spikes while the machine is idle.",
      "I would prefer weights to hard quotas, since weights share idle capacity and quotas do not."),

    B("rq", "Run queue", "queue",
      "Holds the tasks that are ready, ordered so the dispatcher can take the next one cheaply.",
      "Between 'ready' and 'running' tasks must wait somewhere, in an order the scheduler controls.",
      "Present from stage 0.",
      [["A plain FIFO list", "cannot favour a task that has slept, or one with a higher weight."], ["A sorted array", "inserting costs O(n) on every wakeup."]],
      ["Ordered by a key such as virtual runtime, so the most deserving task is always first.", "A tree or heap makes insert and pick-next O(log n)."],
      ["Contended if shared by all cores.", "Order is only as good as the key chosen."],
      "O(log n) per insert and per pick. With 15 runnable tasks that is almost nothing.",
      "One global queue is guarded by one lock, and at 64 cores the cores spend more time waiting for it than running tasks.",
      "One queue per core, with the lock rarely contended, and balancing handled separately."),

    B("pcb", "Process table", "store",
      "Stores each task's saved registers, stack pointer, priority, accounting and state.",
      "A task that was stopped has to be restartable exactly where it left off.",
      "Stage 2, when preemption needed somewhere to save the running task.",
      [["Keeping state on the CPU", "the next task needs the same registers."], ["Saving only some registers", "a missed one corrupts the task in a way that appears much later."]],
      ["Makes preemption transparent: the task never knows it was paused.", "Accounting fields tell the scheduler how much CPU each task has used."],
      ["Saving and restoring is the context switch cost, repeated thousands of times a second.", "Floating point and vector state can be large."],
      "A few hundred bytes of registers per task, more with vector state, and a copy each switch.",
      "A switch forgets to save a vector register. Two tasks occasionally see each other's floating point values, and results are subtly wrong.",
      "Lazy saving of the heavy vector state: only when a task has actually used it since the last switch."),

    B("disp", "Dispatcher", "svc",
      "Picks the next task, saves the old one's state, loads the new one's and gives it the core.",
      "Someone has to make the final decision and perform the switch. Keeping it small keeps the switch cheap.",
      "Present from stage 0.",
      [["Letting tasks yield to each other", "a task that does not cooperate blocks the machine."]],
      ["A short, well-understood code path.", "Policy is separate from mechanism, so the algorithm can be replaced."],
      ["Runs on every switch, so any slowness is multiplied.", "Runs in the kernel with interrupts disabled for parts of it."],
      "A few microseconds per switch plus the cost of cold caches afterwards.",
      "A bug in the dispatcher is a bug in everything. A wrong pick, or a lost task, looks like a hang with no obvious cause.",
      "I keep the dispatcher dull and push the clever parts into the ordering of the queue."),

    B("timer", "Timer interrupt", "ext",
      "Fires every few milliseconds and gives the kernel a chance to take the core back.",
      "Preemption needs a hardware event the task cannot ignore.",
      "Stage 1, when a runaway loop could hold the core forever.",
      [["Cooperative yielding", "relies on every task behaving."], ["Checking at system calls only", "a task that never makes one is never interrupted."]],
      ["Guarantees the kernel regains control.", "Also drives timekeeping and sleeping."],
      ["Each tick costs an interrupt even on an idle machine, which wastes power.", "A faster tick improves latency and raises overhead."],
      "At 1000 Hz that is a thousand interrupts per second per core, a small but real cost.",
      "The tick is too coarse for a short deadline, and a task that should wake at 1 ms wakes at 4 ms.",
      "A tickless kernel on idle cores, and high-resolution timers for the precise wakeups that really need them."),

    B("cpu", "CPU cores", "work",
      "Execute exactly one task each until the dispatcher or an interrupt intervenes.",
      "The scarce resource everything else shares out.",
      "Present from stage 0.",
      [["Faster single core", "has stopped improving, so more cores are how hardware scales."]],
      ["Genuine parallelism for tasks on different cores.", "A task that stays on one core keeps its cache warm."],
      ["Cores share memory bandwidth and sometimes cache.", "Moving a task between cores loses its cache."],
      "The hardware itself. Idle time is the cost you are trying to avoid.",
      "One core is stuck handling a flood of network interrupts while the others idle, and the machine looks underused but is slow.",
      "I would spread interrupts across cores and watch per-core utilisation, not just the average."),

    B("bal", "Load balancer", "work",
      "Moves tasks from overloaded cores to idle ones, preferring cheap moves.",
      "Per-core queues avoid contention, but they can become uneven.",
      "Stage 4, when one core idled while a neighbour had a queue.",
      [["One shared queue", "removes imbalance and brings back a global lock."], ["Never migrating", "leaves cores idle and tasks waiting."]],
      ["Keeps all cores busy without a global lock on the fast path.", "An idle core can pull work immediately."],
      ["Migrating a task throws away its warm cache.", "Too eager and tasks bounce between cores."],
      "Periodic checks every few milliseconds, plus an immediate pull when a core goes idle.",
      "The balancer moves a task to a core on another socket. The task's memory is on the first socket, and it runs slower than before.",
      "I would balance within a cache domain first and cross sockets only when the imbalance is large.")
  ],

  flowsIntro: "Walk the paths. For each step say which box acts and what state is saved or restored.",

  flows: [
    { n: "A timer tick preempts a running task",
      note: "The basic mechanism. The task never agrees to stop.",
      steps: [
        ["Task A has been running on core 2 for its full 4 ms slice.", "sync"],
        ["The timer interrupt fires, and the CPU jumps to the kernel's interrupt handler.", "sync"],
        ["The handler sees A's slice is used up and asks the dispatcher to reschedule.", "sync"],
        ["The dispatcher saves A's registers in the process table and puts A back in the run queue.", "sync"],
        ["It takes task B from the queue, loads B's saved registers and returns from the interrupt into B.", "sync"]
      ] },
    { n: "A keypress wakes an editor",
      note: "The latency path. A few microseconds of work needs to start quickly.",
      steps: [
        ["The keyboard raises an interrupt, and the driver reads the key.", "sync"],
        ["The wakeup path marks the editor runnable. It slept a long time, so it has a low virtual runtime.", "sync"],
        ["It is inserted at the front of core 2's run queue.", "sync"],
        ["Wakeup preemption sees it is far more deserving than the running compile, and requests a reschedule.", "sync"],
        ["The editor runs for a few microseconds, draws the character and goes back to sleep.", "sync"]
      ] },
    { n: "Core 5 goes idle",
      note: "The balancer path, when per-core queues become uneven.",
      steps: [
        ["Core 5 finishes its last task and finds its run queue empty.", "sync"],
        ["Rather than idle, it looks at the busiest core in its cache domain, core 3.", "sync"],
        ["Core 3 has six waiting tasks. Core 5 steals the one that has been waiting longest.", "sync"],
        ["The task's saved state is already in the process table, so it simply runs on core 5.", "sync"],
        ["If every core nearby were idle, core 5 would halt and wait for an interrupt to save power.", "async"]
      ] }
  ],

  tradeoffsIntro: "Say the pair, pick a side, then say what would change your mind.",

  tradeoffs: [
    { a: ["Per-core run queues", "No global lock, and tasks stay warm in a core's cache, at the cost of needing a balancer."],
      b: ["One global run queue", "Perfect balance for free, at the cost of a lock every core fights for on every decision."],
      pick: "a",
      flip: "the machine has two or four cores. Then the lock is rarely contended, and a single queue is simpler." },
    { a: ["Preemptive scheduling", "A runaway task cannot freeze the machine, at the cost of switch overhead and harder shared-data code."],
      b: ["Cooperative scheduling", "Fewer switches and no surprise interruptions, at the cost of trusting every task to yield."],
      pick: "a",
      flip: "all code is trusted and very short-running, as on an embedded controller or a single-purpose runtime. Then cooperation is simpler and faster." },
    { a: ["Weights between groups", "Idle capacity is lent to whoever can use it, at the cost of no hard guarantee when everyone is busy."],
      b: ["Hard CPU quotas", "A group can never exceed its cap, at the cost of throttling it even when cores are idle."],
      pick: "a",
      flip: "you bill by CPU time or must contain a hostile tenant. Then a hard cap is the honest tool." }
  ],

  next: [
    "<b>Real-time classes.</b> A fixed-priority class for tasks with deadlines, such as audio, which always run before ordinary work.",
    "<b>NUMA awareness.</b> Keep a task near its memory, since a remote memory access can be twice as slow.",
    "<b>Energy-aware scheduling.</b> Put light work on small cores and let big cores sleep.",
    "<b>Priority inheritance.</b> A low-priority task holding a lock a high-priority task needs should temporarily borrow its priority."
  ],

  p: [
    ["SRC", "https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-sched-mlfq.pdf", "OSTEP, the multi-level feedback queue", "M"],
    ["SRC", "https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-sched-multi.pdf", "OSTEP, multiprocessor scheduling", "M"],
    ["SRC", "https://docs.kernel.org/scheduler/sched-design-CFS.html", "Linux kernel, CFS design", "H"],
    ["SRC", "https://docs.kernel.org/admin-guide/cgroup-v2.html", "Linux kernel, cgroup v2 CPU controller", "H"],
    ["SRC", "https://man7.org/linux/man-pages/man7/sched.7.html", "man 7 sched", "M"]
  ]
},

{
  id: "vm-manager", kind: "hld", n: "A virtual memory manager", sub: "Giving every process a large private address space",
  tags: ["translate every access", "faults load pages on demand", "reclaim before memory runs out"],
  one: "Begin with a process that touches RAM directly, then add what each failure demands: a translation layer for isolation, a TLB because translation is slow, a fault handler for pages that are not there, and a reclaim daemon so memory never actually runs out.",

  brief: {
    why: "Virtual memory is often drawn as one box, 'paging'. The design question is <b>what is on the path of every single memory access</b>, and what happens on the rare path when the page is missing. The fast path has to cost nanoseconds. The slow path can cost milliseconds, but it must not happen often, and it must never lose data.",
    functional: [
      "<b>Isolate.</b> A process can only reach memory it has been given. A stray pointer cannot touch another process.",
      "<b>Give a large space.</b> A process may use more virtual memory than there is RAM.",
      "<b>Share.</b> Libraries and forked children share physical pages until one writes."
    ],
    out: ["huge pages and transparent hugepages", "NUMA placement", "memory-mapped device I/O", "memory cgroups and OOM policy details", "kernel address space layout"],
    nfr: [
      ["Translation cost", "about 1 ns on a TLB hit", "It sits in front of every load and store. A slow translation slows every instruction."],
      ["TLB hit rate", "at least 99%", "At 99% the average access is 102 ns instead of 200 ns."],
      ["Fault rate", "under 1 per 10,000 accesses in steady state", "A disk-backed fault costs about 100 microseconds. Too many make the machine crawl."],
      ["Free memory", "never fully exhausted", "Running out in the middle of a fault means the OS must kill something."],
      ["Isolation", "no process can read another's pages", "The entire security model of the machine rests on it."]
    ],
    numbers: [
      ["Page size", "4 KB", "Given. 12 offset bits, so a 32-bit space has 2^20 pages."],
      ["Flat page table", "4 MB per process", "2^20 entries x 4 bytes. With 200 processes that is 800 MB, mostly empty."],
      ["RAM access", "about 100 ns", "Given."],
      ["TLB lookup", "about 1 ns", "Given. A hit adds almost nothing."],
      ["Effective access time at 99% hits", "102 ns", "0.99 x 101 + 0.01 x 201."],
      ["Major fault (SSD)", "about 100 microseconds", "1000 times slower than RAM. A 1% fault rate would make the average access 1,100 ns."],
      ["Working set", "2 GB hot of 16 GB virtual", "Programs touch a small part of what they map. This is why demand paging works at all."]
    ],
    numbersNote: "<b>Effective access time of 102 ns</b> says the TLB is what keeps translation free. And the <b>1000x gap</b> between RAM and a fault says everything about the reclaim daemon: the goal is for a fault never to be on the critical path."
  },

  stagesIntro: "Six stages. Stage 0 has no translation at all, which is correct for a single-program machine. Each stage adds one thing a failure demands.",

  stages: [
    { t: "0. Direct physical addresses",
      pressure: "Nothing has gone wrong yet. A program uses real RAM addresses, which is exactly how early single-program machines worked.",
      nodes: pick(VM, ["proc", "ram"]),
      edges: [{ a: "proc", b: "ram", l: "load, store" }],
      add: ["proc", "ram"],
      say: "A program reads and writes RAM at real addresses. There is nothing between them and nothing to go wrong, while only one program runs at a time.",
      breaks: "As soon as two programs run, they must be placed at different addresses, a bug in one can overwrite the other, and neither can be moved once started. There is no protection." },

    { t: "1. Translate through a page table",
      pressure: "Two programs cannot be trusted to stay in their own memory, and programs compiled for the same addresses collide. Every access needs to be checked and redirected.",
      nodes: pick(VM, ["proc", "mmu", "pt", "ram"]),
      edges: [{ a: "proc", b: "mmu", l: "virtual" }, { a: "mmu", b: "pt", l: "lookup" }, { a: "pt", b: "ram", l: "physical" }],
      add: ["mmu", "pt"],
      say: "The MMU, in the CPU, translates each virtual address through the process's page table. Each process has its own table, so each sees its own private address space, and the OS decides what is mapped.",
      breaks: "Isolation works, but every load and store now reads the page table in memory first. That doubles the memory accesses, and the whole machine runs at half speed." },

    { t: "2. Cache translations in a TLB",
      pressure: "Reading the table in RAM on every access doubles the cost. Programs reuse the same pages repeatedly, so the same translations are being computed again and again.",
      nodes: pick(VM, ["proc", "mmu", "tlb", "pt", "ram"]),
      edges: [{ a: "proc", b: "mmu", l: "virtual" }, { a: "mmu", b: "tlb", l: "check first" }, { a: "mmu", b: "pt", l: "on a miss" }, { a: "pt", b: "ram", l: "physical" }],
      add: ["tlb"],
      say: "A small, very fast cache inside the MMU keeps recent page to frame mappings. A hit costs about a nanosecond. Only a miss walks the table. At a 99% hit rate the average access is 102 ns, close to raw memory.",
      breaks: "Translation is fast, but a process can only use pages that fit in RAM. A program that wants more than the machine has simply cannot run, and unused pages still occupy frames." },

    { t: "3. Load pages on demand",
      pressure: "Most of a program's pages are not touched for long periods, and some programs map more than there is RAM. Keeping everything resident wastes memory.",
      nodes: pick(VM, ["proc", "mmu", "tlb", "pt", "fh", "ram", "disk"]),
      edges: [{ a: "proc", b: "mmu", l: "virtual" }, { a: "mmu", b: "tlb", l: "check first" }, { a: "mmu", b: "pt", l: "on a miss" }, { a: "pt", b: "ram", l: "physical" }, { a: "pt", b: "fh", l: "not present" }, { a: "fh", b: "ram", l: "page in" }, { a: "ram", b: "disk", l: "swap out" }],
      add: ["fh", "disk"],
      say: "A page table entry can say 'not present'. Touching it raises a fault, the handler finds the page on disk, loads it into a frame and retries the instruction. The program never knows, and total virtual memory can exceed RAM.",
      breaks: "The handler needs a free frame and has no organised way to find one. Under memory pressure it scans for a victim in the middle of the fault, and the process waits for the whole search." },

    { t: "4. A frame allocator",
      pressure: "Finding a free frame inside the fault handler is slow and unpredictable. Frames need to be tracked and handed out in constant time.",
      nodes: pick(VM, ["proc", "mmu", "tlb", "pt", "fh", "fa", "ram", "disk"]),
      edges: [{ a: "proc", b: "mmu", l: "virtual" }, { a: "mmu", b: "tlb", l: "check first" }, { a: "mmu", b: "pt", l: "on a miss" }, { a: "pt", b: "ram", l: "physical" }, { a: "pt", b: "fh", l: "not present" }, { a: "fh", b: "fa", l: "need a frame" }, { a: "fa", b: "ram", l: "hand out" }, { a: "ram", b: "disk", l: "swap out" }],
      add: ["fa"],
      say: "The allocator keeps free frames on lists and hands one out in constant time. The fault handler just asks for a frame. It also zeroes the frame first, so one process can never read another's old data.",
      breaks: "The allocator is fast while free frames exist. But as memory fills, the free list empties, and the next fault must evict a page and write it to disk before it can proceed." },

    { t: "5. Reclaim before memory runs out",
      pressure: "When the free list hits zero, the faulting process pays for an eviction and a disk write in line, which is a delay of milliseconds on the critical path.",
      nodes: pick(VM, ["proc", "mmu", "tlb", "pt", "fh", "fa", "ram", "disk", "rep"]),
      edges: [{ a: "proc", b: "mmu", l: "virtual" }, { a: "mmu", b: "tlb", l: "check first" }, { a: "mmu", b: "pt", l: "on a miss" }, { a: "pt", b: "ram", l: "physical" }, { a: "pt", b: "fh", l: "not present" }, { a: "fh", b: "fa", l: "need a frame" }, { a: "fa", b: "ram", l: "hand out" }, { a: "ram", b: "disk", l: "swap out" }, { a: "rep", b: "disk", l: "write back" }],
      add: ["rep"],
      say: "A background daemon watches the free count. When it dips below a low watermark, it picks cold pages using the clock algorithm, writes dirty ones to disk and frees them. By the time a fault asks, a frame is already there.",
      breaks: undefined }
  ],

  boxesIntro: "Nine components. For each: the pressure that created it, what lost, what it costs, and how it fails.",

  boxes: [
    B("proc", "Process", "client",
      "Issues loads and stores using virtual addresses, with no knowledge of where the data really is.",
      "Programs must be written once and run anywhere, so they cannot depend on physical placement.",
      "Nothing forced it. It is the reason all the rest exists.",
      [["Programs using physical addresses", "need to be relocated, and can trample each other."]],
      ["Sees one large, contiguous, zero-based space.", "A bug is contained to its own space."],
      ["Cannot tell a fast access from one that faulted to disk.", "A wild pointer still crashes the program, just not the machine."],
      "Zero extra work for the program. The OS and hardware absorb the cost.",
      "A program walks through an array far larger than RAM in a pattern that defeats caching, and every access faults.",
      "I would say the process is blissfully unaware by design, and that this is also why its performance can fall off a cliff."),

    B("mmu", "MMU", "edge",
      "Translates the virtual address of every load and store, and raises a fault if it cannot.",
      "Isolation and relocation have to be enforced by hardware, because software checks on every access would be far too slow.",
      "Stage 1, when two programs needed to be kept apart.",
      [["Software address checks", "cost many instructions per access."], ["Base and limit registers", "allow only one contiguous region per process and cause fragmentation."]],
      ["Enforces protection with no software on the fast path.", "The same mechanism provides sharing and copy-on-write."],
      ["On the critical path of every access, so its latency matters hugely.", "The page table format is fixed by the hardware."],
      "Built into the CPU, free to the OS, but the translation caches use real silicon.",
      "The OS forgets to flush a stale mapping when a page is unmapped. The process keeps reading memory that now belongs to someone else.",
      "Whenever the OS changes a mapping it invalidates the matching TLB entry, on every core that might hold it."),

    B("tlb", "TLB", "cache",
      "Caches recent virtual to physical translations so a hit costs about a nanosecond.",
      "Walking the page table on every access doubles memory traffic, and programs reuse a small set of pages.",
      "Stage 2, when translation halved the machine's speed.",
      [["A bigger page table cache in RAM", "is still a memory access."], ["Larger pages only", "reduce misses but waste memory, and do not remove the need for caching."]],
      ["A 99% hit rate makes translation effectively free.", "A small structure, so it is extremely fast."],
      ["Tiny, a few hundred entries, so a program with scattered access misses a lot.", "Must be flushed or tagged on a switch between processes."],
      "A few hundred entries of silicon. The cost is the misses, about 100 ns each.",
      "A context switch flushes the whole TLB. The new process starts cold, and misses on its first hundred accesses.",
      "Tag entries with a process id so a switch does not flush, and use huge pages for big hot regions to stretch the reach."),

    B("pt", "Page table", "store",
      "Maps each virtual page of a process to a physical frame, with present, writable and dirty bits.",
      "Some structure must record the mapping. Per-page entries allow any page to go anywhere.",
      "Stage 1, when translation first appeared.",
      [["One flat table", "4 MB per process with a 32-bit space, mostly empty."], ["An inverted table, one entry per frame", "lookup needs hashing and sharing is awkward."]],
      ["A multi-level table allocates only the parts in use.", "Per-page permissions allow read-only code and copy-on-write."],
      ["A walk is several dependent memory reads on a TLB miss.", "Takes memory itself, and is per process."],
      "A few KB for a small process, to tens of MB for a huge one.",
      "A process with a sparse address space, scattered across a 64-bit range, needs many table pages and wastes memory on tables alone.",
      "Four or five levels, so memory is spent only on the regions that exist, and the walk is usually served from cache."),

    B("ram", "Physical RAM", "store",
      "Holds the frames that back resident pages.",
      "The real, finite resource the whole design shares out.",
      "Present from stage 0.",
      [["Unlimited virtual memory with no backing", "does not exist."]],
      ["Fast: about 100 ns to access.", "Shared pages are stored once."],
      ["Finite, and shared by every process.", "Volatile: its contents vanish on power loss."],
      "Dominates the hardware cost of the machine, so using it well is the point.",
      "Total working sets exceed RAM. Every process faults constantly and the machine thrashes, doing almost no useful work.",
      "I would watch the major fault rate. When it rises sharply, no tuning of the algorithm helps, and the real fix is more RAM or fewer processes."),

    B("fh", "Fault handler", "svc",
      "Runs when a page is not present: finds the page, gets a frame, loads it, fixes the table and restarts the instruction.",
      "A missing page is not an error, it is the signal to do the lazy work.",
      "Stage 3, when pages needed to come from disk on demand.",
      [["Loading the whole program up front", "slow to start and wastes memory on code never run."], ["Killing the process", "turns a normal event into a crash."]],
      ["Programs start instantly and only pay for what they touch.", "The same path handles copy-on-write and stack growth."],
      ["Each major fault stalls the process for 100 microseconds or more.", "Runs in the kernel, so a bug there is serious."],
      "About 1 microsecond for a minor fault, 100 microseconds for an SSD read, milliseconds for a hard disk.",
      "A fault happens while the kernel holds a lock. The handler needs the same lock, and the machine deadlocks.",
      "Distinguish minor faults, which are the page already in RAM, from major ones. Only major faults should appear in your latency graph."),

    B("fa", "Frame allocator", "svc",
      "Hands out free frames in constant time and zeroes them before use.",
      "The fault handler needs a frame immediately, and an old page's contents must never leak to a new owner.",
      "Stage 4, when finding a free frame took a search inside a fault.",
      [["Scanning for a free frame", "takes time proportional to RAM size."], ["Not zeroing", "leaks data between processes."]],
      ["O(1) allocation from free lists.", "Zeroing closes an information leak."],
      ["Fragmentation: a large contiguous run may be unavailable though plenty is free.", "Zeroing 4 KB costs real time."],
      "Constant time, plus about a microsecond to zero a page.",
      "Memory is plentiful but fragmented, and a request for a physically contiguous 2 MB region fails.",
      "A buddy allocator, which merges neighbouring free blocks so larger contiguous regions can be rebuilt."),

    B("disk", "Swap and files", "ext",
      "Stores pages that are not in RAM, either in swap space or in the file they were mapped from.",
      "Something larger and cheaper than RAM must hold the pages that are not being used.",
      "Stage 3, when virtual memory was allowed to exceed RAM.",
      [["Refusing to over-commit", "limits every program to what physically exists."], ["Keeping everything in RAM", "wastes it on idle pages."]],
      ["Capacity is huge and cheap.", "File-backed pages need no swap at all, since they can be re-read from the file."],
      ["100 to 100,000 times slower than RAM.", "Swap on a hard disk is catastrophic for latency."],
      "Cheap per gigabyte, expensive per access.",
      "A server starts swapping, response times go from 5 ms to 5 seconds, and from outside it just looks hung.",
      "For latency-sensitive services I would disable swap or keep it small, and alert on any swap-in activity."),

    B("rep", "Reclaim daemon", "work",
      "Runs in the background, frees cold pages before memory is exhausted, and writes dirty ones back.",
      "Eviction is slow, so it should happen ahead of need, not while a process waits.",
      "Stage 5, when a fault with an empty free list had to evict inline.",
      [["Evicting only on demand", "puts disk writes on the faulting process's critical path."], ["Never evicting", "memory fills and the machine hangs."]],
      ["Faults usually find a ready frame.", "Batches writes, which disks handle better."],
      ["Competes for the disk with real work.", "May evict a page that is needed again soon."],
      "A little CPU and disk bandwidth, continuously.",
      "The daemon cannot keep up with a process that dirties pages faster than the disk can absorb, and everything stalls anyway.",
      "Low and high watermarks: start reclaiming at the low one, stop at the high one, and throttle writers whose dirty pages exceed a limit.")
  ],

  flowsIntro: "Walk the paths. For each step say who is waiting, and whether the step runs in hardware or in the kernel.",

  flows: [
    { n: "A load that hits the TLB",
      note: "The path taken by more than 99% of accesses. Nothing here is software.",
      steps: [
        ["The process executes a load from virtual address 0x00403A7C.", "sync"],
        ["The MMU splits the address into page 0x403 and offset 0xA7C and checks the TLB.", "sync"],
        ["The TLB holds page 0x403 mapped to frame 0x1A2, so the MMU forms physical address 0x1A2A7C.", "sync"],
        ["The memory system returns the data in about 100 ns, and the instruction completes.", "sync"]
      ] },
    { n: "A first touch that page-faults",
      note: "A page is not resident. The process is paused, and the kernel does the work.",
      steps: [
        ["The load misses the TLB, and the MMU walks the page table.", "sync"],
        ["The entry has present = 0, so the MMU raises a page fault and the CPU enters the kernel.", "sync"],
        ["The fault handler asks the frame allocator for a free frame, which is zeroed.", "sync"],
        ["It reads the page from disk into that frame, while the scheduler runs other processes.", "async"],
        ["The handler sets the entry to present, the TLB is refilled, and the load is retried and succeeds.", "sync"]
      ] },
    { n: "fork with copy-on-write",
      note: "Why creating a process is cheap.",
      steps: [
        ["fork copies the parent's page table into the child, and marks every entry read-only in both.", "sync"],
        ["Parent and child now share every physical frame. No data has been copied.", "sync"],
        ["The child writes to a page. The page is read-only, so the MMU raises a fault.", "sync"],
        ["The handler sees it is a copy-on-write page, allocates a frame and copies just that page.", "sync"],
        ["The child's entry now points at the private copy, writable. The parent keeps the original.", "sync"]
      ] }
  ],

  tradeoffsIntro: "Say the pair, pick a side, then say what would change your mind.",

  tradeoffs: [
    { a: ["4 KB pages", "Little wasted memory and fine-grained protection, at the cost of many table entries and TLB misses."],
      b: ["2 MB huge pages", "512 times fewer entries and far fewer TLB misses, at the cost of internal waste and harder allocation."],
      pick: "a",
      flip: "a program has a huge, hot, contiguous data set, such as a database buffer pool. Then huge pages reduce misses a lot." },
    { a: ["Demand paging", "Programs start fast and use only what they touch, at the cost of faults on first access."],
      b: ["Load everything at start", "No faults later, at the cost of slow starts and memory spent on cold pages."],
      pick: "a",
      flip: "a latency-critical service cannot afford any fault after startup. Then pre-fault and lock its memory." },
    { a: ["Multi-level page tables", "Memory spent only on regions in use, at the cost of several dependent reads on a TLB miss."],
      b: ["A single flat table", "One read per walk, at the cost of 4 MB per process even for a tiny program."],
      pick: "a",
      flip: "the address space is small, say 16 bits on a microcontroller. Then a flat table is tiny and a single lookup is best." }
  ],

  next: [
    "<b>Huge pages.</b> Transparent huge pages cut TLB pressure for big heaps, with care for fragmentation.",
    "<b>NUMA-aware placement.</b> Allocate frames close to the core that will use them, since remote access is slower.",
    "<b>Memory cgroups.</b> Per-group limits, so one container's leak triggers its own reclaim and not the whole machine's.",
    "<b>Kernel same-page merging.</b> Detect identical pages across processes and share them, useful for virtual machines."
  ],

  p: [
    ["SRC", "https://pages.cs.wisc.edu/~remzi/OSTEP/vm-paging.pdf", "OSTEP, paging: introduction", "M"],
    ["SRC", "https://pages.cs.wisc.edu/~remzi/OSTEP/vm-tlbs.pdf", "OSTEP, TLBs", "M"],
    ["SRC", "https://pages.cs.wisc.edu/~remzi/OSTEP/vm-beyondphys.pdf", "OSTEP, beyond physical memory", "M"],
    ["SRC", "https://docs.kernel.org/admin-guide/mm/concepts.html", "Linux kernel, memory management concepts", "H"],
    ["SRC", "https://man7.org/linux/man-pages/man5/proc.5.html", "man 5 proc, read /proc/meminfo and /proc/self/smaps", "M"]
  ]
},

];

})();
