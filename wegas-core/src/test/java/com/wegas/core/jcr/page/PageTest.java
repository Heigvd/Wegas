
/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.jcr.page;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.wegas.core.ejb.PageFacade;
import com.wegas.core.jcr.jta.JCRTestFacade;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.primitive.NumberDescriptor;
import com.wegas.core.persistence.variable.primitive.NumberInstance;
import com.wegas.test.arquillian.AbstractArquillianTest;
import java.io.StringReader;
import javax.inject.Inject;
import javax.jcr.RepositoryException;
import javax.json.Json;
import javax.json.JsonArray;
import javax.json.JsonPatch;
import javax.json.JsonReader;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

public class PageTest extends AbstractArquillianTest {

    final static JsonNodeFactory factory = new JsonNodeFactory(false);
    final static String pageName = "First Page";
    final static JsonNode pageContent = factory.objectNode()
        .put("type", "AbsoluteLayout")
        .put("@name", pageName);

    @Inject
    private PageFacade pageFacade;

    @Inject
    private JCRTestFacade jcrTestFacade;

    @BeforeEach
    public void before() throws RepositoryException, JsonProcessingException {
        pageFacade.createPage(gameModel, "1", pageContent.deepCopy());
    }

    @AfterEach
    public void after() throws RepositoryException, JsonProcessingException {
        pageFacade.deletePage(gameModel, "1");
        Assertions.assertEquals(0,
            pageFacade.getPageIndex(gameModel).getRoot().getItems().size());
    }

    @Test
    public void patch() throws RepositoryException, JsonProcessingException {
        // patch the name.
        final String patchedPageName = "Patched Page";

        String strPatch = "[{\"op\": \"replace\", \"path\": \"/@name\", \"value\" : \"" + patchedPageName + "\"}]";

        try (JsonReader reader = Json.createReader(new StringReader(strPatch))) {
            JsonArray patchArray = reader.readArray();
            JsonPatch patch = Json.createPatchBuilder(patchArray).build();

            Page page = pageFacade.getPage(gameModel, "1");
            Assertions.assertEquals(pageName, page.getName());

            pageFacade.patchPage(gameModel, "1", patch);
            page = pageFacade.getPage(gameModel, "1");

            Assertions.assertEquals(patchedPageName, page.getName());
        }
    }

    @Test
    public void crud() throws RepositoryException, JsonProcessingException {
        // Create done in before
        // Read
        final Page page = pageFacade.getPage(gameModel, "1");
        Assertions.assertEquals(1,
            pageFacade.getPageIndex(gameModel).getRoot().getItems().size());

        Assertions.assertEquals(
            ((ObjectNode) pageContent.deepCopy())
                .put("@index", 0),
            page.getContentWithMeta());
        Assertions.assertEquals(pageName, page.getName());
        Assertions.assertEquals(0L, (long) page.getIndex());

        final ObjectNode jsonNode = pageContent.deepCopy();
        jsonNode.put("@name", "Second Page");
        Page page1 = pageFacade.createPage(gameModel, "1", jsonNode);

        Assertions.assertEquals(1,
            pageFacade.getPageIndex(gameModel).getRoot().getItems().size());
        Assertions.assertEquals("Second Page",
            pageFacade.getPage(gameModel, "1").getName());
        // Delete done in after
    }

    @Test
    public void testPagesRollback() throws RepositoryException, JsonProcessingException {

        // first descriptor
        NumberDescriptor desc1 = new NumberDescriptor("x");
        desc1.setDefaultInstance(new NumberInstance(0));

        variableDescriptorFacade.create(gameModel.getId(), desc1);

        // second descriptor
        NumberDescriptor desc2 = new NumberDescriptor("y");
        desc2.setDefaultInstance(new NumberInstance(0));

        variableDescriptorFacade.create(gameModel.getId(), desc2);

        Assertions.assertEquals(1,
            pageFacade.getPageIndex(gameModel).getRoot().getItems().size());

        jcrTestFacade.addAPage(gameModel.getId(), "b name", "2");

        Assertions.assertEquals(2,
            pageFacade.getPageIndex(gameModel).getRoot().getItems().size());

        try {
            jcrTestFacade.addPageAndRename(gameModel.getId(), "c name", "3", "a");
            Assertions.fail("Transaction should have been rejeced");
        } catch (RuntimeException ex) {
            logger.error("Runtime exception: {}", ex);
        }

        // no new page
        Assertions.assertEquals(2,
            pageFacade.getPageIndex(gameModel).getRoot().getItems().size());
        GameModel gm = gameModelFacade.find(gameModel.getId());
        for (VariableDescriptor vd : gm.getVariableDescriptors()) {
            logger.error("VD: {}", vd);
            Assertions.assertNotEquals("a", vd.getName());
        }

        pageFacade.deletePage(gameModel, "2");
    }
}
