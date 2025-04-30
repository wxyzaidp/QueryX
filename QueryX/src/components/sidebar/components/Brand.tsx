'use client';
// Chakra imports
import { Flex, Image, useColorModeValue } from '@chakra-ui/react';

import { HSeparator } from '@/components/separator/Separator';

export function SidebarBrand() {
  return (
    <Flex alignItems="center" flexDirection="column">
      <Image 
        src="/img/queryx-logo.png"
        alt="QueryX Logo" 
        w="200px"
        h="auto"
        mb="40px"
      />
    </Flex>
  );
}

export default SidebarBrand;
