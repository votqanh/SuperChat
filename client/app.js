// Removes the contents of the given DOM element (equivalent to elem.innerHTML = '' but faster)
function emptyDOM (elem) {
    while (elem.firstChild) elem.removeChild(elem.firstChild);
}

// Creates a DOM element from the given HTML string
function createDOM (htmlString) {
    // let template = document.createElement('template');
    let template = document.createElement('template');
    template.innerHTML = htmlString.trim();
    return template.content.firstChild;
}
// example usage
var messageBox = createDOM(
    `<div>
        <span>Alice</span>
        <span>Hello World</span>
    </div>`
    );

var Service = {
    origin: window.location.origin,
    getAllRooms: function() {
        const myPromise = new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            
            xhr.open("GET", Service.origin + "/chat");
            xhr.send();

            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    if(xhr.status === 200) {
                        resolve(JSON.parse(xhr.response));
                    } else {
                        reject(new Error(xhr.response));
                    }
                }  else {
                    // Handle other readyStates if needed
                }
            };

            xhr.onerror = function(err) {
                reject(new Error(err));
            }

        });

        return myPromise;
    },

    addRoom: function(data) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
                
            xhr.open("POST", Service.origin + "/chat");
            xhr.setRequestHeader("Content-Type", "application/json");

            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        const newRoom = JSON.parse(xhr.response);
                        console.log("HIIII");
                        console.log(newRoom);
                        resolve(newRoom);
                    } else {
                        reject(new Error(xhr.response));
                    }
                }
            };

            xhr.onerror = function (err) {
                reject(new Error(err));
            };

            xhr.send(JSON.stringify(data));
        });
    }
}

class Lobby {
    constructor() {
        this.rooms = {};

        // this.addRoom("room-1", "room1");
        // this.addRoom("room-2", "room2");
        // this.addRoom("room-3", "room3");
    }

    getRoom(roomId) {
        // search through the rooms and return the room with id = roomId if found
        return this.rooms[roomId];
    }

    addRoom(id, name, image, messages) {
        // create a new Room object, using the given arguments, and add the object in the this.rooms array
        this.rooms[id] = new Room(id, name, image, messages);

        // check if this.onNewRoom function is defined
        if (typeof this.onNewRoom === 'function') {
            this.onNewRoom(this.rooms[id]);
        }
    }
}

class LobbyView {
    // create the DOM for the "lobby page"
    constructor(lobby) {
        // lobby page
        // need to add page view div? 
        this.elem = createDOM (`
            <div class = "content">
                <ul class = "room-list"></ul>

                <div class = "page-control">
                    <input type="text" id="room-name" name="room name">
                    <button type="button">Create Room</button>
                </div>
            </div>`); 
    
        this.listElem = this.elem.querySelector("ul.room-list");
        this.inputElem = this.elem.querySelector("input");
        this.buttonElem = this.elem.querySelector("button");

        this.lobby = lobby;

        this.buttonElem.addEventListener('click', () => {
            const roomName = this.inputElem.value;

            Service.addRoom({name: roomName, image: ''})
                .then((newRoom) => {
                    console.log("HOOOO");
                    console.log(newRoom);
                    this.lobby.addRoom(newRoom.id, newRoom.name, newRoom.image, []);
                })

                // for debugging
                .catch((error) => {
                    console.error('Error creating room:', error.message);
                });

            this.inputElem.value = '';
        });

        // draw the initial list of rooms
        this.redrawList();

        this.lobby.onNewRoom = (room) => {
            const listItem = createDOM(`<li><a href="#/chat/${room.id}">${room.name}</a></li>`);
            this.listElem.appendChild(listItem)
        }
    }

    redrawList() {
        emptyDOM(this.listElem);

        // dynamically populate the list
        for (const roomId in this.lobby.rooms) {
            const room = this.lobby.rooms[roomId];
            const listItem = createDOM(`<li><a href="#/chat/${roomId}">${room.name}</a></li>`);
            this.listElem.appendChild(listItem);
        }
    }
}


class ChatView {
    // create the DOM for the "chat page" 
    constructor() {
        // chat page
        this.elem = createDOM (`
            <div class="content">
                <h4 class="room-name">Room name</h4>

                <div class="message-list">
                    <div class="message">
                        <span class="message-user">user A</span>
                        <span class="message-text">...</span>
                    </div>
                    <div class="message my-message">
                        <span class="message-user">user B</span>
                        <span class="message-text">...</span>
                    </div>

                </div>

                <div class="page-control">
                    <textarea id="message" name="message"></textarea>
                    <button type="button">Send</button>
                </div>
            </div>`); 


        this.titleElem = this.elem.querySelector("h4");
        this.chatElem = this.elem.querySelector("div.message-list");
        this.inputElem = this.elem.querySelector("textarea");
        this.buttonElem = this.elem.querySelector("button");
        
        this.room = null;
        this.buttonElem.addEventListener('click', () => this.sendMessage());
        this.inputElem.addEventListener('keyup', (event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
                this.sendMessage();
            }
        });
    }

    sendMessage() {
        // check if this.room is set before calling addMessage
        if (this.room) {
            this.room.addMessage(profile.username, this.inputElem.value);
            this.inputElem.value = '';
        } else {
            console.error("Room is not set. Cannot send message.");
        }
    }

    setRoom(room) {
        this.room = room;
        this.titleElem.textContent = room.name;
        emptyDOM(this.chatElem);

        // dynamically create message boxes
        this.room.messages.forEach(message => {
            this.createMessageBox(message);
        });

        this.room.onNewMessage = (message) => {
            this.createMessageBox(message);
        }
    }

    createMessageBox(message) {
        const messageBox = createDOM(`
            <div class="message ${message.username === profile.username ? 'my-message' : ''}">
                <span class="message-user">${message.username}</span>
                <span class="message-text">${message.text}</span>
            </div>
        `);

        this.chatElem.appendChild(messageBox);
    }
}

class ProfileView {
    // create the DOM for the "profile page" 
    constructor() {
        // profile page
        this.elem = createDOM (`
        <div class="content">
            <div class="profile-form">
                <div class="form-field">
                    <label>Username</label>
                    <input type="text" id="message" name="message">

                    <label>Password</label>
                    <input type="password" id="message" name="message">

                    <label>Avatar Image</label>
                    <input type="file" id="message" name="message">

                    <label>About</label>
                    <textarea id="message" name="message"></textarea>

                </div>

            </div>

            <div class="page-control">
                <button type="button">Save</button>
            </div>
        </div>
        `);
    }
}



class Room {
    constructor(id, name, image, messages) {
        this.id = id;
        this.name = name;
        this.image = typeof image !== 'undefined' ? image: "assets/everyone-icon.png";
        this.messages = typeof messages !== 'undefined' ? messages :[];
    }

    addMessage(username, text) {
        if(text.trim().length==0){
            return;
        } else {
            let textMessage = {
                username: username,
                text: text,
            };
            this.messages.push(textMessage);

            // check if this.onNewMessage function is defined
            if (typeof this.onNewMessage === 'function') {
                this.onNewMessage(textMessage);
            }
        }
    }
}

function main() {
    
    let lobby = new Lobby();
    let lobbyView = new LobbyView(lobby);
    let chatView = new ChatView();
    let profileView = new ProfileView();
    
    function renderRoute() {
        let path = window.location.hash;

        let pageview = document.getElementById("page-view");

        if (path=="#/" || path=="") {
		    emptyDOM(pageview);
		    pageview.appendChild(lobbyView.elem);
        }
        else if (path.startsWith("#/chat")) {
            emptyDOM(pageview);
            // extract the room ID
            let roomId = path.substring("#/chat/".length);

            let room = lobby.getRoom(roomId);

            // check if the room exists and is not null
            if (room) {
                chatView.setRoom(room);
                pageview.appendChild(chatView.elem);
            } else {
                console.error(`Room with ID ${roomId} not found.`);
            }
        }
        else if (path.startsWith("#/profile")) {
            emptyDOM(pageview);
		    pageview.appendChild(profileView.elem);
        }
    }

    window.addEventListener("popstate", renderRoute);
    renderRoute();

    function refreshLobby() {

        Service.getAllRooms()
            .then(function(roomsFromServer) {
                roomsFromServer.forEach(function(room) {
                    if (lobby.rooms.hasOwnProperty(room.id)) {
                        lobby.rooms[room.id].name = room.name;
                        lobby.rooms[room.id].image = room.image;
                    } else {
                        lobby.addRoom(room.id, room.name, room.image, room.messages);
                    }
                });
            });
    }
    refreshLobby();
    setInterval(refreshLobby, 6000);


    cpen322.export(arguments.callee, { renderRoute, lobbyView, chatView, profileView, lobby, refreshLobby});

}


window.addEventListener("load", main);

var profile = {
    username: "Baymax"
};
