// Firebase Configuration
// Replace with your own Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyDummyAPIKeyForDemoPurposesOnly",
    authDomain: "telechat-demo.firebaseapp.com",
    projectId: "telechat-demo",
    storageBucket: "telechat-demo.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef1234567890abcdef"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Google Auth Provider
const provider = new firebase.auth.GoogleAuthProvider();

// For demo purposes, we'll simulate Firebase functionality
// In a real app, you would use the actual Firebase methods

// Demo user data
const demoUsers = [
    {
        id: "user1",
        name: "John Doe",
        email: "john@example.com",
        avatar: "JD",
        status: "Online"
    },
    {
        id: "user2",
        name: "Alice Smith",
        email: "alice@example.com",
        avatar: "AS",
        status: "Online"
    },
    {
        id: "user3",
        name: "Bob Johnson",
        email: "bob@example.com",
        avatar: "BJ",
        status: "Away"
    },
    {
        id: "bot",
        name: "TeleChat Bot",
        email: "bot@telechat.com",
        avatar: "🤖",
        status: "Online"
    }
];

// Demo messages
const demoMessages = [
    {
        id: "msg1",
        senderId: "bot",
        senderName: "TeleChat Bot",
        text: "Welcome to TeleChat! This is a demo of a Telegram-style chat system. You can send messages, connect with friends, and more.",
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        chatId: "general"
    },
    {
        id: "msg2",
        senderId: "user1",
        senderName: "John Doe",
        text: "Hi there! This looks great. I'm excited to try out this chat system.",
        timestamp: new Date(Date.now() - 3540000).toISOString(),
        chatId: "general"
    },
    {
        id: "msg3",
        senderId: "user2",
        senderName: "Alice Smith",
        text: "Hello everyone! How's it going?",
        timestamp: new Date(Date.now() - 3000000).toISOString(),
        chatId: "general"
    },
    {
        id: "msg4",
        senderId: "user3",
        senderName: "Bob Johnson",
        text: "This interface is really smooth. Good job!",
        timestamp: new Date(Date.now() - 2700000).toISOString(),
        chatId: "general"
    }
];

// Demo contacts
const demoContacts = [
    {
        id: "general",
        name: "General Chat",
        isGroup: true,
        lastMessage: "Bob Johnson: This interface is really smooth. Good job!",
        lastMessageTime: new Date(Date.now() - 2700000).toISOString(),
        members: 5,
        avatarIcon: "fas fa-user-friends"
    },
    {
        id: "alice",
        name: "Alice Smith",
        isGroup: false,
        lastMessage: "See you tomorrow!",
        lastMessageTime: new Date(Date.now() - 86400000).toISOString(),
        members: 2,
        avatarIcon: "fas fa-user"
    },
    {
        id: "bob",
        name: "Bob Johnson",
        isGroup: false,
        lastMessage: "Thanks for your help!",
        lastMessageTime: new Date(Date.now() - 172800000).toISOString(),
        members: 2,
        avatarIcon: "fas fa-user"
    },
    {
        id: "work",
        name: "Work Team",
        isGroup: true,
        lastMessage: "Meeting at 3 PM",
        lastMessageTime: new Date(Date.now() - 259200000).toISOString(),
        members: 8,
        avatarIcon: "fas fa-briefcase"
    }
];