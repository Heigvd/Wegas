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

import com.wegas.core.ejb.implementation.GameFacadeBean;
import com.wegas.core.ejb.implementation.GameModelFacadeBean;
import com.wegas.core.ejb.implementation.TeamFacadeBean;
import com.wegas.core.ejb.implementation.VariableDescriptorFacadeBean;
import com.wegas.core.persistence.game.GameEntity;
import com.wegas.core.persistence.game.GameModelEntity;
import com.wegas.core.persistence.game.PlayerEntity;
import com.wegas.core.persistence.game.TeamEntity;
import com.wegas.core.persistence.variable.primitive.StringDescriptorEntity;
import com.wegas.core.persistence.variable.primitive.StringInstanceEntity;
import com.wegas.core.persistence.variable.scope.TeamScopeEntity;
import java.io.File;
import java.util.HashMap;
import java.util.Map;
import javax.ejb.EJB;
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
        properties.put(EJBContainer.MODULES, new File[]{new File("target/classes")});
        properties.put("org.glassfish.ejb.embedded.glassfish.installation.root", "./src/test/glassfish");

       // properties.put(EJBContainer.APP_NAME, "wegas");
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
        return Helper.lookupBy(context, type, service);
    }
    @EJB
    private GameModelFacade gameModelFacade2;

    @Test
    public void createGameModel() throws NamingException {
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
    public void createGame() throws NamingException {
        System.out.println("createGame()");
        final String name = "test-game";
        final String token = "test-game-token";
        final String VALUE = "test-value";

//        context.bind("inject", this);

        GameModelEntity gameModel = new GameModelEntity();
        gameModel.setName("test-gamemodel");
        gameModelFacade.create(gameModel);

        GameFacade gf = lookupBy(GameFacade.class, GameFacadeBean.class);
        GameEntity g = new GameEntity();
        g.setName(name);
        g.setToken(token);
        gf.create(gameModel.getId(), g);

        TeamFacade tf = lookupBy(TeamFacade.class, TeamFacadeBean.class);
        TeamEntity t = new TeamEntity();
        t.setName("test-team");
        tf.create(g.getId(), t);

        PlayerEntity p = new PlayerEntity();
        p.setName("test-player");
        tf.createPlayer(t.getId(), p);


        VariableDescriptorFacade vd = lookupBy(VariableDescriptorFacade.class, VariableDescriptorFacadeBean.class);
        StringDescriptorEntity stringDescriptor = new StringDescriptorEntity();
        stringDescriptor.setDefaultVariableInstance(new StringInstanceEntity(VALUE));
        stringDescriptor.setName("test-descriptor");
        stringDescriptor.setScope(new TeamScopeEntity());
        vd.create(gameModel.getId(), stringDescriptor);

        Assert.assertEquals(VALUE, stringDescriptor.getVariableInstance(p).getValue());

        gameModelFacade.reset(gameModel.getId());


        gameModelFacade.remove(gameModel);
    }
}
