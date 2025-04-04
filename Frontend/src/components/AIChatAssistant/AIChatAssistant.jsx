import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from './AIChatAssistant.module.css';
import { 
    FaRobot, FaUserCircle, FaPaperPlane, FaTimes, 
    FaAngleDown, FaSpinner, FaTrash, FaHistory
} from 'react-icons/fa';

/**
 * AI Chat Assistant Component
 * 
 * @param {Object} props
 * @param {string} props.contextTopic - The current topic or section being viewed (for context-aware responses)
 * @param {Function} props.onSendMessage - Required callback when user sends a message
 * @param {boolean} props.isOpen - Optional control for chat panel visibility
 * @param {Function} props.onToggleChat - Optional callback when chat is opened/closed
 * @param {Array} props.initialMessages - Optional initial messages for the chat
 * @param {Array} props.suggestedQuestions - Optional suggested questions to display
 * @param {string} props.welcomeMessage - Optional custom welcome message
 * @param {number} props.historyLength - Optional number of recent messages to include for context (default: 4)
 * @param {string} props.chatId - Optional unique identifier for this chat (defaults to courseName-sectionId if not provided)
 */
const AIChatAssistant = ({
    contextTopic,
    onSendMessage,
    isOpen: externalIsOpen,
    onToggleChat,
    initialMessages = [],
    suggestedQuestions = [
        "What are the key concepts here?",
        "Can you explain this topic simply?",
        "How does this apply to real-world scenarios?",
        "What should I focus on learning next?"
    ],
    welcomeMessage = "Hi there! I'm your learning assistant. How can I help you understand this topic better?",
    historyLength = 4,
    chatId
}) => {
    // Generate a consistent chat ID based on context or use provided one
    const derivedChatId = chatId || `chat-${contextTopic ? contextTopic.replace(/\s+/g, '-').toLowerCase() : 'assistant'}`;
    
    // State management
    const [internalIsOpen, setInternalIsOpen] = useState(false);
    const [messages, setMessages] = useState(() => {
        // Try to load saved messages from localStorage
        try {
            const savedMessages = localStorage.getItem(`chat_history_${derivedChatId}`);
            if (savedMessages) {
                const parsedMessages = JSON.parse(savedMessages);
                
                // If there are saved messages and they're valid, use them
                if (Array.isArray(parsedMessages) && parsedMessages.length > 0) {
                    console.log(`Loaded ${parsedMessages.length} saved messages for chat ${derivedChatId}`);
                    return parsedMessages;
                }
            }
        } catch (error) {
            console.warn('Error loading saved chat messages:', error);
        }
        
        // Fall back to initial messages or default welcome message
        return initialMessages.length > 0 ? initialMessages : [
            { 
                id: 1, 
                sender: 'ai', 
                content: welcomeMessage,
                timestamp: new Date()
            }
        ];
    });
    const [userInput, setUserInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    
    // Refs
    const chatMessagesRef = useRef(null);
    const chatInputRef = useRef(null);
    
    // Determine if chat is controlled externally or internally
    const isChatOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
    
    // Save messages to localStorage whenever they change
    useEffect(() => {
        if (messages.length > 0) {
            try {
                localStorage.setItem(`chat_history_${derivedChatId}`, JSON.stringify(messages));
            } catch (error) {
                console.warn('Error saving chat messages to localStorage:', error);
            }
        }
    }, [messages, derivedChatId]);
    
    // Toggle chat function
    const toggleChat = useCallback(() => {
        const newState = !isChatOpen;
        
        // Update internal state if not controlled externally
        if (externalIsOpen === undefined) {
            setInternalIsOpen(newState);
        }
        
        // Call external handler if provided
        if (onToggleChat) {
            onToggleChat(newState);
        }
        
        // Focus input when opening
        if (newState) {
            setTimeout(() => {
                chatInputRef.current?.focus();
            }, 300);
        }
    }, [isChatOpen, externalIsOpen, onToggleChat]);
    
    // Clear chat history
    const clearChatHistory = useCallback(() => {
        // Add a system message indicating the conversation was cleared
        const systemMessage = {
            id: Date.now(),
            sender: 'system',
            content: "Conversation history has been cleared.",
            timestamp: new Date()
        };
        
        // Reset to initial state with welcome message and system message
        setMessages([
            { 
                id: Date.now() - 100, 
                sender: 'ai', 
                content: welcomeMessage,
                timestamp: new Date()
            },
            systemMessage
        ]);
        
        // Clear from localStorage
        localStorage.removeItem(`chat_history_${derivedChatId}`);
    }, [welcomeMessage, derivedChatId]);
    
    // Handle sending a message
    const handleSendMessage = useCallback(() => {
        if (!userInput.trim() || !onSendMessage) return;
        
        // Create new user message
        const newUserMessage = {
            id: Date.now(),
            sender: 'user',
            content: userInput.trim(),
            timestamp: new Date()
        };
        
        // Add user message to chat
        setMessages(prev => [...prev, newUserMessage]);
        setUserInput('');
        
        // Show typing indicator
        setIsTyping(true);
        
        // Get recent conversation history for context
        const recentMessages = [...messages.slice(-historyLength), newUserMessage]
            .filter(msg => msg.sender !== 'system') // Exclude system messages
            .map(msg => ({
                role: msg.sender === 'user' ? 'user' : 'assistant',
                content: msg.content
            }));
        
        // Get response from external handler
        try {
            // Pass the message and conversation history to the external handler
            const responsePromise = onSendMessage(
                newUserMessage.content, 
                contextTopic,
                recentMessages
            );
            
            // If it returns a promise, handle it
            if (responsePromise && typeof responsePromise.then === 'function') {
                responsePromise
                    .then(response => {
                        setMessages(prev => [...prev, {
                            id: Date.now(),
                            sender: 'ai',
                            content: response,
                            timestamp: new Date()
                        }]);
                    })
                    .catch(error => {
                        console.error('Error getting response:', error);
                        setMessages(prev => [...prev, {
                            id: Date.now(),
                            sender: 'ai',
                            content: "Sorry, I couldn't process your request. Please try again.",
                            timestamp: new Date()
                        }]);
                    })
                    .finally(() => {
                        setIsTyping(false);
                    });
            } else {
                // If not a promise, treat as synchronous response
                setMessages(prev => [...prev, {
                    id: Date.now(),
                    sender: 'ai',
                    content: responsePromise || "No response available",
                    timestamp: new Date()
                }]);
                setIsTyping(false);
            }
        } catch (error) {
            console.error('Error in message handler:', error);
            setMessages(prev => [...prev, {
                id: Date.now(),
                sender: 'ai',
                content: "An error occurred. Please try again.",
                timestamp: new Date()
            }]);
            setIsTyping(false);
        }
    }, [userInput, contextTopic, onSendMessage, messages, historyLength]);
    
    // Scroll to bottom of chat when new messages arrive
    useEffect(() => {
        if (chatMessagesRef.current && isChatOpen) {
            chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
        }
    }, [messages, isChatOpen]);
    
    // Handle Enter key for sending messages
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };
    
    // Handle clicking on a suggested question
    const handleSuggestionClick = (question) => {
        setUserInput(question);
        chatInputRef.current?.focus();
    };
    
    // Format timestamp for messages
    const formatTime = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    };
    
    return (
        <>
            {/* Chat Button */}
            <button 
                className={`${styles.chatButton} ${isChatOpen ? styles.chatButtonActive : ''}`}
                onClick={toggleChat}
                aria-label={isChatOpen ? "Close AI assistant" : "Open AI assistant"}
            >
                {isChatOpen ? <FaTimes /> : <><FaRobot /> <span>AI Tutor</span></>}
            </button>
            
            {/* Chat Panel */}
            <div className={`${styles.chatPanel} ${isChatOpen ? styles.chatPanelOpen : ''}`}>
                <div className={styles.chatHeader}>
                    <div className={styles.chatHeaderInfo}>
                        <FaRobot className={styles.chatHeaderIcon} />
                        <div className={styles.chatHeaderText}>
                            <h3>AI Learning Assistant</h3>
                            <p>Ask questions about {contextTopic || 'this course'}</p>
                        </div>
                    </div>
                    <div className={styles.chatHeaderActions}>
                        <button 
                            className={styles.clearChatButton}
                            onClick={clearChatHistory}
                            aria-label="Clear chat history"
                            title="Clear conversation history"
                        >
                            <FaTrash />
                        </button>
                        <button 
                            className={styles.chatMinimize}
                            onClick={toggleChat}
                            aria-label="Minimize chat"
                        >
                            <FaAngleDown />
                        </button>
                    </div>
                </div>
                
                <div className={styles.chatMessages} ref={chatMessagesRef}>
                    {messages.map(message => (
                        <div 
                            key={message.id}
                            className={`${styles.chatMessage} ${
                                message.sender === 'user' 
                                    ? styles.userMessage 
                                    : message.sender === 'system' 
                                        ? styles.systemMessage 
                                        : styles.aiMessage
                            }`}
                        >
                            {message.sender !== 'system' && (
                                <div className={styles.messageAvatar}>
                                    {message.sender === 'user' ? 
                                        <FaUserCircle /> : 
                                        <FaRobot />
                                    }
                                </div>
                            )}
                            <div className={styles.messageContent}>
                                <div className={styles.messageText}>{message.content}</div>
                                {message.sender !== 'system' && (
                                    <div className={styles.messageTime}>
                                        {formatTime(message.timestamp)}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    
                    {isTyping && (
                        <div className={`${styles.chatMessage} ${styles.aiMessage}`}>
                            <div className={styles.messageAvatar}>
                                <FaRobot />
                            </div>
                            <div className={styles.typingIndicator}>
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        </div>
                    )}
                </div>
                
                <div className={styles.chatInputArea}>
                    <input
                        type="text"
                        className={styles.chatInput}
                        placeholder="Type your question here..."
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        ref={chatInputRef}
                        aria-label="Chat message input"
                    />
                    <button
                        className={styles.chatSendButton}
                        onClick={handleSendMessage}
                        disabled={!userInput.trim() || isTyping}
                        aria-label="Send message"
                    >
                        {isTyping ? <FaSpinner className={styles.loadingIcon} /> : <FaPaperPlane />}
                    </button>
                </div>
                
                {suggestedQuestions?.length > 0 && (
                    <div className={styles.chatSuggestions}>
                        <p>Try asking:</p>
                        <div className={styles.suggestionBubbles}>
                            {suggestedQuestions.map((question, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleSuggestionClick(question)}
                                >
                                    {question}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                
                {messages.length > 3 && (
                    <div className={styles.contextIndicator}>
                        <FaHistory /> Conversation context is active
                    </div>
                )}
            </div>
        </>
    );
};

export default AIChatAssistant; 