# Prompt Manager Admin API Documentation

## Overview

The Prompt Manager Admin API provides endpoints for curators to create, manage, and publish prompts within their organization. All endpoints require:

- **Feature Flag**: `PROMPT_MANAGER_ENABLED` must be `true`
- **Authentication**: Valid Supabase session
- **Authorization**: Admin role in an organization

## Authentication

All requests must include a valid Supabase session cookie. The middleware automatically:
1. Verifies the feature flag is enabled
2. Validates the user's session
3. Checks the user's organization membership
4. Ensures the user has admin role for admin endpoints

## Base URL

```
/api/prompts/admin
```

## Common Response Format

### Success Response
```json
{
  "data": <Resource or Array>,
  "error": null
}
```

### Error Response
```json
{
  "data": null,
  "error": {
    "message": "Human-readable error message",
    "code": "ERROR_CODE"
  }
}
```

## HTTP Status Codes

- `200 OK` - Successful request
- `201 Created` - Resource successfully created
- `204 No Content` - Resource successfully deleted
- `400 Bad Request` - Invalid request body or parameters
- `401 Unauthorized` - No valid session
- `403 Forbidden` - User lacks required permissions
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server-side error

## Error Codes

- `UNKNOWN_ERROR` - Generic database or system error
- `INTERNAL_ERROR` - Unexpected exception occurred
- `NOT_FOUND` - Requested resource does not exist
- `VALIDATION_ERROR` - Request body validation failed
- `DB_ERROR` - Database operation failed
- `QUERY_ERROR` - Database query failed
- `UPDATE_ERROR` - Database update failed
- `INSERT_ERROR` - Database insert failed
- `DELETE_ERROR` - Database delete failed
- `FK_VIOLATION` - Foreign key constraint violation

---

## Endpoints

### 1. Create Prompt

Create a new draft prompt.

**Endpoint**: `POST /api/prompts/admin/prompts`

**Request Body**:
```json
{
  "title": "My Prompt Title",
  "collection_id": "uuid-of-collection",
  "segment_id": "uuid-of-segment",  // optional
  "markdown_body": "# Prompt Content\n\nMarkdown content here...",
  "created_by": "uuid-of-user"      // optional
}
```

**Response** (`201 Created`):
```json
{
  "data": {
    "id": "prompt-uuid",
    "organization_id": "org-uuid",
    "collection_id": "collection-uuid",
    "segment_id": "segment-uuid",
    "title": "My Prompt Title",
    "markdown_body": "# Prompt Content\n\nMarkdown content here...",
    "status": "draft",
    "created_by": "user-uuid",
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-01T00:00:00Z"
  },
  "error": null
}
```

**cURL Example**:
```bash
curl -X POST https://your-domain.com/api/prompts/admin/prompts \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=YOUR_SESSION_TOKEN" \
  -d '{
    "title": "Project Setup Guide",
    "collection_id": "coll-123",
    "segment_id": "seg-456",
    "markdown_body": "# Project Setup\n\nSteps to set up your project..."
  }'
```

---

### 2. List Prompts

Retrieve all prompts with optional filtering.

**Endpoint**: `GET /api/prompts/admin/prompts`

**Query Parameters**:
- `status` (optional): Filter by status (`draft` or `published`)
- `collection_id` (optional): Filter by collection UUID
- `segment_id` (optional): Filter by segment UUID

**Response** (`200 OK`):
```json
{
  "data": [
    {
      "id": "prompt-uuid-1",
      "organization_id": "org-uuid",
      "collection_id": "collection-uuid",
      "segment_id": "segment-uuid",
      "title": "Prompt 1",
      "markdown_body": "# Content",
      "status": "published",
      "created_by": "user-uuid",
      "created_at": "2025-01-01T00:00:00Z",
      "updated_at": "2025-01-02T00:00:00Z"
    },
    {
      "id": "prompt-uuid-2",
      "organization_id": "org-uuid",
      "collection_id": "collection-uuid",
      "segment_id": null,
      "title": "Prompt 2",
      "markdown_body": "# Content",
      "status": "draft",
      "created_by": "user-uuid",
      "created_at": "2025-01-01T00:00:00Z",
      "updated_at": "2025-01-01T00:00:00Z"
    }
  ],
  "error": null
}
```

**cURL Example**:
```bash
# Get all prompts
curl https://your-domain.com/api/prompts/admin/prompts \
  -H "Cookie: sb-access-token=YOUR_SESSION_TOKEN"

# Get only published prompts
curl "https://your-domain.com/api/prompts/admin/prompts?status=published" \
  -H "Cookie: sb-access-token=YOUR_SESSION_TOKEN"

# Get prompts for a specific collection
curl "https://your-domain.com/api/prompts/admin/prompts?collection_id=coll-123" \
  -H "Cookie: sb-access-token=YOUR_SESSION_TOKEN"
```

---

### 3. Get Single Prompt

Retrieve a specific prompt by ID.

**Endpoint**: `GET /api/prompts/admin/prompts/:id`

**Response** (`200 OK`):
```json
{
  "data": {
    "id": "prompt-uuid",
    "organization_id": "org-uuid",
    "collection_id": "collection-uuid",
    "segment_id": "segment-uuid",
    "title": "My Prompt",
    "markdown_body": "# Content",
    "status": "draft",
    "created_by": "user-uuid",
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-01T00:00:00Z"
  },
  "error": null
}
```

**Response** (`404 Not Found`):
```json
{
  "data": null,
  "error": {
    "message": "Prompt not found or access denied",
    "code": "NOT_FOUND"
  }
}
```

**cURL Example**:
```bash
curl https://your-domain.com/api/prompts/admin/prompts/prompt-uuid \
  -H "Cookie: sb-access-token=YOUR_SESSION_TOKEN"
```

---

### 4. Update Prompt

Update an existing prompt's content.

**Endpoint**: `PUT /api/prompts/admin/prompts/:id`

**Request Body** (all fields optional):
```json
{
  "title": "Updated Title",
  "markdown_body": "# Updated Content",
  "segment_id": "new-segment-uuid"
}
```

**Response** (`200 OK`):
```json
{
  "data": {
    "id": "prompt-uuid",
    "organization_id": "org-uuid",
    "collection_id": "collection-uuid",
    "segment_id": "new-segment-uuid",
    "title": "Updated Title",
    "markdown_body": "# Updated Content",
    "status": "draft",
    "created_by": "user-uuid",
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-02T00:00:00Z"
  },
  "error": null
}
```

**cURL Example**:
```bash
curl -X PUT https://your-domain.com/api/prompts/admin/prompts/prompt-uuid \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=YOUR_SESSION_TOKEN" \
  -d '{
    "title": "Updated Project Setup Guide",
    "markdown_body": "# Updated Content\n\nNew steps..."
  }'
```

---

### 5. Delete Prompt

Delete a prompt permanently.

**Endpoint**: `DELETE /api/prompts/admin/prompts/:id`

**Response** (`204 No Content`):
```
(Empty response body)
```

**Response** (`404 Not Found`):
```json
{
  "data": null,
  "error": {
    "message": "Prompt not found or access denied",
    "code": "NOT_FOUND"
  }
}
```

**cURL Example**:
```bash
curl -X DELETE https://your-domain.com/api/prompts/admin/prompts/prompt-uuid \
  -H "Cookie: sb-access-token=YOUR_SESSION_TOKEN"
```

---

### 6. Toggle Publish Status

Publish or unpublish a prompt (toggle between `draft` and `published`).

**Endpoint**: `PATCH /api/prompts/admin/prompts/:id/publish`

**Request Body**: None required

**Response** (`200 OK`):
```json
{
  "data": {
    "id": "prompt-uuid",
    "organization_id": "org-uuid",
    "collection_id": "collection-uuid",
    "segment_id": "segment-uuid",
    "title": "My Prompt",
    "markdown_body": "# Content",
    "status": "published",  // or "draft"
    "created_by": "user-uuid",
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-03T00:00:00Z"
  },
  "error": null
}
```

**cURL Example**:
```bash
# Publish a draft prompt
curl -X PATCH https://your-domain.com/api/prompts/admin/prompts/prompt-uuid/publish \
  -H "Cookie: sb-access-token=YOUR_SESSION_TOKEN"

# Unpublish a published prompt (same endpoint)
curl -X PATCH https://your-domain.com/api/prompts/admin/prompts/prompt-uuid/publish \
  -H "Cookie: sb-access-token=YOUR_SESSION_TOKEN"
```

---

### 7. List Collections

Get all collections for the active organization.

**Endpoint**: `GET /api/prompts/admin/prompt-collections`

**Response** (`200 OK`):
```json
{
  "data": [
    {
      "id": "collection-uuid-1",
      "organization_id": "org-uuid",
      "slug": "fundamentals",
      "title": "Fundamentals",
      "description": "Core concepts and best practices",
      "sort_order": 1,
      "created_at": "2025-01-01T00:00:00Z",
      "updated_at": "2025-01-01T00:00:00Z"
    },
    {
      "id": "collection-uuid-2",
      "organization_id": "org-uuid",
      "slug": "advanced",
      "title": "Advanced Topics",
      "description": "Advanced techniques and patterns",
      "sort_order": 2,
      "created_at": "2025-01-01T00:00:00Z",
      "updated_at": "2025-01-01T00:00:00Z"
    }
  ],
  "error": null
}
```

**cURL Example**:
```bash
curl https://your-domain.com/api/prompts/admin/prompt-collections \
  -H "Cookie: sb-access-token=YOUR_SESSION_TOKEN"
```

---

### 8. List Segments for Collection

Get all segments within a specific collection.

**Endpoint**: `GET /api/prompts/admin/prompt-collections/:id/segments`

**Response** (`200 OK`):
```json
{
  "data": [
    {
      "id": "segment-uuid-1",
      "collection_id": "collection-uuid",
      "slug": "getting-started",
      "title": "Getting Started",
      "sort_order": 1,
      "created_at": "2025-01-01T00:00:00Z",
      "updated_at": "2025-01-01T00:00:00Z"
    },
    {
      "id": "segment-uuid-2",
      "collection_id": "collection-uuid",
      "slug": "best-practices",
      "title": "Best Practices",
      "sort_order": 2,
      "created_at": "2025-01-01T00:00:00Z",
      "updated_at": "2025-01-01T00:00:00Z"
    }
  ],
  "error": null
}
```

**cURL Example**:
```bash
curl https://your-domain.com/api/prompts/admin/prompt-collections/collection-uuid/segments \
  -H "Cookie: sb-access-token=YOUR_SESSION_TOKEN"
```

---

## Workflow Examples

### Complete CRUD Workflow

```bash
# 1. Get available collections
COLLECTIONS=$(curl -s https://your-domain.com/api/prompts/admin/prompt-collections \
  -H "Cookie: sb-access-token=$TOKEN")

COLLECTION_ID=$(echo $COLLECTIONS | jq -r '.data[0].id')

# 2. Get segments for the collection
SEGMENTS=$(curl -s "https://your-domain.com/api/prompts/admin/prompt-collections/$COLLECTION_ID/segments" \
  -H "Cookie: sb-access-token=$TOKEN")

SEGMENT_ID=$(echo $SEGMENTS | jq -r '.data[0].id')

# 3. Create a new draft prompt
CREATE_RESPONSE=$(curl -s -X POST https://your-domain.com/api/prompts/admin/prompts \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=$TOKEN" \
  -d "{
    \"title\": \"My New Prompt\",
    \"collection_id\": \"$COLLECTION_ID\",
    \"segment_id\": \"$SEGMENT_ID\",
    \"markdown_body\": \"# Initial Content\"
  }")

PROMPT_ID=$(echo $CREATE_RESPONSE | jq -r '.data.id')

# 4. Update the prompt
curl -s -X PUT "https://your-domain.com/api/prompts/admin/prompts/$PROMPT_ID" \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=$TOKEN" \
  -d '{
    "title": "Updated Prompt Title",
    "markdown_body": "# Updated Content\n\nMore details..."
  }'

# 5. Publish the prompt
curl -s -X PATCH "https://your-domain.com/api/prompts/admin/prompts/$PROMPT_ID/publish" \
  -H "Cookie: sb-access-token=$TOKEN"

# 6. List all published prompts
curl -s "https://your-domain.com/api/prompts/admin/prompts?status=published" \
  -H "Cookie: sb-access-token=$TOKEN"

# 7. Unpublish the prompt
curl -s -X PATCH "https://your-domain.com/api/prompts/admin/prompts/$PROMPT_ID/publish" \
  -H "Cookie: sb-access-token=$TOKEN"

# 8. Delete the prompt
curl -s -X DELETE "https://your-domain.com/api/prompts/admin/prompts/$PROMPT_ID" \
  -H "Cookie: sb-access-token=$TOKEN"
```

---

## Security Considerations

### Organization Scoping
All operations are automatically scoped to the user's active organization. Users cannot:
- View prompts from other organizations
- Update prompts in other organizations
- Delete prompts from other organizations

### Admin Role Requirement
All admin endpoints require the user to have an `admin` role in their organization. Member-level users will receive a `403 Forbidden` response.

### Feature Flag
The `PROMPT_MANAGER_ENABLED` feature flag must be enabled. If disabled, all endpoints return `403 Forbidden`.

### Input Validation
- `title`: Required, non-empty string
- `collection_id`: Required, must be a valid UUID of an existing collection
- `segment_id`: Optional, must be a valid UUID if provided
- `markdown_body`: Required, non-empty string
- All IDs must belong to the user's organization

---

## Rate Limiting

Currently, there are no rate limits on admin endpoints. This may be added in future versions.

---

## Versioning

This is version 1 of the Admin API. The API follows semantic versioning principles. Breaking changes will result in a new major version.

**Current Version**: `v1` (implicit, no version prefix in URL)

---

## Support

For issues, questions, or feature requests related to the Prompt Manager API:
1. Check the [schema documentation](../../.ai/prompt-manager/phase-3-impl-plan.md)
2. Review the [PRD](../../.ai/prompt-manager/prd.md)
3. Contact the development team

---

## Changelog

### Phase 3 (Current)
- Initial release of Admin API
- CRUD operations for prompts
- Collection and segment listing
- Publish/unpublish workflow
- Organization scoping
- Admin role enforcement
