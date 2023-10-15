import { ParticleNetwork, WalletEntryPosition } from '@particle-network/auth';
import { ParticleProvider } from '@particle-network/provider';
import React from 'react';

import './App.scss';

// import { SystemCall } from '../types';
// import { ethers } from 'ethers';

const App: React.FC = () => {
    React.useEffect(() => {
        connect();
    });

    const connect = async () => {
        const particle = new ParticleNetwork({
            projectId: '12a93f47-6f21-4e4e-888b-9a4b57933c86',
            clientKey: 'cMIDP67n1NvlnlOoiG7CLSfvpwRrTaJZQJJKkZJ1',
            appId: 'bc6dab3a-9da1-4324-9e71-8f879de9d7b4',
            chainName: 'polygon', //optional: current chain name, default Ethereum.
            chainId: 137, //optional: current chain id, default 1.
            wallet: {
                //optional: by default, the wallet entry is displayed in the bottom right corner of the webpage.
                displayWalletEntry: true, //show wallet entry when connect particle.
                defaultWalletEntryPosition: WalletEntryPosition.BR, //wallet entry position
                uiMode: 'dark', //optional: light or dark, if not set, the default is the same as web auth.
                supportChains: [
                    { id: 137, name: 'polygon' },
                    { id: 80001, name: 'polygon' },
                ], // optional: web wallet support chains.
                customStyle: {}, //optional: custom wallet style
            },
        });

        const particleProvider = new ParticleProvider(particle.auth);
        await particleProvider.enable();
        console.log('particleProvider after enable:', particleProvider);
        // const web3Provider = new ethers.providers.Web3Provider(particleProvider, 'any');
    };

    return <div className="app"></div>;
};

export default App;
