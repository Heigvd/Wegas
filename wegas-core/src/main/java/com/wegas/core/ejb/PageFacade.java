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
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.inject.Inject;
import javax.jcr.RepositoryException;
import javax.json.JsonPatch;

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

    /**
     * Get index of pages. Create and persist it if it does not exist yet
     *
     * @param gm
     *
     * @return page index
     *
     * @throws RepositoryException
     * @throws JsonProcessingException
     */
    public PageIndex getPageIndex(GameModel gm) throws RepositoryException, JsonProcessingException {
        Pages pagesDAO = this.jcrConnectorProvider.getPages(gm);
        return pagesDAO.getIndex();
    }

    public void savePageIndex(GameModel gm, PageIndex index) throws RepositoryException {
        if (!gm.isProtected()) {
            Pages pagesDAO = this.jcrConnectorProvider.getPages(gm);
            pagesDAO.saveIndex(index);
            this.registerPageIndexPropagates(pagesDAO, gm);
        }
    }

    public Page getPage(GameModel gm, String pageId) throws RepositoryException, JsonProcessingException {
        Pages pagesDAO = this.jcrConnectorProvider.getPages(gm);
        String id = pageId;
        if (pageId.equals("default")) {
            id = pagesDAO.getIndex().getDefaultPageId();
        }
        return pagesDAO.getPage(id);
    }

    public PageIndex createIndexItem(GameModel gm, PageIndex.NewItemPayload payload)
        throws RepositoryException, JsonProcessingException {
        this.jcrConnectorProvider.getPages(gm); // open repository
        PageIndex pageIndex = getPageIndex(gm);
        PageIndex.IndexItem parent = pageIndex.findItem(payload.getPath());
        PageIndex.Folder folder;

        if (parent instanceof PageIndex.Folder) {
            folder = (PageIndex.Folder) parent;
        } else {
            folder = pageIndex.getRoot();
        }

        PageIndex.IndexItem item = payload.getItem();

        if (folder != null && item != null) {
            if (item instanceof PageIndex.Page) {
                // create the page
                JsonNode pageConfig = payload.getPayload();
                Page newPage = this.createPage(gm, null, pageConfig);

                // set id of the new page in item
                ((PageIndex.Page) item).setId(newPage.getId());
            } else {
                String newId = folder.generateUniqueId(item.getId());
                item.setName(newId);
            }
            folder.getItems().add(item);
            this.savePageIndex(gm, pageIndex);
        }

        return pageIndex;
    }

    public Page createPage(GameModel gm, String pId, JsonNode content) throws RepositoryException, JsonProcessingException {
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

    public Page duplicatePage(GameModel gm, String pageId) throws RepositoryException, JsonProcessingException {
        PageIndex pageIndex = this.getPageIndex(gm);

        Page oldPage = this.getPage(gm, pageId);
        ObjectNode newContent = oldPage.getContent().deepCopy();

        Page newPage = this.createPage(gm, "", newContent);

        PageIndex.Page findPage = pageIndex.findPage(pageId);
        PageIndex.Folder folder = pageIndex.findParent(findPage);

        PageIndex.Page newItem = new PageIndex.Page();

        newItem.setId(newPage.getId());
        newItem.setName(folder.generateUniqueId(findPage.getName()));
        newItem.setScenaristPage(findPage.isScenaristPage());
        newItem.setTrainerPage(findPage.isTrainerPage());

        folder.getItems().add(newItem);

        this.savePageIndex(gm, pageIndex);

        return newPage;
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

    private void updateFolder(PageIndex.Folder item, PageIndex.Folder newItem) {
        item.setName(newItem.getName());
    }

    private void updatePage(PageIndex.Page item, PageIndex.Page newItem) {
        item.setName(newItem.getName());
        item.setScenaristPage(newItem.isScenaristPage());
        item.setTrainerPage(newItem.isTrainerPage());
    }

    public void updateItem(GameModel gm, PageIndex.UpdatePayload payload)
        throws RepositoryException, JsonProcessingException {
        Pages pagesDAO = this.jcrConnectorProvider.getPages(gm);
        PageIndex index = pagesDAO.getIndex();

        List<String> path = payload.getPath();
        PageIndex.IndexItem item = payload.getItem();

        if (path == null || path.isEmpty()) {
            if (item instanceof PageIndex.Folder) {
                this.updateFolder(index.getRoot(), (PageIndex.Folder) item);
            } else {
                throw new WegasErrorMessage("error", "Type mismatch");
            }
        } else {
            String itemName = path.remove(path.size() - 1);
            PageIndex.Folder parent = (PageIndex.Folder) index.findItem(path);
            PageIndex.IndexItem child = parent.findChild(itemName);
            if (child instanceof PageIndex.Folder && item instanceof PageIndex.Folder) {
                this.updateFolder((PageIndex.Folder) child, (PageIndex.Folder) item);
            } else if (child instanceof PageIndex.Page && item instanceof PageIndex.Page) {
                this.updatePage((PageIndex.Page) child, (PageIndex.Page) item);
            } else {
                throw new WegasErrorMessage("error", "Type mismatch");
            }
        }

        pagesDAO.saveIndex(index);
    }

    public PageIndex deleteItem(GameModel gm, PageIndex.UpdatePayload payload)
        throws RepositoryException, JsonProcessingException {
        Pages pagesDAO = this.jcrConnectorProvider.getPages(gm);
        PageIndex index = pagesDAO.getIndex();

        List<String> path = payload.getPath();
        //PageIndex.IndexItem item = payload.getItem();

        if (path == null || path.isEmpty()) {
            throw WegasErrorMessage.error("Can not delete root");
        } else {
            PageIndex.IndexItem item = index.findItem(path);
            if (item instanceof PageIndex.Folder) {
                index.deleteFolder((PageIndex.Folder) item, false);
                pagesDAO.saveIndex(index);
                this.registerPageIndexPropagates(pagesDAO, gm);
            } else if (item instanceof PageIndex.Page) {
                index = this.deletePage(gm, item.getId());
            }
        }

        return index;
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
                if (path1.size() <= path2.size()) {
                    return false;
                } else {
                    int i;
                    for (i = 0; i < path2.size(); i++) {
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

    public void setDefaultPage(GameModel gm, String pageId) throws RepositoryException, JsonProcessingException {
        PageIndex pageIndex = this.getPageIndex(gm);
        PageIndex.Page page = pageIndex.findPage(pageId);
        if (page != null) {
            pageIndex.setDefaultPageId(pageId);
            this.savePageIndex(gm, pageIndex);
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
                            pos = Math.min(Math.max(pos, 0), dest.getItems().size());
                        }
                        dest.getItems().add(pos, item);

                        this.savePageIndex(gm, index);
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

    public PageIndex deletePage(GameModel gm, String pageId) throws RepositoryException, JsonProcessingException {
        Pages pagesDAO = this.jcrConnectorProvider.getPages(gm);
        PageIndex index = pagesDAO.deletePage(pageId);
        this.registerPageIndexPropagates(pagesDAO, gm);
        return index;
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
