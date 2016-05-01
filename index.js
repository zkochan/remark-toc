/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:toc
 * @fileoverview Generate a Table of Contents (TOC) for Markdown files.
 */

'use strict';

/* eslint-env commonjs */

/*
 * Dependencies.
 */

var slug = require('remark-slug');

/*
 * Constants.
 */

var HEADING = 'heading';
var LIST = 'list';
var LIST_ITEM = 'listItem';
var PARAGRAPH = 'paragraph';
var LINK = 'link';
var TEXT = 'text';
var DEFAULT_HEADING = 'toc|table[ -]of[ -]contents?';

/**
 * Transform a string into an applicable expression.
 *
 * @param {string} value - Content to expressionise.
 * @return {RegExp} - Expression from `value`.
 */
function toExpression(value) {
    return new RegExp('^(' + value + ')$', 'i');
}

/**
 * Check if `node` is the main heading.
 *
 * @param {Node} node - Node to check.
 * @param {number} depth - Depth to check.
 * @param {RegExp} expression - Expression to check.
 * @return {boolean} - Whether `node` is a main heading.
 */
function isOpeningHeading(node, depth, expression) {
    return depth === null && node && node.type === HEADING &&
        expression.test(toString(node));
}

/**
 * Check if `node` is the next heading.
 *
 * @param {Node} node - Node to check.
 * @param {number} depth - Depth of opening heading.
 * @return {boolean} - Whether znode is a closing heading.
 */
function isClosingHeading(node, depth) {
    return node && (depth && node.type === HEADING && node.depth <= depth ||
      node.type === 'markdownScript');
}

/**
 * Search a node for a location.
 *
 * @param {Node} root - Parent to search in.
 * @param {RegExp} expression - Heading-content to search
 *   for.
 * @param {number} maxDepth - Maximum-depth to include.
 * @return {Object} - Results.
 */
function search(root, expression, maxDepth) {
    var index = -1;
    var length = root.children.length;
    var depth = null;
    var lookingForToc = true;
    var map = [];
    var child;
    var headingIndex;
    var closingIndex;
    var value;

    while (++index < length) {
        child = root.children[index];

        if ([HEADING, 'markdownScript'].indexOf(child.type) === -1) {
            continue;
        }

        if (headingIndex && isClosingHeading(child, depth)) {
            closingIndex = index;
            searchChildren(root.children.slice(index))
            break
        }

        if (isOpeningHeading(child, depth, expression)) {
            headingIndex = index + 1;
            depth = child.depth;
        }
    }

    function searchChildren (children) {
      if (!children || !children.length) return

      var child = children.shift();

      if ([HEADING, 'markdownScript'].indexOf(child.type) === -1) {
          return searchChildren(children)
      }

      if (child.type === 'markdownScript') {
        return searchChildren(child.children.concat(children))
      }

      var value = toString(child);

      if (value && child.depth <= maxDepth) {
          map.push({
              'depth': child.depth,
              'value': value,
              'id': child.data.htmlAttributes.id
          });
      }

      return searchChildren(children)
    }

    if (headingIndex) {
        if (!closingIndex) {
            closingIndex = length + 1;
        }

        /*
         * Remove current TOC.
         */
        root.children.splice(headingIndex, closingIndex - headingIndex);
    }

    return {
        'index': headingIndex || null,
        'map': map
    };
}

/**
 * Create a list.
 *
 * @return {Object} - List node.
 */
function list() {
    return {
        'type': LIST,
        'ordered': false,
        'children': []
    };
}

/**
 * Create a list item.
 *
 * @return {Object} - List-item node.
 */
function listItem() {
    return {
        'type': LIST_ITEM,
        'loose': false,
        'children': []
    };
}

/**
 * Insert a `node` into a `parent`.
 *
 * @param {Object} node - `node` to insert.
 * @param {Object} parent - Parent of `node`.
 * @param {boolean?} [tight] - Prefer tight list-items.
 */
function insert(node, parent, tight) {
    var children = parent.children;
    var length = children.length;
    var last = children[length - 1];
    var isLoose = false;
    var index;
    var item;

    if (node.depth === 1) {
        item = listItem();

        item.children.push({
            'type': PARAGRAPH,
            'children': [
                {
                    'type': LINK,
                    'title': null,
                    'url': '#' + node.id,
                    'children': [
                        {
                            'type': TEXT,
                            'value': node.value
                        }
                    ]
                }
            ]
        });

        children.push(item);
    } else if (last && last.type === LIST_ITEM) {
        insert(node, last, tight);
    } else if (last && last.type === LIST) {
        node.depth--;

        insert(node, last);
    } else if (parent.type === LIST) {
        item = listItem();

        insert(node, item);

        children.push(item);
    } else {
        item = list();
        node.depth--;

        insert(node, item);

        children.push(item);
    }

    /*
     * Properly style list-items with new lines.
     */

    if (parent.type === LIST_ITEM) {
        parent.loose = tight ? false : children.length > 1;
    } else {
        if (tight) {
            isLoose = false;
        } else {
            index = -1;

            while (++index < length) {
                if (children[index].loose) {
                    isLoose = true;

                    break;
                }
            }
        }

        index = -1;

        while (++index < length) {
            children[index].loose = false // isLoose;
        }
    }
}

/**
 * Transform a list of heading objects to a markdown list.
 *
 * @param {Array.<Object>} map - Heading-map to insert.
 * @param {boolean?} [tight] - Prefer tight list-items.
 * @return {Object} - List node.
 */
function contents(map, tight) {
    var minDepth = Infinity;
    var index = -1;
    var length = map.length;
    var table;

    /*
     * Find minimum depth.
     */

    while (++index < length) {
        if (map[index].depth < minDepth) {
            minDepth = map[index].depth;
        }
    }

    /*
     * Normalize depth.
     */

    index = -1;

    while (++index < length) {
        map[index].depth -= minDepth - 1;
    }

    /*
     * Construct the main list.
     */

    table = list();

    /*
     * Add TOC to list.
     */

    index = -1;

    while (++index < length) {
        insert(map[index], table, tight);
    }

    return table;
}

/**
 * Attacher.
 *
 * @param {Remark} remark - Processor.
 * @param {Object} options - Configuration.
 * @return {function(node)} - Transformmer.
 */
function attacher(remark, options) {
    var settings = options || {};
    var heading = toExpression(settings.heading || DEFAULT_HEADING);
    var depth = settings.maxDepth || 6;
    var tight = settings.tight;

    remark.use(slug, settings.slug);

    /**
     * Adds an example section based on a valid example
     * JavaScript document to a `Usage` section.
     *
     * @param {Node} node - Root to search in.
     */
    function transformer(node) {
        var result = search(node, heading, depth);

        if (result.index === null || !result.map.length) {
            return;
        }

        /*
         * Add markdown.
         */

        node.children = [].concat(
            node.children.slice(0, result.index),
            contents(result.map, tight),
            node.children.slice(result.index)
        );
    }

    return transformer;
}

/*
 * Expose.
 */

module.exports = attacher;

function valueOf(node) {
    return node && node.value || '';
}

function toString(node) {
    return (valueOf(node) ||
        (node.children && node.children.map(toString).join('')) ||
        '').trim();
}
