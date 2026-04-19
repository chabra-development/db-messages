import axios, { AxiosError } from "axios";

const RETRY_DELAY_MS = 120_000; // BLiP penaliza com 429 por 2 minutos
const MAX_RETRIES = 3;

type RetryableConfig = NonNullable<AxiosError["config"]> & {
  _retryCount?: number;
};

export const api = axios.create();

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetryableConfig | undefined;

    if (!config) return Promise.reject(error);

    config._retryCount = config._retryCount ?? 0;

    if (error.response?.status === 429 && config._retryCount < MAX_RETRIES) {
      config._retryCount++;
      console.warn(
        `[BLiP] 429 recebido — aguardando ${RETRY_DELAY_MS / 1000}s antes de retry (${config._retryCount}/${MAX_RETRIES})...`,
      );
      await new Promise<void>((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      return api(config);
    }

    return Promise.reject(error);
  },
);
