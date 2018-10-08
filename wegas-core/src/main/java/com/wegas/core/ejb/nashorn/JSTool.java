
package com.wegas.core.ejb.nashorn;
/*
    Using lots of internal class from nashorn...
    @TODO
    JDK 9 make them available on jdk.nashorn.api.tree.*
    jdk.nashorn.internal.runtime.* should not be useful anymore.
    
    remove <compilerArgument>-XDignore.symbol.file</compilerArgument>
    from pom.xml's maven-compiler entry.
    Used to have access to some internals (jdk.internal.org.objectweb.asm*)
 */

import com.wegas.core.exception.client.WegasRuntimeException;
import jdk.nashorn.internal.ir.*;
import jdk.nashorn.internal.ir.visitor.SimpleNodeVisitor;
import jdk.nashorn.internal.parser.Parser;
import jdk.nashorn.internal.runtime.Context;
import jdk.nashorn.internal.runtime.ErrorManager;
import jdk.nashorn.internal.runtime.Source;
import jdk.nashorn.internal.runtime.options.Options;

public class JSTool {
    /**
     * Convert code in String form to it's AST from.
     * Nashorn's AST
     *
     * @param code source
     * @return AST
     */
    public static FunctionNode parse(String code) {
        Options options = new Options("nashorn");
        options.set("anon.functions", true);
        options.set("parse.only", true);
        options.set("scripting", true);

        ErrorManager errors = new ErrorManager();
        Context context = new Context(options, errors, Thread.currentThread().getContextClassLoader());
        Source source = Source.sourceFor("internal", code);
        final Parser parser = new Parser(context.getEnv(), source, errors);
        return parser.parse();
    }

    /**
     * Inject a specific sanitizer code into some chosen place of given code.
     *
     * @param code      code to sanitize
     * @param injection code to inject inline. It should end with a semicolon.
     * @return Sanitized code
     */
    public static String sanitize(String code, String injection) {
        final FunctionNode node = parse(code);
        final Visitor visitor = new Visitor(code, injection);
        node.getBody().accept(visitor);
        // inject at start to avoid rewrite from the code.
        return injection + visitor.getResult();
    }

    private static class Visitor extends SimpleNodeVisitor {
        private int off = 0;
        private final StringBuilder res;
        private final String toInject;
        private final int injectionLength;

        public String getResult() {
            return res.toString();
        }

        public Visitor(String code, String injection) {
            super();
            this.res = new StringBuilder(code);
            this.toInject = injection;
            this.injectionLength = injection.length();
        }

        @Override
        public boolean enterFunctionNode(FunctionNode functionNode) {
            int idx = functionNode.getBody().getStart() + off + 1;
            res.insert(idx, toInject);
            off += this.injectionLength;
            return true;
        }

        @Override
        public boolean enterWhileNode(WhileNode whileNode) {
            whileNode.getTest().accept(this);
            blockWrap(whileNode.getBody());
            return false;
        }

        @Override
        public boolean enterForNode(ForNode forNode) {
            if (forNode.getInit() != null) {
                forNode.getInit().accept(this);
            }
            if (forNode.getTest() != null) {
                forNode.getTest().accept(this);
            }
            if (forNode.getModify() != null) {
                forNode.getModify().accept(this);
            }
            blockWrap(forNode.getBody());
            return false;
        }

        /**
         * Check for some "forbidden" function calls
         *
         * @param callNode function call
         * @return continue
         */
        @Override
        public boolean enterCallNode(CallNode callNode) {
            final Expression function = callNode.getFunction();
            if (function instanceof IdentNode) {
                if ("Function".equals(((IdentNode) function).getName())) {
                    throw new JSParseError("Function is Evil");
                }
                if ("eval".equals(((IdentNode) function).getName())) {
                    throw new JSParseError("Eval is Evil");
                }
            }
            return super.enterCallNode(callNode);
        }

        /**
         * Wraps everything (BlockStatement included -- blockchain) into a BlockStatement
         * starting with the injection text
         *
         * @param block the BlockStatement to wrap.
         *              The parser gives us a BlockStatement even for a single Statement in the source
         */
        private void blockWrap(Block block) {
            int idx = block.getStart() + off;
            res.insert(idx, "{").insert(idx + 1, toInject);
            off += this.injectionLength + 1;
            block.accept(this);
            res.insert(block.getFinish() + off, "}");
            off += 1;
        }
    }

    public static class JSParseError extends WegasRuntimeException {
        public JSParseError(String message) {
            super(message);
        }
    }
}
