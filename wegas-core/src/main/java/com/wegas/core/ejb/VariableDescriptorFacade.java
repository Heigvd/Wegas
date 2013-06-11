/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.wegas.core.Helper;
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
    public void create(final VariableDescriptor variableDescriptor) {
        throw new WegasException("Unable to call create on Variable descriptor. Use create(gameModelId, variableDescriptor) instead.");
    }

    /**
     *
     * @fixme Remove the pattern that getUsedNames, for get available name
     *
     * @param parentGameModel
     * @param variableDescriptor
     */
    public void create(final GameModel parentGameModel, final VariableDescriptor variableDescriptor) {
        final List<String> usedNames = this.getUsedNames(parentGameModel.getId());

        if (variableDescriptor.getLabel() == null) {
            variableDescriptor.setLabel((variableDescriptor.getName() == null)
                    ? "unnamed" : variableDescriptor.getName());
        }

        //Fill name with label if it is empty
        if (variableDescriptor.getName() == null || variableDescriptor.getName().isEmpty()) {
            variableDescriptor.setName(Helper.buildUniqueName(variableDescriptor.getLabel(), usedNames));
        }

        if (usedNames.contains(variableDescriptor.getName())) {                 //build a unique name
            variableDescriptor.setName(Helper.buildUniqueName(variableDescriptor.getName(), usedNames));
        }
        parentGameModel.addItem(variableDescriptor);
    }

    /**
     *
     * @param variableDescriptorId
     * @param entity
     * @return
     */
    public DescriptorListI createChild(final Long variableDescriptorId, final VariableDescriptor entity) {
        return this.createChild((DescriptorListI) this.find(variableDescriptorId), entity);
    }

    /**
     *
     * @fixme Remove the pattern that getUsedNames, for get available name
     *
     * @param listDescriptor
     * @param entity
     * @return
     */
    public DescriptorListI createChild(final DescriptorListI listDescriptor, final VariableDescriptor entity) {
        final Iterator<VariableDescriptor> iterator = listDescriptor.getItems().iterator();
        final List<String> usedNames = new ArrayList<>();
        while (iterator.hasNext()) {
            usedNames.add(iterator.next().getName());
        }
        if (entity.getName() == null || entity.getName().isEmpty()) {
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
    public void create(final Long gameModelId, final VariableDescriptor variableDescriptor) {
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

        final ObjectMapper mapper = JacksonMapperProvider.getMapper();          // Retrieve a jackson mapper instance

        final VariableDescriptor oldEntity = this.find(entityId);               // Retrieve the entity to duplicate

        String serialized = mapper.writerWithView(Views.Export.class).
                writeValueAsString(oldEntity);                                  // Serialize the entity

        final VariableDescriptor newEntity =
                mapper.readValue(serialized, VariableDescriptor.class);         // and deserialize it

        if (newEntity.getLabel() != null) {
            final String newLabel = this.findAvailableLabel(oldEntity.getGameModel(),
                    newEntity.getLabel());                                      // Look up for an available label
            newEntity.setLabel(newLabel);
            if (newEntity.getEditorLabel() != null) {// Use with the same suffix for the editor label as the one used for the label
                newEntity.setEditorLabel(
                        Helper.stripLabelSuffix(newEntity.getEditorLabel())
                        + "(" + Helper.getLabelSuffix(newLabel) + ")");
            }
        }

        DescriptorListI list = this.findParentList(oldEntity);
        if (list instanceof GameModel) {                                        // If the duplicated var is at root level
            this.create(oldEntity.getGameModel(), newEntity);                   // store the newly created entity in db create it at root level
            return newEntity;                                                   // and return it directly
        } else {                                                                // Otherwise it's in a descriptor
            this.createChild(list, newEntity);                                  // Add the entity to this list
            return (VariableDescriptor) list;
        }
    }

    private DescriptorListI findParentList(VariableDescriptor vd) throws NoResultException {
        if (vd instanceof ChoiceDescriptor) {                                   // QuestionDescriptor descriptor case
            return ((ChoiceDescriptor) vd).getQuestion();
        } else {
            try {
                return this.findParentListDescriptor(vd);                           // ListDescriptor case
            } catch (NoResultException e) {                                         // Descriptor is at root level
                return vd.getGameModel();
            }
        }
    }

    /**
     *
     * @param gameModel
     * @param baseLabel
     * @return
     */
    public String findAvailableLabel(final GameModel gameModel, final String baseLabel) {
        int suff = 1;
        final String base = Helper.stripLabelSuffix(baseLabel);
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
    public VariableDescriptor findByName(final GameModel gameModel, final String name) {
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
    public List<VariableDescriptor> findAllByGameModelId(final Long gameModelId) {
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
    private List<String> getUsedNames(final Long gameModelId) {
        final List<String> unavailable = new ArrayList<>();
        final List<VariableDescriptor> descriptors = this.findAllByGameModelId(gameModelId);
        for (VariableDescriptor d : descriptors) {
            unavailable.add(d.getName());
        }
        return unavailable;
    }

    public void move(final Long descriptorId, final int index) {
        final VariableDescriptor vd = this.find(descriptorId);

        this.findParentList(vd).remove(vd);
        vd.getGameModel().addItem(index, vd);
    }

    public void move(final Long descriptorId, final Long targetListDescriptorId, final int index) {
        final VariableDescriptor vd = this.find(descriptorId);
        final DescriptorListI targetList = (DescriptorListI) this.find(targetListDescriptorId);

        this.findParentList(vd).remove(vd);
        targetList.addItem(index, vd);
    }
}
