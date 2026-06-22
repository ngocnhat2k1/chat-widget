// Narrow an unknown thrown value (typically an Axios error) down to a
// user-facing message, falling back when the shape is unexpected.
export function getErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === "object" && error !== null && "response" in error) {
    const message = (error as { response?: { data?: { message?: unknown } } })
      .response?.data?.message;
    if (typeof message === "string") return message;
    // NestJS validation errors arrive as an array of messages.
    if (Array.isArray(message)) return message.join(", ");
  }
  return fallback;
}
