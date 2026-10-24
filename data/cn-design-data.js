/* cn-design-data.js, two network systems grown stage by stage, the same
   pattern and rigor as design-data.js and ai-design-data.js: a stage may only
   add a box if it can name the pressure that broke the previous stage, and
   every box carries its own reasoning (alts, pros, cons, cost, fails).
   See docs/CONTENT-GUIDE.md, "Adding a Design Lab project".

   Validate with `node tools/check-ai.js`, which checks the AI, CN and OS
   design data in one pass.

   Two small helpers keep the stage tables readable: `N` builds a node once,
   and `pick` lists a stage's nodes by id, so a box moves between stages
   without being retyped.
*/

const DESIGN = (() => {

const N = (id, l, s, col, row, r) => ({ id, l, s, col, row, r });
const pick = (all, ids) => ids.map(id => all[id]);
const B = (id, n, r, job, why, forced, alts, pros, cons, cost, fails, say) =>
  ({ id, n, r, job, why, forced, alts, pros, cons, cost, fails, say });

/* ------------------------- project 1: the web request path ------------------------- */
const WEB = {
  client: N("client", "Browser", "types a URL", 0, 0, "client"),
  dns:    N("dns", "DNS resolver", "name to IP, cached", 1, 1, "ext"),
  cdn:    N("cdn", "CDN edge", "static files, close by", 1, 0, "cache"),
  lb:     N("lb", "Load balancer", "TLS, spreads traffic", 2, 0, "edge"),
  app:    N("app", "App servers", "stateless, many copies", 3, 0, "svc"),
  cache:  N("cache", "Cache", "hot rows in memory", 4, 0, "cache"),
  db:     N("db", "Database", "source of truth", 4, 1, "store"),
  mon:    N("mon", "Health checker", "probes every 5 s", 3, 1, "work"),
};

/* ------------------------- project 2: realtime chat ------------------------- */
const CHAT = {
  client:   N("client", "Chat client", "phone or browser", 0, 0, "client"),
  lb:       N("lb", "L4 load balancer", "TCP, no HTTP parsing", 1, 0, "edge"),
  auth:     N("auth", "Auth service", "checks the token once", 1, 1, "svc"),
  gw:       N("gw", "WebSocket gateway", "holds the connections", 2, 0, "svc"),
  bus:      N("bus", "Pub/sub bus", "fan-out between gateways", 3, 0, "queue"),
  presence: N("presence", "Presence store", "who is on which gateway", 3, 1, "cache"),
  msgdb:    N("msgdb", "Message store", "durable history", 4, 0, "store"),
  push:     N("push", "Push provider", "APNs and FCM", 4, 1, "ext"),
};

return [

{
  id: "web-request-path", kind: "hld", n: "Life of a web request", sub: "From typing a URL to a rendered page",
  tags: ["DNS then TCP then TLS then HTTP", "cache at every layer", "the latency is round trips"],
  one: "Say the path out loud in order, because every box is one round trip you can name: DNS resolves the name, TCP and TLS set up a secure pipe, HTTP asks for the page, and each later box exists to remove a round trip or a distance from that path.",

  brief: {
    why: "This looks like a question about web servers, and it is really a question about <b>latency you cannot buy back</b>. Light in fibre covers about 200 km per millisecond, so a user in Mumbai talking to Virginia pays roughly 200 ms per round trip however fast the code is. Weak answers list technologies. Strong answers count round trips, then add a box only when it removes one or shortens one.",
    functional: [
      "<b>Serve a page.</b> A browser given a URL gets HTML, then the scripts, styles and images it refers to.",
      "<b>Serve it securely.</b> Every request is over TLS, and the certificate matches the domain.",
      "<b>Survive a server dying.</b> Users should not notice when one machine is replaced or restarted."
    ],
    out: ["application logic and the database schema", "authentication and sessions", "video streaming", "a service mesh between internal services", "IPv6 rollout details"],
    nfr: [
      ["Time to first byte", "under 300 ms for a user on another continent", "Setup round trips dominate. Each one is 100 to 200 ms at intercontinental distance."],
      ["Availability", "99.99%, about 52 minutes of downtime a year", "One server at 99% gives 3.65 days a year. Only redundancy and fast failure detection reach four nines."],
      ["Static asset latency", "served from within 30 ms of the user", "A page needs dozens of small files. Distance multiplies, so the files must live near the user."],
      ["Failure detection", "a dead server removed within 15 seconds", "Traffic sent to a dead server is an error a person sees. Detection time bounds the damage."],
      ["Throughput", "20,000 requests per second at peak", "Sets how many app servers and how large a load balancer tier is needed."]
    ],
    numbers: [
      ["Peak traffic", "20,000 requests/s", "Given. Static files are about 80% of requests, dynamic pages about 20%."],
      ["Dynamic requests", "4,000/s reach the app tier", "20,000 x 20%. The CDN absorbs the rest."],
      ["One app server", "about 500 requests/s", "Given. 4,000 / 500 = 8 servers, and 10 with headroom to survive losing two."],
      ["Intercontinental RTT", "about 200 ms", "Mumbai to Virginia, mostly the speed of light in fibre plus detours."],
      ["Cold connection setup", "DNS 1 RTT + TCP 1 RTT + TLS 1 RTT = 3 RTT", "At 200 ms that is 600 ms before the first request byte is even sent."],
      ["With a CDN edge 20 ms away", "3 RTT x 20 ms = 60 ms", "The same three round trips, ten times shorter, because the server is near."],
      ["Cache hit ratio target", "95% on the database cache", "At 95%, only 5% of 4,000 = 200 queries/s reach the database."]
    ],
    numbersNote: "Two numbers carry the design. <b>3 round trips before any data</b> says the cheapest win is making each trip shorter, which is what a CDN does. And <b>4,000 dynamic requests a second</b> instead of 20,000 shows that the cache and the CDN, not the app servers, absorb most of the load."
  },

  stagesIntro: "Six stages. Stage 0 genuinely works for a hobby site. Each later stage exists because one specific thing broke, and the box that arrives is the cheapest repair for it.",

  stages: [
    { t: "0. One server, one IP",
      pressure: "Nothing has gone wrong yet. A browser that already knows the server's IP address connects and gets a page, which is exactly what a small site does on day one.",
      nodes: pick(WEB, ["client", "app", "db"]),
      edges: [{ a: "client", b: "app", l: "HTTP" }, { a: "app", b: "db", l: "query" }],
      add: ["client", "app", "db"],
      say: "Start with the smallest thing that serves a page: the browser connects to one machine by IP, the machine queries one database. Everything else I add has to be paid for by something here breaking.",
      breaks: "Nobody types an IP address, and the day the machine is replaced its address changes. Users can only reach the site if they can find it, and the number is not memorable or stable." },

    { t: "1. Names, so DNS",
      pressure: "Humans use names, and the server's address must be allowed to change. Without a name layer, every move of the server breaks every bookmark.",
      nodes: pick(WEB, ["client", "dns", "app", "db"]),
      edges: [{ a: "client", b: "dns", l: "resolve" }, { a: "client", b: "app", l: "HTTP" }, { a: "app", b: "db", l: "query" }],
      add: ["dns"],
      say: "A DNS record maps the name to the address. The browser asks a resolver first, then connects. Changing servers becomes a record edit, and the TTL decides how quickly that spreads.",
      breaks: "One server is still one point of failure and one ceiling. At a few hundred requests a second it saturates, and when it reboots every user sees an error." },

    { t: "2. Many servers behind a load balancer",
      pressure: "A single server caps throughput at around 500 requests a second and takes the site down whenever it restarts. We need several copies behind one address.",
      nodes: pick(WEB, ["client", "dns", "lb", "app", "db"]),
      edges: [{ a: "client", b: "dns", l: "resolve" }, { a: "client", b: "lb", l: "HTTPS" }, { a: "lb", b: "app", l: "forward" }, { a: "app", b: "db", l: "query" }],
      add: ["lb"],
      say: "DNS now points at the load balancer. It terminates TLS, then spreads requests across identical stateless app servers. Adding capacity is adding a copy, and a deploy can replace them one at a time.",
      breaks: "Capacity scales, but a dead app server still receives its share of traffic until someone notices. And every request, including a 2 MB image, still crosses the ocean to reach the app tier." },

    { t: "3. A cache in front of the database",
      pressure: "Eight app servers now hit one database, and most queries are for the same few hundred popular rows. The database is the next thing to saturate.",
      nodes: pick(WEB, ["client", "dns", "lb", "app", "cache", "db"]),
      edges: [{ a: "client", b: "dns", l: "resolve" }, { a: "client", b: "lb", l: "HTTPS" }, { a: "lb", b: "app", l: "forward" }, { a: "app", b: "cache", l: "get" }, { a: "app", b: "db", l: "miss" }],
      add: ["cache"],
      say: "An in-memory cache answers repeat reads in under a millisecond. A 95% hit rate means the database sees one query in twenty. The app checks the cache first and reads the database only on a miss.",
      breaks: "The backend is relieved, but the slow part for a faraway user is still the distance. Every image, script and stylesheet takes the long way round for each visitor." },

    { t: "4. Move static files to a CDN edge",
      pressure: "A page needs around 60 static files, and each takes a long trip to the origin. Distance is the dominant cost for faraway users, and no backend change can shorten it.",
      nodes: pick(WEB, ["client", "dns", "cdn", "lb", "app", "cache", "db"]),
      edges: [{ a: "client", b: "dns", l: "resolve" }, { a: "client", b: "cdn", l: "HTTPS" }, { a: "cdn", b: "lb", l: "on a miss" }, { a: "lb", b: "app", l: "forward" }, { a: "app", b: "cache", l: "get" }, { a: "app", b: "db", l: "miss" }],
      add: ["cdn"],
      say: "DNS now points at a CDN. Its edge servers are near users, keep copies of static files, and keep warm TLS connections back to the origin. Only a miss crosses the ocean, and it crosses once for everyone.",
      breaks: "Static traffic is solved, but nothing yet decides which app servers are alive. A crashed server keeps getting its share of dynamic requests, and users see intermittent errors." },

    { t: "5. Health checks close the loop",
      pressure: "Random errors appear whenever an app server crashes, because the load balancer keeps sending it one request in eight. Redundancy that nobody monitors is not redundancy.",
      nodes: pick(WEB, ["client", "dns", "cdn", "lb", "app", "cache", "db", "mon"]),
      edges: [{ a: "client", b: "dns", l: "resolve" }, { a: "client", b: "cdn", l: "HTTPS" }, { a: "cdn", b: "lb", l: "on a miss" }, { a: "lb", b: "app", l: "forward" }, { a: "lb", b: "mon", l: "probe" }, { a: "mon", b: "app", l: "up or down" }, { a: "app", b: "cache", l: "get" }, { a: "app", b: "db", l: "miss" }],
      add: ["mon"],
      say: "A health checker probes every app server every few seconds and tells the balancer to skip any that fail twice in a row. Detection time sets how long users see errors, so I would keep it near 10 seconds." },
  ],

  boxesIntro: "Eight components. For each: the pressure that created it, what lost the argument, what you pay, and how it fails at three in the morning. If you remember one column, remember the last.",

  boxes: [
    B("client", "Browser", "client",
      "Resolves the name, opens a connection, performs the TLS handshake and requests the page.",
      "Every cost in this design is paid on the client's side of the wire, so it belongs on the diagram.",
      "Nothing forced it. It is the reason for every other box.",
      [["Counting server time only", "ignores the 3 round trips before any data, which is most of the delay for a faraway user."]],
      ["Caches DNS answers, connections and files itself, so repeat visits are cheap.", "Opens several connections or one multiplexed one, depending on the HTTP version."],
      ["Out of your control: slow phones, bad Wi-Fi and old browsers all vary widely.", "Honours TTLs and cache headers literally, so a mistake there is hard to undo."],
      "Zero infrastructure cost. The design decisions are all about what you make it wait for.",
      "A long-lived connection goes stale behind a NAT that dropped its mapping, and the first request on it hangs until a timeout.",
      "I count round trips, not milliseconds of server time, because the round trips are the part I cannot optimise away in code."),

    B("dns", "DNS resolver", "ext",
      "Turns the site's name into the address of the CDN or load balancer, caching the answer for its TTL.",
      "Without a name layer, the server's address would be baked into every link and bookmark.",
      "Stage 1, when hard-coding an IP made any server move break every user.",
      [["Hard-coded IP addresses", "free until the first migration, then every client must be updated."], ["A hosts file", "cannot be pushed to millions of browsers."]],
      ["One record edit moves the whole site.", "Caching at the resolver keeps nearly all lookups to one nearby hop."],
      ["Changes spread slowly: a resolver may keep the old answer for the whole TTL.", "A lookup is a round trip before the connection even starts."],
      "Practically free. Managed DNS costs cents per million queries.",
      "The TTL is set to 24 hours, a server dies, and for a day users with the cached answer reach a dead address.",
      "I keep the TTL short while I might need to fail over, say 60 seconds, and lengthen it once things are stable."),

    B("cdn", "CDN edge", "cache",
      "Serves static files from a server near the user and forwards misses to the origin over a warm connection.",
      "Distance is a cost the backend cannot reduce. Moving the bytes closer is the only fix.",
      "Stage 4, when 60 static files per page each took a trip across the ocean.",
      [["Faster origin servers", "do nothing about the speed of light."], ["Bigger browser caches", "help only repeat visitors, not the first visit."]],
      ["A 200 ms trip becomes 20 ms for cached files.", "Absorbs most of the traffic, so the origin sees a fraction of 20,000 requests a second."],
      ["Stale content: a file changed at the origin may be served old until it expires or is purged.", "Another vendor and another place where TLS certificates live."],
      "Usually priced per gigabyte transferred, cheaper than serving the same bytes from the origin.",
      "A bad deploy ships a broken script. The CDN caches it for a day, and rolling back the origin does not help until the cache is purged.",
      "Version file names with a content hash, so a new release is a new URL and nothing has to be purged."),

    B("lb", "Load balancer", "edge",
      "Accepts HTTPS, terminates TLS, spreads requests across healthy app servers and hides how many exist.",
      "One stable address in front of many replaceable machines is what lets the app tier scale and deploy without clients noticing.",
      "Stage 2, when one server's ceiling and its restarts both became visible to users.",
      [["Round-robin DNS only", "cannot see load or health, and caches keep sending traffic to a dead address."], ["Clients pick a server", "every client needs the current server list."]],
      ["Servers can be added, drained and replaced with no client change.", "Terminating TLS in one place keeps certificates out of every app server."],
      ["It is on the path of every dynamic request, so its failure is total.", "A layer 7 balancer spends CPU parsing HTTP."],
      "A managed balancer is cheap per hour plus a small per-request charge.",
      "A single balancer instance dies and takes the site with it, because nobody ran a second one.",
      "Two or more balancers behind a shared address, so the box that spreads the risk is not itself the risk."),

    B("app", "App servers", "svc",
      "Run the page logic: read the request, fetch data, render the HTML.",
      "They hold no state of their own, so any copy can serve any request and copies can come and go.",
      "Stage 2, when one machine was both the ceiling and the single point of failure.",
      [["One bigger machine", "has a hard ceiling and still fails all at once."], ["Sticky sessions", "tie users to a server, so losing it loses their state."]],
      ["Adding capacity is adding a copy.", "A crashed copy loses nothing, because nothing important lived only there."],
      ["Every request pays a network hop to the cache and the database.", "Statelessness forces session data into a shared store."],
      "About 500 requests a second each, so 4,000 dynamic requests need 8, and 10 with headroom.",
      "A memory leak slowly grows every copy until all of them are restarted by the same deploy at the same minute.",
      "Stateless and boring. I want any one of them to be killable at any moment without a user noticing."),

    B("cache", "Cache", "cache",
      "Answers repeat reads for hot rows from memory, in under a millisecond.",
      "Most queries ask for the same small set of rows, and memory is hundreds of times faster than disk.",
      "Stage 3, when eight app servers sent all their reads to one database.",
      [["A bigger database", "scales cost faster than the problem."], ["Per-server caches", "duplicate memory and drift out of sync with each other."]],
      ["A 95% hit rate cuts database reads twentyfold.", "Reads become predictable low-latency lookups."],
      ["Cache and database can disagree, and invalidation is famously hard.", "A cold cache after a restart sends all traffic to the database at once."],
      "Memory is dearer than disk, so you cache only the hot set.",
      "The cache restarts, the hit rate drops to zero, and the database is hit by 20 times its normal load in the same second.",
      "I warm the cache before putting it back in rotation, and I add jitter to expiry times so entries do not all expire together."),

    B("db", "Database", "store",
      "Holds the authoritative data and answers the reads the cache could not.",
      "Somewhere there must be a single place that is true, and it must survive restarts.",
      "Present from stage 0. Later stages exist to protect it.",
      [["Keeping data only in the cache", "memory is lost on restart, so the data would be too."]],
      ["Durable, queryable and consistent.", "With a cache in front, it serves only the 5% of reads that miss."],
      ["Hardest tier to scale out.", "Every layer above it exists partly to shield it."],
      "The biggest cost line of the backend, which is why the cache pays for itself.",
      "A slow query holds connections open, the pool fills, and the app servers begin timing out while the database is technically healthy.",
      "I treat the database as the scarce resource and size everything above it to protect it."),

    B("mon", "Health checker", "work",
      "Probes every app server on a schedule and tells the balancer which ones to skip.",
      "Redundancy only helps if failures are detected and routed around automatically.",
      "Stage 5, when a crashed server kept receiving one request in eight.",
      [["Waiting for users to report errors", "turns every outage into a customer-found bug."], ["Passive detection only", "notices after real requests have already failed."]],
      ["A dead server leaves rotation within about 10 seconds, so errors stop on their own.", "It also lets a server rejoin automatically once it recovers."],
      ["A probe that is too shallow passes while the app is broken.", "A probe that is too strict flaps healthy servers in and out."],
      "Tiny. A request every few seconds per server.",
      "The probe only checks that the port is open. The app is deadlocked, the port still answers, and the balancer keeps sending it traffic.",
      "The probe hits a real endpoint that touches the cache and the database, and needs two failures in a row before it acts.")
  ],

  flowsIntro: "Draw the boxes, then narrate the paths. For each step know who is waiting and what it costs in round trips.",

  flows: [
    { n: "A first visit to the home page",
      note: "A cold start: nothing is cached anywhere yet, and every setup round trip is paid in full.",
      steps: [
        ["The browser asks its DNS resolver for the site's name and gets the CDN's address, 1 round trip.", "sync"],
        ["It opens a TCP connection to the CDN edge, 1 round trip, which is short because the edge is near.", "sync"],
        ["It completes a TLS 1.3 handshake with the edge, 1 round trip.", "sync"],
        ["The browser requests the HTML. The edge has no copy, so it forwards the request over a warm connection to the load balancer.", "sync"],
        ["The balancer picks a healthy app server, which checks the cache, reads the database on a miss and renders the page.", "sync"],
        ["The page returns. Each static file it mentions is then served from the edge, mostly as cache hits.", "sync"]
      ] },
    { n: "An app server dies",
      note: "The test of the health checker. What the user sees decides whether the design worked.",
      steps: [
        ["App server 4 crashes. The balancer does not know yet and sends it about one request in ten.", "sync"],
        ["Those requests fail. The balancer's passive check notices the connection errors.", "sync"],
        ["The health checker's next probe of server 4 fails, and then fails again.", "async"],
        ["The checker marks server 4 down and the balancer stops routing to it, within about 10 seconds.", "async"],
        ["Traffic spreads over the remaining servers. Headroom sized for losing two keeps latency normal.", "sync"],
        ["When server 4 is restarted and passes its probes, it rejoins the rotation without a human.", "async"]
      ] }
  ],

  tradeoffsIntro: "Say the pair, pick a side, then say what would change your mind.",

  tradeoffs: [
    { a: ["CDN in front of everything", "Static files and cacheable pages come from near the user, at the cost of cache invalidation and another vendor."],
      b: ["Serve everything from the origin region", "Simplest, one place to deploy and debug, at the cost of 200 ms per round trip for faraway users."],
      pick: "a",
      flip: "nearly all users sit in the same region as the origin. Then the CDN adds cost and invalidation pain for little distance saved." },
    { a: ["TLS terminated at the balancer", "One place for certificates, and app servers do plain HTTP inside the private network."],
      b: ["TLS all the way to the app servers", "Encrypted end to end, at the cost of certificate handling and CPU on every server."],
      pick: "a",
      flip: "the network between balancer and servers is not fully trusted, or compliance demands encryption in transit inside the data centre. Then re-encrypt on the inside." },
    { a: ["Short DNS TTL, around 60 seconds", "Failover is fast, at the cost of more lookups reaching the authoritative server."],
      b: ["Long DNS TTL, around a day", "Fewer lookups and slightly faster page loads, at the cost of up to a day of stale answers after a change."],
      pick: "a",
      flip: "the address will not change for months and lookup volume has become a real cost. Then lengthening the TTL is a safe optimisation." }
  ],

  next: [
    "<b>HTTP/3.</b> QUIC removes TCP head-of-line blocking and merges the transport and TLS handshakes, which matters most on lossy mobile links.",
    "<b>Anycast and regional origins.</b> Serving dynamic pages from several regions, not only static files, cuts the distance for the rest of the traffic.",
    "<b>Connection reuse tuning.</b> Keep-alive timeouts and connection pools between the CDN and origin avoid paying handshakes on misses.",
    "<b>Observability.</b> Per-hop timing, DNS, connect, TLS and first byte, shows where a slow page spends its time."
  ],

  p: [
    ["SRC", "https://developer.mozilla.org/en-US/docs/Web/Performance/How_browsers_work", "MDN, what happens when you navigate to a page", "E"],
    ["SRC", "https://aws.amazon.com/builders-library/", "AWS Builders' Library, load balancing and failover", "M"],
    ["SRC", "https://web.dev/articles/ttfb", "web.dev, time to first byte and what drives it", "E"],
    ["SRC", "https://www.cloudflare.com/learning/cdn/what-is-a-cdn/", "Cloudflare, what a CDN does", "E"],
    ["SRC", "https://sre.google/sre-book/load-balancing-datacenter/", "Google SRE book, load balancing in the data centre", "H"]
  ]
},

{
  id: "realtime-chat", kind: "hld", n: "Realtime chat", sub: "One million concurrent connections",
  tags: ["long-lived connections", "routing to the right gateway", "presence and offline push"],
  one: "Chat inverts the web model: instead of many short requests, you hold one million long-lived connections open, so the design question is which gateway holds a user's socket and how a message finds it.",

  brief: {
    why: "A request/response API is stateless, so any server can answer. A chat socket is <b>stateful</b>: user B's connection lives on exactly one gateway machine, and a message from user A, on a different gateway, must reach that machine. Every box after the first exists to answer that routing question, to survive the sockets themselves being fragile, or to deliver when the socket is not there at all.",
    functional: [
      "<b>Send a message.</b> A sends text to B and B sees it within a second if online.",
      "<b>Deliver when offline.</b> If B is not connected, the message waits and B is notified by push.",
      "<b>Show presence.</b> Contacts see whether a user is online."
    ],
    out: ["group chats larger than a few hundred members", "end-to-end encryption", "media upload and transcoding", "search over history", "read receipts"],
    nfr: [
      ["Delivery latency", "p95 under 500 ms between two online users", "Chat feels broken above a second. The path is gateway, bus, gateway, with no database in the way."],
      ["Connection capacity", "1,000,000 concurrent sockets", "Idle connections are cheap but not free. They set how many gateway machines you need."],
      ["Durability", "an accepted message is never lost", "A user told 'sent' expects it to arrive eventually, even if the recipient is offline for a week."],
      ["Reconnect resilience", "a gateway restart does not cause a stampede", "100,000 clients reconnecting at once can overload the very tier that just came back."],
      ["Ordering", "messages in one conversation arrive in send order", "Out-of-order chat is confusing, so ordering is per conversation, not global."]
    ],
    numbers: [
      ["Concurrent connections", "1,000,000", "Given."],
      ["Connections per gateway", "about 50,000", "Memory and file descriptors bound it, not CPU: roughly 20 KB per idle socket is 1 GB."],
      ["Gateways needed", "20, run 30", "1,000,000 / 50,000 = 20, plus headroom to lose several at once."],
      ["Messages per second", "about 20,000 at peak", "Given. 1 in 50 users sending each second."],
      ["Heartbeat interval", "every 30 s", "Keeps NAT mappings alive and detects dead peers. 1,000,000 / 30 = 33,000 pings a second."],
      ["Polling alternative", "1,000,000 users x 1 poll per 5 s = 200,000 req/s", "Ten times the real message rate, almost all of it empty replies."]
    ],
    numbersNote: "Two numbers decide it. <b>200,000 empty polls a second</b> versus 20,000 real messages is why we hold sockets open. And <b>50,000 sockets per machine</b> shows the gateway tier is sized by memory, so state about where a user is connected must live outside any one gateway."
  },

  stagesIntro: "Six stages. Stage 0 is polling, which works for a prototype. Every box after it fixes one specific break.",

  stages: [
    { t: "0. Poll an HTTP endpoint",
      pressure: "Nothing has broken. Clients ask the server for new messages every few seconds, which is the simplest thing that works for a prototype.",
      nodes: pick(CHAT, ["client", "gw", "msgdb"]),
      edges: [{ a: "client", b: "gw", l: "poll" }, { a: "gw", b: "msgdb", l: "read" }],
      add: ["client", "gw", "msgdb"],
      say: "A client polls every five seconds, the server reads the database, and the reply is nearly always empty. It is the correct first version, and the numbers will kill it.",
      breaks: "At a million users the server answers 200,000 requests a second to deliver 20,000 messages, and a reply can be up to five seconds late. Both cost and latency are wrong." },

    { t: "1. Keep a socket open",
      pressure: "Polling wastes nine requests in ten and adds up to 5 seconds of delay. The server needs a way to push a message the instant it exists.",
      nodes: pick(CHAT, ["client", "lb", "gw", "msgdb"]),
      edges: [{ a: "client", b: "lb", l: "WebSocket" }, { a: "lb", b: "gw", l: "TCP" }, { a: "gw", b: "msgdb", l: "write" }],
      add: ["lb"],
      say: "A WebSocket is one long-lived TCP connection that either side can write to. A layer 4 balancer spreads new connections across gateways without parsing anything. Latency becomes the network round trip.",
      breaks: "One gateway holds one user's socket. If A is on gateway 3 and B on gateway 7, gateway 3 has no way to reach B, and a single gateway cannot hold a million sockets anyway." },

    { t: "2. A bus between gateways",
      pressure: "With 20 gateways, a message from A must reach whichever gateway holds B's socket, and A's gateway does not know which one that is.",
      nodes: pick(CHAT, ["client", "lb", "gw", "bus", "msgdb"]),
      edges: [{ a: "client", b: "lb", l: "WebSocket" }, { a: "lb", b: "gw", l: "TCP" }, { a: "gw", b: "bus", l: "publish" }, { a: "bus", b: "msgdb", l: "persist" }],
      add: ["bus"],
      say: "Each gateway publishes the message to a topic for the recipient, and every gateway subscribes to the topics of its connected users. The bus fans the message out to whichever gateway holds B, and a consumer persists it.",
      breaks: "Every message is now broadcast to every gateway, even though only one has the recipient, and the sender cannot tell whether B is online at all." },

    { t: "3. Remember who is where",
      pressure: "Broadcasting everything to every gateway wastes bandwidth, and we cannot tell an offline user from a slow one. We need a lookup of user to gateway.",
      nodes: pick(CHAT, ["client", "lb", "gw", "bus", "presence", "msgdb"]),
      edges: [{ a: "client", b: "lb", l: "WebSocket" }, { a: "lb", b: "gw", l: "TCP" }, { a: "gw", b: "bus", l: "publish" }, { a: "gw", b: "presence", l: "register" }, { a: "bus", b: "msgdb", l: "persist" }],
      add: ["presence"],
      say: "On connect a gateway writes user to gateway into a fast shared store with a short expiry, and refreshes it with each heartbeat. The same entry answers 'is B online', and a missing entry means offline.",
      breaks: "We now know when B is offline and do nothing about it. The message is stored, but B does not find out until the app is opened." },

    { t: "4. Push to offline users",
      pressure: "A phone with the app closed holds no socket. Messages sit in the database unread until the user happens to open the app.",
      nodes: pick(CHAT, ["client", "lb", "gw", "bus", "presence", "msgdb", "push"]),
      edges: [{ a: "client", b: "lb", l: "WebSocket" }, { a: "lb", b: "gw", l: "TCP" }, { a: "gw", b: "bus", l: "publish" }, { a: "gw", b: "presence", l: "register" }, { a: "bus", b: "msgdb", l: "persist" }, { a: "bus", b: "push", l: "if offline", async: true }],
      add: ["push"],
      say: "If presence has no entry for the recipient, the bus hands the message to the platform push service (APNs, FCM), which wakes the phone and shows a notification. Opening the app reconnects the socket and syncs the rest.",
      breaks: "Everything works for honest clients. But anyone can open a socket, and every unauthenticated connection consumes memory and a file descriptor on a gateway." },

    { t: "5. Authenticate once, at the door",
      pressure: "A connection costs about 20 KB and a descriptor. A flood of unauthenticated sockets can exhaust a gateway and take every honest user on it down.",
      nodes: pick(CHAT, ["client", "lb", "auth", "gw", "bus", "presence", "msgdb", "push"]),
      edges: [{ a: "client", b: "lb", l: "WebSocket" }, { a: "lb", b: "auth", l: "check token" }, { a: "lb", b: "gw", l: "TCP" }, { a: "gw", b: "bus", l: "publish" }, { a: "gw", b: "presence", l: "register" }, { a: "bus", b: "msgdb", l: "persist" }, { a: "bus", b: "push", l: "if offline", async: true }],
      add: ["auth"],
      say: "The token is verified during the handshake, before the socket is accepted. An invalid one gets a 401 and no connection is held. Per-user connection caps and a time limit on the handshake limit the damage from a valid account.",
    }
  ],

  boxesIntro: "Eight components, the same four questions each: why it is here, what lost, what it costs, how it fails.",

  boxes: [
    B("client", "Chat client", "client",
      "Opens one WebSocket, sends messages, receives pushes, and reconnects when the connection drops.",
      "The client is half of the protocol. Heartbeats and reconnect logic live here and decide how well the whole system survives failures.",
      "Nothing forced it. It sets the connection behaviour for everything else.",
      [["Polling", "wastes 9 requests in 10 and adds seconds of delay."]],
      ["One connection carries everything, so latency is the network round trip.", "Can reconnect and resync from the last message id it saw."],
      ["Mobile networks drop connections constantly, so reconnection is the normal case.", "Thousands of clients retrying together can flatten a recovering server."],
      "Battery and radio use on the phone, which is why heartbeats are 30 seconds and not 5.",
      "A gateway restarts, 50,000 clients reconnect in the same second and the retry storm knocks it over again.",
      "Reconnect with exponential backoff and random jitter, so clients spread out instead of arriving as one wave."),

    B("lb", "L4 load balancer", "edge",
      "Accepts TCP connections and sends each to a gateway, without reading the traffic.",
      "A long-lived connection is placed once and then stays, so the balancer does its work only at connect time.",
      "Stage 1, when connections outgrew one machine.",
      [["A layer 7 balancer", "parses every WebSocket frame for no benefit, and spends CPU on 1,000,000 idle connections."], ["DNS round robin", "cannot take a draining gateway out quickly."]],
      ["Handles huge connection counts with little CPU.", "Can drain a gateway by simply not placing new connections there."],
      ["Blind to content, so it cannot route by user.", "Existing connections stay where they were placed, even if that gateway becomes busy."],
      "Cheap compared with the gateways it fronts.",
      "Placement is by connection count, and one gateway gets all the heavy chatters while another idles.",
      "Least-connections placement plus a per-gateway cap, and gateways that refuse new sockets when near capacity."),

    B("auth", "Auth service", "svc",
      "Verifies the token on the WebSocket handshake and returns the user's identity.",
      "A socket is expensive to hold, so refuse a bad one before it exists.",
      "Stage 5, when unauthenticated sockets could exhaust a gateway.",
      [["Authenticating on the first message", "the socket is already held, and the gateway has paid for it."], ["Trusting the network", "any client can open a TCP connection."]],
      ["Bad actors never get a socket.", "A signed token can be verified locally, with no call per connection."],
      ["A slow auth call delays every connect, and reconnect storms hit it hardest.", "Tokens expire while a socket stays open, so you must refresh in band."],
      "A cheap signature check if tokens are self-contained.",
      "The auth service is down, nobody can connect, and users with open sockets cannot reconnect after a blip.",
      "Verify signed tokens locally with a cached public key, so auth being down only affects issuing new tokens."),

    B("gw", "WebSocket gateway", "svc",
      "Holds the sockets, parses frames, registers where each user is, and hands messages to the bus.",
      "Someone has to own the TCP connection. It is stateful by nature, so it is kept thin and its state is rebuilt on reconnect.",
      "Stage 1, when push replaced polling.",
      [["Putting chat logic in the gateway", "makes every deploy a mass disconnect."], ["One thread per connection", "does not fit in memory at 50,000 sockets."]],
      ["Event-loop based, so one machine holds tens of thousands of sockets.", "Holds no business logic, so it changes rarely."],
      ["A restart disconnects everyone on it.", "Memory per connection, not CPU, is the ceiling."],
      "About 1 GB of memory per 50,000 idle sockets, plus buffers for active ones.",
      "File descriptor limit hit at 65,535 and new connections are refused, while CPU shows 5% busy.",
      "I size by file descriptors and memory, not CPU, and I drain a gateway for minutes before restarting it."),

    B("bus", "Pub/sub bus", "queue",
      "Carries each message from the sender's gateway to the recipient's gateway and to the persister.",
      "Gateways cannot talk to each other directly at 20 by 20 scale without a shared channel.",
      "Stage 2, when sender and recipient were on different machines.",
      [["Gateways calling each other", "each needs the full list of peers, and failures multiply."], ["Writing to the database and polling it", "brings back the latency we left polling to avoid."]],
      ["Decouples gateways from each other, so any can restart.", "Gives ordering within a partition keyed by conversation."],
      ["One more hop and one more system to keep alive.", "Broadcasting to all gateways wastes bandwidth unless routed by presence."],
      "A modest cluster. Messages are small, 20,000 a second is routine.",
      "A partition leader fails and messages for a conversation stall for several seconds while a new one is elected.",
      "Key by conversation id, so ordering holds, and replicate so a single broker loss does not stop delivery."),

    B("presence", "Presence store", "cache",
      "Maps each online user to the gateway holding their socket, with a short expiry refreshed by heartbeats.",
      "Routing and online status are the same question, answered once, in memory.",
      "Stage 3, when broadcasting to all gateways proved wasteful and offline users were undetectable.",
      [["Asking every gateway", "turns every message into 20 queries."], ["Storing it in the main database", "writes on every heartbeat would flood it."]],
      ["One lookup finds the right gateway or proves the user is offline.", "Entries expire on their own, so a crashed gateway's users vanish without cleanup code."],
      ["It can be briefly wrong: a user may have just left.", "33,000 heartbeat refreshes a second is real write load."],
      "In memory and small: a million entries of a few dozen bytes is tens of megabytes.",
      "The store fails over and loses recent entries. Everyone looks offline for a moment and gets a push notification they did not need.",
      "Treat presence as a hint. A wrong 'online' costs a retry, so the system never relies on it for correctness."),

    B("msgdb", "Message store", "store",
      "Persists every accepted message, partitioned by conversation, and serves history and sync.",
      "A message accepted must never be lost, and a reconnecting client must be able to catch up.",
      "Present from stage 0. It is the only part that must be durable.",
      [["Keeping messages only on the bus", "retention is limited, and history needs random access."]],
      ["Durable and ordered per conversation.", "Lets a client resync from 'everything after message id N'."],
      ["Write-heavy and append-only, so a general database may be the wrong fit.", "Hot conversations concentrate load on a single partition."],
      "Storage grows forever, so retention policy and archiving matter early.",
      "A very active group chat lands on one partition and that node becomes the hot spot for the whole cluster.",
      "Sequence numbers per conversation, assigned on write, so clients can detect gaps and ask for missing ranges."),

    B("push", "Push provider", "ext",
      "Wakes a phone whose app has no socket and shows a notification.",
      "A closed app cannot hold a connection, and the platform push channel is the only thing allowed to wake it.",
      "Stage 4, when offline users went uninformed.",
      [["Keeping a background socket", "mobile OSes kill it to save battery."], ["Polling from the phone", "drains the battery and delays delivery."]],
      ["Reaches users whose app is closed.", "Handled by the OS, so it costs the app almost no battery."],
      ["Best effort: delivery is not guaranteed and can be delayed.", "Rate limits, and the content passes through a third party."],
      "Free or near free at this scale, but every message type needs a payload design.",
      "A bug sends a push for every message in a busy group, and users mute the app within a day.",
      "Collapse notifications per conversation, and never treat push as the delivery. The store is, and push only prompts a sync.")
  ],

  flowsIntro: "Narrate the paths. For each step say whether the sender is waiting and what state is read or written.",

  flows: [
    { n: "Alice sends a message to Bob, who is online",
      note: "The hot path. No database sits between the two sockets.",
      steps: [
        ["Alice's client writes a frame on its open WebSocket to gateway 3.", "sync"],
        ["Gateway 3 looks up Bob in the presence store and finds gateway 7.", "sync"],
        ["It publishes the message to the bus, keyed by conversation id so order is kept.", "sync"],
        ["Gateway 7 receives it and writes it to Bob's socket, which is the delivery.", "sync"],
        ["A consumer persists the message, and Alice gets an acknowledgement once it is stored.", "async"]
      ] },
    { n: "Bob is offline",
      note: "The same send, where the recipient has no socket at all.",
      steps: [
        ["Alice's message reaches gateway 3, which finds no presence entry for Bob.", "sync"],
        ["The message is persisted, and Alice sees 'sent'.", "async"],
        ["The bus hands it to the push provider, which wakes Bob's phone with a notification.", "async"],
        ["Bob opens the app, and the client opens a WebSocket and authenticates.", "sync"],
        ["The client asks for everything after its last message id and receives the stored backlog.", "sync"]
      ] },
    { n: "A gateway restarts",
      note: "What the design looks like when a stateful tier fails.",
      steps: [
        ["Gateway 7 is drained: the balancer stops placing new connections on it.", "sync"],
        ["It closes its 50,000 sockets, with a hint telling clients to wait a random delay.", "sync"],
        ["Clients reconnect with jittered backoff and are spread across the other gateways.", "async"],
        ["Their presence entries expire and are rewritten pointing at the new gateways.", "async"],
        ["Each client resyncs from its last message id, so nothing missed during the gap is lost.", "sync"]
      ] }
  ],

  tradeoffsIntro: "Say the pair, pick a side, then say what would change your mind.",

  tradeoffs: [
    { a: ["WebSocket", "A full-duplex persistent connection with low overhead per message, at the cost of stateful servers and harder load balancing."],
      b: ["Long polling over HTTP", "Works through every proxy and firewall and keeps servers stateless, at the cost of a request per message and head-of-line delay."],
      pick: "a",
      flip: "a large part of the audience sits behind networks that block WebSockets. Then keep long polling as a fallback, not the main path." },
    { a: ["Presence-routed delivery", "Each message goes to one gateway, found by lookup, at the cost of a lookup and a store that must be fast."],
      b: ["Broadcast to every gateway", "No lookup and no extra store, at the cost of 20 times the bus traffic and wasted work on 19 gateways."],
      pick: "a",
      flip: "there are only two or three gateways. Then broadcasting is honestly simpler, and a presence store is overhead." },
    { a: ["Persist then acknowledge", "Alice's 'sent' means the message is safe, at the cost of waiting on a write."],
      b: ["Acknowledge on receipt, persist later", "Faster feedback, at the cost of possibly losing a message the user was told was sent."],
      pick: "a",
      flip: "latency matters more than guarantees, as in typing indicators. For ephemeral events, skip the store." }
  ],

  next: [
    "<b>Group chats.</b> Fan-out for a 100,000-member channel needs a different strategy than one-to-one, such as read-time fan-out.",
    "<b>Multi-device sync.</b> One user, several sockets, so presence maps a user to a set of gateways and read state must be merged.",
    "<b>Backpressure.</b> A slow client must not make the gateway buffer without limit. Bound each queue and drop or disconnect.",
    "<b>Multi-region.</b> Keeping chat latency low across continents needs regional gateways and cross-region bus replication."
  ],

  p: [
    ["SRC", "https://www.rfc-editor.org/rfc/rfc6455", "RFC 6455, the WebSocket protocol", "H"],
    ["SRC", "https://engineering.fb.com/2011/12/05/web/building-facebook-messenger/", "How Facebook Messenger was built", "M"],
    ["SRC", "https://slack.engineering/real-time-messaging/", "Slack, real-time messaging architecture", "M"],
    ["SRC", "https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API", "MDN, the WebSocket API", "E"],
    ["SRC", "https://www.cloudflare.com/learning/ddos/what-is-a-ddos-attack/", "Cloudflare, why open connections are an attack surface", "E"]
  ]
},

];

})();
