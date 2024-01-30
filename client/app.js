// Removes the contents of the given DOM element (equivalent to elem.innerHTML = '' but faster)
function emptyDOM (elem){
    while (elem.firstChild) elem.removeChild(elem.firstChild);
}

// Creates a DOM element from the given HTML string
function createDOM (htmlString){
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



class LobbyView{
    // create the DOM for the "lobby page"
    constructor(){
        // lobby page
        // need to add page view div? 
        this.elem = createDOM (`
            <div class = "content">
                <ul class = "room-list">
                    <li> 
                        <a href = "#/chat">chat1</a>
                    </li>

                    <li> 
                        <a href = "#/chat">chat2</a>
                    </li>

                    <li> 
                        <a href = "#/chat">chat3</a>
                    </li>

                    <li> 
                        <a href = "#/chat">chat4</a>
                    </li>
                </ul>

                <div class = "page-control">
                    <input type="text" id="room-name" name="room name">
                    <button type="button">Create Room</button>
                </div>
            </div>`); 
        
    
        this.listElem = this.elem.querySelector("ul.room-list");
        this.inputElem = this.elem.querySelector("input");
        this.buttonElem = this.elem.querySelector("button");
    
    }
}


class ChatView{
//     // create the DOM for the "chat page" 
    constructor(){
//         // chat page
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

            // e.g. const parentElement = document.querySelector("#parent");
        this.titleElem = this.elem.querySelector("h4");
        this.chatElem = this.elem.querySelector("div.message-list");
        this.inputElem = this.elem.querySelector("textarea");
        this.buttonElem = this.elem.querySelector("button");

 

    }
}

class ProfileView{
//     // create the DOM for the "profile page" 
    constructor(){
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



class Room{
    constructor(id, name, image, messages){
        this.id = id;
        this.name = name;
        this.image = typeof image !== 'undefined' ? image: "assets/everyone-icon.png";
        this.messages = typeof messages !== 'undefined' ? messages :[];
    }

    addMessage(username, text){
        if(text.trim().length==0){
            return;
        }else {

            let textMessage = {
                username: username,
                text: text,
            };
            this.messages.push(textMessage);
        }
    }
}


class Lobby{
    constructor(){
        this.rooms = {};

        this.addRoom("roomId1", "roomName1");
        this.addRoom("roomId2", "roomName2");
        this.addRoom("roomId3", "roomName3");
    }

    getRoom(roomId){
        // search through the rooms and return the room with id = roomId if found.
        return this.rooms[roomId];
    }

    addRoom(id, name, image, messages){
        // create a new Room object, using the given arguments, and add the object in the this.rooms array.
        this.rooms[id] = new Room(id, name, image, messages);
    }
}


function main () {
    
    let lobbyView = new LobbyView();
    let chatView = new ChatView();
    let profileView = new ProfileView();
    let lobby = new Lobby();
    
    function renderRoute(){

        // let path = window.location.hash.split('/');
        // let path = window.location.hash.substring(1);
        let path = window.location.hash;

        let pageview = document.getElementById("page-view");

        if(path=="#/"){ // ==""
        // if(path==""){ 

		    emptyDOM(pageview);
		    pageview.appendChild(lobbyView.elem, pageview);
            
        }
        else if(path=="#/chat"){ // =="chat"
        // else if(path=="chat"){ 
            emptyDOM(pageview);
		    pageview.appendChild(chatView.elem, pageview);

        }
        else if(path=="#/profile"){ // =="profile"
        // else if(path=="profile"){ 
            emptyDOM(pageview);
		    pageview.appendChild(profileView.elem, pageview);
            
        }


    }

    renderRoute();
    window.addEventListener("popstate", renderRoute);

    cpen322.export(arguments.callee, { renderRoute, lobbyView, chatView, profileView, lobby });

}

// "main" not added as a listener on window "load" event
// let start = window.addEventListener("load", main);
window.addEventListener("load", main);




