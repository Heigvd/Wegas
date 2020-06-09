/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import ch.albasim.wegas.annotations.ProtectionLevel;
import com.wegas.core.AlphanumericComparator;
import com.wegas.core.Helper;
import com.wegas.core.api.VariableDescriptorFacadeI;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.exception.internal.WegasNoResultException;
import com.wegas.core.i18n.persistence.TranslatableContent;
import com.wegas.core.jcr.content.AbstractContentDescriptor;
import com.wegas.core.jcr.content.ContentConnector;
import com.wegas.core.jcr.content.ContentConnector.WorkspaceType;
import com.wegas.core.jcr.content.DescriptorFactory;
import com.wegas.core.jcr.jta.JCRConnectorProvider;
import com.wegas.core.merge.utils.MergeHelper;
import com.wegas.core.merge.utils.WegasFieldProperties;
import com.wegas.core.persistence.InstanceOwner;
import com.wegas.core.persistence.Mergeable;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.GameModelLanguage;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.variable.Beanjection;
import com.wegas.core.persistence.variable.DescriptorListI;
import com.wegas.core.persistence.variable.ListDescriptor;
import com.wegas.core.persistence.variable.ListInstance;
import com.wegas.core.persistence.variable.ModelScoped;
import com.wegas.core.persistence.variable.ModelScoped.Visibility;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.core.persistence.variable.primitive.NumberInstance;
import com.wegas.core.persistence.variable.primitive.StaticTextDescriptor;
import com.wegas.core.persistence.variable.primitive.StaticTextInstance;
import com.wegas.core.persistence.variable.primitive.StringDescriptor;
import com.wegas.core.persistence.variable.primitive.StringInstance;
import com.wegas.core.persistence.variable.primitive.TextDescriptor;
import com.wegas.core.persistence.variable.primitive.TextInstance;
import com.wegas.core.persistence.variable.scope.AbstractScope;
import com.wegas.core.persistence.variable.scope.GameModelScope;
import com.wegas.core.persistence.variable.scope.PlayerScope;
import com.wegas.core.persistence.variable.scope.TeamScope;
import com.wegas.core.persistence.variable.statemachine.DialogueDescriptor;
import com.wegas.core.persistence.variable.statemachine.DialogueState;
import com.wegas.core.persistence.variable.statemachine.DialogueTransition;
import com.wegas.core.tools.FindAndReplacePayload;
import com.wegas.core.tools.FindAndReplaceVisitor;
import com.wegas.mcq.persistence.ChoiceDescriptor;
import com.wegas.mcq.persistence.QuestionDescriptor;
import com.wegas.mcq.persistence.Result;
import com.wegas.mcq.persistence.wh.WhQuestionDescriptor;
import com.wegas.resourceManagement.ejb.ResourceFacade;
import com.wegas.resourceManagement.persistence.TaskDescriptor;
import com.wegas.reviewing.ejb.ReviewingFacade;
import com.wegas.reviewing.persistence.PeerReviewDescriptor;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.Comparator;
import java.util.Deque;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Set;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.inject.Inject;
import javax.jcr.RepositoryException;
import javax.naming.NamingException;
import javax.persistence.NoResultException;
import javax.persistence.TypedQuery;
import javax.persistence.criteria.CriteriaBuilder;
import javax.persistence.criteria.CriteriaQuery;
import javax.persistence.criteria.Root;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Stateless
@LocalBean
public class VariableDescriptorFacade extends BaseFacade<VariableDescriptor> implements VariableDescriptorFacadeI {

    private static final Logger logger = LoggerFactory.getLogger(VariableDescriptorFacade.class);

    /**
     *
     */
    @Inject
    private GameModelFacade gameModelFacade;

    @Inject
    private VariableInstanceFacade variableInstanceFacade;

    @Inject
    private ResourceFacade resourceFacade;

    @Inject
    private ReviewingFacade reviewingFacade;

    @Inject
    private GameFacade gameFacade;

    @Inject
    private JCRConnectorProvider jcrConnectorProvider;

    @Inject
    private JCRFacade jcrFacade;

    /**
     *
     */
    public VariableDescriptorFacade() {
        super(VariableDescriptor.class);
    }

    /**
     * @param variableDescriptor
     */
    @Override
    public void create(final VariableDescriptor variableDescriptor) {
        throw WegasErrorMessage.error("Unable to call create on Variable descriptor. Use create(gameModelId, variableDescriptor) instead.");
    }

    @Override
    public VariableDescriptor update(final Long entityId, final VariableDescriptor entity) {
        final VariableDescriptor vd = this.find(entityId);
        //entity.setGameModel(vd.getGameModel());
        vd.merge(entity);

        /*
         * This flush is required by several EntityRevivedEvent listener,
         * which opperate some SQL queries (which didn't return anything before
         * entites have been flushed to database
         *
         * for instance, reviving a taskDescriptor needs to fetch others tasks by name,
         * it will not return any result if this flush not occurs
         */
        this.getEntityManager().flush();

        // flush
        this.revive(vd.getGameModel(), vd, false);
        return vd;
    }

    /**
     * Create a new descriptor in a DescriptorListI
     *
     * @param gameModel the gameModel
     * @param list      new descriptor parent
     * @param entity    new descriptor to create
     *
     * @return the new descriptor
     */
    public VariableDescriptor createChild(final GameModel gameModel,
        final DescriptorListI<VariableDescriptor> list,
        final VariableDescriptor entity, boolean resetNames) {

        List<String> usedNames = this.findDistinctNames(gameModel, entity.getRefId());
        List<TranslatableContent> usedLabels = this.findDistinctLabels(list);

        String baseLabel = null;

        if (entity.getLabel() != null) {
            // fetch the most preferred label
            baseLabel = entity.getLabel().translateOrEmpty(gameModel);
        }

        if (Helper.isNullOrEmpty(entity.getName()) && !Helper.isNullOrEmpty(baseLabel)) {
            // no name, but a label
            entity.setName(baseLabel);
        }

        if (Helper.isNullOrEmpty(entity.getName()) && !Helper.isNullOrEmpty(entity.getEditorTag())) {
            // still no name but a tag
            entity.setName(entity.getEditorTag());
        }

        Map<String, String> newNames = Helper.setUniqueName(entity, usedNames, gameModel, resetNames);

        // some impacts may impact renamed variable. -> update them to impact the new variable name
        for (Entry<String, String> newName : newNames.entrySet()) {
            FindAndReplacePayload payload = new FindAndReplacePayload();
            payload.setRegex(false);
            payload.setFind("Variable.find(gameModel, \"" + newName.getKey() + "\")");
            payload.setReplace("Variable.find(gameModel, \"" + newName.getValue() + "\")");
            payload.setPretend(false);

            FindAndReplaceVisitor replacer = new FindAndReplaceVisitor(payload);
            MergeHelper.visitMergeable(entity, true, replacer);
        }

        Helper.setUniqueLabel(entity, usedLabels, gameModel);

        list.addItem(entity);

        /*
         * This flush is required by several EntityRevivedEvent listener,
         * which opperate some SQL queries (which didn't return anything before
         * entites have been flushed to database
         *
         * for instance, reviving a taskDescriptor needs to fetch others tasks by name,
         * it will not return any result if this flush not occurs
         */
        this.getEntityManager().flush();

        this.revive(gameModel, entity, true);

        return entity;
    }

    /**
     *
     * @param gameModel
     * @param entity
     * @param propagate indicate whether default instance should be propagated
     */
    public void shallowRevive(GameModel gameModel, VariableDescriptor entity, boolean propagate) {
        AbstractScope newScope = null;

        if (entity.getDeserialisedScopeType() != null) {
            newScope = AbstractScope.build(entity.getDeserialisedScopeType(), entity.getDeserialisedBroadcastScopeType());
            entity.setScopeType(null);
            entity.setBroadcastScope(null);

            AbstractScope scope = entity.getScope();
            if (scope != null) {
                if (scope.getClass().equals(newScope.getClass())) {
                    scope.setBroadcastScope(newScope.getBroadcastScope());
                } else {
                    this.updateScope(entity, newScope);
                }
            } else {
                entity.setScope(newScope);
                propagate = true;
            }
        }

        if (entity.getScope() == null) {
            entity.setScope(new TeamScope());
            propagate = true;
        }

        if (entity instanceof ListDescriptor) {
            VariableInstance defaultInstance = entity.getDefaultInstance();
            if (defaultInstance instanceof NumberInstance) {
                logger.error("Incompatible default instance {}", defaultInstance);
                entity.setDefaultInstance(new ListInstance());
            }
        }

        this.reviveDescriptor(gameModel, entity);
        variableInstanceFacade.reviveInstance(entity.getDefaultInstance());

        // @TODO find a smarter way to decide to propagate or not to propatate...
        if (propagate) {
            entity.getScope().setBeanjection(new Beanjection(variableInstanceFacade));
            gameModelFacade.resetAndReviveScopeInstances(entity);
        }

        if (gameModel != null) {
            gameModel.addToVariableDescriptors(entity);
        }
    }

    private void revive(GameModel gameModel, VariableDescriptor entity, boolean propagate) {
        this.shallowRevive(gameModel, entity, propagate);
        if (entity instanceof DescriptorListI) {
            this.reviveItems(gameModel, (DescriptorListI) entity, propagate); // also revive children
        }
    }

    public void reviveDescriptor(GameModel gm, VariableDescriptor vd) {
        if (vd instanceof ChoiceDescriptor) {
            this.reviveChoiceDescriptor(gm, (ChoiceDescriptor) vd);
        }

        this.reviveInternal(gm, vd);

        if (vd instanceof PeerReviewDescriptor) {
            reviewingFacade.revivePeerReviewDescriptor((PeerReviewDescriptor) vd);
        } else if (vd instanceof TaskDescriptor) {
            resourceFacade.reviveTaskDescriptor((TaskDescriptor) vd);
        } else if (vd instanceof DialogueDescriptor) {
            this.reviveDialogue(gm, (DialogueDescriptor) vd);
        }
    }

    public void reviveDialogue(GameModel gameModel, DialogueDescriptor dialogueDescriptor) {
        for (DialogueState s : dialogueDescriptor.getInternalStates()) {
            if (s.getText() != null) {
                s.getText().setParentDescriptor(dialogueDescriptor);
            }

            for (DialogueTransition t : s.getTransitions()) {
                if (t.getActionText() != null) {
                    t.getActionText().setParentDescriptor(dialogueDescriptor);
                }
            }
        }
    }

    private void reviveInternal(GameModel gameModel, VariableDescriptor vd) {
        if (vd.getDeprecatedTitle() != null) {
            String title = vd.getDeprecatedTitle();
            if (title.isEmpty()) {
                // title is defined but empty -> not prefix, don't change label
                // eg:  label="[r5b] Meet someone'; title=""; prefix = ""; label="[r5b] Meet someone"
                vd.setEditorTag("");
            } else {
                String importedLabel = vd.getLabel().translateOrEmpty(gameModel);
                if (importedLabel == null) {
                    importedLabel = "";
                }
                // eg:  label="[r5b] Meet someone'; title="Meet someone"; prefix = "[r5b]"; label="Meet someone"
                // eg:  label="Meet someone'; title="Meet someone"; prefix = ""; label="Meet someone"
                // eg:  label=""; title="Meet someone"; prefix = ""; label="Meet someone"
                vd.setEditorTag(importedLabel.replace(title, "").trim());
                List<GameModelLanguage> languages = gameModel.getLanguages();
                if (languages != null && !languages.isEmpty()) {
                    vd.setLabel(TranslatableContent.build(languages.get(0).getCode(), title));
                }
            }
            vd.setTitle(null);
        }
    }

    private void reviveChoiceDescriptor(GameModel gameModel, ChoiceDescriptor choiceDescriptor) {
        if (choiceDescriptor.getDeprecatedTitle() != null) {
            String title = choiceDescriptor.getDeprecatedTitle();
            // use deprecated title > upgrade
            String importedLabel = choiceDescriptor.getLabel().translateOrEmpty(gameModel);
            if (importedLabel == null) {
                importedLabel = "";
            }
            // title = "", label= "" => prefix = "", label=""
            // title = "", label= "[r5b] Meet someone" => prefix = "[r5b] Meet someone", label=""
            // title = "Meet someone", label= "[r5b] Meet someone" => prefix = "[r5b]", label="Meet someone"
            // title = "Meet someone", label="" => prefix = "", label="Meet someone"
            choiceDescriptor.setEditorTag(importedLabel.replace(title, "").trim());

            List<GameModelLanguage> languages = gameModel.getLanguages();
            if (languages != null && !languages.isEmpty()) {
                choiceDescriptor.setLabel(TranslatableContent.build(languages.get(0).getCode(), title));
            }
            choiceDescriptor.setTitle(null);
        }
        for (Result r : choiceDescriptor.getResults()) {
            if (r.getLabel() != null) {
                r.getLabel().setParentDescriptor(choiceDescriptor);
            }
            if (r.getAnswer() != null) {
                r.getAnswer().setParentDescriptor(choiceDescriptor);
            }
            if (r.getIgnorationAnswer() != null) {
                r.getIgnorationAnswer().setParentDescriptor(choiceDescriptor);
            }
        }
    }

    @Deprecated
    public void flushAndreviveItems(GameModel gameModel, DescriptorListI entity, boolean propagate) {
        this.reviveItems(gameModel, entity, propagate);
    }

    /**
     * @param gameModel
     * @param entity
     * @param propagate
     */
    public void reviveItems(GameModel gameModel, DescriptorListI entity, boolean propagate) {
        for (Object vd : entity.getItems()) {
            this.revive(gameModel, (VariableDescriptor) vd, propagate);
        }
    }

    /**
     * @param gameModel
     * @param entity
     */
    public void preDestroy(GameModel gameModel, VariableDescriptor entity) {
        if (gameModel != null) {
            gameModel.removeFromVariableDescriptors(entity);
        }

        Collection<VariableInstance> values = this.getInstances(entity).values();
        logger.debug("PreDestroy: remove {} entities for {}", values.size(), entity);
        for (VariableInstance vi : values) {
            logger.debug("Destroy {}", vi);
            variableInstanceFacade.remove(vi);
        }

        // Cascade base deletion...
        //variableInstanceFacade.remove(entity.getDefaultInstance());
        if (entity instanceof DescriptorListI) {
            this.preDestroyItems(gameModel, (DescriptorListI) entity);
        }
    }

    /**
     * @param gameModel
     * @param entity
     */
    public void preDestroyItems(GameModel gameModel, DescriptorListI entity) {
        for (Object vd : entity.getItems()) {
            this.preDestroy(gameModel, (VariableDescriptor) vd);
        }
    }

    /**
     * Create a new descriptor as a child of another
     *
     * @param parentDescriptorId owner of the descriptor
     * @param entity             the new descriptor to create
     *
     * @return the new child
     */
    public VariableDescriptor createChild(final Long parentDescriptorId, final VariableDescriptor entity) {
        VariableDescriptor parent = this.find(parentDescriptorId);
        return this.createChild(parent.getGameModel(), (DescriptorListI) parent, entity, false);
    }

    /**
     * Create descriptor at gameModel rootLevel
     *
     * @param gameModelId        owner of the descriptor
     * @param variableDescriptor descriptor to add to the gameModel
     */
    public void create(final Long gameModelId, final VariableDescriptor variableDescriptor) {
        GameModel find = this.gameModelFacade.find(gameModelId);
        /*
        for (Game g : find.getGames()) {
            logger.error("Game {}",  g);
            for (Team t : g.getTeams()) {
                logger.error("  Team {} -> {}",  t, t.getStatus());
                for (Player p : t.getPlayers()) {
                    logger.error("    Player {} -> {}",  p, p.getStatus());
                }
            }
        } // */
        this.createChild(find, find, variableDescriptor, false);
    }

    /**
     * @param entityId
     *
     * @return the new descriptor
     *
     * @throws java.lang.CloneNotSupportedException
     *
     */
    @Override
    public VariableDescriptor duplicate(final Long entityId) throws CloneNotSupportedException {
        final VariableDescriptor oldEntity = this.find(entityId); // Retrieve the entity to duplicate
        final VariableDescriptor newEntity = (VariableDescriptor) oldEntity.duplicate();

        // reset reference id for all new entites within newEntity
        MergeHelper.resetRefIds(newEntity, null, true);
        if (oldEntity.belongsToProtectedGameModel()) {
            MergeHelper.resetVisibility(newEntity, Visibility.PRIVATE);
        }

        final DescriptorListI list = oldEntity.getParent();
        this.createChild(oldEntity.getGameModel(), list, newEntity, true);
        return newEntity;
    }

    public VariableDescriptor resetVisibility(VariableDescriptor vd, Visibility visibility) {
        vd.setVisibility(visibility);
        if (vd instanceof DescriptorListI) {
            for (VariableDescriptor child : (List<? extends VariableDescriptor>) ((DescriptorListI) vd).getItems()) {
                this.resetVisibility(child, visibility);
            }
        }
        return vd;
    }

    public VariableDescriptor resetVisibility(final Long vdId, Visibility visibility) {
        return this.resetVisibility(this.find(vdId), visibility);
    }

    private VariableDescriptor changeScopeRecursively(VariableDescriptor vd,
        AbstractScope.ScopeType newScopeType) {
        if (!vd.getScope().getScopeType().equals(newScopeType)) {
            this.updateScope(vd,
                AbstractScope.build(newScopeType,
                    newScopeType));
        }

        if (vd instanceof DescriptorListI) {
            for (VariableDescriptor child : (List<? extends VariableDescriptor>) ((DescriptorListI) vd).getItems()) {
                this.changeScopeRecursively(child, newScopeType);
            }
        }
        return vd;
    }

    public VariableDescriptor changeScopeRecursively(Long vdId,
        AbstractScope.ScopeType newScopeType) {
        return this.changeScopeRecursively(this.find(vdId), newScopeType);
    }

    public VariableDescriptor convertToStaticText(VariableDescriptor vd) {

        if (vd != null) {
            TranslatableContent label = vd.getLabel().createCopy();
            TranslatableContent value = null;
            if (vd instanceof TextDescriptor) {
                TextInstance ti = (TextInstance) vd.getDefaultInstance();
                value = ti.getTrValue().createCopy();
            } else if (vd instanceof StringDescriptor) {
                StringInstance si = (StringInstance) vd.getDefaultInstance();
                value = si.getTrValue().createCopy();
            }

            if (value != null) {
                StaticTextDescriptor staticText = new StaticTextDescriptor();
                staticText.setDefaultInstance(new StaticTextInstance());
                staticText.setEditorTag(vd.getEditorTag());
                String vdName = vd.getName();
                staticText.setScope(new GameModelScope());
                staticText.getScope().setBroadcastScope(AbstractScope.ScopeType.GameModelScope);

                DescriptorListI parent = vd.getParent();
                GameModel gameModel = vd.getGameModel();

                this.remove(vd);
                requestManager.getEntityManager().flush();

                staticText.setLabel(label);
                staticText.setText(value);

                this.createChild(gameModel, parent, staticText, false);

                staticText.setName(vdName);
            }
        }

        return vd;
    }

    public VariableDescriptor convertToStaticText(Long vdId) {
        return this.convertToStaticText(this.find(vdId));
    }

    public VariableDescriptor convertToText(VariableDescriptor vd) {

        if (vd != null) {
            TranslatableContent label = vd.getLabel().createCopy();
            TranslatableContent value = null;
            if (vd instanceof StaticTextDescriptor) {
                value = ((StaticTextDescriptor) vd).getText().createCopy();
                if (value != null) {
                    TextDescriptor text = new TextDescriptor();
                    text.setDefaultInstance(new TextInstance());
                    text.setEditorTag(vd.getEditorTag());
                    String vdName = vd.getName();
                    text.setScope(new TeamScope());
                    text.getScope().setBroadcastScope(AbstractScope.ScopeType.TeamScope);

                    text.getDefaultInstance().setTrValue(value);

                    DescriptorListI parent = vd.getParent();
                    GameModel gameModel = vd.getGameModel();

                    this.remove(vd);
                    requestManager.getEntityManager().flush();

                    text.setName(vdName);
                    text.setLabel(label);

                    this.createChild(gameModel, parent, text, false);
                }
            }
        }

        return vd;
    }

    public VariableDescriptor convertToText(Long vdId) {
        return this.convertToText(this.find(vdId));
    }

    @Override
    public void remove(VariableDescriptor entity) {
        this.preDestroy(entity.getGameModel(), entity);
        entity.getParent().remove(entity);

        getEntityManager().remove(entity);
    }

    /**
     * @param vd
     *
     * @return descriptor container
     *
     * @deprecated use {@link VariableDescriptor#getParent()}
     */
    @Override
    public DescriptorListI findParentList(VariableDescriptor vd) throws NoResultException {
        return vd.getParent();
    }

    /**
     * @param item
     *
     * @return the parent descriptor
     *
     * @throws WegasNoResultException if the desciptor is at root-level
     * @deprecated use {@link VariableDescriptor#getParentList()}
     */
    @Override
    public ListDescriptor findParentListDescriptor(final VariableDescriptor item) throws WegasNoResultException {
        if (item.getParentList() != null) {
            return item.getParentList();
        } else {
            throw new WegasNoResultException();
        }
    }

    @Override
    public boolean hasVariable(final GameModel gameModel, final String name) {
        try {
            this.find(gameModel, name);
            return true;
        } catch (WegasNoResultException ex) {
            return false;
        }

    }

    /**
     * @param gameModel
     * @param name
     *
     * @return the gameModel descriptor matching the name
     *
     * @throws WegasNoResultException
     */
    @Override
    public VariableDescriptor find(final GameModel gameModel, final String name) throws WegasNoResultException {
//        for (VariableDescriptor vd : gameModel.getVariableDescriptors()) {
//            if (name.equals(vd.getName())) {
//                return vd;
//            }
//        }
//        throw new WegasNoResultException();

        try {
            TypedQuery<VariableDescriptor> query = getEntityManager().createNamedQuery("VariableDescriptor.findByGameModelIdAndName", VariableDescriptor.class);
            query.setParameter("gameModelId", gameModel.getId());
            query.setParameter("name", name);
            return query.getSingleResult();
        } catch (NoResultException ex) {
            throw new WegasNoResultException("Variable \"" + name + "\" not found in gameModel " + gameModel, ex);
        }
    }

    public Object executeNativeSql(String sql) {
        return this.getEntityManager().createNativeQuery(sql).getResultList();
    }

    /**
     * @param gameModel
     * @param refId
     *
     * @return all descriptor names already in use within the gameModel excluding description with
     *         given refId
     */
    public List<String> findDistinctNames(final GameModel gameModel, String refId) {
        TypedQuery<String> query;
        if (gameModel.isModel()) {
            // names from the model and all scenarios
            query = getEntityManager().createNamedQuery("VariableDescriptor.findAllNamesInModelAndItsScenarios", String.class);
        } else {
            // names from the gamemodel and its model
            query = getEntityManager().createNamedQuery("VariableDescriptor.findAllNamesInScenarioAndItsModel", String.class);
        }

        query.setParameter("gameModelId", gameModel.getId());
        query.setParameter("refId", refId);

        return query.getResultList();
    }

    /**
     * @param container
     *
     * @return all descriptor labels already in use within the given descriptor container
     */
    public List<TranslatableContent> findDistinctLabels(final DescriptorListI<? extends VariableDescriptor> container) {
        if (container instanceof GameModel) {
            TypedQuery<TranslatableContent> distinctLabels = getEntityManager().createNamedQuery("GameModel.findDistinctChildrenLabels", TranslatableContent.class);
            distinctLabels.setParameter("containerId", container.getId());
            return distinctLabels.getResultList();
        } else if (container instanceof ListDescriptor) {
            TypedQuery<TranslatableContent> distinctLabels = getEntityManager().createNamedQuery("ListDescriptor.findDistinctChildrenLabels", TranslatableContent.class);
            distinctLabels.setParameter("containerId", container.getId());
            return distinctLabels.getResultList();
        } else if (container instanceof QuestionDescriptor) {
            TypedQuery<TranslatableContent> distinctLabels = getEntityManager().createNamedQuery("QuestionDescriptor.findDistinctChildrenLabels", TranslatableContent.class);
            distinctLabels.setParameter("containerId", container.getId());
            return distinctLabels.getResultList();
        } else if (container instanceof WhQuestionDescriptor) {
            TypedQuery<TranslatableContent> distinctLabels = getEntityManager().createNamedQuery("WhQuestionDescriptor.findDistinctChildrenLabels", TranslatableContent.class);
            distinctLabels.setParameter("containerId", container.getId());
            return distinctLabels.getResultList();
        } else {
            // fallback case
            List<TranslatableContent> list = new ArrayList<>();
            for (VariableDescriptor child : container.getItems()) {
                list.add(child.getLabel());
            }
            return list;
        }
    }

    /**
     * For backward compatibility, use find(final GameModel gameModel, final String name) instead.
     *
     * @param gameModel
     * @param name
     *
     * @return the gameModel descriptor matching the name
     *
     * @throws com.wegas.core.exception.internal.WegasNoResultException
     * @deprecated
     */
    @Override
    @Deprecated
    public VariableDescriptor findByName(final GameModel gameModel, final String name) throws WegasNoResultException {
        return this.find(gameModel, name);
    }

    /**
     * @param gameModel
     * @param label
     *
     * @return the gameModel descriptor matching the label
     *
     * @throws com.wegas.core.exception.internal.WegasNoResultException
     */
    @Override
    public VariableDescriptor findByLabel(final GameModel gameModel, final String label) throws WegasNoResultException {
        // TODO update to handle label duplicata
        final CriteriaBuilder cb = getEntityManager().getCriteriaBuilder();
        final CriteriaQuery<VariableDescriptor> cq = cb.createQuery(VariableDescriptor.class);
        final Root<VariableDescriptor> variableDescriptor = cq.from(VariableDescriptor.class);
        cq.where(cb.and(
            cb.equal(variableDescriptor.get("gameModel").get("id"), gameModel.getId()),
            cb.equal(variableDescriptor.get("label"), label)));
        final TypedQuery<VariableDescriptor> q = getEntityManager().createQuery(cq);
        try {
            return q.getSingleResult();
        } catch (NoResultException ex) {
            throw new WegasNoResultException(ex);
        }
    }

    /**
     * @param gameModel
     * @param prefix    prefix we look for
     *
     * @return all gameModel descriptors with the given title
     */
    @Override
    public List<VariableDescriptor> findByPrefix(final GameModel gameModel, final String prefix) {

        List<VariableDescriptor> result = new ArrayList<>();
        if (prefix != null) {
            for (VariableDescriptor vd : gameModel.getVariableDescriptors()) {
                if (prefix.equals(vd.getEditorTag())) {
                    result.add(vd);
                }
            }
        }
        return result;
    }

    /**
     * @param gameModelId
     *
     * @return all gameModel descriptors
     */
    @Override
    public Collection<VariableDescriptor> findAll(final Long gameModelId) {
        return gameModelFacade.find(gameModelId).getVariableDescriptors();
    }

    /**
     * @param gameModelId
     *
     * @return gameModel root-level descriptor
     */
    @Override
    public List<VariableDescriptor> findByGameModelId(final Long gameModelId) {
        return gameModelFacade.find(gameModelId).getChildVariableDescriptors();
    }

    /**
     * {@inheritDoc }
     */
    @Override
    public <T extends VariableDescriptor> List<T> findByClass(final GameModel gamemodel, final Class<T> variableDescriptorClass) {
        //Cannot be a namedQuery, find by TYPE() removes subclasses
        final CriteriaBuilder cb = getEntityManager().getCriteriaBuilder();
        final CriteriaQuery<T> cq = cb.createQuery(variableDescriptorClass);
        final Root<T> variableDescriptor = cq.from(variableDescriptorClass);
        cq.where(cb.equal(variableDescriptor.get("gameModel").get("id"), gamemodel.getId()));
        final TypedQuery<T> q = getEntityManager().createQuery(cq);
        return q.getResultList();

        //Query findVariableDescriptorsByClass = getEntityManager().createQuery("SELECT DISTINCT variableDescriptor FROM " + variableDescriptorClass.getSimpleName() + " variableDescriptor LEFT JOIN variableDescriptor.gameModel AS gm WHERE gm.id =" + gameModelId, variableDescriptorClass);
        //return findVariableDescriptorsByClass.getResultList();
    }

    /**
     *
     * @param descriptorId         id of the descriptor to move
     * @param targetListDescriptor new parent
     * @param index                index in new parent
     *
     */
    private void move(final Long descriptorId, final DescriptorListI<VariableDescriptor> targetListDescriptor, final Integer index) {

        final VariableDescriptor vd = this.find(descriptorId);
        DescriptorListI from = vd.getParent();

        Visibility targetVisibility = targetListDescriptor instanceof ModelScoped ? ((ModelScoped) targetListDescriptor).getVisibility() : Visibility.INHERITED;

        if (!vd.belongsToProtectedGameModel() || (vd.getVisibility() == ModelScoped.Visibility.PRIVATE)) {
            if (!vd.belongsToProtectedGameModel() || targetVisibility != Visibility.INTERNAL) {
                from.localRemove(vd);
                targetListDescriptor.addItem(index, vd);
            } else {
                if (targetListDescriptor instanceof VariableDescriptor) {
                    throw WegasErrorMessage.error("Updating " + ((VariableDescriptor<VariableInstance>) targetListDescriptor).getLabel().translateOrEmpty(vd.getGameModel()) + " is not authorized");
                } else {
                    throw WegasErrorMessage.error("Updating " + targetListDescriptor + " is not authorized");
                }
            }
        } else {
            throw WegasErrorMessage.error("Moving \"" + vd.getLabel().translateOrEmpty(vd.getGameModel()) + "\" is not authorized");
        }
    }

    /**
     * This method will move the target entity to the root level of the game model at index i
     *
     * @param descriptorId
     * @param index
     */
    public void move(final Long descriptorId, final Integer index) {
        this.move(descriptorId, this.find(descriptorId).getGameModel(), index);
    }

    /**
     * Move given descriptor in targetListDescriptor at specified position.
     *
     * @param descriptorId           id of the descrptor to move
     * @param targetListDescriptorId id of the new list
     * @param index                  new position in the targetlist
     */
    public void move(final Long descriptorId, final Long targetListDescriptorId, final Integer index) {
        this.move(descriptorId, (DescriptorListI) this.find(targetListDescriptorId), index);
    }

    /**
     * Sort naturally items in ListDescriptor by label
     *
     * @param descriptorId ListDescriptor's id to sort
     *
     * @return sorted VariableDescriptor
     */
    public VariableDescriptor sort(final Long descriptorId) {
        VariableDescriptor variableDescriptor = this.find(descriptorId);
        if (variableDescriptor instanceof ListDescriptor) {
            /*
             * Collection cannot be sorted directly, must pass through methods remove / add
             */
            ListDescriptor listDescriptor = (ListDescriptor) variableDescriptor;
            List<VariableDescriptor> list = new ArrayList<>(listDescriptor.getItems());
            final AlphanumericComparator<String> alphanumericComparator = new AlphanumericComparator<>();
            final Comparator<VariableDescriptor> comparator = new Comparator<VariableDescriptor>() {
                @Override
                public int compare(VariableDescriptor o1, VariableDescriptor o2) {
                    return alphanumericComparator.compare(o1.getEditorLabel(), o2.getEditorLabel());
                }
            };

            Collections.sort(list, comparator);

            for (VariableDescriptor vd : list) {
                listDescriptor.remove(vd);
                listDescriptor.addItem(vd);
            }
        }
        return variableDescriptor;
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public Map<? extends InstanceOwner, VariableInstance> getInstances(VariableDescriptor vd) {
        return variableInstanceFacade.getAllInstances(vd);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public Map<Long, VariableInstance> getInstancesByKeyId(VariableDescriptor vd) {
        return variableInstanceFacade.getAllInstancesById(vd);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public VariableInstance getInstance(VariableDescriptor vd, Player player) {
        AbstractScope scope = vd.getScope();
        if (scope instanceof TeamScope) {
            return variableInstanceFacade.getTeamInstance((TeamScope) scope, player.getTeam());
        } else if (scope instanceof PlayerScope) {
            return variableInstanceFacade.getPlayerInstance((PlayerScope) scope, player);
        } else if (scope instanceof GameModelScope) {
            return scope.getVariableInstance(player.getGameModel());
        }
        return null;
    }

    /**
     *
     * @param vd
     * @param newScope
     */
    public void updateScope(VariableDescriptor vd, AbstractScope newScope) {
        if (vd.getScope() != null) {
            AbstractScope scope = vd.getScope();
            Collection<VariableInstance> values = variableInstanceFacade.getAllInstances(vd).values();

            for (VariableInstance vi : values) {
                variableInstanceFacade.remove(vi);
            }
            this.getEntityManager().remove(scope);
        }
        vd.setScope(newScope);
        this.getEntityManager().persist(vd);
        vd = this.find(vd.getId());
        gameModelFacade.resetAndReviveScopeInstances(vd);
    }

    public VariableDescriptor cherryPick(Long targetId, String variableName, Long sourceId,
        String targetVariableName, AbstractScope.ScopeType newScopeType) {
        return this.cherryPick(gameModelFacade.find(targetId),
            variableName, gameModelFacade.find(sourceId), targetVariableName, newScopeType);
    }

    /**
     * Cherry Pick a variable from the source gameModel and import it within the target gameModel.
     * Such an import is recursive and all referenced files are
     * {@link JCRFacade#importFile(com.wegas.core.jcr.content.AbstractContentDescriptor, com.wegas.core.jcr.content.ContentConnector)  imported}
     * too.
     * <p>
     * Such imported files may be renamed to avoid overriding files.
     *
     *
     * @param target                the gameModel in which to import the variable
     * @param variableName          name (scriptAlias) of the variable to import
     * @param source                the gameModel in which to pick the variable
     * @param targetVariableName    name (scriptAlias) of the variable to create
     * @param newScopeType          optional
     *
     * @return
     */
    public VariableDescriptor cherryPick(GameModel target, String variableName, GameModel source,
        String targetVariableName, AbstractScope.ScopeType newScopeType) {

        if (targetVariableName.length() == 0) {
            targetVariableName = variableName;
        }
        
        VariableDescriptor toImport;
        try {
            toImport = this.find(source, variableName);
            VariableDescriptor theVar;
            try {
                theVar = this.find(target, targetVariableName);

                if (!theVar.getRefId().equals(toImport.getRefId())) {
                    throw WegasErrorMessage.error("Variable " + targetVariableName + " already exists");
                }
            } catch (WegasNoResultException ex) {
                theVar = null;
            }

            if (theVar != null) {
                // update ???
                if (newScopeType != null) {
                    this.changeScopeRecursively(theVar, newScopeType);
                }
                throw WegasErrorMessage.error("Patch not yet implemented");
            } else {
                try {
                    theVar = (VariableDescriptor) toImport.duplicate();
                    theVar.setName(targetVariableName);

                    if (newScopeType != null) {
                        // desc not yet persisted : do not care about instance when changing the scope
                        MergeHelper.visitMergeable(theVar, Boolean.TRUE,
                            new MergeHelper.MergeableVisitor() {

                            @Override
                            public boolean visit(Mergeable target, ProtectionLevel protectionLevel,
                                int level, WegasFieldProperties field, Deque<Mergeable> ancestors,
                                Mergeable... references) {
                                if (target instanceof VariableDescriptor) {
                                    VariableDescriptor vd = (VariableDescriptor) target;

                                    if (vd.getScopeType() != newScopeType) {
                                        vd.setScopeType(newScopeType);
                                        vd.setBroadcastScope(newScopeType);
                                    }
                                    return vd instanceof DescriptorListI;
                                }
                                return true;
                            }
                        });
                    }
                    
                    theVar = this.createChild(target, target,
                        theVar, false);

                    ContentConnector srcRepo = jcrConnectorProvider.getContentConnector(source,
                        WorkspaceType.FILES);
                    ContentConnector targetRepo = jcrConnectorProvider.getContentConnector(target,
                        WorkspaceType.FILES);

                    Set<String> filePaths = gameModelFacade.findAllRefToFiles(source, toImport);
                    for (String path : filePaths) {
                        AbstractContentDescriptor sourceFile = DescriptorFactory.getDescriptor(
                            path, srcRepo);

                        if (sourceFile.exist()) {
                            AbstractContentDescriptor newItem = jcrFacade.importFile(sourceFile, targetRepo);
                            if (!newItem.getFullPath().equals(path)) {
                                // file collision: new item does has been moved to a new path

                                FindAndReplacePayload payload = new FindAndReplacePayload();
                                payload.setRegex(false);
                                payload.setFind(path);
                                payload.setReplace(newItem.getFullPath());
                                payload.setPretend(false);
                                payload.setLangsFromGameModel(source);

                                FindAndReplaceVisitor replacer = new FindAndReplaceVisitor(payload);
                                MergeHelper.visitMergeable(theVar, true, replacer);
                            }
                        } else {
                            throw WegasErrorMessage.error("Source file \""
                                + sourceFile.getFullPath()
                                + "\" does not exist");
                        }
                    }

                } catch (CloneNotSupportedException ex) {
                    throw WegasErrorMessage.error("Error while duplicating variable");
                } catch (RepositoryException ex) {
                    throw WegasErrorMessage.error("Error while duplicating files");
                } catch (IOException ex) {
                    throw WegasErrorMessage.error("Error while duplicating file");
                }
            }

            return theVar;

        } catch (WegasNoResultException ex) {
            throw WegasErrorMessage.error("Variable " + variableName + " not found");
        }
    }

    /**
     * Look into all gameModels accessible to the current player and retrieve the list of all
     * variable of the given type
     *
     * @param variableType  type of variable to look for
     * @param writePermOnly should restrict the search to editable gameModel (ie. trainer's own
     *                      games and gameModel with edit permission)
     *
     * @return
     */
    public Collection<VariableIndex> fetchCherryPickable(Class<? extends VariableDescriptor> variableType, boolean writePermOnly) {
        List<GameModel.GmType> types = new ArrayList<>();
        types.add(GameModel.GmType.MODEL);
        types.add(GameModel.GmType.SCENARIO);
        types.add(GameModel.GmType.PLAY);

        List<GameModel.Status> statuses = new ArrayList<>();
        statuses.add(GameModel.Status.LIVE);
        statuses.add(GameModel.Status.BIN);

        // first step : fetch all gameModel id the current user can read
        Map<Long, List<String>> matrix = gameModelFacade.getPermissionMatrix(types, statuses);

        Set<Long> gmIds = new HashSet<>();

        if (writePermOnly) {
            for (Entry<Long, List<String>> entry : matrix.entrySet()) {
                if (entry.getValue().contains("Edit") || entry.getValue().contains("*")) {
                    gmIds.add(entry.getKey());
                }
            }
        } else {
            gmIds.addAll(matrix.keySet());
        }

        List<Game.Status> gStatuses = new ArrayList<>();
        gStatuses.add(Game.Status.LIVE);
        gStatuses.add(Game.Status.BIN);

        Map<Long, List<String>> gMatrix = gameFacade.getPermissionMatrix(gStatuses);

        TypedQuery<Long> gToGmQuery = getEntityManager().createNamedQuery(
            "GameModel.findIdsByGameId", Long.class);

        gToGmQuery.setParameter("gameIds", gMatrix.keySet());

        gmIds.addAll(gToGmQuery.getResultList());

        List<Class<? extends VariableDescriptor>> vdTypes = new ArrayList<>();

        vdTypes.add(variableType);

        TypedQuery<VariableDescriptor> query = getEntityManager().createNamedQuery(
            "VariableDescriptor.findCherryPickables", VariableDescriptor.class);

        query.setParameter("gameModelIds", gmIds);
        query.setParameter("types", vdTypes);

        /*
         * group flat variable list by gameModel (one might want to use a JPQL "groupBy gameModel"
         * Unfortunalty, JPQL does not provide a array_agg function to aggregate variables...
         */
        List<VariableDescriptor> resultList = query.getResultList();

        Map<GameModel, VariableIndex> results = new HashMap<>();
        for (VariableDescriptor vd : resultList) {
            if (!results.containsKey(vd.getGameModel())) {
                results.putIfAbsent(vd.getGameModel(), new VariableIndex(vd.getGameModel()));
            }

            VariableIndex index = results.get(vd.getGameModel());
            index.getVariables().add(vd);
        }

        return results.values();
    }

    public static class VariableIndex {

        private final GameModel gameModel;
        private final Game game;
        private final List<VariableDescriptor> variables;

        public VariableIndex(GameModel gameModel) {
            this.gameModel = gameModel;
            this.game = this.gameModel.getGames().get(0);
            this.variables = new ArrayList<>();
        }

        public GameModel getGameModel() {
            return gameModel;
        }

        public Game getGame() {
            return game;
        }

        public List<VariableDescriptor> getVariables() {
            return variables;
        }
    }

    /**
     * @return Looked-up EJB
     */
    public static VariableDescriptorFacade lookup() {
        try {
            return Helper.lookupBy(VariableDescriptorFacade.class);
        } catch (NamingException ex) {
            logger.error("Error retrieving var desc facade", ex);
            return null;
        }
    }
}
