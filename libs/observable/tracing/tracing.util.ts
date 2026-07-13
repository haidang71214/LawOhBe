import { ClientProxy } from '@nestjs/microservices';
import { context, propagation } from '@opentelemetry/api';
import { Observable } from 'rxjs';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { AsyncHooksContextManager } from '@opentelemetry/context-async-hooks';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { resourceFromAttributes } from '@opentelemetry/resources';
import {
  BatchSpanProcessor,
  NodeTracerProvider,
} from '@opentelemetry/sdk-trace-node';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';

export interface Carrier {
  traceparent?: string;
  tracestate?: string;
}

/**
 * Creates a Proxy to transparently inject OpenTelemetry tracing context
 * into client send/emit methods.
 * @param client The ClientProxy to wrap
 */
export function createTracingClientProxy<T extends ClientProxy>(client: T): T {
  return new Proxy(client as any, {
    get: (target, prop) => {
      // Intercept 'send' method
      if (prop === 'send') {
        return (pattern: any, data: any) =>
          wrapRequest(target, 'send', pattern, data);
      }
      // Intercept 'emit' method
      if (prop === 'emit') {
        return (pattern: any, data: any) =>
          wrapRequest(target, 'emit', pattern, data);
      }
      // Pass through all other properties
      return target[prop];
    },
  });
}

function wrapRequest(
  client: ClientProxy,
  method: 'send' | 'emit',
  pattern: any,
  data: any,
): Observable<any> {
  const carrier: Carrier = {};

  // Inject current active context into the carrier
  propagation.inject(context.active(), carrier);

  // Merge payload with tracing info without double nesting
  const payloadWithTrace =
    typeof data === 'object' && data !== null && !Array.isArray(data)
      ? { ...data, __tracing__: carrier }
      : { data, __tracing__: carrier };

  // Forward request
  return client[method](pattern, payloadWithTrace);
}

export const initTracing = (serviceName: string) => {
  const exporter = new OTLPTraceExporter({
    // Tempo/Collector OTLP endpoint
    url:
      process.env['OTEL_EXPORTER_OTLP_ENDPOINT'] ||
      'http://localhost:4318/v1/traces',
  });

  const processor = new BatchSpanProcessor(exporter);

  const provider = new NodeTracerProvider({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: serviceName,
    }),
    spanProcessors: [processor],
  });

  const contextManager = new AsyncHooksContextManager();
  contextManager.enable();

  provider.register({
    contextManager,
  });

  registerInstrumentations({
    instrumentations: [getNodeAutoInstrumentations()],
  });

  process.on('SIGTERM', () => {
    provider
      .shutdown()
      .then(() => console.log('Tracing terminated'))
      .catch((error) => console.log('Error terminating tracing', error))
      .finally(() => process.exit(0));
  });
};
