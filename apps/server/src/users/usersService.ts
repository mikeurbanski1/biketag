import { User } from '../dal/models/users';
import { CreateUserParams, UsersDalService } from '../dal/services/usersDalService';

export class UsersService {
    private usersDalService = new UsersDalService();

    public getUsers(): User[] {
        return this.usersDalService.getUsers();
    }

    public getUser({ id }: { id: string }): User {
        return this.usersDalService.getUser({ id });
    }

    public createUser(params: CreateUserParams): User {
        return this.usersDalService.createUser(params);
    }

    public updateUser({ id, params }: { id: string; params: CreateUserParams }): User {
        return this.usersDalService.updateUser({ id, params });
    }

    public deleteUser({ id }: { id: string }): void {
        this.usersDalService.deleteUser({ id });
    }
}
