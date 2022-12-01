/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.ejb.nashorn;

import com.wegas.core.exception.client.WegasScriptException;
import java.util.ArrayList;
import java.util.List;
import jdk.nashorn.api.scripting.NashornException;
import jdk.nashorn.api.tree.ArrayAccessTree;
import jdk.nashorn.api.tree.AssignmentTree;
import jdk.nashorn.api.tree.BinaryTree;
import jdk.nashorn.api.tree.ClassDeclarationTree;
import jdk.nashorn.api.tree.ClassExpressionTree;
import jdk.nashorn.api.tree.CompilationUnitTree;
import jdk.nashorn.api.tree.CompoundAssignmentTree;
import jdk.nashorn.api.tree.ErroneousTree;
import jdk.nashorn.api.tree.ExportEntryTree;
import jdk.nashorn.api.tree.ExpressionTree;
import jdk.nashorn.api.tree.FunctionCallTree;
import jdk.nashorn.api.tree.FunctionDeclarationTree;
import jdk.nashorn.api.tree.FunctionExpressionTree;
import jdk.nashorn.api.tree.IdentifierTree;
import jdk.nashorn.api.tree.ImportEntryTree;
import jdk.nashorn.api.tree.LiteralTree;
import jdk.nashorn.api.tree.MemberSelectTree;
import jdk.nashorn.api.tree.ModuleTree;
import jdk.nashorn.api.tree.NewTree;
import jdk.nashorn.api.tree.PropertyTree;
import jdk.nashorn.api.tree.SimpleTreeVisitorES5_1;
import jdk.nashorn.api.tree.SpreadTree;
import jdk.nashorn.api.tree.Tree;
import jdk.nashorn.api.tree.WithTree;
import jdk.nashorn.api.tree.YieldTree;

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
            CompilationUnitTree parse = JSTool.parse(condition);
            Visitor visitor = new Visitor();
            parse.accept(visitor, null);
            return visitor.getCalls();
        } catch (WegasScriptException | NashornException ex) {
            return new ArrayList<>();
        }
    }

    private static class Visitor extends SimpleTreeVisitorES5_1<Void, Void> {

        private final List<VariableCall> calls = new ArrayList<>();

        private List<VariableCall> getCalls() {
            return calls;
        }

        @Override
        public Void visitUnknown(Tree node, Void p) {
            throw new WegasScriptException("visit unknown");
        }

        @Override
        public Void visitYield(YieldTree node, Void p) {
            throw new WegasScriptException("visit yield");
        }

        @Override
        public Void visitWith(WithTree node, Void r) {
            throw new WegasScriptException("visit with");
        }

        @Override
        public Void visitSpread(SpreadTree node, Void p) {
            throw new WegasScriptException("visit spread");
        }

        @Override
        public Void visitProperty(PropertyTree node, Void r) {
            throw new WegasScriptException("todo visitProperty");
        }

        @Override
        public Void visitNew(NewTree node, Void r) {
            throw new WegasScriptException("visit new");
        }

        @Override
        public Void visitMemberSelect(MemberSelectTree node, Void r) {
            throw new WegasScriptException("visit member select");
        }

        @Override
        public Void visitArrayAccess(ArrayAccessTree node, Void r) {
            throw new WegasScriptException("visit array access");
        }

        @Override
        public Void visitFunctionExpression(FunctionExpressionTree node, Void r) {
            throw new WegasScriptException("visit arrow function decl");
        }

        @Override
        public Void visitFunctionDeclaration(FunctionDeclarationTree node, Void r) {
            throw new WegasScriptException("visit function decl");
        }

        @Override
        public Void visitFunctionCall(FunctionCallTree node, Void r) {
            ExpressionTree fn = node.getFunctionSelect();
            List<? extends ExpressionTree> arguments = node.getArguments();
            if (fn instanceof MemberSelectTree) {
                // expect:
                // Variable.find(gameModel, "scriptAlias").methodName(...)
                // Expre                                   identifier vdFindArgs
                MemberSelectTree member = (MemberSelectTree) fn;
                String methodName = member.getIdentifier();
                ExpressionTree expression = member.getExpression();
                if (expression instanceof FunctionCallTree) {
                    // expect:
                    //Variable.find(...)
                    FunctionCallTree expr = (FunctionCallTree) expression;
                    ExpressionTree fnSelect = expr.getFunctionSelect();
                    if (fnSelect instanceof MemberSelectTree) {
                        ExpressionTree expression1 = ((MemberSelectTree) fnSelect).getExpression();
                        String identifier = ((MemberSelectTree) fnSelect).getIdentifier();
                        if (expression1 instanceof IdentifierTree) {
                            String name = ((IdentifierTree) expression1).getName();
                            if ("Variable".equals(name) && "find".equals(identifier)) {
                                List<? extends ExpressionTree> vdFindArgs = expr.getArguments();
                                if (vdFindArgs.size() == 2) {
                                    ExpressionTree gmArg = vdFindArgs.get(0);
                                    if (gmArg instanceof IdentifierTree) {
                                        if ("gameModel".equals(((IdentifierTree) gmArg).getName())) {
                                            ExpressionTree vdName = vdFindArgs.get(1);
                                            if (vdName instanceof LiteralTree) {
                                                Object value = ((LiteralTree) vdName).getValue();
                                                if (value instanceof String) {
                                                    VariableCall call = new VariableCall();
                                                    call.setVariableName((String) value);
                                                    call.setMethodName(methodName);
                                                    call.setArgsCount(arguments.size());
                                                    for (ExpressionTree arg : arguments) {
                                                        if (arg instanceof IdentifierTree) {
                                                            if (!"self".equals(((IdentifierTree) arg).getName())) {
                                                                throw new WegasScriptException("unexpected identifier");
                                                            }
                                                        } else {
                                                            // let visit arguments too
                                                            arg.accept(this, null);
                                                        }
                                                    }
                                                    calls.add(call);
                                                    return null;
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
        public Void visitErroneous(ErroneousTree node, Void r) {
            throw new WegasScriptException("visit erroneous");
        }

        @Override
        public Void visitClassExpression(ClassExpressionTree node, Void p) {
            throw new WegasScriptException("visit class expr");
        }

        @Override
        public Void visitClassDeclaration(ClassDeclarationTree node, Void p) {
            throw new WegasScriptException("visit class decl");
        }

        @Override
        public Void visitBinary(BinaryTree node, Void r) {
            switch (node.getKind()) {
                case CONDITIONAL_AND:
                case CONDITIONAL_OR:
                case EQUAL_TO:
                case STRICT_EQUAL_TO:
                case NOT_EQUAL_TO:
                case STRICT_NOT_EQUAL_TO:
                case LESS_THAN:
                case LESS_THAN_EQUAL:
                case GREATER_THAN:
                case GREATER_THAN_EQUAL:
                    return super.visitBinary(node, r);
                default:
                    throw new WegasScriptException("visit binary " + node.getKind());
            }
        }

        @Override
        public Void visitImportEntry(ImportEntryTree node, Void p) {
            throw new WegasScriptException("todo");
        }

        @Override
        public Void visitExportEntry(ExportEntryTree node, Void p) {
            throw new WegasScriptException("todo");
        }

        @Override
        public Void visitModule(ModuleTree node, Void p) {
            throw new WegasScriptException("todo");
        }

        @Override
        public Void visitCompoundAssignment(CompoundAssignmentTree node, Void r) {
            throw new WegasScriptException("todo");
        }

        @Override
        public Void visitAssignment(AssignmentTree node, Void r) {
            throw new WegasScriptException("todo");
        }
    }
}
