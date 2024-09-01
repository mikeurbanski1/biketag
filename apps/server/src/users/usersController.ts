// src/users/usersController.ts
import { Body, Controller, Get, Path, Post, Res, Route, SuccessResponse, TsoaResponse } from 'tsoa';
import { Logger } from '@biketag/utils';
import { UsersService } from './usersService';
import { User } from '../dal/models/users';
import { CreateUserParams } from '../dal/services/usersDalService';
import { UserNotFoundError } from '../common/errors';

const logger = new Logger({});

@Route('users')
export class UsersController extends Controller {
    private usersService = new UsersService();

    @Get('/')
    @SuccessResponse('200', 'ok')
    public async getUsers(): Promise<User[]> {
        logger.debug('[getUsers]');
        logger.info('[getUsers]');
        logger.warn('[getUsers]');
        logger.error('[getUsers]');
        return this.usersService.getUsers();
    }

    @Get('/{id}')
    @SuccessResponse('200', 'ok')
    public async getUser(@Path() id: string, @Res() notFoundResponse: TsoaResponse<404, { reason: string }>): Promise<User> {
        console.log(`[getUser] id: ${id}`);
        try {
            const user = this.usersService.getUser({ id });
            console.log(`[getUser] result ${user}`);
            return user;
        } catch (error) {
            console.error(`[getUser] error ${error}`);
            if (error instanceof UserNotFoundError) {
                return notFoundResponse(404, { reason: error.message });
            }
            throw error;
        }
    }

    @Post()
    @SuccessResponse('201', 'Created') // Custom success response
    public async createUser(@Body() requestBody: CreateUserParams): Promise<User> {
        console.log(`[createUser] ${requestBody}`);
        this.setStatus(201); // set return status 201
        return this.usersService.createUser(requestBody);
    }
}
