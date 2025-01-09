import { createContext } from 'react';

import { UserDto } from '@biketag/models';

export const UserContext = createContext<UserDto | undefined>(undefined);
