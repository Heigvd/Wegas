/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.ejb.nashorn;

import com.oracle.js.parser.TokenType;
import com.oracle.js.parser.ir.AccessNode;
import com.oracle.js.parser.ir.BinaryNode;
import com.oracle.js.parser.ir.Block;
import com.oracle.js.parser.ir.BlockExpression;
import com.oracle.js.parser.ir.BlockStatement;
import com.oracle.js.parser.ir.BreakNode;
import com.oracle.js.parser.ir.CallNode;
import com.oracle.js.parser.ir.CaseNode;
import com.oracle.js.parser.ir.CatchNode;
import com.oracle.js.parser.ir.ClassElement;
import com.oracle.js.parser.ir.ClassNode;
import com.oracle.js.parser.ir.ContinueNode;
import com.oracle.js.parser.ir.DebuggerNode;
import com.oracle.js.parser.ir.EmptyNode;
import com.oracle.js.parser.ir.ErrorNode;
import com.oracle.js.parser.ir.ExportNode;
import com.oracle.js.parser.ir.ExportSpecifierNode;
import com.oracle.js.parser.ir.Expression;
import com.oracle.js.parser.ir.ExpressionStatement;
import com.oracle.js.parser.ir.ForNode;
import com.oracle.js.parser.ir.FromNode;
import com.oracle.js.parser.ir.FunctionNode;
import com.oracle.js.parser.ir.IdentNode;
import com.oracle.js.parser.ir.IfNode;
import com.oracle.js.parser.ir.ImportClauseNode;
import com.oracle.js.parser.ir.ImportNode;
import com.oracle.js.parser.ir.ImportSpecifierNode;
import com.oracle.js.parser.ir.IndexNode;
import com.oracle.js.parser.ir.JoinPredecessorExpression;
import com.oracle.js.parser.ir.LabelNode;
import com.oracle.js.parser.ir.LexicalContext;
import com.oracle.js.parser.ir.LiteralNode;
import com.oracle.js.parser.ir.NameSpaceImportNode;
import com.oracle.js.parser.ir.NamedExportsNode;
import com.oracle.js.parser.ir.NamedImportsNode;
import com.oracle.js.parser.ir.ObjectNode;
import com.oracle.js.parser.ir.ParameterNode;
import com.oracle.js.parser.ir.PropertyNode;
import com.oracle.js.parser.ir.ReturnNode;
import com.oracle.js.parser.ir.SwitchNode;
import com.oracle.js.parser.ir.TemplateLiteralNode;
import com.oracle.js.parser.ir.TernaryNode;
import com.oracle.js.parser.ir.ThrowNode;
import com.oracle.js.parser.ir.TryNode;
import com.oracle.js.parser.ir.UnaryNode;
import com.oracle.js.parser.ir.VarNode;
import com.oracle.js.parser.ir.WhileNode;
import com.oracle.js.parser.ir.WithNode;
import com.oracle.js.parser.ir.visitor.NodeVisitor;
import com.wegas.core.exception.client.WegasScriptException;
import java.util.ArrayList;
import java.util.List;

/**
 * Parse
 *
 * @author maxence
 */
public class ConditionAnalyser {

    public static final class VariableCall {

        private String variableName;
        private String methodName;
        private Integer argsCount;

        public String getVariableName() {
            return variableName;
        }

        public void setVariableName(String variableName) {
            this.variableName = variableName;
        }

        public String getMethodName() {
            return methodName;
        }

        public void setMethodName(String methodName) {
            this.methodName = methodName;
        }

        public Integer getArgsCount() {
            return argsCount;
        }

        public void setArgsCount(Integer argsCount) {
            this.argsCount = argsCount;
        }

    }

    /**
     * Parse given script and return all variable method calls
     *
     * @param condition the script to analyze
     *
     * @return list of detected calls. If the script if not fully understand, an empty list is
     *         returned
     */
    public static List<VariableCall> analyseCondition(String condition) {
        try {
            Block parse = JSTool.parse(condition);
            Visitor visitor = new Visitor(new LexicalContext());
            parse.accept(visitor);
            return visitor.getCalls();
        } catch (WegasScriptException ex) {
            return new ArrayList<>();
        }
    }

    private static class Visitor<T extends LexicalContext> extends NodeVisitor<T> {

        private final List<VariableCall> calls = new ArrayList<>();

        public Visitor(T lc) {
            super(lc);
        }

        private List<VariableCall> getCalls() {
            return calls;
        }

        @Override
        public boolean enterReturnNode(ReturnNode returnNode) {
            throw new WegasScriptException("visit return node");
        }

        @Override
        public boolean enterWithNode(WithNode withNode) {
            throw new WegasScriptException("visit with");
        }

        @Override
        public boolean enterPropertyNode(PropertyNode propertyNode) {
            throw new WegasScriptException("todo visitProperty");
        }

        @Override
        public boolean enterAccessNode(AccessNode accessNode) {
            throw new WegasScriptException("visit member select");
        }

        @Override
        public boolean enterIndexNode(IndexNode indexNode) {
            throw new WegasScriptException("visit array access");
        }

        @Override
        public boolean enterFunctionNode(FunctionNode node) {
            throw new WegasScriptException("visit function decl");
        }

        @Override
        public boolean enterCallNode(CallNode node) {
            Expression fn = node.getFunction();
            List<Expression> arguments = node.getArgs();

            if (fn instanceof AccessNode member) {
                Expression expression = member.getBase();
                String methodName = member.getProperty();
                // expect:
                // Variable.find(gameModel, "scriptAlias").methodName(...)
                // Expre                                   identifier vdFindArgs
                if (expression instanceof CallNode expr) {
                    // expect:
                    //Variable.find(...)
                    Expression fnSelect = expr.getFunction();
                    if (fnSelect instanceof AccessNode fnSelectAccess) {
                        Expression expression1 = fnSelectAccess.getBase();
                        String identifier = fnSelectAccess.getProperty();
                        if (expression1 instanceof IdentNode ident) {
                            String name = ident.getName();
                            if ("Variable".equals(name) && "find".equals(identifier)) {
                                List<Expression> vdFindArgs = expr.getArgs();
                                if (vdFindArgs.size() == 2) {
                                    Expression gmArg = vdFindArgs.get(0);
                                    if (gmArg instanceof IdentNode gmIdent) {
                                        if ("gameModel".equals(gmIdent.getName())) {
                                            Expression vdName = vdFindArgs.get(1);
                                            if (vdName instanceof LiteralNode vdNameLiteral) {
                                                if (vdNameLiteral.isString()) {
                                                    String value = vdNameLiteral.getString();
                                                    VariableCall call = new VariableCall();
                                                    call.setVariableName((String) value);
                                                    call.setMethodName(methodName);
                                                    call.setArgsCount(arguments.size());
                                                    for (Expression arg : arguments) {
                                                        if (arg instanceof IdentNode argIdent) {
                                                            if (!"self".equals(argIdent.getName())) {
                                                                throw new WegasScriptException("unexpected identifier");
                                                            }
                                                        } else {
                                                            // let visit arguments too
                                                            arg.accept(this);
                                                        }
                                                    }
                                                    calls.add(call);
                                                    return false;
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            throw new WegasScriptException("unknown function call");
        }

        @Override
        public boolean enterErrorNode(ErrorNode errorNode) {
            throw new WegasScriptException("visit erroneous");
        }

        @Override
        public boolean enterClassElement(ClassElement element) {
            throw new WegasScriptException("visit class element");
        }

        @Override
        public boolean enterClassNode(ClassNode classNode) {
            throw new WegasScriptException("visit class decl");
        }

        @Override
        public boolean enterBinaryNode(BinaryNode node) {
            if (node.isAssignment()) {
                throw new WegasScriptException("todo");
            } else if (node.isComparison()) {
                return super.enterBinaryNode(node);
            } else if (node.isLogical()) {
                return super.enterBinaryNode(node);
            }
            throw new WegasScriptException("visit binary " + node.getToken());
        }

        @Override
        public boolean enterNamedImportsNode(NamedImportsNode namedImportsNode) {
            throw new WegasScriptException("todo");
        }

        @Override
        public boolean enterNameSpaceImportNode(NameSpaceImportNode nameSpaceImportNode) {
            throw new WegasScriptException("todo");
        }

        @Override
        public boolean enterImportSpecifierNode(ImportSpecifierNode importSpecifierNode) {
            throw new WegasScriptException("todo");
        }

        @Override
        public boolean enterImportNode(ImportNode importNode) {
            throw new WegasScriptException("todo");
        }

        @Override
        public boolean enterImportClauseNode(ImportClauseNode importClauseNode) {
            throw new WegasScriptException("todo");
        }

        @Override
        public boolean enterExportSpecifierNode(ExportSpecifierNode exportSpecifierNode) {
            throw new WegasScriptException("todo");
        }

        @Override
        public boolean enterExportNode(ExportNode exportNode) {
            throw new WegasScriptException("todo");
        }

        @Override
        public boolean enterNamedExportsNode(NamedExportsNode exportClauseNode) {
            throw new WegasScriptException("todo");
        }
    }
}
