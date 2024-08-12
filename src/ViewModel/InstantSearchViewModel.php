<?php
/**
 * Form
 *
 * @copyright Copyright © 2023 Blackbird. All rights reserved.
 * @author    emilie (Blackbird Team)
 */
declare(strict_types=1);


namespace Blackbird\HyvaAlgoliaSearch\ViewModel;

use Algolia\AlgoliaSearch\Block\Configuration;
use Magento\Framework\Serialize\Serializer\Json;
use Magento\Framework\View\Asset\Repository as AssetRepository;
use Magento\Framework\View\Element\Block\ArgumentInterface;

class InstantSearchViewModel implements ArgumentInterface
{
    /**
     * @param \Magento\Framework\View\Asset\Repository $assetRepository
     * @param \Algolia\AlgoliaSearch\Block\Configuration $configuration
     * @param \Magento\Framework\Serialize\Serializer\Json $json
     */
    public function __construct(
        protected AssetRepository $assetRepository,
        protected Configuration $configuration,
        protected Json $json
    ) {
    }

    /**
     * @param string $asset
     * @return string
     */
    public function getAssetUrl(string $asset): string
    {
        return $this->assetRepository->getUrl($asset);
    }

    /**
     * @return array
     */
    public function getJsConfigData(): array
    {
        return $this->getAlgoliaConfiguration();
    }

    /**
     * @return string
     */
    public function getJsConfig(): string
    {
        $result = $this->json->serialize($this->getJsConfigData());

        return is_string($result) ? $result : '';
    }

    /**
     * @return array
     */
    public function getInstantsearchScripts(): array
    {
        return
            array_merge(
                $this->getAlgoliaScripts(),
                [
                    $this->getAssetUrl('Blackbird_HyvaAlgoliaSearch::js/internals/hogan.min.js'),
                    $this->getAssetUrl('Blackbird_HyvaAlgoliaSearch::js/instantsearch.js'),
                    $this->getAssetUrl('Blackbird_HyvaAlgoliaSearch::js/internals/algoliasearch-lite.js')
                ]
            );
    }

    /**
     * @return array
     */
    public function getAlgoliaScripts(): array
    {
        return [
            $this->getAssetUrl('Blackbird_HyvaAlgoliaSearch::js/common.js'),
            $this->getAssetUrl('Blackbird_HyvaAlgoliaSearch::js/internals/instantsearch.production.min.js'),
            $this->getAssetUrl('Blackbird_HyvaAlgoliaSearch::js/internals/search-insights.min.js'),
        ];
    }

    /**
     * @return array
     */
    protected function getAlgoliaConfiguration(): array
    {
        return (array)$this->configuration->getConfiguration();
    }

    /**
     * @return array
     */
    public function getRecommendedScripts(): array
    {
        return
            array_merge(
                $this->getAlgoliaScripts(),
                [
                    $this->getAssetUrl('Blackbird_HyvaAlgoliaSearch::js/internals/recommend.min.js'),
                    $this->getAssetUrl('Blackbird_HyvaAlgoliaSearch::js/internals/recommend-js.min.js'),
                    $this->getAssetUrl('Blackbird_HyvaAlgoliaSearch::js/recommend.js'),
                    $this->getAssetUrl('Blackbird_HyvaAlgoliaSearch::js/internals/templates/recommend/products.js')
                ]
            );
    }

    /**
     * @return array
     */
    public function getRecommendedTrendsScripts(): array
    {
        return
            array_merge(
                $this->getAlgoliaScripts(),
                [
                    $this->getAssetUrl('Blackbird_HyvaAlgoliaSearch::js/internals/recommend.min.js'),
                    $this->getAssetUrl('Blackbird_HyvaAlgoliaSearch::js/internals/recommend-js.min.js'),
                    $this->getAssetUrl('Blackbird_HyvaAlgoliaSearch::js/recommend-trends.js'),
                    $this->getAssetUrl('Blackbird_HyvaAlgoliaSearch::js/internals/templates/recommend/products.js')
                ]
            );
    }


    /**
     * @return array
     */
    public function getAutocompleteScripts(): array
    {
        return
            array_merge(
                $this->getAlgoliaScripts(),
                [
                    $this->getAssetUrl('Blackbird_HyvaAlgoliaSearch::js/internals/algoliasearch-lite.js'),
                    $this->getAssetUrl('Blackbird_HyvaAlgoliaSearch::js/internals/autocomplete.production.min.js'),
                    $this->getAssetUrl('Blackbird_HyvaAlgoliaSearch::js/internals/autocomplete-plugin-query-suggestions.production.min.js'),
                    $this->getAssetUrl('Blackbird_HyvaAlgoliaSearch::js/autocomplete.js')
                ],
                $this->getAutocompleteTemplateScripts()
            );
    }

    /**
     * @return array
     */
    public function getAutocompleteTemplateScripts(): array
    {
        return [
            $this->getAssetUrl('Blackbird_HyvaAlgoliaSearch::js/internals/templates/autocomplete/additional-section.js'),
            $this->getAssetUrl('Blackbird_HyvaAlgoliaSearch::js/internals/templates/autocomplete/categories.js'),
            $this->getAssetUrl('Blackbird_HyvaAlgoliaSearch::js/internals/templates/autocomplete/pages.js'),
            $this->getAssetUrl('Blackbird_HyvaAlgoliaSearch::js/internals/templates/autocomplete/products.js'),
            $this->getAssetUrl('Blackbird_HyvaAlgoliaSearch::js/internals/templates/autocomplete/suggestions.js')
        ];
    }
}
