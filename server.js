const cpen322 = require('./cpen322-tester.js');
const path = require('path');
const fs = require('fs');
const express = require('express');
const ws = require('ws');
const Database = require('./Database')
const SessionManager = require('./SessionManager');
const crypto = require('crypto');

// let mongoUrl = 'mongodb://localhost:27017'; 
let mongoUrl = 'mongodb://127.0.0.1:27017';
let dbName = 'cpen322-messenger';
let db = new Database(mongoUrl, dbName);
const sessionManager = new SessionManager();

let messages = {};
let messageBlockSize = 10; // 

db.getRooms().then(rooms => {
	for (let room of rooms) {
	  	messages[room._id] = [];
	}
});



const host = 'localhost';
const port = 3000; 
const clientApp = path.join(__dirname, 'client');

const broker = new ws.Server({port: 8000});

broker.on('connection', function connection(ws, incoming) {

    let successParse = true;
	let cookieObj = ""

	if(incoming.headers.cookie == null){
		ws.close();
	}
	try{
		 cookieObj = parseCookie(incoming.headers.cookie.toString());
	} catch (error) {
		successParse = false;
		ws.close();
	}
	if(successParse && sessionManager.getUsername(cookieObj[`cpen322-session`]) == null){
		ws.close();
	}


	ws.on('message', (data) => {
        let parsedData = JSON.parse(data.data);
        // Overwrite the username field with the username associated with the socket's session

        parsed.username = sessionManager.getUsername(cookieObj[`cpen322-session`]);

        

        messages[parsedData.roomId].push({
            username: parsedData.username,
            text: parsedData.text
        });


        for (let client of broker.clients) {
            if (client !== ws) {
                client.send(JSON.stringify(parsedData));
            }
        }



        if (messages[parsedData.roomId].length === messageBlockSize) {
            // Create a new conversation object
            const conversation = {
                room_id: parsedData.roomId,
                timestamp: Date.now(), // UNIX time in milliseconds
                messages: messages[parsedData.roomId]
            };

            // Add the new conversation to the database
            db.addConversation(conversation)
                .then(() => {
                    // successfully save conversation into the database, empty the messages array
                    messages[parsedData.roomId] = [];
                })
                .catch((error) => {
                    console.error("Error saving Conversation to the database:", error);
                });
        }
    });

});

// express app
let app = express();
app.use(express.json()) 						// to parse application/json
app.use(express.urlencoded({ extended: true })) // to parse application/x-www-form-urlencoded
app.use(logRequest);

function logRequest(req, res, next) {
	console.log(`${new Date()}  ${req.ip} : ${req.method} ${req.path}`);
	next();
}

app.listen(port, () => {
	console.log(`${new Date()}  App Started. Listening on ${host}:${port}, serving ${clientApp}`);
});
  

  



  app.get("/chat/:room_id/messages", sessionManager.middleware, (req, res) =>{
	let rmId = req.params.room_id.toString();
	let time = parseInt(req.query.before);


	db.getLastConversation(rmId, time).then((convo) =>{
		if(convo != null){
			res.status(200).send(convo);
		} else {
			res.status(401).send("");
		}
	})
});



  app.get("/chat/:room_id", sessionManager.middleware, (req, res) =>{
	let rmId = req.params.room_id;

	db.getRoom(rmId).then((room) => {
		if(room != null){
			res.status(200).send(room);
		}
		else{
			res.status(401).send("Room " + rmId + " was not found");
		}
	});
});


    app.get('/chat', sessionManager.middleware, (req, res) => {
        let result = [];

        if(req.greatSuccess == false){
            res.status(401).send("not authenticated");
            return;
        }

        db.getRooms().then((fetchedRooms) => {
            for(let q = 0; q < fetchedRooms.length; q++){
                let room = {
                    _id: fetchedRooms[q]._id,
                    name: fetchedRooms[q].name,
                    image: fetchedRooms[q].image,
                    messages: messages[fetchedRooms[q]._id]
                }
                result.push(room);
            }
            res.status(200).send(result);
        });
    })

    app.get("/profile", sessionManager.middleware, (req, res) =>{
        res.status(200).send({"username": req.username});
    });

    app.use("/app.js", sessionManager.middleware);
    app.use("/index.html", sessionManager.middleware);
    app.use("/index", sessionManager.middleware);
  
 



    app.get("/", sessionManager.middleware, (req, res) =>{
        res.status(200).send();
        res.redirect("/login");
    });

  app.post('/chat', sessionManager.middleware, (req, res) =>{
	let request = req.body;
	if("name" in request && request.name.trim()){
		let uniqueID = request.name;
		while(uniqueID in messages){
			uniqueID = request.name;
			uniqueID += Date.now();
		}

		let room = {
			_id: uniqueID,
			name: request.name,
			image: request.image
		}

	
		db.addRoom(room).then((addedroom) =>{
			messages[addedroom._id] = [];
			res.status(200).send(JSON.stringify(addedroom));
		});
		return;
		
	} 
	else{
		res.status(400).send("malformed request");
		return;
	}
})


  

  
app.get("/logout", (req, res) =>{
	sessionManager.deleteSession(req);
	res.redirect("/login");
});
  
  
app.post('/login', (req, res) =>{
	let user = req.body.username;
	
	if(user == null){
		// res.redirect('/login');
		res.send();
	}
	else {
		db.getUser(user).then((userdoc) => {
			if(userdoc == null){
				res.redirect("/login");
				res.send();
			}
			//compute password
			else if (!isCorrectPassword(req.body.password, userdoc.password)){
				res.redirect("/login");
				res.send();
			}
			else {
				sessionManager.createSession(res, user);
				res.redirect("/");
				res.send();
			}
		})
	}
})


app.use('/', express.static(clientApp, { extensions: ['html'] }));


app.use('/login', express.static(clientApp+'/login.html', { extensions: ['html'] }));
  
function isCorrectPassword(password, saltedHash) {
    let salt = saltedHash.substring(0, 20)
    let base64Hash = saltedHash.substring(20)
    let saltedPassword = password + salt
    let encryptedPassword = crypto.createHash('sha256').update(saltedPassword).digest('base64')
    return encryptedPassword === base64Hash
  }

app.use((err, req, res, next) => {
    // Check if the error is a SessionError instance
    if (err instanceof SessionManager.Error) {
        // Check the Accept header for content negotiation
        const acceptHeader = req.get('Accept');

        if (acceptHeader && acceptHeader.includes('application/json')) {
            // If Accept header specifies application/json, respond with HTTP 401 and error message
            res.status(401).json({ error: err.message });
        } else {
            // Otherwise, redirect to the /login page
            res.redirect('/login');
        }
    } else {
        // If the error is not a SessionError object, return HTTP 500
        res.status(500).send('Internal Server Error');
    }
});

cpen322.connect('http://3.98.223.41/cpen322/test-a5-server.js');
cpen322.export(__filename, { app, db, messages, messageBlockSize, sessionManager, isCorrectPassword });