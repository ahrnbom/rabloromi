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
var canvas_scale = 2.5;
var all_cards = [];
var is_dragging = false;

function start(_game_id, _player_name) {
    player_name = _player_name;
    game_id = _game_id;
    
    canvas = document.getElementById("game_canvas");

    w = canvas.clientWidth * canvas_scale;
    h = canvas.clientHeight * canvas_scale;

    canvas.width = w;
    canvas.height = h;

    var ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, w, h);
    ctx.font = "16px Arial";
    ctx.fillText("Loading the game " + game_id + "...", 20, 20);

    httpGetAsync("/view_game?game_id=" + game_id, display_game);

    var card_list = ["cards/joker1.svg",
                        "cards/back1.svg"
                    ];
    var suits = ['s', 'h', 'c', 'd'];
    for (var val = 1; val < 14; ++val) {
        for (var suit_id = 0; suit_id < 4; ++suit_id) {
            if (val == 11) {
                val_name = 'j';
            } else if (val == 12) {
                val_name = 'q';
            } else if (val == 13) {
                val_name = 'k';
            } else {
                val_name = String(val);
            }

            var card_name = val_name + suits[suit_id];
            card_list.push("cards/" + card_name + ".svg");
        }
    }
    load_images(card_list);

    canvas.addEventListener("mousedown", on_mouse_down);
    canvas.addEventListener("mouseup", on_mouse_up);
    canvas.addEventListener("mousemove", on_mouse_move);

    all_cards.push({'x': 0.1, 'y':0.1, 'card':"1s"});
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

function on_mouse_down(e) {
    is_dragging = true;
}

function on_mouse_move(e) {
    if (is_dragging) {
        all_cards[0].x = canvas_scale*e.offsetX/w;
        all_cards[0].y = canvas_scale*e.offsetY/h;
    }
}

function on_mouse_up(e) {
    is_dragging = false;
}

function main_loop() {
    update();
    draw();
}

function update() {

}

function draw() {
       
    var ctx = canvas.getContext("2d");
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, w, h);

    for (var i = 0; i < all_cards.length; ++i) {
        card = all_cards[i];
        draw_card(ctx, card.card, card.x, card.y, 1.0);
    }

    draw_card(ctx, "back1", 0.01, 0.01, 1.0);
    draw_card(ctx, "1s", 0.05, 0.01, 1.1);

}

function draw_card(ctx, card_ID, x, y, scale=1.0) {
    // x and y are relative to the board's size 

    var card_w = w*0.075*scale;
    var card_h = 1.55*card_w;

    if (images_loaded) {
        ctx.drawImage(images[card_ID + ".svg"], x*w, y*h, card_w, card_h)
    }
}

setInterval(main_loop, 0.05);