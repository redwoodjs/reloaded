// Generated by Wrangler by running `wrangler types`

interface Env {
	SECRET_KEY: "secret";
	RESEND_API_KEY: "re_YrHsLhez_BHBHjQTvYUH6HPtJdHkWSyq6";
	APP_URL: "http://localhost:5173";
	SESSION_DO: DurableObjectNamespace<import("./src/worker").SessionDO>;
	R2: R2Bucket;
	DB: D1Database;
	ASSETS: Fetcher;
}
