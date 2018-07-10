/*
This files runs on node.
*/
import * as ts from 'typescript';

const globby = require('globby');

const DEBUG = false;
function log(...t: any[]) {
  if (DEBUG) {
    console.log(...t);
  }
}
const compilerOptions: ts.CompilerOptions = {
  target: ts.ScriptTarget.ES2017,
  module: ts.ModuleKind.ESNext,
  allowJs: false,
  checkJs: false,
  jsx: ts.JsxEmit.React,
  noEmit: true,
  allowUnusedLabels: true,
  moduleResolution: ts.ModuleResolutionKind.NodeJs,
};
type PrimitiveType = number | boolean | string | null;
interface Definition {
  $ref?: string;
  $schema?: string;
  description?: string;
  allOf?: Definition[];
  oneOf?: Definition[];
  anyOf?: Definition[];
  title?: string;
  type?: string | string[];
  definitions?: { [key: string]: any };
  format?: string;
  items?: Definition | Definition[];
  minItems?: number;
  additionalItems?: {
    anyOf: Definition[];
  };
  enum?: PrimitiveType[] | Definition[];
  default?: PrimitiveType | Object;
  additionalProperties?: Definition | boolean;
  required?: string[];
  propertyOrder?: string[];
  properties?: { [key: string]: any };
  defaultProperties?: string[];
  const?: any;
  typeof?: 'function';
}
module.exports = function() {
  const files: string[] = globby.sync('src/Components/AutoImport/**/*.tsx');
  log(files);
  const program = ts.createProgram(files, compilerOptions);
  const checker = program.getTypeChecker();
  const symbol_cache = new Map<ts.Symbol, Definition>();
  const t_cache = new WeakSet();

  const types: { type: ts.Type; fileName: string }[] = [];
  for (const sourceFile of program.getSourceFiles()) {
    if (
      !sourceFile.isDeclarationFile &&
      files.some(f => sourceFile.fileName.indexOf(f) > -1)
    ) {
      ts.forEachChild(sourceFile, visit);
    }
  }
  const schema = oneOf(types);
  log(JSON.stringify(schema, undefined, 2));
  return {
    code: `module.exports = {schema:${JSON.stringify(schema)}}`,
  };
  // console.log(JSON.stringify(oneOf(types), undefined, 2));

  function extractProps(node: ts.Node) {
    const typeName = node
      .getSourceFile()
      .fileName.replace(/src\/Components\/AutoImport\/(.*).tsx?/, '$1');
    const t = checker.getTypeAtLocation(node);
    if (t.isClassOrInterface()) {
      const props = checker.getTypeAtLocation(node).getProperty('props');
      if (props) {
        types.push({
          type: checker.getTypeOfSymbolAtLocation(
            props,
            props.valueDeclaration!,
          ),
          fileName: typeName,
        });
      }
    }
    const sign = checker.getSignaturesOfType(t, ts.SignatureKind.Call);
    sign.forEach(s => {
      types.push({
        type: checker.getTypeAtLocation(s.parameters[0].valueDeclaration!),
        fileName: typeName,
      });
    });
  }
  function visit(node: ts.Node) {
    if (isNodeDefaultExported(node)) {
      extractProps(node);
      return;
    }
    if (ts.isExportAssignment(node)) {
      extractProps(node.expression);
      return;
    }
  }

  function isNodeDefaultExported(node: ts.Node): boolean {
    return (
      (ts.getCombinedModifierFlags(node) & ts.ModifierFlags.ExportDefault) !== 0
    );
  }

  /*
  Types to Schema
  */
  function oneOf(types: { type: ts.Type; fileName: string }[]): Definition {
    const defs: { [k: string]: Definition } = {};
    defs.___self = {
      allOf: [
        {
          type: 'object',
          properties: {
            type: {
              enum: types.map(t => t.fileName),
            },
          },
        },
        {
          oneOf: types.map(t => {
            return {
              type: 'object',
              documentation:"Nnaa",
              required: ['type', 'props'],
              properties: {
                type: {
                  type: 'string',
                  const: t.fileName,
                },
                props: serializeType(t.type),
              },
            };
          }),
        },
      ],
    };
    const root = {
      $ref: '#/definitions/___self',
      definitions: defs,
    };
    for (const d of symbol_cache.entries()) {
      defs[checker.getFullyQualifiedName(d[0])] = d[1];
    }
    return root;
  }
  function serialize(symbol?: ts.Symbol): Definition {
    if (symbol === undefined) {
      return {};
    }
    // Special casing ReactElement. Replaced by our elements
    if (checker.getFullyQualifiedName(symbol) === 'React.ReactElement') {
      return {
        $ref: '#/definitions/___self',
      };
    }
    log(checker.getFullyQualifiedName(symbol));
    if (symbol_cache.has(symbol)) {
      return { $ref: `#/definitions/${checker.getFullyQualifiedName(symbol)}` };
    }

    symbol_cache.set(symbol, {});
    const decl = symbol.declarations ? symbol.declarations[0] : undefined;
    const typ = checker.getTypeOfSymbolAtLocation(symbol, decl!);
    const def = {
      ...serializeType(typ),
      ...doc(symbol),
    };
    symbol_cache.set(symbol, def);
    return { $ref: `#/definitions/${checker.getFullyQualifiedName(symbol)}` };
  }

  function serializeType(typ: ts.Type): Definition {
    log('Type', checker.typeToString(typ), ts.TypeFlags[typ.getFlags()]);

    if (
      typ.getFlags() &
      (ts.TypeFlags.NumberLike |
        ts.TypeFlags.StringLike |
        ts.TypeFlags.BooleanLike |
        ts.TypeFlags.Null)
    ) {
      return { ...doc(typ.getSymbol()), type: checker.typeToString(typ) };
    }
    if (typ.getFlags() & ts.TypeFlags.Any) {
      return doc(typ.getSymbol());
    }
    if (typ.isUnion()) {
      return {
        ...doc(typ.getSymbol()),
        anyOf: typ.types.map(t => {
          return serializeType(t);
        }),
      };
    }
    if (typ.isIntersection()) {
      return {
        ...doc(typ.getSymbol()),
        allOf: typ.types.map(t => {
          return serializeType(t);
        }),
      };
    }
    if (t_cache.has(typ)) {
      if (typ.getSymbol() != undefined) {
        return serialize(typ.getSymbol());
      }
    }
    t_cache.add(typ);
    const arrayType = checker.getIndexTypeOfType(typ, ts.IndexKind.Number);
    if (arrayType) {
      const sym = arrayType.getSymbol();
      if (sym) {
        return {
          ...doc(typ.getSymbol()),
          type: 'array',
          items: serialize(sym),
        };
      }
      return {
        ...doc(typ.getSymbol()),
        type: 'array',
        items: serializeType(arrayType),
      };
    }

    const props = checker.getPropertiesOfType(typ);
    if (props.length) {
      const required: string[] = [];
      return {
        ...doc(typ.getSymbol()),
        type: 'object',
        required,
        properties: props.reduce(
          (all, p) => {
            if (!(p.getFlags() & ts.SymbolFlags.Optional)) {
              required.push(p.getName());
            }
            const decl = p.declarations ? p.declarations[0] : undefined;
            all[p.getName()] = {
              ...doc(p),
              ...serializeType(checker.getTypeOfSymbolAtLocation(p, decl!)),
            };
            return all;
          },
          {} as { [p: string]: any },
        ),
      };
    }

    return {};
  }

  function doc(symbol?: ts.Symbol): Definition {
    if (symbol === undefined) {
      return {};
    }
    return {
      description:
        ts.displayPartsToString(symbol.getDocumentationComment(checker)) ||
        undefined,
    };
  }
};
