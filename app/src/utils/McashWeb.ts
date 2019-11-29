const McashWeb = require("mcashweb");
import {Config} from "../Config";

class _McashWeb {
    private static INSTANCE: any;

    static getInstance() {
        if (!_McashWeb.INSTANCE) {
            _McashWeb.INSTANCE = new McashWeb(Config.network);
        }
        return _McashWeb.INSTANCE;
    }
}

export const mcashWeb = _McashWeb.getInstance();
