/* ai-design-data.js, three AI systems grown stage by stage, the same
   pattern and rigor as design-data.js: a stage may only add a box if it can
   name the pressure that broke the previous stage, and every box carries its
   own reasoning (alts, pros, cons, cost, fails). See docs/CONTENT-GUIDE.md,
   "Adding a Design Lab project", and the schema comment at the top of
   data/design-data.js for the full shape including `hi`, the Hinglish mirror
   shown by ai-design.html's reading-language switch.

   Validate with `node tools/check-ai.js`, not `node tools/check.js`, which
   only looks at the DSA design data.
*/

const DESIGN = [

{
  id: "rag-pipeline", kind: "hld", n: "RAG pipeline", sub: "Question answering over your own documents",
  tags: ["retrieval before generation", "ingestion vs query", "the reranker fixes recall's mess"],
  one: "Every decision here falls out of one split you can state in the first minute: retrieval happens before generation, and the two halves of the pipeline, ingesting documents and answering questions, never share a request. State that, and the rest of the round is you explaining why a cache, a queue and a reranker each earn their place.",

  brief: {
    why: "This problem looks like it is entirely about the vector database, and it is not. The failure mode is drawing one box labelled <b>embeddings</b> and calling the design finished. The other failure mode is skipping retrieval quality altogether and trusting the model's own knowledge to fill the gap this system exists to close. Both are avoidable by separating two things people conflate: making a document findable, which is ingestion, and answering a question about it, which is querying. Be honest early about what fast, cheap retrieval gets wrong, before claiming a reranker fixes it.",
    functional: [
      "<b>Ingest a document.</b> Chunk it, embed each chunk, and store the chunks with their vectors. Re-ingesting a changed document touches only that document.",
      "<b>Answer a question.</b> Embed the question, retrieve candidate chunks, rerank them, and generate an answer grounded in the top few. If the corpus has no answer, say so.",
      "<b>Show sources.</b> Whoever asks a question can see which chunks the answer actually used, not merely which ones were retrieved before reranking discarded them."
    ],
    out: ["fine-tuning a model on the documents", "multi-turn conversational memory, a separate concept page", "OCR of scanned documents", "editing a chunk once it is stored, only re-ingesting the whole document", "answering a question the corpus has no coverage for, declining gracefully is enough"],
    nfr: [
      ["Answer latency", "p95 under 3 seconds end to end", "A question chains four calls: embed, retrieve, rerank, generate. Each one gets a slice of a shared budget, not an unconstrained clock."],
      ["Ingestion durability", "a chunk is never lost between chunking and storage", "A document is a promise that its content is findable. Losing a chunk mid pipeline means part of it silently stops answering questions."],
      ["Retrieval freshness", "a re-ingested document is searchable within minutes, not the next nightly run", "Incremental re-ingestion only pays off if it is fast. A correction that takes a day to appear is barely a correction."],
      ["Bulk ingest isolation", "a 50,000 document upload does not raise question latency", "Ingestion and querying share infrastructure below the gateway. A queue exists specifically so one does not steal capacity from the other."],
      ["Answer groundedness", "every cited source was actually read by the model, not merely retrieved", "A source list that includes a chunk the model never saw looks like evidence and is not."]
    ],
    numbers: [
      ["Source documents", "500,000, re-ingested incrementally", "Given as the corpus size. Incremental means a changed document re-embeds only itself, not the other 499,999."],
      ["Chunks per document", "6 to 10, a few hundred tokens each", "Given. A short FAQ lands near 6, a long policy document nearer 10."],
      ["Total chunks", "about 4 million", "500,000 documents times roughly 8 chunks each, the midpoint of the given range."],
      ["Questions per day", "5,000, bursty around business hours", "Given. Spread evenly this is nothing, which is the point: the pressure is latency per question, not throughput."],
      ["Peak concurrency", "a few dozen questions in flight at once", "During a business hours burst, with each question occupying the pipeline for up to 3 seconds, concurrency matters more than the daily total."],
      ["Answer latency", "p95 under 3 seconds end to end", "Given. Split across embed, retrieve, rerank and generate, each hop gets well under a second of budget."],
      ["Embedding dimension", "1536", "Given. At 4 million chunks in float32 that alone is roughly 25 GB of vectors."],
      ["Bulk upload burst", "50,000 documents at once", "Given. At 8 chunks each that is about 400,000 chunks landing on the queue in one afternoon."]
    ],
    numbersNote: "Two of these carry the design. <b>4 million chunks</b> says an approximate index, not a scan. And notice the odd one out: <b>5,000 questions a day</b> is nothing for a database to serve, it is the four chained model calls behind each one that make latency the actual constraint."
  },

  stagesIntro: "Six stages. Stage 0 is the version that genuinely answers a question, for about a day. Every stage after it exists because one specific thing broke, and the box that arrives is the cheapest repair for that specific thing. If you can name the pressure, you have earned the box. If you cannot, take it off the whiteboard.",

  stages: [
    { t: "0. One script, brute-force",
      pressure: "Nothing has gone wrong yet, and that is the point. The most convincing way to justify every later box is watching this one fail first, not drawing all eleven boxes on the first pass.",
      nodes: [
        { id: "client", l: "Client", col: 0, row: 0, r: "client" },
        { id: "svc-query", l: "Query service", s: "answers a question", col: 2, row: 0, r: "svc" },
        { id: "ext", l: "Model APIs", s: "embed, rerank, generate", col: 5, row: 1, r: "ext" }
      ],
      edges: [
        { a: "client", b: "svc-query" },
        { a: "svc-query", b: "ext", l: "answer", async: false }
      ],
      add: ["client", "svc-query", "ext"],
      say: "Let me start with the smallest thing that answers a question, then break it. A handful of documents in a list, one model call to compare the question against all of them, one more call to write the answer. Everything I add from here has to justify itself against this.",
      breaks: "It works for a few hundred short documents held in a Python list. Scanning every one of them for every question is fine at that size, and it stops being fine long before this is a real knowledge base. Nothing survives a restart either." },

    { t: "1. Give it a real index",
      pressure: "Brute force scan cost grows with every document you add, and there is still no separate path for adding new documents at all.",
      nodes: [
        { id: "client", l: "Client", col: 0, row: 0, r: "client" },
        { id: "svc-query", l: "Query service", s: "answers a question", col: 2, row: 0, r: "svc" },
        { id: "vector-store", l: "Vector store", s: "chunks + embeddings", col: 4, row: 0, r: "store" },
        { id: "ext", l: "Model APIs", s: "embed, rerank, generate", col: 5, row: 1, r: "ext" }
      ],
      edges: [
        { a: "client", b: "svc-query" },
        { a: "svc-query", b: "vector-store", l: "search" },
        { a: "vector-store", b: "ext", l: "generate" }
      ],
      add: ["vector-store"],
      say: "An approximate nearest neighbor index replaces the linear scan. It handles tens of thousands of chunks inside one process without the question path slowing down as the corpus grows. Ingestion and querying are still one process, so a slow embedding job can still block a live question.",
      breaks: "The index handles tens of thousands of chunks in one process just fine. It still restarts with the service, and re-embedding the whole corpus after a crash costs real time and real API calls." },

    { t: "2. Split ingestion from querying",
      pressure: "Ingestion and querying were one process, so a bulk upload of new documents blocks live questions about documents that were already there.",
      nodes: [
        { id: "client", l: "Client", col: 0, row: 0, r: "client" },
        { id: "svc-query", l: "Query service", s: "answers a question", col: 2, row: 0, r: "svc" },
        { id: "svc-ingest", l: "Ingestion service", s: "chunks a document", col: 2, row: 1, r: "svc" },
        { id: "vector-store", l: "Vector store", s: "chunks + embeddings", col: 4, row: 0, r: "store" },
        { id: "work-embed", l: "Embedding workers", s: "batch embed chunks", col: 4, row: 1, r: "work" },
        { id: "ext", l: "Model APIs", s: "embed, rerank, generate", col: 5, row: 1, r: "ext" }
      ],
      edges: [
        { a: "client", b: "svc-query" },
        { a: "svc-query", b: "vector-store", l: "search" },
        { a: "vector-store", b: "ext", l: "generate" },
        { a: "client", b: "svc-ingest" },
        { a: "svc-ingest", b: "work-embed", l: "chunk" },
        { a: "work-embed", b: "vector-store", l: "write" },
        { a: "work-embed", b: "ext", l: "embed" }
      ],
      add: ["svc-ingest", "work-embed"],
      say: "Two services now: one answers questions, one chunks documents, and a pool of embedding workers sits behind ingestion. Embedding is slow and poolable, so it should never sit inline in a request a person is waiting on.",
      breaks: "The two paths scale independently now, but every question still pays for a full retrieval round trip even when it is a repeat. A burst of uploads has nowhere to queue, it just piles onto ingestion directly." },

    { t: "3. Put a gateway in front",
      pressure: "This is a public API now, for asking questions and for uploading documents, and neither auth nor rate limiting exists yet. One abusive client can starve everyone else.",
      nodes: [
        { id: "client", l: "Client", col: 0, row: 0, r: "client" },
        { id: "edge", l: "API gateway", s: "auth, rate limits", col: 1, row: 0, r: "edge" },
        { id: "svc-query", l: "Query service", s: "answers a question", col: 2, row: 0, r: "svc" },
        { id: "svc-ingest", l: "Ingestion service", s: "chunks a document", col: 2, row: 1, r: "svc" },
        { id: "vector-store", l: "Vector store", s: "chunks + embeddings", col: 4, row: 0, r: "store" },
        { id: "work-embed", l: "Embedding workers", s: "batch embed chunks", col: 4, row: 1, r: "work" },
        { id: "ext", l: "Model APIs", s: "embed, rerank, generate", col: 5, row: 1, r: "ext" }
      ],
      edges: [
        { a: "client", b: "edge" },
        { a: "edge", b: "svc-query" },
        { a: "edge", b: "svc-ingest", bend: 0.35 },
        { a: "svc-query", b: "vector-store", l: "search" },
        { a: "vector-store", b: "ext", l: "generate" },
        { a: "svc-ingest", b: "work-embed", l: "chunk" },
        { a: "work-embed", b: "vector-store", l: "write" },
        { a: "work-embed", b: "ext", l: "embed" }
      ],
      add: ["edge"],
      say: "A gateway in front of both services. It terminates the public surface, checks who is calling, and applies rate limits before either service does real work. I would put this box in front of almost any public API, not just this one.",
      breaks: "Traffic is authenticated and shaped now, but nothing is cached and nothing is queued. A popular repeated question and a burst of uploads still hit the same pressure they always did." },

    { t: "4. Cache repeats, queue bursts",
      pressure: "The same question gets asked many times a day, and recomputing the full retrieval plus generation pipeline for an identical question is pure waste. A 50,000 document bulk upload was hammering the embedding workers directly with no backpressure.",
      nodes: [
        { id: "client", l: "Client", col: 0, row: 0, r: "client" },
        { id: "edge", l: "API gateway", s: "auth, rate limits", col: 1, row: 0, r: "edge" },
        { id: "svc-query", l: "Query service", s: "answers a question", col: 2, row: 0, r: "svc" },
        { id: "svc-ingest", l: "Ingestion service", s: "chunks a document", col: 2, row: 1, r: "svc" },
        { id: "cache", l: "Response cache", s: "exact-match questions", col: 3, row: 0, r: "cache" },
        { id: "queue", l: "Ingestion queue", s: "absorbs bulk uploads", col: 3, row: 1, r: "queue" },
        { id: "vector-store", l: "Vector store", s: "chunks + embeddings", col: 4, row: 0, r: "store" },
        { id: "work-embed", l: "Embedding workers", s: "batch embed chunks", col: 4, row: 1, r: "work" },
        { id: "ext", l: "Model APIs", s: "embed, rerank, generate", col: 5, row: 1, r: "ext" }
      ],
      edges: [
        { a: "client", b: "edge" },
        { a: "edge", b: "svc-query" },
        { a: "edge", b: "svc-ingest", bend: 0.35 },
        { a: "svc-query", b: "cache", l: "check" },
        { a: "cache", b: "vector-store", l: "miss" },
        { a: "vector-store", b: "ext", l: "generate" },
        { a: "svc-ingest", b: "queue" },
        { a: "queue", b: "work-embed" },
        { a: "work-embed", b: "vector-store", l: "write" },
        { a: "work-embed", b: "ext", l: "embed" }
      ],
      add: ["cache", "queue"],
      say: "A response cache in front of the expensive path, and a queue in front of the embedding workers. The cache turns a repeat question into a lookup. The queue turns a 50,000 document spike into a backlog that drains instead of a stampede that falls over.",
      breaks: "Latency and cost are under control for the common case, but recall is still noisy. The top-k vector hits sometimes include an off topic chunk that visibly drags the answer down." },

    { t: "5. Rerank, and log for evaluation",
      pressure: "Fast, cheap retrieval was not the same thing as accurate retrieval. A chunking or embedding model change once silently made answers worse for two weeks before anyone noticed.",
      nodes: [
        { id: "client", l: "Client", col: 0, row: 0, r: "client" },
        { id: "edge", l: "API gateway", s: "auth, rate limits", col: 1, row: 0, r: "edge" },
        { id: "svc-query", l: "Query service", s: "answers a question", col: 2, row: 0, r: "svc" },
        { id: "svc-ingest", l: "Ingestion service", s: "chunks a document", col: 2, row: 1, r: "svc" },
        { id: "cache", l: "Response cache", s: "exact-match questions", col: 3, row: 0, r: "cache" },
        { id: "queue", l: "Ingestion queue", s: "absorbs bulk uploads", col: 3, row: 1, r: "queue" },
        { id: "vector-store", l: "Vector store", s: "chunks + embeddings", col: 4, row: 0, r: "store" },
        { id: "work-embed", l: "Embedding workers", s: "batch embed chunks", col: 4, row: 1, r: "work" },
        { id: "reranker", l: "Reranker", s: "cross-encoder rescoring", col: 5, row: 0, r: "work" },
        { id: "ext", l: "Model APIs", s: "embed, rerank, generate", col: 5, row: 1, r: "ext" },
        { id: "eval-store", l: "Eval log", s: "scored answers", col: 6, row: 0, r: "store" }
      ],
      edges: [
        { a: "client", b: "edge" },
        { a: "edge", b: "svc-query" },
        { a: "edge", b: "svc-ingest", bend: 0.35 },
        { a: "svc-query", b: "cache", l: "check" },
        { a: "cache", b: "vector-store", l: "miss" },
        { a: "vector-store", b: "reranker", l: "top-k" },
        { a: "reranker", b: "ext", l: "score" },
        { a: "ext", b: "eval-store", l: "log" },
        { a: "svc-ingest", b: "queue" },
        { a: "queue", b: "work-embed" },
        { a: "work-embed", b: "vector-store", l: "write" },
        { a: "work-embed", b: "ext", l: "embed" }
      ],
      add: ["reranker", "eval-store"],
      say: "A reranker narrows the vector store's top candidates down to the few that actually earn a place in the prompt. An eval log records what each question retrieved, kept and answered. Retrieval quality is now something you can measure instead of something you assume." }
  ],

  boxesIntro: "Eleven components. For each one: the pressure that created it, what lost the argument, what you pay, and how it fails at three in the morning. If you can only remember one column, remember the last one. Naming your own failure modes is the fastest way to sound like someone who has run a RAG pipeline rather than read about one.",

  boxes: [
    { id: "client", n: "Client", r: "client",
      job: "Asks a question, or uploads a document, and waits for an answer or a receipt.",
      why: "It is on the diagram because two very different requests start here: a question that wants an answer in seconds, and a document that only wants a receipt.",
      forced: "Nothing forced it. It earns its place because the question and upload paths diverge immediately, and that split is most of this design.",
      alts: [["Leaving upload and question on one endpoint", "hides the fact that they have different latency budgets and different failure tolerance, which is the first thing worth saying out loud."]],
      pros: ["A single client can both populate the corpus and query it, so an internal tool needs only one integration.", "Whatever the client is, browser, CLI, another service, it never needs to know ingestion and querying live on different machines."],
      cons: ["A slow question and a slow bulk upload look identical from here, so the client cannot tell which kind of slow it is hitting.", "Nothing on this side of the gateway checks whether the caller is allowed to ask, which is why the gateway has to."],
      cost: "Zero infrastructure, same as any client box. The decision that matters is entirely on the other side of the wire.",
      fails: "A client retries a timed out question against an already slow reranker, doubling load on the one box in the pipeline with no spare capacity.",
      say: "I draw the client because the question path and the ingestion path split here, before either one has done any work. That split is most of the interesting design." },

    { id: "edge", n: "API gateway", r: "edge",
      job: "Authenticates the caller, applies rate limits, and routes to the query service or the ingestion service.",
      why: "Once this is a public API for both asking questions and uploading documents, something has to stop one caller from starving everyone else.",
      forced: "Stage 3, when questions and uploads both became reachable from outside, with no auth and no rate limiting at all.",
      alts: [["A shared library each service imports", "duplicates auth and rate limit logic in two services instead of one, and the two copies drift the first time either one is patched."], ["Auth inside each service directly", "workable at one service, and a maintenance trap once ingestion and querying are separate deployables with separate release schedules."]],
      pros: ["One place to change a rate limit or rotate a key, instead of two.", "Terminates the public surface, so neither service behind it has to think about a hostile caller."],
      cons: ["It is now in the path of every request, question and upload alike, so its own latency and uptime matter to both.", "A bad rate limit rule can throttle a legitimate bulk upload as hard as it throttles an attacker."],
      cost: "A managed gateway is cheap. The real cost is getting the rate limit shape right: per caller, not just global.",
      fails: "A single API key uploads 50,000 documents in one burst, and a shared per second limit starts rejecting normal question traffic at the same time.",
      say: "Auth and rate limits belong here, not in the services, because a public RAG API gets hit by scrapers and honest bulk uploads. I want one place that tells them apart." },

    { id: "svc-query", n: "Query service", r: "svc",
      job: "Turn a question into a grounded answer: embed it, retrieve, rerank, generate, and return the sources used.",
      why: "The question path has the tightest latency target in the system and the most external calls chained together, so it earns its own deployable.",
      forced: "Stage 2, when ingestion and querying still shared one process and a bulk upload was blocking live questions.",
      alts: [["One service for both ingest and query", "simple to run, and it means a slow embedding batch job can starve the request a person is actually waiting on."]],
      pros: ["Scales and deploys on its own schedule, so a risky ingestion change cannot take questions down with it.", "Its whole job is a short chain: embed, search, rerank, generate. That is easy to reason about."],
      cons: ["Every answer depends on a chain of calls to other services and external model APIs, so its latency is the sum of everyone else's.", "It has no state of its own, so a bug in the chain is invisible to it until a downstream call fails or times out."],
      cost: "A few hundred milliseconds of orchestration per question, plus whatever embed, retrieve, rerank and generate cost. At 5,000 questions a day this is a handful of small machines.",
      fails: "The reranker gets slow under load and the query service waits with no timeout. A burst of business hour questions queues behind that one stuck call.",
      say: "Stateless, one job, hard timeouts on every downstream call, because a chain of four external calls needs a budget for each link, not just for the whole chain." },

    { id: "svc-ingest", n: "Ingestion service", r: "svc",
      job: "Take a document, split it into chunks, and hand the chunks off to be embedded and stored.",
      why: "Chunking is cheap and deterministic, so it can happen inline, while embedding is slow and worth pooling separately.",
      forced: "Stage 2, alongside svc-query, once the two paths needed to scale and fail independently.",
      alts: [["Chunking inside the embedding worker", "couples a cheap, fast step to a slow, poolable one, and makes it harder to reprocess a document with a new chunking strategy without re-embedding everything."]],
      pros: ["Its incidents cannot reach the question path, since the two are separate deployables behind the gateway.", "Chunking logic, sentence boundaries, overlap size, table handling, ships independently of anything on the query side."],
      cons: ["A bulk upload still has to land somewhere before embedding catches up, and this service alone has nowhere to put the backlog.", "It has to track which chunks belong to which document version, or a re-ingested document leaves stale chunks behind."],
      cost: "Chunking 500,000 documents at 6 to 10 chunks each is a CPU bound pass, minutes of work, cheap next to the embedding it feeds.",
      fails: "A document is re-ingested after an edit, the old chunks are never deleted, and the vector store answers a question by quoting a sentence removed months ago.",
      say: "Chunking is boring on purpose: fixed size with overlap, split on sentence boundaries where I can. The interesting failure is stale chunks outliving the document they came from, not chunking strategy." },

    { id: "cache", n: "Response cache", r: "cache",
      job: "Answer an exact repeat question straight from a stored answer, skipping retrieval, reranking and generation entirely.",
      why: "Business hours traffic repeats: the same handful of questions get asked many times a day, and recomputing an identical answer is pure waste.",
      forced: "Stage 4. Nothing was cached before this, so a popular question paid the full three second pipeline every single time.",
      alts: [["Caching the retrieved chunks, not the answer", "saves retrieval and rerank cost and still pays for generation, the most expensive step. Worth doing as a second tier, not instead of this one."], ["Semantic caching on near duplicate questions", "catches more repeats, and it introduces its own retrieval problem. Deciding two questions are close enough to share an answer is the hard part this system exists to do."]],
      pros: ["A cache hit skips four chained calls, including the two that cost real money, embedding and generation.", "It is the cheapest way to protect the reranker and the model APIs from a popular question."],
      cons: ["Exact match only, so a question asked two different ways pays full price twice, which is most real traffic.", "An answer can go stale if the source document changes and nothing tells the cache to forget it."],
      cost: "A modest key value store, a handful of gigabytes, since only the literal question text is the key. Cheap compared to what it saves.",
      fails: "A source document is corrected, the cache is never invalidated, and the system confidently repeats the old, wrong answer to everyone who asks that question next.",
      say: "Keyed on exact question text, short TTL rather than event driven invalidation. I would rather serve a slightly stale answer for an hour than wire every document edit to every cached question." },

    { id: "queue", n: "Ingestion queue", r: "queue",
      job: "Hold newly chunked documents until an embedding worker is free, so a burst does not overwhelm the workers directly.",
      why: "A bulk upload of 50,000 documents produces hundreds of thousands of chunks at once, far more than the embedding workers can take in one go.",
      forced: "Stage 4. Before this, a burst of uploads hit the embedding workers directly with no backpressure at all.",
      alts: [["svc-ingest calling embedding workers directly", "fine at low volume, and the exact thing that breaks the moment someone drops 50,000 documents on the system in one afternoon."], ["An in memory queue inside svc-ingest", "loses everything not yet processed the moment the process restarts, which a real ingestion pipeline cannot accept."]],
      pros: ["Absorbs a burst of any size without svc-ingest or the workers needing to know how big it was.", "Workers pull at their own pace, so a slow embedding model does not become a rejected upload."],
      cons: ["Adds lag between upload and searchable: a document sits in queue before it becomes findable.", "It is one more system with its own retention, monitoring and failure modes to own."],
      cost: "About 400,000 messages for a 50,000 document burst, a few hundred bytes each. Well under a gigabyte, and gone once consumed.",
      fails: "An embedding worker crashes mid batch, the message is never acknowledged, and it silently replays hours later, re-embedding chunks that were already stored.",
      say: "A durable queue between ingestion and embedding, because the moment I saw the 50,000 document burst number I knew svc-ingest could never hold that much state in memory." },

    { id: "vector-store", n: "Vector store", r: "store",
      job: "Hold every chunk's text, metadata and embedding, and answer a nearest neighbor search over them.",
      why: "Once the corpus is bigger than one process can scan per question, something has to index the embeddings so a search does not compare against all of them.",
      forced: "Stage 1, the moment brute force scanning over an in memory list stopped being fast enough.",
      alts: [["A brute force scan over all embeddings", "exact, and fine at a few hundred documents. At 4 million chunks it means comparing a question against every single one, every time."], ["Vectors inside the same relational database as everything else", "workable with a decent vector extension, and most do not scale an approximate index as well as a dedicated store at this chunk count."]],
      pros: ["An approximate nearest neighbor index turns a linear scan into a search that stays fast as the corpus grows.", "It is the one place the query path and the ingestion path agree on what is true right now."],
      cons: ["Approximate means it can miss the actual best match, which is exactly the noisy recall the reranker exists to clean up.", "Rebuilding or compacting the index after heavy writes is real work and can briefly slow searches."],
      cost: "About 4 million chunks at 1536 dimensions in float32 is roughly 25 GB of vectors, plus a few gigabytes of text and metadata. One well sized node, comfortably.",
      fails: "A burst of re-ingestion writes lands while the index is compacting, and searches slow down. The on call engineer spends an hour blaming the reranker before finding the real cause.",
      say: "An approximate index, not exact search, because at 4 million chunks the gap between exact and approximate is milliseconds the reranker will make back anyway." },

    { id: "work-embed", n: "Embedding workers", r: "work",
      job: "Pull chunks off the queue, batch them, call the embedding model, and write vectors into the store.",
      why: "Embedding is a slow, external, poolable unit of work. It should never sit inline in a request a person is waiting on.",
      forced: "Stage 2, when embedding was still happening inside the ingestion request path itself.",
      alts: [["Embedding one chunk per API call as it is chunked", "simplest to write, and far slower and more expensive than batching, since most embedding APIs charge and perform better per batch."], ["Embedding inside svc-ingest synchronously", "blocks the upload response on a network call to an external model API, the opposite of what a receipt only upload should do."]],
      pros: ["Batches many chunks into one embedding call, cheaper and faster per chunk than calling one at a time.", "Scales independently: a bulk upload just means more messages in the queue, not more load on svc-ingest."],
      cons: ["A batch failure has to be handled per chunk, or one bad chunk in a batch of a hundred fails all hundred.", "It adds a real delay between a document landing and it becoming searchable, which the freshness requirement has to account for."],
      cost: "Embedding 400,000 chunks from a 50,000 document burst, batched at a few hundred chunks per call, is minutes of wall clock time across a small pool of workers.",
      fails: "A single malformed chunk, an empty string from a stripped table, poisons a whole batch call, and every other chunk in that batch is dropped along with it.",
      say: "Batch size is a real knob here: bigger batches are cheaper per chunk and slower to fail safe, since one bad chunk can cost you the whole batch." },

    { id: "reranker", n: "Reranker", r: "work",
      job: "Take the vector store's top candidates and rescore them with a heavier model that reads the question and each chunk together.",
      why: "A fast approximate search sometimes returns a chunk that is near in vector space and wrong in meaning, and only a model reading both texts together can tell.",
      forced: "Stage 5. Fast, cheap retrieval was silently not the same thing as accurate retrieval, and nobody noticed for two weeks.",
      alts: [["Trusting the vector store's top-k order directly", "cheaper and faster, and exactly the setup that let a bad chunk sit in position two and drag an answer down without anyone noticing."], ["A bigger, better embedding model instead of a reranker", "helps recall generally, and it cannot use the actual question and chunk together the way a cross encoder does, so it still misses the same near misses."]],
      pros: ["A cross encoder scores the question against each candidate directly, catching relevance mistakes a vector distance cannot see.", "Only runs on a small top-k, so its extra cost is bounded no matter how big the corpus gets."],
      cons: ["It is an extra model call on the latency budget of every single question.", "It cannot fix a candidate set that never contained the right chunk in the first place."],
      cost: "Rescoring the top 20 candidates per question at 5,000 questions a day is 100,000 rerank calls a day, small next to the corpus but not free.",
      fails: "The embedding model is upgraded, retrieval quality quietly improves, and nobody notices the reranker was tuned against the old score distribution and now discards good matches.",
      say: "Retrieve wide, rerank narrow. Pull maybe 20 to 50 candidates cheaply, then spend the expensive model call narrowing them to the 3 or 4 that go in the prompt." },

    { id: "ext", n: "Model APIs", r: "ext",
      job: "Do the three things this system cannot do itself: embed text, score a question against a chunk, and generate an answer.",
      why: "Running your own embedding, reranking and generation models is a real option, and it is a second system to operate that most teams should not start with.",
      forced: "Stage 0. There was never a version of this design without a model somewhere in it.",
      alts: [["Self hosting the embedding and generation models", "removes a per token bill and a network hop, and means owning GPUs, model upgrades and capacity planning instead of a vendor's."]],
      pros: ["No infrastructure of your own to run for the actual language understanding.", "Improves without you doing anything, every time the provider ships a better model."],
      cons: ["Every answer now depends on a network call to someone else's service, with someone else's latency and someone else's outage schedule.", "Cost is per token, so a spike in question volume or document size is a spike in the bill, not just in load."],
      cost: "Three calls per question path, embed, rerank, generate, plus one per chunk on ingestion. At the given volumes this is dollars a day, but it is metered and it can surprise you.",
      fails: "The model provider has a slow degradation, not an outage, and every answer in the system gets quietly slower until the p95 latency alert fires an hour later.",
      say: "I would not build my own embedding or generation model for this. The build versus buy line sits at a scale this system is nowhere near." },

    { id: "eval-store", n: "Eval log", r: "store",
      job: "Record each question, the chunks it retrieved, the chunks it kept after reranking, and the answer generated, for later scoring.",
      why: "A chunking or embedding change can silently make answers worse, and the only way to catch that is to have yesterday's answers to compare against.",
      forced: "Stage 5, once nothing was left to fix in the request path itself and quality became the open problem.",
      alts: [["Logging only the final answer", "cheap, and it throws away exactly the information you need to tell whether a bad answer came from retrieval or from generation."], ["Sampling a fraction of questions instead of all of them", "reasonable at far higher volume than this. At 5,000 questions a day, logging everything costs almost nothing."]],
      pros: ["Lets you replay a question against a new chunking or embedding strategy and compare answers before shipping it.", "Turns a customer complaint about a bad answer into a debuggable trace instead of an anecdote."],
      cons: ["It is a second store to run that has nothing to do with answering questions, only with knowing whether you are answering them well.", "Storing every retrieved chunk for every question adds up, even though each row is small."],
      cost: "5,000 rows a day, each holding a question, a handful of chunk ids and an answer. Trivially cheap storage, the expensive part is someone actually looking at it.",
      fails: "A chunking change ships, and answer quality drops slowly enough that no single day looks wrong. It takes two weeks and a customer complaint before anyone checks the log.",
      say: "Log the retrieved set and the kept set separately, not just the final answer. The question I need answered later is whether retrieval or reranking is where an answer went wrong." }
  ],

  flowsIntro: "Draw the boxes, then narrate the paths out loud. This is the part interviewers actually score, because it is where hand waving becomes visible. For each step, know whether the caller is waiting.",

  flows: [
    { n: "Answering a question",
      note: "This is the path the 3 second target is written about. Only the reranker and the generator are allowed to be slow.",
      steps: [
        ["Client sends the question to the API gateway, which authenticates it and routes it to the query service.", "sync"],
        ["The query service checks the response cache for this exact question text.", "sync"],
        ["On a cache hit, the stored answer and its sources return immediately, and nothing downstream is touched.", "sync"],
        ["On a miss, it embeds the question and searches the vector store for the top candidates.", "sync"],
        ["The reranker rescores those candidates against the question and keeps the few that actually belong in the prompt.", "sync"],
        ["The model API generates an answer grounded in the kept chunks, and the response returns with the sources it used.", "sync"],
        ["The question, the retrieved set, the kept set and the answer are written to the eval log, without the client waiting on it.", "async"]
      ] },
    { n: "Ingesting a document",
      note: "A small share of the traffic by request count, and most of the moving parts, since a document is not searchable until every chunk has a vector.",
      steps: [
        ["Client sends the document to the gateway, which routes it to the ingestion service.", "sync"],
        ["The ingestion service chunks the document into a handful of a few hundred token pieces and returns a receipt.", "sync"],
        ["Each chunk is placed on the ingestion queue, off the request path entirely.", "async"],
        ["An embedding worker pulls a batch of chunks, calls the model API once for the whole batch, and gets back a vector per chunk.", "async"],
        ["The worker writes each chunk's text, metadata and vector into the vector store, where it becomes searchable for the first time.", "async"]
      ] },
    { n: "A 50,000 document bulk upload",
      note: "The same path as a single document, at a size that would have broken every earlier stage of this design.",
      steps: [
        ["50,000 documents arrive at the gateway in a short window and are rate limited per caller, not rejected outright.", "sync"],
        ["The ingestion service chunks each one as it arrives, producing roughly 400,000 chunks in total.", "sync"],
        ["Every chunk lands on the queue, which absorbs the entire burst without the embedding workers seeing a spike.", "async"],
        ["Workers drain the queue at their own sustainable pace, batching chunks into embedding calls until the backlog is gone.", "async"],
        ["Live questions keep hitting the cache and the vector store the entire time, because the burst never touches the question path.", "sync"]
      ] }
  ],

  api: [
    ["POST /v1/documents", "202 {document_id}", "Returns a receipt, not a completed ingest. The body only proves the document was accepted and chunking has started."],
    ["POST /v1/questions", "200 {answer, sources}", "Body carries the question and an optional filter. Sources list the chunk ids the model actually saw, not merely the ones retrieved."],
    ["GET /v1/documents/{id}/status", "200 {state}", "Lets a caller check whether a document is chunked, embedded and searchable, since ingestion is asynchronous from stage 4 onward."],
    ["DELETE /v1/documents/{id}", "204", "Deletes the document's chunks from the vector store. A re-ingested version must not leave old chunks searchable alongside the new ones."]
  ],
  apiNote: "Two details worth saying out loud: ingestion returns 202, not 200, because chunking and embedding finish later, and delete has to reach the vector store, not just the source record, or an old chunk keeps answering questions after its document is gone.",

  schema: { n: "The two tables that matter", lang: "text",
    note: "A document row and a chunk row. The embedding lives next to the chunk, not the document, since a document has many chunks and a question never asks about a whole document at once.",
    code:
"documents\n" +
"  doc_id       uuid         PRIMARY KEY\n" +
"  source_uri   text         NOT NULL      where it came from\n" +
"  version      int          NOT NULL      bumped on re-ingest\n" +
"  status       text         NOT NULL      chunking, embedding, ready\n" +
"  updated_at   timestamptz  NOT NULL\n" +
"\n" +
"chunks                (in the vector store, not here)\n" +
"  chunk_id     uuid         PRIMARY KEY\n" +
"  doc_id       uuid         \\  every chunk knows its document\n" +
"  doc_version  int          /  and its version, for cleanup\n" +
"  text         text                     a few hundred tokens\n" +
"  embedding    float32[1536]            from the embedding model\n" +
"\n" +
"  index: approximate nearest neighbor on embedding\n" +
"  cleanup: a chunk whose doc_version is behind the document's\n" +
"           current version is dead and safe to delete" },

  deep: [
    { n: "Why chunk size is a retrieval decision, not a formatting one",
      note: "A chunk that is too big buries the answer in surrounding text the embedding has to compress into one vector. A chunk that is too small loses the context that would have made it unambiguous. Six to ten chunks per document, a few hundred tokens each, is a starting point, not a law: a contract full of numbered clauses wants small, precise chunks, a narrative document wants bigger ones with real overlap.<br><br>Overlap between adjacent chunks matters more than the exact size. Without it, an answer that spans a sentence broken across two chunks is invisible to both. The standard fix slides the chunk boundary back by 10 to 20 percent of the chunk size, so the last sentence of one chunk is the first sentence of the next.",
      code:
"chunk_size = 300 tokens, overlap = 50 tokens\n" +
"\n" +
"doc split into chunks:\n" +
"    [0:300], [250:550], [500:800], ...\n" +
"    each boundary moves by (chunk_size - overlap)\n" +
"\n" +
"a sentence spanning tokens 290-310 appears whole\n" +
"    in chunk 2 [250:550], even though chunk 1 cut it off" },

    { n: "Why retrieval alone is not enough, and what reranking fixes",
      note: "A vector search finds chunks whose embeddings sit close to the question's embedding, and close in that space is a proxy for related, not a guarantee of relevant. A chunk that shares vocabulary with the question can outrank the chunk that actually answers it.<br><br>A cross encoder reranker reads the question and one candidate chunk together, in the same forward pass, instead of comparing two embeddings computed separately. That catches a mismatch a vector distance cannot see. It is too slow to run over the whole corpus, which is exactly why it only ever sees the top-k the vector store already narrowed down.",
      code:
"retrieve: top 50 by cosine similarity, question vs each chunk\n" +
"          (two embeddings, compared after the fact)\n" +
"\n" +
"rerank:   score(question, chunk) for each of the 50\n" +
"          (one model call reads both texts together)\n" +
"          keep top 4, in score order\n" +
"\n" +
"cost shape: retrieval is O(index size), cheap per candidate\n" +
"            reranking is O(k), expensive per candidate, k stays small" },

    { n: "Incremental re-ingestion, and why a nightly rebuild does not fit",
      note: "500,000 documents, chunked into a few million pieces, cost real minutes and real embedding API calls to fully reprocess. A nightly full rebuild pays that cost every night, whether or not more than a handful of documents actually changed.<br><br>Incremental ingestion keys each chunk on its document id and version instead. A re-ingested document bumps the version, its old chunks are marked for deletion, and only its own text gets re-chunked and re-embedded. A vector store that has never heard of a document is unaffected, and a bulk upload of 50,000 new documents costs exactly the work those documents need, no more.",
      code:
"on re-ingest of doc D:\n" +
"    new_version = D.version + 1\n" +
"    chunk and embed D's current text only\n" +
"    write new chunks tagged (D.id, new_version)\n" +
"    mark chunks where doc_id = D.id and doc_version < new_version\n" +
"        for deletion, not deleted inline\n" +
"\n" +
"a cleanup pass removes stale chunks off the request path,\n" +
"so a slow delete never blocks an upload's receipt" }
  ],

  tradeoffsIntro: "Say the pair, pick a side, then say what would change your mind. The last part is what separates an opinion from a preference.",

  tradeoffs: [
    { a: ["Cache aside, exact match", "A repeat question skips retrieval, reranking and generation entirely, at the cost of matching only identical text."],
      b: ["Semantic caching on question similarity", "Catches more repeats phrased differently, by embedding the question and matching near neighbors, at the cost of occasionally answering a slightly different question with a cached answer."],
      pick: "a",
      flip: "the same intents get phrased many different ways and the exact match hit rate stays low. Then a semantic cache earns the extra complexity, with a conservatively tuned threshold." },
    { a: ["Retrieve wide, then rerank narrow", "A cheap vector search pulls dozens of candidates, an expensive cross encoder narrows them to a few before generation."],
      b: ["Skip reranking, trust the vector store's order", "One fewer model call and lower latency per question, at the cost of the noisy near misses a vector distance cannot tell apart from the real answer."],
      pick: "a",
      flip: "the corpus is small and homogeneous enough that vector similarity and true relevance rarely disagree. Then reranking spends a model call fixing a problem that barely exists." },
    { a: ["A pooled embedding worker, batched off a queue", "Embedding is slow and poolable, so it happens asynchronously in batches sized for cost and throughput."],
      b: ["Embedding inline inside the ingestion request", "Simpler, no queue to run, and it means the upload response waits on an external model API call, turning document upload into a slow endpoint for no reason."],
      pick: "a",
      flip: "ingestion volume is so low that a queue and a worker pool are pure overhead. Then embedding inline is honestly simpler, right up until the first bulk upload." },
    { a: ["Log the retrieved set and the kept set separately", "Lets you tell whether a bad answer came from retrieval missing the right chunk or reranking discarding it."],
      b: ["Log only the final question and answer", "Cheaper to store and query, and it throws away exactly the information you need to debug why an answer was wrong."],
      pick: "a",
      flip: "storage or write volume on the eval log becomes a real cost at a much higher question rate than this system sees. Then sampling a fraction of questions is the honest compromise." }
  ],

  next: [
    "<b>Better chunking.</b> Structure aware splitting, respecting headings, tables and code blocks, instead of a fixed token window, is the highest leverage change left on quality.",
    "<b>A feedback signal.</b> A thumbs up or down on an answer, tied back to the chunks the eval log recorded, turns quality from a guess into a metric you can track.",
    "<b>A second index for structured filters.</b> Filtering by document owner, date or tag before the vector search runs, instead of after, keeps a narrow question fast as the corpus grows.",
    "<b>Semantic caching.</b> Once exact match caching is proven, matching near duplicate questions is the next latency and cost win, if the similarity threshold is tuned carefully."
  ],

  p: [
    ["SRC", "https://arxiv.org/abs/2005.11401", "The original RAG paper", "H"],
    ["SRC", "https://python.langchain.com/", "LangChain docs, retrieval and RAG", "E"],
    ["SRC", "https://docs.llamaindex.ai/", "LlamaIndex docs, ingestion and query pipelines", "E"],
    ["SRC", "https://qdrant.tech/documentation/", "Qdrant docs, vector search fundamentals", "M"],
    ["SRC", "https://www.trychroma.com/", "Chroma, an embedded vector store", "E"],
    ["SRC", "https://docs.ragas.io/", "Ragas docs, evaluating a RAG pipeline", "M"],
    ["SRC", "https://www.hellointerview.com/learn/system-design", "Hello Interview, system design fundamentals", "M"]
  ],

  hi: {
    one: "Yahan har decision ek split se nikalta hai jo tum pehle minute mein bol sakte ho: retrieval generation se pehle hota hai, aur pipeline ke do hisse, documents ingest karna aur questions ka jawab dena, kabhi ek request share nahi karte. Yeh bol do, to baaki round bas yeh samjhana hai ki cache, queue aur reranker mein se har ek apni jagah kyun deserve karta hai.",

    brief: {
      why: "Yeh problem lagti hai ki poori vector database ke baare mein hai, aur aisa nahi hai. Failure mode yeh hai ki ek box draw karo jis par <b>embeddings</b> likha ho aur design khatam maan lo. Doosra failure mode yeh hai ki retrieval quality ko skip kar do aur model ki apni knowledge par bharosa karo us gap ko bharne ke liye jise band karne ke liye yeh system hai. Dono se bacha ja sakta hai un do cheezon ko alag karke jinhe log mila dete hain: document ko findable banana, jo ingestion hai, aur uske baare mein question ka jawab dena, jo querying hai. Shuru mein hi honest raho ki fast, sasti retrieval kya galat karti hai, us se pehle ki claim karo ki reranker ise theek kar deta hai.",
      functional: [
        "<b>Document ingest karo.</b> Use chunk karo, har chunk ko embed karo, aur chunks ko unke vectors ke saath store karo. Badla hua document dobara ingest karne par sirf wahi document touch hota hai.",
        "<b>Question ka jawab do.</b> Question ko embed karo, candidate chunks retrieve karo, unhe rerank karo, aur top kuch chunks par grounded answer generate karo. Agar corpus mein jawab hi nahi hai, to bol do.",
        "<b>Sources dikhao.</b> Jo bhi question poochta hai woh dekh sake ki answer ne asal mein kaun se chunks use kiye, sirf woh nahi jo reranking ke discard karne se pehle retrieve hue the."
      ],
      out: ["documents par model ko fine-tune karna", "multi-turn conversational memory, ek alag concept page hai", "scanned documents ka OCR", "chunk store hone ke baad use edit karna, sirf poora document dobara ingest karna", "aisa question jiska corpus mein coverage nahi, gracefully mana kar dena kaafi hai"],
      nfr: [
        ["Answer latency", "p95 under 3 seconds end to end", "Ek question chaar calls chain karta hai: embed, retrieve, rerank, generate. Har ek ko ek shared budget ka slice milta hai, unconstrained clock nahi."],
        ["Ingestion durability", "a chunk is never lost between chunking and storage", "Document ek wada hai ki uska content findable hai. Pipeline ke beech mein ek chunk kho jaye to uska ek hissa chupke se questions ka jawab dena band kar deta hai."],
        ["Retrieval freshness", "a re-ingested document is searchable within minutes, not the next nightly run", "Incremental re-ingestion tabhi kaam ki hai jab woh fast ho. Jo correction ek din mein dikhe woh mushkil se correction hai."],
        ["Bulk ingest isolation", "a 50,000 document upload does not raise question latency", "Ingestion aur querying gateway ke neeche infrastructure share karte hain. Queue isi liye hai ki ek doosre ki capacity na chura sake."],
        ["Answer groundedness", "every cited source was actually read by the model, not merely retrieved", "Sources ki list jisme woh chunk hai jo model ne kabhi dekha hi nahi, evidence jaisi dikhti hai aur hai nahi."]
      ],
      numbers: [
        ["Source documents", "500,000, re-ingested incrementally", "Corpus size ki tarah diya gaya. Incremental matlab badla hua document sirf khud ko re-embed karta hai, baaki 499,999 ko nahi."],
        ["Chunks per document", "6 to 10, a few hundred tokens each", "Diya gaya. Chhota FAQ lagbhag 6 par aata hai, lamba policy document 10 ke kareeb."],
        ["Total chunks", "about 4 million", "500,000 documents guna lagbhag 8 chunks har ek, diye gaye range ka midpoint."],
        ["Questions per day", "5,000, bursty around business hours", "Diya gaya. Barabar failaye to yeh kuch nahi hai, aur yahi point hai: pressure har question ki latency ka hai, throughput ka nahi."],
        ["Peak concurrency", "a few dozen questions in flight at once", "Business hours ke burst mein, har question pipeline mein 3 seconds tak rehta hai, to daily total se zyada concurrency matter karti hai."],
        ["Answer latency", "p95 under 3 seconds end to end", "Diya gaya. Embed, retrieve, rerank aur generate mein baanto to har hop ko ek second se kaafi kam budget milta hai."],
        ["Embedding dimension", "1536", "Diya gaya. 4 million chunks par float32 mein sirf yahi lagbhag 25 GB vectors hai."],
        ["Bulk upload burst", "50,000 documents at once", "Diya gaya. Har ek ke 8 chunks ke hisaab se yeh ek dopahar mein queue par lagbhag 400,000 chunks aana hai."]
      ],
      numbersNote: "Inme se do design ko carry karte hain. <b>4 million chunks</b> kehta hai ki approximate index chahiye, scan nahi. Aur alag padne wale ko notice karo: <b>5,000 questions a day</b> database ke liye kuch nahi hai, har ek ke peeche ki chaar chained model calls hain jo latency ko asli constraint banati hain."
    },

    stagesIntro: "Chhe stages. Stage 0 woh version hai jo sach mein question ka jawab deta hai, lagbhag ek din ke liye. Uske baad har stage isliye hai kyunki ek specific cheez toot gayi, aur jo box aata hai woh us specific cheez ki sabse sasti repair hai. Agar pressure ka naam le sakte ho, to box kamaya hai. Nahi le sakte, to use whiteboard se hata do.",

    stages: [
      { pressure: "Abhi kuch galat nahi hua, aur yahi point hai. Har baad ke box ko justify karne ka sabse convincing tareeka hai ise pehle fail hote dekhna, na ki pehle pass mein gyarah boxes draw kar dena.",
        say: "Main us sabse chhoti cheez se shuru karta hoon jo question ka jawab deti hai, phir use todta hoon. Ek list mein kuch documents, ek model call jo question ko sabse compare kare, ek aur call jo answer likhe. Ab se jo bhi add karoon use isi ke against apne aap ko justify karna hoga.",
        breaks: "Python list mein rakhe kuch sau chhote documents ke liye yeh chalta hai. Har question ke liye sabko scan karna us size par theek hai, aur real knowledge base banne se bahut pehle theek nahi rehta. Restart ke baad kuch bachta bhi nahi." },

      { pressure: "Brute force scan ka cost har document ke saath badhta hai, aur naye documents add karne ka koi alag path abhi hai hi nahi.",
        say: "Approximate nearest neighbor index linear scan ki jagah leta hai. Yeh ek process ke andar hazaron chunks handle karta hai bina question path ko slow kiye jaise jaise corpus badhta hai. Ingestion aur querying abhi bhi ek hi process hain, to slow embedding job abhi bhi live question ko block kar sakta hai.",
        breaks: "Index ek process mein hazaron chunks ko theek handle karta hai. Yeh abhi bhi service ke saath restart hota hai, aur crash ke baad poora corpus dobara embed karna asli time aur asli API calls ka kharcha hai." },

      { pressure: "Ingestion aur querying ek hi process the, to naye documents ka bulk upload un documents ke live questions ko block karta hai jo pehle se maujood the.",
        say: "Ab do services hain: ek questions ka jawab deti hai, ek documents chunk karti hai, aur ingestion ke peeche embedding workers ka pool hai. Embedding slow hai aur pool karne layak, to woh kabhi us request ke andar inline nahi hona chahiye jiske liye koi insaan wait kar raha ho.",
        breaks: "Dono paths ab independently scale hote hain, magar har question abhi bhi poore retrieval round trip ka paisa deta hai chahe woh repeat ho. Uploads ke burst ke paas queue hone ki jagah nahi, woh seedha ingestion par gir jaata hai." },

      { pressure: "Yeh ab public API hai, questions poochne ke liye aur documents upload karne ke liye, aur na auth hai na rate limiting. Ek abusive client baaki sabko starve kar sakta hai.",
        say: "Dono services ke aage ek gateway. Yeh public surface ko terminate karta hai, check karta hai ki call kaun kar raha hai, aur koi bhi service real kaam kare us se pehle rate limits lagata hai. Main yeh box lagbhag kisi bhi public API ke aage lagaunga, sirf isi ke nahi.",
        breaks: "Traffic ab authenticated aur shaped hai, magar kuch cached nahi aur kuch queued nahi. Ek popular repeated question aur uploads ka burst abhi bhi wahi pressure jhelte hain jo hamesha jhelte the." },

      { pressure: "Wahi question din mein kai baar poocha jaata hai, aur ek identical question ke liye poori retrieval plus generation pipeline dobara chalana seedha waste hai. 50,000 documents ka bulk upload embedding workers ko seedha pitai kar raha tha, koi backpressure nahi.",
        say: "Mehngi path ke aage response cache, aur embedding workers ke aage queue. Cache repeat question ko lookup bana deta hai. Queue 50,000 documents ke spike ko ek backlog bana deta hai jo drain hota hai, na ki stampede jo gir jaaye.",
        breaks: "Common case ke liye latency aur cost control mein hain, magar recall abhi bhi noisy hai. Top-k vector hits mein kabhi kabhi ek off topic chunk aa jaata hai jo answer ko saaf dikhne layak neeche kheench deta hai." },

      { pressure: "Fast, sasti retrieval accurate retrieval ke barabar nahi thi. Chunking ya embedding model ka ek change ek baar do hafte tak chupke se answers ko kharab karta raha, kisi ko pata chalne se pehle.",
        say: "Reranker vector store ke top candidates ko us kuch tak chhota karta hai jo prompt mein jagah deserve karte hain. Eval log record karta hai ki har question ne kya retrieve kiya, kya rakha aur kya jawab diya. Retrieval quality ab aisi cheez hai jise tum measure kar sakte ho, na ki jise tum maan lete ho." }
    ],

    boxesIntro: "Gyarah components. Har ek ke liye: kaunsa pressure ne ise banaya, kaun argument haara, tum kya dete ho, aur raat ke teen baje yeh kaise fail hota hai. Sirf ek column yaad rakh sako to aakhri wala rakho. Apne khud ke failure modes ka naam lena us insaan jaisa sunai dene ka sabse tez tareeka hai jisne RAG pipeline chalayi hai, na ki bas padhi hai.",

    boxes: [
      { job: "Question poochta hai, ya document upload karta hai, aur answer ya receipt ka wait karta hai.",
        why: "Yeh diagram par isliye hai kyunki yahin se do bahut alag requests shuru hoti hain: ek question jo seconds mein answer chahta hai, aur ek document jo sirf receipt chahta hai.",
        forced: "Kisi ne force nahi kiya. Yeh apni jagah isliye kamata hai kyunki question aur upload paths turant alag ho jaate hain, aur wahi split is design ka zyadatar hissa hai.",
        alts: [["Leaving upload and question on one endpoint", "is baat ko chhupa deta hai ki unke latency budgets alag hain aur failure tolerance alag hai, jo sabse pehli baat hai jo zor se kehne layak hai."]],
        pros: ["Ek hi client corpus bhar bhi sakta hai aur query bhi kar sakta hai, to internal tool ko sirf ek integration chahiye.", "Client chahe kuch bhi ho, browser, CLI, koi aur service, use kabhi nahi jaanna padta ki ingestion aur querying alag machines par hain."],
        cons: ["Slow question aur slow bulk upload yahan se ek jaise dikhte hain, to client nahi bata sakta ki kaunsa slow woh jhel raha hai.", "Gateway ke is taraf kuch check nahi karta ki caller poochne ka haqdaar hai ya nahi, isliye gateway ko karna padta hai."],
        cost: "Zero infrastructure, kisi bhi client box jaisa. Jo decision matter karta hai woh poori tarah wire ke doosri taraf hai.",
        fails: "Client ek timed out question ko already slow reranker ke against retry karta hai, aur pipeline ke us ek box par load double ho jaata hai jiske paas spare capacity nahi.",
        say: "Main client isliye draw karta hoon kyunki question path aur ingestion path yahin alag hote hain, kisi ke bhi kaam karne se pehle. Yahi split zyadatar interesting design hai." },

      { job: "Caller ko authenticate karta hai, rate limits lagata hai, aur query service ya ingestion service ko route karta hai.",
        why: "Jab yeh questions poochne aur documents upload karne dono ke liye public API ban jaaye, to kuch to hona chahiye jo ek caller ko baaki sabko starve karne se roke.",
        forced: "Stage 3, jab questions aur uploads dono bahar se reachable ho gaye, aur na auth tha na rate limiting.",
        alts: [["A shared library each service imports", "auth aur rate limit logic ko ek ki jagah do services mein duplicate karta hai, aur dono copies pehli baar drift karti hain jab koi ek patch ho."], ["Auth inside each service directly", "ek service par chalta hai, aur jab ingestion aur querying alag deployables ho jaayein alag release schedules ke saath tab maintenance ka trap ban jaata hai."]],
        pros: ["Rate limit badalne ya key rotate karne ki ek jagah, do ki jagah.", "Public surface ko terminate karta hai, to iske peeche kisi service ko hostile caller ke baare mein sochna nahi padta."],
        cons: ["Yeh ab har request ke path mein hai, question ho ya upload, to iski apni latency aur uptime dono ke liye matter karti hai.", "Ek kharab rate limit rule legitimate bulk upload ko utni hi zor se throttle kar sakta hai jitni zor se attacker ko."],
        cost: "Managed gateway sasta hai. Asli cost rate limit ki shape sahi karna hai: per caller, sirf global nahi.",
        fails: "Ek hi API key ek burst mein 50,000 documents upload karti hai, aur ek shared per second limit usi waqt normal question traffic ko reject karna shuru kar deti hai.",
        say: "Auth aur rate limits yahan aate hain, services mein nahi, kyunki public RAG API par scrapers bhi aate hain aur honest bulk uploads bhi. Mujhe ek jagah chahiye jo dono ko alag kare." },

      { job: "Question ko grounded answer mein badalta hai: embed karo, retrieve karo, rerank karo, generate karo, aur jo sources use hue woh return karo.",
        why: "Question path ka latency target system mein sabse tight hai aur usme sabse zyada external calls chain hain, isliye yeh apna deployable deserve karta hai.",
        forced: "Stage 2, jab ingestion aur querying abhi bhi ek process share karte the aur bulk upload live questions ko block kar raha tha.",
        alts: [["One service for both ingest and query", "chalana aasan hai, aur iska matlab hai ki slow embedding batch job us request ko starve kar sakta hai jiske liye asal mein koi insaan wait kar raha hai."]],
        pros: ["Apne schedule par scale aur deploy hota hai, to ingestion ka risky change questions ko saath mein down nahi kar sakta.", "Iska poora kaam ek chhoti chain hai: embed, search, rerank, generate. Ispar reason karna aasan hai."],
        cons: ["Har answer doosri services aur external model APIs ki calls ki chain par depend karta hai, to iski latency baaki sabki latency ka sum hai.", "Iski apni koi state nahi, to chain mein bug tab tak isko dikhta nahi jab tak koi downstream call fail ya time out na ho."],
        cost: "Har question par kuch sau milliseconds ka orchestration, plus embed, retrieve, rerank aur generate ka jo bhi cost ho. 5,000 questions a day par yeh kuch chhoti machines hain.",
        fails: "Reranker load mein slow ho jaata hai aur query service bina timeout ke wait karti hai. Business hours ke questions ka burst us ek atki hui call ke peeche queue ho jaata hai.",
        say: "Stateless, ek kaam, har downstream call par hard timeouts, kyunki chaar external calls ki chain ko har link ka apna budget chahiye, sirf poori chain ka nahi." },

      { job: "Document leta hai, use chunks mein todta hai, aur chunks ko embed aur store hone ke liye aage handoff karta hai.",
        why: "Chunking sasti aur deterministic hai, isliye woh inline ho sakti hai, jabki embedding slow hai aur alag pool karne layak.",
        forced: "Stage 2, svc-query ke saath, jab dono paths ko independently scale aur fail hona tha.",
        alts: [["Chunking inside the embedding worker", "ek sasta, fast step ko ek slow, poolable step se jod deta hai, aur naye chunking strategy ke saath document reprocess karna sab kuch re-embed kiye bina mushkil bana deta hai."]],
        pros: ["Iske incidents question path tak nahi pahunch sakte, kyunki dono gateway ke peeche alag deployables hain.", "Chunking logic, sentence boundaries, overlap size, table handling, query side ki kisi bhi cheez se independently ship hota hai."],
        cons: ["Bulk upload ko embedding ke pakadne se pehle kahin land karna padta hai, aur akeli yeh service backlog rakhne ki jagah nahi rakhti.", "Isse track karna padta hai ki kaunsa chunk kis document version ka hai, warna re-ingested document purane chunks peeche chhod deta hai."],
        cost: "500,000 documents ko har ek 6 se 10 chunks mein chunk karna CPU bound pass hai, minutes ka kaam, us embedding ke muqable sasta jise yeh feed karta hai.",
        fails: "Edit ke baad document dobara ingest hota hai, purane chunks kabhi delete nahi hote, aur vector store ek question ka jawab ek aisi sentence quote karke deta hai jo mahino pehle hata di gayi thi.",
        say: "Chunking jaanbujhkar boring hai: fixed size with overlap, jahan ho sake sentence boundaries par split. Interesting failure chunking strategy nahi, woh stale chunks hain jo apne document se zyada jeete hain." },

      { job: "Exact repeat question ko seedha stored answer se jawab deta hai, retrieval, reranking aur generation ko poori tarah skip karke.",
        why: "Business hours ka traffic repeat hota hai: wahi kuch questions din mein kai baar poochhe jaate hain, aur identical answer dobara compute karna seedha waste hai.",
        forced: "Stage 4. Iske pehle kuch cached nahi tha, to popular question har baar poori teen second ki pipeline ka paisa deta tha.",
        alts: [["Caching the retrieved chunks, not the answer", "retrieval aur rerank ka cost bachata hai aur generation ka paisa phir bhi deta hai, jo sabse mehnga step hai. Doosre tier ke roop mein karne layak, iski jagah nahi."], ["Semantic caching on near duplicate questions", "zyada repeats pakadta hai, aur apni khud ki retrieval problem laata hai. Yeh decide karna ki do questions itne kareeb hain ki ek answer share kar saken, wahi mushkil hissa hai jo is system ka kaam hai."]],
        pros: ["Cache hit chaar chained calls skip karta hai, unme do bhi jo asal paisa lagate hain, embedding aur generation.", "Reranker aur model APIs ko ek popular question se bachane ka sabse sasta tareeka."],
        cons: ["Sirf exact match, to jo question do alag tareekon se poocha jaye woh do baar poora paisa deta hai, jo zyadatar asli traffic hai.", "Source document badle aur cache ko bhoolne ko kuch na bataye, to answer stale ho sakta hai."],
        cost: "Ek modest key value store, kuch gigabytes, kyunki key sirf literal question text hai. Jo yeh bachata hai uske muqable sasta.",
        fails: "Ek source document correct hota hai, cache kabhi invalidate nahi hota, aur system confidently purana, galat answer har us insaan ko repeat karta hai jo agla woh question poochta hai.",
        say: "Exact question text par keyed, event driven invalidation ki jagah short TTL. Main ek ghante ke liye thoda stale answer serve karna pasand karoonga, na ki har document edit ko har cached question se jodna." },

      { job: "Naye chunk hue documents ko tab tak rokta hai jab tak koi embedding worker free na ho, taaki burst workers ko seedha overwhelm na kare.",
        why: "50,000 documents ka bulk upload ek saath lakhon chunks banata hai, jo embedding workers ek baar mein le sakte hain usse kahin zyada.",
        forced: "Stage 4. Iske pehle uploads ka burst embedding workers ko seedha pitai karta tha, koi backpressure nahi.",
        alts: [["svc-ingest calling embedding workers directly", "low volume par theek, aur wahi cheez jo tab toot jaati hai jab koi ek dopahar mein system par 50,000 documents daal de."], ["An in memory queue inside svc-ingest", "process restart hote hi jo bhi abhi process nahi hua woh sab kho deta hai, jo real ingestion pipeline accept nahi kar sakti."]],
        pros: ["Kisi bhi size ka burst absorb karta hai, svc-ingest ya workers ko jaane bina ki woh kitna bada tha.", "Workers apni raftaar se pull karte hain, to slow embedding model rejected upload nahi banta."],
        cons: ["Upload aur searchable ke beech lag add karta hai: document findable hone se pehle queue mein baitha rehta hai.", "Ek aur system jiski apni retention, monitoring aur failure modes ki zimmedari leni padti hai."],
        cost: "50,000 documents ke burst ke liye lagbhag 400,000 messages, har ek kuch sau bytes. Ek gigabyte se kaafi kam, aur consume hone par gayab.",
        fails: "Ek embedding worker batch ke beech crash hota hai, message kabhi acknowledge nahi hota, aur ghanton baad chupke se replay hota hai, un chunks ko dobara embed karke jo pehle se stored the.",
        say: "Ingestion aur embedding ke beech durable queue, kyunki jaise hi maine 50,000 document burst ka number dekha mujhe pata chal gaya ki svc-ingest itni state memory mein kabhi nahi rakh sakta." },

      { job: "Har chunk ka text, metadata aur embedding hold karta hai, aur unke upar nearest neighbor search ka jawab deta hai.",
        why: "Jab corpus itna bada ho jaaye ki ek process har question par scan na kar sake, to kuch to embeddings ko index kare taaki search sabse compare na kare.",
        forced: "Stage 1, jab in memory list par brute force scan ka fast hona band ho gaya.",
        alts: [["A brute force scan over all embeddings", "exact, aur kuch sau documents par theek. 4 million chunks par iska matlab har baar question ko har ek se compare karna."], ["Vectors inside the same relational database as everything else", "achhe vector extension ke saath chalta hai, aur zyadatar is chunk count par dedicated store jitna approximate index scale nahi karte."]],
        pros: ["Approximate nearest neighbor index linear scan ko aise search mein badalta hai jo corpus badhne par bhi fast rehta hai.", "Yeh woh ek jagah hai jahan query path aur ingestion path is par agree karte hain ki abhi kya sach hai."],
        cons: ["Approximate matlab actual best match miss ho sakta hai, jo wahi noisy recall hai jise saaf karne ke liye reranker hai.", "Heavy writes ke baad index rebuild ya compact karna asli kaam hai aur searches ko thodi der slow kar sakta hai."],
        cost: "4 million chunks, 1536 dimensions, float32 mein lagbhag 25 GB vectors hai, plus kuch gigabytes text aur metadata. Aaram se ek achhi sized node.",
        fails: "Index compact ho raha hota hai usi waqt re-ingestion writes ka burst aata hai, aur searches slow ho jaati hain. On call engineer ek ghanta reranker ko blame karta hai asli wajah milne se pehle.",
        say: "Approximate index, exact search nahi, kyunki 4 million chunks par exact aur approximate ka gap milliseconds ka hai jo reranker waise bhi wapas kama leta hai." },

      { job: "Queue se chunks nikalta hai, unhe batch karta hai, embedding model ko call karta hai, aur vectors store mein likhta hai.",
        why: "Embedding ek slow, external, poolable unit of work hai. Yeh kabhi us request mein inline nahi hona chahiye jiske liye koi insaan wait kar raha ho.",
        forced: "Stage 2, jab embedding abhi bhi ingestion request path ke andar hi ho rahi thi.",
        alts: [["Embedding one chunk per API call as it is chunked", "likhna sabse aasan, aur batching se kahin slow aur mehnga, kyunki zyadatar embedding APIs batch ke hisaab se charge karte hain aur behtar perform karte hain."], ["Embedding inside svc-ingest synchronously", "upload response ko external model API ki network call par block karta hai, jo receipt only upload ke bilkul ulta hai."]],
        pros: ["Kai chunks ko ek embedding call mein batch karta hai, ek ek karke call karne se sasta aur har chunk ke liye fast.", "Independently scale hota hai: bulk upload ka matlab bas queue mein zyada messages, svc-ingest par zyada load nahi."],
        cons: ["Batch failure ko har chunk ke hisaab se handle karna padta hai, warna sau ke batch mein ek kharab chunk saare sau ko fail kar deta hai.", "Document ke land hone aur uske searchable hone ke beech asli delay add karta hai, jise freshness requirement ko account karna padta hai."],
        cost: "50,000 document burst ke 400,000 chunks ko, har call mein kuch sau chunks ke batch mein embed karna, workers ke chhote pool par minutes ka wall clock time hai.",
        fails: "Ek akela malformed chunk, stripped table se aaya empty string, poori batch call ko poison kar deta hai, aur us batch ka har doosra chunk uske saath drop ho jaata hai.",
        say: "Batch size yahan asli knob hai: bade batches har chunk ke liye sasta aur fail safe hone mein slow hote hain, kyunki ek kharab chunk poora batch kho sakta hai." },

      { job: "Vector store ke top candidates leta hai aur unhe ek heavier model se rescore karta hai jo question aur har chunk ko saath padhta hai.",
        why: "Fast approximate search kabhi kabhi aisa chunk deta hai jo vector space mein paas hai aur meaning mein galat, aur sirf woh model jo dono texts ko saath padhe yeh bata sakta hai.",
        forced: "Stage 5. Fast, sasti retrieval chupke se accurate retrieval ke barabar nahi thi, aur do hafte tak kisi ne notice nahi kiya.",
        alts: [["Trusting the vector store's top-k order directly", "sasta aur fast, aur bilkul wahi setup jisne kharab chunk ko position do par baithne diya aur kisi ke notice kiye bina answer neeche kheencha."], ["A bigger, better embedding model instead of a reranker", "recall ko generally madad karta hai, aur actual question aur chunk ko saath use nahi kar sakta jaise cross encoder karta hai, isliye wahi near misses phir bhi miss hote hain."]],
        pros: ["Cross encoder question ko har candidate ke against seedha score karta hai, un relevance galtiyon ko pakadta hai jo vector distance nahi dekh sakta.", "Sirf ek chhote top-k par chalta hai, to corpus kitna bhi bada ho iska extra cost bounded rehta hai."],
        cons: ["Yeh har ek question ke latency budget par ek extra model call hai.", "Yeh aisa candidate set theek nahi kar sakta jisme sahi chunk pehli jagah tha hi nahi."],
        cost: "Har question par top 20 candidates rescore karna, 5,000 questions a day par, din mein 100,000 rerank calls hai, corpus ke muqable chhota par free nahi.",
        fails: "Embedding model upgrade hota hai, retrieval quality chupke se behtar hoti hai, aur kisi ko pata nahi chalta ki reranker purane score distribution ke against tune tha aur ab achhe matches discard kar raha hai.",
        say: "Retrieve wide, rerank narrow. Sasti tarah se shayad 20 se 50 candidates kheencho, phir expensive model call lagao unhe us 3 ya 4 tak chhota karne mein jo prompt mein jaate hain." },

      { job: "Woh teen kaam karta hai jo yeh system khud nahi kar sakta: text embed karna, question ko chunk ke against score karna, aur answer generate karna.",
        why: "Apne embedding, reranking aur generation models chalana ek asli option hai, aur woh ek doosra system hai chalane ke liye jisse zyadatar teams ko shuru nahi karna chahiye.",
        forced: "Stage 0. Is design ka kabhi aisa version tha hi nahi jisme kahin model na ho.",
        alts: [["Self hosting the embedding and generation models", "per token bill aur ek network hop hata deta hai, aur iska matlab hai GPUs, model upgrades aur capacity planning ka maalik banna, vendor ke bajaye."]],
        pros: ["Asal language understanding ke liye chalane ko apna koi infrastructure nahi.", "Provider jab bhi behtar model ship kare, bina tumhare kuch kiye improve hota hai."],
        cons: ["Har answer ab kisi aur ki service par network call par depend karta hai, kisi aur ki latency aur kisi aur ke outage schedule ke saath.", "Cost per token hai, to question volume ya document size ka spike sirf load mein nahi, bill mein spike hai."],
        cost: "Question path par teen calls, embed, rerank, generate, plus ingestion par har chunk ke liye ek. Diye gaye volumes par yeh din ke dollars hai, magar metered hai aur surprise kar sakta hai.",
        fails: "Model provider ki slow degradation hoti hai, outage nahi, aur system ka har answer chupke se slow hota jaata hai jab tak ek ghante baad p95 latency alert fire na ho.",
        say: "Main is ke liye apna embedding ya generation model nahi banaunga. Build versus buy ki line us scale par hai jisse yeh system kahin door hai." },

      { job: "Har question, jo chunks usne retrieve kiye, reranking ke baad jo rakhe, aur generate hua answer record karta hai, baad mein scoring ke liye.",
        why: "Chunking ya embedding ka ek change chupke se answers ko kharab kar sakta hai, aur ise pakadne ka ek hi tareeka hai ki kal ke answers compare karne ke liye maujood hon.",
        forced: "Stage 5, jab request path mein theek karne ko kuch nahi bacha aur quality khula problem ban gayi.",
        alts: [["Logging only the final answer", "sasta, aur wahi information phenk deta hai jo yeh batane ke liye chahiye ki bura answer retrieval se aaya ya generation se."], ["Sampling a fraction of questions instead of all of them", "isse kahin zyada volume par reasonable hai. 5,000 questions a day par sab kuch log karna lagbhag kuch nahi lagta."]],
        pros: ["Question ko naye chunking ya embedding strategy ke against replay karne deta hai aur ship karne se pehle answers compare karne deta hai.", "Bure answer ki customer complaint ko anecdote ke bajaye debuggable trace bana deta hai."],
        cons: ["Yeh ek doosra store hai chalane ko jiska questions ka jawab dene se koi lena dena nahi, sirf yeh jaanne se hai ki tum unka jawab achhe se de rahe ho ya nahi.", "Har question ke liye har retrieved chunk store karna jama hota jaata hai, chahe har row chhoti ho."],
        cost: "Din ki 5,000 rows, har ek mein ek question, kuch chunk ids aur ek answer. Storage trivially sasta, mehnga hissa yeh hai ki koi use asal mein dekhe.",
        fails: "Chunking change ship hota hai, aur answer quality itni dheere girti hai ki koi ek din galat nahi lagta. Log check karne se pehle do hafte aur ek customer complaint lag jaate hain.",
        say: "Retrieved set aur kept set ko alag log karo, sirf final answer nahi. Mujhe baad mein jo sawaal answer karna hai woh yeh hai ki answer retrieval mein galat hua ya reranking mein." }
    ],

    flowsIntro: "Boxes draw karo, phir paths ko zor se narrate karo. Interviewers asal mein yahi hissa score karte hain, kyunki yahin hand waving dikhne lagti hai. Har step ke liye jaano ki caller wait kar raha hai ya nahi.",

    flows: [
      { n: "Answering a question",
        note: "Yeh woh path hai jiske baare mein 3 second ka target likha gaya hai. Sirf reranker aur generator ko slow hone ki ijaazat hai.",
        steps: [
          ["Client question API gateway ko bhejta hai, jo use authenticate karta hai aur query service ko route karta hai."],
          ["Query service response cache mein is exact question text ko check karti hai."],
          ["Cache hit par stored answer aur uske sources turant return ho jaate hain, aur downstream kuch touch nahi hota."],
          ["Miss par, woh question ko embed karti hai aur vector store mein top candidates search karti hai."],
          ["Reranker un candidates ko question ke against rescore karta hai aur woh kuch rakhta hai jo asal mein prompt mein belong karte hain."],
          ["Model API kept chunks par grounded answer generate karti hai, aur response un sources ke saath return hota hai jo usne use kiye."],
          ["Question, retrieved set, kept set aur answer eval log mein likhe jaate hain, client ke us par wait kiye bina."]
        ] },
      { n: "Ingesting a document",
        note: "Request count ke hisaab se traffic ka chhota hissa, aur zyadatar moving parts, kyunki document tab tak searchable nahi jab tak har chunk ka vector na ho.",
        steps: [
          ["Client document gateway ko bhejta hai, jo use ingestion service ko route karta hai."],
          ["Ingestion service document ko kuch sau token ke pieces mein chunk karti hai aur receipt return karti hai."],
          ["Har chunk ingestion queue par rakha jaata hai, request path se poori tarah bahar."],
          ["Embedding worker chunks ka batch pull karta hai, poore batch ke liye model API ek baar call karta hai, aur har chunk ka vector wapas paata hai."],
          ["Worker har chunk ka text, metadata aur vector vector store mein likhta hai, jahan woh pehli baar searchable ban jaata hai."]
        ] },
      { n: "A 50,000 document bulk upload",
        note: "Ek document jaisa hi path, us size par jo is design ke har pichle stage ko tod deta.",
        steps: [
          ["50,000 documents ek chhoti window mein gateway par aate hain aur per caller rate limit hote hain, seedha reject nahi."],
          ["Ingestion service har ek ko aate hi chunk karti hai, kul milakar lagbhag 400,000 chunks banti hain."],
          ["Har chunk queue par land hota hai, jo poore burst ko absorb kar leta hai bina embedding workers ko spike dikhe."],
          ["Workers queue ko apni sustainable raftaar se drain karte hain, chunks ko embedding calls mein batch karte hue jab tak backlog khatam na ho."],
          ["Live questions poore waqt cache aur vector store ko hit karte rehte hain, kyunki burst question path ko kabhi touch nahi karta."]
        ] }
    ],

    tradeoffsIntro: "Pair bolo, ek side chuno, phir bolo ki kya tumhara mann badal dega. Aakhri hissa hi opinion aur preference ko alag karta hai.",

    tradeoffs: [
      { a: ["Cache aside, exact match", "Repeat question retrieval, reranking aur generation ko poori tarah skip karta hai, keemat yeh ki sirf identical text match hota hai."],
        b: ["Semantic caching on question similarity", "Alag tareeke se phrase kiye repeats zyada pakadta hai, question ko embed karke aur near neighbors match karke, keemat yeh ki kabhi kabhi thode alag question ka cached answer de deta hai."],
        flip: "wahi intents kai alag tareekon se phrase hote hain aur exact match hit rate kam rehta hai. Tab semantic cache extra complexity kamata hai, conservatively tuned threshold ke saath." },
      { a: ["Retrieve wide, then rerank narrow", "Sasti vector search darjanon candidates kheenchti hai, expensive cross encoder unhe generation se pehle kuch tak chhota karta hai."],
        b: ["Skip reranking, trust the vector store's order", "Ek model call kam aur har question par kam latency, keemat yeh ki woh noisy near misses jo vector distance asli answer se alag nahi kar sakta."],
        flip: "corpus itna chhota aur homogeneous hai ki vector similarity aur true relevance shayad hi kabhi disagree karein. Tab reranking ek aisi problem par model call kharch karta hai jo bas hai hi nahi." },
      { a: ["A pooled embedding worker, batched off a queue", "Embedding slow hai aur poolable, to woh asynchronously batches mein hota hai jo cost aur throughput ke liye sized hain."],
        b: ["Embedding inline inside the ingestion request", "Simpler, koi queue chalane ko nahi, aur iska matlab hai ki upload response ek external model API call par wait karta hai, jo document upload ko bina wajah slow endpoint bana deta hai."],
        flip: "ingestion volume itna kam hai ki queue aur worker pool pure overhead hain. Tab inline embedding sach mein simpler hai, pehle bulk upload tak." },
      { a: ["Log the retrieved set and the kept set separately", "Tumhe batata hai ki bura answer retrieval ke sahi chunk miss karne se aaya ya reranking ke use discard karne se."],
        b: ["Log only the final question and answer", "Store aur query karne mein sasta, aur wahi information phenk deta hai jo debug karne ke liye chahiye ki answer galat kyun tha."],
        flip: "eval log ka storage ya write volume us se kahin zyada question rate par asli cost ban jaaye jo yeh system dekhta hai. Tab questions ka ek fraction sample karna honest compromise hai." }
    ],

    next: [
      "<b>Behtar chunking.</b> Structure aware splitting, headings, tables aur code blocks ko respect karte hue, fixed token window ki jagah, quality par bacha hua sabse high leverage change hai.",
      "<b>Ek feedback signal.</b> Answer par thumbs up ya down, jo eval log ke record kiye chunks se jude, quality ko andaze se ek metric bana deta hai jise tum track kar sako.",
      "<b>Structured filters ke liye doosra index.</b> Document owner, date ya tag se filter karna vector search chalne se pehle, baad mein nahi, corpus badhne par narrow question ko fast rakhta hai.",
      "<b>Semantic caching.</b> Jab exact match caching prove ho jaaye, to near duplicate questions match karna agla latency aur cost win hai, agar similarity threshold dhyan se tune ho."
    ] }
},

{
  id: "coding-agent-harness", kind: "hld", n: "Coding agent harness", sub: "Claude Code, Cursor's agent mode",
  tags: ["the harness is the product", "sandboxed by default", "context is the scarce resource"],
  one: "Every decision here follows from one shape: a tool call round trips through a sandbox, and the model only ever sees the sliver of the repository the context service decided was worth the tokens this round.",

  brief: {
    why: "Everyone pictures this as call the model in a loop, and the loop is the easy 5%. The hard part is that a real repository never fits in the prompt, so most of the engineering is deciding what the model gets to see this round. The second hard part: a function call from the model is a request, not a guarantee of intent. Trusting it blindly is reckless, and blocking on a human for every single one defeats the point.",
    functional: [
      "<b>Hold a multi-turn conversation about a codebase.</b> Answer questions, propose a plan, and keep enough of the last several turns in context to stay coherent across dozens of rounds.",
      "<b>Propose and execute tool calls.</b> Read a file, search across the repo, edit a file, run a shell command, run the test suite, all through the same sandboxed path.",
      "<b>Gate the risky ones.</b> A file read runs on its own. A command that deletes, deploys or touches anything outside the sandbox waits for a human to say yes.",
      "<b>Survive a disconnect or a rate limit.</b> Checkpoint enough state that a dropped connection costs a retry, not the forty rounds of work that came before it."
    ],
    out: ["multi-user real-time collaboration on the same session", "rendering the IDE UI itself", "training or fine-tuning the model", "long-term memory that persists after the task ends", "billing and seat management across a team"],
    nfr: [
      ["Tool round trip overhead", "under 400 ms before the sandboxed command runs", "A slow round trip is not one bad experience, it is a tax paid 20 to 60 times in a single task."],
      ["Context per turn", "50,000 to 150,000 tokens assembled per round", "That budget has to cover a repository with far more content than it can ever hold at once."],
      ["Task continuity", "resumes after a disconnect without redoing finished rounds", "A rate limit error on round 35 of 40 should cost one retry, never the whole task."],
      ["Blast radius per tool call", "contained to one sandboxed container", "A function call is a request from the model, not a guarantee, and the sandbox is what makes that safe to honour."],
      ["Session cost", "$0.50 to $2 in model calls for one real task", "Most of that is the model call itself, so the context assembly step is where the bill is actually controlled."]
    ],
    numbers: [
      ["Repository size", "5,000+ files", "Far more than fits in any context window, which is the constraint every later stage exists to work around."],
      ["Context per turn", "50,000 to 150,000 tokens", "Enough for a handful of files and recent turns, nowhere near enough for the whole repository at once."],
      ["Tool round trip budget", "under 400 ms of overhead", "Everything before the sandboxed command runs: parsing the call, checking its risk tier, dispatching to a container."],
      ["Rounds in a real task", "20 to 60 tool-call rounds", "A genuine refactor touches several files and needs a test run after most of the edits."],
      ["Session cost", "$0.50 to $2 in model calls", "Mostly the model API, paid once per round for every round the task actually takes."],
      ["Tokens reprocessed without a cache", "roughly 6 million a session", "A 150,000 token stable prefix resent on 40 rounds, the exact bill the cache in stage 2 erases."]
    ],
    numbersNote: "Two facts carry the whole design. <b>150,000 tokens a turn</b> says the model never sees the whole repository, only what got ranked in. <b>20 to 60 rounds</b> says a crash halfway through is close to routine, not a rare event."
  },

  stagesIntro: "Six stages. Stage 0 is the version that actually answers a question, for a repository small enough to paste into one prompt. Every stage after it exists because one specific thing broke under real load, never because a bigger diagram looks more impressive.",

  stages: [
    { t: "0. One loop, whole repo in the prompt",
      pressure: "Nothing has broken yet, and that is the point. This is the smallest version that can answer a question about a small codebase, by stuffing the whole thing into the prompt and asking.",
      nodes: [
        { id: "client", l: "Client", s: "CLI or IDE extension", col: 0, row: 0, r: "client" },
        { id: "svc-orchestrator", l: "Agent loop", s: "observe, plan, act", col: 2, row: 0, r: "svc" },
        { id: "ext-model", l: "Model API", s: "the LLM call itself", col: 4, row: 0, r: "ext" }
      ],
      edges: [
        { a: "client", b: "svc-orchestrator" },
        { a: "svc-orchestrator", b: "ext-model", l: "ask" }
      ],
      add: ["client", "svc-orchestrator", "ext-model"],
      say: "The smallest thing that can hold a conversation about code: one loop, one model call per turn, the whole repository pasted into the prompt. Everything I add after this has to justify itself against how simple this is.",
      breaks: "It works for a toy repo of ten files. A real 5,000-file repository blows the context window immediately, and the model can only describe a change in text, it cannot read a file or run anything." },

    { t: "1. Give it tools, in a sandbox",
      pressure: "The model can now request an action through function calling. Running that action in the same process as the orchestrator means one bad tool call, a stray rm -rf or a leaked secret, can damage the host machine directly.",
      nodes: [
        { id: "client", l: "Client", s: "CLI or IDE extension", col: 0, row: 0, r: "client" },
        { id: "svc-orchestrator", l: "Agent loop", s: "observe, plan, act", col: 2, row: 0, r: "svc" },
        { id: "ext-model", l: "Model API", s: "the LLM call itself", col: 4, row: 0, r: "ext" },
        { id: "work-sandbox", l: "Sandbox workers", s: "one container per session", col: 3, row: 2, r: "work" }
      ],
      edges: [
        { a: "client", b: "svc-orchestrator" },
        { a: "svc-orchestrator", b: "ext-model", l: "ask" },
        { a: "svc-orchestrator", b: "work-sandbox", l: "run" }
      ],
      add: ["work-sandbox"],
      say: "Function calling plus a sandbox: the model proposes, the sandbox executes, and the two never share a process. A bad command can now only ever damage a container that is about to be thrown away.",
      breaks: "Side effects are contained in a sandbox now. Spinning one up per call costs real seconds, and the orchestrator resends the same file contents and tool schemas on every single turn, so cost grows with every round." },

    { t: "2. Cache the stable part of every call",
      pressure: "The system prompt and the tool schema list are identical on every turn of a session. Paying full price to reprocess them each time is money spent on something that never changed.",
      nodes: [
        { id: "client", l: "Client", s: "CLI or IDE extension", col: 0, row: 0, r: "client" },
        { id: "svc-orchestrator", l: "Agent loop", s: "observe, plan, act", col: 2, row: 0, r: "svc" },
        { id: "cache", l: "Prompt cache", s: "stable system + tools", col: 3, row: 0, r: "cache" },
        { id: "ext-model", l: "Model API", s: "the LLM call itself", col: 4, row: 0, r: "ext" },
        { id: "work-sandbox", l: "Sandbox workers", s: "one container per session", col: 3, row: 2, r: "work" }
      ],
      edges: [
        { a: "client", b: "svc-orchestrator" },
        { a: "svc-orchestrator", b: "work-sandbox", l: "run", bend: 0.75 },
        { a: "svc-orchestrator", b: "cache", l: "prefix" },
        { a: "cache", b: "ext-model" }
      ],
      add: ["cache"],
      say: "Cache the prefix that never changes: the system prompt, the tool schemas. It costs nothing to be correct about, and it is the cheapest win in this entire design.",
      breaks: "Repeated turns are cheaper now. The orchestrator still stuffs the whole repository or the whole conversation history into context, and that does not scale to a real task." },

    { t: "3. Assemble context on purpose",
      pressure: "Dumping the whole repository, or the whole history, into context is expensive. Past a point it is actively worse for the model, since most of it is irrelevant to the current step.",
      nodes: [
        { id: "client", l: "Client", s: "CLI or IDE extension", col: 0, row: 0, r: "client" },
        { id: "svc-orchestrator", l: "Agent loop", s: "observe, plan, act", col: 2, row: 0, r: "svc" },
        { id: "cache", l: "Prompt cache", s: "stable system + tools", col: 3, row: 0, r: "cache" },
        { id: "svc-context", l: "Context service", s: "ranks what to include", col: 3, row: 1, r: "svc" },
        { id: "work-sandbox", l: "Sandbox workers", s: "one container per session", col: 3, row: 2, r: "work" },
        { id: "ext-model", l: "Model API", s: "the LLM call itself", col: 4, row: 0, r: "ext" },
        { id: "store-index", l: "Repo index", s: "embeddings or symbols", col: 4, row: 1, r: "store" }
      ],
      edges: [
        { a: "client", b: "svc-orchestrator" },
        { a: "svc-orchestrator", b: "work-sandbox", l: "run", bend: 0.75 },
        { a: "svc-orchestrator", b: "cache", l: "prefix" },
        { a: "cache", b: "ext-model" },
        { a: "svc-orchestrator", b: "svc-context", l: "rank", bend: 0.4 },
        { a: "svc-context", b: "store-index", l: "lookup" }
      ],
      add: ["svc-context", "store-index"],
      say: "Ranking is not an optimisation on top of a working system, it is what makes a 150,000 token budget cover a 5,000 file repository at all.",
      breaks: "A single well-scoped turn works well now. A long task spanning dozens of turns still has no way to survive a crash, a disconnect or a rate limit error without losing everything done so far." },

    { t: "4. Checkpoint the session",
      pressure: "A real task takes 20 to 60 tool call rounds. That is long enough that a network blip or a provider rate limit is close to routine. Once the work is billable, losing it all to one is unacceptable.",
      nodes: [
        { id: "client", l: "Client", s: "CLI or IDE extension", col: 0, row: 0, r: "client" },
        { id: "svc-orchestrator", l: "Agent loop", s: "observe, plan, act", col: 2, row: 0, r: "svc" },
        { id: "cache", l: "Prompt cache", s: "stable system + tools", col: 3, row: 0, r: "cache" },
        { id: "svc-context", l: "Context service", s: "ranks what to include", col: 3, row: 1, r: "svc" },
        { id: "work-sandbox", l: "Sandbox workers", s: "one container per session", col: 3, row: 2, r: "work" },
        { id: "store-session", l: "Session store", s: "checkpointed state", col: 3, row: 3, r: "store" },
        { id: "ext-model", l: "Model API", s: "the LLM call itself", col: 4, row: 0, r: "ext" },
        { id: "store-index", l: "Repo index", s: "embeddings or symbols", col: 4, row: 1, r: "store" }
      ],
      edges: [
        { a: "client", b: "svc-orchestrator" },
        { a: "svc-orchestrator", b: "work-sandbox", l: "run", bend: 0.75 },
        { a: "svc-orchestrator", b: "cache", l: "prefix" },
        { a: "cache", b: "ext-model" },
        { a: "svc-orchestrator", b: "svc-context", l: "rank", bend: 0.4 },
        { a: "svc-context", b: "store-index", l: "lookup" },
        { a: "svc-orchestrator", b: "store-session", l: "checkpoint", bend: 0.85 }
      ],
      add: ["store-session"],
      say: "Checkpoint every round to a session store. A rate limit error on round 35 of 40 should cost one retry, never the whole task.",
      breaks: "A task now resumes cleanly after a disconnect. Nothing in the system can yet answer what did this agent actually do to my repository last Tuesday, and that matters the moment it touches anything like production." },

    { t: "5. Gate it, and put it behind a front door",
      pressure: "This now runs many users' sessions concurrently against real infrastructure. API level auth and rate limiting, and a durable record of every tool call the sandbox executed, stop being optional.",
      nodes: [
        { id: "client", l: "Client", s: "CLI or IDE extension", col: 0, row: 0, r: "client" },
        { id: "edge", l: "API gateway", s: "auth, rate limits", col: 1, row: 0, r: "edge" },
        { id: "svc-orchestrator", l: "Agent loop", s: "observe, plan, act", col: 2, row: 0, r: "svc" },
        { id: "cache", l: "Prompt cache", s: "stable system + tools", col: 3, row: 0, r: "cache" },
        { id: "svc-context", l: "Context service", s: "ranks what to include", col: 3, row: 1, r: "svc" },
        { id: "work-sandbox", l: "Sandbox workers", s: "one container per session", col: 3, row: 2, r: "work" },
        { id: "store-session", l: "Session store", s: "checkpointed state", col: 3, row: 3, r: "store" },
        { id: "ext-model", l: "Model API", s: "the LLM call itself", col: 4, row: 0, r: "ext" },
        { id: "store-index", l: "Repo index", s: "embeddings or symbols", col: 4, row: 1, r: "store" },
        { id: "store-audit", l: "Audit log", s: "every tool call, ever", col: 4, row: 2, r: "store" }
      ],
      edges: [
        { a: "client", b: "edge" },
        { a: "edge", b: "svc-orchestrator" },
        { a: "svc-orchestrator", b: "work-sandbox", l: "run", bend: 0.75 },
        { a: "svc-orchestrator", b: "cache", l: "prefix" },
        { a: "cache", b: "ext-model" },
        { a: "svc-orchestrator", b: "svc-context", l: "rank", bend: 0.4 },
        { a: "svc-context", b: "store-index", l: "lookup" },
        { a: "svc-orchestrator", b: "store-session", l: "checkpoint", bend: 0.85 },
        { a: "work-sandbox", b: "store-audit", l: "log" }
      ],
      add: ["edge", "store-audit"],
      say: "Auth and rate limits move to the front door, and every executed tool call gets written to a log nobody can quietly lose. Multi-tenant and auditable are the same requirement seen from two sides." }
  ],

  boxesIntro: "Ten components. For each one: the pressure that forced it, what lost the argument, what it costs, and how it fails at three in the morning. If you remember only one column, remember the last one. Naming your own failure modes is what separates someone who has run one of these from someone who has only read about it.",

  boxes: [
    { id: "client", n: "Client", r: "client",
      job: "The CLI or IDE extension the developer is actually typing into.",
      why: "Something has to hold the conversation, show diffs before they land, and let a human say no to one specific command.",
      forced: "Nothing forced it, every stage needs a place the request comes from. Drawn because the approval prompt for a risky command lives here, and that boundary is worth naming early.",
      alts: [["Leaving the client off the diagram", "leaves every integrator to invent their own approval UI, and the ones that skip it are the ones that get a bad rm story."]],
      pros: ["Keeps the risky decision, approve this command or not, next to the human instead of buried in a server-side policy file.", "Can show a diff before it lands, which catches most bad edits before a tool call runs at all."],
      cons: ["Every client (CLI, IDE plugin, web) has to reimplement the same approval and diff rendering.", "A client that auto-approves everything to save clicks defeats the one safety mechanism it was built to provide."],
      cost: "Zero infrastructure, a UI decision made once per integration.",
      fails: "A developer sets auto-approve to move faster before a demo, the agent runs a migration script against the wrong database, and the client never asked.",
      say: "The client is where consent lives. Move that consent onto the server and you have built a system that can act on someone's repo without them in the loop." },

    { id: "edge", n: "API gateway", r: "edge",
      job: "One address for every client, auth and rate limits before a request reaches an orchestrator.",
      why: "Once more than one user's sessions run concurrently, something has to say who this request is and stop one client from starving the rest.",
      forced: "Stage 5, multiple users' sessions running concurrently against shared infrastructure.",
      alts: [["Auth and rate limiting inside the agent loop itself", "works for one user, and couples a security concern to the same process that is busy planning tool calls."], ["A generic reverse proxy with no session awareness", "handles TLS and routing, but has no idea a single client is opening ten sandboxes at once."]],
      pros: ["Terminates auth once, so every service behind it can trust the identity it forwards.", "Rate limits per API key, so one runaway loop cannot starve every other session on the box."],
      cons: ["Adds a hop and a component whose own availability now matters.", "Needs to know enough about a session (which sandbox, which budget) to rate limit meaningfully, not just count requests."],
      cost: "A managed gateway is cheap. The real cost is writing rate limit rules that key on session and token spend, not just requests per second.",
      fails: "A single leaked API key opens 200 concurrent sessions overnight, each spinning up a sandbox and calling the model API, and the bill arrives before anyone notices.",
      say: "Auth and quota belong at the front door, not inside the loop that is busy deciding which file to edit next." },

    { id: "svc-orchestrator", n: "Agent loop", r: "svc",
      job: "Observe the current state, plan the next step, act by calling a tool, repeat.",
      why: "Something has to hold the loop's control flow: what happened last, what to try next, and when the task is actually done.",
      forced: "Stage 0, it is the whole system before anything else exists.",
      alts: [["A single giant prompt with no loop", "answers a question about the code, and cannot make an edit, run a test or react to what the edit did."], ["A fixed pipeline of scripted steps", "predictable and fast, and it only handles the tasks someone anticipated. A real refactor takes a path nobody wrote down in advance."]],
      pros: ["General enough to attempt a task nobody scripted for.", "Each round it can react to what the last tool call actually returned, instead of following a plan blind."],
      cons: ["Loops can wander: a model that is unsure will sometimes repeat a failed approach instead of trying something new.", "Every round costs a model call, so an inefficient loop is not just slow, it is a direct dollar cost."],
      cost: "One model call per round, and a real task runs 20 to 60 of them. That is where most of the session's $0.50 to $2 cost is spent.",
      fails: "The model gets stuck re-reading the same file after a failed edit, burns 40 rounds without progress, and the session cost triples before a timeout finally kills it.",
      say: "The loop is the product. Everything else in this diagram exists to make one iteration of observe, plan, act cheaper, safer or more likely to make progress." },

    { id: "cache", n: "Prompt cache", r: "cache",
      job: "Remember the stable prefix, system prompt and tool schemas, so it is not reprocessed every round.",
      why: "The system prompt and tool list are identical on every turn of a session. Paying full price to reread them each round is money spent on something that never changed.",
      forced: "Stage 2, once the loop was resending the same tool schemas and instructions on every single round.",
      alts: [["No caching, resend everything every round", "simplest to reason about, and the cost scales linearly with rounds for content that never changes."], ["Cache the whole conversation, not just the stable prefix", "saves more, and invalidates on the first edit to anything earlier in the transcript, which happens constantly."]],
      pros: ["Turns a repeated fixed cost into a one-time cost per session.", "Makes long sessions viable financially, since round 40 costs a fraction of round 1."],
      cons: ["Only helps the part of the prompt that stays identical, so a system prompt that changes mid-session busts the cache.", "Adds a component whose hit rate now needs monitoring, since a silent miss quietly triples the bill."],
      cost: "Cached tokens cost a fraction of fresh ones. On a 40 round task with a 5,000 token stable prefix, that is the difference between paying for it once and paying for it 40 times.",
      fails: "Someone edits the system prompt mid-session to fix a bug. The cache silently misses on every round after, and nobody notices until the invoice looks wrong.",
      say: "Cache the part of the prompt that never changes. It is the cheapest optimisation in this whole design and it costs nothing to be correct about." },

    { id: "svc-context", n: "Context service", r: "svc",
      job: "Decide which files, past turns and search results are worth the tokens this round.",
      why: "A turn holds 50,000 to 150,000 tokens and a real repository holds far more than that, so something has to choose.",
      forced: "Stage 3, once stuffing the whole repository or the whole history stopped being merely expensive and started making the model worse.",
      alts: [["Stuff everything that fits and truncate the rest", "simple, and it truncates by position rather than relevance, so the useful file can be the one that gets cut."], ["Let the model ask for files by name with no ranking", "works when the model already knows the file name, and a 5,000 file repo means it usually does not."]],
      pros: ["Keeps each round's context to what is actually relevant to the current step, not everything ever touched.", "Scales independently of the orchestrator, so ranking logic can improve without touching the loop itself."],
      cons: ["Ranking is a judgment call and a bad rank silently drops the one file that mattered.", "Adds a lookup on the hot path of every round, which competes with the 400 ms tool round trip budget."],
      cost: "One embedding or symbol lookup per round against the repo index, cheap compared to the model call it feeds.",
      fails: "The ranker scores a config file low because it rarely changes. The agent edits code that reads it without ever seeing the current values, and the fix breaks production.",
      say: "Relevance ranking is not a nice to have, it is what makes a 150,000 token budget cover a 5,000 file repository at all." },

    { id: "work-sandbox", n: "Sandbox workers", r: "work",
      job: "Run the actual command, edit or test, in a container isolated from the host and from other sessions.",
      why: "A function call from the model is a request, not a guarantee of intent. A single bad one, a stray rm or a leaked secret, should not reach the host machine.",
      forced: "Stage 1, the moment the model could request an action instead of just describing one.",
      alts: [["Run tool calls in the same process as the orchestrator", "fastest, and one bad command reaches the host machine directly, which is the exact failure this box exists to prevent."], ["A shared sandbox across many sessions", "cheaper to keep warm, and one session's file writes or resource spike can affect another's task."], ["A VM instead of a container", "stronger isolation, and the startup cost is seconds instead of the sub-second a container manages."]],
      pros: ["Contains the blast radius of any single tool call to one disposable container.", "Can be killed and rebuilt cleanly if a task leaves it in a bad state."],
      cons: ["Spinning one up per session costs real seconds, which shows up directly in the 400 ms round trip budget.", "One container per session multiplies infrastructure cost by concurrent sessions, not by requests."],
      cost: "A few hundred milliseconds to start cold, near zero once warm and reused across a session's 20 to 60 rounds.",
      fails: "A container pool runs out under a traffic spike, new sessions queue for a sandbox, and the 400 ms round trip budget quietly becomes four seconds.",
      say: "The sandbox is the thing that lets you say yes to a tool call without reading it first. Without it, every function call is a trust decision." },

    { id: "store-session", n: "Session store", r: "store",
      job: "Checkpoint the loop's state, what has run, what succeeded, what the plan still is, so a crash does not erase it.",
      why: "A real task takes 20 to 60 rounds, long enough that a disconnect or a rate limit error is closer to routine than rare.",
      forced: "Stage 4, once a task doing real, billable work could not afford to restart from round zero after a network blip.",
      alts: [["Keep state only in the orchestrator's memory", "fine for a single short request, and a restart, a redeploy or a crash erases every round of progress with it."], ["Checkpoint to a log file on the sandbox itself", "cheap, and it dies with the container the moment that container gets rebuilt."]],
      pros: ["A rate limit error or a dropped connection costs a retry, not the whole task.", "Makes a task resumable from a different orchestrator process entirely, which matters for deploys."],
      cons: ["Checkpointing every round adds a write to the hot path of every single tool call.", "State that is stale by even one round can make the resumed loop repeat a step it already finished."],
      cost: "One small write per round, tens of kilobytes of state, against a session that can run for many minutes.",
      fails: "The model API returns a rate limit error on round 35 of 40. The session resumes from the last checkpoint and redoes two already-finished edits, because that checkpoint was one round stale.",
      say: "Once a task is billable and takes an hour, resuming beats restarting every time. That is the entire argument for this box." },

    { id: "ext-model", n: "Model API", r: "ext",
      job: "The actual LLM call: take the assembled context, return a plan or a tool call.",
      why: "It is the reasoning engine. Everything else in the diagram exists to feed it well and act on what it returns.",
      forced: "Stage 0, there is no version of this system that does not call a model.",
      alts: [["Self-host an open weight model", "cheaper per call at volume and it is now your team's job to keep it fast, available and current."], ["A smaller, cheaper model for easy rounds and a larger one for hard ones", "saves money on the easy rounds, and now the orchestrator has to decide which round is which, which is its own hard problem."]],
      pros: ["No infrastructure to run, patch or scale, someone else's problem entirely.", "Improves for free when the provider ships a better model, no redeploy needed."],
      cons: ["Every round is a network call outside your infrastructure, and its latency and uptime are now load-bearing for your product.", "You pay per token, so a wasteful context assembly step is a direct, visible cost on every invoice."],
      cost: "The bulk of the $0.50 to $2 per task, since it is called once per round for 20 to 60 rounds.",
      fails: "The provider has a slow degradation, not an outage, and every round takes eight seconds instead of two. A 40 round task that used to take five minutes now takes half an hour.",
      say: "This is the one box in the diagram you cannot make faster or cheaper by writing better code, only by sending it less and calling it less often." },

    { id: "store-index", n: "Repo index", r: "store",
      job: "Embeddings or symbol tables built ahead of time, so context assembly is a lookup, not a fresh scan of 5,000 files.",
      why: "Ranking what to include has to be fast, and re-parsing or re-embedding the whole repository on every round is far too slow to fit the round trip budget.",
      forced: "Stage 3, alongside the context service that queries it.",
      alts: [["Grep the repo fresh on every round", "correct and current, and a full-text scan of 5,000 files does not fit inside the round trip budget."], ["Only symbol tables, no embeddings", "cheap to build and fast to query, and it misses a request phrased in plain English with no matching identifier."]],
      pros: ["Turns context assembly into a lookup against something pre-built, which is what keeps it inside the round trip budget.", "Can be rebuilt incrementally as files change, instead of from scratch every session."],
      cons: ["Goes stale the moment a file changes after the index was built and before it is refreshed.", "Embedding a large repository is a real upfront cost, not a one-time free step."],
      cost: "A one-time embedding pass over the repository, then incremental updates as files change, cheap compared to rebuilding from scratch each session.",
      fails: "A teammate renames a core module an hour ago, the index has not refreshed, and the agent confidently edits a file path that no longer exists.",
      say: "Pre-built and slightly stale beats fresh and too slow to fit the round trip budget. That trade is the whole reason this box exists." },

    { id: "store-audit", n: "Audit log", r: "store",
      job: "A durable record of every tool call the sandbox actually executed, for every session.",
      why: "The moment this touches anything that looks like production, someone will eventually ask what the agent actually did to a specific repository on a specific day.",
      forced: "Stage 5, once multiple users' sessions ran concurrently against real infrastructure.",
      alts: [["Rely on the sandbox's own container logs", "cheap, and they vanish the moment that container is torn down at the end of a session."], ["Log only failures, not every call", "cuts storage, and the question you get asked is never just about the calls that failed."]],
      pros: ["Answers what did this agent do to my repository last Tuesday, with a specific command and a specific timestamp.", "Makes a bad session's changes diffable and reversible after the fact."],
      cons: ["Logging every tool call at scale is real, ongoing storage cost, not a one-time one.", "A log that nobody ever queries is pure cost with no return until the one day someone needs it."],
      cost: "A small write per tool call, at 20 to 60 calls per task times however many concurrent sessions, small per session and real in aggregate.",
      fails: "A sandboxed script deletes a directory it should not have. Without the audit log, nobody can tell whether it was the agent, a flaky test, or a human debugging at the same time.",
      say: "The audit log is what turns did the agent do something bad into an answerable question instead of a guess." }
  ],

  flowsIntro: "Draw the boxes, then narrate a full round out loud. This is the part that actually gets scored, because it is where hand waving becomes visible. For each step, know whether the loop is waiting on something or has already moved on.",

  flows: [
    { n: "One tool-call round",
      note: "This is the loop's basic unit, repeated 20 to 60 times in a real task. Everything before the sandbox call is spent deciding what the model even gets to see.",
      steps: [
        ["Client sends the task or the next message through the gateway, which checks auth and rate limits.", "sync"],
        ["The agent loop asks the context service to rank what belongs in this round: which files, which past turns.", "sync"],
        ["Context service looks up the repo index for the relevant files and symbols.", "sync"],
        ["The stable system prompt and tool schemas are served from cache; only the assembled context and new turn are sent fresh.", "sync"],
        ["The model API returns a plan, in this case a tool call: run the test suite.", "sync"],
        ["The agent loop checks the tool's risk tier, and since running tests is safe, dispatches to a sandbox worker without asking a human.", "sync"],
        ["The sandbox worker runs the command in its container and returns the result.", "sync"],
        ["The loop checkpoints the round to the session store before starting the next one.", "async"],
        ["The sandbox logs the executed command to the audit log.", "async"]
      ] },
    { n: "A risky edit, gated",
      note: "Same loop, except this round proposes something that cannot be cleanly undone. The human, not the model, gets the last word.",
      steps: [
        ["On round 12, the model proposes a tool call that deletes a directory before restructuring it.", "sync"],
        ["The agent loop classifies the tool call by risk tier and this one needs approval.", "sync"],
        ["The request goes back through the gateway to the client, which shows the human a diff and waits.", "sync"],
        ["The human approves it, the client sends confirmation back through the gateway.", "sync"],
        ["Only now does the loop dispatch the delete to the sandbox worker.", "sync"],
        ["The sandbox executes it, logs it to the audit log, and the loop checkpoints the round.", "async"]
      ] },
    { n: "Surviving a disconnect mid task",
      note: "Round 35 of an expected 40 is where a provider rate limit actually shows up. This is why stage 4 exists.",
      steps: [
        ["Round 35 of an expected 40 sends its context through the cache and the model API as usual.", "sync"],
        ["The model API returns a rate limit error instead of a response.", "sync"],
        ["The agent loop does not retry blindly. It reads the last checkpoint from the session store first.", "sync"],
        ["The checkpoint confirms rounds 1 through 34 are done, so the loop resumes from round 35 rather than round 1.", "sync"],
        ["Once the rate limit clears, the loop replays only the missing round, and the task finishes having paid for one retry, not forty.", "async"]
      ] }
  ],

  deep: [
    { n: "Where the 400 ms round trip budget actually goes", lang: "text",
      note: "A tool call is not just running a command, it is five steps that all have to happen before the command starts, and the target is that all five together cost under 400 ms.<br><br>Parse the model's function call arguments. Check the tool against its risk tier, and for a gated one, wait on approval, which does not count against this budget because it stops the clock rather than spending it. Dispatch to a sandbox worker, fast if a warm container is available, slow if one has to start cold. Hand the command to the container's shell. Marshal the result and hand it back into context for the next round.<br><br>Add it up and the warm path clears 400 ms with room to spare. The cold start path blows it by an order of magnitude, which is the entire argument for keeping a pool of warm containers per active session instead of starting one fresh on every call.",
      code:
"parse function call args         ~5 ms\n" +
"check risk tier                  ~2 ms   (gated tools pause here, clock stops)\n" +
"dispatch to sandbox worker   50-200 ms   (warm container)\n" +
"                            2000+  ms   (cold start, the one to avoid)\n" +
"hand off to container shell    10-20 ms\n" +
"marshal the result back          5-10 ms\n" +
"------------------------------------------------------------\n" +
"total, warm path               ~150 ms   comfortably under budget\n" +
"total, cold path              ~2200 ms   the budget blown by 5x" },

    { n: "Why ranking context beats stuffing it", lang: "text",
      note: "A repository of 5,000 files at a modest 300 tokens each is 1.5 million tokens. The largest single turn in this design budgets 150,000, about 10% of the repository. Ranking is not an optimisation on top of a working system, it is the only reason a working system exists at all.<br><br>What actually gets scored: files the current diff touches, symbols named in the last tool result (a stack trace names a file, that file jumps to the top), and anything the human named directly this turn. Recency of edit counts for more than alphabetical proximity ever will.<br><br>The failure mode is not obscure. Score by keyword match alone, and a file called test_utils.py that is imported everywhere outranks the three line config file the task actually needed to change.",
      code:
"repo:            5,000 files x ~300 tok avg = 1.5M tokens\n" +
"turn budget:     150,000 tokens max\n" +
"share that fits: 150,000 / 1,500,000 = 10%\n" +
"\n" +
"score(file) = w1 x (touched by current diff)\n" +
"            + w2 x (named in last tool result)\n" +
"            + w3 x (named by the human this turn)\n" +
"            - w4 x (tokens, bigger files cost more to include)\n" +
"take the top files until the budget runs out" }
  ],

  tradeoffsIntro: "Say the pair, pick a side, then say what would flip it. Anyone can state a preference, the flip is what proves it is a reasoned choice.",

  tradeoffs: [
    { a: ["A container per session", "Strong isolation, one session's bad command cannot touch another's files or another user's secrets."],
      b: ["A shared sandbox pool, no per-session container", "Cheaper to keep warm, and one session's resource spike or leftover state can bleed into the next session that reuses it."],
      pick: "a",
      flip: "sessions are extremely short-lived and trusted, for example an internal tool used by one team on one repo. Then a shared pool with careful cleanup between uses is a defensible cost saving." },
    { a: ["Auto-execute every tool call", "The loop never stalls waiting on a human, so a 40 round task actually runs in minutes instead of across a whole afternoon."],
      b: ["Gate risky tools behind human approval", "Slower, and it is the only thing standing between a bad plan and a deleted directory or a leaked secret."],
      pick: "b",
      flip: "the tool itself is provably safe to fully reverse, for example editing inside a scratch branch that is never merged without a separate review. Then auto-execute even the edit." },
    { a: ["Rank context fresh every round from the live repo", "Always current, and re-scanning 5,000 files every round does not fit inside the round trip budget."],
      b: ["Rank against a pre-built index, refreshed periodically", "Fast enough to fit the budget, and it can be stale by however long since the last refresh."],
      pick: "b",
      flip: "the repository changes so fast, many commits an hour, that staleness itself becomes the bigger risk than the latency cost of scanning fresh." },
    { a: ["Checkpoint every round", "A disconnect loses at most one round of work, and the write cost is tiny per round."],
      b: ["Checkpoint only at natural milestones, like after a passing test run", "Fewer writes, and a crash between milestones can lose several rounds of real work."],
      pick: "a",
      flip: "the checkpoint write itself becomes the bottleneck, for example a session state so large that serializing it costs more than the round it is protecting." }
  ],

  next: [
    "<b>Per-tool risk tiers.</b> Right now approval is roughly binary. A real system grades read, edit and shell execution differently, and grades a shell command by what it actually touches.",
    "<b>Sub-agents for parallel work.</b> A large refactor split across independent files can run several loops at once, each with its own sandbox and its own slice of context.",
    "<b>Diff and rollback for a whole session.</b> Nothing here lets you undo everything one session did to a repo in one action, the natural next ask once this runs against anything that matters.",
    "<b>Smarter context eviction.</b> Right now ranking happens fresh each round. A cache-aware version would only re-rank what changed since the last round instead of starting over."
  ],

  p: [
    ["SRC", "https://modelcontextprotocol.io/", "Model Context Protocol, the tool-calling standard", "M"],
    ["SRC", "https://docs.anthropic.com", "Anthropic docs, tool use and agents", "M"],
    ["SRC", "https://github.com/BerriAI/litellm", "LiteLLM, one interface across model providers", "E"],
    ["SRC", "https://www.helicone.ai/", "Helicone, observability for LLM calls", "E"],
    ["SRC", "https://docs.ragas.io/", "Ragas, evaluating what an agent retrieves", "M"],
    ["SRC", "https://www.hellointerview.com/learn/system-design", "Hello Interview, system design fundamentals", "M"],
    ["SRC", "https://arxiv.org/abs/2211.17192", "Speculative decoding, why model calls get faster", "H"]
  ],

  hi: {
    one: "Yahan har decision ek hi shape se nikalta hai: ek tool call sandbox se ghumkar aata hai, aur model ko repository ka sirf wahi chhota hissa dikhta hai jise context service ne is round ke tokens ke laayak samjha.",

    brief: {
      why: "Sab isse model ko loop mein call karna samajhte hain, aur woh loop toh easy 5% hai. Asli mushkil yeh hai ki ek real repository kabhi prompt mein fit nahi hoti, isliye zyadatar engineering is faisle mein jaati hai ki is round model ko kya dikhana hai. Doosri mushkil: model ka function call ek request hai, intent ki guarantee nahi. Ise blindly maan lena reckless hai, aur har ek call par human ka intezaar karna poora point hi khatam kar deta hai.",
      functional: [
        "<b>Codebase ke baare mein multi-turn conversation chalao.</b> Sawaalon ke jawab do, plan propose karo, aur pichhle kai turns context mein rakho taaki dozens of rounds tak baat coherent rahe.",
        "<b>Tool calls propose karo aur execute karo.</b> File padhna, repo mein search, file edit, shell command, test suite chalana, sab ek hi sandboxed path se.",
        "<b>Risky calls ko gate karo.</b> File read apne aap chal jaata hai. Jo command delete kare, deploy kare ya sandbox ke bahar kuch chhue, woh human ke yes ka wait karta hai.",
        "<b>Disconnect ya rate limit se bach ke nikalo.</b> Itna state checkpoint karo ki connection girne par ek retry lage, pehle ke chalis rounds ka kaam nahi."
      ],
      out: ["ek hi session par multi-user real-time collaboration", "IDE ka UI render karna", "model ko train ya fine-tune karna", "task khatam hone ke baad bhi rehne wali long-term memory", "team ke liye billing aur seat management"],
      nfr: [
        ["Tool round trip overhead", "under 400 ms before the sandboxed command runs", "Slow round trip ek bura experience nahi hai, yeh ek tax hai jo ek hi task mein 20 se 60 baar bharna padta hai."],
        ["Context per turn", "50,000 to 150,000 tokens assembled per round", "Is budget ko ek aisi repository cover karni hai jisme kabhi ek saath hold hone se kahin zyada content hai."],
        ["Task continuity", "resumes after a disconnect without redoing finished rounds", "40 mein se round 35 par rate limit error ka matlab ek retry hona chahiye, poora task dobara nahi."],
        ["Blast radius per tool call", "contained to one sandboxed container", "Function call model ki request hai, guarantee nahi, aur sandbox hi ise honour karna safe banata hai."],
        ["Session cost", "$0.50 to $2 in model calls for one real task", "Isme se zyadatar khud model call ka kharcha hai, isliye bill asal mein context assembly step par control hota hai."]
      ],
      numbers: [
        ["Repository size", "5,000+ files", "Kisi bhi context window mein fit hone se kahin zyada, aur yahi woh constraint hai jiske around baaki har stage bana hai."],
        ["Context per turn", "50,000 to 150,000 tokens", "Kuch files aur recent turns ke liye kaafi, poori repository ek saath ke liye bilkul nahi."],
        ["Tool round trip budget", "under 400 ms of overhead", "Sandboxed command chalne se pehle ka sab kuch: call parse karna, uska risk tier check karna, container tak dispatch karna."],
        ["Rounds in a real task", "20 to 60 tool-call rounds", "Ek asli refactor kai files chhuta hai aur zyadatar edits ke baad test run bhi chahiye."],
        ["Session cost", "$0.50 to $2 in model calls", "Zyadatar model API ka kharcha, jo task ke har round ke liye ek baar bharna padta hai."],
        ["Tokens reprocessed without a cache", "roughly 6 million a session", "150,000 token ka stable prefix 40 rounds mein dobara bheja gaya, yahi woh exact bill hai jise stage 2 ka cache mita deta hai."]
      ],
      numbersNote: "Do facts poore design ko chalate hain. <b>Ek turn mein 150,000 tokens</b> ka matlab hai ki model ko poori repository kabhi nahi dikhti, sirf woh dikhta hai jo rank hokar andar aaya. <b>20 se 60 rounds</b> ka matlab hai ki beech mein crash hona lagbhag routine hai, koi rare event nahi."
    },

    stagesIntro: "Chhe stages. Stage 0 woh version hai jo sach mein ek sawaal ka jawab deta hai, us repository ke liye jo itni chhoti hai ki ek prompt mein paste ho jaaye. Iske baad har stage isliye hai kyunki real load mein ek specific cheez toot gayi, isliye nahi ki bada diagram zyada impressive lagta hai.",

    stages: [
      { pressure: "Abhi kuch nahi toota, aur yahi point hai. Yeh sabse chhota version hai jo ek chhoti codebase ke baare mein sawaal ka jawab de sake, poori cheez prompt mein thoos kar aur phir puchh kar.",
        say: "Code ke baare mein baat karne wali sabse chhoti cheez: ek loop, har turn par ek model call, aur poori repository prompt mein paste. Iske baad jo bhi add karunga, use is simplicity ke against khud ko justify karna padega.",
        breaks: "Das files ki toy repo ke liye chalta hai. Ek real 5,000-file repository context window ko turant fod deti hai, aur model sirf text mein change describe kar sakta hai, file padh nahi sakta aur kuch chala nahi sakta." },

      { pressure: "Ab model function calling ke through action request kar sakta hai. Us action ko orchestrator ke hi process mein chalane ka matlab hai ki ek bhi bura tool call, jaise stray rm -rf ya leaked secret, seedha host machine ko nuksan pahuncha sakta hai.",
        say: "Function calling plus sandbox: model propose karta hai, sandbox execute karta hai, aur dono kabhi ek process share nahi karte. Ab ek bura command sirf ek aise container ko damage kar sakta hai jo waise bhi phenkne wala hai.",
        breaks: "Side effects ab sandbox mein contained hain. Har call ke liye ek sandbox uthane mein real seconds lagte hain, aur orchestrator har turn par wahi file contents aur tool schemas dobara bhejta hai, isliye har round ke saath cost badhti jaati hai." },

      { pressure: "System prompt aur tool schema list session ke har turn par ek jaisi hoti hai. Unhe har baar full price par dobara process karna us cheez par paisa phoonkna hai jo kabhi badli hi nahi.",
        say: "Woh prefix cache karo jo kabhi nahi badalta: system prompt, tool schemas. Ise sahi rakhne mein kuch kharcha nahi, aur poore design ki sabse sasti jeet yahi hai.",
        breaks: "Repeated turns ab sasti hain. Par orchestrator abhi bhi poori repository ya poori conversation history context mein thoos deta hai, aur yeh ek real task ke liye scale nahi karta." },

      { pressure: "Poori repository ya poori history context mein dump karna mehenga hai. Ek point ke baad model ke liye yeh actively bura ho jaata hai, kyunki uska zyadatar hissa current step ke liye irrelevant hota hai.",
        say: "Ranking ek chalte hue system par optimisation nahi hai, yahi woh cheez hai jo 150,000 token ke budget ko 5,000 file ki repository cover karne laayak banati hai.",
        breaks: "Ek well-scoped turn ab achha chalta hai. Par dozens of turns wala lamba task abhi bhi crash, disconnect ya rate limit error se bach nahi sakta, aur ab tak ka saara kaam kho deta hai." },

      { pressure: "Ek real task mein 20 se 60 tool call rounds lagte hain. Itna lamba ki network blip ya provider ka rate limit lagbhag routine ho jaata hai. Jab kaam billable hai, to ek blip se sab kho dena acceptable nahi.",
        say: "Har round session store mein checkpoint karo. 40 mein se round 35 par rate limit error ka matlab ek retry hona chahiye, poora task nahi.",
        breaks: "Task ab disconnect ke baad cleanly resume hota hai. Par system abhi yeh nahi bata sakta ki pichhle mangalwar is agent ne meri repository ke saath asal mein kya kiya, aur jaise hi yeh production jaisi cheez chhuta hai, yeh matter karne lagta hai." },

      { pressure: "Ab yeh kai users ke sessions ko real infrastructure ke against concurrently chalata hai. API level auth aur rate limiting, aur sandbox ne jo bhi tool call execute kiya uska durable record, ab optional nahi rahe.",
        say: "Auth aur rate limits front door par chale gaye, aur har executed tool call ek aise log mein likha jaata hai jise koi chupke se kho na sake. Multi-tenant aur auditable ek hi requirement ke do side hain." }
    ],

    boxesIntro: "Das components. Har ek ke liye: kis pressure ne ise zaroori banaya, kaun argument haara, iski cost kya hai, aur raat ke teen baje yeh kaise fail hota hai. Agar sirf ek column yaad rakhna hai to aakhri wala rakho. Apne hi failure modes ka naam le paana un logon ko alag karta hai jinhone aisa system chalaya hai un logon se jinhone sirf padha hai.",

    boxes: [
      { job: "CLI ya IDE extension jisme developer asal mein type kar raha hai.",
        why: "Kisi ko conversation hold karni hai, landing se pehle diffs dikhane hain, aur human ko ek specific command par no bolne dena hai.",
        forced: "Kisi ne force nahi kiya, har stage ko ek jagah chahiye jahan se request aaye. Isliye draw kiya gaya kyunki risky command ka approval prompt yahin rehta hai, aur us boundary ka naam jaldi lena worth hai.",
        alts: [["Leaving the client off the diagram", "har integrator ko apna approval UI khud invent karna padta hai, aur jo use skip karte hain unhi ki bad rm wali kahani banti hai."]],
        pros: ["Risky decision, yaani yeh command approve karo ya nahi, human ke paas rehta hai, server-side policy file mein dabta nahi.", "Landing se pehle diff dikha sakta hai, jo tool call chalne se pehle hi zyadatar bad edits pakad leta hai."],
        cons: ["Har client (CLI, IDE plugin, web) ko wahi approval aur diff rendering dobara implement karni padti hai.", "Jo client clicks bachane ke liye sab kuch auto-approve kar deta hai, woh wahi ek safety mechanism tod deta hai jiske liye woh bana tha."],
        cost: "Zero infrastructure, ek UI decision jo har integration par ek baar liya jaata hai.",
        fails: "Ek developer demo se pehle tez chalne ke liye auto-approve on kar deta hai, agent galat database par migration script chala deta hai, aur client ne kabhi poocha hi nahi.",
        say: "Client woh jagah hai jahan consent rehta hai. Us consent ko server par le jaao aur tumne aisa system bana diya jo kisi ki repo par bina us insaan ke loop mein hue act kar sakta hai." },

      { job: "Har client ke liye ek address, aur request orchestrator tak pahunchne se pehle auth aur rate limits.",
        why: "Jab ek se zyada users ke sessions concurrently chalte hain, to kisi ko batana padta hai ki yeh request kaun hai aur ek client ko baaki sabko starve karne se rokna padta hai.",
        forced: "Stage 5, kai users ke sessions shared infrastructure par concurrently chal rahe hain.",
        alts: [["Auth and rate limiting inside the agent loop itself", "ek user ke liye chalta hai, aur security concern ko usi process se jod deta hai jo tool calls plan karne mein busy hai."], ["A generic reverse proxy with no session awareness", "TLS aur routing handle karta hai, par use pata nahi hota ki ek hi client ek saath das sandboxes khol raha hai."]],
        pros: ["Auth ek baar terminate hota hai, isliye iske peeche ka har service forward ki gayi identity par bharosa kar sakta hai.", "Rate limits per API key hote hain, isliye ek runaway loop box ke baaki saare sessions ko starve nahi kar sakta."],
        cons: ["Ek hop aur ek component jodta hai jiski apni availability ab matter karti hai.", "Meaningfully rate limit karne ke liye session ke baare mein itna pata hona chahiye (kaunsa sandbox, kaunsa budget), sirf requests gin lena kaafi nahi."],
        cost: "Managed gateway sasta hai. Asli cost yeh hai ki rate limit rules session aur token spend par key hon, sirf requests per second par nahi.",
        fails: "Ek leaked API key raat bhar mein 200 concurrent sessions khol deti hai, har ek sandbox uthata hai aur model API call karta hai, aur bill kisi ke dekhne se pehle aa jaata hai.",
        say: "Auth aur quota front door par rehte hain, us loop ke andar nahi jo abhi yeh decide karne mein busy hai ki agli kaunsi file edit karni hai." },

      { job: "Current state observe karo, agla step plan karo, tool call karke act karo, phir repeat.",
        why: "Kisi ko loop ka control flow hold karna hai: pichhli baar kya hua, agla kya try karna hai, aur task asal mein kab khatam hua.",
        forced: "Stage 0, kuch aur exist karne se pehle yahi poora system hai.",
        alts: [["A single giant prompt with no loop", "code ke baare mein sawaal ka jawab deta hai, par edit nahi kar sakta, test nahi chala sakta aur edit ka kya asar hua yeh dekh kar react nahi kar sakta."], ["A fixed pipeline of scripted steps", "predictable aur fast hai, par sirf wahi tasks handle karta hai jinke baare mein kisi ne socha tha. Real refactor ka rasta pehle se kisi ne likha nahi hota."]],
        pros: ["Itna general hai ki aise task ko bhi attempt kar sakta hai jiske liye kisi ne script nahi likhi.", "Har round mein woh dekh kar react kar sakta hai ki pichhle tool call ne asal mein kya return kiya, andhe hokar plan follow nahi karta."],
        cons: ["Loops bhatak sakte hain: unsure model kabhi kabhi naya kuch try karne ki jagah fail hui approach dohrata rehta hai.", "Har round ek model call hai, isliye inefficient loop sirf slow nahi, seedha dollar cost hai."],
        cost: "Har round par ek model call, aur ek real task mein 20 se 60 hote hain. Session ke $0.50 se $2 ka zyadatar hissa yahin kharch hota hai.",
        fails: "Model failed edit ke baad ek hi file baar baar padhta rehta hai, bina progress ke 40 rounds jala deta hai, aur timeout ke kill karne se pehle session cost teen guna ho jaati hai.",
        say: "Loop hi product hai. Is diagram ki baaki har cheez observe, plan, act ke ek iteration ko sasta, safe ya progress karne ke zyada laayak banane ke liye hai." },

      { job: "Stable prefix, yaani system prompt aur tool schemas, yaad rakho taaki har round dobara process na ho.",
        why: "System prompt aur tool list session ke har turn par ek jaisi hoti hai. Har round unhe full price par dobara padhna us cheez par paisa kharch karna hai jo kabhi badli nahi.",
        forced: "Stage 2, jab loop har round wahi tool schemas aur instructions dobara bhej raha tha.",
        alts: [["No caching, resend everything every round", "samajhne mein sabse simple, aur jo content kabhi nahi badalta uski cost rounds ke saath linearly badhti hai."], ["Cache the whole conversation, not just the stable prefix", "zyada bachata hai, par transcript mein pehle ki kisi bhi cheez ke edit par invalidate ho jaata hai, jo lagatar hota rehta hai."]],
        pros: ["Baar baar aane wali fixed cost ko session mein ek baar wali cost bana deta hai.", "Lambe sessions ko financially viable banata hai, kyunki round 40 ki cost round 1 ka ek hissa hai."],
        cons: ["Sirf prompt ke us hisse ko help karta hai jo bilkul same rehta hai, isliye session ke beech system prompt badalne se cache bust ho jaata hai.", "Ek aisa component jodta hai jiske hit rate ko monitor karna padta hai, kyunki chupke se hua miss bill ko teen guna kar deta hai."],
        cost: "Cached tokens fresh tokens se bahut sasta hote hain. 5,000 token ke stable prefix wale 40 round ke task par yeh ise ek baar bharne aur 40 baar bharne ka farak hai.",
        fails: "Koi bug fix karne ke liye session ke beech system prompt edit kar deta hai. Cache uske baad har round par chupke se miss karta hai, aur invoice galat dikhne tak kisi ko pata nahi chalta.",
        say: "Prompt ka woh hissa cache karo jo kabhi nahi badalta. Poore design ki sabse sasti optimisation yahi hai aur ise sahi rakhne mein kuch kharcha nahi." },

      { job: "Decide karo ki is round ke tokens ke laayak kaunsi files, pichhle turns aur search results hain.",
        why: "Ek turn mein 50,000 se 150,000 tokens aate hain aur ek real repository usse kahin zyada hold karti hai, isliye kisi ko choose karna padega.",
        forced: "Stage 3, jab poori repository ya poori history thoosna sirf mehenga hone se badh kar model ko kharab karne laga.",
        alts: [["Stuff everything that fits and truncate the rest", "simple hai, par relevance ke hisaab se nahi, position ke hisaab se truncate karta hai, isliye kaam ki file hi kat sakti hai."], ["Let the model ask for files by name with no ranking", "tab chalta hai jab model ko file ka naam pehle se pata ho, aur 5,000 file ki repo mein aksar nahi pata hota."]],
        pros: ["Har round ka context sirf us cheez tak rakhta hai jo current step ke liye relevant hai, jo kabhi chhui gayi woh sab nahi.", "Orchestrator se alag scale hota hai, isliye ranking logic loop ko chhue bina improve ho sakta hai."],
        cons: ["Ranking ek judgment call hai aur kharab rank chupke se wahi ek file gira deta hai jo matter karti thi.", "Har round ke hot path par ek lookup jodta hai, jo 400 ms tool round trip budget se compete karta hai."],
        cost: "Har round repo index par ek embedding ya symbol lookup, us model call ke muqabley sasta jise yeh feed karta hai.",
        fails: "Ranker ek config file ko low score deta hai kyunki woh kam badalti hai. Agent us config ko padhne wala code edit kar deta hai bina current values dekhe, aur fix production tod deta hai.",
        say: "Relevance ranking nice to have nahi hai, yahi woh cheez hai jo 150,000 token ke budget ko 5,000 file ki repository cover karne laayak banati hai." },

      { job: "Asli command, edit ya test ek aise container mein chalao jo host se aur doosre sessions se isolated ho.",
        why: "Model ka function call ek request hai, intent ki guarantee nahi. Ek bhi bura call, stray rm ya leaked secret, host machine tak nahi pahunchna chahiye.",
        forced: "Stage 1, jis pal model action describe karne ki jagah request kar sakta tha.",
        alts: [["Run tool calls in the same process as the orchestrator", "sabse fast, aur ek bura command seedha host machine tak pahunchta hai, jo bilkul wahi failure hai jise rokne ke liye yeh box hai."], ["A shared sandbox across many sessions", "warm rakhna sasta hai, par ek session ki file writes ya resource spike doosre ke task par asar daal sakti hai."], ["A VM instead of a container", "isolation zyada strong hai, par startup cost seconds ka hai, container ke sub-second ke muqabley."]],
        pros: ["Kisi bhi ek tool call ka blast radius ek disposable container tak seemit rakhta hai.", "Agar task ise bad state mein chhod de to ise kill karke cleanly dobara bana sakte hain."],
        cons: ["Har session ke liye ek uthane mein real seconds lagte hain, jo seedha 400 ms round trip budget mein dikhta hai.", "Ek container per session infrastructure cost ko requests se nahi, concurrent sessions se multiply karta hai."],
        cost: "Cold start mein kuch sau milliseconds, aur warm hone par aur session ke 20 se 60 rounds mein reuse hone par lagbhag zero.",
        fails: "Traffic spike mein container pool khatam ho jaata hai, naye sessions sandbox ke liye queue mein lag jaate hain, aur 400 ms round trip budget chupke se chaar seconds ban jaata hai.",
        say: "Sandbox woh cheez hai jo tumhe tool call ko padhe bina yes bolne deti hai. Iske bina har function call ek trust decision hai." },

      { job: "Loop ka state checkpoint karo, kya chala, kya succeed hua, plan abhi kya hai, taaki crash use mita na sake.",
        why: "Ek real task mein 20 se 60 rounds lagte hain, itna lamba ki disconnect ya rate limit error rare se zyada routine ke kareeb hai.",
        forced: "Stage 4, jab real, billable kaam karne wala task ek network blip ke baad round zero se restart karna afford nahi kar sakta tha.",
        alts: [["Keep state only in the orchestrator's memory", "ek chhoti single request ke liye theek hai, aur restart, redeploy ya crash saare rounds ki progress ko saath mita deta hai."], ["Checkpoint to a log file on the sandbox itself", "sasta hai, par container ke rebuild hote hi yeh uske saath mar jaata hai."]],
        pros: ["Rate limit error ya girta connection ek retry mein nipatata hai, poore task mein nahi.", "Task ko bilkul alag orchestrator process se resume karne layak banata hai, jo deploys ke liye matter karta hai."],
        cons: ["Har round checkpoint karne se har tool call ke hot path par ek write jud jaata hai.", "Sirf ek round bhi stale state resumed loop ko wo step dohrane par majboor kar sakti hai jo woh pehle hi kar chuka tha."],
        cost: "Har round ek chhoti write, tens of kilobytes ka state, ek aise session ke against jo kai minutes chal sakta hai.",
        fails: "Model API 40 mein se round 35 par rate limit error deta hai. Session last checkpoint se resume hota hai aur do already-finished edits dobara karta hai, kyunki woh checkpoint ek round stale tha.",
        say: "Jab task billable ho aur ghante bhar chale, to resume karna har baar restart karne se behtar hai. Is box ka poora argument yahi hai." },

      { job: "Asli LLM call: assembled context lo, ek plan ya tool call return karo.",
        why: "Yeh reasoning engine hai. Diagram ki baaki har cheez ise achhe se feed karne aur jo yeh return kare us par act karne ke liye hai.",
        forced: "Stage 0, aisa koi version nahi hai jo model call na kare.",
        alts: [["Self-host an open weight model", "volume par har call sasti hai, aur ab ise fast, available aur current rakhna aapki team ka kaam hai."], ["A smaller, cheaper model for easy rounds and a larger one for hard ones", "easy rounds par paisa bachta hai, aur ab orchestrator ko decide karna padta hai ki kaunsa round kaisa hai, jo khud ek mushkil problem hai."]],
        pros: ["Chalane, patch karne ya scale karne ke liye koi infrastructure nahi, poori tarah kisi aur ki problem.", "Provider behtar model ship kare to free mein improve hota hai, redeploy ki zaroorat nahi."],
        cons: ["Har round aapke infrastructure ke bahar ek network call hai, aur uski latency aur uptime ab aapke product ke liye load-bearing hain.", "Per token pay karna padta hai, isliye wasteful context assembly step har invoice par seedha, dikhne wali cost hai."],
        cost: "Per task ke $0.50 se $2 ka bada hissa, kyunki yeh 20 se 60 rounds mein har round ek baar call hota hai.",
        fails: "Provider mein outage nahi, slow degradation aata hai, aur har round do ki jagah aath seconds leta hai. 40 round ka task jo paanch minute mein hota tha ab aadha ghanta leta hai.",
        say: "Yeh diagram ka ekmatra box hai jise behtar code likh kar fast ya sasta nahi banaya ja sakta, sirf ise kam bhej kar aur kam baar call karke." },

      { job: "Pehle se bane embeddings ya symbol tables, taaki context assembly ek lookup ho, 5,000 files ka fresh scan nahi.",
        why: "Kya include karna hai yeh ranking fast honi chahiye, aur har round poori repository ko re-parse ya re-embed karna round trip budget mein fit hone ke liye bahut slow hai.",
        forced: "Stage 3, us context service ke saath jo ise query karti hai.",
        alts: [["Grep the repo fresh on every round", "correct aur current hai, par 5,000 files ka full-text scan round trip budget mein fit nahi hota."], ["Only symbol tables, no embeddings", "banana sasta aur query karna fast hai, par plain English mein likhi request miss ho jaati hai jisme koi matching identifier nahi hota."]],
        pros: ["Context assembly ko pehle se bani cheez par lookup bana deta hai, jo ise round trip budget ke andar rakhta hai.", "Files badalne par incrementally rebuild ho sakta hai, har session scratch se nahi."],
        cons: ["Index banne ke baad aur refresh hone se pehle jaise hi file badalti hai, yeh stale ho jaata hai.", "Badi repository ko embed karna ek real upfront cost hai, ek baar wala free step nahi."],
        cost: "Repository par ek baar ka embedding pass, phir files badalne par incremental updates, har session scratch se rebuild karne ke muqabley sasta.",
        fails: "Ek teammate ghante bhar pehle ek core module rename kar deta hai, index refresh nahi hua, aur agent confidently ek aisi file path edit karta hai jo ab exist hi nahi karti.",
        say: "Pehle se bana aur thoda stale, fresh aur itna slow se behtar hai jo round trip budget mein fit na ho. Yahi trade is box ke hone ki poori wajah hai." },

      { job: "Har session mein sandbox ne asal mein jo bhi tool call execute kiya uska durable record.",
        why: "Jaise hi yeh production jaisi kisi cheez ko chhuta hai, koi na koi eventually poochega ki agent ne kisi specific din kisi specific repository ke saath asal mein kya kiya.",
        forced: "Stage 5, jab kai users ke sessions real infrastructure ke against concurrently chal rahe the.",
        alts: [["Rely on the sandbox's own container logs", "sasta hai, par session ke end mein container girte hi woh gayab ho jaate hain."], ["Log only failures, not every call", "storage kam hota hai, par jo sawaal poocha jaata hai woh kabhi sirf fail hue calls ke baare mein nahi hota."]],
        pros: ["Jawab deta hai ki pichhle mangalwar is agent ne meri repository ke saath kya kiya, ek specific command aur ek specific timestamp ke saath.", "Kharab session ke changes ko baad mein diffable aur reversible banata hai."],
        cons: ["Scale par har tool call log karna real, ongoing storage cost hai, ek baar wali nahi.", "Jo log koi kabhi query nahi karta woh pure cost hai, jab tak wo ek din aa jaye jab kisi ko iski zaroorat pade."],
        cost: "Har tool call par ek chhoti write, har task mein 20 se 60 calls ko jitne bhi concurrent sessions hon unse multiply karke, per session chhoti aur aggregate mein real.",
        fails: "Ek sandboxed script ek aisi directory delete kar deti hai jo nahi karni chahiye thi. Audit log ke bina koi nahi bata sakta ki agent ne kiya, kisi flaky test ne, ya usi waqt debug kar rahe kisi human ne.",
        say: "Audit log woh cheez hai jo kya agent ne kuch bura kiya ko ek guess se badal kar ek answerable sawaal bana deti hai." }
    ],

    flowsIntro: "Boxes draw karo, phir ek poora round zor se bolkar narrate karo. Asli scoring isi hisse mein hoti hai, kyunki yahin hand waving dikhne lagti hai. Har step ke liye jaano ki loop kisi cheez ka wait kar raha hai ya aage badh chuka hai.",

    flows: [
      { n: "Ek tool-call round",
        note: "Yeh loop ki basic unit hai, jo ek real task mein 20 se 60 baar repeat hoti hai. Sandbox call se pehle ka sab kuch is faisle mein jaata hai ki model ko kya dikhega.",
        steps: [
          ["Client task ya agla message gateway se bhejta hai, jo auth aur rate limits check karta hai."],
          ["Agent loop context service se poochta hai ki is round mein kya jaana chahiye: kaunsi files, kaunse pichhle turns."],
          ["Context service relevant files aur symbols ke liye repo index mein lookup karti hai."],
          ["Stable system prompt aur tool schemas cache se aate hain; sirf assembled context aur naya turn fresh bheja jaata hai."],
          ["Model API ek plan return karta hai, jo yahan ek tool call hai: run the test suite."],
          ["Agent loop tool ka risk tier check karta hai, aur kyunki tests chalana safe hai, bina human se puchhe sandbox worker ko dispatch kar deta hai."],
          ["Sandbox worker command ko apne container mein chalata hai aur result return karta hai."],
          ["Loop agla round shuru karne se pehle is round ko session store mein checkpoint karta hai."],
          ["Sandbox executed command ko audit log mein log karta hai."]
        ] },
      { n: "Ek risky edit, gated",
        note: "Wahi loop, sirf is round mein aisi cheez propose hui hai jo cleanly undo nahi ho sakti. Aakhri baat model ki nahi, human ki hoti hai.",
        steps: [
          ["Round 12 par model ek tool call propose karta hai jo restructure karne se pehle ek directory delete karta hai."],
          ["Agent loop tool call ko risk tier se classify karta hai aur ise approval chahiye."],
          ["Request gateway se hokar wapas client tak jaati hai, jo human ko diff dikhata hai aur wait karta hai."],
          ["Human approve karta hai, client confirmation gateway ke through wapas bhejta hai."],
          ["Ab jaakar loop delete ko sandbox worker ko dispatch karta hai."],
          ["Sandbox ise execute karta hai, audit log mein log karta hai, aur loop round ko checkpoint karta hai."]
        ] },
      { n: "Task ke beech disconnect se bachna",
        note: "Expected 40 mein se round 35 wahi jagah hai jahan provider ka rate limit asal mein dikhta hai. Isi liye stage 4 hai.",
        steps: [
          ["Expected 40 mein se round 35 apna context hamesha ki tarah cache aur model API se bhejta hai."],
          ["Model API response ki jagah rate limit error return karta hai."],
          ["Agent loop andhe hokar retry nahi karta. Pehle session store se last checkpoint padhta hai."],
          ["Checkpoint confirm karta hai ki rounds 1 se 34 ho chuke hain, isliye loop round 1 ki jagah round 35 se resume karta hai."],
          ["Rate limit clear hote hi loop sirf missing round dobara chalata hai, aur task ek retry ki cost par khatam hota hai, chalis ki nahi."]
        ] }
    ],

    tradeoffsIntro: "Pair bolo, ek side pick karo, phir bolo ki kya use flip kar dega. Preference toh koi bhi bata sakta hai, flip hi saabit karta hai ki yeh soch-samajh kar liya gaya choice hai.",

    tradeoffs: [
      { a: ["A container per session", "Strong isolation, ek session ka bura command kisi doosre ki files ya kisi doosre user ke secrets ko chhu nahi sakta."],
        b: ["A shared sandbox pool, no per-session container", "Warm rakhna sasta hai, par ek session ka resource spike ya bacha hua state usi ko reuse karne wale agle session mein bleed ho sakta hai."],
        flip: "sessions bahut chhote-jeevi aur trusted hon, jaise ek team ka ek repo par internal tool. Tab use ke beech careful cleanup ke saath shared pool ek defensible cost saving hai." },
      { a: ["Auto-execute every tool call", "Loop kabhi human ke wait mein atakta nahi, isliye 40 round ka task poori dopahar ki jagah minutes mein chal jaata hai."],
        b: ["Gate risky tools behind human approval", "Slow hai, aur bure plan aur deleted directory ya leaked secret ke beech yahi ek akeli cheez khadi hai."],
        flip: "tool khud provably poori tarah reversible ho, jaise ek scratch branch ke andar edit karna jo alag review ke bina kabhi merge nahi hoti. Tab edit ko bhi auto-execute karo." },
      { a: ["Rank context fresh every round from the live repo", "Hamesha current, par har round 5,000 files dobara scan karna round trip budget mein fit nahi hota."],
        b: ["Rank against a pre-built index, refreshed periodically", "Budget mein fit hone laayak fast, aur last refresh ke baad jitna waqt gaya utna stale ho sakta hai."],
        flip: "repository itni tezi se badalti ho, ghante mein kai commits, ki staleness khud fresh scan ki latency cost se bada risk ban jaaye." },
      { a: ["Checkpoint every round", "Disconnect par zyada se zyada ek round ka kaam jaata hai, aur per round write cost bahut chhoti hai."],
        b: ["Checkpoint only at natural milestones, like after a passing test run", "Kam writes, aur milestones ke beech crash hone par kai rounds ka real kaam ja sakta hai."],
        flip: "checkpoint write khud bottleneck ban jaaye, jaise itna bada session state ki use serialize karna us round se zyada mehenga pade jise woh protect kar raha hai." }
    ],

    next: [
      "<b>Per-tool risk tiers.</b> Abhi approval lagbhag binary hai. Ek real system read, edit aur shell execution ko alag grade karta hai, aur shell command ko is baat se grade karta hai ki woh asal mein kya chhuta hai.",
      "<b>Parallel kaam ke liye sub-agents.</b> Independent files par baanta hua bada refactor kai loops ek saath chala sakta hai, har ek apne sandbox aur context ke apne hisse ke saath.",
      "<b>Poore session ka diff aur rollback.</b> Yahan aisa kuch nahi jo ek session ne repo ke saath jo kiya woh sab ek action mein undo kar de, jo agla natural sawaal hai jaise hi yeh kisi matter karne wali cheez par chale.",
      "<b>Smarter context eviction.</b> Abhi ranking har round fresh hoti hai. Ek cache-aware version sirf woh re-rank karega jo pichhle round ke baad badla, scratch se shuru nahi karega."
    ]
  }
},

{
  id: "llm-inference-serving", kind: "hld", n: "LLM inference serving", sub: "vLLM, TGI, a hosted model API",
  tags: ["the GPU is the expensive resource", "batching is the whole game", "quadratic attention, linear memory"],
  one: "Every decision here falls out of one fact: a GPU costs about the same per hour whether it serves one request or fifty, so keeping it full of concurrent work is the entire game, and the second fact is that the key-value cache, not the model weights, is what actually runs out first when you try to play that game well.",

  brief: {
    why: "This problem looks like a hosting problem and it is actually a scheduling problem. The failure mode is drawing one box labelled GPU with one arrow into it, as though a request either fits or it does not. The other failure mode is drawing autoscaling in minute two, before establishing that one GPU, used well, can serve dozens of concurrent conversations. Pin down the shape of a request first. It is not one unit of work, it is two very different phases. The whole design follows from that split.",
    functional: [
      "<b>Generate.</b> POST a prompt and its history, stream tokens back as they are produced. The user should see the first one quickly.",
      "<b>Batch.</b> Fold as many concurrent requests as GPU memory allows onto one worker, admitting and evicting sequences continuously rather than waiting for a fixed batch to finish.",
      "<b>Route.</b> Send a request to the model tier that can answer it, and to a secondary provider when the primary fleet is unhealthy or overloaded."
    ],
    out: ["training and fine-tuning", "the client SDK", "billing and usage metering", "prompt evaluation or offline scoring", "long term conversation storage"],
    nfr: [
      ["Time to first token", "p99 under 2 seconds", "A chat reply that has not started after two seconds reads as broken, even while the model is working correctly underneath. This number is what forces batching over a naive serial loop."],
      ["Peak throughput", "thousands of requests a minute, roughly 10x a naive serial baseline", "Continuous batching is the one lever that buys this back without buying more GPUs. Say the ratio out loud, it is the headline number of this design."],
      ["Weights plus cache, one card", "one model's weights and headroom for many KV caches must both fit", "A 13B model at fp16 is about 26 GB of weights alone. Whatever memory is left is the system's real concurrency limit, not the GPU's advertised size."],
      ["Primary fleet availability", "99.9%", "GPUs fail, drivers hang, and a bad deploy can wedge a worker mid batch. The fallback provider exists specifically to cover the tenth of a percent this does not."],
      ["Fairness across requests", "no sequence waits behind another sequence's full generation", "Chat replies run from one word to a page. A scheme that makes short replies wait for long ones is backwards for this product."]
    ],
    numbers: [
      ["Model size on one GPU", "a 13B parameter model at fp16 is about 26 GB of weights", "13 billion parameters times 2 bytes each. On an 80 GB card that leaves roughly 50 GB for KV cache and activations, which is the real capacity limit."],
      ["Naive serial utilisation", "the GPU is busy for a small slice of each request's wall clock time", "Most of a request's time is spent waiting on the network and on one token at a time being decoded. Serving one request at a time wastes almost all of the idle gaps between those steps."],
      ["Continuous batching gain", "an order of magnitude or more over naive one at a time serving", "Filling the idle slots between decode steps with other sequences, instead of leaving them empty, is the entire value proposition of a modern inference server."],
      ["KV cache per request", "a few hundred kilobytes to low megabytes per 1,000 tokens of context, depending on model size", "Roughly 2 x layers x kv-heads x head-dim x 2 bytes, held per token for as long as the sequence runs. Grouped query attention with fewer kv-heads keeps this near the low end."],
      ["Peak request volume", "thousands of requests a minute", "The number the queues and the fleet are both sized against. Below it, one GPU is close to the whole answer. Above it, every stage from routing onward exists."],
      ["Concurrent sequences per GPU", "dozens to a couple hundred, once weights are loaded", "Memory left after the roughly 26 GB of weights, divided by the KV cache cost per sequence at a typical context length. This is the number continuous batching and paging both fight to raise."]
    ],
    numbersNote: "One ratio does the real work here. A GPU costs about the same per hour whether it answers one request or fifty, so an empty batch slot is money spent for nothing. Notice what is missing too: nothing in this table justifies an autoscaling policy, that waits until stage 4 names the pressure for it."
  },

  stagesIntro: "Six stages. Stage 0 is the version that genuinely serves one request correctly, for about a day. Every stage after it exists because something specific ran out, memory, throughput or capacity, and the box that arrives is the cheapest fix for that specific thing. If you can name the pressure, you have earned the box.",

  stages: [
    { t: "0. One GPU, one request at a time",
      pressure: "Nothing is broken yet. This is the smallest version that answers one request on one loaded model, and that is exactly where the story should start.",
      nodes: [
        { id: "client", l: "Client", col: 0, row: 0, r: "client" },
        { id: "work-gpu", l: "GPU worker", s: "continuous batching", col: 4, row: 0, r: "work" }
      ],
      edges: [{ a: "client", b: "work-gpu", l: "generate" }],
      add: ["client", "work-gpu"],
      say: "One GPU, one model loaded, one request at a time. A generation call here is just matrix multiplication running as fast as the card allows. Everything added from here exists to keep that card busier, not to make one request faster.",
      breaks: "The GPU sits idle for most of a request's wall clock time. It is only busy during the matrix multiplies themselves. A second concurrent request just queues behind the first, with no parallelism at all." },

    { t: "1. Batch requests together",
      pressure: "One request at a time wastes the GPU's real strength. It can run many small matrix multiplies at once for about the cost of one. Waiting for a handful of requests and running them as a single batch is the obvious first fix.",
      nodes: [
        { id: "client", l: "Client", col: 0, row: 0, r: "client" },
        { id: "queue", l: "Request queue", s: "per model tier", col: 3, row: 0, r: "queue" },
        { id: "work-gpu", l: "GPU worker", s: "continuous batching", col: 4, row: 0, r: "work" }
      ],
      edges: [{ a: "client", b: "queue" }, { a: "queue", b: "work-gpu" }],
      add: ["queue"],
      say: "Collect N requests, run one batch, hand back N answers, repeat. The batch shares one forward pass through the model, so the GPU finally has real parallel work instead of one lonely request.",
      breaks: "The whole batch waits for its slowest member before any new request can join. A long reply can share a batch with three short ones. Those three sit finished but unreturned, held hostage until the long one ends. Reply length varies enormously in chat, so this is the common case, not an edge case." },

    { t: "2. Batch continuously, page the cache",
      pressure: "Naive batching fixed idle GPU time and created a head of line problem instead. The fix is to stop waiting for a fixed batch to finish. Evict a sequence the moment it ends, admit a waiting one in its place, on every decode step.",
      nodes: [
        { id: "client", l: "Client", col: 0, row: 0, r: "client" },
        { id: "queue", l: "Request queue", s: "per model tier", col: 3, row: 0, r: "queue" },
        { id: "work-gpu", l: "GPU worker", s: "continuous batching", col: 4, row: 0, r: "work" },
        { id: "cache-kv", l: "KV cache manager", s: "paged, per request", col: 4, row: 1, r: "cache" }
      ],
      edges: [{ a: "client", b: "queue" }, { a: "queue", b: "work-gpu" }, { a: "work-gpu", b: "cache-kv", l: "pages" }],
      add: ["cache-kv"],
      say: "Continuous batching changes the batch's membership on every step, not every N requests. A short reply leaves the moment it finishes and its slot goes to whoever is waiting. The price is that every sequence in flight now needs its own key-value cache, live in GPU memory, for as long as it runs.",
      breaks: "A naive contiguous allocation for each sequence's cache fragments badly. Sequences of wildly different lengths keep starting and finishing at random. One well utilised GPU is still one GPU, and peak traffic or a larger model both need more than one card offers." },

    { t: "3. Route across a fleet",
      pressure: "One GPU worker cannot be the whole answer once traffic and model size outgrow a single card. A fleet of replicas, maybe serving more than one model size, needs something to pick a replica and a tier. A now public API also needs authentication and rate limits.",
      nodes: [
        { id: "client", l: "Client", col: 0, row: 0, r: "client" },
        { id: "edge", l: "API gateway", s: "auth, rate limits", col: 1, row: 0, r: "edge" },
        { id: "svc-router", l: "Model router", s: "picks a tier, a fallback", col: 2, row: 0, r: "svc" },
        { id: "queue", l: "Request queue", s: "per model tier", col: 3, row: 0, r: "queue" },
        { id: "store-registry", l: "Model registry", s: "which model, which replica", col: 3, row: 1, r: "store" },
        { id: "work-gpu", l: "GPU worker", s: "continuous batching", col: 4, row: 0, r: "work" },
        { id: "cache-kv", l: "KV cache manager", s: "paged, per request", col: 4, row: 1, r: "cache" }
      ],
      edges: [
        { a: "client", b: "edge" }, { a: "edge", b: "svc-router" },
        { a: "svc-router", b: "queue" }, { a: "svc-router", b: "store-registry", l: "lookup" },
        { a: "queue", b: "work-gpu" }, { a: "work-gpu", b: "cache-kv", l: "pages" }
      ],
      add: ["edge", "svc-router", "store-registry"],
      say: "A gateway handles auth and rate limits at the door, so nothing downstream has to trust the caller. A router looks up which tier and replica should answer, checks the registry for who is actually alive, and forwards to that tier's queue.",
      breaks: "Routing works, but every request still goes to whichever model the caller asked for. A trivial question pays flagship prices as often as a hard one does. There is also no answer yet for what happens when the primary fleet turns unhealthy." },

    { t: "4. Add a cheaper tier, and a fallback",
      pressure: "Charging flagship prices for every trivial request is wasteful once a cheaper tier could answer just as well. A fleet wide outage or overload with no fallback means every request fails at once, instead of degrading gracefully.",
      nodes: [
        { id: "client", l: "Client", col: 0, row: 0, r: "client" },
        { id: "edge", l: "API gateway", s: "auth, rate limits", col: 1, row: 0, r: "edge" },
        { id: "svc-router", l: "Model router", s: "picks a tier, a fallback", col: 2, row: 0, r: "svc" },
        { id: "queue", l: "Request queue", s: "per model tier", col: 3, row: 0, r: "queue" },
        { id: "store-registry", l: "Model registry", s: "which model, which replica", col: 3, row: 1, r: "store" },
        { id: "ext-fallback", l: "Fallback provider", s: "secondary API, on overflow", col: 3, row: 2, r: "ext" },
        { id: "work-gpu", l: "GPU worker", s: "continuous batching", col: 4, row: 0, r: "work" },
        { id: "cache-kv", l: "KV cache manager", s: "paged, per request", col: 4, row: 1, r: "cache" }
      ],
      edges: [
        { a: "client", b: "edge" }, { a: "edge", b: "svc-router" },
        { a: "svc-router", b: "queue" }, { a: "svc-router", b: "store-registry", l: "lookup" },
        { a: "svc-router", b: "ext-fallback", l: "overflow" },
        { a: "queue", b: "work-gpu" }, { a: "work-gpu", b: "cache-kv", l: "pages" }
      ],
      add: ["ext-fallback"],
      say: "The router picks a tier by request shape, a short factual question does not need the biggest model in the fleet. When the primary fleet is unhealthy or its queues are full, the router sends the request to a secondary provider instead of failing it.",
      breaks: "Cost and resilience both improved, but nobody can yet tell where a regression came from. A slow reply might be the router, one bad replica, or the fallback path answering instead. Right now those three look identical from outside." },

    { t: "5. Watch it",
      pressure: "A queue depth spike, a falling cache hit rate, or a creeping p99 should all page someone before a user complains. None of that is visible without somewhere to send it.",
      nodes: [
        { id: "client", l: "Client", col: 0, row: 0, r: "client" },
        { id: "edge", l: "API gateway", s: "auth, rate limits", col: 1, row: 0, r: "edge" },
        { id: "svc-router", l: "Model router", s: "picks a tier, a fallback", col: 2, row: 0, r: "svc" },
        { id: "queue", l: "Request queue", s: "per model tier", col: 3, row: 0, r: "queue" },
        { id: "store-registry", l: "Model registry", s: "which model, which replica", col: 3, row: 1, r: "store" },
        { id: "ext-fallback", l: "Fallback provider", s: "secondary API, on overflow", col: 3, row: 2, r: "ext" },
        { id: "work-gpu", l: "GPU worker", s: "continuous batching", col: 4, row: 0, r: "work" },
        { id: "cache-kv", l: "KV cache manager", s: "paged, per request", col: 4, row: 1, r: "cache" },
        { id: "store-metrics", l: "Metrics store", s: "tokens/sec, queue depth", col: 5, row: 0, r: "store" }
      ],
      edges: [
        { a: "client", b: "edge" }, { a: "edge", b: "svc-router" },
        { a: "svc-router", b: "queue" }, { a: "svc-router", b: "store-registry", l: "lookup" },
        { a: "svc-router", b: "ext-fallback", l: "overflow" },
        { a: "queue", b: "work-gpu" }, { a: "work-gpu", b: "cache-kv", l: "pages" },
        { a: "work-gpu", b: "store-metrics", l: "emit" }
      ],
      add: ["store-metrics"],
      say: "Every GPU worker emits tokens per second, queue depth, cache hit rate and time to first token. Watching the trend on those four numbers catches a bad deploy or a struggling replica before a support ticket does." }
  ],

  boxesIntro: "Nine components. For each one: the pressure that created it, what lost the argument, what it costs, and how it fails at three in the morning. Naming your own failure modes is what makes you sound like someone who has paged for this system, not someone who has read about it.",

  boxes: [
    { id: "client", n: "The client", r: "client",
      job: "Sends a prompt and history, and reads back a stream of tokens as they are produced.",
      why: "It is on the diagram because streaming, not just the final response, is part of the contract. It renders partial output, and it is where a caller can cancel a generation early.",
      forced: "Nothing forced it onto the diagram. It earns its place because time to first token, the number this design chases, is measured from something the client did.",
      alts: [["A single blocking call that returns the full reply", "simpler to write against, and a five hundred word answer feels frozen for as long as it takes to generate, instead of starting to move inside two seconds."]],
      pros: ["Streaming lets the user start reading before generation finishes, which is most of what fast means for a chat product."],
      cons: ["A dropped connection mid stream wastes whatever GPU time was already spent, since those tokens cannot be handed to anyone else.", "Cancellation has to reach all the way back to the GPU worker or it keeps generating into the void."],
      cost: "Zero infrastructure. One protocol decision, made once.",
      fails: "A mobile client loses connection three hundred tokens into a long reply. The worker keeps generating for another two seconds before the cancellation arrives, burning GPU time nobody will read.",
      say: "Stream over a persistent connection, and propagate cancellation all the way to the worker, not just the gateway. A cancelled request that keeps generating is throughput paid for and thrown away." },

    { id: "edge", n: "API gateway", r: "edge",
      job: "Terminate TLS, authenticate the caller, and enforce a rate limit before any request reaches a GPU.",
      why: "The moment this API is public, someone scripts a loop against it. A GPU minute is the most expensive resource in the system, so the cheapest place to reject abuse is before it spends any of it.",
      forced: "Stage 3, when a fleet and a public router replaced one GPU answering one caller.",
      alts: [["Rate limiting inside the router service", "works, and it means an abusive burst still reaches a service with real work to do, instead of dying at the door."], ["No gateway, auth inside each worker", "duplicates the check on every replica, and a policy change becomes a fleet wide deploy."]],
      pros: ["One place to change a rate limit or rotate a key, instead of a fleet wide deploy.", "Rejects an unauthenticated or over quota request before it costs a single GPU cycle."],
      cons: ["It sits in front of every request, so its own latency and availability are now everyone's problem.", "A limit tuned for the average caller can throttle a legitimate burst, like a customer's own traffic spike."],
      cost: "A managed gateway is cheap per request, well under a cent. The real cost is tuning the rate limit correctly.",
      fails: "A leaked API key scripts a tight loop against the generate endpoint overnight. The rate limit catches it within the hour, but that hour's GPU minutes are already gone and paid for.",
      say: "Rate limit by API key, not by IP, since a shared network can look like one caller. I would put a stricter limit on prompt length too, since a long prompt costs as much GPU time as several short ones." },

    { id: "svc-router", n: "Model router", r: "svc",
      job: "Decide which model tier answers a request, and where to send it when the first choice cannot.",
      why: "Once more than one model size and more than one replica exist, something must make this call on every request, cheaply and fast.",
      forced: "Stage 3 for picking a tier and a replica. Stage 4 added the overflow decision to a fallback provider.",
      alts: [["A fixed model per API key, chosen at signup", "no runtime decision at all, and a customer who only asks trivial questions pays flagship prices forever, or the reverse."], ["The client picks the model explicitly", "honest about who owns the cost decision, and most callers will default to the biggest model out of caution and never revisit it."]],
      pros: ["Centralises the one decision that determines both cost and quality per request.", "The natural place to add a fallback, a canary rollout, or an A/B test between models later."],
      cons: ["It is now a dependency of every single request, so a bug here affects the whole fleet at once.", "Classifying request difficulty well enough to pick a cheaper tier is an ongoing modelling problem, not a one time rule."],
      cost: "A classification pass costs a few milliseconds per request, far cheaper than the generation it is routing.",
      fails: "A router deploy ships a bug that always picks the smallest tier. Cost drops and nobody notices for a day, until quality complaints arrive, because the dashboard only tracked cost.",
      say: "Start with a cheap heuristic on prompt length and a few keywords. Track the router's own decisions as a metric, not as ground truth, and use feedback to improve it." },

    { id: "queue", n: "Request queue", r: "queue",
      job: "Hold requests for one model tier until a worker for that tier has room.",
      why: "A worker admits new sequences at its own pace, so requests arriving faster than that need somewhere to wait that is not a client's open socket.",
      forced: "Stage 1, once more than one request could be in flight, which is also the point naive batching first became possible.",
      alts: [["No queue, reject when full", "simplest, and it turns a brief traffic spike into failed requests instead of slightly delayed ones."], ["One shared queue for every model tier", "fewer moving parts, and a flood on the cheap tier delays the flagship tier's traffic behind it, which defeats the point of having tiers."]],
      pros: ["Absorbs a burst without failing requests outright.", "Per tier queues mean a flood on one tier cannot delay another tier's traffic."],
      cons: ["A queue allowed to grow without bound turns into unbounded latency instead of a clean failure.", "It hides an undersized tier behind a growing wait instead of an obvious error."],
      cost: "Cheap to run, a few hundred megabytes of memory per tier. The real cost is the depth limit you pick.",
      fails: "A tier's queue is left unbounded during an incident, and time to first token quietly climbs from two seconds to two minutes. Nothing errors, so nobody pages on it, it just gets slow.",
      say: "Bound every queue and reject fast past the bound, with a clear error, rather than let latency degrade silently. A fast, honest failure is easier to act on than a slow, ambiguous one." },

    { id: "store-registry", n: "Model registry", r: "store",
      job: "Track which model versions exist, which replicas are serving them, and which replicas are healthy right now.",
      why: "The router cannot pick a replica it does not know is alive, and more than one model version needs a source of truth for which replica runs which one.",
      forced: "Stage 3, the moment there was a fleet of replicas rather than one fixed worker.",
      alts: [["A static config file, redeployed to add a replica", "fine for a handful of long lived replicas, and it makes autoscaling impossible without a redeploy on every scale event."], ["Service discovery over DNS", "finds a replica and says nothing about whether it is healthy or which model version it runs, both of which the router needs."]],
      pros: ["The router's lookup is a fast key value read, not a live probe of every replica on every request.", "Adding or draining a replica is a registry update, not a router deploy."],
      cons: ["It is a dependency the router calls on every request, so its own latency budget matters.", "It can go stale in the gap between a replica actually failing and a health check catching it."],
      cost: "A small store, read on every request and written a few times a minute. One node with a replica is plenty.",
      fails: "A replica crashes and the registry's health check has not run yet. The router keeps sending it traffic for that whole gap, and every one of those requests times out.",
      say: "Cache the registry in the router's own memory with a few second refresh, so a normal lookup never leaves the process. Correctness here is eventual by design." },

    { id: "ext-fallback", n: "Fallback provider", r: "ext",
      job: "Answer a request the primary fleet cannot, because it is unhealthy or its queues are full.",
      why: "A fleet wide outage or overload with no fallback fails every in-flight request at once. A secondary API, even a worse or pricier one, degrades instead of a full outage.",
      forced: "Stage 4, once cost and reliability were both written down as requirements and neither was fully solved.",
      alts: [["No fallback, fail the request", "simplest, and a single fleet incident becomes a full outage of the product for as long as it lasts."], ["A second self hosted fleet as the fallback", "avoids depending on another vendor, and doubles the infrastructure kept warm for a path used rarely."]],
      pros: ["Turns a fleet wide incident into degraded service instead of an outage.", "Needs no GPUs of your own kept warm and idle for a rainy day."],
      cons: ["A different provider means a different latency profile and sometimes a different answer style, noticeable mid conversation.", "It is real, ongoing spend for a path you hope to use rarely."],
      cost: "Billed per token by the vendor, often two to three times your own fleet's cost per token, paid only when used.",
      fails: "The primary fleet degrades slowly rather than dying outright, so the router keeps sending it most of the traffic while the fallback absorbs only the overflow. Latency climbs everywhere and nothing looks unhealthy enough to fail over harder.",
      say: "Overflow to the fallback on queue depth, not only on a health check failing outright, since a fleet can be technically up and still too slow to meet the two second target." },

    { id: "work-gpu", n: "GPU worker", r: "work",
      job: "Hold a loaded model's weights and run continuous batching across every sequence currently assigned to it.",
      why: "This is where the actual compute happens, and it is the most expensive box in the diagram by a wide margin. Everything else exists to keep it full and to protect it.",
      forced: "Present from stage 0. Continuous batching itself was forced by stage 2's head of line problem.",
      alts: [["Static batching, wait for N and run", "simpler to implement, and it is the exact head of line problem this design exists to avoid."], ["One request per GPU, no batching at all", "the simplest possible worker, and it leaves the GPU idle for most of its own wall clock time."]],
      pros: ["Continuous batching realistically lifts throughput by an order of magnitude or more over serial serving.", "A short reply frees its slot the moment it finishes, instead of waiting on a whole batch."],
      cons: ["The scheduler deciding which sequences to admit or evict on every step is genuinely intricate code.", "A single misbehaving sequence, for example one that never emits a stop token, can hold a slot far longer than expected."],
      cost: "One GPU, tens of dollars an hour, running whether or not it is fully batched. This is the line item everything else justifies.",
      fails: "A client forgets to send a stop sequence and the model generates until it hits the max token limit, every single time. That one integration quietly holds a batch slot for the whole run, on every request, and throughput drops without any single request failing.",
      say: "Continuous batching, one decode step at a time. The scheduler's admit and evict decision is the highest leverage code in this system, it turns one card into fifty concurrent conversations instead of one." },

    { id: "cache-kv", n: "KV cache manager", r: "cache",
      job: "Allocate and page the key-value cache for every in-flight sequence, in fixed size blocks instead of one long reservation.",
      why: "Every sequence sharing the GPU needs a growing cache for as long as it runs, and sequences differ wildly in length, so a naive contiguous allocation fragments the card badly.",
      forced: "Stage 2, the moment continuous batching meant many sequences of different, changing lengths lived in GPU memory at once.",
      alts: [["Reserve the maximum context length per sequence up front", "simple, and it wastes almost all of that memory for the many sequences that end far short of the maximum."], ["Reallocate and copy as a sequence grows", "avoids waste, and pays a copy cost on every growth step, adding latency exactly where a chat product cannot afford it."]],
      pros: ["Paging in fixed size blocks, the way an operating system pages memory, keeps fragmentation waste near zero.", "It lets the worker pack far more concurrent sequences onto the same card than a contiguous scheme allows."],
      cons: ["It is real memory management code sitting in the hottest path of the system.", "Blocks from one sequence are not physically contiguous, so any code assuming a flat array over the cache has to change."],
      cost: "No extra hardware. A few percent of engineering time borrowed from an operating system's page table design.",
      fails: "A batch of unusually long, similar prompts arrives together, blocks run low, and admission has to stall new sequences rather than evict an in-flight one. Throughput drops and it looks like a GPU shortage when it is a cache shortage.",
      say: "Paged attention, block tables per sequence, the same idea as virtual memory. The KV cache, not the weights, is usually what runs out first, and this is the component deciding how many chats fit on a card." },

    { id: "store-metrics", n: "Metrics store", r: "store",
      job: "Collect tokens per second, queue depth, cache hit rate and time to first token from every worker, over time.",
      why: "A queue depth spike or a creeping p99 should page someone before users complain. None of that is visible without somewhere continuous and queryable to send it.",
      forced: "Stage 5, after cost, routing and fallback all existed with no way to tell them apart when something degraded.",
      alts: [["Logs, grepped after an incident", "cheap, and it answers questions only after someone already suspects a problem, exactly backwards for a page-before-complaint requirement."], ["A single global average across the fleet", "hides one bad replica dragging the average down behind a fleet of otherwise healthy ones."]],
      pros: ["Per replica, per tier breakdowns catch a single bad worker that a fleet wide average would hide.", "Turns a support ticket into an alert that fired minutes earlier."],
      cons: ["It is another system to run and to trust, and a metrics outage during a real incident is its own kind of blind.", "High cardinality, per request labels get expensive fast, so most of what is stored is pre aggregated."],
      cost: "Cheap per data point. Thousands of workers reporting every few seconds is a modest write load for a time series store.",
      fails: "A cache hit rate for one tier drifts down over a week as prompts drift longer. Nobody set an alert on that specific metric, only on raw latency. By the time p99 latency pages anyone, the queue behind it is already deep.",
      say: "Alert on queue depth and cache hit rate, not only on p99 latency. Latency is a lagging signal, the other two move first and hand back the two second budget before it is gone." }
  ],

  flowsIntro: "Draw the boxes, then narrate two or three paths out loud. This is the part interviewers actually score, because it is where hand waving becomes visible. For each step, know whether the caller is waiting.",

  flows: [
    { n: "The generate path, primary fleet",
      note: "This is the path the p99 target is written about. Every hop up to the first token counts against the two second budget.",
      steps: [
        ["Client sends <code>POST /v1/chat/completions</code> with a prompt and asks to stream. The gateway checks the API key and rate limit.", "sync"],
        ["The router looks up the caller's tier and a healthy replica in the model registry, then forwards to that tier's queue.", "sync"],
        ["The request waits in the per tier queue until a GPU worker for that tier has room to admit a new sequence.", "sync"],
        ["The worker admits the sequence at its next decode step and allocates KV cache blocks for it in the cache manager.", "sync"],
        ["Tokens stream back over the same connection as they are produced, the first one landing inside the two second budget.", "sync"],
        ["Once the sequence ends, its KV cache blocks return to the free list immediately, for whichever sequence is next in line.", "async"]
      ] },
    { n: "The overflow path, primary fleet is unhealthy or full",
      note: "Cost and resilience both improve here, at the price of a request the router quietly answered somewhere else.",
      steps: [
        ["The router checks the registry and finds every replica for the requested tier either unhealthy or past its queue depth limit.", "sync"],
        ["Instead of queuing behind a fleet that cannot answer in time, the router sends the request to the fallback provider.", "sync"],
        ["The fallback answers over its own API, at its own latency and price, and the client gets a reply either way.", "sync"],
        ["The router logs the overflow decision so metrics can separate fallback traffic from primary fleet traffic later.", "async"]
      ] },
    { n: "The metrics path, catching a regression before a complaint",
      note: "Everything here is allowed to lag by a few seconds, which is what makes it safe to attach to every busy worker.",
      steps: [
        ["Every GPU worker emits tokens per second, queue depth, cache hit rate and time to first token every few seconds.", "async"],
        ["The metrics store aggregates these per replica and per tier, not only as one fleet wide average.", "async"],
        ["An alert on cache hit rate or queue depth fires minutes before p99 latency would have crossed its threshold.", "async"],
        ["An on-call engineer checks which replica or tier is degrading, before a support ticket says the product feels slow.", "sync"]
      ] }
  ],

  api: [
    ["POST /v1/chat/completions", "200, a stream of tokens", "Body carries the prompt, history and an optional max tokens. Streamed as server sent events so the client can render partial output."],
    ["GET /v1/models", "200 {tiers:[...]}", "Lists the model tiers a caller is allowed to request, so the client can offer a choice instead of guessing."],
    ["GET /v1/requests/{id}/status", "200 {state, tier, tokens_generated}", "For a caller that lost its stream mid reply, so it can ask what happened instead of blindly retrying and doubling the GPU cost."]
  ],
  apiNote: "Two details worth the ten seconds it takes to say them. The generate call streams over server sent events rather than a websocket, since the data only ever needs to flow one way. And a status endpoint exists specifically so a dropped client does not retry a request that is still running on a GPU somewhere.",

  schema: { n: "The model registry", lang: "text",
    note: "Three or four fields decide the routing story, the rest is bookkeeping. Notice that <b>kv_cache_free</b> is a live gauge, not a static fact, updated by the worker itself every few seconds.",
    code:
"replicas\n" +
"  replica_id     uuid       PRIMARY KEY\n" +
"  tier           text       NOT NULL      which model size this replica serves\n" +
"  model_version  text       NOT NULL      for a canary or staged rollout\n" +
"  status         enum       healthy | draining | unhealthy\n" +
"  queue_depth    int        updated by the worker every few seconds\n" +
"  kv_cache_free  int        blocks free, the router's real capacity signal\n" +
"  last_heartbeat timestamptz\n" +
"\n" +
"  index: (tier, status), so the router's lookup is one range scan\n" +
"  no join, ever: the router reads this table alone and decides" },

  deep: [
    { n: "Where the 10x actually comes from",
      note: "Three points on the same curve. <b>Serial</b>: one sequence at a time, the GPU sits mostly idle between decode steps waiting on nothing but the next token being requested. <b>Static batching</b>: wait for a fixed batch, run it together, and the batch is only as fast as its slowest member, so a mixed batch of short and long replies wastes slots for however long the longest one takes. <b>Continuous batching</b>: admit and evict on every decode step, so a slot freed by a finished sequence is reused within milliseconds instead of sitting empty until the whole batch clears.<br><br>The gain is not from doing less work. It comes from letting no GPU cycle pass with an empty seat at the table.",
      code:
"serial:            [====req1====]      [====req2====]      1 slot busy, mostly idle gaps\n" +
"static batch of 4: [==req1==][pad][pad][pad]                slowest member blocks the rest\n" +
"continuous batch:  [r1][r1][r2 in][r2][r3 in][r2][r3]       a finished slot refills same step\n" +
"\n" +
"same GPU, same model, same total tokens generated:\n" +
"  serial              ~1x baseline throughput\n" +
"  static batching     a few x, capped by the slowest member per batch\n" +
"  continuous batch    10x or more, bounded by memory (the KV cache), not by scheduling" },

    { n: "Paged KV cache, and why a contiguous allocation loses",
      note: "A naive allocator reserves one sequence's maximum possible context length up front, as one contiguous block. Most replies end far short of that maximum, so most of the reservation is wasted for the sequence's entire life, and that waste is what limits how many sequences fit on the card at once.<br><br>Paged attention instead splits every sequence's cache into small fixed size blocks, allocated one at a time as the sequence grows, tracked in a per sequence block table the same way a page table tracks virtual memory. Blocks need not be physically contiguous, only logically ordered in the table, so the allocator can hand out whatever block is free anywhere on the card.<br><br>Freeing is just as cheap. When a sequence ends, its blocks return to the free list immediately, and the next admitted sequence can reuse them within the same decode step.",
      code:
"contiguous, reserved for max_len=4096 tokens:\n" +
"  seq A (used 200 of 4096)  [XX..............................] wasted: 3896 slots\n" +
"\n" +
"paged, block size 16 tokens, allocated on demand:\n" +
"  seq A block table: [ b7, b2, b91 ]        3 blocks x 16 = 48 slots for ~48 tokens used\n" +
"  seq B block table: [ b3, b40 ]            physically anywhere on the card, order kept in the table\n" +
"\n" +
"  seq A ends  -> b7, b2, b91 go back to the free list this step\n" +
"  seq C admitted -> takes b7 immediately, no compaction, no copy" },

    { n: "Quadratic attention, linear memory",
      note: "Two different growth curves live inside the same request, and mixing them up is the easiest way to misjudge cost. <b>Compute</b> for one attention layer looks at every pair of tokens in the context, so generating the next token after n tokens costs work proportional to n. Summed over a whole n token reply, total compute grows like n squared.<br><br><b>Memory</b> for the KV cache is different. You store one key and one value vector per token, once, not per pair, so cache size grows linearly in n. This is why memory, not raw compute, is usually what a serving system runs out of first: it is the gentler curve, but it has no shortcut, every token held costs its slice for as long as the sequence lives.",
      code:
"context length n    attention compute (~n^2)   kv cache memory (~n, linear)\n" +
"  1,000 tokens          ~1x  (baseline)             ~1x  (baseline)\n" +
"  10,000 tokens         ~100x compute                ~10x memory\n" +
"  100,000 tokens        ~10,000x compute              ~100x memory\n" +
"\n" +
"compute is the harder curve, and it is what techniques like\n" +
"FlashAttention target. memory is the gentler curve, and it is\n" +
"still what a fixed size GPU runs out of first, because unlike\n" +
"compute it has to be held, all at once, for every concurrent\n" +
"sequence, for as long as that sequence stays alive." }
  ],

  tradeoffsIntro: "Say the pair, pick a side, then say what would change your mind. The last part is what separates an opinion from a preference.",

  tradeoffs: [
    { a: ["Continuous batching", "Admit and evict on every decode step. Highest throughput, and the scheduler is real complexity to get right."],
      b: ["Static batching", "Wait for a fixed batch, run it, repeat. Simple to reason about, and a long reply blocks short ones behind it."],
      pick: "a",
      flip: "traffic is homogeneous enough that replies are all roughly the same length, for example a fixed length classification task rather than open chat. Then the head of line problem barely exists." },
    { a: ["Paged KV cache", "Fixed size blocks, allocated on demand, near zero fragmentation waste. Real memory management complexity in the hottest path."],
      b: ["Contiguous, reserve the maximum", "Trivial to implement, one allocation per sequence. Wastes most of that reservation for any reply shorter than the maximum, which is most of them."],
      pick: "a",
      flip: "context lengths are short and nearly uniform, so the waste from reserving the maximum is small in absolute terms." },
    { a: ["Route to a cheaper tier when possible", "Lower average cost per request. A wrong classification either overpays occasionally or under-serves a hard question."],
      b: ["Always answer with the flagship model", "Simplest possible router, and consistent quality. Every trivial question pays the same GPU cost as the hardest one it will ever see."],
      pick: "a",
      flip: "quality variance between tiers is unacceptable for the product, for example a legal or medical answer where a wrong downgrade has real cost." },
    { a: ["Fail over to a secondary provider", "Degrades to a different latency and cost profile instead of failing outright. Ongoing spend and a dependency on someone else's uptime."],
      b: ["Fail closed, return an error", "No dependency on another vendor, and no surprise bill. Every fleet incident becomes a full outage for its duration."],
      pick: "a",
      flip: "the product's contract explicitly promises never to send a conversation to another vendor, for example for data residency or confidentiality reasons." }
  ],

  next: [
    "<b>Speculative decoding.</b> A small draft model proposes several tokens, the big model verifies them in one pass. Real latency win, at the cost of a second model to maintain.",
    "<b>Quantized tiers.</b> An int8 or int4 copy of a model cuts memory and cost, at a quality loss the router would need to weigh when picking a tier.",
    "<b>Autoscale the fleet on queue depth.</b> A fixed replica count either wastes GPUs off peak or queues badly at peak. Queue depth, not CPU, is the right signal here.",
    "<b>Prefix caching across requests.</b> A shared system prompt or a repeated document context can reuse KV cache blocks across different callers, not only within one conversation.",
    "<b>Multi-GPU model parallelism.</b> A model too large for one card must be split across several, which turns the failure story from one card dying into one shard dying."
  ],

  p: [
    ["SRC", "https://github.com/vllm-project/vllm", "vLLM, the continuous batching engine", "M"],
    ["SRC", "https://arxiv.org/abs/2205.14135", "FlashAttention, the paper behind fast attention", "H"],
    ["SRC", "https://arxiv.org/abs/2211.17192", "Speculative decoding, the paper", "H"],
    ["SRC", "https://github.com/BerriAI/litellm", "LiteLLM, routing across providers and fallback", "M"],
    ["SRC", "https://www.hellointerview.com/learn/system-design", "Hello Interview, system design fundamentals", "E"],
    ["SRC", "https://github.com/donnemartin/system-design-primer", "System Design Primer", "E"],
    ["SRC", "https://blog.bytebytego.com", "ByteByteGo, system design writeups", "E"]
  ],

  hi: {
    one: "Yahan har decision ek fact se nikalta hai: GPU ka kharcha per hour lagbhag same hota hai chahe woh ek request serve kare ya pachaas, isliye use concurrent kaam se bhara rakhna hi poora game hai. Doosra fact yeh hai ki jab aap yeh game achhe se khelte ho, to model weights nahi, key-value cache pehle khatam hota hai.",

    brief: {
      why: "Yeh problem hosting problem jaisi dikhti hai par asal mein scheduling problem hai. Galti yeh hoti hai ki ek box GPU likh kar ek arrow bana diya, jaise request ya toh fit hoti hai ya nahi hoti. Doosri galti: minute do mein hi autoscaling draw kar dena, yeh establish kiye bina ki ek GPU, achhe se use hone par, dozens of concurrent conversations serve kar sakta hai. Pehle request ki shape pin down karo. Yeh kaam ki ek unit nahi hai, yeh do bahut alag phases hain. Poora design isi split se nikalta hai.",
      functional: [
        "<b>Generate.</b> Prompt aur history POST karo, aur tokens jaise bante hain waise stream karke wapas bhejo. User ko pehla token jaldi dikhna chahiye.",
        "<b>Batch.</b> Jitni concurrent requests GPU memory mein aa sakein unhe ek worker par fold karo, aur fixed batch ke khatam hone ka wait kiye bina sequences ko continuously admit aur evict karo.",
        "<b>Route.</b> Request ko us model tier par bhejo jo use answer kar sake, aur jab primary fleet unhealthy ya overloaded ho to secondary provider ko bhejo."
      ],
      out: ["training aur fine-tuning", "client SDK", "billing aur usage metering", "prompt evaluation ya offline scoring", "long term conversation storage"],
      nfr: [
        ["Time to first token", "p99 under 2 seconds", "Do second baad bhi jo chat reply shuru nahi hua woh broken lagta hai, chahe neeche model bilkul sahi kaam kar raha ho. Yahi number naive serial loop ki jagah batching ko force karta hai."],
        ["Peak throughput", "thousands of requests a minute, roughly 10x a naive serial baseline", "Aur GPUs kharide bina yeh wapas lene ka ek hi lever hai: continuous batching. Ratio zor se bolo, yahi is design ka headline number hai."],
        ["Weights plus cache, one card", "one model's weights and headroom for many KV caches must both fit", "fp16 par 13B model ke sirf weights hi lagbhag 26 GB hain. Uske baad jo memory bachti hai wahi system ki real concurrency limit hai, GPU ka advertised size nahi."],
        ["Primary fleet availability", "99.9%", "GPUs fail hote hain, drivers hang hote hain, aur ek bad deploy worker ko batch ke beech wedge kar sakta hai. Fallback provider isi tenth of a percent ko cover karne ke liye hai."],
        ["Fairness across requests", "no sequence waits behind another sequence's full generation", "Chat replies ek shabd se lekar ek page tak hote hain. Jo scheme chhote replies ko lambe replies ka wait karaye woh is product ke liye ulta hai."]
      ],
      numbers: [
        ["Model size on one GPU", "a 13B parameter model at fp16 is about 26 GB of weights", "13 billion parameters ko 2 bytes se guna karo. 80 GB card par isse lagbhag 50 GB KV cache aur activations ke liye bachta hai, aur wahi real capacity limit hai."],
        ["Naive serial utilisation", "the GPU is busy for a small slice of each request's wall clock time", "Request ka zyadatar waqt network ka wait karne mein aur ek waqt par ek token decode hone mein jaata hai. Ek waqt par ek request serve karna in steps ke beech ke idle gaps ka lagbhag sab waste kar deta hai."],
        ["Continuous batching gain", "an order of magnitude or more over naive one at a time serving", "Decode steps ke beech ke idle slots ko khali chhodne ki jagah doosre sequences se bharna, yahi modern inference server ki poori value proposition hai."],
        ["KV cache per request", "a few hundred kilobytes to low megabytes per 1,000 tokens of context, depending on model size", "Lagbhag 2 x layers x kv-heads x head-dim x 2 bytes, har token ke liye hold hota hai jab tak sequence chalta hai. Kam kv-heads wala grouped query attention ise low end ke paas rakhta hai."],
        ["Peak request volume", "thousands of requests a minute", "Yahi number hai jiske against queues aur fleet dono size hote hain. Iske neeche ek GPU lagbhag poora jawab hai. Iske upar routing se aage ka har stage exist karta hai."],
        ["Concurrent sequences per GPU", "dozens to a couple hundred, once weights are loaded", "Lagbhag 26 GB weights ke baad bachi memory, jise typical context length par har sequence ki KV cache cost se divide karo. Continuous batching aur paging dono isi number ko badhane ke liye ladte hain."]
      ],
      numbersNote: "Yahan ek ratio asli kaam karta hai. GPU ka kharcha per hour lagbhag same hota hai chahe woh ek request answer kare ya pachaas, isliye khali batch slot bekaar mein kharch hua paisa hai. Yeh bhi dekho ki kya missing hai: is table mein kuch bhi autoscaling policy ko justify nahi karta, woh stage 4 tak ruk sakti hai jab tak pressure ka naam na aaye."
    },

    stagesIntro: "Chhe stages. Stage 0 woh version hai jo ek request ko bilkul sahi serve karta hai, lagbhag ek din ke liye. Iske baad har stage isliye hai kyunki kuch specific khatam ho gaya, memory, throughput ya capacity, aur jo box aata hai woh us specific cheez ka sabse sasta fix hai. Agar pressure ka naam le sako, to box kamaya hua hai.",

    stages: [
      { pressure: "Abhi kuch toota nahi hai. Yeh sabse chhota version hai jo ek loaded model par ek request answer kare, aur kahani yahin se shuru honi chahiye.",
        say: "Ek GPU, ek model loaded, ek waqt par ek request. Yahan generation call bas matrix multiplication hai jo card ki jitni speed ho utni tez chalti hai. Yahan se jo bhi add hota hai woh card ko zyada busy rakhne ke liye hai, ek request ko tez banane ke liye nahi.",
        breaks: "GPU request ke wall clock time ka zyadatar hissa idle rehta hai. Woh sirf matrix multiplies ke dauran busy hota hai. Doosri concurrent request bas pehli ke peeche queue mein lag jaati hai, parallelism bilkul nahi." },

      { pressure: "Ek waqt par ek request GPU ki asli taakat waste karti hai. Woh ek matrix multiply ki cost mein lagbhag kai chhote matrix multiplies ek saath chala sakta hai. Kuch requests ka wait karke unhe ek batch ki tarah chalana pehla obvious fix hai.",
        say: "N requests collect karo, ek batch chalao, N answers wapas do, repeat. Batch model ke ek hi forward pass ko share karta hai, isliye GPU ko akhirkaar ek akeli request ki jagah asli parallel kaam milta hai.",
        breaks: "Poora batch apne sabse slow member ka wait karta hai, uske pehle koi nayi request join nahi kar sakti. Ek lamba reply teen chhote replies ke saath batch share kar sakta hai. Woh teen khatam ho chuke hain par return nahi hue, lambe wale ke khatam hone tak hostage. Chat mein reply length bahut vary karti hai, isliye yeh common case hai, edge case nahi." },

      { pressure: "Naive batching ne idle GPU time fix kiya aur badle mein head of line problem bana di. Fix yeh hai ki fixed batch ke khatam hone ka wait mat karo. Jaise hi sequence khatam ho use evict karo, uski jagah waiting wala admit karo, har decode step par.",
        say: "Continuous batching batch ki membership har step par badalti hai, har N requests par nahi. Chhota reply khatam hote hi nikal jaata hai aur uska slot waiting wale ko mil jaata hai. Iski keemat yeh hai ki ab flight mein har sequence ko apni key-value cache chahiye, GPU memory mein live, jab tak woh chalta hai.",
        breaks: "Har sequence ki cache ke liye naive contiguous allocation bahut fragment hoti hai. Bahut alag lengths ke sequences random tareeke se shuru aur khatam hote rehte hain. Ek achhe se use hua GPU bhi ek hi GPU hai, aur peak traffic ya bada model dono ko ek card se zyada chahiye." },

      { pressure: "Jab traffic aur model size ek card se aage badh jaayein to ek GPU worker poora jawab nahi ho sakta. Replicas ki fleet, shayad ek se zyada model size serve karti hui, ko replica aur tier chunne ke liye kuch chahiye. Ab public API ko authentication aur rate limits bhi chahiye.",
        say: "Gateway darwaze par auth aur rate limits handle karta hai, taaki neeche kisi ko caller par bharosa na karna pade. Router lookup karta hai ki kaunsa tier aur replica answer kare, registry mein check karta hai ki asal mein kaun alive hai, aur us tier ki queue ko forward karta hai.",
        breaks: "Routing chalti hai, par har request abhi bhi usi model ke paas jaati hai jo caller ne maanga. Ek trivial sawaal utni hi baar flagship price deta hai jitni baar mushkil sawaal deta hai. Is baat ka bhi abhi koi jawab nahi ki primary fleet unhealthy ho jaaye to kya hoga." },

      { pressure: "Har trivial request ke liye flagship price lena waste hai jab ek sasta tier utna hi achha answer de sakta hai. Fleet wide outage ya overload jab koi fallback na ho, to har request ek saath fail hoti hai, gracefully degrade hone ki jagah.",
        say: "Router request ki shape dekh kar tier chunta hai, ek chhote factual sawaal ko fleet ka sabse bada model nahi chahiye. Jab primary fleet unhealthy ho ya uski queues bhar gayi hon, router request ko fail karne ki jagah secondary provider ko bhej deta hai.",
        breaks: "Cost aur resilience dono improve hue, par abhi koi nahi bata sakta ki regression kahan se aaya. Slow reply router ho sakta hai, ek bad replica ho sakta hai, ya fallback path jawab de raha ho. Abhi bahar se yeh teeno ek jaise dikhte hain." },

      { pressure: "Queue depth spike, girta cache hit rate, ya chupke se badhta p99, in sabko user ke complain karne se pehle kisi ko page karna chahiye. Bhejne ki koi jagah na ho to yeh kuch bhi dikhta nahi.",
        say: "Har GPU worker tokens per second, queue depth, cache hit rate aur time to first token emit karta hai. In chaar numbers ka trend dekhna bad deploy ya struggling replica ko support ticket se pehle pakad leta hai." }
    ],

    boxesIntro: "Nau components. Har ek ke liye: kis pressure ne ise banaya, kaun argument haara, iski cost kya hai, aur raat ke teen baje yeh kaise fail hota hai. Apne failure modes ka naam lena aapko us insaan jaisa sunata hai jisne is system ke liye page kiya hai, us jaisa nahi jisne sirf padha hai.",

    boxes: [
      { job: "Prompt aur history bhejta hai, aur tokens ki stream jaise woh bante hain waise padhta hai.",
        why: "Yeh diagram par isliye hai kyunki streaming, sirf final response nahi, contract ka hissa hai. Yeh partial output render karta hai, aur yahin se caller generation ko jaldi cancel kar sakta hai.",
        forced: "Kisi ne diagram par force nahi kiya. Yeh isliye jagah kamata hai kyunki time to first token, jis number ke peeche yeh design bhagta hai, client ke kuch karne se naapa jaata hai.",
        alts: [["A single blocking call that returns the full reply", "likhna simple hai, par paanch sau shabd ka jawab jitni der generate hone mein lage utni der frozen lagta hai, do second ke andar chalna shuru hone ki jagah."]],
        pros: ["Streaming se user generation khatam hone se pehle padhna shuru kar sakta hai, aur chat product ke liye fast ka zyadatar matlab yahi hai."],
        cons: ["Stream ke beech connection girne par jo GPU time pehle hi kharch ho chuka woh waste jaata hai, kyunki woh tokens kisi aur ko nahi diye ja sakte.", "Cancellation ko poora GPU worker tak pahunchna padta hai warna woh khali hawa mein generate karta rehta hai."],
        cost: "Zero infrastructure. Ek protocol decision, ek baar liya gaya.",
        fails: "Mobile client lambe reply ke teen sau tokens ke baad connection kho deta hai. Cancellation aane se pehle worker do second aur generate karta rehta hai, aisa GPU time jala kar jise koi nahi padhega.",
        say: "Persistent connection par stream karo, aur cancellation ko sirf gateway tak nahi, poore worker tak propagate karo. Jo cancelled request generate karti rehti hai woh throughput hai jise pay karke phenk diya gaya." },

      { job: "TLS terminate karo, caller ko authenticate karo, aur koi bhi request GPU tak pahunchne se pehle rate limit lagao.",
        why: "Jis pal yeh API public hoti hai, koi na koi uske against loop script kar deta hai. GPU ka ek minute system ka sabse mehenga resource hai, isliye abuse ko reject karne ki sabse sasti jagah woh hai jahan woh uska ek bhi hissa kharch na kar paye.",
        forced: "Stage 3, jab ek GPU ek caller ko answer karne ki jagah fleet aur public router aa gaye.",
        alts: [["Rate limiting inside the router service", "chalta hai, par iska matlab hai ki abusive burst us service tak pahunchta hai jiske paas asli kaam hai, darwaze par hi marne ki jagah."], ["No gateway, auth inside each worker", "har replica par wahi check duplicate hota hai, aur policy change fleet wide deploy ban jaata hai."]],
        pros: ["Rate limit badalne ya key rotate karne ki ek hi jagah, fleet wide deploy ki jagah.", "Unauthenticated ya over quota request ko ek bhi GPU cycle kharch hone se pehle reject kar deta hai."],
        cons: ["Yeh har request ke aage baitha hai, isliye iski apni latency aur availability ab sabki problem hai.", "Average caller ke liye tune ki gayi limit ek legitimate burst ko throttle kar sakti hai, jaise customer ka apna traffic spike."],
        cost: "Managed gateway per request sasta hai, ek cent se kaafi kam. Asli cost rate limit ko sahi tune karna hai.",
        fails: "Ek leaked API key raat bhar generate endpoint par tight loop script karti hai. Rate limit ise ghante ke andar pakad leta hai, par us ghante ke GPU minutes pehle hi ja chuke hain aur paid hain.",
        say: "Rate limit API key se karo, IP se nahi, kyunki shared network ek caller jaisa dikh sakta hai. Prompt length par bhi ek sakht limit lagaunga, kyunki lamba prompt kai chhote prompts jitna GPU time leta hai." },

      { job: "Decide karo ki kaunsa model tier request answer kare, aur jab pehli choice na ho sake to use kahan bhejna hai.",
        why: "Jab ek se zyada model size aur ek se zyada replica ho jaate hain, to kisi ko har request par yeh call lena padta hai, sasta aur fast.",
        forced: "Stage 3 tier aur replica chunne ke liye. Stage 4 ne fallback provider tak overflow ka decision jod diya.",
        alts: [["A fixed model per API key, chosen at signup", "runtime par koi decision nahi, aur jo customer sirf trivial sawaal poochta hai woh hamesha flagship price deta hai, ya ulta."], ["The client picks the model explicitly", "cost decision kiska hai is baare mein honest hai, par zyadatar callers caution ke chalte sabse bada model default kar denge aur kabhi revisit nahi karenge."]],
        pros: ["Woh ek decision centralise karta hai jo har request ki cost aur quality dono tay karta hai.", "Baad mein fallback, canary rollout ya models ke beech A/B test jodne ki natural jagah."],
        cons: ["Yeh ab har ek request ki dependency hai, isliye yahan ka bug poori fleet ko ek saath affect karta hai.", "Request ki difficulty ko itna achha classify karna ki sasta tier chun sako, ek chalta hua modelling problem hai, ek baar ka rule nahi."],
        cost: "Classification pass per request kuch milliseconds ka hai, us generation se kahin sasta jise woh route kar raha hai.",
        fails: "Router deploy ek bug ship karta hai jo hamesha sabse chhota tier chunta hai. Cost gir jaati hai aur ek din tak kisi ko pata nahi chalta, jab tak quality complaints nahi aati, kyunki dashboard sirf cost track kar raha tha.",
        say: "Prompt length aur kuch keywords par ek sasti heuristic se shuru karo. Router ke apne decisions ko metric ki tarah track karo, ground truth ki tarah nahi, aur use improve karne ke liye feedback use karo." },

      { job: "Ek model tier ki requests ko tab tak hold karo jab tak us tier ke worker ke paas jagah na ho.",
        why: "Worker naye sequences apni raftaar se admit karta hai, isliye usse tez aane wali requests ko kisi client ke open socket ke alawa kahin wait karne ki jagah chahiye.",
        forced: "Stage 1, jab ek se zyada request flight mein ho sakti thi, jo wahi point hai jahan naive batching pehli baar possible hua.",
        alts: [["No queue, reject when full", "sabse simple, aur yeh chhote traffic spike ko thodi delayed requests ki jagah failed requests bana deta hai."], ["One shared queue for every model tier", "kam moving parts, par sasta tier par flood flagship tier ka traffic apne peeche delay kar deta hai, jo tiers rakhne ka point hi khatam kar deta hai."]],
        pros: ["Burst ko requests bilkul fail kiye bina absorb karta hai.", "Per tier queues ka matlab hai ki ek tier par flood doosre tier ke traffic ko delay nahi kar sakta."],
        cons: ["Jo queue bina bound ke badhne di jaaye woh clean failure ki jagah unbounded latency ban jaati hai.", "Yeh chhote tier ko obvious error ki jagah badhte wait ke peeche chhupa deta hai."],
        cost: "Chalane mein sasta, har tier ke liye kuch sau megabytes memory. Asli cost woh depth limit hai jo aap chunte ho.",
        fails: "Incident ke dauran ek tier ki queue unbounded chhod di gayi, aur time to first token chupke se do second se do minute ho gaya. Kuch error nahi deta, isliye koi page nahi hota, bas slow ho jaata hai.",
        say: "Har queue ko bound karo aur bound ke baad clear error ke saath fast reject karo, latency ko chupke se degrade hone dene ki jagah. Fast, honest failure par act karna slow, ambiguous failure se aasan hai." },

      { job: "Track karo ki kaunse model versions exist karte hain, kaunse replicas unhe serve kar rahe hain, aur abhi kaunse replicas healthy hain.",
        why: "Router aisa replica nahi chun sakta jiske alive hone ka use pata nahi, aur ek se zyada model version ko is baat ka source of truth chahiye ki kaunsa replica kaunsa chala raha hai.",
        forced: "Stage 3, jis pal ek fixed worker ki jagah replicas ki fleet ho gayi.",
        alts: [["A static config file, redeployed to add a replica", "kuch long lived replicas ke liye theek hai, aur autoscaling ko bina har scale event par redeploy ke impossible bana deta hai."], ["Service discovery over DNS", "replica dhoondh leta hai, par yeh nahi batata ki woh healthy hai ya kaunsa model version chala raha hai, dono cheezein router ko chahiye."]],
        pros: ["Router ka lookup ek fast key value read hai, har request par har replica ka live probe nahi.", "Replica add ya drain karna registry update hai, router deploy nahi."],
        cons: ["Yeh ek dependency hai jise router har request par call karta hai, isliye iska apna latency budget matter karta hai.", "Replica ke asal mein fail hone aur health check ke usse pakadne ke beech ke gap mein yeh stale ho sakta hai."],
        cost: "Ek chhota store, har request par read hota hai aur minute mein kuch baar likha jaata hai. Ek replica wala ek node kaafi hai.",
        fails: "Ek replica crash ho jaata hai aur registry ka health check abhi chala nahi. Router us poore gap mein use traffic bhejta rehta hai, aur un mein se har request time out hoti hai.",
        say: "Registry ko router ki apni memory mein kuch second ke refresh ke saath cache karo, taaki normal lookup process ke bahar kabhi na jaaye. Yahan correctness by design eventual hai." },

      { job: "Woh request answer karo jo primary fleet nahi kar sakti, kyunki woh unhealthy hai ya uski queues bhar gayi hain.",
        why: "Fleet wide outage ya overload jab koi fallback na ho, to har in-flight request ek saath fail hoti hai. Secondary API, chahe worse ya mehengi ho, poore outage ki jagah degrade karti hai.",
        forced: "Stage 4, jab cost aur reliability dono requirement ke roop mein likhe ja chuke the aur koi bhi poori tarah solve nahi tha.",
        alts: [["No fallback, fail the request", "sabse simple, aur ek fleet incident jitni der chale utni der product ka full outage ban jaata hai."], ["A second self hosted fleet as the fallback", "doosre vendor par depend nahi karna padta, aur ek aise path ke liye jo kabhi kabhi use hota hai infrastructure double warm rakhna padta hai."]],
        pros: ["Fleet wide incident ko outage ki jagah degraded service bana deta hai.", "Barsaat ke din ke liye apne GPUs warm aur idle rakhne ki zaroorat nahi."],
        cons: ["Alag provider ka matlab alag latency profile aur kabhi alag answer style, jo conversation ke beech mein noticeable hota hai.", "Yeh ek aise path ke liye real, ongoing spend hai jise aap kam use karne ki ummeed karte ho."],
        cost: "Vendor per token bill karta hai, aksar aapki apni fleet ki per token cost se do se teen guna, aur sirf use hone par pay hota hai.",
        fails: "Primary fleet poori tarah marne ki jagah dheere dheere degrade hoti hai, isliye router zyadatar traffic use bhejta rehta hai jabki fallback sirf overflow absorb karta hai. Latency har jagah badhti hai aur kuch itna unhealthy nahi dikhta ki zyada failover kare.",
        say: "Fallback par overflow queue depth par karo, sirf health check ke poori tarah fail hone par nahi, kyunki fleet technically up rehkar bhi do second ke target ke liye bahut slow ho sakti hai." },

      { job: "Loaded model ke weights hold karo aur us par assigned har sequence ke across continuous batching chalao.",
        why: "Asli compute yahin hota hai, aur yeh diagram ka sabse mehenga box hai, kaafi fark se. Baaki sab kuch ise bhara rakhne aur ise protect karne ke liye hai.",
        forced: "Stage 0 se maujood. Continuous batching khud stage 2 ki head of line problem ne force ki.",
        alts: [["Static batching, wait for N and run", "implement karna simple hai, aur yahi woh head of line problem hai jisse bachne ke liye yeh design hai."], ["One request per GPU, no batching at all", "sabse simple worker, aur GPU apne wall clock time ka zyadatar hissa idle rehta hai."]],
        pros: ["Continuous batching realistically serial serving par throughput ko ek order of magnitude ya usse zyada badhati hai.", "Chhota reply khatam hote hi apna slot khali kar deta hai, poore batch ka wait nahi karta."],
        cons: ["Har step par kaunse sequences admit ya evict karne hain yeh decide karne wala scheduler genuinely intricate code hai.", "Ek bhi misbehaving sequence, jaise woh jo kabhi stop token emit na kare, slot ko expected se kahin zyada der hold kar sakta hai."],
        cost: "Ek GPU, tens of dollars an hour, chalta rehta hai chahe poori tarah batched ho ya nahi. Yeh woh line item hai jise baaki sab justify karta hai.",
        fails: "Ek client stop sequence bhejna bhool jaata hai aur model har baar max token limit tak generate karta rehta hai. Woh ek integration poore run ke liye batch slot chupke se hold karta hai, har request par, aur throughput gir jaata hai bina kisi ek request ke fail hue.",
        say: "Continuous batching, ek waqt par ek decode step. Scheduler ka admit aur evict decision is system ka highest leverage code hai, yahi ek card ko ek ki jagah pachaas concurrent conversations mein badalta hai." },

      { job: "Har in-flight sequence ke liye key-value cache allocate aur page karo, ek lambi reservation ki jagah fixed size blocks mein.",
        why: "GPU share karne wale har sequence ko jab tak woh chalta hai ek badhti hui cache chahiye, aur sequences ki length bahut alag hoti hai, isliye naive contiguous allocation card ko bahut fragment kar deti hai.",
        forced: "Stage 2, jis pal continuous batching ka matlab yeh ho gaya ki alag, badalti lengths ke kai sequences ek saath GPU memory mein rehte the.",
        alts: [["Reserve the maximum context length per sequence up front", "simple, aur un kai sequences ke liye us memory ka lagbhag sab waste karta hai jo maximum se kaafi pehle khatam ho jaate hain."], ["Reallocate and copy as a sequence grows", "waste bachata hai, par har growth step par copy cost deta hai, wahi latency badhata hai jahan chat product afford nahi kar sakta."]],
        pros: ["Fixed size blocks mein paging, jaise operating system memory page karta hai, fragmentation waste ko zero ke paas rakhti hai.", "Yeh worker ko contiguous scheme se kahin zyada concurrent sequences ek hi card par pack karne deti hai."],
        cons: ["Yeh system ke sabse hot path mein baitha asli memory management code hai.", "Ek sequence ke blocks physically contiguous nahi hote, isliye cache par flat array maanne wala koi bhi code badalna padta hai."],
        cost: "Koi extra hardware nahi. Engineering time ka kuch percent, operating system ke page table design se udhaar liya hua.",
        fails: "Ek saath bahut lambe, similar prompts ka batch aata hai, blocks kam pad jaate hain, aur admission ko naye sequences rokne padte hain, in-flight ko evict karne ki jagah. Throughput girta hai aur yeh GPU shortage jaisa dikhta hai jabki yeh cache shortage hai.",
        say: "Paged attention, har sequence ke block tables, virtual memory wala hi idea. Aksar weights nahi, KV cache pehle khatam hota hai, aur yahi component decide karta hai ki ek card par kitni chats fit hongi." },

      { job: "Har worker se tokens per second, queue depth, cache hit rate aur time to first token samay ke saath collect karo.",
        why: "Queue depth spike ya chupke se badhta p99 users ke complain karne se pehle kisi ko page karna chahiye. Bhejne ke liye continuous aur queryable jagah ke bina yeh kuch dikhta nahi.",
        forced: "Stage 5, jab cost, routing aur fallback sab exist karte the aur kuch degrade hone par unhe alag alag pehchanne ka koi tareeka nahi tha.",
        alts: [["Logs, grepped after an incident", "sasta hai, aur sawaalon ka jawab tabhi deta hai jab kisi ko pehle se problem ka shak ho, page-before-complaint requirement ke bilkul ulta."], ["A single global average across the fleet", "ek bad replica ko baaki healthy replicas ki fleet ke peeche chhupa deta hai jo average ko neeche kheench raha hai."]],
        pros: ["Per replica, per tier breakdown ek single bad worker ko pakadte hain jo fleet wide average chhupa deta.", "Support ticket ko ek aise alert mein badalta hai jo minutes pehle fire hua."],
        cons: ["Yeh ek aur system hai chalane aur bharosa karne ke liye, aur asli incident ke dauran metrics outage apne aap mein ek tarah ka andhapan hai.", "High cardinality, per request labels jaldi mehenge ho jaate hain, isliye jo store hota hai uska zyadatar pre aggregated hota hai."],
        cost: "Per data point sasta. Hazaron workers har kuch second mein report karein to time series store ke liye yeh modest write load hai.",
        fails: "Ek tier ka cache hit rate hafte bhar mein girta jaata hai kyunki prompts lambe hote jaate hain. Kisi ne us specific metric par alert nahi lagaya, sirf raw latency par. Jab tak p99 latency kisi ko page karti hai, uske peeche ki queue pehle se gehri hai.",
        say: "Sirf p99 latency par nahi, queue depth aur cache hit rate par alert lagao. Latency lagging signal hai, baaki do pehle move karte hain aur do second ka budget khatam hone se pehle wapas de dete hain." }
    ],

    flowsIntro: "Boxes draw karo, phir do ya teen paths zor se bolkar narrate karo. Yeh woh hissa hai jise interviewers asal mein score karte hain, kyunki yahin hand waving dikhne lagti hai. Har step ke liye jaano ki caller wait kar raha hai ya nahi.",

    flows: [
      { n: "Generate path, primary fleet",
        note: "Yeh woh path hai jiske baare mein p99 target likha gaya hai. Pehle token tak ka har hop do second ke budget ke against gina jaata hai.",
        steps: [
          ["Client prompt ke saath <code>POST /v1/chat/completions</code> bhejta hai aur stream maangta hai. Gateway API key aur rate limit check karta hai."],
          ["Router model registry mein caller ka tier aur ek healthy replica dhoondhta hai, phir us tier ki queue ko forward karta hai."],
          ["Request per tier queue mein tab tak wait karti hai jab tak us tier ke GPU worker ke paas naya sequence admit karne ki jagah na ho."],
          ["Worker sequence ko apne agle decode step par admit karta hai aur cache manager mein uske liye KV cache blocks allocate karta hai."],
          ["Tokens usi connection par stream hote hain jaise woh bante hain, pehla token do second ke budget ke andar pahunchta hai."],
          ["Sequence khatam hote hi uske KV cache blocks turant free list mein wapas aa jaate hain, agle sequence ke liye jo line mein hai."]
        ] },
      { n: "Overflow path, primary fleet unhealthy ya full",
        note: "Cost aur resilience dono yahan improve hote hain, is keemat par ki ek request ka jawab router ne chupke se kahin aur diya.",
        steps: [
          ["Router registry check karta hai aur dekhta hai ki maange gaye tier ka har replica ya unhealthy hai ya apni queue depth limit paar kar chuka hai."],
          ["Aisi fleet ke peeche queue mein lagne ki jagah jo time par answer nahi de sakti, router request ko fallback provider ko bhej deta hai."],
          ["Fallback apni API par, apni latency aur price par answer deta hai, aur client ko har haal mein reply milta hai."],
          ["Router overflow decision ko log karta hai taaki metrics baad mein fallback traffic ko primary fleet traffic se alag kar sakein."]
        ] },
      { n: "Metrics path, complaint se pehle regression pakadna",
        note: "Yahan sab kuch kuch second late ho sakta hai, aur yahi ise har busy worker par lagana safe banata hai.",
        steps: [
          ["Har GPU worker har kuch second mein tokens per second, queue depth, cache hit rate aur time to first token emit karta hai."],
          ["Metrics store inhe per replica aur per tier aggregate karta hai, sirf ek fleet wide average ki tarah nahi."],
          ["Cache hit rate ya queue depth par alert p99 latency ke threshold paar karne se minutes pehle fire hota hai."],
          ["On-call engineer check karta hai ki kaunsa replica ya tier degrade ho raha hai, support ticket ke yeh kehne se pehle ki product slow lag raha hai."]
        ] }
    ],

    tradeoffsIntro: "Pair bolo, ek side pick karo, phir bolo ki kya aapka mind badal dega. Aakhri hissa hi opinion ko preference se alag karta hai.",

    tradeoffs: [
      { a: ["Continuous batching", "Har decode step par admit aur evict. Sabse zyada throughput, aur scheduler ko sahi karna asli complexity hai."],
        b: ["Static batching", "Fixed batch ka wait karo, chalao, repeat. Samajhna simple, aur lamba reply apne peeche ke chhote replies ko block karta hai."],
        flip: "traffic itna homogeneous ho ki replies lagbhag sab ek length ke hon, jaise open chat ki jagah fixed length classification task. Tab head of line problem lagbhag hoti hi nahi." },
      { a: ["Paged KV cache", "Fixed size blocks, on demand allocate, fragmentation waste zero ke paas. Sabse hot path mein asli memory management complexity."],
        b: ["Contiguous, reserve the maximum", "Implement karna trivial, har sequence ke liye ek allocation. Maximum se chhote har reply ke liye us reservation ka zyadatar waste karta hai, aur zyadatar replies aise hi hain."],
        flip: "context lengths chhoti aur lagbhag uniform hon, isliye maximum reserve karne ka waste absolute terms mein chhota ho." },
      { a: ["Route to a cheaper tier when possible", "Per request average cost kam. Galat classification ya kabhi kabhi zyada pay karwati hai ya mushkil sawaal ko kam serve karti hai."],
        b: ["Always answer with the flagship model", "Sabse simple router, aur consistent quality. Har trivial sawaal utni hi GPU cost deta hai jitni sabse mushkil sawaal jo kabhi aayega."],
        flip: "tiers ke beech quality variance product ke liye unacceptable ho, jaise legal ya medical jawab jahan galat downgrade ki asli cost ho." },
      { a: ["Fail over to a secondary provider", "Outright fail hone ki jagah alag latency aur cost profile par degrade hota hai. Ongoing spend, aur kisi aur ke uptime par dependency."],
        b: ["Fail closed, return an error", "Kisi doosre vendor par dependency nahi, aur koi surprise bill nahi. Har fleet incident apni duration ke liye full outage ban jaata hai."],
        flip: "product ka contract explicitly promise kare ki conversation kabhi kisi doosre vendor ko nahi bheja jaayega, jaise data residency ya confidentiality ke reasons se." }
    ],

    next: [
      "<b>Speculative decoding.</b> Ek chhota draft model kai tokens propose karta hai, bada model unhe ek pass mein verify karta hai. Real latency win, ek doosra model maintain karne ki keemat par.",
      "<b>Quantized tiers.</b> Model ki int8 ya int4 copy memory aur cost kam karti hai, ek quality loss ke saath jise router ko tier chunte waqt weigh karna padega.",
      "<b>Fleet ko queue depth par autoscale karo.</b> Fixed replica count ya off peak GPUs waste karta hai ya peak par buri tarah queue karta hai. Yahan sahi signal CPU nahi, queue depth hai.",
      "<b>Requests ke across prefix caching.</b> Shared system prompt ya baar baar aane wala document context alag callers ke across KV cache blocks reuse kar sakta hai, sirf ek conversation ke andar nahi.",
      "<b>Multi-GPU model parallelism.</b> Jo model ek card ke liye bahut bada ho use kai cards mein split karna padta hai, jo failure story ko ek card ke marne se ek shard ke marne mein badal deta hai."
    ]
  }
}

];
