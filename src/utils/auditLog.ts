/**
 * Audit logging utility for tracking sensitive operations
 * Logs security-relevant events for compliance and monitoring
 */

export type AuditEventType =
  | 'prompt.create'
  | 'prompt.update'
  | 'prompt.delete'
  | 'prompt.publish'
  | 'prompt.unpublish'
  | 'collection.create'
  | 'collection.update'
  | 'collection.delete'
  | 'segment.create'
  | 'segment.update'
  | 'segment.delete'
  | 'invite.create'
  | 'invite.revoke'
  | 'invite.redeem'
  | 'organization.member.add'
  | 'organization.member.remove'
  | 'auth.login'
  | 'auth.logout'
  | 'auth.signup'
  | 'auth.password_reset';

export interface AuditLogEntry {
  timestamp: string;
  eventType: AuditEventType;
  userId: string | null;
  userEmail: string | null;
  organizationId: string | null;
  resourceId: string | null;
  resourceType: string | null;
  action: 'create' | 'read' | 'update' | 'delete' | 'execute';
  status: 'success' | 'failure';
  ipAddress: string | null;
  userAgent: string | null;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Log an audit event
 * In production, this should write to a proper logging service
 * For now, it writes to console with structured format
 */
export function logAuditEvent(entry: Omit<AuditLogEntry, 'timestamp'>): void {
  const logEntry: AuditLogEntry = {
    ...entry,
    timestamp: new Date().toISOString(),
  };

  // In production, send to logging service (e.g., Datadog, Sentry, CloudWatch)
  // For now, use structured console logging
  if (entry.status === 'failure') {
    console.error('[AUDIT]', JSON.stringify(logEntry));
  } else {
    console.log('[AUDIT]', JSON.stringify(logEntry));
  }

  // TODO: Send to proper audit log storage/service
  // Examples:
  // - Send to Supabase audit_logs table
  // - Send to external monitoring service
  // - Write to file for compliance
}

/**
 * Extract client IP from request headers
 * Handles various proxy/CDN scenarios
 */
export function getClientIP(headers: Headers): string | null {
  // Check common headers in order of preference
  const ipHeaders = [
    'cf-connecting-ip', // Cloudflare
    'x-real-ip', // Nginx proxy
    'x-forwarded-for', // Standard proxy header
    'x-client-ip', // Apache
  ];

  for (const header of ipHeaders) {
    const value = headers.get(header);
    if (value) {
      // x-forwarded-for can be comma-separated, take first IP
      return value.split(',')[0].trim();
    }
  }

  return null;
}

/**
 * Create audit log context from request
 */
export function createAuditContext(
  request: Request,
  locals?: { user?: { id: string; email: string | null } },
) {
  return {
    userId: locals?.user?.id ?? null,
    userEmail: locals?.user?.email ?? null,
    ipAddress: getClientIP(request.headers),
    userAgent: request.headers.get('user-agent'),
  };
}

/**
 * Helper function to log prompt operations
 */
export function logPromptOperation(
  operation: 'create' | 'update' | 'delete' | 'publish' | 'unpublish',
  context: ReturnType<typeof createAuditContext>,
  organizationId: string,
  promptId: string,
  status: 'success' | 'failure',
  error?: string,
): void {
  const eventTypeMap = {
    create: 'prompt.create',
    update: 'prompt.update',
    delete: 'prompt.delete',
    publish: 'prompt.publish',
    unpublish: 'prompt.unpublish',
  } as const;

  const actionMap = {
    create: 'create',
    update: 'update',
    delete: 'delete',
    publish: 'update',
    unpublish: 'update',
  } as const;

  logAuditEvent({
    eventType: eventTypeMap[operation],
    ...context,
    organizationId,
    resourceId: promptId,
    resourceType: 'prompt',
    action: actionMap[operation],
    status,
    errorMessage: error,
  });
}

/**
 * Helper function to log collection operations
 */
export function logCollectionOperation(
  operation: 'create' | 'update' | 'delete',
  context: ReturnType<typeof createAuditContext>,
  organizationId: string,
  collectionId: string,
  status: 'success' | 'failure',
  error?: string,
): void {
  const eventTypeMap = {
    create: 'collection.create',
    update: 'collection.update',
    delete: 'collection.delete',
  } as const;

  logAuditEvent({
    eventType: eventTypeMap[operation],
    ...context,
    organizationId,
    resourceId: collectionId,
    resourceType: 'collection',
    action: operation,
    status,
    errorMessage: error,
  });
}

/**
 * Helper function to log invite operations
 */
export function logInviteOperation(
  operation: 'create' | 'revoke' | 'redeem',
  context: ReturnType<typeof createAuditContext>,
  organizationId: string,
  inviteId: string,
  status: 'success' | 'failure',
  error?: string,
): void {
  const eventTypeMap = {
    create: 'invite.create',
    revoke: 'invite.revoke',
    redeem: 'invite.redeem',
  } as const;

  const actionMap = {
    create: 'create',
    revoke: 'update',
    redeem: 'execute',
  } as const;

  logAuditEvent({
    eventType: eventTypeMap[operation],
    ...context,
    organizationId,
    resourceId: inviteId,
    resourceType: 'invite',
    action: actionMap[operation],
    status,
    errorMessage: error,
  });
}

/**
 * Helper function to log organization member operations
 */
export function logMemberOperation(
  operation: 'add' | 'remove',
  context: ReturnType<typeof createAuditContext>,
  organizationId: string,
  targetUserId: string,
  status: 'success' | 'failure',
  error?: string,
): void {
  const eventTypeMap = {
    add: 'organization.member.add',
    remove: 'organization.member.remove',
  } as const;

  const actionMap = {
    add: 'create',
    remove: 'delete',
  } as const;

  logAuditEvent({
    eventType: eventTypeMap[operation],
    ...context,
    organizationId,
    resourceId: targetUserId,
    resourceType: 'organization_member',
    action: actionMap[operation],
    status,
    errorMessage: error,
    metadata: { targetUserId },
  });
}
