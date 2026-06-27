import pino, { type Logger } from 'pino';

/**
 * Structured application logger (pino).
 *
 * Output is line-delimited JSON on stdout in production — the k8s log collector
 * scrapes pod stdout and ships it onward (see the logging-pipeline issue / T-10).
 * Dev gets human-readable `pino-pretty`; tests are silent so suites stay quiet.
 *
 * Config is read from `process.env` (not `$app/environment`) on purpose: this
 * module is imported both by the SvelteKit server and by the standalone bun job
 * worker (`scripts/jobs-worker.ts`), where SvelteKit virtual modules do not
 * resolve. Transports (worker threads) only run in dev, so the bundled
 * adapter-node server never depends on pino-pretty at runtime.
 */
const nodeEnv = process.env.NODE_ENV;
const isDev = nodeEnv === 'development';
const isTest = nodeEnv === 'test';

const level = process.env.LOG_LEVEL ?? (isTest ? 'silent' : isDev ? 'debug' : 'info');

export const logger: Logger = pino({
	level,
	base: { service: 'cutline' },
	// Serialize Error objects logged under the `err` key (message/stack/type).
	serializers: { err: pino.stdSerializers.err },
	// Never let auth material reach the log sink.
	redact: ['req.headers.authorization', 'req.headers.cookie', '*.password', '*.token'],
	...(isDev
		? {
				transport: {
					target: 'pino-pretty',
					options: { colorize: true, translateTime: 'SYS:HH:MM:ss' }
				}
			}
		: {})
});
