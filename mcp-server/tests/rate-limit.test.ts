/**
 * Unit tests for rate limiting functionality
 *
 * Tests the Cloudflare Rate Limiting API implementation.
 */

import { describe, it, expect, vi } from 'vitest';
import {
	checkAndApplyRateLimit,
	getRateLimitHeaders,
	createRateLimitResponse,
	getClientIP,
	hashIP,
	logRateLimitEvent,
	RATE_LIMIT_MAX_REQUESTS,
	RATE_LIMIT_WINDOW_SECONDS
} from '../src/rate-limit';
import type { RateLimitBinding } from '../src/types/bindings';

describe('Rate Limiting API', () => {
	describe('checkAndApplyRateLimit', () => {
		it('should allow requests under the limit', async () => {
			const mockRateLimiter: RateLimitBinding = {
				limit: vi.fn().mockResolvedValue({ success: true })
			};

			const result = await checkAndApplyRateLimit(mockRateLimiter, '1.2.3.4');

			expect(result.allowed).toBe(true);
			expect(result.limit).toBe(RATE_LIMIT_MAX_REQUESTS);
			expect(result.remaining).toBe(null); // API doesn't provide exact count
			expect(result.resetTime).toBeGreaterThan(Math.floor(Date.now() / 1000));
			expect(mockRateLimiter.limit).toHaveBeenCalledWith({ key: '1.2.3.4' });
		});

		it('should block requests over the limit', async () => {
			const mockRateLimiter: RateLimitBinding = {
				limit: vi.fn().mockResolvedValue({ success: false })
			};

			const result = await checkAndApplyRateLimit(mockRateLimiter, '1.2.3.4');

			expect(result.allowed).toBe(false);
			expect(result.limit).toBe(RATE_LIMIT_MAX_REQUESTS);
			expect(result.remaining).toBe(0);
			expect(result.resetTime).toBeGreaterThan(Math.floor(Date.now() / 1000));
		});

		it('should fail open on API errors', async () => {
			const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
			const mockRateLimiter: RateLimitBinding = {
				limit: vi.fn().mockRejectedValue(new Error('API Error'))
			};

			const result = await checkAndApplyRateLimit(mockRateLimiter, '1.2.3.4');

			expect(result.allowed).toBe(true); // Fail open
			expect(consoleErrorSpy).toHaveBeenCalledWith(
				expect.stringContaining('Rate limit check failed'),
				expect.any(Error)
			);

			consoleErrorSpy.mockRestore();
		});

		it('should log warning if latency exceeds 10ms', async () => {
			const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

			// Mock slow response
			const mockRateLimiter: RateLimitBinding = {
				limit: vi.fn().mockImplementation(() =>
					new Promise(resolve => setTimeout(() => resolve({ success: true }), 15))
				)
			};

			await checkAndApplyRateLimit(mockRateLimiter, '1.2.3.4');

			expect(consoleWarnSpy).toHaveBeenCalledWith(
				expect.stringContaining('Rate limit check took')
			);

			consoleWarnSpy.mockRestore();
		});

		it('should handle different IP addresses independently', async () => {
			const mockRateLimiter: RateLimitBinding = {
				limit: vi.fn().mockResolvedValue({ success: true })
			};

			await checkAndApplyRateLimit(mockRateLimiter, '1.2.3.4');
			await checkAndApplyRateLimit(mockRateLimiter, '5.6.7.8');

			expect(mockRateLimiter.limit).toHaveBeenCalledTimes(2);
			expect(mockRateLimiter.limit).toHaveBeenCalledWith({ key: '1.2.3.4' });
			expect(mockRateLimiter.limit).toHaveBeenCalledWith({ key: '5.6.7.8' });
		});
	});
});

describe('HTTP Response Helpers', () => {
	describe('getRateLimitHeaders', () => {
		it('should omit remaining header when null', () => {
			const headers = getRateLimitHeaders({
				allowed: true,
				limit: 10,
				remaining: null,
				resetTime: 1234567890
			});

			expect(headers['X-RateLimit-Remaining']).toBeUndefined();
			expect(headers['X-RateLimit-Limit']).toBe('10');
			expect(headers['X-RateLimit-Reset']).toBe('1234567890');
		});

		it('should include remaining header when available', () => {
			const headers = getRateLimitHeaders({
				allowed: false,
				limit: 10,
				remaining: 0,
				resetTime: 1234567890
			});

			expect(headers['X-RateLimit-Remaining']).toBe('0');
			expect(headers['X-RateLimit-Limit']).toBe('10');
			expect(headers['X-RateLimit-Reset']).toBe('1234567890');
		});
	});

	describe('createRateLimitResponse', () => {
		it('should create proper 429 response', () => {
			const now = Math.floor(Date.now() / 1000);
			const resetTime = now + 30;

			const response = createRateLimitResponse({
				allowed: false,
				limit: 10,
				remaining: 0,
				resetTime
			});

			expect(response.status).toBe(429);
			expect(response.headers.get('Content-Type')).toBe('application/json');
			expect(response.headers.get('Retry-After')).toBe('30');
			expect(response.headers.get('X-RateLimit-Limit')).toBe('10');
			expect(response.headers.get('X-RateLimit-Remaining')).toBe('0');
		});

		it('should include error details in body', async () => {
			const resetTime = Math.floor(Date.now() / 1000) + 45;

			const response = createRateLimitResponse({
				allowed: false,
				limit: 10,
				remaining: 0,
				resetTime
			});

			const body = await response.json() as any;

			expect(body.error).toBe('Too Many Requests');
			expect(body.message).toContain('Try again in');
			expect(body.limit).toBe(10);
			expect(body.window).toBe('60 seconds');
			expect(body.resetTime).toBe(resetTime);
			expect(body.retryAfter).toBeGreaterThan(0);
		});

		it('should ensure retryAfter is at least 1 second', () => {
			const now = Math.floor(Date.now() / 1000);
			const resetTime = now - 10; // Already expired

			const response = createRateLimitResponse({
				allowed: false,
				limit: 10,
				remaining: 0,
				resetTime
			});

			const retryAfter = response.headers.get('Retry-After');
			expect(parseInt(retryAfter || '0')).toBeGreaterThanOrEqual(1);
		});
	});
});

describe('Utility Functions', () => {
	describe('getClientIP', () => {
		it('should extract IP from cf-connecting-ip header', () => {
			const request = new Request('http://localhost', {
				headers: { 'cf-connecting-ip': '1.2.3.4' }
			});

			expect(getClientIP(request)).toBe('1.2.3.4');
		});

		it('should return 127.0.0.1 for localhost', () => {
			const request = new Request('http://localhost', {
				headers: { 'cf-connecting-ip': 'localhost' }
			});

			expect(getClientIP(request)).toBe('127.0.0.1');
		});

		it('should return 127.0.0.1 when header is missing', () => {
			const request = new Request('http://localhost');

			expect(getClientIP(request)).toBe('127.0.0.1');
		});

		it('should handle IPv6 addresses', () => {
			const request = new Request('http://localhost', {
				headers: { 'cf-connecting-ip': '2001:0db8:85a3::8a2e:0370:7334' }
			});

			expect(getClientIP(request)).toBe('2001:0db8:85a3::8a2e:0370:7334');
		});
	});

	describe('hashIP', () => {
		it('should hash IP address to fixed length', () => {
			const hash = hashIP('1.2.3.4');

			expect(hash).toHaveLength(16);
			expect(typeof hash).toBe('string');
		});

		it('should produce consistent hashes', () => {
			const hash1 = hashIP('1.2.3.4');
			const hash2 = hashIP('1.2.3.4');

			expect(hash1).toBe(hash2);
		});

		it('should produce different hashes for different IPs', () => {
			const hash1 = hashIP('1.2.3.4');
			const hash2 = hashIP('5.6.7.8');

			expect(hash1).not.toBe(hash2);
		});

		it('should handle errors gracefully', () => {
			// Test with invalid input that might cause btoa to fail
			const hash = hashIP('\uD800'); // Invalid unicode

			expect(hash).toBe('hash-error');
		});
	});

	describe('logRateLimitEvent', () => {
		it('should log structured event data', () => {
			const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

			logRateLimitEvent('1.2.3.4', true);

			expect(consoleLogSpy).toHaveBeenCalledWith(
				expect.stringContaining('"event":"rate_limit_check"')
			);
			expect(consoleLogSpy).toHaveBeenCalledWith(
				expect.stringContaining('"allowed":true')
			);

			consoleLogSpy.mockRestore();
		});

		it('should hash IP in logs for privacy', () => {
			const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

			logRateLimitEvent('1.2.3.4', false);

			const logCall = consoleLogSpy.mock.calls[0][0] as string;
			expect(logCall).not.toContain('1.2.3.4'); // Raw IP should not appear
			expect(logCall).toContain('"ip_hash"'); // Hash should be present

			consoleLogSpy.mockRestore();
		});

		it('should include timestamp', () => {
			const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

			logRateLimitEvent('1.2.3.4', true);

			const logCall = consoleLogSpy.mock.calls[0][0] as string;
			expect(logCall).toContain('"timestamp"');
			expect(logCall).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/); // ISO 8601 format

			consoleLogSpy.mockRestore();
		});
	});
});

describe('Integration Scenarios', () => {
	it('should handle full rate limiting flow', async () => {
		const mockRateLimiter: RateLimitBinding = {
			limit: vi.fn().mockResolvedValue({ success: true })
		};

		// First request - should be allowed
		const result1 = await checkAndApplyRateLimit(mockRateLimiter, '1.2.3.4');
		expect(result1.allowed).toBe(true);

		// Simulate hitting limit
		mockRateLimiter.limit = vi.fn().mockResolvedValue({ success: false });

		// Next request - should be blocked
		const result2 = await checkAndApplyRateLimit(mockRateLimiter, '1.2.3.4');
		expect(result2.allowed).toBe(false);

		// Create 429 response
		const response = createRateLimitResponse(result2);
		expect(response.status).toBe(429);
	});

	it('should preserve privacy in logging', async () => {
		const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
		const mockRateLimiter: RateLimitBinding = {
			limit: vi.fn().mockResolvedValue({ success: true })
		};

		await checkAndApplyRateLimit(mockRateLimiter, '192.168.1.1');
		logRateLimitEvent('192.168.1.1', true);

		const logCalls = consoleLogSpy.mock.calls.map(call => call[0] as string);
		const hasRawIP = logCalls.some(log => log.includes('192.168.1.1'));

		expect(hasRawIP).toBe(false); // Raw IP should never appear in logs

		consoleLogSpy.mockRestore();
	});

	it('should handle rapid sequential requests', async () => {
		const mockRateLimiter: RateLimitBinding = {
			limit: vi.fn().mockResolvedValue({ success: true })
		};

		// Make 5 rapid requests
		const results = await Promise.all([
			checkAndApplyRateLimit(mockRateLimiter, '1.2.3.4'),
			checkAndApplyRateLimit(mockRateLimiter, '1.2.3.4'),
			checkAndApplyRateLimit(mockRateLimiter, '1.2.3.4'),
			checkAndApplyRateLimit(mockRateLimiter, '1.2.3.4'),
			checkAndApplyRateLimit(mockRateLimiter, '1.2.3.4')
		]);

		// All should be allowed (we're mocking success)
		expect(results.every(r => r.allowed)).toBe(true);
		expect(mockRateLimiter.limit).toHaveBeenCalledTimes(5);
	});
});
