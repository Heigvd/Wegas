package com.wegas.core.security.rest;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;


import java.io.IOException;

@Path("Oidc")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class OidcController {
    private final static Logger logger = LoggerFactory.getLogger(OidcController.class);

    @GET
    @Path("Login")
    public void oidcLogin (@Context HttpServletRequest request, @Context HttpServletResponse response) throws IOException {

        response.sendRedirect("/");

    }
}