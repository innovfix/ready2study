<!-- Chat Button -->
<button class="chat-button" id="chatButton" title="Chat about questions" style="bottom: 2rem; right: 2rem;">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
</button>

<!-- Math Calculator Button -->
<button class="chat-button" id="calculatorButton" title="Math Calculator" style="bottom: 8rem; right: 2rem; background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="4" y="2" width="16" height="20" rx="2"></rect>
        <line x1="8" y1="6" x2="16" y2="6"></line>
        <line x1="8" y1="10" x2="16" y2="10"></line>
        <line x1="8" y1="14" x2="16" y2="14"></line>
        <line x1="8" y1="18" x2="16" y2="18"></line>
    </svg>
</button>

<!-- Translate Button (Orange with A/அ) -->
<button class="chat-button" id="translateButton" title="Translate to Tamil" style="bottom: 14rem; right: 2rem; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); font-weight: 700; font-size: 1rem; color: white; display: flex; align-items: center; justify-content: center; min-width: 60px; padding: 0 1rem;">
    <span style="font-family: 'Inter', 'Poppins', sans-serif; font-size: 1rem;">A</span>
    <span style="margin: 0 0.25rem; opacity: 0.9; font-size: 1rem;">/</span>
    <span style="font-family: 'Noto Sans Tamil', 'Arial Unicode MS', sans-serif; font-size: 1rem;">அ</span>
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




