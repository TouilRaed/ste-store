/**
 * The message to show when an upload fails.
 *
 * Our own route answers `{ error: "…" }`, but a request too large for the
 * platform is rejected before it gets there and comes back as
 * `{ error: { code, message } }` — or as HTML. Reading `error` straight out of
 * the body printed "[object Object]" at the person in exactly the case they
 * most needed to be told what went wrong.
 */
export function uploadErrorMessage(payload: unknown, status: number): string {
  if (status === 413) return "Photo trop lourde. Choisissez-en une plus légère.";

  if (payload && typeof payload === "object" && "error" in payload) {
    const error = (payload as { error: unknown }).error;
    if (typeof error === "string" && error.trim()) return error;
    if (error && typeof error === "object" && "message" in error) {
      const message = (error as { message: unknown }).message;
      if (typeof message === "string" && message.trim()) return message;
    }
  }

  return `Échec de l'envoi (${status})`;
}
