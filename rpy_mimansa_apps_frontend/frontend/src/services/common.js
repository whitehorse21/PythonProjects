import { getFetch } from "./fetch";
import { restApiSettings } from "./api";
import * as axios from 'axios';

export const getLocalToken = () => {
  return localStorage.getItem("userInfo") != null
    ? JSON.parse(localStorage.getItem("userInfo"))
    : null;
};

export const setLocalToken = (userInfo) => {
  return localStorage.setItem("userInfo", userInfo);
};

export const removeLocalToken = () => {
  localStorage.removeItem("userInfo");
  localStorage.removeItem("userId");
}

export const getUserId = () => {
  return localStorage.getItem("userId") != null
    ? JSON.parse(localStorage.getItem("userId"))
    : null;
}

export const setUserId = (userId) => {
  return localStorage.setItem("userId", userId);
};

const getUrl = function (path, params = {}) {
  const url = new URL(`${restApiSettings.baseURL}${path}`);
  for (let [key, value] of Object.entries(params)) {
    if (value)
      url.searchParams.append(String(key), String(value));
  }
  return url.toString();
};

export const query = async function (path, options = {}, useToken = true) {
  if (!options.headers) {
    options.headers = {
      "Content-Type": "application/json",
      "Accept": "application/json"
    };
  }
  options.headers = options.headers || {};
  const userInfo = useToken ? getLocalToken() : null;
  const token = (userInfo && userInfo.token);
  if (token) {
    options.headers["Authorization"] = `Bearer ${token}`;
  }
  const url = getUrl(path, options.searchParams || {});

  console.log("requesturl-----", url);

  const fetch = await getFetch(options);;
  const response = await fetch(url, options);

  if (200 <= response.status && 300 > response.status) {
    if (options && (options.responseType === 'blob')) {
      return response;
    }
    return response.json();
  }
  try {
    const error = await response.json();
    return Promise.reject(new Error(error.message));
  } catch (error) {
    console.log("error-----", error)
    throw new Error(`HTTP status ${response.status} is not OK`);
  }

};

export const jsonQuery = async function (path, method, data, useToken = true) {
  return await query(
    path,
    {
      method,
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(data)
    },
    useToken
  );
};


export const fileQuery = function (path, data) {
  var headers = [];
  const userInfo = getLocalToken();
  const token = (userInfo && userInfo.token);
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const url = getUrl(path);
  return axios.post(url, data, {
    headers: {
      ...headers
    }
  })
    // get data
    .then(response => {
      return response.data;
    })
    // add url field
    .then(res => {
      return res
    });
};

export const generateParameters = (paramArray = []) => {
  if (paramArray.length > 0) return '';
  var res = '?';
  for (var i = 0; i < paramArray.length; i++) {
    var item = paramArray[i];
    res = res + `&${item.name}=${item.value}`
  }
  return res;
}

export const generatePagenationParameters = (params) => {
  var res = {};
  Object.keys(params).map(key => {
    const value = params[key];
    if (value) res[key] = value;
  });
  return res;
}

export const downloadquery = async function (path, type = "", options = {}, useToken = true) {
  if (!options.headers) {
    options.headers = {
      "Content-Type": "application/json",
      "Accept": "application/json"
    };
  }
  options.headers = options.headers || {};
  const userInfo = useToken ? getLocalToken() : null;
  const token = (userInfo && userInfo.token);
  if (token) {
    options.headers["Authorization"] = `Bearer ${token}`;
  }
  const url = getUrl(path, options.searchParams || {});
  const fetch = await getFetch(options);
  const response = await fetch(url, options);

  Object.defineProperty(Date.prototype, 'YYYYMMDDHHMMSS', {
    value: function () {
      function pad2(n) {  // always returns a string
        return (n < 10 ? '0' : '') + n;
      }

      return this.getFullYear() + "-" +
        pad2(this.getMonth() + 1) + "-" +
        pad2(this.getDate()) + "-" +
        pad2(this.getHours()) + "-" +
        pad2(this.getMinutes()) + "-" +
        pad2(this.getSeconds());
    }
  });

  response.blob()
    .then(blob => download(blob, type + "-" + new Date().YYYYMMDDHHMMSS() + ".csv"))
    .catch(function (error) {

      console.log("=====error", error);

    });

};

function download(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  // the filename you want
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);

}