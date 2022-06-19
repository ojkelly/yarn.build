// import opentelemetry from "@opentelemetry/sdk-node";
import { BasicTracerProvider } from "@opentelemetry/sdk-trace-base";
// import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { Resource } from "@opentelemetry/resources";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { SpanStatusCode, SpanOptions } from "@opentelemetry/api";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
// import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
// import { ZoneContextManager } from '@opentelemetry/context-zone';
import {
  Span,
  Context,
  context,
  trace,
  Tracer as OTELTracer,
} from "@opentelemetry/api";

export class TraceProvider {
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
    const exporter = new OTLPTraceExporter(); //{
    // url: "http://localhost:4318/v1/traces",
    // });

    const provider = new BasicTracerProvider({
      resource: new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: "yarn.build",
      }),
    });

    provider.addSpanProcessor(new BatchSpanProcessor(exporter));

    // const config = {
    //   resource: new Resource({
    //     [SemanticResourceAttributes.SERVICE_NAME]: "yarn.build#build",
    //   }),
    //   traceExporter,
    //   instrumentations: [], //[getNodeAutoInstrumentations()],
    // };
    // const sdk = new opentelemetry.NodeSDK();

    // const sdk = new BasicTracerProvider(config);

    // sdk.register();

    // api.diag.setLogger(new api.DiagConsoleLogger(), api.DiagLogLevel.DEBUG);

    // sdk
    //   .start()
    //   .then(() => console.log("Tracing initialized"))
    //   .catch((error) => console.log("Error initializing tracing", error));

    // gracefully shut down the SDK on process exit
    // process.on("SIGTERM", () => {
    //   provider
    //     .shutdown()
    //     .then(() => console.log("Tracing terminated"))
    //     .catch((error) => console.log("Error terminating tracing", error))
    //     .finally(() => process.exit(0));
    // });
    // process.on("uncaughtException", (err) => {
    //   provider
    //     .shutdown()
    //     .then(() => console.log("Tracing terminated"))
    //     .catch((error) => console.log("Error terminating tracing", error))
    //     .finally(() => process.exit(1));
    // });

    async function exitHandler(evtOrExitCodeOrError: number | string | Error) {
      try {
        await provider.shutdown();
      } finally {
        process.exit(isNaN(+evtOrExitCodeOrError) ? 1 : +evtOrExitCodeOrError);
      }
    }

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

export class Tracer {
  name: string;

  _tracer: OTELTracer;

  constructor(name: string) {
    this.name = name;
    this._tracer = TraceProvider.getInstance().getTracer(name);
  }

  recordException(span: Span, error: any): void {
    span.recordException(error);
    span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
  }

  async startSpan<
    F extends ({ span, ctx }: { span: Span; ctx: Context }) => ReturnType<F>
  >(
    opts: {
      name: string;
      ctx?: Context;
      catchExceptions?: boolean;
      spanOptions?: SpanOptions;
    },
    fn: F
  ): Promise<Awaited<ReturnType<F>> | ReturnType<F>> {
    let ctx: Context;

    if (typeof opts.ctx === "undefined") {
      ctx = context.active();
    } else {
      ctx = opts.ctx;
    }

    const span = this._tracer.startSpan(opts.name, opts.spanOptions, ctx);

    const newCtx = trace.setSpan(ctx, span);

    // let result: ReturnType<F> | Awaited<ReturnType<F>>;
    // if (fn.constructor.name === "AsyncFunction") {
    //     if (fn instanceof Promise) {
    // fn: Promise<ReturnType<F>> = fn({ span, ctx: newCtx });

    //       // return f
    //       //   .catch((error) => {
    //       //     this.recordException(span, error);
    //       //     if (!opts.catchExceptions) {
    //       //       throw error;
    //       //     }
    //       //   })
    //       //   .then((r) => r)
    //       //   .finally((r) => {
    //       //     span.end();

    //       //     return r;
    //       //   });
    //     }

    // return async (): Promise<Awaited<ReturnType<F>>> => {
    try {
      if (fn.constructor.name === "AsyncFunction") {
        return await fn({ span, ctx: newCtx });
      } else {
        return fn({ span, ctx: newCtx });
      }
    } catch (error) {
      this.recordException(span, error);
      if (!opts.catchExceptions) {
        throw error;
      }
    } finally {
      span.end();
    }

    // };
    throw new Error("Unkown error");
  }

  // Wrap an inline chunk of code in a span.
  // Useful when you want to instrument something like a closure
  // that is too cumbersome to extract.
  //
  //     await tracer.wrap(
  //       "copy to tmp dir",
  //       ctx,
  //       async (cwd: PortablePath) =>
  //         xfs.copyPromise(tmpDir, cwd, {
  //           baseFs,
  //         }),
  //       sourceConfiguration.projectCwd
  //     );
  async wrap<F extends (...args: any[]) => ReturnType<F>>(
    opts: {
      name: string;
      ctx?: Context;
    },
    cb: F,
    ...args: any[]
  ): Promise<Awaited<ReturnType<F>>> {
    let ctx: Context;

    if (typeof opts.ctx === "undefined") {
      ctx = context.active();
    } else {
      ctx = opts.ctx;
    }

    const c = async (): Promise<Awaited<ReturnType<F>>> =>
      await this.startSpan(
        { name: opts.name, ctx },
        async () => await cb(...args)
      );

    return await c();
  }

  async testSpans(): Promise<void> {
    await this.startSpan({ name: "test span 1" }, async ({ span, ctx }) => {
      span.addEvent("test span event");

      await this.startSpan({ name: "test span 1.1", ctx }, async ({ ctx }) => {
        await this.startSpan(
          { name: "test span 1.2", ctx },
          async ({ ctx }) => {
            return await Promise.all([
              await this.startSpan(
                { name: "test span 1.2.1", ctx },
                async ({ span }) => {
                  span.addEvent(`math: ${1 + 2 + 1}`);
                  // span.end();
                  console.warn("test spans 1.2.1");
                }
              ),

              await this.startSpan(
                { name: "test span 1.2.2", ctx },
                async ({ span }) => {
                  span.addEvent(`math: ${1 + 2 + 2}`);
                  console.warn("test spans 1.2.2");
                  throw new Error("test 1.2.2 error");
                }
              ),

              await this.startSpan(
                { name: "test span 1.2.3", ctx },
                async ({ span }) => {
                  span.addEvent(`math: ${1 + 2 + 3}`);
                  console.warn("test spans 1.2.3");
                }
              ),
            ]);
          }
        );
      });
    });
  }
}

export { Context, Span };

// export const TraceProvider = (function () {
//   let instance: BasicTracerProvider;

//   function createInstance() {
//     console.log("starting tracer");

//     // configure the SDK to export telemetry data to the console
//     // enable all auto-instrumentations from the meta package
//     const exporter = new OTLPTraceExporter({
//       url: "http://localhost:4318/v1/traces",
//     });

//     const provider = new BasicTracerProvider({
//       resource: new Resource({
//         [SemanticResourceAttributes.SERVICE_NAME]: "browser",
//       }),
//     });

//     provider.addSpanProcessor(new BatchSpanProcessor(exporter));

//     // const config = {
//     //   resource: new Resource({
//     //     [SemanticResourceAttributes.SERVICE_NAME]: "yarn.build#build",
//     //   }),
//     //   traceExporter,
//     //   instrumentations: [], //[getNodeAutoInstrumentations()],
//     // };
//     // const sdk = new opentelemetry.NodeSDK();

//     // const sdk = new BasicTracerProvider(config);

//     // sdk.register();

//     // api.diag.setLogger(new api.DiagConsoleLogger(), api.DiagLogLevel.DEBUG);

//     // sdk
//     //   .start()
//     //   .then(() => console.log("Tracing initialized"))
//     //   .catch((error) => console.log("Error initializing tracing", error));

//     // gracefully shut down the SDK on process exit
//     // process.on("SIGTERM", () => {
//     //   sdk
//     //     .shutdown()
//     //     .then(() => console.log("Tracing terminated"))
//     //     .catch((error) => console.log("Error terminating tracing", error))
//     //     .finally(() => process.exit(0));
//     // });

//     const t = trace.getTracer("yarn.build#test");
//     const span = t.startSpan("test-span");

//     span.end();

//     return provider;
//   }

//   return {
//     getInstance: function () {
//       if (!instance) {
//         instance = createInstance();
//       }

//       return instance;
//     },
//   };
// })();

export const Attribute = {
  PACKAGE_NAME: "package.name",
  PACKAGE_SCOPE: "package.scope",
  PACKAGE_DIRECTORY: "package.directory",
  PACKAGE_COMMAND: "package.command",

  // VCS
  GIT_BRANCH: "git.branch",
  GIT_COMMIT: "git.commit",

  YARN_BUILD_MESSAGE_CODE: "yarn.build.message.code",

  // Yarn.build flags
  YARN_BUILD_CONFIG_FOLDERS_INPUT: "yarn.build.config.folders.input",
  YARN_BUILD_CONFIG_FOLDERS_OUTPUT: "yarn.build.config.folders.output",
  YARN_BUILD_CONFIG_EXCLUDE: "yarn.build.config.exclude",
  YARN_BUILD_CONFIG_BAIL: "yarn.build.config.bail",
  YARN_BUILD_CONFIG_HIDE_BADGE: "yarn.build.config.hide-badge",
  YARN_BUILD_CONFIG_MAX_CONCURRENCY: "yarn.build.config.max-concurrency",

  // yarn build
  YARN_BUILD_FLAGS_OUTPUT_JSON: "yarn.build.flags.output.json",
  YARN_BUILD_FLAGS_ALL: "yarn.build.flags.all",
  YARN_BUILD_FLAGS_TARGETS: "yarn.build.flags.targets",
  YARN_BUILD_FLAGS_COMMAND: "yarn.build.flags.command",
  YARN_BUILD_FLAGS_INTERLACED: "yarn.build.flags.interlaced",
  YARN_BUILD_FLAGS_VERBOSE: "yarn.build.flags.verbose",
  YARN_BUILD_FLAGS_DRY_RUN: "yarn.build.flags.dry-run",
  YARN_BUILD_FLAGS_IGNORE_CACHE: "yarn.build.flags.ignore-cache",
  YARN_BUILD_FLAGS_MAX_CONCURRENCY: "yarn.build.flags.max-concurrency",
  YARN_BUILD_FLAGS_CONTINUE_ON_ERROR: "yarn.build.flags.continue-on-error",
  YARN_BUILD_FLAGS_EXCLUDE: "yarn.build.flags.exclude",
  YARN_BUILD_FLAGS_EXCLUDE_CURRENT: "yarn.build.flags.exclude.current",
  YARN_BUILD_FLAGS_CHANGES: "yarn.build.flags.changes",
  YARN_BUILD_FLAGS_SINCE: "yarn.build.flags.since",
  YARN_BUILD_FLAGS_SINCE_BRANCH: "yarn.build.flags.since-branch",
  YARN_BUILD_FLAGS_ONLY_CURRENT: "yarn.build.flags.only-current",

  // yarn bundle
  YARN_BUILD_FLAGS_BUNDLE_QUIET: "yarn.build.flags.bundle.quiet",
  YARN_BUILD_FLAGS_BUNDLE_TEMPORARY_DIRECTORY:
    "yarn.build.flags.bundle.temporary-directory",
  YARN_BUILD_FLAGS_BUNDLE_OUTPUT_DIRECTORY:
    "yarn.build.flags.bundle.output-directory",
  YARN_BUILD_FLAGS_BUNDLE_NO_COMPRESS: "yarn.build.flags.bundle.no-compress",
  YARN_BUILD_FLAGS_BUNDLE_ARCHIVE_NAME: "yarn.build.flags.bundle.archive-name",
  YARN_BUILD_FLAGS_BUNDLE_EXCLUDE: "yarn.build.flags.bundle.exclude",
  YARN_BUILD_FLAGS_BUNDLE_IGNORE_FILE: "yarn.build.flags.bundle.ignore-file",

  // Yarn.build per package attributes
  YARN_BUILD_PACKAGE_NEEDS_RUN: "yarn.build.package.needs-run",
  YARN_BUILD_PACKAGE_RUN_COMMAND: "yarn.build.package.run.command",
  YARN_BUILD_PACKAGE_RUN_COMMAND_EXIT: "yarn.build.package.run.command.exit",
};
