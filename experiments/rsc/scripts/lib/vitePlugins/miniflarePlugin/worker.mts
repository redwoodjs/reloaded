import { DurableObject } from "cloudflare:workers";
import { FetchMetadata, RunnerEnv, RunnerRpc } from "./types.mjs";
import {
  ModuleEvaluator,
  ModuleRunner,
  type ModuleRunnerTransportHandlers,
} from "vite/module-runner";
import { HotPayload } from "vite";

type IncomingRequest = Request<unknown, IncomingRequestCfProperties<unknown>>;

export class RunnerWorker
  extends DurableObject<RunnerEnv>
  implements RunnerRpc
{
  #runner?: ModuleRunner;
  #handlers?: ModuleRunnerTransportHandlers;

  override async fetch(request: IncomingRequest) {
    try {
      return await this.#fetch(request);
    } catch (e) {
      console.error(e);
      let body = "[vite workerd runner error]\n";
      if (e instanceof Error) {
        body += `${e.stack ?? e.message}`;
      }
      return new Response(body, { status: 500 });
    }
  }

  async #fetch(request: IncomingRequest) {
    if (!this.#runner) {
      throw new Error("Runner not initialized");
    }

    const options = JSON.parse(
      request.headers.get("x-vite-fetch")!,
    ) as FetchMetadata;

    const mod = await this.#runner.import(options.entry);

    const handler = mod.default as ExportedHandler;

    if (!handler.fetch) {
      throw new Error("Worker does not have a fetch method");
    }

    const env = Object.fromEntries(
      Object.entries(this.env).filter(([key]) => !key.startsWith("__vite")),
    );

    return handler.fetch(request, env, {
      waitUntil(_promise: Promise<any>) {},
      passThroughOnException() {},
    });
  }

  async initRunner() {
    this.#runner = new ModuleRunner({
      root: this.env.__viteRoot,
      sourcemapInterceptor: "prepareStackTrace",
      hmr: true,
      transport: {
        invoke: (payload) =>
          callBinding({
            binding: this.env.__viteInvoke,
            payload,
          }),
        connect: (handlers) => {
          this.#handlers = handlers;
        },
        send: (payload) =>
          callBinding({ binding: this.env.__viteSendToServer, payload }),
      },
    });
  }

  async sendToRunner(payload: HotPayload): Promise<void> {
    // context(justinvdm, 10 Dec 2024): This is the handler side of the `sendToWorker` rpc method.
    // We're telling the runner: "here's a message from the server, do something with it".
    this.#handlers?.onMessage(payload);
  }
}

export const createEvaluator = (env: RunnerEnv): ModuleEvaluator => ({
  async runInlinedModule(context, transformed, module) {
    const codeDefinition = `'use strict';async (${Object.keys(context).join(
      ",",
    )})=>{{`;
    const code = `${codeDefinition}${transformed}\n}}`;
    try {
      const fn = env.__VITE_UNSAFE_EVAL__.eval(code, module.id);
      await fn(...Object.values(context));
      Object.freeze(context.__vite_ssr_exports__);
    } catch (e) {
      console.error("error running", module.id);
      console.error(e instanceof Error ? e.stack : e);
      throw e;
    }
  },
  async runExternalModule(filepath) {
    return import(filepath);
  },
});

async function callBinding<Result>({
  binding,
  payload,
}: {
  binding: { fetch: (request: Request) => Promise<Response> };
  payload: HotPayload;
}) {
  const request = new Request("https://any.local", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const response = await binding.fetch(request);

  if (!response.ok) {
    throw new Error(`Failed to call binding: ${response.statusText}`);
  }

  return response.json() as Result;
}
