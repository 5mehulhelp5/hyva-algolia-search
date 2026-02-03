function initAlgoliaRecommended(context, objectIDs) {

    if (!objectIDs || typeof algoliaConfig === 'undefined') {
        return;
    }
    this.defaultIndexName = algoliaConfig.indexName + '_products';
    const recommend = window['@algolia/recommend'];
    const recommendJs = window['@algolia/recommend-js'];
    const {applicationId, apiKey} = algoliaConfig;
    const recommendClient = recommend(applicationId, apiKey);
    const indexName = this.defaultIndexName;
    const recommendProductsHtml = window['@algolia/recommend-templates-products'];

    if (context === 'catalog_product_view' || context === 'checkout_cart_index') {
        const title = algoliaConfig.recommend.FBTTitle;
        const addToCartEnabled = algoliaConfig.recommend.isAddToCartEnabledInFBT;
        if (
            (algoliaConfig.recommend.enabledFBT &&
                context === 'catalog_product_view') ||
            (algoliaConfig.recommend.enabledFBTInCart &&
                context === 'checkout_cart_index')
        ) {
            // --- Add the current product objectID here ---
            let frequentlyBoughtTogetherOptions = {
                container: '#frequentlyBoughtTogether',
                recommendClient,
                indexName,
                objectIDs,
                maxRecommendations: algoliaConfig.recommend.limitFBTProducts,
                transformItems: function (items) {
                    return items.map((item, index) => ({
                        ...item,
                        position: index + 1,
                    }));
                },
                headerComponent({html, recommendations}) {
                    if (!recommendations.length) {
                        return '';
                    }
                    recommendProductsHtml.getHeaderHtml({
                        html,
                        title,
                        recommendations}
                    );
                },
                itemComponent({item, html}) {
                    return recommendProductsHtml.getItemHtml({
                        item,
                        html,
                        addToCartEnabled}
                    );
                },
            }

            frequentlyBoughtTogetherOptions = algolia.triggerHooks( 'beforeFrequentlyBoughtTogetherInit', frequentlyBoughtTogetherOptions);
            recommendJs.frequentlyBoughtTogether(frequentlyBoughtTogetherOptions);
            algolia.triggerHooks( 'afterFrequentlyBoughtTogetherInit', frequentlyBoughtTogetherOptions);
        }
        if (
            (algoliaConfig.recommend.enabledRelated &&
                context === 'catalog_product_view') ||
            (algoliaConfig.recommend.enabledRelatedInCart &&
                context === 'checkout_cart_index')
        ) {
            const title = algoliaConfig.recommend.relatedProductsTitle;
            const addToCartEnabled = algoliaConfig.recommend.isAddToCartEnabledInRelatedProduct;

            let relatedProductsOptions = {
                container: '#relatedProducts',
                recommendClient,
                indexName,
                objectIDs: objectIDs,
                maxRecommendations: algoliaConfig.recommend.limitRelatedProducts,
                transformItems: function (items) {
                    return items.map((item, index) => ({
                        ...item,
                        position: index + 1,
                    }));
                },
                headerComponent({html, recommendations}) {
                    if (!recommendations.length) {
                        return '';
                    }
                    return recommendProductsHtml.getHeaderHtml({html, title, recommendations});
                },
                itemComponent({item, html}) {
                    return recommendProductsHtml.getItemHtml({
                        item,
                        html,
                        addToCartEnabled
                    });
                },
            }
            relatedProductsOptions = algolia.triggerHooks( 'beforeRelatedProductInit', relatedProductsOptions);
            recommendJs.relatedProducts(relatedProductsOptions);
            algolia.triggerHooks( 'afterRelatedProductInit', relatedProductsOptions);
        }
    }

    if (
        (algoliaConfig.recommend.isTrendItemsEnabledInPDP &&
            context === 'catalog_product_view') ||
        (algoliaConfig.recommend.isTrendItemsEnabledInCartPage &&
            context === 'checkout_cart_index')
    ) {
        const title = algoliaConfig.recommend.trendingItemsTitle;
        const addToCartEnabled = algoliaConfig.recommend.isAddToCartEnabledInTrendsItem;

        let trendingItemsOptions = {
            container: '#trendItems',
            facetName: algoliaConfig.recommend.trendItemFacetName ? algoliaConfig.recommend.trendItemFacetName : '',
            facetValue: algoliaConfig.recommend.trendItemFacetValue ? algoliaConfig.recommend.trendItemFacetValue : '',
            recommendClient,
            indexName,
            maxRecommendations: algoliaConfig.recommend.limitTrendingItems,
            transformItems: function (items) {
                return items.map((item, index) => ({
                    ...item,
                    position: index + 1,
                }));
            },
            headerComponent({html, recommendations}) {
                if (!recommendations.length) {
                    return '';
                }
                return recommendProductsHtml.getHeaderHtml({html, title, recommendations});
            },
            itemComponent({item, html}) {
                return recommendProductsHtml.getItemHtml({item, html, addToCartEnabled});
            },
        }

        trendingItemsOptions = algolia.triggerHooks( 'beforeTrendingItemsInit', trendingItemsOptions);
        recommendJs.trendingItems(trendingItemsOptions);
        algolia.triggerHooks( 'afterTrendingItemsInit', trendingItemsOptions);

    }

    if (
        (algoliaConfig.recommend.isLookingSimilarEnabledInPDP &&
            context === 'catalog_product_view') ||
        (algoliaConfig.recommend.isLookingSimilarEnabledInCartPage &&
            context === 'checkout_cart_index')
    ) {
        const title = algoliaConfig.recommend.lookingSimilarTitle;
        const addToCartEnabled = algoliaConfig.recommend.isAddToCartEnabledInLookingSimilar;

        let lookingSimilarOptions = {
            container: '#lookingSimilar',
            recommendClient,
            indexName,
            objectIDs,
            maxRecommendations: algoliaConfig.recommend.limitLookingSimilar,
            transformItems: function (items) {
                return items.map((item, index) => ({
                    ...item,
                    position: index + 1,
                }));
            },
            headerComponent({html, recommendations}) {
                if (!recommendations.length) {
                    return '';
                }
                return recommendProductsHtml.getHeaderHtml({html, title, recommendations});
            },
            itemComponent({item, html}) {
                return recommendProductsHtml.getItemHtml({item, html, addToCartEnabled});
            },
        }

        lookingSimilarOptions = algolia.triggerHooks( 'beforeLookingSimilarInit', lookingSimilarOptions);
        recommendJs.lookingSimilar(lookingSimilarOptions);
        algolia.triggerHooks( 'afterLookingSimilarInit', lookingSimilarOptions);
    }
}
