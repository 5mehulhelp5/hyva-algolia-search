function initAlgoliaAutocomplete() {
    /** We have nothing to do here if autocomplete is disabled **/
    if (typeof algoliaConfig === 'undefined' || !algoliaConfig.autocomplete.enabled) {
        return;
    }

    const {autocomplete, getAlgoliaResults} = window['@algolia/autocomplete-js'];
    const {createQuerySuggestionsPlugin} = window['@algolia/autocomplete-plugin-query-suggestions'];
    const suggestionsHtml = window['@algolia/templates-suggestions'];
    const productsHtml = window['@algolia/templates-products'];
    const categoriesHtml = window['@algolia/templates-categories'];
    const pagesHtml = window['@algolia/templates-pages'];
    const additionalHtml = window['@algolia/templates-additional-section'];


    const DEFAULT_HITS_PER_SECTION = 2;
    const DEBOUNCE_MS = algoliaConfig.autocomplete.debounceMilliseconds;
    const MIN_SEARCH_LENGTH_CHARS = algoliaConfig.autocomplete.minimumCharacters;

    // Global state
    const state = {
        hasRendered: false,
        hasSuggestionSection: false
    };

    let suggestionSection = false;
    let algoliaFooter;

    function initialize() {
        bindAutocomplete();
    }

    /**
     * Setup the autocomplete search input
     * For autocomplete feature is used Algolia's autocomplete.js library
     * Docs: https://github.com/algolia/autocomplete.js
     **/
    function bindAutocomplete() {
        /** We have nothing to do here if autocomplete is disabled **/
        if (typeof algoliaConfig === 'undefined' || !algoliaConfig.autocomplete.enabled) return;

        const searchClient = getSearchClient();

        const sources = buildAutocompleteSources(searchClient);

        const plugins = buildAutocompletePlugins(searchClient);

        let options = buildAutocompleteOptions(searchClient, sources, plugins);

        startAutocomplete(options);

        addFooter();

        addKeyboardNavigation();

    }

    function getSearchClient() {
        /**
         * Initialise Algolia client
         * Docs: https://www.algolia.com/doc/api-client/getting-started/instantiate-client-index/
         **/
        const searchClient = algoliasearch(
            algoliaConfig.applicationId,
            algoliaConfig.apiKey
        );
        searchClient.addAlgoliaAgent(
            'Magento2 integration (' + algoliaConfig.extensionVersion + ')'
        );
        return searchClient;
    }

    function buildAutocompleteOptions(searchClient, sources, plugins) {
        const debounced = debounce((items) => Promise.resolve(items), DEBOUNCE_MS);

        let options = algolia.triggerHooks('beforeAutocompleteOptions', {});

        options = {
            ...options,
            container: algoliaConfig.autocomplete.selector,
            panelContainer: '#panelContainer',
            placeholder: algoliaConfig.translations.placeholder,
            debug: algoliaConfig.autocomplete.isDebugEnabled,
            detachedMediaQuery: 'none',
            onSubmit: ({state: {query}}) => {
                if (query) {
                    window.location.href =
                        algoliaConfig.resultPageUrl +
                        `?q=${encodeURIComponent(query)}`;
                }
            },
            onStateChange: ({state}) => {
                handleAutocompleteStateChange(state);
            },
            getSources: ({query}) => {
                return filterMinChars(query, debounced(transformSources(searchClient, sources)));
            },
            shouldPanelOpen: ({state}) => {
                return state.query.length >= MIN_SEARCH_LENGTH_CHARS;
            },
            // Set debug to true, to be able to remove keyboard and be able to scroll in autocomplete menu
            debug: isMobile(),
            plugins
        };

        options = algolia.triggerHooks('afterAutocompleteOptions', options);

        return options;
    }

    /**
     * Validate and merge behaviors for custom sources
     *
     * @param searchClient
     * @param sources Magento sources
     * @returns Algolia sources
     */
    function transformSources(searchClient, sources) {
        return sources
            .filter(data => {
                if (!data.sourceId) {
                    console.error(
                        'Algolia Autocomplete: sourceId is required for custom sources'
                    );
                    return false;
                }
                return true;
            })
            .map((data) => {
                const getItems = ({query}) => {
                    return getAlgoliaResults({
                        searchClient,
                        queries: [
                            {
                                query,
                                indexName: data.indexName,
                                params: data.options,
                            },
                        ],
                        // only set transformResponse if defined (necessary check for custom sources)
                        ...(data.transformResponse && {
                            transformResponse: data.transformResponse,
                        }),
                    });
                };
                const fallbackTemplates = {
                    noResults: () => 'No results',
                    header: () => data.sourceId,
                    item: ({item}) => {
                        console.error(
                            `Algolia Autocomplete: No template defined for source "${data.sourceId}"`
                        );
                        return '[ITEM TEMPLATE MISSING]';
                    },
                };
                return {
                    sourceId: data.sourceId,
                    getItems,
                    templates: {...fallbackTemplates, ...(data.templates || {})},
                    // only set getItemUrl if defined (necessary check for custom sources)
                    ...(data.getItemUrl && {getItemUrl: data.getItemUrl}),
                };
            });
    }

    /**
     * Build all of the extension's federated sources for Autocomplete
     * @param searchClient
     * @returns array of source objects
     */
    function buildAutocompleteSources(searchClient) {
        /**
         * Load suggestions, products and categories as configured
         * NOTE: Sequence matters!
         * **/
        if (algoliaConfig.autocomplete.nbOfCategoriesSuggestions > 0) {
            algoliaConfig.autocomplete.sections.unshift({
                hitsPerPage: algoliaConfig.autocomplete.nbOfCategoriesSuggestions,
                label: algoliaConfig.translations.categories,
                name: 'categories',
            });
        }

        if (algoliaConfig.autocomplete.nbOfProductsSuggestions > 0) {
            algoliaConfig.autocomplete.sections.unshift({
                hitsPerPage: algoliaConfig.autocomplete.nbOfProductsSuggestions,
                label: algoliaConfig.translations.products,
                name: 'products',
            });
        }

        /** Setup autocomplete data sources **/
        let sources = algoliaConfig.autocomplete.sections.map((section) =>
            buildAutocompleteSource(section, searchClient)
        );

        // DEPRECATED - retaining for backward compatibility but `beforeAutcompleteSources` may be removed or relocated in a future version
        sources = algolia.triggerHooks(
            'beforeAutocompleteSources',
            sources,
            searchClient
        );

        sources = algolia.triggerHooks(
            'afterAutocompleteSources',
            sources,
            searchClient
        );

        return sources;
    }

    /**
     * Build pre-baked sources
     * @param section - object containing data for federated section in the autocomplete menu
     * @param searchClient
     * @returns object representing a single source
     */
    function buildAutocompleteSource(section, searchClient) {
        const defaultSourceConfig = buildAutocompleteSourceDefault(section);

        switch (section.name) {
            case 'products':
                return buildAutocompleteSourceProducts(section, defaultSourceConfig);
            case 'categories':
                return buildAutocompleteSourceCategories(section, defaultSourceConfig);
            case 'pages':
                return buildAutocompleteSourcePages(section, defaultSourceConfig);
            default:
                /** If is not products, categories, or pages, it's an additional section **/
                return buildAutocompleteSourceAdditional(section, defaultSourceConfig);
        }
    }

    /**
     * Build a default source configuration for all pre baked federated autocomplete sections
     * @param section - object containing data for this section
     * @returns
     */
    function buildAutocompleteSourceDefault(section) {
        const options = {
            hitsPerPage: section.hitsPerPage || DEFAULT_HITS_PER_SECTION,
            analyticsTags: 'autocomplete',
            clickAnalytics: true,
            distinct: true,
        };

        const getItemUrl = ({item}) => {
            return getNavigatorUrl(item.url);
        };

        const transformResponse = ({results, hits}) => {
            const resDetail = results[0];

            return hits.map((res) => {
                return res.map((hit, i) => {
                    return {
                        ...hit,
                        query: resDetail.query,
                        position: i + 1,
                    };
                });
            });
        };

        const defaultSectionIndex = `${algoliaConfig.indexName}_${section.name}`;

        return {
            sourceId: section.name,
            options,
            getItemUrl,
            transformResponse,
            indexName: defaultSectionIndex,
        };
    }

    /**
     * Build the source to be used for federated section showing product results
     * @param section - object containing data for this section
     * @param source - default values for the source object
     * @returns source object
     */
    function buildAutocompleteSourceProducts(section, source) {
        source.options = buildProductSourceOptions(section, source.options);
        source.templates = {
                noResults: ({html}) => {
                return productsHtml.getNoResultHtml({html});
            },
                header: ({items, html}) => {
                    return productsHtml.getHeaderHtml({items, html});
            },
                item: ({item, components, html}) => {
                    const _data = transformAutocompleteHit(item, algoliaConfig.priceKey);
                return productsHtml.getItemHtml({item: _data, components, html});
            },
            footer: ({items, html}) => {
                const resultDetails = {};
                if (items.length) {
                    const firstItem = items[0];
                    resultDetails.allDepartmentsUrl =
                        algoliaConfig.resultPageUrl +
                        '?q=' +
                        encodeURIComponent(firstItem.query);
                    resultDetails.nbHits = firstItem.nbHits;

                    if (
                        algoliaConfig.facets.find(
                            (facet) => facet.attribute === 'categories'
                        )
                    ) {
                        let allCategories = [];
                        if (typeof firstItem.allCategories !== 'undefined') {
                            allCategories = Object.keys(firstItem.allCategories).map(
                                (key) => {
                                    const url =
                                        resultDetails.allDepartmentsUrl +
                                        '&categories=' +
                                        encodeURIComponent(key);
                                    return {
                                        name: key,
                                        value: firstItem.allCategories[key],
                                        url,
                                    };
                                }
                            );
                        }
                        //reverse value sort apparently...
                        allCategories.sort((a, b) => b.value - a.value);
                        resultDetails.allCategories = allCategories.slice(0, 2);
                    }
                }
                return productsHtml.getFooterHtml({html, ...resultDetails});
            },
        };
        source.transformResponse = ({results, hits}) => {
            const resDetail = results[0];
            return hits.map((res) => {
                return res.map((hit, i) => {
                    return {
                        ...hit,
                        nbHits: resDetail.nbHits,
                        allCategories: resDetail.facets['categories.level0'],
                        query: resDetail.query,
                        position: i + 1,
                    };
                });
            });
        };
        return source;
    }

    /**
     * Build the source options for the products search results
     * (Provides an alternate approach to customizing via mixin in addition to front end custom event hooks)
     * @param section - object containing data for the product section (although not used in default implementation retained for accessibility through overrides)
     * @param options - default values for the options object
     * @returns options object
     */
    function buildProductSourceOptions(section, options) {
        // DEPRECATED - retaining for backward compatibility but `beforeAutocompleteProductSourceOptions` may be removed in a future version
        options = algolia.triggerHooks(
            'beforeAutocompleteProductSourceOptions', options
        );

        options.facets = ['categories.level0'];
        options.numericFilters = 'visibility_search=1';
        options.ruleContexts = ['magento_filters', '']; // Empty context to keep backward compatibility for already created rules in dashboard

        options = algolia.triggerHooks(
            'afterAutocompleteProductSourceOptions',
            options
        );
        return options;
    }

    /**
     * Build the source to be used for federated section showing category results
     * @param section - object containing data for this section
     * @param source - default values for the source object
     * @returns source object
     */
    function buildAutocompleteSourceCategories(section, source) {
        if (
            section.name === 'categories' &&
            algoliaConfig.showCatsNotIncludedInNavigation === false
        ) {
            source.options.numericFilters = 'include_in_menu=1';
        }

        source.templates = {
            noResults: ({html}) => {
                return categoriesHtml.getNoResultHtml({html});
            },
            header: ({html, items}) => {
                return categoriesHtml.getHeaderHtml({section, html, items});
            },
            item: ({item, components, html}) => {
                return categoriesHtml.getItemHtml({item, components, html});
            },
            footer: ({html, items}) => {
                return categoriesHtml.getFooterHtml({section, html, items});
            },
        };
        return source;
    }



    /**
     * Build the source to be used for federated section showing CMS page results
     * @param section - object containing data for this section
     * @param source - default values for the source object
     * @returns source object
     */
    function buildAutocompleteSourcePages(section, source)
    {
        source.templates = {
            noResults: ({html}) => {
                return pagesHtml.getNoResultHtml({html});
            },
            header: ({html, items}) => {
                return pagesHtml.getHeaderHtml({section, html, items});
            },
            item: ({item, components, html}) => {
                return pagesHtml.getItemHtml({item, components, html});
            },
            footer: ({html, items}) => {
                return pagesHtml.getFooterHtml({section, html, items});
            },
        };
        return source;
    }


    /**
     * Build the source to be used for federated sections based on product attributes
     * @param section - object containing data for this section
     * @param source - default values for the source object
     * @returns source object
     */
    function buildAutocompleteSourceAdditional(section, source) {
        source.indexName = `${algoliaConfig.indexName}_section_${section.name}`;
        source.templates = {
            noResults: ({html}) => {
                return additionalHtml.getNoResultHtml({html});
            },
            header: ({html, items}) => {
                return additionalHtml.getHeaderHtml({section, html, items});
            },
            item: ({item, components, html}) => {
                return additionalHtml.getItemHtml({
                    item,
                    components,
                    html,
                    section,
                });
            },
            footer: ({html, items}) => {
                return additionalHtml.getFooterHtml({section, html, items});
            },
        };
        return source;
    }

    function buildAutocompletePlugins(searchClient) {
        let plugins = [];

        if (algoliaConfig.autocomplete.nbOfQueriesSuggestions > 0) {
            state.hasSuggestionSection = true;
            plugins.push(buildSuggestionsPlugin(searchClient));
        }
        return algolia.triggerHooks(
            'afterAutocompletePlugins',
            plugins,
            searchClient
        );
    }

    /**
     *
     * @param options
     * @returns the Algolia Autocomplete instance
     */
    function startAutocomplete(options) {
        /** Bind autocomplete feature to the input */
        const algoliaAutocompleteInstance = autocomplete(options);
        return algolia.triggerHooks(
            'afterAutocompleteStart',
            algoliaAutocompleteInstance
        );
    }

    function transformAutocompleteHit(hit, price_key, helper) {
        if (Array.isArray(hit.categories))
            hit.categories = hit.categories.join(', ');

        if (hit._highlightResult.categories_without_path && Array.isArray(hit.categories_without_path)) {
            hit.categories_without_path = hit._highlightResult.categories_without_path.map(
                function (category) {
                    return category.value;
                });

            hit.categories_without_path = hit.categories_without_path.join(', ');
        }

        let matchedColors = [];

        // TODO: Adapt this migrated code from common.js - helper not utilized
        if (helper && algoliaConfig.useAdaptiveImage === true) {
            if (hit.images_data && helper.state.facetsRefinements.color) {
                matchedColors = helper.state.facetsRefinements.color.slice(0); // slice to clone
            }

            if (hit.images_data && helper.state.disjunctiveFacetsRefinements.color) {
                matchedColors = helper.state.disjunctiveFacetsRefinements.color.slice(0); // slice to clone
            }
        }

        if (Array.isArray(hit.color)) {
            let colors = [];

            for (let i in hit._highlightResult.color) {
                let color = hit._highlightResult.color[i];
                if (color.matchLevel === undefined || color.matchLevel === 'none') {
                    continue;
                }
                colors.push(color);

                if (algoliaConfig.useAdaptiveImage === true) {
                    let matchedColor = color.matchedWords.join(' ');
                    if (hit.images_data && color.fullyHighlighted && color.fullyHighlighted === true) {
                        matchedColors.push(matchedColor);
                    }
                }
            }

            colors = colors.join(', ');
            hit._highlightResult.color = {value: colors};
        } else {
            if (hit._highlightResult.color && hit._highlightResult.color.matchLevel === 'none') {
                hit._highlightResult.color = {value: ''};
            }
        }

        if (algoliaConfig.useAdaptiveImage === true) {
            matchedColors.forEach(function (i, color) {
                color = color.toLowerCase();

                if (hit.images_data[color]) {
                    hit.image_url = hit.images_data[color];
                    hit.thumbnail_url = hit.images_data[color];

                    return false;
                }
            });
        }

        if (hit._highlightResult.color && hit._highlightResult.color.value && hit.categories_without_path) {
            if (hit.categories_without_path.indexOf('<em>') === -1 && hit._highlightResult.color.value.indexOf('<em>') !== -1) {
                hit.categories_without_path = '';
            }
        }

        if (Array.isArray(hit._highlightResult.name))
            hit._highlightResult.name = hit._highlightResult.name[0];

        if (Array.isArray(hit.price)) {
            hit.price = hit.price[0];
            if (hit['price'] !== undefined && price_key !== '.' + algoliaConfig.currencyCode + '.default' && hit['price'][algoliaConfig.currencyCode][price_key.substr(1) + '_formated'] !== hit['price'][algoliaConfig.currencyCode]['default_formated']) {
                hit['price'][algoliaConfig.currencyCode][price_key.substr(1) + '_original_formated'] = hit['price'][algoliaConfig.currencyCode]['default_formated'];
            }

            if (
                hit['price'][algoliaConfig.currencyCode]['default_original_formated'] &&
                hit['price'][algoliaConfig.currencyCode]['special_to_date']
            ) {
                const priceExpiration = hit['price'][algoliaConfig.currencyCode]['special_to_date'];

                if (algoliaConfig.now > priceExpiration + 1) {
                    hit['price'][algoliaConfig.currencyCode]['default_formated'] = hit['price'][algoliaConfig.currencyCode]['default_original_formated'];
                    hit['price'][algoliaConfig.currencyCode]['default_original_formated'] = false;
                }
            }
        }

        // Add to cart parameters
        const action = algoliaConfig.instant.addToCartParams.action + 'product/' + hit.objectID + '/';

        const correctFKey = hyva.getCookie('form_key');

        if (
            correctFKey != '' &&
            algoliaConfig.instant.addToCartParams.formKey != correctFKey
        ) {
            algoliaConfig.instant.addToCartParams.formKey = correctFKey;
        }

        hit.addToCart = {
            action: action,
            uenc: window.AlgoliaBase64.mageEncode(action),
            formKey: algoliaConfig.instant.addToCartParams.formKey,
        };

        if (hit.__autocomplete_queryID) {

            hit.urlForInsights = hit.url;

            if (algoliaConfig.ccAnalytics.enabled &&
                algoliaConfig.ccAnalytics.conversionAnalyticsMode !== 'disabled') {
                const insightsDataUrlString = mapsUrl({
                    queryID: hit.__autocomplete_queryID,
                    objectID: hit.objectID,
                    indexName: hit.__autocomplete_indexName,
                });
                if (hit.url.indexOf('?') > -1) {
                    hit.urlForInsights += '&' + insightsDataUrlString;
                } else {
                    hit.urlForInsights += '?' + insightsDataUrlString;
                }
            }
        }

        return hit;
    }

    function filterMinChars(query, result) {
        return query.length >= MIN_SEARCH_LENGTH_CHARS ? result : [];
    }

    /**
     * Tells Autocomplete to “wait” for a set time after typing stops before returning results
     * See https://www.algolia.com/doc/ui-libraries/autocomplete/guides/debouncing-sources/#select-a-debounce-delay
     * @param fn Function to debounce
     * @param time Delay in ms before function executes
     * @returns
     */
    function debounce(fn, time) {
        let timerId = undefined;

        return (...args) => {
            if (timerId) {
                clearTimeout(timerId);
            }

            return new Promise((resolve) => {
                timerId = setTimeout(() => resolve(fn(...args)), time);
            });
        };
    }

    function getNavigatorUrl(url) {
        if (algoliaConfig.autocomplete.isNavigatorEnabled) {
            return url;
        }
    }

    function buildSuggestionsPlugin(searchClient) {
        return createQuerySuggestionsPlugin(
            {
                searchClient,
                indexName: `${algoliaConfig.indexName}_suggestions`,
                getSearchParams() {
                    return {
                        hitsPerPage: algoliaConfig.autocomplete.nbOfQueriesSuggestions,
                        clickAnalytics: true,
                    };
                },
                transformSource: ({source}) => {
                    return {
                        ...source,
                        getItems: ({query}) => {
                            const items = filterMinChars(query, source.getItems());
                            const oldTransform = items.transformResponse;
                            items.transformResponse = (arg) => {
                                const hits = oldTransform ? oldTransform(arg) : arg.hits;
                                return hits.map((hit, i) => {
                                    return {
                                        ...hit,
                                        position: i + 1,
                                    };
                                });
                            };
                            return items;
                        },
                        getItemUrl: ({item}) => {
                            return getNavigatorUrl(
                                algoliaConfig.resultPageUrl + `?q=${item.query}`
                            );
                        },
                        templates: {
                            noResults({html}) {
                                return suggestionsHtml.getNoResultHtml({html});
                            },
                            header({html, items}) {
                                return suggestionsHtml.getHeaderHtml({html, items});
                            },
                            item({item, components, html}) {
                                return suggestionsHtml.getItemHtml({item, components, html});
                            },
                            footer({html, items}) {
                                return suggestionsHtml.getFooterHtml({html, items});
                            },
                        },
                    };
                },
            }
        );
    }

    /**
     * Autocomplete insight click conversion
     */
    /*function trackClicks() {
        // TODO: Switch to insights plugin
        if (algoliaConfig.ccAnalytics.enabled) {
            $(document).on('click', '.algoliasearch-autocomplete-hit', function () {
                const $this = $(this);
                if ($this.data('clicked')) return;

                const objectId = $this.attr('data-objectId');
                const indexName = $this.attr('data-index');
                const queryId = $this.attr('data-queryId');
                const position = $this.attr('data-position');

                let useCookie = algoliaConfig.cookieConfiguration
                    .cookieRestrictionModeEnabled
                    ? !!algoliaCommon.getCookie(algoliaConfig.cookieConfiguration.consentCookieName)
                    : true;
                if (useCookie !== false) {
                    algoliaInsights.initializeAnalytics();
                    const eventData = algoliaInsights.buildEventData(
                        'Clicked',
                        objectId,
                        indexName,
                        position,
                        queryId
                    );
                    algoliaInsights.trackClick(eventData);
                    $this.attr('data-clicked', true);
                }
            });
        }
    }*/

    function handleAutocompleteStateChange(autocompleteState) {
        // console.log('The Autocomplete state has changed:', autocompleteState);
        if (!state.hasRendered && autocompleteState.isOpen) {
            addPanelObserver();
            state.hasRendered = true;
        }
    }

    function addPanelObserver() {
        const observer = new MutationObserver((mutationsList, observer) => {
            for (let mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE && node.classList.contains('aa-PanelLayout')) {
                            addFooter();
                            handleSuggestionsLayout();
                            //We only care about the first occurrence
                            observer.disconnect();
                        }
                    });
                }
            }
        });

        observer.observe(document.body, {childList: true, subtree: true});
    }

    function addFooter() {
        if (!algoliaConfig.removeBranding) {
            const algoliaFooter = `<div id="algoliaFooter" class="footer_algolia"><span class="algolia-search-by-label">${algoliaConfig.translations.searchBy}</span><a href="https://www.algolia.com/?utm_source=magento&utm_medium=link&utm_campaign=magento_autocompletion_menu" title="${algoliaConfig.translations.searchBy} Algolia" target="_blank"><img src="${algoliaConfig.urls.logo}" alt="${algoliaConfig.translations.searchBy} Algolia" /></a></div>`;
        }
        if (algoliaFooter && document.getElementById('algoliaFooter')) {
            document.querySelector('.aa-PanelLayout').append(algoliaFooter);
        }
    }

    function handleSuggestionsLayout() {
        if (state.hasSuggestionSection) {
            document.querySelector('.aa-Panel')?.classList.add('productColumn2');
            document.querySelector('.aa-Panel')?.classList.remove('productColumn1');
        } else {
            document.querySelector('.aa-Panel').classList.remove('productColumn2');
            document.querySelector('.aa-Panel').classList.add('productColumn1');
        }
    }

    function addKeyboardNavigation() {
        if (algoliaConfig.autocomplete.isNavigatorEnabled) {
            document.body.append('<style>.aa-Item[aria-selected="true"]{background-color: #f2f2f2;}</style>');

        }
    }

    // Initialize the Algolia Autocomplete
    initialize();

}
