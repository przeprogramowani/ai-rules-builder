-- Seed prompts for 10xDevs organization
-- Run this in Supabase SQL Editor after migrations

DO $$
DECLARE
  v_org_id UUID;
  v_coll_fundamentals_id UUID;
  v_coll_advanced_id UUID;
  v_coll_ai_id UUID;
  v_seg_getting_started_id UUID;
  v_seg_best_practices_id UUID;
  v_seg_testing_id UUID;
  v_seg_architecture_id UUID;
  v_seg_performance_id UUID;
  v_seg_ai_prompting_id UUID;
  v_seg_ai_tools_id UUID;
BEGIN
  -- Get 10xDevs organization ID
  SELECT id INTO v_org_id FROM organizations WHERE slug = '10xdevs';

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION '10xDevs organization not found. Please ensure the organization exists.';
  END IF;

  -- Insert collections
  INSERT INTO prompt_collections (organization_id, slug, title, description, sort_order)
  VALUES
    (v_org_id, 'fundamentals', 'Fundamentals', 'Core prompts for foundational concepts and getting started', 1),
    (v_org_id, 'advanced', 'Advanced Topics', 'Advanced prompts for experienced developers', 2),
    (v_org_id, 'ai-development', 'AI Development', 'Prompts for AI-assisted development and tooling', 3)
  ON CONFLICT (organization_id, slug) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    sort_order = EXCLUDED.sort_order;

  -- Get collection IDs
  SELECT id INTO v_coll_fundamentals_id FROM prompt_collections WHERE organization_id = v_org_id AND slug = 'fundamentals';
  SELECT id INTO v_coll_advanced_id FROM prompt_collections WHERE organization_id = v_org_id AND slug = 'advanced';
  SELECT id INTO v_coll_ai_id FROM prompt_collections WHERE organization_id = v_org_id AND slug = 'ai-development';

  -- Insert segments for Fundamentals
  INSERT INTO prompt_collection_segments (collection_id, slug, title, sort_order)
  VALUES
    (v_coll_fundamentals_id, 'getting-started', 'Getting Started', 1),
    (v_coll_fundamentals_id, 'best-practices', 'Best Practices', 2),
    (v_coll_fundamentals_id, 'testing', 'Testing', 3)
  ON CONFLICT (collection_id, slug) DO UPDATE SET
    title = EXCLUDED.title,
    sort_order = EXCLUDED.sort_order;

  -- Insert segments for Advanced
  INSERT INTO prompt_collection_segments (collection_id, slug, title, sort_order)
  VALUES
    (v_coll_advanced_id, 'architecture', 'Architecture', 1),
    (v_coll_advanced_id, 'performance', 'Performance', 2)
  ON CONFLICT (collection_id, slug) DO UPDATE SET
    title = EXCLUDED.title,
    sort_order = EXCLUDED.sort_order;

  -- Insert segments for AI Development
  INSERT INTO prompt_collection_segments (collection_id, slug, title, sort_order)
  VALUES
    (v_coll_ai_id, 'prompting', 'Effective Prompting', 1),
    (v_coll_ai_id, 'tools', 'AI Tools & Integration', 2)
  ON CONFLICT (collection_id, slug) DO UPDATE SET
    title = EXCLUDED.title,
    sort_order = EXCLUDED.sort_order;

  -- Get segment IDs
  SELECT id INTO v_seg_getting_started_id FROM prompt_collection_segments WHERE collection_id = v_coll_fundamentals_id AND slug = 'getting-started';
  SELECT id INTO v_seg_best_practices_id FROM prompt_collection_segments WHERE collection_id = v_coll_fundamentals_id AND slug = 'best-practices';
  SELECT id INTO v_seg_testing_id FROM prompt_collection_segments WHERE collection_id = v_coll_fundamentals_id AND slug = 'testing';
  SELECT id INTO v_seg_architecture_id FROM prompt_collection_segments WHERE collection_id = v_coll_advanced_id AND slug = 'architecture';
  SELECT id INTO v_seg_performance_id FROM prompt_collection_segments WHERE collection_id = v_coll_advanced_id AND slug = 'performance';
  SELECT id INTO v_seg_ai_prompting_id FROM prompt_collection_segments WHERE collection_id = v_coll_ai_id AND slug = 'prompting';
  SELECT id INTO v_seg_ai_tools_id FROM prompt_collection_segments WHERE collection_id = v_coll_ai_id AND slug = 'tools';

  -- Clear existing prompts (optional - remove if you want to keep existing ones)
  DELETE FROM prompts WHERE organization_id = v_org_id;

  -- Insert sample prompts for Fundamentals > Getting Started
  INSERT INTO prompts (organization_id, collection_id, segment_id, title, markdown_body, status)
  VALUES
    (
      v_org_id,
      v_coll_fundamentals_id,
      v_seg_getting_started_id,
      'Project Setup Guide',
      '# Project Setup Guide

This prompt helps you set up a new project with best practices.

## Prerequisites
- Node.js 18+ installed
- Git configured
- Package manager (npm, yarn, or pnpm)

## Steps

### 1. Initialize Repository
```bash
git init
git add .
git commit -m "Initial commit"
```

### 2. Configure Tooling
Set up your development environment:
- **Linting**: ESLint with recommended rules
- **Formatting**: Prettier with consistent configuration
- **Git Hooks**: Husky for pre-commit checks
- **TypeScript**: Strict mode enabled

### 3. Set up CI/CD
- Configure GitHub Actions or GitLab CI
- Add automated testing
- Set up deployment pipelines

## Next Steps
After setup, review the Best Practices section for coding standards.',
      'published'
    ),
    (
      v_org_id,
      v_coll_fundamentals_id,
      v_seg_getting_started_id,
      'Environment Variables Setup',
      '# Environment Variables Setup

Learn how to properly manage environment variables in your application.

## Best Practices

### 1. Use .env Files
Create separate files for different environments:
- `.env.local` - Local development
- `.env.development` - Development environment
- `.env.production` - Production environment

### 2. Never Commit Secrets
```gitignore
# .gitignore
.env.local
.env.*.local
```

### 3. Document Required Variables
Create an `.env.example` file:
```
DATABASE_URL=postgresql://user:password@localhost:5432/db
API_KEY=your_api_key_here
```

## Security Tips
- Use different credentials for each environment
- Rotate secrets regularly
- Use secret management tools in production',
      'published'
    ),
    (
      v_org_id,
      v_coll_fundamentals_id,
      v_seg_getting_started_id,
      'Git Workflow Basics',
      '# Git Workflow Basics

Essential Git workflows for team collaboration.

## Branch Strategy

### Main Branches
- `main` - Production-ready code
- `develop` - Integration branch for features

### Feature Branches
```bash
git checkout -b feature/new-feature
# Make changes
git add .
git commit -m "feat: add new feature"
git push origin feature/new-feature
```

## Commit Message Format
Follow conventional commits:
```
feat: add user authentication
fix: resolve login bug
docs: update README
refactor: simplify error handling
test: add unit tests for auth
```

## Pull Request Process
1. Create feature branch
2. Implement changes with tests
3. Push and create PR
4. Request code review
5. Address feedback
6. Merge after approval',
      'published'
    );

  -- Insert prompts for Fundamentals > Best Practices
  INSERT INTO prompts (organization_id, collection_id, segment_id, title, markdown_body, status)
  VALUES
    (
      v_org_id,
      v_coll_fundamentals_id,
      v_seg_best_practices_id,
      'Code Review Checklist',
      '# Code Review Checklist

Use this checklist when reviewing pull requests.

## Code Quality
- [ ] Code follows project style guide
- [ ] No unnecessary complexity
- [ ] Variables and functions have clear names
- [ ] Comments explain "why" not "what"
- [ ] No commented-out code

## Functionality
- [ ] Tests pass locally and in CI
- [ ] New features have tests
- [ ] Edge cases are handled
- [ ] Error handling is appropriate
- [ ] No breaking changes (or documented)

## Security
- [ ] No sensitive data in code
- [ ] Input validation present
- [ ] Authentication/authorization checks
- [ ] Dependencies are up to date

## Documentation
- [ ] README updated if needed
- [ ] API documentation current
- [ ] Complex logic explained
- [ ] Migration guide for breaking changes',
      'published'
    ),
    (
      v_org_id,
      v_coll_fundamentals_id,
      v_seg_best_practices_id,
      'Clean Code Principles',
      '# Clean Code Principles

Write maintainable, readable code that lasts.

## Naming Conventions
- Use descriptive names
- Functions should be verbs: `getUserData()`, `calculateTotal()`
- Variables should be nouns: `userProfile`, `totalAmount`
- Boolean variables: `isActive`, `hasPermission`

## Function Design
```typescript
// Bad: Function does too much
function processUser(user) {
  validateUser(user);
  saveToDatabase(user);
  sendEmail(user);
  logActivity(user);
}

// Good: Single responsibility
function processUser(user) {
  const validatedUser = validateUser(user);
  saveUser(validatedUser);
  notifyUser(validatedUser);
}
```

## DRY Principle
Don''t Repeat Yourself - extract common logic:
```typescript
// Extract repeated validation logic
function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
```

## SOLID Principles
- **S**ingle Responsibility
- **O**pen/Closed
- **L**iskov Substitution
- **I**nterface Segregation
- **D**ependency Inversion',
      'published'
    ),
    (
      v_org_id,
      v_coll_fundamentals_id,
      v_seg_best_practices_id,
      'Error Handling Patterns',
      '# Error Handling Patterns

Robust error handling for production applications.

## Try-Catch Blocks
```typescript
async function fetchUserData(userId: string) {
  try {
    const response = await api.getUser(userId);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      throw new UserNotFoundError(userId);
    }
    throw new ApiError("Failed to fetch user", error);
  }
}
```

## Custom Error Classes
```typescript
class UserNotFoundError extends Error {
  constructor(userId: string) {
    super(`User not found: ${userId}`);
    this.name = "UserNotFoundError";
  }
}
```

## Error Boundaries (React)
```typescript
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    logErrorToService(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

## Logging Best Practices
- Log errors with context
- Use structured logging
- Include stack traces in development
- Sanitize sensitive data',
      'published'
    );

  -- Insert prompts for Fundamentals > Testing
  INSERT INTO prompts (organization_id, collection_id, segment_id, title, markdown_body, status)
  VALUES
    (
      v_org_id,
      v_coll_fundamentals_id,
      v_seg_testing_id,
      'Unit Testing Fundamentals',
      '# Unit Testing Fundamentals

Write effective unit tests for your code.

## Test Structure (AAA Pattern)
```typescript
describe("UserService", () => {
  it("should create a new user", () => {
    // Arrange
    const userData = { name: "John", email: "john@example.com" };
    const service = new UserService();

    // Act
    const user = service.createUser(userData);

    // Assert
    expect(user.name).toBe("John");
    expect(user.email).toBe("john@example.com");
  });
});
```

## What to Test
- ✅ Business logic
- ✅ Edge cases
- ✅ Error conditions
- ✅ Data transformations
- ❌ Third-party libraries
- ❌ Framework internals

## Mocking Dependencies
```typescript
const mockDatabase = {
  findUser: jest.fn(),
  saveUser: jest.fn(),
};

it("should save user to database", async () => {
  mockDatabase.saveUser.mockResolvedValue({ id: "123" });

  const result = await userService.save(userData);

  expect(mockDatabase.saveUser).toHaveBeenCalledWith(userData);
});
```

## Test Coverage Goals
- Critical paths: 100%
- Business logic: 80-90%
- Overall: 70-80%',
      'published'
    ),
    (
      v_org_id,
      v_coll_fundamentals_id,
      v_seg_testing_id,
      'Integration Testing Guide',
      '# Integration Testing Guide

Test how your components work together.

## Database Testing
```typescript
describe("User API", () => {
  beforeEach(async () => {
    await db.migrate.latest();
    await db.seed.run();
  });

  afterEach(async () => {
    await db.migrate.rollback();
  });

  it("should fetch user from database", async () => {
    const response = await request(app)
      .get("/api/users/1")
      .expect(200);

    expect(response.body.name).toBe("Test User");
  });
});
```

## API Testing
```typescript
describe("REST API", () => {
  it("should create and retrieve user", async () => {
    // Create user
    const createResponse = await api.post("/users", {
      name: "John Doe",
      email: "john@example.com",
    });

    const userId = createResponse.data.id;

    // Retrieve user
    const getResponse = await api.get(`/users/${userId}`);
    expect(getResponse.data.name).toBe("John Doe");
  });
});
```

## Test Environment Setup
- Use separate test database
- Mock external services
- Use factories for test data
- Clean up after tests',
      'published'
    );

  -- Insert prompts for Advanced > Architecture
  INSERT INTO prompts (organization_id, collection_id, segment_id, title, markdown_body, status)
  VALUES
    (
      v_org_id,
      v_coll_advanced_id,
      v_seg_architecture_id,
      'Microservices Architecture',
      '# Microservices Architecture

Design scalable microservices systems.

## Core Principles
1. **Single Responsibility** - Each service owns one business capability
2. **Decentralized Data** - Each service manages its own database
3. **Independent Deployment** - Services deploy independently
4. **Fault Isolation** - Failures don''t cascade

## Service Communication
```typescript
// REST API
app.get("/api/orders/:id", async (req, res) => {
  const order = await orderService.getOrder(req.params.id);
  const user = await userServiceClient.getUser(order.userId);
  res.json({ order, user });
});

// Event-driven
eventBus.on("OrderCreated", async (event) => {
  await inventoryService.reserveItems(event.items);
  await notificationService.sendConfirmation(event.userId);
});
```

## API Gateway Pattern
- Single entry point for clients
- Route requests to services
- Handle authentication/authorization
- Rate limiting and caching

## Service Discovery
- Use service registry (Consul, etcd)
- Health checks
- Load balancing
- Circuit breakers',
      'published'
    ),
    (
      v_org_id,
      v_coll_advanced_id,
      v_seg_architecture_id,
      'Event-Driven Architecture',
      '# Event-Driven Architecture

Build loosely coupled, scalable systems with events.

## Event Types

### Domain Events
```typescript
interface OrderPlacedEvent {
  eventId: string;
  eventType: "OrderPlaced";
  timestamp: Date;
  data: {
    orderId: string;
    userId: string;
    items: OrderItem[];
    total: number;
  };
}
```

### Event Publishing
```typescript
class OrderService {
  async placeOrder(orderData: OrderData) {
    const order = await this.createOrder(orderData);

    await eventBus.publish({
      eventType: "OrderPlaced",
      data: order,
    });

    return order;
  }
}
```

### Event Handlers
```typescript
eventBus.subscribe("OrderPlaced", async (event) => {
  await inventoryService.updateStock(event.data.items);
  await emailService.sendConfirmation(event.data.userId);
  await analyticsService.trackOrder(event.data);
});
```

## Event Sourcing
- Store events as source of truth
- Rebuild state from events
- Audit trail built-in
- Time travel debugging',
      'published'
    );

  -- Insert prompts for Advanced > Performance
  INSERT INTO prompts (organization_id, collection_id, segment_id, title, markdown_body, status)
  VALUES
    (
      v_org_id,
      v_coll_advanced_id,
      v_seg_performance_id,
      'Database Query Optimization',
      '# Database Query Optimization

Improve database performance with these techniques.

## Index Optimization
```sql
-- Add index for frequently queried columns
CREATE INDEX idx_users_email ON users(email);

-- Composite index for multi-column queries
CREATE INDEX idx_orders_user_date
  ON orders(user_id, created_at DESC);

-- Partial index for filtered queries
CREATE INDEX idx_active_users
  ON users(last_login)
  WHERE status = ''active'';
```

## Query Optimization
```sql
-- Bad: N+1 queries
SELECT * FROM orders;
-- Then for each order:
SELECT * FROM users WHERE id = order.user_id;

-- Good: Join in single query
SELECT orders.*, users.name, users.email
FROM orders
JOIN users ON orders.user_id = users.id;
```

## Pagination
```sql
-- Offset-based (simple but slow for large offsets)
SELECT * FROM products
ORDER BY created_at DESC
LIMIT 20 OFFSET 100;

-- Cursor-based (faster)
SELECT * FROM products
WHERE created_at < ''2024-01-01''
ORDER BY created_at DESC
LIMIT 20;
```

## Connection Pooling
```typescript
const pool = new Pool({
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```',
      'published'
    ),
    (
      v_org_id,
      v_coll_advanced_id,
      v_seg_performance_id,
      'Caching Strategies',
      '# Caching Strategies

Reduce latency and improve scalability with effective caching.

## Cache Layers

### 1. Browser Caching
```typescript
// Cache-Control headers
res.setHeader("Cache-Control", "public, max-age=3600");

// Service Worker caching
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
```

### 2. CDN Caching
- Static assets (images, CSS, JS)
- Edge caching for global distribution
- Invalidation strategies

### 3. Application Caching
```typescript
// Redis cache
const cache = new Redis();

async function getUser(userId: string) {
  const cached = await cache.get(`user:${userId}`);
  if (cached) return JSON.parse(cached);

  const user = await db.users.findById(userId);
  await cache.setex(`user:${userId}`, 3600, JSON.stringify(user));
  return user;
}
```

## Cache Invalidation
```typescript
// Invalidate on update
async function updateUser(userId: string, data: UserData) {
  await db.users.update(userId, data);
  await cache.del(`user:${userId}`);
}

// Cache-aside pattern
async function getData(key: string) {
  let data = await cache.get(key);
  if (!data) {
    data = await database.get(key);
    await cache.set(key, data, TTL);
  }
  return data;
}
```',
      'published'
    );

  -- Insert prompts for AI Development > Prompting
  INSERT INTO prompts (organization_id, collection_id, segment_id, title, markdown_body, status)
  VALUES
    (
      v_org_id,
      v_coll_ai_id,
      v_seg_ai_prompting_id,
      'Effective AI Prompting for Developers',
      '# Effective AI Prompting for Developers

Master the art of communicating with AI coding assistants.

## Be Specific and Clear
```
❌ Bad: "Fix the bug"
✅ Good: "Fix the null pointer exception in getUserProfile()
         when user.address is undefined"

❌ Bad: "Make it faster"
✅ Good: "Optimize the database query in fetchOrders() to use
         an index on created_at and user_id"
```

## Provide Context
```
I''m working on a React application using TypeScript and Zustand.
I need to create a store for managing user authentication state.

Requirements:
- Track logged-in user data
- Handle login/logout actions
- Persist auth state to localStorage
- TypeScript types for all state and actions
```

## Break Down Complex Tasks
```
Let''s build a user registration form step by step:
1. First, create the form component with email and password fields
2. Then, add validation using React Hook Form
3. Next, integrate with our API endpoint
4. Finally, add error handling and loading states
```

## Ask for Explanations
```
"Explain how this recursive function works, line by line"
"What are the tradeoffs between these two approaches?"
"Why is this pattern better than the alternative?"
```',
      'published'
    ),
    (
      v_org_id,
      v_coll_ai_id,
      v_seg_ai_prompting_id,
      'Code Review with AI',
      '# Code Review with AI

Use AI to improve code quality and catch issues early.

## Security Review
```
Review this authentication code for security vulnerabilities:

[paste code]

Check for:
- SQL injection risks
- XSS vulnerabilities
- Insecure password storage
- Missing input validation
- CSRF protection
```

## Performance Analysis
```
Analyze this function for performance issues:

[paste code]

Consider:
- Time complexity
- Memory usage
- Potential bottlenecks
- Optimization opportunities
```

## Best Practices Check
```
Review this React component against best practices:

[paste code]

Check for:
- Proper hook usage
- Component composition
- Prop types/TypeScript usage
- Accessibility
- Performance optimizations (memo, useMemo, useCallback)
```

## Test Coverage
```
Review my test suite and suggest missing test cases:

[paste tests]

Consider:
- Edge cases
- Error conditions
- Integration scenarios
- Mocking strategies
```',
      'published'
    );

  -- Insert prompts for AI Development > Tools
  INSERT INTO prompts (organization_id, collection_id, segment_id, title, markdown_body, status)
  VALUES
    (
      v_org_id,
      v_coll_ai_id,
      v_seg_ai_tools_id,
      'GitHub Copilot Best Practices',
      '# GitHub Copilot Best Practices

Maximize productivity with GitHub Copilot.

## Effective Comments
```typescript
// Function to validate email format using regex
// Returns true if valid, false otherwise
function validateEmail(email: string): boolean {

// Calculate total price with tax and discount
// Parameters: price (number), taxRate (0-1), discount (0-1)
function calculateTotal(price: number, taxRate: number, discount: number): number {
```

## Code Generation Patterns
```typescript
// Generate a custom React hook for fetching data
// Should handle loading, error, and success states
// Include automatic retry on failure
export function useFetch<T>(url: string) {
  // Copilot will suggest the implementation
}
```

## Test Generation
```typescript
// Given this function:
function calculateDiscount(price: number, discountPercent: number): number {
  return price * (1 - discountPercent / 100);
}

// Generate comprehensive unit tests including edge cases
describe("calculateDiscount", () => {
  // Copilot suggests test cases
});
```

## Refactoring Assistance
```typescript
// Refactor this code to use async/await instead of promises
getUserData(userId)
  .then(user => getOrders(user.id))
  .then(orders => processOrders(orders))
  .catch(error => handleError(error));
```',
      'published'
    ),
    (
      v_org_id,
      v_coll_ai_id,
      v_seg_ai_tools_id,
      'Claude Code MCP Integration',
      '# Claude Code MCP Integration

Integrate Claude with your development workflow using MCP.

## What is MCP?
Model Context Protocol enables Claude to interact with your development tools, codebases, and databases.

## Setting Up MCP Server
```typescript
// Example MCP server configuration
{
  "mcpServers": {
    "rules-builder": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-rules"],
      "env": {
        "RULES_PATH": "./src/data/rules"
      }
    }
  }
}
```

## Using MCP Tools
```
Example prompts with MCP:

"Show me all available coding rules"
→ Claude uses listAvailableRules tool

"Get the React best practices rules"
→ Claude uses getRuleContent tool

"Apply these rules to my current project"
→ Claude accesses your codebase via MCP
```

## Custom MCP Servers
Create your own MCP server for:
- Custom linting rules
- Project-specific conventions
- Internal API documentation
- Database schema access

## Benefits
- Context-aware assistance
- Project-specific recommendations
- Automated rule enforcement
- Seamless tool integration',
      'published'
    );

  RAISE NOTICE 'Successfully seeded % prompts for 10xDevs organization',
    (SELECT COUNT(*) FROM prompts WHERE organization_id = v_org_id);
END $$;
