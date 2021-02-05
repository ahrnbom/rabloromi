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

def unpack_files():
  if not verify():
    print("Extracting files...")
    
    cards_zip = Path('static') / 'cards.zip'
      
    cards_folder.mkdir(exist_ok=True)
      
    with ZipFile(cards_zip) as z:
      for file_name in z.namelist():
        z.extract(file_name, cards_folder)
        print(f"Extracted {file_name}...")
        
    print("Done!")


if __name__ == "__main__":
  main()
