import Axios from 'axios';

const BASE = '/rest/User/';

export function getCurrentUser() {
    return Axios.get(`${BASE}Current`)
        .then(res => ({
                isLoggedIn: true,
                user: res.data,
        }))
        .catch(() => ({
                isloggedIn: false,
        }));
}

export function login(user = 'root@root.com', password = '1234', remember = true) {
    return Axios.post(`${BASE}Authenticate`, {
        '@class': 'AuthenticationInformation',
        login: user,
        password,
        remember,
    }).then(res => ({
            isLoggedIn: true,
            user: res.data,
    }));
}

export function logout() {
    return Axios.get(`${BASE}Logout`);
}
