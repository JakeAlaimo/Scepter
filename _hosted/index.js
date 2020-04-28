function SendAJAX(requestType, url, data, callback){
  let xhr = new XMLHttpRequest();
  xhr.open(requestType, url);
  xhr.onload = () => {callback(JSON.parse(xhr.response), xhr.status);};
  xhr.send(data);
}

function PollJob(jobID, ms, callback){
  let interval = setInterval(function(){
    SendAJAX("GET", `/job/${jobID}`, null, function(response, status){
      if(status === 200){
        clearInterval(interval);
        callback(response);
      }
    });
  }, ms);
}

window.onload = () => {

  document.querySelector("#publicGame").onclick = () => {
    SendAJAX("POST", "/requestGame", {public: true}, function(response){
      PollJob(response.id, 50, (response) => { window.location.replace(response.result.gameURL); });
    });
  }

  document.querySelector("#privateGame").onclick = () => {
    SendAJAX("POST", "/requestGame", {public: true}, function(response){
      PollJob(response.id, 50, (response) => { 
        document.querySelector("a").innerHTML = window.location.href.slice(0, window.location.href.length-1) + response.result.gameURL;
        document.querySelector("a").href = response.result.gameURL;
      });
    });
  }

}

