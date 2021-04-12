from dataclasses import dataclass
import json

# card == "" means no card, just the mouse

@dataclass
class RealTimePosition:
    card: str
    from_pile: str
    x: float
    y: float

    @staticmethod
    def from_json(data):
        rtp = RealTimePosition(data['card'], data['from_pile'], data['x'], data['y'])
        return rtp

    def json(self):
        obj = dict()
        obj['card'] = self.card
        obj['from_pile'] = self.from_pile
        obj['x'] = self.x
        obj['y'] = self.y

        return json.dumps(obj)