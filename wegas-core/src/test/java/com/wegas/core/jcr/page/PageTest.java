/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.jcr.page;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.github.fge.jsonpatch.JsonPatchException;
import com.wegas.core.jcr.page.Page;
import com.wegas.core.jcr.page.Pages;
import org.junit.After;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;

import javax.jcr.RepositoryException;
import java.io.IOException;

public class PageTest {
    final static JsonNodeFactory factory = new JsonNodeFactory(false);
    final static String pageName = "First Page";
    final static JsonNode pageContent = factory.objectNode()
            .put("type", "AbsoluteLayout")
            .put("@name", pageName);
    private static final long GAME_MODEL_ID = -100L;

    @Before
    public void before() throws RepositoryException {
        // Create
        try (final Pages pages = new Pages(GAME_MODEL_ID)) {
            final Page page = new Page("1", pageContent.deepCopy());
            pages.store(page);
        }

    }

    @After
    public void after() throws RepositoryException {
        // Delete
        try (final Pages pages = new Pages(GAME_MODEL_ID)) {
            pages.deletePage("1");
        }
        try (final Pages pages = new Pages(GAME_MODEL_ID)) {
            Assert.assertEquals(0, pages.size());
        }
    }


    @Test
    public void patch() throws RepositoryException, IOException, JsonPatchException {
        // patch the name.
        final String patchedPageName = "Patched Page";
        final ArrayNode patch = factory.arrayNode().add(factory.objectNode()
                .put("op", "replace")
                .put("path", "/@name")
                .put("value", patchedPageName)
        );
        try (final Pages pages = new Pages(GAME_MODEL_ID)) {
            final Page page = pages.getPage("1");
            Assert.assertEquals(pageName, page.getName());
            page.patch(patch);
            pages.store(page);
            System.out.println(page.getName());
        }
        try (final Pages pages = new Pages(GAME_MODEL_ID)) {
            Assert.assertEquals(patchedPageName, pages.getPage("1").getName());
        }
    }

    @Test
    public void crud() throws RepositoryException {
        // Create done in before
        // Read
        try (final Pages pages = new Pages(GAME_MODEL_ID)) {
            final Page page = pages.getPage("1");
            Assert.assertEquals(1, pages.size());
            Assert.assertEquals(
                    ((ObjectNode) pageContent.deepCopy())
                            .put("@index", 0),
                    page.getContentWithMeta());
            Assert.assertEquals(pageName, page.getName());
            Assert.assertEquals(0L, (long) page.getIndex());
        }
        // Update
        try (final Pages pages = new Pages(GAME_MODEL_ID)) {
            final ObjectNode jsonNode = pageContent.deepCopy();
            jsonNode.put("@name", "Second Page");
            final Page page1 = new Page("1", jsonNode);
            pages.store(page1);

        }
        try (final Pages pages = new Pages(GAME_MODEL_ID)) {
            Assert.assertEquals(1, pages.size());
            Assert.assertEquals("Second Page", pages.getPage("1").getName());
        }
        // Delete done in after
    }
}