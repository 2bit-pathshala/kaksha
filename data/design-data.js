/* Design Lab, worked examples.

   Each project is grown stage by stage. A stage may only add a box if it can
   name the pressure that made the previous stage fail, and every box carries
   its own reasoning, the alternatives that lost, what it costs and how it
   breaks. That is the whole idea: the diagram is the answer, the reasoning is
   the interview.

   Project:
     { id, kind:"hld"|"lld", n, sub, tags:[], one,
       brief: { why, functional:[html], out:[str], nfr:[[prop,target,why]],
                numbers:[[what,answer,how]], numbersNote },
       stagesIntro,
       stages: [ { t, pressure, say, breaks?,
                   nodes:[{id,l,s?,col,row,r}], edges:[{a,b,l?,async?,bend?}],
                   add:[id] } ],
       boxesIntro,
       boxes: [ {id,n,r,job,why,forced,alts:[[name,whyNot]],pros:[],cons:[],cost,fails,say?} ],
       patterns?: [ {n,used,what,varies,without,cost} ],      // LLD only
       flowsIntro, flows:[ {n,note?,steps:[[html, "sync"|"async"|null]]} ],
       api?: [[call,returns,decision]], apiNote?,
       schema?: {n,note,code?,lang?},
       deep?: [{n,note,code?,lang?}],
       tradeoffsIntro, tradeoffs:[{a:[n,d],b:[n,d],pick:"a"|"b",flip}],
       next:[html], p:[[src,href,title,diff]],
       hi?: { one, brief:{why,functional:[html],out:[str],nfr:[[prop,target,why]],
                          numbers:[[what,answer,how]],numbersNote},
              stagesIntro, stages:[{t,pressure,say,breaks?}],
              boxesIntro, boxes:[{job,why,forced,alts:[[name,whyNot]],pros:[],cons:[],cost,fails,say?}],
              patternsIntro?, patterns?:[{what,varies,without,cost}],
              flowsIntro, flows:[{n,note?,steps:[[html]]}],
              apiNote?, api?:[[call,returns,decision]], schema?:{n,note},
              deep?:[{n,note}],
              tradeoffsIntro, tradeoffs:[{a:[n,d],b:[n,d],flip}], next:[html] } }

   Roles paint the box: client, edge, svc, store, cache, queue, work, ext.

   `hi` is the whole page again in Hinglish, shown by the reading-language
   switch in the header (shared with the concept pages, same "ms-read" key).
   It mirrors the English structure positionally: `stages[i]` is the Hinglish
   for `stages[i]`, `boxes[i]` for `boxes[i]`, and so on, same index, same
   array length. Node labels (`l`, `s`), ids, roles, numbers and the diagrams
   themselves are never translated, only the prose around them. Anything
   missing falls back to English, so a project can be translated one field at
   a time without ever showing a gap.
*/

const DESIGN = [

/* ==========================================================================
   1. URL SHORTENER
   ========================================================================== */
{
  id: "bitly", kind: "hld", n: "URL shortener", sub: "Bitly, TinyURL",
  tags: ["read heavy", "100 to 1", "no joins", "the standard opener"],
  one: "Every decision here falls out of three facts you can establish in ninety seconds: reads beat writes about 100 to 1, one record is under 500 bytes, and no query ever needs a second table. State those, and the rest of the round is you explaining consequences.",

  brief: {
    why: "This problem looks trivial and is not, which is why it opens so many interviews. The failure mode is drawing Kafka in minute two. The other failure mode is drawing a box labelled <b>Redis</b> without being able to say what makes it stale. Both are avoidable by doing the boring thing first: pin down what the system must do, what it is allowed to get wrong, and roughly how big the numbers are.",
    functional: [
      "<b>Shorten.</b> POST a long URL, get a short code back. Optionally a custom alias, optionally an expiry.",
      "<b>Redirect.</b> GET the short code, receive an HTTP redirect to the original. This single endpoint <i>is</i> the product. If it is down, you are down.",
      "<b>Count.</b> Whoever created the link can see roughly how many times it was opened. <i>Roughly</i> is doing a lot of work in that sentence, and it is deliberate."
    ],
    out: ["user accounts and billing", "link preview scraping", "malware and phishing scanning", "per click geography dashboards", "editing a link after it exists"],
    nfr: [
      ["Redirect latency", "p99 under 50 ms", "A redirect is pure overhead bolted onto somebody else's page load. Nobody thanks you for it and everybody notices it. This number, not the traffic, is what forces a cache instead of a bigger database."],
      ["Redirect availability", "99.99%", "Roughly four minutes of downtime a month. Short links end up in printed posters and eight year old tweets, so an outage breaks content you no longer control and cannot fix."],
      ["Create availability", "99.9%", "Deliberately one whole nine lower. If shortening is down for a minute, a handful of people press the button again. This asymmetry is the entire reason the two paths become separate services later."],
      ["Uniqueness", "one code, one URL, forever", "Handing out a code twice sends a stranger to the wrong site, which is indistinguishable from an attack. This is the one place in the design where strong consistency is not negotiable."],
      ["Click counts", "eventually right, minutes late", "Written down as a weak requirement on purpose. It is what buys you the right to keep counting off the redirect path entirely."]
    ],
    numbers: [
      ["New links", "100M per month", "Generous for a public shortener. If you are handed no numbers, say the number you are assuming out loud and design to that. An interviewer cannot argue with an assumption they heard you make."],
      ["Write rate", "about 40 per second, peak 120", "100M divided by the 2.6M seconds in a month, times about 3 for the daily peak. This is a rounding error. One database node will not notice it."],
      ["Read rate", "about 4,000 per second, peak 12,000", "The 100 to 1 ratio applied to the write rate. This is the number the entire design serves."],
      ["Storage after 5 years", "about 3 TB", "6 billion rows at roughly 500 bytes each. Large enough that one disk gets uncomfortable, small enough that ten machines is the whole answer."],
      ["Hot working set", "about 10 GB", "Clicks follow a Zipf curve: a couple of percent of links take almost all the traffic. 20 million hot rows at 500 bytes fits in one cache node's memory, with room to spare."],
      ["Code length", "7 base62 characters", "62 to the 7th is 3.5 trillion. Five years of links uses 0.17% of it, so random generation almost never collides. Six characters gives 57 billion, a 10% fill, and a collision rate you would have to defend."],
      ["Egress", "about 6 MB per second", "A redirect response is a header, not a page. Worth saying out loud because it kills the reflex to add a CDN for bandwidth. The only reason to go to the edge here is latency."]
    ],
    numbersNote: "Two of these do all the work. <b>100 to 1</b> says cache. <b>3 TB</b> says shard one day, not today. And notice what is missing: nothing in this table justifies a message queue, right up until clicks arrive in stage 5."
  },

  stagesIntro: "Six stages. Stage 0 is the version that genuinely works, for about a day. Every stage after it exists because one specific thing broke, and the box that arrives is the cheapest repair for that specific thing. If you can name the pressure, you have earned the box. If you cannot, take it off the whiteboard.",

  stages: [
    { t: "0. One process with a dictionary in it",
      pressure: "Nothing has gone wrong yet, and that is the point. An interviewer learns far more from watching you break a simple thing than from watching you draw a complicated one, and a design that starts complicated has no story to tell.",
      nodes: [
        { id: "client", l: "Browser", s: "GET /aX9k2Qm", col: 0, row: 0, r: "client" },
        { id: "redir", l: "One app process", s: "a map, and a counter", col: 1, row: 0, r: "svc" }
      ],
      edges: [{ a: "client", b: "redir", l: "302" }],
      add: ["client", "redir"],
      say: "Let me start with the smallest thing that satisfies both verbs, then break it. One process, a map from code to URL, a counter for new codes. At this size a redirect is a hash lookup in RAM, which is as fast as this product will ever be. Everything I add from here makes it slower and is going to have to justify itself.",
      breaks: "The process restarts. Every link ever created now returns 404, including the one printed on a conference badge last year. There is no version of this product in which the mapping lives only in memory." },

    { t: "1. Give the map a disk",
      pressure: "Durability. A short link is a promise you made about somebody else's content, so the mapping has to outlive the process, the deploy, and the machine.",
      nodes: [
        { id: "client", l: "Browser", s: "GET /aX9k2Qm", col: 0, row: 0, r: "client" },
        { id: "redir", l: "App process", s: "no state of its own", col: 1, row: 0, r: "svc" },
        { id: "db", l: "Key value store", s: "code is the primary key", col: 2, row: 0, r: "store" }
      ],
      edges: [{ a: "client", b: "redir", l: "302" }, { a: "redir", b: "db", l: "get" }],
      add: ["db"],
      say: "The mapping goes to a store. Look at the shape of the access before naming a product: a primary key lookup on a 7 character string, returning one small row, with no join, ever, and the row is immutable once written. That shape is why I am not going to burn five minutes on SQL versus NoSQL. What matters is that it is a point read.",
      breaks: "One app process and one database, so two single points of failure. The requirement said four nines on the redirect, and a single process cannot approach that, if only because somebody has to deploy it on a Tuesday." },

    { t: "2. More than one box, and the price of that",
      pressure: "Availability. Four nines means the redirect path has to survive a machine dying, and a deploy happening, without anybody noticing either.",
      nodes: [
        { id: "client", l: "Browser", s: "GET /aX9k2Qm", col: 0, row: 0, r: "client" },
        { id: "lb", l: "Load balancer", s: "TLS, health checks", col: 1, row: 0, r: "edge" },
        { id: "redir", l: "Redirect service", s: "stateless, N identical", col: 2, row: 0, r: "svc" },
        { id: "db", l: "Key value store", s: "primary plus replicas", col: 3, row: 0, r: "store" }
      ],
      edges: [{ a: "client", b: "lb" }, { a: "lb", b: "redir", l: "any box" }, { a: "redir", b: "db", l: "get" }],
      add: ["lb"],
      say: "Several identical redirect processes behind a load balancer. The price of that is statelessness: no sessions, no local counters, nothing in process memory that anybody needs to be correct. Any request may land on any box. I am paying that price on purpose, because it is what makes this tier scale by addition for the rest of the design.",
      breaks: "All 12,000 peak redirects per second are now a network round trip to the database for a 500 byte row. The database is good at that, which is the trap: it will keep doing it, slower and slower, and your p99 becomes a function of connection pools and disk seeks." },

    { t: "3. The cache, because of the one ratio",
      pressure: "100 to 1, with Zipf on top. Almost all reads are for a small set of codes, asked repeatedly, and the answer never changes. That is the textbook definition of something you should remember rather than recompute.",
      nodes: [
        { id: "client", l: "Browser", s: "GET /aX9k2Qm", col: 0, row: 0, r: "client" },
        { id: "lb", l: "Load balancer", s: "TLS, health checks", col: 1, row: 0, r: "edge" },
        { id: "redir", l: "Redirect service", s: "stateless, N identical", col: 2, row: 0, r: "svc" },
        { id: "cache", l: "Redis", s: "code to URL, LRU", col: 3, row: 0, r: "cache" },
        { id: "db", l: "Key value store", s: "the durable copy", col: 3, row: 1, r: "store" }
      ],
      edges: [
        { a: "client", b: "lb" }, { a: "lb", b: "redir" },
        { a: "redir", b: "cache", l: "hit, 99%" },
        { a: "redir", b: "db", l: "miss", bend: 0.75 }
      ],
      add: ["cache"],
      say: "Redis in front of the store, cache aside. On a miss the service reads the row and fills the cache; on a hit it never touches the database at all. Here is the luckiest fact about this product: a code to URL mapping is immutable once created, so there is no invalidation problem. The TTL exists to evict the cold tail, not for correctness. If I could not say that sentence, I would not be allowed to draw this box.",
      breaks: "The write path has not actually been designed. Where does the 7 character code come from, and what happens when two people claim the same custom alias in the same millisecond? That question is the interview." },

    { t: "4. Split the writes off, and say where the code comes from",
      pressure: "Reads and writes now want different machines. Reads want many cheap stateless boxes sitting next to a cache. Writes want a coordinated, collision free identifier and they touch the primary. On top of that their availability targets differ by a whole nine, and you should never give two things one SLA when you have written down two.",
      nodes: [
        { id: "client", l: "Browser or API client", col: 0, row: 0, r: "client" },
        { id: "lb", l: "Load balancer", s: "TLS, health checks", col: 1, row: 0, r: "edge" },
        { id: "redir", l: "Redirect service", s: "99% of traffic", col: 2, row: 0, r: "svc" },
        { id: "cache", l: "Redis", s: "code to URL, LRU", col: 3, row: 0, r: "cache" },
        { id: "shorten", l: "Shorten service", s: "1% of traffic", col: 2, row: 1, r: "svc" },
        { id: "db", l: "Key value store", s: "unique index on code", col: 3, row: 1, r: "store" },
        { id: "alloc", l: "ID range allocator", s: "hands out blocks of 1M", col: 2, row: 2, r: "store" }
      ],
      edges: [
        { a: "client", b: "lb" }, { a: "lb", b: "redir" },
        { a: "lb", b: "shorten", l: "POST /links", bend: 0.35 },
        { a: "redir", b: "cache", l: "hit" },
        { a: "redir", b: "db", l: "miss", bend: 0.75 },
        { a: "shorten", b: "db", l: "insert" },
        { a: "alloc", b: "shorten", l: "one block per hour" }
      ],
      add: ["shorten", "alloc"],
      say: "Two services instead of one, because they scale differently and fail differently. The shorten service takes a block of a million IDs from an allocator, base62 encodes them locally, and does not coordinate with anyone again until the block runs out. That converts unique ID generation from a per request distributed problem into an hourly one, which is the single highest leverage move in this design.",
      breaks: "Now the person who made the link wants to know how many people clicked it. The obvious implementation, incrementing a counter column on the redirect path, adds a write to every read, creates a scorching hot row behind every viral link, and welds the availability of your most important endpoint to your least important feature." },

    { t: "5. Count clicks without touching the redirect path",
      pressure: "Analytics is a feature with a weak correctness requirement, and you are about to attach it to your strongest availability requirement. Anything on the redirect path inherits the redirect path's SLA, so the counting has to leave that path immediately.",
      nodes: [
        { id: "client", l: "Browser or API client", col: 0, row: 0, r: "client" },
        { id: "lb", l: "Load balancer", s: "TLS, health checks", col: 1, row: 0, r: "edge" },
        { id: "redir", l: "Redirect service", s: "fire and forget", col: 2, row: 0, r: "svc" },
        { id: "stream", l: "Event stream", s: "Kafka, keyed by code", col: 3, row: 0, r: "queue" },
        { id: "agg", l: "Aggregator", s: "5 minute windows", col: 4, row: 0, r: "work" },
        { id: "olap", l: "Analytics store", s: "(code, hour) to count", col: 4, row: 1, r: "store" },
        { id: "cache", l: "Redis", s: "code to URL, LRU", col: 3, row: 1, r: "cache" },
        { id: "shorten", l: "Shorten service", s: "1% of traffic", col: 2, row: 1, r: "svc" },
        { id: "db", l: "Key value store", s: "the durable copy", col: 3, row: 2, r: "store" },
        { id: "alloc", l: "ID range allocator", s: "blocks of 1M", col: 2, row: 2, r: "store" }
      ],
      edges: [
        { a: "client", b: "lb" }, { a: "lb", b: "redir" },
        { a: "lb", b: "shorten", l: "POST /links", bend: 0.3 },
        { a: "redir", b: "cache", l: "hit", bend: 0.35 },
        { a: "redir", b: "db", l: "miss", bend: 0.65 },
        { a: "redir", b: "stream", l: "click", async: true },
        { a: "stream", b: "agg" },
        { a: "agg", b: "olap", l: "roll up" },
        { a: "shorten", b: "db", l: "insert", bend: 0.4 },
        { a: "alloc", b: "shorten" }
      ],
      add: ["stream", "agg", "olap"],
      say: "The redirect service fires one event and returns without waiting. If that event is dropped the redirect was still correct, which is precisely why the arrow is dashed and why I am comfortable at-most-once here. A stream absorbs the burst, an aggregator folds it into five minute buckets, and a column store answers the dashboard query. Approximate and minutes late, exactly as the requirement permitted." }
  ],

  boxesIntro: "Ten components. For each one: the pressure that created it, what lost the argument, what you pay, and how it fails at three in the morning. If you can only remember one column, remember the last one. Naming your own failure modes is the fastest way to sound like someone who has run a system rather than read about one.",

  boxes: [
    { id: "client", n: "The browser", r: "client",
      job: "Sends the request and follows whatever redirect comes back.",
      why: "It is on the diagram because it is a participant, not scenery. It caches redirects, it retries, and it is where the 301 versus 302 decision actually lands.",
      forced: "Nothing forced it. It is drawn because the first genuine trade-off in this system lives at this boundary, and it costs nothing to point at.",
      alts: [["Leaving the client off the diagram", "the common choice, and it silently costs you the 301 versus 302 conversation, which is the cheapest available way to show you think about consequences."]],
      pros: ["A 301 lets the browser skip your servers entirely on repeat visits: free latency, free capacity, no code."],
      cons: ["A 301 is cached hard, sometimes forever, so you can never revoke or repoint that link for that user again.", "Once the browser is caching the redirect, your click counts undercount by an amount you cannot measure or explain to a customer."],
      cost: "Zero infrastructure. One decision, made once, very hard to reverse.",
      fails: "You ship 301 for the latency win. Months later a shortened link points at a page that has become a phishing site, and you discover that half the internet has your redirect cached and you cannot take it back.",
      say: "302 by default. It costs a round trip per visit and it buys revocation and honest analytics. I would offer 301 only on links a customer explicitly marks permanent, and I would make them read the sentence about revocation first." },

    { id: "lb", n: "Load balancer", r: "edge",
      job: "One stable address for the world, spread across identical processes, with the dead ones removed automatically.",
      why: "The moment there is more than one redirect process, something has to decide which one gets the request, and something has to notice when one of them stops answering.",
      forced: "The 99.99% redirect target in stage 2. A single process cannot get near four nines, and the deploy alone would blow the budget.",
      alts: [["DNS round robin", "free and already there, but clients cache DNS for minutes and it has no idea whether a box is alive. Your failover time becomes somebody else's TTL."], ["Client side load balancing", "excellent inside a datacentre where you control the callers. Useless here, where the callers are every browser on earth."], ["An API gateway doing the same job", "the same box with more features and more latency. Worth it once you need auth, rate limiting and routing in one place; not worth it in stage 2."]],
      pros: ["Health checks turn a dead machine into a non event rather than an outage.", "Terminates TLS once so the services behind it stay plain and cheap.", "It is the natural place to hang rate limiting later, and a public redirect endpoint is a DDoS magnet."],
      cons: ["It is now in the path of every single request, so it is a component whose own availability you have to think about.", "Layer 7 balancing costs a millisecond or two and, more importantly, an operational surface."],
      cost: "A managed one is cheap and boring. The real cost is that it becomes the thing you must configure correctly for connection draining, or every deploy drops in flight requests.",
      fails: "Health checks are configured to hit a path that only checks the process is alive, not that it can reach Redis and the database. The box passes its check, serves 500s to real users, and stays in rotation because nothing asked it a question that mattered.",
      say: "Layer 7, TLS terminated here, health checks that actually touch the dependencies, and connection draining on deploy. I would put the rate limiter here too, because abusive traffic should die at the edge and not at the database." },

    { id: "redir", n: "Redirect service", r: "svc",
      job: "Turn seven characters into a Location header. This one endpoint is the product.",
      why: "It gets to be its own deployable because it has the strictest latency and availability targets in the system and by far the simplest logic. Small and boring is what keeps it fast, and it keeps the blast radius of everything else away from it.",
      forced: "Four nines on redirects in stage 2, then the split in stage 4, where a bad deploy of shortening or analytics code must not be able to take redirects down.",
      alts: [["One service handling both verbs", "simpler to operate and completely fine up to stage 3. It stops being fine when an incident in the write path takes the read path with it, which is a thing that happens on the worst possible day."], ["Serving redirects from an edge function or the CDN itself", "faster, cheaper, and what real shorteners do in production. Rejected here only because it hides the mechanism the interview is about. Say it out loud as the optimisation you would do next, and you get the credit without losing the explanation."]],
      pros: ["Stateless, so it scales by adding identical boxes and needs no failover story of its own.", "Its dependency list is two items long. That is a system you can reason about while half asleep.", "Deploys on its own cadence, so the risky code ships somewhere else."],
      cons: ["A second service is a second thing to monitor, deploy, and be paged about.", "Code shared with the shorten service now needs a library, or duplication, and both of those have a cost."],
      cost: "A few milliseconds of work per request at 12,000 peak requests per second. This is single digit machines and the cheapest tier in the design.",
      fails: "Redis fails over or is flushed after a deploy. Every request misses at the same instant and falls through to a database that was sized for one percent of the traffic. That is a cache stampede, and it is the outage this design is most likely to actually have.",
      say: "Stateless, two dependencies, and a hard timeout on the cache call so that a slow Redis degrades into a slower redirect rather than a queue of stuck threads." },

    { id: "cache", n: "Redis, the hot link cache", r: "cache",
      job: "Answer 99% of redirects out of memory so the database never sees them.",
      why: "Reads outnumber writes 100 to 1 and follow a Zipf distribution, so a small set of codes is asked for constantly and the answer for a given code never changes. Remembering it is close to free.",
      forced: "The p99 under 50 ms target in stage 3. The database can serve 12,000 point reads per second, but not while leaving you a latency budget, and not without a bill.",
      alts: [["More database read replicas", "works, and costs far more per read served. You are still paying for a network hop, a connection, a query parser and a disk cache to return a value you already knew."], ["A CDN or edge cache holding the redirect", "genuinely better for latency, and the thing to reach for at global scale. It moves the invalidation problem to somewhere you control less, which is fine here only because the mapping is immutable."], ["An in process LRU in each redirect box", "the fastest option and the one that quietly breaks statelessness. It is defensible as a second tier in front of Redis, and it is a mistake as the only tier: N boxes means N cold caches and N times the miss traffic on deploy."]],
      pros: ["Turns the database load from 12,000 reads per second into a few hundred.", "The mapping is immutable, so there is no invalidation logic to get wrong. This is the fact that makes the box safe.", "Losing the entire cache is a performance incident, not a correctness one."],
      cons: ["A whole extra system to run, size, monitor and fail over.", "Cold start after a restart is genuinely dangerous, because the miss path was never sized for full traffic.", "It hides database problems until the moment it stops hiding them."],
      cost: "About 10 GB for 20 million hot entries at 500 bytes. One node with a replica, comfortably.",
      fails: "A hot code expires at the same moment a thousand requests want it, they all miss, and a thousand identical queries hit the database at once. Fix with a per key lock so one caller fills and the rest wait, or jittered TTLs so keys do not expire in lockstep.",
      say: "Cache aside, key is the code, value is the URL, TTL of a day purely to evict the cold tail. Because the mapping is immutable there is nothing to invalidate, which is the only reason I am comfortable with a cache in the hot path of the most important endpoint in the system." },

    { id: "db", n: "Key value store", r: "store",
      job: "The durable record: code, long URL, owner, created_at, expires_at. The authority when the cache is empty or wrong.",
      why: "Something has to survive a restart, and something has to be able to say no when two people ask for the same custom alias.",
      forced: "Durability in stage 1, then the uniqueness requirement in stage 4. The unique index on code is what makes the alias race resolvable at all, rather than a thing you hope does not happen.",
      alts: [["Postgres or MySQL", "a completely defensible answer and what I would actually ship first. A unique index and a transaction come free, and 3 TB is within reach of one well tuned primary with replicas."], ["DynamoDB or Cassandra", "the right answer at ten times this scale. Partitioning is trivial because the code is the only key anyone ever queries by, and there is nothing to join."], ["Redis as the system of record", "tempting, since the working set fits in memory, and wrong. This is the copy that has to survive losing every cache node at once."]],
      pros: ["Point read on a primary key, which every store on earth is good at.", "No joins means sharding by code is mechanical whenever the row count demands it.", "Rows are immutable after insert, which removes a whole category of concurrency bug."],
      cons: ["It is the one component with real state, so it owns the failover, backup and migration stories all by itself.", "The analytics query pattern does not fit it at all, which is exactly why a column store turns up in stage 5."],
      cost: "About 3 TB after five years at roughly 500 bytes a row. Read load after the cache is a few hundred per second, write load under 200.",
      fails: "The primary dies mid write. Redirects keep working from cache and from replicas, while shortening returns 503 until a replica is promoted. That asymmetry is not an accident, it is what the two different availability targets bought you, and saying so out loud is worth more than the diagram.",
      say: "Postgres with the code as the primary key to start, because the write rate is trivial and I want the unique index. I would move to a key value store when the row count makes one primary uncomfortable, and not one day before." },

    { id: "shorten", n: "Shorten service", r: "svc",
      job: "Take a long URL, produce a code nobody else has, write one row, return it.",
      why: "It handles one percent of the traffic, has a lower availability target, and is the only place in the system that has to coordinate. All three of those are reasons to keep it away from the redirect path.",
      forced: "Stage 4. Two different availability targets in the requirements meant two different deployables, or one deployable that must be held to the stricter of the two for no benefit.",
      alts: [["Keeping both verbs in one service", "fine until it is not. The moment you deploy a change to alias validation and take the redirect path down with it, you will wish you had split it."], ["Doing the write straight from an edge function", "the write path needs a transaction and a unique index; the edge is the wrong place for both."]],
      pros: ["Its incidents cannot reach the redirect path.", "It can be scaled and rate limited on completely different rules, which matters because creation is where the abuse is.", "Slow is acceptable here. That freedom is worth a lot: it can do validation, normalisation and a synchronous unique check."],
      cons: ["A second deployable, with the duplication that implies.", "It owns the only genuinely hard piece of logic in the system, which is the alias race."],
      cost: "120 writes per second at peak. This is one small machine and a healthy sense of proportion.",
      fails: "A burst of automated link creation, which is what a shortener attracts, exhausts the ID block faster than the allocator expects. Handle it by fetching the next block at 20% remaining rather than at zero.",
      say: "Normalise the URL, check the custom alias against the unique index inside the transaction rather than with a read-then-write, and take the next id from the local block. The only network call that can block a create is the insert itself." },

    { id: "alloc", n: "ID range allocator", r: "store",
      job: "Hand each shorten process a block of a million integers that nobody else will ever get.",
      why: "Unique codes across many machines is a coordination problem, and coordination per request is expensive. Coordinating once per million requests is not.",
      forced: "Stage 4, the moment there was more than one shorten process. With one process a local counter is enough; with two, they will collide, and it will happen on the first day and be blamed on something else.",
      alts: [["Hash the URL and retry on collision", "the answer people reach for first. It needs a read before every write to detect the collision, which is a database round trip on the write path, and the retry rate climbs as the table fills. It also means the same URL shortens to the same code, which some products want and most do not."], ["Random 7 characters, insert, catch the unique violation", "genuinely good at this fill factor: 0.17% used means a collision is about one in six hundred, and the database is already enforcing uniqueness for you. Simpler than an allocator. I would happily defend either."], ["A Snowflake style ID with machine and timestamp bits", "correct and coordination free, but the ids are long and sequential in time, so base62 codes become guessable and long. You end up adding a scramble step to hide the sequence, which is complexity you did not need."], ["A single auto increment column on the primary", "correct and it puts a synchronous write to one machine in front of every create. It works at 120 writes per second and it is the thing that stops working first."]],
      pros: ["One coordination round trip per million ids instead of one per id.", "Codes are dense, so seven characters is genuinely enough.", "The allocator can be almost anything: a row with an integer in it, updated in a transaction."],
      cons: ["Blocks are lost when a process dies with ids unused, so the sequence has holes. That is fine, and you should say it is fine before someone asks.", "It is a component whose failure blocks all creation, so it needs to be boring and replicated.", "Sequential ids within a block leak roughly how many links you have made, if anyone cares to look."],
      cost: "One row and one transaction per process per hour. This is the cheapest box in the diagram by several orders of magnitude.",
      fails: "The allocator is unreachable and every shorten process burns through its block. Creation stops. Mitigate by keeping a second block in reserve and fetching early, so an allocator outage is measured in hours of headroom rather than seconds.",
      say: "Blocks of a million, fetched at 20% remaining, base62 encoded locally. If the interviewer prefers simplicity, random plus a unique index is a completely respectable answer at this fill factor, and I would say why rather than pretending only one option exists." },

    { id: "stream", n: "Event stream", r: "queue",
      job: "Absorb a click event from the redirect path and hold it until an aggregator is ready.",
      why: "Twelve thousand click events per second are useless individually and valuable in aggregate. A log lets a fast producer hand off to a slower consumer without either one having to know about the other.",
      forced: "Stage 5, and only stage 5. Note that nothing before this point needed a queue. Adding one earlier would have been decoration.",
      alts: [["Writing the click straight to the analytics store", "couples the availability of the redirect path to the availability of a dashboard. The wrong dependency direction for the most important endpoint you own."], ["Incrementing a counter in Redis", "actually a fine answer if all you need is a total. It stops working the moment somebody asks for clicks per hour, or per country, or wants to recompute after a bug."], ["Batching in the redirect process and flushing every few seconds", "cheaper, and it loses the last few seconds of events on every deploy and crash. Acceptable for counting, and a habit that will bite you when the same code is copied to something that matters."]],
      pros: ["The producer is fire and forget, so a slow or dead consumer cannot slow a redirect.", "Replayable: fix a bug in the aggregator and reprocess the window rather than losing the day.", "Partitioning by code puts all events for one link on one partition, which makes counting per link a local operation."],
      cons: ["An entire distributed system added to support your least important feature. That is the honest description and you should say it.", "Partitioning by code means a viral link creates a hot partition.", "Retention is a real cost and a real decision."],
      cost: "Roughly 100 bytes per event at 12,000 per second is about 1 MB per second, so 100 GB a day at retention of one day. Modest, and not free.",
      fails: "One link goes viral and its partition falls behind while every other partition is idle. Mitigate by keying on code plus a small random suffix and summing at the end, which is the standard trick for a hot key.",
      say: "At-most-once is the right delivery guarantee here, and I want to say that explicitly rather than reach for exactly-once out of habit. A dropped click event costs a number in a dashboard being slightly low. Exactly-once would cost coordination on the hottest path in the system." },

    { id: "agg", n: "Aggregator", r: "work",
      job: "Fold a firehose of individual clicks into counts per code per time bucket.",
      why: "Nobody ever queries a single click. Every question is a count over a window, so the useful work is collapsing millions of rows into thousands before anyone asks.",
      forced: "Stage 5. Storing raw clicks and running a count at query time would mean scanning billions of rows to answer a dashboard that loads on every page view.",
      alts: [["Querying raw events at read time", "flexible and slow, and it makes the dashboard's cost proportional to the link's popularity, which is exactly backwards."], ["Materialised views inside the analytics store", "a good answer if the store supports them well, and it moves this box inside another box rather than removing it."]],
      pros: ["Reduces the data by three or four orders of magnitude before it is stored.", "The window is a knob: five minutes for freshness, an hour for cost.", "Idempotent if the output is keyed by (code, bucket), so a replay overwrites rather than double counts."],
      cons: ["Windowing is where the fiddly bugs live: late events, clock skew, and what to do with an event that arrives after its window closed.", "It adds minutes of lag, which is only acceptable because the requirement said it was."],
      cost: "A handful of stream processing tasks. The work is a group by, which is cheap; the operational burden is checkpointing and restarts.",
      fails: "A deploy resets the consumer offset and the last hour is counted twice. This is why the output is keyed by (code, bucket) and written with an upsert rather than an increment: a replay then produces the same answer instead of doubling it.",
      say: "Five minute tumbling windows, output upserted on (code, bucket). Making the write idempotent is what lets me be relaxed about at-least-once delivery from the stream, and it costs nothing." },

    { id: "olap", n: "Analytics store", r: "store",
      job: "Answer questions like clicks per hour for this link over the last thirty days.",
      why: "The query shape is completely different from the redirect: a range scan over time for one key, aggregating as it goes. That is a column store's home ground and a key value store's worst case.",
      forced: "Stage 5, and it is a genuine second store rather than laziness. The main store is optimised for a point read of an immutable row; nothing about it suits a time range aggregation.",
      alts: [["Keeping the counts in the main database", "workable at this size, and it means analytics queries compete for the same connections and buffer pool as the redirect fallback path. You are letting a dashboard slow down the product."], ["Counters in Redis", "instant and durable only if you make it so, and it gives you one number rather than a history."], ["A full data warehouse", "correct for the company, oversized for the feature. Say it as where this goes next, not as where it starts."]],
      pros: ["Column layout means a thirty day scan reads one column, not whole rows.", "Aggregates compress extremely well, since most links have a count of zero for most hours.", "It is off the redirect path entirely, so it can be down and nobody loses a link."],
      cons: ["A third storage technology to run, back up and understand.", "Its consistency is eventual by construction, which you have to keep saying to product managers."],
      cost: "Thousands of rows per link per month instead of millions of events. Small enough that retention is a product decision, not an infrastructure one.",
      fails: "It falls behind, or falls over, and dashboards show stale numbers. Nothing about the product breaks. That is the entire reason it lives on this side of the dashed arrow.",
      say: "ClickHouse or similar, primary key (code, hour). If the interviewer wants exact billing numbers rather than a dashboard, I would add a nightly batch job over the raw stream as the source of truth and keep this as the fast approximate view." }
  ],

  flowsIntro: "Draw the boxes, then narrate two paths out loud. This is the part interviewers actually score, because it is where hand waving becomes visible. For each step, know whether the user is waiting.",

  flows: [
    { n: "The read path, a redirect",
      note: "This is 99% of the traffic and the path your SLA is written about. Four steps, and only one of them can be slow.",
      steps: [
        ["Browser sends <code>GET /aX9k2Qm</code>. The load balancer terminates TLS and picks any healthy redirect box.", "sync"],
        ["The service looks up <code>url:aX9k2Qm</code> in Redis. It hits about 99 times in 100 and the request is basically over.", "sync"],
        ["On a miss it reads the row from the store by primary key, writes it back into the cache, and continues. This path is sized for 1% of traffic, which is the risk the whole design carries.", "sync"],
        ["It returns <code>302 Location: https://...</code>. The user is now somebody else's problem, in under 50 ms.", "sync"],
        ["Only after the response is written does it emit a click event to the stream, without waiting for an acknowledgement. If this fails, the redirect was still correct.", "async"]
      ] },
    { n: "The write path, shortening",
      note: "1% of traffic, allowed to be a hundred times slower, and the only place anything has to be coordinated.",
      steps: [
        ["Client sends <code>POST /v1/links</code> with the long URL and, optionally, a custom alias.", "sync"],
        ["The shorten service normalises the URL and validates the scheme, so that two forms of the same address do not become two rows and a redirect loop.", "sync"],
        ["No alias: take the next integer from the local block and base62 encode it. No network call, no coordination, no collision, because nobody else has this block.", "sync"],
        ["Custom alias: insert it and let the unique index reject the loser. Do not read first and then write, because two requests can both read <i>free</i> and both then write.", "sync"],
        ["Insert the row. Do not write to the cache. The link is almost certainly not about to be clicked, and a cache full of links nobody wants is worse than an empty one.", "sync"],
        ["Return 201 with the short URL. If the block was under 20% remaining, fetch the next one now, off the request path.", "async"]
      ] },
    { n: "The counting path",
      note: "Everything here is allowed to be late, lossy and cheap, which is what makes it safe to attach to the busiest endpoint you own.",
      steps: [
        ["A click event, roughly 100 bytes, is produced to the stream partitioned by code.", "async"],
        ["The aggregator consumes the partition and keeps a running count per (code, five minute bucket) in memory.", "async"],
        ["At the end of each window it upserts one row per code into the analytics store. Upsert, not increment, so a replay is harmless.", "async"],
        ["A dashboard query reads a time range for one code and gets an answer in milliseconds, because it is reading thousands of pre aggregated rows rather than billions of events.", "sync"]
      ] }
  ],

  api: [
    ["POST /v1/links", "201 {short_url, code}", "Body carries the long URL, an optional alias and an optional expiry. Idempotency key header so a retry after a timeout does not mint a second code for the same intent."],
    ["GET /{code}", "302 Location", "Not under /v1/. The path is the product and every byte of it is user visible, so it does not get a version prefix or a namespace."],
    ["GET /v1/links/{code}/stats", "200 {buckets:[...]}", "Takes a time range and a granularity. Reads the analytics store, never the main store, so a heavy dashboard cannot slow a redirect."],
    ["DELETE /v1/links/{code}", "204", "Soft delete. The row stays, the redirect starts returning 410 Gone. Hard deleting frees a code that somebody else could then be given, which is the one thing the uniqueness requirement forbids."]
  ],
  apiNote: "Two details in that table are worth the ten seconds it takes to say them: the redirect endpoint is unversioned because it is user visible, and delete is soft because reusing a code would break the promise the whole system exists to keep.",

  schema: { n: "The one table that matters", lang: "text",
    note: "Three or four fields decide a design; the rest are decoration. Notice that <b>clicks</b> is not a column here. The moment it is, every redirect becomes a write.",
    code:
"links\n" +
"  code         char(7)      PRIMARY KEY      the only key anyone queries by\n" +
"  long_url     text         NOT NULL         normalised before insert\n" +
"  owner_id     bigint       nullable         nullable so anonymous links work\n" +
"  created_at   timestamptz  NOT NULL\n" +
"  expires_at   timestamptz  nullable         null means forever\n" +
"  deleted      boolean      DEFAULT false    soft delete, so the code stays taken\n" +
"\n" +
"  index: none beyond the primary key. There is no second query.\n" +
"  shard key: code, when the day comes. Nothing joins, so it is mechanical.\n" +
"\n" +
"click_counts        (in the analytics store, not here)\n" +
"  code         char(7)   \\  composite key, ordered by time so a range\n" +
"  bucket_hour  ts        /  scan for one link reads contiguous data\n" +
"  count        int64        written by upsert, never by increment" },

  deep: [
    { n: "Where the seven characters come from",
      note: "This is the question the problem actually exists to ask, and there are four defensible answers. <b>Hash the URL and truncate</b>: deterministic, so the same URL always gives the same code, and it needs a read before every write to check for collision. <b>Random and catch the unique violation</b>: at a 0.17% fill factor a collision happens about once in six hundred inserts, and the database detects it for you at no extra cost. <b>Counter plus base62</b>: dense and short, but a single global counter is a synchronous write to one machine on every create. <b>Blocks of ids handed out in advance</b>: the counter's density without the per request coordination.<br><br>The interview answer is to name the trade-off rather than the technology: uniqueness across many machines either costs coordination per request, or a retry loop, or a pre allocated range. Pick the third, and be able to explain why the first two are still reasonable.",
      code:
"base62(3_540_912)  ->  \"0eLc4\"        digits, then a-z, then A-Z\n" +
"\n" +
"local block held by one shorten process:\n" +
"    next = 4_000_000, end = 5_000_000\n" +
"    code = base62(next++)          no lock, no network, no collision\n" +
"    when next > end - 200_000:     fetch the next block in the background\n" +
"\n" +
"the allocator itself, once an hour per process:\n" +
"    UPDATE id_blocks SET last = last + 1000000 RETURNING last\n" +
"    one transaction, one row, and it is allowed to be slow" },

    { n: "The custom alias race, and why read-then-write loses",
      note: "Two people ask for <code>/launch</code> in the same millisecond. If the service reads to check whether the alias is free and then writes, both reads return <i>free</i>, both writes succeed if there is no constraint, and one person's link silently overwrites the other's. This is the classic check-then-act bug and it will happen in production long before it happens in your tests.<br><br>The fix is to let the database be the referee: put a unique index on <code>code</code>, attempt the insert, and treat the constraint violation as the answer rather than as an error. One request wins, the other gets a clean 409. No lock, no coordination, no window. If you need it across a sharded store where the index cannot be global, shard by the code itself so both requests land on the same shard, and the constraint is local again." },

    { n: "The cache stampede, which is the outage you will actually have",
      note: "Everything is healthy at 99% cache hit rate. Then Redis fails over, or a deploy flushes it, or a hot key expires while a thousand requests want it. Every one of those requests misses at the same instant and hits a database sized for one percent of the traffic. The database queues, timeouts fire, retries double the load, and now you have an outage caused by your recovery.<br><br>Three mitigations, cheapest first. <b>Jitter the TTL</b> so a million keys written in the same minute do not expire in the same minute. <b>Single flight</b>: the first miss on a key takes a short lock and fills the cache, everybody else waits on it rather than duplicating the query. <b>Warm the cache</b> before a new Redis takes traffic, from the top codes by recent clicks. The last one is the only defence against the failover case, and it is the case that actually happens." },

    { n: "Why there is no CDN in this design, and when there would be",
      note: "The instinct is to put a CDN in front of everything, and here the bandwidth argument does not apply: a redirect is a few hundred bytes of header, so the entire system pushes about 6 MB per second. What a CDN would buy is <i>latency</i>, by answering the redirect from a point of presence near the user rather than from your region.<br><br>That is a real win, and the reason it is not in the diagram is that it moves the interesting logic to a place you cannot easily show. If the interviewer asks about global users, the answer is an edge function holding a read only replica of the hot codes, falling back to the region on a miss, with a short TTL because a soft deleted link must eventually stop redirecting. Say the invalidation sentence, or the edge cache is exactly the kind of box that looks clever and is not." }
  ],

  tradeoffsIntro: "Say the pair, pick a side, then say what would change your mind. The last part is what separates an opinion from a preference.",

  tradeoffs: [
    { a: ["302 Found", "Every visit comes to your servers. You keep the ability to revoke or repoint a link, and your click counts are real."],
      b: ["301 Moved Permanently", "The browser caches the redirect and stops asking. Free latency and free capacity, at the price of never being able to change that link again for that user."],
      pick: "a",
      flip: "the link is explicitly permanent and the customer is paying for latency, for example a CDN asset alias. Then 301, with the revocation caveat written down somewhere they will read." },
    { a: ["Pre allocated id blocks", "One coordination round trip per million codes. Dense, short codes and no per request cost."],
      b: ["Random code plus a unique index", "No allocator at all. About one retry in six hundred at this fill factor, and the database already enforces uniqueness."],
      pick: "b",
      flip: "the table fills past a few percent of the key space, where the retry rate starts to climb, or you want codes to be unguessable and short at the same time. Honestly, at the numbers in the brief, either answer is correct and the useful thing is knowing which pressure would break each one." },
    { a: ["A relational primary with the code as PK", "Unique index and transactions for free. 3 TB and 120 writes per second is well inside one node with replicas."],
      b: ["A distributed key value store", "Sharding and replication are somebody else's problem. No transaction, so alias uniqueness needs a conditional write."],
      pick: "a",
      flip: "the write rate goes up by an order of magnitude, or the row count makes a single primary's failover time unacceptable. The migration is unusually easy here because nothing joins." },
    { a: ["Count clicks off the path, through a stream", "The redirect never waits. Analytics can be down, replayed or rebuilt without anybody losing a link."],
      b: ["Increment a counter in Redis on the redirect", "One extra memory operation, a live number, and no stream to run."],
      pick: "a",
      flip: "the only requirement is a lifetime total and there is no dashboard. Then a Redis counter is honestly the right size of solution, and adding a stream would be building infrastructure to avoid admitting the feature is small." }
  ],

  next: [
    "<b>Move the redirect to the edge.</b> The single largest latency win available, and it is a cache with an invalidation story you now know how to explain.",
    "<b>Abuse and safety.</b> Shorteners are used to hide destinations. A scanning pipeline off the same click stream, plus a blocklist checked at create time, is the first thing a real product needs.",
    "<b>Expiry and cleanup.</b> Nothing in the design deletes anything. A background job that tombstones expired links keeps the 3 TB estimate honest.",
    "<b>Per link rate limiting.</b> Right now one viral link can dominate a cache node and a stream partition. Isolating whales is the same fix as in every other system on this page."
  ],

  p: [
    ["HI", "https://www.hellointerview.com/learn/system-design/problem-breakdowns/bitly", "Hello Interview, Bitly end to end", "M"],
    ["GFG", "https://www.geeksforgeeks.org/system-design/design-url-shortener/", "GFG, design a URL shortener", "M"],
    ["DG", "https://www.designgurus.io/course-play/grokking-the-system-design-interview/doc/design-a-url-shortening-service-like-tinyurl", "Design Gurus, TinyURL", "M"],
    ["GH", "https://github.com/donnemartin/system-design-primer#design-pastebin-com-or-bit-ly", "System Design Primer, Pastebin and Bitly", "M"],
    ["BB", "https://blog.bytebytego.com/p/ep141-a-cheatsheet-on-system-design", "ByteByteGo, the HLD cheatsheet", "E"]
  ],

  hi: {
    one: "Yahan har decision teen facts se nikalta hai jo aap ninety seconds mein establish kar sakte ho: reads writes se lagbhag 100 guna zyada hain, ek record 500 bytes se chhota hai, aur koi bhi query ko doosri table ki zaroorat nahi padti. Yeh teen baatein bol do, phir round ka baaki hissa bas consequences samjhana hai.",

    brief: {
      why: "Yeh problem trivial dikhti hai aur hai nahi, isiliye itne interviews isse shuru hote hain. Ek galti hai minute two mein hi Kafka draw kar dena. Doosri galti hai <b>Redis</b> naam ka box bana dena bina yeh bataye ki woh stale kyun ho sakta hai. Dono se bacna aasaan hai, agar pehle boring kaam kar lo: system ko kya karna hai, kya galat karne ki ijazat hai, aur numbers kitne bade hain, yeh pin down karo.",
      functional: [
        "<b>Shorten.</b> Ek long URL POST karo, ek short code wapas milta hai. Optionally custom alias, optionally expiry.",
        "<b>Redirect.</b> Short code par GET karo, original par HTTP redirect mil jaata hai. Yeh ek endpoint hi <i>product hai</i>. Yeh down to aap down.",
        "<b>Count.</b> Jisne link banaya woh dekh sakta hai ki link lagbhag kitni baar khula. Is sentence mein <i>lagbhag</i> bahut kaam kar raha hai, aur yeh jaan-boojhkar hai."
      ],
      out: ["user accounts aur billing", "link preview scraping", "malware aur phishing scanning", "per click geography dashboards", "link banne ke baad usse edit karna"],
      nfr: [
        ["Redirect latency", "p99 under 50 ms", "Redirect kisi aur ke page load par chipka hua pure overhead hai. Koi shukriya nahi kehta aur har koi notice karta hai. Yeh number, traffic nahi, aapko bade database ki jagah cache lagane par majboor karta hai."],
        ["Redirect availability", "99.99%", "Mahine mein lagbhag chaar minute ka downtime. Short links printed posters aur aath saal purane tweets mein pahunch jaate hain, to outage aise content ko tod deta hai jo ab aapke control mein nahi aur jise aap fix nahi kar sakte."],
        ["Create availability", "99.9%", "Jaan-boojhkar poora ek nine kam. Shortening ek minute ke liye down ho to kuch log button dobara daba denge. Yahi asymmetry poori wajah hai ki aage chalkar dono paths alag services ban jaate hain."],
        ["Uniqueness", "one code, one URL, forever", "Ek code do baar de diya to koi anjaan insaan galat site par pahunch jaata hai, jo ek attack se alag dikhta hi nahi. Poore design mein yeh ek jagah hai jahan strong consistency negotiable nahi hai."],
        ["Click counts", "eventually right, minutes late", "Ise jaan-boojhkar weak requirement likha gaya hai. Isi se aapko haq milta hai ki counting ko redirect path se poori tarah bahar rakho."]
      ],
      numbers: [
        ["New links", "100M per month", "Public shortener ke liye yeh generous hai. Agar koi numbers na mile, to jo number aap assume kar rahe ho woh zor se bolo aur usi ke liye design karo. Interviewer us assumption se behes nahi kar sakta jo usne aapko bolte suna."],
        ["Write rate", "about 40 per second, peak 120", "100M ko mahine ke 2.6M seconds se divide karo, phir daily peak ke liye lagbhag 3 se multiply. Yeh rounding error hai. Ek database node ko iska pata bhi nahi chalega."],
        ["Read rate", "about 4,000 per second, peak 12,000", "100 to 1 ratio ko write rate par lagao. Poora design isi number ko serve karta hai."],
        ["Storage after 5 years", "about 3 TB", "6 billion rows, har ek lagbhag 500 bytes. Itna bada ki ek disk uncomfortable ho jaaye, itna chhota ki dus machines poora jawab hain."],
        ["Hot working set", "about 10 GB", "Clicks Zipf curve follow karte hain: kuch percent links lagbhag saara traffic le jaate hain. 20 million hot rows, 500 bytes each, ek cache node ki memory mein aaraam se fit ho jaati hain."],
        ["Code length", "7 base62 characters", "62 ki 7th power 3.5 trillion hai. Paanch saal ke links sirf 0.17% use karte hain, isliye random generation mein collision lagbhag hota hi nahi. Chhe characters se 57 billion milte hain, yaani 10% fill, aur aisa collision rate jiska aapko defense dena padega."],
        ["Egress", "about 6 MB per second", "Redirect response ek header hai, page nahi. Yeh zor se bolna zaroori hai kyunki isse bandwidth ke liye CDN lagane ki aadat khatam hoti hai. Yahan edge par jaane ki ekmaatra wajah latency hai."]
      ],
      numbersNote: "Inme se do numbers saara kaam karte hain. <b>100 to 1</b> kehta hai cache lagao. <b>3 TB</b> kehta hai shard karna hai, ek din, aaj nahi. Aur dhyan do ki kya missing hai: is table mein kuch bhi message queue ko justify nahi karta, jab tak stage 5 mein clicks nahi aate."
    },

    stagesIntro: "Chhe stages. Stage 0 woh version hai jo sach mein chalta hai, lagbhag ek din ke liye. Uske baad har stage isliye hai ki ek specific cheez toot gayi, aur jo box aata hai woh us specific cheez ki sabse sasti repair hai. Agar aap pressure ka naam le sakte ho, to box aapne kamaya. Agar nahi, to use whiteboard se hata do.",

    stages: [
      { pressure: "Abhi tak kuch galat nahi hua, aur yahi point hai. Interviewer ko complicated cheez draw karte dekhne se zyada seekhne ko milta hai jab aap simple cheez ko todte ho, aur jo design complicated shuru hota hai uske paas sunane ke liye koi kahani nahi hoti.",
        say: "Main sabse chhoti cheez se shuru karta hoon jo dono verbs satisfy kare, phir use todunga. Ek process, code se URL ka ek map, naye codes ke liye ek counter. Is size par redirect RAM mein ek hash lookup hai, jo is product ki sabse tez speed hai. Yahan se jo bhi add karunga woh ise slow karega, aur use khud ko justify karna padega.",
        breaks: "Process restart hota hai. Ab jitne bhi links kabhi bane, sab 404 dete hain, jisme pichhle saal conference badge par chhapa link bhi hai. Is product ka koi aisa version nahi jisme mapping sirf memory mein rehti ho." },

      { pressure: "Durability. Short link aapne kisi aur ke content ke baare mein kiya hua promise hai, isliye mapping ko process, deploy aur machine, teeno se zyada jeena hoga.",
        say: "Mapping ab ek store mein jaati hai. Product ka naam lene se pehle access ka shape dekho: 7 character string par primary key lookup, ek chhoti row wapas, kabhi koi join nahi, aur row likhne ke baad immutable. Isi shape ki wajah se main SQL versus NoSQL par paanch minute nahi lagaunga. Jo matter karta hai woh yeh hai ki yeh ek point read hai.",
        breaks: "Ek app process aur ek database, yaani do single points of failure. Requirement ne redirect par four nines maange the, aur ek process uske kareeb bhi nahi pahunch sakta, kam se kam isliye ki koi na koi ise Tuesday ko deploy karega." },

      { pressure: "Availability. Four nines ka matlab hai ki redirect path ek machine ke marne aur ek deploy hone, dono ko survive kare, aur kisi ko pata bhi na chale.",
        say: "Load balancer ke peeche kai identical redirect processes. Iski keemat hai statelessness: koi sessions nahi, koi local counters nahi, process memory mein kuch bhi nahi jiska sahi hona kisi ke liye zaroori ho. Koi bhi request kisi bhi box par land kar sakti hai. Yeh keemat main jaan-boojhkar de raha hoon, kyunki isi se yeh tier baaki design mein addition se scale hota hai.",
        breaks: "Ab saare 12,000 peak redirects per second ek 500 byte row ke liye database tak ek network round trip hain. Database yeh kaam achhe se karta hai, aur yahi trap hai: woh karta rahega, dheere aur dheere, aur aapka p99 connection pools aur disk seeks ka function ban jaayega." },

      { pressure: "100 to 1, upar se Zipf. Lagbhag saare reads codes ke ek chhote set ke liye hain, baar baar maange jaate hain, aur jawab kabhi nahi badalta. Yahi textbook definition hai us cheez ki jise recompute karne ki jagah yaad rakhna chahiye.",
        say: "Store ke aage Redis, cache aside. Miss par service row padhti hai aur cache fill karti hai; hit par database ko chhuta tak nahi. Is product ka sabse lucky fact yeh hai: code se URL ka mapping banne ke baad immutable hai, isliye invalidation ka koi problem hi nahi. TTL correctness ke liye nahi, cold tail ko evict karne ke liye hai. Agar main yeh sentence nahi bol sakta, to mujhe yeh box draw karne ki ijazat nahi honi chahiye.",
        breaks: "Write path abhi tak actually design hi nahi hua. 7 character ka code aata kahan se hai, aur jab do log ek hi millisecond mein same custom alias claim karein to kya hota hai? Yahi sawaal interview hai." },

      { pressure: "Reads aur writes ab alag machines chahte hain. Reads chahte hain cache ke paas baithe bahut saare sasti stateless boxes. Writes chahte hain ek coordinated, collision free identifier, aur woh primary ko touch karte hain. Upar se dono ke availability targets mein poora ek nine ka fark hai, aur jab aapne do likhe hain to do cheezon ko ek SLA kabhi nahi dena chahiye.",
        say: "Ek ki jagah do services, kyunki woh alag tarah se scale hoti hain aur alag tarah se fail hoti hain. Shorten service allocator se ek million IDs ka block leti hai, unhe locally base62 encode karti hai, aur block khatam hone tak kisi se coordinate nahi karti. Isse unique ID generation ek per request distributed problem se ek hourly problem ban jaata hai, jo is design ki sabse high leverage move hai.",
        breaks: "Ab jisne link banaya woh jaanna chahta hai ki kitne logon ne click kiya. Obvious implementation, redirect path par counter column increment karna, har read mein ek write jodta hai, har viral link ke peeche ek jalti hui hot row banata hai, aur aapke sabse important endpoint ki availability ko aapke sabse kam important feature se jod deta hai." },

      { pressure: "Analytics ek aisa feature hai jiski correctness requirement weak hai, aur aap use apni sabse strong availability requirement se jodne wale ho. Redirect path par jo bhi hai woh redirect path ka SLA inherit karta hai, isliye counting ko us path se turant bahar jaana hoga.",
        say: "Redirect service ek event fire karti hai aur wait kiye bina return kar deti hai. Agar woh event drop ho jaaye to redirect phir bhi sahi tha, aur isi wajah se arrow dashed hai aur main yahan at-most-once se comfortable hoon. Stream burst absorb karti hai, aggregator use five minute buckets mein fold karta hai, aur ek column store dashboard query ka jawab deta hai. Approximate aur minutes late, bilkul waise jaisa requirement ne allow kiya tha." }
    ],

    boxesIntro: "Das components. Har ek ke liye: kis pressure ne ise banaya, kaun argument haara, aap kya keemat chukate ho, aur teen baje raat ko yeh kaise fail hota hai. Agar sirf ek column yaad rakh sakte ho, to aakhri wala yaad rakho. Apne hi failure modes ka naam lena us insaan ki tarah sunai dene ka sabse tez tareeka hai jisne system chalaya hai, sirf padha nahi.",

    boxes: [
      { job: "Request bhejta hai aur jo bhi redirect wapas aaye use follow karta hai.",
        why: "Yeh diagram par isliye hai kyunki yeh ek participant hai, scenery nahi. Yeh redirects cache karta hai, retry karta hai, aur 301 versus 302 ka decision actually yahin land karta hai.",
        forced: "Ise kisi ne force nahi kiya. Yeh isliye draw hua hai ki is system ka pehla asli trade-off isi boundary par rehta hai, aur us par ungli rakhne mein kuch kharcha nahi.",
        alts: [["Leaving the client off the diagram", "common choice hai, aur chupchaap 301 versus 302 wali baat ka nuksaan karti hai, jo yeh dikhane ka sabse sasta tareeka hai ki aap consequences ke baare mein sochte ho."]],
        pros: ["301 se browser repeat visits par aapke servers ko poori tarah skip kar deta hai: free latency, free capacity, koi code nahi."],
        cons: ["301 bahut hard cache hota hai, kabhi kabhi hamesha ke liye, isliye aap us user ke liye us link ko kabhi revoke ya repoint nahi kar sakte.", "Jab browser redirect cache kar raha ho, to aapke click counts utna undercount karte hain jo aap na naap sakte ho na kisi customer ko samjha sakte ho."],
        cost: "Zero infrastructure. Ek decision, ek baar liya hua, palatna bahut mushkil.",
        fails: "Aap latency ke fayde ke liye 301 ship karte ho. Mahino baad ek shortened link aise page par point karta hai jo phishing site ban chuka hai, aur pata chalta hai ki aadhe internet ne aapka redirect cache kar rakha hai aur aap use wapas nahi le sakte.",
        say: "Default 302. Har visit par ek round trip lagta hai aur badle mein revocation aur honest analytics milte hain. 301 main sirf un links par offer karunga jinhe customer explicitly permanent mark kare, aur unhe revocation wala sentence pehle padhwaunga." },

      { job: "Duniya ke liye ek stable address, identical processes mein spread, aur jo mar gaye unhe automatically hata deta hai.",
        why: "Jaise hi ek se zyada redirect process hain, kisi ko decide karna padta hai ki request kise mile, aur kisi ko notice karna padta hai ki koi process jawab dena band kar gaya.",
        forced: "Stage 2 ka 99.99% redirect target. Ek process four nines ke kareeb nahi pahunch sakta, aur akela deploy hi budget ud dega.",
        alts: [["DNS round robin", "free hai aur pehle se maujood, par clients DNS ko minutes tak cache karte hain aur use pata hi nahi ki box zinda hai ya nahi. Aapka failover time kisi aur ka TTL ban jaata hai."], ["Client side load balancing", "datacentre ke andar excellent hai jahan callers aapke control mein hain. Yahan bekaar hai, jahan callers duniya ka har browser hain."], ["An API gateway doing the same job", "wahi box, zyada features aur zyada latency ke saath. Tab worth hai jab auth, rate limiting aur routing ek jagah chahiye; stage 2 mein worth nahi."]],
        pros: ["Health checks ek dead machine ko outage ki jagah non event bana dete hain.", "TLS ek baar terminate karta hai, isliye peeche ki services plain aur sasti rehti hain.", "Baad mein rate limiting lagane ki natural jagah, aur ek public redirect endpoint DDoS magnet hota hai."],
        cons: ["Ab yeh har ek request ke path mein hai, isliye iski apni availability ke baare mein sochna padega.", "Layer 7 balancing ek do millisecond leta hai, aur us se zyada important, ek operational surface."],
        cost: "Managed wala sasta aur boring hai. Asli keemat yeh hai ki connection draining ke liye ise sahi configure karna padta hai, warna har deploy in flight requests gira deta hai.",
        fails: "Health checks aise path ko hit karte hain jo sirf check karta hai ki process zinda hai, yeh nahi ki woh Redis aur database tak pahunch sakta hai. Box apna check pass kar deta hai, real users ko 500 serve karta hai, aur rotation mein bana rehta hai kyunki kisi ne use koi aisa sawaal poocha hi nahi jo matter karta.",
        say: "Layer 7, TLS yahin terminate, aise health checks jo dependencies ko actually touch karein, aur deploy par connection draining. Rate limiter bhi yahin rakhunga, kyunki abusive traffic edge par marna chahiye, database par nahi." },

      { job: "Saat characters ko ek Location header mein badalna. Yeh ek endpoint hi product hai.",
        why: "Yeh apna alag deployable ban paata hai kyunki system mein iske latency aur availability targets sabse strict hain aur logic sabse simple. Small aur boring hi ise fast rakhta hai, aur baaki sab kuch ka blast radius isse door rakhta hai.",
        forced: "Stage 2 mein redirects par four nines, phir stage 4 ka split, jahan shortening ya analytics code ka bura deploy redirects ko gira nahi sakta.",
        alts: [["One service handling both verbs", "operate karna simple aur stage 3 tak bilkul theek. Theek tab nahi rehta jab write path ka incident read path ko saath le doobe, aur aisa sabse bure din hota hai."], ["Serving redirects from an edge function or the CDN itself", "faster, sasta, aur production mein real shorteners yahi karte hain. Yahan sirf isliye reject kiya ki yeh us mechanism ko chhupa deta hai jiske baare mein interview hai. Ise agli optimisation ke roop mein zor se bol do, credit mil jaayega aur explanation bhi nahi khoyegi."]],
        pros: ["Stateless hai, isliye identical boxes jodkar scale hota hai aur iski apni koi failover kahani nahi chahiye.", "Iski dependency list do items ki hai. Aisa system jise aap aadhi neend mein bhi samajh sako.", "Apni cadence par deploy hota hai, isliye risky code kahin aur ship hota hai."],
        cons: ["Doosri service matlab doosri cheez monitor karne, deploy karne aur jiske liye page aane ki.", "Shorten service ke saath shared code ko ab library chahiye, ya duplication, aur dono ki keemat hai."],
        cost: "12,000 peak requests per second par har request pe kuch milliseconds ka kaam. Single digit machines, aur design ka sabse sasta tier.",
        fails: "Redis failover hota hai ya deploy ke baad flush ho jaata hai. Har request ek hi instant mein miss karti hai aur us database par gir jaati hai jo traffic ke ek percent ke liye size kiya tha. Yeh cache stampede hai, aur yahi woh outage hai jo is design mein sabse zyada actually hoga.",
        say: "Stateless, do dependencies, aur cache call par hard timeout, taaki slow Redis stuck threads ki queue ki jagah ek slower redirect mein degrade ho." },

      { job: "99% redirects ka jawab memory se dena, taaki database unhe kabhi dekhe hi nahi.",
        why: "Reads writes se 100 to 1 zyada hain aur Zipf distribution follow karte hain, isliye codes ka ek chhota set lagataar maanga jaata hai aur ek code ka jawab kabhi nahi badalta. Use yaad rakhna lagbhag free hai.",
        forced: "Stage 3 ka p99 under 50 ms target. Database 12,000 point reads per second serve kar sakta hai, par latency budget bachaye bina nahi, aur bill ke bina nahi.",
        alts: [["More database read replicas", "chalta hai, par har read serve karne par kaafi zyada kharcha. Aap phir bhi ek network hop, ek connection, ek query parser aur ek disk cache ki keemat de rahe ho ek aisi value ke liye jo aap pehle se jaante the."], ["A CDN or edge cache holding the redirect", "latency ke liye sach mein behtar, aur global scale par yahi lena chahiye. Yeh invalidation problem ko aisi jagah le jaata hai jo aapke control mein kam hai, jo yahan tab theek hai jab mapping immutable ho."], ["An in process LRU in each redirect box", "sabse fast option aur wahi jo chupchaap statelessness tod deta hai. Redis ke aage second tier ke roop mein defensible hai, aur akele tier ke roop mein galti: N boxes matlab N cold caches aur deploy par N guna miss traffic."]],
        pros: ["Database load ko 12,000 reads per second se kuch sau tak le aata hai.", "Mapping immutable hai, isliye galat karne layak koi invalidation logic nahi. Yahi fact is box ko safe banata hai.", "Poora cache kho dena ek performance incident hai, correctness ka nahi."],
        cons: ["Ek poora extra system run, size, monitor aur failover karne ke liye.", "Restart ke baad cold start sach mein khatarnak hai, kyunki miss path kabhi full traffic ke liye size hua hi nahi.", "Yeh database ki problems tab tak chhupata hai jab tak woh chhupana band nahi kar deta."],
        cost: "20 million hot entries, 500 bytes each, lagbhag 10 GB. Ek node aur ek replica, aaraam se.",
        fails: "Ek hot code usi moment expire hota hai jab ek hazaar requests use maang rahi hain, sab miss karti hain, aur ek hazaar identical queries ek saath database par girti hain. Fix: per key lock taaki ek caller fill kare aur baaki wait karein, ya jittered TTLs taaki keys lockstep mein expire na hon.",
        say: "Cache aside, key code, value URL, ek din ka TTL sirf cold tail evict karne ke liye. Kyunki mapping immutable hai, invalidate karne ko kuch nahi, aur yahi ekmaatra wajah hai ki main system ke sabse important endpoint ke hot path mein cache se comfortable hoon." },

      { job: "Durable record: code, long URL, owner, created_at, expires_at. Jab cache khaali ya galat ho, tab authority yahi hai.",
        why: "Kuch to restart survive karega, aur kuch to hona chahiye jo 'nahi' bol sake jab do log same custom alias maangein.",
        forced: "Stage 1 mein durability, phir stage 4 mein uniqueness requirement. Code par unique index hi alias race ko resolvable banata hai, warna yeh ek aisi cheez hoti jiske na hone ki aap umeed karte.",
        alts: [["Postgres or MySQL", "poori tarah defensible jawab aur woh jo main actually pehle ship karunga. Unique index aur transaction free milte hain, aur 3 TB ek well tuned primary aur replicas ki pahunch mein hai."], ["DynamoDB or Cassandra", "is scale se dus guna par sahi jawab. Partitioning trivial hai kyunki code hi ekmaatra key hai jisse koi query karta hai, aur join karne ko kuch nahi."], ["Redis as the system of record", "lubhavna hai, kyunki working set memory mein fit hota hai, aur galat hai. Yeh woh copy hai jisse har cache node ek saath kho jaane par bhi bachna hai."]],
        pros: ["Primary key par point read, jisme duniya ka har store achha hai.", "Koi joins nahi, isliye jab row count demand kare to code se sharding mechanical hai.", "Insert ke baad rows immutable hain, jo concurrency bugs ki ek poori category hata deta hai."],
        cons: ["Yeh ekmaatra component hai jisme real state hai, isliye failover, backup aur migration ki kahaniyan akele isi ke sar hain.", "Analytics query pattern isme bilkul fit nahi hota, aur isiliye stage 5 mein column store aata hai."],
        cost: "Paanch saal baad lagbhag 3 TB, har row lagbhag 500 bytes. Cache ke baad read load kuch sau per second, write load 200 se kam.",
        fails: "Primary write ke beech mein mar jaata hai. Redirects cache aur replicas se chalte rehte hain, jabki shortening replica promote hone tak 503 deti hai. Yeh asymmetry accident nahi hai, yeh woh cheez hai jo do alag availability targets ne aapko kharid kar di, aur yeh zor se bolna diagram se zyada value rakhta hai.",
        say: "Shuru mein Postgres, code primary key ke roop mein, kyunki write rate trivial hai aur mujhe unique index chahiye. Key value store par tab jaunga jab row count ek primary ko uncomfortable kar de, ek din pehle nahi." },

      { job: "Ek long URL lo, aisa code banao jo kisi aur ke paas nahi, ek row likho, return karo.",
        why: "Yeh traffic ka ek percent handle karti hai, iska availability target kam hai, aur system mein yahi ekmaatra jagah hai jise coordinate karna padta hai. Yeh teeno wajah hain ki ise redirect path se door rakha jaaye.",
        forced: "Stage 4. Requirements mein do alag availability targets ka matlab tha do alag deployables, ya ek deployable jise bina fayde ke dono mein se strict wale ke standard par rakhna padta.",
        alts: [["Keeping both verbs in one service", "tab tak theek jab tak nahi hai. Jis din aap alias validation mein change deploy karke redirect path bhi gira denge, aap chahenge ki split kar diya hota."], ["Doing the write straight from an edge function", "write path ko transaction aur unique index chahiye; edge dono ke liye galat jagah hai."]],
        pros: ["Iske incidents redirect path tak nahi pahunch sakte.", "Ise bilkul alag rules par scale aur rate limit kiya ja sakta hai, jo matter karta hai kyunki abuse creation mein hota hai.", "Yahan slow hona acceptable hai. Yeh azaadi bahut kaam ki hai: yeh validation, normalisation aur synchronous unique check kar sakti hai."],
        cons: ["Ek doosra deployable, aur uske saath aane wala duplication.", "System ka ekmaatra genuinely mushkil logic, yaani alias race, isi ke paas hai."],
        cost: "Peak par 120 writes per second. Yeh ek chhoti machine aur proportion ki achhi samajh hai.",
        fails: "Automated link creation ka burst, jo shortener attract karta hai, ID block ko allocator ke expect se tez khatam kar deta hai. Isse handle karo next block zero par nahi, 20% remaining par fetch karke.",
        say: "URL normalise karo, custom alias ko read-then-write se nahi balki transaction ke andar unique index se check karo, aur local block se next id lo. Create ko block kar sakne wali ekmaatra network call insert khud hai." },

      { job: "Har shorten process ko ek million integers ka block do jo kisi aur ko kabhi nahi milega.",
        why: "Kai machines mein unique codes ek coordination problem hai, aur per request coordination mehenga hai. Har million requests mein ek baar coordinate karna nahi.",
        forced: "Stage 4, jaise hi ek se zyada shorten process hue. Ek process ke saath local counter kaafi hai; do ke saath woh collide karenge, pehle din hi hoga, aur blame kisi aur cheez par jaayega.",
        alts: [["Hash the URL and retry on collision", "jo jawab log sabse pehle uthate hain. Collision detect karne ke liye har write se pehle read chahiye, yaani write path par ek database round trip, aur table bharne ke saath retry rate badhta hai. Iska matlab yeh bhi hai ki same URL same code par shorten hota hai, jo kuch products chahte hain aur zyadatar nahi."], ["Random 7 characters, insert, catch the unique violation", "is fill factor par sach mein achha: 0.17% used matlab collision lagbhag chhe sau mein ek hai, aur database pehle se uniqueness enforce kar raha hai. Allocator se simple. Main dono ko khushi se defend karunga."], ["A Snowflake style ID with machine and timestamp bits", "sahi aur coordination free, par ids lambe hain aur time mein sequential, isliye base62 codes guessable aur lambe ho jaate hain. Sequence chhupane ke liye scramble step jodna padta hai, jo aisi complexity hai jiski zaroorat nahi thi."], ["A single auto increment column on the primary", "sahi hai aur har create ke aage ek machine par synchronous write rakh deta hai. 120 writes per second par chalta hai, aur yahi sabse pehle chalna band hota hai."]],
        pros: ["Har id ke liye ek nahi, har million ids par ek coordination round trip.", "Codes dense hain, isliye saat characters sach mein kaafi hain.", "Allocator lagbhag kuch bhi ho sakta hai: ek row jisme ek integer ho, transaction mein update hota hua."],
        cons: ["Jab process unused ids ke saath mar jaata hai to blocks kho jaate hain, isliye sequence mein holes hote hain. Yeh theek hai, aur koi poochhe usse pehle aap yeh bolo.", "Yeh aisa component hai jiska failure saari creation block kar deta hai, isliye boring aur replicated hona chahiye.", "Block ke andar sequential ids lagbhag yeh leak karte hain ki aapne kitne links banaye, agar koi dekhna chahe."],
        cost: "Har process ke liye har ghante ek row aur ek transaction. Yeh diagram ka sabse sasta box hai, kai orders of magnitude se.",
        fails: "Allocator unreachable hai aur har shorten process apna block phoonk deta hai. Creation ruk jaati hai. Mitigate karo ek second block reserve mein rakhkar aur jaldi fetch karke, taaki allocator outage seconds ki jagah ghanton ke headroom mein naapa jaaye.",
        say: "Ek million ke blocks, 20% remaining par fetch, locally base62 encode. Agar interviewer simplicity chahta hai, to random plus unique index is fill factor par poora respectable jawab hai, aur main bataunga kyun, yeh dikhawa kiye bina ki sirf ek hi option hai." },

      { job: "Redirect path se ek click event absorb karo aur aggregator ke ready hone tak use hold karo.",
        why: "Barah hazaar click events per second individually bekaar hain aur aggregate mein keemti. Ek log fast producer ko slower consumer ko hand off karne deta hai, bina dono ko ek doosre ke baare mein jaane.",
        forced: "Stage 5, aur sirf stage 5. Dhyan do ki is point se pehle kisi ko queue ki zaroorat nahi thi. Ise pehle add karna decoration hota.",
        alts: [["Writing the click straight to the analytics store", "redirect path ki availability ko ek dashboard ki availability se jod deta hai. Aapke sabse important endpoint ke liye galat dependency direction."], ["Incrementing a counter in Redis", "agar sirf total chahiye to actually achha jawab. Jaise hi koi clicks per hour, ya per country maange, ya bug ke baad recompute karna chahe, yeh kaam karna band kar deta hai."], ["Batching in the redirect process and flushing every few seconds", "sasta, aur har deploy aur crash par aakhri kuch seconds ke events kho deta hai. Counting ke liye acceptable, aur aisi aadat jo tab kaategi jab wahi code kisi zaroori cheez ke liye copy ho jaaye."]],
        pros: ["Producer fire and forget hai, isliye slow ya dead consumer redirect ko slow nahi kar sakta.", "Replayable: aggregator ka bug fix karo aur pura din khone ki jagah window reprocess karo.", "Code se partition karne par ek link ke saare events ek partition par jaate hain, jisse per link counting ek local operation ban jaati hai."],
        cons: ["Aapke sabse kam important feature ko support karne ke liye ek poora distributed system joda gaya. Yeh honest description hai aur aapko yeh bolna chahiye.", "Code se partition karne ka matlab viral link ek hot partition banata hai.", "Retention ek asli keemat aur ek asli decision hai."],
        cost: "Lagbhag 100 bytes per event, 12,000 per second par lagbhag 1 MB per second, yaani ek din ki retention par 100 GB. Modest, aur free nahi.",
        fails: "Ek link viral ho jaata hai aur uska partition peeche reh jaata hai jabki baaki har partition idle hai. Mitigate karo code plus ek chhote random suffix par key karke aur end mein sum karke, jo hot key ki standard trick hai.",
        say: "At-most-once yahan sahi delivery guarantee hai, aur main yeh explicitly bolna chahta hoon, aadat se exactly-once tak pahunchne ki jagah. Ek dropped click event ki keemat hai dashboard ka number thoda kam. Exactly-once ki keemat hoti system ke sabse hot path par coordination." },

      { job: "Individual clicks ki firehose ko per code per time bucket counts mein fold karna.",
        why: "Koi bhi ek akela click query nahi karta. Har sawaal ek window par count hai, isliye useful kaam hai lakhon rows ko hazaaron mein collapse karna, kisi ke poochne se pehle.",
        forced: "Stage 5. Raw clicks store karke query time par count chalana ka matlab hota billions rows scan karna, ek aisi dashboard ka jawab dene ke liye jo har page view par load hota hai.",
        alts: [["Querying raw events at read time", "flexible aur slow, aur dashboard ki cost link ki popularity ke proportional ho jaati hai, jo bilkul ulta hai."], ["Materialised views inside the analytics store", "achha jawab agar store unhe achhe se support kare, aur yeh is box ko hatane ki jagah ek doosre box ke andar le jaata hai."]],
        pros: ["Store karne se pehle data ko teen ya chaar orders of magnitude kam kar deta hai.", "Window ek knob hai: freshness ke liye paanch minute, cost ke liye ek ghanta.", "Agar output (code, bucket) se keyed ho to idempotent hai, isliye replay double count karne ki jagah overwrite karta hai."],
        cons: ["Windowing mein fiddly bugs rehte hain: late events, clock skew, aur woh event jo window close hone ke baad aaye uska kya karein.", "Yeh minutes ka lag jodta hai, jo tabhi acceptable hai kyunki requirement ne yahi kaha tha."],
        cost: "Kuch stream processing tasks. Kaam ek group by hai, jo sasta hai; operational bojh checkpointing aur restarts ka hai.",
        fails: "Deploy consumer offset reset kar deta hai aur pichhla ghanta do baar count ho jaata hai. Isiliye output (code, bucket) se keyed hai aur increment ki jagah upsert se likha jaata hai: replay tab doubling ki jagah wahi jawab deta hai.",
        say: "Five minute tumbling windows, output (code, bucket) par upsert. Write ko idempotent banana hi mujhe stream se at-least-once delivery ke baare mein relaxed rehne deta hai, aur ismein kuch kharcha nahi." },

      { job: "Aise sawaalon ka jawab dena jaise pichhle tees dinon mein is link par har ghante kitne clicks.",
        why: "Query ka shape redirect se poori tarah alag hai: ek key ke liye time par range scan, chalte chalte aggregate karte hue. Yeh column store ka ghar hai aur key value store ka worst case.",
        forced: "Stage 5, aur yeh sach mein doosra store hai, aalas nahi. Main store ek immutable row ke point read ke liye optimised hai; time range aggregation ke liye usme kuch fit nahi hota.",
        alts: [["Keeping the counts in the main database", "is size par workable, aur matlab analytics queries usi connections aur buffer pool ke liye compete karti hain jo redirect fallback path ke hain. Aap ek dashboard ko product slow karne de rahe ho."], ["Counters in Redis", "instant, aur durable tabhi jab aap ise banao, aur yeh history ki jagah sirf ek number deta hai."], ["A full data warehouse", "company ke liye sahi, feature ke liye oversized. Ise yeh bolo ki aage yahan jaayenge, yeh nahi ki yahan se shuru karenge."]],
        pros: ["Column layout ka matlab tees din ka scan ek column padhta hai, poori rows nahi.", "Aggregates bahut achhe se compress hote hain, kyunki zyadatar links ka zyadatar ghanton mein count zero hota hai.", "Yeh redirect path se poori tarah bahar hai, isliye yeh down ho to bhi koi link nahi khota."],
        cons: ["Teesri storage technology jise run, backup aur samajhna hai.", "Iski consistency construction se eventual hai, jo aapko product managers ko baar baar bolna padta hai."],
        cost: "Har link ke liye mahine mein lakhon events ki jagah hazaaron rows. Itna chhota ki retention product decision hai, infrastructure decision nahi.",
        fails: "Yeh peeche reh jaata hai, ya gir jaata hai, aur dashboards stale numbers dikhate hain. Product mein kuch nahi tootta. Yahi poori wajah hai ki yeh dashed arrow ki is taraf rehta hai.",
        say: "ClickHouse ya uske jaisa, primary key (code, hour). Agar interviewer dashboard ki jagah exact billing numbers chahta hai, to main raw stream par ek nightly batch job source of truth ke roop mein jodunga aur ise fast approximate view rakhunga." }
    ],

    flowsIntro: "Boxes draw karo, phir do paths zor se narrate karo. Interviewers yahi hissa score karte hain, kyunki yahin hand waving dikh jaati hai. Har step ke liye jaano ki user wait kar raha hai ya nahi.",

    flows: [
      { n: "Read path, ek redirect",
        note: "Yeh 99% traffic hai aur woh path jiske baare mein aapka SLA likha gaya hai. Chaar steps, aur unme se sirf ek slow ho sakta hai.",
        steps: [
          ["Browser <code>GET /aX9k2Qm</code> bhejta hai. Load balancer TLS terminate karta hai aur koi bhi healthy redirect box chunta hai.", "sync"],
          ["Service Redis mein <code>url:aX9k2Qm</code> dhoondhti hai. Sau mein lagbhag 99 baar hit hota hai aur request basically khatam.", "sync"],
          ["Miss par woh store se primary key se row padhti hai, use cache mein wapas likhti hai, aur aage badhti hai. Yeh path 1% traffic ke liye size hua hai, aur yahi woh risk hai jo poora design uthata hai.", "sync"],
          ["Woh <code>302 Location: https://...</code> return karti hai. User ab kisi aur ki problem hai, 50 ms se kam mein.", "sync"],
          ["Response likhne ke baad hi woh stream ko click event emit karti hai, acknowledgement ka wait kiye bina. Agar yeh fail ho, to redirect phir bhi sahi tha.", "async"]
        ] },
      { n: "Write path, shortening",
        note: "1% traffic, sau guna slow hone ki ijazat, aur ekmaatra jagah jahan kuch coordinate karna padta hai.",
        steps: [
          ["Client long URL aur, optionally, custom alias ke saath <code>POST /v1/links</code> bhejta hai.", "sync"],
          ["Shorten service URL normalise karti hai aur scheme validate karti hai, taaki ek hi address ke do forms do rows aur redirect loop na ban jaayein.", "sync"],
          ["Alias nahi: local block se next integer lo aur base62 encode karo. Koi network call nahi, koi coordination nahi, koi collision nahi, kyunki yeh block kisi aur ke paas nahi.", "sync"],
          ["Custom alias: use insert karo aur unique index ko haarne wale ko reject karne do. Pehle read karke phir write mat karo, kyunki do requests dono <i>free</i> padh sakti hain aur dono phir write kar deti hain.", "sync"],
          ["Row insert karo. Cache mein mat likho. Us link ke click hone ki sambhavna kam hai, aur ek aisa cache jo aise links se bhara ho jinhe koi nahi chahta, khaali cache se bura hai.", "sync"],
          ["201 ke saath short URL return karo. Agar block 20% remaining se neeche tha, to next abhi fetch karo, request path se bahar.", "async"]
        ] },
      { n: "Counting path",
        note: "Yahan sab kuch late, lossy aur sasta ho sakta hai, aur yahi ise aapke sabse busy endpoint se jodna safe banata hai.",
        steps: [
          ["Ek click event, lagbhag 100 bytes, code se partition karke stream mein produce hota hai.", "async"],
          ["Aggregator partition consume karta hai aur memory mein per (code, five minute bucket) ek running count rakhta hai.", "async"],
          ["Har window ke end par woh analytics store mein har code ke liye ek row upsert karta hai. Increment nahi, upsert, taaki replay harmless ho.", "async"],
          ["Dashboard query ek code ke liye time range padhti hai aur milliseconds mein jawab paati hai, kyunki woh billions events ki jagah hazaaron pre aggregated rows padh rahi hai.", "sync"]
        ] }
    ],

    tradeoffsIntro: "Pair bolo, ek side chuno, phir bolo ki aapka mind kya badlega. Aakhri hissa hi opinion ko preference se alag karta hai.",

    tradeoffs: [
      { a: ["302 Found", "Har visit aapke servers tak aata hai. Aap link ko revoke ya repoint karne ki ability rakhte ho, aur click counts real hain."],
        b: ["301 Moved Permanently", "Browser redirect cache kar leta hai aur poochna band kar deta hai. Free latency aur free capacity, is keemat par ki us user ke liye woh link phir kabhi badal nahi sakta."],
        flip: "link explicitly permanent ho aur customer latency ke liye paisa de raha ho, jaise ek CDN asset alias. Tab 301, revocation caveat aisi jagah likhke jahan woh padhein." },
      { a: ["Pre allocated id blocks", "Har million codes par ek coordination round trip. Dense, short codes aur koi per request cost nahi."],
        b: ["Random code plus a unique index", "Koi allocator nahi. Is fill factor par lagbhag chhe sau mein ek retry, aur database pehle se uniqueness enforce karta hai."],
        flip: "table key space ke kuch percent se upar bhar jaaye, jahan retry rate badhna shuru hota hai, ya aap chahte ho ki codes ek saath unguessable aur short hon. Sach kahun to brief ke numbers par dono jawab sahi hain, aur kaam ki baat yeh jaanna hai ki kaunsa pressure har ek ko todega." },
      { a: ["A relational primary with the code as PK", "Unique index aur transactions free. 3 TB aur 120 writes per second replicas ke saath ek node ke andar aaraam se hain."],
        b: ["A distributed key value store", "Sharding aur replication kisi aur ki problem. Koi transaction nahi, isliye alias uniqueness ke liye conditional write chahiye."],
        flip: "write rate ek order of magnitude badh jaaye, ya row count ek single primary ka failover time unacceptable bana de. Migration yahan asaadharan roop se aasaan hai kyunki kuch bhi join nahi hota." },
      { a: ["Count clicks off the path, through a stream", "Redirect kabhi wait nahi karta. Analytics down ho sakta hai, replay ya rebuild ho sakta hai, bina kisi ka link khoye."],
        b: ["Increment a counter in Redis on the redirect", "Ek extra memory operation, ek live number, aur chalane ko koi stream nahi."],
        flip: "ekmaatra requirement lifetime total hai aur koi dashboard nahi. Tab Redis counter honestly sahi size ka solution hai, aur stream jodna yeh maanne se bachne ke liye infrastructure banana hoga ki feature chhota hai." }
    ],

    next: [
      "<b>Redirect ko edge par le jaao.</b> Available sabse bada latency win, aur yeh ek cache hai jiski invalidation kahani ab aap samjha sakte ho.",
      "<b>Abuse aur safety.</b> Shorteners destinations chhupane ke liye use hote hain. Isi click stream se ek scanning pipeline, aur create time par check hone wali blocklist, ek real product ko sabse pehle chahiye.",
      "<b>Expiry aur cleanup.</b> Design mein kuch bhi kuch delete nahi karta. Ek background job jo expired links ko tombstone kare, 3 TB estimate ko honest rakhta hai.",
      "<b>Per link rate limiting.</b> Abhi ek viral link ek cache node aur ek stream partition par haavi ho sakta hai. Whales ko isolate karna is page ke har doosre system jaisa hi fix hai."
    ]
  }
},

/* ==========================================================================
   2. CHAT
   ========================================================================== */
{
  id: "whatsapp", kind: "hld", n: "Chat", sub: "WhatsApp, Messenger",
  tags: ["realtime", "stateful sockets", "delivery guarantees", "fan-out"],
  one: "Chat is not a database problem, it is a connection problem. Three questions carry the whole design: where is this user's socket, what happens to a message when there is no socket, and how do you avoid ever showing the same message twice or losing one.",

  brief: {
    why: "Almost everybody starts this problem by drawing a database, and almost everybody then struggles, because the state that matters is not on disk. It is a hundred million open TCP connections, and the interesting question is which process is holding the one you need. Get that straight and the rest, storage, ordering, groups, follows naturally. One more thing to establish early, because it changes the numbers by two orders of magnitude: does the server keep your history, or delete each message once it is delivered?",
    functional: [
      "<b>Send and receive one to one.</b> A message reaches the other person's device, and the sender sees sent, delivered and read states.",
      "<b>Survive being offline.</b> A message sent to a phone that is off must arrive when it comes back, in the right order, without duplicates.",
      "<b>Group chat</b> up to 256 members, which is the same problem multiplied and is where the write amplification lives.",
      "<b>Presence.</b> Online and last seen, which sounds trivial and is the highest write rate in the system if you implement it naively."
    ],
    out: ["voice and video calls", "stories", "payments", "the key exchange protocol itself", "spam and abuse tooling"],
    nfr: [
      ["Delivery latency", "p99 under 500 ms", "Both parties online. People type in bursts and read instantly; anything slower feels like the app is broken rather than the network."],
      ["Durability", "never lose an accepted message", "Once the server has acknowledged a message, losing it is the one unrecoverable bug in a messaging product. This is what forces a store between the two sockets."],
      ["Ordering", "per conversation, same on every device", "Messages arriving out of order turn an argument into nonsense. Note it is per conversation, not global, which is what makes it achievable."],
      ["Duplicates", "never shown to the user", "The network guarantees at-least-once at best, so exactly once has to be manufactured at the edges with an id the client picked."],
      ["Confidentiality", "the server never sees plaintext", "End to end encryption is not a feature bolted on, it is a constraint that deletes whole boxes from the diagram: no server side search, no server side previews, no content based spam filtering."]
    ],
    numbers: [
      ["Daily actives", "500M", "A scaled down but honest version of the real thing. Say your assumption, then design to it."],
      ["Concurrent connections", "about 100M", "Roughly a fifth of the daily actives have the app in the foreground or a live push channel at any moment. This, not QPS, is the number that sizes the front tier."],
      ["Chat servers", "about 1,000", "100M sockets at roughly 100,000 per box. A socket is a file descriptor and a small buffer, so the limit is memory and tuning, not CPU. Saying this number is what shows you understand the tier is different."],
      ["Messages", "about 230k per second, peak 700k", "500M actives times 40 messages a day, divided by 86,400, times three for the evening peak."],
      ["Delivery events", "about 1.2M per second", "Group messages amplify. If one message in ten goes to a group averaging fifty people, each message becomes about five deliveries. Fan-out, not ingest, is the real load."],
      ["Undelivered storage", "about 40 GB", "Only messages waiting for an offline device. If 5% wait for an average of an hour, that is a rounding error, and it is entirely because of the product decision below."],
      ["If history were kept", "about 7 PB per year", "20 billion messages a day at 1 KB. Two hundred times the storage, a completely different database, and a different company. Ask which product you are building before you draw anything."]
    ],
    numbersNote: "The two numbers to say out loud are <b>100M concurrent sockets</b>, because it is what makes the front tier stateful and unusual, and <b>40 GB versus 7 PB</b>, because a single product question moves the storage answer by two orders of magnitude and most candidates never ask it."
  },

  stagesIntro: "Six stages. Watch where the complexity actually accumulates: not in the database, but in knowing which of a thousand processes is holding a particular socket, and in the small protocol that turns an unreliable network into a conversation nobody notices is unreliable.",

  stages: [
    { t: "0. One process holding every socket",
      pressure: "Nothing yet. Start with both people connected to the same process, because that version has no routing problem at all, and routing is going to be the whole design.",
      nodes: [
        { id: "client", l: "Phone A", s: "WebSocket, kept open", col: 0, row: 0, r: "client" },
        { id: "chat", l: "One chat process", s: "user id to socket map", col: 1, row: 0, r: "svc" },
        { id: "peerclient", l: "Phone B", s: "also connected here", col: 2, row: 0, r: "client" }
      ],
      edges: [{ a: "client", b: "chat", l: "send" }, { a: "chat", b: "peerclient", l: "push" }],
      add: ["client", "chat", "peerclient"],
      say: "Both phones hold an open connection to the same process. A message is a lookup in a map and a write to a socket, with no storage anywhere. Notice the connection is long lived and the server pushes: this is not request and response, and that is the single structural difference between chat and everything else on this page.",
      breaks: "Phone B's screen is off. The lookup returns nothing, the message evaporates, and the sender saw one tick. There is no acceptable product where that happens." },

    { t: "1. Somebody is asleep, so the message needs somewhere to wait",
      pressure: "Durability, and the fact that the recipient is offline most of the day. A message has to be safe on disk before the sender is told it was sent.",
      nodes: [
        { id: "client", l: "Phone A", s: "WebSocket", col: 0, row: 0, r: "client" },
        { id: "chat", l: "Chat process", s: "accept, store, then push", col: 1, row: 0, r: "svc" },
        { id: "peerclient", l: "Phone B", s: "offline", col: 2, row: 0, r: "client" },
        { id: "msgdb", l: "Message store", s: "per recipient inbox", col: 1, row: 1, r: "store" }
      ],
      edges: [
        { a: "client", b: "chat", l: "send" },
        { a: "chat", b: "msgdb", l: "write first" },
        { a: "chat", b: "peerclient", l: "push" }
      ],
      add: ["msgdb"],
      say: "The order of operations is the design. Write to the store, then acknowledge to the sender, then attempt the push. If you push first and store second, a crash between them loses a message that the sender believes was delivered. When Phone B reconnects, it asks for everything after the last sequence number it has, drains it, and acknowledges. The row is deleted on acknowledgement, which is why the storage estimate was 40 GB and not 7 PB.",
      breaks: "One process cannot hold 100 million sockets, and the moment there are two processes, Phone A's process has no idea where Phone B's socket lives." },

    { t: "2. A thousand processes, and the question of where the socket is",
      pressure: "100 million concurrent connections at roughly 100,000 per box means about a thousand boxes. Now every message is a routing problem: which of the thousand is holding the recipient?",
      nodes: [
        { id: "client", l: "Phone A", s: "WebSocket", col: 0, row: 0, r: "client" },
        { id: "lb", l: "Connection LB", s: "long lived connections", col: 1, row: 0, r: "edge" },
        { id: "chat", l: "Chat server, A's", s: "about 100k sockets", col: 2, row: 0, r: "svc" },
        { id: "peer", l: "Chat server, B's", s: "same binary", col: 3, row: 0, r: "svc" },
        { id: "peerclient", l: "Phone B", col: 4, row: 0, r: "client" },
        { id: "registry", l: "Session registry", s: "user to server, TTL", col: 2, row: 1, r: "cache" },
        { id: "msgdb", l: "Message store", s: "inbox, deleted on ack", col: 3, row: 1, r: "store" }
      ],
      edges: [
        { a: "client", b: "lb" }, { a: "lb", b: "chat", l: "sticky" },
        { a: "chat", b: "registry", l: "where is B?" },
        { a: "chat", b: "msgdb", l: "store", bend: 0.35 },
        { a: "chat", b: "peer", l: "forward" },
        { a: "peer", b: "peerclient", l: "push" }
      ],
      add: ["lb", "peer", "registry"],
      say: "A registry maps user id to the server currently holding that socket, written on connect and removed on disconnect, with a short TTL so a crashed server's entries expire on their own. A's server looks B up, forwards over an internal connection, and B's server writes the socket. If the lookup finds nothing, the message simply stays in the inbox and waits, which is the same path as the offline case and therefore already tested.",
      breaks: "The network will duplicate that forward, or drop it after the store succeeded, or deliver it twice when a retry races a slow acknowledgement. Right now the user sees a message twice, which is worse than seeing it late." },

    { t: "3. The stage that adds no boxes",
      pressure: "Duplicates and lost acknowledgements. This is the one genuinely subtle part of chat, and the fix is a protocol rather than a component. Worth saying out loud in an interview: not every problem is solved by drawing another rectangle.",
      nodes: [
        { id: "client", l: "Phone A", s: "picks the message id", col: 0, row: 0, r: "client" },
        { id: "lb", l: "Connection LB", col: 1, row: 0, r: "edge" },
        { id: "chat", l: "Chat server, A's", s: "retries until acked", col: 2, row: 0, r: "svc" },
        { id: "peer", l: "Chat server, B's", col: 3, row: 0, r: "svc" },
        { id: "peerclient", l: "Phone B", s: "dedupes by id", col: 4, row: 0, r: "client" },
        { id: "registry", l: "Session registry", s: "user to server, TTL", col: 2, row: 1, r: "cache" },
        { id: "msgdb", l: "Message store", s: "unique on (to, msg_id)", col: 3, row: 1, r: "store" }
      ],
      edges: [
        { a: "client", b: "lb" }, { a: "lb", b: "chat" },
        { a: "chat", b: "registry", l: "where is B?" },
        { a: "chat", b: "msgdb", l: "insert", bend: 0.35 },
        { a: "chat", b: "peer", l: "forward" },
        { a: "peer", b: "peerclient", l: "push" },
        { a: "peerclient", b: "peer", l: "ack", async: true },
        { a: "peer", b: "chat", l: "delivered", async: true },
        { a: "chat", b: "client", l: "two ticks", async: true }
      ],
      add: [],
      say: "The client, not the server, generates the message id, as a UUID. That single decision makes every hop idempotent: the store insert is a no-op on a duplicate, the recipient drops an id it has already rendered, and the sender's retry after a timeout cannot create a second message. The network gives at-least-once, the id turns it into exactly once as the user experiences it, and nowhere in the system did anyone need a distributed transaction.",
      breaks: "A message to a group of 256 people is one send and 255 deliveries. Doing that inline on the sender's chat server means one person's thumb causes 255 registry lookups and 255 forwards before their message shows as sent." },

    { t: "4. Groups, which are fan-out wearing a hat",
      pressure: "Write amplification. Groups are where a chat system's load actually comes from, and where doing the obvious thing on the request path makes the sender wait for everybody else's delivery.",
      nodes: [
        { id: "client", l: "Phone A", col: 0, row: 0, r: "client" },
        { id: "lb", l: "Connection LB", col: 1, row: 0, r: "edge" },
        { id: "chat", l: "Chat server, A's", s: "accept and ack fast", col: 2, row: 0, r: "svc" },
        { id: "fanout", l: "Fan-out workers", s: "one message to N inboxes", col: 3, row: 0, r: "work" },
        { id: "peer", l: "Chat servers", s: "hold the recipients", col: 4, row: 0, r: "svc" },
        { id: "peerclient", l: "Member devices", col: 5, row: 0, r: "client" },
        { id: "registry", l: "Session registry", s: "user to server, TTL", col: 2, row: 1, r: "cache" },
        { id: "groupdb", l: "Group membership", s: "group to member list", col: 3, row: 1, r: "store" },
        { id: "msgdb", l: "Message store", s: "inbox per recipient", col: 4, row: 1, r: "store" }
      ],
      edges: [
        { a: "client", b: "lb" }, { a: "lb", b: "chat" },
        { a: "chat", b: "fanout", l: "event", async: true },
        { a: "chat", b: "registry", l: "lookup" },
        { a: "fanout", b: "groupdb", l: "who is in it", bend: 0.35 },
        { a: "fanout", b: "msgdb", l: "N inserts", bend: 0.8 },
        { a: "fanout", b: "peer", l: "N pushes" },
        { a: "peer", b: "peerclient" }
      ],
      add: ["fanout", "groupdb"],
      say: "The sender's server stores one copy and acknowledges immediately, then hands one event to a fan-out worker. The worker expands the membership and writes one inbox row per recipient. The sender's latency is now independent of group size, which is the entire point. Two hundred and fifty six is small enough that fan-out on write is right; if this were a broadcast channel with a million subscribers, I would flip to a shared log the readers pull from, and I would say so before being asked.",
      breaks: "People have more than one device, they expect the same conversation on all of them, and they expect a green dot next to their friends' names. Presence in particular is a trap: implemented as a database write it is the highest write rate in the system, for the least valuable data in the system." },

    { t: "5. Multiple devices, presence, and getting media out of the path",
      pressure: "Three product features that each want to sneak load onto the message path: a second device multiplies fan-out, presence is a firehose of unimportant writes, and a 20 MB video would otherwise travel through a process tuned for 1 KB frames.",
      nodes: [
        { id: "client", l: "Phone A", s: "plus laptop, plus tablet", col: 0, row: 0, r: "client" },
        { id: "lb", l: "Connection LB", col: 1, row: 0, r: "edge" },
        { id: "chat", l: "Chat server, A's", col: 2, row: 0, r: "svc" },
        { id: "fanout", l: "Fan-out workers", s: "per device, not per user", col: 3, row: 0, r: "work" },
        { id: "peer", l: "Chat servers", col: 4, row: 0, r: "svc" },
        { id: "peerclient", l: "Member devices", col: 5, row: 0, r: "client" },
        { id: "blob", l: "Media blob store", s: "presigned, out of band", col: 0, row: 1, r: "store" },
        { id: "registry", l: "Session registry", s: "device to server", col: 2, row: 1, r: "cache" },
        { id: "groupdb", l: "Group membership", col: 4, row: 1, r: "store" },
        { id: "presence", l: "Presence", s: "heartbeat, Redis TTL", col: 3, row: 2, r: "cache" },
        { id: "msgdb", l: "Message store", s: "inbox per device", col: 4, row: 2, r: "store" }
      ],
      edges: [
        { a: "client", b: "lb" }, { a: "lb", b: "chat" },
        { a: "chat", b: "fanout", l: "event", async: true },
        { a: "chat", b: "registry", l: "lookup" },
        { a: "chat", b: "presence", l: "heartbeat", bend: 0.82, async: true },
        { a: "fanout", b: "groupdb", l: "members", bend: 0.32 },
        { a: "fanout", b: "msgdb", l: "N rows", bend: 0.68 },
        { a: "fanout", b: "peer" },
        { a: "peer", b: "peerclient" },
        { a: "client", b: "blob", l: "upload direct", async: true }
      ],
      add: ["presence", "blob"],
      say: "A device, not a user, is the unit of delivery: the registry keys on device id, the inbox keys on device id, and a message is acknowledged per device. Presence never touches a database, it is a key in Redis with a thirty second TTL refreshed by a heartbeat, so absence of the key is absence of the person and nothing has to be written when somebody leaves. Media goes to blob storage over a presigned URL and only the pointer travels through the chat path, because the chat path is tuned for a kilobyte." }
  ],

  boxesIntro: "Eleven components. The unusual ones here are the two that most designs do not have: a front tier that is stateful on purpose, and a registry whose entire job is to answer one question quickly and be allowed to be slightly wrong.",

  boxes: [
    { id: "client", n: "The sending device", r: "client",
      job: "Holds one long lived connection, generates the message id, retries until acknowledged.",
      why: "It is drawn because it does real work in this design. The exactly once property is manufactured here, not on the server, and that is the part interviewers are listening for.",
      forced: "The duplicate problem in stage 3. Any id the server generates arrives too late to make the client's retry idempotent.",
      alts: [["Server generated message ids", "the reflex, and it breaks the retry case: the client times out, resends, the server mints a second id, and the user sees their message twice."], ["A sequence number per client", "works, and it makes multiple devices for one user harder, because two devices would have to agree on the sequence. A UUID sidesteps the coordination entirely."]],
      pros: ["Retries become free and safe, at every layer, all the way to the recipient's renderer.", "The client can queue outbound messages while offline and drain them in order later.", "No coordination anywhere in the system for identity of a message."],
      cons: ["You are trusting the client to produce unique ids, so a buggy client can collide with itself.", "The client now holds real state, and client state is the state you cannot fix with a deploy."],
      cost: "Sixteen bytes per message, and a small outbox on the device.",
      fails: "A client with a broken clock or a bad random source generates a duplicate id, and the server treats a genuinely new message as a duplicate and silently drops it. Scope ids per sender so a collision can only ever affect one conversation.",
      say: "The client picks a UUID for every message and retries with it until acknowledged. That one choice is what makes at-least-once delivery look like exactly once, and it costs sixteen bytes." },

    { id: "lb", n: "Connection load balancer", r: "edge",
      job: "Place a new connection on a chat server and then get out of the way for the next several hours.",
      why: "Something must spread a hundred million connections over a thousand servers, and it has to balance on connection count rather than on requests per second, because connections here live for hours.",
      forced: "Stage 2, the moment there was more than one chat server.",
      alts: [["A normal layer 7 HTTP load balancer", "designed for short requests and will happily give you a badly skewed distribution when connections are long lived. It also terminates and re-establishes in ways that are hostile to WebSockets."], ["Direct DNS to chat servers", "no health awareness, and a restarted server takes a DNS TTL to disappear, during which every reconnect fails."]],
      pros: ["Least connections balancing keeps the tier even, which matters because a hot server is a memory problem and not a CPU one.", "It is the natural place to shed load during a reconnect storm."],
      cons: ["It is in the path of every connect, so a deploy of it is a reconnect event for whoever it drops.", "Long lived connections make draining slow: you cannot finish a deploy until the last socket leaves or is forced off."],
      cost: "Cheap per connection, expensive in operational care. Connection tiers are the ones you get paged about.",
      fails: "A datacentre blip disconnects a million clients at once, they all reconnect within a second, and the reconnect storm takes down the tier that was fine a moment ago. Mitigate with jittered exponential backoff in the client, which is again the client doing the important work.",
      say: "Balance on connection count, not requests. Drain slowly. And put backoff with jitter in the client, because the failure mode here is not a server dying, it is a million clients coming back at the same instant." },

    { id: "chat", n: "Chat server", r: "svc",
      job: "Hold about a hundred thousand sockets, accept messages, make them durable, and push what it can.",
      why: "Somebody has to own the connection. This tier is stateful in a way the rest of the industry spends its life avoiding, and pretending otherwise is how candidates get lost in this problem.",
      forced: "The push requirement. If the server cannot initiate, the client has to poll, and polling at this scale costs more than the messages do.",
      alts: [["HTTP long polling", "the fallback that works everywhere, including behind hostile corporate proxies. Higher latency and far more overhead per message. Real products ship both and prefer the socket."], ["Push notifications only, no socket", "genuinely how a backgrounded phone works, and it is a fallback rather than the design: notification services are best effort and rate limited."], ["A stateless tier with the socket held in a sidecar", "moves the state rather than removing it, and adds a hop to the hottest path in the system."]],
      pros: ["Sub hundred millisecond delivery when both parties are connected, because the socket is already open.", "A message to a connected user costs one map lookup and one write.", "Backpressure is natural: a slow client fills its own socket buffer and nobody else's."],
      cons: ["Restarting one box disconnects a hundred thousand people, so deploys are a genuine engineering problem rather than a routine.", "Memory bound, not CPU bound, which means the usual autoscaling signals are the wrong ones.", "It holds state, so it needs the registry, and the registry can be wrong."],
      cost: "About a thousand boxes at a hundred thousand sockets each. Each socket is a file descriptor, a couple of buffers and a small amount of bookkeeping, so this is a memory and kernel tuning exercise.",
      fails: "A box dies with a hundred thousand sockets. Those clients reconnect and land elsewhere, the registry entries expire on their TTL, and messages forwarded in the gap fall back to the inbox and are delivered on reconnect. Nothing is lost, provided the store came before the push.",
      say: "Stateful on purpose. The two rules that keep it sane: durable before acknowledged, and never let a delivery attempt block the sender's response." },

    { id: "peer", n: "The recipient's chat server", r: "svc",
      job: "The same binary, drawn twice, because the interesting arrow is the one between two instances of it.",
      why: "It is on the diagram to make the routing visible. A single box labelled chat server hides the fact that a message crosses from one process to another, and that crossing is where the duplicates come from.",
      forced: "Stage 2. Drawing one box would have let you skip the entire routing conversation, which is the conversation.",
      alts: [["Server to server forwarding, as drawn", "one hop, lowest latency, and every server needs a connection pool to every other server. At a thousand servers that is a lot of connections, but they are cheap and idle."], ["A pub-sub topic per user that servers subscribe to", "removes the registry, and adds a broker in the path of every message plus a subscription churn problem as users connect and disconnect."], ["Routing every message through a central bus", "simple to draw, and it puts one system in the path of a million deliveries per second."]],
      pros: ["One network hop between sender and recipient.", "No broker to operate on the hot path.", "Failure is local: if the peer is unreachable, the message is already durable and waits in the inbox."],
      cons: ["A full mesh of connections between a thousand servers, which is fine but has to be managed.", "Every server needs the registry to be roughly correct."],
      cost: "One internal RPC per delivery. At 1.2 million deliveries per second this is the busiest arrow on the diagram.",
      fails: "The registry says B is on server 412, and B moved to server 88 a second ago. Server 412 has no such socket, so it does nothing, and the message is delivered from the inbox when B's new connection asks for anything after its last sequence number. A stale registry costs latency, never correctness, and that is by design.",
      say: "It is the same service. I am drawing it twice because the message crosses a process boundary, and that boundary is where every hard problem in this design lives." },

    { id: "peerclient", n: "The receiving device", r: "client",
      job: "Drains its inbox on connect, renders in sequence order, deduplicates by message id, and acknowledges.",
      why: "The last two guarantees in the requirements, no duplicates and correct order, are enforced here rather than on the server, because only the device knows what it has already shown a human.",
      forced: "Stage 3. The server cannot know whether a delivery reached the screen; only an acknowledgement from the device can say that.",
      alts: [["Trusting the server to deliver exactly once", "requires a distributed transaction across a network the user is holding in their hand and walking into a lift with. Not available."]],
      pros: ["A tiny set of seen ids on the device removes duplicates for free.", "Ordering by conversation sequence number rather than by arrival makes out of order delivery invisible.", "Acknowledgement is what lets the server delete, which is what keeps storage at 40 GB."],
      cons: ["Client bugs become server storage problems: a device that never acknowledges keeps its inbox forever.", "Every platform needs the same logic implemented correctly, three times."],
      cost: "A bounded set of recent ids and one sequence number per conversation.",
      fails: "A device is reinstalled and acknowledges nothing, so its inbox grows without limit. Cap the inbox by age and size, and treat exceeding it as an explicit resync rather than an error nobody notices.",
      say: "Deduplicate on the device, order by the conversation sequence, and let the acknowledgement be what deletes the row. The server's job is to be safe to retry against." },

    { id: "registry", n: "Session registry", r: "cache",
      job: "Answer one question, which server holds this device's socket, in under a millisecond.",
      why: "With a thousand servers, delivery is a routing problem, and routing needs a directory. It is written on connect, deleted on disconnect, and expired by TTL when a server dies without cleaning up.",
      forced: "Stage 2. With one server the answer was always the same, and the box did not need to exist.",
      alts: [["Consistent hashing from user id to server", "no registry at all, and it breaks the moment a server is added, removed or restarted, because every affected user's socket is on the wrong box and they have not reconnected yet."], ["A database table", "durable, and durability is worthless for data that is invalidated by a TCP disconnect. You would be paying for writes to disk about connections that live for minutes."], ["Broadcasting to all servers and letting the right one answer", "no directory to keep correct, and it turns every delivery into a thousand messages."]],
      pros: ["Sub millisecond, and it is allowed to be wrong, which is a rare and valuable combination.", "TTL cleans up after a crashed server without any coordination.", "Small: a hundred million entries of a few bytes is a shardable Redis cluster, not a project."],
      cons: ["It is in the path of every message, so its availability matters more than its contents do.", "Churn is high: every connect and disconnect is a write, and mobile clients disconnect constantly."],
      cost: "Roughly 100 million small entries, and a write rate driven by connection churn rather than by message volume.",
      fails: "It is unavailable. Delivery falls back to leaving messages in the inbox, and everything becomes slow instead of wrong. That fallback existing is the reason this box is a cache and not a database.",
      say: "Redis, keyed by device id, value is the server, thirty second TTL refreshed by the server holding the socket. It is allowed to be stale, because a stale answer costs one delayed message and never a lost one." },

    { id: "msgdb", n: "Message store", r: "store",
      job: "Hold messages that have not been acknowledged yet, ordered per conversation, keyed so that inserting twice is harmless.",
      why: "The recipient is offline most of the time, and durability has to come before the sender is told the message was sent.",
      forced: "Stage 1. Everything else in this design is about speed; this box exists purely so nothing is lost.",
      alts: [["Keeping full history on the server", "a different product and a different company: seven petabytes a year, a search problem, and a legal team. Ask which one you are building."], ["A queue per user rather than a table", "conceptually the same thing, and queues are usually bad at the two operations you need most here: read from a position, and delete a specific message."], ["Cassandra or DynamoDB partitioned by recipient", "the right shape at scale. Partition key is the recipient, clustering key is the sequence, which makes the drain a single ordered range scan."]],
      pros: ["The drain on reconnect is one range scan from the last acknowledged sequence.", "A unique key on (recipient, message id) makes the insert idempotent, so retries cost nothing.", "Deleting on acknowledgement keeps it two orders of magnitude smaller than a history store."],
      cons: ["The write rate is the fan-out rate, over a million per second, which is a real database load even for small rows.", "Deletes at that volume are their own problem: use a TTL or a partition drop rather than row by row deletion."],
      cost: "About 40 GB live, at over a million writes and a million deletes per second. The size is trivial and the write rate is not.",
      fails: "A device stops acknowledging and its partition grows without bound. Cap by age, and make exceeding the cap trigger a full resync on the device rather than an unbounded partition nobody is watching.",
      say: "Partition by recipient device, cluster by sequence, unique on message id, TTL as a backstop. It is not a history store, it is a waiting room, and saying that is what keeps the storage estimate honest." },

    { id: "fanout", n: "Fan-out workers", r: "work",
      job: "Turn one group message into one inbox row and one push per recipient device.",
      why: "A group of 256 with two devices each is 512 deliveries. Doing that on the sender's request path makes their latency a function of how many friends they have.",
      forced: "Stage 4. One to one messages never needed this box, and adding it earlier would have been infrastructure looking for a problem.",
      alts: [["Fanning out inline on the sender's chat server", "fine for a group of five, and it makes the send latency proportional to group size, which is exactly the wrong shape."], ["A shared group log that members pull from", "the right answer above a few thousand members, since it writes once instead of N times. It costs the reader a poll or a subscription, and for small groups it is more machinery for less benefit."], ["Hybrid, push for small groups and pull for large ones", "what a mature system ends up doing, and the answer to give when the interviewer says the group has a million members."]],
      pros: ["The sender is acknowledged before any of the fan-out happens.", "Fan-out is retryable and parallel, and a slow recipient slows nobody else.", "Backlog is visible as consumer lag, which is a metric you can alert on."],
      cons: ["Write amplification is real: one message becomes hundreds of rows.", "It is asynchronous, so a member can be shown as having received a message slightly before the row exists, unless the ticks are driven by acknowledgements."],
      cost: "About 1.2 million deliveries per second at peak, which is the largest single load in the design.",
      fails: "A very large group turns one send into a burst that starves the workers handling everyone else. Isolate by partitioning the work queue on group size, so an enormous group cannot occupy the same workers as a family chat.",
      say: "Fan-out on write for groups up to a few hundred, and I would switch to a shared log the readers pull from somewhere in the low thousands. The crossover is a number I would measure, not guess." },

    { id: "groupdb", n: "Group membership", r: "store",
      job: "Say who is currently in a group, and who was in it when a given message was sent.",
      why: "Fan-out needs the member list, and it needs it to be right, because being added to a group should not retroactively show you a year of other people's messages.",
      forced: "Stage 4. It looks like a small lookup table and it carries a genuinely awkward requirement about time.",
      alts: [["Denormalising the member list into every message", "removes the lookup and makes leaving a group a rewrite of history."], ["Keeping membership only on the client", "how end to end encrypted groups partly work, and it means the server cannot fan out at all, which changes the whole design."]],
      pros: ["Small, cacheable, and read far more often than written.", "Membership changes are rare compared to messages, so caching it aggressively is safe."],
      cons: ["Membership at a point in time is a versioning problem hiding in a lookup table.", "It is read on every single group message, so it must never be slow."],
      cost: "Tiny in bytes, very hot in reads. Cache it next to the fan-out workers.",
      fails: "A member is removed while a fan-out is in flight and receives one last message. Decide explicitly whether that is acceptable, say so, and if it is not, capture the membership version with the message.",
      say: "Cached hard, invalidated on membership change, and the message carries the membership version it was fanned out against, so joining a group never shows you the past." },

    { id: "presence", n: "Presence", r: "cache",
      job: "Answer whether someone is online, and when they were last seen.",
      why: "It is the highest write rate for the least valuable data in the system, so it gets a mechanism chosen for cheapness rather than correctness.",
      forced: "Stage 5. It is drawn separately because the naive implementation, a row update per state change, would outweigh the messaging load.",
      alts: [["A last_seen column updated on every action", "correct, and it is a database write every time somebody scrolls. This is the version that shows up in a postmortem."], ["Pushing every presence change to every contact", "quadratic in contacts, and nobody is watching most of those dots."]],
      pros: ["A key with a TTL means offline requires no write at all: the key simply stops existing.", "Heartbeats are cheap and self healing after a crash.", "Subscribing only to the contacts currently on screen bounds the fan-out to what a user can actually see."],
      cons: ["Last seen is approximate to within the heartbeat interval, which is fine and will still generate a bug report.", "Presence is a privacy surface, so it needs per user visibility rules."],
      cost: "One small key per online device, refreshed every thirty seconds. About 100 million keys and 3 million refreshes per second, which is a Redis cluster's normal day.",
      fails: "A network partition makes everybody appear offline at once. Because absence is inferred from an expired key rather than written, the state repairs itself as soon as heartbeats resume.",
      say: "A Redis key per device with a thirty second TTL, refreshed by heartbeat. Offline is the absence of a key, so going offline costs zero writes. And I would only push presence for the conversations currently on the user's screen." },

    { id: "blob", n: "Media blob store", r: "store",
      job: "Hold photos and videos. The chat path carries only a pointer and a decryption key.",
      why: "The chat tier is tuned for one kilobyte frames on a socket held open for hours. A 20 MB video pushed through it would occupy a connection for a minute and stall everything else on that box.",
      forced: "Stage 5, and it is the same rule as every other design on this page: bytes go direct to object storage, metadata goes through the API.",
      alts: [["Streaming media through the chat servers", "one code path, and it puts a large slow transfer inside a process whose whole job is small fast frames."], ["Base64 inside the message body", "increases the payload by a third and puts a video into a message store sized for text."]],
      pros: ["Upload and download run at the object store's speed, in parallel with messaging.", "The encrypted blob can be shared by every recipient of a group message, so one upload serves 256 downloads.", "The chat tier stays predictable, which is what lets it hold a hundred thousand sockets."],
      cons: ["A second transport with its own auth story, presigned and short lived.", "Lifecycle is genuinely hard: when may a blob be deleted, given that a recipient may have been offline for a month?"],
      cost: "The dominant byte cost of the entire product, and almost none of it flows through anything you wrote.",
      fails: "The blob is deleted while a recipient is still offline, and they come back to a broken image. Tie retention to the longest inbox retention, not to the moment the first recipient downloads it.",
      say: "The sender encrypts once, uploads to blob storage, and the message carries a pointer plus the key. Every recipient downloads the same object. Nothing large ever touches the socket tier." }
  ],

  flowsIntro: "Two paths, and the second one is the one people forget: the reconnect. Most of a chat system's correctness lives in what happens when a device that has been off for a day comes back.",

  flows: [
    { n: "Both people online",
      steps: [
        ["Phone A generates a UUID, sends the encrypted body over its open socket, and starts a retry timer.", "sync"],
        ["A's chat server inserts into the store, keyed on (recipient device, message id) so a retry is a no-op.", "sync"],
        ["It acknowledges to A. One tick. This is the only promise the server has made, and it is a promise about durability, not delivery.", "sync"],
        ["It looks up B's devices in the registry and forwards to each holding server.", "async"],
        ["B's server writes the frame to B's socket. B's device deduplicates by id, renders in sequence order, and acknowledges.", "async"],
        ["The acknowledgement deletes the inbox row and travels back to A as two ticks. Read receipts are the same path with a different event.", "async"]
      ] },
    { n: "The recipient has been offline since Tuesday",
      note: "This path is the reason the store exists, and it is where ordering and duplicate suppression are actually exercised.",
      steps: [
        ["Messages arrived while B was gone. Each one was stored and each forward attempt found nothing in the registry, so nothing happened and nothing failed.", "async"],
        ["B's device reconnects. The load balancer places it on whichever server is least loaded, which will not be the previous one.", "sync"],
        ["The server writes B's device into the registry with a TTL, and B sends the last sequence number it has for each conversation.", "sync"],
        ["The server range scans the inbox from that sequence and streams the backlog in order, in batches, so a month of messages does not arrive as one enormous frame.", "sync"],
        ["B acknowledges in batches. Each acknowledgement deletes rows and releases two ticks to the senders, some of whom have not been online for days themselves.", "async"]
      ] },
    { n: "A group message",
      steps: [
        ["A sends once. Their server stores one copy, acknowledges, and publishes a single fan-out event.", "sync"],
        ["A worker reads the membership, which is almost always a cache hit, and expands to devices rather than users.", "async"],
        ["It writes one inbox row per device and pushes to each device that the registry says is connected.", "async"],
        ["Each device acknowledges independently. The sender's ticks are driven by the slowest recipient, which is why group ticks feel different from one to one ticks.", "async"]
      ] }
  ],

  api: [
    ["WS connect /v1/socket", "stream of frames", "Authenticated once at connect rather than per message. The connection, not the request, is the unit of authorisation, which is the structural difference from every REST design."],
    ["SEND {to, msg_id, body}", "ack {seq}", "msg_id is chosen by the client. The server returns the conversation sequence number, which is what ordering is based on."],
    ["ACK {msg_ids}", "none", "Batched. Every acknowledgement deletes an inbox row, so this is also the storage control mechanism."],
    ["SYNC {conversation, after_seq}", "batched backlog", "The reconnect path. Everything after a sequence number the device already has, so it is idempotent and safely retried."],
    ["POST /v1/media/upload-url", "presigned PUT", "Bytes never travel over the socket. The message carries a pointer and a key."]
  ],
  apiNote: "Notice there is no <code>GET /messages</code>. History lives on the device, and the server holds only what has not been delivered. That single absence is the product decision the storage estimate depended on.",

  schema: { n: "The inbox, and what it deliberately is not", lang: "text",
    note: "This is a waiting room, not an archive. Every field exists to support one of exactly two operations: drain from a position, and delete on acknowledgement.",
    code:
"inbox                       partition key: to_device\n" +
"  to_device    uuid         clustering:   seq  (ordered scan on reconnect)\n" +
"  seq          bigint       per conversation, assigned by the server\n" +
"  msg_id       uuid         chosen by the sender, UNIQUE with to_device\n" +
"  from_user    uuid\n" +
"  body         blob         ciphertext, the server cannot read it\n" +
"  sent_at      timestamp    sender's clock, for display only, never for order\n" +
"  ttl          30 days      the backstop for a device that never comes back\n" +
"\n" +
"sessions        (Redis)   device_id -> server_id       TTL 30s, heartbeat\n" +
"presence        (Redis)   user_id   -> last_seen       TTL 30s, absence = offline\n" +
"groups                    group_id  -> members, version" },

  deep: [
    { n: "One tick, two ticks, blue ticks, and what each one actually promises",
      note: "Every tick is a different guarantee and they are earned at different places, which is why this makes such a good interview question. <b>One tick</b>: the server has the message durably. It says nothing about the recipient, who may be on a plane. <b>Two ticks</b>: the recipient's device acknowledged receipt, which is the only acknowledgement that can delete the inbox row. <b>Blue ticks</b>: the recipient's app rendered it to a human, which is a product event the device chooses to send and a privacy setting can suppress.<br><br>The useful observation is that the ticks are acknowledgements travelling backwards along the same path the message travelled forwards, and that each one is generated by the only party that can honestly generate it. If your design has the server producing two ticks, the server is lying, and somebody will notice on a train." },

    { n: "Ordering, and why timestamps are the wrong tool",
      note: "Two devices, two clocks, two network paths. If you order by the sender's timestamp, a phone with a clock five minutes fast puts its messages in the future of the conversation forever. If you order by server arrival time, two messages accepted by different servers in the same millisecond have no defined order and two recipients can see them differently.<br><br>The fix is a per conversation sequence number assigned by a single owner of that conversation. For one to one chat, deterministically pick an owner from the pair of user ids, so both directions go through the same assigner. For a group, the group is the owner. This is a small amount of coordination in exchange for a total order within a conversation, and it is the only place in the design where anything is serialised. Global ordering across conversations is not required by anybody, and buying it would cost far more than it is worth." },

    { n: "The reconnect storm, which is how this system actually falls over",
      note: "The failure that takes down a chat system is rarely a message rate. It is a hundred thousand or a million clients reconnecting at once after a network event, each one authenticating, writing a registry entry, and asking for its backlog. That is a spike of expensive operations, and the natural client behaviour, reconnect immediately, makes it worse each time it fails.<br><br>Three defences, and they are mostly in the client. Exponential backoff <i>with jitter</i>, so retries spread out instead of arriving in waves. A cap on the sync batch, so a device with a month of backlog does not ask for all of it in one request. And admission control at the connection tier, which sheds connects rather than accepting them and failing halfway, because a rejected connect costs everyone far less than a half established one." },

    { n: "What end to end encryption deletes from the diagram",
      note: "If the server cannot read the message, several boxes people habitually draw become impossible. There is no server side search, so search is on device and only over what that device has. There is no content based spam filtering, so abuse has to be handled with metadata and reports. There is no server side link preview, so the client fetches it and leaks the link to the previewer instead. Backup becomes a key management problem rather than a storage one, and multi device becomes a key distribution problem rather than a fan-out one.<br><br>Say this out loud even if encryption is out of scope. Naming the boxes a constraint removes shows a different kind of understanding than adding boxes does, and it is the fastest way to demonstrate that you know what encryption costs rather than just that it is good." }
  ],

  tradeoffsIntro: "Chat has unusually sharp trade-offs because the product decisions move the infrastructure by orders of magnitude. These four are the ones worth having an opinion about.",

  tradeoffs: [
    { a: ["Delete on delivery", "The server is a waiting room. About 40 GB live, no history problem, no search problem, and a phone loss means the history is gone."],
      b: ["Keep full history server side", "Seven petabytes a year, search, multi device sync for free, and a legal and privacy surface that never shrinks."],
      pick: "a",
      flip: "the product is a workplace tool. Slack and Teams keep everything, because compliance requires it and history is the feature people pay for. This one question changes the storage answer by two hundred times, so ask it in the first two minutes." },
    { a: ["Persistent WebSocket", "Server can push. Sub hundred millisecond delivery, one connection per device, and a stateful tier that is hard to deploy."],
      b: ["Polling or push notifications only", "Stateless and trivial to operate. Latency measured in seconds, and battery and bandwidth spent asking a question whose answer is usually no."],
      pick: "a",
      flip: "the app is in the background, where the operating system will close your socket anyway and a push notification is the only channel you have. Real clients run both and switch, which is worth saying rather than pretending the socket is always there." },
    { a: ["Fan-out on write to per device inboxes", "Reads are trivial. One send becomes hundreds of writes, which is fine at 256 members."],
      b: ["A shared group log that readers pull from", "One write regardless of group size. Every reader now has to poll or subscribe, and unread counts get harder."],
      pick: "a",
      flip: "groups become broadcast channels with tens of thousands of members. Then writing a row per member is absurd and the log wins. A mature product runs both and picks by group size." },
    { a: ["Client generated message ids", "Every hop is idempotent, retries are free, and exactly once is a client side property."],
      b: ["Server generated ids with server side deduplication", "The server controls uniqueness, and it cannot deduplicate the retry that arrives before the first response was seen."],
      pick: "a",
      flip: "never, for the message id. The wider lesson generalises: whenever a retry can happen, the identity of the request must be chosen by whoever will do the retrying." }
  ],

  next: [
    "<b>Multi region.</b> Pin a conversation's ordering to one region and replicate the inbox asynchronously. Cross region delivery is then a forward, not a consensus problem.",
    "<b>Backpressure per conversation.</b> Today one enormous group can crowd the fan-out workers. Partition the work by group size so a family chat is never behind a broadcast channel.",
    "<b>Message expiry and disappearing messages.</b> Mostly a client feature, and it needs a server side TTL that survives a device that never comes back.",
    "<b>Abuse handling without reading content.</b> Rate limits, graph signals and reports, since encryption has removed every content based option."
  ],

  p: [
    ["HI", "https://www.hellointerview.com/learn/system-design/problem-breakdowns/whatsapp", "Hello Interview, WhatsApp", "H"],
    ["GFG", "https://www.geeksforgeeks.org/system-design/designing-whatsapp-messenger-system-design/", "GFG, design WhatsApp", "H"],
    ["GFG", "https://www.geeksforgeeks.org/system-design/design-facebook-messenger-system-design-interview/", "GFG, Facebook Messenger", "H"],
    ["DG", "https://www.designgurus.io/course-play/grokking-the-system-design-interview/doc/design-facebook-messenger", "Design Gurus, Messenger", "H"],
    ["BB", "https://blog.bytebytego.com/p/ep141-a-cheatsheet-on-system-design", "ByteByteGo, the HLD cheatsheet", "E"]
  ],

  hi: {
    one: "Chat database ki problem nahi hai, connection ki problem hai. Poora design teen sawaalon par tika hai: is user ka socket kahan hai, jab socket hi na ho to message ka kya hota hai, aur ek hi message do baar dikhane ya kho dene se kaise bachein.",

    brief: {
      why: "Lagbhag har koi is problem ko database draw karke shuru karta hai, aur lagbhag har koi phir atak jaata hai, kyunki jo state matter karti hai woh disk par nahi hai. Woh 100 million khule TCP connections hain, aur asli sawaal yeh hai ki jo connection aapko chahiye use kaunsa process hold kar raha hai. Yeh clear ho jaaye to baaki, storage, ordering, groups, apne aap follow karta hai. Ek aur baat jo shuru mein establish karni chahiye, kyunki woh numbers ko do orders of magnitude badal deti hai: kya server aapki history rakhta hai, ya har message deliver hote hi delete kar deta hai?",
      functional: [
        "<b>One to one send aur receive.</b> Message doosre insaan ke device tak pahunchta hai, aur sender ko sent, delivered aur read states dikhte hain.",
        "<b>Offline hone ko survive karna.</b> Band phone ko bheja gaya message phone wapas on hone par sahi order mein, bina duplicates ke, pahunchna chahiye.",
        "<b>Group chat</b> 256 members tak, jo wahi problem hai jo multiply ho gayi, aur yahin write amplification rehti hai.",
        "<b>Presence.</b> Online aur last seen, jo trivial lagta hai aur agar naively implement karo to system ka sabse zyada write rate wala hissa hai."
      ],
      out: ["voice aur video calls", "stories", "payments", "key exchange protocol khud", "spam aur abuse tooling"],
      nfr: [
        ["Delivery latency", "p99 under 500 ms", "Dono parties online. Log bursts mein type karte hain aur turant padhte hain; isse slow ho to lagta hai app kharab hai, network nahi."],
        ["Durability", "never lose an accepted message", "Server ne message acknowledge kar diya, to use kho dena messaging product ka ekmaatra unrecoverable bug hai. Yahi dono sockets ke beech ek store rakhne par majboor karta hai."],
        ["Ordering", "per conversation, same on every device", "Messages out of order aayein to behes bakwaas ban jaati hai. Dhyan do ki yeh per conversation hai, global nahi, isi wajah se achievable hai."],
        ["Duplicates", "never shown to the user", "Network zyada se zyada at-least-once deta hai, isliye exactly once ko edges par manufacture karna padta hai, ek aise id se jo client ne khud chuna ho."],
        ["Confidentiality", "the server never sees plaintext", "End to end encryption koi bolt-on feature nahi, ek constraint hai jo diagram se poore boxes delete kar deta hai: koi server side search nahi, koi server side previews nahi, koi content based spam filtering nahi."]
      ],
      numbers: [
        ["Daily actives", "500M", "Asli cheez ka scaled down par honest version. Apna assumption bolo, phir usi ke liye design karo."],
        ["Concurrent connections", "about 100M", "Lagbhag ek paanchva hissa daily actives kisi bhi waqt app ko foreground mein ya live push channel ke saath rakhta hai. Front tier ko size karne wala number yahi hai, QPS nahi."],
        ["Chat servers", "about 1,000", "100M sockets, har box par lagbhag 100,000. Ek socket ek file descriptor aur ek chhota buffer hai, isliye limit memory aur tuning ki hai, CPU ki nahi. Yeh number bolna hi dikhata hai ki aap samajhte ho yeh tier alag kyun hai."],
        ["Messages", "about 230k per second, peak 700k", "500M actives ko rozana 40 messages se multiply, 86,400 se divide, shaam ke peak ke liye teen se multiply."],
        ["Delivery events", "about 1.2M per second", "Group messages amplify karte hain. Har das mein ek message agar aise group ko jaye jisme average pachaas log hain, to har message lagbhag paanch deliveries ban jaata hai. Asli load fan-out hai, ingest nahi."],
        ["Undelivered storage", "about 40 GB", "Sirf woh messages jo offline device ka intezaar kar rahe hain. Agar 5% average ek ghanta wait karein, to yeh rounding error hai, aur yeh poori tarah neeche wale product decision ki wajah se hai."],
        ["If history were kept", "about 7 PB per year", "Rozana 20 billion messages, har ek 1 KB. Do sau guna storage, bilkul alag database, aur alag company. Kuch bhi draw karne se pehle poocho ki aap kaunsa product bana rahe ho."]
      ],
      numbersNote: "Do numbers zor se bolne layak hain: <b>100M concurrent sockets</b>, kyunki yahi front tier ko stateful aur unusual banata hai, aur <b>40 GB versus 7 PB</b>, kyunki ek akela product question storage ka jawab do orders of magnitude badal deta hai aur zyadatar candidates yeh poochte hi nahi."
    },

    stagesIntro: "Chhe stages. Dekho ki complexity asal mein kahan jama hoti hai: database mein nahi, balki yeh jaanne mein ki hazaar processes mein se kaunsa ek particular socket hold kar raha hai, aur us chhote protocol mein jo ek unreliable network ko aisi conversation bana deta hai jiske unreliable hone ka kisi ko pata nahi chalta.",

    stages: [
      { pressure: "Abhi kuch nahi. Dono log ek hi process se connected hon, yahin se shuru karo, kyunki us version mein routing problem hai hi nahi, aur routing hi poora design hone wali hai.",
        say: "Dono phones ek hi process se khula connection rakhte hain. Message ek map mein lookup aur ek socket par write hai, kahin koi storage nahi. Dhyan do ki connection long lived hai aur server push karta hai: yeh request and response nahi hai, aur chat ko is page ki baaki har cheez se alag karne wala ekmaatra structural fark yahi hai.",
        breaks: "Phone B ki screen off hai. Lookup kuch nahi deta, message gayab ho jaata hai, aur sender ne sirf ek tick dekha. Aisa koi acceptable product nahi jisme yeh ho." },

      { pressure: "Durability, aur yeh fact ki recipient din ka zyadatar hissa offline rehta hai. Sender ko batane se pehle message disk par safe hona chahiye.",
        say: "Operations ka order hi design hai. Store mein likho, phir sender ko acknowledge karo, phir push try karo. Agar push pehle karo aur store baad mein, to beech mein crash hone par aisa message kho jaata hai jise sender deliver hua maan raha hai. Jab Phone B reconnect karta hai, woh apne paas ka aakhri sequence number bata kar uske baad ka sab kuch maangta hai, drain karta hai, aur acknowledge karta hai. Acknowledge par row delete ho jaati hai, isiliye storage estimate 40 GB tha, 7 PB nahi.",
        breaks: "Ek process 100 million sockets hold nahi kar sakta, aur jaise hi do processes hue, Phone A ke process ko pata hi nahi ki Phone B ka socket kahan hai." },

      { pressure: "100 million concurrent connections, har box par lagbhag 100,000, yaani lagbhag hazaar boxes. Ab har message ek routing problem hai: hazaar mein se recipient ko kaunsa hold kar raha hai?",
        say: "Ek registry user id ko us server se map karti hai jo abhi woh socket hold kar raha hai. Connect par likhi jaati hai, disconnect par hataai jaati hai, aur ek chhote TTL ke saath, taaki crashed server ki entries apne aap expire ho jaayein. A ka server B ko lookup karta hai, internal connection par forward karta hai, aur B ka server socket par likhta hai. Agar lookup mein kuch na mile, to message inbox mein hi wait karta hai, jo offline case wala hi path hai aur isliye pehle se tested hai.",
        breaks: "Network us forward ko duplicate karega, ya store hone ke baad drop karega, ya jab retry ek slow acknowledgement se race kare to do baar deliver karega. Abhi user message do baar dekhta hai, jo late dekhne se bura hai." },

      { pressure: "Duplicates aur lost acknowledgements. Chat ka yeh ekmaatra sach mein subtle hissa hai, aur fix ek protocol hai, component nahi. Interview mein zor se bolne layak: har problem ek aur rectangle draw karke solve nahi hoti.",
        say: "Message id server nahi, client generate karta hai, UUID ke roop mein. Bas yahi ek decision har hop ko idempotent bana deta hai: duplicate par store insert no-op ho jaata hai, recipient woh id drop kar deta hai jo woh pehle hi render kar chuka hai, aur timeout ke baad sender ka retry doosra message nahi bana sakta. Network at-least-once deta hai, id use user ke experience mein exactly once bana deta hai, aur kahin bhi kisi ko distributed transaction ki zaroorat nahi padi.",
        breaks: "256 logon ke group ko ek message ek send aur 255 deliveries hai. Yeh sender ke chat server par inline karne ka matlab hai ki ek insaan ke angoothe se 255 registry lookups aur 255 forwards hote hain, uske pehle ki uska message sent dikhe." },

      { pressure: "Write amplification. Chat system ka asli load groups se aata hai, aur request path par obvious cheez karne se sender baaki sabki delivery ka intezaar karta hai.",
        say: "Sender ka server ek copy store karta hai aur turant acknowledge karta hai, phir ek event fan-out worker ko deta hai. Worker membership expand karta hai aur har recipient ke liye ek inbox row likhta hai. Sender ki latency ab group size se independent hai, jo poora point hai. 256 itna chhota hai ki fan-out on write sahi hai; agar yeh ek broadcast channel hota jisme ek million subscribers hote, to main ek shared log par flip karta jise readers pull karte, aur poochne se pehle yeh bol deta.",
        breaks: "Logon ke paas ek se zyada device hote hain, woh chahte hain ki sab par same conversation ho, aur woh apne doston ke naam ke paas ek green dot expect karte hain. Presence khaas taur par ek trap hai: database write ke roop mein implement karo to yeh system ka sabse zyada write rate hai, system ke sabse kam keemti data ke liye." },

      { pressure: "Teen product features jo har ek message path par load chupke se daalna chahte hain: doosra device fan-out multiply karta hai, presence unimportant writes ka firehose hai, aur 20 MB ka video warna aise process se guzarta jo 1 KB frames ke liye tune hai.",
        say: "Delivery ki unit user nahi, device hai: registry device id par key hoti hai, inbox device id par key hota hai, aur message har device par alag acknowledge hota hai. Presence kabhi database ko touch nahi karta, yeh Redis mein ek key hai jiska thirty second ka TTL heartbeat se refresh hota hai, isliye key ka na hona hi insaan ka na hona hai aur koi jaate waqt kuch likhna nahi padta. Media presigned URL se blob storage mein jaata hai aur chat path se sirf pointer guzarta hai, kyunki chat path ek kilobyte ke liye tune hai." }
    ],

    boxesIntro: "Gyarah components. Yahan ke unusual do hain jo zyadatar designs mein nahi hote: ek front tier jo jaan-boojhkar stateful hai, aur ek registry jiska poora kaam ek sawaal ka jaldi jawab dena hai aur thoda galat hone ki chhoot rakhna hai.",

    boxes: [
      { job: "Ek long lived connection hold karta hai, message id generate karta hai, acknowledge hone tak retry karta hai.",
        why: "Yeh isliye draw hua hai kyunki is design mein yeh asli kaam karta hai. Exactly once property yahan manufacture hoti hai, server par nahi, aur interviewers yahi hissa sunne ke liye baithe hote hain.",
        forced: "Stage 3 ki duplicate problem. Server jo bhi id generate kare woh client ke retry ko idempotent banane ke liye bahut der se aata hai.",
        alts: [["Server generated message ids", "reflex wala jawab, aur retry case mein toot jaata hai: client timeout hota hai, dobara bhejta hai, server doosra id banata hai, aur user ko apna message do baar dikhta hai."], ["A sequence number per client", "chalta hai, par ek user ke multiple devices ko mushkil bana deta hai, kyunki do devices ko sequence par agree karna padega. UUID coordination ko poori tarah side-step kar deta hai."]],
        pros: ["Retries free aur safe ho jaate hain, har layer par, recipient ke renderer tak.", "Client offline rehte hue outbound messages queue kar sakta hai aur baad mein order mein drain kar sakta hai.", "Message ki identity ke liye system mein kahin coordination nahi."],
        cons: ["Aap client par bharosa kar rahe ho ki woh unique ids banayega, isliye buggy client khud se collide kar sakta hai.", "Client ab asli state hold karta hai, aur client state woh state hai jo deploy se fix nahi hoti."],
        cost: "Har message ke liye solah bytes, aur device par ek chhota outbox.",
        fails: "Kharab clock ya bure random source wala client duplicate id banata hai, aur server ek sach mein naye message ko duplicate maan kar chupchaap drop kar deta hai. Ids ko per sender scope karo, taaki collision sirf ek conversation ko hi affect kar sake.",
        say: "Client har message ke liye UUID chunta hai aur acknowledge hone tak usi ke saath retry karta hai. Bas yahi ek choice at-least-once delivery ko exactly once jaisa dikhati hai, aur iski keemat solah bytes hai." },

      { job: "Naye connection ko ek chat server par rakho aur phir agle kai ghanton ke liye raaste se hat jao.",
        why: "Kisi ko 100 million connections ko hazaar servers par spread karna hai, aur balance connection count par hona chahiye, requests per second par nahi, kyunki yahan connections ghanton jeete hain.",
        forced: "Stage 2, jaise hi ek se zyada chat server hue.",
        alts: [["A normal layer 7 HTTP load balancer", "chhoti requests ke liye bana hai aur long lived connections mein badly skewed distribution khushi se dega. Yeh aise terminate aur re-establish karta hai jo WebSockets ke liye dushmani wala hai."], ["Direct DNS to chat servers", "health awareness nahi, aur restart hue server ko gayab hone mein ek DNS TTL lagta hai, jiske dauran har reconnect fail hota hai."]],
        pros: ["Least connections balancing tier ko even rakhta hai, jo matter karta hai kyunki hot server memory ki problem hai, CPU ki nahi.", "Reconnect storm ke dauran load shed karne ki natural jagah."],
        cons: ["Yeh har connect ke path mein hai, isliye iska deploy jise bhi yeh drop kare uske liye reconnect event hai.", "Long lived connections draining ko slow bana deti hain: aap deploy tab tak khatam nahi kar sakte jab tak aakhri socket chala na jaye ya force off na ho."],
        cost: "Per connection sasta, operational care mein mehnga. Connection tiers woh hain jinke liye aapko page aata hai.",
        fails: "Ek datacentre blip ek saath ek million clients ko disconnect kar deta hai, sab ek second ke andar reconnect karte hain, aur reconnect storm us tier ko gira deta hai jo abhi tak theek tha. Client mein jittered exponential backoff se mitigate karo, jo phir client ka hi important kaam hai.",
        say: "Connection count par balance karo, requests par nahi. Slowly drain karo. Aur client mein jitter ke saath backoff rakho, kyunki yahan failure mode server ka marna nahi hai, ek million clients ka ek hi instant mein wapas aana hai." },

      { job: "Lagbhag 100,000 sockets hold karna, messages accept karna, unhe durable banana, aur jo push ho sake woh push karna.",
        why: "Kisi ko connection own karna hai. Yeh tier us tarah stateful hai jisse bachne mein baaki industry apni zindagi laga deti hai, aur ulta pretend karna hi wajah hai ki candidates is problem mein kho jaate hain.",
        forced: "Push requirement. Agar server initiate nahi kar sakta, to client ko poll karna padta hai, aur is scale par polling messages se zyada mehngi padti hai.",
        alts: [["HTTP long polling", "fallback jo har jagah chalta hai, hostile corporate proxies ke peeche bhi. Zyada latency aur har message par kaafi zyada overhead. Real products dono ship karte hain aur socket ko prefer karte hain."], ["Push notifications only, no socket", "backgrounded phone sach mein aise hi kaam karta hai, aur yeh design nahi fallback hai: notification services best effort aur rate limited hoti hain."], ["A stateless tier with the socket held in a sidecar", "state ko hataata nahi, hila deta hai, aur system ke sabse hot path mein ek hop jodta hai."]],
        pros: ["Dono parties connected hon to sau millisecond se kam delivery, kyunki socket pehle se khula hai.", "Connected user ke message ki keemat ek map lookup aur ek write hai.", "Backpressure natural hai: slow client apna hi socket buffer bharta hai, kisi aur ka nahi."],
        cons: ["Ek box restart karne se 100,000 log disconnect hote hain, isliye deploys routine nahi, asli engineering problem hain.", "Memory bound hai, CPU bound nahi, matlab usual autoscaling signals galat hain.", "Yeh state hold karta hai, isliye registry chahiye, aur registry galat ho sakti hai."],
        cost: "Lagbhag hazaar boxes, har ek par 100,000 sockets. Har socket ek file descriptor, kuch buffers aur thoda bookkeeping hai, isliye yeh memory aur kernel tuning ka kaam hai.",
        fails: "Ek box 100,000 sockets ke saath mar jaata hai. Woh clients reconnect karke kahin aur land karte hain, registry entries apne TTL par expire hoti hain, aur beech ke gap mein forward hue messages inbox mein fall back karte hain aur reconnect par deliver hote hain. Kuch nahi khota, bashart store push se pehle aaya ho.",
        say: "Jaan-boojhkar stateful. Do rules jo ise sane rakhte hain: acknowledge se pehle durable, aur delivery attempt ko sender ke response ko kabhi block mat karne do." },

      { job: "Wahi binary, do baar draw hua, kyunki dilchasp arrow woh hai jo iske do instances ke beech hai.",
        why: "Yeh diagram par routing ko visible banane ke liye hai. Ek akela box jis par chat server likha ho yeh chhupa deta hai ki message ek process se doosre mein cross karta hai, aur duplicates isi crossing se aate hain.",
        forced: "Stage 2. Ek box draw karne se aap poori routing wali baat skip kar dete, jabki wahi baat asli baat hai.",
        alts: [["Server to server forwarding, as drawn", "ek hop, sabse kam latency, aur har server ko har doosre server tak connection pool chahiye. Hazaar servers par yeh bahut connections hain, par sasta aur idle."], ["A pub-sub topic per user that servers subscribe to", "registry hata deta hai, par har message ke path mein broker jodta hai aur users ke connect aur disconnect hone par subscription churn ki problem aati hai."], ["Routing every message through a central bus", "draw karna simple, aur yeh ek system ko prati second ek million deliveries ke path mein daal deta hai."]],
        pros: ["Sender aur recipient ke beech ek network hop.", "Hot path par chalane ko koi broker nahi.", "Failure local hai: peer unreachable ho to message pehle se durable hai aur inbox mein wait karta hai."],
        cons: ["Hazaar servers ke beech connections ka full mesh, jo theek hai par manage karna padta hai.", "Har server ko chahiye ki registry lagbhag sahi ho."],
        cost: "Har delivery par ek internal RPC. 1.2 million deliveries per second par yeh diagram ka sabse busy arrow hai.",
        fails: "Registry kehti hai B server 412 par hai, aur B ek second pehle server 88 par chala gaya. Server 412 ke paas aisa koi socket nahi, isliye woh kuch nahi karta, aur message inbox se tab deliver hota hai jab B ka naya connection apne aakhri sequence number ke baad ka kuch bhi maangta hai. Stale registry ki keemat latency hai, correctness kabhi nahi, aur yeh design se hai.",
        say: "Yeh wahi service hai. Main ise do baar draw kar raha hoon kyunki message ek process boundary cross karta hai, aur is design ki har mushkil problem usi boundary par rehti hai." },

      { job: "Connect par apna inbox drain karta hai, sequence order mein render karta hai, message id se dedupe karta hai, aur acknowledge karta hai.",
        why: "Requirements ki aakhri do guarantees, koi duplicates nahi aur sahi order, yahan enforce hoti hain, server par nahi, kyunki sirf device jaanta hai ki usne insaan ko pehle se kya dikha diya hai.",
        forced: "Stage 3. Server nahi jaan sakta ki delivery screen tak pahunchi ya nahi; yeh sirf device ka acknowledgement bata sakta hai.",
        alts: [["Trusting the server to deliver exactly once", "us network par distributed transaction maangta hai jo user haath mein pakde lift mein ghus raha hai. Available nahi hai."]],
        pros: ["Device par seen ids ka ek chhota set duplicates free mein hata deta hai.", "Arrival ke bajaye conversation sequence number se ordering out of order delivery ko invisible bana deti hai.", "Acknowledgement hi server ko delete karne deta hai, jo storage ko 40 GB par rakhta hai."],
        cons: ["Client bugs server ki storage problems ban jaate hain: jo device kabhi acknowledge nahi karta uska inbox hamesha rehta hai.", "Har platform ko wahi logic sahi implement karna padta hai, teen baar."],
        cost: "Recent ids ka ek bounded set aur har conversation ke liye ek sequence number.",
        fails: "Ek device reinstall hota hai aur kuch acknowledge nahi karta, to uska inbox bina limit badhta hai. Inbox ko age aur size se cap karo, aur cap paar hone ko explicit resync maano, aisi error nahi jise koi notice na kare.",
        say: "Device par dedupe karo, conversation sequence se order karo, aur acknowledgement ko hi woh cheez rehne do jo row delete kare. Server ka kaam hai ki us par retry karna safe ho." },

      { job: "Ek sawaal ka jawab dena, kaunsa server is device ka socket hold kar raha hai, ek millisecond se kam mein.",
        why: "Hazaar servers ke saath delivery routing problem hai, aur routing ko directory chahiye. Connect par likhi jaati hai, disconnect par delete hoti hai, aur jab koi server bina cleanup ke mar jaye to TTL se expire hoti hai.",
        forced: "Stage 2. Ek server ke saath jawab hamesha wahi tha, aur box ko exist karne ki zaroorat nahi thi.",
        alts: [["Consistent hashing from user id to server", "koi registry nahi, aur jaise hi server add, remove ya restart ho toot jaata hai, kyunki har affected user ka socket galat box par hai aur unhone abhi reconnect nahi kiya."], ["A database table", "durable, aur durability un data ke liye bekaar hai jo TCP disconnect se invalidate ho jaata hai. Aap minutes jeene wale connections ke liye disk writes ki keemat de rahe honge."], ["Broadcasting to all servers and letting the right one answer", "sahi rakhne ko koi directory nahi, aur yeh har delivery ko hazaar messages bana deta hai."]],
        pros: ["Sub millisecond, aur galat hone ki ijazat hai, jo rare aur keemti combination hai.", "TTL crashed server ke baad bina kisi coordination ke cleanup kar deta hai.", "Chhota: 100 million entries, har ek kuch bytes, ek shardable Redis cluster hai, project nahi."],
        cons: ["Yeh har message ke path mein hai, isliye iski availability iske contents se zyada matter karti hai.", "Churn high hai: har connect aur disconnect ek write hai, aur mobile clients lagataar disconnect hote hain."],
        cost: "Lagbhag 100 million chhoti entries, aur write rate jo message volume se nahi, connection churn se chalta hai.",
        fails: "Yeh unavailable hai. Delivery messages ko inbox mein chhodne par fall back karti hai, aur sab kuch galat hone ki jagah slow ho jaata hai. Yeh fallback ka hona hi wajah hai ki yeh box cache hai, database nahi.",
        say: "Redis, device id se keyed, value server hai, thirty second TTL jo socket hold karne wala server refresh karta hai. Stale hone ki ijazat hai, kyunki stale jawab ki keemat ek delayed message hai, kabhi lost message nahi." },

      { job: "Woh messages hold karna jo abhi acknowledge nahi hue, per conversation ordered, is tarah keyed ki do baar insert karna harmless ho.",
        why: "Recipient zyadatar waqt offline hai, aur sender ko message sent bataane se pehle durability aani chahiye.",
        forced: "Stage 1. Is design ki baaki har cheez speed ke baare mein hai; yeh box sirf isliye hai ki kuch kho na jaye.",
        alts: [["Keeping full history on the server", "alag product aur alag company: saat petabytes prati saal, ek search problem, aur ek legal team. Poocho ki aap kaunsa bana rahe ho."], ["A queue per user rather than a table", "conceptually wahi cheez, aur queues aam taur par un do operations mein kharab hoti hain jo yahan sabse zyada chahiye: kisi position se padhna, aur ek specific message delete karna."], ["Cassandra or DynamoDB partitioned by recipient", "scale par sahi shape. Partition key recipient hai, clustering key sequence hai, jisse drain ek single ordered range scan ban jaata hai."]],
        pros: ["Reconnect par drain aakhri acknowledged sequence se ek range scan hai.", "(recipient, message id) par unique key insert ko idempotent banati hai, isliye retries free hain.", "Acknowledge par delete ise history store se do orders of magnitude chhota rakhta hai."],
        cons: ["Write rate fan-out rate hai, ek million per second se upar, jo chhoti rows ke liye bhi asli database load hai.", "Is volume par deletes ki apni problem hai: row by row deletion ki jagah TTL ya partition drop use karo."],
        cost: "Lagbhag 40 GB live, ek million se zyada writes aur ek million deletes per second par. Size trivial hai, write rate nahi.",
        fails: "Ek device acknowledge karna band kar deta hai aur uska partition bina bound badhta hai. Age se cap karo, aur cap paar hone par device par full resync trigger karo, aise unbounded partition ki jagah jise koi dekh nahi raha.",
        say: "Recipient device se partition, sequence se cluster, message id par unique, TTL backstop ke roop mein. Yeh history store nahi, ek waiting room hai, aur yeh bolna hi storage estimate ko honest rakhta hai." },

      { job: "Ek group message ko har recipient device ke liye ek inbox row aur ek push mein badalna.",
        why: "256 ka group, har ek ke do devices, yaani 512 deliveries. Yeh sender ke request path par karne se unki latency is par depend karti hai ki unke kitne doston hain.",
        forced: "Stage 4. One to one messages ko is box ki kabhi zaroorat nahi thi, aur ise pehle add karna problem dhoondhta hua infrastructure hota.",
        alts: [["Fanning out inline on the sender's chat server", "paanch ke group ke liye theek, aur send latency ko group size ke proportional bana deta hai, jo bilkul galat shape hai."], ["A shared group log that members pull from", "kuch hazaar members se upar sahi jawab, kyunki yeh N baar ki jagah ek baar likhta hai. Reader ko poll ya subscription ki keemat deni padti hai, aur chhote groups ke liye kam fayde ki zyada machinery hai."], ["Hybrid, push for small groups and pull for large ones", "jo mature system aakhir mein karta hai, aur jawab tab dene layak jab interviewer kahe ki group mein ek million members hain."]],
        pros: ["Fan-out ka kuch bhi hone se pehle sender acknowledge ho chuka hota hai.", "Fan-out retryable aur parallel hai, aur ek slow recipient kisi aur ko slow nahi karta.", "Backlog consumer lag ke roop mein dikhta hai, jo aisa metric hai jis par alert laga sakte ho."],
        cons: ["Write amplification asli hai: ek message saikdon rows ban jaata hai.", "Yeh asynchronous hai, isliye ek member ko row exist karne se thoda pehle message receive karta dikhaya ja sakta hai, jab tak ticks acknowledgements se drive na hon."],
        cost: "Peak par lagbhag 1.2 million deliveries per second, jo design ka sabse bada akela load hai.",
        fails: "Bahut bada group ek send ko aise burst mein badal deta hai jo baaki sabko handle karne wale workers ko starve kar deta hai. Work queue ko group size se partition karke isolate karo, taaki ek enormous group family chat wale workers par na baithe.",
        say: "Kuch sau tak ke groups ke liye fan-out on write, aur low thousands ke aaspaas main shared log par switch karunga jise readers pull karein. Crossover woh number hai jo main measure karunga, guess nahi." },

      { job: "Batana ki abhi group mein kaun hai, aur jab koi message bheja gaya tab kaun tha.",
        why: "Fan-out ko member list chahiye, aur sahi chahiye, kyunki group mein add hone par aapko pichhle saal ke doosron ke messages retroactively nahi dikhne chahiye.",
        forced: "Stage 4. Yeh chhoti lookup table dikhti hai aur time ke baare mein ek sach mein awkward requirement carry karti hai.",
        alts: [["Denormalising the member list into every message", "lookup hata deta hai aur group chhodne ko history ka rewrite bana deta hai."], ["Keeping membership only on the client", "end to end encrypted groups kuch had tak aise hi kaam karte hain, aur iska matlab server fan-out kar hi nahi sakta, jo poora design badal deta hai."]],
        pros: ["Chhota, cacheable, aur likhne se kahin zyada padha jaata hai.", "Membership changes messages ke muqable rare hain, isliye ise aggressively cache karna safe hai."],
        cons: ["Kisi point in time par membership ek versioning problem hai jo lookup table mein chhupi hai.", "Yeh har group message par padha jaata hai, isliye kabhi slow nahi hona chahiye."],
        cost: "Bytes mein tiny, reads mein bahut hot. Ise fan-out workers ke paas cache karo.",
        fails: "Fan-out ke dauran ek member hata diya jaata hai aur use ek aakhri message mil jaata hai. Explicitly decide karo ki yeh acceptable hai ya nahi, bolo, aur agar nahi hai to membership version ko message ke saath capture karo.",
        say: "Hard cache, membership change par invalidate, aur message us membership version ko carry karta hai jiske against woh fan out hua, taaki group join karne par past kabhi na dikhe." },

      { job: "Batana ki koi online hai ya nahi, aur woh aakhri baar kab dikha.",
        why: "Yeh system ka sabse zyada write rate hai sabse kam keemti data ke liye, isliye ise aisa mechanism milta hai jo correctness ki jagah sastepan ke liye chuna gaya ho.",
        forced: "Stage 5. Alag isliye draw hua kyunki naive implementation, har state change par ek row update, messaging load se zyada bhari padti.",
        alts: [["A last_seen column updated on every action", "sahi hai, aur har baar koi scroll kare to database write hai. Yahi woh version hai jo postmortem mein dikhta hai."], ["Pushing every presence change to every contact", "contacts mein quadratic, aur zyadatar un dots ko koi dekh nahi raha."]],
        pros: ["TTL wali key ka matlab offline hone par koi write nahi: key bas exist karna band kar deti hai.", "Heartbeats sasti hain aur crash ke baad self healing.", "Sirf un contacts ko subscribe karna jo abhi screen par hain fan-out ko utne tak bound karta hai jitna user actually dekh sakta hai."],
        cons: ["Last seen heartbeat interval tak approximate hai, jo theek hai aur phir bhi bug report banayega.", "Presence ek privacy surface hai, isliye per user visibility rules chahiye."],
        cost: "Har online device ke liye ek chhoti key, har thirty second mein refresh. Lagbhag 100 million keys aur 3 million refreshes per second, jo Redis cluster ka normal din hai.",
        fails: "Ek network partition sabko ek saath offline dikha deta hai. Kyunki absence expired key se infer hoti hai, likhi nahi jaati, heartbeats resume hote hi state khud theek ho jaati hai.",
        say: "Har device ke liye ek Redis key, thirty second TTL, heartbeat se refresh. Offline matlab key ka na hona, isliye offline jaane mein zero writes lagte hain. Aur main presence sirf un conversations ke liye push karunga jo abhi user ki screen par hain." },

      { job: "Photos aur videos hold karna. Chat path sirf ek pointer aur ek decryption key carry karta hai.",
        why: "Chat tier ek kilobyte ke frames ke liye tune hai, jo ghanton khule socket par chalte hain. 20 MB ka video usse guzarne par ek connection ko ek minute ke liye occupy karta aur us box par baaki sab kuch stall kar deta.",
        forced: "Stage 5, aur yeh is page ke har doosre design jaisa hi rule hai: bytes seedhe object storage jaate hain, metadata API se guzarta hai.",
        alts: [["Streaming media through the chat servers", "ek code path, aur yeh ek bada slow transfer aise process ke andar daal deta hai jiska poora kaam chhote fast frames hai."], ["Base64 inside the message body", "payload ek tihai badhata hai aur text ke liye size hue message store mein video daal deta hai."]],
        pros: ["Upload aur download object store ki speed se chalte hain, messaging ke parallel.", "Encrypted blob group message ke har recipient share kar sakta hai, isliye ek upload 256 downloads serve karta hai.", "Chat tier predictable rehta hai, jisse woh 100,000 sockets hold kar pata hai."],
        cons: ["Doosra transport apni auth kahani ke saath, presigned aur short lived.", "Lifecycle sach mein mushkil hai: blob kab delete ho sakta hai, jab ek recipient ek mahine se offline ho sakta hai?"],
        cost: "Poore product ki sabse badi byte cost, aur usme se lagbhag kuch bhi aapke likhe kisi cheez se nahi guzarta.",
        fails: "Blob delete ho jaata hai jabki ek recipient abhi bhi offline hai, aur woh wapas aakar toota hua image dekhta hai. Retention ko sabse lambe inbox retention se jodo, us moment se nahi jab pehla recipient use download kare.",
        say: "Sender ek baar encrypt karta hai, blob storage par upload karta hai, aur message ek pointer aur key carry karta hai. Har recipient wahi object download karta hai. Koi bhi badi cheez socket tier ko kabhi touch nahi karti." }
    ],

    flowsIntro: "Do paths, aur doosra wahi hai jo log bhool jaate hain: reconnect. Chat system ki zyadatar correctness is mein rehti hai ki jab ek din se band device wapas aata hai to kya hota hai.",

    flows: [
      { n: "Dono log online",
        steps: [
          ["Phone A ek UUID generate karta hai, apne khule socket par encrypted body bhejta hai, aur retry timer shuru karta hai.", "sync"],
          ["A ka chat server store mein insert karta hai, (recipient device, message id) par keyed, taaki retry no-op ho.", "sync"],
          ["Woh A ko acknowledge karta hai. Ek tick. Server ne bas yahi ek promise kiya hai, aur woh durability ke baare mein hai, delivery ke baare mein nahi.", "sync"],
          ["Woh registry mein B ke devices dhoondhta hai aur har holding server ko forward karta hai.", "async"],
          ["B ka server frame B ke socket par likhta hai. B ka device id se dedupe karta hai, sequence order mein render karta hai, aur acknowledge karta hai.", "async"],
          ["Acknowledgement inbox row delete karta hai aur A tak do ticks ke roop mein wapas jaata hai. Read receipts wahi path hain, bas alag event ke saath.", "async"]
        ] },
      { n: "Recipient mangalwar se offline hai",
        note: "Yeh path hi wajah hai ki store exist karta hai, aur yahin ordering aur duplicate suppression asal mein test hote hain.",
        steps: [
          ["B ke jaane ke dauran messages aaye. Har ek store hua aur har forward attempt ko registry mein kuch nahi mila, isliye kuch hua nahi aur kuch fail nahi hua.", "async"],
          ["B ka device reconnect karta hai. Load balancer use sabse kam loaded server par rakhta hai, jo pichhla wala nahi hoga.", "sync"],
          ["Server B ke device ko TTL ke saath registry mein likhta hai, aur B har conversation ke liye apne paas ka aakhri sequence number bhejta hai.", "sync"],
          ["Server us sequence se inbox ko range scan karta hai aur backlog ko order mein, batches mein stream karta hai, taaki ek mahine ke messages ek enormous frame mein na aayein.", "sync"],
          ["B batches mein acknowledge karta hai. Har acknowledgement rows delete karta hai aur senders ko do ticks release karta hai, jinme se kuch khud kai dinon se online nahi hue.", "async"]
        ] },
      { n: "Ek group message",
        steps: [
          ["A ek baar bhejta hai. Unka server ek copy store karta hai, acknowledge karta hai, aur ek single fan-out event publish karta hai.", "sync"],
          ["Ek worker membership padhta hai, jo lagbhag hamesha cache hit hai, aur users ki jagah devices tak expand karta hai.", "async"],
          ["Woh har device ke liye ek inbox row likhta hai aur har us device ko push karta hai jise registry connected batati hai.", "async"],
          ["Har device alag se acknowledge karta hai. Sender ke ticks sabse slow recipient se drive hote hain, isiliye group ticks one to one ticks se alag lagte hain.", "async"]
        ] }
    ],

    tradeoffsIntro: "Chat ke trade-offs khaas taur par sharp hain kyunki product decisions infrastructure ko orders of magnitude se hila dete hain. Yeh chaar woh hain jinpar opinion rakhna banta hai.",

    tradeoffs: [
      { a: ["Delete on delivery", "Server ek waiting room hai. Lagbhag 40 GB live, koi history problem nahi, koi search problem nahi, aur phone kho jaaye to history bhi gayi."],
        b: ["Keep full history server side", "Saat petabytes prati saal, search, multi device sync free mein, aur ek legal aur privacy surface jo kabhi chhota nahi hota."],
        flip: "product ek workplace tool ho. Slack aur Teams sab kuch rakhte hain, kyunki compliance ko chahiye aur history hi woh feature hai jiske liye log paisa dete hain. Yeh ek sawaal storage ka jawab do sau guna badal deta hai, isliye pehle do minute mein poochho." },
      { a: ["Persistent WebSocket", "Server push kar sakta hai. Sau millisecond se kam delivery, har device ke liye ek connection, aur ek stateful tier jise deploy karna mushkil hai."],
        b: ["Polling or push notifications only", "Stateless aur operate karna trivial. Latency seconds mein naapi jaati hai, aur battery aur bandwidth aise sawaal poochne mein jaati hai jiska jawab aam taur par nahi hota."],
        flip: "app background mein ho, jahan operating system aapka socket waise bhi band kar dega aur push notification hi ekmaatra channel hai. Real clients dono chalate hain aur switch karte hain, jo bolna chahiye, yeh pretend karne ki jagah ki socket hamesha wahan hai." },
      { a: ["Fan-out on write to per device inboxes", "Reads trivial hain. Ek send saikdon writes ban jaata hai, jo 256 members par theek hai."],
        b: ["A shared group log that readers pull from", "Group size chahe jo ho, ek write. Har reader ko ab poll ya subscribe karna padta hai, aur unread counts mushkil ho jaate hain."],
        flip: "groups broadcast channels ban jaayein jinme das hazaar se zyada members hon. Tab har member ke liye row likhna absurd hai aur log jeet jaata hai. Mature product dono chalata hai aur group size se chunta hai." },
      { a: ["Client generated message ids", "Har hop idempotent hai, retries free hain, aur exactly once ek client side property hai."],
        b: ["Server generated ids with server side deduplication", "Server uniqueness control karta hai, aur woh us retry ko dedupe nahi kar sakta jo pehla response dikhne se pehle aa jaaye."],
        flip: "message id ke liye kabhi nahi. Badi seekh generalise hoti hai: jab bhi retry ho sakta hai, request ki identity use chunni chahiye jo retry karega." }
    ],

    next: [
      "<b>Multi region.</b> Conversation ki ordering ek region par pin karo aur inbox ko asynchronously replicate karo. Cross region delivery tab ek forward hai, consensus problem nahi.",
      "<b>Per conversation backpressure.</b> Aaj ek enormous group fan-out workers ko crowd kar sakta hai. Work ko group size se partition karo, taaki family chat kabhi broadcast channel ke peeche na ho.",
      "<b>Message expiry aur disappearing messages.</b> Zyadatar client feature, aur ise server side TTL chahiye jo us device se bhi survive kare jo kabhi wapas nahi aata.",
      "<b>Content padhe bina abuse handling.</b> Rate limits, graph signals aur reports, kyunki encryption ne har content based option hata diya hai."
    ]
  }
},

/* ==========================================================================
   3. FEED
   ========================================================================== */
{
  id: "instagram", kind: "hld", n: "Photo feed", sub: "Instagram, Twitter timeline",
  tags: ["fan-out", "the celebrity problem", "media", "approximate counting"],
  one: "The entire problem is one question, asked either at write time or at read time: whose feed does this post belong in? Answer it on write and you pay once per follower. Answer it on read and you pay on every feed load. Neither is right for everybody, which is why the real answer is both.",

  brief: {
    why: "Feeds are the problem where the naive design and the correct design are the same design, just applied to different users. The instinct to pick one strategy and defend it is what goes wrong. The useful framing is that a follower graph is wildly skewed, so a rule that is cheap for a person with two hundred followers is ruinous for a person with a hundred million, and the design has to say which rule applies to whom and how it decides.",
    functional: [
      "<b>Post</b> a photo with a caption. It appears in the feeds of the people who follow you.",
      "<b>Read your feed</b>, which is recent posts from accounts you follow, most interesting first, paginated and infinitely scrollable.",
      "<b>Follow and unfollow</b>, which quietly changes the shape of everyone's feed.",
      "<b>Like and view counts</b>, which sound trivial and are the highest write rate in the product."
    ],
    out: ["stories and reels", "direct messages", "the ranking model itself", "advertising", "comment threads and moderation"],
    nfr: [
      ["Feed load", "p99 under 200 ms", "This is the app's only screen for most sessions. It has to feel instant, which is why the feed cannot be computed from scratch on every load for most people."],
      ["Post visibility", "seconds, not milliseconds", "Nobody can tell whether a photo took two hundred milliseconds or four seconds to reach their friend's feed. This weak requirement is what makes asynchronous fan-out legal."],
      ["Feed availability", "99.9%, and stale is fine", "A feed missing the last ten minutes is a feed. A feed that fails to load is an outage. Serve something stale rather than nothing, always."],
      ["Counts", "approximate, eventually consistent", "Nobody can verify a like count and everybody would notice a slow like button. Say this out loud before designing the counter, because it decides the whole mechanism."],
      ["Media durability", "no lost photos", "The one thing in this product that must never be lost. It is also the only thing that never touches your application servers."]
    ],
    numbers: [
      ["Daily actives", "500M", "State the assumption, then design to it."],
      ["Posts", "about 1,200 per second", "100M posts a day. Modest, and utterly misleading on its own, because of the next row."],
      ["Fan-out writes", "about 230k per second, peak 700k", "1,200 posts a second times an average of 200 followers. The average is a lie, but it sizes the tier."],
      ["Feed loads", "about 58k per second, peak 175k", "500M actives loading a feed ten times a day. This is the number the read path serves."],
      ["The largest account", "over 300M followers", "One post from that account is 300 million inbox writes. At the peak rate above, a single post would consume the entire fan-out tier for seven minutes. This one row is the reason the design has two strategies."],
      ["Feed cache", "about 4 TB", "500M users times 500 entries times sixteen bytes for a post id and a score. Big, and it is ids only, which is what keeps it merely big."],
      ["Media", "about 200 TB per day", "100M photos at roughly 2 MB after processing. It goes to object storage and is served by a CDN, and it never touches a machine you wrote code for."]
    ],
    numbersNote: "The row that matters is <b>the largest account</b>. Every other number is comfortable. That single outlier is what turns a clean design into a hybrid one, and being the candidate who finds it before the interviewer mentions it is worth more than the rest of the diagram."
  },

  stagesIntro: "Six stages. Stage 0 is the version that is correct for everybody and fast for nobody. Stage 2 is the version that is fast for everybody and impossible for a few. Stage 3 is the one you actually ship, and it is only reachable if you have felt both of the first two fail.",

  stages: [
    { t: "0. Compute the feed when it is asked for",
      pressure: "None. This is the honest starting point, and it has a real virtue worth naming: a post is one write, and unfollowing somebody takes effect instantly with no cleanup anywhere.",
      nodes: [
        { id: "client", l: "App", s: "GET /feed", col: 0, row: 0, r: "client" },
        { id: "feedsvc", l: "Feed service", s: "query, merge, sort", col: 1, row: 0, r: "svc" },
        { id: "postdb", l: "Post store", s: "posts by author", col: 2, row: 0, r: "store" },
        { id: "graphdb", l: "Follow graph", s: "who follows whom", col: 2, row: 1, r: "store" },
      ],
      edges: [
        { a: "client", b: "feedsvc", l: "load" },
        { a: "feedsvc", b: "postdb", l: "recent" },
        { a: "feedsvc", b: "graphdb", l: "followees", bend: 0.8 },
      ],
      add: ["client", "feedsvc", "postdb", "graphdb"],
      say: "Read the list of accounts you follow, ask the post store for recent posts from each, merge and sort. This is fan-out on read. Writing a post costs exactly one row, and unfollowing somebody is instantaneous because nothing was ever precomputed. Those two properties are genuinely valuable and I want to be able to come back for them later.",
      breaks: "A user following a thousand accounts triggers a thousand range queries per feed load, and the feed is loaded 175,000 times a second at peak. The work is proportional to how much a person uses the product, which is backwards: your best users cost the most." },

    { t: "1. Get the photos out of the request path",
      pressure: "Two hundred terabytes a day of image bytes. Nothing about that should travel through an application server, and nothing about it should be stored in a database.",
      nodes: [
        { id: "client", l: "App", col: 0, row: 0, r: "client" },
        { id: "feedsvc", l: "Feed service", s: "ids and metadata only", col: 1, row: 0, r: "svc" },
        { id: "postdb", l: "Post store", s: "metadata, not bytes", col: 2, row: 0, r: "store" },
        { id: "graphdb", l: "Follow graph", col: 2, row: 1, r: "store" },
        { id: "cdn", l: "CDN", s: "serves every byte", col: 0, row: 1, r: "edge" },
        { id: "blob", l: "Object store", s: "the actual photos", col: 1, row: 1, r: "store" },
      ],
      edges: [
        { a: "client", b: "feedsvc", l: "load" },
        { a: "feedsvc", b: "postdb", l: "recent" },
        { a: "feedsvc", b: "graphdb", l: "followees", bend: 0.78 },
        { a: "client", b: "cdn", l: "images" },
        { a: "cdn", b: "blob", l: "on miss" },
      ],
      add: ["blob", "cdn"],
      say: "The client uploads straight to object storage with a presigned URL and the API only ever sees a key. The feed response is metadata and URLs, a few kilobytes, and the client pulls the images from a CDN. This is the single largest cost saving in the design and it is also the least interesting box, which is why I want it out of the way before the actual problem.",
      breaks: "The read path is still doing a thousand queries per feed load. Moving the bytes out made it cheaper, not faster." },

    { t: "2. Precompute the feed when the post is written",
      pressure: "Reads outnumber posts about fifty to one, and the read is doing all the work. Invert it: pay once, at write time, so the read becomes a single range scan on a list somebody already built.",
      nodes: [
        { id: "client", l: "App", col: 0, row: 0, r: "client" },
        { id: "cdn", l: "CDN", s: "images", col: 0, row: 1, r: "edge" },
        { id: "blob", l: "Object store", col: 0, row: 2, r: "store" },
        { id: "feedsvc", l: "Feed service", s: "one read, no merge", col: 1, row: 0, r: "svc" },
        { id: "postsvc", l: "Post service", s: "accept and return", col: 1, row: 2, r: "svc" },
        { id: "postdb", l: "Post store", s: "metadata, hydration", col: 2, row: 0, r: "store" },
        { id: "feedcache", l: "Feed cache", s: "user to 500 post ids", col: 2, row: 1, r: "cache" },
        { id: "fanout", l: "Fan-out workers", s: "one post to N lists", col: 2, row: 2, r: "work" },
        { id: "graphdb", l: "Follow graph", col: 3, row: 2, r: "store" },
      ],
      edges: [
        { a: "client", b: "feedsvc", l: "load" },
        { a: "client", b: "cdn" },
        { a: "cdn", b: "blob" },
        { a: "client", b: "postsvc", l: "post", bend: 0.35 },
        { a: "feedsvc", b: "postdb", l: "hydrate" },
        { a: "feedsvc", b: "feedcache", l: "ids", bend: 0.65 },
        { a: "postsvc", b: "fanout", l: "event", async: true },
        { a: "fanout", b: "graphdb", l: "followers" },
        { a: "fanout", b: "feedcache", l: "N pushes" },
      ],
      add: ["feedcache", "postsvc", "fanout"],
      say: "Posting now costs one row plus an event. A worker reads the follower list and pushes the post id onto each follower's list, capped at five hundred entries. A feed load becomes one read of a list of ids, then a batched hydration of the post metadata, which is a cache hit almost every time. The read path went from a thousand queries to two.",
      breaks: "Someone with three hundred million followers posts. That is 300 million list writes for one photo, it saturates the fan-out tier for minutes, and every ordinary user's post sits behind it. Meanwhile the celebrity's own followers get the post at wildly different times depending on where they landed in the queue." },

    { t: "3. Two strategies, chosen per account",
      pressure: "The follower distribution is not merely skewed, it is pathological. Fan-out on write is correct for 99.9% of accounts and impossible for the rest, so the design has to branch on which account is posting.",
      nodes: [
        { id: "client", l: "App", col: 0, row: 0, r: "client" },
        { id: "cdn", l: "CDN", s: "images", col: 0, row: 1, r: "edge" },
        { id: "blob", l: "Object store", col: 0, row: 2, r: "store" },
        { id: "feedsvc", l: "Feed service", s: "merge inbox and pull", col: 1, row: 0, r: "svc" },
        { id: "postsvc", l: "Post service", s: "checks follower count", col: 1, row: 2, r: "svc" },
        { id: "postdb", l: "Post store", s: "hydrate, and pull stars", col: 2, row: 0, r: "store" },
        { id: "feedcache", l: "Feed cache", s: "normal accounts only", col: 2, row: 1, r: "cache" },
        { id: "fanout", l: "Fan-out workers", s: "skips celebrities", col: 2, row: 2, r: "work" },
        { id: "graphdb", l: "Follow graph", s: "plus a celebrity list", col: 3, row: 2, r: "store" },
      ],
      edges: [
        { a: "client", b: "feedsvc", l: "load" },
        { a: "client", b: "cdn" },
        { a: "cdn", b: "blob" },
        { a: "client", b: "postsvc", l: "post", bend: 0.35 },
        { a: "feedsvc", b: "postdb", l: "pull" },
        { a: "feedsvc", b: "feedcache", l: "ids", bend: 0.65 },
        { a: "postsvc", b: "fanout", l: "event", async: true },
        { a: "fanout", b: "graphdb", l: "followers" },
        { a: "fanout", b: "feedcache", l: "push" },
      ],
      add: [],
      say: "Above a threshold of followers, say a hundred thousand, an account is marked a celebrity and its posts are not fanned out at all. At read time the feed service takes your precomputed list and merges it with a direct query for the handful of celebrities you follow, which is cheap because there are only a handful and their recent posts are the hottest cache entries in the system. Ordinary accounts get fan-out on write, famous ones get fan-out on read, and the reader pays a tiny merge. No new box, one branch, and the pathological case disappears.",
      breaks: "The feed is now in strict reverse chronological order, which stopped being what these products ship years ago. Ranking changes what the read path has to do, and it changes what the precomputed list is allowed to contain." },

    { t: "4. Ranking, which changes what the list is for",
      pressure: "A ranked feed cannot be a fixed sorted list, because the score of a post changes after it is written, and because the ranking model needs features about the reader as well as the post.",
      nodes: [
        { id: "client", l: "App", col: 0, row: 0, r: "client" },
        { id: "cdn", l: "CDN", s: "images", col: 0, row: 1, r: "edge" },
        { id: "blob", l: "Object store", col: 0, row: 2, r: "store" },
        { id: "feedsvc", l: "Feed service", s: "fetch, merge, rank", col: 1, row: 0, r: "svc" },
        { id: "postsvc", l: "Post service", col: 1, row: 2, r: "svc" },
        { id: "postdb", l: "Post store", s: "hydrate", col: 2, row: 0, r: "store" },
        { id: "feedcache", l: "Feed cache", s: "candidates, not a feed", col: 2, row: 1, r: "cache" },
        { id: "fanout", l: "Fan-out workers", col: 2, row: 2, r: "work" },
        { id: "ranker", l: "Ranking service", s: "scores a few hundred", col: 2, row: 3, r: "svc" },
        { id: "graphdb", l: "Follow graph", col: 3, row: 2, r: "store" },
        { id: "features", l: "Feature store", s: "reader and post signals", col: 3, row: 3, r: "cache" },
      ],
      edges: [
        { a: "client", b: "feedsvc", l: "load" },
        { a: "client", b: "cdn" },
        { a: "cdn", b: "blob" },
        { a: "client", b: "postsvc", l: "post", bend: 0.35 },
        { a: "feedsvc", b: "postdb", l: "hydrate" },
        { a: "feedsvc", b: "feedcache", l: "ids", bend: 0.6 },
        { a: "feedsvc", b: "ranker", l: "score", bend: 0.8 },
        { a: "ranker", b: "features", l: "signals" },
        { a: "postsvc", b: "fanout", l: "event", async: true },
        { a: "fanout", b: "graphdb", l: "followers" },
        { a: "fanout", b: "feedcache", l: "push" },
      ],
      add: ["ranker", "features"],
      say: "The precomputed list stops being the feed and becomes a candidate set, a few hundred post ids that are plausibly worth showing. Ranking happens at read time over that small set, because it depends on the reader, on freshness, and on a model that changes weekly. Retrieval is precomputed and cheap; scoring is live and small. That split is what makes a ranked feed affordable at all.",
      breaks: "Every post now carries a like count and a view count, and those are the highest write rate in the product by a wide margin. Incrementing a row per like would put the hottest write in the system on the most viewed content in the system." },

    { t: "5. Counting the things everybody clicks",
      pressure: "Likes and views are enormous in volume, worthless individually, and displayed on every post. The requirement said approximate is fine, and the design should take that permission and spend it.",
      nodes: [
        { id: "client", l: "App", col: 0, row: 0, r: "client" },
        { id: "cdn", l: "CDN", s: "images", col: 0, row: 1, r: "edge" },
        { id: "blob", l: "Object store", col: 0, row: 2, r: "store" },
        { id: "feedsvc", l: "Feed service", s: "fetch, merge, rank", col: 1, row: 0, r: "svc" },
        { id: "postsvc", l: "Post service", s: "posts, likes", col: 1, row: 2, r: "svc" },
        { id: "postdb", l: "Post store", s: "hydrate", col: 2, row: 0, r: "store" },
        { id: "feedcache", l: "Feed cache", s: "candidate ids", col: 2, row: 1, r: "cache" },
        { id: "fanout", l: "Fan-out workers", col: 2, row: 2, r: "work" },
        { id: "ranker", l: "Ranking service", col: 2, row: 3, r: "svc" },
        { id: "stream", l: "Event stream", s: "likes and views", col: 2, row: 4, r: "queue" },
        { id: "counters", l: "Counter store", s: "sharded, approximate", col: 3, row: 0, r: "cache" },
        { id: "graphdb", l: "Follow graph", col: 3, row: 2, r: "store" },
        { id: "features", l: "Feature store", col: 3, row: 3, r: "cache" },
      ],
      edges: [
        { a: "client", b: "feedsvc", l: "load" },
        { a: "client", b: "cdn" },
        { a: "cdn", b: "blob" },
        { a: "client", b: "postsvc", l: "post", bend: 0.35 },
        { a: "feedsvc", b: "postdb", l: "hydrate" },
        { a: "feedsvc", b: "feedcache", l: "ids", bend: 0.58 },
        { a: "feedsvc", b: "ranker", l: "score", bend: 0.78 },
        { a: "postdb", b: "counters", l: "counts" },
        { a: "ranker", b: "features", l: "signals" },
        { a: "postsvc", b: "fanout", l: "posts", async: true },
        { a: "postsvc", b: "stream", l: "likes", bend: 0.35, async: true },
        { a: "stream", b: "counters", l: "roll up", bend: 0.85 },
        { a: "fanout", b: "graphdb" },
        { a: "fanout", b: "feedcache", l: "push" },
      ],
      add: ["stream", "counters"],
      say: "A like is an event, not an update. It goes to a stream, an aggregator folds it into a per post counter that is itself sharded across several keys so no single key is hot, and the displayed number is the sum of the shards, read from cache. The user's own like is echoed optimistically by the client so it feels instant. Views get the same treatment with sampling on top, because nobody has ever noticed a view count being one percent wrong." }
  ],

  boxesIntro: "Thirteen components, and only two of them are hard. The fan-out workers and the feed cache carry the entire design, and everything else is either standard or is there to keep photos away from your servers.",

  boxes: [
    { id: "client", n: "The app", r: "client",
      job: "Requests a page of feed, uploads directly to object storage, and lies slightly about like counts.",
      why: "It is drawn because two of the design's nicest properties are implemented here: direct upload, which keeps 200 TB a day off your servers, and optimistic UI, which is what makes an eventually consistent counter feel instant.",
      forced: "Stage 1 for the upload path, stage 5 for the optimistic like.",
      alts: [["Uploading through the API", "one code path and one auth story, and your application tier now moves 200 TB a day for no reason."]],
      pros: ["Bytes go client to object store to CDN and never touch a machine you operate.", "Optimistic rendering hides every millisecond of eventual consistency in the counter path."],
      cons: ["A presigned URL is a capability you handed out, so it has to be narrow and short lived.", "Optimistic UI means the client can display something the server has not accepted yet, and it has to reconcile when the server disagrees."],
      cost: "Nothing, and it removes the largest cost in the system.",
      fails: "A presigned URL is minted with too broad a scope or too long a life, and it becomes an upload endpoint for anyone who obtained it. Scope to one key, expire in minutes.",
      say: "Presigned upload straight to object storage, scoped to a single key. The API never sees an image byte, and the CDN never asks my servers for one either." },

    { id: "feedsvc", n: "Feed service", r: "svc",
      job: "Assemble one page of feed: read the candidate ids, merge in the celebrity pull, rank, hydrate, return.",
      why: "The feed is the product, so the code that builds it is worth isolating from everything that writes.",
      forced: "Stage 2, when reading stopped being a single query and became an assembly job with several sources.",
      alts: [["Building the feed inside the mobile app", "moves the merge to the client and gives you no control over ranking, no ability to change it without a release, and a lot of chatty requests."], ["Precomputing the fully ranked page and storing it", "makes the read trivial and means every ranking change requires recomputing every feed, and the score of a post goes stale the moment it is stored."]],
      pros: ["Cache hit or not, the read path is a small fixed number of calls rather than one per followee.", "It is the single place where stale is better than failing, so it can degrade to reverse chronological when ranking is unavailable."],
      cons: ["It fans out to four or five dependencies per request, so its p99 is the maximum of theirs and it needs timeouts on each.", "Pagination on a ranked, changing feed is genuinely hard and this is where that difficulty lives."],
      cost: "175,000 requests per second at peak, each doing a handful of batched calls. This is the largest stateless tier in the design.",
      fails: "The ranking service is slow, and the feed service waits for it. The correct behaviour is to time out fast and return the candidate set in reverse chronological order, because an unranked feed is a feed and a spinner is not.",
      say: "Every dependency in this service has a timeout and a defined degraded answer. Ranking times out to chronological, counters time out to hiding the number, hydration failures drop the post. The feed always returns something." },

    { id: "feedcache", n: "Feed cache", r: "cache",
      job: "Hold a capped list of recent candidate post ids for each user, newest first.",
      why: "It is the precomputed half of the design. Turning a thousand queries into one list read is the entire benefit of fan-out on write, and the list has to live somewhere with a sorted set and a fast push.",
      forced: "Stage 2. Before that the feed was computed on read and there was nothing to store.",
      alts: [["A database table of inbox rows", "durable, and this data is regenerable by definition, so you would be paying for durability you can always recompute."], ["Storing the whole post in the list rather than the id", "one fewer hop at read time, and it multiplies 4 TB by the size of a post, and it means editing a caption has to rewrite millions of list entries."]],
      pros: ["A feed load becomes one range read on a sorted structure.", "Capping at five hundred entries bounds the memory and matches the truth that nobody scrolls further.", "Losing it is a performance event, not a data loss event: it can be rebuilt from the follow graph and the post store."],
      cons: ["4 TB of memory is a real cluster and a real bill.", "Every follow, unfollow, block, delete and privacy change has to be reflected in it or the feed shows something it should not.", "It is only correct for the accounts you chose to fan out."],
      cost: "About 4 TB, ids and scores only, sharded by user id so one user's feed is always local to one node.",
      fails: "A node is lost and those users have empty feeds. The recovery path is to fall back to fan-out on read for a cold user, which you already implemented for celebrities. That is the second time that code has paid for itself.",
      say: "Ids only, capped at five hundred, sharded by user id, and treated as a cache rather than a store. If it is empty I can always compute the feed the slow way, and that fallback is what lets me run it without replication." },

    { id: "postsvc", n: "Post service", r: "svc",
      job: "Accept a post, write the metadata row, and emit one event. Then get out of the way.",
      why: "Writes are 1,200 a second against 175,000 reads. They deserve their own small, careful service rather than a corner of the busiest tier in the system.",
      forced: "Stage 2, when posting stopped being a single insert and acquired an asynchronous consequence.",
      alts: [["Fanning out inline before returning", "makes the poster wait for their own follower count, which is the exact wrong incentive and unusable above a few thousand followers."]],
      pros: ["The poster's latency is one row insert regardless of audience size.", "The follower count check that routes celebrities away from fan-out lives here, in one place."],
      cons: ["The post is accepted before it is visible anywhere, so the poster's own view has to be special cased or their post appears to vanish for a second.", "It has to guarantee the event is emitted if the row was written, which is the outbox problem."],
      cost: "1,200 writes per second. Trivial.",
      fails: "The row is written and the process dies before the event is published, so the post exists and reaches nobody. Use a transactional outbox: write the row and the event in one transaction and let a separate process publish from the outbox table.",
      say: "The row and the fan-out event are written in one transaction, to an outbox, and published from there. Otherwise a crash between the two produces a post that exists and is invisible, which is the worst failure this service can have." },

    { id: "fanout", n: "Fan-out workers", r: "work",
      job: "Turn one post into a push onto every follower's list, unless the author has too many followers.",
      why: "This is where the design's decision actually gets made. It is also the only component whose cost is proportional to somebody else's popularity.",
      forced: "Stage 2 created it, stage 3 taught it to skip celebrities.",
      alts: [["No fan-out at all, pure read time merge", "correct, simple, and it puts a thousand queries on the busiest path in the product."], ["Fan-out to everybody including celebrities", "correct until one account has ten million followers, at which point one post occupies the tier for minutes and delays everyone else's."], ["Fan-out only to active users", "an excellent optimisation. Most accounts have not opened the app in a month, and writing to their list is pure waste. Fan out to the recently active, and rebuild on demand for the rest."]],
      pros: ["Moves work from 175,000 reads per second to 1,200 writes per second, which is the whole trade.", "Asynchronous, so it can lag without anybody's request failing.", "Lag is a visible metric, so you find out before your users do."],
      cons: ["Write amplification of two hundred on average, and far worse in the tail.", "It has to react to unfollows, deletes and privacy changes, which is a surprising amount of the code.", "It is eventually consistent, so the author's own feed needs special handling."],
      cost: "700,000 list pushes per second at peak. The largest write load in the design by an order of magnitude.",
      fails: "A moderately famous account, just under the celebrity threshold, posts during peak and its fan-out delays every other post behind it. Partition the work by follower count so large fan-outs cannot starve small ones, and make the threshold a tunable rather than a constant somebody has to deploy.",
      say: "Skip celebrities entirely, skip accounts that have not opened the app in thirty days, and partition the workers by follower count so a large fan-out cannot block a small one. The threshold is a dial, not a constant." },

    { id: "graphdb", n: "Follow graph", r: "store",
      job: "Answer two questions: who do I follow, and who follows this account.",
      why: "Both directions are needed, one for the read path and one for the fan-out, and they have very different shapes.",
      forced: "Stage 0 for the followee list, stage 2 for the follower list.",
      alts: [["A graph database", "the obvious answer by name and rarely the right one here, because the queries are two flat adjacency lists rather than traversals."], ["A single table with an index in each direction", "what this actually is. Say it plainly rather than reaching for a graph engine to describe a list."]],
      pros: ["Both queries are range scans on a partitioned key.", "The followee list is small enough to cache per user and changes rarely."],
      cons: ["The follower list for a large account is enormous and is read in full during fan-out, which is why celebrities are excluded from that path.", "Follows are bursty: a viral account can gain a million followers in an hour, and every one of them is a write plus a feed backfill decision."],
      cost: "Tens of billions of edges, read constantly, written rarely, extremely skewed.",
      fails: "Fan-out reads a three hundred million row follower list into memory. This is why the celebrity check happens before the read, not after it.",
      say: "Two adjacency lists, partitioned by the account, cached hard in the followee direction. The follower direction is only ever paged through, never loaded, and never for a celebrity." },

    { id: "postdb", n: "Post store", r: "store",
      job: "Hold post metadata: author, caption, media key, timestamp, privacy. Hydrate a batch of ids into a batch of posts.",
      why: "The feed cache holds ids because ids are small. Something has to turn a page of ids back into posts, and it has to do it for fifty ids in one call.",
      forced: "Stage 0, and its role changed in stage 2 from being queried by author to being read by id.",
      alts: [["Storing the full post in the feed cache", "removes the hydration call and multiplies the cache by fifty, and makes an edit rewrite millions of entries."], ["A relational store", "perfectly reasonable. The access is a batch get by primary key, so almost anything works, and the choice should be made on operational familiarity rather than on a benchmark."]],
      pros: ["Batch get by id is the cheapest possible read shape, and it caches almost perfectly.", "One row per post means edits and deletes happen in exactly one place."],
      cons: ["It is read on every feed load for fifty ids, so its cache hit rate is what your p99 actually depends on.", "It also serves the celebrity pull query, which is a different shape and needs its own index."],
      cost: "About 100M rows a day, small rows, read roughly nine million times a second in batches of fifty.",
      fails: "A deleted post is still in millions of feed lists. The hydration step is where deletion is enforced: an id that hydrates to nothing is dropped from the page. Cleaning the lists is a background job, not a correctness requirement.",
      say: "Hydration is where privacy and deletion are actually enforced, because the feed lists are a cache and will always be slightly wrong. If the post is gone or you are blocked, it does not hydrate, and the page is one shorter." },

    { id: "blob", n: "Object store", r: "store",
      job: "Hold the photos. Durably, cheaply, forever.",
      why: "Two hundred terabytes a day of immutable binary is exactly what object storage exists for and exactly what a database is worst at.",
      forced: "Stage 1, and it is the first thing to do in any design with media in it.",
      alts: [["Storing images in the database", "the classic mistake. It destroys the database's cache, backups and replication, all to store bytes nothing ever queries."], ["A self managed distributed file system", "what large companies actually run at this scale, for cost reasons. Mention it as the thing you would do at ten times the size."]],
      pros: ["Eleven nines of durability without you doing anything.", "It is the CDN's origin, so it is read rarely, on cache misses only.", "Storage cost per byte is an order of magnitude below block storage."],
      cons: ["Latency is tens of milliseconds, which is why it is behind a CDN and never in front of a user.", "Lifecycle and cost management become a real job at 200 TB a day."],
      cost: "About 70 PB a year before tiering, and considerably less after moving old photos to colder classes.",
      fails: "It is fine, and the CDN in front of it has a cold cache after an invalidation, and suddenly it is serving live traffic it was never sized for. Stagger invalidations.",
      say: "Immutable objects with content addressed keys, so a photo can be cached forever and an edit is a new key rather than an invalidation." },

    { id: "cdn", n: "CDN", r: "edge",
      job: "Serve every image byte from somewhere near the reader.",
      why: "Images are 99.9% of the bytes and 0% of the logic. They are immutable and highly repeated, which is the ideal case for edge caching.",
      forced: "Stage 1. Without it the object store serves every byte of a global product from a handful of regions.",
      alts: [["Serving images from the application tier", "puts a 2 MB transfer through a process sized for 4 KB JSON responses."], ["Serving directly from the object store", "works and is slow for distant users, and the egress bill is roughly the whole cost of the product."]],
      pros: ["Latency is a local hop rather than an intercontinental one.", "Immutable content means cache hit rates in the high nineties and no invalidation problem.", "It absorbs viral traffic without anything of yours noticing."],
      cons: ["Another vendor in the critical path for the most visible part of the product.", "Signed URLs for private content are fiddly and are where access control bugs hide."],
      cost: "The largest line item, and far smaller than the alternative.",
      fails: "A privacy change makes a photo private, and the CDN keeps serving it from cache to anyone with the URL. Use signed URLs with short expiry for anything not public, and accept that public content is public once it has been fetched.",
      say: "Content addressed URLs with a long TTL for public photos, signed short lived URLs for private ones. Immutability is what makes the first option safe." },

    { id: "ranker", n: "Ranking service", r: "svc",
      job: "Score a few hundred candidates for one reader and return them in order.",
      why: "The feed stopped being chronological. Ranking has to be at read time because the score depends on the reader, on how recently they looked, and on a model that is replaced every week.",
      forced: "Stage 4.",
      alts: [["Ranking at write time and storing the order", "makes reads trivial and makes the score wrong the moment anything changes, and it means a model change is a full recompute of every feed in existence."], ["Ranking on the client", "no server cost and you cannot change the model without an app release, and the client does not have the signals."]],
      pros: ["Scoring a few hundred items is small and bounded work, unlike scoring everything.", "Model changes ship without touching stored data.", "It is the one component that can be turned off, degrading to chronological, without breaking the product."],
      cons: ["It is on the critical path of the busiest endpoint, so its latency is your latency.", "Feature freshness is a whole subsystem of its own."],
      cost: "A few hundred scores per feed load, 175,000 feed loads per second at peak. This is where the GPUs go.",
      fails: "It is slow or down. The feed service times out and returns candidates in reverse chronological order. Users notice the feed feels different and nobody sees an error, which is the correct outcome.",
      say: "Retrieval is precomputed and cheap, scoring is live and small. Splitting the feed into those two halves is what makes ranking affordable, and it is why the feed cache holds candidates rather than a finished page." },

    { id: "features", n: "Feature store", r: "cache",
      job: "Serve the signals ranking needs: what this reader engaged with recently, how this post is performing, how close the two accounts are.",
      why: "A model is useless without features, and the features have to be available in single digit milliseconds for a few hundred items at once.",
      forced: "Stage 4, alongside the ranker. It is drawn separately because its freshness requirements are different from everything else's.",
      alts: [["Computing features at request time from the source data", "accurate and far too slow, since some of them are aggregates over months of behaviour."], ["Only using features computed in a nightly batch", "cheap and it makes the feed blind to what you did five minutes ago, which is precisely the signal that matters most."]],
      pros: ["Batch and streaming features live behind one interface, so the model does not care where a number came from.", "It absorbs the freshness problem so the ranker does not have to."],
      cons: ["Training and serving must compute features identically, and when they drift the model degrades silently.", "It is an entire platform, and it is genuinely out of scope for a forty five minute interview beyond naming it."],
      cost: "High read rate, small values, mixed freshness. In practice a Redis or key value tier with a batch pipeline behind it.",
      fails: "Streaming features stall, the store keeps serving yesterday's values, and the feed quietly gets worse without a single error. Alert on feature staleness, not just on errors.",
      say: "I would name this and move on unless asked. It is a platform problem rather than a feed problem, and the only thing the feed design needs from it is a bounded latency and a defined behaviour when it is stale." },

    { id: "stream", n: "Event stream", r: "queue",
      job: "Carry likes and views away from the request path.",
      why: "Engagement events are enormous in volume and individually worthless, which is the exact profile that belongs in a log rather than a transaction.",
      forced: "Stage 5.",
      alts: [["Updating the count synchronously", "puts the highest write rate in the product on the most contended rows in the product."], ["Counting in the client and reporting periodically", "cheaper and trivially spoofed, which matters when the number is used for ranking."]],
      pros: ["The like request returns immediately and the client shows the change optimistically.", "The same stream feeds counters, ranking features and analytics, so one pipeline serves three consumers.", "Replayable, so a counting bug is fixable rather than permanent."],
      cons: ["Yet another distributed system, and this one is on the path of your most frequent user action.", "Partitioning by post id creates a hot partition for exactly the posts everybody is looking at."],
      cost: "Millions of small events per second at peak, retained for hours to days.",
      fails: "A viral post creates a hot partition. Key on post id plus a random suffix, sum the shards at read time, and accept that the count is assembled rather than stored.",
      say: "The like is an event. The count is derived. Making that separation is what allows the write path to be fast and the read path to be cached." },

    { id: "counters", n: "Counter store", r: "cache",
      job: "Hold the like and view counts that appear on every post, and serve them with the post.",
      why: "The number is read on every impression and written on every interaction, so it needs to be in memory and it needs to not be a single hot key.",
      forced: "Stage 5.",
      alts: [["A counter column on the post row", "one row per post, one contended row per viral post, and every like is a database write with a lock on it."], ["Exact counting with a transaction per like", "correct, expensive, and nobody has ever audited a like count."], ["HyperLogLog for unique viewers", "the right structure for uniques, with a small and well understood error, and it is exactly what the approximate requirement was for."]],
      pros: ["Sharding one logical counter across several keys removes the hot key entirely.", "Reads are a sum of a handful of small values, cached alongside the post.", "It can be rebuilt from the stream, so it is a cache rather than a source of truth."],
      cons: ["The number is approximate and slightly late, which someone will report as a bug at least once a quarter.", "Summing shards makes the read marginally more expensive than reading one value."],
      cost: "A few small values per post, for the posts that are actually being viewed. The long tail can be evicted and recomputed.",
      fails: "The stream lags and every count on the site is ten minutes stale. Nothing breaks. The optimistic client rendering means users still see their own like immediately, which is the only count they check.",
      say: "Counts are derived, sharded and approximate, and they are echoed optimistically on the client. That combination is what lets the most frequent write in the product cost almost nothing." }
  ],

  flowsIntro: "Two paths, and the interesting thing is how differently they are priced. Posting is cheap for you and expensive for the system; reading is expensive for you and cheap per user.",

  flows: [
    { n: "Loading a feed",
      steps: [
        ["App requests a page, sending the cursor from the previous page rather than an offset, because the feed changes while you scroll.", "sync"],
        ["The feed service reads the candidate ids from the feed cache. One range read, sharded to a single node.", "sync"],
        ["In parallel it pulls recent posts from the handful of celebrities this user follows, which is a small query against very hot rows.", "sync"],
        ["It merges both sets, sends a few hundred candidates to the ranker, and takes the top fifty. If the ranker times out, it sorts by time and continues.", "sync"],
        ["It hydrates those fifty ids into posts in one batch call, dropping anything deleted, private or blocked. This is where authorisation actually happens.", "sync"],
        ["It attaches counts from the counter store and returns metadata plus CDN URLs. The client fetches every image from the edge, not from you.", "sync"]
      ] },
    { n: "Publishing a post",
      steps: [
        ["The client uploads the image directly to object storage using a presigned URL scoped to one key.", "sync"],
        ["It calls the post service with the key and the caption. One row is written, along with a fan-out event, in a single transaction to an outbox.", "sync"],
        ["The client gets a 201 and shows the post immediately in the author's own feed, locally, because fan-out has not happened yet.", "sync"],
        ["A publisher reads the outbox and puts the event on the stream. The post now exists and is guaranteed to be fanned out eventually.", "async"],
        ["A worker checks the follower count. Under the threshold, it pushes the post id onto each active follower's list. Over it, it does nothing at all and the post will be found by the read path instead.", "async"],
        ["Image processing, thumbnails and safety classification run off the same event, entirely outside the posting path.", "async"]
      ] },
    { n: "A like",
      steps: [
        ["The client renders the filled heart immediately, before any network call. This is the whole reason the rest of the path is allowed to be slow.", "sync"],
        ["The request writes a row in the likes table, which is what makes the state durable and lets the user unlike it.", "sync"],
        ["The same action emits an event to the stream, which is what makes the count move.", "async"],
        ["An aggregator increments one of several shards for that post. The displayed count is the sum, cached for a few seconds.", "async"]
      ] }
  ],

  api: [
    ["GET /v1/feed?cursor=", "50 posts, next cursor", "A cursor, never an offset. In a feed that changes while you read it, page two of an offset is a different page two by the time you ask for it."],
    ["POST /v1/posts", "201 {post_id}", "Takes a media key that was already uploaded, not the image. The image never travels through this call."],
    ["POST /v1/media/upload-url", "presigned PUT + key", "Scoped to one object and expiring in minutes. This is a capability you are handing to a client."],
    ["POST /v1/posts/{id}/like", "200 {liked:true}", "Durable row for the user's own state, asynchronous event for the count. Two different guarantees behind one button."],
    ["POST /v1/follow/{user}", "202", "Accepted, not done. Following an account may trigger a backfill of their recent posts into your feed, and you should not wait for that."]
  ],
  apiNote: "The two details worth saying: cursors rather than offsets, because the list shifts under the reader, and 202 on follow, because the feed effects are asynchronous and pretending otherwise makes the endpoint slow and still eventually consistent.",

  schema: { n: "Four structures, and what lives where", lang: "text",
    note: "Notice that the feed cache holds ids and scores only, and that the like count is not a column on the post. Both are deliberate and both come straight out of the numbers.",
    code:
"posts                        partition: post_id\n" +
"  post_id, author_id, media_key, caption, created_at, privacy\n" +
"  read as a batch get of 50 ids. never scanned.\n" +
"\n" +
"follows                      two indexes on one edge list\n" +
"  (follower_id, followee_id)   -> who I follow, small, cached\n" +
"  (followee_id, follower_id)   -> my followers, huge, paged, never loaded\n" +
"\n" +
"feed_cache                   Redis sorted set per user, capped at 500\n" +
"  key   feed:{user_id}\n" +
"  value post_id, scored by created_at   ids only, 16 bytes each\n" +
"\n" +
"counters                     sharded, approximate, rebuildable\n" +
"  likes:{post_id}:{0..15}    sum the shards at read time\n" +
"  views:{post_id}            HyperLogLog for uniques" },

  deep: [
    { n: "The celebrity problem, stated properly",
      note: "Fan-out on write costs O(followers) per post and O(1) per read. Fan-out on read costs O(1) per post and O(followees) per read. Neither is bad; what is bad is that the follower distribution spans eight orders of magnitude, so no single constant is acceptable across it.<br><br>The hybrid works because the two costs land on different people. An ordinary account is fanned out, so its followers pay nothing at read time. A celebrity is not, so its followers pay one extra query, and there are only a handful of celebrities that any one person follows. The reader's extra cost is bounded by how many famous accounts they follow, which is a small number for everybody, and the writer's cost is bounded by the threshold.<br><br>Two follow up questions are almost guaranteed. <b>Where is the threshold?</b> Wherever the fan-out cost of one post exceeds the read cost it would save, which is a measurement, not a constant. <b>What happens at the boundary?</b> An account crossing it should not have its old posts rewritten; apply the new strategy to new posts and let the read path merge both, which it already does." },

    { n: "Pagination on a list that changes while you read it",
      note: "Offset pagination is wrong here and it is wrong in a way that is invisible in testing. If three posts arrive while you are reading page one, page two at offset fifty starts three posts later than it should, and you never see them. Users experience this as posts randomly disappearing, and it is one of the most reported and least reproduced bugs in feed products.<br><br>Use a cursor: an opaque token holding the score and id of the last item returned. The next page is everything below that point, which is stable regardless of what arrives above it. For a ranked feed the cursor also has to pin the ranking session, otherwise page two is scored by a model that has moved on and you get duplicates. In practice: rank once, cache the ordered id list for that session for a few minutes, and page through it." },

    { n: "The like button, which has two different guarantees behind it",
      note: "Pressing like does two separate things and they deserve different treatment. Your own like state must be durable and read-your-writes correct, because you will notice immediately if the heart empties again. The global count must be fast and may be approximate, because nobody can verify it.<br><br>So the row goes in synchronously, and the count goes through the stream. The client renders the change before either completes. If the row insert fails, the client reverts and tells you; if the count is thirty seconds late, nobody finds out. Two guarantees, one button, and the mistake is applying the stricter guarantee to both because they arrived in the same request." },

    { n: "What happens when you unfollow",
      note: "The follow graph changes instantly, and the feed cache is full of posts from an account you no longer follow. There are three honest options. <b>Rewrite the list</b>, which is expensive and immediate. <b>Filter at hydration</b>, which is cheap and means the page is shorter than fifty. <b>Do nothing and let the cap evict them</b>, which is free and means you see them for a while.<br><br>The right answer depends on why they unfollowed. For an ordinary unfollow, filtering at hydration is fine. For a block, it is not: seeing a post from someone you blocked is a safety failure rather than a staleness one, so blocks are enforced at hydration <i>and</i> trigger a rewrite. Being able to separate those two cases is worth more than picking either strategy." }
  ],

  tradeoffsIntro: "The first of these is the whole problem. The others are the ones that follow from having answered it.",

  tradeoffs: [
    { a: ["Fan-out on write", "Reads are one list lookup. A post costs one write per follower, and it is unbounded for famous accounts."],
      b: ["Fan-out on read", "Posts are one write. Every feed load costs a query per followee, and it is unbounded for active users."],
      pick: "a",
      flip: "the author is above the follower threshold, which is exactly what the hybrid does. The insight is that this is not a global choice, it is a per account one, and the reader merges both." },
    { a: ["Store post ids in the feed cache", "16 bytes an entry, 4 TB total, and one hydration call per page."],
      b: ["Store whole posts in the feed cache", "No hydration call. Fifty times the memory, and editing a caption rewrites millions of copies."],
      pick: "a",
      flip: "the post is tiny and immutable, for example a stock tick or a score update. Then denormalising is cheap and the extra hop is not worth it." },
    { a: ["Rank at read time over a candidate set", "Model changes ship instantly. Reader specific signals are available. Costs latency on the busiest endpoint."],
      b: ["Rank at write time and store the order", "Reads are trivial. Every model change is a full recompute, and the score is stale before it is stored."],
      pick: "a",
      flip: "the ordering is not personalised, for example a global trending list. Then compute it once and let everybody read the same answer." },
    { a: ["Approximate, sharded counters", "No hot keys, no contention, a number that is seconds late and slightly wrong."],
      b: ["Exact counters in a transaction", "A number you could audit, a lock on the most viewed rows in the product, and a slow like button."],
      pick: "a",
      flip: "the number is money. Ad impressions get an exact nightly batch as the source of truth, with the approximate counter kept as the live view. Two systems, two purposes, and it is worth saying which is which." }
  ],

  next: [
    "<b>Backfill on follow.</b> Following someone should show their recent posts. That is a small fan-out on read at follow time, and it needs a rate limit or a bulk import becomes a fan-out storm.",
    "<b>Feed diversity.</b> Straight ranking shows you one account's twelve photos in a row. Fixing that is a re-ranking pass, and it is a product decision hiding in a sort.",
    "<b>Multi region.</b> The feed cache is regional and the follow graph is global. Read local, replicate the graph, and accept a few seconds of cross region lag on new posts.",
    "<b>Deletion that actually cleans up.</b> Today a deleted post is filtered at hydration and stays in millions of lists. That works, and it will eventually need a background reaper."
  ],

  p: [
    ["HI", "https://www.hellointerview.com/learn/system-design/problem-breakdowns/fb-news-feed", "Hello Interview, the news feed", "H"],
    ["HI", "https://www.hellointerview.com/learn/system-design/problem-breakdowns/instagram", "Hello Interview, Instagram", "H"],
    ["GFG", "https://www.geeksforgeeks.org/system-design/design-twitter-a-system-design-interview-question/", "GFG, design Twitter", "H"],
    ["DG", "https://www.designgurus.io/course-play/grokking-the-system-design-interview/doc/designing-instagram", "Design Gurus, Instagram", "H"],
    ["GH", "https://github.com/donnemartin/system-design-primer", "System Design Primer", "M"]
  ],

  hi: {
    one: "Yahaan sirf ek sawaal hai, jo ya to likhte waqt poocha jaata hai ya padhte waqt: yeh post kiske feed mein jayega? Likhne ke time jawab do to har follower ke liye ek baar pay karte ho. Padhne ke time jawab do to har feed load pe pay karte ho. Dono mein se koi akela sabke liye sahi nahi hai, isliye asli jawab dono hai.",

    brief: {
      why: "Feeds wahi problem hai jahan naive design aur sahi design ek hi design hote hain, bas alag alag users pe apply hote hain. Jo cheez galat hoti hai woh hai ek strategy chun kar usi ko defend karte rehna. Kaam ki baat yeh hai ki follower graph bahut zyada skewed hota hai: jo rule do sau followers wale ke liye sasta hai, wahi rule ek crore followers wale ke liye barbaad kar deta hai. Design ko batana padta hai ki kaunsa rule kiske liye lagta hai aur yeh kaise decide hota hai.",
      functional: [
        "<b>Post</b> karo ek photo caption ke saath. Yeh un logon ke feed mein dikhta hai jo tumhe follow karte hain.",
        "<b>Apna feed padho</b>, jo un accounts ke recent posts hain jinhe tum follow karte ho, sabse interesting pehle, paginated aur infinitely scrollable.",
        "<b>Follow aur unfollow karo</b>, jo chupke se sabke feed ka shape badal deta hai.",
        "<b>Like aur view counts</b>, jo trivial lagte hain aur product mein sabse zyada write rate inhi ka hai."
      ],
      out: ["stories aur reels", "direct messages", "khud ranking model", "advertising", "comment threads aur moderation"],
      nfr: [
        ["Feed load", "p99 under 200 ms", "Yeh app ka wahi ek screen hai jo zyadatar sessions mein khulti hai. Isse instant lagna hi padega, isliye zyadatar logon ke liye feed har load pe scratch se compute nahi ho sakta."],
        ["Post visibility", "seconds, not milliseconds", "Koi nahi bata sakta ki ek photo apne dost ke feed tak do sau milliseconds mein pahunchi ya char second mein. Yeh weak requirement hi hai jo asynchronous fan-out ko legal banata hai."],
        ["Feed availability", "99.9%, and stale is fine", "Jis feed mein pichhle das minute chhoote hain woh bhi feed hai. Jo feed load hi nahi hota woh outage hai. Kuch bhi stale serve karo, kabhi khaali mat chhodo."],
        ["Counts", "approximate, eventually consistent", "Koi bhi like count verify nahi kar sakta, aur sabko slow like button turant pata chal jayega. Counter design karne se pehle yeh baat khul kar bolo, kyunki yahi poore mechanism ka faisla karti hai."],
        ["Media durability", "no lost photos", "Is product mein bas yahi ek cheez hai jo kabhi khoni nahi chahiye. Aur yahi ek cheez hai jo tumhare application servers ko kabhi chhoo bhi nahi paati."]
      ],
      numbers: [
        ["Daily actives", "500M", "Assumption bol do, phir usi pe design karo."],
        ["Posts", "about 1,200 per second", "100M posts roz ke. Chhota lagta hai, aur akela dekhne pe bilkul galatfehmi paida karta hai, kyunki agli row hi asli kahani hai."],
        ["Fan-out writes", "about 230k per second, peak 700k", "1,200 posts per second, average 200 followers se multiply karo. Average jhooth bolta hai, par tier ka size yahi decide karta hai."],
        ["Feed loads", "about 58k per second, peak 175k", "500M actives din mein das baar feed load karte hain. Yahi wo number hai jo read path serve karta hai."],
        ["The largest account", "over 300M followers", "Us account ka ek post matlab 30 crore inbox writes. Upar wale peak rate pe, sirf ek post poore fan-out tier ko saat minute tak busy rakh dega. Yahi ek row hai jiski wajah se design ke do strategies hain."],
        ["Feed cache", "about 4 TB", "500M users, har ek ke 500 entries, har entry mein post id aur score ke solah bytes. Bada hai, aur sirf ids hain, isi wajah se sirf bada hai, bekabu nahi."],
        ["Media", "about 200 TB per day", "Processing ke baad roughly 2 MB ke 100M photos. Yeh object storage mein jaata hai aur CDN se serve hota hai, aur kabhi bhi tumhare likhe hue kisi machine ko chhoota nahi hai."]
      ],
      numbersNote: "Sabse zaroori row hai <b>the largest account</b>. Baaki sab numbers comfortable hain. Wahi ek outlier hai jo ek saaf design ko hybrid bana deta hai, aur agar tum interviewer se pehle usse dhoond lo to yeh baaki poore diagram se zyada value ki baat hai."
    },

    stagesIntro: "Chhe stages. Stage 0 wo version hai jo sabke liye sahi hai aur kisi ke liye tez nahi. Stage 2 wo version hai jo sabke liye tez hai aur chand logon ke liye impossible. Stage 3 wahi hai jo tum actually ship karte ho, aur usko samajhna tabhi possible hai jab pehle dono stages ko fail hote dekha ho.",

    stages: [
      { pressure: "Kuch nahi. Yeh honest starting point hai, aur isme ek asli fayda hai jo bolne layak hai: ek post matlab sirf ek write, aur kisi ko unfollow karna turant effect karta hai, kahin bhi cleanup ki zarurat nahi.",
        say: "Jin accounts ko follow karte ho unki list padho, har ek se recent posts post store se maango, merge karo aur sort karo. Isko fan-out on read kehte hain. Post likhna sirf ek row ka cost hai, aur unfollow turant hota hai kyunki kuch bhi precompute nahi hua tha. Yeh dono properties genuinely valuable hain aur main baad mein inhe wapas laana chahunga.",
        breaks: "Jo user hazar accounts follow karta hai, uska ek feed load hazar range queries chala deta hai, aur feed peak pe 175,000 baar per second load hota hai. Kaam utna hi zyada hai jitna user product use karta hai, jo ulta hai: tumhare best users hi sabse mehenge padte hain." },

      { pressure: "Roz ke do sau terabyte image bytes. Isme se kuch bhi application server se guzarna nahi chahiye, aur kuch bhi database mein store nahi hona chahiye.",
        say: "Client seedha object storage pe presigned URL se upload karta hai aur API sirf ek key dekhta hai. Feed response sirf metadata aur URLs hai, chand kilobytes ka, aur client CDN se images khinchta hai. Design mein cost bachane ka sabse bada tareeka yahi hai, aur yeh sabse kam interesting box bhi hai, isliye ise pehle hi raste se hata dena chahta hoon.",
        breaks: "Read path abhi bhi ek feed load pe hazar queries chala raha hai. Bytes bahar nikaalne se cost kam hua, speed nahi badhi." },

      { pressure: "Reads, posts se pachaas guna zyada hain, aur read hi saara kaam kar raha hai. Ulta karo: write time pe ek baar pay karo, taaki read sirf ek pehle se bani list ka range scan ban jaye.",
        say: "Ab post karna sirf ek row aur ek event ka cost hai. Ek worker follower list padhta hai aur post id har follower ki list mein push karta hai, cap paanch sau entries pe. Feed load ab sirf ek ids ki list padhna hai, phir post metadata ka batched hydration, jo lagbhag hamesha cache hit hota hai. Read path hazar queries se do queries pe aa gaya.",
        breaks: "Koi teen crore followers wala account post karta hai. Ek photo ke liye 30 crore list writes, jo fan-out tier ko minutes tak saturate kar deta hai, aur har normal user ka post uske peeche atak jaata hai. Saath hi, celebrity ke apne followers ko post alag alag time pe milta hai, iss baat pe ki queue mein woh kahan lande." },

      { pressure: "Follower distribution sirf skewed nahi, pathological hai. Fan-out on write 99.9% accounts ke liye sahi hai aur baaki ke liye impossible, isliye design ko yeh branch lena padta hai ki post kaun kar raha hai.",
        say: "Ek threshold se zyada followers hone par, maan lo ek lakh, account ko celebrity mark kar dete hain aur uske posts fan-out hi nahi hote. Read time pe feed service tumhari precomputed list ko un chand celebrities ke direct query ke saath merge karti hai jinhe tum follow karte ho, jo sasta hai kyunki celebrities chand hi hoti hain aur unke recent posts system ke sabse hot cache entries hote hain. Normal accounts ko fan-out on write milta hai, famous accounts ko fan-out on read, aur reader ek chhota sa merge pay karta hai. Koi naya box nahi, ek hi branch, aur pathological case gayab ho jaata hai.",
        breaks: "Feed ab strict reverse chronological order mein hai, jo yeh products saalon pehle chhod chuke hain. Ranking badalta hai ki read path ko kya karna hai, aur yeh badalta hai ki precomputed list mein kya reh sakta hai." },

      { pressure: "Ranked feed ek fixed sorted list nahi ho sakta, kyunki ek post ka score likhne ke baad badalta rehta hai, aur ranking model ko reader ke baare mein bhi features chahiye hote hain, sirf post ke baare mein nahi.",
        say: "Precomputed list ab feed nahi rahi, ek candidate set ban jaati hai, chand sau post ids jo dikhane layak ho sakte hain. Ranking read time pe usi chhote set pe hoti hai, kyunki yeh reader pe, freshness pe, aur har hafte badalne wale model pe depend karti hai. Retrieval precomputed aur sasta hai, scoring live aur chhota hai. Yahi split hai jo ranked feed ko affordable banata hai.",
        breaks: "Ab har post pe ek like count aur ek view count hota hai, aur yeh product mein sabse zyada write rate wali cheezein hain, kaafi antar se. Har like pe row increment karna, system ke sabse zyada dekhe jaane wale content pe sabse hot write daal dega." },

      { pressure: "Likes aur views volume mein bahut zyada hain, akele mein bekaar hain, aur har post pe dikhte hain. Requirement pehle hi keh chuka hai ki approximate chalega, aur design ko yeh permission use karni chahiye.",
        say: "Ek like ek event hai, update nahi. Yeh stream mein jaata hai, ek aggregator use per post counter mein fold karta hai jo khud bhi kayi shards mein bata hota hai taaki koi ek key hot na ho, aur dikhaya jaane wala number sabhi shards ka sum hai, cache se padha jaata hai. User ka apna like client optimistically dikha deta hai taaki instant lage. Views ke saath bhi wahi treatment hai, upar se sampling ke saath, kyunki kisi ne kabhi notice nahi kiya ki view count ek percent galat hai." }
    ],

    boxesIntro: "Terah components, aur inme se sirf do hi mushkil hain. Fan-out workers aur feed cache poore design ko sambhalte hain, baaki sab ya to standard hain ya sirf isliye hain ki photos tumhare servers se door rahein.",

    boxes: [
      { job: "Feed ka ek page maangta hai, seedha object storage pe upload karta hai, aur like counts ke baare mein thoda jhooth bolta hai.",
        why: "Yeh isliye draw hota hai kyunki design ki do sabse achhi properties yahin implement hoti hain: direct upload, jo roz ke 200 TB tumhare servers se door rakhta hai, aur optimistic UI, jo eventually consistent counter ko instant feel karata hai.",
        forced: "Upload path ke liye stage 1, optimistic like ke liye stage 5.",
        alts: [["Uploading through the API", "ek hi code path aur ek hi auth story milti hai, aur tumhara application tier bina wajah roz 200 TB data move karega."]],
        pros: ["Bytes client se object store aur phir CDN tak jaate hain, kabhi tumhare chalaye kisi machine ko chhoote nahi.", "Optimistic rendering counter path ki har millisecond eventual consistency ko chhupa deta hai."],
        cons: ["Presigned URL ek capability hai jo tumne de di hai, isliye usse narrow aur short lived rakhna padta hai.", "Optimistic UI ka matlab hai client kuch aisa dikha sakta hai jo server ne abhi accept nahi kiya, aur server disagree kare to reconcile karna padta hai."],
        cost: "Kuch nahi, aur yeh system ke sabse bade cost ko hata deta hai.",
        fails: "Presigned URL bahut broad scope ya lambe time ke liye ban jaaye, to woh kisi ke liye bhi upload endpoint ban jaata hai jiske paas woh URL aa jaaye. Ek key tak scope karo, minutes mein expire karo.",
        say: "Presigned upload seedha object storage tak, ek single key tak scoped. API kabhi ek bhi image byte nahi dekhta, aur CDN bhi mere servers se kabhi kuch nahi maangta." },

      { job: "Feed ka ek page assemble karo: candidate ids padho, celebrity pull merge karo, rank karo, hydrate karo, return karo.",
        why: "Feed hi product hai, isliye jo code isse banata hai use baaki har cheez se alag rakhna hi sahi hai.",
        forced: "Stage 2, jab read sirf ek query na rehke kayi sources wala assembly job ban gaya.",
        alts: [["Building the feed inside the mobile app", "merge mobile app mein le jaata hai aur ranking pe tumhara koi control nahi rehta, ise release ke bina badal nahi sakte, aur bahut saari chatty requests ban jaati hain."], ["Precomputing the fully ranked page and storing it", "read trivial ho jaata hai aur har ranking change pe har feed recompute karna padta hai, aur post ka score store hote hi stale ho jaata hai."]],
        pros: ["Cache hit ho ya na ho, read path ek fixed chhoti si call count hai, har followee ke liye ek call nahi.", "Yahi wo ek jagah hai jahan stale hona failure se behtar hai, isliye jab ranking unavailable ho to yeh reverse chronological pe degrade ho sakta hai."],
        cons: ["Yeh har request pe chaar paanch dependencies pe fan-out karta hai, isliye iska p99 unme se sabse dheeme ke barabar hai aur har ek ko timeout chahiye.", "Ek ranked, badalte hue feed pe pagination genuinely mushkil hai aur yahi problem yahin rehti hai."],
        cost: "Peak pe 175,000 requests per second, har ek mein kuch batched calls. Design ka sabse bada stateless tier.",
        fails: "Ranking service dheemi ho jaaye, aur feed service uska wait kare. Sahi behavior yeh hai ki jaldi timeout karo aur candidate set ko reverse chronological order mein return karo, kyunki bina ranking wala feed bhi feed hai, spinner nahi.",
        say: "Is service ki har dependency ka timeout hai aur ek defined degraded answer hai. Ranking timeout ho to chronological, counters timeout ho to number chhupa do, hydration fail ho to post drop karo. Feed hamesha kuch na kuch return karta hai." },

      { job: "Har user ke liye ek capped list rakho recent candidate post ids ki, sabse naya pehle.",
        why: "Yeh design ka precomputed hissa hai. Hazar queries ko ek list read mein badalna hi fan-out on write ka poora fayda hai, aur is list ko kahin rehna hai ek sorted set aur tez push ke saath.",
        forced: "Stage 2. Usse pehle feed read time pe compute hoti thi aur store karne layak kuch tha hi nahi.",
        alts: [["A database table of inbox rows", "durable hai, aur yeh data by definition regenerable hai, to tum us durability ka paisa de rahe ho jo tum kabhi bhi recompute kar sakte ho."], ["Storing the whole post in the list rather than the id", "read time pe ek hop kam ho jaata hai, aur 4 TB ko post ke size se multiply kar deta hai, aur caption edit karne pe lakhon list entries rewrite karni padti hain."]],
        pros: ["Feed load ab ek sorted structure pe ek range read ban jaata hai.", "Paanch sau entries ka cap memory bound karta hai aur is sach ko maanta hai ki koi utna scroll nahi karta.", "Isse khona ek performance event hai, data loss event nahi: follow graph aur post store se wapas ban sakta hai."],
        cons: ["4 TB memory ek asli cluster aur asli bill hai.", "Har follow, unfollow, block, delete aur privacy change isme reflect hona chahiye, warna feed kuch aisa dikhayega jo nahi dikhana chahiye.", "Yeh sirf un accounts ke liye sahi hai jinhe fan-out ke liye chuna gaya."],
        cost: "Lagbhag 4 TB, sirf ids aur scores, user id se sharded taaki ek user ka feed hamesha ek hi node pe ho.",
        fails: "Ek node kho jaaye to un users ka feed khaali dikhega. Recovery path yeh hai ki cold user ke liye fan-out on read pe fallback karo, jo tumne celebrities ke liye pehle hi bana rakha hai. Yeh doosri baar hai jab wo code khud ka paisa vasool kar raha hai.",
        say: "Sirf ids, paanch sau tak capped, user id se sharded, aur store nahi cache maana jaata hai. Khaali ho jaaye to bhi main feed dheeme tareeke se compute kar sakta hoon, aur yahi fallback hai jo isse bina replication ke chalane deta hai." },

      { job: "Post accept karo, metadata row likho, aur ek event emit karo. Phir raste se hat jao.",
        why: "Writes 1,200 per second hain, reads 175,000 ke saamne. Yeh apni ek chhoti, careful service ke layak hain, system ke sabse busy tier ke ek corner mein nahi.",
        forced: "Stage 2, jab post karna sirf ek insert na rehke ek asynchronous consequence bhi le aaya.",
        alts: [["Fanning out inline before returning", "poster ko apne hi follower count ka wait karwata hai, jo bilkul galat incentive hai aur chand hazar followers ke upar use hi nahi kiya ja sakta."]],
        pros: ["Poster ki latency audience size se relate nahi rakhti, hamesha ek row insert ke barabar hai.", "Follower count check jo celebrities ko fan-out se door rakhta hai, yahin ek jagah hai."],
        cons: ["Post visible hone se pehle accept ho jaata hai, isliye poster ka apna view special case karna padta hai warna post ek second ke liye gaayab lagta hai.", "Isse yeh guarantee karna padta hai ki row likhne par event bhi emit ho, jo outbox problem hai."],
        cost: "1,200 writes per second. Trivial.",
        fails: "Row likh diya jaaye aur process event publish karne se pehle mar jaaye, to post exist karta hai aur kisi tak nahi pahunchta. Transactional outbox use karo: row aur event ek hi transaction mein likho, aur ek alag process outbox table se publish kare.",
        say: "Row aur fan-out event ek hi transaction mein, ek outbox mein likhe jaate hain, aur wahin se publish hote hain. Warna dono ke beech crash aisa post bana degi jo exist karta hai aur invisible hai, jo is service ki sabse buri failure hogi." },

      { job: "Ek post ko har follower ki list pe ek push mein badlo, jab tak author ke followers zyada na ho.",
        why: "Yahin design ka asli faisla hota hai. Yeh bhi sirf ek hi component hai jiska cost kisi doosre ki popularity ke barabar hota hai.",
        forced: "Stage 2 ne ise banaya, stage 3 ne isse celebrities skip karna sikhaya.",
        alts: [["No fan-out at all, pure read time merge", "sahi, simple, aur hazar queries product ke sabse busy path pe daal deta hai."], ["Fan-out to everybody including celebrities", "sahi hai jab tak koi account ek crore followers tak na pahunch jaaye, phir ek post minutes tak tier ko occupy karta hai aur baaki sabko delay karta hai."], ["Fan-out only to active users", "ek badhiya optimisation. Zyadatar accounts ne mahine bhar se app nahi khola, unki list mein likhna pure waste hai. Recently active logon ko fan out karo, baaki ke liye on demand rebuild karo."]],
        pros: ["Kaam ko 175,000 reads per second se 1,200 writes per second pe le jaata hai, yahi poora trade hai.", "Asynchronous hai, isliye lag kar sakta hai bina kisi ki request fail kiye.", "Lag ek visible metric hai, isliye tumhe users se pehle pata chal jaata hai."],
        cons: ["Average write amplification do sau ka hai, aur tail mein aur bhi bura.", "Isse unfollows, deletes aur privacy changes pe react karna padta hai, jo code ka ek surprising hissa hai.", "Yeh eventually consistent hai, isliye author ke apne feed ko special handling chahiye."],
        cost: "Peak pe 700,000 list pushes per second. Design ka sabse bada write load, kayi guna se.",
        fails: "Threshold ke thoda neeche wala moderately famous account peak pe post kare aur uska fan-out har doosre post ko peeche dhakel de. Kaam ko follower count se partition karo taaki bada fan-out chhote ko bhookha na rakhe, aur threshold ko ek tunable banao, ek deploy karne wali constant nahi.",
        say: "Celebrities ko poori tarah skip karo, jinhone tees din se app nahi khola unhe bhi skip karo, aur workers ko follower count se partition karo taaki bada fan-out chhote ko block na kare. Threshold ek dial hai, constant nahi." },

      { job: "Do sawaalon ka jawab do: main kise follow karta hoon, aur is account ko kaun follow karta hai.",
        why: "Dono directions chahiye, ek read path ke liye aur ek fan-out ke liye, aur inki shape bilkul alag hai.",
        forced: "Followee list ke liye stage 0, follower list ke liye stage 2.",
        alts: [["A graph database", "naam se obvious jawaab lagta hai aur yahan shayad hi sahi hota hai, kyunki queries traversal nahi, do flat adjacency lists hain."], ["A single table with an index in each direction", "yahi asal mein hai. Isse seedha bol do, ek list describe karne ke liye graph engine mat pakdo."]],
        pros: ["Dono queries ek partitioned key pe range scans hain.", "Followee list itni chhoti hai ki per user cache ho sakti hai aur kam badalti hai."],
        cons: ["Bade account ki follower list bahut badi hoti hai aur fan-out ke dauraan poori padhi jaati hai, isi wajah se celebrities ko us path se bahar rakha jaata hai.", "Follows bursty hote hain: ek viral account ek ghante mein das lakh followers paa sakta hai, aur har ek ek write plus feed backfill decision hai."],
        cost: "Kayi arab edges, hamesha padhe jaate hain, kabhi kabhaar likhe jaate hain, bahut skewed.",
        fails: "Fan-out ek teen crore row wali follower list memory mein padh le. Isi wajah se celebrity check read se pehle hota hai, baad mein nahi.",
        say: "Do adjacency lists, account se partitioned, followee direction mein zor se cached. Follower direction sirf paged through hoti hai, kabhi load nahi hoti, celebrity ke liye to bilkul nahi." },

      { job: "Post metadata rakho: author, caption, media key, timestamp, privacy. Ids ka ek batch le kar posts ka batch banao.",
        why: "Feed cache ids isliye rakhta hai kyunki ids chhoti hoti hain. Kisi ko to ids se posts wapas banane hain, aur ek call mein pachaas ids ke liye karna hai.",
        forced: "Stage 0, aur stage 2 mein role badla, author se query hone se id se read hone tak.",
        alts: [["Storing the full post in the feed cache", "hydration call hata deta hai aur cache ko pachaas guna bada kar deta hai, aur edit karne pe lakhon entries rewrite karni padti hain."], ["A relational store", "bilkul theek hai. Access ek primary key pe batch get hai, isliye lagbhag kuch bhi chal jaata hai, aur choice operational familiarity pe honi chahiye, benchmark pe nahi."]],
        pros: ["Id se batch get sabse sasta read shape hai, aur lagbhag perfectly cache hota hai.", "Ek post ek row, matlab edits aur deletes bas ek hi jagah hote hain."],
        cons: ["Har feed load pe pachaas ids ke liye padha jaata hai, isliye iska cache hit rate hi tumhare p99 ka faisla karta hai.", "Yeh celebrity pull query bhi serve karta hai, jo alag shape hai aur apna alag index maangti hai."],
        cost: "Roz kareeb 100M rows, chhoti rows, per second kareeb ek crore baar pachaas ke batches mein padhi jaati hain.",
        fails: "Deleted post lakhon feed lists mein reh jaata hai. Hydration wahi jagah hai jahan deletion actually enforce hoti hai: jo id kuch na banaye, page se drop ho jaati hai. List saaf karna background job hai, correctness requirement nahi.",
        say: "Hydration hi wo jagah hai jahan privacy aur deletion actually enforce hoti hai, kyunki feed lists ek cache hain aur hamesha thodi galat rahengi. Post gaya ho ya tumne block kiya ho, to hydrate nahi hota, aur page ek chhota reh jaata hai." },

      { job: "Photos rakho. Durably, sasta, hamesha ke liye.",
        why: "Roz do sau terabyte immutable binary data, exactly wahi hai jiske liye object storage bana hai aur exactly wahi hai jisme database sabse kamzor hota hai.",
        forced: "Stage 1, aur media wale kisi bhi design mein sabse pehla kaam yahi hai.",
        alts: [["Storing images in the database", "classic mistake. Database ka cache, backups aur replication sab barbaad ho jaate hain, sirf bytes store karne ke liye jinhe koi query hi nahi karta."], ["A self managed distributed file system", "yahi bade companies is scale pe cost ke liye actually chalate hain. Isko das guna size pe karne wali cheez ki tarah mention karo."]],
        pros: ["Gyarah nines durability, bina kuch kiye.", "Yeh CDN ka origin hai, isliye sirf cache misses pe padha jaata hai.", "Storage cost per byte block storage se ek order kam hai."],
        cons: ["Latency das milliseconds range mein hai, isliye yeh CDN ke peeche rehta hai, kabhi user ke saamne nahi.", "Roz 200 TB pe lifecycle aur cost management asli kaam ban jaata hai."],
        cost: "Saal mein kareeb 70 PB tiering se pehle, aur purani photos ko thandi class mein bhejne ke baad kaafi kam.",
        fails: "Yeh theek chal raha hota hai, aur uske aage wala CDN invalidation ke baad cold cache ho jaata hai, achanak yeh live traffic serve karne lagta hai jiske liye woh sized hi nahi tha. Invalidations ko stagger karo.",
        say: "Immutable objects content addressed keys ke saath, taaki photo hamesha ke liye cache ho sake aur edit ek invalidation ke bajaye ek naya key ban jaaye." },

      { job: "Har image byte reader ke paas se serve karo.",
        why: "Images 99.9% bytes hain aur 0% logic. Yeh immutable hain aur bahut repeat hoti hain, edge caching ke liye ideal case.",
        forced: "Stage 1. Iske bina object store poore global product ka har byte chand regions se serve karta.",
        alts: [["Serving images from the application tier", "2 MB transfer ko us process se guzarna padta hai jo 4 KB JSON responses ke liye size kiya gaya hai."], ["Serving directly from the object store", "chalta hai aur door ke users ke liye dheema hai, aur egress bill lagbhag poore product ke cost ke barabar ho jaata hai."]],
        pros: ["Latency ek local hop hai, intercontinental nahi.", "Immutable content ka matlab high nineties cache hit rate aur invalidation problem hi nahi.", "Yeh viral traffic ko absorb kar leta hai bina tumhare kisi cheez ko pata chale."],
        cons: ["Product ke sabse visible hisse ke critical path mein ek aur vendor.", "Private content ke liye signed URLs fiddly hote hain aur wahin access control bugs chhupte hain."],
        cost: "Sabse bada line item, aur alternative se kaafi chhota.",
        fails: "Privacy change ke baad photo private ho jaata hai, aur CDN use cache se kisi ke bhi liye serve karta rehta hai jiske paas URL hai. Jo bhi public nahi hai uske liye signed, short expiry URLs use karo, aur maano ki public content ek baar fetch hone ke baad public hi hai.",
        say: "Public photos ke liye content addressed URLs lambe TTL ke saath, private ke liye signed short lived URLs. Immutability hi hai jo pehla option safe banata hai." },

      { job: "Ek reader ke liye chand sau candidates ko score karo aur order mein return karo.",
        why: "Feed chronological nahi rahi. Ranking read time pe honi chahiye kyunki score reader pe depend karta hai, kitni der pehle usne dekha usпе, aur har hafte badalne wale model pe.",
        forced: "Stage 4.",
        alts: [["Ranking at write time and storing the order", "reads trivial ban jaate hain aur score kuch bhi badalte hi galat ho jaata hai, aur model change ka matlab har feed ka poora recompute."], ["Ranking on the client", "server cost zero, par model bina app release badle nahi badal sakte, aur client ke paas signals bhi nahi hote."]],
        pros: ["Chand sau items score karna chhota, bounded kaam hai, sab kuch score karne jaisa nahi.", "Model changes stored data ko chhue bina ship hote hain.", "Yahi ek component hai jo band ho ke chronological pe degrade ho sakta hai bina product tode."],
        cons: ["Yeh sabse busy endpoint ke critical path pe hai, isliye iski latency tumhari latency hai.", "Feature freshness apne aap mein ek poora subsystem hai."],
        cost: "Har feed load pe chand sau scores, peak pe 175,000 feed loads per second. Yahin GPUs jaate hain.",
        fails: "Yeh dheema ya band ho jaaye. Feed service timeout kar ke candidates ko reverse chronological order mein return kar deti hai. Users ko feed alag lagta hai par koi error nahi dikhta, jo sahi outcome hai.",
        say: "Retrieval precomputed aur sasta hai, scoring live aur chhota hai. Feed ko in do hisson mein banta hi ranking ko affordable banata hai, aur isi liye feed cache ek finished page nahi, candidates rakhta hai." },

      { job: "Ranking ko chahiye wale signals do: yeh reader recently kisme engage hua, yeh post kaisa perform kar raha hai, dono accounts kitne close hain.",
        why: "Model bina features ke bekaar hai, aur features ko single digit milliseconds mein chand sau items ke liye ek saath available hona chahiye.",
        forced: "Stage 4, ranker ke saath. Alag draw kiya gaya hai kyunki iski freshness requirements baaki sabse alag hain.",
        alts: [["Computing features at request time from the source data", "accurate hai aur bahut dheema, kyunki kuch features mahino ke behavior ka aggregate hote hain."], ["Only using features computed in a nightly batch", "sasta hai aur feed ko andha bana deta hai us cheez ke liye jo tumne paanch minute pehle kiya, jo bilkul wahi signal hai jo sabse zyada matter karta hai."]],
        pros: ["Batch aur streaming features ek hi interface ke peeche rehte hain, isliye model ko farq nahi padta number kahan se aaya.", "Yeh freshness problem khud absorb karta hai taaki ranker ko na karna pade."],
        cons: ["Training aur serving ko features exactly same tarike se compute karna padta hai, aur jab yeh drift kare to model chupke se kharab hota hai.", "Yeh apne aap mein poora platform hai, aur pachpan minute ke interview ke liye naam lene ke alawa genuinely out of scope hai."],
        cost: "High read rate, chhoti values, mixed freshness. Practically ek Redis ya key value tier, peeche ek batch pipeline ke saath.",
        fails: "Streaming features atak jaate hain, store kal ki values serve karta rehta hai, aur feed chupke se kharab hota jaata hai bina ek bhi error ke. Errors pe nahi, feature staleness pe alert lagao.",
        say: "Jab tak poocha na jaaye main isse naam lekar aage badh jaunga. Yeh feed problem se zyada platform problem hai, aur feed design ko isse bas ek bounded latency aur stale hone par ek defined behavior chahiye." },

      { job: "Likes aur views ko request path se door le jao.",
        why: "Engagement events volume mein bahut zyada hain aur akele mein bekaar, exactly wahi profile jo transaction mein nahi, log mein hona chahiye.",
        forced: "Stage 5.",
        alts: [["Updating the count synchronously", "product ki sabse zyada write rate ko sabse contended rows pe daal deta hai."], ["Counting in the client and reporting periodically", "sasta hai aur aasani se spoof ho sakta hai, jo matter karta hai jab number ranking mein use hota hai."]],
        pros: ["Like request turant return hoti hai aur client change ko optimistically dikha deta hai.", "Yahi ek stream counters, ranking features aur analytics, teeno ko serve karta hai, ek pipeline se teen consumers.", "Replayable hai, isliye counting bug fix ho sakta hai, permanent nahi rehta."],
        cons: ["Ek aur distributed system, aur yeh tumhare sabse frequent user action ke path pe hai.", "Post id se partition karne se exactly un posts pe hot partition ban jaata hai jinhe sab dekh rahe hain."],
        cost: "Peak pe per second lakhon chhote events, ghanto se dino tak retained.",
        fails: "Ek viral post hot partition bana deta hai. Post id plus ek random suffix pe key karo, read time pe shards sum karo, aur maano ki count store nahi, assemble hota hai.",
        say: "Like ek event hai. Count derive hota hai. Yeh alag rakhna hi hai jo write path ko tez rakhta hai aur read path ko cache ho paane deta hai." },

      { job: "Har post pe dikhne wale like aur view counts rakho, aur post ke saath serve karo.",
        why: "Yeh number har impression pe padha jaata hai aur har interaction pe likha jaata hai, isliye ise memory mein hona chahiye aur ek single hot key nahi hona chahiye.",
        forced: "Stage 5.",
        alts: [["A counter column on the post row", "ek post, ek row, ek viral post pe ek contended row, aur har like ek lock wali database write."], ["Exact counting with a transaction per like", "sahi, mehenga, aur kisi ne kabhi like count audit nahi kiya."], ["HyperLogLog for unique viewers", "uniques ke liye sahi structure, chhoti aur well understood error ke saath, aur exactly wahi jiske liye approximate requirement thi."]],
        pros: ["Ek logical counter ko kayi keys mein banta hot key hi khatam kar deta hai.", "Reads chand chhoti values ka sum hain, post ke saath cache hote hain.", "Yeh stream se wapas ban sakta hai, isliye source of truth nahi, cache hai."],
        cons: ["Number approximate aur thoda late hai, koi na koi ise saal mein ek baar bug bolega.", "Shards sum karna ek value padhne se thoda mehenga hai."],
        cost: "Har post ke liye chand chhoti values, sirf un posts ke liye jo actually dekhe ja rahe hain. Long tail evict aur recompute ho sakta hai.",
        fails: "Stream lag kare aur site ka har count das minute stale ho jaaye. Kuch nahi tootta. Optimistic client rendering ka matlab hai users apna like turant dekhte hain, jo unke liye ek hi count matter karta hai.",
        say: "Counts derived, sharded aur approximate hain, aur client pe optimistically echo hote hain. Yahi combination hai jo product ke sabse frequent write ko lagbhag free bana deta hai." }
    ],

    flowsIntro: "Do paths, aur dilchasp baat yeh hai ki dono ki pricing kitni alag hai. Post karna tumhare liye sasta hai aur system ke liye mehenga; padhna tumhare liye mehenga hai aur per user sasta.",

    flows: [
      { n: "Feed load karna",
        steps: [
          ["App ek page maangta hai, pichhle page ka cursor bhejte hue, offset nahi, kyunki scroll karte waqt feed badalti rehti hai."],
          ["Feed service feed cache se candidate ids padhta hai. Ek range read, ek hi node pe sharded."],
          ["Saath hi parallel mein un chand celebrities ke recent posts khinchta hai jinhe yeh user follow karta hai, jo bahut hot rows pe ek chhoti query hai."],
          ["Dono sets merge karta hai, chand sau candidates ranker ko bhejta hai, aur top pachaas leta hai. Ranker timeout ho to time se sort kar ke aage badh jaata hai."],
          ["Un pachaas ids ko ek batch call mein posts mein hydrate karta hai, jo deleted, private ya blocked hai use drop karte hue. Yahi jagah hai jahan authorisation actually hoti hai."],
          ["Counter store se counts jodta hai aur metadata plus CDN URLs return karta hai. Client har image edge se khinchta hai, tumse nahi."]
        ] },
      { n: "Post publish karna",
        steps: [
          ["Client image ko seedha object storage pe upload karta hai, ek key tak scoped presigned URL se."],
          ["Yeh post service ko key aur caption ke saath call karta hai. Ek row likhi jaati hai, ek fan-out event ke saath, ek hi transaction mein ek outbox mein."],
          ["Client ko 201 milta hai aur post turant author ke apne feed mein locally dikha diya jaata hai, kyunki fan-out abhi hua nahi."],
          ["Ek publisher outbox padhta hai aur event stream pe daalta hai. Ab post exist karta hai aur guarantee hai ki kabhi na kabhi fan out hoga."],
          ["Ek worker follower count check karta hai. Threshold se neeche, post id har active follower ki list mein push karta hai. Upar hone pe kuch nahi karta, aur post read path se hi mil jaayega."],
          ["Image processing, thumbnails aur safety classification isi event se chalte hain, posting path se poori tarah bahar."]
        ] },
      { n: "Ek like",
        steps: [
          ["Client bina kisi network call ke turant filled heart dikha deta hai. Yahi wajah hai ki baaki poora path dheema ho sakta hai."],
          ["Request likes table mein ek row likhti hai, jo state ko durable banati hai aur user ko unlike karne deti hai."],
          ["Wahi action stream pe ek event emit karta hai, jo count ko move karta hai."],
          ["Ek aggregator us post ke kayi shards mein se ek ko increment karta hai. Dikhaya jaane wala count sum hai, chand seconds ke liye cached."]
        ] }
    ],

    tradeoffsIntro: "Inmein se pehla poori problem hai. Baaki wahi hain jo isko solve karne ke baad follow karte hain.",

    tradeoffs: [
      { a: ["Fan-out on write", "Reads sirf ek list lookup hain. Ek post har follower ke liye ek write ka cost leta hai, aur famous accounts ke liye yeh unbounded hai."],
        b: ["Fan-out on read", "Posts sirf ek write hain. Har feed load ek followee ke liye ek query ka cost leta hai, aur active users ke liye yeh unbounded hai."],
        flip: "author follower threshold se upar ho, jo exactly wahi hai jo hybrid karta hai. Insight yeh hai ki yeh global choice nahi, per account choice hai, aur reader dono ko merge karta hai." },
      { a: ["Store post ids in the feed cache", "Ek entry ke solah bytes, kul 4 TB, aur ek page ke liye ek hydration call."],
        b: ["Store whole posts in the feed cache", "Koi hydration call nahi. Pachaas guna zyada memory, aur caption edit karne pe lakhon copies rewrite karni padti hain."],
        flip: "post chhota aur immutable ho, jaise ek stock tick ya score update. Tab denormalise karna sasta hai aur extra hop ke layak nahi." },
      { a: ["Rank at read time over a candidate set", "Model changes turant ship hote hain. Reader specific signals available hote hain. Sabse busy endpoint pe latency ka cost lagta hai."],
        b: ["Rank at write time and store the order", "Reads trivial hain. Har model change ek poora recompute hai, aur score store hote hi stale ho jaata hai."],
        flip: "ordering personalised na ho, jaise ek global trending list. Tab ek baar compute karo aur sab wahi answer padhen." },
      { a: ["Approximate, sharded counters", "Koi hot key nahi, koi contention nahi, ek number jo seconds late aur thoda galat hai."],
        b: ["Exact counters in a transaction", "Ek number jo audit ho sake, sabse zyada dekhe jaane wale rows pe ek lock, aur ek dheema like button."],
        flip: "number paisa ho. Ad impressions ko exact nightly batch source of truth ke roop mein milta hai, approximate counter live view ke liye rakha jaata hai. Do systems, do purposes, aur yeh bolna zaroori hai ki kaunsa kis liye hai." }
    ],

    next: [
      "<b>Backfill on follow.</b> Kisi ko follow karne pe uske recent posts dikhne chahiye. Yeh follow time pe ek chhota fan-out on read hai, aur isko rate limit chahiye warna bulk import ek fan-out storm ban jaata hai.",
      "<b>Feed diversity.</b> Seedhi ranking se ek hi account ki barah photos ek saath dikh jaati hain. Isse theek karna ek re-ranking pass hai, aur yeh ek product decision hai jo ek sort ke andar chhupa hai.",
      "<b>Multi region.</b> Feed cache regional hai aur follow graph global. Local padho, graph replicate karo, aur naye posts pe chand seconds ki cross region lag maan lo.",
      "<b>Deletion that actually cleans up.</b> Aaj deleted post hydration pe filter hota hai aur lakhon lists mein reh jaata hai. Yeh chalta hai, par isko eventually ek background reaper chahiye hoga."
    ]
  }
},

/* ==========================================================================
   4. RIDE HAILING
   ========================================================================== */
{
  id: "uber", kind: "hld", n: "Ride hailing", sub: "Uber, Ola, Lyft",
  tags: ["geospatial", "write firehose", "matching", "money"],
  one: "Two hard parts that pull in opposite directions. Driver locations are a firehose that nobody needs to be durable, and a match is a tiny transaction that must never hand one driver to two riders. Almost every mistake in this design comes from treating them the same way.",

  brief: {
    why: "The trap here is to design one system. The location stream is 250,000 writes per second of data that is worthless four seconds later, and matching is 900 requests per second of data you would go to court over. If you put both in the same database you will either pay for durability you do not need or lose money you did. Splitting them in the first two minutes is most of the work.",
    functional: [
      "<b>Request a ride.</b> A rider asks for a car from a pickup point, and gets a driver, an estimate and an arrival time.",
      "<b>Match.</b> The system finds nearby available drivers, offers the trip, and assigns exactly one of them.",
      "<b>Track.</b> Both sides see the car moving on a map for the whole trip.",
      "<b>Charge.</b> The trip ends, a fare is computed, and money moves. Once."
    ],
    out: ["the routing and ETA engine itself", "driver onboarding and background checks", "pooled rides", "food delivery", "the fraud system"],
    nfr: [
      ["Match latency", "under 5 seconds end to end", "This includes waiting for a human to press accept, which is most of it. The system's own budget is a few hundred milliseconds."],
      ["Assignment", "exactly one driver per ride, always", "The one place strong consistency is not negotiable. Two riders in one car is a story in the newspaper, not an incident report."],
      ["Location freshness", "within about 5 seconds", "A car that jumps is worse than a car that lags. This is a freshness requirement, not a durability one, which is the distinction the whole design turns on."],
      ["Availability", "99.99% on request and track", "A rider standing on a pavement in the rain has no fallback. Note that the location tier can lose data and the product still works."],
      ["Money", "charged exactly once, auditable", "Payments get idempotency keys and an immutable ledger. Everything else here is allowed to be approximate; this is not."]
    ],
    numbers: [
      ["Online drivers", "about 1M at peak", "Out of maybe 5M registered. The concurrent number is what sizes everything."],
      ["Location pings", "about 250k per second", "One million drivers pinging every four seconds. This is the largest number in the design by a factor of nearly three hundred."],
      ["Ride requests", "about 900 per second at peak", "25 million rides a day, with a strong evening peak. Tiny. Say both of these numbers together and the design explains itself."],
      ["The ratio", "about 280 to 1", "Locations to matches. Two systems, two sets of guarantees, two technologies. Anything that treats them alike is going to be wrong for one of them."],
      ["Location volume if persisted", "about 2 TB per day", "250k pings at roughly 100 bytes. And it is worthless after a few seconds, which is why the live copy is in memory and only a sampled trail is kept."],
      ["Trip storage", "about 18 TB per year", "25M trips a day at a couple of kilobytes. Durable, immutable, and kept forever, because it is money and it is evidence."],
      ["Search radius", "about 3 km, a few hundred drivers", "Which is why the geospatial index only ever has to return a small set. The index exists to bound the candidate list, not to sort it."]
    ],
    numbersNote: "<b>250,000 against 900.</b> Put those two numbers next to each other on the board before drawing anything. They say that the firehose must never touch the database that holds a trip, and that the matching path can afford to be careful because it is almost idle by comparison."
  },

  stagesIntro: "Six stages. The first two fix a query that cannot scale, the middle two separate two workloads that must never share a machine, and the last two handle money and the fact that demand is not spread evenly over a city.",

  stages: [
    { t: "0. Ask every driver where they are",
      pressure: "Nothing yet. The naive matcher is worth drawing because its failure is quantitative rather than conceptual, and because the fix is the only genuinely new idea in the problem.",
      nodes: [
        { id: "rider", l: "Rider app", s: "request a ride", col: 0, row: 0, r: "client" },
        { id: "matchsvc", l: "Matching service", s: "scan, sort, pick", col: 1, row: 0, r: "svc" },
        { id: "driverdb", l: "Driver table", s: "one row per driver", col: 2, row: 0, r: "store" }
      ],
      edges: [{ a: "rider", b: "matchsvc", l: "request", bend: 0.78 }, { a: "matchsvc", b: "driverdb", l: "scan all" }],
      add: ["rider", "matchsvc", "driverdb"],
      say: "Every driver has a row with a latitude and a longitude. To find the nearest, compute the distance to all of them and sort. It is correct, it is one query, and it is the version everybody writes first.",
      breaks: "A million rows scanned per request, 900 times a second, while those same rows are being updated 250,000 times a second. The scan is quadratic in nothing and still hopeless, because a B-tree on latitude and a B-tree on longitude cannot answer a two dimensional question: an index on latitude gives you every driver in a band that crosses the entire planet." },

    { t: "1. Index by place, not by identity",
      pressure: "A range query in two dimensions. This is the one genuinely specialised piece of computer science in the problem, and the fix is to turn two dimensions into one.",
      nodes: [
        { id: "rider", l: "Rider app", col: 0, row: 0, r: "client" },
        { id: "matchsvc", l: "Matching service", s: "cell lookup, then filter", col: 1, row: 0, r: "svc" },
        { id: "geostore", l: "Geo index", s: "cell id to driver ids", col: 2, row: 0, r: "cache" },
        { id: "driverdb", l: "Driver table", s: "profile, vehicle, state", col: 2, row: 1, r: "store" }
      ],
      edges: [
        { a: "rider", b: "matchsvc", l: "request", bend: 0.78 },
        { a: "matchsvc", b: "geostore", l: "cells" },
        { a: "matchsvc", b: "driverdb", l: "details", bend: 0.78 }
      ],
      add: ["geostore"],
      say: "Cut the world into cells with a hierarchical grid, geohash, S2 or H3, so that a cell is a single string and nearby places share a prefix. A driver's location becomes a cell id. Finding nearby drivers becomes: compute the rider's cell, take its eight neighbours, read those nine lists, then filter by exact distance. Two dimensions became one, so an ordinary index works, and the candidate set is a few hundred instead of a million.",
      breaks: "The index is now correct and it lives in a database taking 250,000 writes per second of data that expires in four seconds. Every one of those writes is a durable, replicated, logged transaction for a fact that will be false before it is flushed." },

    { t: "2. Get the firehose off the database",
      pressure: "Two hundred and fifty thousand writes per second that need to be fresh and do not need to survive a restart. That is not a database workload, and paying database prices for it is the most expensive mistake available here.",
      nodes: [
        { id: "rider", l: "Rider app", col: 0, row: 0, r: "client" },
        { id: "driver", l: "Driver app", s: "ping every 4 seconds", col: 0, row: 2, r: "client" },
        { id: "matchsvc", l: "Matching service", col: 1, row: 1, r: "svc" },
        { id: "drivergw", l: "Driver gateway", s: "holds driver sockets", col: 1, row: 2, r: "svc" },
        { id: "geostore", l: "Live geo index", s: "in memory, TTL 30s", col: 2, row: 1, r: "cache" },
        { id: "locstream", l: "Location stream", s: "sampled trail, analytics", col: 2, row: 2, r: "queue" },
        { id: "driverdb", l: "Driver store", s: "profile and state", col: 2, row: 3, r: "store" }
      ],
      edges: [
        { a: "rider", b: "matchsvc", l: "request", bend: 0.78 },
        { a: "matchsvc", b: "geostore", l: "cells" },
        { a: "driver", b: "drivergw", l: "ping" },
        { a: "drivergw", b: "locstream", l: "sample", async: true },
        { a: "locstream", b: "geostore", l: "update" },
        { a: "drivergw", b: "driverdb", l: "state" }
      ],
      add: ["driver", "drivergw", "locstream"],
      say: "Drivers hold a persistent connection to a gateway that ingests pings. The live index is in memory, keyed by cell, with a thirty second TTL, so a driver who goes offline disappears without anyone writing a row. A sampled copy goes to a stream for the trip trail, analytics and disputes, at maybe one ping in ten. The durable store only ever sees state changes: online, offline, on a trip.",
      breaks: "Matching still has the bug that matters. Two riders in the same cell at the same instant both read the same nearby driver, both offer, and the driver accepts both. The index is a cache and caches cannot arbitrate." },

    { t: "3. One driver, one rider, and the offer protocol",
      pressure: "The only strong consistency requirement in the system. Everything else here is allowed to be stale; this is not, and it needs a transaction on a durable store rather than a compare and set on a cache.",
      nodes: [
        { id: "rider", l: "Rider app", col: 0, row: 0, r: "client" },
        { id: "driver", l: "Driver app", col: 0, row: 2, r: "client" },
        { id: "matchsvc", l: "Matching service", s: "offer, then assign", col: 1, row: 1, r: "svc" },
        { id: "drivergw", l: "Driver gateway", s: "pushes the offer", col: 1, row: 2, r: "svc" },
        { id: "ridedb", l: "Trip store", s: "one row, state machine", col: 2, row: 0, r: "store" },
        { id: "geostore", l: "Live geo index", s: "candidates only", col: 2, row: 1, r: "cache" },
        { id: "locstream", l: "Location stream", col: 2, row: 2, r: "queue" },
        { id: "driverdb", l: "Driver store", s: "state, unique on trip", col: 2, row: 3, r: "store" }
      ],
      edges: [
        { a: "rider", b: "matchsvc", l: "request", bend: 0.78 },
        { a: "matchsvc", b: "ridedb", l: "assign", bend: 0.75 },
        { a: "matchsvc", b: "geostore", l: "cells" },
        { a: "matchsvc", b: "drivergw", l: "offer" },
        { a: "driver", b: "drivergw", l: "accept" },
        { a: "drivergw", b: "locstream", async: true },
        { a: "locstream", b: "geostore", l: "update" },
        { a: "drivergw", b: "driverdb", l: "state" }
      ],
      add: ["ridedb"],
      say: "The index gives candidates, ranked by estimated time of arrival rather than straight line distance, because a river does not care how close you are. The offer goes to one driver at a time with a short deadline, and acceptance is a conditional write: set the trip's driver to this driver only if it is currently null, and set the driver's current trip only if that is null too, in one transaction. The second acceptance fails on the condition, the driver is told the ride is gone, and nothing anywhere had to lock.",
      breaks: "The trip ends and money has to move. A payment is a call to somebody else's system, it can time out without telling you whether it worked, and it must never be retried into a double charge." },

    { t: "4. The trip, the money, and the outbox",
      pressure: "An external system that can fail in the one way distributed systems hate most: an unknown outcome. Charging twice is worse than charging late, so this whole path is designed around being safely retryable.",
      nodes: [
        { id: "rider", l: "Rider app", col: 0, row: 0, r: "client" },
        { id: "driver", l: "Driver app", col: 0, row: 2, r: "client" },
        { id: "matchsvc", l: "Matching service", col: 1, row: 1, r: "svc" },
        { id: "drivergw", l: "Driver gateway", col: 1, row: 2, r: "svc" },
        { id: "ridedb", l: "Trip store", s: "plus an outbox table", col: 2, row: 0, r: "store" },
        { id: "geostore", l: "Live geo index", col: 2, row: 1, r: "cache" },
        { id: "locstream", l: "Location stream", col: 2, row: 2, r: "queue" },
        { id: "driverdb", l: "Driver store", col: 2, row: 3, r: "store" },
        { id: "payments", l: "Payment gateway", s: "external, idempotent", col: 3, row: 0, r: "ext" }
      ],
      edges: [
        { a: "rider", b: "matchsvc", l: "request", bend: 0.78 },
        { a: "matchsvc", b: "ridedb", l: "assign", bend: 0.75 },
        { a: "matchsvc", b: "geostore", l: "cells" },
        { a: "matchsvc", b: "drivergw", l: "offer" },
        { a: "driver", b: "drivergw", l: "accept" },
        { a: "drivergw", b: "locstream", async: true },
        { a: "locstream", b: "geostore", l: "update" },
        { a: "drivergw", b: "driverdb", l: "state" },
        { a: "ridedb", b: "payments", l: "charge", async: true }
      ],
      add: ["payments"],
      say: "Ending a trip writes the final state and a charge intent into the same transaction, into an outbox table. A worker reads the outbox and calls the payment provider with an idempotency key derived from the trip id, so a retry after a timeout is guaranteed to be the same charge and not a second one. The trip is a state machine with one row and no in-place arithmetic, so the whole thing is auditable afterwards, which is what you actually need when somebody disputes a fare.",
      breaks: "Demand is not spread evenly over a city or over a day. A stadium empties and one cell has ten thousand riders and forty drivers, while the index and the matcher happily serve every one of those riders the same forty candidates." },

    { t: "5. Hot cells, and pricing as the pressure valve",
      pressure: "Extreme spatial skew. The design so far is uniform, and a city is not: at nine on a Friday the load is concentrated in a handful of cells, and matching in those cells is not a search problem but an allocation one.",
      nodes: [
        { id: "rider", l: "Rider app", col: 0, row: 0, r: "client" },
        { id: "driver", l: "Driver app", col: 0, row: 2, r: "client" },
        { id: "matchsvc", l: "Matching service", s: "batched, per city", col: 1, row: 1, r: "svc" },
        { id: "drivergw", l: "Driver gateway", col: 1, row: 2, r: "svc" },
        { id: "ridedb", l: "Trip store", s: "sharded by city", col: 2, row: 0, r: "store" },
        { id: "geostore", l: "Live geo index", s: "sharded by cell prefix", col: 2, row: 1, r: "cache" },
        { id: "locstream", l: "Location stream", col: 2, row: 2, r: "queue" },
        { id: "driverdb", l: "Driver store", col: 2, row: 3, r: "store" },
        { id: "pricing", l: "Pricing service", s: "fare and surge", col: 2, row: 4, r: "svc" },
        { id: "payments", l: "Payment gateway", col: 3, row: 0, r: "ext" },
        { id: "surge", l: "Demand aggregator", s: "per cell, per minute", col: 3, row: 4, r: "work" }
      ],
      edges: [
        { a: "rider", b: "matchsvc", l: "request", bend: 0.78 },
        { a: "matchsvc", b: "ridedb", l: "assign", bend: 0.75 },
        { a: "matchsvc", b: "geostore", l: "cells" },
        { a: "matchsvc", b: "drivergw", l: "offer" },
        { a: "matchsvc", b: "pricing", l: "quote", bend: 0.75 },
        { a: "driver", b: "drivergw", l: "accept" },
        { a: "drivergw", b: "locstream", async: true },
        { a: "locstream", b: "geostore", l: "update" },
        { a: "drivergw", b: "driverdb", l: "state" },
        { a: "ridedb", b: "payments", l: "charge", async: true },
        { a: "pricing", b: "surge", l: "ratio" }
      ],
      add: ["pricing", "surge"],
      say: "Everything shards by city, because a ride never crosses one and nothing needs to be global. Inside a hot cell, matching in batches over a two second window beats matching greedily one request at a time, since it can assign the whole set closer to optimally. And surge is not a pricing gimmick in this diagram, it is the feedback loop: an aggregator watches the ratio of open requests to available drivers per cell, and price is the only lever that moves supply into the cell instead of just rationing what is there." }
  ],

  boxesIntro: "Eleven components. The two to understand are the live geo index, which is deliberately not durable, and the trip store, which is deliberately not fast. Everything else follows from keeping those two apart.",

  boxes: [
    { id: "rider", n: "Rider app", r: "client",
      job: "Requests a ride, then watches a car move on a map.",
      why: "It is drawn because the tracking connection is a real design element: the rider holds an open channel for the length of the trip, and that is a different traffic shape from the request that started it.",
      forced: "Stage 0 for the request, and the tracking requirement for the connection.",
      alts: [["Polling for the driver's position", "simple and it means a car that moves in jerks, at a poll rate you have to pay for across every rider on a trip."]],
      pros: ["A push channel gives smooth movement at a low message rate.", "The client interpolates between updates, so the network sends four second samples and the user sees continuous motion."],
      cons: ["Another stateful connection tier to run.", "Interpolation means the car on screen is a polite fiction, which matters when the rider is checking whether the driver is really nearby."],
      cost: "One connection per active trip, which is far fewer than one per driver.",
      fails: "The connection drops in a lift or a tunnel. The app falls back to polling, and the trip is unaffected, because tracking is a view of state rather than the state itself.",
      say: "Send four second samples and interpolate on the client. Never try to make the network deliver sixty positions a second so a marker looks smooth." },

    { id: "driver", n: "Driver app", r: "client",
      job: "Pings its location every few seconds and answers offers within a deadline.",
      why: "It is the source of the largest data stream in the system, and the only participant that can accept a trip.",
      forced: "Stage 2.",
      alts: [["Pinging faster, once a second", "four times the firehose for an accuracy nobody perceives, since the client is interpolating anyway."], ["Pinging only when asked", "removes the firehose and means the index is empty exactly when you need it."], ["Adaptive rate", "the right answer: ping rarely when parked, often when moving and on a trip. It is a free reduction in the largest number in the design."]],
      pros: ["Adaptive rates cut the firehose by more than half for no perceptible loss.", "Batching several positions into one message costs a little latency and a lot less overhead."],
      cons: ["Battery and mobile data are a real product constraint, and drivers notice.", "Location is spoofable, and there is a whole fraud problem behind that sentence."],
      cost: "It generates the 250,000 pings per second that the rest of the design exists to survive.",
      fails: "Pings stop, from a tunnel or a dead battery. The TTL expires the driver out of the index within thirty seconds, so they simply stop receiving offers. No cleanup job, no state to repair.",
      say: "Adaptive ping rate, batched, with the client keeping the last few positions so a reconnect can send a short trail rather than a jump." },

    { id: "drivergw", n: "Driver gateway", r: "svc",
      job: "Hold a million driver connections, ingest pings, and push offers back down the same pipe.",
      why: "The offer has to reach a specific driver in under a second, which means somebody has to be holding that driver's connection, and it may as well be the thing already receiving their pings.",
      forced: "Stage 2 for the pings, stage 3 for the offers.",
      alts: [["Plain HTTP posts for pings and push notifications for offers", "works, and it adds seconds of latency to the offer at exactly the moment the driver is deciding whether to accept."], ["Separate gateways for ingest and for offers", "cleaner separation, two connection tiers per driver, and twice the connection cost for no benefit."]],
      pros: ["One connection carries both directions, so the offer arrives immediately.", "Stateless with respect to the ping content: it forwards and forgets.", "It is the natural place to drop pings under load, and dropping a ping is genuinely harmless."],
      cons: ["A stateful tier with a million connections, so deploys and reconnect storms are real work.", "It is on the critical path of both the largest stream and the most time sensitive push."],
      cost: "A million connections at a quarter of a million messages per second. Sized by connections and packet rate, not by CPU.",
      fails: "It is overloaded and starts falling behind. The correct behaviour is to shed pings, which are worthless individually, and to never shed an offer, which is the only latency sensitive message it carries. Say that priority out loud.",
      say: "Pings are droppable, offers are not. Building that priority into the gateway is what lets it be overloaded and still work." },

    { id: "geostore", n: "Live geo index", r: "cache",
      job: "Given a cell, list the drivers currently in it. In memory, expiring, deliberately not durable.",
      why: "The whole matching problem reduces to a bounded lookup by cell, and the data has a useful life of about four seconds. Durability would be paying to persist something already false.",
      forced: "Stage 1 created the index, stage 2 moved it out of the database.",
      alts: [["PostGIS or a spatial index in the main database", "genuinely good and completely correct, and it puts 250,000 durable writes per second on the machine holding your trips."], ["Redis geospatial commands", "exactly this, off the shelf, and a very defensible answer to give by name."], ["A quadtree rebuilt periodically", "better for static data such as restaurants. Terrible here, because rebalancing a tree under a constant stream of moves is all cost and no benefit."]],
      pros: ["Cell ids turn a two dimensional query into a prefix lookup, so ordinary structures work.", "TTL means going offline requires no write and no cleanup.", "Losing it costs about thirty seconds of degraded matching while pings refill it, which is why it needs no replication."],
      cons: ["Cells are squares and cities are not, so a dense cell holds thousands of drivers and an empty one holds none. Hierarchical grids let you vary the level, which is most of why you use one.", "It can be stale, so it produces candidates and never decisions."],
      cost: "About a million small entries, rewritten every four seconds. Sharded by cell prefix, which also keeps a city's data on one node.",
      fails: "A cell covering a stadium holds ten thousand drivers and the lookup returns all of them. Use a finer cell level in dense areas, and cap the candidate list, since you only need the best few.",
      say: "In memory, keyed by cell, thirty second TTL, sharded by cell prefix. It is a cache of where people are, it is allowed to be wrong, and it never decides anything." },

    { id: "locstream", n: "Location stream", r: "queue",
      job: "Carry a sampled copy of the pings to everything that is not matching: the trip trail, analytics, ETA training, dispute evidence.",
      why: "Several consumers want this data and none of them want it in real time. A log gives them all a copy without any of them touching the ingest path.",
      forced: "Stage 2. Without it, either the pings are thrown away entirely and you cannot prove where a car went, or they go into a database and the design collapses.",
      alts: [["Persisting every ping to the trip store", "2 TB a day of data with a four second useful life, in the database holding your money."], ["Keeping nothing", "cheapest, and then a rider disputes a route and you have nothing to show them."]],
      pros: ["Sampling at one in ten cuts the volume by an order of magnitude and loses nothing anybody looks at.", "One stream, several independent consumers, none of which can slow the gateway.", "Replayable, so a broken trail computation is fixable later."],
      cons: ["Another distributed system in the path of the largest data flow.", "Sampling is a decision you cannot undo after the fact."],
      cost: "Roughly 25,000 sampled events per second after a ten to one reduction, retained for hours.",
      fails: "Consumers fall behind and trails are late. Nothing about matching, tracking or payment is affected, which is the entire reason the sampled path is separate from the live index.",
      say: "Sample it. Nobody needs every ping, and the ones that matter, the ones during an active trip, can be sampled at a higher rate than the ones from a parked car." },

    { id: "matchsvc", n: "Matching service", r: "svc",
      job: "Take a request, produce a small candidate list, offer it to drivers one at a time, and assign exactly one.",
      why: "It is the only component that makes an irreversible decision, so it is the only one that needs a transaction.",
      forced: "Stage 0, and its job changed in stage 3 from picking to arbitrating.",
      alts: [["Offering to all nearby drivers and taking the first acceptance", "faster and it means several drivers stop what they are doing for one ride, and it teaches drivers to accept reflexively."], ["Assigning without an offer", "no race at all, and drivers will not accept a system that removes their choice, and the design has to model the refusal anyway."], ["Batched matching over a short window", "better allocation in dense areas, at the cost of a second or two of latency. Worth it exactly where the greedy approach does worst."]],
      pros: ["The candidate set is a few hundred, so ranking can afford to be smart: time of arrival, not straight line distance.", "Assignment is one conditional write, so there is no lock and no coordinator.", "Rejections are cheap: move to the next candidate."],
      cons: ["Offer timeouts are a latency floor you cannot engineer away, because a human is in the loop.", "The batched mode and the greedy mode are two code paths and both have to be correct."],
      cost: "900 requests per second at peak. Almost nothing, which is what lets it be careful.",
      fails: "A driver accepts just as the offer expires and is reassigned. The conditional write means exactly one of the two outcomes wins and the other is told cleanly. Never resolve this with a timeout on the client.",
      say: "The index gives me candidates, the store makes the decision. A conditional update on the trip row and the driver row in one transaction, and the loser gets a clean rejection rather than a race." },

    { id: "ridedb", n: "Trip store", r: "store",
      job: "One durable row per trip, moving through a state machine, plus the outbox that drives payment.",
      why: "This is the money and the evidence. It is the one place in the design where a lost write is unrecoverable.",
      forced: "Stage 3 for assignment, stage 4 for the outbox.",
      alts: [["Keeping trip state in a cache with periodic flushes", "faster and it loses trips on restart, which means losing money and an argument you cannot win."], ["An event sourced trip", "genuinely nice here, since a trip really is a sequence of events, and it is more machinery than a forty five minute answer needs. Worth naming."]],
      pros: ["Strongly consistent, transactional, and shardable by city because a trip never leaves one.", "A state machine with explicit transitions makes illegal states unrepresentable, which is worth more than any index.", "Low write rate, so you can afford synchronous replication."],
      cons: ["It is the slowest thing on the assignment path, and it has to be, since it is what makes assignment correct.", "Sharding by city means a city is a failure domain, which is usually what you want and occasionally not."],
      cost: "25 million rows a day, a few kilobytes each, kept forever. Modest.",
      fails: "The shard for one city is unavailable. That city cannot start rides, and every other city is unaffected. That blast radius is the reason to shard by city rather than by trip id.",
      say: "Sharded by city, state machine transitions only, and the payment intent written in the same transaction as the final state. If those two can be separated by a crash, you have a trip that ended and never charged." },

    { id: "driverdb", n: "Driver store", r: "store",
      job: "Profile, vehicle, documents, and the state that has to be durable: offline, available, on trip.",
      why: "Availability has to be durable even though location does not. Losing where someone is costs four seconds; losing that they are mid trip costs a double assignment.",
      forced: "Stage 2, when the distinction between location and state became the point.",
      alts: [["Keeping availability in the same cache as location", "one system, and a cache eviction now means a driver on a trip becomes available for another one."]],
      pros: ["Low write rate, since state changes a handful of times a day against a location that changes every four seconds.", "A unique constraint on the current trip id is the second half of the exactly once assignment."],
      cons: ["It is another store in the assignment transaction, so either it is co-located with the trip store or you need a two step protocol."],
      cost: "5 million rows, tiny write rate, read on every assignment.",
      fails: "A driver ends a trip and the state update fails, so they never get another offer. Reconcile from the trip store, which is the source of truth for whether a trip is open.",
      say: "Location is a cache, state is a database. The clearest way to say it: if losing the fact costs seconds it is a cache, and if losing it costs money it is a database." },

    { id: "payments", n: "Payment gateway", r: "ext",
      job: "Move money. Somebody else's system, over a network, with an outcome that can be unknown.",
      why: "It is drawn because it is external and unreliable in a specific way that shapes the code around it: a timeout tells you nothing about whether the charge happened.",
      forced: "Stage 4.",
      alts: [["Charging synchronously at the end of the trip", "the rider waits for a third party, and a timeout leaves you with no safe action: retry risks a double charge, and not retrying risks a free ride."], ["Charging optimistically at the start", "removes the failure from the end and creates refunds, which are worse."]],
      pros: ["An idempotency key derived from the trip id makes retrying unconditionally safe, which is the only property that matters here.", "Asynchronous charging means the rider's trip ends when the trip ends."],
      cons: ["Failures are a business process, not an exception: cards decline, and that needs a retry schedule and a human path.", "You are now dependent on somebody else's availability for revenue."],
      cost: "25 million charges a day, each of which may be retried and must not be duplicated.",
      fails: "The call times out. The worker retries with the same idempotency key. The provider either performs the charge once or reports the one it already did. The key is what makes an unknown outcome survivable.",
      say: "Idempotency key equal to the trip id, retried from an outbox with backoff, and a ledger entry written on the confirmation rather than on the attempt. Never derive an idempotency key from a timestamp or a retry count." },

    { id: "pricing", n: "Pricing service", r: "svc",
      job: "Quote a fare before the ride, and compute the final one after it.",
      why: "It is separate because the quote has to be fast and the final fare has to be right, and because pricing rules change far more often than matching logic does.",
      forced: "Stage 5, alongside surge.",
      alts: [["Pricing inside the matching service", "one fewer service, and every pricing experiment now redeploys the component that assigns drivers."]],
      pros: ["Deploys independently, which matters because pricing changes weekly and matching does not.", "The quote can be cached per cell for a short window, since it barely varies between two riders standing together."],
      cons: ["A quote given before the trip and a fare charged after it must agree, or you get complaints. Honour the quote unless the route changed materially, and store the quote with the trip."],
      cost: "One quote per request plus one fare per trip. Small.",
      fails: "It is unavailable at request time. Fall back to a cached or base fare rather than refusing the ride, because a slightly wrong price is better than no service.",
      say: "Store the quote on the trip when it is given. Recomputing the price at the end from scratch is how you end up charging somebody more than you promised." },

    { id: "surge", n: "Demand aggregator", r: "work",
      job: "Watch open requests against available drivers, per cell, per minute, and publish a multiplier.",
      why: "Spatial skew is a supply problem, not a search problem. No amount of indexing produces a driver who is not there, and price is the only lever that moves one into the cell.",
      forced: "Stage 5.",
      alts: [["A fixed price everywhere", "fair sounding, and it means that during a surge everyone waits and nobody can choose to pay to not wait, while drivers have no reason to travel toward the demand."], ["Queueing riders instead of pricing", "used in some markets and by regulation, and it rations the shortage rather than fixing it."]],
      pros: ["Small windowed aggregation over data already in the stream.", "It is a feedback loop: the multiplier changes driver behaviour, which changes the ratio, which changes the multiplier."],
      cons: ["Feedback loops oscillate. Damp it, cap it, and never let the multiplier move faster than drivers can.", "It is the most publicly disliked component in the product, and it needs to be explainable."],
      cost: "A windowed count per cell per minute. Trivially cheap for how much argument it causes.",
      fails: "It oscillates: a high multiplier attracts drivers, the multiplier collapses, they leave, it spikes again. Smooth over several minutes and cap the rate of change.",
      say: "Per cell, per minute, smoothed and capped. It is a control loop, so I would design it with the same care as any control loop: damping first, then the setpoint." }
  ],

  flowsIntro: "Three paths, and notice how differently they are priced. The ping path is enormous and cheap, the match path is tiny and careful, and the money path is small and paranoid.",

  flows: [
    { n: "A location ping",
      note: "Two hundred and fifty thousand of these a second, and every one of them is allowed to fail.",
      steps: [
        ["The driver app sends a position over its open connection, batched with the last few if it has them.", "async"],
        ["The gateway computes the cell id and writes the driver into that cell in the live index with a fresh TTL.", "async"],
        ["One ping in ten also goes to the stream, at a higher rate while a trip is active, for the trail and for analytics.", "async"],
        ["Nothing durable is written. If the whole path drops this ping, the next one arrives in four seconds.", "async"]
      ] },
    { n: "Requesting and matching a ride",
      steps: [
        ["The rider requests a ride from a pickup point. The matching service asks pricing for a quote and stores it with the request.", "sync"],
        ["It computes the pickup cell, reads it and its neighbours from the live index, and gets a few hundred candidates.", "sync"],
        ["It filters to available drivers and ranks by estimated arrival time, not by straight line distance, because a river is not a small detour.", "sync"],
        ["It offers to the best candidate through the driver gateway, with a fifteen second deadline. The rider sees searching.", "sync"],
        ["The driver accepts. The service performs one transaction: set the trip's driver where it is null, and set the driver's trip where it is null. Exactly one acceptance can win.", "sync"],
        ["If nobody accepts, move to the next candidate. If the cell is starved, this is the loop that surge exists to break.", "sync"]
      ] },
    { n: "Ending the trip and charging for it",
      steps: [
        ["The driver ends the trip. The final fare is computed from the actual route, compared against the stored quote, and the trip row moves to completed.", "sync"],
        ["In the same transaction, a charge intent is written to the outbox with an idempotency key equal to the trip id.", "sync"],
        ["A worker reads the outbox and calls the payment provider. A timeout means retry with the same key, forever, with backoff.", "async"],
        ["On confirmation, a ledger entry is written and the driver's earnings are credited. On a decline, the trip enters a payment failed state, which is a business process rather than an error.", "async"],
        ["Receipts, ratings and the trip trail all run off the same completion event and none of them can delay it.", "async"]
      ] }
  ],

  api: [
    ["POST /v1/rides", "202 {ride_id, quote}", "Accepted, not matched. Matching involves waiting for a human, so it cannot be a synchronous response. The client subscribes for the outcome."],
    ["POST /v1/rides/{id}/accept", "200 or 409", "Called by the driver. The 409 is not an error condition, it is the normal answer to whoever lost the race, and the app should say the ride is gone."],
    ["POST /v1/drivers/location", "204", "The firehose. Fire and forget, batched, and droppable under load without anybody being told."],
    ["GET /v1/rides/{id}/track", "stream of positions", "A push channel for the length of the trip. The client interpolates between the samples."],
    ["POST /v1/rides/{id}/complete", "200 {fare}", "Writes final state and the charge intent in one transaction. The charge itself happens later, from the outbox."]
  ],
  apiNote: "Two things worth saying: the ride request returns 202 because a human has to press a button before it can be anything else, and the accept endpoint returns 409 as a normal outcome rather than as a failure. Designing the losing path as a first class response is what makes the race safe.",

  schema: { n: "What is durable, and what is deliberately not", lang: "text",
    note: "The whole design is in this split. Read it as two columns: the left one can be lost, the right one cannot.",
    code:
"IN MEMORY, TTL 30s              DURABLE, FOREVER\n" +
"  geo:{cell_id} -> driver ids     trips\n" +
"    rewritten every 4s              trip_id, rider_id, driver_id NULL\n" +
"    losing it costs 30 seconds      state, quote, fare, city_id\n" +
"                                    UNIQUE partial index on driver_id\n" +
"  driver:{id}:loc -> lat,lng          WHERE state = 'active'\n" +
"    the live position\n" +
"                                  outbox\n" +
"SAMPLED, HOURS                      trip_id, intent, idem_key\n" +
"  location stream, 1 in 10          written in the SAME transaction\n" +
"    trail, analytics, disputes\n" +
"                                  drivers\n" +
"                                    driver_id, state, current_trip_id\n" +
"                                    profile, vehicle, documents\n" +
"\n" +
"the assignment, one transaction:\n" +
"  UPDATE trips  SET driver_id=:d WHERE trip_id=:t AND driver_id IS NULL\n" +
"  UPDATE drivers SET current_trip_id=:t WHERE driver_id=:d\n" +
"                                       AND current_trip_id IS NULL\n" +
"  both affected 1 row, or the whole thing rolls back and the driver\n" +
"  is told the ride is gone" },

  deep: [
    { n: "Why a normal index cannot answer where is the nearest driver",
      note: "An index on latitude finds everyone in a horizontal band that wraps the planet. An index on longitude finds a vertical one. Intersecting them means fetching two enormous sets to keep a tiny one, and the database will usually choose one index and filter the rest, which is a scan wearing a costume.<br><br>Space filling curves fix this by mapping two dimensions to one while mostly preserving locality. Geohash interleaves the bits of latitude and longitude, so a shared prefix means physical proximity and a prefix range becomes an ordinary index range. S2 and H3 do the same thing more carefully: S2 uses a Hilbert curve on the surface of a cube, and H3 uses hexagons, which have the pleasant property that all six neighbours are the same distance away, unlike a square's edges and corners.<br><br>All of them have the same seam problem: two points either side of a cell boundary can be metres apart and share no prefix, which is exactly why you always read the neighbouring cells too and filter by real distance afterwards. Getting that detail right is the difference between knowing the name of the technique and knowing the technique." },

    { n: "The double assignment, and why a cache cannot prevent it",
      note: "Two riders in the same cell, two matching processes, one driver. Both read the index, both see the driver, both offer. If the driver's app shows two offers and they tap both, or if a retry duplicates an acceptance, you have one car and two passengers.<br><br>A cache cannot arbitrate this, because the index is a stale view by construction. The arbitration has to happen on a durable store with a real condition. Two conditional updates in one transaction, the trip's driver where it is null and the driver's current trip where it is null, and the loser's transaction affects zero rows and rolls back. No lock is held across the network, no coordinator exists, and the failure mode of every component involved is a clean rejection.<br><br>The generalisable lesson, which is the reason this problem is asked: <b>read from the fast stale thing, decide on the slow correct thing.</b> Candidate generation and arbitration are different jobs with different guarantees, and mixing them is where the newspaper stories come from." },

    { n: "Sharding by city, and why geography is the right key",
      note: "A ride starts and ends in the same city. Almost every query, index lookup and trip is local to one, and nothing needs to join across two. That makes city the natural shard key, and it comes with three benefits that are worth saying out loud: a city is a failure domain, so an outage is local; a city has its own peak hour, so load is naturally spread across shards by timezone; and pricing, regulation and supply are already per city in the business, so the technical boundary matches the organisational one.<br><br>The awkward cases are worth naming before the interviewer does. Airports sit between cities and need explicit ownership. Long trips can cross a boundary, so the trip belongs to the city it started in and stays there. And a city like Delhi is a hundred times the size of a small one, so cities are not shards, they are assigned to shards, and the biggest ones get a shard to themselves." },

    { n: "Greedy matching versus batched matching",
      note: "Greedy matching assigns each request to the best available driver the moment it arrives. It is simple, it has the lowest latency, and in a dense area it is measurably worse: assigning the nearest driver to whoever asked first can leave a later request with a driver ten minutes away, when a swap would have served both in three.<br><br>Batched matching collects requests over a short window, a second or two, and solves an assignment problem over the whole set. The improvement is real in dense cells and negligible in sparse ones, and it costs everybody the window in latency. So run both: greedy where supply is loose, batched where the demand to supply ratio is above some threshold, which is a number the aggregator already computes for surge. That is a nice property of this design worth pointing at: the signal that triggers surge is the same signal that should switch the matching mode." }
  ],

  tradeoffsIntro: "The first two here are the design. If you can only argue one point in an interview, argue the first.",

  tradeoffs: [
    { a: ["Locations in memory, expiring", "250k writes a second cost almost nothing. Losing the whole thing costs thirty seconds of degraded matching."],
      b: ["Locations in the transactional database", "One system, one query, full durability, and 250,000 durable writes a second on the machine that holds your money."],
      pick: "a",
      flip: "you are legally required to retain every position, in which case you still keep the live index in memory and persist a copy through the stream. Even then the answer is both, not one." },
    { a: ["Offer to one driver at a time", "The driver's choice is meaningful, and no wasted interruptions. Costs a few seconds per rejection."],
      b: ["Broadcast to all nearby drivers, first to accept wins", "Fastest possible match, and it interrupts ten drivers for one ride and trains everybody to tap accept reflexively."],
      pick: "a",
      flip: "supply is desperately short and the cell has been searching for a while. Then broadcasting to a small set is better than a rider standing in the rain, and it is a deliberate escalation rather than the default." },
    { a: ["Charge asynchronously from an outbox", "The trip ends when the trip ends. Retries are safe because the idempotency key is the trip id."],
      b: ["Charge synchronously at trip end", "The rider knows immediately whether payment worked, and they wait for a third party, and a timeout leaves you with no safe move."],
      pick: "a",
      flip: "the market requires the payment to be confirmed in person, for example a cash or terminal flow. Then it is synchronous by law and the design has to carry the unknown outcome in the interface instead." },
    { a: ["Shard by city", "Local failures, natural load spread, and a boundary the business already uses."],
      b: ["Shard by trip id, uniformly", "Perfectly even load, and every city's traffic is spread across every shard, so a shard outage degrades every city at once."],
      pick: "a",
      flip: "one city is so large that it exceeds a shard, which happens. Then that city gets several shards keyed by cell prefix, and the principle is unchanged: the key follows geography." }
  ],

  next: [
    "<b>Pooled rides.</b> This turns matching from an assignment problem into a routing one, and it is a genuinely different algorithm rather than an extension of this one.",
    "<b>Driver positioning.</b> Predicting demand per cell and nudging drivers toward it before the surge, which is worth more than pricing after it.",
    "<b>Offline and degraded modes.</b> A driver in a tunnel, a rider with no signal at the end of a trip. Both should complete when connectivity returns.",
    "<b>Fraud.</b> Spoofed locations, collusion between a driver and a rider, and cancelled trips that were completed. All of it hangs off the sampled trail rather than off the live index."
  ],

  p: [
    ["HI", "https://www.hellointerview.com/learn/system-design/problem-breakdowns/uber", "Hello Interview, Uber", "H"],
    ["GFG", "https://www.geeksforgeeks.org/system-design/system-design-of-uber-app-uber-system-architecture/", "GFG, Uber architecture", "H"],
    ["DG", "https://www.designgurus.io/course-play/grokking-the-system-design-interview/doc/design-uber-backend", "Design Gurus, Uber backend", "H"],
    ["GFG", "https://www.geeksforgeeks.org/dsa/geohashing-and-quadtrees-for-location-based-services/", "Geohashing and quadtrees", "M"],
    ["GH", "https://github.com/ashishps1/awesome-system-design-resources", "Awesome system design resources", "E"]
  ],

  hi: {
    one: "Do mushkil cheezein, aur dono ulti direction mein kheenchti hain. Driver locations ek firehose hain jinhe koi durable nahi chahta, aur match ek chhota sa transaction hai jo ek driver ko kabhi do riders ko nahi dena chahiye. Is design ki lagbhag har galti tab hoti hai jab dono ko ek jaisa treat kiya jaata hai.",
  
    brief: {
      why: "Yahan ka trap hai ek hi system design kar dena. Location stream 250,000 writes per second ka data hai jo chaar second baad bekaar ho jaata hai, aur matching 900 requests per second ka data hai jiske liye aap court tak jaoge. Dono ko ek hi database mein daaloge to ya to us durability ka paisa doge jo chahiye hi nahi, ya woh paisa kho doge jo chahiye tha. Pehle do minute mein inhe alag kar dena hi aadha kaam hai.",
      functional: [
        "<b>Ride request karo.</b> Rider pickup point se car maangta hai, aur use driver, estimate aur arrival time milta hai.",
        "<b>Match karo.</b> System paas ke available drivers dhoondhta hai, trip offer karta hai, aur ek hi driver assign karta hai.",
        "<b>Track karo.</b> Dono taraf ke log poori trip mein map par car ko chalte dekhte hain.",
        "<b>Charge karo.</b> Trip khatam hoti hai, fare compute hota hai, aur paisa move hota hai. Sirf ek baar."
      ],
      out: ["routing aur ETA engine khud", "driver onboarding aur background checks", "pooled rides", "food delivery", "fraud system"],
      nfr: [
        ["Match latency", "under 5 seconds end to end", "Isme insaan ke accept dabane ka wait bhi shamil hai, aur zyada time wahi jaata hai. System ka apna budget kuch sau milliseconds hai."],
        ["Assignment", "exactly one driver per ride, always", "Ek hi jagah jahan strong consistency par koi samjhauta nahi. Ek car mein do riders akhbaar ki khabar hai, incident report nahi."],
        ["Location freshness", "within about 5 seconds", "Jo car uchhal kar jump kare woh lag karti car se buri hai. Yeh freshness ki zaroorat hai, durability ki nahi, aur poora design isi farak par tika hai."],
        ["Availability", "99.99% on request and track", "Baarish mein footpath par khada rider ke paas koi fallback nahi hota. Dhyan do ki location tier data kho sakta hai aur product phir bhi chalta hai."],
        ["Money", "charged exactly once, auditable", "Payments ko idempotency keys aur immutable ledger milta hai. Yahan baaki sab kuch approximate ho sakta hai; yeh nahi."]
      ],
      numbers: [
        ["Online drivers", "about 1M at peak", "Registered shayad 5M mein se. Concurrent number hi har cheez ka size decide karta hai."],
        ["Location pings", "about 250k per second", "Ek million drivers, har chaar second mein ek ping. Yeh design ka sabse bada number hai, lagbhag teen sau guna bada."],
        ["Ride requests", "about 900 per second at peak", "Roz 25 million rides, shaam ko strong peak ke saath. Bahut chhota. Dono numbers saath bol do to design khud samajh aa jaata hai."],
        ["The ratio", "about 280 to 1", "Locations aur matches ka ratio. Do systems, do tarah ki guarantees, do technologies. Jo bhi inhe ek jaisa treat kare woh ek ke liye galat hoga."],
        ["Location volume if persisted", "about 2 TB per day", "250k pings, har ek lagbhag 100 bytes. Aur kuch second baad woh bekaar hai, isliye live copy memory mein hai aur sirf sampled trail rakhi jaati hai."],
        ["Trip storage", "about 18 TB per year", "Roz 25M trips, har ek do-teen kilobytes. Durable, immutable, aur hamesha ke liye, kyunki yeh paisa hai aur saboot bhi."],
        ["Search radius", "about 3 km, a few hundred drivers", "Isliye geospatial index ko sirf chhota sa set return karna padta hai. Index candidate list ko bound karne ke liye hai, sort karne ke liye nahi."]
      ],
      numbersNote: "<b>250,000 against 900.</b> Kuch bhi draw karne se pehle yeh do numbers board par saath likh do. Yeh batate hain ki firehose kabhi us database ko na chhue jisme trip hai, aur matching path zyada careful reh sakta hai kyunki uske muqable woh lagbhag khaali hai."
    },
  
    stagesIntro: "Chhe stages. Pehle do us query ko theek karte hain jo scale nahi ho sakti, beech ke do do workloads ko alag karte hain jo kabhi ek machine par nahi hone chahiye, aur aakhri do paisa handle karte hain aur is baat ko ki demand poore shehar mein barabar nahi faili hoti.",
  
    stages: [
      { t: "0. Ask every driver where they are",
        pressure: "Abhi kuch nahi. Naive matcher draw karne layak hai kyunki uski failure conceptual nahi quantitative hai, aur uska fix hi is problem ka ekmaatra asli naya idea hai.",
        say: "Har driver ki ek row hai jisme latitude aur longitude hai. Sabse paas wala dhoondhne ke liye sabse distance nikalo aur sort karo. Yeh sahi hai, ek hi query hai, aur yahi woh version hai jo sab pehle likhte hain.",
        breaks: "Har request par ek million rows scan, 900 baar per second, jabki wahi rows 250,000 baar per second update ho rahi hain. Scan kisi cheez mein quadratic nahi hai aur phir bhi umeed nahi, kyunki latitude par B-tree aur longitude par B-tree do dimensional sawaal ka jawab nahi de sakte: latitude par index aapko woh saare drivers deta hai jo ek band mein hain, aur woh band poori duniya ko cross karta hai." },
  
      { t: "1. Index by place, not by identity",
        pressure: "Do dimensions mein ek range query. Yeh problem ka ekmaatra asli specialised computer science hai, aur fix hai do dimensions ko ek mein badal dena.",
        say: "Duniya ko hierarchical grid se cells mein kaato, geohash, S2 ya H3, taaki cell ek single string ho aur paas ki jagahein ek prefix share karein. Driver ki location ek cell id ban jaati hai. Paas ke drivers dhoondhna ab yeh hai: rider ka cell nikalo, uske aath neighbours lo, woh nau lists padho, phir exact distance se filter karo. Do dimensions ek ho gaye, to normal index chalta hai, aur candidate set ek million ki jagah kuch sau ka hai.",
        breaks: "Index ab sahi hai, par woh ek aise database mein hai jo 250,000 writes per second le raha hai, aur us data ki umar chaar second hai. Har write ek durable, replicated, logged transaction hai ek aise fact ke liye jo flush hone se pehle hi galat ho chuka hoga." },
  
      { t: "2. Get the firehose off the database",
        pressure: "Do sau pachaas hazaar writes per second jo fresh chahiye aur restart survive karne ki zaroorat nahi. Yeh database workload nahi hai, aur iske liye database ke daam dena yahan ki sabse mehngi galti hai.",
        say: "Drivers ek persistent connection se gateway se jude rehte hain jo pings ingest karta hai. Live index memory mein hai, cell ke hisaab se key kiya hua, tees second ki TTL ke saath, to offline jaane wala driver bina kisi row likhe gayab ho jaata hai. Ek sampled copy stream mein jaati hai trip trail, analytics aur disputes ke liye, shayad das mein ek ping. Durable store sirf state changes dekhta hai: online, offline, on a trip.",
        breaks: "Matching mein abhi bhi woh bug hai jo matter karta hai. Ek hi cell mein do riders ek hi pal mein ek hi paas ka driver padhte hain, dono offer karte hain, aur driver dono accept kar leta hai. Index ek cache hai aur cache arbitrate nahi kar sakta." },
  
      { t: "3. One driver, one rider, and the offer protocol",
        pressure: "System ki ekmaatra strong consistency requirement. Baaki sab kuch stale ho sakta hai; yeh nahi, aur iske liye cache par compare and set nahi, durable store par transaction chahiye.",
        say: "Index candidates deta hai, straight line distance ki jagah estimated time of arrival se ranked, kyunki nadi ko parwah nahi ki aap kitne paas ho. Offer ek baar mein ek driver ko jaata hai, chhoti deadline ke saath, aur acceptance ek conditional write hai: trip ka driver isi driver par set karo sirf agar woh abhi null hai, aur driver ka current trip bhi sirf agar woh null hai, ek hi transaction mein. Doosra acceptance condition par fail hota hai, driver ko bata diya jaata hai ki ride ja chuki, aur kahin koi lock nahi lagana pada.",
        breaks: "Trip khatam hoti hai aur paisa move karna hai. Payment kisi aur ke system ko call hai, woh bina bataye time out ho sakta hai ki chala ya nahi, aur use retry karke double charge kabhi nahi hona chahiye." },
  
      { t: "4. The trip, the money, and the outbox",
        pressure: "Ek external system jo us tarah fail ho sakta hai jisse distributed systems sabse zyada nafrat karte hain: unknown outcome. Do baar charge karna der se charge karne se bura hai, isliye yeh poora path safely retryable hone ke around design hai.",
        say: "Trip khatam karna final state aur ek charge intent ko ek hi transaction mein likhta hai, ek outbox table mein. Ek worker outbox padhta hai aur payment provider ko trip id se bani idempotency key ke saath call karta hai, to timeout ke baad retry guaranteed wahi charge hai, doosra nahi. Trip ek state machine hai, ek row, in-place arithmetic nahi, to sab kuch baad mein auditable hai, aur fare par jhagda hone par asli zaroorat yahi hoti hai.",
        breaks: "Demand ek shehar mein ya ek din mein barabar nahi faili hoti. Stadium khaali hota hai aur ek cell mein das hazaar riders aur chalis drivers ho jaate hain, jabki index aur matcher khushi se un sab riders ko wahi chalis candidates serve karte rehte hain." },
  
      { t: "5. Hot cells, and pricing as the pressure valve",
        pressure: "Bahut zyada spatial skew. Ab tak ka design uniform hai, aur shehar nahi: Friday raat nau baje load kuch cells mein concentrate ho jaata hai, aur un cells mein matching search problem nahi allocation problem hai.",
        say: "Sab kuch city ke hisaab se shard hota hai, kyunki ride kabhi ek city cross nahi karti aur kuch global nahi chahiye. Hot cell ke andar do second ke window mein batches mein matching, ek ek request ko greedily karne se behtar hai, kyunki woh poore set ko optimal ke zyada paas assign kar sakti hai. Aur surge yahan pricing gimmick nahi, feedback loop hai: aggregator har cell mein open requests aur available drivers ka ratio dekhta hai, aur price hi woh ekmaatra lever hai jo supply ko us cell mein kheenchta hai, bas jo hai use ration nahi karta." }
    ],
  
    boxesIntro: "Gyarah components. Do samajhne layak hain: live geo index, jo jaan-boojhkar durable nahi hai, aur trip store, jo jaan-boojhkar fast nahi hai. Baaki sab in dono ko alag rakhne se nikalta hai.",
  
    boxes: [
      { job: "Ride request karta hai, phir map par car ko chalte dekhta hai.",
        why: "Yeh isliye draw hai kyunki tracking connection ek asli design element hai: rider poori trip ke liye ek open channel rakhta hai, aur woh us request se alag traffic shape hai jisne trip shuru ki.",
        forced: "Request ke liye stage 0, aur connection ke liye tracking requirement.",
        alts: [["Polling for the driver's position", "simple hai, aur iska matlab hai car jhatke se chalti dikhti hai, aur poll rate ka kharcha trip par har rider ke liye dena padta hai."]],
        pros: ["Push channel kam message rate par smooth movement deta hai.", "Client updates ke beech interpolate karta hai, to network chaar second ke samples bhejta hai aur user ko continuous motion dikhta hai."],
        cons: ["Ek aur stateful connection tier chalana padta hai.", "Interpolation ka matlab hai screen par car ek meethi kalpana hai, jo tab matter karta hai jab rider check kar raha ho ki driver sach mein paas hai ya nahi."],
        cost: "Har active trip par ek connection, jo har driver par ek se bahut kam hai.",
        fails: "Lift ya tunnel mein connection tootta hai. App polling par fall back karta hai, aur trip par koi asar nahi padta, kyunki tracking state ka ek view hai, state khud nahi.",
        say: "Chaar second ke samples bhejo aur client par interpolate karo. Network se sixty positions per second dilwane ki koshish kabhi mat karo sirf isliye ki marker smooth dikhe." },
  
      { job: "Har kuch second mein apni location ping karta hai aur deadline ke andar offers ka jawab deta hai.",
        why: "Yeh system ki sabse badi data stream ka source hai, aur trip accept kar sakne wala ekmaatra participant.",
        forced: "Stage 2.",
        alts: [["Pinging faster, once a second", "firehose chaar guna, aisi accuracy ke liye jo koi mehsoos nahi karta, kyunki client waise bhi interpolate kar raha hai."], ["Pinging only when asked", "firehose hat jaata hai, aur index tab khaali hota hai jab uski sabse zyada zaroorat hoti hai."], ["Adaptive rate", "sahi jawab: khadi ho to kam ping, chal rahi ho ya trip par ho to zyada. Yeh design ke sabse bade number mein free kami hai."]],
        pros: ["Adaptive rates firehose ko aadhe se zyada kam kar dete hain, bina kisi mehsoos hone waali loss ke.", "Kai positions ek message mein batch karne se thodi latency lagti hai aur overhead bahut kam hota hai."],
        cons: ["Battery aur mobile data asli product constraint hain, aur drivers dhyan dete hain.", "Location spoof ho sakti hai, aur us ek line ke peeche poori fraud problem hai."],
        cost: "Yeh woh 250,000 pings per second banata hai jinhe survive karne ke liye baaki design bana hai.",
        fails: "Pings ruk jaate hain, tunnel ya dead battery se. TTL driver ko tees second ke andar index se expire kar deti hai, to unhe offers milna band ho jaata hai. Na cleanup job, na repair karne ko state.",
        say: "Adaptive ping rate, batched, aur client aakhri kuch positions rakhe taaki reconnect par jump ki jagah chhoti trail bheji ja sake." },
  
      { job: "Ek million driver connections hold karo, pings ingest karo, aur offers usi pipe se wapas bhejo.",
        why: "Offer ko ek second se kam mein ek specific driver tak pahunchna hai, matlab kisi ko us driver ka connection pakde rehna hai, aur woh wahi ho sakta hai jo pehle se uske pings le raha hai.",
        forced: "Pings ke liye stage 2, offers ke liye stage 3.",
        alts: [["Plain HTTP posts for pings and push notifications for offers", "chalta hai, aur offer mein kuch second ki latency jod deta hai, theek us waqt jab driver sochta hai ki accept kare ya nahi."], ["Separate gateways for ingest and for offers", "saaf separation hai, har driver par do connection tiers, aur bina faayde ke doguna connection cost."]],
        pros: ["Ek connection dono directions carry karta hai, to offer turant pahunchta hai.", "Ping ke content ke hisaab se stateless: forward karta hai aur bhool jaata hai.", "Load mein pings drop karne ki natural jagah hai, aur ek ping drop karna sach mein harmless hai."],
        cons: ["Ek million connections wala stateful tier, to deploys aur reconnect storms asli kaam hain.", "Yeh sabse badi stream aur sabse time-sensitive push, dono ke critical path par hai."],
        cost: "Ek million connections aur dhai lakh messages per second. Connections aur packet rate se size hota hai, CPU se nahi.",
        fails: "Yeh overload ho jaata hai aur peeche girne lagta hai. Sahi behaviour hai pings shed karna, jo akele mein bekaar hain, aur offer kabhi shed na karna, jo isme ekmaatra latency-sensitive message hai. Yeh priority zor se bolo.",
        say: "Pings droppable hain, offers nahi. Yeh priority gateway mein build karne se hi woh overload hokar bhi kaam karta hai." },
  
      { job: "Ek cell diya ho to abhi usme kaun se drivers hain, list karo. Memory mein, expire hone waala, jaan-boojhkar durable nahi.",
        why: "Poori matching problem cell se ek bounded lookup par aa jaati hai, aur data ki useful life lagbhag chaar second hai. Durability ka matlab hai aisi cheez persist karne ka paisa dena jo pehle se galat hai.",
        forced: "Stage 1 ne index banaya, stage 2 ne use database se bahar nikala.",
        alts: [["PostGIS or a spatial index in the main database", "sach mein achha aur bilkul sahi, aur woh 250,000 durable writes per second us machine par daal deta hai jisme aapki trips hain."], ["Redis geospatial commands", "bilkul yahi, off the shelf, aur naam lekar dene ke liye bahut defensible jawab."], ["A quadtree rebuilt periodically", "restaurants jaise static data ke liye behtar. Yahan bekaar, kyunki moves ki lagataar stream ke neeche tree rebalance karna sirf cost hai, faayda nahi."]],
        pros: ["Cell ids do dimensional query ko prefix lookup bana dete hain, to normal structures chalte hain.", "TTL ka matlab hai offline jaane par na write, na cleanup.", "Ise kho dene ka cost lagbhag tees second ki degraded matching hai jab tak pings ise bhar nahi dete, isliye isko replication nahi chahiye."],
        cons: ["Cells chaukor hain aur shehar nahi, to dense cell mein hazaaron drivers hote hain aur khaali mein koi nahi. Hierarchical grids se level badal sakte ho, aur ek use karne ki sabse badi wajah yahi hai.", "Yeh stale ho sakta hai, isliye yeh candidates banata hai, decisions kabhi nahi."],
        cost: "Lagbhag ek million chhoti entries, har chaar second mein dobara likhi jaati hain. Cell prefix se sharded, jisse ek city ka data ek node par bhi rehta hai.",
        fails: "Ek stadium cover karne wale cell mein das hazaar drivers hain aur lookup sab return kar deta hai. Dense areas mein finer cell level use karo, aur candidate list cap karo, kyunki sirf kuch best chahiye.",
        say: "Memory mein, cell se keyed, tees second TTL, cell prefix se sharded. Yeh logon kahan hain uska cache hai, isko galat hone ki chhoot hai, aur yeh kabhi kuch decide nahi karta." },
  
      { job: "Pings ki sampled copy un sab ko do jo matching nahi hain: trip trail, analytics, ETA training, dispute evidence.",
        why: "Kai consumers yeh data chahte hain aur koi bhi real time mein nahi chahta. Ek log sabko copy de deta hai bina kisi ke ingest path ko chhue.",
        forced: "Stage 2. Iske bina ya to pings poori tarah phenk diye jaate hain aur aap sabit nahi kar sakte ki car kahan gayi, ya woh database mein jaate hain aur design dhah jaata hai.",
        alts: [["Persisting every ping to the trip store", "roz 2 TB aise data ka jiski useful life chaar second hai, us database mein jisme aapka paisa hai."], ["Keeping nothing", "sabse sasta, aur phir rider route par dispute karta hai aur aapke paas dikhane ko kuch nahi."]],
        pros: ["Das mein ek sampling volume ko ek order of magnitude kam kar deti hai aur woh kuch nahi khoti jo koi dekhta hai.", "Ek stream, kai independent consumers, koi bhi gateway ko slow nahi kar sakta.", "Replayable, to kharab trail computation baad mein theek ho sakti hai."],
        cons: ["Sabse bade data flow ke path mein ek aur distributed system.", "Sampling ek aisa decision hai jo baad mein undo nahi kar sakte."],
        cost: "Das se ek reduction ke baad lagbhag 25,000 sampled events per second, kuch ghante retain.",
        fails: "Consumers peeche reh jaate hain aur trails late aate hain. Matching, tracking ya payment par koi asar nahi, aur sampled path ko live index se alag rakhne ki poori wajah yahi hai.",
        say: "Sample karo. Har ping kisi ko nahi chahiye, aur jo matter karte hain, active trip ke pings, unhe khadi car ke pings se zyada rate par sample kiya ja sakta hai." },
  
      { job: "Request lo, chhoti candidate list banao, drivers ko ek ek karke offer karo, aur exactly ek ko assign karo.",
        why: "Yeh ekmaatra component hai jo irreversible decision leta hai, isliye ekmaatra jise transaction chahiye.",
        forced: "Stage 0, aur stage 3 mein iska kaam picking se badalkar arbitrating ho gaya.",
        alts: [["Offering to all nearby drivers and taking the first acceptance", "tez hai, aur iska matlab hai ki kai drivers ek ride ke liye kaam chhod dete hain, aur drivers ko reflexively accept karna sikhata hai."], ["Assigning without an offer", "koi race hi nahi, aur drivers aisa system nahi maanenge jo unki choice hata de, aur design ko refusal phir bhi model karna padta hai."], ["Batched matching over a short window", "dense areas mein behtar allocation, ek do second ki latency ke badle. Bilkul wahan worth it jahan greedy approach sabse kharab karta hai."]],
        pros: ["Candidate set kuch sau ka hai, to ranking smart ho sakti hai: time of arrival, straight line distance nahi.", "Assignment ek conditional write hai, to na lock, na coordinator.", "Rejections sasti hain: agle candidate par chalo."],
        cons: ["Offer timeouts latency ka ek floor hain jo engineering se nahi hatta, kyunki loop mein insaan hai.", "Batched mode aur greedy mode do code paths hain aur dono sahi hone chahiye."],
        cost: "Peak par 900 requests per second. Lagbhag kuch nahi, aur isi se woh careful reh paata hai.",
        fails: "Ek driver theek tab accept karta hai jab offer expire ho raha hai aur use reassign kar diya jaata hai. Conditional write ka matlab hai do mein se exactly ek outcome jeet-ta hai aur doosre ko saaf bata diya jaata hai. Ise kabhi client par timeout se resolve mat karo.",
        say: "Index mujhe candidates deta hai, store decision leta hai. Trip row aur driver row par ek transaction mein conditional update, aur haarne wale ko race ki jagah saaf rejection milta hai." },
  
      { job: "Ek trip ki ek durable row, jo state machine se guzarti hai, aur woh outbox jo payment chalata hai.",
        why: "Yeh paisa aur saboot hai. Design mein ek hi jagah jahan khoya hua write recover nahi ho sakta.",
        forced: "Assignment ke liye stage 3, outbox ke liye stage 4.",
        alts: [["Keeping trip state in a cache with periodic flushes", "tez hai, aur restart par trips kho deta hai, matlab paisa kho dena aur ek aisi behes jo aap jeet nahi sakte."], ["An event sourced trip", "yahan sach mein achha, kyunki trip sach mein events ka sequence hai, aur paintalis minute ke jawab ke liye zyada machinery hai. Naam lene layak."]],
        pros: ["Strongly consistent, transactional, aur city se shardable kyunki trip kabhi ek se bahar nahi jaati.", "Explicit transitions wali state machine illegal states ko represent hi nahi hone deti, jo kisi bhi index se zyada kimti hai.", "Write rate kam hai, to synchronous replication afford kar sakte ho."],
        cons: ["Assignment path par sabse slow cheez yahi hai, aur hoga hi, kyunki assignment ko sahi yahi banata hai.", "City se sharding ka matlab hai ek city ek failure domain hai, jo aam taur par chahiye aur kabhi kabhi nahi."],
        cost: "Roz 25 million rows, har ek kuch kilobytes, hamesha ke liye rakhi. Modest.",
        fails: "Ek city ka shard unavailable hai. Woh city rides shuru nahi kar sakti, aur baaki sab cities par koi asar nahi. Yahi blast radius wajah hai trip id ke bajay city se shard karne ki.",
        say: "City se sharded, sirf state machine transitions, aur payment intent final state ke saath usi transaction mein likha. Agar in dono ko crash alag kar sakta hai, to aapke paas ek trip hai jo khatam hui aur kabhi charge nahi hui." },
  
      { job: "Profile, vehicle, documents, aur woh state jo durable honi chahiye: offline, available, on trip.",
        why: "Availability durable honi chahiye bhale hi location na ho. Kaun kahan hai yeh kho dene ka cost chaar second hai; yeh kho dene ka ki woh trip par hai, double assignment.",
        forced: "Stage 2, jab location aur state ka farak hi point ban gaya.",
        alts: [["Keeping availability in the same cache as location", "ek system, aur ab cache eviction ka matlab hai ki trip par driver doosri trip ke liye available ho jaata hai."]],
        pros: ["Write rate kam hai, kyunki state din mein kuch baar badalti hai jabki location har chaar second mein.", "Current trip id par unique constraint exactly once assignment ka doosra half hai."],
        cons: ["Yeh assignment transaction mein ek aur store hai, to ya to ise trip store ke saath co-locate karo ya do step protocol chahiye."],
        cost: "5 million rows, bahut kam write rate, har assignment par read.",
        fails: "Driver trip khatam karta hai aur state update fail ho jaata hai, to use kabhi doosra offer nahi milta. Trip store se reconcile karo, jo is baat ka source of truth hai ki trip open hai ya nahi.",
        say: "Location cache hai, state database hai. Kehne ka sabse saaf tareeka: fact kho dene ka cost seconds hai to cache, aur paisa hai to database." },
  
      { job: "Paisa move karo. Kisi aur ka system, network par, aur outcome unknown ho sakta hai.",
        why: "Yeh isliye draw hai kyunki yeh external hai aur ek specific tareeke se unreliable, jo uske around ka code shape karta hai: timeout aapko kuch nahi batata ki charge hua ya nahi.",
        forced: "Stage 4.",
        alts: [["Charging synchronously at the end of the trip", "rider ek third party ka wait karta hai, aur timeout ke baad koi safe action nahi bachta: retry karo to double charge ka risk, na karo to free ride ka."], ["Charging optimistically at the start", "failure end se hat jaata hai aur refunds ban jaate hain, jo zyada bure hain."]],
        pros: ["Trip id se bani idempotency key retry ko bina shart safe bana deti hai, jo yahan ekmaatra zaroori property hai.", "Asynchronous charging ka matlab hai rider ki trip tab khatam hoti hai jab trip khatam hoti hai."],
        cons: ["Failures ek business process hain, exception nahi: cards decline hote hain, aur uske liye retry schedule aur ek human path chahiye.", "Ab aap revenue ke liye kisi aur ki availability par depend karte ho."],
        cost: "Roz 25 million charges, jinme se har ek retry ho sakta hai aur duplicate nahi hona chahiye.",
        fails: "Call time out hota hai. Worker wahi idempotency key ke saath retry karta hai. Provider ya to charge ek baar karta hai ya jo pehle kar chuka use report karta hai. Key hi unknown outcome ko survivable banati hai.",
        say: "Idempotency key trip id ke barabar, outbox se backoff ke saath retried, aur ledger entry confirmation par likhi jaaye, attempt par nahi. Idempotency key kabhi timestamp ya retry count se mat banao." },
  
      { job: "Ride se pehle fare quote karo, aur uske baad final compute karo.",
        why: "Yeh alag isliye hai ki quote fast chahiye aur final fare sahi, aur pricing rules matching logic se kahin zyada badalte hain.",
        forced: "Stage 5, surge ke saath.",
        alts: [["Pricing inside the matching service", "ek service kam, aur ab har pricing experiment us component ko redeploy karta hai jo drivers assign karta hai."]],
        pros: ["Independently deploy hota hai, jo matter karta hai kyunki pricing har hafte badalti hai aur matching nahi.", "Quote ko ek chhote window ke liye cell ke hisaab se cache kiya ja sakta hai, kyunki saath khade do riders ke beech woh mushkil se badalta hai."],
        cons: ["Trip se pehle diya gaya quote aur baad mein charge kiya gaya fare mel khane chahiye, warna complaints aate hain. Quote ko maan lo jab tak route materially na badle, aur quote ko trip ke saath store karo."],
        cost: "Har request par ek quote aur har trip par ek fare. Chhota.",
        fails: "Request ke waqt yeh unavailable hai. Ride se mana karne ki jagah cached ya base fare par fall back karo, kyunki thoda galat price bilkul service na hone se behtar hai.",
        say: "Quote dete hi use trip par store karo. End mein price zero se dobara compute karna hi tareeka hai kisi ko wada kiye se zyada charge karne ka." },
  
      { job: "Har cell mein, har minute, open requests ko available drivers ke saamne dekho aur ek multiplier publish karo.",
        why: "Spatial skew supply problem hai, search problem nahi. Kitni bhi indexing us driver ko paida nahi karti jo hai hi nahi, aur price hi ekmaatra lever hai jo ek ko cell mein kheench laata hai.",
        forced: "Stage 5.",
        alts: [["A fixed price everywhere", "sunne mein fair, aur iska matlab surge mein sab wait karte hain aur koi wait na karne ke liye pay karna choose nahi kar sakta, aur drivers ke paas demand ki taraf jaane ki koi wajah nahi."], ["Queueing riders instead of pricing", "kuch markets mein aur regulation se use hota hai, aur yeh kami ko fix nahi karta, ration karta hai."]],
        pros: ["Stream mein pehle se maujood data par chhoti windowed aggregation.", "Yeh ek feedback loop hai: multiplier driver behaviour badalta hai, jo ratio badalta hai, jo multiplier badalta hai."],
        cons: ["Feedback loops oscillate karte hain. Damp karo, cap karo, aur multiplier ko kabhi drivers se tez mat badalne do.", "Yeh product ka sabse public roop se napasand kiya jaane wala component hai, aur ise explainable hona chahiye."],
        cost: "Har cell, har minute ek windowed count. Jitni behes yeh karwata hai uske hisaab se bahut sasta.",
        fails: "Yeh oscillate karta hai: ooncha multiplier drivers ko kheenchta hai, multiplier gir jaata hai, woh chale jaate hain, phir spike. Kuch minutes par smooth karo aur change ki rate cap karo.",
        say: "Har cell, har minute, smoothed aur capped. Yeh ek control loop hai, to main ise kisi bhi control loop jitni care se design karunga: pehle damping, phir setpoint." }
    ],
  
    flowsIntro: "Teen paths, aur dhyan do ki inka daam kitna alag hai. Ping path bahut bada aur sasta hai, match path chhota aur careful, aur money path chhota aur paranoid.",
  
    flows: [
      { n: "A location ping",
        note: "Ek second mein do sau pachaas hazaar aise, aur har ek ko fail hone ki ijazat hai.",
        steps: [
          ["Driver app apne open connection par position bhejta hai, agar aakhri kuch hain to unke saath batched.", "async"],
          ["Gateway cell id compute karta hai aur driver ko live index mein us cell mein fresh TTL ke saath likhta hai.", "async"],
          ["Das mein ek ping stream mein bhi jaata hai, trip active ho to zyada rate par, trail aur analytics ke liye.", "async"],
          ["Kuch durable nahi likha jaata. Agar poora path is ping ko drop kar de, to agla chaar second mein aa jaata hai.", "async"]
        ] },
      { n: "Requesting and matching a ride",
        steps: [
          ["Rider pickup point se ride request karta hai. Matching service pricing se quote maangti hai aur use request ke saath store karti hai.", "sync"],
          ["Woh pickup cell compute karti hai, use aur uske neighbours ko live index se padhti hai, aur kuch sau candidates paati hai.", "sync"],
          ["Woh available drivers tak filter karti hai aur estimated arrival time se rank karti hai, straight line distance se nahi, kyunki nadi chhota detour nahi hoti.", "sync"],
          ["Woh best candidate ko driver gateway se offer karti hai, pandrah second ki deadline ke saath. Rider ko searching dikhta hai.", "sync"],
          ["Driver accept karta hai. Service ek transaction karti hai: trip ka driver set karo jahan woh null hai, aur driver ki trip set karo jahan woh null hai. Exactly ek acceptance jeet sakta hai.", "sync"],
          ["Agar koi accept nahi karta, agle candidate par jao. Agar cell mein supply khatam hai, to yahi woh loop hai jise todne ke liye surge hai.", "sync"]
        ] },
      { n: "Ending the trip and charging for it",
        steps: [
          ["Driver trip khatam karta hai. Final fare actual route se compute hota hai, stored quote se compare hota hai, aur trip row completed mein jaati hai.", "sync"],
          ["Usi transaction mein, trip id ke barabar idempotency key ke saath ek charge intent outbox mein likha jaata hai.", "sync"],
          ["Ek worker outbox padhta hai aur payment provider ko call karta hai. Timeout ka matlab hai wahi key ke saath retry, hamesha, backoff ke saath.", "async"],
          ["Confirmation par ledger entry likhi jaati hai aur driver ki earnings credit hoti hain. Decline par trip payment failed state mein jaati hai, jo ek business process hai, error nahi.", "async"],
          ["Receipts, ratings aur trip trail sab usi completion event se chalte hain aur inme se koi use delay nahi kar sakta.", "async"]
        ] }
    ],
  
    tradeoffsIntro: "Yahan ke pehle do hi design hain. Agar interview mein sirf ek point argue kar sako, to pehla karo.",
  
    tradeoffs: [
      { a: ["Locations in memory, expiring", "Ek second mein 250k writes ka cost lagbhag kuch nahi. Poora kho dene ka cost tees second ki degraded matching."],
        b: ["Locations in the transactional database", "Ek system, ek query, poori durability, aur ek second mein 250,000 durable writes us machine par jisme aapka paisa hai."],
        flip: "aapko kanooni roop se har position retain karni ho, jis case mein bhi live index memory mein rehta hai aur ek copy stream se persist hoti hai. Tab bhi jawab dono hai, ek nahi." },
      { a: ["Offer to one driver at a time", "Driver ki choice meaningful hai, aur bekaar interruptions nahi. Har rejection par kuch second ka cost."],
        b: ["Broadcast to all nearby drivers, first to accept wins", "Sabse tez possible match, aur ek ride ke liye das drivers ko interrupt karta hai aur sabko reflexively accept dabana sikhata hai."],
        flip: "supply bahut kam hai aur cell kaafi der se search kar raha hai. Tab chhote set ko broadcast karna baarish mein khade rider se behtar hai, aur woh default nahi, soch samajh kar escalation hai." },
      { a: ["Charge asynchronously from an outbox", "Trip tab khatam hoti hai jab trip khatam hoti hai. Retries safe hain kyunki idempotency key trip id hai."],
        b: ["Charge synchronously at trip end", "Rider ko turant pata chalta hai ki payment hua ya nahi, aur woh third party ka wait karta hai, aur timeout ke baad koi safe move nahi bachti."],
        flip: "market ko payment in person confirm karna zaroori ho, jaise cash ya terminal flow. Tab woh kanoon se synchronous hai aur design ko unknown outcome interface mein carry karna padta hai." },
      { a: ["Shard by city", "Local failures, natural load spread, aur ek boundary jo business pehle se use karta hai."],
        b: ["Shard by trip id, uniformly", "Bilkul barabar load, aur har city ka traffic har shard par faila hota hai, to ek shard outage har city ko ek saath degrade karta hai."],
        flip: "ek city itni badi hai ki ek shard se zyada ho jaati hai, jo hota hai. Tab us city ko cell prefix se keyed kai shards milte hain, aur principle wahi rehta hai: key geography ko follow karti hai." }
    ],
  
    next: [
      "<b>Pooled rides.</b> Isse matching assignment problem se routing problem ban jaati hai, aur yeh sach mein alag algorithm hai, is wale ka extension nahi.",
      "<b>Driver positioning.</b> Har cell mein demand predict karna aur surge se pehle drivers ko us taraf nudge karna, jo baad mein pricing se zyada kimti hai.",
      "<b>Offline and degraded modes.</b> Tunnel mein driver, trip ke end par bina signal ka rider. Connectivity wapas aane par dono complete hone chahiye.",
      "<b>Fraud.</b> Spoofed locations, driver aur rider ke beech collusion, aur cancelled trips jo complete hui thi. Sab kuch sampled trail se juda hai, live index se nahi."
    ]
  }
},

/* ==========================================================================
   5. TICKET BOOKING
   ========================================================================== */
{
  id: "bookmyshow", kind: "hld", n: "Ticket booking", sub: "BookMyShow, Ticketmaster",
  tags: ["strong consistency", "inventory", "traffic spikes", "payments"],
  one: "Everything about this system is easy except the last seat. The design is a read path that is allowed to be a stale cache and a write path that has to be a serialised transaction, and the entire skill is keeping the second one as small and as short as possible.",

  brief: {
    why: "This is the counterweight to every other design on this page. There, eventual consistency was a tool you reached for; here, selling one seat twice is the failure, and no amount of clever caching makes it acceptable. The interesting part is that 99% of the traffic still wants a cache, so the design has to hold two opposite disciplines at once and be very clear about where the line between them is.",
    functional: [
      "<b>Browse.</b> Find a film, a cinema, a date, a show, and see which seats are free. This is almost all the traffic.",
      "<b>Hold.</b> Pick seats and get a few minutes to pay, during which nobody else can take them.",
      "<b>Book.</b> Pay, and receive a confirmed ticket. Exactly one person gets any given seat.",
      "<b>Cancel.</b> Release a seat back to the pool, which is the same inventory problem running backwards."
    ],
    out: ["recommendations", "reviews and ratings", "loyalty and coupons beyond a price hook", "the cinema's own screen management", "food ordering"],
    nfr: [
      ["No double booking", "absolute", "Two people in one seat is not an incident, it is a refund, an apology and a story. This is the requirement that everything else bends around."],
      ["Browse latency", "p99 under 200 ms", "Ninety nine percent of requests, and during a popular on-sale it is more like a thousand to one, because everybody refreshes."],
      ["Booking latency", "under 2 seconds excluding payment", "Slower than browse by design. The write path is allowed to be expensive because it is rare and it must be correct."],
      ["Hold duration", "about 8 minutes", "Long enough to enter card details, short enough that a hoarder cannot lock a hall. This is a product number with direct inventory consequences."],
      ["Payment", "charged once, or not at all", "An idempotency key and a state machine. A double charge on a ticket is worse than a failed booking."]
    ],
    numbers: [
      ["Registered users", "100M", "Only relevant as the size of the crowd that can arrive at once."],
      ["Normal browse", "about 50k per second", "A steady day across a country's cinemas. Comfortable."],
      ["On-sale spike", "about 500k users in the first minute", "A blockbuster's first day, or a stadium tour. This is the number that breaks naive designs, and it arrives on a schedule you know in advance."],
      ["Contention", "about 16 to 1", "500,000 people for roughly 30,000 seats in the popular shows. Most requests are going to fail, and the design's job is to make them fail quickly and cheaply."],
      ["Booking attempts", "about 8k per second at peak", "And they all land on a few thousand rows. The load is not large, it is concentrated, which is a completely different problem."],
      ["Seat inventory", "about 200M rows", "A million shows at a couple of hundred seats. Small. Everything hard here is about contention rather than volume."],
      ["Browse to book ratio", "100 to 1 normally, 1000 to 1 in a spike", "During a drop everybody refreshes the seat map and almost nobody completes. Serve that from a cache or it will take the database down before anyone buys anything."]
    ],
    numbersNote: "Two numbers shape everything. <b>16 to 1</b> means most users will lose, so losing has to be cheap. <b>200M rows</b> means this is not a volume problem at all: it is a few thousand extremely hot rows, and every technique here is about reducing how long anybody holds one."
  },

  stagesIntro: "Six stages. The first two exist purely to make the double booking impossible, and they are the ones an interviewer is listening for. The rest is about surviving the fact that half a million people arrive in the same minute, all wanting the same forty seats.",

  stages: [
    { t: "0. Check, then book, and the bug that lives in the gap",
      pressure: "Nothing yet. Draw the version everybody writes, because the bug it contains is the entire subject of this problem and it is much easier to see in two lines of pseudocode than in a paragraph.",
      nodes: [
        { id: "client", l: "Browser", s: "pick seats, book", col: 0, row: 0, r: "client" },
        { id: "booksvc", l: "Booking service", s: "check, then insert", col: 1, row: 0, r: "svc" },
        { id: "inventory", l: "Seat inventory", s: "one row per seat", col: 2, row: 1, r: "store" }
      ],
      edges: [{ a: "client", b: "booksvc", l: "book" }, { a: "booksvc", b: "inventory", l: "read/write", bend: 0.85 }],
      add: ["client", "booksvc", "inventory"],
      say: "Read the seat, see that it is free, insert the booking. It works perfectly in testing and in production on a Tuesday afternoon. Two users hitting it in the same millisecond both read free, both insert, and the cinema has sold seat J12 twice. This is check-then-act, and no amount of retry logic or optimism fixes it, because the gap between the read and the write is where the bug lives.",
      breaks: "Anything above one user at a time. And note what does <i>not</i> fix it: a faster database, a bigger machine, or checking twice." },

    { t: "1. Let the database be the referee, and add a hold",
      pressure: "Correctness first, and then a product requirement that makes it harder: the user needs a few minutes to pay, and during those minutes the seat must be neither free nor sold.",
      nodes: [
        { id: "client", l: "Browser", col: 0, row: 0, r: "client" },
        { id: "booksvc", l: "Booking service", s: "one conditional write", col: 1, row: 0, r: "svc" },
        { id: "inventory", l: "Seat inventory", s: "unique on (show, seat)", col: 2, row: 0, r: "store" },
        { id: "holds", l: "Seat holds", s: "8 minute TTL", col: 2, row: 1, r: "cache" }
      ],
      edges: [
        { a: "client", b: "booksvc", l: "hold" },
        { a: "booksvc", b: "inventory", l: "claim" },
        { a: "booksvc", b: "holds", l: "acquire", bend: 0.78 }
      ],
      add: ["holds"],
      say: "Two changes. First, the booking becomes one statement with a condition, an update where the seat is still free, or an insert against a unique constraint on show and seat. Exactly one of two concurrent writers affects a row and the other gets a clean rejection, with no application level locking anywhere. Second, a hold: a short lived claim with an expiry, so the seat is reserved while the user pays and returns to the pool by itself if they wander off. The expiry is the important part, because it means nothing has to clean up after a browser that closed.",
      breaks: "Correct, and now every one of the 50,000 browse requests per second is also hitting the database that holds this inventory, and during an on-sale that becomes half a million people refreshing a seat map." },

    { t: "2. Split browsing from buying",
      pressure: "The two workloads want opposite things. Browsing is enormous, repetitive, and perfectly happy with data that is a few seconds old. Buying is rare, contended, and cannot tolerate a stale read. Sharing a service and a database between them means the strict one sets the rules for both.",
      nodes: [
        { id: "client", l: "Browser", col: 0, row: 0, r: "client" },
        { id: "cdn", l: "CDN", s: "posters, listings", col: 1, row: 0, r: "edge" },
        { id: "booksvc", l: "Booking service", s: "writes only", col: 1, row: 1, r: "svc" },
        { id: "browsesvc", l: "Browse service", s: "reads only, cached", col: 2, row: 0, r: "svc" },
        { id: "inventory", l: "Seat inventory", s: "the source of truth", col: 2, row: 1, r: "store" },
        { id: "holds", l: "Seat holds", s: "8 minute TTL", col: 2, row: 2, r: "cache" },
        { id: "catcache", l: "Catalogue cache", s: "seat maps, 2s TTL", col: 3, row: 0, r: "cache" }
      ],
      edges: [
        { a: "client", b: "cdn", l: "browse" },
        { a: "cdn", b: "browsesvc", l: "on miss" },
        { a: "browsesvc", b: "catcache", l: "seat map" },
        { a: "catcache", b: "inventory", l: "warms from" },
        { a: "client", b: "booksvc", l: "book" },
        { a: "booksvc", b: "inventory", l: "claim" },
        { a: "booksvc", b: "holds", l: "acquire", bend: 0.78 }
      ],
      add: ["cdn", "browsesvc", "catcache"],
      say: "Two services, two disciplines. Browse reads a cached seat map with a two second TTL and says so in the interface, because a seat map is a hint and not a promise. Buying goes to the source of truth and takes the conditional write. The line between them is the sentence I would want an interviewer to hear: <i>the cache tells you what is probably free, the database decides what is actually yours.</i> A user seeing a green seat that turns out to be taken is a normal, expected, well handled outcome.",
      breaks: "The user now holds a seat and goes off to pay, and payment involves a third party that can be slow, can fail, and can time out without telling you what happened. Meanwhile the hold is ticking." },

    { t: "3. Payment, and the awkward gap it opens",
      pressure: "An external dependency inside a time limited claim. The genuinely nasty case is not failure, it is a payment that succeeds after the hold has already expired and the seat has been resold.",
      nodes: [
        { id: "client", l: "Browser", col: 0, row: 0, r: "client" },
        { id: "cdn", l: "CDN", col: 1, row: 0, r: "edge" },
        { id: "booksvc", l: "Booking service", s: "state machine", col: 1, row: 1, r: "svc" },
        { id: "browsesvc", l: "Browse service", col: 2, row: 0, r: "svc" },
        { id: "inventory", l: "Seat inventory", s: "plus an outbox", col: 2, row: 1, r: "store" },
        { id: "holds", l: "Seat holds", s: "8 minute TTL", col: 2, row: 2, r: "cache" },
        { id: "payments", l: "Payment gateway", s: "external, idempotent", col: 2, row: 3, r: "ext" },
        { id: "catcache", l: "Catalogue cache", col: 3, row: 0, r: "cache" },
        { id: "worker", l: "Booking worker", s: "reconciles, expires", col: 3, row: 2, r: "work" }
      ],
      edges: [
        { a: "client", b: "cdn", l: "browse" },
        { a: "cdn", b: "browsesvc" },
        { a: "browsesvc", b: "catcache", l: "seat map" },
        { a: "catcache", b: "inventory", l: "warms from" },
        { a: "client", b: "booksvc", l: "book" },
        { a: "booksvc", b: "inventory", l: "claim" },
        { a: "booksvc", b: "holds", l: "acquire", bend: 0.78 },
        { a: "booksvc", b: "payments", l: "charge", bend: 0.7 },
        { a: "inventory", b: "worker", l: "outbox", bend: 0.72, async: true },
        { a: "payments", b: "worker", l: "webhook", bend: 0.32, async: true }
      ],
      add: ["payments", "worker"],
      say: "A booking becomes a state machine: held, pending payment, confirmed, or released, with the seat only truly sold on confirmation. The charge carries an idempotency key equal to the booking id, so a retry after a timeout can never become a second charge. And the hold is extended, not started, when payment begins, because a card form is where users are slowest. If the payment confirms after the hold has gone and the seat has been resold, the answer is an automatic refund and an apology, decided by the worker. That case is rare, and having an answer for it out loud is worth more than pretending it cannot happen.",
      breaks: "Everything is correct, and then a blockbuster goes on sale and half a million people arrive in the same sixty seconds, all pressing the same button on the same forty rows of seats." },

    { t: "4. The on-sale, which is a scheduled denial of service",
      pressure: "Five hundred thousand users, thirty thousand seats. Most of them will not get a ticket, and if all of them are allowed to find that out by contending on the same database rows, nobody gets one.",
      nodes: [
        { id: "client", l: "Browser", col: 0, row: 0, r: "client" },
        { id: "waitroom", l: "Waiting room", s: "queue, position, token", col: 0, row: 1, r: "edge" },
        { id: "cdn", l: "CDN", col: 1, row: 0, r: "edge" },
        { id: "booksvc", l: "Booking service", s: "admits token holders", col: 1, row: 1, r: "svc" },
        { id: "browsesvc", l: "Browse service", col: 2, row: 0, r: "svc" },
        { id: "inventory", l: "Seat inventory", s: "sharded by show", col: 2, row: 1, r: "store" },
        { id: "holds", l: "Seat holds", col: 2, row: 2, r: "cache" },
        { id: "payments", l: "Payment gateway", col: 2, row: 3, r: "ext" },
        { id: "catcache", l: "Catalogue cache", s: "pre-warmed", col: 3, row: 0, r: "cache" },
        { id: "worker", l: "Booking worker", col: 3, row: 2, r: "work" }
      ],
      edges: [
        { a: "client", b: "cdn", l: "browse" },
        { a: "cdn", b: "browsesvc" },
        { a: "browsesvc", b: "catcache", l: "seat map" },
        { a: "catcache", b: "inventory", l: "warms from" },
        { a: "client", b: "waitroom", l: "join" },
        { a: "waitroom", b: "booksvc", l: "admit" },
        { a: "booksvc", b: "inventory", l: "claim" },
        { a: "booksvc", b: "holds", l: "acquire", bend: 0.78 },
        { a: "booksvc", b: "payments", l: "charge", bend: 0.7 },
        { a: "inventory", b: "worker", l: "outbox", bend: 0.72, async: true },
        { a: "payments", b: "worker", l: "webhook", bend: 0.32, async: true }
      ],
      add: ["waitroom"],
      say: "A waiting room in front of the write path. Everybody who arrives gets a position and a live estimate, and the booking service only accepts requests carrying an admission token, issued at a rate the inventory can actually absorb, perhaps a few thousand a second. This does three things at once: it converts a thundering herd into a paced stream, it makes losing feel like a queue rather than an error, and it means the expensive path is never oversubscribed. The seat map is pre-warmed into the cache before the sale opens, because the worst possible moment for a cold cache is the first second of a drop.",
      breaks: "Tickets are sold, and nobody has them yet. Confirmation emails, QR codes, the cinema's own system and the analytics all want to know, and none of them should be able to slow down or fail a sale." },

    { t: "5. Everything that happens after the money",
      pressure: "A confirmed booking has a long tail of consequences, all of which are important to somebody and none of which are allowed on the critical path of a sale.",
      nodes: [
        { id: "client", l: "Browser", col: 0, row: 0, r: "client" },
        { id: "waitroom", l: "Waiting room", col: 0, row: 1, r: "edge" },
        { id: "cdn", l: "CDN", col: 1, row: 0, r: "edge" },
        { id: "booksvc", l: "Booking service", s: "sells, then publishes", col: 1, row: 1, r: "svc" },
        { id: "browsesvc", l: "Browse service", col: 2, row: 0, r: "svc" },
        { id: "inventory", l: "Seat inventory", s: "plus an outbox", col: 2, row: 1, r: "store" },
        { id: "holds", l: "Seat holds", col: 2, row: 2, r: "cache" },
        { id: "payments", l: "Payment gateway", col: 2, row: 3, r: "ext" },
        { id: "catcache", l: "Catalogue cache", col: 3, row: 0, r: "cache" },
        { id: "worker", l: "Booking worker", s: "one event, many jobs", col: 3, row: 2, r: "work" },
        { id: "notify", l: "Fulfilment", s: "tickets, mail, partners", col: 3, row: 3, r: "work" }
      ],
      edges: [
        { a: "client", b: "cdn", l: "browse" },
        { a: "cdn", b: "browsesvc" },
        { a: "browsesvc", b: "catcache", l: "seat map" },
        { a: "catcache", b: "inventory", l: "warms from" },
        { a: "client", b: "waitroom", l: "join" },
        { a: "waitroom", b: "booksvc", l: "admit" },
        { a: "booksvc", b: "inventory", l: "claim" },
        { a: "booksvc", b: "holds", l: "acquire", bend: 0.78 },
        { a: "booksvc", b: "payments", l: "charge", bend: 0.7 },
        { a: "inventory", b: "worker", l: "outbox", bend: 0.72, async: true },
        { a: "payments", b: "worker", l: "webhook", bend: 0.32, async: true },
        { a: "worker", b: "notify", l: "fan out", async: true }
      ],
      add: ["notify"],
      say: "The confirmation and the outbox row are written in one transaction, and a worker publishes from the outbox. Everything downstream, the QR code, the email, the push notification, the cinema's own system, the analytics, is a consumer of that one event. If the email provider is down, tickets are still sold. That is the whole reason for the outbox: without it, either the sale can be lost after the charge, or the email can silently never happen, and both of those are worse than being a minute late." }
  ],

  boxesIntro: "Eleven components. Notice how few of them touch the truth: only the booking service and the inventory store are allowed to decide anything. Everything else is a cache, a queue, a pacer or a consequence.",

  boxes: [
    { id: "client", n: "Browser or app", r: "client",
      job: "Shows a seat map, sends a hold request, then a payment, and copes gracefully with losing.",
      why: "It is drawn because the design deliberately hands it a job: displaying possibly stale data honestly, and handling a rejection as a normal outcome rather than as an error.",
      forced: "Stage 2, when the seat map became a cached hint.",
      alts: [["Making the seat map strictly live over a socket", "genuinely nicer, and during an on-sale it means pushing updates to half a million people about seats they will not get."]],
      pros: ["A short cache TTL plus an honest interface is far cheaper than live updates and almost as good.", "Losing a seat can be handled well: reselect nearby, keep the user in the flow."],
      cons: ["The user sometimes selects a seat that is already gone, and no amount of engineering removes that entirely.", "Client side timers for the hold countdown will drift from the server's, so the server's expiry is the only one that counts."],
      cost: "Nothing, and it removes the need for a live inventory feed.",
      fails: "The user's countdown says two minutes left and the server has already expired the hold. Always re-check on submit, and always trust the server's clock.",
      say: "The seat map is a hint. The interface should say so, the client should re-check on submit, and losing a seat should put the user back into selection rather than into an error page." },

    { id: "cdn", n: "CDN", r: "edge",
      job: "Serve posters, listings and the mostly static parts of a show page.",
      why: "During an on-sale the page itself is requested half a million times and its content barely changes. Serving that from your own servers is spending capacity on decoration.",
      forced: "Stage 2, and it earns its place mainly in stage 4.",
      alts: [["Serving everything from the application", "fine on a Tuesday and hopeless in the first minute of a drop."]],
      pros: ["Absorbs the part of the spike that is not actually about seats.", "It is the natural place to put a static waiting room page that does not touch your infrastructure at all."],
      cons: ["Anything cached at the edge is stale by definition, so the seat map must never be one of those things.", "Cache invalidation on a show going on sale needs to be scheduled, not hoped for."],
      cost: "Cheap and it removes the largest share of spike requests.",
      fails: "A seat map is accidentally cached at the edge with a long TTL, and thousands of people see a map from ten minutes ago. Keep dynamic inventory out of the CDN entirely and be explicit about the boundary.",
      say: "Everything except the seat map. The moment inventory is at the edge you have made a promise you cannot keep." },

    { id: "browsesvc", n: "Browse service", r: "svc",
      job: "Answer read only questions: what is on, where, when, and roughly which seats are free.",
      why: "It is 99% of the traffic and it has completely different rules from booking. Separating them means the read path can scale by adding boxes and can never affect inventory correctness.",
      forced: "Stage 2.",
      alts: [["One service for both", "fewer moving parts, and a spike in browsing then starves the booking path of connections and threads at the exact moment booking matters most."], ["Read replicas of the inventory database", "still a database round trip per request, and replica lag makes the seat map stale anyway, so you may as well have a cache and control the staleness."]],
      pros: ["Stateless and trivially scalable.", "It can be aggressively cached because it never decides anything.", "If it fails entirely, existing bookings and payments continue."],
      cons: ["It serves data it knows may be stale, which has to be communicated in the product rather than hidden."],
      cost: "50,000 requests per second normally, far more in a spike, almost all served from cache.",
      fails: "Its cache is cold when a sale opens and every request falls through to the inventory database, which is sized for writes. Pre-warm before a scheduled on-sale, which you can do because the schedule is known.",
      say: "It reads, it never writes, and it never decides. That constraint is what allows every optimisation in this half of the diagram." },

    { id: "catcache", n: "Catalogue and seat map cache", r: "cache",
      job: "Hold rendered seat maps and show listings for a couple of seconds at a time.",
      why: "During a drop, the same seat map is requested tens of thousands of times a second and changes constantly. A two second TTL turns that into a handful of database reads a second while remaining honest.",
      forced: "Stage 2.",
      alts: [["No cache, read the database every time", "correct to the millisecond and it puts the entire browse load onto the machine doing the booking transactions."], ["Long TTL with event driven invalidation", "fresher on average, and during a drop the invalidation rate equals the booking rate and you are effectively uncached, with extra machinery."], ["Pushing seat map deltas to connected clients", "the best user experience and a large amount of work, justified only for a product whose whole business is on-sales."]],
      pros: ["A fixed short TTL gives a predictable, bounded database load no matter how large the crowd is.", "Staleness is bounded and can be stated in the interface.", "Warming it before a scheduled sale is easy and removes the worst failure mode."],
      cons: ["Users will sometimes pick a seat that is gone. This is designed for, not prevented.", "Per show keys mean the hot show is a hot key, which needs local caching in the browse service in front of it."],
      cost: "Small: one map per show, replaced every couple of seconds for the shows anybody is looking at.",
      fails: "One show is so hot that a single cache key saturates a node. Add a short lived in process cache in the browse service, so a thousand requests per second per box become one cache read.",
      say: "Two second TTL rather than event invalidation. During the only moment that matters, invalidation and booking happen at the same rate, so a fixed TTL is both simpler and more predictable." },

    { id: "waitroom", n: "Waiting room", r: "edge",
      job: "Hold the crowd, hand out positions, and admit people to the booking path at a rate it can survive.",
      why: "Five hundred thousand people cannot all contend for thirty thousand rows. Something has to convert a herd into a stream, and doing it before any expensive work is far cheaper than doing it after.",
      forced: "Stage 4. It exists for one scheduled event and it is the difference between a sale and an outage.",
      alts: [["Plain rate limiting with 429s", "protects the backend and gives the user a random lottery with no information, which they will respond to by refreshing, making it worse."], ["First come first served with no queue", "the fastest network wins, which is a bot, and the design has made scalping a technical advantage."], ["Letting everyone in and letting the database sort it out", "the default, and it means the first minute of a sale is an outage rather than a sale."]],
      pros: ["Turns a spike into a rate you chose, in front of everything expensive.", "A position and an estimate is a far better experience than an error, even when the outcome is the same.", "It is the single best place to make bot mitigation effective, because it is upstream of everything."],
      cons: ["Another system, only used occasionally, which means it is the system most likely to be broken when you need it.", "Queue fairness is a product decision with real consequences, and people care about it deeply."],
      cost: "It only has to hold a token and a position per waiting user, which is small. Its difficulty is operational, not computational.",
      fails: "It becomes the bottleneck itself. Keep it dumb: a signed token with an admission time, verified statelessly, so admission needs no shared state at request time.",
      say: "Signed admission tokens with a timestamp, issued at a rate matched to what inventory can absorb. The booking service rejects anything without one, and the queue itself holds nothing more than a counter." },

    { id: "booksvc", n: "Booking service", r: "svc",
      job: "The only component allowed to change inventory. Acquire a hold, take payment, confirm or release.",
      why: "Correctness is easiest to guarantee when exactly one piece of code can write. Everything else in the design is arranged so that this service does as little work as possible for as short a time as possible.",
      forced: "Stage 0, and it was narrowed at every stage after that.",
      alts: [["Letting several services write inventory", "faster to build and it multiplies the number of places a double booking can be introduced by every future team."], ["A dedicated inventory service that only this one calls", "an extra hop, and genuinely right in a larger organisation where many products sell the same seats."]],
      pros: ["One writer means one place to audit, one place to test, one place to get right.", "It is small enough that its transaction can be short, which is what keeps hot rows moving.", "Admission tokens mean it is never oversubscribed."],
      cons: ["It is a single logical writer, so it needs to be horizontally scalable without ever violating the single writer property, which the database constraint provides.", "It is on the path of the only requests that make money."],
      cost: "8,000 attempts per second at peak. Small in volume, concentrated in contention.",
      fails: "It holds a database transaction open across the payment call. Never do this: the transaction commits the hold, payment happens outside it, and confirmation is a second short transaction. A transaction that waits on a third party is how one slow payment locks a hall.",
      say: "The transaction never spans a network call to anyone else. Hold, commit, pay, commit. Two short transactions and a slow third party in between them, rather than one long transaction wrapped around a stranger." },

    { id: "inventory", n: "Seat inventory", r: "store",
      job: "The truth. One row per seat per show, and a constraint that makes selling it twice impossible.",
      why: "Somewhere in every design there is a component that arbitrates. Here it is a relational store, and the reason is the unique constraint rather than anything about tables.",
      forced: "Stage 0, and stage 1 gave it the constraint that makes it correct.",
      alts: [["A NoSQL store with conditional writes", "workable, since a conditional put on a single item is exactly the primitive you need, and it gets harder when a booking spans several seats and you want them all or none."], ["Holding inventory in Redis with atomic scripts", "very fast, atomic per key, and it is now the durable record of something you sold, which is a bad place for it to live."], ["An event sourced inventory", "a nice fit conceptually, and it makes the is this seat free question a fold rather than a lookup, which is the wrong shape for the hottest read in the system."]],
      pros: ["A unique constraint on (show, seat) makes double booking impossible rather than unlikely, which is a different category of guarantee.", "Multi seat bookings become one transaction, all or nothing, for free.", "It is small, about 200 million rows, so a single well provisioned cluster handles it."],
      cons: ["Hot rows during a drop: thousands of transactions per second on a few thousand rows, all serialised by the database.", "It is the component that cannot be made eventually consistent, so it sets the availability ceiling for buying."],
      cost: "200M rows, low volume, extreme concentration. Shard by show id so one popular show cannot slow another.",
      fails: "Lock contention on a popular row queues transactions, latency climbs, timeouts fire, and clients retry, making it worse. The fixes are all about duration: keep transactions short, admit at a controlled rate, and never wait on anything external while holding a row.",
      say: "Sharded by show id, unique on (show, seat), transactions measured in single digit milliseconds. Every design decision on this side of the diagram exists to shorten the time somebody holds a row." },

    { id: "holds", n: "Seat holds", r: "cache",
      job: "Record that a seat is claimed but not yet paid for, and forget it automatically after a few minutes.",
      why: "A user needs time to pay, and during that time the seat is in a third state that is neither free nor sold. Expiry has to be automatic, because the common ending is a user who simply closes the tab.",
      forced: "Stage 1.",
      alts: [["A status column on the seat row with an expires_at timestamp", "one system, fully transactional with the booking, and it needs a sweeper job to release expired holds, and until that job runs the seat looks taken."], ["A Redis key with a TTL", "expiry is free and exact, and the hold is now in a different system from the sale, so acquiring a hold and confirming a booking cannot be one transaction."]],
      pros: ["TTL expiry means no sweeper, no cleanup, no half released seats.", "Fast enough that acquiring a hold is not a bottleneck in a spike.", "The hold and the seat can be checked in one atomic script if they live in the same place."],
      cons: ["Two systems that must agree: a hold in Redis and a sale in the database. The reconciliation is the worker's job and it is real work.", "If Redis is lost, every in flight hold vanishes, and users mid payment lose their seat."],
      cost: "A key per in flight hold. Thousands, not millions. Tiny.",
      fails: "Redis fails over and holds disappear while users are on the payment page. Those payments will confirm against seats that now look free, and the confirmation write will succeed, which is the right outcome. The dangerous direction is the other one, where a hold survives but the sale does not, which the worker reconciles.",
      say: "I would put holds and inventory in the same store if I can, because then acquiring a hold and confirming a sale are one transaction. If they are separate, I need a reconciler, and I should say so rather than draw two boxes and hope." },

    { id: "payments", n: "Payment gateway", r: "ext",
      job: "Take money. External, slow, and capable of returning an unknown outcome.",
      why: "It is the only thing in the design you do not control, and it sits inside a time limited hold, which is what makes it interesting rather than routine.",
      forced: "Stage 3.",
      alts: [["Charging after confirming the seat", "the user gets a ticket and the card declines, so now you are chasing money or cancelling a ticket somebody has already screenshotted."], ["Pre-authorising and capturing on confirmation", "genuinely the best answer for this shape of problem: authorise before the seat is confirmed, capture after. Two phases, and it maps exactly onto hold and confirm."]],
      pros: ["Idempotency keys make retrying a timed out charge safe, which is the only property that makes any of this workable.", "Webhooks let a late confirmation still complete the booking without anyone polling."],
      cons: ["Latency is measured in seconds and is not under your control, which is why the hold has to outlive it.", "Webhooks arrive out of order, twice, or long after the fact, so the receiving state machine has to be idempotent as well."],
      cost: "8,000 attempts per second at peak, each of which may time out and be retried.",
      fails: "A payment confirms after the hold expired and the seat was resold. The worker detects a confirmed payment with no seat, refunds automatically, and notifies. Have this answer ready, because it is the first thing a good interviewer asks.",
      say: "Authorise while holding, capture on confirmation, idempotency key equal to the booking id, and a webhook handler that is safe to call twice. The refund path for a late success is a designed feature, not an incident." },

    { id: "worker", n: "Booking worker", r: "work",
      job: "Publish from the outbox, expire stale bookings, and reconcile the disagreements between payments and inventory.",
      why: "Every design that spans two systems needs something whose job is to notice when they disagree. Pretending they never will is the most common gap in an otherwise good answer.",
      forced: "Stage 3.",
      alts: [["Doing all of this inline in the booking service", "puts slow, retry heavy, third party dependent work inside the transaction path of the only endpoint that makes money."], ["Trusting webhooks alone", "webhooks are lost, delayed and duplicated. A periodic sweep of pending bookings is what turns a lost webhook from a stuck order into a delay."]],
      pros: ["It makes the outbox pattern work, so a sale and its consequences cannot be separated by a crash.", "It is the single place where the awkward cases live, which is much better than having them spread over five services.", "Retries and backoff belong here rather than in a request path."],
      cons: ["It is asynchronous, so there is always a window where two systems disagree and the worker has not looked yet.", "It is the least glamorous component and the one that will be under-tested."],
      cost: "Modest and bursty, following the sale curve.",
      fails: "It falls behind after a large sale, and confirmation emails are ten minutes late. Nothing is lost, because the outbox is durable, and that is the property being paid for.",
      say: "Outbox publisher, expiry sweeper and reconciler, in one component. If an interviewer asks what happens when payment succeeds and the seat is gone, this is the box I point at." },

    { id: "notify", n: "Fulfilment", r: "work",
      job: "Turn a confirmed booking into a ticket, an email, a QR code, a push notification and a message to the cinema.",
      why: "All of these matter to somebody and none of them should be able to fail a sale. They are consumers of an event rather than steps in a transaction.",
      forced: "Stage 5.",
      alts: [["Sending the email inline during confirmation", "the sale now depends on an email provider's availability, which is not a trade anybody would make deliberately."]],
      pros: ["One event, several independent consumers, each retrying on its own.", "A new consumer can be added later with no change to the booking path."],
      cons: ["The user sees a confirmation on screen before the email arrives, which needs to be said in the interface.", "At-least-once delivery means consumers must be idempotent or people get three copies of a ticket."],
      cost: "One event per booking, several consumers each.",
      fails: "The email provider is down for an hour. Tickets are still sold and still visible in the app, and the emails go out when it recovers. Making the app the source of truth for the ticket rather than the email is the design decision that makes this survivable.",
      say: "The ticket exists the moment the booking is confirmed. The email is a notification about a thing that already happened, not the thing itself." }
  ],

  flowsIntro: "Two paths and one repair path. The repair path is the one that separates a candidate who has run a payment system from one who has read about one.",

  flows: [
    { n: "Browsing a seat map during a busy sale",
      steps: [
        ["The page and the posters come from the CDN. None of that touches your services.", "sync"],
        ["The seat map request hits the browse service, which reads a per show key from the cache. Almost always a hit.", "sync"],
        ["On a miss, one process fills the key from inventory and everybody else waits on it, so a thousand concurrent misses become one query.", "sync"],
        ["The response says which seats were free two seconds ago, and the interface is honest that this is a hint.", "sync"]
      ] },
    { n: "Buying a seat",
      note: "Two short transactions with a slow stranger in between them. That shape is the answer to this problem.",
      steps: [
        ["During an on-sale the user joins the waiting room and receives a signed admission token when their turn arrives.", "sync"],
        ["They select seats and request a hold. The booking service performs one conditional write per seat, all in one transaction: claim where still free.", "sync"],
        ["If any seat fails the condition, the whole transaction rolls back and the user is told which seats went, with alternatives. This is the common case and it is fast.", "sync"],
        ["The transaction commits and a hold with an eight minute expiry exists. The database transaction is now over, before any third party is contacted.", "sync"],
        ["Payment is authorised with an idempotency key equal to the booking id. This takes seconds and holds no locks.", "sync"],
        ["On authorisation, a second short transaction confirms the seats, captures the payment, and writes an outbox row. The user has a ticket.", "sync"],
        ["The worker publishes the event and fulfilment fans out to tickets, email and the cinema's system.", "async"]
      ] },
    { n: "When it goes wrong, which it will",
      note: "Three cases, and each one has a single defined answer. Say these before you are asked.",
      steps: [
        ["<b>The user abandons.</b> The hold expires by itself, the seat returns to the pool, and nothing had to notice. This is the most common ending.", "async"],
        ["<b>The payment times out.</b> The worker retries with the same idempotency key. The provider either performs the charge once or reports the one it already made. The booking stays pending until an answer arrives.", "async"],
        ["<b>The payment succeeds after the hold expired and the seat was resold.</b> The worker sees a confirmed payment with no seat, refunds automatically, and notifies the user. Rare, unavoidable, and handled rather than hoped away.", "async"],
        ["<b>A webhook arrives twice.</b> The handler is keyed on the payment id and the second one is a no-op. Assume every webhook will arrive twice, because it will.", "async"]
      ] }
  ],

  api: [
    ["GET /v1/shows/{id}/seats", "seat map, as_of timestamp", "Returns the timestamp it is accurate as of. Naming the staleness in the response is what lets the client be honest about it."],
    ["POST /v1/holds", "201 {hold_id, expires_at} or 409", "The conditional write. A 409 lists which seats were taken, so the client can offer alternatives instead of an error."],
    ["POST /v1/bookings/{hold}/pay", "202 {booking_id}", "Accepted. Payment is asynchronous from here; the client polls or listens. Idempotency key required in the header."],
    ["POST /v1/webhooks/payment", "200", "Called by the provider, possibly twice, possibly late, possibly out of order. Keyed on payment id and safe to replay."],
    ["DELETE /v1/holds/{id}", "204", "Explicit release. Rare, since most holds end by expiring, and worth having so a user who changes their mind frees the seat immediately."]
  ],
  apiNote: "The details worth ten seconds each: the seat map returns <i>as of</i>, the 409 carries which seats went rather than a bare error, and the webhook is idempotent because it will be delivered more than once.",

  schema: { n: "The two writes that make it correct", lang: "text",
    note: "The whole design compresses into these statements. Everything else is about making sure not too many people run them at the same instant.",
    code:
"seats                                    the constraint IS the design\n" +
"  show_id, seat_no      PRIMARY KEY (show_id, seat_no)\n" +
"  status                free | held | sold\n" +
"  hold_id, hold_expiry\n" +
"  booking_id\n" +
"  shard key: show_id    one hot show cannot slow another\n" +
"\n" +
"THE HOLD  (one transaction, no external calls inside it)\n" +
"  UPDATE seats SET status='held', hold_id=:h,\n" +
"                   hold_expiry=now()+interval '8 minutes'\n" +
"   WHERE show_id=:s AND seat_no IN (:seats)\n" +
"     AND (status='free' OR hold_expiry < now())\n" +
"  if rowcount <> count(:seats): ROLLBACK, tell the user which went\n" +
"\n" +
"THE CONFIRM  (a second short transaction, after payment)\n" +
"  UPDATE seats SET status='sold', booking_id=:b\n" +
"   WHERE show_id=:s AND seat_no IN (:seats) AND hold_id=:h\n" +
"  INSERT INTO outbox (booking_id, event) VALUES (:b, 'confirmed')\n" +
"  COMMIT      the sale and its consequences, atomically\n" +
"\n" +
"note: hold_expiry < now() in the WHERE clause means an expired hold\n" +
"is reclaimed by whoever asks next. no sweeper needed for correctness." },

  deep: [
    { n: "Why check-then-act cannot be fixed by trying harder",
      note: "The bug in stage 0 is not a race you can shrink. Read the seat, see free, write the booking: between those two statements another transaction can do exactly the same thing. Making the gap smaller makes it rarer, which makes it a bug that appears only on your biggest day.<br><br>There are exactly three correct answers, and it is worth being able to name all three. <b>A constraint</b>, so the database rejects the second writer: a unique index, or a conditional update whose WHERE clause carries the precondition. <b>A lock</b>, so the second writer waits: SELECT FOR UPDATE, or a distributed lock, both of which work and cost you held locks and a liveness problem if the holder dies. <b>Optimistic concurrency</b>, a version column checked on write, which is really the first answer wearing different clothes.<br><br>The conditional update is best here because the condition and the write are one statement, so there is no gap at all, and because it needs nothing outside the database. If you can only remember one sentence from this page: <i>put the check inside the write.</i>" },

    { n: "The waiting room, and why rate limiting is not the same thing",
      note: "Both cap the load. The difference is what happens to the person who is capped. A rate limiter returns 429 and the user refreshes, so the request rate goes up rather than down, and whoever refreshes fastest wins, which is a bot. A waiting room gives a position, an estimate and a token, so refreshing gains nothing and the user waits calmly.<br><br>Mechanically it is small: on arrival, issue a signed token containing a serial number and an admit-after time, spaced to match the rate inventory can absorb. The booking service verifies the signature and the time and needs no shared state at all. The queue holds a counter, not a list of people.<br><br>The part worth saying out loud is that this is where bot mitigation actually belongs. Upstream of everything expensive, at a point where you can require a real session, and where the cost of being wrong is somebody waiting rather than somebody's transaction failing." },

    { n: "The seat map is a hint, and saying so is the design",
      note: "There is a real temptation to make the seat map live, so nobody ever picks a seat that is gone. It is achievable with a socket per viewer and a push per booking, and during the one minute when it would matter you would be pushing tens of thousands of updates per second to half a million viewers about seats they are not going to get.<br><br>The cheaper answer is to accept that the map is stale by up to a couple of seconds and to make the product honest about it: seats fade rather than vanish, the map says when it was accurate, and a failed selection puts the user straight back into choosing instead of onto an error page. The engineering saving is enormous and the experience is barely different, because with sixteen people per seat somebody was going to be disappointed regardless.<br><br>The general principle transfers: <b>when contention is high, a stale read plus a good rejection path beats a live read.</b>" },

    { n: "Multi seat bookings, which are where the real deadlocks are",
      note: "Nobody books one seat. A family books four together, which turns the problem from one conditional write into an all-or-nothing claim over several rows, and that is where deadlocks appear: two transactions each holding a row the other wants.<br><br>Two rules prevent it. <b>Always acquire in a deterministic order</b>, sorted by seat number, so two overlapping requests queue instead of deadlocking. <b>Claim all of them in one statement</b> and compare the affected row count to the number requested, so partial success is impossible without any explicit checking.<br><br>The follow up question is usually about adjacency: users want seats together, and greedy allocation fragments a hall into unusable single gaps. That is a bin packing problem rather than a concurrency one, and the honest answer is to reserve blocks of contiguous seats at the point of suggestion, not at the point of claim, so the expensive thinking happens outside the transaction." }
  ],

  tradeoffsIntro: "The first two here decide whether the system is correct. The last two decide whether it survives its own launch day.",

  tradeoffs: [
    { a: ["Conditional write with a constraint", "The check is inside the write, so there is no gap. Losers get a clean rejection and nothing is held."],
      b: ["Explicit locking, SELECT FOR UPDATE", "Intuitive and easy to reason about. Locks are held across your code, so a slow branch inside the transaction blocks everybody."],
      pick: "a",
      flip: "the decision genuinely needs several statements and a read in between, which happens with complex pricing or allocation rules. Then take the lock, keep the transaction tiny, and set a lock timeout." },
    { a: ["Two short transactions around payment", "The database is never waiting on a third party. Requires reconciling a payment that succeeds after a hold expires."],
      b: ["One transaction spanning the payment call", "No reconciliation needed, ever. One slow payment now holds seat rows for as long as the provider takes."],
      pick: "a",
      flip: "never, at this contention. The version of this trade-off worth having is authorise versus capture: authorise inside the hold, capture on confirm, which is the same shape done properly." },
    { a: ["Waiting room in front of the write path", "Load becomes a rate you chose. Losing feels like a queue rather than an error."],
      b: ["Let everyone through and rely on rejections", "No extra system to build. The first minute of a sale is a self inflicted denial of service."],
      pick: "a",
      flip: "there are no scheduled on-sales and traffic is smooth. Then a waiting room is a system you maintain for an event that never comes, and plain rate limiting is enough." },
    { a: ["Seat map cached with a fixed short TTL", "Predictable, bounded database load regardless of crowd size. Sometimes shows a seat that is gone."],
      b: ["Event driven invalidation, or live push", "Fresher, and during a drop the invalidation rate equals the booking rate, so you are uncached with extra machinery."],
      pick: "a",
      flip: "the venue is small and premium, where a hundred people are choosing from forty seats. Then live updates are cheap and the experience is worth it." }
  ],

  next: [
    "<b>Dynamic and tiered pricing.</b> The same inventory with a price that varies by row, time and demand. It touches the read path far more than the write path.",
    "<b>Cancellations and resale.</b> Returning a seat to the pool is the same conditional write in reverse, plus a refund state machine that is more delicate than the sale.",
    "<b>Bot and scalper defence.</b> The waiting room is the right place, and it needs device signals, payment velocity checks and per account limits behind it.",
    "<b>Multi region.</b> Inventory is regional by nature, since a cinema is in one place. Pin a show to the region of its venue and the hard problem mostly disappears."
  ],

  p: [
    ["GFG", "https://www.geeksforgeeks.org/system-design/design-bookmyshow-a-system-design-interview-question/", "GFG, design BookMyShow", "H"],
    ["HI", "https://www.hellointerview.com/learn/system-design/problem-breakdowns/ticketmaster", "Hello Interview, Ticketmaster", "H"],
    ["DG", "https://www.designgurus.io/course-play/grokking-the-system-design-interview/doc/designing-ticketmaster", "Design Gurus, Ticketmaster", "H"],
    ["GFG", "https://www.geeksforgeeks.org/system-design/what-is-two-phase-commit-in-distributed-systems/", "Two phase commit, and why it is avoided", "M"],
    ["GH", "https://github.com/donnemartin/system-design-primer", "System Design Primer", "M"]
  ],

  hi: {
    one: "Is system mein sab kuch aasaan hai, bas aakhri seat ko chhodkar. Design hai ek read path jo stale cache ho sakta hai, aur ek write path jo serialised transaction hona chahiye, aur poori skill hai doosre ko jitna ho sake chhota aur jitna ho sake short rakhna.",
  
    brief: {
      why: "Yeh is page ke baaki sab designs ka counterweight hai. Wahan eventual consistency ek tool thi jise aap uthate the; yahan ek seat do baar bech dena hi failure hai, aur koi clever caching ise acceptable nahi banati. Dilchasp baat yeh hai ki 99% traffic ko phir bhi cache chahiye, to design ko do ulti discipline ek saath nibhani hain aur bilkul saaf rehna hai ki dono ke beech line kahan hai.",
      functional: [
        "<b>Browse karo.</b> Film, cinema, date, show dhoondho, aur dekho kaun si seats free hain. Lagbhag saara traffic yahi hai.",
        "<b>Hold karo.</b> Seats chuno aur payment ke liye kuch minute pao, jinme koi aur unhe nahi le sakta.",
        "<b>Book karo.</b> Pay karo, aur confirmed ticket pao. Kisi bhi seat ke liye exactly ek insaan.",
        "<b>Cancel karo.</b> Seat ko wapas pool mein chhodo, jo wahi inventory problem hai bas ulti taraf chalti hui."
      ],
      out: ["recommendations", "reviews aur ratings", "loyalty aur coupons, price hook se aage", "cinema ka apna screen management", "food ordering"],
      nfr: [
        ["No double booking", "absolute", "Ek seat par do log incident nahi hai, refund hai, maafi hai aur ek kahani hai. Yahi woh requirement hai jiske around baaki sab jhukta hai."],
        ["Browse latency", "p99 under 200 ms", "Requests ka ninety nine percent, aur popular on-sale ke dauran yeh hazaar mein ek jaisa hota hai, kyunki sab refresh karte hain."],
        ["Booking latency", "under 2 seconds excluding payment", "Jaan-boojhkar browse se slow. Write path ko mehnga hone ki chhoot hai kyunki woh rare hai aur sahi hona zaroori hai."],
        ["Hold duration", "about 8 minutes", "Itna lamba ki card details bhar sako, itna chhota ki hoarder poora hall lock na kar sake. Yeh ek product number hai jiske seedhe inventory nateeje hain."],
        ["Payment", "charged once, or not at all", "Ek idempotency key aur ek state machine. Ticket par double charge failed booking se zyada bura hai."]
      ],
      numbers: [
        ["Registered users", "100M", "Sirf us bheed ke size ke roop mein relevant jo ek saath aa sakti hai."],
        ["Normal browse", "about 50k per second", "Ek desh ke cinemas mein ek aam din. Aaram se."],
        ["On-sale spike", "about 500k users in the first minute", "Blockbuster ka pehla din, ya stadium tour. Yahi woh number hai jo naive designs todta hai, aur yeh aisi schedule par aata hai jo aapko pehle se pata hoti hai."],
        ["Contention", "about 16 to 1", "Popular shows ki lagbhag 30,000 seats ke liye 500,000 log. Zyada tar requests fail hongi, aur design ka kaam hai unhe jaldi aur sasti fail karwana."],
        ["Booking attempts", "about 8k per second at peak", "Aur sab kuch hazaar rows par girti hain. Load bada nahi hai, concentrated hai, jo bilkul alag problem hai."],
        ["Seat inventory", "about 200M rows", "Ek million shows, har ek mein do-teen sau seats. Chhota. Yahan sab kuch mushkil contention ke baare mein hai, volume ke nahi."],
        ["Browse to book ratio", "100 to 1 normally, 1000 to 1 in a spike", "Drop ke dauran sab seat map refresh karte hain aur lagbhag koi complete nahi karta. Ise cache se serve karo, warna kisi ke kuch khareedne se pehle database gir jaayega."]
      ],
      numbersNote: "Do numbers sab kuch shape karte hain. <b>16 to 1</b> ka matlab hai zyada tar users haarenge, isliye haarna sasta hona chahiye. <b>200M rows</b> ka matlab hai yeh volume problem hai hi nahi: yeh kuch hazaar bahut garm rows hain, aur yahan ki har technique is baare mein hai ki koi bhi ek ko kitni der pakde rakhta hai."
    },
  
    stagesIntro: "Chhe stages. Pehle do sirf double booking ko impossible banane ke liye hain, aur interviewer yahi sunna chahta hai. Baaki is baat se bachne ke baare mein hai ki aadha million log ek hi minute mein aate hain, sab wahi chalis seats chahte hain.",
  
    stages: [
      { t: "0. Check, then book, and the bug that lives in the gap",
        pressure: "Abhi kuch nahi. Wahi version draw karo jo sab likhte hain, kyunki usme jo bug hai wahi is poori problem ka subject hai aur woh paragraph ke bajay pseudocode ki do lines mein kahin aasani se dikhta hai.",
        say: "Seat padho, dekho ki free hai, booking insert karo. Testing mein aur Tuesday dopahar production mein yeh bilkul theek chalta hai. Do users ek hi millisecond mein hit karte hain, dono free padhte hain, dono insert karte hain, aur cinema ne seat J12 do baar bech di. Yeh check-then-act hai, aur koi retry logic ya optimism ise fix nahi karta, kyunki read aur write ke beech ka gap hi woh jagah hai jahan bug rehta hai.",
        breaks: "Ek user se zyada kuch bhi. Aur dhyan do ki ise kya fix <i>nahi</i> karta: tez database, bada machine, ya do baar check karna." },
  
      { t: "1. Let the database be the referee, and add a hold",
        pressure: "Pehle correctness, aur phir ek product requirement jo ise mushkil banati hai: user ko payment ke liye kuch minute chahiye, aur un minutes mein seat na free honi chahiye na sold.",
        say: "Do badlav. Pehla, booking ek condition wala single statement ban jaati hai, ek update jahan seat abhi bhi free hai, ya show aur seat par unique constraint ke khilaf insert. Do concurrent writers mein se exactly ek row affect karta hai aur doosre ko saaf rejection milta hai, kahin application level locking ke bina. Doosra, ek hold: expiry wala chhota claim, to seat payment ke dauran reserved rehti hai aur user bhatak jaaye to khud pool mein wapas aa jaati hai. Expiry hi asli baat hai, kyunki iska matlab hai band hue browser ke baad kisi ko safai nahi karni padti.",
        breaks: "Sahi hai, aur ab browse ki har ek 50,000 requests per second usi database ko bhi hit kar rahi hai jisme yeh inventory hai, aur on-sale ke dauran yeh aadha million logon ka seat map refresh karna ban jaata hai." },
  
      { t: "2. Split browsing from buying",
        pressure: "Dono workloads ulti cheezein chahte hain. Browsing bahut bada hai, repetitive hai, aur kuch second purane data se bilkul khush hai. Buying rare hai, contended hai, aur stale read bardasht nahi kar sakta. Dono ke beech ek service aur ek database share karne ka matlab hai ki strict wala dono ke rules tay karta hai.",
        say: "Do services, do disciplines. Browse do second ki TTL wala cached seat map padhta hai aur interface mein yeh kehta bhi hai, kyunki seat map ek hint hai, promise nahi. Buying source of truth par jaati hai aur conditional write leti hai. Dono ke beech ki line woh sentence hai jo main chahunga ki interviewer sune: <i>cache batata hai kya shayad free hai, database decide karta hai kya sach mein aapka hai.</i> User ko ek green seat dikhna jo taken nikle ek normal, expected, achhe se handle kiya gaya outcome hai.",
        breaks: "User ab seat hold karke pay karne jaata hai, aur payment mein ek third party hai jo slow ho sakta hai, fail ho sakta hai, aur bina bataye time out ho sakta hai ki kya hua. Tab tak hold tik-tik kar raha hai." },
  
      { t: "3. Payment, and the awkward gap it opens",
        pressure: "Ek time limited claim ke andar ek external dependency. Asli ghatiya case failure nahi hai, woh payment hai jo hold expire hone aur seat dobara bik jaane ke baad succeed hota hai.",
        say: "Booking ek state machine ban jaati hai: held, pending payment, confirmed, ya released, aur seat sach mein sirf confirmation par sold hoti hai. Charge ke saath booking id ke barabar idempotency key jaati hai, to timeout ke baad retry kabhi doosra charge nahi ban sakta. Aur hold payment shuru hone par extend hota hai, naya shuru nahi, kyunki card form wahi jagah hai jahan user sabse slow hote hain. Agar payment hold jaane aur seat dobara bikne ke baad confirm ho, to jawab hai automatic refund aur maafi, jo worker decide karta hai. Yeh case rare hai, aur iska jawab zor se bolna yeh maanne se zyada kimti hai ki yeh ho hi nahi sakta.",
        breaks: "Sab kuch sahi hai, aur phir ek blockbuster on sale aata hai aur aadha million log usi sixty second mein aate hain, sab usi chalis rows ke ek hi button ko dabate hain." },
  
      { t: "4. The on-sale, which is a scheduled denial of service",
        pressure: "Paanch lakh users, tees hazaar seats. Zyada tar ko ticket nahi milega, aur agar sabko yeh ek hi database rows par contend karke pata karne diya gaya, to kisi ko nahi milega.",
        say: "Write path ke aage ek waiting room. Jo bhi aata hai use ek position aur live estimate milta hai, aur booking service sirf admission token wali requests leti hai, jo us rate se issue hote hain jo inventory sach mein absorb kar sake, shayad kuch hazaar per second. Yeh teen kaam ek saath karta hai: thundering herd ko paced stream banata hai, haarna error ki jagah queue jaisa lagta hai, aur mehnga path kabhi oversubscribed nahi hota. Seat map sale khulne se pehle cache mein pre-warm kiya jaata hai, kyunki cold cache ka sabse bura pal drop ka pehla second hai.",
        breaks: "Tickets bik gaye, aur abhi kisi ke paas nahi hain. Confirmation emails, QR codes, cinema ka apna system aur analytics sab jaanna chahte hain, aur inme se koi bhi sale ko slow ya fail nahi kar sakta." },
  
      { t: "5. Everything that happens after the money",
        pressure: "Confirmed booking ke nateejon ki ek lambi poonchh hai, jinme se har ek kisi ke liye zaroori hai aur koi bhi sale ke critical path par allowed nahi.",
        say: "Confirmation aur outbox row ek hi transaction mein likhi jaati hain, aur ek worker outbox se publish karta hai. Aage sab kuch, QR code, email, push notification, cinema ka apna system, analytics, us ek event ka consumer hai. Email provider down ho to bhi tickets bik jaate hain. Outbox ki poori wajah yahi hai: uske bina ya to charge ke baad sale kho sakti hai, ya email chupchap kabhi nahi jaa sakta, aur dono ek minute late hone se bure hain." }
    ],
  
    boxesIntro: "Gyarah components. Dhyan do ki kitne kam sach ko chhuate hain: sirf booking service aur inventory store ko kuch decide karne ki ijazat hai. Baaki sab ya cache hai, ya queue, ya pacer, ya ek nateeja.",
  
    boxes: [
      { job: "Seat map dikhata hai, hold request bhejta hai, phir payment, aur haarne ko achhe se sambhalta hai.",
        why: "Yeh isliye draw hai kyunki design use jaan-boojhkar ek kaam deta hai: shayad stale data ko imaandari se dikhana, aur rejection ko error ki jagah normal outcome ki tarah handle karna.",
        forced: "Stage 2, jab seat map ek cached hint ban gaya.",
        alts: [["Making the seat map strictly live over a socket", "sach mein achha, aur on-sale ke dauran iska matlab hai aadha million logon ko un seats ke updates push karna jo unhe milengi nahi."]],
        pros: ["Chhoti cache TTL aur imaandar interface live updates se kahin sasta hai aur lagbhag utna hi achha.", "Seat haarna achhe se handle ho sakta hai: paas mein dobara select karo, user ko flow mein rakho."],
        cons: ["User kabhi kabhi aisi seat chunta hai jo pehle hi ja chuki, aur koi engineering ise poori tarah nahi hatati.", "Hold countdown ke liye client side timers server ke timers se drift karenge, to server ki expiry hi ginti hai."],
        cost: "Kuch nahi, aur yeh live inventory feed ki zaroorat hata deta hai.",
        fails: "User ka countdown kehta hai do minute bache hain aur server hold pehle hi expire kar chuka hai. Submit par hamesha dobara check karo, aur hamesha server ki clock par bharosa karo.",
        say: "Seat map ek hint hai. Interface ko yeh kehna chahiye, client ko submit par dobara check karna chahiye, aur seat haarne par user ko error page ki jagah wapas selection mein daalna chahiye." },
  
      { job: "Posters, listings aur show page ke zyada tar static hisse serve karo.",
        why: "On-sale ke dauran page khud aadha million baar maanga jaata hai aur uska content mushkil se badalta hai. Ise apne servers se serve karna capacity ko sajawat par kharch karna hai.",
        forced: "Stage 2, aur yeh apni jagah mainly stage 4 mein kamaata hai.",
        alts: [["Serving everything from the application", "Tuesday ko theek, aur drop ke pehle minute mein bekaar."]],
        pros: ["Spike ka woh hissa absorb karta hai jo asal mein seats ke baare mein nahi hai.", "Ek static waiting room page rakhne ki natural jagah jo aapke infrastructure ko bilkul nahi chhuta."],
        cons: ["Edge par jo bhi cached hai woh definition se stale hai, to seat map kabhi inme se ek nahi hona chahiye.", "Show on sale jaane par cache invalidation scheduled honi chahiye, umeed par nahi chhodi jaani chahiye."],
        cost: "Sasta, aur yeh spike requests ka sabse bada hissa hata deta hai.",
        fails: "Seat map galti se edge par lambi TTL ke saath cache ho jaata hai, aur hazaaron log das minute purana map dekhte hain. Dynamic inventory ko CDN se poori tarah bahar rakho aur boundary explicit rakho.",
        say: "Seat map ke alawa sab kuch. Jis pal inventory edge par hai, aapne aisa promise kar diya jo aap nibha nahi sakte." },
  
      { job: "Read only sawaalon ke jawab do: kya chal raha hai, kahan, kab, aur lagbhag kaun si seats free hain.",
        why: "Yeh 99% traffic hai aur iske rules booking se bilkul alag hain. Inhe alag karne ka matlab hai read path boxes jodkar scale ho sakta hai aur inventory ki correctness ko kabhi affect nahi kar sakta.",
        forced: "Stage 2.",
        alts: [["One service for both", "kam moving parts, aur browsing mein spike phir booking path se connections aur threads chheen leta hai, theek us pal jab booking sabse zyada matter karti hai."], ["Read replicas of the inventory database", "phir bhi har request par ek database round trip, aur replica lag seat map ko waise bhi stale banata hai, to cache rakho aur staleness khud control karo."]],
        pros: ["Stateless aur aasaani se scalable.", "Ise aggressively cache kiya ja sakta hai kyunki yeh kabhi kuch decide nahi karta.", "Agar yeh poori tarah fail ho jaaye, to maujooda bookings aur payments chalte rehte hain."],
        cons: ["Yeh woh data serve karta hai jise woh jaanta hai stale ho sakta hai, jo product mein bataya jaana chahiye, chhupaya nahi."],
        cost: "Aam taur par 50,000 requests per second, spike mein kahin zyada, lagbhag sab cache se serve.",
        fails: "Sale khulte waqt iska cache cold hai aur har request inventory database tak pahunch jaati hai, jo writes ke liye size hua hai. Scheduled on-sale se pehle pre-warm karo, jo aap kar sakte ho kyunki schedule pata hai.",
        say: "Yeh padhta hai, kabhi likhta nahi, aur kabhi decide nahi karta. Yahi constraint diagram ke is aadhe hisse ki har optimisation ko allowed banati hai." },
  
      { job: "Rendered seat maps aur show listings ko ek baar mein do second ke liye hold karo.",
        why: "Drop ke dauran wahi seat map ek second mein hazaaron baar maanga jaata hai aur lagataar badalta hai. Do second ki TTL ise second mein kuch database reads mein badal deti hai aur imaandar bhi rehti hai.",
        forced: "Stage 2.",
        alts: [["No cache, read the database every time", "millisecond tak sahi, aur yeh poora browse load us machine par daal deta hai jo booking transactions kar rahi hai."], ["Long TTL with event driven invalidation", "average mein fresher, aur drop ke dauran invalidation rate booking rate ke barabar hoti hai aur aap effectively uncached ho, upar se extra machinery ke saath."], ["Pushing seat map deltas to connected clients", "sabse achha user experience aur bahut saara kaam, sirf us product ke liye justified jiska poora business on-sales hai."]],
        pros: ["Fixed chhoti TTL crowd kitni bhi badi ho, predictable, bounded database load deti hai.", "Staleness bounded hai aur interface mein bataayi ja sakti hai.", "Ise scheduled sale se pehle warm karna aasan hai aur sabse bura failure mode hata deta hai."],
        cons: ["Users kabhi kabhi aisi seat chunenge jo ja chuki. Yeh design mein hai, roka nahi jaata.", "Per show keys ka matlab hai garm show ek hot key hai, jiske aage browse service mein local caching chahiye."],
        cost: "Chhota: har show ka ek map, un shows ke liye har do second mein badla jaata hai jinhe koi dekh raha hai.",
        fails: "Ek show itna garm hai ki ek single cache key ek node ko saturate kar deti hai. Browse service mein ek chhota in process cache jodo, to ek box par hazaar requests per second ek cache read ban jaati hain.",
        say: "Event invalidation ki jagah do second TTL. Jis ek pal mein sab matter karta hai, invalidation aur booking ek hi rate par hote hain, to fixed TTL simple bhi hai aur zyada predictable bhi." },
  
      { job: "Bheed ko rokna, positions dena, aur logon ko booking path mein us rate par admit karna jo woh survive kar sake.",
        why: "Paanch lakh log tees hazaar rows ke liye contend nahi kar sakte. Kisi ko herd ko stream mein badalna hai, aur kisi bhi mehnge kaam se pehle karna baad mein karne se kahin sasta hai.",
        forced: "Stage 4. Yeh ek scheduled event ke liye hai aur sale aur outage ke beech ka farak hai.",
        alts: [["Plain rate limiting with 429s", "backend ko bachata hai aur user ko bina jaankari ke random lottery deta hai, jiska jawab woh refresh karke dega, aur halat aur kharab hoga."], ["First come first served with no queue", "sabse tez network jeetta hai, jo ek bot hai, aur design ne scalping ko technical advantage bana diya."], ["Letting everyone in and letting the database sort it out", "default hai, aur iska matlab hai sale ka pehla minute sale nahi outage hai."]],
        pros: ["Spike ko us rate mein badalta hai jo aapne chuni, har mehnge kaam ke aage.", "Position aur estimate error se kahin behtar experience hai, bhale nateeja wahi ho.", "Bot mitigation ko effective banane ki sabse achhi ek jagah hai, kyunki yeh sab kuch ke upstream hai."],
        cons: ["Ek aur system, kabhi kabhi hi use hota hai, matlab woh system jo tab toota hone ki sabse zyada sambhavna rakhta hai jab aapko chahiye.", "Queue fairness ek product decision hai jiske asli nateeje hain, aur log ise gehri parwah karte hain."],
        cost: "Ise sirf har waiting user ke liye ek token aur position hold karni hai, jo chhota hai. Iski mushkil operational hai, computational nahi.",
        fails: "Yeh khud bottleneck ban jaata hai. Ise dumb rakho: admission time wala signed token, statelessly verified, to admission ko request ke waqt koi shared state nahi chahiye.",
        say: "Timestamp wale signed admission tokens, us rate par issue jo inventory absorb kar sake. Booking service bina token wali har cheez reject karti hai, aur queue khud ek counter se zyada kuch nahi rakhti." },
  
      { job: "Inventory badalne ki ijazat wala ekmaatra component. Hold acquire karo, payment lo, confirm ya release karo.",
        why: "Correctness tab sabse aasaani se guarantee hoti hai jab exactly code ka ek hissa likh sakta hai. Design mein baaki sab is tarah arrange hai ki yeh service jitna ho sake kam kaam, jitni ho sake chhoti der ke liye kare.",
        forced: "Stage 0, aur uske baad har stage mein ise narrow kiya gaya.",
        alts: [["Letting several services write inventory", "banana tez hai aur har aane wali team se double booking introduce hone ki jagahein multiply ho jaati hain."], ["A dedicated inventory service that only this one calls", "ek extra hop, aur bade organisation mein sach mein sahi jahan kai products wahi seats bechte hain."]],
        pros: ["Ek writer ka matlab ek jagah audit, ek jagah test, ek jagah sahi karna.", "Yeh itni chhoti hai ki iska transaction short ho sakta hai, jisse hot rows chalti rehti hain.", "Admission tokens ka matlab hai yeh kabhi oversubscribed nahi hoti."],
        cons: ["Yeh ek single logical writer hai, to ise horizontally scalable hona hai bina single writer property todhe, jo database constraint deta hai.", "Yeh un ekmaatra requests ke path par hai jo paisa banati hain."],
        cost: "Peak par 8,000 attempts per second. Volume mein chhota, contention mein concentrated.",
        fails: "Yeh payment call ke across database transaction khula rakhti hai. Kabhi mat karo: transaction hold ko commit karta hai, payment uske bahar hota hai, aur confirmation ek doosra chhota transaction hai. Jo transaction third party ka wait kare, uski wajah se ek slow payment poora hall lock kar deta hai.",
        say: "Transaction kabhi kisi aur ko network call ke across nahi failta. Hold, commit, pay, commit. Do chhote transactions aur unke beech ek slow third party, ek anjaan ke around lipta ek lamba transaction nahi." },
  
      { job: "Sach. Har show ki har seat ki ek row, aur ek constraint jo ise do baar bechna impossible banati hai.",
        why: "Har design mein kahin ek component hota hai jo arbitrate karta hai. Yahan woh relational store hai, aur wajah unique constraint hai, tables ke baare mein kuch nahi.",
        forced: "Stage 0, aur stage 1 ne ise woh constraint diya jo ise sahi banata hai.",
        alts: [["A NoSQL store with conditional writes", "workable hai, kyunki ek single item par conditional put exactly wahi primitive hai jo chahiye, aur mushkil tab hoti hai jab booking kai seats par ho aur sab ya koi nahi chahiye."], ["Holding inventory in Redis with atomic scripts", "bahut tez, per key atomic, aur ab yeh us cheez ka durable record hai jo aapne becha, jo iske rehne ki buri jagah hai."], ["An event sourced inventory", "concept mein achha fit, aur yeh is seat free hai sawaal ko lookup ki jagah fold bana deta hai, jo system ke sabse garm read ki galat shape hai."]],
        pros: ["(show, seat) par unique constraint double booking ko unlikely nahi impossible banati hai, jo guarantee ki alag category hai.", "Multi seat bookings free mein ek transaction ban jaati hain, all or nothing.", "Yeh chhota hai, lagbhag 200 million rows, to ek achhi tarah provisioned cluster ise sambhal leta hai."],
        cons: ["Drop ke dauran hot rows: kuch hazaar rows par hazaaron transactions per second, sab database se serialised.", "Yeh woh component hai jo eventually consistent nahi ho sakta, to yeh buying ki availability ka ceiling tay karta hai."],
        cost: "200M rows, kam volume, extreme concentration. Show id se shard karo taaki ek popular show doosre ko slow na kar sake.",
        fails: "Popular row par lock contention transactions ko queue karta hai, latency badhti hai, timeouts fire hote hain, aur clients retry karte hain, halat aur kharab. Fix sab duration ke baare mein hain: transactions short rakho, controlled rate par admit karo, aur row pakde hue kabhi kisi external cheez ka wait mat karo.",
        say: "Show id se sharded, (show, seat) par unique, transactions single digit milliseconds mein naape gaye. Diagram ke is taraf ka har design decision isliye hai ki koi row kitni der pakde rakhta hai woh kam ho." },
  
      { job: "Record karo ki seat claimed hai par abhi paid nahi, aur kuch minute baad ise apne aap bhool jao.",
        why: "User ko pay karne ke liye time chahiye, aur us dauran seat ek teesri state mein hai jo na free hai na sold. Expiry automatic honi chahiye, kyunki aam ending ek aisa user hai jo bas tab band kar deta hai.",
        forced: "Stage 1.",
        alts: [["A status column on the seat row with an expires_at timestamp", "ek system, booking ke saath poori tarah transactional, aur expired holds release karne ke liye sweeper job chahiye, aur jab tak woh job nahi chalta seat taken dikhti hai."], ["A Redis key with a TTL", "expiry free aur exact hai, aur hold ab sale se alag system mein hai, to hold acquire karna aur booking confirm karna ek transaction nahi ho sakta."]],
        pros: ["TTL expiry ka matlab na sweeper, na cleanup, na adhoori released seats.", "Itna tez ki spike mein hold acquire karna bottleneck nahi.", "Agar hold aur seat ek hi jagah rehte hain to ek atomic script mein check ho sakte hain."],
        cons: ["Do systems jinhe agree karna hai: Redis mein hold aur database mein sale. Reconciliation worker ka kaam hai aur yeh asli kaam hai.", "Agar Redis kho jaaye to har in flight hold gayab ho jaata hai, aur payment ke beech ke users seat kho dete hain."],
        cost: "Har in flight hold ke liye ek key. Hazaaron, millions nahi. Bahut chhota.",
        fails: "Redis fail over hota hai aur users payment page par hain tab holds gayab ho jaate hain. Woh payments un seats par confirm honge jo ab free dikhti hain, aur confirmation write succeed hogi, jo sahi outcome hai. Khatarnak direction doosri hai, jahan hold bacha rehta hai par sale nahi, jise worker reconcile karta hai.",
        say: "Main holds aur inventory ko ek hi store mein rakhunga agar kar sakun, kyunki tab hold acquire karna aur sale confirm karna ek transaction hai. Agar alag hain, to mujhe reconciler chahiye, aur mujhe yeh kehna chahiye, do boxes draw karke umeed nahi rakhni chahiye." },
  
      { job: "Paisa lo. External, slow, aur unknown outcome return kar sakta hai.",
        why: "Design mein yahi ek cheez hai jo aapke control mein nahi, aur yeh ek time limited hold ke andar baithi hai, jo ise routine ki jagah dilchasp banati hai.",
        forced: "Stage 3.",
        alts: [["Charging after confirming the seat", "user ko ticket milta hai aur card decline ho jaata hai, to ab aap paise ke peeche daud rahe ho ya woh ticket cancel kar rahe ho jiska kisi ne screenshot le liya."], ["Pre-authorising and capturing on confirmation", "is shape ki problem ke liye sach mein sabse achha jawab: seat confirm hone se pehle authorise, baad mein capture. Do phases, aur yeh hold aur confirm par bilkul map hota hai."]],
        pros: ["Idempotency keys timed out charge ko retry karna safe banati hain, jo ekmaatra property hai jo yeh sab workable banati hai.", "Webhooks late confirmation ko bhi booking complete karne dete hain bina kisi ke poll kiye."],
        cons: ["Latency seconds mein naapi jaati hai aur aapke control mein nahi, isliye hold ko usse lamba jeena padta hai.", "Webhooks out of order, do baar, ya bahut baad mein aate hain, to receiving state machine ko bhi idempotent hona padta hai."],
        cost: "Peak par 8,000 attempts per second, jinme se har ek time out hokar retry ho sakta hai.",
        fails: "Payment hold expire hone aur seat dobara bikne ke baad confirm hota hai. Worker seat ke bina confirmed payment detect karta hai, automatically refund karta hai, aur notify karta hai. Yeh jawab taiyaar rakho, kyunki achha interviewer sabse pehle yahi poochta hai.",
        say: "Hold karte waqt authorise, confirmation par capture, booking id ke barabar idempotency key, aur webhook handler jo do baar call hone par safe ho. Late success ka refund path ek designed feature hai, incident nahi." },
  
      { job: "Outbox se publish karo, stale bookings expire karo, aur payments aur inventory ke beech ke disagreements reconcile karo.",
        why: "Do systems ko span karne wale har design ko kuch chahiye jiska kaam yeh notice karna hai ki woh kab disagree karte hain. Yeh maan lena ki kabhi nahi karenge ek achhe answer ki sabse aam kami hai.",
        forced: "Stage 3.",
        alts: [["Doing all of this inline in the booking service", "slow, retry heavy, third party dependent kaam us ekmaatra endpoint ke transaction path mein daal deta hai jo paisa banata hai."], ["Trusting webhooks alone", "webhooks kho jaate hain, late aate hain aur duplicate hote hain. Pending bookings ka periodic sweep hi woh cheez hai jo khoya hua webhook stuck order ki jagah delay bana deta hai."]],
        pros: ["Yeh outbox pattern ko kaam karwata hai, to sale aur uske nateeje crash se alag nahi ho sakte.", "Yeh woh ek jagah hai jahan awkward cases rehte hain, jo unhe paanch services mein bikhre hone se kahin behtar hai.", "Retries aur backoff yahan rehte hain, request path mein nahi."],
        cons: ["Yeh asynchronous hai, to hamesha ek window hota hai jab do systems disagree karte hain aur worker ne abhi dekha nahi.", "Yeh sabse kam glamorous component hai aur wahi jo under-tested rahega."],
        cost: "Modest aur bursty, sale curve ko follow karta hai.",
        fails: "Bade sale ke baad yeh peeche reh jaata hai, aur confirmation emails das minute late aate hain. Kuch nahi khota, kyunki outbox durable hai, aur yahi woh property hai jiska paisa diya ja raha hai.",
        say: "Outbox publisher, expiry sweeper aur reconciler, ek component mein. Agar interviewer poochhe ki payment succeed ho aur seat na ho to kya hota hai, to main isi box ki taraf ishara karta hoon." },
  
      { job: "Confirmed booking ko ticket, email, QR code, push notification aur cinema ko message mein badlo.",
        why: "In sab ka kisi ke liye matlab hai aur inme se koi bhi sale ko fail nahi karwa sakta. Yeh ek event ke consumers hain, transaction ke steps nahi.",
        forced: "Stage 5.",
        alts: [["Sending the email inline during confirmation", "sale ab email provider ki availability par depend karti hai, jo aisa trade nahi jo koi jaan-boojhkar karega."]],
        pros: ["Ek event, kai independent consumers, har ek apne aap retry karta hai.", "Baad mein ek naya consumer booking path mein bina badlav ke joda ja sakta hai."],
        cons: ["User email aane se pehle screen par confirmation dekhta hai, jo interface mein kehna padta hai.", "At-least-once delivery ka matlab hai consumers idempotent hone chahiye, warna logon ko ticket ki teen copies milti hain."],
        cost: "Har booking par ek event, har ek ke kai consumers.",
        fails: "Email provider ek ghante ke liye down hai. Tickets phir bhi bik jaate hain aur app mein dikhte hain, aur emails recover hone par jaate hain. Ticket ka source of truth email ki jagah app ko banana wahi design decision hai jo ise survivable banata hai.",
        say: "Ticket booking confirm hote hi exist karta hai. Email ek aisi cheez ke baare mein notification hai jo pehle hi ho chuki, woh cheez khud nahi." }
    ],
  
    flowsIntro: "Do paths aur ek repair path. Repair path woh hai jo payment system chalaye hue candidate ko us candidate se alag karta hai jisne bas padha hai.",
  
    flows: [
      { n: "Browsing a seat map during a busy sale",
        steps: [
          ["Page aur posters CDN se aate hain. Inme se kuch bhi aapki services ko nahi chhuta.", "sync"],
          ["Seat map request browse service ko hit karti hai, jo cache se per show key padhti hai. Lagbhag hamesha hit.", "sync"],
          ["Miss par ek process key ko inventory se bharta hai aur baaki sab uska wait karte hain, to hazaar concurrent misses ek query ban jaate hain.", "sync"],
          ["Response batata hai ki do second pehle kaun si seats free thi, aur interface imaandari se kehta hai ki yeh ek hint hai.", "sync"]
        ] },
      { n: "Buying a seat",
        note: "Do chhote transactions aur unke beech ek slow anjaan. Yahi shape is problem ka jawab hai.",
        steps: [
          ["On-sale ke dauran user waiting room join karta hai aur apni baari aane par signed admission token pata hai.", "sync"],
          ["Woh seats chunte hain aur hold request karte hain. Booking service har seat par ek conditional write karti hai, sab ek transaction mein: jahan abhi free ho wahan claim.", "sync"],
          ["Agar koi bhi seat condition fail kare, poora transaction rollback hota hai aur user ko bataya jaata hai ki kaun si seats gayi, alternatives ke saath. Yeh aam case hai aur tez hai.", "sync"],
          ["Transaction commit hota hai aur aath minute ki expiry wala hold ban jaata hai. Database transaction ab khatam hai, kisi third party se contact hone se pehle.", "sync"],
          ["Payment booking id ke barabar idempotency key ke saath authorise hoti hai. Isme seconds lagte hain aur koi lock nahi hold hota.", "sync"],
          ["Authorisation par ek doosra chhota transaction seats confirm karta hai, payment capture karta hai, aur ek outbox row likhta hai. User ke paas ticket hai.", "sync"],
          ["Worker event publish karta hai aur fulfilment tickets, email aur cinema ke system mein fan out hota hai.", "async"]
        ] },
      { n: "When it goes wrong, which it will",
        note: "Teen cases, aur har ek ka ek defined jawab hai. Poochhe jaane se pehle yeh bolo.",
        steps: [
          ["<b>User chhod deta hai.</b> Hold apne aap expire hota hai, seat pool mein wapas aati hai, aur kisi ko notice nahi karna pada. Yeh sabse aam ending hai.", "async"],
          ["<b>Payment time out hota hai.</b> Worker wahi idempotency key ke saath retry karta hai. Provider ya to charge ek baar karta hai ya jo woh pehle kar chuka use report karta hai. Booking jawab aane tak pending rehti hai.", "async"],
          ["<b>Payment hold expire hone aur seat dobara bikne ke baad succeed hota hai.</b> Worker seat ke bina confirmed payment dekhta hai, automatically refund karta hai, aur user ko notify karta hai. Rare, unavoidable, aur umeed se hata nahi handle kiya gaya.", "async"],
          ["<b>Webhook do baar aata hai.</b> Handler payment id par keyed hai aur doosra ek no-op hai. Maan lo har webhook do baar aayega, kyunki aayega.", "async"]
        ] }
    ],
  
    tradeoffsIntro: "Yahan ke pehle do tay karte hain ki system sahi hai ya nahi. Aakhri do tay karte hain ki woh apne launch day se bachta hai ya nahi.",
  
    tradeoffs: [
      { a: ["Conditional write with a constraint", "Check write ke andar hai, to koi gap nahi. Haarne walon ko saaf rejection milta hai aur kuch hold nahi hota."],
        b: ["Explicit locking, SELECT FOR UPDATE", "Intuitive aur samajhna aasan. Locks aapke code ke across hold hote hain, to transaction ke andar ek slow branch sabko block karti hai."],
        flip: "decision ko sach mein kai statements aur beech mein ek read chahiye, jo complex pricing ya allocation rules mein hota hai. Tab lock lo, transaction chhota rakho, aur lock timeout set karo." },
      { a: ["Two short transactions around payment", "Database kabhi third party ka wait nahi karta. Us payment ko reconcile karna padta hai jo hold expire hone ke baad succeed ho."],
        b: ["One transaction spanning the payment call", "Kabhi reconciliation nahi chahiye. Ek slow payment ab seat rows ko utni der hold karta hai jitni der provider lagata hai."],
        flip: "kabhi nahi, is contention par. Is trade-off ka jo version rakhne layak hai woh authorise versus capture hai: hold ke andar authorise, confirm par capture, jo wahi shape hai sahi tarah kiya hua." },
      { a: ["Waiting room in front of the write path", "Load aisi rate ban jaata hai jo aapne chuni. Haarna error ki jagah queue jaisa lagta hai."],
        b: ["Let everyone through and rely on rejections", "Banane ke liye koi extra system nahi. Sale ka pehla minute khud par thopa hua denial of service hai."],
        flip: "koi scheduled on-sales nahi hain aur traffic smooth hai. Tab waiting room ek aisa system hai jo aap us event ke liye maintain karte ho jo kabhi aata nahi, aur plain rate limiting kaafi hai." },
      { a: ["Seat map cached with a fixed short TTL", "Predictable, bounded database load, crowd kitni bhi badi ho. Kabhi kabhi woh seat dikhata hai jo ja chuki."],
        b: ["Event driven invalidation, or live push", "Fresher, aur drop ke dauran invalidation rate booking rate ke barabar hoti hai, to aap uncached ho extra machinery ke saath."],
        flip: "venue chhota aur premium hai, jahan sau log chalis seats mein se chun rahe hain. Tab live updates sasti hain aur experience uske layak hai." }
    ],
  
    next: [
      "<b>Dynamic and tiered pricing.</b> Wahi inventory, ek price ke saath jo row, time aur demand se badalta hai. Yeh write path se kahin zyada read path ko chhuta hai.",
      "<b>Cancellations and resale.</b> Seat ko pool mein wapas bhejna wahi conditional write ulta hai, saath mein ek refund state machine jo sale se zyada nazuk hai.",
      "<b>Bot and scalper defence.</b> Waiting room sahi jagah hai, aur iske peeche device signals, payment velocity checks aur per account limits chahiye.",
      "<b>Multi region.</b> Inventory swabhaav se regional hai, kyunki cinema ek hi jagah hai. Show ko uske venue ke region par pin kar do to mushkil problem lagbhag khatam ho jaati hai."
    ]
  }
},

/* ==========================================================================
   6. LLD: SEAT BOOKING SERVICE
   ========================================================================== */
{
  id: "booking-lld", kind: "lld", n: "Seat booking service", sub: "the LLD inside the ticket box",
  tags: ["strategy", "state machine", "thread safety", "machine coding"],
  one: "Same product as the ticket booking page, one box further in. Here nothing is distributed: the whole problem is which object owns the seat map, what exactly you synchronise, and how to keep pricing and payment from leaking into the class that sells things.",

  brief: {
    why: "An LLD round asks a narrower question than an HLD round: not can this serve a million people, but would I want to maintain this in six months. The two things being scored are whether your objects match the nouns a domain expert would use, and whether the one genuinely concurrent operation is protected by something you can point at. Patterns are the third thing, and only when they remove a real coupling. Naming five of them removes marks rather than adding them.",
    functional: [
      "<b>Show the seat map</b> for a show, with each seat's status and price.",
      "<b>Hold seats</b> for a few minutes so a user can pay, and release them automatically if they do not.",
      "<b>Confirm a booking</b> after payment, or release the hold. Exactly one booking per seat, under concurrency.",
      "<b>Price a seat</b> by row, day and show, without the booking code knowing any of those rules.",
      "<b>Cancel</b>, returning seats to the pool."
    ],
    out: ["the HTTP layer", "persistence beyond a repository interface", "user accounts and auth", "the cinema's own scheduling", "discount coupons beyond a price hook"],
    nfr: [
      ["Thread safety", "per show, not global", "Several threads will hold seats for the same show at once. A single global lock is correct and turns the whole cinema chain into one queue, which an interviewer will notice."],
      ["No double booking", "absolute", "The single correctness requirement. Everything else in the class design is negotiable."],
      ["Extensibility", "new price rule, no change to booking", "The stated reason for the one pattern that definitely earns its place here."],
      ["Testability", "no real payment, no real clock", "Payment behind an interface and expiry driven by an injectable clock. Otherwise the only way to test expiry is to wait eight minutes."]
    ],
    numbers: [
      ["Seats per show", "about 200", "Small enough that a show's seat map is one in memory object, which is the fact the whole locking strategy rests on."],
      ["Concurrent holders per show", "tens", "Not thousands. Contention is per show and short lived, so a plain lock per show is genuinely enough."],
      ["Hold duration", "8 minutes", "Long enough to pay, short enough that a hoarder cannot lock a hall."],
      ["Seats per booking", "1 to 10", "Which is why the claim has to be all or nothing, and why lock ordering matters."]
    ],
    numbersNote: "The number that decides the design is <b>200 seats per show</b>. A show's seat map fits in one object, so the unit of locking is the show. If a show had a million seats the answer would be per seat locks, and the code would be considerably worse."
  },

  stagesIntro: "Six stages, and the shape is the same as the HLD page: start with the class everybody writes first, break it, and let each new type arrive because something specific went wrong. In a machine coding round you would write stage 2 first and add the rest if there is time, so the order here is also a priority order.",

  stages: [
    { t: "0. One class that does everything",
      pressure: "Nothing yet. This is what a first draft looks like and it is worth drawing, because the two things wrong with it are the two things the rest of the design fixes.",
      nodes: [
        { id: "caller", l: "Controller", s: "one call per action", col: 0, row: 0, r: "client" },
        { id: "bookingsvc", l: "BookingService", s: "maps, prices, payment", col: 1, row: 0, r: "svc" }
      ],
      edges: [{ a: "caller", b: "bookingsvc", l: "book(...)" }],
      add: ["caller", "bookingsvc"],
      say: "One class holding a map of show id to a set of booked seats, with pricing rules in an if-else chain and a payment call inline. It compiles, it passes a single threaded test, and it has both of this problem's classic defects: two threads can both see a seat as free, and adding a price rule means editing the class that sells tickets.",
      breaks: "There are no domain objects, so every method takes strings and returns strings, and no invariant has anywhere to live. A Seat that cannot say whether it is available is not a model, it is a row in disguise." },

    { t: "1. The nouns become classes",
      pressure: "You cannot protect an invariant that no object owns. Before any locking, the design needs a thing that knows what a seat is and a thing that owns the seat map.",
      nodes: [
        { id: "caller", l: "Controller", col: 0, row: 2, r: "client" },
        { id: "bookingsvc", l: "BookingService", s: "coordinates, owns nothing", col: 1, row: 2, r: "svc" },
        { id: "show", l: "Show", s: "owns its seat map", col: 2, row: 0, r: "entity" },
        { id: "booking", l: "Booking", s: "id, seats, status", col: 2, row: 2, r: "entity" },
        { id: "seat", l: "Seat", s: "row, number, type, status", col: 3, row: 0, r: "entity" }
      ],
      edges: [
        { a: "caller", b: "bookingsvc", l: "book(...)" },
        { a: "bookingsvc", b: "show", l: "find", bend: 0.28 },
        { a: "bookingsvc", b: "booking", l: "create" },
        { a: "show", b: "seat", l: "has *" }
      ],
      add: ["show", "booking", "seat"],
      say: "Nouns from the problem statement become classes: Show, Seat, Booking. Composition rather than inheritance, so a Show has Seats rather than a PremiumShow extending Show, because seat type varies per seat and not per show. Booking gets an id and a list of seats. Notice what the service is now: a coordinator that owns no data, which is exactly what you want a service to be.",
      breaks: "Two threads call book on the same Show at the same moment. Both read the seat as available, both mark it taken, and the design is exactly as broken as stage 0, now with better names." },

    { t: "2. Say precisely what you lock",
      pressure: "The one hard requirement. In an LLD interview this is the moment being scored, and the wrong answers are recognisable: adding synchronized to every method, or shrugging and saying the database will handle it.",
      nodes: [
        { id: "caller", l: "Controller", col: 0, row: 2, r: "client" },
        { id: "bookingsvc", l: "BookingService", s: "coordinates", col: 1, row: 2, r: "svc" },
        { id: "show", l: "Show", s: "owns its seat map", col: 2, row: 0, r: "entity" },
        { id: "lock", l: "SeatLockProvider", s: "per show, with expiry", col: 2, row: 1, r: "svc" },
        { id: "booking", l: "Booking", col: 2, row: 2, r: "entity" },
        { id: "seat", l: "Seat", col: 3, row: 0, r: "entity" }
      ],
      edges: [
        { a: "caller", b: "bookingsvc", l: "book(...)" },
        { a: "bookingsvc", b: "show", l: "find", bend: 0.28 },
        { a: "bookingsvc", b: "lock", l: "acquire", bend: 0.45 },
        { a: "bookingsvc", b: "booking", l: "create" },
        { a: "show", b: "seat", l: "has *" }
      ],
      add: ["lock"],
      say: "A SeatLockProvider holds, per show, which seats are claimed, by whom, and until when. Acquiring is a single synchronized block on that show's lock object, and inside it either every requested seat is free or none are taken. The lock is on the show, not on the service and not on the seat: on the service it serialises the whole cinema chain, and on the seat it invites deadlock when two bookings want the same pair in opposite orders. I would also sort the seat list before acquiring, which removes that deadlock entirely.",
      breaks: "Pricing is still an if-else chain inside the booking code. Every new rule, weekend surcharge, recliner premium, matinee discount, edits the class that sells tickets, and every edit is a chance to break selling tickets." },

    { t: "3. Pricing varies, so it becomes a strategy",
      pressure: "The only reliable test for whether a pattern is worth introducing: name the thing that varies. Here it is the price rule, it changes for business reasons rather than technical ones, and it changes often.",
      nodes: [
        { id: "caller", l: "Controller", col: 0, row: 2, r: "client" },
        { id: "bookingsvc", l: "BookingService", col: 1, row: 2, r: "svc" },
        { id: "show", l: "Show", col: 2, row: 0, r: "entity" },
        { id: "lock", l: "SeatLockProvider", s: "per show, with expiry", col: 2, row: 1, r: "svc" },
        { id: "booking", l: "Booking", col: 2, row: 2, r: "entity" },
        { id: "pricing", l: "PricingStrategy", s: "interface", col: 2, row: 3, r: "iface" },
        { id: "seat", l: "Seat", col: 3, row: 0, r: "entity" },
        { id: "pricingimpl", l: "Flat, Weekend, Recliner", s: "and a composed chain", col: 3, row: 3, r: "impl" }
      ],
      edges: [
        { a: "caller", b: "bookingsvc", l: "book(...)" },
        { a: "bookingsvc", b: "show", l: "find", bend: 0.28 },
        { a: "bookingsvc", b: "lock", l: "acquire", bend: 0.45 },
        { a: "bookingsvc", b: "booking", l: "create" },
        { a: "bookingsvc", b: "pricing", l: "price", bend: 0.62 },
        { a: "show", b: "seat", l: "has *" },
        { a: "pricing", b: "pricingimpl", l: "impl" }
      ],
      add: ["pricing", "pricingimpl"],
      say: "One interface with one method: price a seat for a show and return an amount. Implementations for the base fare, the weekend surcharge and the recliner premium, and a composite that runs a list of them in order. Adding a rule is now a new class and a line of configuration, and the booking code never changes. That is the open-closed principle stated as something you can actually point at, rather than quoted.",
      breaks: "Payment is a concrete call to a real gateway, so the booking flow cannot be tested without the internet, and swapping providers means editing the sales code again." },

    { t: "4. Payment goes behind an interface, and Booking becomes a state machine",
      pressure: "An external dependency inside the core flow, plus a booking that currently has a status field anybody can set to anything.",
      nodes: [
        { id: "caller", l: "Controller", col: 0, row: 2, r: "client" },
        { id: "bookingsvc", l: "BookingService", col: 1, row: 2, r: "svc" },
        { id: "show", l: "Show", col: 2, row: 0, r: "entity" },
        { id: "lock", l: "SeatLockProvider", col: 2, row: 1, r: "svc" },
        { id: "booking", l: "Booking", s: "held to confirmed only", col: 2, row: 2, r: "entity" },
        { id: "pricing", l: "PricingStrategy", s: "interface", col: 2, row: 3, r: "iface" },
        { id: "payment", l: "PaymentProcessor", s: "interface", col: 2, row: 4, r: "iface" },
        { id: "seat", l: "Seat", col: 3, row: 0, r: "entity" },
        { id: "pricingimpl", l: "Flat, Weekend, Recliner", col: 3, row: 3, r: "impl" },
        { id: "paymentimpl", l: "Gateway adapter, Fake", s: "one real, one for tests", col: 3, row: 4, r: "impl" }
      ],
      edges: [
        { a: "caller", b: "bookingsvc", l: "book(...)" },
        { a: "bookingsvc", b: "show", l: "find", bend: 0.26 },
        { a: "bookingsvc", b: "lock", l: "acquire", bend: 0.42 },
        { a: "bookingsvc", b: "booking", l: "create" },
        { a: "bookingsvc", b: "pricing", l: "price", bend: 0.6 },
        { a: "bookingsvc", b: "payment", l: "charge", bend: 0.78 },
        { a: "show", b: "seat", l: "has *" },
        { a: "pricing", b: "pricingimpl", l: "impl" },
        { a: "payment", b: "paymentimpl", l: "impl" }
      ],
      add: ["payment", "paymentimpl"],
      say: "PaymentProcessor is an interface with a fake implementation for tests, which is the whole reason it exists. And Booking stops having a public status setter: it gets confirm and cancel methods that throw if the current state does not allow the transition. Held goes to confirmed or expired, confirmed goes to cancelled, and nothing else is reachable. Making illegal states unrepresentable is worth more than any pattern on this page.",
      breaks: "Sending a confirmation email, updating the cinema's screen and writing an audit record are all sitting in the confirm method, and each new one edits it again. Meanwhile the service is still holding data in memory, so nothing survives a restart." },

    { t: "5. Consequences and storage, both pushed out",
      pressure: "Two different kinds of leak. Things that want to know about a booking do not belong inside the code that makes one, and where a Booking is stored is not the BookingService's business.",
      nodes: [
        { id: "caller", l: "Controller", col: 0, row: 2, r: "client" },
        { id: "bookingsvc", l: "BookingService", s: "coordinates, owns nothing", col: 1, row: 2, r: "svc" },
        { id: "show", l: "Show", col: 2, row: 0, r: "entity" },
        { id: "lock", l: "SeatLockProvider", col: 2, row: 1, r: "svc" },
        { id: "booking", l: "Booking", s: "state machine", col: 2, row: 2, r: "entity" },
        { id: "pricing", l: "PricingStrategy", col: 2, row: 3, r: "iface" },
        { id: "payment", l: "PaymentProcessor", col: 2, row: 4, r: "iface" },
        { id: "seat", l: "Seat", col: 3, row: 0, r: "entity" },
        { id: "notifier", l: "BookingListener", s: "email, screen, audit", col: 3, row: 1, r: "iface" },
        { id: "bookingrepo", l: "BookingRepository", s: "interface, in memory first", col: 3, row: 2, r: "store" },
        { id: "pricingimpl", l: "Flat, Weekend, Recliner", col: 3, row: 3, r: "impl" },
        { id: "paymentimpl", l: "Gateway adapter, Fake", col: 3, row: 4, r: "impl" }
      ],
      edges: [
        { a: "caller", b: "bookingsvc", l: "book(...)" },
        { a: "bookingsvc", b: "show", l: "find", bend: 0.26 },
        { a: "bookingsvc", b: "lock", l: "acquire", bend: 0.42 },
        { a: "bookingsvc", b: "booking", l: "create" },
        { a: "bookingsvc", b: "pricing", l: "price", bend: 0.6 },
        { a: "bookingsvc", b: "payment", l: "charge", bend: 0.78 },
        { a: "show", b: "seat", l: "has *" },
        { a: "booking", b: "notifier", l: "notifies" },
        { a: "booking", b: "bookingrepo", l: "saved" },
        { a: "pricing", b: "pricingimpl", l: "impl" },
        { a: "payment", b: "paymentimpl", l: "impl" }
      ],
      add: ["notifier", "bookingrepo"],
      say: "A BookingListener interface with a register method, and every consequence becomes a listener: email, the cinema's screen, the audit log. Adding one is a new class, not an edit. And a BookingRepository interface, implemented by a map for the interview and by a database later, so the service never mentions a table. In a real round I would write these two last, and I would say out loud that I am adding them for extensibility rather than because the requirements demanded them, because inventing extension points nobody asked for is its own failure mode." }
  ],

  boxesIntro: "Twelve types. Four of them are entities that own state, three are interfaces that exist to keep something out, and the rest are the implementations behind them. If you are short of time in a machine coding round, the first five are the answer and the rest are the improvement.",

  boxes: [
    { id: "caller", n: "Controller", r: "client",
      job: "Turns a request into a call on the service and a result into a response.",
      why: "It is on the diagram to mark the boundary. Everything to the right of it is testable without a network, which is the property the whole design is arranged around.",
      forced: "Nothing. It is drawn to show where the design starts.",
      alts: [["Putting logic in the controller", "the most common way an otherwise clean design rots, because a controller is the one class nobody unit tests."]],
      pros: ["Keeps transport concerns, status codes and serialisation out of the domain.", "The service can be exercised directly in tests with no HTTP anywhere."],
      cons: ["An extra layer that is genuinely thin, and someone will eventually ask why it exists."],
      cost: "One class, almost no code.",
      fails: "Validation drifts into it, then business rules follow, and a year later the rules exist in two places that disagree.",
      say: "The controller maps and delegates. If a method here has an if statement about the domain, it is in the wrong class." },

    { id: "bookingsvc", n: "BookingService", r: "svc",
      job: "Coordinate the sequence: find the show, lock the seats, price them, take payment, confirm the booking.",
      why: "Somebody has to own the order of operations. It is a coordinator specifically because owning the sequence and owning the data are different jobs, and the class that does both is the god class from stage 0.",
      forced: "Stage 0, and every stage after it took something away from it rather than adding.",
      alts: [["Putting the flow inside Booking itself", "an anaemic-model overcorrection: the entity now knows about payment gateways, which is a much worse coupling than the one you removed."], ["Splitting it into HoldService and ConfirmService", "reasonable in a large system, and here it separates two halves of a single sequence for no benefit."]],
      pros: ["One place to read the whole flow, which is what a reviewer wants.", "Owns no state, so it is trivially testable with fakes.", "Every dependency is an interface, so every collaborator can be substituted."],
      cons: ["It is the class that grows if nobody is watching, and it needs deliberate resistance.", "Five constructor dependencies is on the edge of comfortable."],
      cost: "One class, and a constructor that names every collaborator, which is itself useful documentation.",
      fails: "A sixth and seventh responsibility arrive, discounts and loyalty points, and it is stage 0 again. The defence is that each of those should be a strategy or a listener rather than a method.",
      say: "It owns the sequence and nothing else. If it starts owning data or making rules, something has been put in the wrong place." },

    { id: "show", n: "Show", r: "entity",
      job: "A film in a screen at a time, owning its seat map.",
      why: "It is the aggregate root. It is the object that owns the seats, so it is the natural unit of both consistency and locking, which is a decision worth making explicitly rather than by accident.",
      forced: "Stage 1.",
      alts: [["A Screen owning seats, with Show referencing it", "arguably more correct, since seats physically belong to the screen, and it makes the seat map shared across shows, so availability per show needs a separate structure. Worse in practice."], ["Subclasses such as PremiumShow", "inheritance for something that varies per seat rather than per show, so it is the wrong axis."]],
      pros: ["One owner for the seat map, so the locking unit is obvious.", "Physical layout and per show availability stay in one place.", "About two hundred seats, so a Show is one comfortable in memory object."],
      cons: ["Seat layout is duplicated across every show in the same screen, which is memory you could save and clarity you would lose."],
      cost: "One object per show with a couple of hundred seats inside it.",
      fails: "Someone adds a method that mutates the seat map without going through the lock provider. Keep the map private and expose intent, not the collection.",
      say: "Show is the aggregate root and therefore the unit of locking. Making that explicit early is what stops the concurrency question being hand waved later." },

    { id: "seat", n: "Seat", r: "entity",
      job: "One physical position: row, number, type, and whether it is currently available.",
      why: "It is the thing an invariant can live on. Without it, availability is a boolean in a collection somewhere and nothing can enforce a rule about it.",
      forced: "Stage 1.",
      alts: [["An enum or a string identifier", "fine until a seat needs a type and a price band and a status, at which case you have parallel maps keyed by string, which is a class that has not been written yet."], ["A subclass per seat type", "recliner and regular differ by data and by price rule, not by behaviour, so a type field plus a pricing strategy is simpler and easier to configure."]],
      pros: ["Type lives on the seat, so pricing can ask rather than being told.", "Equality by (show, row, number) makes it safe to use in sets and as a lock key."],
      cons: ["Whether Seat holds its own status or the show holds a status map is a real fork in the design, and mixing the two is how state gets out of sync."],
      cost: "A small immutable-ish object, a couple of hundred per show.",
      fails: "Both Seat.status and a map in Show exist, and they diverge. Pick one owner. I would keep status on the seat and have the show expose queries over it.",
      say: "Value-like, equal by position, with the type on it so pricing never has to be told what kind of seat it is looking at." },

    { id: "lock", n: "SeatLockProvider", r: "svc",
      job: "Claim a set of seats for one user with an expiry, atomically, or claim none of them.",
      why: "This is the answer to the only hard question in the problem. It exists as its own type so that the answer to what do you synchronise is a class you can point at rather than a keyword scattered through the code.",
      forced: "Stage 2.",
      alts: [["synchronized on the BookingService", "correct, and it serialises every show in every cinema through one monitor, which is a genuinely bad answer that looks like a good one."], ["A lock per seat", "the finest granularity and the most concurrency, and it introduces deadlock the moment one booking wants seats A and B while another wants B and A. Solvable by always locking in sorted order, and worth mentioning that you know both the problem and the fix."], ["Optimistic, compare and swap on the seat status", "no locks at all and it works nicely for a single seat, and all-or-nothing over several seats then needs a rollback path you have written yourself."], ["Leaving it to the database", "the right answer in production and the wrong answer in an LLD round, where the object model is the thing being examined."]],
      pros: ["Lock per show is the sweet spot: shows are independent, so there is no cross show contention, and within a show contention is tens of threads for milliseconds.", "Expiry lives with the lock, so an abandoned checkout needs no cleanup elsewhere.", "It is a small class with one synchronized block, which is easy to review and easy to test."],
      cons: ["Expiry needs either a timestamp checked on read or a sweeper. The timestamp is simpler and means an expired lock is reclaimed by whoever asks next.", "In memory, so it is single process. Distributing it means Redis, which is the HLD version of the same box."],
      cost: "One map per show, a handful of entries at a time.",
      fails: "Someone holds the lock across the payment call, and one slow card locks the hall for eight minutes. Lock, claim, release the monitor, then pay. The claim has an expiry precisely so the monitor does not have to be held.",
      say: "One lock per show, seats sorted before acquiring, and the monitor released before any external call. If it needs to work across processes, the same interface goes to Redis with a TTL, and nothing above it changes." },

    { id: "booking", n: "Booking", r: "entity",
      job: "A user, a show, a set of seats, an amount, and a status that can only move in legal directions.",
      why: "It is the record of the sale, and it is where the state machine lives. A status field with a public setter is an invitation to write cancelled and then confirmed.",
      forced: "Stage 1 for the class, stage 4 for the state machine.",
      alts: [["A status field with a setter", "what most first drafts have, and it makes every illegal transition reachable from anywhere in the codebase."], ["The State pattern, one class per status", "the textbook answer, and for four statuses with simple transitions it is more classes than the problem has behaviour. Worth naming as where you would go if statuses grew."]],
      pros: ["Transitions as methods that throw make illegal states unreachable, which is stronger than any test.", "It is the natural place to put the total, computed once at hold time so the price cannot move under the user."],
      cons: ["Enum plus guards is less extensible than the State pattern, and you should say that you know the trade-off rather than let it be pointed out."],
      cost: "One object per sale.",
      fails: "Two threads confirm the same booking. Make the transition itself atomic, a compare and set on the status, so the second one gets an exception rather than a second charge.",
      say: "No setter on status. confirm() and cancel() throw on an illegal transition, so the object cannot be put into a state the business does not have." },

    { id: "pricing", n: "PricingStrategy", r: "iface",
      job: "Given a show and a seat, return an amount.",
      why: "Pricing is the thing that varies for business reasons, changes most often, and has nothing to do with selling. That combination is the definition of a strategy worth extracting.",
      forced: "Stage 3.",
      alts: [["An if-else chain in the service", "one class fewer and every price change edits the class that sells tickets, which is the highest risk file in the codebase."], ["A price field on Seat", "works until price depends on the day or the show rather than the seat, which it does immediately."], ["A rules engine", "the answer if pricing is configured by non engineers, and enormous overkill for an interview."]],
      pros: ["A new rule is a new class and no edit to existing code.", "Rules compose: a list of strategies applied in order gives base fare plus surcharges without any new abstraction.", "Each rule is testable in isolation, which pricing badly needs."],
      cons: ["Order of composition matters and is invisible in the type system, so a percentage applied before or after a flat surcharge gives different answers.", "Small classes proliferate, which is only a problem if the rules are trivial."],
      cost: "One interface, one class per rule, one composite.",
      fails: "Two rules both apply a percentage and the result depends on registration order. Make the composite's order explicit and tested, and prefer rules that return a delta over rules that return a total.",
      say: "One method, price(show, seat). A composite runs them in a defined order. This is the one pattern I would introduce unprompted, because the requirement literally says prices vary by row and day." },

    { id: "pricingimpl", n: "The concrete price rules", r: "impl",
      job: "Base fare, weekend surcharge, recliner premium, matinee discount.",
      why: "They are here to show that the strategy has more than one implementation, which is the only thing that makes an interface worth having.",
      forced: "Stage 3.",
      alts: [["One class with a switch on rule type", "the interface deleted and reimplemented badly."]],
      pros: ["Each rule is a few lines and one test.", "Configuration decides which rules apply to which show, so a promotion is a data change."],
      cons: ["A rule that needs to see the whole booking rather than one seat, such as buy three get one free, does not fit this interface and needs a second one at the booking level."],
      cost: "A handful of tiny classes.",
      fails: "A rule needs the total rather than the seat, and somebody widens the interface to take a Booking. Add a separate BookingDiscount abstraction instead of making the seat rule carry a parameter it does not use.",
      say: "Per seat rules and per booking rules are two different abstractions. Noticing that before writing the code is worth more than the pattern itself." },

    { id: "payment", n: "PaymentProcessor", r: "iface",
      job: "Charge an amount for a booking, and say whether it worked.",
      why: "It exists so that the booking flow can be tested without the internet, and so that a provider can be swapped without touching sales code. Those are two different justifications and both are enough on their own.",
      forced: "Stage 4.",
      alts: [["Calling the gateway SDK directly", "fewer types, and the core flow now cannot be tested and cannot change provider."], ["A full adapter layer with request and response models", "the right thing in production, and more machinery than a forty five minute round needs. Name it and move on."]],
      pros: ["A fake implementation makes the whole flow testable, including the failure branch, which is the branch that matters.", "Provider specifics stay in one class."],
      cons: ["The interface has to be general enough for several providers and specific enough to be useful, and getting that wrong shows up late."],
      cost: "One interface, one real implementation, one fake.",
      fails: "The interface leaks provider concepts, a Stripe token in the signature, and the second provider does not fit. Keep the interface in your own vocabulary: amount, currency, booking reference, result.",
      say: "The fake implementation is the point. If I cannot test the payment-declined path without a network, the design is not finished." },

    { id: "paymentimpl", n: "Gateway adapter and fake", r: "impl",
      job: "One class that talks to a real provider, one that returns whatever a test asks it to.",
      why: "Two implementations is the minimum that proves the abstraction is real. One implementation of an interface is usually a class with extra steps.",
      forced: "Stage 4.",
      alts: [["Mocking the interface in each test instead of a shared fake", "fine, and it spreads the same setup across every test file. A fake with a scripted outcome is usually less code."]],
      pros: ["Retries, timeouts and idempotency keys live in the adapter, not in the service.", "The fake makes the declined and timeout paths ordinary tests rather than heroics."],
      cons: ["The fake can drift from the real behaviour, which is how a well tested system meets a surprise in production."],
      cost: "Two small classes.",
      fails: "The fake always succeeds, so nobody ever tests the declined path, and it is discovered on launch day.",
      say: "Idempotency key equal to the booking id, set inside the adapter. The service should not know that retrying is even possible." },

    { id: "notifier", n: "BookingListener", r: "iface",
      job: "Be told that a booking was confirmed or cancelled, and do something about it.",
      why: "Consequences multiply. Email, the cinema's screen, an audit record, analytics. Each one added to the confirm method is another reason to edit the most dangerous method in the system.",
      forced: "Stage 5.",
      alts: [["Calling each consequence directly from confirm", "explicit and readable, and it grows by one line per feature forever, and a failure in any of them fails the sale."], ["An in process event bus", "the same idea with more indirection, useful when publishers and subscribers are in different modules."]],
      pros: ["Adding a consequence is a new class and a registration.", "Listeners can fail independently, if you catch per listener, so a broken email does not cancel a sale.", "It is the LLD shadow of the outbox in the HLD design, and saying that connection out loud is worth marks."],
      cons: ["Control flow becomes indirect, and a reader can no longer see everything that happens on confirm by reading confirm.", "Ordering between listeners is undefined unless you define it, and somebody will depend on it accidentally."],
      cost: "One interface, one list, one loop.",
      fails: "A listener throws and takes the transaction with it. Catch and log per listener. A confirmed sale must not be undone by a failed email.",
      say: "Catch per listener. The sale already happened; nothing a listener does should be able to unmake it." },

    { id: "bookingrepo", n: "BookingRepository", r: "store",
      job: "Save and find bookings, without the service knowing how.",
      why: "So that the whole design can be built and tested against a map, and pointed at a database later with no change above it.",
      forced: "Stage 5.",
      alts: [["Calling the database from the service", "fewer types, and now the service cannot be tested without one, and SQL is sitting in the middle of the business flow."], ["Active record, where Booking saves itself", "less code and it couples the entity to the storage, which is the coupling this interface exists to prevent."]],
      pros: ["An in memory implementation makes the whole design runnable in an interview, which is exactly what a machine coding round rewards.", "It keeps queries in one place, where they can be reviewed."],
      cons: ["It can become a pass-through with thirty find methods, at which point the abstraction has stopped paying for itself."],
      cost: "One interface, one map based implementation.",
      fails: "Query methods multiply until the interface is the database with different names. Keep it to the queries the domain actually asks for.",
      say: "Interface first, map implementation for the interview, database implementation later. It also means I can demonstrate the whole flow running without any infrastructure, which is what the round is asking me to do." }
  ],

  patternsIntro: "Three patterns earn their place and several well known ones do not. In an interview, introducing a pattern without naming the thing that varies is the fastest way to look like you are reciting. Name what varies, and the pattern is obvious and defensible.",

  patterns: [
    { n: "Strategy, for pricing", used: true,
      what: "One interface, several interchangeable price rules, chosen and composed at configuration time.",
      varies: "The price rule. It changes for business reasons, often, and independently of anything technical.",
      without: "An if-else chain inside the class that sells tickets, edited every time marketing has an idea.",
      cost: "One interface and a small class per rule. Composition order becomes a thing you have to define and test." },
    { n: "State machine on Booking", used: true,
      what: "Transitions as methods that refuse illegal moves, rather than a status field with a setter.",
      varies: "Nothing varies. This is not about extension, it is about making a wrong state unreachable.",
      without: "Any code anywhere can set a cancelled booking back to confirmed, and the bug appears months later in a refund report.",
      cost: "Slightly more code than a field. The full State pattern, one class per state, is the next step if statuses grow past a handful." },
    { n: "Observer, for consequences", used: true,
      what: "Listeners registered on the service, notified after a booking is confirmed or cancelled.",
      varies: "The set of things that care. Email today, the cinema's screen tomorrow, analytics after that.",
      without: "The confirm method grows a line per feature and a failure in any of them can fail a sale.",
      cost: "Indirect control flow, and per listener error handling that you must actually write." },
    { n: "Factory, for creating bookings", used: false,
      what: "A factory that decides which kind of Booking to build.",
      varies: "Nothing. There is one kind of Booking, and construction is a constructor call with no branching in it.",
      without: "You call new. This is fine, and it is what the code should say.",
      cost: "A class that adds a level of indirection and answers a question nobody asked. Add it if seat types ever require genuinely different Booking subclasses, which they do not here." },
    { n: "Singleton, for the lock provider", used: false,
      what: "One global instance of SeatLockProvider, reachable from anywhere.",
      varies: "Nothing, and that is exactly the problem: a singleton is global mutable state with a pattern name attached.",
      without: "Construct one and inject it. It is the same single instance, and now it can be replaced in a test.",
      cost: "Untestable, hostile to parallel tests, and it hides a dependency that the constructor should have declared. Say this if an interviewer suggests it; it is a common and deliberate trap." },
    { n: "Decorator, for surcharges", used: false,
      what: "Wrapping a pricing strategy in another strategy that adds a surcharge.",
      varies: "The same thing Strategy already handles here.",
      without: "A composite that runs a list of strategies, which is simpler to read and to configure.",
      cost: "Nothing wrong with it, and it buys nothing over the composite in this problem. Worth naming as an equivalent alternative rather than presenting as an improvement." }
  ],

  flowsIntro: "Two traces, and the second is the one that gets asked. Walking a concurrent path out loud, naming exactly where the monitor is taken and released, is the single highest value thing you can do in an LLD round.",

  flows: [
    { n: "The happy path",
      steps: [
        ["The controller calls <code>bookingService.hold(showId, seatIds, userId)</code>.", "sync"],
        ["The service loads the Show, and sorts the seat ids. Sorting is not cosmetic: it is what makes deadlock impossible if the lock granularity ever becomes per seat.", "sync"],
        ["Inside one synchronized block on that show, the lock provider checks that every seat is free or has an expired lock, and claims all of them with an expiry. All or nothing.", "sync"],
        ["The monitor is released. Nothing external has been called while holding it, which is the rule that keeps a slow payment from freezing a hall.", "sync"],
        ["The pricing strategy is applied per seat and the total is stored on the Booking, so the price cannot move under the user while they pay.", "sync"],
        ["The payment processor is called. This is seconds, and no lock is held for any of it.", "sync"],
        ["<code>booking.confirm()</code> moves the state machine, the seats are marked sold, the locks are released, and the repository saves it.", "sync"],
        ["Listeners are notified, each inside its own try and catch, because the sale is already final.", "async"]
      ] },
    { n: "Two threads, one seat",
      note: "Say this out loud, slowly, in an interview. It is the answer being marked.",
      steps: [
        ["Thread A and thread B both call hold for seat J12 of the same show, microseconds apart.", "sync"],
        ["Both reach the synchronized block on that show's lock object. One enters, the other waits. This is the moment the design either works or does not.", "sync"],
        ["A sees J12 free, records a lock for A with an expiry, and leaves the block.", "sync"],
        ["B enters, sees a live lock held by A, and takes nothing. It returns a failure naming which seats went, so the user can pick again rather than see an error.", "sync"],
        ["If A abandons, the lock expires. The next caller sees an expired lock and reclaims it. No sweeper thread is needed for correctness.", "async"],
        ["If A pays, confirm marks the seats sold and drops the locks. B's retry now sees them sold, which is a different message and the same outcome.", "sync"]
      ] }
  ],

  api: [
    ["hold(showId, seatIds, userId)", "HoldResult", "All or nothing. On failure it names which seats were taken, because a list is actionable and a boolean is not."],
    ["confirm(holdId, paymentToken)", "Booking", "Prices, charges, transitions the state machine, saves, notifies. The only method that takes money."],
    ["release(holdId)", "void", "Explicit cancel. Idempotent, because a user pressing back twice is not an error condition."],
    ["seatMap(showId)", "List of SeatView", "Read only. Returns status and price per seat, so the caller never assembles the two from separate calls."],
    ["cancel(bookingId)", "Booking", "Transitions to cancelled, returns seats to the pool, and notifies. The refund itself is a listener."]
  ],
  apiNote: "Two habits worth showing here: a failure that names the seats rather than returning false, and idempotent release, because the caller is a browser and browsers press buttons twice.",

  schema: { n: "The block that is being marked", lang: "java",
    note: "Everything else in this design is judgement. This is the part that is right or wrong, and it is about fifteen lines.",
    code:
"class SeatLockProvider {\n" +
"    private final Map<String, Object> monitors = new ConcurrentHashMap<>();\n" +
"    private final Map<SeatKey, Lock> locks = new ConcurrentHashMap<>();\n" +
"    private final Duration ttl;\n" +
"    private final Clock clock;              // injected, so expiry is testable\n" +
"\n" +
"    // one monitor per show. shows are independent, so they never contend.\n" +
"    private Object monitorFor(String showId) {\n" +
"        return monitors.computeIfAbsent(showId, k -> new Object());\n" +
"    }\n" +
"\n" +
"    void lock(String showId, List<String> seats, String userId) {\n" +
"        List<String> ordered = seats.stream().sorted().toList();\n" +
"        synchronized (monitorFor(showId)) {          // the whole answer\n" +
"            for (String s : ordered)                 // check every seat...\n" +
"                if (isLockedByAnother(showId, s, userId))\n" +
"                    throw new SeatUnavailable(showId, s);\n" +
"            Instant until = clock.instant().plus(ttl);\n" +
"            for (String s : ordered)                 // ...then claim them all\n" +
"                locks.put(new SeatKey(showId, s), new Lock(userId, until));\n" +
"        }\n" +
"        // monitor released here. payment happens outside it, always.\n" +
"    }\n" +
"\n" +
"    private boolean isLockedByAnother(String show, String seat, String user) {\n" +
"        Lock l = locks.get(new SeatKey(show, seat));\n" +
"        if (l == null) return false;\n" +
"        if (l.expiry().isBefore(clock.instant())) return false;  // expired,\n" +
"        return !l.userId().equals(user);                         // so reusable\n" +
"    }\n" +
"}" },

  deep: [
    { n: "Why the lock is per show, and what the other choices cost",
      note: "There are four granularities and each is defensible in a different world. <b>Global</b>: one lock for the whole service. Correct, and every cinema in the country now queues behind every other, which is a scalability answer of no. <b>Per show</b>: what this design uses. Shows never interact, so there is zero cross show contention, and within a show a couple of hundred seats and tens of concurrent users means the critical section is microseconds. <b>Per seat</b>: maximum concurrency, and two bookings wanting seats A and B in opposite orders will deadlock, which is why the seat list is sorted before acquiring. Worth mentioning that you know the fix even though you did not need it. <b>Lock free</b>: a compare and swap per seat status, which is elegant for one seat and needs a hand written rollback for all-or-nothing over several.<br><br>The reasoning to say out loud is that the right granularity is the aggregate that owns the invariant. The invariant here is one booking per seat within a show, the Show owns the seat map, so the Show is the lock. That sentence generalises to every LLD problem with concurrency in it." },

    { n: "Never hold a lock across an external call",
      note: "This is the single most common LLD mistake and it survives code review because it looks harmless. Payment takes two seconds. If it happens inside the synchronized block, one user's slow card blocks every other booking for that show for two seconds, and if the gateway hangs for thirty, the hall is frozen for thirty.<br><br>The fix is the expiry. Because a lock carries a deadline, the claim can be released from the monitor immediately after being recorded: the seat is still reserved, but no thread is blocked. The monitor protects the check and the claim, which is microseconds, and the eight minute reservation is data rather than a held lock.<br><br>Stated as a rule: <b>a monitor protects a decision, not a duration.</b> If something needs to be reserved for minutes, that is a record with a timestamp, not a thread holding a lock." },

    { n: "Making illegal states unrepresentable",
      note: "A status field with a setter means every transition in the state graph exists, including the ones the business does not have. Cancelled to confirmed. Expired to confirmed. Confirmed to held. Every one of those is a bug waiting for the right sequence of calls, and no amount of testing enumerates them all.<br><br>Replacing the setter with confirm() and cancel(), each of which throws unless the current state permits it, deletes the whole class of bug at the type level rather than the test level. It costs about ten lines.<br><br>The next step, if statuses grow past four or five, is the State pattern: one class per state, each implementing the same interface and returning the next state. It removes the switch entirely and is worth naming as where you would go. For four statuses it is more classes than behaviour, and saying <i>I know it, and it is not worth it here</i> is a stronger answer than using it.",
      code:
"enum Status { HELD, CONFIRMED, CANCELLED, EXPIRED }\n" +
"\n" +
"class Booking {\n" +
"    private Status status = HELD;\n" +
"\n" +
"    synchronized void confirm() {\n" +
"        if (status != HELD)                       // no setter exists,\n" +
"            throw new IllegalTransition(status);  // so this is the only door\n" +
"        status = CONFIRMED;\n" +
"    }\n" +
"\n" +
"    synchronized void cancel() {\n" +
"        if (status != HELD && status != CONFIRMED)\n" +
"            throw new IllegalTransition(status);\n" +
"        status = CANCELLED;\n" +
"    }\n" +
"}",
      lang: "java" },

    { n: "How this class design becomes the HLD one",
      note: "Every box on the ticket booking HLD page has a class on this page, and pointing that out is a genuinely strong move in either round. <b>SeatLockProvider</b> becomes Redis with a TTL, and the interface above it does not change. <b>The synchronized block</b> becomes a conditional UPDATE with the precondition in the WHERE clause: same idea, the check inside the write, moved to whichever component is the arbiter. <b>BookingListener</b> becomes the outbox and a stream of consumers. <b>PaymentProcessor</b> becomes the same interface with retries and idempotency keys, over a network.<br><br>The reason this matters is that it shows the two rounds are not different subjects. They are the same reasoning at two magnifications: find the thing that must be atomic, make it as small as possible, and push everything else outside it." }
  ],

  tradeoffsIntro: "LLD trade-offs are smaller than HLD ones and are marked just as carefully, because they show whether you have opinions or habits.",

  tradeoffs: [
    { a: ["Lock per show", "No cross show contention, microsecond critical sections, and no deadlock possible with one lock."],
      b: ["Lock per seat", "Maximum concurrency, and deadlock the moment two bookings want the same pair of seats in different orders."],
      pick: "a",
      flip: "a single show has thousands of seats and dozens of concurrent bookers, for example a stadium. Then go per seat and sort the seat list before acquiring, every time, without exception." },
    { a: ["Composition, Show has Seats", "Seat type varies per seat, so a field plus a pricing strategy covers it with no class explosion."],
      b: ["Inheritance, PremiumSeat extends Seat", "Type safety per seat kind, and the difference is data and price, not behaviour, so the hierarchy earns nothing."],
      pick: "a",
      flip: "seat kinds genuinely behave differently, for example a wheelchair space that changes how adjacency is computed. Behaviour is the test for inheritance, never data." },
    { a: ["Enum plus guarded transitions", "Ten lines, no new classes, illegal transitions throw."],
      b: ["The State pattern, one class per state", "Adding a state touches nothing existing, and it is four classes for four statuses with almost no behaviour."],
      pick: "a",
      flip: "the status count grows past five, or states start carrying different behaviour rather than just different legality. Then the switch statements are the smell and State is the fix." },
    { a: ["Listeners for consequences", "Adding an effect is a new class. Failures are isolated per listener."],
      b: ["Direct calls inside confirm()", "You can read confirm and see everything that happens, which is genuinely valuable."],
      pick: "a",
      flip: "there are only two consequences and there will only ever be two. Observer for a fixed pair of calls is indirection with no payoff, and readability is worth more." }
  ],

  next: [
    "<b>Seat suggestion.</b> Best available adjacent block is a bin packing problem, and it belongs outside the lock, at suggestion time rather than claim time.",
    "<b>Per booking discounts.</b> Buy three get one free does not fit the per seat pricing interface, and it needs a second abstraction rather than a wider one.",
    "<b>Distributed locks.</b> Same interface, Redis behind it with a TTL, and a conversation about what happens when the lock service is unreachable.",
    "<b>Auditability.</b> An append only log of every state transition, which makes disputes answerable and is a listener rather than a change to the flow."
  ],

  p: [
    ["GFG", "https://www.geeksforgeeks.org/system-design/design-bookmyshow-a-system-design-interview-question/", "GFG, BookMyShow design", "H"],
    ["EDU", "https://www.educative.io/courses/grokking-the-low-level-design-interview-using-ood-principles", "Grokking the LLD interview", "M"],
    ["HI", "https://www.hellointerview.com/learn/low-level-design/in-a-hurry/patterns", "Hello Interview, when to use which pattern", "M"],
    ["GFG", "https://www.geeksforgeeks.org/system-design/low-level-design-problems/", "GFG, LLD problem list", "M"],
    ["LIST", "https://leetcode.com/problem-list/design/", "LeetCode Design problems", "M"]
  ],

  hi: {
    one: "Yeh wahi product hai jo ticket booking page pe tha, bas ek box aur andar. Yahaan kuch bhi distributed nahi hai: poora sawaal yeh hai ki seat map kaunsa object own karega, exactly kya synchronise karna hai, aur pricing aur payment ko us class mein leak hone se kaise rokna hai jo tickets bechti hai.",

    brief: {
      why: "LLD round HLD round se ek chhota sawaal poochta hai: yeh nahi ki kya yeh das lakh logon ko serve kar sakta hai, balki yeh ki kya main chhe mahine baad ise maintain karna chahunga. Do cheezein score hoti hain: tumhare objects wahi nouns hain ya nahi jo domain expert use karega, aur jo ek genuinely concurrent operation hai woh kisi aisi cheez se protected hai jise tum ungli rakh ke dikha sako. Patterns teesri cheez hain, aur sirf tab jab woh koi asli coupling hatate hain. Paanch pattern ke naam gina do to marks kam hote hain, badhte nahi.",
      functional: [
        "Ek show ka <b>seat map dikhao</b>, har seat ka status aur price ke saath.",
        "Kuch minute ke liye <b>seats hold karo</b> taaki user pay kar sake, aur agar woh na kare to apne aap release ho jaayein.",
        "Payment ke baad <b>booking confirm karo</b>, ya hold release karo. Concurrency mein bhi ek seat pe exactly ek booking.",
        "Row, din aur show ke hisaab se <b>seat ka price nikalo</b>, bina booking code ko yeh rules jaane.",
        "<b>Cancel karo</b>, aur seats wapas pool mein daal do."
      ],
      out: ["HTTP layer", "repository interface ke aage ka persistence", "user accounts aur auth", "cinema ki apni scheduling", "price hook ke aage discount coupons"],
      nfr: [
        ["Thread safety", "per show, not global", "Ek hi show ke liye kayi threads ek saath seats hold karenge. Ek global lock correct hai, par poori cinema chain ko ek hi queue bana deta hai, aur interviewer yeh notice kar lega."],
        ["No double booking", "absolute", "Ek hi correctness requirement jo sabse upar hai. Class design mein baaki sab negotiable hai."],
        ["Extensibility", "new price rule, no change to booking", "Yeh us ek pattern ki stated wajah hai jo yahaan definitely apni jagah kamata hai."],
        ["Testability", "no real payment, no real clock", "Payment ek interface ke peeche, aur expiry ek injectable clock se chalti hai. Warna expiry test karne ka ek hi tareeka hai ki aath minute intezaar karo."]
      ],
      numbers: [
        ["Seats per show", "about 200", "Itna chhota ki ek show ka seat map memory mein ek hi object ban jaata hai, aur poori locking strategy isi baat pe tiki hai."],
        ["Concurrent holders per show", "tens", "Hazaaron nahi. Contention per show hai aur chhota chalta hai, isliye ek simple lock per show genuinely kaafi hai."],
        ["Hold duration", "8 minutes", "Itna lamba ki pay kar sako, itna chhota ki koi hoarder poora hall lock na kar sake."],
        ["Seats per booking", "1 to 10", "Isi liye claim all or nothing hona chahiye, aur isi liye lock ordering matter karti hai."]
      ],
      numbersNote: "Design ka faisla karne wala number hai <b>200 seats per show</b>. Ek show ka seat map ek object mein fit ho jaata hai, isliye locking ki unit show hai. Agar show mein das lakh seats hoti to jawab per seat locks hota, aur code kaafi kharab hota."
    },

    stagesIntro: "Chhe stages, aur shape wahi hai jo HLD page ka tha: woh class se shuru karo jo sab pehle likhte hain, use todo, aur har naya type isliye aaye kyunki kuch specific galat hua. Machine coding round mein tum stage 2 pehle likhoge aur time bache to baaki add karoge, isliye yahaan ka order priority order bhi hai.",

    stages: [
      { pressure: "Abhi kuch nahi. Pehle draft aisa hi dikhta hai, aur ise draw karna worth hai, kyunki isme jo do cheezein galat hain wahi do cheezein baaki poora design theek karta hai.",
        say: "Ek class jisme show id se booked seats ke set ka map hai, pricing rules ek if-else chain mein hain, aur payment call inline hai. Yeh compile hoti hai, single threaded test pass karti hai, aur isme is problem ke dono classic defects hain: do threads dono ek seat ko free dekh sakte hain, aur ek price rule add karne ka matlab us class ko edit karna hai jo tickets bechti hai.",
        breaks: "Koi domain objects nahi hain, isliye har method strings leta hai aur strings lautata hai, aur kisi invariant ke rehne ki koi jagah nahi hai. Ek Seat jo yeh nahi bata sakti ki woh available hai ya nahi, model nahi hai, woh bas ek row hai jisne bhes badal rakha hai." },

      { pressure: "Jis invariant ka koi object owner nahi hai, use protect nahi kar sakte. Kisi bhi locking se pehle, design ko ek aisi cheez chahiye jo jaanti ho ki seat kya hai, aur ek aisi cheez jo seat map own kare.",
        say: "Problem statement ke nouns classes ban jaate hain: Show, Seat, Booking. Inheritance ki jagah composition, yaani Show ke paas Seats hain, PremiumShow jo Show ko extend kare aisa nahi, kyunki seat type per seat badalta hai, per show nahi. Booking ko ek id milti hai aur seats ki list. Dhyan do ki service ab kya hai: ek coordinator jo koi data own nahi karta, aur ek service se tum yahi chahte ho.",
        breaks: "Do threads ek hi Show pe ek hi moment mein book call karte hain. Dono seat ko available padhte hain, dono use taken mark karte hain, aur design utna hi toota hai jitna stage 0 mein tha, bas ab naamon ke saath behtar." },

      { pressure: "Ek hi hard requirement. LLD interview mein yahi wo moment hai jo score hota hai, aur galat jawab pehchaane jaa sakte hain: har method pe synchronized laga dena, ya kandhe uchka ke keh dena ki database sambhaal lega.",
        say: "Ek SeatLockProvider, per show yeh rakhta hai ki kaunsi seats claim hui hain, kisne ki, aur kab tak ke liye. Acquire karna us show ke lock object pe ek single synchronized block hai, aur uske andar ya to maangi gayi saari seats free hoti hain ya koi bhi nahi li jaati. Lock show pe hai, na service pe na seat pe: service pe lagane se poori cinema chain serialise ho jaati hai, aur seat pe lagane se deadlock ka darwaza khulta hai jab do bookings wahi do seats ulte order mein maangti hain. Main acquire karne se pehle seat list ko sort bhi karunga, jo us deadlock ko poori tarah hata deta hai.",
        breaks: "Pricing abhi bhi booking code ke andar ek if-else chain hai. Har naya rule, weekend surcharge, recliner premium, matinee discount, us class ko edit karta hai jo tickets bechti hai, aur har edit tickets bechna todne ka ek mauka hai." },

      { pressure: "Pattern introduce karne layak hai ya nahi, iska ek hi bharosemand test: naam lo ki kya badalta hai. Yahaan woh price rule hai, woh business wajahon se badalta hai, technical wajahon se nahi, aur baar baar badalta hai.",
        say: "Ek interface, ek method: ek show ke liye ek seat ka price nikalo aur amount lautao. Base fare, weekend surcharge aur recliner premium ke liye implementations, aur ek composite jo unki list ko order mein chalata hai. Rule add karna ab ek nayi class aur configuration ki ek line hai, aur booking code kabhi nahi badalta. Yahi open-closed principle hai, jo tum quote karne ki jagah actually dikha sakte ho.",
        breaks: "Payment ek real gateway ko concrete call hai, isliye booking flow bina internet ke test nahi ho sakta, aur provider badalne ka matlab phir se sales code ko edit karna hai." },

      { pressure: "Core flow ke andar ek external dependency, aur ek booking jiska status field koi bhi kuch bhi set kar sakta hai.",
        say: "PaymentProcessor ek interface hai jiski tests ke liye fake implementation hai, aur wahi iske hone ki poori wajah hai. Aur Booking se public status setter hat jaata hai: use confirm aur cancel methods milte hain jo tab throw karte hain jab current state us transition ko allow nahi karti. Held se confirmed ya expired, confirmed se cancelled, aur usse aage kuch bhi reachable nahi. Illegal states ko unrepresentable bana dena, is page ke kisi bhi pattern se zyada value ka hai.",
        breaks: "Confirmation email bhejna, cinema ki screen update karna aur audit record likhna, teeno confirm method mein baithe hain, aur har naya ek aur baar use edit karta hai. Saath hi service abhi bhi data memory mein rakhti hai, isliye restart ke baad kuch bachta nahi." },

      { pressure: "Do alag tarah ke leaks. Jo cheezein kisi booking ke baare mein jaanna chahti hain woh us code ke andar nahi rehni chahiye jo booking banata hai, aur Booking kahan store hoti hai woh BookingService ka kaam nahi hai.",
        say: "Ek BookingListener interface jisme register method hai, aur har consequence ek listener ban jaata hai: email, cinema ki screen, audit log. Naya add karna ab ek nayi class hai, edit nahi. Aur ek BookingRepository interface, jo interview ke liye ek map se implement hota hai aur baad mein database se, taaki service kabhi table ka naam na le. Asli round mein main yeh dono sabse baad mein likhunga, aur zor se bolunga ki main inhe extensibility ke liye add kar raha hoon, isliye nahi ki requirements ne maanga, kyunki jo extension points kisi ne maange hi nahi unhe invent karna khud ek failure mode hai." }
    ],

    boxesIntro: "Barah types. Chaar entities hain jo state own karti hain, teen interfaces hain jo kisi cheez ko bahar rakhne ke liye hain, aur baaki unke peeche ki implementations. Machine coding round mein time kam ho to pehle paanch hi jawab hain, baaki improvement hai.",

    boxes: [
      { job: "Request ko service pe ek call mein badalta hai, aur result ko response mein.",
        why: "Yeh diagram pe boundary dikhane ke liye hai. Iske daayin taraf sab kuch bina network ke testable hai, aur poora design isi property ke around arrange kiya gaya hai.",
        forced: "Kuch nahi. Yeh isliye draw hua hai ki dikhe design kahan se shuru hota hai.",
        alts: [["Putting logic in the controller", "ek saaf design ke sadne ka sabse common tareeka, kyunki controller wahi ek class hai jiska koi unit test nahi likhta."]],
        pros: ["Transport concerns, status codes aur serialisation ko domain se bahar rakhta hai.", "Service ko tests mein seedha chalaya ja sakta hai, kahin HTTP ke bina."],
        cons: ["Ek extra layer jo sach mein patli hai, aur kabhi na kabhi koi poochega ki yeh hai kyun."],
        cost: "Ek class, lagbhag koi code nahi.",
        fails: "Validation isme khisakti hai, phir business rules uske peeche, aur ek saal baad rules do jagah hain jo ek doosre se alag baat kehte hain.",
        say: "Controller map karta hai aur delegate karta hai. Agar yahaan kisi method mein domain ke baare mein if statement hai, to woh galat class mein hai." },

      { job: "Sequence coordinate karo: show dhoondho, seats lock karo, price nikalo, payment lo, booking confirm karo.",
        why: "Operations ka order kisi ko to own karna hai. Yeh coordinator isliye hai kyunki sequence own karna aur data own karna alag kaam hain, aur jo class dono karti hai wahi stage 0 ki god class hai.",
        forced: "Stage 0, aur uske baad har stage ne isse kuch jodne ki jagah kuch cheen liya.",
        alts: [["Putting the flow inside Booking itself", "anaemic-model ka overcorrection: ab entity payment gateways ke baare mein jaanti hai, jo us coupling se kaafi buri hai jo tumne hataai thi."], ["Splitting it into HoldService and ConfirmService", "bade system mein reasonable hai, aur yahaan ek hi sequence ke do hisse bina kisi faide ke alag kar deta hai."]],
        pros: ["Poora flow padhne ke liye ek jagah, jo reviewer chahta hai.", "Koi state own nahi karta, isliye fakes ke saath trivially testable hai.", "Har dependency ek interface hai, isliye har collaborator badla ja sakta hai."],
        cons: ["Yeh wahi class hai jo chupke se badhti rehti hai agar koi dekh na raha ho, aur ise jaan boojh ke rokna padta hai.", "Paanch constructor dependencies comfortable ki edge pe hai."],
        cost: "Ek class, aur ek constructor jo har collaborator ka naam leta hai, jo khud ek useful documentation hai.",
        fails: "Chhathi aur saatvi responsibility aa jaati hain, discounts aur loyalty points, aur phir se stage 0. Bachaav yeh hai ki inme se har ek ko method ki jagah strategy ya listener hona chahiye.",
        say: "Yeh sequence own karta hai aur kuch nahi. Agar yeh data own karne ya rules banane lage, to kuch galat jagah rakha gaya hai." },

      { job: "Ek screen mein, ek time pe ek film, jo apna seat map own karti hai.",
        why: "Yeh aggregate root hai. Yeh wo object hai jo seats own karta hai, isliye yeh consistency aur locking dono ki natural unit hai, aur yeh aisa faisla hai jo galti se nahi, jaan boojh ke lena chahiye.",
        forced: "Stage 1.",
        alts: [["A Screen owning seats, with Show referencing it", "arguably zyada correct, kyunki seats physically screen ki hoti hain, aur isse seat map shows ke beech shared ho jaata hai, isliye per show availability ke liye alag structure chahiye. Practice mein worse."], ["Subclasses such as PremiumShow", "inheritance ek aisi cheez ke liye jo per seat badalti hai, per show nahi, isliye galat axis hai."]],
        pros: ["Seat map ka ek owner, isliye locking unit saaf hai.", "Physical layout aur per show availability ek hi jagah rehte hain.", "Lagbhag do sau seats, isliye Show ek comfortable in memory object hai."],
        cons: ["Ek hi screen ke har show mein seat layout duplicate hota hai, jo memory hai jo bacha sakte the aur clarity hai jo kho dete."],
        cost: "Har show ke liye ek object jisme do sau ke aas paas seats hain.",
        fails: "Koi ek method add karta hai jo lock provider se guzre bina seat map mutate karta hai. Map ko private rakho aur intent expose karo, collection nahi.",
        say: "Show aggregate root hai aur isliye locking ki unit. Ise shuru mein hi explicit kar dena wahi cheez hai jo concurrency ke sawaal ko baad mein hawa mein udne se rokti hai." },

      { job: "Ek physical position: row, number, type, aur yeh ki abhi available hai ya nahi.",
        why: "Yeh wo cheez hai jis pe invariant reh sakta hai. Iske bina availability kahin ek collection mein boolean hai aur koi uske baare mein rule enforce nahi kar sakta.",
        forced: "Stage 1.",
        alts: [["An enum or a string identifier", "tab tak theek jab tak seat ko type, price band aur status nahi chahiye, aur us waqt tumhare paas string se keyed parallel maps hote hain, jo woh class hai jo abhi likhi nahi gayi."], ["A subclass per seat type", "recliner aur regular data aur price rule mein alag hain, behaviour mein nahi, isliye type field aur pricing strategy simple hai aur configure karna aasan."]],
        pros: ["Type seat pe rehta hai, isliye pricing poochh sakti hai, use bataya nahi jaata.", "(show, row, number) se equality use sets mein aur lock key ke roop mein safe bana deti hai."],
        cons: ["Seat apna status khud rakhe ya show ek status map rakhe, yeh design ka asli fork hai, aur dono mix karna hi state ko out of sync karne ka tareeka hai."],
        cost: "Ek chhota, lagbhag immutable object, har show mein do sau ke aas paas.",
        fails: "Seat.status aur Show mein map, dono maujood hain, aur woh alag ho jaate hain. Ek owner chuno. Main status seat pe rakhunga aur show us pe queries expose karega.",
        say: "Value jaisi, position se equal, aur type uspe, taaki pricing ko kabhi bataana na pade ki woh kis tarah ki seat dekh rahi hai." },

      { job: "Ek user ke liye seats ka ek set expiry ke saath atomically claim karo, ya koi bhi nahi.",
        why: "Yeh problem ke ek hi hard sawaal ka jawab hai. Yeh apna alag type isliye hai ki tum synchronise kya karte ho iska jawab ek class ho jise tum dikha sako, code mein bikhra hua keyword nahi.",
        forced: "Stage 2.",
        alts: [["synchronized on the BookingService", "correct hai, aur har cinema ke har show ko ek hi monitor se serialise kar deta hai, jo sach mein bura jawab hai jo achha dikhta hai."], ["A lock per seat", "sabse fine granularity aur sabse zyada concurrency, aur deadlock aa jaata hai jaise hi ek booking seats A aur B maange aur doosri B aur A. Hal hai hamesha sorted order mein lock karna, aur yeh batana worth hai ki tum problem aur fix dono jaante ho."], ["Optimistic, compare and swap on the seat status", "koi lock nahi aur ek seat ke liye achha chalta hai, aur kayi seats pe all-or-nothing ke liye rollback path chahiye jo tumhe khud likhna padta hai."], ["Leaving it to the database", "production mein sahi jawab aur LLD round mein galat, jahan object model hi examine ho raha hai."]],
        pros: ["Lock per show sweet spot hai: shows independent hain, isliye cross show contention nahi, aur ek show ke andar contention milliseconds ke liye tens of threads ka hai.", "Expiry lock ke saath rehti hai, isliye chhoda hua checkout kahin aur cleanup nahi maangta.", "Ek chhoti class jisme ek synchronized block hai, jo review aur test karna aasan hai."],
        cons: ["Expiry ke liye ya to read pe check hone wala timestamp chahiye ya ek sweeper. Timestamp simple hai, aur expired lock ko wahi reclaim kar leta hai jo agla poochta hai.", "In memory hai, isliye single process. Ise distribute karne ka matlab Redis, jo isi box ka HLD version hai."],
        cost: "Har show ke liye ek map, ek waqt mein chand entries.",
        fails: "Koi payment call ke dauraan lock pakde rehta hai, aur ek slow card poore hall ko aath minute ke liye lock kar deta hai. Lock, claim, monitor chhodo, phir pay karo. Claim mein expiry isi liye hai ki monitor ko pakde rehna na pade.",
        say: "Ek lock per show, acquire karne se pehle seats sorted, aur kisi bhi external call se pehle monitor chhoda hua. Agar processes ke across chalana ho to wahi interface TTL ke saath Redis pe jaata hai, aur uske upar kuch nahi badalta." },

      { job: "Ek user, ek show, seats ka ek set, ek amount, aur ek status jo sirf legal directions mein hi chal sakta hai.",
        why: "Yeh sale ka record hai, aur yahin state machine rehti hai. Public setter wala status field cancelled likh kar phir confirmed likhne ka nimantran hai.",
        forced: "Class ke liye stage 1, state machine ke liye stage 4.",
        alts: [["A status field with a setter", "zyadatar pehle drafts mein yahi hota hai, aur isse har illegal transition codebase mein kahin se bhi reachable ho jaata hai."], ["The State pattern, one class per status", "textbook jawab, aur chaar statuses ke saath simple transitions ke liye yeh problem ke behaviour se zyada classes hain. Naam lene layak hai ki statuses badhe to tum wahan jaoge."]],
        pros: ["Throw karne wale methods ke roop mein transitions illegal states ko unreachable bana dete hain, jo kisi bhi test se zyada strong hai.", "Total ko hold time pe ek baar compute karke rakhne ki natural jagah yahi hai, taaki user ke neeche price na khisake."],
        cons: ["Enum plus guards State pattern se kam extensible hai, aur tumhe kehna chahiye ki tum yeh trade-off jaante ho, use doosre ke bataane ka intezaar mat karo."],
        cost: "Har sale ke liye ek object.",
        fails: "Do threads ek hi booking confirm karte hain. Transition ko khud atomic banao, status pe compare and set, taaki doosre ko second charge ki jagah exception mile.",
        say: "Status pe koi setter nahi. confirm() aur cancel() illegal transition pe throw karte hain, isliye object ko aisi state mein nahi daala ja sakta jo business mein hai hi nahi." },

      { job: "Ek show aur ek seat diye jaayein, to ek amount lautao.",
        why: "Pricing wo cheez hai jo business wajahon se badalti hai, sabse zyada badalti hai, aur bechne se uska koi lena dena nahi. Yeh combination hi us strategy ki definition hai jise extract karna banta hai.",
        forced: "Stage 3.",
        alts: [["An if-else chain in the service", "ek class kam, aur har price change us class ko edit karta hai jo tickets bechti hai, jo codebase ki sabse high risk file hai."], ["A price field on Seat", "tab tak chalta hai jab tak price din ya show pe depend na kare, seat pe nahi, aur woh turant karta hai."], ["A rules engine", "jawab tab hai jab pricing non engineers configure karein, aur interview ke liye bahut zyada overkill."]],
        pros: ["Naya rule ek nayi class hai, existing code mein koi edit nahi.", "Rules compose hote hain: order mein lagai gayi strategies ki list bina kisi nayi abstraction ke base fare plus surcharges de deti hai.", "Har rule alag se testable hai, jo pricing ko buri tarah chahiye."],
        cons: ["Composition ka order matter karta hai aur type system mein dikhta nahi, isliye percentage flat surcharge se pehle lage ya baad mein, jawab alag aata hai.", "Chhoti classes badhti hain, jo tabhi problem hai agar rules trivial hain."],
        cost: "Ek interface, har rule ke liye ek class, ek composite.",
        fails: "Do rules dono percentage lagate hain aur result registration order pe depend karta hai. Composite ka order explicit aur tested banao, aur total lautane wale rules ki jagah delta lautane wale rules prefer karo.",
        say: "Ek method, price(show, seat). Ek composite unhe defined order mein chalata hai. Yeh wo ek pattern hai jo main bina poochhe introduce karunga, kyunki requirement khud kehti hai ki prices row aur din ke hisaab se badalte hain." },

      { job: "Base fare, weekend surcharge, recliner premium, matinee discount.",
        why: "Yeh yeh dikhane ke liye hain ki strategy ki ek se zyada implementation hai, jo ek hi cheez hai jo interface ko rakhne layak banati hai.",
        forced: "Stage 3.",
        alts: [["One class with a switch on rule type", "interface hata di gayi aur kharab tareeke se dobara implement ki gayi."]],
        pros: ["Har rule kuch lines aur ek test hai.", "Configuration tay karta hai ki kaunse rules kis show pe lagte hain, isliye promotion ek data change hai."],
        cons: ["Aisa rule jo poori booking dekhna chahta hai, ek seat nahi, jaise buy three get one free, is interface mein fit nahi hota aur booking level pe doosra interface maangta hai."],
        cost: "Kuch chhoti classes.",
        fails: "Ek rule ko seat ki jagah total chahiye, aur koi interface ko chauda karke Booking le leta hai. Seat rule ko aisa parameter uthane pe majboor karne ki jagah alag BookingDiscount abstraction add karo.",
        say: "Per seat rules aur per booking rules do alag abstractions hain. Code likhne se pehle yeh notice kar lena pattern se khud zyada value ka hai." },

      { job: "Ek booking ke liye amount charge karo, aur batao ki kaam hua ya nahi.",
        why: "Yeh isliye hai ki booking flow bina internet ke test ho sake, aur provider sales code ko chhue bina badla ja sake. Yeh do alag justifications hain aur dono akele kaafi hain.",
        forced: "Stage 4.",
        alts: [["Calling the gateway SDK directly", "kam types, aur ab core flow test nahi ho sakta aur provider nahi badal sakta."], ["A full adapter layer with request and response models", "production mein sahi cheez, aur 45 minute ke round ke liye zyada machinery. Naam lo aur aage badho."]],
        pros: ["Fake implementation poore flow ko testable banati hai, failure branch samet, jo wahi branch hai jo matter karti hai.", "Provider ki specifics ek class mein rehti hain."],
        cons: ["Interface itna general ho ki kayi providers ke liye chale aur itna specific ki kaam ka ho, aur yeh galat ho jaye to der se pata chalta hai."],
        cost: "Ek interface, ek real implementation, ek fake.",
        fails: "Interface provider ke concepts leak kar deta hai, signature mein Stripe token, aur doosra provider fit nahi hota. Interface ko apni vocabulary mein rakho: amount, currency, booking reference, result.",
        say: "Fake implementation hi point hai. Agar main payment-declined path bina network ke test nahi kar sakta, to design poora nahi hua." },

      { job: "Ek class jo real provider se baat karti hai, ek jo woh lautati hai jo test maange.",
        why: "Do implementations woh minimum hain jo abstraction ko real saabit karte hain. Ek interface ki ek hi implementation aksar extra steps wali class hoti hai.",
        forced: "Stage 4.",
        alts: [["Mocking the interface in each test instead of a shared fake", "theek hai, aur wahi setup har test file mein failta hai. Scripted outcome wali fake aksar kam code hoti hai."]],
        pros: ["Retries, timeouts aur idempotency keys adapter mein rehte hain, service mein nahi.", "Fake declined aur timeout paths ko heroics ki jagah ordinary tests bana deti hai."],
        cons: ["Fake real behaviour se drift kar sakti hai, jis tarah ek well tested system production mein surprise se milta hai."],
        cost: "Do chhoti classes.",
        fails: "Fake hamesha succeed karti hai, isliye declined path kabhi test nahi hota, aur launch day pe pata chalta hai.",
        say: "Idempotency key booking id ke barabar, adapter ke andar set hoti hai. Service ko pata bhi nahi hona chahiye ki retry karna possible hai." },

      { job: "Yeh sunna ki booking confirm ya cancel hui, aur uske baare mein kuch karna.",
        why: "Consequences badhte jaate hain. Email, cinema ki screen, audit record, analytics. Confirm method mein jodi gayi har ek cheez system ke sabse khatarnak method ko edit karne ki ek aur wajah hai.",
        forced: "Stage 5.",
        alts: [["Calling each consequence directly from confirm", "explicit aur readable, aur har feature pe ek line badhti rehti hai hamesha, aur inme se kisi ek ka fail hona sale fail kar deta hai."], ["An in process event bus", "wahi idea zyada indirection ke saath, tab useful jab publishers aur subscribers alag modules mein hon."]],
        pros: ["Naya consequence add karna ek nayi class aur ek registration hai.", "Listeners alag alag fail ho sakte hain, agar tum per listener catch karo, isliye toota hua email sale cancel nahi karta.", "Yeh HLD design ke outbox ka LLD saaya hai, aur yeh connection zor se bolna marks ke layak hai."],
        cons: ["Control flow indirect ho jaata hai, aur padhne wala confirm padh ke yeh nahi dekh sakta ki confirm pe kya kya hota hai.", "Listeners ke beech ordering undefined hai jab tak tum define na karo, aur koi ise galti se depend kar lega."],
        cost: "Ek interface, ek list, ek loop.",
        fails: "Ek listener throw karta hai aur transaction ko saath le doobta hai. Per listener catch aur log karo. Confirmed sale ek failed email se undo nahi honi chahiye.",
        say: "Per listener catch karo. Sale ho chuki hai; listener jo bhi kare, use unmake nahi kar sakta." },

      { job: "Bookings ko save aur find karo, bina service ko yeh bataye ki kaise.",
        why: "Taaki poora design ek map ke against banaya aur test kiya ja sake, aur baad mein database pe point kiya ja sake bina upar kuch badle.",
        forced: "Stage 5.",
        alts: [["Calling the database from the service", "kam types, aur ab service bina database ke test nahi ho sakti, aur SQL business flow ke beech mein baithi hai."], ["Active record, where Booking saves itself", "kam code aur entity ko storage se couple kar deta hai, jo wahi coupling hai jise yeh interface rokne ke liye hai."]],
        pros: ["In memory implementation poore design ko interview mein runnable bana deti hai, jo bilkul wahi hai jise machine coding round reward karta hai.", "Queries ek jagah rehti hain, jahan review ho sakti hain."],
        cons: ["Yeh tees find methods wala pass-through ban sakta hai, jahan abstraction ne apna kharcha nikalna band kar diya."],
        cost: "Ek interface, ek map based implementation.",
        fails: "Query methods badhte jaate hain jab tak interface hi database ho jaata hai, naye naamon ke saath. Use sirf un queries tak rakho jo domain sach mein poochta hai.",
        say: "Pehle interface, interview ke liye map implementation, baad mein database implementation. Iska matlab yeh bhi hai ki main poora flow bina kisi infrastructure ke chala ke dikha sakta hoon, jo round mujhse maang raha hai." }
    ],

    patternsIntro: "Teen patterns apni jagah kamate hain aur kayi jaane maane patterns nahi. Interview mein, bina yeh bataye ki kya badalta hai pattern introduce karna, ratta lagane wale jaisa dikhne ka sabse tez tareeka hai. Naam lo ki kya badalta hai, phir pattern obvious aur defend karne layak ho jaata hai.",

    patterns: [
      { what: "Ek interface, kayi interchangeable price rules, jo configuration time pe chune aur compose kiye jaate hain.",
        varies: "Price rule. Yeh business wajahon se badalta hai, aksar, aur kisi technical cheez se independent.",
        without: "Us class ke andar ek if-else chain jo tickets bechti hai, aur jo har baar edit hoti hai jab marketing ko koi idea aata hai.",
        cost: "Ek interface aur har rule ke liye ek chhoti class. Composition order ek aisi cheez ban jaata hai jo tumhe define aur test karni padti hai." },
      { what: "Transitions aisi methods ke roop mein jo illegal moves refuse karte hain, setter wale status field ki jagah.",
        varies: "Kuch nahi badalta. Yeh extension ke baare mein nahi hai, yeh galat state ko unreachable banane ke baare mein hai.",
        without: "Kahin ka bhi koi code cancelled booking ko wapas confirmed set kar sakta hai, aur bug mahino baad refund report mein dikhta hai.",
        cost: "Field se thoda zyada code. Poora State pattern, har state ke liye ek class, agla step hai agar statuses kuch ginti se aage badh jaayein." },
      { what: "Service pe register kiye gaye listeners, jinhe booking confirm ya cancel hone ke baad notify kiya jaata hai.",
        varies: "Un cheezon ka set jo parwah karti hain. Aaj email, kal cinema ki screen, uske baad analytics.",
        without: "Confirm method mein har feature pe ek line badhti hai aur inme se kisi ek ka fail hona sale fail kar sakta hai.",
        cost: "Indirect control flow, aur per listener error handling jo tumhe actually likhni padti hai." },
      { what: "Ek factory jo decide kare ki kaunsa kind ka Booking banana hai.",
        varies: "Kuch nahi. Booking ka ek hi kind hai, aur construction ek constructor call hai jisme koi branching nahi.",
        without: "Tum new call karte ho. Yeh theek hai, aur code ko yahi kehna chahiye.",
        cost: "Ek class jo indirection ka ek level jodti hai aur aisa sawaal jawab deti hai jo kisi ne poocha nahi. Tab add karo jab seat types ko kabhi sach mein alag Booking subclasses chahiye, jo yahaan nahi chahiye." },
      { what: "SeatLockProvider ka ek global instance, kahin se bhi reachable.",
        varies: "Kuch nahi, aur yahi exactly problem hai: singleton ek global mutable state hai jis pe pattern ka naam chipka diya gaya hai.",
        without: "Ek banao aur inject karo. Woh wahi ek single instance hai, aur ab use test mein replace kiya ja sakta hai.",
        cost: "Untestable, parallel tests ke liye hostile, aur ek dependency chhupata hai jo constructor ko declare karni chahiye. Agar interviewer yeh suggest kare to yeh baat kaho; yeh ek common aur jaan boojh ke rakhi gayi trap hai." },
      { what: "Ek pricing strategy ko doosri strategy mein wrap karna jo surcharge add kare.",
        varies: "Wahi cheez jo Strategy yahaan pehle se handle kar raha hai.",
        without: "Ek composite jo strategies ki list chalata hai, jo padhne aur configure karne mein simple hai.",
        cost: "Ismein kuch galat nahi, aur is problem mein yeh composite se zyada kuch nahi deta. Ise improvement ke roop mein present karne ki jagah ek equivalent alternative ke roop mein naam lena worth hai." }
    ],

    flowsIntro: "Do traces, aur doosra wahi hai jo poochha jaata hai. Ek concurrent path ko zor se bolte hue walk karna, exactly yeh batate hue ki monitor kahan liya aur chhoda jaata hai, LLD round mein sabse high value ki cheez hai.",

    flows: [
      { n: "The happy path",
        steps: [
          ["Controller <code>bookingService.hold(showId, seatIds, userId)</code> call karta hai."],
          ["Service Show load karti hai, aur seat ids sort karti hai. Sorting sirf dikhawa nahi hai: yahi deadlock ko impossible banati hai agar lock granularity kabhi per seat ho jaaye."],
          ["Us show pe ek synchronized block ke andar, lock provider check karta hai ki har seat free hai ya uska lock expire ho chuka hai, aur sabko expiry ke saath claim karta hai. All or nothing."],
          ["Monitor chhod diya jaata hai. Ise pakde hue kuch bhi external call nahi kiya gaya, jo wahi rule hai jo ek slow payment ko hall freeze karne se rokta hai."],
          ["Pricing strategy per seat lagti hai aur total Booking pe store hota hai, taaki user ke pay karte waqt price na khisake."],
          ["Payment processor call hota hai. Yeh seconds ka kaam hai, aur uske dauraan koi lock nahi pakda hua."],
          ["<code>booking.confirm()</code> state machine ko aage badhata hai, seats sold mark hoti hain, locks release hote hain, aur repository ise save karti hai."],
          ["Listeners ko notify kiya jaata hai, har ek apne try aur catch ke andar, kyunki sale pehle hi final hai."]
        ] },
      { n: "Two threads, one seat",
        note: "Interview mein yeh zor se, dheere dheere bolo. Yahi woh jawab hai jispe marks lagte hain.",
        steps: [
          ["Thread A aur thread B dono ek hi show ki seat J12 ke liye hold call karte hain, microseconds ke fark se."],
          ["Dono us show ke lock object pe synchronized block tak pahunchte hain. Ek andar jaata hai, doosra intezaar karta hai. Yahi wo moment hai jahan design ya to chalta hai ya nahi chalta."],
          ["A ko J12 free dikhti hai, A ke liye expiry ke saath ek lock record karta hai, aur block chhod deta hai."],
          ["B andar aata hai, A ka ek live lock dekhta hai, aur kuch nahi leta. Woh failure lautata hai jo batata hai ki kaunsi seats chali gayi, taaki user error dekhne ki jagah dobara chun sake."],
          ["Agar A chhod deta hai, to lock expire ho jaata hai. Agla caller expired lock dekhta hai aur use reclaim kar leta hai. Correctness ke liye kisi sweeper thread ki zarurat nahi."],
          ["Agar A pay kar deta hai, to confirm seats ko sold mark karta hai aur locks hata deta hai. B ka retry ab unhe sold dekhta hai, jo alag message hai aur wahi outcome."]
        ] }
    ],

    apiNote: "Yahaan do aadatein dikhane layak hain: false lautane ki jagah woh failure jo seats ke naam batata hai, aur idempotent release, kyunki caller browser hai aur browsers buttons do baar dabate hain.",

    api: [
      ["hold(showId, seatIds, userId)", "HoldResult", "All or nothing. Failure pe yeh batata hai ki kaunsi seats le li gayi thi, kyunki list actionable hai aur boolean nahi."],
      ["confirm(holdId, paymentToken)", "Booking", "Price karta hai, charge karta hai, state machine ko aage badhata hai, save karta hai, notify karta hai. Ek hi method jo paise leta hai."],
      ["release(holdId)", "void", "Explicit cancel. Idempotent, kyunki user ka back do baar dabana koi error condition nahi hai."],
      ["seatMap(showId)", "List of SeatView", "Read only. Har seat ka status aur price lautata hai, taaki caller ko dono alag calls se jodne na pade."],
      ["cancel(bookingId)", "Booking", "Cancelled mein transition karta hai, seats pool mein wapas karta hai, aur notify karta hai. Refund khud ek listener hai."]
    ],

    tradeoffsIntro: "LLD ke trade-offs HLD ke trade-offs se chhote hain aur utni hi dhyan se marked hote hain, kyunki woh dikhate hain ki tumhari opinions hain ya sirf aadatein.",

    tradeoffs: [
      { a: ["Lock per show", "Koi cross show contention nahi, microsecond critical sections, aur ek lock ke saath deadlock possible hi nahi."],
        b: ["Lock per seat", "Maximum concurrency, aur deadlock jaise hi do bookings seats ki wahi jodi alag order mein maangein."],
        flip: "ek hi show mein hazaaron seats hain aur dozens concurrent bookers, jaise ek stadium. Tab per seat jao aur har baar, bina exception ke, acquire karne se pehle seat list sort karo." },
      { a: ["Composition, Show has Seats", "Seat type per seat badalta hai, isliye ek field plus pricing strategy bina class explosion ke kaam kar deta hai."],
        b: ["Inheritance, PremiumSeat extends Seat", "Har seat kind ke liye type safety, aur fark data aur price ka hai, behaviour ka nahi, isliye hierarchy kuch nahi kamati."],
        flip: "seat kinds sach mein alag behave karte hain, jaise ek wheelchair space jo adjacency compute karne ka tareeka badal deta hai. Behaviour inheritance ka test hai, data kabhi nahi." },
      { a: ["Enum plus guarded transitions", "Das lines, koi nayi class nahi, illegal transitions throw karte hain."],
        b: ["The State pattern, one class per state", "Naya state add karna kisi existing cheez ko nahi chhoota, aur chaar statuses ke liye chaar classes hain jinme lagbhag koi behaviour nahi."],
        flip: "status count paanch se aage badh jaaye, ya states sirf alag legality ki jagah alag behaviour rakhne lagein. Tab switch statements smell hain aur State fix hai." },
      { a: ["Listeners for consequences", "Effect add karna ek nayi class hai. Failures per listener isolated hote hain."],
        b: ["Direct calls inside confirm()", "Tum confirm padh ke sab kuch dekh sakte ho jo hota hai, jo genuinely valuable hai."],
        flip: "sirf do consequences hain aur hamesha do hi rahenge. Do calls ki fixed jodi ke liye Observer bina payoff wali indirection hai, aur readability zyada worth hai." }
    ],

    next: [
      "<b>Seat suggestion.</b> Best available adjacent block ek bin packing problem hai, aur woh lock ke bahar aata hai, claim time pe nahi suggestion time pe.",
      "<b>Per booking discounts.</b> Buy three get one free per seat pricing interface mein fit nahi hota, aur ise chaude interface ki jagah doosri abstraction chahiye.",
      "<b>Distributed locks.</b> Wahi interface, peeche TTL ke saath Redis, aur is baat ki charcha ki lock service unreachable ho to kya hota hai.",
      "<b>Auditability.</b> Har state transition ka append only log, jo disputes ko answerable banata hai aur flow mein change nahi, ek listener hai."
    ]
  }
},

/* ==========================================================================
   7. LLD: EXPENSE SPLITTING
   ========================================================================== */
{
  id: "splitwise-lld", kind: "lld", n: "Expense splitting", sub: "Splitwise, group settle-up",
  tags: ["strategy", "money", "derived state", "rounding"],
  one: "A deceptively small problem with two traps in it. Money is not a double, and a balance is not a field you update: it is a fold over an immutable list of shares, and every bug people report on apps like this comes from getting one of those two wrong.",

  brief: {
    why: "This one is asked because it looks like CRUD and is not. The naive version keeps a map of who owes whom and adds to it, which produces a number that drifts, cannot be explained to a user, and cannot be corrected when somebody edits an expense from last Tuesday. The right design stores facts and derives balances, and it does arithmetic in integers. Neither of those is hard, and almost nobody does both in a first draft.",
    functional: [
      "<b>Add an expense</b> to a group: who paid, how much, and how it splits among whom.",
      "<b>Split three ways</b> at least: equally, by exact amounts, and by percentage. Adding a fourth must not touch existing code.",
      "<b>Show balances.</b> What each person owes or is owed, per group and overall.",
      "<b>Settle up.</b> Record a payment between two people, optionally suggesting the fewest transfers that clear the group.",
      "<b>Edit or delete</b> an expense that was entered wrongly, which is where the naive design falls apart."
    ],
    out: ["authentication", "the mobile client", "actually moving money", "currency conversion beyond storing a currency", "receipt scanning"],
    nfr: [
      ["Exactness", "the shares always sum to the total", "Not approximately. If a hundred rupees split three ways adds up to 99.99, someone eventually notices and nobody can explain it."],
      ["Correctable", "editing an old expense must be safe", "This is the requirement that forbids mutable running totals and forces a ledger."],
      ["Extensible splits", "a new split type touches no existing code", "The only place a pattern is clearly justified in this problem."],
      ["Explainable", "every balance traceable to expenses", "A user asking why do I owe 340 must get a list, not a number. That is a data model requirement, not a UI one."]
    ],
    numbers: [
      ["Group size", "2 to about 20", "Small. Which means the fewest transfers algorithm can be exponential in the worst case and still finish instantly, and it is worth saying that out loud."],
      ["Expenses per group", "hundreds to a few thousand", "Small enough that recomputing a balance from the ledger is cheap, which is what makes derived balances practical."],
      ["Money precision", "integer minor units", "Store paise, or cents. A double cannot represent 0.1, and money that is off by a hundredth is a support ticket rather than a rounding error."],
      ["Split types at launch", "3", "Equal, exact, percentage. And there will be a fourth, by shares, within a month, which is the argument for the strategy."]
    ],
    numbersNote: "The number worth pausing on is <b>integer minor units</b>. It is not a performance decision, it is a correctness one, and choosing it in the first minute is the cheapest way to look like you have shipped something involving money."
  },

  stagesIntro: "Six stages. Stage 0 has both classic bugs in four lines, and everything after it is either extracting something that varies or refusing to store something that should be computed.",

  stages: [
    { t: "0. A map of who owes whom",
      pressure: "Nothing yet. Draw the first draft, because both of its bugs are the point of the exercise and both are invisible in a happy path test.",
      nodes: [
        { id: "caller", l: "Controller", col: 0, row: 0, r: "client" },
        { id: "expensesvc", l: "ExpenseService", s: "a map of balances, doubles", col: 1, row: 0, r: "svc" }
      ],
      edges: [{ a: "caller", b: "expensesvc", l: "add()" }],
      add: ["caller", "expensesvc"],
      say: "A nested map from payer to borrower to amount, updated on every expense, with amounts as doubles. It demos beautifully. It has two bugs: a hundred rupees split three ways stores 33.333333 three times, which no longer sums to a hundred and drifts further with every expense, and there is no record of why any number is what it is, so editing an expense from last week is impossible.",
      breaks: "There is no Expense object, so nothing can be edited, explained, listed or corrected. The balance is the only thing that exists, and a balance without its causes is a number you cannot defend to the person who owes it." },

    { t: "1. Store the facts, not the conclusion",
      pressure: "Every requirement that is hard here, editing, explaining, correcting, needs the original expense to still exist. So the design has to record what happened rather than what it concluded.",
      nodes: [
        { id: "caller", l: "Controller", col: 0, row: 2, r: "client" },
        { id: "expensesvc", l: "ExpenseService", s: "coordinates", col: 1, row: 2, r: "svc" },
        { id: "group", l: "Group", s: "members, expenses", col: 2, row: 0, r: "entity" },
        { id: "expense", l: "Expense", s: "payer, amount, shares", col: 2, row: 1, r: "entity" },
        { id: "user", l: "User", col: 3, row: 0, r: "entity" },
        { id: "share", l: "Share", s: "user, minor units", col: 3, row: 1, r: "value" }
      ],
      edges: [
        { a: "caller", b: "expensesvc", l: "add(...)" },
        { a: "expensesvc", b: "group", l: "find", bend: 0.3 },
        { a: "expensesvc", b: "expense", l: "create", bend: 0.45 },
        { a: "group", b: "user", l: "has *" },
        { a: "expense", b: "share", l: "has *" }
      ],
      add: ["group", "expense", "user", "share"],
      say: "Four nouns. A Group has Users and Expenses. An Expense has a payer, a total, and a list of Shares. A Share is a value object: a user and an amount in minor units, integers, never a double. The invariant that makes all of this work is one line: <i>the shares of an expense sum exactly to its total.</i> Enforce it in the constructor and it can never be false anywhere else in the program.",
      breaks: "Computing the shares is a switch statement on a split type inside the service. Adding a split by shares, or by adjustment, means editing the method that creates expenses, and each edit risks the invariant." },

    { t: "2. The split rule varies, so it becomes a strategy",
      pressure: "The requirement literally says three split types today and implies more tomorrow. That is the clearest signal a design ever gives you that something should be an interface.",
      nodes: [
        { id: "caller", l: "Controller", col: 0, row: 2, r: "client" },
        { id: "expensesvc", l: "ExpenseService", col: 1, row: 2, r: "svc" },
        { id: "group", l: "Group", col: 2, row: 0, r: "entity" },
        { id: "expense", l: "Expense", col: 2, row: 1, r: "entity" },
        { id: "split", l: "SplitStrategy", s: "interface", col: 2, row: 2, r: "iface" },
        { id: "user", l: "User", col: 3, row: 0, r: "entity" },
        { id: "share", l: "Share", s: "user, minor units", col: 3, row: 1, r: "value" },
        { id: "splitimpl", l: "Equal, Exact, Percent", s: "and later, by shares", col: 3, row: 2, r: "impl" }
      ],
      edges: [
        { a: "caller", b: "expensesvc", l: "add(...)" },
        { a: "expensesvc", b: "group", l: "find", bend: 0.3 },
        { a: "expensesvc", b: "expense", l: "create", bend: 0.45 },
        { a: "expensesvc", b: "split", l: "split" },
        { a: "group", b: "user", l: "has *" },
        { a: "expense", b: "share", l: "has *" },
        { a: "split", b: "splitimpl", l: "impl" }
      ],
      add: ["split", "splitimpl"],
      say: "One interface: given a total and the participants, return a list of Shares. Equal, exact and percentage implement it, and a fourth is a new class with no edit anywhere. Two rules for the interface earn their keep. It returns Shares rather than mutating an expense, so it is pure and trivially testable. And every implementation must satisfy the same postcondition, that the shares sum to the total, which means one shared test can be run against all of them.",
      breaks: "A hundred rupees split three ways is 3,333 paise each and 10,000 total, so one paisa is unaccounted for. Every split type has this problem and the service has no opinion about who gets the remainder." },

    { t: "3. Balances are computed, never stored",
      pressure: "The requirement to edit an old expense. A stored running total cannot be corrected without replaying the history you decided not to keep, so the balance has to be derived from the shares that already exist.",
      nodes: [
        { id: "caller", l: "Controller", col: 0, row: 2, r: "client" },
        { id: "expensesvc", l: "ExpenseService", col: 1, row: 2, r: "svc" },
        { id: "group", l: "Group", col: 2, row: 0, r: "entity" },
        { id: "expense", l: "Expense", col: 2, row: 1, r: "entity" },
        { id: "split", l: "SplitStrategy", s: "interface", col: 2, row: 2, r: "iface" },
        { id: "balance", l: "BalanceSheet", s: "a fold, not a field", col: 2, row: 3, r: "svc" },
        { id: "user", l: "User", col: 3, row: 0, r: "entity" },
        { id: "share", l: "Share", col: 3, row: 1, r: "value" },
        { id: "splitimpl", l: "Equal, Exact, Percent", col: 3, row: 2, r: "impl" }
      ],
      edges: [
        { a: "caller", b: "expensesvc", l: "add(...)" },
        { a: "expensesvc", b: "group", l: "find", bend: 0.3 },
        { a: "expensesvc", b: "expense", l: "create", bend: 0.45 },
        { a: "expensesvc", b: "split", l: "split" },
        { a: "expensesvc", b: "balance", l: "compute", bend: 0.62 },
        { a: "group", b: "user", l: "has *" },
        { a: "expense", b: "share", l: "has *" },
        { a: "split", b: "splitimpl", l: "impl" }
      ],
      add: ["balance"],
      say: "A BalanceSheet is a function, not a field. Fold every expense in the group: add the total to the payer's net position, subtract each share from its owner's. The result is one signed integer per person, summing to zero, which is itself a checkable invariant. Editing an expense is now a change to one fact and the balances follow. And the rounding remainder gets a rule at last: give the extra unit to the payer, deterministically, and write it down so two runs never disagree.",
      breaks: "Recomputing every balance from every expense on every read is fine for a thousand expenses and not for a decade of them, and there is still no record of a settlement, which is a fact rather than an expense." },

    { t: "4. The ledger, immutable and idempotent",
      pressure: "Two problems with one answer. Corrections must be traceable, and expenses can arrive twice from a phone with a bad connection.",
      nodes: [
        { id: "caller", l: "Controller", col: 0, row: 2, r: "client" },
        { id: "expensesvc", l: "ExpenseService", s: "idempotent by client id", col: 1, row: 2, r: "svc" },
        { id: "group", l: "Group", col: 2, row: 0, r: "entity" },
        { id: "expense", l: "Expense", col: 2, row: 1, r: "entity" },
        { id: "split", l: "SplitStrategy", col: 2, row: 2, r: "iface" },
        { id: "balance", l: "BalanceSheet", s: "fold over the ledger", col: 2, row: 3, r: "svc" },
        { id: "user", l: "User", col: 3, row: 0, r: "entity" },
        { id: "share", l: "Share", col: 3, row: 1, r: "value" },
        { id: "splitimpl", l: "Equal, Exact, Percent", col: 3, row: 2, r: "impl" },
        { id: "ledger", l: "LedgerRepository", s: "append only, snapshots", col: 3, row: 3, r: "store" }
      ],
      edges: [
        { a: "caller", b: "expensesvc", l: "add(...)" },
        { a: "expensesvc", b: "group", l: "find", bend: 0.3 },
        { a: "expensesvc", b: "expense", l: "create", bend: 0.45 },
        { a: "expensesvc", b: "split", l: "split" },
        { a: "expensesvc", b: "balance", l: "compute", bend: 0.62 },
        { a: "group", b: "user", l: "has *" },
        { a: "expense", b: "share", l: "has *" },
        { a: "split", b: "splitimpl", l: "impl" },
        { a: "balance", b: "ledger", l: "reads" }
      ],
      add: ["ledger"],
      say: "Entries are appended and never modified. Editing an expense writes a reversal followed by a replacement, so the history explains itself and a user can see that a correction happened rather than watching a number change silently. Deleting is a reversal with nothing after it. Every entry carries a client supplied id, so a phone that retries produces the same entry rather than a second one. And when a group gets long, a periodic snapshot of the balance plus the entries since it keeps the fold cheap without ever making the balance a mutable field.",
      breaks: "Balances are correct and useless as instructions. A group of six people ends a holiday with six numbers and no idea who should pay whom." },

    { t: "5. Settling up, and the argument about simplification",
      pressure: "A balance is a state; a settlement is an instruction. Turning one into the other is a small optimisation problem, and it is the only place in this design where the obvious answer is arguably the wrong one.",
      nodes: [
        { id: "caller", l: "Controller", col: 0, row: 2, r: "client" },
        { id: "expensesvc", l: "ExpenseService", col: 1, row: 2, r: "svc" },
        { id: "group", l: "Group", col: 2, row: 0, r: "entity" },
        { id: "expense", l: "Expense", col: 2, row: 1, r: "entity" },
        { id: "split", l: "SplitStrategy", col: 2, row: 2, r: "iface" },
        { id: "balance", l: "BalanceSheet", col: 2, row: 3, r: "svc" },
        { id: "settle", l: "SettlementService", s: "balances to transfers", col: 2, row: 4, r: "svc" },
        { id: "user", l: "User", col: 3, row: 0, r: "entity" },
        { id: "share", l: "Share", col: 3, row: 1, r: "value" },
        { id: "splitimpl", l: "Equal, Exact, Percent", col: 3, row: 2, r: "impl" },
        { id: "ledger", l: "LedgerRepository", s: "append only", col: 3, row: 3, r: "store" },
        { id: "simplify", l: "DebtSimplifier", s: "optional, off by default", col: 3, row: 4, r: "impl" }
      ],
      edges: [
        { a: "caller", b: "expensesvc", l: "add(...)" },
        { a: "expensesvc", b: "group", l: "find", bend: 0.28 },
        { a: "expensesvc", b: "expense", l: "create", bend: 0.42 },
        { a: "expensesvc", b: "split", l: "split" },
        { a: "expensesvc", b: "balance", l: "compute", bend: 0.6 },
        { a: "expensesvc", b: "settle", l: "settle", bend: 0.78 },
        { a: "group", b: "user", l: "has *" },
        { a: "expense", b: "share", l: "has *" },
        { a: "split", b: "splitimpl", l: "impl" },
        { a: "balance", b: "ledger", l: "reads" },
        { a: "settle", b: "simplify", l: "uses" }
      ],
      add: ["settle", "simplify"],
      say: "The settlement service takes the signed balances and produces transfers. The greedy version repeatedly matches the largest debtor with the largest creditor, which is fast, easy to explain, and not always minimal. The minimal version is exponential, and with at most twenty people that is still instant, so you can afford the exact answer if you want it. What matters more is the product judgement: simplification changes who pays whom, so Anita ends up paying Rahul for a dinner Rahul was not at. Keep it opt in, and recording a settlement is just another ledger entry, which is why nothing else in the design had to change to support it." }
  ],

  boxesIntro: "Twelve types, and the two carrying the design are Share, because it makes exactness an invariant rather than a hope, and LedgerRepository, because it makes correction possible at all.",

  boxes: [
    { id: "caller", n: "Controller", r: "client",
      job: "Translates a request into a service call and a result into a response.",
      why: "It marks the boundary. Everything to its right runs in a test with no framework, which is what an LLD round is asking you to demonstrate.",
      forced: "Nothing. Drawn to show where the design begins.",
      alts: [["Business logic in the controller", "the usual way a clean design decays, because controllers are the classes nobody unit tests."]],
      pros: ["Keeps serialisation and status codes out of the domain."],
      cons: ["A thin layer whose value is invisible until somebody puts a rule in it."],
      cost: "One small class.",
      fails: "Split validation appears here as well as in the strategy, the two disagree, and an invalid expense gets in through one path.",
      say: "Map and delegate. Validation belongs to the object that owns the invariant, which for splits is the strategy." },

    { id: "expensesvc", n: "ExpenseService", r: "svc",
      job: "Coordinate: find the group, build the shares, create the expense, append it to the ledger.",
      why: "Somebody owns the sequence. Keeping it separate from the entities is what stops Expense from knowing about repositories.",
      forced: "Stage 0, and every later stage removed something from it.",
      alts: [["Putting the flow on Group", "the aggregate root gains a dependency on persistence and on split strategies, which is a heavier coupling than the one you removed."], ["Splitting into ExpenseService and BalanceService", "reasonable, and the balance work is already a separate collaborator, so the split buys mostly a longer class list."]],
      pros: ["The whole flow is readable in one place.", "Owns no state, so it tests with fakes and no fixtures."],
      cons: ["It is where unrelated features will be added if nobody objects."],
      cost: "One class with four collaborators.",
      fails: "Currency conversion, notifications and receipt parsing all land here over six months, and it is stage 0 again with better dependencies.",
      say: "It owns the order of operations and nothing else. It should be boring to read and boring to test." },

    { id: "group", n: "Group", r: "entity",
      job: "A set of members and the expenses recorded against them.",
      why: "It is the aggregate root and the unit of consistency: balances are per group, membership is per group, and settlements clear a group.",
      forced: "Stage 1.",
      alts: [["No group, just pairwise expenses between users", "how one to one expenses work, and it makes group balances a query over an implicit set, which every feature then has to reconstruct."], ["A group as a tag on an expense", "same information, no owner, so nothing can enforce that a share belongs to a member."]],
      pros: ["Membership validation has an owner: a share for someone outside the group is rejected at the boundary.", "Balances and settlements are naturally scoped."],
      cons: ["A member leaving a group with a non zero balance is a genuinely awkward case that this class has to answer for.", "Overall balances across groups are a second query rather than a field."],
      cost: "One object per group, holding member references and expense ids.",
      fails: "Someone is removed from a group while owing money and their balance quietly disappears from the sheet. Removal should require a zero balance, or convert to a debt outside the group.",
      say: "Group owns membership, so it is where a share for a non member is rejected. Enforcing that at the root removes a check from everywhere else." },

    { id: "user", n: "User", r: "entity",
      job: "A person, referenced by id from shares and balances.",
      why: "It is a thin entity by design. Almost everything about a person that matters here is in the shares, not in the user.",
      forced: "Stage 1.",
      alts: [["Using a plain string id everywhere", "fewer types, and now nothing can carry a display name or a currency preference, and every method signature is a string."]],
      pros: ["Identity by id makes shares comparable, hashable and safe in maps.", "Keeps display concerns out of the arithmetic."],
      cons: ["Deleting a user is a referential problem: their shares are part of other people's history and cannot simply vanish."],
      cost: "Trivial.",
      fails: "A user is deleted and past balances become unexplainable. Deactivate rather than delete, always, in anything that has a ledger.",
      say: "Referenced by id, never embedded. A share holds a user id, not a user, because the ledger has to keep meaning after a profile changes." },

    { id: "expense", n: "Expense", r: "entity",
      job: "Who paid, how much, in what currency, when, and the list of shares that account for the total.",
      why: "It is the fact. Every requirement that stage 0 could not satisfy, editing, explaining, reversing, needs this object to exist.",
      forced: "Stage 1.",
      alts: [["Storing only the resulting balance deltas", "smaller, and it throws away the explanation, which was a requirement."], ["Subclasses per split type, EqualExpense and so on", "the split rule is behaviour used once at creation, not a property of the expense afterwards. Strategy at creation beats a hierarchy that persists forever."]],
      pros: ["Immutable after construction, so nothing can drift.", "The constructor is the one place the sum invariant is checked, so it holds everywhere.", "Edits become new entries rather than mutations, which is what makes the history honest."],
      cons: ["Immutability means an edit produces two more entries, so the ledger grows faster than the number of user actions."],
      cost: "One object per expense with a handful of shares.",
      fails: "Somebody adds a setter for the amount and the shares no longer sum to the total. Keep it immutable and let the invariant live in the constructor.",
      say: "Immutable, with the sum invariant checked in the constructor. If shares do not add up to the total, the object cannot be built, so no other code has to check it." },

    { id: "share", n: "Share", r: "value",
      job: "One person's portion of one expense, in integer minor units.",
      why: "This tiny class is where the correctness of the whole design lives. It makes the unit explicit, it forbids floating point, and it is what the sum invariant is stated over.",
      forced: "Stage 1.",
      alts: [["A double amount", "the default, and 0.1 is not representable in binary floating point, so totals drift and comparisons fail in ways that look like ghosts."], ["BigDecimal", "correct and verbose, with a scale to manage and rounding modes to specify at every operation. Right for a bank, heavier than needed here."], ["A Money value object with amount and currency", "the better version of this, and it is what I would grow it into the moment a second currency appears."]],
      pros: ["Integers make addition exact and comparison trivial.", "The unit is in the type, so nobody has to remember whether a number is rupees or paise.", "It makes the remainder visible: with integers you cannot hide a missing paisa in a rounding error."],
      cons: ["Every input and output needs conversion at the edges, and forgetting one is a factor of a hundred.", "Percentages still require a division, so the remainder rule is still needed."],
      cost: "A two field immutable value object.",
      fails: "One code path stores rupees and another paise. Make the constructor take minor units only and name the field so it cannot be misread.",
      say: "Integer minor units. This is the first decision I would make and the one I would refuse to compromise on, because a money bug found later is unfixable in the data." },

    { id: "split", n: "SplitStrategy", r: "iface",
      job: "Given a total and the participants, return the shares.",
      why: "The split rule is the thing the requirements say varies, and it varies for product reasons on a product timescale.",
      forced: "Stage 2.",
      alts: [["A switch on a split type enum", "one class fewer and every new type edits the method that builds expenses, which is where the invariant is enforced."], ["A closure or lambda per split", "genuinely fine for something this small, and it loses a named place to put validation and the shared postcondition test."]],
      pros: ["A new split type is a new class and nothing else changes.", "Pure: inputs to outputs, no state, so tests are one line each.", "One shared property test, that shares sum to the total, runs against every implementation including future ones."],
      cons: ["Each type needs different inputs: exact needs amounts, percentage needs percentages. Either the interface takes a bag of parameters or each strategy is constructed with its own, and the second is cleaner but wordier."],
      cost: "One interface, one class per split type.",
      fails: "The interface grows a parameter for each new split type until it takes five nullable arguments. Construct each strategy with its own parameters and keep the method signature down to total and participants.",
      say: "Construct the strategy with its own configuration, then call split(total, participants). That keeps the interface narrow no matter how many types arrive." },

    { id: "splitimpl", n: "Equal, Exact, Percentage", r: "impl",
      job: "The three concrete split rules, each responsible for its own validation and its own remainder.",
      why: "Three implementations is what makes the interface real, and each one has a genuinely different validation rule, which is the argument against a shared switch.",
      forced: "Stage 2.",
      alts: [["One class with a mode flag", "the interface deleted and reimplemented as a field."]],
      pros: ["Exact validates that the amounts sum to the total. Percentage validates that percentages sum to a hundred. Equal validates nothing and distributes the remainder. Three different rules, three classes.", "Each is a handful of lines and fully covered by two tests."],
      cons: ["The remainder rule has to be identical across them or two split types will disagree about who gets the extra unit."],
      cost: "Three tiny classes.",
      fails: "Percentages of 33, 33 and 34 are validated as summing to a hundred, and the resulting paise still do not sum to the total because of the division. Validate the percentages and then distribute the actual remainder, rather than trusting the validation to have fixed it.",
      say: "Validation belongs to the strategy that has an opinion. Equal has none, exact and percentage each have their own, and none of that logic belongs in the service." },

    { id: "balance", n: "BalanceSheet", r: "svc",
      job: "Fold the ledger into one signed net position per person.",
      why: "A balance is derived state. Storing it makes editing impossible and makes drift inevitable, and both of those were requirements in the brief.",
      forced: "Stage 3.",
      alts: [["A stored balance updated on each expense", "O(1) reads and it cannot be corrected, cannot be explained, and drifts if any update is missed or applied twice."], ["Event sourcing with projections", "this, formalised. Worth naming as what it grows into, and the informal version is enough for the scale in the brief."]],
      pros: ["Correct by construction: it cannot disagree with the expenses because it is computed from them.", "Editing an expense needs no balance maintenance at all.", "The sum of all balances is zero, which is a free assertion you should actually write."],
      cons: ["O(n) per read in the number of entries, which is why snapshots exist.", "A snapshot is a cached balance, which reintroduces a little of what you avoided, and now with a defined and testable relationship to the ledger."],
      cost: "A fold over a few thousand entries. Microseconds.",
      fails: "A group accumulates ten years of entries and balance reads get slow. Snapshot periodically and fold only the entries after the snapshot. Verify a snapshot against a full recompute in a background job, and never trust it enough to skip that.",
      say: "Derived, always, with an assertion that the balances sum to zero. If that assertion ever fires, something violated the share invariant and I want to know immediately rather than in a support ticket." },

    { id: "ledger", n: "LedgerRepository", r: "store",
      job: "Append entries, read them back in order, and hold periodic snapshots.",
      why: "Append only is what makes corrections traceable and idempotency possible. It is the single decision that turns this from CRUD into something you would trust with money.",
      forced: "Stage 4.",
      alts: [["A mutable expenses table with updates and deletes", "the obvious design, and an edit destroys the previous version, so nobody can see that a correction happened."], ["Soft deletes on a mutable table", "halfway there, and it keeps deletes and loses edits, which are the more common correction."]],
      pros: ["Every entry has a client supplied id, so retries from a flaky phone are naturally idempotent.", "Corrections are visible as reversals, which is what a user actually wants to see.", "The whole balance history is reconstructible for any point in time, which answers disputes."],
      cons: ["It grows monotonically and never shrinks.", "Reading a balance means reading many rows, which is why snapshots exist.", "Users think in terms of edit, so the interface has to present a reversal and a replacement as one action."]
      , cost: "A few thousand small entries per group, plus a snapshot every few hundred.",
      fails: "Someone adds an update method to the repository because it was convenient once. Do not give it one. The absence of that method is the design.",
      say: "Append only, one client supplied id per entry, snapshots for speed. An edit is a reversal plus a replacement, shown to the user as an edit and stored as two facts." },

    { id: "settle", n: "SettlementService", r: "svc",
      job: "Turn a set of balances into a list of transfers, and record a payment when one happens.",
      why: "A balance says what is true; a settlement says what to do. They are different questions and mixing them puts an optimisation algorithm inside a reporting class.",
      forced: "Stage 5.",
      alts: [["Showing raw pairwise debts with no suggestion", "honest, faithful to who actually owed whom, and it leaves a group of six with fifteen possible payments to sort out themselves."], ["Always simplifying", "fewest transfers and it invents debts between people who never shared a meal, which users find confusing and occasionally object to."]],
      pros: ["Recording a settlement is just another ledger entry, so nothing else in the design had to change to support it.", "Suggestion and recording are separate, so a group can ignore the suggestion and pay whoever they like."],
      cons: ["Simplification is a product decision disguised as an algorithm, and different apps make it differently on purpose."],
      cost: "Small. Groups are at most about twenty people.",
      fails: "A suggested transfer is displayed as an obligation and someone pays twice, once as suggested and once as they remembered it. Settlements must be recorded explicitly, never inferred from a suggestion being shown.",
      say: "Suggest, do not decide. And record the settlement as a ledger entry so the balance falls out of the same fold as everything else." },

    { id: "simplify", n: "DebtSimplifier", r: "impl",
      job: "Reduce a set of net balances to as few transfers as possible.",
      why: "It is a separate class because it is an algorithm with a trade-off attached, and because a group should be able to turn it off.",
      forced: "Stage 5.",
      alts: [["Greedy, largest debtor to largest creditor", "at most n-1 transfers, easy to explain, and not always minimal. Almost always what to ship."], ["Exact minimum via subset partitioning", "genuinely minimal and exponential, and with twenty people that is still instant, so it is affordable here in a way it would not be at scale."]],
      pros: ["At most n-1 transfers instead of up to n squared over 2.", "Runs on a handful of integers, so it costs nothing at this size."],
      cons: ["It creates debts between people who never transacted, which is confusing and sometimes socially wrong.", "It loses the explanation: I owe you 400 because of these three dinners becomes I owe you 400 because of arithmetic."]
      , cost: "Negligible at twenty people, even for the exact version.",
      fails: "Simplification runs by default and a user cannot see why they owe a near stranger. Keep it opt in per group, and always keep the underlying pairwise history available.",
      say: "Greedy by default, opt in per group, and the raw pairwise view always available. The optimisation is easy; knowing that it is a product decision is the answer." }
  ],

  patternsIntro: "One pattern is clearly justified, one more is arguable, and the interesting part of this problem is how many well known patterns look applicable and are not. Being able to say why not is worth as much as using one.",

  patterns: [
    { n: "Strategy, for splits", used: true,
      what: "One interface, one implementation per split type, each constructed with its own configuration.",
      varies: "The split rule. Three at launch, a fourth within a month, each with different validation.",
      without: "A switch statement inside the method that creates expenses, edited every time a split type is added, next to the invariant it must not break.",
      cost: "One interface and a small class per type. The interface has to be kept narrow or it collects a parameter per implementation." },
    { n: "Value object, for Share and Money", used: true,
      what: "Immutable, equal by value, integer minor units, with the unit encoded in the type.",
      varies: "Nothing. It exists to make a whole category of bug impossible rather than to allow extension.",
      without: "Doubles, drift, and a support queue full of balances that are off by one paisa and cannot be explained.",
      cost: "Conversion at every boundary, and the discipline to never introduce a floating point amount anywhere." },
    { n: "Ledger, or event sourcing informally", used: true,
      what: "Append only entries, balances folded from them, corrections as reversals.",
      varies: "Nothing varies. It buys correctability, idempotency and explainability, all of which were requirements.",
      without: "Mutable running totals that cannot be edited, cannot be audited and drift.",
      cost: "O(n) reads until you add snapshots, and a growing store. Both are acceptable at group scale and both need saying." },
    { n: "Observer, for notifications", used: false,
      what: "Listeners told when an expense is added, for push notifications and an activity feed.",
      varies: "The set of things that care, which is genuinely likely to grow.",
      without: "Direct calls from the service, one line per feature.",
      cost: "Nothing wrong with it, and it is out of scope for the stated requirements. This is the one on this list I would add first if asked to extend, and I would say that rather than adding it unprompted." },
    { n: "Visitor, over expense types", used: false,
      what: "A visitor to compute different things across a hierarchy of expense types.",
      varies: "Nothing. There is one Expense type. Split behaviour was extracted to a strategy, so no hierarchy exists to visit.",
      without: "A method on Expense, or a function that takes one.",
      cost: "Two interfaces and a double dispatch to solve a problem the design already removed. This is a good example of a pattern that becomes applicable only if you make an earlier mistake." },
    { n: "Singleton, for the service", used: false,
      what: "A single global ExpenseService reachable from anywhere.",
      varies: "Nothing, and it hides a dependency the constructor should be declaring.",
      without: "Construct one and inject it. Same instance, now replaceable in tests.",
      cost: "Global mutable state, hostile to parallel tests, and an invisible dependency graph. It is a common interview trap and refusing it politely is the right answer." }
  ],

  flowsIntro: "Two traces. The second one, editing an expense from last week, is the one that separates a design with a ledger from one without, and it is the follow up question this problem exists to ask.",

  flows: [
    { n: "Adding an expense",
      steps: [
        ["The controller calls <code>addExpense(groupId, payerId, totalMinor, strategy, participants, clientId)</code>.", "sync"],
        ["The service loads the group and checks that the payer and every participant are members. Membership is the group's invariant, so the group answers.", "sync"],
        ["The strategy produces the shares. It validates its own inputs, exact amounts sum to the total, percentages sum to a hundred, and it distributes the remainder by the shared rule.", "sync"],
        ["The Expense constructor asserts that the shares sum to the total. If they do not, the object cannot be built and nothing downstream has to check again.", "sync"],
        ["The entry is appended to the ledger with the client supplied id. If that id already exists, the existing entry is returned and nothing is written.", "sync"],
        ["Balances are not touched, because balances are not stored. The next read folds the new entry in.", "sync"]
      ] },
    { n: "Editing an expense from last Tuesday",
      note: "This is the trace that justifies every design decision on this page. Try narrating it against a stored running total and watch it fall apart.",
      steps: [
        ["The user changes the amount of an old expense. Nothing is mutated.", "sync"],
        ["A reversal entry is appended: the same shares with the signs flipped, referencing the original entry id.", "sync"],
        ["A replacement entry is appended with the corrected amount and freshly computed shares.", "sync"],
        ["The next balance read folds the whole ledger and produces the right numbers, with no balance maintenance code anywhere in the system.", "sync"],
        ["The activity view shows an edit, because the two entries are linked. The user sees that a correction happened rather than a number changing on its own.", "sync"],
        ["If a settlement had already been recorded against the old amount, it stays as it is. The balance is now non zero again, which is correct and honest.", "sync"]
      ] }
  ],

  api: [
    ["addExpense(group, payer, total, strategy, participants, clientId)", "Expense", "clientId is the idempotency key. A phone with a bad connection will send this twice, and the second one must be a no-op."],
    ["balances(groupId)", "Map of user to signed minor units", "Signed, so one number per person rather than a pairwise matrix. Positive is owed, negative owes, and the total is zero."],
    ["editExpense(expenseId, newDetails)", "Expense", "Appends a reversal and a replacement. Presented to the user as an edit, stored as two immutable facts."],
    ["settleUp(groupId)", "List of Transfer", "A suggestion, never an obligation. Recording that a transfer happened is a separate call, on purpose."],
    ["recordSettlement(from, to, amount)", "LedgerEntry", "Just another entry. Nothing about balances changed to support settlements, which is the sign the ledger was the right shape."]
  ],
  apiNote: "Two habits worth showing: an idempotency key on the only write that costs money, and balances as one signed number per person rather than a pairwise matrix, because a matrix is n squared numbers describing n facts.",

  schema: { n: "The invariant, and the fold", lang: "java",
    note: "Twenty lines that contain the whole design. Everything else is naming.",
    code:
"record Share(String userId, long minorUnits) {}     // integers. always.\n" +
"\n" +
"final class Expense {\n" +
"    final String payerId; final long totalMinor; final List<Share> shares;\n" +
"\n" +
"    Expense(String payerId, long totalMinor, List<Share> shares) {\n" +
"        long sum = shares.stream().mapToLong(Share::minorUnits).sum();\n" +
"        if (sum != totalMinor)                       // the one invariant.\n" +
"            throw new IllegalArgumentException(      // checked once, here,\n" +
"                \"shares \" + sum + \" != total \" + totalMinor);  // so it\n" +
"        this.payerId = payerId;                      // holds everywhere.\n" +
"        this.totalMinor = totalMinor;\n" +
"        this.shares = List.copyOf(shares);           // immutable\n" +
"    }\n" +
"}\n" +
"\n" +
"// a balance is a fold, never a field.\n" +
"Map<String, Long> balances(List<Expense> ledger) {\n" +
"    Map<String, Long> net = new HashMap<>();\n" +
"    for (Expense e : ledger) {\n" +
"        net.merge(e.payerId, e.totalMinor, Long::sum);        // paid out\n" +
"        for (Share s : e.shares)\n" +
"            net.merge(s.userId(), -s.minorUnits(), Long::sum); // owed\n" +
"    }\n" +
"    assert net.values().stream().mapToLong(v -> v).sum() == 0;\n" +
"    return net;                    // if that assert fires, a share invariant\n" +
"}                                  // was violated somewhere. worth knowing.\n" +
"\n" +
"// equal split, with the remainder given deterministically to the payer\n" +
"List<Share> equalSplit(long totalMinor, List<String> users, String payer) {\n" +
"    long base = totalMinor / users.size();\n" +
"    long extra = totalMinor % users.size();      // 10000 / 3 -> 3333 rem 1\n" +
"    List<Share> out = new ArrayList<>();\n" +
"    for (String u : users)\n" +
"        out.add(new Share(u, base + (u.equals(payer) ? extra : 0)));\n" +
"    return out;                                  // sums to exactly the total\n" +
"}" },

  deep: [
    { n: "The missing paisa, and who should get it",
      note: "A hundred rupees split three ways is 10,000 paise divided by three, which is 3,333 each with one left over. Three shares of 3,333 sum to 9,999. One paisa has to go somewhere, and the only wrong answer is to pretend it does not exist, which is what floating point lets you do: 33.333333 times three looks like a hundred until you compare it to one.<br><br>With integers the remainder is visible and needs a rule. Three defensible ones: <b>give it to the payer</b>, which is simple and slightly generous to everyone else; <b>distribute one unit each to the first k participants</b> in a stable order, which is fairest and needs a defined order; or <b>rotate</b> across expenses so it evens out over time, which is the fairest and the hardest to explain.<br><br>What matters in an interview is less which one you pick than that you noticed, that the rule is deterministic, and that every split strategy uses the same one. Two split types disagreeing about the remainder is a bug nobody will find for a year." },

    { n: "Why balances are derived, said in one sentence",
      note: "<b>If you store a balance, you cannot edit an expense.</b> That is the whole argument, and it is worth being able to say it that briefly.<br><br>A stored balance is the result of applying a sequence of changes. To correct one of those changes you must know what it contributed, which means you must have kept it, which means you have a ledger, which means the stored balance is now a cache. So the choice is not between derived and stored. It is between derived, and derived with a cache you have to keep honest.<br><br>At the scale in the brief, a few thousand entries per group, the fold is microseconds and the cache is unnecessary. When it stops being cheap, add a snapshot: a balance at a point in the ledger, plus the entries after it. Verify the snapshot against a full recompute in a background job, because a cache of money that nobody checks is a cache that is eventually wrong." },

    { n: "Simplifying debts, and why it is a product decision",
      note: "Six people on holiday can end with fifteen pairwise debts. Netting them to five transfers is objectively fewer payments, and the greedy algorithm, repeatedly match the largest debtor to the largest creditor, gets to at most n-1 transfers and is trivial to write. The truly minimal number is an NP-hard partitioning problem, and with twenty people it is still instant, so you can have the exact answer if you want it.<br><br>The part worth arguing is not the algorithm. Simplification creates debts between people who never transacted: Anita ends up paying Rahul for a dinner Rahul did not attend. Users find that confusing, and occasionally they object for reasons that have nothing to do with arithmetic. Real products treat this as opt in for exactly that reason.<br><br>So: greedy, opt in, and always keep the pairwise history available so the question <i>why do I owe this person</i> has an answer. Recognising that the interesting constraint is social rather than computational is the point of the question." },

    { n: "Two people, two phones, one dinner",
      note: "Both housemates add the same restaurant bill at the same moment. Nothing crashes, nothing is inconsistent, and the group now owes twice what it should, which is a worse kind of bug because every component behaved correctly.<br><br>There is no purely technical fix, because the two expenses are genuinely indistinguishable from a legitimate pair of identical rounds at the same bar. What you can do is reduce the damage. <b>A client supplied id</b> makes one phone's retry idempotent, which handles the more common case of a flaky connection. <b>A duplicate warning</b>, same amount, same group, within a few minutes, catches the human case and lets a human decide. <b>An easy reversal</b> means the fix is one tap rather than a support conversation.<br><br>The generalisable point, and the reason this is a good closing question: some duplicates are a concurrency problem and some are a product problem, and the ledger is what makes the second kind cheap to correct." }
  ],

  tradeoffsIntro: "Four decisions, and the first one is not really negotiable. It is here so you can hear what the arguments against it sound like.",

  tradeoffs: [
    { a: ["Integer minor units", "Exact addition, exact comparison, and the remainder is visible so it must be given a rule."],
      b: ["Doubles, or BigDecimal", "Doubles are simple and wrong. BigDecimal is correct, verbose, and needs a scale and a rounding mode at every operation."],
      pick: "a",
      flip: "you need fractional minor units, for example currency conversion or interest. Then BigDecimal, with the scale fixed and stated. Never doubles, for anything, ever." },
    { a: ["Balances derived from a ledger", "Editing works, corrections are visible, and the numbers cannot disagree with the expenses."],
      b: ["Stored running balances", "O(1) reads, and an edit is impossible without the history you chose not to keep."],
      pick: "a",
      flip: "reads become expensive, which happens eventually. Then add a snapshot, which is a cache with a defined relationship to the ledger, and keep a background job that verifies it." },
    { a: ["Strategy per split type", "New types are new classes. Each owns its own validation."],
      b: ["A switch on a split type enum", "One class, all the logic visible in one place, and every new type edits the method holding the invariant."],
      pick: "a",
      flip: "there will genuinely only ever be one split type. That is not this problem, and the requirements said so." },
    { a: ["Suggest simplified settlements, opt in", "At most n-1 transfers when a group wants it, and the raw pairwise truth always available."],
      b: ["Always show raw pairwise debts", "Perfectly faithful to who owed whom, and fifteen payments for a group of six."],
      pick: "a",
      flip: "the group is two people, where simplification is the identity function and the option is noise. Small groups should not be shown a setting that does nothing." }
  ],

  next: [
    "<b>Multiple currencies.</b> Share becomes Money with a currency, and a balance becomes one number per currency, because netting across currencies means picking a rate and a moment, which is a product decision.",
    "<b>An activity feed.</b> The Observer that was deliberately left out, once notifications are a requirement rather than a guess.",
    "<b>Recurring expenses.</b> Rent every month is a template plus a scheduler, and it must produce ordinary ledger entries so nothing downstream changes.",
    "<b>Leaving a group with a balance.</b> The genuinely unsolved case in most apps, and the honest answer is to require settling first or to convert it to a debt outside the group."
  ],

  p: [
    ["GFG", "https://www.geeksforgeeks.org/system-design/design-a-expense-sharing-application-splitwise-low-level-design/", "GFG, Splitwise LLD", "M"],
    ["EDU", "https://www.educative.io/courses/grokking-the-low-level-design-interview-using-ood-principles", "Grokking the LLD interview", "M"],
    ["GFG", "https://www.geeksforgeeks.org/dsa/minimize-cash-flow-among-given-set-friends-borrowed-money/", "Minimise cash flow, the simplification algorithm", "M"],
    ["HI", "https://www.hellointerview.com/learn/low-level-design/in-a-hurry/patterns", "Hello Interview, when to use which pattern", "M"],
    ["LIST", "https://leetcode.com/problem-list/design/", "LeetCode Design problems", "M"]
  ],

hi: {
    one: "Yeh problem chhota dikhta hai magar ismein do traps chhupe hain. Paisa double nahi hota, aur balance ek field nahim jise update karo, yeh immutable shares ki list par ek fold hai, aur is tarah ke apps mein log jo bhi bug report karte hain wo in dono mein se ek galat karne se aata hai.",

    brief: {
      why: "Yeh sawaal isliye poochha jaata hai kyunki yeh CRUD jaisa dikhta hai aur hai nahi. Naive version mein kaun kisko kitna owe karta hai uska ek map rakha jaata hai aur usme add hota rehta hai, jisse ek number ban jaata hai jo drift karta hai, jise user ko samjhaya nahi ja sakta, aur jise pichle Tuesday ki expense edit karne par correct nahi kiya ja sakta. Sahi design facts store karta hai aur balances derive karta hai, aur arithmetic integers mein karta hai. Dono kaam mushkil nahi hain, aur pehle draft mein lagbhag koi dono sahi nahi karta.",
      functional: [
        "<b>Expense add karo</b> ek group mein: kisne pay kiya, kitna, aur kin logon mein kaise split hota hai.",
        "<b>Kam se kam teen tareeke se split karo</b>: equally, exact amounts se, aur percentage se. Chautha tareeka add karne se existing code ko haath nahi lagna chahiye.",
        "<b>Balances dikhao.</b> Har person kitna owe karta hai ya kitna use milna hai, per group aur overall.",
        "<b>Settle up.</b> Do logon ke beech ek payment record karo, optionally sabse kam transfers suggest karke jo poore group ko clear kar dein.",
        "<b>Expense edit ya delete karo</b> jo galat enter ho gayi thi, yahi wo jagah hai jahan naive design gir jaata hai."
      ],
      out: ["authentication", "mobile client", "asal mein paisa move karna", "currency conversion, sirf ek currency store karne se zyada kuch nahi", "receipt scanning"],
      nfr: [
        ["Exactness", "the shares always sum to the total", "Approximately nahi. Agar sau rupaye teen logon mein split hokar 99.99 banta hai, to kisi na kisi ko yeh dikh jaata hai aur koi ise explain nahi kar sakta."],
        ["Correctable", "editing an old expense must be safe", "Yahi requirement hai jo mutable running totals ko mana karti hai aur ek ledger rakhne par majboor karti hai."],
        ["Extensible splits", "a new split type touches no existing code", "Is problem mein sirf yahi jagah hai jahan pattern lagana clearly justify hota hai."],
        ["Explainable", "every balance traceable to expenses", "User poochhe main 340 kyun owe karta hoon, to usse ek list milni chahiye, ek number nahi. Yeh data model ki requirement hai, UI ki nahi."]
      ],
      numbers: [
        ["Group size", "2 to about 20", "Chhota. Matlab fewest transfers algorithm worst case mein exponential ho sakta hai aur phir bhi turant khatam hoga, aur yeh zor se bolne layak baat hai."],
        ["Expenses per group", "hundreds to a few thousand", "Itna chhota ki ledger se balance recompute karna sasta hai, yahi cheez derived balances ko practical banati hai."],
        ["Money precision", "integer minor units", "Paise store karo, ya cents. Double 0.1 ko represent nahi kar sakta, aur paisa ek hundredth se off hona rounding error nahi, support ticket hai."],
        ["Split types at launch", "3", "Equal, exact, percentage. Aur ek mahine ke andar chautha, by shares, aayega, yahi strategy ka argument hai."]
      ],
      numbersNote: "Rukne layak number hai <b>integer minor units</b>. Yeh performance decision nahi hai, correctness decision hai, aur pehle minute mein isse choose karna sabse sasta tareeka hai yeh dikhane ka ki tumne paisa involve karne wali cheez ship ki hai."
    },

    stagesIntro: "Chhe stages. Stage 0 mein chaar lines ke andar dono classic bugs hain, aur uske baad har stage ya to kuch nikal rahi hai jo vary karta hai, ya kuch store karne se mana kar rahi hai jise compute hona chahiye.",

    stages: [
      { pressure: "Abhi kuch bhi kharab nahi hua. Pehla draft banao, kyunki iske dono bugs hi is exercise ka point hain aur dono happy path test mein invisible hain.",
        say: "Payer se borrower tak ek nested map, har expense par update, amounts doubles ke roop mein. Yeh demo mein bahut achha lagta hai. Ismein do bugs hain: sau rupaye teen logon mein split hokar 33.333333 teen baar store hote hain, jo ab sau tak sum nahi hota aur har expense ke saath aur drift karta hai, aur koi record nahi hai ki koi number waisa kyun hai, isliye pichle hafte ki expense edit karna namumkin hai.",
        breaks: "Koi Expense object nahi hai, isliye kuch bhi edit, explain, list ya correct nahi ho sakta. Sirf balance exist karta hai, aur apne causes ke bina balance ek aisa number hai jise us insaan ko defend nahi kar sakte jo use owe karta hai." },

      { pressure: "Har requirement jo yahan mushkil hai, editing, explaining, correcting, use original expense ka exist karna zaroori hai. To design ko wo record karna hoga jo hua, na ki jo usne conclude kiya.",
        say: "Chaar nouns. Ek Group mein Users aur Expenses hote hain. Ek Expense mein payer, total, aur Shares ki list hoti hai. Share ek value object hai: ek user aur minor units mein amount, integers, kabhi double nahi. Woh invariant jo yeh sab kaam karwata hai ek line hai: <i>expense ke shares uske total tak exactly sum karte hain.</i> Ise constructor mein enforce karo, phir yeh program mein kahin bhi false nahi ho sakta.",
        breaks: "Shares compute karna service ke andar split type par ek switch statement hai. Shares se ya adjustment se split add karna matlab expenses banane wale method ko edit karna, aur har edit invariant ko risk mein daalta hai." },

      { pressure: "Requirement literally aaj teen split types kehti hai aur kal aur ka ishara deti hai. Yeh sabse saaf signal hai jo koi design de sakta hai ki kuch interface hona chahiye.",
        say: "Ek interface: total aur participants diye jaayein, to Shares ki list wapas karo. Equal, exact aur percentage ise implement karte hain, aur chautha ek naya class hai jisme kahin edit nahi karna padta. Interface ke liye do rules apna kaam karte hain. Yeh Shares return karta hai, expense ko mutate nahi karta, isliye yeh pure hai aur test karna trivial hai. Aur har implementation ko wahi postcondition satisfy karni hoti hai, ki shares total tak sum karte hain, matlab ek shared test sab par chal sakta hai.",
        breaks: "Sau rupaye teen logon mein split hokar 3,333 paise har ek ko aur total 10,000, to ek paisa unaccounted reh jaata hai. Har split type mein yahi problem hai aur service ka koi opinion nahi hai ki remainder kisko milega." },

      { pressure: "Purani expense edit karne ki requirement. Ek stored running total ko correct karna namumkin hai bina uss history ko replay kiye jo tumne rakhi hi nahi, to balance ko un shares se derive karna hoga jo pehle se exist karte hain.",
        say: "BalanceSheet ek function hai, field nahi. Group ki har expense ko fold karo: total ko payer ki net position mein add karo, har share ko uske owner ki position se subtract karo. Result ek signed integer per person hai, jo zero tak sum karta hai, yeh khud ek checkable invariant hai. Ek expense edit karna ab ek fact ka change hai aur balances khud follow karte hain. Aur rounding remainder ko finally ek rule mil jaata hai: extra unit payer ko do, deterministically, aur likh do taaki do runs kabhi disagree na karein.",
        breaks: "Har read par har expense se har balance recompute karna hazaar expenses ke liye theek hai, ek dashak ke liye nahi, aur ab bhi settlement ka koi record nahi hai, jo expense se zyada ek fact hai." },

      { pressure: "Do problems, ek jawab. Corrections traceable hone chahiye, aur expenses kharab connection wale phone se do baar aa sakte hain.",
        say: "Entries append hoti hain aur kabhi modify nahi hoti. Purani expense edit karna ek reversal likhta hai jiske baad ek replacement, isse history khud ko explain karti hai aur user dekh sakta hai ki correction hua hai, chupke se number badalte hue dekhne ke bajaye. Delete karna ek reversal hai jiske baad kuch nahi. Har entry apna client supplied id rakhti hai, to retry karne wala phone wahi entry banata hai, doosri nahi. Aur jab group lamba ho jaaye, balance ka periodic snapshot plus us snapshot ke baad ki entries fold ko sasta rakhti hain, bina balance ko kabhi mutable field banaye.",
        breaks: "Balances sahi hain aur instructions ke roop mein bekaar hain. Chhe logon ka group ek holiday khatam karta hai chhe numbers ke saath, aur kisi ko nahi pata kaun kisko pay kare." },

      { pressure: "Balance ek state hai; settlement ek instruction hai. Ek ko doosre mein badalna ek chhota optimisation problem hai, aur is design mein yahi ek jagah hai jahan obvious jawab shaayad galat ho.",
        say: "Settlement service signed balances leta hai aur transfers banata hai. Greedy version baar baar sabse bade debtor ko sabse bade creditor se match karta hai, jo fast hai, explain karna aasan hai, aur hamesha minimal nahi hota. Minimal version exponential hai, aur bees logon tak yeh phir bhi turant hota hai, to chaho to exact answer afford kar sakte ho. Zyada zaroori product judgement yeh hai: simplification badal deta hai kaun kisko pay karta hai, isliye Anita ek dinner ke liye Rahul ko pay karti hai jisme Rahul tha hi nahi. Ise opt in rakho, aur settlement record karna sirf ek aur ledger entry hai, yahi wajah hai ki isse support karne ke liye design mein kahin aur kuch badalna nahi pada." }
    ],

    boxesIntro: "Baarah types, aur design ko carry karne wale do hain Share, kyunki yeh exactness ko ek umeed ki jagah invariant banata hai, aur LedgerRepository, kyunki yeh correction ko possible hi banata hai.",

    boxes: [
      { job: "Translates a request into a service call and a result into a response.".replace(/.*/, "Ek request ko service call mein aur result ko response mein translate karta hai."),
        why: "Yeh boundary marks karta hai. Iske right mein sab kuch bina kisi framework ke test hota hai, jo ek LLD round asal mein dikhwana chahta hai.",
        forced: "Kuch nahi. Yeh dikhane ke liye khincha gaya ki design kahan se shuru hota hai.",
        alts: [["Business logic in the controller", "clean design ke degrade hone ka usual tareeka, kyunki controllers wahi classes hain jinko koi unit test nahi karta."]],
        pros: ["Serialisation aur status codes ko domain se bahar rakhta hai."],
        cons: ["Ek patla layer jiski value tab tak invisible rehti hai jab tak koi usme koi rule na daale."],
        cost: "Ek chhota class.",
        fails: "Split validation yahan bhi dikhti hai aur strategy mein bhi, dono disagree karte hain, aur ek invalid expense ek raste se andar aa jaati hai.",
        say: "Map karo aur delegate karo. Validation us object ki hai jo invariant ka owner hai, splits ke liye yeh strategy hai." },

      { job: "Coordinate karo: group dhoondo, shares banao, expense create karo, ledger mein append karo.",
        why: "Koi to is sequence ka owner hona chahiye. Ise entities se alag rakhna hi Expense ko repositories ke baare mein jaanne se rokta hai.",
        forced: "Stage 0, aur uske baad ka har stage isse kuch na kuch nikaalta gaya.",
        alts: [["Putting the flow on Group", "aggregate root ko persistence aur split strategies par ek dependency mil jaati hai, jo hataayi gayi coupling se bhaari hai."], ["Splitting into ExpenseService and BalanceService", "reasonable hai, aur balance ka kaam pehle se ek alag collaborator hai, to split se mostly ek lambi class list milti hai."]],
        pros: ["Poora flow ek hi jagah readable hai.", "Koi state nahi rakhta, to fakes se test hota hai, koi fixtures nahi chahiye."],
        cons: ["Yahi wo jagah hai jahan koi objection na kare to unrelated features add ho jaate hain."],
        cost: "Chaar collaborators wala ek class.",
        fails: "Currency conversion, notifications aur receipt parsing sab yahan chhe mahine mein aa jaate hain, aur yeh better dependencies ke saath phir se stage 0 ban jaata hai.",
        say: "Yeh sirf operations ka order rakhta hai aur kuch nahi. Ise padhne mein aur test karne mein boring hona chahiye." },

      { job: "Members ka ek set aur unke against record hui expenses.",
        why: "Yeh aggregate root hai aur consistency ki unit hai: balances per group hain, membership per group hai, aur settlements ek group ko clear karte hain.",
        forced: "Stage 1.",
        alts: [["No group, just pairwise expenses between users", "one to one expenses aise hi kaam karte hain, aur group balance ek implicit set par query ban jaata hai jise har feature ko dobara banana padta hai."], ["A group as a tag on an expense", "wahi information, koi owner nahi, to koi enforce nahi kar sakta ki share group ke kisi member ki hai."]],
        pros: ["Membership validation ka ek owner hai: group ke bahar kisi ke liye share boundary par reject ho jaati hai.", "Balances aur settlements naturally scoped hain."],
        cons: ["Non zero balance wale member ka group chhodna ek genuinely awkward case hai jiska jawab isi class ko dena hai.", "Groups ke across overall balances ek field nahi, doosri query hai."],
        cost: "Har group ke liye ek object, jisme member references aur expense ids hoti hain.",
        fails: "Koi paisa owe karte hue group se remove ho jaata hai aur unka balance chupke se sheet se gayab ho jaata hai. Removal ke liye zero balance zaroori hona chahiye, ya group ke bahar ek debt mein convert hona chahiye.",
        say: "Group membership ka owner hai, to yahi wo jagah hai jahan non member ki share reject hoti hai. Root par yeh enforce karne se har jagah se ek check hat jaata hai." },

      { job: "Ek person, shares aur balances se id se reference hota hai.",
        why: "Yeh jaan boojh kar ek thin entity hai. Yahan person ke baare mein jo bhi matter karta hai, wo user mein nahi, shares mein hai.",
        forced: "Stage 1.",
        alts: [["Using a plain string id everywhere", "kam types, aur ab koi display name ya currency preference carry nahi kar sakta, aur har method signature ek string ban jaata hai."]],
        pros: ["Id se identity shares ko comparable, hashable aur maps mein safe banati hai.", "Display concerns ko arithmetic se door rakhti hai."],
        cons: ["User delete karna ek referential problem hai: unki shares doosron ki history ka hissa hain aur simply gayab nahi ho saktin."],
        cost: "Trivial.",
        fails: "Ek user delete ho jaata hai aur purane balances unexplainable ho jaate hain. Delete kabhi mat karo, deactivate karo, ledger wali kisi bhi cheez mein hamesha.",
        say: "Id se reference hota hai, kabhi embed nahi hota. Share ek user id rakhti hai, user nahi, kyunki profile badalne ke baad bhi ledger ka matlab bana rehna chahiye." },

      { job: "Kisne pay kiya, kitna, kaunsi currency mein, kab, aur wo shares ki list jo total ka hisaab deti hai.",
        why: "Yeh fact hai. Har requirement jo stage 0 satisfy nahi kar paaya, editing, explaining, reversing, isi object ke exist karne par depend karti hai.",
        forced: "Stage 1.",
        alts: [["Storing only the resulting balance deltas", "chhota hai, aur explanation phenk deta hai, jo ek requirement thi."], ["Subclasses per split type, EqualExpense and so on", "split rule sirf creation par ek baar use hone wala behaviour hai, expense ki hamesha rehne wali property nahi. Creation par strategy hamesha rehne wali hierarchy se behtar hai."]],
        pros: ["Construction ke baad immutable, to kuch bhi drift nahi kar sakta.", "Constructor hi wo ek jagah hai jahan sum invariant check hota hai, isliye yeh hamesha hold karta hai.", "Edits mutations nahi, nayi entries ban jaate hain, yahi cheez history ko honest banati hai."],
        cons: ["Immutability ka matlab hai edit se do aur entries banti hain, to user actions ki ginti se ledger tezi se badhta hai."],
        cost: "Kuch shares wala har expense ke liye ek object.",
        fails: "Koi amount ke liye ek setter add kar deta hai aur shares ab total tak sum nahi karte. Ise immutable rakho aur invariant ko constructor mein rehne do.",
        say: "Immutable, sum invariant constructor mein check hota hai. Agar shares total tak add nahi hote, to object ban hi nahi sakta, isliye kisi aur code ko check karne ki zaroorat nahi." },

      { job: "Ek expense mein ek person ka hissa, integer minor units mein.",
        why: "Yeh chhota sa class hai jahan poore design ki correctness rehti hai. Yeh unit ko explicit banata hai, floating point ko mana karta hai, aur isi par sum invariant likha jaata hai.",
        forced: "Stage 1.",
        alts: [["A double amount", "default hai, aur 0.1 binary floating point mein representable nahi hai, to totals drift karte hain aur comparisons aise fail hote hain jo bhoot jaisi lagte hain."], ["BigDecimal", "correct aur verbose, jisme scale manage karni padti hai aur har operation par rounding mode specify karna padta hai. Bank ke liye sahi, yahan zaroorat se zyada bhaari."], ["A Money value object with amount and currency", "isi ka better version, aur jis moment doosri currency aaye, main ise isi mein grow karta."]],
        pros: ["Integers addition ko exact aur comparison ko trivial banate hain.", "Unit type mein hai, to kisi ko yaad nahi rakhna padta ki number rupaye hai ya paise.", "Remainder visible ho jaata hai: integers ke saath ek missing paisa rounding error mein chhup nahi sakta."],
        cons: ["Har input aur output ko boundaries par conversion chahiye, aur ek bhool jaana matlab sau ka factor.", "Percentages ko phir bhi division chahiye, to remainder rule ki zaroorat rehti hai."],
        cost: "Do field wala ek immutable value object.",
        fails: "Ek code path rupaye store karta hai aur doosra paise. Constructor ko sirf minor units lene do aur field ka naam aisa rakho ki galat na padha jaaye.",
        say: "Integer minor units. Yeh pehla decision hai jo main lunga aur jispe compromise nahi karunga, kyunki baad mein mila hua money bug data mein unfixable hota hai." },

      { job: "Total aur participants diye jaayein, to shares return karo.",
        why: "Split rule wahi cheez hai jo requirements kehti hain vary karti hai, aur yeh product reasons se product timescale par vary karti hai.",
        forced: "Stage 2.",
        alts: [["A switch on a split type enum", "ek class kam, aur har naya type us method ko edit karta hai jo expenses banata hai, jahan invariant enforce hota hai."], ["A closure or lambda per split", "itni chhoti cheez ke liye genuinely theek hai, aur validation aur shared postcondition test rakhne ki named jagah kho deta hai."]],
        pros: ["Naya split type ek naya class hai aur kuch aur nahi badalta.", "Pure: inputs se outputs, koi state nahi, to tests ek ek line ke hain.", "Ek shared property test, ki shares total tak sum karte hain, har implementation par chalta hai, future waalon par bhi."],
        cons: ["Har type ko alag inputs chahiye: exact ko amounts, percentage ko percentages. Ya to interface parameters ka ek bag leta hai ya har strategy apne parameters ke saath construct hoti hai, aur doosra cleaner hai par lamba."],
        cost: "Ek interface, har split type ke liye ek class.",
        fails: "Interface har naye split type ke liye ek parameter grow karta hai jab tak paanch nullable arguments na le le. Har strategy ko apne parameters ke saath construct karo aur method signature ko total aur participants tak seemit rakho.",
        say: "Strategy ko apni configuration ke saath construct karo, phir split(total, participants) call karo. Isse interface hamesha narrow rehta hai chahe kitne bhi types aayein." },

      { job: "Teen concrete split rules, har ek apni validation aur apna remainder ke liye responsible.",
        why: "Teen implementations hi interface ko real banate hain, aur har ek ki genuinely alag validation rule hai, yahi shared switch ke against argument hai.",
        forced: "Stage 2.",
        alts: [["One class with a mode flag", "interface delete hokar field ke roop mein reimplement ho jaata hai."]],
        pros: ["Exact validate karta hai ki amounts total tak sum karte hain. Percentage validate karta hai ki percentages sau tak sum karte hain. Equal kuch validate nahi karta aur remainder distribute karta hai. Teen alag rules, teen classes.", "Har ek chand lines ka hai aur do tests se fully covered hai."],
        cons: ["Remainder rule sabme identical hona chahiye warna do split types disagree karenge ki extra unit kisko milega."],
        cost: "Teen chhote classes.",
        fails: "33, 33 aur 34 ke percentages validate ho jaate hain ki sau tak sum karte hain, aur resulting paise division ki wajah se phir bhi total tak sum nahi karte. Percentages validate karo aur phir actual remainder distribute karo, validation ke bharose mat raho ki usne pehle hi theek kar diya.",
        say: "Validation us strategy ki hai jiska opinion hai. Equal ka koi nahi, exact aur percentage dono ka apna apna hai, aur yeh logic service mein bilkul nahi hona chahiye." },

      { job: "Ledger ko fold karke har person ke liye ek signed net position banao.",
        why: "Balance derived state hai. Ise store karna editing ko namumkin banata hai aur drift ko avoidable nahi rehne deta, aur dono brief mein requirements thi.",
        forced: "Stage 3.",
        alts: [["A stored balance updated on each expense", "O(1) reads, aur ise correct nahi kiya ja sakta, explain nahi kiya ja sakta, aur agar koi update miss ya do baar apply ho jaaye to drift karta hai."], ["Event sourcing with projections", "yahi cheez, formalised. Isse aage kya grow hoga yeh naam lena worth hai, aur brief ke scale ke liye informal version kaafi hai."]],
        pros: ["Construction se correct: expenses se disagree nahi kar sakta kyunki wahi se compute hota hai.", "Expense edit karne ke liye koi balance maintenance nahi chahiye.", "Sab balances ka sum zero hota hai, jo ek free assertion hai jo tumhe actually likhni chahiye."],
        cons: ["Entries ki ginti mein O(n) per read, yahi wajah hai snapshots ki.", "Snapshot ek cached balance hai, jo thoda sa wahi wapas le aata hai jise avoid kiya tha, ab bas ledger ke saath ek defined aur testable relationship ke saath."],
        cost: "Kuch hazaar entries par ek fold. Microseconds.",
        fails: "Ek group das saal ki entries jama kar leta hai aur balance reads slow ho jaate hain. Periodically snapshot karo aur sirf snapshot ke baad ki entries fold karo. Snapshot ko ek background job mein full recompute se verify karo, aur ise skip karne ke liye kabhi utna trust mat karo.",
        say: "Hamesha derived, ek assertion ke saath ki balances zero tak sum karte hain. Agar wo assertion kabhi fire ho, to matlab kahin share invariant violate hua, aur mujhe yeh turant pata chalna chahiye, support ticket mein nahi." },

      { job: "Entries append karo, unhe order mein wapas padho, aur periodic snapshots rakho.",
        why: "Append only hi corrections ko traceable aur idempotency ko possible banata hai. Yeh wo akela decision hai jo ise CRUD se kuch aisi cheez banata hai jise paisa involve karne ke liye trust kiya ja sake.",
        forced: "Stage 4.",
        alts: [["A mutable expenses table with updates and deletes", "obvious design, aur ek edit purani version ko mita deta hai, to koi nahi dekh sakta ki correction hua tha."], ["Soft deletes on a mutable table", "aadha waha tak pahunchta hai, aur yeh deletes rakhta hai magar edits kho deta hai, jo zyada common correction hai."]],
        pros: ["Har entry ka apna client supplied id hai, to kharab connection wale phone ke retries naturally idempotent hain.", "Corrections reversals ke roop mein visible hain, jo user asal mein dekhna chahta hai.", "Poori balance history kisi bhi point in time ke liye reconstruct ho sakti hai, jo disputes ka jawab deta hai."],
        cons: ["Yeh monotonically badhta hai aur kabhi shrink nahi hota.", "Balance padhne ka matlab kai rows padhna hai, isliye snapshots hain.", "Users edit ke terms mein sochte hain, to interface ko ek reversal aur ek replacement ko ek action ki tarah present karna padta hai."],
        cost: "Har group mein kuch hazaar chhoti entries, plus har kuch sau ke baad ek snapshot.",
        fails: "Koi repository mein ek update method add kar deta hai kyunki ek baar convenient tha. Mat do. Us method ka na hona hi design hai.",
        say: "Append only, har entry ka ek client supplied id, speed ke liye snapshots. Ek edit ek reversal plus ek replacement hai, user ko edit ki tarah dikhta hai aur do facts ki tarah store hota hai." },

      { job: "Balances ke set ko transfers ki list mein badlo, aur jab payment ho to record karo.",
        why: "Balance batata hai kya sach hai; settlement batata hai kya karna hai. Yeh alag sawaal hain aur inhe mix karna ek optimisation algorithm ko reporting class ke andar daal deta hai.",
        forced: "Stage 5.",
        alts: [["Showing raw pairwise debts with no suggestion", "honest hai, jo asal mein kisko owe karta tha usse faithful hai, aur chhe logon ke group ko khud sort karne ke liye pandrah possible payments chhod deta hai."], ["Always simplifying", "sabse kam transfers aur unn logon ke beech debts bana deta hai jinhone kabhi saath khana nahi khaya, jo users ko confusing lagta hai aur kabhi kabhi object bhi karte hain."]],
        pros: ["Settlement record karna sirf ek aur ledger entry hai, to isse support karne ke liye design mein aur kuch badalna nahi pada.", "Suggestion aur recording alag hain, to group suggestion ignore karke jise chahe use pay kar sakta hai."],
        cons: ["Simplification ek algorithm ke bhes mein product decision hai, aur alag apps ise jaan boojh kar alag tarike se karte hain."],
        cost: "Chhota. Groups zyada se zyada bees logon ke hote hain.",
        fails: "Ek suggested transfer ko ek obligation ki tarah dikhaya jaata hai aur koi do baar pay kar deta hai, ek baar suggestion ke hisaab se aur ek baar jaisa unhe yaad tha. Settlements explicitly record honi chahiye, kabhi ek suggestion dikhne se infer nahi honi chahiye.",
        say: "Suggest karo, decide mat karo. Aur settlement ko ek ledger entry ki tarah record karo taaki balance usi fold se nikle jisse baaki sab nikalta hai." },

      { job: "Net balances ke set ko jitna ho sake kam transfers mein reduce karo.",
        why: "Yeh alag class isliye hai kyunki yeh ek trade-off wala algorithm hai, aur kyunki ek group ise off kar sakna chahiye.",
        forced: "Stage 5.",
        alts: [["Greedy, largest debtor to largest creditor", "zyada se zyada n-1 transfers, explain karna aasan, aur hamesha minimal nahi. Lagbhag hamesha yahi ship karne layak hai."], ["Exact minimum via subset partitioning", "genuinely minimal aur exponential, aur bees logon ke saath yeh phir bhi turant hota hai, to yahan yeh affordable hai jabki scale par nahi hota."]],
        pros: ["n squared se n-1 transfers tak, bahut kam.", "Chand integers par chalta hai, to is size par kuch cost nahi karta."],
        cons: ["Un logon ke beech debts banata hai jinka kabhi transaction nahi hua, jo confusing hai aur kabhi kabhi socially galat bhi.", "Explanation kho deta hai: main tumhe 400 doonga in teen dinners ki wajah se, ban jaata hai main tumhe 400 doonga arithmetic ki wajah se."],
        cost: "Bees logon par negligible, exact version ke liye bhi.",
        fails: "Simplification default se chalta hai aur user nahi dekh paata ki wo ek near stranger ko kyun owe karta hai. Ise per group opt in rakho, aur underlying pairwise history hamesha available rakho.",
        say: "Default greedy, per group opt in, aur raw pairwise view hamesha available. Optimisation aasan hai; yeh jaanna ki yeh ek product decision hai, wahi asli jawab hai." }
    ],

    patternsIntro: "Ek pattern clearly justified hai, ek aur arguable hai, aur is problem ka interesting part yeh hai ki kitne well known patterns applicable lagte hain aur hote nahi. Yeh keh paana ki kyun nahi, ek pattern use karne jitna hi valuable hai.",

    patterns: [
      { what: "Ek interface, har split type ke liye ek implementation, har ek apni configuration ke saath construct hoti hai.",
        varies: "Split rule. Launch par teen, ek mahine mein chautha, har ek ki validation alag.",
        without: "Ek switch statement us method ke andar jo expenses banata hai, jise har baar naya split type add hone par edit karna padta hai, us invariant ke bilkul paas jise usse todna nahi chahiye.",
        cost: "Ek interface aur har type ke liye ek chhota class. Interface ko narrow rakhna zaroori hai warna har implementation ke liye ek parameter jama ho jaata hai." },

      { what: "Immutable, value se equal, integer minor units, unit type mein encoded.",
        varies: "Kuch nahi. Yeh extension allow karne ke liye nahi, bug ki ek poori category ko impossible banane ke liye exist karta hai.",
        without: "Doubles, drift, aur ek support queue jo un balances se bhari hai jo ek paisa se off hain aur explain nahi ho sakte.",
        cost: "Har boundary par conversion, aur kabhi bhi floating point amount introduce na karne ka discipline." },

      { what: "Append only entries, unse fold hokar balances, corrections reversals ki tarah.",
        varies: "Kuch nahi varies karta. Yeh correctability, idempotency aur explainability kharidta hai, jo sab requirements thi.",
        without: "Mutable running totals jo edit nahi ho sakte, audit nahi ho sakte aur drift karte hain.",
        cost: "Snapshots add karne tak O(n) reads, aur ek badhta store. Dono group scale par acceptable hain aur dono kehna zaroori hai." },

      { what: "Listeners jinhe pata chale jab expense add ho, push notifications aur ek activity feed ke liye.",
        varies: "Un cheezon ka set jinhe fikar hai, jo genuinely badhne wala hai.",
        without: "Service se direct calls, har feature ke liye ek line.",
        cost: "Isme kuch galat nahi, aur stated requirements ke liye yeh out of scope hai. Agar extend karne ko kaha jaaye to yehi hai jo main sabse pehle add karunga, aur main woh keh dunga bina poochhe add karne ke bajaye." },

      { what: "Expense types ki hierarchy par alag cheezein compute karne ke liye ek visitor.",
        varies: "Kuch nahi. Ek hi Expense type hai. Split behaviour ek strategy mein nikaal diya gaya, to visit karne layak koi hierarchy hi nahi bachi.",
        without: "Expense par ek method, ya ek function jo ek Expense leta hai.",
        cost: "Do interfaces aur ek double dispatch, us problem ko solve karne ke liye jo design pehle hi hata chuka hai. Yeh ek accha example hai us pattern ka jo tabhi applicable banta hai jab ek pehle wali galti kar chuke ho." },

      { what: "Kahin se bhi reachable ek single global ExpenseService.",
        varies: "Kuch nahi, aur yeh ek dependency chhupa deta hai jo constructor ko declare karni chahiye.",
        without: "Ek banao aur inject karo. Wahi instance, ab tests mein replaceable.",
        cost: "Global mutable state, parallel tests ke against, aur ek invisible dependency graph. Yeh ek common interview trap hai aur ise politely refuse karna hi sahi jawab hai." }
    ],

    flowsIntro: "Do traces. Doosra wala, pichle hafte ki expense edit karna, wahi hai jo ek ledger wale design ko bina ledger wale se alag karta hai, aur yahi wo follow up sawaal hai jiske liye yeh problem exist karta hai.",

    flows: [
      { n: "Ek expense add karna",
        steps: [
          ["Controller <code>addExpense(groupId, payerId, totalMinor, strategy, participants, clientId)</code> call karta hai."],
          ["Service group load karta hai aur check karta hai ki payer aur har participant member hain. Membership group ka invariant hai, to group hi jawab deta hai."],
          ["Strategy shares banata hai. Yeh apne inputs validate karta hai, exact amounts total tak sum karte hain, percentages sau tak sum karte hain, aur remainder shared rule se distribute hota hai."],
          ["Expense constructor assert karta hai ki shares total tak sum karte hain. Agar nahi karte, to object ban hi nahi sakta aur downstream kisi ko dobara check nahi karna padta."],
          ["Entry client supplied id ke saath ledger mein append hoti hai. Agar wo id pehle se exist karti hai, to existing entry return ho jaati hai aur kuch likha nahi jaata."],
          ["Balances ko touch nahi kiya jaata, kyunki balances store nahi hote. Agla read nayi entry ko fold kar leta hai."]
        ] },
      { n: "Pichle Tuesday ki expense edit karna",
        note: "Yahi trace hai jo is page ke har design decision ko justify karta hai. Isse ek stored running total ke against narrate karke dekho aur girte hue dekho.",
        steps: [
          ["User ek purani expense ka amount badalta hai. Kuch mutate nahi hota."],
          ["Ek reversal entry append hoti hai: wahi shares signs flip karke, original entry id ko reference karte hue."],
          ["Corrected amount aur freshly computed shares ke saath ek replacement entry append hoti hai."],
          ["Agla balance read poore ledger ko fold karta hai aur sahi numbers deta hai, system mein kahin bhi balance maintenance code ke bina."],
          ["Activity view ek edit dikhati hai, kyunki dono entries linked hain. User dekhta hai ki correction hua hai, na ki koi number apne aap badal gaya."],
          ["Agar purani amount ke against pehle se koi settlement record ho chuki thi, to wo waisi hi rehti hai. Balance ab phir se non zero hai, jo sahi aur honest hai."]
        ] }
    ],

    tradeoffsIntro: "Chaar decisions, aur pehla waala really negotiable nahi hai. Yeh yahan isliye hai taaki tum sun sako iske against arguments kaise sunayi dete hain.",

    tradeoffs: [
      { a: ["Integer minor units", "Exact addition, exact comparison, aur remainder visible hai to usse ek rule dena zaroori hai."],
        b: ["Doubles, ya BigDecimal", "Doubles simple aur galat hain. BigDecimal correct hai, verbose hai, aur har operation par scale aur rounding mode chahiye."],
        flip: "tumhe fractional minor units chahiye, jaise currency conversion ya interest. Tab BigDecimal, scale fix aur stated ke saath. Doubles kabhi nahi, kisi bhi cheez ke liye, kabhi bhi." },
      { a: ["Ledger se derive hue balances", "Editing kaam karta hai, corrections visible hain, aur numbers expenses se disagree nahi kar sakte."],
        b: ["Stored running balances", "O(1) reads, aur wo history ke bina edit namumkin hai jo tumne rakhi hi nahi."],
        flip: "reads eventually mehenge ho jaate hain. Tab ek snapshot add karo, jo ledger ke saath ek defined relationship wala cache hai, aur ek background job rakho jo use verify kare." },
      { a: ["Har split type ke liye strategy", "Naye types naye classes hain. Har ek apni validation ka owner hai."],
        b: ["Split type enum par ek switch", "Ek class, saara logic ek jagah visible, aur har naya type us method ko edit karta hai jisme invariant hai."],
        flip: "genuinely hamesha ek hi split type rahega. Yeh yeh problem nahi hai, aur requirements ne yahi kaha hai." },
      { a: ["Simplified settlements suggest karo, opt in", "Group chahe to zyada se zyada n-1 transfers, aur raw pairwise truth hamesha available."],
        b: ["Hamesha raw pairwise debts dikhao", "Kaun kisko owe karta tha usse perfectly faithful, aur chhe logon ke group ke liye pandrah payments."],
        flip: "group do logon ka hai, jahan simplification identity function hai aur option sirf noise hai. Chhote groups ko aisi setting nahi dikhani chahiye jo kuch na kare." }
    ],

    next: [
      "<b>Multiple currencies.</b> Share Money ban jaata hai currency ke saath, aur balance har currency ke liye ek number ban jaata hai, kyunki currencies ke across netting ka matlab hai ek rate aur ek moment choose karna, jo ek product decision hai.",
      "<b>Ek activity feed.</b> Woh Observer jo jaan boojh kar chhoda gaya tha, jab notifications guess nahi, requirement ban jaayen.",
      "<b>Recurring expenses.</b> Har mahine ka rent ek template plus ek scheduler hai, aur isse ordinary ledger entries banni chahiye taaki downstream kuch na badle.",
      "<b>Balance ke saath group chhodna.</b> Zyadatar apps mein genuinely unsolved case, aur honest jawab yeh hai ki pehle settle karwao ya ise group ke bahar ek debt mein convert karo."
    ]
  }
},

/* ==========================================================================
   8. LLD: L7 LOAD BALANCER
   ========================================================================== */
{
  id: "loadbalancer-lld", kind: "lld", n: "L7 load balancer", sub: "Go, Fiber, four strategies",
  tags: ["strategy", "concurrency", "lock ordering", "health checking", "shipped code"],
  one: "A real implementation rather than a whiteboard sketch, which means the interesting parts are not the four algorithms. They are which mutex protects what, the lock ordering that stops two goroutines deadlocking, and the four small defects that survive a code review and show up under load.",

  brief: {
    why: "Every other page here designs something. This one reviews something already written, which is a different and more useful exercise: the algorithms are the easy part and they are all textbook, while the state they share is the part that decides whether the thing works at 10,000 requests per second. Read this looking for the mutexes, not the strategies. The load balancer is also the one component whose own failure takes down everything behind it, so its failure modes deserve more attention than its happy path.",
    functional: [
      "<b>Proxy</b> any HTTP request to one of several backends and stream the response back.",
      "<b>Choose a backend</b> by one of four strategies, selected by configuration: round robin, least connection, consistent hashing on client IP, or random.",
      "<b>Register and deregister</b> backends at runtime over HTTP, without a restart.",
      "<b>Detect dead backends</b> two ways: by polling them, and by noticing a request to one failed.",
      "<b>Rate limit</b> per client IP, atomically, so several load balancer instances share one budget."
    ],
    out: ["TLS termination", "request retries and circuit breaking", "sticky sessions beyond consistent hashing", "layer 4 balancing", "backend autoscaling"],
    nfr: [
      ["Correctness under concurrency", "no data race, no deadlock", "Every request runs in its own goroutine and they all touch one shared pool. This is the requirement the whole design is about, and it is the one the race detector will have an opinion on."],
      ["Latency added", "sub millisecond in the balancer itself", "The balancer is pure overhead on somebody else's request. Anything it allocates per request, it allocates a hundred thousand times a second."],
      ["Failure detection", "seconds, not minutes", "A dead backend that keeps receiving traffic is worse than one fewer backend. This is why there are two detection mechanisms rather than one."],
      ["Availability of the balancer", "higher than anything behind it", "It is a single point of failure by construction. Every design decision that adds in process state makes running a second copy harder, which is the tension the last stage is about."]
    ],
    numbers: [
      ["Virtual nodes per server", "150", "The ring places 150 points per backend rather than one, because one point per server gives wildly uneven arcs. 150 brings the standard deviation of load to roughly 5%, and it is the number most implementations settle on."],
      ["Ring lookup", "binary search over 150 times N points", "Three backends is 450 points, so a lookup is about nine comparisons. The ring is sorted once on change and read on every request, which is exactly the right way round."],
      ["Health poll interval", "10 seconds", "Worst case detection by polling alone is 10 seconds plus the request timeout. That is why passive detection exists: it catches a dead backend on the first failed request instead of the next poll."],
      ["Proxy timeout", "10 seconds", "Both on the client and on the request context. Generous, and it is the ceiling on how long one dead backend can hold a goroutine."],
      ["Shutdown grace", "10 seconds", "In flight requests are allowed to finish before the process exits. Cheap to add and it is what makes a deploy invisible."],
      ["Round robin selection", "one allocation per request", "The healthy list is rebuilt on every call. Correct, and it is the one hot path allocation in the design."],
      ["Rate limit state", "one Redis key per client", "In Redis rather than in memory, which is the single decision that says this was meant to run as more than one instance."]
    ],
    numbersNote: "The row worth arguing about is the last one. Rate limit state was deliberately put somewhere shared, and the server pool and health state were not. That asymmetry is the most interesting thing in this design and the whole subject of stage 5."
  },

  stagesIntro: "Six stages. The first two are about shared state, the middle two about the algorithms and the lock ordering they force, and the last two about failure and about the fact that the balancer itself has to survive.",

  stages: [
    { t: "0. One handler, one backend",
      pressure: "Nothing yet. A reverse proxy is about fifteen lines: read the request, rewrite the URL, forward it, stream the response back. Worth drawing so that everything after it is visibly a response to something.",
      nodes: [
        { id: "client", l: "Client", s: "any HTTP request", col: 0, row: 0, r: "client" },
        { id: "fiber", l: "Fiber app", s: "one handler, port 4000", col: 1, row: 0, r: "svc" },
        { id: "backends", l: "Backend", s: "one, hardcoded", col: 2, row: 0, r: "ext" }
      ],
      edges: [{ a: "client", b: "fiber", l: "request" }, { a: "fiber", b: "backends", l: "forward" }],
      add: ["client", "fiber", "backends"],
      say: "Fiber sits on fasthttp, so the handler is cheap and the framework is not the bottleneck. At this point the load balancer balances nothing: it is a proxy with the destination compiled in. Everything from here is about the destination becoming a choice, and about that choice being made by many goroutines at once.",
      breaks: "A second backend means a list, the list has to change at runtime because backends come and go, and every request runs in its own goroutine. A plain Go slice read by a thousand goroutines while one appends to it is a data race, and Go will not stop you writing it." },

    { t: "1. A pool that many goroutines touch at once",
      pressure: "Shared mutable state. This is the whole problem: one list of backends, read on every request, written by the registration API and by both health mechanisms, from goroutines that know nothing about each other.",
      nodes: [
        { id: "client", l: "Client", col: 0, row: 2, r: "client" },
        { id: "fiber", l: "Fiber app", s: "handler per request", col: 1, row: 2, r: "svc" },
        { id: "proxy", l: "Reverse proxy", s: "http.Client, 10s timeout", col: 2, row: 3, r: "svc" },
        { id: "pool", l: "Pool", s: "RWMutex over the slice", col: 3, row: 1, r: "svc" },
        { id: "backends", l: "Backends", s: "registered at runtime", col: 3, row: 3, r: "ext" },
        { id: "server", l: "Server", s: "URL, healthy, conns", col: 4, row: 1, r: "entity" }
      ],
      edges: [
        { a: "client", b: "fiber", l: "request" },
        { a: "fiber", b: "pool", l: "pick one", bend: 0.4 },
        { a: "fiber", b: "proxy", l: "forward", bend: 0.7 },
        { a: "proxy", b: "backends", l: "HTTP" },
        { a: "pool", b: "server", l: "has *" }
      ],
      add: ["pool", "server", "proxy"],
      say: "One type owns the list and nothing outside it may touch the slice. Reads take a read lock and writes take a write lock, which is right because reads outnumber writes by many thousands to one. The per server connection counter is an atomic rather than a mutex field, so incrementing it needs only the read lock, which is the difference between a counter that scales and one that serialises every request in the process.",
      breaks: "The pool can hand out a backend safely, and it only knows one way to choose: take the next one. Round robin is wrong for backends of different sizes, wrong for long lived connections, and wrong when you want the same client to keep landing on the same backend." },

    { t: "2. The choice varies, so it gets an interface",
      pressure: "Four different ways to pick a backend, chosen by configuration at startup, each with a different notion of what fair means. That is the textbook signal for a strategy, and it is the pattern this codebase actually uses.",
      nodes: [
        { id: "client", l: "Client", col: 0, row: 2, r: "client" },
        { id: "fiber", l: "Fiber app", col: 1, row: 2, r: "svc" },
        { id: "selector", l: "selectServer", s: "one dispatch point", col: 2, row: 1, r: "iface" },
        { id: "proxy", l: "Reverse proxy", col: 2, row: 3, r: "svc" },
        { id: "pool", l: "Pool", s: "RWMutex over the slice", col: 3, row: 1, r: "svc" },
        { id: "strat", l: "Round robin, least conn, random", s: "three of the four", col: 3, row: 2, r: "impl" },
        { id: "backends", l: "Backends", col: 3, row: 3, r: "ext" },
        { id: "server", l: "Server", s: "URL, healthy, conns", col: 4, row: 1, r: "entity" }
      ],
      edges: [
        { a: "client", b: "fiber", l: "request" },
        { a: "fiber", b: "selector", l: "which one?", bend: 0.4 },
        { a: "fiber", b: "proxy", l: "forward", bend: 0.7 },
        { a: "selector", b: "strat", l: "dispatch" },
        { a: "strat", b: "pool", l: "queries" },
        { a: "proxy", b: "backends", l: "HTTP" },
        { a: "pool", b: "server", l: "has *" }
      ],
      add: ["selector", "strat"],
      say: "One function decides, with a switch on a configured strategy name and a sensible default, and every strategy has the same shape: take the healthy set, apply a rule, return a URL or an error. In Go this is usually a function type rather than an interface, because the strategies have one method and no state of their own. Round robin uses an atomic counter modulo the healthy count, least connection scans for the smallest atomic counter, and random picks one. All three are a handful of lines, which is the point: the algorithms were never the hard part.",
      breaks: "Three of the four strategies are stateless. Consistent hashing is not: it needs a sorted ring that has to be kept in step with the pool, which means a second piece of shared state and therefore a second mutex, which is where deadlocks come from." },

    { t: "3. Consistent hashing, and the lock you must not hold",
      pressure: "A second mutex. The moment two locks exist and any code path can take both, they have to be taken in a defined order or two goroutines will each hold one and wait for the other, forever.",
      nodes: [
        { id: "client", l: "Client", col: 0, row: 2, r: "client" },
        { id: "fiber", l: "Fiber app", col: 1, row: 2, r: "svc" },
        { id: "selector", l: "selectServer", s: "one dispatch point", col: 2, row: 1, r: "iface" },
        { id: "proxy", l: "Reverse proxy", col: 2, row: 3, r: "svc" },
        { id: "pool", l: "Pool", s: "builds the healthy set", col: 3, row: 1, r: "svc" },
        { id: "strat", l: "Round robin, least conn, random", col: 3, row: 2, r: "impl" },
        { id: "backends", l: "Backends", col: 3, row: 3, r: "ext" },
        { id: "server", l: "Server", col: 4, row: 1, r: "entity" },
        { id: "ring", l: "HashRing", s: "150 vnodes, own RWMutex", col: 4, row: 2, r: "impl" }
      ],
      edges: [
        { a: "client", b: "fiber", l: "request" },
        { a: "fiber", b: "selector", l: "which one?", bend: 0.4 },
        { a: "fiber", b: "proxy", l: "forward", bend: 0.7 },
        { a: "selector", b: "strat", l: "dispatch" },
        { a: "strat", b: "pool", l: "queries" },
        { a: "proxy", b: "backends", l: "HTTP" },
        { a: "pool", b: "server", l: "has *" },
        { a: "pool", b: "ring", l: "asks" }
      ],
      add: ["ring"],
      say: "The ring maps hash points to backends, 150 points each, so the same client IP lands on the same backend and adding a backend moves only its share of clients rather than reshuffling everybody. It has its own lock, and the code takes real care never to hold both: the pool lock is taken to copy out the healthy set, released, and only then is the ring asked. Registration does the same in the other direction, updating the ring after releasing the pool lock. That is the single most experienced looking decision in this codebase, and it is worth saying out loud in an interview because most people meet lock inversion by debugging it rather than by avoiding it.",
      breaks: "Every strategy filters on a health flag that nothing has ever set. A backend can be switched off and the balancer will keep sending traffic to it until somebody notices." },

    { t: "4. Health, discovered two ways",
      pressure: "A dead backend that still receives traffic is worse than one fewer backend. Polling alone is too slow, and waiting for failures alone means the first user after every recovery is a guinea pig.",
      nodes: [
        { id: "client", l: "Client", col: 0, row: 2, r: "client" },
        { id: "fiber", l: "Fiber app", col: 1, row: 2, r: "svc" },
        { id: "selector", l: "selectServer", col: 2, row: 1, r: "iface" },
        { id: "proxy", l: "Reverse proxy", s: "marks down on failure", col: 2, row: 3, r: "svc" },
        { id: "health", l: "Health checker", s: "goroutine, every 10s", col: 2, row: 4, r: "work" },
        { id: "pool", l: "Pool", s: "SetHealth, write lock", col: 3, row: 1, r: "svc" },
        { id: "strat", l: "Round robin, least conn, random", col: 3, row: 2, r: "impl" },
        { id: "backends", l: "Backends", s: "expose /health", col: 3, row: 3, r: "ext" },
        { id: "server", l: "Server", col: 4, row: 1, r: "entity" },
        { id: "ring", l: "HashRing", s: "150 vnodes", col: 4, row: 2, r: "impl" }
      ],
      edges: [
        { a: "client", b: "fiber", l: "request" },
        { a: "fiber", b: "selector", l: "which one?", bend: 0.4 },
        { a: "fiber", b: "proxy", l: "forward", bend: 0.7 },
        { a: "selector", b: "strat", l: "dispatch" },
        { a: "strat", b: "pool", l: "queries" },
        { a: "proxy", b: "backends", l: "HTTP" },
        { a: "proxy", b: "pool", l: "mark down", bend: 0.72 },
        { a: "health", b: "backends", l: "poll", bend: 0.3 },
        { a: "health", b: "pool", l: "set health", bend: 0.88 },
        { a: "pool", b: "server", l: "has *" },
        { a: "pool", b: "ring", l: "asks" }
      ],
      add: ["health"],
      say: "Active checking is a goroutine that polls every backend's health endpoint every ten seconds and writes the result into the pool. Passive checking is the proxy marking a backend down the instant a request to it fails, which catches a death in one request instead of ten seconds. The two together are the standard answer, and they are cheap. Note what the ring does with an unhealthy backend: it does not rebuild, it walks clockwise past it to the next healthy point, so one sick backend does not remap every other client.",
      breaks: "The balancer will now forward anything anybody sends it, as fast as they can send it, to backends that have no defence. And the moment you want a second copy of the balancer for availability, you discover that half its state is in this process." },

    { t: "5. Rate limiting, and the state that had to be shared",
      pressure: "Two problems with one answer. Abusive traffic should die at the edge rather than at a backend, and a limit enforced per process is not a limit at all once there is more than one process.",
      nodes: [
        { id: "client", l: "Client", col: 0, row: 2, r: "client" },
        { id: "fiber", l: "Fiber app", s: "limit, select, forward", col: 1, row: 2, r: "svc" },
        { id: "limiter", l: "RateLimiter", s: "bucket or window", col: 2, row: 0, r: "iface" },
        { id: "selector", l: "selectServer", col: 2, row: 1, r: "iface" },
        { id: "proxy", l: "Reverse proxy", s: "marks down on failure", col: 2, row: 3, r: "svc" },
        { id: "health", l: "Health checker", s: "goroutine, every 10s", col: 2, row: 4, r: "work" },
        { id: "redis", l: "Redis", s: "Lua, one key per client", col: 3, row: 0, r: "store" },
        { id: "pool", l: "Pool", s: "in this process only", col: 3, row: 1, r: "svc" },
        { id: "strat", l: "Round robin, least conn, random", col: 3, row: 2, r: "impl" },
        { id: "backends", l: "Backends", s: "expose /health", col: 3, row: 3, r: "ext" },
        { id: "server", l: "Server", col: 4, row: 1, r: "entity" },
        { id: "ring", l: "HashRing", s: "150 vnodes", col: 4, row: 2, r: "impl" }
      ],
      edges: [
        { a: "client", b: "fiber", l: "request" },
        { a: "fiber", b: "limiter", l: "allowed?", bend: 0.25 },
        { a: "fiber", b: "selector", l: "which one?", bend: 0.45 },
        { a: "fiber", b: "proxy", l: "forward", bend: 0.7 },
        { a: "limiter", b: "redis", l: "one Lua" },
        { a: "selector", b: "strat", l: "dispatch" },
        { a: "strat", b: "pool", l: "queries" },
        { a: "proxy", b: "backends", l: "HTTP" },
        { a: "proxy", b: "pool", l: "mark down", bend: 0.72 },
        { a: "health", b: "backends", l: "poll", bend: 0.3 },
        { a: "health", b: "pool", l: "set health", bend: 0.88 },
        { a: "pool", b: "server", l: "has *" },
        { a: "pool", b: "ring", l: "asks" }
      ],
      add: ["limiter", "redis"],
      say: "The limit is checked first, before a backend is even chosen, so a rejected request costs one Redis round trip and nothing else. The check and the decrement happen inside a Lua script, which Redis runs atomically, so two instances asking at the same instant cannot both be told yes. That last sentence is the reason the state is in Redis at all, and it quietly says something about the intended deployment: this was built to run as more than one process. Which makes the pool, still sitting in this process's memory, the interesting loose end." }
  ],

  boxesIntro: "Twelve types. Two of them, the pool and the ring, hold every hard problem in the design, and the rest are either stateless or somebody else's. Read the disadvantages and failure rows on those two first.",

  boxes: [
    { id: "client", n: "Client", r: "client",
      job: "Sends an ordinary HTTP request and never learns that a balancer was involved.",
      why: "It is drawn because transparency is a requirement rather than a nicety: the client's IP is what consistent hashing keys on and what the rate limiter counts, so how the balancer determines it is a real decision.",
      forced: "Stage 0 for the request, stage 5 for the identity question.",
      alts: [["Keying the rate limit on an API key or account", "better, because an IP is shared by everybody behind one NAT and changes when a phone moves between networks. IP is the right default when there is no identity yet."]],
      pros: ["No client change needed, which is the whole point of a reverse proxy."],
      cons: ["The client's real address is only correct if the balancer is the first hop. Behind a CDN or another proxy, every client appears to be that proxy.", "An IP is a poor identity: too coarse behind NAT and too fine on mobile."],
      cost: "Nothing, and it decides the correctness of two features.",
      fails: "Deployed behind another proxy without configuring which forwarded header to trust, every request arrives with the same source address. Consistent hashing sends everybody to one backend and the rate limiter blocks the entire internet as one client. Fiber has a trusted proxy setting for exactly this, and it must be off by default, because a header a client can set is a header a client can lie about.",
      say: "IP by default, and the moment there is a hop in front of me I configure which forwarded header to trust and from which addresses. Trusting a forwarded header unconditionally lets any client choose their own rate limit bucket." },

    { id: "fiber", n: "Fiber app", r: "svc",
      job: "Own the routes, run the request through limit, select and forward, and shut down without dropping in flight work.",
      why: "It is the composition root. Every decision in the design is visible in the order of five lines in one handler, which is a good property to keep.",
      forced: "Stage 0.",
      alts: [["The standard library plus httputil.ReverseProxy", "genuinely the right default answer in Go: it handles hop by hop headers, X-Forwarded-For, error hooks and streaming correctly, and it is battle tested. Writing the proxy by hand is more educational and more places to be subtly wrong."], ["net/http with a custom mux", "slower than fasthttp under load and fully compatible with every Go HTTP library, which fasthttp is not. That incompatibility is the real cost of the Fiber choice."]],
      pros: ["fasthttp reuses request and response objects, so the framework allocates almost nothing per request.", "The whole request lifecycle is readable in one function, in order.", "Graceful shutdown with a ten second drain, plus signal handling, so a deploy does not drop in flight requests. Cheap to add and frequently skipped."],
      cons: ["fasthttp does not implement net/http interfaces, so any middleware from the wider ecosystem needs an adapter.", "Its reused contexts are a well known source of bugs when a value outlives the handler, which matters here because the response is streamed after the handler returns."]
      , cost: "One process, one port, one handler on the hot path.",
      fails: "The response body is closed by a deferred call when the handler returns, but a streamed body is written by fasthttp <i>after</i> the handler returns, and fasthttp closes a stream that implements Closer itself. Closing it early truncates responses under load, and it is invisible in a hand test with a small body. See the deep dive.",
      say: "The handler reads as limit, select, forward, return, in that order, and the order is the design. I would keep it that way even as things are added, and anything that does not fit that sentence belongs in another type." },

    { id: "proxy", n: "Reverse proxy", r: "svc",
      job: "Rebuild the request against the chosen backend, send it, stream the response back, and mark the backend down if it fails.",
      why: "It is the only place that touches the network on behalf of a user, so it is the only place that learns a backend is dead in real time.",
      forced: "Stage 1, and it grew the passive health role in stage 4.",
      alts: [["httputil.ReverseProxy from the standard library", "handles the header rules, streaming and error hooks correctly out of the box. The hand written version is clearer to read and has more surface to be wrong on, which the failure row is about."], ["Forwarding in a goroutine and waiting on channels", "what this code does, and the goroutine buys nothing: the select waits on exactly those two channels, so it is a direct call with a scheduling hop and an extra stack. Worth removing, and worth being able to say why it is not needed."]],
      pros: ["One shared http.Client, so connections to backends are pooled and reused rather than dialled per request.", "A context with a timeout on every request, so no request can hang forever.", "Failure is immediately useful: it becomes a health signal rather than just an error."],
      cons: ["Hop by hop headers are copied through. Connection, Keep-Alive and Transfer-Encoding are defined to apply to a single hop and a proxy is required to strip them.", "No X-Forwarded-For is added, so backends cannot see the real client.", "The request body is read fully into memory before forwarding, which caps the upload size at whatever the process can hold."],
      cost: "One outbound connection pool, one context and one buffer per request.",
      fails: "Marking a backend down on any single failure means one client's cancelled request or one transient timeout evicts a perfectly healthy backend from rotation until the next poll. Under a burst that can cascade: a slow backend fails a few requests, is removed, the load moves to the rest, and they slow down too. A failure threshold, three strikes in a window, is the standard fix and it is the one thing missing from the health design.",
      say: "Passive health checking should count failures, not react to one. A single timeout is a client story; three in ten seconds is a backend story." },

    { id: "pool", n: "Pool", r: "svc",
      job: "Own the list of backends, their health, and their connection counts. Nothing outside it may touch the slice.",
      why: "It is the only mutable state that every goroutine in the process shares, so it is the entire concurrency design compressed into one type.",
      forced: "Stage 1.",
      alts: [["A plain slice with a package level mutex", "the same thing with the invariant spread across the package instead of owned by a type, so a new call site can forget the lock and nothing will tell you until production."], ["sync.Map", "built for a different shape, many keys written rarely and read from many goroutines. Here the collection is small and iterated in full on every request, so an RWMutex over a slice is both faster and clearer."], ["A copy on write atomic.Pointer to an immutable slice", "genuinely attractive here. Reads become lock free pointer loads and writes are rare, which is exactly this workload's shape. It is the optimisation I would reach for first if profiling showed lock contention."]],
      pros: ["RWMutex matches the access pattern: thousands of concurrent readers, a write only when a backend registers or changes health.", "Connection counts are atomics inside the struct, so incrementing one needs only the read lock. Using a plain int would have forced a write lock on every request and serialised the whole process.", "Register on an existing URL marks it healthy again rather than duplicating it, so recovery is idempotent."],
      cons: ["List returns a snapshot of pointers, not of values, so a caller reading a field off those pointers is reading shared memory with no lock at all. Two call sites do exactly that.", "Round robin rebuilds the healthy slice on every request, which allocates on the hot path and means the counter indexes into a list whose length changes underneath it.", "Least connection selects and increments in two separate lock acquisitions, so two requests arriving together can both pick the same least loaded backend."],
      cost: "One mutex, one slice, one atomic counter. Read locked on every request.",
      fails: "The race detector finds the List snapshot immediately: one goroutine writes Healthy under the write lock while another reads it through a pointer with no lock. It is benign on most hardware right up until it is not, and it is a five line fix. See the deep dive.",
      say: "The pool owns the slice and hands out values, never pointers. The moment a snapshot leaks a pointer, the lock stops meaning anything, and that is the defect in this code that I would fix first." },

    { id: "server", n: "Server", r: "entity",
      job: "One backend: its URL, whether it is healthy, and how many requests are in flight to it.",
      why: "It is the unit the health flag and the connection counter belong to, and giving them an owner is what lets the pool state a rule about them.",
      forced: "Stage 1.",
      alts: [["Parallel maps, url to healthy and url to count", "the same data with no owner and two things to keep in step."], ["An immutable value copied out of the pool", "the fix for the pointer leak: callers get a copy and cannot race on it. It costs a small allocation per read and removes a whole class of bug."]],
      pros: ["An atomic connection counter means the hot path never needs a write lock.", "Everything about one backend is in one place, so adding a weight or a failure count later touches one type."],
      cons: ["Because the struct contains an atomic, it cannot be copied by value once it has been used, which is exactly why the pool leaks pointers instead. The clean version separates the identity fields from the counter.", "It is serialised straight to JSON by the servers endpoint, and an atomic has no exported fields, so the connection count comes out as an empty object."],
      cost: "One small struct per backend. There are tens of these, not millions.",
      fails: "Somebody copies a Server by value to avoid the pointer race and vet warns about copying a lock. The right shape is a separate view type for reads, holding plain values, built inside the pool under its lock.",
      say: "A struct containing an atomic cannot be copied, so either the pool hands out pointers, which breaks the locking, or it hands out a small view type built under the lock. The second one is correct and it is about ten lines." },

    { id: "selector", n: "selectServer", r: "iface",
      job: "One dispatch point that turns a configured strategy name into a chosen backend.",
      why: "The choosing rule is the thing that varies. One switch in one function is the whole extension point, and every strategy has the same signature.",
      forced: "Stage 2.",
      alts: [["A strategy interface with four implementing types", "the classic answer, and in Go it is usually heavier than needed when each strategy has one method and no state. A function type is the idiomatic equivalent."], ["A map from name to function, populated at init", "removes the switch and lets a new strategy register itself. Slightly more magic, and it is what you want once strategies live in separate files."], ["Choosing per request from a header", "genuinely useful for testing and for per route policies, and it means the strategy can no longer keep state safely, because round robin's counter is per process not per route."]],
      pros: ["The default case makes an unknown or empty configuration fall back to round robin instead of failing at startup.", "Every strategy returns the same pair, a URL and an error, so the caller has one path for no healthy backends."],
      cons: ["The strategy is read from a package level variable set at startup, so it cannot change without a restart and it is awkward to test.", "The least connection bookkeeping lives in the caller rather than in the strategy, so the handler has to know which strategy it picked. That coupling is why the increment races the selection."]
      , cost: "One switch on a string, per request.",
      fails: "A new strategy is added, its case is added to the selector, and the connection accounting in the handler is not updated, so it silently gets no bookkeeping. Moving the accounting into the strategy removes the possibility.",
      say: "In Go I would make this a function type rather than an interface, and I would move the connection accounting into the least connection strategy so the handler never has to know which one is configured." },

    { id: "strat", n: "The stateless strategies", r: "impl",
      job: "Round robin, least connection and random: three ways to pick from the healthy set.",
      why: "They are here to show the strategy has more than one implementation with genuinely different properties, not just different code.",
      forced: "Stage 2.",
      alts: [["Weighted round robin", "the obvious next one, and the only change needed is a weight on Server. Worth naming, because real backends are not identical."], ["Least response time", "better than least connection when backends differ in speed, and it needs a rolling latency estimate per backend, which is real state."], ["Power of two choices", "pick two at random and take the less loaded of them. Almost as good as least connection, with none of the scanning and none of the counter bookkeeping. This is the one I would actually suggest."]],
      pros: ["All three are a handful of lines and have no state of their own beyond one atomic counter.", "Random needs no coordination at all, which makes it the only one that is trivially correct across several balancer instances.", "Least connection is the right default when request durations vary a lot, which is when round robin is worst."],
      cons: ["Round robin's counter indexes into a healthy list whose length changes, so when a backend drops out the rotation shifts for everybody rather than skipping one slot.", "Least connection scans every backend on every request. Fine for tens, wrong for thousands, and power of two choices fixes it.", "Round robin allocates a fresh healthy slice per request, which is the one avoidable allocation on the hot path."],
      cost: "An O(n) scan per request over a list of tens.",
      fails: "Under load, two requests arrive together, both scan, both see the same backend as least loaded, and both send to it before either increments. The counter is atomic but the read and the increment are not one operation. Select and increment under the same lock and the window disappears.",
      say: "Least connection has a check then act window between choosing and incrementing. The fix is to make the choice and the increment one operation inside the pool, which also removes the strategy specific code from the handler." },

    { id: "ring", n: "HashRing", r: "impl",
      job: "Map a client IP to a backend, so the same client keeps landing on the same one.",
      why: "Session affinity without sessions. Modulo the number of backends would be simpler and remaps almost every client whenever the count changes, which is exactly what a cache or an in memory session cannot survive.",
      forced: "Stage 3, and it brought the second mutex with it.",
      alts: [["hash(ip) modulo backend count", "one line, and adding a fourth backend to three moves roughly three quarters of all clients. Consistent hashing moves about a quarter, which is the entire reason the technique exists."], ["Rendezvous hashing", "arguably nicer: no ring, no virtual nodes, no sorting, and it computes a hash per backend per lookup. At tens of backends that is cheaper than it sounds and the code is half the size."], ["Sticky sessions via a cookie", "precise and it requires the balancer to understand and set cookies, and it does not work for anything that is not a browser."]],
      pros: ["150 virtual nodes per backend brings the spread of load to within a few percent, where one node per backend would be wildly uneven.", "Lookup is a binary search over a sorted slice, so it is logarithmic and allocation free.", "An unhealthy backend is walked past clockwise rather than removed, so a sick backend remaps only its own clients and leaves everyone else's mapping untouched. That property is the whole point and it is easy to lose."],
      cons: ["A second mutex, which is where the lock ordering problem comes from.", "Removal recomputes each virtual node's hash and deletes it, so if two backends' virtual nodes ever collide on the same 32 bit point, removing one silently unmaps the other. Unlikely below a few hundred backends and worth knowing.", "The ring holds every registered backend, healthy or not, so the healthy set has to be passed in on every lookup."],
      cost: "150 points per backend, sorted on change, binary searched on read.",
      fails: "Somebody takes the pool lock and then calls into the ring while another goroutine holds the ring lock and waits for the pool. Both stop. This code deliberately avoids it by copying the healthy set out, releasing the pool lock, and only then querying the ring, with a comment saying so. That is the right fix and the right place to say it.",
      say: "Never hold two locks. Copy what you need out from under the first one, release it, then take the second. And 150 virtual nodes is not a magic number, it is the point where the spread of load stops improving fast enough to be worth the memory." },

    { id: "health", n: "Health checker", r: "work",
      job: "A background goroutine that polls every backend's health endpoint on an interval and writes the result into the pool.",
      why: "Passive detection alone never notices recovery, so a backend that comes back would stay out of rotation forever. Active checking is what lets a backend rejoin.",
      forced: "Stage 4.",
      alts: [["Passive detection only", "cheaper and no backend ever comes back, because nothing is sending it traffic to succeed."], ["Backends registering their own heartbeats", "inverts the direction and means a backend that is alive enough to POST but too broken to serve is considered healthy."], ["A readiness endpoint that checks dependencies", "much better than a handler that returns 200 unconditionally. A backend whose database is unreachable should fail its own health check."]],
      pros: ["One goroutine, one ticker, one HTTP call per backend per interval. Almost free.", "Checks run in parallel, so one hung backend does not delay the others.", "Recovery is automatic and needs no human."],
      cons: ["The response body is never closed, so every poll leaks a connection and a file descriptor. Ten seconds times forever is a slow, certain leak.", "The poll uses a client with no timeout, so a backend that accepts a connection and never answers holds a goroutine permanently, and a new one is created on the next tick. That is an unbounded goroutine leak with a hung backend as the trigger.", "One failed poll flips the flag, so a single dropped packet takes a healthy backend out of rotation for up to ten seconds."],
      cost: "One goroutine plus one per backend per interval. Would be negligible if the two leaks were fixed.",
      fails: "A backend hangs rather than refusing connections. Every ten seconds another goroutine is created and blocks forever. Over a night that is thousands of stuck goroutines and their sockets. Both leaks are one line each: close the body, and give the client a timeout.",
      say: "Two one line fixes carry this component: close the response body, and use a client with a timeout rather than the default one, which has none. Then add a failure threshold so a single dropped packet does not evict a healthy backend." },

    { id: "limiter", n: "RateLimiter", r: "iface",
      job: "Decide whether this client may make this request, before any backend is chosen.",
      why: "Abusive traffic should be rejected as early and as cheaply as possible, and the balancer is the earliest thing you own.",
      forced: "Stage 5.",
      alts: [["A token bucket in process memory", "zero latency and no Redis, and with two balancer instances every client gets twice the limit. That single sentence is why the state is remote."], ["Fixed window counters", "simplest to implement and it allows a double burst across a window boundary, which is the classic reason people move to sliding windows."], ["Sliding window log", "exact and it stores a timestamp per request, which is expensive for the busiest clients, who are exactly the ones you are trying to limit."]],
      pros: ["Two algorithms behind one call, chosen by configuration, which is the same strategy shape as the backend selection. Consistency between the two is worth something.", "A token bucket allows a burst and then a steady rate, which matches how real clients behave better than a hard cap does.", "It runs before selection, so a rejected request never touches a backend or the pool."],
      cons: ["It puts a Redis round trip on every request, including the ones that will be allowed. That is the price of a shared limit and it should be stated.", "Redis becoming unavailable is a policy question with no good default: fail open and the limit disappears, fail closed and Redis takes the whole site down."],
      cost: "One Redis round trip per request, sub millisecond on a local network.",
      fails: "Redis is unreachable. The design has to have already decided which way to fail, and for a rate limiter the answer is almost always open, with an alert, because a rate limiter protecting a healthy system should never be the reason that system is down.",
      say: "Fail open, loudly. A rate limiter is a guard rail, and a guard rail that closes the road when it breaks is worse than no guard rail. The library behind this box is designed on its own page, <a href='?p=ratelimiter-lld'>Rate limiter</a>, and it currently fails closed, which is the first thing I would change about it." },

    { id: "redis", n: "Redis", r: "store",
      job: "Hold one bucket per client, and run the check and decrement as one indivisible operation.",
      why: "The counter has to be shared across balancer instances and the read and write have to be atomic. Redis with a Lua script is the standard answer to exactly that pair of requirements.",
      forced: "Stage 5.",
      alts: [["GET then SET from the application", "two round trips with a gap in the middle, so two instances both read three tokens left and both spend one. This is the same check then act bug as everywhere else on this page, over a network."], ["INCR with an expiry", "atomic and it only implements a fixed window, not a bucket that refills over time."], ["A local limiter plus a shared one", "what large systems do: a cheap in process check for the obvious cases and the shared one for the rest. Worth naming as the optimisation if the Redis round trip ever matters."]],
      pros: ["Lua runs on the server, so the whole read, refill, compare and write sequence is one atomic operation with no round trips inside it.", "One small key per client with a TTL, so inactive clients expire themselves and nothing has to clean up.", "It is the only piece of state in the design that several balancer instances already share correctly."],
      cons: ["A network dependency on the hot path of every single request.", "It is a shared component, so a noisy neighbour on the same Redis affects rate limiting for everybody.", "The bucket key is derived from the client IP, so a NAT full of users shares one bucket."],
      cost: "One key per active client, one round trip and one script evaluation per request.",
      fails: "Redis fails over and buckets are lost. Every client is granted a full bucket, which is a brief window of double the intended rate. That is a completely acceptable failure for a rate limiter and worth saying so, because it justifies not replicating it synchronously.",
      say: "The Lua script is the whole point. Check and decrement in one operation on the server, because doing it in two from the client is the same race this design fixes three other times in three other places." },

    { id: "backends", n: "Backend servers", r: "ext",
      job: "Do the actual work. Registered and deregistered at runtime over HTTP.",
      why: "They are drawn as external because the balancer has no control over them, only opinions about whether they are alive.",
      forced: "Stage 0.",
      alts: [["A static list from configuration", "simpler and it means adding a backend is a deploy of the balancer."], ["Service discovery, Consul or etcd or DNS", "what production actually does, and it removes the registration API and makes the pool a cache of somebody else's truth. It is also the answer to the multi instance problem in stage 5."]],
      pros: ["Runtime registration means scaling out needs no restart and no configuration change.", "A backend registering itself on boot is a natural pattern and needs no orchestrator."],
      cons: ["The registration endpoints have no authentication, so anyone who can reach the balancer can add a backend and receive traffic, or remove all of them.", "Registration only reaches the instance that received it, which is the loose end the last stage is about."],
      cost: "None to the balancer beyond a slice entry and a health poll.",
      fails: "The registration API is exposed on the same port as proxied traffic, so a path that a backend also serves could be shadowed, and an outsider can register their own server. Bind the admin routes to a separate port or an internal interface, and require a token.",
      say: "Register and deregister are administrative, and they are on the same public listener as user traffic with no auth. Separate port, or at minimum a shared secret, before this goes anywhere real." }
  ],

  patternsIntro: "One pattern is used twice and earns it both times. The interesting part of this codebase is not the pattern though, it is the concurrency discipline, so the last two entries are about habits rather than about names.",

  patterns: [
    { n: "Strategy, for backend selection", used: true,
      what: "One dispatch function, four interchangeable selection rules chosen by configuration.",
      varies: "How a backend is chosen. Four rules today with genuinely different properties, and weighted and power of two choices are obvious additions.",
      without: "The selection rule inlined in the handler, so changing it means editing the code that proxies traffic.",
      cost: "In Go this wants a function type rather than an interface, because the strategies have one method and no state. Using an interface here would be importing a Java habit." },
    { n: "Strategy again, for rate limiting", used: true,
      what: "Token bucket or sliding window behind one call, selected by configuration.",
      varies: "The limiting algorithm, and they have different burst behaviour rather than different code shape.",
      without: "A conditional at every call site, in a function that runs before every single request.",
      cost: "The two algorithms need different parameters, so the configuration for one is meaningless for the other. That is fine and it should be validated at startup rather than silently defaulting to zero." },
    { n: "Copy out, then take the other lock", used: true,
      what: "Not a named pattern, and the most valuable habit in this codebase. Build what you need under lock A, release it, then take lock B.",
      varies: "Nothing. It exists so two locks can never be held at once, which makes deadlock structurally impossible rather than unlikely.",
      without: "Two goroutines each holding one lock and waiting for the other, at three in the morning, under load, and never in a test.",
      cost: "A small allocation for the copied set, and the copy is a snapshot, so it can be stale by the time it is used. Here that is fine: a stale health flag costs one misrouted request." },
    { n: "Singleton, the package level DefaultPool", used: false,
      what: "One package level pool that every strategy reaches for directly.",
      varies: "Nothing, and it hides a dependency that the strategies should be declaring.",
      without: "Pass the pool in. Same single instance in production, and now two tests can run in parallel with different pools.",
      cost: "It is the one design decision here that makes the code hard to test, and it is the reason every strategy is a package level function rather than a method on something. Worth changing, and it is a small change." },
    { n: "Middleware chain for the request lifecycle", used: false,
      what: "Rate limiting, selection, forwarding and accounting as composable middleware rather than as five statements.",
      varies: "The set of steps, which is genuinely likely to grow: authentication, tracing, retries, circuit breaking.",
      without: "One handler that grows a step at a time, which is completely readable at five steps and stops being so at twelve.",
      cost: "Indirection, and the loss of being able to read the whole lifecycle in one function, which is currently one of this design's best properties. Not yet. Say when." }
  ],

  flowsIntro: "One request, then the two ways a backend is discovered to be dead. The second and third are where the design earns its keep, and where the defects live.",

  flows: [
    { n: "A proxied request",
      steps: [
        ["Fiber hands the handler a context. The client IP is read, and it is only the real client if nothing is in front of this process.", "sync"],
        ["The rate limiter runs a Lua script in Redis: refill the bucket by elapsed time, compare, decrement, all as one operation. Over budget returns 429 and the request stops here, having touched no backend.", "sync"],
        ["The selector dispatches on the configured strategy. Each one takes the pool read lock, filters to healthy, applies its rule, and returns a URL.", "sync"],
        ["For least connection, the handler increments that backend's atomic counter. It is a second lock acquisition, and the gap between choosing and incrementing is the race.", "sync"],
        ["A new request is built against the backend URL with a ten second context, headers copied across, and the body forwarded.", "sync"],
        ["The response is streamed back to the client. The counter is decremented. Note that the streaming happens after the handler returns, which is what makes the deferred close dangerous.", "sync"]
      ] },
    { n: "A backend dies, discovered passively",
      note: "One request pays the cost. Everybody after it is routed elsewhere.",
      steps: [
        ["The proxy call returns an error: connection refused, or the context deadline expired.", "sync"],
        ["The pool is told to mark that backend unhealthy, under the write lock. Every subsequent selection filters it out immediately.", "sync"],
        ["The client that triggered the discovery gets a 500. There is no retry, so one user pays for the detection. A single retry against a different backend would make this invisible, and it is the most valuable missing feature.", "sync"],
        ["The ring does not change. A hashed client whose backend just died walks clockwise to the next healthy point, and every other client's mapping is untouched.", "sync"]
      ] },
    { n: "A backend recovers, discovered actively",
      steps: [
        ["Every ten seconds the checker goroutine spawns one goroutine per registered backend.", "async"],
        ["Each one issues a GET to the backend's health endpoint. There is no timeout on this call, which is the leak: a backend that accepts and never answers holds that goroutine forever.", "async"],
        ["A 2xx marks the backend healthy again, so recovery needs no human and no registration call.", "async"],
        ["The response body is never closed, so each poll leaks a connection. Two one line fixes, and this is the component that most needs them.", "async"]
      ] }
  ],

  api: [
    ["POST /register {url}", "200", "Adds a backend and its 150 virtual nodes to the ring. Idempotent: registering an existing URL re-marks it healthy, which is what makes recovery safe to repeat."],
    ["POST /deregister {url}", "200", "Removes it from the pool and the ring. In flight requests to it are unaffected, which is correct."],
    ["GET /servers", "list of backends", "Health and connection count per backend. This is the operator's only window into the pool, which is why the connection count serialising as an empty object matters."],
    ["ALL *", "the backend's response", "Everything else is proxied. Note this catch all shares a listener with the three admin routes above, which is the security question in the backends card."],
    ["GET /health on each backend", "2xx if alive", "The contract the balancer depends on. A handler that returns 200 unconditionally is worse than useless: it reports a process, not a service."]
  ],
  apiNote: "The detail worth ten seconds: the admin routes and the proxy catch all are on the same public listener with no authentication. Anyone who can reach the balancer can deregister every backend.",

  schema: { n: "The lock discipline, which is the design", lang: "text",
    note: "Two mutexes exist and no code path may hold both. This is what that looks like, and the comments in the original are doing real work.",
    code:
"type Pool struct {\n" +
"    mu      sync.RWMutex   // guards servers\n" +
"    servers []*Server\n" +
"    counter atomic.Uint64  // round robin, no lock needed\n" +
"    ring    *HashRing      // has its OWN mutex. never held with mu.\n" +
"}\n" +
"\n" +
"// the rule: copy out under one lock, release, then take the other.\n" +
"func (p *Pool) ConsistentHashNext(key string) (string, error) {\n" +
"    p.mu.RLock()\n" +
"    healthy := make(map[string]bool, len(p.servers))\n" +
"    for _, s := range p.servers {\n" +
"        if s.Healthy { healthy[s.URL] = true }\n" +
"    }\n" +
"    p.mu.RUnlock()              // released BEFORE the ring is touched\n" +
"\n" +
"    return p.ring.Get(key, healthy)   // ring takes its own lock, alone\n" +
"}\n" +
"\n" +
"// and the same discipline in the other direction, on registration:\n" +
"func (p *Pool) Register(url string) {\n" +
"    p.mu.Lock()\n" +
"    ... append or re-mark healthy ...\n" +
"    p.mu.Unlock()               // released BEFORE the ring is updated\n" +
"    if !found { p.ring.Add(url) }\n" +
"}\n" +
"\n" +
"// what breaks the rule, and what a review should look for:\n" +
"//   List() returns []*Server, so a caller reads s.Healthy with NO lock.\n" +
"//   the fix is a view type built under the lock:\n" +
"type ServerView struct { URL string; Healthy bool; Conns int32 }\n" +
"func (p *Pool) List() []ServerView {\n" +
"    p.mu.RLock(); defer p.mu.RUnlock()\n" +
"    out := make([]ServerView, 0, len(p.servers))\n" +
"    for _, s := range p.servers {\n" +
"        out = append(out, ServerView{s.URL, s.Healthy,\n" +
"                                     s.ActiveConnections.Load()})\n" +
"    }\n" +
"    return out                  // values, not pointers. nothing to race on.\n" +
"}" },

  deep: [
    { n: "Four defects a reviewer would find, and the fix for each",
      note: "None of these are design mistakes. They are the specific things that survive a self review of working code, which is why they are worth cataloguing rather than glossing over.<br><br><b>1. The pointer leak out of the lock.</b> List returns a slice of pointers, so two callers read a health flag with no lock while another writes it under one. The race detector finds it on the first run. Fix: return a slice of values built under the lock.<br><br><b>2. The unclosed health check body.</b> A response body from an HTTP call must be closed or its connection is never returned to the pool. Polling every backend every ten seconds forever makes that a certainty rather than a risk. Fix: one deferred close, and check the error path too, because a non nil response can accompany an error.<br><br><b>3. No timeout on the health check.</b> The default HTTP client has no timeout at all. A backend that accepts the connection and never replies parks that goroutine permanently, and a new one is created on every tick. Fix: a client with a timeout shorter than the poll interval.<br><br><b>4. The deferred close on a streamed response.</b> The body is closed when the handler returns, and a streamed body is written by fasthttp after the handler returns. fasthttp closes a stream that implements Closer itself, so the deferred close is both unnecessary and capable of firing first. Fix: remove it, or read the body fully and send it as bytes.",
      code:
"// 2 and 3, together, in the health checker:\n" +
"var healthClient = &http.Client{Timeout: 3 * time.Second}\n" +
"\n" +
"func pingServer(pool *Pool, url string) {\n" +
"    resp, err := healthClient.Get(url + \"/health\")\n" +
"    if resp != nil {\n" +
"        defer resp.Body.Close()   // even on error, resp may be non-nil\n" +
"    }\n" +
"    pool.SetHealth(url, err == nil && resp.StatusCode < 400)\n" +
"}\n" +
"\n" +
"// 4: the handler returns before the stream is written, so this is wrong\n" +
"//     defer resp.Body.Close()\n" +
"//     return c.SendStream(resp.Body)\n" +
"//\n" +
"//     fasthttp closes an io.Closer stream itself. drop the defer." },

    { n: "Why two locks are one lock too many",
      note: "The pool has a mutex. The ring has a mutex. Consistent hashing needs both pieces of information. If one goroutine takes the pool lock and then reaches for the ring, while another takes the ring lock and then reaches for the pool, both stop and neither ever resumes. This is lock inversion, it is not detected by the race detector, and it typically appears the first time production traffic makes both paths run at once.<br><br>There are two standard answers. <b>A global lock ordering</b>: decide that the pool lock is always taken before the ring lock, everywhere, and never the reverse. It works and it relies on every future contributor knowing the rule. <b>Never hold two</b>: copy what you need out from under the first lock, release it, then take the second. This codebase does the second, in both directions, and comments say why.<br><br>The cost of the second approach is that the copied set is a snapshot, so between the copy and the ring lookup a backend might change health. Here that costs one misrouted request, which the passive health check catches. Being able to name what the snapshot costs is what makes it a decision rather than a shortcut." },

    { n: "Consistent hashing, and where the 150 comes from",
      note: "Hash the client and take it modulo the number of backends and you have session affinity in one line. Add a fourth backend to three and roughly three quarters of all clients move, which for anything holding per client state in memory is a stampede.<br><br>A ring fixes the remapping: backends are placed at positions around a circle, a client hashes to a position, and the first backend clockwise wins. Adding a backend only steals the arc immediately before it, so about one client in N moves rather than most of them.<br><br>The catch is that N randomly placed points give wildly unequal arcs, so with three backends one might take half the traffic. Virtual nodes fix that: place each backend at 150 positions instead of one, and the law of large numbers flattens the distribution to within a few percent. 150 is the number most implementations converge on, because the improvement flattens out above it and the memory is linear.<br><br>The last detail is the one people miss. When a backend is unhealthy, do not remove it from the ring, walk clockwise past it. Removing it renumbers the arcs and remaps clients that had nothing to do with the failure." },

    { n: "The loose end: distributed state, in process state",
      note: "The rate limiter's state is in Redis, run through Lua so the check and the decrement are atomic. That is the correct design for a limit shared across processes, and it is a deliberate, non trivial choice.<br><br>The server pool and every health flag are in this process's memory. So if you run two copies of this balancer for availability, which is the reason the rate limiter was made shared in the first place, you get two pools that disagree. A backend registered against instance A is invisible to instance B. A backend that fails a request on A is still healthy on B and keeps receiving traffic. Consistent hashing produces different answers on the two instances for the same client, so the affinity it exists to provide is gone.<br><br>Three ways out, in increasing order of how much they change. <b>Put the pool in Redis too</b>, with the health flag as a key with a TTL that whichever instance detects a failure clears. Cheapest, and it puts a network call on the selection path. <b>Use service discovery</b> as the source of truth, with each instance keeping a local cache, which is what production systems do and which removes the registration API entirely. <b>Accept the divergence</b> and let each instance discover health independently, which is honest, costs a little duplicated probing, and is completely fine for everything except consistent hashing.<br><br>Noticing that one kind of state was made shared and the other was not, and having an opinion about it, is the most valuable thing you can say about this design." }
  ],

  tradeoffsIntro: "Four decisions, and the first one is the one to be able to defend in either direction.",

  tradeoffs: [
    { a: ["Copy out, then take the second lock", "Deadlock is structurally impossible. The copied set can be stale by one request."],
      b: ["A documented global lock ordering", "No copying and no staleness. Correct only for as long as every future contributor follows the rule."],
      pick: "a",
      flip: "the copy becomes expensive, which here it never does, since the list is tens of entries. In a hot path with a large structure, ordering plus a comment on both mutexes is the better trade." },
    { a: ["An RWMutex over a slice", "Simple, obvious, and read locked on every request. Contention appears eventually and only under real load."],
      b: ["Copy on write behind an atomic pointer", "Lock free reads. Every write copies the whole slice, which is fine because writes are rare."],
      pick: "a",
      flip: "profiling shows lock contention on the read path, which at tens of thousands of requests per second it will. This workload, many readers and almost no writers, is exactly what copy on write is for, and it is the first optimisation I would make." },
    { a: ["Rate limit state in Redis", "One shared budget across every balancer instance. A network round trip on every request."],
      b: ["Rate limit state in process", "Zero added latency. N instances means N times the intended limit, so the limit is not really a limit."],
      pick: "a",
      flip: "there is genuinely only ever one instance, or the round trip becomes the bottleneck. The mature version is both: a cheap local check for the obvious cases and the shared one for the rest." },
    { a: ["Passive health with a failure threshold", "One transient error does not evict a healthy backend. Detection takes a few failures instead of one."],
      b: ["Mark down on the first failure", "Fastest possible detection, and one cancelled client request removes a healthy backend from rotation."],
      pick: "a",
      flip: "backends are cheap and plentiful and the cost of losing one briefly is nil. In a small pool, evicting on one error can start a cascade, which is the failure this trade-off is really about." }
  ],

  next: [
    "<b>One retry to a different backend.</b> Passive detection currently makes one user pay for finding the corpse. An idempotent retry elsewhere makes the whole thing invisible, and it is the single highest value addition.",
    "<b>A failure threshold, then a circuit breaker.</b> Three failures in a window before marking down, and a half open probe before allowing traffic back. Both are small and both prevent cascades.",
    "<b>Shared pool state.</b> Either in Redis or behind service discovery, so a second instance is actually a second instance rather than a second opinion.",
    "<b>Proxy correctness.</b> Strip hop by hop headers, add X-Forwarded-For and X-Forwarded-Proto, stream the request body instead of buffering it, and move the admin routes off the public listener behind a token."
  ],

  p: [
    ["GO", "https://go.dev/doc/articles/race_detector", "The Go race detector, run the tests with -race", "M"],
    ["GO", "https://pkg.go.dev/net/http/httputil#ReverseProxy", "httputil.ReverseProxy, what the standard library already handles", "M"],
    ["GFG", "https://www.geeksforgeeks.org/system-design/load-balancing-algorithms/", "Load balancing algorithms compared", "E"],
    ["GFG", "https://www.geeksforgeeks.org/system-design/rate-limiting-system-design/", "Rate limiting, the algorithms and the trade-offs", "M"],
    ["HI", "https://www.hellointerview.com/learn/system-design/core-concepts/networking-essentials", "Hello Interview, load balancers and proxies", "M"]
  ],

  hi: {
    one: "Yeh whiteboard sketch nahi, ek real implementation hai, isliye interesting cheezein chaaron algorithms nahi hain. Interesting hain yeh: kaunsa mutex kis cheez ko protect karta hai, woh lock ordering jo do goroutines ko deadlock hone se rokti hai, aur woh chaar chhote defects jo code review se bach jaate hain aur load pe saamne aate hain.",

    brief: {
      why: "Is site ke baaki har page pe kuch design hota hai. Yeh page pehle se likhe hue code ko review karta hai, jo alag aur zyada kaam ka exercise hai: algorithms aasan hisse hain aur sab textbook hain, jabki jo state woh share karte hain wahi decide karta hai ki cheez 10,000 requests per second pe chalti hai ya nahi. Isse padhte waqt mutexes dhoondo, strategies nahi. Load balancer wo ek component bhi hai jiska apna fail hona uske peeche ka sab kuch gira deta hai, isliye uske failure modes ko happy path se zyada dhyan milna chahiye.",
      functional: [
        "Koi bhi HTTP request kisi ek backend ko <b>proxy karo</b> aur response stream karke wapas do.",
        "Chaar strategies mein se ek se <b>backend chuno</b>, jo configuration se select hoti hai: round robin, least connection, client IP pe consistent hashing, ya random.",
        "Runtime pe HTTP se backends <b>register aur deregister karo</b>, bina restart ke.",
        "<b>Dead backends pakdo</b> do tareeke se: unhe poll karke, aur yeh notice karke ki unhe gayi ek request fail hui.",
        "Per client IP <b>rate limit karo</b>, atomically, taaki kayi load balancer instances ek hi budget share karein."
      ],
      out: ["TLS termination", "request retries aur circuit breaking", "consistent hashing ke aage sticky sessions", "layer 4 balancing", "backend autoscaling"],
      nfr: [
        ["Correctness under concurrency", "no data race, no deadlock", "Har request apne goroutine mein chalti hai aur sab ek hi shared pool ko chhoote hain. Poora design isi requirement ke baare mein hai, aur race detector ki isi pe apni raay hogi."],
        ["Latency added", "sub millisecond in the balancer itself", "Balancer kisi aur ki request pe pura overhead hai. Woh per request jo bhi allocate karta hai, use ek second mein lakh baar allocate karta hai."],
        ["Failure detection", "seconds, not minutes", "Ek dead backend jise traffic milti rahe, ek backend kam hone se bura hai. Isi liye ek nahi, do detection mechanisms hain."],
        ["Availability of the balancer", "higher than anything behind it", "Yeh bane hi single point of failure ke roop mein hai. Har design decision jo in process state badhata hai, doosri copy chalana mushkil kar deta hai, aur aakhri stage isi tension ke baare mein hai."]
      ],
      numbers: [
        ["Virtual nodes per server", "150", "Ring har backend ke liye ek ki jagah 150 points rakhti hai, kyunki ek point per server bahut uneven arcs deta hai. 150 se load ka standard deviation lagbhag 5% aa jaata hai, aur zyadatar implementations isi number pe settle karte hain."],
        ["Ring lookup", "binary search over 150 times N points", "Teen backends matlab 450 points, isliye ek lookup mein lagbhag nau comparisons. Ring change pe ek baar sort hoti hai aur har request pe padhi jaati hai, jo bilkul sahi taraf ka balance hai."],
        ["Health poll interval", "10 seconds", "Sirf polling se worst case detection 10 seconds plus request timeout hai. Isi liye passive detection hai: woh dead backend ko agle poll ki jagah pehli failed request pe hi pakad leta hai."],
        ["Proxy timeout", "10 seconds", "Client pe bhi aur request context pe bhi. Generous hai, aur yahi woh ceiling hai ki ek dead backend ek goroutine ko kitni der tak pakde reh sakta hai."],
        ["Shutdown grace", "10 seconds", "In flight requests ko process exit hone se pehle khatam hone diya jaata hai. Add karna sasta hai aur isi se deploy invisible ho jaata hai."],
        ["Round robin selection", "one allocation per request", "Healthy list har call pe dobara banti hai. Correct hai, aur yeh design ka ek hot path allocation hai."],
        ["Rate limit state", "one Redis key per client", "Memory ki jagah Redis mein, jo wahi ek decision hai jo batata hai ki yeh ek se zyada instances mein chalne ke liye banaya gaya tha."]
      ],
      numbersNote: "Behas layak row aakhri wali hai. Rate limit state ko jaan boojh ke shared jagah rakha gaya, aur server pool aur health state ko nahi. Yeh asymmetry is design ki sabse interesting cheez hai aur stage 5 ka poora subject."
    },

    stagesIntro: "Chhe stages. Pehle do shared state ke baare mein hain, beech ke do algorithms aur unse majboor hui lock ordering ke baare mein, aur aakhri do failure ke baare mein aur is baat ke baare mein ki balancer ko khud survive karna hota hai.",

    stages: [
      { pressure: "Abhi kuch nahi. Ek reverse proxy lagbhag pandrah lines ka hota hai: request padho, URL rewrite karo, forward karo, response stream karke wapas do. Ise draw karna worth hai taaki uske baad ki har cheez saaf dikhe ki woh kisi cheez ka jawab hai.",
        say: "Fiber fasthttp ke upar baitha hai, isliye handler sasta hai aur framework bottleneck nahi hai. Is point pe load balancer kuch balance nahi karta: yeh ek proxy hai jisme destination compile hoke baithi hai. Yahaan se aage sab kuch is baare mein hai ki destination ek choice ban jaye, aur woh choice kayi goroutines ek saath karein.",
        breaks: "Doosre backend ka matlab ek list, list ko runtime pe badalna padta hai kyunki backends aate jaate rehte hain, aur har request apne goroutine mein chalti hai. Ek plain Go slice jise hazaar goroutines padh rahe hon aur ek uspe append kar raha ho, woh data race hai, aur Go tumhe likhne se rokega nahi." },

      { pressure: "Shared mutable state. Yahi poori problem hai: backends ki ek list, jo har request pe padhi jaati hai, aur registration API aur dono health mechanisms usse likhte hain, aise goroutines se jo ek doosre ke baare mein kuch nahi jaante.",
        say: "Ek type list ka owner hai aur uske bahar koi slice ko chhoo nahi sakta. Reads read lock lete hain aur writes write lock, jo sahi hai kyunki reads, writes se hazaaron guna zyada hain. Per server connection counter mutex field ki jagah ek atomic hai, isliye use badhane ke liye sirf read lock chahiye, aur yahi fark hai us counter mein jo scale karta hai aur us mein jo process ki har request ko serialise kar deta hai.",
        breaks: "Pool ek backend safely de sakta hai, aur usse choose karne ka sirf ek tareeka aata hai: agla utha lo. Round robin alag size ke backends ke liye galat hai, long lived connections ke liye galat hai, aur tab galat hai jab tum chahte ho ki ek hi client hamesha ek hi backend pe jaye." },

      { pressure: "Backend chunne ke chaar alag tareeke, jo startup pe configuration se chune jaate hain, aur har ek ka fair ka alag matlab. Yeh strategy ka textbook signal hai, aur yahi pattern yeh codebase actually use karta hai.",
        say: "Ek function decide karta hai, configured strategy name pe ek switch ke saath aur ek sensible default ke saath, aur har strategy ka shape same hai: healthy set lo, rule lagao, URL ya error lautao. Go mein yeh aksar interface ki jagah function type hota hai, kyunki strategies mein ek hi method hai aur apni koi state nahi. Round robin healthy count pe modulo karke atomic counter use karta hai, least connection sabse chhota atomic counter dhoondhne ke liye scan karta hai, aur random ek utha leta hai. Teeno kuch lines ke hain, aur yahi point hai: algorithms kabhi hard hissa the hi nahi.",
        breaks: "Chaar mein se teen strategies stateless hain. Consistent hashing nahi hai: use ek sorted ring chahiye jo pool ke saath step mein rakhni padti hai, yaani shared state ka doosra hissa aur isliye doosra mutex, aur deadlocks yahin se aate hain." },

      { pressure: "Doosra mutex. Jaise hi do locks maujood hain aur koi bhi code path dono le sakta hai, unhe ek defined order mein lena padta hai, warna do goroutines har ek ek lock pakde doosre ka intezaar karenge, hamesha ke liye.",
        say: "Ring hash points ko backends se map karti hai, har ek ke 150 points, taaki wahi client IP wahi backend pe jaye aur ek backend add karne se sirf uske hisse ke clients hilein, sab ko dobara shuffle na karna pade. Iska apna lock hai, aur code dono ko kabhi ek saath na pakadne ka poora dhyan rakhta hai: pool lock healthy set copy out karne ke liye liya jaata hai, chhoda jaata hai, aur tab jaake ring se poochha jaata hai. Registration doosri taraf se yahi karta hai, pool lock chhodne ke baad ring update karta hai. Yeh is codebase ka sabse experienced dikhne wala decision hai, aur interview mein zor se bolne layak hai, kyunki zyadatar log lock inversion se bachne ke bajaye use debug karke jaante hain.",
        breaks: "Har strategy ek health flag pe filter karti hai jise kisi ne kabhi set hi nahi kiya. Ek backend band ho sakta hai aur balancer usse traffic bhejta rahega jab tak koi notice na kare." },

      { pressure: "Ek dead backend jo abhi bhi traffic pa raha hai, ek backend kam hone se bura hai. Sirf polling bahut slow hai, aur sirf failures ka intezaar karne ka matlab har recovery ke baad ka pehla user guinea pig hai.",
        say: "Active checking ek goroutine hai jo har das second mein har backend ke health endpoint ko poll karta hai aur result pool mein likhta hai. Passive checking wo hai jab proxy ek backend ko usi pal down mark kar deta hai jab usko gayi request fail hoti hai, jo maut ko das second ki jagah ek request mein pakad leta hai. Dono saath standard jawab hain, aur sasta hai. Dhyan do ki ring unhealthy backend ke saath kya karti hai: woh rebuild nahi karti, woh clockwise agle healthy point tak chalti hai, isliye ek beemar backend baaki clients ko remap nahi karta.",
        breaks: "Balancer ab woh sab forward karega jo koi bhi use bheje, jitni tez woh bhej sakein, un backends ko jinke paas koi defence nahi. Aur jaise hi availability ke liye balancer ki doosri copy chahiye hoti hai, pata chalta hai ki uski aadhi state isi process mein hai." },

      { pressure: "Do problems, ek jawab. Abusive traffic edge pe marna chahiye, backend pe nahi, aur per process enforce ki gayi limit limit hai hi nahi jab ek se zyada process hon.",
        say: "Limit sabse pehle check hoti hai, backend chunne se bhi pehle, isliye rejected request ka cost ek Redis round trip hai aur kuch nahi. Check aur decrement ek Lua script ke andar hote hain, jise Redis atomically chalata hai, isliye do instances jo ek hi pal poochein woh dono ko yes nahi bol sakte. Yeh aakhri baat hi wajah hai ki state Redis mein hai, aur yeh chupke se intended deployment ke baare mein kuch batati hai: yeh ek se zyada process mein chalne ke liye banaya gaya tha. Jo pool ko, jo abhi bhi is process ki memory mein baitha hai, interesting loose end bana deta hai." }
    ],

    boxesIntro: "Barah types. Inme se do, pool aur ring, design ki har hard problem rakhte hain, aur baaki ya to stateless hain ya kisi aur ke. Pehle in do ke disadvantages aur failure rows padho.",

    boxes: [
      { job: "Ek ordinary HTTP request bhejta hai aur kabhi nahi jaanta ki koi balancer beech mein tha.",
        why: "Yeh isliye draw hua hai ki transparency ek requirement hai, nicety nahi: client ka IP wahi hai jis pe consistent hashing key karta hai aur jise rate limiter ginta hai, isliye balancer use kaise nikalta hai yeh ek real decision hai.",
        forced: "Request ke liye stage 0, identity ke sawaal ke liye stage 5.",
        alts: [["Keying the rate limit on an API key or account", "behtar hai, kyunki ek IP ek NAT ke peeche sab ke saath shared hota hai aur phone network badalne pe badal jaata hai. Jab abhi koi identity nahi hai, tab IP sahi default hai."]],
        pros: ["Client mein koi change nahi chahiye, jo reverse proxy ka poora point hai."],
        cons: ["Client ka real address tabhi correct hai jab balancer pehla hop ho. CDN ya kisi aur proxy ke peeche har client us proxy jaisa dikhta hai.", "IP ek kharab identity hai: NAT ke peeche bahut coarse aur mobile pe bahut fine."],
        cost: "Kuch nahi, aur yeh do features ki correctness decide karta hai.",
        fails: "Kisi aur proxy ke peeche deploy karo aur yeh configure na karo ki kaunsa forwarded header trust karna hai, to har request same source address ke saath aati hai. Consistent hashing sabko ek backend pe bhejta hai aur rate limiter poore internet ko ek client maan ke block kar deta hai. Fiber mein isi ke liye trusted proxy setting hai, aur woh default mein off honi chahiye, kyunki jo header client set kar sakta hai, us pe client jhooth bol sakta hai.",
        say: "Default mein IP, aur jaise hi mere aage koi hop ho, main configure karta hoon ki kaunsa forwarded header aur kin addresses se trust karna hai. Forwarded header ko bina shart trust karne se koi bhi client apna rate limit bucket khud chun sakta hai." },

      { job: "Routes own karo, request ko limit, select aur forward se guzaro, aur in flight kaam gire bina shut down ho jao.",
        why: "Yeh composition root hai. Design ka har decision ek handler ki paanch lines ke order mein dikhta hai, jo rakhne layak achhi property hai.",
        forced: "Stage 0.",
        alts: [["The standard library plus httputil.ReverseProxy", "Go mein genuinely sahi default jawab: yeh hop by hop headers, X-Forwarded-For, error hooks aur streaming ko sahi handle karta hai, aur battle tested hai. Proxy haath se likhna zyada educational hai aur subtly galat hone ki zyada jagah."], ["net/http with a custom mux", "load mein fasthttp se slow, aur har Go HTTP library ke saath fully compatible, jo fasthttp nahi hai. Yahi incompatibility Fiber choose karne ka asli cost hai."]],
        pros: ["fasthttp request aur response objects reuse karta hai, isliye framework per request lagbhag kuch allocate nahi karta.", "Poora request lifecycle ek function mein, order mein padha ja sakta hai.", "Das second ke drain ke saath graceful shutdown, plus signal handling, taaki deploy in flight requests na girae. Add karna sasta hai aur aksar chhoot jaata hai."],
        cons: ["fasthttp net/http interfaces implement nahi karta, isliye bade ecosystem ka koi bhi middleware adapter maangta hai.", "Iske reuse hone wale contexts bugs ka jaana maana source hain jab koi value handler se zyada jeeta hai, jo yahaan matter karta hai kyunki response handler ke return hone ke baad stream hota hai."],
        cost: "Ek process, ek port, hot path pe ek handler.",
        fails: "Response body handler return hone pe deferred call se close hoti hai, par streamed body fasthttp handler ke return hone ke <i>baad</i> likhta hai, aur jo stream Closer implement karti hai use fasthttp khud close karta hai. Ise jaldi close karne se load mein responses truncate hote hain, aur chhoti body ke saath haath se test mein yeh dikhta hi nahi. Deep dive dekho.",
        say: "Handler padhne mein limit, select, forward, return hai, isi order mein, aur yahi order design hai. Main ise aise hi rakhunga chahe cheezein add hoti rahein, aur jo is sentence mein fit nahi hota woh kisi aur type ka hai." },

      { job: "Chune hue backend ke against request dobara banao, bhejo, response stream karke wapas do, aur fail hone pe backend ko down mark karo.",
        why: "Yeh akela jagah hai jo user ki taraf se network ko chhoota hai, isliye yahi akela jagah hai jo real time mein jaanti hai ki backend dead hai.",
        forced: "Stage 1, aur stage 4 mein isne passive health ka role bhi le liya.",
        alts: [["httputil.ReverseProxy from the standard library", "header rules, streaming aur error hooks ko out of the box sahi handle karta hai. Haath se likha version padhne mein saaf hai aur galat hone ki zyada surface rakhta hai, jis pe failure row hai."], ["Forwarding in a goroutine and waiting on channels", "yahi yeh code karta hai, aur goroutine kuch nahi kharidta: select exactly un do channels pe wait karta hai, isliye yeh ek scheduling hop aur ek extra stack ke saath direct call hai. Hatane layak hai, aur yeh bata pana ki zaroori kyun nahi hai."]],
        pros: ["Ek shared http.Client, isliye backends ke connections pool hote hain aur reuse hote hain, har request pe dial nahi.", "Har request pe timeout wala context, isliye koi request hamesha ke liye hang nahi ho sakti.", "Failure turant useful hai: woh sirf error nahi, health signal ban jaata hai."],
        cons: ["Hop by hop headers copy hoke aage chale jaate hain. Connection, Keep-Alive aur Transfer-Encoding ek hop pe lagne ke liye defined hain aur proxy ko unhe strip karna zaroori hai.", "X-Forwarded-For add nahi hota, isliye backends real client dekh nahi sakte.", "Request body forward karne se pehle poori memory mein padh li jaati hai, jo upload size ko utne pe cap kar deta hai jitna process hold kar sake."],
        cost: "Ek outbound connection pool, har request pe ek context aur ek buffer.",
        fails: "Kisi bhi ek failure pe backend ko down mark karne ka matlab ek client ki cancelled request ya ek transient timeout ek bilkul healthy backend ko agle poll tak rotation se nikaal deta hai. Burst mein yeh cascade ban sakta hai: ek slow backend kuch requests fail karta hai, nikaal diya jaata hai, load baaki pe chala jaata hai, aur woh bhi slow ho jaate hain. Failure threshold, ek window mein teen strikes, standard fix hai aur health design mein wahi ek cheez missing hai.",
        say: "Passive health checking ko failures ginne chahiye, ek pe react nahi karna chahiye. Ek timeout client ki kahani hai; das second mein teen, backend ki kahani hai." },

      { job: "Backends ki list, unki health, aur unki connection counts own karo. Uske bahar koi slice ko chhoo nahi sakta.",
        why: "Yeh akeli mutable state hai jo process ke har goroutine ke saath shared hai, isliye yeh ek type mein compress hua poora concurrency design hai.",
        forced: "Stage 1.",
        alts: [["A plain slice with a package level mutex", "wahi cheez, bas invariant package mein bikhra hua hai type ke owner hone ki jagah, isliye naya call site lock bhool sakta hai aur production se pehle koi nahi batata."], ["sync.Map", "alag shape ke liye bana hai, kayi keys jo kam likhi jaati hain aur kayi goroutines se padhi jaati hain. Yahaan collection chhoti hai aur har request pe poori iterate hoti hai, isliye slice pe RWMutex tez bhi hai aur saaf bhi."], ["A copy on write atomic.Pointer to an immutable slice", "yahaan genuinely attractive hai. Reads lock free pointer loads ban jaate hain aur writes rare hain, jo is workload ka exact shape hai. Agar profiling lock contention dikhaye to sabse pehle main yahi optimisation karunga."]],
        pros: ["RWMutex access pattern se match karta hai: hazaaron concurrent readers, aur write sirf tab jab backend register ho ya health badle.", "Connection counts struct ke andar atomics hain, isliye ek badhane ke liye sirf read lock chahiye. Plain int se har request pe write lock lagta aur poora process serialise ho jaata.", "Maujooda URL pe Register use dobara healthy mark karta hai, duplicate nahi banata, isliye recovery idempotent hai."],
        cons: ["List pointers ka snapshot lautata hai, values ka nahi, isliye un pointers se field padhne wala caller bina kisi lock ke shared memory padh raha hai. Do call sites bilkul yahi karte hain.", "Round robin har request pe healthy slice dobara banata hai, jo hot path pe allocate karta hai aur matlab counter ek aisi list mein index karta hai jiski length neeche se badalti rehti hai.", "Least connection select aur increment do alag lock acquisitions mein karta hai, isliye ek saath aayi do requests dono ek hi least loaded backend chun sakti hain."],
        cost: "Ek mutex, ek slice, ek atomic counter. Har request pe read locked.",
        fails: "Race detector List snapshot ko turant pakad leta hai: ek goroutine write lock ke andar Healthy likhta hai jabki doosra use pointer se bina lock padhta hai. Zyadatar hardware pe yeh tab tak harmless hai jab tak nahi rehta, aur fix paanch lines ka hai. Deep dive dekho.",
        say: "Pool slice own karta hai aur values deta hai, pointers kabhi nahi. Jis pal snapshot pointer leak karta hai, lock ka koi matlab nahi rehta, aur is code ka yahi defect main sabse pehle fix karunga." },

      { job: "Ek backend: uska URL, healthy hai ya nahi, aur usko kitni requests in flight hain.",
        why: "Yeh wo unit hai jisse health flag aur connection counter belong karte hain, aur unhe ek owner dene se hi pool unke baare mein rule bol paata hai.",
        forced: "Stage 1.",
        alts: [["Parallel maps, url to healthy and url to count", "wahi data bina owner ke aur do cheezein step mein rakhni padti hain."], ["An immutable value copied out of the pool", "pointer leak ka fix: callers ko copy milti hai aur woh us pe race nahi kar sakte. Isse per read ek chhota allocation lagta hai aur bugs ki poori class hat jaati hai."]],
        pros: ["Atomic connection counter ka matlab hot path ko kabhi write lock nahi chahiye.", "Ek backend ke baare mein sab kuch ek jagah hai, isliye baad mein weight ya failure count jodna ek hi type ko chhoota hai."],
        cons: ["Kyunki struct mein atomic hai, use ek baar use hone ke baad value se copy nahi kiya ja sakta, aur isi liye pool pointers leak karta hai. Clean version identity fields ko counter se alag karta hai.", "Servers endpoint ise seedha JSON mein serialise karta hai, aur atomic ke koi exported fields nahi hote, isliye connection count ek khaali object ban ke nikalta hai."],
        cost: "Har backend ke liye ek chhota struct. Inki ginti tens mein hai, millions mein nahi.",
        fails: "Koi pointer race se bachne ke liye Server ko value se copy karta hai aur vet lock copy karne ki warning deta hai. Sahi shape hai reads ke liye alag view type, jisme plain values hon, jo pool ke andar uske lock ke neeche banaya jaye.",
        say: "Atomic wala struct copy nahi ho sakta, isliye ya to pool pointers deta hai, jo locking todta hai, ya lock ke neeche bana chhota view type deta hai. Doosra sahi hai aur lagbhag das lines ka hai." },

      { job: "Ek dispatch point jo configured strategy name ko chune hue backend mein badalta hai.",
        why: "Chunne ka rule wo cheez hai jo badalti hai. Ek function mein ek switch hi poora extension point hai, aur har strategy ka signature same hai.",
        forced: "Stage 2.",
        alts: [["A strategy interface with four implementing types", "classic jawab, aur Go mein aksar zaroorat se zyada bhari jab har strategy ka ek method ho aur koi state nahi. Function type idiomatic equivalent hai."], ["A map from name to function, populated at init", "switch hata deta hai aur nayi strategy ko khud register hone deta hai. Thoda zyada magic hai, aur jab strategies alag files mein hon tab yahi chahiye."], ["Choosing per request from a header", "testing aur per route policies ke liye genuinely useful, aur iska matlab hai ki strategy ab safely state nahi rakh sakti, kyunki round robin ka counter per process hai, per route nahi."]],
        pros: ["Default case unknown ya khaali configuration ko startup pe fail hone ki jagah round robin pe fall back karata hai.", "Har strategy wahi pair lautati hai, ek URL aur ek error, isliye caller ke paas no healthy backends ke liye ek hi path hai."],
        cons: ["Strategy startup pe set kiye gaye package level variable se padhi jaati hai, isliye restart ke bina badal nahi sakti aur test karna awkward hai.", "Least connection ki bookkeeping strategy mein nahi caller mein rehti hai, isliye handler ko pata hona chahiye ki usne kaunsi chuni. Yahi coupling wajah hai ki increment selection se race karta hai."],
        cost: "Har request pe ek string pe ek switch.",
        fails: "Nayi strategy add hoti hai, uska case selector mein add hota hai, aur handler mein connection accounting update nahi hoti, isliye use chupke se koi bookkeeping nahi milti. Accounting ko strategy ke andar le jaane se yeh possibility hi khatam ho jaati hai.",
        say: "Go mein main ise interface ki jagah function type banaunga, aur connection accounting ko least connection strategy ke andar le jaunga taaki handler ko kabhi pata hi na chale ki kaunsi configured hai." },

      { job: "Round robin, least connection aur random: healthy set se chunne ke teen tareeke.",
        why: "Yeh dikhane ke liye hain ki strategy ki ek se zyada implementation hai jinki properties genuinely alag hain, sirf code alag nahi.",
        forced: "Stage 2.",
        alts: [["Weighted round robin", "obvious agla, aur sirf Server pe ek weight chahiye. Naam lena worth hai, kyunki real backends identical nahi hote."], ["Least response time", "jab backends speed mein alag hon to least connection se behtar, aur har backend ke liye rolling latency estimate chahiye, jo real state hai."], ["Power of two choices", "do random chuno aur kam loaded le lo. Least connection ke lagbhag barabar achha, na scanning na counter bookkeeping. Yahi main actually suggest karunga."]],
        pros: ["Teeno kuch lines ke hain aur ek atomic counter ke alawa unki apni koi state nahi.", "Random ko koi coordination nahi chahiye, isliye yahi akela hai jo kayi balancer instances ke across trivially correct hai.", "Jab request durations bahut vary karti hain to least connection sahi default hai, aur tab round robin sabse kharab hota hai."],
        cons: ["Round robin ka counter aisi healthy list mein index karta hai jiski length badalti hai, isliye jab backend girta hai to rotation sabke liye shift ho jaati hai, ek slot skip nahi hota.", "Least connection har request pe har backend scan karta hai. Tens ke liye theek, hazaaron ke liye galat, aur power of two choices ise fix karta hai.", "Round robin har request pe naya healthy slice allocate karta hai, jo hot path pe wahi ek avoidable allocation hai."],
        cost: "Tens ki list pe har request pe ek O(n) scan.",
        fails: "Load mein do requests ek saath aati hain, dono scan karti hain, dono ek hi backend ko least loaded dekhti hain, aur kisi ke increment karne se pehle dono usse bhej deti hain. Counter atomic hai par read aur increment ek operation nahi hain. Select aur increment ek hi lock ke neeche karo aur window khatam.",
        say: "Least connection mein chunne aur increment karne ke beech ek check then act window hai. Fix hai choice aur increment ko pool ke andar ek operation banana, jo handler se strategy specific code bhi hata deta hai." },

      { job: "Client IP ko ek backend se map karo, taaki wahi client wahi backend pe aata rahe.",
        why: "Sessions ke bina session affinity. Backends ki ginti pe modulo simple hota aur count badalne pe lagbhag har client ko remap kar deta, jo wahi cheez hai jise cache ya in memory session survive nahi kar sakta.",
        forced: "Stage 3, aur yeh doosra mutex saath laayi.",
        alts: [["hash(ip) modulo backend count", "ek line, aur teen mein chautha backend jodne se lagbhag teen chauthai clients hil jaate hain. Consistent hashing se lagbhag ek chauthai hilte hain, aur yahi is technique ke hone ki poori wajah hai."], ["Rendezvous hashing", "arguably nicer: na ring, na virtual nodes, na sorting, aur har lookup pe har backend ke liye ek hash compute karta hai. Tens of backends pe yeh sunne se sasta hai aur code aadhe size ka hai."], ["Sticky sessions via a cookie", "precise, aur balancer ko cookies samajhna aur set karna padta hai, aur jo browser nahi hai uske liye kaam nahi karta."]],
        pros: ["Har backend ke 150 virtual nodes load ke spread ko kuch percent ke andar le aate hain, jabki ek node per backend bahut uneven hota.", "Lookup sorted slice pe binary search hai, isliye logarithmic aur allocation free.", "Unhealthy backend ko hataya nahi jaata, clockwise paar kiya jaata hai, isliye beemar backend sirf apne clients ko remap karta hai aur baaki sabka mapping chhoota nahi. Yahi property poora point hai aur ise khona aasan hai."],
        cons: ["Doosra mutex, jahan se lock ordering problem aati hai.", "Removal har virtual node ka hash dobara compute karke use delete karta hai, isliye agar do backends ke virtual nodes kabhi ek hi 32 bit point pe collide karein to ek ko hataane se doosra chupke se unmap ho jaata hai. Kuch sau backends se neeche unlikely hai aur jaanna worth hai.", "Ring har registered backend ko rakhti hai, healthy ho ya nahi, isliye har lookup pe healthy set pass karna padta hai."],
        cost: "Har backend ke 150 points, change pe sorted, read pe binary searched.",
        fails: "Koi pool lock leke ring mein call karta hai jabki doosra goroutine ring lock pakde pool ka intezaar kar raha hai. Dono ruk jaate hain. Yeh code jaan boojh ke isse bachta hai: healthy set copy out karke, pool lock chhodke, tab ring query karke, aur ek comment mein likhke. Yahi sahi fix hai aur bolne ki sahi jagah.",
        say: "Kabhi do locks mat pakdo. Jo chahiye woh pehle lock ke neeche se copy out karo, use chhodo, phir doosra lo. Aur 150 virtual nodes koi magic number nahi, yeh wo point hai jahan load ka spread itni tez improve hona band ho jaata hai ki memory ka kharcha worth na rahe." },

      { job: "Ek background goroutine jo har backend ka health endpoint interval pe poll karta hai aur result pool mein likhta hai.",
        why: "Sirf passive detection recovery kabhi notice nahi karti, isliye wapas aaya backend hamesha rotation se bahar rehta. Active checking hi backend ko wapas judne deti hai.",
        forced: "Stage 4.",
        alts: [["Passive detection only", "sasta hai aur koi backend kabhi wapas nahi aata, kyunki succeed karne ke liye koi use traffic bhej hi nahi raha."], ["Backends registering their own heartbeats", "direction ulti kar deta hai, aur matlab woh backend jo POST karne layak zinda hai par serve karne layak toota hua, healthy maana jaata hai."], ["A readiness endpoint that checks dependencies", "us handler se kaafi behtar jo bina shart 200 lautata hai. Jis backend ka database unreachable hai use apna health check fail karna chahiye."]],
        pros: ["Ek goroutine, ek ticker, har backend ke liye har interval ek HTTP call. Lagbhag free.", "Checks parallel chalte hain, isliye ek hung backend baaki ko delay nahi karta.", "Recovery automatic hai aur kisi insaan ki zaroorat nahi."],
        cons: ["Response body kabhi close nahi hoti, isliye har poll ek connection aur ek file descriptor leak karta hai. Har das second pe, hamesha ke liye: ek slow, pakka leak.", "Poll ek aise client se hota hai jisme timeout nahi, isliye jo backend connection accept karke kabhi jawab nahi deta woh ek goroutine ko permanently pakde rehta hai, aur agle tick pe naya banta hai. Yeh ek unbounded goroutine leak hai jiska trigger hung backend hai.", "Ek failed poll flag flip kar deta hai, isliye ek dropped packet healthy backend ko das second tak rotation se nikaal sakta hai."],
        cost: "Ek goroutine plus har backend ke liye har interval ek. Agar do leaks fix ho jaayein to negligible.",
        fails: "Ek backend connections refuse karne ki jagah hang ho jaata hai. Har das second mein ek aur goroutine banta hai aur hamesha ke liye block ho jaata hai. Ek raat mein hazaaron atke hue goroutines aur unke sockets. Dono leaks ek ek line ke hain: body close karo, aur client ko timeout do.",
        say: "Do ek line ke fix is component ko sambhalte hain: response body close karo, aur default client ki jagah timeout wala client use karo, jisme koi timeout nahi hota. Phir failure threshold add karo taaki ek dropped packet healthy backend ko evict na kare." },

      { job: "Decide karo ki yeh client yeh request kar sakta hai ya nahi, koi backend chune jaane se pehle.",
        why: "Abusive traffic ko jitna jaldi aur sasta ho sake reject karna chahiye, aur balancer sabse pehli cheez hai jise tum own karte ho.",
        forced: "Stage 5.",
        alts: [["A token bucket in process memory", "zero latency aur Redis nahi, aur do balancer instances ke saath har client ko double limit milti hai. Yahi ek sentence wajah hai ki state remote hai."], ["Fixed window counters", "implement karna sabse simple aur window boundary pe double burst allow karta hai, jo log sliding windows pe jaane ki classic wajah hai."], ["Sliding window log", "exact hai aur har request ka timestamp store karta hai, jo sabse busy clients ke liye mehenga hai, jinhe hi limit karna hai."]],
        pros: ["Ek call ke peeche do algorithms, configuration se chune, jo backend selection ka wahi strategy shape hai. Dono ke beech consistency ki kuch value hai.", "Token bucket burst aur phir steady rate allow karta hai, jo hard cap se behtar real clients ke behaviour se match karta hai.", "Yeh selection se pehle chalta hai, isliye rejected request kabhi backend ya pool ko nahi chhoo."],
        cons: ["Yeh har request pe Redis round trip daalta hai, unpe bhi jo allow hongi. Shared limit ki yahi keemat hai aur ise bolna chahiye.", "Redis ka unavailable hona ek policy sawaal hai jiska koi achha default nahi: fail open karo to limit gayab, fail closed karo to Redis poori site gira deta hai."],
        cost: "Har request pe ek Redis round trip, local network pe sub millisecond.",
        fails: "Redis unreachable hai. Design ne pehle se tay kar rakha hona chahiye ki kis taraf fail karna hai, aur rate limiter ke liye jawab lagbhag hamesha open hai, alert ke saath, kyunki ek healthy system ko protect karne wala rate limiter kabhi us system ke down hone ki wajah nahi hona chahiye.",
        say: "Fail open, zor se. Rate limiter ek guard rail hai, aur jo guard rail toote to road band kar de woh bina guard rail se bura hai. Is box ke peeche wali library ka design uske apne page pe hai, <a href='?p=ratelimiter-lld'>Rate limiter</a>, aur woh abhi fail closed karti hai, jo main sabse pehle badalunga." },

      { job: "Har client ke liye ek bucket rakho, aur check aur decrement ko ek indivisible operation ke roop mein chalao.",
        why: "Counter balancer instances ke across shared hona chahiye aur read aur write atomic. Lua script ke saath Redis is jode ke liye standard jawab hai.",
        forced: "Stage 5.",
        alts: [["GET then SET from the application", "beech mein gap ke saath do round trips, isliye do instances dono teen tokens bache padhte hain aur dono ek kharch kar dete hain. Yeh is page pe har jagah wala wahi check then act bug hai, network ke upar."], ["INCR with an expiry", "atomic hai aur sirf fixed window implement karta hai, aisa bucket nahi jo waqt ke saath refill ho."], ["A local limiter plus a shared one", "bade systems yahi karte hain: obvious cases ke liye sasta in process check aur baaki ke liye shared wala. Agar Redis round trip kabhi matter kare to optimisation ke roop mein naam lena worth hai."]],
        pros: ["Lua server pe chalta hai, isliye poora read, refill, compare aur write sequence ek atomic operation hai jisme andar koi round trip nahi.", "Har client ke liye TTL ke saath ek chhoti key, isliye inactive clients khud expire ho jaate hain aur kuch cleanup nahi karna.", "Design mein yahi akeli state hai jise kayi balancer instances pehle se sahi tareeke se share karte hain."],
        cons: ["Har ek request ke hot path pe network dependency.", "Yeh shared component hai, isliye usi Redis pe ek shor machane wala padosi sabke rate limiting ko affect karta hai.", "Bucket key client IP se banti hai, isliye users se bhara NAT ek bucket share karta hai."],
        cost: "Har active client ke liye ek key, har request pe ek round trip aur ek script evaluation.",
        fails: "Redis fail over karta hai aur buckets kho jaate hain. Har client ko poora bucket mil jaata hai, jo intended rate ka double ek chhoti window ke liye hai. Rate limiter ke liye yeh bilkul acceptable failure hai aur yeh kehna worth hai, kyunki isi se synchronously replicate na karne ka faisla justify hota hai.",
        say: "Lua script hi poora point hai. Check aur decrement server pe ek operation mein, kyunki client se do mein karna wahi race hai jise yeh design teen aur jagah, teen aur tareeke se fix karta hai." },

      { job: "Asli kaam karo. Runtime pe HTTP se register aur deregister hote hain.",
        why: "Yeh external isliye draw hue hain kyunki balancer ka un pe koi control nahi, sirf is baare mein raay hai ki woh zinda hain ya nahi.",
        forced: "Stage 0.",
        alts: [["A static list from configuration", "simple hai, aur matlab backend add karna balancer ka deploy hai."], ["Service discovery, Consul or etcd or DNS", "production actually yahi karta hai, aur yeh registration API hata deta hai aur pool ko kisi aur ke sach ka cache bana deta hai. Yahi stage 5 ki multi instance problem ka bhi jawab hai."]],
        pros: ["Runtime registration ka matlab scale out ke liye na restart na configuration change.", "Backend ka boot pe khud ko register karna natural pattern hai aur kisi orchestrator ki zaroorat nahi."],
        cons: ["Registration endpoints pe koi authentication nahi, isliye jo bhi balancer tak pahunch sake woh backend add karke traffic pa sakta hai, ya sabko hata sakta hai.", "Registration sirf usi instance tak pahunchta hai jisne use receive kiya, jo wahi loose end hai jiske baare mein aakhri stage hai."],
        cost: "Balancer ko slice entry aur health poll ke alawa kuch nahi.",
        fails: "Registration API proxied traffic ke same port pe exposed hai, isliye jo path backend bhi serve karta ho woh shadow ho sakta hai, aur bahar ka koi bhi apna server register kar sakta hai. Admin routes ko alag port ya internal interface pe bind karo, aur token maango.",
        say: "Register aur deregister administrative hain, aur woh user traffic wale hi public listener pe hain, bina auth ke. Kahin real jagah jaane se pehle alag port, ya kam se kam ek shared secret." }
    ],

    patternsIntro: "Ek pattern do baar use hua hai aur dono baar apni jagah kamata hai. Is codebase ka interesting hissa pattern nahi hai, concurrency discipline hai, isliye aakhri do entries naamon ke baare mein nahi, aadaton ke baare mein hain.",

    patterns: [
      { what: "Ek dispatch function, configuration se chune gaye chaar interchangeable selection rules.",
        varies: "Backend kaise chuna jaata hai. Aaj chaar rules jinki properties genuinely alag hain, aur weighted aur power of two choices obvious additions hain.",
        without: "Selection rule handler mein inline, isliye use badalne ka matlab traffic proxy karne wale code ko edit karna.",
        cost: "Go mein ise interface ki jagah function type chahiye, kyunki strategies mein ek method hai aur koi state nahi. Yahaan interface use karna Java ki aadat import karna hota." },
      { what: "Token bucket ya sliding window ek call ke peeche, configuration se selected.",
        varies: "Limiting algorithm, aur unka burst behaviour alag hai, code shape nahi.",
        without: "Har call site pe ek conditional, ek aise function mein jo har ek request se pehle chalta hai.",
        cost: "Do algorithms ko alag parameters chahiye, isliye ek ki configuration doosre ke liye meaningless hai. Yeh theek hai aur ise startup pe validate karna chahiye, chupke se zero pe default nahi hona chahiye." },
      { what: "Koi named pattern nahi, aur is codebase ki sabse valuable aadat. Jo chahiye woh lock A ke neeche banao, use chhodo, phir lock B lo.",
        varies: "Kuch nahi. Yeh isliye hai ki do locks kabhi ek saath pakde na jaayein, jo deadlock ko unlikely nahi, structurally impossible banata hai.",
        without: "Do goroutines har ek ek lock pakde doosre ka intezaar kar rahe hain, raat ke teen baje, load mein, aur kabhi test mein nahi.",
        cost: "Copy kiye hue set ke liye ek chhota allocation, aur copy ek snapshot hai, isliye jab tak use ho woh stale ho sakti hai. Yahaan theek hai: ek stale health flag ki keemat ek misrouted request hai." },
      { what: "Ek package level pool jise har strategy seedha uthati hai.",
        varies: "Kuch nahi, aur yeh ek dependency chhupata hai jo strategies ko declare karni chahiye.",
        without: "Pool ko pass karo. Production mein wahi single instance, aur ab do tests alag pools ke saath parallel chal sakte hain.",
        cost: "Yeh yahaan ka ek design decision hai jo code ko test karna mushkil banata hai, aur yahi wajah hai ki har strategy kisi cheez ka method nahi, package level function hai. Badalne layak hai, aur chhota change hai." },
      { what: "Rate limiting, selection, forwarding aur accounting composable middleware ke roop mein, paanch statements ki jagah.",
        varies: "Steps ka set, jo genuinely badhne wala hai: authentication, tracing, retries, circuit breaking.",
        without: "Ek handler jo ek ek step badhta hai, jo paanch steps pe bilkul readable hai aur barah pe nahi rehta.",
        cost: "Indirection, aur poora lifecycle ek function mein padh pane ka nuksaan, jo abhi is design ki sabse achhi properties mein se ek hai. Abhi nahi. Bolo kab." }
    ],

    flowsIntro: "Ek request, phir do tareeke jinse pata chalta hai ki backend dead hai. Doosra aur teesra wahi hain jahan design apni jagah kamata hai, aur jahan defects rehte hain.",

    flows: [
      { n: "A proxied request",
        steps: [
          ["Fiber handler ko ek context deta hai. Client IP padha jaata hai, aur woh tabhi real client hai jab is process ke aage kuch nahi hai."],
          ["Rate limiter Redis mein ek Lua script chalata hai: bucket ko elapsed time se refill karo, compare karo, decrement karo, sab ek operation mein. Budget se upar 429 lautata hai aur request yahin ruk jaati hai, kisi backend ko chhue bina."],
          ["Selector configured strategy pe dispatch karta hai. Har ek pool read lock leti hai, healthy pe filter karti hai, apna rule lagati hai, aur URL lautati hai."],
          ["Least connection ke liye, handler us backend ka atomic counter badhata hai. Yeh doosra lock acquisition hai, aur chunne aur badhane ke beech ka gap hi race hai."],
          ["Backend URL ke against ek naya request banta hai das second ke context ke saath, headers copy hote hain, aur body forward hoti hai."],
          ["Response client ko stream hoke wapas jaata hai. Counter decrement hota hai. Dhyan do ki streaming handler ke return hone ke baad hoti hai, jo deferred close ko khatarnak banata hai."]
        ] },
      { n: "A backend dies, discovered passively",
        note: "Ek request cost bharti hai. Uske baad sab kisi aur taraf route hote hain.",
        steps: [
          ["Proxy call error lautata hai: connection refused, ya context deadline expire ho gayi."],
          ["Pool ko us backend ko unhealthy mark karne ko kaha jaata hai, write lock ke neeche. Har agla selection use turant filter kar deta hai."],
          ["Jis client ne discovery trigger ki use 500 milta hai. Koi retry nahi, isliye ek user detection ki keemat bharta hai. Ek alag backend pe ek retry ise invisible bana deta, aur yahi sabse valuable missing feature hai."],
          ["Ring nahi badalti. Jis hashed client ka backend abhi mara woh clockwise agle healthy point pe chalta hai, aur baaki har client ka mapping chhoota nahi."]
        ] },
      { n: "A backend recovers, discovered actively",
        steps: [
          ["Har das second mein checker goroutine har registered backend ke liye ek goroutine spawn karta hai."],
          ["Har ek backend ke health endpoint pe GET bhejta hai. Is call pe koi timeout nahi, jo leak hai: jo backend accept karke kabhi jawab nahi deta woh us goroutine ko hamesha ke liye pakde rehta hai."],
          ["2xx backend ko dobara healthy mark karta hai, isliye recovery ko na insaan chahiye na registration call."],
          ["Response body kabhi close nahi hoti, isliye har poll ek connection leak karta hai. Do ek line ke fix, aur yeh wo component hai jise inki sabse zyada zaroorat hai."]
        ] }
    ],

    apiNote: "Das second ki cheez: admin routes aur proxy ka catch all ek hi public listener pe hain, bina authentication ke. Jo bhi balancer tak pahunch sake woh har backend ko deregister kar sakta hai.",

    api: [
      ["POST /register {url}", "200", "Backend aur uske 150 virtual nodes ring mein jodta hai. Idempotent: maujooda URL register karne se woh dobara healthy mark hota hai, jo recovery ko repeat karne ke liye safe banata hai."],
      ["POST /deregister {url}", "200", "Use pool aur ring dono se hataata hai. Us tak in flight requests affect nahi hoti, jo sahi hai."],
      ["GET /servers", "list of backends", "Har backend ki health aur connection count. Operator ke liye pool mein yahi akeli khidki hai, isliye connection count ka khaali object ke roop mein serialise hona matter karta hai."],
      ["ALL *", "the backend's response", "Baaki sab proxy hota hai. Dhyan do ki yeh catch all upar ke teen admin routes ke saath ek hi listener share karta hai, jo backends card ka security sawaal hai."],
      ["GET /health on each backend", "2xx if alive", "Woh contract jis pe balancer depend karta hai. Jo handler bina shart 200 lautata hai woh bekaar se bhi bura hai: woh ek process report karta hai, service nahi."]
    ],

    tradeoffsIntro: "Chaar decisions, aur pehla wahi hai jise dono taraf se defend kar pana chahiye.",

    tradeoffs: [
      { a: ["Copy out, then take the second lock", "Deadlock structurally impossible hai. Copy kiya hua set ek request se stale ho sakta hai."],
        b: ["A documented global lock ordering", "Na copy na staleness. Sirf tab tak correct jab tak har future contributor rule follow kare."],
        flip: "copy mehenga ho jaye, jo yahaan kabhi nahi hota kyunki list tens of entries ki hai. Ek hot path mein bade structure ke saath, dono mutexes pe ordering plus comment behtar trade hai." },
      { a: ["An RWMutex over a slice", "Simple, obvious, aur har request pe read locked. Contention eventually aata hai aur sirf real load mein."],
        b: ["Copy on write behind an atomic pointer", "Lock free reads. Har write poora slice copy karta hai, jo theek hai kyunki writes rare hain."],
        flip: "profiling read path pe lock contention dikhaye, jo hazaaron requests per second pe hoga. Yeh workload, kayi readers aur lagbhag koi writer nahi, bilkul wahi hai jiske liye copy on write bana hai, aur pehla optimisation yahi hoga jo main karunga." },
      { a: ["Rate limit state in Redis", "Har balancer instance ke across ek shared budget. Har request pe network round trip."],
        b: ["Rate limit state in process", "Zero added latency. N instances ka matlab intended limit ka N guna, isliye limit asal mein limit nahi."],
        flip: "sach mein sirf ek hi instance hai, ya round trip bottleneck ban jaye. Mature version dono hai: obvious cases ke liye sasta local check aur baaki ke liye shared wala." },
      { a: ["Passive health with a failure threshold", "Ek transient error healthy backend ko evict nahi karta. Detection mein ek ki jagah kuch failures lagte hain."],
        b: ["Mark down on the first failure", "Sabse tez possible detection, aur ek cancelled client request healthy backend ko rotation se hata deta hai."],
        flip: "backends sasta aur bahut hain aur ek ko thodi der kho dene ki keemat nil hai. Chhote pool mein ek error pe evict karna cascade shuru kar sakta hai, jo asal mein is trade-off ka failure hai." }
    ],

    next: [
      "<b>Ek alag backend pe ek retry.</b> Passive detection abhi ek user se laash dhoondhne ki keemat vasool karti hai. Kahin aur ek idempotent retry poori cheez ko invisible bana deta hai, aur yahi sabse valuable addition hai.",
      "<b>Ek failure threshold, phir circuit breaker.</b> Down mark karne se pehle ek window mein teen failures, aur traffic wapas aane se pehle ek half open probe. Dono chhote hain aur dono cascades rokte hain.",
      "<b>Shared pool state.</b> Ya to Redis mein ya service discovery ke peeche, taaki doosra instance sach mein doosra instance ho, doosri raay nahi.",
      "<b>Proxy correctness.</b> Hop by hop headers strip karo, X-Forwarded-For aur X-Forwarded-Proto add karo, request body ko buffer karne ki jagah stream karo, aur admin routes ko token ke peeche public listener se hatao."
    ]
  }
},

/* ==========================================================================
   9. LLD: RATE LIMITER LIBRARY
   ========================================================================== */
{
  id: "ratelimiter-lld", kind: "lld", n: "Rate limiter", sub: "Go library, Redis and Lua",
  tags: ["atomicity", "two algorithms", "lazy refill", "library design", "shipped code"],
  one: "Rate limiting is a read, a decision and a write over state that several processes share. Do those three things from your own process and you have a race; the entire library exists to move all three inside Redis, where they become one operation.",

  brief: {
    why: "This is the smallest project on the page, under five hundred lines, and it has the highest ratio of decision to code. Almost none of it is the algorithms, which are twenty lines of Lua each. The interesting parts are why the logic runs on the database rather than in the caller, how a bucket refills without anything ever refilling it, why one line of the sliding window script would silently undercount without a UUID in it, and what a library owes the program that imports it. It is also a good place to notice that a library has users who cannot see inside it, so every decision it makes quietly on their behalf is one they cannot make themselves.",
    functional: [
      "<b>Decide</b> whether a given key may make a request right now, in one call.",
      "<b>Token bucket</b>: tokens accrue at a fixed rate up to a burst ceiling, and a request spends some. Short bursts allowed, long term average enforced.",
      "<b>Sliding window</b>: at most N requests in any trailing window of time, with no boundary spike.",
      "<b>Work across processes.</b> Ten copies of the caller must share one budget, not get ten budgets.",
      "<b>Cost nothing when idle.</b> A key nobody has used should stop existing without anything sweeping it up."
    ],
    out: ["HTTP middleware", "per route or per plan configuration", "distributed quota borrowing", "leaky bucket and fixed window", "metrics and observability"],
    nfr: [
      ["Atomicity", "check and decrement are one operation", "This is the requirement. Everything else in the design follows from it, and it is the reason the algorithms live in Redis rather than in Go."],
      ["Correct across processes", "N callers, one budget", "A limiter that is only correct in one process is not a limiter, it is a suggestion. This is why the state is remote at all."],
      ["Latency", "one round trip per decision", "The limiter runs before every request it guards, so its cost is added to everything. One round trip is the floor and the design should not exceed it."],
      ["Behaviour when Redis is down", "a decision, not an accident", "Fail open and the limit vanishes. Fail closed and Redis takes the whole service down. Either is defensible; silently choosing one for your caller is not."],
      ["Idle cost", "zero", "Every key carries a TTL derived from its own parameters, so inactive clients expire themselves and nothing has to run a cleanup job."]
    ],
    numbers: [
      ["Token bucket state", "two fields, about 100 bytes", "A hash holding tokens and a timestamp. Constant per key no matter how much traffic that key makes, which is the bucket's headline advantage."],
      ["Sliding window state", "one member per request in the window", "A sorted set entry is a nanosecond timestamp plus a UUID, so roughly 80 bytes each. At a limit of 100 requests that is about 8 KB per key."],
      ["The memory ratio", "about 80 to 1", "Per key, per algorithm. At a million active clients that is 100 MB against 8 GB, which is the difference between a Redis instance and a Redis budget conversation."],
      ["Token bucket TTL", "ceil(burst / rate) seconds", "Exactly the time an empty bucket takes to refill completely. After that the stored state is indistinguishable from a fresh key, so expiring it loses nothing. This derivation is the nicest line in the codebase."],
      ["Sliding window TTL", "the window length", "After one window with no requests, every entry would have been evicted anyway. Same reasoning, different unit."],
      ["Round trips per decision", "one", "The whole point of the script. A read then a write from Go would be two round trips and a race between them."],
      ["Script bytes on the wire", "about 600, every single call", "Because the script is sent by value rather than by hash. Sending the 40 byte SHA instead is a one line change and it applies to every request the service ever serves."]
    ],
    numbersNote: "Two rows carry the design. <b>80 to 1</b> is the real reason to pick between the algorithms, and it is a memory argument rather than a correctness one. <b>ceil(burst / rate)</b> is the TTL derived from the parameters themselves, which is what makes idle keys free without a sweeper."
  },

  stagesIntro: "Six stages. The first two are wrong in ways that are worth feeling, the third is the idea the library exists for, the next two are the two algorithms and their one subtle line each, and the last is the difference between code that works and a library somebody else can rely on.",

  stages: [
    { t: "0. A counter in a variable",
      pressure: "Nothing yet. This is what everybody writes first and it is wrong twice over, which is a good ratio for four lines of code.",
      nodes: [
        { id: "caller", l: "Caller", s: "one process", col: 0, row: 0, r: "client" },
        { id: "api", l: "Limiter", s: "map of key to count", col: 1, row: 0, r: "svc" }
      ],
      edges: [{ a: "caller", b: "api", l: "allowed?" }],
      add: ["caller", "api"],
      say: "A map from key to a count, incremented on each request, reset on a timer. It works in a test and it is wrong twice. It is wrong per process, so two copies of the service give every client twice the limit. And the increment is a read and a write from several goroutines, so it needs a mutex before it is even correct locally.",
      breaks: "Both problems have the same shape: state that several things share, changed by a read followed by a write. Adding a mutex fixes it inside one process and does nothing across two." },

    { t: "1. Move the counter somewhere shared",
      pressure: "Several processes, one budget. The state has to leave the process, and the obvious destination is Redis with an increment and an expiry.",
      nodes: [
        { id: "caller", l: "Caller", s: "many processes", col: 0, row: 1, r: "client" },
        { id: "api", l: "Limiter", s: "INCR, then EXPIRE", col: 1, row: 1, r: "svc" },
        { id: "redis", l: "Redis", s: "one counter per key", col: 3, row: 1, r: "store" }
      ],
      edges: [
        { a: "caller", b: "api", l: "allowed?" },
        { a: "api", b: "redis", l: "INCR" }
      ],
      add: ["redis"],
      say: "A key per client per window, incremented and given a TTL. Every process now shares one number, which fixes the important half of the problem, and INCR is itself atomic so the counter cannot be lost. This is a fixed window counter and it is a completely reasonable thing to ship.",
      breaks: "Two things. A fixed window allows a double burst across its boundary: the full limit at 59.9 seconds and the full limit again at 60.1. And the moment the rule needs anything more than an increment, a refill, a comparison against a stored timestamp, a count of what is still inside a window, it becomes read, decide, write. Three steps from Go, with a gap between each pair, and two processes can both read the same value and both decide yes." },

    { t: "2. Put the decision where the data is",
      pressure: "Read, decide, write has to be one indivisible step. It cannot be, from the outside, over a network, from several processes at once.",
      nodes: [
        { id: "caller", l: "Caller", col: 0, row: 1, r: "client" },
        { id: "api", l: "RateLimiter", s: "sends key and args", col: 1, row: 1, r: "svc" },
        { id: "tb", l: "Token bucket Lua", s: "runs inside Redis", col: 2, row: 1, r: "impl" },
        { id: "redis", l: "Redis", s: "single threaded", col: 3, row: 1, r: "store" },
        { id: "hash", l: "Bucket hash", s: "tokens, timestamp", col: 4, row: 0, r: "value" }
      ],
      edges: [
        { a: "caller", b: "api", l: "allowed?" },
        { a: "api", b: "tb", l: "EVAL" },
        { a: "tb", b: "redis", l: "runs on" },
        { a: "redis", b: "hash", l: "holds" }
      ],
      add: ["tb", "hash"],
      say: "The whole algorithm moves into a Lua script that Redis runs on your behalf. Redis executes a script as one unit, so the read, the arithmetic, the comparison and the write cannot be interleaved with anybody else's. The race is not made unlikely, it is made impossible, and no lock exists anywhere. Note what this costs the caller: nothing. One round trip, same as the increment, and now the logic can be arbitrarily complicated.",
      breaks: "The bucket has to refill over time, and nothing is running to refill it. The obvious answer, a background job that tops up every bucket on a tick, would mean a process whose work grows with the number of clients, doing nothing useful for the vast majority of them." },

    { t: "3. The bucket that fills itself",
      pressure: "Refill is a function of elapsed time, and the only moment anybody cares about the token count is when a request arrives. So compute it then, from the stored timestamp, and never run anything in the background at all.",
      nodes: [
        { id: "caller", l: "Caller", col: 0, row: 1, r: "client" },
        { id: "api", l: "RateLimiter", s: "rate, burst", col: 1, row: 1, r: "svc" },
        { id: "tb", l: "Token bucket Lua", s: "lazy refill on read", col: 2, row: 1, r: "impl" },
        { id: "redis", l: "Redis", s: "single threaded", col: 3, row: 1, r: "store" },
        { id: "hash", l: "Bucket hash", s: "tokens, timestamp, TTL", col: 4, row: 0, r: "value" }
      ],
      edges: [
        { a: "caller", b: "api", l: "allowed?" },
        { a: "api", b: "tb", l: "EVAL" },
        { a: "tb", b: "redis", l: "runs on" },
        { a: "redis", b: "hash", l: "holds" }
      ],
      add: [],
      say: "Read the stored token count and the time it was stored, add rate times elapsed, cap at burst, and write it back with the new timestamp. The bucket is always exactly as full as it should be at the instant somebody asks, and it is never touched otherwise. And the TTL is derived from the parameters rather than picked: an empty bucket refills completely in burst over rate seconds, so after that long a stored bucket is indistinguishable from a fresh one and deleting it loses nothing. That is why an idle client costs zero and nothing has to sweep.",
      breaks: "A bucket smooths bursts by design, which is exactly wrong when the requirement is a hard cap: no more than a hundred calls per minute, ever, including in the first second." },

    { t: "4. A window that actually slides",
      pressure: "A different requirement needs a different structure. Counting per fixed window allows a double burst at the boundary, and a bucket is deliberately permissive about bursts, so neither answers a strict cap.",
      nodes: [
        { id: "caller", l: "Caller", col: 0, row: 1, r: "client" },
        { id: "api", l: "RateLimiter", s: "two constructors", col: 1, row: 1, r: "svc" },
        { id: "tb", l: "Token bucket Lua", s: "hash, O(1)", col: 2, row: 1, r: "impl" },
        { id: "sw", l: "Sliding window Lua", s: "sorted set, O(n)", col: 2, row: 2, r: "impl" },
        { id: "redis", l: "Redis", s: "single threaded", col: 3, row: 1, r: "store" },
        { id: "hash", l: "Bucket hash", s: "tokens, timestamp", col: 4, row: 0, r: "value" },
        { id: "zset", l: "Window sorted set", s: "one member per request", col: 4, row: 2, r: "value" }
      ],
      edges: [
        { a: "caller", b: "api", l: "allowed?" },
        { a: "api", b: "tb", l: "EVAL" },
        { a: "api", b: "sw", l: "or EVAL", bend: 0.8 },
        { a: "tb", b: "redis", l: "runs on" },
        { a: "sw", b: "redis", bend: 0.8 },
        { a: "redis", b: "hash", l: "holds", bend: 0.8 },
        { a: "redis", b: "zset", l: "or holds", bend: 0.8 }
      ],
      add: ["sw", "zset"],
      say: "A sorted set of request timestamps. Evict everything older than the window, count what is left, and if that is under the limit, add this request. Three commands, one script, atomic. The subtle line is the member: it is the timestamp <i>plus a UUID</i>, because a sorted set is a set, and two requests landing on the same nanosecond with the same member would collapse into one entry and quietly undercount. The price of exactness is memory proportional to the limit rather than constant, which is the real trade-off between the two algorithms.",
      breaks: "Both scripts are handed the current time by the caller, from the caller's own clock. With one process that is fine. With ten processes it is ten clocks, and they do not agree." },

    { t: "5. The clock, and what a library owes its caller",
      pressure: "Two problems that are both about the boundary. The time comes from outside and cannot be trusted to agree between processes, and the answer goes outside as a single bit that throws away everything the script knew.",
      nodes: [
        { id: "caller", l: "Caller", s: "middleware, handler", col: 0, row: 1, r: "client" },
        { id: "tests", l: "miniredis tests", s: "a clock you control", col: 0, row: 3, r: "work" },
        { id: "api", l: "RateLimiter", s: "returns a bool today", col: 1, row: 1, r: "svc" },
        { id: "clock", l: "Clock", s: "caller's, not Redis's", col: 2, row: 0, r: "ext" },
        { id: "tb", l: "Token bucket Lua", s: "hash, O(1)", col: 2, row: 1, r: "impl" },
        { id: "sw", l: "Sliding window Lua", s: "sorted set, O(n)", col: 2, row: 2, r: "impl" },
        { id: "redis", l: "Redis", s: "single threaded", col: 3, row: 1, r: "store" },
        { id: "hash", l: "Bucket hash", s: "tokens, timestamp", col: 4, row: 0, r: "value" },
        { id: "zset", l: "Window sorted set", s: "one member per request", col: 4, row: 2, r: "value" }
      ],
      edges: [
        { a: "caller", b: "api", l: "allowed?" },
        { a: "tests", b: "api", l: "FastForward", bend: 0.8 },
        { a: "api", b: "clock", l: "time.Now", bend: 0.8 },
        { a: "api", b: "tb", l: "EVAL" },
        { a: "api", b: "sw", l: "or EVAL", bend: 0.8 },
        { a: "tb", b: "redis", l: "runs on" },
        { a: "sw", b: "redis", bend: 0.8 },
        { a: "redis", b: "hash", l: "holds", bend: 0.8 },
        { a: "redis", b: "zset", l: "or holds", bend: 0.8 }
      ],
      add: ["clock", "tests"],
      say: "The clock is drawn as an external box on purpose, because that is what it is: a value produced outside the atomic region and trusted inside it. Redis can supply the time itself, which makes one clock for every caller and removes the skew entirely. And the return value is where a library either helps or does not: this one answers yes or no, so a caller cannot say how long to wait, cannot tell a rate limit apart from a Redis outage, and cannot choose to fail open. The script already knows all three. The tests are on the diagram because they solved the hardest part of testing this well: a time based algorithm is only testable if you can move time, and miniredis lets you." }
  ],

  boxesIntro: "Nine components for under five hundred lines, which tells you where the density is. The two Lua scripts are the design; everything else exists to get arguments to them and an answer back.",

  boxes: [
    { id: "caller", n: "The caller", r: "client",
      job: "Asks whether a key may proceed, and does something sensible with the answer.",
      why: "It is drawn because a library's boundary is a design decision, and this one gives the caller less than it could. What crosses this line is the whole subject of the last stage.",
      forced: "Stage 0, and its shape became a question in stage 5.",
      alts: [["Shipping HTTP middleware in the library", "convenient and it forces a web framework on everybody who wants a rate limiter. Keeping the core framework free and offering middleware as a separate package is the better split."]],
      pros: ["The library knows nothing about HTTP, so it works for queue consumers, gRPC handlers and background jobs equally.", "One call, one boolean, nothing to learn."],
      cons: ["A boolean cannot express how long to wait, so the caller cannot send a Retry-After header and clients retry blindly.", "It cannot tell a rate limit apart from a Redis failure, so the caller cannot choose to fail open even if it wants to.", "The key is a bare string, so two features in one program can collide on a key without either noticing."],
      cost: "One function call and one Redis round trip per guarded request.",
      fails: "A caller wraps every HTTP handler in this and Redis becomes unreachable. Every request is denied, and the service is down because of the thing that was meant to protect it. The caller never got the chance to decide otherwise.",
      say: "A rate limiter should hand back a decision, not a bit: allowed, how many remain, how long until the next one, and whether the backend answered at all. All three are already known inside the script and thrown away at the boundary." },

    { id: "api", n: "RateLimiter", r: "svc",
      job: "Hold the parameters, put the arguments in the right order, evaluate the script, and turn the reply into an answer.",
      why: "It is the facade. The caller should never assemble Lua arguments by hand, and the script should never know what a Go type is.",
      forced: "Stage 0, and it acquired a second algorithm in stage 4.",
      alts: [["Two separate types, TokenBucket and SlidingWindow", "the better shape, and the reason is in the disadvantages below. One type with two constructors means half its fields are meaningless at any given moment."], ["An interface with two implementations", "the same as two types plus the ability to swap them at runtime, which the load balancer that uses this library actually wants, since it picks the algorithm from configuration."], ["Free functions taking a config struct", "no state to hold at all, and it means passing the parameters on every call, which is more error prone than holding them."]],
      pros: ["The two algorithms are interchangeable at the call site, which is exactly what a caller choosing by configuration needs.", "Parameters are captured once at construction, so a call site cannot drift from a different one.", "The Redis client is passed in rather than owned, so the library never manages a connection it did not create."],
      cons: ["One struct carries four fields and each constructor fills two of them, so calling the sliding window method on a token bucket instance compiles, runs, and denies everything, because the window and the limit are both zero.", "Errors are printed to standard output and converted to a false. A library should never write to the caller's output, and it should never decide the caller's failure policy.", "The two methods have different signatures, one taking a requested count and one not, so they are not actually interchangeable through an interface without change."],
      cost: "One small struct. The work is entirely in the round trip.",
      fails: "Somebody builds a token bucket, later switches a config flag, and calls the sliding window path on it. Window zero and limit zero means the count is never below the limit, so every request is denied, silently, with no error anywhere. Two types make that unrepresentable at compile time.",
      say: "Two types rather than one struct with two disjoint halves, a shared interface over them, and a return value that carries an error. Those three changes are maybe forty lines and they are the difference between working code and a library." },

    { id: "tb", n: "Token bucket script", r: "impl",
      job: "Refill the bucket for the time that has passed, spend the requested tokens if there are enough, and store the result.",
      why: "It is the algorithm for a limit that should tolerate bursts. Tokens accrue whether you use them or not, so a quiet client banks capacity and can spend it quickly later, which is how real clients behave.",
      forced: "Stage 2 for the script, stage 3 for the lazy refill.",
      alts: [["A background job topping up every bucket on a tick", "the intuitive reading of the algorithm, and it does work proportional to the number of clients rather than the number of requests, almost all of it wasted."], ["Leaky bucket", "smooths output rather than input, so it queues rather than rejects. A different product decision, and it needs somewhere to queue."], ["Storing tokens as an integer count of thousandths", "worth doing. Tokens are stored as a float in a hash field, so repeated tiny refills accumulate floating point error over a long lived key. Integers would remove that entirely, and the argument is the same one as never storing money in a float."]],
      pros: ["Constant memory per key, two fields, no matter the traffic.", "Refill is arithmetic on a stored timestamp, so nothing runs in the background and nothing has to be scheduled.", "The TTL falls out of the parameters, so idle keys expire exactly when their state becomes meaningless.", "A missing key reads as a full bucket, so a first request and an expired one take the same path with no special case."],
      cons: ["It permits a burst by design, so it cannot express a hard cap.", "The token count is a float in a string field, which is precision you do not need and cannot audit.", "Requesting more tokens than the burst size can never succeed, and the caller is told no with no hint that the request was impossible rather than merely early."],
      cost: "One hash read, a little arithmetic, one hash write and an expiry. Microseconds inside Redis.",
      fails: "A caller sets burst to 5 and asks for 10 tokens. The answer is no, forever, and looks identical to being rate limited. Validate at construction, or return a distinguishable reason.",
      say: "Lazy refill is the trick worth remembering: never schedule work to update state that nobody is looking at. Compute it from a timestamp at the moment somebody asks." },

    { id: "sw", n: "Sliding window script", r: "impl",
      job: "Drop everything older than the window, count what remains, and admit the request only if that count is under the limit.",
      why: "It is the algorithm for a hard cap. Unlike a fixed window it has no boundary to burst across, because the window moves with the request rather than with the clock.",
      forced: "Stage 4.",
      alts: [["Fixed window counters", "one integer and an expiry, and it allows twice the limit across a boundary: the full quota at the end of one window and again at the start of the next."], ["Sliding window log with approximation", "keep the previous window's count and weight it by how far into the current one you are. Constant memory, small error, and the usual production choice at scale. Worth naming as where this goes if the memory hurts."], ["A bucket with burst set to the limit", "close in effect and not the same guarantee, because a bucket refills continuously and a window does not."]],
      pros: ["Exact. At most N requests in any trailing window, with no boundary effect and no approximation.", "Eviction is a range delete by score, which Redis does in one command.", "The whole state is inspectable: you can list the actual request times, which is useful when somebody disputes a limit."],
      cons: ["Memory is proportional to the limit, one member per request in the window, so a high limit is an expensive key.", "The busiest clients cost the most memory, which is precisely backwards from what you want when defending against them.", "Every member carries a UUID, so the storage is dominated by identifiers rather than by data."],
      cost: "About 80 bytes per request in the window. At a limit of 100 that is 8 KB per key, against 100 bytes for a bucket.",
      fails: "Without the UUID in the member, two requests arriving in the same nanosecond write the same member, the sorted set keeps one, and the count is short by one. Under real concurrency that is a limiter that admits more than it should, occasionally, in a way no test would catch. The UUID is what makes each request its own member.",
      say: "A sorted set is a set, so the member has to be unique per request or identical timestamps collapse. That one detail is the difference between an exact limiter and one that leaks under load." },

    { id: "redis", n: "Redis", r: "store",
      job: "Hold the state, and run the script over it without letting anything else interleave.",
      why: "Two properties are needed at once: state several processes can see, and a place where a read and a write can be one operation. Redis with a script is the shortest path to both.",
      forced: "Stage 1 for the sharing, stage 2 for the atomicity.",
      alts: [["A relational database with a transaction", "correct, and it makes every request a transaction against durable storage, which is orders of magnitude more expensive for state that is disposable."], ["An in memory limiter per process", "no network and no shared budget, so N processes give N times the limit."], ["A dedicated rate limiting service", "what you build at very large scale, with local budgets leased from a central authority. Vastly more machinery, and worth naming as the next step."]],
      pros: ["Single threaded command execution, so a script is atomic without any locking anywhere.", "TTLs are native, so expiry needs no sweeper and no bookkeeping.", "Sub millisecond, which is the only reason it is acceptable in front of every request."],
      cons: ["A network dependency on the hot path of everything the limiter guards.", "A long script blocks every other client, because the thing that makes it atomic is that nothing else runs. These two are short; a script that iterated over a large key set would be a production incident.", "State is not durable, so a failover resets every bucket."],
      cost: "One round trip and one script evaluation per decision.",
      fails: "Redis fails over and every bucket is lost. Every client is granted a full bucket at once, which is a brief window of roughly double the intended rate. That is an acceptable failure for a limiter and worth saying out loud, because it is the argument for not paying for synchronous replication here.",
      say: "The reason a script is atomic is that Redis is single threaded, which is also the reason a script must stay short. Both halves of that sentence matter." },

    { id: "hash", n: "The bucket state", r: "value",
      job: "Two fields: how many tokens were left, and when that was true.",
      why: "It is the smallest state that supports lazy refill. From those two numbers and the current time, the correct token count is a subtraction and a multiplication.",
      forced: "Stage 2.",
      alts: [["Storing a token count alone, with a background refiller", "one field instead of two, and it needs a process to keep it honest."], ["A stream or list of grants", "auditable and it is the sliding window's memory profile with none of its exactness."]],
      pros: ["Constant size regardless of traffic.", "A hash of two small fields is compactly encoded by Redis, so it really is about a hundred bytes.", "An absent key means a full bucket, which makes first use and expiry the same code path."],
      cons: ["The token count is stored as a float rendered into a string, so it is neither exact nor cheap to parse.", "The timestamp is whatever the caller's clock said, so the state carries somebody else's idea of when now was."],
      cost: "About 100 bytes per active key, expiring by itself.",
      fails: "Two callers with clocks a few seconds apart write timestamps out of order. The refill computation clamps elapsed time at zero, so the bucket simply does not refill for a while, and the client is limited harder than configured with nothing in any log to explain it.",
      say: "Storing thousandths of a token as an integer would make this exact, and it is the same reasoning as never storing money in a float. The float here is smaller in consequence and identical in kind." },

    { id: "zset", n: "The window state", r: "value",
      job: "One member per request that is still inside the window, scored by its timestamp.",
      why: "Exactness needs the individual events. A count cannot tell you which requests are about to fall out of the window; a set of timestamps can.",
      forced: "Stage 4.",
      alts: [["A count plus the oldest timestamp", "constant memory and it cannot know when the second oldest expires, so it can only approximate."], ["Two counters, the current and the previous window, weighted", "the standard approximation. Constant memory, error of a few percent, and what most large systems actually run."]],
      pros: ["Range delete by score evicts the expired entries in one command.", "The count is a single O(1) command once the eviction has happened.", "It is inspectable, so the exact request times behind a decision can be read out."],
      cons: ["Memory grows with the limit and the traffic, so the heaviest users are the most expensive to track.", "The member is dominated by a UUID, so most of the stored bytes are there to guarantee uniqueness rather than to carry information."],
      cost: "Roughly 80 bytes per in window request. 8 KB per key at a limit of 100.",
      fails: "A key is created with an enormous limit and a long window, and the sorted set grows into the megabytes. The eviction command then has real work to do inside an atomic script, which blocks every other Redis client while it runs. Cap the limit, or switch to the weighted approximation above some size.",
      say: "A shorter unique member, a counter rather than a UUID, would cut this key's memory by half and keep the exactness. The UUID is the easy correct answer, not the cheap one." },

    { id: "clock", n: "The clock", r: "ext",
      job: "Say what time it is now, for both algorithms.",
      why: "It is drawn as an external, untrusted box because that is exactly what it is. The value is produced outside the atomic region, by whichever process happened to handle the request, and then trusted completely inside it.",
      forced: "Stage 5, and it is the design's most interesting weakness.",
      alts: [["Redis TIME, called inside the script", "one clock for every caller, so skew disappears entirely. It was historically awkward because a non deterministic command made a script unsafe to replicate verbatim, and modern Redis replicates a script's effects rather than its source, which removes the objection."], ["Requiring NTP on every caller", "not a design, a hope. Skew of tens of milliseconds is normal and occasionally it is seconds."]],
      pros: ["Passing the time in keeps the script deterministic, which is the older and more conservative choice.", "It makes the algorithm trivially testable, because a test can pass any time it likes."],
      cons: ["Several callers means several clocks and no agreement between them.", "A caller with a fast clock writes a future timestamp into the bucket, and every caller with a correct clock then computes zero elapsed time and applies no refill until the real clock catches up.", "For the sliding window a skewed now shifts the whole window, so a client can be limited by requests that, according to that process, have not happened yet."],
      cost: "Nothing, and it is the difference between correct and approximately correct across a fleet.",
      fails: "One instance in an autoscaling group comes up with a clock two seconds ahead. Its writes poison the buckets of every client it serves for the next two seconds of their timeline, and the symptom is clients being limited harder than configured, intermittently, on some instances only. This is a genuinely miserable bug to find from the outside.",
      say: "Take the time from Redis inside the script. One clock, no skew, and the determinism objection stopped applying several major versions ago." },

    { id: "tests", n: "The tests", r: "work",
      job: "Run both algorithms against an in process Redis, and move time forwards on demand.",
      why: "A time based algorithm cannot be tested honestly without control of the clock. Waiting a real second in a test is slow and flaky; fast forwarding a fake one is neither.",
      forced: "Stage 5, and it is the part of this repository that most deserves copying.",
      alts: [["Testing against a real Redis in a container", "higher fidelity, including the real Lua interpreter, and it needs infrastructure to run the test suite. A good candidate for a second, slower suite rather than the only one."], ["Mocking the Redis client", "fast and it tests nothing, since the entire algorithm lives in the script that the mock would be standing in for."], ["Sleeping in the test", "the version everybody writes first: slow, flaky, and it gets deleted after it fails on a loaded build machine."]],
      pros: ["No infrastructure, so the suite runs anywhere in a second.", "Fast forwarding time makes refill and expiry ordinary assertions rather than acts of patience.", "The tests exercise the real Lua rather than a Go reimplementation of it, so the thing under test is the thing that ships."],
      cons: ["The in process Redis uses a different Lua implementation from the real one, so a script can pass here and behave differently in production. Rare, and worth knowing.", "It does not exercise the concurrency the scripts exist to handle, because a single test goroutine never races itself."],
      cost: "One dependency, test only.",
      fails: "A script relies on a Redis or Lua behaviour the in process version implements slightly differently, and the difference is discovered in production. Run the same suite against a real Redis in continuous integration as well, which is a configuration change rather than new tests.",
      say: "Controlling time is what makes a time based algorithm testable. If the only way to test a refill is to wait for it, the design has a seam missing." }
  ],

  patternsIntro: "A library this small has room for about three decisions. Two of them are patterns worth naming, one is a pattern that was correctly refused, and two more are shapes this code should probably have and does not.",

  patterns: [
    { n: "The algorithm as data, executed at the store", used: true,
      what: "The whole decision is a constant string of Lua, sent to Redis and run there.",
      varies: "Nothing about it varies. It exists so that a read, a decision and a write become one operation with nothing able to interleave.",
      without: "Read from Go, decide in Go, write from Go. Two round trips, and a window between them in which another process does the same thing and reaches the same wrong conclusion.",
      cost: "The logic now lives in a second language, with no type checking, no test coverage tooling and no debugger. That is a real price and it buys the only property that matters here." },
    { n: "Strategy, two algorithms behind one type", used: true,
      what: "Token bucket and sliding window, chosen by which constructor you call, with the same call shape after that.",
      varies: "The limiting algorithm. The caller picks by configuration, which is exactly how the load balancer that imports this uses it.",
      without: "The caller reaches for one algorithm's implementation directly and cannot change its mind without changing code.",
      cost: "Here it was implemented as one struct holding both parameter sets, so half the fields are meaningless at any moment and a mismatched call silently denies everything. The pattern is right; this shape of it is the design's weakest point." },
    { n: "A background refiller for the bucket", used: false,
      what: "A ticker that adds tokens to every bucket on a schedule, which is how the algorithm is usually described.",
      varies: "Nothing, and it would be a process whose work grows with the number of clients rather than the number of requests.",
      without: "Compute the refill from a stored timestamp at the moment somebody asks. The bucket is correct whenever it is observed and untouched otherwise.",
      cost: "None. Refusing this is the best decision in the codebase, and the general lesson travels: do not schedule work to maintain state nobody is currently looking at." },
    { n: "Separate types per algorithm", used: false,
      what: "A TokenBucket type and a SlidingWindow type, each holding only its own parameters, behind a shared interface.",
      varies: "Nothing new. It removes a whole class of error rather than enabling anything.",
      without: "One struct with four fields where two are always zero, so calling the wrong method compiles and returns a plausible, wrong answer forever.",
      cost: "One extra type and an interface, maybe forty lines. This is the change I would make first, and it is listed as rejected only because the code has not made it yet." },
    { n: "A result type instead of a boolean", used: false,
      what: "Return allowed, remaining, retry after and an error, rather than one bit.",
      varies: "What the caller wants to do. Send a Retry-After header, log the near misses, fail open when the backend is unreachable.",
      without: "The caller cannot distinguish denied from broken, and cannot tell a client when to come back. The script computed both and the boundary threw them away.",
      cost: "A struct and an error in the signature, which is a breaking change to a published API. Worth a major version, and the second change I would make." }
  ],

  flowsIntro: "Two decisions, one per algorithm. Both are a single round trip, and everything interesting happens inside Redis in the middle step.",

  flows: [
    { n: "A token bucket decision",
      note: "Everything between the first and last step happens inside one atomic script.",
      steps: [
        ["The caller asks whether a key may spend some tokens. The library reads the current time from the local clock and evaluates the script with the key, the rate, the burst, that time and the amount requested.", "sync"],
        ["Inside Redis: read the stored token count and timestamp. A missing key reads as a full bucket, so first use needs no special case.", "sync"],
        ["Compute elapsed time since the stored timestamp, clamped at zero, add rate times elapsed to the tokens, and cap the result at the burst size.", "sync"],
        ["If there are fewer tokens than requested, return zero and write nothing. A denial leaves no trace, which is why a denied client cannot exhaust anything.", "sync"],
        ["Otherwise subtract, write both fields back, and set the expiry to the time a full refill would take. Return one.", "sync"],
        ["Back in Go the reply becomes true or false, and everything else the script knew is discarded.", "sync"]
      ] },
    { n: "A sliding window decision",
      steps: [
        ["The library builds a member for this request: the current time in nanoseconds joined to a fresh UUID, because a sorted set member has to be unique or two requests at the same instant become one.", "sync"],
        ["Inside Redis: remove every member scored older than now minus the window. This is the sliding part, and it happens on read rather than on a timer.", "sync"],
        ["Count what is left, which is now exactly the number of requests inside the trailing window.", "sync"],
        ["If the count is below the limit, add this request's member and refresh the key's expiry to the window length. Return one.", "sync"],
        ["Otherwise return zero without adding, so a rejected request does not extend the window it was rejected by. That detail matters: recording denials would let a client keep itself limited forever.", "sync"]
      ] },
    { n: "When Redis does not answer",
      note: "The path worth arguing about, and the one the library currently decides for you.",
      steps: [
        ["The evaluation returns an error, from a timeout, a failover or an unreachable host.", "sync"],
        ["The library prints the error to standard output. A library writing to its caller's output is a small thing that becomes irritating at scale and impossible to route.", "sync"],
        ["It returns false, which the caller reads as rate limited. The service now denies every request because the component protecting it is unavailable.", "sync"],
        ["What should happen: return the error alongside the decision and let the caller choose. For a rate limiter the answer is almost always fail open with an alert, because a guard rail that closes the road when it breaks is worse than no guard rail.", "sync"]
      ] }
  ],

  api: [
    ["NewTokenBucket(rate, burst)", "*RateLimiter", "Rate in tokens per second, burst as the ceiling and the starting count. Both parameters are captured once, so no call site can disagree with another."],
    ["NewSlidingWindow(window, max)", "*RateLimiter", "Same type, the other two fields. That the two constructors fill disjoint halves of one struct is the API's main flaw."],
    ["TokenBucket(redis, key, requested)", "bool", "One round trip. The requested count is the only reason the two methods have different signatures, which is what stops them sharing an interface."],
    ["SlidingWindow(redis, key)", "bool", "No requested count, because a window counts requests rather than weight. Symmetry would be worth more than the saved parameter."],
    ["what it should return", "(Decision, error)", "Allowed, remaining, retry after and an error. All of it is known inside the script and none of it survives the boundary."]
  ],
  apiNote: "The Redis client is a parameter rather than a field, which is a good instinct: the library never owns a connection it did not create. It does mean every call site has to carry it, and holding it on the struct would be both simpler and just as polite.",

  schema: { n: "The token bucket, with the two lines that matter marked", lang: "text",
    note: "Twenty lines of Lua containing the whole idea. Read it as one atomic block, because that is exactly how Redis will run it.",
    code:
"local bucket = redis.call('HMGET', key, 'tokens', 'timestamp')\n" +
"local tokens         = tonumber(bucket[1]) or burst   -- absent key reads\n" +
"local last_refreshed = tonumber(bucket[2]) or now     -- as a FULL bucket\n" +
"\n" +
"-- lazy refill. nothing runs in the background, ever. the bucket is\n" +
"-- correct at the moment it is observed and untouched otherwise.\n" +
"local delta = math.max(0, now - last_refreshed)   -- clamped, so a clock\n" +
"tokens = math.min(burst, tokens + delta * rate)   -- that went backwards\n" +
"                                                  -- stalls, not rewinds\n" +
"if tokens < requested then\n" +
"    return 0                    -- a denial writes NOTHING, so a blocked\n" +
"else                            -- client cannot keep itself blocked\n" +
"    tokens = tokens - requested\n" +
"    redis.call('HMSET', key, 'tokens', tokens, 'timestamp', now)\n" +
"    redis.call('EXPIRE', key, math.ceil(burst / rate))\n" +
"    return 1                    -- TTL = the time an empty bucket takes to\n" +
"end                             -- refill. after that the stored state is\n" +
"                                -- identical to a fresh key, so expiring\n" +
"                                -- it loses nothing and idle keys are free\n" +
"\n" +
"-- and the one line in the sliding window that is easy to get wrong:\n" +
"--   member = tostring(now) .. ':' .. uuid\n" +
"-- a sorted set is a SET. two requests on the same nanosecond with the\n" +
"-- same member collapse into one entry and the count comes up short." },

  deep: [
    { n: "Why Lua, and what a Redis transaction cannot do",
      note: "The requirement is that a read, a decision based on what was read, and a write happen with nothing in between. Redis offers three ways to approach that and only one of them works here.<br><br><b>MULTI and EXEC</b> queue commands and run them together, and that is genuinely atomic. What it cannot do is branch: the commands are decided before any of them has run, so you cannot say <i>read the token count and then subtract only if it is large enough</i>. The decision has to be made outside, before the read has happened.<br><br><b>WATCH</b> adds optimistic concurrency: watch the key, read it, decide, and the transaction aborts if anything else touched the key meanwhile. It is correct, and under contention it is a retry loop, and rate limiting is contended by definition, because the clients you most want to limit are the ones hitting the same key hardest.<br><br><b>EVAL</b> sends the whole algorithm to the server. Redis executes commands one at a time, so a script runs to completion with nothing interleaved, and it can read, branch and write freely. One round trip, no retries, no lock. The cost is that your logic now lives in a language with no types and no test tooling, inside a database, where a long running script blocks every other client. Both scripts here are a handful of commands, which is what makes that price acceptable." },

    { n: "Lazy refill, and a TTL that derives itself",
      note: "The textbook description of a token bucket has tokens being added on a schedule, and that description quietly implies a process doing the adding. For a million clients that is a million buckets being topped up continuously, almost all of them for clients who are not making requests.<br><br>The observation that removes it entirely: the token count only has to be right at the instant somebody asks. So store the count and the time it was true, and when a request arrives, compute how much time has passed and add that much. The bucket is always correct when observed and nothing touches it in between. No ticker, no scheduler, no work proportional to the number of clients.<br><br>The same reasoning produces the expiry for free, and this is the detail worth stealing. An empty bucket becomes full again after <code>burst / rate</code> seconds. After that long, the stored state and a completely absent key would produce identical answers, because an absent key is read as a full bucket. So the key can be expired at exactly that age and nothing is lost. The TTL is not a guess or a tuning parameter, it is derived from the algorithm's own constants, and it is why idle clients cost nothing and no cleanup job exists." },

    { n: "The UUID in the sorted set member",
      note: "The sliding window stores one entry per request, scored by timestamp, in a Redis sorted set. The obvious member to use is the timestamp itself. That is wrong, and the way it is wrong is unpleasant: a sorted set is a <i>set</i>, so adding a member that already exists updates its score instead of adding a second entry.<br><br>Two requests that land on the same nanosecond therefore become one entry. The count comes up one short, and the limiter admits one more request than it should. It happens only under genuine concurrency, it is invisible in any single threaded test, and it gets worse as load increases, which is precisely when the limiter matters.<br><br>Making each member unique fixes it, and this code appends a UUID to the timestamp. It works and it is honest about what it costs: most of the bytes in that key are now identifier rather than data, so a limit of a hundred requests holds a hundred UUIDs. A per key counter from Redis would be shorter and equally unique, and would halve the memory of the most expensive structure in the library.<br><br>The general lesson is worth more than the fix: whenever you store events in a set, ask what happens when two events are identical, because in a set they stop being two." },

    { n: "What crosses the boundary, and the failure the caller cannot choose",
      note: "Inside the script, four facts are known: whether the request is allowed, how many tokens or slots remain, how long until the next one becomes available, and whether Redis answered at all. One bit crosses the boundary.<br><br>Each discarded fact costs the caller something concrete. Without <b>remaining</b>, nobody can be warned that they are close to the limit. Without <b>retry after</b>, a 429 cannot carry the header that tells a client when to come back, so clients retry blindly and make the situation worse. Without the <b>error</b>, a rate limit and a Redis outage are the same value, so the caller cannot log them differently and cannot treat them differently.<br><br>That last one is the serious one. Returning false on a Redis error means the library fails closed, and it makes that choice on behalf of every program that imports it. For a rate limiter the conventional answer is the opposite: fail open, loudly, because a component whose job is to protect a service should never be the reason that service is unavailable. Reasonable people choose differently for a payment endpoint, which is exactly why the choice belongs to the caller.<br><br>The fix is a struct and an error in the signature. It is a breaking change and it is worth a major version, and every one of those four facts is already sitting in a variable inside the script." }
  ],

  tradeoffsIntro: "Four decisions. The first is the caller's, the second is the library's and is right, and the last two are the library's and are worth changing.",

  tradeoffs: [
    { a: ["Token bucket", "Constant memory per key. Tolerates bursts by design, which matches how real clients behave."],
      b: ["Sliding window", "Exact, with no boundary effect. Memory grows with the limit, so heavy users are the expensive ones."],
      pick: "a",
      flip: "the requirement is a hard cap that must never be exceeded, for example a contractual quota or a third party API you are reselling. Then exactness is the product and the memory is the price." },
    { a: ["The algorithm as a Lua script", "One round trip, genuinely atomic, no retries and no locks anywhere."],
      b: ["WATCH with optimistic retry from the caller", "All the logic stays in Go, with types and tests, and it becomes a retry loop under exactly the contention rate limiting is for."],
      pick: "a",
      flip: "the script would be long or would iterate over a large key space, at which point it blocks every other Redis client while it runs. Short scripts only, and both of these are short." },
    { a: ["Take the time from Redis inside the script", "One clock for every caller. Skew disappears and cannot come back."],
      b: ["Pass the caller's time in as an argument", "The script stays deterministic, and tests can supply any time they like. Several callers means several clocks that disagree."],
      pick: "a",
      flip: "you need the script to be deterministic for verbatim replication, which modern Redis no longer requires because it replicates effects rather than source. Keep an injectable clock for tests, and use the server's in production." },
    { a: ["Return a decision and an error", "The caller can send Retry-After, can log a near miss, and can decide its own failure policy."],
      b: ["Return a boolean", "The smallest possible API and nothing to learn. Denied and broken become the same value."],
      pick: "a",
      flip: "never, for a library. A program that only ever wants the bit can ignore the rest; a program that needs the rest cannot recover it. The boolean is fine for a private helper and not for something other people import." }
  ],

  next: [
    "<b>Two types and a shared interface.</b> The single highest value change: it makes calling the wrong method on the wrong configuration a compile error instead of a silent permanent denial.",
    "<b>A result type with an error.</b> Retry after, remaining, and the ability for the caller to fail open. All of it already exists inside the script.",
    "<b>Take the time from Redis.</b> One clock removes a whole class of intermittent, instance specific bug that is close to impossible to diagnose from the outside.",
    "<b>Send the script by hash.</b> Loading it once and evaluating by SHA saves about six hundred bytes on every request the service ever serves, and the Redis client already has a helper that falls back to sending the source when the server has forgotten it.",
    "<b>See it in use.</b> The <a href='?p=loadbalancer-lld'>L7 load balancer</a> imports this library and sits it in front of every proxied request, which is where the fail closed behaviour above stops being theoretical."
  ],

  p: [
    ["GO", "https://pkg.go.dev/github.com/go-redis/redis/v8#Script", "go-redis Script, EvalSha with a fallback to Eval", "M"],
    ["GFG", "https://www.geeksforgeeks.org/system-design/rate-limiting-system-design/", "Rate limiting, the algorithms and the trade-offs", "M"],
    ["HI", "https://www.hellointerview.com/learn/system-design/problem-breakdowns/rate-limiter", "Hello Interview, design a rate limiter", "H"],
    ["GH", "https://github.com/alicebob/miniredis", "miniredis, an in process Redis with a clock you can move", "E"],
    ["BB", "https://blog.bytebytego.com/p/ep141-a-cheatsheet-on-system-design", "ByteByteGo, the HLD cheatsheet", "E"]
  ],

  hi: {
    one: "Rate limiting matlab ek read, ek decision aur ek write, us state par jo kai processes share karte hain. Yeh teeno kaam apne process se karoge to race hoga; poori library ka wajood is liye hai ki yeh teeno Redis ke andar chale jaayein, jahan yeh ek hi operation ban jaate hain.",

    brief: {
      why: "Yeh page ka sabse chhota project hai, paanch sau lines se bhi kam, aur code ke muqable decision ka ratio sabse zyada isi mein hai. Algorithms khud mostly hain hi nahi, har ek bees line ka Lua hai. Asal interesting cheezein yeh hain: logic caller mein chalne ke bajaye database par kyun chalta hai, bucket refill hota hai jabki koi use refill karta hi nahi, sliding window script ki ek line UUID ke bina chupke se undercount kyun karegi, aur ek library apne import karne wale program ka kya karz rakhti hai. Yeh notice karne ki achhi jagah bhi hai ki library ke users uske andar nahi dekh sakte, isliye jo bhi decision woh unki taraf se chupke se leti hai, woh unke haath se nikal jaata hai.",
      functional: [
        "<b>Decide karo</b> ki ek given key abhi request kar sakti hai ya nahi, ek hi call mein.",
        "<b>Token bucket</b>: tokens ek fixed rate se jama hote hain, burst ceiling tak, aur request unhe kharch karti hai. Chhote bursts allowed, long term average enforce hota hai.",
        "<b>Sliding window</b>: kisi bhi trailing window of time mein zyada se zyada N requests, aur boundary par koi spike nahi.",
        "<b>Processes ke across kaam karo.</b> Caller ki das copies ko ek hi budget share karna hai, das budgets nahi milne chahiye.",
        "<b>Idle hone par kuch cost nahi.</b> Jis key ko kisi ne use nahi kiya, use khud hi exist karna band kar dena chahiye, bina kisi sweeper ke."
      ],
      out: ["HTTP middleware", "per route ya per plan configuration", "distributed quota borrowing", "leaky bucket aur fixed window", "metrics aur observability"],
      nfr: [
        ["Atomicity", "check and decrement are one operation", "Yahi asli requirement hai. Baaki poora design isi se nikalta hai, aur isi wajah se algorithms Go mein nahi, Redis mein rehte hain."],
        ["Correct across processes", "N callers, one budget", "Jo limiter sirf ek process mein correct hai woh limiter nahi, ek suggestion hai. Isi liye state remote rakhi gayi hai."],
        ["Latency", "one round trip per decision", "Limiter har guarded request se pehle chalta hai, to uska cost sab par add hota hai. Ek round trip floor hai aur design ko usse zyada nahi karna chahiye."],
        ["Behaviour when Redis is down", "a decision, not an accident", "Fail open karo to limit gayab. Fail closed karo to Redis poori service gira deta hai. Dono defensible hain; magar caller ke liye chupke se ek choose kar lena defensible nahi."],
        ["Idle cost", "zero", "Har key par ek TTL hai jo uske apne parameters se nikalta hai, isliye inactive clients khud expire ho jaate hain aur koi cleanup job chalane ki zaroorat nahi."]
      ],
      numbers: [
        ["Token bucket state", "two fields, about 100 bytes", "Ek hash jisme tokens aur ek timestamp hai. Har key ke liye constant, chahe us key ka traffic kitna bhi ho, aur yahi bucket ka sabse bada fayda hai."],
        ["Sliding window state", "one member per request in the window", "Sorted set ki ek entry nanosecond timestamp plus ek UUID hoti hai, to lagbhag 80 bytes har ek. 100 requests ke limit par yeh lagbhag 8 KB per key hai."],
        ["The memory ratio", "about 80 to 1", "Per key, per algorithm. Ek million active clients par yeh 100 MB versus 8 GB hai, yaani ek Redis instance aur ek Redis budget conversation ka farq."],
        ["Token bucket TTL", "ceil(burst / rate) seconds", "Bilkul utna time jitna ek khaali bucket ko poora refill hone mein lagta hai. Uske baad stored state ek fresh key se alag nahi dikhta, isliye expire karne se kuch nahi khota. Yeh derivation codebase ki sabse sundar line hai."],
        ["Sliding window TTL", "the window length", "Ek window tak koi request na aaye to har entry waise bhi evict ho chuki hoti. Wahi logic, alag unit."],
        ["Round trips per decision", "one", "Script ka poora point yahi hai. Go se read aur phir write karna do round trips aur unke beech ek race hota."],
        ["Script bytes on the wire", "about 600, every single call", "Kyunki script hash se nahi, value se bheji jaati hai. Uski jagah 40 byte ka SHA bhejna ek line ka change hai aur woh service ki har request par lagta hai."]
      ],
      numbersNote: "Do rows design ko carry karti hain. <b>80 to 1</b> algorithms mein se choose karne ki asli wajah hai, aur yeh correctness nahi, memory ka argument hai. <b>ceil(burst / rate)</b> woh TTL hai jo parameters se hi derive hota hai, aur isi wajah se idle keys bina sweeper ke free ho jaati hain."
    },

    stagesIntro: "Chhe stages. Pehle do aise galat hain jinhe feel karna zaroori hai, teesra woh idea hai jiske liye library bani hai, agle do do algorithms hain aur har ek ki ek subtle line, aur aakhri stage us code ka farq hai jo bas chalta hai aur us library ka jis par koi aur rely kar sake.",

    stages: [
      { pressure: "Abhi kuch nahi. Yeh woh hai jo sab sabse pehle likhte hain aur yeh do tarah se galat hai, jo chaar lines ke code ke liye achha ratio hai.",
        say: "Key se count ka ek map, har request par increment, aur timer par reset. Test mein chalta hai aur do tarah se galat hai. Yeh per process galat hai, to service ki do copies har client ko double limit de deti hain. Aur increment kai goroutines se ek read aur ek write hai, to locally bhi correct hone ke liye mutex chahiye.",
        breaks: "Dono problems ki shape ek hi hai: aisi state jo kai cheezein share karti hain, aur jo read ke baad write se badalti hai. Mutex ek process ke andar fix kar deta hai aur do processes ke across kuch nahi karta." },

      { pressure: "Kai processes, ek budget. State ko process se bahar jaana hoga, aur obvious jagah Redis hai, ek increment aur ek expiry ke saath.",
        say: "Har client, har window ke liye ek key, increment hoti hai aur TTL milta hai. Ab har process ek hi number share karta hai, jo problem ka important aadha hissa fix karta hai, aur INCR khud atomic hai to counter kho nahi sakta. Yeh ek fixed window counter hai aur ise ship karna bilkul reasonable hai.",
        breaks: "Do cheezein. Fixed window apni boundary ke across double burst allow karta hai: 59.9 seconds par poora limit aur 60.1 par phir poora limit. Aur jaise hi rule ko increment se zyada kuch chahiye, jaise refill, stored timestamp se comparison, window ke andar abhi kitna bacha hai, woh read, decide, write ban jaata hai. Go se teen steps, har do ke beech gap, aur do processes dono ek hi value padh kar dono yes bol sakte hain." },

      { pressure: "Read, decide, write ko ek indivisible step hona hai. Bahar se, network par, kai processes ek saath, yeh ho hi nahi sakta.",
        say: "Poora algorithm ek Lua script mein chala jaata hai jo Redis tumhari taraf se chalata hai. Redis script ko ek unit ki tarah execute karta hai, to read, arithmetic, comparison aur write kisi aur ke saath interleave nahi ho sakte. Race ko unlikely nahi banaya gaya, impossible banaya gaya hai, aur kahin koi lock nahi hai. Caller ko iska cost dekho: kuch nahi. Ek round trip, increment jaisa hi, aur ab logic kitna bhi complicated ho sakta hai.",
        breaks: "Bucket ko waqt ke saath refill hona hai, aur refill karne ke liye kuch chal hi nahi raha. Obvious jawab, ek background job jo har tick par har bucket top up kare, matlab ek process jiska kaam clients ki sankhya ke saath badhta hai, aur zyadatar ke liye kuch useful nahi karta." },

      { pressure: "Refill elapsed time ka function hai, aur token count ki parwah sirf tab hoti hai jab request aati hai. To tab hi compute karo, stored timestamp se, aur background mein kuch bhi mat chalao.",
        say: "Stored token count aur woh time padho jab store hua tha, rate times elapsed add karo, burst par cap karo, aur naye timestamp ke saath wapas likh do. Bucket us pal bilkul utna full hota hai jitna hona chahiye jab koi pooche, aur warna use koi chhoota nahi. Aur TTL choose nahi kiya jaata, parameters se derive hota hai: ek khaali bucket burst over rate seconds mein poora refill ho jaata hai, to itni der baad stored bucket fresh wale se alag nahi dikhta aur use delete karne se kuch nahi khota. Isliye idle client ka cost zero hai aur kisi ko sweep nahi karna padta.",
        breaks: "Bucket design se bursts ko smooth karta hai, jo tab bilkul galat hai jab requirement hard cap ho: sau calls per minute se zyada nahi, kabhi nahi, pehle second mein bhi nahi." },

      { pressure: "Alag requirement ko alag structure chahiye. Fixed window ki counting boundary par double burst allow karti hai, aur bucket jaanbujhkar bursts par permissive hai, to koi bhi strict cap ka jawab nahi hai.",
        say: "Request timestamps ka ek sorted set. Window se purana sab evict karo, jo bacha use count karo, aur agar woh limit se kam hai to yeh request add karo. Teen commands, ek script, atomic. Subtle line member hai: woh timestamp <i>plus ek UUID</i> hai, kyunki sorted set ek set hota hai, aur ek hi nanosecond par aayi do requests agar same member likhein to ek entry mein collapse ho jaati hain aur chupke se undercount ho jaata hai. Exactness ki keemat memory hai jo constant nahi balki limit ke proportional hai, aur yahi dono algorithms ka asli trade-off hai.",
        breaks: "Dono scripts ko current time caller deta hai, caller ki apni clock se. Ek process ho to theek. Das processes ho to das clocks hain, aur woh aapas mein agree nahi karti." },

      { pressure: "Do problems jo dono boundary ke baare mein hain. Time bahar se aata hai aur processes ke beech agree karega, iska koi bharosa nahi, aur jawab bahar ek single bit ban kar jaata hai jo script ki jaani hui har cheez phenk deta hai.",
        say: "Clock ko jaanbujhkar external box ki tarah draw kiya gaya hai, kyunki woh wahi hai: ek value jo atomic region ke bahar bani hai aur andar poori tarah trust ki jaati hai. Redis time khud de sakta hai, jisse har caller ke liye ek hi clock ho aur skew poori tarah hat jaaye. Aur return value wahi jagah hai jahan library help karti hai ya nahi karti: yeh sirf yes ya no deti hai, to caller nahi bata sakta kitna wait karna hai, rate limit aur Redis outage mein farq nahi kar sakta, aur fail open choose nahi kar sakta. Script teeno jaanti hai. Tests diagram par isliye hain kyunki unhone testing ka sabse mushkil hissa achhe se solve kiya: time based algorithm tab hi testable hai jab tum time ko move kar sako, aur miniredis yeh karne deta hai." }
    ],

    boxesIntro: "Paanch sau se kam lines ke liye nau components, jo batata hai ki density kahan hai. Do Lua scripts hi design hain; baaki sab bas unhe arguments pahunchane aur jawab wapas lane ke liye hai.",

    boxes: [
      { job: "Poochta hai ki key aage badh sakti hai ya nahi, aur jawab ke saath kuch sensible karta hai.",
        why: "Yeh isliye draw kiya gaya hai kyunki library ki boundary ek design decision hai, aur yeh wali caller ko jitna de sakti thi usse kam deti hai. Is line ko paar kya jaata hai, yahi aakhri stage ka poora subject hai.",
        forced: "Stage 0, aur uski shape stage 5 mein ek sawaal ban gayi.",
        alts: [["Shipping HTTP middleware in the library", "convenient hai, aur har us insaan par web framework thop deta hai jo bas rate limiter chahta hai. Core ko framework free rakhna aur middleware ko alag package mein dena behtar split hai."]],
        pros: ["Library HTTP ke baare mein kuch nahi jaanti, isliye queue consumers, gRPC handlers aur background jobs ke liye barabar chalti hai.", "Ek call, ek boolean, seekhne ko kuch nahi."],
        cons: ["Boolean yeh express nahi kar sakta ki kitna wait karna hai, isliye caller Retry-After header nahi bhej sakta aur clients andhadhundh retry karte hain.", "Yeh rate limit aur Redis failure mein farq nahi kar sakta, isliye caller chahe bhi to fail open choose nahi kar sakta.", "Key ek bare string hai, to ek program ke do features bina kisi ko pata chale ek key par takra sakte hain."],
        cost: "Har guarded request par ek function call aur ek Redis round trip.",
        fails: "Caller har HTTP handler ko isse wrap karta hai aur Redis unreachable ho jaata hai. Har request deny ho jaati hai, aur service us cheez ki wajah se down hai jo use protect karne ke liye thi. Caller ko kuch aur decide karne ka mauka hi nahi mila.",
        say: "Rate limiter ko ek bit nahi, ek decision wapas dena chahiye: allowed, kitne bache hain, agla kitni der mein, aur backend ne jawab diya ya nahi. Teeno cheezein script ke andar pehle se maloom hain aur boundary par phenk di jaati hain." },

      { job: "Parameters hold karta hai, arguments sahi order mein lagata hai, script evaluate karta hai, aur reply ko ek jawab mein badalta hai.",
        why: "Yeh facade hai. Caller ko kabhi Lua arguments haath se nahi banane chahiye, aur script ko kabhi nahi pata hona chahiye ki Go type kya hota hai.",
        forced: "Stage 0, aur stage 4 mein ise doosra algorithm mil gaya.",
        alts: [["Two separate types, TokenBucket and SlidingWindow", "behtar shape hai, aur iski wajah neeche disadvantages mein hai. Do constructors wala ek type matlab uski aadhi fields kisi bhi waqt meaningless hoti hain."], ["An interface with two implementations", "do types plus runtime par unhe swap karne ki kshamta, jo is library ko use karne wala load balancer asal mein chahta hai, kyunki woh algorithm configuration se choose karta hai."], ["Free functions taking a config struct", "hold karne ko koi state nahi, aur iska matlab har call par parameters pass karna, jo unhe hold karne se zyada error prone hai."]],
        pros: ["Do algorithms call site par interchangeable hain, jo configuration se choose karne wale caller ko chahiye.", "Parameters construction par ek baar capture hote hain, to koi call site kisi doosre se drift nahi kar sakta.", "Redis client pass kiya jaata hai, owned nahi, to library kabhi aisa connection manage nahi karti jo usne banaya hi nahi."],
        cons: ["Ek struct chaar fields carry karta hai aur har constructor unme se do bharta hai, to token bucket instance par sliding window method call karna compile hota hai, chalta hai, aur sab kuch deny karta hai, kyunki window aur limit dono zero hain.", "Errors standard output par print hote hain aur false mein badal diye jaate hain. Library ko kabhi caller ke output mein nahi likhna chahiye, aur kabhi caller ki failure policy decide nahi karni chahiye.", "Dono methods ke signatures alag hain, ek requested count leta hai aur ek nahi, isliye woh bina badlaav ke interface ke through asal mein interchangeable nahi hain."],
        cost: "Ek chhota struct. Kaam poora round trip mein hai.",
        fails: "Koi token bucket banata hai, baad mein config flag badalta hai, aur us par sliding window path call karta hai. Window zero aur limit zero ka matlab count kabhi limit se neeche nahi hota, to har request deny hoti hai, chupke se, kahin koi error nahi. Do types ise compile time par unrepresentable bana dete hain.",
        say: "Do fields ke do alag hisson wale ek struct ke bajaye do types, unke upar ek shared interface, aur ek return value jo error carry kare. Yeh teen changes shayad chalis lines ke hain aur working code aur library ke beech ka farq hain." },

      { job: "Beete hue time ke liye bucket refill karta hai, agar kaafi tokens hain to requested tokens kharch karta hai, aur result store karta hai.",
        why: "Yeh us limit ka algorithm hai jo bursts tolerate kare. Tokens use karo ya na karo, jama hote rehte hain, to ek shaant client capacity bank kar leta hai aur baad mein jaldi kharch kar sakta hai, jo asal clients ka behaviour hai.",
        forced: "Script ke liye stage 2, lazy refill ke liye stage 3.",
        alts: [["A background job topping up every bucket on a tick", "algorithm ka intuitive reading, aur yeh clients ki sankhya ke proportional kaam karta hai requests ki nahi, jisme zyadatar waste hota hai."], ["Leaky bucket", "input nahi, output ko smooth karta hai, to reject nahi queue karta hai. Alag product decision, aur queue karne ke liye jagah chahiye."], ["Storing tokens as an integer count of thousandths", "karne layak hai. Tokens hash field mein float hain, to bar bar chhote refills lambe chalne wali key par floating point error jama karte hain. Integers use karne se yeh poori tarah hat jaata, aur argument wahi hai jo paisa kabhi float mein store na karne ka hai."]],
        pros: ["Har key ke liye constant memory, do fields, traffic chahe jitna ho.", "Refill stored timestamp par arithmetic hai, to background mein kuch nahi chalta aur kuch schedule nahi karna padta.", "TTL parameters se nikal aata hai, isliye idle keys tabhi expire hoti hain jab unki state meaningless ho jaati hai.", "Missing key full bucket ki tarah padhi jaati hai, to pehli request aur expire hui key ek hi path lete hain, koi special case nahi."],
        cons: ["Yeh design se burst permit karta hai, isliye hard cap express nahi kar sakta.", "Token count ek string field mein float hai, jo aisi precision hai jo chahiye nahi aur audit nahi ho sakti.", "Burst size se zyada tokens maangna kabhi succeed nahi hoga, aur caller ko no milta hai bina kisi hint ke ki request impossible thi na ki bas jaldi."],
        cost: "Ek hash read, thoda arithmetic, ek hash write aur ek expiry. Redis ke andar microseconds.",
        fails: "Caller burst 5 set karta hai aur 10 tokens maangta hai. Jawab hamesha ke liye no hai, aur rate limited hone jaisa hi dikhta hai. Construction par validate karo, ya alag pehchaan mein aane wali reason return karo.",
        say: "Lazy refill yaad rakhne layak trick hai: aisi state update karne ke liye kaam schedule mat karo jise koi dekh hi nahi raha. Jab koi pooche tab timestamp se compute karo." },

      { job: "Window se purana sab hata deta hai, jo bacha use count karta hai, aur request tabhi admit karta hai jab woh count limit se kam ho.",
        why: "Yeh hard cap ka algorithm hai. Fixed window ke ulat, isme burst karne ko koi boundary nahi, kyunki window request ke saath chalti hai, clock ke saath nahi.",
        forced: "Stage 4.",
        alts: [["Fixed window counters", "ek integer aur ek expiry, aur boundary ke across limit ka double allow karta hai: ek window ke ant mein poora quota aur agli ki shuruaat mein phir."], ["Sliding window log with approximation", "pichli window ka count rakho aur current window mein kitna aage ho us hisaab se weight karo. Constant memory, chhota error, aur scale par aam production choice. Yeh naam lene layak hai ki memory chubhe to yahan jaana hai."], ["A bucket with burst set to the limit", "effect mein kareeb hai magar wahi guarantee nahi, kyunki bucket continuously refill hota hai aur window nahi."]],
        pros: ["Exact. Kisi bhi trailing window mein zyada se zyada N requests, na boundary effect na approximation.", "Eviction score ke hisaab se range delete hai, jo Redis ek command mein karta hai.", "Poori state inspect ho sakti hai: asal request times list kar sakte ho, jo tab kaam aata hai jab koi limit par dispute kare."],
        cons: ["Memory limit ke proportional hai, window mein har request ke liye ek member, to bada limit ek mehngi key hai.", "Sabse busy clients sabse zyada memory lete hain, jo tab bilkul ulta hai jab unse bachna hai.", "Har member UUID carry karta hai, to storage data se zyada identifiers ka hai."],
        cost: "Window mein har request ke liye lagbhag 80 bytes. 100 ke limit par 8 KB per key, jabki bucket ke 100 bytes.",
        fails: "Member mein UUID na ho to ek hi nanosecond mein aayi do requests same member likhti hain, sorted set ek rakhta hai, aur count ek kam ho jaata hai. Asal concurrency mein yeh aisa limiter hai jo kabhi kabhi zyada admit karta hai, aise tareeke se jo koi test nahi pakdega. UUID har request ko uska apna member banata hai.",
        say: "Sorted set ek set hai, to member har request ke liye unique hona chahiye warna identical timestamps collapse ho jaate hain. Yeh ek detail exact limiter aur load mein leak karne wale limiter ke beech ka farq hai." },

      { job: "State hold karta hai, aur uske upar script bina kisi ko interleave hone diye chalata hai.",
        why: "Do properties ek saath chahiye: aisi state jo kai processes dekh saken, aur aisi jagah jahan read aur write ek operation ho sake. Script ke saath Redis dono ka sabse chhota raasta hai.",
        forced: "Sharing ke liye stage 1, atomicity ke liye stage 2.",
        alts: [["A relational database with a transaction", "correct hai, aur har request ko durable storage par transaction bana deta hai, jo disposable state ke liye orders of magnitude mehnga hai."], ["An in memory limiter per process", "na network na shared budget, to N processes matlab N guna limit."], ["A dedicated rate limiting service", "jo bahut bade scale par banate ho, central authority se lease kiye local budgets ke saath. Kahin zyada machinery, aur agla step ke roop mein naam lene layak."]],
        pros: ["Single threaded command execution, to script bina kahin locking ke atomic hai.", "TTLs native hain, to expiry ko na sweeper chahiye na bookkeeping.", "Sub millisecond, aur yahi ek wajah hai ki har request ke aage yeh acceptable hai."],
        cons: ["Jo bhi limiter guard karta hai us sab ke hot path par network dependency.", "Lamba script har doosre client ko block karta hai, kyunki jo cheez ise atomic banati hai woh yahi hai ki aur kuch chalta nahi. Yeh dono chhote hain; ek script jo bade key set par iterate kare production incident hoga.", "State durable nahi hai, to failover har bucket reset kar deta hai."],
        cost: "Har decision par ek round trip aur ek script evaluation.",
        fails: "Redis failover karta hai aur har bucket kho jaata hai. Har client ko ek saath poora bucket mil jaata hai, jo lagbhag double intended rate ki chhoti window hai. Limiter ke liye yeh acceptable failure hai aur zor se kehna banta hai, kyunki yahi argument hai ki yahan synchronous replication ke liye paisa kyun nahi dena.",
        say: "Script ke atomic hone ki wajah yeh hai ki Redis single threaded hai, aur wahi wajah hai ki script chhota rehna chahiye. Us vaakya ke dono hisse matter karte hain." },

      { job: "Do fields: kitne tokens bache the, aur yeh kab sach tha.",
        why: "Yeh lazy refill support karne wali sabse chhoti state hai. In do numbers aur current time se sahi token count ek subtraction aur ek multiplication hai.",
        forced: "Stage 2.",
        alts: [["Storing a token count alone, with a background refiller", "do ke bajaye ek field, aur ise honest rakhne ke liye ek process chahiye."], ["A stream or list of grants", "auditable, aur yeh sliding window ki memory profile hai uski exactness ke bina."]],
        pros: ["Traffic ki parwah kiye bina constant size.", "Do chhoti fields ka hash Redis compactly encode karta hai, to yeh sach mein lagbhag sau bytes hai.", "Absent key matlab full bucket, jisse pehla use aur expiry ek hi code path ho jaate hain."],
        cons: ["Token count float hai jo string mein render hota hai, to na exact hai na parse karna sasta.", "Timestamp jo bhi caller ki clock ne kaha wahi hai, to state kisi aur ka andaza carry karti hai ki ab kab tha."],
        cost: "Har active key ke liye lagbhag 100 bytes, khud expire hoti hui.",
        fails: "Do callers jinki clocks kuch seconds alag hain out of order timestamps likhte hain. Refill computation elapsed time ko zero par clamp karti hai, to bucket kuch der refill hi nahi hota, aur client configured se zyada limit ho jaata hai aur kisi log mein kuch nahi jo iski wajah bataye.",
        say: "Token ka hazaarwan hissa integer mein store karna ise exact bana dega, aur reasoning wahi hai jo paisa kabhi float mein na rakhne ki hai. Yahan ka float consequence mein chhota hai aur kind mein identical." },

      { job: "Window ke andar abhi bachi har request ke liye ek member, uske timestamp se scored.",
        why: "Exactness ko individual events chahiye. Ek count nahi bata sakta ki kaunsi requests window se girne wali hain; timestamps ka set bata sakta hai.",
        forced: "Stage 4.",
        alts: [["A count plus the oldest timestamp", "constant memory, aur yeh nahi jaan sakta ki doosra sabse purana kab expire hoga, to sirf approximate kar sakta hai."], ["Two counters, the current and the previous window, weighted", "standard approximation. Constant memory, kuch percent ka error, aur jo zyadatar bade systems asal mein chalate hain."]],
        pros: ["Score ke hisaab se range delete expired entries ek command mein evict karta hai.", "Eviction ke baad count ek single O(1) command hai.", "Inspectable hai, to decision ke peeche ke exact request times padhe ja sakte hain."],
        cons: ["Memory limit aur traffic ke saath badhti hai, to sabse heavy users track karne mein sabse mehnge hain.", "Member mein UUID hi sabse bhaari hissa hai, to stored bytes ka zyadatar hissa information nahi, uniqueness guarantee karne ke liye hai."],
        cost: "Window ki har request ke liye lagbhag 80 bytes. 100 ke limit par 8 KB per key.",
        fails: "Ek key bahut bade limit aur lambi window ke saath banti hai, aur sorted set megabytes tak badh jaata hai. Eviction command ko ab atomic script ke andar asli kaam karna padta hai, jo chalte waqt har doosre Redis client ko block karta hai. Limit ko cap karo, ya kisi size ke upar upar bataye weighted approximation par jao.",
        say: "Chhota unique member, UUID ke bajaye ek counter, is key ki memory aadhi kar deta aur exactness rakhta. UUID aasan correct jawab hai, sasta nahi." },

      { job: "Bata do ki abhi time kya hai, dono algorithms ke liye.",
        why: "Ise external, untrusted box ki tarah draw kiya gaya hai kyunki woh bilkul wahi hai. Value atomic region ke bahar bani hai, us process ne banayi jisne request handle ki, aur phir andar poori tarah trust ki jaati hai.",
        forced: "Stage 5, aur yeh design ki sabse interesting kamzori hai.",
        alts: [["Redis TIME, called inside the script", "har caller ke liye ek clock, to skew poori tarah gayab. Pehle yeh awkward tha kyunki non deterministic command script ko verbatim replicate karne ke liye unsafe bana deta tha, aur modern Redis script ke effects replicate karta hai uske source ko nahi, to yeh objection hat gaya."], ["Requiring NTP on every caller", "design nahi, ek umeed hai. Das milliseconds ka skew normal hai aur kabhi kabhi seconds ka hota hai."]],
        pros: ["Time andar pass karna script ko deterministic rakhta hai, jo purana aur zyada conservative choice hai.", "Algorithm ko trivially testable banata hai, kyunki test jo time chahe pass kar sakta hai."],
        cons: ["Kai callers matlab kai clocks aur unke beech koi agreement nahi.", "Tez clock wala caller bucket mein future timestamp likhta hai, aur phir sahi clock wala har caller zero elapsed time compute karta hai aur real clock pakadne tak koi refill nahi lagta.", "Sliding window ke liye skewed now poori window shift kar deta hai, to client un requests ki wajah se limit ho sakta hai jo us process ke hisaab se abhi hui hi nahi."],
        cost: "Kuch nahi, aur yahi ek fleet mein correct aur approximately correct ka farq hai.",
        fails: "Autoscaling group ka ek instance do second aage ki clock ke saath aata hai. Uski writes agle do seconds tak har us client ke bucket ko poison karti hain jise woh serve karta hai, aur symptom yeh hai ki clients configured se zyada limit hote hain, kabhi kabhi, sirf kuch instances par. Bahar se yeh dhoondhna sach mein bura bug hai.",
        say: "Script ke andar Redis se time lo. Ek clock, koi skew nahi, aur determinism ka objection kai major versions pehle lagna band ho gaya." },

      { job: "Dono algorithms ko in process Redis ke against chalata hai, aur time ko demand par aage badhata hai.",
        why: "Time based algorithm ko clock ka control chahiye, warna honest test nahi ho sakta. Test mein asal ek second ruk kar dekhna slow aur flaky hai; fake ko fast forward karna dono nahi.",
        forced: "Stage 5, aur yeh is repository ka woh hissa hai jise sabse zyada copy karna chahiye.",
        alts: [["Testing against a real Redis in a container", "higher fidelity, asli Lua interpreter samet, aur test suite chalane ke liye infrastructure chahiye. Ek doosri, slower suite ke liye achha candidate, akeli suite ke liye nahi."], ["Mocking the Redis client", "fast hai aur kuch test nahi karta, kyunki poora algorithm us script mein hai jiski jagah mock khada hoga."], ["Sleeping in the test", "woh version jo sab pehle likhte hain: slow, flaky, aur loaded build machine par fail hone ke baad delete ho jaata hai."]],
        pros: ["Koi infrastructure nahi, to suite kahin bhi ek second mein chalti hai.", "Time fast forward karne se refill aur expiry sabr ke kaam nahi, aam assertions ban jaate hain.", "Tests asli Lua exercise karte hain, uska Go reimplementation nahi, to test hone wali cheez wahi hai jo ship hoti hai."],
        cons: ["In process Redis asli wale se alag Lua implementation use karta hai, to script yahan pass ho kar production mein alag behave kar sakta hai. Rare, aur jaanna zaroori.", "Yeh us concurrency ko exercise nahi karta jise handle karne ke liye scripts bane hain, kyunki ek test goroutine kabhi khud se race nahi karta."],
        cost: "Ek dependency, sirf test ke liye.",
        fails: "Script kisi aise Redis ya Lua behaviour par rely karti hai jo in process version thoda alag implement karta hai, aur farq production mein pata chalta hai. Wahi suite continuous integration mein asli Redis ke against bhi chalao, jo naye tests nahi, ek configuration change hai.",
        say: "Time ko control karna hi time based algorithm ko testable banata hai. Agar refill test karne ka ekmaatra tareeka uska intezaar karna hai, to design mein ek seam missing hai." }
    ],

    patternsIntro: "Itni chhoti library mein lagbhag teen decisions ki jagah hai. Unme se do naam lene layak patterns hain, ek pattern jo sahi tarah se refuse kiya gaya, aur do aur shapes jo is code mein shayad honi chahiye thi aur nahi hain.",

    patterns: [
      { what: "Poora decision Lua ki ek constant string hai, jo Redis ko bheji jaati hai aur wahin chalti hai.",
        varies: "Iska kuch vary nahi hota. Yeh isliye hai ki read, decision aur write ek operation ban jaayein aur kuch interleave na ho sake.",
        without: "Go se read, Go mein decide, Go se write. Do round trips, aur unke beech ek window jismein doosra process wahi karta hai aur wahi galat conclusion par pahunchta hai.",
        cost: "Logic ab doosri language mein rehta hai, na type checking, na test coverage tooling, na debugger. Yeh asli keemat hai aur ise dekar wahi ek property milti hai jo yahan matter karti hai." },
      { what: "Token bucket aur sliding window, is se choose hote hain ki kaunsa constructor call karte ho, uske baad call shape same.",
        varies: "Limiting algorithm. Caller configuration se choose karta hai, jaise is library ko import karne wala load balancer karta hai.",
        without: "Caller ek algorithm ke implementation tak seedha pahunchta hai aur code badle bina apna mann nahi badal sakta.",
        cost: "Yahan ise ek struct ki tarah implement kiya gaya jo dono parameter sets rakhta hai, to aadhi fields kisi bhi waqt meaningless hain aur mismatched call chupke se sab deny kar deti hai. Pattern sahi hai; iski yeh shape design ka sabse kamzor point hai." },
      { what: "Ek ticker jo schedule par har bucket mein tokens add karta hai, jaise algorithm aam taur par describe hota hai.",
        varies: "Kuch nahi, aur yeh aisa process hota jiska kaam requests ki sankhya ke saath nahi, clients ki sankhya ke saath badhta.",
        without: "Refill ko stored timestamp se compute karo jab koi pooche. Bucket jab bhi observe ho correct hai aur warna untouched.",
        cost: "Koi nahi. Isse refuse karna codebase ka sabse achha decision hai, aur general lesson kahin bhi lagu hota hai: aisi state maintain karne ke liye kaam schedule mat karo jise abhi koi dekh nahi raha." },
      { what: "Ek TokenBucket type aur ek SlidingWindow type, har ek sirf apne parameters hold karta hai, ek shared interface ke peeche.",
        varies: "Kuch naya nahi. Yeh kuch enable nahi karta, bas ek poori class ki error hata deta hai.",
        without: "Chaar fields wala ek struct jisme do hamesha zero hain, to galat method call karna compile hota hai aur hamesha ek plausible, galat jawab deta hai.",
        cost: "Ek extra type aur ek interface, shayad chalis lines. Yeh woh change hai jo main sabse pehle karta, aur ise rejected isliye list kiya hai kyunki code mein abhi yeh hua nahi." },
      { what: "Allowed, remaining, retry after aur error return karo, ek bit nahi.",
        varies: "Caller kya karna chahta hai. Retry-After header bhejna, near misses log karna, backend unreachable ho to fail open.",
        without: "Caller denied aur broken mein farq nahi kar sakta, aur client ko nahi bata sakta ki kab wapas aana hai. Script ne dono compute kiye aur boundary ne phenk diye.",
        cost: "Signature mein ek struct aur ek error, jo published API mein breaking change hai. Ek major version ke layak, aur doosra change jo main karta." }
    ],

    flowsIntro: "Do decisions, har algorithm ke liye ek. Dono ek round trip hain, aur sab kuch interesting beech ke step mein Redis ke andar hota hai.",

    flows: [
      { n: "A token bucket decision",
        note: "Pehle aur aakhri step ke beech ka sab kuch ek atomic script ke andar hota hai.",
        steps: [
          ["Caller poochta hai ki key kuch tokens kharch kar sakti hai ya nahi. Library local clock se current time padhti hai aur key, rate, burst, woh time aur maangi hui amount ke saath script evaluate karti hai."],
          ["Redis ke andar: stored token count aur timestamp padho. Missing key full bucket ki tarah padhi jaati hai, to pehle use ko koi special case nahi chahiye."],
          ["Stored timestamp se elapsed time compute karo, zero par clamp karke, tokens mein rate times elapsed add karo, aur result ko burst size par cap karo."],
          ["Agar requested se kam tokens hain to zero return karo aur kuch mat likho. Denial koi nishaan nahi chhodta, isliye denied client kuch exhaust nahi kar sakta."],
          ["Warna subtract karo, dono fields wapas likho, aur expiry us time par set karo jo ek full refill mein lagta. Ek return karo."],
          ["Wapas Go mein reply true ya false ban jaata hai, aur script ki jaani hui baaki sab cheez phenk di jaati hai."]
        ] },
      { n: "A sliding window decision",
        steps: [
          ["Library is request ke liye ek member banati hai: nanoseconds mein current time jo ek fresh UUID se joda gaya hai, kyunki sorted set ka member unique hona chahiye warna ek hi pal ki do requests ek ban jaati hain."],
          ["Redis ke andar: har woh member hata do jo now minus window se purane score ka hai. Yeh sliding hissa hai, aur yeh timer par nahi, read par hota hai."],
          ["Jo bacha use count karo, jo ab bilkul trailing window ke andar ki requests ki sankhya hai."],
          ["Agar count limit se neeche hai, to is request ka member add karo aur key ki expiry window length tak refresh karo. Ek return karo."],
          ["Warna add kiye bina zero return karo, taaki reject hui request us window ko extend na kare jisne use reject kiya. Yeh detail matter karti hai: denials record karne se client khud ko hamesha limited rakh sakta."]
        ] },
      { n: "When Redis does not answer",
        note: "Yeh raasta behas ke layak hai, aur yahi woh hai jo library abhi tumhare liye decide karti hai.",
        steps: [
          ["Evaluation ek error return karta hai, timeout, failover ya unreachable host se."],
          ["Library error ko standard output par print karti hai. Library ka caller ke output mein likhna chhoti baat hai jo scale par irritating aur route karna impossible ban jaati hai."],
          ["Yeh false return karti hai, jise caller rate limited padhta hai. Service ab har request deny karti hai kyunki use protect karne wala component unavailable hai."],
          ["Kya hona chahiye: decision ke saath error bhi return karo aur caller ko choose karne do. Rate limiter ke liye jawab lagbhag hamesha alert ke saath fail open hai, kyunki jo guard rail toot kar road band kar de woh kisi guard rail se bhi bura hai."]
        ] }
    ],

    tradeoffsIntro: "Chaar decisions. Pehla caller ka hai, doosra library ka hai aur sahi hai, aur aakhri do library ke hain aur badalne layak hain.",

    tradeoffs: [
      { a: ["Token bucket", "Har key ke liye constant memory. Design se bursts tolerate karta hai, jo asal clients ke behaviour se match karta hai."],
        b: ["Sliding window", "Exact, koi boundary effect nahi. Memory limit ke saath badhti hai, to heavy users sabse mehnge hote hain."],
        flip: "requirement ek hard cap ho jo kabhi exceed nahi hona chahiye, jaise contractual quota ya ek third party API jo tum resell kar rahe ho. Tab exactness hi product hai aur memory keemat." },
      { a: ["The algorithm as a Lua script", "Ek round trip, sach mein atomic, na retries na kahin locks."],
        b: ["WATCH with optimistic retry from the caller", "Poora logic Go mein rehta hai, types aur tests ke saath, aur yeh usi contention mein retry loop ban jaata hai jiske liye rate limiting hai."],
        flip: "script lamba ho ya bade key space par iterate kare, jahan woh chalte waqt har doosre Redis client ko block karta hai. Sirf chhote scripts, aur yeh dono chhote hain." },
      { a: ["Take the time from Redis inside the script", "Har caller ke liye ek clock. Skew gayab ho jaata hai aur wapas nahi aa sakta."],
        b: ["Pass the caller's time in as an argument", "Script deterministic rehti hai, aur tests jo time chahe de sakte hain. Kai callers matlab kai clocks jo agree nahi karti."],
        flip: "tumhe script verbatim replication ke liye deterministic chahiye, jo modern Redis ko ab nahi chahiye kyunki woh source nahi effects replicate karta hai. Tests ke liye injectable clock rakho, aur production mein server ki use karo." },
      { a: ["Return a decision and an error", "Caller Retry-After bhej sakta hai, near miss log kar sakta hai, aur apni failure policy khud decide kar sakta hai."],
        b: ["Return a boolean", "Sabse chhota API aur seekhne ko kuch nahi. Denied aur broken ek hi value ban jaate hain."],
        flip: "library ke liye kabhi nahi. Jo program bas bit chahta hai woh baaki ignore kar sakta hai; jise baaki chahiye woh use wapas nahi la sakta. Boolean private helper ke liye theek hai, kisi aur ke import karne wali cheez ke liye nahi." }
    ],

    next: [
      "<b>Do types aur ek shared interface.</b> Sabse high value change: galat configuration par galat method call karna ek silent permanent denial ke bajaye compile error ban jaata hai.",
      "<b>Error ke saath ek result type.</b> Retry after, remaining, aur caller ka fail open karne ki kshamta. Yeh sab script ke andar pehle se maujood hai.",
      "<b>Time Redis se lo.</b> Ek clock intermittent, instance specific bugs ki poori class hata deta hai jo bahar se diagnose karna lagbhag impossible hai.",
      "<b>Script hash se bhejo.</b> Ek baar load karke SHA se evaluate karne se service ki har request par lagbhag chhe sau bytes bachte hain, aur Redis client mein pehle se ek helper hai jo server ke bhoolne par source bhejne par fall back karta hai.",
      "<b>Use mein dekho.</b> <a href='?p=loadbalancer-lld'>L7 load balancer</a> yeh library import karta hai aur ise har proxied request ke aage rakhta hai, jahan upar wala fail closed behaviour theoretical nahi rehta."
    ] }
}

];
