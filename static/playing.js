function httpGetAsync(url, callback)
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() { 
        if (xmlHttp.readyState == 4) {
            if (xmlHttp.status == 200)
                callback(xmlHttp.responseText);
            else 
                alert("Server error (" + xmlHttp.status + "): " + xmlHttp.responseText);
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

var your_turn = false;
var current_player;
var player_name;
var player_names;
var player_in_game;
var game_id;
var w, h;
var canvas;
var game_data;
var canvas_scale = 1.5;
var is_dragging = false;
var dragged_card = undefined;
const card_scale = 0.055;
const card_ar = 1.55;
var piles;
var hand_size;
var pile_columns = 5;
var pile_width = 1/pile_columns;
var pile_height = card_ar*card_scale*2 + 0.01;
var cards_in_deck;

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

    // Adjust number of columns if necessary
    let pile_count = 0;
    for (let key in game_data.piles) {
        pile_count++;
    }
    if (pile_count > 14) {
        pile_columns = 6;
        pile_width = 1/pile_columns;
    } 
    if (pile_count > 17) {
        pile_columns = 7;
        pile_width = 1/pile_columns;
    }
        
    piles = {}; // Needs to be reset here to make sure retreat works in edge cases

    cards_in_deck = game_data['cards_in_deck'];
    
    your_turn = game_data.turn == player_name;
    current_player = game_data.turn;

    let players = game_data.players;
    let players_in_game = game_data.players_in_game;
    let hands = game_data.hands;

    player_in_game = false;
    for (let i = 0; i < players_in_game.length; ++i) {
        if (player_name == players_in_game[i]) {
            player_in_game = true;
        }
    }

    player_names = players;

    let your_hand_size;
    if (players.length < 4) {
        hand_size = (1.0 - 0.01) / players.length;
        your_hand_size = hand_size;
    } else {
        your_hand_size = (1.0 - 0.01) / 4;
        
        // Everyone's except yours
        hand_size = (1.0 - 0.01 - your_hand_size) / (players.length - 1);
    }
    
    let x_prev = 0.01;

    // Initialize piles with player hands
    for (let i = 0; i < players.length; ++i) {
        let player = players[i];
        let x;
        let y = 1 - 0.02 - pile_height;

        let the_hand_size;
        if (player == player_name) {
            the_hand_size = your_hand_size;
        } else {
            the_hand_size = hand_size;
        }
        x = x_prev;
        x_prev = x + the_hand_size;

        let pile = {'x': x, 'y': y, 'cards': [], 'w': the_hand_size - 0.005, 'h': pile_height, 'is_hand': true};
        piles[player] = pile;
        
        let hand = hands[player];
        let tightness = Math.min((the_hand_size - card_scale) / hand.length, card_scale);
        hand.forEach(card_str => {
            place_card(card_str, player==player_name, player, tightness=tightness);
        });
    }

    // Initialize other piles
    let highest_pile_id = 0;
    for (let pile_id = 0; pile_id < pile_count; ++pile_id) {
        let in_pile = game_data.piles[pile_id];
        if (in_pile===undefined) {
            in_pile = {'valid': "yes", 'cards': []};
        }
        let pile_ok = in_pile.valid == "yes";

        if (pile_id > highest_pile_id) {
            highest_pile_id = pile_id;
        }

        let x = ((pile_id-1)%pile_columns) * pile_width;
        let y = (Math.floor((pile_id-1)/pile_columns) + 0.2) * (pile_height + 0.01) + 0.001;
        let pile = {'x': x + 0.001, 'y': y, 'w': pile_width - 0.005, 'h': pile_height + 0.005, 'is_hand': false, 'is_ok': pile_ok, cards: []};
        piles[pile_id] = pile;

        for (let i = 0; i < in_pile.cards.length; ++i) {
            place_card(in_pile.cards[i], true, pile_id);
        }
    }

    // Finally, create the final always empty pile
    let pile_id = highest_pile_id + 1;
    let x = ((pile_id-1)%pile_columns) * pile_width;
    let y = (Math.floor((pile_id-1)/pile_columns) + 0.2) * (pile_height + 0.01) + 0.001;
    let pile = {'x': x + 0.001, 'y': y, 'w': pile_width - 0.005, 'h': pile_height + 0.005, 'is_hand': false, 'is_ok': true, cards: []};
    piles[pile_id] = pile;

}

function place_card(card_str, is_up, pile_id, tightness=undefined) {
    let splot = card_str.split(':');
    let card_id = splot[0];
    if (!is_up) {
        card_id = "back";
    }

    let belongs_to = false;
    let card_description = splot[1];
    for (let i = 0; i < player_names.length; ++i) {
        if (card_description.includes('(' + player_names[i] + ')')) {
            belongs_to = player_names[i];
        }
    }
    
    if (!tightness) {
        tightness = card_scale*0.33;
    }

    let pile = piles[pile_id];
    let card = {'x': pile.x + pile.cards.length*tightness + 0.002, 'y': pile.y + 0.003, 'card': card_id, 'belongs_to': belongs_to, 'comes_from': pile_id};
    pile.cards.push(card);
}

function on_mouse_down(e) {
    if (!your_turn) {
        return;
    }

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
        }
    }
}

function on_mouse_move(e) {
    if (!your_turn) {
        return;
    }

    if (is_dragging) {
        let card_w = card_scale;
        let card_h = card_w*card_ar;

        dragged_card.x = canvas_scale*e.offsetX/w - card_w/2;
        dragged_card.y = canvas_scale*e.offsetY/h - card_h;
    }
}

function on_mouse_up(e) {
    if (!your_turn) {
        return;
    }

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
                    if (key == dragged_card.belongs_to) {
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

            if (found_key != dragged_card.comes_from) {
                httpGetAsync("/move_card?game_id=" + game_id + "&player=" + player_name + "&card=" + dragged_card.card + "&to=" + found_key + "&from=" + dragged_card.comes_from, refresh_if_okay);
            }
            
            dragged_card = undefined;
            is_dragging = false;
        }
        
    }
}

function refresh_if_okay(result) {
    if (result=="ok") {
        httpGetAsync("/view_game?game_id=" + game_id, load_state);
    } else {
        alert(result);
    }
}

function draw() {
    if (game_data === undefined) {
        return;
    }
    
    let ctx = canvas.getContext("2d");
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, w, h);
    ctx.font = "18px Arial";
    ctx.fillStyle = "#000000";

    for (let key in piles) {
        let pile = piles[key];

        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "black";
        ctx.setLineDash([]);
        if (!pile.is_hand) {
            if (pile.is_ok) {
                ctx.strokeStyle = "darkgreen";
            } else {
                ctx.strokeStyle = "red";
                ctx.setLineDash([5, 5]);
            }
        }
        ctx.rect(pile.x*w, pile.y*h, pile.w*w, pile.h*h);
        ctx.stroke();

        for (let i = 0; i < pile.cards.length; ++i) {
            let card = pile.cards[i];
            draw_card(ctx, card, 1.0, no_shadow=pile.is_hand);
        }

        if (pile.cards.length == 0) {
            ctx.textAlign = "center";
            ctx.fillText("This pile is empty!", (pile.x + pile.w/2)*w, (pile.y + pile.h/2)*h);
            ctx.textAlign = "left";
        }
    }
    
    for (let i = 0; i < game_data.players.length; ++i) {
        let player = game_data.players[i];
        let pile = piles[player];
        if (pile !== undefined)
            ctx.fillText(player + "'s hand", w*(pile.x+0.005), h*(pile.y-0.005));   
    }

    ctx.fillText(String(cards_in_deck) + " cards left in deck", w*0.005, h*0.02);
    
    ctx.textAlign = "center";
    if (!your_turn) {
        ctx.fillText(current_player + "'s turn, please wait...", w/2, 20);
    } else {
        ctx.fillText("Your turn!", w/2, 20);
    }
    

    if (!player_in_game) {
        ctx.textAlign = "right";
        ctx.fillText("You are not in the game! ", w, h*0.02);
    }

    ctx.textAlign = "left";
    
    if (is_dragging) {
        draw_card(ctx, dragged_card, 1.1);
    }
}

function draw_card(ctx, card, scale=1.0, no_shadow=false) {
    let card_ID = card.card;
    let x = card.x;
    let y = card.y;
    // x and y are relative to the board's size 

    if (card.belongs_to && !no_shadow) {
        ctx.shadowColor = 'rgba(0, 0, 0, .7)';
        ctx.shadowBlur = 15;
    }

    let card_w = w*card_scale*scale;
    let card_h = card_ar*card_w;

    if (images_loaded) {
        ctx.drawImage(images[card_ID + ".png"], Math.round(x*w)+0.5, Math.round(y*h)+0.5, card_w, card_h);
    }

    ctx.shadowBlur = 0;

}

function button_pressed_keso() {
    if (!your_turn) {
        alert("Not your turn!");
        return;
    }

    httpGetAsync("/keso?game_id=" + game_id + "&player=" + player_name, refresh_if_okay);
}

function button_pressed_retreat() {
    if (!your_turn) {
        alert("Not your turn!");
        return;
    }

    httpGetAsync("/retreat?game_id=" + game_id + "&player=" + player_name, refresh_if_okay);
}
var draw_tick = 0.1;
var update_tick = 0.05;
var update_time = 0.0;
var ping_time = 1.0 / (3 + Math.random()); // Between 3 and 4 per second
var ping_counter = 0;
function update() {
    update_time += update_tick;
    if (update_time >= ping_time) {
        update_time = 0.0;

        // Ping real time stuff here

        ++ping_counter;
        if (ping_counter >= 20) {
            ping_counter = 0;

            if (current_player != player_name) 
                httpGetAsync("/view_game?game_id=" + game_id, load_state);
        }
    }
}

setInterval(draw, draw_tick);
setInterval(update, update_tick);