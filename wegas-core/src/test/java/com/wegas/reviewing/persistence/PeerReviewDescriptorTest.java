/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.reviewing.persistence;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wegas.core.ejb.AbstractEJBTest;
import com.wegas.core.ejb.PlayerFacade;
import com.wegas.core.ejb.RequestFacade;
import com.wegas.core.ejb.TeamFacade;
import com.wegas.core.persistence.variable.primitive.NumberDescriptor;
import com.wegas.core.persistence.variable.primitive.NumberInstance;
import com.wegas.core.rest.util.JacksonMapperProvider;
import com.wegas.reviewing.persistence.evaluation.CategorizedEvaluationDescriptor;
import com.wegas.reviewing.persistence.evaluation.EvaluationDescriptor;
import com.wegas.reviewing.persistence.evaluation.EvaluationDescriptorContainer;
import com.wegas.reviewing.persistence.evaluation.GradeDescriptor;
import com.wegas.reviewing.persistence.evaluation.TextEvaluationDescriptor;
import java.io.IOException;
import java.util.List;
import javax.naming.NamingException;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import static org.junit.Assert.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
public class PeerReviewDescriptorTest extends AbstractEJBTest {

    private static TeamFacade teamFacade;
    private static PlayerFacade playerFacade;
    private static final Logger logger = LoggerFactory.getLogger(PeerReviewDescriptorTest.class);

    static {
        try {
            teamFacade = lookupBy(TeamFacade.class);
            playerFacade = lookupBy(PlayerFacade.class);
        } catch (NamingException ex) {
            logger.error("Lookup error", ex);
        }
    }

    ObjectMapper mapper;

    NumberDescriptor toBeReviewed;

    PeerReviewDescriptor initial;

    PeerReviewInstance defaultInstance;

    private final Integer MAX_NUM = 4;
    private final String VAR_NAME = "x";

    public PeerReviewDescriptorTest() {
    }

    /**
     *
     * @throws NamingException
     */
    @Before
    public void setUpInstances() throws NamingException {
        mapper = JacksonMapperProvider.getMapper();

        toBeReviewed = new NumberDescriptor(VAR_NAME);
        toBeReviewed.setDefaultInstance(new NumberInstance(0));

        descriptorFacade.create(gameModel.getId(), toBeReviewed);

        initial = new PeerReviewDescriptor("myReview");

        defaultInstance = new PeerReviewInstance();
        defaultInstance.setReviewState(PeerReviewDescriptor.ReviewingState.NOT_STARTED);
        initial.setDefaultInstance(defaultInstance);

        System.out.println("Create REVIEW");

        //initial.setScope(new TeamScope());
        initial.setComments("comments");
        initial.setMaxNumberOfReview(MAX_NUM);
        initial.setToReviewName(toBeReviewed.getName());

        initial.setFeedback(new EvaluationDescriptorContainer());
        EvaluationDescriptorContainer feedback = initial.getFeedback();
        List<EvaluationDescriptor> fEvaluations = feedback.getEvaluations();
        fEvaluations.add(new TextEvaluationDescriptor("aText"));
        fEvaluations.add(new GradeDescriptor("Note", 1L, 10L));

        CategorizedEvaluationDescriptor cEvalD = new CategorizedEvaluationDescriptor("categ");
        cEvalD.addCategory("weak");
        cEvalD.addCategory("strong");
        fEvaluations.add(cEvalD);

        initial.setFeedbacksEvaluation(new EvaluationDescriptorContainer());
        EvaluationDescriptorContainer feedbackEvaluation = initial.getFeedbackEvaluation();
        List<EvaluationDescriptor> f2evaluations = feedbackEvaluation.getEvaluations();
        f2evaluations.add(new GradeDescriptor("fevalG", 0L, null));

        descriptorFacade.create(gameModel.getId(), initial);
        System.out.println("SETTED UP");
    }

    @After
    public void tearDownLocal() {
        System.out.println("Tear Down");
    }

    @Test
    public void testSetters() {
        System.out.println("Setters");
        assertEquals("Number initial value", initial.getMaxNumberOfReview(), MAX_NUM);
        assertEquals("Var name initial", initial.getToReviewName(), VAR_NAME);
        System.out.println("DONE");
    }

    /**
     * Test of merge method, of class PeerReviewDescriptor.
     *
     * @throws java.io.IOException
     */
    @Test
    public void testSerialise() throws IOException {
        RequestFacade.lookup().setPlayer(player.getId());
        System.out.println("SERIALISE: " + initial);

        String json = mapper.writeValueAsString(initial);
        System.out.println("JSON: " + json);

        PeerReviewDescriptor read = mapper.readValue(json, PeerReviewDescriptor.class);

        assertEquals("Name", initial.getName(), read.getName());
        assertEquals("Comments", initial.getComments(), read.getComments());
        assertEquals("NumberOfReview", initial.getMaxNumberOfReview(), read.getMaxNumberOfReview());
        assertEquals("ImportedName", VAR_NAME, read.getImportedToReviewName());

        assertEquals("# Feedback Items", 3, read.getFeedback().getEvaluations().size());
        assertEquals("# Feedback Eval Items", 1, read.getFeedbackEvaluation().getEvaluations().size());
    }

    @Test
    public void deserialize() throws IOException {
        String json = "{ \"@class\": \"PeerReviewDescriptor\", \"id\": \"\", \"label\": \"rr\", \"toReviewName\": \"x\", \"name\": \"\", \"maxNumberOfReview\": 3, \"feedback\": { \"@class\": \"EvaluationDescriptorContainer\" }, \"feedbackEvaluation\": { \"@class\": \"EvaluationDescriptorContainer\" }, \"defaultInstance\": { \"@class\": \"PeerReviewInstance\", \"id\": \"\" }, \"comments\": \"\", \"scope\": { \"@class\": \"TeamScope\", \"broadcastScope\": \"TeamScope\" } }";

        PeerReviewDescriptor read = mapper.readValue(json, PeerReviewDescriptor.class);
        descriptorFacade.create(gameModel.getId(), read);
        
        String json2 = mapper.writeValueAsString(read);
    }

    @Test
    public void testMerge() throws IOException {
        System.out.println("MERGE");

        PeerReviewDescriptor merged = new PeerReviewDescriptor("another");
        merged.setToReviewName(VAR_NAME);
        merged.setDefaultInstance(new PeerReviewInstance());
        descriptorFacade.create(gameModel.getId(), merged);

        merged.merge(initial);

        System.out.println("Initial: " + mapper.writeValueAsString(initial));
        System.out.println("Merged: " + mapper.writeValueAsString(merged));

        assertEquals("Name", initial.getName(), merged.getName());
        assertEquals("Comments", initial.getComments(), merged.getComments());
        assertEquals("NumberOfReview", initial.getMaxNumberOfReview(), merged.getMaxNumberOfReview());
        assertEquals("ImportedName", VAR_NAME, merged.getImportedToReviewName());

        assertEquals("# Feedback Items", 3, merged.getFeedback().getEvaluations().size());
        assertEquals("# Feedback Eval Items", 1, merged.getFeedbackEvaluation().getEvaluations().size());
    }
}
