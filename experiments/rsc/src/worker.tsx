import { App } from "./app/App";
import { createDbClient } from './db';
import { renderToRscStream } from "./render/renderToRscStream";
import { transformRscToHtmlStream } from "./render/transformRscToHtmlStream";
import { injectRSCPayload } from "rsc-html-stream/server";

export interface Env {
	DB: D1Database;
}

export default {
	async fetch(_request: Request, env: Env): Promise<Response> {
		// todo(justinvdm, 2024-11-19): Handle RSC actions here

		// harryhcs just loging the data out here
		// useing npx wrangler tail to get the logs inmy terminal

		const db = createDbClient(env)
		const results = await db.user.findMany()
		console.log('###', results)

		const rscPayloadStream = renderToRscStream(<App />);
		const [rscPayloadStream1, rscPayloadStream2] = rscPayloadStream.tee();
		const htmlStream = await transformRscToHtmlStream(rscPayloadStream1);

		const html = htmlStream.pipeThrough(injectRSCPayload(rscPayloadStream2));
		return new Response(html, {
			headers: { "content-type": "text/html" },
		});
	},
};
