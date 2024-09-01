const axios = require('axios');
const qs = require('querystring');

class XhsClient {
	constructor({
		cookie = null,
		userAgent = null,
		timeout = 10000,
		proxies = null,
		sign = null
	} = {}) {
		this.proxies = proxies;
		this.timeout = timeout;
		this.externalSign = sign;
		this._host = "https://edith.xiaohongshu.com";
		this._creatorHost = "https://creator.xiaohongshu.com";
		this._customerHost = "https://customer.xiaohongshu.com";
		this.home = "https://www.xiaohongshu.com";
		this.userAgent = userAgent || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36";

		this.axiosInstance = axios.create({
			timeout: this.timeout,
			headers: {
				'user-agent': this.userAgent,
				'Content-Type': 'application/json',
			},
		});

		if (cookie) {
			this.cookie = cookie;
		}
	}

	// Getter for cookie
	get cookie() {
		return this.axiosInstance.defaults.headers.Cookie;
	}

	// Setter for cookie
	set cookie(cookie) {
		this.axiosInstance.defaults.headers.Cookie = cookie;
	}

	// Getter for cookieDict
	get cookieDict() {
		const cookieStr = this.axiosInstance.defaults.headers.Cookie;
		return cookieStr ? qs.parse(cookieStr.replace(/; /g, '&')) : {};
	}

	_preHeaders(url, data = null, quickSign = false) {
		if (quickSign) {
			// Implement sign function
			const signs = sign(url, data, this.cookieDict.a1);
			this.axiosInstance.defaults.headers['x-s'] = signs['x-s'];
			this.axiosInstance.defaults.headers['x-t'] = signs['x-t'];
			this.axiosInstance.defaults.headers['x-s-common'] = signs['x-s-common'];
		} else {
			const headersUpdated = this.externalSign(
				url,
				data,
				this.cookieDict.a1,
				this.cookieDict.web_session || ''
			);
			Object.assign(this.axiosInstance.defaults.headers, headersUpdated);
		}
	}

	async request(method, url, config = {}) {
		try {
			const response = await this.axiosInstance({ method, url, ...config });
			
			if (!response.data) return response;

			if (response.status === 471 || response.status === 461) {
				const verifyType = response.headers['verifytype'];
				const verifyUuid = response.headers['verifyuuid'];
				throw new NeedVerifyError(`出现验证码，请求失败，Verifytype: ${verifyType}，Verifyuuid: ${verifyUuid}`, response, verifyType, verifyUuid);
			}

			const data = response.data;
			if (data.success) {
				return data.data || data.success;
			} else if (data.code === ErrorEnum.IP_BLOCK.value.code) {
				throw new IPBlockError(ErrorEnum.IP_BLOCK.value.msg, response);
			} else if (data.code === ErrorEnum.SIGN_FAULT.value.code) {
				throw new SignError(ErrorEnum.SIGN_FAULT.value.msg, response);
			} else {
				throw new DataFetchError(data, response);
			}
		} catch (error) {
			if (error.response && error.response.status === 471 || error.response.status === 461) {
				// Handle verification error
				const verifyType = error.response.headers['verifytype'];
				const verifyUuid = error.response.headers['verifyuuid'];
				throw new NeedVerifyError(`出现验证码，请求失败，Verifytype: ${verifyType}，Verifyuuid: ${verifyUuid}`, error.response, verifyType, verifyUuid);
			}
			throw error;
		}
	}

	async get(uri, params = null, isCreator = false, isCustomer = false, config = {}) {
		let finalUri = uri;
		if (params) {
			finalUri = `${uri}?${qs.stringify(params)}`;
		}
		this._preHeaders(finalUri, null, isCreator || isCustomer);
		let endpoint = this._host;
		if (isCustomer) {
			endpoint = this._customerHost;
		} else if (isCreator) {
			endpoint = this._creatorHost;
		}
		return this.request('GET', `${endpoint}${finalUri}`, config);
	}

	async post(uri, data = null, isCreator = false, isCustomer = false, config = {}) {
		this._preHeaders(uri, data, isCreator || isCustomer);
		let endpoint = this._host;
		if (isCustomer) {
			endpoint = this._customerHost;
		} else if (isCreator) {
			endpoint = this._creatorHost;
		}
		return this.request('POST', `${endpoint}${uri}`, { ...config, data });
	}
}

// Error classes (you'll need to implement these)
class NeedVerifyError extends Error {
	// ...
}

class IPBlockError extends Error {
	// ...
}

class SignError extends Error {
	// ...
}

class DataFetchError extends Error {
	// ...
}

// Enum (you'll need to implement this)
const ErrorEnum = {
	// ...
};

module.exports = XhsClient;