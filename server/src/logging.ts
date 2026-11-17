// Allowlisted fields prevent routine request/error logs from retaining search URLs,
// IP addresses, headers, stream URLs or upstream credentials.
export const safeSerializers = {
  req: (request: { method?: string }) => ({ method: request.method }),
  res: (response: { statusCode?: number }) => ({ statusCode: response.statusCode }),
  err: (_error: unknown) => ({ type: 'Error', message: 'Server operation failed', stack: '[omitted]' }),
};
// Pino also copies Error.message into the top-level msg field, independently of
// the error serializer. Redact free-text messages in these operational logs.
export const safeLoggerOptions = {
  serializers: safeSerializers,
  redact: { paths: ['msg'], censor: '[omitted]' },
};
