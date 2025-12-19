// DOM Elements
const loginScreen = document.getElementById('login-screen');
const chatScreen = document.getElementById('chat-screen');
const googleLoginBtn = document.getElementById('google-login-btn');
const demoLoginBtn = document.getElementById('demo-login-btn');
const logoutBtn = document.getElementById('logout-btn');
const usernameElement = document.getElementById('username');
const userAvatarElement = document.getElementById('user-avatar');
const userStatusElement = document.getElementById('user-status');
const contactsList = document.getElementById('contacts-list');
const messagesContainer = document.getElementById('messages-container');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const searchContactsInput = document.getElementById('search-contacts');

// Current User
let currentUser = null;
let currentChat = "general";

// Initialize the app
function initApp() {
    // Check if user is already logged in (in a real app, this would check Firebase auth state)
    const savedUser = localStorage.getItem('telechat_user');
    
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showChatScreen();
        loadContacts();
        loadMessages(currentChat);
        updateUserInfo();
    } else {
        showLoginScreen();
    }
    
    // Setup event listeners
    setupEventListeners();
}

// Show login screen
function showLoginScreen() {
    loginScreen.classList.add('active');
    chatScreen.classList.remove('active');
}

// Show chat screen
function showChatScreen() {
    loginScreen.classList.remove('active');
    chatScreen.classList.add('active');
}

// Update user info in the sidebar
function updateUserInfo() {
    if (currentUser) {
        usernameElement.textContent = currentUser.name;
        userStatusElement.textContent = currentUser.status || "Online";
        
        // Set avatar
        const avatarIcon = userAvatarElement.querySelector('i');
        if (currentUser.avatarIcon) {
            avatarIcon.className = currentUser.avatarIcon;
        } else if (currentUser.avatar) {
            userAvatarElement.innerHTML = currentUser.avatar;
        }
    }
}

// Load contacts into the sidebar
function loadContacts() {
    contactsList.innerHTML = '';
    
    demoContacts.forEach(contact => {
        const contactElement = document.createElement('div');
        contactElement.className = `contact ${contact.id === currentChat ? 'active' : ''}`;
        contactElement.dataset.contactId = contact.id;
        
        // Format time
        const time = formatMessageTime(contact.lastMessageTime);
        
        contactElement.innerHTML = `
            <div class="contact-avatar">
                <i class="${contact.avatarIcon}"></i>
            </div>
            <div class="contact-info">
                <h4>${contact.name}</h4>
                <p>${contact.lastMessage}</p>
            </div>
            <div class="contact-time">${time}</div>
        `;
        
        contactElement.addEventListener('click', () => {
            // Remove active class from all contacts
            document.querySelectorAll('.contact').forEach(c => c.classList.remove('active'));
            // Add active class to clicked contact
            contactElement.classList.add('active');
            
            // Switch to this chat
            switchToChat(contact.id);
        });
        
        contactsList.appendChild(contactElement);
    });
}

// Load messages for a specific chat
function loadMessages(chatId) {
    messagesContainer.innerHTML = '';
    
    // Add date separator
    const dateElement = document.createElement('div');
    dateElement.className = 'message-date';
    dateElement.textContent = 'Today';
    messagesContainer.appendChild(dateElement);
    
    // Filter messages for this chat
    const chatMessages = demoMessages.filter(msg => msg.chatId === chatId);
    
    chatMessages.forEach(msg => {
        const messageElement = createMessageElement(msg);
        messagesContainer.appendChild(messageElement);
    });
    
    // Scroll to bottom
    scrollToBottom();
}

// Create a message element
function createMessageElement(message) {
    const isSent = message.senderId === currentUser?.id;
    const messageElement = document.createElement('div');
    messageElement.className = `message ${isSent ? 'sent' : 'received'}`;
    
    // Get sender info
    const sender = demoUsers.find(u => u.id === message.senderId) || { name: message.senderName };
    
    // Format time
    const time = formatMessageTime(message.timestamp);
    
    messageElement.innerHTML = `
        <div class="message-avatar">
            <i class="fas fa-${sender.id === 'bot' ? 'robot' : 'user'}"></i>
        </div>
        <div class="message-content">
            ${!isSent ? `<div class="message-sender">${sender.name}</div>` : ''}
            <div class="message-text">${message.text}</div>
            <div class="message-time">${time}</div>
        </div>
    `;
    
    return messageElement;
}

// Switch to a different chat
function switchToChat(chatId) {
    currentChat = chatId;
    
    // Update chat header
    const contact = demoContacts.find(c => c.id === chatId);
    if (contact) {
        document.querySelector('.current-contact h3').textContent = contact.name;
        document.querySelector('.current-contact p').textContent = contact.isGroup ? `${contact.members} members` : contact.status || "Online";
        
        // Update avatar in chat header
        const avatarIcon = document.querySelector('.current-contact .contact-avatar i');
        avatarIcon.className = contact.avatarIcon;
    }
    
    // Load messages for this chat
    loadMessages(chatId);
}

// Format message time
function formatMessageTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) {
        return "Just now";
    } else if (diffMins < 60) {
        return `${diffMins}m ago`;
    } else if (diffHours < 24) {
        return `${diffHours}h ago`;
    } else if (diffDays < 7) {
        return `${diffDays}d ago`;
    } else {
        return date.toLocaleDateString();
    }
}

// Send a new message
function sendMessage() {
    const text = messageInput.value.trim();
    
    if (!text || !currentUser) return;
    
    // Create new message object
    const newMessage = {
        id: `msg${Date.now()}`,
        senderId: currentUser.id,
        senderName: currentUser.name,
        text: text,
        timestamp: new Date().toISOString(),
        chatId: currentChat
    };
    
    // Add to demo messages array
    demoMessages.push(newMessage);
    
    // Create and add message element
    const messageElement = createMessageElement(newMessage);
    messagesContainer.appendChild(messageElement);
    
    // Clear input
    messageInput.value = '';
    
    // Update contact's last message
    const contact = demoContacts.find(c => c.id === currentChat);
    if (contact) {
        contact.lastMessage = `${currentUser.name}: ${text}`;
        contact.lastMessageTime = newMessage.timestamp;
        
        // Update contact in the sidebar
        loadContacts();
    }
    
    // Scroll to bottom
    scrollToBottom();
    
    // Simulate a reply from the bot in general chat
    if (currentChat === "general" && text.toLowerCase().includes("hello")) {
        setTimeout(() => {
            const botReply = {
                id: `msg${Date.now()}`,
                senderId: "bot",
                senderName: "TeleChat Bot",
                text: "Hello! How can I help you today?",
                timestamp: new Date().toISOString(),
                chatId: currentChat
            };
            
            demoMessages.push(botReply);
            const replyElement = createMessageElement(botReply);
            messagesContainer.appendChild(replyElement);
            scrollToBottom();
        }, 1000);
    }
}

// Scroll to bottom of messages container
function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Setup event listeners
function setupEventListeners() {
    // Google login button
    googleLoginBtn.addEventListener('click', () => {
        // In a real app, this would use Firebase Google Auth
        // For demo, we'll simulate a login with a random user
        const randomUser = demoUsers[Math.floor(Math.random() * (demoUsers.length - 1))]; // Exclude bot
        
        currentUser = {
            id: randomUser.id,
            name: randomUser.name,
            email: randomUser.email,
            avatar: randomUser.avatar,
            status: "Online"
        };
        
        // Save to localStorage
        localStorage.setItem('telechat_user', JSON.stringify(currentUser));
        
        // Show chat screen
        showChatScreen();
        loadContacts();
        loadMessages(currentChat);
        updateUserInfo();
    });
    
    // Demo login button
    demoLoginBtn.addEventListener('click', () => {
        currentUser = {
            id: "demo",
            name: "Demo User",
            email: "demo@telechat.com",
            avatar: "DU",
            status: "Online",
            avatarIcon: "fas fa-user-circle"
        };
        
        // Save to localStorage
        localStorage.setItem('telechat_user', JSON.stringify(currentUser));
        
        // Show chat screen
        showChatScreen();
        loadContacts();
        loadMessages(currentChat);
        updateUserInfo();
    });
    
    // Logout button
    logoutBtn.addEventListener('click', () => {
        // In a real app, this would sign out from Firebase
        currentUser = null;
        localStorage.removeItem('telechat_user');
        showLoginScreen();
    });
    
    // Send message on button click
    sendBtn.addEventListener('click', sendMessage);
    
    // Send message on Enter key
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    // Search contacts
    searchContactsInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        
        document.querySelectorAll('.contact').forEach(contact => {
            const contactName = contact.querySelector('h4').textContent.toLowerCase();
            const lastMessage = contact.querySelector('p').textContent.toLowerCase();
            
            if (contactName.includes(searchTerm) || lastMessage.includes(searchTerm)) {
                contact.style.display = 'flex';
            } else {
                contact.style.display = 'none';
            }
        });
    });
    
    // New chat button
    document.getElementById('new-chat-btn').addEventListener('click', () => {
        alert("In a full implementation, this would open a new chat dialog.");
    });
    
    // Responsive behavior: toggle chat area on mobile
    document.querySelectorAll('.contact').forEach(contact => {
        contact.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                document.querySelector('.chat-area').classList.add('active');
            }
        });
    });
    
    // Close chat area on mobile (back button simulation)
    document.querySelector('.chat-header').addEventListener('click', (e) => {
        if (window.innerWidth <= 768 && e.target.closest('.chat-action-btn')) {
            document.querySelector('.chat-area').classList.remove('active');
        }
    });
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);