import axios, { AxiosInstance } from "axios";

let sessionCookie: string | null = null;
let host: string | null = null;
let urlPrefix = "/v2";

export function initializeHttpClient(
	newHost: string | null,
	newSessionCookie: string | null
) {
	sessionCookie = newSessionCookie;
	host = newHost;
}

export const httpClient = axios.create({}) as {
	oldGet: (url: string, config?: any) => Promise<any>;
	mustGet: (url: string, config?: any) => Promise<any>;
} & AxiosInstance;

// Add a request interceptor to include sessionCookie and host
httpClient.interceptors.request.use((config) => {
	if (sessionCookie) {
		config.headers.Cookie = sessionCookie;
	}
	if (host) {
		config.baseURL = `https://${host}${urlPrefix}`;
	}
	return config;
});

// wrapper around get function, but ensures response exists
httpClient.mustGet = async function (url: string, config?: any) {
	let response = await this.get(url, config);
	if (!response.data) {
		throw new Error("No response data");
	}
	return response;
};

// get wrapper to allow 404
httpClient.oldGet = httpClient.get;
httpClient.get = async function (url: string, config?: any) {
	try {
		return await this.oldGet(url, config);
	} catch (e: any) {
		if (e.response && e.response.status === 404) {
			// return e.response;
			return null;
		}
		throw e;
	}
};
