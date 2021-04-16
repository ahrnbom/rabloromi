from server import api
from unpack import unpack_files

if __name__ == "__main__":
    unpack_files()
    api.run()