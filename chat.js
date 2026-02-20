// Lumina Chat Interface - Enhanced Version
class LuminaChat {
    constructor() {
        this.API_URL = '/api/chat';
        this.isDarkTheme = true;
        this.chatHistory = [];
        
        // Configure marked for markdown rendering
        marked.setOptions({
            highlight: function(code, lang) {
                if (lang && hljs.getLanguage(lang)) {
                    return hljs.highlight(code, { language: lang }).value;
                }
                return hljs.highlightAuto(code).value;
            },
            breaks: true,
            gfm: true
        });

        this.initElements();
        this.initEventListeners();
        this.loadChatHistory();
    }

    initElements() {
        this.landing = document.getElementById('landingPage');
        this.chatInterface = document.getElementById('chatInterface');
        this.enterBtn = document.getElementById('enterBtn');
        this.hamburgerBtn = document.getElementById('hamburgerBtn');
        this.mobileMenu = document.getElementById('mobileMenu');
        this.chatContainer = document.getElementById('chatContainer');
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendMessageBtn');
        this.resetBtn = document.getElementById('resetChatBtn');
        this.toggleThemeBtn = document.getElementById('toggleThemeBtn');
        this.infoBtn = document.getElementById('infoBtn');
        this.infoModal = document.getElementById('infoModal');
        this.closeInfoBtn = document.getElementById('closeInfoBtn');
    }

    initEventListeners() {
        // Landing page
        this.enterBtn.addEventListener('click', () => {
            this.landing.classList.add('hidden');
            this.chatInterface.classList.add('visible');
        });
        
        // Hamburger menu
        this.hamburgerBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.hamburgerBtn.classList.toggle('active');
            this.mobileMenu.classList.toggle('show');
        });
        
        // Close menu on outside click
        document.addEventListener('click', (e) => {
            if (!this.hamburgerBtn.contains(e.target) && !this.mobileMenu.contains(e.target)) {
                this.hamburgerBtn.classList.remove('active');
                this.mobileMenu.classList.remove('show');
            }
        });
        
        // Send message
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // Menu actions
        this.resetBtn.addEventListener('click', () => this.resetChat());
        this.toggleThemeBtn.addEventListener('click', () => this.toggleTheme());
        this.infoBtn.addEventListener('click', () => this.showInfo());
        this.closeInfoBtn.addEventListener('click', () => this.hideInfo());
        
        // Close modal on outside click
        this.infoModal.addEventListener('click', (e) => {
            if (e.target === this.infoModal) this.hideInfo();
        });
    }

    async sendMessage() {
        const text = this.messageInput.value.trim();
        if (!text) return;

        this.addUserMessage(text);
        this.messageInput.value = '';
        this.showTypingIndicator();

        try {
            const response = await fetch(this.API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    message: text,
                    history: this.chatHistory.slice(-5) // Send last 5 messages for context
                })
            });

            const data = await response.json();
            
            this.removeTypingIndicator();
            
            // Format and add bot response with markdown
            this.addBotMessage(data.response);
            
            // Save to history
            this.chatHistory.push({
                user: text,
                bot: data.response,
                timestamp: new Date().toISOString()
            });
            this.saveChatHistory();

        } catch (error) {
            this.removeTypingIndicator();
            this.addBotMessage('**Error:** Sorry, I encountered a connection issue. Please try again.');
            console.error('Chat error:', error);
        }
    }

    addUserMessage(text) {
        const timeStr = this.formatTime(new Date());
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message user';
        messageDiv.innerHTML = `
            <div class="bubble">${this.escapeHTML(text).replace(/\n/g, '<br>')}</div>
            <span class="timestamp">✦ ${timeStr}</span>
        `;
        this.chatContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    addBotMessage(text) {
        const timeStr = this.formatTime(new Date());
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot';
        
        // Render markdown
        const htmlContent = marked.parse(text);
        
        messageDiv.innerHTML = `
            <div class="bubble markdown-body">${htmlContent}</div>
            <span class="timestamp">✦ ${timeStr}</span>
        `;
        this.chatContainer.appendChild(messageDiv);
        
        // Apply syntax highlighting to code blocks
        messageDiv.querySelectorAll('pre code').forEach((block) => {
            hljs.highlightElement(block);
        });
        
        this.scrollToBottom();
    }

    showTypingIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'message bot';
        indicator.id = 'typingIndicator';
        indicator.innerHTML = `
            <div class="bubble">
                <div class="typing-indicator">
                    <span></span><span></span><span></span>
                </div>
            </div>
        `;
        this.chatContainer.appendChild(indicator);
        this.scrollToBottom();
    }

    removeTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        if (indicator) indicator.remove();
    }

    resetChat() {
        this.chatContainer.innerHTML = '';
        this.chatHistory = [];
        localStorage.removeItem('luminaChatHistory');
        
        // Add welcome message
        const welcomeMsg = `✨ Chat reset. **Lumina** is ready.

I support:
- Markdown formatting
- Code blocks with syntax highlighting
- **Bold** and *italic* text
- Bullet points and lists

How can I help you?`;
        
        this.addBotMessage(welcomeMsg);
    }

    toggleTheme() {
        document.body.classList.toggle('light-theme');
        this.isDarkTheme = !this.isDarkTheme;
        this.toggleThemeBtn.innerHTML = this.isDarkTheme ? 
            '<span>☾</span> Dark Theme' : 
            '<span>☀</span> Light Theme';
    }

    showInfo() {
        this.infoModal.classList.add('show');
    }

    hideInfo() {
        this.infoModal.classList.remove('show');
    }

    formatTime(date) {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    escapeHTML(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    scrollToBottom() {
        this.chatContainer.scrollTo({
            top: this.chatContainer.scrollHeight,
            behavior: 'smooth'
        });
    }

    saveChatHistory() {
        try {
            localStorage.setItem('luminaChatHistory', JSON.stringify(this.chatHistory));
        } catch (e) {
            console.warn('Could not save chat history:', e);
        }
    }

    loadChatHistory() {
        try {
            const saved = localStorage.getItem('luminaChatHistory');
            if (saved) {
                this.chatHistory = JSON.parse(saved);
                this.chatContainer.innerHTML = ''; // Clear existing
                this.chatHistory.forEach(entry => {
                    if (entry.user) this.addUserMessage(entry.user);
                    if (entry.bot) this.addBotMessage(entry.bot);
                });
            }
        } catch (e) {
            console.warn('Could not load chat history:', e);
        }
    }
}

// Initialize chat
document.addEventListener('DOMContentLoaded', () => {
    window.luminaChat = new LuminaChat();
});