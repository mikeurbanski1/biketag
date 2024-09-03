// src/users/usersController.ts
import { Body, Controller, Get, Path, Post, Res, Route, SuccessResponse, TsoaResponse } from 'tsoa';
import { Logger } from '@biketag/utils';
import { UsersService } from './usersService';
import { User } from '../dal/models/users';
import { CreateUserParams } from '../dal/services/usersDalService';
import { UserNotFoundError } from '../common/errors';

const logger = new Logger({ prefix: '[UsersController]' });

type LoginParams = CreateUserParams & { id: string };

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

    @Post('/login')
    @SuccessResponse('200', 'ok')
    public async login(@Body() requestBody: LoginParams, @Res() notFoundResponse: TsoaResponse<404, { reason: string }>, @Res() invalidResponse: TsoaResponse<400, { reason: string }>): Promise<void> {
        const { id, name } = requestBody;
        logger.info(`[login] id: ${id}, name: ${name}`);
        try {
            const user = this.usersService.getUser({ id });
            logger.info(`[login] getUser result ${user}`);
            if (user.name === name) {
                return;
            } else {
                return invalidResponse(400, { reason: 'Incorrect name or ID' });
            }
        } catch (error) {
            console.error(`[login] error ${error}`);
            if (error instanceof UserNotFoundError) {
                return notFoundResponse(404, { reason: error.message });
            }
            throw error;
        }
    }

    @Get('/{id}')
    @SuccessResponse('200', 'ok')
    public async getUser(@Path() id: string, @Res() notFoundResponse: TsoaResponse<404, { reason: string }>): Promise<User> {
        logger.info(`[getUser] id: ${id}`);
        try {
            const user = this.usersService.getUser({ id });
            logger.info(`[getUser] result ${user}`);
            return user;
        } catch (error) {
            logger.error(`[getUser] error ${error}`, { error });
            if (error instanceof UserNotFoundError) {
                return notFoundResponse(404, { reason: error.message });
            }
            throw error;
        }
    }

    @Post()
    @SuccessResponse('201', 'Created') // Custom success response
    public async createUser(@Body() requestBody: CreateUserParams): Promise<User> {
        logger.info(`[createUser] ${requestBody}`);
        this.setStatus(201); // set return status 201
        return this.usersService.createUser(requestBody);
    }
}
