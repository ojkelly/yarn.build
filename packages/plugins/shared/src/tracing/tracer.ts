import { SpanStatusCode, SpanOptions } from "@opentelemetry/api";
import { parseTraceParent } from "@opentelemetry/core/build/src/trace/W3CTraceContextPropagator";
import { TraceProvider } from "./provider";
import {
  Span,
  Context,
  context,
  trace,
  Tracer as OTELTracer,
} from "@opentelemetry/api";

export class Tracer {
  name: string;

  _tracer: OTELTracer;

  constructor(name: string) {
    this.name = name;
    this._tracer = TraceProvider.getInstance().getTracer(name);
  }

  recordException(span: Span, err: string | Error): void {
    if (typeof typeof err === "string" || err instanceof Error) {
      span.recordException(err);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: err instanceof Error ? err.message : err,
      });
    }
  }

  // Start a span, pass in a context to create nested spans
  //
  //   await this.tracer.startSpan(
  //    { name: "span name", ctx },
  //     async ({ span, ctx }) => {
  //       // do stuff
  //  })
  //
  async startSpan<
    F extends ({ span, ctx }: { span: Span; ctx: Context }) => ReturnType<F>,
  >(
    opts: {
      name: string;
      ctx?: Context;
      supressExceptions?: boolean; // set to true to prevent exceptions bubbling up the stack
      spanOptions?: SpanOptions;
      propegateFromEnv?: boolean;
    },
    fn: F,
  ): Promise<Awaited<ReturnType<F>> | ReturnType<F>> {
    // Get the current active context, or use the one passed in
    let ctx: Context;

    // While it would be nice to have `startSpan(name, ctx?, fn)`, `ctx` is optional,
    // which forces it to be `startSpan(name, fn, ctx?)`. With a long `fn`, it then
    // gets very hard to know if you've passed `ctx` to it at all.
    // So a small amount of extra ceremony with ` { name: "my span", ctx }`, helps
    // make it clear when you have or haven't passed `ctx` to `startSpan`
    if (typeof opts.ctx === "undefined") {
      ctx = context.active();
    } else {
      ctx = opts.ctx;
    }

    if (!!opts.propegateFromEnv || opts?.spanOptions?.kind == 4) {
      const tp = process.env["TRACEPARENT"];

      if (typeof tp == "string") {
        const parent = parseTraceParent(tp ?? "");

        if (!!parent) {
          ctx = trace.setSpanContext(context.active(), parent);
        }
      }
    }
    // create a new span with our context and options
    const span = this._tracer.startSpan(opts.name, opts.spanOptions, ctx);

    // get a new context with this span
    const newCtx = trace.setSpan(ctx, span);

    // Run the callback function
    try {
      if (fn.constructor.name === "AsyncFunction") {
        // handle async/promises
        return await fn({ span, ctx: newCtx });
      } else {
        // handle function
        return fn({ span, ctx: newCtx });
      }
    } catch (err) {
      if (typeof err === "string" || err instanceof Error) {
        this.recordException(span, err);
      }
      if (!opts.supressExceptions) {
        throw err;
      }
    } finally {
      // always end the span, otherwise it's not recorded
      span.end();
    }

    // This should never happen, but it could so we need to throw an exception
    // here, as it's undefined behaviour otherwise
    throw new Error("Unknown error");
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
  ): Promise<ReturnType<F> | Awaited<ReturnType<F>>> {
    let ctx: Context;

    if (typeof opts.ctx === "undefined") {
      ctx = context.active();
    } else {
      ctx = opts.ctx;
    }

    const c = async (): Promise<ReturnType<F> | Awaited<ReturnType<F>>> =>
      await this.startSpan(
        { name: opts.name, ctx },
        async () => await cb(...args),
      );

    return await c();
  }
}
