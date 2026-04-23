import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import axios from "axios";
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const app = new Hono();

// Enable CORS for Jotform
app.use("/*", cors({
  origin: "*",
  allowMethods: ["GET", "POST", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
}));

// --- SIMPLE OAUTH2 FLOW (MOCK) ---
const VALID_CLIENT_ID = process.env.CLIENT_ID || "nova_client";
const VALID_CLIENT_SECRET = process.env.CLIENT_SECRET || "nova_secret";

app.get("/authorize", (c) => {
  const redirectUri = c.req.query("redirect_uri");
  const state = c.req.query("state");
  // Simple redirect back with a mock code
  return c.redirect(`${redirectUri}?code=mock_code&state=${state}`);
});

app.post("/token", async (c) => {
  const body = await c.req.parseBody();
  const { client_id, client_secret, code } = body;

  if (client_id === VALID_CLIENT_ID && client_secret === VALID_CLIENT_SECRET) {
    return c.json({
      access_token: "mock_access_token_" + Date.now(),
      token_type: "Bearer",
      expires_in: 3600
    });
  }
  return c.json({ error: "invalid_client" }, 401);
});

// --- MCP SERVER SETUP ---
const mcpServer = new Server(
  {
    name: "nova-stream-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";

// --- SUPABASE SETUP ---
const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// --- TOOLS ---
mcpServer.setRequestHandler(
  ListToolsRequestSchema,
  async () => ({
    tools: [
      {
        name: "get_live_matches",
        description: "Get currently live sports matches from Nova Stream",
        inputSchema: {
          type: "object",
          properties: {
            sport: { type: "string", description: "Filter by sport (optional)" }
          }
        }
      },
      {
        name: "get_trending_content",
        description: "Get top trending movies and series",
        inputSchema: {
          type: "object",
          properties: {}
        }
      },
      {
        name: "get_user_watchlist",
        description: "Get the watchlist for a specific user by email",
        inputSchema: {
          type: "object",
          properties: {
            email: { type: "string", description: "User's email address" }
          },
          required: ["email"]
        }
      }
    ],
  })
);

mcpServer.setRequestHandler(
  CallToolRequestSchema,
  async (request: any) => {
    const { name, arguments: args } = request.params;

    if (name === "get_live_matches") {
      try {
        const backendUrl = process.env.NOVA_BACKEND_URL || "http://localhost:3030";
        const response = await axios.get(`${backendUrl}/api/sports/matches/live`);
        return {
          content: [{ type: "text", text: JSON.stringify(response.data) }]
        };
      } catch (e) {
        return { content: [{ type: "text", text: "Failed to fetch live matches." }], isError: true };
      }
    }

    if (name === "get_trending_content") {
      try {
        const backendUrl = process.env.NOVA_BACKEND_URL || "http://localhost:3030";
        const response = await axios.get(`${backendUrl}/api/tmdb/trending/all/day`);
        return {
          content: [{ type: "text", text: JSON.stringify(response.data.results.slice(0, 5)) }]
        };
      } catch (e) {
        return { content: [{ type: "text", text: "Failed to fetch trending content." }], isError: true };
      }
    }

    if (name === "get_user_watchlist") {
      try {
        // 1. Get user profile ID from email
        const { data: profile, error: pError } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', args.email)
          .single();

        if (pError || !profile) {
          return { content: [{ type: "text", text: `User with email ${args.email} not found.` }] };
        }

        // 2. Get watchlist for that profile
        const { data: watchlist, error: wError } = await supabase
          .from('watchlist')
          .select('title, content_type')
          .eq('user_id', profile.id);

        if (wError) throw wError;

        return {
          content: [{ type: "text", text: `Watchlist for ${args.email}: ${JSON.stringify(watchlist)}` }]
        };
      } catch (e: any) {
        return { content: [{ type: "text", text: `Error fetching watchlist: ${e.message}` }], isError: true };
      }
    }

    throw new Error(`Tool not found: ${name}`);
  }
);

// --- SSE TRANSPORT ---
let transport: SSEServerTransport | null = null;

app.get("/sse", async (c) => {
  transport = new SSEServerTransport("/messages", c.res as any);
  await mcpServer.connect(transport);
  
  // Return a generic response (SDK handles SSE headers)
  return new Response(null, { status: 200 });
});

app.post("/messages", async (c) => {
  if (transport) {
    await transport.handlePostMessage(c.req as any, c.res as any);
    return c.json({ success: true });
  }
  return c.json({ error: "No active transport" }, 400);
});

import { handle } from 'hono/netlify'

// Export for Netlify Functions
export const handler = handle(app);

// Local testing
if (process.env.NODE_ENV !== 'production') {
  const port = 4000;
  console.log(`Local MCP Server running at http://localhost:${port}`);
  serve({ fetch: app.fetch, port });
}

