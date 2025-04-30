'use client';
/*eslint-disable*/

import Link from '@/components/link/Link';
import MessageBoxChat from '@/components/MessageBoxChat';
import { ChatBody, AIModel } from '@/types/types';
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Button,
  Flex,
  Icon,
  Img,
  Input,
  Text,
  useColorModeValue,
  IconButton,
} from '@chakra-ui/react';
import { useEffect, useState, useRef } from 'react';
import { MdAutoAwesome, MdBolt, MdEdit, MdPerson, MdAdd, MdDelete, MdChatBubbleOutline, MdMessage } from 'react-icons/md';
import { FiMessageSquare } from 'react-icons/fi';
import Bg from '../public/img/chat/bg-image.png';
import Head from 'next/head';

// Define message type
interface Message {
  role: 'user' | 'model';
  content: string;
}

// Define chat history type
interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  timestamp: Date;
}

export default function Chat(props: { apiKeyApp: string }) {
  // Input State
  const [inputCode, setInputCode] = useState<string>('');
  // Messages State
  const [messages, setMessages] = useState<Message[]>([]);
  // AI model - Gemini only
  const [model] = useState<AIModel>('gemini-1.5-flash');
  // Loading state
  const [loading, setLoading] = useState<boolean>(false);
  // Abort controller
  const abortController = useRef<AbortController | null>(null);
  // Current chat ID 
  const [currentChatId, setCurrentChatId] = useState<string>('default');
  // Chat history
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([
    {
      id: 'default',
      title: 'New conversation',
      messages: [],
      timestamp: new Date()
    }
  ]);
  // Ref for the message container to control scrolling
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Colors and Styles
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.200');
  const inputColor = useColorModeValue('navy.700', 'white');
  const iconColor = useColorModeValue('brand.500', 'white');
  const brandColor = useColorModeValue('brand.500', 'white');
  const gray = useColorModeValue('gray.500', 'white');
  const textColor = useColorModeValue('navy.700', 'white');
  const placeholderColor = useColorModeValue(
    { color: 'gray.500' },
    { color: 'whiteAlpha.600' },
  );
  const headerBg = useColorModeValue('white', 'navy.800');

  const createNewChat = () => {
    // Generate a unique ID
    const newChatId = `chat_${Date.now()}`;
    
    // Create a new chat session
    const newChat: ChatSession = {
      id: newChatId,
      title: 'New conversation',
      messages: [],
      timestamp: new Date()
    };
    
    // Add to chat history
    setChatHistory(prev => [...prev, newChat]);
    
    // Set as current chat
    setCurrentChatId(newChatId);
    
    // Clear messages
    setMessages([]);
  };

  const handleTranslate = async () => {
    const currentInput = inputCode.trim(); // Capture and trim current input
    if (!currentInput) {
      alert('Please enter a message.');
      return;
    }

    let apiKey = localStorage.getItem('apiKey');

    // Chat post conditions
    const maxCodeLength = 700;
    if (!apiKey?.includes('AIza')) {
      alert('Please enter a valid Google AI API key.');
      return;
    }
    if (currentInput.length > maxCodeLength) {
      alert(
        `Please enter text less than ${maxCodeLength} characters. You are currently at ${currentInput.length} characters.`,
      );
      return;
    }

    setLoading(true);
    setInputCode(''); // Clear input field immediately
    
    // Add user message to history
    const newUserMessage: Message = { role: 'user', content: currentInput };
    setMessages((prevMessages) => [...prevMessages, newUserMessage]);

    // Add empty model message placeholder
    const newModelMessage: Message = { role: 'model', content: '' };
    setMessages((prevMessages) => [...prevMessages, newModelMessage]);
    
    abortController.current = new AbortController();
    const body: ChatBody = {
      inputCode: currentInput, // Use the captured input
      model,
      apiKey,
    };

    try {
    // -------------- Fetch --------------
    const response = await fetch('./api/chatAPI', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
        signal: abortController.current.signal,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      setLoading(false);
        setMessages(prev => prev.slice(0, -1)); // Remove model placeholder on error
        alert(
          'Something went wrong fetching from the API. Make sure to use a valid API key.',
        );
      return;
    }

    const data = response.body;
    if (!data) {
      setLoading(false);
        setMessages(prev => prev.slice(0, -1)); // Remove model placeholder on error
        alert('Something went wrong: No response body');
      return;
    }

    const reader = data.getReader();
    const decoder = new TextDecoder();
    let done = false;

    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      const chunkValue = decoder.decode(value);
        if (chunkValue) {
          setMessages((prevMessages) => {
            const lastMessageIndex = prevMessages.length - 1;
            if (lastMessageIndex >= 0 && prevMessages[lastMessageIndex].role === 'model') {
              const updatedMessages = [...prevMessages];
              updatedMessages[lastMessageIndex] = {
                ...updatedMessages[lastMessageIndex],
                content: updatedMessages[lastMessageIndex].content + chunkValue,
              };
              return updatedMessages;
            }
            return prevMessages; // Should not happen if placeholder was added correctly
          });
        }
      }
      
      // Update the title of the current chat if it's the first message
      setChatHistory(prevHistory => {
        return prevHistory.map(chat => {
          if (chat.id === currentChatId) {
            // If this is the first user message and title is still default, use a snippet of it as title
            if ((chat.title === 'New conversation') && chat.messages.length <= 2) {
              // Extract a reasonable title from user's first message
              const titleText = currentInput.length > 30 
                ? currentInput.slice(0, 27) + '...' 
                : currentInput;
              return { ...chat, title: titleText, messages: messages };
            }
            return { ...chat, messages: messages };
          }
          return chat;
        });
      });
      
    } catch (error: any) {
        if (error.name === 'AbortError') {
            console.log('Fetch aborted');
             setMessages(prev => prev.slice(0, -1)); // Remove placeholder if aborted
        } else {
            console.error('Fetch error:', error);
            setMessages(prev => prev.slice(0, -1)); // Remove placeholder on other errors
            alert('An error occurred while fetching the response.');
    }
    } finally {
    setLoading(false);
        abortController.current = null;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Prevent default newline on Enter
      handleTranslate();
    }
  };

  // Function to stop the stream
  const stopStream = () => {
    if (abortController.current) {
      abortController.current.abort();
      abortController.current = null;
    }
  };

  useEffect(() => {
    // Cleanup function to abort fetch if component unmounts
    return () => {
      stopStream();
    };
  }, []);

  const handleChange = (Event: any) => {
    setInputCode(Event.target.value);
  };

  // Sync messages with current chat session
  useEffect(() => {
    // Find current chat
    const currentChat = chatHistory.find(chat => chat.id === currentChatId);
    if (currentChat) {
      setMessages(currentChat.messages);
    }
  }, [currentChatId]);

  // Update chat history when messages change
  useEffect(() => {
    setChatHistory(prevHistory => {
      return prevHistory.map(chat => {
        if (chat.id === currentChatId) {
          return { ...chat, messages };
        }
        return chat;
      });
    });

    // Scroll to bottom when messages change
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Add effect to prevent body scrolling
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <>
      <Head>
        <style>{`
          html, body {
            overflow: hidden;
            height: 100%;
            margin: 0;
            padding: 0;
          }
        `}</style>
      </Head>
      
      {/* Main chat container - Removed fixed positioning, uses standard Flexbox */}
      <Flex
        direction="column"
        /* Remove fixed positioning properties */
        /* position="fixed" */
        /* top="0" */
        /* right="0" */
        /* bottom="0" */
        /* left={{ base: "0", md: "250px" }} */ 
        /* zIndex={10} */
        height="100%" /* Fill height provided by parent */
        width="100%"  /* Fill width provided by parent */
        overflow="hidden" /* Prevent this container from scrolling */
        bg="navy.900"
      >
        {/* 1. Header (Fixed Height) */}
          <Flex
          p="10px 20px"
          borderBottom="1px solid"
          borderColor={borderColor}
          bg="navy.900"
          alignItems="center"
          justifyContent="space-between"
          height="60px" /* Fixed height */
          width="100%"
          flexShrink={0} /* Don't shrink */
        >
          <Text fontSize="lg" fontWeight="600" color={textColor} maxW="70%" noOfLines={1}>
            {chatHistory.find(chat => chat.id === currentChatId)?.title || 'Chat'}
          </Text>
          <Button
            leftIcon={<FiMessageSquare />} 
            aria-label="New Chat"
            variant="api"
            fontSize="sm"
            fontWeight="600"
            borderRadius="45px"
            minH="40px"
            size="md"
            onClick={createNewChat}
          >
            New chat
          </Button>
          </Flex>

        {/* 2. Message Content Area (Scrollable, Takes Remaining Space) */}
        <Box
          ref={messagesContainerRef}
          flexGrow={1} 
          width="100%"
          overflowY="auto" 
          overflowX="hidden" 
          pt="40px" /* Changed from py=10px to specific top padding */
          pb="10px" /* Keep bottom padding */
          css={{
            '&::-webkit-scrollbar': { width: '4px' },
            '&::-webkit-scrollbar-track': { width: '6px' },
            '&::-webkit-scrollbar-thumb': { background: '#CBD5E0', borderRadius: '24px' },
            scrollbarWidth: 'thin',
          }}
        >
          {/* Inner container for content - Reinstated maxW and mx, wider value */}
          <Box
            width="100%"
            maxW="1200px" /* Increased max width */
            mx="auto" /* Center the container */
            px="20px" /* Keep horizontal padding */
            minHeight="100%"
            display="flex"
            flexDirection="column"
          >
            {messages.length === 0 ? (
              <Flex 
                direction="column" 
                alignItems="center" 
                justifyContent="center" 
                flexGrow={1} /* Center empty state vertically */
                opacity="0.6"
              >
                <Icon as={FiMessageSquare} w="40px" h="40px" mb="20px" color={gray} />
                <Text color={gray} fontSize="lg" fontWeight="medium">
                  Start a new conversation
                  </Text>
                <Text color={gray} fontSize="sm" textAlign="center" maxW="320px" mt="10px">
                  Ask a question or type a message to begin
                </Text>
        </Flex>
            ) : (
              messages.map((message, index) => (
        <Flex
                  key={index}
          w="100%"
                  align="flex-start"
                  mb="20px"
                  flexDirection={message.role === 'user' ? 'row-reverse' : 'row'}
        >
                  {/* Icon and Message Content */}
                  <Flex /* Icon Container */
              borderRadius="full"
              justify="center"
              align="center"
                      bg={message.role === 'user' ? 'transparent' : 'linear-gradient(15.46deg, #4A25E1 26.3%, #7B5AFF 86.4%)'}
                      border={message.role === 'user' ? '1px solid' : 'none'}
              borderColor={borderColor}
              h="40px"
              minH="40px"
              minW="40px"
                      mx="15px"
            >
              <Icon
                        as={message.role === 'user' ? MdPerson : MdAutoAwesome}
                width="20px"
                height="20px"
                        color={message.role === 'user' ? brandColor : 'white'}
              />
            </Flex>
                    {message.role === 'user' ? (
                      <Flex /* User Message Bubble */
                        p="15px 20px"
              border="1px solid"
              borderColor={borderColor}
              borderRadius="14px"
                        maxW={{ base: "75%", md: "65%" }}
                        bg="whiteAlpha.200"
                        ml="auto"
                        mr="0"
            >
              <Text
                color={textColor}
                          fontWeight="500"
                fontSize={{ base: 'sm', md: 'md' }}
                lineHeight={{ base: '24px', md: '26px' }}
                          whiteSpace="pre-wrap"
              >
                          {message.content}
              </Text>
            </Flex>
                    ) : (
                      <Box maxW={{ base: "75%", md: "65%" }}>
                        <MessageBoxChat output={message.content} />
                      </Box>
                    )}
          </Flex>
              ))
            )}
            
            {/* Loading Indicator */} 
            {loading && messages[messages.length - 1]?.role === 'model' && messages[messages.length - 1]?.content === '' && (
              <Flex w="100%" justify="flex-start" pl="60px" mb="20px"> 
                <Text color={gray} fontSize="sm">Generating...</Text>
            </Flex>
            )}
          </Box>
        </Box>
        
        {/* 3. Input Area (Fixed Height) */}
        <Flex
          bg="navy.900"
          alignItems="center"
          justifyContent="center"
          height="100px" 
          width="100%"
          flexShrink={0} 
          paddingTop="10px" 
          paddingBottom="40px" 
          paddingX="20px" 
          marginTop="20px" /* Changed from 40px */
        >
          {/* Inner container for centering input elements */}
          <Flex 
            width="100%" 
            maxW="1000px"
            alignItems="center"
        >
          <Input
              h="50px"
              flexGrow={1} /* Take remaining space */
              mr="10px"
            border="1px solid"
            borderColor={borderColor}
            borderRadius="45px"
            p="15px 20px"
            fontSize="sm"
            fontWeight="500"
            _focus={{ borderColor: 'none' }}
            color={inputColor}
            _placeholder={placeholderColor}
              placeholder="Type your message here... (Shift+Enter for newline)"
            onChange={handleChange}
              onKeyDown={handleKeyDown}
              value={inputCode}
              isDisabled={loading}
            />
            {loading ? (
              <Button
                variant="outline"
                onClick={stopStream}
                width="100px"
                h="50px"
                borderRadius="45px"
                fontSize="sm"
              >
                Stop
              </Button>
            ) : (
          <Button
            variant="primary"
                width="100px"
                h="50px"
                borderRadius="45px"
            fontSize="sm"
                isDisabled={!inputCode.trim()}
            _hover={{
                  boxShadow: '0px 21px 27px -10px rgba(96, 60, 255, 0.48) !important',
              bg: 'linear-gradient(15.46deg, #4A25E1 26.3%, #7B5AFF 86.4%) !important',
              _disabled: {
                bg: 'linear-gradient(15.46deg, #4A25E1 26.3%, #7B5AFF 86.4%)',
              },
            }}
            onClick={handleTranslate}
          >
            Submit
          </Button>
            )}
        </Flex>
        </Flex>
      </Flex>
    </>
  );
}
