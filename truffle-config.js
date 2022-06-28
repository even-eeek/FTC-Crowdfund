require('babel-register');
require('babel-polyfill');
require('dotenv').config();
const HDWalletProvider = require('@truffle/hdwallet-provider');

var mnemonic = '';

module.exports = {
  networks: {

    bsc: {
      //https://speedy-nodes-nyc.moralis.io/0eda99aaac6754efba79817e/bsc/mainnet
      // https://bsc-dataseed.binance.org/
     provider: () => new HDWalletProvider(mnemonic, 'https://speedy-nodes-nyc.moralis.io/0eda99aaac6754efba79817e/bsc/mainnet'),
     network_id: 56,
     gas: 6721975,
     gasPrice: 25000000000,
    //  timeoutBlocks: 200,
     skipDryRun: true,
     networkCheckTimeout: 1000000,
    //  confirmations: 10
   },
   testnet: {
     provider: () => new HDWalletProvider(mnemonic, `https://speedy-nodes-nyc.moralis.io/0eda99aaac6754efba79817e/bsc/testnet`),
     network_id: 97,
     gas: 6721975,
     gasPrice: 25000000000,
     skipDryRun: true,
     networkCheckTimeout: 1000000,
    //  timeoutBlocks: 200,
   },
    development: {
      host: 'testnet',
      port: 8545,
      gas: 6721975,
      gasPrice: 25000000000,
      network_id: '*',
    },
    ganache: {
      host: 'localhost',
      port: 8545,
      gas: 6721975,
      gasPrice: 25000000000,
      network_id: '*',
    },
    ropsten: {
      provider: function() {
        return new HDWalletProvider(
          mnemonics,
          `https://ropsten.infura.io/${process.env.INFURA_API_KEY}`
        )
      },
      gas: 5000000,
      gasPrice: 25000000000,
      network_id: 3
    }
  },
  compilers: {
    solc: {
      version: "^0.8.0",
    }
  },
  mocha: {
    reporter: 'eth-gas-reporter'
  },
  plugins: ["solidity-coverage", "truffle-flatten"],
  solc: {
    optimizer: {
      enabled: true,
      runs: 200
    }
  }
};
