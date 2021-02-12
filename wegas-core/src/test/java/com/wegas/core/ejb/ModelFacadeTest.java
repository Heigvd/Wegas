
/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.wegas.core.Helper;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.exception.internal.WegasNoResultException;
import com.wegas.core.i18n.ejb.I18nFacade;
import com.wegas.core.i18n.persistence.TranslatableContent;
import com.wegas.core.i18n.persistence.Translation;
import com.wegas.core.jcr.content.ContentConnector;
import com.wegas.core.jcr.jta.JCRConnectorProvider;
import com.wegas.core.jcr.jta.JCRConnectorProviderTx;
import com.wegas.core.jcr.page.Pages;
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
import com.wegas.core.persistence.variable.ModelScoped.Visibility;
import static com.wegas.core.persistence.variable.ModelScoped.Visibility.PRIVATE;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.core.persistence.variable.primitive.EnumItem;
import com.wegas.core.persistence.variable.primitive.NumberDescriptor;
import com.wegas.core.persistence.variable.primitive.NumberInstance;
import com.wegas.core.persistence.variable.primitive.ObjectDescriptor;
import com.wegas.core.persistence.variable.primitive.StringDescriptor;
import com.wegas.core.persistence.variable.primitive.StringInstance;
import com.wegas.core.persistence.variable.statemachine.StateMachineDescriptor;
import com.wegas.core.security.persistence.User;
import com.wegas.resourceManagement.persistence.TaskDescriptor;
import com.wegas.test.arquillian.AbstractArquillianTest;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import javax.inject.Inject;
import javax.jcr.RepositoryException;
import javax.naming.NamingException;
import javax.ws.rs.core.MediaType;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.reflections.Reflections;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.event.Level;

/**
 *
 * @author Maxence
 */
public class ModelFacadeTest extends AbstractArquillianTest {

    private static final Logger logger = LoggerFactory.getLogger(ModelFacadeTest.class);
    private static final Reflections reflections;

    private static Level mfLevel;
    private static Level vdLevel;
    private static Level vdfLevel;
    private static Level wpLevel;

    @Inject
    private ModelFacade modelFacade;

    @Inject
    private JCRFacade jcrFacade;

    @Inject
    private PageFacade pageFacade;

    @Inject
    private I18nFacade i18nFacade;

    static {
        reflections = new Reflections("com.wegas");
    }

    //@BeforeClass
    public static void setLoggerLevels() {
        Helper.setLoggerLevel(logger, Level.INFO);
        mfLevel = Helper.setLoggerLevel(ModelFacade.class, Level.DEBUG);
        wpLevel = Helper.setLoggerLevel(WegasPatch.class, Level.DEBUG);
        vdfLevel = Helper.setLoggerLevel(VariableDescriptorFacade.class, Level.DEBUG);
        vdLevel = Helper.setLoggerLevel(VariableDescriptor.class, Level.DEBUG);
    }

    //@AfterClass
    public static void rollbackLevels() {
        Helper.setLoggerLevel(ModelFacade.class, mfLevel);
        Helper.setLoggerLevel(WegasPatch.class, wpLevel);
        Helper.setLoggerLevel(VariableDescriptorFacade.class, vdfLevel);
        Helper.setLoggerLevel(VariableDescriptor.class, vdLevel);
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
        Assertions.assertEquals(expected.size(), list.length);

        for (int i = 0; i < expected.size(); i++) {
            Assertions.assertEquals(expected.get(i), list[i]);
        }
    }

    private void assertTranslatableEquals(TranslatableContent a, TranslatableContent b) {
        Map<String, Translation> aT = a.getTranslations();
        Map<String, Translation> bT = b.getTranslations();

        Assertions.assertEquals(aT.keySet().size(), bT.keySet().size());

        for (String key : aT.keySet()) {
            Translation at = aT.get(key);
            Translation bt = bT.get(key);

            String strA = null;
            String strB = null;

            if (at != null) {
                strA = at.getTranslation();
            }

            if (bt != null) {
                strB = bt.getTranslation();
            }

            Assertions.assertEquals(strA, strB);

        }
    }

    private void assertTranslationEquals(TranslatableContent t, String code, String value) {
        Translation translation = t.getTranslation(code);
        if (translation == null) {
            Assertions.assertNull(value, "Translation for " + code + " should not be null");
        } else {
            Assertions.assertEquals(translation.getTranslation(), value, "Translation for " + code + " does not match");
        }
    }

    private void assertTranslation(TranslatableContent a, TranslatableContent b, String language, boolean equals) {
        Translation ta = a.getTranslation(language);
        Translation tb = b.getTranslation(language);
        if (equals) {
            if (ta != null && tb != null) {
                Assertions.assertEquals(a.getTranslation(language).getTranslation(), b.getTranslation(language).getTranslation());
            } else {
                Assertions.assertEquals(ta, tb);
            }
        } else {
            if (ta != null && tb != null) {
                Assertions.assertNotEquals(a.getTranslation(language).getTranslation(), b.getTranslation(language).getTranslation());
            } else {
                Assertions.assertNotEquals(ta, tb);
            }
        }
    }

    private void assertEnumItemsListEquals(List<EnumItem> list, String... expected) {
        Assertions.assertEquals(expected.length, list.size());

        for (int i = 0; i < list.size(); i++) {
            EnumItem get = list.get(i);
            Assertions.assertEquals(expected[i], get.getName());

            for (int j = 0; j < list.size(); j++) {
                for (Translation v : list.get(i).getLabel().getTranslations().values()) {
                    Assertions.assertEquals(v.getTranslation(), expected[i]);
                }
            }
        }
    }

    @Test
    public void testModelise_GameModelProperties() throws NamingException, WegasNoResultException, RepositoryException {
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
        GameModel model = modelFacade.createModelFromCommonContent("model", scenarios);
        modelFacade.propagateModel(model.getId());

        Assertions.assertEquals("model", model.getName());
        Assertions.assertEquals("gamemodel #1", gameModel1.getName());
        Assertions.assertEquals("gamemodel #2", gameModel2.getName());

        Assertions.assertEquals("DefaultLogId1", model.getProperties().getLogID());
        Assertions.assertEquals("DefaultLogId1", gameModel1.getProperties().getLogID());
        Assertions.assertEquals("DefaultLogId2", gameModel2.getProperties().getLogID());

        model.getProperties().setLogID("NewLogId");
        model.setName("My Model");
        model = gameModelFacade.update(model.getId(), model);

        gameModel1.setName("My first scenario");
        gameModel1 = gameModelFacade.update(gameModel1.getId(), gameModel1);

        Assertions.assertEquals("My Model", model.getName());
        Assertions.assertEquals("My first scenario", gameModel1.getName());
        Assertions.assertEquals("gamemodel #2", gameModel2.getName());

        /**
         * Update gameModel properties
         */
        modelFacade.propagateModel(model.getId());

        gameModel1 = gameModelFacade.find(gameModel1.getId());
        gameModel2 = gameModelFacade.find(gameModel2.getId());

        Assertions.assertEquals("NewLogId", model.getProperties().getLogID());
        Assertions.assertEquals("NewLogId", gameModel1.getProperties().getLogID());
        Assertions.assertEquals("DefaultLogId2", gameModel2.getProperties().getLogID());

        Assertions.assertEquals("My Model", model.getName());
        Assertions.assertEquals("My first scenario", gameModel1.getName());
        Assertions.assertEquals("gamemodel #2", gameModel2.getName());
    }

    private void createCss(GameModel theModel, String uniqueToken) {
        Map<String, GameModelContent> cssLibrary = theModel.getCssLibrary();

        GameModelContent css = new GameModelContent();
        css.setContent(".model_rule { color: red}");
        css.setContentType("text/css");
        css.setVisibility(Visibility.INTERNAL);
        cssLibrary.put("modelCss", css);

        css = new GameModelContent();
        css.setContent(".protected_rule { color: red}");
        css.setContentType("text/css");
        css.setVisibility(Visibility.PROTECTED);
        cssLibrary.put("protectedCss", css);

        css = new GameModelContent();
        css.setContent(".inherited_rule { color: red}");
        css.setContentType("text/css");
        css.setVisibility(Visibility.INHERITED);
        cssLibrary.put("inheritedCss", css);

        css = new GameModelContent();
        css.setContent(".private_rule { color: red}");
        css.setContentType("text/css");
        css.setVisibility(Visibility.PRIVATE);
        cssLibrary.put("privateCss", css);

        css = new GameModelContent();
        css.setContent(".private_rule { color: red}");
        css.setContentType("text/css");
        css.setVisibility(Visibility.PRIVATE);
        cssLibrary.put("privateCss" + uniqueToken, css);

        theModel.setCssLibrary(cssLibrary);
    }

    private void updateCss(GameModel gm, String previousColor, String newColor) {
        Map<String, GameModelContent> css = gm.getCssLibrary();
        for (Entry<String, GameModelContent> entry : css.entrySet()) {
            GameModelContent value = entry.getValue();
            value.setContent(value.getContent().replace(previousColor, newColor));
        }
        gameModelFacade.merge(gm);
    }

    private void setPagesFromStrings(GameModel theModel, String... pages) throws IOException, RepositoryException {
        Map<String, JsonNode> gmPages = this.getPages(theModel);

        ObjectMapper mapper = new ObjectMapper();

        for (Integer i = 0; i < pages.length; i++) {
            JsonNode page = mapper.readTree(pages[i]);
            gmPages.put(i.toString(), page);
        }

        pageFacade.setPages(theModel, gmPages);
    }

    /*
     * outside a transaction imply using detached connectors
     */
    private Map<String, JsonNode> getPages(GameModel gameModel) throws RepositoryException {
        Pages pages = null;
        try {
            pages = (Pages) JCRConnectorProviderTx.getDetachedConnector(gameModel, JCRConnectorProvider.RepositoryType.PAGES);
            return pages.getPagesContent();
        } finally {
            if (pages != null) {
                pages.rollback();
            }
        }
    }

    private String getStringifiedPages(GameModel gameModel) throws RepositoryException {
        StringBuilder sb = new StringBuilder();

        for (Entry<String, JsonNode> page : this.getPages(gameModel).entrySet()) {
            String pageName = page.getKey();
            sb.append("  ").append(pageName).append("\n").append(page.getValue()).append("\n");
        }
        return sb.toString();
    }

    private void printPages(GameModel gameModel) throws RepositoryException {
        logger.error("GameModel {}", gameModel.toString());
        logger.error("Pages: {}", getStringifiedPages(gameModel));
    }

    @Test
    public void testModelise_GameModelPages() throws NamingException, WegasNoResultException, IOException, RepositoryException {
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

        List<GameModel> scenarios = new ArrayList<>();

        scenarios.add(gameModel1);
        scenarios.add(gameModel2);

        logger.info("Create Model");
        GameModel model = modelFacade.createModelFromCommonContent("model", scenarios);

        // by design, pages from the first gameModel are extracted
        Assertions.assertEquals(this.getStringifiedPages(model), this.getStringifiedPages(gameModel1));
        Assertions.assertNotEquals(this.getStringifiedPages(model), this.getStringifiedPages(gameModel2));

        Assertions.assertEquals(2,
            pageFacade.getPageIndex(model).getRoot().getItems().size());
        Assertions.assertEquals(3,
            pageFacade.getPageIndex(gameModel2).getRoot().getItems().size());

        modelFacade.propagateModel(model.getId());

        model = gameModelFacade.find(model.getId());
        gameModel1 = gameModelFacade.find(gameModel1.getId());
        gameModel2 = gameModelFacade.find(gameModel2.getId());

        Assertions.assertEquals(this.getStringifiedPages(model),
            this.getStringifiedPages(gameModel1));
        Assertions.assertEquals(this.getStringifiedPages(model),
            this.getStringifiedPages(gameModel2));

        Assertions.assertEquals(2,
            pageFacade.getPageIndex(model).getRoot().getItems().size());

        /**
         * Update pages
         */
        this.setPagesFromStrings(model, "{\"type\": \"List\", \"direction\": \"horizontal\", \"children\": []}",
            "{\"type\": \"AbsoluteLayout\", \"children\": []}",
            "{\"type\": \"FlexList\", \"direction\": \"horizontal\", \"children\": []}");
        model = gameModelFacade.merge(model);

        /**
         * Update gameModel properties
         */
        modelFacade.propagateModel(model.getId());

        model = gameModelFacade.find(model.getId());
        gameModel1 = gameModelFacade.find(gameModel1.getId());
        gameModel2 = gameModelFacade.find(gameModel2.getId());

        Assertions.assertEquals(this.getStringifiedPages(model),
            this.getStringifiedPages(gameModel1));
        Assertions.assertEquals(this.getStringifiedPages(model),
            this.getStringifiedPages(gameModel2));

        Assertions.assertEquals(3, pageFacade.getPageIndex(model).getRoot()
            .getItems().size());
    }

    @Test
    public void testModelise_GameModelContent() throws NamingException, WegasNoResultException, RepositoryException {
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
        GameModel model = modelFacade.createModelFromCommonContent("model", scenarios);

        printLibraries(model);

        // restore model css visibilities
        Map<String, GameModelContent> cssLibrary = model.getCssLibrary();
        for (Entry<String, GameModelContent> entry : cssLibrary.entrySet()) {
            String key = entry.getKey();
            GameModelContent value = entry.getValue();
            switch (key) {
                case "modelCss":
                    value.setVisibility(Visibility.INTERNAL);
                    break;
                case "protectedCss":
                    value.setVisibility(Visibility.PROTECTED);
                    break;
                case "inheritedCss":
                    value.setVisibility(Visibility.INHERITED);
                    break;
                default:
                    value.setVisibility(Visibility.PRIVATE);
                    break;
            }
        }
        model.setCssLibrary(cssLibrary);
        model = gameModelFacade.merge(model);

        modelFacade.propagateModel(model.getId());

        model = gameModelFacade.find(model.getId());
        gameModel1 = gameModelFacade.find(gameModel1.getId());
        gameModel2 = gameModelFacade.find(gameModel2.getId());

        /**
         * ASSERTS
         */
        Map<String, GameModelContent> modelCss = model.getCssLibrary();
        Map<String, GameModelContent> gameModel1Css = gameModel1.getCssLibrary();
        Map<String, GameModelContent> gameModel2Css = gameModel2.getCssLibrary();

        // modelCss and protected always set to model colour
        Assertions.assertTrue(modelCss.get("modelCss").getContent().contains("red"));
        Assertions.assertTrue(gameModel1Css.get("modelCss").getContent().contains("red"));
        Assertions.assertTrue(gameModel2Css.get("modelCss").getContent().contains("red"));

        Assertions.assertTrue(modelCss.get("protectedCss").getContent().contains("red"));
        Assertions.assertTrue(gameModel1Css.get("protectedCss").getContent().contains("red"));
        Assertions.assertTrue(gameModel2Css.get("protectedCss").getContent().contains("red"));

        // set to model colour, unless user change user change
        Assertions.assertTrue(modelCss.get("inheritedCss").getContent().contains("red"));
        Assertions.assertTrue(gameModel1Css.get("inheritedCss").getContent().contains("red"));
        Assertions.assertTrue(gameModel2Css.get("inheritedCss").getContent().contains("red"));

        // private is private
        Assertions.assertTrue(modelCss.get("privateCss").getContent().contains("red"));
        Assertions.assertTrue(gameModel1Css.get("privateCsssheet1").getContent().contains("red"));
        Assertions.assertTrue(gameModel2Css.get("privateCsssheet2").getContent().contains("red"));

        /**
         * Update CSS sheets
         */
        this.updateCss(model, "red", "hotpink");
        this.updateCss(gameModel1, "red", "palevioletred");

        /**
         * Update gameModel properties
         */
        modelFacade.propagateModel(model.getId());

        model = gameModelFacade.find(model.getId());
        gameModel1 = gameModelFacade.find(gameModel1.getId());
        gameModel2 = gameModelFacade.find(gameModel2.getId());

        modelCss = model.getCssLibrary();
        gameModel1Css = gameModel1.getCssLibrary();
        gameModel2Css = gameModel2.getCssLibrary();

        /**
         * ASSERTS
         */
        // modelCss and protected always set to model colour
        Assertions.assertTrue(modelCss.get("modelCss").getContent().contains("hotpink"));
        Assertions.assertTrue(gameModel1Css.get("modelCss").getContent().contains("hotpink"));
        Assertions.assertTrue(gameModel2Css.get("modelCss").getContent().contains("hotpink"));

        Assertions.assertTrue(modelCss.get("protectedCss").getContent().contains("hotpink"));
        Assertions.assertTrue(gameModel1Css.get("protectedCss").getContent().contains("hotpink"));
        Assertions.assertTrue(gameModel2Css.get("protectedCss").getContent().contains("hotpink"));

        // set to model colour, unless user change user change
        Assertions.assertTrue(modelCss.get("inheritedCss").getContent().contains("hotpink"));
        Assertions.assertTrue(gameModel1Css.get("inheritedCss").getContent().contains("palevioletred"));
        Assertions.assertTrue(gameModel2Css.get("inheritedCss").getContent().contains("hotpink"));

        // private is private
        Assertions.assertTrue(modelCss.get("privateCss").getContent().contains("hotpink"));
        Assertions.assertTrue(gameModel1Css.get("privateCsssheet1").getContent().contains("palevioletred"));
        Assertions.assertTrue(gameModel2Css.get("privateCsssheet2").getContent().contains("red"));
    }

    private String stringifyLibraries(GameModel gameModel) {
        StringBuilder sb = new StringBuilder();
        for (Entry<String, Map<String, GameModelContent>> entry : gameModel.getLibraries().entrySet()) {
            String libraryName = entry.getKey();
            sb.append("  ").append(libraryName).append("\n");
            for (Entry<String, GameModelContent> content : entry.getValue().entrySet()) {
                GameModelContent value = content.getValue();
                sb.append("   - ").append(" ").append(value.getVisibility()).append("::").append(content.getKey()).append(" (").append(value.getContentType()).append("): ").append(value.getContent()).append("\n");
            }
        }
        return sb.toString();
    }

    private void printLibraries(GameModel gameModel) {
        logger.error("GameModel {}", gameModel.toString());
        logger.error("Libraries: {}", this.stringifyLibraries(gameModel));
    }

    @Test
    public void testModelise_PrimitiveCollection() throws NamingException, WegasNoResultException, RepositoryException, RepositoryException {
        GameModel gameModel1 = new GameModel();
        gameModel1.setName("gamemodel #1");
        gameModelFacade.createWithDebugGame(gameModel1);

        GameModel gameModel2 = new GameModel();
        gameModel2.setName("gamemodel #2");
        gameModelFacade.createWithDebugGame(gameModel2);

        wegasFactory.createObjectDescriptor(gameModel1, null, "aSet", "My Set", Visibility.PRIVATE, "value0", "value1");
        wegasFactory.createString(gameModel1, null, "aString", "My String", "v1", "v1", "v10");
        wegasFactory.createNumberDescriptor(gameModel1, null, "aNumber", "MyNumber", Visibility.PRIVATE, null, null, 1.0, 1.1, 1.2, 1.3);
        wegasFactory.createNumberDescriptor(gameModel1, null, "anOtherNumber", "My2ndNumber", Visibility.PRIVATE, null, null, 1.0, 1.1, 1.2, 1.3);

        wegasFactory.createObjectDescriptor(gameModel2, null, "aSet", "My Set", Visibility.PRIVATE, "value0", "value1");
        wegasFactory.createString(gameModel2, null, "aString", "My String", "v1", "v1", "v10");
        wegasFactory.createNumberDescriptor(gameModel2, null, "aNumber", "MyNumber", Visibility.PRIVATE, null, null, 1.0, 1.1, 1.2, 1.3);
        wegasFactory.createNumberDescriptor(gameModel2, null, "anOtherNumber", "My2ndNumber", Visibility.PRIVATE, null, null, 1.0, 5.3, 32.14);

        gameModel1 = gameModelFacade.find(gameModel1.getId());
        gameModel2 = gameModelFacade.find(gameModel2.getId());

        List<GameModel> scenarios = new ArrayList<>();

        scenarios.add(gameModel1);
        scenarios.add(gameModel2);

        logger.info("Create Model");
        GameModel model = modelFacade.createModelFromCommonContent("model", scenarios);

        VariableDescriptor descriptor = getDescriptor(model, "anOtherNumber");

        descriptor.setVisibility(Visibility.INTERNAL);
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
        List<EnumItem> allowedValues = s1.getAllowedValues();
        allowedValues.remove(1);
        EnumItem enumItem = new EnumItem();
        enumItem.setName("v11");
        enumItem.setLabel(TranslatableContent.build("en", "v11"));
        allowedValues.add(enumItem);
        s1.setAllowedValues(allowedValues);

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

        gameModelFacade.reset(gameModel1.getId());
        gameModelFacade.reset(gameModel2.getId());

        logger.debug(Helper.printGameModel(gameModelFacade.find(model.getId())));
        logger.debug(Helper.printGameModel(gameModelFacade.find(gameModel1.getId())));
        logger.debug(Helper.printGameModel(gameModelFacade.find(gameModel2.getId())));

        logger.info("aNumberHistory : {} {}",
            ((NumberDescriptor) getDescriptor(gameModel1, "aNumber")).getDefaultInstance().getHistory(),
            ((NumberDescriptor) getDescriptor(gameModel2, "aNumber")).getDefaultInstance().getHistory());

        List<EnumItem> allowedValues1 = ((StringDescriptor) getDescriptor(gameModel1, "aString")).getAllowedValues();
        List<EnumItem> allowedValues2 = ((StringDescriptor) getDescriptor(gameModel2, "aString")).getAllowedValues();

        allowedValues1.size();
        allowedValues2.size();
        logger.info("aStringEnum : {} {}", allowedValues1, allowedValues2);

        Map<String, String> properties;
        properties = ((ObjectDescriptor) getDescriptor(gameModel1, "aSet")).getProperties();
        Assertions.assertEquals("value0.1", properties.get("prop0"));
        Assertions.assertEquals("value1.1", properties.get("prop1"));
        Assertions.assertEquals("value2.1", properties.get("prop2"));

        properties = ((ObjectDescriptor) getDescriptor(gameModel1, "aSet")).getDefaultInstance().getProperties();

        Assertions.assertEquals("value0.1", properties.get("prop0"));
        Assertions.assertEquals("value1.1", properties.get("prop1"));
        Assertions.assertEquals("value2.1", properties.get("prop2"));

        properties = ((ObjectDescriptor) getDescriptor(gameModel2, "aSet")).getProperties();
        Assertions.assertEquals("value0", properties.get("prop0"));
        Assertions.assertEquals("value1.0", properties.get("prop1"));

        properties = ((ObjectDescriptor) getDescriptor(gameModel2, "aSet")).getDefaultInstance().getProperties();
        Assertions.assertEquals("value0", properties.get("prop0"));
        Assertions.assertEquals("value1.0", properties.get("prop1"));

        assertEnumItemsListEquals(((StringDescriptor) getDescriptor(gameModel1, "aString")).getAllowedValues(), "v1", "v11", "v10");
        assertEnumItemsListEquals(((StringDescriptor) getDescriptor(gameModel2, "aString")).getAllowedValues(), "v1", "v10");

        assertListEquals(((NumberDescriptor) getDescriptor(gameModel1, "aNumber")).getDefaultInstance().getHistory(), 1.1, 1.2, 1.3, 1.4, 1.3, 1.2, 1.2, 1.1, 1.0);

        assertListEquals(((NumberDescriptor) getDescriptor(gameModel2, "aNumber")).getDefaultInstance().getHistory(), 1.1, 1.2, 1.3, 1.2, 1.1, 1.0);

        assertListEquals(((NumberInstance) getInstance(gameModel1, "aNumber")).getHistory(), 1.1, 1.2, 1.3, 1.4, 1.3, 1.2, 1.2, 1.1, 1.0);

        logger.info("DONE");
    }

    @Test
    public void testModelise_changeDirectoryVisibility() throws NamingException, WegasNoResultException, IOException, RepositoryException {
        GameModel gameModel1 = new GameModel();
        gameModel1.setName("gamemodel #1");
        gameModelFacade.createWithDebugGame(gameModel1);

        GameModel gameModel2 = new GameModel();
        gameModel2.setName("gamemodel #2");
        gameModelFacade.createWithDebugGame(gameModel2);

        ListDescriptor list1_1 = wegasFactory.createList(gameModel1, null, "myFirstFolder", "My First Folder");
        //                                           N,   L,  Min, Max,   Def, History...
        wegasFactory.createNumberDescriptor(gameModel1, list1_1, "x", "X", Visibility.PRIVATE, 0.0, 100.0, 1.0, 1.0, 1.1);

        ListDescriptor list1_2 = wegasFactory.createList(gameModel2, null, "myFirstFolder", "My First Folder");
        wegasFactory.createNumberDescriptor(gameModel2, list1_2, "x", "LABEL X", Visibility.PRIVATE, 0.0, 100.0, 1.0, 1.0, 1.1);

        gameModel1 = gameModelFacade.find(gameModel1.getId());
        gameModel2 = gameModelFacade.find(gameModel2.getId());

        List<GameModel> scenarios = new ArrayList<>();

        scenarios.add(gameModel1);
        scenarios.add(gameModel2);

        logger.info("Create Model");
        GameModel model = modelFacade.createModelFromCommonContent("model", scenarios);
        modelFacade.propagateModel(model.getId());

        /*
         * Add y to gameModel2 list1_2
         */
        wegasFactory.createNumberDescriptor(gameModel2, list1_2, "y", "LABEL Y", Visibility.PRIVATE, 0.0, 100.0, 2.0, 2.0, 2.1);

        logger.info("MyFirstFolder becomes INTERNAL");
        VariableDescriptor modelList = getDescriptor(model, "myFirstFolder");
        modelList.setVisibility(Visibility.INTERNAL);
        variableDescriptorFacade.update(modelList.getId(), modelList);

        model = modelFacade.propagateModel(model.getId());

        gameModel1 = gameModelFacade.find(gameModel1.getId());
        gameModel2 = gameModelFacade.find(gameModel2.getId());

        Assertions.assertEquals(1, model.getChildVariableDescriptors().size(), "model #rootdescriptors fails"); // the list
        Assertions.assertEquals(2, model.getVariableDescriptors().size(), "model #descriptors fails"); //the list + x

        Assertions.assertEquals(1, gameModel1.getChildVariableDescriptors().size(), "gameModel1 #rootdescriptors fails"); // the list
        Assertions.assertEquals(2, gameModel1.getVariableDescriptors().size(), "gameModel1 #descriptors fails"); // the list + x

        Assertions.assertEquals(1, gameModel2.getChildVariableDescriptors().size(), "gameModel2 #rootdescriptors fails"); //the list
        Assertions.assertEquals(3, gameModel2.getVariableDescriptors().size(), "gameModel2 #descriptors fails"); //the list + x + y

        logger.info("MyFirstFolder becomes PRIVATE");
        modelList = getDescriptor(model, "myFirstFolder");
        modelList.setVisibility(Visibility.PRIVATE);
        variableDescriptorFacade.update(modelList.getId(), modelList);

        model = modelFacade.propagateModel(model.getId());

        gameModel1 = gameModelFacade.find(gameModel1.getId());
        gameModel2 = gameModelFacade.find(gameModel2.getId());

        Assertions.assertEquals(1, model.getChildVariableDescriptors().size(), "model #rootdescriptors fails"); // the list
        Assertions.assertEquals(2, model.getVariableDescriptors().size(), "model #descriptors fails"); //the list + x

        Assertions.assertEquals(0, gameModel1.getChildVariableDescriptors().size(), "gameModel1 #rootdescriptors fails"); // none

        Assertions.assertEquals(1, gameModel2.getChildVariableDescriptors().size(), "gameModel2 #rootdescriptors fails"); //the substitute list
        Assertions.assertEquals(2, gameModel2.getVariableDescriptors().size(), "gameModel2 #descriptors fails"); //the list + y

    }

    @Test
    public void testModelise_variableNamesUniqueness() throws NamingException, WegasNoResultException, IOException, RepositoryException {
        GameModel gameModel1 = new GameModel();
        gameModel1.setName("gamemodel #1");
        gameModelFacade.createWithDebugGame(gameModel1);

        GameModel gameModel2 = new GameModel();
        gameModel2.setName("gamemodel #2");
        gameModelFacade.createWithDebugGame(gameModel2);

        gameModel1 = gameModelFacade.find(gameModel1.getId());
        gameModel2 = gameModelFacade.find(gameModel2.getId());

        List<GameModel> scenarios = new ArrayList<>();

        scenarios.add(gameModel1);
        scenarios.add(gameModel2);

        logger.info("Create Model");
        GameModel model = modelFacade.createModelFromCommonContent("model", scenarios);
        model = modelFacade.propagateModel(model.getId());

        // x in model
        NumberDescriptor xModel = wegasFactory.createNumberDescriptor(model, null, "x", "LABEL X", Visibility.PRIVATE, 0.0, 100.0, 1.0, 1.0, 1.1);
        Assertions.assertEquals("x", xModel.getName(), "XModel name does not match");

        // x in scenarios -> renamed
        NumberDescriptor x1 = wegasFactory.createNumberDescriptor(gameModel1, null, "x", "X", Visibility.PRIVATE, 0.0, 100.0, 1.0, 1.0, 1.1);
        NumberDescriptor x2 = wegasFactory.createNumberDescriptor(gameModel2, null, "x", "X", Visibility.PRIVATE, 0.0, 100.0, 1.0, 1.0, 1.1);
        Assertions.assertNotEquals("x", x1.getName(), "X1 name does not match");
        Assertions.assertNotEquals("x", x2.getName(), "X2 name does not match");

        // y in scenarios
        NumberDescriptor y1 = wegasFactory.createNumberDescriptor(gameModel1, null, "y", "Y", Visibility.PRIVATE, 0.0, 100.0, 1.0, 1.0, 1.1);
        NumberDescriptor y2 = wegasFactory.createNumberDescriptor(gameModel2, null, "y", "Y", Visibility.PRIVATE, 0.0, 100.0, 1.0, 1.0, 1.1);
        Assertions.assertEquals("y", y1.getName(), "Y1 name does not match");
        Assertions.assertEquals("y", y2.getName(), "Y2 name does not match");

        // y in model -> renamed
        NumberDescriptor yModel = wegasFactory.createNumberDescriptor(model, null, "y", "Y", Visibility.PRIVATE, 0.0, 100.0, 1.0, 1.0, 1.1);
        Assertions.assertNotEquals("y", yModel.getName(), "YModel name does not match");
    }

    @Test
    public void testModelise_duplicateDescriptor() throws NamingException, WegasNoResultException, IOException, RepositoryException, CloneNotSupportedException {
        GameModel gameModel1 = new GameModel();
        gameModel1.setName("gamemodel #1");
        gameModelFacade.createWithDebugGame(gameModel1);

        GameModel gameModel2 = new GameModel();
        gameModel2.setName("gamemodel #2");
        gameModelFacade.createWithDebugGame(gameModel2);

        ListDescriptor list1_1 = wegasFactory.createList(gameModel1, null, "aFolder", "a folder");
        wegasFactory.createNumberDescriptor(gameModel1, list1_1, "x", "X", Visibility.PRIVATE, 0.0, 100.0, 1.0, 1.0, 1.1);

        ListDescriptor list1_2 = wegasFactory.createList(gameModel2, null, "aFolder", "a folder");
        wegasFactory.createNumberDescriptor(gameModel2, list1_2, "x", "LABEL X", Visibility.PRIVATE, 0.0, 100.0, 1.0, 1.0, 1.1);

        gameModel1 = gameModelFacade.find(gameModel1.getId());
        gameModel2 = gameModelFacade.find(gameModel2.getId());

        List<GameModel> scenarios = new ArrayList<>();

        scenarios.add(gameModel1);
        scenarios.add(gameModel2);

        logger.info("Create Model");
        GameModel model = modelFacade.createModelFromCommonContent("model", scenarios);
        VariableDescriptor xModel = getDescriptor(model, "x");
        xModel.setLabel(TranslatableContent.build("en", "New Label for x"));
        variableDescriptorFacade.update(xModel.getId(), xModel);
        modelFacade.propagateModel(model.getId());

        VariableDescriptor x2Model = variableDescriptorFacade.duplicate(xModel.getId());
        String x2Name = x2Model.getName();
        Assertions.assertNotEquals(xModel.getRefId(), x2Model.getRefId(), "X and X2 have same refid");

        // propagate x2 to scenarios
        modelFacade.propagateModel(model.getId());

        Assertions.assertNotNull(getDescriptor(model, x2Name), "X2 does not exist in the model");
        Assertions.assertNotNull(getDescriptor(gameModel1, x2Name), "X2 does not exist in scenario1");
        Assertions.assertNotNull(getDescriptor(gameModel2, x2Name), "X2 does not exist in scenario2");

        Assertions.assertEquals(Visibility.INHERITED, getDescriptor(model, x2Name).getVisibility());
        Assertions.assertEquals(Visibility.INHERITED, getDescriptor(gameModel1, x2Name).getVisibility());
        Assertions.assertEquals(Visibility.INHERITED, getDescriptor(gameModel2, x2Name).getVisibility());

        // duplcate X in model -> numberDescriptor_??????
        VariableDescriptor x3 = variableDescriptorFacade.duplicate(xModel.getId());
        String x3Name = x3.getName();

        Assertions.assertNotNull(getDescriptor(model, x3Name), "X3 does not exist in the model");
        Assertions.assertNull(getDescriptor(gameModel1, x3Name), "X3 already exists in scenario1");
        Assertions.assertNull(getDescriptor(gameModel2, x3Name), "X3 already exists in scenario2");

        Assertions.assertEquals(Visibility.INHERITED, getDescriptor(model, x3Name).getVisibility());

        // duplcate X in gm1 -> numberDescriptor_??????
        VariableDescriptor x4 = variableDescriptorFacade.duplicate(getDescriptor(gameModel1, "x").getId());
        String x4Name = x4.getName();
        Assertions.assertNotNull(getDescriptor(gameModel1, x4Name), "X4 does not exist in scenario1");
        Assertions.assertEquals(Visibility.PRIVATE, getDescriptor(gameModel1, x4Name).getVisibility());

        modelFacade.propagateModel(model.getId());
        Assertions.assertNotNull(getDescriptor(model, x3Name), "X3 does not exist in the model");
        Assertions.assertNotNull(getDescriptor(gameModel1, x3Name), "X3 does not exist in scenario1");
        Assertions.assertNotNull(getDescriptor(gameModel2, x3Name), "X3 does not exist in scenario3");

        Assertions.assertEquals(Visibility.INHERITED, getDescriptor(gameModel1, x3Name).getVisibility());
        Assertions.assertEquals(Visibility.INHERITED, getDescriptor(gameModel2, x3Name).getVisibility());
    }

    @Test
    public void testModelise_duplicateModel() throws NamingException, WegasNoResultException, IOException, RepositoryException, CloneNotSupportedException {
        GameModel gameModel1 = new GameModel();
        gameModel1.setName("gamemodel #1");
        gameModelFacade.createWithDebugGame(gameModel1);

        GameModel gameModel2 = new GameModel();
        gameModel2.setName("gamemodel #2");
        gameModelFacade.createWithDebugGame(gameModel2);

        ListDescriptor list1_1 = wegasFactory.createList(gameModel1, null, "myFirstFolder", "My First Folder");
        //                                           N,   L,  Min, Max,   Def, History...
        wegasFactory.createNumberDescriptor(gameModel1, list1_1, "x", "X", Visibility.PRIVATE, 0.0, 100.0, 1.0, 1.0, 1.1);

        ListDescriptor list1_2 = wegasFactory.createList(gameModel2, null, "myFirstFolder", "My First Folder");
        wegasFactory.createNumberDescriptor(gameModel2, list1_2, "x", "LABEL X", Visibility.PRIVATE, 0.0, 100.0, 1.0, 1.0, 1.1);

        gameModel1 = gameModelFacade.find(gameModel1.getId());
        gameModel2 = gameModelFacade.find(gameModel2.getId());

        List<GameModel> scenarios = new ArrayList<>();

        scenarios.add(gameModel1);
        scenarios.add(gameModel2);

        logger.info("Create Model");
        GameModel model = modelFacade.createModelFromCommonContent("model", scenarios);
        modelFacade.propagateModel(model.getId());

        ListDescriptor modelList = (ListDescriptor) getDescriptor(model, "myFirstFolder");
        wegasFactory.createNumberDescriptor(model, modelList, "yMod", "LABEL Y", Visibility.PRIVATE, 0.0, 100.0, 1.0, 1.0, 1.1);

        // Model: list: x y
        // Gm1&2: list/x
        // new model based on model
        // exact copy, including private content
        GameModel newModel = gameModelFacade.createModel(model.getId());

        Assertions.assertNotNull(getDescriptor(newModel, "myFirstFolder"), "MyFirstFolder does not exist in the new model");
        Assertions.assertNotNull(getDescriptor(newModel, "x"), "x does not exist in the new model");
        Assertions.assertNotNull(getDescriptor(newModel, "yMod"), "yMod does not exist in the new model");

        // new scenario based on the model (do not include nmodel private content)
        GameModel newScenario_model = gameModelFacade.createScenario(model.getId());

        Assertions.assertNotNull(getDescriptor(newScenario_model, "myFirstFolder"), "MyFirstFolder does not exist in the new model");
        Assertions.assertNotNull(getDescriptor(newScenario_model, "x"), "x does not exist in the new model");
        Assertions.assertNull(getDescriptor(newScenario_model, "yMod"), "yMod exist in the new model");

        // new scenario based on a scenario (should include src scenario private content)
        ListDescriptor gm1List = (ListDescriptor) getDescriptor(gameModel1, "myFirstFolder");
        wegasFactory.createNumberDescriptor(gameModel1, gm1List, "yGm1", "LABEL Y", Visibility.PRIVATE, 0.0, 100.0, 1.0, 1.0, 1.1);

        GameModel newScenario_scen = gameModelFacade.createScenario(gameModel1.getId());
        Assertions.assertNotNull(getDescriptor(newScenario_scen, "myFirstFolder"), "MyFirstFolder does not exist in the new model");
        Assertions.assertNotNull(getDescriptor(newScenario_scen, "x"), "x does not exist in the new model");
        Assertions.assertNull(getDescriptor(newScenario_scen, "yMod"), "yMod exist in the new model");
        Assertions.assertNotNull(getDescriptor(newScenario_scen, "yGm1"), "yGm1 does not exist in the new model");
    }

    @Test
    public void testModelise_deleteDirectory() throws NamingException, WegasNoResultException, IOException, RepositoryException {
        GameModel gameModel1 = new GameModel();
        gameModel1.setName("gamemodel #1");
        gameModelFacade.createWithDebugGame(gameModel1);

        GameModel gameModel2 = new GameModel();
        gameModel2.setName("gamemodel #2");
        gameModelFacade.createWithDebugGame(gameModel2);

        ListDescriptor list1_1 = wegasFactory.createList(gameModel1, null, "myFirstFolder", "My First Folder");
        //                                           N,   L,  Min, Max,   Def, History...
        wegasFactory.createNumberDescriptor(gameModel1, list1_1, "x", "X", Visibility.PRIVATE, 0.0, 100.0, 1.0, 1.0, 1.1);

        ListDescriptor list1_2 = wegasFactory.createList(gameModel2, null, "myFirstFolder", "My First Folder");
        wegasFactory.createNumberDescriptor(gameModel2, list1_2, "x", "LABEL X", Visibility.PRIVATE, 0.0, 100.0, 1.0, 1.0, 1.1);

        gameModel1 = gameModelFacade.find(gameModel1.getId());
        gameModel2 = gameModelFacade.find(gameModel2.getId());

        List<GameModel> scenarios = new ArrayList<>();

        scenarios.add(gameModel1);
        scenarios.add(gameModel2);

        logger.info("Create Model");
        GameModel model = modelFacade.createModelFromCommonContent("model", scenarios);
        modelFacade.propagateModel(model.getId());

        /*
         * Add y to gameModel2 list1_2
         */
        wegasFactory.createNumberDescriptor(gameModel2, list1_2, "y", "LABEL Y", Visibility.PRIVATE, 0.0, 100.0, 2.0, 2.0, 2.1);

        logger.info("DeleteMyFirstFolder");
        variableDescriptorFacade.remove(variableDescriptorFacade.find(model, "myFirstFolder").getId());

        logger.error(Helper.printGameModel(model));
        logger.error(Helper.printGameModel(gameModel1));
        logger.error(Helper.printGameModel(gameModel2));

        model = modelFacade.propagateModel(model.getId());

        gameModel1 = gameModelFacade.find(gameModel1.getId());
        gameModel2 = gameModelFacade.find(gameModel2.getId());

        logger.info("here we are");

        Assertions.assertEquals(0, model.getChildVariableDescriptors().size(), "model #descriptors fails");
        Assertions.assertEquals(0, gameModel1.getChildVariableDescriptors().size(), "gameModel1 #descriptors fails");
        Assertions.assertEquals(1, gameModel2.getChildVariableDescriptors().size(), "gameModel2 #descriptors fails");

        Assertions.assertEquals("My First Folder", gameModel2.getChildVariableDescriptors().get(0).getLabel().translateOrEmpty(gameModel2), "gameModel2 substitute folder label does not match");

        Assertions.assertNotNull(getDescriptor(gameModel2, "y"), "Y does not exists any longer in gameModel2");
    }

    @Test
    public void testModelise() throws NamingException, WegasNoResultException, IOException, RepositoryException {
        GameModel gameModel1 = new GameModel();
        gameModel1.setName("gamemodel #1");
        gameModelFacade.createWithDebugGame(gameModel1);

        GameModel gameModel2 = new GameModel();
        gameModel2.setName("gamemodel #2");
        gameModelFacade.createWithDebugGame(gameModel2);

        GameModel gameModel3 = new GameModel();
        gameModel3.setName("gamemodel #3");
        gameModelFacade.createWithDebugGame(gameModel3);

        ListDescriptor list1_1 = wegasFactory.createList(gameModel1, null, "MyFirstFolder", "My First Folder");
        //                                           N,   L,  Min, Max,   Def, History...
        wegasFactory.createNumberDescriptor(gameModel1, list1_1, "x", "X", Visibility.PRIVATE, 0.0, 100.0, 1.0, 1.0, 1.1);
        wegasFactory.createNumberDescriptor(gameModel1, list1_1, "y", "Y", Visibility.PRIVATE, 0.0, 100.0, 2.0, 2.0, 2.1);
        wegasFactory.createNumberDescriptor(gameModel1, list1_1, "z", "Z", Visibility.PRIVATE, 0.0, 100.0, 3.0, 3.0, 3.1);
        wegasFactory.createNumberDescriptor(gameModel1, list1_1, "t", "T", Visibility.PRIVATE, 0.0, 100.0, 4.0, 4.0, 4.1);

        ListDescriptor list1_2 = wegasFactory.createList(gameModel2, null, "MyFirstFolder", "My First Folder");
        wegasFactory.createNumberDescriptor(gameModel2, list1_2, "x", "LABEL X", Visibility.PRIVATE, 0.0, 100.0, 1.0, 1.0, 1.1);
        wegasFactory.createNumberDescriptor(gameModel2, list1_2, "y", "LABEL Y", Visibility.PRIVATE, 0.0, 100.0, 2.0, 2.0, 2.1);
        wegasFactory.createNumberDescriptor(gameModel2, list1_2, "z", "LABEL Z", Visibility.PRIVATE, 0.0, 100.0, 3.0, 3.0, 3.1);
        wegasFactory.createNumberDescriptor(gameModel2, list1_2, "t", "LABEL T", Visibility.PRIVATE, 0.0, 100.0, 4.0, 4.0, 4.1);

        wegasFactory.createNumberDescriptor(gameModel3, null, "x", "LBL X", Visibility.PRIVATE, -100.0, 100.0, 1.5, 1.1, 1.2);
        wegasFactory.createNumberDescriptor(gameModel3, null, "y", "LBL Y", Visibility.PRIVATE, -100.0, 100.0, 2.5, 2.1, 2.2);
        wegasFactory.createNumberDescriptor(gameModel3, null, "z", "LBL Z", Visibility.PRIVATE, -100.0, 100.0, 3.5, 3.1, 3.2);
        wegasFactory.createNumberDescriptor(gameModel3, null, "t", "LBL T", Visibility.PRIVATE, -100.0, 100.0, 4.5, 4.1, 4.2);

        gameModel1 = gameModelFacade.find(gameModel1.getId());
        gameModel2 = gameModelFacade.find(gameModel2.getId());
        gameModel3 = gameModelFacade.find(gameModel3.getId());

        List<GameModel> scenarios = new ArrayList<>();

        scenarios.add(gameModel1);
        scenarios.add(gameModel2);
        scenarios.add(gameModel3);

        logger.info("Create Model");
        GameModel model = modelFacade.createModelFromCommonContent("model", scenarios);
        modelFacade.propagateModel(model.getId());

        List<VariableDescriptor> children = new ArrayList<>();
        children.addAll(model.getChildVariableDescriptors());

        logger.info("Update Visibilities");
        while (children.size() > 0) {
            VariableDescriptor vd = children.remove(0);
            switch (vd.getName()) {
                case "x":
                    vd.setVisibility(Visibility.INTERNAL);
                    break;
                case "y":
                    vd.setVisibility(Visibility.PROTECTED);
                    break;
                case "z":
                    vd.setVisibility(Visibility.INHERITED);
                    break;
                case "t":
                    vd.setVisibility(Visibility.PRIVATE);
                    break;
                default:
                    vd.setVisibility(Visibility.INHERITED);
            }

            variableDescriptorFacade.update(vd.getId(), vd);

            logger.info("Vd {} -> {}", vd, vd.getVisibility());
            if (vd instanceof DescriptorListI) {
                children.addAll(((DescriptorListI) vd).getItems());
            }
        }

        logger.info("Initial Model Propagation");
        model = modelFacade.propagateModel(model.getId());
        gameModelFacade.reset(gameModel1.getId());
        gameModelFacade.reset(gameModel2.getId());
        gameModelFacade.reset(gameModel3.getId());

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

        Assertions.assertEquals("X", xi1.findDescriptor().getLabel().translateOrEmpty(gameModel1));
        Assertions.assertEquals("X", xi2.findDescriptor().getLabel().translateOrEmpty(gameModel2));
        Assertions.assertEquals("X", xi3.findDescriptor().getLabel().translateOrEmpty(gameModel3));
        Assertions.assertEquals(1.0, xi1.getValue(), 0.00001);
        Assertions.assertEquals(1.0, xi2.getValue(), 0.00001);
        Assertions.assertEquals(1.0, xi3.getValue(), 0.00001);


        /*
         * Y: model override descriptor but update defaultinstance
         */
        yi1 = (NumberInstance) getInstance(gameModel1, "y");
        yi2 = (NumberInstance) getInstance(gameModel2, "y");
        yi3 = (NumberInstance) getInstance(gameModel3, "y");

        Assertions.assertEquals("Y", yi1.findDescriptor().getLabel().translateOrEmpty(gameModel1));
        Assertions.assertEquals("Y", yi2.findDescriptor().getLabel().translateOrEmpty(gameModel2));
        Assertions.assertEquals("Y", yi3.findDescriptor().getLabel().translateOrEmpty(gameModel3));
        Assertions.assertEquals(2.0, yi1.getValue(), 0.00001);
        Assertions.assertEquals(2.0, yi2.getValue(), 0.00001);
        Assertions.assertEquals(2.5, yi3.getValue(), 0.00001);


        /*
         * Z: model update descriptor and defaultinstance
         */
        zi1 = (NumberInstance) getInstance(gameModel1, "z");
        zi2 = (NumberInstance) getInstance(gameModel2, "z");
        zi3 = (NumberInstance) getInstance(gameModel3, "z");

        logger.error("Z {} history {}", zi1, zi1.getHistory());
        logger.error("Z {} history {}", zi2, zi2.getHistory());
        logger.error("Z {} history {}", zi3, zi3.getHistory());

        Assertions.assertEquals("Z", zi1.findDescriptor().getLabel().translateOrEmpty(gameModel1));
        Assertions.assertEquals("LABEL Z", zi2.findDescriptor().getLabel().translateOrEmpty(gameModel2));
        Assertions.assertEquals("LBL Z", zi3.findDescriptor().getLabel().translateOrEmpty(gameModel3));
        Assertions.assertEquals(3.0, zi1.getValue(), 0.00001);
        Assertions.assertEquals(3.0, zi2.getValue(), 0.00001);
        Assertions.assertEquals(3.5, zi3.getValue(), 0.00001);

        // Update model
        NumberDescriptor xModel = (NumberDescriptor) variableDescriptorFacade.find(model, "x");
        NumberDescriptor yModel = (NumberDescriptor) variableDescriptorFacade.find(model, "y");
        NumberDescriptor zModel = (NumberDescriptor) variableDescriptorFacade.find(model, "z");

        xModel.setLabel(TranslatableContent.build("en", "my X"));
        xModel.getDefaultInstance().setValue(11.0);
        variableDescriptorFacade.update(xModel.getId(), xModel);

        yModel.setLabel(TranslatableContent.build("en", "my Y"));
        yModel.getDefaultInstance().setValue(12.0);
        variableDescriptorFacade.update(yModel.getId(), yModel);

        zModel.setLabel(TranslatableContent.build("en", "my Z"));
        zModel.getDefaultInstance().setValue(13.0);
        zModel.getDefaultInstance().getHistory().add(13.0);
        variableDescriptorFacade.update(zModel.getId(), zModel);

        logger.info("Propagate Model Update");
        modelFacade.propagateModel(model.getId());

        gameModelFacade.reset(gameModel1.getId());
        gameModelFacade.reset(gameModel2.getId());
        gameModelFacade.reset(gameModel3.getId());

        /*
         * X: Model override scenarios
         */
        xi1 = (NumberInstance) getInstance(gameModel1, "x");
        xi2 = (NumberInstance) getInstance(gameModel2, "x");
        xi3 = (NumberInstance) getInstance(gameModel3, "x");

        Assertions.assertEquals("my X", xi1.findDescriptor().getLabel().translateOrEmpty(gameModel1));
        Assertions.assertEquals("my X", xi2.findDescriptor().getLabel().translateOrEmpty(gameModel2));
        Assertions.assertEquals("my X", xi3.findDescriptor().getLabel().translateOrEmpty(gameModel3));
        Assertions.assertEquals(11.0, xi1.getValue(), 0.00001);
        Assertions.assertEquals(11.0, xi2.getValue(), 0.00001);
        Assertions.assertEquals(11.0, xi3.getValue(), 0.00001);


        /*
         * Y: model override descriptor but update defaultinstance
         */
        yi1 = (NumberInstance) getInstance(gameModel1, "y");
        yi2 = (NumberInstance) getInstance(gameModel2, "y");
        yi3 = (NumberInstance) getInstance(gameModel3, "y");

        Assertions.assertEquals("my Y", yi1.findDescriptor().getLabel().translateOrEmpty(gameModel1));
        Assertions.assertEquals("my Y", yi2.findDescriptor().getLabel().translateOrEmpty(gameModel2));
        Assertions.assertEquals("my Y", yi3.findDescriptor().getLabel().translateOrEmpty(gameModel3));
        Assertions.assertEquals(12.0, yi1.getValue(), 0.00001);
        Assertions.assertEquals(12.0, yi2.getValue(), 0.00001);
        Assertions.assertEquals(2.5, yi3.getValue(), 0.00001);


        /*
         * Z: model update descriptor and defaultinstance
         */
        zi1 = (NumberInstance) getInstance(gameModel1, "z");
        zi2 = (NumberInstance) getInstance(gameModel2, "z");
        zi3 = (NumberInstance) getInstance(gameModel3, "z");

        logger.error("Z {} history {}", zi1, zi1.getHistory());
        logger.error("Z {} history {}", zi2, zi2.getHistory());
        logger.error("Z {} history {}", zi3, zi3.getHistory());

        Assertions.assertEquals("my Z", zi1.findDescriptor().getLabel().translateOrEmpty(gameModel1));
        Assertions.assertEquals("LABEL Z", zi2.findDescriptor().getLabel().translateOrEmpty(gameModel2));
        Assertions.assertEquals("LBL Z", zi3.findDescriptor().getLabel().translateOrEmpty(gameModel3));
        Assertions.assertEquals(13.0, zi1.getValue(), 0.00001);
        Assertions.assertEquals(13.0, zi2.getValue(), 0.00001);
        Assertions.assertEquals(3.5, zi3.getValue(), 0.00001);

        /**
         * Create new descriptors in model
         */
        ListDescriptor folder = (ListDescriptor) getDescriptor(model, "myFirstFolder");
        wegasFactory.createNumberDescriptor(model, folder, "alpha", "α", Visibility.PROTECTED, -1.0, +1.0, 0.666, 0.0, 0.333);
        wegasFactory.createNumberDescriptor(model, null, "pi", "π", Visibility.INHERITED, null, null, 3.14);

        /**
         * Switch to 2D and move x to root level
         */
        variableDescriptorFacade.remove(getDescriptor(model, "z").getId());
        variableDescriptorFacade.move(getDescriptor(model, "x").getId(), 0);

        logger.info("Propagate Model: Create Alpha &Pi; Remove Z and move X");
        modelFacade.propagateModel(model.getId());

        gameModelFacade.reset(gameModel1.getId());
        gameModelFacade.reset(gameModel2.getId());
        gameModelFacade.reset(gameModel3.getId());

        /**
         * Assert new descriptor stand in the correct folder
         */
        Assertions.assertEquals(getDescriptor(gameModel1, "myFirstFolder"), getDescriptor(gameModel1, "alpha").getParentList());
        Assertions.assertEquals(getDescriptor(gameModel2, "myFirstFolder"), getDescriptor(gameModel2, "alpha").getParentList());
        Assertions.assertEquals(getDescriptor(gameModel3, "myFirstFolder"), getDescriptor(gameModel3, "alpha").getParentList());

        Assertions.assertEquals(gameModel1, getDescriptor(gameModel1, "pi").getRoot());
        Assertions.assertEquals(gameModel2, getDescriptor(gameModel2, "pi").getRoot());
        Assertions.assertEquals(gameModel3, getDescriptor(gameModel3, "pi").getRoot());

        /**
         * Assert z no longer exists
         */
        Assertions.assertNull(getDescriptor(gameModel1, "z"));
        Assertions.assertNull(getDescriptor(gameModel2, "z"));
        Assertions.assertNull(getDescriptor(gameModel3, "z"));

        /**
         * Assert x stands at root level
         */
        Assertions.assertEquals(gameModel1, getDescriptor(gameModel1, "x").getRoot());
        Assertions.assertEquals(gameModel2, getDescriptor(gameModel2, "x").getRoot());
        Assertions.assertEquals(gameModel3, getDescriptor(gameModel3, "x").getRoot());

        Assertions.assertNull(getDescriptor(gameModel1, "x").getParentList());
        Assertions.assertNull(getDescriptor(gameModel2, "x").getParentList());
        Assertions.assertNull(getDescriptor(gameModel3, "x").getParentList());

        /**
         * remove var from root level
         */
        variableDescriptorFacade.remove(getDescriptor(model, "x").getId());
        logger.info("Propagate Model: Remove X");
        modelFacade.propagateModel(model.getId());

        gameModelFacade.reset(gameModel1.getId());
        gameModelFacade.reset(gameModel2.getId());
        gameModelFacade.reset(gameModel3.getId());

        /**
         * Assert x no longer exists
         */
        Assertions.assertNull(getDescriptor(gameModel1, "x"));
        Assertions.assertNull(getDescriptor(gameModel2, "x"));
        Assertions.assertNull(getDescriptor(gameModel3, "x"));

        logger.debug(Helper.printGameModel(gameModelFacade.find(gameModel1.getId())));
        logger.debug(Helper.printGameModel(gameModelFacade.find(gameModel2.getId())));
        logger.debug(Helper.printGameModel(gameModelFacade.find(gameModel3.getId())));

        /**
         * Change Y default value and move to root
         */
        NumberDescriptor y1 = (NumberDescriptor) getDescriptor(model, "y");

        y1.setLabel(TranslatableContent.build("en", "my Y"));
        y1.getDefaultInstance().setValue(22.0);
        variableDescriptorFacade.update(y1.getId(), y1);
        variableDescriptorFacade.move(getDescriptor(model, "y").getId(), 0);

        logger.info("Propagate Model: Update Y.value; move Y to Root");
        modelFacade.propagateModel(model.getId());

        gameModelFacade.reset(gameModel1.getId());
        gameModelFacade.reset(gameModel2.getId());
        gameModelFacade.reset(gameModel3.getId());

        logger.debug(Helper.printGameModel(gameModelFacade.find(gameModel1.getId())));
        logger.debug(Helper.printGameModel(gameModelFacade.find(gameModel2.getId())));
        logger.debug(Helper.printGameModel(gameModelFacade.find(gameModel3.getId())));

        /**
         * Assert y stands at root level
         */
        Assertions.assertEquals(gameModel1, getDescriptor(gameModel1, "y").getRoot());
        Assertions.assertEquals(gameModel2, getDescriptor(gameModel2, "y").getRoot());
        Assertions.assertEquals(gameModel3, getDescriptor(gameModel3, "y").getRoot());

        Assertions.assertNull(getDescriptor(gameModel1, "y").getParentList());
        Assertions.assertNull(getDescriptor(gameModel2, "y").getParentList());
        Assertions.assertNull(getDescriptor(gameModel3, "y").getParentList());

        /*
         * Y: model override descriptor but update defaultinstance
         */
        Assertions.assertEquals(22.0, ((NumberInstance) getInstance(gameModel1, "y")).getValue(), 0.00001);
        Assertions.assertEquals(22.0, ((NumberInstance) getInstance(gameModel2, "y")).getValue(), 0.00001);
        Assertions.assertEquals(2.5, ((NumberInstance) getInstance(gameModel3, "y")).getValue(), 0.00001);

        /* Move alpha to root & delete */
        variableDescriptorFacade.move(getDescriptor(model, "alpha").getId(), 0);
        variableDescriptorFacade.remove(getDescriptor(model, "myFirstFolder").getId());

        logger.info("Propagate Model: Update Y.value; move Y to Root");
        modelFacade.propagateModel(model.getId());

        logger.debug(Helper.printGameModel(gameModelFacade.find(gameModel1.getId())));
        logger.debug(Helper.printGameModel(gameModelFacade.find(gameModel2.getId())));
        logger.debug(Helper.printGameModel(gameModelFacade.find(gameModel3.getId())));

        Assertions.assertNull(getDescriptor(gameModel1, "myFirstFolder"));
        Assertions.assertNull(getDescriptor(gameModel2, "myFirstFolder"));
        Assertions.assertNull(getDescriptor(gameModel3, "myFirstFolder"));

        Assertions.assertEquals(0.666, ((NumberInstance) getInstance(gameModel1, "alpha")).getValue(), 0.00001);
        Assertions.assertEquals(0.666, ((NumberInstance) getInstance(gameModel2, "alpha")).getValue(), 0.00001);
        Assertions.assertEquals(0.666, ((NumberInstance) getInstance(gameModel3, "alpha")).getValue(), 0.00001);

        logger.info("FINI");
    }

    private void checkNumber(GameModel gm, NumberDescriptor nd, Double expectedMin, Double expectedMax, Double expectedValue) throws WegasNoResultException {
        NumberDescriptor desc = (NumberDescriptor) variableDescriptorFacade.find(gm, nd.getName());
        NumberInstance instance = desc.getDefaultInstance();

        Assertions.assertEquals(expectedMin, desc.getMinValue(), 0.01, "Min Value does not match");
        Assertions.assertEquals(expectedMax, desc.getMaxValue(), 0.01, "Max Value does not match");

        Assertions.assertEquals(expectedValue, instance.getValue(), 0.1, "Default value does not match");
    }

    private void updateNumber(GameModel gm, NumberDescriptor desc, Double min, Double max, Double value) throws WegasNoResultException {
        NumberDescriptor nd = (NumberDescriptor) variableDescriptorFacade.find(gm, desc.getName());
        nd.setMinValue(min);
        nd.setMaxValue(max);
        nd.getDefaultInstance().setValue(value);

        variableDescriptorFacade.update(nd.getId(), nd);
    }

    @Test
    public void testItemsOrder() throws RepositoryException, WegasNoResultException, CloneNotSupportedException {
        GameModel model = new GameModel();

        model.setName("The Model");
        model.setType(GameModel.GmType.MODEL);
        gameModelFacade.createWithDebugGame(model);

        ListDescriptor folder = wegasFactory.createList(model, model, "aFolder", "");
        folder.setVisibility(Visibility.INHERITED);
        variableDescriptorFacade.update(folder.getId(), folder);

        NumberDescriptor third = wegasFactory.createNumberDescriptor(model, folder, "third", "third", Visibility.INHERITED, null, null, 3.0);

        modelFacade.propagateModel(model.getId());

        GameModel scenario = gameModelFacade.createScenarioWithDebugGame(model.getId());

        ListDescriptor folder_gm1 = (ListDescriptor) scenario.getChildVariableDescriptors().get(0);
        folder_gm1.getItems();

        Assertions.assertEquals(1, folder_gm1.getItems().size());

        NumberDescriptor second = wegasFactory.createNumberDescriptor(model, folder, "second", "second", Visibility.INHERITED, null, null, 2.0);
        NumberDescriptor first = wegasFactory.createNumberDescriptor(model, folder, "first", "first", Visibility.INHERITED, null, null, 1.0);

        variableDescriptorFacade.move(second.getId(), folder.getId(), 0);
        variableDescriptorFacade.move(first.getId(), folder.getId(), 0);

        modelFacade.propagateModel(model.getId());

        folder_gm1 = (ListDescriptor) variableDescriptorFacade.find(folder_gm1.getId());
        Assertions.assertEquals(3, folder_gm1.getItems().size());

        Assertions.assertEquals("first", folder_gm1.getItems().get(0).getName());
        Assertions.assertEquals("second", folder_gm1.getItems().get(1).getName());
        Assertions.assertEquals("third", folder_gm1.getItems().get(2).getName());

        jpaCacheHelper.clearCacheLocal();

        folder_gm1 = (ListDescriptor) variableDescriptorFacade.find(folder_gm1.getId());
        Assertions.assertEquals(3, folder_gm1.getItems().size());

        Assertions.assertEquals("first", folder_gm1.getItems().get(0).getName());
        Assertions.assertEquals("second", folder_gm1.getItems().get(1).getName());
        Assertions.assertEquals("third", folder_gm1.getItems().get(2).getName());
    }

    @Test
    public void testProtectedNumberDescriptorChange() throws RepositoryException, WegasNoResultException {
        GameModel gameModel1 = new GameModel();
        gameModel1.setName("gamemodel #1");
        gameModelFacade.createWithDebugGame(gameModel1);

        GameModel gameModel2 = new GameModel();
        gameModel2.setName("gamemodel #2");
        gameModelFacade.createWithDebugGame(gameModel2);

        gameModel1 = gameModelFacade.find(gameModel1.getId());
        gameModel2 = gameModelFacade.find(gameModel2.getId());

        List<GameModel> scenarios = new ArrayList<>();

        scenarios.add(gameModel1);
        scenarios.add(gameModel2);

        logger.info("Create Model");
        GameModel model = modelFacade.createModelFromCommonContent("model", scenarios);
        modelFacade.propagateModel(model.getId());

        Double initialMin = -10.0;
        Double initialMax = 10.0;
        Double initialValue = 1.0;

        NumberDescriptor x = wegasFactory.createNumberDescriptor(model, null, "x", "X", Visibility.INTERNAL, initialMin, initialMax, initialValue);
        NumberDescriptor y = wegasFactory.createNumberDescriptor(model, null, "y", "Y", Visibility.PROTECTED, initialMin, initialMax, initialValue);
        NumberDescriptor z = wegasFactory.createNumberDescriptor(model, null, "z", "Z", Visibility.INHERITED, initialMin, initialMax, initialValue);

        checkNumber(model, x, initialMin, initialMax, initialValue);
        checkNumber(model, y, initialMin, initialMax, initialValue);
        checkNumber(model, z, initialMin, initialMax, initialValue);

        /* Propgate x, y and z */
        modelFacade.propagateModel(model.getId());

        /*
         * assert x, y, and z exists
         */
        gameModel1 = gameModelFacade.find(gameModel1.getId());
        gameModel2 = gameModelFacade.find(gameModel2.getId());

        Assertions.assertEquals(3, gameModel1.getChildVariableDescriptors().size(), "number of descriptor does not match for gm1");
        Assertions.assertEquals(3, gameModel2.getChildVariableDescriptors().size(), "number of descriptor does not match for gm2");

        /*
         * verify descriptor order
         */
        Assertions.assertEquals("x", gameModel1.getChildVariableDescriptors().get(0).getName(), "GM1 1st descriptor does no match");
        Assertions.assertEquals("y", gameModel1.getChildVariableDescriptors().get(1).getName(), "GM1 2nd descriptor does no match");
        Assertions.assertEquals("z", gameModel1.getChildVariableDescriptors().get(2).getName(), "GM1 3rd descriptor does no match");

        Assertions.assertEquals("x", gameModel2.getChildVariableDescriptors().get(0).getName(), "GM2 1st descriptor does no match");
        Assertions.assertEquals("y", gameModel2.getChildVariableDescriptors().get(1).getName(), "GM2 2nd descriptor does no match");
        Assertions.assertEquals("z", gameModel2.getChildVariableDescriptors().get(2).getName(), "GM2 3rd descriptor does no match");


        /* create private t in gameModel2 */
        NumberDescriptor t = wegasFactory.createNumberDescriptor(gameModel1, null, "t", "T", Visibility.PRIVATE, initialMin, initialMax, initialValue);

        checkNumber(gameModel1, x, initialMin, initialMax, initialValue);
        checkNumber(gameModel1, y, initialMin, initialMax, initialValue);
        checkNumber(gameModel1, z, initialMin, initialMax, initialValue);
        checkNumber(gameModel1, t, initialMin, initialMax, initialValue);

        Double newMin = -20.0;
        Double newMax = 20.0;
        Double newValue = 2.0;

        updateNumber(gameModel1, x, newMin, newMax, newValue); // INTERNAL: read-only
        updateNumber(gameModel1, y, newMin, newMax, newValue); // PROTECTED: bounds ro, value writable
        updateNumber(gameModel1, z, newMin, newMax, newValue); // INHERITED: writable
        updateNumber(gameModel1, t, newMin, newMax, newValue); // PRIVATE: writable

        checkNumber(gameModel1, x, initialMin, initialMax, initialValue);
        checkNumber(gameModel1, y, initialMin, initialMax, newValue);
        checkNumber(gameModel1, z, newMin, newMax, newValue);
        checkNumber(gameModel1, t, newMin, newMax, newValue);


        /* Update and propagate model */
        Double modelNewMin = -30.0;
        Double modelNewMax = 30.0;
        Double modelNewValue = 3.0;

        updateNumber(model, x, modelNewMin, modelNewMax, modelNewValue);
        updateNumber(model, y, modelNewMin, modelNewMax, modelNewValue);
        updateNumber(model, z, modelNewMin, modelNewMax, modelNewValue);

        checkNumber(model, x, modelNewMin, modelNewMax, modelNewValue);
        checkNumber(model, y, modelNewMin, modelNewMax, modelNewValue);
        checkNumber(model, z, modelNewMin, modelNewMax, modelNewValue);

        modelFacade.propagateModel(model.getId());

        checkNumber(gameModel1, x, modelNewMin, modelNewMax, modelNewValue); // update all
        checkNumber(gameModel1, y, modelNewMin, modelNewMax, newValue); // override bounds but keep default value modification
        checkNumber(gameModel1, z, newMin, newMax, newValue); // should keep scenario modification
        checkNumber(gameModel1, t, newMin, newMax, newValue); // private is private :-\
    }

    @Test
    public void testModelise_GameModelFiles() throws RepositoryException, IOException, IOException {
        GameModel gameModel1 = new GameModel();
        gameModel1.setName("gamemodel #1");

        RepositoryVisitor.ListRepository ls = new RepositoryVisitor.ListRepository(10);

        gameModelFacade.createWithDebugGame(gameModel1);
        jcrFacade.createDirectory(gameModel1.getId(), ContentConnector.WorkspaceType.FILES, "dir1", "/", "first directory", "first directory description");
        jcrFacade.createDirectory(gameModel1.getId(), ContentConnector.WorkspaceType.FILES, "dir11", "/dir1", "first directory child", "first directory description child");
        jcrFacade.createDirectory(gameModel1.getId(), ContentConnector.WorkspaceType.FILES, "dir2", "/", "second directory", "2nd directory description");

        byte[] bin1 = {0, 1, 0, 1};
        InputStream isBin1 = new ByteArrayInputStream(bin1);

        jcrFacade.createFile(gameModel1.getId(), ContentConnector.WorkspaceType.FILES, "binFile1", "/dir1", MediaType.APPLICATION_OCTET_STREAM, "note bin1", "descBin1", isBin1, false);

        GameModel gameModel2 = new GameModel();
        gameModel2.setName("gamemodel #2");
        gameModelFacade.createWithDebugGame(gameModel2);
        jcrFacade.createDirectory(gameModel2.getId(), ContentConnector.WorkspaceType.FILES, "dir1", "/", "first directory", "first directory description");
        jcrFacade.createDirectory(gameModel2.getId(), ContentConnector.WorkspaceType.FILES, "dir3", "/", "third directory", "3rd directory description");

        isBin1 = new ByteArrayInputStream(bin1);
        jcrFacade.createFile(gameModel2.getId(), ContentConnector.WorkspaceType.FILES, "binFile1", "/dir1", MediaType.APPLICATION_OCTET_STREAM, "note bin1", "descBin1", isBin1, false);

        gameModel1 = gameModelFacade.find(gameModel1.getId());
        gameModel2 = gameModelFacade.find(gameModel2.getId());

        ls.visitGameModelFiles(gameModel1);
        ls.visitGameModelFiles(gameModel2);

        List<GameModel> scenarios = new ArrayList<>();

        scenarios.add(gameModel1);
        scenarios.add(gameModel2);

        logger.info("Create Model");
        GameModel model = modelFacade.createModelFromCommonContent("model", scenarios);
        modelFacade.propagateModel(model.getId());

        model = gameModelFacade.find(model.getId());
        gameModel1 = gameModelFacade.find(gameModel1.getId());
        gameModel2 = gameModelFacade.find(gameModel2.getId());

        logger.info("Model initial repository");
        ls.visitGameModelFiles(model);
        logger.info("Scenarios repositories");
        ls.visitGameModelFiles(gameModel1);
        ls.visitGameModelFiles(gameModel2);

        logger.info("Add /dir4 to model");
        jcrFacade.createDirectory(model.getId(), ContentConnector.WorkspaceType.FILES, "dir4", "/", "fourth directory", "4th directory description");

        logger.info("update model /dir/1/binFile1 to 1 2 3 -2 10");
        byte[] update = {1, 2, 3, -2, 10};
        isBin1 = new ByteArrayInputStream(update);
        jcrFacade.createFile(model.getId(), ContentConnector.WorkspaceType.FILES, "binFile1", "/dir1", MediaType.APPLICATION_OCTET_STREAM, "note bin1", "descBin1", isBin1, true);

        logger.info("Model repository before propagation");
        ls.visitGameModelFiles(model);
        logger.info("Scenarios repositories before propagation");
        ls.visitGameModelFiles(gameModel1);
        ls.visitGameModelFiles(gameModel2);

        logger.info("Propagation");
        modelFacade.propagateModel(model.getId());

        logger.info("[AfterPropagation] Model");
        ls.visitGameModelFiles(model);
        logger.info("[AfterPropagation] Scenario");
        ls.visitGameModelFiles(gameModel1);
        ls.visitGameModelFiles(gameModel2);

        Assertions.assertArrayEquals(update,
            jcrFacade.getFileBytes(gameModel1.getId(), ContentConnector.WorkspaceType.FILES, "/dir1/binFile1"));

        Assertions.assertArrayEquals(update,
            jcrFacade.getFileBytes(gameModel2.getId(), ContentConnector.WorkspaceType.FILES, "/dir1/binFile1"));

        logger.info("update gm1 /dir/1/binFile1 to -1 -2 -3 2 10");
        byte[] update1 = {-1, -2, -3, 2, 10};
        isBin1 = new ByteArrayInputStream(update1);
        jcrFacade.createFile(gameModel1.getId(), ContentConnector.WorkspaceType.FILES, "binFile1", "/dir1", MediaType.APPLICATION_OCTET_STREAM, "note bin1", "descBin1", isBin1, true);

        logger.info("Propagation");
        modelFacade.propagateModel(model.getId());

        logger.info("[AfterPropagation] Model");
        ls.visitGameModelFiles(model);
        logger.info("[AfterPropagation] Scenario");
        ls.visitGameModelFiles(gameModel1);
        ls.visitGameModelFiles(gameModel2);

        Assertions.assertArrayEquals(update1,
            jcrFacade.getFileBytes(gameModel1.getId(), ContentConnector.WorkspaceType.FILES, "/dir1/binFile1"));

        Assertions.assertArrayEquals(update,
            jcrFacade.getFileBytes(gameModel2.getId(), ContentConnector.WorkspaceType.FILES, "/dir1/binFile1"));

    }

    private void assertLabelEquals(GameModel gm1, GameModel gm2, String variable) {
        this.assertTranslatableEquals(getDescriptor(gm1, variable).getLabel(), getDescriptor(gm2, variable).getLabel());
    }

    private void assertStringValueEquals(GameModel gm1, GameModel gm2, String variable) {
        this.assertTranslatableEquals(
            ((StringInstance) getDescriptor(gm1, variable).getDefaultInstance()).getTrValue(),
            ((StringInstance) getDescriptor(gm2, variable).getDefaultInstance()).getTrValue());
    }

    private void testLabel(GameModel gm1, GameModel gm2, String variable, String lang, boolean equals) {
        this.assertTranslation(getDescriptor(gm1, variable).getLabel(),
            getDescriptor(gm2, variable).getLabel(),
            lang, equals);
    }

    private void testStringValue(GameModel gm1, GameModel gm2, String variable, String lang, boolean equals) {
        this.assertTranslation(((StringInstance) getDescriptor(gm1, variable).getDefaultInstance()).getTrValue(),
            ((StringInstance) getDescriptor(gm2, variable).getDefaultInstance()).getTrValue(), lang, equals);
    }

    @Test
    public void testModelise_LanguagesNameConflict() throws RepositoryException, IOException, IOException, WegasNoResultException {
        Assertions.assertThrows(WegasErrorMessage.class, () -> {
            GameModel gameModel1 = new GameModel();
            gameModel1.setName("gamemodel #1");
            i18nFacade.createLanguage(gameModel1, "en", "English");
            gameModelFacade.createWithDebugGame(gameModel1);

            GameModel gameModel2 = new GameModel();
            gameModel2.setName("gamemodel #2");
            i18nFacade.createLanguage(gameModel2, "en", "English");
            gameModelFacade.createWithDebugGame(gameModel2);

            GameModel gameModel3 = new GameModel();
            gameModel3.setName("gamemodel #3");
            i18nFacade.createLanguage(gameModel3, "en", "French");
            gameModelFacade.createWithDebugGame(gameModel3);

            gameModel1 = gameModelFacade.find(gameModel1.getId());
            gameModel2 = gameModelFacade.find(gameModel2.getId());
            gameModel3 = gameModelFacade.find(gameModel3.getId());

            List<GameModel> scenarios = new ArrayList<>();

            scenarios.add(gameModel1);
            scenarios.add(gameModel2);
            scenarios.add(gameModel3);

            logger.info("Create Model");
            GameModel model = modelFacade.createModelFromCommonContent("model", scenarios);
        });
    }

    @Test
    public void testModelise_LanguagesIntegration() throws RepositoryException, IOException, IOException, WegasNoResultException {
        Assertions.assertThrows(WegasErrorMessage.class, () -> {
            GameModel gameModel1 = new GameModel();
            gameModel1.setName("gamemodel #1");
            i18nFacade.createLanguage(gameModel1, "en", "English");
            gameModelFacade.createWithDebugGame(gameModel1);

            GameModel gameModel2 = new GameModel();
            gameModel2.setName("gamemodel #2");
            i18nFacade.createLanguage(gameModel2, "en", "English");
            gameModelFacade.createWithDebugGame(gameModel2);

            gameModel1 = gameModelFacade.find(gameModel1.getId());
            gameModel2 = gameModelFacade.find(gameModel2.getId());

            wegasFactory.createString(gameModel1, null, "str", "a string", "a value");
            wegasFactory.createString(gameModel2, null, "str", "a string", "a value");

            List<GameModel> scenarios = new ArrayList<>();

            scenarios.add(gameModel1);
            scenarios.add(gameModel2);

            logger.info("Create Model");
            GameModel model = modelFacade.createModelFromCommonContent("model", scenarios);

            modelFacade.propagateModel(model.getId());

            GameModel gameModel3 = new GameModel();
            gameModel3.setName("gamemodel #3");

            i18nFacade.createLanguage(gameModel3, "def", "English");
            gameModelFacade.createWithDebugGame(gameModel3);
            wegasFactory.createString(gameModel3, null, "str", "a string", "a value");

            gameModel3 = gameModelFacade.find(gameModel3.getId());

            scenarios.clear();
            scenarios.add(gameModel3);
            modelFacade.integrateScenario(model, scenarios);
        });
    }

    @Test
    public void testModelise_Languages() throws RepositoryException, IOException, IOException, WegasNoResultException {
        GameModel gameModel1 = new GameModel();
        gameModel1.setName("gamemodel #1");
        i18nFacade.createLanguage(gameModel1, "en", "English");
        gameModelFacade.createWithDebugGame(gameModel1);

        GameModel gameModel2 = new GameModel();
        gameModel2.setName("gamemodel #2");
        i18nFacade.createLanguage(gameModel2, "fr", "French");
        gameModelFacade.createWithDebugGame(gameModel2);

        GameModel gameModel3 = new GameModel();
        gameModel3.setName("gamemodel #3");
        i18nFacade.createLanguage(gameModel3, "en", "English");
        gameModelFacade.createWithDebugGame(gameModel3);

        wegasFactory.createInbox(gameModel1, null, "inbox", "My Inbox");
        wegasFactory.createInbox(gameModel2, null, "inbox", "Ma boite aux lettres");
        wegasFactory.createInbox(gameModel3, null, "inbox", "My mailbox");

        wegasFactory.createTriggerDescriptor(gameModel1, null, "trigger", "aTrigger", Visibility.INHERITED, "false", "Variable.find(gameModel, \"inbox\").sendMessage(self, {\"@class\":\"TranslatableContent\",\"translations\":{\"en\":\"John\"}}, {\"@class\":\"TranslatableContent\",\"translations\":{\"en\":\"Today\"}}, {\"@class\":\"TranslatableContent\",\"translations\":{\"en\":\"Hello\"}}, {\"@class\":\"TranslatableContent\",\"translations\":{\"en\":\"<p>Hi there</p>\"}}, \"\", []);");
        wegasFactory.createTriggerDescriptor(gameModel2, null, "trigger", "un Trigger", Visibility.INHERITED, "false", "Variable.find(gameModel, \"inbox\").sendMessage(self, {\"@class\":\"TranslatableContent\",\"translations\":{\"fr\":\"Jean\"}}, {\"@class\":\"TranslatableContent\",\"translations\":{\"fr\":\"Aujourd'hui\"}}, {\"@class\":\"TranslatableContent\",\"translations\":{\"fr\":\"Pour dire bonjour\"}}, {\"@class\":\"TranslatableContent\",\"translations\":{\"fr\":\"<p>Bonjour chez vous!</p>\"}}, \"\", []);");
        wegasFactory.createTriggerDescriptor(gameModel3, null, "trigger", "aTrigger", Visibility.INHERITED, "false", "Variable.find(gameModel, \"inbox\").sendMessage(self, {\"@class\":\"TranslatableContent\",\"translations\":{\"en\":\"John\"}}, {\"@class\":\"TranslatableContent\",\"translations\":{\"en\":\"Today\"}}, {\"@class\":\"TranslatableContent\",\"translations\":{\"en\":\"Good Marning\"}}, {\"@class\":\"TranslatableContent\",\"translations\":{\"en\":\"<p>Hi there</p>\"}}, \"\", []);");

        wegasFactory.createString(gameModel1, null, "strModel", "internal string", "internal value");
        wegasFactory.createString(gameModel2, null, "strModel", "chaîne de caractère interne", "valeur interne");
        wegasFactory.createString(gameModel3, null, "strModel", "my internal string", "my value");

        wegasFactory.createString(gameModel1, null, "strProtected", "protected string", "protected value");
        wegasFactory.createString(gameModel2, null, "strProtected", "chaîne de caractère protected", "valeur protegée");
        wegasFactory.createString(gameModel3, null, "strProtected", "my protected string", "my protected value");

        wegasFactory.createString(gameModel1, null, "strInherited", "inherited string", "inherited value");
        wegasFactory.createString(gameModel2, null, "strInherited", "chaîne de caractère héritée", "valeur héritée");
        wegasFactory.createString(gameModel3, null, "strInherited", "my inherited string", "my inherited value");

        wegasFactory.createTriggerDescriptor(gameModel1, null, "setStrModel", "strModel Trigger", Visibility.INHERITED, "false", "Variable.find(gameModel, \"strModel\").setTrValue(self, {\"@class\":\"TranslatableContent\",\"translations\":{\"en\":\"new internal string value\"}});");
        wegasFactory.createTriggerDescriptor(gameModel2, null, "setStrModel", "strModel Trigger", Visibility.INHERITED, "false", "Variable.find(gameModel, \"strModel\").setTrValue(self, {\"@class\":\"TranslatableContent\",\"translations\":{\"fr\":\"nouvelle valeur de chaîne de caractère interne \"}});");
        wegasFactory.createTriggerDescriptor(gameModel3, null, "setStrModel", "strModel Trigger", Visibility.INHERITED, "false", "Variable.find(gameModel, \"strModel\").setTrValue(self, {\"@class\":\"TranslatableContent\",\"translations\":{\"en\":\"my new internal string value\"}});");

        wegasFactory.createTriggerDescriptor(gameModel1, null, "setStrProtected", "strProtected Trigger", Visibility.INHERITED, "false", "Variable.find(gameModel, \"strProtected\").setTrValue(self, {\"@class\":\"TranslatableContent\",\"translations\":{\"en\":\"new protected string value\"}});");
        wegasFactory.createTriggerDescriptor(gameModel2, null, "setStrProtected", "strProtected Trigger", Visibility.INHERITED, "false", "Variable.find(gameModel, \"strProtected\").setTrValue(self, {\"@class\":\"TranslatableContent\",\"translations\":{\"fr\":\"nouvelle valeur de chaîne de caractère protegée\"}});");
        wegasFactory.createTriggerDescriptor(gameModel3, null, "setStrProtected", "strProtected Trigger", Visibility.INHERITED, "false", "Variable.find(gameModel, \"strProtected\").setTrValue(self, {\"@class\":\"TranslatableContent\",\"translations\":{\"en\":\"my new protected string value\"}});");

        wegasFactory.createTriggerDescriptor(gameModel1, null, "setStrInherited", "strInherited Trigger", Visibility.INHERITED, "false", "Variable.find(gameModel, \"strInherited\").setTrValue(self, {\"@class\":\"TranslatableContent\",\"translations\":{\"en\":\"new inherited string value\"}});");
        wegasFactory.createTriggerDescriptor(gameModel2, null, "setStrInherited", "strInherited Trigger", Visibility.INHERITED, "false", "Variable.find(gameModel, \"strInherited\").setTrValue(self, {\"@class\":\"TranslatableContent\",\"translations\":{\"fr\":\"nouvelle valeur de chaîne de caractère héritée\"}});");
        wegasFactory.createTriggerDescriptor(gameModel3, null, "setStrInherited", "strInherited Trigger", Visibility.INHERITED, "false", "Variable.find(gameModel, \"strInherited\").setTrValue(self, {\"@class\":\"TranslatableContent\",\"translations\":{\"en\":\"my new inherited string value\"}});");

        gameModel1 = gameModelFacade.find(gameModel1.getId());
        gameModel2 = gameModelFacade.find(gameModel2.getId());
        gameModel3 = gameModelFacade.find(gameModel3.getId());

        List<GameModel> scenarios = new ArrayList<>();

        scenarios.add(gameModel1);
        scenarios.add(gameModel2);
        scenarios.add(gameModel3);

        //i18nFacade.printTranslations(gameModel1.getId(), "en", "fr");
        //i18nFacade.printTranslations(gameModel2.getId(), "en", "fr");
        //i18nFacade.printTranslations(gameModel3.getId(), "en", "fr");
        logger.info("Create Model");
        GameModel model = modelFacade.createModelFromCommonContent("model", scenarios);

        Assertions.assertNotNull(model.getLanguageByCode("en"), "English is missing in model");
        Assertions.assertNull(model.getLanguageByCode("fr"), "French should not exist in model");

        setDescriptorVisibility(model, "strModel", Visibility.INTERNAL);
        setDescriptorVisibility(model, "strProtected", Visibility.PROTECTED);
        setDescriptorVisibility(model, "strInherited", Visibility.INHERITED);

        setDescriptorVisibility(model, "setStrModel", Visibility.INTERNAL);
        setDescriptorVisibility(model, "setStrProtected", Visibility.PROTECTED);
        setDescriptorVisibility(model, "setStrInherited", Visibility.INHERITED);

        modelFacade.propagateModel(model.getId());

        gameModel1 = gameModelFacade.find(gameModel1.getId());
        gameModel2 = gameModelFacade.find(gameModel2.getId());
        gameModel3 = gameModelFacade.find(gameModel3.getId());

        //i18nFacade.printTranslations(model, "en", "fr");
        //i18nFacade.printTranslations(gameModel1.getId(), "en", "fr");
        //i18nFacade.printTranslations(gameModel2.getId(), "en", "fr");
        //i18nFacade.printTranslations(gameModel3.getId(), "en", "fr");
        Assertions.assertNull(gameModel1.getLanguageByCode("fr"), "French is missing in gameModel1");
        Assertions.assertNotNull(gameModel1.getLanguageByCode("en"), "English is missing in gameModel1");

        Assertions.assertNotNull(gameModel2.getLanguageByCode("fr"), "French is missing in gameModel2");
        Assertions.assertNotNull(gameModel2.getLanguageByCode("en"), "English is missing in gameModel2");

        Assertions.assertNull(gameModel3.getLanguageByCode("fr"), "French is missing in gameModel3");
        Assertions.assertNotNull(gameModel3.getLanguageByCode("en"), "English is missing in gameModel3");

        // assert internal translations have been overriden by model ones
        this.assertLabelEquals(model, gameModel1, "strModel"); // all the same
        this.testLabel(model, gameModel2, "strModel", "en", true); // en is the same
        this.assertTranslationEquals(getDescriptor(gameModel2, "strModel").getLabel(), "fr", "chaîne de caractère interne"); // but g2 contains its french label
        this.assertLabelEquals(model, gameModel3, "strModel"); // all the same

        this.assertStringValueEquals(model, gameModel1, "strModel");
        this.testStringValue(model, gameModel2, "strModel", "en", true);
        this.testStringValue(model, gameModel2, "strModel", "fr", false);
        this.assertStringValueEquals(model, gameModel3, "strModel");

        // assert protected translations
        this.assertLabelEquals(model, gameModel1, "strProtected");
        this.testLabel(model, gameModel2, "strProtected", "en", true); // en is the same
        this.assertTranslationEquals(getDescriptor(gameModel2, "strProtected").getLabel(), "fr", "chaîne de caractère protected"); // but g2 contains its french label
        this.assertLabelEquals(model, gameModel3, "strProtected");

        this.assertStringValueEquals(model, gameModel1, "strProtected");

        this.testStringValue(model, gameModel2, "strProtected", "en", true); //same english value
        this.testStringValue(model, gameModel2, "strProtected", "fr", false); // gm2 has a french one

        // gm3 should have its own english value
        testStringValue(model, gameModel3, "strProtected", "en", false);

        // assert inherited
        this.assertLabelEquals(model, gameModel1, "strInherited");

        this.testLabel(model, gameModel2, "strInherited", "en", true); // en is the same
        this.assertTranslationEquals(getDescriptor(gameModel2, "strInherited").getLabel(), "fr", "chaîne de caractère héritée"); // but g2 contains its french label

        testLabel(model, gameModel3, "strInherited", "en", false);

        this.assertStringValueEquals(model, gameModel1, "strInherited");

        this.testStringValue(model, gameModel2, "strInherited", "en", true);
        this.testStringValue(model, gameModel2, "strInherited", "fr", false);

        // gm3 should have its english value
        //testStringValue(model, gameModel3, "strInherited", "fr", true);
        testStringValue(model, gameModel3, "strInherited", "en", false);

        /**
         * create german in the model * * * * * * * * * * * * * * Will be propagated to all
         * implementations
         */
        i18nFacade.createLanguage(model.getId(), "de", "Deutsch");

        model = gameModelFacade.find(model.getId());

        Assertions.assertNotNull(model.getLanguageByCode("de"), "German is missing in model");

        /**
         * update some english and german translations
         */
        VariableDescriptor descriptor = getDescriptor(model, "strModel");
        descriptor.getLabel().updateTranslation("de", "modelung");
        ((StringInstance) descriptor.getDefaultInstance()).getTrValue().updateTranslation("de", "das neues internal value");
        descriptor.getLabel().updateTranslation("en", "the Model string");
        ((StringInstance) descriptor.getDefaultInstance()).getTrValue().updateTranslation("en", "the new internal value");
        variableDescriptorFacade.update(descriptor.getId(), descriptor);

        descriptor = getDescriptor(model, "strProtected");
        descriptor.getLabel().updateTranslation("de", "protecterung");
        ((StringInstance) descriptor.getDefaultInstance()).getTrValue().updateTranslation("de", "das neues protecterung value");
        descriptor.getLabel().updateTranslation("en", "the protected string");
        ((StringInstance) descriptor.getDefaultInstance()).getTrValue().updateTranslation("en", "the new protected value");
        variableDescriptorFacade.update(descriptor.getId(), descriptor);

        descriptor = getDescriptor(model, "strInherited");
        descriptor.getLabel().updateTranslation("de", "inheriterung");
        ((StringInstance) descriptor.getDefaultInstance()).getTrValue().updateTranslation("de", "das neues inhetiterung value");
        descriptor.getLabel().updateTranslation("en", "the inherited string");
        ((StringInstance) descriptor.getDefaultInstance()).getTrValue().updateTranslation("en", "the new inherited value");
        variableDescriptorFacade.update(descriptor.getId(), descriptor);

        /**
         * Update value in gm2
         */
        descriptor = getDescriptor(gameModel2, "strInherited");
        descriptor.getLabel().updateTranslation("en", "New label for inherited string");
        descriptor.getLabel().updateTranslation("fr", "Nouveau label chaîne hérité");
        ((StringInstance) descriptor.getDefaultInstance()).getTrValue().updateTranslation("en", "new inherited value");
        ((StringInstance) descriptor.getDefaultInstance()).getTrValue().updateTranslation("fr", "nouvelle valeur héritée");
        variableDescriptorFacade.update(descriptor.getId(), descriptor);

        modelFacade.propagateModel(model.getId());

        gameModel1 = gameModelFacade.find(gameModel1.getId());
        gameModel2 = gameModelFacade.find(gameModel2.getId());
        gameModel3 = gameModelFacade.find(gameModel3.getId());

        //i18nFacade.printTranslations(model.getId(), "en", "fr", "de");
        //i18nFacade.printTranslations(gameModel1.getId(), "en", "fr", "de");
        //i18nFacade.printTranslations(gameModel2.getId(), "en", "fr", "de");
        //i18nFacade.printTranslations(gameModel3.getId(), "en", "fr", "de");
        Assertions.assertNotNull(model.getLanguageByCode("de"), "German is missing in model");
        Assertions.assertNotNull(gameModel1.getLanguageByCode("de"), "German is missing in gameModel1");
        Assertions.assertNotNull(gameModel3.getLanguageByCode("de"), "German is missing in gameModel3");
        Assertions.assertNotNull(gameModel3.getLanguageByCode("de"), "German is missing in gameModel3");

        // assert INTERNAL German and English translations have been overriden by model ones
        this.testLabel(model, gameModel1, "strModel", "en", true);
        this.testLabel(model, gameModel2, "strModel", "en", true);
        this.testLabel(model, gameModel3, "strModel", "en", true);
        this.testLabel(model, gameModel1, "strModel", "de", true);
        this.testLabel(model, gameModel2, "strModel", "de", true);
        this.testLabel(model, gameModel3, "strModel", "de", true);

        this.testStringValue(model, gameModel1, "strModel", "en", true);
        this.testStringValue(model, gameModel2, "strModel", "en", true);
        this.testStringValue(model, gameModel2, "strModel", "en", true);
        this.testStringValue(model, gameModel1, "strModel", "de", true);
        this.testStringValue(model, gameModel2, "strModel", "de", true);
        this.testStringValue(model, gameModel2, "strModel", "de", true);

        // assert protected translations
        this.testLabel(model, gameModel1, "strProtected", "en", true);
        this.testLabel(model, gameModel2, "strProtected", "en", true);
        this.testLabel(model, gameModel3, "strProtected", "en", true);
        this.testLabel(model, gameModel1, "strProtected", "de", true);
        this.testLabel(model, gameModel2, "strProtected", "de", true);
        this.testLabel(model, gameModel3, "strProtected", "de", true);

        this.testStringValue(model, gameModel1, "strProtected", "en", true);
        this.testStringValue(model, gameModel2, "strProtected", "en", true);
        this.testStringValue(model, gameModel3, "strProtected", "en", false);
        this.testStringValue(model, gameModel1, "strProtected", "de", true);
        this.testStringValue(model, gameModel2, "strProtected", "de", true);
        this.testStringValue(model, gameModel3, "strProtected", "de", true);

        // assert inherited
        this.testLabel(model, gameModel1, "strInherited", "en", true);
        this.testLabel(model, gameModel2, "strInherited", "en", false);
        this.testLabel(model, gameModel3, "strInherited", "en", false);
        this.testLabel(model, gameModel1, "strInherited", "de", true);
        this.testLabel(model, gameModel2, "strInherited", "de", true);
        this.testLabel(model, gameModel3, "strInherited", "de", true);

        this.testStringValue(model, gameModel1, "strInherited", "en", true);
        this.testStringValue(model, gameModel2, "strInherited", "en", false);
        this.testStringValue(model, gameModel3, "strInherited", "en", false);
        this.testStringValue(model, gameModel1, "strInherited", "de", true);
        this.testStringValue(model, gameModel2, "strInherited", "de", true);
        this.testStringValue(model, gameModel3, "strInherited", "de", true);

        logger.info("Model created");
    }

    private void setDescriptorVisibility(GameModel gameModel, String variableName, Visibility visibility) throws WegasNoResultException {
        VariableDescriptor descriptor = variableDescriptorFacade.find(gameModel, variableName);
        descriptor.setVisibility(visibility);
        variableDescriptorFacade.update(descriptor.getId(), descriptor);
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

        return gameFacade.joinTeam(t.getId(), u.getId(), null);
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
            wegasFactory.createNumberDescriptor(bigGameModel, null, "Number #" + i, "#" + i, Visibility.INHERITED, 0.0, 100.0, 0.0);
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

    @Test
    public void testModelise_StateMachine() throws NamingException, WegasNoResultException, RepositoryException, RepositoryException {
        GameModel gameModel1 = new GameModel();
        gameModel1.setName("gamemodel #1");
        gameModelFacade.createWithDebugGame(gameModel1);

        StateMachineDescriptor fsm1 = wegasFactory.createStateMachineDescriptor(gameModel1, null, "fsm", "fsm", PRIVATE);
        fsm1 = wegasFactory.createState(fsm1, 1l, "");
        fsm1 = wegasFactory.createState(fsm1, 2l, "");
        wegasFactory.createTransition(fsm1, 1l, 2l, "false", "", 0);

        gameModel1 = gameModelFacade.find(gameModel1.getId());

        GameModel gameModel2 = new GameModel();
        gameModel2.setName("gamemodel #1");
        gameModelFacade.createWithDebugGame(gameModel2);

        StateMachineDescriptor fsm2 = wegasFactory.createStateMachineDescriptor(gameModel2, null, "fsm", "fsm", PRIVATE);
        fsm2 = wegasFactory.createState(fsm2, 1l, "");
        fsm2 = wegasFactory.createState(fsm2, 2l, "");
        wegasFactory.createTransition(fsm2, 1l, 2l, "false", "", 0);

        gameModel2 = gameModelFacade.find(gameModel2.getId());

        List<GameModel> scenarios = new ArrayList<>();

        scenarios.add(gameModel1);
        scenarios.add(gameModel2);

        logger.info("Create Model");
        GameModel model = modelFacade.createModelFromCommonContent("model", scenarios);

        model = modelFacade.propagateModel(model.getId());

        StateMachineDescriptor modelFsm = (StateMachineDescriptor) variableDescriptorFacade.find(model, "fsm");

        wegasFactory.removeState(modelFsm, 2l);

        model = modelFacade.propagateModel(model.getId());

        logger.debug(Helper.printGameModel(gameModelFacade.find(model.getId())));
        logger.debug(Helper.printGameModel(gameModelFacade.find(gameModel1.getId())));
        logger.debug(Helper.printGameModel(gameModelFacade.find(gameModel2.getId())));

    }

    @Test
    public void testModelise_orphans() throws NamingException, WegasNoResultException, RepositoryException, RepositoryException {
        GameModel gameModel1 = new GameModel();
        gameModel1.setName("gamemodel #1");
        gameModelFacade.createWithDebugGame(gameModel1);

        ListDescriptor folder1 = wegasFactory.createList(gameModel1, null, "folder1", "folder1");

        gameModel1 = gameModelFacade.find(gameModel1.getId());

        List<GameModel> scenarios = new ArrayList<>();

        scenarios.add(gameModel1);

        logger.info("Create Model");
        GameModel model = modelFacade.createModelFromCommonContent("model", scenarios);

        model = modelFacade.propagateModel(model.getId());

        ListDescriptor folder2 = wegasFactory.createList(gameModel, folder1, "folder2", "folder2");
        StringDescriptor str = wegasFactory.createString(gameModel1, folder2, "str", "str", "a", "a", "b", "c");
        TaskDescriptor task = wegasFactory.createTask(gameModel1, folder2, "task", "task", "a", "Description");

        model = modelFacade.propagateModel(model.getId());

        ListDescriptor folder1Model = (ListDescriptor) variableDescriptorFacade.find(model, "folder1");
        folder1Model.setVisibility(PRIVATE);

        variableDescriptorFacade.merge(folder1Model);

        model = modelFacade.propagateModel(model.getId());

        logger.debug(Helper.printGameModel(gameModelFacade.find(model.getId())));
        logger.debug(Helper.printGameModel(gameModelFacade.find(gameModel1.getId())));

    }

}
