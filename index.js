const SECRET = process.env.SECRET || 'my-secret';
const PORT = process.env.PORT || 3000;

const WS_STATUS_CODE_BASE = 4000;
const HTTP_OK = 200;
const HTTP_BAD_REQUEST = 400;
const HTTP_UNAUTHORIZED = 401;
const HTTP_CONFLICT = 409;
const HTTP_SERVER_ERROR = 500;
const HEADER_SECRET = 'authenticate';

let client = null;
let status = 'unknown';

const expressApp = (require('express'))();
const http = require('http');
const httpServer = http.createServer(expressApp);
const wsServer = new (require('ws').Server)({
    server: httpServer,
    perMessageDeflate: false,
    maxPayload: 512
});

expressApp.use((request, response, next) => {
    if(HEADER_SECRET in request.headers && (request.header(HEADER_SECRET) == SECRET)) {
        next();
    }
    else {
        response.status(HTTP_UNAUTHORIZED).send();
    }
});

expressApp.route('/power')
    .get((_request, response) => {
        response.json(status);
    })
    .put((request, response) => {
        const value = request.query['value'];
        if(value != 'on' && value != 'off') {
            response.status(HTTP_BAD_REQUEST).send();
        }
        else if(client == null) {
            response.status(HTTP_SERVER_ERROR).send();
        }
        else {
            if(client) {
                client.send(`power-${ value }`, {}, () => response.status(HTTP_OK).send());
            }
        }
    });

function handleMessage(ws, message) {
    if(ws == client) {
        switch(message) {
            case 'powered-on':
                status = 'on';
                break;
            case 'powered-off':
                status = 'off';
                break;
            default:
                break; // Ignore all other messages
        }
    }
    else if(message.startsWith(HEADER_SECRET) && message.split(' ')[1] == SECRET) {
        if(client && client.readyState < 2 /* Not CLOSING or CLOSED */) {
            client.close(WS_STATUS_CODE_BASE + HTTP_CONFLICT);
        }
        ws.on('close', () => { status = 'unknown'; client = null; });
        client = ws;
    }
    else {
        ws.close(WS_STATUS_CODE_BASE + HTTP_UNAUTHORIZED);
    }
}

wsServer.on('connection', (ws, _request, ..._args) => {
    ws.on('message', (message) => handleMessage(ws, message));
});

httpServer.listen(PORT, () => {
    console.log(`Server running on port ${ PORT }`);
});
