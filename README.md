# NOVA — AI Student Assistant v4.0

Hey! So basically I built NOVA because I was tired of not having a proper study tool that actually works offline. Like, I'd be revising at night with no WiFi and just needed something to help me out. So I made this.

## What is NOVA?

NOVA is an AI-powered student assistant that works completely offline. It has over 300 articles on pretty much everything you'd need for O Level and A Level — Physics, Biology, Chemistry, Maths, Islamic Studies, Pakistan Studies, History, and more. It also has loads of other features that actually make studying less painful.

## What can it do?

**The main stuff:**
- Chat with an AI that actually knows your syllabus topics
- 300+ offline knowledge articles (no internet needed at all)
- Voice recognition — just talk to it
- Wake word detection — say "Hi Nova" and it activates hands-free
- Quiz mode with multiple categories to test yourself
- Encyclopedia with search across all topics

**Student tools (the actually useful ones):**
- Grade calculator — put in your marks and it tells you your percentage and grade
- Pomodoro timer — 25 min study, 5 min break, classic technique
- Exam countdown — add your exam dates and see how many days you have left
- Scientific calculator — sin, cos, tan, log, square root, the lot
- Unit converter — length, weight, temperature, speed, area
- Formula sheet — all the key formulas you need in one place

**Other features:**
- Smart search — searches your notes, chat history, and knowledge base all at once
- Notes — save anything, it stays on your device
- Daily goals — set what you want to do and tick them off
- Lifestyle tab — prayer times for Karachi, wellness tracker, breathing exercise
- Stats dashboard — see your progress, quiz scores, topics explored
- Games — riddles, would you rather, 2 truths 1 lie, story builder, and more
- Custom themes — change the colours to whatever you like
- Nova's Memory — tell Nova things to remember and it'll bring them up later
- Export — download your chat or notes anytime
- Dark futuristic HUD interface (looks pretty sick honestly)

## How to run it

You need Python installed. Then:

```bash
pip install -r requirements.txt
python app.py
```

Then open your browser and go to:
```
http://localhost:5000
```

That's it. No setup headache.

## Adding AI responses

By default Nova runs completely offline using its built-in knowledge base. If you want it to answer questions it doesn't know (like writing essays or explaining random topics), you can add a free API key.

Open `config.js` and paste your API key:

```javascript
const NOVA_API_KEY = "your-key-here";
```

Get a free key from [ai.hackclub.com](https://ai.hackclub.com) — no credit card needed.

## Project structure

```
Nova/
├── index.html        — the whole UI
├── style.css         — all the styling
├── script.js         — main logic
├── brain.js          — 300+ knowledge base + quiz questions
├── config.js         — put your API key here
├── app.py            — Python Flask backend
└── requirements.txt  — Python packages needed
```

## Tech stack

- HTML, CSS, JavaScript (frontend)
- Python Flask (backend server)
- Web Speech API (voice recognition)
- localStorage (saves your data on your device)
- Hack Club AI API (optional, for unknown questions)

## Why I built this

Honestly I just needed something that works when there's no internet. Most AI tools need a connection and cost money. I wanted something free, fast, and actually useful for studying. So I built NOVA.

---

Built by Muhammad Sudaim
