(function(t){var o,l,q,i,k,b,m;
o={AssignmentExpression:"AssignmentExpression",ArrayExpression:"ArrayExpression",BlockStatement:"BlockStatement",BinaryExpression:"BinaryExpression",BreakStatement:"BreakStatement",CallExpression:"CallExpression",CatchClause:"CatchClause",ConditionalExpression:"ConditionalExpression",ContinueStatement:"ContinueStatement",DoWhileStatement:"DoWhileStatement",DebuggerStatement:"DebuggerStatement",EmptyStatement:"EmptyStatement",ExpressionStatement:"ExpressionStatement",ForStatement:"ForStatement",ForInStatement:"ForInStatement",FunctionDeclaration:"FunctionDeclaration",FunctionExpression:"FunctionExpression",Identifier:"Identifier",IfStatement:"IfStatement",Literal:"Literal",LabeledStatement:"LabeledStatement",LogicalExpression:"LogicalExpression",MemberExpression:"MemberExpression",NewExpression:"NewExpression",ObjectExpression:"ObjectExpression",Program:"Program",Property:"Property",ReturnStatement:"ReturnStatement",SequenceExpression:"SequenceExpression",SwitchStatement:"SwitchStatement",SwitchCase:"SwitchCase",ThisExpression:"ThisExpression",ThrowStatement:"ThrowStatement",TryStatement:"TryStatement",UnaryExpression:"UnaryExpression",UpdateExpression:"UpdateExpression",VariableDeclaration:"VariableDeclaration",VariableDeclarator:"VariableDeclarator",WhileStatement:"WhileStatement",WithStatement:"WithStatement"};
l={Sequence:0,Assignment:1,Conditional:2,LogicalOR:3,LogicalAND:4,LogicalXOR:5,BitwiseOR:6,BitwiseAND:7,Equality:8,Relational:9,BitwiseSHIFT:10,Additive:11,Multiplicative:12,Unary:13,Postfix:14,Call:15,New:16,Member:17,Primary:18};
q={"||":l.LogicalOR,"&&":l.LogicalAND,"^":l.LogicalXOR,"|":l.BitwiseOR,"&":l.BitwiseAND,"==":l.Equality,"!=":l.Equality,"===":l.Equality,"!==":l.Equality,"<":l.Relational,">":l.Relational,"<=":l.Relational,">=":l.Relational,"in":l.Relational,"instanceof":l.Relational,"<<":l.BitwiseSHIFT,">>":l.BitwiseSHIFT,">>>":l.BitwiseSHIFT,"+":l.Additive,"-":l.Additive,"*":l.Multiplicative,"%":l.Multiplicative,"/":l.Multiplicative};
function j(){return{indent:null,base:null,parse:null,format:{indent:{style:"    ",base:0}}}
}function p(x){var v,w;
v=x.charCodeAt(0).toString(16);
for(w=v.length;
w<4;
w+=1){v="0"+v
}return"\\u"+v
}function g(y){var x=y.length,v=[],w;
for(w=0;
w<x;
w+=1){v[w]=y.charAt(w)
}return v
}function f(x,w){var v="";
for(w|=0;
w>0;
w>>>=1,x+=x){if(w&1){v+=x
}}return v
}function d(y,x){var w,z;
function v(A){return typeof A==="object"&&A instanceof Object&&!(A instanceof RegExp)
}for(w in x){if(x.hasOwnProperty(w)){z=x[w];
if(v(z)){if(v(y[w])){d(y[w],z)
}else{y[w]=d({},z)
}}else{y[w]=z
}}}return y
}function s(z){var w="",x,v,y;
if(typeof z[0]==="undefined"){z=g(z)
}for(x=0,v=z.length;
x<v;
x+=1){y=z[x];
if("'\\\b\f\n\r\t".indexOf(y)>=0){w+="\\";
switch(y){case"'":w+="'";
break;
case"\\":w+="\\";
break;
case"\b":w+="b";
break;
case"\f":w+="f";
break;
case"\n":w+="n";
break;
case"\r":w+="r";
break;
case"\t":w+="t";
break
}}else{if(y<" "||y.charCodeAt(0)>=128){w+=p(y)
}else{w+=y
}}}return"'"+w+"'"
}function a(v){return i+v
}function h(x,w,v){return(w<v)?"("+x+")":x
}function r(x,y){var w,v;
if(x.type===o.BlockStatement){v=" "+c(x);
if(y){return v+" "
}return v
}if(x.type===o.EmptyStatement){v=";"
}else{w=i;
i+=k;
v="\n"+a(c(x));
i=w
}if(y){return v+"\n"+a("")
}return v
}function e(y){var w,x,v;
w="(";
for(x=0,v=y.params.length;
x<v;
x+=1){w+=y.params[x].name;
if((x+1)<v){w+=", "
}}return w+")"+r(y.body)
}function u(B,v){var D,w,A,x,y,C;
if(!v){v=l.Sequence
}switch(B.type){case o.SequenceExpression:D="";
for(x=0,y=B.expressions.length;
x<y;
x+=1){D+=u(B.expressions[x],l.Assignment);
if((x+1)<y){D+=", "
}}D=h(D,l.Sequence,v);
break;
case o.AssignmentExpression:D=h(u(B.left,l.Call)+" "+B.operator+" "+u(B.right,l.Assignment),l.Assignment,v);
break;
case o.ConditionalExpression:D=h(u(B.test,l.LogicalOR)+" ? "+u(B.consequent,l.Assignment)+" : "+u(B.alternate,l.Assignment),l.Conditional,v);
break;
case o.LogicalExpression:case o.BinaryExpression:w=q[B.operator];
D=u(B.left,w)+" "+B.operator+" "+u(B.right,w+1);
if(B.operator==="in"){D="("+D+")"
}else{D=h(D,w,v)
}break;
case o.CallExpression:D="";
for(x=0,y=B["arguments"].length;
x<y;
x+=1){D+=u(B["arguments"][x],l.Assignment);
if((x+1)<y){D+=", "
}}D=h(u(B.callee,l.Call)+"("+D+")",l.Call,v);
break;
case o.NewExpression:D="";
for(x=0,y=B["arguments"].length;
x<y;
x+=1){D+=u(B["arguments"][x],l.Assignment);
if((x+1)<y){D+=", "
}}D=h("new "+u(B.callee,l.New)+"("+D+")",l.New,v);
break;
case o.MemberExpression:D=u(B.object,l.Call);
if(B.computed){D+="["+u(B.property)+"]"
}else{if(B.object.type===o.Literal&&typeof B.object.value==="number"){if(D.indexOf(".")<0){if(!/[eExX]/.test(D)&&!(D.length>=2&&D[0]==="0")){D+="."
}}}D+="."+B.property.name
}D=h(D,l.Member,v);
break;
case o.UnaryExpression:D=B.operator;
if(D.length>2){D+=" "
}D=h(D+u(B.argument,l.Unary+(B.argument.type===o.UnaryExpression&&B.operator.length<3&&B.argument.operator===B.operator?1:0)),l.Unary,v);
break;
case o.UpdateExpression:if(B.prefix){D=h(B.operator+u(B.argument,l.Unary),l.Unary,v)
}else{D=h(u(B.argument,l.Postfix)+B.operator,l.Postfix,v)
}break;
case o.FunctionExpression:D="function ";
if(B.id){D+=B.id.name
}D+=e(B);
break;
case o.ArrayExpression:if(!B.elements.length){D="[]";
break
}D="[\n";
A=i;
i+=k;
for(x=0,y=B.elements.length;
x<y;
x+=1){if(!B.elements[x]){D+=a("");
if((x+1)===y){D+=","
}}else{D+=a(u(B.elements[x],l.Assignment))
}if((x+1)<y){D+=",\n"
}}i=A;
D+="\n"+a("]");
break;
case o.Property:if(B.kind==="get"||B.kind==="set"){D=B.kind+" "+u(B.key)+e(B.value)
}else{D=u(B.key)+": "+u(B.value,l.Assignment)
}break;
case o.ObjectExpression:if(!B.properties.length){D="{}";
break
}D="{\n";
A=i;
i+=k;
for(x=0,y=B.properties.length;
x<y;
x+=1){D+=a(u(B.properties[x]));
if((x+1)<y){D+=",\n"
}}i=A;
D+="\n"+a("}");
break;
case o.ThisExpression:D="this";
break;
case o.Identifier:D=B.name;
break;
case o.Literal:if(B.hasOwnProperty("raw")&&m){try{C=m(B.raw).body[0].expression;
if(C.type===o.Literal){if(C.value===B.value){D=B.raw;
break
}}}catch(z){}}if(B.value===null){D="null";
break
}if(typeof B.value==="string"){D=s(B.value);
break
}if(typeof B.value==="number"&&B.value===Infinity){D="1e+1000";
break
}D=B.value.toString();
break;
default:break
}if(D===undefined){throw new Error("Unknown expression type: "+B.type)
}return D
}function c(z){var y,w,v,x;
switch(z.type){case o.BlockStatement:v="{\n";
x=i;
i+=k;
for(y=0,w=z.body.length;
y<w;
y+=1){v+=a(c(z.body[y]))+"\n"
}i=x;
v+=a("}");
break;
case o.BreakStatement:if(z.label){v="break "+z.label.name+";"
}else{v="break;"
}break;
case o.ContinueStatement:if(z.label){v="continue "+z.label.name+";"
}else{v="continue;"
}break;
case o.DoWhileStatement:v="do"+r(z.body,true)+"while ("+u(z.test)+");";
break;
case o.CatchClause:x=i;
i+=k;
v=" catch ("+u(z.param)+")";
i=x;
v+=r(z.body);
break;
case o.DebuggerStatement:v="debugger;";
break;
case o.EmptyStatement:v=";";
break;
case o.ExpressionStatement:v=u(z.expression);
if(v[0]==="{"||v.indexOf("function ")===0){v="("+v+");"
}else{v+=";"
}break;
case o.VariableDeclarator:if(z.init){v=z.id.name+" = "+u(z.init,l.Assignment)
}else{v=z.id.name
}break;
case o.VariableDeclaration:v=z.kind+" ";
if(z.declarations.length===1&&z.declarations[0].init&&z.declarations[0].init.type===o.FunctionExpression){v+=c(z.declarations[0])
}else{x=i;
i+=k;
for(y=0,w=z.declarations.length;
y<w;
y+=1){v+=c(z.declarations[y]);
if((y+1)<w){v+=", "
}}i=x
}v+=";";
break;
case o.ThrowStatement:v="throw "+u(z.argument)+";";
break;
case o.TryStatement:v="try"+r(z.block);
for(y=0,w=z.handlers.length;
y<w;
y+=1){v+=c(z.handlers[y])
}if(z.finalizer){v+=" finally"+r(z.finalizer)
}break;
case o.SwitchStatement:x=i;
i+=k;
v="switch ("+u(z.discriminant)+") {\n";
i=x;
if(z.cases){for(y=0,w=z.cases.length;
y<w;
y+=1){v+=a(c(z.cases[y]))+"\n"
}}v+=a("}");
break;
case o.SwitchCase:x=i;
i+=k;
if(z.test){v="case "+u(z.test)+":"
}else{v="default:"
}y=0;
w=z.consequent.length;
if(w&&z.consequent[0].type===o.BlockStatement){v+=r(z.consequent[0]);
y=1
}for(;
y<w;
y+=1){v+="\n"+a(c(z.consequent[y]))
}i=x;
break;
case o.IfStatement:if(z.alternate){if(z.alternate.type===o.IfStatement){x=i;
i+=k;
v="if ("+u(z.test)+")";
i=x;
v+=r(z.consequent,true)+"else "+c(z.alternate)
}else{x=i;
i+=k;
v="if ("+u(z.test)+")";
i=x;
v+=r(z.consequent,true)+"else"+r(z.alternate)
}}else{x=i;
i+=k;
v="if ("+u(z.test)+")";
i=x;
v+=r(z.consequent)
}break;
case o.ForStatement:x=i;
i+=k;
v="for (";
if(z.init){if(z.init.type===o.VariableDeclaration){v+=c(z.init)
}else{v+=u(z.init)+";"
}}else{v+=";"
}if(z.test){v+=" "+u(z.test)+";"
}else{v+=";"
}if(z.update){v+=" "+u(z.update)+")"
}else{v+=")"
}i=x;
v+=r(z.body);
break;
case o.ForInStatement:v="for (";
if(z.left.type===o.VariableDeclaration){x=i;
i+=k+k;
v+=z.left.kind+" "+c(z.left.declarations[0]);
i=x
}else{x=i;
i+=k;
v+=u(z.left,l.Call);
i=x
}x=i;
i+=k;
v+=" in "+u(z.right)+")";
i=x;
v+=r(z.body);
break;
case o.LabeledStatement:v=z.label.name+":"+r(z.body);
break;
case o.Program:v="";
for(y=0,w=z.body.length;
y<w;
y+=1){v+=c(z.body[y]);
if((y+1)<w){v+="\n"
}}break;
case o.FunctionDeclaration:v="function ";
if(z.id){v+=z.id.name
}v+=e(z);
break;
case o.ReturnStatement:if(z.argument){v="return "+u(z.argument)+";"
}else{v="return;"
}break;
case o.WhileStatement:x=i;
i+=k;
v="while ("+u(z.test)+")";
i=x;
v+=r(z.body);
break;
case o.WithStatement:x=i;
i+=k;
v="with ("+u(z.object)+")";
i=x;
v+=r(z.body);
break;
default:break
}if(v===undefined){throw new Error("Unknown statement type: "+z.type)
}return v
}function n(x,w){var v=j();
if(typeof w!=="undefined"){if(typeof w.indent==="string"){v.format.style=w.indent
}w=d(v,w);
k=w.format.style;
if(typeof w.base==="string"){i=w.base
}else{i=f(k,w.format.base)
}m=w.parse
}else{w=v;
k=w.format.style;
i=f(k,w.format.base);
m=w.parse
}switch(x.type){case o.BlockStatement:case o.BreakStatement:case o.CatchClause:case o.ContinueStatement:case o.DoWhileStatement:case o.DebuggerStatement:case o.EmptyStatement:case o.ExpressionStatement:case o.ForStatement:case o.ForInStatement:case o.FunctionDeclaration:case o.IfStatement:case o.LabeledStatement:case o.Program:case o.ReturnStatement:case o.SwitchStatement:case o.SwitchCase:case o.ThrowStatement:case o.TryStatement:case o.VariableDeclaration:case o.VariableDeclarator:case o.WhileStatement:case o.WithStatement:return c(x);
case o.AssignmentExpression:case o.ArrayExpression:case o.BinaryExpression:case o.CallExpression:case o.ConditionalExpression:case o.FunctionExpression:case o.Identifier:case o.Literal:case o.LogicalExpression:case o.MemberExpression:case o.NewExpression:case o.ObjectExpression:case o.Property:case o.SequenceExpression:case o.ThisExpression:case o.UnaryExpression:case o.UpdateExpression:return u(x);
default:break
}throw new Error("Unknown node type: "+x.type)
}t.version="0.0.3-dev";
t.generate=n
}(typeof exports==="undefined"?(escodegen={}):exports));