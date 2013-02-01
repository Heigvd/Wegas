package com.wegas.app.jsf.controllers;

import java.io.Serializable;
import javax.faces.bean.ManagedBean;
import javax.faces.bean.RequestScoped;
import javax.faces.context.ExternalContext;
import javax.faces.context.FacesContext;

/**
 * Stores error message in session.
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
@ManagedBean(name = "error")
@RequestScoped
public class ErrorContainer implements Serializable {

    final ExternalContext externalContext = FacesContext.getCurrentInstance().getExternalContext();

    public ErrorContainer() {
    }

    public String getErrorMessage() {
        return (String) externalContext.getSessionMap().remove("errorMessage");
    }

    public void setErrorMessage(String errorMessage) {
        externalContext.getSessionMap().put("errorMessage", errorMessage);
    }
}
