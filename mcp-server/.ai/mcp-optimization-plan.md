# MCP Server Durable Objects Optimization Plan

## Problem Statement

Account has used 90% of the daily Cloudflare Durable Objects free tier limit of 100,000 rows_written.

**Traffic Stats (Last Month):**
- Total Requests: 503.62k
- Success Rate: 68.56% (345.29k)
- Error Rate: 31.44% (158.33k)
- Actual Users: 10-500 active users

**Daily Average:** ~16,700 requests/day
**Expected Writes:** ~50,000+ writes/day

---

## Root Causes Analysis (UltraThink)

### 1. Architecture Issue: New Durable Object Per Request ⚠️

**Current Behavior:**
```typescript
// In agents/dist/mcp/index.js (lines 366-378)
const sessionId = url.searchParams.get("sessionId") || namespace.newUniqueId().toString();
const id = namespace.idFromName(`sse:${sessionId}`);
const doStub = namespace.get(id);
await doStub._init(ctx.props);
```

**Problem:**
- Each GET request to `/sse` without a sessionId generates a NEW unique ID
- Each unique sessionId creates a NEW Durable Object instance
- Each new DO performs multiple storage writes during initialization

**Storage Writes Per New DO:**
```typescript
// From agents library - McpAgent._init() and related methods:
1. await this.ctx.storage.put("props", props ?? {});           // Line 200
2. await this.ctx.storage.put("transportType", "unset");       // Line 202
3. await this.ctx.storage.put("transportType", "sse");         // Line 234
4. await this.ctx.storage.put("initialized", true);            // Line 211
```

**The Math:**
- 16,700 requests/day
- If 50% are new sessions = 8,350 new DOs
- Each DO = 3-4 storage writes
- **Total: 25,000-33,000 writes/day from initialization alone**
- Plus state updates, reconnections, retries
- **Result: ~90,000 writes/day (90% of limit!)**

### 2. Bot Traffic (31.44% Error Rate) 🤖

The high error rate (158.33k errors) indicates:

**Likely Sources:**
- Web crawlers (Google, Bing, etc.) probing `/sse` endpoint
- Security scanners checking for vulnerabilities
- Monitoring tools performing health checks
- AI agent clients with poor retry logic
- Malformed requests from automated tools

**Impact:**
- Each bot request creates a new DO (wasted writes)
- Failed requests may retry multiple times
- Bots don't reuse sessionIds
- No authentication = public endpoint abuse

### 3. No Protection Layers 🛡️

**Currently Missing:**
- ❌ No rate limiting
- ❌ No bot detection/blocking
- ❌ No request authentication
- ❌ No session caching/reuse hints
- ❌ No dedicated health check endpoint
- ❌ No write optimization (always writes even if value unchanged)

---

## Solutions (Priority Order)

### Phase 1: IMMEDIATE FIXES (Reduce writes by 60-80%)

#### 1.1 Add Worker-Level Rate Limiting
**Location:** `mcp-server/src/index.ts`

Block requests BEFORE Durable Object creation:

```typescript
// Add rate limiting using in-memory cache or CF Rate Limiting API
const rateLimiter = {
  async check(ip: string): Promise<boolean> {
    // Implement per-IP rate limiting: 10 requests/minute
    // Use Workers KV or in-memory Map with TTL
  }
};

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';

    // Rate limit check
    if (!(await rateLimiter.check(ip))) {
      return new Response('Rate limit exceeded', { status: 429 });
    }

    // ... rest of handler
  }
};
```

**Expected Impact:** Reduce bot traffic by 40-50%

#### 1.2 Add Health Check Endpoint
**Location:** `mcp-server/src/index.ts`

Redirect monitoring bots away from DO-heavy routes:

```typescript
export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);

    // Lightweight health check (no DO creation)
    if (url.pathname === "/health" || url.pathname === "/") {
      return new Response(JSON.stringify({
        status: "ok",
        version: "1.0.0"
      }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // ... rest of handler
  }
};
```

**Expected Impact:** Reduce unnecessary DO creations by 20-30%

#### 1.3 Implement Lazy Storage Writes
**Location:** `agents` library behavior (workaround in wrapper)

Only write to storage when values actually change:

```typescript
// Wrapper around DO to check before writing
async _init(props) {
  const existingProps = await this.ctx.storage.get("props");
  if (JSON.stringify(existingProps) !== JSON.stringify(props)) {
    await this.ctx.storage.put("props", props ?? {});
  }

  const existingTransportType = await this.ctx.storage.get("transportType");
  if (!existingTransportType) {
    await this.ctx.storage.put("transportType", "unset");
  }

  // ... rest of init
}
```

**Expected Impact:** Reduce duplicate writes by 30-40%

#### 1.4 Implement Session Reuse Strategy
**Location:** Client-side + documentation

Encourage clients to reuse sessionIds:

```typescript
// Return sessionId in response headers
return new Response(readable, {
  headers: {
    "Content-Type": "text/event-stream",
    "X-Session-ID": sessionId,  // Client can reuse this
    "Cache-Control": "no-cache",
    // ...
  }
});
```

Update README.md to document session reuse:
```markdown
### Best Practices
- **Reuse Session IDs:** Save the sessionId from the initial connection
- **Reconnect Logic:** Use ?sessionId=<saved-id> for reconnections
- **Reduces Server Load:** Reusing sessions prevents unnecessary DO creation
```

**Expected Impact:** Reduce new DO creation by 50-70% (for legitimate clients)

---

### Phase 2: SHORT-TERM IMPROVEMENTS (Additional 10-20% reduction)

#### 2.1 Enable Cloudflare Bot Management
**Location:** `mcp-server/src/index.ts`

Use Cloudflare's bot detection:

```typescript
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    // Check bot score (0-99, lower = more likely bot)
    const botScore = request.cf?.botManagement?.score || 0;

    // Block obvious bots (score < 30)
    if (botScore < 30) {
      return new Response('Forbidden', { status: 403 });
    }

    // Challenge suspicious traffic (score 30-50)
    if (botScore < 50) {
      // Require Turnstile challenge or API key
    }

    // ... rest of handler
  }
};
```

**Note:** Requires Cloudflare Bot Management (available on Pro+ plans)

**Expected Impact:** Block 60-70% of bot traffic

#### 2.2 Add Request Validation
**Location:** `mcp-server/src/index.ts`

Reject invalid requests early:

```typescript
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);

    // Validate MCP endpoints
    if (url.pathname === "/sse") {
      // Must accept text/event-stream
      const accept = request.headers.get("Accept") || "";
      if (!accept.includes("text/event-stream")) {
        return new Response('Invalid Accept header', { status: 406 });
      }

      // Check User-Agent (block empty or suspicious)
      const userAgent = request.headers.get("User-Agent") || "";
      if (!userAgent || userAgent.length < 5) {
        return new Response('Invalid User-Agent', { status: 400 });
      }
    }

    // ... rest of handler
  }
};
```

**Expected Impact:** Reduce malformed requests by 20-30%

#### 2.3 Add Optional Authentication
**Location:** `mcp-server/src/index.ts`

Protect against unauthorized usage:

```typescript
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    // Optional: Require API key for public endpoint
    const apiKey = request.headers.get("X-API-Key");

    if (env.REQUIRE_AUTH && !apiKey) {
      return new Response('Unauthorized', { status: 401 });
    }

    if (apiKey && apiKey !== env.MCP_API_KEY) {
      return new Response('Invalid API key', { status: 403 });
    }

    // ... rest of handler
  }
};
```

**Expected Impact:** Control access, prevent abuse

---

### Phase 3: LONG-TERM OPTIMIZATIONS (Architectural improvements)

#### 3.1 Use Cloudflare KV for Session Metadata
**Location:** New KV namespace + `mcp-server/src/index.ts`

Store session metadata in KV (cheaper, no write limits):

```typescript
// wrangler.jsonc - Add KV binding
{
  "kv_namespaces": [
    { "binding": "MCP_SESSIONS", "id": "..." }
  ]
}

// src/index.ts
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const sessionId = url.searchParams.get("sessionId");

    if (sessionId) {
      // Check if session exists in KV first
      const session = await env.MCP_SESSIONS.get(sessionId);
      if (!session) {
        return new Response('Session not found', { status: 404 });
      }
    } else {
      // Create new session in KV
      const newSessionId = crypto.randomUUID();
      await env.MCP_SESSIONS.put(newSessionId, JSON.stringify({
        created: Date.now(),
        lastAccess: Date.now()
      }), { expirationTtl: 3600 }); // 1 hour TTL
    }

    // Only create DO for active connections
    // ... rest of handler
  }
};
```

**Expected Impact:**
- Reduce DO storage writes by 80%
- KV writes are free (up to 1000/day on free tier, then $0.50/million)

#### 3.2 Enable Smart Placement
**Location:** `mcp-server/wrangler.jsonc`

Uncomment Smart Placement:

```jsonc
{
  "placement": { "mode": "smart" }
}
```

**Expected Impact:**
- Better resource utilization
- Reduced latency
- Potential cost savings

#### 3.3 Add Comprehensive Observability
**Location:** `mcp-server/src/index.ts`

Track metrics to monitor optimization effectiveness:

```typescript
// Log key metrics
ctx.waitUntil(
  env.ANALYTICS?.writeDataPoint({
    blobs: [url.pathname, request.cf?.country || 'unknown'],
    doubles: [botScore, responseTime],
    indexes: [sessionId ? 'existing' : 'new']
  })
);
```

**Metrics to Track:**
- Requests per endpoint
- SessionId reuse rate
- Bot score distribution
- Error rates by cause
- DO creation rate
- Storage write count

#### 3.4 Implement DO Hibernation Optimization
**Location:** Already enabled in agents library

Ensure hibernation is working properly:
- DOs should hibernate when idle
- Reduces memory usage
- Automatic wake-up on new requests

**Verify in code:** `Agent.options = { hibernate: true }` (already set)

---

## Implementation Timeline

### Week 1: Quick Wins (Phase 1)
**Day 1-2:**
- [ ] Add health check endpoint
- [ ] Add request validation
- [ ] Document session reuse

**Day 3-5:**
- [ ] Implement rate limiting
- [ ] Add lazy storage writes
- [ ] Test and deploy

**Expected Results:** 60-80% reduction (18k-36k writes/day)

### Week 2: Improvements (Phase 2)
**Day 1-3:**
- [ ] Evaluate Cloudflare Bot Management (may require plan upgrade)
- [ ] Add bot filtering logic
- [ ] Implement optional authentication

**Day 4-5:**
- [ ] Test bot filtering
- [ ] Monitor metrics
- [ ] Adjust thresholds

**Expected Results:** 80-90% reduction (9k-18k writes/day)

### Week 3-4: Architecture (Phase 3)
**Week 3:**
- [ ] Add KV namespace
- [ ] Migrate session metadata to KV
- [ ] Implement session lifecycle

**Week 4:**
- [ ] Add comprehensive observability
- [ ] Enable Smart Placement
- [ ] Performance testing

**Expected Results:** 95%+ reduction (<5k writes/day)

---

## Expected Outcomes

### Immediate (Week 1)
- **Writes Reduction:** 60-80%
- **Daily Writes:** 18,000-36,000 (18-36% of limit)
- **Monthly Cost:** Stay within free tier
- **Error Rate:** Reduced to ~20%

### Short-term (Week 2)
- **Writes Reduction:** 80-90%
- **Daily Writes:** 9,000-18,000 (9-18% of limit)
- **Bot Traffic:** 70% reduction
- **Error Rate:** Reduced to ~10%

### Long-term (Week 3-4)
- **Writes Reduction:** 95%+
- **Daily Writes:** <5,000 (<5% of limit)
- **Sustainable:** Can scale to 100x current traffic
- **Error Rate:** <5%

---

## Cost Analysis

### Current State (Free Tier)
- **DO Writes:** ~90,000/day (90% of limit)
- **Risk:** Approaching paid tier
- **Paid tier starts at:** $5/month + $0.20/million writes
- **Potential monthly cost:** $5 + (90k × 30 × $0.20/1M) = ~$5.54/month

### After Optimization (Free Tier)
- **DO Writes:** <5,000/day (<5% of limit)
- **Risk:** Comfortable margin
- **Monthly cost:** $0 (stay in free tier)
- **Headroom:** Can handle 20x growth

---

## Monitoring & Alerts

### Key Metrics to Track
1. **DO Write Count:** Daily writes to storage
2. **Session Reuse Rate:** % of requests with existing sessionId
3. **Bot Traffic:** % of requests blocked/challenged
4. **Error Rate:** % of failed requests
5. **Response Time:** P50, P95, P99 latencies

### Recommended Alerts
- ⚠️ Warning: >70% of daily write limit
- 🚨 Critical: >85% of daily write limit
- 📊 Weekly: Session reuse rate report
- 🤖 Weekly: Bot traffic analysis

---

## Alternative Approaches

### Option A: Stateless MCP Server (No DOs)
**Pros:**
- Zero DO writes
- Unlimited scaling
- Lower costs

**Cons:**
- No session persistence
- Cannot use SSE transport properly
- Requires architecture change

### Option B: Upgrade to Paid Plan
**Pros:**
- Immediate relief
- No code changes

**Cons:**
- Ongoing costs (~$5-10/month)
- Doesn't fix root cause
- Will scale with traffic

### Option C: Hybrid Approach (Recommended)
**Pros:**
- Best of both worlds
- Use DOs only for active sessions
- Use KV for metadata

**Cons:**
- More complex implementation
- Requires Phase 3 work

---

## Questions for Discussion

1. **Bot Management:** Do you have a Cloudflare paid plan? (Bot Management requires Pro+)
Answer: Nope.
2. **Authentication:** Do you want to add API key authentication?
Answer: Nope.
3. **Monitoring:** Do you have access to Cloudflare Analytics Engine?
Answer: Yes.
4. **Timeline:** Which phase should we prioritize first?
Answer: Phase 1.
5. **Users:** Are most of your users using Claude Desktop, Cursor, or other clients?
Answer: Cursor.
---

## References

- [Cloudflare Durable Objects Docs](https://developers.cloudflare.com/durable-objects/)
- [Durable Objects Limits](https://developers.cloudflare.com/durable-objects/platform/limits/)
- [Cloudflare Bot Management](https://developers.cloudflare.com/bots/)
- [Workers Rate Limiting](https://developers.cloudflare.com/workers/examples/rate-limiting/)
- [agents Library](https://github.com/cloudflare/agents)
