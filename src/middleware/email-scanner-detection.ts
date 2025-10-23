/**
 * Email Scanner Detection Middleware
 *
 * Corporate email security systems (Microsoft 365 Safe Links, Gmail ATP, Mimecast, etc.)
 * automatically scan and follow links in emails to check for threats. This can consume
 * one-time verification tokens before users see them.
 *
 * This middleware detects common email scanner patterns and returns success responses
 * without consuming tokens, allowing the real user to complete verification.
 */

interface ScannerDetectionResult {
  isScanner: boolean;
  confidence: 'high' | 'medium' | 'low';
  reason?: string;
  scannerType?: string;
}

/**
 * Known email security scanner user agents
 */
const SCANNER_USER_AGENTS = [
  // Microsoft Safe Links
  /Microsoft Office (Excel|Word|Outlook|PowerPoint)/i,
  /Microsoft-Threat-Protection/i,
  /Microsoft\s+URL\s+Protection/i,
  /Microsoft-Azure-Application-Insights/i,

  // Google Email Scanner
  /Google-Safety/i,
  /Google-SMTP-Relay/i,
  /Google-HTTP-Java-Client/i,

  // Proofpoint
  /Proofpoint/i,

  // Mimecast
  /Mimecast/i,

  // Barracuda
  /Barracuda/i,

  // Cisco Email Security
  /Cisco\s+Email\s+Security/i,

  // Generic scanner patterns
  /Email\s+Scanner/i,
  /Link\s+Checker/i,
  /URL\s+Validation/i,
  /Security\s+Scanner/i,
];

/**
 * Check if a user agent matches known email scanner patterns
 */
function isKnownScanner(userAgent: string): { match: boolean; type?: string } {
  for (const pattern of SCANNER_USER_AGENTS) {
    const match = pattern.exec(userAgent);
    if (match) {
      return { match: true, type: match[0] };
    }
  }
  return { match: false };
}

/**
 * Detect email scanner requests based on multiple signals
 *
 * @param request - The incoming HTTP request
 * @returns Detection result with confidence level
 */
export function detectEmailScanner(request: Request): ScannerDetectionResult {
  const userAgent = request.headers.get('user-agent') || '';
  const method = request.method;
  const accept = request.headers.get('accept') || '';
  const referer = request.headers.get('referer') || '';

  // Signal 1: User-Agent matching (HIGH confidence)
  const scannerMatch = isKnownScanner(userAgent);
  if (scannerMatch.match) {
    return {
      isScanner: true,
      confidence: 'high',
      reason: 'User-Agent matches known email scanner',
      scannerType: scannerMatch.type,
    };
  }

  // Signal 2: HEAD request (MEDIUM confidence)
  // Scanners often send HEAD requests before GET to check links
  if (method === 'HEAD') {
    return {
      isScanner: true,
      confidence: 'medium',
      reason: 'HEAD request typically used by scanners',
    };
  }

  // Signal 3: No referer + suspicious Accept header (MEDIUM confidence)
  // Real browsers typically have referer and accept HTML
  if (!referer && !accept.includes('text/html')) {
    return {
      isScanner: true,
      confidence: 'medium',
      reason: 'Missing referer and non-browser Accept header',
    };
  }

  // Signal 4: Bot-like user agent patterns (LOW-MEDIUM confidence)
  const botPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scanner/i,
    /checker/i,
    /validator/i,
    /monitor/i,
  ];

  for (const pattern of botPatterns) {
    if (pattern.test(userAgent)) {
      return {
        isScanner: true,
        confidence: 'medium',
        reason: 'User-Agent matches bot pattern',
      };
    }
  }

  // Signal 5: Empty or very short user agent (LOW confidence)
  if (userAgent.length < 20) {
    return {
      isScanner: true,
      confidence: 'low',
      reason: 'Suspiciously short or empty user agent',
    };
  }

  // No scanner detected
  return {
    isScanner: false,
    confidence: 'high',
  };
}

/**
 * Check if we should block scanner access based on confidence level
 *
 * @param result - Scanner detection result
 * @param minConfidence - Minimum confidence level to block (default: 'medium')
 * @returns Whether to block the request
 */
export function shouldBlockScanner(
  result: ScannerDetectionResult,
  minConfidence: 'high' | 'medium' | 'low' = 'medium',
): boolean {
  if (!result.isScanner) {
    return false;
  }

  const confidenceLevels = { high: 3, medium: 2, low: 1 };
  return confidenceLevels[result.confidence] >= confidenceLevels[minConfidence];
}

/**
 * Create a safe response for email scanners that doesn't consume tokens
 *
 * @param detectionResult - Scanner detection result
 * @returns Response object
 */
export function createScannerResponse(detectionResult: ScannerDetectionResult): Response {
  // Log scanner detection for monitoring
  console.log('[EMAIL-SCANNER-DETECTION]', {
    detected: detectionResult.isScanner,
    confidence: detectionResult.confidence,
    reason: detectionResult.reason,
    scannerType: detectionResult.scannerType,
    timestamp: new Date().toISOString(),
  });

  // Return 200 OK with a benign HTML page
  // This satisfies scanners while preventing token consumption
  return new Response(
    `<!DOCTYPE html>
<html>
<head>
  <title>Email Verification</title>
  <meta name="robots" content="noindex, nofollow">
</head>
<body>
  <h1>Email Verification Link</h1>
  <p>This is an email verification link. Please click the link from your email client to verify your account.</p>
  <!-- Scanner detected: ${detectionResult.confidence} confidence -->
</body>
</html>`,
    {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Scanner-Detected': detectionResult.isScanner ? 'true' : 'false',
        'X-Scanner-Confidence': detectionResult.confidence,
      },
    },
  );
}

/**
 * Middleware function to protect verification endpoints from email scanners
 *
 * Usage in Astro pages/API routes:
 *
 * ```typescript
 * import { emailScannerMiddleware } from '@/middleware/email-scanner-detection';
 *
 * // In your page/API route
 * const scannerCheck = emailScannerMiddleware(Astro.request);
 * if (scannerCheck) {
 *   return scannerCheck; // Return early with scanner response
 * }
 * // Continue with normal verification flow
 * ```
 */
export function emailScannerMiddleware(request: Request): Response | null {
  const detection = detectEmailScanner(request);

  // Only block high and medium confidence scanner detections
  if (shouldBlockScanner(detection, 'medium')) {
    return createScannerResponse(detection);
  }

  return null;
}

/**
 * Helper to log scanner statistics for monitoring
 */
export function logScannerStats(detectionResult: ScannerDetectionResult): void {
  if (detectionResult.isScanner) {
    // In production, you might want to send this to your analytics/monitoring service
    console.log('[SCANNER-STATS]', {
      type: detectionResult.scannerType || 'unknown',
      confidence: detectionResult.confidence,
      timestamp: new Date().toISOString(),
    });
  }
}
