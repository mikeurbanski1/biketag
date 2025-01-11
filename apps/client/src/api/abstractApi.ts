import axios, { AxiosRequestConfig } from 'axios';

import { CLIENT_ID_HEADER, Logger, USER_ID_HEADER } from '@biketag/utils';

import { getUrl } from './config';

export class AbstractApi {
    protected readonly logger;
    protected readonly axiosInstance;
    private userId: string | null;
    constructor({ logPrefix }: { logPrefix: string }) {
        this.axiosInstance = axios.create({
            baseURL: getUrl(),
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
        });
        this.logger = new Logger({ prefix: logPrefix });
        this.userId = null;
    }

    /**
     * Update or clear the user attribute headers. Pass null to delete the header (userId only). Pass undefined to leave it unchanged.
     */
    public setUser({ userId, clientId }: { userId?: string | null; clientId?: string }) {
        if (userId) {
            this.axiosInstance.defaults.headers[USER_ID_HEADER] = userId;
            this.userId = userId;
            this.logger.info(`[setUser] done`);
        } else if (userId === null) {
            this.userId = null;
            delete this.axiosInstance.defaults.headers[USER_ID_HEADER];
        }

        if (clientId) {
            this.axiosInstance.defaults.headers[CLIENT_ID_HEADER] = clientId;
        } else if (clientId === null) {
            delete this.axiosInstance.defaults.headers[CLIENT_ID_HEADER];
        }
    }

    public getUserIdRequired(): string {
        if (!this.userId) {
            throw new Error('User ID not set');
        }
        return this.userId;
    }

    public async getWithPaging<E>({ config, pageSize = 10 }: { config: AxiosRequestConfig; pageSize?: number }): Promise<E[]> {
        let page = 1;
        config.params = { ...config.params, pageSize, page };

        let response = await this.axiosInstance.request<{ items: E[]; total: number }>(config);
        this.logger.info(`[getWithPaging] first page response`, { response });
        page++;
        const items: E[] = response.data.items;
        while (items.length < response.data.total) {
            config.params = { ...config.params, page };
            response = await this.axiosInstance.request<{ items: E[]; total: number }>(config);
            this.logger.info(`[getWithPaging] page ${page} response`, { response });
            items.push(...response.data.items);
            page++;
        }

        return items;
    }
}
