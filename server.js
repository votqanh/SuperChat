const cpen322 = require('./cpen322-tester.js');
const path = require('path');
const fs = require('fs');
const express = require('express');
const ws = require('ws');
const Database = require('./Database')
const SessionManager = require('./SessionManager');
const crypto = require('crypto');

let mongoUrl = 'mongodb://localhost:27017'; // 'mongodb://localhost:27017' makes connection error
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

function logRequest(req, res, next) {
	console.log(`${new Date()}  ${req.ip} : ${req.method} ${req.path}`);
	next();
}

const host = 'localhost';
const port = 3000; 
const clientApp = path.join(__dirname, 'client');

const broker = new ws.Server({port: 8000});

broker.on('connection', (ws) => {
	ws.on('message', (data) => {

	  	let parsedData = JSON.parse(data);

	  	messages[parsedData.roomId].push({
			username: parsedData.username,
      		text: parsedData.text
	  	})

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
app.use(logRequest);							// logging for debug

// serve static files (client-side)
app.use('/', express.static(clientApp, { extensions: ['html'] }));

// 4.2
// app.use(sessionManager.middleware);

// Define a custom error handler
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


app.listen(port, () => {
	console.log(`${new Date()}  App Started. Listening on ${host}:${port}, serving ${clientApp}`);
});

app.route('/chat').get((req, res) => {

	db.getRooms().then(rooms => {
		const chats = rooms.map(room => Object.assign({
			messages: messages[room._id] 
		}, room));
		return res.status(200).json(chats);
	})
	.catch(err => res.status(500).end(err))
	
});

app.route('/chat/:room_id').get((req, res) => {

		db.getRoom(req.params.room_id).then(room => {
			if (!room) return res.status(404).end(`GET /chat/${req.params.room_id} - room not found`);
			return res.status(200).json(room);
		})
		.catch(err => res.status(500).end(err))


});

app.get('/chat/:room_id/messages', async (req, res) => {
	try {
		const room_id = req.params.room_id;
		const beforeTimestamp = parseInt(req.query.before);

		// Validate the input parameters
		if (!room_id || isNaN(beforeTimestamp)) {
		return res.status(400).json({ error: 'Invalid parameters' });
		}

		const conversation = await db.getLastConversation(room_id, beforeTimestamp);
		
		res.json(conversation);
	} catch (error) {
		console.error('Error handling GET request:', error);
		res.status(500).json({ error: 'Internal Server Error' });
	}
  });

app.route('/chat').post((req, res) => {
	let {name,image,_id} = req.body;
	let newRoom = {name,image,_id};
	db.addRoom(newRoom)
	.then(room => {
		messages[room._id] = [];
		return res.status(200).json(room)
	})
	.catch(err => res.status(400).end(err));

});

function isCorrectPassword(password, saltedHash) {
	// Extract the salt and hash from the stored salted hash
    const storedSalt = saltedHash.substring(0, 20);
    const storedHash = saltedHash.substring(20);

    // Hash the submitted password using the stored salt
    const submittedHash = crypto.createHash('sha256')
        .update(password + storedSalt)
        .digest('base64');

    return submittedHash === storedHash;
}

app.route('/login').post(async (req, res) => {
	const { username, password } = req.body;

    try {
        // Use the getUser method to look up the user data from the database
        const user = await db.getUser(username);

        if (!user) {
            // If the user is not found, redirect back to the /login page
            res.redirect('/login');
            return;
        }

        if (isCorrectPassword(password, user.password)) {
            // If the password is correct, create a new user session
            sessionManager.createSession(res, username);

            // Redirect to the home page (change the path accordingly)
            res.redirect('/');
        } else {
            // If the password is incorrect, redirect back to the /login page
            res.redirect('/login');
        }
    } catch (error) {
        // Handle any errors that might occur during the process
        console.error('Error during login:', error);
        res.status(500).send('Internal Server Error');
    }
});


cpen322.connect('http://3.98.223.41/cpen322/test-a5-server.js');
cpen322.export(__filename, { app, db, messages, messageBlockSize, sessionManager, isCorrectPassword });
