import { rest } from './rest';

const UTILS_BASE = 'Utils/';

export const UtilsAPI = {
  async getServerTime(): Promise<number> {
    const res = await rest(UTILS_BASE + 'ServerTime');
    const textResponse = await res.text();
    return Number.parseInt(textResponse);
  },
};
