/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.app;

import com.wegas.core.ejb.VariableDescriptorFacade;
import java.io.IOException;
import javax.script.ScriptException;
import org.junit.Test;

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
public class PMGTest extends GameModelTest {

    private static final String SCRIPTROOT = "src/main/webapp/wegas-pmg/scripts/";
    private static final double[][] expected = {
        //     quality | cost | delay
        new double[]{100, 100, 100},//period 1 (start)
        new double[]{100, 100, 100},//period 2
        new double[]{100, 88, 100},//period 3
        new double[]{100, 100, 100},//period 4
    //        new double[]{100, 100, 100}//period 5
    };
    private double period = 1;

    @Test
    public void testIndicators() throws ScriptException, IOException {
        final VariableDescriptorFacade vdf = lookup(VariableDescriptorFacade.class);
        /* insert script from files*/
        String script = TestHelper.readFile(SCRIPTROOT + "wegas-pmg-server-util.js");
        String script2 = TestHelper.readFile(SCRIPTROOT + "wegas-pmg-server-simulation.js");
        String script3 = TestHelper.readFile(SCRIPTROOT + "wegas-pmg-serverScript.js");
        /* Create gameModel with scripts. Using this methods as it persists to DB */
        gm = this.createGameModelFromFile(this.getGameModelPath(), script + "\n" + script2 + "\n" + script3);
        player = gm.getPlayers().get(0);

        gmFacade.reset(gm.getId());
        this.evalFile(SCRIPTROOT + "wegas-pmg-server-test.js");                 //Run initialization
        checkNumber("currentPhase", 2.0);                                       //Check "Execution" phase
        testIndicator(expected[0][0], expected[0][0], expected[0][0]);          //Check indicators at start.
        for (int i = 1; i < expected.length; i += 1) {                          //for each period, check indicators.
            passPeriod();
        }
        checkNumber("currentPhase", 3.0);                                       //END
    }

    @Override
    protected String getGameModelPath() {
        return "src/main/webapp/wegas-pmg/db/wegas-pmg-gamemodel-simplePmg.json";
    }

    private void testIndicator(double quality, double costs, double delay) {
        checkNumber("quality", quality);
        checkNumber("costs", costs);
        checkNumber("delay", delay);
    }

    private void passPeriod() throws ScriptException {
        System.out.println("Go to period" + (period + 1) + " ==============================");
        double[] expectedLine = expected[(int) period];
        this.evalScript("nextPeriod()");
        period++;
        System.out.println("Period " + (period) + " END==============================");
        checkNumber("periodPhase3", period, "currentPeriod");
        try {
            testIndicator(expectedLine[0], expectedLine[1], expectedLine[2]);
        } catch (AssertionError ae) {
            throw new AssertionError("Period [" + period + "]:" + ae.getMessage());
        }
    }

}
