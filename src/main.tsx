import { createRoot } from "react-dom/client";
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { config } from './lib/wagmi';
import App from "./App.tsx";
import "./index.css";

const queryClient = new QueryClient();

// TON Connect manifest URL
const manifestUrl = `${window.location.origin}/tonconnect-manifest.json`;

createRoot(document.getElementById("root")!).render(
  <TonConnectUIProvider manifestUrl={manifestUrl}>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </WagmiProvider>
  </TonConnectUIProvider>
);
