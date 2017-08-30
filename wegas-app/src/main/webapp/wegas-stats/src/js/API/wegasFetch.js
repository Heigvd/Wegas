export function prefix(url) {
    return `${window.config ? window.config.contextPath : '/Wegas'}${url}`;
}
export default function jsonFetch(url, options = {}) {
    return fetch(
        prefix(url),
        Object.assign(
            {
                credentials: 'same-origin',
            },
            options
        )
    ).then(res => {
        if (res.ok) {
            return res.json();
        }
        return Promise.reject(res.statusText);
    });
}
