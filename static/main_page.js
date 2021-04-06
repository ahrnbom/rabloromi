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

function host_response(game_name) {
    var p = document.getElementById("host_response");
    p.innerHTML = "Hosted game successfully! Game name: " + game_name + '<br>' +
    '<a href=/static/invite.html?game_name=' + game_name + '>Invite link here!</a>';
}


function join_name_changed() {
    var name_input = document.getElementById("join_name");
    var name = name_input.value;

    if (name) {
        httpGetAsync("games?player=" + name, get_games_response);
    } else {
        httpGetAsync("games", get_games_response);
    }
}

function get_games_response(games_string) {
    var games_list = document.getElementById("games_list");
    while (games_list.hasChildNodes()) {
        games_list.removeChild(games_list.firstChild);
    }

    var name_input = document.getElementById("join_name");
    var player_name = name_input.value;

    var games = JSON.parse(games_string);
    for (var i = 0; i < games.length; ++i) {
        var game = games[i];
        
        var game_id = game['id'];
        var game_name = game['name'];
        var players = game['players'];

        var game_div = document.createElement("div");
        game_div.className = "game_in_list";

        var p = document.createElement("p");
        p.innerHTML = "Game name: " + game_id; // game_name + " (" + game_id + ")";
        game_div.appendChild(p);

        var p = document.createElement("p");
        var p_text = "Players: ";
        for (var j = 0; j < players.length; ++j) {
            p_text += players[j] + ", ";
        }
        p_text = p_text.slice(0, -2);
        p.innerHTML = p_text;
        game_div.appendChild(p);

        var button = document.createElement("button");       
        button.onclick = create_clickevent(game_id, player_name);
        button.innerHTML = "Join game";
        game_div.appendChild(button);

        var p2 = document.createElement("p");
        game_div.appendChild(p2);

        games_list.appendChild(game_div);

        var br = document.createElement("br");
        games_list.appendChild(br);
    }
}

function create_clickevent(game_id, player_name) {
    return function() {
        join_game(game_id, player_name);
    }
}

function join_game(game_id, player_name) {
    window.location = "static/playing.html?game_id=" + game_id + "&player_name=" + player_name;
}