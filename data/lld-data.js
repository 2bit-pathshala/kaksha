/* Low-Level Design — one-pager notes + practice
   Node: { n, h?, note?, code?, p?: [[num|"GFG"|"EDU"|"HI"|"LIST", slug|url, title, "E|M|H"], ...], c?: [...] }
*/
const LLD = [

  /* ===================== OVERVIEW ===================== */
  { n: "Overview", h: "Three intro cards: what LLD is, how to approach a problem, and interview tips. HLD is what the system does at scale; LLD is how one service is built.", c: [
    { n: "What is Low Level System Design?",
      note: "<b>Low-Level Design</b> is the detailed design of a component/module: classes, methods, interactions, error handling, and thread-safety. Output of an LLD round: requirements, class diagram, public APIs, and a working (or sketched) implementation.<br><b>HLD</b> = services, DBs, caches, scale. <b>LLD</b> = entities, relationships, what varies, and code.<br>Machine coding = LLD + you type a compiling solution in 60–90 min.",
      p: [
        ["GFG", "https://www.geeksforgeeks.org/system-design/what-is-low-level-design-or-lld-learn-system-design/", "What is LLD?", "E"],
        ["HI", "https://www.hellointerview.com/learn/low-level-design/in-a-hurry/introduction", "Hello Interview — LLD intro", "E"],
        ["EDU", "https://www.educative.io/blog/frequently-asked-design-patterns-in-low-level-design-interviews", "Frequently asked LLD patterns", "M"],
      ]},
    { n: "How to Approach LLD Problems?",
      h: "Do not dump patterns. Name a pattern only when it removes a real coupling.",
      note: "<b>1. Clarify (5 min):</b> actors, scope, in/out of scope (multi-floor parking? multiple elevators?).<br><b>2. Requirements (5):</b> 3–5 functional + 1–2 non-functional (thread-safe park/unpark).<br><b>3. Entities (8):</b> nouns → classes. IS-A vs HAS-A. Prefer composition.<br><b>4. APIs (7):</b> public methods + return types + errors.<br><b>5. Patterns + code (15):</b> what varies? pricing → Strategy; creation → Factory; events → Observer; lifecycle → State. At most 1–2 patterns.<br><b>6. Trace (5):</b> walk one happy path and one edge (full lot, double-book seat).",
      p: [
        ["HI", "https://www.hellointerview.com/learn/low-level-design/in-a-hurry/patterns", "When to use which pattern", "M"],
        ["EDU", "https://www.educative.io/courses/grokking-the-low-level-design-interview-using-ood-principles", "Grokking LLD (OOD)", "M"],
      ]},
    { n: "LLD Interview Tips",
      note: "<b>Talk while you design</b> — silence looks like stuck.<br><b>Start concrete:</b> 1 parking lot, 1 movie hall — then extend.<br><b>Write APIs first</b> so the interviewer can steer you.<br><b>Thread-safety:</b> say what you lock (the spot / the seat map), not “I'll add synchronized everywhere.”<br><b>YAGNI:</b> no Kafka, no microservice split, unless asked.<br><b>Trade-offs:</b> inheritance vs composition, mutex vs concurrent map, lock whole cache vs per-key.<br><b>Test aloud:</b> two users book the last seat; cache get after eviction.",
      p: [
        ["HI", "https://www.hellointerview.com/learn/low-level-design/in-a-hurry/introduction", "LLD interview framing", "M"],
        ["GFG", "https://www.geeksforgeeks.org/system-design/how-to-answer-a-system-design-interview-problem/", "How to answer a design problem", "M"],
      ]},
    { n: "Map of this sheet",
      note: "<pre style='font-size:.8rem;line-height:1.45;overflow:auto'>LLD\n├── Overview — what / approach / tips\n├── OOP — classes, relationships, constructors, this, 4 pillars, generics, access\n├── Concurrency — ZeroEvenOdd, FizzBuzz, BBQueue, Philosophers, Crawler\n├── LLD + Concurrency — tickets, cache, Kafka pub-sub, rate limiter\n├── UML · SOLID · patterns\n├── Machine coding — Parking Lot, Elevator, Vending, Splitwise…\n└── LeetCode Design — LRU, MinStack, Twitter, Trie…</pre>",
      p: [
        ["LIST", "https://leetcode.com/problem-list/design/", "LeetCode Design problem list", "M"],
        ["GFG", "https://www.geeksforgeeks.org/system-design/low-level-design-problems/", "GFG LLD problems", "M"],
      ]},
  ]},

  /* ===================== OOP ===================== */
  { n: "OOP", h: "Classes, relationships, constructors, this/self, the four pillars, generics, and access modifiers. Apply them in a Parking Lot — don't just recite.", c: [
    { n: "Introduction to Classes and Objects",
      note: "A <b>class</b> is the blueprint; an <b>object</b> is one instance in memory. Class = fields + methods + constructors. Object has <b>identity</b> (address), <b>state</b> (field values), <b>behavior</b> (methods).<br><code>Car</code> is the class; <code>my_car = Car(\"KA-01\")</code> is an object. Many objects share the same class, each with its own state.",
      code:
`class Car:
    wheels = 4                          # class attribute (shared)
    def __init__(self, plate):
        self.plate = plate              # instance attribute
c1, c2 = Car("KA-01"), Car("KA-02")
c1.plate, c2.plate, Car.wheels          # 'KA-01', 'KA-02', 4`,
      p: [
        ["GFG", "https://www.geeksforgeeks.org/python-classes-and-objects/", "Classes and objects (Python)", "E"],
        ["GFG", "https://www.geeksforgeeks.org/classes-objects-java/", "Classes and objects (Java)", "E"],
      ]},
    { n: "Class Relationships : A Deep Dive",
      note: "<b>Association</b> — uses-a (Teacher ↔ Student).<br><b>Aggregation</b> — has-a, part can live alone (Department has Professors).<br><b>Composition</b> — has-a, part dies with whole (House has Rooms). Strongest coupling.<br><b>Inheritance / generalization</b> — is-a (Car is a Vehicle).<br><b>Realization</b> — class implements an interface.<br><b>Dependency</b> — uses momentarily (method arg).<br>Interview default: <b>prefer composition over inheritance</b>.",
      p: [
        ["GFG", "https://www.geeksforgeeks.org/association-composition-aggregation-java/", "Association, aggregation, composition", "E"],
        ["GFG", "https://www.geeksforgeeks.org/unified-modeling-language-uml-class-diagrams/", "UML class relationships", "E"],
      ]},
    { n: "Constructor and It's types",
      note: "A constructor runs when you create an object — sets initial state. Types: <b>default</b> (no args), <b>parameterized</b>, <b>copy</b> (clone fields), <b>chaining</b> (<code>this()</code> / <code>super()</code>).<br>Python: only <code>__init__</code>; chain with <code>super().__init__(...)</code>. Java: same name as class, no return type, can overload.",
      code:
`class Ticket:
    def __init__(self, spot, vehicle, hours=1):   # parameterized + default
        self.spot, self.vehicle, self.hours = spot, vehicle, hours
    @classmethod
    def from_ticket(cls, other):                  # copy-style factory
        return cls(other.spot, other.vehicle, other.hours)`,
      p: [
        ["GFG", "https://www.geeksforgeeks.org/constructors-in-python/", "Constructors in Python", "E"],
        ["GFG", "https://www.geeksforgeeks.org/constructors-in-java/", "Constructors in Java", "E"],
      ]},
    { n: "This Keyword in OOPS",
      note: "<b>Java <code>this</code></b> = current object. Uses: disambiguate fields (<code>this.x = x</code>), call another constructor (<code>this(args)</code>), pass yourself (<code>observer.subscribe(this)</code>).<br><b>Python <code>self</code></b> is the same idea — first param of instance methods, not a keyword. <code>cls</code> is the class in <code>@classmethod</code>. Never skip <code>self</code> on instance methods.",
      code:
`class User:
    def __init__(self, name):
        self.name = name                 # self ≈ Java this
    def rename(self, name):
        self.name = name                 # field, not the arg
    def greet(self, other):
        return f"{self.name} hi {other.name}"`,
      p: [
        ["GFG", "https://www.geeksforgeeks.org/this-reference-in-java/", "this in Java", "E"],
        ["GFG", "https://www.geeksforgeeks.org/self-in-python-class/", "self in Python", "E"],
      ]},
    { n: "Polymorphism and It's Types",
      note: "<b>Compile-time (overloading):</b> same name, different params. Java yes; Python ≈ default args / <code>*args</code>.<br><b>Runtime (overriding):</b> child replaces parent method. <i>This</i> is the LLD one — <code>Notification.send()</code> is email vs SMS.<br><b>Parametric:</b> generics (see below). Dynamic dispatch = which override runs is decided at runtime from the actual object type.",
      code:
`class Notification:
    def send(self, msg): raise NotImplementedError
class Email(Notification):
    def send(self, msg): return f"email: {msg}"
class SMS(Notification):
    def send(self, msg): return f"sms: {msg}"
def blast(notifs, msg):
    return [n.send(msg) for n in notifs]   # runtime polymorphism`,
      p: [
        ["GFG", "https://www.geeksforgeeks.org/polymorphism-in-python/", "Polymorphism in Python", "M"],
        ["GFG", "https://www.geeksforgeeks.org/polymorphism-in-java/", "Polymorphism in Java", "M"],
      ]},
    { n: "Inheritance and It's types",
      note: "<b>Single</b> — one parent (Java classes). <b>Multilevel</b> — A←B←C. <b>Hierarchical</b> — one parent, many children (Vehicle ← Car/Bike). <b>Multiple</b> — many parents (Python yes; Java via interfaces). <b>Hybrid</b> — mix.<br>Use for true IS-A. Deep trees break LSP. Prefer composition for “has a behavior.”",
      code:
`class Vehicle:
    def __init__(self, plate, spots): self.plate, self.spots = plate, spots
class Motorcycle(Vehicle):
    def __init__(self, plate): super().__init__(plate, 1)
class Car(Vehicle):
    def __init__(self, plate): super().__init__(plate, 1)
class Bus(Vehicle):
    def __init__(self, plate): super().__init__(plate, 5)`,
      p: [
        [1603, "design-parking-system", "Design Parking System", "E"],
        ["GFG", "https://www.geeksforgeeks.org/types-of-inheritance-python/", "Inheritance types (Python)", "M"],
        ["GFG", "https://www.geeksforgeeks.org/inheritance-in-java/", "Inheritance in Java", "M"],
      ]},
    { n: "Encapsulation",
      note: "<b>Bundle data + methods; hide internals.</b> Callers use methods, not raw fields. Protects invariants (a balance cannot go negative except via <code>withdraw</code>).<br>Python: prefix internals with <code>_</code>; use <code>@property</code>. Java: <code>private</code> fields + getters/setters only when needed.",
      code:
`class BankAccount:
    def __init__(self, balance=0):
        self._balance = balance          # hidden state
    def deposit(self, amt):
        if amt <= 0: raise ValueError("amt")
        self._balance += amt
    def withdraw(self, amt):
        if amt > self._balance: raise ValueError("funds")
        self._balance -= amt
    @property
    def balance(self):                   # read-only view
        return self._balance`,
      p: [
        [2043, "simple-bank-system", "Simple Bank System", "M"],
        [1797, "design-authentication-manager", "Design Authentication Manager", "M"],
        ["GFG", "https://www.geeksforgeeks.org/encapsulation-in-python/", "Encapsulation in Python", "M"],
      ]},
    { n: "Abstraction",
      note: "<b>Expose the contract, hide the engine.</b> Abstract classes / interfaces define <i>what</i>; subclasses define <i>how</i>. Java: <code>abstract class</code> / <code>interface</code>. Python: <code>ABC</code> + <code>@abstractmethod</code>. High-level code depends on the abstraction (DIP).",
      code:
`from abc import ABC, abstractmethod
class PaymentProcessor(ABC):
    @abstractmethod
    def pay(self, amount: float) -> bool: ...
class StripeProcessor(PaymentProcessor):
    def pay(self, amount):
        return True                      # caller never sees HTTP`,
      p: [
        ["GFG", "https://www.geeksforgeeks.org/abstract-classes-in-python/", "Abstract classes in Python", "M"],
        ["GFG", "https://www.geeksforgeeks.org/abstraction-in-java/", "Abstraction in Java", "M"],
      ]},
    { n: "Generics and Wildcards",
      note: "<b>Generics</b> = type parameters so a class/method works for many types without casts. Java: <code>List&lt;T&gt;</code>, <code>Cache&lt;K,V&gt;</code>. Python: <code>Generic[T]</code>, <code>TypeVar</code>.<br><b>Wildcards (Java):</b> <code>? extends T</code> (producer — get, PECS), <code>? super T</code> (consumer — put). <code>List&lt;?&gt;</code> is read-as-Object. Interview: a parking <code>Spot&lt;T extends Vehicle&gt;</code> should not accept a raw <code>Object</code>.",
      code:
`from typing import Generic, TypeVar
K = TypeVar("K"); V = TypeVar("V")
class Cache(Generic[K, V]):
    def __init__(self): self._m: dict[K, V] = {}
    def put(self, k: K, v: V): self._m[k] = v
    def get(self, k: K) -> V | None: return self._m.get(k)
c = Cache[str, int](); c.put("ttl", 60)`,
      p: [
        ["GFG", "https://www.geeksforgeeks.org/generics-in-java/", "Generics in Java", "M"],
        ["GFG", "https://www.geeksforgeeks.org/wildcards-in-java/", "Wildcards in Java", "M"],
        [146, "lru-cache", "LRU Cache (typed K,V)", "M"],
      ]},
    { n: "Access Modifiers",
      note: "<b>Java:</b> <code>private</code> (class), default / package (same package), <code>protected</code> (package + subclasses), <code>public</code> (everywhere).<br><b>Python:</b> convention only — <code>name</code> public, <code>_name</code> internal, <code>__name</code> name-mangled. Nothing is truly private.<br>LLD: keep fields private; expose a small public API (the facade).",
      code:
`class Spot:
    def __init__(self, size):
        self._size = size                # protected-by-convention
        self.__occupied = False          # mangled: _Spot__occupied
    def park(self): self.__occupied = True
    def free(self): self.__occupied = False
    def is_free(self): return not self.__occupied`,
      p: [
        ["GFG", "https://www.geeksforgeeks.org/access-modifiers-java/", "Access modifiers (Java)", "E"],
        ["GFG", "https://www.geeksforgeeks.org/access-modifiers-in-python-public-private-and-protected/", "Access modifiers (Python)", "E"],
      ]},
    { n: "Python Decorators",
      h: "A decorator is a function that wraps another — the language-level Decorator pattern. Interview: logging, timing, retry, auth.",
      note: "<code>@f</code> on <code>def g</code> means <code>g = f(g)</code>. Built-ins: <code>@property</code>, <code>@staticmethod</code>, <code>@classmethod</code>, <code>@functools.lru_cache</code>, <code>@dataclass</code>. Keep wrappers thin; use <code>functools.wraps</code> so <code>__name__</code> survives.",
      code:
`from functools import wraps
def timed(fn):
    @wraps(fn)
    def wrap(*a, **k):
        import time; t = time.perf_counter()
        out = fn(*a, **k)
        print(fn.__name__, "took", round(time.perf_counter()-t, 4), "s")
        return out
    return wrap

@timed
def work(n):
    return sum(range(n))`,
      p: [
        [146, "lru-cache", "LRU Cache (see also functools.lru_cache)", "M"],
        ["GFG", "https://www.geeksforgeeks.org/decorators-in-python/", "Decorators in Python", "E"],
      ]},
  ]},

  /* ===================== CONCURRENCY ===================== */
  { n: "Concurrency", h: "Coordinate threads: locks, conditions, semaphores. Print-in-order problems train the muscle you need for a thread-safe cache or booking system.", c: [
    { n: "Tools in 30 seconds",
      note: "<b>Lock / mutex</b> — one thread in the critical section.<br><b>Condition</b> — wait until a predicate (queue not empty).<br><b>Semaphore(n)</b> — n permits (capacity, or “your turn”).<br><b>Barrier</b> — wait until k threads arrive.<br>Python: <code>threading.Lock</code>, <code>Condition</code>, <code>Semaphore</code>. Java: <code>synchronized</code>, <code>ReentrantLock</code>, <code>Semaphore</code>. Always unlock in <code>finally</code>.",
      p: [
        [1114, "print-in-order", "Print in Order", "E"],
        [1115, "print-foobar-alternately", "Print FooBar Alternately", "M"],
        ["GFG", "https://www.geeksforgeeks.org/multithreading-python-set-1/", "Multithreading in Python", "M"],
      ]},
    { n: "Print Zero Even Odd",
      note: "Three threads: <code>zero</code> prints 0s, <code>even</code> even numbers, <code>odd</code> odds → <code>010203…</code> of length 2n. <b>Idea:</b> three semaphores. Zero starts with 1 permit; after printing 0 it releases odd or even; that thread prints the number and releases zero.",
      code:
`from threading import Semaphore
class ZeroEvenOdd:
    def __init__(self, n):
        self.n = n
        self.z, self.e, self.o = Semaphore(1), Semaphore(0), Semaphore(0)
    def zero(self, printNumber):
        for i in range(1, self.n + 1):
            self.z.acquire(); printNumber(0)
            (self.o if i % 2 else self.e).release()
    def even(self, printNumber):
        for i in range(2, self.n + 1, 2):
            self.e.acquire(); printNumber(i); self.z.release()
    def odd(self, printNumber):
        for i in range(1, self.n + 1, 2):
            self.o.acquire(); printNumber(i); self.z.release()`,
      p: [
        [1116, "print-zero-even-odd", "Print Zero Even Odd", "M"],
      ]},
    { n: "Fizz Buzz Multithreaded",
      note: "Four threads: fizz (÷3), buzz (÷5), fizzbuzz (÷15), number (else). Same trick as ZeroEvenOdd — four semaphores, or one lock + condition + a <code>turn</code> counter. After each print, bump <code>i</code> and notify all; each thread waits until <code>i</code> matches its rule.",
      code:
`from threading import Semaphore
class FizzBuzz:
    def __init__(self, n):
        self.n = n
        self.f = Semaphore(0); self.b = Semaphore(0)
        self.fb = Semaphore(0); self.num = Semaphore(1)
    def _step(self, i):
        if i == self.n: return
        i += 1
        if i % 15 == 0: self.fb.release()
        elif i % 3 == 0: self.f.release()
        elif i % 5 == 0: self.b.release()
        else: self.num.release()
    # fizz/buzz/fizzbuzz/number: acquire own sem, print, _step(i)`,
      p: [
        [1195, "fizz-buzz-multithreaded", "Fizz Buzz Multithreaded", "M"],
      ]},
    { n: "Design Bounded Blocking Queue",
      note: "<b>enqueue</b> blocks when full; <b>dequeue</b> blocks when empty. Capacity is the bound (thread pool work queue, producer-consumer).<br><b>Two semaphores:</b> empty slots + filled slots, plus a mutex around the deque. Or one mutex + two conditions (<code>not_full</code>, <code>not_empty</code>).",
      code:
`from collections import deque
from threading import Condition
class BoundedBlockingQueue:
    def __init__(self, capacity):
        self.cap, self.q, self.cv = capacity, deque(), Condition()
    def enqueue(self, x):
        with self.cv:
            while len(self.q) == self.cap: self.cv.wait()
            self.q.append(x); self.cv.notify_all()
    def dequeue(self):
        with self.cv:
            while not self.q: self.cv.wait()
            x = self.q.popleft(); self.cv.notify_all(); return x
    def size(self):
        with self.cv: return len(self.q)`,
      p: [
        [1188, "design-bounded-blocking-queue", "Design Bounded Blocking Queue", "M"],
        ["GFG", "https://www.geeksforgeeks.org/producer-consumer-problem-using-semaphores-set-1/", "Producer–consumer", "M"],
      ]},
    { n: "The Dining Philosophers",
      note: "n philosophers, n forks. Each needs two forks to eat. Naive “pick left then right” <b>deadlocks</b> if all pick left together.<br><b>Fixes:</b> (1) last philosopher picks right-first (break the cycle). (2) allow at most n-1 eaters (semaphore). (3) lock both forks atomically by ordered ids. Interview: name deadlock, starvation, and which fix you picked.",
      code:
`from threading import Lock
class DiningPhilosophers:
    def __init__(self):
        self.forks = [Lock() for _ in range(5)]
    def wants_to_eat(self, i, pick_left, pick_right, eat, put_left, put_right):
        a, b = i, (i + 1) % 5
        if a > b: a, b = b, a          # global order → no cycle
        with self.forks[a], self.forks[b]:
            pick_left(); pick_right(); eat(); put_left(); put_right()`,
      p: [
        [1226, "the-dining-philosophers", "The Dining Philosophers", "H"],
        ["GFG", "https://www.geeksforgeeks.org/dining-philosopher-problem-using-semaphores/", "Dining Philosophers", "H"],
      ]},
    { n: "Multithreaded Web Crawler",
      note: "Start from a URL, fetch, extract same-host links, crawl until exhausted. <b>Shared:</b> visited set (lock or concurrent set), queue of URLs, thread pool.<br>Don't fetch a URL twice. Join all workers. Host filter is part of the problem (stay on start hostname).",
      code:
`from concurrent.futures import ThreadPoolExecutor, as_completed
from threading import Lock
def crawl(start, htmlParser):
    host = start.split("/")[2]; seen, lock = {start}, Lock()
    def visit(url):
        nxt = []
        for u in htmlParser.getUrls(url):
            if u.split("/")[2] != host: continue
            with lock:
                if u not in seen: seen.add(u); nxt.append(u)
        return nxt
    q = [start]
    with ThreadPoolExecutor(8) as pool:
        while q:
            found = []
            for fut in as_completed([pool.submit(visit, u) for u in q]):
                found += fut.result()
            q = found
    return list(seen)`,
      p: [
        [1242, "web-crawler-multithreaded", "Web Crawler Multithreaded", "H"],
        [1236, "web-crawler", "Web Crawler (single thread)", "M"],
      ]},
  ]},

  /* ===================== LLD + CONCURRENCY ===================== */
  { n: "LLD + Concurrency", h: "Full designs where correctness depends on locks: seats, caches, pub-sub, rate limits. Entities first, then say exactly what you synchronize.", c: [
    { n: "Design Movie Ticket Booking System",
      note: "<b>Entities:</b> City, Cinema, Hall, Movie, Show, Seat, User, Booking, Payment.<br><b>Seat states:</b> FREE → LOCKED (TTL 2–5 min) → BOOKED. Never skip LOCKED — two users clicking the same seat is the whole interview.<br><b>Concurrency:</b> lock per-show seat map (or per-seat). Lock must expire or a crash holds seats forever. Unique booking id, idempotent pay webhook.<br><b>Patterns:</b> State (seat), Facade (BookingService), Strategy (pricing / payment).",
      p: [
        ["GFG", "https://www.geeksforgeeks.org/system-design/design-bookmyshow-movie-ticket-booking-system/", "Design BookMyShow / movie tickets", "H"],
        [1603, "design-parking-system", "Design Parking System (toy analog)", "E"],
      ]},
    { n: "Design cache",
      note: "<b>API:</b> <code>get(k)</code>, <code>put(k,v)</code>, optional TTL. <b>Eviction:</b> LRU (map + DLL) is the default; LFU if asked.<br><b>Concurrency:</b> one lock around get/put is correct and what you code first. Upgrade: striped locks / ConcurrentHashMap + per-entry lock. Read-through vs cache-aside (app loads DB on miss).<br>Write-through (sync DB) vs write-back (faster, risk of loss).",
      code:
`from collections import OrderedDict
from threading import Lock
class LRUCache:
    def __init__(self, cap):
        self.cap, self.m, self.lock = cap, OrderedDict(), Lock()
    def get(self, k):
        with self.lock:
            if k not in self.m: return -1
            self.m.move_to_end(k); return self.m[k]
    def put(self, k, v):
        with self.lock:
            if k in self.m: self.m.move_to_end(k)
            self.m[k] = v
            if len(self.m) > self.cap: self.m.popitem(last=False)`,
      p: [
        [146, "lru-cache", "LRU Cache", "H"],
        [460, "lfu-cache", "LFU Cache", "H"],
        [432, "all-oone-data-structure", "All O`one Data Structure", "H"],
      ]},
    { n: "Design Pub-Sub Model like Kafka",
      note: "<b>Kafka LLD (not full HLD):</b> Producer → Topic → Partitions (append-only log) → Consumer Group (one consumer per partition for ordering).<br><b>Entities:</b> Broker, Topic, Partition, Offset, Producer, Consumer, ConsumerGroup.<br><b>Guarantees:</b> order <i>inside a partition</i> (key hashes to partition). At-least-once = commit offset after process; at-most-once = commit first; exactly-once needs idempotent producer + txn (say it, don't implement).<br><b>Concurrency:</b> single writer per partition (or lock the log); consumers pull independently. Blocking queue between broker I/O and handler threads.",
      p: [
        ["GFG", "https://www.geeksforgeeks.org/system-design/kafka-architecture/", "Kafka architecture", "H"],
        [355, "design-twitter", "Design Twitter (fan-out / observers)", "H"],
        [1188, "design-bounded-blocking-queue", "Bounded Blocking Queue", "M"],
      ]},
    { n: "Design Rate Limiter (LLD)",
      note: "<b>Token bucket:</b> bucket of size B, refill R tokens/sec. Allow if token available. Smooth bursts. <b>Sliding window log:</b> store timestamps, drop older than window, reject if count ≥ N. <b>Fixed window:</b> simple, burst at boundary.<br><b>Concurrency:</b> lock per-key (user/IP) so two requests don't both see “1 token left.” Distributed: Redis INCR + TTL or Redis token-bucket Lua — mention, don't build.<br>LC 359 is “print at most once per 10s per message.” LC 362 is hits in last 300s.",
      code:
`import time
from threading import Lock
class TokenBucket:
    def __init__(self, rate, burst):
        self.rate, self.burst, self.tokens = rate, burst, burst
        self.t, self.lock = time.monotonic(), Lock()
    def allow(self):
        with self.lock:
            now = time.monotonic()
            self.tokens = min(self.burst, self.tokens + (now - self.t) * self.rate)
            self.t = now
            if self.tokens < 1: return False
            self.tokens -= 1; return True`,
      p: [
        [359, "logger-rate-limiter", "Logger Rate Limiter", "M"],
        [362, "design-hit-counter", "Design Hit Counter", "H"],
        [933, "number-of-recent-calls", "Number of Recent Calls", "M"],
        ["GFG", "https://www.geeksforgeeks.org/system-design/rate-limiting-system-design/", "Rate limiting (system design)", "H"],
      ]},
  ]},

  /* ===================== UML ===================== */
  { n: "UML", h: "In interviews, a 2-minute class-diagram sketch beats a perfect drawing. Boxes, arrows, multiplicity.", c: [
    { n: "Class diagram",
      note: "<b>Box:</b> name / attributes / methods.<br><b>IS-A (inheritance):</b> hollow triangle, child → parent. <code>Car ▷ Vehicle</code>.<br><b>HAS-A composition:</b> filled diamond (part dies with whole). <code>ParkingLot ◆ Floor</code>.<br><b>Aggregation:</b> hollow diamond (part can live alone).<br><b>Association:</b> plain line. <b>Dependency:</b> dashed arrow (uses).<br><b>Multiplicity:</b> <code>1</code>, <code>0..1</code>, <code>1..*</code>, <code>*</code>.",
      p: [
        ["GFG", "https://www.geeksforgeeks.org/unified-modeling-language-uml-class-diagrams/", "UML class diagrams", "E"],
        ["GFG", "https://www.geeksforgeeks.org/unified-modeling-language-uml-introduction/", "UML introduction", "E"],
      ]},
    { n: "Sequence diagram",
      note: "<b>Who calls whom, in order.</b> Lifelines (vertical), arrows (calls), boxes (activation). Use for park-vehicle, checkout, or elevator-request. Interview: 4–6 actors max (User → Facade → Service → Store).",
      p: [
        ["GFG", "https://www.geeksforgeeks.org/unified-modeling-language-uml-sequence-diagrams/", "UML sequence diagrams", "E"],
      ]},
    { n: "Quick sketch template",
      note: "Start with 5–8 classes. Example parking lot:<pre style='font-size:.8rem;line-height:1.45'>ParkingLot 1—* Floor 1—* Spot\nVehicle ◁—— Car / Bike / Truck\nTicket  →  Spot, Vehicle, PricingStrategy\nParkingLot → PricingStrategy   (Strategy)\nParkingLot → VehicleFactory    (Factory)</pre>Say IS-A / HAS-A out loud while you draw.",
    },
  ]},

  /* ===================== PRINCIPLES ===================== */
  { n: "Design Principles", h: "SOLID for class shape. DRY / KISS / YAGNI / TDD for everyday code. Patterns are optional; these are not.", c: [
    { n: "SOLID",
      note: "Five class-design rules. Quote the letter, give a one-line violation, then the fix. That is the interview.",
      c: [
        { n: "SRP — Single Responsibility",
          note: "<b>A class has one reason to change.</b> <code>User</code> stores user data — it does not log, send email, or write SQL. Split <code>UserRepository</code>, <code>EmailService</code>, <code>User</code>.",
          code:
`# bad: User both persists and emails
# good:
class User:
    def __init__(self, email): self.email = email
class UserRepo:
    def save(self, user): ...
class EmailService:
    def send_welcome(self, user): ...`,
          p: [
            ["GFG", "https://www.geeksforgeeks.org/solid-principle-in-programming-understand-with-real-life-examples/", "SOLID with real-life examples", "M"],
          ]},
        { n: "OCP — Open/Closed",
          note: "<b>Open for extension, closed for modification.</b> Add a payment type by adding a class, not by editing a giant <code>if/elif</code> in <code>PaymentProcessor</code>. Strategy / Factory are the usual tools.",
          code:
`class Price:
    def fee(self, hours): raise NotImplementedError
class Hourly(Price):
    def fee(self, hours): return 10 * hours
class Flat(Price):
    def fee(self, hours): return 50
# new NightPrice: add a class, don't edit Hourly/Flat`,
        },
        { n: "LSP — Liskov Substitution",
          note: "<b>A subclass must be usable wherever the parent is.</b> Classic break: <code>Square</code> extending <code>Rectangle</code> — setting width should not silently change height. If the child cannot honor the parent's contract, it is not an IS-A. Use a <code>Shape</code> interface instead.",
          code:
`class Rectangle:
    def __init__(self, w, h): self.w, self.h = w, h
    def area(self): return self.w * self.h
# Square as Rectangle breaks set_width / set_height.
class Shape:
    def area(self): ...
class Square(Shape):
    def __init__(self, s): self.s = s
    def area(self): return self.s * self.s`,
        },
        { n: "ISP — Interface Segregation",
          note: "<b>Don't force clients to depend on methods they don't use.</b> A <code>Printer</code> should not require <code>scan()</code> and <code>fax()</code>. Split into small interfaces: <code>Printable</code>, <code>Scannable</code>.",
          code:
`class Printer:
    def print(self, doc): ...
class Scanner:
    def scan(self): ...
class MultiFunction(Printer, Scanner):
    def print(self, doc): ...
    def scan(self): ...
# CheapPrinter only implements Printer`,
        },
        { n: "DIP — Dependency Inversion",
          note: "<b>High-level modules depend on abstractions, not concretions.</b> <code>OrderService</code> takes a <code>PaymentProcessor</code>, not <code>StripeClient</code>. Inject the implementation (constructor injection).",
          code:
`class OrderService:
    def __init__(self, processor):   # processor: PaymentProcessor
        self.processor = processor
    def checkout(self, amt):
        return self.processor.pay(amt)
# OrderService(StripeProcessor()) or OrderService(MockProcessor())`,
        },
      ]},
    { n: "SOLID in interviews",
      h: "SOLID-2 — the gotchas they actually probe.",
      note: "<b>SRP:</b> “one reason to change” ≠ “one method”. A <code>Ticket</code> can have <code>id</code>, <code>entry</code>, <code>exit</code> — still one concept.<br><b>OCP:</b> don't pretentiously wrap every if. Use it when a family of behaviors will grow (pricing, notifications).<br><b>LSP:</b> overrides must not surprise (no extra exceptions, no stronger preconditions).<br><b>ISP:</b> fat interface smell = methods that throw <code>UnsupportedOperation</code>.<br><b>DIP:</b> new-ing a concrete class inside business logic is the usual violation — pass it in.",
      p: [
        ["GFG", "https://www.geeksforgeeks.org/software-engineering/solid-principle-in-programming-understand-with-real-life-examples/", "SOLID recap", "M"],
        ["HI", "https://www.hellointerview.com/learn/low-level-design/in-a-hurry/solid", "SOLID for LLD interviews", "M"],
      ]},
    { n: "DRY — Don't Repeat Yourself",
      note: "<b>Every piece of knowledge has one home.</b> Duplicate logic → helper / shared module. Duplicate literals → named constants. DRY is not “never type the same two lines” — over-abstracting two similar-but-diverging paths is the opposite mistake (premature DRY).",
      p: [
        ["GFG", "https://www.geeksforgeeks.org/software-engineering/dont-repeat-yourself-dry-in-software-development/", "DRY principle", "E"],
      ]},
    { n: "KISS — Keep It Simple",
      note: "<b>Simple code beats clever code.</b> Clear names, small functions, no pattern unless it pays rent. If you need a diagram to explain a 20-line function, split it. Optimize after you measure.",
      p: [
        ["GFG", "https://www.geeksforgeeks.org/software-engineering/kiss-principle-in-software-development/", "KISS principle", "E"],
      ]},
    { n: "YAGNI — You Aren't Gonna Need It",
      note: "<b>Build what the requirements ask, not a plugin framework for a future that never comes.</b> No extra vehicle types, no microservice split, no event bus — until the interviewer asks. Ship the minimal design, then extend when a requirement appears (that's OCP, applied late).",
      p: [
        ["GFG", "https://www.geeksforgeeks.org/software-engineering/you-arent-gonna-need-it-yagni-in-software-development/", "YAGNI principle", "E"],
      ]},
    { n: "Clean Code — 6 golden rules",
      note: "SOC · DYC · DRY · KISS · TDD · YAGNI. Leave the file cleaner than you found it.",
      c: [
        { n: "1. SOC — Separation of Concerns",
          note: "Split a complex program into units that each do one job. Function: don't fetch <i>and</i> format. Backend: Controller → Service → Repository. Frontend: keep UI off business logic." },
        { n: "2. DYC — Document Your Code",
          note: "Write for future-you. Docstrings on public APIs, comments on non-obvious why (not what), README for how to run. Code should still be self-explanatory — comments don't license cryptic names." },
        { n: "3. DRY",
          note: "Extract repeated logic. Reuse helpers. Constants over magic numbers. See DRY card above." },
        { n: "4. KISS",
          note: "Readable over clever. Split long functions. See KISS card above." },
        { n: "5. TDD — Test-Driven Development",
          note: "Red → green → refactor. Write a failing test, make it pass, clean up. For bugs: add a test that reproduces, then fix. Automate the suite. In LLD interviews, mention tests for park/unpark, full lot, and concurrent access even if you don't type them." },
        { n: "6. YAGNI",
          note: "Minimal viable design. Delete unused code. See YAGNI card above." },
      ],
      p: [
        ["GFG", "https://www.geeksforgeeks.org/software-engineering/code-smells/", "Code smells (clean-code cousin)", "M"],
      ]},
  ]},

  /* ===================== CREATIONAL ===================== */
  { n: "Creational Patterns", h: "How objects get created. Use when <code>new</code> is scattered or construction is multi-step / family-based.", c: [
    { n: "Singleton",
      note: "<b>One instance, global access.</b> Logger, config, connection pool. In Python, <code>__new__</code> or a module-level object (modules are already singletons). Interview warning: hidden global state, hard tests, threading — use a lock or don't bother. Prefer DI when you can.",
      code:
`class Logger:
    _inst = None
    def __new__(cls):
        if cls._inst is None:
            cls._inst = super().__new__(cls)
            cls._inst.lines = []
        return cls._inst
    def log(self, msg): self.lines.append(msg)
# Logger() is Logger()  → True`,
      p: [
        ["GFG", "https://www.geeksforgeeks.org/singleton-pattern-in-python-a-complete-guide/", "Singleton in Python", "E"],
        [359, "logger-rate-limiter", "Logger Rate Limiter", "E"],
      ]},
    { n: "Factory Method",
      note: "<b>Interface for creating an object; subclasses (or a factory function) pick the concrete class.</b> Callers never <code>if type == email: Email()</code>. Trigger: growing if-else on type strings.",
      code:
`def create_vehicle(kind, plate):
    if kind == "car": return Car(plate)
    if kind == "bike": return Motorcycle(plate)
    if kind == "bus": return Bus(plate)
    raise ValueError(kind)
v = create_vehicle("car", "KA-01")`,
      p: [
        ["GFG", "https://www.geeksforgeeks.org/factory-method-python-design-patterns/", "Factory Method — Python", "M"],
        [1603, "design-parking-system", "Design Parking System", "E"],
      ]},
    { n: "Abstract Factory",
      note: "<b>Create a family of related objects</b> (WindowsButton+WindowsMenu, MacButton+MacMenu) without naming concretes. One factory per family. Client depends on abstract Button/Menu.",
      code:
`class UIFactory:
    def button(self): ...
    def menu(self): ...
class DarkUI(UIFactory):
    def button(self): return DarkButton()
    def menu(self): return DarkMenu()
def render(factory: UIFactory):
    factory.button().draw(); factory.menu().draw()`,
      p: [
        ["GFG", "https://www.geeksforgeeks.org/abstract-factory-method-python-design-patterns/", "Abstract Factory — Python", "M"],
      ]},
    { n: "Factory vs Abstract Factory",
      note: "<b>Factory Method:</b> one product (<code>Vehicle</code> → Car/Bike).<br><b>Abstract Factory:</b> a kit of products that must match (Button+Checkbox of the same theme).<br>If you only ever create one type, Factory Method is enough. Don't upgrade to Abstract Factory for YAGNI reasons.",
      p: [
        ["GFG", "https://www.geeksforgeeks.org/difference-between-abstract-factory-and-factory-design-patterns/", "Factory vs Abstract Factory", "M"],
      ]},
    { n: "Builder",
      note: "<b>Step-by-step construction of a complex object</b> (many optional fields). Fluent <code>.with_x().with_y().build()</code>. Telescoping constructors are the smell. LC text editors / HTTP requests / SQL query builders.",
      code:
`class Query:
    def __init__(self): self._sel, self._tbl, self._wh = "*", None, []
    def table(self, t): self._tbl = t; return self
    def where(self, c): self._wh.append(c); return self
    def build(self):
        w = (" WHERE " + " AND ".join(self._wh)) if self._wh else ""
        return f"SELECT {self._sel} FROM {self._tbl}{w}"
q = Query().table("users").where("id=1").build()`,
      p: [
        ["GFG", "https://www.geeksforgeeks.org/builder-method-python-design-patterns/", "Builder — Python", "M"],
        [2296, "design-a-text-editor", "Design a Text Editor", "H"],
      ]},
    { n: "Prototype",
      note: "<b>Clone an existing object instead of reconstructing.</b> Costly setup, or you need a copy with a few fields changed. In Python: <code>copy.copy</code> / <code>deepcopy</code>. LC 138 is the linked-list version of clone-with-random-graph.",
      code:
`import copy
class Enemy:
    def __init__(self, hp, skills): self.hp, self.skills = hp, skills
    def clone(self): return copy.deepcopy(self)
base = Enemy(100, ["slash"]); mob = base.clone(); mob.hp = 40`,
      p: [
        [138, "copy-list-with-random-pointer", "Copy List with Random Pointer", "M"],
        ["GFG", "https://www.geeksforgeeks.org/prototype-method-python-design-patterns/", "Prototype — Python", "M"],
      ]},
    { n: "Object Pool",
      note: "<b>Reuse expensive instances</b> (DB connections, threads, game bullets) instead of alloc/free. Acquire → use → release. Cap the pool; block or reject when empty. Related to caches (LRU is “pool of capacity N with eviction”).",
      code:
`class Pool:
    def __init__(self, factory, size):
        self._free = [factory() for _ in range(size)]
    def acquire(self):
        if not self._free: raise RuntimeError("exhausted")
        return self._free.pop()
    def release(self, obj): self._free.append(obj)`,
      p: [
        [146, "lru-cache", "LRU Cache", "M"],
        [2502, "design-memory-allocator", "Design Memory Allocator", "M"],
        ["GFG", "https://www.geeksforgeeks.org/object-pool-design-pattern/", "Object Pool", "M"],
      ]},
  ]},

  /* ===================== STRUCTURAL ===================== */
  { n: "Structural Patterns", h: "How classes fit together. Adapters, wrappers, trees of parts, and a single door into a messy subsystem.", c: [
    { n: "Adapter",
      note: "<b>Wrap an incompatible API so it matches the one you need.</b> Legacy XML parser → new JSON interface. LC 232 is “adapt two stacks into a queue”. Don't confuse with Facade (simplify) or Decorator (add behavior, same interface).",
      code:
`class LegacyTemp:
    def celsius(self): return 36.6
class FahrenheitAdapter:
    def __init__(self, legacy): self.legacy = legacy
    def fahrenheit(self):
        return self.legacy.celsius() * 9/5 + 32`,
      p: [
        [232, "implement-queue-using-stacks", "Implement Queue using Stacks", "E"],
        [225, "implement-stack-using-queues", "Implement Stack using Queues", "E"],
        ["GFG", "https://www.geeksforgeeks.org/adapter-method-python-design-patterns/", "Adapter — Python", "M"],
      ]},
    { n: "Composite",
      note: "<b>Treat a part and a whole the same.</b> Files and folders both implement <code>size()</code> / <code>ls()</code>. Tree of UI widgets. Nested integer lists. Recurse.",
      code:
`class Node:
    def size(self): ...
class File(Node):
    def __init__(self, n): self.n = n
    def size(self): return self.n
class Folder(Node):
    def __init__(self): self.kids = []
    def add(self, n): self.kids.append(n)
    def size(self): return sum(k.size() for k in self.kids)`,
      p: [
        [341, "flatten-nested-list-iterator", "Flatten Nested List Iterator", "M"],
        [588, "design-in-memory-file-system", "Design In-Memory File System", "H"],
        ["GFG", "https://www.geeksforgeeks.org/composite-method-python-design-patterns/", "Composite — Python", "M"],
      ]},
    { n: "Facade",
      note: "<b>One simple door into a messy subsystem.</b> <code>HomeTheater.watch()</code> powers amp, TV, lights. <code>NotificationFacade.send()</code> hides factory + format + log + observers. Interview gold: your public API <i>is</i> the facade.",
      code:
`class CheckoutFacade:
    def __init__(self, cart, pay, email):
        self.cart, self.pay, self.email = cart, pay, email
    def place_order(self, user):
        total = self.cart.total()
        self.pay.charge(user, total)
        self.email.send(user, "thanks")
        return total`,
      p: [
        [1396, "design-underground-system", "Design Underground System", "M"],
        ["GFG", "https://www.geeksforgeeks.org/facade-method-python-design-patterns/", "Facade — Python", "M"],
      ]},
    { n: "Decorator",
      note: "<b>Add behavior at runtime without changing the class.</b> Wrap object, same interface. Stack wrappers: compression + encryption around a stream. Python <code>@decorator</code> is this pattern on functions. Unlike inheritance, you mix features without a class explosion.",
      code:
`class Notifier:
    def send(self, msg): return msg
class Prefix(Notifier):
    def __init__(self, inner, p): self.inner, self.p = inner, p
    def send(self, msg): return self.inner.send(self.p + msg)
n = Prefix(Prefix(Notifier(), "[INFO] "), ">> ")
n.send("up")  # '>> [INFO] up'`,
      p: [
        ["GFG", "https://www.geeksforgeeks.org/decorator-method-python-design-patterns/", "Decorator pattern — Python", "M"],
        [146, "lru-cache", "LRU Cache (cache decorator)", "M"],
      ]},
    { n: "Bridge",
      note: "<b>Split abstraction from implementation so they vary independently.</b> RemoteControl × Device (TV/Radio), Shape × Renderer. Without Bridge you'd subclass RemoteTV, RemoteRadio, FancyRemoteTV… Use when two dimensions both grow.",
      code:
`class Device:
    def on(self): ...
class TV(Device):
    def on(self): return "tv on"
class Remote:
    def __init__(self, device): self.device = device
    def power(self): return self.device.on()`,
      p: [
        ["GFG", "https://www.geeksforgeeks.org/bridge-method-python-design-patterns/", "Bridge — Python", "M"],
      ]},
    { n: "Proxy",
      note: "<b>Stand-in that controls access</b> to a real object: lazy load, cache, auth, rate-limit, remote stub. Same interface as the real subject. Cache proxy ≈ memoize; protection proxy ≈ ACL.",
      code:
`class SlowImage:
    def show(self): return "pixels"      # expensive
class ImageProxy:
    def __init__(self): self.real = None
    def show(self):
        if self.real is None: self.real = SlowImage()  # lazy
        return self.real.show()`,
      p: [
        [981, "time-based-key-value-store", "Time Based Key-Value Store", "M"],
        ["GFG", "https://www.geeksforgeeks.org/proxy-method-python-design-patterns/", "Proxy — Python", "M"],
      ]},
    { n: "Flyweight",
      note: "<b>Share intrinsic (unchanging) state across many objects; keep extrinsic state outside.</b> Character glyphs in an editor: one <code>Glyph('A', font)</code> shared; position is extrinsic. Don't use it until memory actually hurts.",
      code:
`class GlyphFactory:
    def __init__(self): self._g = {}
    def get(self, ch, font):
        self._g.setdefault((ch, font), Glyph(ch, font))
        return self._g[(ch, font)]
# thousands of 'e's on a page share one Glyph`,
      p: [
        [208, "implement-trie-prefix-tree", "Implement Trie (shared prefixes)", "M"],
        ["GFG", "https://www.geeksforgeeks.org/flyweight-design-pattern/", "Flyweight", "M"],
      ]},
  ]},

  /* ===================== BEHAVIORAL ===================== */
  { n: "Behavioral Patterns", h: "How objects talk. Strategy / Observer / State win most LLD interviews. Learn the rest so you can name them.", c: [
    { n: "Strategy",
      note: "<b>Swap an algorithm at runtime.</b> Pricing (hourly / flat / surge), sort, payment, elevator dispatch. Smell: growing <code>if mode ==</code>. Inject a strategy object.",
      code:
`class Pricing:
    def fee(self, hours): ...
class Hourly:
    def fee(self, hours): return 10 * hours
class Surge:
    def fee(self, hours): return 10 * hours * 1.5
class Lot:
    def __init__(self, pricing): self.pricing = pricing
    def bill(self, hours): return self.pricing.fee(hours)`,
      p: [
        [528, "random-pick-with-weight", "Random Pick with Weight", "M"],
        ["GFG", "https://www.geeksforgeeks.org/system-design/designing-parking-lot-garage-system-system-design/", "Parking Lot (pricing strategy)", "M"],
        ["EDU", "https://www.educative.io/blog/frequently-asked-design-patterns-in-low-level-design-interviews", "Strategy in LLD interviews", "M"],
      ]},
    { n: "Observer",
      note: "<b>One-to-many: subject notifies subscribers when state changes.</b> News feed, stock ticker, UI listeners, logging side-effects. Subject holds a list; <code>subscribe</code> / <code>notify</code>. Watch memory leaks (unsubscribe).",
      code:
`class Event:
    def __init__(self): self._subs = []
    def on(self, fn): self._subs.append(fn)
    def emit(self, *a):
        for fn in self._subs: fn(*a)
bus = Event()
bus.on(lambda m: print("log", m))
bus.emit("order placed")`,
      p: [
        [355, "design-twitter", "Design Twitter", "M"],
        ["GFG", "https://www.geeksforgeeks.org/observer-method-python-design-patterns/", "Observer — Python", "M"],
      ]},
    { n: "Iterator",
      note: "<b>Walk a collection without exposing its guts.</b> Python: <code>__iter__</code> / <code>__next__</code>, or a generator. BST inorder iterator, peeking iterator, nested-list flatten.",
      code:
`class Counter:
    def __init__(self, n): self.n, self.i = n, 0
    def __iter__(self): return self
    def __next__(self):
        if self.i >= self.n: raise StopIteration
        self.i += 1; return self.i
list(Counter(3))  # [1, 2, 3]`,
      p: [
        [173, "binary-search-tree-iterator", "BST Iterator", "M"],
        [284, "peeking-iterator", "Peeking Iterator", "M"],
        [341, "flatten-nested-list-iterator", "Flatten Nested List Iterator", "M"],
        [900, "rle-iterator", "RLE Iterator", "M"],
      ]},
    { n: "Command",
      note: "<b>Turn a request into an object</b> — queue it, undo it, log it. <code>execute()</code> / <code>undo()</code>. Text editor, remote control, job queue. Browser history is a command log of visits.",
      code:
`class Cmd:
    def execute(self): ...
    def undo(self): ...
class Insert:
    def __init__(self, buf, i, s): self.buf, self.i, self.s = buf, i, s
    def execute(self): self.buf.insert(self.i, self.s)
    def undo(self): del self.buf[self.i:self.i+len(self.s)]`,
      p: [
        [1472, "design-browser-history", "Design Browser History", "M"],
        [2296, "design-a-text-editor", "Design a Text Editor", "H"],
        ["GFG", "https://www.geeksforgeeks.org/command-method-python-design-patterns/", "Command — Python", "M"],
      ]},
    { n: "Mediator",
      note: "<b>Objects talk through a hub, not to each other.</b> Chat room, air-traffic control, UI dialog (buttons don't know each other). Reduces N² couplings. Don't let the mediator become a god object.",
      code:
`class Chat:
    def __init__(self): self.users = []
    def join(self, u): self.users.append(u)
    def send(self, src, msg):
        for u in self.users:
            if u is not src: u.recv(src.name, msg)`,
      p: [
        ["GFG", "https://www.geeksforgeeks.org/mediator-method-python-design-patterns/", "Mediator — Python", "M"],
      ]},
    { n: "State",
      note: "<b>Behavior depends on internal state; each state is a class.</b> Vending: Idle → HasMoney → Dispensing. Elevator: Idle/Moving/Maintenance. Smell: huge switch on <code>self.status</code>. State objects hold the transitions.",
      code:
`class Machine:
    def __init__(self): self.state = Idle(self)
    def insert(self): self.state.insert()
    def set(self, s): self.state = s
class Idle:
    def __init__(self, m): self.m = m
    def insert(self): self.m.set(HasCoin(self.m))
class HasCoin:
    def __init__(self, m): self.m = m
    def insert(self): print("already has coin")`,
      p: [
        [353, "design-snake-game", "Design Snake Game", "M"],
        ["GFG", "https://www.geeksforgeeks.org/system-design/vending-machine-low-level-design/", "Vending Machine LLD", "M"],
        ["GFG", "https://www.geeksforgeeks.org/state-method-python-design-patterns/", "State — Python", "M"],
      ]},
    { n: "Template Method",
      note: "<b>Algorithm skeleton in a base class; subclasses fill in steps.</b> <code>def brew(): boil(); add(); pour()</code> — Tea vs Coffee override <code>add()</code>. Use when the flow is stable and a few steps vary. Don't confuse with Strategy (whole algorithm swapped, no inheritance required).",
      code:
`class Caffeine:
    def make(self):
        self.boil(); self.brew(); self.pour()
    def boil(self): ...
    def brew(self): ...
    def pour(self): ...
class Tea(Caffeine):
    def brew(self): print("steep tea")`,
      p: [
        ["GFG", "https://www.geeksforgeeks.org/template-method-python-design-patterns/", "Template Method — Python", "M"],
      ]},
    { n: "Chain of Responsibility",
      note: "<b>Pass a request along a chain until someone handles it.</b> Logging levels, HTTP middleware, support tickets (L1→L2→L3), approval workflows. Each handler knows the next. Order matters.",
      code:
`class Handler:
    def __init__(self, nxt=None): self.nxt = nxt
    def handle(self, req):
        if self.nxt: return self.nxt.handle(req)
class Auth(Handler):
    def handle(self, req):
        if not req.get("user"): return "401"
        return super().handle(req)
pipe = Auth(Handler())`,
      p: [
        ["GFG", "https://www.geeksforgeeks.org/chain-of-responsibility-python-design-patterns/", "Chain of Responsibility", "M"],
      ]},
    { n: "Visitor",
      note: "<b>Add operations to a class family without editing the classes.</b> Double dispatch: <code>node.accept(visitor)</code> → <code>visitor.visit_x(node)</code>. Compilers (AST pretty-print / type-check / emit). Heavy; skip unless the structure is stable and operations keep growing.",
      code:
`class Node:
    def accept(self, v): ...
class Lit(Node):
    def accept(self, v): return v.visit_lit(self)
class Printer:
    def visit_lit(self, n): return str(n.val)`,
      p: [
        ["GFG", "https://www.geeksforgeeks.org/visitor-method-python-design-patterns/", "Visitor — Python", "M"],
      ]},
    { n: "Memento",
      note: "<b>Snapshot internal state so you can restore later</b> without exposing fields. Undo/redo, snapshots, save-game. Caretaker stores mementos; originator creates/restores. LC Snapshot Array is this with versioned indexes.",
      code:
`class Editor:
    def __init__(self): self.text = ""
    def save(self): return self.text          # memento
    def restore(self, snap): self.text = snap
ed = Editor(); ed.text = "hi"; snap = ed.save()
ed.text = "bye"; ed.restore(snap)  # 'hi'`,
      p: [
        [1146, "snapshot-array", "Snapshot Array", "M"],
        [1472, "design-browser-history", "Design Browser History", "M"],
        ["GFG", "https://www.geeksforgeeks.org/memento-method-python-design-patterns/", "Memento — Python", "M"],
      ]},
  ]},

  /* ===================== MACHINE CODING ===================== */
  { n: "Machine Coding", h: "Classic LLD prompts. Pick entities, one pattern that earns its keep, then code the happy path. From the usual LLD topic lists (Parking Lot, Elevator, Design-tagged LC).", c: [
    { n: "Parking Lot",
      note: "<b>Entities:</b> Lot, Floor, Spot (compact/regular/large), Vehicle (bike/car/truck), Ticket, PricingStrategy.<br><b>APIs:</b> <code>park(vehicle) → ticket</code>, <code>unpark(ticket) → fee</code>, <code>available(floor, type)</code>.<br><b>Patterns:</b> Strategy (pricing), Factory (vehicle), Singleton optional (lot). Thread-safe spot assignment. LC 1603 is the toy version (counts only).",
      p: [
        [1603, "design-parking-system", "Design Parking System", "E"],
        ["GFG", "https://www.geeksforgeeks.org/system-design/designing-parking-lot-garage-system-system-design/", "Design Parking Lot", "M"],
      ]},
    { n: "Elevator",
      note: "<b>Entities:</b> ElevatorCar (state: idle/up/down), FloorPanel, InternalPanel, Dispatcher.<br><b>APIs:</b> <code>call(floor, dir)</code>, <code>select(floor)</code> inside car, <code>step()</code> simulation tick.<br><b>Patterns:</b> State (car motion), Strategy (dispatch: nearest / SCAN / LOOK). Don't overbuild 3 cars × 15 floors unless asked.",
      p: [
        ["GFG", "https://www.geeksforgeeks.org/system-design/elevator-system-low-level-design-lld/", "Elevator System LLD", "H"],
      ]},
    { n: "Vending Machine",
      note: "<b>State machine:</b> Idle → HasMoney → Select → Dispense → Change. Inventory + Price catalog. Reject if sold out / insufficient cash.<br><b>Patterns:</b> State (required), maybe Command for buttons.",
      p: [
        ["GFG", "https://www.geeksforgeeks.org/system-design/vending-machine-low-level-design/", "Vending Machine LLD", "M"],
      ]},
    { n: "Splitwise",
      note: "<b>Entities:</b> User, Group, Expense (equal / exact / percent), Balance sheet.<br><b>Simplify debts:</b> min-cash-flow with two heaps (max creditor / max debtor).<br>APIs: addExpense, settle, getBalances. Keep money in integer cents.",
      p: [
        ["GFG", "https://www.geeksforgeeks.org/system-design/system-design-of-backend-for-expense-sharing-apps-like-splitwise/", "Splitwise backend / LLD", "H"],
      ]},
    { n: "Games — Tic-Tac-Toe, Snake, Chess, Snake & Ladder",
      note: "<b>Tic-Tac-Toe:</b> Board 3×3, win-check O(1) with row/col/diag counters (LC 348).<br><b>Snake:</b> deque body, food, hit-self / hit-wall (LC 353).<br><b>Snake & Ladder:</b> board as map of jumps, dice Strategy, player queue.<br><b>Chess:</b> Piece hierarchy with <code>valid_moves(board)</code> — polymorphism.",
      p: [
        [348, "design-tic-tac-toe", "Design Tic-Tac-Toe", "M"],
        [353, "design-snake-game", "Design Snake Game", "M"],
        ["GFG", "https://www.geeksforgeeks.org/design-snake-and-ladder-game/", "Design Snake and Ladder", "M"],
      ]},
    { n: "Library / BookMyShow / ATM / Rate limiter",
      note: "<b>Library:</b> Book, Copy, Member, Loan; search + due dates.<br><b>BookMyShow:</b> Movie, Show, Seat (State: free/locked/booked), Booking; lock seats with TTL.<br><b>ATM:</b> Card, Account, Session, Cash dispenser; State for PIN → menu → withdraw.<br><b>Rate limiter:</b> token bucket / sliding window (LC 362 Hit Counter, 359 Logger).",
      p: [
        [359, "logger-rate-limiter", "Logger Rate Limiter", "E"],
        [362, "design-hit-counter", "Design Hit Counter", "M"],
        [933, "number-of-recent-calls", "Number of Recent Calls", "E"],
        ["GFG", "https://www.geeksforgeeks.org/system-design/design-bookmyshow-movie-ticket-booking-system/", "BookMyShow", "H"],
      ]},
  ]},

  /* ===================== LEETCODE DESIGN ===================== */
  { n: "LeetCode Design", h: "From the Design tag: implement a data structure with tight time bounds. Same muscle as LLD — pick the backing structure, then wrap a clean API.",
    p: [
      ["LIST", "https://leetcode.com/problem-list/design/", "Full Design problem list", "M"],
    ],
    c: [
    { n: "Caches",
      note: "<b>LRU:</b> HashMap + doubly linked list, O(1) get/put. Dummy head/tail. Move-to-front on access; evict tail.<br><b>LFU:</b> freq map + LRU among same freq. <b>Allocator:</b> find-fit free blocks.",
      p: [
        [146, "lru-cache", "LRU Cache", "M"],
        [460, "lfu-cache", "LFU Cache", "H"],
        [432, "all-oone-data-structure", "All O`one Data Structure", "H"],
        [895, "maximum-frequency-stack", "Maximum Frequency Stack", "H"],
        [2502, "design-memory-allocator", "Design Memory Allocator", "M"],
      ]},
    { n: "Stacks, queues, lists",
      note: "Min-stack = two stacks (or store pairs). Queue via two stacks. Circular buffer for bounded queue. Front-middle-back = deque + index care.",
      p: [
        [155, "min-stack", "Min Stack", "M"],
        [232, "implement-queue-using-stacks", "Queue using Stacks", "E"],
        [225, "implement-stack-using-queues", "Stack using Queues", "E"],
        [622, "design-circular-queue", "Design Circular Queue", "M"],
        [641, "design-circular-deque", "Design Circular Deque", "M"],
        [707, "design-linked-list", "Design Linked List", "M"],
        [1381, "design-a-stack-with-increment-operation", "Stack with Increment", "M"],
        [1670, "design-front-middle-back-queue", "Front Middle Back Queue", "M"],
        [1352, "product-of-the-last-k-numbers", "Product of the Last K Numbers", "M"],
      ]},
    { n: "Hash maps & sets",
      note: "Design HashMap/Set = array of buckets + chaining. RandomizedSet = list + index map for O(1) insert/delete/getRandom (swap-with-last).",
      p: [
        [705, "design-hashset", "Design HashSet", "E"],
        [706, "design-hashmap", "Design HashMap", "E"],
        [380, "insert-delete-getrandom-o1", "Insert Delete GetRandom O(1)", "M"],
        [381, "insert-delete-getrandom-o1-duplicates-allowed", "GetRandom with duplicates", "H"],
        [380, "insert-delete-getrandom-o1", "Insert Delete GetRandom O(1)", "M"],
      ]},
    { n: "Iterators & streams",
      note: "Expose <code>next</code> / <code>hasNext</code> over a hidden structure. Peeking = buffer one. Nested list = stack of iterators. RLE = leftover count.",
      p: [
        [173, "binary-search-tree-iterator", "BST Iterator", "M"],
        [284, "peeking-iterator", "Peeking Iterator", "M"],
        [341, "flatten-nested-list-iterator", "Flatten Nested List Iterator", "M"],
        [900, "rle-iterator", "RLE Iterator", "M"],
        [1656, "design-an-ordered-stream", "Design an Ordered Stream", "E"],
        [1429, "first-unique-number", "First Unique Number", "M"],
      ]},
    { n: "Time series & windows",
      note: "Hit counter / recent calls = queue of timestamps, pop stale. Moving average = deque of last k. Time-based KV = map of key → timeline, binary search. Snapshot array = versioned maps.",
      p: [
        [362, "design-hit-counter", "Design Hit Counter", "M"],
        [933, "number-of-recent-calls", "Number of Recent Calls", "E"],
        [346, "moving-average-from-data-stream", "Moving Average from Data Stream", "E"],
        [981, "time-based-key-value-store", "Time Based Key-Value Store", "M"],
        [1146, "snapshot-array", "Snapshot Array", "M"],
        [359, "logger-rate-limiter", "Logger Rate Limiter", "E"],
        [295, "find-median-from-data-stream", "Find Median from Data Stream", "H"],
      ]},
    { n: "Tries, files, search",
      note: "Trie = map of children + end flag. Add-and-search-words adds <code>.</code> wildcard DFS. Autocomplete = trie + heap of hot sentences. File system = nested maps (Composite).",
      p: [
        [208, "implement-trie-prefix-tree", "Implement Trie", "M"],
        [211, "design-add-and-search-words-data-structure", "Add and Search Words", "M"],
        [642, "design-search-autocomplete-system", "Design Search Autocomplete", "H"],
        [588, "design-in-memory-file-system", "In-Memory File System", "H"],
      ]},
    { n: "Feeds, maps, products",
      note: "Twitter: user → tweets deque + follow graph; news feed = merge k sorted (heap). Underground: check-in map, avg = total/count. Food ratings: cuisine → heap. Browser history: two stacks / list + cursor.",
      p: [
        [355, "design-twitter", "Design Twitter", "M"],
        [1396, "design-underground-system", "Design Underground System", "M"],
        [2353, "design-a-food-rating-system", "Design a Food Rating System", "M"],
        [1472, "design-browser-history", "Design Browser History", "M"],
        [1797, "design-authentication-manager", "Design Authentication Manager", "M"],
        [2043, "simple-bank-system", "Simple Bank System", "M"],
      ]},
    { n: "Random, range, games",
      note: "Random pick with weight = prefix sums + bisect. Shuffle = Fisher–Yates. Range sum = prefix (immutable) or Fenwick/seg-tree (mutable). Games: see Machine Coding.",
      p: [
        [528, "random-pick-with-weight", "Random Pick with Weight", "M"],
        [384, "shuffle-an-array", "Shuffle an Array", "M"],
        [303, "range-sum-query-immutable", "Range Sum Query Immutable", "E"],
        [304, "range-sum-query-2d-immutable", "Range Sum Query 2D", "M"],
        [307, "range-sum-query-mutable", "Range Sum Query Mutable", "M"],
        [348, "design-tic-tac-toe", "Design Tic-Tac-Toe", "M"],
        [353, "design-snake-game", "Design Snake Game", "M"],
        [2296, "design-a-text-editor", "Design a Text Editor", "H"],
      ]},
  ]},

  /* ===================== PUT IT TOGETHER ===================== */
  { n: "Put it together", h: "One notification service using OOP + SOLID + many patterns. In a real interview you'd pick 2 patterns, not 9 — this is a map, not a template to dump.", c: [
    { n: "What maps to what",
      note: "<b>Encapsulation</b> — logger hides the log list.<br><b>Inheritance / Polymorphism / Abstraction</b> — <code>Email</code>/<code>SMS</code> override <code>Notification.send</code>.<br><b>SRP</b> — logger logs, factory creates, facade orchestrates.<br><b>OCP</b> — new <code>PushNotification</code> without editing facade (extend factory).<br><b>LSP</b> — any <code>Notification</code> works in <code>send</code>.<br><b>ISP</b> — <code>FormatStrategy</code> is only <code>format()</code>.<br><b>DIP</b> — facade depends on <code>Notification</code>, not <code>Email</code>.<br><b>Singleton</b> logger · <b>Factory</b> create · <b>Adapter</b> legacy · <b>Strategy</b> HTML/upper · <b>Decorator</b> wrap format · <b>Command</b> send · <b>Observer</b> audit · <b>Facade</b> one API." },
    { n: "Notification system",
      code:
`from abc import ABC, abstractmethod
import time

class NotificationLogger:
    _instance = None
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance.log_file = []
        return cls._instance
    def log(self, message):
        self.log_file.append(f"{time.ctime()}: {message}")
        print(f"Log: {message}")

class NotificationObserver:
    def update(self, notification_type, message):
        print(f"Observer: {notification_type} → {message}")

class Notification(ABC):
    @abstractmethod
    def send(self, message): ...

class EmailNotification(Notification):
    def send(self, message): return f"Sending Email: {message}"

class SMSNotification(Notification):
    def send(self, message): return f"Sending SMS: {message}"

class LegacyNotificationSystem:
    def send_notification(self, msg): return f"Legacy System: {msg}"

class LegacyNotificationAdapter(Notification):
    def __init__(self, legacy_system): self.legacy_system = legacy_system
    def send(self, message): return self.legacy_system.send_notification(message)

class FormatStrategy(ABC):
    @abstractmethod
    def format(self, message): ...

class HTMLFormatStrategy(FormatStrategy):
    def format(self, message): return f"<p>{message}</p>"

class UppercaseFormatStrategy(FormatStrategy):
    def format(self, message): return message.upper()

class NotificationDecorator(Notification):
    def __init__(self, notification, format_strategy):
        self.notification, self.format_strategy = notification, format_strategy
    def send(self, message):
        return self.notification.send(self.format_strategy.format(message))

class NotificationFactory:
    @staticmethod
    def create_notification(notification_type):
        if notification_type == "email": return EmailNotification()
        if notification_type == "sms": return SMSNotification()
        if notification_type == "legacy":
            return LegacyNotificationAdapter(LegacyNotificationSystem())
        raise ValueError("Unknown notification type")

class SendNotificationCommand:
    def __init__(self, notification, message):
        self.notification, self.message = notification, message
    def execute(self): return self.notification.send(self.message)

class NotificationFacade:
    def __init__(self):
        self.logger, self.factory, self.observers = NotificationLogger(), NotificationFactory(), []
    def add_observer(self, observer): self.observers.append(observer)
    def send_notification(self, notification_type, message, format_type=None):
        n = self.factory.create_notification(notification_type)
        if format_type == "html": n = NotificationDecorator(n, HTMLFormatStrategy())
        elif format_type == "uppercase": n = NotificationDecorator(n, UppercaseFormatStrategy())
        result = SendNotificationCommand(n, message).execute()
        self.logger.log(result)
        for ob in self.observers: ob.update(notification_type, message)
        return result

if __name__ == "__main__":
    f = NotificationFacade(); f.add_observer(NotificationObserver())
    print(f.send_notification("email", "Hello, World!", "html"))
    print(f.send_notification("sms", "Test message", "uppercase"))
    print(f.send_notification("legacy", "Legacy test"))`,
      p: [
        [355, "design-twitter", "Design Twitter (observer / feed)", "M"],
        [359, "logger-rate-limiter", "Logger Rate Limiter", "E"],
        ["GFG", "https://www.geeksforgeeks.org/python-design-patterns/", "Python design patterns hub", "M"],
      ]},
  ]},
];
