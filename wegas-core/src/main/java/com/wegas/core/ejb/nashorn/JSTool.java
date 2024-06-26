/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.ejb.nashorn;

// !!! This is what jdk9+ version could be
import com.wegas.core.exception.client.WegasRuntimeException;
import java.util.Set;
import org.openjdk.nashorn.api.scripting.NashornException;
import org.openjdk.nashorn.api.tree.CompilationUnitTree;
import org.openjdk.nashorn.api.tree.DoWhileLoopTree;
import org.openjdk.nashorn.api.tree.ExpressionTree;
import org.openjdk.nashorn.api.tree.ForInLoopTree;
import org.openjdk.nashorn.api.tree.ForLoopTree;
import org.openjdk.nashorn.api.tree.FunctionCallTree;
import org.openjdk.nashorn.api.tree.FunctionDeclarationTree;
import org.openjdk.nashorn.api.tree.FunctionExpressionTree;
import org.openjdk.nashorn.api.tree.IdentifierTree;
import org.openjdk.nashorn.api.tree.LiteralTree;
import org.openjdk.nashorn.api.tree.ObjectLiteralTree;
import org.openjdk.nashorn.api.tree.Parser;
import org.openjdk.nashorn.api.tree.PropertyTree;
import org.openjdk.nashorn.api.tree.SimpleTreeVisitorES5_1;
import org.openjdk.nashorn.api.tree.StatementTree;
import org.openjdk.nashorn.api.tree.WhileLoopTree;

public class JSTool {

    public final static String JS_TOOL_INSTANCE_NAME = "$$internal$$JSTool";

    private JSTool() {
        // private constructor prevents initialisation
    }

    /**
     * Insert
     *
     * @param script
     *
     * @return
     */
    public static String makeScriptInterruptible(String script) {
        return JSTool.sanitize(script, "RequestManager.isInterrupted();");
    }

    /**
     * Convert code in String form to it's AST from. Nashorn's AST
     *
     * @param code source
     *
     * @return AST
     * @throws NullPointerException if code is null
     * @throws NashornException if parse fails
     */
    public static CompilationUnitTree parse(String code) {

        return Parser.create().parse("internal", code, null);
    }

    /**
     * Inject a specific sanitizer code into some chosen place of given code.
     *
     * @param code      code to sanitize
     * @param injection code to inject inline. It should end with a semicolon.
     *
     * @return Sanitized code
     */
    public static String sanitize(String code, String injection) {
        final CompilationUnitTree node = parse(code);
        final Visitor visitor = new Visitor(code, injection);
        node.accept(visitor, null);
        // inject at start to avoid rewrite from the code.
        return injection + visitor.getResult();
    }

    /**
     * Get the given property of the given object.
     *
     * @param node object AST
     * @param key  property name
     *
     * @return the property tree which match the key or null
     */
    public static PropertyTree getProperty(ObjectLiteralTree node, String key) {
        if (key != null) {
            for (PropertyTree p : node.getProperties()) {
                if (key.equals(readStringLiteral(p.getKey()))) {
                    return p;
                }
            }
        }
        return null;
    }

    /**
     * Read tree as StringLiteral or return null.
     *
     * @param node the AST expression
     *
     * @return the string value or null
     */
    public static String readStringLiteral(ExpressionTree node) {
        if (node instanceof LiteralTree) {
            return ((LiteralTree) node).getValue().toString();
        } else {
            return null;
        }
    }

    private static class Visitor extends SimpleTreeVisitorES5_1<Void, Void> {

        private long off = 0;
        private final StringBuilder res;
        private final String toInject;
        private final int injectionLength;
        private final static Set<String> forbiddenCalls = Set.of(new String[]{"Function", "eval"});

        public String getResult() {
            return res.toString();
        }

        public Visitor(String code, String injection) {
            super();
            this.res = new StringBuilder(code);
            this.toInject = injection;
            this.injectionLength = injection.length();
        }

        private Void visitExpressionTree(ExpressionTree tree, Void r) {
            if (tree != null) {
                return tree.accept(this, r);
            }
            return null;
        }

        @Override
        public Void visitFunctionDeclaration(FunctionDeclarationTree node, Void r) {
            long idx = node.getBody().getStartPosition() + off + 1;
            res.insert(Math.toIntExact(idx), toInject);
            off += this.injectionLength;
            return null;
        }

        @Override
        public Void visitFunctionExpression(FunctionExpressionTree node, Void r) {
            long idx = node.getBody().getStartPosition() + off + 1;
            res.insert(Math.toIntExact(idx), toInject);
            off += this.injectionLength;
            node.getBody().accept(this, r);
            return null;
        }

        @Override
        public Void visitWhileLoop(WhileLoopTree node, Void r) {
            visitExpressionTree(node.getCondition(), r);
            blockWrap(node.getStatement());
            return null;
        }

        @Override
        public Void visitDoWhileLoop(DoWhileLoopTree node, Void r) {
            blockWrap(node.getStatement());
            this.visitExpressionTree(node.getCondition(), r);
            return null;
        }

        @Override
        public Void visitForLoop(ForLoopTree node, Void r) {
            this.visitExpressionTree(node.getInitializer(), r);
            this.visitExpressionTree(node.getCondition(), r);
            this.visitExpressionTree(node.getUpdate(), r);
            blockWrap(node.getStatement());
            return null;
        }

        @Override
        public Void visitForInLoop(ForInLoopTree node, Void r) {
            this.visitExpressionTree(node.getVariable(), r);
            this.visitExpressionTree(node.getExpression(), r);
            blockWrap(node.getStatement());
            return null;
        }

        @Override
        public Void visitFunctionCall(FunctionCallTree node, Void r) {
            ExpressionTree fn = node.getFunctionSelect();
            if (fn instanceof IdentifierTree) {
                String name = ((IdentifierTree) fn).getName();
                if (forbiddenCalls.contains(name)) {
                    throw new JSValidationError(name + " is Evil");
                }
            }
            return super.visitFunctionCall(node, r);
        }

        /**
         * Wraps everything (BlockStatement included -- blockchain) into a BlockStatement starting
         * with the injection text
         *
         * @param block the BlockStatement to wrap. The parser gives us a BlockStatement even for a
         *              single Statement in the source
         */
        private void blockWrap(StatementTree block) {
            long idx = block.getStartPosition() + off;
            res.insert(Math.toIntExact(idx), "{").insert(Math.toIntExact(idx) + 1, toInject);
            off += this.injectionLength + 1;
            block.accept(this, null);
            res.insert(Math.toIntExact(block.getEndPosition() + off), "}");
            off += 1;
        }
    }

    public static class JSValidationError extends WegasRuntimeException {

        public JSValidationError(String message) {
            super(message);
        }
    }
}
