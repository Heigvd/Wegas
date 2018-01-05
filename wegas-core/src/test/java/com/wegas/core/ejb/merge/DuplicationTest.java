/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb.merge;

import ch.qos.logback.classic.Level;
import com.wegas.core.ejb.*;
import com.wegas.core.merge.patch.WegasPatch;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.test.TestHelper;
import com.wegas.test.arquillian.AbstractArquillianTestMinimal;
import java.io.IOException;
import org.junit.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Maxence
 */
public class DuplicationTest extends AbstractArquillianTestMinimal {

    private static final Logger logger = LoggerFactory.getLogger(DuplicationTest.class);

    //@BeforeClass
    public static void setLoggerLevels() {
        ((ch.qos.logback.classic.Logger) LoggerFactory.getLogger(ModelFacade.class)).setLevel(Level.DEBUG);
        ((ch.qos.logback.classic.Logger) LoggerFactory.getLogger(WegasPatch.class)).setLevel(Level.DEBUG);
        ((ch.qos.logback.classic.Logger) LoggerFactory.getLogger(VariableDescriptorFacade.class)).setLevel(Level.DEBUG);
        ((ch.qos.logback.classic.Logger) LoggerFactory.getLogger(VariableDescriptor.class)).setLevel(Level.DEBUG);

        ((ch.qos.logback.classic.Logger) logger).setLevel(Level.DEBUG);
    }

    @Test
    public void compareDuplication() throws CloneNotSupportedException, IOException {
        //GameModel gm = TestHelper.loadGameModelFromFile("../wegas-app/src/main/webapp/wegas-private/wegas-pmg/db/wegas-pmg-gamemodel-Artos.json");
        GameModel gm = TestHelper.loadGameModelFromFile("../wegas-app/src/test/resources/aLittleScenario.json");
        gameModelFacade.createWithDebugGame(gm);

        gm = gameModelFacade.find(gm.getId());

        long time0 = System.currentTimeMillis();

        GameModel copy = gameModelFacade.duplicateWithDebugGame(gm.getId());
        long time1 = System.currentTimeMillis();

        logger.error("Copy b {} ({} desc) created in {}", copy, copy.getVariableDescriptors().size(), time1 - time0);

        logger.error("Coucou");
    }
}
