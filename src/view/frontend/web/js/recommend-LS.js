function initAlgoliaRecommendedLS(containerValue, numOfLSItem, objectIDs) {

    this.defaultIndexName = window.algoliaConfig.indexName + '_products';
    const recommend = window['@algolia/recommend'];
    const recommendJs = window['@algolia/recommend-js'];
    const {applicationId, apiKey} = window.algoliaConfig;
    const recommendClient = recommend(applicationId, apiKey);
    const indexName = this.defaultIndexName;
    const productsHtml = window['@algolia/recommend-templates-products'];

    const title = window.algoliaConfig.recommend.lookingSimilarTitl;
    const addToCartEnabled = window.algoliaConfig.recommend.isAddToCartEnabledInLookingSimilar;

    let lookingSimilarOptions = {
        container:  "#" +containerValue,
        recommendClient,
        indexName,
        objectIDs,
        maxRecommendations: numOfLSItem ? parseInt(numOfLSItem) : window.algoliaConfig.recommend.limitLookingSimilarItems,
        transformItems: function (items) {
            return items.map((item, index) => ({
                ...item,
                position: index + 1,
            }));
        },
        headerComponent({html, recommendations}) {
            return productsHtml.getHeaderHtml({html, title, recommendations});
        },
        itemComponent({item, html}) {
            return productsHtml.getItemHtml({item, html, addToCartEnabled});
        },
    }

    lookingSimilarOptions = algolia.triggerHooks( 'beforeLookingSimilarInit', lookingSimilarOptions);
    recommendJs.lookingSimilar(lookingSimilarOptions);
    algolia.triggerHooks( 'afterLookingSimilarInit', lookingSimilarOptions);
}
