/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.ejb.statemachine;

import ch.albasim.wegas.annotations.DependencyScope;
import com.wegas.core.i18n.persistence.TranslatableContent;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Script;
import com.wegas.core.persistence.variable.ModelScoped;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.scope.TeamScope;
import com.wegas.core.persistence.variable.statemachine.AbstractState;
import com.wegas.core.persistence.variable.statemachine.AbstractStateMachineDescriptor;
import com.wegas.core.persistence.variable.statemachine.AbstractTransition;
import com.wegas.core.persistence.variable.statemachine.StateMachineDescriptor;
import com.wegas.core.persistence.variable.statemachine.StateMachineInstance;
import com.wegas.core.persistence.variable.statemachine.TransitionDependency;
import com.wegas.core.persistence.variable.statemachine.TriggerDescriptor;
import com.wegas.test.arquillian.AbstractArquillianTest;
import jakarta.annotation.Resource;
import jakarta.transaction.UserTransaction;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.zip.ZipInputStream;
import static org.junit.Assert.assertEquals;
import org.junit.Test;

/**
 * Patching a scenario must keep TransitionDependency refIds (and dependsOn strategy) from the
 * patch.
 */
public class TransitionDependencyPatchTest extends AbstractArquillianTest {

    @Resource
    private UserTransaction utx;

    private static final String X_GT_5 = "Variable.find(gameModel, \"x\").getValue(self) > 5";

    private Map<String, String> collectDeps(GameModel gm) {
        Map<String, String> deps = new TreeMap<>();
        for (VariableDescriptor vd : gm.getVariableDescriptors()) {
            if (vd instanceof AbstractStateMachineDescriptor) {
                for (Object oState : ((AbstractStateMachineDescriptor) vd).getStates().values()) {
                    AbstractState state = (AbstractState) oState;
                    for (Object oT : state.getInternalTransitions()) {
                        AbstractTransition t = (AbstractTransition) oT;
                        for (TransitionDependency dep : t.getDependencies()) {
                            deps.put(vd.getName() + "/" + t.getDependsOnStrategy() + "/" + dep.getVariableName(), dep.getRefId());
                        }
                    }
                }
            }
        }
        return deps;
    }

    private GameModel patchWith(GameModel target, byte[] zip) throws Exception {
        GameModel newVersion;
        try (ZipInputStream zis = new ZipInputStream(new ByteArrayInputStream(zip), StandardCharsets.UTF_8)) {
            newVersion = gameModelFacade.extractFromExplodedZip(zis).getGameModel();
        }
        // same transaction for find & patch (as in GameModelController.patch)
        utx.begin();
        gameModelFacade.patch(gameModelFacade.find(target.getId()), newVersion);
        utx.commit();
        jpaCacheHelper.clearCacheLocal("all");
        requestManager.clearEntities();
        return gameModelFacade.find(target.getId());
    }

    @Test
    public void testPatchEmptyScenarioKeepsDependencyRefIds() throws Exception {
        wegasFactory.createNumberDescriptor(gameModel, gameModel, "x", "x",
            ModelScoped.Visibility.INHERITED, null, null, 0.0);

        // AUTO trigger
        wegasFactory.createTriggerDescriptor(gameModel, gameModel, "autoTrigger", "autoTrigger",
            ModelScoped.Visibility.INHERITED, X_GT_5, "");

        // MANUAL trigger
        TriggerDescriptor manual = new TriggerDescriptor();
        manual.setName("manualTrigger");
        manual.setLabel(TranslatableContent.build(gameModel.getLanguages().get(0).getCode(), "manualTrigger"));
        manual.setScope(new TeamScope());
        manual.setOneShot(Boolean.FALSE);
        manual.setDisableSelf(Boolean.FALSE);
        manual.setTriggerEvent(new Script("Javascript", "true"));
        manual.setPostTriggerEvent(new Script("Javascript", ""));
        manual.setDependsOnStrategy(AbstractTransition.DependsOnStrategy.MANUAL);
        TransitionDependency mDep = new TransitionDependency();
        mDep.setVariableName("x");
        mDep.setScope(DependencyScope.SELF);
        Set<TransitionDependency> mDeps = new HashSet<>();
        mDeps.add(mDep);
        manual.setDependencies(mDeps);
        manual.setDefaultInstance(new StateMachineInstance());
        wegasFactory.createDescriptor(gameModel, manual, gameModel);

        // FSM
        StateMachineDescriptor fsm = wegasFactory.createStateMachineDescriptor(gameModel, gameModel,
            "fsm", "", true, ModelScoped.Visibility.INHERITED);
        wegasFactory.createState(fsm, 1l, "");
        wegasFactory.createState(fsm, 2l, "");
        wegasFactory.createTransition(fsm, 1l, 2l, X_GT_5, "", 0);

        jpaCacheHelper.clearCacheLocal("all");
        requestManager.clearEntities();
        GameModel source = gameModelFacade.find(gameModel.getId());
        Map<String, String> sourceDeps = collectDeps(source);
        assertEquals(3, sourceDeps.size());

        // export as in "export (zip)"
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        gameModelFacade.archiveAsExplodedZip(source.getId()).write(out);
        byte[] zip = out.toByteArray();

        GameModel target = new GameModel();
        target.setName("empty-target");
        gameModelFacade.createWithDebugGame(target);

        // first patch creates the descriptors
        assertEquals("first patch", sourceDeps, collectDeps(patchWith(target, zip)));
        // second patch updates them
        assertEquals("second patch", sourceDeps, collectDeps(patchWith(target, zip)));
    }
}
