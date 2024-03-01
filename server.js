const cpen322 = require('./cpen322-tester.js');
const path = require('path');
const fs = require('fs');
const express = require('express');
const ws = require('ws');
const Database = require('./Database')

let mongoUrl = 'mongodb://127.0.0.1:27017'; // 'mongodb://localhost:27017' makes connection error
let dbName = 'cpen322-messenger';
let db = new Database(mongoUrl, dbName);

let messages = {};
let messageBlockSize = 10; // 

db.getRooms().then(rooms => {
	for (let room of rooms) {
	  	messages[room._id] = [];
	}
});


function logRequest(req, res, next){
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
		// console.log(data);

	  	messages[parsedData.roomId].push({
			username: parsedData.username,
      		text: parsedData.text
	  	})

	  	for (let client of broker.clients) {
			if (client !== ws) {
		  		client.send(JSON.stringify(parsedData));
			}
	  	}
	})
})


// express app
let app = express();
app.use(express.json()) 						// to parse application/json
app.use(express.urlencoded({ extended: true })) // to parse application/x-www-form-urlencoded
app.use(logRequest);							// logging for debug

// serve static files (client-side)
app.use('/', express.static(clientApp, { extensions: ['html'] }));
app.listen(port, () => {
	console.log(`${new Date()}  App Started. Listening on ${host}:${port}, serving ${clientApp}`);
});

// const chatrooms = [
// 	{
// 		id: '1',
// 		name: "hw help",
// 		image: "x"
// 	},
// 	{
// 		id: '2',
//         name: 'Tech Talk',
//         image: 'y'
// 	},
// 	{
// 	    id: '3',
//         name: 'games',
//         image: 'z'
// 	}
// ];


//
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

cpen322.connect('http://3.98.223.41/cpen322/test-a4-server.js');
cpen322.export(__filename, { app, messages, broker, db, messageBlockSize});
