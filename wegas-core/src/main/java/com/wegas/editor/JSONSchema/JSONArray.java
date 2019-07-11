package com.wegas.editor.JSONSchema;

public class JSONArray extends JSONType {
    private JSONSchema items;
    private Integer minItems;
    private Integer maxItems;

    public JSONArray() {
        super(false);
    }

    public JSONArray(boolean nullable) {
        super(nullable);
    }
    /**
     * @return the items
     */
    public JSONSchema getItems() {
        return items;
    }

    /**
     * @return the maxItems
     */
    public Integer getMaxItems() {
        return maxItems;
    }

    /**
     * @param maxItems the maxItems to set
     */
    public void setMaxItems(Integer maxItems) {
        this.maxItems = maxItems;
    }

    /**
     * @return the minItems
     */
    public Integer getMinItems() {
        return minItems;
    }

    /**
     * @param minItems the minItems to set
     */
    public void setMinItems(Integer minItems) {
        this.minItems = minItems;
    }

    /**
     * @param items the items to set
     */
    public void setItems(JSONSchema items) {
        this.items = items;
    }

    @Override
    final public String getType() {
        return "array";
    }

}