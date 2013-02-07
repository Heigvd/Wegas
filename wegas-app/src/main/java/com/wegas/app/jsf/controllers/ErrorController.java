/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.app.jsf.controllers;

import java.io.Serializable;
import javax.faces.bean.ManagedBean;
import javax.faces.context.ExternalContext;
import javax.faces.context.FacesContext;

/**
 * Stores error message in session.
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
@ManagedBean(name = "error")
public class ErrorController implements Serializable {

    final ExternalContext externalContext = FacesContext.getCurrentInstance().getExternalContext();

    public String getErrorMessage() {
        return (String) externalContext.getSessionMap().remove("errorMessage");
    }

    public void setErrorMessage(String errorMessage) {
        externalContext.getSessionMap().put("errorMessage", errorMessage);
    }
}
