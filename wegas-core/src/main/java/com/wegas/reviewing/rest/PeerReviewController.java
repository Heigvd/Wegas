/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.reviewing.rest;

import com.wegas.core.ejb.GameFacade;
import com.wegas.core.ejb.PlayerFacade;
import com.wegas.core.ejb.RequestFacade;
import com.wegas.core.ejb.VariableDescriptorFacade;
import com.wegas.core.ejb.VariableInstanceFacade;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.exception.client.WegasScriptException;
import com.wegas.core.exception.internal.NoPlayerException;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.core.persistence.variable.scope.AbstractScope;
import com.wegas.core.security.ejb.UserFacade;
import com.wegas.core.security.util.SecurityHelper;
import com.wegas.reviewing.ejb.ReviewingFacade;
import com.wegas.reviewing.persistence.PeerReviewDescriptor;
import com.wegas.reviewing.persistence.PeerReviewInstance;
import com.wegas.reviewing.persistence.Review;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import org.apache.shiro.authz.UnauthorizedException;

/**
 *
 * @author Maxence Laurent (maxence.laurent gmail.com)
 */
@Stateless
@Path("GameModel/{gameModelId : [1-9][0-9]*}/VariableDescriptor/PeerReviewController/")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class PeerReviewController {

    /**
     *
     */
    @EJB
    private ReviewingFacade reviewFacade;
    /**
     *
     */
    @EJB
    private RequestFacade requestFacade;
    /**
     *
     */
    @EJB
    private UserFacade userFacade;
    /**
     *
     */
    @EJB
    private PlayerFacade playerFacade;

    @EJB
    private VariableDescriptorFacade descriptorFacade;

    @EJB
    private VariableInstanceFacade instanceFacade;

    @EJB
    private GameFacade gameFacade;

    @GET
    @Path("/{reviewDescriptorId : [1-9][0-9]*}/ToReview/{reviewId : [1-9][0-9]*}")
    public VariableInstance getInstanceToReview(
            @PathParam("reviewDescriptorId") Long prdId,
            @PathParam("reviewId") Long rId) throws WegasScriptException {

        try {
            Review review = reviewFacade.findReview(rId);
            PeerReviewInstance authorInstance = review.getAuthor();
            assertReviewReadRight(review);
            
            PeerReviewDescriptor prd = (PeerReviewDescriptor) authorInstance.getDescriptor();
            
            VariableDescriptor toReview = prd.getToReview();
            Player author = instanceFacade.findAPlayer(authorInstance);
            
            return toReview.getInstance(author);
        } catch (NoPlayerException ex) {
            throw WegasErrorMessage.error("Unable to find a player");
        }
    }

    /**
     *
     * @param playerId
     * @param prdId
     * @return
     * @throws com.wegas.core.exception.client.WegasScriptException
     */
    @POST
    @Path("/{reviewDescriptorId : [1-9][0-9]*}/Submit/{playerId : [1-9][0-9]*}")
    public Response submit(
            @PathParam("playerId") Long playerId,
            @PathParam("reviewDescriptorId") Long prdId) throws WegasScriptException {

        checkPermissions(playerFacade.find(playerId).getGame(), playerId);

        reviewFacade.submit(prdId, playerId);

        return Response.ok().build();
    }

    @POST
    @Path("/{reviewDescriptorId : [1-9][0-9]*}/Dispatch/{gameId: [1-9][0-9]*}")
    public Response dispatch(
            @PathParam("reviewDescriptorId") Long prdId,
            @PathParam("gameId") Long gameId
    ) {
        assertTeacherRight(prdId, gameId);
        reviewFacade.dispatch(prdId);
        return Response.ok().build();
    }

    private void assertTeacherRight(Long prdId, Long gameId) {
        List<Game> games = descriptorFacade.find(prdId).getGameModel().getGames();
        Game game = gameFacade.find(gameId);

        if (!(games.contains(game)
                && SecurityHelper.isPermitted(game, "Edit"))) {
            throw new UnauthorizedException();
        }
    }

    private void assertReviewReadRight(Review r) {
        PeerReviewInstance pri = reviewFacade.getPeerReviewInstanceFromReview(r);
        Game game = instanceFacade.findGame(pri);

        if (!((SecurityHelper.isPermitted(game, "Edit")) || // Teacher/Scenarist
                (pri.getToReview().contains(r))
                || (pri.getReviewed().contains(r)))) { // Author when review the feedback
            throw new UnauthorizedException(); // Not one of this case ? NOT AUTHORIZED
        }
    }

    private void assertReviewRight(Review r) {
        PeerReviewInstance pri = reviewFacade.getPeerReviewInstanceFromReview(r);
        Game game = instanceFacade.findGame(pri);

        if (!((SecurityHelper.isPermitted(game, "Edit")) || // Teacher/Scenarist
                (r.getStatus() == Review.ReviewState.DISPATCHED && pri.getToReview().contains(r)) // Reviewer when reviewing
                || (r.getStatus() == Review.ReviewState.NOTIFIED && pri.getReviewed().contains(r)))) { // Author when review the feedback
            throw new UnauthorizedException(); // Not one of this case ? NOT AUTHORIZED
        }
    }

    @POST
    @Path("/SaveReview")
    public PeerReviewInstance saveReview(Review other) {
        Review review = reviewFacade.findReview(other.getId());
        PeerReviewInstance instance = reviewFacade.getPeerReviewInstanceFromReview(review);
        assertReviewRight(review);
        reviewFacade.saveReview(instance, other);
        return instance;
    }

    @POST
    @Path("/SubmitReview")
    public PeerReviewInstance submitReview(Review review) {
        assertReviewRight(reviewFacade.findReview(review.getId()));
        Review submitedReview = reviewFacade.submitReview(review);
        return reviewFacade.getPeerReviewInstanceFromReview(submitedReview);
    }

    @POST
    @Path("/{reviewDescriptorId : [1-9][0-9]*}/Notify/{gameId: [1-9][0-9]*}")
    public Response notify(
            @PathParam("reviewDescriptorId") Long prdId,
            @PathParam("gameId") Long gameId
    ) {
        assertTeacherRight(prdId, gameId);
        reviewFacade.notify(prdId);
        return Response.ok().build();
    }

    @POST
    @Path("/{reviewDescriptorId : [1-9][0-9]*}/Close/{gameId: [1-9][0-9]*}")
    public Response close(
            @PathParam("reviewDescriptorId") Long prdId,
            @PathParam("gameId") Long gameId
    ) {
        assertTeacherRight(prdId, gameId);
        reviewFacade.close(prdId);
        return Response.ok().build();
    }

    private void checkPermissions(Game game, Long playerId) throws UnauthorizedException {
        if (!SecurityHelper.isPermitted(game, "Edit") && !userFacade.matchCurrentUser(playerId)) {
            throw new UnauthorizedException();
        }
    }
}
