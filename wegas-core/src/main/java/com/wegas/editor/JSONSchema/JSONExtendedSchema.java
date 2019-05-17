package com.wegas.editor.JSONSchema;

import com.wegas.core.persistence.annotations.Errored;
import com.wegas.core.persistence.annotations.WegasConditions.Condition;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.wegas.editor.View.BaseView;
import com.wegas.editor.View.CommonView.FEATURE_LEVEL;
import java.util.ArrayList;
import java.util.List;

/**
 * Specific properties for JSONInput
 */
abstract public class JSONExtendedSchema implements JSONSchema, WithView, WithErroreds, WithVisible {

    private BaseView view;

    private List<WrappedErrored> erroreds;

    private Condition visible;

    @JsonInclude(JsonInclude.Include.NON_DEFAULT)
    private int index;

    private FEATURE_LEVEL featureLevel;

    @Override
    public BaseView getView() {
        return view;
    }

    @Override
    public void setView(BaseView view) {
        this.view = view;
    }

    @Override
    public List<WrappedErrored> getErroreds() {
        return erroreds;
    }

    @Override
    public void addErrored(Errored errored) {
        if (errored != null) {
            if (erroreds == null) {
                this.erroreds = new ArrayList<>();
            }
            erroreds.add(new WrappedErrored(errored));
        }
    }

    @Override
    public Condition getVisible() {
        return visible;
    }

    @Override
    public void setVisible(Condition visible) {
        this.visible = visible;
    }

    /**
     * @return the index
     */
    public int getIndex() {
        return index;
    }

    /**
     * @param index the index to set
     */
    public void setIndex(int index) {
        this.index = index;
    }

    public FEATURE_LEVEL getFeatureLevel() {
        return featureLevel;
    }

    public void setFeatureLevel(FEATURE_LEVEL featureLevel) {
        this.featureLevel = featureLevel;
    }
}
