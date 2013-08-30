/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.rest;

import com.sun.jersey.multipart.FormDataParam;
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

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
@Stateless
@Path("Download")
public class DownloadController {

    @POST
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Path("{filename}")
    public static Response forward(@FormDataParam("ctype") String contentType, @PathParam("filename") String filename, @FormDataParam("data") final String data) {
        return Response.ok(new StreamingOutput() {
            @Override
            public void write(OutputStream out) throws IOException, WebApplicationException {
                out.write(data.getBytes(Charset.forName("ISO-8859-1")));
            }
        }, contentType).header("Content-Disposition", "attachment; filename=" + filename).build();
    }
}
