/**
 * Races a promise against a timeout. If the promise doesn't settle within
 * `ms` milliseconds, the returned promise rejects with a timeout error.
 * The original promise is still running (can't be cancelled), but the
 * rejection unblocks any awaiting code so the UI doesn't hang forever.
 */
/**
 * Accepts both Promise and PromiseLike (e.g. Supabase's PostgrestFilterBuilder)
 * so callers don't need to wrap in Promise.resolve() first.
 */
export function withTimeout<T>(thenable: PromiseLike<T>, ms: number, label = 'Request'): Promise<T> {
  const promise = Promise.resolve(thenable)
  let handle: ReturnType<typeof setTimeout>
  const timeout = new Promise<never>((_, reject) => {
    handle = setTimeout(
      () => reject(new Error(`${label} timed out — check your connection and try again`)),
      ms,
    )
  })
  return Promise.race([promise, timeout]).finally(() => clearTimeout(handle))
}
