""" A module for a filesystem cache
    Allows read and write of files to RAM, and these are regularly flushed onto disk
"""

import threading
from pathlib import Path
from datetime import datetime, timedelta
from time import sleep

class FSCache:
    def __init__(self, update_freq=timedelta(minutes=2.0)):
        self.update_freq = update_freq

        def thread_update():
            while True:
                sleep(update_freq.total_seconds())
                self.flush()

        self.flushing_thread = threading.Thread(target=thread_update)
        self.flushing_thread.daemon = True # allows Ctrl + C to kill the program
        self.flushing_thread.start()

        self.tmp_storage = dict()

        self.lock = threading.Lock()

    # Note: this does not (always) happen automatically upon Ctrl + C
    def __del__(self):
        self.flush()
        print("Safely flushed files before destruction!")

    def exists(self, path: Path):
        with self.lock:
            if path in self.tmp_storage:
                return True
        
        return path.is_file()

    def write(self, data: bytes, path: Path):
        with self.lock:
            self.tmp_storage[path] = data

    def read(self, path: Path):
        with self.lock:
            if path in self.tmp_storage:
                data = self.tmp_storage[path]
                assert(isinstance(data, bytes))
                return data
            else:
                if path.is_file():
                    data = path.read_bytes()
                    return data
                else:
                    raise ValueError(f"Could not find file {path}, neither in cache nor on disk")

    def flush(self):
        with self.lock:
            paths = list(self.tmp_storage.keys())
            for path in paths:
                data = self.tmp_storage.pop(path)
                path.write_bytes(data)
        print(f" -> Flushed files!  {datetime.now()}")
            