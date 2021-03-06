# You only need to run this once!

from pathlib import Path
from zipfile import ZipFile

cards_folder = Path('static') / 'cards'

def verify():
  if not cards_folder.is_dir():
    return False 
    
  files = [f for f in cards_folder.glob('*.png') if f.is_file()]
  
  if len(files) >= 1:
    return True
  return False

def convert(zip_style):
  if zip_style == "back":
    return zip_style
    
  map_types = {'ace': '1', 'king': 'k', 'queen': 'q', 'jack': 'j'}

  if "joker" in zip_style:
    card_col, _ = zip_style.split('_')
    card_type = "joker"
    card_suit = ""
    if card_col == "red":
      card_suit = "2"
  else:
    card_type, _, card_suit = zip_style.split('_')
    card_suit = card_suit[0]

    if card_type in map_types:
      card_type = map_types[card_type]

  return card_type + card_suit


def unpack_files():
  if not verify():
    print("Extracting files...")
    
    cards_zip = Path('static') / 'cards.zip'
      
    cards_folder.mkdir(exist_ok=True)
    for path in cards_folder.glob('*.svg'):
      path.unlink()
    for path in cards_folder.glob('*.png'):
      path.unlink()


    with ZipFile(cards_zip) as z:
      for file_name in z.namelist():
        z.extract(file_name, cards_folder)
        file_path = cards_folder / file_name
        assert(file_path.is_file())

        new_path = cards_folder / f"{convert(file_path.stem)}.png"
        file_path.rename(new_path)
        assert(new_path.is_file())

        print(f"Extracted {new_path}...")
        
    print("Done!")


if __name__ == "__main__":
  unpack_files()
