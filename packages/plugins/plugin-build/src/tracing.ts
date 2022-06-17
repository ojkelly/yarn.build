import opentelemetry from "@opentelemetry/sdk-node";
// import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { Resource } from "@opentelemetry/resources";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import * as api from "@opentelemetry/api";

export const TraceProvider = (function () {
  let instance: opentelemetry.NodeSDK;

  function createInstance() {
    console.log("starting tracer");

    // configure the SDK to export telemetry data to the console
    // enable all auto-instrumentations from the meta package
    const traceExporter = new OTLPTraceExporter();
    const sdk = new opentelemetry.NodeSDK({
      resource: new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: "yarn.build#build",
      }),
      traceExporter,
      // instrumentations: [getNodeAutoInstrumentations()],
    });

    api.diag.setLogger(new api.DiagConsoleLogger(), api.DiagLogLevel.DEBUG);

    sdk.start();

    return sdk;
  }

  return {
    getInstance: function () {
      if (!instance) {
        instance = createInstance();
      }

      return instance;
    },
  };
})();
