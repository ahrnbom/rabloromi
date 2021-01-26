# You only need to run this once!

from pathlib import Path
from zipfile import ZipFile

def main():
  cards_zip = Path('static') / 'cards.zip'
  
  cards_folder = Path('static') / 'cards'
  cards_folder.mkdir(exist_ok=True)
  
  with ZipFile(cards_zip) as z:
    for file_name in z.namelist():
      z.extract(file_name, cards_folder)
      print(f"Extracted {file_name}...")
      
  print("Done!")


if __name__ == "__main__":
  main()
