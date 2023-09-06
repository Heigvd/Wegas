/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.ejb.nashorn;

import com.wegas.core.Helper;
import java.io.IOException;
import java.util.List;
import java.util.Optional;
import org.graalvm.polyglot.Context;
import org.graalvm.polyglot.Value;
import org.junit.Assert;
import org.junit.Test;

/**
 *
 * @author maxence
 */
public class JSToolTest {

    private int counter = 0;

    public JSToolTest() {
    }

    private ConditionAnalyser.VariableCall findDepAndAssert(List<ConditionAnalyser.VariableCall> list, String name) {
        Optional<ConditionAnalyser.VariableCall> find = list.stream()
            .filter(p -> p.getVariableName().equals(name))
            .findFirst();
        if (find.isPresent()) {
            return find.get();
        } else {
            Assert.fail("Not found: " + name);
            return null;
        }
    }

    private ConditionAnalyser.VariableCall findDepAndAssert(List<ConditionAnalyser.VariableCall> list, String name, String method) {
        Optional<ConditionAnalyser.VariableCall> find = list.stream()
            .filter(p -> p.getVariableName().equals(name) && p.getMethodName().equals(method))
            .findFirst();
        if (find.isPresent()) {
            return find.get();
        } else {
            Assert.fail("Not found: " + name);
            return null;
        }
    }

    @Test
    public void testAndCondition() {
        String script = "Variable.find(gameModel, \"x\").getValue(self, 12) > 10 && Variable.find(gameModel, \"y\").getSomething(self, 12) > 10";
        List<ConditionAnalyser.VariableCall> list = ConditionAnalyser.analyseCondition(script);
        Assert.assertEquals(2, list.size());

        findDepAndAssert(list, "x", "getValue");
        findDepAndAssert(list, "y", "getSomething");

    }

    @Test
    public void testAndCondition2() {
        String script = "Variable.find(gameModel, \"x\").getValue(self, 12) > 10"
            + "&& Variable.find(gameModel, \"y\").getValue(self, 12) > 10"
            + "&& Variable.find(gameModel, \"z\").getValue(self, 12) > 10";

        List<ConditionAnalyser.VariableCall> list = ConditionAnalyser.analyseCondition(script);
        Assert.assertEquals(3, list.size());
        findDepAndAssert(list, "x", "getValue");
        findDepAndAssert(list, "y", "getValue");
        findDepAndAssert(list, "z", "getValue");
    }

    @Test
    public void testAndCondition3() {
        String script = "Variable.find(gameModel, \"x\").getValue(self, 12) > 10"
            + "&& Variable.find(gameModel, 12).getValue(self, 12) > 10"
            + "&& Variable.find(gameModel, \"z\").getValue(self, 12) > 10";

        List<ConditionAnalyser.VariableCall> list = ConditionAnalyser.analyseCondition(script);
        Assert.assertEquals(0, list.size());
    }

    @Test
    public void testAndConditionSameVariable() {
        String script = "Variable.find(gameModel, \"x\").getValue(self, 12) > 10"
            + "&& Variable.find(gameModel, \"x\").getValue(self, 12) < 20";

        List<ConditionAnalyser.VariableCall> list = ConditionAnalyser.analyseCondition(script);
        Assert.assertEquals(2, list.size());
        findDepAndAssert(list, "x", "getValue");
    }


    @Test
    public void testNestedCallsCondition() {
        String script = "Variable.find(gameModel, \"x\").item(self, Variable.find(gameModel, \"y\").getValue(self)).size() > 0";

        List<ConditionAnalyser.VariableCall> list = ConditionAnalyser.analyseCondition(script);
        Assert.assertEquals(0, list.size());
    }

    @Test
    public void testNestedCallsCondition2() {
        String script = "Variable.find(gameModel, \"x\").item(self, Variable.find(gameModel, \"y\").getValue(self))> 0";

        List<ConditionAnalyser.VariableCall> list = ConditionAnalyser.analyseCondition(script);
        Assert.assertEquals(2, list.size());

        findDepAndAssert(list, "x", "item");
        findDepAndAssert(list, "y", "getValue");
    }

    @Test
    public void testVariableCompare() {
        String script = "Variable.find(gameModel, \"x\").getValue(self) <= Variable.find(gameModel, \"y\").getValue(self)";

        List<ConditionAnalyser.VariableCall> list = ConditionAnalyser.analyseCondition(script);
        Assert.assertEquals(2, list.size());

        findDepAndAssert(list, "x", "getValue");
        findDepAndAssert(list, "y", "getValue");
    }

    @Test
    public void testNestIf() {
        String script = "if (Variable.find(gameModel, \"x\").getValue(self) < 10){\n"
            + "            Variable.find(gameModel, \"y\").getValue(self) > 10;\n"
            + "        } else {\n"
            + "            false;\n"
            + "        }";

        List<ConditionAnalyser.VariableCall> list = ConditionAnalyser.analyseCondition(script);
        Assert.assertEquals(2, list.size());

        findDepAndAssert(list, "x", "getValue");
        findDepAndAssert(list, "y", "getValue");
    }


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
