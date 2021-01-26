# Rablorömi for Python

This is a Python implementation of a Hungarian card game called Rablrömi, or rather, my family's variant of it. The game is sometimes known as Robber's Rummy in English.

The idea is to implement it in Python, with a web interface in HTML/JS to allow online play, both in real time and as a correspondance game (although real time, with some kind of VOIP solution like Discord, is probably the most fun).

The web interface will use card designs from [Adrian Kennard](https://www.me.uk/cards/), which are in the public domain. 

More details and instructions are coming soon...

### Dependencies

1. Python 3.X
1. Flask: `pip install flask`

### Instructions for hosting a server

`python server.py`

You can then visit the server using a web browser. More instructions are coming soon... Maybe.

### Instructions for local play

`python local.py`

You will be asked to enter the players' names. Leave the next name empty to begin the game. You can always type `help` for a list of commands, and `view` to view the current state of the game.

Local play is only with open hands, so everyone can see everyone's cards. This is not ideal, but local play was always intended for testing purposes anyway.


