import jsonFetch, {prefix} from './wegasFetch';

const BASE = '/rest/User/';

export function getCurrentUser() {
    return jsonFetch(`${BASE}Current`)
        .then(data => ({
            isLoggedIn: true,
            user: data,
        }))
        .catch(e => {
            console.log(e);
            return {
                isloggedIn: false,
            };
        });
}

export function login(
    user = 'root@root.com',
    password = '1234',
    remember = true
) {
    return jsonFetch(`${BASE}Authenticate`, {
        method: 'post',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            '@class': 'AuthenticationInformation',
            login: user,
            password,
            remember,
        }),
    }).then(data => ({
        isLoggedIn: true,
        user: data,
    }));
}

export function logout() {
    return fetch(prefix(`${BASE}Logout`), { credentials: 'same-origin' });
}
