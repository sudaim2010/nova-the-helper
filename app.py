from flask import Flask, send_from_directory, request, jsonify
from flask_cors import CORS
import urllib.request
import json
import ssl

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
        api_key = data.get('api_key', '')
        model = data.get('model', 'meta-llama/llama-3.1-8b-instruct')
        messages = data.get('messages', [])

        if not api_key:
            return jsonify({'error': 'No API key provided'}), 400

        payload = json.dumps({
            "model": model,
            "messages": messages,
            "max_tokens": 400
        }).encode('utf-8')

        # Create SSL context that doesn't verify certificates
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE

        req = urllib.request.Request(
            'https://ai.hackclub.com/proxy/v1/chat/completions',
            data=payload,
            headers={
                'Authorization': 'Bearer ' + api_key,
                'Content-Type': 'application/json',
                'User-Agent': 'NOVA-Student-Assistant/4.0'
            },
            method='POST'
        )

        with urllib.request.urlopen(req, timeout=45, context=ctx) as response:
            result = json.loads(response.read().decode('utf-8'))
            return jsonify(result)

    except urllib.error.HTTPError as e:
        try:
            error_body = e.read().decode('utf-8')
            error_data = json.loads(error_body)
            return jsonify({'error': f'HTTP {e.code}: {e.reason}', 'details': error_data}), 500
        except:
            return jsonify({'error': f'HTTP {e.code}: {e.reason}'}), 500
    except urllib.error.URLError as e:
        return jsonify({'error': f'Connection failed: {str(e.reason)}'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("=" * 40)
    print("NOVA AI Student Assistant v4.0")
    print("Running at http://localhost:5000")
    print("=" * 40)
    app.run(debug=True, port=5000, host='0.0.0.0')
