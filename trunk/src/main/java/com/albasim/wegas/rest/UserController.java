/*
 * Wegas. 
 * http://www.albasim.com/wegas/
 * 
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem⁺
 *
 * Copyright (C) 2011 
 */
package com.albasim.wegas.rest;

import com.albasim.wegas.ejb.UserManager;

import com.albasim.wegas.persistence.users.UserEntity;

import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;

import javax.ejb.EJB;
import javax.ejb.Stateless;

import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.Consumes;
import javax.ws.rs.DELETE;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.PUT;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
@Path("user")
public class UserController {

    private static final Logger logger = Logger.getLogger("Authoring_GM");


    @Context
    private HttpServletRequest request;


    @EJB
    private UserManager ue;


    /**
     * Index : retrieve the game model list
     * 
     * @return 
     */
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public List<UserEntity> index() {
        List<UserEntity> users = ue.getUsers();
        return users;
    }


    /**
     * Retrieve a specific game model
     * @param gmID game model id
     * @return OK
     */
    @GET
    @Path("{userId : [1-9][0-9]*}")
    @Produces(MediaType.APPLICATION_JSON)
    public UserEntity get(@PathParam("userId") Long userId) {
        UserEntity u = ue.getUser(userId);
        return u;
    }


    /**
     * 
     * @param is
     * @return 
     */
    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public UserEntity create(UserEntity u) {
        logger.log(Level.INFO, "POST GameModel");
        ue.createUser(u);
        return u;
    }


    /**
     * 
     * @param gmID
     * @return 
     */
    @PUT
    @Path("{userId: [1-9][0-9]*}")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public UserEntity update(@PathParam("userId") Long userId, UserEntity user) {
        return ue.updateUser(userId, user);
    }


    /**
     * 
     * @param gmID
     * @return 
     */
    @DELETE
    @Path("{userId: [1-9][0-9]*}")
    public Response destroy(@PathParam("userId") Long userId) {
        ue.destroyGameModel(userId);
        return Response.noContent().build();
    }
}
