<!-- Chat Button -->
<button class="chat-button" id="chatButton" title="Chat about questions">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
</button>

<!-- Chat Modal -->
<div class="chat-modal" id="chatModal">
    <div class="chat-modal-content">
        <div class="chat-header">
            <h3 id="chatHeaderTitle">Chat About Questions</h3>
            <button class="chat-close" id="chatClose">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        </div>
        <div class="chat-messages" id="chatMessages">
            <div class="chat-message bot-message">
                <div class="message-content">
                    <p id="chatWelcomeMessage">Hello! I'm here to help you with questions. Ask me anything!</p>
                </div>
            </div>
        </div>
        <div class="chat-input-container">
            <input type="text" class="chat-input" id="chatInput" placeholder="Type your question here...">
            <button class="chat-send" id="chatSend">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
            </button>
        </div>
    </div>
</div>

