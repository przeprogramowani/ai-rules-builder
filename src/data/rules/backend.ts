import { Library } from '../dictionaries';
import { type LibraryRulesMap } from './types';

/**
 * Backend library rules (Node.js, Python, Java, .NET, Go)
 */
export const backendRules: LibraryRulesMap = {
  // Node.js libraries
  [Library.EXPRESS]: [
    'Use express-async-errors or wrap async route handlers in try/catch blocks to properly handle promise rejections and prevent server crashes',
    'Implement middleware for cross-cutting concerns like logging, error handling, and authentication following the chain-of-responsibility pattern',
    'Use helmet middleware to enhance API security with appropriate HTTP headers for {{security_requirements}}',
    'Structure routes using the Router class and organize by resource or feature to maintain a clean separation of concerns',
    'Implement rate limiting for public endpoints to prevent abuse and DoS attacks on {{critical_endpoints}}',
    'Use environment-specific configuration with dotenv and never hardcode sensitive values like {{database_credentials}} or API keys',
  ],
  [Library.NEST]: [
    'Use dependency injection for services to improve testability and maintainability following SOLID principles',
    'Implement custom decorators for cross-cutting concerns to keep code DRY and maintain separation of business logic',
    'Use interceptors for transforming the response data structure consistently for {{api_standards}}',
    'Leverage NestJS Guards for authorization to centralize access control logic across {{protected_resources}}',
    'Implement domain-driven design with modules that encapsulate related functionality and maintain clear boundaries',
    'Use TypeORM or Mongoose with repository patterns to abstract database operations and simplify testing with mocks',
  ],
  [Library.FASTIFY]: [
    'Use the schema validation feature with JSON Schema to validate request and response payloads for {{api_endpoints}}',
    'Implement the plugin system for modularizing application components and enabling code reuse across projects',
    'Use fastify-swagger for automatic API documentation generation based on your schema definitions',
    'Leverage the hooks system (onRequest, preHandler, onSend) for precise control over the request lifecycle',
    'Use the reply.send() method consistently and avoid mixing with return statements to prevent hard-to-debug issues',
    'Implement proper error handling with custom error classes and the setErrorHandler hook for {{error_types}}',
  ],

  // Python libraries
  [Library.DJANGO]: [
    'Use class-based views instead of function-based views for more maintainable and reusable code components',
    'Implement Django REST Framework for building APIs with serializers that enforce data validation',
    'Use Django ORM query expressions and annotations for complex database queries involving {{data_models}}',
    'Leverage Django signals sparingly and document their usage to avoid hidden side effects in the application flow',
    'Implement custom model managers for encapsulating complex query logic rather than repeating queries across views',
    'Use Django forms or serializers for all user input to ensure proper validation and prevent security vulnerabilities in {{user_input_fields}}',
  ],
  [Library.FLASK]: [
    'Use Flask Blueprints to organize routes and views by feature or domain for better code organization',
    'Implement Flask-SQLAlchemy with proper session management to prevent connection leaks and memory issues',
    'Use Flask-Marshmallow for serialization and request validation of {{data_types}}',
    'Apply the application factory pattern to enable testing and multiple deployment configurations',
    'Implement Flask-Limiter for rate limiting on public endpoints to prevent abuse of {{public_apis}}',
    'Use Flask-Login or Flask-JWT-Extended for authentication with proper session timeout and refresh mechanisms',
  ],
  [Library.FASTAPI]: [
    'Use Pydantic models for request and response validation with strict type checking and custom validators',
    'Implement dependency injection for services and database sessions to improve testability and resource management',
    'Use async endpoints for I/O-bound operations to improve throughput for {{high_load_endpoints}}',
    "Leverage FastAPI's background tasks for non-critical operations that don't need to block the response",
    'Implement proper exception handling with HTTPException and custom exception handlers for {{error_scenarios}}',
    'Use path operation decorators consistently with appropriate HTTP methods (GET for retrieval, POST for creation, etc.)',
  ],

  // Java libraries
  [Library.SPRING]: [
    'Use Spring Boot for simplified configuration and faster development with sensible defaults',
    'Implement the repository pattern with Spring Data JPA for database access to {{entity_types}}',
    'Use Spring Security with JWT for stateless authentication and proper role-based access control',
    'Apply the @Transactional annotation at the service layer to ensure data consistency and proper rollback behavior',
    'Implement proper exception handling with @ControllerAdvice and custom exception classes for {{error_types}}',
    "Use Spring's caching abstractions for performance optimization of frequently accessed, rarely changing data",
  ],
  [Library.HIBERNATE]: [
    'Use lazy loading with caution and fetch joins to avoid N+1 query problems with {{entity_relationships}}',
    'Implement second-level caching for frequently accessed, rarely changed data to reduce database load',
    'Use native queries for complex reports that are difficult to express with JPQL or criteria queries',
    'Apply appropriate fetch strategies (EAGER vs LAZY) based on entity usage patterns to optimize performance',
    'Implement optimistic locking with @Version for concurrent data modification to prevent lost updates',
    'Use batch processing with StatelessSession for bulk operations on {{large_datasets}} to minimize memory usage',
  ],

  // .NET libraries
  [Library.ENTITY_FRAMEWORK]: [
    'Use the repository and unit of work patterns to abstract data access logic and simplify testing',
    'Implement eager loading with Include() to avoid N+1 query problems for {{entity_relationships}}',
    'Use migrations for database schema changes and version control with proper naming conventions',
    'Apply appropriate tracking behavior (AsNoTracking() for read-only queries) to optimize performance',
    'Implement query optimization techniques like compiled queries for frequently executed database operations',
    'Use value conversions for complex property transformations and proper handling of {{custom_data_types}}',
  ],
  [Library.ASP_NET]: [
    'Use minimal APIs for simple endpoints in .NET 6+ applications to reduce boilerplate code',
    'Implement the mediator pattern with MediatR for decoupling request handling and simplifying cross-cutting concerns',
    'Use API controllers with model binding and validation attributes for {{complex_data_models}}',
    'Apply proper response caching with cache profiles and ETags for improved performance on {{high_traffic_endpoints}}',
    'Implement proper exception handling with ExceptionFilter or middleware to provide consistent error responses',
    'Use dependency injection with scoped lifetime for request-specific services and singleton for stateless services',
  ],

  // Go libraries
  [Library.GIN]: [
    'Use middleware for cross-cutting concerns like authentication, logging, and request validation',
    'Implement structured logging with context for better debugging of {{error_scenarios}}',
    'Use binding validation for request payloads with custom validators for complex business rules',
    'Apply the context package properly to manage request-scoped values and cancellation signals',
    'Implement proper error handling with custom error types and consistent HTTP status codes',
    'Use the gin.H map for JSON responses consistently across handlers for {{api_endpoints}}',
  ],
  [Library.ECHO]: [
    'Use the middleware system for cross-cutting concerns with proper ordering based on execution requirements',
    'Implement the context package for request-scoped values and proper cancellation propagation',
    'Use the validator package for request validation of {{input_types}} with custom validation rules',
    'Apply proper route grouping for related endpoints and consistent path prefixing',
    'Implement structured error handling with custom error types and appropriate HTTP status codes',
    'Use context timeouts for external service calls to prevent resource leaks when handling {{external_dependencies}}',
  ],
};
