'''
    create a python script that makes a request to https://api.skinport.com/v1/items with the following parameters:
    - app_id: 730
    - currency: USD

    and the following header:
    'Accept-Encoding': 'br'

    and save the response as a json named skinport_data.json in the files/skinport directory.

    The response is encoded in Brotli compression, so you need to decode it to save it correctly 
'''
import requests
import brotli
import json
import gzip
from pathlib import Path

url = "https://api.skinport.com/v1/items"
params = {
    "app_id": 730,
    "currency": "USD"
}

try:
    # Let requests handle decompression automatically
    response = requests.get(url, params=params)
    
    # Check if request was successful
    response.raise_for_status()
    
    # Print response info for debugging
    print(f"Response status: {response.status_code}")
    print(f"Content-Encoding: {response.headers.get('Content-Encoding')}")
    print(f"Content-Type: {response.headers.get('Content-Type')}")
    
    # Parse JSON directly from response
    json_data = response.json()
    
    # Create directory
    output_dir = Path("files/skinport")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Save the JSON data
    output_file = output_dir / "skinport_data.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(json_data, f, indent=2, ensure_ascii=False)
    
    print(f"Data successfully saved to {output_file}")

except requests.exceptions.RequestException as e:
    print(f"Request error: {e}")
except json.JSONDecodeError as e:
    print(f"JSON parsing error: {e}")
except Exception as e:
    print(f"Unexpected error: {e}")