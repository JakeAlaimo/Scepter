let socket;

class Socket {
  constructor(isLocal){
    this.sock = (isLocal) ? new WebSocket("ws:127.0.0.1:3000"): new WebSocket("wss:scepter-game.herokuapp.com");
    this.room = document.querySelector("#room").value;

    this.sock.addEventListener("message", this.Receive);

    this.sock.addEventListener('open', () => {
        //join the appropriate room
        this.Send(JSON.stringify({type: "join", data:{room: this.room}}));
    });
  }

  Send = (msg) => {
    if(this.sock.readyState == WebSocket.OPEN) {
      this.sock.send(msg);
    }
  }

  Receive = (msg) => {
    let msgData = JSON.parse(msg.data);

    switch(msgData.type){
        case 'ping':
            this.Send(JSON.stringify({type: "pong"}));
            break;
        case 'chat':
            let li = document.createElement("li");
            var textnode = document.createTextNode(msgData.message); 
            li.appendChild(textnode);// = msgData.message;

            document.querySelector("#chat ul").appendChild(li);
            break;
        default:
            document.querySelector("p").innerHTML = msg.data;
        break;
    }
  }
};


function Init() {
  fetch("/isLocal").then(res => res.json()).then((data)=>{
      socket = new Socket(data.isLocal); //CreateSocket(data.isLocal);
      document.querySelector("input").onclick = function() {
          socket.Send(JSON.stringify({type:"input", data: {text: document.querySelector("textarea").value}}));
      };
  });

   
}


window.onload = Init