/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import ch.albasim.wegas.annotations.ProtectionLevel;
import com.fasterxml.jackson.databind.JsonNode;
import com.wegas.core.Helper;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.exception.internal.WegasNoResultException;
import com.wegas.core.i18n.ejb.I18nFacade;
import com.wegas.core.jcr.content.AbstractContentDescriptor;
import com.wegas.core.jcr.content.ContentConnector;
import com.wegas.core.jcr.content.DescriptorFactory;
import com.wegas.core.jcr.content.DirectoryDescriptor;
import com.wegas.core.jcr.jta.JCRConnectorProvider;
import com.wegas.core.jcr.page.Pages;
import com.wegas.core.merge.patch.WegasEntityPatch;
import com.wegas.core.merge.patch.WegasPatch;
import com.wegas.core.merge.utils.MergeHelper;
import com.wegas.core.merge.utils.MergeHelper.MergeableVisitor;
import com.wegas.core.merge.utils.WegasFieldProperties;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.Mergeable;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.GameModelContent;
import com.wegas.core.persistence.game.GameModelLanguage;
import com.wegas.core.persistence.variable.DescriptorListI;
import com.wegas.core.persistence.variable.ModelScoped;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.core.persistence.variable.statemachine.AbstractState;
import com.wegas.core.persistence.variable.statemachine.AbstractStateMachineDescriptor;
import com.wegas.core.persistence.variable.statemachine.AbstractTransition;
import com.wegas.core.persistence.variable.statemachine.State;
import com.wegas.core.persistence.variable.statemachine.StateMachineDescriptor;
import com.wegas.core.persistence.variable.statemachine.Transition;
import com.wegas.core.persistence.variable.statemachine.TriggerDescriptor;
import com.wegas.mcq.persistence.ChoiceInstance;
import com.wegas.messaging.persistence.InboxInstance;
import com.wegas.resourceManagement.persistence.BurndownInstance;
import com.wegas.resourceManagement.persistence.Iteration;
import com.wegas.resourceManagement.persistence.ResourceInstance;
import com.wegas.reviewing.persistence.PeerReviewDescriptor;
import com.wegas.reviewing.persistence.PeerReviewInstance;
import com.wegas.reviewing.persistence.Review;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Deque;
import java.util.HashMap;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Set;
import java.util.logging.Level;
import java.util.stream.Collectors;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.inject.Inject;
import javax.jcr.RepositoryException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author maxence
 */
@Stateless
@LocalBean
public class ModelFacade {

    private static final Logger logger = LoggerFactory.getLogger(ModelFacade.class);

    @Inject
    private GameModelFacade gameModelFacade;

    @Inject
    private VariableDescriptorFacade variableDescriptorFacade;

    @Inject
    private RequestManager requestManager;

    @Inject
    private JCRConnectorProvider jCRConnectorProvider;

    @Inject
    private WebsocketFacade websocketFacade;

    @Inject
    private I18nFacade i18nFacade;

    /**
     * return a new list of managed scenarios
     *
     * @param scenarios
     *
     * @return scenarios copy, ensuring its content is managed
     */
    private List<GameModel> loadGameModels(List<GameModel> scenarios) {
        List<GameModel> scens = new ArrayList<>();
        for (GameModel gm : scenarios) {
            scens.add(gameModelFacade.find(gm.getId()));
        }
        return scens;
    }

    /**
     *
     * @param modelName
     * @param scenarioIds
     *
     * @return
     */
    public GameModel createModelFromCommonContentFromIds(String modelName, List<Long> scenarioIds) {
        return createModelFromCommonContent(modelName, loadGameModelsFromIds(scenarioIds));
    }

    /**
     * Load gamemodels from list of IDs
     *
     * @param scenarioIds IDs of the gamemodel to load
     *
     * @return list of managed gameModels
     */
    private List<GameModel> loadGameModelsFromIds(List<Long> scenarioIds) {
        List<GameModel> scenarios = new ArrayList<>();
        for (Long id : scenarioIds) {
            scenarios.add(gameModelFacade.find(id));
        }
        return scenarios;
    }

    private void resetVariableDescriptorInstanceRefIds(VariableDescriptor vd, boolean clear) {
        VariableInstance defaultInstance = null;
        if (vd != null) {
            defaultInstance = vd.getDefaultInstance();
        }
        for (VariableInstance instance : variableDescriptorFacade.getInstances(vd).values()) {
            MergeHelper.resetRefIds(instance, defaultInstance, clear);
        }
    }

    /**
     * Clear non-modelable content. Some entities do not well support model extraction process.
     * Thus, those should be wiped out from the newly extracted model
     */
    private static class ClearModel implements MergeableVisitor {

        @Override
        public boolean visit(Mergeable target, ProtectionLevel protectionLevel, int level, WegasFieldProperties field, Deque<Mergeable> ancestors, Mergeable[] references) {
            if (target instanceof ResourceInstance) {
                ResourceInstance ri = (ResourceInstance) target;
                ri.setActivities(new ArrayList<>());
            } else if (target instanceof BurndownInstance) {
                BurndownInstance bi = (BurndownInstance) target;
                bi.setIterations(new ArrayList<>());
            } else if (target instanceof Iteration) {
                Iteration i = (Iteration) target;
                i.setPeriods(new ArrayList<>());
            } else if (target instanceof InboxInstance) {
                InboxInstance ii = (InboxInstance) target;
                ii.setMessages(new ArrayList<>());
            } else if (target instanceof PeerReviewInstance) {
                // PeerReview evaluation in defaultInstance dows not make sense
                PeerReviewInstance pri = (PeerReviewInstance) target;
                pri.setReviewState(PeerReviewDescriptor.ReviewingState.NOT_STARTED);
                pri.setToReview(new ArrayList<>());
                pri.setReviewed(new ArrayList<>());
            } else if (target instanceof Review) {
                // not really necessary since all review have just been wiped out few lines above
                Review r = (Review) target;
                r.setReviewState(Review.ReviewState.DISPATCHED);
                r.setFeedback(new ArrayList<>());
                r.setComments(new ArrayList<>());
            } else if (target instanceof ChoiceInstance) {
                ChoiceInstance ci = (ChoiceInstance) target;
                ci.setReplies(new ArrayList<>());
            }
            return true;
        }
    }

    /**
     * Some entities deserve a special treatment before their integration in a model cluster. Target
     * is the scenario to integrate. reference #1 is the model
     * <ul>
     * <li>set all descriptor, gamemodelcontents and languages as private.</li>
     * <li>clear state machine states for each fsm which exists in the model</li>
     * </ul>
     * <p>
     */
    private static class PreIntegrateScenarioClear implements MergeableVisitor {

        @Override
        public boolean visit(Mergeable target, ProtectionLevel protectionLevel, int level, WegasFieldProperties field, Deque<Mergeable> ancestors, Mergeable references[]) {
            // be sure descriptor visibility is set to PRIVATE. The correct one will be set when applying the patch.
            if (target instanceof VariableDescriptor) {
                ((VariableDescriptor) target).setVisibility(ModelScoped.Visibility.PRIVATE);
            }

            // same got gamemodelcontent visibilites
            if (target instanceof GameModelContent) {
                ((GameModelContent) target).setVisibility(ModelScoped.Visibility.PRIVATE);
            }

            if (target instanceof GameModelLanguage) {
                ((GameModelLanguage) target).setVisibility(ModelScoped.Visibility.PRIVATE);
            }

            if (target instanceof AbstractStateMachineDescriptor && target instanceof TriggerDescriptor == false // all FSMs but triggers
                && references.length > 0 && references[0] instanceof StateMachineDescriptor) {
                AbstractStateMachineDescriptor inScenario = (AbstractStateMachineDescriptor) target;
                AbstractStateMachineDescriptor inModel = (AbstractStateMachineDescriptor) target;

                // the state machine exists in the model.
                //inScenario.setStates(new HashMap<>());
                Set<? extends AbstractState> inModelStates = inModel.getInternalStates();

                for (Iterator<State> itState = inScenario.getInternalStates().iterator(); itState.hasNext();) {
                    State state = itState.next();
                    boolean found = false;
                    for (AbstractState mState : inModelStates) {

                        if (mState.getIndex().equals(state.getIndex())) {
                            // the state exists in the model and in the scenario
                            for (Iterator<Transition> itTransition = state.getTransitions().iterator(); itTransition.hasNext();) {
                                AbstractTransition t = itTransition.next();
                                t.getDependencies().clear();
                                itTransition.remove();
                            }

                            found = true;
                            break;
                        }
                    }
                    if (!found) {
                        // the state does not exists in the model => remove it
                        itState.remove();
                    }
                }
            }
            return true;
        }
    }

    /**
     * Create a gameModel which contains only the content which is shared among all gameModels The
     * structure, as well as gameModel properties, will be the same as the first scenario in the
     * list The returned scenario is not persisted. Caller may personalize the model (changing
     * descriptors visibility).
     * <p>
     * To eventually create and persist the model, method
     * {@link #createModel(com.wegas.core.persistence.game.GameModel, java.util.List)  createModel}
     * must be called
     *
     *
     * @param modelName name of the new model
     * @param scenarios list of gameModel to model, the first acts as reference for descriptors
     *                  structure
     *
     * @return a game model which contains what all given scenario have in common
     */
    public GameModel createModelFromCommonContent(String modelName, List<GameModel> scenarios) {

        logger.info("Extract Common Content");
        GameModel model = null;
        if (!scenarios.isEmpty()) {
            try {
                // all scenarios
                List<GameModel> allScenarios = loadGameModels(scenarios);
                // all scenario but the first
                List<GameModel> otherScenarios = loadGameModels(scenarios);
                // extract the first scenario to act as reference

                // equiv to the model + original scenarios
//                List<GameModel> allGameModels = new ArrayList<>(scenarios);
                logger.info("Create model, based on first scenario");
                GameModel srcModel = otherScenarios.remove(0);
                model = (GameModel) srcModel.duplicate();
                model.setName(modelName);

                // add model in first position
//                allGameModels.add(0, model);
                processLanguages(model, scenarios);

                /**
                 * Filter gameModelContents
                 */
                logger.info("Filter Libraries");
                Map<String, Map<String, GameModelContent>> libraries = model.getLibrariesAsMap();
                List<Map<String, Map<String, GameModelContent>>> otherLibraries = new ArrayList<>();

                for (GameModel other : allScenarios) {
                    otherLibraries.add(other.getLibrariesAsMap());
                }

                for (Entry<String, Map<String, GameModelContent>> libEntry : libraries.entrySet()) {

                    String libraryName = libEntry.getKey();
                    logger.info(" Process {}", libraryName);

                    Map<String, GameModelContent> library = libEntry.getValue();
                    for (Iterator<Entry<String, GameModelContent>> it = library.entrySet().iterator(); it.hasNext();) {
                        Entry<String, GameModelContent> entry = it.next();
                        String key = entry.getKey();
                        GameModelContent content = entry.getValue();
                        boolean exists = true;
                        for (Map<String, Map<String, GameModelContent>> otherLibs : otherLibraries) {
                            Map<String, GameModelContent> otherLib = otherLibs.get(libraryName);
                            if (!otherLib.containsKey(key)) {
                                exists = false;
                                // at least on scenario which doesn't define the entry
                                break;
                            }
                        }
                        if (exists) {
                            content.setVisibility(ModelScoped.Visibility.INHERITED);
                            logger.info(" -> keep {}", key);

                            for (Map<String, Map<String, GameModelContent>> otherLibs : otherLibraries) {
                                Map<String, GameModelContent> otherLib = otherLibs.get(libraryName);
                                GameModelContent other = otherLib.get(key);
                                other.forceRefId(content.getRefId());
                                other.setVisibility(ModelScoped.Visibility.INTERNAL);
                            }

                        } else {
                            logger.info(" -> evict {}", key);
                            it.remove();
                        }
                    }
                }
                model.setLibrariesFromMap(libraries);

                List<VariableDescriptor> vdQueue = new ArrayList<>();
                vdQueue.addAll(model.getChildVariableDescriptors());

                List<VariableDescriptor> exclusionCandidates = new ArrayList<>();

                /**
                 * Select variable descriptor to keep
                 */
                logger.info("Process variables");
                while (!vdQueue.isEmpty()) {
                    VariableDescriptor vd = vdQueue.remove(0);
                    logger.info(" Process {}", vd);
                    boolean exists = true;
                    // does the descriptor exists in all gameModel ?
                    for (GameModel other : otherScenarios) {
                        try {
                            variableDescriptorFacade.find(other, vd.getName());
                        } catch (WegasNoResultException ex) {
                            exists = false;
                            break;
                        }
                    }

                    // queue all children even if the current descriptor doesn't exists in all scenarios
                    // becaus such a children may exists in all scenarios
                    if (vd instanceof DescriptorListI) {
                        DescriptorListI list = (DescriptorListI) vd;
                        vdQueue.addAll(list.getItems());
                    }

                    if (!exists) {
                        logger.debug("Descriptor {} does NOT exists in all scenarios", vd);
                        if (vd instanceof DescriptorListI) {
                            //vd does not exists in all scenarios but may contains a child which is
                            exclusionCandidates.add(vd);
                        } else {
                            // exclude descriptor from model
                            DescriptorListI parent = vd.getParent();
                            parent.remove(vd);
                        }
                    }
                }

                /*
                 * go through exclusionCanditates to detemintate which of them should be kept a
                 * candidate is a descriptor which is not shared among all scenarios, but itState may
                 * contains children which are. When itState's the case, the descriptor must be kept. If
                 * the descriptor doesn't contains any children, itState can be removed
                 */
                boolean restart;
                do {
                    restart = false;
                    for (Iterator<VariableDescriptor> it = exclusionCandidates.iterator(); it.hasNext();) {
                        VariableDescriptor vd = it.next();
                        logger.debug("Should keep {} ?", vd);
                        DescriptorListI list = (DescriptorListI) vd;
                        if (list.size() == 0) {
                            // list descriptor doesnt's have any children -> remove
                            logger.debug(" -> NO (is empty)");
                            it.remove();
                            vd.getParent().remove(vd);
                            // since the structure has changed, another iteration is required because vd.getParent() may now be empty
                            restart = true;
                        } else {
                            // vd has children -> keep
                            vd.setVisibility(ModelScoped.Visibility.INHERITED);
                        }
                    }
                } while (restart);

                /**
                 * Clean sub-levels: make sure no non-extractable content exist in the model
                 */
                MergeHelper.visitMergeable(model, true, new ClearModel());

                /*
                 * Persist GameModel
                 */
                model.setType(GameModel.GmType.MODEL);
                model.setBasedOn(null);
                gameModelFacade.createWithDebugGame(model);

                /*
                 * Selection Process is over. -> reset refId -> import missing translations
                 */
                for (VariableDescriptor vd : model.getVariableDescriptors()) {
                    logger.debug("Descriptor {} exists in all scenarios", vd);
                    // vd exists is all scenarios -> keep
                    // change visibility from PRIVATE TO INHERITED
                    vd.setVisibility(ModelScoped.Visibility.INHERITED);

                    // make sure corresponding descriptors share the same refId
                    for (GameModel other : allScenarios) {
                        try {
                            VariableDescriptor find = variableDescriptorFacade.find(other, vd.getName());
                            MergeHelper.resetRefIds(find, vd, false);
                            this.resetVariableDescriptorInstanceRefIds(find, false);

                            // prevent modification until first model propagation
                            find.setVisibility(ModelScoped.Visibility.INTERNAL);
                        } catch (WegasNoResultException ex) {
                            logger.error("Missing descriptor");
                        }
                    }
                }

                for (GameModel scenario : allScenarios) {
                    logger.info("Register Implementation {} to {}", scenario, model);
                    //model.getImplementations().add(scenario);
                    scenario.setBasedOn(model);
                }

                /*
                 * JCR REPOSITORY
                 */
                gameModelFacade.duplicateRepository(model, srcModel);

                // Open the brand new model repository
                try {
                    ContentConnector modelRepo = jCRConnectorProvider.getContentConnector(model, ContentConnector.WorkspaceType.FILES);
                    logger.trace("JCR FILES");

                    // open all other repositories but the one whose modelRepo is a copy of
                    List<ContentConnector> repositories = new ArrayList<>(otherScenarios.size());
                    for (GameModel scenario : otherScenarios) {
                        repositories.add(jCRConnectorProvider.getContentConnector(scenario, ContentConnector.WorkspaceType.FILES));
                    }

                    List<AbstractContentDescriptor> fileQueue = new LinkedList<>();
                    fileQueue.add(DescriptorFactory.getDescriptor("/", modelRepo));

                    while (!fileQueue.isEmpty()) {
                        AbstractContentDescriptor item = fileQueue.remove(0);
                        logger.trace("Process {}", item);
                        String path = item.getFullPath();
                        boolean exists = true;
                        for (ContentConnector otherRepository : repositories) {
                            logger.trace(" other repo: path {}", path);
                            AbstractContentDescriptor descriptor = DescriptorFactory.getDescriptor(path, otherRepository);
                            if (!descriptor.exist() || !descriptor.getClass().equals(item.getClass())) {
                                logger.trace("BREAK");
                                exists = false;
                                break;
                            }
                        }
                        if (exists) {
                            logger.trace(" item exists");
                            item.setVisibility(ModelScoped.Visibility.INHERITED);

                            // Flush
                            item.saveContentToRepository();
                            item.loadContentFromRepository();

                            if (item instanceof DirectoryDescriptor) {
                                // directory exists in all scenarios: process children
                                fileQueue.addAll(((DirectoryDescriptor) item).list());
                            }
                        } else {
                            // item does not exists in all scenario -> delete
                            logger.trace(" item does not exist");
                            item.delete(true);
                        }

                    }

                } catch (RepositoryException ex) {
                    java.util.logging.Logger.getLogger(ModelFacade.class.getName()).log(Level.SEVERE, null, ex);
                }

                logger.trace("Process variables");

                requestManager.flushAndClearCaches();
                model = gameModelFacade.find(model.getId());

            } catch (CloneNotSupportedException ex) {
                logger.error("Exception while creating model", ex);
            }
        }

        return model;
    }

    public Map<String, List<Long>> getVariableMatrixFromIds(List<Long> gameModelIds) {
        return getVariableMatrix(loadGameModelsFromIds(gameModelIds));
    }

    public Map<String, List<Long>> getVariableMatrix(List<GameModel> gameModels) {

        Map<String, List<Long>> matrix = new LinkedHashMap<>();

        for (GameModel gameModel : gameModels) {
            for (VariableDescriptor vd : gameModel.getOrderedVariableDesacriptors()) {
                String vdName = vd.getName();
                if (!matrix.containsKey(vdName)) {
                    matrix.put(vdName, new LinkedList<>());
                }
                matrix.get(vdName).add(gameModel.getId());
            }
        }

        return matrix;
    }

    /**
     * Get model reference.
     *
     * @param model the model
     *
     * @return the reference or null
     */
    public GameModel getReference(GameModel model) {
        return gameModelFacade.findReference(model);
    }

    /**
     * Exclude scenario identified by the given id from its model cluster.
     *
     * @see #releaseScenario(com.wegas.core.persistence.game.GameModel)
     * @param scenarioId id of the scenario to release.
     *
     * @return the just released scenario
     */
    public GameModel releaeScenario(Long scenarioId) {
        return this.releaseScenario(gameModelFacade.find(scenarioId));
    }

    /**
     * Exclude the given scenario from its model cluster.
     * <ol>
     * <li>Set all descriptors, all gamemodel contents and all languages as private ones</li>
     * <li>Reset all refIds</li>
     * </ol>
     *
     * @param scenario the scenario to release.
     *
     * @return the just released scenario
     */
    public GameModel releaseScenario(GameModel scenario) {
        for (VariableDescriptor vd : scenario.getVariableDescriptors()) {
            vd.setVisibility(ModelScoped.Visibility.PRIVATE);
        }

        List<GameModelContent> library = scenario.getLibraries();
        for (GameModelContent content : library) {
            content.setVisibility(ModelScoped.Visibility.PRIVATE);
        }

        for (GameModelLanguage lang : scenario.getRawLanguages()) {
            lang.setVisibility(ModelScoped.Visibility.PRIVATE);
        }

        MergeHelper.resetRefIds(scenario, null, Boolean.TRUE);

        // Since default instance and their children now have brand new refid,
        // make sure to propagate them to test player instances
        for (VariableDescriptor vd : scenario.getVariableDescriptors()) {
            this.resetVariableDescriptorInstanceRefIds(vd, true);
        }

        scenario.setBasedOn(null);

        return scenario;
    }

    public VariableDescriptor releaseVariableFromModel(Long variableId) {
        VariableDescriptor vd = variableDescriptorFacade.find(variableId);
        this.releaseVariableFromModel(vd.getGameModel(), vd.getName());
        return vd;
    }

    public void releaseVariableFromModel(GameModel model, String variableName) {

        if (model.isModel()) {
            try {
                VariableDescriptor mVd = variableDescriptorFacade.find(model, variableName);
                variableDescriptorFacade.resetVisibility(mVd, ModelScoped.Visibility.PRIVATE);

                List<GameModel> implementations = gameModelFacade.getImplementations(model);
                for (GameModel impl : implementations) {
                    if (!impl.isReference()) {
                        try {
                            VariableDescriptor vd = variableDescriptorFacade.find(impl, variableName);

                            variableDescriptorFacade.resetVisibility(vd, ModelScoped.Visibility.PRIVATE);
                            MergeHelper.resetRefIds(vd, null, Boolean.TRUE);

                            this.resetVariableDescriptorInstanceRefIds(vd, true);
                        } catch (WegasNoResultException ex) { // NOPMD
                        }
                    }
                }

            } catch (WegasNoResultException ex) { // NOPMD
                // just skip
            }
        }
    }

    /**
     * Normalise Languages. Reset refId (same code, same refId) for each code which exists in the
     * model Assert same name, same code
     */
    public void processLanguages(GameModel model, List<GameModel> scenarios) {

        Map<String, String> codeToLangName = new HashMap<>();
        Map<String, String> langNameToCode = new HashMap<>();
        Map<String, GameModelLanguage> langRefs = new HashMap<>();

        // map model languages by code
        for (GameModelLanguage gml : model.getRawLanguages()) {
            langRefs.put(gml.getCode(), gml);
            codeToLangName.put(gml.getCode(), gml.getLang());
            langNameToCode.put(gml.getLang(), gml.getCode());
            //make sure all languages in the model are protected
            gml.setVisibility(ModelScoped.Visibility.PROTECTED);
        }

        List<String> errors = new ArrayList<>();
        //go through all languages from  implementations
        for (GameModel gameModel : scenarios) {
            for (GameModelLanguage gml : gameModel.getRawLanguages()) {
                GameModelLanguage ref = langRefs.get(gml.getCode());

                if (ref != null) {
                    // impl lang code found
                    if (ref.getLang().equals(gml.getLang())) {
                        // same name, same code
                        gml.forceRefId(ref.getRefId());
                        gml.setVisibility(ModelScoped.Visibility.PROTECTED);
                    } else {
                        // same code, different name
                        errors.add("GameModel " + gameModel + " " + gml.getCode() + " has the wrong name of "
                            + gml.getLang() + " rather than " + codeToLangName.get(gml.getCode()) + "!");
                    }
                } else {
                    // code not found, but name exists !
                    if (langNameToCode.get(gml.getLang()) != null) {
                        errors.add("GameModel " + gameModel + " " + gml.getLang() + " has the wrong code of "
                            + gml.getCode() + " rather than " + langNameToCode.get(gml.getLang()) + "!");
                    } else {
                        gml.forceRefId(null);
                        gml.assertRefId();
                    }
                }
            }
        }
        if (!errors.isEmpty()) {
            String fullError = "";
            for (String error : errors) {
                logger.error(error);
                fullError += error;
            }
            throw WegasErrorMessage.error(fullError);
        }

    }

    public void fixVariableTree(Long modelId) throws RepositoryException {
        GameModel model = gameModelFacade.find(modelId);
        List<GameModel> implementations = gameModelFacade.getImplementations(model);
        fixVariableTree(model, implementations, true);
    }

    public void fixVariableTree(Long modelId, List<Long> scenarios) throws RepositoryException {
        fixVariableTree(gameModelFacade.find(modelId),
            scenarios.stream()
                .map(id -> gameModelFacade.find(id))
                .collect(Collectors.toList()),
             true);
    }

    private String buildPath(DescriptorListI list) {
        if (list instanceof GameModel) {
            return "/";
        } else if (list instanceof VariableDescriptor) {
            return buildPath(((VariableDescriptor) list).getParent()) + ((VariableDescriptor) list).getName() + "/";
        } else {
            return ("?");
        }
    }

    private String getParentRef(VariableDescriptor vd) {
        DescriptorListI list = vd.getParent();
        if (list instanceof AbstractEntity) {
            return ((AbstractEntity) list).getRefId();
        } else {
            return null;
        }
    }

    /**
     * Modify scenarios variable structure to match the one of the given model.
     * <p>
     * First step ensures all variable with the same name (scriptAlias) have the same refId. Second
     * step.
     * <p>
     * Second ensure scenarios have the same variable tree structure by creating missing directories
     * and/or moving existing variables.
     *
     * @param model
     * @param scenarios
     * @param ignorePrivate
     *
     * @throws RepositoryException
     */
    public void fixVariableTree(GameModel model, List<GameModel> scenarios, boolean ignorePrivate) throws RepositoryException {
        if (model != null) {
//            if (model.isModel()) {
            // force all refIds
            for (GameModel scenario : scenarios) {
                if (scenario.isScenario()) {
                    scenario.forceRefId(model.getRefId());

                    for (VariableDescriptor modelVd : model.getVariableDescriptors()) {
                        try {
                            // make sure corresponding descriptors share the same refId

                            String name = modelVd.getName();
                            VariableDescriptor vd = variableDescriptorFacade.find(scenario, name);

                            MergeHelper.resetRefIds(vd, modelVd, false);
                            this.resetVariableDescriptorInstanceRefIds(vd, false);
                        } catch (WegasNoResultException ex) {// NOPMD
                            // just skip
                        }
                    }
                }
            }

            Map<VariableDescriptor, VariableDescriptor> toMove = new HashMap<>();
            Map<GameModel, List<VariableDescriptor>> toCreate = new HashMap<>();

            logger.info("Assert variables structure match structure in the model and override refIds");
            for (VariableDescriptor modelVd : model.getVariableDescriptors()) {
                // iterate over all model's descriptors
                String modelParentRef = this.getParentRef(modelVd);
                String name = modelVd.getName();
                if (!ignorePrivate || modelVd.getVisibility() != ModelScoped.Visibility.PRIVATE) {

                    for (GameModel scenario : scenarios) {
                        try {
                            // get corresponding descriptor in the scenrio
                            VariableDescriptor vd = variableDescriptorFacade.find(scenario, name);

                            String parentRef = this.getParentRef(vd);
                            if (!parentRef.equals(modelParentRef)) {
                                logger.info("Descriptor {} will be moved from {} to {}", vd, buildPath(vd.getParent()), buildPath(modelVd.getParent()));
                                // Parents differs
                                toMove.put(vd, modelVd);  //key : the descriptor to move; value: corresponding descriptor within the model
                            }
                        } catch (WegasNoResultException ex) {
                            // corresponding descriptor not found -> itState has to be created
                            // but, in this step we only care about directories
                            logger.info("Descriptor {} will be created in {} at {}", modelVd, scenario, buildPath(modelVd.getParent()));
                            if (modelVd instanceof DescriptorListI) {
                                toCreate.putIfAbsent(scenario, new ArrayList<>());
                                toCreate.get(scenario).add(modelVd);
                            }
                        }
                    }
                }
            }

            // Create missing descriptors (DescriptorListI) to ensure all scenarios have the correct struct
            for (Entry<GameModel, List<VariableDescriptor>> entry : toCreate.entrySet()) {
                GameModel scenario = entry.getKey();
                List<VariableDescriptor> vdToCreate = entry.getValue();

                logger.info("Create missing descriptor for {}", scenario);
                boolean toRelease = false;
                if (scenario.isProtected()) {
                    toRelease = true;
                    scenario.setOnGoingPropagation(Boolean.TRUE);
                }
                boolean restart;
                do {
                    restart = false;
                    for (Iterator<VariableDescriptor> it = vdToCreate.iterator(); it.hasNext();) {
                        VariableDescriptor vd = it.next();

                        try {
                            logger.info(" - missing descriptor is {}", vd);
                            DescriptorListI modelParent = vd.getParent();
                            if (modelParent instanceof VariableDescriptor) {
                                String parentName = ((VariableDescriptor) modelParent).getName();
                                try {
                                    VariableDescriptor parent = variableDescriptorFacade.find(scenario, parentName);
                                    VariableDescriptor clone;
                                    clone = (VariableDescriptor) vd.shallowClone();
                                    variableDescriptorFacade.createChild(scenario, (DescriptorListI<VariableDescriptor>) parent, clone, false, false);

                                    logger.info(" CREATE AT as {} child", parent);
                                    it.remove();
                                    restart = true;
                                } catch (WegasNoResultException ex) {
                                    logger.info(" PARENT {} NOT FOUND -> POSTPONE", modelParent);
                                }
                            } else {
                                logger.info(" CREATE AT ROOL LEVEL");
                                VariableDescriptor clone = (VariableDescriptor) vd.shallowClone();
                                variableDescriptorFacade.createChild(scenario, scenario, clone, false, false);
                                clone.setName(vd.getName()); // force the new variable name
                                it.remove();
                                restart = true;
                            }
                        } catch (CloneNotSupportedException ex) {
                            logger.error("Error while cloning {}", vd);
                        }
                    }

                } while (restart);

                if (toRelease) {
                    scenario.setOnGoingPropagation(Boolean.FALSE);
                }
            }

            logger.info("Move misplaced descriptors");
            for (Entry<VariableDescriptor, VariableDescriptor> entry : toMove.entrySet()) {
                logger.info("Process : {}", entry);
                //key : the descriptor to move; value: corresponding descriptor within the model
                this.move(entry.getKey(), entry.getValue());
            }

//            } else {
//                // model is not a model
//                throw WegasErrorMessage.error("Model is not a Model");
//            }
        }
    }

    /**
     * EclipseLink seems to do strange things when the first level cache is very full, like
     * re-creating existing variables, or throwing erratic OptimisticLockException.
     * <p>
     * Clearing this cache prevent such a behaviour but such an operation must be used carefully
     * because all not-flushed entities will be detached after that.
     *
     * @param modelId
     * @param referenceId
     * @param scenarioId
     *
     * @throws RepositoryException
     */
    private void doInitialPatchAndClear(Long modelId, Long referenceId, Long scenarioId) throws RepositoryException {
        requestManager.flushAndClearCaches();

        GameModel model = gameModelFacade.find(modelId);
        GameModel reference = gameModelFacade.find(referenceId);
        GameModel scenario = gameModelFacade.find(scenarioId);
        scenario.setOnGoingPropagation(Boolean.TRUE);

        // generate initial patch against model
        WegasEntityPatch initialPatch = new WegasEntityPatch(reference, reference, true);

        logger.info("InitialPatch: {}", initialPatch);

        //initialPatch.apply(scenario, null, WegasPatch.PatchMode.OVERRIDE);
        logger.info("Patch {}", scenario);
        initialPatch.apply(scenario, scenario);
        // revive
        scenario.setBasedOn(model);

        logger.info("Revive {}", scenario);

        logger.debug(Helper.printGameModel(scenario));

        /**
         * This flush is required by several EntityRevivedEvent listener, which operate some SQL
         * queries (which didn't return anything before entities have been flushed to database
         * <p>
         * for instance, reviving a taskDescriptor needs to fetch others tasks by name, it will not
         * return any result if this flush not occurs
         */
        variableDescriptorFacade.flush();

        variableDescriptorFacade.reviveItems(scenario, scenario, false);
        variableDescriptorFacade.flush();
        variableDescriptorFacade.reviveAllScopedInstances(scenario);
        //gameModelFacade.reset(scenario); // too much work...
        this.registerPagesPropagates(scenario);

        requestManager.flushAndClearCaches();
    }

    /**
     * Attach all scenarios to the given model
     *
     * @param model     the model
     * @param scenarios scenario to attach to model
     *
     * @throws javax.jcr.RepositoryException
     */
    public void integrateScenario(GameModel model, List<GameModel> scenarios) throws RepositoryException {
        if (model != null) {
            if (model.isModel()) {
                List<GameModel> allGameModels = new ArrayList<>();
                allGameModels.add(model);
                allGameModels.addAll(scenarios);

                GameModel reference = this.getReference(model);

                if (reference != null) {

                    scenarios = loadGameModels(scenarios);

                    // set scenarios refId to model refId
                    for (GameModel scenario : scenarios) {
                        scenario.forceRefId(model.getRefId());
                        if (scenario.isScenario()) {
                            scenario.setOnGoingPropagation(Boolean.TRUE);
                        }
                    }

                    processLanguages(model, scenarios);

                    /*
                     * override scenarios pages
                     */
                    Map<String, JsonNode> pages = reference.getPages();
                    for (GameModel scenario : scenarios) {
                        scenario.setPages(pages);
                    }

                    /**
                     * make sure refids match. Create missing descriptors move descriptor to correct
                     * location
                     */
                    fixVariableTree(model, scenarios, true);

                    /**
                     * Clean sub-levels: make sure to clear statemachine scenarios
                     */
                    for (GameModel scenario : scenarios) {
                        if (scenario.isScenario()) {
                            MergeHelper.visitMergeable(scenario, true, new PreIntegrateScenarioClear(), model);
                        }
                    }

                    requestManager.flushAndClearCaches();

                    // apply patch to all scenarios
                    for (GameModel scenario : scenarios) {
                        doInitialPatchAndClear(model.getId(), reference.getId(), scenario.getId());
                    }
                    requestManager.flushAndClearCaches();
                    logger.info("AfterInitialPatch");

                    // reload entities after cache clearance
                    model = gameModelFacade.find(model.getId());
                    reference = gameModelFacade.find(reference.getId());

                    Map<String, List<GameModel>> translationSources = new HashMap<>();

                    // go through all languages from all scenarios
                    for (GameModel gameModel : allGameModels) {
                        gameModel = gameModelFacade.find(gameModel.getId());
                        for (GameModelLanguage gml : gameModel.getLanguages()) {
                            translationSources.putIfAbsent(gml.getCode(), new ArrayList<>());
                            List<GameModel> gmRef = translationSources.get(gml.getCode());
                            gmRef.add(gameModel);
                            gameModel.setOnGoingPropagation(Boolean.TRUE);
                        }
                    }

                    requestManager.flushAndClearCaches();
                    logger.info("AfterLanguageFetch");

                    model = gameModelFacade.find(model.getId());
                    reference = gameModelFacade.find(reference.getId());

                    // inscript translations
                    for (Entry<String, List<GameModel>> entry : translationSources.entrySet()) {
                        String languageCode = entry.getKey();
                        List<GameModel> gms = entry.getValue();

                        if (gms.contains(model)) {
                            for (GameModel s : gms) {
                                GameModel scen = gameModelFacade.find(s.getId());
                                if (scen.isScenario()) {
                                    logger.info("Before Import in {}", scen);
                                    i18nFacade.importTranslations(scen, model, reference, languageCode);
                                    variableDescriptorFacade.flush();
                                    logger.info("After Import in {}", scen);
                                }
                            }
                        }
                    }

                    this.syncRepository(model);
                    logger.info("After RepoSync");

                    requestManager.flushAndClearCaches();

                    for (GameModel scenario : scenarios) {
                        scenario = gameModelFacade.find(scenario.getId());
                        if (scenario.isScenario()) {
                            scenario.setOnGoingPropagation(Boolean.FALSE);
                        }
                    }

                    logger.info("PROCESS COMPLETED");
                } else {
                    // no reference
                    throw WegasErrorMessage.error("No reference yet. Please propagate model before integrating new scenarios");
                }
            } else {
                // model is not a model
                throw WegasErrorMessage.error("Model is not a Model");
            }
        }
    }

    /**
     * register JTA callbacks which propagate page changes after transaction commit.
     * <p>
     * Fire a pageIndexUpdate and a pageUpdagte for each page.
     *
     * @param scenario
     *
     * @throws RepositoryException
     */
    private void registerPagesPropagates(GameModel scenario) throws RepositoryException {

        Pages pages = jCRConnectorProvider.getPages(scenario);
        // extract IDS now as the session would have been closed in the callback (afterCommit !)
        Set<String> pagesIDs = pages.getPagesContent().keySet();
        Long id = scenario.getId();

        pages.afterCommit((t) -> {
            websocketFacade.pageIndexUpdate(id, requestManager.getSocketId());
            for (String pageId : pagesIDs) {
                websocketFacade.pageUpdate(id, pageId, requestManager.getSocketId());
            }
        });
    }

    /**
     * Propagate JCR changes to implementations and reference.
     *
     * @param model
     */
    private void syncRepository(GameModel model) throws RepositoryException {
        if (model.isModel()) {
            GameModel reference = this.getReference(model);
            Collection<GameModel> implementations = gameModelFacade.getImplementations(model);

            if (reference != null) {

                ContentConnector modelRepo = jCRConnectorProvider.getContentConnector(model, ContentConnector.WorkspaceType.FILES);
                ContentConnector refRepo = jCRConnectorProvider.getContentConnector(reference, ContentConnector.WorkspaceType.FILES);

                AbstractContentDescriptor modelRoot = DescriptorFactory.getDescriptor("/", modelRepo);
                modelRoot.setVisibility(ModelScoped.Visibility.INHERITED);
                AbstractContentDescriptor refRoot = DescriptorFactory.getDescriptor("/", refRepo);

                //diff from ref to model files
                WegasPatch patch = new WegasEntityPatch(refRoot, modelRoot, Boolean.TRUE);

                for (GameModel scenario : implementations) {
                    if (scenario.isScenario()) {
                        // apply patch to each implementations
                        ContentConnector repo = jCRConnectorProvider.getContentConnector(scenario, ContentConnector.WorkspaceType.FILES);
                        AbstractContentDescriptor root = DescriptorFactory.getDescriptor("/", repo);
                        patch.apply(scenario, root);
                    }
                }

                // and patch the reference
                patch.apply(reference, refRoot);
            }
        } else {
            throw WegasErrorMessage.error("GameModel " + model + " is not a model (sic)");
        }

    }

    /**
     * Move vd according to the position of the corresponding modelVd
     *
     * @param vd      the misplaced descriptor
     * @param modelVd the corresponding descriptor in the model
     */
    private void move(VariableDescriptor vd, VariableDescriptor modelVd) {
        // should move find to according to model structure before patching
        DescriptorListI from = vd.getParent();
        DescriptorListI modelParent = modelVd.getParent();

        logger.info("Move {} from {} to {}", vd, from, modelParent);
        from.remove(vd);
        DescriptorListI newParent;

        if (modelParent instanceof VariableDescriptor) {
            // original parent is a descriptor
            String parentName = ((VariableDescriptor) modelParent).getName();
            try {
                newParent = (DescriptorListI) variableDescriptorFacade.find(vd.getGameModel(), parentName);
            } catch (WegasNoResultException ex) {
                logger.error("Parent not found within scenario -> should never occurs");
                newParent = null;
            }
        } else {
            // Root-level descriptor -> parent is the gameModel;
            newParent = vd.getGameModel();
        }

        if (newParent != null) {
            newParent.addItem(vd); // order will be restored later
        } else {
            throw WegasErrorMessage.error("ORPHAN DESCRIPTOR");
        }

    }

    /**
     * Propagate mode to all implementations
     *
     * @param gameModelId
     *
     * @return
     *
     * @throws javax.jcr.RepositoryException
     *
     */
    public GameModel propagateModel(Long gameModelId) throws RepositoryException {
        return this.propagateModel(gameModelFacade.find(gameModelId));
    }

    /**
     * Propagate model to all implementations
     *
     * @param gameModel
     *
     * @return
     *
     */
    private GameModel propagateModel(GameModel gameModel) throws RepositoryException {
        if (gameModel.isModel()) {
            GameModel reference = this.getReference(gameModel);

            if (reference == null) {
                /*
                 * create reference
                 */
                logger.info("Create Reference");
                try {
                    reference = (GameModel) gameModel.duplicate();
                } catch (CloneNotSupportedException ex) {
                    throw WegasErrorMessage.error("Could not create reference by cloning " + gameModel);
                }
                reference.setType(GameModel.GmType.REFERENCE);
                reference.setBasedOn(gameModel);
                gameModelFacade.create(reference);

                // flush to force pages to be stored
                gameModelFacade.flush();

                gameModelFacade.duplicateRepository(reference, gameModel);

                List<GameModel> implementations = gameModelFacade.getImplementations(gameModel);
                this.integrateScenario(gameModel, implementations);

            } else {

                WegasPatch patch = new WegasEntityPatch(reference, gameModel, Boolean.TRUE);

                logger.info("PropagatePatch: {}", patch);

                Collection<GameModel> implementations = gameModelFacade.getImplementations(gameModel);

                // detect language code changes and new languages
                Map<String, String> renamedLanguageCodes = new HashMap<>(); //oldCode ->new code
                List<GameModelLanguage> newLangages = new ArrayList<>();
                for (GameModelLanguage langModel : gameModel.getRawLanguages()) {
                    GameModelLanguage langRef = reference.getLanguageByRefId(langModel.getRefId());

                    if (langRef == null) {
                        newLangages.add(langModel);
                    } else if (!langRef.getCode().equals(langModel.getCode())) {// but different code
                        renamedLanguageCodes.put(langRef.getCode(), langModel.getCode());
                    }

                }

                if (!renamedLanguageCodes.isEmpty()) {
                    logger.info("Need to update some language code {} in the reference before patching implementations", renamedLanguageCodes);
                    for (Entry<String, String> renameLang : renamedLanguageCodes.entrySet()) {
                        i18nFacade.updateTranslationCode(reference, renameLang.getKey(), renameLang.getValue());
                    }
                }

                for (GameModel scenario : implementations) {
                    // avoid propagating to game's scenarios or to the model
                    if (scenario.isScenario()) {
                        scenario.setOnGoingPropagation(Boolean.TRUE);

                        if (!newLangages.isEmpty()) {
                            logger.info("Model created some new languages, link them to existing one, if any");
                            for (GameModelLanguage newLang : newLangages) {
                                // new lang from model already exists in the scenario -> set refId
                                GameModelLanguage byCode = scenario.getLanguageByCode(newLang.getCode());
                                if (byCode != null) {
                                    byCode.forceRefId(newLang.getRefId());
                                }
                                GameModelLanguage byName = scenario.getLanguageByName(newLang.getLang());
                                if (byName != null && !byName.equals(byCode)) {
                                    throw WegasErrorMessage.error("Language with same name (\"" + newLang.getLang()
                                        + "\") already exists, but its code (\""
                                        + byName.getCode() + "\") does not match the one from the model (\"" + newLang.getCode() + "\")");
                                }
                            }

                        }

                        if (!renamedLanguageCodes.isEmpty()) {
                            logger.info("Need to update some language code ({}) before patching implementation", renamedLanguageCodes);
                            for (Entry<String, String> renameLang : renamedLanguageCodes.entrySet()) {
                                i18nFacade.updateTranslationCode(scenario, renameLang.getKey(), renameLang.getValue());
                            }
                        }

                        // detect languages which share the same code but different refId and rule them all
                        for (GameModelLanguage langScen : scenario.getRawLanguages()) {
                            GameModelLanguage langModel = gameModel.getLanguageByCode(langScen.getCode());
                            if (langModel != null && !langModel.getRefId().equals(langScen.getRefId())) {
                                // set scenario language refId to model one
                                langScen.forceRefId(langModel.getRefId());
                            }
                        }

                        patch.apply(scenario, scenario);

                        logger.info("Revive {}", scenario);
                        //scenario.propagateGameModel();

                        /*
                         * This flush is required by several EntityRevivedEvent listener, which
                         * opperate some SQL queries (which didn't return anything before entites
                         * have been flushed to database
                         *
                         * for instance, reviving a taskDescriptor needs to fetch others tasks by
                         * name, itState will not return any result if this flush not occurs
                         */
                        variableDescriptorFacade.flush();

                        variableDescriptorFacade.reviveItems(scenario, scenario, false);

                        variableDescriptorFacade.flush();

                        variableDescriptorFacade.reviveAllScopedInstances(gameModel);

                        for (GameModelLanguage lang : gameModel.getRawLanguages()) {
                            i18nFacade.importTranslations(scenario, gameModel, reference, lang.getCode());
                        }

                        //gameModelFacade.reset(scenario);
                        this.registerPagesPropagates(scenario);
                    }
                }

                patch.apply(reference, reference);
                variableDescriptorFacade.reviveItems(reference, reference, false);
                gameModelFacade.reset(reference);

                //reference.propagateGameModel();
                this.syncRepository(gameModel);

                for (GameModel scenario : implementations) {
                    // avoid propagating to game's scenarios or to the model
                    if (scenario.isScenario()) {
                        scenario.setOnGoingPropagation(Boolean.FALSE);
                    }
                }
            }

            // make sure to return a managed entity
            return gameModelFacade.find(gameModel.getId());
        } else {
            throw WegasErrorMessage.error("GameModel " + gameModel + " is not a model (sic)");
        }
    }
}
