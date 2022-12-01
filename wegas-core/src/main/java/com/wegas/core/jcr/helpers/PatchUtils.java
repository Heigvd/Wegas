/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2022 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.jcr.helpers;

import com.wegas.core.Helper;
import com.wegas.core.ejb.GameModelFacade.RecombinedGameModel;
import com.wegas.core.jcr.content.AbstractContentDescriptor;
import com.wegas.core.jcr.content.ContentConnector;
import com.wegas.core.jcr.content.DescriptorFactory;
import com.wegas.core.jcr.content.DirectoryDescriptor;
import com.wegas.core.jcr.content.FileDescriptor;
import com.wegas.core.merge.patch.WegasEntityPatch;
import com.wegas.core.merge.patch.WegasPatch.PatchDiff;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.variable.ModelScoped;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.attribute.FileTime;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import javax.jcr.RepositoryException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Some tools to compute diffs and patch JCR repositories
 *
 * @author maxence
 */
public class PatchUtils {

    private static final Logger logger = LoggerFactory.getLogger(PatchUtils.class);

    /**
     * Compute the difference between a JCR File repo and the one from a recombined gameModel.
     *
     * @param combined  the recombined exploded gameModel
     * @param connector connector to the JCR repository
     *
     * @return the diff between repositories
     *
     * @throws RepositoryException something went wrong
     * @throws IOException         something went wrong
     */
    public static PatchDiff getFilesDiff(RecombinedGameModel combined, ContentConnector connector) throws RepositoryException, IOException {
        DetachedContentDescriptor newRepo = buildDetachedRepo(combined);
        AbstractContentDescriptor jcrRoot = DescriptorFactory.getDescriptor("/", connector);
        DetachedContentDescriptor currentRepo = buildDetachedRepo(jcrRoot);

        WegasEntityPatch diff = new WegasEntityPatch(currentRepo, newRepo, true);
        return diff.diffForce();

    }

    /**
     * Update JCR FILE repo so it will equal the repo from the recombined gameModel.
     *
     * @param combined  recombined gameMidel which contains the new version of the repo
     * @param gameModel the which contains the JCR repo to patch
     * @param connector the connector to this JCR repo
     *
     * @return the just applied diff
     *
     * @throws RepositoryException something went wrong
     * @throws IOException         something went wrong
     */
    public static PatchDiff doPatch(RecombinedGameModel combined, GameModel gameModel, ContentConnector connector) throws RepositoryException, IOException {
        DetachedContentDescriptor newRepo = buildDetachedRepo(combined);
        AbstractContentDescriptor jcrRoot = DescriptorFactory.getDescriptor("/", connector);
        DetachedContentDescriptor currentRepo = buildDetachedRepo(jcrRoot);

        WegasEntityPatch diff = new WegasEntityPatch(currentRepo, newRepo, true);
        diff.apply(gameModel, currentRepo);
        return diff.diffForce();

    }

    /**
     * Find path in the given root. If the path does not exists, create the node. If the path ends
     * with a "/", the node will be a directory. If not, the node will be a file.
     *
     * @param root         root folder
     * @param relativePath path of the node, starter from root. Null path means root
     *
     * @return the node
     */
    private static DetachedContentDescriptor getOrCreateNode(DetachedDirectoryDescriptor root, String relativePath) {
        if (Helper.isNullOrEmpty(relativePath) || "/".equals(relativePath)) {
            return root;
        }

        String path = relativePath;
        if (path.startsWith("/")) {
            path = path.substring(1);
        }
        String[] segments = path.split(("/"));

        if (segments.length > 0) {
            String name = segments[0];
            Optional<DetachedContentDescriptor> find = root.getChildren().stream().filter(c -> c.getName().equals(name)).findFirst();

            DetachedContentDescriptor child = null;

            if (find.isEmpty()) {
                boolean isDirectory = segments.length > 1 || path.endsWith("/");
                String parentPath = root.getRefId();
                if (isDirectory) {
                    child = new DetachedDirectoryDescriptor();
                    // directory name always ends with a slash
                    child.setRefId(parentPath + name + "/");
                    child.setMimeType(DirectoryDescriptor.MIME_TYPE);
                } else {
                    child = new DetachedFileDescriptor();
                    child.setRefId(parentPath + name);
                }
                child.setName(name);
                child.setParent(root);
                root.getChildren().add(child);
            } else {
                child = find.get();
            }

            if (segments.length > 1) {
                String subPath = path.replaceFirst(name, "");
                return getOrCreateNode((DetachedDirectoryDescriptor) child, subPath);
            } else {
                return child;
            }
        }

        return null;
    }

    /**
     * Init detached content meta. If given meta is null. Default meta will be used (empty desc and
     * note; PRIVATE visibility; no MIME-type)
     *
     * @param item the content to set meta for
     * @param meta the meta, may be null
     */
    private static void setMeta(DetachedContentDescriptor item, FileMeta meta) {
        if (meta != null) {
            item.setDescription(meta.getDescription());
            item.setNote(meta.getNote());
            item.setMimeType(meta.getMimeType());
            item.setVisibility(meta.getVisibility());
        } else {
            item.setDescription("");
            item.setNote("");
            item.setVisibility(ModelScoped.Visibility.PRIVATE);
        }
    }

    /**
     * Build a detached FILES repository from a recombined gamemodel (ie. recombined exploded ZIP
     * export).
     *
     * @param gm the recombined gameModel
     *
     * @return the root node of the repository
     */
    public static DetachedContentDescriptor buildDetachedRepo(RecombinedGameModel gm) {
        Set<String> directories = gm.getDirectories();
        Map<String, FileMeta> filesMeta = gm.getFilesMeta();

        Map<String, FileTime> modificationTimes = gm.getModificationTimes();
        Map<String, byte[]> filesData = gm.getFilesData();

        DetachedDirectoryDescriptor root = new DetachedDirectoryDescriptor();
        root.setRefId("/");
        root.setName("");
        root.setMimeType(DirectoryDescriptor.MIME_TYPE);

        directories.forEach(dir -> {
            DetachedContentDescriptor item = getOrCreateNode(root, dir);
            setMeta(item, filesMeta.get(dir));
            item.setMimeType(DirectoryDescriptor.MIME_TYPE);
        });

        filesData.entrySet().forEach(entry -> {
            String path = entry.getKey();
            byte[] bytes = entry.getValue();
            DetachedFileDescriptor item = (DetachedFileDescriptor) getOrCreateNode(root, path);
            setMeta(item, filesMeta.get(path));

            if (Helper.isNullOrEmpty(item.getMimeType())) {
                // still no mimeType, probe from fileName
                String mimeType = null;
                try {
                    mimeType = Files.probeContentType(new File(path).toPath());
                } catch (IOException ex) {
                    logger.warn("Faild to probe mime type");
                }
                if (mimeType == null) {
                    // still no mimeType, use very default one
                    mimeType = "application/octet-stream";
                }
                item.setMimeType(mimeType);
            }

            FileTime mTime = modificationTimes.get(path);
            if (mTime != null) {
                long instant = mTime.toInstant().toEpochMilli();
                Calendar date = new Calendar.Builder().setInstant(instant).build();
                item.setDataLastModified(date);
            }
            item.setData(new FileDescriptor.FileContent(bytes));
        });

        return root;
    }

    /**
     * Build a detached FILES repository from a LIVE JCR one.
     *
     * @param jcrNode the JCR root to detach
     *
     * @return the root node of the detached repository
     */
    public static DetachedContentDescriptor buildDetachedRepo(AbstractContentDescriptor jcrNode) throws RepositoryException, IOException {

        DetachedContentDescriptor node = null;

        if (jcrNode instanceof DirectoryDescriptor) {
            DirectoryDescriptor jcrDir = (DirectoryDescriptor) jcrNode;
            List<DetachedContentDescriptor> children = new ArrayList<>();
            for (AbstractContentDescriptor child : jcrDir.getChildren()) {
                children.add(buildDetachedRepo(child));
            }
            DetachedDirectoryDescriptor dir = new DetachedDirectoryDescriptor();
            dir.setChildren(children);
            dir.setJcrDirectory(jcrDir);
            children.forEach(c -> c.setParent(dir));
            node = dir;
        } else if (jcrNode instanceof FileDescriptor) {
            FileDescriptor jcrFile = (FileDescriptor) jcrNode;
            DetachedFileDescriptor file = new DetachedFileDescriptor();
            file.setData(jcrFile.getData());
            file.setDataLastModified(jcrFile.getDataLastModified());
            file.setJcrFile(jcrFile);
            node = file;
        }

        if (node != null) {
            node.setRefId(jcrNode.getFullPath());
            node.setName(jcrNode.getName());
            node.setDescription(jcrNode.getDescription());
            node.setNote(jcrNode.getNote());
            node.setMimeType(jcrNode.getMimeType());
            node.setVisibility(jcrNode.getVisibility());
        }
        return node;
    }
}
