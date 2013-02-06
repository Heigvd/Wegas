/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.variable.ListDescriptor;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.rest.util.JacksonMapperProvider;
import com.wegas.core.rest.util.Views;
import com.wegas.core.security.persistence.User;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import javax.ejb.EJB;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.persistence.*;
import javax.persistence.criteria.CriteriaBuilder;
import javax.persistence.criteria.CriteriaQuery;
import javax.persistence.criteria.Root;
import org.codehaus.jackson.map.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
@LocalBean
public class VariableDescriptorFacade extends AbstractFacadeImpl<VariableDescriptor> {

    private static final Logger logger = LoggerFactory.getLogger(VariableDescriptorFacade.class);
    /**
     *
     */
    @PersistenceContext(unitName = "wegasPU")
    private EntityManager em;
    /**
     *
     */
    @EJB
    private GameModelFacade gameModelFacade;

    /**
     *
     * @param variableDescriptor
     */
    @Override
    public void create(VariableDescriptor variableDescriptor) {
        throw new RuntimeException("Unable to call create on Variable descriptor. Use create(gameModelId, variableDescriptor) instead.");
    }

    /**
     *
     * @fixme Remove the patterne that getUsedNames, for get available name
     *
     * @param parentGameModel
     * @param variableDescriptor
     */
    public void create(GameModel parentGameModel, VariableDescriptor variableDescriptor) {
        List<String> usedNames = this.getUsedNames(parentGameModel.getId());

        //Fill name with editor Label if it is empty
        if (variableDescriptor.getName().isEmpty() || variableDescriptor.getName() == null) {
            variableDescriptor.setName(Helper.buildUniqueName(variableDescriptor.getLabel(), usedNames));
        }

        if (usedNames.contains(variableDescriptor.getName())) {                 //build a unique name
            variableDescriptor.setName(Helper.buildUniqueName(variableDescriptor.getName(), usedNames));
        }
        parentGameModel.addVariableDescriptor(variableDescriptor);
    }

    /**
     *
     * @param variableDescriptorId
     * @param entity
     * @return
     */
    public ListDescriptor createChild(Long variableDescriptorId, VariableDescriptor entity) {
        return this.createChild((ListDescriptor) this.find(variableDescriptorId), entity);
    }

    /**
     *
     * @fixme Remove the patterne that getUsedNames, for get available name
     *
     * @param listDescriptor
     * @param entity
     * @return
     */
    public ListDescriptor createChild(ListDescriptor listDescriptor, VariableDescriptor entity) {
        Iterator<VariableDescriptor> iterator = listDescriptor.getItems().iterator();
        List<String> usedNames = new ArrayList<>();
        while (iterator.hasNext()) {
            usedNames.add(iterator.next().getName());
        }
        if (entity.getName().isEmpty() || entity.getName() == null) {
            entity.setName(Helper.buildUniqueName(entity.getLabel(), usedNames));
        }
        //build a unique name
        if (usedNames.contains(entity.getName())) {
            entity.setName(Helper.buildUniqueName(entity.getName(), usedNames));
        }
        listDescriptor.addItem(entity);
        return listDescriptor;
    }

    /**
     *
     * @param gameModelId
     * @param variableDescriptor
     */
    public void create(Long gameModelId, VariableDescriptor variableDescriptor) {
        this.create(this.gameModelFacade.find(gameModelId), variableDescriptor);
    }

    /**
     *
     * @param entityId
     * @return
     * @throws IOException
     */
    @Override
    public VariableDescriptor duplicate(final Long entityId) throws IOException {

        ObjectMapper mapper = JacksonMapperProvider.getMapper();                // Retrieve a jackson mapper instance

        VariableDescriptor oldEntity = this.find(entityId);                     // Retrieve the entity to duplicate

        String serialized = mapper.writerWithView(Views.Export.class).
                writeValueAsString(oldEntity);                                  // Serialize the entity


        VariableDescriptor newEntity =
                mapper.readValue(serialized, VariableDescriptor.class);         // and deserialize it

        if (newEntity.getLabel() != null) {
            String newLabel = this.findAvailableLabel(oldEntity.getGameModel(),
                    newEntity.getLabel());                                          // Look up for an available label
            newEntity.setLabel(newLabel);
            if (newEntity.getEditorLabel() != null) {                               // Use with the same suffix for the editor label as the one used for the label
                newEntity.setEditorLabel(
                        Helper.stripLabelSuffix(newEntity.getEditorLabel())
                        + "(" + Helper.getLabelSuffix(newLabel) + ")");
            }
        }


        try {                                                                   // If the duplicated var is in a List
            ListDescriptor parentVar = this.findParentListDescriptor(oldEntity);// Add the entity to this list
            this.createChild(parentVar, newEntity);
            return parentVar;
        } catch (NoResultException e) {
            this.create(oldEntity.getGameModel(), newEntity);                   // Store the newly created entity in db
            return newEntity;                                                   // Otherwise return it directly
        }
    }

    /**
     *
     * @param gameModel
     * @param baseLabel
     * @return
     */
    public String findAvailableLabel(GameModel gameModel, String baseLabel) {
        int suff = 1;
        String base = Helper.stripLabelSuffix(baseLabel);
        String newLabel = baseLabel;
        while (true) {
            try {
                this.findByLabel(gameModel, newLabel);
            } catch (NoResultException e) {
                return newLabel;
            } catch (NonUniqueResultException e) {
            }
            newLabel = base + "(" + suff + ")";
            suff++;
        }
    }

    /**
     *
     * @param item
     * @return
     */
    public ListDescriptor findParentListDescriptor(VariableDescriptor item) {
        Query findListDescriptorByChildId = em.createNamedQuery("findListDescriptorByChildId");
        findListDescriptorByChildId.setParameter("itemId", item.getId());
        return (ListDescriptor) findListDescriptorByChildId.getSingleResult();
    }

    /**
     *
     * @param gameModel
     * @param name
     * @return
     */
    public VariableDescriptor findByName(GameModel gameModel, String name) {
        CriteriaBuilder cb = em.getCriteriaBuilder();
        CriteriaQuery cq = cb.createQuery();
        Root<User> variableDescriptor = cq.from(VariableDescriptor.class);
//        cq.where(cb.and(
//                cb.equal(variableDescriptor.get(VariableDescriptor_.gameModel), gameModel),
//                cb.equal(variableDescriptor.get(VariableDescriptor_.name), name)));
        cq.where(cb.and(
                cb.equal(variableDescriptor.get("gameModel"), gameModel),
                cb.equal(variableDescriptor.get("name"), name)));
        Query q = em.createQuery(cq);
        return (VariableDescriptor) q.getSingleResult();
    }

    /**
     *
     * @param gameModel
     * @param label
     * @return
     */
    public VariableDescriptor findByLabel(GameModel gameModel, String label) {
        CriteriaBuilder cb = em.getCriteriaBuilder();
        CriteriaQuery cq = cb.createQuery();
        Root<User> variableDescriptor = cq.from(VariableDescriptor.class);
        cq.where(cb.and(
                cb.equal(variableDescriptor.get("gameModel"), gameModel),
                cb.equal(variableDescriptor.get("label"), label)));
        Query q = em.createQuery(cq);
        return (VariableDescriptor) q.getSingleResult();
    }

    /**
     *
     * @param gameModelId
     * @return
     */
    public List<VariableDescriptor> findByGameModelId(Long gameModelId) {
        Query findByRootGameModelId = em.createNamedQuery("findVariableDescriptorsByRootGameModelId");
        findByRootGameModelId.setParameter("gameModelId", gameModelId);
        return findByRootGameModelId.getResultList();
    }

    /**
     *
     * @param gamemodel
     * @param variableDescriptorClass the filtering class
     * @return All specified classes and subclasses belonging to the game model.
     */
    public List<VariableDescriptor> findByClass(GameModel gamemodel, Class variableDescriptorClass) {

        CriteriaBuilder cb = em.getCriteriaBuilder();
        CriteriaQuery cq = cb.createQuery();
        Root<User> variableDescriptor = cq.from(variableDescriptorClass);
        // cq.where(cb.equal(variableDescriptor.get(VariableDescriptorEntity_.gameModel), gameModelId));
        cq.where(cb.equal(variableDescriptor.get("gameModel"), gamemodel));
        Query q = em.createQuery(cq);
        return q.getResultList();

        //Query findVariableDescriptorsByClass = em.createQuery("SELECT DISTINCT variableDescriptor FROM " + variableDescriptorClass.getSimpleName() + " variableDescriptor LEFT JOIN variableDescriptor.gameModel AS gm WHERE gm.id =" + gameModelId, variableDescriptorClass);
        //return findVariableDescriptorsByClass.getResultList();
    }

    /**
     *
     * @return
     */
    @Override
    protected EntityManager getEntityManager() {
        return em;
    }

    /**
     *
     */
    public VariableDescriptorFacade() {
        super(VariableDescriptor.class);
    }

    /**
     * Search for all used names for the given gamemodel.
     *
     * @deprecated
     * @param gameModelId the gamemodel id
     * @return a list of used strings
     */
    private List<String> getUsedNames(Long gameModelId) {
        List<String> unavailable = new ArrayList<>();
        List<VariableDescriptor> descriptors = this.findByGameModelId(gameModelId);
        for (VariableDescriptor d : descriptors) {
            unavailable.add(d.getName());
        }
        return unavailable;
    }
}
