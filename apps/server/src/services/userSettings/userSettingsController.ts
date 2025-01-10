import { Body, Controller, Get, Header, Path, Post, Put, Res, Route, SuccessResponse, TsoaResponse } from 'tsoa';

import { CreateUserParams, CreateUserSettingsParams, UserSettingsDto } from '@biketag/models';
import { Logger, USER_ID_HEADER } from '@biketag/utils';

import { UserSettingsService } from './userSettingsService';

const logger = new Logger({ prefix: '[UserController]' });

@Route('settings')
export class UserSettingsController extends Controller {
    private userSettingsService = new UserSettingsService();

    @Get('/user')
    @SuccessResponse('200', 'ok')
    public async getUserSettings(@Header(USER_ID_HEADER) userId: string): Promise<UserSettingsDto> {
        return await this.userSettingsService.getRequired({ id: userId });
    }

    @Put('/user')
    @SuccessResponse('200', 'ok')
    public async updateUserSettings(@Body() requestBody: CreateUserSettingsParams, @Header(USER_ID_HEADER) userId: string): Promise<UserSettingsDto> {
        logger.info(`[createUser]`, { requestBody });
        const settings = await this.userSettingsService.update({ id: userId, updateParams: requestBody });
        return settings;
    }
}
