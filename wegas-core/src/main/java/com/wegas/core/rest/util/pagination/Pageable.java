package com.wegas.core.rest.util.pagination;

import jakarta.persistence.Query;
import jakarta.validation.constraints.Pattern;

import java.util.Arrays;
import java.util.List;

public class Pageable {
    private int page;
    private int size;

    @Pattern(regexp = "^[\\p{L} .'-_()&[0-9]]*$", message = "Invalid search query")
    private String query;

    public Pageable() {
        // ensure default constructor
    }

    public Pageable (int page, int size, String query){
        this.page = page;
        this.size = size;
        this.query = query;
    }

    public int getPage() {
        return page;
    }

    public int getSize() {
        return size;
    }

    public String getQuery() {
        return query;
    }

    public List<String> getSplitQuery() {
        return Arrays.asList(query.split(" "));
    }

    public <T extends Query> T paginateQuery(T query) {
        query.setFirstResult((this.page-1) * this.size);
        query.setMaxResults(this.size);
        return query;
    }
}
