const env = {
  ...process?.env,
  ...window?.__RUNTIME_CONFIG__,
}
const defaultBaseURL = getAPIBaseURL("v1")
const authToken = getAPIAuthToken()

export function getAPIBaseURL(version) {
  let url = process.env.REACT_APP_API_BASE_URL
  if(url) {
    if(!url.endsWith("/")) {
      url = url + "/"
    }
    return url + "api/" + (version ? version + "/" : "")
  }
  let host = window.location.host
  if(host.indexOf(":") > 0) {
    host = host.substring(0, host.indexOf(":"))
  }
  if(host.indexOf("inquery.io") !== -1) {
    return `${window.location.protocol}//${host.slice(0, host.indexOf('.'))}-api${host.slice(host.indexOf('.'))}/api/v1/`;
  }
  return `${window.location.protocol}//${host}:3003/api/${version ? version + "/" : ""}`
}

function getAPIAuthToken() {
  let token = env.REACT_APP_API_AUTH_TOKEN
  if(!token) {
    token = "inquery"
  }
  return token
}

export function healthCheck(success, failure) {
  const requestOptions = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  };
  apiRequest(getAPIBaseURL(), "health", requestOptions, success, failure)
}

export function httpGet(path, success, failure) {
  const requestOptions = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": authToken
    },
  };
  apiRequest(defaultBaseURL, path, requestOptions, success, failure)
}

export function httpPost(path, body, success, failure) {
  apiRequest(defaultBaseURL, path, getRequestOptions("POST", body), success, failure)
}

export function httpDelete(path, body, success, failure) {
  apiRequest(defaultBaseURL, path, getRequestOptions("DELETE", body), success, failure)
}

function getRequestOptions(method, body) {
  return {
    method: method,
    headers: {
      "Content-Type": "application/json",
      "Authorization": authToken
    },
    body: body ? JSON.stringify(body) : ""
  }
}

function apiRequest(baseURL, path, requestOptions, success, failure) {
  fetchWithTimeout(`${baseURL}${path}`, requestOptions)
    .then(response => {
      if(!response.ok) {
        return Promise.reject(response);
      }
      return response.json();
    })
    .then(data => {
      if(success !== undefined) {
        success(data)
      }
    })
    .catch(error => {
      if(typeof error.json === "function") {
        error.json().then(serverError => {
          if(failure !== undefined) {
            failure(serverError)
          }
        }).catch(_ => {
          if(failure !== undefined) {
            failure(error)
          }
        });
      } else {
        console.log(error);
        failure(error)
      }
    });
}

async function fetchWithTimeout(resource, options = {}) {
  const {timeout = 8000} = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  const response = await fetch(resource, {
    ...options,
    signal: controller.signal
  });
  clearTimeout(id);
  return response;
}
