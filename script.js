const sendButton = document.getElementById('send-button');
const messageInput = document.getElementById('message-input');
const chatArea = document.getElementById('chat-area');
const themeToggle = document.getElementById('theme-toggle');

// Theme toggle
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
    if (document.body.classList.contains('light-mode')) {
        themeToggle.textContent = '☀️ Light Mode';
        localStorage.setItem('theme', 'light');
    } else {
        themeToggle.textContent = '🌙 Dark Mode';
        localStorage.setItem('theme', 'dark');
    }
});

if (localStorage.getItem('theme') === 'light') {
    document.body.classList.add('light-mode');
    themeToggle.textContent = '☀️ Light Mode';
}

// User name memory
let userName = localStorage.getItem('novaUserName');

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

function getTime() {
    const now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    return hours + ':' + minutes + ' ' + ampm;
}

function addNovaMessage(text) {
    const novaMessage = document.createElement('div');
    novaMessage.classList.add('nova-message');
    novaMessage.textContent = text;
    chatArea.appendChild(novaMessage);

    const novaTimestamp = document.createElement('div');
    novaTimestamp.classList.add('nova-timestamp');
    novaTimestamp.textContent = getTime();
    chatArea.appendChild(novaTimestamp);

    chatArea.scrollTop = chatArea.scrollHeight;
    playSound();
}

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

function askUserName() {
    if (!userName) {
        setTimeout(() => {
            addNovaMessage("Welcome to Nova Student Assistant! 📚 Before we start, what is your name?");
            messageInput.placeholder = "Type your name here...";
            messageInput.dataset.mode = "name";
        }, 500);
    } else {
        addNovaMessage(`Welcome back ${userName}! 👋 Ready to study? Ask me anything!`);
    }
}

// Send message to Python server
async function sendToPython(message) {
    try {
        const response = await fetch('http://127.0.0.1:5000/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: message })
        });
        const data = await response.json();
        return data.response;
    } catch (error) {
        return "I am having trouble connecting to my brain! Please make sure the server is running! 🔧";
    }
}

async function sendMessage() {
    const userText = messageInput.value.trim();
    if (userText === '') return;

    const savedText = userText;
    const time = getTime();

    // Handle name input
    if (messageInput.dataset.mode === 'name') {
        userName = savedText;
        localStorage.setItem('novaUserName', userName);
        messageInput.dataset.mode = '';
        messageInput.placeholder = 'Type your message here...';

        const userMessage = document.createElement('div');
        userMessage.classList.add('user-message');
        userMessage.textContent = savedText;
        chatArea.appendChild(userMessage);
        messageInput.value = '';

        setTimeout(() => {
            addNovaMessage(`Nice to meet you ${userName}! 🎉 I am Nova, your personal study assistant. Ask me anything about Science, Math, History or Computer Science! 📚`);
        }, 1000);
        return;
    }

    // Show user message
    const userMessage = document.createElement('div');
    userMessage.classList.add('user-message');
    userMessage.textContent = savedText;
    chatArea.appendChild(userMessage);

    const userTime = document.createElement('div');
    userTime.classList.add('timestamp');
    userTime.textContent = time;
    chatArea.appendChild(userTime);

    saveMessage('user-message', savedText, time);
    messageInput.value = '';
    chatArea.scrollTop = chatArea.scrollHeight;

    showTyping();

    // Get response from Python
    const response = await sendToPython(savedText);
    removeTyping();
    addNovaMessage(response);
    saveMessage('nova-message', response, getTime());
}

loadHistory();
askUserName();

sendButton.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') sendMessage();
});