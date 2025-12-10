'use client';

import { createNetworkConfig, IotaClientProvider, WalletProvider } from '@iota/dapp-kit';
import { getFullnodeUrl } from '@iota/iota-sdk/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@iota/dapp-kit/dist/index.css';
import { ReactNode } from 'react';

const { networkConfig } = createNetworkConfig({
	testnet: { url: getFullnodeUrl('testnet') },
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: ReactNode }) {
	return (
		<QueryClientProvider client={queryClient}>
			<IotaClientProvider networks={networkConfig} defaultNetwork="testnet">
				<WalletProvider>
					{children}
				</WalletProvider>
			</IotaClientProvider>
		</QueryClientProvider>
	);
}