/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.unit.pmg;

import com.wegas.unit.PrivateRelatedTest;
import org.eu.ingwar.tools.arquillian.extension.suite.annotations.ArquillianSuiteDeployment;
import org.junit.Test;
import org.junit.experimental.categories.Category;

/**
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
@ArquillianSuiteDeployment
public class PMGTest extends PMGameAbstractTest {

    @Test
    @Category(PrivateRelatedTest.class)
    public void testSimplePMG() {
        this.evalScript("PMGTest.testAll()");
    }

    /*
    @Test
    public void testAuto() {
        this.evalScript("PMGTest.testAuto()");
    }

    @Test
    public void testTracking() {
        this.evalScript("PMGTest.testTrackingMessages()");
    }

    @Test
    public void testNormalAssign() {
        this.evalScript("PMGTest.testNormalAssignment()");
    }

    @Test
    public void testUnworkedHours() {
        this.evalScript("PMGTest.testUnworkedHours()");
    }

    @Test
    public void testMultipleWork() {
        this.evalScript("PMGTest.testMultipleWork()");
    }

    @Test
    public void testTooManyResources() {
        this.evalScript("PMGTest.testTooManyResources()");
    }

    @Test
    public void testNotEnoughResources() {
        this.evalScript("PMGTest.testNotEnoughResources()");
    }

    @Test
    public void testActivityFactor() {
        this.evalScript("PMGTest.testActivityFactor()");
    }

    @Test
    public void testBonusProject() {
        this.evalScript("PMGTest.testBonusProjectFactor()");
    }

    @Test
    public void testCompetenceRatioInf() {
        this.evalScript("PMGTest.testCompetenceRatioInf()");
    }

    @Test
    public void testCompetenceRatioSup() {
        this.evalScript("PMGTest.testCompetenceRatioSup()");
    }

    @Test
    public void testCoordInf() {
        this.evalScript("PMGTest.testCoordinationRatioInf()");
    }

    @Test
    public void testCoordSup() {
        this.evalScript("PMGTest.testCoordinationRatioSup()");
    }

    @Test
    public void testDiffLevel() {
        this.evalScript("PMGTest.testCoordinationRatioDiffLevel()");
    }

    @Test
    public void testDiffWorks() {
        this.evalScript("PMGTest.testCoordinationRatioInfDiffWorks()");
    }

    @Test
    public void testDiffWorks2() {
        this.evalScript("PMGTest.testCoordinationRatioInfDiffWorks2()");
    }

    @Test
    public void testDiffWorks3() {
        this.evalScript("PMGTest.testCoordinationRatioInfDiffWorks3()");
    }

    @Test
    public void testLearnFactor() {
        this.evalScript("PMGTest.testLearnFactor()");
    }

    @Test
    public void testMotivFactor() {
        this.evalScript("PMGTest.testMotivationFactor()");
    }

    @Test
    public void testOtherWork() {
        this.evalScript("PMGTest.testOtherWorkFactor()");
    }

    @Test
    public void testPredecessor() {
        this.evalScript("PMGTest.testPredecessorFactor()");
    }

    @Test
    public void testRandomDurationInf() {
        this.evalScript("PMGTest.testRandomDurationInf()");
    }

    @Test
    public void testRandomDurationSup() {
        this.evalScript("PMGTest.testRandomDurationSup()");
    }

    @Test
    public void testReqLimit() {
        this.evalScript("PMGTest.testRequirementLimit()");
    }

    @Test
    public void testUnassignable() {
        this.evalScript("PMGTest.testUnassignable()");
    }

    @Test
    public void testRemoveAssign() {
        this.evalScript("PMGTest.testremoveassign()");
    }

    @Test
    public void testUnworkwesReq() {
        this.evalScript("PMGTest.testUnworkedReq()");
    }
// */

    @Override
    protected String getGameModelPath() {
        return "src/main/webapp/wegas-private/wegas-pmg/db/wegas-pmg-gamemodel-simplePmg.json";
    }

    @Override
    protected String getScriptTestPath() {
        return "test-scripts/wegas-pmg-server-test-simplepmg.js";
    }
}
