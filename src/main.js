require('dotenv').config();

const fs = require('fs').promises; // Use fs.promises for async/await
const { Alchemy, Network } = require("alchemy-sdk");

// Configures the Alchemy SDK
const config = {
    apiKey: process.env.ALCHEMY_API_KEY, // Replace with your API key
    network: Network.ETH_MAINNET, // Replace with your network
};

// Creates an Alchemy object instance with the config to use for making requests
const alchemy = new Alchemy(config);

const filePath = process.env.ACCOUNTS_FILE;

if (!filePath) {
    console.error('Please set the ACCOUNTS_FILE environment variable.');
    process.exit(1);
}

const getTokenBalances = async (address) => {
    const balances = await alchemy.core.getTokenBalances(address);
    console.log(`The balances of ${address} address are:`, balances);
}

const main = async () => {
    try {
        // Read the JSON file using fs.promises.readFile and await it
        const data = await fs.readFile(filePath, 'utf8');
        const accounts = JSON.parse(data);

        for (const key in accounts) {
            try {
                await getTokenBalances(accounts[key]["ethereum"]);
            } catch (error) {
                console.log(error);
            }
        }
    } catch (err) {
        console.error('Error reading or parsing the file:', err);
    }
}

alchemy.ws.on("block", async (blockNumber) => {
    console.log("Latest block:", blockNumber);
    await main();
});
