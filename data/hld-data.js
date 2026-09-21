/* High-Level Design — one-pager notes + practice / further reading
   Node: { n, h?, note?, code?, p?: [[num|"GFG"|"HI"|"EDU"|"GH"|"BB"|"DG"|"CWA", slug|url, title, "E|M|H"], ...], c?: [...] }
   Outline follows https://codewitharyan.com/system-design/high-level-design
*/
const HLD = [

  { n: "Introduction", h: "HLD is boxes and arrows: services, stores, caches, queues, and how a request flows. LLD is classes inside one box.", c: [
    { n: "Where to study more",
      h: "Use this sheet as the map. Open these when you want a second explanation, a diagram, or a full worked problem.",
      note: "<b>Hello Interview</b> — interview delivery framework, core concepts, and FAANG-style problem breakdowns (Bitly, Uber, YouTube…).<br><b>ByteByteGo</b> — visual explainers (Alex Xu). Best for “what does Kafka look like on a whiteboard.”<br><b>Primer / Educative / Design Gurus</b> — deep text + classic Grokking problems.",
      p: [
        ["GH", "https://github.com/ashishps1/awesome-system-design-resources", "awesome-system-design-resources", "E"],
        ["HI", "https://www.hellointerview.com/learn/system-design/in-a-hurry/introduction", "Hello Interview — System Design in a Hurry", "E"],
        ["HI", "https://www.hellointerview.com/learn/system-design/in-a-hurry/delivery", "Hello Interview — delivery framework", "M"],
        ["BB", "https://bytebytego.com/", "ByteByteGo — courses & visuals", "E"],
        ["BB", "https://blog.bytebytego.com/p/ep141-a-cheatsheet-on-system-design", "ByteByteGo — HLD cheatsheet", "M"],
        ["GH", "https://github.com/donnemartin/system-design-primer", "donnemartin/system-design-primer", "M"],
        ["EDU", "https://www.educative.io/courses/grokking-the-system-design-interview", "Educative — Grokking System Design", "M"],
        ["DG", "https://www.designgurus.io/course/grokking-the-system-design-interview", "Design Gurus — Grokking", "M"],
        ["CWA", "https://codewitharyan.com/system-design/high-level-design", "codeWithAryan HLD sheet (this outline)", "E"],
      ]},
    { n: "What is High Level Design?",
      note: "<b>HLD</b> is the architecture of a system: major components, how they talk, data stores, scale, and failure modes. Output: requirements, capacity numbers, a diagram (client → CDN → LB → API → cache/DB/queue), and 2–3 deep dives.<br><b>LLD</b> is how one service is coded. Don't mix rounds.",
      p: [
        ["GFG", "https://www.geeksforgeeks.org/system-design/what-is-high-level-design-hld-learn-system-design/", "What is HLD?", "E"],
        ["HI", "https://www.hellointerview.com/learn/system-design/in-a-hurry/introduction", "Hello Interview — System Design intro", "E"],
        ["GH", "https://github.com/donnemartin/system-design-primer", "System Design Primer", "M"],
        ["CWA", "https://codewitharyan.com/system-design/high-level-design", "codeWithAryan HLD sheet", "E"],
      ]},
    { n: "Scalable, reliable, maintainable",
      note: "<b>Scalable</b> — more load with more machines (horizontal) without a rewrite.<br><b>Reliable</b> — correct despite disk/network/process death (replication, retries, timeouts).<br><b>Maintainable</b> — operability (metrics), simplicity, evolvability. Interview: pick two numbers (QPS, p99) and design to those, not to “infinite scale.”",
      p: [
        ["GH", "https://github.com/donnemartin/system-design-primer#performance-vs-scalability", "Primer — performance vs scalability", "E"],
        ["BB", "https://blog.bytebytego.com/p/ep141-a-cheatsheet-on-system-design", "ByteByteGo HLD cheatsheet", "M"],
      ]},
    { n: "How to approach HLD problems",
      h: "Two questions before any box: (1) core property — what must never be wrong? (2) access pattern — read-heavy, write-heavy, or bursty? Then walk steps 1→13. In 45 min: 1–5 always; 6–13 as 2–3 deep dives. Data flow = you narrate the arrows, not a separate round.",
      note: "<b>Time box:</b> requirements + numbers ~8 min · diagram + data flow ~10 min · DB/API/cache ~10 min · scale/fail/security ~10 min · trade-offs + next ~5 min.<br>Start with 1 region / 1 DB. Scale only after the happy path works.",
      p: [
        ["HI", "https://www.hellointerview.com/learn/system-design/in-a-hurry/delivery", "Hello Interview — delivery framework", "M"],
        ["GFG", "https://www.geeksforgeeks.org/system-design/how-to-answer-a-system-design-interview-problem/", "How to answer a design problem", "M"],
        ["EDU", "https://www.educative.io/courses/grokking-the-system-design-interview", "Grokking the System Design Interview", "M"],
        ["BB", "https://blog.bytebytego.com/p/ep141-a-cheatsheet-on-system-design", "ByteByteGo HLD cheatsheet", "M"],
      ],
      c: [
        { n: "0. Core property + access pattern",
          note: "<b>Core property</b> — the one thing that must not be wrong even if everything else degrades. Money / seats → strong consistency. Feed / presence / like-count → freshness vs cost, eventual is OK.<br><b>Access pattern</b> — read:write ratio, payload size, burst vs steady, online vs offline.<br><b>Online/offline indicator:</b> core property = freshness vs cost. Access pattern = last-seen is write-heavy; presence = heartbeat + Redis TTL, not a row update per pixel." },
        { n: "1. Requirements",
          note: "<b>Functional (3–5 verbs):</b> what a user can do. URL shortener: shorten, redirect, optional analytics. File store: upload, browse folder, download, delete. Say <i>out of scope</i> out loud (no full-text search, no realtime collab) so they can pull it back in.<br><b>Non-functional:</b> latency (p99), availability (nines), consistency, durability, security (authn/z). Pick 2–3 that actually constrain the design — don't recite a textbook list." },
        { n: "2. Constraints / capacity",
          note: "Round numbers. DAU × actions/day × size → QPS, storage, bandwidth.<br>1e8 users, 1 KB object, 100:1 read/write is a fine default if they don't give numbers.<br>Write on the board: peak QPS, avg object size, retention, p99 target. These decide cache vs DB, sync vs queue, SQL vs NoSQL — not the logo on the box." },
        { n: "3. High-level architecture + data flow",
          h: "Boxes first, then walk two paths out loud: write path and read path. That walk is the data flow.",
          note: "<b>Diagram (client → CDN → LB → API → cache / DB / blob / queue).</b> Name each box's job in 3 words.<br><b>Data flow</b> is not extra decoration — interviewers ask “what happens when I click upload?” Trace one request: who writes, who notifies, what is sync vs async (queue + worker for thumbnails, virus scan, search index).<br><b>Sync</b> = user waits (auth, metadata, redirect). <b>Async</b> = 202 + worker (transcode, fan-out, email). If you can't narrate the arrows, the diagram is still LLD-in-disguise." },
        { n: "4. Database",
          note: "<b>Choice:</b> SQL if relations + transactions (bookings, money). NoSQL if huge write, flexible schema, key-lookup (sessions, timelines). Blob store (S3) for bytes; DB for metadata only — never put 5 GB files in Postgres.<br><b>Schema:</b> 3–6 fields that matter (pk, owner, path, size, created_at). Index the query you actually run (user_id + folder_path), not every column.<br>State the consistency on that table (strong on booking row, eventual on view_count)." },
        { n: "5. Core components (API, cache, DB, queue)",
          note: "<b>API:</b> 3–5 endpoints, method + resource + what they return. File store: POST /upload-init, GET /files?path=, GET /download-url, DELETE /files/:id.<br><b>Cache:</b> what key, what TTL, who invalidates (see step 8).<br><b>Queue:</b> only if something is slow or spiky (thumbnails, notifications, search index). Don't add Kafka to a URL shortener.<br><b>Blob / CDN:</b> client uploads/downloads direct to object store via presigned URL — app servers should not proxy gigabytes." },
        { n: "6. Scalability",
          note: "Stateless API behind an LB. Horizontal scale app. Autoscale on CPU / QPS / queue lag — not on vibes.<br>Split read replicas if read-heavy. Split services only when a domain needs its own scale (upload vs metadata vs notify).<br>CDN for hot downloads. Connection draining + health checks so deploys don't drop in-flight work." },
        { n: "7. Partitioning / sharding",
          note: "Shard key = the lookup you always have (user_id, short_code, device_id). Avoid hot shards (one celebrity user_id) — salt, or isolate whales.<br>Blob keys: prefix with user_id/ so listings and IAM stay local.<br>Cache keys should match the query: files:{user}:{folder}. Rebalancing: consistent hashing or a directory service — mention it, don't design the migrator unless asked." },
        { n: "8. Caching",
          note: "Cache the expensive read (folder listing, redirect target, session), not the 5 GB blob (CDN / S3 already is that).<br><b>Policy:</b> cache-aside is the interview default. Write-through if the item is small and always needed.<br><b>Invalidation:</b> on upload/delete, delete that key (and parent folder). TTL as a backstop. Name stampede: lock or jittered TTL.<br>If you can't say how the cache goes stale, don't draw Redis." },
        { n: "9. Reliability",
          note: "Replication (multi-AZ). Failover (what if primary DB dies — promote replica, or fail the write?). Timeouts + retries with backoff + idempotency keys on payments/uploads.<br>Queues: DLQ for poison messages. Blob store: checksum + resumable chunks.<br>Say the failure out loud: empty cache, lagging consumer, dead replica." },
        { n: "10. Security",
          note: "Authn (who): session / JWT / SSO. Authz (what): object owner, signed URL scoped to one key + short TTL.<br>Don't stream files through the API with a god-mode IAM role. Encrypt in transit (TLS) and at rest. Least privilege from API → DB.<br>Rate-limit public endpoints (redirect is a DDoS magnet)." },
        { n: "11. Monitoring",
          note: "Four signals: latency (p99), traffic (QPS), errors (5xx / consumer lag), saturation (CPU, disk, Redis memory).<br>Structured logs + request id. Trace one upload across API → queue → worker.<br>Alert on SLO burn, not on every 4xx. This is also how you prove the design is operable." },
        { n: "12. Trade-offs",
          note: "Say two options and pick one. SQL vs NoSQL, push vs pull feed, cache-aside vs write-through, sync metadata vs “S3 event then write DB.”<br>CAP / PACELC: which side on partition. Cost vs p99. Complexity vs team size.<br>A design with no trade-off sounds fake." },
        { n: "13. Future plans",
          note: "Close with 3 bullets you'd do next if you had another hour: versioning, sharing ACLs, search index, multi-region, stronger consistency on X.<br>Shows you know the design is a v1, not a religion." },
        { n: "Worked example: Dropbox-like file store",
          h: "Same 13 steps. Bytes never go through the API. Metadata is the system; S3 is the disk.",
          note: "<b>1. Functional:</b> upload to a folder, browse, download via secure link, delete. Out of scope: realtime collab, full-text.<br><b>NFR:</b> metadata p99 &lt; 100ms, durable blobs, authz per file, scale storage independently of API.<br><b>2. Constraints (example):</b> ~50k QPS metadata, files to a few GB, petabyte blobs, 100:1 browse:upload.<br><b>3. Diagram + data flow:</b> Client → API (auth + metadata) → Redis / metadata DB. Client ⇄ blob store (presigned PUT/GET). Blob PUT → queue/worker → write metadata + invalidate cache. That's the whole product.<br><b>4. DB:</b> files table/collection {file_id, user_id, name, folder_path, blob_key, size, created_at, is_folder}. Query: (user_id, folder_path). Blobs not in the DB.<br><b>5. Components:</b> API, auth, blob store, metadata DB, cache, async worker on blob events.<br><b>6–7. Scale / partition:</b> stateless API; blob prefix user_id/; metadata shard/index by user_id.<br><b>8. Cache:</b> listing key files:{user}:{path}; invalidate on upload/delete; TTL backup.<br><b>9–11:</b> multi-AZ DB, worker retries + DLQ, presigned URLs, metrics on upload fail + cache hit ratio.<br><b>12. Trade-offs:</b> presigned upload (cheap, app doesn't see bytes) vs proxy (easier auth, won't scale). SQL metadata (joins, txns) vs document store (flexible path). Eventual metadata after S3 PUT (simple) vs sync write-then-upload (user sees file only when DB is sure).<br><b>13. Next:</b> versions, trash, share links, thumbnails via the same worker.",
          code:
`UPLOAD
  Client → POST /upload-init {folder, name, size}
  API    → authz, make blob_key = user_id/folder/uuid
         → return presigned PUT
  Client → PUT bytes to blob store
  Store  → event → worker → UPSERT metadata, DEL cache key

BROWSE
  Client → GET /files?path=/docs/
  API    → Redis files:{user}:/docs/
         → miss: query metadata by (user_id, path), fill cache
         → return names + sizes (not the bytes)

DOWNLOAD
  Client → GET /download-url?file_id=
  API    → authz owner, presigned GET, return URL
  Client → GET bytes from blob / CDN`,
          p: [
            ["HI", "https://www.hellointerview.com/learn/system-design/problem-breakdowns/dropbox", "Hello Interview — Dropbox", "H"],
            ["GFG", "https://www.geeksforgeeks.org/system-design/design-dropbox-a-system-design-interview-question/", "GFG — Design Dropbox", "H"],
            ["BB", "https://blog.bytebytego.com/p/ep141-a-cheatsheet-on-system-design", "ByteByteGo HLD cheatsheet", "M"],
          ]},
      ]},
    { n: "HLD Interview Tips",
      note: "Talk while drawing. Start with 1 region / 1 DB, then scale. State trade-offs out loud (SQL vs NoSQL, push vs pull). Don't invent 12 microservices. Name failure: what if the cache is empty, the queue lags, a replica dies. Close with bottlenecks and what you'd do next.",
      p: [
        ["HI", "https://www.hellointerview.com/learn/system-design/in-a-hurry/introduction", "HLD interview framing", "M"],
        ["DG", "https://www.designgurus.io/blog/system-design-interview-cheatsheet", "Design Gurus cheatsheet", "M"],
      ]},
  ]},

  { n: "Scalability", h: "CAP, scale-out, hashing, LBs, microservices, queues, and a blogging-platform walkthrough.", c: [
    { n: "Basics",
      c: [
        { n: "CAP Theorem",
          note: "On a <b>partition</b> you pick <b>C</b>onsistency or <b>A</b>vailability. CP = refuse stale (ZooKeeper, etcd). AP = serve possibly stale (DNS, Dynamo-style). PACELC: even without partition, latency vs consistency. Don't say “we'll be CA” — a network blip forces a choice.",
          p: [
            ["GFG", "https://www.geeksforgeeks.org/system-design/cap-theorem-in-system-design/", "CAP theorem", "E"],
            ["HI", "https://www.hellointerview.com/learn/system-design/core-concepts/cap-theorem", "Hello Interview — CAP", "E"],
          ]},
        { n: "Vertical and horizontal scaling",
          note: "<b>Vertical</b> — bigger box. Simple until you can't buy a bigger one and failover is a cliff.<br><b>Horizontal</b> — more boxes behind an LB. Needs stateless app or sticky sessions / shared store. Interviews almost always want horizontal.",
          p: [["GFG", "https://www.geeksforgeeks.org/system-design/horizontal-and-vertical-scaling-system-design/", "Horizontal vs vertical scaling", "M"]] },
        { n: "Monoliths and Microservices",
          note: "Start monolith if the team is small. Split when a domain needs its own scale/deploy (payments vs feed). Cost: network, dual writes, distributed tracing. Don't microservice a CRUD todo app.",
          p: [["GFG", "https://www.geeksforgeeks.org/system-design/monolithic-vs-microservices-architecture/", "Monolith vs microservices", "M"]] },
        { n: "Consistent Hashing",
          note: "Map keys and nodes onto a ring. Adding a node remaps ~1/N keys, not everything. Virtual nodes even out load. Used for caches, Cassandra, Dynamo, Kafka partitions (variants).",
          p: [
            ["GFG", "https://www.geeksforgeeks.org/system-design/consistent-hashing/", "Consistent hashing", "M"],
            ["HI", "https://www.hellointerview.com/learn/system-design/core-concepts/consistent-hashing", "Hello Interview — consistent hashing", "M"],
          ]},
        { n: "Load Balancing",
          note: "Spread traffic across healthy backends. L4 (TCP) vs L7 (HTTP, path/host). Health checks + connection draining. SPOF: run 2+ LBs (DNS or anycast). See algorithms below.",
          p: [["GFG", "https://www.geeksforgeeks.org/system-design/what-is-load-balancer-system-design/", "Load balancer", "M"]] },
        { n: "Bloom Filters, Blob Storage, SPOF, Capacity",
          note: "<b>Bloom filter:</b> probabilistic set — “definitely not here” or “maybe.” Great for cache-aside / URL seen.<br><b>Blob:</b> S3/GCS for images/video; app stores the URL.<br><b>SPOF:</b> one box whose death takes the site down — replicate it.<br><b>Capacity:</b> QPS ≈ DAU × actions / 86400. Storage = objects × size × replicas × growth.",
          code:
`# 10M DAU, 20 actions/user/day, 80/20 read/write
qps = 10e6 * 20 / 86400          # ~2.3k avg; peak ~3–5×
reads, writes = 0.8*qps, 0.2*qps
# 1 KB payload, 3 replicas, 5 years
storage_tb = 10e6 * 20 * 365 * 5 * 1e3 * 3 / 1e12`,
          p: [
            ["GFG", "https://www.geeksforgeeks.org/system-design/back-of-the-envelope-calculations-in-system-design/", "Back-of-envelope / capacity", "M"],
            ["GFG", "https://www.geeksforgeeks.org/bloom-filters-introduction-and-python-implementation/", "Bloom filters", "M"],
          ]},
        { n: "Distributed Rate Limiting",
          note: "Per-user/IP limits at the edge (API gateway) using Redis token-bucket or sliding window. Local counters lie under multi-instance. See Interview Problems → Rate Limiter.",
          p: [["GFG", "https://www.geeksforgeeks.org/system-design/rate-limiting-system-design/", "Rate limiting (HLD)", "M"]] },
      ]},
    { n: "Concurrency Control",
      note: "<b>Why:</b> two writers, one row. <b>Locks:</b> shared vs exclusive, optimistic (version column) vs pessimistic (SELECT FOR UPDATE).<br><b>Techniques:</b> mutex, MVCC (Postgres/InnoDB), OCC (retry on version mismatch). Distributed: avoid if you can; else lease + fencing token (see Fault).",
      p: [
        ["GFG", "https://www.geeksforgeeks.org/concurrency-control-in-dbms/", "Concurrency control in DBMS", "M"],
        ["GFG", "https://www.geeksforgeeks.org/system-design/optimistic-vs-pessimistic-locking/", "Optimistic vs pessimistic locking", "M"],
      ]},
    { n: "Load Balancing Algorithms",
      note: "<b>Round robin</b> — equal boxes, equal load.<br><b>Weighted RR</b> — bigger boxes get more.<br><b>Least connections</b> — long requests (uploads).<br><b>Hash / sticky</b> — same user → same box (WebSockets, caches). Consistent hash if backends come and go.",
      p: [["GFG", "https://www.geeksforgeeks.org/system-design/load-balancing-algorithms-system-design/", "LB algorithms", "M"]] },
    { n: "Microservices design patterns",
      note: "<b>Decomposition</b> — split by business domain (bounded context), not by layer.<br><b>Strangler</b> — route new traffic to new service, old stays until gone.<br><b>Saga</b> — long transaction = local txns + compensating actions (choreography vs orchestration).<br><b>CQRS</b> — write model ≠ read model (feeds, search). Eventual consistency on the read side.",
      p: [
        ["GFG", "https://www.geeksforgeeks.org/microservices-design-patterns/", "Microservices patterns", "M"],
        ["GFG", "https://www.geeksforgeeks.org/system-design/saga-design-pattern/", "Saga pattern", "M"],
        ["GFG", "https://www.geeksforgeeks.org/cqrs-command-query-responsibility-segregation/", "CQRS", "M"],
      ]},
    { n: "Observability",
      note: "<b>Logs</b> — what happened (structured JSON, trace id).<br><b>Metrics</b> — RED (rate, errors, duration) + USE (util, saturation, errors).<br><b>Traces</b> — one request across services (OpenTelemetry).<br>Anomaly detection on metrics; RCA = traces + logs for that request id. SLI/SLO/SLA: define error budget.",
      p: [
        ["GFG", "https://www.geeksforgeeks.org/system-design/observability-in-distributed-systems/", "Observability", "M"],
        ["GH", "https://github.com/donnemartin/system-design-primer#performance-vs-scalability", "Primer — measuring", "M"],
      ]},
    { n: "Asynchronous Programming",
      note: "Don't hold an HTTP thread for work that can wait (email, thumbnails, fanout).<br><b>Queues (RabbitMQ, SQS):</b> tasks, competing consumers, ack/retry/DLQ.<br><b>Streams (Kafka, Kinesis):</b> ordered log, replay, many consumer groups.<br><b>EDA:</b> services publish events; others subscribe. Dual-write problem → outbox/CDC.",
      p: [
        ["GFG", "https://www.geeksforgeeks.org/system-design/message-queues-system-design/", "Message queues", "M"],
        ["GFG", "https://www.geeksforgeeks.org/system-design/kafka-architecture/", "Kafka architecture", "M"],
        ["HI", "https://www.hellointerview.com/learn/system-design/core-concepts/asynchronous-processing", "Async processing", "M"],
      ]},
    { n: "Design: multi-user blogging platform",
      note: "Walk the stack: Postgres for posts + users; Redis cache of hot posts; S3 for images; Kafka for “post published” → search index + notifications. Scale reads with replicas + CDN. Writes to primary. Concurrent edits: version column. Delivery: REST create/list; WebSockets or SSE for live comments; long-poll if you must.",
      p: [
        ["GFG", "https://www.geeksforgeeks.org/system-design/design-a-social-media-posting-platform/", "Social posting platform", "M"],
        ["EDU", "https://www.educative.io/courses/grokking-the-system-design-interview", "Grokking — similar designs", "M"],
      ]},
  ]},

  { n: "Databases", h: "Pick the store from access pattern. Then index, shard, replicate, migrate.", c: [
    { n: "Introduction to Databases",
      note: "A DB is durable structured storage plus a query API. Internals: pages, WAL, buffer pool, B-tree / LSM. Retrieval: point get vs range vs scan — that choice drives SQL vs KV vs search.",
      p: [["GFG", "https://www.geeksforgeeks.org/introduction-of-dbms-database-management-system-set-1/", "What are databases?", "E"]] },
    { n: "Types of Databases",
      note: "<b>SQL</b> — schema, joins, ACID (Postgres, MySQL). Default until it isn't.<br><b>NoSQL</b> — document (Mongo), KV (DynamoDB/Redis), wide-column (Cassandra), graph (Neo4j).<br><b>Pick by:</b> query shape (join vs key lookup), consistency, scale, team skill. Search = Elasticsearch; time series = TSDB; files = object store.",
      p: [
        ["GFG", "https://www.geeksforgeeks.org/system-design/sql-vs-nosql-which-database-to-use-in-system-design/", "SQL vs NoSQL", "M"],
        ["HI", "https://www.hellointerview.com/learn/system-design/core-concepts/databases", "Hello Interview — databases", "M"],
      ]},
    { n: "Indexing, partitioning, sharding",
      note: "<b>Index</b> — extra structure for fast lookup (B-tree, inverted). Write cost + storage.<br><b>Partition</b> — split one table (range/list) still one server.<br><b>Shard</b> — split across servers by key (user_id hash). Cross-shard joins hurt. Hot shard = celebrity user; salt or dedicated shard.",
      p: [
        ["GFG", "https://www.geeksforgeeks.org/indexing-in-databases-set-1/", "Indexing", "M"],
        ["GFG", "https://www.geeksforgeeks.org/system-design/database-sharding-a-system-design-concept/", "Sharding", "M"],
      ]},
    { n: "Replication and migration",
      note: "<b>Architectures:</b> primary–replica (async = lag, sync = slower writes), multi-primary (conflict hell).<br><b>WAL / CDC:</b> replicate by shipping the log (Debezium → Kafka).<br><b>Split brain:</b> two primaries after a partition — fencing + consensus.<br><b>Write amp:</b> LSM compaction writes the same data many times.<br><b>Migrate:</b> expand-contract (dual write, backfill, switch read, drop old). Cross-region: latency + legality.",
      p: [
        ["GFG", "https://www.geeksforgeeks.org/system-design/data-replication-in-system-design/", "Replication", "M"],
        ["GFG", "https://www.geeksforgeeks.org/change-data-capture-cdc/", "CDC", "M"],
      ]},
    { n: "Relational deep dives",
      note: "<b>Shared lock</b> = readers; <b>exclusive</b> = writer. Airline check-in = fixed inventory + high contention → atomic decrement or SELECT FOR UPDATE skip locked.<br><b>KV on SQL:</b> table (k PK, v, version); shard by k; no joins. Infinitely scalable only if you never query by v.",
      p: [
        ["GFG", "https://www.geeksforgeeks.org/system-design/design-bookmyshow-movie-ticket-booking-system/", "Fixed inventory (tickets / seats)", "H"],
        ["HI", "https://www.hellointerview.com/learn/system-design/problem-breakdowns/ticketmaster", "Hello Interview — Ticketmaster", "H"],
      ]},
    { n: "Non-relational + Slack chat",
      note: "Row store = OLTP (one row). Column store = analytics (scan few columns, many rows). Wide-column = sparse rows, time-series-ish (Cassandra). Graph = hops (social graph) — pagination on follow-lists is often still SQL.<br><b>Slack:</b> channel = partition key; messages append; fan-out to connected WebSockets; history from store; unread = watermark per user×channel.",
      p: [
        ["GFG", "https://www.geeksforgeeks.org/system-design/design-a-chat-application-like-whatsapp/", "Design chat (WhatsApp/Slack-like)", "H"],
        ["HI", "https://www.hellointerview.com/learn/system-design/problem-breakdowns/whatsapp", "Hello Interview — WhatsApp / chat", "H"],
      ]},
  ]},

  { n: "Consistency", h: "How wrong are you allowed to be, and for how long?", c: [
    { n: "Consistency types, tradeoffs, quorum",
      note: "<b>Strong</b> — after write, all reads see it (linearizable / sequential).<br><b>Eventual</b> — replicas converge; reads may lag.<br><b>Causal / read-your-writes / monotonic</b> — middle ground for feeds.<br><b>Quorum:</b> N replicas, W writes, R reads, R+W > N ⇒ overlap (Dynamo). W=N R=1 = fast read; W=1 R=N = fast write.",
      p: [
        ["GFG", "https://www.geeksforgeeks.org/system-design/eventual-vs-strong-consistency-in-distributed-databases/", "Strong vs eventual", "M"],
        ["GFG", "https://www.geeksforgeeks.org/system-design/quorum-in-system-design/", "Quorum", "M"],
      ]},
    { n: "Isolation levels",
      note: "<b>Read uncommitted</b> — dirty reads.<br><b>Read committed</b> — default Postgres; no dirty, still non-repeatable.<br><b>Repeatable read</b> — snapshot; phantoms possible in some engines.<br><b>Serializable</b> — as if one-at-a-time (SSI or 2PL). Pick the weakest that is still correct.",
      p: [["GFG", "https://www.geeksforgeeks.org/transaction-isolation-levels-dbms/", "Isolation levels", "M"]] },
    { n: "2PC, 3PC, Sagas",
      note: "<b>2PC:</b> coordinator prepare → commit. Blocking if coordinator dies after prepare.<br><b>3PC:</b> extra pre-commit; still not magic on real networks.<br><b>Sagas:</b> don't hold a distributed lock — sequence local commits + compensations (refund, unreserve). Use this in interviews for bookings/orders.",
      p: [
        ["GFG", "https://www.geeksforgeeks.org/two-phase-commit-protocol-distributed-transaction-management/", "Two-phase commit", "M"],
        ["GFG", "https://www.geeksforgeeks.org/system-design/saga-design-pattern/", "Sagas", "M"],
      ]},
  ]},

  { n: "Social Network", h: "Photos, hashtags, unread dots — CDN, crypto, and cheap indicators.", c: [
    { n: "Uploading photos at scale",
      note: "Browser → presigned S3 PUT (don't proxy bytes through app). CDN in front of the bucket. Thumbnails via queue worker. <b>Private photos:</b> signed URLs with short TTL; or encrypted object + KMS. Gravatar = hash(email) → CDN URL, globally cacheable.",
      p: [
        ["GFG", "https://www.geeksforgeeks.org/system-design/design-dropbox-a-system-design-interview-question/", "Design Dropbox / file upload", "H"],
        ["HI", "https://www.hellointerview.com/learn/system-design/problem-breakdowns/dropbox", "Hello Interview — Dropbox", "H"],
        ["GFG", "https://www.geeksforgeeks.org/system-design/what-is-cdn-and-how-does-it-work/", "How CDN works", "M"],
      ]},
    { n: "Hashtag service",
      note: "Write: extract tags, append post_id to tag timeline (Redis list / Cassandra). Read: fan-in latest N. Trade-off: fan-out on write (fast read, heavy celebrity write) vs fan-out on read. UX: autocomplete = trie / ES prefix; debounce the client.",
      p: [
        ["GFG", "https://www.geeksforgeeks.org/system-design/design-twitter-a-system-design-interview-question/", "Twitter / hashtag-adjacent", "H"],
        ["HI", "https://www.hellointerview.com/learn/system-design/problem-breakdowns/fb-news-feed", "Hello Interview — news feed (Twitter-adjacent)", "H"],
      ]},
    { n: "Unread message indicator",
      note: "<b>Punching-bag / watermark:</b> store last_read_ts per user×thread. Unread = exists message > watermark. Don't count every message on read path. Badge = Redis counter incremented on produce, decremented/reset on open. Eventual is OK for a red dot.",
      p: [["GFG", "https://www.geeksforgeeks.org/system-design/design-a-chat-application-like-whatsapp/", "Chat unread (WhatsApp-like)", "M"]] },
  ]},

  { n: "Caching", h: "Where, when, and how you remember an answer so the DB doesn't.", c: [
    { n: "Caching basics",
      note: "Cache = faster, smaller, possibly stale copy. <b>Where:</b> CDN (static), client, app local, Redis/Memcached (shared), DB buffer pool.<br><b>Redis</b> — structures, persistence optional. <b>Memcached</b> — simple DRAM slab, no persistence. Stampede: lock / random TTL jitter on expiry.",
      p: [
        ["GFG", "https://www.geeksforgeeks.org/system-design/caching-system-design/", "Caching in system design", "E"],
        ["HI", "https://www.hellointerview.com/learn/system-design/core-concepts/caching", "Hello Interview — caching", "M"],
      ]},
    { n: "Write policies",
      note: "<b>Write-through:</b> write cache + DB together — consistent, slower writes.<br><b>Write-back / write-behind:</b> write cache, flush later — fast, risk of loss.<br><b>Write-around:</b> write DB, cache on read — avoids write-heavy pollution.<br>“Write-ahead” in this sheet ≈ WAL: log the mutation before applying (durability), cousin of write-back safety.",
      p: [["GFG", "https://www.geeksforgeeks.org/system-design/write-through-write-around-write-back-cache/", "Cache write policies", "M"]] },
    { n: "Replacement policies",
      note: "<b>LRU</b> — evict least recently used (hash + DLL). Recency ≠ frequency.<br><b>LFU</b> — evict coldest count; needs aging so old hits die.<br><b>Segmented LRU</b> — probation → protected (like ARC lite). Scan-resistant.",
      p: [
        [146, "lru-cache", "LRU Cache (implement)", "H"],
        [460, "lfu-cache", "LFU Cache", "H"],
      ]},
    { n: "Design distributed cache",
      note: "Goals: huge QPS, tiny latency, scale out. Single node = hash map + eviction + optional TTL. Distributed = consistent hash of keys → node; replication (N=3) for HA; client or proxy routing. Hot key: replicate that key or local cache. Don't use as source of truth unless write-back + WAL (then you're a KV store).",
      p: [
        ["GFG", "https://www.geeksforgeeks.org/system-design/design-a-distributed-cache/", "Design distributed cache", "H"],
        ["HI", "https://www.hellointerview.com/learn/system-design/problem-breakdowns/distributed-cache", "Hello Interview — distributed cache", "H"],
      ]},
    { n: "Word dictionary without a DB / superfast KV",
      note: "<b>Storage-compute split:</b> immutable data files on disk, thin compute that mmap/index them (data-eng core idea).<br><b>Bitcask:</b> append-only log + in-memory {key → file,offset,size}. Writes = sequential. Reads = 1 disk seek if not in OS cache. Delete = tombstone. Compact in background. Crash recovery = replay index or hint files.",
      p: [
        ["GH", "https://github.com/basho/bitcask/blob/develop/doc/bitcask-intro.pdf", "Bitcask intro (PDF)", "H"],
        ["GFG", "https://www.geeksforgeeks.org/system-design/design-key-value-store/", "Design a KV store", "H"],
      ]},
  ]},

  { n: "High Throughput", h: "LSM, CDC, cheap history, and live video.", c: [
    { n: "LSM trees",
      note: "Writes go to a memtable, flush to sorted SSTables, compact in tiers. Fast writes, reads may check many files (bloom + index help). Invented to beat random B-tree writes on disk. Bitcask is “one file, hash index”; LSM is “many sorted files.” Tiered storage: hot SSD, cold HDD/S3.",
      p: [["GFG", "https://www.geeksforgeeks.org/system-design/log-structured-merge-tree/", "LSM trees", "M"]] },
    { n: "CDC and dual writes",
      note: "Writing DB <i>and</i> Kafka in the app = one can succeed, the other fail. <b>Outbox:</b> write event row in the same txn as the business row, poller publishes. <b>CDC:</b> tail WAL (Debezium). That's how order-history and search stay in sync.",
      p: [["GFG", "https://www.geeksforgeeks.org/change-data-capture-cdc/", "Change Data Capture", "M"]] },
    { n: "Amazon order history",
      note: "Write path = orders DB (source of truth). Read path = cheap query store (Cassandra / S3 + index) filled by CDC. Old orders go cold storage. Don't keep 7 years of joins on the OLTP primary.",
      p: [["GFG", "https://www.geeksforgeeks.org/system-design/design-amazon-system-design/", "Amazon-like e-commerce HLD", "H"]] },
    { n: "Hotstar live streaming",
      note: "Encode once → packager (HLS/DASH chunks) → origin → CDN (the whole product). Clients fetch playlists; CDN absorbs millions of viewers. Chat/reactions = separate WebSocket cluster. Origin never sees every viewer.",
      p: [
        ["GFG", "https://www.geeksforgeeks.org/system-design/design-youtube-a-system-design-interview-question/", "Design YouTube / streaming", "H"],
        ["HI", "https://www.hellointerview.com/learn/system-design/problem-breakdowns/youtube", "Hello Interview — YouTube", "H"],
      ]},
  ]},

  { n: "APIs", h: "How clients talk to you — protocol, shape, and who is allowed.", c: [
    { n: "What is an API? HTTP",
      note: "API = contract (URL, verb, body, errors). HTTP: GET safe/idempotent, PUT/DELETE idempotent, POST create. Status: 2xx ok, 4xx client, 5xx you. Version via URL or header. Pagination: cursor > offset at scale.",
      p: [["GFG", "https://www.geeksforgeeks.org/system-design/what-is-an-api-system-design/", "What is an API?", "E"]] },
    { n: "Protocols & interaction models",
      note: "<b>REST</b> — resources + HTTP; default.<br><b>SOAP</b> — XML envelopes; enterprise legacy.<br><b>GraphQL</b> — client picks fields; watch N+1 and auth per field.<br><b>gRPC</b> — protobuf, streaming, service-to-service.<br><b>Polling</b> — simple, wasteful. <b>Long poll</b> — hold until event. <b>WebSockets</b> — bidirectional. <b>SSE</b> — server→client stream over HTTP.",
      p: [
        ["GFG", "https://www.geeksforgeeks.org/system-design/rest-vs-graphql-vs-grpc/", "REST vs GraphQL vs gRPC", "M"],
        ["GFG", "https://www.geeksforgeeks.org/system-design/long-polling-vs-websockets-vs-sse/", "Long poll vs WS vs SSE", "M"],
      ]},
    { n: "API security",
      note: "<b>Authn</b> who; <b>authz</b> what. Sessions vs <b>JWT</b> (stateless, hard revoke — use short TTL + denylist).<br><b>OAuth2</b> — delegated access; <b>SSO</b> — SAML/OIDC to IdP.<br><b>MFA</b> — second factor.<br><b>ACL on blobs:</b> IAM policies / signed URLs, never public-write buckets.",
      p: [
        ["GFG", "https://www.geeksforgeeks.org/system-design/authentication-vs-authorization/", "Authn vs authz", "M"],
        ["GFG", "https://www.geeksforgeeks.org/jwt-json-web-tokens/", "JWT", "M"],
        ["GFG", "https://www.geeksforgeeks.org/oauth-2-0-authorization-framework/", "OAuth 2.0", "M"],
      ]},
  ]},

  { n: "Fault & Consensus", h: "Things will fail. Elect a leader, agree on a value, mint unique IDs.", c: [
    { n: "Fault vs failure",
      note: "<b>Fault</b> — a component misbehaves (disk slow, process crash).<br><b>Failure</b> — the system as a whole can't meet spec. Techniques: retry+backoff+jitter, timeouts, circuit breaker, bulkhead, redundancy, graceful degradation (serve stale).",
      p: [
        ["GFG", "https://www.geeksforgeeks.org/system-design/fault-tolerance-in-system-design/", "Fault tolerance", "M"],
        ["GH", "https://github.com/donnemartin/system-design-primer#availability-patterns", "Primer — availability patterns", "M"],
      ]},
    { n: "Leader election",
      note: "Need one writer / scheduler. <b>Bully:</b> highest ID wins; chatty, old.<br><b>Raft:</b> randomized timeouts, majority log, simple to explain in interviews. Lease the leadership; fencing token so a stale leader can't commit.",
      p: [
        ["GFG", "https://www.geeksforgeeks.org/bully-election-algorithm/", "Bully algorithm", "M"],
        ["GH", "https://raft.github.io/", "Raft (official)", "H"],
      ]},
    { n: "Load balancer without SPOF + distributed locks",
      note: "Two+ LBs, anycast or DNS; backends registered in a health pool. <b>Distributed lock:</b> Redis SET NX PX is not enough alone — use Redlock carefully or etcd/ZooKeeper with fencing. Needed for “only one cron” and some sagas. Prefer DB unique constraints when you can.",
      p: [["GFG", "https://www.geeksforgeeks.org/system-design/distributed-locking-in-system-design/", "Distributed locks", "M"]] },
    { n: "Distributed consensus",
      note: "Agree on one value (config, leader, txn order) despite crashes. <b>Paxos</b> — prepare/accept, majority; historically important, easy to get wrong.<br><b>Raft</b> — leader-based Paxos-equivalent, teachable.<br><b>ZAB</b> — ZooKeeper atomic broadcast. Use ZooKeeper/etcd; don't implement Paxos in the round.",
      p: [
        ["GFG", "https://www.geeksforgeeks.org/system-design/paxos-consensus-algorithm/", "Paxos", "H"],
        ["GFG", "https://www.geeksforgeeks.org/zookeeper-an-introduction/", "ZooKeeper / ZAB", "M"],
      ]},
    { n: "Distributed ID generator",
      note: "Need unique, roughly time-ordered IDs without a single bottleneck.<br><b>UUID</b> — unique, not sortable, large index.<br><b>Central service</b> — simple, SPOF, latency.<br><b>Batch</b> — grab 1000 IDs, mint locally.<br><b>Flickr:</b> ticket servers with odd/even.<br><b>Snowflake:</b> timestamp | worker | sequence (Twitter, Discord-tuned).",
      code:
`# 64-bit snowflake-style
# [41 bits ms since epoch][10 bits worker][12 bits seq]
def snowflake(ms, worker, seq):
    return (ms << 22) | (worker << 12) | seq`,
      p: [
        ["GFG", "https://www.geeksforgeeks.org/system-design/unique-id-generation-in-distributed-systems/", "Unique IDs in distributed systems", "M"],
        ["BB", "https://blog.bytebytego.com/p/twitter-snowflake-unique-id-generation", "ByteByteGo — Snowflake", "M"],
      ]},
  ]},

  { n: "Networking", h: "Enough OSI, TCP/UDP, DNS/CDN, and proxies to defend a diagram.", c: [
    { n: "OSI layers",
      note: "1 Physical · 2 Data link (MAC, Ethernet) · 3 Network (IP, routing) · 4 Transport (TCP/UDP) · 5 Session · 6 Presentation (TLS, codecs) · 7 Application (HTTP, DNS). Interview: HTTP is 7, TLS ~6, TCP 4, IP 3. Load balancer L4 vs L7 lives here.",
      p: [["GFG", "https://www.geeksforgeeks.org/layers-of-osi-model/", "OSI model", "E"]] },
    { n: "Client-server vs P2P",
      note: "Client-server = dumb clients, smart datacenter (web apps). P2P = peers share (BitTorrent, WebRTC media). Hybrids: signaling server + P2P media (Zoom-ish).",
      p: [["GFG", "https://www.geeksforgeeks.org/difference-between-client-server-and-peer-to-peer-network/", "Client-server vs P2P", "M"]] },
    { n: "ISP, DNS, CDN",
      note: "<b>DNS</b> — name → IP; cache TTLs; GeoDNS for regions.<br><b>CDN</b> — cache at PoPs near users; origin shield.<br><b>ISP</b> — last mile; you don't control it, so design for loss and mobile.",
      p: [
        ["GFG", "https://www.geeksforgeeks.org/domain-name-system-dns-in-application-layer/", "DNS", "E"],
        ["GFG", "https://www.geeksforgeeks.org/system-design/what-is-cdn-and-how-does-it-work/", "CDN", "M"],
      ]},
    { n: "Application protocols",
      note: "HTTP/S — request/response. WebSockets — frames, sticky LB. gRPC — proto + HTTP/2. WebRTC — real-time media. FTP/SFTP — files. SMTP — mail. AMQP — broker messaging. DASH/HLS — video chunks + manifest.",
      p: [["GFG", "https://www.geeksforgeeks.org/http-non-http-protocols-in-computer-network/", "App-layer protocols", "M"]] },
    { n: "TCP, UDP, QUIC, IP",
      note: "<b>TCP</b> — reliable, ordered, handshake, congestion control. <b>UDP</b> — fire-and-forget (games, DNS, video with app-level retry). <b>QUIC</b> — UDP-based, multiplexed, faster connect (HTTP/3). <b>IP</b> — addressing and routing; IPv4 vs IPv6.",
      p: [["GFG", "https://www.geeksforgeeks.org/differences-between-tcp-and-udp/", "TCP vs UDP", "M"]] },
    { n: "Proxies",
      note: "<b>Forward proxy</b> — client-side (egress, filter, hide IP).<br><b>Reverse proxy</b> — server-side (nginx/ALB: TLS, cache, LB, WAF). API gateway is a fancy reverse proxy with auth and rate limits.",
      p: [["GFG", "https://www.geeksforgeeks.org/system-design/forward-proxy-vs-reverse-proxy/", "Forward vs reverse proxy", "M"]] },
  ]},

  { n: "UX & Realistic Design", h: "No extra boxes. Design for the actual user and the SLA.", c: [
    { n: "Recent searches",
      note: "Per-user list in Redis (capped list) or local device + sync. Fallback if Redis miss → SQL. Future-proof: same API can later personalize. Business: recents drive re-query; don't over-build Elasticsearch for 10 strings.",
      p: [["GFG", "https://www.geeksforgeeks.org/system-design/design-autocomplete-or-query-suggestion-service/", "Autocomplete / search suggestions", "M"]] },
    { n: "Cricbuzz text commentary",
      note: "Tiny, append-only events. Push via SSE/WS to fans in a match room. Store in a log (Kafka + Redis latest N). Cost: one writer per match, CDN optional for historical page. Empathy: score must feel live; ads/widgets don't block the ticker.",
      p: [["GFG", "https://www.geeksforgeeks.org/system-design/design-a-live-streaming-system-like-espn/", "Live sports-like systems", "M"]] },
    { n: "Distributed task scheduler",
      note: "Strong SLA: run once (or at-least-once + idempotent handler) at T. Partition jobs by time wheel / hash. Leader assigns; workers heartbeat. Recurring = cron expression → next fire. Multi-tenant: noisy-neighbor quotas. Don't use one Linux cron box.",
      p: [["GFG", "https://www.geeksforgeeks.org/system-design/design-a-distributed-job-scheduler/", "Distributed job scheduler", "H"]] },
    { n: "Flash sale",
      note: "IRCTC / BookMyShow / hotels: inventory << demand. Queue users (waiting room), shard inventory, atomic decrement, short locks (see LLD seats). Empathy: fairness, countdown, no double charge. Cache the product page; never cache remaining_count without a TTL of seconds.",
      p: [
        ["HI", "https://www.hellointerview.com/learn/system-design/problem-breakdowns/ticketmaster", "Ticketmaster / flash inventory", "H"],
        ["GFG", "https://www.geeksforgeeks.org/system-design/design-bookmyshow-movie-ticket-booking-system/", "BookMyShow", "H"],
      ]},
  ]},

  { n: "Efficient & Extensible", h: "Count cheaply, sync files, find nearby, paginate follows.", c: [
    { n: "Impression counting",
      note: "Exact COUNT(*) at Instagram scale is expensive. <b>HyperLogLog</b> ≈ unique counts with a few KB (error ~1%). Extensible: add sketches (HLL, Bloom, t-digest) without changing write path. Robust: buffer events → stream → daily rollups for billing-grade numbers.",
      p: [
        ["GFG", "https://www.geeksforgeeks.org/hyperloglog-algorithm/", "HyperLogLog", "M"],
        ["GFG", "https://www.geeksforgeeks.org/system-design/design-an-ad-click-aggregator/", "Ad click aggregator", "H"],
      ]},
    { n: "Remote file sync",
      note: "Identify what changed: checksums / Merkle / block rolling hash (rsync). Resumable uploads: chunk + etag, retry missing chunks. Multi-version: immutable versions + pointer to latest (Dropbox/S3 versioning).",
      p: [
        ["HI", "https://www.hellointerview.com/learn/system-design/problem-breakdowns/dropbox", "Dropbox / sync", "H"],
        ["GFG", "https://www.geeksforgeeks.org/system-design/design-dropbox-a-system-design-interview-question/", "Design Dropbox", "H"],
      ]},
    { n: "Geo proximity (Uber / Ola)",
      note: "Write-heavy driver pings + read-heavy nearby queries. GeoHash / Hilbert / Z-curve → 1D index in Redis GEO or Dynamo. Quadtrees for in-mem. Match = nearby + constraints (car type). Tinder/Swiggy/Zomato same pattern, different SLA.",
      p: [
        ["GFG", "https://www.geeksforgeeks.org/system-design/design-uber-system-design/", "Design Uber", "H"],
        ["HI", "https://www.hellointerview.com/learn/system-design/problem-breakdowns/uber", "Hello Interview — Uber", "H"],
      ]},
    { n: "Follow / following",
      note: "Relational: follows(follower_id, followee_id) unique + indexes both ways. Pagination by (created_at, id). Graph DB shines for “friends of friends” — not required for a two-hop list. Celebrity problem: don't fan-out 100M follows on write; pull for celebs.",
      p: [["GFG", "https://www.geeksforgeeks.org/system-design/design-twitter-a-system-design-interview-question/", "Twitter follow graph", "H"]] },
  ]},

  { n: "Tradeoffs", h: "Say the pair, pick a side, say when you'd flip.", c: [
    { n: "Network tradeoffs",
      note: "<b>Accuracy vs latency</b> — approximate counts (HLL) vs exact.<br><b>Memory vs latency</b> — cache more vs hit disk.<br><b>Throughput vs latency</b> — batch (higher T, worse L) vs one-by-one.<br><b>TCP vs UDP</b> — reliability vs speed.<br><b>Long poll vs WebSockets</b> — simpler infra vs true duplex / server push.",
      p: [["GFG", "https://www.geeksforgeeks.org/system-design/latency-vs-throughput/", "Latency vs throughput", "M"]] },
    { n: "Data tradeoffs",
      note: "Strong vs eventual. SQL vs NoSQL. Consistency vs availability (CAP). Default interview sentence: “I'll take strong consistency on money, eventual on the like counter.”",
      p: [["GFG", "https://www.geeksforgeeks.org/system-design/sql-vs-nosql-which-database-to-use-in-system-design/", "SQL vs NoSQL", "M"]] },
    { n: "Scalability tradeoffs",
      note: "Performance vs cost (more replicas). Scalability vs single-box performance (network hops). Batch vs stream (hourly bill vs fraud-now).",
      p: [["GH", "https://github.com/donnemartin/system-design-primer#performance-vs-scalability", "Primer — performance vs scale", "M"]] },
    { n: "Architecture tradeoffs",
      note: "<b>Pull vs push</b> — clients fetch vs server fans out (feeds, notifications).<br><b>Monolith vs microservices</b> — simplicity vs independent scale.<br><b>Stateful vs stateless</b> — sticky sessions vs store state in Redis/DB (stateless app servers scale).",
      p: [["GFG", "https://www.geeksforgeeks.org/system-design/stateless-vs-stateful-architecture/", "Stateful vs stateless", "M"]] },
  ]},

  { n: "Interview Problems", h: "The classics. Sketch API → capacity → diagram → the one hard component.", c: [
    { n: "Important",
      c: [
        { n: "Design Rate Limiter (HLD)",
          note: "Gateway + Redis token bucket / sliding window per key. Return 429 + Retry-After. Distributed: atomic Lua/INCR. Place at edge so abusive traffic never hits app. Rules: per user, IP, API key.",
          p: [
            ["GFG", "https://www.geeksforgeeks.org/system-design/rate-limiting-system-design/", "Rate limiter HLD", "H"],
            ["HI", "https://www.hellointerview.com/learn/system-design/problem-breakdowns/rate-limiter", "Hello Interview — rate limiter", "H"],
            [359, "logger-rate-limiter", "LC Logger Rate Limiter (tiny version)", "M"],
          ]},
        { n: "Design URL Shortener",
          note: "POST long → short (base62 of snowflake or hash+collision retry). GET short → 302. Store {short, long, created, clicks}. Cache hot redirects. Analytics async. Custom aliases unique index.",
          p: [
            ["GFG", "https://www.geeksforgeeks.org/system-design/design-url-shortener/", "URL shortener", "M"],
            ["HI", "https://www.hellointerview.com/learn/system-design/problem-breakdowns/bitly", "Hello Interview — URL shortener / Bitly", "M"],
            ["BB", "https://bytebytego.com/", "ByteByteGo visuals (TinyURL-style)", "M"],
            ["DG", "https://www.designgurus.io/course-play/grokking-the-system-design-interview/doc/design-a-url-shortening-service-like-tinyurl", "Design Gurus — TinyURL", "M"],
          ]},
        { n: "Design Notification System",
          note: "API → notification service → Kafka partitioned by user → workers per channel (push/email/SMS). Template + prefs + DND. At-least-once + idempotent send. Fan-out for “notify followers” is the scale problem.",
          p: [
            ["GFG", "https://www.geeksforgeeks.org/system-design/design-a-notification-system/", "Notification system", "M"],
            ["HI", "https://www.hellointerview.com/learn/system-design/problem-breakdowns/notification-system", "Hello Interview — notifications", "M"],
          ]},
        { n: "Design News Feed / Instagram post",
          note: "Post write → store media S3 + metadata DB. Fan-out on write to follower inboxes (Redis) for normal users; fan-out on read for celebrities. Feed API merges inbox + ads. Ranking optional (ML later).",
          p: [
            ["GFG", "https://www.geeksforgeeks.org/system-design/design-twitter-a-system-design-interview-question/", "News feed / Twitter", "H"],
            ["HI", "https://www.hellointerview.com/learn/system-design/problem-breakdowns/fb-news-feed", "Hello Interview — news feed", "H"],
            ["HI", "https://www.hellointerview.com/learn/system-design/problem-breakdowns/instagram", "Hello Interview — Instagram", "H"],
          ]},
        { n: "Design Ad Click Aggregator",
          note: "Clicks are firehose. Client → ingest (HTTP/Kafka) → stream aggregate by (ad, time bucket) → OLAP (ClickHouse) for dashboards. Dedup by event_id. Exact billing via nightly batch; approximate live via HLL/counters.",
          p: [
            ["GFG", "https://www.geeksforgeeks.org/system-design/design-an-ad-click-aggregator/", "Ad click aggregator", "H"],
            ["HI", "https://www.hellointerview.com/learn/system-design/problem-breakdowns/ad-click-aggregator", "Hello Interview — ad click aggregator", "H"],
            ["DG", "https://www.designgurus.io/course-play/grokking-the-system-design-interview/doc/ad-click-event-aggregation", "Design Gurus — ad clicks", "H"],
          ]},
      ]},
    { n: "Also practice",
      c: [
        { n: "Search autocomplete",
          note: "Trie / ES edge-ngrams, cache top queries, personalize lightly. Offline job builds suggestions from logs.",
          p: [
            ["GFG", "https://www.geeksforgeeks.org/system-design/design-autocomplete-or-query-suggestion-service/", "Autocomplete", "M"],
            [642, "design-search-autocomplete-system", "LC Design Search Autocomplete", "H"],
          ]},
        { n: "Design YouTube",
          note: "Upload → transcode ladder → CDN. Metadata DB. Watch: signed CDN URL. Comments/likes separate. Recommendations = offline jobs.",
          p: [
            ["GFG", "https://www.geeksforgeeks.org/system-design/design-youtube-a-system-design-interview-question/", "Design YouTube", "H"],
            ["HI", "https://www.hellointerview.com/learn/system-design/problem-breakdowns/youtube", "Hello Interview — YouTube", "H"],
            ["HI", "https://www.hellointerview.com/learn/system-design/problem-breakdowns/top-k", "Hello Interview — YouTube Top K", "H"],
          ]},
        { n: "Top-K YouTube videos",
          note: "Count views in stream (windowed), maintain heap / Count-Sketch per window, roll up to hourly tables. Don't SELECT ORDER BY views on raw events.",
          p: [
            ["GFG", "https://www.geeksforgeeks.org/system-design/design-a-top-k-heavy-hitter-system/", "Top-K / heavy hitters", "H"],
            ["HI", "https://www.hellointerview.com/learn/system-design/problem-breakdowns/top-k", "Hello Interview — YouTube Top K", "H"],
            ["GFG", "https://www.geeksforgeeks.org/system-design/design-youtube-a-system-design-interview-question/", "YouTube (view counting)", "H"],
          ]},
      ]},
  ]},
];
