import json

with open('files/skins_not_grouped.json', 'r') as f:
    data = json.load(f)
    market_hash_names = [item['market_hash_name'] for item in data]

with open('files/market_hash_names.txt', 'w') as f:
    for market_hash_name in market_hash_names:
        f.write(market_hash_name + '\n')

print("Market hash names saved to files/market_hash_names.txt")