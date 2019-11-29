import {Request, Response} from "express";
import express = require("express");
import {Config} from "./Config";
import {generateAccounts, verifyAccountsBalance} from "./utils/Common";
import {mcashWeb} from "./utils/McashWeb";

export const adminRoute = express.Router();

let accounts;

function logAccount(generatedAccounts, balances) {
    console.log(`hdPath: ${generatedAccounts.hdPath}`);
    console.log(`mnemonic: ${generatedAccounts.mnemonic}`);
    console.log(`accounts: [`);
    let privateKeys = generatedAccounts.privateKeys;

    for (let i = 0; i < privateKeys.length; i++) {
        let base58 = mcashWeb.address.fromPrivateKey(privateKeys[i]);
        console.log(`\tbase58: ${base58}`);
        console.log(`\thex: ${mcashWeb.address.toHex(base58)}`);
        console.log(`\tpk: ${privateKeys[i]}`);
        console.log(`\tbalance: ${balances[i] / 1e8} MCASH`);
        console.log();
    }
    console.log(`]`);
}

function getAccountInfo(generatedAccounts, balances) {
    let ret = {};
    ret['hdPath'] = generatedAccounts.hdPath;
    ret['mnemonic'] = generatedAccounts.mnemonic;
    ret['accounts'] = [];
    let privateKeys = generatedAccounts.privateKeys;

    for (let i = 0; i < privateKeys.length; i++) {
        let base58 = mcashWeb.address.fromPrivateKey(privateKeys[i]);
        let account = {};
        account['base58'] = base58;
        account['hex'] = mcashWeb.address.toHex(base58);
        account['pk'] = privateKeys[i];
        account['balance'] = balances[i] / 1e8;
        ret['accounts'].push(account);
    }
    return ret;
}

adminRoute.get('/accounts', async function (req: Request, res: Response) {
    let options = Config.options;
    try {
        let balances = await verifyAccountsBalance(accounts, options.defaultBalance);
        let accountInfos = getAccountInfo(accounts, balances);
        console.log(accountInfos);
        res.status(200);
        res.json({status: true, data: accountInfos});
    } catch (e) {
        res.status(400);
        console.error(e);
        res.json({status: false, message: e});
    }
});

adminRoute.get('/generate', async function (req: Request, res: Response) {
    let options = Config.options;
    try {
        accounts = await generateAccounts(options);
        let balances = await verifyAccountsBalance(accounts, options.defaultBalance);
        let accountInfos = getAccountInfo(accounts, balances);
        console.log(accountInfos);
        res.status(200);
        res.json({status: true});
    } catch (e) {
        res.status(400);
        console.error(e);
        res.json({status: false, message: e});
    }
});
