var game_id;
var main_text;
var join_buttons;

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

window.onload = () => {
    main_text = document.getElementById("main_text");
    join_buttons = document.getElementById("join_buttons");
    
    var url = new URL(location.href);
    game_id = url.searchParams.get("game_name");

    httpGetAsync("/view_game?game_id=" + game_id, loaded_game)
}

function loaded_game(received) {
    let game_data = JSON.parse(received);
    let players = game_data.players;

    main_text.innerHTML = "Choose who you are:"

    for (let i = 0; i < players.length; ++i) {
        let player = players[i];

        let butt = document.createElement("button");
        butt.innerHTML = player;
        butt.onclick = () => {
            window.location.href = "/static/playing.html?game_id=" + game_id + "&player_name=" + player;
        };
        butt.className = "game_button";
        join_buttons.appendChild(butt);
    }
}