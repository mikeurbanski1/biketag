import { AbstractApi } from './abstractApi';
import { GameApi } from './gameApi';
import { IntegrationApi } from './integrationApi';
import { TagApi } from './tagApi';
import { UserApi } from './userApi';
import { UserSettingsApi } from './userSettingsApi';

export * from './userApi';

export class ApiManager {
    public static userApi: UserApi;
    public static userSettingsApi: UserSettingsApi;
    public static gameApi: GameApi;
    public static tagApi: TagApi;
    public static integrationApi: IntegrationApi;
    private static apisList: AbstractApi[];

    public static setUser({ userId, clientId }: { userId?: string | null; clientId?: string }) {
        this.apisList.forEach((api) => api.setUser({ userId, clientId }));
    }

    public static initialize({ clientId, userId }: { clientId: string; userId?: string }) {
        this.userApi = new UserApi();
        this.userSettingsApi = new UserSettingsApi();
        this.gameApi = new GameApi();
        this.tagApi = new TagApi();
        this.integrationApi = new IntegrationApi();
        this.apisList = [this.userApi, this.gameApi, this.tagApi, this.userSettingsApi];

        this.setUser({ userId, clientId });
    }
}
