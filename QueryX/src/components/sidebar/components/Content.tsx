'use client';
import React, { useState, useEffect } from 'react';
// chakra imports
import {
  Badge,
  Box,
  Button,
  Flex,
  Icon,
  Link,
  Menu,
  MenuButton,
  MenuList,
  Stack,
  Text,
  useColorModeValue,
  VStack,
} from '@chakra-ui/react';
import NavLink from '@/components/link/NavLink';
//   Custom components
import avatar4 from '/public/img/avatars/avatar4.png';
import { NextAvatar } from '@/components/image/Avatar';
import APIModal from '@/components/apiModal';
import Brand from '@/components/sidebar/components/Brand';
import { RoundedChart } from '@/components/icons/Icons';
import { PropsWithChildren } from 'react';
import { IRoute } from '@/types/navigation';
import { IoMdPerson } from 'react-icons/io';
import { FiLogOut, FiTrash2 } from 'react-icons/fi';
import { LuHistory } from 'react-icons/lu';
import { MdOutlineManageAccounts, MdOutlineSettings } from 'react-icons/md';

// Define message/session types locally or import if defined globally
interface Message { role: 'user' | 'model'; content: string; }
interface ChatSession { id: string; title: string; messages: Message[]; timestamp: Date; }

// FUNCTIONS

interface SidebarContent extends PropsWithChildren {
  routes: IRoute[];
  setApiKey: (key: string) => void;
  [x: string]: any;
}

function SidebarContent(props: SidebarContent) {
  const { routes, setApiKey } = props;
  const textColor = useColorModeValue('navy.700', 'white');
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.300');
  const bgColor = useColorModeValue('white', 'navy.700');
  const shadow = useColorModeValue(
    '14px 17px 40px 4px rgba(112, 144, 176, 0.18)',
    '14px 17px 40px 4px rgba(12, 44, 55, 0.18)',
  );
  const iconColor = useColorModeValue('navy.700', 'white');
  const shadowPillBar = useColorModeValue(
    '4px 17px 40px 4px rgba(112, 144, 176, 0.08)',
    'none',
  );
  const gray = useColorModeValue('gray.500', 'white');
  const inactiveColor = useColorModeValue('gray.500', 'gray.400');
  const activeBg = useColorModeValue('gray.100', 'navy.700');
  const buttonHover = useColorModeValue({ bg: 'gray.100' }, { bg: 'whiteAlpha.100' });

  // State for displaying history
  const [history, setHistory] = useState<ChatSession[]>([]);
  const [currentId, setCurrentId] = useState<string>('default');

  // Load history and current ID from localStorage
  useEffect(() => {
    console.log("SidebarContent: useEffect running");
    const savedHistory = localStorage.getItem('chatHistory');
    const savedCurrentId = localStorage.getItem('currentChatId');
    console.log("SidebarContent: Loaded raw history:", savedHistory);
    console.log("SidebarContent: Loaded raw currentId:", savedCurrentId);

    let loadedHistory: ChatSession[] = [];
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        if (Array.isArray(parsed)) {
          parsed.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          loadedHistory = parsed;
          console.log("SidebarContent: Parsed and sorted history:", loadedHistory);
        } else {
            console.warn("SidebarContent: Parsed history is not an array:", parsed);
        }
      } catch (e) {
        console.error("SidebarContent: Failed to parse chat history:", e);
      }
    } else {
        console.log("SidebarContent: No history found in localStorage.");
    }
    setHistory(loadedHistory);

    if (savedCurrentId) {
        setCurrentId(savedCurrentId);
    } else if (loadedHistory.length > 0) {
        const newCurrent = loadedHistory[0].id;
        console.log("SidebarContent: No current ID found, setting to newest:", newCurrent);
        setCurrentId(newCurrent);
        localStorage.setItem('currentChatId', newCurrent);
    } else {
        console.log("SidebarContent: No current ID found, defaulting to 'default'");
        setCurrentId('default'); 
    }

    // Storage change listener (same as before)
    const handleStorageChange = () => { console.log("Storage changed!"); /* Add logic to update state */ };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);

  }, []);

  const selectChat = (id: string) => {
    localStorage.setItem('currentChatId', id);
    setCurrentId(id);
    window.location.reload(); 
  };

   const deleteChat = (idToDelete: string, event: React.MouseEvent) => {
       event.stopPropagation(); 
       const updatedHistory = history.filter(chat => chat.id !== idToDelete);
       setHistory(updatedHistory); 
       localStorage.setItem('chatHistory', JSON.stringify(updatedHistory)); 

       if (currentId === idToDelete) {
           const newCurrent = updatedHistory[0]?.id || 'default'; 
           localStorage.setItem('currentChatId', newCurrent);
           setCurrentId(newCurrent);
           window.location.reload();
       }
   };

  // SIDEBAR
  console.log("SidebarContent: Rendering with history state:", history);
  console.log("SidebarContent: Rendering with currentId state:", currentId);
  return (
    <Flex
      direction="column"
      height="100%"
      pt="20px"
      pb="26px"
      borderRadius="30px"
      maxW="285px"
      px="20px"
    >
      <Brand />
      <VStack 
         direction="column" 
         mb="auto" 
         mt="8px" 
         spacing={1} 
         align="stretch" 
         overflowY="auto" 
         flexGrow={1}
         minHeight="100px"
       >
         {/* --- Start History List --- */}
         {history.length > 0 ? (
           history.map((chat) => (
             <Button
                 key={chat.id}
                 variant="ghost"
                 bg={chat.id === currentId ? activeBg : 'transparent'}
                 _hover={buttonHover}
                 justifyContent="space-between"
                 alignItems="center"
                 width="100%"
                 borderRadius="md"
                 px={3}
                 py={2}
                 h="auto" 
                 minH="40px" 
                 onClick={() => selectChat(chat.id)}
             >
                 <Text
                     fontWeight={chat.id === currentId ? 'bold' : 'normal'}
                     color={chat.id === currentId ? textColor : inactiveColor}
                     fontSize="sm"
                     whiteSpace="nowrap"
                     overflow="hidden"
                     textOverflow="ellipsis"
                     textAlign="left"
                     flexGrow={1}
                     mr={2} 
                 >
                     {chat.title || 'Untitled Chat'}
                 </Text>
                 <Icon
                    as={FiTrash2}
                    color="gray.500"
                    _hover={{ color: "red.500" }}
                    boxSize={4}
                    onClick={(e) => deleteChat(chat.id, e)}
                 />
             </Button>
           ))
         ) : (
           <Text fontSize="sm" color="gray.500" textAlign="center" py={4}>
             No chat history yet.
           </Text>
         )}
         {/* --- End History List --- */}
      </VStack>

      <APIModal setApiKey={setApiKey} sidebar={true} />
      <Flex
        mt="8px"
        justifyContent="center"
        alignItems="center"
        boxShadow={shadowPillBar}
        borderRadius="30px"
        p="14px"
      >
        <NextAvatar h="34px" w="34px" src={avatar4} me="10px" />
        <Text color={textColor} fontSize="xs" fontWeight="600" me="10px">
          Adela Parkson
        </Text>
        <Menu>
          <MenuButton
            as={Button}
            variant="transparent"
            aria-label=""
            border="1px solid"
            borderColor={borderColor}
            borderRadius="full"
            w="34px"
            h="34px"
            px="0px"
            p="0px"
            minW="34px"
            me="10px"
            justifyContent={'center'}
            alignItems="center"
            color={iconColor}
          >
            <Flex align="center" justifyContent="center">
              <Icon
                as={MdOutlineSettings}
                width="18px"
                height="18px"
                color="inherit"
              />
            </Flex>
          </MenuButton>
          <MenuList
            ms="-20px"
            py="25px"
            ps="20px"
            pe="20px"
            w="246px"
            borderRadius="16px"
            transform="translate(-19px, -62px)!important"
            border="0px"
            boxShadow={shadow}
            bg={bgColor}
          >
            <Box mb="30px">
              <Flex align="center" w="100%" cursor={'not-allowed'}>
                <Icon
                  as={MdOutlineManageAccounts}
                  width="24px"
                  height="24px"
                  color={gray}
                  me="12px"
                  opacity={'0.4'}
                />
                <Text
                  color={gray}
                  fontWeight="500"
                  fontSize="sm"
                  opacity={'0.4'}
                >
                  Profile Settings
                </Text>
              </Flex>
            </Box>
            <Box mb="30px">
              <Flex cursor={'not-allowed'} align="center">
                <Icon
                  as={LuHistory}
                  width="24px"
                  height="24px"
                  color={gray}
                  opacity="0.4"
                  me="12px"
                />
                <Text color={gray} fontWeight="500" fontSize="sm" opacity="0.4">
                  History
                </Text>
              </Flex>
            </Box>
            <Box mb="30px">
              <Flex cursor={'not-allowed'} align="center">
                <Icon
                  as={RoundedChart}
                  width="24px"
                  height="24px"
                  color={gray}
                  opacity="0.4"
                  me="12px"
                />
                <Text color={gray} fontWeight="500" fontSize="sm" opacity="0.4">
                  Usage
                </Text>
              </Flex>
            </Box>
            <Box>
              <Flex cursor={'not-allowed'} align="center">
                <Icon
                  as={IoMdPerson}
                  width="24px"
                  height="24px"
                  color={gray}
                  opacity="0.4"
                  me="12px"
                />
                <Text color={gray} fontWeight="500" fontSize="sm" opacity="0.4">
                  My Plan
                </Text>
              </Flex>
            </Box>
          </MenuList>
        </Menu>
        <Button
          variant="transparent"
          border="1px solid"
          borderColor={borderColor}
          borderRadius="full"
          w="34px"
          h="34px"
          px="0px"
          minW="34px"
          justifyContent={'center'}
          alignItems="center"
        >
          <Icon as={FiLogOut} width="16px" height="16px" color="inherit" />
        </Button>
      </Flex>
    </Flex>
  );
}

export default SidebarContent;
