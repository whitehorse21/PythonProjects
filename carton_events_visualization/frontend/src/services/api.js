import { query } from "./common";

export const restApiSettings = {
  baseURL: process.env.REACT_APP_API_BASE_URL || "http://127.0.0.1:8000/api",
  //baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api',
  //baseURL: process.env.REACT_APP_API_BASE_URL || 'http://anuragportmap-44814.portmap.host:56665/api',
};

export const backendSettings = {
  // logoBaseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/logo',
  logoBaseURL:
    process.env.REACT_APP_API_BASE_URL ||
    "http://anuragportmap-44814.portmap.host:56665/logo",
};
export async function apiValidateUserId(searchParams) {
  return await query(`/user`, { searchParams });
  // return await query(`/user`, {searchParams: toUpper(searchParams)});
}
export async function apiValidateLocation(searchParams) {
  return await query(`/location`, { searchParams });
}
export async function apiValidateLPNId(searchParams) {
  return await query(`/tote`, { searchParams });
}
export async function apiValidateSKU(searchParams) {
  return await query(`/sku`, { searchParams });
}
export async function apiValidateActionCode(searchParams) {
  return await query(`/action_code`, {
    searchParams: searchParams,
    method: "POST",
  });
}
export async function apiValidatePackCarton(searchParams) {
  return await query(`/pack_carton`, {
    searchParams: searchParams,
    method: "POST",
  });
}
export async function apiCancelTote(searchParams) {
  return await query(`/cancel_tote`, {
    searchParams: searchParams,
    method: "POST",
  });
}
export async function apiValidatePrintCarton(searchParams) {
  return await query(`/print_carton`, {
    searchParams: searchParams,
    method: "POST",
  });
}
export async function apiGetToteDetails(searchParams) {
  return await query(`/tote_details`, { searchParams });
}

export async function apiValidateLoad(searchParams) {
  return await query(`/load`, { searchParams: searchParams, method: "POST" });
}
export async function apiValidateDockDoor(searchParams) {
  return await query(`/dock_door`, {
    searchParams: searchParams,
    method: "POST",
  });
}
export async function apiValidateTrailer(searchParams) {
  return await query(`/trailer`, {
    searchParams: searchParams,
    method: "POST",
  });
}
export async function apiValidateLoadCarton(searchParams) {
  return await query(`/load_carton`, {
    searchParams: searchParams,
    method: "POST",
  });
}
export async function apiUpdateCartonBoxCount(searchParams) {
  return await query(`/update_carton_box_count`, {
    searchParams: searchParams,
    method: "POST",
  });
}
export async function apiFetchCartonEvents(searchParams) {
  return await query(`/loadcartonevents/`, { searchParams });
  // return await query(`/user`, {searchParams: toUpper(searchParams)});
}
