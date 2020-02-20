/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.wegas.core.Helper;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.jcr.jta.JCRConnectorProvider;
import com.wegas.core.jcr.page.Page;
import com.wegas.core.jcr.page.PageIndex;
import com.wegas.core.jcr.page.Pages;
import com.wegas.core.persistence.game.GameModel;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.inject.Inject;
import javax.jcr.RepositoryException;
import javax.json.JsonPatch;
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

    @Inject
    private WebsocketFacade websocketFacade;

    @Inject
    private RequestManager requestManager;

    static final private Logger logger = LoggerFactory.getLogger(PageFacade.class);

    public PageIndex getPageIndex(GameModel gm) throws RepositoryException, JsonProcessingException {
        Pages pagesDAO = this.jcrConnectorProvider.getPages(gm);
        return pagesDAO.getIndex();
    }

    public void savePageIndex(GameModel gm, PageIndex index) throws RepositoryException {
        Pages pagesDAO = this.jcrConnectorProvider.getPages(gm);
        pagesDAO.saveIndex(index);
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

        Page p = this.getPage(gm, pId);
        this.registerPageIndexPropagates(pagesDAO, gm);
        return p;
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

        this.registerPageIndexPropagates(pagesDAO, gm);
    }

    public void setPages(GameModel gameModel, Map<String, JsonNode> pages) {
        gameModel.setPages(pages);
    }

    public void setPage(GameModel gm, String pageId, JsonNode content) throws RepositoryException {
        Pages pagesDAO = this.jcrConnectorProvider.getPages(gm);
        Page page = new Page(pageId, content);
        pagesDAO.store(page);

        this.registerPagePropagate(pagesDAO, gm, pageId);
    }

    public void renameItem(GameModel gm, PageIndex.RenamePayload payload)
        throws RepositoryException, JsonProcessingException {
        Pages pagesDAO = this.jcrConnectorProvider.getPages(gm);
        PageIndex index = pagesDAO.getIndex();

        List<String> path = payload.getPath();
        String newName = payload.getName();

        if (path == null || path.isEmpty()) {
            index.getRoot().setName(newName);
        } else {
            String itemName = path.remove(path.size() - 1);
            if (!itemName.equals(newName)) {
                PageIndex.Folder parent = (PageIndex.Folder) index.findItem(path);
                PageIndex.IndexItem child = parent.findChild(itemName);
                child.setName(parent.generageUniqueId(newName));
            }
        }

        pagesDAO.saveIndex(index);

        //this.registerPagePropagate(pagesDAO, gm, pageId);
        this.registerPageIndexPropagates(pagesDAO, gm);
    }

    /**
     * Is path1 child of path2 ?
     *
     * @param path1
     * @param path2
     *
     * @return
     */
    private static boolean isChildOf(List<String> path1, List<String> path2) {
        if (path1 != null && !path1.isEmpty()) {
            if (path2 != null && !path2.isEmpty()) {
                if (path2.size() <= path1.size()) {
                    return false;
                } else {
                    int i;
                    for (i = 0; i < path1.size(); i++) {
                        if (!path1.get(i).equals(path2.get(i))) {
                            return false;
                        }
                    }
                    return true;
                }
            } else {
                // path2 is root, any path is child of root
                return true;
            }
        } else {
            // path1 is root => not child of anyone
            return false;
        }
    }

    public void moveItem(GameModel gm, PageIndex.MovePayload payload) throws RepositoryException,
        JsonProcessingException {
        Pages pages = this.jcrConnectorProvider.getPages(gm);

        List<String> fromPath = payload.getFrom();
        List<String> toPath = payload.getTo();

        if (fromPath != null && toPath != null) {
            PageIndex index = pages.getIndex();
            PageIndex.IndexItem destItem = index.findItem(payload.getTo());

            if (destItem instanceof PageIndex.Folder) {
                PageIndex.Folder dest = (PageIndex.Folder) destItem;

                if (PageFacade.isChildOf(toPath, fromPath)) {
                    throw WegasErrorMessage.error(
                        "Impossible to move a folder in one of his children");
                }

                List<String> fromParentPath = new ArrayList<>(fromPath);
                String itemName = fromParentPath.remove(fromParentPath.size() - 1);
                PageIndex.Folder fromParent = (PageIndex.Folder) index.findItem(fromParentPath);
                PageIndex.IndexItem item = fromParent.findChild(itemName);

                if (fromParent.getItems().remove(item)) {
                    if (dest.findChild(itemName) == null) {
                        Integer pos = payload.getPos();

                        if (pos == null) {
                            pos = dest.getItems().size();
                        } else {
                            pos = Math.max(pos, dest.getItems().size());
                        }
                        dest.getItems().add(pos, item);

                        //pagesDAO.move(pageId, pos);
                        this.registerPageIndexPropagates(pages, gm);
                    } else {
                        throw WegasErrorMessage.error(itemName + " already exists in destination folder");
                    }
                } else {
                    throw WegasErrorMessage.error("Fails to remove item from its original parent");
                }
            } else {
                throw WegasErrorMessage.error("Destination folder is not a folder");
            }
        } else {
            throw WegasErrorMessage.error("dource and/or destination is not defined");
        }
    }

    public void deletePages(GameModel gm) throws RepositoryException {
        Pages pagesDAO = this.jcrConnectorProvider.getPages(gm);
        pagesDAO.delete();

        this.registerPageIndexPropagates(pagesDAO, gm);
    }

    public void deletePage(GameModel gm, String pageId) throws RepositoryException, JsonProcessingException {
        Pages pagesDAO = this.jcrConnectorProvider.getPages(gm);
        pagesDAO.deletePage(pageId);
        this.registerPageIndexPropagates(pagesDAO, gm);
    }

    public Page patchPage(GameModel gm, String pageId, JsonPatch patch) throws RepositoryException, JsonProcessingException {

        Pages pagesDAO = this.jcrConnectorProvider.getPages(gm);

        Page page = this.getPage(gm, pageId);

        page.patch(patch);
        pagesDAO.store(page);
        this.registerPagePropagate(pagesDAO, gm, pageId);
        return page;
    }

    /**
     * Propagate page change through websocket after JTA commit
     *
     * @param gameModel page owner
     * @param pageId    pade id
     *
     * @throws RepositoryException
     */
    private void registerPagePropagate(Pages pages, GameModel gameModel, String pageId) throws RepositoryException {
        pages.afterCommit((t) -> {
            websocketFacade.pageUpdate(gameModel.getId(), pageId, requestManager.getSocketId());
        });
    }

    /**
     * Propagate new page through websocket after JTA commit
     *
     * @param gameModel pages owner
     *
     * @throws RepositoryException
     */
    private void registerPageIndexPropagates(Pages pages, GameModel gameModel) throws RepositoryException {
        pages.afterCommit((t) -> {
            websocketFacade.pageIndexUpdate(gameModel.getId(), requestManager.getSocketId());
        });
    }

}
