import { ArgumentsHost, Catch, HttpException } from "@nestjs/common";
import { BaseExceptionFilter } from "@nestjs/core";
import * as Sentry from "@sentry/node";

/**
 * Forwards unhandled / server-side errors to Sentry, then defers to Nest's
 * default exception handling. Client errors (4xx HttpExceptions) are not
 * reported — they're expected. No-op reporting when Sentry isn't initialised.
 */
@Catch()
export class SentryExceptionFilter extends BaseExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const isClientError =
      exception instanceof HttpException && exception.getStatus() < 500;

    if (!isClientError) {
      Sentry.captureException(exception);
    }

    super.catch(exception, host);
  }
}
