/*!
 * jQuery Sku Plugin v0.1.0
 *
 * Copyright 2015
 *
 * @author Pangxin
 * @mail   pangxin001@163.com
 *
 * $('.sku').sku({
 *     skuMap: skuMap
 * });
 *
 */
;(function($) {
    $.fn.sku = function(options) {
        var opts = $.extend({}, $.fn.sku.defaults, options);
        opts.skuMap = normalizeSkuMap(opts.skuMap);
        opts.serializedSkuMap = serializeSkuMap(opts.skuMap, opts.stockKey);
        opts.keys = getKeys(opts.skuMap);
        opts.length = getLength(opts.skuMap);
        return this.each(function(){
            var $this = $(this);
            var lastSelectedLength = 0;
            var PROPS = {};
            var PARTICLES = $this.find(opts.skuItem);
            PARTICLES.each(function(){
                var skuItem = $(this);
                var prop = skuItem.attr(opts.attrName).split(':')[0];
                if (!(prop in PROPS)) {
                    PROPS[prop] = null;
                }
                skuItem.click(function(){
                    var item = $(this);
                    if (item.hasClass(opts.disabledClass)) {
                        return;
                    }
                    var prop = item.attr(opts.attrName).split(':')[0];
                    if (!item.hasClass(opts.selectedClass)) {
                        PROPS[prop] = item;
                    } else {
                        PROPS[prop] = null;
                    }
                    item.toggleClass(opts.selectedClass).siblings().removeClass(opts.selectedClass);
                    var selectedPtcl = selectedParticles(PROPS),
                        selectedLength = selectedPtcl.length,
                        selectedIds = [];
                    if (!selectedLength) {
                        PARTICLES.each(function () {
                            opts.serializedSkuMap[$(this).attr(opts.attrName)] ?
                            $(this).removeClass(opts.disabledClass) : $(this).addClass(opts.disabledClass).removeClass(opts.selectedClass);
                        })
                    } else {
                        $(selectedPtcl).each(function () {
                            selectedIds.push($(this).attr(opts.attrName));
                        });
                        selectedIds = sortKeys(selectedIds);
                        var len = selectedIds.length;
                        PARTICLES.each(function () {
                            var el = $(this);
                            if ($.inArray(el[0], selectedPtcl) > -1 || el[0] === item[0]) {
                                return;
                            }
                            var siblingsSelectedObj = el.siblings('.' + opts.selectedClass),
                                testAttrIds = [];

                            if (siblingsSelectedObj.length) {
                                var siblingsSelectedObjId = siblingsSelectedObj.attr(opts.attrName);
                                for (var i = 0; i < len; i++) {
                                    (selectedIds[i] != siblingsSelectedObjId) && testAttrIds.push(selectedIds[i]);
                                }
                            } else {
                                testAttrIds = selectedIds.concat();
                            }

                            testAttrIds = testAttrIds.concat(el.attr(opts.attrName));
                            testAttrIds = sortKeys(testAttrIds);

                            if (!opts.serializedSkuMap[testAttrIds.join(';')]) {
                                el.addClass(opts.disabledClass).removeClass(opts.selectedClass);
                            } else {
                                el.removeClass(opts.disabledClass);
                            }
                        });
                    }
                    var selectedLength = selectedIds.length;
                    if (selectedLength === opts.length) {
                        var sku = opts.skuMap[selectedIds.join(';')];
                        if(lastSelectedLength === opts.length) {
                            if(typeof opts.skuChanged == 'function') {
                                opts.skuChanged(sku);
                            }
                        } else {
                            if(typeof opts.skuFound == 'function') {
                                opts.skuFound(sku);
                            }
                        }
                        $this.data('currentSku', sku);
                    } else {
                        $this.data('currentSku', null);
                        if(typeof opts.skuLost == 'function') {
                            opts.skuLost();
                        }
                    }
                    if(typeof opts.selectionChanged == 'function') {
                        opts.selectionChanged(selectedIds, selectedPtcl);
                    }
                    lastSelectedLength = selectedLength;
                });
                if(opts.default_sku) {
                    var newKey = key.replace(/^;|;$/gi, '');
                    var pieces = newKey.split(';');
                    PARTICLES.each(function(){
                        var prop = skuItem.attr(opts.attrName);
                        if($.inArray(prop, pieces) > -1){
                            $(this).trigger('click');
                        }
                    });
                }
            });
        });
    };

    function selectedParticles(props) {
        var ret = [];
        for (var p in  props) {
            if (props[p]) {
                ret.push(props[p][0]);
            }
        }
        return ret;
    }

    function getLength(skuMap) {
        for (var k in skuMap) {
            return k.split(';').length;
        }
    }

    function getKeys(skuMap) {
        var keys = [];
        for (var key in skuMap) {
            keys.push(key);
        }
        return keys;
    }

    function normalizeSkuMap(skuMap){
        var newSkuMap = {},
            key, newKey, pieces;
        for (key in skuMap) {
            newKey = key.replace(/^;|;$/gi, '');

            pieces = newKey.split(';');
            pieces.sort(function (a, b) {
                return parseInt(a.split(':')[0], 10) > parseInt(b.split(':')[0], 10)
            });

            newKey = pieces.join(';');
            newSkuMap[newKey] = skuMap[key];
        }
        return newSkuMap;
    }

    function serializeSkuMap(skuMap, stockKey) {
        var serializedSkuMap = {};
        for (key in skuMap) {
            var sku = skuMap[key];
            var skuKeyAttrs = key.split(";");
            if (!parseInt(sku[stockKey], 10)) {
                continue;
            }
            var combs = combinations(skuKeyAttrs);
            $(combs).each(function(i, comb){
                var tempKey = sortKeys(comb).join(';');
                putResult(tempKey, sku, serializedSkuMap, stockKey);
            });
            serializedSkuMap[key] = {
                stock:  sku[stockKey]
            };
        }
        return serializedSkuMap;
    }

    function sortKeys(keys) {
        var holder = {},
            i, key, newKey;

        for (i = 0; i < keys.length; i++) {
            key = keys[i];
            newKey = key.replace(';');
            holder[newKey] = key;
            keys[i] = newKey;
        }

        keys.sort(function (a, b) {
            return parseInt(a) - parseInt(b);
        });

        for (i = 0; i < keys.length; i++) {
            keys[i] = holder[keys[i]];
        }

        return keys;

    }

    function putResult(key, sku, serializedSkuMap, stockKey) {
        if (serializedSkuMap[key]) {
            serializedSkuMap[key].stock += parseInt(sku[stockKey]);
        } else {
            serializedSkuMap[key] = {
                stock:  parseInt(sku[stockKey])
            };
        }
    }

    function combinations(set) {
        var self = this;
        var k, i, combs, k_combs;
        combs = [];
        // Calculate all non-empty k-combinations
        for (k = 1; k <= set.length; k++) {
            k_combs = k_combinations(set, k);
            for (i = 0; i < k_combs.length; i++) {
                combs.push(k_combs[i]);
            }
        }
        return combs;
    }

    function k_combinations(set, k) {
        var self = this;
        var i, j, combs, head, tailcombs;

        if (k > set.length || k <= 0) {
            return [];
        }

        if (k == set.length) {
            return [set];
        }

        if (k == 1) {
            combs = [];
            for (i = 0; i < set.length; i++) {
                combs.push([set[i]]);
            }
            return combs;
        }

        // Assert {1 < k < set.length}

        combs = [];
        for (i = 0; i < set.length - k + 1; i++) {
            head = set.slice(i, i + 1);
            tailcombs = k_combinations(set.slice(i + 1), k - 1);
            for (j = 0; j < tailcombs.length; j++) {
                combs.push(head.concat(tailcombs[j]));
            }
        }
        return combs;
    }

    $.fn.sku.defaults = {
        skuItem: '.sku-item',
        selectedClass: 'selected',
        disabledClass: 'disabled',
        attrName:      'data-value',
        stockKey:      'stock',
        default_sku:    undefined,
        skuChanged:function(sku) {

        },
        skuFound:function(sku){

        },
        skuLost:function() {

        },
        selectionChanged:function(selectedIds, selectedObjs){

        }
    };
})(jQuery);
