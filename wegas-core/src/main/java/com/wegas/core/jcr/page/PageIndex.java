/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2019 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.jcr.page;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.annotation.JsonTypeName;
import com.fasterxml.jackson.databind.JsonNode;
import com.wegas.core.Helper;
import com.wegas.core.exception.client.WegasErrorMessage;
import java.util.ArrayList;
import java.util.List;

/**
 *
 * @author maxence
 */
public class PageIndex {

    private Folder root;
    private String defaultPageId;

    public PageIndex() {
        this.root = new Folder();
    }

    public Folder getRoot() {
        return root;
    }

    public void setRoot(Folder root) {
        this.root = root;
    }

    public String getDefaultPageId() {
        return defaultPageId;
    }

    public void setDefaultPageId(String defaultPageId) {
        this.defaultPageId = defaultPageId;
    }

    public boolean hasPage(String pageId) {
        return this.findPage(pageId) != null;
    }

    void resetDefaultPage() {
        if (Helper.isNullOrEmpty(this.defaultPageId)) {
            List<Folder> folders = new ArrayList<>();
            folders.add(this.root);
            while (!folders.isEmpty()) {
                Folder currentFolder = folders.remove(0);
                for (IndexItem item : currentFolder.getItems()) {
                    if (item instanceof Page) {
                        this.defaultPageId = ((Page) item).getId();
                        return;
                    } else if (item instanceof Folder) {
                        folders.add((Folder) item);
                    }
                }
            }
        }
    }

    /**
     * Find parent folder of an item
     *
     * @param needle
     *
     * @return null if not found
     */
    public Folder findParent(IndexItem needle) {
        List<Folder> folders = new ArrayList<>();
        folders.add(this.root);
        while (!folders.isEmpty()) {
            Folder currentFolder = folders.remove(0);
            for (IndexItem item : currentFolder.getItems()) {
                if (item == needle) {
                    return currentFolder;
                } else if (item instanceof Folder) {
                    folders.add((Folder) item);
                }
            }
        }
        return null;
    }

    /**
     * Find page entry by id
     *
     * @param pageId id of the page
     *
     * @return the page entry or null
     */
    public Page findPage(String pageId) {
        List<Folder> folders = new ArrayList<>();
        folders.add(this.root);
        while (!folders.isEmpty()) {
            Folder currentFolder = folders.remove(0);
            for (IndexItem item : currentFolder.getItems()) {
                if (item instanceof Page) {
                    if (((Page) item).getId().equals(pageId)) {
                        return (Page) item;
                    }
                } else if (item instanceof Folder) {
                    folders.add((Folder) item);
                }
            }
        }
        return null;
    }

    public IndexItem findItem(List<String> path) {
        IndexItem current = this.root;
        for (int level = 0; level < path.size(); level++) {
            if (current instanceof Folder) {
                current = ((Folder) current).findChild(path.get(level));
            } else {
                return null;
            }
        }
        return current;
    }

    public void deletePage(String pageId) {
        List<Folder> folders = new ArrayList<>();
        folders.add(this.root);
        while (!folders.isEmpty()) {
            Folder currentFolder = folders.remove(0);
            for (IndexItem item : currentFolder.getItems()) {
                if (item instanceof Page) {
                    if (((Page) item).getId().equals(pageId)) {
                        currentFolder.getItems().remove(item);
                        return;
                    }
                } else if (item instanceof Folder) {
                    folders.add((Folder) item);
                }
            }
        }
    }

    public void deleteFolder(Folder folder, boolean force) {
        if (folder != null && (folder.getItems().isEmpty() || force)) {
            Folder parent = this.findParent(folder);
            parent.getItems().remove(folder);
        } else {
            throw WegasErrorMessage.error("Failed to remove '" + folder.getName() + "':Directory not empty");
        }

    }

    @JsonTypeInfo(use = JsonTypeInfo.Id.NAME,
        include = JsonTypeInfo.As.PROPERTY,
        property = "@class")
    @JsonSubTypes(value = {
        @JsonSubTypes.Type(name = "Page", value = Page.class),
        @JsonSubTypes.Type(name = "Folder", value = Folder.class)
    })
    public static interface IndexItem {

        public String getId();

        public void setName(String newName);
    }

    @JsonTypeName("Page")
    public static class Page implements IndexItem {

        private String name;
        private String id;
        private Boolean trainerPage;
        private Boolean scenaristPage;

        public Page() {
        }

        public Page(String id, String name) {
            this.name = name;
            this.id = id;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getId() {
            return id;
        }

        public void setId(String id) {
            this.id = id;
        }

        public Boolean isTrainerPage() {
            return trainerPage;
        }

        public void setTrainerPage(Boolean trainerPage) {
            this.trainerPage = trainerPage;
        }

        public Boolean isScenaristPage() {
            return scenaristPage;
        }

        public void setScenaristPage(Boolean scenaristPage) {
            this.scenaristPage = scenaristPage;
        }
    }

    @JsonTypeName("Folder")
    public static class Folder implements IndexItem {

        private String name;
        private List<IndexItem> items;

        public Folder() {
            items = new ArrayList<>();
        }

        public Folder(String name, List<IndexItem> items) {
            this.name = name;
            this.items = items;
        }

        @Override
        @JsonIgnore
        public String getId() {
            return this.getName();
        }

        public String getName() {
            return this.name;
        }

        @Override
        public void setName(String name) {
            this.name = name;
        }

        public List<IndexItem> getItems() {
            return this.items;
        }

        public void setItems(List<IndexItem> items) {
            this.items = items;
        }

        public IndexItem findChild(String id) {
            if (id != null) {
                for (IndexItem item : items) {
                    if (id.equals(item.getId())) {
                        return item;
                    }
                }
            }
            return null;
        }

        public String generateUniqueId(String base) {
            String id = base;
            int i = 0;
            while (findChild(id) != null) {
                id = base + " " + ++i;
            }
            return id;
        }
    }

    public static class NewItemPayload {

        private List<String> path;
        private IndexItem item;
        private JsonNode payload;

        public void setPath(List<String> path) {
            this.path = path;
        }

        public List<String> getPath() {
            return path;
        }

        public IndexItem getItem() {
            return item;
        }

        public void setItem(IndexItem item) {
            this.item = item;
        }

        public JsonNode getPayload() {
            return payload;
        }

        public void setPayload(JsonNode payload) {
            this.payload = payload;
        }
    }

    public static class UpdatePayload {

        private List<String> path;
        private IndexItem item;

        public void setPath(List<String> path) {
            this.path = path;
        }

        public List<String> getPath() {
            return path;
        }

        public IndexItem getItem() {
            return item;
        }

        public void setItem(IndexItem item) {
            this.item = item;
        }
    }

    public static class MovePayload {

        private List<String> from;
        private List<String> to;
        private Integer pos;

        public List<String> getFrom() {
            return from;
        }

        public void setFrom(List<String> from) {
            this.from = from;
        }

        public List<String> getTo() {
            return to;
        }

        public void setTo(List<String> to) {
            this.to = to;
        }

        public Integer getPos() {
            return pos;
        }

        public void setPos(Integer pos) {
            this.pos = pos;
        }
    }
}
