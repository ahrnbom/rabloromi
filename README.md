# Rablor�mi for Python

This is a Python implementation of a Hungarian card game called Rablr�mi, or rather, my family's variant of it. The game is sometimes known as Robber's Rummy in English.

The idea is to implement it in Python, with a web interface in HTML/JS to allow online play, both in real time and as a correspondance game (although real time, with some kind of VOIP solution like Discord, is probably the most fun).

The web interface uses card designs from [this project](https://code.google.com/archive/p/vector-playing-cards/), which are in the public domain. 

### Dependencies

1. Python 3.X
1. Flask: `pip install flask`

### Instructions for hosting a server

To start the server, run:

`python server.py`

You can then visit the server using a web browser. More instructions are coming soon... Maybe.

### Instructions for local play (for testing)

`python local.py`

You will be asked to enter the players' names. Leave the next name empty to begin the game. You can always type `help` for a list of commands, and `view` to view the current state of the game.

Local play is only with open hands, so everyone can see everyone's cards. This is not ideal, but local play is intended for testing purposes anyway.