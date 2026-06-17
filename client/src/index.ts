import { serve } from "bun";
import index from "./index.html";

const server = serve({
  port: parseInt(process.env.PORT ?? "3000"),
  routes: {
    "/*": index,
  },
  development: process.env.NODE_ENV !== "production" && {
    hmr: true,
    console: true,
  },
});

console.log(`Client running at ${server.url}`);
