'use client';
import React, { PropsWithChildren } from 'react';

// chakra imports
import {
  Box,
  Flex,
  Drawer,
  DrawerBody,
  Icon,
  useColorModeValue,
  DrawerOverlay,
  useDisclosure,
  DrawerContent,
  DrawerCloseButton,
} from '@chakra-ui/react';
import Content from '@/components/sidebar/components/Content';
import {
  renderThumb,
  renderTrack,
  renderView,
} from '@/components/scrollbar/Scrollbar';
import { Scrollbars } from 'react-custom-scrollbars-2';

import { IoMenuOutline } from 'react-icons/io5';
import { IRoute } from '@/types/navigation';
import { isWindowAvailable } from '@/utils/navigation';

export interface SidebarProps extends PropsWithChildren {
  routes: IRoute[];
  setApiKey: (key: string) => void;
  [x: string]: any;
}

function Sidebar(props: SidebarProps) {
  const { routes, setApiKey, ...rest } = props;
  // this is for the rest of the collapses
  let variantChange = '0.2s linear';
  let shadow = useColorModeValue(
    '14px 17px 40px 4px rgba(112, 144, 176, 0.08)',
    'unset',
  );
  // Chakra Color Mode
  let sidebarBg = useColorModeValue('white', 'navy.800');
  let sidebarRadius = '14px';
  let sidebarMargins = '0px';
  // SIDEBAR - Return the main content Box directly, remove outer fixed Box
  return (
    <Box
      bg={sidebarBg}
      transition={variantChange}
      /* Width is now controlled by the parent layout.tsx */
      /* w="285px" */
      height="100%" /* Fill height of parent Flex container */
      minH="100%"
      overflowX="hidden"
      boxShadow={shadow}
      /* Remove fixed positioning props */
      /* display={{ base: 'none', xl: 'block' }} */
      /* position="fixed" */
      /* Margins and radius might be adjusted or removed depending on desired look */
      /* ms={{ sm: '16px' }} */
      /* my={{ sm: '16px' }} */
      /* m={sidebarMargins} */
      /* borderRadius={sidebarRadius} */
      {...rest} /* Apply width, display, flexShrink, etc. passed from parent */
    >
      <Scrollbars
        universal={true}
        autoHide
        renderTrackVertical={renderTrack}
        renderThumbVertical={renderThumb}
        renderView={renderView}
        style={{ height: '100%' }} /* Ensure scrollbars fill the height */
      >
        <Content setApiKey={setApiKey} routes={routes} />
      </Scrollbars>
    </Box>
  );
}

// FUNCTIONS
export function SidebarResponsive(props: { routes: IRoute[] }) {
  let sidebarBackgroundColor = useColorModeValue('white', 'navy.800');
  let menuColor = useColorModeValue('gray.400', 'white');
  // // SIDEBAR
  const { isOpen, onOpen, onClose } = useDisclosure();

  const { routes } = props;
  return (
    <Flex display={{ sm: 'flex', xl: 'none' }} alignItems="center">
      <Flex w="max-content" h="max-content" onClick={onOpen}>
        <Icon
          as={IoMenuOutline}
          color={menuColor}
          my="auto"
          w="20px"
          h="20px"
          me="10px"
          _hover={{ cursor: 'pointer' }}
        />
      </Flex>
      <Drawer
        isOpen={isOpen}
        onClose={onClose}
        placement={
          isWindowAvailable() && document.documentElement.dir === 'rtl'
            ? 'right'
            : 'left'
        }
      >
        <DrawerOverlay />
        <DrawerContent
          w="285px"
          maxW="285px"
          ms={{
            sm: '16px',
          }}
          my={{
            sm: '16px',
          }}
          borderRadius="16px"
          bg={sidebarBackgroundColor}
        >
          <DrawerCloseButton
            zIndex="3"
            onClick={onClose}
            _focus={{ boxShadow: 'none' }}
            _hover={{ boxShadow: 'none' }}
          />
          <DrawerBody maxW="285px" px="0rem" pb="0">
            <Scrollbars
              universal={true}
              autoHide
              renderTrackVertical={renderTrack}
              renderThumbVertical={renderThumb}
              renderView={renderView}
            >
              <Content routes={routes} />
            </Scrollbars>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Flex>
  );
}
// PROPS

export default Sidebar;
