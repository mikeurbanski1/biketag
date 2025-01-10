import { ReadOnlyBaseService } from './baseService';

export const validateExists = async <E extends ReadOnlyBaseService<any, any, any>>(id: string, service: E): Promise<void> => {
    await service.getRequired({ id });
};
