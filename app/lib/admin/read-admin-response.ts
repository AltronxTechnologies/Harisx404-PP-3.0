export async function readAdminResponse(response: Response, label: string) {
  if (!response.headers.get("content-type")?.includes("application/json")) {
    if (response.redirected && new URL(response.url).pathname === "/admin/login") {
      throw new Error("Your Admin session expired. Sign in again before changing content.");
    }
    if (response.status === 413) throw new Error(`${label} exceeds the server's request-size limit. Try a smaller file.`);
    throw new Error(`${label} service returned an unexpected response (${response.status}). The change was not confirmed; refresh its status before retrying.`);
  }
  try {
    return await response.json();
  } catch {
    throw new Error(`${label} service returned an incomplete response. Refresh its status before retrying.`);
  }
}
