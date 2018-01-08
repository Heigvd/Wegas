/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.rest;

import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.Charset;
import javax.ejb.Stateless;
import javax.ws.rs.Consumes;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.StreamingOutput;
import org.glassfish.jersey.media.multipart.FormDataParam;

/**
 *
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
@Stateless
@Path("Download")
public class DownloadController {

    /**
     *
     * @param contentType
     * @param filename
     * @param data
     * @return requested data
     */
    @POST
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Path("{filename}")
    public static Response forward(@FormDataParam("ctype") String contentType, @PathParam("filename") String filename, @FormDataParam("data") final String data) {
        return Response.ok(new StreamingOutput() {
            @Override
            public void write(OutputStream out) throws IOException, WebApplicationException {
                out.write(new byte[]{(byte) 0xEF, (byte) 0xBB, (byte) 0xBF}); //UTF8 BOM
                out.write(data.getBytes(Charset.forName("UTF-8")));
            }
        }, contentType).header("Content-Disposition", "attachment; filename=" + filename).build();
    }
}
