from flask import Flask, json, Response
from pathlib import Path

from game import Game
from unpack import unpack_files

api = Flask(__name__)

@api.route('/', methods=['GET'])
def main_page():
    content = Path('static') / 'index.html'
    assert(content.is_file())
    return Response(content.read_text(), mimetype="text/html")

@api.route('/games', methods=['GET'])
def get_games():
  return json.dumps(Game.list_games())

if __name__ == '__main__':
  unpack_files()
  api.run()