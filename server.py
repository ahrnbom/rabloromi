from flask import Flask, json
from pathlib import Path

from game import Game

api = Flask(__name__)


@api.route('/games', methods=['GET'])
def get_games():
  return json.dumps(Game.list_games())

if __name__ == '__main__':
  api.run()