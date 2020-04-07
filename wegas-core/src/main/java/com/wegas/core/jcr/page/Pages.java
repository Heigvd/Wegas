/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.jcr.page;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.wegas.core.AlphanumericComparator;
import com.wegas.core.Helper;
import com.wegas.core.jcr.jta.JTARepositoryConnector;
import java.util.*;
import javax.jcr.Node;
import javax.jcr.NodeIterator;
import javax.jcr.Property;
import javax.jcr.RepositoryException;
import org.slf4j.LoggerFactory;

/**
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
public class Pages extends JTARepositoryConnector {

    static final private org.slf4j.Logger logger = LoggerFactory.getLogger(Pages.class);

    private static ObjectMapper mapper = null;

    @JsonIgnore
    private final PageConnector connector;

    /**
     * @param gameModelId
     *
     * @throws RepositoryException
     */
    public Pages(Long gameModelId) throws RepositoryException {
        this.connector = new PageConnector(gameModelId);
    }

    @Override
    public void setManaged(boolean managed) {
        connector.setManaged(managed);
    }

    @Override
    public boolean getManaged() {
        return connector.getManaged();
    }

    /**
     * @return Page index
     *
     * @throws RepositoryException
     */
    public PageIndex getIndex() throws RepositoryException {
        Page indexPage = this.getPage("index");
        if (indexPage == null) {
            this.saveIndex(new PageIndex());
            indexPage = this.getPage("index");
        }

        PageIndex index;
        try {
            index = getMapper().treeToValue(indexPage.getContent(),
                PageIndex.class);
        } catch (JsonProcessingException ex) {
            index = new PageIndex();
        }

        List<Page> orphans = new ArrayList<>();

        LinkedList<Page> pages = this.getPages();

        for (Page page : pages) {
            String id = page.getId();
            if (!"index".equals(id)
                && !index.hasPage(page.getId())) {
                orphans.add(page);
            }
        }

        boolean upToDate = true;

        if (!orphans.isEmpty()) {
            // Migrate indexless pages
            upToDate = false;
            Collections.sort(orphans, (Page o1, Page o2) -> o1.getIndex().compareTo(o2.getIndex()));
            for (Page orphan : orphans) {
                index.getRoot().getItems().add(
                    new PageIndex.Page(
                        orphan.getId(),
                        orphan.getName() != null ? orphan.getName() : "Untitled"
                    ));
                this.clearMeta(orphan);
            }
        }

        if (Helper.isNullOrEmpty(index.getDefaultPageId())) {
            upToDate = false;
            index.resetDefaultPage();
        }

        if (!upToDate) {
            // save updated index
            this.saveIndex(index);
        }

        return index;
    }

    public void saveIndex(PageIndex index) throws RepositoryException {
        this.store(new Page("index", getMapper().valueToTree(index)));
    }

    public Boolean pageExist(String id) throws RepositoryException {
        final Node child = this.connector.getChild(id);
        return child != null;
    }

    /**
     * @return Map complete pages.
     *
     * @throws RepositoryException
     */
    public Map<String, JsonNode> getPagesContent() throws RepositoryException {
        NodeIterator it = this.connector.listChildren();
        Map<String, JsonNode> ret = new TreeMap<>(new AlphanumericComparator<String>());
        while (it.hasNext()) {
            Node n = (Node) it.next();
            Page p = new Page(n);
            //pageMap.put(p.getId().toString(),  p.getContent());
            ret.put(p.getId(), p.getContent());
        }
        //this.connector.close();

        return ret;
    }

    public long size() throws RepositoryException {
        return this.connector.listChildren().getSize();
    }

    /**
     * @param id
     *
     * @return the page
     *
     * @throws RepositoryException
     */
    public Page getPage(String id) throws RepositoryException {
        Node n = this.connector.getChild(id);
        Page ret = null;
        if (n != null) {
            ret = new Page(n);
        }
        return ret;

    }

    /**
     * @param page
     *
     * @throws RepositoryException
     */
    public void store(Page page) throws RepositoryException {
        Node n = this.connector.addChild(page.getId());
        n.setProperty("content", page.getContent().toString());
        this.setMeta(page);
    }

    /**
     * @param page
     *
     * @throws RepositoryException
     */
    public void setMeta(Page page) throws RepositoryException {
        Node n = this.connector.getChild(page.getId());
        if (!Helper.isNullOrEmpty(page.getName())) {
            n.setProperty(Page.NAME_KEY, page.getName());
        }
        if (page.getIndex() != null) {
            n.setProperty(Page.INDEX_KEY, page.getIndex());
        }
    }

    /**
     * @param pageId
     *
     * @throws RepositoryException
     */
    public PageIndex deletePage(String pageId) throws RepositoryException, JsonProcessingException {
        this.connector.deleteChild(pageId);
        PageIndex index = this.getIndex();
        index.deletePage(pageId);
        this.saveIndex(index);
        return index;
    }

    /**
     * Delete all pages.
     *
     * @throws RepositoryException
     */
    public void delete() throws RepositoryException {
        this.connector.deleteRoot();
    }

    @Override
    public void prepare() {
        this.connector.prepare();
    }

    /**
     *
     */
    @Override
    public void commit() {
        this.runCommitCallbacks();
        this.connector.commit();
        this.runAfterCommitCallbacks();
    }

    /**
     *
     */
    @Override
    public void rollback() {
        this.runRollbackCallbacks();
        this.connector.rollback();
    }

    /**
     * Move page to new index. Updating other pages accordingly.
     *
     * @param pageId page's id to move
     * @param pos    position to move page to.
     *
     * @throws RepositoryException
     */
    @Deprecated
    public void move(final String pageId, final int pos) throws RepositoryException {
        Page page;
        int oldPos = -1;
        final LinkedList<Page> pages = this.getPages();
        for (int i = 0; i < pages.size(); i++) {
            if (pages.get(i).getId().equals(pageId)) {
                oldPos = i;
                break;
            }
        }
        if (oldPos != -1) {
            page = pages.remove(oldPos);
            pages.add(pos, page);
        }
        for (int start = 0; start < pages.size(); start++) {
            page = pages.get(start);
            page.setIndex(start);
            this.updateIndex(page);
        }
//        final NodeIterator query = this.connector.query("Select * FROM [nt:base] as n WHERE ISDESCENDANTNODE('" + this.gameModelId + "') order by n.index, localname(n)," +
//            " LIMIT " + (Math.abs(pos - oldPos) + 1L) + " OFFSET " + Math.min(pos, oldPos));

    }

    private void updateIndex(Page page) throws RepositoryException {
        Node n = this.connector.addChild(page.getId());
        if (page.getIndex() != null) {
            n.setProperty(Page.INDEX_KEY, page.getIndex());
        }
    }

    private void removeNodeProperty(Node n, String property) throws RepositoryException {
        if (n.hasProperty(property)) {
            Property p = n.getProperty(property);
            p.remove();
        }
    }

    private void clearMeta(Page page) throws RepositoryException {
        Node n = this.connector.addChild(page.getId());
        this.removeNodeProperty(n, Page.INDEX_KEY);
        this.removeNodeProperty(n, Page.NAME_KEY);
    }

    private LinkedList<Page> getPages() throws RepositoryException {
        final NodeIterator nodeIterator = this.connector.listChildren();
        final LinkedList<Page> pages = new LinkedList<>();
        while (nodeIterator.hasNext()) {
            pages.add(new Page(nodeIterator.nextNode()));
        }

        Collections.sort(pages, (Page o1, Page o2) -> o1.getIndex().compareTo(o2.getIndex()));

        return pages;
    }

    @Override
    public String toString() {
        return "Pages(" + connector.getRootPath() + ")";
    }

    private static synchronized ObjectMapper getMapper() {
        if (Pages.mapper == null) {
            Pages.mapper = new ObjectMapper();
        }
        return Pages.mapper;
    }
}
