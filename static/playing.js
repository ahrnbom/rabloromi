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
var canvas_scale = 1.5;
var is_dragging = false;
var dragged_card = undefined;
const card_scale = 0.055;
const card_ar = 1.55;
var piles = {};
var hand_size;

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

    httpGetAsync("/view_game?game_id=" + game_id, load_state);

    var card_list = ["cards/joker.png",
                     "cards/back.png"
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
            card_list.push("cards/" + card_name + ".png");
        }
    }
    load_images(card_list);

    canvas.addEventListener("mousedown", on_mouse_down);
    canvas.addEventListener("mouseup", on_mouse_up);
    canvas.addEventListener("mousemove", on_mouse_move);
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

function load_state(in_data) {
    game_data = JSON.parse(in_data);
    
    let players = game_data.players;
    let player_in_game = game_data.players_in_game;
    let hands = game_data.hands;

    hand_size = 1.0 / players.length;
    let n_piles = 0;

    // Initialize piles with player hands
    for (let i = 0; i < players.length; ++i) {
        let player = players[i];
        let x, y;
        if (player == player_name) {
            // This player is me
            x = 0.01;
            y = 0.02;
        } else {
            x = 0.01 + hand_size*(n_piles+1);
            y = 0.02;
            n_piles++;
        }
        let pile = {'x': x, 'y': y, 'cards': [], 'w': hand_size - 0.005, 'h': card_ar*card_scale*2, 'is_hand': true};
        piles[player] = pile;
        
        let hand = hands[player];
        hand.forEach(card_str => {
            place_card(card_str, player==player_name, player);
        });
        
    }
}

function place_card(card_str, is_up, pile_id) {
    let card_id = card_str.split(':')[0];
    if (!is_up) {
        card_id = "back";
    }

    let pile = piles[pile_id];
    let card = {'x': pile.x + pile.cards.length*card_scale*0.33, 'y': pile.y, 'card': card_id};
    pile.cards.push(card);
}

function on_mouse_down(e) {
    if (!is_dragging) {
        let mouse_x = canvas_scale*e.offsetX/w;
        let mouse_y = canvas_scale*e.offsetY/h;

        let card_w = card_scale;
        let card_h = card_w*card_ar*2;

        let found_key = undefined;
        let found_i = -1;

        for (let key in piles) {
            let pile = piles[key];
            let cards = pile.cards;
            for (let i = 0; i < cards.length; ++i) {
                let card = cards[i];
                if ((mouse_x > card.x) && (mouse_y > card.y) && (mouse_x < card.x + card_w) && (mouse_y < card.y + card_h)) {
                    if (card.card != "back") { // cannot drag flipped cards
                        found_i = i;
                        found_key = key;
                    }
                }
            }
        }

        if (found_i > -1) {
            let pile = piles[found_key];
            let cards = pile.cards;
            let card = cards[found_i];
            cards.splice(found_i, 1);
            dragged_card = card;
            is_dragging = true;
            card["comes_from"] = found_key;
        }
    }
}

function on_mouse_move(e) {
    if (is_dragging) {
        let card_w = card_scale;
        let card_h = card_w*card_ar;

        dragged_card.x = canvas_scale*e.offsetX/w - card_w/2;
        dragged_card.y = canvas_scale*e.offsetY/h - card_h;
    }
}

function on_mouse_up(e) {
    if (is_dragging) {
        let mouse_x = canvas_scale*e.offsetX/w;
        let mouse_y = canvas_scale*e.offsetY/h;

        // Go through piles and see if the card is being dropped on one of them
        let found_key = undefined;
        for (let key in piles) {
            let pile = piles[key];
            if (mouse_x > pile.x && mouse_y > pile.y && mouse_x < pile.x + pile.w && mouse_y < pile.y + pile.h) {
                if (pile.is_hand) {
                    // The only hand you can drop on is your own
                    if (key == dragged_card.comes_from) {
                        found_key = key;
                    }
                } else {
                    found_key = key;
                }
            }
        }

        if (found_key) {
            let pile = piles[found_key];
            pile.cards.push(dragged_card);

            dragged_card = undefined;
            is_dragging = false;
        }
        
    }
}


function main_loop() {
    update();
    draw();
}

function update() {

}

function draw() {
       
    let ctx = canvas.getContext("2d");
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, w, h);

    for (let key in piles) {
        let pile = piles[key];

        ctx.beginPath();
        ctx.rect(pile.x*w, pile.y*h, pile.w*w, pile.h*h);
        ctx.stroke();

        for (let i = 0; i < pile.cards.length; ++i) {
            let card = pile.cards[i];
            draw_card(ctx, card.card, card.x, card.y, 1.0);
        }
    }

    if (is_dragging) {
        draw_card(ctx, dragged_card.card, dragged_card.x, dragged_card.y, 1.1);
    }

    if (game_data) {
        ctx.fillStyle = "#000000";
        for (let i = 0; i < game_data.players.length; ++i) {
            let player = game_data.players[i];
            let pile = piles[player];
            ctx.fillText(player + "'s hand", w*(pile.x+0.005), h*(pile.y-0.005));   
        }
    }
    
}

function draw_card(ctx, card_ID, x, y, scale=1.0) {
    // x and y are relative to the board's size 

    let card_w = w*card_scale*scale;
    let card_h = card_ar*card_w;

    if (images_loaded) {
        ctx.drawImage(images[card_ID + ".png"], Math.round(x*w)+0.5, Math.round(y*h)+0.5, card_w, card_h)
    }
}

setInterval(main_loop, 0.05);