import { BasicTracerProvider } from "@opentelemetry/sdk-trace-base";
import { Resource } from "@opentelemetry/resources";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { diag, DiagConsoleLogger, DiagLogLevel } from "@opentelemetry/api";

if (!!process.env["DEBUG"]) {
  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);
}

export class TraceProvider {
  // this is setup as a singleton so that it can only be instantiated once,
  // as it's called on many times, but never registed globally.
  // Because it's a plugin, the code might be evaluated but not needed to run.
  private static _instance: BasicTracerProvider;

  public static getInstance(): BasicTracerProvider {
    return this._instance || (this._instance = new this().start());
  }

  public static provider(): BasicTracerProvider {
    return this._instance || (this._instance = new this().start());
  }

  private start(): BasicTracerProvider {
    // configure the SDK to export telemetry data to the console
    // enable all auto-instrumentations from the meta package
    const exporter = new OTLPTraceExporter();

    const provider = new BasicTracerProvider({
      resource: new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: "yarn.build",
      }),
    });

    provider.addSpanProcessor(new BatchSpanProcessor(exporter));

    async function exitHandler(evtOrExitCodeOrError: number | string | Error) {
      try {
        await provider.shutdown();
        if (!!process.env["DEBUG"]) {
          console.info("gracefullty exited trace provider");
        }
      } finally {
        process.exit(isNaN(+evtOrExitCodeOrError) ? 1 : +evtOrExitCodeOrError);
      }
    }

    // Handle all the exit codes so that we can shutdown and flush the traces
    [
      "beforeExit",
      "exit",
      "uncaughtException",
      "unhandledRejection",
      "SIGHUP",
      "SIGINT",
      "SIGQUIT",
      "SIGILL",
      "SIGTRAP",
      "SIGABRT",
      "SIGBUS",
      "SIGFPE",
      "SIGUSR1",
      "SIGSEGV",
      "SIGUSR2",
      "SIGTERM",
    ].forEach((evt) => process.on(evt, exitHandler));

    return provider;
  }
}
