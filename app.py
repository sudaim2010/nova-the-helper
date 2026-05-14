from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

knowledge = {
    "who made you": "I was made by a talented student developer from Karachi! 🚀",
    "who are you": "I am Nova, your intelligent student assistant! I help you study better! 📚",
    "what is ai": "AI stands for Artificial Intelligence — it is the ability of computers to think and learn like humans! 🤖",
    "what is python": "Python is a popular programming language known for being easy to read and write. It is used in AI, web development, and more! 🐍",
    "what is machine learning": "Machine Learning is a type of AI where computers learn from data without being explicitly programmed! 🧠",
    "what is photosynthesis": "Photosynthesis is the process by which plants use sunlight, water and CO2 to produce food and oxygen! 🌱",
    "what is gravity": "Gravity is the force that attracts objects toward each other. On Earth it pulls everything toward the center! 🌍",
    "what is newton law": "Newton's First Law: An object stays at rest or in motion unless acted upon by a force. Second Law: F=ma. Third Law: Every action has an equal and opposite reaction! ⚡",
    "what is osmosis": "Osmosis is the movement of water molecules through a semi-permeable membrane from an area of low solute concentration to high solute concentration! 💧",
    "what is algebra": "Algebra is a branch of mathematics dealing with symbols and the rules for manipulating those symbols to solve equations! ➕",
    "what is democracy": "Democracy is a system of government where citizens vote to elect their representatives and have a say in decisions! 🗳️",
    "what is pakistan": "Pakistan is a country in South Asia, founded on August 14, 1947. Its capital is Islamabad and largest city is Karachi! 🇵🇰",
    "capital of pakistan": "The capital of Pakistan is Islamabad! 🇵🇰",
    "capital of france": "The capital of France is Paris! 🇫🇷",
    "capital of usa": "The capital of USA is Washington D.C.! 🇺🇸",
    "what is atom": "An atom is the smallest unit of matter that retains the properties of an element. It consists of protons, neutrons and electrons! ⚛️",
    "what is cell": "A cell is the basic structural and functional unit of all living organisms. It is the smallest unit of life! 🔬",
    "what is dna": "DNA stands for Deoxyribonucleic Acid. It carries the genetic information of all living organisms! 🧬",
    "hello": "Hey there! 👋 Ready to study? Ask me anything!",
    "hi": "Hi! I am Nova, your study assistant! What subject can I help you with today? 📚",
    "bye": "Goodbye! Keep studying hard! 👋",
    "how are you": "I am doing great and ready to help you ace your exams! 😊",
    "what can you do": "I can help you with Science, Math, History, Geography, Computer Science and much more! Just ask! 🎓",
    "urdu": "میں نووا ہوں، آپ کا ذہین مطالعہ معاون! میں آپ کی مدد کے لیے یہاں ہوں! 🌟",
    "help": "I can help you with: Science 🔬, Math ➕, History 📜, Geography 🌍, Computer Science 💻, and General Knowledge! What do you need? 📚",
    "what is photosynthesis": "Photosynthesis is the process by which plants use sunlight, water and CO2 to produce food and oxygen! 🌱",
    "what is mitosis": "Mitosis is the process of cell division where one cell divides into two identical cells! 🔬",
    "what is the speed of light": "The speed of light is approximately 299,792,458 meters per second or 3 x 10^8 m/s! ⚡",
    "what is hydrogen": "Hydrogen is the lightest and most abundant element in the universe with atomic number 1! ⚛️",
    "what is the solar system": "The solar system consists of the Sun and 8 planets: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus and Neptune! 🪐",
    "who was quaid e azam": "Quaid-e-Azam Muhammad Ali Jinnah was the founder of Pakistan, born on December 25, 1876. He is known as the Father of the Nation! 🇵🇰",
    "who was allama iqbal": "Allama Iqbal was a great poet and philosopher who inspired the creation of Pakistan. He wrote Tarana-e-Hind and Tarana-e-Milli! 📜",
    "what is independence day of pakistan": "Pakistan's Independence Day is celebrated on August 14, 1947, the day Pakistan was created! 🎉🇵🇰",
    "what is the constitution": "A constitution is the fundamental law of a country that defines the powers of the government and rights of citizens! 📜",
    "what is water": "Water is a chemical compound with formula H2O. It consists of two hydrogen atoms and one oxygen atom! 💧",
    "what is electricity": "Electricity is the flow of electric charge through a conductor. It powers our homes, devices and industries! ⚡",
    "what is the internet": "The internet is a global network of computers that communicate with each other to share information and data! 🌐",
    "what is programming": "Programming is the process of writing instructions for a computer to follow. Languages include Python, JavaScript, Java and more! 💻",
    "what is algorithm": "An algorithm is a step by step set of instructions to solve a problem or complete a task! 🧠",
    "what is database": "A database is an organized collection of structured data stored electronically, like student records or product lists! 🗄️",
    "what is evolution": "Evolution is the process by which living organisms change over generations through natural selection and genetic mutations! 🧬",
    "what is ecosystem": "An ecosystem is a community of living organisms interacting with each other and their environment! 🌿",
    "what is inflation": "Inflation is the rate at which the general level of prices for goods and services rises, reducing purchasing power! 📈",
    "what is democracy": "Democracy is a system of government where citizens vote to elect their representatives and have a say in decisions! 🗳️",
    "what is artificial intelligence": "Artificial Intelligence is the simulation of human intelligence in machines that can learn, reason and solve problems! 🤖",
    
}

def get_response(message):
    message_lower = message.lower()
    
    for keyword in knowledge:
        if keyword in message_lower:
            return knowledge[keyword]
    
    # Smart fallback responses
    if any(word in message_lower for word in ['math', 'calculate', 'solve', 'equation']):
        return "For math problems, try to break them down step by step! Share the specific problem and I will try to help! ➕"
    
    if any(word in message_lower for word in ['science', 'biology', 'chemistry', 'physics']):
        return "Great science question! Could you be more specific? I know Biology, Chemistry and Physics! 🔬"
    
    if any(word in message_lower for word in ['history', 'when', 'who was', 'year']):
        return "Interesting history question! Try asking more specifically like 'What is the history of Pakistan' 📜"
    
    if any(word in message_lower for word in ['thank', 'thanks']):
        return "You are welcome! Keep up the great work with your studies! 🌟"

    return "I am still learning about that topic! Try asking about Science, Math, History, Geography or Computer Science! 📚"

@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    message = data.get('message', '')
    response = get_response(message)
    return jsonify({'response': response})

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

@app.route('/')
def home():
    return send_from_directory('.', 'index.html')

@app.route('/<path:filename>')
def serve_file(filename):
    return send_from_directory('.', filename)

if __name__ == '__main__':
    app.run(debug=True, port=5000)