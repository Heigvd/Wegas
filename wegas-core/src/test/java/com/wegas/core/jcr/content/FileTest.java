/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.jcr.content;

import com.wegas.core.ejb.JCRFacade;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.jcr.jta.JCRTestFacade;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.primitive.NumberDescriptor;
import com.wegas.core.persistence.variable.primitive.NumberInstance;
import com.wegas.test.arquillian.AbstractArquillianTest;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Arrays;
import javax.inject.Inject;
import javax.jcr.RepositoryException;
import org.junit.After;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;

public class FileTest extends AbstractArquillianTest {

    @Inject
    private JCRTestFacade jcrTestFacade;

    @Inject
    private JCRFacade jcrFacade;

    @Before
    public void before() throws RepositoryException {
    }

    @After
    public void after() throws RepositoryException {
    }

    @Test
    public void testFileUpdate() throws RepositoryException, IOException {
        byte[] initialContent = {0, 1, 2, 3};
        InputStream initialFile = new ByteArrayInputStream(initialContent);
        jcrFacade.createFile(gameModel.getId(), ContentConnector.WorkspaceType.FILES, "firstFile", "/", "text/plain", "note", "description", initialFile, Boolean.TRUE);

        InputStream file = jcrFacade.getFile(gameModel.getId(), ContentConnector.WorkspaceType.FILES, "/firstFile");

        byte[] read = new byte[100];
        int fileSize = file.read(read);
        byte[] file1ReadContent = Arrays.copyOf(read, fileSize);

        Assert.assertTrue("File 1 content not match", Arrays.equals(initialContent, file1ReadContent));

        byte[] newContent = {2, 2, 2, 2};
        InputStream newFile = new ByteArrayInputStream(newContent);
        // update file
        jcrFacade.createFile(gameModel.getId(), ContentConnector.WorkspaceType.FILES, "firstFile", "/", "text/plain", "note", "description", newFile, Boolean.TRUE);

        InputStream newReadfile = jcrFacade.getFile(gameModel.getId(), ContentConnector.WorkspaceType.FILES, "/firstFile");

        fileSize = newReadfile.read(read);
        byte[] newFileReadContent = Arrays.copyOf(read, fileSize);

        Assert.assertTrue("File content after update not match", Arrays.equals(newContent, newFileReadContent));

    }

    @Test
    public void testDirectoryNotExists() throws RepositoryException, IOException {
        byte[] initialContent = {0, 1, 2, 3};
        InputStream initialFile = new ByteArrayInputStream(initialContent);
        try {
            jcrFacade.createFile(gameModel.getId(),
                ContentConnector.WorkspaceType.FILES,
                "firstFile", "/subdir1",
                "text/plain", "note",
                "description", initialFile, Boolean.TRUE);

            Assert.fail("Should not be possible to create a file in a non existing folder");
        } catch (WegasErrorMessage ex) {
            // this is expected
        }

        // create the missing directory
        jcrFacade.createDirectory(gameModel, ContentConnector.WorkspaceType.FILES,
            "subdir1", "/", "", "");

        // and retry to create the file
        jcrFacade.createFile(gameModel.getId(),
            ContentConnector.WorkspaceType.FILES,
            "firstFile", "/subdir1",
            "text/plain", "note",
            "description", initialFile, Boolean.TRUE);

        InputStream file = jcrFacade.getFile(gameModel.getId(),
            ContentConnector.WorkspaceType.FILES, "/subdir1/firstFile");

        byte[] read = new byte[100];
        int fileSize = file.read(read);
        byte[] file1ReadContent = Arrays.copyOf(read, fileSize);

        Assert.assertTrue("File 1 content not match",
            Arrays.equals(initialContent, file1ReadContent));
    }

    @Test
    public void testDirectoriesNotExists() throws RepositoryException, IOException {
        byte[] initialContent = {0, 1, 2, 3};
        InputStream initialFile = new ByteArrayInputStream(initialContent);
        try {
            jcrFacade.createFile(gameModel.getId(),
                ContentConnector.WorkspaceType.FILES,
                "firstFile", "/subdir1/subdir2/subdir3/",
                "text/plain", "note",
                "description", initialFile, Boolean.TRUE);

            Assert.fail("Should not be possible to create a file in a non existing folder");
        } catch (WegasErrorMessage ex) {
            // this is expected
        }

        jcrFacade.createDirectoryWithParents(gameModel,
            ContentConnector.WorkspaceType.FILES,
            "subdir1/subdir2/subdir3");

        jcrFacade.createFile(gameModel.getId(),
            ContentConnector.WorkspaceType.FILES,
            "firstFile", "/subdir1/subdir2/subdir3/",
            "text/plain", "note",
            "description", initialFile, Boolean.TRUE);

        InputStream file = jcrFacade.getFile(gameModel.getId(),
            ContentConnector.WorkspaceType.FILES, "/subdir1/subdir2/subdir3/firstFile");

        byte[] read = new byte[100];
        int fileSize = file.read(read);
        byte[] file1ReadContent = Arrays.copyOf(read, fileSize);

        Assert.assertTrue("File 1 content not match",
            Arrays.equals(initialContent, file1ReadContent));
    }

    @Test
    public void testFileRollback() throws RepositoryException, IOException {

        // first descriptor
        NumberDescriptor desc1 = new NumberDescriptor("x");
        desc1.setDefaultInstance(new NumberInstance(0));

        variableDescriptorFacade.create(gameModel.getId(), desc1);

        // second descriptor
        NumberDescriptor desc2 = new NumberDescriptor("y");
        desc2.setDefaultInstance(new NumberInstance(0));

        variableDescriptorFacade.create(gameModel.getId(), desc2);

        byte[] file1Content = {0, 1, 2, 3};
        jcrTestFacade.addAFile(gameModel.getId(), "firstFile", file1Content);

        InputStream file = jcrFacade.getFile(gameModel.getId(), ContentConnector.WorkspaceType.FILES, "/firstFile");

        byte[] read = new byte[100];
        int fileSize = file.read(read);

        byte[] file1ReadContent = Arrays.copyOf(read, fileSize);

        Assert.assertTrue("File 1 content not match", Arrays.equals(file1Content, file1ReadContent));

        try {
            byte[] file2Content = {2, 2, 2, 2};
            jcrTestFacade.addFileAndRename(gameModel.getId(), "secondFile", file2Content, "a");
            jcrTestFacade.addPageAndRename(gameModel.getId(), "c name", "3", "a");
            Assert.fail("Transaction should have been rejeced");
        } catch (RuntimeException ex) {
            logger.error("Runtime exception: {}", ex);
        }

        // no file2
        file = jcrFacade.getFile(gameModel.getId(), ContentConnector.WorkspaceType.FILES, "/secondFile");
        Assert.assertNull("File2 should not exist", file);

        // no rename
        GameModel gm = gameModelFacade.find(gameModel.getId());
        for (VariableDescriptor vd : gm.getVariableDescriptors()) {
            logger.error("VD: {}", vd);
            Assert.assertNotEquals("a", vd.getName());
        }
    }
}
