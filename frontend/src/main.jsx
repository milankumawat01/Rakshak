import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "./lib/auth";
import { PendingFileProvider } from "./lib/pendingFile";
import { I18nProvider } from "./lib/i18n";
import App from "./App";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

const rootElement = document.getElementById("root");

const app = (
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <HelmetProvider>
          <PendingFileProvider>
          <AuthProvider>
            <I18nProvider>
              <App />
              <Toaster
                position="top-right"
                toastOptions={{
                  style: { background: "#FFFFFF", color: "#1A1A1A", border: "1px solid #E5E0DB" },
                }}
              />
            </I18nProvider>
          </AuthProvider>
          </PendingFileProvider>
        </HelmetProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>
);

if (rootElement.hasChildNodes()) {
  hydrateRoot(rootElement, app);
} else {
  createRoot(rootElement).render(app);
}
