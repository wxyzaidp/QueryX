import { Icon } from './lib/chakra';
import {
  MdAutoAwesome,
} from 'react-icons/md';

// Auth Imports
import { IRoute } from './types/navigation';

const routes: IRoute[] = [
  {
    name: 'Chat UI',
    path: '/',
    icon: (
      <Icon as={MdAutoAwesome} width="20px" height="20px" color="inherit" />
    ),
    collapse: false,
  },
  // All other routes have been removed
];

export default routes;
