import {mcashWeb} from "./McashWeb";
import * as path from "path";
import * as fs from "fs-extra";

const seedrandom = require("seedrandom");
const bip39 = require("bip39");
const hdkey = require("ethereumjs-wallet/hdkey");
const randomstring = require("randomstring");

export function sleep(millis) {
    return new Promise(resolve => setTimeout(resolve, millis));
}

export async function generateAccounts(options) {
    console.log(options);
    const tmpDir = '/mcash';
    const jsonPath = path.join(tmpDir, 'accounts.json');

    let accounts;

    if (fs.existsSync(jsonPath)) {
        accounts = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

        if (Array.isArray(accounts)) {
            accounts = {
                privateKeys: accounts
            };
        } else if (typeof accounts !== 'object') {
            accounts = null;
        }
    }

    if (!accounts || options.addAccounts) {
        const newAccounts = await deriveAccounts(options);

        if (!accounts) {
            accounts = newAccounts;
            accounts.more = [];
        } else {
            accounts.more.push(newAccounts);
        }
        if (!options.addAccounts) {
            fs.ensureDirSync(tmpDir);
            fs.writeFileSync(path.join(tmpDir, 'accounts.json'), JSON.stringify(accounts, null, 2));
        }
    }

    return accounts;

}

async function deriveAccounts(options) {

    if (options.addAccounts) {
        for (let key of 'mnemonic,seed'.split(',')) {
            delete options[key];
        }
    }
    const totalAccounts = parseInt(options.accounts);

    const hdPath = options.hdPath;

    let seed = options.seed;
    let mnemonic = options.mnemonic;

    if (!mnemonic) {
        seed = seed || randomstring.generate({
            length: 10,
            charset: 'alphanumeric',
        });
        mnemonic = options.mnemonic || bip39.entropyToMnemonic(randomBytes(16, seedrandom(seed)).toString("hex"));
    }

    const wallet = hdkey.fromMasterSeed(await bip39.mnemonicToSeed(mnemonic));

    const privateKeys = [];

    for (let i = 0; i < totalAccounts; i++) {
        let acct = wallet.derivePath(hdPath + i);
        let privateKey = acct.getWallet().getPrivateKey().toString('hex');
        privateKeys.push(privateKey);
    }

    return {
        hdPath,
        mnemonic,
        privateKeys
    };
}


export async function verifyAccountsBalance(generatedAccounts, amount) {
    console.log("...\nLoading the accounts...");
    let tried = 0;
    let delay = 1000;
    while (!await mcashWeb.fullNode.isConnected()) {
        console.log(`Could not connect to fullnode, try again after ${delay} s`);
        await sleep(delay);
        delay *= 2;
        tried++;
        if (tried > 5) {
            throw new Error("Could not connect to fullnode");
        }
    }

    const balances = [];
    let ready = 0;
    let count = 1;
    let accounts = !generatedAccounts.more.length ? generatedAccounts : generatedAccounts.more[generatedAccounts.more.length - 1];
    let privateKeys = accounts.privateKeys;

    while (true) {
        console.log(`(${count++}) Waiting for receipts...`);
        for (let i = 0; i < privateKeys.length; i++) {
            let address = mcashWeb.address.fromPrivateKey(privateKeys[i]);
            let balance = await mcashWeb.mcash.getBalance(address);
            if (balance > 0) {
                balances[i] = balance;
                ready++;
            } else if (privateKeys[i] !== mcashWeb.defaultPrivateKey) {
                let result = await mcashWeb.mcash.sendTransaction(address, amount * 1e8);
                if (result.result) {
                    console.log(`Sending ${amount} MCASH to ${address}`);
                }
            }
        }
        if (ready < privateKeys.length)
            await sleep(3000);
        else break;
    }
    console.log('Done.');
    return balances;
}

function randomBytes(length, rng) {
    let buf = [];

    for (let i = 0; i < length; i++) {
        buf.push(rng() * 255);
    }

    return Buffer.from(buf);
}
