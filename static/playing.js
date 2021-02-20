
window.onload = () => {
    var url = new URL(location.href);
    var game_id = url.searchParams.get("game_id");

    if (game_id) {
        start(game_id);
    } else {
        alert("Incorrect game id!");
    }

}

function start(game_id) {
    var canvas = document.getElementById("game_canvas");

    var w = canvas.clientWidth;
    var h = canvas.clientHeight;

    canvas.width = w;
    canvas.height = h;

    var ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, w, h);
    ctx.font = "16px Arial";
    ctx.fillText("Loading the game " + game_id + "...", 20, 20);
}