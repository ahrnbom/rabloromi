from dataclasses import dataclass
import json

@dataclass
class RealTimePosition:
    card: str
    from_pile: str
    x: float
    y: float 

    @staticmethod
    def from_json(json_data):
        data = json.load(json_data)
        rtp = RealTimePosition(data['card'], data['from_pile'], data['x'], data['y'])
        return rtp

    def json(self):
        obj = dict()
        obj['card'] = self.card
        obj['from_pile'] = self.from_pile
        obj['x'] = self.x
        obj['y'] = self.y