import { BasicTracerProvider,Tracer } from "@opentelemetry/sdk-trace-base";
import { Resource } from "@opentelemetry/resources";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { Attributes } from "@opentelemetry/api";

export class TraceProvider   {
  // this is setup as a singleton so that it can only be instantiated once,
  // as it's called on many times, but never registed globally.
  // Because it's a plugin, the code might be evaluated but not needed to run.
  private static _instance: TraceProvider;

  private static haveRegisterdExitHandler = false;

  // Each package will have it's own provider, so that we can have different
  // resource associated with it. The command itself may produice telemetry,
  // and even if it doesnt the span represents work done by the command, not
  // by yarn.build. So we setup a map of providers, to ensure we can shutdown
  // and flush the traces on exit.
  private  static providers: Map<string, BasicTracerProvider> = new Map();

  public static get(name: string, version?: string): Tracer {
    if (!this.haveRegisterdExitHandler) {
      TraceProvider.registerExitHandler();
    }


    return this.getTraceProvider(name, version).getTracer(name, version);
  }

  private static registerExitHandler() {
    if (TraceProvider.haveRegisterdExitHandler) {
      return;
    }

    async function exitHandler(evtOrExitCodeOrError: number | string | Error) {
      try {
        await Promise.all(Array.from(TraceProvider.providers.values()).map((provider) => provider.shutdown()));
      } finally {
        process.exit(isNaN(+evtOrExitCodeOrError) ? 1 : +evtOrExitCodeOrError);
      }
    }


    // Handle all the exit codes so that we can shutdown and flush the traces
    ["beforeExit", "uncaughtException", "SIGINT", "SIGTERM"].forEach((evt) =>
      process.on(evt, exitHandler),
    );

    TraceProvider.haveRegisterdExitHandler = true;
  }

  private static getTraceProvider(name: string, version?: string): BasicTracerProvider {
    const serviceName = `${name}${version ? `@${version}` : ""}`;

    let provider = TraceProvider.providers.get(serviceName);

    if (provider) {
      return provider;
    }

    const resourceOpts: Attributes = {
        [SemanticResourceAttributes.SERVICE_NAME]: name
     };

    if (version) {
      resourceOpts[SemanticResourceAttributes.SERVICE_VERSION] = version;
    }

    provider = new BasicTracerProvider({
      resource: new Resource(resourceOpts),
    });

    const exporter = new OTLPTraceExporter();

    provider.addSpanProcessor(new BatchSpanProcessor(exporter));

    TraceProvider.providers.set(name, provider);

    return provider;
  }
}
