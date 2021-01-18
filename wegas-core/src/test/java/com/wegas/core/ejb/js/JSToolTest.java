
/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.ejb.js;

import com.wegas.core.Helper;
import java.io.IOException;
import org.graalvm.polyglot.Context;
import org.graalvm.polyglot.Value;
import org.junit.Assert;
import org.junit.Test;

/**
 *
 * @author maxence
 */
public class JSToolTest {

    @Test
    public void testEval() {
        Context context = Context.create("js");
        context.eval("js", "console.log('hello');");
    }

    @Test
    public void testGetJSArray() {
        Context context = Context.create("js");
        Value eval = context.eval("js", "const a =['apple', 'banana']; a;");
        System.out.println("Eval: " + eval);
    }

    @Test
    public void testArrowFunction() {
        Context context = Context.create("js");
        Value eval = context.eval("js", "const square = (x) =>x**2; square(5)");
        Assert.assertEquals(25, eval.asInt());
    }

    @Test
    public void testSpread() {
        Context context = Context.create("js");
        Value eval = context.eval("js", "    const a = {one: 1, two: 2, three: 3};\n"
            + "    const b = {...a, four: 4};\n"
            + "    const {one} = a;one;");
        Assert.assertEquals(1, eval.asInt());
    }

    @Test
    public void testBigInt() {
        Context context = Context.create("js");
        Value eval = context.eval("js", "let x = 10n;x;\n");
        Assert.assertEquals(10, eval.asInt());
    }

    public void testSyntaxError() throws IOException {
        String source = Helper.readFile("./src/test/js/syntaxError.js");
        JSTool.parse(source);
    }

    @Test
    public void testParseES5() throws IOException {
        System.out.println("Start test");

        String source = Helper.readFile("./src/test/js/es5.js");
        System.out.println("parse " + source);
        Object parse = JSTool.parse(source);
        System.out.println("Parse " + parse);
    }

    @Test
    public void testParseES6() throws IOException {
        String source = Helper.readFile("./src/test/js/es6.js");
        JSTool.parse(source);
    }

    @Test
    public void testParseES2016() throws IOException {
        String source = Helper.readFile("./src/test/js/es2016.js");
        JSTool.parse(source);
    }

    @Test
    public void testParseES2017() throws IOException {
        String source = Helper.readFile("./src/test/js/es2017.js");
        JSTool.parse(source);
    }

    @Test
    public void testParseES2018() throws IOException {
        String source = Helper.readFile("./src/test/js/es2018.js");
        JSTool.parse(source);
    }

    @Test
    public void testParseES2019() throws IOException {
        String source = Helper.readFile("./src/test/js/es2019.js");
        JSTool.parse(source);
    }

    @Test
    public void testParseES2020() throws IOException {
        String source = Helper.readFile("./src/test/js/es2020.js");
        JSTool.parse(source);
    }
}
