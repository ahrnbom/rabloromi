# You only need to run this once!

from pathlib import Path
from zipfile import ZipFile

cards_folder = Path('static') / 'cards'

def verify():
  if not cards_folder.is_dir():
    return False 
    
  files = [f for f in cards_folder.glob('*') if f.is_file()]
  
  if len(files) >= 1:
    return True
  return False

def convert(zip_style):
  assert(len(zip_style) == 2)
  
  specials = {'1B': "back1", '1J': 'joker1', '2B': 'back2', '2J': 'joker2'}

  if zip_style in specials:
    return specials[zip_style]
  else:  
    card_type = zip_style[0]
    card_suit = zip_style[1]

    if card_type == "A":
      card_type = "1"
    elif card_type == "T":
      card_type = "10"
    elif card_type in "JKQ":
      card_type = card_type.lower()
    
    card_suit = card_suit.lower()

    return card_type + card_suit


def unpack_files():
  if not verify():
    print("Extracting files...")
    
    cards_zip = Path('static') / 'cards.zip'
      
    cards_folder.mkdir(exist_ok=True)
      
    with ZipFile(cards_zip) as z:
      for file_name in z.namelist():
        z.extract(file_name, cards_folder)
        file_path = cards_folder / file_name
        assert(file_path.is_file())

        new_path = cards_folder / f"{convert(file_path.stem)}.svg"
        file_path.rename(new_path)

        print(f"Extracted {new_path}...")
        
    print("Done!")


if __name__ == "__main__":
  main()
