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

import com.wegas.core.persistence.game.GameModelEntity;
import java.util.HashMap;
import java.util.Map;
import javax.ejb.embeddable.EJBContainer;
import javax.naming.Context;
import javax.naming.NamingException;
import javax.persistence.EntityManager;
import javax.persistence.EntityManagerFactory;
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

//    public EventsInterface find() throws NamingException {
//        try {
//            return (EventsInterface) ctx.lookup("java:global/classes/TemperatureConverter");
//        }
//        catch (NamingException ex) {
//            return (EventsInterface) ctx.lookup("java:global/cobertura/TemperatureConverter!org.glassfish.embedded.tempconverter.EventsInterface");
//        }
//    }
    @BeforeClass
    public static void setUp() {
        System.out.println("[WeGAS Entity Test] Set up context...");

        Map<String, Object> properties = new HashMap<>();
        //properties.put(EJBContainer.MODULES,new File[]{new File("target/classes")});
        properties.put("org.glassfish.ejb.embedded.glassfish.installation.root", "./src/test/glassfish");
        ejbContainer = EJBContainer.createEJBContainer(properties);
        context = ejbContainer.getContext();
    }

    @AfterClass
    public static void tearDown() {
        ejbContainer.close();
        System.out.println("Closing the container");
    }

    public static <T> T lookupBy(Class<T> type, Class service) throws NamingException {
        try {
            return (T) context.lookup("java:global/classes/" + service.getSimpleName()+ "!" + type.getName());
        }
        catch (NamingException ex) {
            return (T) context.lookup("java:global/cobertura/" + service.getSimpleName() + "!" + type.getName());
        }
    }

    @Test
    public void createGameModel() throws Exception {
        // logger.debug("createGameModel() {}",this.lookupBy(GameModelFacadeBean.class, null));
        System.out.println("createGameModel()");

        GameModelFacade gameModelFacade = lookupBy(GameModelFacade.class, GameModelFacadeBean.class);

        System.out.println("createGameModel() {}" + gameModelFacade);
        String name = "test";

        GameModelEntity gameModel = new GameModelEntity();
        gameModel.setName(name);

        gameModelFacade.create(gameModel);
        Assert.assertEquals(gameModelFacade.findAll().size(), 1);

        gameModel = gameModelFacade.find(gameModel.getId());
        Assert.assertEquals(gameModel.getName(), name);

        gameModelFacade.remove(gameModel);
        Assert.assertEquals(gameModelFacade.findAll().size(), 0);
    }
}
