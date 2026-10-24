/* cn-concept-data.js, the single source of truth for the Computer Networks
   concept and revision pages (cn-concept.html, cn-revise.html), the same
   pattern as ai-concept-data.js. Same ten fixed sections, same authoring
   rules (docs/CONTENT-GUIDE.md), and the same deliberate deviation as the AI
   pages: `code` is `{pseudo, py}` only. The Python is plain standard library
   (socket, ssl, struct, ipaddress), so every sample runs as written.

   Validate with `node tools/check-ai.js`, which checks the AI, CN and OS data
   in one pass.

   The `viz` ids referenced below ("cn-..." ) are defined in assets/js/viz.js,
   in the "Computer Networks visuals" section near the end.

   Node: { id, n, group, need?, one, plain, why:[{t,d}], hing, math:[{t,d,w}],
           viz:[], costs:[[op,cost,why]], traps:[], code:{pseudo,py}, codecap,
           q:[[question,answer]], p:[[num|SRC, slug|url, title, "E|M|H"]] }
*/

const CONCEPTS = [

{
  id: "layers-encapsulation",
  need: {
    ask: `<p>You open a web page. Your bytes cross a Wi-Fi radio, a home router, a dozen carrier routers and a data centre switch before they reach a server. Every one of those devices is made by a different company.</p>
<p>How can hardware that has never met each other agree on what a byte means?</p>`,
    tries: [
      ["One giant standard that covers everything", "Radio signals, routing, delivery, encryption and web pages in one document. Changing the Wi-Fi spec would force a change to the web spec, so nothing could ever improve independently."],
      ["Let every vendor define its own format", "With 50 vendors you need 50 x 49 translations. A router would need to understand every format ever shipped, and most would simply drop what they do not know."],
    ],
    so: `<p>Split the job into <b>layers</b>, each with one narrow duty and a fixed interface to the layer above. Each layer wraps the data from the layer above in its own <b>header</b>, like putting a letter in an envelope, then that envelope in a bigger one.</p>
<p>A web request becomes an HTTP message, which sits in a TCP segment, which sits in an IP packet, which sits in an Ethernet frame. Page by page, this chapter unwraps that stack.</p>`,
  },

  n: "Layers and Encapsulation",
  group: "Foundations",
  one: "Networking is a stack of layers, each adding its own <b>header</b> around the data from the layer above, so every device reads only the layer it needs.",

  plain: `<p>A network does not move "a web page". It moves small chunks of bytes, and every chunk needs several different answers. Which program is it for? Which machine? Which cable should it leave on next?</p>
<p>Those questions belong to different jobs, so we give each job its own layer. <b>Application</b> (HTTP, DNS) is the conversation. <b>Transport</b> (TCP, UDP) picks the program, using a <b>port number</b>. <b>Network</b> (IP) picks the machine. <b>Link</b> (Ethernet, Wi-Fi) crosses one hop.</p>
<p>Going down, each layer adds a header. Going up on the other side, each layer strips its header and passes the rest upward. A router only opens the IP header. It never looks at your HTTP.</p>
<p><b>Analogy.</b> A letter inside an envelope inside a courier bag. The sorting office reads the bag, the postman reads the envelope, and only you read the letter.</p>`,

  why: [
    { t: "The problem has several unrelated parts",
      d: "Reaching the right program, reaching the right machine and crossing one cable are three different problems. Solving them in one blob makes every change risky." },
    { t: "So each part becomes a layer with one contract",
      d: "A layer promises one service to the layer above and uses only the layer below. Wi-Fi can be replaced by fibre without HTTP noticing." },
    { t: "Each layer needs its own addressing",
      d: "A frame needs a MAC address for the next hop. A packet needs an IP address for the final machine. A segment needs a port for the program." },
    { t: "Wrapping is how the layers stay separate",
      d: "Each layer treats everything above it as opaque payload. It adds a header in front, and the next layer down does the same to the result." },
    { t: "Routers sit low in the stack on purpose",
      d: "A router only needs the network layer to decide where a packet goes. Keeping it ignorant of HTTP is what lets it forward millions of packets a second." },
    { t: "The cost is overhead, and some blurring",
      d: "Every header is bytes that carry no content. Real devices also cheat the layers: firewalls, NAT and load balancers read headers above their layer." },
  ],

  hing: `<p><b>Layers kyun?</b> Network ka kaam ek saath bahut saare sawaalon ka jawab dena hai: kaunsa program, kaunsi machine, kaunsa cable. Inko ek hi jagah mix karoge to kuch bhi badalna mushkil ho jayega.</p>
<p><b>Encapsulation ka matlab.</b> Har layer upar wali layer ke data ko apna header laga ke aage bhej deti hai. Bilkul lifafe ke andar lifafa.</p>
<p><b>Router kya padhta hai?</b> Sirf IP header. Use tumhare HTTP se matlab nahi hai, isliye wo itna tez chal pata hai.</p>
<p><b>Interview mein kya bolna hai?</b> "TCP segment, IP packet, Ethernet frame" ye teen alag naam hain, ek hi cheez ke alag layers par. Naam mix mat karo.</p>`,

  viz: ["cn-encapsulation"],

  math: [
    { t: "Header cost on a full-size frame", d: "A common Ethernet payload limit is 1500 bytes. Out of that, the IP and TCP headers take 40, leaving 1460 for data.", w:
`app data (MSS)       1460 bytes
+ TCP header           20
+ IP header            20      = 1500 bytes  (the MTU)
+ Ethernet header      14
+ Ethernet trailer      4      = 1518 bytes on the wire

efficiency = 1460 / 1518 = 96.2%` },
    { t: "The same headers on a tiny message", d: "A one-byte keystroke pays the same 58 bytes of headers. The ratio is what hurts.", w:
`payload 1 byte, headers 58 bytes -> 59 bytes sent
efficiency = 1 / 59 = 1.7%

(real Ethernet pads this frame up to 64 bytes, so it is worse)
98% of what crosses the wire is envelope` },
    { t: "Why bulk transfer wants big packets", d: "Sending 1 MB (1,000,000 bytes) in full packets versus in tiny ones shows how much the headers add.", w:
`1460-byte payloads:  1,000,000 / 1460 = 685 packets
                     685 x 58 = 39,730 bytes of headers (4.0%)

100-byte payloads:   10,000 packets
                     10,000 x 58 = 580,000 bytes of headers (58%)` },
  ],

  costs: [
    ["add one layer's header", "20 to 60 bytes", "TCP and IP are 20 bytes each without options, Ethernet adds 18"],
    ["a router forwarding a packet", "reads IP header only", "this is why routing can run at line rate in hardware"],
    ["a switch forwarding a frame", "reads Ethernet header only", "one layer lower than a router, so cheaper and faster still"],
    ["crossing a layer boundary on a host", "a copy or a pointer hand-off", "kernels avoid copies, but the boundary is real work"],
  ],

  traps: [
    "<b>Mixing up the unit names.</b> Segment is TCP, packet is IP, frame is Ethernet. Using them as synonyms in an interview signals you have only memorised the diagram.",
    "<b>Reciting seven OSI layers as if the internet used them.</b> The real internet follows the four-layer TCP/IP model. OSI is a teaching vocabulary, and session and presentation have no separate layer in practice.",
    "<b>Saying a router reads the whole packet.</b> A router reads the IP header. Anything that reads HTTP is a proxy or a load balancer, not a router.",
    "<b>Forgetting each hop rewrites the link header.</b> The MAC addresses change at every hop, while the IP addresses stay the same end to end.",
    "<b>Treating layers as free.</b> Headers cost bytes, and small messages pay the most.",
  ],

  code: {
    pseudo: `# Sending: wrap on the way down
segment <- TCP_header(src_port, dst_port, seq, ...) + app_data
packet  <- IP_header(src_ip, dst_ip, ttl, ...)      + segment
frame   <- ETH_header(next_hop_mac, my_mac)          + packet + checksum

# Receiving: unwrap on the way up
packet  <- frame minus ETH header (and checksum ok?)
segment <- packet minus IP header (is dst_ip me?)
app_data <- segment minus TCP header (which port?)`,
    py: `import struct

# Build the 20-byte fixed part of an IPv4 header by hand, to see what a
# "header" really is: just packed fields in front of the payload.
def ipv4_header(src, dst, payload_len, proto=6):
    ver_ihl = (4 << 4) | 5                # version 4, header length 5 words
    total = 20 + payload_len
    return struct.pack("!BBHHHBBH4s4s",
        ver_ihl, 0, total, 0, 0,          # tos, total length, id, flags/frag
        64, proto, 0,                     # ttl, protocol (6 = TCP), checksum
        bytes(map(int, src.split("."))),
        bytes(map(int, dst.split("."))))

h = ipv4_header("10.0.0.5", "93.184.216.34", 1460)
print(len(h), "bytes:", h.hex())          # 20 bytes`,
  },
  codecap: "A header is only packed fields placed in front of the payload. Nothing more mysterious than that.",

  q: [
    ["Why is networking built as layers?", "The job has independent parts. Layers give each part one contract, so Wi-Fi can change without HTTP noticing."],
    ["What does encapsulation mean?", "Each layer treats data from the layer above as opaque payload and wraps it with its own header."],
    ["Which header does a router read?", "The IP header. A switch reads Ethernet, and only a proxy or load balancer reads HTTP."],
    ["What stays the same, and what changes, at every hop?", "IP addresses stay end to end. The MAC addresses in the link header are rewritten for each hop."],
    ["Name the unit at each layer.", "Message at application, segment at TCP, packet at IP, frame at link."],
    ["Why is the OSI model not what the internet runs?", "The internet grew from the TCP/IP four-layer design. OSI's session and presentation layers have no separate implementation there."],
  ],

  p: [
    ["SRC", "https://www.rfc-editor.org/rfc/rfc1122", "RFC 1122, the host requirements that define the layered internet model", "M"],
    ["SRC", "https://www.rfc-editor.org/rfc/rfc791", "RFC 791, the IPv4 header field by field", "M"],
    ["SRC", "https://beej.us/guide/bgnet/", "Beej's Guide to Network Programming, encapsulation in chapter 2", "E"],
    ["SRC", "https://www.wireshark.org/docs/", "Capture one HTTP request in Wireshark and find all four headers", "E"],
    ["SRC", "https://docs.python.org/3/library/struct.html", "struct docs, pack the headers by hand as above", "E"],
  ],
},

{
  id: "ip-subnetting",
  need: {
    ask: `<p>A company has 500 laptops and 40 servers. They need addresses, and the servers must be kept apart from the laptops. A packet addressed to a server should never need to flood the laptop Wi-Fi.</p>
<p>How does a router decide, from the address alone, which group a destination belongs to?</p>`,
    tries: [
      ["A table with one entry per address", "A router near the internet's core would need an entry for each of about 4.3 billion IPv4 addresses. No memory is large enough to look that up at line rate."],
      ["Split the address in half, always", "Every network would be the same size, 65,536 addresses. A 10-device lab would waste 65,526 of them, and a 100,000-device campus would not fit."],
    ],
    so: `<p>Split every address into a <b>network part</b> and a <b>host part</b>, and let the owner choose where the split falls. A <b>mask</b> of N ones means the first N bits name the network.</p>
<p>Take 192.168.10.77/26. The first 26 bits are the network. The router matches those bits against its table and ignores the other 6. One table entry now covers 64 addresses.</p>`,
  },

  n: "IP Addressing and Subnetting",
  group: "Network layer",
  one: "An IP address is a <b>network prefix plus a host number</b>; the mask says where the prefix ends, so one route can cover thousands of addresses.",

  plain: `<p>An IPv4 address is 32 bits, written as four numbers from 0 to 255. Those four numbers are just 32 bits cut into bytes. The address alone does not say how big its network is.</p>
<p>That is the mask's job. <b>/26</b> means the first 26 bits are the <b>network</b> and the last 6 bits number the hosts. A <b>subnet</b> is simply all the addresses that share the same prefix.</p>
<p>A router keeps a table of prefixes, not addresses. For each packet it finds the <b>longest prefix</b> that matches the destination and sends it that way. A more specific route always beats a vaguer one.</p>
<p>Inside a subnet two addresses are reserved: the first (the network address) and the last (the broadcast). <b>Analogy.</b> A postcode: the first part picks the sorting office, the rest picks the house.</p>`,

  why: [
    { t: "Routers cannot afford one entry per address",
      d: "A table with 4.3 billion rows is too big and too slow. Routes have to be grouped." },
    { t: "Grouping works if related addresses are neighbours",
      d: "Give each organisation a block of consecutive addresses. Then the leading bits identify the block, and one entry covers all of it." },
    { t: "Block sizes must be flexible",
      d: "Sizes are powers of two, set by how many bits belong to the host part. A /24 holds 256 addresses and a /26 holds 64." },
    { t: "Overlaps are resolved by the longest match",
      d: "A big block can have a smaller block carved out for another owner. The router picks the most specific entry, which is how exceptions work without special cases." },
    { t: "Private ranges and NAT stretch the supply",
      d: "10.0.0.0/8, 172.16.0.0/12 and 192.168.0.0/16 are reused by everyone inside their own network. A NAT box translates them to one public address on the way out." },
    { t: "IPv6 fixes the supply, not the idea",
      d: "IPv6 has 128-bit addresses, so exhaustion goes away. The prefix-plus-host split and longest-prefix routing stay exactly the same." },
  ],

  hing: `<p><b>IP address ke do hisse.</b> Network wala hissa aur host wala hissa. Mask batata hai ki kahan tak network hai. /26 matlab pehle 26 bits network ke, baaki 6 bits host ke.</p>
<p><b>Subnet size kaise nikalein?</b> Host bits kitne bache? 6 bits to 2^6 = 64 addresses. Isme se 2 reserved hain, to 62 hosts.</p>
<p><b>Router kya karta hai?</b> Table mein prefixes hote hain. Jo prefix destination se sabse lamba match kare, wahi jeet-ta hai. Isko longest prefix match kehte hain.</p>
<p><b>Interview trap.</b> /24 ka matlab 254 usable hosts hai, 256 nahi. Network aur broadcast address kisi device ko nahi milte.</p>`,

  viz: ["cn-subnet-bits"],

  math: [
    { t: "Find the network of 192.168.10.77/26", d: "Only the last octet is cut by the mask, so work on 77 in binary. A /26 mask is 255.255.255.192.", w:
`77  = 0100 1101
192 = 1100 0000          (mask, last octet)
AND = 0100 0000 = 64     -> network address 192.168.10.64

host bits = 32 - 26 = 6 -> block size 2^6 = 64` },
    { t: "Range and usable hosts", d: "The block starts at the network address and runs for 64 addresses.", w:
`network    192.168.10.64    (all host bits 0, not for a device)
first host 192.168.10.65
last host  192.168.10.126
broadcast  192.168.10.127   (all host bits 1, not for a device)

usable = 2^6 - 2 = 62` },
    { t: "Carve a /24 into four /26 subnets", d: "Borrowing two host bits gives four equal blocks of 64.", w:
`192.168.10.0/26     hosts .1   - .62
192.168.10.64/26    hosts .65  - .126
192.168.10.128/26   hosts .129 - .190
192.168.10.192/26   hosts .193 - .254

4 x 62 = 248 hosts, versus 254 in the single /24` },
    { t: "Longest prefix match", d: "Two routes match the destination 10.1.2.9. The router picks the longer one.", w:
`10.0.0.0/8     -> port A     matches, prefix length 8
10.1.2.0/24    -> port B     matches, prefix length 24
0.0.0.0/0      -> port C     matches everything, length 0

10.1.2.9 goes out port B  (24 beats 8 beats 0)` },
  ],

  costs: [
    ["route lookup", "one longest-prefix match", "done in hardware (TCAM) or a trie, never by scanning the table"],
    ["a /24 subnet", "254 usable hosts", "256 addresses minus network and broadcast"],
    ["a /30 link", "2 usable hosts", "the classic size for a point-to-point router link"],
    ["IPv4 address space", "about 4.3 billion", "2^32, already exhausted for new public allocation"],
    ["IPv6 address space", "2^128", "enough that every subnet can be a /64 without worry"],
  ],

  traps: [
    "<b>Saying /24 gives 256 hosts.</b> It gives 254. The first and last addresses of every subnet are reserved.",
    "<b>Reading the mask from the address.</b> The address 192.168.10.77 alone tells you nothing about its network. Only the prefix length does.",
    "<b>Forgetting longest prefix wins.</b> The default route 0.0.0.0/0 matches everything, so it must lose to anything more specific.",
    "<b>Splitting on the wrong boundary.</b> Subnets must start on a multiple of their size. 192.168.10.32/26 is not valid, because 32 is not a multiple of 64.",
    "<b>Thinking private addresses are routable.</b> 192.168.x.x is reused in millions of homes, so the internet drops it. NAT is what bridges the gap.",
  ],

  code: {
    pseudo: `# which network does an address belong to?
network   <- address AND mask
hosts     <- 2 ^ (32 - prefix_len) - 2

# longest prefix match
best <- none
for route in table:
    if (dst AND route.mask) == route.network:
        if best is none or route.prefix_len > best.prefix_len:
            best <- route
return best`,
    py: `import ipaddress

net = ipaddress.ip_network("192.168.10.77/26", strict=False)
print(net)                          # 192.168.10.64/26
print(net.netmask)                  # 255.255.255.192
print(net.broadcast_address)        # 192.168.10.127
print(net.num_addresses - 2)        # 62 usable hosts

for sub in ipaddress.ip_network("192.168.10.0/24").subnets(new_prefix=26):
    print(sub)                      # the four /26 blocks

table = [("10.0.0.0/8", "A"), ("10.1.2.0/24", "B"), ("0.0.0.0/0", "C")]
dst = ipaddress.ip_address("10.1.2.9")
hits = [(ipaddress.ip_network(p), port) for p, port in table
        if dst in ipaddress.ip_network(p)]
print(max(hits, key=lambda h: h[0].prefixlen)[1])    # B`,
  },
  codecap: "The standard library does the bit-twiddling. The longest-prefix rule is one max() over the matches.",

  q: [
    ["What does /26 mean?", "The first 26 bits of the address are the network. The remaining 6 bits number hosts, giving 64 addresses and 62 usable."],
    ["How do you find the network address?", "AND the address with the mask. For 192.168.10.77/26 the last octet 77 AND 192 gives 64."],
    ["Why are two addresses in a subnet unusable?", "The all-zeros host part names the network itself, and the all-ones host part is the broadcast address."],
    ["How does a router pick between overlapping routes?", "Longest prefix match: the most specific matching entry wins, so the default route only catches what nothing else does."],
    ["Why do routers store prefixes rather than addresses?", "There are 4.3 billion addresses, but only hundreds of thousands of blocks, so grouped routes fit in memory and look up at line rate."],
  ],

  p: [
    ["SRC", "https://www.rfc-editor.org/rfc/rfc4632", "RFC 4632, CIDR and longest prefix routing", "M"],
    ["SRC", "https://docs.python.org/3/library/ipaddress.html", "ipaddress module, practise subnet maths in code", "E"],
    ["SRC", "https://www.rfc-editor.org/rfc/rfc1918", "RFC 1918, the private address ranges", "E"],
    ["SRC", "https://www.cloudflare.com/learning/network-layer/what-is-a-subnet/", "Cloudflare, what a subnet is", "E"],
    ["SRC", "https://www.subnet-calculator.com/", "Check your hand answers against a calculator for ten random prefixes", "E"],
  ],
},

{
  id: "dns",
  need: {
    ask: `<p>You type <b>example.com</b>. The network only moves packets to IP addresses, so something must turn the name into a number like 93.184.216.34.</p>
<p>There are over 350 million registered domain names, and any of them may change its address at any minute. Who holds the answer?</p>`,
    tries: [
      ["One big file on every computer", "The early internet did exactly this, a single HOSTS.TXT copied to everyone. At millions of names it was out of date the moment it was copied, and one editor was a bottleneck."],
      ["One central server for all names", "Every lookup on earth goes to one place. At even 10 lookups per person per day across 5 billion people, that is 50 billion lookups a day on one point of failure."],
    ],
    so: `<p>Make it a <b>tree of delegation</b>. The root knows who runs <code>.com</code>. The <code>.com</code> servers know who runs <code>example.com</code>. That owner holds the actual answer.</p>
<p>Nobody holds everything, and each answer is <b>cached</b> for a time set by its owner. Most lookups never leave your resolver.</p>`,
  },

  n: "DNS",
  group: "Application layer",
  one: "DNS is a <b>distributed, cached tree of delegations</b>: root, then TLD, then the domain's own server, with a TTL on every answer.",

  plain: `<p>DNS (the Domain Name System) turns a name into an address. Your computer asks a <b>recursive resolver</b>, usually run by your ISP or a public service, and the resolver does the legwork.</p>
<p>If it has nothing cached, the resolver asks a <b>root server</b>, which does not know the answer but points to the <code>.com</code> servers. Those point to the domain's <b>authoritative server</b>, which finally gives the address record.</p>
<p>Every answer carries a <b>TTL</b>, a number of seconds it may be reused. The resolver remembers the answer, so the next person who asks gets it instantly.</p>
<p>Common records: <b>A</b> for an IPv4 address, <b>AAAA</b> for IPv6, <b>CNAME</b> for an alias to another name, <b>MX</b> for mail. <b>Analogy.</b> Phone directory enquiries: you ask one operator, who rings the regional office, who rings the street exchange.</p>`,

  why: [
    { t: "Names must be resolvable by anyone, but owned by one party",
      d: "The company that owns example.com is the only one who should be able to change where it points. So the answer has to live on their server." },
    { t: "So ownership is delegated down a hierarchy",
      d: "The root delegates .com to its registry, the registry delegates example.com to its owner. Each level only stores pointers to the next." },
    { t: "A resolver does the walking so clients stay simple",
      d: "Your laptop sends one question and gets one answer. The resolver follows the chain of referrals on its behalf." },
    { t: "Caching removes almost all of the load",
      d: "Popular names are answered from memory. The root servers see a tiny fraction of the lookups they would see without caching." },
    { t: "TTL is the trade between speed and freshness",
      d: "A long TTL means fewer lookups but slow changes. A short TTL means quick failover but more traffic to the authoritative server." },
    { t: "The cost: it is old, unencrypted and trusted",
      d: "Plain DNS goes over UDP in cleartext and can be spoofed. DNSSEC signs answers, and DoH or DoT encrypt the lookup, but neither is universal." },
  ],

  hing: `<p><b>DNS ka kaam.</b> Naam ko IP address mein badalna. Ye ek phone directory jaisa hai, par poori duniya mein bata hua.</p>
<p><b>Lookup kaise chalta hai?</b> Tum resolver se puchte ho. Resolver ke cache mein nahi hai to wo root se puchta hai. Root .com wale servers ka pata deta hai. Wo domain ke apne server ka pata dete hain, aur wahan se asli jawab milta hai.</p>
<p><b>TTL kya hai?</b> Jawab kitni der tak yaad rakhna hai. Lamba TTL matlab tez, par change dheere dikhta hai. Chhota TTL matlab jaldi change, par zyada traffic.</p>
<p><b>Interview mein.</b> "DNS UDP port 53 par chalta hai, par jab jawab bada ho to TCP par fall back karta hai." Ye line yaad rakho.</p>`,

  viz: ["cn-dns-tree"],

  math: [
    { t: "One uncached lookup", d: "The resolver makes three sequential round trips: root, TLD, authoritative. Add the client's own hop to the resolver.", w:
`client -> resolver        10 ms
resolver -> root          20 ms
resolver -> .com TLD      30 ms
resolver -> authoritative 40 ms
-----------------------------
total                    100 ms

cached at the resolver:   10 ms  (just the first hop)` },
    { t: "What a TTL buys", d: "Say a popular name is asked for 100 times a second, and its TTL is 300 seconds.", w:
`requests in one TTL window = 100/s x 300 s = 30,000
authoritative lookups      = 1
fraction that go upstream  = 1 / 30,000 = 0.003%

TTL 5 s instead: 500 requests per lookup, 60x more upstream load` },
    { t: "The failover cost of a long TTL", d: "A server dies and you change the record. Resolvers keep serving the old address until their copy expires.", w:
`TTL = 3600 s (1 hour)
worst case: a resolver cached it 1 second before the change
-> stale for 3599 s, about 1 hour of failed requests

TTL = 60 s -> worst case about 1 minute of failure` },
  ],

  costs: [
    ["cache hit at the resolver", "about 1 round trip", "the common case, answered from memory in milliseconds"],
    ["full uncached lookup", "3 to 4 round trips", "root, TLD, authoritative, sometimes more with CNAME chains"],
    ["a typical A record TTL", "60 to 3600 s", "the tradeoff between failover speed and lookup load"],
    ["DNS transport", "UDP port 53", "falls back to TCP for answers too large for one datagram"],
  ],

  traps: [
    "<b>Saying a root server stores every domain.</b> It only knows the TLD servers. Delegation is the entire design.",
    "<b>Forgetting caching when debugging.</b> You changed the record, but the old one is still served until the TTL runs out, at the resolver and in your browser and OS too.",
    "<b>Mixing up recursive and authoritative.</b> A resolver finds answers for clients and caches them. An authoritative server holds the truth for a zone and does neither.",
    "<b>Putting a CNAME at the zone apex.</b> The bare domain must carry other records such as MX, and a CNAME may not coexist with them. Use an A record or a provider's alias feature.",
    "<b>Assuming DNS is private.</b> Classic DNS is plaintext. Anyone on the path sees which names you look up.",
  ],

  code: {
    pseudo: `resolve(name):
    if cache has name and not expired: return cache[name]
    server <- root
    loop:
        reply <- ask(server, name)
        if reply has an answer record:
            cache[name] <- reply.answer for reply.ttl seconds
            return reply.answer
        server <- reply.referral          # point to the next level down`,
    py: `import socket, struct

# A hand-made DNS A-record query over UDP to a public resolver.
def query(name, server="1.1.1.1"):
    header = struct.pack("!HHHHHH", 0x1234, 0x0100, 1, 0, 0, 0)
    qname = b"".join(bytes([len(p)]) + p.encode() for p in name.split(".")) + b"\\x00"
    packet = header + qname + struct.pack("!HH", 1, 1)       # type A, class IN
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    s.settimeout(2)
    s.sendto(packet, (server, 53))
    data, _ = s.recvfrom(512)
    return data

reply = query("example.com")
print(len(reply), "bytes back")
# the last 4 bytes of a simple reply are the IPv4 address
print(".".join(str(b) for b in reply[-4:]))`,
  },
  codecap: "DNS is a small binary protocol over UDP. A resolver does nothing more than this, in a loop, with a cache in front.",

  q: [
    ["What does DNS do?", "It maps a human name to records such as an IP address, using a distributed hierarchy of servers."],
    ["Walk through an uncached lookup.", "Client asks its resolver. The resolver asks a root server, gets pointed to the TLD, then to the domain's authoritative server, which returns the record."],
    ["What is a TTL and why does it matter?", "The number of seconds an answer may be cached. It trades lookup load against how fast a change spreads."],
    ["Recursive resolver versus authoritative server?", "The resolver searches on behalf of clients and caches. The authoritative server holds the actual records for its zone."],
    ["Why is DNS fast in practice despite so many hops?", "Almost every lookup is answered from a cache, so the root and TLD servers see only a small fraction of the real traffic."],
  ],

  p: [
    ["SRC", "https://www.rfc-editor.org/rfc/rfc1035", "RFC 1035, the DNS wire format", "H"],
    ["SRC", "https://howdns.works/", "How DNS Works, a comic walkthrough of a lookup", "E"],
    ["SRC", "https://www.cloudflare.com/learning/dns/what-is-dns/", "Cloudflare, what is DNS", "E"],
    ["SRC", "https://jvns.ca/blog/2021/12/06/dig-and-dns/", "Julia Evans, how to use dig", "E"],
    ["SRC", "https://dnsviz.net/", "Inspect the delegation chain of a real domain", "M"],
  ],
},

{
  id: "tcp-reliability",
  need: {
    ask: `<p>The network underneath, IP, is a best-effort service. It may drop a packet, deliver two copies, or deliver packet 5 before packet 4. You want to download a 3 MB file and get exactly the same bytes, in order.</p>
<p>What must sit on the two end machines to turn a lossy network into a reliable stream?</p>`,
    tries: [
      ["Send everything once and hope", "At a 1% loss rate a 3 MB file is about 2,100 packets, so around 21 are lost. A single missing packet corrupts the file."],
      ["Send each packet three times", "That triples the traffic for everyone, and it still fails whenever all three copies are lost. Ordering is not fixed either."],
    ],
    so: `<p>Number every byte, and make the receiver <b>acknowledge</b> what it has. If the sender hears no acknowledgement within a timeout, it sends that data again. The receiver uses the numbers to reorder and to throw away duplicates.</p>
<p>That is <b>TCP</b>. It also opens with a three-step <b>handshake</b> so both ends agree on starting numbers before any data moves.</p>`,
  },

  n: "TCP Reliability",
  group: "Transport layer",
  one: "TCP numbers every byte and waits for <b>acknowledgements</b>; anything not acknowledged in time is sent again, so a lossy network looks like a reliable stream.",

  plain: `<p>TCP gives a program the illusion of a clean pipe: bytes go in one end and come out of the other end, in order, with nothing lost or repeated. The network underneath gives no such promise.</p>
<p>Before data moves, there is a <b>three-way handshake</b>. The client sends SYN, the server answers SYN-ACK, the client replies ACK. Both sides now agree on starting <b>sequence numbers</b>.</p>
<p>Each segment carries the sequence number of its first byte. The receiver replies with an <b>ACK</b> naming the next byte it expects. If an ACK does not arrive within the <b>retransmission timeout</b>, the sender transmits again.</p>
<p>Closing takes a FIN from each side. <b>Analogy.</b> Reading a numbered book aloud over a bad phone line: the listener says "got up to page 12", and you repeat anything after that.</p>`,

  why: [
    { t: "The network below is allowed to be unreliable",
      d: "Keeping routers simple is what made the internet scale. So reliability has to be built by the two end hosts." },
    { t: "Detecting loss needs numbering",
      d: "If bytes carry sequence numbers, the receiver can see a gap and the sender can know exactly what was received." },
    { t: "Acknowledgements close the loop",
      d: "A cumulative ACK says that everything before byte N arrived. A timer on the sender turns silence into a decision to resend." },
    { t: "Fast retransmit avoids waiting for the timer",
      d: "If the receiver sees data beyond a gap, it repeats the same ACK. Three duplicate ACKs tell the sender what is missing, long before a timeout." },
    { t: "A handshake agrees on state before data",
      d: "Both sides pick random starting sequence numbers and confirm each other's. Without it, an old packet from a previous connection could be accepted as new." },
    { t: "The cost is latency, and head-of-line blocking",
      d: "The handshake costs a round trip before the first byte. One lost segment holds back everything after it until it is repaired." },
  ],

  hing: `<p><b>TCP kya karta hai?</b> Network unreliable hai, packets kho sakte hain ya ulte aa sakte hain. TCP har byte ko number deta hai aur receiver se ACK maangta hai. ACK nahi aaya to dobara bhejta hai.</p>
<p><b>Handshake kyun?</b> Dono taraf ko starting sequence number pe agree karna hota hai. SYN, SYN-ACK, ACK. Teen messages, ek round trip aur aadha.</p>
<p><b>Head-of-line blocking.</b> Agar segment 3 kho gaya, to 4, 5, 6 aa bhi jayein, application ko tab tak nahi milte jab tak 3 dobara nahi aata. Yahi TCP ki sabse badi kamzori hai.</p>
<p><b>Interview mein.</b> TCP stream of bytes hai, message boundary nahi hota. Do send() ek recv() mein bhi mil sakte hain.</p>`,

  viz: ["cn-tcp-segments"],

  math: [
    { t: "Sequence and ACK numbers by hand", d: "A client sends three segments of 100 bytes starting at sequence 1000. The server's ACK always names the next byte it wants.", w:
`client sends  seq=1000 len=100   server ACK 1100
client sends  seq=1100 len=100   server ACK 1200
client sends  seq=1200 len=100   server ACK 1300

ACK = the next byte expected = seq + len of what arrived in order` },
    { t: "A lost segment", d: "The same three segments, but the second one is dropped on the wire.", w:
`seq=1000 arrives          ACK 1100
seq=1100 LOST
seq=1200 arrives          ACK 1100   (duplicate: still wants 1100)
seq=1300 arrives          ACK 1100   (duplicate ACK number 2)
seq=1400 arrives          ACK 1100   (duplicate ACK number 3)

3 duplicate ACKs -> sender resends seq=1100 now, no timer wait` },
    { t: "What the window limits", d: "The sender may have only one window of unacknowledged bytes in flight. Throughput is then window divided by round trip time.", w:
`window = 65,535 bytes = 524,280 bits
RTT    = 100 ms

max throughput = 524,280 / 0.1 s = 5.24 Mbit/s
even on a 1 Gbit/s link

window scaling to 1 MB: 8,388,608 / 0.1 = 83.9 Mbit/s` },
    { t: "Time to the first byte", d: "Count round trips before the client can even send its request over a 100 ms RTT path.", w:
`SYN ->            \\ 1 RTT before the client may send data
<- SYN-ACK         /
ACK + request ->   half an RTT to arrive
<- response        half an RTT back

first byte back = 2 RTT = 200 ms of pure waiting
(add TLS and it grows, see the TLS page)` },
  ],

  costs: [
    ["connection setup", "1 RTT", "the three-way handshake, before the first request byte"],
    ["retransmit after loss", "1 RTT (fast) or the RTO", "fast retransmit needs three duplicate ACKs; the timer is the slow fallback"],
    ["header per segment", "20 bytes minimum", "plus options such as timestamps and window scaling"],
    ["throughput ceiling", "window / RTT", "a big window is required for fat, long links"],
    ["connection close", "4 segments", "FIN and ACK from each side, then TIME_WAIT on one end"],
  ],

  traps: [
    "<b>Thinking TCP preserves message boundaries.</b> It is a stream. Two sends can arrive as one read, and one send as two. You must frame your own messages.",
    "<b>Saying TCP guarantees delivery.</b> It guarantees that either the bytes arrive in order or you are told the connection failed. It cannot deliver across a dead link.",
    "<b>Forgetting the cost of a new connection.</b> Each fresh connection pays a handshake, which is why connection reuse and keep-alive matter.",
    "<b>Confusing ACK with application success.</b> An ACK means the OS received the bytes. It does not mean the program read or processed them.",
    "<b>Ignoring TIME_WAIT.</b> Closing thousands of short connections leaves ports parked for about a minute on the side that closed first, and a busy client can run out.",
  ],

  code: {
    pseudo: `sender:
    for each segment in window:
        send(seq, data); start timer(seq)
    on ACK(n):    mark everything below n delivered; slide window
    on timeout:   resend the oldest unacknowledged segment
    on 3 dup ACKs: resend the segment the ACK points at

receiver:
    if seq == expected: deliver, expected += len, ACK(expected)
    else: buffer it if ahead, send ACK(expected)   # duplicate ACK`,
    py: `import socket, threading

def server():
    s = socket.create_server(("127.0.0.1", 9090))
    conn, _ = s.accept()                   # handshake finished by the kernel
    buf = b""
    while len(buf) < 10:
        buf += conn.recv(4)                # stream: chunk sizes are arbitrary
    print("server got:", buf)
    conn.close()

threading.Thread(target=server, daemon=True).start()
import time; time.sleep(0.2)

c = socket.create_connection(("127.0.0.1", 9090))
c.sendall(b"hello")                        # two sends...
c.sendall(b"world")                        # ...may arrive as one recv
c.close()
time.sleep(0.2)`,
  },
  codecap: "The kernel runs the whole retransmission machine. Your code sees a byte stream with no message boundaries.",

  q: [
    ["How does TCP detect and repair loss?", "Sequence numbers reveal gaps, cumulative ACKs report progress, and a sender resends on a timeout or on three duplicate ACKs."],
    ["What are the three steps of the handshake and why?", "SYN, SYN-ACK, ACK. Both sides announce and confirm their starting sequence numbers before data flows."],
    ["What is head-of-line blocking in TCP?", "One lost segment holds back all later data from the application until it is retransmitted, even if the later data already arrived."],
    ["Why does a high-latency link need a large window?", "Throughput is capped at window divided by RTT, so a long RTT with a small window leaves the pipe mostly empty."],
    ["Does TCP keep message boundaries?", "No. It is a byte stream, so the application must add its own framing such as a length prefix."],
  ],

  p: [
    ["SRC", "https://www.rfc-editor.org/rfc/rfc9293", "RFC 9293, the consolidated TCP specification", "H"],
    ["SRC", "https://beej.us/guide/bgnet/html/#sendall", "Beej, partial sends and message framing", "E"],
    ["SRC", "https://www.cloudflare.com/learning/ddos/glossary/tcp-ip/", "Cloudflare, TCP in plain words", "E"],
    ["SRC", "https://docs.python.org/3/howto/sockets.html", "Python socket HOWTO, build the echo server above", "E"],
    ["SRC", "https://www.wireshark.org/docs/", "Watch a SYN, SYN-ACK, ACK and a retransmission in a capture", "M"],
  ],
},

{
  id: "congestion-control",
  need: {
    ask: `<p>A thousand senders share one 100 Mbit/s link. Nobody tells them how much capacity there is, or how many other senders exist. If all of them blast data at full speed, the router queues overflow and nearly every packet is dropped.</p>
<p>How can senders who cannot see each other share the link fairly and without collapse?</p>`,
    tries: [
      ["Everyone sends as fast as their own link allows", "The router buffer fills in milliseconds and drops most packets. Retransmissions add even more load, so useful throughput falls toward zero. This actually happened in 1986."],
      ["A fixed rate for every sender", "A fixed share of 100 kbit/s each would waste the link when only ten senders are active, and would still overload it if 2,000 show up."],
    ],
    so: `<p>Let each sender <b>probe</b>. Start slowly, raise the sending rate while packets get through, and cut it sharply when a packet is lost, since loss means somebody's queue is full.</p>
<p>TCP does this with a <b>congestion window</b>, <code>cwnd</code>: the number of segments it may have in flight. Grow it by one per round trip, halve it on loss. All senders doing the same settle near a fair share.</p>`,
  },

  n: "Congestion and Flow Control",
  group: "Transport layer",
  one: "TCP keeps a <b>congestion window</b> that grows while packets get through and <b>halves on loss</b>, so unseen senders converge on a fair share.",

  plain: `<p>Two different problems get confused. <b>Flow control</b> protects the receiver: it advertises a <b>receive window</b>, the buffer space it has left. <b>Congestion control</b> protects the network in between.</p>
<p>The sender never exceeds the smaller of the two windows. For congestion, TCP starts with a small <code>cwnd</code>, about 10 segments, and doubles it every round trip. That phase is called <b>slow start</b>, even though it grows fast.</p>
<p>At a threshold, or on the first loss, it switches to <b>congestion avoidance</b>: add one segment per round trip. On loss it cuts <code>cwnd</code> in half. Growing by one and halving on loss is called <b>AIMD</b>, additive increase and multiplicative decrease.</p>
<p><b>Analogy.</b> Merging onto a motorway in fog: speed up gently, and brake hard the moment you see brake lights.</p>`,

  why: [
    { t: "Capacity is shared and invisible",
      d: "No sender knows the link rate or how many others use it. The only signal available is whether packets arrive." },
    { t: "Loss therefore becomes the signal",
      d: "A dropped packet means a queue overflowed somewhere. Backing off when that happens is the cooperative thing to do." },
    { t: "Start low, then double to find the level fast",
      d: "Slow start doubles cwnd each round trip, so reaching a window of 64 segments from 1 takes only 6 round trips, not 64." },
    { t: "Then probe gently, back off hard",
      d: "Adding 1 and halving is stable: over many senders it converges to equal shares. Increasing by a multiple would overshoot and oscillate." },
    { t: "Flow control is a separate, simpler limit",
      d: "The receiver shouts how much room it has in every ACK. The sender obeys the smaller of that and its own cwnd." },
    { t: "The cost is a sawtooth, and some blind spots",
      d: "Throughput rises and falls in a sawtooth. Loss from a bad Wi-Fi link looks like congestion, so TCP slows down needlessly there." },
  ],

  hing: `<p><b>Do alag cheezein.</b> Flow control receiver ko bachata hai (uska buffer kitna khali hai). Congestion control beech ke network ko bachata hai. Sender in dono mein se chhoti window use karta hai.</p>
<p><b>Slow start.</b> Naam ke bawajood ye exponential hai. cwnd har RTT mein double hota hai: 10, 20, 40, 80.</p>
<p><b>AIMD.</b> Loss na ho to har RTT mein 1 badhao, loss ho to aadha kardo. Isse sab senders dheere dheere barabar share par aa jaate hain.</p>
<p><b>Interview mein.</b> Wi-Fi par packet kharab signal se bhi kho jaata hai, par TCP use congestion samajh kar speed kam kar deta hai. Isliye wireless par TCP kabhi kabhi slow lagta hai.</p>`,

  viz: ["cn-cwnd-growth"],

  math: [
    { t: "Slow start from a window of 10", d: "Each round trip every segment is acknowledged, and each ACK adds one segment to the window, so it doubles.", w:
`RTT 1:  cwnd = 10   sent   10   (total  10)
RTT 2:  cwnd = 20   sent   20   (total  30)
RTT 3:  cwnd = 40   sent   40   (total  70)
RTT 4:  cwnd = 80   sent   30   (total 100)  <- done

100 segments x 1460 B = 146 KB in 4 RTTs = 200 ms at 50 ms RTT` },
    { t: "The AIMD sawtooth", d: "A loss at cwnd 32 halves it to 16. Then the window grows by 1 per round trip.", w:
`loss at cwnd = 32   -> cwnd = 16
16 -> 17 -> 18 -> ... -> 32   = 16 round trips
at RTT 50 ms: 16 x 50 = 800 ms to regain the old rate

average over the tooth = (16 + 32) / 2 = 24 segments` },
    { t: "How much data fills a pipe", d: "The bandwidth-delay product is how many bytes must be in flight to keep a link full.", w:
`link 100 Mbit/s, RTT 50 ms
BDP = 100,000,000 bit/s x 0.05 s = 5,000,000 bits
    = 625,000 bytes = about 428 segments of 1460 B

a window below 428 segments leaves the link partly idle` },
  ],

  costs: [
    ["slow start", "doubles per RTT", "log2(target) round trips to reach a target window"],
    ["congestion avoidance", "+1 segment per RTT", "the cautious probing phase"],
    ["reaction to loss", "halve cwnd", "multiplicative decrease, the back-off that keeps things stable"],
    ["short flows", "never leave slow start", "a 20 KB page may finish before TCP has found the link's speed"],
  ],

  traps: [
    "<b>Mixing up flow control and congestion control.</b> One protects the receiver's buffer, the other protects the shared network. TCP applies both limits at once.",
    "<b>Saying slow start is slow.</b> It is exponential. The name is historical: it is slow compared with sending a full window at once.",
    "<b>Blaming the application for a sawtooth.</b> The saw-shaped throughput graph is TCP behaving normally, not a bug.",
    "<b>Expecting loss to always mean congestion.</b> On wireless links loss is often noise. Modern algorithms like BBR measure bandwidth and delay instead of reacting to loss.",
    "<b>Using many parallel connections to go faster.</b> It does grab a larger share of a bottleneck, but it is unfair to other users and increases total load.",
  ],

  code: {
    pseudo: `cwnd <- 10 ; ssthresh <- infinity
each round trip with no loss:
    if cwnd < ssthresh: cwnd <- cwnd * 2        # slow start
    else:               cwnd <- cwnd + 1        # congestion avoidance
on loss (3 dup ACKs):
    ssthresh <- cwnd / 2 ; cwnd <- ssthresh
on timeout:
    ssthresh <- cwnd / 2 ; cwnd <- 1            # back to slow start
send at most min(cwnd, receiver_window) segments`,
    py: `def simulate(rtts, loss_at, cwnd=10, ssthresh=64):
    trace = []
    for rtt in range(1, rtts + 1):
        trace.append(cwnd)
        if rtt in loss_at:                  # 3 duplicate ACKs
            ssthresh = max(cwnd // 2, 2)
            cwnd = ssthresh
        elif cwnd < ssthresh:
            cwnd = min(cwnd * 2, ssthresh)  # slow start, capped at threshold
        else:
            cwnd += 1                       # additive increase
    return trace

print(simulate(30, loss_at={8, 20}))
# climbs fast, then +1 per RTT, halves at each loss: the sawtooth`,
  },
  codecap: "Ten lines reproduce the whole sawtooth. Real kernels add many refinements, but the shape is this.",

  q: [
    ["Flow control versus congestion control?", "Flow control stops a sender overwhelming the receiver, using the receive window. Congestion control stops it overwhelming the network, using cwnd."],
    ["What is AIMD and why does it work?", "Add one per round trip, halve on loss. It converges to fair shares because the decrease hurts big senders more than small ones."],
    ["What happens during slow start?", "The window starts around 10 segments and doubles every round trip until a loss or the slow start threshold."],
    ["Why is a short HTTP request often limited by slow start?", "It ends before the window has grown, so the connection never reaches the link's real speed."],
    ["What is the bandwidth-delay product?", "Bandwidth times RTT: the number of bytes that must be in flight to fill the link."],
  ],

  p: [
    ["SRC", "https://www.rfc-editor.org/rfc/rfc5681", "RFC 5681, TCP congestion control", "H"],
    ["SRC", "https://ee.lbl.gov/papers/congavoid.pdf", "Van Jacobson, Congestion Avoidance and Control (1988)", "H"],
    ["SRC", "https://research.google/pubs/bbr-congestion-based-congestion-control/", "BBR, control by bandwidth and delay", "M"],
    ["SRC", "https://www.cloudflare.com/learning/performance/what-is-tcp-slow-start/", "Cloudflare, TCP slow start", "E"],
    ["SRC", "https://www.speedtest.net/", "Run a transfer and watch throughput ramp up in the first seconds", "E"],
  ],
},

{
  id: "http-evolution",
  need: {
    ask: `<p>A modern page needs 100 files: scripts, styles, images, fonts. HTTP/1.1 lets a browser ask for one file at a time on a connection. The reply must finish before the next request gets an answer.</p>
<p>Each round trip to the server costs 50 ms. How does a browser load 100 files without waiting 5 seconds?</p>`,
    tries: [
      ["Open 100 connections", "Each connection pays a handshake and its own slow start, and servers cap the number per client. Browsers settled on about 6 per host for exactly this reason."],
      ["Bundle everything into one giant file", "One tiny CSS change invalidates the whole cache, and the page waits for a huge download before it can show anything."],
    ],
    so: `<p>Change the protocol. HTTP/2 puts many <b>streams</b> on one connection and interleaves their frames, so one slow file no longer blocks the rest. HTTP/3 moves the same idea onto <b>QUIC</b> over UDP, so a lost packet only stalls its own stream.</p>
<p>The meaning of a request stays the same: method, URL, headers, body. What changes is how the bytes are packaged on the wire.</p>`,
  },

  n: "HTTP/1.1, 2 and 3",
  group: "Application layer",
  one: "HTTP's meaning never changed; its <b>packaging</b> did: 1.1 serves one reply at a time per connection, 2 multiplexes streams, 3 removes TCP's head-of-line blocking.",

  plain: `<p>HTTP is a request and a response: a <b>method</b> (GET, POST), a <b>URL</b>, headers, and sometimes a body. The server answers with a <b>status code</b> such as 200 or 404, headers and a body.</p>
<p><b>HTTP/1.1</b> is text. It reuses a connection (keep-alive), but replies come back strictly in order, so one slow reply holds up the queue behind it. That is <b>head-of-line blocking</b> at the HTTP level.</p>
<p><b>HTTP/2</b> is binary. It splits messages into frames tagged with a stream number, so many requests share one TCP connection. Headers are compressed. Yet one lost TCP segment still stalls every stream.</p>
<p><b>HTTP/3</b> runs over QUIC on UDP, with a per-stream loss recovery. <b>Analogy.</b> HTTP/1.1 is a single checkout lane, HTTP/2 is many baskets sharing one lane, and HTTP/3 gives each basket its own lane.</p>`,

  why: [
    { t: "Pages grew from one file to hundreds",
      d: "HTTP/1.0 opened a connection per file. Even with reuse, one reply at a time cannot keep up with a hundred small objects." },
    { t: "Multiplexing removes the queue",
      d: "Tag each chunk of data with a stream ID. The server can interleave replies, so a big image does not hold up a small script." },
    { t: "Headers were pure repetition",
      d: "Cookies and user agents repeated on every request cost hundreds of bytes each. HTTP/2 compresses them using a shared table (HPACK)." },
    { t: "But TCP still delivers one ordered byte stream",
      d: "If one packet is lost, TCP holds back everything after it, including bytes belonging to other, unaffected streams." },
    { t: "So HTTP/3 replaces TCP with QUIC on UDP",
      d: "QUIC does its own reliability per stream, so a loss only blocks the stream it hit. It also folds the TLS handshake into the connection setup." },
    { t: "The costs: UDP is often blocked, and complexity",
      d: "Some networks block or throttle UDP, so clients fall back to HTTP/2. QUIC also runs in user space, which uses more CPU than a kernel TCP stack." },
  ],

  hing: `<p><b>HTTP/1.1.</b> Ek connection par ek time mein ek hi reply. Doosra reply peeche line mein wait karta hai. Isi ko head-of-line blocking kehte hain.</p>
<p><b>HTTP/2.</b> Ek hi connection par kai streams, frames mix hoke jaate hain. Headers compress hote hain. Par neeche TCP hi hai, to ek packet khoya to sab streams ruk jaate hain.</p>
<p><b>HTTP/3.</b> TCP ki jagah QUIC (UDP ke upar). Har stream ka apna loss recovery, aur TLS handshake bhi saath mein ho jaata hai.</p>
<p><b>Interview mein.</b> "HTTP/2 ne HTTP level ka HOL blocking hataya, HTTP/3 ne TCP level ka bhi." Ye ek line kaafi hai.</p>`,

  viz: ["cn-http-queue"],

  math: [
    { t: "100 files over HTTP/1.1 with 6 connections", d: "Each connection fetches one file per round trip. Divide the files across the connections.", w:
`100 files / 6 connections = 16.7 -> 17 rounds
17 rounds x 50 ms RTT     = 850 ms of request latency
(plus a handshake and a slow start on each of the 6 connections)` },
    { t: "The same page over HTTP/2", d: "All 100 requests go out together on one connection, so latency is about one round trip plus transfer time.", w:
`1 connection, 100 streams in flight at once
requests sent: 1 RTT = 50 ms
then bandwidth-limited: 2 MB total at 40 Mbit/s = 400 ms

HTTP/1.1: 850 ms of waiting hides inside the same download` },
    { t: "Header compression", d: "A request repeats nearly the same 500 bytes of headers. After the first, HPACK sends only the changes.", w:
`HTTP/1.1: 100 requests x 500 B headers   = 50,000 B
HTTP/2:   first 500 B, then ~20 B each     = 500 + 99 x 20
                                           = 2,480 B

saving = 47,520 B, about 95%` },
  ],

  costs: [
    ["new connection (H1/H2 + TLS 1.3)", "TCP 1 RTT + TLS 1 RTT", "2 round trips before the first request can be sent"],
    ["new connection (HTTP/3)", "1 RTT", "QUIC merges transport and TLS handshakes; 0 RTT on resumption"],
    ["browser limit on HTTP/1.1", "about 6 connections per host", "the reason sharding domains was once a trick"],
    ["header size, HTTP/1.1", "hundreds of bytes per request", "sent in full, in text, every time"],
  ],

  traps: [
    "<b>Saying HTTP/2 fixed head-of-line blocking completely.</b> It fixed it at the HTTP layer only. TCP loss still stalls every stream, which is what HTTP/3 addresses.",
    "<b>Domain sharding on HTTP/2.</b> It was an HTTP/1.1 workaround. Over HTTP/2 it splits the connection, defeating multiplexing and compression.",
    "<b>Saying HTTP is stateless and meaning cookies do not exist.</b> The protocol keeps no memory between requests. Sessions are rebuilt from cookies or tokens.",
    "<b>Confusing 401 and 403.</b> 401 means we do not know who you are. 403 means we know who you are and the answer is no.",
    "<b>Ignoring idempotency.</b> GET, PUT and DELETE are safe to retry. POST is not, so retrying a payment on a timeout can charge twice.",
  ],

  code: {
    pseudo: `# HTTP/1.1 on the wire is just text over a TCP stream
open tcp connection to host:80
send  "GET /path HTTP/1.1\\r\\nHost: host\\r\\nConnection: close\\r\\n\\r\\n"
read  status line, then headers until a blank line, then the body

# HTTP/2 and 3 carry the same fields, as binary frames on numbered streams`,
    py: `import socket

host = "example.com"
req = ("GET / HTTP/1.1\\r\\n"
       f"Host: {host}\\r\\n"
       "Connection: close\\r\\n\\r\\n").encode()

s = socket.create_connection((host, 80))
s.sendall(req)
data = b""
while chunk := s.recv(4096):               # read until the server closes
    data += chunk

head, _, body = data.partition(b"\\r\\n\\r\\n")
print(head.decode().splitlines()[0])       # HTTP/1.1 200 OK
print(len(body), "body bytes")`,
  },
  codecap: "HTTP/1.1 is readable text over a plain TCP socket. Everything newer is the same message in different packaging.",

  q: [
    ["What is head-of-line blocking in HTTP/1.1?", "Replies on one connection must come back in order, so a slow reply blocks everything queued behind it."],
    ["How does HTTP/2 improve on HTTP/1.1?", "It multiplexes many streams on one connection, compresses headers, and uses a binary framing."],
    ["Why is HTTP/2 still affected by packet loss?", "It runs on TCP, which holds back all later bytes after a loss, whichever stream they belong to."],
    ["What does HTTP/3 change?", "It runs over QUIC on UDP, with per-stream recovery and a combined transport and TLS handshake."],
    ["Which HTTP methods are safe to retry?", "GET, PUT and DELETE are idempotent. POST is not, so retries need an idempotency key."],
  ],

  p: [
    ["SRC", "https://www.rfc-editor.org/rfc/rfc9110", "RFC 9110, HTTP semantics", "H"],
    ["SRC", "https://www.rfc-editor.org/rfc/rfc9114", "RFC 9114, HTTP/3", "H"],
    ["SRC", "https://developer.mozilla.org/en-US/docs/Web/HTTP", "MDN, the HTTP guide", "E"],
    ["SRC", "https://http3-explained.haxx.se/", "HTTP/3 explained, by the author of curl", "M"],
    ["SRC", "https://curl.se/docs/manpage.html", "Run curl -v --http2 and --http3 against a site and compare", "E"],
  ],
},

{
  id: "tls-https",
  need: {
    ask: `<p>You send your password to a server across the internet. Your packet passes through your Wi-Fi, your ISP and many routers that you do not control. Anyone on the path can read it, change it, or pretend to be the server.</p>
<p>How can two strangers, who have never met, agree on a secret over a channel that everyone can see?</p>`,
    tries: [
      ["Encrypt with a password you both know", "You and a brand-new website do not share one. Sending the password first just exposes it to the same listeners."],
      ["Use a different cipher nobody knows", "Hiding the method is not security. Once one person reverse-engineers it, every user is exposed, and you still cannot prove the server is the real one."],
    ],
    so: `<p>Use two ideas together. First, a <b>key exchange</b> (Diffie-Hellman) lets two parties create a shared secret while an eavesdropper sees only public numbers. Second, a <b>certificate</b> signed by a trusted authority proves that a public key really belongs to example.com.</p>
<p>After the handshake, both sides use fast symmetric encryption with the shared key. That is <b>TLS</b>, and HTTPS is HTTP inside it.</p>`,
  },

  n: "TLS and HTTPS",
  group: "Security",
  one: "TLS uses a <b>key exchange</b> to agree a secret in public and a <b>certificate chain</b> to prove who you agreed it with, then encrypts with the shared key.",

  plain: `<p>TLS (Transport Layer Security) sits between TCP and HTTP. It gives three things: <b>confidentiality</b> (nobody can read the traffic), <b>integrity</b> (nobody can change it unnoticed) and <b>authentication</b> (you are talking to the real server).</p>
<p>The handshake works like this. The client lists the ciphers it supports and sends a key share. The server replies with its own key share and its <b>certificate</b>. Both compute the same secret, and from here everything is encrypted.</p>
<p>The certificate holds the server's public key and its name, signed by a <b>certificate authority</b> (CA). Your device ships with a list of trusted CAs. It checks the signature chain from the server's certificate up to one it already trusts.</p>
<p><b>Analogy.</b> Passport control. The passport is signed by a government you already trust, and the photo matches the face in front of you.</p>`,

  why: [
    { t: "The wire is public, so the secret must be created in public",
      d: "Diffie-Hellman lets each side combine its private number with the other's public number and reach the same result. The eavesdropper cannot." },
    { t: "But a secret with a stranger is worthless",
      d: "An attacker in the middle could run one exchange with you and another with the server. You need proof of who is on the other end." },
    { t: "A signature chain provides the proof",
      d: "The CA signs a certificate binding a name to a public key. Your device trusts a few hundred root CAs, and every certificate must chain up to one." },
    { t: "Symmetric encryption does the real work",
      d: "Public-key maths is slow, so it is used only for the handshake. The bulk data uses a fast cipher such as AES-GCM, keyed by the shared secret." },
    { t: "Fresh keys give forward secrecy",
      d: "Each session uses a new ephemeral key pair. If the server's long-term key leaks later, recorded old traffic still cannot be decrypted." },
    { t: "The costs: a round trip, CPU, and trust in CAs",
      d: "TLS 1.3 needs one extra round trip, and the whole scheme relies on CAs not issuing certificates wrongly." },
  ],

  hing: `<p><b>TLS kya deta hai?</b> Teen cheezein: koi padh nahi sakta (confidentiality), koi badal nahi sakta (integrity), aur tum sahi server se baat kar rahe ho (authentication).</p>
<p><b>Secret kaise bante hain?</b> Key exchange se. Dono apna private number rakhte hain, public number bhejte hain, aur dono same shared secret nikaal lete hain. Beech wala sirf public numbers dekhta hai.</p>
<p><b>Certificate kyun?</b> Man in the middle se bachne ke liye. CA ne sign kiya hai ki ye public key example.com ki hai. Tumhari device pehle se CA list pe bharosa karti hai.</p>
<p><b>Interview mein.</b> Asymmetric sirf handshake mein, data symmetric cipher se. Ye line zaroor bolo.</p>`,

  viz: ["cn-cert-chain"],

  math: [
    { t: "Diffie-Hellman with tiny numbers", d: "Public values: prime p = 23 and base g = 5. Alice keeps a = 6 secret, Bob keeps b = 15 secret.", w:
`Alice sends A = 5^6  mod 23 = 15625 mod 23 = 8
Bob   sends B = 5^15 mod 23 = 19

Alice computes  B^a = 19^6  mod 23 = 2
Bob   computes  A^b = 8^15  mod 23 = 2

shared secret = 2; an eavesdropper saw only 23, 5, 8 and 19` },
    { t: "Why guessing does not work at real size", d: "Real groups use primes of 2048 bits, or elliptic curves of about 256 bits. Brute force is hopeless.", w:
`toy example: try a = 1..22 -> at most 22 guesses
real 256-bit key space: 2^256 = about 1.2 x 10^77 guesses

at 10^12 guesses/s: 10^65 seconds, the universe is 4 x 10^17 s` },
    { t: "What TLS adds to the first request", d: "On a 100 ms RTT path compare the setup before the first HTTP request.", w:
`TCP handshake            1 RTT  = 100 ms
TLS 1.2 handshake        2 RTT  = 200 ms   -> request at 300 ms
TLS 1.3 handshake        1 RTT  = 100 ms   -> request at 200 ms
TLS 1.3 resumption (0-RTT)  0 RTT          -> request at 100 ms` },
  ],

  costs: [
    ["TLS 1.3 handshake", "1 RTT", "TLS 1.2 needed 2; resumption can send data with the first flight"],
    ["bulk encryption", "a few % CPU", "AES-GCM runs in hardware on modern CPUs"],
    ["certificate validity", "90 days to 13 months", "short on purpose, so revocation matters less"],
    ["trusted root CAs", "a few hundred", "each is a party you implicitly trust with every site"],
  ],

  traps: [
    "<b>Saying HTTPS encrypts the URL host.</b> The domain name still leaks through DNS and the TLS SNI field. The path and query are hidden, the host is not.",
    "<b>Mixing up the two kinds of encryption.</b> Public-key (asymmetric) is used to agree a key. The data itself is protected with symmetric encryption.",
    "<b>Disabling certificate verification to make an error go away.</b> It removes the only protection against a man in the middle, and it is a very common production bug.",
    "<b>Treating the padlock as a trust badge.</b> It only means the connection is encrypted to that domain. A phishing site can have a valid certificate.",
    "<b>Forgetting certificates expire.</b> A missed renewal takes the whole service down at midnight, so automate it.",
  ],

  code: {
    pseudo: `client:  send ClientHello(ciphers, key_share_c)
server:  send ServerHello(key_share_s) + Certificate + Finished(signed)
client:  verify certificate chain to a trusted root, and the hostname
client:  verify the server's signature over the handshake
both:    secret <- key_exchange(my_private, other_public)
         keys   <- derive(secret)           # symmetric keys
         all further data: AEAD_encrypt(keys, data)`,
    py: `import socket, ssl

host = "example.com"
ctx = ssl.create_default_context()          # trusted CAs + hostname check on

with socket.create_connection((host, 443)) as raw:
    with ctx.wrap_socket(raw, server_hostname=host) as tls:
        print(tls.version())                # TLSv1.3
        print(tls.cipher())                 # cipher suite agreed
        cert = tls.getpeercert()
        print(cert["subject"])
        print("expires:", cert["notAfter"])`,
  },
  codecap: "create_default_context() turns on chain verification and the hostname check. Never replace it with an unverified context.",

  q: [
    ["What three guarantees does TLS give?", "Confidentiality, integrity and authentication of the server."],
    ["How can two parties agree a secret in public?", "Diffie-Hellman key exchange: each side combines its private value with the other's public value and reaches the same secret."],
    ["Why are certificates needed on top of the key exchange?", "Without them a man in the middle could run separate exchanges with each side. A signed certificate proves the key belongs to the named server."],
    ["Why is bulk data not encrypted with public-key crypto?", "It is far too slow. Public-key maths is used only to agree a symmetric key."],
    ["What is forward secrecy?", "Using fresh ephemeral keys per session, so leaking the long-term key later cannot decrypt old recorded traffic."],
  ],

  p: [
    ["SRC", "https://www.rfc-editor.org/rfc/rfc8446", "RFC 8446, TLS 1.3", "H"],
    ["SRC", "https://tls13.xargs.org/", "The Illustrated TLS 1.3 Connection, byte by byte", "M"],
    ["SRC", "https://letsencrypt.org/how-it-works/", "How Let's Encrypt issues a certificate", "E"],
    ["SRC", "https://docs.python.org/3/library/ssl.html", "ssl module docs", "E"],
    ["SRC", "https://www.ssllabs.com/ssltest/", "Test the TLS setup of a real site", "E"],
  ],
},

{
  id: "load-balancing",
  need: {
    ask: `<p>One server handles 1,000 requests a second. Your site now gets 3,500. You buy three more servers, but the clients only know a single address.</p>
<p>Who decides which server gets each request, and what happens when one of them dies?</p>`,
    tries: [
      ["Give clients a list and let them pick", "Every client now needs the server list kept up to date. A dead server in a client's list means errors until every client is updated."],
      ["Round-robin DNS only", "Resolvers cache the answer, so a dead server keeps receiving traffic until the TTL expires. It also cannot see load, so a heavy client pins a single server."],
    ],
    so: `<p>Put a <b>load balancer</b> in front: one stable address that accepts connections and forwards each one to a healthy backend. It runs <b>health checks</b> and removes a server that stops answering.</p>
<p>How it picks is a policy: round robin, least connections, or a hash of the client, so the same client reaches the same server.</p>`,
  },

  n: "Load Balancing and Proxies",
  group: "Application layer",
  one: "A load balancer owns one stable address, <b>spreads connections across healthy backends</b>, and picks by policy: round robin, least connections or a hash.",

  plain: `<p>A <b>load balancer</b> sits between clients and a group of identical servers. Clients see one address. Behind it, servers can be added, removed or replaced without anyone noticing.</p>
<p>It works at two levels. A <b>layer 4</b> balancer looks only at IP addresses and ports, so it is fast and forwards TCP connections unchanged. A <b>layer 7</b> balancer reads HTTP, so it can route by URL, header or cookie, and terminate TLS.</p>
<p>Health checks keep it honest: it probes each backend every few seconds and stops sending traffic to one that fails. A <b>reverse proxy</b> is the same shape, a server that stands in for the real ones.</p>
<p><b>Analogy.</b> A restaurant host who seats each party at a free table, and quietly closes a table that has a problem.</p>`,

  why: [
    { t: "One machine has a ceiling",
      d: "Past a point, a bigger machine is too costly or does not exist. Several machines behind one front door scale much further." },
    { t: "A single front address hides the changes behind it",
      d: "Clients never learn about individual servers. You can deploy, scale and replace them freely." },
    { t: "Health checks make failure survivable",
      d: "Two servers at 99% each give 1 - 0.01 x 0.01 = 99.99% when one covers for the other. That only works if a dead one is skipped automatically." },
    { t: "The policy depends on the work",
      d: "Round robin suits equal short requests. Least connections suits uneven long ones. A hash suits cases that need the same client on the same server." },
    { t: "Layer 7 buys features, and costs speed",
      d: "Reading HTTP allows path routing, TLS termination and caching. Each of those costs CPU compared with just forwarding bytes." },
    { t: "The balancer itself must not be the single point of failure",
      d: "Run two or more, sharing a virtual IP, or use anycast. Otherwise you have moved the single point of failure, not removed it." },
  ],

  hing: `<p><b>Load balancer kya hai?</b> Ek hi address jo bahut saare servers ke aage khada hai. Client ko sirf ek address dikhta hai, peeche servers badalte rehte hain.</p>
<p><b>L4 vs L7.</b> L4 sirf IP aur port dekhta hai, tez hai. L7 HTTP padhta hai, URL ya cookie ke hisaab se route kar sakta hai, par thoda mehenga hai.</p>
<p><b>Health check.</b> Har kuch second mein backend ko ping karo. Jawab nahi aaya to use rotation se nikaal do.</p>
<p><b>Interview mein.</b> "LB khud single point of failure na bane" ye zaroor bolo. Do LB, shared virtual IP ya anycast.</p>`,

  viz: ["cn-lb-tree"],

  math: [
    { t: "Capacity and headroom", d: "Each server handles 1,000 requests a second. The site needs 3,500, and must survive losing one server.", w:
`servers needed for 3,500 req/s = 3,500 / 1,000 = 3.5 -> 4
lose one: 3 x 1,000 = 3,000 < 3,500    <- overload
so run 5: lose one, 4 x 1,000 = 4,000 >= 3,500 ok` },
    { t: "Why a hash by mod N moves almost everything", d: "Twelve keys are sent to server (key mod 3). Adding a fourth server changes the divisor.", w:
`key:     0 1 2 3 4 5 6 7 8 9 10 11
mod 3:   0 1 2 0 1 2 0 1 2 0  1  2
mod 4:   0 1 2 3 0 1 2 3 0 1  2  3
same?    y y y n n n n n n n  n  n

3 of 12 stay, 9 of 12 move = 75% of keys remapped` },
    { t: "Availability from redundancy", d: "A server is up 99% of the time. Servers fail independently, and any live one can serve.", w:
`1 server:   99%                      = 3.65 days down a year
2 servers:  1 - 0.01^2 = 99.99%      = 52.6 min a year
3 servers:  1 - 0.01^3 = 99.9999%    = 31.5 s a year` },
  ],

  costs: [
    ["layer 4 balancing", "very low per connection", "no HTTP parsing, close to wire speed"],
    ["layer 7 balancing", "CPU per request", "parses HTTP, terminates TLS, can route by content"],
    ["health check interval", "2 to 10 s typical", "also the worst-case time to notice a dead backend"],
    ["hash by mod N", "remaps most keys on resize", "consistent hashing moves only about 1/N of them"],
  ],

  traps: [
    "<b>Forgetting the balancer is a single point of failure.</b> One load balancer in front of ten servers is still one box whose death takes everything down.",
    "<b>Using sticky sessions to hide server-side state.</b> It works until that server dies and the sessions go with it. Keep state in a shared store.",
    "<b>Plain mod N hashing for caches.</b> Adding one server invalidates about 75% of the cached keys at once, which looks like an outage. Use consistent hashing.",
    "<b>Round robin on uneven requests.</b> One backend gets a run of heavy requests and falls behind, while others idle. Least connections handles this better.",
    "<b>Losing the client IP.</b> Behind a proxy the server sees the proxy's address. Read X-Forwarded-For or use the PROXY protocol, and only trust it from your own proxy.",
  ],

  code: {
    pseudo: `pick_backend(request):
    live <- [b for b in backends if b.healthy]
    if policy == round_robin:     return live[counter++ % len(live)]
    if policy == least_conns:     return min(live, key=active_connections)
    if policy == hash:            return live[hash(client_ip) % len(live)]

every 5 s: for b in backends: b.healthy <- probe(b) succeeds`,
    py: `import itertools, zlib

backends = ["s1", "s2", "s3"]
healthy = {"s1": True, "s2": True, "s3": True}
rr = itertools.count()

def round_robin():
    live = [b for b in backends if healthy[b]]
    return live[next(rr) % len(live)]

def by_hash(client_ip):
    live = [b for b in backends if healthy[b]]
    return live[zlib.crc32(client_ip.encode()) % len(live)]

print([round_robin() for _ in range(6)])    # s1 s2 s3 s1 s2 s3
healthy["s2"] = False                       # health check failed
print([round_robin() for _ in range(4)])    # skips s2 from now on
print(by_hash("203.0.113.9"))               # same client, same server`,
  },
  codecap: "The core of a balancer is a filter for health and a rule for choosing. Everything else is performance engineering.",

  q: [
    ["Layer 4 versus layer 7 load balancing?", "L4 forwards TCP by IP and port, fast and content-blind. L7 reads HTTP, so it can route by path or header and terminate TLS, at higher CPU cost."],
    ["Why are health checks essential?", "Without them a dead backend keeps receiving traffic. Redundancy only helps if failures are detected and skipped."],
    ["When would you choose least connections over round robin?", "When requests vary a lot in duration, since round robin ignores how busy each backend currently is."],
    ["Why is hashing by mod N a bad idea for a cache cluster?", "Changing N remaps most keys, so a resize wipes out most of the cache. Consistent hashing remaps only about 1/N."],
    ["How do you avoid the balancer being a single point of failure?", "Run several, sharing a virtual IP with failover, or use anycast or DNS across them."],
  ],

  p: [
    ["SRC", "https://nginx.org/en/docs/http/load_balancing.html", "nginx, HTTP load balancing methods", "E"],
    ["SRC", "https://www.haproxy.org/download/2.0/doc/intro.txt", "HAProxy, an introduction to proxying and balancing", "M"],
    ["SRC", "https://sre.google/sre-book/load-balancing-frontend/", "Google SRE book, load balancing at the frontend", "M"],
    ["SRC", "https://www.cloudflare.com/learning/performance/what-is-load-balancing/", "Cloudflare, what is load balancing", "E"],
    ["SRC", "https://en.wikipedia.org/wiki/Consistent_hashing", "Consistent hashing, what it fixes about mod N", "M"],
  ],
},

];
