from flask import Flask, json, Response, request
from pathlib import Path
import uuid

from game import Game
from unpack import unpack_files

api = Flask(__name__)

def ok_str(s):
  assert(isinstance(s, str))
    
  for char in s:
    if not char in 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890_':
      return False
  
  return True

@api.route('/', methods=['GET'])
def main_page():
    content = Path('static') / 'index.html'
    assert(content.is_file())
    return Response(content.read_text(encoding='utf-8'), mimetype="text/html")

@api.route('/games', methods=['GET'])
def get_games():
  player = request.args.get('player', type=str, default='')
  
  games = Game.list_games()
  if player:
    games = [g for g in games if player in g['players']]

  return json.dumps(games)

@api.route('/host', methods=['GET'])
def host_game():
  players = request.args.get('players', type=str, default='some_player,another_player')
  players = players.split(',')
  
  if len(players) < 2:
    return "Error: Too few players", 400
  
  for player in players:
    if not ok_str(player):
      return "Illegal character used in one of the players names. Only letters, numbers and underscores are allowed.", 400
  
  game_name = request.args.get('game_name', type=str, default='')
  if not ok_str(game_name):
    return "Illegal game name", 400
  
  if not game_name:
    # Make something up 
    game_name = f"Untitled_{uuid.uuid4()}"
  
  game = Game(players, game_name=game_name)
  game.save()
  
  return f"Successfully created game {game_name}", 200

if __name__ == '__main__':
  unpack_files()
  api.run()