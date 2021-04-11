from random import shuffle


class Card:
  suits = ['c', 'd', 'h', 's', 'j']
  normal_suits = ['c', 'd', 'h', 's']
  min_rank = 1
  max_rank = 13

  long_suits = {'c': 'clubs', 'd': 'diamonds', 'h': 'hearts', 's': 'spades', 'j': 'joker'}
  suit_values = {'s': 0, 'd': 100, 'h': 300, 'c': 200, 'j':10000000}
  
  @staticmethod
  def rank_name(rank):
    if rank == 1:
      return 'ace'
    elif rank == 11:
      return 'jack'
    elif rank == 12:
      return 'queen'
    elif rank == 13:
      return 'king'
    return str(rank)
    
  def __init__(self, suit, rank):
    self.suit = suit
    self.rank = rank
    
    # suit is either "c" (clubs), "d" (diamonds), "h" (hearts), "s" (spades) or "j" (joker)
    # rank is 1 (ace), 2-10, 11 (jack), 12 (queen) or 13 (king)
    # the rank of jokers do not matter
    
    assert(self.suit in Card.suits)
    assert(isinstance(self.rank, int)) 
    assert(self.rank <= Card.max_rank and self.rank >= Card.min_rank)
    
    self.owner = None
    # when a card is played but the turn isn't finished, we need to keep track of who
    # it belongs to. Setting it to None means that it either belongs in the deck or the table
    
  def sorting_value(self):
    if self.suit == 'j':
      raise ValueError("Sorting value of jokers not defined, it depends on context")
    
    return Card.suit_values[self.suit] + self.rank
  
  def hand_card_value(self):
    return self.rank + 0.0001*Card.suit_values[self.suit]
  
  def __repr__(self):
    suit = Card.long_suits[self.suit]
    rank = Card.rank_name(self.rank)
    
    short_rank = rank
    if self.rank > 10:
      short_rank = rank[0]
    elif self.rank == 1:
      short_rank = '1'
    
    if suit == 'joker':
      s = "joker: "
    else:
      s = f"{short_rank}{self.suit}: "
    
    if suit == 'joker':
      s += f"joker number {self.rank}"
    else:
      s += f"{rank} of {suit}"
    
    if self.owner is not None:
      s += f" ({self.owner})"
    
    return s
    
class Deck:
  def __init__(self, jokers=6):
    # rablorömi uses two decks with a varying amount of jokers
    # more jokers makes the game easier and faster
    
    self.jokers = jokers # in case you want to display the number of jokers during the game or something..?
    
    self.cards = list()
    
    for suit in Card.normal_suits:
      for rank in range(Card.min_rank, Card.max_rank+1):
        card1 = Card(suit, rank)
        card2 = Card(suit, rank)
        
        self.cards.extend([card1, card2])
        
    for i in range(jokers):
      self.cards.append(Card('j', i+1)) # jokers get different ranks just in case you'd need to tell them apart, but I don't think that'll be necessary
      
    shuffle(self.cards)
    
  def __len__(self):
    return len(self.cards)

  def draw(self):
    if self.is_empty():
      return None
      
    return self.cards.pop()
    
  def draw_hand(self, player_id, n=10):
    hand = list()
    
    for _ in range(n):
      card = self.draw()
      
      if card is None:
        raise ValueError("Too few cards in deck to draw a hand!")
      
      card.owner = player_id
      hand.append(card)
      
    return hand
    
  def is_empty(self):
    if self.cards:
      return False
    return True
  
  