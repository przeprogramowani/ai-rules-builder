import { Library } from '../dictionaries';
import { type LibraryRulesMap } from './types';

/**
 * Database library rules (SQL, NoSQL, Graph)
 */
export const databaseRules: LibraryRulesMap = {
  // SQL libraries
  [Library.POSTGRES]: [
    'Use connection pooling to manage database connections efficiently',
    'Implement JSONB columns for semi-structured data instead of creating many tables for {{flexible_data}}',
    'Use materialized views for complex, frequently accessed read-only data',
  ],
  [Library.MYSQL]: [
    'Use InnoDB storage engine for transactions and foreign key constraints',
    'Implement proper indexing strategies based on {{query_patterns}}',
    'Use connection pooling for better performance',
  ],
  [Library.SQLSERVER]: [
    'Use parameterized queries to prevent SQL injection',
    'Implement proper indexing strategies based on query patterns',
    'Use stored procedures for complex business logic that requires database access to {{business_entities}}',
  ],

  // NoSQL libraries
  [Library.MONGODB]: [
    'Use the aggregation framework for complex queries instead of multiple queries',
    'Implement schema validation to ensure data consistency for {{document_types}}',
    'Use indexes for frequently queried fields to improve performance',
  ],
  [Library.DYNAMODB]: [
    'Design access patterns first, then create tables and indexes to support {{query_requirements}}',
    'Implement single-table design for related entities to minimize RCU/WCU costs',
    'Use sparse indexes and composite keys for efficient querying',
  ],
  [Library.FIREBASE]: [
    'Use security rules to enforce access control at the database level for {{user_roles}}',
    'Implement shallow queries to minimize bandwidth usage',
    'Use offline capabilities for better user experience in mobile apps',
  ],

  // Graph libraries
  [Library.NEO4J]: [
    'Use parameterized Cypher queries to prevent injection attacks',
    'Implement proper indexing on node properties used in WHERE clauses for {{node_types}}',
    'Use the APOC library for common operations not covered by Cypher',
  ],
  [Library.DGRAPH]: [
    'Use GraphQL+-/DQL for complex queries instead of multiple simple queries',
    'Implement proper indexing based on {{query_patterns}}',
    'Use transactions for maintaining data consistency',
  ],
};
