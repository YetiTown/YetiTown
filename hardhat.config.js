require("@nomiclabs/hardhat-waffle");
require('hardhat-contract-sizer');
require('dotenv').config({ path: '.env' })
require("@nomiclabs/hardhat-etherscan");
require('hardhat-contract-sizer');
// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    version: "0.8.7",
    settings: {
      optimizer: {
        enabled: true,
        runs: 100
      }
    }
  },
  networks: {
    hardhat: {
      chainId: 1337
    },
    rinkeby: {
      url: `https://rinkeby.infura.io/v3/${process.env.RINKEBY_API_KEY}`,
      accounts: [`${process.env.PRIVATE_KEY}`],
    },
    mainnet: {
      url: `https://mainnet.infura.io/v3/${process.env.MAINNET_API_KEY}`,
      accounts: [`${process.env.MAINNET_PRIVATE_KEY}`],
      blockGasLimit: 100000000429720 // whatever you want here
    }
  },
  etherscan: {
    apiKey: {
      rinkeby: `${process.env.ETHERSCAN_API_KEY}`,
      mainnet: `${process.env.ETHERSCAN_API_KEY}`
    }
  }
};
