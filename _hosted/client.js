function Init()
{
    let socket = CreateSocket();

    document.querySelector("input").onclick = function() {
        socket.Send(document.querySelector("textarea").value);
    };
}

function CreateSocket()
{
    let socket = {

        sock: new WebSocket("ws://scepter-game.herokuapp.com"),

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