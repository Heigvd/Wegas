
/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.rest;

import com.wegas.core.ejb.GameModelFacade;
import com.wegas.core.ejb.JCRFacade;
import com.wegas.core.ejb.ModelFacade;
import com.wegas.core.ejb.RequestManager;
import com.wegas.core.ejb.VariableDescriptorFacade;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.exception.client.WegasNotFoundException;
import com.wegas.core.exception.internal.WegasNoResultException;
import com.wegas.core.jcr.content.AbstractContentDescriptor;
import com.wegas.core.jcr.content.ContentConnector;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.variable.DescriptorListI;
import com.wegas.core.persistence.variable.ModelScoped;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.scope.AbstractScope;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.List;
import java.util.Set;
import javax.ejb.Stateless;
import javax.inject.Inject;
import javax.ws.rs.Consumes;
import javax.ws.rs.DELETE;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.PUT;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Stateless
@Path("GameModel/{gameModelId: ([1-9][0-9]*)?}{sep: /?}VariableDescriptor")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class VariableDescriptorController {

    private static final Logger logger = LoggerFactory.getLogger(VariableDescriptorController.class);

    /**
     *
     */
    @Inject
    private VariableDescriptorFacade variableDescriptorFacade;

    /**
     *
     */
    @Inject
    private GameModelFacade gameModelFacade;

    @Inject
    private ModelFacade modelFacade;

    @Inject
    private RequestManager requestManager;

    /**
     * @param gameModelId
     *
     * @return all root level variable descriptors
     */
    @GET
    public Collection<VariableDescriptor> index(@PathParam("gameModelId") Long gameModelId) {

        GameModel gameModel = gameModelFacade.find(gameModelId);

        // Return all variable descriptors
        return gameModel.getVariableDescriptors();
    }

    @POST
    @Path("ByIds")
    public Collection<VariableDescriptor> getByIds(@PathParam("gameModelId") Long gameModelId, List<Long> ids) {
        Collection<VariableDescriptor> descriptors = new ArrayList<>();
        for (Long id : ids) {
            VariableDescriptor desc = variableDescriptorFacade.find(id);
            descriptors.add(desc);
        }
        return descriptors;
    }

    /**
     * @param entityId
     *
     * @return variable descriptor with the given id
     */
    @GET
    @Path("{entityId : [1-9][0-9]*}")
    public VariableDescriptor get(@PathParam("entityId") Long entityId) {
        VariableDescriptor vd = variableDescriptorFacade.find(entityId);

        return vd;
    }

    /**
     * Add new descriptor at GameModel root level
     *
     * @param gameModelId the game model
     * @param entity      the new descriptor
     *
     * @return the new variable descriptor
     */
    @POST
    public VariableDescriptor create(@PathParam("gameModelId") Long gameModelId,
        VariableDescriptor entity) {

        this.variableDescriptorFacade.create(gameModelId, entity);
        return entity;
    }

    /**
     * Add new descriptor in the given gameModel as a child of the descriptor identified by entityId
     *
     * @param entityId the parent descriptor id
     * @param entity   the new descriptor
     *
     * @return the new descriptor
     */
    @POST
    @Path("{variableDescriptorId : [1-9][0-9]*}")
    public VariableDescriptor createChild(@PathParam("variableDescriptorId") Long entityId, VariableDescriptor entity) {

        return variableDescriptorFacade.createChild(entityId, entity);
    }

    /**
     * Add new descriptor in the given gameModel as a child of the descriptor identified by
     * entityName
     *
     * @param gameModelId
     * @param entityName  parent entity, identified by its name
     * @param entity      Entity to add
     *
     * @return the new descriptor
     */
    @POST
    @Path("{variableDescriptorName : [_a-zA-Z][_a-zA-Z0-9]*}")
    public VariableDescriptor createChild(@PathParam("gameModelId") Long gameModelId,
        @PathParam("variableDescriptorName") String entityName, VariableDescriptor entity) {

        try {
            GameModel gm = gameModelFacade.find(gameModelId);
            VariableDescriptor parent = variableDescriptorFacade.find(gm, entityName);

            if (parent instanceof DescriptorListI) {
                return variableDescriptorFacade.createChild(gm, (DescriptorListI) parent, entity, false);
            } else {
                throw WegasErrorMessage.error("Parent entity does not allow children");
            }
        } catch (WegasNoResultException ex) {
            throw new WegasNotFoundException("Variable " + entityName + " does not exists");
        }
    }

    /**
     * @param entityId
     * @param entity
     *
     * @return up to date entity
     */
    @PUT
    @Path("{entityId: [1-9][0-9]*}")
    public VariableDescriptor update(@PathParam("entityId") Long entityId, VariableDescriptor entity) {
        return variableDescriptorFacade.update(entityId, entity);
    }

    @PUT
    @Path("{id: [1-9][0-9]*}/visibility/{visibility: [A-Z]*}")
    public VariableDescriptor resetVisibilities(@PathParam("id") Long vdId,
        @PathParam("visibility") ModelScoped.Visibility visibility) {
        return variableDescriptorFacade.resetVisibility(vdId, visibility);
    }

    @PUT
    @Path("{id: [1-9][0-9]*}/release")
    public VariableDescriptor releaseFromModel(@PathParam("id") Long vdId) {
        return modelFacade.releaseVariableFromModel(vdId);
    }

    @PUT
    @Path("{id: [1-9][0-9]*}/changeScope/{scopeType: GameModelScope|TeamScope|PlayerScope}")
    public VariableDescriptor changeScopeRecursively(@PathParam("id") Long vdId,
        @PathParam("scopeType") AbstractScope.ScopeType scopeType) {
        return variableDescriptorFacade.changeScopeRecursively(vdId, scopeType);
    }

    @PUT
    @Path("{id: [1-9][0-9]*}/ConvertToText")
    public VariableDescriptor convertToText(@PathParam("id") Long vdId) {
        return variableDescriptorFacade.convertToText(vdId);
    }

    @PUT
    @Path("{id: [1-9][0-9]*}/ConvertToStaticText")
    public VariableDescriptor convertToStaticText(@PathParam("id") Long vdId) {
        return variableDescriptorFacade.convertToStaticText(vdId);
    }

    /**
     * @param descriptorId
     * @param index
     */
    @PUT
    @Path("{descriptorId: [1-9][0-9]*}/Move/{index: [0-9]*}")
    public void move(@PathParam("descriptorId") Long descriptorId, @PathParam("index") int index) {
        variableDescriptorFacade.move(descriptorId, index);
    }

    /**
     * @param descriptorId
     * @param parentDescriptorId
     * @param index
     */
    @PUT
    @Path("{descriptorId: [1-9][0-9]*}/Move/{parentDescriptorId: [1-9][0-9]*}/{index: [0-9]*}")
    public void move(@PathParam("descriptorId") Long descriptorId,
        @PathParam("parentDescriptorId") Long parentDescriptorId,
        @PathParam("index") int index) {
        variableDescriptorFacade.move(descriptorId, parentDescriptorId, index);
    }

    /**
     * Make a descriptor copy that will stands at the same level
     *
     * @param entityId
     *
     * @return the new descriptor
     *
     */
    @POST
    @Path("{entityId: [1-9][0-9]*}/Duplicate")
    public VariableDescriptor duplicate(@PathParam("entityId") Long entityId) throws CloneNotSupportedException {

        VariableDescriptor duplicate = variableDescriptorFacade.duplicate(entityId);

        return duplicate;
    }

    /**
     *
     * @param entityId
     *
     * @return up to date descriptor container which contains sorted children
     */
    @GET
    @Path("{entityId: [1-9][0-9]*}/Sort")
    public VariableDescriptor sort(@PathParam("entityId") Long entityId) {
        return variableDescriptorFacade.sort(entityId);
    }

    /**
     * @param entityId
     *
     * @return just deleted descriptor
     */
    @DELETE
    @Path("{entityId: [1-9][0-9]*}")
    public VariableDescriptor delete(@PathParam("entityId") Long entityId) {
        VariableDescriptor entity = variableDescriptorFacade.find(entityId);

        variableDescriptorFacade.remove(entity.getId());
        return entity;
    }

    /**
     * Resets all the variables of a given game model
     *
     * @param gameModelId game model id
     *
     * @return HTTP 200 OK
     */
    @GET
    @Path("Reset")
    public Response reset(@PathParam("gameModelId") Long gameModelId) {

        GameModel gm = gameModelFacade.find(gameModelId);
        requestManager.assertUpdateRight(gm);

        gameModelFacade.reset(gameModelId);
        return Response.ok().build();
    }

    /**
     *
     * @param gameModelId
     * @param criteria
     *
     * @return list of descriptor id matching criteria
     */
    @POST
    @Path("contains")
    @Consumes(MediaType.TEXT_PLAIN)
    public Set<Long> idsContains(@PathParam("gameModelId") Long gameModelId, String criteria) {
        GameModel gm = gameModelFacade.find(gameModelId);
        requestManager.assertUpdateRight(gm);

        return gameModelFacade.findMatchingDescriptorIds(gameModelId, criteria);
    }

    /**
     *
     * @param gameModelId
     * @param criteria
     *
     * @return list of descriptor id matching all criterias
     */
    @POST
    @Path("containsAll")
    @Consumes(MediaType.TEXT_PLAIN)
    public Set<Long> idsContainsAll(@PathParam("gameModelId") Long gameModelId, String criteria) {
        GameModel gm = gameModelFacade.find(gameModelId);
        requestManager.assertUpdateRight(gm);

        List<String> criterias = new ArrayList<>(Arrays.asList(criteria.trim().split("[ ,]+")));
        criterias.remove("");

        return gameModelFacade.findMatchingDescriptorIds(gameModelId, criterias);
    }

    /**
     * Import a variable from the source gameModel and import it within the target gameModel. Such
     * an import is recursive and all referenced files are
     * {@link JCRFacade#importFile(AbstractContentDescriptor, ContentConnector) imported} too.
     * <p>
     * Such imported files may be renamed to avoid overriding preexisting files.
     * <p>
     * /**
     * Import a variable from another gameModel
     *
     * @param gameModelId  the gameModel in which to put the variable
     * @param vdId         the variable to import
     * @param vdName       the name of the target (new) variable
     * @param newScopeType if set, change scope recursively
     *
     * @return
     */
    @POST
    @Path("CherryPick/{vdId: [1-9][0-9]*}/{vdName: [A-Za-z0-9_$]*}{sep2: /?}{newScopeType: (PlayerScope|TeamScope|GameModelScope)?}")
    public VariableDescriptor cherryPick(
        @PathParam("gameModelId") Long gameModelId,
        @PathParam("vdId") Long vdId,
        @PathParam("vdName") String vdName,
        @PathParam("newScopeType") AbstractScope.ScopeType newScopeType) {

        VariableDescriptor vd = variableDescriptorFacade.find(vdId);
        GameModel source = vd.getGameModel();

        return variableDescriptorFacade.cherryPick(gameModelId, vd.getName(), source.getId(), vdName, newScopeType);
    }

    /**
     * Convert class name to a VariableDescriptor Class
     *
     * @param className fullclass name (with package)
     *
     * @return the class matching the className
     */
    private Class<? extends VariableDescriptor> getClassByName(String className) {
        try {
            Class<?> loadClass = this.getClass().getClassLoader().loadClass(className);
            if (VariableDescriptor.class.isAssignableFrom(loadClass)) {
                return (Class<? extends VariableDescriptor>) loadClass;
            } else {
                throw WegasErrorMessage.error("Such class is not as variable descriptor: " + className);
            }
        } catch (ClassNotFoundException ex) {
            logger.error("Class not found");
            throw WegasErrorMessage.error("Such variable type does not exists: " + className);
        }
    }

    /**
     * Fetch list of readable pickable variable.
     *
     * @param varType
     *
     * @return list of tuple : gameModel.id, gameModel.name, vd.id, vd.name, vd.label
     */
    @GET
    @Path("FetchWriteablePickable/{variableType : .+}")
    public Collection<VariableDescriptorFacade.VariableIndex> fetchPickable(@PathParam("variableType") String varType) {

        return variableDescriptorFacade.fetchCherryPickable(getClassByName(varType), true);
    }

    /**
     * Fetch list of all pickable variable.
     *
     * @param varType
     *
     * @return list of tuple : gameModel.id, gameModel.name, vd.id, vd.name, vd.label
     */
    @GET
    @Path("FetchAllPickable/{variableType : .+}")
    public Collection<VariableDescriptorFacade.VariableIndex> fetchReadablePickable(@PathParam("variableType") String varType) {

        return variableDescriptorFacade.fetchCherryPickable(getClassByName(varType), false);
    }
}
