# Note - local play only works with open hands!

from game import Game

def get_player_ids():
  ids = list()
  next = 'fnjsfjkalefbesg '
  while True:
    next = input(f"Enter name for player {len(ids)+1}: ")
    if next:
      ids.append(next)
    else:
      break
  
  return ids

def main():
  player_ids = get_player_ids()
  
  game = Game(player_ids, is_local=True)
  
  print("You can always type 'help' for a list of commands.")
  
  while True:
    turn = game.turn
  
    action = input("What do you want to do? Your choice: ")
    if action == 'help':
      print('Available actions:')
      print("""
      - 'play CARD_NAME'          - plays that card on a new pile
      - 'play CARD_NAME PILE_ID'  - plays that card on a given pile
      - 'view'                    - display the state of the game
      - 'keso'                    - finishes your turn
      - 'retreat'                 - take back all your cards
      - 'exit'                    - close the game
      
      Note that CARD_NAME should be on the following format:
      2d     - 2 of diamonds
      10c    - 10 of clubs
      js     - jack of spades
      1h     - ace of hearts
      joker  - joker
      """)
    elif action == 'view':
      print(game.json())
    elif action.startswith('play'):
      actions = action.split(' ')
      card = game.find_card(actions[1], game.turn)
      if card is None:
        print("Could not find the card you specified")
      else:
        if len(actions) > 2:
          pile_id = int(actions[2])
        else:
          pile_id = None
        game.place_card(card, game.turn, pile_id)
    elif action == 'keso':
      old_turn = game.turn
      out, drew = game.finish()
      if out:
        print("Turn finished!")
        if drew is not None:
          print(f"{old_turn} drew {drew}")
        print(f"{game.turn}'s turn.")
      else:
        print("Turn could not finish! You still have some invalid piles on the table")
    elif action == 'retreat':
      game.retreat()
      print(f"Took back all {game.turn}'s cards")
    elif action == 'exit':
      import sys
      sys.exit()
    else:
      print("Unknown action. Please try again. Type 'help' for a list of commands.")
  
if __name__ == "__main__":
  main()