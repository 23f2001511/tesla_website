/**
 * Narrowing helper for `unknown` error values in `catch` blocks.
 *
 * `catch (err)` gives `unknown` under strict mode, so every route used to reach
 * for `catch (err: any)`. This keeps the same convenience without the `any`:
 *
 * ```ts
 * } catch (err) {
 *   return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
 * }
 * ```
 */
export function getErrorMessage(
  error: unknown,
  fallback = 'Something went wrong. Please try again.'
): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  if (typeof error === 'string' && error.trim()) {
    return error;
  }
  if (typeof error === 'object' && error !== null) {
    const candidate = error as { message?: unknown; error?: unknown };
    if (typeof candidate.message === 'string' && candidate.message) {
      return candidate.message;
    }
    if (typeof candidate.error === 'string' && candidate.error) {
      return candidate.error;
    }
  }
  return fallback;
}

/**
 * Structured view over an `unknown` error for the places that need more than a
 * message — Mongoose error names/validation bags, SMTP error codes, etc.
 */
export interface ErrorDetails {
  name?: string;
  message?: string;
  code?: string | number;
  responseCode?: string | number;
  response?: string;
  errors?: Record<string, { message?: string } | undefined>;
}

export function getErrorDetails(error: unknown): ErrorDetails {
  const details: ErrorDetails = {};
  if (error instanceof Error) {
    details.name = error.name;
    details.message = error.message;
  }
  if (typeof error === 'object' && error !== null) {
    const raw = error as Record<string, unknown>;
    if (typeof raw.name === 'string') details.name = raw.name;
    if (typeof raw.message === 'string') details.message = raw.message;
    if (typeof raw.code === 'string' || typeof raw.code === 'number') details.code = raw.code;
    if (typeof raw.responseCode === 'string' || typeof raw.responseCode === 'number') {
      details.responseCode = raw.responseCode;
    }
    if (typeof raw.response === 'string') details.response = raw.response;
    if (typeof raw.errors === 'object' && raw.errors !== null) {
      details.errors = raw.errors as ErrorDetails['errors'];
    }
  }
  return details;
}

/**
 * Reads a JSON request body without trusting its shape — every route that used
 * `await request.json()` now gets a plain record and narrows the fields it needs.
 */
export async function readJsonBody(request: Request): Promise<Record<string, unknown>> {
  const body: unknown = await request.json().catch(() => ({}));
  return typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {};
}
