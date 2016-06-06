/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.jcr.page;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.databind.JsonNode;
import com.wegas.core.AlphanumericComparator;
import org.codehaus.jettison.json.JSONException;
import org.slf4j.LoggerFactory;

import javax.jcr.Node;
import javax.jcr.NodeIterator;
import javax.jcr.RepositoryException;
import java.util.*;

/**
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
//@XmlRootElement
public class Pages implements AutoCloseable {

    static final private org.slf4j.Logger logger = LoggerFactory.getLogger(Pages.class);

    private final String gameModelId;

    //@XmlTransient
    @JsonIgnore
    private final PageConnector connector;

    /**
     * @param gameModelId
     * @throws RepositoryException
     */
    public Pages(String gameModelId) throws RepositoryException {
        this.gameModelId = gameModelId;
        this.connector = new PageConnector();
    }

    /**
     * @return Page index
     * @throws RepositoryException
     * @throws JSONException
     */
    public List<HashMap<String, String>> getIndex() throws RepositoryException {
        final List<HashMap<String, String>> ret = new LinkedList<>();
        if (!this.connector.exist(this.gameModelId)) {
            return ret;
        }
        NodeIterator it = this.connector.listChildren(this.gameModelId);
        Node n;
        while (it.hasNext()) {
            final HashMap<String, String> keyVal = new HashMap<>();
            n = (Node) it.next();

            keyVal.put("id", n.getName());
            if (n.hasProperty(Page.NAME_KEY)) {
                keyVal.put("name", n.getProperty(Page.NAME_KEY).getString());
            }
            if (n.hasProperty(Page.INDEX_KEY)) {
                keyVal.put("index", Long.toString(n.getProperty(Page.INDEX_KEY).getLong()));
            }
            ret.add(keyVal);
        }
        return ret;
    }

    public Boolean pageExist(String id) throws RepositoryException {
        final Node child = this.connector.getChild(this.gameModelId, id);
        return child != null;
    }

    /**
     * @return Map complete pages.
     * @throws RepositoryException
     */
    public Map<String, JsonNode> getPagesContent() throws RepositoryException {
        if (!this.connector.exist(this.gameModelId)) {
            return new TreeMap<>();
        }
        NodeIterator it = this.connector.listChildren(this.gameModelId);
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
        if (!this.connector.exist(this.gameModelId)) {
            return 0L;
        }
        return this.connector.listChildren(this.gameModelId).getSize();
    }

    /**
     * @param id
     * @return
     * @throws RepositoryException
     */
    public Page getPage(String id) throws RepositoryException {
        Node n = this.connector.getChild(gameModelId, id);
        Page ret = null;
        if (n != null) {
            ret = new Page(n);
        }
        return ret;

    }

    /**
     * @return
     */
    public String getGameModelId() {
        return gameModelId;
    }

    /**
     * @param page
     * @throws RepositoryException
     */
    public void store(Page page) throws RepositoryException {
        Node n = this.connector.addChild(this.gameModelId, page.getId());
        n.setProperty("content", page.getContent().toString());
        this.setMeta(page);
    }

    /**
     * @param page
     * @throws RepositoryException
     */
    public void setMeta(Page page) throws RepositoryException {
        Node n = this.connector.addChild(this.gameModelId, page.getId());
        if (page.getName() != null) {
            n.setProperty(Page.NAME_KEY, page.getName());
        }
    }

    /**
     * @param pageId
     * @throws RepositoryException
     */
    public void deletePage(String pageId) throws RepositoryException {
        this.connector.deleteChild(this.gameModelId, pageId);
    }

    /**
     * @throws RepositoryException
     */
    public void delete() throws RepositoryException {
        this.connector.deleteRoot(this.gameModelId);
    }

    @Override
    public void close() throws RepositoryException {
        this.connector.close();
    }

    /**
     * Move page to new index. Updating other pages accordingly.
     *
     * @param pageId page's id to move
     * @param pos    position to move page to.
     * @throws RepositoryException
     */
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
        Node n = this.connector.addChild(this.gameModelId, page.getId());
        if (page.getIndex() != null) {
            n.setProperty(Page.INDEX_KEY, page.getIndex());
        }
    }

    private LinkedList<Page> getPages() throws RepositoryException {
        final NodeIterator nodeIterator = this.connector.listChildren(this.gameModelId);
        final LinkedList<Page> pages = new LinkedList<>();
        while (nodeIterator.hasNext()) {
            pages.add(new Page(nodeIterator.nextNode()));
        }
        return pages;
    }

    public Page getDefaultPage() throws RepositoryException {
        final NodeIterator query = this.connector.query("Select * FROM [nt:base] as n WHERE ISDESCENDANTNODE('/" + this.gameModelId + "') order by n.index, localname(n)", 1);
        if(query.hasNext()){
            return new Page(query.nextNode());
        }
        return null;
    }
}
