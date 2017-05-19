/**
 * This babel plugin is currently required.
 * It transforms _import calls to import.
 * see https://github.com/Microsoft/TypeScript/issues/12364
 */
module.exports = function tr() {
    return {
        visitor: {
            Identifier(path) {
                const name = path.node.name;
                path.node.name = name === '_import' ? 'import' : name;
            }
        }
    };
};
