/*
 * Wegas.
 *
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.core.jcr.page;

import java.io.Serializable;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import javax.ejb.EJB;
import javax.enterprise.context.RequestScoped;
import javax.jcr.Node;
import javax.jcr.NodeIterator;
import javax.jcr.RepositoryException;
import javax.xml.bind.annotation.XmlRootElement;
import javax.xml.bind.annotation.XmlTransient;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
@XmlRootElement
public class Pages implements Serializable {

    static final private org.slf4j.Logger logger = LoggerFactory.getLogger(Pages.class);
    private String gameModelName;
    private Map<Integer, Page> pages;
    @XmlTransient
    private PageConnector connector;

    public Pages(String gameModelName) throws RepositoryException {
        this.gameModelName = gameModelName;
        this.connector = new PageConnector();
    }

    public JSONObject getPages() throws RepositoryException {
        if(!this.connector.exist(this.gameModelName)){
            return null;
        }
        NodeIterator it = this.connector.listChildren(this.gameModelName);
        JSONObject ret = new JSONObject();
        while (it.hasNext()) {
            Node n = (Node) it.next();
            try {
                Page p = new Page(new Integer(n.getName()), n.getProperty("content").getString());
                //pageMap.put(p.getId().toString(),  p.getContent());
                ret.put(n.getName(), p.getContent());
            } catch (JSONException ex) {
                //Stored String is wrong
                logger.error(ex.getMessage());
            }

        }
        //this.connector.close();

        return ret;
    }

    public Page getPage(Integer id) throws RepositoryException {
        Node n = this.connector.getChild(gameModelName, id.toString());
        Page ret = null;
        try {
            if (n != null) {
                ret = new Page(new Integer(n.getName()), n.getProperty("content").getString());
            }
        } catch (JSONException ex) {
            //Well Stored String is wrong
            logger.error(ex.getMessage());

        } finally {
            //this.connector.close();
            return ret;
        }
    }

    public String getGameModelName() {
        return gameModelName;
    }

    public void store(Page page) throws RepositoryException {
        Node n = this.connector.addChild(this.gameModelName, page.getId().toString());
        n.setProperty("content", page.getContent().toString());
       // n.getSession().save();
        this.connector.save();
        //this.connector.close();
    }

    public void deletePage(String pageId) throws RepositoryException {
        this.connector.deleteChild(this.gameModelName, pageId);
    }

    public void delete() throws RepositoryException {
        this.connector.deleteRoot(this.gameModelName);
    }
}
