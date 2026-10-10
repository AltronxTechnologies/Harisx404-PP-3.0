export async function readAdminResponse(response: Response, label: string) {
  if (!response.headers.get("content-type")?.includes("application/json")) {
    if (response.redirected && new URL(response.url).pathname === "/admin/login") {
      throw new Error("Your Admin session expired. Sign in again before changing content.");
    }
    if (response.status === 413) throw new Error(`${label} was rejected (HTTP 413) before the app returned a JSON result. A server or proxy may limit the full request even when the file is small. Check the upload endpoint before retrying.`);
    throw new Error(`${label} service returned an unexpected response (${response.status}). The change was not confirmed; refresh its status before retrying.`);
  }
  try {
    return await response.json();
  } catch {
    throw new Error(`${label} service returned an incomplete response. Refresh its status before retrying.`);
  }
}
