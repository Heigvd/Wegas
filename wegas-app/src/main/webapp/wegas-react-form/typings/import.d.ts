/**
 * Typescript doesn't hanlde dynamic import. Thus we have to currently work arround it.
 * This will be transformed by a babel plugin.
 * see https://github.com/Microsoft/TypeScript/issues/12364
 * @param path import path
 */
declare function _import<T>(path: string): Promise<T>;