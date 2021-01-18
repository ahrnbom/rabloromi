from itertools import cycle

from cards import Card, Deck

class Game:
  def __init__(self, player_ids):
    self.player_ids = player_ids
    self.turns = cycle(self.player_ids)
    
    self.board = dict()
    # the keys are pile IDs, and the values are lists of cards. Pile IDs can be numbers or the string "tmp" for cards that are loose on the table
    self.board['tmp'] = list()
    
  def next_turn(self):
    return next(self.turns) # a player ID
  
  def move_card(from_id, to_id, card):
    from_list = self.board[from_id]
    to_list = self.board[to_id]
    
    if not card in from_list:
      raise ValueError(f"Card {card} not in list with ID {from_id}")
    
    from_list.remove(card)
    to_list.append(card)
    to_list.sort() # make sure chains are in correct order
    

if __name__ == "__main__":
  print("This is not intended to be run as a script. You probably want to run server.py, to play online, or local.py, to play in the terminal")
  