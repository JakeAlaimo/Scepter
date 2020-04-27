function Init()
{
    fetch("/isLocal").then((res) => {
        return res.json();
    }).then((data)=>{

        let socket = CreateSocket(data.isLocal);

        document.querySelector("input").onclick = function() {
            socket.Send(JSON.stringify({type:"input", data: {text: document.querySelector("textarea").value, room: "AAAA"}}));
        };

        
    });

   
}

function CreateSocket(isLocal)
{
    let socket = {

        sock: (isLocal) ? new WebSocket("ws:127.0.0.1:3000"): new WebSocket("wss:scepter-game.herokuapp.com"),

        Receive: function(msg, socket)
        {
            let msgData = JSON.parse(msg.data);

            switch(msgData.type)
            {
                case 'ping':
                    socket.Send(JSON.stringify({type: "pong"}));
                    break;
                default:
                    document.querySelector("p").innerHTML = msg.data;
                break;
            }


        },

        Send: function (msg)
        {
            if(this.sock.readyState == WebSocket.OPEN)
            {
                this.sock.send(msg);
            }
        }
    };

    socket.sock.addEventListener("message", (e) => {socket.Receive(e, socket)});

    socket.sock.addEventListener('open', function (event) {
        //join the appropriate room
        socket.Send(JSON.stringify({type: "join room", data:{room: "AAAA"}}));
    });

    return socket;
}


window.onload = Init