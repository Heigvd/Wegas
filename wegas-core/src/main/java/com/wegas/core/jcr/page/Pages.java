/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.jcr.page;

import java.io.IOException;
import java.io.Serializable;
import java.util.HashMap;
import java.util.Map;
import javax.jcr.Node;
import javax.jcr.NodeIterator;
import javax.jcr.RepositoryException;
import javax.xml.bind.annotation.XmlRootElement;
import javax.xml.bind.annotation.XmlTransient;
import org.codehaus.jackson.JsonNode;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
@XmlRootElement
public class Pages implements Serializable {

    static final private org.slf4j.Logger logger = LoggerFactory.getLogger(Pages.class);
    private String gameModelId;
    @XmlTransient
    private PageConnector connector;

    /**
     *
     * @param gameModelId
     * @throws RepositoryException
     */
    public Pages(String gameModelId) throws RepositoryException {
        this.gameModelId = gameModelId;
        this.connector = new PageConnector();
    }

    /**
     *
     * @return Map<String,String> Page index
     * @throws RepositoryException
     */
    public Map<String, String> getIndex() throws RepositoryException {
        if (!this.connector.exist(this.gameModelId)) {
            return null;
        }
        NodeIterator it = this.connector.listChildren(this.gameModelId);
        Map<String, String> ret = new HashMap<>();
        Node n;
        String name;
        while (it.hasNext()) {
            name = "";
            n = (Node) it.next();
            if (n.hasProperty("pageName")) {
                name = n.getProperty("pageName").getString();
            }
            ret.put(n.getName(), name);
        }
        return ret;
    }

    /**
     *
     * @return Map<String,String> complete pages
     * @throws RepositoryException
     */
    public Map<String, JsonNode> getPages() throws RepositoryException {
        if (!this.connector.exist(this.gameModelId)) {
            return null;
        }
        NodeIterator it = this.connector.listChildren(this.gameModelId);
        Map<String, JsonNode> ret = new HashMap<>();
        while (it.hasNext()) {
            Node n = (Node) it.next();
            try {
                Page p = new Page(n.getName(), n.getProperty("content").getString());
                //pageMap.put(p.getId().toString(),  p.getContent());
                ret.put(p.getId(), p.getContent());
            } catch (IOException ex) {
                //Stored String is wrong
                logger.error(ex.getMessage());
            }

        }
        //this.connector.close();

        return ret;
    }

    /**
     *
     * @param id
     * @return
     * @throws RepositoryException
     */
    public Page getPage(String id) throws RepositoryException {
        Node n = this.connector.getChild(gameModelId, id);
        Page ret = null;
        try {
            if (n != null) {
                ret = new Page(n.getName(), n.getProperty("content").getString());
            }
        } catch (IOException ex) {
            //Well Stored String is wrong
            logger.error(ex.getMessage());

        } finally {
            //this.connector.close();
            return ret;
        }
    }

    /**
     *
     * @return
     */
    public String getGameModelId() {
        return gameModelId;
    }

    /**
     *
     * @param page
     * @throws RepositoryException
     */
    public void store(Page page) throws RepositoryException {
        Node n = this.connector.addChild(this.gameModelId, page.getId().toString());
        n.setProperty("content", page.getContent().toString());
        this.setMeta(page);
    }

    /**
     *
     * @param page
     * @throws RepositoryException
     */
    public void setMeta(Page page) throws RepositoryException {
        Node n = this.connector.addChild(this.gameModelId, page.getId().toString());
        if (page.getName() != null) {
            n.setProperty("pageName", page.getName());
        }
        this.connector.save();
    }

    /**
     *
     * @param pageId
     * @throws RepositoryException
     */
    public void deletePage(String pageId) throws RepositoryException {
        this.connector.deleteChild(this.gameModelId, pageId);
    }

    /**
     *
     * @throws RepositoryException
     */
    public void delete() throws RepositoryException {
        this.connector.deleteRoot(this.gameModelId);
    }
}
