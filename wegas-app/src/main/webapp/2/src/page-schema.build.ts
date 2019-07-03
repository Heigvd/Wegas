/*
This files runs on node.
*/
import * as ts from 'typescript';
import * as globby from 'globby';

const DEBUG = false;
function log(...t: unknown[]) {
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
interface MonacoSnippet {
  label: string;
  description?: string;
  /**
   * This is the pre-filled object, $1, $2, ... can be
   * used as tab index
   */
  body: object;
}
interface Definition {
  $ref?: string;
  $schema?: string;
  description?: string;
  allOf?: Definition[];
  oneOf?: Definition[];
  anyOf?: Definition[];
  title?: string;
  type?: string | string[];
  minimum?: number;
  maximum?: number;
  pattern?: string;
  definitions?: { [key: string]: any };
  format?: string;
  items?: Definition | Definition[];
  minItems?: number;
  additionalItems?: {
    anyOf: Definition[];
  };
  enum?: PrimitiveType[] | Definition[];
  default?: PrimitiveType | {};
  additionalProperties?: Definition | boolean;
  required?: string[];
  propertyOrder?: string[];
  properties?: { [key: string]: Definition };
  defaultProperties?: string[];
  const?: any;
  typeof?: 'function';
  /**
   * Specific to VSCode / Monaco's json editor
   */
  defaultSnippets?: MonacoSnippet[];
}
/**
 * Special case WegasComponent, to be replaced by our Components.
 */
const OUR_ELEMENT_TYPE_NAME = 'WegasComponent';
export default function() {
  const files: string[] = globby.sync('src/Components/AutoImport/**/*.tsx');

  log(files);
  const lib = globby.sync('types/**/*.d.ts');
  const program = ts.createProgram(files.concat(lib), compilerOptions);
  const checker = program.getTypeChecker();
  const symbol_cache = new Map<ts.Symbol, Definition>();
  // const t_cache = new WeakSet();

  const types: { type: ts.Type | null; fileName: string }[] = [];
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
    contextDependencies: files,
    cacheable: true,
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
        type: s.parameters[0]
          ? checker.getTypeAtLocation(s.parameters[0].valueDeclaration!)
          : null,
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
    const modifier = ts.getCombinedModifierFlags(node as ts.Declaration);
    return (
      (modifier & ts.ModifierFlags.ExportDefault) ===
      ts.ModifierFlags.ExportDefault
    );
  }

  /*
  Types to Schema
  */
  function oneOf(
    types: { type: ts.Type | null; fileName: string }[],
  ): Definition {
    const defs: { [k: string]: Definition } = {};
    defs.components = {
      oneOf: types.map(t => {
        return {
          type: 'object',
          required: ['type', 'props'],
          properties: {
            type: {
              type: 'string',
              enum: [t.fileName],
            },
            props:
              t.type !== null
                ? serializeType(t.type)
                : { type: 'object', additionalProperties: false },
          },
        };
      }),
      defaultSnippets: [
        {
          label: 'New Component',
          body: { type: '$1' },
        },
      ],
    };
    defs.___self = {
      allOf: [
        {
          $ref: '#/definitions/components',
        },
        {
          type: 'object',
          properties: {
            type: {},
            props: {},
          },
          additionalProperties: false,
        },
      ],
    };
    const root: Definition = {
      allOf: [
        {
          $ref: '#/definitions/components',
        },
        {
          type: 'object',
          additionalProperties: false,
          required: ['@index'],
          properties: {
            '@name': {
              description: 'Name the page',
              type: ['string', 'null'],
            },
            type: {},
            props: {},

            '@index': {
              description:
                'Position in the page index. Positive integer, smaller than page count',
              oneOf: [
                { type: 'integer', minimum: 0 },
                { type: 'string', pattern: '^\\d+$' },
              ],
            },
          },
        },
      ],
      definitions: defs,
    };
    for (const d of symbol_cache.entries()) {
      defs[symbolUniqueName(d[0])] = d[1];
    }
    return root;
  }
  function symbolUniqueName(symbol: ts.Symbol) {
    return checker.getFullyQualifiedName(symbol) + (symbol as any).id;
  }
  function serialize(symbol: ts.Symbol | undefined, ref: ts.Type): Definition {
    if (symbol === undefined) {
      return serializeType(ref, true);
    }
    if (checker.getFullyQualifiedName(symbol) === OUR_ELEMENT_TYPE_NAME) {
      return {
        $ref: '#/definitions/___self',
      };
    }
    const name = symbolUniqueName(symbol);
    log(name);
    if (symbol_cache.has(symbol)) {
      return { $ref: `#/definitions/${name}` };
    }

    symbol_cache.set(symbol, {});
    // const decl = symbol.declarations ? symbol.declarations[0] : undefined;
    // const typ = checker.getTypeOfSymbolAtLocation(symbol, decl!);
    const def = {
      ...serializeType(ref, true),
      ...doc(symbol),
    };
    symbol_cache.set(symbol, def);
    return { $ref: `#/definitions/${name}` };
  }

  function serializeType(typ: ts.Type, skipSymbol?: true): Definition {
    log('Type', checker.typeToString(typ), ts.TypeFlags[typ.getFlags()]);

    if (
      typ.getFlags() &
      (ts.TypeFlags.Number |
        ts.TypeFlags.String |
        ts.TypeFlags.Boolean |
        ts.TypeFlags.Null)
    ) {
      return { ...doc(typ.getSymbol()), type: checker.typeToString(typ) };
    }
    if (typ.getFlags() & ts.TypeFlags.StringOrNumberLiteral) {
      return {
        ...doc(typ.getSymbol()),
        enum: [(typ as ts.StringLiteralType | ts.NumberLiteralType).value],
      };
    }
    if (typ.getFlags() & ts.TypeFlags.BooleanLiteral) {
      return {
        ...doc(typ.getSymbol()),
        enum: [(typ as any).intrinsicName === 'true'],
      };
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
    // if (t_cache.has(typ)) {
    //   if (typ.getSymbol() != undefined) {
    //     return serialize(typ.getSymbol());
    //   }
    // }
    // t_cache.add(typ);
    const arrayType = checker.getIndexTypeOfType(typ, ts.IndexKind.Number);
    if (arrayType) {
      const sym = arrayType.getSymbol();
      if (sym) {
        return {
          ...doc(typ.getSymbol()),
          type: 'array',
          items: serialize(sym, arrayType),
        };
      }
      return {
        ...doc(typ.getSymbol()),
        type: 'array',
        items: serializeType(arrayType),
      };
    }

    const sym = typ.getSymbol();
    if (
      sym != undefined &&
      !skipSymbol /* && checker.getFullyQualifiedName(sym) === OUR_ELEMENT_TYPE_NAME */
    ) {
      return serialize(sym, typ);
    }
    const props = checker.getPropertiesOfType(typ);
    if (props.length) {
      const required: string[] = [];
      return {
        ...doc(typ.getSymbol()),
        type: 'object',
        required,
        additionalProperties: false,
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
}
