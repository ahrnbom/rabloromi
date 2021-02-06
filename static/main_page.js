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
    for (var i = 0; i < inputs.length; ++i) {
        names.push(inputs[i].value);
    }

    alert(names);
}