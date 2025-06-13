<?php
/**
 * LookingSimilarItems
 *
 * @copyright Copyright © 2025 Blackbird. All rights reserved.
 * @author    emilie (Blackbird Team)
 */
declare(strict_types=1);


namespace Blackbird\HyvaAlgoliaSearch\Block\Widget;


use Algolia\AlgoliaSearch\Block\Widget\LookingSimilar as LookingSimilarOrig;

class LookingSimilar extends LookingSimilarOrig
{
    protected $_template = 'Blackbird_HyvaAlgoliaSearch::recommend/widget/looking-similar.phtml';
}
