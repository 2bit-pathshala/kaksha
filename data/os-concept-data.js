/* os-concept-data.js, the single source of truth for the Operating Systems
   concept and revision pages (os-concept.html, os-revise.html), the same
   pattern as ai-concept-data.js and cn-concept-data.js. Same ten fixed
   sections, same authoring rules (docs/CONTENT-GUIDE.md), and the same
   deliberate deviation as the AI pages: `code` is `{pseudo, py}` only.
   The Python uses the standard library (os, threading, mmap), so every
   sample runs as written on Linux or macOS.

   Validate with `node tools/check-ai.js`, which checks the AI, CN and OS data
   in one pass.

   The `viz` ids referenced below ("os-...") are defined in assets/js/viz.js,
   in the "Operating Systems visuals" section near the end.

   Node: { id, n, group, need?, one, plain, why:[{t,d}], hing, math:[{t,d,w}],
           viz:[], costs:[[op,cost,why]], traps:[], code:{pseudo,py}, codecap,
           q:[[question,answer]], p:[[num|SRC, slug|url, title, "E|M|H"]] }
*/

const CONCEPTS = [

{
  id: "processes-threads",
  need: {
    ask: `<p>Your laptop is running a browser, a music player and a code editor at the same moment. It has 8 cores, and about 400 things that want to run. Each program believes it owns the whole machine.</p>
<p>What does the operating system hand each program so that this illusion holds, and how can two parts of one program share work?</p>`,
    tries: [
      ["Run programs one after another", "A 20-minute video export would freeze everything else for 20 minutes. Nobody could type while it ran."],
      ["Let programs share memory freely", "A bug in the music player could overwrite the editor's text. One crash would take the whole machine down with it."],
    ],
    so: `<p>Give each program a <b>process</b>: its own private address space, its own open files, and a record the OS keeps about it. The processes take turns on the CPU, fast enough to look simultaneous.</p>
<p>Inside one process, run several <b>threads</b>. They share the same memory but each has its own stack and its own place in the code, so they can work in parallel without copying data.</p>`,
  },

  n: "Processes and Threads",
  group: "Processes",
  one: "A <b>process</b> is a private address space plus resources; a <b>thread</b> is a flow of execution inside it, sharing that memory with its siblings.",

  plain: `<p>A <b>program</b> is a file on disk. A <b>process</b> is that program running: the OS gives it its own <b>virtual address space</b>, a table of open files, and a <b>PCB</b> (process control block) where it records the state.</p>
<p>A process has one or more <b>threads</b>. Each thread has its own <b>program counter</b>, registers and stack. All of them share the code, the heap and the open files of the process.</p>
<p>A process moves between states: <b>new, ready, running, waiting</b> (for I/O or a lock) and <b>terminated</b>. The scheduler moves it between ready and running, and a <b>context switch</b> saves one thread's registers and loads another's.</p>
<p><b>Analogy.</b> A process is a house with its own front door. Threads are the people living in it: separate bedrooms (stacks), one shared kitchen (heap).</p>`,

  why: [
    { t: "Programs must not be able to break each other",
      d: "If all code shared one address space, any bug could corrupt anything. So each program gets a private, isolated space." },
    { t: "Isolation makes sharing expensive",
      d: "Two processes cannot just read each other's variables. They need pipes, sockets or shared memory set up through the kernel." },
    { t: "Threads are the cheap way to share",
      d: "Threads of one process see the same heap. Creating one is cheaper than a process, and passing data between them costs nothing." },
    { t: "But shared memory means shared bugs",
      d: "One thread writing while another reads the same data is a race. Threads buy speed by giving up isolation." },
    { t: "fork copies, lazily",
      d: "On Unix, fork() makes a child that looks like a copy. The kernel marks pages copy-on-write, so nothing is duplicated until one side writes." },
    { t: "A crash is contained by the boundary you chose",
      d: "A crashing process dies alone. A crashing thread, such as a bad pointer write, usually takes down its whole process." },
  ],

  hing: `<p><b>Process vs thread.</b> Process ka apna alag memory space hota hai, thread ka nahi. Ek process ke saare threads heap aur code share karte hain, par har thread ka apna stack aur registers hote hain.</p>
<p><b>Kab kya use karein?</b> Isolation chahiye (browser tab alag alag, ek crash ho to baaki bache) to process. Tez sharing chahiye to thread.</p>
<p><b>Context switch.</b> CPU ek thread ke registers save karke doosre ke load karta hai. Ye pure overhead hai, koi useful kaam nahi hota.</p>
<p><b>Interview mein.</b> "fork copy-on-write use karta hai" bolna mat bhoolna. Isi se fork sasta padta hai.</p>`,

  viz: ["os-process-threads"],

  math: [
    { t: "Memory of threads versus processes", d: "Each thread reserves a stack, usually 8 MB of address space on Linux, but only the touched pages use real memory.", w:
`1000 threads x 8 MB stack = 8,000 MB of virtual address space
touched stack per thread  ~ 64 KB
real memory = 1000 x 64 KB = 64 MB

1000 processes would also copy page tables, heaps, file tables:
each ~ MBs -> hundreds of MB to GB` },
    { t: "What a context switch costs", d: "A switch takes a few microseconds, plus the time the new thread spends refilling caches that the old one filled.", w:
`switch cost = 5 us (direct)
1000 switches per second per core:
    1000 x 5 us = 5 ms per second = 0.5% of the CPU

100,000 switches per second:
    100,000 x 5 us = 500 ms per second = 50% lost to switching` },
    { t: "Copy-on-write after fork", d: "A parent with 1 GB of memory forks a child. Count what actually gets copied.", w:
`1 GB / 4 KB pages = 262,144 pages
fork(): copy the page TABLE, share all 262,144 pages (read-only)
child writes to 100 pages -> 100 page faults -> 100 pages copied
memory copied = 100 x 4 KB = 400 KB, not 1 GB` },
  ],

  costs: [
    ["create a thread", "tens of microseconds", "allocate a stack and a kernel record; no new address space"],
    ["create a process", "hundreds of microseconds", "new page tables and file table, even with copy-on-write"],
    ["context switch, same process", "cheaper", "the address space is unchanged, so the TLB stays warm"],
    ["context switch, different process", "dearer", "page table switch flushes or tags TLB entries, and caches go cold"],
    ["stack per thread", "about 8 MB reserved", "virtual only; pages are committed as they are touched"],
  ],

  traps: [
    "<b>Saying threads each get their own heap.</b> They share the heap. Only the stack and registers are private, which is exactly why races exist.",
    "<b>Thinking a thread crash is isolated.</b> A segfault in any thread kills the whole process.",
    "<b>Calling fork a full copy.</b> It copies the page tables and shares the pages copy-on-write. That is why fork then exec is cheap.",
    "<b>Using a thread per connection at scale.</b> Ten thousand threads cost stack memory and constant switching. Event loops or thread pools scale better.",
    "<b>Confusing concurrency and parallelism.</b> Concurrency is dealing with many things at once. Parallelism is doing many things at once, which needs multiple cores.",
  ],

  code: {
    pseudo: `pid <- fork()
if pid == 0:                     # child: a copy-on-write clone of the parent
    exec("/bin/ls")              # replace the child's program
else:                            # parent
    wait(pid)                    # collect the exit status, no zombie

thread_create(fn)                # same address space, new stack and registers`,
    py: `import os, threading

x = [0]

pid = os.fork()                    # Unix only
if pid == 0:
    x[0] = 99                      # copy-on-write: only the child sees this
    os._exit(0)
os.waitpid(pid, 0)
print("parent x:", x[0])           # 0, the child had its own copy

def work():
    x[0] += 1                      # threads share this list

ts = [threading.Thread(target=work) for _ in range(3)]
for t in ts: t.start()
for t in ts: t.join()
print("after threads x:", x[0])    # 3, one shared object`,
  },
  codecap: "A forked child gets its own copy of x. Threads all touch the same x.",

  q: [
    ["Process versus thread?", "A process has a private address space and resources. Threads are execution flows inside a process that share its memory but have their own stack and registers."],
    ["What does a thread NOT share with its siblings?", "Its stack, program counter and registers."],
    ["Why is fork cheap although it clones a process?", "Copy-on-write: the page tables are copied, the pages are shared read-only, and a page is copied only when someone writes."],
    ["What is a context switch and why is it costly?", "Saving one thread's state and loading another's. It does no useful work, and it leaves the CPU caches and TLB cold."],
    ["When would you choose processes over threads?", "When you need isolation or fault containment, as browsers do with one process per tab."],
  ],

  p: [
    ["SRC", "https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-intro.pdf", "OSTEP, the process abstraction", "E"],
    ["SRC", "https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-api.pdf", "OSTEP, the process API: fork, exec, wait", "E"],
    ["SRC", "https://man7.org/linux/man-pages/man2/fork.2.html", "man 2 fork", "M"],
    ["SRC", "https://docs.python.org/3/library/threading.html", "Python threading docs", "E"],
    ["SRC", "https://man7.org/linux/man-pages/man5/proc.5.html", "Read /proc/self/status and see a live process's fields", "M"],
  ],
},

{
  id: "cpu-scheduling",
  need: {
    ask: `<p>Three jobs are ready at the same moment: a 24 ms compile, a 3 ms keystroke handler and a 3 ms mouse handler. There is one CPU.</p>
<p>In what order should it run them, and how long should a person wait for the keystroke to appear?</p>`,
    tries: [
      ["First come, first served", "If the compile arrived first, the two small jobs wait 24 and 27 ms. The average wait is 17 ms, and typing feels sluggish for no good reason."],
      ["Always run the shortest job", "Great average, but a stream of short jobs can starve a long one forever. And the OS rarely knows how long a job will run."],
    ],
    so: `<p>Share the CPU in small <b>time slices</b>. A timer interrupt forces the running job off the CPU after a quantum, and the scheduler picks the next ready one. Everything gets a turn, and short jobs finish quickly.</p>
<p>That is <b>round robin</b>. Real schedulers layer priorities on top, so interactive jobs run first without starving the rest.</p>`,
  },

  n: "CPU Scheduling",
  group: "Processes",
  one: "A scheduler picks which ready thread runs next; <b>time slices</b> and <b>priorities</b> trade average wait time against fairness and responsiveness.",

  plain: `<p>The <b>scheduler</b> decides which ready process gets the CPU, and for how long. A <b>preemptive</b> scheduler can take the CPU away using a timer interrupt. A non-preemptive one waits until the job gives it up.</p>
<p>Measures that matter: <b>turnaround time</b> (arrival to finish), <b>waiting time</b> (time spent ready but not running) and <b>response time</b> (arrival to first run).</p>
<p>The classic policies are <b>FCFS</b> (queue order), <b>SJF</b> (shortest job first) and <b>round robin</b> (each job gets a quantum in turn). SJF is optimal for average wait but needs to know each job's length. A <b>priority</b> scheduler runs the highest-priority job and can starve the rest. <b>MLFQ</b> (multi-level feedback queue) adjusts priorities by watching behaviour.</p>
<p><b>Analogy.</b> A shop with one till: let the person buying one item go first.</p>`,

  why: [
    { t: "The CPU is the one resource every job wants",
      d: "With more runnable threads than cores, somebody waits. The only choice is who, and for how long." },
    { t: "Order alone changes the average wait a lot",
      d: "Running short jobs before long ones removes the most waiting. The same three jobs can average 17 ms or 3 ms." },
    { t: "But the OS cannot see the future",
      d: "It does not know how long a job will run. So it estimates from past behaviour, which is what MLFQ does." },
    { t: "Preemption protects responsiveness",
      d: "A timer interrupt forces a switch every quantum. A job in an infinite loop cannot freeze the machine." },
    { t: "The quantum is a tradeoff",
      d: "Too short and switching overhead dominates. Too long and round robin degrades toward FCFS, so interactive jobs lag." },
    { t: "Fairness needs an explicit mechanism",
      d: "Strict priorities starve low-priority jobs. Aging, which slowly raises the priority of waiting jobs, brings them a turn." },
  ],

  hing: `<p><b>Scheduler ka kaam.</b> Ready processes mein se decide karna ki CPU kisko mile. Preemptive matlab timer interrupt se CPU wapas le sakte hain.</p>
<p><b>Teen policies.</b> FCFS simple hai par long job peeche ke sabko rok deta hai (convoy effect). SJF average wait sabse kam deta hai par length pata honi chahiye. Round robin sabko barabar quantum deta hai.</p>
<p><b>Quantum ka tradeoff.</b> Bahut chhota to context switch mein time jaata hai. Bahut bada to round robin FCFS jaisa ho jaata hai.</p>
<p><b>Interview mein.</b> Hamesha numbers ke saath bolo: "P1=24, P2=3, P3=3. FCFS ka average wait 17, SJF ka 3." Isse impression acha padta hai.</p>`,

  viz: ["os-gantt"],

  math: [
    { t: "FCFS on three jobs", d: "Bursts: P1 = 24 ms, P2 = 3 ms, P3 = 3 ms, all arriving at time 0 in that order.", w:
`P1 runs 0-24, P2 runs 24-27, P3 runs 27-30
waiting: P1 = 0, P2 = 24, P3 = 27
average wait = (0 + 24 + 27) / 3 = 17.0 ms` },
    { t: "Shortest job first, same jobs", d: "Run the 3 ms jobs first, then the long one. Nothing else changed.", w:
`P2 runs 0-3, P3 runs 3-6, P1 runs 6-30
waiting: P2 = 0, P3 = 3, P1 = 6
average wait = (0 + 3 + 6) / 3 = 3.0 ms

17.0 versus 3.0: the order alone is a 5.7x difference` },
    { t: "Round robin with a 4 ms quantum", d: "Each job runs up to 4 ms, then goes to the back of the queue.", w:
`0-4 P1 | 4-7 P2 (done) | 7-10 P3 (done) | 10-14 P1 | ... | 26-30 P1
waiting: P1 = 30 - 24 = 6, P2 = 4, P3 = 7
average wait = (6 + 4 + 7) / 3 = 5.67 ms
response times: P1 = 0, P2 = 4, P3 = 7` },
    { t: "The cost of a short quantum", d: "Each switch costs 0.1 ms of overhead. Compare quanta of 1 ms and 100 ms.", w:
`quantum 1 ms:   useful 1 / (1 + 0.1)   = 90.9%
quantum 10 ms:  useful 10 / 10.1       = 99.0%
quantum 100 ms: useful 100 / 100.1     = 99.9%

but at 100 ms, 10 jobs mean each waits up to 1 second per turn` },
  ],

  costs: [
    ["context switch", "a few microseconds", "plus the cost of cold caches afterwards"],
    ["typical quantum", "1 to 10 ms (Linux CFS adapts)", "short enough to feel instant, long enough to amortise switching"],
    ["FCFS", "simple, convoy effect", "one long job delays every short job behind it"],
    ["SJF", "optimal average wait", "needs the burst length, and can starve long jobs"],
    ["round robin", "fair, good response time", "average turnaround is worse than SJF"],
  ],

  traps: [
    "<b>Saying SJF is practical.</b> It is provably optimal for average waiting time, but the OS cannot know the next burst, so it only approximates it.",
    "<b>Confusing waiting time and turnaround time.</b> Turnaround is waiting plus running. For P1 in the FCFS case: wait 0, turnaround 24.",
    "<b>Forgetting starvation.</b> Strict priority scheduling can leave a low-priority job waiting forever. The standard fix is aging.",
    "<b>Ignoring the cost of switching.</b> A quantum of 1 ms with a 0.1 ms switch wastes about 9% of the CPU.",
    "<b>Assuming preemptive is always better.</b> It adds switching overhead and makes shared data harder to protect.",
  ],

  code: {
    pseudo: `round_robin(jobs, quantum):
    queue <- jobs in arrival order ; t <- 0
    while queue not empty:
        job <- queue.pop_front()
        run <- min(quantum, job.remaining)
        t <- t + run ; job.remaining -= run
        if job.remaining > 0: queue.push_back(job)
        else: job.finish <- t
    waiting <- finish - arrival - burst`,
    py: `from collections import deque

def round_robin(bursts, quantum):
    remaining = dict(bursts)
    queue = deque(bursts)                   # all arrive at time 0
    t, finish = 0, {}
    while queue:
        name = queue.popleft()
        run = min(quantum, remaining[name])
        t += run
        remaining[name] -= run
        if remaining[name]:
            queue.append(name)
        else:
            finish[name] = t
    return {n: finish[n] - bursts[n] for n in bursts}   # waiting time

wait = round_robin({"P1": 24, "P2": 3, "P3": 3}, quantum=4)
print(wait)                                 # P1 6, P2 4, P3 7
print(sum(wait.values()) / len(wait))       # 5.67`,
  },
  codecap: "Waiting time is finish minus burst, since all jobs arrive at 0. The deque is the ready queue.",

  q: [
    ["Turnaround, waiting and response time?", "Turnaround is arrival to finish. Waiting is time spent ready but not running. Response is arrival to first run."],
    ["Why is SJF optimal, and why is it not used directly?", "Running short jobs first minimises average waiting time, but the OS cannot know burst lengths in advance."],
    ["What is the convoy effect?", "Short jobs stuck behind one long job under FCFS, which inflates the average wait."],
    ["How does the quantum affect round robin?", "Too small wastes time switching. Too large degrades to FCFS and hurts response time."],
    ["What is starvation and how is it prevented?", "A low-priority job that never runs. Aging raises a job's priority the longer it waits."],
  ],

  p: [
    ["SRC", "https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-sched.pdf", "OSTEP, scheduling introduction", "E"],
    ["SRC", "https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-sched-mlfq.pdf", "OSTEP, the multi-level feedback queue", "M"],
    ["SRC", "https://docs.kernel.org/scheduler/sched-design-CFS.html", "Linux kernel, the CFS design", "H"],
    ["SRC", "https://man7.org/linux/man-pages/man7/sched.7.html", "man 7 sched, policies and priorities on Linux", "M"],
    ["SRC", "https://www.geeksforgeeks.org/cpu-scheduling-in-operating-systems/", "Practise Gantt charts on more bursts", "E"],
  ],
},

{
  id: "synchronization",
  need: {
    ask: `<p>Two threads each add 1 to a shared counter 100,000 times. You expect 200,000 at the end. You run it and get 143,512. Run it again and you get 151,090.</p>
<p>Nothing crashed and no line of code looks wrong. Where did the increments go?</p>`,
    tries: [
      ["Hope the threads rarely collide", "The window is tiny, but at 200,000 increments it is hit tens of thousands of times. A bug that happens one in a million still fires every second at scale."],
      ["Turn off interrupts", "This works only inside a kernel on one core. User programs cannot do it, and on several cores another CPU still races with you."],
    ],
    so: `<p>Mark the shared update as a <b>critical section</b> and let only one thread inside at a time. A <b>mutex</b> (lock) does this: acquire before touching the data, release after. The other thread sleeps until the first is done.</p>
<p>For waiting on a condition, such as a queue becoming non-empty, add a <b>condition variable</b> or a <b>semaphore</b>.</p>`,
  },

  n: "Synchronization",
  group: "Concurrency",
  one: "A <b>race</b> happens when threads interleave a read-modify-write on shared data; a <b>mutex</b> makes that critical section atomic by letting one thread in at a time.",

  plain: `<p>The line <code>count += 1</code> looks like one step. It is three: <b>read</b> count into a register, <b>add</b> 1, <b>write</b> it back. If two threads both read before either writes, one update is lost. That is a <b>race condition</b>.</p>
<p>The fix is to make those three steps <b>atomic</b>, meaning indivisible. A <b>mutex</b> has two operations, lock and unlock. Only one thread can hold it. A second thread that calls lock waits.</p>
<p>A <b>semaphore</b> is a counter. Wait decrements it and blocks at zero, signal increments it. It limits how many threads can use something, such as 5 database connections. A <b>condition variable</b> lets a thread sleep until another says the state has changed.</p>
<p><b>Analogy.</b> A single toilet key on a hook: whoever holds the key is inside, and everyone else queues.</p>`,

  why: [
    { t: "Threads share memory so they can cooperate",
      d: "That is the entire point of threads. It is also what lets one thread see another's half-finished work." },
    { t: "A single source line is several machine steps",
      d: "Load, add and store are separate instructions. The scheduler may switch threads between any two of them." },
    { t: "The result depends on the interleaving",
      d: "The bug is non-deterministic. It vanishes under a debugger and appears in production, which makes it hard to test for." },
    { t: "Mutual exclusion removes the bad interleavings",
      d: "If only one thread can be in the critical section, no other thread can see or change the data halfway through." },
    { t: "The lock needs hardware help",
      d: "Software alone cannot make a lock safe on several cores. CPUs provide atomic instructions such as compare-and-swap that mutexes are built from." },
    { t: "Locks bring their own problems",
      d: "A lock held too long kills parallelism, and locks taken in the wrong order cause deadlock. Hold locks briefly, and for as little data as possible." },
  ],

  hing: `<p><b>Race condition kya hai?</b> Do threads ek hi variable ko ek saath read aur write karte hain aur result interleaving par depend karta hai. <code>count += 1</code> teen steps hai: read, add, write.</p>
<p><b>Mutex.</b> Ek time par sirf ek thread critical section ke andar. Baaki lock par wait karte hain.</p>
<p><b>Semaphore vs mutex.</b> Mutex ek ke liye hai (binary). Semaphore ek counter hai, N threads ko ek saath allow kar sakta hai. Mutex ko wahi thread unlock karta hai jisne lock kiya tha.</p>
<p><b>Interview mein.</b> "Critical section chhota rakho" ye zaroor bolo. Lock ke andar I/O ya network call mat karo.</p>`,

  viz: ["os-race"],

  math: [
    { t: "The lost update, step by step", d: "Start with count = 0. Both threads run count += 1 once, interleaved badly.", w:
`T1: read  count -> 0
T2: read  count -> 0          (T1 has not written yet)
T1: add 1, write count = 1
T2: add 1, write count = 1    (overwrites with a stale value)

expected 2, got 1: one increment vanished` },
    { t: "How often does it happen?", d: "Two threads do 100,000 increments each. The three-step window is hit whenever they overlap.", w:
`expected  = 2 x 100,000 = 200,000
observed  = 143,512  (an example run)
lost      = 56,488 = 28% of the updates

with a lock: 200,000 every run` },
    { t: "What a lock costs", d: "An uncontended lock is cheap. Contended locks serialise the program.", w:
`work outside lock: 90 us      inside lock: 10 us   (per task)
1 thread:  100 us per task
8 threads: the 10 us part runs one at a time
    max speedup = 100 / 10 = 10x   (Amdahl's law)
    8 threads reach about 100 / (10 + 90/8) = 4.7x` },
  ],

  costs: [
    ["uncontended lock/unlock", "tens of nanoseconds", "one atomic instruction pair, no kernel entry on modern futex-based locks"],
    ["contended lock", "microseconds", "the loser sleeps in the kernel and must be woken"],
    ["semaphore", "same order as a mutex", "a counter plus a wait queue"],
    ["serial fraction s", "speedup limit 1/s", "Amdahl's law: the locked part caps the gain from more cores"],
  ],

  traps: [
    "<b>Thinking count += 1 is atomic.</b> It is read, add and write. In Python the GIL protects the interpreter but not your compound updates.",
    "<b>Locking everything with one big lock.</b> It is safe and it serialises your whole program. Lock the smallest data that needs protecting.",
    "<b>Forgetting to unlock on an error path.</b> An exception between lock and unlock leaves the lock held forever. Use a with block or try/finally.",
    "<b>Using if instead of while around a condition wait.</b> A thread can wake up although the condition is false again. Always re-check in a loop.",
    "<b>Calling slow I/O while holding a lock.</b> Every other thread stalls behind a disk or network call.",
  ],

  code: {
    pseudo: `# the broken version
read tmp <- count ; tmp <- tmp + 1 ; write count <- tmp     # can interleave

# the safe version
lock(m)
    count <- count + 1                 # critical section: one thread at a time
unlock(m)

# producer / consumer with a semaphore
empty <- Semaphore(N) ; full <- Semaphore(0)
producer: wait(empty) ; put(item) ; signal(full)
consumer: wait(full)  ; take()    ; signal(empty)`,
    py: `import threading

count = 0
lock = threading.Lock()

def unsafe():
    global count
    for _ in range(200_000):
        tmp = count            # read
        count = tmp + 1        # write: another thread may have changed count

def safe():
    global count
    for _ in range(200_000):
        with lock:             # released even if the body raises
            count += 1

def run(fn):
    global count
    count = 0
    ts = [threading.Thread(target=fn) for _ in range(2)]
    for t in ts: t.start()
    for t in ts: t.join()
    return count

print("unsafe:", run(unsafe))  # usually below 400000
print("safe:  ", run(safe))    # always 400000`,
  },
  codecap: "The with-lock block is the critical section. The unsafe version splits the update the way the hardware does.",

  q: [
    ["What is a race condition?", "A bug where the result depends on how threads interleave, typically a read-modify-write on shared data that is not atomic."],
    ["Why is count += 1 not atomic?", "It compiles to a read, an add and a write. Another thread can run between any two of them."],
    ["Mutex versus semaphore?", "A mutex lets one thread in and is released by its owner. A semaphore is a counter that allows up to N holders and any thread may signal it."],
    ["Why wait on a condition inside a while loop?", "Wakeups can be spurious, or another thread may consume the state first, so the condition must be re-checked."],
    ["What limits the speedup from adding cores?", "The serial, locked fraction of the work (Amdahl's law)."],
  ],

  p: [
    ["SRC", "https://pages.cs.wisc.edu/~remzi/OSTEP/threads-locks.pdf", "OSTEP, locks", "M"],
    ["SRC", "https://pages.cs.wisc.edu/~remzi/OSTEP/threads-sema.pdf", "OSTEP, semaphores", "M"],
    ["SRC", "https://docs.python.org/3/library/threading.html#lock-objects", "Python Lock docs", "E"],
    ["SRC", "https://greenteapress.com/wp/semaphores/", "The Little Book of Semaphores", "M"],
    ["SRC", "https://man7.org/linux/man-pages/man2/futex.2.html", "man 2 futex, what Linux locks are built on", "H"],
  ],
},

{
  id: "deadlock",
  need: {
    ask: `<p>Thread A holds lock 1 and waits for lock 2. Thread B holds lock 2 and waits for lock 1. Neither can move. The program does not crash and does not error. It simply stops, using no CPU.</p>
<p>What exactly has to be true for this to happen, and which of those conditions can you remove?</p>`,
    tries: [
      ["Add a timeout and retry", "Both threads time out together, retry together, and deadlock again. This is livelock, and it burns CPU instead of sleeping."],
      ["Take every lock in one big lock", "Safe, and it throws away all parallelism. A thousand threads would run one at a time."],
    ],
    so: `<p>Deadlock needs <b>four conditions</b> at once: mutual exclusion, hold and wait, no preemption, and circular wait. Remove any one and it cannot happen.</p>
<p>The cheapest to remove is <b>circular wait</b>: give every lock a number and always take them in increasing order. Then no cycle can form.</p>`,
  },

  n: "Deadlock",
  group: "Concurrency",
  one: "Deadlock needs <b>four conditions at once</b>; break one, usually circular wait by <b>ordering the locks</b>, and it cannot occur.",

  plain: `<p>A <b>deadlock</b> is a set of threads each waiting for something that another thread in the set holds. None can proceed, so none ever releases anything.</p>
<p>The <b>Coffman conditions</b> are all required. <b>Mutual exclusion</b>: the resource is held by one thread at a time. <b>Hold and wait</b>: a thread holds one resource while asking for another. <b>No preemption</b>: a resource cannot be forcibly taken. <b>Circular wait</b>: a cycle of threads each waiting for the next.</p>
<p>Three strategies exist. <b>Prevent</b> by breaking a condition. <b>Avoid</b> by checking, before granting a request, that the system stays safe (the Banker's algorithm). <b>Detect and recover</b> by finding the cycle and killing or rolling back a victim.</p>
<p><b>Analogy.</b> Four cars at a crossroads, each waiting for the one on its right.</p>`,

  why: [
    { t: "Exclusive resources are unavoidable",
      d: "Some things, like a lock or a printer, genuinely cannot be shared. So mutual exclusion usually stays." },
    { t: "Needing two resources creates the risk",
      d: "A thread that takes one resource and then asks for a second is holding and waiting. A single-resource thread can never deadlock." },
    { t: "A cycle is the actual trap",
      d: "If A waits for B, B waits for C and C waits for A, all three are stuck. Draw it as a graph and deadlock is a cycle." },
    { t: "Ordering locks makes cycles impossible",
      d: "If every thread takes lock 1 before lock 2, a thread holding lock 2 never waits for lock 1. The arrows only point one way." },
    { t: "Avoidance checks the future, at a price",
      d: "The Banker's algorithm grants a request only if some order exists in which every thread can still finish. It needs maximum needs declared upfront." },
    { t: "Real systems mostly prevent, or just detect",
      d: "General-purpose OSes mostly ignore deadlock between programs (the ostrich approach). Databases detect cycles and abort one transaction." },
  ],

  hing: `<p><b>Deadlock kya hai?</b> Threads ka ek group jisme har ek doosre ke paas rakhi cheez ka wait kar raha hai. Koi aage nahi badhta.</p>
<p><b>Chaar conditions, saari ek saath.</b> Mutual exclusion, hold and wait, no preemption, circular wait. Ek bhi hata do to deadlock nahi hoga.</p>
<p><b>Sabse practical fix.</b> Locks ko number do aur hamesha chhote number wala pehle lo. Ab cycle ban hi nahi sakta.</p>
<p><b>Interview mein.</b> Deadlock aur livelock aur starvation ka farq bolo. Deadlock mein sab ruke hote hain, livelock mein sab chal rahe hote hain par kuch aage nahi badhta.</p>`,

  viz: ["os-deadlock-cycle"],

  math: [
    { t: "The classic two-lock deadlock", d: "Thread A takes 1 then 2. Thread B takes 2 then 1. One bad interleaving is enough.", w:
`A: lock(1)  ok
B: lock(2)  ok
A: lock(2)  blocks, B holds it
B: lock(1)  blocks, A holds it
-> cycle A -> B -> A, both wait forever

fix: both take lock(1) then lock(2); B now blocks at lock(1)` },
    { t: "A safe state with the Banker's algorithm", d: "10 units exist. Current allocation is P0=3, P1=2, P2=2, so 3 are free. Maximum needs are 9, 4 and 7.", w:
`need = max - allocated:  P0 = 6,  P1 = 2,  P2 = 5
available = 10 - 7 = 3

P1 needs 2 <= 3  -> runs, finishes, returns 4:  available = 5
P2 needs 5 <= 5  -> runs, finishes, returns 7:  available = 7
P0 needs 6 <= 7  -> runs and finishes

safe sequence: P1, P2, P0` },
    { t: "An unsafe state", d: "Same totals, but allocation is P0=5, P1=2, P2=2 and only 1 unit is free.", w:
`need:  P0 = 4,  P1 = 2,  P2 = 5     available = 1
P0 needs 4 > 1   no
P1 needs 2 > 1   no
P2 needs 5 > 1   no

nobody can finish: unsafe. Not yet a deadlock, but one is likely` },
  ],

  costs: [
    ["lock ordering", "free at runtime", "a discipline enforced by convention, review or tooling"],
    ["deadlock detection", "cycle search in a graph", "O(V + E) on the wait-for graph; databases run it every few seconds"],
    ["Banker's algorithm", "O(m x n^2) per request", "needs maximum demands in advance, so it is rare in practice"],
    ["timeouts on lock acquire", "cheap", "turns a hang into an error, but you still must handle the failure"],
  ],

  traps: [
    "<b>Listing only three conditions.</b> All four are required. Interviewers check that you know removing any one is enough.",
    "<b>Confusing deadlock with livelock or starvation.</b> Deadlock: no one moves. Livelock: everyone moves and nothing progresses. Starvation: one thread never gets a turn.",
    "<b>Calling an unsafe state a deadlock.</b> Unsafe means a deadlock is possible. A deadlock is the actual stuck state.",
    "<b>Taking locks in an order that depends on data.</b> Transferring money from account A to B and from B to A at once can deadlock. Order by account id instead.",
    "<b>Calling unknown code while holding a lock.</b> A callback may try to take another lock, in an order you never planned.",
  ],

  code: {
    pseudo: `# prevention by lock ordering
lock_both(a, b):
    first, second <- sort_by_id(a, b)
    lock(first) ; lock(second)

# detection: a cycle in the wait-for graph
has_cycle(graph):
    for each node: depth-first search, track the current path
    if we meet a node already on the path: return true`,
    py: `import threading

class Account:
    def __init__(self, id_, balance):
        self.id, self.balance = id_, balance
        self.lock = threading.Lock()

def transfer(src, dst, amount):
    first, second = sorted((src, dst), key=lambda a: a.id)   # global order
    with first.lock:
        with second.lock:
            src.balance -= amount
            dst.balance += amount

a, b = Account(1, 100), Account(2, 100)
ts = [threading.Thread(target=transfer, args=(a, b, 10)),
      threading.Thread(target=transfer, args=(b, a, 5))]
for t in ts: t.start()
for t in ts: t.join()
print(a.balance, b.balance)        # 95 105, and it always terminates`,
  },
  codecap: "Sorting the two accounts by id means every thread takes the locks in the same order, so no cycle can form.",

  q: [
    ["Name the four conditions for deadlock.", "Mutual exclusion, hold and wait, no preemption, and circular wait."],
    ["How do you prevent deadlock in practice?", "Impose a global order on locks and always acquire them in that order, which removes circular wait."],
    ["Deadlock versus livelock versus starvation?", "Deadlock: all blocked. Livelock: all running but no progress. Starvation: one thread is never scheduled or never gets the resource."],
    ["What does the Banker's algorithm do?", "It grants a request only if the resulting state is safe, meaning some order exists in which every process can finish."],
    ["How do databases handle deadlock?", "They detect cycles in the wait-for graph and abort one transaction as the victim so the others proceed."],
  ],

  p: [
    ["SRC", "https://pages.cs.wisc.edu/~remzi/OSTEP/threads-bugs.pdf", "OSTEP, common concurrency bugs", "M"],
    ["SRC", "https://en.wikipedia.org/wiki/Dining_philosophers_problem", "Dining philosophers, the classic puzzle", "M"],
    ["SRC", "https://en.wikipedia.org/wiki/Banker%27s_algorithm", "Banker's algorithm, worked example", "M"],
    ["SRC", "https://docs.python.org/3/library/threading.html#rlock-objects", "RLock, and why re-entrancy is not a fix", "E"],
    ["SRC", "https://www.postgresql.org/docs/current/explicit-locking.html", "How PostgreSQL detects deadlocks", "M"],
  ],
},

{
  id: "virtual-memory",
  need: {
    ask: `<p>Your machine has 16 GB of RAM and is running 200 processes. Each one thinks it has a clean, contiguous address space starting at zero, and many of them are written to use more than their share.</p>
<p>How can every process have its own huge, private memory on a machine that does not have that much?</p>`,
    tries: [
      ["Give each process a fixed slice of RAM", "16 GB divided by 200 is 80 MB each, and most of it sits idle in one process while another is starved. A program larger than its slice cannot run."],
      ["Let programs use real addresses directly", "Two programs compiled for the same address collide. A stray pointer in one can read or overwrite another's data, or the kernel's."],
    ],
    so: `<p>Give every process <b>virtual addresses</b> and let the hardware translate them. Cut memory into fixed <b>pages</b> of 4 KB. A per-process <b>page table</b> maps each virtual page to a physical <b>frame</b>, or marks it as not present.</p>
<p>Pages that are not in use can live on disk and be loaded on demand. A small cache, the <b>TLB</b>, remembers recent translations so that most accesses stay fast.</p>`,
  },

  n: "Virtual Memory and Paging",
  group: "Memory",
  one: "Every process sees <b>virtual addresses</b>; the MMU translates each through a <b>page table</b> to a physical frame, and unused pages can wait on disk.",

  plain: `<p>A <b>virtual address</b> is what the program uses. A <b>physical address</b> is a real location in RAM. The <b>MMU</b> (memory management unit), a part of the CPU, converts one into the other on every access.</p>
<p>Memory is divided into <b>pages</b> (usually 4 KB). A virtual address splits into a <b>page number</b> and an <b>offset</b> within the page. The page table maps page numbers to <b>frames</b>. The offset is copied unchanged.</p>
<p>If a page is not in RAM, the access raises a <b>page fault</b>. The OS loads the page from disk, updates the table and restarts the instruction. This is <b>demand paging</b>.</p>
<p>The <b>TLB</b> caches recent translations. <b>Analogy.</b> A library catalogue: the book's catalogue number is virtual, the shelf is physical, and the catalogue card is the page table entry.</p>`,

  why: [
    { t: "Isolation needs an address layer between program and RAM",
      d: "If programs used real addresses, none could be kept from another's data. Translation lets the OS decide what each one can see." },
    { t: "Fixed-size pages avoid fragmentation",
      d: "Same-sized pages and frames mean any free frame fits any page, so memory never has awkward gaps that cannot be filled." },
    { t: "A flat page table is too big",
      d: "A 32-bit space with 4 KB pages has 2^20 pages, so 4 MB of table per process. Multi-level tables only allocate the parts a process uses." },
    { t: "Translation on every access would be slow",
      d: "Each load would need extra memory reads for the table. The TLB keeps recent translations, and a 99% hit rate hides nearly all the cost." },
    { t: "Pages not in use can live on disk",
      d: "Most of a program's pages are cold at any moment. Demand paging brings in only what is touched, so total virtual memory can exceed RAM." },
    { t: "The cost: faults are millions of times slower than hits",
      d: "A page fault that reads from disk takes milliseconds against nanoseconds for RAM. Too many of them is called thrashing." },
  ],

  hing: `<p><b>Virtual address kya hai?</b> Program jo address use karta hai wo asli RAM ka address nahi hota. MMU har access par use physical address mein badalta hai.</p>
<p><b>Page aur frame.</b> Virtual memory pages mein, physical memory frames mein bati hoti hai (dono 4 KB). Page table batata hai kaunsa page kaunse frame mein hai. Offset wahi rehta hai.</p>
<p><b>Page fault.</b> Page RAM mein nahi hai to OS disk se laata hai. Isko demand paging kehte hain. Ye bahut slow hota hai, isliye faults kam hone chahiye.</p>
<p><b>Interview mein.</b> TLB ka zikr zaroor karo. TLB miss par page table walk hota hai, aur page fault tab hota hai jab page RAM mein hi nahi hai. Dono alag hain.</p>`,

  viz: ["os-page-translate"],

  math: [
    { t: "Translate one address by hand", d: "32-bit addresses, 4 KB pages: the low 12 bits are the offset, the high 20 bits the page number.", w:
`virtual address  0x00403A7C
offset (low 12 bits)  = 0xA7C
page number           = 0x00403
page table says: page 0x403 -> frame 0x1A2

physical address = (0x1A2 << 12) | 0xA7C = 0x001A2A7C` },
    { t: "Why page tables must be multi-level", d: "Count the entries of a single flat table for a 32-bit address space.", w:
`pages = 2^32 / 2^12 = 2^20 = 1,048,576 entries
entry = 4 bytes -> 4 MB per process
200 processes -> 800 MB of tables, mostly empty

two-level table: only the used 4 MB regions get a second level
a small process needs a few KB instead` },
    { t: "Effective access time with a TLB", d: "TLB lookup 1 ns, memory access 100 ns, TLB hit rate 99%. A miss needs one extra memory read for the table.", w:
`hit : 1 + 100        = 101 ns
miss: 1 + 100 + 100  = 201 ns

EAT = 0.99 x 101 + 0.01 x 201 = 99.99 + 2.01 = 102 ns
with no TLB at all: 200 ns on every access` },
    { t: "Why page faults dominate", d: "A fault reads from an SSD at about 100 microseconds. Compare against RAM at 100 ns.", w:
`fault rate p = 1 in 1000 accesses
EAT = 0.999 x 100 ns + 0.001 x 100,000 ns
    = 99.9 + 100 = about 200 ns   (twice as slow)

p = 1 in 100: 99 + 1000 = about 1,100 ns   (11x slower)` },
  ],

  costs: [
    ["TLB hit", "about 1 ns", "translation is free, in practice"],
    ["TLB miss, page table walk", "tens of ns", "a few memory reads, often served from cache"],
    ["minor page fault", "about 1 microsecond", "page is in RAM but not yet mapped (first touch, copy-on-write)"],
    ["major page fault", "100 us (SSD) to 10 ms (disk)", "page must be read from storage"],
    ["page table, 32-bit flat", "4 MB per process", "why two-level and four-level tables exist"],
  ],

  traps: [
    "<b>Confusing a TLB miss with a page fault.</b> A TLB miss only needs a table walk. A page fault means the page is not in RAM, and the OS must act.",
    "<b>Saying virtual memory means using disk.</b> Its main job is isolation and flexible mapping. Swapping to disk is an optional extra.",
    "<b>Forgetting the offset is not translated.</b> Only the page number is mapped. The low 12 bits pass straight through.",
    "<b>Ignoring thrashing.</b> When the working sets of all processes exceed RAM, the machine spends its time faulting and does almost no useful work.",
    "<b>Assuming malloc gives you RAM.</b> It gives you virtual address space. Real frames are assigned when pages are first touched.",
  ],

  code: {
    pseudo: `translate(vaddr):
    page, offset <- vaddr >> 12, vaddr & 0xFFF
    if page in TLB: frame <- TLB[page]                   # fast path
    else:
        entry <- page_table[page]                        # table walk
        if not entry.present: page_fault(page)           # OS loads from disk
        frame <- entry.frame ; TLB[page] <- frame
    return (frame << 12) | offset`,
    py: `import mmap, os, resource

PAGE = 4096
vaddr = 0x00403A7C
print(hex(vaddr >> 12), hex(vaddr & 0xFFF))   # 0x403 0xa7c

page_table = {0x403: 0x1A2}                   # a one-entry toy table
frame = page_table[vaddr >> 12]
print(hex((frame << 12) | (vaddr & 0xFFF)))   # 0x1a2a7c

# Watch demand paging happen: map 100 MB, touch nothing, then touch pages.
before = resource.getrusage(resource.RUSAGE_SELF).ru_minflt
m = mmap.mmap(-1, 100 * 1024 * 1024)          # virtual only, no frames yet
for i in range(0, 1000 * PAGE, PAGE):
    m[i] = 1                                  # each first touch faults
after = resource.getrusage(resource.RUSAGE_SELF).ru_minflt
print("minor faults:", after - before)        # about 1000`,
  },
  codecap: "The mapping is a shift, a lookup and an OR. The mmap loop shows first-touch faults as demand paging happens.",

  q: [
    ["What does the MMU do?", "It translates each virtual address to a physical one using the page table, with the TLB caching recent results."],
    ["How is a virtual address split?", "A page number, which is looked up, and an offset, which is copied unchanged. With 4 KB pages the offset is 12 bits."],
    ["What is a page fault?", "An access to a page not present in RAM. The OS loads it, fixes the table and restarts the instruction."],
    ["Why multi-level page tables?", "A flat table for a large address space is huge and mostly empty. Multi-level tables allocate only the regions in use."],
    ["What is thrashing?", "Constant page faulting because the active pages of all processes do not fit in RAM, so little useful work gets done."],
  ],

  p: [
    ["SRC", "https://pages.cs.wisc.edu/~remzi/OSTEP/vm-intro.pdf", "OSTEP, the abstraction of address spaces", "E"],
    ["SRC", "https://pages.cs.wisc.edu/~remzi/OSTEP/vm-paging.pdf", "OSTEP, introduction to paging", "M"],
    ["SRC", "https://pages.cs.wisc.edu/~remzi/OSTEP/vm-tlbs.pdf", "OSTEP, translation lookaside buffers", "M"],
    ["SRC", "https://man7.org/linux/man-pages/man2/mmap.2.html", "man 2 mmap", "M"],
    ["SRC", "https://man7.org/linux/man-pages/man5/proc.5.html", "Read /proc/self/maps and find the stack and heap", "M"],
  ],
},

{
  id: "page-replacement",
  need: {
    ask: `<p>Memory is full: all 3 frames hold pages. The program touches a page that is on disk. One resident page must go to make room, and a wrong choice means another disk read a moment later.</p>
<p>Which page should be thrown out?</p>`,
    tries: [
      ["Pick a random page", "Fair, and it ignores everything you know. A page used a microsecond ago is exactly as likely to go as one untouched for an hour."],
      ["Evict the oldest page loaded (FIFO)", "Simple, but age of loading is not usefulness. A heavily used page, loaded early, gets evicted just because it is old, and can fault again at once."],
    ],
    so: `<p>Use the past to predict the future: <b>recently used pages will probably be used again</b>. Evict the page that has gone unused the longest. This is <b>LRU</b> (least recently used).</p>
<p>True LRU needs bookkeeping on every access, so real systems use the cheaper <b>clock</b> algorithm: a reference bit per page, and a hand that sweeps and gives a second chance.</p>`,
  },

  n: "Page Replacement",
  group: "Memory",
  one: "When RAM is full, evict the page least likely to be needed; <b>LRU</b> uses recent history as the guess, and the <b>clock</b> algorithm approximates it cheaply.",

  plain: `<p>When a page fault occurs and every frame is taken, the OS must choose a <b>victim</b> to evict. If the victim was modified, it is first written to disk (a <b>dirty</b> page), which makes the eviction cost more.</p>
<p>Algorithms are judged by how many faults they cause on a <b>reference string</b>, the sequence of pages a program touches. <b>FIFO</b> evicts the page that arrived first. <b>OPT</b> evicts the page whose next use is furthest away: perfect, but needs the future. <b>LRU</b> evicts the least recently used page.</p>
<p><b>Clock</b> keeps pages in a circle with a <b>reference bit</b> set by the hardware on each use. The hand sweeps: bit 1 is cleared and skipped, bit 0 is evicted.</p>
<p><b>Analogy.</b> Clearing a desk: put away what you have not touched for longest, not what you picked up first.</p>`,

  why: [
    { t: "A fault is expensive, so choose victims carefully",
      d: "Evicting a page that is needed again soon costs another disk read. Every wrong choice shows up as lost time." },
    { t: "The best victim is the one used furthest in the future",
      d: "That rule, OPT, is provably optimal. It cannot be built, because the OS cannot see future accesses, but it is the benchmark." },
    { t: "Programs show locality",
      d: "Code that touched a page a moment ago will probably touch it again. So the recent past is a good predictor of the near future." },
    { t: "LRU turns locality into a rule",
      d: "Evict the page unused longest. It tracks OPT closely on real workloads, but exact tracking costs work on every memory access." },
    { t: "Clock gets most of the benefit for almost none of the cost",
      d: "The hardware sets one bit per page on use. The hand clears bits as it passes, so a page survives only if it was touched since the last sweep." },
    { t: "More frames should help, but not always with FIFO",
      d: "Belady's anomaly: for some strings FIFO faults more with more frames. LRU and OPT never do, because they are stack algorithms." },
  ],

  hing: `<p><b>Problem.</b> RAM bhar gayi hai aur naya page chahiye. Kaunsa page nikalein? Galat page nikala to thodi der baad wapas disk se laana padega.</p>
<p><b>Teen algorithms.</b> FIFO sabse purana nikalta hai (simple par kabhi bura). LRU sabse der se use hua page nikalta hai. OPT wo nikalta hai jo sabse der baad use hoga, ye perfect hai par future dekhna padega.</p>
<p><b>Clock.</b> LRU ka sasta version. Har page ka ek reference bit, ek ghadi ki sui jo ghoomti hai. Bit 1 ho to 0 karke aage badho, bit 0 ho to wahi nikaalo.</p>
<p><b>Interview mein.</b> Belady's anomaly zaroor bolo: FIFO mein frames badhane par faults badh sakte hain.</p>`,

  viz: ["os-frames"],

  math: [
    { t: "FIFO on a reference string", d: "String: 7 0 1 2 0 3 0 4 2 3 0 3 2, with 3 frames. Count the faults (F) and hits (h).", w:
`ref:    7  0  1  2  0  3  0  4  2  3  0  3  2
FIFO:   F  F  F  F  h  F  F  F  F  F  F  h  h
frames after each fault: 7, 70, 701, 012, 123, 230, 304, 042

FIFO faults = 10 of 13` },
    { t: "LRU on the same string", d: "On a fault, evict the page whose last use is oldest.", w:
`ref:    7  0  1  2  0  3  0  4  2  3  0  3  2
LRU:    F  F  F  F  h  F  h  F  F  F  F  h  h

LRU faults = 9 of 13` },
    { t: "OPT on the same string", d: "On a fault, evict the page whose next use is furthest away, or never.", w:
`ref:    7  0  1  2  0  3  0  4  2  3  0  3  2
OPT:    F  F  F  F  h  F  h  F  h  h  F  h  h

OPT faults = 7 of 13   (the floor: nothing can beat it)
FIFO 10, LRU 9, OPT 7` },
    { t: "Belady's anomaly", d: "String 1 2 3 4 1 2 5 1 2 3 4 5. Run FIFO with 3 and then 4 frames.", w:
`3 frames: F F F F F F F h h F F h  -> 9 faults
4 frames: F F F F h h F F F F F F  -> 10 faults

more memory, more faults: FIFO is not a stack algorithm` },
  ],

  costs: [
    ["OPT", "lowest possible faults", "needs the future; used only as a yardstick"],
    ["LRU", "close to OPT", "exact tracking means updating on every access"],
    ["FIFO", "cheap, can be poor", "a queue; suffers Belady's anomaly"],
    ["clock", "one bit and a sweep", "approximates LRU, used in real kernels"],
    ["evicting a dirty page", "write plus read", "twice the I/O of a clean eviction"],
  ],

  traps: [
    "<b>Saying LRU is what Linux does.</b> It uses an approximation with active and inactive lists, driven by reference bits, much closer to clock than to exact LRU.",
    "<b>Treating OPT as an option.</b> It cannot be implemented, because it needs the future. Say it is a benchmark.",
    "<b>Forgetting Belady's anomaly.</b> It applies to FIFO only, and it is a standard interview question.",
    "<b>Counting hits as faults on the initial fill.</b> The first accesses to an empty frame set are compulsory faults and count as faults.",
    "<b>Ignoring dirty pages.</b> Preferring clean victims saves a disk write, which can matter more than a perfect choice.",
  ],

  code: {
    pseudo: `lru(refs, nframes):
    frames <- ordered by recency (oldest first) ; faults <- 0
    for page in refs:
        if page in frames: move page to the newest end       # hit
        else:
            faults += 1
            if len(frames) == nframes: remove the oldest      # evict
            add page at the newest end
    return faults`,
    py: `from collections import OrderedDict, deque

def lru(refs, n):
    frames, faults = OrderedDict(), 0
    for p in refs:
        if p in frames:
            frames.move_to_end(p)               # now the most recent
        else:
            faults += 1
            if len(frames) == n:
                frames.popitem(last=False)      # least recently used
            frames[p] = True
    return faults

def fifo(refs, n):
    frames, faults = deque(), 0
    for p in refs:
        if p not in frames:
            faults += 1
            if len(frames) == n:
                frames.popleft()
            frames.append(p)
    return faults

refs = [7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2]
print("FIFO", fifo(refs, 3), "LRU", lru(refs, 3))      # FIFO 10 LRU 9
b = [1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5]
print("Belady", fifo(b, 3), fifo(b, 4))                # 9 10`,
  },
  codecap: "OrderedDict gives LRU in a few lines. The last print shows Belady's anomaly for FIFO.",

  q: [
    ["What does a page replacement algorithm decide?", "Which resident page to evict when a fault occurs and every frame is in use."],
    ["Why is OPT unusable but still important?", "It needs future knowledge, but it gives the minimum possible faults, so every real algorithm is measured against it."],
    ["How does the clock algorithm work?", "Pages sit in a circle with reference bits. The hand clears a set bit and moves on, and evicts the first page whose bit is already 0."],
    ["What is Belady's anomaly?", "FIFO can produce more faults when given more frames. LRU and OPT never do."],
    ["Why prefer evicting clean pages?", "A clean page can be dropped at once. A dirty page must first be written back, doubling the I/O."],
  ],

  p: [
    ["SRC", "https://pages.cs.wisc.edu/~remzi/OSTEP/vm-beyondphys-policy.pdf", "OSTEP, beyond physical memory: policies", "M"],
    ["SRC", "https://en.wikipedia.org/wiki/Page_replacement_algorithm", "Page replacement algorithms, a survey", "M"],
    ["SRC", "https://en.wikipedia.org/wiki/B%C3%A9l%C3%A1dy%27s_anomaly", "Belady's anomaly", "E"],
    ["SRC", "https://docs.kernel.org/admin-guide/mm/multigen_lru.html", "Linux multi-gen LRU", "H"],
    ["SRC", "https://leetcode.com/problems/lru-cache/", "LeetCode 146, build LRU with a hash map and a list", "M"],
  ],
},

{
  id: "file-systems",
  need: {
    ask: `<p>A disk is a huge array of numbered 4 KB blocks. It knows nothing about names, folders or files. You want to save <b>notes.txt</b>, 150 KB long, find it again by name next week, and keep it safe if the power fails halfway through the write.</p>
<p>What structure turns raw blocks into named files?</p>`,
    tries: [
      ["Store files one after another", "A 150 KB file needs 38 consecutive blocks. After a few deletes the free space is scattered in small gaps, and a file that grows has nowhere to go."],
      ["A table of names pointing at block lists", "A big file's block list is itself huge, and you must read the whole table to find one file. Metadata and names are tangled together."],
    ],
    so: `<p>Separate the name from the file. A <b>directory</b> maps names to numbers. Each number identifies an <b>inode</b>, a small record holding the file's size, owner, permissions and pointers to its data blocks.</p>
<p>Small files use direct pointers. Large files add <b>indirect</b> blocks that hold more pointers. A <b>journal</b> records intended changes first so a crash can be repaired.</p>`,
  },

  n: "File Systems and Inodes",
  group: "Storage",
  one: "A directory maps <b>names to inode numbers</b>; the inode holds metadata and block pointers, so renaming, linking and growing a file never move its data.",

  plain: `<p>A <b>file system</b> organises a disk into files and directories. A <b>block</b> is the unit of allocation, commonly 4 KB. A file is a list of blocks plus some metadata.</p>
<p>That metadata lives in an <b>inode</b>: size, owner, permissions, timestamps and block pointers. It does <i>not</i> contain the file's name. The name lives in a <b>directory</b>, which is just a file mapping names to inode numbers.</p>
<p>That is why a <b>hard link</b> is a second name for the same inode. Deleting a name only removes the file when its link count reaches zero. A <b>symbolic link</b> is a small file that stores a path.</p>
<p>A <b>journal</b> writes a note of the planned change before doing it, so after a crash the system replays or discards the note. <b>Analogy.</b> A library: the catalogue (directory) lists titles and shelf numbers, the book record (inode) says how big it is and where it is shelved.</p>`,

  why: [
    { t: "The disk only understands numbered blocks",
      d: "Everything else, names, folders, sizes, permissions, must be built by the file system on top of that array." },
    { t: "Names and file metadata should be separate",
      d: "If the name is in the file record, renaming means rewriting it, and two names for one file are impossible. A directory of name to number fixes both." },
    { t: "Pointers must scale from tiny to huge files",
      d: "Most files are small, a few are enormous. The inode holds direct pointers for small files and indirect blocks for large ones." },
    { t: "Block size trades space against speed",
      d: "Large blocks mean fewer pointers and faster sequential reads, but a 1-byte file still takes a whole block." },
    { t: "A crash can leave the disk half-updated",
      d: "Creating a file touches the inode, the directory and the free map. Power loss between them leaves a broken structure." },
    { t: "Journaling makes updates all-or-nothing",
      d: "Log the intent, then apply it. After a crash the log is replayed, so the file system recovers in seconds instead of scanning the whole disk." },
  ],

  hing: `<p><b>Inode kya hai?</b> File ka metadata: size, owner, permissions, aur data blocks ke pointers. File ka naam inode mein nahi hota.</p>
<p><b>Naam kahan hai?</b> Directory mein. Directory ek special file hai jo naam se inode number ka map rakhti hai.</p>
<p><b>Hard link vs symlink.</b> Hard link ek hi inode ka doosra naam hai. Symlink ek chhoti file hai jisme path likha hota hai. File tab delete hoti hai jab link count 0 ho jaye.</p>
<p><b>Journaling.</b> Pehle likho ki kya karne wale ho, phir karo. Crash ho jaye to log dekh kar theek kar lo.</p>`,

  viz: ["os-inode-tree"],

  math: [
    { t: "Maximum file size from an inode", d: "12 direct pointers, then single, double and triple indirect. Blocks are 4 KB and a pointer is 4 bytes, so one block holds 1024 pointers.", w:
`direct:        12 x 4 KB              = 48 KB
single:        1024 x 4 KB            = 4 MB
double:        1024^2 x 4 KB          = 4 GB
triple:        1024^3 x 4 KB          = 4 TB

max file = about 4 TB` },
    { t: "Disk reads to reach a byte", d: "How many block reads to fetch a byte at offset 5 MB, assuming the inode is already in memory?", w:
`offset 5 MB > 48 KB + 4 MB, so it is in the double-indirect range
read 1: the double-indirect block
read 2: the single-indirect block it points to
read 3: the data block itself

3 block reads, versus 1 for a byte in the first 48 KB` },
    { t: "Wasted space from block size", d: "Files average a size that is rarely a multiple of the block, so on average half a block per file is wasted.", w:
`100,000 files, block 4 KB:  100,000 x 2 KB = 200 MB wasted
same files, block 64 KB:    100,000 x 32 KB = 3.2 GB wasted

a 1-byte file takes a full block: 4096 bytes for 1 byte` },
  ],

  costs: [
    ["open a file", "path lookup, one inode read per directory", "caches (dentry, inode) make repeats nearly free"],
    ["read a small file", "1 inode + 1 data block", "direct pointers need no extra reads"],
    ["read deep in a huge file", "up to 3 extra block reads", "indirect blocks, usually cached after the first access"],
    ["journal write", "metadata written twice", "once to the log, once to its home location"],
    ["fsync", "milliseconds on a disk", "forces data to stable storage, and is why databases are slow without batching"],
  ],

  traps: [
    "<b>Saying the filename is stored in the inode.</b> It is stored in the directory. The inode knows nothing about names, which is how hard links work.",
    "<b>Confusing hard and symbolic links.</b> A hard link shares the inode and survives deletion of the other name. A symlink stores a path and dangles if the target goes.",
    "<b>Assuming write() means the data is on disk.</b> It goes to the page cache. Only fsync() forces it out, and a crash before that can lose it.",
    "<b>Forgetting that deleting a file needs an open count of zero too.</b> A file that a process still holds open keeps its inode until it is closed.",
    "<b>Running out of inodes with free space left.</b> Millions of tiny files can exhaust the inode table first (df -i shows it).",
  ],

  code: {
    pseudo: `lookup(path):
    inode <- root_inode
    for name in path.split("/"):
        inode <- directory_entries(inode)[name]      # name -> inode number
    return inode

read(inode, offset):
    block_no <- offset / block_size
    if block_no < 12: addr <- inode.direct[block_no]
    else: follow indirect blocks as needed
    return read_block(addr)`,
    py: `import os, tempfile

d = tempfile.mkdtemp()
a = os.path.join(d, "notes.txt")
b = os.path.join(d, "alias.txt")
s = os.path.join(d, "soft.txt")

with open(a, "w") as f:
    f.write("hello")
os.link(a, b)                          # hard link: a second name, same inode
os.symlink(a, s)                       # symlink: a file that holds a path

print(os.stat(a).st_ino == os.stat(b).st_ino)     # True
print(os.stat(a).st_nlink)                        # 2 names for one inode
os.remove(a)
print(open(b).read())                  # hello: the data survives
try:
    open(s)
except FileNotFoundError:
    print("symlink dangles")           # the stored path is now dead`,
  },
  codecap: "A hard link shares the inode, so deleting one name leaves the file. The symlink only stored a path.",

  q: [
    ["What is an inode?", "A record holding a file's metadata and its block pointers. It does not store the name."],
    ["Where is the file name stored?", "In a directory, which maps names to inode numbers."],
    ["Hard link versus symbolic link?", "A hard link is another name for the same inode. A symlink is a separate small file containing a path."],
    ["Why does the inode have direct and indirect pointers?", "Small files, which are the majority, need no extra reads. Indirect blocks let a few files grow very large."],
    ["What does journaling protect against?", "A crash during a multi-step update. The log lets the system replay or discard the half-finished change."],
  ],

  p: [
    ["SRC", "https://pages.cs.wisc.edu/~remzi/OSTEP/file-implementation.pdf", "OSTEP, file system implementation", "M"],
    ["SRC", "https://pages.cs.wisc.edu/~remzi/OSTEP/file-journaling.pdf", "OSTEP, crash consistency and journaling", "M"],
    ["SRC", "https://man7.org/linux/man-pages/man7/inode.7.html", "man 7 inode", "M"],
    ["SRC", "https://docs.python.org/3/library/os.html#os.link", "os.link and os.symlink docs", "E"],
    ["SRC", "https://www.kernel.org/doc/html/latest/filesystems/ext4/index.html", "ext4 on-disk layout", "H"],
  ],
},

{
  id: "syscalls-interrupts",
  need: {
    ask: `<p>A program wants to read a file. The disk is hardware that only the operating system may touch. A buggy or hostile program must not be able to read anyone's file, write to the disk directly, or halt the CPU.</p>
<p>How does an ordinary program ask for privileged work, and how does the OS learn that a key was pressed?</p>`,
    tries: [
      ["Let programs call the driver directly", "Any program could then read every other user's files or stop the machine. The whole protection model disappears."],
      ["Have the program check on the device in a loop", "Polling a keyboard that is pressed once a second wastes 100% of a core to find 1 event in a billion checks."],
    ],
    so: `<p>Split the CPU into two modes. In <b>user mode</b> a program cannot touch hardware. To ask for help it executes a <b>system call</b>: a special instruction that jumps into the kernel at a fixed, checked entry point, in <b>kernel mode</b>.</p>
<p>For the other direction, hardware raises an <b>interrupt</b> when it needs attention. The CPU stops what it is doing, runs the handler and resumes.</p>`,
  },

  n: "System Calls and Interrupts",
  group: "Kernel",
  one: "A <b>system call</b> is a controlled jump from user mode into the kernel; an <b>interrupt</b> is the hardware's way of making the CPU come to it.",

  plain: `<p>The CPU runs in at least two modes. <b>User mode</b> cannot execute privileged instructions or touch device memory. <b>Kernel mode</b> can do anything. The kernel owns the hardware, and programs borrow it.</p>
<p>A <b>system call</b> (read, write, fork, open) is how a program asks. It puts a call number and arguments in registers and executes a trap instruction. The CPU switches to kernel mode and jumps to a fixed handler, which validates the arguments, does the work and returns.</p>
<p>An <b>interrupt</b> is a signal from hardware: a packet arrived, a key was pressed, the timer fired. The CPU saves its state, runs the interrupt handler in the kernel, then resumes the interrupted code. A <b>trap</b> or <b>exception</b> comes from the running instruction itself, such as a page fault or divide by zero.</p>
<p><b>Analogy.</b> A bank counter: you cannot walk into the vault, you ask the teller through the window. And the alarm bell is the interrupt.</p>`,

  why: [
    { t: "Protection needs hardware enforcement",
      d: "A rule in software can be bypassed by software. The CPU itself refuses privileged instructions in user mode." },
    { t: "Programs still need privileged services",
      d: "Reading a file, sending a packet or creating a process all need the kernel. So there must be a door, and it must be guarded." },
    { t: "The door is a single, fixed entry point",
      d: "A system call jumps to a table-defined handler. The program cannot choose where in the kernel to land, and the kernel checks every argument." },
    { t: "Devices are slow and unpredictable",
      d: "A disk takes milliseconds and a network packet arrives whenever it likes. The CPU should do other work instead of waiting." },
    { t: "Interrupts let the CPU be told, not ask",
      d: "The device signals when it is done. The CPU runs a short handler and goes back, so no cycles are wasted on polling." },
    { t: "At very high rates, interrupts themselves get too costly",
      d: "A fast network card can raise a million interrupts a second. Then the kernel switches to polling or batching interrupts to survive." },
  ],

  hing: `<p><b>Do modes.</b> User mode mein program hardware ko haath nahi laga sakta. Kernel mode mein sab kuch kar sakta hai. CPU khud ye rule enforce karta hai.</p>
<p><b>System call.</b> Program kernel se kuch maangta hai (read, write, fork). Trap instruction se kernel mode mein jaata hai, kernel arguments check karta hai, kaam karta hai aur wapas aata hai.</p>
<p><b>Interrupt.</b> Hardware CPU ko bolta hai "mujhe dekho". CPU apna kaam rok kar handler chalata hai, phir wahin se aage badhta hai.</p>
<p><b>Interview mein.</b> System call, interrupt aur exception ka farq: syscall program khud bulata hai, interrupt hardware se aata hai, exception instruction ki galti se (page fault).</p>`,

  viz: ["os-syscall-path"],

  math: [
    { t: "The cost of many tiny system calls", d: "Read a 1 MB file one byte at a time versus 64 KB at a time. Assume each system call costs about 200 ns of overhead.", w:
`1 byte per read:   1,000,000 calls x 200 ns = 200 ms
64 KB per read:    16 calls x 200 ns        = 3.2 us

overhead ratio = 200 ms / 3.2 us = about 62,500x
this is why buffered I/O exists` },
    { t: "Interrupts versus polling at low rate", d: "A device raises 1,000 events a second. An interrupt handler costs 5 microseconds of CPU.", w:
`interrupts: 1,000 x 5 us = 5 ms per second = 0.5% of one core
polling every 100 us: 10,000 polls/s x 1 us = 1% of one core,
    and a latency of up to 100 us

at this rate interrupts win on both CPU and latency` },
    { t: "Interrupts versus polling at a high rate", d: "A fast network card now delivers 1,000,000 packets a second. Same 5 microsecond handler.", w:
`1,000,000 x 5 us = 5 seconds of CPU per second = 500% of a core
the machine cannot keep up: receive livelock

fix (NAPI): interrupt once, then poll a batch of 64 packets
    interrupts: 1,000,000 / 64 = about 15,600 per second` },
  ],

  costs: [
    ["system call overhead", "about 100 to 500 ns", "mode switch plus argument checking, before any real work"],
    ["interrupt handling", "a few microseconds", "save state, run handler, restore, and cold-cache effects"],
    ["context switch", "a few microseconds", "triggered by a timer interrupt or a blocking system call"],
    ["vDSO calls (gettimeofday)", "tens of ns", "Linux maps the time into user space so no kernel entry is needed"],
  ],

  traps: [
    "<b>Mixing up syscall, interrupt and exception.</b> A syscall is requested by software, an interrupt arrives from hardware, an exception is caused by the instruction itself.",
    "<b>Reading a file a byte at a time.</b> Each call crosses into the kernel. Buffer your I/O.",
    "<b>Saying library calls and system calls are the same.</b> printf is a library function that eventually calls write. Only the second enters the kernel.",
    "<b>Thinking the kernel is a process.</b> It is code that runs inside whichever process made the call, in kernel mode, or inside an interrupt handler.",
    "<b>Doing long work inside an interrupt handler.</b> It blocks other interrupts. Handlers do the minimum and defer the rest to a later, schedulable context.",
  ],

  code: {
    pseudo: `# user side
write(fd, buf, n):
    put syscall_number(write), fd, buf, n into registers
    trap                              # switch to kernel mode, jump to the handler

# kernel side
syscall_handler():
    check the arguments are valid and the caller has permission
    do the work ; place the result in a register
    return to user mode

# interrupt
on device_interrupt: save state ; run handler ; restore state ; resume`,
    py: `import os, time

path = "/tmp/sysdemo.bin"
with open(path, "wb") as f:
    f.write(os.urandom(1_000_000))

def read_all(chunk):
    fd = os.open(path, os.O_RDONLY)          # open(2), a system call
    n = calls = 0
    while True:
        b = os.read(fd, chunk)               # read(2), one call each time
        if not b:
            break
        n += len(b)
        calls += 1
    os.close(fd)
    return calls

for chunk in (1, 4096, 65536):
    t = time.perf_counter()
    calls = read_all(chunk)
    print(f"chunk {chunk:6d}: {calls:8d} syscalls, {time.perf_counter() - t:.3f}s")
os.remove(path)`,
  },
  codecap: "Same bytes, very different cost. The only thing that changed is how many times the program crossed into the kernel.",

  q: [
    ["Why are there user and kernel modes?", "So the CPU hardware can stop ordinary programs from touching devices or each other, while the kernel keeps full control."],
    ["What happens during a system call?", "The program executes a trap, the CPU enters kernel mode at a fixed handler, the kernel validates and performs the request, then returns to user mode."],
    ["Interrupt versus exception?", "An interrupt comes from outside hardware at any time. An exception is raised by the instruction being run, such as a page fault."],
    ["Why use interrupts rather than polling?", "The CPU can do other work until the device needs it. At very high rates the cost flips and batching or polling wins."],
    ["Why is reading a file a byte at a time slow?", "Each read is a system call with fixed overhead, so a million calls cost far more than a few large ones."],
  ],

  p: [
    ["SRC", "https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-mechanisms.pdf", "OSTEP, limited direct execution", "M"],
    ["SRC", "https://man7.org/linux/man-pages/man2/syscalls.2.html", "man 2 syscalls, the full Linux list", "E"],
    ["SRC", "https://man7.org/linux/man-pages/man1/strace.1.html", "strace a small program and count its syscalls", "E"],
    ["SRC", "https://www.kernel.org/doc/html/latest/core-api/irq/index.html", "Linux kernel IRQ documentation", "H"],
    ["SRC", "https://pages.cs.wisc.edu/~remzi/OSTEP/file-devices.pdf", "OSTEP, I/O devices and interrupts", "M"],
  ],
},

];
