// Frontend\lib\authorized-fetch.ts

// Frontend\lib\authorized-fetch.ts

import { auth } from "./firebase";

export async function authorizedFetch(
  input: string,
  init: RequestInit = {},
): Promise<Response> {
  const currentUser = auth.currentUser;
  const headers = new Headers(init.headers);

  if (currentUser) {
    const token = await currentUser.getIdToken();
    headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(input, { ...init, headers });
}
