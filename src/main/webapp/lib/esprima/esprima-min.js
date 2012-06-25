(function(ah){var aN,bf,bj,aK,ao,bb,a7,s,a9,az,bg,o,aJ,bh,ag;
aN={BooleanLiteral:1,EOF:2,Identifier:3,Keyword:4,NullLiteral:5,NumericLiteral:6,Punctuator:7,StringLiteral:8};
bf={};
bf[aN.BooleanLiteral]="Boolean";
bf[aN.EOF]="<end>";
bf[aN.Identifier]="Identifier";
bf[aN.Keyword]="Keyword";
bf[aN.NullLiteral]="Null";
bf[aN.NumericLiteral]="Numeric";
bf[aN.Punctuator]="Punctuator";
bf[aN.StringLiteral]="String";
bj={AssignmentExpression:"AssignmentExpression",ArrayExpression:"ArrayExpression",BlockStatement:"BlockStatement",BinaryExpression:"BinaryExpression",BreakStatement:"BreakStatement",CallExpression:"CallExpression",CatchClause:"CatchClause",ConditionalExpression:"ConditionalExpression",ContinueStatement:"ContinueStatement",DoWhileStatement:"DoWhileStatement",DebuggerStatement:"DebuggerStatement",EmptyStatement:"EmptyStatement",ExpressionStatement:"ExpressionStatement",ForStatement:"ForStatement",ForInStatement:"ForInStatement",FunctionDeclaration:"FunctionDeclaration",FunctionExpression:"FunctionExpression",Identifier:"Identifier",IfStatement:"IfStatement",Literal:"Literal",LabeledStatement:"LabeledStatement",LogicalExpression:"LogicalExpression",MemberExpression:"MemberExpression",NewExpression:"NewExpression",ObjectExpression:"ObjectExpression",Program:"Program",Property:"Property",ReturnStatement:"ReturnStatement",SequenceExpression:"SequenceExpression",SwitchStatement:"SwitchStatement",SwitchCase:"SwitchCase",ThisExpression:"ThisExpression",ThrowStatement:"ThrowStatement",TryStatement:"TryStatement",UnaryExpression:"UnaryExpression",UpdateExpression:"UpdateExpression",VariableDeclaration:"VariableDeclaration",VariableDeclarator:"VariableDeclarator",WhileStatement:"WhileStatement",WithStatement:"WithStatement"};
aK={Data:1,Get:2,Set:4};
ao={UnexpectedToken:"Unexpected token %0",UnexpectedNumber:"Unexpected number",UnexpectedString:"Unexpected string",UnexpectedIdentifier:"Unexpected identifier",UnexpectedReserved:"Unexpected reserved word",UnexpectedEOS:"Unexpected end of input",NewlineAfterThrow:"Illegal newline after throw",InvalidRegExp:"Invalid regular expression",UnterminatedRegExp:"Invalid regular expression: missing /",InvalidLHSInAssignment:"Invalid left-hand side in assignment",InvalidLHSInForIn:"Invalid left-hand side in for-in",NoCatchOrFinally:"Missing catch or finally after try",UnknownLabel:"Undefined label '%0'",Redeclaration:"%0 '%1' has already been declared",IllegalContinue:"Illegal continue statement",IllegalBreak:"Illegal break statement",IllegalReturn:"Illegal return statement",StrictModeWith:"Strict mode code may not include a with statement",StrictCatchVariable:"Catch variable may not be eval or arguments in strict mode",StrictVarName:"Variable name may not be eval or arguments in strict mode",StrictParamName:"Parameter name eval or arguments is not allowed in strict mode",StrictParamDupe:"Strict mode function may not have duplicate parameter names",StrictFunctionName:"Function name may not be eval or arguments in strict mode",StrictOctalLiteral:"Octal literals are not allowed in strict mode.",StrictDelete:"Delete of an unqualified identifier in strict mode.",StrictDuplicateProperty:"Duplicate data property in object literal not allowed in strict mode",AccessorDataProperty:"Object literal may not have data and accessor property with the same name",AccessorGetSet:"Object literal may not have multiple get/set accessors with the same name",StrictLHSAssignment:"Assignment to eval or arguments is not allowed in strict mode",StrictLHSPostfix:"Postfix increment/decrement may not have eval or arguments operand in strict mode",StrictLHSPrefix:"Prefix increment/decrement may not have eval or arguments operand in strict mode",StrictReservedWord:"Use of future reserved word in strict mode"};
bb={NonAsciiIdentifierStart:new RegExp("[\xaa\xb5\xba\xc0-\xd6\xd8-\xf6\xf8-\u02c1\u02c6-\u02d1\u02e0-\u02e4\u02ec\u02ee\u0370-\u0374\u0376\u0377\u037a-\u037d\u0386\u0388-\u038a\u038c\u038e-\u03a1\u03a3-\u03f5\u03f7-\u0481\u048a-\u0527\u0531-\u0556\u0559\u0561-\u0587\u05d0-\u05ea\u05f0-\u05f2\u0620-\u064a\u066e\u066f\u0671-\u06d3\u06d5\u06e5\u06e6\u06ee\u06ef\u06fa-\u06fc\u06ff\u0710\u0712-\u072f\u074d-\u07a5\u07b1\u07ca-\u07ea\u07f4\u07f5\u07fa\u0800-\u0815\u081a\u0824\u0828\u0840-\u0858\u08a0\u08a2-\u08ac\u0904-\u0939\u093d\u0950\u0958-\u0961\u0971-\u0977\u0979-\u097f\u0985-\u098c\u098f\u0990\u0993-\u09a8\u09aa-\u09b0\u09b2\u09b6-\u09b9\u09bd\u09ce\u09dc\u09dd\u09df-\u09e1\u09f0\u09f1\u0a05-\u0a0a\u0a0f\u0a10\u0a13-\u0a28\u0a2a-\u0a30\u0a32\u0a33\u0a35\u0a36\u0a38\u0a39\u0a59-\u0a5c\u0a5e\u0a72-\u0a74\u0a85-\u0a8d\u0a8f-\u0a91\u0a93-\u0aa8\u0aaa-\u0ab0\u0ab2\u0ab3\u0ab5-\u0ab9\u0abd\u0ad0\u0ae0\u0ae1\u0b05-\u0b0c\u0b0f\u0b10\u0b13-\u0b28\u0b2a-\u0b30\u0b32\u0b33\u0b35-\u0b39\u0b3d\u0b5c\u0b5d\u0b5f-\u0b61\u0b71\u0b83\u0b85-\u0b8a\u0b8e-\u0b90\u0b92-\u0b95\u0b99\u0b9a\u0b9c\u0b9e\u0b9f\u0ba3\u0ba4\u0ba8-\u0baa\u0bae-\u0bb9\u0bd0\u0c05-\u0c0c\u0c0e-\u0c10\u0c12-\u0c28\u0c2a-\u0c33\u0c35-\u0c39\u0c3d\u0c58\u0c59\u0c60\u0c61\u0c85-\u0c8c\u0c8e-\u0c90\u0c92-\u0ca8\u0caa-\u0cb3\u0cb5-\u0cb9\u0cbd\u0cde\u0ce0\u0ce1\u0cf1\u0cf2\u0d05-\u0d0c\u0d0e-\u0d10\u0d12-\u0d3a\u0d3d\u0d4e\u0d60\u0d61\u0d7a-\u0d7f\u0d85-\u0d96\u0d9a-\u0db1\u0db3-\u0dbb\u0dbd\u0dc0-\u0dc6\u0e01-\u0e30\u0e32\u0e33\u0e40-\u0e46\u0e81\u0e82\u0e84\u0e87\u0e88\u0e8a\u0e8d\u0e94-\u0e97\u0e99-\u0e9f\u0ea1-\u0ea3\u0ea5\u0ea7\u0eaa\u0eab\u0ead-\u0eb0\u0eb2\u0eb3\u0ebd\u0ec0-\u0ec4\u0ec6\u0edc-\u0edf\u0f00\u0f40-\u0f47\u0f49-\u0f6c\u0f88-\u0f8c\u1000-\u102a\u103f\u1050-\u1055\u105a-\u105d\u1061\u1065\u1066\u106e-\u1070\u1075-\u1081\u108e\u10a0-\u10c5\u10c7\u10cd\u10d0-\u10fa\u10fc-\u1248\u124a-\u124d\u1250-\u1256\u1258\u125a-\u125d\u1260-\u1288\u128a-\u128d\u1290-\u12b0\u12b2-\u12b5\u12b8-\u12be\u12c0\u12c2-\u12c5\u12c8-\u12d6\u12d8-\u1310\u1312-\u1315\u1318-\u135a\u1380-\u138f\u13a0-\u13f4\u1401-\u166c\u166f-\u167f\u1681-\u169a\u16a0-\u16ea\u16ee-\u16f0\u1700-\u170c\u170e-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176c\u176e-\u1770\u1780-\u17b3\u17d7\u17dc\u1820-\u1877\u1880-\u18a8\u18aa\u18b0-\u18f5\u1900-\u191c\u1950-\u196d\u1970-\u1974\u1980-\u19ab\u19c1-\u19c7\u1a00-\u1a16\u1a20-\u1a54\u1aa7\u1b05-\u1b33\u1b45-\u1b4b\u1b83-\u1ba0\u1bae\u1baf\u1bba-\u1be5\u1c00-\u1c23\u1c4d-\u1c4f\u1c5a-\u1c7d\u1ce9-\u1cec\u1cee-\u1cf1\u1cf5\u1cf6\u1d00-\u1dbf\u1e00-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fbc\u1fbe\u1fc2-\u1fc4\u1fc6-\u1fcc\u1fd0-\u1fd3\u1fd6-\u1fdb\u1fe0-\u1fec\u1ff2-\u1ff4\u1ff6-\u1ffc\u2071\u207f\u2090-\u209c\u2102\u2107\u210a-\u2113\u2115\u2119-\u211d\u2124\u2126\u2128\u212a-\u212d\u212f-\u2139\u213c-\u213f\u2145-\u2149\u214e\u2160-\u2188\u2c00-\u2c2e\u2c30-\u2c5e\u2c60-\u2ce4\u2ceb-\u2cee\u2cf2\u2cf3\u2d00-\u2d25\u2d27\u2d2d\u2d30-\u2d67\u2d6f\u2d80-\u2d96\u2da0-\u2da6\u2da8-\u2dae\u2db0-\u2db6\u2db8-\u2dbe\u2dc0-\u2dc6\u2dc8-\u2dce\u2dd0-\u2dd6\u2dd8-\u2dde\u2e2f\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303c\u3041-\u3096\u309d-\u309f\u30a1-\u30fa\u30fc-\u30ff\u3105-\u312d\u3131-\u318e\u31a0-\u31ba\u31f0-\u31ff\u3400-\u4db5\u4e00-\u9fcc\ua000-\ua48c\ua4d0-\ua4fd\ua500-\ua60c\ua610-\ua61f\ua62a\ua62b\ua640-\ua66e\ua67f-\ua697\ua6a0-\ua6ef\ua717-\ua71f\ua722-\ua788\ua78b-\ua78e\ua790-\ua793\ua7a0-\ua7aa\ua7f8-\ua801\ua803-\ua805\ua807-\ua80a\ua80c-\ua822\ua840-\ua873\ua882-\ua8b3\ua8f2-\ua8f7\ua8fb\ua90a-\ua925\ua930-\ua946\ua960-\ua97c\ua984-\ua9b2\ua9cf\uaa00-\uaa28\uaa40-\uaa42\uaa44-\uaa4b\uaa60-\uaa76\uaa7a\uaa80-\uaaaf\uaab1\uaab5\uaab6\uaab9-\uaabd\uaac0\uaac2\uaadb-\uaadd\uaae0-\uaaea\uaaf2-\uaaf4\uab01-\uab06\uab09-\uab0e\uab11-\uab16\uab20-\uab26\uab28-\uab2e\uabc0-\uabe2\uac00-\ud7a3\ud7b0-\ud7c6\ud7cb-\ud7fb\uf900-\ufa6d\ufa70-\ufad9\ufb00-\ufb06\ufb13-\ufb17\ufb1d\ufb1f-\ufb28\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40\ufb41\ufb43\ufb44\ufb46-\ufbb1\ufbd3-\ufd3d\ufd50-\ufd8f\ufd92-\ufdc7\ufdf0-\ufdfb\ufe70-\ufe74\ufe76-\ufefc\uff21-\uff3a\uff41-\uff5a\uff66-\uffbe\uffc2-\uffc7\uffca-\uffcf\uffd2-\uffd7\uffda-\uffdc]"),NonAsciiIdentifierPart:new RegExp("[\xaa\xb5\xba\xc0-\xd6\xd8-\xf6\xf8-\u02c1\u02c6-\u02d1\u02e0-\u02e4\u02ec\u02ee\u0300-\u0374\u0376\u0377\u037a-\u037d\u0386\u0388-\u038a\u038c\u038e-\u03a1\u03a3-\u03f5\u03f7-\u0481\u0483-\u0487\u048a-\u0527\u0531-\u0556\u0559\u0561-\u0587\u0591-\u05bd\u05bf\u05c1\u05c2\u05c4\u05c5\u05c7\u05d0-\u05ea\u05f0-\u05f2\u0610-\u061a\u0620-\u0669\u066e-\u06d3\u06d5-\u06dc\u06df-\u06e8\u06ea-\u06fc\u06ff\u0710-\u074a\u074d-\u07b1\u07c0-\u07f5\u07fa\u0800-\u082d\u0840-\u085b\u08a0\u08a2-\u08ac\u08e4-\u08fe\u0900-\u0963\u0966-\u096f\u0971-\u0977\u0979-\u097f\u0981-\u0983\u0985-\u098c\u098f\u0990\u0993-\u09a8\u09aa-\u09b0\u09b2\u09b6-\u09b9\u09bc-\u09c4\u09c7\u09c8\u09cb-\u09ce\u09d7\u09dc\u09dd\u09df-\u09e3\u09e6-\u09f1\u0a01-\u0a03\u0a05-\u0a0a\u0a0f\u0a10\u0a13-\u0a28\u0a2a-\u0a30\u0a32\u0a33\u0a35\u0a36\u0a38\u0a39\u0a3c\u0a3e-\u0a42\u0a47\u0a48\u0a4b-\u0a4d\u0a51\u0a59-\u0a5c\u0a5e\u0a66-\u0a75\u0a81-\u0a83\u0a85-\u0a8d\u0a8f-\u0a91\u0a93-\u0aa8\u0aaa-\u0ab0\u0ab2\u0ab3\u0ab5-\u0ab9\u0abc-\u0ac5\u0ac7-\u0ac9\u0acb-\u0acd\u0ad0\u0ae0-\u0ae3\u0ae6-\u0aef\u0b01-\u0b03\u0b05-\u0b0c\u0b0f\u0b10\u0b13-\u0b28\u0b2a-\u0b30\u0b32\u0b33\u0b35-\u0b39\u0b3c-\u0b44\u0b47\u0b48\u0b4b-\u0b4d\u0b56\u0b57\u0b5c\u0b5d\u0b5f-\u0b63\u0b66-\u0b6f\u0b71\u0b82\u0b83\u0b85-\u0b8a\u0b8e-\u0b90\u0b92-\u0b95\u0b99\u0b9a\u0b9c\u0b9e\u0b9f\u0ba3\u0ba4\u0ba8-\u0baa\u0bae-\u0bb9\u0bbe-\u0bc2\u0bc6-\u0bc8\u0bca-\u0bcd\u0bd0\u0bd7\u0be6-\u0bef\u0c01-\u0c03\u0c05-\u0c0c\u0c0e-\u0c10\u0c12-\u0c28\u0c2a-\u0c33\u0c35-\u0c39\u0c3d-\u0c44\u0c46-\u0c48\u0c4a-\u0c4d\u0c55\u0c56\u0c58\u0c59\u0c60-\u0c63\u0c66-\u0c6f\u0c82\u0c83\u0c85-\u0c8c\u0c8e-\u0c90\u0c92-\u0ca8\u0caa-\u0cb3\u0cb5-\u0cb9\u0cbc-\u0cc4\u0cc6-\u0cc8\u0cca-\u0ccd\u0cd5\u0cd6\u0cde\u0ce0-\u0ce3\u0ce6-\u0cef\u0cf1\u0cf2\u0d02\u0d03\u0d05-\u0d0c\u0d0e-\u0d10\u0d12-\u0d3a\u0d3d-\u0d44\u0d46-\u0d48\u0d4a-\u0d4e\u0d57\u0d60-\u0d63\u0d66-\u0d6f\u0d7a-\u0d7f\u0d82\u0d83\u0d85-\u0d96\u0d9a-\u0db1\u0db3-\u0dbb\u0dbd\u0dc0-\u0dc6\u0dca\u0dcf-\u0dd4\u0dd6\u0dd8-\u0ddf\u0df2\u0df3\u0e01-\u0e3a\u0e40-\u0e4e\u0e50-\u0e59\u0e81\u0e82\u0e84\u0e87\u0e88\u0e8a\u0e8d\u0e94-\u0e97\u0e99-\u0e9f\u0ea1-\u0ea3\u0ea5\u0ea7\u0eaa\u0eab\u0ead-\u0eb9\u0ebb-\u0ebd\u0ec0-\u0ec4\u0ec6\u0ec8-\u0ecd\u0ed0-\u0ed9\u0edc-\u0edf\u0f00\u0f18\u0f19\u0f20-\u0f29\u0f35\u0f37\u0f39\u0f3e-\u0f47\u0f49-\u0f6c\u0f71-\u0f84\u0f86-\u0f97\u0f99-\u0fbc\u0fc6\u1000-\u1049\u1050-\u109d\u10a0-\u10c5\u10c7\u10cd\u10d0-\u10fa\u10fc-\u1248\u124a-\u124d\u1250-\u1256\u1258\u125a-\u125d\u1260-\u1288\u128a-\u128d\u1290-\u12b0\u12b2-\u12b5\u12b8-\u12be\u12c0\u12c2-\u12c5\u12c8-\u12d6\u12d8-\u1310\u1312-\u1315\u1318-\u135a\u135d-\u135f\u1380-\u138f\u13a0-\u13f4\u1401-\u166c\u166f-\u167f\u1681-\u169a\u16a0-\u16ea\u16ee-\u16f0\u1700-\u170c\u170e-\u1714\u1720-\u1734\u1740-\u1753\u1760-\u176c\u176e-\u1770\u1772\u1773\u1780-\u17d3\u17d7\u17dc\u17dd\u17e0-\u17e9\u180b-\u180d\u1810-\u1819\u1820-\u1877\u1880-\u18aa\u18b0-\u18f5\u1900-\u191c\u1920-\u192b\u1930-\u193b\u1946-\u196d\u1970-\u1974\u1980-\u19ab\u19b0-\u19c9\u19d0-\u19d9\u1a00-\u1a1b\u1a20-\u1a5e\u1a60-\u1a7c\u1a7f-\u1a89\u1a90-\u1a99\u1aa7\u1b00-\u1b4b\u1b50-\u1b59\u1b6b-\u1b73\u1b80-\u1bf3\u1c00-\u1c37\u1c40-\u1c49\u1c4d-\u1c7d\u1cd0-\u1cd2\u1cd4-\u1cf6\u1d00-\u1de6\u1dfc-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fbc\u1fbe\u1fc2-\u1fc4\u1fc6-\u1fcc\u1fd0-\u1fd3\u1fd6-\u1fdb\u1fe0-\u1fec\u1ff2-\u1ff4\u1ff6-\u1ffc\u200c\u200d\u203f\u2040\u2054\u2071\u207f\u2090-\u209c\u20d0-\u20dc\u20e1\u20e5-\u20f0\u2102\u2107\u210a-\u2113\u2115\u2119-\u211d\u2124\u2126\u2128\u212a-\u212d\u212f-\u2139\u213c-\u213f\u2145-\u2149\u214e\u2160-\u2188\u2c00-\u2c2e\u2c30-\u2c5e\u2c60-\u2ce4\u2ceb-\u2cf3\u2d00-\u2d25\u2d27\u2d2d\u2d30-\u2d67\u2d6f\u2d7f-\u2d96\u2da0-\u2da6\u2da8-\u2dae\u2db0-\u2db6\u2db8-\u2dbe\u2dc0-\u2dc6\u2dc8-\u2dce\u2dd0-\u2dd6\u2dd8-\u2dde\u2de0-\u2dff\u2e2f\u3005-\u3007\u3021-\u302f\u3031-\u3035\u3038-\u303c\u3041-\u3096\u3099\u309a\u309d-\u309f\u30a1-\u30fa\u30fc-\u30ff\u3105-\u312d\u3131-\u318e\u31a0-\u31ba\u31f0-\u31ff\u3400-\u4db5\u4e00-\u9fcc\ua000-\ua48c\ua4d0-\ua4fd\ua500-\ua60c\ua610-\ua62b\ua640-\ua66f\ua674-\ua67d\ua67f-\ua697\ua69f-\ua6f1\ua717-\ua71f\ua722-\ua788\ua78b-\ua78e\ua790-\ua793\ua7a0-\ua7aa\ua7f8-\ua827\ua840-\ua873\ua880-\ua8c4\ua8d0-\ua8d9\ua8e0-\ua8f7\ua8fb\ua900-\ua92d\ua930-\ua953\ua960-\ua97c\ua980-\ua9c0\ua9cf-\ua9d9\uaa00-\uaa36\uaa40-\uaa4d\uaa50-\uaa59\uaa60-\uaa76\uaa7a\uaa7b\uaa80-\uaac2\uaadb-\uaadd\uaae0-\uaaef\uaaf2-\uaaf6\uab01-\uab06\uab09-\uab0e\uab11-\uab16\uab20-\uab26\uab28-\uab2e\uabc0-\uabea\uabec\uabed\uabf0-\uabf9\uac00-\ud7a3\ud7b0-\ud7c6\ud7cb-\ud7fb\uf900-\ufa6d\ufa70-\ufad9\ufb00-\ufb06\ufb13-\ufb17\ufb1d-\ufb28\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40\ufb41\ufb43\ufb44\ufb46-\ufbb1\ufbd3-\ufd3d\ufd50-\ufd8f\ufd92-\ufdc7\ufdf0-\ufdfb\ufe00-\ufe0f\ufe20-\ufe26\ufe33\ufe34\ufe4d-\ufe4f\ufe70-\ufe74\ufe76-\ufefc\uff10-\uff19\uff21-\uff3a\uff3f\uff41-\uff5a\uff66-\uffbe\uffc2-\uffc7\uffca-\uffcf\uffd2-\uffd7\uffda-\uffdc]")};
function B(bm,bl){if(!bm){throw new Error("ASSERT: "+bl)
}}function a2(bm,bl){return a7.slice(bm,bl)
}if(typeof"esprima"[0]==="undefined"){a2=function ap(bm,bl){return a7.slice(bm,bl).join("")
}
}function z(bl){return"0123456789".indexOf(bl)>=0
}function aP(bl){return"0123456789abcdefABCDEF".indexOf(bl)>=0
}function ab(bl){return"01234567".indexOf(bl)>=0
}function bc(bl){return(bl===" ")||(bl==="\u0009")||(bl==="\u000B")||(bl==="\u000C")||(bl==="\u00A0")||(bl.charCodeAt(0)>=5760&&"\u1680\u180E\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\uFEFF".indexOf(bl)>=0)
}function ba(bl){return(bl==="\n"||bl==="\r"||bl==="\u2028"||bl==="\u2029")
}function K(bl){return(bl==="$")||(bl==="_")||(bl==="\\")||(bl>="a"&&bl<="z")||(bl>="A"&&bl<="Z")||((bl.charCodeAt(0)>=128)&&bb.NonAsciiIdentifierStart.test(bl))
}function bd(bl){return(bl==="$")||(bl==="_")||(bl==="\\")||(bl>="a"&&bl<="z")||(bl>="A"&&bl<="Z")||((bl>="0")&&(bl<="9"))||((bl.charCodeAt(0)>=128)&&bb.NonAsciiIdentifierPart.test(bl))
}function J(bl){switch(bl){case"class":case"enum":case"export":case"extends":case"import":case"super":return true
}return false
}function i(bl){switch(bl){case"implements":case"interface":case"package":case"private":case"protected":case"public":case"static":case"yield":case"let":return true
}return false
}function an(bl){return bl==="eval"||bl==="arguments"
}function g(bm){var bl=false;
switch(bm.length){case 2:bl=(bm==="if")||(bm==="in")||(bm==="do");
break;
case 3:bl=(bm==="var")||(bm==="for")||(bm==="new")||(bm==="try");
break;
case 4:bl=(bm==="this")||(bm==="else")||(bm==="case")||(bm==="void")||(bm==="with");
break;
case 5:bl=(bm==="while")||(bm==="break")||(bm==="catch")||(bm==="throw");
break;
case 6:bl=(bm==="return")||(bm==="typeof")||(bm==="delete")||(bm==="switch");
break;
case 7:bl=(bm==="default")||(bm==="finally");
break;
case 8:bl=(bm==="function")||(bm==="continue")||(bm==="debugger");
break;
case 10:bl=(bm==="instanceof");
break
}if(bl){return true
}switch(bm){case"const":return true;
case"yield":case"let":return true
}if(s&&i(bm)){return true
}return J(bm)
}function X(){return a7[a9++]
}function aq(){var bl,bm,bn;
bm=false;
bn=false;
while(a9<o){bl=a7[a9];
if(bn){bl=X();
if(ba(bl)){bn=false;
if(bl==="\r"&&a7[a9]==="\n"){++a9
}++az;
bg=a9
}}else{if(bm){if(ba(bl)){if(bl==="\r"&&a7[a9+1]==="\n"){++a9
}++az;
++a9;
bg=a9;
if(a9>=o){a5({},ao.UnexpectedToken,"ILLEGAL")
}}else{bl=X();
if(a9>=o){a5({},ao.UnexpectedToken,"ILLEGAL")
}if(bl==="*"){bl=a7[a9];
if(bl==="/"){++a9;
bm=false
}}}}else{if(bl==="/"){bl=a7[a9+1];
if(bl==="/"){a9+=2;
bn=true
}else{if(bl==="*"){a9+=2;
bm=true;
if(a9>=o){a5({},ao.UnexpectedToken,"ILLEGAL")
}}else{break
}}}else{if(bc(bl)){++a9
}else{if(ba(bl)){++a9;
if(bl==="\r"&&a7[a9]==="\n"){++a9
}++az;
bg=a9
}else{break
}}}}}}}function D(bp){var bm,bl,bn,bo=0;
bl=(bp==="u")?4:2;
for(bm=0;
bm<bl;
++bm){if(a9<o&&aP(a7[a9])){bn=X();
bo=bo*16+"0123456789abcdef".indexOf(bn.toLowerCase())
}else{return""
}}return String.fromCharCode(bo)
}function a3(){var bm,bo,bn,bl;
bm=a7[a9];
if(!K(bm)){return
}bo=a9;
if(bm==="\\"){++a9;
if(a7[a9]!=="u"){return
}++a9;
bl=a9;
bm=D("u");
if(bm){if(bm==="\\"||!K(bm)){return
}bn=bm
}else{a9=bl;
bn="u"
}}else{bn=X()
}while(a9<o){bm=a7[a9];
if(!bd(bm)){break
}if(bm==="\\"){++a9;
if(a7[a9]!=="u"){return
}++a9;
bl=a9;
bm=D("u");
if(bm){if(bm==="\\"||!bd(bm)){return
}bn+=bm
}else{a9=bl;
bn+="u"
}}else{bn+=X()
}}if(bn.length===1){return{type:aN.Identifier,value:bn,lineNumber:az,lineStart:bg,range:[bo,a9]}
}if(g(bn)){return{type:aN.Keyword,value:bn,lineNumber:az,lineStart:bg,range:[bo,a9]}
}if(bn==="null"){return{type:aN.NullLiteral,value:bn,lineNumber:az,lineStart:bg,range:[bo,a9]}
}if(bn==="true"||bn==="false"){return{type:aN.BooleanLiteral,value:bn,lineNumber:az,lineStart:bg,range:[bo,a9]}
}return{type:aN.Identifier,value:bn,lineNumber:az,lineStart:bg,range:[bo,a9]}
}function V(){var bp=a9,bo=a7[a9],bn,bm,bl;
if(bo===";"||bo==="{"||bo==="}"){++a9;
return{type:aN.Punctuator,value:bo,lineNumber:az,lineStart:bg,range:[bp,a9]}
}if(bo===","||bo==="("||bo===")"){++a9;
return{type:aN.Punctuator,value:bo,lineNumber:az,lineStart:bg,range:[bp,a9]}
}bn=a7[a9+1];
if(bo==="."&&!z(bn)){return{type:aN.Punctuator,value:X(),lineNumber:az,lineStart:bg,range:[bp,a9]}
}bm=a7[a9+2];
bl=a7[a9+3];
if(bo===">"&&bn===">"&&bm===">"){if(bl==="="){a9+=4;
return{type:aN.Punctuator,value:">>>=",lineNumber:az,lineStart:bg,range:[bp,a9]}
}}if(bo==="="&&bn==="="&&bm==="="){a9+=3;
return{type:aN.Punctuator,value:"===",lineNumber:az,lineStart:bg,range:[bp,a9]}
}if(bo==="!"&&bn==="="&&bm==="="){a9+=3;
return{type:aN.Punctuator,value:"!==",lineNumber:az,lineStart:bg,range:[bp,a9]}
}if(bo===">"&&bn===">"&&bm===">"){a9+=3;
return{type:aN.Punctuator,value:">>>",lineNumber:az,lineStart:bg,range:[bp,a9]}
}if(bo==="<"&&bn==="<"&&bm==="="){a9+=3;
return{type:aN.Punctuator,value:"<<=",lineNumber:az,lineStart:bg,range:[bp,a9]}
}if(bo===">"&&bn===">"&&bm==="="){a9+=3;
return{type:aN.Punctuator,value:">>=",lineNumber:az,lineStart:bg,range:[bp,a9]}
}if(bn==="="){if("<>=!+-*%&|^/".indexOf(bo)>=0){a9+=2;
return{type:aN.Punctuator,value:bo+bn,lineNumber:az,lineStart:bg,range:[bp,a9]}
}}if(bo===bn&&("+-<>&|".indexOf(bo)>=0)){if("+-<>&|".indexOf(bn)>=0){a9+=2;
return{type:aN.Punctuator,value:bo+bn,lineNumber:az,lineStart:bg,range:[bp,a9]}
}}if("[]<>+-*%&|^!~?:=/".indexOf(bo)>=0){return{type:aN.Punctuator,value:X(),lineNumber:az,lineStart:bg,range:[bp,a9]}
}}function l(){var bm,bn,bl;
bl=a7[a9];
B(z(bl)||(bl==="."),"Numeric literal must start with a decimal digit or a decimal point");
bn=a9;
bm="";
if(bl!=="."){bm=X();
bl=a7[a9];
if(bm==="0"){if(bl==="x"||bl==="X"){bm+=X();
while(a9<o){bl=a7[a9];
if(!aP(bl)){break
}bm+=X()
}if(bm.length<=2){a5({},ao.UnexpectedToken,"ILLEGAL")
}if(a9<o){bl=a7[a9];
if(K(bl)){a5({},ao.UnexpectedToken,"ILLEGAL")
}}return{type:aN.NumericLiteral,value:parseInt(bm,16),lineNumber:az,lineStart:bg,range:[bn,a9]}
}else{if(ab(bl)){bm+=X();
while(a9<o){bl=a7[a9];
if(!ab(bl)){break
}bm+=X()
}if(a9<o){bl=a7[a9];
if(K(bl)||z(bl)){a5({},ao.UnexpectedToken,"ILLEGAL")
}}return{type:aN.NumericLiteral,value:parseInt(bm,8),octal:true,lineNumber:az,lineStart:bg,range:[bn,a9]}
}}if(z(bl)){a5({},ao.UnexpectedToken,"ILLEGAL")
}}while(a9<o){bl=a7[a9];
if(!z(bl)){break
}bm+=X()
}}if(bl==="."){bm+=X();
while(a9<o){bl=a7[a9];
if(!z(bl)){break
}bm+=X()
}}if(bl==="e"||bl==="E"){bm+=X();
bl=a7[a9];
if(bl==="+"||bl==="-"){bm+=X()
}bl=a7[a9];
if(z(bl)){bm+=X();
while(a9<o){bl=a7[a9];
if(!z(bl)){break
}bm+=X()
}}else{bl="character "+bl;
if(a9>=o){bl="<end>"
}a5({},ao.UnexpectedToken,"ILLEGAL")
}}if(a9<o){bl=a7[a9];
if(K(bl)){a5({},ao.UnexpectedToken,"ILLEGAL")
}}return{type:aN.NumericLiteral,value:parseFloat(bm),lineNumber:az,lineStart:bg,range:[bn,a9]}
}function ax(){var br="",bm,bs,bo,bp,bq,bn,bl=false;
bm=a7[a9];
B((bm==="'"||bm==='"'),"String literal must starts with a quote");
bs=a9;
++a9;
while(a9<o){bo=X();
if(bo===bm){bm="";
break
}else{if(bo==="\\"){bo=X();
if(!ba(bo)){switch(bo){case"n":br+="\n";
break;
case"r":br+="\r";
break;
case"t":br+="\t";
break;
case"u":case"x":bn=a9;
bq=D(bo);
if(bq){br+=bq
}else{a9=bn;
br+=bo
}break;
case"b":br+="\b";
break;
case"f":br+="\f";
break;
case"v":br+="\v";
break;
default:if(ab(bo)){bp="01234567".indexOf(bo);
if(bp!==0){bl=true
}if(a9<o&&ab(a7[a9])){bl=true;
bp=bp*8+"01234567".indexOf(X());
if("0123".indexOf(bo)>=0&&a9<o&&ab(a7[a9])){bp=bp*8+"01234567".indexOf(X())
}}br+=String.fromCharCode(bp)
}else{br+=bo
}break
}}else{++az;
if(bo==="\r"&&a7[a9]==="\n"){++a9
}}}else{if(ba(bo)){break
}else{br+=bo
}}}}if(bm!==""){a5({},ao.UnexpectedToken,"ILLEGAL")
}return{type:aN.StringLiteral,value:br,octal:bl,lineNumber:az,lineStart:bg,range:[bs,a9]}
}function q(){var br="",bl,bm,bp,bn,bt,bs=false,bq;
aJ=null;
aq();
bm=a9;
bl=a7[a9];
B(bl==="/","Regular expression literal must start with a slash");
br=X();
while(a9<o){bl=X();
br+=bl;
if(bs){if(bl==="]"){bs=false
}}else{if(bl==="\\"){bl=X();
if(ba(bl)){a5({},ao.UnterminatedRegExp)
}br+=bl
}else{if(bl==="/"){break
}else{if(bl==="["){bs=true
}else{if(ba(bl)){a5({},ao.UnterminatedRegExp)
}}}}}}if(br.length===1){a5({},ao.UnterminatedRegExp)
}bp=br.substr(1,br.length-2);
bn="";
while(a9<o){bl=a7[a9];
if(!bd(bl)){break
}++a9;
if(bl==="\\"&&a9<o){bl=a7[a9];
if(bl==="u"){++a9;
bq=a9;
bl=D("u");
if(bl){bn+=bl;
br+="\\u";
for(;
bq<a9;
++bq){br+=a7[bq]
}}else{a9=bq;
bn+="u";
br+="\\u"
}}else{br+="\\"
}}else{bn+=bl;
br+=bl
}}try{bt=new RegExp(bp,bn)
}catch(bo){a5({},ao.InvalidRegExp)
}return{literal:br,value:bt,range:[bm,a9]}
}function aQ(bl){return bl.type===aN.Identifier||bl.type===aN.Keyword||bl.type===aN.BooleanLiteral||bl.type===aN.NullLiteral
}function ar(){var bm,bl;
aq();
if(a9>=o){return{type:aN.EOF,lineNumber:az,lineStart:bg,range:[a9,a9]}
}bl=V();
if(typeof bl!=="undefined"){return bl
}bm=a7[a9];
if(bm==="'"||bm==='"'){return ax()
}if(bm==="."||z(bm)){return l()
}bl=a3();
if(typeof bl!=="undefined"){return bl
}a5({},ao.UnexpectedToken,"ILLEGAL")
}function ay(){var bl;
if(aJ){a9=aJ.range[1];
az=aJ.lineNumber;
bg=aJ.lineStart;
bl=aJ;
aJ=null;
return bl
}aJ=null;
return ar()
}function U(){var bn,bl,bm;
if(aJ!==null){return aJ
}bn=a9;
bl=az;
bm=bg;
aJ=ar();
a9=bn;
az=bl;
bg=bm;
return aJ
}function aZ(){var bo,bl,bn,bm;
bo=a9;
bl=az;
bn=bg;
aq();
bm=az!==bl;
a9=bo;
az=bl;
bg=bn;
return bm
}function a5(bn,bp){var bm,bl=Array.prototype.slice.call(arguments,2),bo=bp.replace(/%(\d)/g,function(br,bq){return bl[bq]||""
});
if(typeof bn.lineNumber==="number"){bm=new Error("Line "+bn.lineNumber+": "+bo);
bm.index=bn.range[0];
bm.lineNumber=bn.lineNumber;
bm.column=bn.range[0]-bg+1
}else{bm=new Error("Line "+az+": "+bo);
bm.index=a9;
bm.lineNumber=az;
bm.column=a9-bg+1
}throw bm
}function aV(){var bl;
try{a5.apply(null,arguments)
}catch(bm){if(ag.errors){ag.errors.push(bm)
}else{throw bm
}}}function E(bl){var bm;
if(bl.type===aN.EOF){a5(bl,ao.UnexpectedEOS)
}if(bl.type===aN.NumericLiteral){a5(bl,ao.UnexpectedNumber)
}if(bl.type===aN.StringLiteral){a5(bl,ao.UnexpectedString)
}if(bl.type===aN.Identifier){a5(bl,ao.UnexpectedIdentifier)
}if(bl.type===aN.Keyword){if(J(bl.value)){a5(bl,ao.UnexpectedReserved)
}else{if(s&&i(bl.value)){a5(bl,ao.StrictReservedWord)
}}a5(bl,ao.UnexpectedToken,bl.value)
}a5(bl,ao.UnexpectedToken,bl.value)
}function H(bm){var bl=ay();
if(bl.type!==aN.Punctuator||bl.value!==bm){E(bl)
}}function aW(bl){var bm=ay();
if(bm.type!==aN.Keyword||bm.value!==bl){E(bm)
}}function aM(bm){var bl=U();
return bl.type===aN.Punctuator&&bl.value===bm
}function aU(bl){var bm=U();
return bm.type===aN.Keyword&&bm.value===bl
}function M(){var bl=U(),bm=bl.value;
if(bl.type!==aN.Punctuator){return false
}return bm==="="||bm==="*="||bm==="/="||bm==="%="||bm==="+="||bm==="-="||bm==="<<="||bm===">>="||bm===">>>="||bm==="&="||bm==="^="||bm==="|="
}function f(){var bm,bl;
if(a7[a9]===";"){ay();
return
}bl=az;
aq();
if(az!==bl){return
}if(aM(";")){ay();
return
}bm=U();
if(bm.type!==aN.EOF&&!aM("}")){E(bm)
}return
}function m(bl){return bl.type===bj.Identifier||bl.type===bj.MemberExpression
}function O(){var bm=[],bl;
H("[");
while(!aM("]")){if(aM(",")){ay();
bm.push(bl)
}else{bm.push(n());
if(!aM("]")){H(",")
}}}H("]");
return{type:bj.ArrayExpression,elements:bm}
}function aL(bo,bn){var bm,bl;
bm=s;
bl=F();
if(bn&&s&&an(bo[0].name)){a5(bn,ao.StrictParamName)
}s=bm;
return{type:bj.FunctionExpression,id:null,params:bo,body:bl}
}function R(){var bl=ay();
if(bl.type===aN.StringLiteral||bl.type===aN.NumericLiteral){if(s&&bl.octal){a5(bl,ao.StrictOctalLiteral)
}return at(bl)
}return{type:bj.Identifier,name:bl.value}
}function aR(){var bm,bl,bo,bn;
bm=U();
if(bm.type===aN.Identifier){bo=R();
if(bm.value==="get"&&!aM(":")){bl=R();
H("(");
H(")");
return{type:bj.Property,key:bl,value:aL([]),kind:"get"}
}else{if(bm.value==="set"&&!aM(":")){bl=R();
H("(");
bm=U();
if(bm.type!==aN.Identifier){E(ay())
}bn=[Q()];
H(")");
return{type:bj.Property,key:bl,value:aL(bn,bm),kind:"set"}
}else{H(":");
return{type:bj.Property,key:bo,value:n(),kind:"init"}
}}}else{if(bm.type===aN.EOF||bm.type===aN.Punctuator){E(bm)
}else{bl=R();
H(":");
return{type:bj.Property,key:bl,value:n(),kind:"init"}
}}}function bi(){var bn,bm=[],bp,bl,bo,br={},bq=String;
H("{");
while(!aM("}")){bp=aR();
if(bp.key.type===bj.Identifier){bl=bp.key.name
}else{bl=bq(bp.key.value)
}bo=(bp.kind==="init")?aK.Data:(bp.kind==="get")?aK.Get:aK.Set;
if(Object.prototype.hasOwnProperty.call(br,bl)){if(br[bl]===aK.Data){if(s&&bo===aK.Data){aV({},ao.StrictDuplicateProperty)
}else{if(bo!==aK.Data){a5({},ao.AccessorDataProperty)
}}}else{if(bo===aK.Data){a5({},ao.AccessorDataProperty)
}else{if(br[bl]&bo){a5({},ao.AccessorGetSet)
}}}br[bl]|=bo
}else{br[bl]=bo
}bm.push(bp);
if(!aM("}")){H(",")
}}H("}");
return{type:bj.ObjectExpression,properties:bm}
}function b(){var bn,bl=U(),bm=bl.type;
if(bm===aN.Identifier){return{type:bj.Identifier,name:ay().value}
}if(bm===aN.StringLiteral||bm===aN.NumericLiteral){if(s&&bl.octal){aV(bl,ao.StrictOctalLiteral)
}return at(ay())
}if(bm===aN.Keyword){if(aU("this")){ay();
return{type:bj.ThisExpression}
}if(aU("function")){return T()
}}if(bm===aN.BooleanLiteral){ay();
bl.value=(bl.value==="true");
return at(bl)
}if(bm===aN.NullLiteral){ay();
bl.value=null;
return at(bl)
}if(aM("[")){return O()
}if(aM("{")){return bi()
}if(aM("(")){ay();
bh.lastParenthesized=bn=af();
H(")");
return bn
}if(aM("/")||aM("/=")){return at(q())
}return E(ay())
}function x(){var bl=[];
H("(");
if(!aM(")")){while(a9<o){bl.push(n());
if(aM(")")){break
}H(",")
}}H(")");
return bl
}function N(){var bl=ay();
if(!aQ(bl)){E(bl)
}return{type:bj.Identifier,name:bl.value}
}function W(bl){return{type:bj.MemberExpression,computed:false,object:bl,property:N()}
}function w(bl){var bm,bn;
H("[");
bm=af();
bn={type:bj.MemberExpression,computed:true,object:bl,property:bm};
H("]");
return bn
}function Y(bl){return{type:bj.CallExpression,callee:bl,"arguments":x()}
}function y(){var bl;
aW("new");
bl={type:bj.NewExpression,callee:h(),"arguments":[]};
if(aM("(")){bl["arguments"]=x()
}return bl
}function aE(){var bm,bl;
bm=aU("new");
bl=bm?y():b();
while(a9<o){if(aM(".")){ay();
bl=W(bl)
}else{if(aM("[")){bl=w(bl)
}else{if(aM("(")){bl=Y(bl)
}else{break
}}}}return bl
}function h(){var bm,bl;
bm=aU("new");
bl=bm?y():b();
while(a9<o){if(aM(".")){ay();
bl=W(bl)
}else{if(aM("[")){bl=w(bl)
}else{break
}}}return bl
}function bk(){var bl=aE();
if((aM("++")||aM("--"))&&!aZ()){if(s&&bl.type===bj.Identifier&&an(bl.name)){a5({},ao.StrictLHSPostfix)
}if(!m(bl)){a5({},ao.InvalidLHSInAssignment)
}bl={type:bj.UpdateExpression,operator:ay().value,argument:bl,prefix:false}
}return bl
}function ai(){var bl,bm;
if(aM("++")||aM("--")){bl=ay();
bm=ai();
if(s&&bm.type===bj.Identifier&&an(bm.name)){a5({},ao.StrictLHSPrefix)
}if(!m(bm)){a5({},ao.InvalidLHSInAssignment)
}bm={type:bj.UpdateExpression,operator:bl.value,argument:bm,prefix:true};
return bm
}if(aM("+")||aM("-")||aM("~")||aM("!")){bm={type:bj.UnaryExpression,operator:ay().value,argument:ai()};
return bm
}if(aU("delete")||aU("void")||aU("typeof")){bm={type:bj.UnaryExpression,operator:ay().value,argument:ai()};
if(s&&bm.operator==="delete"&&bm.argument.type===bj.Identifier){aV({},ao.StrictDelete)
}return bm
}return bk()
}function aY(){var bl=ai();
while(aM("*")||aM("/")||aM("%")){bl={type:bj.BinaryExpression,operator:ay().value,left:bl,right:ai()}
}return bl
}function k(){var bl=aY();
while(aM("+")||aM("-")){bl={type:bj.BinaryExpression,operator:ay().value,left:bl,right:aY()}
}return bl
}function c(){var bl=k();
while(aM("<<")||aM(">>")||aM(">>>")){bl={type:bj.BinaryExpression,operator:ay().value,left:bl,right:k()}
}return bl
}function t(){var bl,bm;
bm=bh.allowIn;
bh.allowIn=true;
bl=c();
bh.allowIn=bm;
if(aM("<")||aM(">")||aM("<=")||aM(">=")){bl={type:bj.BinaryExpression,operator:ay().value,left:bl,right:t()}
}else{if(bh.allowIn&&aU("in")){ay();
bl={type:bj.BinaryExpression,operator:"in",left:bl,right:t()}
}else{if(aU("instanceof")){ay();
bl={type:bj.BinaryExpression,operator:"instanceof",left:bl,right:t()}
}}}return bl
}function aB(){var bl=t();
while(aM("==")||aM("!=")||aM("===")||aM("!==")){bl={type:bj.BinaryExpression,operator:ay().value,left:bl,right:t()}
}return bl
}function aS(){var bl=aB();
while(aM("&")){ay();
bl={type:bj.BinaryExpression,operator:"&",left:bl,right:aB()}
}return bl
}function p(){var bl=aS();
while(aM("^")){ay();
bl={type:bj.BinaryExpression,operator:"^",left:bl,right:aS()}
}return bl
}function ae(){var bl=p();
while(aM("|")){ay();
bl={type:bj.BinaryExpression,operator:"|",left:bl,right:p()}
}return bl
}function a8(){var bl=ae();
while(aM("&&")){ay();
bl={type:bj.LogicalExpression,operator:"&&",left:bl,right:ae()}
}return bl
}function r(){var bl=a8();
while(aM("||")){ay();
bl={type:bj.LogicalExpression,operator:"||",left:bl,right:a8()}
}return bl
}function L(){var bm,bn,bl;
bm=r();
if(aM("?")){ay();
bn=bh.allowIn;
bh.allowIn=true;
bl=n();
bh.allowIn=bn;
H(":");
bm={type:bj.ConditionalExpression,test:bm,consequent:bl,alternate:n()}
}return bm
}function n(){var bl;
bl=L();
if(M()){if(!m(bl)){a5({},ao.InvalidLHSInAssignment)
}if(s&&bl.type===bj.Identifier&&an(bl.name)){a5({},ao.StrictLHSAssignment)
}bl={type:bj.AssignmentExpression,operator:ay().value,left:bl,right:n()}
}return bl
}function af(){var bl=n();
if(aM(",")){bl={type:bj.SequenceExpression,expressions:[bl]};
while(a9<o){if(!aM(",")){break
}ay();
bl.expressions.push(n())
}}return bl
}function aj(){var bm=[],bl;
while(a9<o){if(aM("}")){break
}bl=ak();
if(typeof bl==="undefined"){break
}bm.push(bl)
}return bm
}function ad(){var bl;
H("{");
bl=aj();
H("}");
return{type:bj.BlockStatement,body:bl}
}function Q(){var bl=ay();
if(bl.type!==aN.Identifier){E(bl)
}return{type:bj.Identifier,name:bl.value}
}function be(bl){var bn=Q(),bm=null;
if(s&&an(bn.name)){aV({},ao.StrictVarName)
}if(bl==="const"){H("=");
bm=n()
}else{if(aM("=")){ay();
bm=n()
}}return{type:bj.VariableDeclarator,id:bn,init:bm}
}function aa(bl){var bm=[];
while(a9<o){bm.push(be(bl));
if(!aM(",")){break
}ay()
}return bm
}function a4(){var bl;
aW("var");
bl=aa();
f();
return{type:bj.VariableDeclaration,declarations:bl,kind:"var"}
}function C(bl){var bm;
aW(bl);
bm=aa(bl);
f();
return{type:bj.VariableDeclaration,declarations:bm,kind:bl}
}function a(){H(";");
return{type:bj.EmptyStatement}
}function v(){var bl=af();
f();
return{type:bj.ExpressionStatement,expression:bl}
}function I(){var bn,bl,bm;
aW("if");
H("(");
bn=af();
H(")");
bl=ac();
if(aU("else")){ay();
bm=ac()
}else{bm=null
}return{type:bj.IfStatement,test:bn,consequent:bl,alternate:bm}
}function aG(){var bl,bn,bm;
aW("do");
bm=bh.inIteration;
bh.inIteration=true;
bl=ac();
bh.inIteration=bm;
aW("while");
H("(");
bn=af();
H(")");
if(aM(";")){ay()
}return{type:bj.DoWhileStatement,body:bl,test:bn}
}function P(){var bn,bl,bm;
aW("while");
H("(");
bn=af();
H(")");
bm=bh.inIteration;
bh.inIteration=true;
bl=ac();
bh.inIteration=bm;
return{type:bj.WhileStatement,test:bn,body:bl}
}function Z(){var bl=ay();
return{type:bj.VariableDeclaration,declarations:aa(),kind:bl.value}
}function a1(){var bp,br,bq,bo,bn,bl,bm;
bp=br=bq=null;
aW("for");
H("(");
if(aM(";")){ay()
}else{if(aU("var")||aU("let")){bh.allowIn=false;
bp=Z();
bh.allowIn=true;
if(bp.declarations.length===1&&aU("in")){ay();
bo=bp;
bn=af();
bp=null
}}else{bh.allowIn=false;
bp=af();
bh.allowIn=true;
if(aU("in")){if(!m(bp)){a5({},ao.InvalidLHSInForIn)
}ay();
bo=bp;
bn=af();
bp=null
}}if(typeof bo==="undefined"){H(";")
}}if(typeof bo==="undefined"){if(!aM(";")){br=af()
}H(";");
if(!aM(")")){bq=af()
}}H(")");
bm=bh.inIteration;
bh.inIteration=true;
bl=ac();
bh.inIteration=bm;
if(typeof bo==="undefined"){return{type:bj.ForStatement,init:bp,test:br,update:bq,body:bl}
}return{type:bj.ForInStatement,left:bo,right:bn,body:bl,each:false}
}function G(){var bm,bl=null;
aW("continue");
if(a7[a9]===";"){ay();
if(!bh.inIteration){a5({},ao.IllegalContinue)
}return{type:bj.ContinueStatement,label:null}
}if(aZ()){if(!bh.inIteration){a5({},ao.IllegalContinue)
}return{type:bj.ContinueStatement,label:null}
}bm=U();
if(bm.type===aN.Identifier){bl=Q();
if(!Object.prototype.hasOwnProperty.call(bh.labelSet,bl.name)){a5({},ao.UnknownLabel,bl.name)
}}f();
if(bl===null&&!bh.inIteration){a5({},ao.IllegalContinue)
}return{type:bj.ContinueStatement,label:bl}
}function e(){var bm,bl=null;
aW("break");
if(a7[a9]===";"){ay();
if(!(bh.inIteration||bh.inSwitch)){a5({},ao.IllegalBreak)
}return{type:bj.BreakStatement,label:null}
}if(aZ()){if(!(bh.inIteration||bh.inSwitch)){a5({},ao.IllegalBreak)
}return{type:bj.BreakStatement,label:null}
}bm=U();
if(bm.type===aN.Identifier){bl=Q();
if(!Object.prototype.hasOwnProperty.call(bh.labelSet,bl.name)){a5({},ao.UnknownLabel,bl.name)
}}f();
if(bl===null&&!(bh.inIteration||bh.inSwitch)){a5({},ao.IllegalBreak)
}return{type:bj.BreakStatement,label:bl}
}function aH(){var bl,bm=null;
aW("return");
if(!bh.inFunctionBody){aV({},ao.IllegalReturn)
}if(a7[a9]===" "){if(K(a7[a9+1])){bm=af();
f();
return{type:bj.ReturnStatement,argument:bm}
}}if(aZ()){return{type:bj.ReturnStatement,argument:null}
}if(!aM(";")){bl=U();
if(!aM("}")&&bl.type!==aN.EOF){bm=af()
}}f();
return{type:bj.ReturnStatement,argument:bm}
}function aT(){var bm,bl;
if(s){aV({},ao.StrictModeWith)
}aW("with");
H("(");
bm=af();
H(")");
bl=ac();
return{type:bj.WithStatement,object:bm,body:bl}
}function a6(){var bn,bm=[],bl;
if(aU("default")){ay();
bn=null
}else{aW("case");
bn=af()
}H(":");
while(a9<o){if(aM("}")||aU("default")||aU("case")){break
}bl=ac();
if(typeof bl==="undefined"){break
}bm.push(bl)
}return{type:bj.SwitchCase,test:bn,consequent:bm}
}function u(){var bm,bn,bl;
aW("switch");
H("(");
bm=af();
H(")");
H("{");
if(aM("}")){ay();
return{type:bj.SwitchStatement,discriminant:bm}
}bn=[];
bl=bh.inSwitch;
bh.inSwitch=true;
while(a9<o){if(aM("}")){break
}bn.push(a6())
}bh.inSwitch=bl;
H("}");
return{type:bj.SwitchStatement,discriminant:bm,cases:bn}
}function aI(){var bl;
aW("throw");
if(aZ()){a5({},ao.NewlineAfterThrow)
}bl=af();
f();
return{type:bj.ThrowStatement,argument:bl}
}function d(){var bl;
aW("catch");
H("(");
if(!aM(")")){bl=af();
if(s&&bl.type===bj.Identifier&&an(bl.name)){aV({},ao.StrictCatchVariable)
}}H(")");
return{type:bj.CatchClause,param:bl,guard:null,body:ad()}
}function j(){var bn,bl=[],bm=null;
aW("try");
bn=ad();
if(aU("catch")){bl.push(d())
}if(aU("finally")){ay();
bm=ad()
}if(bl.length===0&&!bm){a5({},ao.NoCatchOrFinally)
}return{type:bj.TryStatement,block:bn,handlers:bl,finalizer:bm}
}function am(){aW("debugger");
f();
return{type:bj.DebuggerStatement}
}function ac(){var bm=U(),bn,bl;
if(bm.type===aN.EOF){E(bm)
}if(bm.type===aN.Punctuator){switch(bm.value){case";":return a();
case"{":return ad();
case"(":return v();
default:break
}}if(bm.type===aN.Keyword){switch(bm.value){case"break":return e();
case"continue":return G();
case"debugger":return am();
case"do":return aG();
case"for":return a1();
case"function":return aw();
case"if":return I();
case"return":return aH();
case"switch":return u();
case"throw":return aI();
case"try":return j();
case"var":return a4();
case"while":return P();
case"with":return aT();
default:break
}}bn=af();
if((bn.type===bj.Identifier)&&aM(":")){ay();
if(Object.prototype.hasOwnProperty.call(bh.labelSet,bn.name)){a5({},ao.Redeclaration,"Label",bn.name)
}bh.labelSet[bn.name]=true;
bl=ac();
delete bh.labelSet[bn.name];
return{type:bj.LabeledStatement,label:bn,body:bl}
}f();
return{type:bj.ExpressionStatement,expression:bn}
}function F(){var bl,bm=[],bn,br,bo,bq,bp,bt,bs;
H("{");
while(a9<o){bn=U();
if(bn.type!==aN.StringLiteral){break
}bl=ak();
bm.push(bl);
if(bl.expression.type!==bj.Literal){break
}br=a2(bn.range[0]+1,bn.range[1]-1);
if(br==="use strict"){s=true;
if(bo){a5(bo,ao.StrictOctalLiteral)
}}else{if(!bo&&bn.octal){bo=bn
}}}bq=bh.labelSet;
bp=bh.inIteration;
bt=bh.inSwitch;
bs=bh.inFunctionBody;
bh.labelSet={};
bh.inIteration=false;
bh.inSwitch=false;
bh.inFunctionBody=true;
while(a9<o){if(aM("}")){break
}bl=ak();
if(typeof bl==="undefined"){break
}bm.push(bl)
}H("}");
bh.labelSet=bq;
bh.inIteration=bp;
bh.inSwitch=bt;
bh.inFunctionBody=bs;
return{type:bj.BlockStatement,body:bm}
}function aw(){var bl,bn,bp=[],bs,bo,br,bt,bm,bq;
aW("function");
bo=U();
bl=Q();
if(s){if(an(bo.value)){a5(bo,ao.StrictFunctionName)
}}else{if(an(bo.value)){br=bo;
bt=ao.StrictFunctionName
}else{if(i(bo.value)){br=bo;
bt=ao.StrictReservedWord
}}}H("(");
if(!aM(")")){bq={};
while(a9<o){bo=U();
bn=Q();
if(s){if(an(bo.value)){a5(bo,ao.StrictParamName)
}if(Object.prototype.hasOwnProperty.call(bq,bo.value)){a5(bo,ao.StrictParamDupe)
}}else{if(!br){if(an(bo.value)){br=bo;
bt=ao.StrictParamName
}else{if(i(bo.value)){br=bo;
bt=ao.StrictReservedWord
}else{if(Object.prototype.hasOwnProperty.call(bq,bo.value)){br=bo;
bt=ao.StrictParamDupe
}}}}}bp.push(bn);
bq[bn.name]=true;
if(aM(")")){break
}H(",")
}}H(")");
bm=s;
bs=F();
if(s&&br){a5(br,bt)
}s=bm;
return{type:bj.FunctionDeclaration,id:bl,params:bp,body:bs}
}function T(){var bo,bl=null,br,bt,bn,bp=[],bs,bm,bq;
aW("function");
if(!aM("(")){bo=U();
bl=Q();
if(s){if(an(bo.value)){a5(bo,ao.StrictFunctionName)
}}else{if(an(bo.value)){br=bo;
bt=ao.StrictFunctionName
}else{if(i(bo.value)){br=bo;
bt=ao.StrictReservedWord
}}}}H("(");
if(!aM(")")){bq={};
while(a9<o){bo=U();
bn=Q();
if(s){if(an(bo.value)){a5(bo,ao.StrictParamName)
}if(Object.prototype.hasOwnProperty.call(bq,bo.value)){a5(bo,ao.StrictParamDupe)
}}else{if(!br){if(an(bo.value)){br=bo;
bt=ao.StrictParamName
}else{if(i(bo.value)){br=bo;
bt=ao.StrictReservedWord
}else{if(Object.prototype.hasOwnProperty.call(bq,bo.value)){br=bo;
bt=ao.StrictParamDupe
}}}}}bp.push(bn);
bq[bn.name]=true;
if(aM(")")){break
}H(",")
}}H(")");
bm=s;
bs=F();
if(s&&br){a5(br,bt)
}s=bm;
return{type:bj.FunctionExpression,id:bl,params:bp,body:bs}
}function ak(){var bl=U();
if(bl.type===aN.Keyword){switch(bl.value){case"const":case"let":return C(bl.value);
case"function":return aw();
default:return ac()
}}if(bl.type!==aN.EOF){return ac()
}}function S(){var bm,bl=[],bn,bp,bo;
while(a9<o){bn=U();
if(bn.type!==aN.StringLiteral){break
}bm=ak();
bl.push(bm);
if(bm.expression.type!==bj.Literal){break
}bp=a2(bn.range[0]+1,bn.range[1]-1);
if(bp==="use strict"){s=true;
if(bo){a5(bo,ao.StrictOctalLiteral)
}}else{if(!bo&&bn.octal){bo=bn
}}}while(a9<o){bm=ak();
if(typeof bm==="undefined"){break
}bl.push(bm)
}return bl
}function aX(){var bl;
s=false;
bl={type:bj.Program,body:S()};
return bl
}function a0(bo,bl,bm,bn){B(typeof bo==="number","Comment must have valid position");
if(ag.comments.length>0){if(ag.comments[ag.comments.length-1].range[1]>bo){return
}}ag.comments.push({range:[bo,bl],type:bm,value:bn})
}function aA(){var bp,bl,bo,bm,bn;
bp="";
bm=false;
bn=false;
while(a9<o){bl=a7[a9];
if(bn){bl=X();
if(a9>=o){bn=false;
bp+=bl;
a0(bo,a9,"Line",bp)
}else{if(ba(bl)){bn=false;
a0(bo,a9,"Line",bp);
if(bl==="\r"&&a7[a9]==="\n"){++a9
}++az;
bg=a9;
bp=""
}else{bp+=bl
}}}else{if(bm){if(ba(bl)){if(bl==="\r"&&a7[a9+1]==="\n"){++a9;
bp+="\r\n"
}else{bp+=bl
}++az;
++a9;
bg=a9;
if(a9>=o){a5({},ao.UnexpectedToken,"ILLEGAL")
}}else{bl=X();
if(a9>=o){a5({},ao.UnexpectedToken,"ILLEGAL")
}bp+=bl;
if(bl==="*"){bl=a7[a9];
if(bl==="/"){bp=bp.substr(0,bp.length-1);
bm=false;
++a9;
a0(bo,a9,"Block",bp);
bp=""
}}}}else{if(bl==="/"){bl=a7[a9+1];
if(bl==="/"){bo=a9;
a9+=2;
bn=true
}else{if(bl==="*"){bo=a9;
a9+=2;
bm=true;
if(a9>=o){a5({},ao.UnexpectedToken,"ILLEGAL")
}}else{break
}}}else{if(bc(bl)){++a9
}else{if(ba(bl)){++a9;
if(bl==="\r"&&a7[a9]==="\n"){++a9
}++az;
bg=a9
}else{break
}}}}}}}function au(){var bm=ag.advance(),bl,bn;
if(bm.type!==aN.EOF){bl=[bm.range[0],bm.range[1]];
bn=a2(bm.range[0],bm.range[1]);
ag.tokens.push({type:bf[bm.type],value:bn,range:bl})
}return bm
}function aO(){var bn,bm,bl;
aq();
bn=a9;
bm=ag.scanRegExp();
if(ag.tokens.length>0){bl=ag.tokens[ag.tokens.length-1];
if(bl.range[0]===bn&&bl.type==="Punctuator"){if(bl.value==="/"||bl.value==="/="){ag.tokens.pop()
}}}ag.tokens.push({type:"RegularExpression",value:bm.literal,range:[bn,a9]});
return bm
}function at(bl){return{type:bj.Literal,value:bl.value}
}function aD(bl){return{type:bj.Literal,value:bl.value,raw:a2(bl.range[0],bl.range[1])}
}function aF(bl,bm){return function(bp){function bo(bq){return bq.type===bj.LogicalExpression||bq.type===bj.BinaryExpression
}function bn(bq){if(bo(bq.left)){bn(bq.left)
}if(bo(bq.right)){bn(bq.right)
}if(bl&&typeof bq.range==="undefined"){bq.range=[bq.left.range[0],bq.right.range[1]]
}if(bm&&typeof bq.loc==="undefined"){bq.loc={start:bq.left.loc.start,end:bq.right.loc.end}
}}return function(){var bs,bq,br;
aq();
bq=[a9,0];
br={start:{line:az,column:a9-bg}};
bs=bp.apply(null,arguments);
if(typeof bs!=="undefined"){if(bl){bq[1]=a9;
bs.range=bq
}if(bm){br.end={line:az,column:a9-bg};
bs.loc=br
}if(bo(bs)){bn(bs)
}if(bs.type===bj.MemberExpression){if(typeof bs.object.range!=="undefined"){bs.range[0]=bs.object.range[0]
}if(typeof bs.object.loc!=="undefined"){bs.loc.start=bs.object.loc.start
}}return bs
}}
}
}function A(){var bl;
if(ag.comments){ag.skipComment=aq;
aq=aA
}if(ag.raw){ag.createLiteral=at;
at=aD
}if(ag.range||ag.loc){bl=aF(ag.range,ag.loc);
ag.parseAdditiveExpression=k;
ag.parseAssignmentExpression=n;
ag.parseBitwiseANDExpression=aS;
ag.parseBitwiseORExpression=ae;
ag.parseBitwiseXORExpression=p;
ag.parseBlock=ad;
ag.parseFunctionSourceElements=F;
ag.parseCallMember=Y;
ag.parseCatchClause=d;
ag.parseComputedMember=w;
ag.parseConditionalExpression=L;
ag.parseConstLetDeclaration=C;
ag.parseEqualityExpression=aB;
ag.parseExpression=af;
ag.parseForVariableDeclaration=Z;
ag.parseFunctionDeclaration=aw;
ag.parseFunctionExpression=T;
ag.parseLogicalANDExpression=a8;
ag.parseLogicalORExpression=r;
ag.parseMultiplicativeExpression=aY;
ag.parseNewExpression=y;
ag.parseNonComputedMember=W;
ag.parseNonComputedProperty=N;
ag.parseObjectProperty=aR;
ag.parseObjectPropertyKey=R;
ag.parsePostfixExpression=bk;
ag.parsePrimaryExpression=b;
ag.parseProgram=aX;
ag.parsePropertyFunction=aL;
ag.parseRelationalExpression=t;
ag.parseStatement=ac;
ag.parseShiftExpression=c;
ag.parseSwitchCase=a6;
ag.parseUnaryExpression=ai;
ag.parseVariableDeclaration=be;
ag.parseVariableIdentifier=Q;
k=bl(ag.parseAdditiveExpression);
n=bl(ag.parseAssignmentExpression);
aS=bl(ag.parseBitwiseANDExpression);
ae=bl(ag.parseBitwiseORExpression);
p=bl(ag.parseBitwiseXORExpression);
ad=bl(ag.parseBlock);
F=bl(ag.parseFunctionSourceElements);
Y=bl(ag.parseCallMember);
d=bl(ag.parseCatchClause);
w=bl(ag.parseComputedMember);
L=bl(ag.parseConditionalExpression);
C=bl(ag.parseConstLetDeclaration);
aB=bl(ag.parseEqualityExpression);
af=bl(ag.parseExpression);
Z=bl(ag.parseForVariableDeclaration);
aw=bl(ag.parseFunctionDeclaration);
T=bl(ag.parseFunctionExpression);
a8=bl(ag.parseLogicalANDExpression);
r=bl(ag.parseLogicalORExpression);
aY=bl(ag.parseMultiplicativeExpression);
y=bl(ag.parseNewExpression);
W=bl(ag.parseNonComputedMember);
N=bl(ag.parseNonComputedProperty);
aR=bl(ag.parseObjectProperty);
R=bl(ag.parseObjectPropertyKey);
bk=bl(ag.parsePostfixExpression);
b=bl(ag.parsePrimaryExpression);
aX=bl(ag.parseProgram);
aL=bl(ag.parsePropertyFunction);
t=bl(ag.parseRelationalExpression);
ac=bl(ag.parseStatement);
c=bl(ag.parseShiftExpression);
a6=bl(ag.parseSwitchCase);
ai=bl(ag.parseUnaryExpression);
be=bl(ag.parseVariableDeclaration);
Q=bl(ag.parseVariableIdentifier)
}if(typeof ag.tokens!=="undefined"){ag.advance=ar;
ag.scanRegExp=q;
ar=au;
q=aO
}}function al(){if(typeof ag.skipComment==="function"){aq=ag.skipComment
}if(ag.raw){at=ag.createLiteral
}if(ag.range||ag.loc){k=ag.parseAdditiveExpression;
n=ag.parseAssignmentExpression;
aS=ag.parseBitwiseANDExpression;
ae=ag.parseBitwiseORExpression;
p=ag.parseBitwiseXORExpression;
ad=ag.parseBlock;
F=ag.parseFunctionSourceElements;
Y=ag.parseCallMember;
d=ag.parseCatchClause;
w=ag.parseComputedMember;
L=ag.parseConditionalExpression;
C=ag.parseConstLetDeclaration;
aB=ag.parseEqualityExpression;
af=ag.parseExpression;
Z=ag.parseForVariableDeclaration;
aw=ag.parseFunctionDeclaration;
T=ag.parseFunctionExpression;
a8=ag.parseLogicalANDExpression;
r=ag.parseLogicalORExpression;
aY=ag.parseMultiplicativeExpression;
y=ag.parseNewExpression;
W=ag.parseNonComputedMember;
N=ag.parseNonComputedProperty;
aR=ag.parseObjectProperty;
R=ag.parseObjectPropertyKey;
b=ag.parsePrimaryExpression;
bk=ag.parsePostfixExpression;
aX=ag.parseProgram;
aL=ag.parsePropertyFunction;
t=ag.parseRelationalExpression;
ac=ag.parseStatement;
c=ag.parseShiftExpression;
a6=ag.parseSwitchCase;
ai=ag.parseUnaryExpression;
be=ag.parseVariableDeclaration;
Q=ag.parseVariableIdentifier
}if(typeof ag.scanRegExp==="function"){ar=ag.advance;
q=ag.scanRegExp
}}function av(bo){var bn=bo.length,bl=[],bm;
for(bm=0;
bm<bn;
++bm){bl[bm]=bo.charAt(bm)
}return bl
}function aC(bn,bm){var bl,bp;
bp=String;
if(typeof bn!=="string"&&!(bn instanceof String)){bn=bp(bn)
}a7=bn;
a9=0;
az=(a7.length>0)?1:0;
bg=0;
o=a7.length;
aJ=null;
bh={allowIn:true,labelSet:{},lastParenthesized:null,inFunctionBody:false,inIteration:false,inSwitch:false};
ag={};
if(typeof bm!=="undefined"){ag.range=(typeof bm.range==="boolean")&&bm.range;
ag.loc=(typeof bm.loc==="boolean")&&bm.loc;
ag.raw=(typeof bm.raw==="boolean")&&bm.raw;
if(typeof bm.tokens==="boolean"&&bm.tokens){ag.tokens=[]
}if(typeof bm.comment==="boolean"&&bm.comment){ag.comments=[]
}if(typeof bm.tolerant==="boolean"&&bm.tolerant){ag.errors=[]
}}if(o>0){if(typeof a7[0]==="undefined"){if(bn instanceof String){a7=bn.valueOf()
}if(typeof a7[0]==="undefined"){a7=av(bn)
}}}A();
try{bl=aX();
if(typeof ag.comments!=="undefined"){bl.comments=ag.comments
}if(typeof ag.tokens!=="undefined"){bl.tokens=ag.tokens
}if(typeof ag.errors!=="undefined"){bl.errors=ag.errors
}}catch(bo){throw bo
}finally{al();
ag={}
}return bl
}ah.version="1.0.0-dev";
ah.parse=aC;
ah.Syntax=(function(){var bl,bm={};
if(typeof Object.create==="function"){bm=Object.create(null)
}for(bl in bj){if(bj.hasOwnProperty(bl)){bm[bl]=bj[bl]
}}if(typeof Object.freeze==="function"){Object.freeze(bm)
}return bm
}())
}(typeof exports==="undefined"?(esprima={}):exports));