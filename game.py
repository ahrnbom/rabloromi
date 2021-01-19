from itertools import cycle

from cards import Card, Deck

class Pile:
  def __init__(self, cards=[]):
    self.cards = list()
    self.cards.extend(cards)
    
  def add(self, card):
    self.cards.append(card)
  
  def remove(self, card):
    self.cards.remove(card)
  
  def validate(self):
    if len(self.cards) == 0:
      return True
    elif len(self.cards) < 3:
      return False
    # Now the pile has at least three cards
    
    # Temporarily remove jokers
    jokers = [card for card in self.cards if card.suit == 'j']
    for joker in jokers:
      self.cards.remove(joker)
    
    # Sort remaining cards
    self.cards.sort(key = lambda x: x.sorting_value())
    
    first_rank = self.cards[0].rank
    if all(first_rank == card.rank for card in self.cards):
      # all have the same rank! it's a collection! Is it valid?
      # must have all the suits different
      
      found_suits = [card.suit for card in self.cards]
      if len(set(found_suits)) == len(self.cards):
        # all suits must be different!
        self.cards.extend(jokers)
        return True
      else:
        self.cards.extend(jokers)
        return False 
        """ 
        Actually, this would mean that two aces of the same suit and 
        12 jokers in between them would not be a valid chain, which it
        technically should, but it's such a stupid and infeasible scenario 
        that I'm going to ignore it, at least for now 
        """
        
    first_suit = self.cards[0].suit
    if all(first_suit == card.suit for card in self.cards):
      # all have the same suit. Is this a valid chain?
      
      # Depending on how many aces we have, we may need special logic to take into account
      # that an ace could be either a 1 or a 14.
      aces = [card for card in self.cards if card.rank == 1]
      if len(aces) == 0:
        return validate_chain(self.cards, jokers)
      elif len(aces) == 1:
        # ace could be either a 1 or a 14
        if validate_chain(self.cards, jokers):
          return True
        else:
          ace = aces[0]
          self.cards.remove(ace)
          ace.rank = 14
          self.cards.append(ace)
          print(self)
          if validate_chain(self.cards, jokers):
            ace.rank = 1
            return True
          else:
            self.cards.remove(ace)
            self.cards.insert(0, ace)
            ace.rank = 1
      elif len(aces) == 2:
        # For a chain with two aces, the only option is for one of them to be a 1 
        # and the other a 14
        ace_14 = aces[1]
        ace_14.rank = 14
        self.cards.remove(ace_14)
        self.cards.append(ace_14)
        if validate_chain(self.cards, jokers):
          ace_14.rank = 1
          return True
        else:
          self.cards.remove(ace_14)
          self.cards.insert(0, ace_14)
          ace_14.rank = 1
          
    self.cards.extend(jokers)      
    return False
  
  def __repr__(self):
    if not self.cards:
      return "Empty pile"
    
    s = 'Pile:'
    for card in self.cards:
      s += f"{card},"
    return s[:-1]


def validate_chain(cards, jokers):
  """ 
  This is a part of pile.validate, and has some peculiar requirements.
  If returning true, the jokers must be inserted in the correct places 
  in the list called cards. If returning false, no jokers can remain in
  the list.
  
  The goal is to check if the list contains a valid chain. No need to check
  that all the suits are identical, this has already been done. Any 'holes'
  in the chain should be filled with jokers, if possible. 
  """
  
  ranks = [x.rank for x in cards]
  for rank in range(min(ranks), max(ranks)+1):
    count = len([r for r in ranks if r==rank])
    if count > 1:
      # bail
      for card in cards:
        if card.suit == 'j':
          cards.remove(card)
          jokers.append(card)
      return False
    elif count == 0:
      # use a joker, if we have one
      if jokers:
        index = rank - min(ranks)
        joker = jokers.pop()
        cards.insert(index, joker)
      else:
        # bail
        for card in cards:
          if card.suit == 'j':
            cards.remove(card)
            jokers.append(card)
        return False
  
  """
  We should now put back any remaining jokers
  Here, we just check if the top ace exists, and if so, jokers are placed at
  the beginning. But technically, there could be situations where this isn't expected,
  like if you have a chain with [jack, queen, king, joker, joker] in which case
  you'd expect one joker in the front and one in the back, but I can't think of
  an easy way to take this into account
  """ 
  if max(ranks) == 14:
    cards[0:0] = jokers
  else:
    cards.extend(jokers)
  return True
  
  
class Game:
  def __init__(self, player_ids):
    self.player_ids = player_ids
    self.turns = cycle(self.player_ids)
    
    self.board = dict()
    # the keys are pile IDs, and the values are Piles. Pile IDs can be numbers or the string "tmp" for cards that are loose on the table
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