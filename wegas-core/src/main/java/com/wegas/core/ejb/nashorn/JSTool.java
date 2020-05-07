
package com.wegas.core.ejb.nashorn;

// !!! This is what jdk9+ version could be
import com.wegas.core.exception.client.WegasRuntimeException;

import java.util.Set;

import jdk.nashorn.api.tree.CompilationUnitTree;
import jdk.nashorn.api.tree.DoWhileLoopTree;
import jdk.nashorn.api.tree.ExpressionTree;
import jdk.nashorn.api.tree.ForInLoopTree;
import jdk.nashorn.api.tree.ForLoopTree;
import jdk.nashorn.api.tree.FunctionCallTree;
import jdk.nashorn.api.tree.FunctionDeclarationTree;
import jdk.nashorn.api.tree.FunctionExpressionTree;
import jdk.nashorn.api.tree.IdentifierTree;
import jdk.nashorn.api.tree.LiteralTree;
import jdk.nashorn.api.tree.ObjectLiteralTree;
import jdk.nashorn.api.tree.Parser;
import jdk.nashorn.api.tree.PropertyTree;
import jdk.nashorn.api.tree.SimpleTreeVisitorES5_1;
import jdk.nashorn.api.tree.StatementTree;
import jdk.nashorn.api.tree.WhileLoopTree;

public class JSTool {

    public final static String JS_TOOL_INSTANCE_NAME = "$$internal$$JSTool";

    private JSTool() {
        // private constructor prevents initialisation
    }

    /**
     * Convert code in String form to it's AST from. Nashorn's AST
     *
     * @param code source
     *
     * @return AST
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

    /**
     * To be injected as {@value #JS_TOOL_INSTANCE_NAME} in the scriptEngine
     */
    public static class JSToolInstance {

        public String inject(String code, String injection) {
            return JSTool.sanitize(code, injection);
        }
    }

    public static class JSValidationError extends WegasRuntimeException {

        public JSValidationError(String message) {
            super(message);
        }
    }
}
