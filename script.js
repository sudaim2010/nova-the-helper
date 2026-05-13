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

function getNovaResponse(userText) {
    const lowerText = userText.toLowerCase();
    for (const keyword in knowledge) {
        if (lowerText.includes(keyword)) {
            return knowledge[keyword];
        }
    }
    return "Hmm, I am still learning about that! Try asking me something else. 🤔";
}

const sendButton = document.getElementById('send-button');
const messageInput = document.getElementById('message-input');
const chatArea = document.getElementById('chat-area');

function sendMessage() {
    const userText = messageInput.value.trim();
    if (userText === '') return;

    const userMessage = document.createElement('div');
    userMessage.classList.add('user-message');
    userMessage.textContent = userText;
    chatArea.appendChild(userMessage);

    messageInput.value = '';
    chatArea.scrollTop = chatArea.scrollHeight;

    setTimeout(() => {
        const novaMessage = document.createElement('div');
        novaMessage.classList.add('nova-message');
        novaMessage.textContent = getNovaResponse(userText);
        chatArea.appendChild(novaMessage);
        chatArea.scrollTop = chatArea.scrollHeight;
    }, 1000);
}

sendButton.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') sendMessage();
});