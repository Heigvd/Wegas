/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.wegas.core.Helper;
import com.wegas.core.event.DescriptorRevivedEvent;
import com.wegas.core.exception.WegasException;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.variable.ListDescriptor;
import com.wegas.core.persistence.variable.DescriptorListI;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.rest.util.JacksonMapperProvider;
import com.wegas.core.rest.util.Views;
import com.wegas.core.security.persistence.User;
import com.wegas.mcq.persistence.ChoiceDescriptor;
import java.io.IOException;
import java.util.List;
import javax.ejb.EJB;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.enterprise.event.Event;
import javax.inject.Inject;
import javax.naming.NamingException;
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
    private static final String DEFAULTVARIABLENAME = "variable";
    private static final String DEFAULTVARIABLELABEL = "Unnammed";
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
     */
    public VariableDescriptorFacade() {
        super(VariableDescriptor.class);
    }

    /**
     *
     * @param variableDescriptor
     */
    @Override
    public void create(final VariableDescriptor variableDescriptor) {
        throw new WegasException("Unable to call create on Variable descriptor. Use create(gameModelId, variableDescriptor) instead.");
    }

    /**
     *
     *
     * @param listDescriptor
     * @param entity
     * @return
     */
    public DescriptorListI createChild(final GameModel gameModel, final DescriptorListI list, final VariableDescriptor entity) {
        List<String> findDistinctNames = this.findDistinctNames(gameModel);

        list.addItem(entity);

        if (isNullOrEmpty(entity.getLabel()) && !isNullOrEmpty(entity.getName())) { // 1st case: only name is provided
            entity.setLabel(entity.getName());
        } else if (!isNullOrEmpty(entity.getLabel()) && isNullOrEmpty(entity.getName())) { // 2nd case: fill name with label if it is empty
            entity.setName(entity.getLabel());
        }
        if (isNullOrEmpty(entity.getLabel())) {                                 // Still no label, place a default
            entity.setLabel("Unnamed");
        }
        if (isNullOrEmpty(entity.getName())) {                                  // Still no name, place a default
            entity.setName("variable");
        }
        entity.setName(Helper.encodeVariableName(entity.getName()));            // Camel casify the name

        this.findUniqueName(entity, findDistinctNames);                         // Check name and label availability
        this.findUniqueLabel(entity);

        this.revive(entity);
        return list;
    }
    @Inject
    private Event<DescriptorRevivedEvent> descriptorRevivedEvent;

    /**
     *
     * @param entity
     */
    public void revive(VariableDescriptor entity) {

        descriptorRevivedEvent.fire(new DescriptorRevivedEvent(entity));

        if (entity instanceof DescriptorListI) {
            for (Object vd : ((DescriptorListI) entity).getItems()) {
                this.revive((VariableDescriptor) vd);
            }
        }
    }

    /**
     *
     * @param variableDescriptorId
     * @param entity
     * @return
     */
    public DescriptorListI createChild(final Long variableDescriptorId, final VariableDescriptor entity) {
        VariableDescriptor find = this.find(variableDescriptorId);
        return this.createChild(find.getGameModel(), (DescriptorListI) find, entity);
    }

    /**
     *
     * @param gameModelId
     * @param variableDescriptor
     */
    public void create(final Long gameModelId, final VariableDescriptor variableDescriptor) {
        GameModel find = this.gameModelFacade.find(gameModelId);
        this.createChild(find, find, variableDescriptor);
    }

    /**
     *
     * @param entityId
     * @return
     * @throws IOException
     */
    @Override
    public VariableDescriptor duplicate(final Long entityId) throws IOException {

        final VariableDescriptor oldEntity = this.find(entityId);               // Retrieve the entity to duplicate

        final ObjectMapper mapper = JacksonMapperProvider.getMapper();          // Retrieve a jackson mapper instance
        final String serialized = mapper.writerWithView(Views.Export.class).
                writeValueAsString(oldEntity);                                  // Serialize the entity
        final VariableDescriptor newEntity =
                mapper.readValue(serialized, VariableDescriptor.class);         // and deserialize it

        final DescriptorListI list = this.findParentList(oldEntity);
        this.createChild(oldEntity.getGameModel(), list, newEntity);
        return newEntity;
    }

    public DescriptorListI findParentList(VariableDescriptor vd) throws NoResultException {
        if (vd instanceof ChoiceDescriptor) {                                   // QuestionDescriptor descriptor case
            return ((ChoiceDescriptor) vd).getQuestion();
        } else {
            try {
                return this.findParentListDescriptor(vd);                       // ListDescriptor case
            } catch (NoResultException e) {                                     // Descriptor is at root level
                return vd.getGameModel();
            }
        }
    }

    public void findUniqueName(final VariableDescriptor vd, List<String> usedNames) {
        if (isNullOrEmpty(vd.getName())) {
            vd.setName(DEFAULTVARIABLENAME);
        }

        vd.setName(Helper.encodeVariableName(vd.getName()));

        int suff = 1;
        final String baseName = vd.getName();
        String newName = vd.getName();
        while (usedNames.contains(newName)) {
            newName = baseName + "_" + suff;
            suff++;
        }

        vd.setName(newName);
        usedNames.add(newName);
        if (vd instanceof DescriptorListI) {
            for (Object child : ((DescriptorListI) vd).getItems()) {            // Recursively find unique names for children
                this.findUniqueName((VariableDescriptor) child, usedNames);
            }
        }
    }

    public void findUniqueLabel(final VariableDescriptor vd) {
        if (isNullOrEmpty(vd.getLabel())) {
            vd.setLabel(DEFAULTVARIABLELABEL);
        }

        int suff = 1;
        final String baseLabel = Helper.stripLabelSuffix(vd.getLabel());
        String newLabel = vd.getLabel();
        boolean found = false;
        while (!found) {
            try {
                VariableDescriptor findByLabel = this.findByLabel(vd.getGameModel(), newLabel);
                if (findByLabel != vd) {
                    newLabel = baseLabel + "(" + suff + ")";                        // Use with the same suffix for the editor label as the one used for the label
                    suff++;
                } else {
                    found = true;
                }
            } catch (NoResultException e) {
                found = true;
            } catch (NonUniqueResultException e) {
                // Should never happen
                newLabel = baseLabel + "(" + suff + ")";                        // Use with the same suffix for the editor label as the one used for the label
                suff++;
            }
        }
        vd.setLabel(newLabel);
    }

    /**
     *
     * @param item
     * @return
     */
    public ListDescriptor findParentListDescriptor(final VariableDescriptor item) {
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
    public VariableDescriptor find(final GameModel gameModel, final String name) {
        final CriteriaBuilder cb = em.getCriteriaBuilder();
        final CriteriaQuery cq = cb.createQuery();
        final Root<User> variableDescriptor = cq.from(VariableDescriptor.class);
//        cq.where(cb.and(
//                cb.equal(variableDescriptor.get(VariableDescriptor_.gameModel), gameModel),
//                cb.equal(variableDescriptor.get(VariableDescriptor_.name), name)));
        cq.where(cb.and(
                cb.equal(variableDescriptor.get("gameModel"), gameModel),
                cb.equal(variableDescriptor.get("name"), name)));
        final Query q = em.createQuery(cq);
        return (VariableDescriptor) q.getSingleResult();
    }

    public List<String> findDistinctNames(final GameModel gameModel) {
        Query distinctNames = em.createQuery("SELECT DISTINCT(var.name) FROM VariableDescriptor var WHERE var.gameModel = :gameModel");
        distinctNames.setParameter("gameModel", gameModel);
        return distinctNames.getResultList();
    }

    public List<String> findDistinctLabels(final GameModel gameModel) {
        Query distinctNames = em.createQuery("SELECT DISTINCT(var.label) FROM VariableDescriptor var WHERE var.gameModel = :gameModel");
        distinctNames.setParameter("gameModel", gameModel);
        return distinctNames.getResultList();
    }

    /**
     * For backward compatibility, use find(final GameModel gameModel, final
     * String name) instead.
     *
     * @deprecated
     * @param gameModel
     * @param name
     * @return
     */
    public VariableDescriptor findByName(final GameModel gameModel, final String name) {
        return this.find(gameModel, name);
    }

    /**
     *
     * @param gameModel
     * @param label
     * @return
     */
    public VariableDescriptor findByLabel(final GameModel gameModel, final String label) {
        final CriteriaBuilder cb = em.getCriteriaBuilder();
        final CriteriaQuery cq = cb.createQuery();
        final Root<User> variableDescriptor = cq.from(VariableDescriptor.class);
        cq.where(cb.and(
                cb.equal(variableDescriptor.get("gameModel"), gameModel),
                cb.equal(variableDescriptor.get("label"), label)));
        final Query q = em.createQuery(cq);
        return (VariableDescriptor) q.getSingleResult();
    }

    /**
     *
     * @param gameModelId
     * @return
     */
    public List<VariableDescriptor> findAll(final Long gameModelId) {
        final Query findByRootGameModelId = em.createNamedQuery("findVariableDescriptorsByRootGameModelId");
        findByRootGameModelId.setParameter("gameModelId", gameModelId);
        return findByRootGameModelId.getResultList();
    }

    public List<VariableDescriptor> findByGameModelId(final Long gameModelId) {
        return gameModelFacade.find(gameModelId).getChildVariableDescriptors();
    }

    /**
     *
     * @param gamemodel
     * @param variableDescriptorClass the filtering class
     * @return All specified classes and subclasses belonging to the game model.
     */
    public List<VariableDescriptor> findByClass(final GameModel gamemodel, final Class variableDescriptorClass) {

        final CriteriaBuilder cb = em.getCriteriaBuilder();
        final CriteriaQuery cq = cb.createQuery();
        final Root<User> variableDescriptor = cq.from(variableDescriptorClass);
        // cq.where(cb.equal(variableDescriptor.get(VariableDescriptorEntity_.gameModel), gameModelId));
        cq.where(cb.equal(variableDescriptor.get("gameModel"), gamemodel));
        final Query q = em.createQuery(cq);
        return q.getResultList();

        //Query findVariableDescriptorsByClass = em.createQuery("SELECT DISTINCT variableDescriptor FROM " + variableDescriptorClass.getSimpleName() + " variableDescriptor LEFT JOIN variableDescriptor.gameModel AS gm WHERE gm.id =" + gameModelId, variableDescriptorClass);
        //return findVariableDescriptorsByClass.getResultList();
    }

    private void move(final Long descriptorId, final DescriptorListI targetListDescriptor, final int index) {
        final VariableDescriptor vd = this.find(descriptorId);                  // Remove from the previous list
        this.findParentList(vd).remove(vd);

        targetListDescriptor.addItem(index, vd);                                // Then add to the new one
    }

    /**
     * This method will move the target entity to the root level of the game
     * model at index i
     *
     * @param descriptorId
     * @param index
     */
    public void move(final Long descriptorId, final int index) {
        this.move(descriptorId, this.find(descriptorId).getGameModel(), index);
    }

    /**
     *
     *
     * @param descriptorId
     * @param targetListDescriptorId
     * @param index
     */
    public void move(final Long descriptorId, final Long targetListDescriptorId, final int index) {
        this.move(descriptorId, (DescriptorListI) this.find(targetListDescriptorId), index);
    }

    /**
     *
     * @return
     */
    @Override
    protected EntityManager getEntityManager() {
        return em;
    }

    private boolean isNullOrEmpty(final String t) {
        return t == null || t.isEmpty();
    }

    /**
     *
     * @return
     */
    public static VariableDescriptorFacade lookup() {
        try {
            return Helper.lookupBy(VariableDescriptorFacade.class);
        } catch (NamingException ex) {
            logger.error("Error retrieving requestmanager", ex);
            return null;
        }
    }
}
