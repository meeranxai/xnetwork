// app.js
import { 
    collection, 
    addDoc, 
    doc, 
    setDoc, 
    updateDoc, 
    onSnapshot, 
    query, 
    where, 
    orderBy, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

import { googleLogin, userLogout, onAuthChange } from './auth.js';
import { auth, db } from './firebase-config.js';

// DOM Elements
const loginScreen = document.getElementById('login-screen');
const chatScreen = document.getElementById('chat-screen');
const googleLoginBtn = document.getElementById('google-login-btn');
const demoLoginBtn = document.getElementById('demo-login-btn');
const demoLoginBtn2 = document.getElementById('demo-login-btn2');
const logoutBtn = document.getElementById('logout-btn');
const usernameElement = document.getElementById('username');
const userAvatarElement = document.getElementById('user-avatar');
const userStatusElement = document.getElementById('user-status');
const contactsList = document.getElementById('contacts-list');
const messagesContainer = document.getElementById('messages-container');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const currentChatNameElement = document.getElementById('current-chat-name');
const currentChatStatusElement = document.getElementById('current-chat-status');
const currentContactAvatarElement = document.getElementById('current-contact-avatar');
const loadingSpinner = document.getElementById('loading-spinner');
const searchContactsInput = document.getElementById('search-contacts');
const messageInputContainer = document.getElementById('message-input-container');
const welcomeMessage = document.getElementById('welcome-message');
const newChatBtn = document.getElementById('new-chat-btn');
const loginError = document.getElementById('login-error');

// Application State
let currentUser = null;
let currentChatWith = null;
let currentChatId = null;
let unsubscribeMessages = null;
let unsubscribeUsers = null;

// Initialize App
function initApp() {
    console.log("Initializing app...");
    
    // Check authentication state
    onAuthChange(async (user) => {
        if (user) {
            console.log("User logged in:", user.email);
            currentUser = user;
            await setupUserOnlineStatus();
            showChatScreen();
            loadUserData();
            loadContacts();
        } else {
            console.log("No user logged in");
            showLoginScreen();
        }
    });

    setupEventListeners();
}

// Show/Hide Screens
function showLoginScreen() {
    loginScreen.classList.add('active');
    chatScreen.classList.remove('active');
}

function showChatScreen() {
    loginScreen.classList.remove('active');
    chatScreen.classList.add('active');
}

// Handle Google Login
async function handleGoogleLogin() {
    try {
        loginError.style.display = 'none';
        googleLoginBtn.disabled = true;
        googleLoginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Connecting...</span>';
        
        const user = await googleLogin();
        currentUser = user;
        
        // Save user to Firestore
        await setDoc(doc(db, 'users', currentUser.uid), {
            uid: currentUser.uid,
            displayName: currentUser.displayName,
            email: currentUser.email,
            photoURL: currentUser.photoURL,
            lastSeen: serverTimestamp(),
            status: 'online',
            isOnline: true
        }, { merge: true });
        
        await setupUserOnlineStatus();
        showChatScreen();
        loadUserData();
        loadContacts();
        
    } catch (error) {
        console.error("Login failed:", error);
        loginError.style.display = 'block';
        
        if (error.code === 'auth/popup-blocked') {
            loginError.textContent = 'Popup blocked by browser. Please allow popups for this site.';
        } else if (error.code === 'auth/network-request-failed') {
            loginError.textContent = 'Network error. Please check your internet connection.';
        } else if (error.code === 'auth/popup-closed-by-user') {
            loginError.textContent = 'Login popup was closed. Please try again.';
        } else {
            loginError.textContent = `Login failed: ${error.message}`;
        }
    } finally {
        googleLoginBtn.disabled = false;
        googleLoginBtn.innerHTML = '<i class="fab fa-google"></i><span>Continue with Google</span>';
    }
}

// Demo Login
function handleDemoLogin(userNumber = 1) {
    currentUser = {
        uid: 'demo_user_' + userNumber + '_' + Date.now(),
        displayName: userNumber === 1 ? 'Demo User 1' : 'Demo User 2',
        email: `demo${userNumber}@telechat.com`,
        photoURL: null
    };
    
    showChatScreen();
    loadUserData();
    loadContacts();
    showDemoContacts(userNumber);
}

// Logout
async function handleLogout() {
    try {
        if (currentUser && !currentUser.uid.startsWith('demo_')) {
            await updateDoc(doc(db, 'users', currentUser.uid), {
                isOnline: false,
                lastSeen: serverTimestamp()
            });
            await userLogout();
        }
        
        currentUser = null;
        showLoginScreen();
        
        if (unsubscribeMessages) unsubscribeMessages();
        if (unsubscribeUsers) unsubscribeUsers();
        
    } catch (error) {
        console.error("Logout error:", error);
    }
}

// Setup user online status
async function setupUserOnlineStatus() {
    if (!currentUser || currentUser.uid.startsWith('demo_')) return;
    
    try {
        await updateDoc(doc(db, 'users', currentUser.uid), {
            isOnline: true,
            lastSeen: serverTimestamp()
        });
        
        window.addEventListener('beforeunload', async () => {
            if (currentUser && !currentUser.uid.startsWith('demo_')) {
                await updateDoc(doc(db, 'users', currentUser.uid), {
                    isOnline: false,
                    lastSeen: serverTimestamp()
                });
            }
        });
    } catch (error) {
        console.error("Error setting up online status:", error);
    }
}

// Load User Data
function loadUserData() {
    if (currentUser) {
        usernameElement.textContent = currentUser.displayName || 'User';
        userStatusElement.textContent = 'Online';
        
        if (currentUser.photoURL) {
            userAvatarElement.innerHTML = `<img src="${currentUser.photoURL}" style="width:100%;height:100%;border-radius:50%;" alt="User">`;
        } else {
            const initials = currentUser.displayName ? 
                currentUser.displayName.charAt(0).toUpperCase() : 'U';
            userAvatarElement.innerHTML = initials;
        }
    }
}

// Load Contacts
function loadContacts() {
    contactsList.innerHTML = '<div class="no-contacts" id="no-contacts"><p>Loading contacts...</p></div>';
    
    if (currentUser && !currentUser.uid.startsWith('demo_')) {
        const q = query(collection(db, 'users'), where('uid', '!=', currentUser.uid));
        
        unsubscribeUsers = onSnapshot(q, (snapshot) => {
            contactsList.innerHTML = '';
            
            if (snapshot.empty) {
                contactsList.innerHTML = '<div class="no-contacts"><p>No other users online. Share this app with friends!</p></div>';
            }
            
            snapshot.forEach((doc) => {
                const user = doc.data();
                addContactToList(user);
            });
        }, (error) => {
            console.error("Error loading contacts:", error);
            contactsList.innerHTML = '<div class="no-contacts"><p>Error loading contacts. Please refresh.</p></div>';
        });
    }
}

// Add contact to list
function addContactToList(contact, isDemo = false) {
    const contactElement = document.createElement('div');
    contactElement.className = 'contact';
    contactElement.dataset.userId = contact.uid;
    
    let statusText = contact.status || 'Online';
    let isOnline = contact.isOnline || false;
    
    if (!isOnline && contact.lastSeen) {
        const lastSeen = contact.lastSeen.toDate ? contact.lastSeen.toDate() : new Date();
        const diff = Date.now() - lastSeen.getTime();
        const minutes = Math.floor(diff / 60000);
        
        if (minutes < 1) statusText = 'Just now';
        else if (minutes < 60) statusText = `Last seen ${minutes} min ago`;
        else if (minutes < 1440) statusText = `Last seen ${Math.floor(minutes/60)} hours ago`;
        else statusText = `Last seen ${Math.floor(minutes/1440)} days ago`;
    }
    
    contactElement.innerHTML = `
        <div class="contact-avatar">
            ${contact.photoURL ? 
                `<img src="${contact.photoURL}" style="width:100%;height:100%;border-radius:50%;" alt="${contact.displayName}">` :
                `<i class="fas fa-user"></i>`
            }
            ${isOnline ? '<span class="online-indicator"></span>' : ''}
        </div>
        <div class="contact-info">
            <h4>${contact.displayName}</h4>
            <p class="${isOnline ? 'status-online' : 'status-offline'}">
                ${isOnline ? 'Online' : statusText}
            </p>
        </div>
    `;
    
    contactElement.addEventListener('click', () => {
        startPrivateChat(contact.uid, contact.displayName, contact.photoURL, isOnline);
    });
    
    contactsList.appendChild(contactElement);
}

// Start Private Chat
function startPrivateChat(userId, userName, userPhoto, isOnline) {
    currentChatWith = userId;
    
    const chatIds = [currentUser.uid, userId].sort();
    currentChatId = `private_${chatIds[0]}_${chatIds[1]}`;
    
    currentChatNameElement.textContent = userName;
    currentChatStatusElement.textContent = isOnline ? 'Online' : 'Offline';
    currentChatStatusElement.className = isOnline ? 'status-online' : 'status-offline';
    
    if (userPhoto) {
        currentContactAvatarElement.innerHTML = `<img src="${userPhoto}" style="width:100%;height:100%;border-radius:50%;" alt="${userName}">`;
    } else {
        const initials = userName ? userName.charAt(0).toUpperCase() : 'U';
        currentContactAvatarElement.innerHTML = initials;
    }
    
    messageInputContainer.style.display = 'flex';
    welcomeMessage.style.display = 'none';
    
    document.querySelectorAll('.contact').forEach(contact => {
        contact.classList.remove('active');
        if (contact.dataset.userId === userId) {
            contact.classList.add('active');
        }
    });
    
    loadMessages(currentChatId);
}

// Load Messages
function loadMessages(chatId) {
    messagesContainer.innerHTML = '';
    loadingSpinner.style.display = 'block';
    
    if (unsubscribeMessages) {
        unsubscribeMessages();
    }
    
    if (currentUser && currentUser.uid && currentUser.uid.startsWith('demo_')) {
        loadingSpinner.style.display = 'none';
        showDemoMessages();
        return;
    }
    
    const q = query(
        collection(db, 'messages'),
        where('chatId', '==', chatId),
        orderBy('timestamp', 'asc')
    );
    
    unsubscribeMessages = onSnapshot(q, (snapshot) => {
        loadingSpinner.style.display = 'none';
        messagesContainer.innerHTML = '';
        
        if (snapshot.empty) {
            messagesContainer.innerHTML = `
                <div class="message-date">Today</div>
                <div style="text-align: center; padding: 40px 20px; color: #666;">
                    <p>Start a conversation with ${currentChatNameElement.textContent}</p>
                    <p>Send your first message!</p>
                </div>
            `;
        } else {
            const dateHeader = document.createElement('div');
            dateHeader.className = 'message-date';
            dateHeader.textContent = 'Today';
            messagesContainer.appendChild(dateHeader);
            
            snapshot.forEach((doc) => {
                const message = doc.data();
                addMessageToUI(message);
            });
        }
        
        scrollToBottom();
    }, (error) => {
        console.error("Error loading messages:", error);
        loadingSpinner.style.display = 'none';
        messagesContainer.innerHTML = '<p style="text-align: center; padding: 20px; color: #666;">Error loading messages.</p>';
    });
}

// Send Message
async function sendMessage() {
    const text = messageInput.value.trim();
    if (!text || !currentUser || !currentChatId || !currentChatWith) {
        alert("Please select a contact to chat with first.");
        return;
    }
    
    const messageData = {
        text: text,
        senderId: currentUser.uid,
        senderName: currentUser.displayName || 'User',
        senderPhotoURL: currentUser.photoURL || null,
        receiverId: currentChatWith,
        chatId: currentChatId,
        timestamp: serverTimestamp(),
        read: false
    };
    
    try {
        if (currentUser.uid.startsWith('demo_')) {
            const demoMessage = {
                ...messageData,
                timestamp: new Date()
            };
            addMessageToUI(demoMessage);
            messageInput.value = '';
            scrollToBottom();
            
            setTimeout(() => {
                const replyMessage = {
                    text: `Thanks for your message: "${text}"`,
                    senderId: currentChatWith,
                    senderName: currentChatNameElement.textContent,
                    timestamp: new Date(),
                    chatId: currentChatId
                };
                addMessageToUI(replyMessage);
                scrollToBottom();
            }, 1000);
            return;
        }
        
        await addDoc(collection(db, 'messages'), messageData);
        messageInput.value = '';
        scrollToBottom();
    } catch (error) {
        console.error("Error sending message:", error);
        alert("Failed to send message: " + error.message);
    }
}

// Helper Functions
function showDemoContacts(userNumber) {
    contactsList.innerHTML = '';
    
    if (userNumber === 1) {
        addContactToList({
            uid: 'demo_user_2',
            displayName: 'Demo User 2',
            status: 'Online',
            isOnline: true
        }, true);
        
        addContactToList({
            uid: 'demo_user_3',
            displayName: 'Demo User 3',
            status: 'Last seen 5 min ago',
            isOnline: false
        }, true);
    } else {
        addContactToList({
            uid: 'demo_user_1',
            displayName: 'Demo User 1',
            status: 'Online',
            isOnline: true
        }, true);
        
        addContactToList({
            uid: 'demo_user_3',
            displayName: 'Demo User 3',
            status: 'Last seen 10 min ago',
            isOnline: false
        }, true);
    }
}

function showDemoMessages() {
    const demoMessages = [
        {
            senderId: currentChatWith,
            senderName: currentChatNameElement.textContent,
            text: 'Hello! This is a demo chat.',
            timestamp: new Date(Date.now() - 300000),
            chatId: currentChatId
        },
        {
            senderId: currentUser.uid,
            senderName: currentUser.displayName,
            text: 'Hi there! Nice to meet you.',
            timestamp: new Date(Date.now() - 240000),
            chatId: currentChatId
        },
        {
            senderId: currentChatWith,
            senderName: currentChatNameElement.textContent,
            text: 'This is how real-time chat works between two users.',
            timestamp: new Date(Date.now() - 180000),
            chatId: currentChatId
        },
        {
            senderId: currentUser.uid,
            senderName: currentUser.displayName,
            text: 'I can see your messages instantly!',
            timestamp: new Date(Date.now() - 120000),
            chatId: currentChatId
        },
        {
            senderId: currentChatWith,
            senderName: currentChatNameElement.textContent,
            text: 'Yes! And if another user joins, they will appear in your contacts list.',
            timestamp: new Date(Date.now() - 60000),
            chatId: currentChatId
        }
    ];
    
    messagesContainer.innerHTML = '<div class="message-date">Today</div>';
    demoMessages.forEach(msg => addMessageToUI(msg));
    scrollToBottom();
}

function addMessageToUI(message) {
    const isSent = message.senderId === currentUser?.uid;
    const messageElement = document.createElement('div');
    messageElement.className = `message ${isSent ? 'sent' : 'received'}`;
    
    const time = formatTime(message.timestamp?.toDate() || new Date());
    
    messageElement.innerHTML = `
        <div class="message-avatar">
            ${message.senderId === currentChatWith && currentChatWith && currentChatWith.startsWith('demo_') ? 
                (message.senderName === 'Demo User 2' ? 'D2' : 'D1') :
                (message.senderPhotoURL ? 
                    `<img src="${message.senderPhotoURL}" style="width:100%;height:100%;border-radius:50%;" alt="${message.senderName}">` :
                    '<i class="fas fa-user"></i>')
            }
        </div>
        <div class="message-content">
            ${!isSent ? `<div class="message-sender">${message.senderName}</div>` : ''}
            <div class="message-text">${message.text}</div>
            <div class="message-time">${time}</div>
        </div>
    `;
    
    messagesContainer.appendChild(messageElement);
}

function formatTime(date) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Setup Event Listeners
function setupEventListeners() {
    googleLoginBtn.addEventListener('click', handleGoogleLogin);
    demoLoginBtn.addEventListener('click', () => handleDemoLogin(1));
    demoLoginBtn2.addEventListener('click', () => handleDemoLogin(2));
    logoutBtn.addEventListener('click', handleLogout);
    sendBtn.addEventListener('click', sendMessage);
    
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    newChatBtn.addEventListener('click', () => {
        if (currentUser && !currentUser.uid.startsWith('demo_')) {
            alert("Other users will automatically appear here when they sign in with Google. Share the app link with friends!");
        } else {
            alert("In demo mode, you can chat with the pre-loaded demo users.");
        }
    });
    
    searchContactsInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        document.querySelectorAll('.contact').forEach(contact => {
            const name = contact.querySelector('h4').textContent.toLowerCase();
            if (name.includes(searchTerm)) {
                contact.style.display = 'flex';
            } else {
                contact.style.display = 'none';
            }
        });
    });
}

// Initialize the app
document.addEventListener('DOMContentLoaded', initApp);
