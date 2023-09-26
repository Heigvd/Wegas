package com.wegas.core.rest.util.pagination;

import java.util.List;

public class Page<T> {

    private long total = 0;
    private int page = 0;
    private int pageSize = 0;

    private List<T> pageContent;

    public Page(long total, int page, int pagesize, List<T> pageContent) {
        this.total = total;
        this.page = page;
        this.pageSize =  pagesize;
        this.pageContent = pageContent;
    }
    public void setPage(int page) {
        this.page = page;
    }

    public int getPage() {
        return page;
    }

    public void setPageSize(int pageSize) {
        this.pageSize = pageSize;
    }

    public int getPageSize() {
        return pageSize;
    }

    public void setTotal(int total) {
        this.total = total;
    }

    public long getTotal() {
        return total;
    }

    public void setPageContent(List<T> pageContent) {
        this.pageContent = pageContent;
    }

    public List<T> getPageContent() {
        return pageContent;
    }
}
