import React from 'react';
import { Box, useColorModeValue, Text, Flex, Button, useClipboard } from '@chakra-ui/react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
// Import the desired style
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'; 
import ReactMarkdown from 'react-markdown'; // Import ReactMarkdown
import remarkGfm from 'remark-gfm'; // <--- Add this import

// New Dedicated CodeBlock Component
interface CodeBlockProps {
  language: string;
  code: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ language, code }) => {
  const { hasCopied, onCopy } = useClipboard(code);
  // Adjusted colors to match target image
  const headerColor = useColorModeValue('gray.600', 'gray.400'); // Lighter text for header
  const codeContainerBg = useColorModeValue('gray.100', 'gray.900'); // Darker container bg
  const headerBg = useColorModeValue('gray.200', 'gray.800'); // Slightly lighter header bg

  return (
    <Box my={2} bg={codeContainerBg} borderRadius="md" position="relative" overflow="hidden">
      {/* Header for language and copy button */}
      <Flex 
        px={4} 
        py={2} 
        justifyContent="space-between" 
        alignItems="center" 
        color={headerColor}
        bg={headerBg} /* Added header background */
      >
        <Text fontSize="sm" fontWeight="medium">{language || 'plaintext'}</Text>
        <Button 
          size="sm" 
          onClick={onCopy} 
          variant="ghost" 
          color={headerColor} /* Match header text color */
          colorScheme={hasCopied ? "green" : "gray"}
          _hover={{ bg: useColorModeValue('gray.300', 'whiteAlpha.200') }} /* Subtle hover */
        >
          {hasCopied ? 'Copied!' : 'Copy'}
        </Button>
      </Flex>
      {/* Code Highlighter - No change to SyntaxHighlighter itself */}
      <Box> {/* Removed radius/overflow here, handled by parent */}
        <SyntaxHighlighter
          language={language}
          style={vscDarkPlus}
          customStyle={{ padding: '15px', margin: '0', borderRadius: '0', background: 'transparent' }} /* Make highlighter bg transparent */
          wrapLongLines={true}
          showLineNumbers={false}
        >
          {code}
        </SyntaxHighlighter>
      </Box>
    </Box>
  );
};

interface MessageBoxChatProps {
  output: string;
}

const MessageBoxChat: React.FC<MessageBoxChatProps> = ({ output }) => {
  const textColor = useColorModeValue('navy.700', 'white');

  // Split the output into paragraphs and code blocks
  const parts = output.split(/(`{3}[\w\s]*\n[\s\S]*?\n`{3})/g);

  return (
    <Box width="100%">
      {parts.map((part, index) => {
        // Check if it's a code block
        const codeBlockMatch = part.match(/^`{3}([\w\s]*)\n([\s\S]*?)\n`{3}$/);
        
        if (codeBlockMatch) {
          const language = codeBlockMatch[1]?.trim().toLowerCase() || 'plaintext';
          const code = codeBlockMatch[2]?.trim() || '';
          // Render the CodeBlock component
          return <CodeBlock key={index} language={language} code={code} />;
        } else if (part.trim()) {
          // Render regular text paragraphs using ReactMarkdown
          return (
            <Box 
              key={index} 
              color={textColor} 
              fontSize={{ base: 'sm', md: 'md' }}
              lineHeight={{ base: '24px', md: '26px' }} 
              fontWeight="500" 
              whiteSpace="pre-wrap"
              my={2} 
              className="markdown-body" // Optional class for potential global styling
            >
              <ReactMarkdown
                // Ensure ReactMarkdown doesn't try to style code itself
                // Let CodeBlock component handle it
                components={{ 
                  code({node, inline, className, children, ...props}) {
                    // Render inline code differently if needed, or just plain text
                    // For now, let's render it simply to avoid conflicts
                    return <Text as="code" display="inline" fontFamily="monospace" fontSize="sm" px="1" bg={useColorModeValue('gray.100', 'navy.600')} borderRadius="sm">{String(children)}</Text>;
                  },
                  // Prevent rendering of block code elements by ReactMarkdown
                  pre({node, ...props}) {
                    return null; // Let our CodeBlock handle ``` blocks
                  }
                }}
                remarkPlugins={[remarkGfm]} // <--- Add this prop
              >
                {part}
              </ReactMarkdown>
            </Box>
          );
        }
        return null;
      })}
    </Box>
  );
};

export default MessageBoxChat; 