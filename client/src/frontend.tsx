/**
 * This file is the entry point for the React app, it sets up the root
 * element and renders the App component to the DOM.
 *
 * It is included in `src/index.html`.
 */

import { StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import App from "./App";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";

const elem = document.getElementById("root")!;
const app = (
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);

// Persist the React root across HMR so state isn't wiped on every edit.
// Guard `import.meta.hot` so a production build (where it's undefined) and any
// reload edge case can't throw and leave a blank white page.
const hot = (import.meta as any).hot;
if (hot) {
  (hot.data.root ??= createRoot(elem)).render(app);
} else {
  let root: Root | undefined = (window as any).__dn_root;
  if (!root) { root = createRoot(elem); (window as any).__dn_root = root; }
  root.render(app);
}
