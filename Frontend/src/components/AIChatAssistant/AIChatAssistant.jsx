import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from './AIChatAssistant.module.css';
import { 
    FaRobot, FaUserCircle, FaPaperPlane, FaTimes, 
    FaAngleDown, FaSpinner, FaTrash, FaHistory,
    FaLightbulb, FaRegLightbulb, FaGraduationCap, FaComments, FaCommentDots,
    FaExpandAlt, FaCompressAlt
} from 'react-icons/fa';

/**
 * AI Learning Tutor Component - Completely redesigned
 * 
 * @param {Object} props
 * @param {string} props.contextTopic - The current topic or section being viewed
 * @param {Function} props.onSendMessage - Callback when user sends a message
 * @param {boolean} props.isOpen - Control for chat panel visibility
 * @param {Function} props.onToggleChat - Callback when chat is opened/closed
 * @param {Array} props.initialMessages - Initial messages for the chat
 * @param {Array} props.suggestedQuestions - Suggested questions to display
 * @param {string} props.welcomeMessage - Custom welcome message
 * @param {number} props.historyLength - Number of recent messages for context
 * @param {string} props.chatId - Unique identifier for this chat
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
    // Generate a consistent chat ID for localStorage
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
    
    // Check if the system is using dark mode
    const [isDarkMode, setIsDarkMode] = useState(
        window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    );
    
    // Listen for changes in the system's color scheme preference
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        
        const handleChange = (e) => {
            setIsDarkMode(e.matches);
        };
        
        // Add listener for theme changes
        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', handleChange);
        } else {
            // Fallback for older browsers
            mediaQuery.addListener(handleChange);
        }
        
        // Clean up
        return () => {
            if (mediaQuery.removeEventListener) {
                mediaQuery.removeEventListener('change', handleChange);
            } else {
                // Fallback for older browsers
                mediaQuery.removeListener(handleChange);
            }
        };
    }, []);
    
    // Also check for data-theme attribute on document
    useEffect(() => {
        const checkDocumentTheme = () => {
            const documentTheme = document.documentElement.getAttribute('data-theme');
            if (documentTheme) {
                setIsDarkMode(documentTheme === 'dark');
            }
        };
        
        // Check initially
        checkDocumentTheme();
        
        // Set up a mutation observer to detect theme changes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'data-theme') {
                    checkDocumentTheme();
                }
            });
        });
        
        observer.observe(document.documentElement, { attributes: true });
        
        return () => {
            observer.disconnect();
        };
    }, []);
    
    // Refs
    const chatMessagesRef = useRef(null);
    const chatInputRef = useRef(null);
    const messagesEndRef = useRef(null);
    
    // Determine if chat is controlled externally or internally
    const isChatOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
    
    // Check if there are any user messages in the conversation history
    const hasUserMessages = messages.some(message => message.sender === 'user');
    
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
            }, 400); // Increased delay to match the new animation
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
    const handleSendMessage = (suggestedQuestion = null) => {
        const messageText = suggestedQuestion || userInput.trim();
        
        if (!messageText) return;
        
        // Add user message
        const userMessage = {
            id: Date.now(),
            sender: 'user',
            content: messageText,
            timestamp: new Date()
        };
        
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setUserInput('');
        
        // Simulate AI typing
        setIsTyping(true);
        
        // Call the sendMessage function with context if it exists
        if (onSendMessage) {
            onSendMessage(messageText, contextTopic, [...messages.slice(-historyLength), userMessage]
                .filter(msg => msg.sender !== 'system') // Exclude system messages
                .map(msg => ({
                    role: msg.sender === 'user' ? 'user' : 'assistant',
                    content: msg.content
                }))
            )
            .then(response => {
                const aiMessage = {
                    id: Date.now(),
                    sender: 'ai',
                    content: response,
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, aiMessage]);
                setIsTyping(false);
            })
            .catch(error => {
                console.error("Error sending message:", error);
                const errorMessage = {
                    id: Date.now(),
                    sender: 'system',
                    content: "I'm sorry, I encountered an error. Please try again later.",
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, errorMessage]);
                setIsTyping(false);
            });
        } else {
            // Simulate response for demo if no onSendMessage provided
            setTimeout(() => {
                const aiMessage = {
                    id: Date.now(),
                    sender: 'ai',
                    content: `This is a simulated response to: "${messageText}"`,
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, aiMessage]);
                setIsTyping(false);
            }, 1500);
        }
    };
    
    // Scroll to bottom of chat when new messages arrive
    useEffect(() => {
        if (chatMessagesRef.current && isChatOpen) {
            chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
        }
    }, [messages, isChatOpen]);
    
    // Scroll to bottom when messages change
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);
    
    // Handle Enter key for sending messages
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };
    
    // Format timestamp for messages
    const formatTime = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    };
    
    // New state for expanded view
    const [isExpanded, setIsExpanded] = useState(false);
    
    // Get viewport dimensions
    const updateViewportDimensions = useCallback(() => {
        // This effect will update the CSS variable for the header height if needed
        const headerHeight = 
            getComputedStyle(document.documentElement).getPropertyValue('--header-height') || 
            '80px';
        
        document.documentElement.style.setProperty('--tutor-header-height', headerHeight);
    }, []);
    
    // Add resize listener
    useEffect(() => {
        // Initial update
        updateViewportDimensions();
        
        // Listen for window resize events
        window.addEventListener('resize', updateViewportDimensions);
        
        return () => {
            window.removeEventListener('resize', updateViewportDimensions);
        };
    }, [updateViewportDimensions]);
    
    // Toggle expanded view
    const toggleExpandedView = useCallback((e) => {
        e.stopPropagation();
        setIsExpanded(prev => !prev);
    }, []);
    
    return (
        <>
            {/* Chat Button */}
            <button 
                className={`${styles.chatButton} ${isChatOpen ? styles.chatButtonActive : ''}`}
                onClick={toggleChat}
                aria-label={isChatOpen ? "Close AI tutor" : "Open AI tutor"}
            >
                <div className={`${styles.buttonContent} ${isChatOpen ? styles.hidden : ''}`}>
                    <FaGraduationCap />
                </div>
                <div className={`${styles.buttonContent} ${!isChatOpen ? styles.hidden : ''}`}>
                    <FaTimes />
                </div>
            </button>
            
            {/* Chat Panel */}
            <div className={`${styles.chatPanel} ${isChatOpen ? styles.chatPanelOpen : ''} ${isExpanded ? styles.chatPanelExpanded : ''}`}>
                <div className={styles.chatHeader}>
                    <div className={styles.chatHeaderInfo}>
                        <div className={styles.chatHeaderIcon}>
                            <FaGraduationCap />
                        </div>
                        <div className={styles.chatHeaderText}>
                            <h3>AI Learning Tutor</h3>
                            <p>Studying: {contextTopic || 'This course'}</p>
                        </div>
                    </div>
                    <div className={styles.chatHeaderActions}>
                        <button 
                            className={styles.headerButton}
                            onClick={toggleExpandedView}
                            aria-label={isExpanded ? "Compress chat" : "Expand chat"}
                            title={isExpanded ? "Compress window" : "Expand window"}
                        >
                            {isExpanded ? <FaCompressAlt /> : <FaExpandAlt />}
                        </button>
                        <button 
                            className={styles.headerButton}
                            onClick={clearChatHistory}
                            aria-label="Clear chat history"
                            title="Clear conversation history"
                        >
                            <FaTrash />
                        </button>
                        <button 
                            className={styles.headerButton}
                            onClick={toggleChat}
                            aria-label="Minimize chat"
                        >
                            <FaTimes />
                        </button>
                    </div>
                </div>
                
                <div className={`${styles.chatMessages} ${(suggestedQuestions?.length > 0 && !hasUserMessages) ? styles.chatMessagesWithSuggestions : ''}`} ref={chatMessagesRef}>
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
                    
                    <div ref={messagesEndRef} />
                </div>
                
                {suggestedQuestions?.length > 0 && !hasUserMessages && (
                    <div className={styles.chatSuggestions}>
                        <p><FaLightbulb /> Try asking:</p>
                        <div className={styles.suggestionBubbles}>
                            {suggestedQuestions.map((question, index) => (
                                <button 
                                    key={index} 
                                    onClick={() => handleSendMessage(question)}
                                >
                                    {question}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                
                <div className={styles.chatInputArea}>
                    <input
                        type="text"
                        className={styles.chatInput}
                        placeholder="Ask me about this topic..."
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
                        {isTyping ? 
                            <FaSpinner className={styles.loadingIcon} /> : 
                            <FaPaperPlane />
                        }
                    </button>
                </div>
                
                {messages.length > 3 && (
                    <div className={styles.contextIndicator}>
                        <FaHistory /> AI has context from your previous messages
                    </div>
                )}
            </div>
        </>
    );
};

export default AIChatAssistant; 