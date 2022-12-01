/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

package com.wegas.core.security.persistence.token;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.wegas.core.ejb.RequestManager.RequestContext;
import com.wegas.core.ejb.VariableDescriptorFacade;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.variable.Beanjection;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.security.ejb.AccountFacade;
import com.wegas.core.security.persistence.AbstractAccount;
import com.wegas.core.security.util.WegasMembership;
import com.wegas.core.security.util.WegasPermission;
import com.wegas.survey.persistence.SurveyDescriptor;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import javax.persistence.Entity;
import javax.persistence.ManyToMany;
import javax.servlet.http.HttpServletRequest;

/**
 *
 * @author maxence
 */
@Entity
public class SurveyToken extends Token {

    @ManyToMany(mappedBy = "tokens")
    //@JsonView(Views.ExtendedI.class)
    @JsonIgnore
    private List<SurveyDescriptor> surveys;

    /**
     * Return the gameModel which define all the surveys. By design, a token can references several
     * surveys, but all surveys must belong to the same gameModel.
     *
     * @return the gameModel which contains surveys or null if there is no survey or if surveys
     *         belong to difference gameModel
     */
    public static GameModel getUniqueGameModel(List<SurveyDescriptor> surveys) {
        GameModel gm = null;
        for (SurveyDescriptor sd : surveys) {
            if (gm == null) {
                gm = sd.getGameModel();
            } else if (!gm.equals(sd.getGameModel())) {
                return null;
            }
        }
        return gm;
    }

    @JsonIgnore
    public GameModel getGameModel() {
        return SurveyToken.getUniqueGameModel(surveys);
    }

    public List<SurveyDescriptor> getSurveys() {
        return surveys;
    }

    public void setSurveys(List<SurveyDescriptor> surveys) {
        this.surveys = new ArrayList<>();
        for (SurveyDescriptor survey : surveys) {
            survey.getTokens().add(this);
            this.surveys.add(survey);
        }
    }

    @Override
    public String getRedirectTo() {
        List<String> ids = new ArrayList<>(surveys.size());
        for (SurveyDescriptor sd : this.getSurveys()) {
            ids.add(sd.getId().toString());
        }

        return "/survey.html?surveyIds=" + String.join(",", ids);
    }

    @Override
    public void process(AccountFacade accountFacade, HttpServletRequest request) {
        accountFacade.processSurveyToken(this, request);
    }

    @Override
    public Collection<WegasPermission> getRequieredCreatePermission(RequestContext context) {
        GameModel gm = SurveyToken.getUniqueGameModel(surveys);

        // can create only if the token is linked to one and only one gameModel
        if (gm != null) {
            return gm.getRequieredUpdatePermission(context);
        } else {
            return WegasMembership.FORBIDDEN;
        }
    }

    @Override
    public Collection<WegasPermission> getRequieredUpdatePermission(RequestContext context) {
        Collection<WegasPermission> ps = new ArrayList<>();

        GameModel gm = SurveyToken.getUniqueGameModel(surveys);

        if (gm != null) {
            ps.addAll(gm.getRequieredUpdatePermission(context));
        }

        AbstractAccount account = this.getAccount();

        if (account != null) {
            ps.addAll(account.getRequieredUpdatePermission(context));
        }

        if (ps.isEmpty()){
            ps.addAll(WegasMembership.ADMIN);
        }

        return ps;
    }

    public void removeSurvey(SurveyDescriptor sd) {
        this.surveys.remove(sd);
    }

    @Override
    public void updateCacheOnDelete(Beanjection beans) {
        if (this.surveys != null) {
            VariableDescriptorFacade vdf = beans.getVariableDescriptorFacade();
            for (SurveyDescriptor sd : surveys) {
                VariableDescriptor find = vdf.find(sd.getId());
                if (find instanceof SurveyDescriptor) {
                    SurveyDescriptor sdf = (SurveyDescriptor) find;
                    sdf.removeToken(this);
                }
            }
        }

        super.updateCacheOnDelete(beans);
    }
}
