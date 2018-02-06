/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.fasterxml.jackson.databind.JsonNode;
import com.wegas.core.Helper;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.exception.internal.WegasNoResultException;
import com.wegas.core.jcr.content.AbstractContentDescriptor;
import com.wegas.core.jcr.content.ContentConnector;
import com.wegas.core.jcr.content.DescriptorFactory;
import com.wegas.core.jcr.content.DirectoryDescriptor;
import com.wegas.core.jcr.jta.JCRConnectorProvider;
import com.wegas.core.merge.patch.WegasEntityPatch;
import com.wegas.core.merge.patch.WegasPatch;
import com.wegas.core.merge.utils.MergeHelper;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.GameModel.GmType;
import com.wegas.core.persistence.game.GameModelContent;
import com.wegas.core.persistence.variable.DescriptorListI;
import com.wegas.core.persistence.variable.ModelScoped;
import com.wegas.core.persistence.variable.VariableDescriptor;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.Iterator;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.logging.Level;
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
     *
     * @param scenarioIds
     *
     * @return
     */
    private List<GameModel> loadGameModelsFromIds(List<Long> scenarioIds) {
        List<GameModel> scenarios = new ArrayList<>();
        for (Long id : scenarioIds) {
            scenarios.add(gameModelFacade.find(id));
        }
        return scenarios;
    }

    /**
     * Create a gameModel which contains only the content which is shared among all gameModels
     * The structure, as well as gameModel properties, will be the same as the first scenario in the list
     * The returned scenario is not persisted. Caller may personalize the model (changing descriptors visibility).
     * <p>
     * To eventually create and persist the model, method {@link #createModel(com.wegas.core.persistence.game.GameModel, java.util.List)  createModel} must be called
     *
     *
     * @param modelName name of the new model
     * @param scenarios list of gameModel to model, the first acts as reference for descriptors structure
     *
     * @return a game model which contains what all given scenario have in common
     */
    public GameModel createModelFromCommonContent(String modelName, List<GameModel> scenarios) {

        logger.info("Extract Common Content");
        GameModel model = null;
        if (!scenarios.isEmpty()) {
            try {
                // get a copy
                List<GameModel> allScenarios = loadGameModels(scenarios);
                scenarios = loadGameModels(scenarios);
                // extract the first scenario to act as reference

                logger.info("Create model, based on first scenario");
                GameModel srcModel = scenarios.remove(0);
                model = (GameModel) srcModel.duplicate();
                model.setName(modelName);

                /**
                 * Filter gameModelContents
                 */
                logger.info("Filter Libraries");
                Map<String, Map<String, GameModelContent>> libraries = model.getLibraries();
                List<Map<String, Map<String, GameModelContent>>> otherLibraries = new ArrayList<>();

                for (GameModel other : scenarios) {
                    otherLibraries.add(other.getLibraries());
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
                                // at least on scenrios which doesn't define the entry
                                break;
                            }
                        }
                        if (exists) {
                            content.setVisibility(ModelScoped.Visibility.INHERITED);
                            logger.info(" -> keep {}", key);
                        } else {
                            logger.info(" -> evict {}", key);
                            it.remove();
                        }
                    }
                }
                model.setLibraries(libraries);

                List<VariableDescriptor> vdQueue = new ArrayList<>();
                vdQueue.addAll(model.getChildVariableDescriptors());

                List<VariableDescriptor> exclusionCandidates = new ArrayList<>();

                /**
                 * Select variable descriptor to keep
                 */
                logger.info("Process variables");
                while (vdQueue.size() > 0) {
                    VariableDescriptor vd = vdQueue.remove(0);
                    logger.info(" Process {}", vd);
                    boolean exists = true;
                    // does the descriptor exists in all gameModel ?
                    for (GameModel other : scenarios) {
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

                    if (exists) {
                        logger.debug("Descriptor {} exists in all scenarios", vd);
                        // vd exists is all scenarios -> keep
                        vd.setVisibility(ModelScoped.Visibility.INHERITED);
                    } else {
                        logger.debug("Descriptor {} does NOT exists in all scenarios", vd);
                        if (vd instanceof DescriptorListI) {
                            //vd does not exists is all scenarios but may contains a child which is
                            exclusionCandidates.add(vd);
                        } else {
                            // exclude descriptor from model
                            DescriptorListI parent = vd.getParent();
                            parent.remove(vd);
                        }
                    }
                }

                /*
                 * go through exclusionCanditates to detemintate which of them should be kept
                 * a candidate is a descriptor which is not shared among all scenarios, but it may contains children which are.
                 * When it's the case, the descriptor must be kept. 
                 * If the descriptor doesn't contains any children, it can be removed
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

                /*
                 * Persist GameModel
                 */
                model.setType(GameModel.GmType.MODEL);
                model.setBasedOn(null);
                gameModelFacade.createWithDebugGame(model);

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
                    logger.error("JCR FILES");

                    // open all other repositories but the one whose modelRepo is a copy of
                    List<ContentConnector> repositories = new ArrayList<>(scenarios.size());
                    for (GameModel scenario : scenarios) {
                        repositories.add(jCRConnectorProvider.getContentConnector(scenario, ContentConnector.WorkspaceType.FILES));
                    }

                    List<AbstractContentDescriptor> fileQueue = new LinkedList<>();
                    fileQueue.add(DescriptorFactory.getDescriptor("/", modelRepo));

                    while (!fileQueue.isEmpty()) {
                        AbstractContentDescriptor item = fileQueue.remove(0);
                        logger.error("Process {}", item);
                        String path = item.getFullPath();
                        boolean exists = true;
                        for (ContentConnector otherRepository : repositories) {
                            logger.error(" other repo: path {}", path);
                            AbstractContentDescriptor descriptor = DescriptorFactory.getDescriptor(path, otherRepository);
                            if (!descriptor.exist() || !descriptor.getClass().equals(item.getClass())) {
                                logger.error("BREAK");
                                exists = false;
                                break;
                            }
                        }
                        if (exists) {
                            logger.error(" item exists");
                            item.setVisibility(ModelScoped.Visibility.INHERITED);

                            item.setContentToRepository();
                            item.getContentFromRepository();

                            if (item instanceof DirectoryDescriptor) {
                                // directory exists in all scenarios: process children
                                fileQueue.addAll(((DirectoryDescriptor) item).list());
                            }
                        } else {
                            // item does not exists in all scenario -> delete
                            logger.error(" item does not exist");
                            item.delete(true);
                        }

                    }

                } catch (RepositoryException ex) {
                    java.util.logging.Logger.getLogger(ModelFacade.class.getName()).log(Level.SEVERE, null, ex);
                }

                logger.info("Process variables");

            } catch (CloneNotSupportedException ex) {
                logger.error("Exception while creating model", ex);
            }
        }

        return model;
    }

    /**
     *
     * @param vd
     *
     * @return
     */
    private String getParentRef(VariableDescriptor vd) {
        DescriptorListI parent = vd.getParent();
        if (parent instanceof AbstractEntity) {
            return ((AbstractEntity) parent).getRefId();
        } else {
            return null; //throw error ? 
        }
    }

    public GameModel getReference(GameModel model) {
        Collection<GameModel> implementations = gameModelFacade.getImplementations(model);
        for (GameModel gm : implementations) {
            if (gm.getType().equals(GmType.REFERENCE)) {
                return gm;
            }
        }
        return null;
    }

    /**
     * Attach all scenarios to the given model
     *
     * @param model     the model
     * @param scenarios scenario to attach to model
     */
    public void integrateScenario(GameModel model, List<GameModel> scenarios) throws RepositoryException {
        if (model != null) {
            if (GmType.MODEL.equals(model.getType())) {
                GameModel reference = this.getReference(model);

                scenarios = loadGameModels(scenarios);

                // set scenarios refId to model refId
                for (GameModel scenario : scenarios) {
                    scenario.forceRefId(model.getRefId());
                    if (scenario.getType().equals(GmType.SCENARIO)) {
                        scenario.setOnGoingPropagation(Boolean.TRUE);
                    }
                }

                /*
                 * override scenearios pages
                 */
                Map<String, JsonNode> pages = reference.getPages();
                for (GameModel scenario : scenarios) {
                    scenario.setPages(pages);
                }

                Map<VariableDescriptor, VariableDescriptor> toMove = new HashMap<>();
                Map<GameModel, List<VariableDescriptor>> toCreate = new HashMap<>();

                logger.info("Assert variables structure match structure in the model and override refIds");
                for (VariableDescriptor modelVd : model.getVariableDescriptors()) {
                    // iterate over all model's descriptors
                    String modelParentRef = this.getParentRef(modelVd);
                    String name = modelVd.getName();

                    for (GameModel scenario : scenarios) {
                        try {
                            // get corresponding descriptor in the scenrio
                            VariableDescriptor vd = variableDescriptorFacade.find(scenario, name);
                            MergeHelper.resetRefIds(vd, modelVd); // make sure corresponding descriptors share the same refId
                            String parentRef = this.getParentRef(vd);
                            if (!parentRef.equals(modelParentRef)) {
                                logger.info("Descriptor {} will be moved from {} to {}", vd, vd.getParent(), modelVd.getParent());
                                // Parents differs
                                toMove.put(vd, modelVd);  //key : the descriptor to move; value: corresponding descriptor within the model
                            }
                        } catch (WegasNoResultException ex) {
                            // corresponding descriptor not found -> it has to be created
                            logger.info("Descriptor {} will be created in {}", modelVd, modelVd.getParent());
                            if (modelVd instanceof DescriptorListI) {
                                toCreate.putIfAbsent(scenario, new ArrayList<>());
                                toCreate.get(scenario).add(modelVd);
                            }
                        }
                    }
                }

                // Create missing descriptors (DescriptorListI) to ensure all scenarios have the correct struct
                for (GameModel scenario : toCreate.keySet()) {
                    List<VariableDescriptor> vdToCreate = toCreate.get(scenario);

                    logger.info("Create missing descriptor for {}", scenario);
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
                                        variableDescriptorFacade.createChild(scenario, (DescriptorListI<VariableDescriptor>) parent, clone);

                                        logger.info(" CREATE AT as {} child", parent);
                                        it.remove();
                                        restart = true;
                                    } catch (WegasNoResultException ex) {
                                        logger.info(" PARENT {} NOT FOUND -> POSTPONE", modelParent);
                                    }
                                } else {
                                    logger.info(" CREATE AT ROOL LEVEL");
                                    VariableDescriptor clone = (VariableDescriptor) vd.shallowClone();
                                    variableDescriptorFacade.createChild(scenario, scenario, clone);
                                    it.remove();
                                    restart = true;
                                }
                            } catch (CloneNotSupportedException ex) {
                                logger.error("Error while cloning {}", vd);
                            }
                        }

                    } while (restart);
                }

                logger.info("Move misplaced descriptors");
                for (Entry<VariableDescriptor, VariableDescriptor> entry : toMove.entrySet()) {
                    logger.info("Process : {}", entry);
                    //key : the descriptor to move; value: corresponding descriptor within the model
                    this.move(entry.getKey(), entry.getValue());
                }

                // generate initial patch agains model
                WegasEntityPatch initialPatch = new WegasEntityPatch(reference, reference, true);

                logger.info("InitialPatch: {}", initialPatch);

                // apply patch to all scenarios
                for (GameModel scenario : scenarios) {
                    //initialPatch.apply(scenario, null, WegasPatch.PatchMode.OVERRIDE);
                    logger.info("Patch {}", scenario);
                    initialPatch.apply(scenario, scenario);
                    // revive
                    scenario.setBasedOn(model);
                    logger.info("Revive {}", scenario);
                    //scenario.propagateGameModel();

                    logger.debug(Helper.printGameModel(scenario));

                    variableDescriptorFacade.reviveItems(scenario, scenario, false);
                    gameModelFacade.reset(scenario);
                }

                this.syncRepository(model);

                for (GameModel scenario : scenarios) {
                    if (scenario.getType().equals(GmType.SCENARIO)) {
                        scenario.setOnGoingPropagation(Boolean.FALSE);
                    }
                }

                logger.info("PROCESS COMPLETED");
            }
        }
    }

    /**
     *
     * @param model
     */
    private void syncRepository(GameModel model) throws RepositoryException {
        if (model.getType().equals(GmType.MODEL)) {
            GameModel reference = this.getReference(model);
            Collection<GameModel> implementations = gameModelFacade.getImplementations(model);

            if (reference != null) {

                ContentConnector modelRepo = jCRConnectorProvider.getContentConnector(model, ContentConnector.WorkspaceType.FILES);
                ContentConnector refRepo = jCRConnectorProvider.getContentConnector(reference, ContentConnector.WorkspaceType.FILES);

                AbstractContentDescriptor modelRoot = DescriptorFactory.getDescriptor("/", modelRepo);
                AbstractContentDescriptor refRoot = DescriptorFactory.getDescriptor("/", refRepo);

                //diff from ref to model files
                WegasPatch patch = new WegasEntityPatch(refRoot, modelRoot, Boolean.TRUE);

                for (GameModel scenario : implementations) {
                    if (scenario.getType().equals(GmType.SCENARIO)) {
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
     * @param modelVd the correpsonding descriptor in the model
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
     * Propagate mode to all implementations
     *
     * @param gameModel
     *
     * @return
     *
     */
    private GameModel propagateModel(GameModel gameModel) throws RepositoryException {
        if (gameModel.getType().equals(GmType.MODEL)) {
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
                for (GameModel scenario : implementations) {
                    // avoid propagating to game's scenarios or to the model
                    if (scenario.getType().equals(GmType.SCENARIO)) {
                        scenario.setOnGoingPropagation(Boolean.TRUE);
                        patch.apply(scenario, scenario);

                        logger.info("Revive {}", scenario);
                        //scenario.propagateGameModel();
                        variableDescriptorFacade.reviveItems(scenario, scenario, false);
                        gameModelFacade.reset(scenario);
                    }
                }

                patch.apply(reference, reference);
                //reference.propagateGameModel();

                this.syncRepository(gameModel);

                for (GameModel scenario : implementations) {
                    // avoid propagating to game's scenarios or to the model
                    if (scenario.getType().equals(GmType.SCENARIO)) {
                        scenario.setOnGoingPropagation(Boolean.FALSE);
                    }
                }
            }
            return gameModel;
        } else {
            throw WegasErrorMessage.error("GameModel " + gameModel + " is not a model (sic)");
        }
    }
}
