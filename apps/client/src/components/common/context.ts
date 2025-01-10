import { createContext } from 'react';

import { PrivateUserDto } from '@biketag/models';

export const UserContext = createContext<PrivateUserDto | undefined>(undefined);
