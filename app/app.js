import React from "react"
import ReactDOM from "react-dom"

const { useState } = React
const socket = io('ws://localhost:8080');

socket.on('message', text => {

    //const el = document.createElement('li');
    //el.innerHTML = text;
    //document.querySelector('ul').appendChild(el)

});

/*document.querySelector('button').onclick = () => {

    const text = document.querySelector('input').value;
    socket.emit('message', text)
    
}*/

function ClassPulse() {


    return(
        <div id="NavBar">
            <img id = "profileImg"></img>
            <ul id = "classes">
                {}
            </ul>
        </div>
        
        <div id="content">
            

        </div>
    )
}



// Regular Websockets

// const socket = new WebSocket('ws://localhost:8080');

// // Listen for messages
// socket.onmessage = ({ data }) => {
//     console.log('Message from server ', data);
// };

// document.querySelector('button').onclick = () => {
//     socket.send('hello');
// }