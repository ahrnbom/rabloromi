function httpGetAsync(url, callback)
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() { 
        if (xmlHttp.readyState == 4) {
            if (xmlHttp.status == 200)
                callback(xmlHttp.responseText);
            else 
                alert("Server error on url " + url + " with " + xmlHttp.status + " and message '" + xmlHttp.responseText);
        } 
    }
    xmlHttp.open("GET", url, true); 
    xmlHttp.send(null);
}

function n_players_changed() {
    var host_input = document.getElementById("host_n_players");
    var num = parseInt(host_input.value);

    if ((num >= 2) && (num <= 10)) {
        var host = document.getElementById("host_names");
        
        // Empty out old names
        while (host.hasChildNodes()) {
            host.removeChild(host.firstChild);
        }

        // Add new name inputs
        for (var i = 0; i < num; ++i) {
            var name_input = document.createElement("input");
            name_input.setAttribute("type", "text");
            host.appendChild(name_input);
        }
    }

}

function host_game() {
    var host_names = document.getElementById("host_names");
    var names = [];
    var inputs = host_names.getElementsByTagName("*");
    var ok = true;
    for (var i = 0; i < inputs.length; ++i) {
        var name = inputs[i].value;
        if (name.indexOf(',') > -1) {
            ok = false;
        } else
            names.push(name);
    }

    if (ok) {
        httpGetAsync("host?players="+String(names), host_response);
    } else {
        alert("Some illegal characters in name!")
    }
    
}

function host_response() {
    var p = document.getElementById("host_response");
    p.innerHTML = "Hosted game successfully!";
}