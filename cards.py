from random import shuffle

  

class Card:
  suits = ['c', 'd', 'h', 's', 'j']
  normal_suits = ['c', 'd', 'h', 's']
  min_rank = 0
  max_rank = 13

  long_suits = {'c': 'clubs', 'd': 'diamonds', 'h': 'hearts', 's': 'spades', 'j': 'joker'}
  
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
    
  def __repr__(self):
    suit = Card.long_suits[self.suit]
    rank = Card.rank_name(self.rank)
    
    if suit == 'joker':
      return f"joker number {rank}"
    else:
      return f"{rank} of {suit}"
    
class Deck:
  def __init__(self, jokers=4):
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
      self.cards.append(Card('j', i+1)) # jokers get different ranks just in case you'd need to tell them apart, but I don't think that'll be necessary)
      
    shuffle(self.cards)
    
  def draw(self):
    if self.is_empty():
      return None
      
    return self.cards.pop()
    
  def draw_hand(self, player_id, n=10):
    hand = list()
    
    for i in range(n):
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
  
  