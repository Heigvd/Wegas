/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.wegas.core.persistence.game.Game;
import java.util.List;
import javax.naming.NamingException;
import junit.framework.Assert;
import org.junit.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
public class GameFacadeTest extends AbstractEJBTest {

    private static final Logger logger = LoggerFactory.getLogger(GameFacadeTest.class);

    @Test
    public void testFindRegisteredGames() throws NamingException {
        logger.info("testFindRegisteredGames()");

        final GameFacade gameFacade = lookupBy(GameFacade.class);
        final List<Game> registeredGames = gameFacade.findRegisteredGames(Long.valueOf(99999));
        Assert.assertEquals(0, registeredGames.size());
    }
}
