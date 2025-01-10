import { Body, Controller, Get, Path, Post, Res, Route, SuccessResponse, TsoaResponse } from 'tsoa';

import { CreateUserParams, PrivateUserDto, PublicUserDto } from '@biketag/models';
import { Logger } from '@biketag/utils';

import { PrivateUserService } from './privateUserService';
import { PublicUserService } from './publicUserService';

const logger = new Logger({ prefix: '[UserController]' });

@Route('users')
export class UserController extends Controller {
    private privateUserService = new PrivateUserService();
    private publicUserService = new PublicUserService();

    @Get('/')
    @SuccessResponse('200', 'ok')
    public async getUsers(): Promise<PublicUserDto[]> {
        logger.info('[getUsers]');
        return await this.publicUserService.getAll();
    }

    @Post('/login')
    @SuccessResponse('200', 'ok')
    public async login(@Body() requestBody: CreateUserParams, @Res() invalidResponse: TsoaResponse<400, { reason: string }>): Promise<PrivateUserDto> {
        logger.info('[login]', { user: requestBody });

        const user = await this.privateUserService.getUserByName(requestBody);
        logger.info(`[login] getUser result`, { user });
        if (!user) {
            return invalidResponse(400, { reason: 'Incorrect name' });
        }
        return user;
    }

    @Get('/{id}')
    @SuccessResponse('200', 'ok')
    public async getUser(@Path() id: string, @Res() notFoundResponse: TsoaResponse<404, { reason: string }>): Promise<PublicUserDto> {
        logger.info(`[getUser] id: ${id}`);
        const user = await this.publicUserService.get({ id });
        if (!user) {
            return notFoundResponse(404, { reason: 'User does not exist' });
        }
        logger.info(`[getUser] result ${user}`);
        return user;
    }

    @Post()
    @SuccessResponse('201', 'Created')
    public async createUser(@Body() requestBody: CreateUserParams): Promise<PrivateUserDto> {
        logger.info(`[createUser]`, { requestBody });
        const user = await this.privateUserService.create(requestBody);
        return user;
    }
}
