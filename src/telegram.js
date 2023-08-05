require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const fs = require('fs').promises; // Use fs.promises for async/await
const { Alchemy, Network } = require("alchemy-sdk");

let missing_env = false;
if (!process.env.ACCOUNTS_FILE) {
    console.error('Please set the ACCOUNTS_FILE environment variable.');
    missing_env = true;
}
if (!process.env.ALCHEMY_API_KEY) {
    console.error('Please set the ALCHEMY_API_KEY environment variable.')
    missing_env = true;
}
if (!process.env.TELEGRAM_TOKEN) {
    console.error('Please set the TELEGRAM_TOKEN environment variable.')
    missing_env = true;
}
if (missing_env) {
    console.error('You can add them by editing .env in the current folder.')
    process.exit(1);
}

const filePath = process.env.ACCOUNTS_FILE;
const token = process.env.TELEGRAM_TOKEN;

// Configures the Alchemy SDK
const config = {
    apiKey: process.env.ALCHEMY_API_KEY, // Replace with your API key
    network: Network.ETH_MAINNET, // Replace with your network
};

const bot = new TelegramBot(token, {polling: true});

let chatIds = new Set();

bot.on('message', (msg) => {
  if (msg.text == '/start') {
    const chatId = msg.chat.id;
    const resp = "You have registered correctly for Token Tracker";

    chatIds.add(chatId);
    console.log("New chat registered:", chatId);

    bot.sendMessage(chatId, resp);
  }
});


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
    let reply = "";

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
                    reply += `+ ${metadata.name} (${metadata.symbol})\n`; 
                } catch (error) {
                    console.log(error);
                    process.exit(1);
                }
            }
        }
        for (const token of tokens) {
            if (!newTokens.has(token)) {
                try {
                    const metadata = await alchemy.core.getTokenMetadata(token);
                    reply += `- ${metadata.name} (${metadata.symbol})\n`; 
                } catch (error) {
                    console.log(error);
                    process.exit(1);
                }
            }
        }
        if (reply != "") {
            chatIds.forEach((chatId) => {
                bot.sendMessage(chatId, reply);
            });
            console.log(reply);
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
