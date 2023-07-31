require('dotenv').config();

const fs = require('fs').promises; // Use fs.promises for async/await
const { Alchemy, Network } = require("alchemy-sdk");

const filePath = process.env.ACCOUNTS_FILE;

if (!filePath) {
    console.error('Please set the ACCOUNTS_FILE environment variable.');
    process.exit(1);
}

// Configures the Alchemy SDK
const config = {
    apiKey: process.env.ALCHEMY_API_KEY, // Replace with your API key
    network: Network.ETH_MAINNET, // Replace with your network
};

// Creates an Alchemy object instance with the config to use for making requests
const alchemy = new Alchemy(config);

let tokens = new Set();
let newTokens = new Set();

const generateTokenSet = async (address, tokenSet) => {
    const balances = await alchemy.core.getTokenBalances(address);

    for (const item of balances.tokenBalances) {
        tokenSet.add(item.contractAddress);
    }
}

let occupied = false;

const main = async () => {
    occupied = true;

    try {
        // Read the JSON file using fs.promises.readFile and await it
        const data = await fs.readFile(filePath, 'utf8');
        const accounts = JSON.parse(data);

        tokens.clear();
        tokens = newTokens;
        newTokens = new Set();

        for (const key in accounts) {
            try {
                await generateTokenSet(accounts[key]["ethereum"], newTokens);
            } catch (error) {
                console.log(error);
                process.exit(1);
            }
        }

        for (const token of newTokens) {
            if (!tokens.has(token)) {
                try {
                    const metadata = await alchemy.core.getTokenMetadata(token);
                    console.log("New token:", metadata.name);
                } catch (error) {
                    console.log(error);
                    process.exit(1);
                }
            }
        }
    } catch (err) {
        console.error('Error reading or parsing the file:', err);
    }

    occupied = false;
}

alchemy.ws.on("block", async (blockNumber) => {
    if (!occupied) {
        console.log("Latest block:", blockNumber);
        await main();
    }
    else {
        console.log("(new block received in the background)");
    }
});
