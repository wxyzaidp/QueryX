'use client';
import React, { ReactNode } from 'react';
import type { AppProps } from 'next/app';
import { ChakraProvider, Box, Portal, useDisclosure, ColorModeScript, Flex } from '@chakra-ui/react';
import theme from '@/theme/theme';
import routes from '@/routes';
import Sidebar from '@/components/sidebar/Sidebar';
import Navbar from '@/components/navbar/NavbarAdmin';
import { getActiveRoute, getActiveNavbar } from '@/utils/navigation';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import '@/styles/App.css';
import '@/styles/Contact.css';
import '@/styles/Plugins.css';
import '@/styles/MiniCalendar.css';
import AppWrappers from './AppWrappers';

export default function RootLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [apiKey, setApiKey] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();
  useEffect(() => {
    const initialKey = localStorage.getItem('apiKey');
    console.log(initialKey);
    if (initialKey?.includes('AIza') && apiKey !== initialKey) {
      setApiKey(initialKey);
    }
  }, [apiKey]);

  return (
    <html lang="en" data-theme="dark">
      <head>
        <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      </head>
      <body id={'root'}>
        <AppWrappers>
          {/* <ChakraProvider theme={theme}> */}
          {pathname?.includes('register') || pathname?.includes('sign-in') ? (
            children
          ) : (
            <Flex height="100vh" width="100vw" overflow="hidden">
              <Sidebar 
                setApiKey={setApiKey} 
                routes={routes} 
                display={{ base: 'none', md: 'block' }}
                width="290px"
                flexShrink={0}
              />
              <Box
                flexGrow={1}
                minHeight="100vh"
                height="100%"
                overflowY="auto"
                position="relative"
                bg="navy.900"
                >
                  {children}
              </Box>
            </Flex>
          )}
          {/* </ChakraProvider> */}
        </AppWrappers>
      </body>
    </html>
  );
}
