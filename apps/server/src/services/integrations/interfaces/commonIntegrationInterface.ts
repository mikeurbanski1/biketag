import { IntegrationServer } from '@biketag/models';

export interface IntegrationInterface {
    getServers(): Promise<IntegrationServer[]>;
}
