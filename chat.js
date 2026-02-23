// Lumina Chat Interface - Enhanced Version with Download Feature
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
        this.downloadBtn = document.getElementById('downloadChatBtn');
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
        if (this.downloadBtn) {
            this.downloadBtn.addEventListener('click', () => this.downloadChat());
        }
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
                    history: this.chatHistory.slice(-5)
                })
            });

            const data = await response.json();
            
            this.removeTypingIndicator();
            this.addBotMessage(data.response);
            
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
        
        const htmlContent = marked.parse(text);
        
        messageDiv.innerHTML = `
            <div class="bubble markdown-body">${htmlContent}</div>
            <span class="timestamp">✦ ${timeStr}</span>
        `;
        this.chatContainer.appendChild(messageDiv);
        
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
        
        const welcomeMsg = `✨ Chat reset. **Lumina** is ready.

I support:
- Markdown formatting
- Code blocks with syntax highlighting
- **Bold** and *italic* text
- Bullet points and lists

How can I help you?`;
        
        this.addBotMessage(welcomeMsg);
    }

    // NEW: Download Chat Functionality
    downloadChat() {
        if (this.chatHistory.length === 0) {
            alert('No chat history to download.');
            return;
        }

        // Format chat for download
        let chatText = "LUMINA PREMIUM CHAT HISTORY\n";
        chatText += "============================\n";
        chatText += `Generated: ${new Date().toLocaleString()}\n`;
        chatText += `Theme: ${this.isDarkTheme ? 'Dark' : 'Light'}\n`;
        chatText += "============================\n\n";

        this.chatHistory.forEach((entry, index) => {
            chatText += `[${index + 1}] ${new Date(entry.timestamp).toLocaleString()}\n`;
            chatText += `👤 You: ${entry.user}\n`;
            chatText += `🤖 Lumina: ${entry.bot.replace(/\*\*/g, '').replace(/\*/g, '')}\n`;
            chatText += "----------------------------\n\n";
        });

        // Create and download file
        const blob = new Blob([chatText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lumina-chat-${this.formatDateForFile()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // Show success message
        this.showNotification('Chat history downloaded successfully!');
    }

    // Helper: Format date for filename
    formatDateForFile() {
        const d = new Date();
        return `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}-${d.getDate().toString().padStart(2,'0')}`;
    }

    // Helper: Show temporary notification
    showNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: #b77eff;
            color: white;
            padding: 12px 24px;
            border-radius: 40px;
            font-size: 14px;
            font-weight: 500;
            letter-spacing: 1px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5), 0 0 30px #b77eff;
            z-index: 1000;
            animation: slideUp 0.3s ease;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideDown 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }

    toggleTheme() {
        document.body.classList.toggle('light-theme');
        this.isDarkTheme = !this.isDarkTheme;
        this.toggleThemeBtn.innerHTML = this.isDarkTheme ? 
            '<span>☾</span> Dark Theme' : 
            '<span>☀</span> Light Theme';
        
        // Force menu button colors to update
        this.updateMenuButtonColors();
    }

    // Fix menu button colors in light theme
    updateMenuButtonColors() {
        const buttons = this.mobileMenu.querySelectorAll('button');
        buttons.forEach(btn => {
            if (this.isDarkTheme) {
                btn.style.color = '#ffffff';
            } else {
                btn.style.color = '#2a1e3a';
            }
        });
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
                this.chatContainer.innerHTML = '';
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

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideUp {
        from { opacity: 0; transform: translate(-50%, 20px); }
        to { opacity: 1; transform: translate(-50%, 0); }
    }
    @keyframes slideDown {
        from { opacity: 1; transform: translate(-50%, 0); }
        to { opacity: 0; transform: translate(-50%, 20px); }
    }
`;
document.head.appendChild(style);