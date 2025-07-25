<?php

namespace Blackbird\HyvaAlgoliaSearch\Plugin\Algolia;

use Algolia\AlgoliaSearch\Observer\AddAlgoliaAssetsObserver;
use Hyva\Theme\Service\CurrentTheme;
use Magento\Framework\View\Layout;

class AddAlgoliaAssetsObserverPlugin
{
    /**
     * @var CurrentTheme
     */
    private $currentTheme;

    /**
     * @param CurrentTheme $currentTheme
     */
    public function __construct(
        CurrentTheme $currentTheme
    ) {
        $this->currentTheme = $currentTheme;
    }

    /**
     * @param \Algolia\AlgoliaSearch\Observer\AddAlgoliaAssetsObserver $subject
     * @param $result
     * @return void
     */
    public function afterExecute(
        AddAlgoliaAssetsObserver $subject,
        $result,
        $observer
    ): void {
        if ($this->currentTheme->isHyva()) {
            $layout = $observer->getData('layout');

            if ($layout instanceof Layout &&
                in_array('algolia_search_handle_prevent_backend_rendering', $layout->getUpdate()->getHandles())) {
                $layout->getUpdate()->removeHandle('algolia_search_handle_prevent_backend_rendering');
                $layout->getUpdate()->addHandle('hyva_algolia_search_handle_prevent_backend_rendering');
            }
        }
    }
}
