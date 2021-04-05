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

@api.route('/view_game', methods=['GET'])
def view_game():
  game_id = request.args.get('game_id', type=str, default=None)

  if game_id is None:
    return "Invalid game ID", 400
  
  try:
    game = Game.load(game_id)
  except ValueError as err:
    return f"Something went wrong: {err}", 400 
  except:
    return "Failed to load game due to some unforeseen error", 400

  return game.json(), 200

@api.route('/move_card', methods=['GET'])
def move_card():
  game_id = request.args.get('game_id', type=str, default=None)
  player = request.args.get('player', type=str, default=None)
  card_name = request.args.get('card', type=str, default=None)
  from_pile = request.args.get('from', type=str, default=None)
  to_pile = request.args.get('to', type=str, default=None)

  inputs = [game_id, player, card_name, from_pile, to_pile]
  if any([x is None for x in inputs]):
    return "Some input variable is missing", 400

  try:
    game = Game.load(game_id)
  except ValueError as err:
    return f"Something went wrong: {err}", 400 
  except:
    return "Failed to load game due to some unforeseen error", 400
  
  if not (player == game.turn):
    return "Not your turn!", 400

  if from_pile == player:
    # Trying to play a card from the hand
    to_pile = int(to_pile)
    if to_pile == -1:
      to_pile = None 
      # Create a new pile

    card = game.find_card(card_name, player)
    if card is None:
      return f"Could not find card {card_name} in {player}'s hand", 400
    
    try:
      game.place_card(card, to_pile)
    except Exception as err:
      return f"Something went wrong: {err}", 400
    
  elif to_pile == player:
    # Trying to take a card into the hand
    from_pile = int(from_pile)

    card = game.find_card_in_pile(card_name, from_pile)
    if card is None:
      return f"Could not find card {card_name} in pile {from_pile}", 400
    
    try:
      game.take_back(card, from_pile)
    except ValueError as err:
      return f"Something went wrong: {err}", 400

  else:
    # Move a card already on the board
    from_pile, to_pile = [int(x) for x in (from_pile, to_pile)]

    card = game.find_card_in_pile(card_name, from_pile)
    if card is None:
      return f"Could not find card {card_name} in {from_pile}", 400
    
    try:
      game.move_card(card, from_pile, to_pile)
    except ValueError as err:
        return f"Something went wrong: {err}", 400

  game.save(game_id)
  return "ok", 200

if __name__ == '__main__':
  unpack_files()
  api.run()