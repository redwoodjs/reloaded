import AdminPage from "./app/AdminPage";
import { App } from "./app/App";
import { db, setupDb } from "./db";
import HomePage from "./app/HomePage";
import { transformRscToHtmlStream } from "./render/transformRscToHtmlStream";
import { injectRSCPayload } from "rsc-html-stream/server";
import { renderToRscStream } from "./render/renderToRscStream";
import { TwilioClient, quickReplyMessage, saveVCardToR2 } from "./twilio";
import { ssrWebpackRequire } from "./imports/worker";
import { rscActionHandler } from "./register/worker";
import WelcomePage from "./app/WelcomePage";
import TradesmenPage from "./app/TradesmenPage";
import ProfessionsPage from "./app/ProfessionsPage";
import AddTradesmanPage from "./app/AddTradesmanPage";
import TradesmanPage from "./app/TradesmanPage";
import { setupR2Storage } from "./r2storage";
// todo(peterp, 2024-11-25): Make these lazy.
const routes = {
  "/": HomePage,
  "/welcome": WelcomePage,
  "/admin": AdminPage,
  "/tradesmen/:profession": (props: { params: { profession: string } }) => (
    <TradesmenPage profession={props.params.profession} />
  ),
  "/tradesman/:id": (props: { params: { id: number } }) => (
    <TradesmanPage id={props.params.id} />
  ),
  "/professions": ProfessionsPage,
  "/add-tradesman": AddTradesmanPage,
};

export default {
  async fetch(request: Request, env: Env) {
    globalThis.__webpack_require__ = ssrWebpackRequire;

    try {
      const url = new URL(request.url);

      const isRSCRequest = url.searchParams.has("__rsc");
      const isRSCActionHandler = url.searchParams.has("__rsc_action_id");

      if (isRSCActionHandler) {
        await rscActionHandler(request);
      }

      if (url.pathname.startsWith("/assets/")) {
        url.pathname = url.pathname.slice("/assets/".length);
        return env.ASSETS.fetch(new Request(url.toString(), request));
      }

      setupDb(env);
      setupR2Storage(env);

      // The worker access the bucket and returns it to the user, we dont let them access the bucket directly
      if (request.method === "GET" && url.pathname.startsWith("/bucket/")) {
        const filename = url.pathname.slice("/bucket/".length);
        const object = await env.valley_directory_r2.get(filename);

        if (object === null) {
          return new Response("Object Not Found", { status: 404 });
        }

        const headers = new Headers();
        // set the content toye for vcard else its seen as plain text
        if (filename.endsWith(".vcf")) {
          headers.set("content-type", "application/vcard");
        }

        if (filename.endsWith(".jpg") || filename.endsWith(".png")) {
          headers.set("content-type", "image/jpeg");
        }

        object.writeHttpMetadata(headers);
        headers.set("etag", object.httpEtag);

        return new Response(object.body, {
          headers,
        });
      }

      if (request.method === "POST" && request.url.includes("/incoming")) {
        const tradesmen = await db
          .selectFrom("Tradesman")
          .select(["id", "name", "cellnumber", "profession", "email"])
          .execute();

        const twilioClient = new TwilioClient(env);

        const body = await request.text();
        const bodyData = new URLSearchParams(body);
        const messageBody = bodyData.get("Body");
        const from = bodyData.get("From");

        const matchingTradesmen = tradesmen.filter((tradesman) =>
          messageBody
            ?.toLowerCase()
            .includes(tradesman.profession.toLowerCase()),
        );

        if (matchingTradesmen.length > 0 && from) {
          await twilioClient.sendWhatsAppMessage(
            from,
            `Glad we can help! Here are the contact details for ${matchingTradesmen.length} ${matchingTradesmen.length === 1 ? "tradesman" : "tradesmen"} you requested:`,
          );

          for (const tradesman of matchingTradesmen) {
            // save the vcard to the bucket
            const vcard = await saveVCardToR2(
              {
                fullName: tradesman.name,
                phone: tradesman.cellnumber,
                email: tradesman.email,
              },
              env,
            );
            if (vcard) {
              await twilioClient.sendWhatsAppMessage(
                from,
                "",
                `https://wildcode.ngrok.app/bucket/${vcard}`,
              );
            }
          }
          return;
        }

        return new Response(await quickReplyMessage(), { status: 200 });
      }

      if (request.method === "POST" && request.url.includes("/api/login")) {
        console.log("Login request received");
        return new Response("Login successful", { status: 200 });
      }

      if (
        request.method === "POST" &&
        request.url.includes("/api/create-user")
      ) {
        const formData = await request.formData();
        const name = formData.get("name");
        const cell = formData.get("cell") as string;

        const user = await db
          .insertInto("User")
          .values({
            name: name as string,
            cellnumber: cell,
          })
          .execute();

        if (!user) {
          return new Response("User creation failed", { status: 500 });
        }

        const referer = request.headers.get("Referer") || "/admin";
        return Response.redirect(referer, 303);
      }

      const renderPage = async (Page: any, props = {}) => {
        const rscPayloadStream = renderToRscStream(<Page {...props} />);

        if (isRSCRequest) {
          return new Response(rscPayloadStream, {
            headers: { "content-type": "text/x-component; charset=utf-8" },
          });
        }
        const [rscPayloadStream1, rscPayloadStream2] = rscPayloadStream.tee();

        const htmlStream = await transformRscToHtmlStream({
          stream: rscPayloadStream1,
          Parent: App,
        });

        const html = htmlStream.pipeThrough(
          injectRSCPayload(rscPayloadStream2),
        );
        return new Response(html, {
          headers: { "content-type": "text/html" },
        });
      };

      const pathname = new URL(request.url).pathname as keyof typeof routes;
      const Page = routes[pathname];
      if (!Page) {
        // Check if it matches the tradesmen dynamic route pattern
        const tradesmenMatch = pathname.match(/^\/tradesmen\/(.+)$/);
        const tradesmanMatch = pathname.match(/^\/tradesman\/(.+)$/);
        if (tradesmenMatch) {
          const profession = tradesmenMatch[1];
          return renderPage(routes["/tradesmen/:profession"], {
            params: { profession },
          });
        }
        if (tradesmanMatch) {
          const id = tradesmanMatch[1];
          return renderPage(routes["/tradesman/:id"], {
            params: { id: parseInt(id) },
          });
        }
        return new Response("Not found", { status: 404 });
      }

      return renderPage(Page);
    } catch (e) {
      console.error("Unhandled error", e);
      throw e;
    }
  },
};
