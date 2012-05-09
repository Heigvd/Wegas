/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.core.ejb;

import com.wegas.core.persistence.game.GameEntity;
import com.wegas.core.persistence.game.GameModelEntity;
import com.wegas.core.persistence.game.PlayerEntity;
import com.wegas.core.persistence.game.TeamEntity;
import com.wegas.core.persistence.variable.primitive.StringDescriptorEntity;
import com.wegas.core.persistence.variable.primitive.StringInstanceEntity;
import com.wegas.core.persistence.variable.scope.TeamScopeEntity;
import java.util.HashMap;
import java.util.Map;
import javax.ejb.embeddable.EJBContainer;
import javax.naming.Context;
import javax.naming.NamingException;
import javax.persistence.EntityTransaction;
import junit.framework.Assert;
import org.junit.AfterClass;
import org.junit.BeforeClass;
import org.junit.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
public class GameModelFacadeTest {

    private static final Logger logger = LoggerFactory.getLogger(GameModelFacadeTest.class);
    protected static EntityTransaction tx;
    private static EJBContainer ejbContainer;
    private static Context context;
    private static GameModelFacade gameModelFacade;

    @BeforeClass
    public static void setUp() throws NamingException {
        System.out.println("[WeGAS Entity Test] Set up context...");

        Map<String, Object> properties = new HashMap<>();
        //properties.put(EJBContainer.MODULES,new File[]{new File("target/classes")});
        properties.put("org.glassfish.ejb.embedded.glassfish.installation.root", "./src/test/glassfish");
        ejbContainer = EJBContainer.createEJBContainer(properties);
        context = ejbContainer.getContext();

        gameModelFacade = lookupBy(GameModelFacade.class, GameModelFacadeBean.class);
    }

    @AfterClass
    public static void tearDown() {
        ejbContainer.close();
        System.out.println("Closing the container");
    }

    public static <T> T lookupBy(Class<T> type, Class service) throws NamingException {
        try {
            return (T) context.lookup("java:global/classes/" + service.getSimpleName() + "!" + type.getName());
        }
        catch (NamingException ex) {
            return (T) context.lookup("java:global/cobertura/" + service.getSimpleName() + "!" + type.getName());
        }
    }

    @Test
    public void createGameModel()  {
        // logger.debug("createGameModel() {}",this.lookupBy(GameModelFacadeBean.class, null));
        System.out.println("createGameModel()");
        String name = "test";

        GameModelEntity gameModel = new GameModelEntity();
        gameModel.setName(name);

        gameModelFacade.create(gameModel);
        Assert.assertEquals(1, gameModelFacade.findAll().size());

        gameModel = gameModelFacade.find(gameModel.getId());
        Assert.assertEquals(gameModel.getName(), name);

        gameModelFacade.remove(gameModel);
        Assert.assertEquals(0, gameModelFacade.findAll().size());
    }

    @Test
    public void createGame() {
        System.out.println("createGame()");
        String name = "test-game";
        String token = "test-game-token";

        GameModelEntity gameModel = new GameModelEntity();
        gameModel.setName("test-gamemodel");
        gameModelFacade.create(gameModel);

        StringDescriptorEntity stringDescriptor = new StringDescriptorEntity();
        stringDescriptor.setDefaultVariableInstance(new StringInstanceEntity());
        stringDescriptor.setName(name);
        stringDescriptor.setScope(new TeamScopeEntity());

        gameModel.addVariableDescriptor(stringDescriptor);
        gameModelFacade.flush();

        GameEntity g = new GameEntity();
        g.setName(name);
        g.setToken(token);
        TeamEntity t = new TeamEntity();
        t.setName("test-team");
        PlayerEntity p = new PlayerEntity();
        p.setName("test-player");

        gameModel.addGame(g);
        gameModelFacade.flush();

//        g.addTeam(t);
//        gameModelFacade.flush();

//        t.addPlayer(p);
//        gameModelFacade.flush();

        gameModelFacade.reset(gameModel.getId());


        gameModelFacade.remove(gameModel);
    }
}
