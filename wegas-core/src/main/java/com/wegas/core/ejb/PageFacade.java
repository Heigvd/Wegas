/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.github.fge.jsonpatch.JsonPatchException;
import com.wegas.core.Helper;
import com.wegas.core.jcr.jta.JCRConnectorProvider;
import com.wegas.core.jcr.page.Page;
import com.wegas.core.jcr.page.Pages;
import com.wegas.core.persistence.game.GameModel;
import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.inject.Inject;
import javax.jcr.RepositoryException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * @author Maxence
 */
@Stateless
@LocalBean
public class PageFacade {

    @Inject
    private JCRConnectorProvider jcrConnectorProvider;

    static final private Logger logger = LoggerFactory.getLogger(PageFacade.class);

    public List<HashMap<String, String>> getPageIndex(GameModel gm) throws RepositoryException {
        Pages pagesDAO = this.jcrConnectorProvider.getPages(gm);
        return pagesDAO.getIndex();
    }

    public Page getPage(GameModel gm, String pageId) throws RepositoryException {
        Pages pagesDAO = this.jcrConnectorProvider.getPages(gm);
        if (pageId.equals("default")) {
            return pagesDAO.getDefaultPage();
        } else {
            return pagesDAO.getPage(pageId);
        }
    }

    public Page createPage(GameModel gm, String pId, JsonNode content) throws RepositoryException {
        Pages pagesDAO = this.jcrConnectorProvider.getPages(gm);

        if (Helper.isNullOrEmpty(pId)) {
            Integer pageId = 1;
            while (pagesDAO.pageExist(pageId.toString())) {
                pageId++;
            }
            pId = pageId.toString();
        }
        Page page = new Page(pId, content);
        page.setIndex((int) pagesDAO.size()); // May loose some values if we had that many pages...
        pagesDAO.store(page);

        return this.getPage(gm, pId);
    }

    public Page duplicatePage(GameModel gm, String pageId) throws RepositoryException {
        Page oldPage = this.getPage(gm, pageId);
        ObjectNode newContent = oldPage.getContent().deepCopy();

        if (!Helper.isNullOrEmpty(oldPage.getName())) {
            newContent.put("@name", oldPage.getName() + "-copy");
        }

        return this.createPage(gm, "", newContent);
    }

    public void addPages(GameModel gm, Map<String, JsonNode> pageMap) throws RepositoryException {
        Pages pagesDAO = this.jcrConnectorProvider.getPages(gm);

        for (Entry<String, JsonNode> p : pageMap.entrySet()) {
            pagesDAO.store(new Page(p.getKey(), p.getValue()));
        }
    }

    public void setPage(GameModel gm, String pageId, JsonNode content) throws RepositoryException {
        Pages pagesDAO = this.jcrConnectorProvider.getPages(gm);
        Page page = new Page(pageId, content);
        pagesDAO.store(page);
    }

    public void setPageMeta(GameModel gm, String pageId, Page page) throws RepositoryException {
        Pages pagesDAO = this.jcrConnectorProvider.getPages(gm);
        page.setId(pageId);
        pagesDAO.setMeta(page);
    }

    public void movePage(GameModel gm, String pageId, int pos) throws RepositoryException {
        Pages pagesDAO = this.jcrConnectorProvider.getPages(gm);
        pagesDAO.move(pageId, pos);
    }

    public void deletePages(GameModel gm) throws RepositoryException {
        Pages pagesDAO = this.jcrConnectorProvider.getPages(gm);
        pagesDAO.delete();
    }

    public void deletePage(GameModel gm, String pageId) throws RepositoryException {
        Pages pagesDAO = this.jcrConnectorProvider.getPages(gm);
        pagesDAO.deletePage(pageId);
    }

    public Page patchPage(GameModel gm, String pageId, JsonNode patch) throws RepositoryException, IOException, JsonPatchException {

        Pages pagesDAO = this.jcrConnectorProvider.getPages(gm);

        Page page = this.getPage(gm, pageId);

        page.patch(patch);
        pagesDAO.store(page);
        return page;
    }

    public Page patchPage(GameModel gm, String pageId, String patch) throws RepositoryException, IOException, JsonPatchException {
        return this.patchPage(gm, pageId, (new ObjectMapper()).readTree(patch));
    }

}
