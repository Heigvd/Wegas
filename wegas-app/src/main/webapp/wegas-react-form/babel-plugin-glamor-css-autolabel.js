const p = require('path');

function hasLabel(path) {
    return path.node.properties.some(a => {
        if (a.type !== 'ObjectProperty') {
            return false;
        }
        return a.key.name === 'label';
    });
}
module.exports = function transform(babel) {
    const { types: t } = babel;
    let isGCSS = false;
    return {
        visitor: {
            ImportDeclaration(path) {
                if (path.node.source.value === 'glamor') {
                    const impCSS = path.node.specifiers.find(
                        s => s.imported.name === 'css'
                    );
                    if (impCSS) {
                        isGCSS = impCSS.local.name;
                    }
                }
            },
            CallExpression(path) {
                if (isGCSS && path.node.callee.name === isGCSS) {
                    let name = '';
                    const filename = p
                        .relative(
                            this.file.opts.cwd,
                            this.file.opts.filename
                        )
                        .replace(/\//g, '_');
                    if (path.parent.id) {
                        name = `££${path.parent.id.name}£££`;
                    }
                    path.get('arguments').forEach(path => {
                        if (path.isObjectExpression() && !hasLabel(path)) {
                            path.node.properties = [
                                t.ObjectProperty(
                                    t.Identifier('label'),
                                    t.StringLiteral(`${filename}${name}`)
                                ),
                                ...path.node.properties,
                            ];
                        }
                    });
                }
            },
        },
    };
};
