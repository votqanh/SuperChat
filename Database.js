// const { MongoClient, ObjectID } = require('mongodb');	// require the mongodb driver
const { MongoClient } = require('mongodb');
const ObjectID = require('mongodb').ObjectId;

/**
 * Uses mongodb v4.2+ - [API Documentation](http://mongodb.github.io/node-mongodb-native/4.2/)
 * Database wraps a mongoDB connection to provide a higher-level abstraction layer
 * for manipulating the objects in our cpen322 app.
 */
function Database(mongoUrl, dbName){
	if (!(this instanceof Database)) return new Database(mongoUrl, dbName);
 	this.connected = new Promise((resolve, reject) => {
  		const client = new MongoClient(mongoUrl);

  		client.connect()
			.then(() => {
   				// Ping the dbName to ensure it exists
   				return client.db(dbName).command({ ping: 1 });
  			})
			.then(() => {
  	 			console.log('[MongoClient] Connected to ' + mongoUrl + '/' + dbName);
   				resolve(client.db(dbName));
  			})
  			.catch((err) => {
  	 			reject(err);
 		 	});
	});
 	this.status = () => this.connected.then(
  		db => ({ error: null, url: mongoUrl, db: dbName }),
  		err => ({ error: err })
 	);
}


Database.prototype.getRooms = function(){
	return this.connected.then(db =>
		new Promise((resolve, reject) => {
			/* TODO: read the chatrooms from `db`
			 * and resolve an array of chatrooms */
			
			if(db){
				resolve(db.collection('chatrooms').find().toArray());
			}else{
				reject('No database connection');
			}


		})
	)
}


Database.prototype.getRoom = function(room_id){
	return this.connected.then(db =>
		new Promise((resolve, reject) => {
			/* TODO: read the chatroom from `db`
			 * and resolve the result */


			const roomId = (typeof room_id === 'object' || room_id.length !== 24) ? room_id : new ObjectID(room_id);
	
			db.collection('chatrooms').findOne({ _id: roomId })
				.then(room => resolve(room))
				.catch(err => reject(err));


		})
	)
}

Database.prototype.addRoom = function(room){
	return this.connected.then(db => 
		new Promise((resolve, reject) => {
			/* TODO: insert a room in the "chatrooms" collection in `db`
			 * and resolve the newly added room */


			if (!room.name || room.name.trim().length === 0) return reject('name field required');
			db.collection('chatrooms').insertOne(room)
			.then(
				() => db.collection('chatrooms').findOne(room)
				.then(room => {
					resolve(room);
				}
			))
			.catch(err => reject(err));



		})
	)
}



Database.prototype.getLastConversation = function(room_id, before){
	return this.connected.then(db =>
		new Promise((resolve, reject) => {
			/* TODO: read a conversation from `db` based on the given arguments
			 * and resolve if found */
			if (db) {
				if (!before) before = Date.now()

	  
				const query = { room_id: room_id, timestamp: { $lt: before } }
				const options = {
				  sort: { timestamp: -1 }
				}
	  

			  	db.collection('conversations')
          			.find(query, options)
          			.toArray()
          			.then(conversations => {
            

            			if (conversations.length > 0) {
              				resolve(conversations[0]);
            			} else {
              				resolve(null);
            			}
          			})
          			.catch(err => {
            
            			reject(err);
          			});
      		} else {
        
        		reject('No database connection');
      		}






		})
	)
}


Database.prototype.addConversation = function(conversation){
	return this.connected.then(db =>
		new Promise((resolve, reject) => {
			/* TODO: insert a conversation in the "conversations" collection in `db`
			 * and resolve the newly added conversation */
			// console.log(conversation) //

			const {room_id, timestamp, messages} = conversation;
			if (!room_id || !timestamp || !messages) return reject('room_id, timestamp, messages required');

			db.collection('conversations').insertOne(conversation)
			.then(
				() => db.collection('conversations').findOne(conversation)
				.then(pro => {
					resolve(pro)
				})
			)
			.catch(err => reject(err));
		})
	)
}

module.exports = Database;


