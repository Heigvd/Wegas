/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.jcr.jta;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.wegas.core.ejb.GameModelFacade;
import com.wegas.core.ejb.JCRFacade;
import com.wegas.core.ejb.PageFacade;
import com.wegas.core.jcr.content.ContentConnector;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.variable.VariableDescriptor;
import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.io.Serializable;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.inject.Inject;
import javax.jcr.RepositoryException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author maxence
 */
@Stateless
@LocalBean
public class JCRTestFacade implements Serializable {

    private static final long serialVersionUID = 1846424154537238821L;
    private static final Logger logger = LoggerFactory.getLogger(JCRTestFacade.class);

    @Inject
    private PageFacade pageFacade;

    @Inject
    private JCRFacade jcrFacade;

    @Inject
    private GameModelFacade gameModelFacade;

    public void addPageAndRename(Long gameModelId, String pageName, String pageId, String varName) throws RepositoryException, JsonProcessingException {
        this.addAPage(gameModelId, pageName, pageId);
        this.renameAllVariables(gameModelId, varName);
    }

    public void addFileAndRename(Long gameModelId, String filename, byte[] content, String varName) throws RepositoryException {
        this.addAFile(gameModelId, filename, content);
        this.renameAllVariables(gameModelId, varName);
    }

    public void addAFile(Long gameModelId, String filename, byte[] buffer) throws RepositoryException {

        InputStream inputStream;
        inputStream = new ByteArrayInputStream(buffer);

        jcrFacade.createFile(gameModelId, ContentConnector.WorkspaceType.FILES, filename, "/", "text/plain", "note", "description", inputStream, Boolean.TRUE);

    }

    /**
     * Update JPA entities and pages but JPA changes will trigger a PSQLException
     *
     * @param gameModelId
     * @param newName
     */
    public void renameAllVariables(Long gameModelId, String newName) {
        GameModel gameModel = gameModelFacade.find(gameModelId);

        for (VariableDescriptor vd : gameModel.getVariableDescriptors()) {
            logger.error("Reset name {}", vd);
            vd.setName(newName);
            logger.error(" -> {}", vd);
        }
        logger.error("All done");
    }

    public void addAPage(Long gameModelId, String name, String id) throws RepositoryException, JsonProcessingException {
        GameModel gameModel = gameModelFacade.find(gameModelId);

        JsonNodeFactory factory = new JsonNodeFactory(false);

        JsonNode newPage = factory.objectNode()
                .put("type", "AbsoluteLayout")
                .put("@name", name);
        pageFacade.createPage(gameModel, id, newPage);
    }

}
