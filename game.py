from itertools import cycle
import json
import pickle
from pathlib import Path

from cards import Card, Deck

def validate_player_name(player_id):
  if player_id in ["true", "false", "", None, "undefined", "0"]:
    return False
  
  # If the player's name can be converted to an integer or float, it is not allowed
  try:
    _ = int(player_id)
    return False
  except:
    pass

  try:
    _ = float(player_id)
    return False
  except:
    pass

  return True

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
         
        # Actually, this would mean that two aces of the same suit and 
        # 12 jokers in between them would not be a valid chain, which it
        # technically should, but it's such a stupid and infeasible scenario 
        # that I'm going to ignore it, at least for now 
        
        
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
  storage = Path('.') / 'games'

  @staticmethod
  def list_games():
    storage = Game.storage
    
    folders = [f for f in storage.glob('*') if f.is_dir()]
    
    games = list()
    
    for folder in folders:
      players_file = folder / "players.txt"
      if not players_file.is_file():
        continue
      
      players = players_file.read_text().split('\n')
      
      name_file = folder / "name.txt"
      if not name_file.is_file():
        continue
      
      name = name_file.read_text().strip('\n')
      
      game_id = folder.name
      
      games.append( {'id':game_id, 'name': name, 'players':players} )
    
    return games

  @staticmethod
  def load(game_id):
    storage = Game.storage
    
    folder = storage / str(game_id)
    if not folder.is_dir():
      raise ValueError(f"Game with ID {game_id} does not exist")
    
    file_path = folder / f"{game_id}.pickle"
    if not file_path.is_file():
      raise ValueError(f"Game with ID {game_id} does not exist")
    
    try:
      with file_path.open('rb') as f:
        game = pickle.load(f)
    except:
      raise ValueError(f"Game {game_id} is corrupt")
    
    return game

  def __init__(self, player_ids, is_local=False, game_name="Untitled_game"):
    self.player_ids = list(player_ids)
    if any([not validate_player_name(player_id) for player_id in self.player_ids]):
      raise ValueError("One of the player names is not allowed!")
    
    if not len(set(self.player_ids)) == len(self.player_ids):
      raise ValueError("The same name occurs more than once!")

    self.turns = cycle(self.player_ids)
    
    self.piles = dict()
    # the keys are pile IDs, and the values are Piles. Pile IDs can be numbers
    self.deck = Deck()
    
    self.hands = dict() # maps player IDs to a list of cards in the hand
    
    for player_id in player_ids:
      self.hands[player_id] = self.deck.draw_hand(player_id)
      
    self.turn = self.next_turn()
    
    self.is_local = is_local
    
    # Players who have played a valid pile from their hand are in the game, and their IDs are stored here
    self.players_in_game = set()
    
    self.save_initial_state()
    
    self.name = game_name
  
  def save(self, game_id=None):
    if game_id is None:
      game_id = self.name
      
    game_id = str(game_id)
  
    storage = Game.storage
    storage.mkdir(exist_ok=True)
    
    folder = storage / game_id
    folder.mkdir(exist_ok=True)
    
    file_path = folder / f"{game_id}.pickle"
    with file_path.open('wb') as f:
      pickle.dump(self, f, pickle.HIGHEST_PROTOCOL)
    
    (folder / 'name.txt').write_text(self.name)
    
    (folder / 'players.txt').write_text('\n'.join(self.player_ids))
    
    
  def next_pile_id(self):
    if self.piles:
      pile_ids = list(self.piles.keys())
      return max(pile_ids) + 1
    else:
      return 1
      
  def next_turn(self):
    return next(self.turns) # a player ID
  
  def find_card(self, short, player_id):
    hand = self.hands[player_id]
    for card in hand:
      if str(card).startswith(short):
        return card
    return None
  
  def find_card_in_pile(self, short, pile_id):
    if not pile_id in self.piles:
      return None
    
    pile = self.piles[pile_id]
    
    for card in pile.cards:
      if str(card).split(':')[0] == short:
        return card
    
    return None
  
  def place_card(self, card, to_id=None):
    # to_id == None means create a new pile
    
    if to_id is None:
      to_id = self.next_pile_id()
    
    if not to_id in self.piles:
      self.piles[to_id] = Pile()
    
    to_pile = self.piles[to_id]
    
    if not (self.turn in self.players_in_game):
      # If there are any cards not belonging to this player, this move is illegal!
      for old_card in to_pile.cards:
        if not (old_card.owner == self.turn):
          raise ValueError(f"Player {self.turn} is not in the game yet! You need to first play a valid pile from your hand, before you can interact with others' cards")
    
    to_pile.add(card)
    
    self.hands[self.turn].remove(card)
  
  def move_card(self, card, from_id, to_id=None):
    # to_id == None means create a new pile
    
    if not (self.turn in self.players_in_game):
      raise ValueError(f"Player {self.turn} is not in the game yet! Play a valid pile from your hand first")
    
    from_pile = self.piles[from_id]
    
    if to_id is None:
      to_id = self.next_pile_id()
    
    if not to_id in self.piles:
      self.piles[to_id] = Pile()
      
    to_pile = self.piles[to_id]
    
    if not card in from_pile.cards:
      raise ValueError(f"Card {card} not in list with ID {from_id}")
    
    from_pile.remove(card)
    to_pile.add(card)
  
  def finish(self):
    for pile_id, pile in self.piles.items():
      if not pile.validate():
        return False, None
    
    if not (self.turn in self.players_in_game):
      # Check if the player is in the game now
      in_game_now = False
      
      for pile_id, pile in self.piles.items():
        ok = True
        
        for card in pile.cards:
          if not (card.owner == self.turn):
            ok = False
        
        if ok:
          in_game_now = True
      
      if in_game_now:
        self.players_in_game.add(self.turn)
        
    # Now, all your cards belong to the table!
    has_played = False
    for pile_id, pile in self.piles.items():
      for card in pile.cards:
        if card.owner == self.turn:
          card.owner = None
          has_played = True
    
    if not has_played:
      card = self.deck.draw()
      card.owner = self.turn
      self.hands[self.turn].append(card)
    else:
      card = None
    
    self.turn = self.next_turn()
    
    pile_id_to_remove = list()
    for pile_id, pile in self.piles.items():
      if not pile.cards:
        pile_id_to_remove.append(pile_id)
    
    for pile_id in pile_id_to_remove:
      self.piles.pop(pile_id)
    
    self.save_initial_state()
    
    return True, card
  
  def take_back(self, card, from_id):
    if not card.owner == self.turn:
      raise ValueError("Tried to take back a card that does not belong to you")

    pile = self.piles[from_id]
    pile.cards.remove(card)
    self.hands[self.turn].append(card)

  def retreat(self):
    # the player wants all their cards back

    for pile in self.piles.values():
      to_remove = list()
      
      for card in pile.cards:
        if card.owner == self.turn:
          to_remove.append(card)
          self.hands[self.turn].append(card)
          
      for card in to_remove:
        pile.cards.remove(card)
    
    remaining_cards = list()
    for pile in self.piles.values():
      remaining_cards.extend(pile.cards)
    
    self.restore_initial_state(remaining_cards)

    return True
    
  def json(self):
    # get a json description of the state of the game
    obj = dict()
  
    obj['players'] = self.player_ids
    
    obj['players_in_game'] = list(self.players_in_game)
  
    obj['cards_in_deck'] = len(self.deck)

    obj['hands'] = dict()
    for player_id in self.player_ids:
      hand = self.hands[player_id]
      hand.sort(key=lambda x: x.hand_card_value())
      obj['hands'][player_id] = [str(card) for card in hand]
      
    obj['piles'] = dict()
    for pile_id, pile in self.piles.items():
      if pile.validate():
        valid = 'yes'
      else:
        valid = 'no'
      
      pile_cards = [str(card) for card in pile.cards]
      pile_obj = {'ID': pile_id, 'valid': valid, 'cards': pile_cards}
      obj['piles'][pile_id] = pile_obj
    
    obj['turn'] = self.turn
    
    indent = None
    if self.is_local:
      indent = 2
    
    return json.dumps(obj, indent=indent)
    
  def save_initial_state(self):
    obj = dict()
    for pile_id, pile in self.piles.items():
      pile_list = [str(card) for card in pile.cards]
      obj[pile_id] = pile_list
    
    self.initial_state = json.dumps(obj)
    
  def restore_initial_state(self, cards):    
    self.piles = dict()
    obj = json.loads(self.initial_state)

    for pile_id, pile_list in obj.items():
      pile_cards = list()
      for pile_str in pile_list:
        card_id = pile_str.split(':')[0]
        
        found = None
        for card in cards:
          card_str = str(card).split(':')[0]
          
          if card_id == card_str:
            found = card
        
        if found is None:
          raise ValueError("Initial state contains cards we don't have")
        
        cards.remove(found)
        pile_cards.append(found)
        
      self.piles[int(pile_id)] = Pile(pile_cards)
    
    if cards:
      raise ValueError("Some cards were not in the initial state...?")
      
if __name__ == "__main__":
  print("This is not intended to be run as a script. You probably want to run server.py, to play online, or local.py, to play in the terminal")