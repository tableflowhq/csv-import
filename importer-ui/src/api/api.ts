import axios, { AxiosResponse } from "axios";
import notification from "../utils/notification";
import { Notification } from "../utils/notification/types";
import { ApiResponse } from "./types";

// TODO: Load these from the env
const env = {
  API_BASE_URL: "",
};
const defaultImporterHost = "importer.tableflow.com";
const defaultAPIHost = "api.tableflow.com";
// Authenticated routes will use the path /api/v1
const baseURL = getAPIBaseURL("v1");
// Unauthenticated routes will use the path /api
// const publicBaseURL = getAPIBaseURL();

export function getAPIBaseURL(version?: string): string {
  // If an API URL is provided in the environment, use that
  let url = env.API_BASE_URL;
  if (url) {
    if (!url.endsWith("/")) {
      url = url + "/";
    }
    return url + "file-import/" + (version ? version + "/" : "");
  }
  // Check if the importer is being hosted on TableFlow
  let host = window.location.host;
  if (host.indexOf(defaultImporterHost) === 0) {
    return `https://${defaultAPIHost}/file-import/${version ? version + "/" : ""}`;
  }
  // If no API URL is provided and the importer is not being hosted on TableFlow, use the current host and replace the
  // port with the default API port. This is mostly used for development.
  if (host.indexOf(":") > 0) {
    // If the host contains a port, remove it
    host = host.substring(0, host.indexOf(":"));
  }
  return `${window.location.protocol}//${host}:3003/file-import/${version ? version + "/" : ""}`;
}

const successHandler = (notificationVars?: Notification) => {
  return (response: AxiosResponse<any, any>): ApiResponse<any> => {
    if (notificationVars) notification({ ...notificationVars });

    return {
      ok: true,
      error: "",
      data: response.data,
      status: response.status,
    };
  };
};

const errorHandler = (error: any, url: string, method: string): ApiResponse<any> => {
  const result = {
    ok: false,
    error: "An unknown error occurred",
    data: {},
    status: 0,
  };
  if (error.response) {
    // Server responded with a status code that falls out of the range of 2xx
    const res = error.response;
    const apiErrorMessage = res.data.error || res.data.message || "";
    console.error(
      `${error.message}\n\nRequest: ${method} ${url}\nStatus:  ${res.status} (${res.statusText})\nError:   ${
        apiErrorMessage ? apiErrorMessage : res.data
      }`
    );
    result.data = res.data;
    result.error = res.data.error || res.data.message || result.error;
    result.status = res.status;
  } else if (error.request) {
    // The request was made but no response was received
    console.error("No response was received from request", error.request);
  } else {
    // Something happened in setting up the request that triggered an Error
    console.error("An error occurred before sending the request", error.message);
  }

  notification({ title: "Error", message: result.error, type: "error" });

  return result;
};

const headers = {
  "Content-Type": "application/json",
  Authorization: "Bearer tableflow",
};

export async function get(path: string, handleError = true): Promise<ApiResponse<any>> {
  const url = `${baseURL}${path}`;
  return axios
    .get(url, {
      headers,
      timeout: 10 * 1000,
    })
    .then(successHandler())
    .catch((error) => (handleError ? errorHandler(error, url, "GET") : { error, ok: false, data: null, status: 0 }));
}

export async function post(path: string, body: any): Promise<ApiResponse<any>> {
  const url = `${baseURL}${path}`;
  return axios
    .post(url, body, {
      headers,
      timeout: 10 * 1000,
    })
    .then(successHandler({ title: "Successfully saved", message: "" }))
    .catch((error) => errorHandler(error, url, "POST"));
}

export async function remove(path: string): Promise<ApiResponse<any>> {
  const url = `${baseURL}${path}`;
  return axios
    .delete(url, {
      headers,
      timeout: 10 * 1000,
    })
    .then(successHandler({ title: "Successfully deleted", message: "" }))
    .catch((error) => errorHandler(error, url, "DELETE"));
}
