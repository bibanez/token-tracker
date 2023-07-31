# Token tracker

This utility tracks changes in the tokens owned by a list of accounts. To let you keep track of these changes, it drives a Telegram bot.

## Setup

### Requirements

- Node.js
- An api key for [Alchemy](https://docs.alchemy.com/reference/api-overview)
- A list of accounts to track. Eg.:

```json
{
    "Account 1": {
        "ethereum": "0xabc...89"
    },
    "Account 2": {
        "ethereum": "0x123...yz"
    }
}
```

> Currently only the Ethereum chain is supported.

### Install
```
$ npm install
$ echo "ACCOUNTS_FILE=/path/to/your/accounts.json" >> .env
$ echo "ALCHEMY_API_KEY=YOUR_API_KEY" >> .env
```

### Run
```
$ npm run start
```