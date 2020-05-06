/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2019 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.editor;

import ch.albasim.wegas.annotations.ValueGenerator;
import com.wegas.core.i18n.persistence.TranslatableContent;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.GameModelProperties;
import com.wegas.core.persistence.game.Script;
import com.wegas.reviewing.persistence.PeerReviewDescriptor;
import com.wegas.reviewing.persistence.evaluation.EvaluationDescriptorContainer;
import com.wegas.survey.persistence.SurveyInstance;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 *
 * @author maxence
 */
public class ValueGenerators {

    public static class Zero implements ValueGenerator {

        @Override
        public Integer getValue() {
            return 0;
        }
    }

    public static class One implements ValueGenerator {

        @Override
        public Integer getValue() {
            return 1;
        }
    }

    public static class Three implements ValueGenerator {

        @Override
        public Integer getValue() {
            return 3;
        }
    }

    public static class Twenty implements ValueGenerator {

        @Override
        public Integer getValue() {
            return 20;
        }
    }

    public static class True implements ValueGenerator {

        public Boolean getValue() {
            return Boolean.TRUE;
        }
    }

    public static class False implements ValueGenerator {

        public Boolean getValue() {
            return Boolean.FALSE;
        }
    }

    public static class EmptyMap implements ValueGenerator {

        public Map getValue() {
            return new HashMap();
        }
    }

    public static class EmptyArray implements ValueGenerator {

        public List<Object> getValue() {
            return new ArrayList<>();
        }
    }

    public static class EmptyString implements ValueGenerator {

        public String getValue() {
            return "";
        }
    }

    public static class TeamScopeVal implements ValueGenerator {

        public String getValue() {
            return "TeamScope";
        }
    }

    public static class EmptyScript implements ValueGenerator {

        public Script getValue() {
            return new Script();
        }
    }

    public static class EmptyI18n implements ValueGenerator {

        public TranslatableContent getValue() {
            TranslatableContent tr = new TranslatableContent();
            tr.setVersion(0l);
            return tr;
        }
    }

    public static class Open implements ValueGenerator {

        public Game.GameAccess getValue() {
            return Game.GameAccess.OPEN;
        }
    }

    public static class GmProperties implements ValueGenerator {

        public GameModelProperties getValue() {
            return new GameModelProperties();
        }
    }

    public static class ReviewingNotStarted implements ValueGenerator {

        @Override
        public PeerReviewDescriptor.ReviewingState getValue() {
            return PeerReviewDescriptor.ReviewingState.NOT_STARTED;
        }
    }

    public static class SurveyNotStarted implements ValueGenerator {

        @Override
        public SurveyInstance.SurveyStatus getValue() {
            return SurveyInstance.SurveyStatus.NOT_STARTED;
        }
    }

    public static class EmptyEvaluationContainer implements ValueGenerator {

        @Override
        public EvaluationDescriptorContainer getValue() {
            return new EvaluationDescriptorContainer();
        }
    }
}
