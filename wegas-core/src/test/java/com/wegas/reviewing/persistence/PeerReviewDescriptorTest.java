
/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.reviewing.persistence;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.ObjectWriter;
import com.wegas.core.persistence.variable.primitive.NumberDescriptor;
import com.wegas.core.persistence.variable.primitive.NumberInstance;
import com.wegas.core.rest.util.JacksonMapperProvider;
import com.wegas.core.rest.util.Views;
import com.wegas.core.security.util.ActAsPlayer;
import com.wegas.reviewing.persistence.evaluation.CategorizedEvaluationDescriptor;
import com.wegas.reviewing.persistence.evaluation.EvaluationDescriptor;
import com.wegas.reviewing.persistence.evaluation.EvaluationDescriptorContainer;
import com.wegas.reviewing.persistence.evaluation.GradeDescriptor;
import com.wegas.reviewing.persistence.evaluation.TextEvaluationDescriptor;
import com.wegas.test.arquillian.AbstractArquillianTest;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import jakarta.naming.NamingException;
import org.junit.After;
import org.junit.Assert;
import static org.junit.Assert.*;
import org.junit.Before;
import org.junit.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
public class PeerReviewDescriptorTest extends AbstractArquillianTest {

    private static final Logger logger = LoggerFactory.getLogger(PeerReviewDescriptorTest.class);

    ObjectMapper mapper;
    ObjectWriter exportMapper;

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
        exportMapper = mapper.writerWithView(Views.Export.class);

        toBeReviewed = new NumberDescriptor(VAR_NAME);
        toBeReviewed.setDefaultInstance(new NumberInstance(0));

        variableDescriptorFacade.create(scenario.getId(), toBeReviewed);

        initial = new PeerReviewDescriptor();
        initial.setName("myReview");

        defaultInstance = new PeerReviewInstance();
        defaultInstance.setReviewState(PeerReviewDescriptor.ReviewingState.NOT_STARTED);
        initial.setDefaultInstance(defaultInstance);

        //initial.setScope(new TeamScope());
        initial.setComments("comments");
        initial.setMaxNumberOfReview(MAX_NUM);
        initial.setToReviewName(toBeReviewed.getName());

        initial.setFeedback(new EvaluationDescriptorContainer());
        EvaluationDescriptorContainer feedback = initial.getFeedback();
        List<EvaluationDescriptor> fEvaluations = new ArrayList<>();

        TextEvaluationDescriptor text = new TextEvaluationDescriptor();
        text.setName("aText");

        GradeDescriptor grade1 = new GradeDescriptor();
        grade1.setName("Node");
        grade1.setMinValue(1L);
        grade1.setMaxValue(10L);

        fEvaluations.add(text);
        fEvaluations.add(grade1);

        CategorizedEvaluationDescriptor cEvalD = new CategorizedEvaluationDescriptor();
        cEvalD.setName("cEvalD");
        cEvalD.addEnumItem("weak", "en");
        cEvalD.addEnumItem("strong", "en");
        fEvaluations.add(cEvalD);

        feedback.setEvaluations(fEvaluations);

        initial.setFbComments(new EvaluationDescriptorContainer());
        EvaluationDescriptorContainer feedbackComments = initial.getFbComments();
        List<EvaluationDescriptor> f2evaluations = new ArrayList<>();

        GradeDescriptor grade2 = new GradeDescriptor();
        grade2.setName("fevalG");
        grade2.setMinValue(0L);

        f2evaluations.add(grade2);
        feedbackComments.setEvaluations(f2evaluations);
        variableDescriptorFacade.create(scenario.getId(), initial);
        requestManager.clearEntities();
    }

    @After
    public void tearDownLocal() {
        //logger.warn("Tear Down");
    }

    @Test
    public void testSetters() {
        assertEquals("Number initial value", initial.getMaxNumberOfReview(), MAX_NUM);
        assertEquals("Var name initial", initial.getToReviewName(), VAR_NAME);

        assertEquals("Max Number of review error", MAX_NUM, initial.getMaxNumberOfReview());
        initial.setMaxNumberOfReview(-1);
        assertEquals("Max Number of review error", Integer.valueOf(1), initial.getMaxNumberOfReview());
    }

    /**
     * Test of merge method, of class PeerReviewDescriptor.
     *
     * @throws java.io.IOException
     */
    @Test
    public void testSerialise() throws IOException {
        try (ActAsPlayer actAsPlayer = requestManager.actAsPlayer(player)) {
            actAsPlayer.setFlushOnExit(false);
            String json = exportMapper.writeValueAsString(initial);

            PeerReviewDescriptor read = mapper.readValue(json, PeerReviewDescriptor.class);

            assertEquals("Name", initial.getName(), read.getName());
            assertEquals("Comments", initial.getComments(), read.getComments());
            assertEquals("NumberOfReview", initial.getMaxNumberOfReview(), read.getMaxNumberOfReview());
            assertEquals("ImportedName", VAR_NAME, read.getImportedToReviewName());

            assertEquals("# Feedback Items", 3, read.getFeedback().getEvaluations().size());
            assertEquals("# Feedback Eval Items", 1, read.getFbComments().getEvaluations().size());
        }
    }

    @Test
    public void deserialize() throws IOException {
        String json = "{ \"@class\": \"PeerReviewDescriptor\", \"id\": \"\", \"label\": \"rr\", \"toReviewName\": \"x\", \"name\": \"\", \"maxNumberOfReview\": 3, \"feedback\": { \"@class\": \"EvaluationDescriptorContainer\" }, \"fbComments\": { \"@class\": \"EvaluationDescriptorContainer\" }, \"defaultInstance\": { \"@class\": \"PeerReviewInstance\", \"id\": \"\" }, \"comments\": \"\", \"scope\": { \"@class\": \"TeamScope\", \"broadcastScope\": \"TeamScope\" } }";

        PeerReviewDescriptor read = mapper.readValue(json, PeerReviewDescriptor.class);
        Assert.assertEquals("Deserialised ReviewName not match", VAR_NAME, read.getToReviewName());// transient field
        variableDescriptorFacade.create(scenario.getId(), read);
        Assert.assertEquals("Deserialised ReviewName not match", VAR_NAME, read.getToReviewName()); // through toReview var

        String json2 = exportMapper.writeValueAsString(read);
    }

    @Test
    public void testMerge() throws IOException {
        PeerReviewDescriptor merged = new PeerReviewDescriptor();
        merged.setName("Another");
        merged.setToReviewName(toBeReviewed.getName());
        merged.setDefaultInstance(new PeerReviewInstance());
        merged.setFeedback(new EvaluationDescriptorContainer());
        merged.setFbComments(new EvaluationDescriptorContainer());

        //variableDescriptorFacade.create(scenario.getId(), merged);
        //logger.warn("Initial: " + exportMapper.writeValueAsString(initial));
        merged.merge(initial);

        //logger.warn("Initial: " + exportMapper.writeValueAsString(initial));
        //logger.warn("Merged: " + exportMapper.writeValueAsString(merged));
        assertEquals("Name", initial.getName(), merged.getName());
        assertEquals("Comments", initial.getComments(), merged.getComments());
        assertEquals("NumberOfReview", initial.getMaxNumberOfReview(), merged.getMaxNumberOfReview());
        assertEquals("ImportedName", VAR_NAME, merged.getImportedToReviewName());

        assertEquals("# Feedback Items", 3, merged.getFeedback().getEvaluations().size());
        assertEquals("# Feedback Eval Items", 1, merged.getFbComments().getEvaluations().size());
    }
}
