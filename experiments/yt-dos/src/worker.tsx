import { defineApp } from '@redwoodjs/sdk/worker';
import { index, layout, route } from '@redwoodjs/sdk/router';
import { Document } from 'src/Document';
import { HomePage } from 'src/pages/Home';
import { fetchYoutubeVideos } from 'src/pages/serverFunctions';
type Context = {
  YT_API_KEY: string;
}


export default defineApp<Context>([
  ({ ctx }) => {
    // setup ctx here
    ctx;
  },
  // @ts-ignore
  layout(Document, [
    index([
      HomePage,
    ]),
    route('/search', async ({ request, env }) => {
      const API_KEY = env.YT_API_KEY;
      
      // Get the origin of the request
      const origin = request.headers.get('Origin') || '';
      const host = request.headers.get('Host') || '';
      
      // Determine if the request is from an allowed origin
      const isAllowedOrigin = !origin || origin.includes(host) || origin.includes('localhost');
      
      // Handle preflight OPTIONS request
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 204,
          headers: {
            'Access-Control-Allow-Origin': isAllowedOrigin ? origin : '',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '86400', // 24 hours
          },
        });
      }
      
      // If not an allowed origin, reject the request
      if (!isAllowedOrigin) {
        return new Response(JSON.stringify({ error: 'Cross-origin requests are not allowed' }), { 
          status: 403,
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }
      
      if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
          status: 405,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': isAllowedOrigin ? origin : '',
          }
        });
      }

      try {
        const body = await request.json() as { searchTerm: string; pageToken?: string };
        const results = await fetchYoutubeVideos(body.searchTerm, API_KEY, body.pageToken);
        
        return new Response(JSON.stringify(results), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': isAllowedOrigin ? origin : '',
            'Access-Control-Allow-Credentials': 'true',
          },
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: 'Invalid request' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': isAllowedOrigin ? origin : '',
          },
        });
      }
    }),
  ]),
])