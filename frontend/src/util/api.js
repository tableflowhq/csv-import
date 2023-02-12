const baseURL = "http://localhost:3003/api/v1/"
const accessToken = "e0624335df269dc1537fde96248a931d"

export function httpGet(path, success, failure) {
  const requestOptions = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": accessToken
    },
  };
  apiRequest(path, requestOptions, success, failure)
}

export function httpPost(path, body, success, failure) {
  apiRequest(path, getRequestOptions("POST", body), success, failure)
}

export function httpDelete(path, body, success, failure) {
  apiRequest(path, getRequestOptions("DELETE", body), success, failure)
}

function getRequestOptions(method, body) {
  return {
    method: method,
    headers: {
      "Content-Type": "application/json",
      "Authorization": accessToken
    },
    body: body ? JSON.stringify(body) : ""
  }
}

function apiRequest(path, requestOptions, success, failure) {
  fetch(`${baseURL}${path}`, requestOptions)
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
