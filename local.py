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
    action = input("What do you want to do? Your choice: ")
    if action == 'help':
      print('Available actions:')
      print("""
    - 'play CARD_NAME'                  - plays that card on a new pile
    - 'play CARD_NAME PILE_ID'          - plays that card on a given pile
    - 'move CARD_NAME FROM_PILE TO_PILE - move a card from one pile to another
    - 'view'                            - display the state of the game
    - 'keso'                            - finishes your turn
    - 'retreat'                         - take back all your cards
    - 'save GAME_ID'                    - save the game to disk
    - 'load GAME_ID'                    - loads the game from disk
    - 'exit'                            - close the game
      
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
          try:
            pile_id = int(actions[2])
          except:
            print(f"{actions[2]} is not a valid pile number")
        else:
          pile_id = None
        
        try:
          game.place_card(card, pile_id)
        except ValueError as err:
          print(f"Something went wrong: {err}")
        
    elif action.startswith('move'):
      actions = action.split(' ')
      card_name = actions[1]
      
      try:
        from_pile = int(actions[2])
      except:
        print(f"{actions[2]} is not a valid pile number")
        
      to_pile = None
      if len(actions) > 3:
        try:
          to_pile = int(actions[3])
        except:
          print(f"{actions[3]} is not a valid pile number")
          continue
      
      card = game.find_card_in_pile(card_name, from_pile)
      if card is None:
        print(f"Card {card_name} not found in pile {from_pile}")
      
      try:
        game.move_card(card, from_pile, to_pile)
        print(f"Moved {card} from pile {from_pile} to {to_pile}")
      except ValueError as err:
        print(f"Something went wrong: {err}")
      
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
      result = game.retreat()

      if result:
        print(f"Took back all {game.turn}'s cards")
      else:
        print("Cannot retreat the same turn you got into the game!")
        
    elif action.startswith('save'):
      game_id = action.split(' ')[1]
      game.save(game_id)
      print(f"Game saved as {game_id}")
      
    elif action.startswith('load'):
      game_id = action.split(' ')[1]
      try:
        game = Game.load(game_id)
      except ValueError as err:
        print(f"Could not load game {game_id} because of error:")
        print(err)
    
    elif action == 'exit':
      import sys
      sys.exit()
    
    else:
      print("Unknown action. Please try again. Type 'help' for a list of commands.")
  
if __name__ == "__main__":
  main()