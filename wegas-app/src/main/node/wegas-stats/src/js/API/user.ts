import jsonFetch from "./wegasFetch";

const BASE = "/rest/User/";

export interface UserState {
  isLoggedIn: boolean;
  user?: User;
}

export interface User {
    name: string;
}

export async function getCurrentUser(): Promise<UserState> {
  try {
    const response = await jsonFetch(`${BASE}Current`);

    return {
      isLoggedIn: true,
      user: response as User,
    };
  } catch (e) {
    console.log(e);
    return {
      isLoggedIn: false,
    };
  }
}
