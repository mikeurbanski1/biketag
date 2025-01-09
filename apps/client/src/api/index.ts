import { AbstractApi } from './abstractApi';
import { GameApi } from './gameApi';
import { IntegrationApi } from './integrationApi';
import { TagApi } from './tagApi';
import { UserApi } from './userApi';
import { UserSettingsApi } from './userSettingsApi';

export * from './userApi';

export type Apis = {
    usersApi: UserApi;
    gamesApi: GameApi;
};

export class ApiManager {
    public static userApi: UserApi;
    public static userSettingsApi: UserSettingsApi;
    public static gameApi: GameApi;
    public static tagApi: TagApi;
    public static integrationApi: IntegrationApi;
    private static apisList: AbstractApi[];

    public static setUser({ userId, clientId }: { userId?: string | null; clientId?: string | null }) {
        this.apisList.forEach((api) => api.setUser({ userId, clientId }));
    }

    public static initialize({ clientId }: { clientId: string }) {
        this.userApi = new UserApi({ clientId });
        this.userSettingsApi = new UserSettingsApi({ clientId });
        this.gameApi = new GameApi({ clientId });
        this.tagApi = new TagApi({ clientId });
        this.integrationApi = new IntegrationApi({ clientId });
        this.apisList = [this.userApi, this.gameApi, this.tagApi, this.userSettingsApi];
    }
}
