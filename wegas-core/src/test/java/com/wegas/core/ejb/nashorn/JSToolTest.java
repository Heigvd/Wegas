/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2019 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.ejb.nashorn;

import org.junit.Test;
import static org.junit.Assert.*;

/**
 *
 * @author maxence
 */
public class JSToolTest {

    public JSToolTest() {
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
