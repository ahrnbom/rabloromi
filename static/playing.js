function httpGetAsync(url, callback) {
    let xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() { 
        if (xmlHttp.readyState == 4) {
            if (xmlHttp.status == 200)
                callback(xmlHttp.responseText);
            else 
                alert("Server error (" + xmlHttp.status + "): " + xmlHttp.responseText);
        } 
    }
    xmlHttp.open('GET', url, true); 
    xmlHttp.send(null);
}

function httpPostAsync(url, data, callback) {
    let xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() { 
        if (xmlHttp.readyState == 4) {
            if (xmlHttp.status == 200)
                callback(xmlHttp.responseText);
            else 
                alert("Server error (" + xmlHttp.status + "): " + xmlHttp.responseText);
        } 
    }
    xmlHttp.open('POST', url, true); 
    xmlHttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xmlHttp.send(data);
}

window.onload = () => {
    let url = new URL(location.href);
    let param_game_id = url.searchParams.get("game_id");
    let param_player_name = url.searchParams.get("player_name");
    let param_language = url.searchParams.get("lan");
    
    if (param_language) {
        let keso = document.getElementById("keso_button");
        let retr = document.getElementById("retreat_button");

        switch (param_language.toLowerCase()) {
            case "swungarian":
                keso.innerHTML = "Kesz";
                retr.innerHTML = "Backa";
        }
    }
    
    if (param_game_id && param_player_name) {
        start(param_game_id, param_player_name);
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
var lower_canvas;
var upper_canvas;
var game_data;
var canvas_scale = 1.5;
var is_dragging = false;
var dragged_card = undefined;
const card_scale = 0.05;
const card_ar = 1.55;
var piles;
var hand_size;
var pile_columns = 5;
var pile_width = 1/pile_columns;
var pile_height = card_ar*card_scale*2 + 0.01;
var cards_in_deck;
var prev_hand;
var new_card;
var winner;
var mouse_x, mouse_y;
var received_mouse_x, received_mouse_y;
var smooth_mouse_x = 0.0;
var smooth_mouse_y = 0.0;

function start(_game_id, _player_name) {
    player_name = _player_name;
    game_id = _game_id;
    
    lower_canvas = document.getElementById("lower_game_canvas");
    upper_canvas = document.getElementById("upper_game_canvas");

    w = lower_canvas.clientWidth * canvas_scale;
    h = lower_canvas.clientHeight * canvas_scale;

    lower_canvas.width = w;
    lower_canvas.height = h;

    upper_canvas.width = w;
    upper_canvas.height = h;

    let ctx = lower_canvas.getContext("2d");
    ctx.clearRect(0, 0, w, h);
    ctx.font = "16px Arial";
    ctx.fillText("Loading the game " + game_id + "...", 20, 20);

    ctx = upper_canvas.getContext("2d");
    ctx.clearRect(0, 0, w, h);

    httpGetAsync("/view_game?game_id=" + game_id, load_state);

    let im_list =   ["cards/joker.png",
                     "cards/back.png",
                     "other/cursor.png"
                    ];
    let suits = ['s', 'h', 'c', 'd'];
    for (let val = 1; val < 14; ++val) {
        for (let suit_id = 0; suit_id < 4; ++suit_id) {
            if (val == 11) {
                val_name = 'j';
            } else if (val == 12) {
                val_name = 'q';
            } else if (val == 13) {
                val_name = 'k';
            } else {
                val_name = String(val);
            }

            let card_name = val_name + suits[suit_id];
            im_list.push("cards/" + card_name + ".png");
        }
    }
    load_images(im_list);

    upper_canvas.addEventListener("mousedown", on_mouse_down);
    upper_canvas.addEventListener("mouseup", on_mouse_up);
    upper_canvas.addEventListener("mousemove", on_mouse_move);
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
                draw_lower();
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

    if (game_data.winner) {
        winner = game_data.winner;
    }

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
    for (let key in game_data.piles) {
        let key_int = parseInt(key);
        if (key_int > highest_pile_id) {
            highest_pile_id = key_int;
        }
    }

    for (let i = 0; i < Math.max(pile_count, highest_pile_id); ++i) {
        let pile_id = i+1; // One based, for some reason
        let in_pile = game_data.piles[String(pile_id)];
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

        let tightness = Math.min((pile_width - card_scale) / in_pile.cards.length, card_scale);
        for (let i = 0; i < in_pile.cards.length; ++i) {
            place_card(in_pile.cards[i], true, pile_id, tightness=tightness);
        }
    }

    // Finally, create the final always empty pile
    let pile_id = highest_pile_id + 1;
    let x = ((pile_id-1)%pile_columns) * pile_width;
    let y = (Math.floor((pile_id-1)/pile_columns) + 0.2) * (pile_height + 0.01) + 0.001;
    let pile = {'x': x + 0.001, 'y': y, 'w': pile_width - 0.005, 'h': pile_height + 0.005, 'is_hand': false, 'is_ok': true, cards: []};
    piles[pile_id] = pile;

    // Finally, see if you just got a new card
    let curr_hand = piles[player_name].cards;
    new_card = undefined;
    if (prev_hand !== undefined) {
        for (let i = 0; i < curr_hand.length; ++i) {
            let curr_card = curr_hand[i];

            let found = false;
            for (let j = 0; j < prev_hand.length; ++j) {
                let prev_card = prev_hand[j];

                if (curr_card.card == prev_card.card) {
                    found = true;
                }
            }

            if (!found) {
                new_card = curr_card;
            }
        }
    }
    prev_hand = curr_hand;

    dragged_card = undefined;

    // Finally, redraw lower canvas
    draw_lower();
}

function place_card(card_str, is_up, pile_id, tightness=undefined) {
    let splot = card_str.split(':');
    let card_id = splot[0];

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
    let card = {'x': pile.x + pile.cards.length*tightness + 0.002, 'y': pile.y + 0.003, 'card': card_id, 'belongs_to': belongs_to, 'comes_from': pile_id, 'is_hidden': !is_up};
    pile.cards.push(card);
}

function on_mouse_down(e) {
    if (!your_turn) {
        return;
    }

    if (!is_dragging) {
        mouse_x = canvas_scale*e.offsetX/w;
        mouse_y = canvas_scale*e.offsetY/h;

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
                    if (!card.is_hidden) { // cannot drag flipped cards
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

        draw_lower();
    }
}

function on_mouse_move(e) {
    if (!your_turn) {
        return;
    }

    mouse_x = canvas_scale*e.offsetX/w;
    mouse_y = canvas_scale*e.offsetY/h;

    if (is_dragging) {
        let card_w = card_scale;
        let card_h = card_w*card_ar;

        dragged_card.x = mouse_x - card_w/2;
        dragged_card.y = mouse_y - card_h;
    }
}

function on_mouse_up(e) {
    if (!your_turn) {
        return;
    }

    if (is_dragging) {
        mouse_x = canvas_scale*e.offsetX/w;
        mouse_y = canvas_scale*e.offsetY/h;

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
        
        draw_lower();
    }
}

function refresh_if_okay(result) {
    if (result=="ok") {
        httpGetAsync("/view_game?game_id=" + game_id, load_state);
    } else {
        alert(result);
    }
}

function draw_lower() {
    if (game_data === undefined) {
        return;
    }
    
    let ctx = lower_canvas.getContext("2d");
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

        let have_drawn_new = false;
        for (let i = 0; i < pile.cards.length; ++i) {
            let card = pile.cards[i];
            
            extra_mark = false;
            if (key == player_name && new_card !== undefined && !have_drawn_new) {
                if (card.card == new_card.card) {
                    have_drawn_new = true;
                    extra_mark = true;
                }
            }

            draw_card(ctx, card, 1.0, no_shadow=pile.is_hand, extra_mark=extra_mark);
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
    if (winner !== undefined) {
        ctx.fillText(winner + " has won. Congratulations!", w/2, 20);
    } else {
        if (!your_turn) {
            ctx.fillText(current_player + "'s turn, please wait...", w/2, 20);
        } else {
            ctx.fillText("Your turn!", w/2, 20);
        }
    }

    if (!player_in_game) {
        ctx.textAlign = "right";
        ctx.fillText("You are not in the game! ", w, h*0.02);
    }

    ctx.textAlign = "left";

}

function draw_upper() {
    let ctx = upper_canvas.getContext("2d");
    ctx.clearRect(0, 0, w, h);

    ctx.font = "18px Arial";

    if (received_mouse_x !== undefined && received_mouse_y !== undefined && !your_turn) {
        smooth_mouse_x = 0.1 * received_mouse_x + 0.9 * smooth_mouse_x;
        smooth_mouse_y = 0.1 * received_mouse_y + 0.9 * smooth_mouse_y;

        if (dragged_card !== undefined) {
            let card_w = card_scale;
            let card_h = card_w*card_ar;
            let card_x = smooth_mouse_x - card_w/2;
            let card_y = smooth_mouse_y - card_h;
            dragged_card.x = card_x;
            dragged_card.y = card_y;
        }
    }

    if (dragged_card !== undefined) {
        draw_card(ctx, dragged_card, 1.1);
    }

    if (received_mouse_x !== undefined && received_mouse_y !== undefined && !your_turn) {
        ctx.drawImage(images["cursor.png"], Math.round(smooth_mouse_x*w)+0.5, Math.round(smooth_mouse_y*h)+0.5);
        ctx.fillText(current_player, Math.round(smooth_mouse_x*w)+40.5, Math.round(smooth_mouse_y*h)+30.5);
    }
}

function draw_card(ctx, card, scale=1.0, no_shadow=false, extra_mark=false) {
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
        let the_card_ID = card_ID;
        if (card.is_hidden) {
            the_card_ID = "back";
        }
        ctx.drawImage(images[the_card_ID + ".png"], Math.round(x*w)+0.5, Math.round(y*h)+0.5, card_w, card_h);
    }

    ctx.shadowBlur = 0;

    if (extra_mark) {
        ctx.strokeStyle = "blue";
        ctx.lineWidth = 3;
        ctx.strokeRect(Math.round(x*w)+0.5, Math.round(y*h)+0.5, card_w, card_h);
    }
}

function card_dance() {
    for (let key in piles) {
        let pile = piles[key];
        let cards = pile.cards;
        for (let i = 0; i < cards.length; ++i) {
            let card = cards[i];

            card.x += 0.01*(Math.random() - 0.5);
            card.y += 0.01*(Math.random() - 0.5);
        }
    }
    draw_lower();
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

// In seconds
var draw_tick = 1.0/60;
var update_tick = 1.0/60;
var update_time = 0.0;
var ping_time = 1.0 / (3 + Math.random()); // A few times per second, not exactly the same for everyone
var ping_counter = 0;
function update() {
    if (winner !== undefined) {
        card_dance();
    }

    update_time += update_tick;
    if (update_time >= ping_time) {
        update_time = 0.0;

        real_time_update();

        ++ping_counter;
        if (ping_counter >= 10) {
            ping_counter = 0;

            if (current_player != player_name) 
                httpGetAsync("/view_game?game_id=" + game_id, load_state);
        }
    }
}

function real_time_update() {
    
    if (your_turn) {
        if (mouse_x !== undefined && mouse_y !== undefined) {
            let obj = {'x': mouse_x, 'y': mouse_y, 'card': "", 'from_pile': ""};
            if (dragged_card !== undefined) {
                obj.card = dragged_card.card;
                obj.from_pile = dragged_card.comes_from;
            }
            let json_str = JSON.stringify(obj);
            httpPostAsync("/real_time_pos?game_id=" + game_id, json_str, nada);
        }
    } else {
        httpGetAsync("/real_time_pos?game_id=" + game_id, show_real_time);
    }
}

function show_real_time(in_data) {
    let json_data;
    try {
        json_data = JSON.parse(in_data);
    } catch (e) {
        // Ignore this, it probably just means the player hasn't started yet
        return;
    }

    received_mouse_x = json_data.x;
    received_mouse_y = json_data.y;
    
    if (json_data.card !== "") {
        let from_pile = json_data.from_pile;
        let pile = piles[from_pile];
        if (pile === undefined) {
            alert("Real time error: Could not find pile " + from_pile);
        } else {
            let card_w = card_scale;
            let card_h = card_w*card_ar;
            let card_x = json_data.x - card_w/2;
            let card_y = json_data.y - card_h;

            if (dragged_card === undefined || dragged_card.card != json_data.card) {
                let found;
                for (let i = 0; i < pile.cards.length; ++i) {
                    let card = pile.cards[i];
                    if (card.card == json_data.card) {
                        found = i;
                    }
                }
                if (found !== undefined) {
                    dragged_card = pile.cards[found];
                    dragged_card.x = card_x;
                    dragged_card.y = card_y;

                    pile.cards.splice(found, 1);

                    draw_lower();
                } else {
                    alert("Real time error: Could not find card " + json_data.card);
                }
            }
        }
    }
}

function nada() {
    // nothing
}

// These take milliseconds
setInterval(draw_upper, 1000*draw_tick);
setInterval(update, 1000*update_tick);