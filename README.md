# NOVA AI Student Assistant v4.0

An intelligent offline AI student assistant with 300+ knowledge articles, voice recognition, quiz system, games, prayer times, and a futuristic HUD interface.

## Features
- 300+ offline knowledge articles (Science, Math, Islam, Pakistan, History, Space, Tech, Health)
- Voice recognition with wake word detection
- AI API integration (Hack Club free AI)
- Quiz system with XP and achievements
- 8 interactive games
- Notes and goals system
- Prayer times for Karachi
- Wellness tracker
- Mood system with emotion engine
- Dark futuristic HUD interface

## Setup

### 1. Add your API key
Open `config.js` and replace `YOUR_API_KEY_HERE` with your free API key from [ai.hackclub.com](https://ai.hackclub.com)

### 2. Run with Python Flask
```bash
pip install -r requirements.txt
python app.py
```
Then open http://localhost:5000

### 3. Or open directly
Just open `index.html` in Chrome or Edge browser (Live Server works great!)

## Built With
- HTML, CSS, JavaScript (Frontend)
- Python Flask (Backend)
- Hack Club AI API (meta-llama/llama-3.3-70b-instruct)

## Project Structure
```
Nova/
├── index.html        # Main UI
├── style.css         # Futuristic HUD styles
├── script.js         # Core logic + AI API
├── brain.js          # 300+ knowledge base + quiz database
├── config.js         # API key configuration
├── app.py            # Python Flask backend
└── requirements.txt  # Python dependencies
```
