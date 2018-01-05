/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import ch.qos.logback.classic.Level;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.wegas.core.Helper;
import com.wegas.core.exception.internal.WegasNoResultException;
import com.wegas.core.jcr.content.AbstractContentDescriptor;
import com.wegas.core.jcr.content.ContentConnector;
import com.wegas.core.jcr.tools.RepositoryVisitor;
import com.wegas.core.merge.patch.WegasPatch;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.GameModelContent;
import com.wegas.core.persistence.game.GameModelProperties;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.persistence.variable.DescriptorListI;
import com.wegas.core.persistence.variable.ListDescriptor;
import com.wegas.core.persistence.variable.ListInstance;
import com.wegas.core.persistence.variable.ModelScoped;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.core.persistence.variable.primitive.NumberDescriptor;
import com.wegas.core.persistence.variable.primitive.NumberInstance;
import com.wegas.core.persistence.variable.primitive.ObjectDescriptor;
import com.wegas.core.persistence.variable.primitive.ObjectInstance;
import com.wegas.core.persistence.variable.primitive.StringDescriptor;
import com.wegas.core.persistence.variable.primitive.StringInstance;
import com.wegas.core.persistence.variable.scope.TeamScope;
import com.wegas.core.security.persistence.User;
import com.wegas.test.arquillian.AbstractArquillianTest;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import javax.inject.Inject;
import javax.jcr.RepositoryException;
import javax.naming.NamingException;
import org.junit.Assert;
import org.junit.Test;
import org.reflections.Reflections;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Maxence
 */
public class ModelFacadeTest extends AbstractArquillianTest {

    private static final Logger logger = LoggerFactory.getLogger(ModelFacadeTest.class);
    private static final Reflections reflections;

    @Inject
    private ModelFacade modelFacade;

    @Inject
    private JCRFacade jcrFacade;

    static {
        reflections = new Reflections("com.wegas");
    }

    //@BeforeClass
    public static void setLoggerLevels() {
        ((ch.qos.logback.classic.Logger) LoggerFactory.getLogger(ModelFacade.class)).setLevel(Level.DEBUG);
        ((ch.qos.logback.classic.Logger) LoggerFactory.getLogger(WegasPatch.class)).setLevel(Level.DEBUG);
        ((ch.qos.logback.classic.Logger) LoggerFactory.getLogger(VariableDescriptorFacade.class)).setLevel(Level.DEBUG);
        ((ch.qos.logback.classic.Logger) LoggerFactory.getLogger(VariableDescriptor.class)).setLevel(Level.DEBUG);

        ((ch.qos.logback.classic.Logger) logger).setLevel(Level.DEBUG);
    }

    private ObjectDescriptor createObjectDescriptor(GameModel gameModel, DescriptorListI parent, String name, String label, ModelScoped.Visibility visibility, String... values) {
        ObjectDescriptor desc = new ObjectDescriptor();
        desc.setName(name);
        desc.setLabel(label);
        desc.setVisibility(visibility);
        desc.setScope(new TeamScope());

        desc.setDefaultInstance(new ObjectInstance());
        ObjectInstance defaultInstance = desc.getDefaultInstance();

        int i = 0;
        for (String prop : values) {
            desc.setProperty("prop" + i, prop);
            defaultInstance.setProperty("prop" + i, prop);
            i++;
        }

        if (parent == null) {
            variableDescriptorFacade.create(gameModel.getId(), desc);
        } else {
            variableDescriptorFacade.createChild(parent.getId(), desc);
        }

        return desc;
    }

    private NumberDescriptor createNumberDescriptor(GameModel gameModel, DescriptorListI parent, String name, String label, ModelScoped.Visibility visibility, Double min, Double max, Double defaultValue, Double... history) {
        NumberDescriptor desc = new NumberDescriptor();
        List<Double> hist = new ArrayList<>();
        for (Double h : history) {
            hist.add(h);
        }
        desc.setName(name);
        desc.setLabel(label);
        desc.setVisibility(visibility);
        desc.setScope(new TeamScope());
        desc.setMinValue(min);
        desc.setMaxValue(max);
        desc.setDefaultInstance(new NumberInstance());
        desc.getDefaultInstance().setValue(defaultValue);
        desc.getDefaultInstance().setHistory(hist);

        if (parent == null) {
            variableDescriptorFacade.create(gameModel.getId(), desc);
        } else {
            variableDescriptorFacade.createChild(parent.getId(), desc);
        }

        return desc;
    }

    private StringDescriptor createString(GameModel gameModel, DescriptorListI parent, String name, String label, String value, String... allowedValues) {
        StringDescriptor desc = new StringDescriptor();
        desc.setDefaultInstance(new StringInstance());
        desc.setName(name);
        desc.setLabel(label);

        for (String aV : allowedValues) {
            desc.getAllowedValues().add(aV);
        }

        desc.getDefaultInstance().setValue(value);

        if (parent == null) {
            variableDescriptorFacade.create(gameModel.getId(), desc);
        } else {
            variableDescriptorFacade.createChild(parent.getId(), desc);
        }

        return desc;
    }

    private ListDescriptor createList(GameModel gameModel, DescriptorListI parent, String name, String label) {
        ListDescriptor desc = new ListDescriptor();
        desc.setDefaultInstance(new ListInstance());
        desc.setName(name);
        desc.setLabel(label);

        if (parent == null) {
            variableDescriptorFacade.create(gameModel.getId(), desc);
        } else {
            variableDescriptorFacade.createChild(parent.getId(), desc);
        }

        return desc;
    }

    private VariableDescriptor getDescriptor(GameModel gm, String name) {
        try {
            return variableDescriptorFacade.find(gm, name);
        } catch (WegasNoResultException ex) {
            return null;
        }
    }

    private VariableInstance getInstance(GameModel gm, String vName) {
        VariableDescriptor vd = this.getDescriptor(gm, vName);
        if (vd != null) {
            Player p = gm.getPlayers().get(0);
            return vd.getInstance(p);
        }
        return null;
    }

    private void assertListEquals(List<? extends Object> expected, Object... list) {
        Assert.assertEquals(expected.size(), list.length);

        for (int i = 0; i < expected.size(); i++) {
            Assert.assertEquals(expected.get(i), list[i]);
        }
    }

    @Test
    public void testModelise_GameModelProperties() throws NamingException, WegasNoResultException {
        GameModel gameModel1 = new GameModel();
        gameModel1.setName("gamemodel #1");
        GameModelProperties properties1 = gameModel1.getProperties();
        properties1.setLogID("DefaultLogId1");
        properties1.setIconUri("MyIconUri");
        gameModelFacade.createWithDebugGame(gameModel1);

        GameModel gameModel2 = new GameModel();
        gameModel2.setName("gamemodel #2");
        GameModelProperties properties2 = gameModel2.getProperties();
        properties2.setLogID("DefaultLogId2");
        properties2.setIconUri("MyIconUri");
        gameModelFacade.createWithDebugGame(gameModel2);

        gameModel1 = gameModelFacade.find(gameModel1.getId());
        gameModel2 = gameModelFacade.find(gameModel2.getId());

        List<GameModel> scenarios = new ArrayList<>();

        scenarios.add(gameModel1);
        scenarios.add(gameModel2);

        logger.info("Create Model");
        GameModel model = modelFacade.createModelFromCommonContent(scenarios);
        modelFacade.propagateModel(model.getId());

        Assert.assertEquals("DefaultLogId1", model.getProperties().getLogID());
        Assert.assertEquals("DefaultLogId1", gameModel1.getProperties().getLogID());
        Assert.assertEquals("DefaultLogId2", gameModel2.getProperties().getLogID());

        model.getProperties().setLogID("NewLogId");
        model = gameModelFacade.update(model.getId(), model);

        /**
         * Update gameModel properties
         */
        modelFacade.propagateModel(model.getId());

        gameModel1 = gameModelFacade.find(gameModel1.getId());
        gameModel2 = gameModelFacade.find(gameModel2.getId());

        Assert.assertEquals("NewLogId", model.getProperties().getLogID());
        Assert.assertEquals("NewLogId", gameModel1.getProperties().getLogID());
        Assert.assertEquals("DefaultLogId2", gameModel2.getProperties().getLogID());

    }

    private void createCss(GameModel theModel, String uniqueToken) {
        Map<String, GameModelContent> cssLibrary = theModel.getCssLibrary();

        GameModelContent css = new GameModelContent();
        css.setContent(".model_rule { color: red}");
        css.setContentType("text/css");
        css.setVisibility(ModelScoped.Visibility.INTERNAL);
        cssLibrary.put("modelCss", css);

        css = new GameModelContent();
        css.setContent(".protected_rule { color: red}");
        css.setContentType("text/css");
        css.setVisibility(ModelScoped.Visibility.PROTECTED);
        cssLibrary.put("protectedCss", css);

        css = new GameModelContent();
        css.setContent(".inherited_rule { color: red}");
        css.setContentType("text/css");
        css.setVisibility(ModelScoped.Visibility.INHERITED);
        cssLibrary.put("inheritedCss", css);

        css = new GameModelContent();
        css.setContent(".private_rule { color: red}");
        css.setContentType("text/css");
        css.setVisibility(ModelScoped.Visibility.PRIVATE);
        cssLibrary.put("privateCss", css);

        css = new GameModelContent();
        css.setContent(".private_rule { color: red}");
        css.setContentType("text/css");
        css.setVisibility(ModelScoped.Visibility.PRIVATE);
        cssLibrary.put("privateCss" + uniqueToken, css);

        theModel.setCssLibrary(cssLibrary);
    }

    private void setPagesFromStrings(GameModel theModel, String... pages) throws IOException {
        Map<String, JsonNode> gmPages = theModel.getPages();

        ObjectMapper mapper = new ObjectMapper();

        for (Integer i = 0; i < pages.length; i++) {
            JsonNode page = mapper.readTree(pages[i]);
            gmPages.put(i.toString(), page);
        }

        theModel.setPages(gmPages);
    }

    private void printPages(GameModel gameModel) {
        StringBuilder sb = new StringBuilder(gameModel.toString()).append("\n");

        for (Entry<String, JsonNode> page : gameModel.getPages().entrySet()) {
            String pageName = page.getKey();
            sb.append("  ").append(pageName).append("\n").append(page.getValue()).append("\n");
        }
        logger.error("Pages: {}", sb);
    }

    @Test
    public void testModelise_GameModelPages() throws NamingException, WegasNoResultException, IOException {
        GameModel gameModel1 = new GameModel();
        gameModel1.setName("gamemodel #1");

        this.setPagesFromStrings(gameModel1, "{\"type\": \"AbsoluteLayout\", \"children\": []}", "{\"type\": \"List\", \"direction\": \"horizontal\", \"children\": []}");
        gameModelFacade.createWithDebugGame(gameModel1);

        GameModel gameModel2 = new GameModel();
        gameModel2.setName("gamemodel #2");
        this.setPagesFromStrings(gameModel2, "{\"type\": \"AbsoluteLayout\", \"children\": []}", "{\"type\": \"List\", \"direction\": \"horizontal\", \"children\": []}", "{\"type\": \"AbsoluteLayout\", \"children\": []}");
        gameModelFacade.createWithDebugGame(gameModel2);

        gameModel1 = gameModelFacade.find(gameModel1.getId());
        gameModel2 = gameModelFacade.find(gameModel2.getId());

        printPages(gameModel1);
        printPages(gameModel2);

        List<GameModel> scenarios = new ArrayList<>();

        scenarios.add(gameModel1);
        scenarios.add(gameModel2);

        logger.info("Create Model");
        GameModel model = modelFacade.createModelFromCommonContent(scenarios);
        modelFacade.propagateModel(model.getId());

        model = gameModelFacade.find(model.getId());
        gameModel1 = gameModelFacade.find(gameModel1.getId());
        gameModel2 = gameModelFacade.find(gameModel2.getId());

        printPages(model);
        printPages(gameModel1);
        printPages(gameModel2);

        /**
         * Update pages
         */
        this.setPagesFromStrings(model, "{\"type\": \"List\", \"direction\": \"horizontal\", \"children\": []}", "{\"type\": \"AbsoluteLayout\", \"children\": []}");
        model = gameModelFacade.merge(model);

        /**
         * Update gameModel properties
         */
        modelFacade.propagateModel(model.getId());

        model = gameModelFacade.find(model.getId());
        gameModel1 = gameModelFacade.find(gameModel1.getId());
        gameModel2 = gameModelFacade.find(gameModel2.getId());

        printPages(model);
        printPages(gameModel1);
        printPages(gameModel2);
    }

    @Test
    public void testModelise_GameModelContent() throws NamingException, WegasNoResultException {
        GameModel gameModel1 = new GameModel();
        gameModel1.setName("gamemodel #1");
        this.createCss(gameModel1, "sheet1");
        gameModelFacade.createWithDebugGame(gameModel1);

        GameModel gameModel2 = new GameModel();
        gameModel2.setName("gamemodel #2");
        this.createCss(gameModel2, "sheet2");
        gameModelFacade.createWithDebugGame(gameModel2);

        gameModel1 = gameModelFacade.find(gameModel1.getId());
        gameModel2 = gameModelFacade.find(gameModel2.getId());

        List<GameModel> scenarios = new ArrayList<>();

        scenarios.add(gameModel1);
        scenarios.add(gameModel2);

        logger.info("Create Model");
        GameModel model = modelFacade.createModelFromCommonContent(scenarios);
        modelFacade.propagateModel(model.getId());

        model = gameModelFacade.find(model.getId());
        gameModel1 = gameModelFacade.find(gameModel1.getId());
        gameModel2 = gameModelFacade.find(gameModel2.getId());

        printLibraries(model);
        printLibraries(gameModel1);
        printLibraries(gameModel2);

        /**
         * Update CSS sheets
         */
        Map<String, GameModelContent> cssLibrary;
        cssLibrary = model.getCssLibrary();
        GameModelContent lib;
        lib = cssLibrary.get("inheritedCss");
        lib.setContent(".inherited_rule { color: hotpink}");

        lib = model.getCss("protectedCss");
        lib.setContent(".protected_rule { color: hotpink}");

        model.setCssLibrary(cssLibrary);
        model = gameModelFacade.merge(model);

        cssLibrary = gameModel1.getCssLibrary();
        lib = cssLibrary.get("inheritedCss");
        lib.setContent(".inherited_rule { color: lavender}");

        lib = model.getCss("protectedCss");
        lib.setContent(".protected_rule { color: lavender}");

        gameModel1.setCssLibrary(cssLibrary);
        gameModel1 = gameModelFacade.merge(gameModel1);

        /**
         * Update gameModel properties
         */
        modelFacade.propagateModel(model.getId());

        model = gameModelFacade.find(model.getId());
        gameModel1 = gameModelFacade.find(gameModel1.getId());
        gameModel2 = gameModelFacade.find(gameModel2.getId());

        printLibraries(model);
        printLibraries(gameModel1);
        printLibraries(gameModel2);

        /**
         * ASSERTS
         */
    }

    private void printLibraries(GameModel gameModel) {
        StringBuilder sb = new StringBuilder(gameModel.toString()).append("\n");
        for (Entry<String, Map<String, GameModelContent>> entry : gameModel.getLibraries().entrySet()) {
            String libraryName = entry.getKey();
            sb.append("  ").append(libraryName).append("\n");
            for (Entry<String, GameModelContent> content : entry.getValue().entrySet()) {
                GameModelContent value = content.getValue();
                sb.append("   - ").append(value.getId()).append(" ").append(value.getVisibility()).append("::").append(content.getKey()).append(" (").append(value.getContentType()).append("): ").append(value.getContent()).append("\n");
            }
        }
        logger.info("Libraries: {}", sb);
    }

    @Test
    public void testModelise_PrimitiveCollection() throws NamingException, WegasNoResultException {
        GameModel gameModel1 = new GameModel();
        gameModel1.setName("gamemodel #1");
        gameModelFacade.createWithDebugGame(gameModel1);

        GameModel gameModel2 = new GameModel();
        gameModel2.setName("gamemodel #2");
        gameModelFacade.createWithDebugGame(gameModel2);

        createObjectDescriptor(gameModel1, null, "aSet", "My Set", ModelScoped.Visibility.PRIVATE, "value0", "value1");
        createString(gameModel1, null, "aString", "My String", "v1", "v1", "v10");
        createNumberDescriptor(gameModel1, null, "aNumber", "MyNumber", ModelScoped.Visibility.PRIVATE, null, null, 1.0, 1.1, 1.2, 1.3);
        createNumberDescriptor(gameModel1, null, "anOtherNumber", "My2ndNumber", ModelScoped.Visibility.PRIVATE, null, null, 1.0, 1.1, 1.2, 1.3);

        createObjectDescriptor(gameModel2, null, "aSet", "My Set", ModelScoped.Visibility.PRIVATE, "value0", "value1");
        createString(gameModel2, null, "aString", "My String", "v1", "v1", "v10");
        createNumberDescriptor(gameModel2, null, "aNumber", "MyNumber", ModelScoped.Visibility.PRIVATE, null, null, 1.0, 1.1, 1.2, 1.3);
        createNumberDescriptor(gameModel2, null, "anOtherNumber", "My2ndNumber", ModelScoped.Visibility.PRIVATE, null, null, 1.0, 5.3, 32.14);

        gameModel1 = gameModelFacade.find(gameModel1.getId());
        gameModel2 = gameModelFacade.find(gameModel2.getId());

        List<GameModel> scenarios = new ArrayList<>();

        scenarios.add(gameModel1);
        scenarios.add(gameModel2);

        logger.info("Create Model");
        GameModel model = modelFacade.createModelFromCommonContent(scenarios);

        VariableDescriptor descriptor = getDescriptor(model, "anOtherNumber");

        descriptor.setVisibility(ModelScoped.Visibility.INTERNAL);
        variableDescriptorFacade.update(descriptor.getId(), descriptor);

        model = modelFacade.propagateModel(model.getId());

        logger.debug(Helper.printGameModel(gameModelFacade.find(model.getId())));
        logger.debug(Helper.printGameModel(gameModelFacade.find(gameModel1.getId())));
        logger.debug(Helper.printGameModel(gameModelFacade.find(gameModel2.getId())));

        logger.info("anOtherNumberHistory : {} {}",
                ((NumberDescriptor) getDescriptor(gameModel1, "anOtherNumber")).getDefaultInstance().getHistory(),
                ((NumberDescriptor) getDescriptor(gameModel2, "anOtherNumber")).getDefaultInstance().getHistory());

        ObjectDescriptor om1 = (ObjectDescriptor) getDescriptor(model, "aSet");
        om1.setProperty("prop1", "value1.0");
        om1.getDefaultInstance().setProperty("prop1", "value1.0");
        variableDescriptorFacade.update(om1.getId(), om1);

        ObjectDescriptor o1 = (ObjectDescriptor) getDescriptor(gameModel1, "aSet");
        o1.setProperty("prop0", "value0.1");
        o1.setProperty("prop1", "value1.1");
        o1.setProperty("prop2", "value2.1");
        o1.getDefaultInstance().setProperty("prop0", "value0.1");
        o1.getDefaultInstance().setProperty("prop1", "value1.1");
        o1.getDefaultInstance().setProperty("prop2", "value2.1");
        variableDescriptorFacade.update(o1.getId(), o1);

        StringDescriptor s1 = (StringDescriptor) getDescriptor(gameModel1, "aString");
        s1.getAllowedValues().remove(1);
        s1.getAllowedValues().add("v11");
        variableDescriptorFacade.update(s1.getId(), s1);

        NumberDescriptor nm = (NumberDescriptor) getDescriptor(model, "aNumber");
        List<Double> history = nm.getDefaultInstance().getHistory();
        history.add(1.2);
        history.add(1.1);
        history.add(1.0);
        nm.getDefaultInstance().setHistory(history);
        variableDescriptorFacade.update(nm.getId(), nm);

        NumberDescriptor n1 = (NumberDescriptor) getDescriptor(gameModel1, "aNumber");
        history = n1.getDefaultInstance().getHistory();
        history.add(1.4);
        history.add(1.3);
        history.add(1.2);
        n1.getDefaultInstance().setHistory(history);
        variableDescriptorFacade.update(n1.getId(), n1);

        NumberInstance ni1 = (NumberInstance) getInstance(gameModel1, "aNumber");
        List<Double> history1 = ni1.getHistory();
        history1.add(3.14);
        ni1.setHistory(history1);
        variableInstanceFacade.update(ni1.getId(), ni1);

        assertListEquals(((NumberInstance) getInstance(gameModel1, "aNumber")).getHistory(), 1.1, 1.2, 1.3, 3.14);

        /*
          |    what     |  model             |          #1                        |        #2          |
          | desc.prop0  | value0             | value0   -> value0.1 -> value0.1   | value0             |
          | desc.prop1  | value1 -> value1.0 | value1   -> value1.1 -> value1.1   | value1 -> value1.0 |
          | desc.prop2  |                    | value2.1                           |                    |
          | inst.prop0  | value0             | value0   -> value0.1 -> value0.1.  | value0             |
          | inst.prop1  | value1 -> value1.0 | value1   -> value1.1 -> value1.1   | value1 -> value1.0 |
          | inst.prop2  |                    | value2.1                           |                    |
          | str         | v1; v10            | v1;v11 -> v1;v11                   | v1;v10             |
          | nbr hist    | 123 + 210          | 123 + 432 => 123432210             | 123 + 210          |
         */
        modelFacade.propagateModel(model.getId());

        logger.debug(Helper.printGameModel(gameModelFacade.find(model.getId())));
        logger.debug(Helper.printGameModel(gameModelFacade.find(gameModel1.getId())));
        logger.debug(Helper.printGameModel(gameModelFacade.find(gameModel2.getId())));

        logger.info("aNumberHistory : {} {}",
                ((NumberDescriptor) getDescriptor(gameModel1, "aNumber")).getDefaultInstance().getHistory(),
                ((NumberDescriptor) getDescriptor(gameModel2, "aNumber")).getDefaultInstance().getHistory());

        List<String> allowedValues1 = ((StringDescriptor) getDescriptor(gameModel1, "aString")).getAllowedValues();
        List<String> allowedValues2 = ((StringDescriptor) getDescriptor(gameModel2, "aString")).getAllowedValues();

        allowedValues1.size();
        allowedValues2.size();
        logger.info("aStringEnum : {} {}", allowedValues1, allowedValues2);

        Map<String, String> properties;
        properties = ((ObjectDescriptor) getDescriptor(gameModel1, "aSet")).getProperties();
        Assert.assertEquals("value0.1", properties.get("prop0"));
        Assert.assertEquals("value1.1", properties.get("prop1"));
        Assert.assertEquals("value2.1", properties.get("prop2"));

        properties = ((ObjectDescriptor) getDescriptor(gameModel1, "aSet")).getDefaultInstance().getProperties();

        Assert.assertEquals("value0.1", properties.get("prop0"));
        Assert.assertEquals("value1.1", properties.get("prop1"));
        Assert.assertEquals("value2.1", properties.get("prop2"));

        properties = ((ObjectDescriptor) getDescriptor(gameModel2, "aSet")).getProperties();
        Assert.assertEquals("value0", properties.get("prop0"));
        Assert.assertEquals("value1.0", properties.get("prop1"));

        properties = ((ObjectDescriptor) getDescriptor(gameModel2, "aSet")).getDefaultInstance().getProperties();
        Assert.assertEquals("value0", properties.get("prop0"));
        Assert.assertEquals("value1.0", properties.get("prop1"));

        assertListEquals(((StringDescriptor) getDescriptor(gameModel1, "aString")).getAllowedValues(), "v1", "v11");
        assertListEquals(((StringDescriptor) getDescriptor(gameModel2, "aString")).getAllowedValues(), "v1", "v10");

        assertListEquals(((NumberDescriptor) getDescriptor(gameModel1, "aNumber")).getDefaultInstance().getHistory(), 1.1, 1.2, 1.3, 1.4, 1.3, 1.2, 1.2, 1.1, 1.0);

        assertListEquals(((NumberDescriptor) getDescriptor(gameModel2, "aNumber")).getDefaultInstance().getHistory(), 1.1, 1.2, 1.3, 1.2, 1.1, 1.0);

        assertListEquals(((NumberInstance) getInstance(gameModel1, "aNumber")).getHistory(), 1.1, 1.2, 1.3, 1.4, 1.3, 1.2, 1.2, 1.1, 1.0);

        logger.info("DONE");
    }

    @Test
    public void testModelise() throws NamingException, WegasNoResultException, IOException {
        GameModel gameModel1 = new GameModel();
        gameModel1.setName("gamemodel #1");
        gameModelFacade.createWithDebugGame(gameModel1);

        GameModel gameModel2 = new GameModel();
        gameModel2.setName("gamemodel #2");
        gameModelFacade.createWithDebugGame(gameModel2);

        GameModel gameModel3 = new GameModel();
        gameModel3.setName("gamemodel #3");
        gameModelFacade.createWithDebugGame(gameModel3);

        ListDescriptor list1_1 = createList(gameModel1, null, "MyFirstFolder", "My First Folder");
        //                                           N,   L,  Min, Max,   Def, History...
        createNumberDescriptor(gameModel1, list1_1, "x", "X", ModelScoped.Visibility.PRIVATE, 0.0, 100.0, 1.0, 1.0, 1.1);
        createNumberDescriptor(gameModel1, list1_1, "y", "Y", ModelScoped.Visibility.PRIVATE, 0.0, 100.0, 2.0, 2.0, 2.1);
        createNumberDescriptor(gameModel1, list1_1, "z", "Z", ModelScoped.Visibility.PRIVATE, 0.0, 100.0, 3.0, 3.0, 3.1);
        createNumberDescriptor(gameModel1, list1_1, "t", "T", ModelScoped.Visibility.PRIVATE, 0.0, 100.0, 4.0, 4.0, 4.1);

        ListDescriptor list1_2 = createList(gameModel2, null, "MyFirstFolder", "My First Folder");
        createNumberDescriptor(gameModel2, list1_2, "x", "LABEL X", ModelScoped.Visibility.PRIVATE, 0.0, 100.0, 1.0, 1.0, 1.1);
        createNumberDescriptor(gameModel2, list1_2, "y", "LABEL Y", ModelScoped.Visibility.PRIVATE, 0.0, 100.0, 2.0, 2.0, 2.1);
        createNumberDescriptor(gameModel2, list1_2, "z", "LABEL Z", ModelScoped.Visibility.PRIVATE, 0.0, 100.0, 3.0, 3.0, 3.1);
        createNumberDescriptor(gameModel2, list1_2, "t", "LABEL T", ModelScoped.Visibility.PRIVATE, 0.0, 100.0, 4.0, 4.0, 4.1);

        createNumberDescriptor(gameModel3, null, "x", "LBL X", ModelScoped.Visibility.PRIVATE, -100.0, 100.0, 1.5, 1.1, 1.2);
        createNumberDescriptor(gameModel3, null, "y", "LBL Y", ModelScoped.Visibility.PRIVATE, -100.0, 100.0, 2.5, 2.1, 2.2);
        createNumberDescriptor(gameModel3, null, "z", "LBL Z", ModelScoped.Visibility.PRIVATE, -100.0, 100.0, 3.5, 3.1, 3.2);
        createNumberDescriptor(gameModel3, null, "t", "LBL T", ModelScoped.Visibility.PRIVATE, -100.0, 100.0, 4.5, 4.1, 4.2);

        gameModel1 = gameModelFacade.find(gameModel1.getId());
        gameModel2 = gameModelFacade.find(gameModel2.getId());
        gameModel3 = gameModelFacade.find(gameModel3.getId());

        List<GameModel> scenarios = new ArrayList<>();

        scenarios.add(gameModel1);
        scenarios.add(gameModel2);
        scenarios.add(gameModel3);

        logger.info("Create Model");
        GameModel model = modelFacade.createModelFromCommonContent(scenarios);
        modelFacade.propagateModel(model.getId());

        List<VariableDescriptor> children = new ArrayList<>();
        children.addAll(model.getChildVariableDescriptors());

        logger.info("Update Visibilities");
        while (children.size() > 0) {
            VariableDescriptor vd = children.remove(0);
            switch (vd.getName()) {
                case "x":
                    vd.setVisibility(ModelScoped.Visibility.INTERNAL);
                    break;
                case "y":
                    vd.setVisibility(ModelScoped.Visibility.PROTECTED);
                    break;
                case "z":
                    vd.setVisibility(ModelScoped.Visibility.INHERITED);
                    break;
                case "t":
                    vd.setVisibility(ModelScoped.Visibility.PRIVATE);
                    break;
                default:
                    vd.setVisibility(ModelScoped.Visibility.INHERITED);
            }

            variableDescriptorFacade.update(vd.getId(), vd);

            logger.info("Vd {} -> {}", vd, vd.getVisibility());
            if (vd instanceof DescriptorListI) {
                children.addAll(((DescriptorListI) vd).getItems());
            }
        }

        logger.info("Initial Model Propagation");
        model = modelFacade.propagateModel(model.getId());

        logger.debug(Helper.printGameModel(model));
        logger.debug(Helper.printGameModel(gameModelFacade.find(gameModel1.getId())));
        logger.debug(Helper.printGameModel(gameModelFacade.find(gameModel3.getId())));
        logger.debug(Helper.printGameModel(gameModelFacade.find(gameModel2.getId())));

        NumberInstance xi1, xi2, xi3;
        NumberInstance yi1, yi2, yi3;
        NumberInstance zi1, zi2, zi3;

        /*
         * X: Model override scenarios
         */
        xi1 = (NumberInstance) getInstance(gameModel1, "x");
        xi2 = (NumberInstance) getInstance(gameModel2, "x");
        xi3 = (NumberInstance) getInstance(gameModel3, "x");

        Assert.assertEquals("X", xi1.findDescriptor().getLabel());
        Assert.assertEquals("X", xi2.findDescriptor().getLabel());
        Assert.assertEquals("X", xi3.findDescriptor().getLabel());
        Assert.assertEquals(1.0, xi1.getValue(), 0.00001);
        Assert.assertEquals(1.0, xi2.getValue(), 0.00001);
        Assert.assertEquals(1.0, xi3.getValue(), 0.00001);


        /*
         * Y: model override descriptor but update defaultinstance 
         */
        yi1 = (NumberInstance) getInstance(gameModel1, "y");
        yi2 = (NumberInstance) getInstance(gameModel2, "y");
        yi3 = (NumberInstance) getInstance(gameModel3, "y");

        Assert.assertEquals("Y", yi1.findDescriptor().getLabel());
        Assert.assertEquals("Y", yi2.findDescriptor().getLabel());
        Assert.assertEquals("Y", yi3.findDescriptor().getLabel());
        Assert.assertEquals(2.0, yi1.getValue(), 0.00001);
        Assert.assertEquals(2.0, yi2.getValue(), 0.00001);
        Assert.assertEquals(2.5, yi3.getValue(), 0.00001);


        /*
         * Z: model update descriptor and defaultinstance 
         */
        zi1 = (NumberInstance) getInstance(gameModel1, "z");
        zi2 = (NumberInstance) getInstance(gameModel2, "z");
        zi3 = (NumberInstance) getInstance(gameModel3, "z");

        logger.error("Z {} history {}", zi1, zi1.getHistory());
        logger.error("Z {} history {}", zi2, zi2.getHistory());
        logger.error("Z {} history {}", zi3, zi3.getHistory());

        Assert.assertEquals("Z", zi1.findDescriptor().getLabel());
        Assert.assertEquals("LABEL Z", zi2.findDescriptor().getLabel());
        Assert.assertEquals("LBL Z", zi3.findDescriptor().getLabel());
        Assert.assertEquals(3.0, zi1.getValue(), 0.00001);
        Assert.assertEquals(3.0, zi2.getValue(), 0.00001);
        Assert.assertEquals(3.5, zi3.getValue(), 0.00001);

        // Update model
        NumberDescriptor xModel = (NumberDescriptor) variableDescriptorFacade.find(model, "x");
        NumberDescriptor yModel = (NumberDescriptor) variableDescriptorFacade.find(model, "y");
        NumberDescriptor zModel = (NumberDescriptor) variableDescriptorFacade.find(model, "z");

        xModel.setLabel("my X");
        xModel.getDefaultInstance().setValue(11.0);
        variableDescriptorFacade.update(xModel.getId(), xModel);

        yModel.setLabel("my Y");
        yModel.getDefaultInstance().setValue(12.0);
        variableDescriptorFacade.update(yModel.getId(), yModel);

        zModel.setLabel("my Z");
        zModel.getDefaultInstance().setValue(13.0);
        zModel.getDefaultInstance().getHistory().add(13.0);
        variableDescriptorFacade.update(zModel.getId(), zModel);

        logger.info("Propagate Model Update");
        modelFacade.propagateModel(model.getId());

        /*
         * X: Model override scenarios
         */
        xi1 = (NumberInstance) getInstance(gameModel1, "x");
        xi2 = (NumberInstance) getInstance(gameModel2, "x");
        xi3 = (NumberInstance) getInstance(gameModel3, "x");

        Assert.assertEquals("my X", xi1.findDescriptor().getLabel());
        Assert.assertEquals("my X", xi2.findDescriptor().getLabel());
        Assert.assertEquals("my X", xi3.findDescriptor().getLabel());
        Assert.assertEquals(11.0, xi1.getValue(), 0.00001);
        Assert.assertEquals(11.0, xi2.getValue(), 0.00001);
        Assert.assertEquals(11.0, xi3.getValue(), 0.00001);


        /*
         * Y: model override descriptor but update defaultinstance 
         */
        yi1 = (NumberInstance) getInstance(gameModel1, "y");
        yi2 = (NumberInstance) getInstance(gameModel2, "y");
        yi3 = (NumberInstance) getInstance(gameModel3, "y");

        Assert.assertEquals("my Y", yi1.findDescriptor().getLabel());
        Assert.assertEquals("my Y", yi2.findDescriptor().getLabel());
        Assert.assertEquals("my Y", yi3.findDescriptor().getLabel());
        Assert.assertEquals(12.0, yi1.getValue(), 0.00001);
        Assert.assertEquals(12.0, yi2.getValue(), 0.00001);
        Assert.assertEquals(2.5, yi3.getValue(), 0.00001);


        /*
         * Z: model update descriptor and defaultinstance 
         */
        zi1 = (NumberInstance) getInstance(gameModel1, "z");
        zi2 = (NumberInstance) getInstance(gameModel2, "z");
        zi3 = (NumberInstance) getInstance(gameModel3, "z");

        logger.error("Z {} history {}", zi1, zi1.getHistory());
        logger.error("Z {} history {}", zi2, zi2.getHistory());
        logger.error("Z {} history {}", zi3, zi3.getHistory());

        Assert.assertEquals("my Z", zi1.findDescriptor().getLabel());
        Assert.assertEquals("LABEL Z", zi2.findDescriptor().getLabel());
        Assert.assertEquals("LBL Z", zi3.findDescriptor().getLabel());
        Assert.assertEquals(13.0, zi1.getValue(), 0.00001);
        Assert.assertEquals(13.0, zi2.getValue(), 0.00001);
        Assert.assertEquals(3.5, zi3.getValue(), 0.00001);

        /**
         * Create new descriptors in model
         */
        ListDescriptor folder = (ListDescriptor) getDescriptor(model, "myFirstFolder");
        createNumberDescriptor(model, folder, "alpha", "α", ModelScoped.Visibility.PROTECTED, -1.0, +1.0, 0.666, 0.0, 0.333);
        createNumberDescriptor(model, null, "pi", "π", ModelScoped.Visibility.INHERITED, null, null, 3.14);

        /**
         * Switch to 2D and move x to root level
         */
        variableDescriptorFacade.remove(getDescriptor(model, "z").getId());
        variableDescriptorFacade.move(getDescriptor(model, "x").getId(), 0);

        logger.info("Propagate Model: Create Alpha &Pi; Remove Z and move X");
        modelFacade.propagateModel(model.getId());

        /**
         * Assert new descriptor stand in the correct folder
         */
        Assert.assertEquals(getDescriptor(gameModel1, "myFirstFolder"), getDescriptor(gameModel1, "alpha").getParentList());
        Assert.assertEquals(getDescriptor(gameModel2, "myFirstFolder"), getDescriptor(gameModel2, "alpha").getParentList());
        Assert.assertEquals(getDescriptor(gameModel3, "myFirstFolder"), getDescriptor(gameModel3, "alpha").getParentList());

        Assert.assertEquals(gameModel1, getDescriptor(gameModel1, "pi").getRootGameModel());
        Assert.assertEquals(gameModel2, getDescriptor(gameModel2, "pi").getRootGameModel());
        Assert.assertEquals(gameModel3, getDescriptor(gameModel3, "pi").getRootGameModel());

        /**
         * Assert z no longer exists
         */
        Assert.assertNull(getDescriptor(gameModel1, "z"));
        Assert.assertNull(getDescriptor(gameModel2, "z"));
        Assert.assertNull(getDescriptor(gameModel3, "z"));

        /**
         * Assert x stands at root level
         */
        Assert.assertEquals(gameModel1, getDescriptor(gameModel1, "x").getRootGameModel());
        Assert.assertEquals(gameModel2, getDescriptor(gameModel2, "x").getRootGameModel());
        Assert.assertEquals(gameModel3, getDescriptor(gameModel3, "x").getRootGameModel());

        Assert.assertNull(getDescriptor(gameModel1, "x").getParentList());
        Assert.assertNull(getDescriptor(gameModel2, "x").getParentList());
        Assert.assertNull(getDescriptor(gameModel3, "x").getParentList());

        /**
         * remove var from root level
         */
        variableDescriptorFacade.remove(getDescriptor(model, "x").getId());
        logger.info("Propagate Model: Remove X");
        modelFacade.propagateModel(model.getId());

        /**
         * Assert x no longer exists
         */
        Assert.assertNull(getDescriptor(gameModel1, "x"));
        Assert.assertNull(getDescriptor(gameModel2, "x"));
        Assert.assertNull(getDescriptor(gameModel3, "x"));

        logger.debug(Helper.printGameModel(gameModelFacade.find(gameModel1.getId())));
        logger.debug(Helper.printGameModel(gameModelFacade.find(gameModel2.getId())));
        logger.debug(Helper.printGameModel(gameModelFacade.find(gameModel3.getId())));

        /**
         * Change Y default value and move to root
         * <p>
         */
        NumberDescriptor y1 = (NumberDescriptor) getDescriptor(model, "y");

        y1.setLabel("my Y");
        y1.getDefaultInstance().setValue(22.0);
        variableDescriptorFacade.update(y1.getId(), y1);
        variableDescriptorFacade.move(getDescriptor(model, "y").getId(), 0);

        logger.info("Propagate Model: Update Y.value; move Y to Root");
        modelFacade.propagateModel(model.getId());

        logger.debug(Helper.printGameModel(gameModelFacade.find(gameModel1.getId())));
        logger.debug(Helper.printGameModel(gameModelFacade.find(gameModel2.getId())));
        logger.debug(Helper.printGameModel(gameModelFacade.find(gameModel3.getId())));

        /**
         * Assert y stands at root level
         */
        Assert.assertEquals(gameModel1, getDescriptor(gameModel1, "y").getRootGameModel());
        Assert.assertEquals(gameModel2, getDescriptor(gameModel2, "y").getRootGameModel());
        Assert.assertEquals(gameModel3, getDescriptor(gameModel3, "y").getRootGameModel());

        Assert.assertNull(getDescriptor(gameModel1, "y").getParentList());
        Assert.assertNull(getDescriptor(gameModel2, "y").getParentList());
        Assert.assertNull(getDescriptor(gameModel3, "y").getParentList());

        /*
         * Y: model override descriptor but update defaultinstance 
         */
        Assert.assertEquals(22.0, ((NumberInstance) getInstance(gameModel1, "y")).getValue(), 0.00001);
        Assert.assertEquals(22.0, ((NumberInstance) getInstance(gameModel2, "y")).getValue(), 0.00001);
        Assert.assertEquals(2.5, ((NumberInstance) getInstance(gameModel3, "y")).getValue(), 0.00001);

        /* Move alpha to root & delete */
        variableDescriptorFacade.move(getDescriptor(model, "alpha").getId(), 0);
        variableDescriptorFacade.remove(getDescriptor(model, "myFirstFolder").getId());

        logger.info("Propagate Model: Update Y.value; move Y to Root");
        modelFacade.propagateModel(model.getId());

        logger.debug(Helper.printGameModel(gameModelFacade.find(gameModel1.getId())));
        logger.debug(Helper.printGameModel(gameModelFacade.find(gameModel2.getId())));
        logger.debug(Helper.printGameModel(gameModelFacade.find(gameModel3.getId())));

        Assert.assertNull(getDescriptor(gameModel1, "myFirstFolder"));
        Assert.assertNull(getDescriptor(gameModel2, "myFirstFolder"));
        Assert.assertNull(getDescriptor(gameModel3, "myFirstFolder"));

        Assert.assertEquals(0.666, ((NumberInstance) getInstance(gameModel1, "alpha")).getValue(), 0.00001);
        Assert.assertEquals(0.666, ((NumberInstance) getInstance(gameModel2, "alpha")).getValue(), 0.00001);
        Assert.assertEquals(0.666, ((NumberInstance) getInstance(gameModel3, "alpha")).getValue(), 0.00001);

        logger.info("FINI");
    }

    @Test
    public void testModelise_GameModelFiles() throws RepositoryException {
        GameModel gameModel1 = new GameModel();
        gameModel1.setName("gamemodel #1");

        RepositoryVisitor.ListRepository ls = new RepositoryVisitor.ListRepository();

        gameModelFacade.createWithDebugGame(gameModel1);
        jcrFacade.createDirectory(gameModel1.getId(), ContentConnector.WorkspaceType.FILES, "dir1", "/", "first directory", "first directory description");
        jcrFacade.createDirectory(gameModel1.getId(), ContentConnector.WorkspaceType.FILES, "dir11", "/dir1", "first directory child", "first directory description child");
        jcrFacade.createDirectory(gameModel1.getId(), ContentConnector.WorkspaceType.FILES, "dir2", "/", "second directory", "2nd directory description");

        GameModel gameModel2 = new GameModel();
        gameModel2.setName("gamemodel #2");
        gameModelFacade.createWithDebugGame(gameModel2);
        jcrFacade.createDirectory(gameModel2.getId(), ContentConnector.WorkspaceType.FILES, "dir1", "/", "first directory", "first directory description");
        jcrFacade.createDirectory(gameModel2.getId(), ContentConnector.WorkspaceType.FILES, "dir3", "/", "third directory", "3rd directory description");

        gameModel1 = gameModelFacade.find(gameModel1.getId());
        gameModel2 = gameModelFacade.find(gameModel2.getId());

        ls.visitGameModelFiles(gameModel1);
        ls.visitGameModelFiles(gameModel2);

        List<GameModel> scenarios = new ArrayList<>();

        scenarios.add(gameModel1);
        scenarios.add(gameModel2);

        logger.info("Create Model");
        GameModel model = modelFacade.createModelFromCommonContent(scenarios);
        modelFacade.propagateModel(model.getId());

        model = gameModelFacade.find(model.getId());
        gameModel1 = gameModelFacade.find(gameModel1.getId());
        gameModel2 = gameModelFacade.find(gameModel2.getId());


        ls.visitGameModelFiles(model);
        ls.visitGameModelFiles(gameModel1);
        ls.visitGameModelFiles(gameModel2);

        List<AbstractContentDescriptor> list = jcrFacade.listDirectory(model.getId(), ContentConnector.WorkspaceType.FILES, "/");
        for (AbstractContentDescriptor item : list) {
            logger.error("I: " + item.getPath() + " :: " + item.getName());
        }

        list = jcrFacade.listDirectory(gameModel1.getId(), ContentConnector.WorkspaceType.FILES, "/");
        for (AbstractContentDescriptor item : list) {
            logger.error("I: " + item.getPath() + " :: " + item.getName());
        }

        list = jcrFacade.listDirectory(gameModel2.getId(), ContentConnector.WorkspaceType.FILES, "/");
        for (AbstractContentDescriptor item : list) {
            logger.error("I: " + item.getPath() + " :: " + item.getName());
        }
    }

    private Team createTeam(Game g, String name) {
        Team t = new Team(name);
        t.setGame(g);
        teamFacade.create(g.getId(), t);
        return t;
    }

    private Player createPlayer(Team t) {
        User u = new User();
        userFacade.create(u);

        return gameFacade.joinTeam(t.getId(), u.getId());
    }

    /**
     * Test registeredGames
     */
    //@Test
    public void testMassiveJoinBigGame() throws Exception {
        int nbTeam = 100;
        int nbPlayer = 10;
        int nbVariable = 500;

        GameModel bigGameModel = new GameModel();
        bigGameModel.setName("a big gamemodel");
        gameModelFacade.createWithDebugGame(bigGameModel);

        long start;

        for (int i = 0; i < nbVariable; i++) {
            start = System.currentTimeMillis();
            createNumberDescriptor(bigGameModel, null, "Number #" + i, "#" + i, ModelScoped.Visibility.INHERITED, 0.0, 100.0, 0.0);
            logger.error("Create Variable # {} in {}", i, (System.currentTimeMillis() - start));
        }

        Game g = new Game("game");
        g.setGameModel(bigGameModel);
        gameFacade.create(g);

        for (int i = 0; i < nbTeam; i++) {
            long startTeam = System.currentTimeMillis();
            Team t = createTeam(g, "T" + i);
            logger.error("Team in {}", (System.currentTimeMillis() - startTeam));
            logger.error("Create Team # {}", i);
            for (int j = 0; j < nbPlayer; j++) {
                start = System.currentTimeMillis();
                createPlayer(t);
                logger.error("   Create Player # {} in {}", j, (System.currentTimeMillis() - start));
            }
        }

        gameModelFacade.reset(bigGameModel.getId());
    }
}
