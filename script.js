const knowledge = {
    "who made you": "I was made by a talented young developer from Karachi! 🚀",
    "who are you": "I am Nova, your intelligent AI assistant! ✨",
    "what is ai": "AI stands for Artificial Intelligence — computers that think and learn like humans! 🤖",
    "ram": "RAM is temporary memory your computer uses while working. When you turn off your computer everything in RAM is gone!",
    "rom": "ROM is permanent memory that stores data even when powered off. Think of RAM as your desk and ROM as your drawer!",
    "hello": "Hey there! 👋 How can I help you today?",
    "hi": "Hi! Great to see you! 😊",
    "bye": "Goodbye! Have an amazing day! 👋",
    "your name": "My name is Nova! Your personal AI assistant! ✨",
    "how are you": "I am doing great and ready to help! 😊",
    "what can you do": "I can answer questions and have conversations! I am getting smarter every day! 🧠"
}

function getNovaResponse(text) {
    const lowerText = text.toLowerCase();
    for (const keyword in knowledge) {
        if (lowerText.includes(keyword)) {
            return knowledge[keyword];
        }
    }
    return "Hmm, I am still learning about that! Try asking me something else. 🤔";
}

// Sound effect
function playSound() {
    const context = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    oscillator.frequency.value = 520;
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.1, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.3);
    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 0.3);
}

// Timestamp
function getTime() {
    const now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    return hours + ':' + minutes + ' ' + ampm;
}

const sendButton = document.getElementById('send-button');
const messageInput = document.getElementById('message-input');
const chatArea = document.getElementById('chat-area');

function loadHistory() {
    const saved = localStorage.getItem('novaHistory');
    if (saved) {
        const messages = JSON.parse(saved);
        messages.forEach(msg => {
            const div = document.createElement('div');
            div.classList.add(msg.type);
            div.textContent = msg.text;
            chatArea.appendChild(div);

            const time = document.createElement('div');
            time.classList.add(msg.type === 'user-message' ? 'timestamp' : 'nova-timestamp');
            time.textContent = msg.time;
            chatArea.appendChild(time);
        });
        chatArea.scrollTop = chatArea.scrollHeight;
    }
}

function saveMessage(type, text, time) {
    const saved = localStorage.getItem('novaHistory');
    const messages = saved ? JSON.parse(saved) : [];
    messages.push({ type, text, time });
    localStorage.setItem('novaHistory', JSON.stringify(messages));
}

function showTyping() {
    const typing = document.createElement('div');
    typing.classList.add('nova-message');
    typing.id = 'typing-indicator';
    typing.textContent = 'Nova is typing...';
    chatArea.appendChild(typing);
    chatArea.scrollTop = chatArea.scrollHeight;
}

function removeTyping() {
    const typing = document.getElementById('typing-indicator');
    if (typing) typing.remove();
}

function sendMessage() {
    const userText = messageInput.value.trim();
    if (userText === '') return;

    const savedText = userText;
    const time = getTime();

    // User message
    const userMessage = document.createElement('div');
    userMessage.classList.add('user-message');
    userMessage.textContent = savedText;
    chatArea.appendChild(userMessage);

    // User timestamp
    const userTime = document.createElement('div');
    userTime.classList.add('timestamp');
    userTime.textContent = time;
    chatArea.appendChild(userTime);

    saveMessage('user-message', savedText, time);

    messageInput.value = '';
    chatArea.scrollTop = chatArea.scrollHeight;

    showTyping();

    setTimeout(() => {
        removeTyping();

        const response = getNovaResponse(savedText);
        const novaTime = getTime();

        // Nova message
        const novaMessage = document.createElement('div');
        novaMessage.classList.add('nova-message');
        novaMessage.textContent = response;
        chatArea.appendChild(novaMessage);

        // Nova timestamp
        const novaTimestamp = document.createElement('div');
        novaTimestamp.classList.add('nova-timestamp');
        novaTimestamp.textContent = novaTime;
        chatArea.appendChild(novaTimestamp);

        saveMessage('nova-message', response, novaTime);
        chatArea.scrollTop = chatArea.scrollHeight;

        // Play sound
        playSound();

    }, 1500);
}

loadHistory();

sendButton.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') sendMessage();
});