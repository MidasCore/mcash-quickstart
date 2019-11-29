require('dotenv').config();

export const Config = {
    network: {
        privateKey: "29e2e0f061bd50f16e777e4c31af80dd7f32727dafad6c89d29d4211911bc66f",
        fullNode: "http://127.0.0.1:8090",
        solidityNode: "http://127.0.0.1:8091",
    },
    options: {
        showBody: process.env.showBody || true,
        showQueryString: process.env.showQueryString || true,
        verbose: process.env.verbose || true,
        quiet: process.env.quiet || false,
        useDefaultPrivateKey: process.env.useDefaultPrivateKey || false,
        accounts: process.env.accounts || 10,
        mnemonic: process.env.mnemonic,
        hdPath: process.env.hdPath || "m/44'/60'/0'/0/",
        seed: process.env.seed,
        addAccounts: process.env.addAccounts,
        formatJson: process.env.formatJson || true,
        defaultBalance: process.env.defaultBalance || 10000,
    },
};


