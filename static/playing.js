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
    var url = new URL(location.href);
    var game_id = url.searchParams.get("game_id");
    var player_name = url.searchParams.get("player_name");
    if (game_id && player_name) {
        start(game_id, player_name);
    } else {
        alert("Incorrect game id or player name!");
    }

}

var player_name;
var game_id;
var w, h;
var canvas;
var game_data;

function start(_game_id, _player_name) {
    player_name = _player_name;
    game_id = _game_id;
    
    canvas = document.getElementById("game_canvas");

    w = canvas.clientWidth;
    h = canvas.clientHeight;

    canvas.width = w;
    canvas.height = h;

    var ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, w, h);
    ctx.font = "16px Arial";
    ctx.fillText("Loading the game " + game_id + "...", 20, 20);

    httpGetAsync("/view_game?game_id=" + game_id, display_game);

    load_images(["cards/1B.svg",
                 "cards/1J.svg"]);
}

var images_loaded = false;
var n_images_loaded = 0;
var n_images_to_load;
var images = {};

function load_images(urls) {
    n_images_to_load = urls.length;
    for (var i = 0; i < n_images_to_load; ++i) {
        var img = new Image();
        img.onload = () => {
            ++n_images_loaded;

            if (n_images_loaded == n_images_to_load) {
                images_loaded = true;
            }
        }
        img.src = urls[i];
        var img_name = urls[i].split('/');
        img_name = img_name[img_name.length - 1];
        images[img_name] = img;
    }
}

function display_game(in_data) {
    game_data = JSON.parse(in_data);
 
}

function main_loop() {
    draw();
    update();
}

function update() {

}

function draw() {
       
    var ctx = canvas.getContext("2d");
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, w, h);

    draw_card(ctx, "1B", 0.01, 0.01, 1.0);
    draw_card(ctx, "1J", 0.05, 0.01, 1.1);

}

function draw_card(ctx, card_ID, x, y, scale=1.0) {
    // scale is 1.0 for standard size
    var card_w = w*0.075*scale;
    var card_h = 1.55*card_w;
    if (images_loaded) {
        ctx.drawImage(images[card_ID + ".svg"], x*w, y*h, card_w, card_h)
    }
}

setInterval(main_loop, 0.03);