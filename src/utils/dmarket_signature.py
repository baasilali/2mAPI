import os
import dotenv

from datetime import datetime

from nacl.bindings import crypto_sign
import requests

dotenv.load_dotenv()

public_key = os.getenv("DMARKET_PUBLIC_KEY")
secret_key = os.getenv("DMARKET_SECRET_KEY")

rootApiUrl = "https://api.dmarket.com"
requestPath = "/exchange/v1/market/items?"
params = {
    "gameId": "a8db",
    "title": "★ Hand Wraps | Spruce DDPAT (Battle-Scarred)",
    "currency": "USD",
    "orderDir": "asc",
    "limit": 1
}

for key, value in params.items():
    if isinstance(value, list):
        for item in value:
            requestPath += f"{key}={item}&"
    else:
        requestPath += f"{key}={value}&"

requestPath = requestPath[:-1]

nonce = str(round(datetime.now().timestamp()))
method = "GET"
string_to_sign = method + requestPath + nonce
signature_prefix = "dmar ed25519 "
encoded = string_to_sign.encode('utf-8')
secret_bytes = bytes.fromhex(secret_key)
signature_bytes = crypto_sign(encoded, bytes.fromhex(secret_key))
signature = signature_bytes[:64].hex()
request_sign = signature_prefix + signature
headers = {
    "X-Api-Key": public_key,
    "X-Request-Sign": request_sign,
    "X-Sign-Date": nonce
}

# print(rootApiUrl + requestPath)
# print(headers)

resp = requests.get(rootApiUrl + requestPath, headers=headers)
print(resp.text)