/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */

package com.wegas.reviewing.persistence;

import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.primitive.NumberDescriptor;
import com.wegas.core.persistence.variable.scope.TeamScope;
import com.wegas.core.rest.util.JacksonMapperProvider;
import com.wegas.reviewing.persistence.evaluation.CategorizedEvaluationDescriptor;
import com.wegas.reviewing.persistence.evaluation.EvaluationDescriptor;
import com.wegas.reviewing.persistence.evaluation.GradeDescriptor;
import com.wegas.reviewing.persistence.evaluation.TextEvaluationDescriptor;
import java.io.IOException;
import java.util.List;
import javax.persistence.Persistence;
import javax.persistence.PersistenceUnit;
import org.codehaus.jackson.map.ObjectMapper;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import static org.junit.Assert.*;

/**
 *
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */


public class PeerReviewingDescriptorTest {

    ObjectMapper mapper;
    
    NumberDescriptor toBeReviewed;
    
    PeerReviewingDescriptor initial;

    PeerReviewingInstance defaultInstance;

    private final Integer MAX_NUM = 4;
    private final String VAR_NAME = "x";
    
    public PeerReviewingDescriptorTest() {
    }
    
    @Before
    public void setUp() {
        mapper = JacksonMapperProvider.getMapper();

        toBeReviewed = new NumberDescriptor(VAR_NAME);
        
        initial = new PeerReviewingDescriptor("myReview");

        defaultInstance = new PeerReviewingInstance();
        defaultInstance.setReviewState(PeerReviewingDescriptor.ReviewingState.NOT_STARTED);
        initial.setDefaultInstance(defaultInstance);
        
        System.out.println("Create REVIEW");

        //initial.setScope(new TeamScope());
        
        initial.setComments("comments");
        initial.setMaxNumberOfReview(MAX_NUM);
        initial.setToReview(toBeReviewed);

        List<EvaluationDescriptor> feedback = initial.getFeedback();
        feedback.add(new TextEvaluationDescriptor("aText"));
        feedback.add(new GradeDescriptor("Note", 1.0, 10.0));

        CategorizedEvaluationDescriptor cEvalD = new CategorizedEvaluationDescriptor("categ");
        cEvalD.addCategory("weak");
        cEvalD.addCategory("strong");
        feedback.add(cEvalD);
        
        List<EvaluationDescriptor> feedbackEvaluations = initial.getFeedbackEvaluations();
        feedbackEvaluations.add(new GradeDescriptor("fevalG", 0.0, null));

        
        System.out.println("SETTED UP");
    }
    
    @After
    public void tearDown() {
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
     * Test of merge method, of class PeerReviewingDescriptor.
     * @throws java.io.IOException
     */
    @Test
    public void testSerialise() throws IOException {
        System.out.println("SERIALISE");

        String json = mapper.writeValueAsString(initial);
        System.out.println("JSON: " + json);

        PeerReviewingDescriptor read = mapper.readValue(json, PeerReviewingDescriptor.class);

        assertEquals("Name", initial.getName(), read.getName());
        assertEquals("Comments", initial.getComments(), read.getComments());
        assertEquals("NumberOfReview", initial.getMaxNumberOfReview(), read.getMaxNumberOfReview());
        assertEquals("ImportedName", VAR_NAME, read.getImportedToReviewName());

        assertEquals("# Feedback Items", 3, read.getFeedback().size());
        assertEquals("# Feedback Eval Items", 1, read.getFeedbackEvaluations().size());
    }

    @Test
    public void testMerge() throws IOException {
        System.out.println("SERIALISE");


        PeerReviewingDescriptor merged = new PeerReviewingDescriptor("another");
        merged.setDefaultInstance(new PeerReviewingInstance());

        merged.merge(initial);

        System.out.println("Initial: " + mapper.writeValueAsString(initial));
        System.out.println("Merged: " + mapper.writeValueAsString(merged));


        assertEquals("Name", initial.getName(), merged.getName());
        assertEquals("Comments", initial.getComments(), merged.getComments());
        assertEquals("NumberOfReview", initial.getMaxNumberOfReview(), merged.getMaxNumberOfReview());
        assertEquals("ImportedName", VAR_NAME, merged.getImportedToReviewName());

        assertEquals("# Feedback Items", 3, merged.getFeedback().size());
        assertEquals("# Feedback Eval Items", 1, merged.getFeedbackEvaluations().size());
    }
}
