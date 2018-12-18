/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.rest;

import com.hazelcast.core.HazelcastInstance;
import com.wegas.core.Helper;
import com.wegas.core.exception.internal.WegasForbiddenException;
import com.wegas.core.rest.util.annotations.CacheMaxAge;
import com.wegas.core.security.util.BlacklistFilter;
import java.io.IOException;
import java.io.InputStream;
import java.io.Serializable;
import java.math.BigInteger;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Objects;
import java.util.concurrent.TimeUnit;
import javax.cache.Cache;
import javax.ejb.Stateless;
import javax.inject.Inject;
import javax.servlet.ServletContext;
import javax.ws.rs.*;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.EntityTag;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Request;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.Response.ResponseBuilder;
import javax.ws.rs.core.UriInfo;
import org.apache.commons.io.IOUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * This servlet allows to retrieve several resources in a single request. Used
 * to combine .js and .css files.
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
/*
 * @todo Resulting files should be cached. For example check
 * https://github.com/smaring/javascript-combo-service/blob/master/src/main/java/org/maring/util/js/JavascriptComboService.java
 */
@Stateless
@Path("combo")
public class ComboController {

    /**
     *
     */
    final static public String MediaTypeCss = "text/css; charset=UTF-8";

    /**
     *
     */
    final static public String MediaTypeJs = "text/javascript; charset=UTF-8";

    private static final String CACHE_DISABLED_KEY = "wegas.combocache.enabled";

    //@Inject
    ///private CacheManagerHolder cacheManagerHolder;
    @Inject
    private Cache<Integer, CacheObject> cache;

    @Inject
    private HazelcastInstance hzInstance;

    private static final Logger logger = LoggerFactory.getLogger(ComboController.class);

    /**
     *
     */
    @Context
    protected UriInfo uriInfo;

    /**
     *
     */
    @Context
    private ServletContext servletContext;

    private boolean isCacheEnable() {
        return hzInstance.getAtomicLong(CACHE_DISABLED_KEY).get() == 0;
    }

    @GET
    @Path("enable")
    public void enable() throws IOException {
        this.hzInstance.getAtomicLong(CACHE_DISABLED_KEY).set(0l);
    }

    @GET
    @Path("disable")
    public void disable() throws IOException {
        this.hzInstance.getAtomicLong(CACHE_DISABLED_KEY).set(1l);
        this.clear();
    }

    @GET
    @Path("count")
    public long listCacheContent() {
        long count = 0;

        Iterator<Cache.Entry<Integer, CacheObject>> iterator = cache.iterator();
        while (iterator.hasNext()) {
            iterator.next();
            count++;
        }

        return count;
    }

    /**
     * Retrieve
     *
     * @param req
     *
     * @return HTTP 200 with requested data or HTTP forbidden response
     *
     * @throws IOException
     */
    @GET
    @Produces({MediaTypeJs, MediaTypeCss})
    @CacheMaxAge(time = 3, unit = TimeUnit.HOURS)
    public Response index(@Context Request req) throws IOException {
        try {
            //Ehcache cache = cacheManagerHolder.getInstance().getEhcache(CACHE_NAME);

            final int hash = this.uriInfo.getRequestUri().getQuery().hashCode();

            CacheObject comboCache;

            if (isCacheEnable() && cache.containsKey(hash)) { //Get from cache
                comboCache = cache.get(hash);
            } else { // build Cache.
                //final Set<String> files = this.uriInfo.getQueryParameters().keySet(); // Old version, removed cause query parameters where in the wrong order
                ArrayList<String> files = new ArrayList<>();                         // New version, with parameters in the right order
                for (String parameter : this.uriInfo.getRequestUri().getQuery().split("&")) {
                    String split = parameter.split("=")[0];
                    if (split != null) {
                        files.add(split);
                    }
                }
                files.remove("v");
                files.remove("version");
                final String mediaType = (files.iterator().next().endsWith("css"))
                        ? MediaTypeCss : MediaTypeJs;            // Select the content-type based on the first file extension
                comboCache = new CacheObject(this.getCombinedFile(files, mediaType), mediaType);
                if (isCacheEnable()) {
                    cache.put(hash, comboCache);
                }
            }
            ResponseBuilder rb = req.evaluatePreconditions(new EntityTag(comboCache.getETag()));
            if (rb != null) {
                return rb.tag(comboCache.getETag()).build();
            }
            // MediaType types[] = {"application/json", "application/xml"};
            // List<Variant> vars = Variant.mediaTypes(types).add().build();
            // Variant var = req.selectVariant(vars);
            //EntityTag etag = new EntityTag();
            //Response.ResponseBuilder responseBuilder = request.evaluatePreconditions(updateTimestamp, etag);
            return Response.ok(comboCache.getFiles())
                    .type(comboCache.getMediaType())
                    //    .expires(new Date(System.currentTimeMillis() + (1000 * 60 * 60 * 24 * 3)))
                    .tag(new EntityTag(comboCache.getETag()))
                    .build();

        } catch (WegasForbiddenException ex) {
            return Response.status(Response.Status.FORBIDDEN).entity(ex.getMessage()).build();
        }
    }

    @DELETE
    @Produces(MediaType.WILDCARD)
    public Response clear() {
        cache.clear();
        return Response.ok().build();
    }

    public String getCombinedFile(List<String> fileList, String mediaType) throws IOException, WegasForbiddenException {
        StringBuilder acc = new StringBuilder();
        for (String fileName : fileList) {
            if (BlacklistFilter.isBlacklisted(fileName)) {
                throw new WegasForbiddenException("Trying to access a blacklisted content");
            }
            try {
                InputStream fis = servletContext.getResourceAsStream(fileName);
                String content = IOUtils.toString(fis, Helper.getWegasProperty("encoding"));
                //String content = new Scanner(fis, Helper.getWegasProperty("encoding"))
                //.useDelimiter("\\A").next();                                  // Use a fake delimiter to read all lines at once

                if (mediaType.equals(MediaTypeCss)) {                     // @hack for css files, we correct the path
                    String dir = fileName.substring(0, fileName.lastIndexOf('/') + 1);
                    content = content.replaceAll("url\\(\"?\'?([^:\\)\"\']+)\"?\'?\\)",
                            "url(" + servletContext.getContextPath()
                            + dir + "$1)");                                     //Regexp to avoid rewriting protocol guess they contain ':' (http: data:)
                }
                acc.append(content).append("\n");
            } catch (NullPointerException e) {
                logger.error("Resource not found : {}", fileName);
            }
        }
        return acc.toString();
    }

    private static class CacheObject implements Serializable {

        private static final long serialVersionUID = 1L;

        private String ETag;

        private String files;

        private String mediaType;

        public CacheObject(String files, String mediaType) {
            try {
                this.files = files;
                this.mediaType = mediaType;
                MessageDigest md = MessageDigest.getInstance("MD5");
                byte[] digest = md.digest(files.getBytes(StandardCharsets.UTF_8));
                this.ETag = String.format("%1$032X", new BigInteger(1, digest));
            } catch (NoSuchAlgorithmException ex) {
                logger.error("No MD5 algorithm found");
            }
        }

        public String getETag() {
            return ETag;
        }

        public String getFiles() {
            return files;
        }

        public String getMediaType() {
            return mediaType;
        }

        @Override
        public int hashCode() {
            return this.ETag.hashCode();
        }

        @Override
        public boolean equals(Object obj) {
            if (obj == null) {
                return false;
            }
            if (getClass() != obj.getClass()) {
                return false;
            }
            final CacheObject other = (CacheObject) obj;
            return Objects.equals(this.ETag, other.ETag);
        }

    }
}
