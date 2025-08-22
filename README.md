Realtime-KB
A real-time conversational AI application powered by OpenAI's Realtime API with integrated knowledge base functionality.

Overview
Realtime-KB combines OpenAI's Realtime API with a dynamic knowledge base system, enabling real-time voice and text conversations with AI while leveraging custom knowledge sources for enhanced responses.

Features
OpenAI Realtime API Integration: Low-latency real-time conversations

Voice Conversations: Real-time speech-to-speech interactions

Knowledge Base Integration: Custom knowledge sources for enhanced responses

Web-based Interface: Clean HTML/JavaScript frontend

Multi-modal Support: Text and voice input/output

Tech Stack
Frontend: HTML (51.6%), JavaScript (48.4%)

AI: OpenAI Realtime API

Audio: Web Audio API

Knowledge: Custom knowledge base system

Setup
Clone the repository

bash
git clone https://github.com/ThinkTank-SB/Realtime-KB.git
cd Realtime-KB
Add your OpenAI API key

javascript
const OPENAI_API_KEY = 'your-api-key-here';
Start local server

bash
python -m http.server 8000
Open http://localhost:8000 in your browser

Usage
Text Mode: Type messages for AI responses with knowledge context

Voice Mode: Click microphone for real-time voice conversations

Knowledge Base: Upload documents to enhance AI responses

Contributing
Fork the repository

Create a feature branch

Make your changes

Submit a pull request
