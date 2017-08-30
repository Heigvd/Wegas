/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.merge.ejb;

import com.wegas.core.ejb.GameModelFacade;
import com.wegas.core.ejb.VariableDescriptorFacade;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.exception.internal.WegasNoResultException;
import com.wegas.core.merge.patch.WegasEntityPatch;
import com.wegas.core.merge.patch.WegasPatch;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.GameModel.GmType;
import com.wegas.core.persistence.variable.DescriptorListI;
import com.wegas.core.persistence.variable.ModelScoped;
import com.wegas.core.persistence.variable.VariableDescriptor;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.logging.Level;
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

    private List<GameModel> loadGameModels(List<GameModel> scenarios) {
        List<GameModel> scens = new ArrayList<>();
        for (GameModel gm : scenarios) {
            scens.add(gameModelFacade.find(gm.getId()));
        }
        return scens;
    }

    /**
     * Create a gameModel which contains only the content which is shared among all gameModels
     * The structure will be the same san
     *
     * @param scenarios
     *
     * @return
     */
    public GameModel createGameModelModel(List<GameModel> scenarios) {

        GameModel model = null;
        if (!scenarios.isEmpty()) {
            try {
                scenarios = loadGameModels(scenarios);
                model = (GameModel) scenarios.remove(0).duplicate();

                List<VariableDescriptor> vdQueue = new ArrayList<>();
                vdQueue.addAll(model.getChildVariableDescriptors());

                List<VariableDescriptor> exclusionCandidates = new ArrayList<>();

                /**
                 * Select variable descriptor to keep
                 */
                while (vdQueue.size() > 0) {
                    VariableDescriptor vd = vdQueue.remove(0);
                    boolean exists = true;
                    for (GameModel other : scenarios) {
                        try {
                            variableDescriptorFacade.find(other, vd.getName());
                        } catch (WegasNoResultException ex) {
                            exists = false;
                            break;
                        }
                    }

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

                boolean restart = false;
                do {
                    for (Iterator<VariableDescriptor> it = exclusionCandidates.iterator(); it.hasNext();) {
                        VariableDescriptor vd = it.next();
                        logger.debug("Should keep {} ?", vd);
                        DescriptorListI list = (DescriptorListI) vd;
                        if (list.size() == 0) {
                            logger.debug(" -> NO (is empty)");
                            it.remove();
                            vd.getParent().remove(vd);
                            restart = true;
                        } else {
                            vd.setVisibility(ModelScoped.Visibility.INHERITED);
                        }
                    }
                } while (restart);
            } catch (IOException ex) {
                logger.error("Exception while creating model", ex);
            }
        }

        return model;
    }

    private String getParentRef(VariableDescriptor vd) {
        DescriptorListI parent = vd.getParent();
        if (parent instanceof AbstractEntity) {
            return ((AbstractEntity) parent).getRefId();
        } else {
            return null; //throw error ? 
        }
    }

    public GameModel createModel(GameModel model, List<GameModel> scenarios) {
        scenarios = loadGameModels(scenarios);

        try {
            /*
             * Persist GameModel
             */
            model.setType(GameModel.GmType.MODEL);
            model.setReference(null);
            gameModelFacade.create(model);

            /*
             * create reference
             */
            GameModel reference = (GameModel) model.duplicate();
            reference.setType(GameModel.GmType.REFERENCE);
            reference.setReference(null);
            gameModelFacade.create(reference);

            // Attach reference
            model.setReference(reference);

            // set scenarios refId to model refId
            for (GameModel scenario : scenarios) {
                scenario.setRefId(model.getRefId());
            }

            Map<VariableDescriptor, VariableDescriptor> toMove = new HashMap<>();
            Map<GameModel, List<VariableDescriptor>> toCreate = new HashMap<>();

            logger.info("Assert variables structure match structure in the model and override refIds");
            for (VariableDescriptor modelVd : model.getVariableDescriptors()) {

                String modelParentRef = this.getParentRef(modelVd);
                String refId = modelVd.getRefId();
                String name = modelVd.getName();

                for (GameModel scenario : scenarios) {
                    try {
                        VariableDescriptor vd = variableDescriptorFacade.find(scenario, name);
                        vd.setRefId(refId);
                        String parentRef = this.getParentRef(vd);
                        if (!parentRef.equals(modelParentRef)) {
                            logger.info("Descriptor {} will be moved from {} to {}", vd, vd.getParent(), modelVd.getParent());
                            // Parents differs
                            toMove.put(vd, modelVd);
                        }
                    } catch (WegasNoResultException ex) {
                        logger.info("Descriptor {} will be created in {}", modelVd, modelVd.getParent());
                        if (modelVd instanceof DescriptorListI) {
                            toCreate.putIfAbsent(scenario, new ArrayList<>());
                            toCreate.get(scenario).add(modelVd);
                        }
                    }
                }
            }

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
                this.move(entry.getKey(), entry.getValue());
            }

            WegasEntityPatch initialPatch = new WegasEntityPatch(reference, model, true);

            logger.info("InitialPatch: {}", initialPatch);

            for (GameModel scenario : scenarios) {
                //initialPatch.apply(scenario, null, WegasPatch.PatchMode.OVERRIDE);
                logger.info("Patch {}", scenario);
                initialPatch.apply(scenario);
                scenario.setReference(reference);
                // revive
                logger.info("Revive {}", scenario);
                scenario.propagateGameModel();
                variableDescriptorFacade.reviveItems(scenario, scenario, false);
                gameModelFacade.reset(scenario);
            }

            logger.info("PROCESS COMPLETED");

        } catch (IOException ex) {
            logger.error("Exception while creating model", ex);
        }
        return model;
    }

    /**
     *
     * @param vd
     * @param modelVd
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
                newParent = null;
            }
        } else {
            // original parent is a descriptor
            newParent = vd.getGameModel();
        }

        if (newParent != null) {
            newParent.addItem(vd); // order will be restored later
        } else {
            throw WegasErrorMessage.error("ORPHAN");
        }

    }

    public void propagateModel(Long gameModelId) {
        this.propagateModel(gameModelFacade.find(gameModelId));
    }

    public void propagateModel(GameModel gameModel) {
        if (gameModel.getType().equals(GmType.MODEL)) {
            GameModel reference = gameModel.getReference();
            if (reference != null) {
                WegasPatch patch = new WegasEntityPatch(reference, gameModel, Boolean.TRUE);

                for (GameModel scenario : reference.getImplementations()) {
                    if (!scenario.equals(gameModel)) {
                        patch.apply(scenario);

                        logger.info("Revive {}", scenario);
                        scenario.propagateGameModel();
                        variableDescriptorFacade.reviveItems(scenario, scenario, false);
                        gameModelFacade.reset(scenario);
                    }
                }

                patch.apply(reference);
                reference.propagateGameModel();
            } else {
                throw WegasErrorMessage.error("Reference is missing");
            }
        } else {
            throw WegasErrorMessage.error("GameModel " + gameModel + " is not a model (sic)");
        }
    }
}
