// Wallet Connection Module
class WalletManager {
    constructor() {
        this.web3 = null;
        this.wallet = null;
        this.connected = false;
        
        // Polygon Amoy Testnet Configuration
        this.POLYGON_CONFIG = {
            chainId: '0x13882',
            chainName: 'Polygon Amoy Testnet',
            nativeCurrency: {
                name: 'MATIC',
                symbol: 'MATIC',
                decimals: 18
            },
            rpcUrls: ['https://rpc-amoy.polygon.technology/'],
            blockExplorerUrls: ['https://amoy.polygonscan.com/']
        };
    }

    async connectWallet() {
        if (typeof window.ethereum !== 'undefined') {
            try {
                document.getElementById('walletStatus').innerHTML = 'Connecting...';
                
                const web3 = new Web3(window.ethereum);
                const accounts = await window.ethereum.request({ 
                    method: 'eth_requestAccounts' 
                });

                // Switch to Polygon Amoy
                await this.switchToAmoy();

                this.web3 = web3;
                this.wallet = accounts[0];
                this.connected = true;
                
                document.getElementById('walletStatus').innerHTML = 
                    `✅ Connected: ${accounts[0].slice(0,6)}...${accounts[0].slice(-4)}`;
                
                // Initialize player data
                gameState.player.id = accounts[0].slice(-8);
                gameState.player.name = `Warrior_${accounts[0].slice(-4)}`;
                
                this.showGameInterface();
                return true;

            } catch (error) {
                document.getElementById('walletStatus').innerHTML = '❌ Connection failed';
                console.error('Wallet connection error:', error);
                return false;
            }
        } else {
            document.getElementById('walletStatus').innerHTML = '❌ MetaMask not detected';
            return false;
        }
    }

    async switchToAmoy() {
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: this.POLYGON_CONFIG.chainId }],
            });
        } catch (switchError) {
            if (switchError.code === 4902) {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [this.POLYGON_CONFIG],
                });
            }
        }
    }

    showGameInterface() {
        setTimeout(() => {
            document.getElementById('walletOverlay').style.display = 'none';
            document.getElementById('loading').style.display = 'block';
            
            setTimeout(() => {
                document.getElementById('loading').style.display = 'none';
                document.getElementById('gameContainer').style.display = 'block';
                gameManager.startGame();
            }, 2000);
        }, 1000);
    }

    getWalletAddress() {
        return this.wallet;
    }

    isConnected() {
        return this.connected;
    }
}

// Global wallet manager instance
const walletManager = new WalletManager();

// Global function for HTML onclick
function connectWallet() {
    walletManager.connectWallet();
}
