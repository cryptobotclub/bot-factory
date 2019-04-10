import exec from './runner';

const fs = require('fs');
const jsonServer = require("json-server");
const bodyParser = require('body-parser');

const path = require("path");

const server = jsonServer.create();
server.use(bodyParser.json())

const middlewares = jsonServer.defaults({
    static: path.join(__dirname, "build")
});
  




var running = false;

function execBot(botSettings, datafeedSettings, positionSettings) {

    let bot = botSettings.botId;
    let filename = "bots/"+bot+".js"

    return new Promise((resolve, reject) => {

        fs.readFile(filename, "utf8", function(err, code) {
            
            console.log("running: ", filename);

            if (err) throw err;
            if (!running) {
                running = true;
                try {
                    exec(code, botSettings, datafeedSettings, positionSettings).then(output => {
                        console.log("trades: ", output.positions.length);
                        running = false;
                        resolve(output);
                        
                    }).catch(error => {
                        console.log("bot error: ", error)
                        running = false;
                        reject(error);
                    });

                } catch(error) {
                    console.log("exec error: ", error)
                    running = false;
                    reject(error);
                }

            } else {
                console.log("already running..");
            }
        });
    })

}



server.get("/allbots", function(req, res) {

    let files = fs.readdirSync("./bots");
 
    var names = []
    files.forEach(file => {
        names.push(file.substring(0, file.indexOf('.')))
    });

    console.log("GET", req.originalUrl, files);
    res.statusCode = 200;
    res.setHeader("Access-Control-Allow-Origin", "*");
    
    res.json({ 
        status: 'OK',
        response: names,
    })
});





server.post("/exec", function(req, res) {
    
  
    let body = req.body;
   
    let {botSettings, datafeedSettings, positionSettings} = body;

    console.log("/exec", botSettings, datafeedSettings, positionSettings);

    execBot(botSettings, datafeedSettings, positionSettings).then( response => {
        
        console.log("/exec OK");
        res.statusCode = 200;
        res.setHeader("Access-Control-Allow-Origin", "*");        
        res.json({ 
            status: 'OK',
            response,
        })

    }).catch (error => {

        console.log("/exec ERROR", "error: ", error);
        res.statusCode = 422;
        res.setHeader("Access-Control-Allow-Origin", "*");        
        res.json({ 
            status: 'ERROR',
            error: error.toString(),
        })
    })


  }
);



server.use(middlewares);

server.get('*', function(req, res){
    res.sendFile(__dirname + '/build/index.html');
});

process.on('uncaughtException', function (err) {
    console.log("uncaughtException:", err);
}); 




const port = process.env.PORT || 3030;
server.listen(port, () => {
    console.log(`Bot Playground started  on port ${port}`);
});
