//import { App } from "./app/App";
//import { renderToRscStream } from "./render/renderToRscStream";
//import { transformRscToHtmlStream } from "./render/transformRscToHtmlStream";
//import { injectRSCPayload } from "rsc-html-stream/server";

export default {
	async fetch(_request: Request) {
		// todo(justinvdm, 2024-11-19): Handle RSC actions here

		//const rscPayloadStream = await renderToRscStream(<App />);
		//const [rscPayloadStream1, rscPayloadStream2] = rscPayloadStream.tee();
		//const htmlStream = await transformRscToHtmlStream(rscPayloadStream1);
		//const html = htmlStream.pipeThrough(injectRSCPayload(rscPayloadStream2));

		return new Response('wassuup', {
			headers: { "content-type": "text/html" },
		});
	},
};
