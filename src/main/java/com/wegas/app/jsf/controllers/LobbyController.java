package com.wegas.app.jsf.controllers;

import com.wegas.admin.jsf.controllers.*;
import com.wegas.core.persistence.game.GameEntity;
import com.wegas.admin.jsf.util.JsfUtil;
import com.wegas.admin.jsf.util.PaginationHelper;
import com.wegas.core.ejb.GameEntityFacade;

import java.io.Serializable;
import java.util.ResourceBundle;
import javax.ejb.EJB;
import javax.faces.bean.ManagedBean;
import javax.faces.bean.SessionScoped;
import javax.faces.component.UIComponent;
import javax.faces.context.FacesContext;
import javax.faces.convert.Converter;
import javax.faces.convert.FacesConverter;
import javax.faces.model.DataModel;
import javax.faces.model.ListDataModel;
import javax.faces.model.SelectItem;

/**
 * 
 * @author fx
 */
@ManagedBean(name = "lobbyController")
@SessionScoped
public class LobbyController implements Serializable {

    private GameEntity current;
    private DataModel items = null;
    @EJB
    private com.wegas.core.ejb.GameEntityFacade ejbFacade;
    private PaginationHelper pagination;
    private int selectedItemIndex;

    /**
     * 
     */
    public LobbyController() {
    }

    /**
     * 
     * @return
     */
    public GameEntity getSelected() {
        if (current == null) {
            current = new GameEntity();
            selectedItemIndex = -1;
        }
        return current;
    }

    private GameEntityFacade getFacade() {
        return ejbFacade;
    }

    /**
     * 
     * @return
     */
    public PaginationHelper getPagination() {
        if (pagination == null) {
            pagination = new PaginationHelper(10) {

                @Override
                public int getItemsCount() {
                    return getFacade().count();
                }

                @Override
                public DataModel createPageDataModel() {
                    return new ListDataModel(getFacade().findRange(new int[]{getPageFirstItem(), getPageFirstItem() + getPageSize()}));
                }
            };
        }
        return pagination;
    }

    /**
     * 
     * @return
     */
    public String prepareList() {
        recreateModel();
        return "List";
    }

    /**
     * 
     * @return
     */
    public String prepareView() {
        current = (GameEntity) getItems().getRowData();
        selectedItemIndex = pagination.getPageFirstItem() + getItems().getRowIndex();
        return "View";
    }

    /**
     * 
     * @return
     */
    public String prepareCreate() {
        current = new GameEntity();
        selectedItemIndex = -1;
        return "Create";
    }

    /**
     * 
     * @return
     */
    public String create() {
        try {
            getFacade().create(current);
            JsfUtil.addSuccessMessage(ResourceBundle.getBundle("/wegas-admin-bundle").getString("GameEntityCreated"));
            return prepareCreate();
        } catch (Exception e) {
            JsfUtil.addErrorMessage(e, ResourceBundle.getBundle("/wegas-admin-bundle").getString("PersistenceErrorOccured"));
            return null;
        }
    }

    /**
     * 
     * @return
     */
    public String prepareEdit() {
        current = (GameEntity) getItems().getRowData();
        selectedItemIndex = pagination.getPageFirstItem() + getItems().getRowIndex();
        return "Edit";
    }

    /**
     * 
     * @return
     */
    public String update() {
        try {
            getFacade().edit(current);
            JsfUtil.addSuccessMessage(ResourceBundle.getBundle("/wegas-admin-bundle").getString("GameEntityUpdated"));
            return "View";
        } catch (Exception e) {
            JsfUtil.addErrorMessage(e, ResourceBundle.getBundle("/wegas-admin-bundle").getString("PersistenceErrorOccured"));
            return null;
        }
    }

    /**
     * 
     * @return
     */
    public String destroy() {
        current = (GameEntity) getItems().getRowData();
        selectedItemIndex = pagination.getPageFirstItem() + getItems().getRowIndex();
        performDestroy();
        recreatePagination();
        recreateModel();
        return "List";
    }

    /**
     * 
     * @return
     */
    public String destroyAndView() {
        performDestroy();
        recreateModel();
        updateCurrentItem();
        if (selectedItemIndex >= 0) {
            return "View";
        } else {
            // all items were removed - go back to list
            recreateModel();
            return "List";
        }
    }

    private void performDestroy() {
        try {
            getFacade().remove(current);
            JsfUtil.addSuccessMessage(ResourceBundle.getBundle("/wegas-admin-bundle").getString("GameEntityDeleted"));
        } catch (Exception e) {
            JsfUtil.addErrorMessage(e, ResourceBundle.getBundle("/wegas-admin-bundle").getString("PersistenceErrorOccured"));
        }
    }

    private void updateCurrentItem() {
        int count = getFacade().count();
        if (selectedItemIndex >= count) {
            // selected index cannot be bigger than number of items:
            selectedItemIndex = count - 1;
            // go to previous page if last page disappeared:
            if (pagination.getPageFirstItem() >= count) {
                pagination.previousPage();
            }
        }
        if (selectedItemIndex >= 0) {
            current = getFacade().findRange(new int[]{selectedItemIndex, selectedItemIndex + 1}).get(0);
        }
    }

    /**
     * 
     * @return
     */
    public DataModel getItems() {
        if (items == null) {
            items = getPagination().createPageDataModel();
        }
        return items;
    }

    private void recreateModel() {
        items = null;
    }

    private void recreatePagination() {
        pagination = null;
    }

    /**
     * 
     * @return
     */
    public String next() {
        getPagination().nextPage();
        recreateModel();
        return "List";
    }

    /**
     * 
     * @return
     */
    public String createUser() {
        getPagination().previousPage();
        recreateModel();
        return "List";
    }

    /**
     * 
     * @return
     */
    public SelectItem[] getItemsAvailableSelectMany() {
        return JsfUtil.getSelectItems(ejbFacade.findAll(), false);
    }

    /**
     * 
     * @return
     */
    public SelectItem[] getItemsAvailableSelectOne() {
        return JsfUtil.getSelectItems(ejbFacade.findAll(), true);
    }

}
