import { serve } from "bun";
import index from "./index.html";

const server = serve({
  routes: {
    "/*": index,

    "/api/hello": {
      async GET() { return Response.json({ message: "Hello, world!", method: "GET" }); },
      async PUT() { return Response.json({ message: "Hello, world!", method: "PUT" }); },
    },

    "/api/hello/:name": async req =>
      Response.json({ message: `Hello, ${req.params.name}!` }),
  },

  development: process.env.NODE_ENV !== "production" && {
    hmr: true,
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
