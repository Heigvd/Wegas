/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import ch.albasim.wegas.annotations.DependencyScope;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.wegas.core.exception.internal.WegasNoResultException;
import com.wegas.core.i18n.persistence.TranslatableContent;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Script;
import com.wegas.core.persistence.variable.ListDescriptor;
import com.wegas.core.persistence.variable.ModelScoped;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.primitive.NumberDescriptor;
import com.wegas.core.persistence.variable.primitive.NumberInstance;
import com.wegas.core.persistence.variable.scope.TeamScope;
import com.wegas.core.persistence.variable.statemachine.AbstractState;
import com.wegas.core.persistence.variable.statemachine.AbstractStateMachineDescriptor;
import com.wegas.core.persistence.variable.statemachine.AbstractTransition;
import com.wegas.core.persistence.variable.statemachine.StateMachineDescriptor;
import com.wegas.core.persistence.variable.statemachine.StateMachineInstance;
import com.wegas.core.persistence.variable.statemachine.TransitionDependency;
import com.wegas.core.persistence.variable.statemachine.TriggerDescriptor;
import com.wegas.core.rest.util.JacksonMapperProvider;
import com.wegas.resourceManagement.persistence.TaskDescriptor;
import com.wegas.resourceManagement.persistence.TaskInstance;
import com.wegas.test.arquillian.AbstractArquillianTest;
import jakarta.annotation.Resource;
import jakarta.transaction.UserTransaction;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.function.BiConsumer;
import java.util.stream.Collectors;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotEquals;
import static org.junit.Assert.assertThrows;
import org.junit.Test;

/**
 * Patch a game model with an exported zip (GameModelFacade.patch, as GameModelController.patch
 * does).
 */
public class GameModelZipPatchTest extends AbstractArquillianTest {

    @Resource
    private UserTransaction utx;

    private static final String X_GT_5 = "Variable.find(gameModel, \"x\").getValue(self) > 5";

    /**
     * Same entry name as GameModelFacade.GM_DOT_JSON_NAME (private)
     */
    private static final String GM_DOT_JSON = "gameModel/gamemodel.json";

    private GameModel reload(GameModel gm) {
        jpaCacheHelper.clearCacheLocal("all");
        requestManager.clearEntities();
        return gameModelFacade.find(gm.getId());
    }

    private GameModel createEmptyScenario(String name) {
        GameModel gm = new GameModel();
        gm.setName(name);
        gameModelFacade.createWithDebugGame(gm);
        return reload(gm);
    }

    /**
     * Create, in gameModel, a number x and three descriptors which depend on it: an AUTO trigger, a
     * MANUAL trigger and a FSM.
     *
     * @return the reloaded gameModel
     */
    private GameModel createDependencySource() {
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

        return reload(gameModel);
    }

    private void forEachTransition(GameModel gm, BiConsumer<VariableDescriptor, AbstractTransition> consumer) {
        for (VariableDescriptor vd : gm.getVariableDescriptors()) {
            if (vd instanceof AbstractStateMachineDescriptor) {
                for (Object oState : ((AbstractStateMachineDescriptor) vd).getStates().values()) {
                    for (Object oT : ((AbstractState) oState).getInternalTransitions()) {
                        consumer.accept(vd, (AbstractTransition) oT);
                    }
                }
            }
        }
    }

    /**
     * @return descriptorName/dependsOnStrategy/variableName to dependency refId
     */
    private Map<String, String> collectDeps(GameModel gm) {
        Map<String, String> deps = new TreeMap<>();
        forEachTransition(gm, (vd, t) -> {
            for (TransitionDependency dep : t.getDependencies()) {
                deps.put(vd.getName() + "/" + t.getDependsOnStrategy() + "/" + dep.getVariableName(), dep.getRefId());
            }
        });
        return deps;
    }

    private List<TransitionDependency> allDeps(GameModel gm) {
        List<TransitionDependency> deps = new ArrayList<>();
        forEachTransition(gm, (vd, t) -> deps.addAll(t.getDependencies()));
        return deps;
    }

    /**
     * @return descriptor name to descriptor id
     */
    private Map<String, Long> descriptorIds(GameModel gm) {
        Map<String, Long> ids = new TreeMap<>();
        for (VariableDescriptor vd : gm.getVariableDescriptors()) {
            ids.put(vd.getName(), vd.getId());
        }
        return ids;
    }

    private byte[] exportZip(GameModel gm) throws Exception {
        // as in "export (zip)"
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        gameModelFacade.archiveAsExplodedZip(gm.getId()).write(out);
        return out.toByteArray();
    }

    private JsonNode gameModelJson(byte[] zip) throws IOException {
        try (ZipInputStream zis = new ZipInputStream(new ByteArrayInputStream(zip), StandardCharsets.UTF_8)) {
            ZipEntry entry;
            while ((entry = zis.getNextEntry()) != null) {
                if (GM_DOT_JSON.equals(entry.getName())) {
                    return JacksonMapperProvider.getMapper().readTree(zis);
                }
            }
        }
        throw new AssertionError("No " + GM_DOT_JSON + " in zip");
    }

    /**
     * Remove what the patch does not take from the zip: patch() keeps the target's name and
     * comments, creation metadata belongs to the target itself, and language visibility is set by
     * patch() (see patchedScenarioReExportsLikeTheZip).
     */
    private String withoutTargetMetadata(JsonNode gmJson) {
        ObjectNode root = (ObjectNode) gmJson;
        List<String> fields = new ArrayList<>(List.of("name", "comments", "createdTime"));
        root.fieldNames().forEachRemaining(f -> {
            if (f.startsWith("createdBy")) {
                fields.add(f);
            }
        });
        root.remove(fields);
        for (JsonNode lang : root.get("languages")) {
            ((ObjectNode) lang).remove("visibility");
        }
        return root.toPrettyString();
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
        return reload(target);
    }

    /**
     * Dependency and gameModel refIds are taken from the zip, on first and second patch.
     */
    @Test
    public void firstPatchKeepsDependencyRefIds() throws Exception {
        GameModel source = createDependencySource();
        Map<String, String> sourceDeps = collectDeps(source);
        assertEquals(3, sourceDeps.size());

        byte[] zip = exportZip(source);
        GameModel target = createEmptyScenario("empty-target");

        // first patch creates the descriptors
        GameModel patched = patchWith(target, zip);
        assertEquals("first patch", sourceDeps, collectDeps(patched));
        assertEquals("gameModel refId", source.getRefId(), patched.getRefId());
        // second patch updates them
        assertEquals("second patch", sourceDeps, collectDeps(patchWith(target, zip)));
    }

    /**
     * Patching a MODEL with another model's zip gives it the zip's gameModel refId.
     */
    @Test
    public void patchedModelTakesZipGameModelRefId() throws Exception {
        GameModel model = new GameModel();
        model.setName("source-model");
        model.setType(GameModel.GmType.MODEL);
        gameModelFacade.createWithDebugGame(model);
        wegasFactory.createNumberDescriptor(model, model, "x", "x",
            ModelScoped.Visibility.INHERITED, null, null, 0.0);
        model = gameModelFacade.find(model.getId());

        // another model, with its own gameModel refId
        GameModel target = new GameModel();
        target.setName("target-model");
        target.setType(GameModel.GmType.MODEL);
        gameModelFacade.createWithDebugGame(target);
        target = gameModelFacade.find(target.getId());
        assertNotEquals(model.getRefId(), target.getRefId());

        GameModel patched = patchWith(target, exportZip(model));
        assertEquals(GameModel.GmType.MODEL, patched.getType());
        assertEquals("gameModel refId", model.getRefId(), patched.getRefId());
    }

    /**
     * Task predecessors are restored on the target's own tasks.
     */
    @Test
    public void firstPatchRestoresTaskPredecessors() throws Exception {
        TaskDescriptor taskA = wegasFactory.createTask(gameModel, gameModel, "taskA", "Task A", "1", "");

        TaskDescriptor taskB = new TaskDescriptor();
        taskB.setName("taskB");
        taskB.setLabel(TranslatableContent.build(gameModel.getLanguages().get(0).getCode(), "Task B"));
        taskB.setDefaultInstance(new TaskInstance());
        taskB.addPredecessor(taskA);
        variableDescriptorFacade.create(gameModel.getId(), taskB);

        // predecessors travel by name in the zip and are restored by reviveTaskDescriptor
        GameModel target = patchWith(createEmptyScenario("empty-target"), exportZip(reload(gameModel)));

        TaskDescriptor targetA = (TaskDescriptor) variableDescriptorFacade.find(target, "taskA");
        TaskDescriptor targetB = (TaskDescriptor) variableDescriptorFacade.find(target, "taskB");
        assertEquals(List.of(targetA), targetB.getPredecessors());
    }

    /**
     * Transition dependencies point to the target's variables, not the source's.
     */
    @Test
    public void firstPatchLinksDependenciesToTargetVariables() throws Exception {
        GameModel target = patchWith(createEmptyScenario("empty-target"), exportZip(createDependencySource()));

        NumberDescriptor x = (NumberDescriptor) variableDescriptorFacade.find(target, "x");
        List<TransitionDependency> deps = allDeps(target);
        assertEquals(3, deps.size());
        for (TransitionDependency dep : deps) {
            // equals by id: the target's x, neither null nor the source's x
            assertEquals(dep.getTransition() + " depends on", x, dep.getVariable());
        }
        assertEquals(3, x.getMayTrigger().size());
    }

    /**
     * Re-exporting the patched scenario gives the same gamemodel.json as the zip.
     */
    @Test
    public void patchedScenarioReExportsLikeTheZip() throws Exception {
        byte[] zip = exportZip(createDependencySource());
        GameModel patched = patchWith(createEmptyScenario("empty-target"), zip);

        JsonNode expected = gameModelJson(zip);
        JsonNode actual = gameModelJson(exportZip(patched));

        // patch() reuses ModelFacade.processLanguages, which makes the patched languages PROTECTED
        for (JsonNode lang : actual.get("languages")) {
            assertEquals(lang.get("code") + " visibility", "PROTECTED", lang.get("visibility").asText());
        }
        assertEquals(withoutTargetMetadata(expected), withoutTargetMetadata(actual));
    }

    /**
     * A second patch updates descriptors in place (same ids) instead of recreating them.
     */
    @Test
    public void secondPatchUpdatesInPlace() throws Exception {
        byte[] zip = exportZip(createDependencySource());
        GameModel target = createEmptyScenario("empty-target");

        Map<String, Long> firstIds = descriptorIds(patchWith(target, zip));
        assertEquals(4, firstIds.size());
        assertEquals(firstIds, descriptorIds(patchWith(target, zip)));
    }

    /**
     * A variable missing from the zip is deleted from the target.
     */
    @Test
    public void patchDeletesVariableRemovedFromZip() throws Exception {
        wegasFactory.createNumberDescriptor(gameModel, gameModel, "x", "x",
            ModelScoped.Visibility.INHERITED, null, null, 0.0);
        NumberDescriptor y = wegasFactory.createNumberDescriptor(gameModel, gameModel, "y", "y",
            ModelScoped.Visibility.INHERITED, null, null, 0.0);

        GameModel target = patchWith(createEmptyScenario("empty-target"), exportZip(reload(gameModel)));
        variableDescriptorFacade.find(target, "y");

        variableDescriptorFacade.remove(y.getId());
        GameModel patched = patchWith(target, exportZip(reload(gameModel)));

        variableDescriptorFacade.find(patched, "x");
        assertThrows(WegasNoResultException.class, () -> variableDescriptorFacade.find(patched, "y"));
    }

    /**
     * A variable moved into a folder in the zip is moved in the target too.
     */
    @Test
    public void patchMovesVariableIntoFolder() throws Exception {
        ListDescriptor folder = wegasFactory.createList(gameModel, gameModel, "folder", "folder");
        NumberDescriptor z = wegasFactory.createNumberDescriptor(gameModel, gameModel, "z", "z",
            ModelScoped.Visibility.INHERITED, null, null, 0.0);

        GameModel target = patchWith(createEmptyScenario("empty-target"), exportZip(reload(gameModel)));
        assertEquals(target, variableDescriptorFacade.find(target, "z").getParent());

        variableDescriptorFacade.move(z.getId(), folder.getId(), 0);
        GameModel patched = patchWith(target, exportZip(reload(gameModel)));

        assertEquals(variableDescriptorFacade.find(patched, "folder"),
            variableDescriptorFacade.find(patched, "z").getParent());
        assertEquals(List.of("folder"),
            patched.getItems().stream().map(VariableDescriptor::getName).collect(Collectors.toList()));
    }

    /**
     * New descriptors get player instances with the zip's default values.
     */
    @Test
    public void firstPatchCreatesPlayerInstances() throws Exception {
        wegasFactory.createNumberDescriptor(gameModel, gameModel, "x", "x",
            ModelScoped.Visibility.INHERITED, null, null, 7.0);

        GameModel target = patchWith(createEmptyScenario("empty-target"), exportZip(reload(gameModel)));

        VariableDescriptor x = variableDescriptorFacade.find(target, "x");
        Player testPlayer = target.getTestPlayer();
        assertEquals(7.0, ((NumberInstance) variableInstanceFacade.find(x.getId(), testPlayer)).getValue(), 0.0);
    }
}
