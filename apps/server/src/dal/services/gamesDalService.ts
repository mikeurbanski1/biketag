import { UserExistsError, UserNotFoundError } from '../../common/errors';
import { User } from '../models/users';

export interface CreateUserParams {
    name: string;
}

let nextId = 1;
const userIdMap = new Map<string, User>();
const usernameMap = new Map<string, User>();

export class UsersDalService {
    public getUsers(): User[] {
        return Array.from(userIdMap.values());
    }

    public createUser({ name }: CreateUserParams): User {
        this.validateCreateUserParams({ name });

        const user: User = {
            id: (nextId++).toString(),
            name
        };

        userIdMap.set(user.id, user);
        userIdMap.set(name, user);

        return user;
    }

    public getUser({ id }: { id: string }): User {
        this.validateUserIdExists({ id });
        return userIdMap.get(id)!;
    }

    public updateUser({ id, params }: { id: string; params: CreateUserParams }): User {
        const { name } = params;
        this.validateCreateUserParams({ name });
        this.validateUserIdExists({ id });

        const user = userIdMap.get(id)!;
        const { name: oldName } = user;

        usernameMap.delete(oldName);
        user.name = name;
        usernameMap.set(name, user);
        return user;
    }

    public deleteUser({ id }: { id: string }): void {
        this.validateUserIdExists({ id });

        const user = userIdMap.get(id)!;

        usernameMap.delete(user.name);
        userIdMap.delete(id);
    }

    private validateCreateUserParams({ name }: CreateUserParams): void {
        if (usernameMap.has(name)) {
            throw new UserExistsError(`User ${name} already exists`);
        }
    }

    private validateUserIdExists({ id }: { id: string }): void {
        if (!userIdMap.has(id)) {
            throw new UserNotFoundError(`User with ID ${id} does not exist`);
        }
    }
}
