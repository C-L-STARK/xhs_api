const axios = require("axios");
const qs = require("querystring");
const { get_xs } = require("./jsvmp/xhs");
const { getXCommon, getSearchId, getRequestId } = require("./help");
const { ErrorEnum, DataFetchError, IPBlockError, SignError, NeedVerifyError } = require("./exception");

class XhsClient {
  constructor({ cookie = null, userAgent = null, timeout = 10000, proxies = null } = {}) {
    this.proxies = proxies;
    this.timeout = timeout;
    this._host = "https://edith.xiaohongshu.com";
    this._creatorHost = "https://creator.xiaohongshu.com";
    this._customerHost = "https://customer.xiaohongshu.com";
    this.home = "https://www.xiaohongshu.com";
    this.userAgent =
      userAgent ||
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36";

    this.axiosInstance = axios.create({
      timeout: this.timeout,
      headers: {
        "user-agent": this.userAgent,
        "Content-Type": "application/json",
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
    return cookieStr ? qs.parse(cookieStr.replace(/; /g, "&")) : {};
  }

  _preHeaders(url, data = null) {
    let a1 = this.cookieDict.a1;
    let b1 = "";
    let x_s_result = get_xs(url, data, this.cookie);
    const X_S = x_s_result["X-s"];
    const X_t = x_s_result["X-t"].toString();
    const X_S_COMMON = getXCommon(a1, b1, X_S, X_t);

    this.axiosInstance.defaults.headers["X-s"] = X_S;
    this.axiosInstance.defaults.headers["X-t"] = X_t;
    this.axiosInstance.defaults.headers["X-s-common"] = X_S_COMMON;
  }

  async request(method, url, config = {}) {
    try {
      const response = await this.axiosInstance({ method, url, ...config });
      if (!response.data) return response;
      // console.log('response', response)
      if (response.status === 471 || response.status === 461) {
        const verifyType = response.headers["verifytype"];
        const verifyUuid = response.headers["verifyuuid"];
        throw new NeedVerifyError(
          `出现验证码，请求失败，Verifytype: ${verifyType}，Verifyuuid: ${verifyUuid}`,
          response,
          verifyType,
          verifyUuid
        );
      }

      const data = response.data;
      if (data.success) {
        return data.data || data.success;
      } else if (data.code === ErrorEnum.IP_BLOCK.code) {
        throw new IPBlockError(ErrorEnum.IP_BLOCK.msg, response);
      } else if (data.code === ErrorEnum.SIGN_FAULT.code) {
        throw new SignError(ErrorEnum.SIGN_FAULT.msg, response);
      } else {
        throw new DataFetchError(data, response);
      }
    } catch (error) {
      if (error.response && (error.response.status === 471 || error.response.status) === 461) {
        // Handle verification error
        const verifyType = error.response.headers["verifytype"];
        const verifyUuid = error.response.headers["verifyuuid"];
        throw new NeedVerifyError(
          `出现验证码，请求失败，Verifytype: ${verifyType}，Verifyuuid: ${verifyUuid}`,
          error.response,
          verifyType,
          verifyUuid
        );
      }
      throw error;
    }
  }

  async get(uri, params = null, isCreator = false, isCustomer = false, config = {}) {
    let finalUri = uri;
    if (params) {
      finalUri = `${uri}?${qs.stringify(params)}`;
    }
    this._preHeaders(finalUri, null);
    let endpoint = this._host;
    if (isCustomer) {
      endpoint = this._customerHost;
    } else if (isCreator) {
      endpoint = this._creatorHost;
    }
    return this.request("GET", `${endpoint}${finalUri}`, config);
  }

  async post(uri, data = null, isCreator = false, isCustomer = false, config = {}) {
    // let jsonStr = data ? JSON.stringify(data).replace(/[\u007F-\uFFFF]/g, function(chr) {
    // 	return "\\u" + ("0000" + chr.charCodeAt(0).toString(16)).substr(-4);
    //   }) : null;
    this._preHeaders(uri, data);
    let endpoint = this._host;
    if (isCustomer) {
      endpoint = this._customerHost;
    } else if (isCreator) {
      endpoint = this._creatorHost;
    }
    if (data) {
      return this.request("POST", `${endpoint}${uri}`, {
        ...config,
        data: data,
        headers: {
          ...config.headers,
          "Content-Type": "application/json",
        },
      });
    }
    return this.request("POST", `${endpoint}${uri}`, { ...config, data });
  }

  async getNoteById(noteId, image_scenes = ["CRD_WM_WEBP"]) {
    const data = {
      source_note_id: noteId,
      image_scenes: image_scenes,
    };
    const uri = "/api/sns/web/v1/feed";

    try {
      const res = await this.post(uri, data);
      return res.items[0].note_card;
    } catch (error) {
      console.error("Error fetching note:", error);
      throw error;
    }
  }

  async getSelfInfo() {
    const uri = "/api/sns/web/v2/user/me";
    return this.get(uri);
  }

  async searchUser(keyword, page = 1, page_size = 20) {
    const body = {
      search_user_request: {
        biz_type: "web_search_user",
        keyword: keyword,
        page: page,
        page_size: page_size,
        request_id: getRequestId(),
        search_id: getSearchId(),
      },
    };
    const uri = "/api/sns/web/v1/search/usersearch";
    return this.post(uri, body);
  }

  async searchNotes(
    keyword,
    page = 1,
    page_size = 20,
    sort = "general",
    note_type = 0, // 0 = All, 1 = Video, 2 = Image
    ext_flags = [],
    image_formats = ["jpg", "webp", "avif"]
  ) {
    const body = {
      keyword: keyword,
      page: page,
      page_size: page_size,
      search_id: getSearchId(),
      sort: sort,
      note_type: note_type,
      ext_flags: ext_flags,
      image_formats: image_formats,
    };
    const uri = "/api/sns/web/v1/search/notes";
    return this.post(uri, body);
  }

  async getUserInfo(userId) {
    const uri = "/api/sns/web/v1/user/otherinfo";
    const params = {
      target_user_id: userId,
    };
    return this.get(uri, params);
  }

  async getNoteListByUserId(num = 30, cursor = "", user_id, image_scenes = "FD_WM_WEBP") {
    const uri = "/api/sns/web/v1/user_posted";
    const data = {
      //
      num: num,
      cursor: cursor,
      user_id: user_id,
      image_scenes: image_scenes,
    };

    return this.get(uri, data);
  }
}

module.exports = XhsClient;
