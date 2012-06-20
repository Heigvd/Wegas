/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.core.rest;

import com.wegas.core.ejb.GameModelFacade;
import com.wegas.core.persistence.game.Script;
import com.wegas.totest.Test;
import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.persistence.EntityManager;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
@Path("GameModel")
public class GameModelController extends AbstractRestController<GameModelFacade> {

    private static final Logger logger = LoggerFactory.getLogger(GameModelController.class);
    /**
     *
     */
    @EJB
    private GameModelFacade gameModelFacade;

    /**
     *
     * @return
     */
    @Override
    protected GameModelFacade getFacade() {
        return gameModelFacade;
    }
    /*
     * @GET @Path("{gameModelId : [1-9][0-9]*}/Widget/")
     * @Produces(MediaType.APPLICATION_JSON) public List<WidgetEntity>
     * getWidgets(@PathParam("gameModelId") Long gameModelId) { return
     * gameModelFacade.find(gameModelId).getWidgets(); }
     */

    @GET
    @Path("/test/")
    public Object test() {
        EntityManager em = gameModelFacade.getEntityManager();
        Test t = new Test();
//        t.addPhone("mm",new TestEmbedded("mm"));
        t.addPhone("mm",new Script("JavaScript", "mm"));
       // t.setId(2002L);
        System.out.println("one");
        em.persist(t);
        em.flush();
        System.out.println("one");
        System.out.println(t.getId()+"*"+ t.getPhones());
        Test t2 = (Test) em.find(Test.class, t.getId());
        System.out.println(t2.getId()+"*"+ t2.getPhones());
        return t;

    }
    @GET
    @Path("/test2/")
    public Object test2() {
        EntityManager em = gameModelFacade.getEntityManager();

        //t.setId(2002);
        System.out.println("one");
//        Test t2 = (Test) em.find(Test.class, new Long(1));
        Test t2 = (Test) em.find(Test.class, new Long(1));
        System.out.println(t2.getId()+"*"+ t2.getPhones());
        return t2;

    }
}
