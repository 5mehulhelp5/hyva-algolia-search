window['@algolia/templates-suggestions'] = {
    getNoResultHtml: function ({html}) {
        return html`<p>${algoliaConfig.translations.noResults}</p>`;
    },

    getHeaderHtml: function ({html}) {
        return html`<p>${algoliaConfig.translations.suggestions}</p>`;
    },

    getItemHtml: function ({item, components, html}) {
        const itemQuery = (item._highlightResult?.query?.value)
            ? components.Highlight({hit: item, attribute: "query"})
            : item.query;

        return html`
            <div
                x-init="bindClickEvent($el, 'Product Clicked', '${item.objectID}', '${item.__autocomplete_indexName}', '${item.position}',  '${item.__autocomplete_queryID}')">
                <a class="aa-ItemLink algolia-suggestions algoliasearch-autocomplete-hit"
                   href="${algoliaConfig.resultPageUrl}?q=${encodeURIComponent(item.query)}">
                    ${itemQuery}
                </a></div>`;
    },

    getFooterHtml: function () {
        return "";
    }
};

