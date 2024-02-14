const cpen322 = require('./cpen322-tester.js');
const path = require('path');
const fs = require('fs');
const express = require('express');

function logRequest(req, res, next){
	console.log(`${new Date()}  ${req.ip} : ${req.method} ${req.path}`);
	next();
}

const host = 'localhost';
const port = 3000;
const clientApp = path.join(__dirname, 'client');

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

const chatrooms = [
	{
		id: '1',
		name: "hw help",
		image: "x"
	},
	{
		id: '2',
        name: 'Tech Talk',
        image: 'y'
	},
	{
	    id: '3',
        name: 'games',
        image: 'z'
	}
];

const messages = {};

chatrooms.forEach(room => {
	messages[room.id] = [];
});

app.route('/chat').get((req, res) => {
    const chatData = chatrooms.map(room => ({
        id: room.id,
        name: room.name,
        image: room.image,
        messages: messages[room.id]
    }));

    res.json(chatData);
});

app.route('/chat').post((req, res) => {
    const data = req.body;

	if (data && data.name) {
		const newRoom = {
			id: (chatrooms.length + 1).toString(), // should we come up with better way?
			name: data.name,
			image: data.image || ''
		};

		chatrooms.push(newRoom);
		messages[newRoom.id] = [];

		res.status(200).json(newRoom);

	} else {
		res.status(400).json({ error: 'Invalid data. The "name" field is required.' });
	}
});

cpen322.connect('http://3.98.223.41/cpen322/test-a3-server.js');
cpen322.export(__filename, { app, chatrooms, messages });