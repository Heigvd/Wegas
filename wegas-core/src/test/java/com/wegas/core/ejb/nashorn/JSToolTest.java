/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.ejb.nashorn;

import static org.junit.Assert.*;
import org.junit.Test;

/**
 *
 * @author maxence
 */
public class JSToolTest {

    private int counter = 0;

    public JSToolTest() {
    }

    private void run(String script, Integer nbIter) {
        long starttime = System.currentTimeMillis();
        for (int i = 0; i < nbIter; i++) {
            String makeScriptInterruptible = JSTool.makeScriptInterruptible(script);
        }
        counter += nbIter;
        long endttime = System.currentTimeMillis();

        long duration = endttime - starttime;
        double perScript = duration / nbIter.doubleValue();
        System.out.println(String.format("%d, %d, %d, %6.3f", counter, nbIter, duration, perScript));
    }

    public void benchmarkInjection(String script) {
        System.out.println(String.format("counter, run, duration, perScript"));
        run(script, 1);
        run(script, 1);
        run(script, 1);
        run(script, 1);
        run(script, 1);
        run(script, 1);
        run(script, 1);
        run(script, 1);
        run(script, 1);
        run(script, 1);
        run(script, 10);
        run(script, 10);
        run(script, 10);
        run(script, 10);
        run(script, 10);
        run(script, 10);
        run(script, 10);
        run(script, 10);
        run(script, 10);
        run(script, 100);
        run(script, 100);
        run(script, 100);
        run(script, 100);
        run(script, 100);
        run(script, 100);
        run(script, 100);
        run(script, 100);
        run(script, 100);
        run(script, 100);
        run(script, 100);
        run(script, 100);
        run(script, 100);
        run(script, 100);
        run(script, 100);
        run(script, 100);
        run(script, 100);
    }

    @Test
    public void benchmarkSimpleScript() {
        this.benchmarkInjection("Variable.find(gameModel, \"x\").add(self, 1);");
    }

    @Test
    public void benchmarkSimpleScript2Stmts() {
        this.benchmarkInjection(
            "Variable.find(gameModel, \"x\").add(self, 1);\n"
            + "Variable.find(gameModel, \"y\").add(self, 2);"
        );
    }

    @Test
    public void benchmarkSimpleScript10Stmts() {
        this.benchmarkInjection(
            "Variable.find(gameModel, \"x1\").add(self, 1);\n"
            + "Variable.find(gameModel, \"x2\").add(self, 1);\n"
            + "Variable.find(gameModel, \"x3\").add(self, 1);\n"
            + "Variable.find(gameModel, \"x4\").add(self, 1);\n"
            + "Variable.find(gameModel, \"x5\").add(self, 1);\n"
            + "Variable.find(gameModel, \"x6\").add(self, 1);\n"
            + "Variable.find(gameModel, \"x7\").add(self, 1);\n"
            + "Variable.find(gameModel, \"x8\").add(self, 1);\n"
            + "Variable.find(gameModel, \"x9\").add(self, 1);\n"
            + "Variable.find(gameModel, \"x10\").add(self, 1);\n"
        );
    }

    @Test
    public void benchmarkIf() {
        this.benchmarkInjection(
            "if (Variable.find(gameModel, \"x\").getValue(self, 1)){\n"
            + "  Variable.find(gameModel, \"y\").add(self, 2);"
            + "}"
        );
    }

    @Test
    public void testInjection() {
        String code = "for(var i=0; i< 10; i++) {}";
        String expected = "nop();for(var i=0; i< 10; i++) {nop();{}}";

        String sanitize = JSTool.sanitize(code, "nop();");

        System.out.println(sanitize);
        assertEquals(expected, sanitize);
    }

    @Test
    public void testInjection2() {
        String code = "(function(){for(;;){}})()";
        String expected = "nop();(function(){nop();for(;;){nop();{}}})()";

        String sanitize = JSTool.sanitize(code, "nop();");

        System.out.println(sanitize);
        assertEquals(expected, sanitize);
    }

    //@Test
    public void testLambda() {
        String code = "var fn = (x) => (function(){while(1){}})();";
        String expected = ";";

        String sanitize = JSTool.sanitize(code, "nop();");

        System.out.println(sanitize);
        assertEquals(expected, sanitize);
    }

    @Test
    public void testInjection3() {
        String code = "for (var i=0;i< (function(){while(true){};return 10;})(); i++){console.log(i);}";
        String expected = "nop();for (var i=0;i< (function(){nop();while(true){nop();{}};return 10;})(); i++){nop();{console.log(i);}}";

        String sanitize = JSTool.sanitize(code, "nop();");

        System.out.println(sanitize);
        assertEquals(expected, sanitize);
    }

    @Test
    public void testRecursion() {
        String code = "var fn = function(){fn();};fn();";
        String expected = "nop();var fn = function(){nop();fn();};fn();";

        String sanitize = JSTool.sanitize(code, "nop();");

        System.out.println(sanitize);
        assertEquals(expected, sanitize);
    }
}
