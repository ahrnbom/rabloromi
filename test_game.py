from pathlib import Path

from game import Game, Pile
from cards import Card, Deck

def test_validation():
  verify_pile(Pile(cards=[Card('s',1)]), False)
  verify_pile(Pile(cards=[Card('s',1), Card('s',2), Card('s',3)]), True)
  verify_pile(Pile(cards=[Card('s',1), Card('s',1), Card('s',2), Card('s',3), Card('s',4), Card('s',5), Card('s',6), Card('s',7), Card('s',8), Card('s',9), Card('s',10), Card('s',11), Card('s',12), Card('s',13)]), True)
  verify_pile(Pile(cards=[Card('s',1), Card('c',1), Card('s',2), Card('s',3), Card('s',4), Card('s',5), Card('s',6), Card('s',7), Card('s',8), Card('s',9), Card('s',10), Card('s',11), Card('s',12), Card('s',13)]), False)
  verify_pile(Pile(cards=[Card('s',1), Card('c',2), Card('s', 3)]), False)
  verify_pile(Pile(cards=[Card('s',4), Card('c',4), Card('d', 4)]), True)
  verify_pile(Pile(cards=[Card('s',4), Card('c',4), Card('d', 4), Card('h', 4)]), True)
  verify_pile(Pile(cards=[Card('s',4), Card('c',4), Card('d', 4), Card('c', 4)]), False)
  
  pile = Pile(cards=[Card('s',4), Card('j', 4), Card('c',4)])
  verify_pile(pile, True)
  assert(pile.cards[-1].suit == 'j')
  
  pile = Pile(cards=[Card('h', 1), Card('h', 12), Card('h', 13)])
  verify_pile(pile, True)
  assert(pile.cards[-1].rank == 1)
  
  pile = Pile(cards=[Card('h', 1), Card('j', 0), Card('h', 13)])
  #pile.validate()
  (Path('.') / 'lol.txt').write_text(str(pile))
  verify_pile(pile, True)
  assert(pile.cards[-1].rank == 1)
  
  
  # For debugging these tests:
  #(Path('.') / 'lol.txt').write_text(str(pile))
  

def verify_pile(pile, expected):
  res = pile.validate()
  assert(res == expected)