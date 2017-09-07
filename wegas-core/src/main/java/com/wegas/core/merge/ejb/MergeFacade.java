/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.merge.ejb;

import com.fasterxml.jackson.databind.JsonNode;
import com.wegas.core.ejb.GameModelFacade;
import com.wegas.core.ejb.VariableDescriptorFacade;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.exception.internal.WegasNoResultException;
import com.wegas.core.merge.patch.WegasEntityPatch;
import com.wegas.core.merge.patch.WegasPatch;
import com.wegas.core.merge.utils.WegasEntitiesHelper;
import com.wegas.core.merge.utils.WegasEntityFields;
import com.wegas.core.merge.utils.WegasFieldProperties;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.GameModel.GmType;
import com.wegas.core.persistence.game.GameModelContent;
import com.wegas.core.persistence.variable.DescriptorListI;
import com.wegas.core.persistence.variable.ModelScoped;
import com.wegas.core.persistence.variable.VariableDescriptor;
import java.io.IOException;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.inject.Inject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author maxence
 */
@Stateless
@LocalBean
public class MergeFacade {

    private static final Logger logger = LoggerFactory.getLogger(MergeFacade.class);

    @Inject
    private GameModelFacade gameModelFacade;

    @Inject
    private VariableDescriptorFacade variableDescriptorFacade;

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
     * @param scenarioIds
     *
     * @return
     */
    public GameModel extractCommonContentFromIds(List<Long> scenarioIds) {
        return extractCommonContent(loadGameModelsFromIds(scenarioIds));
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
     * @param scenarios list of gameModel to model, the first acts as reference for descriptors structure
     *
     * @return a game model which contains what all given scenario have in common
     */
    public GameModel extractCommonContent(List<GameModel> scenarios) {

        logger.info("Extract Common Content");
        GameModel model = null;
        if (!scenarios.isEmpty()) {
            try {
                // get a copy
                List<GameModel> allScenarios = loadGameModels(scenarios);
                scenarios = loadGameModels(scenarios);
                // extract the first scenario to act as reference

                logger.info("Create model, based on first scenario");
                model = (GameModel) scenarios.remove(0).duplicate();

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
                model.setModel(null);
                gameModelFacade.create(model);

                for (GameModel scenario : allScenarios) {
                    logger.info("Register Implementation {} to {}", scenario, model);
                    //model.getImplementations().add(scenario);
                    scenario.setModel(model);
                }

            } catch (IOException ex) {
                logger.error("Exception while creating model", ex);
            }
        }

        return model;
    }

    /**
     * §
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

    private void resetRefIds(AbstractEntity target, AbstractEntity reference) {
        if (target != null && reference != null) {
            target.setRefId(reference.getRefId());

            WegasEntityFields entityIterator = WegasEntitiesHelper.getEntityIterator(target.getClass());

            for (WegasFieldProperties field : entityIterator.getFields()) {
                if (field.getType().equals(WegasFieldProperties.FieldType.CHILD)) {
                    Method readMethod = field.getPropertyDescriptor().getReadMethod();
                    try {
                        AbstractEntity targetChild = (AbstractEntity) readMethod.invoke(target);
                        AbstractEntity referenceChild = (AbstractEntity) readMethod.invoke(reference);

                        this.resetRefIds(targetChild, referenceChild);

                    } catch (Exception ex) {
                        throw new WegasErrorMessage("error", "Invocation Failure: should never appends");
                    }
                }
            }
        }
    }

    /**
     * Attach all scenarios to the given model
     *
     * @param model     the model
     * @param scenarios scenario to attach to model
     */
    public void integrateScenario(GameModel model, List<GameModel> scenarios) {
        if (model != null) {
            if (GmType.MODEL.equals(model.getType())) {
                GameModel reference = model.getReference();

                scenarios = loadGameModels(scenarios);

                // set scenarios refId to model refId
                for (GameModel scenario : scenarios) {
                    scenario.setRefId(model.getRefId());
                }

                /**
                 * filter pages
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
                            this.resetRefIds(vd, modelVd); // make sure corresponding descriptors share the same refId
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

                            logger.info(" - missing descriptor is {}", vd);
                            DescriptorListI modelParent = vd.getParent();
                            if (modelParent instanceof VariableDescriptor) {
                                String parentName = ((VariableDescriptor) modelParent).getName();
                                try {
                                    VariableDescriptor parent = variableDescriptorFacade.find(scenario, parentName);
                                    VariableDescriptor clone = (VariableDescriptor) vd.clone();
                                    variableDescriptorFacade.createChild(scenario, (DescriptorListI<VariableDescriptor>) parent, clone);

                                    logger.info(" CREATE AT ROOL LEVEL");
                                    it.remove();
                                    restart = true;
                                } catch (WegasNoResultException ex) {
                                    logger.info(" PARENT {} NOT FOUND -> POSTPONE", modelParent);
                                }
                            } else {
                                logger.info(" CREATE AT ROOL LEVEL");
                                VariableDescriptor clone = (VariableDescriptor) vd.clone();
                                variableDescriptorFacade.createChild(scenario, scenario, clone);
                                it.remove();
                                restart = true;
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
                WegasEntityPatch initialPatch = new WegasEntityPatch(model, reference, true);

                logger.info("InitialPatch: {}", initialPatch);

                // apply patch to all scenarios
                for (GameModel scenario : scenarios) {
                    //initialPatch.apply(scenario, null, WegasPatch.PatchMode.OVERRIDE);
                    logger.info("Patch {}", scenario);
                    initialPatch.apply(scenario);
                    // revive
                    scenario.setModel(model);
                    logger.info("Revive {}", scenario);
                    scenario.propagateGameModel();
                    variableDescriptorFacade.reviveItems(scenario, scenario, false);
                    gameModelFacade.reset(scenario);
                }

                logger.info("PROCESS COMPLETED");
            }
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
     * @throws java.io.IOException
     */
    public GameModel propagateModel(Long gameModelId) throws IOException {
        return this.propagateModel(gameModelFacade.find(gameModelId));
    }

    /**
     * Propagate mode to all implementations
     *
     * @param gameModel
     *
     * @return
     *
     * @throws java.io.IOException
     */
    private GameModel propagateModel(GameModel gameModel) throws IOException {
        if (gameModel.getType().equals(GmType.MODEL)) {
            GameModel reference = gameModel.getReference();

            if (reference == null) {
                /*
                 * create reference
                 */
                logger.info("Create Reference");
                reference = (GameModel) gameModel.duplicate();
                reference.setType(GameModel.GmType.REFERENCE);
                reference.setModel(gameModel);
                gameModelFacade.create(reference);

                this.integrateScenario(gameModel, gameModel.getImplementations());

            } else {

                WegasPatch patch = new WegasEntityPatch(reference, gameModel, Boolean.TRUE);

                logger.info("PropagatePatch: {}" + patch);

                for (GameModel scenario : gameModel.getImplementations()) {
                    // avoid propagating to game's scenarios or to the model
                    if (scenario.getType().equals(GmType.SCENARIO)) {
                        patch.apply(scenario);

                        logger.info("Revive {}", scenario);
                        scenario.propagateGameModel();
                        variableDescriptorFacade.reviveItems(scenario, scenario, false);
                        gameModelFacade.reset(scenario);
                    }
                }

                patch.apply(reference);
                reference.propagateGameModel();

            }
            return gameModel;
        } else {
            throw WegasErrorMessage.error("GameModel " + gameModel + " is not a model (sic)");
        }
    }
}
