function Init()
{
    fetch("/isLocal").then((res) => {
        return res.json();
    }).then((data)=>{

        let socket = CreateSocket(data.isLocal);

        document.querySelector("input").onclick = function() {
            socket.Send(document.querySelector("textarea").value);
        };
    });

   
}

function CreateSocket(isLocal)
{
    let socket = {

        sock: (isLocal) ? new WebSocket("ws:127.0.0.1:3000"): new WebSocket("wss:scepter-game.herokuapp.com"),

        Receive: function(msg)
        {
            document.querySelector("p").innerHTML = msg.data;
        },

        Send: function (msg)
        {
            if(this.sock.readyState == WebSocket.OPEN)
            {
                this.sock.send(msg);
            }
        }
    };

    socket.sock.addEventListener("message", socket.Receive)

    return socket;
}


window.onload = Init