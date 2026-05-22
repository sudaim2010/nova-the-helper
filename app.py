from flask import Flask, send_from_directory, request, jsonify
from flask_cors import CORS
import urllib.request
import json

app = Flask(__name__)
CORS(app)

@app.route('/')
def home():
    return send_from_directory('.', 'index.html')

@app.route('/<path:filename>')
def serve_file(filename):
    return send_from_directory('.', filename)

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        api_key = data.get('api_key')
        model = data.get('model')
        messages = data.get('messages')

        payload = json.dumps({
            "model": model,
            "messages": messages
        }).encode('utf-8')

        req = urllib.request.Request(
            'https://ai.hackclub.com/proxy/v1/chat/completions',
            data=payload,
            headers={
                'Authorization': 'Bearer ' + api_key,
                'Content-Type': 'application/json'
            }
        )

        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode('utf-8'))
            return jsonify(result)

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("NOVA AI Student Assistant")
    print("Running at http://localhost:5000")
    app.run(debug=True, port=5000)